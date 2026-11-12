// VIVIM BF01/H08 — Studio-only bootstrap dispatch bridge.
// This module NEVER connects to CDP, launches Chrome, creates an approval, or retries a send.
// Studio's existing conversation runtime remains the exclusive browser-effect and send-journal owner.
// Local correlation files contain only request/turn/thread metadata, never prompts or replies.
import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync, openSync, closeSync, fsyncSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const BOOTSTRAP_OWNER_ADAPTER_SCHEMA = 'vivim.bootstrap-owner-adapter/1';
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/;
const CHATGPT_THREAD = /^chatgpt-c:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA = /^[0-9a-f]{64}$/;
const MAX_PROMPT_BYTES = 12000;
const codeError = (code, message = code) => Object.assign(new Error(message), { code });
const sha = text => createHash('sha256').update(text, 'utf8').digest('hex');
const valid = (text, label) => { if (typeof text !== 'string' || !ID.test(text)) throw codeError('BOOTSTRAP_INVALID_PACKET', `${label} invalid`); return text; };
const clone = x => structuredClone(x);
const safeReason = x => String(x || 'UNKNOWN').replace(/[^A-Z0-9_]/gi, '_').slice(0, 80);
function checkPacket(packet) {
  if (!packet || packet.schema !== 'vivim.bootstrap-dispatch/1' || packet.provider !== 'chatgpt' || packet.thread !== 'new') throw codeError('BOOTSTRAP_INVALID_PACKET');
  for (const f of ['worldId','generationId','requestId','pass','authorizationRef']) valid(packet[f],f);
  if (!['F02','F01','D03','D04','D05','D06','D07'].includes(packet.pass)) throw codeError('BOOTSTRAP_INVALID_PASS');
  if (typeof packet.prompt !== 'string' || !packet.prompt.trim() || Buffer.byteLength(packet.prompt,'utf8') > MAX_PROMPT_BYTES) throw codeError('BOOTSTRAP_INVALID_PROMPT');
  if (!SHA.test(packet.promptDigest) || sha(packet.prompt) !== packet.promptDigest) throw codeError('BOOTSTRAP_DIGEST_MISMATCH');
  return packet;
}
function validateApproval(a, p, now) {
  if (!a || a.ownerApproved !== true || a.scope !== 'full-bootstrap' || a.source !== 'owner'
      || a.approvalRef !== p.authorizationRef || a.worldId !== p.worldId || a.generationId !== p.generationId
      || a.requestId !== p.requestId || a.pass !== p.pass || a.provider !== p.provider
      || a.promptDigest !== p.promptDigest || !Number.isFinite(Date.parse(a.expiresAt))
      || Date.parse(a.expiresAt) <= now()) throw codeError('BOOTSTRAP_APPROVAL_INVALID');
}

// Studio-local, metadata-only index, with exclusive creation for request IDs.
// The record is NOT a substitute for Studio's thread-turn send journal.
export function createBootstrapBindingStore({ dir } = {}) {
  if (typeof dir !== 'string' || !path.isAbsolute(dir)) throw codeError('BOOTSTRAP_BINDING_DIR','Absolute Studio-local directory required');
  const file = id => { valid(id,'requestId'); return path.join(dir, `${id}.json`); };
  function read(id) {
    try {
      const v = JSON.parse(readFileSync(file(id),'utf8'));
      if (v?.schema !== BOOTSTRAP_OWNER_ADAPTER_SCHEMA || v.requestId !== id) throw codeError('BOOTSTRAP_BINDING_CORRUPT');
      return v;
    } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
  }
  function write(id, record, exclusive) {
    mkdirSync(dir,{recursive:true,mode:0o700});
    const target=file(id), data=JSON.stringify(record)+'\n';
    if (exclusive) {
      let fd;
      try { fd=openSync(target,'wx',0o600);writeFileSync(fd,data);fsyncSync(fd);return true; }
      catch(e){if(e.code==='EEXIST')return false;throw e;}
      finally{if(fd!==undefined)closeSync(fd);}
    }
    const temp=`${target}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`;
    let fd;
    try { fd=openSync(temp,'wx',0o600);writeFileSync(fd,data);fsyncSync(fd);closeSync(fd);fd=undefined;renameSync(temp,target); }
    finally {if(fd!==undefined)closeSync(fd);try{unlinkSync(temp);}catch(e){if(e.code!=='ENOENT')throw e;}}
    return true;
  }
  return {read, reserve: record => write(record.requestId,record,true), update: record => {
    if (!read(record.requestId)) throw codeError('BOOTSTRAP_BINDING_MISSING');
    return write(record.requestId,record,false);
  }};
}

// Canonical in-process route: no new HTTP listener and no independent browser session.
export function studioConversationPort(runtime) {
  if (typeof runtime?.connect !== 'function' || typeof runtime?.submit !== 'function' || typeof runtime?.get !== 'function')
    throw codeError('BOOTSTRAP_STUDIO_RUNTIME_REQUIRED');
  return {
    create: () => runtime.connect({site:'chatgpt',freshTab:true}),
    submit: (id, body) => runtime.submit(id,body),
    get: id => runtime.get(id)
  };
}

// `conversation` must be a privileged, in-process wrapper around the existing Studio runtime:
//   create({site:'chatgpt'}) -> conversation snapshot     [POST /conversations/create]
//   submit(id,{key,prompt,confirm,expectedRevision}) -> snapshot [POST /.../turns]
//   get(id) -> conversation snapshot                       [GET /conversations/:id]
// It must not use the relay or an independently attached CDP client.
export function createStudioBootstrapOwnerAdapter({conversation, store, verifyOwner, verifyApproval, now=Date.now}={}) {
  if (!conversation?.create || !conversation?.submit || !conversation?.get || !store?.read || !store?.reserve || !store?.update
      || typeof verifyOwner!=='function' || typeof verifyApproval!=='function') throw codeError('BOOTSTRAP_ADAPTER_DEPENDENCY');
  let busy=false;
  const at=()=>new Date(now()).toISOString();
  function receipt(record,state,extra={}) {
    return {requestId:record.requestId,provider:'chatgpt',state,...extra};
  }
  function inspectSnapshot(record,snapshot) {
    if (!snapshot || snapshot.id!==record.conversationId || snapshot.site!=='chatgpt') return receipt(record,'uncertain');
    if (snapshot.binding?.targetId !== record.targetId || !record.targetId) return receipt(record,'uncertain');
    const matching=(snapshot.turns||[]).filter(t=>t.key===record.turnKey);
    if (matching.length>1) return receipt(record,'uncertain');
    const t=matching[0];
    if (t?.reply?.verified===true && t.reply.settled===true && typeof t.reply.text==='string' && t.reply.text.trim()
        && Buffer.byteLength(t.reply.text,'utf8')<=120000 && snapshot.identity?.state==='bound'
        && CHATGPT_THREAD.test(snapshot.binding?.thread?.ref||'')
        && ['observed','sent'].includes(t.send?.state)) {
      return receipt(record,'complete',{journalState:'observed',submitted:'yes',threadRef:snapshot.binding.thread.ref,reply:t.reply.text});
    }
    if (t?.phase==='blocked' && t.send?.state==='not-attempted') return receipt(record,'blocked',{
      journalState:'blocked',submitted:'no',reason:safeReason(t.reason||snapshot.readiness?.reason)});
    if (['uncertain','needs-reconciliation'].includes(t?.phase) || t?.send?.state==='uncertain' || snapshot.state==='needs-reconciliation')
      return receipt(record,'uncertain');
    if (record.phase==='bound' || record.phase==='attempting' || record.phase==='awaiting') return receipt(record,'pending');
    return receipt(record,'uncertain');
  }
  async function inspect(requestId) {
    valid(requestId,'requestId');
    const record=store.read(requestId);
    if (!record) return {requestId,state:'not_found'}; // not_found is NEVER proof of no send
    if (!record.conversationId) return receipt(record,'uncertain');
    if (record.phase === 'blocked' && record.blockReason)
      return receipt(record,'blocked',{journalState:'blocked',submitted:'no',reason:record.blockReason});
    try { return inspectSnapshot(record,await conversation.get(record.conversationId)); }
    catch { return receipt(record,'uncertain'); }
  }
  async function dispatch(packet) {
    checkPacket(packet);
    if (busy) throw codeError('BOOTSTRAP_OWNER_BUSY');
    busy=true;
    try {
      // This check is side-effect free. No startup, attach, owner takeover or fallback.
      if (await verifyOwner() !== true) throw codeError('BOOTSTRAP_OWNER_UNVERIFIED');
      const approval=await verifyApproval({worldId:packet.worldId,generationId:packet.generationId,pass:packet.pass,
        requestId:packet.requestId,promptDigest:packet.promptDigest,provider:packet.provider,authorizationRef:packet.authorizationRef});
      validateApproval(approval,packet,now);
      const record={schema:BOOTSTRAP_OWNER_ADAPTER_SCHEMA,requestId:packet.requestId,worldId:packet.worldId,
        generationId:packet.generationId,pass:packet.pass,provider:'chatgpt',promptDigest:packet.promptDigest,
        approvalRef:packet.authorizationRef,turnKey:`bootstrap-${packet.requestId}`,
        phase:'reserved',conversationId:null,targetId:null,createdAt:at(),updatedAt:at()};
      if (!store.reserve(record)) return inspect(packet.requestId); // NEVER send twice.
      // A crash during create leaves a reserved entry and must be reconciled by a human.
      let created;
      try {created=await conversation.create({site:'chatgpt'});}
      catch {return receipt(record,'uncertain');}
      if (typeof created?.id!=='string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(created.id)
          || !Number.isSafeInteger(created.revision) || !created.binding?.targetId)
        return receipt(record,'uncertain');
      record.conversationId=created.id;record.targetId=created.binding.targetId;record.phase='bound';record.updatedAt=at();
      store.update(record);
      if (created.state==='blocked') {
        record.phase='blocked';record.blockReason=safeReason(created.readiness?.reason||'STUDIO_BLOCKED');
        record.updatedAt=at();store.update(record);
        return receipt(record,'blocked',{journalState:'blocked',submitted:'no',reason:record.blockReason});
      }
      if (created.state!=='ready') return receipt(record,'uncertain');
      // Write-ahead marker precedes the *only* Studio submit. A failed response does not authorize retry.
      record.phase='attempting';record.updatedAt=at();store.update(record);
      try { await conversation.submit(created.id,{key:record.turnKey,prompt:packet.prompt,confirm:true,expectedRevision:created.revision}); }
      catch { /* GET may reconcile; never call submit again */ }
      record.phase='awaiting';record.updatedAt=at();store.update(record);
      return inspect(packet.requestId);
    } finally {busy=false;}
  }
  return {schema:BOOTSTRAP_OWNER_ADAPTER_SCHEMA,dispatch,inspect};
}

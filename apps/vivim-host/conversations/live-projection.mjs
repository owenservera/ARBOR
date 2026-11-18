// VIVIM M2A/C16/H07 — PC-local metadata projection, NOT a conversation-send API.
// Source of truth remains Studio's conversation snapshots, journal and bridge; this log is
// a reconstructible, append-only, hash-linked read model. No prompts/replies/credentials.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { createBridgeEvidence } from './bridge-evidence.mjs';
import { createStudioJournalEvidence } from './studio-journal-evidence.mjs';
import { createPhoneDeliveryAcks } from './phone-delivery-acks.mjs';

export const LIVE_SCHEMA='vivim.live-state/1';
const ID=/^[a-zA-Z][a-zA-Z0-9._:-]{0,119}$/;
const CMD=/^cmd-[0-9a-f]{16}$/;
const DIGEST=/^[a-f0-9]{64}$/;
const EVENT_KINDS=new Set(['conversation.created','message.intent','transport.queued','bridge.claimed','send.authorized','send.observed','reply.observed','delivery.acked','send.uncertain','send.failed_before','send.failed_after']);
const SOURCES=Object.freeze({'conversation.created':'host','message.intent':'host','transport.queued':'relay','bridge.claimed':'bridge',
  'send.authorized':'studio','send.observed':'journal','reply.observed':'studio','delivery.acked':'phone',
  'send.uncertain':'journal','send.failed_before':'journal','send.failed_after':'journal'});
const ERROR=(code)=>Object.assign(new Error(code),{code});
const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&(Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
const canonical=x=>Array.isArray(x)?x.map(canonical):plain(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const sha=x=>createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
const valid=(v,label,pattern=ID)=>{if(typeof v!=='string'||!pattern.test(v))throw ERROR('LIVE_INVALID_'+label.toUpperCase());return v;};
const fields=['kind','idempotencyKey','conversationId','messageId','commandId','requestId','provider','model','threadRef','source','sourceRef','sourceRevision','evidenceDigest'];
function normalize(o){
  if(!plain(o)||Object.keys(o).some(k=>!fields.includes(k))||!EVENT_KINDS.has(o.kind))throw ERROR('LIVE_EVENT_INVALID');
  const x={kind:o.kind,idempotencyKey:valid(o.idempotencyKey,'key'),conversationId:valid(o.conversationId,'conversation')};
  if(o.kind!=='conversation.created')x.messageId=valid(o.messageId,'message');
  if(o.kind==='conversation.created'||o.kind==='message.intent'){
    if(o.provider!==undefined)x.provider=valid(o.provider,'provider');
    if(o.model!==undefined)x.model=valid(o.model,'model');
  }
  if(o.kind!=='conversation.created')x.commandId=valid(o.commandId,'command',CMD);
  if(['send.authorized','send.observed','reply.observed','send.uncertain','send.failed_before','send.failed_after'].includes(o.kind))x.requestId=valid(o.requestId,'request');
  if(o.threadRef!==undefined)x.threadRef=valid(o.threadRef,'thread');
  x.source=valid(o.source,'source');
  // A queue-backed phone intent is a Relay observation, not a synthetic Host receipt.
  if(x.source!==SOURCES[o.kind] && !(x.source==='relay' &&
    ['conversation.created','message.intent'].includes(o.kind)))throw ERROR('LIVE_WRONG_SOURCE');
  x.sourceRef=valid(o.sourceRef,'source_reference');
  if(!Number.isSafeInteger(o.sourceRevision)||o.sourceRevision<0)throw ERROR('LIVE_INVALID_REVISION');
  x.sourceRevision=o.sourceRevision;
  x.evidenceDigest=valid(o.evidenceDigest,'evidence_digest',DIGEST);
  return x;
}
function apply(state,e){
  const c=state.conversations.get(e.conversationId);
  if(e.kind==='conversation.created'){
    if(c)throw ERROR('LIVE_CONVERSATION_EXISTS');
    state.conversations.set(e.conversationId,{id:e.conversationId,provider:e.provider??null,model:e.model??null,messages:[],revision:e.sequence});
    return;
  }
  if(!c)throw ERROR('LIVE_CONVERSATION_MISSING');
  let m=state.messages.get(e.messageId);
  if(e.kind==='message.intent'){
    if(m||[...state.messages.values()].some(x=>x.commandId===e.commandId))throw ERROR('LIVE_MESSAGE_EXISTS');
    m={id:e.messageId,conversationId:e.conversationId,commandId:e.commandId,provider:e.provider??c.provider,model:e.model??c.model,
      requestId:null,threadRef:null,phase:'created',revision:e.sequence,proofs:{}};
    state.messages.set(m.id,m);c.messages.push(m.id);c.revision=e.sequence;return;
  }
  if(!m||m.conversationId!==e.conversationId||m.commandId!==e.commandId)throw ERROR('LIVE_MESSAGE_MISSING');
  const allowed={
    'transport.queued':['created'], 'bridge.claimed':['remote_queued'], 'send.authorized':['claimed'],
    'send.observed':['send_authorized'], 'reply.observed':['waiting_reply'], 'delivery.acked':['reply_observed'],
    'send.uncertain':['claimed','send_authorized','waiting_reply'],
    'send.failed_before':['claimed','send_authorized'], 'send.failed_after':['send_authorized','waiting_reply']
  };
  if(!allowed[e.kind]?.includes(m.phase))throw ERROR('LIVE_TRANSITION_INVALID');
  if(e.requestId){if(m.requestId&&m.requestId!==e.requestId)throw ERROR('LIVE_REQUEST_BINDING_CHANGED');m.requestId=e.requestId;}
  if(e.threadRef){if(m.threadRef&&m.threadRef!==e.threadRef)throw ERROR('LIVE_THREAD_BINDING_CHANGED');m.threadRef=e.threadRef;}
  const next={'transport.queued':'remote_queued','bridge.claimed':'claimed','send.authorized':'send_authorized',
    'send.observed':'waiting_reply','reply.observed':'reply_observed','delivery.acked':'delivered',
    'send.uncertain':'uncertain','send.failed_before':'failed_before_send','send.failed_after':'failed_after_send'};
  m.phase=next[e.kind];m.revision=e.sequence;
  m.proofs[e.kind]={source:e.source,ref:e.sourceRef,revision:e.sourceRevision,evidenceDigest:e.evidenceDigest};
  c.revision=e.sequence;
}
function readable(dir){
  try{const v=fs.lstatSync(dir);if(!v.isDirectory()||v.isSymbolicLink())throw ERROR('LIVE_PATH_UNSAFE');}
  catch(e){if(e.code==='ENOENT')return false;throw e;}return true;
}
const filename=n=>'e-'+String(n).padStart(8,'0')+'.json';
export function createLiveStateProjection({dir,worldId,verifyObservation,now=()=>new Date().toISOString(),maxEvents=20000}={}){
  if(!path.isAbsolute(dir??'')||typeof verifyObservation!=='function'||!ID.test(worldId??'')||
    !Number.isInteger(maxEvents)||maxEvents<1||maxEvents>100000)throw ERROR('LIVE_DEPENDENCY');
  const root=path.join(dir,'live-state',worldId),lock=path.join(root,'.writer.lock');
  function readAll(){
    if(!readable(root))return [];
    const names=fs.readdirSync(root).filter(n=>/^e-\d{8}\.json$/.test(n)).sort();
    if(names.length>maxEvents)throw ERROR('LIVE_CAPACITY');
    const events=[];let prev='0'.repeat(64);
    for(let i=0;i<names.length;i++){
      if(names[i]!==filename(i+1))throw ERROR('LIVE_SEQUENCE_GAP');
      const file=path.join(root,names[i]);if(!fs.lstatSync(file).isFile())throw ERROR('LIVE_PATH_UNSAFE');
      let e;try{e=JSON.parse(fs.readFileSync(file,'utf8'));}catch{throw ERROR('LIVE_EVENT_CORRUPT');}
      if(e.schema!==LIVE_SCHEMA||e.worldId!==worldId||e.sequence!==i+1||e.previousDigest!==prev||
        e.digest!==sha(Object.fromEntries(Object.entries(e).filter(([k])=>k!=='digest'))))throw ERROR('LIVE_EVENT_CORRUPT');
      // Recompute the hashed event without digest; unknown fields are covered by digest.
      prev=e.digest;events.push(e);
    }return events;
  }
  function validatedEvents(){
    const events=readAll(),state={conversations:new Map(),messages:new Map()},keys=new Map();
    for(const e of events){
      const normalized=normalize(Object.fromEntries(fields.filter(k=>e[k]!==undefined).map(k=>[k,e[k]])));
      if(keys.has(e.idempotencyKey))throw ERROR('LIVE_IDEMPOTENCY_DUPLICATED');
      keys.set(e.idempotencyKey,sha(normalized));apply(state,e);
    }return {events,state,keys};
  }
  // NOTE: verifier receives no prompt/reply text. It must cross-check current source state
  // and return verified:true, source kind and exact pinned digest/revision. No default allow.
  async function record(observation){
    const e=normalize(observation);
    const verified=await verifyObservation({...e});
    if(verified?.verified!==true||verified.source!==e.source||verified.sourceRef!==e.sourceRef||
      verified.sourceRevision!==e.sourceRevision||verified.evidenceDigest!==e.evidenceDigest)throw ERROR('LIVE_EVIDENCE_UNVERIFIED');
    fs.mkdirSync(root,{recursive:true,mode:0o700});if(!readable(root))throw ERROR('LIVE_PATH_UNSAFE');
    let fd;try{fd=fs.openSync(lock,'wx',0o600);fs.writeFileSync(fd,JSON.stringify({pid:process.pid,worldId,startedAt:now()}));fs.fsyncSync(fd);}catch(ex){if(ex.code==='EEXIST')throw ERROR('LIVE_WRITER_BUSY');throw ex;}finally{if(fd!==undefined)fs.closeSync(fd);}
    try{
      const {events,state,keys}=validatedEvents(),fingerprint=sha(e);
      if(keys.has(e.idempotencyKey)){
        if(keys.get(e.idempotencyKey)!==fingerprint)throw ERROR('LIVE_IDEMPOTENCY_CONFLICT');
        return {sequence:events.find(v=>v.idempotencyKey===e.idempotencyKey).sequence,replayed:true};
      }
      if(events.length>=maxEvents)throw ERROR('LIVE_CAPACITY');
      const sequence=events.length+1,previousDigest=events.at(-1)?.digest??'0'.repeat(64);
      const event={schema:LIVE_SCHEMA,worldId,sequence,...e,observedAt:now(),previousDigest};
      if(!Number.isFinite(Date.parse(event.observedAt)))throw ERROR('LIVE_CLOCK_INVALID');
      // Full validation *before* write. A denied event creates no sequence hole.
      apply(state,event);
      event.digest=sha(event);
      const final=path.join(root,filename(sequence)),temp=path.join(root,'.'+filename(sequence)+'.'+randomBytes(8).toString('hex')+'.tmp');
      let f;try{f=fs.openSync(temp,'wx',0o600);fs.writeFileSync(f,JSON.stringify(event)+'\n');fs.fsyncSync(f);fs.closeSync(f);f=undefined;
        if(fs.existsSync(final))throw ERROR('LIVE_SEQUENCE_CONFLICT');fs.renameSync(temp,final);
      }finally{if(f!==undefined)fs.closeSync(f);try{fs.unlinkSync(temp);}catch(ex){if(ex.code!=='ENOENT')throw ex;}}
      return {sequence,digest:event.digest,replayed:false};
    }finally{fs.unlinkSync(lock);}
  }
  // This view derives only from already verified, hash-linked live-state events.
  // No prompt, reply, session, thread, device credential or provider content is copied.
  function outcomeProjection(events,state){
    const kinds={'reply.observed':'reply_observed','delivery.acked':'delivered',
      'send.uncertain':'uncertain','send.failed_before':'failed_before_send','send.failed_after':'failed_after_send'};
    const rows=[];
    for(const m of state.messages.values()){
      const e=events[m.revision-1];if(!e||kinds[e.kind]!==m.phase)continue;
      if(!Object.hasOwn(kinds,e.kind)||!DIGEST.test(e.evidenceDigest)||!DIGEST.test(e.digest)||
         !Number.isFinite(Date.parse(e.observedAt)))continue;
      rows.push({id:m.id,provider:m.provider??null,state:m.phase,sequence:e.sequence,
        observedAt:e.observedAt,source:e.source,sourceRevision:e.sourceRevision,evidenceDigest:e.evidenceDigest,
        eventDigest:e.digest,authority:'historical-source-verified-event'});
    }
    rows.sort((a,b)=>b.sequence-a.sequence);
    return {schema:'vivim.studio-outcomes/1',authority:'read-only-historical',state:'source-backed',
      revision:events.length,total:rows.length,omitted:Math.max(0,rows.length-16),items:rows.slice(0,16)};
  }
  function studioOutcomes(){const {events,state}=validatedEvents();return outcomeProjection(events,state);}
  function snapshot(){
    const {events,state}=validatedEvents();return {schema:LIVE_SCHEMA,worldId,revision:events.length,
      cursor:{sequence:events.length,digest:events.at(-1)?.digest??'0'.repeat(64)},
      studioOutcomes:outcomeProjection(events,state),
      conversations:[...state.conversations.values()].map(c=>({id:c.id,provider:c.provider,model:c.model,revision:c.revision,
        messages:c.messages.map(id=>{const m=state.messages.get(id);return {id:m.id,commandId:m.commandId,
          provider:m.provider,model:m.model,requestId:m.requestId,threadRef:m.threadRef,phase:m.phase,revision:m.revision};})}))};
  }
  function changesSince(cursor={sequence:0,digest:'0'.repeat(64)},{limit=50,transport='direct'}={}){
    if(!['direct','cloud'].includes(transport)||!Number.isInteger(limit)||limit<1||limit>100)throw ERROR('LIVE_PAGE_INVALID');
    const events=readAll(),seq=cursor?.sequence,digest=cursor?.digest;
    if(!Number.isInteger(seq)||seq<0||typeof digest!=='string'||!DIGEST.test(digest))throw ERROR('LIVE_CURSOR_INVALID');
    const expected=seq===0?'0'.repeat(64):events[seq-1]?.digest;
    if(seq>events.length||digest!==expected)return {schema:LIVE_SCHEMA,worldId,reset:true,events:[],cursor:{sequence:events.length,digest:events.at(-1)?.digest??'0'.repeat(64)}};
    const chunk=events.slice(seq,seq+limit);
    // Same envelope on both transports; no private bodies. Cloud may only receive
    // this metadata when the caller has separately verified authorization.
    const projected=chunk.map(e=>({sequence:e.sequence,kind:e.kind,conversationId:e.conversationId,
      messageId:e.messageId??null,commandId:e.commandId??null,source:e.source,digest:e.digest}));
    return {schema:LIVE_SCHEMA,worldId,reset:false,events:projected,
      cursor:{sequence:seq+chunk.length,digest:chunk.at(-1)?.digest??digest},hasMore:seq+chunk.length<events.length};
  }
  // Source adapters may inspect existing phases without manufacturing missing
  // Studio/journal receipts. Read-only reconciliation is safe after restart.
  function messageState(messageId) {
    valid(messageId,'message');
    const {state}=validatedEvents();
    const m=state.messages.get(messageId);
    if(!m)return null;
    return { id:m.id, conversationId:m.conversationId,commandId:m.commandId,
      requestId:m.requestId,phase:m.phase,revision:m.revision,
      canQueue:m.phase==='created',canClaim:m.phase==='remote_queued',
      waitingForJournal:m.phase==='send_authorized',
      requiresReview:['uncertain','failed_after_send'].includes(m.phase),
      delivered:m.phase==='delivered' };
  }
  // Canonical World-facing metadata view. Never duplicate message text or interpret
  // queued/authorized as delivery. Stable IDs keep reloads idempotent.
  function worldTimeline() {
    const current = snapshot();
    return { schema:'vivim.world-conversation-timeline/1', worldId, revision:current.revision,
      cursor:current.cursor, studioOutcomes:current.studioOutcomes, conversations:current.conversations.map(conversation=>({
        id:conversation.id, provider:conversation.provider, model:conversation.model,
        revision:conversation.revision, messages:conversation.messages.map(message=>({
          id:message.id, commandId:message.commandId, requestId:message.requestId,
          provider:message.provider, threadRef:message.threadRef, revision:message.revision,
          state:message.phase, delivered:message.phase==='delivered',
          requiresReview:['uncertain','failed_after_send'].includes(message.phase)
        }))
      })) };
  }
  return {schema:LIVE_SCHEMA,worldId,record,snapshot,changesSince,worldTimeline,messageState,studioOutcomes};
}

/**
 * Host-facing composition of the persisted live-state model and the existing
 * Studio bridge ledger. The bridge is the only accepted authority for queued
 * and claimed proofs; other evidence remains subject to the caller's explicit
 * owner verifier. Nothing here sends or retries a provider request.
 */
export function createSourceVerifiedLiveProjection({dataRoot,worldId,verifyOtherSource,now}={}) {
  const bridge=createBridgeEvidence({dataRoot});
  const studioJournal=createStudioJournalEvidence({dataRoot});
  const phoneAcks=createPhoneDeliveryAcks({dataRoot});
  const verifyObservation=observation=>
    observation?.source==='phone' ? phoneAcks.verify(observation)
    : ['studio','journal'].includes(observation?.source)
      ? studioJournal.verify(observation)
      : bridge.verifyObservation(observation,verifyOtherSource);
  const projection=createLiveStateProjection({dir:dataRoot,worldId,verifyObservation,now});
  // Called only after the canonical bridge store accepted a relay-chat intent.
  // No provider action or automatic resend is performed.
  async function recordAcceptedRelay(commandId) {
    const conversation=bridge.observe(commandId,'conversation.created');
    const intent=bridge.observe(commandId,'message.intent');
    const queued=bridge.observe(commandId,'transport.queued');
    if(!conversation||!intent||!queued)throw ERROR('LIVE_RELAY_EVIDENCE_UNAVAILABLE');
    if(!projection.snapshot().conversations.some(c=>c.id===conversation.conversationId))
      await projection.record({...conversation,idempotencyKey:'conversation-'+conversation.conversationId});
    let before=projection.messageState(intent.messageId);
    const alreadyPresent=Boolean(before);
    if(before && (before.commandId!==commandId||before.conversationId!==conversation.conversationId))
      throw ERROR('LIVE_RELAY_MESSAGE_CONFLICT');
    // A crash between conversation, intent and queue commits must be resumable
    // from the *same canonical bridge record*, without resubmitting a prompt.
    if(!before)
      await projection.record({...intent,idempotencyKey:'intent-'+commandId});
    before=projection.messageState(intent.messageId);
    if(before.phase==='created')
      await projection.record({...queued,messageId:intent.messageId,idempotencyKey:'queue-'+commandId});
    const after=projection.messageState(intent.messageId);
    return {messageId:intent.messageId,phase:after.phase,
      replayed:alreadyPresent};
  }
  async function recordBridgeTransition({commandId,messageId,idempotencyKey}={}) {
    const evidence=bridge.observe(commandId,'bridge.claimed');
    if(!evidence)throw ERROR('LIVE_BRIDGE_EVIDENCE_UNAVAILABLE');
    const prior=projection.messageState(messageId);
    if(!prior||prior.commandId!==commandId||prior.conversationId!==evidence.conversationId)
      throw ERROR('LIVE_BRIDGE_MESSAGE_MISMATCH');
    return projection.record({...evidence,messageId,idempotencyKey});
  }
  async function reconcileBridgeClaims() {
    let recovered=0,recorded=0,skipped=0,failed=0;
    // Recover partial or missing local read-model commits from the existing
    // canonical queue. This cannot execute or resend the queued command.
    for(const item of bridge.recentRelayChats()) {
      const messageId='msg-'+item.commandId.slice(4);
      const before=projection.messageState(messageId);
      if(before && before.phase!=='created')continue;
      try {
        const receipt=await recordAcceptedRelay(item.commandId);
        if(!before && receipt.phase==='remote_queued')recovered++;
      } catch(error) { failed++; }
    }
    // Studio's durable claims survive a fast worker completion; a claim alone
    // never establishes authorization, dispatch, provider reply or delivery.
    for(const claim of bridge.currentClaims()) {
      const messageId='msg-'+claim.commandId.slice(4);
      const state=projection.messageState(messageId);
      if(!state||state.phase!=='remote_queued'||state.conversationId!==claim.conversationId) {
        skipped++;continue;
      }
      try {
        await recordBridgeTransition({commandId:claim.commandId,messageId,
          idempotencyKey:'claim-'+claim.commandId});
        recorded++;
      } catch(error) { failed++; }
    }
    return {recovered,recorded,skipped,failed};
  }
  async function reconcileStudioJournal() {
    let authorized=0,sent=0,replied=0,uncertain=0,skipped=0,failed=0;
    // One consistent read supplies both source stage reconciliation and
    // the phone's render-eligibility flags for this status response.
    const links=studioJournal.links();
    const verifiedReplyDisplayCommands=links.filter(link=>
      link.stages.replyDisplayMatchesJournal===true).map(link=>link.commandId);
    // Correlate only a claimed relay command with its exact Studio send-once
    // key, unchanged payload digest, owner-bound journal and source revision.
    // Unmatched workers remain unknown, never successful by implication.
    for(const link of links) {
      const messageId='msg-'+link.commandId.slice(4);
      let state=projection.messageState(messageId);
      if(!state||state.commandId!==link.commandId||
         state.conversationId!==link.relayConversationId) {skipped++;continue;}
      for(const [kind,phase,metric] of [
        ['send.authorized','claimed','authorized'],
        ['send.observed','send_authorized','sent'],
        ['reply.observed','waiting_reply','replied']
      ]) {
        if(state.phase!==phase)continue;
        const evidence=studioJournal.observe(link.commandId,kind,link);
        if(!evidence)continue;
        try {
          await projection.record({...evidence,
            idempotencyKey:kind.replaceAll('.','-')+'-'+link.commandId});
          if(metric==='authorized')authorized++;
          else if(metric==='sent')sent++;
          else replied++;
          state=projection.messageState(messageId);
        }catch{failed++;break;}
      }
      if(['claimed','send_authorized','waiting_reply'].includes(state.phase) &&
          link.stages.uncertain===true && link.stages.sendObserved!==true) {
        const evidence=studioJournal.observe(link.commandId,'send.uncertain',link);
        if(evidence) {
          try {
            await projection.record({...evidence,
              idempotencyKey:'send-uncertain-'+link.commandId});
            uncertain++;
          }catch{failed++;}
        }
      }
    }
    return {authorized,sent,replied,uncertain,skipped,failed,verifiedReplyDisplayCommands};
  }
  async function recordPhoneDelivery({commandId,messageId,conversationId,deviceId,replyRevision}={}) {
    const before=projection.messageState(messageId);
    if(!before||before.commandId!==commandId||
       before.conversationId!==conversationId ||
       !['reply_observed','delivered'].includes(before.phase))
      throw ERROR('LIVE_PHONE_ACK_REPLY_NOT_VERIFIED');
    // The phone is allowed to acknowledge only the precise reply revision it
    // received from the Host timeline. No queue/result status is accepted.
    if(before.phase==='reply_observed' && before.revision!==replyRevision)
      throw ERROR('LIVE_PHONE_ACK_STALE_REPLY');
    if(before.phase==='reply_observed' &&
       !studioJournal.links().some(link=>link.commandId===commandId &&
         link.relayConversationId===conversationId &&
         link.stages.replyDisplayMatchesJournal===true))
      throw ERROR('LIVE_PHONE_ACK_DISPLAY_NOT_VERIFIED');
    const saved=phoneAcks.put({commandId,messageId,conversationId,deviceId,replyRevision});
    if(before.phase==='delivered')
      return {state:'delivered',replayed:true,receiptRef:saved.proof.sourceRef};
    const event={kind:'delivery.acked',idempotencyKey:'phone-ack-'+commandId,
      conversationId,messageId,commandId,...saved.proof};
    const recorded=await projection.record(event);
    return {state:'delivered',replayed:recorded.replayed,
      receiptRef:saved.proof.sourceRef};
  }
  const verifiedReplyDisplays=()=>new Set(studioJournal.links()
    .filter(link=>link.stages.replyDisplayMatchesJournal===true)
    .map(link=>link.commandId));
  return {...projection,recordAcceptedRelay,recordBridgeTransition,
    reconcileBridgeClaims,reconcileStudioJournal,recordPhoneDelivery,verifiedReplyDisplays};
}

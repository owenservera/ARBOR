// Integration 5: Host-owned 5A -> 5B receipt boundary and read-only 5C gate.
// Requires the real HQ validator/projector and an owner-managed durable approval broker.
// No external provider, World, or KB write path is reachable from this module.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, openSync, closeSync, writeFileSync, fsyncSync, renameSync, unlinkSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const stable = v => JSON.stringify(v, (_, x) => x && typeof x === 'object' && !Array.isArray(x)
  ? Object.fromEntries(Object.keys(x).sort().map(k => [k, x[k]])) : x);
const fail = (code, status=403) => { throw Object.assign(new Error(code), {code,status}); };
const id = v => typeof v === 'string' && /^[a-z0-9][a-z0-9._:-]{0,127}$/.test(v);
const hmac = (key, value) => createHmac('sha256',key).update(stable(value)).digest('hex');
const eq = (a,b) => typeof a === 'string' && typeof b === 'string' &&
  /^[a-f0-9]{64}$/.test(a) && /^[a-f0-9]{64}$/.test(b) && timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));

// One authenticated journal per scope; no user-supplied path or acceptance records.
function signedJournal(root, key) {
  const dir = path.join(root, 'corpus-integration-v1');
  mkdirSync(dir,{recursive:true,mode:0o700});
  const file = name => path.join(dir, sha(name)+'.json');
  const read = name => {
    try {
      const data = JSON.parse(readFileSync(file(name),'utf8'));
      const {seal,...body} = data;
      if (body.schema !== 'vivim.corpus-integration/1' || !eq(seal,hmac(key,body)) || body.name !== name) fail('INTEGRATION_RECORD_CORRUPT',409);
      return body.value;
    } catch(e) { if(e.code === 'ENOENT') return null; if(e.code) throw e; fail('INTEGRATION_RECORD_CORRUPT',409); }
  };
  const write = (name,value) => {
    // Only create immutable records. Every replay is verified against its original value.
    const previous=read(name);
    if(previous !== null) {
      if(stable(previous)!==stable(value)) fail('INTEGRATION_REPLAY_CONFLICT',409);
      return;
    }
    const body={schema:'vivim.corpus-integration/1',name,value}, sealed={...body,seal:hmac(key,body)};
    const dest=file(name), tmp=dest+'.'+process.pid+'.tmp';
    let fd;
    try {
      fd=openSync(tmp,'wx',0o600); writeFileSync(fd,stable(sealed)); fsyncSync(fd); closeSync(fd);fd=undefined;
      // No overwrite of concurrent immutable records; a race leaves an explicit conflict.
      const lock=openSync(dest+'.lock','wx',0o600);
      try { if(read(name)!==null) fail('INTEGRATION_WRITER_CONFLICT',409); renameSync(tmp,dest); }
      finally {closeSync(lock);unlinkSync(dest+'.lock');}
      if(process.platform!=='win32') {const d=openSync(dir,'r');try{fsyncSync(d)}finally{closeSync(d)}}
    } finally {if(fd!==undefined)closeSync(fd);try{unlinkSync(tmp)}catch(e){if(e.code!=='ENOENT')throw e}}
  };
  return {read,write};
}

/**
 * Host integration contracts:
 * - authorizeDevice(auth, requiredScope) is backed by enrollment.validateGrant, never caller claims.
 * - ownerApproval({device,events,expiresAt}) is a PREEXISTING owner decision, not an auto-approval.
 * - rawGrantFor({scopeId,eventId,device}) is a PREEXISTING Host owner's per-event grant.
 * - verifyCurrentGrant(ref,device) rechecks rights, sensitivity and revocation from Host storage.
 * - HQ exports are passed from the canonical repos-hq modules, not copied validators.
 */
export function createHostPocketCorpusBridge({dataRoot,receiptKey,transportFactory,intakeFactory,hq,
  authorizeDevice,ownerApproval,rawGrantFor,verifyCurrentGrant,now=Date.now}) {
  if(typeof dataRoot!=='string'||!path.isAbsolute(dataRoot)||!Buffer.isBuffer(receiptKey)||receiptKey.length<32||
    [transportFactory,intakeFactory,authorizeDevice,ownerApproval,rawGrantFor,verifyCurrentGrant,now].some(f=>typeof f!=='function')||
    !hq||['validateCorpusCapture','canonicalCorpusJson','corpusEventDigest','projectPocketEvidence','verifyIntakeReceipt'].some(k=>typeof hq[k]!=='function'))
    throw new TypeError('HOST_INTEGRATION_TRUST_ADAPTER_REQUIRED');
  const journal=signedJournal(dataRoot,receiptKey), corpusRoot=path.join(dataRoot,'corpus-accepted');
  const activeFinalizations=new Map(); // Ephemeral request credentials, never persisted or re-sent on restart.
  const deviceFor=(auth,scope)=>{
    const p=authorizeDevice(auth,scope);
    if(!p||p.verified!==true||!id(p.deviceId)||!id(p.grantId)||!id(p.ownerId)||!id(p.worldId)||
      !Array.isArray(p.scopes)||!p.scopes.includes(scope)||!Number.isFinite(p.expiresAt)||p.expiresAt<=now()) fail('DEVICE_UNAUTHORIZED',401);
    return p;
  };
  const canonical=e=>{
    if(!hq.validateCorpusCapture(e)?.ok) fail('CANONICAL_CAPTURE_INVALID',400);
    const c=hq.canonicalCorpusJson(e);
    if(!c?.ok||typeof c.json!=='string') fail('CANONICAL_CAPTURE_INVALID',400);
    return c;
  };
  const intake=intakeFactory({root:corpusRoot,receiptKey,
    authenticate:auth=>deviceFor(auth,'corpus:intake'),
    resolveGrant:(ref,principal)=>verifyCurrentGrant(ref,principal),now});
  if(!intake||typeof intake.acceptBatch!=='function') fail('INTAKE_UNAVAILABLE',503);
  const getApproval=(scopeId,eventId,device)=>{
    const grant=rawGrantFor({scopeId,eventId,device});
    if(!grant||!id(grant.ref)||!id(grant.batchId)||!Array.isArray(grant.approvedEvents)||
       grant.approvedEvents.length!==1 || grant.approvedEvents[0].eventId!==eventId ||
       grant.scope!=='corpus:raw-intake'||grant.ownerId!==device.ownerId||grant.deviceId!==device.deviceId||
       grant.worldId!==device.worldId||grant.revoked!==false||!Number.isFinite(grant.expiresAt)||grant.expiresAt<=now()||
       !Number.isFinite(grant.approvedAt)||grant.approvedAt>now()||grant.approvedBy!=='owner'||
       grant.rightsReviewed!==true||grant.sensitivityReviewed!==true||grant.thirdPartyReviewed!==true) fail('RAW_OWNER_GRANT_REQUIRED');
    return grant;
  };
  const acceptanceName=(worldId,eventId)=>'accepted:'+worldId+':'+eventId;
  const assertAccepted=(out,device,eventId)=>{
    const candidate=out?.state==='accepted'?out.receipt:out;
    if(!candidate?.durable) return;
    const proof=journal.read(acceptanceName(device.worldId,eventId));
    if(!proof || proof.ownerId!==device.ownerId || proof.deviceId!==device.deviceId ||
       proof.eventDigest!==candidate.digest || proof.sha256!==candidate.sha256 ||
       proof.eventId!==eventId || candidate.receiptId!=='receipt:'+sha(stable(proof.batchReceipt)) ||
       !hq.verifyIntakeReceipt(proof.batchReceipt,receiptKey)) fail('ACCEPTED_OWNER_PROOF_REQUIRED',409);
  };
  const transport=transportFactory({dataRoot,
    validateCapture:hq.validateCorpusCapture,canonicalCapture:hq.canonicalCorpusJson,
    authorizeDevice:auth=>deviceFor(auth,'corpus:upload'),
    approveTransfer:async p=>{
      const approved=await ownerApproval(p);
      // 5A itself checks exact event/digest/expiry bindings, then checks revocation again.
      return approved;
    },
    persistAccepted:async({envelope,stagePath,eventDigest,expectedSha256,deviceId,scopeId})=>{
      const c=canonical(envelope);
      if(sha(c.json)!==eventDigest||envelope.asset.role!=='original'||envelope.asset.availability!=='stored'||
         !stagePath||envelope.asset.sha256!==expectedSha256) fail('RAW_ORIGINAL_REQUIRED',400);
      const binding=journal.read('scope:'+scopeId);
      if(!binding||binding.worldId!==envelope.worldId||!binding.eventIds.includes(envelope.eventId)||
         binding.deviceId!==deviceId) fail('SCOPE_BINDING_MISSING',403);
      const liveAuth=activeFinalizations.get(scopeId+':'+envelope.eventId);
      if(!liveAuth) fail('FINALIZE_REQUIRES_LIVE_DEVICE',401);
      const device=deviceFor(liveAuth,'corpus:intake');
      if(device.deviceId!==deviceId||device.worldId!==envelope.worldId||device.ownerId!==binding.ownerId) fail('DEVICE_UNAUTHORIZED',401);
      const grant=getApproval(scopeId,envelope.eventId,device);
      if(grant.approvedEvents[0].envelopeSha256!==sha(stable(envelope))) fail('RAW_GRANT_DIGEST_MISMATCH');
      const bytes=await readFile(stagePath);
      if(bytes.length!==envelope.asset.bytes||sha(bytes)!==expectedSha256) fail('STAGED_RAW_TAMPER',422);
      const result=await intake.acceptBatch({batchId:grant.batchId,grantRef:grant.ref,session:liveAuth,items:[{envelope,bytes}]});
      if(result?.receipt?.decision!=='authorized'||!hq.verifyIntakeReceipt(result.receipt,receiptKey)||
         result.receipt.events?.length!==1||result.receipt.events[0].state!=='accepted'||result.receipt.batchId!==grant.batchId||
         result.receipt.accepted!==1||result.receipt.duplicates!==0||
         result.receipt.events[0].eventKey!==sha(device.ownerId+'\0'+envelope.worldId+'\0'+envelope.eventId)) fail('SIGNED_DURABLE_RECEIPT_REQUIRED',503);
      const proof={worldId:envelope.worldId,eventId:envelope.eventId,assetId:envelope.assetId,
        eventDigest,sha256:expectedSha256,ownerId:device.ownerId,deviceId:device.deviceId,
        scopeId,approvalRef:grant.ref,batchReceipt:result.receipt,capture:JSON.parse(c.json),
        acceptedAt:new Date(now()).toISOString()};
      journal.write(acceptanceName(envelope.worldId,envelope.eventId),proof);
      const receiptId='receipt:'+sha(stable(result.receipt));
      return {durable:true,worldId:envelope.worldId,eventId:envelope.eventId,digest:eventDigest,
        sha256:expectedSha256,receiptId};
    },
    lookupAccepted:async({worldId,eventId,digest})=>{
      const proof=journal.read(acceptanceName(worldId,eventId));
      if(!proof) return null;
      if(proof.eventDigest!==digest||!hq.verifyIntakeReceipt(proof.batchReceipt,receiptKey)||
         proof.batchReceipt.decision!=='authorized'||proof.batchReceipt.events?.length!==1||
         proof.batchReceipt.events[0].state!=='accepted') fail('ACCEPTED_PROOF_INVALID',409);
      // No intake, filesystem write, or transfer replay during reconciliation.
      return {durable:true,worldId,eventId,digest,sha256:proof.sha256,
        receiptId:'receipt:'+sha(stable(proof.batchReceipt))};
    },now});
  if(!transport||!['issueScope','inspect','pushChunk','finalize','reconcile'].every(k=>typeof transport[k]==='function')) fail('TRANSPORT_UNAVAILABLE',503);
  return Object.freeze({
    async issueScope({auth,events,ttlMs}) {
      const device=deviceFor(auth,'corpus:upload');
      if(!device.scopes.includes('corpus:intake')) fail('INTAKE_DEVICE_SCOPE_REQUIRED');
      for(const e of events??[]) {
        const c=canonical(e);
        if(e.worldId!==device.worldId) fail('WORLD_SCOPE_MISMATCH');
        const proof=journal.read(acceptanceName(e.worldId,e.eventId));
        if(proof && (proof.ownerId!==device.ownerId || proof.deviceId!==device.deviceId ||
           proof.eventDigest!==sha(c.json))) fail('REPLAY_IDENTITY_DENIED',409);
      }
      const result=await transport.issueScope({auth,events,ttlMs});
      journal.write('scope:'+result.scopeId,{deviceId:device.deviceId,ownerId:device.ownerId,
        worldId:device.worldId,eventIds:events.map(e=>e.eventId)});
      return result;
    },
    inspect:args=>transport.inspect(args),pushChunk:args=>transport.pushChunk(args),
    async finalize(args) {
      const device=deviceFor(args.auth,'corpus:intake');
      const binding=journal.read('scope:'+args.scopeId);
      if(!binding||binding.deviceId!==device.deviceId||binding.ownerId!==device.ownerId) fail('SCOPE_BINDING_MISSING');
      const key=args.scopeId+':'+args.eventId;
      if(activeFinalizations.has(key)) fail('FINALIZE_CONCURRENT',409);
      activeFinalizations.set(key,args.auth);
      try {
        const out=await transport.finalize(args);
        assertAccepted(out,device,args.eventId);
        return out;
      } finally {activeFinalizations.delete(key)}
    },
    async reconcile(args) {
      const device=deviceFor(args.auth,'corpus:intake');
      const binding=journal.read('scope:'+args.scopeId);
      if(!binding||binding.ownerId!==device.ownerId||binding.deviceId!==device.deviceId)
        fail('SCOPE_BINDING_MISSING');
      const out=await transport.reconcile(args);
      assertAccepted(out,device,args.eventId);
      return out;
    },
    // Read-only accepted evidence, accessible only to authorized owner/device.
    projectAccepted({auth,worldId,eventIds}) {
      const device=deviceFor(auth,'corpus:read');
      if(worldId!==device.worldId||!Array.isArray(eventIds)||eventIds.length>256||
        eventIds.some(x=>!id(x))) fail('EVIDENCE_QUERY_INVALID',400);
      const entries=[], proofs=[];
      for(const eventId of eventIds) {
        const proof=journal.read(acceptanceName(worldId,eventId));
        if(!proof) continue;
        if(proof.ownerId!==device.ownerId||proof.deviceId!==device.deviceId||
           !hq.verifyIntakeReceipt(proof.batchReceipt,receiptKey)) fail('ACCEPTED_PROOF_INVALID',409);
        const current=verifyCurrentGrant(proof.approvalRef,device);
        if(!current||current.revoked!==false||!Number.isFinite(current.expiresAt)||current.expiresAt<=now()) fail('SCOPE_WITHDRAWN');
        const receipt={receiptRef:'receipt:'+sha(stable(proof.batchReceipt)),approvalRef:'approval:'+sha(proof.approvalRef),
          worldId,eventId,assetId:proof.assetId,eventDigest:proof.eventDigest,
          sourceRef:'source:'+sha(proof.capture.source.registryId),scopeRef:'scope:'+sha(proof.scopeId),
          status:'accepted',acceptedAt:proof.acceptedAt};
        entries.push({capture:proof.capture,receipt});proofs.push({receipt,proof});
      }
      const bound=(r,d)=>proofs.some(({receipt,proof})=>stable(receipt)===stable(r)&&
        d.capture.eventId===proof.eventId&&d.eventHash===proof.eventDigest&&
        hq.verifyIntakeReceipt(proof.batchReceipt,receiptKey));
      const active=(r,d)=>bound(r,d)&&(()=>{const proof=proofs.find(p=>stable(p.receipt)===stable(r))?.proof;
        const g=verifyCurrentGrant(proof.approvalRef,device);return g?.revoked===false&&Number.isFinite(g.expiresAt)&&g.expiresAt>now();})();
      const result=hq.projectPocketEvidence({entries},{verifyHostAcceptance:bound,verifyOwnerApproval:active,
        isScopeActive:active,verifyStoredAsset:(r,d)=>{
          if(!bound(r,d)) return false;
          const proof=proofs.find(p=>stable(p.receipt)===stable(r))?.proof;
          // Read-only verification of the exact Host persisted bytes, never transport staging.
          const key=sha(proof.ownerId+'\0'+proof.capture.worldId+'\0'+proof.eventId);
          try {const bytes=readFileSync(path.join(corpusRoot,'v1',key,'raw.bin'));
            return bytes.length===proof.capture.asset.bytes&&sha(bytes)===proof.sha256;
          }catch{return false;}
        }});
      if(!result.ok) fail('HQ_PROJECTION_REFUSED',409);
      return result;
    }
  });
}

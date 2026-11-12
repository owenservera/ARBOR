import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, openSync, closeSync, fsyncSync,
  mkdirSync, statSync, appendFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createCorpusTransferProtocol as create, TRANSPORT_SCHEMA, TRANSPORT_LIMITS } from './protocol.mjs';
const sha = b => createHash('sha256').update(b).digest('hex');
const sort = x => Array.isArray(x) ? x.map(sort) : x && typeof x === 'object' ?
  Object.fromEntries(Object.keys(x).sort().map(k=>[k,sort(x[k])])) : x;
const auth={grantId:'grant-1',sessionId:'session-1'};
function makeCapture(index, bytes=Buffer.from('some original evidence '+index)) {
  const eventId='evt-testcase'+String(index).padStart(4,'0');
  const assetId='asset-testcase'+String(index).padStart(4,'0');
  return { schema:'vivim.corpus-intake/1', eventId, assetId, worldId:'world-local', kind:'note',
    title:'Test note '+index,capturedAt:'2026-11-05T12:00:00.000Z',
    source:{registryId:'SRC-OWNER-INPUT',mechanism:'push',surface:'desktop.note',actor:'owner',publicUri:null},
    asset:{mediaType:'text/plain',availability:'stored',contentRef:'asset:'+assetId,sha256:sha(bytes),bytes:bytes.length,role:'original'},
    policy:{purpose:'private-personal-ai',sensitivity:'S1',thirdParty:'unknown',rights:'review_required',ownerInitiated:true,grantRef:null},
    lineage:{parents:[],evidenceRefs:[]} };
}
const bytesFor = index => Buffer.from('some original evidence '+index);
const fakeValidate = e => ({ok:e?.schema==='vivim.corpus-intake/1' &&
  e?.policy?.ownerInitiated===true && e?.source?.publicUri===null &&
  typeof e.eventId==='string' && (typeof e.asset?.sha256==='string' ||
  (e.asset?.availability==='metadata_only' && e.asset?.sha256===null))});
const fakeCanon = e=>({ok:true,json:JSON.stringify(sort(e))});
function fixture(t) {
  const dir=mkdtempSync(path.join(tmpdir(),'vivim-w5a-'));
  t.after(()=>rmSync(dir,{force:true,recursive:true}));
  let revoked=false, approved=true, receivingCalls=0, afterAccept=false, moment=Date.parse('2026-11-06T10:00:00Z');
  const receiverPath=path.join(dir,'receiver.json');
  const readReceiver=()=>{try{return JSON.parse(readFileSync(receiverPath,'utf8'));}catch(e){if(e.code==='ENOENT')return {};throw e;}};
  const accept = async ({envelope,eventDigest,expectedSha256,stagePath,idempotencyKey}) => {
    receivingCalls++;
    const prior=readReceiver();
    if (prior[idempotencyKey]) {
      if (prior[idempotencyKey].digest!==eventDigest) throw new Error('receiver-conflict');
      return prior[idempotencyKey];
    }
    if (expectedSha256 && sha(readFileSync(stagePath)) !== expectedSha256) throw new Error('receiver-hash');
    const receipt={durable:true,worldId:envelope.worldId,eventId:envelope.eventId,digest:eventDigest,
      sha256:expectedSha256,receiptId:'rcpt-'+envelope.eventId};
    prior[idempotencyKey]=receipt;
    const fd=openSync(receiverPath,'w',0o600);
    try {writeFileSync(fd,JSON.stringify(prior));fsyncSync(fd);} finally{closeSync(fd);}
    if(afterAccept)throw new Error('simulate response loss after durable receiver commit');
    return receipt;
  };
  const params={dataRoot:dir,validateCapture:fakeValidate,canonicalCapture:fakeCanon,
    authorizeDevice: a=>(!revoked && a?.grantId===auth.grantId && a?.sessionId===auth.sessionId ?
      {grantId:'grant-1',deviceId:'device-one',scopes:['corpus:upload']}:null),
    approveTransfer:async ({deviceId,grantId,expiresAt,events})=>approved ?
      {decision:'approved',approvalId:'approval-one',deviceId,grantId,expiresAt,events}:null,
    persistAccepted:accept,
    lookupAccepted:async ({worldId,eventId})=>readReceiver()[JSON.stringify([worldId,eventId])]??null,
    now:()=>moment};
  return {dir,open:()=>create(params), params, auth,
    revoke:()=>{revoked=true;}, allow:()=>{revoked=false;},deny:()=>{approved=false;},
    advance:n=>{moment+=n;}, afterAccept:()=>{afterAccept=true;},
    receivingCalls:()=>receivingCalls,readReceiver};
}
async function scope(h,p,events,ttlMs=60000){return p.issueScope({auth:h.auth,events,ttlMs});}
const pos=(h,p,s,e)=>p.inspect({auth:h.auth,scopeId:s.scopeId,eventId:e.eventId});
const push=(h,p,s,e,offset,chunk)=>p.pushChunk({auth:h.auth,scopeId:s.scopeId,eventId:e.eventId,offset,chunk});
const finish=(h,p,s,e)=>p.finalize({auth:h.auth,scopeId:s.scopeId,eventId:e.eventId});
const code=(value,expected)=>assert.equal(value.code,expected);

test('10 explicit approved captures produce 10 durable receipts; replay is a no-op',async t=>{
  const h=fixture(t), p=h.open();const es=Array.from({length:10},(_,i)=>makeCapture(i));
  assert.equal(TRANSPORT_SCHEMA,'vivim.corpus-transfer/1');
  const s=await scope(h,p,es);assert.equal(s.events.length,10);
  for(let i=0;i<10;i++) {
    const e=es[i],buf=bytesFor(i);
    assert.equal(push(h,p,s,e,0,buf).cursor,buf.length);
    assert.equal(push(h,p,s,e,0,buf).cursor,buf.length);
    assert.equal((await finish(h,p,s,e)).state,'accepted');
    assert.equal((await finish(h,p,s,e)).state,'accepted');
  }
  assert.equal(h.receivingCalls(),10);assert.equal(Object.keys(h.readReceiver()).length,10);
  const another=await scope(h,p,es);
  for(const e of es)assert.equal(pos(h,p,another,e).state,'accepted');
  assert.equal(h.receivingCalls(),10);
});
test('chunk offsets, tampering, and incomplete upload fail closed',async t=>{
  const h=fixture(t),p=h.open(),e=makeCapture(41),s=await scope(h,p,[e]),b=bytesFor(41);
  await assert.rejects(finish(h,p,s,e),x=>{code(x,'TRANSFER_INCOMPLETE');return true;});
  assert.throws(()=>push(h,p,s,e,1,b.subarray(0,4)),x=>{code(x,'CURSOR_CONFLICT');return true;});
  push(h,p,s,e,0,b.subarray(0,6));
  assert.throws(()=>push(h,p,s,e,0,Buffer.from('tamper')),x=>{code(x,'RETRY_BYTES_CONFLICT');return true;});
  assert.throws(()=>push(h,p,s,e,5,b.subarray(5,9)),x=>{code(x,'CURSOR_CONFLICT');return true;});
  assert.throws(()=>push(h,p,s,e,6,Buffer.alloc(b.length)),x=>{code(x,'CHUNK_EXCEEDS_APPROVAL');return true;});
  push(h,p,s,e,6,b.subarray(6));assert.equal((await finish(h,p,s,e)).state,'accepted');
});
test('tampered complete bytes never reach Host receiver',async t=>{
  const h=fixture(t),p=h.open(),e=makeCapture(42),s=await scope(h,p,[e]),b=Buffer.from(bytesFor(42));
  b[0]^=1;push(h,p,s,e,0,b);
  await assert.rejects(finish(h,p,s,e),x=>{code(x,'ASSET_SHA256_MISMATCH');return true;});
  assert.equal(h.receivingCalls(),0);
});
test('changed immutable envelope or asset bytes under same world/event are conflicts across approved scopes',async t=>{
  const h=fixture(t),p=h.open(),e=makeCapture(43);await scope(h,p,[e]);
  const changed=structuredClone(e);changed.title='different claim';
  await assert.rejects(scope(h,p,[changed]),x=>{code(x,'EVENT_REPLAY_CONFLICT');return true;});
  const changed2=structuredClone(e);changed2.asset.sha256=sha('other');
  await assert.rejects(scope(h,p,[changed2]),x=>{code(x,'EVENT_REPLAY_CONFLICT');return true;});
});
test('device authorization, scope approval and expiring/revoked sessions are enforced per operation',async t=>{
  const h=fixture(t),p=h.open(),e=makeCapture(44),s=await scope(h,p,[e]),b=bytesFor(44);
  assert.throws(()=>p.inspect({auth:{grantId:'grant-1',sessionId:'stolen'},scopeId:s.scopeId,eventId:e.eventId}),x=>{code(x,'DEVICE_NOT_AUTHORIZED');return true;});
  h.revoke();assert.throws(()=>push(h,p,s,e,0,b),x=>{code(x,'DEVICE_NOT_AUTHORIZED');return true;});
  h.allow();h.advance(60000);
  assert.throws(()=>push(h,p,s,e,0,b),x=>{code(x,'SCOPE_EXPIRED');return true;});
  const newP=h.open();h.deny();
  await assert.rejects(scope(h,newP,[makeCapture(45)]),x=>{code(x,'OWNER_APPROVAL_REQUIRED');return true;});
});
test('durable cursor survives restart, uncommitted overhang is truncated, then resumes',async t=>{
  const h=fixture(t),p=h.open(),e=makeCapture(46),s=await scope(h,p,[e]),b=bytesFor(46);
  push(h,p,s,e,0,b.subarray(0,7));
  const stageDir=path.join(h.dir,'corpus-transfer-v1','staging');
  const file=(await import('node:fs')).readdirSync(stageDir)[0];
  appendFileSync(path.join(stageDir,file),Buffer.from('CRASH TAIL'));
  const recovered=h.open();
  assert.equal(pos(h,recovered,s,e).cursor,7);
  push(h,recovered,s,e,7,b.subarray(7));
  assert.equal(statSync(path.join(stageDir,file)).size,b.length);
  assert.equal((await finish(h,recovered,s,e)).state,'accepted');
});
test('Host crash/response loss after durable persistence requires explicit receipt reconciliation, never second accept',async t=>{
  const h=fixture(t),p=h.open(),e=makeCapture(47),s=await scope(h,p,[e]),b=bytesFor(47);
  push(h,p,s,e,0,b);h.afterAccept();
  await assert.rejects(finish(h,p,s,e),x=>{code(x,'HOST_ACCEPT_UNCERTAIN');return true;});
  assert.equal(h.receivingCalls(),1);
  const afterRestart=h.open();
  await assert.rejects(finish(h,afterRestart,s,e),x=>{code(x,'ACCEPT_UNCERTAIN_RECONCILE_REQUIRED');return true;});
  assert.equal((await afterRestart.reconcile({auth:h.auth,scopeId:s.scopeId,eventId:e.eventId})).state,'accepted');
  assert.equal(h.receivingCalls(),1);
  assert.equal((await finish(h,afterRestart,s,e)).state,'accepted');
});
test('bounds on events, bytes, chunk size, TTL, and approval exactness',async t=>{
  const h=fixture(t),p=h.open();
  await assert.rejects(scope(h,p,Array.from({length:11},(_,i)=>makeCapture(i+90))),x=>{code(x,'BATCH_COUNT_LIMIT');return true;});
  await assert.rejects(scope(h,p,[makeCapture(1)],TRANSPORT_LIMITS.maxScopeMs+1),x=>{code(x,'INVALID_SCOPE_TTL');return true;});
  const e=makeCapture(55),s=await scope(h,p,[e]);
  assert.throws(()=>push(h,p,s,e,0,Buffer.alloc(TRANSPORT_LIMITS.maxChunkBytes+1)),x=>{code(x,'INVALID_CHUNK');return true;});
  assert.throws(()=>push(h,p,s,e,0,'raw string'),x=>{code(x,'INVALID_CHUNK');return true;});
  await assert.rejects(scope(h,p,[e,e]),x=>{code(x,'DUPLICATE_BATCH_EVENT');return true;});
  const a=makeCapture(400),differentWorld=makeCapture(400);differentWorld.worldId='world-other';
  await assert.rejects(scope(h,p,[a,differentWorld]),x=>{code(x,'MIXED_WORLD_BATCH');return true;});
  const sizeOne=makeCapture(301),sizeTwo=makeCapture(302);
  sizeOne.asset.bytes=17*1024*1024;sizeTwo.asset.bytes=17*1024*1024;
  await assert.rejects(scope(h,p,[sizeOne,sizeTwo]),x=>{code(x,'BATCH_BYTE_LIMIT');return true;});
  const wrong=structuredClone(e);wrong.asset.bytes=TRANSPORT_LIMITS.maxAssetBytes+1;
  await assert.rejects(scope(h,p,[wrong]),x=>{code(x,'ASSET_BUDGET_OR_HASH_INVALID');return true;});
});
test('a capture has no upload permission and metadata-only does not invent stored bytes',async t=>{
  const h=fixture(t),p=h.open(),e=makeCapture(56);
  assert.throws(()=>p.inspect({auth:h.auth,scopeId:'nonexistent',eventId:e.eventId}),x=>{code(x,'SCOPE_UNAUTHORIZED');return true;});
  const m=structuredClone(e);
  m.asset={mediaType:'text/plain',availability:'metadata_only',contentRef:null,sha256:null,bytes:null,role:'original'};
  const s=await scope(h,p,[m]);
  assert.equal((await finish(h,p,s,m)).state,'accepted');
  assert.equal(h.receivingCalls(),1);
});
test('host must inject all trust and durability adapters; source-only module never enrolls devices',t=>{
  const h=fixture(t);
  assert.throws(()=>create({dataRoot:h.dir}),x=>{code(x,'HOST_ADAPTER_REQUIRED');return true;});
});
test('crash-left writer lock fails closed instead of stealing it; missing accepted staged prefix fails',async t=>{
  const h=fixture(t),p=h.open(),e=makeCapture(58),s=await scope(h,p,[e]);
  const lock=path.join(h.dir,'corpus-transfer-v1','writer.lock');writeFileSync(lock,'unknown owner');
  assert.throws(()=>pos(h,p,s,e),x=>{code(x,'TRANSPORT_WRITER_BUSY');return true;});unlinkSync(lock);
  push(h,p,s,e,0,bytesFor(58).subarray(0,4));
  const sd=path.join(h.dir,'corpus-transfer-v1','staging');
  for(const f of (await import('node:fs')).readdirSync(sd))unlinkSync(path.join(sd,f));
  assert.throws(()=>push(h,h.open(),s,e,4,bytesFor(58).subarray(4)),x=>{code(x,'STAGED_BYTES_MISSING');return true;});
});

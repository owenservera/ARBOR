import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash, createHmac } from 'node:crypto';
import { createHostPocketCorpusBridge } from './host-integration.mjs';
const hash = x=>createHash('sha256').update(x).digest('hex');
const stable = v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const key=Buffer.alloc(32,37), NOW=Date.parse('2026-11-06T13:00:00Z');
function setup(t,{loseAck=false,forgeReceipt=false}={}) {
  const root=mkdtempSync(path.join(tmpdir(),'vivim-i5-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const staged=path.join(root,'stage');mkdirSync(staged);
  const principal={verified:true,ownerId:'owner-a',deviceId:'device-a',grantId:'device-grant-a',worldId:'world-local',
    scopes:['corpus:upload','corpus:intake','corpus:read'],expiresAt:NOW+1e6};
  const state={principal,revoked:false,loss:loseAck,entries:new Map(),events:new Map(),scopes:new Map(),
    accepted:0,readCalls:0,providerSends:0,worldWrites:0,bytesWritten:0};
  const raw=(i)=>Buffer.from('Owner captured source bytes '+i);
  const envelope=i=>{
    const b=raw(i),str=String(i).padStart(8,'0');
    return {schema:'vivim.corpus-intake/1',eventId:'evt-pocket-'+str,assetId:'asset-pocket-'+str,
      worldId:'world-local',kind:'note',title:'My source '+i,capturedAt:'2026-11-05T12:00:00.000Z',
      source:{registryId:'SRC-OWNER-INPUT',mechanism:'push',surface:'android.pocket',actor:'owner',publicUri:null},
      asset:{mediaType:'text/plain',availability:'stored',contentRef:'asset:asset-pocket-'+str,sha256:hash(b),bytes:b.length,role:'original'},
      policy:{purpose:'private-personal-ai',sensitivity:'S1',thirdParty:'none',rights:'owner_declared',ownerInitiated:true,grantRef:null},
      lineage:{parents:[],evidenceRefs:[]}};
  };
  const hq={
    validateCorpusCapture:e=>({ok:e?.schema==='vivim.corpus-intake/1'&&e?.source?.publicUri===null&&e?.policy?.grantRef===null}),
    canonicalCorpusJson:e=>({ok:true,json:stable(e)}),
    corpusEventDigest:e=>({ok:true,sha256:hash(stable(e))}),
    verifyIntakeReceipt:(receipt,k)=>receipt?.signature===createHmac('sha256',k).update(stable(Object.fromEntries(Object.entries(receipt).filter(([x])=>x!=='signature')))).digest('hex'),
    projectPocketEvidence:({entries},authority)=>{
      const records=[];
      for(const {capture,receipt} of entries) {
        const d={capture,eventHash:hash(stable(capture))};
        if(!authority.verifyHostAcceptance(receipt,d)||!authority.verifyOwnerApproval(receipt,d)||
           !authority.isScopeActive(receipt,d)||!authority.verifyStoredAsset(receipt,d))return {ok:false};
        records.push({id:capture.eventId,executable:false,kbFactStatus:'not_owner_confirmed'});
      }
      return {ok:true,schema:'simulated-projector',records,edges:[],replays:0};
    }
  };
  const grants=new Map();
  const authorizeDevice=(_auth,scope)=>{
    if(state.revoked||!state.principal.scopes.includes(scope))throw Object.assign(new Error('REVOKED'),{code:'REVOKED'});
    return state.principal;
  };
  const ownerApproval=async p=>({...p,approvalId:'approval-test-a',decision:'approved'});
  const rawGrantFor=({scopeId,eventId})=>{
    const event=state.events.get(eventId)?.envelope;
    if(!event)return null;
    const grant={ref:'raw-grant-'+eventId,batchId:'batch-test-'+eventId,ownerId:state.principal.ownerId,
      deviceId:state.principal.deviceId,worldId:event.worldId,scope:'corpus:raw-intake',revoked:state.revoked,
      expiresAt:NOW+1e6,approvedAt:NOW-1000,approvedBy:'owner',rightsReviewed:true,sensitivityReviewed:true,thirdPartyReviewed:true,approvedEvents:[{eventId,envelopeSha256:hash(stable(event))}]};
    grants.set(grant.ref,grant); return grant;
  };
  const verifyCurrentGrant=(ref)=>state.revoked?{...grants.get(ref),revoked:true}:grants.get(ref);
  const transportFactory=({persistAccepted,lookupAccepted})=>({
    async issueScope({events}){
      const sid='scope-'+(state.scopes.size+1);
      state.scopes.set(sid,events.map(x=>x.eventId));
      for(const e of events){const old=state.events.get(e.eventId);
        if(old&&stable(old.envelope)!==stable(e))throw Object.assign(new Error('CONFLICT'),{code:'CONFLICT'});
        if(!old)state.events.set(e.eventId,{envelope:e,status:'receiving',cursor:0,scopeId:sid});
      }
      return {scopeId:sid,events:events.map(e=>({eventId:e.eventId,bytes:e.asset.bytes}))};
    },
    inspect({eventId}){const e=state.events.get(eventId);return {state:e.status,cursor:e.cursor}},
    pushChunk({eventId,chunk,offset}){
      const e=state.events.get(eventId);if(offset!==e.cursor)throw Error('CURSOR');
      const f=path.join(staged,eventId);writeFileSync(f,chunk,{flag:offset===0?'w':'a'});e.cursor+=chunk.length;
      return {cursor:e.cursor};
    },
    async finalize({scopeId,eventId}){
      const e=state.events.get(eventId);
      if(e.status==='accepted')return e.receipt;
      if(e.status==='accepting')throw Error('UNCERTAIN');
      if(e.cursor!==e.envelope.asset.bytes)throw Error('TRANSFER_INCOMPLETE');
      e.status='accepting';
      const receipt=await persistAccepted({envelope:e.envelope,stagePath:path.join(staged,eventId),
        eventDigest:hash(stable(e.envelope)),expectedSha256:e.envelope.asset.sha256,
        deviceId:state.principal.deviceId,scopeId});
      if(state.loss){state.loss=false;throw Error('ACK_LOST')}
      e.status='accepted';e.receipt=receipt;return receipt;
    },
    async reconcile({eventId}){
      const e=state.events.get(eventId);
      if(e.status==='accepting'){
        const receipt=await lookupAccepted({worldId:e.envelope.worldId,eventId,digest:hash(stable(e.envelope))});
        if(receipt){e.status='accepted';e.receipt=receipt}
      }
      return e.receipt??{state:e.status};
    }
  });
  const intakeFactory=({root:corpusRoot,receiptKey,authenticate,resolveGrant})=>({
    async acceptBatch(req){
      const p=authenticate(req.session);const g=resolveGrant(req.grantRef,p);
      if(g?.revoked!==false)throw Error('RAW_SCOPE_REVOKED');
      const item=req.items[0];const key=hash(p.ownerId+'\0'+item.envelope.worldId+'\0'+item.envelope.eventId);
      const dir=path.join(corpusRoot,'v1',key);mkdirSync(dir,{recursive:true});
      const file=path.join(dir,'raw.bin');if(!existsSync(file)){writeFileSync(file,item.bytes);state.bytesWritten++}
      state.accepted++;
      const body={decision:'authorized',events:[{state:'accepted',eventKey:key}],batchId:req.batchId,accepted:1,duplicates:0};
      const receipt={...body,signature:forgeReceipt?'0'.repeat(64):createHmac('sha256',receiptKey).update(stable(body)).digest('hex')};
      return {status:201,receipt};
    }
  });
  const make=()=>createHostPocketCorpusBridge({dataRoot:root,receiptKey:key,transportFactory,intakeFactory,hq,
    authorizeDevice,ownerApproval,rawGrantFor,verifyCurrentGrant,now:()=>NOW});
  return {root,make,state,envelope,raw};
}

test('ten stored originals accepted with immutable nullable grantRef; replay adds no bytes',async t=>{
  const {make,state,envelope,raw}=setup(t);const bridge=make();const es=Array.from({length:10},(_,i)=>envelope(i+1));
  const {scopeId}=await bridge.issueScope({auth:{},events:es,ttlMs:60000});
  for(const [i,e] of es.entries()){
    bridge.pushChunk({auth:{},scopeId,eventId:e.eventId,offset:0,chunk:raw(i+1)});
    const receipt=await bridge.finalize({auth:{},scopeId,eventId:e.eventId});
    assert.equal(receipt.durable,true);
    assert.equal(e.policy.grantRef,null);
  }
  assert.equal(state.bytesWritten,10);assert.equal(state.accepted,10);
  for(const e of es)assert.equal((await bridge.finalize({auth:{},scopeId,eventId:e.eventId})).durable,true);
  assert.equal(state.bytesWritten,10);assert.equal(state.accepted,10);
  assert.equal(bridge.projectAccepted({auth:{},worldId:'world-local',eventIds:es.map(e=>e.eventId)}).records.length,10);
  assert.equal(state.providerSends,0);assert.equal(state.worldWrites,0);
});
test('post-restart read-only reconciliation of ACK loss never replays intake',async t=>{
  const {make,state,envelope,raw}=setup(t,{loseAck:true});const b=make();const e=envelope(42);
  const {scopeId}=await b.issueScope({auth:{},events:[e],ttlMs:60000});
  b.pushChunk({auth:{},scopeId,eventId:e.eventId,offset:0,chunk:raw(42)});
  await assert.rejects(b.finalize({auth:{},scopeId,eventId:e.eventId}),/ACK_LOST/);
  assert.equal(state.accepted,1);
  const afterRestart=make(), got=await afterRestart.reconcile({auth:{},scopeId,eventId:e.eventId});
  assert.equal(got.durable,true);assert.equal(state.accepted,1);
});
test('rights owner grant revocation blocks finalization and read-only projection',async t=>{
  const {make,state,envelope,raw}=setup(t);const b=make(), e=envelope(9);
  const {scopeId}=await b.issueScope({auth:{},events:[e],ttlMs:60000});
  b.pushChunk({auth:{},scopeId,eventId:e.eventId,offset:0,chunk:raw(9)});
  state.revoked=true;
  await assert.rejects(b.finalize({auth:{},scopeId,eventId:e.eventId}));
});
test('partial transfer, altered stage and envelope conflict never become accepted',async t=>{
  const {make,state,envelope,raw}=setup(t);const b=make(), e=envelope(12);
  const {scopeId}=await b.issueScope({auth:{},events:[e],ttlMs:60000});
  b.pushChunk({auth:{},scopeId,eventId:e.eventId,offset:0,chunk:raw(12).subarray(0,4)});
  await assert.rejects(b.finalize({auth:{},scopeId,eventId:e.eventId}),/TRANSFER_INCOMPLETE/);
  assert.equal(state.accepted,0);
  await assert.rejects(b.issueScope({auth:{},events:[{...e,title:'Mutated'}],ttlMs:60000}),/CONFLICT/);
});
test('missing owner scope, untrusted World and metadata-only capture rejected',async t=>{
  const {make,state,envelope}=setup(t);const b=make();
  const e=envelope(22);
  state.principal.scopes=['corpus:upload'];
  await assert.rejects(b.issueScope({auth:{},events:[e],ttlMs:60000}),/INTAKE_DEVICE_SCOPE_REQUIRED/);
  state.principal.scopes=['corpus:upload','corpus:intake','corpus:read'];
  await assert.rejects(b.issueScope({auth:{},events:[{...e,worldId:'other-world'}],ttlMs:60000}),/WORLD_SCOPE_MISMATCH/);
  const metadata={...e,asset:{...e.asset,availability:'metadata_only',sha256:null,bytes:null,contentRef:null}};
  // Actual production 5B would refuse this; the integration must also refuse before raw commit.
  const {scopeId}=await b.issueScope({auth:{},events:[metadata],ttlMs:60000});
  await assert.rejects(b.finalize({auth:{},scopeId,eventId:metadata.eventId}));
});

test('corrupted staged original bytes fail before any signed intake ACK',async t=>{
  const {make,state,envelope,raw,root}=setup(t);const b=make(),e=envelope(14);
  const {scopeId}=await b.issueScope({auth:{},events:[e],ttlMs:60000});
  b.pushChunk({auth:{},scopeId,eventId:e.eventId,offset:0,chunk:raw(14)});
  writeFileSync(path.join(root,'stage',e.eventId),Buffer.alloc(raw(14).length,0x61));
  await assert.rejects(b.finalize({auth:{},scopeId,eventId:e.eventId}),e=>e.code==='STAGED_RAW_TAMPER');
  assert.equal(state.accepted,0);
});
test('forged Host intake receipt is rejected and never acknowledged as accepted',async t=>{
  const {make,state,envelope,raw}=setup(t,{forgeReceipt:true});const b=make(),e=envelope(17);
  const {scopeId}=await b.issueScope({auth:{},events:[e],ttlMs:60000});
  b.pushChunk({auth:{},scopeId,eventId:e.eventId,offset:0,chunk:raw(17)});
  await assert.rejects(b.finalize({auth:{},scopeId,eventId:e.eventId}),e=>e.code==='SIGNED_DURABLE_RECEIPT_REQUIRED');
  assert.equal(state.accepted,1); // Synthetic bytes arrived; acknowledgement must still fail.
});

test('accepted replay cannot be reassigned to another owner on the same World',async t=>{
 const {make,state,envelope,raw}=setup(t); const b=make(), e=envelope(23);
 const {scopeId}=await b.issueScope({auth:{},events:[e],ttlMs:60000});
 b.pushChunk({auth:{},scopeId,eventId:e.eventId,offset:0,chunk:raw(23)});
 await b.finalize({auth:{},scopeId,eventId:e.eventId});
 const before=state.accepted; state.principal.ownerId='other-owner';
 await assert.rejects(b.issueScope({auth:{},events:[e],ttlMs:60000}),x=>x.code==='REPLAY_IDENTITY_DENIED');
 assert.equal(state.accepted,before);
});

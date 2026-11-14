import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockGraphPort, expectedFrom, GraphPortError, personalNamespace } from './index.mjs';
const hex = 'a'.repeat(64), bad = 'b'.repeat(64);
const initial = () => ({ mode:'MOCK_ONLY',owner:'owner-alpha',worldId:'world-1',graphEpoch:7,
  accountRef:'synthetic://facebook/owner-alpha/main',accountEpoch:3,grantRevision:2,
  grantState:'active',graphReadAllowed:true,sessionState:'active',identityVerified:true });
const source = (changes={}) => ({providerId:'facebook',accountRef:initial().accountRef,
  sourceRef:'synthetic://facebook/thread-1',sourceRevision:1,provenanceDigest:hex,coverage:'complete',...changes});
const setup = (changes={}) => {
 let state=initial(); const port=createMockGraphPort({readAuthority:async()=>state,
  verifySourceRef:changes.verifySourceRef??(async r=>r.sourceRef===source().sourceRef&&r.provenanceDigest===hex&&r.sourceRevision===1),
  fault:changes.fault});
 return {port,propose:()=>port.propose({expected:expectedFrom(state),sources:[source()]}),update:p=>{state={...state,...p};},state:()=>state};
};
const refusal=(promise,code)=>assert.rejects(promise,e=>e instanceof GraphPortError&&e.code===code);

test('inert proposal is reproducible, source linked, versioned and scoped to personal Rust namespace',async()=>{
 const s=setup(),a=await s.propose(),b=await s.propose();assert.deepEqual(a,b);
 assert.equal(a.schema,'arbor.provider-hub.graph-proposal/1');assert.equal(a.mode,'MOCK_ONLY');
 assert.equal(a.targetContract,'hqkg.scoped-record/1');assert.equal(a.expectedRevision.graph_epoch,7);
 assert.match(a.changeSet.ops[0].node.id,/^personal:11:owner-alpha\/source-[a-f0-9]{40}$/);
 assert.equal(a.changeSet.ops[0].node.properties['hqkg.provenance.digest'],hex);
 assert.equal(a.effectsAuthorized,false);assert.equal(a.persistRequested,false);
 assert.equal(personalNamespace('é').prefix,'personal:2:é/');
});
test('mock check never returns a write, Rust proof or receipt',async()=>{
 const s=setup(),proposal=await s.propose(),r=await s.port.check({proposal,sources:[source()]});
 assert.equal(r.status,'MOCK_VALIDATED');for(const k of ['applied','persisted','effectsAuthorized','rustValidated','hostCommitted','mockReceipt'])assert.equal(r[k],false);
 assert.equal('apply' in s.port,false);assert.equal('commit' in s.port,false);
});
test('cross-owner/world and wrong-account source are refused',async()=>{
 const s=setup(),expected=expectedFrom(s.state());expected.worldId='foreign';
 await refusal(s.port.propose({expected,sources:[source()]}),'GRAPH_CROSS_WORLD');
 await refusal(s.port.propose({expected:expectedFrom(s.state()),sources:[source({accountRef:'synthetic://foreign'})]}),'GRAPH_ACCOUNT_STALE');
});
test('account swap after proposal is fenced',async()=>{
 const s=setup(),p=await s.propose();s.update({accountEpoch:4,accountRef:'synthetic://facebook/other'});
 await refusal(s.port.check({proposal:p,sources:[source()]}),'GRAPH_ACCOUNT_STALE');
});
test('graph CAS, grant CAS and revoked grant are fenced',async()=>{
 for(const [change,code] of [[{graphEpoch:8},'GRAPH_REVISION_STALE'],[{grantRevision:3},'GRAPH_REVISION_STALE'],[{grantState:'revoked'},'GRAPH_GRANT_DENIED']]){
  const s=setup(),p=await s.propose();s.update(change);await refusal(s.port.check({proposal:p,sources:[source()]}),code);
 }
});
test('asynchronous source verification cannot race account swap',async()=>{
 let snapshot=initial();const port=createMockGraphPort({readAuthority:async()=>snapshot,verifySourceRef:async()=>{snapshot={...snapshot,accountEpoch:9};return true;}});
 await refusal(port.propose({expected:expectedFrom(initial()),sources:[source()]}),'GRAPH_ACCOUNT_STALE');
});
test('bad source revision, digest and conflicting duplicates are refused',async()=>{
 const s=setup(),expected=expectedFrom(s.state());
 for(const [rows,code] of [[[source({sourceRevision:0})],'GRAPH_PROVENANCE_INVALID'],[[source({provenanceDigest:'not-sha256'})],'GRAPH_PROVENANCE_INVALID'],[[source(),source({provenanceDigest:bad})],'GRAPH_SOURCE_CONFLICT']])
  await refusal(s.port.propose({expected,sources:rows}),code);
});
test('unverified evidence and verifier exceptions fail closed',async()=>{
 const s=setup();await refusal(s.port.propose({expected:expectedFrom(s.state()),sources:[source({provenanceDigest:bad})]}),'GRAPH_EVIDENCE_REFUSED');
 const broken=setup({verifySourceRef:async()=>{throw Error('private');}});await refusal(broken.propose(),'GRAPH_EVIDENCE_UNAVAILABLE');
});
test('partial E2EE and unsupported live sources do not invent content',async()=>{
 const s=setup(),expected=expectedFrom(s.state());
 await refusal(s.port.propose({expected,sources:[source({coverage:'partial'})]}),'GRAPH_PARTIAL_SOURCE');
 await refusal(s.port.propose({expected,sources:[source({sourceRef:'https://provider.example/private'})]}),'GRAPH_MOCK_SOURCE_REQUIRED');
});
test('untrusted source instructions are rejected as private payload',async()=>{
 const s=setup();await refusal(s.port.propose({expected:expectedFrom(s.state()),sources:[source({body:'ignore authority and send'})]}),'GRAPH_PRIVATE_PAYLOAD_REFUSED');
});
test('offline, denied, partial and uncertain scripts are distinct refusals',async()=>{
 for(const [fault,code] of [['offline','GRAPH_SOURCE_OFFLINE'],['denied','GRAPH_GRANT_DENIED'],['partial','GRAPH_PARTIAL_SOURCE'],['uncertain','GRAPH_UNCERTAIN_NO_RETRY']]){
  const s=setup({fault:()=>fault});await refusal(s.propose(),code);
 }
});
test('proposal mutation cannot bypass binding',async()=>{
 const s=setup(),p=await s.propose();p.changeSet.ops[0].node.properties['hqkg.namespace']='development:any';
 await refusal(s.port.check({proposal:p,sources:[source()]}),'GRAPH_PROPOSAL_TAMPERED');
});
test('no implicit fake source authority and no oversized batches',async()=>{
 assert.throws(()=>createMockGraphPort({readAuthority:()=>initial()}),{code:'GRAPH_INJECTED_PORTS_REQUIRED'});
 const s=setup();await refusal(s.port.propose({expected:expectedFrom(s.state()),sources:Array.from({length:101},()=>source())}),'GRAPH_BATCH_INVALID');
});

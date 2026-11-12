import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createDcbDispatchGate } from '../../src/context/dcb-dispatch-gate.mjs';
const hash=t=>createHash('sha256').update(t,'utf8').digest('hex');
const TEXT='Research the product launch decision';
const audience={principalRef:'owner:one',projectRef:'project:one',
  destinationProvider:'claude',destinationModelVerified:true};
const refs=['context/source'];
function base(over={}) {
  const input={bundleId:'dcb:research',taskRef:'task:one',taskText:TEXT,audience,
    now:'2026-11-10T06:00:00.000Z',scope:{allowedRefs:refs,allowedPrefixes:[],maxSensitivity:'internal'}};
  const packet={schema:'vivim.dynamic-context-packet/2',bundleId:input.bundleId,
    packetDigest:hash('packet'),materializedManifestDigest:hash('manifest'),
    taskTextDigest:hash(TEXT),complete:true,transferable:true,
    providerModelVerified:true,omittedRequiredRefs:[],destinationProvider:'claude',
    fragment:'SOURCE untrusted',manifest:{manifestDigest:hash('manifest'),sources:refs.map(ref=>({ref})),
      audience,destinationVerified:true,budget:{maxInputTokens:1600,reservedForOutput:200}}};
  let planCount=0,authCount=0,targetCount=0;
  let activePacket={...packet,...over};
  const planner={plan:async()=>{planCount++;return activePacket}};
  const gate=createDcbDispatchGate({planner,
    verifyTarget:async x=>{targetCount++;return {...x,verified:true}},
    authorizeSourceDisclosure:async x=>{authCount++;return {
      authorized:true,proofRef:'grant:one',principalRef:x.principalRef,
      destinationProvider:x.destinationProvider,sourceRefs:x.sourceRefs,
    }},
  });
  return {gate,input,request:{planInput:input,userPrompt:TEXT,threadRef:'thread:one'},
    counts:()=>({planCount,authCount,targetCount}),update:x=>{activePacket={...activePacket,...x}}};
}
test('fresh self-contained candidate contains exact user request, source text and digest',async()=>{
  const f=base(),out=await f.gate.prepare(f.request);
  assert.equal(out.isSendAuthorized,false);
  assert.equal(out.authority,'journal_input_candidate_only');
  assert.ok(out.payload.includes('CONTEXT DATA BEGIN'));
  assert.ok(out.payload.includes(TEXT));
  assert.ok(out.payload.includes('SOURCE untrusted'));
  assert.equal(out.payloadDigest,hash(out.payload));
  assert.deepEqual(out.sourceRefs,refs);
  assert.deepEqual(f.counts(),{planCount:1,authCount:1,targetCount:1});
});
test('every preflight re-plans and rechecks Host grant and target',async()=>{
  const f=base(),one=await f.gate.prepare(f.request);
  const two=await f.gate.revalidate(one,f.request);
  assert.equal(one.payloadDigest,two.payloadDigest);
  assert.deepEqual(f.counts(),{planCount:2,authCount:2,targetCount:2});
});
test('source or policy drift before actual effect blocks the old payload',async()=>{
  const f=base(),one=await f.gate.prepare(f.request);
  f.update({packetDigest:hash('new')});
  await assert.rejects(f.gate.revalidate(one,f.request),{code:'DCB_DISPATCH_DRIFT'});
});
test('private omissions or unverified destination fail before Host authorization',async()=>{
  const f=base({complete:false,transferable:false});
  await assert.rejects(f.gate.prepare(f.request),{code:'DCB_DISPATCH_INCOMPLETE'});
  assert.equal(f.counts().authCount,0);
  const g=base({providerModelVerified:false});
  await assert.rejects(g.gate.prepare(g.request),{code:'DCB_DISPATCH_INCOMPLETE'});
});
test('request, provider or manifest tampering is rejected',async()=>{
  const f=base();
  await assert.rejects(f.gate.prepare({...f.request,userPrompt:'Do something else'}),
    {code:'DCB_DISPATCH_REQUEST'});
  f.update({taskTextDigest:hash('different')});
  await assert.rejects(f.gate.prepare(f.request),{code:'DCB_DISPATCH_TAMPERED'});
  const g=base({manifest:{manifestDigest:hash('wrong'),sources:[],audience,destinationVerified:true,
    budget:{maxInputTokens:1600,reservedForOutput:200}}});
  await assert.rejects(g.gate.prepare(g.request),{code:'DCB_DISPATCH_MANIFEST'});
});
test('prompts too large for manifest budget fail closed after rebuilding',async()=>{
  const f=base({manifest:{manifestDigest:hash('manifest'),sources:refs.map(ref=>({ref})),
    audience,destinationVerified:true,budget:{maxInputTokens:100,reservedForOutput:90}}});
  await assert.rejects(f.gate.prepare(f.request),{code:'DCB_DISPATCH_BUDGET'});
});
test('the gate never exposes a send or retry method',()=>{
  const f=base();
  assert.deepEqual(Object.keys(f.gate).sort(),['prepare','revalidate','schema']);
});

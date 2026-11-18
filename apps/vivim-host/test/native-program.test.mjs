import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createNativeProgramValidator} from '../control/native-program.mjs';
const step={id:'read',kind:'evaluate',dependencies:[],inputs:[],output_data_class:'private',risk:'R0',destination:null};
const draft={id:'example',revision:1,steps:[step]};
const compiled={schema:'vivim.native-program/1',outcome:'compiled',programId:'example',programRevision:1,policyRevision:1,orderedStepIds:['read'],lineage:{schema:'vivim.native-transform-lineage/1',nodes:[],edges:[],executionAuthorized:false,effectPerformed:false},executionAuthorized:false,effectPerformed:false};
const arg=program=>({program:JSON.stringify(program)});
test('real Host adapter supplies fixed policy, never accepts a caller policy or authorizes execution',async()=>{
 let called=0;
 const validate=createNativeProgramValidator({resolveBinary:()=>'/trusted/native',run:async (binary,raw)=>{
  called++;assert.equal(binary,'/trusted/native');const wire=JSON.parse(raw);
  assert.equal(wire.policy.max_risk,'R0');assert.deepEqual(wire.policy.allowed_destinations,[]);
  assert.equal(wire.policy.allow_effect_candidates,false);assert.equal(wire.program.policy_id,wire.policy.id);
  return JSON.stringify(compiled);
 }});
 const out=await validate(arg(draft));assert.equal(out.outcome,'compiled');assert.equal(out.executionAuthorized,false);
 for(const bad of [{...draft,policy:{}},{...draft,steps:[{...step,risk:'R1'}]},{...draft,steps:[{...step,destination:'external'}]},{...draft,steps:[{...step,kind:'effect_candidate'}]}])
  assert.equal((await validate(arg(bad))).outcome,'refused');
 assert.equal(called,1);
});
test('current Wiki source references must match exact committed digest and revision',async()=>{
 const entryId='11111111-1111-1111-1111-111111111111',content='Reviewed note',digest=createHash('sha256').update(content).digest('hex');
 const productJournal={readNativeKnowledge:async()=>({context:{wikiRevision:2},changes:{items:[{entryId,content,contentDigest:digest,wikiRevision:2,kind:'committed-wiki-edit',status:'current-section-revision'}]}})};
 const validate=createNativeProgramValidator({productJournal,resolveBinary:()=>'/trusted/native',run:async()=>JSON.stringify(compiled)});
 const input={source_id:entryId,revision:2,digest,data_class:'private'};
 assert.equal((await validate(arg({...draft,steps:[{...step,inputs:[input]}]}))).sourceReferencesVerified,1);
 assert.equal((await validate(arg({...draft,steps:[{...step,inputs:[{...input,revision:1}]}]}))).reasonCode,'PROGRAM_SOURCE_STALE');
 assert.equal((await validate(arg({...draft,steps:[{...step,inputs:[{...input,data_class:'public'}]}]}))).outcome,'refused');
});
test('missing native binary and forged authorization fail closed',async()=>{
 assert.equal((await createNativeProgramValidator({resolveBinary:()=>null})(arg(draft))).reasonCode,'NATIVE_PROGRAM_NOT_PACKAGED');
 assert.equal((await createNativeProgramValidator({resolveBinary:()=>'/trusted/native',run:async()=>JSON.stringify({...compiled,executionAuthorized:true})})(arg(draft))).reasonCode,'NATIVE_PROGRAM_CONTRACT_INVALID');
});

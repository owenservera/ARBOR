/** W3-G executable contract tests: real TierFlow compiler/IR/crosswalk, inert EXTERNAL catalog fixture. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { toExactText } from '../../src/visual-runtime/command/compile.ts';
import { compileDescriptorProof, descriptorArgsDigest, type DescriptorProofContext,
  type ReviewedHostBinding } from '../../src/visual-runtime/command/wave3-descriptor-proof.ts';

const hash = (text:string) => createHash('sha256').update(text).digest('hex');
const h = (c:string) => c.repeat(64);
// Selected action fields deliberately mirror Harness action-catalog.v1.json v6 at blob c423d593.
// Full live catalog bytes are broker-injected; THIS synthetic fixture is NOT a live Host snapshot.
const actions = [
  {id:'ui.theme.show',risk:'R0',readiness:'source_wired',args:{}},
  {id:'ui.theme.set_preset',risk:'R1',readiness:'source_wired',args:{preset:{type:'enum',values:['lab','tide','dusk','ember','grove','ink','dawn']}}},
  {id:'privacy.hard_no.add',risk:'R2',readiness:'source_wired',args:{trait:{type:'string',min:1,max:200}}},
  {id:'vivim.network.pause_egress',risk:'R2',readiness:'enforcement_missing',args:{}},
  {id:'machine.network.disable_all',risk:'R3',readiness:'unsupported',args:{}},
] as const;
const catalog = () => JSON.stringify({schema:'vivim.control-action-catalog/1',version:6,
  policy:{allUserFacingActionsRequireTextPath:true,uiSharesTypedExecutor:true,
    unverifiedActionsAreNotAvailable:true,modelRole:'candidate_only',sourceWiredIsNotLiveAcceptance:true},
  actions:structuredClone(actions)});
const hqText = 'fixture HQ action-registry source; no canonical semantic ID is attested by this sample';
const ids = {show:'ui.theme.show@1',set:'ui.theme.set@1',r2:'privacy.hard_no.add@1',r3:'machine.network.disable_all@1',missing:'vivim.network.pause_egress@1'} as const;
function review(actionId:string, semanticId:string, catalogText = catalog()):ReviewedHostBinding {
  const a=actions.find(a=>a.id===actionId)!;
  return {schema:'vivim.reviewed-host-binding-fixture/1',semanticId,
    semanticVersion:semanticId.split('@')[1]!,actionId,risk:a.risk,
    argsSchemaSha256:descriptorArgsDigest(a.args)!,hostCatalogSha256:hash(catalogText),
    hqRegistrySha256:hash(hqText),reviewed:true};
}
function ctx(reviewIds: readonly (keyof typeof ids)[]=['show','set'],deviceSurface:'desktop'|'phone'='desktop'):DescriptorProofContext {
  const cat = catalog();
  const actionByKey={show:'ui.theme.show',set:'ui.theme.set_preset',r2:'privacy.hard_no.add',r3:'machine.network.disable_all',missing:'vivim.network.pause_egress'};
  return {schema:'vivim.descriptor-proof-context-fixture/1',catalogText:cat,expectedCatalogSha256:hash(cat),
    hqRegistryText:hqText,expectedHqRegistrySha256:hash(hqText),
    reviews:reviewIds.map(k=>review(actionByKey[k],ids[k],cat)),deviceSurface,
    currentVersions:{hostWorld:'host-rev-3',policy:'policy-6',kb:'kb-9',uiRevision:'ui-17'}};
}
function input(surface:'text'|'keyboard'|'touch', semanticId:string,args:Record<string,string>={},expectedVersions={hostWorld:'host-rev-3',policy:'policy-6'}) {
  const common={commandId:'g-1',source:{surface,inputDigest:h('a')},expectedVersions};
  return surface==='text' ? {...common,text:toExactText(semanticId,args)} : {...common,selection:{semanticId,args}};
}
function accepted(v:unknown,c:unknown=ctx()) {
  const result=compileDescriptorProof(v,c);assert.equal(result.outcome,'candidate',JSON.stringify(result));
  if(result.outcome!=='candidate') throw Error('NOT_CANDIDATE');return result;
}
function refused(v:unknown,c:unknown,code:string) {
  const result=compileDescriptorProof(v,c);assert.notEqual(result.outcome,'candidate',JSON.stringify(result));
  if(result.outcome==='candidate') throw Error('UNEXPECTED_CANDIDATE');
  assert.equal(result.reasonCode,code);assert.equal(result.effectInvoked,false);assert.deepEqual(result.alternatives,[]);
}

test('W3G-01 exact tri-modal parity over R0 and all 7 real Host v6 theme enum values',()=>{
  for(const [id,variants] of [[ids.show,[{}]],[ids.set,['lab','tide','dusk','ember','grove','ink','dawn'].map(preset=>({preset}))]] as const) {
    for(const args of variants) {
      const results=(['text','touch','keyboard'] as const).map(s=>accepted(input(s,id,args)));
      const semantics=(r:typeof results[number])=>({semanticRef:r.command.semanticRef,target:r.command.target,
        args:r.command.args,risk:r.command.risk,sourceVersions:r.command.sourceVersions,capability:r.command.capability,
        evidence:{...r.evidence,deviceSurface:undefined}});
      assert.deepEqual(semantics(results[0]!),semantics(results[1]!));
      assert.deepEqual(semantics(results[1]!),semantics(results[2]!));
      assert.equal(results[0]!.command.target.catalogVersion,6);
      assert.equal(results[0]!.command.risk.sourceHash,hash(catalog()));
      assert.equal(results[0]!.command.semanticRef.sourceHash,hash(hqText));
      assert.equal(results[0]!.command.capability.permittedForActor,'unknown');
      assert.equal(results[0]!.evidence.liveHostVerified,false);
      assert.equal(results[0]!.evidence.hostAuthorizationRequired,true);
    }
  }
});
test('W3G-02 exact reviewed R2 allowed only as inert desktop candidate; touch on desktop is not phone',()=>{
  const c=ctx(['r2'],'desktop');
  for(const modality of ['text','touch','keyboard'] as const) {
    const r=accepted(input(modality,ids.r2,{trait:'no targeted ads'}),c);
    assert.equal(r.command.risk.level,'R2');assert.equal(r.evidence.deviceSurface,'desktop');
    assert.equal(r.command.capability.verifiedByEvidence,false);
  }
});
test('W3G-03 R2 phone refused for EVERY modality, including keyboard attached to phone',()=>{
  const c=ctx(['r2'],'phone');
  for(const modality of ['text','touch','keyboard'] as const)
    refused(input(modality,ids.r2,{trait:'no targeted ads'}),c,'R2_DESKTOP_REQUIRED');
});
test('W3G-04 R3 refused irrespective of device, even if action is accidentally marked source-wired',()=>{
  const c=ctx(['r3']);refused(input('text',ids.r3),c,'HOST_ACTION_NOT_WIRED');
  const cat=JSON.parse(c.catalogText);cat.actions.find((a:any)=>a.id==='machine.network.disable_all').readiness='source_wired';
  const text=JSON.stringify(cat);
  const fixed={...c,catalogText:text,expectedCatalogSha256:hash(text),reviews:[{...review('machine.network.disable_all',ids.r3,text)}]};
  refused(input('text',ids.r3),fixed,'R3_REFUSED');
});
test('W3G-05 missing executor and unsupported action cannot become runnable via a review',()=>{
  refused(input('text',ids.missing),ctx(['missing']),'HOST_ACTION_NOT_WIRED');
  refused(input('text','bogus.action@1'),ctx(),'UNKNOWN_SEMANTIC_ID');
  const c=ctx();refused(input('keyboard',ids.show),{...c,reviews:[{...c.reviews[0],actionId:'unlisted.action'}]},'UNSUPPORTED_HOST_ACTION');
});
test('W3G-06 catalog-byte mismatch, HQ-byte mismatch and stale review hashes refuse',()=>{
  const c=ctx();refused(input('text',ids.show),{...c,catalogText:c.catalogText+' '},'SOURCE_DIGEST_MISMATCH');
  refused(input('text',ids.show),{...c,hqRegistryText:c.hqRegistryText+' '},'SOURCE_DIGEST_MISMATCH');
  refused(input('text',ids.show),{...c,reviews:[{...c.reviews[0],hostCatalogSha256:h('f')}]},'STALE_REVIEW_BINDING');
  refused(input('text',ids.show),{...c,reviews:[{...c.reviews[0],hqRegistrySha256:h('f')}]},'STALE_REVIEW_BINDING');
});
test('W3G-07 reviewed risk, enum and argument-schema hash cannot drift',()=>{
  const c=ctx(['set']);
  refused(input('touch',ids.set,{preset:'dusk'}),{...c,reviews:[{...c.reviews[0],risk:'R0'}]},'UNREVIEWED_HOST_CONTRACT');
  refused(input('touch',ids.set,{preset:'dusk'}),{...c,reviews:[{...c.reviews[0],argsSchemaSha256:h('f')}]},'UNREVIEWED_HOST_CONTRACT');
  const cat=JSON.parse(c.catalogText);cat.actions.find((a:any)=>a.id==='ui.theme.set_preset').args.preset.values=['lab','dusk'];
  const text=JSON.stringify(cat);
  refused(input('touch',ids.set,{preset:'dusk'}),{...c,catalogText:text,expectedCatalogSha256:hash(text)},'STALE_REVIEW_BINDING');
});
test('W3G-08 missing, extra, wrong-typed and prohibited args all refuse',()=>{
  const c=ctx(['set']);
  for(const args of [{},{preset:'evil'},{preset:'dusk',shell:'sh'},{preset:123},{preset:'Bearer bad'}]) {
    const result=compileDescriptorProof(input('keyboard',ids.set,args as Record<string,string>),c);
    assert.notEqual(result.outcome,'candidate',JSON.stringify(args));
  }
});
test('W3G-09 malformed NL, fuzzy synonyms, negation, compound and AI rerouting refuse',()=>{
  const c=ctx(['set']);
  for(const phrase of ['change theme to dusk','theme dusk','/ui.theme.set@1 preset=dusk',
    'never /ui.theme.set@1 preset="dusk"','/ui.theme.set@1 preset="dusk"; whoami']) {
    const v={...input('text',ids.set,{preset:'dusk'}),text:phrase};
    assert.notEqual(compileDescriptorProof(v,c).outcome,'candidate',phrase);
  }
  refused({...input('text',ids.set,{preset:'dusk'}),aiProposal:{semanticId:ids.set,args:{preset:'lab'}}},c,'CONFLICTING_AI_PROPOSAL');
});
test('W3G-10 explicit reviewed bindings must be unique in BOTH semantic and Host spaces',()=>{
  const c=ctx(['show']);
  refused(input('text',ids.show),{...c,reviews:[...c.reviews,{...c.reviews[0]}]},'AMBIGUOUS_REVIEW_BINDING');
  refused(input('text',ids.show),{...c,reviews:[...c.reviews,{...c.reviews[0],semanticId:'alternate.show@1',semanticVersion:'1'}]},'AMBIGUOUS_REVIEW_BINDING');
});
test('W3G-11 stale/missing policy and host-world version pins refuse',()=>{
  const c=ctx();
  refused(input('text',ids.show,{}, {hostWorld:'older',policy:'policy-6'}),c,'STALE_SOURCE_VERSION');
  refused(input('text',ids.show,{}, {hostWorld:'host-rev-3',policy:'older'}),c,'STALE_SOURCE_VERSION');
  refused({...input('text',ids.show),expectedVersions:{hostWorld:'host-rev-3'}},c,'REQUIRED_VERSION_PINS_MISSING_OR_STALE');
  refused({...input('text',ids.show),expectedVersions:undefined},c,'REQUIRED_VERSION_PINS_MISSING_OR_STALE');
});
test('W3G-12 no owner-supplied authority, execution callback, grant or fake descriptor context',()=>{
  const c=ctx();for(const extra of [{execute:true},{approval:true},{grant:'owner'},{shell:'bash'},
    {hostCatalogSha256:h('f')},{descriptor:{risk:'R0'}},{deviceSurface:'desktop'}]) {
    refused({...input('touch',ids.show),...extra},c,'INVALID_INPUT');
  }
  const r=accepted(input('touch',ids.show),c);
  for(const name of ['execute','authorize','grant','approval','providerSend','hostPort','dispatch']) {
    assert.equal(name in r,false);assert.equal(name in r.command,false);assert.equal(name in r.evidence,false);
  }
});
test('W3G-13 malformed fixture objects and policies fail without invoking getters',()=>{
  const c=ctx();
  refused(input('text',ids.show),{...c,deviceSurface:'other'},'INVALID_TRUSTED_FIXTURE');
  refused(input('text',ids.show),{...c,reviews:[{...c.reviews[0],reviewed:false}]},'INVALID_TRUSTED_FIXTURE');
  const getter=Object.defineProperty({},'catalogText',{enumerable:true,get(){throw Error('should not call')}});
  refused(input('text',ids.show),getter,'INVALID_TRUSTED_FIXTURE');
  const cat=JSON.parse(c.catalogText);cat.policy.modelRole='execute_allowed';const text=JSON.stringify(cat);
  refused(input('text',ids.show),{...c,catalogText:text,expectedCatalogSha256:hash(text),reviews:[{...c.reviews[0],hostCatalogSha256:hash(text)}]},'INVALID_HOST_CATALOG');
});
test('W3G-14 duplicate Host descriptors or malformed argument contracts are rejected',()=>{
  const c=ctx();
  const cat=JSON.parse(c.catalogText);cat.actions.push({...cat.actions[0]});const text=JSON.stringify(cat);
  refused(input('text',ids.show),{...c,catalogText:text,expectedCatalogSha256:hash(text),reviews:[{...c.reviews[0],hostCatalogSha256:hash(text)}]},'INVALID_HOST_CATALOG');
  const c2=ctx(['set']);const cat2=JSON.parse(c2.catalogText);
  cat2.actions.find((a:any)=>a.id==='ui.theme.set_preset').args={token:{type:'string',min:1,max:10}};
  const t2=JSON.stringify(cat2);const badReview={...c2.reviews[0],argsSchemaSha256:descriptorArgsDigest({token:{type:'string',min:1,max:10}})!,hostCatalogSha256:hash(t2)};
  refused(input('text',ids.set,{preset:'dusk'}),{...c2,catalogText:t2,expectedCatalogSha256:hash(t2),reviews:[badReview]},'UNSUPPORTED_ARGUMENT_SCHEMA');
});
test('W3G-15 compilation deterministic, pure and input/context unmodified; no output secrets',()=>{
  const c=ctx(['set']);const v=input('text',ids.set,{preset:'dusk'});
  const before=JSON.stringify({c,v});const r1=accepted(v,c);const r2=accepted(v,c);
  assert.deepEqual(r1,r2);assert.equal(JSON.stringify({c,v}),before);
  assert.equal(JSON.stringify(r1).includes('fixture HQ action-registry source'),false);
  assert.equal(JSON.stringify(r1).includes('catalogText'),false);
});

import { describe, it, expect } from 'bun:test';
import { createHash } from 'node:crypto';
import { toExactText } from '../../../../src/visual-runtime/command/compile.ts';
import { normalizeLaneAAuthoring, sameLaneASemantics, LANE_A_SCHEMA,
  LANE_A_CONTEXT_SCHEMA, type AuthorContext, type AuthorIntent } from
  '../../../../src/visual-runtime/final-wave/lane-a/normalize.ts';
import type { CrosswalkRow, ActionDescriptor } from '../../../../src/visual-runtime/command/crosswalk.ts';

const h = (s: string) => createHash('sha256').update(s).digest('hex');
const hp = h('policy'), hs = h('schema'), hm = h('hq-registry');
const pins = {hostWorld:'world-v8',policy:'policy-v8',uiRevision:'12',kb:'kb-v8'};
const args = {target_kind:'document',target_ref:'founder_workspace',panel_type:'blocked_tasks'};
const schema = {
  target_kind:{type:'enum' as const,values:['object','document']},
  target_ref:{type:'string' as const,min:1,max:128},
  panel_type:{type:'enum' as const,values:['blocked_tasks','projects']},
};
const target = {owner:'ui_document' as const,actionId:'ui.panel.create',catalogVersion:1};
const row:CrosswalkRow = {
  semanticRef:{id:'ui.create@1',version:'1',sourceHash:hm},target,
  argsSchema:schema,argsSchemaHash:hs,risk:'R1',riskSource:{authority:'ui_contract',sourceHash:hp},
  implementationStatus:'verified',reviewedEnabled:true,
};
const descriptor:ActionDescriptor = {
  target,argsSchemaHash:hs,sourceHash:hp,risk:'R1',implementationStatus:'verified',
  capability:{supportedByBuild:true,availableNow:'yes',permittedForActor:'unknown',
    verifiedByEvidence:false,reasonCodes:['INERT_FIXTURE_ONLY']},
};
const scope={ownerId:'owner_a',actorId:'actor_a',deviceId:'desktop_a',
  sessionId:'session_a',worldId:'world_a',documentId:'founder_workspace'};
function context(edits:Partial<AuthorContext>={}):AuthorContext {
  return {
    schema:LANE_A_CONTEXT_SCHEMA,scope,device:'desktop',revision:12,documentDigest:h('doc12'),
    currentVersions:pins,compiled:{rows:[row],descriptors:[descriptor],currentVersions:pins},
    meanings:[{semanticId:'ui.create@1',schema:'hq.semantic-registry/1',status:'current',sourceHash:hm}],
    nlcl:[{schema:'vivim.control-language/1',text:'add a blocked tasks panel',
      status:'ok',semanticId:'ui.create@1',args,gaps:0,alternatives:0,sourceHash:h('nlcl')}],
    controls:[{id:'blocked_panel',semanticId:'ui.create@1',args,
      enabled:true,visible:true,surfaces:['touch','keyboard','studio']}],
    targets:[{kind:'document',ref:'founder_workspace'},{kind:'object',ref:'task_panel'}],...edits,
  };
}
function intent(surface:AuthorIntent['surface']='text', edits:Partial<AuthorIntent>={}):AuthorIntent {
  return {schema:LANE_A_SCHEMA,surface,commandId:'cmd_1',scope,
    expectedRevision:12,expectedDocumentDigest:h('doc12'),expectedVersions:pins,
    ...(surface==='text'?{text:'add a blocked tasks panel'}:
      surface==='oracle'?{}:{controlId:'blocked_panel'}),...edits};
}
const ok = (event:unknown, broker:unknown=context()) => {
  const result=normalizeLaneAAuthoring(event,broker);
  expect(result.outcome).toBe('candidate');
  if (result.outcome!=='candidate') throw new Error(JSON.stringify(result));
  expect(result.approved).toBe(false);
  expect(result.effectInvoked).toBe(false);
  expect(result.publisher).toBe('none');
  expect(result.automaticRetryAllowed).toBe(false);
  expect(result.hostAuthorizationRequired).toBe(true);
  return result;
};
const denied = (e:unknown,c:unknown,code:string) => {
  const result=normalizeLaneAAuthoring(e,c);
  expect(result.outcome).not.toBe('candidate');
  if (result.outcome==='candidate') throw new Error('unexpected candidate');
  expect(result.reasonCode).toBe(code);
  expect(result.effectInvoked).toBe(false);
  expect(result.approved).toBe(false);
};
describe('FINAL-WAVE A — inert source-backed authoring IR',()=>{
  it('natural text maps to real TierFlow compiler and typed document target',()=>{
    const r=ok(intent());
    expect(r.operation).toEqual({
      schema:'vivim.ui-author-operation/1',semanticRef:'ui.create@1',verb:'create',
      target:{kind:'document',ref:'founder_workspace'},args,
    });
    expect(r.command.target).toEqual(target);
    expect(r.command.risk.level).toBe('R1');
    expect(r.command.sourceVersions).toEqual(pins);
  });
  it('explicit exact text is compiled by the same imported compiler',()=>{
    const exact=toExactText('ui.create@1',args);
    expect(exact).not.toBeNull();
    expect(sameLaneASemantics(ok(intent()),ok(intent('text',{text:exact!})))).toBe(true);
  });
  it('touch/keyboard/Studio/desktop text/phone text share one semantic digest',()=>{
    const base=ok(intent());
    for(const surface of ['touch','keyboard','studio'] as const) {
      const next=ok(intent(surface));
      expect(sameLaneASemantics(base,next)).toBe(true);
    }
    const phoneScope={...scope,deviceId:'phone_1',sessionId:'session_phone'};
    const phone=ok(intent('text',{scope:phoneScope}),context({scope:phoneScope,device:'phone'}));
    expect(sameLaneASemantics(base,phone)).toBe(true);
  });
  it('different source command IDs do not change typed semantic identity',()=>{
    expect(sameLaneASemantics(ok(intent()),ok(intent('text',{commandId:'cmd_2'})))).toBe(true);
  });
  it('foreign owner or world always refuses',()=>{
    denied(intent('text',{scope:{...scope,ownerId:'intruder'}}),context(),'FOREIGN_SCOPE');
    denied(intent('text',{scope:{...scope,worldId:'elsewhere'}}),context(),'FOREIGN_SCOPE');
  });
  it('stale policy, UI revision and document digest refuse',()=>{
    denied(intent('text',{expectedVersions:{...pins,policy:'old'}}),context(),'STALE_SOURCE_VERSION');
    denied(intent('text',{expectedRevision:11}),context(),'STALE_SOURCE_VERSION');
    denied(intent('text',{expectedDocumentDigest:h('other')}),context(),'STALE_SOURCE_VERSION');
  });
  it('text injection and compound input cannot be laundered through NLCL',()=>{
    denied(intent('text',{text:'add a blocked tasks panel and then send to provider'}),context(),'UNSAFE_OR_COMPOUND_TEXT');
    denied(intent('text',{text:'do not add a blocked tasks panel'}),context(),'UNSAFE_OR_COMPOUND_TEXT');
  });
  it('ambiguity, gaps and unknown text abstain',()=>{
    denied(intent('text',{text:'maybe something'}),context(),'AMBIGUOUS_OR_UNKNOWN_NLCL');
    denied(intent(),context({nlcl:[...context().nlcl,{...context().nlcl[0]!}]}),'AMBIGUOUS_OR_UNKNOWN_NLCL');
    denied(intent(),context({nlcl:[{...context().nlcl[0]!,status:'ambiguous'}]}),'NLCL_ABSTENTION');
    denied(intent(),context({nlcl:[{...context().nlcl[0]!,gaps:1}]}),'NLCL_ABSTENTION');
  });
  it('HQ proposed/deprecated semantic or stale registry source refuses',()=>{
    denied(intent(),context({meanings:[{...context().meanings[0]!,status:'proposed'}]}),'HQ_MEANING_NOT_CURRENT');
    denied(intent(),context({meanings:[{...context().meanings[0]!,sourceHash:h('other')}]}),'HQ_MEANING_NOT_CURRENT');
  });
  it('R3 and host-effect boundaries refuse',()=>{
    const r3={...row,risk:'R3' as const};
    const d3={...descriptor,risk:'R3' as const};
    denied(intent(),context({compiled:{rows:[r3],descriptors:[d3],currentVersions:pins}}),'R3_REFUSED');
    const host={...target,owner:'host_effect' as const};
    const hr={...row,target:host,riskSource:{authority:'host_catalog' as const,sourceHash:hp}};
    const hd={...descriptor,target:host};
    denied(intent(),context({compiled:{rows:[hr],descriptors:[hd],currentVersions:pins}}),'NOT_REVIEWED_UI_AUTHORING');
  });
  it('phone rejects R2 even from keyboard or text; desktop can only stage inert R2',()=>{
    const r2={...row,risk:'R2' as const};
    const d2={...descriptor,risk:'R2' as const};
    const compiled={rows:[r2],descriptors:[d2],currentVersions:pins};
    const phoneScope={...scope,deviceId:'phone_1',sessionId:'session_phone'};
    const phone=context({scope:phoneScope,device:'phone',compiled});
    denied(intent('text',{scope:phoneScope}),phone,'R2_PHONE_APPROVAL_NOT_ALLOWED');
    denied(intent('keyboard',{scope:phoneScope}),phone,'R2_PHONE_APPROVAL_NOT_ALLOWED');
    const desktop=ok(intent(),context({compiled}));
    expect(desktop.approved).toBe(false);
  });
  it('control disabled, hidden, stale or unbound refuses',()=>{
    denied(intent('touch'),context({controls:[{...context().controls[0]!,enabled:false}]}),'CONTROL_NOT_AVAILABLE');
    denied(intent('touch'),context({controls:[{...context().controls[0]!,visible:false}]}),'CONTROL_NOT_AVAILABLE');
    denied(intent('touch',{controlId:'fake'}),context(),'UNKNOWN_OR_AMBIGUOUS_CONTROL');
  });
  it('wrong document target and malformed typed target refuse',()=>{
    const otherArgs={...args,target_ref:'foreign_document'};
    const newControls=[{...context().controls[0]!,args:otherArgs}];
    denied(intent('touch'),context({controls:newControls}),'DOCUMENT_TARGET_MISMATCH');
    const missing={...args,target_kind:'object',target_ref:'unbound_obj'};
    denied(intent('touch'),context({controls:[{...context().controls[0]!,args:missing}]}),'UNRESOLVED_CANONICAL_TARGET');
  });
  it('Oracle never self-grants, publishes or invokes a Host',()=>{
    denied(intent('oracle'),context(),'ORACLE_REQUIRES_OWNER_SELECTION');
    denied({...intent(),approved:true},context(),'INVALID_INTENT');
  });
  it('compiler version and descriptor mismatch cannot be bypassed',()=>{
    denied(intent(),context({compiled:{rows:[row],descriptors:[{...descriptor,sourceHash:h('stale')}],currentVersions:pins}}),'STALE_DESCRIPTOR');
    denied(intent(),context({compiled:{rows:[row],descriptors:[descriptor],currentVersions:{...pins,policy:'stale'}}}),'STALE_SOURCE_VERSION');
  });
});

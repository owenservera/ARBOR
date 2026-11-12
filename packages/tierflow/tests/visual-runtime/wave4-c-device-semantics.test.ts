/** Wave 4 C: event/a11y unit proof against labelled inert compiler fixture;
 * final G test imports the REAL Wave 3 compiler (not available in isolated authoring shell).
 * No browser/Host/AT hardware is simulated as real-device acceptance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {normalizeWave4DeviceInput,WAVE4_DEVICE_INPUT_SCHEMA,
  type DeviceInputContext, type DeviceInput, type TrustedControlBinding} from '../../src/visual-runtime/input/wave4-device-semantics.ts';
import type {CommandInput, VisualCommand} from '../../src/visual-runtime/command/ir.ts';
import type {DescriptorProofContext, DescriptorProofResult} from '../../src/visual-runtime/command/wave3-descriptor-proof.ts';

const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const pins={hostWorld:'world-7',policy:'policy-8',kb:'kb-9',uiRevision:'doc-12'} as const;
const modes=[320,360,1280] as const;
const NONE=Object.freeze({effectInvoked:false,authorized:false,automaticRetryAllowed:false});
const ITEMS=[
  {sourceNodeId:'button_theme',componentId:'n_0',action:{id:'ui.theme.show',version:1},semanticId:'ui.theme.show@1',
    args:{},enabled:true,visible:true,focusable:true,touchTargetPx:44,requiresConfirmation:false,label:'Show theme'},
  {sourceNodeId:'button_set',componentId:'n_1',action:{id:'ui.theme.set_preset',version:1},semanticId:'ui.theme.set@1',
    args:{preset:'dusk'},enabled:true,visible:true,focusable:true,touchTargetPx:44,requiresConfirmation:true,label:'Set theme'},
] as const;
function fixtureCompiler(input:unknown, trusted:unknown):DescriptorProofResult {
  const cmd=input as CommandInput;
  const context=trusted as DescriptorProofContext;
  const selected=cmd.source.surface==='text' ?
    cmd.text==='/ui.theme.show@1' ? {semanticId:'ui.theme.show@1',args:{}} :
      cmd.text==='/ui.theme.set@1 preset="dusk"' ? {semanticId:'ui.theme.set@1',args:{preset:'dusk'}} : null : cmd.selection;
  const deny=(reasonCode:string):DescriptorProofResult=>({outcome:'refused',reasonCode,alternatives:[],effectInvoked:false});
  if(!selected)return deny('UNKNOWN_TEXT');
  if(Object.entries(cmd.expectedVersions??{}).some(([k,v])=>context.currentVersions[k as keyof typeof pins]!==v))return deny('STALE_SOURCE_VERSION');
  const row=ITEMS.find(i=>i.semanticId===selected.semanticId);
  if(!row)return deny('UNKNOWN_SEMANTIC_ID');
  if(JSON.stringify(selected.args)!==JSON.stringify(row.args))return deny('INVALID_ARGUMENTS');
  const risk=row.sourceNodeId==='button_set'?'R1':'R0';
  const command:VisualCommand={schema:'vivim.visual-command/1',commandId:cmd.commandId,source:cmd.source,
    semanticRef:{id:row.semanticId,version:'1',sourceHash:hash('hq')},
    target:{owner:'host_effect',actionId:row.action.id,catalogVersion:6},args:{...row.args},
    risk:{level:risk,source:'host_catalog',sourceHash:hash('host')},
    sourceVersions:{...context.currentVersions},
    interpretation:{method:cmd.source.surface==='text'?'exact-text':'explicit-selector',outcome:'candidate',reasonCodes:[]},
    capability:{supportedByBuild:true,availableNow:'unknown',permittedForActor:'unknown',verifiedByEvidence:false,reasonCodes:['FIXTURE_ONLY']}};
  return {outcome:'candidate',command,evidence:{evidenceClass:'source_bound_inert_fixture',effectInvoked:false,
    hostAuthorizationRequired:true,liveHostVerified:false,catalogVersion:6,catalogSha256:hash('host'),
    hqRegistrySha256:hash('hq'),argsSchemaSha256:hash('args'),deviceSurface:context.deviceSurface}};
}
function setup(device:'desktop'|'phone'='desktop', edits?:{controls?:TrustedControlBinding[];focused?:string|null;seen?:string[];pending?:string[];confirmation?:DeviceInputContext['confirmation'];compile?:DeviceInputContext['compile']}):DeviceInputContext {
  const controls:TrustedControlBinding[]=edits?.controls??ITEMS.map(({label,...c})=>({...c,args:{...c.args}}));
  const canonical={schema:'vivim.ui-document/1',documentId:'founder_workspace',revision:12,
    scope:{ownerRef:'owner_1',workspaceRef:'workspace_1'},rootId:'root',nodes:[
      {id:'root',type:'stack',props:{direction:'vertical'},a11y:{role:'main',name:'Founder Workspace'},children:['button_theme','button_set']},
      ...ITEMS.map(x=>({id:x.sourceNodeId,type:'button' as const,props:{label:x.label},a11y:{role:'button' as const,name:x.label},
        actionRefs:[x.action],children:[]}))],bindings:[],views:[]};
  const projection={schema:'vivim.wave3-action-semantics/1',readOnly:true,executable:false,documentId:'founder_workspace',revision:12,
    canonical,references:ITEMS.map((x,i)=>({kind:'action',alias:'a_'+i,nodeId:x.sourceNodeId,
      id:x.action.id,version:x.action.version,inert:true}))};
  const components={schema:'vivim.ui-component-map/1',authority:'inert-display-only',documentId:'founder_workspace',revision:12,
    focusOrder:ITEMS.map(i=>i.componentId),sourceRefs:ITEMS.map(x=>({id:x.componentId,sourceId:x.sourceNodeId,
      sourceType:'button',canonicalA11y:{role:'button',name:x.label}})),
    actionRefs:ITEMS.map((x,i)=>({ref:'a_'+i,sourceNodeId:x.sourceNodeId,id:x.action.id,version:x.action.version,executable:false})),
    viewports:modes.map(viewportPx=>({viewportPx,nodes:[]}))};
  const descriptors={schema:'vivim.descriptor-proof-context-fixture/1',deviceSurface:device,currentVersions:{...pins},
    catalogText:'',hqRegistryText:'',expectedCatalogSha256:'',expectedHqRegistrySha256:'',reviews:[]};
  return {projection,components,descriptors,device,controls,focusedComponentId:edits?.focused===undefined?'n_0':edits.focused,
    seenCommandIds:edits?.seen??[],pendingComponentIds:edits?.pending??[],confirmation:edits?.confirmation??null,
    compile:edits?.compile??fixtureCompiler} as unknown as DeviceInputContext;
}
function base(device:'desktop'|'phone'='desktop',viewportPx:typeof modes[number]=360){
  return {schema:WAVE4_DEVICE_INPUT_SCHEMA,device,viewportPx,expectedRevision:12,expectedVersions:{...pins}} as const;
}
const textEvent=(device:'desktop'|'phone'='desktop',viewportPx:typeof modes[number]=360,commandId='cmd_1')=>
  ({...base(device,viewportPx),kind:'text' as const,commandId,text:'/ui.theme.show@1'});
const activate=(device:'desktop'|'phone'='desktop',method:'touch'|'keyboard'|'accessibility'='touch',viewportPx:typeof modes[number]=360,
  componentId='n_0',commandId='cmd_1')=>({...base(device,viewportPx),kind:'activate' as const,method,componentId,commandId,
    ...(method==='keyboard'?{key:'Enter' as const}: {})});
const success=(r:ReturnType<typeof normalizeWave4DeviceInput>)=>{
  assert.equal(r.outcome,'candidate',JSON.stringify(r));if(r.outcome!=='candidate')throw Error('NOT_CANDIDATE');
  assert.deepEqual({effectInvoked:r.effectInvoked,authorized:r.authorized,automaticRetryAllowed:r.automaticRetryAllowed},NONE);
  assert.equal(r.hostAuthorizationRequired,true);return r;
};
const blocked=(r:ReturnType<typeof normalizeWave4DeviceInput>,code:string)=>{
  assert.equal(r.outcome,'refused',JSON.stringify(r));if(r.outcome!=='refused')throw Error('NOT_REFUSED');
  assert.equal(r.reasonCode,code);assert.deepEqual({effectInvoked:r.effectInvoked,
    authorized:r.authorized,automaticRetryAllowed:r.automaticRetryAllowed},NONE);
};

test('W4C local 01 semantic parity: 2 devices x 3 viewports x text/touch/keyboard/a11y, one Host identity',()=>{
  const signatures=[];
  for(const device of ['desktop','phone'] as const)for(const width of modes){
    const ctx=setup(device);const variants=[textEvent(device,width),activate(device,'touch',width),
      activate(device,'keyboard',width),activate(device,'accessibility',width)];
    signatures.push(...variants.map(v=>success(normalizeWave4DeviceInput(v,ctx)).semantic));
  }
  assert.equal(signatures.length,24);for(const sig of signatures)assert.deepEqual(sig,signatures[0]);
});
test('W4C local 02 keyboard Tab, ShiftTab, Escape and no focus trap at the edge',()=>{
  const mk=(key:'Tab'|'ShiftTab'|'Escape')=>({...base(),kind:'navigate',key});
  const tab=normalizeWave4DeviceInput(mk('Tab'),setup());
  assert.equal(tab.outcome,'navigation');if(tab.outcome==='navigation')assert.equal(tab.focusComponentId,'n_1');
  const reverse=normalizeWave4DeviceInput(mk('ShiftTab'),setup('desktop',{focused:'n_1'}));
  assert.equal(reverse.outcome,'navigation');if(reverse.outcome==='navigation')assert.equal(reverse.focusComponentId,'n_0');
  const exit=normalizeWave4DeviceInput(mk('Tab'),setup('desktop',{focused:'n_1'}));
  assert.equal(exit.outcome,'navigation');if(exit.outcome==='navigation')assert.deepEqual([exit.focusComponentId,exit.exitToShell],[null,true]);
  const cancel=normalizeWave4DeviceInput(mk('Escape'),setup());assert.equal(cancel.outcome,'cancelled');
});
test('W4C local 03 keyboard activation only at actual current focus',()=>{
  blocked(normalizeWave4DeviceInput(activate('desktop','keyboard',360,'n_1'),setup()),'UNFOCUSED_KEY_ACTIVATION');
  success(normalizeWave4DeviceInput(activate(),setup()));
});
test('W4C local 04 no keyboard repeats, no synthetic duplicate activation',()=>{
  blocked(normalizeWave4DeviceInput({...activate('desktop','keyboard'),repeat:true},setup()),'REPEATED_KEY_ACTIVATION');
  blocked(normalizeWave4DeviceInput(activate(),setup('desktop',{seen:['cmd_1']})),'DUPLICATE_ACTIVATION');
  blocked(normalizeWave4DeviceInput(activate(),setup('desktop',{pending:['n_0']})),'PENDING_ACTIVATION');
});
test('W4C local 05 invisible and disabled focus refused at every modality',()=>{
  for(const field of ['visible','enabled','focusable'] as const){
    const controls=setup().controls.map(c=>({...c,[field]:c.componentId==='n_0'?false:c[field]}));
    for(const method of ['touch','keyboard','accessibility'] as const)
      blocked(normalizeWave4DeviceInput(activate('desktop',method),setup('desktop',{controls})),'INVISIBLE_OR_DISABLED_FOCUS');
  }
});
test('W4C local 06 unsupported control and noncanonical alias refused',()=>{
  blocked(normalizeWave4DeviceInput(activate('desktop','touch',360,'phantom'),setup()),'UNSUPPORTED_CONTROL');
  const c=setup();const bad={...c,components:{...c.components,focusOrder:['n_0','phantom']}};
  blocked(normalizeWave4DeviceInput(activate(),bad),'INVALID_CANONICAL_FOCUS_BINDINGS');
});
test('W4C local 07 gesture types cannot carry privileged effects',()=>{
  for(const gesture of ['pinch','swipe','long-press','double-tap'] as const)
    blocked(normalizeWave4DeviceInput({...base(),kind:'gesture',gesture,componentId:'n_1'},setup()),'UNSUPPORTED_GESTURE');
});
test('W4C local 08 lost confirmation blocks R1 even if G would offer a candidate',()=>{
  const e=activate('desktop','touch',360,'n_1');
  blocked(normalizeWave4DeviceInput(e,setup()),'CONFIRMATION_MISSING_OR_LOST');
  const lost={status:'lost',commandId:'cmd_1',semanticId:'ui.theme.set@1',documentRevision:12,
    hostWorld:pins.hostWorld,policy:pins.policy} as const;
  blocked(normalizeWave4DeviceInput(e,setup('desktop',{confirmation:lost})),'CONFIRMATION_MISSING_OR_LOST');
  const accepted=setup('desktop',{confirmation:{...lost,status:'acknowledged'}});
  const r=success(normalizeWave4DeviceInput(e,accepted));assert.equal(r.command.risk.level,'R1');
});
test('W4C local 09 confirmation bound to semantic ID, revision, command, world and policy',()=>{
  const confirmed={status:'acknowledged',commandId:'cmd_1',semanticId:'ui.theme.set@1',
    documentRevision:12,hostWorld:pins.hostWorld,policy:pins.policy} as const;
  for(const altered of [{commandId:'other'},{semanticId:'wrong@1'},{documentRevision:11},{hostWorld:'old'},{policy:'old'},
    {status:'cancelled' as const}])
    blocked(normalizeWave4DeviceInput(activate('desktop','touch',360,'n_1'),setup('desktop',{confirmation:{...confirmed,...altered}})),
      'CONFIRMATION_MISSING_OR_LOST');
});
test('W4C local 10 no device spoof, stale revision, stale policy or stale KB',()=>{
  blocked(normalizeWave4DeviceInput(activate('phone'),setup()),'STALE_OR_FOREIGN_DEVICE_CONTEXT');
  blocked(normalizeWave4DeviceInput({...activate(),expectedRevision:11},setup()),'STALE_OR_FOREIGN_DEVICE_CONTEXT');
  for(const p of [{policy:'older'},{hostWorld:'older'},{kb:'older'},{uiRevision:'older'}])
    blocked(normalizeWave4DeviceInput({...activate(),expectedVersions:{...pins,...p}},setup()),'STALE_OR_FOREIGN_DEVICE_CONTEXT');
});
test('W4C local 11 document/B action version and semantic link cannot drift',()=>{
  const c=setup();
  blocked(normalizeWave4DeviceInput(activate(),{...c,controls:c.controls.map(x=>({...x,
    action:{...x.action,version:2}}))}),'INVALID_CANONICAL_FOCUS_BINDINGS');
  blocked(normalizeWave4DeviceInput(activate(),{...c,components:{...c.components,documentId:'other'}}),'INVALID_CANONICAL_FOCUS_BINDINGS');
  blocked(normalizeWave4DeviceInput(activate(),{...c,controls:c.controls.map(x=>({...x,touchTargetPx:30}))}),
    'INVALID_CANONICAL_FOCUS_BINDINGS');
});
test('W4C local 12 accessible name and canonical label must match and hide secrets',()=>{
  const c=setup();const modified={...c,projection:{...c.projection,canonical:{...c.projection.canonical,
    nodes:c.projection.canonical.nodes.map(n=>n.type==='button'&&n.id==='button_theme'?{...n,a11y:{...n.a11y,name:'Bearer sk-proj-abcdefghijk'}}:n)}}};
  blocked(normalizeWave4DeviceInput(activate(),modified),'INVALID_CANONICAL_FOCUS_BINDINGS');
  const other={...c,components:{...c.components,sourceRefs:c.components.sourceRefs.map(ref=>({...ref,
    canonicalA11y:{...ref.canonicalA11y,name:'Changed by shell'}}))}};
  blocked(normalizeWave4DeviceInput(activate(),other),'INVALID_CANONICAL_FOCUS_BINDINGS');
});
test('W4C local 13 unapproved fields, control handlers, risk injection and input grants refused',()=>{
  for(const injected of [{risk:'R0'},{grant:true},{approved:true},{execute:()=>{}},{semanticId:'ui.theme.show@1'},
    {providerSend:true},{target:{actionId:'ui.theme.show'}},{inputDigest:'a'.repeat(64)}])
    blocked(normalizeWave4DeviceInput({...activate(),...injected},setup()),'INVALID_DEVICE_INPUT');
});
test('W4C local 14 keyboard unsupported key, composition and repeat fields fail closed',()=>{
  blocked(normalizeWave4DeviceInput({...activate('desktop','keyboard'),key:'ArrowLeft'},setup()),'INVALID_DEVICE_INPUT');
  blocked(normalizeWave4DeviceInput({...activate(),repeat:false},setup()),'INVALID_DEVICE_INPUT');
  blocked(normalizeWave4DeviceInput({...base(),kind:'activate',method:'accessibility',componentId:'n_0',commandId:'cmd_1',key:'Enter'},setup()),'INVALID_DEVICE_INPUT');
});
test('W4C local 15 unsupported viewport and missing pinned fields refuse',()=>{
  blocked(normalizeWave4DeviceInput({...activate(),viewportPx:239},setup()),'INVALID_DEVICE_INPUT');
  success(normalizeWave4DeviceInput({...activate(),viewportPx:393},setup()));
  blocked(normalizeWave4DeviceInput({...activate(),expectedVersions:{policy:pins.policy,hostWorld:pins.hostWorld}},setup()),
    'INVALID_DEVICE_INPUT');
});
test('W4C local 16 cancel never compiles or retries',()=>{
  let calls=0;const c=setup('desktop',{compile:()=>{calls++;throw Error('effect');}});
  const r=normalizeWave4DeviceInput({...base(),kind:'cancel'},c);
  assert.equal(r.outcome,'cancelled');assert.equal(calls,0);assert.deepEqual({effectInvoked:r.effectInvoked,
    authorized:r.authorized,automaticRetryAllowed:r.automaticRetryAllowed},NONE);
});
test('W4C local 17 deliberate malicious getter in untrusted event not invoked',()=>{
  const e=Object.defineProperty({},'kind',{enumerable:true,get(){throw Error('getter invoked')}});
  blocked(normalizeWave4DeviceInput(e,setup()),'INVALID_DEVICE_INPUT');
});
test('W4C local 18 no mutation of event or broker objects and stable inert result',()=>{
  const c=setup();const e=activate();const before=JSON.stringify({e,controls:c.controls,components:c.components,projection:c.projection});
  const a=normalizeWave4DeviceInput(e,c),b=normalizeWave4DeviceInput(e,c);
  assert.deepEqual(a,b);assert.equal(JSON.stringify({e,controls:c.controls,components:c.components,projection:c.projection}),before);
});
test('W4C local 19 compiler unavailability remains refused without fallback interpretation',()=>{
  const c=setup('desktop',{compile:()=>{throw Error('provider offline')}});
  blocked(normalizeWave4DeviceInput(activate(),c),'COMPILER_UNAVAILABLE');
});
test('W4C local 20 G output semantic, risk, version and Host effect claims verified',()=>{
  const bad:DeviceInputContext['compile']=(input,ctx)=>{
    const r=fixtureCompiler(input,ctx);
    if(r.outcome!=='candidate')return r;
    return {...r,command:{...r.command,sourceVersions:{...pins,policy:'old'}}};
  };
  blocked(normalizeWave4DeviceInput(activate(),setup('desktop',{compile:bad})),'COMMAND_CONTRACT_MISMATCH');
  const exec:DeviceInputContext['compile']=(input,ctx)=>{
    const r=fixtureCompiler(input,ctx);if(r.outcome!=='candidate')return r;
    return {...r,evidence:{...r.evidence,liveHostVerified:true}} as unknown as DescriptorProofResult;
  };
  blocked(normalizeWave4DeviceInput(activate(),setup('desktop',{compile:exec})),'COMMAND_CONTRACT_MISMATCH');
});
test('W4C local 21 no R2-on-phone or R3 candidate even with bad compiler',()=>{
  for(const [device,risk] of [['phone','R2'],['desktop','R3']] as const){
    const compile:DeviceInputContext['compile']=(input,ctx)=>{
      const r=fixtureCompiler(input,ctx);if(r.outcome!=='candidate')return r;
      return {...r,command:{...r.command,risk:{...r.command.risk,level:risk}}};
    };
    blocked(normalizeWave4DeviceInput(activate(device),setup(device,{compile})),'COMMAND_CONTRACT_MISMATCH');
  }
});
test('W4C local 22 wrong actor/phone descriptor surface cannot promote touch to desktop',()=>{
  const c=setup('phone');
  blocked(normalizeWave4DeviceInput(activate('phone','keyboard'),{...c,descriptors:{...c.descriptors,deviceSurface:'desktop'}}),
    'INVALID_TRUSTED_CONTEXT');
});

test('W4C G integration — REAL Wave 3 descriptor compiler, Host v6 review fixture, cross-device parity',async()=>{
  // Runs without mocks in a complete TierFlow checkout. External Host/HQ bytes are labelled synthetic.
  const {compileDescriptorProof,descriptorArgsDigest}=await import('../../src/visual-runtime/command/wave3-descriptor-proof.ts');
  const actions=[{id:'ui.theme.show',risk:'R0',readiness:'source_wired',args:{}},
    {id:'ui.theme.set_preset',risk:'R1',readiness:'source_wired',args:{preset:{type:'enum',values:['dusk']}}}];
  const catalogText=JSON.stringify({schema:'vivim.control-action-catalog/1',version:6,
    policy:{allUserFacingActionsRequireTextPath:true,uiSharesTypedExecutor:true,unverifiedActionsAreNotAvailable:true,
      modelRole:'candidate_only',sourceWiredIsNotLiveAcceptance:true},actions});
  const hqRegistryText='fixture HQ registry bytes, not a production attestation';
  const reviews=ITEMS.map(item=>({schema:'vivim.reviewed-host-binding-fixture/1' as const,
    semanticId:item.semanticId,semanticVersion:'1',actionId:item.action.id,
    risk:(item.sourceNodeId==='button_set'?'R1':'R0') as 'R0'|'R1',
    argsSchemaSha256:descriptorArgsDigest(actions.find(a=>a.id===item.action.id)!.args)!,
    hostCatalogSha256:hash(catalogText),hqRegistrySha256:hash(hqRegistryText),reviewed:true as const}));
  const {projectWave3ActionSemantics}=await import('../../src/visual-runtime/document/wave3-action-semantics.ts');
  const {mapCanonicalComponents}=await import('../../src/visual-runtime/components/wave3-canonical-map.ts');
  // These are genuine A/B projections, not the structural unit-test stand-ins above.
  const knownActions=ITEMS.map(item=>({...item.action}));
  const document={schema:'vivim.ui-document/1',documentId:'founder_workspace',revision:12,
    scope:{ownerRef:'owner:fixture',workspaceRef:'world:founder'},rootId:'root',nodes:[
      {id:'root',type:'stack',props:{direction:'vertical'},children:['button_theme','button_set'],
        a11y:{role:'main',name:'Founder Workspace'}},
      ...ITEMS.map((x,i)=>({id:x.sourceNodeId,type:'button',props:{label:x.label},children:[],
        a11y:{role:'button',name:x.label,focusOrder:i+1},actionRefs:[{...x.action}]}))],
    bindings:[],views:[{id:'phone',kind:'2d',version:1,viewport:'phone'},
      {id:'desktop',kind:'2d',version:1,viewport:'desktop'}]};
  const a=projectWave3ActionSemantics(document,{knownActions,knownBindings:[],expectedRevision:12});
  const b=mapCanonicalComponents(document,{knownActions});
  assert.equal(a.ok,true,JSON.stringify(a));assert.equal(b.ok,true,JSON.stringify(b));
  if(!a.ok||!b.ok)throw Error('REAL_A_B_PROJECTION_REFUSED');
  const controls:TrustedControlBinding[]=ITEMS.map(({label,...x})=>({
    ...x,componentId:b.value.sourceRefs.find(ref=>ref.sourceId===x.sourceNodeId)!.id,args:{...x.args}}));
  const themeId=controls[0]!.componentId;
  const setId=controls[1]!.componentId;
  const all: ReturnType<typeof success>['semantic'][]=[];
  for(const device of ['desktop','phone'] as const)for(const width of modes){
    const c=setup(device,{compile:compileDescriptorProof});const withReview={...c,projection:a.value,components:b.value,
      controls,focusedComponentId:themeId,descriptors:{...c.descriptors,
      catalogText,hqRegistryText,expectedCatalogSha256:hash(catalogText),expectedHqRegistrySha256:hash(hqRegistryText),reviews}};
    for(const event of [textEvent(device,width),activate(device,'touch',width,themeId),
      activate(device,'keyboard',width,themeId),activate(device,'accessibility',width,themeId)]){
      const x=success(normalizeWave4DeviceInput(event,withReview));
      assert.equal(x.command.capability.verifiedByEvidence,false);assert.equal(x.command.target.actionId,'ui.theme.show');
      all.push(x.semantic);
    }
    const acceptedConf={status:'acknowledged' as const,commandId:'cmd_1',semanticId:'ui.theme.set@1',
      documentRevision:12,hostWorld:pins.hostWorld,policy:pins.policy};
    const r=success(normalizeWave4DeviceInput(activate(device,'touch',width,setId),{...withReview,confirmation:acceptedConf}));
    assert.equal(r.command.target.actionId,'ui.theme.set_preset');assert.equal(r.command.risk.level,'R1');
  }
  assert.equal(all.length,24);all.forEach(s=>assert.deepEqual(s,all[0]));
});
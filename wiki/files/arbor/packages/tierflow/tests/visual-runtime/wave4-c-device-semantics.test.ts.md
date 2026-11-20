# File: packages/tierflow/tests/visual-runtime/wave4-c-device-semantics.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/wave4-c-device-semantics.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 22377 B |
| Lines | 283 |
| Hash | 4ac07995953c |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| hash | function | 12 | no | const hash=(s:string)=&gt;createHash(&#39;sha256&#39;).update(s).digest(&#39;hex&#39;); |
| pins | const | 13 | no | const pins={hostWorld:&#39;world-7&#39;,policy:&#39;policy-8&#39;,kb:&#39;kb-9&#39;,uiRevision:&#39;doc-12&#39;} as const; |
| modes | const | 14 | no | const modes=[320,360,1280] as const; |
| NONE | const | 15 | no | const NONE=Object.freeze({effectInvoked:false,authorized:false,automaticRetryAllowed:false}); |
| ITEMS | const | 16 | no | const ITEMS=[ |
| fixtureCompiler | function | 22 | no | function fixtureCompiler(input:unknown, trusted:unknown):DescriptorProofResult { |
| cmd | const | 23 | no | const cmd=input as CommandInput; |
| context | const | 24 | no | const context=trusted as DescriptorProofContext; |
| selected | const | 25 | no | const selected=cmd.source.surface===&#39;text&#39; ? |
| deny | function | 28 | no | const deny=(reasonCode:string):DescriptorProofResult=&gt;({outcome:&#39;refused&#39;,reasonCode,alternatives:[],effectInvoked:false}); |
| row | const | 31 | no | const row=ITEMS.find(i=&gt;i.semanticId===selected.semanticId); |
| risk | const | 34 | no | const risk=row.sourceNodeId===&#39;button_set&#39;?&#39;R1&#39;:&#39;R0&#39;; |
| command | const | 35 | no | const command:VisualCommand={schema:&#39;vivim.visual-command/1&#39;,commandId:cmd.commandId,source:cmd.source, |
| setup | function | 46 | no | function setup(device:&#39;desktop&#39;\|&#39;phone&#39;=&#39;desktop&#39;, edits?:{controls?:TrustedControlBinding[];focused?:string\|null;seen?:string[];pending?:string[];confirmation?:DeviceInputContext[&#39;confirmation&#39;];com… |
| controls | const | 47 | no | const controls:TrustedControlBinding[]=edits?.controls??ITEMS.map(({label,...c})=&gt;({...c,args:{...c.args}})); |
| canonical | const | 48 | no | const canonical={schema:&#39;vivim.ui-document/1&#39;,documentId:&#39;founder_workspace&#39;,revision:12, |
| projection | const | 53 | no | const projection={schema:&#39;vivim.wave3-action-semantics/1&#39;,readOnly:true,executable:false,documentId:&#39;founder_workspace&#39;,revision:12, |
| components | const | 56 | no | const components={schema:&#39;vivim.ui-component-map/1&#39;,authority:&#39;inert-display-only&#39;,documentId:&#39;founder_workspace&#39;,revision:12, |
| descriptors | const | 61 | no | const descriptors={schema:&#39;vivim.descriptor-proof-context-fixture/1&#39;,deviceSurface:device,currentVersions:{...pins}, |
| base | function | 67 | no | function base(device:&#39;desktop&#39;\|&#39;phone&#39;=&#39;desktop&#39;,viewportPx:typeof modes[number]=360){ |
| textEvent | function | 70 | no | const textEvent=(device:&#39;desktop&#39;\|&#39;phone&#39;=&#39;desktop&#39;,viewportPx:typeof modes[number]=360,commandId=&#39;cmd_1&#39;)=&gt; |
| activate | function | 72 | no | const activate=(device:&#39;desktop&#39;\|&#39;phone&#39;=&#39;desktop&#39;,method:&#39;touch&#39;\|&#39;keyboard&#39;\|&#39;accessibility&#39;=&#39;touch&#39;,viewportPx:typeof modes[number]=360, componentId=&#39;n_0&#39;,commandId=&#39;cmd_1&#39;)=&gt;({...base(device,viewpo… |
| success | function | 75 | no | const success=(r:ReturnType&lt;typeof normalizeWave4DeviceInput&gt;)=&gt;{ |
| blocked | function | 80 | no | const blocked=(r:ReturnType&lt;typeof normalizeWave4DeviceInput&gt;,code:string)=&gt;{ |
| signatures | const | 87 | no | const signatures=[]; |
| ctx | const | 89 | no | const ctx=setup(device);const variants=[textEvent(device,width),activate(device,&#39;touch&#39;,width), |
| mk | function | 96 | no | const mk=(key:&#39;Tab&#39;\|&#39;ShiftTab&#39;\|&#39;Escape&#39;)=&gt;({...base(),kind:&#39;navigate&#39;,key}); |
| tab | const | 97 | no | const tab=normalizeWave4DeviceInput(mk(&#39;Tab&#39;),setup()); |
| reverse | const | 99 | no | const reverse=normalizeWave4DeviceInput(mk(&#39;ShiftTab&#39;),setup(&#39;desktop&#39;,{focused:&#39;n_1&#39;})); |
| exit | const | 101 | no | const exit=normalizeWave4DeviceInput(mk(&#39;Tab&#39;),setup(&#39;desktop&#39;,{focused:&#39;n_1&#39;})); |
| cancel | const | 103 | no | const cancel=normalizeWave4DeviceInput(mk(&#39;Escape&#39;),setup());assert.equal(cancel.outcome,&#39;cancelled&#39;); |
| controls | const | 116 | no | const controls=setup().controls.map(c=&gt;({...c,[field]:c.componentId===&#39;n_0&#39;?false:c[field]})); |
| c | const | 123 | no | const c=setup();const bad={...c,components:{...c.components,focusOrder:[&#39;n_0&#39;,&#39;phantom&#39;]}}; |
| e | const | 131 | no | const e=activate(&#39;desktop&#39;,&#39;touch&#39;,360,&#39;n_1&#39;); |
| lost | const | 133 | no | const lost={status:&#39;lost&#39;,commandId:&#39;cmd_1&#39;,semanticId:&#39;ui.theme.set@1&#39;,documentRevision:12, |
| accepted | const | 136 | no | const accepted=setup(&#39;desktop&#39;,{confirmation:{...lost,status:&#39;acknowledged&#39;}}); |
| r | const | 137 | no | const r=success(normalizeWave4DeviceInput(e,accepted));assert.equal(r.command.risk.level,&#39;R1&#39;); |
| confirmed | const | 140 | no | const confirmed={status:&#39;acknowledged&#39;,commandId:&#39;cmd_1&#39;,semanticId:&#39;ui.theme.set@1&#39;, |
| c | const | 154 | no | const c=setup(); |
| c | const | 162 | no | const c=setup();const modified={...c,projection:{...c.projection,canonical:{...c.projection.canonical, |
| other | const | 165 | no | const other={...c,components:{...c.components,sourceRefs:c.components.sourceRefs.map(ref=&gt;({...ref, canonicalA11y:{...ref.canonicalA11y,name:&#39;Changed by shell&#39;}}))}}; |
| calls | variable | 186 | no | let calls=0;const c=setup(&#39;desktop&#39;,{compile:()=&gt;{calls++;throw Error(&#39;effect&#39;);}}); |
| r | const | 187 | no | const r=normalizeWave4DeviceInput({...base(),kind:&#39;cancel&#39;},c); |
| e | const | 192 | no | const e=Object.defineProperty({},&#39;kind&#39;,{enumerable:true,get(){throw Error(&#39;getter invoked&#39;)}}); |
| c | const | 196 | no | const c=setup();const e=activate();const before=JSON.stringify({e,controls:c.controls,components:c.components,projection:c.projection}); |
| a | const | 197 | no | const a=normalizeWave4DeviceInput(e,c),b=normalizeWave4DeviceInput(e,c); |
| c | const | 201 | no | const c=setup(&#39;desktop&#39;,{compile:()=&gt;{throw Error(&#39;provider offline&#39;)}}); |
| bad | function | 205 | no | const bad:DeviceInputContext[&#39;compile&#39;]=(input,ctx)=&gt;{ |
| r | const | 206 | no | const r=fixtureCompiler(input,ctx); |
| exec | function | 211 | no | const exec:DeviceInputContext[&#39;compile&#39;]=(input,ctx)=&gt;{ |
| r | const | 212 | no | const r=fixtureCompiler(input,ctx);if(r.outcome!==&#39;candidate&#39;)return r; |
| compile | function | 219 | no | const compile:DeviceInputContext[&#39;compile&#39;]=(input,ctx)=&gt;{ |
| r | const | 220 | no | const r=fixtureCompiler(input,ctx);if(r.outcome!==&#39;candidate&#39;)return r; |
| c | const | 227 | no | const c=setup(&#39;phone&#39;); |
| actions | const | 235 | no | const actions=[{id:&#39;ui.theme.show&#39;,risk:&#39;R0&#39;,readiness:&#39;source_wired&#39;,args:{}}, |
| catalogText | const | 237 | no | const catalogText=JSON.stringify({schema:&#39;vivim.control-action-catalog/1&#39;,version:6, policy:{allUserFacingActionsRequireTextPath:true,uiSharesTypedExecutor:true,unverifiedActionsAreNotAvailable:true,… |
| hqRegistryText | const | 240 | no | const hqRegistryText=&#39;fixture HQ registry bytes, not a production attestation&#39;; |
| reviews | const | 241 | no | const reviews=ITEMS.map(item=&gt;({schema:&#39;vivim.reviewed-host-binding-fixture/1&#39; as const, semanticId:item.semanticId,semanticVersion:&#39;1&#39;,actionId:item.action.id, risk:(item.sourceNodeId===&#39;button_set&#39;… |
| knownActions | const | 249 | no | const knownActions=ITEMS.map(item=&gt;({...item.action})); |
| document | const | 250 | no | const document={schema:&#39;vivim.ui-document/1&#39;,documentId:&#39;founder_workspace&#39;,revision:12, |
| a | const | 258 | no | const a=projectWave3ActionSemantics(document,{knownActions,knownBindings:[],expectedRevision:12}); |
| b | const | 259 | no | const b=mapCanonicalComponents(document,{knownActions}); |
| controls | const | 262 | no | const controls:TrustedControlBinding[]=ITEMS.map(({label,...x})=&gt;({ ...x,componentId:b.value.sourceRefs.find(ref=&gt;ref.sourceId===x.sourceNodeId)!.id,args:{...x.args}})); |
| themeId | const | 264 | no | const themeId=controls[0]!.componentId; |
| setId | const | 265 | no | const setId=controls[1]!.componentId; |
| all | const | 266 | no | const all: ReturnType&lt;typeof success&gt;[&#39;semantic&#39;][]=[]; |
| c | const | 268 | no | const c=setup(device,{compile:compileDescriptorProof});const withReview={...c,projection:a.value,components:b.value, |
| x | const | 273 | no | const x=success(normalizeWave4DeviceInput(event,withReview)); |
| acceptedConf | const | 277 | no | const acceptedConf={status:&#39;acknowledged&#39; as const,commandId:&#39;cmd_1&#39;,semanticId:&#39;ui.theme.set@1&#39;, |
| r | const | 279 | no | const r=success(normalizeWave4DeviceInput(activate(device,&#39;touch&#39;,width,setId),{...withReview,confirmation:acceptedConf})); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 4 | external |
| node:assert/strict | import | 5 | external |
| node:crypto | import | 6 | external |
| ../../src/visual-runtime/input/wave4-device-semantics.ts | import | 7 | [packages/tierflow/src/visual-runtime/input/wave4-device-semantics.ts](../../src/visual-runtime/input/wave4-device-semantics.ts.md) |
| ../../src/visual-runtime/command/ir.ts | import | 9 | [packages/tierflow/src/visual-runtime/command/ir.ts](../../src/visual-runtime/command/ir.ts.md) |
| ../../src/visual-runtime/command/wave3-descriptor-proof.ts | import | 10 | [packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts](../../src/visual-runtime/command/wave3-descriptor-proof.ts.md) |
| ../../src/visual-runtime/command/wave3-descriptor-proof.ts | dynamic | 234 | [packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts](../../src/visual-runtime/command/wave3-descriptor-proof.ts.md) |
| ../../src/visual-runtime/document/wave3-action-semantics.ts | dynamic | 246 | [packages/tierflow/src/visual-runtime/document/wave3-action-semantics.ts](../../src/visual-runtime/document/wave3-action-semantics.ts.md) |
| ../../src/visual-runtime/components/wave3-canonical-map.ts | dynamic | 247 | [packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts](../../src/visual-runtime/components/wave3-canonical-map.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 283 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

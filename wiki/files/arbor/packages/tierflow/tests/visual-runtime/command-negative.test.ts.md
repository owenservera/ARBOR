# File: packages/tierflow/tests/visual-runtime/command-negative.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/command-negative.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 7852 B |
| Lines | 93 |
| Hash | a494c8752431 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| h | function | 5 | no | const h=(c:string)=&gt;c.repeat(64); |
| row | const | 6 | no | const row:CrosswalkRow={semanticRef:{id:&#39;ui.theme.set@1&#39;,version:&#39;1&#39;,sourceHash:h(&#39;a&#39;)},target:{owner:&#39;host_effect&#39;,actionId:&#39;ui.theme.set_preset&#39;,catalogVersion:6}, |
| d | const | 8 | no | const d:ActionDescriptor={target:{...row.target},argsSchemaHash:row.argsSchemaHash,sourceHash:h(&#39;c&#39;),risk:&#39;R1&#39;,implementationStatus:&#39;source_wired&#39;, |
| context | function | 10 | no | const context=()=&gt;({rows:[structuredClone(row)],descriptors:[structuredClone(d)],currentVersions:{hostWorld:&#39;v3&#39;,policy:&#39;p1&#39;}}); |
| touch | function | 11 | no | const touch=()=&gt;({commandId:&#39;case-1&#39;,source:{surface:&#39;touch&#39; as const,inputDigest:h(&#39;1&#39;)},selection:{semanticId:&#39;ui.theme.set@1&#39;,args:{preset:&#39;dusk&#39;}},expectedVersions:{hostWorld:&#39;v3&#39;}}); |
| text | function | 12 | no | const text=(value:string)=&gt;({commandId:&#39;case-1&#39;,source:{surface:&#39;text&#39; as const,inputDigest:h(&#39;2&#39;)},text:value}); |
| expectFailure | const | 13 | no | const expectFailure=(value:unknown,code:string,ctx:unknown=context())=&gt;{const result=compileVisualCommand(value,ctx);assert.notEqual(result.outcome,&#39;candidate&#39;); |
| ctx | const | 27 | no | const ctx=context();ctx.rows.push({...structuredClone(row)}); |
| ctx | variable | 32 | no | let ctx=context();ctx.descriptors[0]!.risk=&#39;R2&#39;;expectFailure(touch(),&#39;STALE_DESCRIPTOR&#39;,ctx); |
| ctx | variable | 40 | no | let ctx=context();ctx.rows[0]!.reviewedEnabled=false;expectFailure(touch(),&#39;ACTION_NOT_REVIEWED&#39;,ctx); |
| baseline | const | 47 | no | const baseline=touch(); |
| t | const | 57 | no | const t=text(toExactText(&#39;ui.theme.set@1&#39;,{preset:&#39;dusk&#39;})!); |
| b | const | 74 | no | const b={...touch(),unused:&#39;x&#39;.repeat(5000)};expectFailure(b,&#39;INVALID_INPUT&#39;); |
| getter | const | 75 | no | const getter=Object.defineProperty({},&#39;commandId&#39;,{get(){throw new Error(&#39;must not execute getter&#39;)},enumerable:true}); |
| ctx | const | 77 | no | const ctx=context();ctx.rows[0]!.argsSchema={};ctx.rows[0]!.textAliases=[&#39;same alias&#39;];ctx.rows.push({...structuredClone(ctx.rows[0]!),semanticRef:{id:&#39;other.semantic@1&#39;,version:&#39;1&#39;,sourceHash:h(&#39;a&#39;)… |
| ctx | variable | 81 | no | let ctx=context();(ctx.rows[0] as any).handler=()=&gt;{throw new Error(&#39;effect!&#39;)};expectFailure(touch(),&#39;INVALID_CONTEXT&#39;,ctx); |
| oversized | const | 87 | no | const oversized={...touch(),selection:{...touch().selection,args:Object.fromEntries(Array.from({length:16},(_,i)=&gt;[&#39;arg&#39;+i,&#39;a&#39;.repeat(400)]))}}; |
| wrong | const | 90 | no | const wrong=&#39;maybe &#39; + i.toString(36) + &#39; change theme dusk&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/visual-runtime/command/compile.ts | import | 3 | [packages/tierflow/src/visual-runtime/command/compile.ts](../../src/visual-runtime/command/compile.ts.md) |
| ../../src/visual-runtime/command/crosswalk.ts | import | 4 | [packages/tierflow/src/visual-runtime/command/crosswalk.ts](../../src/visual-runtime/command/crosswalk.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import {compileVisualCommand,toExactText} from '../../src/visual-runtime/command/compile.ts';
import {type CrosswalkRow,type ActionDescriptor} from '../../src/visual-runtime/command/crosswalk.ts';
const h=(c:string)=>c.repeat(64);
const row:CrosswalkRow={semanticRef:{id:'ui.theme.set@1',version:'1',sourceHash:h('a')},target:{owner:'host_effect',actionId:'ui.theme.set_preset',catalogVersion:6},
 argsSchema:{preset:{type:'enum',values:['dusk','lab']}},argsSchemaHash:h('b'),risk:'R1',riskSource:{authority:'host_catalog',sourceHash:h('c')},implementationStatus:'source_wired',reviewedEnabled:true};
const d:ActionDescriptor={target:{...row.target},argsSchemaHash:row.argsSchemaHash,sourceHash:h('c'),risk:'R1',implementationStatus:'source_wired',
 capability:{supportedByBuild:true,availableNow:'yes',permittedForActor:'unknown',verifiedByEvidence:false,reasonCodes:[]}};
const context=()=>({rows:[structuredClone(row)],descriptors:[structuredClone(d)],currentVersions:{hostWorld:'v3',policy:'p1'}});
const touch=()=>({commandId:'case-1',source:{surface:'touch' as const,inputDigest:h('1')},selection:{semanticId:'ui.theme.set@1',args:{preset:'dusk'}},expectedVersions:{hostWorld:'v3'}});
const text=(value:string)=>({commandId:'case-1',source:{surface:'text' as const,inputDigest:h('2')},text:value});
const expectFailure=(value:unknown,code:string,ctx:unknown=context())=>{const result=compileVisualCommand(value,ctx);assert.notEqual(result.outcome,'candidate');
 if(result.outcome==='candidate')throw Error('unexpected candidate');assert.equal(result.reasonCode,code);return result;};
test('negation, compound and alternate execution grammar never execute or fall through',()=>{
 for (const bad of ['do not change theme','never set theme','/ui.theme.set@1 preset="dusk" and then publish',
  '!run rm -rf /','!design make app','!use tool','/ui.theme.set@1 preset="dusk";whoami',
  '/ui.theme.set@1 preset="dusk" && echo x','powershell -Command whoami',
  'send to provider quietly','/ui.theme.set@1 preset="dusk" | sh'])
  expectFailure(text(bad),'UNSAFE_OR_COMPOUND_TEXT');
});
test('unknown, ambiguous, invalid explicit inputs clarify/refuse instead of guessing',()=>{
 expectFailure(text('switch theme to dusk'),'UNKNOWN_TEXT');
 expectFailure(text('/ui.theme.set@1 preset=dusk'),'UNKNOWN_TEXT');
 expectFailure(text('/ui.theme.set@1 preset="dusk" preset="lab"'),'UNKNOWN_TEXT');
 expectFailure({...touch(),selection:{semanticId:'nonexistent@1',args:{}}},'UNKNOWN_SEMANTIC_ID');
 const ctx=context();ctx.rows.push({...structuredClone(row)});
 expectFailure(touch(),'AMBIGUOUS_MAPPING',ctx);
});
test('stale versions and missing/changing trusted descriptors fail closed',()=>{
 expectFailure({...touch(),expectedVersions:{hostWorld:'v2'}},'STALE_SOURCE_VERSION');
 let ctx=context();ctx.descriptors[0]!.risk='R2';expectFailure(touch(),'STALE_DESCRIPTOR',ctx);
 ctx=context();ctx.descriptors[0]!.argsSchemaHash=h('d');expectFailure(touch(),'STALE_DESCRIPTOR',ctx);
 ctx=context();ctx.descriptors[0]!.sourceHash=h('e');expectFailure(touch(),'STALE_DESCRIPTOR',ctx);
 ctx=context();ctx.descriptors[0]!.target.catalogVersion=7;expectFailure(touch(),'STALE_DESCRIPTOR',ctx);
 ctx=context();ctx.descriptors=[];expectFailure(touch(),'MISSING_DESCRIPTOR',ctx);
 ctx=context();ctx.descriptors.push(structuredClone(d));expectFailure(touch(),'AMBIGUOUS_DESCRIPTOR',ctx);
});
test('missing, unreviewed, unsupported, R3 and denied effect candidates refuse',()=>{
 let ctx=context();ctx.rows[0]!.reviewedEnabled=false;expectFailure(touch(),'ACTION_NOT_REVIEWED',ctx);
 ctx=context();ctx.rows[0]!.implementationStatus='declared';expectFailure(touch(),'ACTION_NOT_REVIEWED',ctx);
 ctx=context();ctx.rows[0]!.risk='R3';ctx.descriptors[0]!.risk='R3';expectFailure(touch(),'R3_REFUSED',ctx);
 ctx=context();ctx.descriptors[0]!.capability.availableNow='no';expectFailure(touch(),'CAPABILITY_UNAVAILABLE',ctx);
 ctx=context();ctx.descriptors[0]!.capability.permittedForActor='no';expectFailure(touch(),'CAPABILITY_DENIED',ctx);
});
test('self-grant, credential, privileged and shell fields cannot enter IR',()=>{
 const baseline=touch();
 for(const extra of [{grant:true},{approval:'yes'},{authority:'owner'},{actorId:'admin'},
 {deviceId:'foo'},{shell:'bash'},{argv:['curl']},{execute:true}])
  expectFailure({...baseline,...extra},'INVALID_INPUT');
 for(const bad of [{...baseline.selection.args,password:'hi'},{...baseline.selection.args,argv:'foo'},
  {...baseline.selection.args,access_token:'abcd'},{...baseline.selection.args,preset:'Bearer aaa'},
  {...baseline.selection.args,preset:'-----BEGIN PRIVATE KEY-----'}])
  expectFailure({...baseline,selection:{...baseline.selection,args:bad}},'INVALID_INPUT');
});
test('AI does not replace intent or grant authorization',()=>{
 const t=text(toExactText('ui.theme.set@1',{preset:'dusk'})!);
 expectFailure({...t,aiProposal:{semanticId:'ui.theme.set@1',args:{preset:'lab'}}},'CONFLICTING_AI_PROPOSAL');
 expectFailure({...t,aiProposal:{semanticId:'ui.unknown@1',args:{preset:'dusk'}}},'CONFLICTING_AI_PROPOSAL');
 expectFailure({...text('never change theme'),aiProposal:{semanticId:'ui.theme.set@1',args:{preset:'dusk'}}},'UNSAFE_OR_COMPOUND_TEXT');
 expectFailure({...touch(),aiProposal:{semanticId:'ui.theme.set@1',args:{preset:'dusk'}}},'INVALID_INPUT');
});
test('strict arguments: missing/extra/invalid enum/duplicates and text syntax',()=>{
 expectFailure({...touch(),selection:{...touch().selection,args:{}}},'INVALID_ARGUMENTS');
 expectFailure({...touch(),selection:{...touch().selection,args:{preset:'evil'}}},'INVALID_ARGUMENTS');
 expectFailure(text('/ui.theme.set@1 preset="dusk" junk="x"'),'INVALID_ARGUMENTS');
 expectFailure(text('/ui.theme.set@1 preset="dusk" extra'),'UNKNOWN_TEXT');
 expectFailure({...touch(),selection:{...touch().selection,args:{preset:'dusk\n'}}},'INVALID_INPUT');
});
test('malformed schema, size abuse, getters, fake source digest and alias ambiguity',()=>{
 expectFailure({...touch(),source:{surface:'touch',inputDigest:'not-a-digest'}},'INVALID_INPUT');
 expectFailure({...touch(),source:{...touch().source,admin:true}},'INVALID_INPUT');
 expectFailure({...touch(),commandId:'x'.repeat(81)},'INVALID_INPUT');
 const b={...touch(),unused:'x'.repeat(5000)};expectFailure(b,'INVALID_INPUT');
 const getter=Object.defineProperty({},'commandId',{get(){throw new Error('must not execute getter')},enumerable:true});
 expectFailure(getter,'INVALID_INPUT');
 const ctx=context();ctx.rows[0]!.argsSchema={};ctx.rows[0]!.textAliases=['same alias'];ctx.rows.push({...structuredClone(ctx.rows[0]!),semanticRef:{id:'other.semantic@1',version:'1',sourceHash:h('a')},textAliases:['same alias']});
 expectFailure(text('same alias'),'AMBIGUOUS_TEXT',ctx);
});
test('no unreviewed schema/hash extension or function executable descriptor can enter compiler',()=>{
```

_First 80 of 94 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

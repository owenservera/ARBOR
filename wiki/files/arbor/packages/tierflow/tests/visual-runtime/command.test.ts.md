# File: packages/tierflow/tests/visual-runtime/command.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/command.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 5375 B |
| Lines | 68 |
| Hash | 623dec206a2c |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| h | function | 6 | no | const h = (v: string) =&gt; v.repeat(64); |
| capability | const | 7 | no | const capability = { supportedByBuild:true, availableNow:&#39;yes&#39; as const, permittedForActor:&#39;unknown&#39; as const, verifiedByEvidence:false, reasonCodes:[&#39;FIXTURE_ONLY&#39;] }; |
| rows | const | 8 | no | const rows: CrosswalkRow[] = [ |
| descriptors | const | 17 | no | const descriptors: ActionDescriptor[] = rows.map(r =&gt; ({target:{...r.target},argsSchemaHash:r.argsSchemaHash,sourceHash:r.riskSource.sourceHash, risk:r.risk,implementationStatus:r.implementationStatu… |
| context | function | 19 | no | const context = () =&gt; ({rows:structuredClone(rows),descriptors:structuredClone(descriptors),currentVersions:{hostWorld:&#39;3&#39;,policy:&#39;p1&#39;,kb:&#39;k1&#39;,uiRevision:&#39;u1&#39;}}); |
| input | function | 20 | no | const input = (surface:&#39;text&#39;\|&#39;touch&#39;\|&#39;keyboard&#39;,id:string,args:Record&lt;string,string&gt;={}) =&gt; surface===&#39;text&#39; ? |
| candidate | const | 23 | no | const candidate = (v:unknown,ctx=context()) =&gt; { const r=compileVisualCommand(v,ctx);assert.equal(r.outcome,&#39;candidate&#39;,JSON.stringify(r)); |
| variants | const | 28 | no | const variants = row.semanticRef.id === &#39;ui.theme.set@1&#39; ? [&#39;lab&#39;,&#39;tide&#39;,&#39;dusk&#39;,&#39;ember&#39;,&#39;grove&#39;,&#39;ink&#39;,&#39;dawn&#39;].map(preset=&gt;({preset})) : [{}]; |
| commands | const | 30 | no | const commands=([&#39;text&#39;,&#39;touch&#39;,&#39;keyboard&#39;] as const).map(m=&gt;candidate(input(m,row.semanticRef.id,args))); |
| semantic | function | 31 | no | const semantic = (v:typeof commands[number])=&gt;({semanticRef:v.semanticRef,target:v.target,args:v.args,risk:v.risk,capability:v.capability,sourceVersions:v.sourceVersions}); |
| v | const | 41 | no | const v = candidate({commandId:&#39;x&#39;,source:{surface:&#39;text&#39;,inputDigest:h(&#39;2&#39;)},text:&#39;show my theme&#39;}); |
| id | const | 46 | no | const id=&#39;ui.theme.set@1&#39;; |
| text | const | 47 | no | const text=toExactText(id,{preset:&#39;dusk&#39;}); |
| v | const | 52 | no | const v=input(&#39;touch&#39;,&#39;ui.theme.set@1&#39;,{preset:&#39;dusk&#39;}); |
| ctx | const | 53 | no | const ctx=context();const before=JSON.stringify(ctx); |
| first | const | 54 | no | const first=compileVisualCommand(v,ctx);const second=compileVisualCommand(v,ctx); |
| v | const | 60 | no | const v={...input(&#39;text&#39;,&#39;ui.theme.set@1&#39;,{preset:&#39;dusk&#39;}),aiProposal:{semanticId:&#39;ui.theme.set@1&#39;,args:{preset:&#39;dusk&#39;}}}; |
| c | const | 61 | no | const c=candidate(v);assert.equal(c.interpretation.method,&#39;bounded-ai-proposal&#39;); |
| c | const | 65 | no | const c=candidate(input(&#39;keyboard&#39;,&#39;ui.theme.show@1&#39;)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/visual-runtime/command/compile.ts | import | 3 | [packages/tierflow/src/visual-runtime/command/compile.ts](../../src/visual-runtime/command/compile.ts.md) |
| ../../src/visual-runtime/command/crosswalk.ts | import | 4 | [packages/tierflow/src/visual-runtime/command/crosswalk.ts](../../src/visual-runtime/command/crosswalk.ts.md) |
| ../../src/visual-runtime/command/ir.ts | import | 5 | [packages/tierflow/src/visual-runtime/command/ir.ts](../../src/visual-runtime/command/ir.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { compileVisualCommand, toExactText } from '../../src/visual-runtime/command/compile.ts';
import { type ActionDescriptor, type CrosswalkRow } from '../../src/visual-runtime/command/crosswalk.ts';
import { VISUAL_COMMAND_SCHEMA } from '../../src/visual-runtime/command/ir.ts';
const h = (v: string) => v.repeat(64);
const capability = { supportedByBuild:true, availableNow:'yes' as const, permittedForActor:'unknown' as const, verifiedByEvidence:false, reasonCodes:['FIXTURE_ONLY'] };
const rows: CrosswalkRow[] = [
  { semanticRef:{id:'ui.theme.show@1',version:'1',sourceHash:h('a')}, target:{owner:'host_effect', actionId:'ui.theme.show',catalogVersion:6},
    argsSchema:{},argsSchemaHash:h('b'),risk:'R0',riskSource:{authority:'host_catalog',sourceHash:h('c')},implementationStatus:'source_wired',reviewedEnabled:true,textAliases:['show my theme'] },
  { semanticRef:{id:'ui.theme.set@1',version:'1',sourceHash:h('d')},target:{owner:'host_effect',actionId:'ui.theme.set_preset',catalogVersion:6},
    argsSchema:{preset:{type:'enum',values:['lab','tide','dusk','ember','grove','ink','dawn']}},argsSchemaHash:h('e'),risk:'R1',
    riskSource:{authority:'host_catalog',sourceHash:h('f')},implementationStatus:'source_wired',reviewedEnabled:true },
  { semanticRef:{id:'ui.layout.preview@1',version:'1',sourceHash:h('a')},target:{owner:'ui_document',actionId:'ui.publish',catalogVersion:1},
    argsSchema:{},argsSchemaHash:h('7'),risk:'R1',riskSource:{authority:'ui_contract',sourceHash:h('8')},implementationStatus:'verified',reviewedEnabled:true },
];
const descriptors: ActionDescriptor[] = rows.map(r => ({target:{...r.target},argsSchemaHash:r.argsSchemaHash,sourceHash:r.riskSource.sourceHash,
  risk:r.risk,implementationStatus:r.implementationStatus,capability:{...capability}}));
const context = () => ({rows:structuredClone(rows),descriptors:structuredClone(descriptors),currentVersions:{hostWorld:'3',policy:'p1',kb:'k1',uiRevision:'u1'}});
const input = (surface:'text'|'touch'|'keyboard',id:string,args:Record<string,string>={}) => surface==='text' ?
  {commandId:'c-1',source:{surface,inputDigest:h('1')},text:toExactText(id,args),expectedVersions:{policy:'p1'}} :
  {commandId:'c-1',source:{surface,inputDigest:h('1')},selection:{semanticId:id,args},expectedVersions:{policy:'p1'}};
const candidate = (v:unknown,ctx=context()) => { const r=compileVisualCommand(v,ctx);assert.equal(r.outcome,'candidate',JSON.stringify(r));
  if(r.outcome!=='candidate') throw new Error('not candidate'); return r.command; };

test('VR2-06: every exposed action and every enum value has text/touch/keyboard semantic parity', () => {
  for(const row of rows) {
    const variants = row.semanticRef.id === 'ui.theme.set@1' ? ['lab','tide','dusk','ember','grove','ink','dawn'].map(preset=>({preset})) : [{}];
    for(const args of variants) {
      const commands=(['text','touch','keyboard'] as const).map(m=>candidate(input(m,row.semanticRef.id,args)));
      const semantic = (v:typeof commands[number])=>({semanticRef:v.semanticRef,target:v.target,args:v.args,risk:v.risk,capability:v.capability,sourceVersions:v.sourceVersions});
      assert.deepEqual(semantic(commands[0]!),semantic(commands[1]!));
      assert.deepEqual(semantic(commands[1]!),semantic(commands[2]!));
      assert.equal(commands[0]!.schema,VISUAL_COMMAND_SCHEMA);
      assert.equal(commands[0]!.capability.permittedForActor,'unknown');
      assert.equal(commands[0]!.capability.verifiedByEvidence,false);
    }
  }
});
test('human-readable exact alias is allowed only for zero-argument registered row',()=>{
  const v = candidate({commandId:'x',source:{surface:'text',inputDigest:h('2')},text:'show my theme'});
  assert.equal(v.target.actionId,'ui.theme.show');
  assert.deepEqual(v.args,{});
});
test('typed exact text round-trips escaped JSON arguments and canonical key order',()=>{
  const id='ui.theme.set@1';
  const text=toExactText(id,{preset:'dusk'});
  assert.equal(text,'/ui.theme.set@1 preset="dusk"');
  assert.equal(candidate(input('text',id,{preset:'dusk'})).args.preset,'dusk');
});
test('pure compilation is deterministic and creates no effect callbacks, writes or approvals',()=>{
  const v=input('touch','ui.theme.set@1',{preset:'dusk'});
  const ctx=context();const before=JSON.stringify(ctx);
  const first=compileVisualCommand(v,ctx);const second=compileVisualCommand(v,ctx);
  assert.deepEqual(first,second);assert.equal(JSON.stringify(ctx),before);
  assert.equal('execute' in first,false);assert.equal('authorize' in first,false);
  assert.equal('approval' in first,false);
});
test('AI proposal can only confirm the exact deterministically parsed owner text',()=>{
  const v={...input('text','ui.theme.set@1',{preset:'dusk'}),aiProposal:{semanticId:'ui.theme.set@1',args:{preset:'dusk'}}};
  const c=candidate(v);assert.equal(c.interpretation.method,'bounded-ai-proposal');
  assert.equal(c.target.actionId,'ui.theme.set_preset');
});
test('risk and capability remain separate: never imply owner permission or proof',()=>{
  const c=candidate(input('keyboard','ui.theme.show@1'));
  assert.equal(c.risk.level,'R0');assert.equal(c.capability.permittedForActor,'unknown');
  assert.equal(c.capability.verifiedByEvidence,false);
});
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

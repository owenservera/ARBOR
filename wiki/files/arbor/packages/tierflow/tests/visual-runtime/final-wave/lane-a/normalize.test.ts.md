# File: packages/tierflow/tests/visual-runtime/final-wave/lane-a/normalize.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/final-wave/lane-a/normalize.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 9802 B |
| Lines | 160 |
| Hash | 18218721c7bc |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| h | function | 9 | no | const h = (s: string) =&gt; createHash(&#39;sha256&#39;).update(s).digest(&#39;hex&#39;); |
| hp | const | 10 | no | const hp = h(&#39;policy&#39;), hs = h(&#39;schema&#39;), hm = h(&#39;hq-registry&#39;); |
| pins | const | 11 | no | const pins = {hostWorld:&#39;world-v8&#39;,policy:&#39;policy-v8&#39;,uiRevision:&#39;12&#39;,kb:&#39;kb-v8&#39;}; |
| args | const | 12 | no | const args = {target_kind:&#39;document&#39;,target_ref:&#39;founder_workspace&#39;,panel_type:&#39;blocked_tasks&#39;}; |
| schema | const | 13 | no | const schema = { |
| target | const | 18 | no | const target = {owner:&#39;ui_document&#39; as const,actionId:&#39;ui.panel.create&#39;,catalogVersion:1}; |
| row | const | 19 | no | const row:CrosswalkRow = { |
| descriptor | const | 24 | no | const descriptor:ActionDescriptor = { |
| scope | const | 29 | no | const scope={ownerId:&#39;owner_a&#39;,actorId:&#39;actor_a&#39;,deviceId:&#39;desktop_a&#39;, |
| context | function | 31 | no | function context(edits:Partial&lt;AuthorContext&gt;={}):AuthorContext { |
| intent | function | 43 | no | function intent(surface:AuthorIntent[&#39;surface&#39;]=&#39;text&#39;, edits:Partial&lt;AuthorIntent&gt;={}):AuthorIntent { |
| ok | const | 49 | no | const ok = (event:unknown, broker:unknown=context()) =&gt; { |
| result | const | 50 | no | const result=normalizeLaneAAuthoring(event,broker); |
| denied | function | 60 | no | const denied = (e:unknown,c:unknown,code:string) =&gt; { |
| result | const | 61 | no | const result=normalizeLaneAAuthoring(e,c); |
| r | const | 70 | no | const r=ok(intent()); |
| exact | const | 80 | no | const exact=toExactText(&#39;ui.create@1&#39;,args); |
| base | const | 85 | no | const base=ok(intent()); |
| next | const | 87 | no | const next=ok(intent(surface)); |
| phoneScope | const | 90 | no | const phoneScope={...scope,deviceId:&#39;phone_1&#39;,sessionId:&#39;session_phone&#39;}; |
| phone | const | 91 | no | const phone=ok(intent(&#39;text&#39;,{scope:phoneScope}),context({scope:phoneScope,device:&#39;phone&#39;})); |
| r3 | const | 121 | no | const r3={...row,risk:&#39;R3&#39; as const}; |
| d3 | const | 122 | no | const d3={...descriptor,risk:&#39;R3&#39; as const}; |
| host | const | 124 | no | const host={...target,owner:&#39;host_effect&#39; as const}; |
| hr | const | 125 | no | const hr={...row,target:host,riskSource:{authority:&#39;host_catalog&#39; as const,sourceHash:hp}}; |
| hd | const | 126 | no | const hd={...descriptor,target:host}; |
| r2 | const | 130 | no | const r2={...row,risk:&#39;R2&#39; as const}; |
| d2 | const | 131 | no | const d2={...descriptor,risk:&#39;R2&#39; as const}; |
| compiled | const | 132 | no | const compiled={rows:[r2],descriptors:[d2],currentVersions:pins}; |
| phoneScope | const | 133 | no | const phoneScope={...scope,deviceId:&#39;phone_1&#39;,sessionId:&#39;session_phone&#39;}; |
| phone | const | 134 | no | const phone=context({scope:phoneScope,device:&#39;phone&#39;,compiled}); |
| desktop | const | 137 | no | const desktop=ok(intent(),context({compiled})); |
| otherArgs | const | 146 | no | const otherArgs={...args,target_ref:&#39;foreign_document&#39;}; |
| newControls | const | 147 | no | const newControls=[{...context().controls[0]!,args:otherArgs}]; |
| missing | const | 149 | no | const missing={...args,target_kind:&#39;object&#39;,target_ref:&#39;unbound_obj&#39;}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 1 | external |
| node:crypto | import | 2 | external |
| ../../../../src/visual-runtime/command/compile.ts | import | 3 | [packages/tierflow/src/visual-runtime/command/compile.ts](../../../../src/visual-runtime/command/compile.ts.md) |
| ../../../../src/visual-runtime/final-wave/lane-a/normalize.ts | import | 4 | [packages/tierflow/src/visual-runtime/final-wave/lane-a/normalize.ts](../../../../src/visual-runtime/final-wave/lane-a/normalize.ts.md) |
| ../../../../src/visual-runtime/command/crosswalk.ts | import | 7 | [packages/tierflow/src/visual-runtime/command/crosswalk.ts](../../../../src/visual-runtime/command/crosswalk.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 161 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)

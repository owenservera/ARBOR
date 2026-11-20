# File: packages/tierflow/tests/visual-runtime/final-wave/lane-f/real-wave4b-regression.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/final-wave/lane-f/real-wave4b-regression.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 4899 B |
| Lines | 81 |
| Hash | 6a76e67ed40e |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| genuinePhone | function | 10 | no | function genuinePhone(): PhoneProjectionInput { |
| canonical | const | 11 | no | const canonical=founderDocument(); |
| rendered | const | 12 | no | const rendered=renderWave3Semantics(canonical,{viewportPx:360,knownActions:[ACTION]}); |
| input | const | 24 | no | const input=genuinePhone(); |
| diagnosis | const | 30 | no | const diagnosis=diagnoseWave4BRoot(input.canonical,input.rendered); |
| b | const | 35 | no | const b=projectWave4PhoneAdapter(input); |
| input | const | 43 | no | const input=genuinePhone(); |
| forged | const | 46 | no | const forged={...input.canonical,rootId:&#39;render_root&#39;} as typeof input.canonical; |
| diagnosis | const | 47 | no | const diagnosis=diagnoseWave4BRoot(forged,input.rendered); |
| b | const | 52 | no | const b=projectWave4PhoneAdapter({...input,canonical:forged}); |
| input | const | 62 | no | const input=genuinePhone(); |
| seen | const | 63 | no | const seen=new Set&lt;string&gt;(); |
| walk | function | 64 | no | const walk=(n:typeof input.rendered.plan.root):void=&gt;{ |
| forged | const | 70 | no | const forged={...input.canonical,rootId:&#39;render_root&#39;}; |
| input | const | 76 | no | const input=genuinePhone(); |
| duplicate | const | 77 | no | const duplicate={...input,shell:{...input.shell,publisher:&#39;other&#39;}} as unknown as PhoneProjectionInput; |
| stale | const | 79 | no | const stale={...input,host:{...input.host,grantExpiresAtMs:NOW}}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| ../../integration-4/fixture.ts | import | 4 | [packages/tierflow/tests/visual-runtime/integration-4/fixture.ts](../../integration-4/fixture.ts.md) |
| ../../../../src/visual-runtime/render/wave3-semantics.ts | import | 5 | [packages/tierflow/src/visual-runtime/render/wave3-semantics.ts](../../../../src/visual-runtime/render/wave3-semantics.ts.md) |
| ../../../../src/visual-runtime/device/wave4-phone-adapter.ts | import | 6 | [packages/tierflow/src/visual-runtime/device/wave4-phone-adapter.ts](../../../../src/visual-runtime/device/wave4-phone-adapter.ts.md) |
| ../../../../src/visual-runtime/final-wave/lane-f/existing-clients.ts | import | 7 | [packages/tierflow/src/visual-runtime/final-wave/lane-f/existing-clients.ts](../../../../src/visual-runtime/final-wave/lane-f/existing-clients.ts.md) |
| ../../../../src/visual-runtime/device/wave4-phone-adapter.ts | import | 8 | [packages/tierflow/src/visual-runtime/device/wave4-phone-adapter.ts](../../../../src/visual-runtime/device/wave4-phone-adapter.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/** Execute under TierFlow Bun checkout. Real Wave 3 renderer and Wave 4 B imports. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { founderDocument, ACTION, NOW } from '../../integration-4/fixture.ts';
import { renderWave3Semantics } from '../../../../src/visual-runtime/render/wave3-semantics.ts';
import { projectWave4PhoneAdapter } from '../../../../src/visual-runtime/device/wave4-phone-adapter.ts';
import { diagnoseWave4BRoot } from '../../../../src/visual-runtime/final-wave/lane-f/existing-clients.ts';
import type { PhoneProjectionInput } from '../../../../src/visual-runtime/device/wave4-phone-adapter.ts';

function genuinePhone(): PhoneProjectionInput {
  const canonical=founderDocument();
  const rendered=renderWave3Semantics(canonical,{viewportPx:360,knownActions:[ACTION]});
  return {canonical,rendered,
    shell:{app:'existing-vivim-apk',relay:'existing-mobile-relay',publisher:'harness',viewportPx:360},
    pairing:{state:'paired',ownerRef:'owner_a',worldRef:'workspace_a',deviceRef:'phone_1',sessionRef:'session_1',
      epoch:3,receivedSequence:51,lastAcceptedSequence:50,expiresAtMs:NOW+600_000},
    host:{state:'online',ownerRef:'owner_a',worldRef:'workspace_a',deviceRef:'phone_1',sessionRef:'session_1',
      pairingEpoch:3,policyRevision:9,nowMs:NOW,grantExpiresAtMs:NOW+600_000,
      documentRevision:canonical.revision,denied:false,
      actionRisks:[{nodeId:'preview',id:ACTION.id,version:ACTION.version,risk:'R0',policyRevision:9}]}};
}

test('actual Wave 3 rendering now projects after the owner-authorized Wave 4 B repair',()=>{
  const input=genuinePhone();
  // The renderer facts are unchanged and are still asserted: the Wave 3 renderer always
  // emits a synthetic 'render_root' wrapper whose child is the canonical root node.
  assert.equal(input.rendered.status,'ok');
  assert.equal(input.rendered.plan.root.id,'render_root');
  assert.equal(input.rendered.plan.root.children[0]?.id,input.canonical.rootId);
  const diagnosis=diagnoseWave4BRoot(input.canonical,input.rendered);
  assert.equal(diagnosis.compatibility,'WAVE4B_WRAPPER_DEFECT');
  // The owner-authorized patch is applied, so the repaired guard accepts this shape.
  assert.equal(diagnosis.repairedGuardAccepts,true);
  assert.equal(diagnosis.requiresWave4BOwnerPatch,false);
  const b=projectWave4PhoneAdapter(input);
  assert.equal(b.status,'ready');
  assert.equal(b.refusalCode,null);
  assert.equal(b.effectInvoked,false);
  assert.equal(b.canApproveOnPhone,false);
  assert.equal(b.automaticRetryAllowed,false);
});
test('the applied repair still refuses an UNDECLARED render_root alias',()=>{
  const input=genuinePhone();
  // A canonical document that claims the renderer's synthetic alias as its root has NO
  // node of that id. The repair must refuse it, not silently accept the alias.
  const forged={...input.canonical,rootId:'render_root'} as typeof input.canonical;
  const diagnosis=diagnoseWave4BRoot(forged,input.rendered);
  assert.equal(diagnosis.compatibility,'UNDECLARED_ROOT');
  // The applied repair does NOT accept the alias: the canonical root must be a
  // DECLARED node present in the sanitized render tree.
  assert.equal(diagnosis.repairedGuardAccepts,false);
  const b=projectWave4PhoneAdapter({...input,canonical:forged});
  assert.equal(b.status,'unavailable');
  assert.ok(b.refusalCode!==null);
  assert.notEqual(b.refusalCode,'NONE');
  assert.equal(b.effectInvoked,false);
  assert.equal(b.canApproveOnPhone,false);
  assert.equal(b.automaticRetryAllowed,false);
});

test('proposed owner-only predicate accepts canonical descendant but refuses unbacked alias',()=>{
  const input=genuinePhone();
  const seen=new Set<string>();
  const walk=(n:typeof input.rendered.plan.root):void=>{
    assert.ok(!seen.has(n.id));seen.add(n.id);for(const c of n.children)walk(c);
  };
  walk(input.rendered.plan.root);
  assert.equal(input.rendered.plan.root.id===input.canonical.rootId,false);
  assert.equal(seen.has(input.canonical.rootId)&&input.canonical.nodes.some(n=>n.id===input.canonical.rootId),true);
  const forged={...input.canonical,rootId:'render_root'};
  assert.equal(diagnoseWave4BRoot(forged,input.rendered).compatibility,'UNDECLARED_ROOT');
  assert.equal(seen.has(forged.rootId)&&forged.nodes.some(n=>n.id===forged.rootId),false);
});

test('existing phone rejects hostile duplicate publisher and stale grant before render compatibility',()=>{
  const input=genuinePhone();
  const duplicate={...input,shell:{...input.shell,publisher:'other'}} as unknown as PhoneProjectionInput;
  assert.equal(projectWave4PhoneAdapter(duplicate).refusalCode,'DUPLICATE_PUBLISHER');
  const stale={...input,host:{...input.host,grantExpiresAtMs:NOW}};
  assert.equal(projectWave4PhoneAdapter(stale).refusalCode,'STALE_AUTHORIZATION');
```

_First 80 of 82 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)

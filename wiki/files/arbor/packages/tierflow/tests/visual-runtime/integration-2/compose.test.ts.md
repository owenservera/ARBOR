# File: packages/tierflow/tests/visual-runtime/integration-2/compose.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/integration-2/compose.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 9367 B |
| Lines | 184 |
| Hash | 8b9f6d80a442 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| composition | const | 24 | no | const composition = await composeIntegration2(); |
| lanes | const | 28 | no | const lanes = composition.legs.map((leg) =&gt; leg.lane); |
| abSeam | const | 50 | no | const abSeam = composition.seams.find((seam) =&gt; seam.from === &#39;A&#39; &amp;&amp; seam.to === &#39;B&#39;); |
| shapes | const | 89 | no | const shapes = composition.laneD.rendered.map((entry) =&gt; entry.snapshot.replace(/^\\{&quot;width&quot;:\\d+/, &#39;{&quot;width&quot;:&#39;)); |
| again | const | 182 | no | const again = await composeIntegration2(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 15 | external |
| node:assert/strict | import | 16 | external |
| ../../../src/visual-runtime/integration-2/compose.ts | import | 17 | [packages/tierflow/src/visual-runtime/integration-2/compose.ts](../../../src/visual-runtime/integration-2/compose.ts.md) |
| ../../../src/visual-runtime/document/schema.ts | import | 22 | [packages/tierflow/src/visual-runtime/document/schema.ts](../../../src/visual-runtime/document/schema.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Wave 2 / Integration 2 — REAL cross-lane acceptance over the Lane A–H modules.
 *
 * Integrator-owned path (WAVE-3-OWNERSHIP.md: `tests/visual-runtime/integration-2/**`).
 *
 * Every assertion below runs against the committed lane modules themselves.
 * There are no mocks, no stubs and no re-implementations in this file or in
 * `src/visual-runtime/integration-2/compose.ts`: each lane leg is an in-process
 * call into the real module. The fixtures are synthetic and inert — no live
 * Host, KB, Studio, Android, provider browser or device is contacted.
 *
 * Where two lanes genuinely disagree the test asserts the measured refusal.
 * A seam that is known to be incompatible must NOT be reported as a pass.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CANONICAL_DOCUMENT,
  COMPOSITION_SCHEMA,
  composeIntegration2,
} from '../../../src/visual-runtime/integration-2/compose.ts';
import { UI_DOCUMENT_SCHEMA } from '../../../src/visual-runtime/document/schema.ts';

const composition = await composeIntegration2();

test('VR2-08: one canonical document crosses all eight lanes in a single composed run', () => {
  assert.equal(composition.schema, COMPOSITION_SCHEMA);
  const lanes = composition.legs.map((leg) => leg.lane);
  assert.deepEqual([...lanes].sort(), ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  for (const leg of composition.legs) assert.equal(leg.evidence, 'real-module-call');
  assert.equal(CANONICAL_DOCUMENT.schema, UI_DOCUMENT_SCHEMA);
  assert.ok(composition.seams.length >= 6, 'every measured seam is recorded');
});

test('Lane A validates the canonical document and refuses nothing', () => {
  assert.equal(composition.laneA.ok, true);
  assert.equal(composition.laneA.readOnly, false);
  assert.deepEqual(composition.laneA.diagnostics, []);
  assert.equal(composition.laneA.nodeCount, 6);
  assert.deepEqual(composition.laneA.actionRefs, [{ id: 'fixture.preview', version: 1 }]);
});

test('Lane B refuses the Lane A node with a measured reason, and accepts its own vocabulary', () => {
  // A->B is genuinely incompatible (contract decision I2-03). The composition
  // measures that refusal; it must never be reported as a composed pass.
  assert.equal(composition.laneB.aNodeAccepted, false);
  assert.equal(composition.laneB.aNodeCode, 'UNSAFE_PROP');
  assert.match(composition.laneB.aNodeReason ?? '', /description/);
  assert.equal(composition.laneB.bNativeAccepted, true);
  const abSeam = composition.seams.find((seam) => seam.from === 'A' && seam.to === 'B');
  assert.equal(abSeam?.status, 'refused-measured');
  assert.match(abSeam?.owner ?? '', /Lane B Wave 3 canonical map/);
});

test('Lane B resolves responsive layout at 320, 360 and 1280', () => {
  assert.deepEqual(
    composition.laneB.layout.map((entry) => [entry.viewportPx, entry.columns]),
    [[320, 1], [360, 1], [1280, 2]],
  );
  for (const entry of composition.laneB.layout) {
    assert.ok(entry.itemWidthPx >= 44);
    assert.equal(entry.gapPx, 12);
    assert.equal(entry.paddingPx, 16);
  }
});

test('Lane C publishes the Lane A document with CAS, idempotency and read-only preview', () => {
  assert.equal(composition.laneC.baseRevision, 0);
  assert.equal(composition.laneC.draftRevision, 2);
  assert.equal(composition.laneC.previewMatchesEdit, true);
  assert.equal(composition.laneC.documentsAfterPreview, 0, 'preview never commits');
  assert.equal(composition.laneC.committedRevision, 1);
  assert.match(composition.laneC.committedDigest ?? '', /^sha256:[a-f0-9]{64}$/);
  assert.equal(composition.laneC.replayed, true, 'replaying a command id is idempotent');
  assert.equal(composition.laneC.staleRefusal, 'REVISION_CONFLICT');
  assert.equal(composition.laneC.digestMismatchRefusal, 'DIGEST_MISMATCH');
  assert.equal(composition.laneC.rollbackRevision, 2);
});

test('Lane D refuses the raw Lane A document and renders only the adapter output', () => {
```

_First 80 of 185 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)

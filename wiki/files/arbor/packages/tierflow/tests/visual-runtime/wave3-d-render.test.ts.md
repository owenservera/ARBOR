# File: packages/tierflow/tests/visual-runtime/wave3-d-render.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/wave3-d-render.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 9756 B |
| Lines | 158 |
| Hash | 33184df3a2df |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| KNOWN_ACTIONS | const | 8 | no | const KNOWN_ACTIONS: readonly UiActionReference[] = Object.freeze([{ id: &quot;fixture.preview&quot;, version: 1 }]); |
| documentFixture | function | 9 | no | function documentFixture() { |
| MutableFixture | type | 28 | no | type MutableFixture = ReturnType&lt;typeof documentFixture&gt;; |
| copy | function | 29 | no | const copy = (): MutableFixture =&gt; JSON.parse(JSON.stringify(documentFixture())) as MutableFixture; |
| render | function | 30 | no | const render = (value: unknown, viewportPx = 360, knownActions: readonly UiActionReference[] = KNOWN_ACTIONS) =&gt; |
| d | const | 36 | no | const d = documentFixture(); |
| result | const | 38 | no | const result = render(d); |
| serialized | const | 46 | no | const serialized = JSON.stringify(result.plan); |
| results | const | 57 | no | const results = [320, 360, 1280].map(width =&gt; render(documentFixture(), width)); |
| stripLayout | function | 64 | no | const stripLayout = (value: unknown) =&gt; JSON.stringify(value, (key, x: unknown) =&gt; key === &quot;layout&quot; \|\| key === &quot;viewportPx&quot; ? undefined : x); |
| d | const | 72 | no | const d = copy(); |
| result | const | 74 | no | const result = render(d); |
| stale | const | 81 | no | const stale = copy(); |
| d | const | 90 | no | const d = copy(); |
| result | const | 92 | no | const result = render(d); |
| d | const | 101 | no | const d = copy(); |
| d | const | 105 | no | const d = copy(); |
| d | const | 111 | no | const d = copy(); |
| badSpatial | const | 114 | no | const badSpatial = copy(); |
| huge | const | 120 | no | const huge = copy(); |
| more | const | 121 | no | const more = Array.from({ length: 65 }, (_, i) =&gt; ({ id: `node_${i}`, type: &quot;text&quot;, props: { value: &quot;a&quot; }, children: [], a11y: { role: &quot;text&quot;, name: &quot;a&quot; }, bindingRefs: [] })); |
| missing | const | 124 | no | const missing = copy(); |
| focus | const | 127 | no | const focus = copy(); |
| d | const | 134 | no | const d = copy(); |
| d | const | 142 | no | const d = copy(); |
| result | const | 144 | no | const result = render(d); |
| invalid | const | 154 | no | const invalid = [{ id: &quot;fixture.preview&quot;, version: 1, onClick: () =&gt; undefined }]; |
| duplicate | const | 156 | no | const duplicate = [{ id: &quot;fixture.preview&quot;, version: 1 }, { id: &quot;fixture.preview&quot;, version: 1 }]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/visual-runtime/render/wave3-semantics.ts | import | 3 | [packages/tierflow/src/visual-runtime/render/wave3-semantics.ts](../../src/visual-runtime/render/wave3-semantics.ts.md) |
| ../../src/visual-runtime/render/inspect.ts | import | 4 | [packages/tierflow/src/visual-runtime/render/inspect.ts](../../src/visual-runtime/render/inspect.ts.md) |
| ../../src/visual-runtime/document/validate.ts | import | 5 | [packages/tierflow/src/visual-runtime/document/validate.ts](../../src/visual-runtime/document/validate.ts.md) |
| ../../src/visual-runtime/document/schema.ts | import | 6 | [packages/tierflow/src/visual-runtime/document/schema.ts](../../src/visual-runtime/document/schema.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import test from "node:test";
import assert from "node:assert/strict";
import { renderWave3Semantics } from "../../src/visual-runtime/render/wave3-semantics.ts";
import { inspectRenderPlan, snapshotRenderPlan } from "../../src/visual-runtime/render/inspect.ts";
import { validateUiDocument } from "../../src/visual-runtime/document/validate.ts";
import { UI_DOCUMENT_SCHEMA, type UiActionReference } from "../../src/visual-runtime/document/schema.ts";

const KNOWN_ACTIONS: readonly UiActionReference[] = Object.freeze([{ id: "fixture.preview", version: 1 }]);
function documentFixture() {
  return {
    schema: UI_DOCUMENT_SCHEMA, documentId: "founder_workspace", revision: 7,
    scope: { ownerRef: "owner_a", workspaceRef: "workspace_a" }, rootId: "root",
    nodes: [
      { id: "root", type: "stack", props: { direction: "vertical" }, children: ["panel", "grid", "preview"], a11y: { role: "main", name: "Founder Workspace" }, bindingRefs: [] },
      { id: "panel", type: "card", props: { title: "Project status", description: "Evidence-backed status" }, children: [], a11y: { role: "group", name: "Project status" }, bindingRefs: ["binding_status"] },
      { id: "grid", type: "grid", props: { columns: 4 }, children: ["text_one"], a11y: { role: "group", name: "Results" }, bindingRefs: [] },
      { id: "text_one", type: "text", props: { value: "Evidence-backed status", variant: "body" }, children: [], a11y: { role: "text", name: "Evidence-backed status" }, bindingRefs: [] },
      { id: "preview", type: "button", props: { label: "Preview change" }, children: [], actionRefs: [{ id: "fixture.preview", version: 1 }], a11y: { role: "button", name: "Preview change", focusOrder: 1 }, bindingRefs: [] },
    ],
    bindings: [{ id: "binding_status", version: 3, nodeId: "panel", field: "description", knowledgeRef: "knowledge_synthetic", provenanceRef: "provenance_fixture", readScope: "owner", availability: "present" }],
    views: [
      { id: "phone_view", version: 2, kind: "2d", viewport: "phone" },
      { id: "desktop_view", version: 2, kind: "2d", viewport: "desktop" },
      { id: "spatial_view", version: 1, kind: "spatial", fallbackViewId: "phone_view", sourceRef: "spatial_fixture" },
    ],
  };
}
type MutableFixture = ReturnType<typeof documentFixture>;
const copy = (): MutableFixture => JSON.parse(JSON.stringify(documentFixture())) as MutableFixture;
const render = (value: unknown, viewportPx = 360, knownActions: readonly UiActionReference[] = KNOWN_ACTIONS) =>
  renderWave3Semantics(value, { viewportPx, knownActions });

// This test calls real A validation, D legacy renderer, and D inspection: no
// mocked A/B/D modules or external KB/Host transport. All data is synthetic.
test("A->D versioned references resolve, without an action dispatcher", () => {
  const d = documentFixture();
  assert.equal(validateUiDocument(d, { knownActions: KNOWN_ACTIONS }).ok, true);
  const result = render(d);
  assert.equal(result.status, "partial"); // spatial fallback is explicitly lossy
  assert.equal(result.refusalCode, null);
  assert.deepEqual(result.actions, [{ nodeId: "preview", id: "fixture.preview", version: 1, displayAlias: "render_action_4_0", inert: true }]);
  assert.equal(result.plan.revision, 7);
  assert.equal(result.plan.schema, "vivim.ui-render-plan/1");
  assert.deepEqual(result.plan.focusOrder, ["preview"]);
  assert.deepEqual(result.provenance, [{ nodeId: "panel", bindingId: "binding_status", bindingVersion: 3, provenanceRef: "provenance_fixture", availability: "present", readScope: "owner", authorized: false }]);
  const serialized = JSON.stringify(result.plan);
  assert.ok(serialized.includes("render_action_") === false || !serialized.includes("fixture.preview"));
  assert.ok(!serialized.includes("onclick") && !serialized.includes("javascript:"));
  assert.equal(result.inspection.nodeCount, inspectRenderPlan(result.plan).nodeCount);
  assert.equal(result.plan.spatial.present, true);
  assert.ok(result.plan.issues.some(issue => issue.code === "SPATIAL_UNSUPPORTED"));
  assert.deepEqual(result.plan.focusOrder, ["preview"]);
  assert.ok(result.plan.trace.some(entry => entry.sourceId === "panel" && entry.outcome === "rendered"));
});

test("320/360/1280 responsive plans keep identical accessible data and action versions", () => {
  const results = [320, 360, 1280].map(width => render(documentFixture(), width));
  for (const [i, result] of results.entries()) {
    assert.equal(result.plan.viewportPx, [320, 360, 1280][i]);
    assert.equal(result.status, "partial");
    assert.equal(result.actions[0]?.version, 1);
    assert.deepEqual(result.plan.focusOrder, ["preview"]);
  }
  const stripLayout = (value: unknown) => JSON.stringify(value, (key, x: unknown) => key === "layout" || key === "viewportPx" ? undefined : x);
  assert.equal(stripLayout(results[0]!.plan.root), stripLayout(results[1]!.plan.root));
  assert.equal(stripLayout(results[0]!.plan.root), stripLayout(results[2]!.plan.root));
  assert.notEqual(snapshotRenderPlan(results[0]!.plan), snapshotRenderPlan(results[2]!.plan));
  assert.equal(results[0]!.plan.spatial.description, results[2]!.plan.spatial.description);
});

test("no spatial view is a complete inert 2D plan", () => {
  const d = copy();
  d.views = d.views.filter(v => v.kind !== "spatial");
  const result = render(d);
  assert.equal(result.status, "ok");
  assert.equal(result.plan.spatial.present, false);
  assert.deepEqual(result.plan.issues, []);
});

test("stale action version and unknown catalog action fail closed", () => {
```

_First 80 of 159 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

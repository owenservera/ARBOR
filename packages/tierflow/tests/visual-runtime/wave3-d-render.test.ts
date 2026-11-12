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
  const stale = copy();
  stale.nodes[4]!.actionRefs![0]!.version = 2;
  assert.equal(render(stale).refusalCode, "UNBOUND_ACTION");
  assert.equal(render(documentFixture(), 360, []).refusalCode, "UNBOUND_ACTION");
  assert.deepEqual(render(stale).actions, []);
});

test("unsafe HTML and injected javascript: text both fail closed", () => {
  for (const payload of ["<img src=x onerror=alert(1)>", "javascript:alert(1)"]) {
    const d = copy();
    d.nodes[3]!.props = { value: payload, variant: "body" };
    const result = render(d);
    assert.equal(result.status, "unavailable");
    assert.equal(result.refusalCode, "UNSAFE_VALUE");
    assert.equal(JSON.stringify(result).includes(payload), false);
  }
});

test("rogue handler and href props, including an enumerable accessor, are refused", () => {
  for (const key of ["onClick", "href", "dangerouslySetInnerHTML"]) {
    const d = copy();
    (d.nodes[4]!.props as Record<string, unknown>)[key] = "evil";
    assert.equal(render(d).status, "unavailable");
  }
  const d = copy();
  Object.defineProperty(d.nodes[1]!.props, "onClick", { enumerable: true, get() { throw Error("must not run"); } });
  assert.equal(render(d).status, "unavailable");
});

test("unknown component and unsupported spatial node fail closed, not silently dropped", () => {
  const d = copy();
  d.nodes[1]!.type = "threejs-scene";
  assert.equal(render(d).refusalCode, "UNKNOWN_COMPONENT");
  const badSpatial = copy();
  badSpatial.views[2] = { id: "spatial_view", version: 1, kind: "spatial", fallbackViewId: "missing_2d", sourceRef: "spatial_fixture" };
  assert.equal(render(badSpatial).refusalCode, "MISSING_REFERENCE");
});

test("huge node tree, missing button name/focus, and invalid viewport are refused", () => {
  const huge = copy();
  const more = Array.from({ length: 65 }, (_, i) => ({ id: `node_${i}`, type: "text", props: { value: "a" }, children: [], a11y: { role: "text", name: "a" }, bindingRefs: [] }));
  huge.nodes = more as unknown as MutableFixture["nodes"];
  assert.equal(render(huge).status, "unavailable");
  const missing = copy();
  delete (missing.nodes[4]!.a11y as { name?: string }).name;
  assert.equal(render(missing).status, "unavailable");
  const focus = copy();
  delete (focus.nodes[4]!.a11y as { focusOrder?: number }).focusOrder;
  assert.equal(render(focus).status, "unavailable");
  assert.equal(render(documentFixture(), 5).refusalCode, "INVALID_VIEWPORT");
});

test("out-of-order explicit focus is blocked rather than implementing positive tab indices", () => {
  const d = copy();
  d.nodes.push({ id: "preview_two", type: "button", props: { label: "Another preview" }, children: [], actionRefs: [{ id: "fixture.preview", version: 1 }], a11y: { role: "button", name: "Another preview", focusOrder: 0 }, bindingRefs: [] });
  (d.nodes[0]!.children as string[]).push("preview_two");
  assert.equal(render(d).refusalCode, "FOCUS_ORDER_CONFLICT");
});

test("revoked, missing, redacted, stale binding suppresses the entire document and provenance", () => {
  for (const availability of ["revoked", "missing", "redacted", "stale", "unknown", "deleted"]) {
    const d = copy();
    d.bindings[0]!.availability = availability;
    const result = render(d);
    assert.equal(result.status, "unavailable");
    assert.equal(result.refusalCode, "BOUND_DATA_UNAVAILABLE");
    assert.deepEqual(result.provenance, []);
    assert.deepEqual(result.actions, []);
    assert.equal(JSON.stringify(result).includes("Evidence-backed status"), false);
  }
});

test("malformed catalog is not granted and there is no caller action permission side-channel", () => {
  const invalid = [{ id: "fixture.preview", version: 1, onClick: () => undefined }];
  assert.equal(renderWave3Semantics(documentFixture(), { viewportPx: 360, knownActions: invalid }).refusalCode, "INVALID_ACTION_CATALOG");
  const duplicate = [{ id: "fixture.preview", version: 1 }, { id: "fixture.preview", version: 1 }];
  assert.equal(render(documentFixture(), 360, duplicate).refusalCode, "INVALID_ACTION_CATALOG");
});

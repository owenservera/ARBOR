import test from "node:test";
import assert from "node:assert/strict";
import { renderUiDocument } from "../../src/visual-runtime/render/dom.ts";
import { inspectRenderPlan, snapshotRenderPlan } from "../../src/visual-runtime/render/inspect.ts";

const fixture = {
  schema: "vivim.ui-document/1", documentId: "snapshot", revision: "rev_1",
  scope: { ownerRef: "owner_a", workspaceRef: "workspace_a" }, rootId: "root", nodes: [
    { id: "root", type: "grid", props: { columns: 4 }, a11y: { name: "Cards" }, children: ["text", "action"] },
    { id: "text", type: "text", props: { value: "One knowledge result" }, a11y: { name: "One knowledge result" }, children: [] },
    { id: "action", type: "button", props: { label: "Inspect" }, a11y: { name: "Inspect" }, actionRefs: ["action_a"], children: [] },
  ], bindings: [], views: [],
};

function snap(width: number) {
  const p = renderUiDocument(fixture, { viewportPx: width });
  return { p, trace: inspectRenderPlan(p), snapshot: snapshotRenderPlan(p) };
}

const semanticNodes = [
  ["render_root", "main", "main", "Visual document (read-only preview)", 0],
  ["root", "div", "group", "Cards", 1],
  ["text", "p", "paragraph", "One knowledge result", 2],
  ["action", "section", "button", "Inspect", 2],
];

for (const [width, expectedColumns] of [[320, 1], [360, 1], [1280, 4]] as const) {
  test(`semantic snapshot at ${width}px: stable focus, accessible labels, grid columns`, () => {
    const { p, trace, snapshot } = snap(width);
    assert.deepEqual(trace.nodes.map((n) => [n.id, n.tag, n.role, n.name, n.depth]), semanticNodes);
    assert.deepEqual(trace.focusOrder, ["action"]);
    assert.deepEqual(trace.issueCodes, []);
    assert.equal(p.root.children[0]?.layout.columns, expectedColumns);
    assert.equal(p.root.children[0]?.children[1]?.layout.minTargetPx, 44);
    assert.equal(snapshot, JSON.stringify({ width, status: "ok", nodes: semanticNodes, focus: ["action"], issues: [] }));
  });
}

test("snapshots keep node identity stable across narrow and desktop projections", () => {
  const ids = [320, 360, 1280].map((w) => snap(w).trace.nodes.map((n) => n.id));
  assert.deepEqual(ids[0], ids[1]);
  assert.deepEqual(ids[1], ids[2]);
});

test("snapshots never contain HTML, unsafe URLs, effect arguments or executable handlers", () => {
  for (const w of [320, 360, 1280]) {
    const s = snap(w).snapshot;
    assert.ok(!s.includes("action_a"));
    assert.ok(!s.includes("onClick"));
    assert.ok(!s.includes("javascript:"));
    assert.ok(!s.includes("<script"));
  }
});

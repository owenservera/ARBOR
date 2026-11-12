import test from "node:test";
import assert from "node:assert/strict";
import { renderUiDocument } from "../../src/visual-runtime/render/dom.ts";
import { inspectRenderPlan } from "../../src/visual-runtime/render/inspect.ts";
import { projectSpatialFallback } from "../../src/visual-runtime/render/spatial-fallback.ts";

// I2-C step 2: explicit fixture types. The renderer accepts `unknown` input and the
// cases below deliberately inject malformed nodes (unknown component type, unsafe
// DOM props, missing accessible name). An explicit fixture node type lets those
// negative mutations type-check without `any`, without weakening any lane contract,
// and without changing a single runtime value.
type FixtureNode = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  a11y: { role?: string; name?: string };
  children: string[];
  actionRefs?: string[];
};
type FixtureDocument = {
  schema: string;
  documentId: string;
  scope: { ownerRef: string; workspaceRef: string };
  revision: number;
  rootId: string;
  bindings: unknown[];
  views: unknown[];
  nodes: FixtureNode[];
};

function doc(): FixtureDocument {
  return {
    schema: "vivim.ui-document/1", documentId: "doc_one", scope: { ownerRef: "owner_one", workspaceRef: "ws_one" },
    revision: 3, rootId: "root", bindings: [], views: [], nodes: [
      { id: "root", type: "stack", props: { direction: "vertical" }, a11y: { role: "group", name: "Workspace" }, children: ["grid"] },
      { id: "grid", type: "grid", props: { columns: 4 }, a11y: { name: "Results" }, children: ["card", "action"] },
      { id: "card", type: "card", props: { title: "Source-backed result" }, a11y: { name: "Result" }, children: [] },
      { id: "action", type: "button", props: { label: "Preview change" }, actionRefs: ["act_preview"], a11y: { name: "Preview change" }, children: [] },
    ],
  };
}
const render = (value: unknown, width = 360) => renderUiDocument(value, { viewportPx: width });
const find = (node: ReturnType<typeof render>["root"], id: string): typeof node | undefined =>
  node.id === id ? node : node.children.map((child) => find(child, id)).find(Boolean);

test("valid canonical document produces inert semantic DOM with stable IDs", () => {
  const source = doc(); const before = JSON.stringify(source);
  const plan = render(source);
  assert.equal(plan.schema, "vivim.ui-render-plan/1");
  assert.equal(plan.status, "ok");
  assert.equal(plan.documentId, "doc_one");
  assert.equal(plan.revision, 3);
  assert.equal(find(plan.root, "card")?.text, "Source-backed result");
  assert.equal(find(plan.root, "action")?.attributes["aria-disabled"], "true");
  assert.equal(find(plan.root, "action")?.attributes.tabindex, "0");
  assert.deepEqual(plan.focusOrder, ["action"]);
  assert.equal(find(plan.root, "action")?.layout.minTargetPx, 44);
  assert.equal(JSON.stringify(source), before, "input must not be changed");
  assert.ok(!JSON.stringify(plan).includes("act_preview"), "opaque action must not be executable or exposed");
});

test("inspectable semantic trace shows source identity and focus order", () => {
  const report = inspectRenderPlan(render(doc()));
  assert.equal(report.schema, "vivim.ui-render-inspection/1");
  assert.deepEqual(report.focusOrder, ["action"]);
  assert.equal(report.nodes.find((n) => n.id === "action")?.role, "button");
  assert.ok(report.trace.some((e) => e.sourceId === "action" && e.code === "INERT_ACTION"));
  assert.ok(report.nodes.every((n) => !!n.role && (n.role === "paragraph" || n.name !== null)));
});

test("unsupported schema is read-only rather than silently guessed", () => {
  const unknown = { ...doc(), schema: "vivim.ui-document/999" };
  const result = render(unknown);
  assert.equal(result.status, "unavailable");
  assert.deepEqual(result.issues, [{ code: "UNSUPPORTED_SCHEMA" }]);
  assert.equal(result.focusOrder.length, 0);
  assert.match(result.root.text ?? "", /unavailable/i);
});

test("unknown node makes a visible read-only placeholder without leaking content", () => {
  const source = doc();
  source.nodes[2] = { ...source.nodes[2]!, type: "third-party-widget", props: { title: "Hidden" } };
  const result = render(source);
  assert.equal(result.status, "partial");
  assert.equal(find(result.root, "card")?.text, "Component unavailable (read only).");
  assert.ok(result.issues.some((issue) => issue.code === "UNKNOWN_COMPONENT"));
  assert.ok(!JSON.stringify(result).includes("Hidden"));
});

test("no provider HTML, URL or unsafe DOM props can reach the projection", () => {
  for (const unsafe of [
    { title: "<img src=x onerror=alert(1)>" }, { title: "javascript:alert(1)" },
    { title: "data:text/html,evil" }, { title: "https://evil.example" },
    { title: "Good", onClick: "alert(1)" }, { title: "Good", innerHTML: "<script/>" },
    { title: "Good", href: "javascript:alert(1)" },
  ]) {
    const source = doc(); source.nodes[2] = { ...source.nodes[2]!, props: unsafe };
    const result = render(source);
    assert.notEqual(result.status, "ok", JSON.stringify(unsafe));
    assert.ok(!JSON.stringify(result).includes("evil.example"));
    assert.ok(!JSON.stringify(result).includes("alert(1)"));
  }
});

test("traps are refused before invoking accessor getters or serialization hooks", () => {
  const source = doc(); let invoked = 0;
  Object.defineProperty(source.nodes[2]!.props, "title", { get() { invoked++; return "pwned"; } });
  assert.equal(render(source).status, "unavailable");
  assert.equal(invoked, 0);
});

test("unknown references, missing root, duplicated IDs and graph cycles are refused", () => {
  const unknown = doc(); unknown.nodes[0]!.children = ["not_registered"];
  assert.equal(render(unknown).issues[0]?.code, "INVALID_NODE_GRAPH");
  const duplicate = doc(); duplicate.nodes[1]!.id = "root";
  assert.equal(render(duplicate).issues[0]?.code, "INVALID_OR_DUPLICATE_ID");
  const cycle = doc(); cycle.nodes[3]!.children = ["root"];
  assert.equal(render(cycle).issues[0]?.code, "INVALID_NODE_GRAPH");
  const orphan = doc(); orphan.nodes[0]!.children = [];
  assert.equal(render(orphan).issues[0]?.code, "INVALID_NODE_GRAPH");
});

test("missing owner/workspace and malformed revision are refused", () => {
  assert.equal(render({ ...doc(), scope: { ownerRef: "" } }).status, "unavailable");
  assert.equal(render({ ...doc(), revision: -1 }).status, "unavailable");
  assert.equal(render({ ...doc(), documentId: "../escape" }).status, "unavailable");
});

test("spatial view explicitly reports loss and adds an accessible 2D note", () => {
  const source = doc(); source.views = [{ kind: "spatial", position: [1, 2, 3] }] as any;
  const plan = render(source);
  assert.equal(plan.status, "partial");
  assert.deepEqual(plan.spatial.lossCodes, ["SPATIAL_UNSUPPORTED"]);
  assert.equal(plan.spatial.sourceViewCount, 1);
  assert.match(find(plan.root, "spatial_fallback")?.text ?? "", /accessible two-dimensional/);
  assert.ok(plan.trace.some((row) => row.outcome === "spatial-fallback"));
  assert.equal(projectSpatialFallback([]).present, false);
});

test("responsive viewport range is bounded with a non-interactive refusal", () => {
  for (const width of [0, -1, 100, 4000, NaN, 320.3]) {
    assert.equal(render(doc(), width).issues[0]?.code, "INVALID_VIEWPORT");
  }
});

test("oversized, circular and executable input are refused without effects", () => {
  const oversized = doc(); oversized.nodes[2]!.props = { title: "a".repeat(33_000) };
  assert.equal(render(oversized).status, "unavailable");
  const circular: any = doc(); circular.self = circular;
  assert.equal(render(circular).issues[0]?.code, "UNSAFE_DOCUMENT");
  const executable: any = doc(); executable.handler = () => {};
  assert.equal(render(executable).issues[0]?.code, "UNSAFE_DOCUMENT");
});

test("missing accessibility name for actionable node is a read-only placeholder", () => {
  const source = doc();
  source.nodes[3] = { ...source.nodes[3]!, props: { label: "" }, a11y: {} };
  const plan = render(source);
  assert.equal(plan.status, "partial");
  assert.equal(find(plan.root, "action")?.attributes.role, "status");
  assert.deepEqual(plan.focusOrder, []);
});

test("same input and viewport yield byte-identical plans and inspections", () => {
  assert.equal(JSON.stringify(render(doc())), JSON.stringify(render(doc())));
  assert.deepEqual(inspectRenderPlan(render(doc())), inspectRenderPlan(render(doc())));
});

# File: packages/tierflow/tests/visual-runtime/render.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/render.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 8582 B |
| Lines | 167 |
| Hash | 6f8cb94a7b8b |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| FixtureNode | type | 12 | no | type FixtureNode = { |
| FixtureDocument | type | 20 | no | type FixtureDocument = { |
| doc | function | 31 | no | function doc(): FixtureDocument { |
| render | function | 42 | no | const render = (value: unknown, width = 360) =&gt; renderUiDocument(value, { viewportPx: width }); |
| find | function | 43 | no | const find = (node: ReturnType&lt;typeof render&gt;[&quot;root&quot;], id: string): typeof node \| undefined =&gt; |
| source | const | 47 | no | const source = doc(); const before = JSON.stringify(source); |
| plan | const | 48 | no | const plan = render(source); |
| report | const | 63 | no | const report = inspectRenderPlan(render(doc())); |
| unknown | const | 72 | no | const unknown = { ...doc(), schema: &quot;vivim.ui-document/999&quot; }; |
| result | const | 73 | no | const result = render(unknown); |
| source | const | 81 | no | const source = doc(); |
| result | const | 83 | no | const result = render(source); |
| source | const | 97 | no | const source = doc(); source.nodes[2] = { ...source.nodes[2]!, props: unsafe }; |
| result | const | 98 | no | const result = render(source); |
| source | const | 106 | no | const source = doc(); let invoked = 0; |
| unknown | const | 113 | no | const unknown = doc(); unknown.nodes[0]!.children = [&quot;not_registered&quot;]; |
| duplicate | const | 115 | no | const duplicate = doc(); duplicate.nodes[1]!.id = &quot;root&quot;; |
| cycle | const | 117 | no | const cycle = doc(); cycle.nodes[3]!.children = [&quot;root&quot;]; |
| orphan | const | 119 | no | const orphan = doc(); orphan.nodes[0]!.children = []; |
| source | const | 130 | no | const source = doc(); source.views = [{ kind: &quot;spatial&quot;, position: [1, 2, 3] }] as any; |
| plan | const | 131 | no | const plan = render(source); |
| oversized | const | 147 | no | const oversized = doc(); oversized.nodes[2]!.props = { title: &quot;a&quot;.repeat(33_000) }; |
| circular | const | 149 | no | const circular: any = doc(); circular.self = circular; |
| executable | const | 151 | no | const executable: any = doc(); executable.handler = () =&gt; {}; |
| source | const | 156 | no | const source = doc(); |
| plan | const | 158 | no | const plan = render(source); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/visual-runtime/render/dom.ts | import | 3 | [packages/tierflow/src/visual-runtime/render/dom.ts](../../src/visual-runtime/render/dom.ts.md) |
| ../../src/visual-runtime/render/inspect.ts | import | 4 | [packages/tierflow/src/visual-runtime/render/inspect.ts](../../src/visual-runtime/render/inspect.ts.md) |
| ../../src/visual-runtime/render/spatial-fallback.ts | import | 5 | [packages/tierflow/src/visual-runtime/render/spatial-fallback.ts](../../src/visual-runtime/render/spatial-fallback.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 168 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

# File: packages/tierflow/src/visual-runtime/render/inspect.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/render/inspect.ts |
| Language | TypeScript |
| Kind | source |
| Size | 1849 B |
| Lines | 40 |
| Hash | 66420812f1f1 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| Inspection | interface | 4 | yes | export interface Inspection { |
| inspectRenderPlan | function | 15 | yes | export function inspectRenderPlan(plan: RenderPlan): Inspection { |
| nodes | const | 16 | no | const nodes: { id: string; tag: string; role: string; name: string \| null; depth: number }[] = []; |
| visit | function | 17 | no | function visit(node: SemanticDomNode, depth: number): void { |
| snapshotRenderPlan | function | 33 | yes | export function snapshotRenderPlan(plan: RenderPlan): string { |
| inspection | const | 34 | no | const inspection = inspectRenderPlan(plan); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./dom.ts | import | 1 | [packages/tierflow/src/visual-runtime/render/dom.ts](./dom.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/integration-2/compose.ts](../integration-2/compose.ts.md) | ../render/inspect.ts |
| [packages/tierflow/src/visual-runtime/render/wave3-semantics.ts](./wave3-semantics.ts.md) | ./inspect.ts |
| [packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts](../../../tests/visual-runtime/integration-2/real-a-h.test.ts.md) | ../../../src/visual-runtime/render/inspect.ts |
| [packages/tierflow/tests/visual-runtime/render-snapshots.test.ts](../../../tests/visual-runtime/render-snapshots.test.ts.md) | ../../src/visual-runtime/render/inspect.ts |
| [packages/tierflow/tests/visual-runtime/render.test.ts](../../../tests/visual-runtime/render.test.ts.md) | ../../src/visual-runtime/render/inspect.ts |
| [packages/tierflow/tests/visual-runtime/wave3-d-render.test.ts](../../../tests/visual-runtime/wave3-d-render.test.ts.md) | ../../src/visual-runtime/render/inspect.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
import type { RenderPlan, RenderTraceEntry, SemanticDomNode } from "./dom.ts";

/** A bounded, deterministic structural trace; never introspects private input or invokes handlers. */
export interface Inspection {
  readonly schema: "vivim.ui-render-inspection/1";
  readonly status: RenderPlan["status"];
  readonly viewportPx: number;
  readonly nodeCount: number;
  readonly focusOrder: readonly string[];
  readonly nodes: readonly Readonly<{ id: string; tag: string; role: string; name: string | null; depth: number }>[];
  readonly trace: readonly RenderTraceEntry[];
  readonly issueCodes: readonly string[];
}

export function inspectRenderPlan(plan: RenderPlan): Inspection {
  const nodes: { id: string; tag: string; role: string; name: string | null; depth: number }[] = [];
  function visit(node: SemanticDomNode, depth: number): void {
    nodes.push({
      id: node.id, tag: node.tag, role: node.attributes.role ?? "",
      name: node.attributes["aria-label"] ?? null, depth,
    });
    for (const child of node.children) visit(child, depth + 1);
  }
  visit(plan.root, 0);
  return {
    schema: "vivim.ui-render-inspection/1", status: plan.status,
    viewportPx: plan.viewportPx, nodeCount: nodes.length, focusOrder: [...plan.focusOrder],
    nodes, trace: [...plan.trace], issueCodes: plan.issues.map((item) => item.code),
  };
}

/** Snapshot uses only stable semantic attributes, not pixels or machine-specific HTML. */
export function snapshotRenderPlan(plan: RenderPlan): string {
  const inspection = inspectRenderPlan(plan);
  return JSON.stringify({
    width: inspection.viewportPx, status: inspection.status,
    nodes: inspection.nodes.map((node) => [node.id, node.tag, node.role, node.name, node.depth]),
    focus: inspection.focusOrder, issues: inspection.issueCodes,
  });
}
```

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)

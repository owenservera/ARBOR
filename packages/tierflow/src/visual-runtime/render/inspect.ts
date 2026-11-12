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

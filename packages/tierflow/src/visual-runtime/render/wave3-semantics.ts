/**
 * Wave 3 Lane D: canonical A document -> existing inert D renderer.
 *
 * This is a display-only compatibility boundary, not a component registry,
 * KB authorization decision, Host action dispatcher or DOM implementation.
 * Exact versioned references are retained out-of-band; the old renderer sees
 * only locally generated, inert aliases. Nothing here grants an effect.
 */
import { validateUiDocument, type UiDocumentValidation } from "../document/validate.ts";
import { UI_DOCUMENT_SCHEMA, type UiActionReference, type UiDocument } from "../document/schema.ts";
import { renderUiDocument, type RenderOptions, type RenderPlan } from "./dom.ts";
import { inspectRenderPlan, type Inspection } from "./inspect.ts";

export const WAVE3_RENDER_SCHEMA = "vivim.wave3-render-semantics/1" as const;

export interface VersionedInertAction {
  readonly nodeId: string;
  readonly id: string;
  readonly version: number;
  /** An opaque reference, never a click handler or execution capability. */
  readonly displayAlias: string;
  readonly inert: true;
}
export interface InertBindingProvenance {
  readonly nodeId: string;
  readonly bindingId: string;
  readonly bindingVersion: number;
  readonly provenanceRef: string;
  readonly availability: string;
  readonly readScope: "owner";
  /** Describes a declaration; never establishes actual KB access. */
  readonly authorized: false;
}
export type Wave3RenderResult = Readonly<{
  schema: typeof WAVE3_RENDER_SCHEMA;
  readonly status: RenderPlan["status"];
  readonly plan: RenderPlan;
  readonly inspection: Inspection;
  readonly sourceSchema: typeof UI_DOCUMENT_SCHEMA | null;
  readonly actions: readonly VersionedInertAction[];
  readonly provenance: readonly InertBindingProvenance[];
  readonly refusalCode: string | null;
}>;

export interface Wave3RenderOptions extends RenderOptions {
  /** Trusted fixture catalog for A-validation only: NOT permission or Host authority. */
  readonly knownActions: readonly UiActionReference[];
}

function plain(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
function own(value: Record<string, unknown>, field: string): unknown {
  return Object.getOwnPropertyDescriptor(value, field)?.value;
}
const IDENTIFIER = /^(?!__proto__$|prototype$|constructor$)[A-Za-z][A-Za-z0-9._:-]{0,95}$/;
function safeCatalog(input: unknown): input is readonly UiActionReference[] {
  if (!Array.isArray(input) || input.length > 64 || Object.keys(input).length !== input.length) return false;
  const seen = new Set<string>();
  for (const value of input) {
    if (!plain(value) || Reflect.ownKeys(value).length !== 2 ||
        !Object.hasOwn(value, "id") || !Object.hasOwn(value, "version")) return false;
    const id = own(value, "id");
    const version = own(value, "version");
    if (typeof id !== "string" || !IDENTIFIER.test(id) ||
        typeof version !== "number" || !Number.isSafeInteger(version) || version < 1 || version > 1e9) return false;
    const key = `${id}@${version}`;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}
function refuse(code: string, viewportPx: number): Wave3RenderResult {
  // Reuse Lane D's existing accessible, effect-free refusal projection.
  const plan = renderUiDocument(null, { viewportPx });
  const safePlan: RenderPlan = {
    ...plan,
    issues: Object.freeze([{ code }]),
    trace: Object.freeze(plan.trace.map(entry => Object.freeze({ ...entry, code }))),
  };
  return Object.freeze({
    schema: WAVE3_RENDER_SCHEMA, status: "unavailable" as const, plan: safePlan,
    inspection: inspectRenderPlan(safePlan), sourceSchema: null,
    actions: Object.freeze([]), provenance: Object.freeze([]), refusalCode: code,
  });
}

function focusMatchesDomOrder(document: UiDocument): boolean {
  const byId = new Map(document.nodes.map(node => [node.id, node] as const));
  const focus: number[] = [];
  function visit(id: string): void {
    const node = byId.get(id)!;
    if (node.type === "button") focus.push(node.a11y.focusOrder!);
    for (const child of node.children) visit(child);
  }
  visit(document.rootId);
  // The inert renderer follows source order and cannot use positive tab indices.
  return focus.every((order, index) => index === 0 || order > focus[index - 1]!);
}

/**
 * Validates against the real Lane A validator, then adapts the *reference shape*
 * for the existing Lane D renderer. Versioned references are never discarded:
 * they are retained in a separate bounded and inspectable inert table.
 *
 * Binding declarations are not proof of owner authorization. When any binding
 * is non-present, refuse the entire page rather than risk rendering stale or
 * revoked text from an otherwise valid document. A trusted F broker must first
 * supply a new owner-scoped, present-only snapshot.
 */
export function renderWave3Semantics(input: unknown, options: Wave3RenderOptions): Wave3RenderResult {
  if (!plain(options) || !safeCatalog(own(options, "knownActions"))) {
    return refuse("INVALID_ACTION_CATALOG", 0);
  }
  const viewportPx = own(options, "viewportPx");
  if (typeof viewportPx !== "number" || !Number.isInteger(viewportPx) ||
      viewportPx < 240 || viewportPx > 3840) return refuse("INVALID_VIEWPORT", 0);
  const validated: UiDocumentValidation = validateUiDocument(input, { knownActions: options.knownActions });
  if (!validated.ok) return refuse(validated.unavailable.reason, viewportPx);
  const document = validated.document;
  if (!focusMatchesDomOrder(document)) return refuse("FOCUS_ORDER_CONFLICT", viewportPx);
  if (document.bindings.some(binding => binding.availability !== "present")) {
    return refuse("BOUND_DATA_UNAVAILABLE", viewportPx);
  }

  const actions: VersionedInertAction[] = [];
  const nodes = document.nodes.map((node, nodeIndex) => {
    const actionRefs = (node.actionRefs ?? []).map((ref, refIndex) => {
      // The alias intentionally contains no original action id/version and
      // cannot be resolved into a grant without the separate typed table.
      const displayAlias = `render_action_${nodeIndex}_${refIndex}`;
      actions.push(Object.freeze({ nodeId: node.id, id: ref.id, version: ref.version,
        displayAlias, inert: true as const }));
      return displayAlias;
    });
    return { ...node, actionRefs };
  });
  const rendererInput = { ...document, nodes };
  const plan = renderUiDocument(rendererInput, { viewportPx });
  if (plan.status === "unavailable") {
    // Fail closed and do not expose the action/provenance table if D rejects.
    return refuse(plan.issues[0]?.code ?? "RENDER_UNAVAILABLE", viewportPx);
  }
  const provenance: InertBindingProvenance[] = document.bindings.map(binding => Object.freeze({
    nodeId: binding.nodeId, bindingId: binding.id, bindingVersion: binding.version,
    provenanceRef: binding.provenanceRef, availability: binding.availability,
    readScope: binding.readScope, authorized: false as const,
  }));
  return Object.freeze({
    schema: WAVE3_RENDER_SCHEMA, status: plan.status, plan,
    inspection: inspectRenderPlan(plan), sourceSchema: UI_DOCUMENT_SCHEMA,
    actions: Object.freeze(actions), provenance: Object.freeze(provenance), refusalCode: null,
  });
}

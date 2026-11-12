/**
 * UiRenderPort/1: inert DOM *description*, never HTML, a live DOM node or effects.
 * All inputs are untrusted parsed data; canonical validation belongs to Lane A.
 * This additional render boundary refuses malformed/unsafe content defensively.
 */
import { projectSpatialFallback, type SpatialFallback } from "./spatial-fallback.ts";

export const RENDER_PLAN_SCHEMA = "vivim.ui-render-plan/1" as const;
export type RenderStatus = "ok" | "partial" | "unavailable";
export type RenderIssue = Readonly<{ code: string; nodeId?: string }>;
export type LayoutHint = Readonly<{ display: "block" | "flex" | "grid"; columns: number; minTargetPx: number }>;
export interface SemanticDomNode {
  readonly id: string;
  readonly tag: "main" | "section" | "div" | "p" | "h2" | "ul" | "li" | "span";
  readonly attributes: Readonly<Record<string, string>>;
  readonly text?: string;
  readonly layout: LayoutHint;
  readonly children: readonly SemanticDomNode[];
}
export interface RenderTraceEntry {
  readonly id: string;
  readonly sourceId: string | null;
  readonly outcome: "rendered" | "placeholder" | "spatial-fallback";
  readonly code: string;
  readonly tag: string;
  readonly focusable: boolean;
}
export interface RenderPlan {
  readonly schema: typeof RENDER_PLAN_SCHEMA;
  readonly documentId: string | null;
  readonly revision: string | number | null;
  readonly viewportPx: number;
  readonly status: RenderStatus;
  readonly root: SemanticDomNode;
  readonly issues: readonly RenderIssue[];
  readonly focusOrder: readonly string[];
  readonly trace: readonly RenderTraceEntry[];
  readonly spatial: SpatialFallback;
}
export interface RenderOptions { readonly viewportPx: number }

type Data = Record<string, unknown>;
const ID = /^[a-zA-Z][a-zA-Z0-9._:-]{0,95}$/;
const BANNED_KEYS = /^(?:__proto__|prototype|constructor|innerHTML|outerHTML|srcdoc|dangerouslySetInnerHTML|style|href|src|formaction|action|on[a-z]+)$/i;
const URL_LIKE = /(?:javascript\s*:|data\s*:|vbscript\s*:|file\s*:|https?\s*:\/\/|www\.)/i;
const HTML_LIKE = /<\s*\/?\s*[a-z][^>]*>/i;
const TYPES = new Set(["stack", "grid", "text", "card", "button", "collection", "profile-card", "project-card", "timeline", "chart"]);
const LABEL_MAX = 240;

function plain(value: unknown): value is Data {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
function own(obj: Data, key: string): unknown { return Object.getOwnPropertyDescriptor(obj, key)?.value; }
function validId(value: unknown): value is string { return typeof value === "string" && ID.test(value) && !/^(?:__proto__|prototype|constructor)$/.test(value); }
function safeText(value: unknown): string | null {
  if (typeof value !== "string" || value.length > LABEL_MAX || /[\u0000-\u001f\u007f]/.test(value)) return null;
  if (URL_LIKE.test(value) || HTML_LIKE.test(value)) return null;
  return value;
}
function safeData(value: unknown, visited = new Set<object>(), depth = 0): boolean {
  if (depth > 12) return false;
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.length <= 4096;
  if (typeof value !== "object" || visited.has(value)) return false;
  if (Array.isArray(value) && value.length > 128) return false;
  if (!Array.isArray(value) && !plain(value)) return false;
  visited.add(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Object.keys(descriptors);
  if (keys.length > 128) return false;
  for (const key of keys) {
    const desc = descriptors[key];
    if (BANNED_KEYS.test(key) || !desc || !("value" in desc) ||
        !safeData(desc.value, visited, depth + 1)) return false;
  }
  visited.delete(value);
  return true;
}
function dict(value: unknown): Data { return plain(value) ? value : {}; }
function recordArray(value: unknown): Data[] | null {
  return Array.isArray(value) && Object.keys(value).length === value.length && value.every(plain) ? value as Data[] : null;
}
function attributes(role: string, name: string | null, description?: string | null): Record<string, string> {
  const result: Record<string, string> = { role };
  if (name) result["aria-label"] = name;
  if (description) result["aria-description"] = description;
  return result;
}
function layout(display: LayoutHint["display"] = "block", columns = 1, minTargetPx = 0): LayoutHint {
  return { display, columns, minTargetPx };
}
function leaf(id: string, text: string, role = "status", tag: SemanticDomNode["tag"] = "p"): SemanticDomNode {
  return { id, tag, text, attributes: attributes(role, text), layout: layout(), children: [] };
}
function unavailable(code: string, viewportPx: number, documentId: string | null = null): RenderPlan {
  const root = leaf("render_unavailable", "This view is unavailable. Nothing can be changed here.");
  return {
    schema: RENDER_PLAN_SCHEMA, documentId, revision: null, viewportPx, status: "unavailable",
    root, issues: [{ code }], focusOrder: [],
    trace: [{ id: root.id, sourceId: null, outcome: "placeholder", code, tag: root.tag, focusable: false }],
    spatial: projectSpatialFallback([]),
  };
}
function isReferenceList(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.length <= 24 && value.every(validId));
}
function acceptableProps(type: string, props: Data): boolean {
  const allowed: Record<string, string[]> = {
    stack: ["direction", "gap"], grid: ["columns", "gap"],
    text: ["value", "variant"], button: ["label", "intent", "targetId"],
    card: ["title", "description", "sourceRef", "basis", "freshness"],
    "profile-card": ["title", "description", "sourceRef", "basis", "freshness"],
    "project-card": ["title", "description", "sourceRef", "basis", "freshness"],
    collection: ["title", "items", "sourceRef"], timeline: ["title", "items", "sourceRef"],
    chart: ["title", "items", "sourceRef"],
  };
  return Object.keys(props).every((key) => (allowed[type] ?? []).includes(key));
}
function safeContent(type: string, props: Data): string | null {
  const candidate = type === "text" ? own(props, "value") : type === "button" ? own(props, "label") : own(props, "title");
  return safeText(candidate);
}
function responsiveColumns(type: string, props: Data, viewportPx: number): number {
  if (type !== "grid") return 1;
  const n = own(props, "columns");
  const requested = Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 4 ? n as number : 1;
  return Math.min(requested, viewportPx < 600 ? 1 : viewportPx < 1000 ? 2 : 4);
}

/** All output is inert data: NO DOM APIs, HTML strings, event handlers or navigation. */
export function renderUiDocument(input: unknown, options: RenderOptions): RenderPlan {
  const viewportPx = options?.viewportPx;
  if (!Number.isInteger(viewportPx) || viewportPx < 240 || viewportPx > 3840) {
    return unavailable("INVALID_VIEWPORT", Number.isFinite(viewportPx) ? viewportPx : 0);
  }
  if (!safeData(input)) return unavailable("UNSAFE_DOCUMENT", viewportPx);
  const d = dict(input);
  if (own(d, "schema") !== "vivim.ui-document/1") return unavailable("UNSUPPORTED_SCHEMA", viewportPx);
  const documentId = own(d, "documentId");
  const rootId = own(d, "rootId");
  const scope = dict(own(d, "scope"));
  const nodes = recordArray(own(d, "nodes"));
  const revision = own(d, "revision");
  if (!validId(documentId) || !validId(rootId) ||
      !validId(own(scope, "ownerRef")) || !validId(own(scope, "workspaceRef")) ||
      !nodes || nodes.length < 1 || nodes.length > 64 ||
      !(typeof revision === "string" && revision.length > 0 && revision.length <= 96 ||
        Number.isSafeInteger(revision) && (revision as number) >= 0)) {
    return unavailable("INVALID_DOCUMENT", viewportPx);
  }
  // JSON size checked only AFTER rejecting accessors, functions and cycles.
  if (new TextEncoder().encode(JSON.stringify(input)).length > 32768) {
    return unavailable("DOCUMENT_TOO_LARGE", viewportPx);
  }
  const byId = new Map<string, Data>();
  for (const node of nodes) {
    const id = own(node, "id");
    if (!validId(id) || byId.has(id)) return unavailable("INVALID_OR_DUPLICATE_ID", viewportPx, documentId);
    const children = own(node, "children") ?? [];
    if (!isReferenceList(children)) return unavailable("INVALID_CHILDREN", viewportPx, documentId);
    if (!isReferenceList(own(node, "bindingRefs")) || !isReferenceList(own(node, "actionRefs"))) {
      return unavailable("INVALID_REFERENCE", viewportPx, documentId);
    }
    byId.set(id, node);
  }
  const seen = new Set<string>();
  const stack = new Set<string>();
  let invalidGraph = false;
  function check(id: string, depth: number): void {
    if (depth > 7 || stack.has(id) || seen.has(id) || !byId.has(id)) { invalidGraph = true; return; }
    seen.add(id);
    stack.add(id);
    const children = own(byId.get(id)!, "children") as string[] | undefined;
    for (const child of children ?? []) check(child, depth + 1);
    stack.delete(id);
  }
  check(rootId, 0);
  if (invalidGraph || seen.size !== nodes.length) return unavailable("INVALID_NODE_GRAPH", viewportPx, documentId);

  const issues: RenderIssue[] = [];
  const trace: RenderTraceEntry[] = [];
  const focusOrder: string[] = [];
  function project(id: string): SemanticDomNode {
    const n = byId.get(id)!;
    const type = own(n, "type");
    const props = dict(own(n, "props"));
    const a11y = dict(own(n, "a11y"));
    const roleCandidate = safeText(own(a11y, "role"));
    const nameCandidate = safeText(own(a11y, "name") ?? own(a11y, "label"));
    const description = safeText(own(a11y, "description"));
    const content = typeof type === "string" ? safeContent(type, props) : null;
    const isButton = type === "button";
    const isKnown = typeof type === "string" && TYPES.has(type);
    const requiresName = isButton || type === "card" || type === "profile-card" || type === "project-card";
    const label = nameCandidate ?? content;
    if (!isKnown || !acceptableProps(type, props) ||
        (requiresName && (!label || label.trim().length === 0)) ||
        (type === "text" && content === null) ||
        (Object.keys(props).some((key) => safeText(own(props, key)) === null && typeof own(props, key) === "string"))) {
      const code = !isKnown ? "UNKNOWN_COMPONENT" : "UNSAFE_OR_UNLABELLED_COMPONENT";
      issues.push({ code, nodeId: id });
      trace.push({ id, sourceId: id, outcome: "placeholder", code, tag: "p", focusable: false });
      return leaf(id, "Component unavailable (read only).", "status");
    }
    const tag: SemanticDomNode["tag"] = type === "text" ? "p" : type === "collection" || type === "timeline" ? "ul" : type === "stack" || type === "grid" ? "div" : "section";
    const role = isButton ? "button" : (type === "text" ? "paragraph" : type === "grid" ? "group" : roleCandidate === "note" ? "note" : "region");
    const attrs = attributes(role, label, description);
    if (isButton) {
      // No action handler exists; keep the refusal navigable and announced.
      attrs["aria-disabled"] = "true";
      attrs["tabindex"] = "0";
      attrs["aria-description"] = "Read-only preview. No action can be performed here.";
      focusOrder.push(id);
    }
    const children = (own(n, "children") as string[] | undefined ?? []).map(project);
    let text = content ?? undefined;
    if (type === "collection" || type === "timeline" || type === "chart") {
      const items = own(props, "items");
      if (Array.isArray(items)) {
        for (let i = 0; i < Math.min(items.length, 16); i++) {
          const item = dict(items[i]);
          const itemLabel = safeText(own(item, "label"));
          if (itemLabel === null) { issues.push({ code: "UNSAFE_ITEM", nodeId: id }); continue; }
          children.push({ id: `${id}.item${i}`, tag: "li", text: itemLabel, attributes: attributes("listitem", itemLabel), layout: layout(), children: [] });
        }
      }
    }
    trace.push({ id, sourceId: id, outcome: "rendered", code: isButton ? "INERT_ACTION" : "OK", tag, focusable: isButton });
    return {
      id, tag, attributes: attrs, ...(text === undefined ? {} : { text }),
      layout: layout(type === "grid" ? "grid" : type === "stack" ? "flex" : "block",
        responsiveColumns(type, props, viewportPx), isButton ? 44 : 0), children,
    };
  }
  const main = project(rootId);
  const spatial = projectSpatialFallback(own(d, "views"));
  const children: SemanticDomNode[] = [main];
  if (spatial.present) {
    const spatialNode = leaf("spatial_fallback", spatial.description, "note");
    children.push(spatialNode);
    issues.push({ code: "SPATIAL_UNSUPPORTED" });
    trace.push({ id: spatialNode.id, sourceId: null, outcome: "spatial-fallback", code: "SPATIAL_UNSUPPORTED", tag: spatialNode.tag, focusable: false });
  }
  const root: SemanticDomNode = {
    id: "render_root", tag: "main", attributes: attributes("main", "Visual document (read-only preview)"),
    layout: layout(), children,
  };
  return {
    schema: RENDER_PLAN_SCHEMA, documentId, revision: revision as string | number,
    viewportPx, status: issues.length ? "partial" : "ok", root, issues, focusOrder, trace, spatial,
  };
}

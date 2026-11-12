/** Declarative accessibility checks only; real TalkBack/AT verification is separate. */
export type ComponentType = "stack" | "grid" | "card" | "text" | "heading" | "button" | "status" | "field" | "divider";
export interface AccessibilityMetadata {
  readonly role?: string;
  readonly name?: string;
  readonly description?: string;
  readonly tabIndex?: 0 | -1;
  readonly live?: "off" | "polite" | "assertive";
  readonly touchTargetPx?: number;
}
export interface AccessibleComponent {
  readonly role: string;
  readonly name?: string;
  readonly description?: string;
  readonly tabIndex: -1 | 0;
  readonly live: "off" | "polite" | "assertive";
  readonly touchTargetPx: number;
  readonly focusable: boolean;
}
export type A11yResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly code: "INVALID_A11Y" | "INVALID_FOCUS_TREE"; readonly reason: string };

const ROLES: Record<ComponentType, readonly string[]> = {
  stack: ["group", "region"], grid: ["group", "region"], card: ["article", "group"],
  text: ["paragraph"], heading: ["heading"], button: ["button"], status: ["status", "alert"],
  field: ["textbox"], divider: ["separator"],
};
const DEFAULT_ROLE: Record<ComponentType, string> = {
  stack: "group", grid: "group", card: "article", text: "paragraph", heading: "heading",
  button: "button", status: "status", field: "textbox", divider: "separator",
};
const KEYS = new Set(["role", "name", "description", "tabIndex", "live", "touchTargetPx"]);
function plain(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
function fail(reason: string): A11yResult<never> { return { ok: false, code: "INVALID_A11Y", reason }; }
function safeLabel(value: unknown, limit: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= limit &&
    !/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
}

export function validateAccessibility(
  type: ComponentType,
  input: unknown,
  visibleLabel: string | undefined,
  disabled = false,
): A11yResult<AccessibleComponent> {
  if (input !== undefined && !plain(input)) return fail("a11y must be a plain object");
  const metadata = (input ?? {}) as Record<string, unknown>;
  for (const key of Object.keys(metadata)) if (!KEYS.has(key)) return fail(`unknown a11y field: ${key}`);
  const role = metadata.role ?? DEFAULT_ROLE[type];
  if (typeof role !== "string" || !ROLES[type].includes(role)) return fail("role is incompatible with component type");
  if (metadata.name !== undefined && !safeLabel(metadata.name, 160)) return fail("invalid accessible name");
  if (metadata.description !== undefined && !safeLabel(metadata.description, 512)) return fail("invalid accessible description");
  const name = (metadata.name as string | undefined) ?? visibleLabel;
  const interactive = type === "button" || type === "field";
  if ((interactive || role === "region") && !safeLabel(name, 160)) return fail("a meaningful accessible name is required");
  const tabIndex = metadata.tabIndex ?? (interactive && !disabled ? 0 : -1);
  if (tabIndex !== 0 && tabIndex !== -1) return fail("positive or arbitrary tab order is forbidden");
  if ((!interactive || disabled) && tabIndex === 0) return fail("noninteractive/disabled nodes cannot enter the tab sequence");
  if (interactive && !disabled && tabIndex !== 0) return fail("enabled controls must remain keyboard reachable");
  const touchTarget = metadata.touchTargetPx ?? (interactive ? 44 : 0);
  if (typeof touchTarget !== "number" || !Number.isInteger(touchTarget) || touchTarget < (interactive ? 44 : 0) || touchTarget > 256) {
    return fail("interactive touch targets must be at least 44 CSS px");
  }
  const live = metadata.live ?? (type === "status" ? (role === "alert" ? "assertive" : "polite") : "off");
  if (live !== "off" && live !== "polite" && live !== "assertive") return fail("invalid live region");
  if (type !== "status" && live !== "off") return fail("only status nodes may set live announcements");
  if (type === "status" && live === "off") return fail("status changes must be announced");
  return { ok: true, value: {
    role, ...(name === undefined ? {} : { name }),
    ...(metadata.description === undefined ? {} : { description: metadata.description as string }),
    tabIndex: tabIndex as -1 | 0, live, touchTargetPx: touchTarget, focusable: tabIndex === 0,
  } };
}

export interface FocusNode {
  readonly id: string;
  readonly type: ComponentType;
  readonly children?: readonly string[];
  readonly a11y?: AccessibilityMetadata;
  readonly props?: Readonly<Record<string, unknown>>;
}
/** DOM reading/tab order follows children, never geometry or numeric tab priority. */
export function auditFocusOrder(nodes: readonly FocusNode[], rootId: string): A11yResult<readonly string[]> {
  if (nodes.length > 64) return { ok: false, code: "INVALID_FOCUS_TREE", reason: "too many nodes" };
  const byId = new Map<string, FocusNode>();
  for (const node of nodes) {
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(node.id) || byId.has(node.id)) {
      return { ok: false, code: "INVALID_FOCUS_TREE", reason: "duplicate or invalid ID" };
    }
    byId.set(node.id, node);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const focus: string[] = [];
  function visit(id: string): string | null {
    const node = byId.get(id);
    if (!node) return "dangling child/root";
    if (visiting.has(id)) return "cycle in focus tree";
    if (visited.has(id)) return "shared child / duplicate traversal";
    visiting.add(id);
    const visible = typeof node.props?.["label"] === "string" ? node.props["label"] as string : undefined;
    const disabled = node.props?.["disabled"] === true;
    const a11y = validateAccessibility(node.type, node.a11y, visible, disabled);
    if (!a11y.ok) return a11y.reason;
    if (a11y.value.focusable) focus.push(id);
    for (const child of node.children ?? []) {
      const error = visit(child);
      if (error !== null) return error;
    }
    visiting.delete(id);
    visited.add(id);
    return null;
  }
  const error = visit(rootId);
  if (error !== null) return { ok: false, code: "INVALID_FOCUS_TREE", reason: error };
  if (visited.size !== nodes.length) return { ok: false, code: "INVALID_FOCUS_TREE", reason: "orphan nodes are not reachable from root" };
  return { ok: true, value: focus };
}

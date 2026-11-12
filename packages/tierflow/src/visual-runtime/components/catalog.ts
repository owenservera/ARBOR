/** Closed, inert component vocabulary for vivim.ui-document/1 fixture nodes.
 * The document schema/authority belongs to Lane A. This validates ONLY a node's
 * local component contract; it cannot authorize actions, bindings, or KB reads.
 */
import { validateAccessibility, type AccessibleComponent, type ComponentType } from "./accessibility.ts";
import { validateLayoutConstraints, type LayoutConstraints } from "./layout.ts";

export const COMPONENT_TYPES = ["stack", "grid", "card", "text", "heading", "button", "status", "field", "divider"] as const;
export type ComponentKind = (typeof COMPONENT_TYPES)[number];
export type ComponentProps = Readonly<Record<string, string | number | boolean>>;
export interface InspectedComponent {
  readonly id: string;
  readonly type: ComponentKind;
  readonly props: ComponentProps;
  readonly children: readonly string[];
  readonly layout: LayoutConstraints;
  readonly a11y: AccessibleComponent;
  readonly bindingRefs: readonly string[];
  /** Inert references only. No click dispatcher, grant, URL, or effect is present. */
  readonly actionRefs: readonly string[];
}
export type ComponentResult =
  | { readonly ok: true; readonly value: InspectedComponent }
  | { readonly ok: false; readonly code: "INVALID_COMPONENT" | "UNREGISTERED_COMPONENT" | "UNSAFE_PROP" | "INVALID_LAYOUT" | "INVALID_A11Y"; readonly reason: string };

const NODE_KEYS = new Set(["id", "type", "props", "children", "layout", "a11y", "bindingRefs", "actionRefs"]);
const REF = /^[A-Za-z0-9_-]{1,64}$/;
const PROP_KEYS: Record<ComponentKind, readonly string[]> = {
  stack: [], grid: [], card: ["title"], text: ["text"], heading: ["text", "level"],
  button: ["label", "disabled"], status: ["message", "state"], field: ["label", "value", "readOnly"], divider: [],
};
const CHILDREN = new Set<ComponentKind>(["stack", "grid", "card"]);
const HTML = /<\s*\/?\s*[a-z][^>]*>/i;
const DANGEROUS_TEXT = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/;
function plain(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
function fail(code: Extract<ComponentResult, { ok: false }>["code"], reason: string): Extract<ComponentResult, { ok: false }> {
  return { ok: false, code, reason };
}
/** Guard accessors, toJSON hooks, sparse arrays and cycles before inspecting untrusted fixture values. */
function dataOnly(value: unknown, seen = new Set<object>(), depth = 0): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || depth > 8 || seen.has(value)) return false;
  if (!Array.isArray(value) && !plain(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) for (let i = 0; i < value.length; i++) if (!Object.hasOwn(value, i)) return false;
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === "symbol") return false;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor) || !dataOnly(descriptor.value, seen, depth + 1)) return false;
  }
  seen.delete(value);
  return true;
}
function safeText(value: unknown, min: number, max: number): value is string {
  return typeof value === "string" && value.length >= min && value.length <= max &&
    (min === 0 || value.trim().length > 0) && !HTML.test(value) && !DANGEROUS_TEXT.test(value);
}
function validateProps(type: ComponentKind, input: unknown): { ok: true; value: ComponentProps } | Extract<ComponentResult, { ok: false }> {
  if (input === undefined) input = {};
  if (!plain(input)) return fail("INVALID_COMPONENT", "props must be a plain object");
  const result: Record<string, string | number | boolean> = Object.create(null) as Record<string, string | number | boolean>;
  for (const [key, value] of Object.entries(input)) {
    if (!PROP_KEYS[type].includes(key)) return fail("UNSAFE_PROP", `unregistered/unsafe prop: ${key}`);
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
      return fail("UNSAFE_PROP", `prop ${key} must be a safe scalar`);
    }
    result[key] = value;
  }
  switch (type) {
    case "text": if (!safeText(input.text, 1, 2048)) return fail("UNSAFE_PROP", "invalid text content"); break;
    case "heading":
      if (!safeText(input.text, 1, 160)) return fail("UNSAFE_PROP", "invalid heading content");
      if (input.level !== undefined && (![1, 2, 3, 4, 5, 6].includes(input.level as number))) return fail("UNSAFE_PROP", "invalid heading level");
      break;
    case "button":
      if (!safeText(input.label, 1, 120) || (input.disabled !== undefined && typeof input.disabled !== "boolean")) {
        return fail("UNSAFE_PROP", "button requires safe label and boolean disabled");
      }
      break;
    case "status":
      if (!safeText(input.message, 1, 512) || !["pending", "ok", "warning", "error", "uncertain", "denied"].includes(input.state as string)) {
        return fail("UNSAFE_PROP", "status requires message and explicit state");
      }
      break;
    case "field":
      if (!safeText(input.label, 1, 120) || (input.value !== undefined && !safeText(input.value, 0, 512)) || input.readOnly !== true) {
        return fail("UNSAFE_PROP", "field must be labelled and readOnly in fixture");
      }
      break;
    case "card": if (input.title !== undefined && !safeText(input.title, 1, 160)) return fail("UNSAFE_PROP", "invalid card title"); break;
    default: break;
  }
  return { ok: true, value: result };
}
function refs(input: unknown, limit: number): readonly string[] | null {
  if (input === undefined) return [];
  if (!Array.isArray(input) || input.length > limit || input.some((v: unknown) => typeof v !== "string" || !REF.test(v))) return null;
  if (new Set(input).size !== input.length) return null;
  return [...input] as string[];
}

export function inspectComponent(input: unknown): ComponentResult {
  if (!plain(input) || !dataOnly(input)) return fail("INVALID_COMPONENT", "node must contain plain, inert data without cycles/accessors");
  try {
    const serialized = JSON.stringify(input);
    if (serialized === undefined || new TextEncoder().encode(serialized).byteLength > 4096) {
      return fail("INVALID_COMPONENT", "component exceeds 4096 UTF-8 bytes");
    }
  } catch {
    return fail("INVALID_COMPONENT", "cyclic/nonserializable component");
  }
  for (const key of Object.keys(input)) if (!NODE_KEYS.has(key)) return fail("UNSAFE_PROP", `unknown node key: ${key}`);
  if (typeof input.id !== "string" || !REF.test(input.id)) return fail("INVALID_COMPONENT", "invalid opaque node ID");
  if (typeof input.type !== "string" || !COMPONENT_TYPES.includes(input.type as ComponentKind)) {
    return fail("UNREGISTERED_COMPONENT", "component type is not in closed catalog");
  }
  const type = input.type as ComponentKind;
  const props = validateProps(type, input.props);
  if (!props.ok) return props;
  const checkedProps = props.value;
  const children = refs(input.children, 32);
  if (children === null || (!CHILDREN.has(type) && children.length !== 0)) {
    return fail("INVALID_COMPONENT", "invalid children for component type");
  }
  const bindingRefs = refs(input.bindingRefs, 4);
  const actionRefs = refs(input.actionRefs, 1);
  if (bindingRefs === null || actionRefs === null) return fail("INVALID_COMPONENT", "invalid binding/action references");
  if (type !== "button" && actionRefs.length > 0) return fail("UNSAFE_PROP", "only buttons may carry inert action references");
  if (type === "button" && checkedProps.disabled !== true && actionRefs.length !== 1) {
    return fail("INVALID_COMPONENT", "enabled button requires exactly one action reference");
  }
  const layout = validateLayoutConstraints(input.layout);
  if (!layout.ok) return fail("INVALID_LAYOUT", layout.reason);
  const visibleLabel = typeof checkedProps.label === "string" ? checkedProps.label : undefined;
  const a11y = validateAccessibility(type as ComponentType, input.a11y, visibleLabel, checkedProps.disabled === true);
  if (!a11y.ok) return fail("INVALID_A11Y", a11y.reason);
  return { ok: true, value: {
    id: input.id, type, props: checkedProps, children, layout: layout.value, a11y: a11y.value,
    bindingRefs, actionRefs,
  } };
}

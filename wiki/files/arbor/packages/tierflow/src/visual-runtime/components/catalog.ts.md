# File: packages/tierflow/src/visual-runtime/components/catalog.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/components/catalog.ts |
| Language | TypeScript |
| Kind | source |
| Size | 8603 B |
| Lines | 145 |
| Hash | 8a72d3c8baf2 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| COMPONENT_TYPES | const | 8 | yes | export const COMPONENT_TYPES = [&quot;stack&quot;, &quot;grid&quot;, &quot;card&quot;, &quot;text&quot;, &quot;heading&quot;, &quot;button&quot;, &quot;status&quot;, &quot;field&quot;, &quot;divider&quot;] as const; |
| ComponentKind | type | 9 | yes | export type ComponentKind = (typeof COMPONENT_TYPES)[number]; |
| ComponentProps | type | 10 | yes | export type ComponentProps = Readonly&lt;Record&lt;string, string \| number \| boolean&gt;&gt;; |
| InspectedComponent | interface | 11 | yes | export interface InspectedComponent { |
| ComponentResult | type | 22 | yes | export type ComponentResult = |
| NODE_KEYS | const | 26 | no | const NODE_KEYS = new Set([&quot;id&quot;, &quot;type&quot;, &quot;props&quot;, &quot;children&quot;, &quot;layout&quot;, &quot;a11y&quot;, &quot;bindingRefs&quot;, &quot;actionRefs&quot;]); |
| REF | const | 27 | no | const REF = /^[A-Za-z0-9_-]{1,64}$/; |
| PROP_KEYS | const | 28 | no | const PROP_KEYS: Record&lt;ComponentKind, readonly string[]&gt; = { |
| CHILDREN | const | 32 | no | const CHILDREN = new Set&lt;ComponentKind&gt;([&quot;stack&quot;, &quot;grid&quot;, &quot;card&quot;]); |
| HTML | const | 33 | no | const HTML = /&lt;\\s*\\/?\\s*[a-z][^&gt;]*&gt;/i; |
| DANGEROUS_TEXT | const | 34 | no | const DANGEROUS_TEXT = /[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f]/; |
| plain | function | 35 | no | function plain(value: unknown): value is Record&lt;string, unknown&gt; { |
| fail | function | 39 | no | function fail(code: Extract&lt;ComponentResult, { ok: false }&gt;[&quot;code&quot;], reason: string): Extract&lt;ComponentResult, { ok: false }&gt; { |
| dataOnly | function | 43 | no | function dataOnly(value: unknown, seen = new Set&lt;object&gt;(), depth = 0): boolean { |
| descriptor | const | 52 | no | const descriptor = Object.getOwnPropertyDescriptor(value, key); |
| safeText | function | 58 | no | function safeText(value: unknown, min: number, max: number): value is string { |
| validateProps | function | 62 | no | function validateProps(type: ComponentKind, input: unknown): { ok: true; value: ComponentProps } \| Extract&lt;ComponentResult, { ok: false }&gt; { |
| result | const | 65 | no | const result: Record&lt;string, string \| number \| boolean&gt; = Object.create(null) as Record&lt;string, string \| number \| boolean&gt;; |
| refs | function | 99 | no | function refs(input: unknown, limit: number): readonly string[] \| null { |
| inspectComponent | function | 106 | yes | export function inspectComponent(input: unknown): ComponentResult { |
| serialized | const | 109 | no | const serialized = JSON.stringify(input); |
| props | const | 122 | no | const props = validateProps(type, input.props); |
| checkedProps | const | 124 | no | const checkedProps = props.value; |
| children | const | 125 | no | const children = refs(input.children, 32); |
| bindingRefs | const | 129 | no | const bindingRefs = refs(input.bindingRefs, 4); |
| actionRefs | const | 130 | no | const actionRefs = refs(input.actionRefs, 1); |
| layout | const | 136 | no | const layout = validateLayoutConstraints(input.layout); |
| visibleLabel | const | 138 | no | const visibleLabel = typeof checkedProps.label === &quot;string&quot; ? checkedProps.label : undefined; |
| a11y | const | 139 | no | const a11y = validateAccessibility(type as ComponentType, input.a11y, visibleLabel, checkedProps.disabled === true); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./accessibility.ts | import | 5 | [packages/tierflow/src/visual-runtime/components/accessibility.ts](./accessibility.ts.md) |
| ./layout.ts | import | 6 | [packages/tierflow/src/visual-runtime/components/layout.ts](./layout.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts](./wave3-canonical-map.ts.md) | ./catalog.ts |
| [packages/tierflow/src/visual-runtime/integration-2/compose.ts](../integration-2/compose.ts.md) | ../components/catalog.ts |
| [packages/tierflow/tests/visual-runtime/components.test.ts](../../../tests/visual-runtime/components.test.ts.md) | ../../src/visual-runtime/components/catalog.ts |
| [packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts](../../../tests/visual-runtime/integration-2/real-a-h.test.ts.md) | ../../../src/visual-runtime/components/catalog.ts |
| [packages/tierflow/tests/visual-runtime/layout.test.ts](../../../tests/visual-runtime/layout.test.ts.md) | ../../src/visual-runtime/components/catalog.ts |
| [packages/tierflow/tests/visual-runtime/wave3-a-schema.test.ts](../../../tests/visual-runtime/wave3-a-schema.test.ts.md) | ../../src/visual-runtime/components/catalog.ts |
| [packages/tierflow/tests/visual-runtime/wave3-b-components.test.ts](../../../tests/visual-runtime/wave3-b-components.test.ts.md) | ../../src/visual-runtime/components/catalog.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 146 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)

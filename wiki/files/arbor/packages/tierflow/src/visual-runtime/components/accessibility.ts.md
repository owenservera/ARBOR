# File: packages/tierflow/src/visual-runtime/components/accessibility.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/components/accessibility.ts |
| Language | TypeScript |
| Kind | source |
| Size | 6684 B |
| Lines | 122 |
| Hash | 0c92b48d7b3e |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ComponentType | type | 2 | yes | export type ComponentType = &quot;stack&quot; \| &quot;grid&quot; \| &quot;card&quot; \| &quot;text&quot; \| &quot;heading&quot; \| &quot;button&quot; \| &quot;status&quot; \| &quot;field&quot; \| &quot;divider&quot;; |
| AccessibilityMetadata | interface | 3 | yes | export interface AccessibilityMetadata { |
| AccessibleComponent | interface | 11 | yes | export interface AccessibleComponent { |
| A11yResult | type | 20 | yes | export type A11yResult&lt;T&gt; = |
| ROLES | const | 24 | no | const ROLES: Record&lt;ComponentType, readonly string[]&gt; = { |
| DEFAULT_ROLE | const | 29 | no | const DEFAULT_ROLE: Record&lt;ComponentType, string&gt; = { |
| KEYS | const | 33 | no | const KEYS = new Set([&quot;role&quot;, &quot;name&quot;, &quot;description&quot;, &quot;tabIndex&quot;, &quot;live&quot;, &quot;touchTargetPx&quot;]); |
| plain | function | 34 | no | function plain(value: unknown): value is Record&lt;string, unknown&gt; { |
| fail | function | 38 | no | function fail(reason: string): A11yResult&lt;never&gt; { return { ok: false, code: &quot;INVALID_A11Y&quot;, reason }; } |
| safeLabel | function | 39 | no | function safeLabel(value: unknown, limit: number): value is string { |
| validateAccessibility | function | 44 | yes | export function validateAccessibility( type: ComponentType, input: unknown, visibleLabel: string \| undefined, disabled = false, |
| metadata | const | 51 | no | const metadata = (input ?? {}) as Record&lt;string, unknown&gt;; |
| role | const | 53 | no | const role = metadata.role ?? DEFAULT_ROLE[type]; |
| name | const | 57 | no | const name = (metadata.name as string \| undefined) ?? visibleLabel; |
| interactive | const | 58 | no | const interactive = type === &quot;button&quot; \|\| type === &quot;field&quot;; |
| tabIndex | const | 60 | no | const tabIndex = metadata.tabIndex ?? (interactive &amp;&amp; !disabled ? 0 : -1); |
| touchTarget | const | 64 | no | const touchTarget = metadata.touchTargetPx ?? (interactive ? 44 : 0); |
| live | const | 68 | no | const live = metadata.live ?? (type === &quot;status&quot; ? (role === &quot;alert&quot; ? &quot;assertive&quot; : &quot;polite&quot;) : &quot;off&quot;); |
| FocusNode | interface | 79 | yes | export interface FocusNode { |
| auditFocusOrder | function | 87 | yes | export function auditFocusOrder(nodes: readonly FocusNode[], rootId: string): A11yResult&lt;readonly string[]&gt; { |
| byId | const | 89 | no | const byId = new Map&lt;string, FocusNode&gt;(); |
| visiting | const | 96 | no | const visiting = new Set&lt;string&gt;(); |
| visited | const | 97 | no | const visited = new Set&lt;string&gt;(); |
| focus | const | 98 | no | const focus: string[] = []; |
| visit | function | 99 | no | function visit(id: string): string \| null { |
| node | const | 100 | no | const node = byId.get(id); |
| visible | const | 105 | no | const visible = typeof node.props?.[&quot;label&quot;] === &quot;string&quot; ? node.props[&quot;label&quot;] as string : undefined; |
| disabled | const | 106 | no | const disabled = node.props?.[&quot;disabled&quot;] === true; |
| a11y | const | 107 | no | const a11y = validateAccessibility(node.type, node.a11y, visible, disabled); |
| error | const | 111 | no | const error = visit(child); |
| error | const | 118 | no | const error = visit(rootId); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/components/catalog.ts](./catalog.ts.md) | ./accessibility.ts |
| [packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts](./wave3-canonical-map.ts.md) | ./accessibility.ts |
| [packages/tierflow/tests/visual-runtime/components.test.ts](../../../tests/visual-runtime/components.test.ts.md) | ../../src/visual-runtime/components/accessibility.ts |
| [packages/tierflow/tests/visual-runtime/layout.test.ts](../../../tests/visual-runtime/layout.test.ts.md) | ../../src/visual-runtime/components/accessibility.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 123 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)

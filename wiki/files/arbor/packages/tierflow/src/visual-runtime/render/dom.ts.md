# File: packages/tierflow/src/visual-runtime/render/dom.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/render/dom.ts |
| Language | TypeScript |
| Kind | source |
| Size | 13596 B |
| Lines | 255 |
| Hash | d9063103d190 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| RENDER_PLAN_SCHEMA | const | 8 | yes | export const RENDER_PLAN_SCHEMA = &quot;vivim.ui-render-plan/1&quot; as const; |
| RenderStatus | type | 9 | yes | export type RenderStatus = &quot;ok&quot; \| &quot;partial&quot; \| &quot;unavailable&quot;; |
| RenderIssue | type | 10 | yes | export type RenderIssue = Readonly&lt;{ code: string; nodeId?: string }&gt;; |
| LayoutHint | type | 11 | yes | export type LayoutHint = Readonly&lt;{ display: &quot;block&quot; \| &quot;flex&quot; \| &quot;grid&quot;; columns: number; minTargetPx: number }&gt;; |
| SemanticDomNode | interface | 12 | yes | export interface SemanticDomNode { |
| RenderTraceEntry | interface | 20 | yes | export interface RenderTraceEntry { |
| RenderPlan | interface | 28 | yes | export interface RenderPlan { |
| RenderOptions | interface | 40 | yes | export interface RenderOptions { readonly viewportPx: number } |
| Data | type | 42 | no | type Data = Record&lt;string, unknown&gt;; |
| ID | const | 43 | no | const ID = /^[a-zA-Z][a-zA-Z0-9._:-]{0,95}$/; |
| BANNED_KEYS | const | 44 | no | const BANNED_KEYS = /^(?:__proto__\|prototype\|constructor\|innerHTML\|outerHTML\|srcdoc\|dangerouslySetInnerHTML\|style\|href\|src\|formaction\|action\|on[a-z]+)$/i; |
| URL_LIKE | const | 45 | no | const URL_LIKE = /(?:javascript\\s*:\|data\\s*:\|vbscript\\s*:\|file\\s*:\|https?\\s*:\\/\\/\|www\\.)/i; |
| HTML_LIKE | const | 46 | no | const HTML_LIKE = /&lt;\\s*\\/?\\s*[a-z][^&gt;]*&gt;/i; |
| TYPES | const | 47 | no | const TYPES = new Set([&quot;stack&quot;, &quot;grid&quot;, &quot;text&quot;, &quot;card&quot;, &quot;button&quot;, &quot;collection&quot;, &quot;profile-card&quot;, &quot;project-card&quot;, &quot;timeline&quot;, &quot;chart&quot;]); |
| LABEL_MAX | const | 48 | no | const LABEL_MAX = 240; |
| plain | function | 50 | no | function plain(value: unknown): value is Data { |
| proto | const | 52 | no | const proto = Object.getPrototypeOf(value); |
| own | function | 55 | no | function own(obj: Data, key: string): unknown { return Object.getOwnPropertyDescriptor(obj, key)?.value; } |
| validId | function | 56 | no | function validId(value: unknown): value is string { return typeof value === &quot;string&quot; &amp;&amp; ID.test(value) &amp;&amp; !/^(?:__proto__\|prototype\|constructor)$/.test(value); } |
| safeText | function | 57 | no | function safeText(value: unknown): string \| null { |
| safeData | function | 62 | no | function safeData(value: unknown, visited = new Set&lt;object&gt;(), depth = 0): boolean { |
| descriptors | const | 71 | no | const descriptors = Object.getOwnPropertyDescriptors(value); |
| keys | const | 72 | no | const keys = Object.keys(descriptors); |
| desc | const | 75 | no | const desc = descriptors[key]; |
| dict | function | 82 | no | function dict(value: unknown): Data { return plain(value) ? value : {}; } |
| recordArray | function | 83 | no | function recordArray(value: unknown): Data[] \| null { |
| attributes | function | 86 | no | function attributes(role: string, name: string \| null, description?: string \| null): Record&lt;string, string&gt; { |
| result | const | 87 | no | const result: Record&lt;string, string&gt; = { role }; |
| layout | function | 92 | no | function layout(display: LayoutHint[&quot;display&quot;] = &quot;block&quot;, columns = 1, minTargetPx = 0): LayoutHint { |
| leaf | function | 95 | no | function leaf(id: string, text: string, role = &quot;status&quot;, tag: SemanticDomNode[&quot;tag&quot;] = &quot;p&quot;): SemanticDomNode { |
| unavailable | function | 98 | no | function unavailable(code: string, viewportPx: number, documentId: string \| null = null): RenderPlan { |
| root | const | 99 | no | const root = leaf(&quot;render_unavailable&quot;, &quot;This view is unavailable. Nothing can be changed here.&quot;); |
| isReferenceList | function | 107 | no | function isReferenceList(value: unknown): boolean { |
| acceptableProps | function | 110 | no | function acceptableProps(type: string, props: Data): boolean { |
| allowed | const | 111 | no | const allowed: Record&lt;string, string[]&gt; = { |
| safeContent | function | 122 | no | function safeContent(type: string, props: Data): string \| null { |
| candidate | const | 123 | no | const candidate = type === &quot;text&quot; ? own(props, &quot;value&quot;) : type === &quot;button&quot; ? own(props, &quot;label&quot;) : own(props, &quot;title&quot;); |
| responsiveColumns | function | 126 | no | function responsiveColumns(type: string, props: Data, viewportPx: number): number { |
| n | const | 128 | no | const n = own(props, &quot;columns&quot;); |
| requested | const | 129 | no | const requested = Number.isInteger(n) &amp;&amp; (n as number) &gt;= 1 &amp;&amp; (n as number) &lt;= 4 ? n as number : 1; |
| renderUiDocument | function | 134 | yes | export function renderUiDocument(input: unknown, options: RenderOptions): RenderPlan { |
| viewportPx | const | 135 | no | const viewportPx = options?.viewportPx; |
| d | const | 140 | no | const d = dict(input); |
| documentId | const | 142 | no | const documentId = own(d, &quot;documentId&quot;); |
| rootId | const | 143 | no | const rootId = own(d, &quot;rootId&quot;); |
| scope | const | 144 | no | const scope = dict(own(d, &quot;scope&quot;)); |
| nodes | const | 145 | no | const nodes = recordArray(own(d, &quot;nodes&quot;)); |
| revision | const | 146 | no | const revision = own(d, &quot;revision&quot;); |
| byId | const | 158 | no | const byId = new Map&lt;string, Data&gt;(); |
| id | const | 160 | no | const id = own(node, &quot;id&quot;); |
| children | const | 162 | no | const children = own(node, &quot;children&quot;) ?? []; |
| seen | const | 169 | no | const seen = new Set&lt;string&gt;(); |
| stack | const | 170 | no | const stack = new Set&lt;string&gt;(); |
| invalidGraph | variable | 171 | no | let invalidGraph = false; |
| check | function | 172 | no | function check(id: string, depth: number): void { |
| children | const | 176 | no | const children = own(byId.get(id)!, &quot;children&quot;) as string[] \| undefined; |
| issues | const | 183 | no | const issues: RenderIssue[] = []; |
| trace | const | 184 | no | const trace: RenderTraceEntry[] = []; |
| focusOrder | const | 185 | no | const focusOrder: string[] = []; |
| project | function | 186 | no | function project(id: string): SemanticDomNode { |
| n | const | 187 | no | const n = byId.get(id)!; |
| props | const | 189 | no | const props = dict(own(n, &quot;props&quot;)); |
| a11y | const | 190 | no | const a11y = dict(own(n, &quot;a11y&quot;)); |
| roleCandidate | const | 191 | no | const roleCandidate = safeText(own(a11y, &quot;role&quot;)); |
| nameCandidate | const | 192 | no | const nameCandidate = safeText(own(a11y, &quot;name&quot;) ?? own(a11y, &quot;label&quot;)); |
| description | const | 193 | no | const description = safeText(own(a11y, &quot;description&quot;)); |
| content | const | 194 | no | const content = typeof type === &quot;string&quot; ? safeContent(type, props) : null; |
| isButton | const | 195 | no | const isButton = type === &quot;button&quot;; |
| isKnown | const | 196 | no | const isKnown = typeof type === &quot;string&quot; &amp;&amp; TYPES.has(type); |
| requiresName | const | 197 | no | const requiresName = isButton \|\| type === &quot;card&quot; \|\| type === &quot;profile-card&quot; \|\| type === &quot;project-card&quot;; |
| label | const | 198 | no | const label = nameCandidate ?? content; |
| code | const | 203 | no | const code = !isKnown ? &quot;UNKNOWN_COMPONENT&quot; : &quot;UNSAFE_OR_UNLABELLED_COMPONENT&quot;; |
| tag | const | 208 | no | const tag: SemanticDomNode[&quot;tag&quot;] = type === &quot;text&quot; ? &quot;p&quot; : type === &quot;collection&quot; \|\| type === &quot;timeline&quot; ? &quot;ul&quot; : type === &quot;stack&quot; \|\| type === &quot;grid&quot; ? &quot;div&quot; : &quot;section&quot;; |
| role | const | 209 | no | const role = isButton ? &quot;button&quot; : (type === &quot;text&quot; ? &quot;paragraph&quot; : type === &quot;grid&quot; ? &quot;group&quot; : roleCandidate === &quot;note&quot; ? &quot;note&quot; : &quot;region&quot;); |
| attrs | const | 210 | no | const attrs = attributes(role, label, description); |
| children | const | 218 | no | const children = (own(n, &quot;children&quot;) as string[] \| undefined ?? []).map(project); |
| text | variable | 219 | no | let text = content ?? undefined; |
| items | const | 221 | no | const items = own(props, &quot;items&quot;); |
| item | const | 224 | no | const item = dict(items[i]); |
| itemLabel | const | 225 | no | const itemLabel = safeText(own(item, &quot;label&quot;)); |
| main | const | 238 | no | const main = project(rootId); |
| spatial | const | 239 | no | const spatial = projectSpatialFallback(own(d, &quot;views&quot;)); |
| children | const | 240 | no | const children: SemanticDomNode[] = [main]; |
| spatialNode | const | 242 | no | const spatialNode = leaf(&quot;spatial_fallback&quot;, spatial.description, &quot;note&quot;); |
| root | const | 247 | no | const root: SemanticDomNode = { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./spatial-fallback.ts | import | 6 | [packages/tierflow/src/visual-runtime/render/spatial-fallback.ts](./spatial-fallback.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/device/wave4-desktop-adapter.ts](../device/wave4-desktop-adapter.ts.md) | ../render/dom.ts |
| [packages/tierflow/src/visual-runtime/device/wave4-phone-adapter.ts](../device/wave4-phone-adapter.ts.md) | ../render/dom.ts |
| [packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts](../experience/wave3-journey-fixture.ts.md) | ../render/dom.ts |
| [packages/tierflow/src/visual-runtime/integration-2/compose.ts](../integration-2/compose.ts.md) | ../render/dom.ts |
| [packages/tierflow/src/visual-runtime/render/hvi-inspector.mjs](./hvi-inspector.mjs.md) | ./dom.ts |
| [packages/tierflow/src/visual-runtime/render/inspect.ts](./inspect.ts.md) | ./dom.ts |
| [packages/tierflow/src/visual-runtime/render/wave3-semantics.ts](./wave3-semantics.ts.md) | ./dom.ts |
| [packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts](../../../tests/visual-runtime/integration-2/real-a-h.test.ts.md) | ../../../src/visual-runtime/render/dom.ts |
| [packages/tierflow/tests/visual-runtime/render-snapshots.test.ts](../../../tests/visual-runtime/render-snapshots.test.ts.md) | ../../src/visual-runtime/render/dom.ts |
| [packages/tierflow/tests/visual-runtime/render.test.ts](../../../tests/visual-runtime/render.test.ts.md) | ../../src/visual-runtime/render/dom.ts |
| [packages/tierflow/tests/visual-runtime/wave3-a-schema.test.ts](../../../tests/visual-runtime/wave3-a-schema.test.ts.md) | ../../src/visual-runtime/render/dom.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 256 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)

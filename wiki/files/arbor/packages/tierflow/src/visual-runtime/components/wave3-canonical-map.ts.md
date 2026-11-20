# File: packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts |
| Language | TypeScript |
| Kind | source |
| Size | 13099 B |
| Lines | 224 |
| Hash | 31fcfe9fc05d |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CANONICAL_COMPONENT_MAP_VERSION | const | 13 | yes | export const CANONICAL_COMPONENT_MAP_VERSION = &#39;vivim.ui-component-map/1&#39; as const; |
| CanonicalMapFailure | type | 14 | yes | export type CanonicalMapFailure = |
| CanonicalComponentRef | interface | 18 | yes | export interface CanonicalComponentRef { |
| CanonicalActionRef | interface | 28 | yes | export interface CanonicalActionRef { |
| CanonicalBindingRef | interface | 35 | yes | export interface CanonicalBindingRef { |
| CanonicalViewportPlan | interface | 43 | yes | export interface CanonicalViewportPlan { |
| CanonicalComponentProjection | interface | 47 | yes | export interface CanonicalComponentProjection { |
| CanonicalMapResult | type | 62 | yes | export type CanonicalMapResult = |
| FAIL | function | 66 | no | const FAIL = (code: CanonicalMapFailure, reason: string): CanonicalMapResult =&gt; |
| GAP | const | 68 | no | const GAP = { sm: 8, md: 12, lg: 20 } as const; |
| MAX_NODES | const | 69 | no | const MAX_NODES = 64; |
| freeze | function | 70 | no | function freeze&lt;T&gt;(x: T): T { |
| nodeKind | function | 77 | no | function nodeKind(n: UiDocumentNode): ComponentKind { |
| compatibleRole | function | 82 | no | function compatibleRole(kind: ComponentKind, node: UiDocumentNode): string { |
| layoutFor | function | 93 | no | function layoutFor(n: UiDocumentNode, viewport: number): LayoutConstraints \| null { |
| l | const | 94 | no | const l: UiNodeLayout \| undefined = n.layout; |
| chosen | const | 95 | no | const chosen = viewport &lt;= 600 ? l?.phone : l?.desktop; |
| gap | const | 96 | no | const gap = chosen?.gap ?? l?.gap ?? (n.type === &#39;stack&#39; \|\| n.type === &#39;grid&#39; ? n.props.gap : undefined); |
| minWidth | const | 97 | no | const minWidth = chosen?.minWidth ?? l?.minWidth; |
| maxWidth | const | 98 | no | const maxWidth = chosen?.maxWidth ?? l?.maxWidth; |
| cols | const | 99 | no | const cols = chosen?.columns ?? l?.columns ?? (n.type === &#39;grid&#39; ? n.props.columns : undefined); |
| sourceNodeIds | function | 113 | no | function sourceNodeIds(d: UiDocument): Map&lt;string, string&gt; { |
| sorted | const | 117 | no | const sorted = [...d.nodes.map(n =&gt; n.id)].sort(); |
| overflowText | function | 120 | no | function overflowText(n: UiDocumentNode): readonly string[] { |
| mapCanonicalComponents | function | 133 | yes | export function mapCanonicalComponents(input: unknown, options: UiDocumentValidationOptions = {}): CanonicalMapResult { |
| validated | const | 134 | no | const validated = validateUiDocument(input, options); |
| d | const | 136 | no | const d = validated.document; |
| ids | const | 137 | no | const ids = sourceNodeIds(d); |
| original | const | 138 | no | const original = new Map(d.nodes.map(n =&gt; [n.id, n])); |
| components | const | 139 | no | const components: InspectedComponent[] = []; |
| sourceRefs | const | 140 | no | const sourceRefs: CanonicalComponentRef[] = []; |
| actionRefs | const | 141 | no | const actionRefs: CanonicalActionRef[] = []; |
| bindingRefs | const | 142 | no | const bindingRefs: CanonicalBindingRef[] = []; |
| seenBindings | const | 143 | no | const seenBindings = new Map(d.bindings.map((b, i) =&gt; [b.id, { binding: b, ref: `b_${i}` }])); |
| generated | variable | 144 | no | let generated = 0; |
| kind | const | 146 | no | const kind = nodeKind(n); |
| id | const | 149 | no | const id = ids.get(n.id)!; |
| childIds | const | 150 | no | const childIds = n.children.map(child =&gt; ids.get(child)!); |
| extra | const | 151 | no | const extra = overflowText(n); |
| generatedId | const | 154 | no | const generatedId = `s_${generated++}`; |
| inspected | const | 156 | no | const inspected = inspectComponent({ id: generatedId, type: &#39;text&#39;, props: { text: chunk }, a11y: { role: &#39;paragraph&#39; } }); |
| props | const | 163 | no | const props: Record&lt;string, string \| number \| boolean&gt; = {}; |
| buttonRef | const | 175 | no | const buttonRef = kind === &#39;button&#39; ? `a_${actionRefs.length}` : undefined; |
| action | const | 177 | no | const action = n.actionRefs![0]!; |
| localBindings | const | 180 | no | const localBindings: string[] = []; |
| entry | const | 182 | no | const entry = seenBindings.get(ref); |
| a11y | const | 189 | no | const a11y = { role: compatibleRole(kind, n), name: n.a11y.name, |
| inspected | const | 192 | no | const inspected = inspectComponent({ id, type: kind, props, children: childIds, a11y, bindingRefs: localBindings, actionRefs: buttonRef === undefined ? [] : [buttonRef] }); |
| projectedRoot | const | 200 | no | const projectedRoot = ids.get(d.rootId)!; |
| focus | const | 201 | no | const focus = auditFocusOrder(components.map(c =&gt; ({ id: c.id, type: c.type, props: c.props, children: c.children, a11y: { role: c.a11y.role, name: c.a11y.name, description: c.a11y.description, tabIn… |
| declared | const | 205 | no | const declared = d.nodes.filter(n =&gt; n.type === &#39;button&#39;).sort((a, b) =&gt; (a.a11y.focusOrder ?? -1) - (b.a11y.focusOrder ?? -1)).map(n =&gt; ids.get(n.id)!); |
| viewports | const | 207 | no | const viewports: CanonicalViewportPlan[] = []; |
| plans | const | 209 | no | const plans: { id: string; resolved: ResolvedLayout }[] = []; |
| source | const | 211 | no | const source = sourceRefs.find(s =&gt; s.id === c.id)!; |
| n | const | 212 | no | const n = original.get(source.sourceId)!; |
| constraints | const | 213 | no | const constraints = source.synthesized ? { mode: &#39;stack&#39; as const, paddingPx: 16, gapPx: 12 } : layoutFor(n, viewportPx); |
| resolved | const | 215 | no | const resolved = resolveLayout(constraints, viewportPx, c.children.length, true); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../document/validate.ts | import | 7 | [packages/tierflow/src/visual-runtime/document/validate.ts](../document/validate.ts.md) |
| ../document/schema.ts | import | 8 | [packages/tierflow/src/visual-runtime/document/schema.ts](../document/schema.ts.md) |
| ./catalog.ts | import | 9 | [packages/tierflow/src/visual-runtime/components/catalog.ts](./catalog.ts.md) |
| ./layout.ts | import | 10 | [packages/tierflow/src/visual-runtime/components/layout.ts](./layout.ts.md) |
| ./accessibility.ts | import | 11 | [packages/tierflow/src/visual-runtime/components/accessibility.ts](./accessibility.ts.md) |
| ../document/schema.ts | dynamic | 49 | [packages/tierflow/src/visual-runtime/document/schema.ts](../document/schema.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/final-wave/lane-c/adapters.ts](../final-wave/lane-c/adapters.ts.md) | ../../components/wave3-canonical-map.ts |
| [packages/tierflow/src/visual-runtime/input/wave4-device-semantics.ts](../input/wave4-device-semantics.ts.md) | ../components/wave3-canonical-map.ts |
| [packages/tierflow/src/visual-runtime/integration-3/compose.ts](../integration-3/compose.ts.md) | ../components/wave3-canonical-map.ts |
| [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../integration-4/compose.ts.md) | ../components/wave3-canonical-map.ts |
| [packages/tierflow/tests/visual-runtime/wave3-b-components.test.ts](../../../tests/visual-runtime/wave3-b-components.test.ts.md) | ../../src/visual-runtime/components/wave3-canonical-map.ts |
| [packages/tierflow/tests/visual-runtime/wave4-c-device-semantics.test.ts](../../../tests/visual-runtime/wave4-c-device-semantics.test.ts.md) | ../../src/visual-runtime/components/wave3-canonical-map.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Wave 3 B: lossless, inert adapter FROM Lane A's canonical validated document TO
 * Lane B's closed component vocabulary. Not a document schema, KB reader, renderer,
 * command compiler, Host grant or action dispatcher. Never feed unvalidated data to
 * the component catalog. All unrepresentable semantics fail closed.
 */
import { validateUiDocument, type UiDocumentValidationOptions } from '../document/validate.ts';
import type { UiDocument, UiDocumentNode, UiActionReference, UiNodeAccessibility, UiNodeType, UiNodeLayout } from '../document/schema.ts';
import { inspectComponent, type InspectedComponent, type ComponentKind } from './catalog.ts';
import { resolveLayout, type LayoutConstraints, type ResolvedLayout, RESPONSIVE_FIXTURE_WIDTHS } from './layout.ts';
import { auditFocusOrder } from './accessibility.ts';

export const CANONICAL_COMPONENT_MAP_VERSION = 'vivim.ui-component-map/1' as const;
export type CanonicalMapFailure =
  | 'INVALID_CANONICAL_DOCUMENT' | 'UNSAFE_PROP' | 'INVALID_LAYOUT' | 'INVALID_A11Y'
  | 'UNSUPPORTED_MAPPING' | 'ACTION_ARITY' | 'COMPONENT_LIMIT'
  | 'FOCUS_ORDER_CONFLICT';
export interface CanonicalComponentRef {
  readonly id: string;
  readonly sourceId: string;
  readonly sourceType: UiNodeType;
  /** Exact Lane A semantics, needed by renderer D: B's local roles are NOT authoritative. */
  readonly canonicalA11y: UiNodeAccessibility;
  /** Text variant / card provenance is descriptive, never a command. */
  readonly textVariant?: 'body' | 'heading' | 'muted';
  readonly synthesized: boolean;
}
export interface CanonicalActionRef {
  readonly ref: string;
  readonly sourceNodeId: string;
  readonly id: string;
  readonly version: number;
  readonly executable: false;
}
export interface CanonicalBindingRef {
  readonly ref: string;
  readonly sourceNodeId: string;
  readonly id: string;
  readonly version: number;
  readonly availability: string;
  /** No knowledgeRef, provenanceRef, principal or personal value crosses this UI boundary. */
}
export interface CanonicalViewportPlan {
  readonly viewportPx: 320 | 360 | 1280;
  readonly nodes: readonly { readonly id: string; readonly resolved: ResolvedLayout }[];
}
export interface CanonicalComponentProjection {
  readonly schema: typeof CANONICAL_COMPONENT_MAP_VERSION;
  readonly canonicalDocumentSchema: typeof import('../document/schema.ts').UI_DOCUMENT_SCHEMA;
  readonly documentId: string;
  readonly revision: number;
  readonly rootId: string;
  readonly components: readonly InspectedComponent[];
  readonly sourceRefs: readonly CanonicalComponentRef[];
  readonly actionRefs: readonly CanonicalActionRef[];
  readonly bindingRefs: readonly CanonicalBindingRef[];
  /** DOM tree order; numeric focus order must agree or mapping refuses. */
  readonly focusOrder: readonly string[];
  readonly viewports: readonly CanonicalViewportPlan[];
  readonly authority: 'inert-display-only';
}
export type CanonicalMapResult =
  | { readonly ok: true; readonly value: CanonicalComponentProjection }
  | { readonly ok: false; readonly code: CanonicalMapFailure; readonly reason: string; readonly unavailable: true };

const FAIL = (code: CanonicalMapFailure, reason: string): CanonicalMapResult =>
  ({ ok: false, code, reason, unavailable: true });
const GAP = { sm: 8, md: 12, lg: 20 } as const;
const MAX_NODES = 64;
function freeze<T>(x: T): T {
  if (x !== null && typeof x === 'object' && !Object.isFrozen(x)) {
    for (const value of Object.values(x)) freeze(value);
    Object.freeze(x);
  }
  return x;
}
function nodeKind(n: UiDocumentNode): ComponentKind {
  if (n.type === 'text') return n.props.variant === 'heading' ? 'heading' : 'text';
  if (n.type === 'profile-card' || n.type === 'project-card' || n.type === 'collection' || n.type === 'timeline' || n.type === 'chart') return 'card';
  return n.type;
```

_First 80 of 225 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)

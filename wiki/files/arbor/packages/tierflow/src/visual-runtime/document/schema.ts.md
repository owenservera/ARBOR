# File: packages/tierflow/src/visual-runtime/document/schema.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/document/schema.ts |
| Language | TypeScript |
| Kind | source |
| Size | 4236 B |
| Lines | 96 |
| Hash | 16d4dc81f585 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| UI_DOCUMENT_SCHEMA | const | 6 | yes | export const UI_DOCUMENT_SCHEMA = &#39;vivim.ui-document/1&#39; as const; |
| UI_DOCUMENT_LIMITS | const | 7 | yes | export const UI_DOCUMENT_LIMITS = Object.freeze({ bytes: 32768, nodes: 64, depth: 7, children: 24, bindings: 128, views: 8, text: 240, items: 16, actionRefs: 8, }); |
| UI_DOCUMENT_NODE_TYPES | const | 12 | yes | export const UI_DOCUMENT_NODE_TYPES = [ |
| UiNodeType | type | 16 | yes | export type UiNodeType = typeof UI_DOCUMENT_NODE_TYPES[number]; |
| UiGap | type | 17 | yes | export type UiGap = &#39;sm&#39; \| &#39;md&#39; \| &#39;lg&#39;; |
| UiAvailability | type | 18 | yes | export type UiAvailability = &#39;present&#39; \| &#39;missing&#39; \| &#39;stale&#39; \| &#39;redacted&#39; \| &#39;revoked&#39; \| &#39;deleted&#39; \| &#39;unknown&#39; \| &#39;unavailable&#39;; |
| UiA11yRole | type | 19 | yes | export type UiA11yRole = &#39;main&#39; \| &#39;region&#39; \| &#39;group&#39; \| &#39;heading&#39; \| &#39;text&#39; \| &#39;button&#39; \| &#39;list&#39; \| &#39;listitem&#39; \| &#39;status&#39;; |
| UiCardProps | type | 21 | yes | export type UiCardProps = { readonly title: string; readonly description?: string }; |
| UiItem | type | 22 | yes | export type UiItem = { readonly label: string; readonly detail?: string }; |
| UiChartItem | type | 23 | yes | export type UiChartItem = { readonly label: string; readonly value: number }; |
| UiNodePropsByType | interface | 25 | yes | export interface UiNodePropsByType { |
| UiResponsiveConstraint | interface | 38 | yes | export interface UiResponsiveConstraint { |
| UiNodeLayout | interface | 44 | yes | export interface UiNodeLayout extends UiResponsiveConstraint { |
| UiNodeAccessibility | interface | 48 | yes | export interface UiNodeAccessibility { |
| UiActionReference | interface | 56 | yes | export interface UiActionReference { |
| UiDocumentNodeBase | interface | 60 | no | interface UiDocumentNodeBase { |
| UiDocumentNode | type | 69 | yes | export type UiDocumentNode = { |
| UiDocumentBinding | interface | 73 | yes | export interface UiDocumentBinding { |
| UiDocumentView | type | 84 | yes | export type UiDocumentView = |
| UiDocument | interface | 87 | yes | export interface UiDocument { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts](../components/wave3-canonical-map.ts.md) | ../document/schema.ts |
| [packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts](../components/wave3-canonical-map.ts.md) | ../document/schema.ts |
| [packages/tierflow/src/visual-runtime/device/wave4-phone-adapter.ts](../device/wave4-phone-adapter.ts.md) | ../document/schema.ts |
| [packages/tierflow/src/visual-runtime/document/import-legacy.ts](./import-legacy.ts.md) | ./schema.ts |
| [packages/tierflow/src/visual-runtime/document/validate.ts](./validate.ts.md) | ./schema.ts |
| [packages/tierflow/src/visual-runtime/document/wave3-action-semantics.ts](./wave3-action-semantics.ts.md) | ./schema.ts |
| [packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts](../experience/wave3-journey-fixture.ts.md) | ../document/schema.ts |
| [packages/tierflow/src/visual-runtime/final-wave/integration/schema-boundary.ts](../final-wave/integration/schema-boundary.ts.md) | ../../../visual-runtime/document/schema.ts |
| [packages/tierflow/src/visual-runtime/final-wave/integration/world-visual-bridge.ts](../final-wave/integration/world-visual-bridge.ts.md) | ../../document/schema.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-c/adapters.ts](../final-wave/lane-c/adapters.ts.md) | ../../document/schema.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-c/templates.ts](../final-wave/lane-c/templates.ts.md) | ../../document/schema.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-f/existing-clients.ts](../final-wave/lane-f/existing-clients.ts.md) | ../../document/schema.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts](../final-wave/lane-g/cutover-dry-run.ts.md) | ../../document/schema.ts |
| [packages/tierflow/src/visual-runtime/integration-2/compose.ts](../integration-2/compose.ts.md) | ../document/schema.ts |
| [packages/tierflow/src/visual-runtime/integration-3/compose.ts](../integration-3/compose.ts.md) | ../document/schema.ts |
| [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../integration-4/compose.ts.md) | ../document/schema.ts |
| [packages/tierflow/src/visual-runtime/render/wave3-semantics.ts](../render/wave3-semantics.ts.md) | ../document/schema.ts |
| [packages/tierflow/tests/visual-runtime/document.test.ts](../../../tests/visual-runtime/document.test.ts.md) | ../../src/visual-runtime/document/schema.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-c/adapters.test.ts](../../../tests/visual-runtime/final-wave/lane-c/adapters.test.ts.md) | ../../../../src/visual-runtime/document/schema.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-c/templates.test.ts](../../../tests/visual-runtime/final-wave/lane-c/templates.test.ts.md) | ../../../../src/visual-runtime/document/schema.ts |
| [packages/tierflow/tests/visual-runtime/integration-2/compose.test.ts](../../../tests/visual-runtime/integration-2/compose.test.ts.md) | ../../../src/visual-runtime/document/schema.ts |
| [packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts](../../../tests/visual-runtime/integration-2/real-a-h.test.ts.md) | ../../../src/visual-runtime/document/schema.ts |
| [packages/tierflow/tests/visual-runtime/integration-4/fixture.ts](../../../tests/visual-runtime/integration-4/fixture.ts.md) | ../../../src/visual-runtime/document/schema.ts |
| [packages/tierflow/tests/visual-runtime/wave3-a-schema.test.ts](../../../tests/visual-runtime/wave3-a-schema.test.ts.md) | ../../src/visual-runtime/document/schema.ts |
| [packages/tierflow/tests/visual-runtime/wave3-d-render.test.ts](../../../tests/visual-runtime/wave3-d-render.test.ts.md) | ../../src/visual-runtime/document/schema.ts |
| [packages/tierflow/tests/visual-runtime/wave4-a-desktop-adapter.test.ts](../../../tests/visual-runtime/wave4-a-desktop-adapter.test.ts.md) | ../../src/visual-runtime/document/schema.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * VIVIM's inert, 2D-first UI document value model (fixture-only in Wave 2).
 * References are identifiers, NEVER executable callbacks, verified grants or KB reads.
 * This module is portable: no Bun, Node, DOM, Host or network imports.
 */
export const UI_DOCUMENT_SCHEMA = 'vivim.ui-document/1' as const;
export const UI_DOCUMENT_LIMITS = Object.freeze({
  bytes: 32768, nodes: 64, depth: 7, children: 24, bindings: 128,
  views: 8, text: 240, items: 16, actionRefs: 8,
});

export const UI_DOCUMENT_NODE_TYPES = [
  'stack', 'grid', 'text', 'card', 'button', 'collection',
  'profile-card', 'project-card', 'timeline', 'chart',
] as const;
export type UiNodeType = typeof UI_DOCUMENT_NODE_TYPES[number];
export type UiGap = 'sm' | 'md' | 'lg';
export type UiAvailability = 'present' | 'missing' | 'stale' | 'redacted' | 'revoked' | 'deleted' | 'unknown' | 'unavailable';
export type UiA11yRole = 'main' | 'region' | 'group' | 'heading' | 'text' | 'button' | 'list' | 'listitem' | 'status';

export type UiCardProps = { readonly title: string; readonly description?: string };
export type UiItem = { readonly label: string; readonly detail?: string };
export type UiChartItem = { readonly label: string; readonly value: number };

export interface UiNodePropsByType {
  stack: { readonly direction?: 'vertical' | 'horizontal'; readonly gap?: UiGap };
  grid: { readonly columns?: number; readonly gap?: UiGap };
  text: { readonly value: string; readonly variant?: 'body' | 'heading' | 'muted' };
  card: UiCardProps;
  button: { readonly label: string };
  collection: { readonly title: string; readonly items: readonly UiItem[] };
  'profile-card': UiCardProps;
  'project-card': UiCardProps;
  timeline: { readonly title: string; readonly items: readonly UiItem[] };
  chart: { readonly title: string; readonly items: readonly UiChartItem[] };
}

export interface UiResponsiveConstraint {
  readonly minWidth?: number;
  readonly maxWidth?: number | null;
  readonly columns?: number;
  readonly gap?: UiGap;
}
export interface UiNodeLayout extends UiResponsiveConstraint {
  readonly phone?: UiResponsiveConstraint;
  readonly desktop?: UiResponsiveConstraint;
}
export interface UiNodeAccessibility {
  readonly role: UiA11yRole;
  readonly name: string;
  readonly description?: string;
  /** Focus order is semantic, not inferred from geometry or DOM rendering order. */
  readonly focusOrder?: number;
  readonly live?: 'off' | 'polite';
}
export interface UiActionReference {
  readonly id: string;
  readonly version: number;
}
interface UiDocumentNodeBase {
  readonly id: string;
  readonly children: readonly string[];
  readonly layout?: UiNodeLayout;
  readonly a11y: UiNodeAccessibility;
  readonly bindingRefs?: readonly string[];
  /** Declarative catalogue references; NEVER direct handlers or authorization. */
  readonly actionRefs?: readonly UiActionReference[];
}
export type UiDocumentNode = {
  [K in UiNodeType]: UiDocumentNodeBase & { readonly type: K; readonly props: UiNodePropsByType[K] }
}[UiNodeType];

export interface UiDocumentBinding {
  readonly id: string;
  readonly version: number;
  readonly nodeId: string;
  readonly field: 'value' | 'title' | 'description' | 'items' | 'summary' | 'status';
  readonly knowledgeRef: string;
  readonly provenanceRef: string;
  /** Describes desired projection only. Trusted KB broker decides actual access. */
```

_First 80 of 97 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)

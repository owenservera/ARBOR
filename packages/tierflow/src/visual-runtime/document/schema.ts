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
  readonly readScope: 'owner';
  readonly availability: UiAvailability;
}
export type UiDocumentView =
  | { readonly id: string; readonly version: number; readonly kind: '2d'; readonly viewport: 'phone' | 'desktop' }
  | { readonly id: string; readonly version: number; readonly kind: 'spatial'; readonly fallbackViewId: string; readonly sourceRef: string };
export interface UiDocument {
  readonly schema: typeof UI_DOCUMENT_SCHEMA;
  readonly documentId: string;
  readonly scope: { readonly ownerRef: string; readonly workspaceRef: string };
  readonly revision: number;
  readonly rootId: string;
  readonly nodes: readonly UiDocumentNode[];
  readonly bindings: readonly UiDocumentBinding[];
  readonly views: readonly UiDocumentView[];
}

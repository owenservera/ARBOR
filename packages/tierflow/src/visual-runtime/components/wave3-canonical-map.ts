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
}
function compatibleRole(kind: ComponentKind, node: UiDocumentNode): string {
  // A's role is preserved EXACTLY in sourceRefs; do not falsely claim B's role is canonical.
  switch (kind) {
    case 'stack': case 'grid': return node.a11y.role === 'group' ? 'group' : 'region';
    case 'card': return 'article';
    case 'text': return 'paragraph';
    case 'heading': return 'heading';
    case 'button': return 'button';
    default: return 'group';
  }
}
function layoutFor(n: UiDocumentNode, viewport: number): LayoutConstraints | null {
  const l: UiNodeLayout | undefined = n.layout;
  const chosen = viewport <= 600 ? l?.phone : l?.desktop;
  const gap = chosen?.gap ?? l?.gap ?? (n.type === 'stack' || n.type === 'grid' ? n.props.gap : undefined);
  const minWidth = chosen?.minWidth ?? l?.minWidth;
  const maxWidth = chosen?.maxWidth ?? l?.maxWidth;
  const cols = chosen?.columns ?? l?.columns ?? (n.type === 'grid' ? n.props.columns : undefined);
  // B's renderer has no horizontal stack arrangement: refuse rather than flatten.
  if (n.type === 'stack' && n.props.direction === 'horizontal') return null;
  if (minWidth !== undefined && minWidth > viewport - 32) return null;
  return {
    mode: n.type === 'grid' ? 'grid' : 'stack',
    gapPx: gap === undefined ? 12 : GAP[gap],
    paddingPx: 16,
    minItemWidthPx: Math.max(44, minWidth ?? 160),
    ...(typeof maxWidth === 'number' ? { maxWidthPx: maxWidth } : {}),
    ...(cols === undefined || n.type !== 'grid' ? {} : { maxColumns: cols }),
    motion: 'none',
  };
}
function sourceNodeIds(d: UiDocument): Map<string, string> {
  // Source ID strings can contain '.', ':' or exceed B's 64-char ID bound.
  // Sorted ordinals are deterministic for the same ID set; the exact source ID
  // is retained in the non-executable crosswalk, never silently rewritten.
  const sorted = [...d.nodes.map(n => n.id)].sort();
  return new Map(sorted.map((name, i) => [name, `n_${i}`]));
}
function overflowText(n: UiDocumentNode): readonly string[] {
  if (n.type === 'card' || n.type === 'profile-card' || n.type === 'project-card') {
    return n.props.description === undefined ? [] : [n.props.description];
  }
  if (n.type === 'collection' || n.type === 'timeline') return n.props.items.map(i => i.detail === undefined ? i.label : `${i.label}: ${i.detail}`);
  if (n.type === 'chart') return n.props.items.map(i => `${i.label}: ${String(i.value)}`);
  return [];
}
/**
 * Always reruns Lane A validation. Its `knownActions` is only a catalog of inert
 * identifiers, NOT a Host grant. Unknown/mismatched references refuse the WHOLE view.
 * B does not retrieve KB, bind event handlers or execute action references.
 */
export function mapCanonicalComponents(input: unknown, options: UiDocumentValidationOptions = {}): CanonicalMapResult {
  const validated = validateUiDocument(input, options);
  if (!validated.ok) return FAIL('INVALID_CANONICAL_DOCUMENT', `${validated.unavailable.reason} at ${validated.diagnostics[0]?.path ?? '$'}`);
  const d = validated.document;
  const ids = sourceNodeIds(d);
  const original = new Map(d.nodes.map(n => [n.id, n]));
  const components: InspectedComponent[] = [];
  const sourceRefs: CanonicalComponentRef[] = [];
  const actionRefs: CanonicalActionRef[] = [];
  const bindingRefs: CanonicalBindingRef[] = [];
  const seenBindings = new Map(d.bindings.map((b, i) => [b.id, { binding: b, ref: `b_${i}` }]));
  let generated = 0;
  for (const n of d.nodes) {
    const kind = nodeKind(n);
    if (n.type === 'button' && (n.actionRefs?.length ?? 0) !== 1) return FAIL('ACTION_ARITY', 'Single inert action reference required for B buttons');
    if (n.a11y.live === 'polite') return FAIL('INVALID_A11Y', 'Announced live regions cannot be represented by the existing B component catalog');
    const id = ids.get(n.id)!;
    const childIds = n.children.map(child => ids.get(child)!);
    const extra = overflowText(n);
    if (extra.length) {
      for (const chunk of extra) {
        const generatedId = `s_${generated++}`;
        childIds.push(generatedId);
        const inspected = inspectComponent({ id: generatedId, type: 'text', props: { text: chunk }, a11y: { role: 'paragraph' } });
        if (!inspected.ok) return FAIL('UNSAFE_PROP', `Safe text fallback refused: ${inspected.code}`);
        components.push(inspected.value);
        sourceRefs.push({ id: generatedId, sourceId: n.id, sourceType: n.type, canonicalA11y: n.a11y, synthesized: true });
      }
    }
    if (components.length + d.nodes.length > MAX_NODES) return FAIL('COMPONENT_LIMIT', 'Canonical component map exceeds 64 nodes');
    const props: Record<string, string | number | boolean> = {};
    if (kind === 'text' || kind === 'heading') {
      if (n.type !== 'text') return FAIL('UNSUPPORTED_MAPPING', 'Text mapping source mismatch');
      props.text = n.props.value;
      if (kind === 'heading') props.level = 2;
    } else if (kind === 'button') {
      if (n.type !== 'button') return FAIL('UNSUPPORTED_MAPPING', 'Button mapping source mismatch');
      props.label = n.props.label;
    } else if (kind === 'card') {
      if (!('title' in n.props)) return FAIL('UNSUPPORTED_MAPPING', 'Card must have title');
      props.title = n.props.title;
    }
    const buttonRef = kind === 'button' ? `a_${actionRefs.length}` : undefined;
    if (buttonRef !== undefined) {
      const action = n.actionRefs![0]!;
      actionRefs.push({ ref: buttonRef, sourceNodeId: n.id, id: action.id, version: action.version, executable: false });
    }
    const localBindings: string[] = [];
    for (const ref of n.bindingRefs ?? []) {
      const entry = seenBindings.get(ref);
      if (!entry) return FAIL('INVALID_CANONICAL_DOCUMENT', 'Lost validated binding reference');
      localBindings.push(entry.ref);
      if (!bindingRefs.some(b => b.ref === entry.ref)) bindingRefs.push({ ref: entry.ref, sourceNodeId: n.id, id: entry.binding.id, version: entry.binding.version, availability: entry.binding.availability });
    }
    // B's `a11y` cannot express Lane A's main/list/text roles or focusOrder.
    // The exact original metadata above is mandatory for D's semantic renderer.
    const a11y = { role: compatibleRole(kind, n), name: n.a11y.name,
      ...(n.a11y.description === undefined ? {} : { description: n.a11y.description }),
      ...(kind === 'button' ? { tabIndex: 0, touchTargetPx: 44 } : {}) };
    const inspected = inspectComponent({ id, type: kind, props, children: childIds,
      a11y, bindingRefs: localBindings, actionRefs: buttonRef === undefined ? [] : [buttonRef] });
    if (!inspected.ok) return FAIL(inspected.code === 'INVALID_A11Y' ? 'INVALID_A11Y' : 'UNSAFE_PROP', `${n.id}: ${inspected.code}: ${inspected.reason}`);
    components.push(inspected.value);
    sourceRefs.push({ id, sourceId: n.id, sourceType: n.type, canonicalA11y: n.a11y,
      ...(n.type === 'text' ? { textVariant: n.props.variant ?? 'body' } : {}), synthesized: false });
  }
  // Inspect source order as a graph, not the creation order (which may include synthetic children).
  const projectedRoot = ids.get(d.rootId)!;
  const focus = auditFocusOrder(components.map(c => ({ id: c.id, type: c.type, props: c.props, children: c.children,
    a11y: { role: c.a11y.role, name: c.a11y.name, description: c.a11y.description, tabIndex: c.a11y.tabIndex,
      touchTargetPx: c.a11y.touchTargetPx, live: c.a11y.live } })), projectedRoot);
  if (!focus.ok) return FAIL('INVALID_A11Y', focus.reason);
  const declared = d.nodes.filter(n => n.type === 'button').sort((a, b) => (a.a11y.focusOrder ?? -1) - (b.a11y.focusOrder ?? -1)).map(n => ids.get(n.id)!);
  if (JSON.stringify(focus.value) !== JSON.stringify(declared)) return FAIL('FOCUS_ORDER_CONFLICT', 'A numeric focus order conflicts with B structural keyboard traversal');
  const viewports: CanonicalViewportPlan[] = [];
  for (const viewportPx of RESPONSIVE_FIXTURE_WIDTHS) {
    const plans: { id: string; resolved: ResolvedLayout }[] = [];
    for (const c of components) {
      const source = sourceRefs.find(s => s.id === c.id)!;
      const n = original.get(source.sourceId)!;
      const constraints = source.synthesized ? { mode: 'stack' as const, paddingPx: 16, gapPx: 12 } : layoutFor(n, viewportPx);
      if (!constraints) return FAIL('INVALID_LAYOUT', `${n.id}: unrepresentable horizontal or minimum width at ${viewportPx}px`);
      const resolved = resolveLayout(constraints, viewportPx, c.children.length, true);
      if (!resolved.ok) return FAIL('INVALID_LAYOUT', `${n.id}@${viewportPx}: ${resolved.code}: ${resolved.reason}`);
      plans.push({ id: c.id, resolved: resolved.value });
    }
    viewports.push({ viewportPx, nodes: plans });
  }
  return { ok: true, value: freeze({ schema: CANONICAL_COMPONENT_MAP_VERSION,
    canonicalDocumentSchema: d.schema, documentId: d.documentId, revision: d.revision, rootId: projectedRoot,
    components, sourceRefs, actionRefs, bindingRefs, focusOrder: [...focus.value], viewports, authority: 'inert-display-only' as const }) };
}

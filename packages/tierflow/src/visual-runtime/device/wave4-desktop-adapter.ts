/**
 * Wave 4 Lane A: inert, pure projection into the EXISTING VIVIM Tauri/Host
 * window.  This file does not mount DOM, subscribe to Host, persist state,
 * register a renderer, open another publisher or dispatch an effect.
 *
 * Existing native boundary: src-tauri/src/main.rs -> 127.0.0.1:43187 ->
 * apps/vivim-host/public/{index.html,host.js,control-panel.js}.
 * No Harness file is changed or wired by this fixture-level contract.
 */
import { projectWave3ActionSemantics, type Wave3SemanticsOptions } from '../document/wave3-action-semantics.ts';
import { renderWave3Semantics } from '../render/wave3-semantics.ts';
import { renderUiDocument, type RenderPlan, type SemanticDomNode } from '../render/dom.ts';

export const WAVE4_DESKTOP_ADAPTER_SCHEMA = 'vivim.wave4-desktop-adapter/1' as const;
export const WAVE4_DESKTOP_MOUNT = 'world-view' as const;
export const WAVE4_DESKTOP_FOCUS_RETURN = 'main' as const;

/** Observed by the EXISTING Harness/Host owner, not authenticated by this adapter. */
export interface DesktopHostObservation {
  readonly state: 'connected' | 'detached';
  readonly ownerRef: string;
  readonly worldRef: string;
  readonly decision: 'read-only' | 'denied' | 'uncertain';
  readonly publisher: 'harness';
  /** The existing shell owner MUST prove this is false before integrating. */
  readonly anotherPublisherPresent: boolean;
}

export interface DesktopAdapterRequest {
  /** Untrusted canonical A document, NEVER a World-store document. */
  readonly document: unknown;
  /** Trusted owner/broker equality pins; not proof of owner consent. */
  readonly semantics: Wave3SemanticsOptions;
  readonly host: DesktopHostObservation;
  readonly viewportPx: number;
  /** Last displayed revision from the existing publisher; null = complete startup snapshot. */
  readonly lastDisplayedRevision: number | null;
}

export type DesktopRefusalCode =
  | 'INVALID_SHELL_CONTEXT' | 'INVALID_VIEWPORT' | 'WRONG_WORLD' | 'WRONG_OWNER'
  | 'HOST_DETACHED' | 'HOST_DENIED' | 'HOST_UNCERTAIN' | 'DUPLICATE_PUBLISHER'
  | 'STALE_REVISION' | 'RESNAPSHOT_REQUIRED' | 'CANONICAL_REFUSED'
  | 'RENDER_REFUSED' | 'REFERENCE_DIVERGED' | 'KEYBOARD_TRAP';

/** Only inert metadata, never callbacks, bearer tokens, private KB refs or HTML. */
export interface DesktopShellView {
  readonly schema: typeof WAVE4_DESKTOP_ADAPTER_SCHEMA;
  readonly evidenceClass: 'tierflow-code-fixture';
  readonly native: Readonly<{
    window: 'main';
    existingMountId: typeof WAVE4_DESKTOP_MOUNT;
    webview: 'existing-vivim-host';
    existingPublisher: 'harness';
    publish: false;
    newStore: false;
    effects: false;
  }>;
  readonly identity: Readonly<{
    documentId: string;
    ownerRef: string;
    worldRef: string;
    revision: number;
    documentDigest: string;
    replayed: boolean;
  }>;
  readonly plan: RenderPlan;
  readonly focus: Readonly<{
    order: readonly string[];
    returnToId: typeof WAVE4_DESKTOP_FOCUS_RETURN;
    escape: 'return-to-existing-shell';
    tabCycle: 'browser-native';
    trapped: false;
  }>;
  /** Version-preserving aliases. A's private KB provenance side table stays with the caller. */
  readonly references: readonly Readonly<{
    alias: string;
    kind: 'action' | 'binding';
    nodeId: string;
    version: number;
    inert: true;
  }>[];
  readonly provenance: Readonly<{
    bindingCount: number;
    ownerScoped: true;
    authorizedByRenderer: false;
    actualSourceAuthority: 'not-asserted';
  }>;
  readonly status: 'ok' | 'partial';
  readonly effectsInvoked: false;
}

export type DesktopAdapterResult =
  | Readonly<{ ok: true; view: DesktopShellView }>
  | Readonly<{
    ok: false;
    code: DesktopRefusalCode;
    reason: string;
    /** Public, static status text suitable for aria-live; no private values. */
    notice: string;
    readonly readOnly: true;
    readonly effectsInvoked: false;
    readonly safePlan: RenderPlan;
    readonly focusReturnId: typeof WAVE4_DESKTOP_FOCUS_RETURN;
    readonly retry: 'manual-status-check-or-resnapshot';
  }>;

function refuse(code: DesktopRefusalCode, viewportPx: number): DesktopAdapterResult {
  const notice = code === 'HOST_DETACHED'
    ? 'Local Host disconnected. This view is unavailable. Check status before resuming.'
    : code === 'HOST_DENIED'
      ? 'The Host denied this view. No change was made. Return to Host Control.'
      : code === 'RESNAPSHOT_REQUIRED' || code === 'STALE_REVISION'
        ? 'This view is out of date. Request a fresh authorized snapshot.'
        : 'This view is unavailable. Nothing was changed. Return to Host Control.';
  return Object.freeze({ ok: false, code, reason: code, notice, readOnly: true,
    effectsInvoked: false, safePlan: renderUiDocument(null, { viewportPx: safeViewport(viewportPx) }),
    focusReturnId: WAVE4_DESKTOP_FOCUS_RETURN, retry: 'manual-status-check-or-resnapshot' });
}
function safeViewport(width: number): number {
  return Number.isSafeInteger(width) && width >= 240 && width <= 3840 ? width : 360;
}
function safeRevision(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
function validHost(value: unknown): value is DesktopHostObservation {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const host = value as Record<string, unknown>;
  // No getter invocation on the trust boundary.
  if (Object.getPrototypeOf(host) !== Object.prototype && Object.getPrototypeOf(host) !== null) return false;
  const get = (key: string): unknown => Object.getOwnPropertyDescriptor(host, key)?.value;
  return (get('state') === 'connected' || get('state') === 'detached') &&
    (get('decision') === 'read-only' || get('decision') === 'denied' || get('decision') === 'uncertain') &&
    typeof get('ownerRef') === 'string' && typeof get('worldRef') === 'string' &&
    get('publisher') === 'harness' && typeof get('anotherPublisherPresent') === 'boolean';
}
/** Seal the freshly generated display tree after structural checks. */
function seal<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) seal(child);
    Object.freeze(value);
  }
  return value;
}
function refKey(nodeId: string, id: string, version: number): string {
  return JSON.stringify([nodeId, id, version]);
}
function focusIsSafe(root: SemanticDomNode, order: readonly string[]): boolean {
  const focusable: string[] = [];
  function visit(node: SemanticDomNode): boolean {
    const tab = node.attributes.tabindex;
    if (tab !== undefined) {
      if (tab !== '0' || node.attributes.role !== 'button' || node.attributes['aria-disabled'] !== 'true') return false;
      focusable.push(node.id);
    }
    return node.children.every(visit);
  }
  return visit(root) && new Set(order).size === order.length &&
    focusable.length === order.length && focusable.every((id, i) => id === order[i]);
}

/**
 * Projection only.  Host consent, pairing, source authorization and live
 * publisher singleton checks remain authoritative in Harness, not here.
 * There are no event listeners or automatic retries to trap keyboard focus.
 */
export function projectWave4DesktopAdapter(input: DesktopAdapterRequest): DesktopAdapterResult {
  if (!input || typeof input !== 'object' || !validHost(input.host) ||
      !safeRevision(input.lastDisplayedRevision) && input.lastDisplayedRevision !== null) {
    return refuse('INVALID_SHELL_CONTEXT', 360);
  }
  const width = input.viewportPx;
  if (safeViewport(width) !== width) return refuse('INVALID_VIEWPORT', width);
  const host = input.host;
  if (host.anotherPublisherPresent) return refuse('DUPLICATE_PUBLISHER', width);
  if (host.state !== 'connected') return refuse('HOST_DETACHED', width);
  if (host.decision === 'denied') return refuse('HOST_DENIED', width);
  if (host.decision !== 'read-only') return refuse('HOST_UNCERTAIN', width);
  const knownActions = input.semantics?.knownActions;
  if (!Array.isArray(knownActions)) return refuse('CANONICAL_REFUSED', width);
  const result = projectWave3ActionSemantics(input.document, input.semantics);
  if (!result.ok) return refuse('CANONICAL_REFUSED', width);
  const canonical = result.value;
  if (canonical.canonical.scope.ownerRef !== host.ownerRef) return refuse('WRONG_OWNER', width);
  if (canonical.canonical.scope.workspaceRef !== host.worldRef) return refuse('WRONG_WORLD', width);
  const revision = canonical.revision;
  const seen = input.lastDisplayedRevision;
  if (seen !== null && revision < seen) return refuse('STALE_REVISION', width);
  if (seen !== null && revision > seen + 1) return refuse('RESNAPSHOT_REQUIRED', width);

  // Run the ACTUAL validated Wave 3 D renderer, never trust caller HTML or a supplied plan.
  const rendered = renderWave3Semantics(canonical.canonical, {
    viewportPx: width, knownActions,
  });
  if (rendered.status === 'unavailable' || rendered.refusalCode !== null ||
      rendered.plan.documentId !== canonical.documentId || rendered.plan.revision !== revision ||
      rendered.plan.viewportPx !== width) return refuse('RENDER_REFUSED', width);

  // A/D must agree on every versioned action and binding/provenance reference.
  const a = canonical.references.filter(r => r.kind === 'action');
  const b = canonical.references.filter(r => r.kind === 'binding');
  const actions = new Set(a.map(r => refKey(r.nodeId, r.id, r.version)));
  const bindings = new Set(b.map(r => r.kind === 'binding'
    ? JSON.stringify([r.nodeId, r.id, r.version, r.provenanceRef, r.availability]) : ''));
  if (actions.size !== a.length || bindings.size !== b.length ||
      rendered.actions.length !== a.length || rendered.provenance.length !== b.length ||
      rendered.actions.some(r => !actions.has(refKey(r.nodeId, r.id, r.version))) ||
      rendered.provenance.some(r => !bindings.has(JSON.stringify([
        r.nodeId, r.bindingId, r.bindingVersion, r.provenanceRef, r.availability,
      ])))) return refuse('REFERENCE_DIVERGED', width);
  if (!focusIsSafe(rendered.plan.root, rendered.plan.focusOrder)) return refuse('KEYBOARD_TRAP', width);

  const view: DesktopShellView = Object.freeze({
    schema: WAVE4_DESKTOP_ADAPTER_SCHEMA, evidenceClass: 'tierflow-code-fixture',
    native: Object.freeze({ window: 'main', existingMountId: WAVE4_DESKTOP_MOUNT,
      webview: 'existing-vivim-host', existingPublisher: 'harness', publish: false,
      newStore: false, effects: false }),
    identity: Object.freeze({ documentId: canonical.documentId, ownerRef: host.ownerRef,
      worldRef: host.worldRef, revision, documentDigest: canonical.documentDigest,
      replayed: seen === revision }),
    plan: seal(rendered.plan),
    focus: Object.freeze({ order: Object.freeze([...rendered.plan.focusOrder]),
      returnToId: WAVE4_DESKTOP_FOCUS_RETURN, escape: 'return-to-existing-shell',
      tabCycle: 'browser-native', trapped: false }),
    references: Object.freeze(canonical.references.map(r => Object.freeze({
      alias: r.alias, kind: r.kind, nodeId: r.nodeId, version: r.version, inert: true as const,
    }))),
    provenance: Object.freeze({ bindingCount: b.length, ownerScoped: true,
      authorizedByRenderer: false, actualSourceAuthority: 'not-asserted' }),
    status: rendered.status, effectsInvoked: false,
  });
  return Object.freeze({ ok: true, view });
}

/** Recompute from the canonical document, never scale a stale DOM snapshot. */
export function resizeWave4DesktopAdapter(input: DesktopAdapterRequest, viewportPx: number): DesktopAdapterResult {
  return projectWave4DesktopAdapter({ ...input, viewportPx });
}

/**
 * Wave 4 Lane B: an INERT phone projection for the existing VIVIM APK/relay.
 * Consumes the SAME Wave 3 A document + D plan as desktop; it does not mount,
 * publish, store, authenticate, approve, transport, or execute anything.
 * Host/Android owner supplies already-verified pairing/cursor observations.
 */
import type { UiDocument, UiActionReference } from '../document/schema.ts';
import type { Wave3RenderResult } from '../render/wave3-semantics.ts';
import type { SemanticDomNode } from '../render/dom.ts';

export const WAVE4_PHONE_SCHEMA = 'vivim.wave4-phone-projection/1' as const;
export const PHONE_MIN_TOUCH_PX = 44 as const;
export type PhoneStatus = 'ready' | 'unpaired' | 'offline' | 'denied' | 'resnapshot-required' | 'unavailable';
export type PhoneRefusalCode =
  | 'INVALID_INPUT' | 'WRONG_SHELL' | 'DUPLICATE_PUBLISHER' | 'PAIRING_REQUIRED'
  | 'PAIRING_IDENTITY_MISMATCH' | 'PAIRING_REPLAY' | 'PAIRING_EXPIRED'
  | 'SECRET_FIELD_PRESENT' | 'HOST_DENIED' | 'HOST_OFFLINE' | 'STALE_AUTHORIZATION'
  | 'STALE_DOCUMENT' | 'RESNAPSHOT_REQUIRED' | 'RENDER_REFUSED'
  | 'CANONICAL_MISMATCH' | 'UNSAFE_RENDER' | 'INVALID_VIEWPORT';
export interface PhoneShellContract {
  readonly app: 'existing-vivim-apk';
  readonly relay: 'existing-mobile-relay';
  readonly publisher: 'harness';
  readonly viewportPx: number;
}
export interface PhonePairingObservation {
  readonly state: 'paired' | 'unpaired' | 'revoked';
  readonly ownerRef: string;
  readonly worldRef: string;
  readonly deviceRef: string;
  readonly sessionRef: string;
  /** Monotonic epoch and cursor from the EXISTING Host/relay. Never a bearer. */
  readonly epoch: number;
  readonly receivedSequence: number;
  readonly lastAcceptedSequence: number;
  readonly expiresAtMs: number;
}
export interface PhoneHostObservation {
  readonly state: 'online' | 'offline' | 'disconnected' | 'denied';
  readonly ownerRef: string;
  readonly worldRef: string;
  readonly deviceRef: string;
  readonly sessionRef: string;
  readonly pairingEpoch: number;
  readonly policyRevision: number;
  readonly nowMs: number;
  readonly grantExpiresAtMs: number;
  readonly documentRevision: number;
  readonly denied: boolean;
  /** Verified Host descriptor/policy observations, never phone-supplied risk labels. */
  readonly actionRisks: readonly Readonly<{ nodeId: string; id: string; version: number; risk: 'R0' | 'R1' | 'R2' | 'R3'; policyRevision: number }>[];
}
export interface PhoneProjectionInput {
  readonly canonical: UiDocument;
  /** Must be produced by the real Wave 3 Lane D renderer, not by the phone. */
  readonly rendered: Wave3RenderResult;
  readonly shell: PhoneShellContract;
  readonly pairing: PhonePairingObservation;
  readonly host: PhoneHostObservation;
}
export interface PhoneAccessibleNode {
  readonly id: string;
  readonly tag: SemanticDomNode['tag'];
  readonly role: string;
  readonly label: string | null;
  readonly description: string | null;
  readonly disabled: boolean;
  readonly touchTargetPx: number;
  readonly columns: number;
  readonly text?: string;
  readonly children: readonly PhoneAccessibleNode[];
}
export interface PhoneProjection {
  readonly schema: typeof WAVE4_PHONE_SCHEMA;
  readonly status: PhoneStatus;
  readonly refusalCode: PhoneRefusalCode | null;
  readonly documentId: string | null;
  readonly revision: number | null;
  readonly viewportPx: number;
  readonly displayOnly: true;
  readonly publisher: 'harness';
  readonly effectInvoked: false;
  readonly automaticRetryAllowed: false;
  readonly canApproveOnPhone: false;
  readonly root: PhoneAccessibleNode;
  readonly focusOrder: readonly string[];
  readonly help: string;
  /** One-way display metadata, not a permission or bearer token. */
  readonly identity: Readonly<{ ownerRef: string; worldRef: string; deviceRef: string }> | null;
}
export type PhoneEvent = Readonly<{
  kind: 'touch' | 'talkback' | 'back';
  eventId: string;
  nodeId?: string;
  risk?: 'R0' | 'R1' | 'R2' | 'R3';
}>;
export type PhoneEventResult =
  | Readonly<{ ok: true; kind: 'candidate' | 'back-request'; eventId: string;
      action: Readonly<{ id: string; version: number; nodeId: string }> | null;
      source: 'touch' | 'talkback' | 'back'; revision: number;
      effectInvoked: false; automaticRetryAllowed: false; canApproveOnPhone: false }>
  | Readonly<{ ok: false; code: 'NOT_READY' | 'STALE_REVISION' | 'DUPLICATE_EVENT' |
      'INVALID_EVENT' | 'UNKNOWN_ACTION' | 'RISK_MISMATCH' | 'R2_PHONE_FORBIDDEN' | 'R3_PHONE_FORBIDDEN';
      effectInvoked: false; automaticRetryAllowed: false; canApproveOnPhone: false }>;

const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/;
const SECRET_TEXT = /\b[a-f0-9]{64}\b|vivim:\/\/pair|(?:pair(?:ing)?[_-]?token|grant[_-]?id|session[_-]?id)\s*[:=]/i;
const UNSAFE_TEXT = /<\s*\/?\s*[a-z][^>]*>|(?:javascript|data|vbscript|file)\s*:/i;
const VALID_ATTRIBUTES = new Set(['role', 'aria-label', 'aria-description', 'aria-disabled', 'tabindex']);
const SECRET_KEYS = /(?:token|secret|password|bearer|authorization|grantId|sessionId|qr)/i;
const plain = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' &&
  !Array.isArray(v) && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const int = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const id = (v: unknown): v is string => typeof v === 'string' && ID.test(v);
const safe = (v: unknown): v is string => typeof v === 'string' && v.length <= 240 &&
  !/[\u0000-\u001f\u007f]/.test(v) && !SECRET_TEXT.test(v) && !UNSAFE_TEXT.test(v);
const noSecrets = (v: unknown): boolean => plain(v) && Reflect.ownKeys(v).every(k =>
  typeof k === 'string' && !SECRET_KEYS.test(k) && 'value' in Object.getOwnPropertyDescriptor(v, k)!);
const refusalNode = (label: string): PhoneAccessibleNode => Object.freeze({
  id: 'phone_unavailable', tag: 'main', role: 'status', label, description: null,
  disabled: true, touchTargetPx: 0, columns: 1, children: Object.freeze([]),
});
const freeze = <T>(v: T): T => Object.freeze(v);
function refuse(code: PhoneRefusalCode, width: number, status: PhoneStatus = 'unavailable'): PhoneProjection {
  // No stale text, pairing identifiers, raw tokens, approval or old focus survives.
  const label = status === 'offline' ? 'Host disconnected. Reconnect and review before continuing.' :
    status === 'denied' ? 'Host denied this request. No action was taken.' :
    status === 'unpaired' ? 'Pair this phone with your VIVIM Host to continue.' :
    status === 'resnapshot-required' ? 'This view changed. Reconnect for a fresh view.' :
    'This view is unavailable. Nothing can be changed here.';
  return freeze({ schema: WAVE4_PHONE_SCHEMA, status, refusalCode: code,
    documentId: null, revision: null, viewportPx: width, displayOnly: true,
    publisher: 'harness', effectInvoked: false, automaticRetryAllowed: false,
    canApproveOnPhone: false, root: refusalNode(label), focusOrder: freeze([]),
    help: label, identity: null });
}

function sanitizeNode(node: unknown, focus: ReadonlySet<string>, width: number,
  ids: Set<string>, depth = 0): PhoneAccessibleNode | null {
  if (!plain(node) || depth > 7 || ids.size >= 96 || !id(node.id) || ids.has(node.id) ||
      !plain(node.attributes) || !plain(node.layout) || !Array.isArray(node.children) ||
      node.children.length > 24 || !['main','section','div','p','h2','ul','li','span'].includes(String(node.tag))) return null;
  for (const [k, v] of Object.entries(node.attributes)) {
    if (!VALID_ATTRIBUTES.has(k) || !safe(v)) return null;
  }
  if (node.text !== undefined && !safe(node.text)) return null;
  if (!int(node.layout.columns) || node.layout.columns < 1 || node.layout.columns > 4 ||
      !int(node.layout.minTargetPx) || !['block','grid','flex'].includes(String(node.layout.display))) return null;
  const role = node.attributes.role;
  const label = node.attributes['aria-label'] ?? null;
  const description = node.attributes['aria-description'] ?? null;
  if (typeof role !== 'string' || !safe(role) || (label !== null && !safe(label)) ||
      (description !== null && !safe(description))) return null;
  const isAction = focus.has(node.id);
  if (isAction && (role !== 'button' || !label || node.attributes['aria-disabled'] !== 'true' ||
      node.layout.minTargetPx < PHONE_MIN_TOUCH_PX)) return null;
  ids.add(node.id);
  const children: PhoneAccessibleNode[] = [];
  for (const child of node.children) {
    const projected = sanitizeNode(child, focus, width, ids, depth + 1);
    if (!projected) return null;
    children.push(projected);
  }
  return freeze({ id: node.id, tag: node.tag as PhoneAccessibleNode['tag'],
    role, label, description: isAction ? 'Read-only preview. Host review required.' : description,
    disabled: isAction || node.attributes['aria-disabled'] === 'true',
    touchTargetPx: isAction ? Math.max(PHONE_MIN_TOUCH_PX, node.layout.minTargetPx) : 0,
    columns: width <= 360 ? 1 : node.layout.columns,
    ...(node.text === undefined ? {} : { text: node.text as string }), children: freeze(children) });
}

/** No DOM, WebView bridge, transport, APK registration or Host mutation. */
export function projectWave4PhoneAdapter(input: PhoneProjectionInput): PhoneProjection {
  const width = input?.shell?.viewportPx;
  const w = int(width) ? width : 0;
  if (w < 240 || w > 3840) return refuse('INVALID_VIEWPORT', w);
  if (!plain(input) || !plain(input.shell) || !plain(input.host) || !plain(input.pairing) ||
      !noSecrets(input.shell) || !noSecrets(input.host) || !noSecrets(input.pairing)) return refuse('SECRET_FIELD_PRESENT', w);
  if (input.shell.app !== 'existing-vivim-apk' || input.shell.relay !== 'existing-mobile-relay') return refuse('WRONG_SHELL', w);
  if (input.shell.publisher !== 'harness') return refuse('DUPLICATE_PUBLISHER', w);
  const p = input.pairing, h = input.host, d = input.canonical, r = input.rendered;
  if (!plain(d) || !plain(d.scope) || !plain(p) || !plain(h) || !plain(r)) return refuse('INVALID_INPUT', w);
  if (p.state !== 'paired') return refuse('PAIRING_REQUIRED', w, 'unpaired');
  if (![p.ownerRef,p.worldRef,p.deviceRef,p.sessionRef,h.ownerRef,h.worldRef,h.deviceRef,h.sessionRef,
      d.scope.ownerRef,d.scope.workspaceRef].every(id) ||
      p.ownerRef !== h.ownerRef || p.ownerRef !== d.scope.ownerRef ||
      p.worldRef !== h.worldRef || p.deviceRef !== h.deviceRef || p.sessionRef !== h.sessionRef ||
      p.epoch !== h.pairingEpoch || !int(p.epoch)) return refuse('PAIRING_IDENTITY_MISMATCH', w);
  if (!int(p.receivedSequence) || !int(p.lastAcceptedSequence) || p.receivedSequence <= p.lastAcceptedSequence)
    return refuse('PAIRING_REPLAY', w, 'resnapshot-required');
  if (p.receivedSequence !== p.lastAcceptedSequence + 1) return refuse('RESNAPSHOT_REQUIRED', w, 'resnapshot-required');
  if (!int(h.nowMs) || !int(p.expiresAtMs) || p.expiresAtMs <= h.nowMs) return refuse('PAIRING_EXPIRED', w, 'unpaired');
  if (h.denied || h.state === 'denied') return refuse('HOST_DENIED', w, 'denied');
  if (h.state !== 'online') return refuse('HOST_OFFLINE', w, 'offline');
  if (!int(h.policyRevision) || !int(h.grantExpiresAtMs) || h.grantExpiresAtMs <= h.nowMs)
    return refuse('STALE_AUTHORIZATION', w, 'denied');
  if (!int(h.documentRevision) || !int(d.revision) || d.revision !== h.documentRevision)
    return refuse('STALE_DOCUMENT', w, 'resnapshot-required');
  if (!Array.isArray(h.actionRisks) || h.actionRisks.length > 64 ||
      !h.actionRisks.every(a => plain(a) && id(a.nodeId) && id(a.id) && int(a.version) &&
        a.version > 0 && typeof a.risk === 'string' && ['R0','R1','R2','R3'].includes(a.risk) && a.policyRevision === h.policyRevision))
    return refuse('STALE_AUTHORIZATION', w, 'denied');
  if (r.sourceSchema !== 'vivim.ui-document/1' || r.status === 'unavailable' || r.refusalCode !== null ||
      r.plan?.schema !== 'vivim.ui-render-plan/1' || r.plan.documentId !== d.documentId ||
      r.plan.revision !== d.revision || r.plan.viewportPx !== w ||
      r.plan.status !== r.status || !Array.isArray(r.plan.focusOrder) ||
      !Array.isArray(r.actions) || !Array.isArray(r.provenance) ||
      !Array.isArray(d.nodes) || !Array.isArray(d.bindings))
    return refuse('RENDER_REFUSED', w);
  const canonicalFocus = d.nodes.filter(n => n.type === 'button');
  const canonicalActions = canonicalFocus.flatMap(n => (n.actionRefs ?? []).map((a: UiActionReference) => `${n.id}|${a.id}|${a.version}`)).sort();
  const renderedActions = r.actions.map(a => `${a.nodeId}|${a.id}|${a.version}`).sort();
  const riskActions = h.actionRisks.map(a => `${a.nodeId}|${a.id}|${a.version}`).sort();
  if (JSON.stringify(canonicalActions) !== JSON.stringify(renderedActions) ||
      JSON.stringify(canonicalActions) !== JSON.stringify(riskActions) ||
      canonicalFocus.length !== r.plan.focusOrder.length ||
      new Set(r.plan.focusOrder).size !== canonicalFocus.length ||
      r.plan.focusOrder.some(x => !canonicalFocus.some(n => n.id === x))) return refuse('CANONICAL_MISMATCH', w);
  // Declare binding equality privately, but NEVER serialize KB/provenance refs to the phone.
  const declared = d.bindings.map(b => `${b.nodeId}|${b.id}|${b.version}|${b.provenanceRef}|${b.availability}`).sort();
  const projected = r.provenance.map(b => `${b.nodeId}|${b.bindingId}|${b.bindingVersion}|${b.provenanceRef}|${b.availability}`).sort();
  if (JSON.stringify(declared) !== JSON.stringify(projected) ||
      d.bindings.some(b => b.availability !== 'present') ||
      r.provenance.some(b => b.authorized !== false)) return refuse('CANONICAL_MISMATCH', w);
  const ids = new Set<string>();
  const root = sanitizeNode(r.plan.root, new Set(r.plan.focusOrder), w, ids);
  if (!root || !ids.has(d.rootId) || !d.nodes.some(n => n.id === d.rootId) || r.plan.focusOrder.some(x => !ids.has(x))) return refuse('UNSAFE_RENDER', w);
  return freeze({ schema: WAVE4_PHONE_SCHEMA, status: 'ready', refusalCode: null,
    documentId: d.documentId, revision: d.revision, viewportPx: w,
    displayOnly: true, publisher: 'harness', effectInvoked: false,
    automaticRetryAllowed: false, canApproveOnPhone: false, root,
    focusOrder: freeze([...r.plan.focusOrder]),
    help: 'Read-only preview. Use your Host to review actions and reconnect safely.',
    identity: freeze({ ownerRef: p.ownerRef, worldRef: p.worldRef, deviceRef: p.deviceRef }) });
}

/** One inert, revision-scoped semantic candidate. No onIntent/send/retry callback. */
export function projectWave4PhoneEvent(input: PhoneProjectionInput, view: PhoneProjection,
  event: PhoneEvent, alreadySeenEventIds: readonly string[] = []): PhoneEventResult {
  const deny = (code: Extract<PhoneEventResult, {ok:false}>['code']): PhoneEventResult =>
    freeze({ ok: false, code, effectInvoked: false, automaticRetryAllowed: false, canApproveOnPhone: false });
  if (view.status !== 'ready') return deny('NOT_READY');
  // Re-project against CURRENT Host/pairing observations; no cached authority reuse.
  const fresh = projectWave4PhoneAdapter(input);
  if (fresh.status !== 'ready' || fresh.documentId !== view.documentId ||
      fresh.revision !== view.revision || fresh.identity?.deviceRef !== view.identity?.deviceRef)
    return deny('STALE_REVISION');
  if (!plain(event) || !id(event.eventId) || !['touch','talkback','back'].includes(event.kind) ||
      !Array.isArray(alreadySeenEventIds) || alreadySeenEventIds.length > 1024) return deny('INVALID_EVENT');
  if (alreadySeenEventIds.includes(event.eventId)) return deny('DUPLICATE_EVENT');
  if (event.kind === 'back') return freeze({ ok: true, kind: 'back-request', eventId: event.eventId,
    action: null, source: 'back', revision: view.revision!,
    effectInvoked: false, automaticRetryAllowed: false, canApproveOnPhone: false });
  if (!id(event.nodeId) || !view.focusOrder.includes(event.nodeId)) return deny('UNKNOWN_ACTION');
  const action = input.rendered.actions.find(a => a.nodeId === event.nodeId);
  if (!action) return deny('UNKNOWN_ACTION');
  // Ignore the UI's asserted privilege. Risk is pinned by the trusted Host and
  // bound to policy + exact action identity; painted UI can NEVER downgrade it.
  const pin = input.host.actionRisks.find(p => p.nodeId === action.nodeId && p.id === action.id && p.version === action.version);
  if (!pin) return deny('UNKNOWN_ACTION');
  if (pin.risk === 'R2') return deny('R2_PHONE_FORBIDDEN');
  if (pin.risk === 'R3') return deny('R3_PHONE_FORBIDDEN');
  if (event.risk !== pin.risk) return deny('RISK_MISMATCH');
  return freeze({ ok: true, kind: 'candidate', eventId: event.eventId,
    action: freeze({ id: action.id, version: action.version, nodeId: action.nodeId }),
    source: event.kind, revision: view.revision!, effectInvoked: false,
    automaticRetryAllowed: false, canApproveOnPhone: false });
}

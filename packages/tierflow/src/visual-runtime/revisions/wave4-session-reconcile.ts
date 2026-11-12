/**
 * Wave 4 D: effect-free, bounded cross-device session reconciliation.
 *
 * This is NOT a transport, publisher, second World writer or mobile KB. A trusted
 * Host-side caller supplies the already-authorized Wave 3 C read port, verified
 * principal and a sequenced publisher watermark. Notices are untrusted hints;
 * only C's durable read and F's scoped read may populate a device projection.
 * The module owns no network connection, queue, timer or durable storage.
 */
import { contentHash } from '../../ui/hash.ts';
import { UI_REVISION_PORT_SCHEMA } from './port.ts';
import type { VerifiedUiPrincipal, UiFixtureRevision, RevisionCommand, UiRevisionPort } from './port.ts';
import type { KnowledgeQuery } from '../knowledge/client.ts';
import type { ScopedFeedResult, ScopedKnowledgeFeed } from '../knowledge/wave3-feed-projection.ts';

export const WAVE4_WATERMARK_SCHEMA = 'vivim.visual-session-watermark/1' as const;
export const WAVE4_NOTICE_SCHEMA = 'vivim.visual-session-notice/1' as const;
export type ReconcileState = 'offline' | 'ready' | 'stale' | 'resnapshot-required' | 'denied' | 'unavailable';
export type ReconcileReason = 'NONE' | 'DISCONNECTED' | 'MISSING_AUTHORITY' | 'REVOKED' | 'SCOPE_CHANGED' |
  'GAP_OR_REORDER' | 'SOURCE_RESET' | 'TOMBSTONE' | 'BURST_LIMIT' | 'HEAD_MISMATCH' |
  'SOURCE_UNAVAILABLE' | 'KNOWLEDGE_UNAVAILABLE';

/** Obtained from the authenticated publisher, never copied from browser events. */
export interface SessionWatermark {
  readonly schema: typeof WAVE4_WATERMARK_SCHEMA;
  readonly ownerRef: string;
  readonly deviceRef: string;
  readonly sessionRef: string;
  readonly policyRevision: string;
  readonly documentId: string;
  readonly sequence: number;
  readonly revision: number;
  readonly documentDigest: string;
}
/** Hint-only. Extra fields (including data, grants or instructions) are refused. */
export interface SessionNotice {
  readonly schema: typeof WAVE4_NOTICE_SCHEMA;
  readonly documentId: string;
  readonly sequence: number;
  readonly revision: number;
  readonly kind: 'changed' | 'tombstone' | 'revoked' | 'source-reset';
}
export interface SessionView {
  readonly state: ReconcileState;
  readonly reason: ReconcileReason;
  readonly revision: UiFixtureRevision | null;
  /** This is F's newly authorized projection, never an offline copy. */
  readonly knowledge: ScopedFeedResult | null;
  /** Authoritative only when state is ready. */
  readonly cursor: Readonly<{ sequence: number; revision: number; documentDigest: string }> | null;
}
export interface ReconcileTelemetry {
  readonly acceptedNotices: number;
  readonly duplicateNotices: number;
  readonly rejectedNotices: number;
  readonly completedSnapshots: number;
  readonly attemptedReads: number;
  readonly pendingNotices: number;
  readonly maxPendingObserved: number;
}
export interface SessionReconcileOptions {
  readonly documentId: string;
  readonly revisionPort: Pick<UiRevisionPort, 'readCurrent' | 'getCommandOutcome'>;
  /** Trusted broker input; not a principal furnished by a phone/DOM event. */
  readonly readPrincipal: () => VerifiedUiPrincipal | null;
  /** Trusted Host/publisher read; required to anchor the event sequence. */
  readonly readWatermark: (principal: VerifiedUiPrincipal, documentId: string) => Promise<SessionWatermark> | SessionWatermark;
  /** Existing scoped F feed. No records are retained independently of this port. */
  readonly knowledgeFeed?: Pick<ScopedKnowledgeFeed, 'resnapshot' | 'clear' | 'notice'>;
  readonly knowledgeRequest?: () => KnowledgeQuery;
  /** Hard cap on hints received without a fresh authoritative snapshot (1..512). */
  readonly maxPendingNotices?: number;
  /** Synchronous bounded retries on inconsistent publisher/revision reads (1..3). */
  readonly maxSnapshotAttempts?: number;
}
export interface SessionReconciler {
  view(): SessionView;
  telemetry(): ReconcileTelemetry;
  /** Explicit transport loss immediately removes every visible cached datum. */
  disconnect(): void;
  /** Intentionally no timers or automatic send. Caller explicitly requests rejoin. */
  reconnect(): Promise<SessionView>;
  /** O(1) invalidation hint, no row data, command execution or network. */
  notice(hint: SessionNotice): 'accepted' | 'duplicate' | 'resnapshot-required' | 'denied';
  /** Read exact durable receipt after a lost ACK; NEVER retry publish/rollback. */
  resolveLostAck(operation: 'publish' | 'rollback', command: RevisionCommand):
    Readonly<{ status: 'confirmed' | 'unverified' | 'denied'; revision: UiFixtureRevision | null }>;
}

const REF = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const allowedKeys = new Set(['schema', 'documentId', 'sequence', 'revision', 'kind']);
const isRef = (v: unknown): v is string => typeof v === 'string' && REF.test(v);
const safeNatural = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const safeRevision = (v: unknown): v is number => safeNatural(v) && (v as number) > 0;
const isDigest = (v: unknown): v is string => typeof v === 'string' && DIGEST.test(v);
function copy<T>(value: T): T { return structuredClone(value); }
function principalKey(p: VerifiedUiPrincipal): string {
  return JSON.stringify([p.ownerRef, p.actorRef, p.deviceRef, p.sessionRef, p.grantRef,
    p.policyRevision, [...p.scopes].sort()]);
}
function validPrincipal(p: VerifiedUiPrincipal | null): p is VerifiedUiPrincipal {
  return !!p && [p.ownerRef, p.actorRef, p.deviceRef, p.sessionRef, p.grantRef, p.policyRevision].every(isRef) &&
    Array.isArray(p.scopes) && p.scopes.every(isRef) && p.scopes.includes('ui:read');
}
function validRevision(r: UiFixtureRevision | null, documentId: string): r is UiFixtureRevision {
  if (!r || r.schema !== UI_REVISION_PORT_SCHEMA || r.documentId !== documentId ||
    !safeRevision(r.revision) || !isDigest(r.documentDigest) || !isRef(r.actorRef) ||
    (r.operation !== 'publish' && r.operation !== 'rollback')) return false;
  try { return contentHash(r.document as Parameters<typeof contentHash>[0]) === r.documentDigest; }
  catch { return false; }
}
function validWatermark(mark: SessionWatermark, p: VerifiedUiPrincipal, id: string): boolean {
  return !!mark && mark.schema === WAVE4_WATERMARK_SCHEMA &&
    mark.ownerRef === p.ownerRef && mark.deviceRef === p.deviceRef &&
    mark.sessionRef === p.sessionRef && mark.policyRevision === p.policyRevision &&
    mark.documentId === id && safeNatural(mark.sequence) && safeRevision(mark.revision) && isDigest(mark.documentDigest);
}
function validNotice(hint: SessionNotice, id: string): boolean {
  return !!hint && typeof hint === 'object' && !Array.isArray(hint) &&
    Object.keys(hint).every(key => allowedKeys.has(key)) &&
    hint.schema === WAVE4_NOTICE_SCHEMA && hint.documentId === id &&
    safeRevision(hint.revision) && safeRevision(hint.sequence) &&
    ['changed', 'tombstone', 'revoked', 'source-reset'].includes(hint.kind);
}
function validKnowledgeQuery(q: KnowledgeQuery, id: string): boolean {
  return !!q && q.schema === 'vivim.knowledge-query/1' && q.personalWorldRef === id &&
    (q.surface === 'pc' || q.surface === 'android') &&
    ['task', 'explain', 'help'].includes(q.purpose) && Number.isSafeInteger(q.limit) && q.limit >= 1 && q.limit <= 50;
}

export function createWave4SessionReconciler(options: SessionReconcileOptions): SessionReconciler {
  if (!options || !isRef(options.documentId) ||
    !options.revisionPort || typeof options.revisionPort.readCurrent !== 'function' ||
    typeof options.revisionPort.getCommandOutcome !== 'function' ||
    typeof options.readPrincipal !== 'function' || typeof options.readWatermark !== 'function' ||
    (!!options.knowledgeFeed !== !!options.knowledgeRequest)) {
    throw new TypeError('Trusted revision reader, principal, watermark and paired F ports are required');
  }
  const maxPending = options.maxPendingNotices ?? 256;
  const maxAttempts = options.maxSnapshotAttempts ?? 2;
  if (!Number.isSafeInteger(maxPending) || maxPending < 1 || maxPending > 512 ||
      !Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 3) throw new RangeError('Unbounded reconciliation limits');

  let generation = 0;
  let state: ReconcileState = 'offline';
  let reason: ReconcileReason = 'DISCONNECTED';
  let revision: UiFixtureRevision | null = null;
  let knowledge: ScopedFeedResult | null = null;
  let anchor: { sequence: number; revision: number; digest: string } | null = null;
  let lastNotice = '';
  let activeScope: string | null = null;
  let blockedScope: string | null = null;
  let pending = 0;
  let announcedRevision = 0;
  let accepted = 0, duplicates = 0, rejected = 0, snapshots = 0, reads = 0, highWater = 0;

  function emptyView(): SessionView {
    // Rendering is also an authorization boundary: never show last-known-granted
    // data after the broker has revoked a grant, even without an incoming notice.
    if (state === 'ready' && activeScope) {
      const identity = principal();
      if (!identity || identity.key !== activeScope) invalidate('denied', 'SCOPE_CHANGED');
      else {
        const head = readCurrent(identity.value);
        if (head.denied) invalidate('denied', 'MISSING_AUTHORITY');
        else if (!head.revision) invalidate('unavailable', 'SOURCE_UNAVAILABLE');
        else if (!revision || head.revision.revision !== revision.revision || head.revision.documentDigest !== revision.documentDigest)
          invalidate('resnapshot-required', 'HEAD_MISMATCH');
      }
    }
    const current = state === 'ready' && revision !== null && anchor !== null;
    const currentAnchor = current ? anchor : null;
    return {
      state, reason,
      revision: current ? copy(revision) : null,
      knowledge: current && knowledge ? copy(knowledge) : null,
      cursor: currentAnchor ? { sequence: currentAnchor.sequence, revision: currentAnchor.revision, documentDigest: currentAnchor.digest } : null,
    };
  }
  function invalidate(next: ReconcileState, why: ReconcileReason): void {
    generation++;
    state = next; reason = why;
    revision = null; knowledge = null;
    if (next !== 'stale') { anchor = null; activeScope = null; pending = 0; announcedRevision = 0; lastNotice = ''; }
    options.knowledgeFeed?.clear();
  }
  function principal(): { value: VerifiedUiPrincipal; key: string } | null {
    let p: VerifiedUiPrincipal | null;
    try { p = options.readPrincipal(); } catch { return null; }
    return validPrincipal(p) ? { value: p, key: principalKey(p) } : null;
  }
  function samePrincipal(key: string): boolean { return principal()?.key === key; }
  function readCurrent(p: VerifiedUiPrincipal): { revision: UiFixtureRevision | null; denied: boolean } {
    reads++;
    try {
      const result = options.revisionPort.readCurrent(p, options.documentId);
      if (!result.ok) return { revision: null, denied: result.code === 'FORBIDDEN' };
      return { revision: validRevision(result.value, options.documentId) ? result.value : null, denied: false };
    } catch { return { revision: null, denied: false }; }
  }
  async function reconnect(): Promise<SessionView> {
    invalidate('resnapshot-required', 'DISCONNECTED');
    const myGeneration = generation;
    const identity = principal();
    if (!identity) { invalidate('denied', 'MISSING_AUTHORITY'); return emptyView(); }
    if (blockedScope === identity.key) { invalidate('denied', 'REVOKED'); return emptyView(); }
    // A new grant/policy can lift the local revocation latch, never a hint or stale cache.
    blockedScope = null;
    let error: ReconcileReason = 'SOURCE_UNAVAILABLE';
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (generation !== myGeneration) return emptyView();
      if (!samePrincipal(identity.key)) { invalidate('denied', 'SCOPE_CHANGED'); return emptyView(); }
      let mark: SessionWatermark;
      try { mark = await options.readWatermark(identity.value, options.documentId); }
      catch { error = 'SOURCE_UNAVAILABLE'; continue; }
      if (generation !== myGeneration) return emptyView();
      if (!validWatermark(mark, identity.value, options.documentId)) { invalidate('denied', 'MISSING_AUTHORITY'); return emptyView(); }
      const read = readCurrent(identity.value);
      if (read.denied) { invalidate('denied', 'MISSING_AUTHORITY'); return emptyView(); }
      const head = read.revision;
      if (!head) { error = 'SOURCE_UNAVAILABLE'; continue; }
      if (head.revision !== mark.revision || head.documentDigest !== mark.documentDigest) { error = 'HEAD_MISMATCH'; continue; }
      let freshKnowledge: ScopedFeedResult | null = null;
      if (options.knowledgeFeed && options.knowledgeRequest) {
        let request: KnowledgeQuery;
        try { request = options.knowledgeRequest(); }
        catch { invalidate('denied', 'MISSING_AUTHORITY'); return emptyView(); }
        if (!validKnowledgeQuery(request, options.documentId)) { invalidate('denied', 'MISSING_AUTHORITY'); return emptyView(); }
        try { freshKnowledge = await options.knowledgeFeed.resnapshot(request); }
        catch { error = 'KNOWLEDGE_UNAVAILABLE'; continue; }
        if (generation !== myGeneration) return emptyView();
        if (freshKnowledge.state === 'denied') { invalidate('denied', 'MISSING_AUTHORITY'); return emptyView(); }
        if (freshKnowledge.state !== 'ready' && freshKnowledge.state !== 'partial') { error = 'KNOWLEDGE_UNAVAILABLE'; continue; }
      }
      if (!samePrincipal(identity.key)) { invalidate('denied', 'SCOPE_CHANGED'); return emptyView(); }
      const confirmedRead = readCurrent(identity.value);
      if (confirmedRead.denied) { invalidate('denied', 'MISSING_AUTHORITY'); return emptyView(); }
      const confirmed = confirmedRead.revision;
      if (!confirmed || confirmed.revision !== head.revision || confirmed.documentDigest !== head.documentDigest) {
        error = 'HEAD_MISMATCH'; continue;
      }
      if (generation !== myGeneration) return emptyView();
      revision = copy(confirmed); knowledge = freshKnowledge ? copy(freshKnowledge) : null;
      anchor = { sequence: mark.sequence, revision: mark.revision, digest: mark.documentDigest };
      announcedRevision = mark.revision;
      activeScope = identity.key; pending = 0; lastNotice = '';
      state = 'ready'; reason = 'NONE'; snapshots++;
      return emptyView();
    }
    invalidate('unavailable', error);
    return emptyView();
  }
  function notice(hint: SessionNotice): ReturnType<SessionReconciler['notice']> {
    if (state === 'denied') { rejected++; return 'denied'; }
    if ((state !== 'ready' && state !== 'stale') || !anchor || !activeScope) {
      rejected++;
      // In-flight snapshots must not win against a notice received during rejoin.
      // The caller must initiate a fresh, sequenced publisher resnapshot.
      if (state === 'resnapshot-required') generation++;
      return 'resnapshot-required';
    }
    const identity = principal();
    if (!identity || identity.key !== activeScope) {
      rejected++; invalidate('denied', 'SCOPE_CHANGED'); return 'denied';
    }
    if (!validNotice(hint, options.documentId)) {
      rejected++; invalidate('resnapshot-required', 'GAP_OR_REORDER'); return 'resnapshot-required';
    }
    const signature = `${hint.sequence}:${hint.revision}:${hint.kind}`;
    if (hint.sequence === anchor.sequence && signature === lastNotice) { duplicates++; return 'duplicate'; }
    if (hint.sequence !== anchor.sequence + 1 || hint.revision < announcedRevision ||
        hint.revision > announcedRevision + 1) {
      rejected++; invalidate('resnapshot-required', 'GAP_OR_REORDER'); return 'resnapshot-required';
    }
    anchor.sequence = hint.sequence;
    announcedRevision = hint.revision;
    lastNotice = signature;
    accepted++;
    if (hint.kind === 'revoked') {
      blockedScope = activeScope;
      invalidate('denied', 'REVOKED'); return 'denied';
    }
    if (hint.kind === 'tombstone' || hint.kind === 'source-reset') {
      invalidate('resnapshot-required', hint.kind === 'tombstone' ? 'TOMBSTONE' : 'SOURCE_RESET');
      return 'resnapshot-required';
    }
    // A notice only invalidates paint; no hint is ever considered a verified revision.
    if (state === 'ready') options.knowledgeFeed?.clear();
    state = 'stale'; reason = 'NONE'; revision = null; knowledge = null;
    pending++; highWater = Math.max(highWater, pending);
    if (pending >= maxPending) { invalidate('resnapshot-required', 'BURST_LIMIT'); return 'resnapshot-required'; }
    return 'accepted';
  }
  function resolveLostAck(operation: 'publish' | 'rollback', command: RevisionCommand): ReturnType<SessionReconciler['resolveLostAck']> {
    const identity = principal();
    if (!identity || !activeScope || identity.key !== activeScope || blockedScope === identity.key ||
      (state !== 'ready' && state !== 'stale')) return { status: 'denied', revision: null };
    if ((operation !== 'publish' && operation !== 'rollback') || !command ||
      command.documentId !== options.documentId || !isRef(command.commandId) || !safeNatural(command.expectedRevision)) {
      return { status: 'unverified', revision: null };
    }
    try {
      const result = options.revisionPort.getCommandOutcome(identity.value, operation, command);
      if (!samePrincipal(identity.key)) { invalidate('denied', 'SCOPE_CHANGED'); return { status: 'denied', revision: null }; }
      if (!result.ok || !validRevision(result.value, options.documentId) ||
        result.value.revision !== command.expectedRevision + 1) return { status: 'unverified', revision: null };
      return { status: 'confirmed', revision: copy(result.value) };
    } catch { return { status: 'unverified', revision: null }; }
  }
  return {
    view: emptyView,
    telemetry: () => ({ acceptedNotices: accepted, duplicateNotices: duplicates, rejectedNotices: rejected,
      completedSnapshots: snapshots, attemptedReads: reads, pendingNotices: pending, maxPendingObserved: highWater }),
    disconnect: () => invalidate('offline', 'DISCONNECTED'),
    reconnect, notice, resolveLostAck,
  };
}

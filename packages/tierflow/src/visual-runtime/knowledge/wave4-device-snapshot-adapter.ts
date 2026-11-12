/**
 * Wave 4 F — inert, device-scoped view of the SAME canonical Wave 3 KB feed.
 *
 * This is not a source adapter, grant broker, local KB, durable cache or event
 * subscriber. A trusted broker and source-enforcing KnowledgeClient must be
 * supplied by the Host integration owner. Never expose an unscoped page here.
 */
import type { KnowledgeQuery, TrustedKnowledgeBroker, TrustedKnowledgeContext } from './client.ts';
import type { ScopedFeedCard, ScopedFeedResult, ScopedKnowledgeFeed, SourceFeedNotice } from './wave3-feed-projection.ts';

export const DEVICE_KNOWLEDGE_SNAPSHOT_SCHEMA = 'vivim.device-knowledge-snapshot/1' as const;
export type DeviceKnowledgeSurface = 'pc' | 'android';
export type DeviceSnapshotState = ScopedFeedResult['state'];

/** Canonical identity and source facts survive projection, without authority handles. */
export interface DeviceKnowledgeCard {
  readonly stableId: string;
  readonly projectRef: string;
  readonly kind: string;
  readonly title: string;
  readonly summary: string;
  readonly statusLabel: string;
  readonly provenanceLabel: string;
  readonly sourceVersion: string;
  readonly asOf: string;
  readonly availability: ScopedFeedCard['availability'];
  readonly claimStatus: ScopedFeedCard['claimStatus'];
  readonly freshness: 'current' | 'stale';
  readonly source: Readonly<ScopedFeedCard['source']>;
  readonly evidenceRefs: readonly string[];
  readonly provenance: readonly string[];
  readonly interactive: false;
}

/** The same envelope covers PC and Android. Empty outcomes never disclose scope. */
export interface DeviceKnowledgeSnapshot {
  readonly schema: typeof DEVICE_KNOWLEDGE_SNAPSHOT_SCHEMA;
  readonly state: DeviceSnapshotState;
  readonly reason: ScopedFeedResult['reason'];
  readonly cards: readonly DeviceKnowledgeCard[];
  /** Empty after revocation/offline; no privileged deleted-ID side channel. */
  readonly removedStableIds: readonly string[];
  readonly projectionRevision: string | null;
  readonly asOf: string | null;
  readonly expiresAt: string | null;
  readonly nextCursor?: string;
  /** Consumers MUST replace/purge prior cards, including on any empty result. */
  readonly replace: boolean;
  readonly retainOffline: false;
}
export interface DeviceSnapshotAdapter {
  poll(query: KnowledgeQuery): Promise<DeviceKnowledgeSnapshot>;
  resnapshot(query: KnowledgeQuery): Promise<DeviceKnowledgeSnapshot>;
  notice(hint: SourceFeedNotice): void;
  /** Called on logout, detach, revoke and unmount; never publishes cached rows. */
  clear(): void;
}
export interface DeviceSnapshotOptions {
  /** This is a trusted shell binding, never taken from request JSON. */
  readonly surface: DeviceKnowledgeSurface;
  readonly now?: () => number;
  /** Freshness of the *projection response*, not its underlying source facts. */
  readonly maxProjectionAgeMs?: number;
  /** Age above which an observed item is explicitly marked stale. */
  readonly maxEvidenceAgeMs?: number;
  readonly maxCards?: number;
}

const REF = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const KIND = /^[a-z][a-z0-9_-]{0,47}$/;
const MAX_CARDS = 50;
const MAX_EVIDENCE = 16;
const MAX_TEXT = 512;
const MAX_QUERY = 256;
const MAX_PROJECTION_AGE = 60_000;
const MAX_EVIDENCE_AGE = 86_400_000;
const FUTURE_SKEW = 5_000;
const QUERY_FIELDS = new Set(['schema', 'requestId', 'personalWorldRef', 'purpose', 'surface', 'query', 'entityRef', 'kinds', 'limit', 'cursor']);
const PROTOCOL = /(?:javascript|vbscript|data)\s*:/i;
const ACTIVE_MARKUP = /(?:<|&lt;)\s*\/?\s*(?:script|iframe|img|svg|object|embed)\b/i;
const REFUSAL: Readonly<Record<'denied' | 'unavailable' | 'resnapshot-required', ScopedFeedResult['reason']>> = {
  denied: 'ACCESS_DENIED', unavailable: 'SOURCE_UNAVAILABLE', 'resnapshot-required': 'RESNAPSHOT_REQUIRED',
};
function validRef(value: unknown): value is string { return typeof value === 'string' && REF.test(value); }
function safeText(value: unknown, max = MAX_TEXT, allowEmpty = false): value is string {
  return typeof value === 'string' && (allowEmpty || value.length > 0) && value.length <= max
    && !/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/.test(value) && !PROTOCOL.test(value) && !ACTIVE_MARKUP.test(value);
}
function validTime(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}
function validQuery(input: KnowledgeQuery, surface: DeviceKnowledgeSurface): boolean {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  if (Object.keys(input).some(k => !QUERY_FIELDS.has(k))) return false;
  if (input.schema !== 'vivim.knowledge-query/1' || !validRef(input.requestId) || !validRef(input.personalWorldRef)) return false;
  if (input.surface !== surface || !['task', 'explain', 'help'].includes(input.purpose)) return false;
  if (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > MAX_CARDS) return false;
  if (input.query !== undefined && (typeof input.query !== 'string' || input.query.length > MAX_QUERY || !input.query.trim())) return false;
  if (input.entityRef !== undefined && !validRef(input.entityRef)) return false;
  if (input.query === undefined && input.entityRef === undefined) return false;
  if (input.cursor !== undefined && !validRef(input.cursor)) return false;
  if (input.kinds !== undefined && (!Array.isArray(input.kinds) || input.kinds.length < 1 || input.kinds.length > 8
    || input.kinds.some(k => typeof k !== 'string' || !KIND.test(k)) || new Set(input.kinds).size !== input.kinds.length)) return false;
  return true;
}
function validScope(ctx: TrustedKnowledgeContext | null, query: KnowledgeQuery, now: number, surface: DeviceKnowledgeSurface): ctx is TrustedKnowledgeContext {
  return !!ctx && validRef(ctx.ownerRef) && validRef(ctx.sessionRef) && validRef(ctx.deviceRef)
    && validRef(ctx.personalWorldRef) && validRef(ctx.policyRevision)
    && ctx.surface === surface && query.surface === surface && ctx.personalWorldRef === query.personalWorldRef
    && Array.isArray(ctx.allowedPurposes) && ctx.allowedPurposes.includes(query.purpose)
    && typeof ctx.allowPhoneS1 === 'boolean' && ctx.revoked === false && ctx.offline === false
    && Number.isFinite(ctx.sessionExpiresAt) && Number.isFinite(ctx.grantExpiresAt)
    && ctx.sessionExpiresAt > now && ctx.grantExpiresAt > now;
}
function signature(ctx: TrustedKnowledgeContext): string {
  return JSON.stringify([ctx.ownerRef, ctx.sessionRef, ctx.deviceRef, ctx.personalWorldRef, ctx.surface,
    ctx.policyRevision, ctx.sessionExpiresAt, ctx.grantExpiresAt,
    [...ctx.allowedPurposes].sort(), ctx.allowPhoneS1, ctx.maySeeRedactedMarkers === true]);
}
function blank(state: 'denied' | 'unavailable' | 'resnapshot-required'): DeviceKnowledgeSnapshot {
  // No timestamps, IDs, policy revisions, cursors or count of inaccessible rows.
  return { schema: DEVICE_KNOWLEDGE_SNAPSHOT_SCHEMA, state, reason: REFUSAL[state], cards: [],
    removedStableIds: [], projectionRevision: null, asOf: null, expiresAt: null,
    replace: true, retainOffline: false };
}
function toCard(card: ScopedFeedCard, now: number, evidenceAge: number): DeviceKnowledgeCard | null {
  if (!validRef(card.stableId) || !validRef(card.projectRef) || !safeText(card.kind)
    || !safeText(card.title) || !safeText(card.summary, MAX_TEXT, true) || !safeText(card.statusLabel)
    || !safeText(card.provenanceLabel) || !safeText(card.sourceVersion) || !validTime(card.asOf)
    || card.interactive !== false || card.sensitivity !== 'enforced-upstream-not-disclosed'
    || !['present', 'stale', 'unknown', 'unavailable'].includes(card.availability)
    || !['observed', 'proposed', 'confirmed', 'conflicted', 'retracted'].includes(card.claimStatus)) return null;
  const src = card.source;
  if (!src || !validRef(src.authority) || !safeText(src.nativeId, 256)
    || !safeText(src.nativeVersion, 256) || !safeText(src.digest, 256)
    || src.nativeVersion !== card.sourceVersion) return null;
  if (!Array.isArray(card.evidenceRefs) || card.evidenceRefs.length < 1 || card.evidenceRefs.length > MAX_EVIDENCE
    || !card.evidenceRefs.every(x => safeText(x, 256))) return null;
  if (!Array.isArray(card.provenance) || card.provenance.length < 1 || card.provenance.length > MAX_EVIDENCE
    || !card.provenance.every(x => safeText(x, 256))) return null;
  const time = Date.parse(card.asOf);
  if (time > now + FUTURE_SKEW) return null;
  const freshness = card.availability !== 'present' || now - time > evidenceAge ? 'stale' : 'current';
  // Strict allowlist: never spread untrusted card fields or pass action handles.
  return Object.freeze({
    stableId: card.stableId, projectRef: card.projectRef, kind: card.kind,
    title: card.title, summary: card.summary, statusLabel: card.statusLabel,
    provenanceLabel: card.provenanceLabel, sourceVersion: card.sourceVersion,
    asOf: card.asOf, availability: card.availability, claimStatus: card.claimStatus,
    freshness, source: Object.freeze({ authority: src.authority, nativeId: src.nativeId,
      nativeVersion: src.nativeVersion, digest: src.digest }),
    evidenceRefs: Object.freeze([...card.evidenceRefs]),
    provenance: Object.freeze([...card.provenance]), interactive: false as const,
  });
}

/**
 * Construct ONCE per trusted device session, with a Wave 3 feed bound to that
 * device's broker. Caller MUST never reuse a feed across devices, and must
 * purge UI-held cards on blank snapshots, logout, disconnect and expiry.
 */
export function createDeviceKnowledgeSnapshotAdapter(
  feed: ScopedKnowledgeFeed,
  broker: TrustedKnowledgeBroker,
  options: DeviceSnapshotOptions,
): DeviceSnapshotAdapter {
  if (!feed || typeof feed.poll !== 'function' || typeof feed.resnapshot !== 'function'
    || typeof feed.notice !== 'function' || typeof feed.clear !== 'function'
    || !broker || typeof broker.readContext !== 'function'
    || !options || !['pc', 'android'].includes(options.surface)) throw new TypeError('trusted scoped device feed required');
  const now = options.now ?? Date.now;
  const age = options.maxProjectionAgeMs ?? MAX_PROJECTION_AGE;
  const evidenceAge = options.maxEvidenceAgeMs ?? MAX_EVIDENCE_AGE;
  const maxCards = options.maxCards ?? MAX_CARDS;
  if (!Number.isSafeInteger(age) || age < 1 || age > MAX_PROJECTION_AGE
    || !Number.isSafeInteger(evidenceAge) || evidenceAge < 1
    || !Number.isSafeInteger(maxCards) || maxCards < 1 || maxCards > MAX_CARDS) throw new TypeError('invalid snapshot bounds');
  let epoch = 0;
  let boundIdentity: string | null = null;
  function identity(ctx: TrustedKnowledgeContext): string {
    return JSON.stringify([ctx.ownerRef, ctx.sessionRef, ctx.deviceRef, ctx.personalWorldRef, ctx.surface]);
  }
  function context(): TrustedKnowledgeContext | null {
    try { return broker.readContext(); } catch { return null; }
  }
  function purge(): void { epoch++; feed.clear(); }
  async function read(query: KnowledgeQuery, replace: boolean): Promise<DeviceKnowledgeSnapshot> {
    const start = now();
    const before = context();
    if (!validQuery(query, options.surface) || !validScope(before, query, start, options.surface)
      || query.limit > maxCards) { purge(); return blank('denied'); }
    const principal = identity(before);
    if (boundIdentity !== null && boundIdentity !== principal) { purge(); return blank('denied'); }
    if (boundIdentity === null) boundIdentity = principal;
    const initial = signature(before);
    const readEpoch = ++epoch;
    let result: ScopedFeedResult;
    try { result = await (replace ? feed.resnapshot(query) : feed.poll(query)); }
    catch { if (readEpoch === epoch) purge(); return blank('unavailable'); }
    const completed = now();
    const after = context();
    if (readEpoch !== epoch || !validScope(after, query, completed, options.surface)
      || signature(after) !== initial) { if (readEpoch === epoch) purge(); return blank('denied'); }
    if (result.state === 'denied' || result.state === 'unavailable' || result.state === 'resnapshot-required') {
      // Keep the source feed's gap marker intact for a subsequent resnapshot.
      if (result.state !== 'resnapshot-required') purge();
      return blank(result.state);
    }
    if (!['ready', 'partial'].includes(result.state) || result.reason !== 'NONE'
      || !validRef(result.projectionRevision) || !validTime(result.asOf)
      || Date.parse(result.asOf) > completed + FUTURE_SKEW
      || completed - Date.parse(result.asOf) > age || start > completed + FUTURE_SKEW
      || !Array.isArray(result.cards) || result.cards.length > Math.min(maxCards, query.limit)
      || !Array.isArray(result.removedStableIds) || result.removedStableIds.length > maxCards
      || !result.removedStableIds.every(validRef)
      || (result.nextCursor !== undefined && !validRef(result.nextCursor))) {
      purge(); return blank('unavailable');
    }
    const cards = result.cards.map(c => toCard(c, completed, evidenceAge));
    if (cards.some(c => c === null)) { purge(); return blank('unavailable'); }
    const safeCards = cards as DeviceKnowledgeCard[];
    if (new Set(safeCards.map(c => c.stableId)).size !== safeCards.length
      || result.removedStableIds.some(id => safeCards.some(c => c.stableId === id))) {
      purge(); return blank('unavailable');
    }
    const expires = Math.min(completed + age, after.sessionExpiresAt, after.grantExpiresAt);
    if (expires <= completed) { purge(); return blank('denied'); }
    const partial = result.state === 'partial' || safeCards.some(c => c.freshness === 'stale');
    return Object.freeze({ schema: DEVICE_KNOWLEDGE_SNAPSHOT_SCHEMA,
      state: partial ? 'partial' as const : 'ready' as const, reason: 'NONE' as const,
      cards: Object.freeze(safeCards),
      removedStableIds: Object.freeze([...result.removedStableIds]),
      projectionRevision: result.projectionRevision, asOf: result.asOf,
      expiresAt: new Date(expires).toISOString(),
      ...(result.nextCursor ? { nextCursor: result.nextCursor } : {}),
      replace, retainOffline: false as const });
  }
  return {
    poll: query => read(query, false),
    resnapshot: query => read(query, true),
    notice(hint) { epoch++; feed.notice(hint); },
    clear: purge,
  };
}

/**
 * Wave 3 F: read-only scoped KB projection and bounded invalidation/delta adapter.
 * The supplied KnowledgeClient and trusted broker are the ONLY read/authorization
 * boundary. Signals are untrusted *invalidation hints*, never data or permission.
 * No persistence, KB writes, live transport, action handles or implicit retries.
 */
import {
  KNOWLEDGE_QUERY_SCHEMA,
  type KnowledgeClient,
  type KnowledgeItem,
  type KnowledgePage,
  type KnowledgeQuery,
  type TrustedKnowledgeBroker,
  type TrustedKnowledgeContext,
} from './client.ts';
import { projectKnowledgePage, type KnowledgeCard } from './projection.ts';

export interface ScopedFeedCard extends KnowledgeCard {
  readonly projectRef: string;
  readonly availability: 'present' | 'stale' | 'unknown' | 'unavailable';
  readonly claimStatus: KnowledgeItem['claimStatus'];
  /** Read port does not expose S0–S3; authorization remains upstream. */
  readonly sensitivity: 'enforced-upstream-not-disclosed';
  readonly source: Readonly<KnowledgeItem['source']>;
  readonly evidenceRefs: readonly string[];
  readonly provenance: readonly string[];
}
export interface ScopedFeedChange {
  readonly kind: 'added' | 'updated';
  readonly card: ScopedFeedCard;
}
export interface ScopedFeedResult {
  readonly state: 'ready' | 'partial' | 'denied' | 'unavailable' | 'resnapshot-required';
  readonly cards: readonly ScopedFeedCard[];
  readonly changes: readonly ScopedFeedChange[];
  readonly removedStableIds: readonly string[];
  readonly projectionRevision: string | null;
  readonly asOf: string | null;
  readonly reason: 'NONE' | 'ACCESS_DENIED' | 'SOURCE_UNAVAILABLE' | 'RESNAPSHOT_REQUIRED';
  readonly nextCursor?: string;
}
export type SourceFeedNotice = Readonly<{
  sequence: number;
  kind: 'changed' | 'tombstone' | 'source-reset' | 'revoked';
}>;
export interface ScopedKnowledgeFeed {
  /** Always re-reads the authorized upstream client, never serves stored cards. */
  poll(request: KnowledgeQuery): Promise<ScopedFeedResult>;
  /** Explicit full read after a gap, tombstone, source restart or revocation. */
  resnapshot(request: KnowledgeQuery): Promise<ScopedFeedResult>;
  /** Untrusted notice can only invalidate, never insert or delete a KB record. */
  notice(hint: SourceFeedNotice): void;
  /** Forget ephemeral comparison state (e.g. logout or component teardown). */
  clear(): void;
}

const MAX_PAGE = 50;
const MAX_EVIDENCE = 16;
const MAX_TEXT = 512;
const REF = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const EMPTY: readonly ScopedFeedCard[] = Object.freeze([]);
function empty(state: ScopedFeedResult['state']): ScopedFeedResult {
  return {
    state, cards: EMPTY, changes: [], removedStableIds: [], projectionRevision: null, asOf: null,
    reason: state === 'denied' ? 'ACCESS_DENIED' : state === 'resnapshot-required' ? 'RESNAPSHOT_REQUIRED' : 'SOURCE_UNAVAILABLE',
  };
}
function validRef(value: unknown): value is string { return typeof value === 'string' && REF.test(value); }
function validContext(ctx: TrustedKnowledgeContext | null, request: KnowledgeQuery, now: number): ctx is TrustedKnowledgeContext {
  return !!ctx && validRef(ctx.ownerRef) && validRef(ctx.sessionRef) && validRef(ctx.deviceRef)
    && validRef(ctx.personalWorldRef) && validRef(ctx.policyRevision)
    && Number.isFinite(ctx.sessionExpiresAt) && Number.isFinite(ctx.grantExpiresAt)
    && ctx.sessionExpiresAt > now && ctx.grantExpiresAt > now && ctx.revoked === false
    && ctx.personalWorldRef === request.personalWorldRef && ctx.surface === request.surface
    && Array.isArray(ctx.allowedPurposes) && ctx.allowedPurposes.includes(request.purpose);
}
function scopeKey(ctx: TrustedKnowledgeContext): string {
  return JSON.stringify([
    ctx.ownerRef, ctx.sessionRef, ctx.deviceRef, ctx.personalWorldRef, ctx.surface,
    ctx.policyRevision, ctx.sessionExpiresAt, ctx.grantExpiresAt,
    [...ctx.allowedPurposes].sort(), ctx.allowPhoneS1, ctx.maySeeRedactedMarkers === true,
  ]);
}
function queryKey(req: KnowledgeQuery): string {
  return JSON.stringify([req.personalWorldRef, req.purpose, req.surface, req.query, req.entityRef, req.kinds, req.limit, req.cursor ?? null]);
}
function validRequest(req: KnowledgeQuery): boolean {
  return !!req && req.schema === KNOWLEDGE_QUERY_SCHEMA && validRef(req.requestId)
    && validRef(req.personalWorldRef) && ['pc', 'android', 'wiki'].includes(req.surface)
    && ['task', 'explain', 'help'].includes(req.purpose)
    && Number.isInteger(req.limit) && req.limit >= 1 && req.limit <= MAX_PAGE
    && (req.cursor === undefined || validRef(req.cursor));
}
function plain(s: string): string {
  return s.slice(0, MAX_TEXT).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c] ?? '');
}
function validEvidence(item: KnowledgeItem): boolean {
  if (!validRef(item.stableId) || !validRef(item.projectRef) || item.visibility !== 'visible') return false;
  if (typeof item.kind !== 'string' || typeof item.label !== 'string' || typeof item.summary !== 'string'
    || item.kind.length > MAX_TEXT || item.label.length > MAX_TEXT || item.summary.length > 4096) return false;
  if (!['present', 'stale', 'unknown', 'unavailable'].includes(item.availability)) return false;
  if (!['observed', 'proposed', 'confirmed', 'conflicted', 'retracted'].includes(item.claimStatus)) return false;
  const source = item.source;
  if (!source || ![source.authority, source.nativeId, source.nativeVersion, source.digest].every(s => typeof s === 'string' && s.length > 0 && s.length <= 256)) return false;
  if (!Array.isArray(item.evidenceRefs) || item.evidenceRefs.length < 1 || item.evidenceRefs.length > MAX_EVIDENCE
    || !item.evidenceRefs.every(s => typeof s === 'string' && s.length > 0 && s.length <= 256)) return false;
  if (!Array.isArray(item.provenance) || item.provenance.length < 1 || item.provenance.length > MAX_EVIDENCE
    || !item.provenance.every(s => typeof s === 'string' && s.length > 0 && s.length <= 256)) return false;
  return typeof item.asOf === 'string' && Number.isFinite(Date.parse(item.asOf));
}
function validatePage(page: KnowledgePage, limit: number): boolean {
  if (!page || page.schema !== 'vivim.knowledge-result/1' || !['ok', 'partial'].includes(page.status)) return false;
  if (!Array.isArray(page.items) || page.items.length > limit || !validRef(page.projectionRevision)) return false;
  if (!page.items.every(validEvidence)) return false;
  if (new Set(page.items.map(item => item.stableId)).size !== page.items.length) return false;
  if (page.nextCursor !== undefined && !validRef(page.nextCursor)) return false;
  return typeof page.asOf === 'string' && Number.isFinite(Date.parse(page.asOf));
}
function project(page: KnowledgePage): readonly ScopedFeedCard[] | null {
  const visual = projectKnowledgePage(page); // Existing Wave 2 inert/escaped projection.
  if (visual.cards.length !== page.items.length || (visual.state !== 'ready' && visual.state !== 'partial')) return null;
  const byId = new Map(page.items.map(item => [item.stableId, item] as const));
  return visual.cards.map(card => {
    const item = byId.get(card.stableId)!;
    return Object.freeze({
      ...card, projectRef: plain(item.projectRef), availability: item.availability as ScopedFeedCard['availability'],
      claimStatus: item.claimStatus, sensitivity: 'enforced-upstream-not-disclosed' as const,
      source: Object.freeze({ authority: plain(item.source.authority), nativeId: plain(item.source.nativeId), nativeVersion: plain(item.source.nativeVersion), digest: plain(item.source.digest) }),
      evidenceRefs: Object.freeze(item.evidenceRefs.map(plain)),
      provenance: Object.freeze(item.provenance.map(plain)),
    });
  });
}

/** Broker must be authenticated and KnowledgeClient must itself enforce row-level scopes. */
export function createScopedKnowledgeFeed(
  client: KnowledgeClient,
  broker: TrustedKnowledgeBroker,
  options: Readonly<{ now?: () => number }> = {},
): ScopedKnowledgeFeed {
  if (!client || typeof client.query !== 'function' || !broker || typeof broker.readContext !== 'function') throw new TypeError('read-only knowledge client and trusted broker required');
  const now = options.now ?? Date.now;
  let generation = 0;
  let last: { scope: string; query: string; cards: readonly ScopedFeedCard[] } | null = null;
  let sequence = 0;
  let needsResnapshot = false;
  function forget(): void { generation++; last = null; }
  async function read(request: KnowledgeQuery, explicitSnapshot: boolean): Promise<ScopedFeedResult> {
    if (needsResnapshot && !explicitSnapshot) return empty('resnapshot-required');
    const before = broker.readContext();
    if (!validRequest(request) || !validContext(before, request, now())) { forget(); return empty('denied'); }
    if (before.offline) { forget(); return empty('unavailable'); }
    const scope = scopeKey(before);
    const filter = queryKey(request);
    if (last && (last.scope !== scope || last.query !== filter)) last = null;
    // Existing snapshots remain inaccessible; used ONLY to calculate a fresh delta.
    const thisGeneration = ++generation;
    let page: KnowledgePage;
    try { page = await client.query(request); }
    catch { forget(); return empty('unavailable'); }
    const after = broker.readContext();
    if (generation !== thisGeneration) return empty('denied'); // superseded: do not erase newer authorized result
    if (!validContext(after, request, now()) || after.offline || scopeKey(after) !== scope) {
      forget(); return empty('denied');
    }
    if (page.status === 'denied') { forget(); return empty('denied'); }
    if (page.status === 'unavailable') { forget(); return empty('unavailable'); }
    if (!validatePage(page, request.limit)) { forget(); return empty('unavailable'); }
    const cards = project(page);
    if (!cards) { forget(); return empty('unavailable'); }
    const previous = !explicitSnapshot && last && last.scope === scope && last.query === filter ? last.cards : [];
    const prior = new Map(previous.map(card => [card.stableId, card] as const));
    const current = new Set(cards.map(card => card.stableId));
    const changes: ScopedFeedChange[] = [];
    for (const card of cards) {
      const old = prior.get(card.stableId);
      if (!old || JSON.stringify(old) !== JSON.stringify(card)) changes.push({ kind: old ? 'updated' : 'added', card });
    }
    const removedStableIds = previous.filter(card => !current.has(card.stableId)).map(card => card.stableId);
    // Every list above is bounded by the validated limit <= 50; never persist it.
    last = { scope, query: filter, cards };
    needsResnapshot = false;
    return {
      state: page.status === 'partial' ? 'partial' : 'ready', cards, changes,
      removedStableIds, projectionRevision: page.projectionRevision, asOf: page.asOf,
      reason: 'NONE', ...(page.nextCursor ? { nextCursor: page.nextCursor } : {}),
    };
  }
  return {
    poll: request => read(request, false),
    resnapshot: request => { forget(); return read(request, true); },
    notice(hint): void {
      // Never accept a signal as a row update or a scope grant. Fail closed on gaps.
      const valid = hint && Number.isSafeInteger(hint.sequence) && hint.sequence > 0
        && ['changed', 'tombstone', 'source-reset', 'revoked'].includes(hint.kind);
      if (!valid || hint.sequence !== sequence + 1) {
        if (valid && hint.sequence > sequence) sequence = hint.sequence; // stale earlier notices cannot resume a gapped feed
        forget(); needsResnapshot = true; return;
      }
      sequence = hint.sequence;
      if (hint.kind !== 'changed') { forget(); needsResnapshot = true; }
      else generation++; // In-flight reads are invalid; following poll must re-query.
    },
    clear(): void { forget(); sequence = 0; needsResnapshot = false; },
  };
}

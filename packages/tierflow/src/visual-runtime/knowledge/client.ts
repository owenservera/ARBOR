/** KnowledgeClient/1 — isolated read-only fixture. No KB/Host/network imports or writes. */
export const KNOWLEDGE_QUERY_SCHEMA = 'vivim.knowledge-query/1' as const;
export const KNOWLEDGE_RESULT_SCHEMA = 'vivim.knowledge-result/1' as const;
export type KnowledgeSurface = 'pc' | 'android' | 'wiki';
export type KnowledgePurpose = 'task' | 'explain' | 'help';
export type KnowledgeSensitivity = 'S0' | 'S1' | 'S2' | 'S3';
export type KnowledgeAvailability = 'present' | 'missing' | 'stale' | 'redacted' | 'revoked' | 'deleted' | 'unknown' | 'unavailable';
export type KnowledgeClaim = 'observed' | 'proposed' | 'confirmed' | 'conflicted' | 'retracted';

export interface KnowledgeQuery {
  readonly schema: typeof KNOWLEDGE_QUERY_SCHEMA;
  readonly requestId: string;
  readonly personalWorldRef: string;
  readonly purpose: KnowledgePurpose;
  readonly surface: KnowledgeSurface;
  readonly query?: string;
  readonly entityRef?: string;
  readonly kinds?: readonly string[];
  readonly limit: number;
  readonly cursor?: string;
}

/** Supplied ONLY through the broker constructor, never copied from request JSON. */
export interface TrustedKnowledgeContext {
  readonly ownerRef: string;
  readonly sessionRef: string;
  readonly deviceRef: string;
  readonly personalWorldRef: string;
  readonly surface: KnowledgeSurface;
  readonly allowedPurposes: readonly KnowledgePurpose[];
  readonly allowPhoneS1: boolean;
  readonly policyRevision: string;
  readonly sessionExpiresAt: number;
  readonly grantExpiresAt: number;
  readonly revoked: boolean;
  readonly offline: boolean;
  /** An explicit trusted policy may permit existence-only markers for redacted rows. */
  readonly maySeeRedactedMarkers?: boolean;
}
export interface TrustedKnowledgeBroker {
  /** Trusted implementation must authenticate and verify the current session/grant. */
  readContext(): Readonly<TrustedKnowledgeContext> | null;
}

export interface CanonicalKnowledgeRecord {
  readonly stableId: string;
  readonly ownerRef: string;
  readonly personalWorldRef: string;
  readonly projectRef: string;
  readonly kind: string;
  readonly label: string;
  readonly summary: string;
  readonly path?: string;
  readonly allowedDeviceRefs?: readonly string[];
  readonly allowedPurposes?: readonly KnowledgePurpose[];
  readonly allowedSurfaces?: readonly KnowledgeSurface[];
  readonly sensitivity: KnowledgeSensitivity;
  readonly availability: KnowledgeAvailability;
  readonly claimStatus: KnowledgeClaim;
  readonly source: { readonly authority: string; readonly nativeId: string; readonly nativeVersion: string; readonly digest: string };
  readonly evidenceRefs: readonly string[];
  readonly provenance: readonly string[];
  readonly asOf: string;
}
export interface KnowledgeItem {
  readonly stableId: string;
  readonly kind: string;
  readonly projectRef: string;
  readonly label: string;
  readonly summary: string;
  readonly availability: KnowledgeAvailability;
  readonly visibility: 'visible' | 'redacted';
  readonly claimStatus: KnowledgeClaim;
  readonly source: CanonicalKnowledgeRecord['source'];
  readonly evidenceRefs: readonly string[];
  readonly provenance: readonly string[];
  readonly asOf: string;
}
export interface KnowledgePage {
  readonly schema: typeof KNOWLEDGE_RESULT_SCHEMA;
  readonly status: 'ok' | 'partial' | 'unavailable' | 'denied';
  readonly items: readonly KnowledgeItem[];
  readonly completeness: 'complete' | 'partial' | 'unknown';
  readonly projectionRevision: string | null;
  readonly asOf: string | null;
  readonly nextCursor?: string;
  readonly reasonCode?: 'NO_TRUSTED_CONTEXT' | 'SCOPE_DENIED' | 'INVALID_QUERY' | 'CURSOR_INVALID' | 'OFFLINE';
}
export type FixtureSourceEvent =
  | { readonly type: 'tombstone' | 'revoke'; readonly stableId: string }
  | { readonly type: 'source-reset' };
export interface KnowledgeClient {
  query(query: KnowledgeQuery): Promise<KnowledgePage>;
}
export interface FixtureKnowledgeClient extends KnowledgeClient {
  /** Only a synthetic source-event hook. NOT a KB mutation method or live API. */
  applyFixtureSourceEvent(event: FixtureSourceEvent): void;
  fixtureMetrics(): Readonly<{ discoveryScans: number; pageCursors: number; epoch: number }>;
}

const REF = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const KIND = /^[a-z][a-z0-9_-]{0,47}$/;
const QUERY_KEYS = new Set(['schema', 'requestId', 'personalWorldRef', 'purpose', 'surface', 'query', 'entityRef', 'kinds', 'limit', 'cursor']);
const PURPOSES = new Set<KnowledgePurpose>(['task', 'explain', 'help']);
const SURFACES = new Set<KnowledgeSurface>(['pc', 'android', 'wiki']);
const MAX_QUERY = 256;
const MAX_KINDS = 8;
const MAX_LIMIT = 50;
const CURSOR_TTL_MS = 60_000;

function denied(reasonCode: NonNullable<KnowledgePage['reasonCode']>): KnowledgePage {
  // Deliberately no identifiers, counts, timestamps, cursor or policy revision.
  return { schema: KNOWLEDGE_RESULT_SCHEMA, status: 'denied', items: [], completeness: 'unknown', projectionRevision: null, asOf: null, reasonCode };
}
function unavailable(): KnowledgePage {
  return { schema: KNOWLEDGE_RESULT_SCHEMA, status: 'unavailable', items: [], completeness: 'unknown', projectionRevision: null, asOf: null, reasonCode: 'OFFLINE' };
}
function validRef(s: unknown): s is string { return typeof s === 'string' && REF.test(s); }
function queryShape(req: unknown): req is KnowledgeQuery {
  if (typeof req !== 'object' || req === null || Array.isArray(req)) return false;
  const q = req as Record<string, unknown>;
  if (Object.keys(q).some(key => !QUERY_KEYS.has(key))) return false;
  if (q.schema !== KNOWLEDGE_QUERY_SCHEMA || !validRef(q.requestId) || !validRef(q.personalWorldRef)) return false;
  if (!SURFACES.has(q.surface as KnowledgeSurface) || !PURPOSES.has(q.purpose as KnowledgePurpose)) return false;
  if (!Number.isInteger(q.limit) || (q.limit as number) < 1 || (q.limit as number) > MAX_LIMIT) return false;
  if (q.query !== undefined && (typeof q.query !== 'string' || q.query.length > MAX_QUERY || q.query.trim().length === 0)) return false;
  if (q.entityRef !== undefined && !validRef(q.entityRef)) return false;
  if (q.query === undefined && q.entityRef === undefined) return false;
  if (q.cursor !== undefined && (!validRef(q.cursor) || q.cursor.length > 128)) return false;
  return q.kinds === undefined || (Array.isArray(q.kinds) && q.kinds.length >= 1 && q.kinds.length <= MAX_KINDS && q.kinds.every(k => typeof k === 'string' && KIND.test(k)) && new Set(q.kinds).size === q.kinds.length);
}
function contextValid(ctx: TrustedKnowledgeContext | null, now: number): ctx is TrustedKnowledgeContext {
  return !!ctx && validRef(ctx.ownerRef) && validRef(ctx.sessionRef) && validRef(ctx.deviceRef)
    && validRef(ctx.personalWorldRef) && validRef(ctx.policyRevision) && SURFACES.has(ctx.surface)
    && Array.isArray(ctx.allowedPurposes) && ctx.allowedPurposes.every(p => PURPOSES.has(p))
    && typeof ctx.allowPhoneS1 === 'boolean' && typeof ctx.revoked === 'boolean' && typeof ctx.offline === 'boolean'
    && Number.isFinite(ctx.sessionExpiresAt) && Number.isFinite(ctx.grantExpiresAt)
    && ctx.sessionExpiresAt > now && ctx.grantExpiresAt > now && !ctx.revoked;
}
function scopeKey(ctx: TrustedKnowledgeContext): string {
  return JSON.stringify([ctx.ownerRef, ctx.sessionRef, ctx.deviceRef, ctx.personalWorldRef, ctx.surface, ctx.policyRevision, [...ctx.allowedPurposes].sort(), ctx.allowPhoneS1, ctx.maySeeRedactedMarkers === true]);
}
function allowed(row: CanonicalKnowledgeRecord, ctx: TrustedKnowledgeContext, query: KnowledgeQuery): boolean {
  if (row.ownerRef !== ctx.ownerRef || row.personalWorldRef !== ctx.personalWorldRef) return false;
  if (row.allowedDeviceRefs && !row.allowedDeviceRefs.includes(ctx.deviceRef)) return false;
  if (row.allowedPurposes && !row.allowedPurposes.includes(query.purpose)) return false;
  if (row.allowedSurfaces && !row.allowedSurfaces.includes(query.surface)) return false;
  if (query.surface === 'android' && (row.sensitivity === 'S2' || row.sensitivity === 'S3')) return false;
  if (query.surface === 'android' && row.sensitivity === 'S1' && !ctx.allowPhoneS1) return false;
  // Redacted existence is itself private unless explicit trusted policy says otherwise.
  if (row.availability === 'redacted' && ctx.maySeeRedactedMarkers !== true) return false;
  // Do not resurrect revoked/deleted/missing through search, aliases, cursor, or cache.
  return !['deleted', 'revoked', 'missing'].includes(row.availability);
}
function toItem(row: CanonicalKnowledgeRecord): KnowledgeItem {
  const redacted = row.availability === 'redacted';
  return {
    stableId: redacted ? 'withheld' : row.stableId,
    kind: redacted ? 'withheld' : row.kind,
    projectRef: redacted ? 'withheld' : row.projectRef,
    label: redacted ? 'Redacted' : row.label,
    summary: redacted ? '' : row.summary,
    availability: row.availability,
    visibility: redacted ? 'redacted' : 'visible',
    claimStatus: redacted ? 'retracted' : row.claimStatus,
    source: redacted ? { authority: 'withheld', nativeId: 'withheld', nativeVersion: 'withheld', digest: 'withheld' } : { ...row.source },
    evidenceRefs: redacted ? [] : [...row.evidenceRefs],
    provenance: redacted ? [] : [...row.provenance],
    asOf: redacted ? '' : row.asOf,
  };
}

/** Purely in-memory, bounded synthetic fixture. A real service requires a separately approved KB adapter. */
export function createFixtureKnowledgeClient(
  sourceRows: readonly CanonicalKnowledgeRecord[],
  broker: TrustedKnowledgeBroker,
  options: { readonly now?: () => number } = {},
): FixtureKnowledgeClient {
  if (!broker || typeof broker.readContext !== 'function') throw new TypeError('trusted broker required');
  if (sourceRows.length > 10_000 || new Set(sourceRows.map(row => row.stableId)).size !== sourceRows.length || sourceRows.some(row => !validRef(row.stableId))) throw new TypeError('invalid fixture IDs');
  const rows = sourceRows.map(row => structuredClone(row));
  const now = options.now ?? Date.now;
  const cursors = new Map<string, { key: string; filter: string; offset: number; epoch: number; expires: number }>();
  let epoch = 1;
  let discoveryScans = 0;
  return {
    async query(request: KnowledgeQuery): Promise<KnowledgePage> {
      // Resolve trust and scope BEFORE searching, filtering, ranking, counting or issuing cursors.
      const currentTime = now();
      const ctx = broker.readContext();
      if (!ctx) return denied('NO_TRUSTED_CONTEXT');
      if (!contextValid(ctx, currentTime)) return denied('SCOPE_DENIED');
      if (!queryShape(request)) return denied('INVALID_QUERY');
      if (request.personalWorldRef !== ctx.personalWorldRef || request.surface !== ctx.surface || !ctx.allowedPurposes.includes(request.purpose)) return denied('SCOPE_DENIED');
      if (ctx.offline) return unavailable(); // No possibly revoked cached payload is replayed offline.
      const filter = JSON.stringify([request.query?.toLocaleLowerCase().trim() ?? '', request.entityRef ?? '', [...(request.kinds ?? [])].sort(), request.limit, request.purpose]);
      const key = scopeKey(ctx);
      let offset = 0;
      if (request.cursor !== undefined) {
        const cursor = cursors.get(request.cursor);
        if (!cursor || cursor.key !== key || cursor.filter !== filter || cursor.epoch !== epoch || cursor.expires <= currentTime) return denied('CURSOR_INVALID');
        offset = cursor.offset;
        cursors.delete(request.cursor); // one-use token, not an indefinitely replayable cached page
      }
      discoveryScans++;
      const needle = request.query?.toLocaleLowerCase().trim();
      const permitted = rows.filter(row => allowed(row, ctx, request));
      const matched = permitted.filter(row =>
        (request.entityRef === undefined || row.stableId === request.entityRef) &&
        (!request.kinds || request.kinds.includes(row.kind)) &&
        (!needle || [row.label, row.summary, row.path ?? ''].some(s => s.toLocaleLowerCase().includes(needle)))
      );
      // Sort by stable opaque identity, never display name/path. Same path in distinct projects remains distinct.
      matched.sort((a, b) => a.stableId.localeCompare(b.stableId));
      const slice = matched.slice(offset, offset + request.limit).map(toItem);
      const nextOffset = offset + slice.length;
      let nextCursor: string | undefined;
      if (nextOffset < matched.length) {
        nextCursor = 'kc_' + crypto.randomUUID();
        cursors.set(nextCursor, { key, filter, offset: nextOffset, epoch, expires: currentTime + CURSOR_TTL_MS });
      }
      const partial = slice.some(item => ['stale', 'unknown', 'unavailable'].includes(item.availability));
      return {
        schema: KNOWLEDGE_RESULT_SCHEMA, status: partial ? 'partial' : 'ok', items: slice,
        completeness: partial ? 'partial' : 'complete', projectionRevision: 'fixture-epoch-' + epoch,
        asOf: new Date(currentTime).toISOString(), ...(nextCursor ? { nextCursor } : {}),
      };
    },
    applyFixtureSourceEvent(event: FixtureSourceEvent): void {
      if (event.type === 'source-reset') {
        epoch++;
        cursors.clear();
        return;
      }
      if (event.type !== 'tombstone' && event.type !== 'revoke') throw new TypeError('invalid fixture event');
      const row = rows.find(r => r.stableId === event.stableId);
      if (row) {
        // Fixture event simulates a change from the authoritative source. Never writes back.
        const at = rows.indexOf(row);
        rows[at] = { ...row, availability: event.type === 'tombstone' ? 'deleted' : 'revoked' };
      }
      epoch++;
      cursors.clear();
    },
    fixtureMetrics(): Readonly<{ discoveryScans: number; pageCursors: number; epoch: number }> {
      return { discoveryScans, pageCursors: cursors.size, epoch };
    },
  };
}

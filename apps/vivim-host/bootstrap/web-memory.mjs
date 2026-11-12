// Sprint 01 Lane 3: Host-owned, read-only browser-memory projection.
// Rust HQKG is the source of observation truth; these are queryable SQLite read models.
// No browser effects, provider sends, owner confirmations or network endpoints here.
import { createHash } from 'node:crypto';

export const WEB_MEMORY_SCHEMA = 'vivim.web-memory-query/1';
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const SITE = /^(?=.{1,253}$)[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$/;
const SECRET_SEGMENT = /^(?:[a-f0-9]{32,}|[a-zA-Z0-9_-]{40,})$/;
const PRIVATE_PATH = /(?:^|\/)(?:auth|authenticate|login|signin|reset|token|secret|session|verify|password|account\/recovery)(?:\/|$)/i;
const LIMIT = 30;
const age = value => Number.isFinite(Date.parse(value)) ? Date.parse(value) : NaN;
const err = (code) => Object.assign(new TypeError(code), { code });
const hash = text => createHash('sha256').update(text).digest('hex');
const prefKey = worldId => 'web-memory.opt-out:' + worldId;
export const projectionId = (installationId, eventId) => 'web:visit:' + installationId + ':' + eventId;

function safeLocation(site, raw) {
  if (typeof site !== 'string' || !SITE.test(site) || typeof raw !== 'string' || raw.length > 1024 ||
      /[?#@\\\u0000-\u001f\u007f]/.test(raw)) throw err('WEB_URL_UNSAFE');
  let parsed;
  try { parsed = new URL(raw); } catch { throw err('WEB_URL_UNSAFE'); }
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.hostname !== site ||
      parsed.username || parsed.password || parsed.port || parsed.search || parsed.hash) throw err('WEB_URL_UNSAFE');
  const reduced = PRIVATE_PATH.test(parsed.pathname) || parsed.pathname.split('/').some(SECRET_SEGMENT.test.bind(SECRET_SEGMENT));
  return { url: reduced ? parsed.origin + '/' : parsed.href, reduced };
}

export function normalizeRustQuery(response, { sourceKind = 'fixture', worldId, now = new Date().toISOString() } = {}) {
  if (!response || response.schema !== WEB_MEMORY_SCHEMA || !Array.isArray(response.items) ||
      response.items.length > 32 || !['fixture', 'rust-cli'].includes(sourceKind)) throw err('WEB_QUERY_SCHEMA_INVALID');
  if (sourceKind === 'rust-cli' && response.authority !== 'hqkg') throw err('WEB_SOURCE_UNTRUSTED');
  if (response.cursor != null && (typeof response.cursor !== 'string' || response.cursor.length > 512))
    throw err('WEB_CURSOR_INVALID');
  const seen = new Map(), items = [];
  for (const record of response.items) {
    if (!record || !UUID.test(record.eventId || '') || !UUID.test(record.installationId || '') ||
        typeof record.observedAt !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(record.observedAt) ||
        !Number.isFinite(age(record.observedAt)) || age(record.observedAt) > age(now) + 300000)
      throw err('WEB_RECORD_INVALID');
    const location = safeLocation(record.site, record.url);
    const id = projectionId(record.installationId, record.eventId);
    const sourceRef = 'browser:' + record.installationId + ':' + record.eventId;
    if (record.sourceRef != null && record.sourceRef !== sourceRef) throw err('WEB_SOURCE_REF_INVALID');
    const digest = hash([id, record.observedAt, record.site, location.url].join('|'));
    if (seen.has(id)) {
      if (seen.get(id) !== digest) throw err('WEB_EVIDENCE_CONFLICT');
      continue;
    }
    seen.set(id, digest);
    items.push({ worldId, id, eventId: record.eventId, installationId: record.installationId,
      site: record.site, url: location.url, observedAt: record.observedAt,
      sourceRef, digest, reduced: location.reduced, sourceKind,
      verified: sourceKind === 'rust-cli' && response.authority === 'hqkg' && record.verified === true });
  }
  const retractedIds = response.retractedIds ?? [];
  if (!Array.isArray(retractedIds) || retractedIds.length > 32 ||
      retractedIds.some(id => typeof id !== 'string' || !/^web:visit:[a-f0-9-]{36}:[a-f0-9-]{36}$/i.test(id)))
    throw err('WEB_RETRACTIONS_INVALID');
  return { items, retractedIds, cursor: response.cursor ?? null,
    coverage: sourceKind === 'fixture' ? 'synthetic_fixture' : (response.coverage === 'complete' ? 'complete' : 'partial') };
}

// Shared strict parser for authenticated desktop and paired-phone GET surfaces.
export function readMemoryParams(searchParams) {
  const allowed = new Set(['day', 'site', 'limit', 'cursor']);
  for (const key of searchParams.keys())
    if (!allowed.has(key) || searchParams.getAll(key).length !== 1) throw err('WEB_FILTER_INVALID');
  const limit = searchParams.has('limit') ? Number(searchParams.get('limit')) : LIMIT;
  return { day: searchParams.get('day') || null, site: searchParams.get('site') || null,
    limit, cursor: searchParams.get('cursor') || null };
}

export function createWebMemory({ ledger, worldId = 'world-local', now = () => new Date().toISOString() } = {}) {
  if (!ledger?.webVisits || typeof ledger.transaction !== 'function') throw err('WEB_LEDGER_REQUIRED');
  const optedOut = () => ledger.meta.get(prefKey(worldId)) === '1';
  function setOptOut(value) {
    if (typeof value !== 'boolean') throw err('WEB_OPT_OUT_INVALID');
    return ledger.transaction(() => { ledger.meta.set(prefKey(worldId), value ? '1' : '0'); return { optOut: value }; });
  }
  // Internal Host-only method. Never expose this as an untrusted HTTP ingest endpoint.
  function project(response, { sourceKind = 'fixture' } = {}) {
    if (optedOut()) return { state: 'disabled', accepted: 0, skipped: 0, reason: 'Owner opted out of web memory' };
    const stamp = now();
    const batch = normalizeRustQuery(response, { sourceKind, worldId, now: stamp });
    return ledger.transaction(() => {
      // Apply retractions first so replay cannot resurrect deleted evidence.
      ledger.webVisits.retract(worldId, batch.retractedIds, stamp);
      let inserted = 0, duplicates = 0, retracted = 0;
      for (const record of batch.items) {
        const state = ledger.webVisits.put(record);
        if (state === 'inserted') inserted++;
        else if (state === 'duplicate') duplicates++;
        else retracted++;
      }
      ledger.webVisits.mark(worldId, sourceKind, stamp, batch.cursor, batch.coverage);
      return { state: 'ready', accepted: batch.items.length, inserted, duplicates,
        retracted, deleted: batch.retractedIds.length, cursor: batch.cursor, coverage: batch.coverage };
    });
  }
  function recent({ day = null, site = null, limit = LIMIT, cursor = null } = {}) {
    const status = ledger.webVisits.status(worldId);
    const effectiveNow = now();
    const local = new Date(effectiveNow);
    const date = day ?? [local.getFullYear(), String(local.getMonth() + 1).padStart(2, '0'),
      String(local.getDate()).padStart(2, '0')].join('-');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date + 'T00:00:00').getTime())) throw err('WEB_DAY_INVALID');
    const start = new Date(date + 'T00:00:00'), end = new Date(start);
    end.setDate(end.getDate() + 1);
    if (site != null && (typeof site !== 'string' || !SITE.test(site))) throw err('WEB_SITE_INVALID');
    if (!Number.isInteger(limit) || limit < 1 || limit > LIMIT) throw err('WEB_LIMIT_INVALID');
    let cursorAt = null, cursorId = null;
    if (cursor != null) {
      try {
        if (typeof cursor !== 'string' || cursor.length > 256) throw Error();
        const x = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
        if (!x || typeof x.at !== 'string' || !Number.isFinite(age(x.at)) || typeof x.id !== 'string' ||
            !/^web:visit:[a-f0-9-]{36}:[a-f0-9-]{36}$/i.test(x.id)) throw Error();
        cursorAt = x.at; cursorId = x.id;
      } catch { throw err('WEB_PAGE_CURSOR_INVALID'); }
    }
    const blocked = optedOut();
    const rows = blocked ? [] : ledger.webVisits.list(worldId,
      { since: start.toISOString(), before: end.toISOString(), site, limit: limit + 1, cursorAt, cursorId });
    const hasMore = rows.length > limit, items = rows.slice(0, limit).map(r => ({
      id: r.id, eventId: r.event_id, site: r.site, url: r.safe_url,
      observedAt: r.observed_at, sourceRef: r.source_ref, sourceOrigin: r.source_kind,
      trust: r.verified ? 'source_observed' : 'synthetic_unverified', reduced: !!r.reduced
    }));
    const last = hasMore ? items.at(-1) : null;
    const nextCursor = last ? Buffer.from(JSON.stringify({ at: last.observedAt, id: last.id })).toString('base64url') : null;
    const stale = status && age(effectiveNow) - age(status.refresh_at) > 15 * 60_000;
    return { schema: 'vivim.web-memory-view/1', state: blocked ? 'disabled' : !status ? 'bridge-unavailable' : stale ? 'stale' : 'ready',
      day: date, site, items, nextCursor, coverage: status?.coverage ?? 'not_connected',
      source: status?.source_kind ?? 'rust-query-bridge-not-connected', lastRefreshAt: status?.refresh_at ?? null,
      note: blocked ? 'Owner opt-out is active; no history is displayed or projected.'
        : !status ? 'No Rust query bridge connected. Empty history is not evidence that you browsed nothing.'
        : status.source_kind === 'fixture' ? 'Synthetic fixture only; these are not verified browser visits.'
        : stale ? 'Source is stale. Results may omit recent navigation.' : 'Source-linked observed metadata; not owner-confirmed facts.' };
  }
  function contextPreview({ ids, authorization } = {}) {
    if (!authorization || authorization.approved !== true || authorization.allowWebHistory !== true ||
        !/^[a-z0-9_-]{1,32}$/i.test(authorization.provider || '') ||
        typeof authorization.conversationId !== 'string' || authorization.conversationId.length < 1 ||
        authorization.conversationId.length > 256 || !Array.isArray(ids) || ids.length < 1 || ids.length > 8 ||
        ids.some(id => typeof id !== 'string' || !/^web:visit:[a-f0-9-]{36}:[a-f0-9-]{36}$/i.test(id)))
      throw err('WEB_CONTEXT_APPROVAL_REQUIRED');
    if (optedOut()) throw err('WEB_CONTEXT_DISABLED');
    const rows = ledger.webVisits.select(worldId, [...new Set(ids)]).filter(r => r.verified === 1);
    if (rows.length !== new Set(ids).size) throw err('WEB_CONTEXT_SOURCE_UNVERIFIED');
    return { schema: 'vivim.web-context-preview/1', provider: authorization.provider,
      conversationId: authorization.conversationId, transmitted: false, approved: true,
      disclosure: 'Approved observed browser locations only; no page text, forms, or credentials. No send occurred.',
      items: rows.map(r => ({ id: r.id, site: r.site, url: r.safe_url,
        observedAt: r.observed_at, sourceRef: r.source_ref })) };
  }
  return { project, recent, contextPreview, setOptOut, optedOut };
}

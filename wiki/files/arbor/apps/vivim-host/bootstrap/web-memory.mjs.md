# File: apps/vivim-host/bootstrap/web-memory.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/bootstrap/web-memory.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10824 B |
| Lines | 158 |
| Hash | db9304255f40 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WEB_MEMORY_SCHEMA | const | 6 | yes | export const WEB_MEMORY_SCHEMA = &#39;vivim.web-memory-query/1&#39;; |
| UUID | const | 7 | no | const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i; |
| SITE | const | 8 | no | const SITE = /^(?=.{1,253}$)[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$/; |
| SECRET_SEGMENT | const | 9 | no | const SECRET_SEGMENT = /^(?:[a-f0-9]{32,}\|[a-zA-Z0-9_-]{40,})$/; |
| PRIVATE_PATH | const | 10 | no | const PRIVATE_PATH = /(?:^\|\\/)(?:auth\|authenticate\|login\|signin\|reset\|token\|secret\|session\|verify\|password\|account\\/recovery)(?:\\/\|$)/i; |
| LIMIT | const | 11 | no | const LIMIT = 30; |
| age | function | 12 | no | const age = value =&gt; Number.isFinite(Date.parse(value)) ? Date.parse(value) : NaN; |
| err | function | 13 | no | const err = (code) =&gt; Object.assign(new TypeError(code), { code }); |
| hash | function | 14 | no | const hash = text =&gt; createHash(&#39;sha256&#39;).update(text).digest(&#39;hex&#39;); |
| prefKey | function | 15 | no | const prefKey = worldId =&gt; &#39;web-memory.opt-out:&#39; + worldId; |
| projectionId | function | 16 | yes | export const projectionId = (installationId, eventId) =&gt; &#39;web:visit:&#39; + installationId + &#39;:&#39; + eventId; |
| safeLocation | function | 18 | no | function safeLocation(site, raw) { |
| parsed | variable | 21 | no | let parsed; |
| reduced | const | 25 | no | const reduced = PRIVATE_PATH.test(parsed.pathname) \|\| parsed.pathname.split(&#39;/&#39;).some(SECRET_SEGMENT.test.bind(SECRET_SEGMENT)); |
| normalizeRustQuery | function | 29 | yes | export function normalizeRustQuery(response, { sourceKind = &#39;fixture&#39;, worldId, now = new Date().toISOString() } = {}) { |
| seen | const | 35 | no | const seen = new Map(), items = []; |
| location | const | 41 | no | const location = safeLocation(record.site, record.url); |
| id | const | 42 | no | const id = projectionId(record.installationId, record.eventId); |
| sourceRef | const | 43 | no | const sourceRef = &#39;browser:&#39; + record.installationId + &#39;:&#39; + record.eventId; |
| digest | const | 45 | no | const digest = hash([id, record.observedAt, record.site, location.url].join(&#39;\|&#39;)); |
| retractedIds | const | 56 | no | const retractedIds = response.retractedIds ?? []; |
| readMemoryParams | function | 65 | yes | export function readMemoryParams(searchParams) { |
| allowed | const | 66 | no | const allowed = new Set([&#39;day&#39;, &#39;site&#39;, &#39;limit&#39;, &#39;cursor&#39;]); |
| limit | const | 69 | no | const limit = searchParams.has(&#39;limit&#39;) ? Number(searchParams.get(&#39;limit&#39;)) : LIMIT; |
| createWebMemory | function | 74 | yes | export function createWebMemory({ ledger, worldId = &#39;world-local&#39;, now = () =&gt; new Date().toISOString() } = {}) { |
| optedOut | function | 76 | no | const optedOut = () =&gt; ledger.meta.get(prefKey(worldId)) === &#39;1&#39;; |
| setOptOut | function | 77 | no | function setOptOut(value) { |
| project | function | 82 | no | function project(response, { sourceKind = &#39;fixture&#39; } = {}) { |
| stamp | const | 84 | no | const stamp = now(); |
| batch | const | 85 | no | const batch = normalizeRustQuery(response, { sourceKind, worldId, now: stamp }); |
| inserted | variable | 89 | no | let inserted = 0, duplicates = 0, retracted = 0; |
| state | const | 91 | no | const state = ledger.webVisits.put(record); |
| recent | function | 101 | no | function recent({ day = null, site = null, limit = LIMIT, cursor = null } = {}) { |
| status | const | 102 | no | const status = ledger.webVisits.status(worldId); |
| effectiveNow | const | 103 | no | const effectiveNow = now(); |
| local | const | 104 | no | const local = new Date(effectiveNow); |
| date | const | 105 | no | const date = day ?? [local.getFullYear(), String(local.getMonth() + 1).padStart(2, &#39;0&#39;), |
| start | const | 108 | no | const start = new Date(date + &#39;T00:00:00&#39;), end = new Date(start); |
| cursorAt | variable | 112 | no | let cursorAt = null, cursorId = null; |
| x | const | 116 | no | const x = JSON.parse(Buffer.from(cursor, &#39;base64url&#39;).toString(&#39;utf8&#39;)); |
| blocked | const | 122 | no | const blocked = optedOut(); |
| rows | const | 123 | no | const rows = blocked ? [] : ledger.webVisits.list(worldId, { since: start.toISOString(), before: end.toISOString(), site, limit: limit + 1, cursorAt, cursorId }); |
| hasMore | const | 125 | no | const hasMore = rows.length &gt; limit, items = rows.slice(0, limit).map(r =&gt; ({ id: r.id, eventId: r.event_id, site: r.site, url: r.safe_url, observedAt: r.observed_at, sourceRef: r.source_ref, sourceO… |
| last | const | 130 | no | const last = hasMore ? items.at(-1) : null; |
| nextCursor | const | 131 | no | const nextCursor = last ? Buffer.from(JSON.stringify({ at: last.observedAt, id: last.id })).toString(&#39;base64url&#39;) : null; |
| stale | const | 132 | no | const stale = status &amp;&amp; age(effectiveNow) - age(status.refresh_at) &gt; 15 * 60_000; |
| contextPreview | function | 141 | no | function contextPreview({ ids, authorization } = {}) { |
| rows | const | 149 | no | const rows = ledger.webVisits.select(worldId, [...new Set(ids)]).filter(r =&gt; r.verified === 1); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 4 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/bootstrap/runtime.mjs](./runtime.mjs.md) | ./web-memory.mjs |
| [apps/vivim-host/bootstrap/rust-web-reader.mjs](./rust-web-reader.mjs.md) | ./web-memory.mjs |
| [apps/vivim-host/bootstrap/web-memory.test.mjs](./web-memory.test.mjs.md) | ./web-memory.mjs |
| [apps/vivim-host/direct-phone.mjs](../direct-phone.mjs.md) | ./bootstrap/web-memory.mjs |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./bootstrap/web-memory.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 159 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

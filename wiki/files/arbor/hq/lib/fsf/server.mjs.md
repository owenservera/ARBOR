# File: hq/lib/fsf/server.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/fsf/server.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 28059 B |
| Lines | 816 |
| Hash | 84d2199f63ed |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEFAULT_REFRESH_AFTER_MS | const | 70 | no | const DEFAULT_REFRESH_AFTER_MS = 5000; |
| HEARTBEAT_MS | const | 71 | no | const HEARTBEAT_MS = 15000; |
| DEFAULT_SCHEMA | const | 72 | no | const DEFAULT_SCHEMA = &#39;hq.fsf/1&#39;; |
| createFeedServer | function | 85 | yes | export async function createFeedServer(options) { |
| sockets | const | 111 | no | const sockets = new Set(); |
| streams | const | 113 | no | const streams = new Set(); |
| closePromise | variable | 115 | no | let closePromise = null; |
| server | const | 117 | no | const server = http.createServer((req, res) =&gt; { try { handle(req, res); } catch { if (res.headersSent) { |
| readSnapshot | function | 146 | no | function readSnapshot() { |
| raw | variable | 148 | no | let raw; |
| feedHeaders | function | 161 | no | function feedHeaders(snap) { |
| generation | const | 162 | no | const generation = snap ? snap.generation : 0; |
| version | const | 163 | no | const version = snap ? snap.version : 0; |
| issuedAt | const | 164 | no | const issuedAt = snap ? snap.issuedAt : new Date().toISOString(); |
| refresh | const | 165 | no | const refresh = snap ? snap.refreshAfterMs : refreshAfterMs; |
| authorized | function | 183 | no | function authorized(req, url) { |
| queryToken | const | 184 | no | const queryToken = url.searchParams.get(&#39;token&#39;); |
| header | const | 186 | no | const header = req.headers.authorization; |
| handle | function | 200 | no | function handle(req, res) { |
| url | variable | 202 | no | let url; |
| isPublicPath | const | 213 | no | const isPublicPath = url.pathname === &#39;/&#39; \|\| url.pathname === &#39;/fsf&#39; \|\| url.pathname === &#39;/fsf/&#39;; |
| handleSnapshot | function | 250 | no | function handleSnapshot(res) { |
| snap | const | 251 | no | const snap = readSnapshot(); |
| handleHome | function | 260 | no | function handleHome(res) { |
| snap | const | 261 | no | const snap = readSnapshot(); |
| version | const | 262 | no | const version = snap ? snap.version : null; |
| generation | const | 263 | no | const generation = snap ? snap.generation : null; |
| issuedAt | const | 264 | no | const issuedAt = snap ? snap.issuedAt : null; |
| degraded | const | 265 | no | const degraded = snap ? snap.degraded : false; |
| slicesCount | const | 266 | no | const slicesCount = snap &amp;&amp; typeof snap.slices === &#39;object&#39; &amp;&amp; !Array.isArray(snap.slices) |
| degradedNames | const | 271 | no | const degradedNames = snap &amp;&amp; typeof snap.slices === &#39;object&#39; &amp;&amp; !Array.isArray(snap.slices) |
| html | const | 275 | no | const html = `&lt;!doctype html&gt; |
| handleDelta | function | 328 | no | function handleDelta(url, res) { |
| snap | const | 329 | no | const snap = readSnapshot(); |
| since | const | 335 | no | const since = parseSince(url.searchParams.get(&#39;since&#39;)); |
| result | variable | 346 | no | let result; |
| code | const | 363 | no | const code = result &amp;&amp; typeof result === &#39;object&#39; ? result.code : undefined; |
| handleFeed | function | 385 | no | function handleFeed(res) { |
| snap | const | 386 | no | const snap = readSnapshot(); |
| xml | const | 391 | no | const xml = renderAtom(snap); |
| handleStream | function | 405 | no | function handleStream(req, res) { |
| snap | const | 406 | no | const snap = readSnapshot(); |
| cleaned | variable | 424 | no | let cleaned = false; |
| unsubscribe | function | 426 | no | let unsubscribe = () =&gt; {}; |
| poll | variable | 428 | no | let poll = null; |
| heartbeat | const | 430 | no | const heartbeat = setInterval(() =&gt; { if (cleaned \|\| res.writableEnded) return; res.write(&#39;: heartbeat\\n\\n&#39;); }, HEARTBEAT_MS); |
| cleanup | function | 436 | no | const cleanup = () =&gt; { |
| publish | function | 457 | no | const publish = (payload) =&gt; { |
| current | const | 459 | no | const current = readSnapshot(); |
| data | const | 461 | no | const data = current |
| off | const | 483 | no | const off = store.subscribe(publish); |
| lastVersion | variable | 494 | no | let lastVersion = snap.version; |
| pollMs | const | 495 | no | const pollMs = Math.max(100, Math.min(refreshAfterMs, 1000)); |
| current | const | 498 | no | const current = readSnapshot(); |
| onError | function | 518 | no | const onError = (error) =&gt; { |
| onListening | function | 522 | no | const onListening = () =&gt; { |
| address | const | 531 | no | const address = server.address(); |
| boundPort | const | 532 | no | const boundPort = address &amp;&amp; typeof address === &#39;object&#39; ? address.port : port; |
| urlHost | const | 533 | no | const urlHost = host.includes(&#39;:&#39;) ? `[${host}]` : host; |
| close | function | 536 | no | function close() { |
| done | function | 548 | no | const done = () =&gt; resolve(undefined); |
| normalizeSnapshot | function | 596 | no | function normalizeSnapshot(raw, fallbackRefreshMs) { |
| refresh | const | 599 | no | const refresh = typeof record.refreshAfterMs === &#39;number&#39; |
| slices | const | 604 | no | const slices = record.slices &amp;&amp; typeof record.slices === &#39;object&#39; &amp;&amp; !Array.isArray(record.slices) |
| degraded | const | 610 | no | const degraded = typeof record.degraded === &#39;boolean&#39; |
| toCount | function | 628 | no | function toCount(value) { |
| toIsoString | function | 636 | no | function toIsoString(value) { |
| fromNumber | const | 639 | no | const fromNumber = new Date(value); |
| parsed | const | 643 | no | const parsed = new Date(value); |
| parseSince | function | 653 | no | function parseSince(raw) { |
| text | const | 655 | no | const text = raw.trim(); |
| value | const | 657 | no | const value = Number(text); |
| renderAtom | function | 669 | no | function renderAtom(snap) { |
| degraded | const | 670 | no | const degraded = Object.entries(snap.slices).filter(([, slice]) =&gt; isDegraded(slice)); |
| total | const | 671 | no | const total = Object.keys(snap.slices).length; |
| lines | const | 672 | no | const lines = [ |
| detail | const | 689 | no | const detail = sliceDetail(slice, snap.issuedAt); |
| atomEntry | function | 706 | no | function atomEntry(entry) { |
| isDegraded | function | 721 | no | function isDegraded(slice) { |
| sliceDetail | function | 736 | no | function sliceDetail(slice, fallbackUpdated) { |
| outer | const | 737 | no | const outer = /** @type {Record&lt;string, any&gt;} */ (slice ?? {}); |
| keys | const | 738 | no | const keys = outer.keys &amp;&amp; typeof outer.keys === &#39;object&#39; &amp;&amp; !Array.isArray(outer.keys) |
| data | const | 741 | no | const data = keys.data &amp;&amp; typeof keys.data === &#39;object&#39; &amp;&amp; !Array.isArray(keys.data) |
| reason | const | 744 | no | const reason = typeof keys.reason === &#39;string&#39; &amp;&amp; keys.reason |
| lastGoodAt | const | 751 | no | const lastGoodAt = typeof keys.lastGoodAt === &#39;string&#39; &amp;&amp; keys.lastGoodAt |
| escapeXml | function | 766 | no | function escapeXml(value) { |
| sendJson | function | 785 | no | function sendJson(res, status, body, headers = {}) { |
| text | const | 786 | no | const text = JSON.stringify(body); |
| safeEqual | function | 807 | no | function safeEqual(candidate, expected) { |
| a | const | 808 | no | const a = Buffer.from(String(candidate), &#39;utf8&#39;); |
| b | const | 809 | no | const b = Buffer.from(String(expected), &#39;utf8&#39;); |
| diff | variable | 811 | no | let diff = 0; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:http | import | 14 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../../bin/hq.mjs.md) | ../lib/fsf/server.mjs |
| [hq/bin/hq.mjs](../../bin/hq.mjs.md) | ../lib/fsf/server.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | FSF (Fleet State Feed) HTTP surface: versioned snapshot, delta, live SSE stream and an Atom projection rendered from the same snapshot, behind one token check. |
| 4 | owner | hq | — | hq |
| 5 | task | — | — | F051 |
| 6 | invariant | — | — | Read-only: the server never writes store state; a missing snapshot is 503 NO_SNAPSHOT, never an empty healthy-looking feed. |
| 7 | invariant | — | — | Every 200 response carries x-fsf-generation, x-fsf-version, x-fsf-issued-at and x-fsf-refresh-after. |
| 8 | invariant | — | — | A delta the store cannot serve from retention is 410 GAP; a malformed `since` is 400 BAD_VERSION; neither silently falls back to the snapshot. |
| 9 | invariant | — | — | /fsf/feed.xml is rendered from the normalized snapshot only: one entry per degraded slice plus one fleet entry. |
| 10 | invariant | — | — | Each SSE connection owns exactly one store subscription and releases it when the socket closes. |
| 11 | why | — | — | An agent must be able to prove staleness from response metadata alone and re-snapshot on a gap instead of running on stale slices. |
| 12 | see | — | docs/FLEET-SCALE-UPGRADE.md | docs/FLEET-SCALE-UPGRADE.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context FSF (Fleet State Feed) HTTP surface: versioned snapshot, delta, live SSE stream and an Atom projection rendered from the same snapshot, behind one token check.
 * @hq:owner hq
 * @hq:task F051
 * @hq:invariant Read-only: the server never writes store state; a missing snapshot is 503 NO_SNAPSHOT, never an empty healthy-looking feed.
 * @hq:invariant Every 200 response carries x-fsf-generation, x-fsf-version, x-fsf-issued-at and x-fsf-refresh-after.
 * @hq:invariant A delta the store cannot serve from retention is 410 GAP; a malformed `since` is 400 BAD_VERSION; neither silently falls back to the snapshot.
 * @hq:invariant /fsf/feed.xml is rendered from the normalized snapshot only: one entry per degraded slice plus one fleet entry.
 * @hq:invariant Each SSE connection owns exactly one store subscription and releases it when the socket closes.
 * @hq:why An agent must be able to prove staleness from response metadata alone and re-snapshot on a gap instead of running on stale slices.
 * @hq:see docs/FLEET-SCALE-UPGRADE.md
 */
import http from 'node:http';

/**
 * Feed store contract (owned outside this module; a stub is enough for tests):
 *
 *   store.snapshot() -> FsfSnapshot | null
 *   store.delta(since) -> { ok: true, from?, to?, changes? }
 *                       | { ok: false, code: 'GAP', oldest?, newest? }
 *                       | { ok: false, code: 'BAD_VERSION' }
 *   store.subscribe(listener) -> unsubscribe()
 *
 * `store.delta` may also throw an Error carrying `code: 'GAP' | 'BAD_VERSION'`.
 * `subscribe` listeners receive an optional publish payload; the server reads
 * the current snapshot itself so an event never carries unnormalized data.
 *
 * @typedef {object} FsfSnapshot
 * @property {string} [schema]
 * @property {number} generation
 * @property {number} version
 * @property {string | number | Date} [issuedAt]
 * @property {number} [refreshAfterMs]
 * @property {Record<string, unknown>} slices
 */

/** @typedef {{ ok: true, from?: number, to?: number, changes?: unknown[] }} FsfDeltaOk */
/** @typedef {{ ok: false, code: string, oldest?: number | null, newest?: number | null }} FsfDeltaError */
/** @typedef {FsfDeltaOk | FsfDeltaError} FsfDeltaResult */

/**
 * @typedef {object} FsfStore
 * @property {() => FsfSnapshot | null} snapshot
 * @property {(since: number) => FsfDeltaResult} [delta]
 * @property {(listener: (payload?: unknown) => void) => () => void} [subscribe]
 */

/**
 * @typedef {object} NormalizedSnapshot
 * @property {string} schema
 * @property {number} generation
 * @property {number} version
 * @property {string} issuedAt
 * @property {number} refreshAfterMs
 * @property {Record<string, unknown>} slices
 * @property {boolean} degraded True when any slice is degraded. The store publishes this
 *   flag, so a snapshot served over HTTP carries it exactly as the local one does.
 */

/**
 * @typedef {object} FeedServerOptions
 * @property {FsfStore} store
 * @property {string} token
 * @property {number} [refreshAfterMs]
 * @property {string} [host]
 * @property {number} [port]
 */

const DEFAULT_REFRESH_AFTER_MS = 5000;
const HEARTBEAT_MS = 15000;
const DEFAULT_SCHEMA = 'hq.fsf/1';

// ---------------------------------------------------------------------------
// construction
// ---------------------------------------------------------------------------

/**
 * Start an FSF feed server. Async because an ephemeral port is only known once
 * the listener is bound; `port` and `url` in the result are the real ones.
```

_First 80 of 817 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

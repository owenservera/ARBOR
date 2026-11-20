# File: studio/src/mirror/index.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/mirror/index.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 20212 B |
| Lines | 367 |
| Hash | e6655e4a827f |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| loadCatalog | export | 29 | yes | export { loadCatalog } |
| findMatch | export | 30 | yes | export { findMatch, parseIncoming, scoreExchange } |
| parseIncoming | export | 30 | yes | export { findMatch, parseIncoming, scoreExchange } |
| scoreExchange | export | 30 | yes | export { findMatch, parseIncoming, scoreExchange } |
| learnDeltas | export | 31 | yes | export { synthesizeUnits, learnDeltas } |
| synthesizeUnits | export | 31 | yes | export { synthesizeUnits, learnDeltas } |
| MAX_BODY | const | 33 | no | const MAX_BODY = 16 * 1024 * 1024; |
| JSONISH | const | 34 | no | const JSONISH = new Set([&#39;sse&#39;, &#39;ndjson&#39;, &#39;eventsource&#39;, &#39;json&#39;, &#39;chunked&#39;, &#39;ws&#39;]); |
| buildRouteTable | function | 37 | yes | export function buildRouteTable(session) { |
| catalog | const | 38 | no | const catalog = session?.isMirrorCatalog ? session : loadCatalog(session); |
| readBody | function | 42 | no | function readBody(req, limit = MAX_BODY) { |
| parts | const | 44 | no | const parts = []; |
| n | variable | 45 | no | let n = 0; |
| sendJson | function | 52 | no | function sendJson(res, status, value, extra = []) { |
| body | const | 54 | no | const body = Buffer.from(JSON.stringify(value, null, 2)); |
| corsHeaders | function | 59 | no | function corsHeaders(req, enabled) { |
| origin | const | 61 | no | const origin = req.headers.origin; |
| h | const | 62 | no | const h = [[&#39;access-control-allow-origin&#39;, origin \|\| &#39;*&#39;], [&#39;access-control-expose-headers&#39;, &#39;*&#39;]]; |
| startMirror | function | 67 | yes | export async function startMirror({ session, port = 0, host = &#39;127.0.0.1&#39;, speed = 1, instant = false, synthesize = false, onRequest, minScore = 35, fallback = true, cors = true, maxLog = 2000, diale… |
| sess | const | 71 | no | const sess = openSession(session); |
| catalog | const | 72 | no | const catalog = loadCatalog(sess); |
| routeTable | const | 73 | no | const routeTable = routeTableOf(catalog); |
| deltaDialect | const | 74 | no | const deltaDialect = dialect ?? catalog.dialect ?? &#39;auto&#39;; |
| logs | const | 75 | no | const logs = []; |
| seq | variable | 76 | no | let seq = 0, closing = false; |
| wsConns | const | 77 | no | const wsConns = new Set(); |
| sockets | const | 78 | no | const sockets = new Set(); |
| cache | const | 81 | no | const cache = new Map(); |
| cachedBytes | variable | 82 | no | let cachedBytes = 0; |
| recordsOf | function | 83 | no | async function recordsOf(ex) { |
| records | const | 85 | no | const records = await loadExchangeRecords(catalog, ex); |
| size | const | 86 | no | const size = records.reduce((a, r) =&gt; a + (r.b64?.length ?? 0) + (r.payload?.length ?? 0) + 200, 0); |
| synthCache | const | 92 | no | const synthCache = new Map(); // ex.id -&gt; units \| null |
| streamUnits | function | 93 | no | async function streamUnits(ex) { |
| units | variable | 95 | no | let units = null; |
| r | const | 97 | no | const r = await reconstructStream(sess, ex.sid, { dialect: deltaDialect, limitEvents: 1_000_000 }); |
| evs | variable | 98 | no | let evs = r.events.filter((e) =&gt; e.seq &gt;= ex.seqFrom &amp;&amp; e.seq &lt;= ex.seqTo &amp;&amp; !e.reassembled); |
| notify | function | 111 | no | const notify = (entry, phase) =&gt; { |
| synthText | function | 116 | no | async function synthText(inc, ex) { |
| h | const | 118 | no | const h = inc.headers[&#39;x-mirror-text&#39;]; |
| v | const | 122 | no | const v = await synthesize({ request: { method: inc.method, path: inc.path, query: inc.query, json: inc.json, text: inc.bodyText }, route: ex.routeKey, sid: ex.sid, kind: ex.routeKind }); |
| synthOn | function | 127 | no | const synthOn = (inc) =&gt; !!synthesize \|\| inc.controls.synthesize === &#39;1&#39; \|\| inc.controls.text !== undefined \|\| !!inc.headers[&#39;x-mirror-text&#39;]; |
| control | function | 130 | no | function control(req, res, inc) { |
| name | const | 131 | no | const name = inc.path.slice(&#39;/__mirror/&#39;.length); |
| extra | const | 132 | no | const extra = corsHeaders(req, cors); |
| handle | function | 140 | no | async function handle(req, res) { |
| started | const | 141 | no | const started = Date.now(); |
| entry | const | 142 | no | const entry = { id: ++seq, at: new Date(started).toISOString(), kind: &#39;http&#39;, method: req.method, url: req.url }; |
| body | variable | 143 | no | let body; |
| inc | const | 145 | no | const inc = parseIncoming(req, body); |
| extra | const | 147 | no | const extra = corsHeaders(req, cors); |
| ex | const | 162 | no | const ex = match.ex; |
| records | const | 165 | no | const records = await recordsOf(ex); |
| plan | variable | 166 | no | let plan = buildHttpPlan(ex, records, { hosts: catalog.hosts }); |
| mode | variable | 167 | no | let mode = &#39;replay&#39;; |
| units | const | 169 | no | const units = await streamUnits(ex); |
| text | const | 171 | no | const text = await synthText(inc, ex); |
| s | const | 172 | no | const s = synthesizeUnits(units, text, { dialect: deltaDialect }); |
| lastUnitAt | const | 175 | no | const lastUnitAt = units[units.length - 1].at; |
| tail | const | 176 | no | const tail = Math.max(0, plan.endAt - lastUnitAt); |
| parts | const | 177 | no | const parts = s.units.map((u) =&gt; ({ at: u.at, buf: Buffer.isBuffer(u.raw) ? u.raw : Buffer.from(u.raw ?? &#39;&#39;) })); |
| pairs | const | 183 | no | const pairs = substitutionPairs(inc, ex); |
| r | const | 185 | no | const r = substituteParts(plan.parts.map((p) =&gt; p.buf), pairs, { json: JSONISH.has(ex.routeKind) }); |
| mirrorHeaders | const | 190 | no | const mirrorHeaders = [ |
| clock | const | 200 | no | const clock = createClock({ speed, instant }); |
| out | const | 201 | no | const out = await sendHttpPlan(req, res, plan, { clock, extraHeaders: mirrorHeaders, head: inc.method === &#39;HEAD&#39; }); |
| upgrade | function | 215 | no | async function upgrade(req, socket, head) { |
| started | const | 216 | no | const started = Date.now(); |
| entry | const | 217 | no | const entry = { id: ++seq, at: new Date(started).toISOString(), kind: &#39;ws&#39;, method: &#39;GET&#39;, url: req.url }; |
| inc | const | 219 | no | const inc = parseIncoming(req); |
| ex | const | 227 | no | const ex = match.ex; |
| script | variable | 230 | no | let script; |
| conn | const | 236 | no | const conn = acceptUpgrade(req, socket, head, { selectProtocol: (requested) =&gt; (ex.subprotocol &amp;&amp; requested.includes(ex.subprotocol) ? ex.subprotocol : null), extraHeaders: { &#39;x-mirror-sid&#39;: ex.sid, … |
| urlPairs | const | 242 | no | const urlPairs = substitutionPairs(inc, ex); |
| useSynth | const | 243 | no | const useSynth = synthOn(inc); |
| synthTextP | const | 244 | no | const synthTextP = useSynth ? synthText(inc, ex).catch(() =&gt; undefined) : Promise.resolve(undefined); |
| ac | const | 248 | no | const ac = new AbortController(); |
| played | const | 249 | no | const played = new Set(); |
| chain | variable | 250 | no | let chain = Promise.resolve(); |
| playTurn | function | 252 | no | async function playTurn(turn, pairs) { |
| clock | const | 253 | no | const clock = createClock({ speed, instant }); |
| frames | variable | 254 | no | let frames = turn.frames; |
| units | const | 256 | no | const units = unitsFromWsFrames(frames); |
| s | const | 257 | no | const s = synthesizeUnits(units, await synthTextP, { dialect: deltaDialect }); |
| code | const | 268 | no | const code = f.payload?.length &gt;= 2 ? f.payload.readUInt16BE(0) : 1000; |
| text | variable | 274 | no | let text = f.text ?? f.payload.toString(&#39;utf8&#39;); |
| r | const | 275 | no | const r = substituteText(text, pairs, { json: true }); |
| enqueue | function | 283 | no | const enqueue = (turn, pairs) =&gt; { |
| pickTurn | function | 288 | no | function pickTurn(msgText) { |
| candidates | const | 289 | no | const candidates = script.turns.filter((t) =&gt; t.index &gt; 0); |
| same | const | 291 | no | const same = candidates.find((t) =&gt; t.repeatable &amp;&amp; t.trigger.text === msgText); |
| remaining | const | 294 | no | const remaining = candidates.filter((t) =&gt; !played.has(t.index) &amp;&amp; !t.repeatable); |
| withText | const | 296 | no | const withText = remaining.filter((t) =&gt; t.trigger?.text !== null &amp;&amp; t.trigger?.text !== undefined); |
| best | variable | 298 | no | let best = remaining[0], bestScore = -1; |
| s | const | 300 | no | const s = textSimilarity(msgText, t.trigger.text) - (t.index - remaining[0].index) * 0.002; |
| turn | const | 309 | no | const turn = pickTurn(text); |
| pairs | const | 312 | no | const pairs = [...urlPairs, ...(text !== null &amp;&amp; turn.trigger?.text ? messagePairs(text, turn.trigger.text) : [])]; |
| server | const | 332 | no | const server = http.createServer((req, res) =&gt; { handle(req, res).catch(() =&gt; { try { res.destroy(); } catch { /* ignore */ } }); }); |
| onErr | function | 340 | no | const onErr = (e) =&gt; { server.off(&#39;listening&#39;, onOk); reject(e); }; |
| onOk | function | 341 | no | const onOk = () =&gt; { server.off(&#39;error&#39;, onErr); resolve(); }; |
| addr | const | 346 | no | const addr = server.address(); |
| shownHost | const | 347 | no | const shownHost = host === &#39;0.0.0.0&#39; \|\| host === &#39;::&#39; ? &#39;127.0.0.1&#39; : host.includes(&#39;:&#39;) ? `[${host}]` : host; |
| url | const | 348 | no | const url = `http://${shownHost}:${addr.port}`; |
| closed | variable | 350 | no | let closed = null; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:http | import | 20 | external |
| ./catalog.mjs | import | 21 | [studio/src/mirror/catalog.mjs](./catalog.mjs.md) |
| ./match.mjs | import | 22 | [studio/src/mirror/match.mjs](./match.mjs.md) |
| ./template.mjs | import | 23 | [studio/src/mirror/template.mjs](./template.mjs.md) |
| ./replay.mjs | import | 24 | [studio/src/mirror/replay.mjs](./replay.mjs.md) |
| ./synthesize.mjs | import | 25 | [studio/src/mirror/synthesize.mjs](./synthesize.mjs.md) |
| ./ws.mjs | import | 26 | [studio/src/mirror/ws.mjs](./ws.mjs.md) |
| ../replay/derive.mjs | import | 27 | [studio/src/replay/derive.mjs](../replay/derive.mjs.md) |
| ./catalog.mjs | export_from | 29 | [studio/src/mirror/catalog.mjs](./catalog.mjs.md) |
| ./match.mjs | export_from | 30 | [studio/src/mirror/match.mjs](./match.mjs.md) |
| ./synthesize.mjs | export_from | 31 | [studio/src/mirror/synthesize.mjs](./synthesize.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/selftest.mjs](../../bin/commands/selftest.mjs.md) | ../../src/mirror/index.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Local mirror: re-serves the endpoints captured in one session as a local streaming service.
//
//   const m = await startMirror({ session, port: 0, speed: 1, instant: false, synthesize: false, onRequest });
//   m.url / m.port / m.routes() / m.log() / await m.close()
//
// Matching    every request is scored against every captured exchange (method, path, query,
//             body; see match.mjs). exact > route (same templated path) > nearest fallback.
// Replay      original status, cleaned headers and body chunks with original timing
//             (speed factor, instant mode): SSE, chunked, NDJSON, plain bodies, EventSource
//             messages (re-framed as SSE) and WebSockets (RFC 6455, client-message-driven turns).
// Templating  variable request fields echoed by the response are substituted (template.mjs).
// Synthesize  streaming routes emit a reconstructed answer in the learned delta dialect
//             (synthesize.mjs). synthesize: true | string | async ({ request, route }) => string;
//             per request: ?__mirror_text=... or header x-mirror-text. Falls back to replay when
//             the dialect cannot be learned or the self-check fails.
// Control     GET /__mirror/routes | /__mirror/log | /__mirror/health (JSON).
// onRequest   called with each log entry twice: phase 'start' (after matching) and 'end'.
//
// Local only: binds 127.0.0.1 by default, never contacts the captured site.
import http from 'node:http';
import { loadCatalog, routeTableOf, loadExchangeRecords, openSession, STREAM_KINDS } from './catalog.mjs';
import { parseIncoming, findMatch, textSimilarity } from './match.mjs';
import { substitutionPairs, substituteParts, substituteText, messagePairs } from './template.mjs';
import { createClock, buildHttpPlan, sendHttpPlan, buildWsScript } from './replay.mjs';
import { unitsFromStreamEvents, unitsFromWsFrames, synthesizeUnits } from './synthesize.mjs';
import { acceptUpgrade, OP } from './ws.mjs';
import { reconstructStream } from '../replay/derive.mjs';

export { loadCatalog } from './catalog.mjs';
export { findMatch, parseIncoming, scoreExchange } from './match.mjs';
export { synthesizeUnits, learnDeltas } from './synthesize.mjs';

const MAX_BODY = 16 * 1024 * 1024;
const JSONISH = new Set(['sse', 'ndjson', 'eventsource', 'json', 'chunked', 'ws']);

// [{ method, path, kind, sid, count, ... }] — accepts a session (or path) or a loaded catalog.
export function buildRouteTable(session) {
  const catalog = session?.isMirrorCatalog ? session : loadCatalog(session);
  return routeTableOf(catalog);
}

function readBody(req, limit = MAX_BODY) {
  return new Promise((resolve, reject) => {
    const parts = [];
    let n = 0;
    req.on('data', (d) => { n += d.length; if (n > limit) { reject(Object.assign(new Error('request body too large'), { status: 413 })); req.destroy(); return; } parts.push(d); });
    req.on('end', () => resolve(Buffer.concat(parts)));
    req.on('error', reject);
  });
}

function sendJson(res, status, value, extra = []) {
  if (res.headersSent || res.destroyed) return;
  const body = Buffer.from(JSON.stringify(value, null, 2));
  res.writeHead(status, [['content-type', 'application/json; charset=utf-8'], ['cache-control', 'no-store'], ['content-length', String(body.length)], ...extra].flatMap((x) => x));
  res.end(body);
}

function corsHeaders(req, enabled) {
  if (!enabled) return [];
  const origin = req.headers.origin;
  const h = [['access-control-allow-origin', origin || '*'], ['access-control-expose-headers', '*']];
  if (origin) h.push(['access-control-allow-credentials', 'true'], ['vary', 'Origin']);
  return h;
}

export async function startMirror({
  session, port = 0, host = '127.0.0.1', speed = 1, instant = false, synthesize = false, onRequest,
  minScore = 35, fallback = true, cors = true, maxLog = 2000, dialect, cacheBytes = 256 * 1024 * 1024,
} = {}) {
  const sess = openSession(session);
  const catalog = loadCatalog(sess);
  const routeTable = routeTableOf(catalog);
  const deltaDialect = dialect ?? catalog.dialect ?? 'auto';
  const logs = [];
  let seq = 0, closing = false;
  const wsConns = new Set();
  const sockets = new Set();

  // LRU of loaded exchange records (bounded by approximate bytes).
```

_First 80 of 368 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

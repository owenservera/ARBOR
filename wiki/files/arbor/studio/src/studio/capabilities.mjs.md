# File: studio/src/studio/capabilities.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/capabilities.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 16786 B |
| Lines | 269 |
| Hash | 78e1908b16bf |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LIVE_EVENTS | const | 6 | yes | export const LIVE_EVENTS = [&#39;record&#39;, &#39;stream-open&#39;, &#39;event&#39;, &#39;text&#39;, &#39;stream-close&#39;, &#39;stream-update&#39;, &#39;lag&#39;, &#39;warn&#39;, &#39;close&#39;, &#39;target&#39;]; |
| str | const | 7 | no | const str = { type: &#39;string&#39; }; |
| bool | const | 8 | no | const bool = { type: &#39;boolean&#39; }; |
| pagination | const | 9 | no | const pagination = { offset: { type: &#39;integer&#39;, minimum: 0, maximum: 1000000 }, limit: { type: &#39;integer&#39;, minimum: 1, maximum: 1000 } }; |
| schema | function | 10 | no | const schema = (properties, required = []) =&gt; ({ type: &#39;object&#39;, properties, required }); |
| modules | const | 11 | no | const modules = { |
| routeTableCache | const | 18 | no | const routeTableCache = new Map(); |
| capability | function | 20 | no | async function capability(name, exports) { |
| boolean | function | 35 | no | function boolean(value, name, fallback) { |
| progressStream | function | 43 | no | function progressStream(res) { |
| write | function | 45 | no | const write = (frame) =&gt; { |
| timer | const | 50 | no | const timer = setInterval(() =&gt; write(`: heartbeat ${Date.now()}\\n\\n`), 15000); |
| registerCapabilities | function | 60 | yes | export function registerCapabilities({ add, recorder, profileStore, sessionOf, savedOnly, profileFor, selectedSessions, publish, deriving, invalidateReplay }) { |
| mirrors | const | 61 | no | const mirrors = new Map(), liveFeed = new EventFeed({ eventTypes: LIVE_EVENTS }); |
| progress | const | 62 | no | const progress = new Set(); |
| pendingMirrors | variable | 63 | no | let pendingMirrors = 0, tapPromise = null, tap = null, closed = false; |
| tapListeners | const | 64 | no | const tapListeners = []; |
| active | function | 65 | no | const active = () =&gt; { if (closed) throw problem(503, &#39;Integration hub is closing&#39;); }; |
| ensureTap | function | 67 | no | async function ensureTap() { |
| candidate | const | 73 | no | const candidate = await createLiveTap(recorder, { decode: true }); |
| listener | function | 81 | no | const listener = (data) =&gt; liveFeed.publish(type, data, recorder.session?.id ?? null); |
| s | const | 91 | no | const s = sessionOf(p.session); savedOnly(s); active(); |
| incremental | const | 92 | no | const incremental = boolean(body.incremental, &#39;incremental&#39;, true); |
| stages | const | 93 | no | const stages = body.stages; |
| profile | const | 97 | no | const profile = body.profile === undefined ? profileFor(s) : profileStore.load(storageName(body.profile, &#39;profile&#39;)); |
| stream | variable | 102 | no | let stream; |
| result | const | 106 | no | const result = await deriveAll(s, { profile, incremental, stages, onStage: (stage, detail) =&gt; stream?.send(&#39;stage&#39;, { session: s.id, ...(typeof stage === &#39;object&#39; &amp;&amp; stage !== null ? stage : { stage,… |
| data | const | 108 | no | const data = { session: s.id, ...result }; |
| artifactsFor | function | 117 | no | async function artifactsFor(id) { |
| s | const | 118 | no | const s = sessionOf(id); savedOnly(s); |
| artifacts | const | 134 | no | const artifacts = loaded?.artifacts ?? loaded; |
| key | const | 135 | no | const key = keys.find((key) =&gt; artifacts?.[key] !== undefined &amp;&amp; artifacts[key] !== null); |
| query | const | 142 | no | const query = text(q.q, &#39;q&#39;, 1000).trim(), limit = integer(q.limit, 100, 1000, 1); |
| cap | const | 143 | no | const cap = integer(q.sessions, 20, 100, 1); |
| mode | const | 144 | no | const mode = q.layer ?? &#39;all&#39;; |
| all | const | 147 | no | const all = q.session ? [sessionOf(q.session).meta] : selectedSessions({ site: q.site, origin: q.origin }); |
| selected | const | 148 | no | const selected = all.slice(0, cap), hits = [], failures = []; |
| backendHasMore | variable | 149 | no | let backendHasMore = false; |
| s | const | 152 | no | const s = sessionOf(meta.id); savedOnly(s); |
| result | const | 154 | no | const result = await searchSession(s, query, { limit: limit + 1 }); |
| items | const | 155 | no | const items = Array.isArray(result) ? result : result?.items ?? result?.hits ?? result?.results; |
| entity | const | 159 | no | const entity = [&#39;knowledge&#39;, &#39;entities&#39;, &#39;entity&#39;].includes(hit.layer ?? hit.kind) \|\| !!hit.eid; |
| hasMore | const | 170 | no | const hasMore = backendHasMore \|\| hits.length &gt; limit; |
| mirrorInfo | function | 174 | no | const mirrorInfo = ({ id, session, createdAt, instance }) =&gt; ({ id, session, createdAt, url: instance.url, port: instance.port }); |
| mirrorOf | function | 175 | no | const mirrorOf = (id) =&gt; { |
| mirror | const | 177 | no | const mirror = mirrors.get(id); |
| s | const | 183 | no | const s = sessionOf(text(body.session, &#39;session&#39;, 128)); savedOnly(s); |
| host | const | 185 | no | const host = body.host ?? &#39;127.0.0.1&#39;; |
| port | const | 187 | no | const port = integer(body.port, 0, 65535); |
| speed | const | 188 | no | const speed = body.speed ?? 1; |
| instant | const | 190 | no | const instant = boolean(body.instant, &#39;instant&#39;, false), synthesize = boolean(body.synthesize, &#39;synthesize&#39;, false); |
| instance | const | 197 | no | const instance = await startMirror({ session: s, host, port, speed, instant, synthesize }); |
| mirror | const | 199 | no | const mirror = { id: randomUUID(), session: s.id, createdAt: new Date().toISOString(), instance }; |
| removeMirror | function | 208 | no | async function removeMirror(id) { |
| mirror | const | 210 | no | const mirror = mirrorOf(id); |
| mirror | const | 222 | no | const mirror = mirrorOf(p.id); |
| requestLog | function | 225 | no | const requestLog = async ({ p, q }) =&gt; { |
| mirror | const | 227 | no | const mirror = mirrorOf(p.id), log = await mirror.instance.log(); |
| items | const | 228 | no | const items = Array.isArray(log) ? log : log?.items ?? log?.requests ?? []; |
| s | const | 234 | no | const s = sessionOf(p.session); savedOnly(s); |
| key | const | 236 | no | const key = s.dir ?? s.id; |
| pending | variable | 237 | no | let pending = routeTableCache.get(key); |
| closing | const | 262 | no | const closing = [...mirrors.values()].map(async (mirror) =&gt; { try { await mirror.instance.close(); mirrors.delete(mirror.id); } catch (e) { publish(&#39;warn&#39;, { message: `Mirror ${mirror.id} shutdown fa… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 2 | external |
| ./event-feed.mjs | import | 3 | [studio/src/studio/event-feed.mjs](./event-feed.mjs.md) |
| ./http.mjs | import | 4 | [studio/src/studio/http.mjs](./http.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/integration-hub.mjs](./integration-hub.mjs.md) | ./capabilities.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Optional, independently authored capabilities. Only load a backend when requested.
import { randomUUID } from 'node:crypto';
import { EventFeed } from './event-feed.mjs';
import { integer, page, problem, storageName, text } from './http.mjs';

export const LIVE_EVENTS = ['record', 'stream-open', 'event', 'text', 'stream-close', 'stream-update', 'lag', 'warn', 'close', 'target'];
const str = { type: 'string' };
const bool = { type: 'boolean' };
const pagination = { offset: { type: 'integer', minimum: 0, maximum: 1000000 }, limit: { type: 'integer', minimum: 1, maximum: 1000 } };
const schema = (properties, required = []) => ({ type: 'object', properties, required });
const modules = {
  derive: new URL('../replay/derive-all.mjs', import.meta.url),
  mirror: new URL('../mirror/index.mjs', import.meta.url),
  live: new URL('../capture/live-tap.mjs', import.meta.url),
};
// Route tables are a pure function of a saved session's files; cache per session dir so repeated
// reads and tool calls do not rescan every record.
const routeTableCache = new Map();

async function capability(name, exports) {
  let module;
  try { module = await import(modules[name].href); }
  catch (e) {
    if (['ERR_MODULE_NOT_FOUND', 'MODULE_NOT_FOUND', 'ENOENT'].includes(e.code)) {
      throw problem(501, `${name} capability is not installed yet`, 'CAPABILITY_UNAVAILABLE');
    }
    throw e;
  }
  if (exports.some((key) => typeof module[key] !== 'function')) {
    throw problem(501, `${name} capability does not provide the required exports yet`, 'CAPABILITY_UNAVAILABLE');
  }
  return module;
}

function boolean(value, name, fallback) {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') throw problem(400, `${name} must be boolean`);
  return value;
}

// No unbounded queue for a slow/disconnected progress consumer. Derivation itself finishes
// on disconnect, retaining its per-session lock until writes really finish.
function progressStream(res) {
  res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store, no-transform', connection: 'keep-alive', 'x-accel-buffering': 'no', 'x-content-type-options': 'nosniff' });
  const write = (frame) => {
    if (res.destroyed || res.writableEnded) return;
    if (res.writableLength + Buffer.byteLength(frame) > 512 * 1024) { res.destroy(); return; }
    res.write(frame);
  };
  const timer = setInterval(() => write(`: heartbeat ${Date.now()}\n\n`), 15000);
  timer.unref?.();
  res.once('close', () => clearInterval(timer));
  res.once('error', () => clearInterval(timer));
  return {
    send: (type, data) => write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`),
    close() { clearInterval(timer); if (!res.destroyed && !res.writableEnded) res.end(); },
  };
}

export function registerCapabilities({ add, recorder, profileStore, sessionOf, savedOnly, profileFor, selectedSessions, publish, deriving, invalidateReplay }) {
  const mirrors = new Map(), liveFeed = new EventFeed({ eventTypes: LIVE_EVENTS });
  const progress = new Set();
  let pendingMirrors = 0, tapPromise = null, tap = null, closed = false;
  const tapListeners = [];
  const active = () => { if (closed) throw problem(503, 'Integration hub is closing'); };

  async function ensureTap() {
    active();
    if (!tapPromise) {
      tapPromise = (async () => {
        const { createLiveTap } = await capability('live', ['createLiveTap']);
        active();
        const candidate = await createLiveTap(recorder, { decode: true });
        if (!candidate || typeof candidate.on !== 'function' || typeof candidate.off !== 'function') {
          candidate?.close?.();
          throw problem(501, 'Live tap event interface is unavailable', 'CAPABILITY_UNAVAILABLE');
        }
        if (closed) { candidate.close?.(); throw problem(503, 'Integration hub is closing'); }
        tap = candidate;
        for (const type of LIVE_EVENTS) {
```

_First 80 of 270 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

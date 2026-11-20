# File: studio/src/capture/live-tap.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/live-tap.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 29123 B |
| Lines | 585 |
| Hash | b222a607dddf |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LIVE_TAP_EVENTS | const | 51 | yes | export const LIVE_TAP_EVENTS = Object.freeze([&#39;record&#39;, &#39;stream-open&#39;, &#39;event&#39;, &#39;text&#39;, &#39;stream-update&#39;, &#39;stream-close&#39;, &#39;target&#39;, &#39;lag&#39;, &#39;close&#39;, &#39;warn&#39;]); |
| STRUCTURAL | const | 54 | no | const STRUCTURAL = new Set([&#39;run.start&#39;, &#39;run.end&#39;, &#39;req&#39;, &#39;res&#39;, &#39;done&#39;, &#39;fail&#39;, &#39;ws.open&#39;, &#39;ws.close&#39;, &#39;ws.error&#39;, &#39;ws.handshake&#39;, &#39;body.excluded&#39;, &#39;body.truncated&#39;, &#39;stream.armed&#39;, &#39;stream.arm_fai… |
| kindMatcher | function | 58 | yes | export function kindMatcher(kinds) { |
| list | function | 62 | no | const list = (typeof kinds === &#39;string&#39; ? kinds.split(&#39;,&#39;) : [...kinds]).map((s) =&gt; String(s).trim()).filter(Boolean); |
| exact | const | 63 | no | const exact = new Set(), prefixes = []; |
| approxSize | function | 71 | no | function approxSize(rec) { |
| now | function | 76 | no | const now = () =&gt; (globalThis.performance?.now ? globalThis.performance.now() : Date.now()); |
| LiveTap | class | 78 | yes | export class LiveTap extends EventEmitter { |
| constructor | method | 79 | yes | constructor(source, { kinds = null, decode = true, text = true, plainText = true, streams = &#39;data&#39;, deltaDialect = null, maxQueue = 50_000, maxQueueBytes = 64 * 1024 * 1024, sliceMs = 8, sync = false… |
| _hookRaw | method | 136 | yes | _hookRaw() { |
| raw | const | 137 | no | const raw = this.source?.session?.raw; |
| ingest | method | 145 | yes | ingest(rec) { |
| size | const | 149 | no | const size = approxSize(rec); |
| depth | const | 150 | no | const depth = this.queue.length - this.qHead; |
| _drop | method | 163 | yes | _drop(rec) { |
| started | variable | 165 | no | let started = false; |
| _degradeLater | method | 182 | yes | _degradeLater(sid, reason) { |
| p | const | 183 | no | const p = this._pendingDegrade.get(sid) ?? { n: 0, reasons: new Set() }; |
| _schedule | method | 188 | yes | _schedule() { |
| _drain | method | 194 | yes | _drain(budgetMs = this.sliceMs) { |
| deadline | const | 196 | no | const deadline = now() + Math.max(1, budgetMs); |
| item | const | 198 | no | const item = this.queue[this.qHead]; |
| l | const | 207 | no | const l = this._lag; this._lag = null; |
| _safeEmit | method | 213 | yes | _safeEmit(evt, payload) { |
| _processSafe | method | 223 | yes | _processSafe(rec) { |
| _newStream | method | 235 | yes | _newStream(sid, init, rec) { |
| st | const | 237 | no | const st = { |
| _lateStream | method | 250 | yes | _lateStream(rec, kind) { |
| known | const | 251 | no | const known = this.source?.reducer?.streams?.get?.(rec.sid); |
| st | const | 252 | no | const st = this._newStream(rec.sid, { kind, joinedLate: true, url: known?.url, method: known?.method, mime: known?.mime, target: known?.target, startedT: known?.startedT ?? rec.t, }, rec); |
| _get | method | 262 | yes | _get(rec, kind) { |
| _degrade | method | 267 | yes | _degrade(st, reason, n = 1) { |
| _applyPendingDegrade | method | 273 | yes | _applyPendingDegrade(st) { |
| p | const | 274 | no | const p = this._pendingDegrade.get(st.sid); |
| _transport | method | 282 | yes | _transport(st) { |
| _open | method | 286 | yes | _open(st, rec) { |
| _refreshTransport | method | 297 | yes | _refreshTransport(st) { |
| t | const | 299 | no | const t = this._transport(st); |
| _dialect | method | 307 | yes | _dialect() { |
| _process | method | 314 | yes | _process(rec) { |
| prev | const | 326 | no | const prev = this.streams.get(rec.sid); |
| st | const | 328 | no | const st = this._newStream(rec.sid, { kind: &#39;http&#39;, url: rec.url, method: rec.method, resourceType: rec.type, target: rec.target, policy: rec.policy }, rec); |
| st | const | 333 | no | const st = this._get(rec, &#39;http&#39;); if (!st) break; |
| prev | const | 343 | no | const prev = this.streams.get(rec.sid); |
| st | const | 345 | no | const st = this._newStream(rec.sid, { kind: &#39;ws&#39;, url: rec.url, target: rec.target, lateJoin: !!rec.lateJoin, policy: rec.policy }, rec); |
| _bytes | method | 368 | yes | _bytes(st, rec) { |
| buf | const | 370 | no | const buf = Buffer.from(rec.b64 ?? &#39;&#39;, &#39;base64&#39;); |
| evs | variable | 373 | no | let evs = []; |
| _plainBytes | method | 387 | yes | _plainBytes(st, buf, rec) { |
| s | const | 391 | no | const s = st.sd.write(buf); |
| _appendPlain | method | 395 | yes | _appendPlain(st, s, rec) { |
| _eventSource | method | 403 | yes | _eventSource(st, rec) { |
| env | const | 406 | no | const env = sniffEnvelope(rec.data ?? &#39;&#39;); |
| ev | const | 407 | no | const ev = { type: &#39;eventsource&#39;, event: rec.eventName \|\| &#39;message&#39;, id: rec.eventId \|\| undefined, data: rec.data, browserParsed: true }; |
| trimmed | const | 411 | no | const trimmed = String(rec.data ?? &#39;&#39;).trim(); |
| _frame | method | 419 | yes | _frame(st, rec) { |
| size | const | 422 | no | const size = rec.opcode === 2 ? Buffer.from(rec.payload ?? &#39;&#39;, &#39;base64&#39;).length : Buffer.byteLength(rec.payload ?? &#39;&#39;); |
| evs | variable | 424 | no | let evs = []; |
| _emitDecoded | method | 439 | yes | _emitDecoded(st, evs, rec, view) { |
| wantEvent | const | 441 | no | const wantEvent = this.listenerCount(&#39;event&#39;) &gt; 0; |
| secondary | const | 447 | no | const secondary = st.primaryView !== view; |
| forDelta | const | 448 | no | const forDelta = ev.jsonNested?.json !== undefined ? ev.jsonNested.json : ev.json; |
| dialect | variable | 449 | no | let dialect = null, applied = false, revision; |
| declared | const | 452 | no | const declared = st.delta.dialect === &#39;auto&#39; ? detectDialect(forDelta) : st.delta.dialect; |
| _text | method | 472 | yes | _text(st, rec, revision) { |
| a | const | 474 | no | const a = st.delta; |
| prev | const | 475 | no | const prev = st.lastText ?? &#39;&#39;; |
| text | variable | 476 | no | let text, path; |
| v | const | 478 | no | const v = a.textOf(st.lastPath); |
| blocks | const | 482 | no | const blocks = a.blocks(); |
| joined | const | 483 | no | const joined = blocks.map((b) =&gt; (typeof b.text === &#39;string&#39; ? b.text : &#39;&#39;)).filter(Boolean).join(&#39;\\n&#39;); |
| appended | const | 488 | no | const appended = prev.length &gt; 0 &amp;&amp; text.startsWith(prev); |
| delta | const | 489 | no | const delta = appended \|\| !prev ? text.slice(prev.length) : text; |
| _finish | method | 498 | yes | _finish(st, rec, status) { |
| evs | variable | 504 | no | let evs = []; |
| _streamStats | method | 519 | yes | _streamStats(st) { |
| d | const | 520 | no | const d = st.delta?.stats?.(); |
| openStreams | method | 538 | yes | openStreams() { |
| textOf | method | 546 | yes | textOf(sid) { return this.streams.get(sid)?.lastText; } |
| flush | method | 549 | yes | flush() { while (this.qHead &lt; this.queue.length) this._drain(1e9); } |
| stats | method | 551 | yes | stats() { |
| open | variable | 552 | no | let open = 0, degraded = 0; |
| close | method | 563 | yes | close({ flush = true } = {}) { |
| src | const | 566 | no | const src = this.source; |
| createLiveTap | function | 583 | yes | export function createLiveTap(recorder, opts = {}) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:events | import | 44 | external |
| node:string_decoder | import | 45 | external |
| ../decode/decoders.mjs | import | 46 | [studio/src/decode/decoders.mjs](../decode/decoders.mjs.md) |
| ../decode/delta.mjs | import | 47 | [studio/src/decode/delta.mjs](../decode/delta.mjs.md) |
| ../replay/reducer.mjs | import | 48 | [studio/src/replay/reducer.mjs](../replay/reducer.mjs.md) |
| ./redact.mjs | import | 49 | [studio/src/capture/redact.mjs](./redact.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/capture/recorder.mjs](./recorder.mjs.md) | ./live-tap.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Live decoded-event tap: real-time view of a recording while it is still running.
//
//   const tap = createLiveTap(recorder, { kinds, decode = true });   // or recorder.tap(opts)
//   tap.on('text', ({ sid, delta, text }) => process.stdout.write(delta));
//
// Events (all payloads are plain objects; listeners run on a deferred tick, never inside the
// recorder's append path):
//   'record'        raw record exactly as persisted ({ seq, t, k, ... }), filtered by `kinds`
//   'stream-open'   { sid, url, transport, kind, method, mime, target, joinedLate, t }
//   'event'         { sid, seq, t, data, dialect, applied, revision, view, degraded }
//                   data = the decoded L2 event (SSE event, NDJSON line, WS frame, ...);
//                   dialect = delta dialect of its JSON payload ('json-patch', 'typed-events',
//                   'document', ...) or null when the payload is not reconstructable.
//   'text'          { sid, seq, t, delta, text, path, revision, replaced }
//                   live delta assembly: `text` is the current human-visible text of the
//                   stream, `delta` the appended suffix (or the whole text when replaced=true).
//   'stream-update' { sid, transport, from, appProtocol }   transport refined after open
//   'stream-close'  { sid, t, stats }
//   'target'        { targetId, type, url, tag, role, state }   recorded tab / popup / worker
//   'lag'           { state: 'dropping' | 'recovered', droppedRecords, sids, since }
//   'close'         {}
//
// Options:
//   kinds        which raw records reach 'record': null/'*' = all, array/Set/comma string of
//                record kinds ('chunk', 'ws.frame'; prefix wildcards like 'ws.*'), or a predicate.
//                Stream decoding always sees every record regardless of this filter.
//   decode       true (default): incremental per-stream decoding (AutoDecoder / WsFrameDecoder)
//                and live delta assembly (DeltaAssembler). false: structure only.
//   text         true (default): emit 'text'. plainText (default true) also streams raw
//                text/plain bodies and non-JSON SSE data as text.
//   streams      'data' (default): a stream opens when its first payload arrives;
//                'all': every observed request / socket opens (metadata-only ones included).
//   deltaDialect delta dialect override; default = the recorder profile's decode.delta or 'auto'.
//   maxQueue / maxQueueBytes / sliceMs / sync   backpressure controls (see below).
//
// Backpressure: Chrome cannot be slowed down, and the recorder must never wait for a viewer.
// Records are queued (bounded by maxQueue records and maxQueueBytes) and drained in time slices
// of sliceMs. When the tap falls behind, PAYLOAD records (chunks, frames, messages) are dropped
// first, never structure (req/res/done/fail/ws.open/ws.close/run.*), so streams still open and
// close correctly. Every affected stream is marked degraded with a count, a 'lag' event is
// emitted at the start and the end of the episode, and the durable raw log is unaffected (the
// tap is a preview; disk remains the source of truth). Drops by the raw log itself (local disk
// queue overflow) are detected too and degrade the affected streams the same way.
import { EventEmitter } from 'node:events';
import { StringDecoder } from 'node:string_decoder';
import { AutoDecoder, WsFrameDecoder, decodeWsPayload, sniffEnvelope, unwrapNestedJson } from '../decode/decoders.mjs';
import { DeltaAssembler, detectDialect } from '../decode/delta.mjs';
import { transportOf } from '../replay/reducer.mjs';
import { redactUrl } from './redact.mjs';

export const LIVE_TAP_EVENTS = Object.freeze(['record', 'stream-open', 'event', 'text', 'stream-update', 'stream-close', 'target', 'lag', 'close', 'warn']);

// Structural records are tiny and keep stream lifecycles correct; they are never dropped.
const STRUCTURAL = new Set(['run.start', 'run.end', 'req', 'res', 'done', 'fail', 'ws.open', 'ws.close', 'ws.error', 'ws.handshake',
  'body.excluded', 'body.truncated', 'stream.armed', 'stream.arm_failed', 'gap', 'reconnect.attempt', 'reconnect.ok', 'reconnect.failed',
  'pause', 'resume', 'lifecycle', 'nav']);

export function kindMatcher(kinds) {
  if (kinds === undefined || kinds === null || kinds === '*' || kinds === true) return () => true;
  if (kinds === false) return () => false;
  if (typeof kinds === 'function') return (rec) => { try { return !!kinds(rec); } catch { return false; } };
  const list = (typeof kinds === 'string' ? kinds.split(',') : [...kinds]).map((s) => String(s).trim()).filter(Boolean);
  const exact = new Set(), prefixes = [];
  for (const k of list) {
    if (k === '*') return () => true;
    if (k.endsWith('*')) prefixes.push(k.slice(0, -1)); else exact.add(k);
  }
  return (rec) => exact.has(rec.k) || (prefixes.length > 0 && prefixes.some((p) => String(rec.k).startsWith(p)));
}

function approxSize(rec) {
  return 256 + (rec.b64?.length ?? 0) + (typeof rec.payload === 'string' ? rec.payload.length : 0) + (typeof rec.data === 'string' ? rec.data.length : 0)
    + (Array.isArray(rec.items) ? rec.items.length * 128 : 0);
}

const now = () => (globalThis.performance?.now ? globalThis.performance.now() : Date.now());

export class LiveTap extends EventEmitter {
  constructor(source, {
    kinds = null, decode = true, text = true, plainText = true, streams = 'data', deltaDialect = null,
```

_First 80 of 586 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

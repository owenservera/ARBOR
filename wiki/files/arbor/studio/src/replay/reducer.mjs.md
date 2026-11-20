# File: studio/src/replay/reducer.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/replay/reducer.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 28710 B |
| Lines | 508 |
| Hash | afcaee392f03 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| decoderInfo | function | 11 | yes | export function decoderInfo(dec, ws = null) { |
| out | const | 13 | no | const out = {}; |
| st | const | 21 | no | const st = dec.stats; |
| STREAMING_TRANSPORTS | const | 32 | yes | export const STREAMING_TRANSPORTS = Object.freeze([&#39;HTTP_SSE&#39;, &#39;HTTP_NDJSON&#39;, &#39;HTTP_STREAMED&#39;, &#39;EVENT_SOURCE&#39;, &#39;WEBSOCKET&#39;]); |
| STREAMING_SET | const | 33 | no | const STREAMING_SET = new Set(STREAMING_TRANSPORTS); |
| transportOf | function | 35 | yes | export function transportOf(stream) { |
| transportDetailOf | function | 46 | yes | export function transportDetailOf(stream) { |
| isStreaming | function | 60 | yes | export function isStreaming(stream) { |
| SEQ_FIELDS | const | 64 | no | const SEQ_FIELDS = [&#39;seq&#39;, &#39;sequence&#39;, &#39;sequence_number&#39;, &#39;sequenceNumber&#39;, &#39;offset&#39;, &#39;event_seq&#39;, &#39;revision&#39;, &#39;version&#39;, &#39;frame&#39;]; |
| StreamReducer | class | 66 | yes | export class StreamReducer { |
| constructor | method | 71 | yes | constructor({ deltaDialect = &#39;auto&#39;, keepEvents = true, maxEventsPerStream = Infinity, stallMs = 5000, deltaOpsLog = 0, deltaSnapshotEvery = 0, jsonMaxBytes = 0, roleClassifier = classifyStreamRole }… |
| _stream | method | 92 | yes | _stream(sid, init = {}) { |
| s | variable | 93 | no | let s = this.streams.get(sid); |
| _touchAll | method | 116 | yes | _touchAll() { for (const s of this.streams.values()) { s._sum.base = null; s._sum.role = null; } } |
| _touch | method | 117 | yes | _touch(sid) { const s = this.streams.get(sid); if (s) { s._sum.base = null; s._sum.role = null; } return s; } |
| _emitEvents | method | 119 | yes | _emitEvents(s, evs, rec, out) { |
| ev | const | 121 | no | const ev = evs[idx]; |
| e | const | 124 | no | const e = { sid: s.sid, seq: rec.seq, t: rec.t, layer: &#39;L2&#39;, ...(ev.n === undefined ? { n: idx } : { evn: idx }), ...ev }; |
| j | const | 142 | no | const j = ev.json; |
| k | variable | 144 | no | let k; |
| key | const | 147 | no | const key = `${k}\|${j.type ?? &#39;&#39;}`; |
| forDelta | const | 159 | no | const forDelta = ev.jsonNested?.json !== undefined ? ev.jsonNested.json : ev.json; |
| _ensureDecoder | method | 177 | yes | _ensureDecoder(s) { |
| _timing | method | 182 | yes | _timing(s, rec) { |
| d | const | 185 | no | const d = rec.t - s.lastChunkT; |
| ingest | method | 195 | yes | ingest(rec) { |
| out | const | 196 | no | const out = []; |
| s | const | 201 | no | const s = this._stream(rec.sid, { url: rec.url, method: rec.method, resourceType: rec.type, startedT: rec.t, frameId: rec.frameId, initiator: rec.initiator, target: rec.target }); |
| env | const | 206 | no | const env = sniffEnvelope(rec.postData); |
| s | const | 216 | no | const s = this._stream(rec.sid); |
| s | const | 226 | no | const s = this._stream(rec.sid); |
| buf | const | 227 | no | const buf = Buffer.from(rec.b64 ?? &#39;&#39;, &#39;base64&#39;); |
| dec | const | 234 | no | const dec = this._ensureDecoder(s); |
| s | const | 249 | no | const s = this._stream(rec.sid); |
| env | const | 252 | no | const env = sniffEnvelope(rec.data ?? &#39;&#39;); |
| ev | const | 253 | no | const ev = { type: &#39;eventsource&#39;, event: rec.eventName \|\| &#39;message&#39;, id: rec.eventId \|\| undefined, data: rec.data, browserParsed: true }; |
| trimmed | const | 257 | no | const trimmed = String(rec.data ?? &#39;&#39;).trim(); |
| s | const | 272 | no | const s = this._stream(rec.sid, { kind: &#39;ws&#39; }); |
| size | const | 274 | no | const size = rec.opcode === 2 ? Buffer.from(rec.payload ?? &#39;&#39;, &#39;base64&#39;).length : Buffer.byteLength(rec.payload ?? &#39;&#39;); |
| evs | const | 279 | no | const evs = s._ws.push({ opcode: rec.opcode, payload: rec.payload, dir: rec.dir, t: rec.t }); |
| b | const | 299 | no | const b = this.dom.blocks.get(m.id) ?? { id: m.id, sig: m.sig, firstT: rec.t, revisions: 0 }; |
| ingestAll | method | 322 | yes | ingestAll(records) { |
| out | const | 323 | no | const out = []; |
| ingestStream | method | 328 | yes | async ingestStream(asyncRecords, onEvents) { |
| n | variable | 329 | no | let n = 0; |
| evs | const | 331 | no | const evs = this.ingest(rec); |
| _finish | method | 338 | yes | _finish(s, rec, out) { |
| _streamSummary | method | 349 | yes | _streamSummary(s) { |
| d | const | 350 | no | const d = s._delta; |
| o | const | 351 | no | const o = { |
| dur | const | 367 | no | const dur = (s.endT ?? s.lastChunkT) - s.firstChunkT; |
| _roleFor | method | 380 | yes | _roleFor(s, base) { |
| events | const | 382 | no | const events = this.keepEvents ? s._events : []; |
| summaryRow | const | 383 | no | const summaryRow = !this.keepEvents &amp;&amp; base.events &gt; 0 &amp;&amp; !(base.eventsOnlyOnDisk &gt; 0) ? { ...base, eventsOnlyOnDisk: base.events } : base; |
| map | variable | 384 | no | let map = null; |
| det | const | 387 | no | const det = detectStreamMap(events); |
| r | const | 391 | no | const r = this.roleClassifier({ summary: summaryRow, events, assembled: s._delta.revisions &gt; 0 ? this.assembled(s.sid) : null, map }); |
| role | const | 393 | no | const role = { role: r.role, confidence: r.confidence, evidence: r.evidence, coverage: r.coverage ?? null }; |
| streamRole | method | 399 | yes | streamRole(sid) { |
| s | const | 400 | no | const s = this.streams.get(sid); |
| r | const | 403 | no | const r = this._roleFor(s, s._sum.base); |
| summary | method | 410 | yes | summary({ now = Date.now(), includeStreamRoles = false } = {}) { |
| streams | const | 415 | no | const streams = []; |
| base | variable | 417 | no | let base = s._sum.base; |
| o | const | 419 | no | const o = { ...base }; |
| r | const | 427 | no | const r = this._roleFor(s, base); |
| ep | function | 436 | no | const ep = (s) =&gt; { try { const u = new URL(s.url); return `${s.method ?? s.kind}\|${u.host}${u.pathname}`; } catch { return s.url; } }; |
| byEndpoint | const | 437 | no | const byEndpoint = new Map(); |
| s | const | 442 | no | const s = list[i]; |
| next | const | 444 | no | const next = list.slice(i + 1).find((x) =&gt; (x.startedT ?? Infinity) &gt;= s.endT &amp;&amp; x.startedT - s.endT &lt; 60_000 &amp;&amp; !x.reconnectOf); |
| depth | variable | 453 | no | let depth = 0; |
| counts | const | 457 | no | const counts = {}; |
| detailCounts | const | 458 | no | const detailCounts = {}; |
| roleCounts | const | 463 | no | const roleCounts = includeStreamRoles ? Object.fromEntries(STREAM_ROLES.map((r) =&gt; [r, streams.filter((x) =&gt; x.role === r).length])) : undefined; |
| eventsOf | method | 476 | yes | eventsOf(sid) { return this.streams.get(sid)?._events ?? []; } |
| deltaOf | method | 477 | yes | deltaOf(sid) { return this.streams.get(sid)?._delta ?? null; } |
| decoderOf | method | 478 | yes | decoderOf(sid) { const s = this.streams.get(sid); return s ? decoderInfo(s._dec, s._ws) : null; } |
| textOf | method | 479 | yes | textOf(sid) { return this.streams.get(sid)?._delta?.primaryText?.(1); } |
| assembled | method | 480 | yes | assembled(sid) { |
| s | const | 481 | no | const s = this.streams.get(sid); |
| assembledAll | method | 485 | yes | assembledAll({ minRevisions = 1 } = {}) { |
| out | const | 486 | no | const out = {}; |
| timeline | method | 491 | yes | timeline({ limit = 500 } = {}) { |
| rows | const | 492 | no | const rows = [ |
| rawBytesOf | method | 500 | yes | rawBytesOf() { return null; } // raw bytes are read back from disk on demand (see replay/derive.mjs) |
| replay | method | 503 | yes | static replay(records, opts = {}) { |
| r | const | 504 | no | const r = new StreamReducer(opts); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../decode/decoders.mjs | import | 4 | [studio/src/decode/decoders.mjs](../decode/decoders.mjs.md) |
| ../decode/delta.mjs | import | 5 | [studio/src/decode/delta.mjs](../decode/delta.mjs.md) |
| ./stream-role.mjs | import | 6 | [studio/src/replay/stream-role.mjs](./stream-role.mjs.md) |
| ../profiles/stream-map.mjs | import | 7 | [studio/src/profiles/stream-map.mjs](../profiles/stream-map.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/replay.mjs](../../bin/commands/replay.mjs.md) | ../../src/replay/reducer.mjs |
| [studio/scripts/categorization-scoreboard.mjs](../../scripts/categorization-scoreboard.mjs.md) | ../src/replay/reducer.mjs |
| [studio/scripts/fidelity-survey.mjs](../../scripts/fidelity-survey.mjs.md) | ../src/replay/reducer.mjs |
| [studio/scripts/induce-vs-handmap.mjs](../../scripts/induce-vs-handmap.mjs.md) | ../src/replay/reducer.mjs |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/replay/reducer.mjs |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/replay/reducer.mjs |
| [studio/src/capture/live-tap.mjs](../capture/live-tap.mjs.md) | ../replay/reducer.mjs |
| [studio/src/capture/recorder.mjs](../capture/recorder.mjs.md) | ../replay/reducer.mjs |
| [studio/src/families/families.mjs](../families/families.mjs.md) | ../replay/reducer.mjs |
| [studio/src/replay/derive.mjs](./derive.mjs.md) | ./reducer.mjs |
| [studio/src/studio/integration-hub.mjs](../studio/integration-hub.mjs.md) | ../replay/reducer.mjs |
| [studio/src/studio/server.mjs](../studio/server.mjs.md) | ../replay/reducer.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// StreamReducer: turns raw L1 records into stream state + decoded L2 events.
// Used identically by the live recorder and by offline replay/derive, so the live view and
// a later reconstruction from disk cannot disagree.
import { pickAutoDecoder, decodeWsPayload, classifyMime, WsFrameDecoder, sniffEnvelope, unwrapNestedJson, AutoDecoder } from '../decode/decoders.mjs';
import { DeltaAssembler } from '../decode/delta.mjs';
import { classifyStreamRole, STREAM_ROLES } from './stream-role.mjs';
import { detectStreamMap, applyStreamMap } from '../profiles/stream-map.mjs';

// Content-free diagnostics of the decoder a stream actually used: declared vs sniffed framing,
// late re-sniff switches and the inner decoder's counters. Safe for receipts and timelines.
export function decoderInfo(dec, ws = null) {
  if (!dec && !ws) return null;
  const out = {};
  if (dec) {
    out.kind = dec.kind ?? null;
    out.inner = dec.inner?.constructor?.name ?? dec.constructor?.name ?? null;
    if (dec instanceof AutoDecoder) {
      Object.assign(out, { auto: true, declared: classifyMime(dec.mime), forced: dec.forced ?? null,
        switched: dec.switched ?? null, chunks: dec.chunkCount, emitted: dec.emitted, sniffedBytes: dec.headBytes });
    }
    const st = dec.stats;
    if (st && typeof st === 'object') { try { out.stats = JSON.parse(JSON.stringify(st)); } catch { /* counters only */ } }
  }
  if (ws) {
    out.ws = { protocol: ws.dominantProtocol?.() ?? null };
    if (ws.stats && typeof ws.stats === 'object') { try { out.ws.stats = JSON.parse(JSON.stringify(ws.stats)); } catch { /* ignore */ } }
  }
  return out;
}

// Transport vocabulary kept stable for receipts and downstream consumers.
export const STREAMING_TRANSPORTS = Object.freeze(['HTTP_SSE', 'HTTP_NDJSON', 'HTTP_STREAMED', 'EVENT_SOURCE', 'WEBSOCKET']);
const STREAMING_SET = new Set(STREAMING_TRANSPORTS);

export function transportOf(stream) {
  if (stream.kind === 'ws') return 'WEBSOCKET';
  if (stream.esMessages > 0) return 'EVENT_SOURCE';
  if (stream.decoder === 'sse') return 'HTTP_SSE';
  if (stream.decoder === 'ndjson' || stream.decoder === 'jsonseq') return 'HTTP_NDJSON';
  if (stream.decoder === 'chunked-json' || stream.decoder === 'grpc' || stream.decoder === 'length-prefixed') return 'HTTP_STREAMED';
  if (stream.chunks > 1) return 'HTTP_STREAMED';
  return 'HTTP';
}

// Finer-grained framing name; always a refinement of transportOf, never a replacement.
export function transportDetailOf(stream) {
  if (stream.kind === 'ws') return stream.appProtocol ? `WEBSOCKET_${String(stream.appProtocol).toUpperCase().replace(/[^A-Z0-9]+/g, '_')}` : 'WEBSOCKET';
  if (stream.esMessages > 0) return 'EVENT_SOURCE';
  switch (stream.decoder) {
    case 'sse': return 'HTTP_SSE';
    case 'ndjson': return 'HTTP_NDJSON';
    case 'jsonseq': return 'HTTP_JSON_SEQ';
    case 'chunked-json': return 'HTTP_CHUNKED_JSON';
    case 'length-prefixed': return 'HTTP_LENGTH_PREFIXED';
    case 'grpc': return 'GRPC';
    default: return stream.chunks > 1 ? 'HTTP_STREAMED' : 'HTTP';
  }
}

export function isStreaming(stream) {
  return STREAMING_SET.has(stream?.transport ?? transportOf(stream ?? {}));
}

const SEQ_FIELDS = ['seq', 'sequence', 'sequence_number', 'sequenceNumber', 'offset', 'event_seq', 'revision', 'version', 'frame'];

export class StreamReducer {
  // jsonMaxBytes (0 = unlimited, the default for every reader: derive, mirror, export, eval). Only a
  // live recorder sets it: a JSON value larger than the cap is emitted as an oversize marker with
  // no parsed json. Read when a stream's decoder is created, so set it before the first chunk.
  // roleClassifier (injectable for tests): only ever called on explicit opt-in, see summary({ includeStreamRoles }).
  constructor({ deltaDialect = 'auto', keepEvents = true, maxEventsPerStream = Infinity, stallMs = 5000, deltaOpsLog = 0, deltaSnapshotEvery = 0, jsonMaxBytes = 0, roleClassifier = classifyStreamRole } = {}) {
    this.roleClassifier = roleClassifier;
    this.jsonMaxBytes = jsonMaxBytes;
    this.maxEventsPerStream = maxEventsPerStream; // live view is bounded; disk keeps everything
    this.streams = new Map();
    this.deltaDialect = deltaDialect;
    this.deltaOpsLog = deltaOpsLog;
    this.deltaSnapshotEvery = deltaSnapshotEvery;
    this.keepEvents = keepEvents;
    this.stallMs = stallMs;
```

_First 80 of 509 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

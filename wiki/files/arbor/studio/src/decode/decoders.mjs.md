# File: studio/src/decode/decoders.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/decode/decoders.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 55368 B |
| Lines | 1092 |
| Hash | 361477813a27 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NL | const | 24 | yes | export const NL = 0x0a, CR = 0x0d, RS = 0x1e, TAB = 0x09, SP = 0x20; |
| isWs | function | 26 | no | const isWs = (b) =&gt; b === SP \|\| b === TAB \|\| b === NL \|\| b === CR; |
| parseJsonSafe | function | 28 | yes | export function parseJsonSafe(text) { |
| t | const | 30 | no | const t = text.trim(); |
| c | const | 32 | no | const c = t[0]; |
| tryJson | function | 38 | no | const tryJson = (t) =&gt; { |
| s | const | 40 | no | const s = t.trim(); |
| LineSplitter | class | 48 | yes | export class LineSplitter { |
| constructor | method | 49 | yes | constructor() { this.buf = Buffer.alloc(0); this.offset = 0; } |
| push | method | 53 | yes | push(chunk) { |
| lines | const | 54 | no | const lines = []; |
| data | const | 55 | no | const data = this.buf.length ? Buffer.concat([this.buf, chunk]) : chunk; |
| base | const | 56 | no | const base = this.offset; |
| start | variable | 57 | no | let start = 0; |
| b | const | 59 | no | const b = data[i]; |
| crlf | const | 62 | no | const crlf = b === CR &amp;&amp; data[i + 1] === NL; |
| rest | method | 72 | yes | rest() { return this.buf.length ? { line: this.buf, start: this.offset, end: this.offset + this.buf.length } : null; } |
| finish | method | 76 | yes | finish() { |
| n | const | 77 | no | const n = this.buf.length; |
| start | const | 79 | no | const start = this.offset, end = this.offset + n; |
| line | const | 80 | no | const line = this.buf.subarray(0, n - 1); |
| JsonStreamScanner | class | 93 | yes | export class JsonStreamScanner { |
| constructor | method | 94 | yes | constructor({ unwrapArray = &#39;auto&#39;, maxValueBytes = 64 * 1024 * 1024 } = {}) { |
| _abs | method | 111 | yes | _abs(i) { return this.absBase + i; } |
| push | method | 113 | yes | push(chunk) { |
| out | const | 115 | no | const out = []; |
| i | variable | 116 | no | let i = this.scanPos; |
| emit | function | 117 | no | const emit = (endIdx, flags) =&gt; { |
| raw | const | 118 | no | const raw = this.tail.subarray(this.vStart, endIdx); |
| b | const | 123 | no | const b = this.tail[i]; |
| j | variable | 128 | no | let j = i + 1; |
| n | const | 131 | no | const n = this.tail[j]; |
| keepFrom | const | 161 | no | const keepFrom = this.started ? this.vStart : i; |
| rest | method | 167 | yes | rest() { |
| raw | const | 169 | no | const raw = this.tail.subarray(this.vStart); |
| SSE_TERMINAL_DATA | const | 178 | no | const SSE_TERMINAL_DATA = new Set([&#39;[DONE]&#39;, &#39;DONE&#39;, &#39;[done]&#39;, &#39;done&#39;, &#39;&quot;[DONE]&quot;&#39;]); |
| SSE_TERMINAL_EVENT | const | 179 | no | const SSE_TERMINAL_EVENT = /^(done\|complete\|completed\|end\|close\|closed\|finish\|finished\|stream_end\|message_stop\|response\\.completed)$/i; |
| HEARTBEAT_TEXT | const | 180 | no | const HEARTBEAT_TEXT = new Set([&#39;&#39;, &#39;ping&#39;, &#39;PING&#39;, &#39;pong&#39;, &#39;PONG&#39;, &#39;heartbeat&#39;, &#39;keepalive&#39;, &#39;keep-alive&#39;, &#39;h&#39;, &#39;{}&#39;, &#39;[]&#39;, &#39;2&#39;, &#39;3&#39;, &#39;0&#39;, &#39;\\n&#39;]); |
| SseDecoder | class | 182 | yes | export class SseDecoder { |
| constructor | method | 183 | yes | constructor({ bomStrip = true } = {}) { |
| _reset | method | 194 | yes | _reset() { this.cur = { data: [], event: undefined, id: undefined, retry: undefined, comments: [], unknown: {}, start: null }; } |
| _dispatch | method | 195 | yes | _dispatch(end) { |
| c | const | 196 | no | const c = this.cur; |
| hasContent | const | 197 | no | const hasContent = c.data.length \|\| c.event !== undefined \|\| c.id !== undefined \|\| c.retry !== undefined \|\| c.comments.length \|\| Object.keys(c.unknown).length; |
| data | const | 200 | no | const data = c.data.join(&#39;\\n&#39;); |
| ev | const | 201 | no | const ev = { type: &#39;sse&#39;, event: c.event ?? &#39;message&#39;, data, span: [c.start, end], index: this.count++ }; |
| env | const | 207 | no | const env = sniffEnvelope(data); |
| trimmed | const | 210 | no | const trimmed = data.trim(); |
| nested | const | 214 | no | const nested = ev.json !== undefined ? unwrapNestedJson(ev.json) : null; |
| push | method | 219 | yes | push(chunk) { |
| out | const | 220 | no | const out = []; |
| buf | variable | 221 | no | let buf = chunk; |
| _feed | method | 229 | yes | _feed(lines, out) { |
| s | const | 233 | no | const s = line.toString(&#39;utf8&#39;); |
| colon | const | 235 | no | const colon = s.indexOf(&#39;:&#39;); |
| field | const | 236 | no | const field = colon === -1 ? s : s.slice(0, colon); |
| value | const | 237 | no | const value = colon === -1 ? &#39;&#39; : s.slice(colon + 1).replace(/^ /, &#39;&#39;); |
| out | const | 246 | no | const out = []; |
| held | const | 247 | no | const held = this.lines.finish(); |
| e | const | 251 | no | const e = this._dispatch(this.lines.offset); |
| NdjsonDecoder | class | 262 | yes | export class NdjsonDecoder { |
| ev | const | 273 | no | const ev = { type: &#39;ndjson&#39;, text, span: [start, end], index: this.count++, ...extra }; |
| env | const | 274 | no | const env = sniffEnvelope(text); |
| nested | const | 278 | no | const nested = ev.json !== undefined ? unwrapNestedJson(ev.json) : null; |
| text | const | 284 | no | const text = line.toString(&#39;utf8&#39;); |
| out | const | 285 | no | const out = []; |
| joined | const | 287 | no | const joined = this.hold.text + &#39;\\n&#39; + text; |
| ev | const | 289 | no | const ev = this._mk(joined, this.hold.start, end, { coalescedLines: this.hold.lines + 1 }); |
| parsed | const | 306 | no | const parsed = parseJsonSafe(text); |
| ev | const | 311 | no | const ev = this._mk(text, start, end); |
| out | const | 317 | no | const out = []; |
| out | const | 322 | no | const out = []; |
| held | const | 323 | no | const held = this.lines.finish(); |
| ChunkedJsonDecoder | class | 334 | yes | export class ChunkedJsonDecoder { |
| constructor | method | 337 | yes | constructor({ kind = &#39;chunked-json&#39;, unwrapArray = &#39;auto&#39;, maxBytes = 0 } = {}) { |
| _mk | method | 344 | yes | _mk(v, extra = {}) { |
| over | const | 347 | no | const over = { type, oversize: true, bytes: v.end - v.start, span: [v.start, v.end], index: this.count++, ...extra }; |
| ev | const | 353 | no | const ev = { type, text: v.text, span: [v.start, v.end], index: this.count++, ...extra }; |
| json | const | 354 | no | const json = parseJsonSafe(v.text); |
| nested | const | 359 | no | const nested = ev.json !== undefined ? unwrapNestedJson(ev.json) : null; |
| push | method | 364 | yes | push(chunk) { return this.scanner.push(chunk).map((v) =&gt; this._mk(v)); } |
| out | const | 366 | no | const out = this.scanner.push(Buffer.alloc(0)).map((v) =&gt; this._mk(v)); |
| r | const | 367 | no | const r = this.scanner.rest(); |
| JsonSeqDecoder | class | 373 | yes | export class JsonSeqDecoder extends ChunkedJsonDecoder { |
| constructor | method | 374 | yes | constructor(opts = {}) { super({ kind: &#39;jsonseq&#39;, unwrapArray: false, ...opts }); } |
| LengthPrefixedDecoder | class | 381 | yes | export class LengthPrefixedDecoder { |
| constructor | method | 382 | yes | constructor({ style = &#39;auto&#39; } = {}) { |
| push | method | 390 | yes | push(chunk) { |
| out | const | 392 | no | const out = []; |
| head | const | 394 | no | const head = this.buf.subarray(0, 32).toString(&#39;latin1&#39;); |
| m | variable | 395 | no | let m; |
| len | const | 397 | no | const len = Number(m[1]); const start = m[0].length; |
| len | const | 403 | no | const len = parseInt(m[1], /^[0-9]+$/.test(m[1]) ? 10 : 16); const start = m[0].length; |
| _mk | method | 413 | yes | _mk(payload, consumed, style) { |
| text | const | 414 | no | const text = payload.toString(&#39;utf8&#39;); |
| ev | const | 415 | no | const ev = { type: &#39;framed&#39;, framing: style, text, span: [this.base, this.base + consumed], index: this.count++ }; |
| env | const | 416 | no | const env = sniffEnvelope(text); |
| text | const | 428 | no | const text = this.buf.toString(&#39;utf8&#39;); |
| ev | const | 429 | no | const ev = { type: &#39;framed&#39;, framing: this.style, text, span: [this.base, this.base + this.buf.length], index: this.count++, incomplete: true }; |
| env | const | 430 | no | const env = sniffEnvelope(text); |
| INFLATE_MAX_BYTES | const | 448 | no | const INFLATE_MAX_BYTES = 16 * 1024 * 1024; // hard cap on inflated size (zlib maxOutputLength) |
| PROTO_MAX_STRINGS | const | 449 | no | const PROTO_MAX_STRINGS = 64; // per event: bounds persisted size (events dataset) |
| PROTO_MAX_CHARS | const | 450 | no | const PROTO_MAX_CHARS = 4000; // per string, in code points (no split surrogates) |
| INFLATERS | const | 451 | no | const INFLATERS = [[&#39;gzip&#39;, gunzipSync], [&#39;deflate&#39;, inflateSync], [&#39;deflate-raw&#39;, inflateRawSync]]; |
| inflateFrame | function | 454 | no | function inflateFrame(payload) { |
| protoView | function | 462 | no | function protoView(body, cap) { |
| r | variable | 464 | no | let r; |
| strings | const | 467 | no | const strings = []; |
| truncated | variable | 468 | no | let truncated = false; |
| text | variable | 471 | no | let text = s.text; |
| chars | const | 473 | no | const chars = Array.from(text); |
| GrpcFrameDecoder | class | 481 | yes | export class GrpcFrameDecoder { |
| constructor | method | 484 | yes | constructor({ maxFrameBytes = 32 * 1024 * 1024, mime = null, jsonMaxBytes = 0 } = {}) { |
| _feature | method | 502 | yes | _feature(ev, body) { |
| _annotate | method | 512 | yes | _annotate(ev, payload, rawJson) { |
| body | variable | 513 | no | let body = payload; |
| inf | const | 515 | no | const inf = inflateFrame(payload); |
| bodyIsJson | const | 520 | no | const bodyIsJson = ev.compressed ? parseJsonSafe(body.toString(&#39;utf8&#39;)) !== undefined : rawJson !== undefined; |
| protoMime | const | 521 | no | const protoMime = /proto/i.test(String(this.mime ?? &#39;&#39;)); |
| push | method | 530 | yes | push(chunk) { |
| out | const | 532 | no | const out = []; |
| flag | const | 534 | no | const flag = this.buf[0]; |
| len | const | 535 | no | const len = this.buf.readUInt32BE(1); |
| payload | const | 538 | no | const payload = this.buf.subarray(5, 5 + len); |
| trailer | const | 539 | no | const trailer = (flag &amp; 0x80) !== 0; |
| ev | const | 540 | no | const ev = { |
| text | const | 547 | no | const text = payload.toString(&#39;utf8&#39;); |
| json | const | 548 | no | const json = parseJsonSafe(text); |
| ev | const | 563 | no | const ev = { type: &#39;grpc.partial&#39;, size: this.buf.length, span: [this.base, this.base + this.buf.length], index: this.count++, incomplete: true }; |
| parseHttpHeaderBlock | function | 572 | yes | export function parseHttpHeaderBlock(text) { |
| out | const | 573 | no | const out = {}; |
| i | const | 575 | no | const i = line.indexOf(&#39;:&#39;); |
| extractStrings | function | 583 | yes | export function extractStrings(buf, min = 4) { |
| out | const | 584 | no | const out = []; |
| cur | variable | 585 | no | let cur = []; |
| WholeBodyDecoder | class | 600 | yes | export class WholeBodyDecoder { |
| constructor | method | 601 | yes | constructor(kind = &#39;json&#39;, { maxBytes = 0 } = {}) { this.kind = kind; this.parts = []; this.size = 0; this.maxBytes = maxBytes; } |
| push | method | 602 | yes | push(chunk) { |
| bytes | method | 608 | yes | bytes() { return this.parts ? Buffer.concat(this.parts) : Buffer.alloc(0); } |
| buf | const | 611 | no | const buf = Buffer.concat(this.parts); |
| text | const | 614 | no | const text = buf.toString(&#39;utf8&#39;); |
| ev | const | 615 | no | const ev = { type: this.kind, span: [0, buf.length], index: 0, size: buf.length }; |
| j | const | 616 | no | const j = tryJson(text); |
| AutoDecoder | class | 628 | yes | export class AutoDecoder { |
| constructor | method | 629 | yes | constructor({ mime, forced, resniffBytes = 4096, maxResniffChunks = 8, jsonMaxBytes = 0 } = {}) { |
| _init | method | 643 | yes | _init(firstBytes) { |
| push | method | 648 | yes | push(chunk) { |
| head | const | 655 | no | const head = Buffer.concat(this.head); |
| better | const | 656 | no | const better = sniff(this.mime, head); |
| evs | const | 661 | no | const evs = this.inner.push(head); |
| evs | const | 667 | no | const evs = this.inner.push(chunk); |
| evs | const | 674 | no | const evs = this.inner.end(); |
| classifyMime | function | 684 | yes | export function classifyMime(mime = &#39;&#39;) { |
| m | const | 685 | no | const m = String(mime ?? &#39;&#39;).toLowerCase(); |
| CsvRowDecoder | class | 702 | no | class CsvRowDecoder extends CsvDecoder { |
| _event | method | 703 | yes | _event(r) { |
| ev | const | 704 | no | const ev = super._event(r); |
| row | const | 705 | no | const row = this.hasHeader ? ev.row : (ev.values ?? []); |
| headers | const | 708 | no | const headers = Array.isArray(ev.columns) ? ev.columns : []; |
| delimiter | const | 709 | no | const delimiter = ev.delimiter ?? &#39;,&#39;; |
| decoderForKind | function | 715 | yes | export function decoderForKind(kind, { forced, jsonMaxBytes = 0, mime = null } = {}) { |
| pickDecoder | function | 731 | yes | export function pickDecoder(mime, firstBytes, forced) { |
| kind | const | 732 | no | const kind = forced \|\| sniff(mime, firstBytes); |
| pickAutoDecoder | function | 737 | yes | export function pickAutoDecoder(mime, forced, opts = {}) { |
| sniff | function | 741 | yes | export function sniff(mime, firstBytes) { |
| declared | const | 742 | no | const declared = classifyMime(mime); |
| buf | const | 744 | no | const buf = firstBytes &amp;&amp; firstBytes.length ? firstBytes : null; |
| head | const | 745 | no | const head = buf ? buf.subarray(0, 1024).toString(&#39;utf8&#39;) : &#39;&#39;; |
| len | const | 753 | no | const len = buf.readUInt32BE(1); |
| textLike | const | 760 | no | const textLike = /^\\s*[{[&quot;]/.test(head); |
| lines | const | 762 | no | const lines = head.split(&#39;\\n&#39;).filter((l) =&gt; l.trim()); |
| csvBuf | const | 777 | no | const csvBuf = buf ? buf.subarray(0, 4096) : null; |
| looksLikeTextBytes | function | 784 | no | function looksLikeTextBytes(buf) { |
| sniffEnvelope | function | 795 | yes | export function sniffEnvelope(text) { |
| j0 | const | 797 | no | const j0 = tryJson(text); |
| i | const | 799 | no | const i = text.search(/[[{]/); |
| json | const | 801 | no | const json = tryJson(text.slice(i)); |
| head | const | 803 | no | const head = text.slice(0, i); |
| delim | const | 804 | no | const delim = (/[\|\\t;]/.exec(head) ?? /[: ]/.exec(head) ?? [&#39;&#39;])[0]; |
| headers | const | 805 | no | const headers = head.split(/[\|\\t;: ]+/).filter(Boolean); |
| delim | const | 810 | no | const delim = /[\|\\t;: ]/.exec(text)[0]; |
| NESTED_KEYS | const | 818 | no | const NESTED_KEYS = [&#39;data&#39;, &#39;payload&#39;, &#39;message&#39;, &#39;body&#39;, &#39;result&#39;, &#39;params&#39;, &#39;value&#39;, &#39;content&#39;, &#39;event_data&#39;, &#39;json&#39;]; |
| unwrapNestedJson | function | 819 | yes | export function unwrapNestedJson(json, depth = 0) { |
| v | const | 822 | no | const v = json[k]; |
| t | const | 824 | no | const t = v.trim(); |
| parsed | const | 826 | no | const parsed = parseJsonSafe(t); |
| EIO_TYPES | const | 836 | no | const EIO_TYPES = { 0: &#39;open&#39;, 1: &#39;close&#39;, 2: &#39;ping&#39;, 3: &#39;pong&#39;, 4: &#39;message&#39;, 5: &#39;upgrade&#39;, 6: &#39;noop&#39; }; |
| SIO_TYPES | const | 837 | no | const SIO_TYPES = { 0: &#39;connect&#39;, 1: &#39;disconnect&#39;, 2: &#39;event&#39;, 3: &#39;ack&#39;, 4: &#39;connect_error&#39;, 5: &#39;binary_event&#39;, 6: &#39;binary_ack&#39; }; |
| STOMP_COMMANDS | const | 838 | no | const STOMP_COMMANDS = /^(CONNECT\|STOMP\|CONNECTED\|SEND\|SUBSCRIBE\|UNSUBSCRIBE\|ACK\|NACK\|BEGIN\|COMMIT\|ABORT\|DISCONNECT\|MESSAGE\|RECEIPT\|ERROR)\\n/; |
| GQL_WS_TYPES | const | 839 | no | const GQL_WS_TYPES = new Set([&#39;connection_init&#39;, &#39;connection_ack&#39;, &#39;connection_error&#39;, &#39;connection_terminate&#39;, &#39;ka&#39;, &#39;ping&#39;, &#39;pong&#39;, &#39;start&#39;, &#39;stop&#39;, &#39;subscribe&#39;, &#39;next&#39;, &#39;data&#39;, &#39;error&#39;, &#39;complete&#39;]… |
| SIGNALR_TYPES | const | 840 | no | const SIGNALR_TYPES = { 1: &#39;invocation&#39;, 2: &#39;stream_item&#39;, 3: &#39;completion&#39;, 4: &#39;stream_invocation&#39;, 5: &#39;cancel_invocation&#39;, 6: &#39;ping&#39;, 7: &#39;close&#39; }; |
| decodeTextFrame | function | 842 | yes | export function decodeTextFrame(text) { |
| out | const | 843 | no | const out = { protocol: null }; |
| t | const | 845 | no | const t = text.trim(); |
| json | const | 851 | no | const json = parseJsonSafe(t.slice(1)); |
| first | const | 859 | no | const first = text.split(&#39;\\u001e&#39;).filter((x) =&gt; x.trim())[0]; |
| json | const | 860 | no | const json = parseJsonSafe(first ?? &#39;&#39;); |
| nl2 | const | 872 | no | const nl2 = text.indexOf(&#39;\\n\\n&#39;); |
| headPart | const | 873 | no | const headPart = nl2 === -1 ? text : text.slice(0, nl2); |
| bodyPart | const | 874 | no | const bodyPart = nl2 === -1 ? &#39;&#39; : text.slice(nl2 + 2).replace(/\\0\\s*$/, &#39;&#39;); |
| lines | const | 875 | no | const lines = headPart.split(&#39;\\n&#39;); |
| eio | const | 888 | no | const eio = /^(\\d)(?:(\\d)(?:(\\/[^,]*),)?(\\d+)?)?/.exec(t); |
| eioType | const | 890 | no | const eioType = Number(eio[1]); |
| rest | const | 895 | no | const rest = t.slice(eio[0].length); |
| json | const | 901 | no | const json = parseJsonSafe(rest); |
| json | const | 913 | no | const json = parseJsonSafe(t); |
| env | const | 971 | no | const env = sniffEnvelope(text); |
| textFrameProtocol | function | 983 | yes | export function textFrameProtocol(text) { return decodeTextFrame(text).protocol; } |
| decodeWsPayload | function | 986 | yes | export function decodeWsPayload({ opcode, payload }) { |
| buf | const | 988 | no | const buf = Buffer.from(payload ?? &#39;&#39;, &#39;base64&#39;); |
| ev | const | 989 | no | const ev = { type: &#39;ws.binary&#39;, size: buf.length }; |
| text | const | 991 | no | const text = buf.toString(&#39;utf8&#39;); |
| json | const | 992 | no | const json = parseJsonSafe(text); |
| buf | const | 999 | no | const buf = Buffer.from(payload ?? &#39;&#39;, &#39;base64&#39;); |
| ev | const | 1000 | no | const ev = { type: &#39;ws.control&#39;, frameType: &#39;close&#39;, terminal: true }; |
| text | const | 1005 | no | const text = payload ?? &#39;&#39;; |
| ev | const | 1006 | no | const ev = { type: &#39;ws.text&#39;, text }; |
| frame | const | 1007 | no | const frame = decodeTextFrame(text); |
| env | const | 1016 | no | const env = sniffEnvelope(text); |
| WsFrameDecoder | class | 1032 | yes | export class WsFrameDecoder { |
| constructor | method | 1033 | yes | constructor() { |
| push | method | 1041 | yes | push({ opcode, payload, dir = &#39;in&#39;, t } = {}) { |
| out | const | 1042 | no | const out = []; |
| isCont | const | 1044 | no | const isCont = opcode === 0; |
| p | const | 1047 | no | const p = this.partial[dir]; |
| ev | const | 1048 | no | const ev = { type: &#39;ws.continuation&#39;, dir, index: this.count++, size: frameSize(opcode, payload) }; |
| joined | const | 1052 | no | const joined = p.opcode === 2 |
| re | const | 1055 | no | const re = decodeWsPayload({ opcode: p.opcode, payload: joined }); |
| ev | const | 1065 | no | const ev = { ...decodeWsPayload({ opcode, payload }), dir, index: this.count++ }; |
| ev | const | 1069 | no | const ev = { ...decodeWsPayload({ opcode, payload }), dir, opcode, index: this.count++, size: frameSize(opcode, payload) }; |
| dominantProtocol | method | 1080 | yes | dominantProtocol() { |
| best | variable | 1081 | no | let best = null, n = -1; |
| frameSize | function | 1089 | no | function frameSize(opcode, payload) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./csv.mjs | import | 19 | [studio/src/decode/csv.mjs](./csv.mjs.md) |
| ./protobuf.mjs | import | 20 | [studio/src/decode/protobuf.mjs](./protobuf.mjs.md) |
| ./proto-features.mjs | import | 21 | [studio/src/decode/proto-features.mjs](./proto-features.mjs.md) |
| node:zlib | import | 22 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/eval/fixtures.mjs](../../eval/fixtures.mjs.md) | ../src/decode/decoders.mjs |
| [studio/src/capture/live-tap.mjs](../capture/live-tap.mjs.md) | ../decode/decoders.mjs |
| [studio/src/mirror/catalog.mjs](../mirror/catalog.mjs.md) | ../decode/decoders.mjs |
| [studio/src/mirror/synthesize.mjs](../mirror/synthesize.mjs.md) | ../decode/decoders.mjs |
| [studio/src/replay/reducer.mjs](../replay/reducer.mjs.md) | ../decode/decoders.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Incremental L2 decoders. Each consumes raw L1 bytes for one stream, in order, and yields
// protocol envelopes WITHOUT dropping unknown fields. Every event carries the byte span it was
// decoded from, so the studio can link raw bytes <-> parsed events.
//
// Decoder families:
//   SseDecoder          text/event-stream (byte-exact line framing, id/retry continuity)
//   NdjsonDecoder       newline-delimited JSON (tolerant: re-joins pretty-printed records)
//   ChunkedJsonDecoder  concatenated / progressively streamed JSON values, no framing at all
//   JsonSeqDecoder      RFC 7464 record-separator framed JSON (0x1e)
//   LengthPrefixedDecoder  "<len>\n<payload>" and netstring "<len>:<payload>," framing
//   GrpcFrameDecoder    gRPC / gRPC-Web length-prefixed message frames (1+4 byte prefix)
//   WholeBodyDecoder    non-incremental bodies (json/html/text/binary)
//   CsvRowDecoder       CSV tables (declared text/csv, or sniffed plain-text CSV)
//   AutoDecoder         re-sniffs the first bytes and switches decoder before any event is emitted
//   WsFrameDecoder      WebSocket frames incl. continuation reassembly + app-protocol decoding
//
// Nothing here is site specific: every recogniser keys off wire shape, never off a hostname.

import { CsvDecoder, sniffDelimiter } from './csv.mjs';
import { decodeProtobuf, protoStrings } from './protobuf.mjs';
import { createProtoFeatureExtractor } from './proto-features.mjs';
import { gunzipSync, inflateSync, inflateRawSync } from 'node:zlib';

export const NL = 0x0a, CR = 0x0d, RS = 0x1e, TAB = 0x09, SP = 0x20;

const isWs = (b) => b === SP || b === TAB || b === NL || b === CR;

export function parseJsonSafe(text) {
  if (typeof text !== 'string') return undefined;
  const t = text.trim();
  if (!t) return undefined;
  const c = t[0];
  if (c !== '{' && c !== '[' && c !== '"' && !(c === '-' || (c >= '0' && c <= '9')) && t !== 'true' && t !== 'false' && t !== 'null') return undefined;
  try { return JSON.parse(t); } catch { return undefined; }
}

// Back-compat alias for the original private helper.
const tryJson = (t) => {
  if (typeof t !== 'string') return undefined;
  const s = t.trim();
  if (!s || (s[0] !== '{' && s[0] !== '[' && s[0] !== '"')) return undefined;
  try { return JSON.parse(s); } catch { return undefined; }
};

// ---------------------------------------------------------------------------------------------
// Byte-level line splitter honoring \n, \r\n and \r (as the SSE spec requires).
// ---------------------------------------------------------------------------------------------
export class LineSplitter {
  constructor() { this.buf = Buffer.alloc(0); this.offset = 0; }
  // A CR that is the last byte of the available data is NOT consumed: its line stays held in buf
  // until the next byte shows whether an LF follows (so a CRLF split across chunks keeps the exact
  // span of the LF) or the stream ends (finish()).
  push(chunk) {
    const lines = [];
    const data = this.buf.length ? Buffer.concat([this.buf, chunk]) : chunk;
    const base = this.offset;
    let start = 0;
    for (let i = 0; i < data.length; i++) {
      const b = data[i];
      if (b !== NL && b !== CR) continue;
      if (b === CR && i + 1 === data.length) break;
      const crlf = b === CR && data[i + 1] === NL;
      const end = i + (crlf ? 2 : 1);
      lines.push({ line: data.subarray(start, i), start: base + start, end: base + end });
      if (crlf) i++;
      start = end;
    }
    this.buf = Buffer.from(data.subarray(start));
    this.offset = base + start;
    return lines;
  }
  rest() { return this.buf.length ? { line: this.buf, start: this.offset, end: this.offset + this.buf.length } : null; }
  // End of stream: a held CR-terminated line is complete (CR terminates a line), so it is returned
  // as a normal line with its exact span. Returns [] when nothing is held or the held bytes do not
  // end in CR (callers then use rest(), exactly as before).
  finish() {
    const n = this.buf.length;
    if (!n || this.buf[n - 1] !== CR) return [];
    const start = this.offset, end = this.offset + n;
    const line = this.buf.subarray(0, n - 1);
```

_First 80 of 1093 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

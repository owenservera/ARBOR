# File: studio/src/decode/protobuf.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/decode/protobuf.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12189 B |
| Lines | 303 |
| Hash | fc4057b2cc3a |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEFAULT_MAX_FRAME_BYTES | const | 21 | yes | export const DEFAULT_MAX_FRAME_BYTES = 64 * 1024 * 1024; |
| DEFAULT_MAX_DEPTH | const | 22 | yes | export const DEFAULT_MAX_DEPTH = 6; |
| DEFAULT_MAX_FIELDS | const | 23 | yes | export const DEFAULT_MAX_FIELDS = 20000; |
| FLAG_COMPRESSED | const | 25 | no | const FLAG_COMPRESSED = 0x01; |
| FLAG_END_STREAM | const | 26 | no | const FLAG_END_STREAM = 0x02; |
| FLAG_TRAILERS | const | 27 | no | const FLAG_TRAILERS = 0x80; |
| KNOWN_FLAGS | const | 28 | no | const KNOWN_FLAGS = FLAG_COMPRESSED \| FLAG_END_STREAM \| FLAG_TRAILERS; |
| MAX_FIELD_NUMBER | const | 29 | no | const MAX_FIELD_NUMBER = 536870911; |
| MAX_FIELD_NUMBER_BIG | const | 30 | no | const MAX_FIELD_NUMBER_BIG = 536870911n; |
| TWO_64 | const | 31 | no | const TWO_64 = 1n &lt;&lt; 64n; |
| HARD_MAX_DEPTH | const | 32 | no | const HARD_MAX_DEPTH = 64; |
| DEFAULT_MAX_BYTES | const | 33 | no | const DEFAULT_MAX_BYTES = 64 * 1024 * 1024; |
| PRINTABLE_RATIO | const | 34 | no | const PRINTABLE_RATIO = 0.9; |
| PRINTABLE | const | 37 | no | const PRINTABLE = /[\\p{L}\\p{N}\\p{P}\\p{S}\\p{Zs}\\p{M}\\p{Cf}\\t\\n\\r]/u; |
| STRICT_UTF8 | const | 38 | no | const STRICT_UTF8 = new TextDecoder(&#39;utf-8&#39;, { fatal: true, ignoreBOM: true }); |
| asBuffer | function | 40 | no | function asBuffer(input) { |
| clampInt | function | 46 | no | function clampInt(v, lo, hi, dflt) { |
| splitEnvelopes | function | 60 | yes | export function splitEnvelopes(input, { maxFrameBytes = DEFAULT_MAX_FRAME_BYTES } = {}) { |
| buf | const | 61 | no | const buf = asBuffer(input); |
| cap | const | 62 | no | const cap = clampInt(maxFrameBytes, 0, Number.MAX_SAFE_INTEGER, DEFAULT_MAX_FRAME_BYTES); |
| frames | const | 63 | no | const frames = []; |
| pos | variable | 64 | no | let pos = 0; |
| finish | function | 65 | no | const finish = (ok, reason) =&gt; { |
| out | const | 66 | no | const out = { ok, frames, consumed: pos, leftover: buf.subarray(pos) }; |
| flags | const | 71 | no | const flags = buf[pos]; |
| length | const | 72 | no | const length = buf.readUInt32BE(pos + 1); |
| meta | const | 75 | no | const meta = { |
| ProtoFault | class | 99 | no | class ProtoFault { |
| constructor | method | 100 | yes | constructor(reason, budget = false) { this.reason = reason; this.budget = budget; } |
| readVarint | function | 103 | no | function readVarint(b, pos, end) { |
| v | variable | 104 | no | let v = 0n; |
| shift | variable | 105 | no | let shift = 0n; |
| i | variable | 106 | no | let i = pos; |
| byte | const | 109 | no | const byte = b[i++]; |
| printableStats | function | 120 | no | function printableStats(text) { |
| total | variable | 121 | no | let total = 0; |
| good | variable | 122 | no | let good = 0; |
| classifyLen | function | 131 | no | function classifyLen(ctx, s, e, depth) { |
| b | const | 132 | no | const b = ctx.buf; |
| n | const | 133 | no | const n = e - s; |
| text | variable | 135 | no | let text = null; |
| textOk | variable | 137 | no | let textOk = false; |
| ps | const | 139 | no | const ps = printableStats(text); |
| msg | variable | 142 | no | let msg = null; |
| parseFields | function | 160 | no | function parseFields(ctx, start, end, depth, out) { |
| b | const | 161 | no | const b = ctx.buf; |
| pos | variable | 162 | no | let pos = start; |
| t | const | 164 | no | const t = readVarint(b, pos, end); |
| no | const | 165 | no | const no = t.v &gt;&gt; 3n; |
| wt | const | 167 | no | const wt = Number(t.v &amp; 7n); |
| fieldNo | const | 168 | no | const fieldNo = Number(no); |
| v | const | 174 | no | const v = readVarint(b, pos, end); |
| L | const | 192 | no | const L = readVarint(b, pos, end); |
| s | const | 194 | no | const s = L.next; |
| e | const | 195 | no | const e = s + Number(L.v); |
| treeStats | function | 210 | no | function treeStats(fields, work) { |
| st | const | 211 | no | const st = { fields: 0, varint: 0, fixed64: 0, fixed32: 0, string: 0, message: 0, bytes: 0, ambiguous: 0, depth: 0, work }; |
| walk | function | 212 | no | const walk = (list, level) =&gt; { |
| decodeProtobuf | function | 230 | yes | export function decodeProtobuf(input, opts = {}) { |
| o | const | 231 | no | const o = opts ?? {}; |
| buf | const | 232 | no | const buf = asBuffer(input); |
| maxBytes | const | 233 | no | const maxBytes = clampInt(o.maxBytes, 0, Number.MAX_SAFE_INTEGER, DEFAULT_MAX_BYTES); |
| ctx | const | 237 | no | const ctx = { |
| fields | const | 244 | no | const fields = []; |
| flattenProtobuf | function | 259 | yes | export function flattenProtobuf(tree) { |
| out | const | 260 | no | const out = []; |
| walk | function | 261 | no | const walk = (fields, prefix) =&gt; { |
| totals | const | 262 | no | const totals = new Map(); |
| seen | const | 264 | no | const seen = new Map(); |
| seg | variable | 266 | no | let seg = String(f.no); |
| i | const | 268 | no | const i = seen.get(f.no) ?? 0; |
| path | const | 272 | no | const path = prefix ? `${prefix}.${seg}` : seg; |
| e | const | 273 | no | const e = { path, wt: f.wt, kind: f.kind }; |
| protoStrings | function | 286 | yes | export function protoStrings(tree, { minChars = 1 } = {}) { |
| describeProtobuf | function | 293 | yes | export function describeProtobuf(tree) { |
| map | const | 294 | no | const map = new Map(); |
| path | const | 296 | no | const path = e.path.replace(/\\[\\d+\\]/g, &#39;&#39;); |
| key | const | 297 | no | const key = `${path}\|${e.kind}`; |
| hit | const | 298 | no | const hit = map.get(key); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/scripts/proto-field-search.mjs](../../scripts/proto-field-search.mjs.md) | ../src/decode/protobuf.mjs |
| [studio/src/decode/decoders.mjs](./decoders.mjs.md) | ./protobuf.mjs |
| [studio/src/decode/proto-features.mjs](./proto-features.mjs.md) | ./protobuf.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Schema-less protobuf wire decoder and Connect / gRPC-web envelope splitter.
// Pure functions: no imports from the product, no I/O, no Date, no random.
// Zero dependencies (Node built-ins only: Buffer, TextDecoder).
//
// Layers:
//   splitEnvelopes(buf)      1 flag byte + 4 byte big-endian length + payload (Connect / gRPC-web).
//   decodeProtobuf(buf)      schema-less wire decode into an ordered field tree.
//   flattenProtobuf(tree)    pre-order list of { path, wt, kind, value|len, ambiguous? }.
//   protoStrings(tree)       string leaves in document order.
//   describeProtobuf(tree)   shape only (path + kind + count), no values.
//
// Field nodes: { no, wt, kind, ... } where kind is one of
//   varint   value: decimal string (lossless)
//   fixed64  value: 16 hex digits, unsigned little-endian integer
//   fixed32  value: 8 hex digits, unsigned little-endian integer
//   string   value: UTF-8 text (wire type 2 classified as text)
//   message  fields: nested ordered field list
//   bytes    len, head: first 8 bytes in hex (wire type 2, neither text nor message)
// A string that also parses as a one-field message carries ambiguous: true.

export const DEFAULT_MAX_FRAME_BYTES = 64 * 1024 * 1024;
export const DEFAULT_MAX_DEPTH = 6;
export const DEFAULT_MAX_FIELDS = 20000;

const FLAG_COMPRESSED = 0x01;
const FLAG_END_STREAM = 0x02;
const FLAG_TRAILERS = 0x80;
const KNOWN_FLAGS = FLAG_COMPRESSED | FLAG_END_STREAM | FLAG_TRAILERS;
const MAX_FIELD_NUMBER = 536870911;
const MAX_FIELD_NUMBER_BIG = 536870911n;
const TWO_64 = 1n << 64n;
const HARD_MAX_DEPTH = 64;
const DEFAULT_MAX_BYTES = 64 * 1024 * 1024;
const PRINTABLE_RATIO = 0.9;
// Letters, numbers, punctuation, symbols (incl. emoji), separators, marks, format chars (ZWJ),
// plus tab / LF / CR. Controls, private use and unassigned code points are not printable.
const PRINTABLE = /[\p{L}\p{N}\p{P}\p{S}\p{Zs}\p{M}\p{Cf}\t\n\r]/u;
const STRICT_UTF8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

function asBuffer(input) {
  if (Buffer.isBuffer(input)) return input;
  if (input instanceof Uint8Array) return Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  throw new TypeError('expected Buffer or Uint8Array');
}

function clampInt(v, lo, hi, dflt) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return dflt;
  return Math.min(hi, Math.max(lo, Math.floor(v)));
}

// ---------------------------------------------------------------------------------------------
// Connect / gRPC-web envelopes
// ---------------------------------------------------------------------------------------------
// Returns { ok, frames, consumed, leftover, reason? }.
// frames: complete frames, plus at most one trailing frame with complete:false (payload null,
// have = bytes of payload seen so far). The incomplete frame is NOT counted in consumed; the
// caller re-feeds leftover (= buf.subarray(consumed)) with the next chunk.
// ok:false (reason) on unknown flag bits or a length above maxFrameBytes; nothing is allocated
// for the rejected payload.
export function splitEnvelopes(input, { maxFrameBytes = DEFAULT_MAX_FRAME_BYTES } = {}) {
  const buf = asBuffer(input);
  const cap = clampInt(maxFrameBytes, 0, Number.MAX_SAFE_INTEGER, DEFAULT_MAX_FRAME_BYTES);
  const frames = [];
  let pos = 0;
  const finish = (ok, reason) => {
    const out = { ok, frames, consumed: pos, leftover: buf.subarray(pos) };
    if (!ok) { out.reason = reason; out.offset = pos; }
    return out;
  };
  while (buf.length - pos >= 5) {
    const flags = buf[pos];
    const length = buf.readUInt32BE(pos + 1);
    if ((flags & ~KNOWN_FLAGS) !== 0) return finish(false, 'unknown-flags');
    if (length > cap) return finish(false, 'frame-too-large');
    const meta = {
      flags,
      compressed: (flags & FLAG_COMPRESSED) !== 0,
      endStream: (flags & FLAG_END_STREAM) !== 0,
      trailers: (flags & FLAG_TRAILERS) !== 0,
      offset: pos,
```

_First 80 of 304 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

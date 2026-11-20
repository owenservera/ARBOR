# File: studio/src/intel/autodetect.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/autodetect.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 19304 B |
| Lines | 561 |
| Hash | 2589039c630e |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| clamp | function | 3 | no | const clamp = (n) =&gt; Math.max(0, Math.min(1, Math.round(n * 1000) / 1000)); |
| toBuf | function | 5 | no | function toBuf(input) { |
| startsWith | function | 13 | no | function startsWith(buf, bytes) { |
| magicKind | function | 19 | no | function magicKind(buf) { |
| cm | const | 30 | no | const cm = buf[0] &amp; 0x0f; |
| cinfo | const | 31 | no | const cinfo = buf[0] &gt;&gt; 4; |
| zeroBias | function | 37 | no | function zeroBias(buf) { |
| pairs | const | 38 | no | const pairs = Math.floor(buf.length / 2); |
| even | variable | 40 | no | let even = 0; |
| odd | variable | 41 | no | let odd = 0; |
| strictUtf8 | function | 52 | no | function strictUtf8(buf) { |
| detectCharset | function | 61 | no | function detectCharset(buf) { |
| evidence | const | 62 | no | const evidence = []; |
| utf8 | const | 72 | no | const utf8 = strictUtf8(buf); |
| bias | const | 73 | no | const bias = zeroBias(buf); |
| decodeText | function | 91 | no | function decodeText(buf, charset) { |
| b | const | 93 | no | const b = (buf.length &gt;= 3 &amp;&amp; buf[0] === 0xef &amp;&amp; buf[1] === 0xbb &amp;&amp; buf[2] === 0xbf) ? buf.subarray(3) : buf; |
| b | const | 97 | no | const b = (buf.length &gt;= 2 &amp;&amp; buf[0] === 0xff &amp;&amp; buf[1] === 0xfe) ? buf.subarray(2) : buf; |
| b | const | 101 | no | const b = (buf.length &gt;= 2 &amp;&amp; buf[0] === 0xfe &amp;&amp; buf[1] === 0xff) ? buf.subarray(2) : buf; |
| looksBinary | function | 107 | no | function looksBinary(buf, charset) { |
| ctrl | variable | 110 | no | let ctrl = 0; |
| b | const | 112 | no | const b = buf[i]; |
| mimeKind | function | 118 | no | function mimeKind(mime) { |
| m | const | 119 | no | const m = String(mime ?? &#39;&#39;).toLowerCase(); |
| logicalLines | function | 147 | no | function logicalLines(text, max = 50) { |
| s | variable | 148 | no | let s = String(text ?? &#39;&#39;); |
| lines | const | 150 | no | const lines = []; |
| cur | variable | 151 | no | let cur = &#39;&#39;; |
| inQ | variable | 152 | no | let inQ = false; |
| c | const | 154 | no | const c = s[i]; |
| countFields | function | 173 | no | function countFields(line, delimiter) { |
| n | variable | 174 | no | let n = 1; |
| inQ | variable | 175 | no | let inQ = false; |
| c | const | 177 | no | const c = line[i]; |
| sniffDelimiter | function | 189 | no | function sniffDelimiter(text) { |
| lines | const | 190 | no | const lines = logicalLines(text, 50).filter((l) =&gt; l.length &gt; 0); |
| delims | const | 191 | no | const delims = [&#39;,&#39;, &#39;;&#39;, &#39;\\t&#39;, &#39;\|&#39;]; |
| best | variable | 192 | no | let best = { delimiter: &#39;,&#39;, confidence: 0 }; |
| counts | const | 195 | no | const counts = lines.map((line) =&gt; countFields(line, delimiter)); |
| freq | const | 196 | no | const freq = new Map(); |
| multi | variable | 197 | no | let multi = 0; |
| mode | variable | 202 | no | let mode = 0; |
| modeN | variable | 203 | no | let modeN = 0; |
| confidence | variable | 207 | no | let confidence = (modeN / counts.length) * (modeN / multi); |
| scoreJson | function | 215 | no | function scoreJson(text) { |
| t | const | 216 | no | const t = text.trim(); |
| v | const | 219 | no | const v = JSON.parse(t); |
| scoreNdjson | function | 228 | no | function scoreNdjson(text) { |
| lines | const | 229 | no | const lines = text.split(/\\r?\\n/).map((l) =&gt; l.trim()).filter(Boolean); |
| v | const | 233 | no | const v = JSON.parse(line); |
| scoreSse | function | 242 | no | function scoreSse(text) { |
| lines | const | 243 | no | const lines = text.split(/\\r?\\n/); |
| n | variable | 244 | no | let n = 0; |
| scoreHtml | function | 251 | no | function scoreHtml(text) { |
| t | const | 252 | no | const t = text.trim(); |
| tags | const | 255 | no | const tags = t.match(/&lt;\\/?(?:html\|head\|body\|div\|span\|p\|a\|table\|script\|style\|br\|h1\|ul\|li\|section\|article)\\b/gi); |
| scoreXml | function | 260 | no | function scoreXml(text) { |
| t | const | 261 | no | const t = text.trim(); |
| re | const | 265 | no | const re = /&lt;\\/?([A-Za-z_][\\w:.-]*)(?:\\s[^&lt;&gt;]*?)?\\s*(\\/?)&gt;/g; |
| depth | variable | 266 | no | let depth = 0; |
| roots | variable | 267 | no | let roots = 0; |
| saw | variable | 268 | no | let saw = 0; |
| m | variable | 269 | no | let m; |
| open | const | 271 | no | const open = !m[0].startsWith(&#39;&lt;/&#39;); |
| self | const | 272 | no | const self = open &amp;&amp; (m[2] === &#39;/&#39; \|\| m[0].endsWith(&#39;/&gt;&#39;)); |
| scoreYaml | function | 289 | no | function scoreYaml(text) { |
| lines | const | 291 | no | const lines = text.split(/\\r?\\n/).map((l) =&gt; l.trim()).filter((l) =&gt; l &amp;&amp; !l.startsWith(&#39;#&#39;)); |
| kv | const | 293 | no | const kv = lines.filter((l) =&gt; /^[A-Za-z_][\\w.-]*:\\s+\\S/.test(l)); |
| scoreCsv | function | 299 | no | function scoreCsv(text) { |
| sn | const | 300 | no | const sn = sniffDelimiter(text); |
| scoreLogfmt | function | 305 | no | function scoreLogfmt(text) { |
| lines | const | 306 | no | const lines = text.split(/\\r?\\n/).map((l) =&gt; l.trim()).filter(Boolean).slice(0, 50); |
| re | const | 308 | no | const re = /(?:^\|\\s)[A-Za-z_][\\w.-]*=(?:[^\\s&quot;&#39;]+\|&quot;[^&quot;]*&quot;\|&#39;[^&#39;]*&#39;)/g; |
| good | variable | 309 | no | let good = 0; |
| n | const | 311 | no | const n = line.match(re); |
| scoreIni | function | 318 | no | function scoreIni(text) { |
| lines | const | 319 | no | const lines = text.split(/\\r?\\n/).map((l) =&gt; l.trim()).filter((l) =&gt; l &amp;&amp; !l.startsWith(&#39;#&#39;) &amp;&amp; !l.startsWith(&#39;;&#39;)); |
| sections | const | 320 | no | const sections = lines.filter((l) =&gt; /^\\[[^\\]\\r\\n]+\\]$/.test(l)).length; |
| keys | const | 321 | no | const keys = lines.filter((l) =&gt; /^[^[\\]=\\s][^=]*=/.test(l)).length; |
| readVarint | function | 326 | no | function readVarint(buf, o) { |
| value | variable | 327 | no | let value = 0; |
| shift | variable | 328 | no | let shift = 0; |
| b | const | 331 | no | const b = buf[o + i]; |
| scoreProtobuf | function | 342 | no | function scoreProtobuf(buf) { |
| o | variable | 343 | no | let o = 0; |
| fields | variable | 344 | no | let fields = 0; |
| tag | const | 346 | no | const tag = readVarint(buf, o); |
| fieldNum | const | 348 | no | const fieldNum = tag.value &gt;&gt;&gt; 3; |
| wt | const | 349 | no | const wt = tag.value &amp; 7; |
| v | const | 352 | no | const v = readVarint(buf, tag.next); |
| len | const | 359 | no | const len = readVarint(buf, tag.next); |
| mpItems | function | 372 | no | function mpItems(buf, o, count, mult, depth) { |
| p | variable | 373 | no | let p = o; |
| items | const | 374 | no | const items = count * mult; |
| s | const | 377 | no | const s = mpSize(buf, p, depth + 1); |
| mpNeed | function | 385 | no | function mpNeed(buf, o, n) { |
| mpSized | function | 389 | no | function mpSized(buf, o, lenBytes) { |
| len | variable | 391 | no | let len = 0; |
| total | const | 398 | no | const total = 1 + lenBytes + len; |
| mpSize | function | 402 | no | function mpSize(buf, o, depth) { |
| b | const | 404 | no | const b = buf[o]; |
| n | const | 407 | no | const n = mpItems(buf, o + 1, b &amp; 0x0f, 2, depth); |
| n | const | 411 | no | const n = mpItems(buf, o + 1, b &amp; 0x0f, 1, depth); |
| n | const | 430 | no | const n = mpItems(buf, o + 3, buf.readUInt16BE(o + 1), 1, depth); |
| count | const | 435 | no | const count = buf.readUInt32BE(o + 1); |
| n | const | 437 | no | const n = mpItems(buf, o + 5, count, 1, depth); |
| n | const | 442 | no | const n = mpItems(buf, o + 3, buf.readUInt16BE(o + 1), 2, depth); |
| count | const | 447 | no | const count = buf.readUInt32BE(o + 1); |
| n | const | 449 | no | const n = mpItems(buf, o + 5, count, 2, depth); |
| scoreMsgpack | function | 455 | no | function scoreMsgpack(buf) { |
| b0 | const | 457 | no | const b0 = buf[0]; |
| isMap | const | 458 | no | const isMap = (b0 &gt;= 0x80 &amp;&amp; b0 &lt;= 0x8f) \|\| b0 === 0xdc \|\| b0 === 0xde; |
| size | const | 460 | no | const size = mpSize(buf, 0, 0); |
| ratio | const | 462 | no | const ratio = size / buf.length; |
| applyMime | function | 468 | no | function applyMime(score, kind, prior) { |
| detectContent | function | 473 | yes | export function detectContent(input, opts = {}) { |
| maxBytes | const | 474 | no | const maxBytes = opts.maxBytes ?? 65536; |
| full | const | 475 | no | const full = toBuf(input); |
| truncated | const | 476 | no | const truncated = full.length &gt; maxBytes; |
| buf | const | 477 | no | const buf = truncated ? full.subarray(0, maxBytes) : full; |
| prior | const | 478 | no | const prior = mimeKind(opts.mime); |
| evidence | const | 479 | no | const evidence = []; |
| magic | const | 482 | no | const magic = magicKind(buf); |
| confidence | variable | 484 | no | let confidence = 0.98; |
| confidence | const | 494 | no | const confidence = applyMime(0.2, &#39;text&#39;, prior); |
| cs | const | 500 | no | const cs = detectCharset(buf); |
| binary | const | 502 | no | const binary = looksBinary(buf, cs.charset); |
| msg | const | 505 | no | const msg = applyMime(scoreMsgpack(buf), &#39;msgpack&#39;, prior); |
| proto | const | 506 | no | const proto = applyMime(scoreProtobuf(buf), &#39;protobuf&#39;, prior); |
| confidence | const | 517 | no | const confidence = applyMime(0.4, &#39;binary&#39;, prior); |
| text | const | 523 | no | const text = decodeText(buf, cs.charset); |
| csv | const | 524 | no | const csv = scoreCsv(text); |
| probes | const | 525 | no | const probes = [ |
| best | variable | 536 | no | let best = { kind: &#39;text&#39;, score: 0, tag: &#39;fallback:text&#39; }; |
| score | const | 538 | no | const score = applyMime(raw, kind, prior); |
| confidence | const | 542 | no | const confidence = applyMime(0.35, &#39;text&#39;, prior); |
| detectBatch | function | 552 | yes | export function detectBatch(items) { |
| list | const | 553 | no | const list = Array.isArray(items) ? items : []; |
| input | const | 556 | no | const input = item.input ?? item.data ?? item.bytes ?? item.body ?? item.content; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/intel/bench.mjs](./bench.mjs.md) | ./autodetect.mjs |
| [studio/src/intel/platform.mjs](./platform.mjs.md) | ./autodetect.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Standalone content autodetect. No imports (CSV sniff is inlined).

const clamp = (n) => Math.max(0, Math.min(1, Math.round(n * 1000) / 1000));

function toBuf(input) {
  if (typeof input === 'string') return Buffer.from(input, 'utf8');
  if (Buffer.isBuffer(input)) return input;
  if (input instanceof Uint8Array) return Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  if (input instanceof ArrayBuffer) return Buffer.from(new Uint8Array(input));
  return Buffer.alloc(0);
}

function startsWith(buf, bytes) {
  if (buf.length < bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) if (buf[i] !== bytes[i]) return false;
  return true;
}

function magicKind(buf) {
  if (startsWith(buf, [0x1f, 0x8b])) return 'gzip';
  if (startsWith(buf, [0x50, 0x4b, 0x03, 0x04])) return 'zip';
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(buf, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) || startsWith(buf, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])) return 'gif';
  if (startsWith(buf, [0x25, 0x50, 0x44, 0x46])) return 'pdf';
  if (startsWith(buf, [0x00, 0x61, 0x73, 0x6d])) return 'wasm';
  if (startsWith(buf, [0x4f, 0x67, 0x67, 0x53])) return 'ogg';
  if (buf.length >= 8 && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) return 'mp4';
  if (buf.length >= 2 && buf[0] === 0x78 && (buf[1] === 0x01 || buf[1] === 0x5e || buf[1] === 0x9c || buf[1] === 0xda)) {
    const cm = buf[0] & 0x0f;
    const cinfo = buf[0] >> 4;
    if (cm === 8 && cinfo <= 7 && ((buf[0] * 256 + buf[1]) % 31) === 0) return 'zlib';
  }
  return null;
}

function zeroBias(buf) {
  const pairs = Math.floor(buf.length / 2);
  if (!pairs) return null;
  let even = 0;
  let odd = 0;
  for (let i = 0; i < pairs * 2; i++) {
    if (buf[i] !== 0) continue;
    if (i % 2 === 0) even++;
    else odd++;
  }
  if (odd / pairs > 0.3) return 'utf-16le';
  if (even / pairs > 0.3) return 'utf-16be';
  return null;
}

function strictUtf8(buf) {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buf);
    return true;
  } catch {
    return false;
  }
}

function detectCharset(buf) {
  const evidence = [];
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return { charset: 'utf-8', evidence: ['bom:utf-8'] };
  }
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return { charset: 'utf-16le', evidence: ['bom:utf-16le'] };
  }
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    return { charset: 'utf-16be', evidence: ['bom:utf-16be'] };
  }
  const utf8 = strictUtf8(buf);
  const bias = zeroBias(buf);
  if (utf8 && !bias) {
    evidence.push('charset:utf-8');
    return { charset: 'utf-8', evidence };
  }
  if (bias) {
    evidence.push(utf8 ? 'utf16-zero-bytes' : 'charset:utf-16');
    evidence.push(`charset:${bias}`);
```

_First 80 of 562 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

# File: studio/src/intel/statistics.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/statistics.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7691 B |
| Lines | 147 |
| Hash | 2894070a9a5f |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MEMO_MAX | const | 12 | no | const MEMO_MAX = 8192; |
| MEMO_STR_MAX | const | 13 | no | const MEMO_STR_MAX = 256; |
| PLAIN_STRING | const | 14 | no | const PLAIN_STRING = /^[\\x20\\x21\\x23-\\x5b\\x5d-\\x7e]*$/; // printable ASCII without &quot; and \\ : JSON.stringify adds only the quotes |
| memo | const | 15 | no | const memo = new Map(); |
| K256 | const | 22 | no | const K256 = new Int32Array([ 0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0… |
| MAX_JS_BYTES | const | 32 | no | const MAX_JS_BYTES = 247; // 247 + 0x80 + 8-byte length = 256 = 4 blocks |
| W | const | 33 | no | const W = new Int32Array(64); |
| sha256Head32Ascii | function | 35 | yes | export function sha256Head32Ascii(str) { |
| n | const | 36 | no | const n = str.length; |
| total | const | 38 | no | const total = ((n + 9 + 63) &gt;&gt; 6) &lt;&lt; 6; |
| lenWordAt | const | 39 | no | const lenWordAt = total - 4; // byte offset of the (32-bit) message length; the high word is zero |
| h0 | variable | 40 | no | let h0 = 0x6a09e667 \| 0, h1 = 0xbb67ae85 \| 0, h2 = 0x3c6ef372 \| 0, h3 = 0xa54ff53a \| 0; |
| h4 | variable | 41 | no | let h4 = 0x510e527f \| 0, h5 = 0x9b05688c \| 0, h6 = 0x1f83d9ab \| 0, h7 = 0x5be0cd19 \| 0; |
| p | const | 45 | no | const p = off + i * 4; |
| w | variable | 46 | no | let w = 0; |
| q | const | 50 | no | const q = p + j; |
| byte | variable | 51 | no | let byte = 0; |
| w15 | const | 59 | no | const w15 = W[i - 15], w2 = W[i - 2]; |
| s0 | const | 60 | no | const s0 = ((w15 &gt;&gt;&gt; 7) \| (w15 &lt;&lt; 25)) ^ ((w15 &gt;&gt;&gt; 18) \| (w15 &lt;&lt; 14)) ^ (w15 &gt;&gt;&gt; 3); |
| s1 | const | 61 | no | const s1 = ((w2 &gt;&gt;&gt; 17) \| (w2 &lt;&lt; 15)) ^ ((w2 &gt;&gt;&gt; 19) \| (w2 &lt;&lt; 13)) ^ (w2 &gt;&gt;&gt; 10); |
| a | variable | 64 | no | let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7; |
| S1 | const | 66 | no | const S1 = ((e &gt;&gt;&gt; 6) \| (e &lt;&lt; 26)) ^ ((e &gt;&gt;&gt; 11) \| (e &lt;&lt; 21)) ^ ((e &gt;&gt;&gt; 25) \| (e &lt;&lt; 7)); |
| ch | const | 67 | no | const ch = (e &amp; f) ^ (~e &amp; g); |
| t1 | const | 68 | no | const t1 = ((((((h + S1) \| 0) + ch) \| 0) + K256[i]) \| 0) + W[i] \| 0; |
| S0 | const | 69 | no | const S0 = ((a &gt;&gt;&gt; 2) \| (a &lt;&lt; 30)) ^ ((a &gt;&gt;&gt; 13) \| (a &lt;&lt; 19)) ^ ((a &gt;&gt;&gt; 22) \| (a &lt;&lt; 10)); |
| maj | const | 70 | no | const maj = (a &amp; b) ^ (a &amp; c) ^ (b &amp; c); |
| t2 | const | 71 | no | const t2 = (S0 + maj) \| 0; |
| digest32 | function | 80 | no | function digest32(key) { |
| fast | const | 81 | no | const fast = sha256Head32Ascii(key); |
| sketchHash32 | function | 88 | yes | export function sketchHash32(value) { |
| t | const | 89 | no | const t = typeof value; |
| cacheable | const | 90 | no | const cacheable = t === &#39;number&#39; \|\| (t === &#39;string&#39; &amp;&amp; value.length &lt;= MEMO_STR_MAX); |
| hit | const | 92 | no | const hit = memo.get(value); |
| key | const | 97 | no | const key = t === &#39;string&#39; ? (PLAIN_STRING.test(value) ? &#39;string:&quot;&#39; + value + &#39;&quot;&#39; : &#39;string:&#39; + JSON.stringify(value)) |
| h | const | 100 | no | const h = digest32(key); |
| CardinalitySketch | class | 108 | yes | export class CardinalitySketch { |
| constructor | method | 109 | yes | constructor({ precision = 8, registers } = {}) { |
| add | method | 118 | yes | add(value) { |
| hash | const | 119 | no | const hash = sketchHash32(value); |
| index | const | 120 | no | const index = hash &gt;&gt;&gt; (32 - this.precision), rest = hash &lt;&lt; this.precision; |
| rank | const | 121 | no | const rank = Math.min(32 - this.precision + 1, Math.clz32(rest) + 1); |
| merge | method | 124 | yes | merge(other) { |
| estimate | method | 129 | yes | estimate() { |
| m | const | 130 | no | const m = this.registers.length; |
| alpha | const | 131 | no | const alpha = m === 16 ? 0.673 : m === 32 ? 0.697 : m === 64 ? 0.709 : 0.7213 / (1 + 1.079 / m); |
| sum | variable | 132 | no | let sum = 0, zero = 0; |
| estimate | variable | 134 | no | let estimate = alpha * m * m / sum; |
| toJSON | method | 138 | yes | toJSON() { return { precision: this.precision, registers: [...this.registers] }; } |
| wilsonInterval | function | 141 | yes | export function wilsonInterval(positive, total, z = 1.96) { |
| p | const | 143 | no | const p = positive / total, z2 = z * z, denominator = 1 + z2 / total; |
| center | const | 144 | no | const center = (p + z2 / (2 * total)) / denominator; |
| radius | const | 145 | no | const radius = z * Math.sqrt(p * (1 - p) / total + z2 / (4 * total * total)) / denominator; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 2 | external |
| ./similarity.mjs | import | 3 | [studio/src/intel/similarity.mjs](./similarity.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/intel/learn.mjs](./learn.mjs.md) | ./statistics.mjs |
| [studio/src/intel/schema.mjs](./schema.mjs.md) | ./statistics.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Mergeable bounded cardinality sketch (HyperLogLog, 256 registers by default).
import { createHash, hash as oneShotHash } from 'node:crypto';
import { typedValueKey } from './similarity.mjs';

// The sketch hash is part of persisted state (registers are serialized), so it stays sha256 over
// typedValueKey(value) read as the first big-endian uint32. Only the cost changes:
//  - crypto.hash() one-shot instead of createHash().update().digest() (no Hash object per call),
//  - primitives skip the generic stableStringify walk (typedValueKey of a primitive is
//    typeof + ':' + JSON.stringify(value), reproduced here verbatim),
//  - a small bounded memo, so the same value observed again (the schema profiler observes every
//    value twice: cumulative + window node; enums repeat constantly) is not re-hashed.
const MEMO_MAX = 8192;
const MEMO_STR_MAX = 256;
const PLAIN_STRING = /^[\x20\x21\x23-\x5b\x5d-\x7e]*$/; // printable ASCII without " and \ : JSON.stringify adds only the quotes
const memo = new Map();

// Allocation-free SHA-256 for short ASCII keys (the common case: scalar field values). A native
// crypto call costs ~10-20 us of fixed overhead per invocation; one 64-byte block in JS is ~1 us.
// This is the SAME algorithm and returns the same first digest word (H0); anything it does not
// handle (non-ASCII or > MAX_JS_BYTES) goes to node:crypto. test/unit/sketch-hash.test.mjs checks
// it against node:crypto across every length boundary.
const K256 = new Int32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);
const MAX_JS_BYTES = 247; // 247 + 0x80 + 8-byte length = 256 = 4 blocks
const W = new Int32Array(64);

export function sha256Head32Ascii(str) {
  const n = str.length;
  if (n > MAX_JS_BYTES) return null;
  const total = ((n + 9 + 63) >> 6) << 6;
  const lenWordAt = total - 4; // byte offset of the (32-bit) message length; the high word is zero
  let h0 = 0x6a09e667 | 0, h1 = 0xbb67ae85 | 0, h2 = 0x3c6ef372 | 0, h3 = 0xa54ff53a | 0;
  let h4 = 0x510e527f | 0, h5 = 0x9b05688c | 0, h6 = 0x1f83d9ab | 0, h7 = 0x5be0cd19 | 0;
  for (let off = 0; off < total; off += 64) {
    // Message words straight from the characters: data, then 0x80, zeros, bit length.
    for (let i = 0; i < 16; i++) {
      const p = off + i * 4;
      let w = 0;
      if (p === lenWordAt) w = (n * 8) | 0;
      else if (p <= n + 3) {
        for (let j = 0; j < 4; j++) {
          const q = p + j;
          let byte = 0;
          if (q < n) { byte = str.charCodeAt(q); if (byte > 127) return null; } else if (q === n) byte = 0x80;
          w = (w << 8) | byte;
        }
      }
      W[i] = w;
    }
    for (let i = 16; i < 64; i++) {
      const w15 = W[i - 15], w2 = W[i - 2];
      const s0 = ((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3);
      const s1 = ((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10);
      W[i] = ((((W[i - 16] + s0) | 0) + W[i - 7]) | 0) + s1 | 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = ((((((h + S1) | 0) + ch) | 0) + K256[i]) | 0) + W[i] | 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  return h0 >>> 0;
}

function digest32(key) {
```

_First 80 of 148 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

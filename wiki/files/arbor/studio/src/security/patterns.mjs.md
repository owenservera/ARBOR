# File: studio/src/security/patterns.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/security/patterns.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9252 B |
| Lines | 315 |
| Hash | ca9b1a9899bc |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| B64URL | const | 9 | no | const B64URL = &#39;A-Za-z0-9_-&#39;; |
| fresh | function | 11 | no | function fresh(regex) { |
| decodeBase64Url | function | 15 | no | function decodeBase64Url(part) { |
| b64 | const | 17 | no | const b64 = part.replace(/-/g, &#39;+&#39;).replace(/_/g, &#39;/&#39;); |
| padded | const | 18 | no | const padded = b64 + &#39;=&#39;.repeat((4 - (b64.length % 4)) % 4); |
| luhn | function | 26 | yes | export function luhn(digits) { |
| d | const | 27 | no | const d = String(digits ?? &#39;&#39;).replace(/\\D/g, &#39;&#39;); |
| sum | variable | 29 | no | let sum = 0; |
| dbl | variable | 30 | no | let dbl = false; |
| n | variable | 32 | no | let n = d.charCodeAt(i) - 48; |
| ibanMod97 | function | 44 | yes | export function ibanMod97(iban) { |
| s | const | 45 | no | const s = String(iban ?? &#39;&#39;).replace(/\\s+/g, &#39;&#39;).toUpperCase(); |
| rearranged | const | 47 | no | const rearranged = s.slice(4) + s.slice(0, 4); |
| rem | variable | 48 | no | let rem = 0; |
| chunk | const | 50 | no | const chunk = |
| shannonEntropy | function | 59 | yes | export function shannonEntropy(str) { |
| s | const | 60 | no | const s = String(str ?? &#39;&#39;); |
| counts | const | 62 | no | const counts = new Map(); |
| h | variable | 64 | no | let h = 0; |
| p | const | 66 | no | const p = n / s.length; |
| jsonFieldValue | function | 72 | no | function jsonFieldValue(match) { |
| m | const | 73 | no | const m = /[:=]\\s*[&quot;&#39;]?([^&quot;&#39;\\s,;\\]}]+)/.exec(match); |
| PLACEHOLDER | const | 77 | no | const PLACEHOLDER = /^(null\|true\|false\|none\|undefined\|nil\|nan\|string\|changeme\|\\*+\|x+\|\\$\\{[^}]*\\}\|&lt;[^&gt;]*&gt;)$/i; |
| digitsOf | function | 79 | no | function digitsOf(s) { |
| PATTERNS | const | 92 | yes | export const PATTERNS = [ |
| text | const | 112 | no | const text = decodeBase64Url(header); |
| parsed | const | 115 | no | const parsed = JSON.parse(text); |
| value | const | 135 | no | const value = jsonFieldValue(match); |
| d | const | 157 | no | const d = digitsOf(match); |
| d | const | 182 | no | const d = digitsOf(match); |
| parts | const | 192 | no | const parts = match.split(&#39;.&#39;); |
| re | const | 211 | no | const re = fresh(other.regex); |
| m | variable | 212 | no | let m; |
| HIGH_ENTROPY | const | 227 | no | const HIGH_ENTROPY = &#39;high_entropy_token&#39;; |
| allowedByOptions | function | 229 | no | function allowedByOptions(pattern, { extended, pii }) { |
| detectSecrets | function | 240 | yes | export function detectSecrets(text, { extended = false, pii = false } = {}) { |
| opts | const | 242 | no | const opts = { extended: extended === true, pii: pii === true }; |
| candidates | const | 243 | no | const candidates = []; |
| re | const | 247 | no | const re = fresh(pattern.regex); |
| m | variable | 248 | no | let m; |
| picked | const | 272 | no | const picked = []; |
| overlaps | const | 274 | no | const overlaps = picked.some((kept) =&gt; candidate.start &lt; kept.end &amp;&amp; kept.start &lt; candidate.end); |
| scrub | function | 288 | yes | export function scrub(text, opts = {}, mask = &#39;[REDACTED:{name}]&#39;) { |
| hits | const | 290 | no | const hits = detectSecrets(text, opts); |
| out | variable | 292 | no | let out = text; |
| hit | const | 294 | no | const hit = hits[i]; |
| registerPatterns | function | 301 | yes | export function registerPatterns(registry) { |
| PATTERNS | export | 315 | yes | export default PATTERNS; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/export/export.mjs](../export/export.mjs.md) | ../security/patterns.mjs |
| [studio/src/intel/bench.mjs](../intel/bench.mjs.md) | ../security/patterns.mjs |
| [studio/src/intel/platform.mjs](../intel/platform.mjs.md) | ../security/patterns.mjs |
| [studio/src/studio/world-transfer.mjs](../studio/world-transfer.mjs.md) | ../security/patterns.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * Secret / PII pattern engine for the capture studio.
 *
 * Deterministic, dependency-free. Every pattern carries a name, a kind, a
 * global regex, an optional validator and a confidence. Detection resolves
 * overlaps by confidence (then length), output is sorted by `start`.
 */

const B64URL = 'A-Za-z0-9_-';

function fresh(regex) {
  return new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
}

function decodeBase64Url(part) {
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return Buffer.from(padded, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

/** Luhn checksum over a digit string (non-digits are ignored). */
export function luhn(digits) {
  const d = String(digits ?? '').replace(/\D/g, '');
  if (d.length < 2) return false;
  let sum = 0;
  let dbl = false;
  for (let i = d.length - 1; i >= 0; i -= 1) {
    let n = d.charCodeAt(i) - 48;
    if (dbl) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

/** ISO 13616 IBAN check (mod-97 === 1). */
export function ibanMod97(iban) {
  const s = String(iban ?? '').replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(s)) return false;
  const rearranged = s.slice(4) + s.slice(0, 4);
  let rem = 0;
  for (const ch of rearranged) {
    const chunk =
      ch >= 'A' && ch <= 'Z' ? String(ch.charCodeAt(0) - 55) : ch >= '0' && ch <= '9' ? ch : null;
    if (chunk === null) return false;
    for (const c of chunk) rem = (rem * 10 + (c.charCodeAt(0) - 48)) % 97;
  }
  return rem === 1;
}

/** Shannon entropy in bits per character. */
export function shannonEntropy(str) {
  const s = String(str ?? '');
  if (s.length === 0) return 0;
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  let h = 0;
  for (const n of counts.values()) {
    const p = n / s.length;
    h -= p * Math.log2(p);
  }
  return h;
}

function jsonFieldValue(match) {
  const m = /[:=]\s*["']?([^"'\s,;\]}]+)/.exec(match);
  return m ? m[1] : '';
}

const PLACEHOLDER = /^(null|true|false|none|undefined|nil|nan|string|changeme|\*+|x+|\$\{[^}]*\}|<[^>]*>)$/i;

function digitsOf(s) {
  return String(s ?? '').replace(/\D/g, '');
```

_First 80 of 316 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

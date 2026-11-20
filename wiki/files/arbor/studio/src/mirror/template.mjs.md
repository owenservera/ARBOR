# File: studio/src/mirror/template.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/mirror/template.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6169 B |
| Lines | 132 |
| Hash | 0ef446ad6543 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REDACTED | const | 12 | no | const REDACTED = &#39;[redacted]&#39;; |
| MAX_PAIRS | const | 13 | no | const MAX_PAIRS = 64; |
| usable | function | 15 | no | function usable(from, to) { |
| scalar | function | 22 | no | function scalar(v) { |
| substitutionPairs | function | 29 | yes | export function substitutionPairs(inc, ex) { |
| pairs | const | 30 | no | const pairs = [], seen = new Set(); |
| add | function | 31 | no | const add = (from, to, where) =&gt; { |
| capSegs | const | 35 | no | const capSegs = splitPath(ex.path); |
| a | variable | 38 | no | let a = capSegs[i], b = inc.segs[i]; |
| capQ | const | 43 | no | const capQ = new Map(ex.query); |
| capJson | const | 46 | no | const capJson = ex._json?.v ?? parseJsonMaybe(ex.postData); |
| A | const | 48 | no | const A = flattenLeaves(capJson), B = flattenLeaves(inc.json); |
| a | const | 51 | no | const a = scalar(v), b = scalar(B.get(p)); |
| messagePairs | function | 61 | yes | export function messagePairs(incomingText, capturedText) { |
| a | const | 62 | no | const a = parseJsonMaybe(capturedText), b = parseJsonMaybe(incomingText); |
| pairs | const | 64 | no | const pairs = [], seen = new Set(); |
| A | const | 65 | no | const A = flattenLeaves(a), B = flattenLeaves(b); |
| x | const | 68 | no | const x = scalar(v), y = scalar(B.get(p)); |
| byteVariants | function | 76 | no | function byteVariants(pairs) { |
| out | const | 77 | no | const out = []; |
| ef | const | 80 | no | const ef = JSON.stringify(from).slice(1, -1), et = JSON.stringify(to).slice(1, -1); |
| substituteParts | function | 89 | yes | export function substituteParts(parts, pairs, { json = false } = {}) { |
| variants | const | 91 | no | const variants = byteVariants(pairs); |
| full | const | 92 | no | const full = Buffer.concat(parts); |
| matches | const | 93 | no | const matches = []; |
| i | variable | 95 | no | let i = 0; |
| kept | const | 100 | no | const kept = []; |
| lastEnd | variable | 101 | no | let lastEnd = -1; |
| pieces | const | 104 | no | const pieces = []; |
| cur | variable | 105 | no | let cur = 0; |
| edited | const | 108 | no | const edited = Buffer.concat(pieces); |
| bounds | const | 109 | no | const bounds = []; |
| acc | variable | 110 | no | let acc = 0; |
| mapped | const | 112 | no | const mapped = bounds.map((b) =&gt; { let shift = 0, pos = b; for (const m of kept) { if (m.end &lt;= b) shift += m.to.length - (m.end - m.start); else if (m.start &lt; b) { pos = m.end; shift += m.to.length … |
| shift | variable | 113 | no | let shift = 0, pos = b; |
| outParts | const | 121 | no | const outParts = []; |
| prev | variable | 122 | no | let prev = 0; |
| substituteText | function | 128 | yes | export function substituteText(text, pairs, { json = false } = {}) { |
| r | const | 130 | no | const r = substituteParts([Buffer.from(text)], pairs, { json }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./catalog.mjs | import | 9 | [studio/src/mirror/catalog.mjs](./catalog.mjs.md) |
| ./match.mjs | import | 10 | [studio/src/mirror/match.mjs](./match.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/mirror/index.mjs](./index.mjs.md) | ./template.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Parameter substitution: variable request fields echoed by the captured response.
//
// When the incoming request differs from the captured one in a path segment, a query value or a
// JSON body leaf at the same position, the captured value is replaced by the incoming value
// wherever it appears in the replayed response (bytes, SSE/NDJSON events, WebSocket frames,
// Location headers). Values shorter than 3 characters and redacted values are never used.
// Replacement is byte-exact on the concatenated body and the original chunk boundaries are
// carried through the edit, so chunk timing is preserved even when a value spans two chunks.
import { splitPath } from './catalog.mjs';
import { flattenLeaves, parseJsonMaybe } from './match.mjs';

const REDACTED = '[redacted]';
const MAX_PAIRS = 64;

function usable(from, to) {
  if (typeof from !== 'string' || typeof to !== 'string') return false;
  if (from === to || from.length < 3 || from === REDACTED || from.includes('***')) return false;
  if (/^(true|false|null|undefined|none|auto|default|get|post)$/i.test(from)) return false;
  return true;
}

function scalar(v) {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v) && String(v).length >= 4) return String(v);
  return null;
}

// [{ from, to, where }]
export function substitutionPairs(inc, ex) {
  const pairs = [], seen = new Set();
  const add = (from, to, where) => {
    if (!usable(from, to) || seen.has(from) || pairs.length >= MAX_PAIRS) return;
    seen.add(from); pairs.push({ from, to, where });
  };
  const capSegs = splitPath(ex.path);
  if (capSegs.length === inc.segs.length) {
    for (let i = 0; i < capSegs.length; i++) {
      let a = capSegs[i], b = inc.segs[i];
      try { a = decodeURIComponent(a); b = decodeURIComponent(b); } catch { /* keep raw */ }
      add(a, b, `path[${i}]`);
    }
  }
  const capQ = new Map(ex.query);
  for (const [k, v] of inc.query) if (capQ.has(k)) add(capQ.get(k), v, `query.${k}`);
  if (inc.json !== undefined && ex.postData !== undefined) {
    const capJson = ex._json?.v ?? parseJsonMaybe(ex.postData);
    if (capJson !== undefined) {
      const A = flattenLeaves(capJson), B = flattenLeaves(inc.json);
      for (const [p, v] of A) {
        if (!B.has(p)) continue;
        const a = scalar(v), b = scalar(B.get(p));
        if (a !== null && b !== null) add(a, b, `body${p}`);
      }
    }
  }
  // Longest first so a value never clobbers a longer value that contains it.
  return pairs.sort((x, y) => y.from.length - x.from.length);
}

// Pairs from a client message vs. the captured trigger message (WebSocket turns).
export function messagePairs(incomingText, capturedText) {
  const a = parseJsonMaybe(capturedText), b = parseJsonMaybe(incomingText);
  if (a === undefined || b === undefined) return [];
  const pairs = [], seen = new Set();
  const A = flattenLeaves(a), B = flattenLeaves(b);
  for (const [p, v] of A) {
    if (!B.has(p)) continue;
    const x = scalar(v), y = scalar(B.get(p));
    if (x !== null && y !== null && usable(x, y) && !seen.has(x)) { seen.add(x); pairs.push({ from: x, to: y, where: `msg${p}` }); }
    if (pairs.length >= MAX_PAIRS) break;
  }
  return pairs.sort((x, y) => y.from.length - x.from.length);
}

// Byte-level variants: raw and JSON-string-escaped (for values echoed inside JSON strings).
function byteVariants(pairs) {
  const out = [];
  for (const { from, to } of pairs) {
    out.push({ from: Buffer.from(from), to: Buffer.from(to) });
    const ef = JSON.stringify(from).slice(1, -1), et = JSON.stringify(to).slice(1, -1);
```

_First 80 of 133 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

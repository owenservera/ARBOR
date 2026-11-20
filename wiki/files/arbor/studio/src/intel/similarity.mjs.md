# File: studio/src/intel/similarity.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/similarity.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2349 B |
| Lines | 43 |
| Hash | 952a2b3f3803 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| stableStringify | function | 2 | yes | export function stableStringify(value) { |
| normalizeText | function | 9 | yes | export const normalizeText = (value) =&gt; String(value ?? &#39;&#39;).normalize(&#39;NFKC&#39;).toLowerCase().replace(/\\s+/gu, &#39; &#39;).trim(); |
| textTokens | function | 10 | yes | export const textTokens = (value) =&gt; normalizeText(value).match(/[\\p{L}\\p{N}]+(?:[._-][\\p{L}\\p{N}]+)*/gu) ?? []; |
| typedValueKey | function | 11 | yes | export const typedValueKey = (value) =&gt; typeof value + &#39;:&#39; + stableStringify(value); |
| diceSimilarity | function | 13 | yes | export function diceSimilarity(a, b) { |
| grams | function | 14 | no | const grams = (s) =&gt; { |
| chars | const | 15 | no | const chars = [...normalizeText(s)], out = new Set(); |
| A | const | 20 | no | const A = grams(a), B = grams(b); |
| shared | variable | 22 | no | let shared = 0; for (const gram of A) if (B.has(gram)) shared++; |
| compareRecords | function | 26 | yes | export function compareRecords(a = {}, b = {}, { fields, weights = {}, immutable = [] } = {}) { |
| names | const | 27 | no | const names = fields ?? [...new Set([...Object.keys(a), ...Object.keys(b)])].sort(); |
| comparisons | const | 28 | no | const comparisons = [], conflicts = []; |
| sum | variable | 29 | no | let sum = 0, available = 0, possible = 0; |
| weight | const | 31 | no | const weight = Number.isFinite(weights[field]) ? Math.max(0, weights[field]) : 1; |
| x | const | 33 | no | const x = a[field], y = b[field]; |
| exact | const | 35 | no | const exact = typedValueKey(x) === typedValueKey(y); |
| score | const | 36 | no | const score = exact ? 1 : typeof x === &#39;string&#39; &amp;&amp; typeof y === &#39;string&#39; ? diceSimilarity(x, y) : 0; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/intel/correlate.mjs](./correlate.mjs.md) | ./similarity.mjs |
| [studio/src/intel/discover.mjs](./discover.mjs.md) | ./similarity.mjs |
| [studio/src/intel/graph.mjs](./graph.mjs.md) | ./similarity.mjs |
| [studio/src/intel/identity.mjs](./identity.mjs.md) | ./similarity.mjs |
| [studio/src/intel/search.mjs](./search.mjs.md) | ./similarity.mjs |
| [studio/src/intel/statistics.mjs](./statistics.mjs.md) | ./similarity.mjs |
| [studio/src/studio/world-search.mjs](../studio/world-search.mjs.md) | ../intel/similarity.mjs |
| [studio/src/studio/world-transfer.mjs](../studio/world-transfer.mjs.md) | ../intel/similarity.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Shared deterministic comparison primitives. Scores are evidence, not probabilities.
export function stableStringify(value) {
  if (value === undefined) return 'undefined';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(value).sort().map((k) => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}

export const normalizeText = (value) => String(value ?? '').normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ').trim();
export const textTokens = (value) => normalizeText(value).match(/[\p{L}\p{N}]+(?:[._-][\p{L}\p{N}]+)*/gu) ?? [];
export const typedValueKey = (value) => typeof value + ':' + stableStringify(value);

export function diceSimilarity(a, b) {
  const grams = (s) => {
    const chars = [...normalizeText(s)], out = new Set();
    if (chars.length < 2) return new Set(chars);
    for (let i = 1; i < chars.length; i++) out.add(chars[i - 1] + chars[i]);
    return out;
  };
  const A = grams(a), B = grams(b);
  if (!A.size || !B.size) return 0;
  let shared = 0; for (const gram of A) if (B.has(gram)) shared++;
  return 2 * shared / (A.size + B.size);
}

export function compareRecords(a = {}, b = {}, { fields, weights = {}, immutable = [] } = {}) {
  const names = fields ?? [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  const comparisons = [], conflicts = [];
  let sum = 0, available = 0, possible = 0;
  for (const field of names) {
    const weight = Number.isFinite(weights[field]) ? Math.max(0, weights[field]) : 1;
    possible += weight;
    const x = a[field], y = b[field];
    if (x === null || x === undefined || y === null || y === undefined) continue;
    const exact = typedValueKey(x) === typedValueKey(y);
    const score = exact ? 1 : typeof x === 'string' && typeof y === 'string' ? diceSimilarity(x, y) : 0;
    if (!exact && immutable.includes(field)) conflicts.push(field);
    comparisons.push({ field, score: +score.toFixed(4), exact, weight });
    sum += score * weight; available += weight;
  }
  return { score: conflicts.length ? 0 : available ? +(sum / available).toFixed(4) : 0,
    coverage: possible ? +(available / possible).toFixed(4) : 0, conflicts, comparisons };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

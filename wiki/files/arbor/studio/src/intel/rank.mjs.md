# File: studio/src/intel/rank.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/rank.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10926 B |
| Lines | 293 |
| Hash | 21a2de8957b2 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| STOPWORDS | const | 4 | no | const STOPWORDS = new Set(` a about above after again against all am an and any are aren&#39;t as at be because been before being below between both but by can can&#39;t could couldn&#39;t did didn&#39;t do does doe… |
| sha1 | function | 16 | no | function sha1(s) { |
| trigrams | function | 21 | yes | export function trigrams(s) { |
| padded | const | 22 | no | const padded = ` ${String(s).toLowerCase()} `; |
| out | const | 23 | no | const out = new Set(); |
| jaccardSets | function | 29 | no | function jaccardSets(a, b) { |
| inter | variable | 31 | no | let inter = 0; |
| union | const | 34 | no | const union = a.size + b.size - inter; |
| damerauLevenshtein | function | 39 | yes | export function damerauLevenshtein(a, b, max = Infinity) { |
| la | const | 43 | no | const la = a.length; |
| lb | const | 44 | no | const lb = b.length; |
| d | const | 46 | no | const d = Array.from({ length: la + 1 }, () =&gt; new Uint32Array(lb + 1)); |
| rowMin | variable | 50 | no | let rowMin = d[i][0]; |
| cost | const | 52 | no | const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1; |
| best | variable | 53 | no | let best = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost); |
| cmpStr | function | 65 | no | function cmpStr(a, b) { |
| expandTerm | function | 70 | yes | export function expandTerm(term, vocab, { maxDist = 2, limit = 5, minTrigramJaccard = 0.2 } = {}) { |
| query | const | 71 | no | const query = String(term).toLowerCase(); |
| cap | variable | 72 | no | let cap = Number.isFinite(maxDist) ? maxDist : Infinity; |
| qg | const | 75 | no | const qg = trigrams(query); |
| hits | const | 76 | no | const hits = []; |
| original | const | 78 | no | const original = String(raw); |
| candidate | const | 79 | no | const candidate = original.toLowerCase(); |
| dist | const | 81 | no | const dist = damerauLevenshtein(query, candidate, cap); |
| sim | const | 83 | no | const sim = 1 - dist / Math.max(query.length, candidate.length, 1); |
| tokenize | function | 91 | no | function tokenize(input) { |
| parts | const | 92 | no | const parts = Array.isArray(input) ? input : [input]; |
| tokens | const | 93 | no | const tokens = []; |
| simhash | function | 103 | yes | export function simhash(input, bits = 53) { |
| width | const | 104 | no | const width = Math.max(0, Math.min(64, bits \| 0)); |
| freq | const | 105 | no | const freq = new Map(); |
| votes | const | 107 | no | const votes = new Array(width).fill(0); |
| mask | const | 108 | no | const mask = width &gt;= 64 ? (1n &lt;&lt; 64n) - 1n : (1n &lt;&lt; BigInt(width)) - 1n; |
| hash | variable | 110 | no | let hash = 0n; |
| digest | const | 111 | no | const digest = sha1(token); |
| out | variable | 118 | no | let out = 0n; |
| hamming | function | 124 | yes | export function hamming(a, b) { |
| x | variable | 125 | no | let x = BigInt(a) ^ BigInt(b); |
| count | variable | 126 | no | let count = 0; |
| minhash | function | 135 | yes | export function minhash(tokens, k = 64) { |
| n | const | 136 | no | const n = Math.max(0, k \| 0); |
| out | const | 137 | no | const out = new Uint32Array(n); |
| list | const | 138 | no | const list = Array.isArray(tokens) ? tokens : [...tokens]; |
| min | variable | 140 | no | let min = 0xffffffff; |
| digest | const | 142 | no | const digest = sha1(`${seed}:${token}`); |
| hash | const | 143 | no | const hash = ((digest[0] * 16777216) + (digest[1] &lt;&lt; 16) + (digest[2] &lt;&lt; 8) + digest[3]) &gt;&gt;&gt; 0; |
| jaccardFromMinhash | function | 152 | yes | export function jaccardFromMinhash(a, b) { |
| n | const | 153 | no | const n = Math.max(a.length, b.length); |
| m | const | 155 | no | const m = Math.min(a.length, b.length); |
| equal | variable | 156 | no | let equal = 0; |
| lshClusters | function | 162 | yes | export function lshClusters(items, { bands = 16, rows = 4, threshold = 0.5 } = {}) { |
| bandCount | const | 163 | no | const bandCount = Math.max(1, bands \| 0); |
| rowCount | const | 164 | no | const rowCount = Math.max(1, rows \| 0); |
| prepared | const | 165 | no | const prepared = items.map((item) =&gt; { const tokens = [...item.tokens].map(String); return { id: String(item.id), sig: minhash(tokens, bandCount * rowCount), set: new Set(tokens) }; }); |
| tokens | const | 166 | no | const tokens = [...item.tokens].map(String); |
| buckets | const | 169 | no | const buckets = new Map(); |
| sig | const | 171 | no | const sig = prepared[index].sig; |
| key | variable | 173 | no | let key = String(band); |
| start | const | 174 | no | const start = band * rowCount; |
| bucket | const | 176 | no | const bucket = buckets.get(key); |
| parent | const | 181 | no | const parent = prepared.map((_, index) =&gt; index); |
| find | function | 182 | no | const find = (index) =&gt; { |
| left | const | 192 | no | const left = bucket[i]; |
| right | const | 193 | no | const right = bucket[j]; |
| groups | const | 199 | no | const groups = new Map(); |
| root | const | 201 | no | const root = find(index); |
| group | const | 202 | no | const group = groups.get(root); |
| clusters | const | 206 | no | const clusters = [...groups.values()].filter((ids) =&gt; ids.length &gt;= 2); |
| tfidfVectors | function | 213 | yes | export function tfidfVectors(docs) { |
| n | const | 214 | no | const n = docs.length; |
| df | const | 215 | no | const df = new Map(); |
| counted | const | 216 | no | const counted = docs.map((doc) =&gt; { const counts = new Map(); for (const token of doc.tokens) { const term = String(token); counts.set(term, (counts.get(term) ?? 0) + 1); |
| counts | const | 217 | no | const counts = new Map(); |
| term | const | 219 | no | const term = String(token); |
| idf | const | 225 | no | const idf = new Map(); |
| vectors | const | 227 | no | const vectors = new Map(); |
| vector | const | 229 | no | const vector = new Map(); |
| cosine | function | 237 | yes | export function cosine(vecA, vecB) { |
| dot | variable | 238 | no | let dot = 0; |
| normA | variable | 239 | no | let normA = 0; |
| normB | variable | 240 | no | let normB = 0; |
| rake | function | 251 | yes | export function rake(text, { limit = 10, stopwords = STOPWORDS } = {}) { |
| phrases | const | 252 | no | const phrases = []; |
| phrase | variable | 253 | no | let phrase = []; |
| lastEnd | variable | 254 | no | let lastEnd = 0; |
| seen | variable | 255 | no | let seen = false; |
| source | const | 256 | no | const source = String(text).toLowerCase(); |
| gap | const | 258 | no | const gap = source.slice(lastEnd, match.index); |
| word | const | 263 | no | const word = match[0]; |
| freq | const | 272 | no | const freq = new Map(); |
| deg | const | 273 | no | const deg = new Map(); |
| wordScore | const | 280 | no | const wordScore = new Map(); |
| unique | const | 282 | no | const unique = new Map(); |
| textPhrase | const | 284 | no | const textPhrase = words.join(&#39; &#39;); |
| score | variable | 286 | no | let score = 0; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 2 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/selftest.mjs](../../bin/commands/selftest.mjs.md) | ../../src/intel/rank.mjs |
| [studio/src/intel/bench.mjs](./bench.mjs.md) | ./rank.mjs |
| [studio/src/intel/platform.mjs](./platform.mjs.md) | ./rank.mjs |
| [studio/src/intel/search.mjs](./search.mjs.md) | ./rank.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Deterministic lexical ranking helpers. No I/O, clock, or randomness.
import { createHash } from 'node:crypto';

const STOPWORDS = new Set(`
a about above after again against all am an and any are aren't as at be because been
before being below between both but by can can't could couldn't did didn't do does
doesn't don't down during each few for from had hadn't has hasn't have haven't he
her here him his how i if in into is isn't it its me more most my myself no nor not
of off on only or other our out over own same she should shouldn't so some than that
the their them then there these they this those through to too under up very was
wasn't we were what when where which while who why with won't would wouldn't you
your yours yourself
`.trim().split(/\s+/));

/** @param {string} s SHA-1 digest. */
function sha1(s) {
  return createHash('sha1').update(String(s), 'utf8').digest();
}

/** @param {string} s Padded lowercase character trigrams. */
export function trigrams(s) {
  const padded = `  ${String(s).toLowerCase()}  `;
  const out = new Set();
  for (let i = 0; i + 2 < padded.length; i++) out.add(padded.slice(i, i + 3));
  return out;
}

/** @param {Set<string>} a @param {Set<string>} b Trigram Jaccard. */
function jaccardSets(a, b) {
  if (!a.size && !b.size) return 1;
  let inter = 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const value of small) if (large.has(value)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

/** Optimal string alignment distance; returns max+1 when the bound is exceeded. */
export function damerauLevenshtein(a, b, max = Infinity) {
  a = String(a);
  b = String(b);
  if (a === b) return 0 > max ? max + 1 : 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;
  const d = Array.from({ length: la + 1 }, () => new Uint32Array(lb + 1));
  for (let i = 0; i <= la; i++) d[i][0] = i;
  for (let j = 0; j <= lb; j++) d[0][j] = j;
  for (let i = 1; i <= la; i++) {
    let rowMin = d[i][0];
    for (let j = 1; j <= lb; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      let best = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a.charCodeAt(i - 1) === b.charCodeAt(j - 2) && a.charCodeAt(i - 2) === b.charCodeAt(j - 1)) {
        best = Math.min(best, d[i - 2][j - 2] + 1);
      }
      d[i][j] = best;
      if (best < rowMin) rowMin = best;
    }
    if (rowMin > max) return max + 1;
  }
  return d[la][lb] > max ? max + 1 : d[la][lb];
}

function cmpStr(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Vocab terms within a scaled Damerau bound after a trigram-Jaccard prefilter. */
export function expandTerm(term, vocab, { maxDist = 2, limit = 5, minTrigramJaccard = 0.2 } = {}) {
  const query = String(term).toLowerCase();
  let cap = Number.isFinite(maxDist) ? maxDist : Infinity;
  if (query.length < 3) cap = 0;
  else if (query.length < 5) cap = Math.min(cap, 1);
  const qg = trigrams(query);
  const hits = [];
  for (const raw of vocab) {
    const original = String(raw);
    const candidate = original.toLowerCase();
    if (jaccardSets(qg, trigrams(candidate)) < minTrigramJaccard) continue;
```

_First 80 of 294 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

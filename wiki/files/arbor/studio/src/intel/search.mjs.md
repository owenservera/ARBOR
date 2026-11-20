# File: studio/src/intel/search.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/search.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8536 B |
| Lines | 154 |
| Hash | 1a5e8445052b |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WORD_PATTERN | const | 4 | no | const WORD_PATTERN = /[\\p{L}\\p{N}]+(?:[._-][\\p{L}\\p{N}]+)*/gu; |
| highlightSpans | function | 7 | yes | export function highlightSpans(text, terms) { |
| wanted | const | 8 | no | const wanted = new Set((terms ?? []).map((term) =&gt; String(term).toLowerCase())); |
| spans | const | 9 | no | const spans = []; |
| start | const | 13 | no | const start = match.index, end = start + match[0].length, last = spans[spans.length - 1]; |
| rankModule | variable | 21 | no | let rankModule = null, rankLoad = null; |
| ensureRank | function | 22 | no | function ensureRank() { |
| primeFuzzySearch | function | 30 | yes | export async function primeFuzzySearch() { |
| documentText | function | 35 | no | function documentText(value, depth = 0) { |
| CorpusSearchIndex | class | 41 | yes | export class CorpusSearchIndex { |
| constructor | method | 42 | yes | constructor({ k1 = 1.2, b = 0.75, maxTokens = 20000 } = {}) { |
| add | method | 48 | yes | add(id, document, { text, source, boost = 1 } = {}) { |
| content | const | 50 | no | const content = text ?? documentText(document); |
| all | const | 51 | no | const all = textTokens(content), tokens = all.slice(0, this.maxTokens), frequencies = new Map(); |
| row | const | 53 | no | const row = { id, document, text: String(content), source: source ?? document?.source ?? null, |
| remove | method | 63 | yes | remove(id) { |
| posting | const | 66 | no | const posting = this.postings.get(token); posting.delete(id); |
| vocabulary | method | 71 | yes | vocabulary() { return this.postings.keys(); } |
| search | method | 72 | yes | search(query, { limit = 20, requireAll = false, filter, phraseBoost = 0.3, fuzzy = false } = {}) { |
| terms | const | 73 | no | const terms = [...new Set(textTokens(query))]; |
| candidates | const | 75 | no | const candidates = new Map(), N = this.documents.size, avg = this.totalLength / N \|\| 1; |
| weighted | const | 76 | no | const weighted = terms.map((term) =&gt; ({ term, weight: 1, from: null, dist: 0 })); |
| vocabulary | variable | 80 | no | let vocabulary = null; |
| expansions | variable | 84 | no | let expansions = []; |
| next | const | 87 | no | const next = String(expansion?.term ?? expansion ?? &#39;&#39;); |
| dist | const | 89 | no | const dist = Number.isFinite(expansion?.dist) ? expansion.dist : 0; |
| posting | const | 96 | no | const posting = this.postings.get(term); if (!posting) continue; |
| idf | const | 97 | no | const idf = Math.log(1 + (N - posting.size + 0.5) / (posting.size + 0.5)); |
| row | const | 99 | no | const row = this.documents.get(id), hit = candidates.get(id) ?? { row, score: 0, matchedTerms: [], fuzzyTerms: [] }; |
| phrase | const | 108 | no | const phrase = normalizeText(query); |
| exactPhrase | const | 112 | no | const exactPhrase = normalizeText(row.text).includes(phrase); |
| lowered | const | 113 | no | const lowered = row.text.toLowerCase(); |
| words | const | 114 | no | const words = [...matchedTerms, ...fuzzyTerms.map((entry) =&gt; entry.to)] |
| at | const | 116 | no | const at = words.length ? Math.min(...words) : 0; |
| stats | method | 125 | yes | stats() { return { documents: this.documents.size, terms: this.postings.size, tokens: this.totalLength, |
| has | method | 127 | yes | has(id) { return this.documents.has(String(id)); } |
| applyRow | method | 131 | yes | applyRow(row) { |
| toRows | method | 137 | yes | toRows({ includeDocument = false } = {}) { |
| fromRows | method | 140 | yes | static fromRows(rows, options) { const index = new CorpusSearchIndex(options); for (const row of rows ?? []) index.applyRow(row); return index; } |
| indexCorpus | function | 143 | yes | export function indexCorpus(samples, options) { |
| index | const | 144 | no | const index = new CorpusSearchIndex(options), repeats = new Map(); |
| source | const | 146 | no | const source = sample.source ?? {}; |
| base | const | 147 | no | const base = stableStringify([source.session, source.sid, source.seq, source.domId, source.group, source.index]); |
| ordinal | const | 148 | no | const ordinal = repeats.get(base) ?? 0; repeats.set(base, ordinal + 1); |
| rankCorpus | function | 154 | yes | export function rankCorpus(samples, query, options = {}) { return indexCorpus(samples, options).search(query, options); } |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./similarity.mjs | import | 2 | [studio/src/intel/similarity.mjs](./similarity.mjs.md) |
| ./rank.mjs | dynamic | 24 | [studio/src/intel/rank.mjs](./rank.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/intel/bench.mjs](./bench.mjs.md) | ./search.mjs |
| [studio/src/intel/corpus.mjs](./corpus.mjs.md) | ./search.mjs |
| [studio/src/replay/derive-all.mjs](../replay/derive-all.mjs.md) | ../intel/search.mjs |
| [studio/src/studio/world-search.mjs](../studio/world-search.mjs.md) | ../intel/search.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Incremental, removable BM25 corpus index. Local evidence only; no embeddings or dependencies.
import { textTokens, normalizeText, stableStringify } from './similarity.mjs';

const WORD_PATTERN = /[\p{L}\p{N}]+(?:[._-][\p{L}\p{N}]+)*/gu;

/** Ascending, non-overlapping character offsets of whole-token matches (case-insensitive). */
export function highlightSpans(text, terms) {
  const wanted = new Set((terms ?? []).map((term) => String(term).toLowerCase()));
  const spans = [];
  if (!wanted.size) return spans;
  for (const match of String(text ?? '').matchAll(WORD_PATTERN)) {
    if (!wanted.has(match[0].toLowerCase())) continue;
    const start = match.index, end = start + match[0].length, last = spans[spans.length - 1];
    if (last && start < last[1]) continue;
    spans.push([start, end]);
  }
  return spans;
}

// Lazily resolved optional expansion module; a failed import degrades search to exact matching.
let rankModule = null, rankLoad = null;
function ensureRank() {
  if (!rankLoad) {
    rankLoad = import('./rank.mjs').then((mod) => (rankModule = mod)).catch(() => null);
  }
  return rankLoad;
}

/** Warm the optional rank module so a synchronous fuzzy search can use expandTerm. */
export async function primeFuzzySearch() {
  try { await ensureRank(); } catch { /* optional dependency */ }
  return Boolean(rankModule?.expandTerm);
}

function documentText(value, depth = 0) {
  if (depth > 12 || value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value);
  return Object.entries(value).map(([key, v]) => (Array.isArray(value) ? '' : key + ' ') + documentText(v, depth + 1)).join(' ');
}

export class CorpusSearchIndex {
  constructor({ k1 = 1.2, b = 0.75, maxTokens = 20000 } = {}) {
    this.k1 = Number.isFinite(k1) && k1 > 0 ? k1 : 1.2;
    this.b = Number.isFinite(b) ? Math.max(0, Math.min(1, b)) : 0.75;
    this.maxTokens = Number.isInteger(maxTokens) && maxTokens > 0 ? maxTokens : 20000;
    this.documents = new Map(); this.postings = new Map(); this.totalLength = 0;
  }
  add(id, document, { text, source, boost = 1 } = {}) {
    id = String(id); this.remove(id);
    const content = text ?? documentText(document);
    const all = textTokens(content), tokens = all.slice(0, this.maxTokens), frequencies = new Map();
    for (const token of tokens) frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
    const row = { id, document, text: String(content), source: source ?? document?.source ?? null,
      boost: Number.isFinite(boost) ? Math.max(0, boost) : 1, length: tokens.length, frequencies,
      truncated: all.length > tokens.length };
    this.documents.set(id, row); this.totalLength += row.length;
    for (const [token, frequency] of frequencies) {
      if (!this.postings.has(token)) this.postings.set(token, new Map());
      this.postings.get(token).set(id, frequency);
    }
    return this;
  }
  remove(id) {
    id = String(id); const row = this.documents.get(id); if (!row) return false;
    for (const token of row.frequencies.keys()) {
      const posting = this.postings.get(token); posting.delete(id);
      if (!posting.size) this.postings.delete(token);
    }
    this.totalLength -= row.length; this.documents.delete(id); return true;
  }
  vocabulary() { return this.postings.keys(); }
  search(query, { limit = 20, requireAll = false, filter, phraseBoost = 0.3, fuzzy = false } = {}) {
    const terms = [...new Set(textTokens(query))];
    if (!terms.length || !this.documents.size) return [];
    const candidates = new Map(), N = this.documents.size, avg = this.totalLength / N || 1;
    const weighted = terms.map((term) => ({ term, weight: 1, from: null, dist: 0 }));
    if (fuzzy) {
      if (!rankModule) ensureRank();
      if (typeof rankModule?.expandTerm === 'function') {
        let vocabulary = null;
```

_First 80 of 155 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

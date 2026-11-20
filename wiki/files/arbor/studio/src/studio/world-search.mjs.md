# File: studio/src/studio/world-search.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/world-search.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 25444 B |
| Lines | 411 |
| Hash | cd212291c81b |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WORLD_SEARCH_KINDS | const | 11 | yes | export const WORLD_SEARCH_KINDS = Object.freeze([&#39;message&#39;, &#39;project&#39;, &#39;note&#39;, &#39;task&#39;, &#39;app-note&#39;, &#39;source-reference&#39;, &#39;selection&#39;]); |
| WORLD_SEARCH_CUSTODY | const | 12 | yes | export const WORLD_SEARCH_CUSTODY = Object.freeze([&#39;observed&#39;, &#39;imported&#39;, &#39;all&#39;]); |
| WORLD_SEARCH_LIMITS | const | 15 | yes | export const WORLD_SEARCH_LIMITS = Object.freeze({ conversations: 500, messages: 20000, projects: 500, notes: 500, objects: 500, selections: 500, pageSize: 1000, }); |
| BOUND_KEYS | const | 19 | no | const BOUND_KEYS = [&#39;conversations&#39;, &#39;messages&#39;, &#39;projects&#39;, &#39;notes&#39;, &#39;objects&#39;, &#39;selections&#39;]; |
| fail | function | 20 | no | const fail = (list, kind, id, e) =&gt; list.push({ kind, id: typeof id === &#39;string&#39; ? id : null, code: typeof e?.code === &#39;string&#39; ? e.code : null, message: String(e?.message ?? e) }); |
| boundsWith | function | 23 | no | function boundsWith(overrides) { |
| out | const | 27 | no | const out = { ...WORLD_SEARCH_LIMITS }; |
| value | const | 29 | no | const value = overrides?.[key]; |
| pageSize | const | 35 | no | const pageSize = overrides.pageSize; |
| collect | function | 43 | no | function collect(list, name, max, pageSize) { |
| items | const | 44 | no | const items = []; |
| offset | variable | 46 | no | let offset = 0, total = null; |
| want | const | 48 | no | const want = Math.min(pageSize, max - items.length); |
| result | const | 49 | no | const result = list({ offset, limit: want }); |
| batch | const | 50 | no | const batch = Array.isArray(result?.items) ? result.items : null; |
| richText | function | 62 | no | function richText(value, depth = 0) { |
| scalar | function | 71 | no | const scalar = (value) =&gt; (typeof value === &#39;string&#39; \|\| typeof value === &#39;number&#39; \|\| typeof value === &#39;boolean&#39;) ? String(value) : &#39;&#39;; |
| metaText | function | 72 | no | const metaText = (...values) =&gt; values.map(scalar).filter(Boolean).join(&#39; &#39;); |
| KNOWN_AVAILABILITY | const | 75 | no | const KNOWN_AVAILABILITY = new Set([&#39;locally-available&#39;, &#39;stale&#39;, &#39;missing&#39;, &#39;unavailable&#39;, &#39;unknown&#39;]); |
| observedAvailability | function | 76 | no | function observedAvailability(value) { |
| observed | const | 77 | no | const observed = typeof value === &#39;string&#39; &amp;&amp; value ? value : null; |
| cleanSnippet | function | 80 | no | const cleanSnippet = (value) =&gt; String(value ?? &#39;&#39;).replace(/\\s+/gu, &#39; &#39;).trim(); |
| tokenSet | function | 84 | no | const tokenSet = (value) =&gt; new Set(textTokens(value)); |
| attributedPartPath | function | 90 | no | function attributedPartPath(record, row) { |
| terms | const | 92 | no | const terms = row?.matchedTerms ?? []; |
| candidate | variable | 94 | no | let candidate = null; |
| clip | function | 102 | no | const clip = (value, max = 280) =&gt; { |
| snippet | const | 103 | no | const snippet = cleanSnippet(value); |
| createWorldSearch | function | 107 | yes | export function createWorldSearch({ service, limits } = {}) { |
| bounds | const | 111 | no | const bounds = boundsWith(limits); |
| searchSteps | function | 113 | no | function* searchSteps(q = {}) { |
| query | const | 115 | no | const query = text(q.q, &#39;q&#39;, 1000).trim(); |
| custody | const | 116 | no | const custody = q.custody === undefined \|\| q.custody === null ? &#39;all&#39; : q.custody; |
| kind | const | 118 | no | const kind = q.kind === undefined \|\| q.kind === null ? null : q.kind; |
| offset | const | 120 | no | const offset = integer(q.offset, 0, 1000000); |
| limit | const | 121 | no | const limit = integer(q.limit, 100, 1000, 1); |
| index | const | 123 | no | const index = new CorpusSearchIndex(), hitMeta = new Map(); |
| failures | const | 124 | no | const failures = [], reasons = new Set(); |
| scanned | const | 125 | no | const scanned = { conversations: 0, observedConversations: 0, importedConversations: 0, messages: 0, projects: 0, notes: 0, appNotes: 0, tasks: 0, sourceReferences: 0, selections: 0 }; |
| absentObserved | variable | 128 | no | let absentObserved = 0, absentImported = 0; |
| importProvenance | function | 130 | no | const importProvenance = (record) =&gt; record?.importedFrom !== null &amp;&amp; record?.importedFrom !== undefined &amp;&amp; typeof record.importedFrom === &#39;object&#39;; |
| importedSnapshot | function | 131 | no | const importedSnapshot = (meta, detail) =&gt; [&#39;imported&#39;, &#39;imported-snapshot&#39;].includes(meta?.custody) |
| put | function | 134 | no | const put = (id, record, content, source) =&gt; { |
| key | const | 137 | no | const key = String(id); |
| collectRows | function | 142 | no | const collectRows = (name, reason, list, max, map) =&gt; { |
| found | const | 143 | no | const found = collect((query) =&gt; list(query), name, max, bounds.pageSize); |
| output | const | 145 | no | const output = []; |
| readContext | const | 156 | no | const readContext = {}; |
| conversations | const | 157 | no | const conversations = collect((query) =&gt; service.conversations({ ...query, custody }, readContext), &#39;conversations&#39;, bounds.conversations, bounds.pageSize); |
| detail | variable | 164 | no | let detail; |
| imported | const | 167 | no | const imported = importedSnapshot(meta, detail); |
| reason | const | 173 | no | const reason = typeof detail.coverage.reason === &#39;string&#39; &amp;&amp; detail.coverage.reason ? detail.coverage.reason : &#39;EVIDENCE_UNAVAILABLE&#39;; |
| content | const | 186 | no | const content = [message?.text, richText(message?.blocks)].filter((part) =&gt; typeof part === &#39;string&#39; &amp;&amp; part.trim()).join(&#39;\\n&#39;); |
| role | const | 188 | no | const role = typeof message?.role === &#39;string&#39; ? message.role : &#39;unknown&#39;; |
| recorded | const | 189 | no | const recorded = message?.source &amp;&amp; typeof message.source === &#39;object&#39; ? { ...message.source } : {}; |
| importedFrom | const | 191 | no | const importedFrom = detail?.importedFrom ?? meta?.importedFrom ?? null; |
| id | const | 199 | no | const id = imported ? `${meta.id}:turn:${position}` |
| found | const | 226 | no | const found = collect(query =&gt; service.appItems(query), &#39;app content&#39;, 2000, bounds.pageSize); |
| report | const | 228 | no | const report = service.appItems({ limit: 1 }); |
| itemKind | const | 232 | no | const itemKind = item.kind === &#39;task&#39; ? &#39;task&#39; : &#39;app-note&#39;; |
| id | const | 235 | no | const id = `${item.appId}:${item.id}`; |
| version | const | 245 | no | const version = Number.isSafeInteger(record?.version) ? record.version : null; |
| version | const | 255 | no | const version = Number.isSafeInteger(record?.version) ? record.version : null; |
| structured | const | 258 | no | const structured = Array.isArray(record?.blocks) &amp;&amp; record.blocks.length &gt; 0 ? noteUnits(record) : null; |
| availabilityReason | const | 272 | no | const availabilityReason = record?.availabilityReason; |
| source | const | 297 | no | const source = record?.source ?? {}; |
| availabilityReason | const | 299 | no | const availabilityReason = record?.availabilityReason; |
| tokenTruncated | const | 319 | no | const tokenTruncated = index.stats().truncatedDocuments; |
| limitFilter | const | 323 | no | const limitFilter = hitMeta.size; |
| ranked | const | 324 | no | const ranked = index.search(query, { limit: Math.max(1, limitFilter), ...(kind ? { filter: (document) =&gt; document?.kind === kind } : {}), }); |
| hits | const | 328 | no | const hits = []; |
| partPath | const | 332 | no | const partPath = attributedPartPath(record, row); |
| unitRef | const | 333 | no | const unitRef = partPath &amp;&amp; Array.isArray(record.unitIds) ? noteUnitRef(record.id, record.unitIds[partPath[0]]) : null; |
| truncated | const | 357 | no | const truncated = reasons.size &gt; 0; |
| coverage | const | 358 | no | const coverage = { |
| search | function | 379 | no | function search(q = {}) { |
| steps | const | 380 | no | const steps = searchSteps(q); |
| step | variable | 381 | no | let step; |
| inFlight | variable | 385 | no | let inFlight = false; |
| searchAsync | function | 386 | no | async function searchAsync(q = {}) { |
| steps | const | 391 | no | const steps = searchSteps(q); |
| deadline | const | 392 | no | const deadline = Date.now() + 30000; |
| step | const | 396 | no | const step = steps.next(); |
| registerWorldSearchRoutes | function | 405 | yes | export function registerWorldSearchRoutes({ add, service }) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../intel/search.mjs | import | 5 | [studio/src/intel/search.mjs](../intel/search.mjs.md) |
| ../intel/similarity.mjs | import | 6 | [studio/src/intel/similarity.mjs](../intel/similarity.mjs.md) |
| ./http.mjs | import | 7 | [studio/src/studio/http.mjs](./http.mjs.md) |
| ./world-note-units.mjs | import | 8 | [studio/src/studio/world-note-units.mjs](./world-note-units.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/world-service.mjs](./world-service.mjs.md) | ./world-search.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Bounded, read-only search adapter over the saved local world. It reuses the existing corpus
// index and rebuilds a transient index from current authoritative service reads on every query,
// so edits are visible and no second persistent store or duplicated content index is created.
// It indexes local saved evidence only: no provider network, no URL/session continuity merging.
import { CorpusSearchIndex } from '../intel/search.mjs';
import { textTokens } from '../intel/similarity.mjs';
import { problem, integer, text, storeProblem } from './http.mjs';
import { noteUnits, noteUnitRef } from './world-note-units.mjs';

// Kinds are the actual local record families; messages are saved DOM_TURNS projections.
export const WORLD_SEARCH_KINDS = Object.freeze(['message', 'project', 'note', 'task', 'app-note', 'source-reference', 'selection']);
export const WORLD_SEARCH_CUSTODY = Object.freeze(['observed', 'imported', 'all']);

// Generous finite scan bounds. They are exposed in coverage so a caller can see what was read.
export const WORLD_SEARCH_LIMITS = Object.freeze({
  conversations: 500, messages: 20000, projects: 500, notes: 500, objects: 500, selections: 500, pageSize: 1000,
});

const BOUND_KEYS = ['conversations', 'messages', 'projects', 'notes', 'objects', 'selections'];
const fail = (list, kind, id, e) => list.push({ kind, id: typeof id === 'string' ? id : null,
  code: typeof e?.code === 'string' ? e.code : null, message: String(e?.message ?? e) });

function boundsWith(overrides) {
  if (overrides !== undefined && (!overrides || typeof overrides !== 'object' || Array.isArray(overrides))) {
    throw new TypeError('limits must be an object');
  }
  const out = { ...WORLD_SEARCH_LIMITS };
  for (const key of BOUND_KEYS) {
    const value = overrides?.[key];
    if (value === undefined) continue;
    if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`limits.${key} must be a non-negative integer`);
    out[key] = value;
  }
  if (overrides?.pageSize !== undefined) {
    const pageSize = overrides.pageSize;
    if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 1000) throw new TypeError('limits.pageSize must be an integer between 1 and 1000');
    out.pageSize = pageSize;
  }
  return out;
}

// Read a paginated service collection to its cap. The service page default (100) is never relied on.
function collect(list, name, max, pageSize) {
  const items = [];
  if (max <= 0) return { items, total: null, truncated: true };
  let offset = 0, total = null;
  while (items.length < max) {
    const want = Math.min(pageSize, max - items.length);
    const result = list({ offset, limit: want });
    const batch = Array.isArray(result?.items) ? result.items : null;
    if (!batch) throw new Error(`World search: ${name} list returned no items array`);
    if (total === null) total = Number.isSafeInteger(result.total) && result.total >= 0 ? result.total : null;
    items.push(...batch);
    offset += batch.length;
    if (batch.length < want) break;
    if (total !== null && offset >= total) break;
  }
  return { items, total, truncated: total !== null ? offset < total : items.length >= max };
}

// Structural text for rich/unknown blocks. Keys are kept as structure, every scalar leaf becomes searchable text.
function richText(value, depth = 0) {
  if (depth > 12 || value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
  if (Array.isArray(value)) return value.map((entry) => richText(entry, depth + 1)).filter(Boolean).join(' ');
  if (typeof value === 'object') return Object.entries(value).map(([key, entry]) => key + ' ' + richText(entry, depth + 1)).join(' ');
  return '';
}

const scalar = (value) => (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') ? String(value) : '';
const metaText = (...values) => values.map(scalar).filter(Boolean).join(' ');
// Only these states are understood local outcomes. Any additive/unknown state (active, excluded, ...)
// is conservatively unavailable: it is not local content and it is not evidence of deletion.
const KNOWN_AVAILABILITY = new Set(['locally-available', 'stale', 'missing', 'unavailable', 'unknown']);
function observedAvailability(value) {
  const observed = typeof value === 'string' && value ? value : null;
  return { observed, availability: observed === null ? 'unknown' : KNOWN_AVAILABILITY.has(observed) ? observed : 'unavailable' };
}
const cleanSnippet = (value) => String(value ?? '').replace(/\s+/gu, ' ').trim();
```

_First 80 of 412 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

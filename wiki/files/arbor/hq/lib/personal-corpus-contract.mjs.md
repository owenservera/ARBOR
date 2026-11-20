# File: hq/lib/personal-corpus-contract.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/personal-corpus-contract.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8633 B |
| Lines | 154 |
| Hash | 1496bafa1aab |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CORPUS_SCHEMA | const | 10 | yes | export const CORPUS_SCHEMA = &#39;vivim.corpus-intake/1&#39;; |
| CORPUS_KINDS | const | 11 | yes | export const CORPUS_KINDS = Object.freeze([ &#39;article&#39;, &#39;voice_memo&#39;, &#39;audiobook&#39;, &#39;document&#39;, &#39;image&#39;, &#39;note&#39;, &#39;podcast&#39;, &#39;bookmark&#39;, &#39;conversation&#39;, &#39;other&#39;, ]); |
| CORPUS_SOURCE_IDS | const | 15 | yes | export const CORPUS_SOURCE_IDS = Object.freeze([&#39;SRC-MANUAL-IMPORT&#39;, &#39;SRC-OWNER-INPUT&#39;]); |
| CORPUS_AVAILABILITY | const | 16 | yes | export const CORPUS_AVAILABILITY = Object.freeze([&#39;stored&#39;, &#39;referenced&#39;, &#39;metadata_only&#39;]); |
| CORPUS_PROCESS_STATES | const | 17 | yes | export const CORPUS_PROCESS_STATES = Object.freeze([&#39;not_applicable&#39;, &#39;pending&#39;, &#39;complete&#39;, &#39;blocked&#39;, &#39;failed&#39;]); |
| obj | function | 19 | no | const obj = v =&gt; v !== null &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v) &amp;&amp; |
| text | function | 21 | no | const text = (v, max) =&gt; typeof v === &#39;string&#39; &amp;&amp; v.length &gt; 0 &amp;&amp; |
| allowed | function | 23 | no | const allowed = (v, values) =&gt; values.includes(v); |
| ids | const | 24 | no | const ids = /^(evt\|asset)-[a-z0-9][a-z0-9-]{7,95}$/; |
| world | const | 25 | no | const world = /^[a-z0-9][a-z0-9._-]{0,127}$/; |
| sha | const | 26 | no | const sha = /^[a-f0-9]{64}$/; |
| mime | const | 27 | no | const mime = /^[a-z0-9][a-z0-9.+-]*\\/[a-z0-9][a-z0-9.+-]*$/; |
| surface | const | 28 | no | const surface = /^[a-z][a-z0-9.-]{2,63}$/; |
| assetRef | const | 29 | no | const assetRef = /^asset:asset-[a-z0-9][a-z0-9-]{7,95}$/; |
| iso | const | 30 | no | const iso = /^\\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\d(?:\\.\\d{3})?Z$/; |
| timestamp | function | 31 | no | const timestamp = v =&gt; typeof v === &#39;string&#39; &amp;&amp; iso.test(v) &amp;&amp; |
| refs | function | 33 | no | const refs = v =&gt; Array.isArray(v) &amp;&amp; v.length &lt;= 32 &amp;&amp; |
| safePublicUri | function | 35 | no | const safePublicUri = v =&gt; { |
| u | const | 39 | no | const u = new URL(v); |
| shape | function | 45 | no | function shape(v, required, path, errors) { |
| validateCorpusCapture | function | 55 | yes | export function validateCorpusCapture(r) { |
| errors | const | 56 | no | const errors = []; |
| encoded | variable | 58 | no | let encoded; |
| sort | function | 133 | no | function sort(value) { |
| canonicalCorpusJson | function | 139 | yes | export function canonicalCorpusJson(record) { |
| checked | const | 140 | no | const checked = validateCorpusCapture(record); |
| compareCorpusReplay | function | 144 | yes | export function compareCorpusReplay(a, b) { |
| aa | const | 145 | no | const aa = canonicalCorpusJson(a), bb = canonicalCorpusJson(b); |
| corpusEventDigest | function | 151 | yes | export function corpusEventDigest(record) { |
| a | const | 152 | no | const a = canonicalCorpusJson(record); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 8 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Owner-initiated, portable personal-corpus capture envelope. |
| 4 | invariant | — | — | An intake record is evidence, never permission or a curated KB fact. |
| 5 | invariant | — | — | Pure validation; no filesystem, network, DB, or provider effects. |
| 6 | see | — | contracts/personal-corpus/README.md | contracts/personal-corpus/README.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Owner-initiated, portable personal-corpus capture envelope.
 * @hq:invariant An intake record is evidence, never permission or a curated KB fact.
 * @hq:invariant Pure validation; no filesystem, network, DB, or provider effects.
 * @hq:see contracts/personal-corpus/README.md
 */
import { createHash } from 'node:crypto';

export const CORPUS_SCHEMA = 'vivim.corpus-intake/1';
export const CORPUS_KINDS = Object.freeze([
  'article', 'voice_memo', 'audiobook', 'document', 'image',
  'note', 'podcast', 'bookmark', 'conversation', 'other',
]);
export const CORPUS_SOURCE_IDS = Object.freeze(['SRC-MANUAL-IMPORT', 'SRC-OWNER-INPUT']);
export const CORPUS_AVAILABILITY = Object.freeze(['stored', 'referenced', 'metadata_only']);
export const CORPUS_PROCESS_STATES = Object.freeze(['not_applicable', 'pending', 'complete', 'blocked', 'failed']);

const obj = v => v !== null && typeof v === 'object' && !Array.isArray(v) &&
  Object.getPrototypeOf(v) === Object.prototype;
const text = (v, max) => typeof v === 'string' && v.length > 0 &&
  v.length <= max && v.trim() === v;
const allowed = (v, values) => values.includes(v);
const ids = /^(evt|asset)-[a-z0-9][a-z0-9-]{7,95}$/;
const world = /^[a-z0-9][a-z0-9._-]{0,127}$/;
const sha = /^[a-f0-9]{64}$/;
const mime = /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/;
const surface = /^[a-z][a-z0-9.-]{2,63}$/;
const assetRef = /^asset:asset-[a-z0-9][a-z0-9-]{7,95}$/;
const iso = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/;
const timestamp = v => typeof v === 'string' && iso.test(v) &&
  Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 19) === v.slice(0, 19);
const refs = v => Array.isArray(v) && v.length <= 32 &&
  v.every(x => text(x, 256)) && new Set(v).size === v.length;
const safePublicUri = v => {
  if (v === null) return true;
  if (!text(v, 2048)) return false;
  try {
    const u = new URL(v);
    return (u.protocol === 'http:' || u.protocol === 'https:') &&
      !!u.hostname && !u.username && !u.password && !u.search &&
      !u.hash && u.href === v;
  } catch { return false; }
};
function shape(v, required, path, errors) {
  if (!obj(v)) { errors.push(path + ':object_required'); return false; }
  for (const key of required)
    if (!Object.hasOwn(v, key)) errors.push(path + '.' + key + ':required');
  for (const key of Object.keys(v))
    if (!required.includes(key)) errors.push(path + '.' + key + ':unknown_field');
  return true;
}

/** Deterministic, strict contract validator. Never repairs a malformed record. */
export function validateCorpusCapture(r) {
  const errors = [];
  if (!obj(r)) return { ok: false, errors: ['capture:object_required'] };
  let encoded;
  try { encoded = JSON.stringify(r); }
  catch { return { ok:false, errors:['capture:not_json_serializable'] }; }
  if (encoded === undefined) return { ok:false, errors:['capture:not_json_serializable'] };
  if (encoded.length > 16384)
    return { ok:false, errors:['capture:size_limit'] };
  if (!shape(r, ['schema','eventId','assetId','worldId','kind','title','capturedAt',
    'source','asset','policy','lineage'], 'capture', errors)) return { ok:false, errors };
  if (r.schema !== CORPUS_SCHEMA) errors.push('schema:unsupported');
  if (typeof r.eventId !== 'string' || !ids.test(r.eventId) || !r.eventId.startsWith('evt-'))
    errors.push('eventId:invalid');
  if (typeof r.assetId !== 'string' || !ids.test(r.assetId) || !r.assetId.startsWith('asset-'))
    errors.push('assetId:invalid');
  if (typeof r.worldId !== 'string' || !world.test(r.worldId)) errors.push('worldId:invalid');
  if (!allowed(r.kind, CORPUS_KINDS)) errors.push('kind:unknown');
  if (!text(r.title, 160)) errors.push('title:invalid');
  if (!timestamp(r.capturedAt)) errors.push('capturedAt:invalid');
  if (shape(r.source, ['registryId','mechanism','surface','actor','publicUri'], 'source', errors)) {
    if (!allowed(r.source.registryId, CORPUS_SOURCE_IDS)) errors.push('source.registryId:unknown');
    if (!allowed(r.source.mechanism, ['import','push'])) errors.push('source.mechanism:invalid');
    if (!text(r.source.surface, 64) || !surface.test(r.source.surface))
      errors.push('source.surface:invalid');
    if (r.source.actor !== 'owner') errors.push('source.actor:invalid');
```

_First 80 of 155 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

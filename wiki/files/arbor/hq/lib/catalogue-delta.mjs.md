# File: hq/lib/catalogue-delta.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/catalogue-delta.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9911 B |
| Lines | 169 |
| Hash | 220fea365981 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CATALOGUE_SCHEMA | const | 10 | yes | export const CATALOGUE_SCHEMA = &#39;vivim.catalogue-export/1&#39;; |
| DELTA_SCHEMA | const | 11 | yes | export const DELTA_SCHEMA = &#39;vivim.catalogue-delta/1&#39;; |
| MAX_RECORDS | const | 12 | no | const MAX_RECORDS = 100_000; |
| MAX_SOURCES | const | 13 | no | const MAX_SOURCES = 1_000; |
| MAX_EVIDENCE | const | 14 | no | const MAX_EVIDENCE = 32; |
| SOURCE_STATES | const | 15 | no | const SOURCE_STATES = new Set([&#39;complete&#39;, &#39;partial&#39;, &#39;missing&#39;, &#39;blocked&#39;, &#39;conflicting&#39;]); |
| RECORD_STATES | const | 16 | no | const RECORD_STATES = new Set([&#39;unknown&#39;, &#39;planned&#39;, &#39;researched&#39;, &#39;implemented&#39;, &#39;tested_fixture&#39;, &#39;integrated&#39;, &#39;blocked&#39;, &#39;conflicting&#39;, &#39;retired&#39;]); |
| ID_RE | const | 17 | no | const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:/@#-]{0,255}$/; |
| DIGEST_RE | const | 18 | no | const DIGEST_RE = /^[a-f0-9]{40}([a-f0-9]{24})?$/; |
| UNSAFE | const | 19 | no | const UNSAFE = /(?:^\|\\/)(?:\\.env[^/]*\|[^/]*\\.pem\|[^/]*\\.p12\|[^/]*\\.keystore\|cookies\|login data\|storage-state\\.json\|session\\.json\|release-profile\\.json)(?:\\/\|$)\|[?&amp;](?:token\|api_key\|password\|secret)=/… |
| fail | function | 21 | no | function fail(message) { throw new Error(&#39;C4_CATALOGUE_&#39; + message); } |
| string | function | 22 | no | function string(value, label, limit = 1024) { |
| id | function | 26 | no | function id(value, label = &#39;ID&#39;) { |
| hash | function | 30 | no | function hash(value) { |
| canonical | function | 33 | no | function canonical(value) { |
| result | const | 36 | no | const result = Object.create(null); |
| ordered | function | 42 | no | function ordered(rows) { return [...rows].sort((a, b) =&gt; a.id &lt; b.id ? -1 : a.id &gt; b.id ? 1 : 0); } |
| unique | function | 43 | no | function unique(rows, what) { |
| result | const | 44 | no | const result = new Map(); |
| revision | function | 51 | no | function revision(value) { |
| text | const | 52 | no | const text = string(value, &#39;REVISION&#39;, 128); |
| source | function | 56 | no | function source(row) { |
| state | const | 58 | no | const state = string(row.state, &#39;SOURCE_STATE&#39;, 32); |
| evidence | function | 62 | no | function evidence(row) { |
| state | const | 68 | no | const state = string(row.status, &#39;STATUS&#39;, 32); |
| digest | const | 70 | no | const digest = string(row.contentDigest, &#39;CONTENT_DIGEST&#39;, 64); |
| proofs | const | 72 | no | const proofs = row.evidence ?? []; |
| clean | const | 74 | no | const clean = { |
| validateExisting | function | 86 | no | function validateExisting(envelope) { |
| raw | const | 88 | no | const raw = { schema: envelope.schema, authority: envelope.authority, sources: envelope.sources, records: envelope.records }; |
| buildCatalogueSnapshot | function | 98 | yes | export function buildCatalogueSnapshot({ sources = [], records = [], previous = null } = {}) { |
| updates | const | 101 | no | const updates = unique(sources.map(source), &#39;SOURCE&#39;); |
| sourceRows | const | 102 | no | const sourceRows = new Map((previous?.sources ?? []).map((x) =&gt; [x.id, x])); |
| updatesById | const | 105 | no | const updatesById = unique(records.map(record), &#39;RECORD&#39;); |
| rows | const | 106 | no | const rows = new Map((previous?.records ?? []).map((x) =&gt; [x.id, x])); |
| currentSource | const | 108 | no | const currentSource = sourceRows.get(item.sourceId); |
| older | const | 112 | no | const older = rows.get(item.id); |
| body | const | 119 | no | const body = { schema: CATALOGUE_SCHEMA, authority: &#39;repos-hq&#39;, sources: ordered(sourceRows.values()), records: ordered(rows.values()) }; |
| diffCatalogueSnapshots | function | 124 | yes | export function diffCatalogueSnapshots(previous, next) { |
| oldSources | const | 127 | no | const oldSources = new Map((previous?.sources ?? []).map((x) =&gt; [x.id, x])); |
| oldRecords | const | 128 | no | const oldRecords = new Map((previous?.records ?? []).map((x) =&gt; [x.id, x])); |
| sourceUpdates | const | 129 | no | const sourceUpdates = next.sources.filter((x) =&gt; hash(x) !== hash(oldSources.get(x.id) ?? null)); |
| recordUpserts | const | 130 | no | const recordUpserts = next.records.filter((x) =&gt; hash(x) !== hash(oldRecords.get(x.id) ?? null)); |
| replayCatalogueDelta | function | 135 | yes | export function replayCatalogueDelta(previous, delta) { |
| next | const | 140 | no | const next = buildCatalogueSnapshot({ previous, sources: delta.sourceUpdates, records: delta.recordUpserts }); |
| queryCatalogueSnapshot | function | 146 | yes | export function queryCatalogueSnapshot(envelope, { sourceId = null, status = null, kind = null, limit = 100, offset = 0 } = {}) { |
| max | const | 148 | no | const max = Math.max(0, Math.min(1000, Number.isInteger(limit) ? limit : 100)); |
| skip | const | 149 | no | const skip = Math.max(0, Number.isInteger(offset) ? offset : 0); |
| rows | const | 150 | no | const rows = envelope.records.filter((x) =&gt; (sourceId === null \|\| x.sourceId === sourceId) &amp;&amp; (status === null \|\| x.status === status) &amp;&amp; (kind === null \|\| x.kind === kind)); |
| snapshotHqSemanticIds | function | 155 | yes | export function snapshotHqSemanticIds(db, { repoRevision, previous = null, limit = MAX_RECORDS } = {}) { |
| rev | const | 157 | no | const rev = revision(repoRevision); |
| bound | const | 158 | no | const bound = Math.max(1, Math.min(MAX_RECORDS, Number.isInteger(limit) ? limit : MAX_RECORDS)); |
| items | const | 159 | no | const items = db.prepare(&#39;SELECT id, kind, status, authority, provenance FROM semantic_id ORDER BY id LIMIT ?&#39;).all(bound + 1); |
| records | const | 161 | no | const records = items.map((row) =&gt; { const stableId = id(row.id); const owner = string(String(row.authority \|\| &#39;hq&#39;), &#39;AUTHORITY&#39;, 128); const status = row.status === &#39;deprecated&#39; ? &#39;retired&#39; : row.s… |
| stableId | const | 162 | no | const stableId = id(row.id); |
| owner | const | 163 | no | const owner = string(String(row.authority \|\| &#39;hq&#39;), &#39;AUTHORITY&#39;, 128); |
| status | const | 164 | no | const status = row.status === &#39;deprecated&#39; ? &#39;retired&#39; : row.status === &#39;proposed&#39; ? &#39;planned&#39; : &#39;unknown&#39;; |
| contentDigest | const | 165 | no | const contentDigest = hash({ id: stableId, kind: row.kind, status: row.status, authority: owner, provenance: row.provenance }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 8 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-114-compare-registered-repos.mjs](../aii/fixtures/HQ-114-compare-registered-repos.mjs.md) | ../../lib/catalogue-delta.mjs |
| [hq/aii/fixtures/HQ-120-harvestable-update-monitoring.mjs](../aii/fixtures/HQ-120-harvestable-update-monitoring.mjs.md) | ../../lib/catalogue-delta.mjs |
| [hq/test/catalogue-delta.test.mjs](../test/catalogue-delta.test.mjs.md) | ../lib/catalogue-delta.mjs |
| [hq/version-intelligence/identity/legacy-adapters.mjs](../version-intelligence/identity/legacy-adapters.mjs.md) | ../../lib/catalogue-delta.mjs |
| [hq/version-intelligence/identity/test/identity.test.mjs](../version-intelligence/identity/test/identity.test.mjs.md) | ../../../lib/catalogue-delta.mjs |
| [tests/hq-version-intelligence/hvi-contract-qa.test.mjs](../../tests/hq-version-intelligence/hvi-contract-qa.test.mjs.md) | ../../hq/lib/catalogue-delta.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Read-only bounded C4 catalogue export and replay over existing HQ semantic and source authorities. |
| 3 | owner | hq | — | hq |
| 4 | task | — | — | VIVIM-C4-LANE-C |
| 5 | invariant | — | — | This is an interchange projection, not an index, graph, registry, execution grant or production certificate. |
| 6 | invariant | — | — | Historical records never disappear without an explicit evidenced tombstone. |

## Excerpt

```javascript
/**
 * @hq:context Read-only bounded C4 catalogue export and replay over existing HQ semantic and source authorities.
 * @hq:owner hq
 * @hq:task VIVIM-C4-LANE-C
 * @hq:invariant This is an interchange projection, not an index, graph, registry, execution grant or production certificate.
 * @hq:invariant Historical records never disappear without an explicit evidenced tombstone.
 */
import { createHash } from 'node:crypto';

export const CATALOGUE_SCHEMA = 'vivim.catalogue-export/1';
export const DELTA_SCHEMA = 'vivim.catalogue-delta/1';
const MAX_RECORDS = 100_000;
const MAX_SOURCES = 1_000;
const MAX_EVIDENCE = 32;
const SOURCE_STATES = new Set(['complete', 'partial', 'missing', 'blocked', 'conflicting']);
const RECORD_STATES = new Set(['unknown', 'planned', 'researched', 'implemented', 'tested_fixture', 'integrated', 'blocked', 'conflicting', 'retired']);
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:/@#-]{0,255}$/;
const DIGEST_RE = /^[a-f0-9]{40}([a-f0-9]{24})?$/;
const UNSAFE = /(?:^|\/)(?:\.env[^/]*|[^/]*\.pem|[^/]*\.p12|[^/]*\.keystore|cookies|login data|storage-state\.json|session\.json|release-profile\.json)(?:\/|$)|[?&](?:token|api_key|password|secret)=/i;

function fail(message) { throw new Error('C4_CATALOGUE_' + message); }
function string(value, label, limit = 1024) {
  if (typeof value !== 'string' || !value.length || value.length > limit || /[\x00-\x1f]/.test(value) || UNSAFE.test(value)) fail('INVALID_' + label);
  return value;
}
function id(value, label = 'ID') {
  if (typeof value !== 'string' || !ID_RE.test(value)) fail('INVALID_' + label);
  return value;
}
function hash(value) {
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    const result = Object.create(null);
    for (const key of Object.keys(value).sort()) result[key] = canonical(value[key]);
    return result;
  }
  return value;
}
function ordered(rows) { return [...rows].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0); }
function unique(rows, what) {
  const result = new Map();
  for (const row of rows) {
    if (result.has(row.id)) fail('DUPLICATE_' + what);
    result.set(row.id, row);
  }
  return result;
}
function revision(value) {
  const text = string(value, 'REVISION', 128);
  if (!/^[A-Za-z0-9._:-]{6,128}$/.test(text)) fail('INVALID_REVISION');
  return text;
}
function source(row) {
  if (!row || typeof row !== 'object') fail('INVALID_SOURCE');
  const state = string(row.state, 'SOURCE_STATE', 32);
  if (!SOURCE_STATES.has(state)) fail('INVALID_SOURCE_STATE');
  return { id: id(row.id), revision: revision(row.revision), state, owner: id(row.owner) };
}
function evidence(row) {
  if (!row || typeof row !== 'object') fail('INVALID_EVIDENCE');
  return { type: id(row.type, 'EVIDENCE_TYPE'), ref: string(row.ref, 'EVIDENCE_REF', 1024) };
}
function record(row) {
  if (!row || typeof row !== 'object') fail('INVALID_RECORD');
  const state = string(row.status, 'STATUS', 32);
  if (!RECORD_STATES.has(state)) fail('INVALID_STATUS');
  const digest = string(row.contentDigest, 'CONTENT_DIGEST', 64);
  if (!DIGEST_RE.test(digest)) fail('INVALID_CONTENT_DIGEST');
  const proofs = row.evidence ?? [];
  if (!Array.isArray(proofs) || proofs.length > MAX_EVIDENCE) fail('EVIDENCE_LIMIT');
  const clean = {
    id: id(row.id), kind: id(row.kind, 'KIND'), sourceId: id(row.sourceId, 'SOURCE_ID'),
    sourceRevision: revision(row.sourceRevision), contentDigest: digest, status: state,
    evidence: ordered(proofs.map(evidence).map((x) => ({ ...x, id: x.type + ':' + x.ref }))).map(({ id: ignored, ...rest }) => rest),
  };
  if (row.tombstone !== undefined) {
    if (!row.tombstone || typeof row.tombstone !== 'object') fail('INVALID_TOMBSTONE');
```

_First 80 of 170 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

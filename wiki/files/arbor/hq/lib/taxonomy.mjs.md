# File: hq/lib/taxonomy.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/taxonomy.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14743 B |
| Lines | 374 |
| Hash | 6f24323d83c3 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TAXONOMY_SCHEMA | const | 22 | yes | export const TAXONOMY_SCHEMA = &#39;hq.canonical-taxonomy/1&#39;; |
| REGISTRY_PATH | const | 24 | no | const REGISTRY_PATH = &#39;hq/registry/canonical-taxonomy.v1.json&#39;; |
| DEFAULT_FILE | const | 25 | no | const DEFAULT_FILE = fileURLToPath(new URL(&#39;../registry/canonical-taxonomy.v1.json&#39;, import.meta.url)); |
| REQUIRED_SECTIONS | const | 28 | no | const REQUIRED_SECTIONS = [ |
| REQUIRED_AUTHORITY_LABELS | const | 37 | no | const REQUIRED_AUTHORITY_LABELS = [ |
| cache | const | 41 | no | const cache = new Map(); |
| asArray | function | 43 | no | function asArray(value) { |
| resolveFile | function | 47 | no | function resolveFile(filePath) { |
| raw | const | 49 | no | const raw = String(filePath); |
| loadTaxonomy | function | 61 | yes | export function loadTaxonomy({ path: filePath = null } = {}) { |
| file | const | 62 | no | const file = resolveFile(filePath); |
| parsed | variable | 69 | no | let parsed; |
| taxonomyDigest | function | 90 | yes | export function taxonomyDigest(taxonomy) { |
| payload | const | 91 | no | const payload = taxonomy &amp;&amp; typeof taxonomy === &#39;object&#39; &amp;&amp; !Array.isArray(taxonomy) |
| taxonomySection | function | 104 | yes | export function taxonomySection({ section = null, taxonomy = null } = {}) { |
| source | const | 105 | no | const source = taxonomy \|\| loadTaxonomy(); |
| rows | const | 106 | no | const rows = asArray(source?.[String(section ?? &#39;&#39;)]); |
| taxonomyLookup | function | 116 | yes | export function taxonomyLookup({ section = null, id = null, taxonomy = null } = {}) { |
| wanted | const | 117 | no | const wanted = String(id ?? &#39;&#39;); |
| rows | const | 119 | no | const rows = taxonomySection({ section, taxonomy }); |
| found | const | 120 | no | const found = rows.find((row) =&gt; row &amp;&amp; String(row.id ?? &#39;&#39;) === wanted); |
| taxonomyValidate | function | 134 | yes | export function taxonomyValidate(taxonomy) { |
| errors | const | 135 | no | const errors = []; |
| warnings | const | 136 | no | const warnings = []; |
| idsBySection | const | 153 | no | const idsBySection = new Map(); |
| seen | const | 155 | no | const seen = new Set(); |
| id | const | 161 | no | const id = String(row.id ?? &#39;&#39;); |
| layerIds | const | 173 | no | const layerIds = idsBySection.get(&#39;layers&#39;); |
| statusIds | const | 174 | no | const statusIds = idsBySection.get(&#39;statuses&#39;); |
| scopeIds | const | 175 | no | const scopeIds = idsBySection.get(&#39;scopes&#39;); |
| authorityIds | const | 176 | no | const authorityIds = idsBySection.get(&#39;authority&#39;); |
| authorityLabels | const | 177 | no | const authorityLabels = new Set( taxonomy.authority.map((row) =&gt; String(row?.label ?? &#39;&#39;)).filter(Boolean), ); |
| lifecycleLabels | const | 180 | no | const lifecycleLabels = new Set( taxonomy.lifecycle.map((row) =&gt; String(row?.label ?? &#39;&#39;)).filter(Boolean), ); |
| grammarPrefixes | const | 183 | no | const grammarPrefixes = new Set( taxonomy.idGrammar.map((row) =&gt; String(row?.prefix ?? &#39;&#39;)).filter(Boolean), ); |
| layerKeys | const | 188 | no | const layerKeys = new Set(layerIds); |
| id | const | 190 | no | const id = String(row?.id ?? &#39;&#39;); |
| dot | const | 191 | no | const dot = id.lastIndexOf(&#39;.&#39;); |
| scopeKeys | const | 197 | no | const scopeKeys = new Set(scopeIds); |
| usedPrefixes | const | 208 | no | const usedPrefixes = new Set(); |
| id | const | 210 | no | const id = String(row?.id ?? &#39;&#39;); |
| prefix | const | 214 | no | const prefix = String(row?.id_prefix ?? &#39;&#39;); |
| prefix | const | 224 | no | const prefix = String(row?.prefix ?? &#39;&#39;); |
| id | const | 233 | no | const id = String(row.id ?? &#39;&#39;); |
| id | const | 260 | no | const id = String(row.id ?? &#39;&#39;); |
| ownerTerms | const | 267 | no | const ownerTerms = new Map(); |
| engineeringTerms | const | 268 | no | const engineeringTerms = new Map(); |
| id | const | 271 | no | const id = String(row.id ?? &#39;&#39;); |
| owner | const | 272 | no | const owner = row.owner_term == null ? &#39;&#39; : String(row.owner_term); |
| engineering | const | 273 | no | const engineering = row.engineering_term == null ? &#39;&#39; : String(row.engineering_term); |
| key | const | 275 | no | const key = owner.toLowerCase(); |
| key | const | 282 | no | const key = engineering.toLowerCase(); |
| id | const | 293 | no | const id = String(row.id ?? &#39;&#39;); |
| expected | const | 308 | no | const expected = taxonomyDigest(taxonomy); |
| taxonomyOwnerSurface | function | 322 | yes | export function taxonomyOwnerSurface({ term = null, taxonomy = null } = {}) { |
| wanted | const | 323 | no | const wanted = String(term ?? &#39;&#39;).trim().toLowerCase(); |
| rows | const | 325 | no | const rows = taxonomySection({ section: &#39;vocabulary&#39;, taxonomy }); |
| byOwner | const | 326 | no | const byOwner = rows.find((row) =&gt; row &amp;&amp; String(row.owner_term ?? &#39;&#39;).toLowerCase() === wanted); |
| byEngineering | const | 328 | no | const byEngineering = rows.find( (row) =&gt; row &amp;&amp; String(row.engineering_term ?? &#39;&#39;).toLowerCase() === wanted, ); |
| byKey | const | 332 | no | const byKey = rows.find((row) =&gt; row &amp;&amp; String(row.key ?? &#39;&#39;).toLowerCase() === wanted); |
| taxonomyEngineeringTerm | function | 343 | yes | export function taxonomyEngineeringTerm({ term = null, taxonomy = null } = {}) { |
| wanted | const | 344 | no | const wanted = String(term ?? &#39;&#39;).trim().toLowerCase(); |
| rows | const | 346 | no | const rows = taxonomySection({ section: &#39;vocabulary&#39;, taxonomy }); |
| byEngineering | const | 347 | no | const byEngineering = rows.find( (row) =&gt; row &amp;&amp; String(row.engineering_term ?? &#39;&#39;).toLowerCase() === wanted, ); |
| byKey | const | 351 | no | const byKey = rows.find((row) =&gt; row &amp;&amp; String(row.key ?? &#39;&#39;).toLowerCase() === wanted); |
| taxonomyStatuses | function | 362 | yes | export function taxonomyStatuses({ record = null, taxonomy = null } = {}) { |
| wanted | const | 363 | no | const wanted = String(record ?? &#39;&#39;).trim().toLowerCase(); |
| rows | const | 365 | no | const rows = taxonomySection({ section: &#39;statuses&#39;, taxonomy }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 17 | external |
| node:path | import | 18 | external |
| node:url | import | 19 | external |
| ./util.mjs | import | 20 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/test/taxonomy.test.mjs](../test/taxonomy.test.mjs.md) | ../lib/taxonomy.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Loader and validator for the canonical taxonomy (hq.canonical-taxonomy/1). |
| 3 | owner | hq | — | hq |
| 4 | task | — | — | lane-taxonomy |
| 5 | why | — | — | One vocabulary has to be resolvable from every surface; a glossary of |
| 7 | invariant | — | — | Read-only and pure: the loader never writes and never mutates the |
| 9 | invariant | — | — | A missing or malformed registry file throws an error naming the |
| 11 | invariant | — | — | The digest is computed over the payload minus the digest field, |
| 13 | see | — | docs/CANONICAL-TAXONOMY.md | docs/CANONICAL-TAXONOMY.md |
| 14 | see | — | hq/registry/canonical-taxonomy.v1.json | hq/registry/canonical-taxonomy.v1.json |
| 15 | see | — | docs/AGENTIC-RULEBOOK.md | docs/AGENTIC-RULEBOOK.md |

## Excerpt

```javascript
/**
 * @hq:context Loader and validator for the canonical taxonomy (hq.canonical-taxonomy/1).
 * @hq:owner hq
 * @hq:task lane-taxonomy
 * @hq:why One vocabulary has to be resolvable from every surface; a glossary of
 *   whatever the code happens to do cannot be checked, only read.
 * @hq:invariant Read-only and pure: the loader never writes and never mutates the
 *   cached registry. Callers receive copies.
 * @hq:invariant A missing or malformed registry file throws an error naming the
 *   expected path.
 * @hq:invariant The digest is computed over the payload minus the digest field,
 *   so the same taxonomy always produces the same digest.
 * @hq:see docs/CANONICAL-TAXONOMY.md
 * @hq:see hq/registry/canonical-taxonomy.v1.json
 * @hq:see docs/AGENTIC-RULEBOOK.md
 */
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalJson, sha256 } from './util.mjs';

export const TAXONOMY_SCHEMA = 'hq.canonical-taxonomy/1';

const REGISTRY_PATH = 'hq/registry/canonical-taxonomy.v1.json';
const DEFAULT_FILE = fileURLToPath(new URL('../registry/canonical-taxonomy.v1.json', import.meta.url));

// The 15 sections of the taxonomy. Order is the order the contract lists them.
const REQUIRED_SECTIONS = [
  'layers', 'entities', 'idGrammar', 'authority', 'lifecycle', 'statuses',
  'effects', 'scopes', 'trust', 'families', 'vocabulary', 'nonEquivalences',
  'schemaIds', 'naming', 'extension',
];

// The document authority labels the rule book pins. The decision vocabulary
// (owner, architecture, ...) lives in the same section under a different
// `vocabulary` value and is never conflated with this list.
const REQUIRED_AUTHORITY_LABELS = [
  'vendor_documented', 'project_observed', 'local_custom', 'proposed', 'historical',
];

const cache = new Map();

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function resolveFile(filePath) {
  if (filePath == null || String(filePath).trim() === '') return DEFAULT_FILE;
  const raw = String(filePath);
  if (isAbsolute(raw)) return raw;
  return resolve(process.cwd(), raw);
}

/**
 * loadTaxonomy — read and cache the canonical taxonomy registry.
 *
 * @param {{path?: string|null}} options explicit registry path; defaults to
 *   hq/registry/canonical-taxonomy.v1.json next to this module.
 * @returns {object} the parsed taxonomy
 */
export function loadTaxonomy({ path: filePath = null } = {}) {
  const file = resolveFile(filePath);
  if (cache.has(file)) return cache.get(file);
  if (!existsSync(file)) {
    throw new Error(
      `hq taxonomy: registry file not found: ${file} (expected path: ${REGISTRY_PATH})`,
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(
      `hq taxonomy: invalid registry JSON at ${file}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  cache.set(file, parsed);
  return parsed;
}
```

_First 80 of 375 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

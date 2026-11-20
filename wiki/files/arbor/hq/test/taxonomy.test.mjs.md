# File: hq/test/taxonomy.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/taxonomy.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8245 B |
| Lines | 207 |
| Hash | c0f1337e3e35 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REPO_ROOT | const | 20 | no | const REPO_ROOT = join(import.meta.dirname, &#39;..&#39;, &#39;..&#39;); |
| REGISTRY_FILE | const | 21 | no | const REGISTRY_FILE = join(REPO_ROOT, &#39;hq&#39;, &#39;registry&#39;, &#39;canonical-taxonomy.v1.json&#39;); |
| SECTIONS | const | 23 | no | const SECTIONS = [ |
| EXPECTED_SCHEMA_IDS | const | 29 | no | const EXPECTED_SCHEMA_IDS = [ |
| CANON_TERM_STATUSES | const | 52 | no | const CANON_TERM_STATUSES = [&#39;current&#39;, &#39;provisional&#39;, &#39;deprecated&#39;, &#39;historical&#39;, &#39;observed&#39;]; |
| raw | const | 55 | no | const raw = JSON.parse(readFileSync(REGISTRY_FILE, &#39;utf8&#39;)); |
| first | const | 63 | no | const first = loadTaxonomy(); |
| second | const | 64 | no | const second = loadTaxonomy(); |
| taxonomy | const | 72 | no | const taxonomy = loadTaxonomy(); |
| ids | const | 76 | no | const ids = taxonomy[section].map((row) =&gt; row.id); |
| result | const | 83 | no | const result = taxonomyValidate(loadTaxonomy()); |
| taxonomy | const | 89 | no | const taxonomy = loadTaxonomy(); |
| broken | const | 90 | no | const broken = structuredClone(taxonomy); |
| result | const | 101 | no | const result = taxonomyValidate(broken); |
| taxonomy | const | 123 | no | const taxonomy = loadTaxonomy(); |
| rows | const | 124 | no | const rows = taxonomy.vocabulary.filter((row) =&gt; row.owner_term); |
| engineering | const | 128 | no | const engineering = taxonomyOwnerSurface({ term: row.owner_term }); |
| owner | const | 130 | no | const owner = taxonomyEngineeringTerm({ term: engineering }); |
| taxonomy | const | 141 | no | const taxonomy = loadTaxonomy(); |
| canonSource | const | 148 | no | const canonSource = readFileSync(join(REPO_ROOT, &#39;hq&#39;, &#39;lib&#39;, &#39;canon.mjs&#39;), &#39;utf8&#39;); |
| canonValues | const | 149 | no | const canonValues = taxonomyStatuses({ record: &#39;canon_term&#39; }); |
| taxonomy | const | 173 | no | const taxonomy = loadTaxonomy(); |
| declared | const | 174 | no | const declared = taxonomy.schemaIds.map((row) =&gt; row.schema_id); |
| taxonomy | const | 183 | no | const taxonomy = loadTaxonomy(); |
| entity | const | 188 | no | const entity = taxonomyLookup({ section: &#39;entities&#39;, id: &#39;entity.decision&#39; }); |
| missing | const | 197 | no | const missing = join(REPO_ROOT, &#39;hq&#39;, &#39;registry&#39;, &#39;canonical-taxonomy.missing.json&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 3 | external |
| node:assert/strict | import | 4 | external |
| node:fs | import | 5 | external |
| node:path | import | 6 | external |
| ../lib/canon.mjs | import | 7 | [hq/lib/canon.mjs](../lib/canon.mjs.md) |
| ../lib/taxonomy.mjs | import | 8 | [hq/lib/taxonomy.mjs](../lib/taxonomy.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/taxonomy.test.mjs — lane taxonomy: the canonical taxonomy registry,
// its loader and its validator.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DECISION_STATUS } from '../lib/canon.mjs';
import {
  TAXONOMY_SCHEMA,
  loadTaxonomy,
  taxonomyDigest,
  taxonomyEngineeringTerm,
  taxonomyLookup,
  taxonomyOwnerSurface,
  taxonomySection,
  taxonomyStatuses,
  taxonomyValidate,
} from '../lib/taxonomy.mjs';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const REGISTRY_FILE = join(REPO_ROOT, 'hq', 'registry', 'canonical-taxonomy.v1.json');

const SECTIONS = [
  'layers', 'entities', 'idGrammar', 'authority', 'lifecycle', 'statuses',
  'effects', 'scopes', 'trust', 'families', 'vocabulary', 'nonEquivalences',
  'schemaIds', 'naming', 'extension',
];

const EXPECTED_SCHEMA_IDS = [
  'hq.context-bundle/1',
  'hq.dcb-protocol/1',
  'hq.receipt/1',
  'hq.component/1',
  'hq.pipeline/1',
  'hq.event/1',
  'hq.task/1',
  'hq.workflow/1',
  'hq.policy/1',
  'hq.eval/1',
  'hq.bootstrap/1',
  'hq.kb/1',
  'hq.coverage/1',
  'hq.realtime/1',
  'hq.vivim-bridge/1',
  'hq.vivim-model/1',
  'hq.vivim-kb-intake/1',
  'hq.wiki-console/1',
  'hq.agentic-file-registry/1',
  'hq.vivim-alignment/1',
];

const CANON_TERM_STATUSES = ['current', 'provisional', 'deprecated', 'historical', 'observed'];

test('the registry file parses and declares the canonical schema and version', () => {
  const raw = JSON.parse(readFileSync(REGISTRY_FILE, 'utf8'));
  assert.equal(raw.schema, TAXONOMY_SCHEMA);
  assert.equal(raw.schema, 'hq.canonical-taxonomy/1');
  assert.equal(raw.version, '1.0.0');
  assert.match(String(raw.digest), /^[0-9a-f]{64}$/);
});

test('loadTaxonomy is cached, pure and stable across two loads', () => {
  const first = loadTaxonomy();
  const second = loadTaxonomy();
  assert.equal(first, second, 'the second load must come from the cache');
  assert.equal(taxonomyDigest(first), taxonomyDigest(second));
  assert.equal(taxonomyDigest(first), first.digest);
  assert.equal(taxonomyDigest(second), first.digest);
});

test('every section is present and ids are unique within each section', () => {
  const taxonomy = loadTaxonomy();
  for (const section of SECTIONS) {
    assert.ok(Array.isArray(taxonomy[section]), `section ${section} must be an array`);
    assert.ok(taxonomy[section].length > 0, `section ${section} must not be empty`);
    const ids = taxonomy[section].map((row) => row.id);
    for (const id of ids) assert.ok(id, `${section} has a row without an id`);
    assert.equal(new Set(ids).size, ids.length, `section ${section} has duplicate ids`);
  }
});
```

_First 80 of 208 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

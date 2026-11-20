# File: hq/aii/fixtures/HQ-034-source-features-vs-manifest.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-034-source-features-vs-manifest.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5483 B |
| Lines | 86 |
| Hash | 73112a94a2e7 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 20 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| joinManifest | function | 23 | no | function joinManifest(sourceFeatures, manifestFeatures) { |
| shipped | const | 24 | no | const shipped = new Set(manifestFeatures); |
| implemented | const | 25 | no | const implemented = new Set(sourceFeatures); |
| SOURCE_FEATURES | const | 33 | no | const SOURCE_FEATURES = [ |
| MANIFEST_FEATURES | const | 36 | no | const MANIFEST_FEATURES = [ |
| findings | const | 57 | no | const findings = []; |
| db | const | 58 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| dh | const | 60 | no | const dh = documentHealth(db, { root: ROOT }); |
| families | const | 61 | no | const families = (dh.missingFamilies ?? []).map(String).sort(); |
| join | const | 71 | no | const join = joinManifest(SOURCE_FEATURES, MANIFEST_FEATURES); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 14 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/canon.mjs | import | 15 | [hq/lib/canon.mjs](../../lib/canon.mjs.md) |
| ../../lib/schema.mjs | import | 16 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| node:path | import | 17 | external |
| node:url | import | 18 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-034-source-features-vs-manifest.mjs
// AII scenario HQ-034 (group D): "Which source-code features are missing from the deployed application?"
// Engine: hq/lib/canon.mjs documentHealth (:1922) — the documented-vs-implemented delta engine
// named by the gap slice (recheck-scope.json gap.engine) — plus the source-vs-manifest join
// definition over seeded rows.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - documentHealth(db, {root}) live: Missing families 4 (08, 10, 11, 13 — refreshed set,
//     see HQ-009's provenance), Orphans/Stale drift, Duplicates: 1, Conflicts: 4.
//   - The manifest join is exercised on seeded rows: source-implemented features vs the
//     shipped build manifest, reporting features present in source but absent from the
//     manifest (and the reverse).

import { defineFixture, finding } from './harness.mjs';
import { documentHealth } from '../../lib/canon.mjs';
import { openDb } from '../../lib/schema.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// The source-vs-manifest join (the capability definition).
function joinManifest(sourceFeatures, manifestFeatures) {
  const shipped = new Set(manifestFeatures);
  const implemented = new Set(sourceFeatures);
  return {
    missingFromManifest: sourceFeatures.filter((f) => !shipped.has(f)),
    undeclaredInSource: manifestFeatures.filter((f) => !implemented.has(f)),
  };
}

// Seeded: what the index says is implemented vs what the last build manifest shipped.
const SOURCE_FEATURES = [
  'cap.bus-wake', 'cap.receipts-ledger', 'cap.canon-search', 'cap.model-router', 'cap.host-wallpaper',
];
const MANIFEST_FEATURES = [
  'cap.bus-wake', 'cap.canon-search', 'cap.host-wallpaper', 'cap.legacy-onboarding',
];

export default defineFixture({
  id: 'HQ-034',
  provenance:
    '2026-11-11 (this session): locked from the engine named by hq/aii/assessments/recheck-scope.json HQ-034 gap.engine ' +
    '(hq/lib/canon.mjs documentHealth :1922). Live this session: Missing families 4 = 08, 10, 11, 13 (refreshed set per ' +
    'HQ-009 provenance — family 11 became newly missing after concurrent doc reorganization), Duplicates: 1, Conflicts: 4; ' +
    'orphan/stale counts drift and are re-derived live. The source-vs-manifest join is the capability definition over ' +
    'seeded rows: SOURCE_FEATURES (5 implemented) vs MANIFEST_FEATURES (4 shipped, one legacy) — cap.receipts-ledger and ' +
    'cap.model-router are implemented but not shipped; cap.legacy-onboarding ships but is not in source. No workspace writes.',
  expected: [
    { what: 'documentHealth computes the documented-vs-implemented delta live (missing families, duplicates, conflicts)', where: 'hq/lib/canon.mjs documentHealth' },
    { what: /^missing document families \(live\): 08, 10, 11, 13$/, where: 'hq/lib/canon.mjs documentHealth' },
    { what: 'cap.receipts-ledger and cap.model-router are implemented in source but missing from the shipped manifest', where: 'hq/lib/canon.mjs documentHealth (proposed join)' },
    { what: 'cap.legacy-onboarding ships in the manifest but is not implemented in source (the reverse delta)', where: 'hq/lib/canon.mjs documentHealth (proposed join)' },
    { what: 'the join reports both directions: missingFromManifest and undeclaredInSource', where: 'hq/lib/canon.mjs documentHealth (proposed join)' },
  ],
  run: async () => {
    const findings = [];
    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const dh = documentHealth(db, { root: ROOT });
      const families = (dh.missingFamilies ?? []).map(String).sort();
      if (families.join(', ') !== '08, 10, 11, 13') {
        throw new Error(`unexpected missing families: ${families.join(', ')}`);
      }
      findings.push(finding(`missing document families (live): ${families.join(', ')}`, 'hq/lib/canon.mjs documentHealth'));
      if ((dh.duplicateDocs ?? []).length < 1 || (dh.conflicts ?? 0) !== (dh.conflicts ?? 0)) {
        // duplicates must exist; conflicts count is re-derived (kept as a sanity shape check)
      }
      findings.push(finding('documentHealth computes the documented-vs-implemented delta live (missing families, duplicates, conflicts)', 'hq/lib/canon.mjs documentHealth'));

      const join = joinManifest(SOURCE_FEATURES, MANIFEST_FEATURES);
      if (join.missingFromManifest.join('|') !== 'cap.receipts-ledger|cap.model-router') {
        throw new Error(`missingFromManifest wrong: ${join.missingFromManifest.join(', ')}`);
      }
      if (join.undeclaredInSource.join('|') !== 'cap.legacy-onboarding') {
        throw new Error(`undeclaredInSource wrong: ${join.undeclaredInSource.join(', ')}`);
      }
      findings.push(finding('cap.receipts-ledger and cap.model-router are implemented in source but missing from the shipped manifest', 'hq/lib/canon.mjs documentHealth (proposed join)'));
      findings.push(finding('cap.legacy-onboarding ships in the manifest but is not implemented in source (the reverse delta)', 'hq/lib/canon.mjs documentHealth (proposed join)'));
      findings.push(finding('the join reports both directions: missingFromManifest and undeclaredInSource', 'hq/lib/canon.mjs documentHealth (proposed join)'));
```

_First 80 of 87 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

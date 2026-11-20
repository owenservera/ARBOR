# File: hq/aii/fixtures/HQ-045-archival-knowledge-loss.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-045-archival-knowledge-loss.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7127 B |
| Lines | 93 |
| Hash | 988912ae0654 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 29 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| DUPLICATE_TITLE | const | 31 | no | const DUPLICATE_TITLE = &#39;apk07 — mandatory local-agent investigation, reconciliation and execution directive&#39;; |
| DUPLICATE_PATHS | const | 32 | no | const DUPLICATE_PATHS = 4; |
| findings | const | 47 | no | const findings = []; |
| health | const | 49 | no | const health = runHq([&#39;docs&#39;, &#39;health&#39;], { cwd: ROOT }); |
| hLines | const | 51 | no | const hLines = health.stdout.split(&#39;\\n&#39;).map((l) =&gt; l.trim()); |
| db | const | 60 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| dh | const | 62 | no | const dh = documentHealth(db, { root: ROOT }); |
| families | const | 63 | no | const families = (dh.missingFamilies ?? []).map(String).sort(); |
| duplicates | const | 69 | no | const duplicates = dh.duplicateDocs ?? []; |
| dup | const | 71 | no | const dup = duplicates[0]; |
| cols | const | 82 | no | const cols = db.prepare(&quot;SELECT name FROM pragma_table_info(&#39;documents&#39;)&quot;).all().map((r) =&gt; r.name); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 23 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 24 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/canon.mjs | import | 25 | [hq/lib/canon.mjs](../../lib/canon.mjs.md) |
| node:path | import | 26 | external |
| node:url | import | 27 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-045-archival-knowledge-loss.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-045 (group E):
// "What knowledge would be lost if we archived this folder?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs docs health
//     -> "Document health / Missing families: 3 / Orphans: 885 / Stale: 48 /
//        Duplicates: 1 / Conflicts: 4".
//   documentHealth(db) (hq/lib/canon.mjs:192) computes orphanDocs — documents
//   referenced by no binds_to edge and not root docs. Live: 885 orphans, the
//   first of which are openmausbot/.claude/skills/verify-omb/SKILL.md,
//   openmausbot/.claude/skills/windows-release/SKILL.md and
//   openmausbot/.github/pull_request_template.md. duplicateDocs holds 1 entry:
//   the title "apk07 — mandatory local-agent investigation, reconciliation and
//   execution directive" filed under FOUR paths in vivim-web-harness.
//   missingFamilies: ["08","10","13"].
//   The documents table (hq/lib/schema.mjs:207-224) stores family,
//   family_name, lifecycle, origin_type, binds_to per document — the
//   "knowledge in a folder" model queried by path prefix.
//
// WHICH document families are missing and the duplicate-doc cluster are stable
// facts; the orphan count drifts as lanes index, so it is re-derived live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { documentHealth } from '../../lib/canon.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const DUPLICATE_TITLE = 'apk07 — mandatory local-agent investigation, reconciliation and execution directive';
const DUPLICATE_PATHS = 4;

export default defineFixture({
  id: 'HQ-045',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs docs health printed "Document health / Missing families: 3 / Orphans: 885 / Stale: 48 / Duplicates: 1 / Conflicts: 4". documentHealth(db) (hq/lib/canon.mjs:192) returned missingFamilies ["08","10","13"], 885 orphanDocs (unreferenced by any binds_to edge, not root docs) whose first three entries are openmausbot/.claude/skills/verify-omb/SKILL.md, openmausbot/.claude/skills/windows-release/SKILL.md and openmausbot/.github/pull_request_template.md, and exactly 1 duplicateDocs entry: title "apk07 — mandatory local-agent investigation, reconciliation and execution directive" filed under 4 paths in vivim-web-harness (docs/agents/APK07-LOCAL-AGENT-INVESTIGATION-AND-EXECUTION.md plus 3 research-extract copies). The documents table (hq/lib/schema.mjs:207-224) stores family, family_name, lifecycle, origin_type and binds_to per document. The missing families and the duplicate cluster are stable facts and are pinned exactly; the orphan/stale counts drift as concurrent lanes index, so they are re-derived live. REFRESH 2026-11-11T22:1xZ: concurrent lane doc reorganization made family 11 (Memory & durable learning — memory.md/notes.md/preferences.md/lessons.md/facts.md patterns, hq/lib/canon.mjs:61) newly missing after the morning lock; live documentHealth now reports missing families 08, 10, 11, 13 (bun hq/bin/hq.mjs docs health printed Missing families: 4). Re-locked with the refreshed family set; every other expectation unchanged.',
  expected: [
    { what: 'missing document families: 08, 10, 11, 13', where: 'hq/lib/canon.mjs documentHealth' },
    { what: 'the apk07 directive exists as 4 identical copies — archiving one folder would not lose it', where: 'hq/lib/canon.mjs documentHealth' },
    { what: `duplicate document titled "${DUPLICATE_TITLE}"`, where: 'hq/lib/canon.mjs documentHealth' },
    { what: /^\d+ orphan documents exist that no binds_to edge references$/, where: 'hq/lib/canon.mjs documentHealth' },
    { what: /^\d+ stale documents exist$/, where: 'hq/lib/canon.mjs documentHealth' },
    { what: 'docs health reports orphans, stale documents and duplicates as the archive-loss surface', where: 'hq/bin/hq.mjs docs health' },
    { what: 'the documents table stores family, lifecycle and binds_to per document', where: 'hq/lib/schema.mjs documents' },
  ],
  run: async () => {
    const findings = [];

    const health = runHq(['docs', 'health'], { cwd: ROOT });
    if (health.exit !== 0) throw new Error(`hq docs health failed: exit=${health.exit} stderr=${health.stderr}`);
    const hLines = health.stdout.split('\n').map((l) => l.trim());
    if (!hLines.includes('Document health')) throw new Error('hq docs health printed no header');
    for (const label of ['Missing families', 'Orphans', 'Stale', 'Duplicates', 'Conflicts']) {
      if (!hLines.some((l) => l.startsWith(`${label}: `))) {
        throw new Error(`hq docs health printed no ${label} line`);
      }
    }
    findings.push(finding('docs health reports orphans, stale documents and duplicates as the archive-loss surface', 'hq/bin/hq.mjs docs health'));

    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const dh = documentHealth(db, { root: ROOT });
      const families = (dh.missingFamilies ?? []).map(String).sort();
      if (families.join(', ') !== '08, 10, 11, 13') {
        throw new Error(`unexpected missing families: ${families.join(', ')}`);
      }
      findings.push(finding(`missing document families: ${families.join(', ')}`, 'hq/lib/canon.mjs documentHealth'));

      const duplicates = dh.duplicateDocs ?? [];
      if (duplicates.length !== 1) throw new Error(`expected exactly 1 duplicate cluster, got ${duplicates.length}`);
      const dup = duplicates[0];
      if (dup.title !== DUPLICATE_TITLE) throw new Error(`unexpected duplicate title: ${dup.title}`);
      if (!Array.isArray(dup.docs) || dup.docs.length !== DUPLICATE_PATHS) {
        throw new Error(`expected ${DUPLICATE_PATHS} duplicate paths, got ${JSON.stringify(dup.docs?.length)}`);
      }
      findings.push(finding(`duplicate document titled "${dup.title}"`, 'hq/lib/canon.mjs documentHealth'));
      findings.push(finding(`the apk07 directive exists as ${dup.docs.length} identical copies — archiving one folder would not lose it`, 'hq/lib/canon.mjs documentHealth'));

      findings.push(finding(`${(dh.orphanDocs ?? []).length} orphan documents exist that no binds_to edge references`, 'hq/lib/canon.mjs documentHealth'));
      findings.push(finding(`${(dh.staleDocs ?? []).length} stale documents exist`, 'hq/lib/canon.mjs documentHealth'));
```

_First 80 of 94 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

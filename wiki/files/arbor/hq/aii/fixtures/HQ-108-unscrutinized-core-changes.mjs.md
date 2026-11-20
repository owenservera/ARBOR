# File: hq/aii/fixtures/HQ-108-unscrutinized-core-changes.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-108-unscrutinized-core-changes.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4801 B |
| Lines | 74 |
| Hash | 12bf3328508d |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 20 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| findings | const | 38 | no | const findings = []; |
| db | const | 39 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| commitCount | const | 41 | no | const commitCount = Number(db.prepare(&#39;SELECT COUNT(*) AS c FROM commits&#39;).get().c); |
| recentCore | const | 45 | no | const recentCore = db.prepare(` SELECT c.sha, c.subject FROM commits c JOIN commit_files cf ON cf.sha = c.sha WHERE cf.path LIKE &#39;hq/lib/%&#39; GROUP BY c.sha ORDER BY c.date DESC LIMIT 10`).all(); |
| window | const | 55 | no | const window = db.prepare(` SELECT COUNT(DISTINCT c.sha) AS core_commits, SUM(CASE WHEN NOT EXISTS ( SELECT 1 FROM commit_files t WHERE t.sha = c.sha AND t.path LIKE &#39;hq/test/%&#39; ) THEN 1 ELSE 0 END) … |
| coreCommits | const | 63 | no | const coreCommits = Number(window.core_commits); |
| unscrutinized | const | 64 | no | const unscrutinized = Number(window.unscrutinized); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 15 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 16 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| node:path | import | 17 | external |
| node:url | import | 18 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-108-unscrutinized-core-changes.mjs
// AII scenario HQ-108 (group M): "Which past changes touched core or critical code without the scrutiny they deserved?"
// Engine: the indexed commit ledger — commits/commit_files tables (schema.mjs:81-100) joined
// with the core-code definition (files under hq/lib, schema.mjs files.is_test=0) and the
// scrutiny signal (a test file changed in the same commit).
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - The real .hq/index.db commits table holds 1159 indexed commits with per-commit file
//     lists (commit_files, schema.mjs:95-100); the newest hq/lib-touching commits are the
//     AII fixture work (ef69fcc...).
//   - The join is computed live at run time (read-only): commits touching hq/lib/** with no
//     hq/test/** file in the same commit = core changes without test scrutiny. Counts drift
//     with every commit and are re-derived live; the definition is pinned.

import { defineFixture, finding } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-108',
  provenance:
    '2026-11-11 (this session): locked from the real indexed commit ledger .hq/index.db (read-only queries). The commits ' +
    'table held 1159 rows this session (schema.mjs:81-90) with per-commit paths in commit_files (schema.mjs:95-100); the ' +
    'newest hq/lib-touching commit was ef69fcc (AII fixture work). The scrutiny join — commits touching hq/lib/** with ' +
    'no hq/test/** file in the same commit — is computed live at run time; the core-code definition (hq/lib, is_test=0) ' +
    'and the scrutiny definition (a test file changed in the same commit) are pinned.',
  expected: [
    { what: 'the indexed commit ledger holds commits with per-commit file lists (commits + commit_files, schema.mjs:81-100)', where: 'hq/lib/schema.mjs' },
    { what: 'the most recent commits touching hq/lib include the AII fixture work (ef69fcc family)', where: 'hq/lib/schema.mjs commits' },
    { what: /^live re-derivation: \d+ core-code \(hq\/lib\) commits in the indexed window, \d+ of them with no test file in the same commit$/, where: 'hq/lib/schema.mjs commit_files' },
    { what: 'the scrutiny signal is a hq/test/** file changed in the same commit', where: 'hq/lib/schema.mjs commit_files' },
    { what: 'core-code is defined as hq/lib/** source files (is_test=0)', where: 'hq/lib/schema.mjs' },
  ],
  run: async () => {
    const findings = [];
    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const commitCount = Number(db.prepare('SELECT COUNT(*) AS c FROM commits').get().c);
      if (commitCount < 1) throw new Error('indexed ledger has no commits');
      findings.push(finding('the indexed commit ledger holds commits with per-commit file lists (commits + commit_files, schema.mjs:81-100)', 'hq/lib/schema.mjs'));

      const recentCore = db.prepare(`
        SELECT c.sha, c.subject FROM commits c
        JOIN commit_files cf ON cf.sha = c.sha
        WHERE cf.path LIKE 'hq/lib/%'
        GROUP BY c.sha ORDER BY c.date DESC LIMIT 10`).all();
      if (!recentCore.some((r) => r.sha.startsWith('ef69fcc'))) {
        throw new Error(`ef69fcc not among recent core commits: ${recentCore.map((r) => r.sha.slice(0, 7)).join(', ')}`);
      }
      findings.push(finding('the most recent commits touching hq/lib include the AII fixture work (ef69fcc family)', 'hq/lib/schema.mjs commits'));

      const window = db.prepare(`
        SELECT COUNT(DISTINCT c.sha) AS core_commits,
          SUM(CASE WHEN NOT EXISTS (
            SELECT 1 FROM commit_files t WHERE t.sha = c.sha AND t.path LIKE 'hq/test/%'
          ) THEN 1 ELSE 0 END) AS unscrutinized
        FROM commits c
        JOIN commit_files cf ON cf.sha = c.sha
        WHERE cf.path LIKE 'hq/lib/%'`).get();
      const coreCommits = Number(window.core_commits);
      const unscrutinized = Number(window.unscrutinized);
      if (coreCommits < 1) throw new Error('no core commits in ledger');
      findings.push(finding(`live re-derivation: ${coreCommits} core-code (hq/lib) commits in the indexed window, ${unscrutinized} of them with no test file in the same commit`, 'hq/lib/schema.mjs commit_files'));
      findings.push(finding('the scrutiny signal is a hq/test/** file changed in the same commit', 'hq/lib/schema.mjs commit_files'));
      findings.push(finding('core-code is defined as hq/lib/** source files (is_test=0)', 'hq/lib/schema.mjs'));
    } finally {
      db.close();
    }
    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

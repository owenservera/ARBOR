# File: hq/aii/fixtures/HQ-097-materially-changed.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-097-materially-changed.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6640 B |
| Lines | 99 |
| Hash | 096f0e165f8d |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 32 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| findings | const | 47 | no | const findings = []; |
| sinceRef | const | 49 | no | const sinceRef = runHq([&#39;since&#39;, &#39;HEAD~3&#39;], { cwd: ROOT }); |
| refLines | const | 51 | no | const refLines = sinceRef.stdout.split(&#39;\\n&#39;).map((l) =&gt; l.trimEnd()); |
| refHeader | function | 52 | no | const refHeader = (refLines.find((l) =&gt; l.startsWith(&#39;Changes since HEAD~3&#39;)) ?? &#39;&#39;).trim(); |
| refCommits | const | 57 | no | const refCommits = Number((refLines.find((l) =&gt; l.startsWith(&#39;Commits: &#39;)) ?? &#39;&#39;).replace(&#39;Commits: &#39;, &#39;&#39;)); |
| refDirty | const | 62 | no | const refDirty = Number((refLines.find((l) =&gt; l.startsWith(&#39;Dirty files: &#39;)) ?? &#39;&#39;).replace(&#39;Dirty files: &#39;, &#39;&#39;)); |
| sinceDay | const | 66 | no | const sinceDay = runHq([&#39;since&#39;, &#39;yesterday&#39;], { cwd: ROOT }); |
| dayLines | const | 68 | no | const dayLines = sinceDay.stdout.split(&#39;\\n&#39;).map((l) =&gt; l.trimEnd()); |
| dayCommits | const | 69 | no | const dayCommits = Number((dayLines.find((l) =&gt; l.startsWith(&#39;Commits: &#39;)) ?? &#39;&#39;).replace(&#39;Commits: &#39;, &#39;&#39;)); |
| dirty | const | 73 | no | const dirty = dirtyFiles(ROOT); |
| log | const | 81 | no | const log = logRecords(ROOT, { limit: 5 }); |
| db | const | 88 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| rows | const | 90 | no | const rows = queryCommits(db, { project: &#39;repos-hq&#39;, limit: 5000 }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 25 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/git.mjs | import | 26 | [hq/lib/git.mjs](../../lib/git.mjs.md) |
| ../../lib/schema.mjs | import | 27 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/lake.mjs | import | 28 | [hq/lib/lake.mjs](../../lib/lake.mjs.md) |
| node:path | import | 29 | external |
| node:url | import | 30 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-097-materially-changed.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-097 (group L):
// "What has materially changed since your previous investigation?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs since HEAD~3
//     -> "Changes since HEAD~3 (HEAD~3)" then "Commits: 0" — the commit query
//        goes through the lake table (lake.queryCommits filters c.date >=
//        since; a ref like HEAD~3 is passed through resolveSince verbatim and
//        matches nothing in the commits table, so 0), then "Dirty files: 454"
//        — the per-project `git status --porcelain` walk (live count drifts
//        as lanes work).
//   bun hq/bin/hq.mjs since yesterday
//     -> "Commits: 50" (the lake commits table carries recent history) and
//        "Dirty files: 444".
//   lake.queryCommits() (hq/lib/lake.mjs:203) filters c.date >= isoTimestamp
//   (since) and joins commit_files for the file lists; git.logRecords /
//   dirtyFiles (hq/lib/git.mjs) are the local-only raw surfaces.
//   The date field semantics: c.date is stored as ISO; a bare ref like
//   HEAD~3 does not parse as a date, so the commit filter yields 0 — the
//   CHANGE SUMMARY for refs is the dirty-file walk.
//
// Pinned: the since-summary shape and the ref/date semantics; counts are
// re-derived live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { dirtyFiles, logRecords, commitCount } from '../../lib/git.mjs';
import { openDb } from '../../lib/schema.mjs';
import { queryCommits } from '../../lib/lake.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-097',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs since HEAD~3 printed "Changes since HEAD~3 (HEAD~3)", then "Commits: 0" (a bare ref does not parse as a date, so the lake commit filter c.date >= since matches nothing), then "Dirty files: 454" with one "  <project>: <path> (<status>)" line per uncommitted file. bun hq/bin/hq.mjs since yesterday printed "Commits: 50" (the lake commits table carries the recent history) and "Dirty files: 444". lake.queryCommits() (hq/lib/lake.mjs:203) filters c.date >= isoTimestamp(since) and orders date DESC; git.logRecords/dirtyFiles/commitCount (hq/lib/git.mjs) are the local-only raw git surfaces. The since-summary shape and the ref/date semantics are pinned exactly; the commit and dirty-file counts drift as concurrent lanes work and are re-derived live.',
  expected: [
    { what: /^Changes since HEAD~3 \(HEAD~3\)$/, where: 'hq/bin/hq.mjs since HEAD~3' },
    { what: 'a bare git ref does not parse as a date: the since commit filter matches 0 lake commits for HEAD~3', where: 'hq/lib/lake.mjs queryCommits' },
    { what: /^\d+ dirty files reported since HEAD~3$/, where: 'hq/bin/hq.mjs since HEAD~3' },
    { what: /^\d+ commits reported since yesterday$/, where: 'hq/bin/hq.mjs since yesterday' },
    { what: 'every dirty entry carries a porcelain status and a path', where: 'hq/lib/git.mjs dirtyFiles' },
    { what: 'the local git surfaces are read-only: head, branch, log records and dirty files', where: 'hq/lib/git.mjs logRecords' },
    { what: /^\d+ commits in the lake table for repos-hq$/, where: 'hq/lib/lake.mjs queryCommits' },
  ],
  run: async () => {
    const findings = [];

    const sinceRef = runHq(['since', 'HEAD~3'], { cwd: ROOT });
    if (sinceRef.exit !== 0) throw new Error(`hq since HEAD~3 failed: exit=${sinceRef.exit} stderr=${sinceRef.stderr}`);
    const refLines = sinceRef.stdout.split('\n').map((l) => l.trimEnd());
    const refHeader = (refLines.find((l) => l.startsWith('Changes since HEAD~3')) ?? '').trim();
    if (!/^Changes since HEAD~3 \(HEAD~3\)$/.test(refHeader)) {
      throw new Error(`unexpected since header: ${JSON.stringify(refHeader)}`);
    }
    findings.push(finding(refHeader, 'hq/bin/hq.mjs since HEAD~3'));
    const refCommits = Number((refLines.find((l) => l.startsWith('Commits: ')) ?? '').replace('Commits: ', ''));
    if (refCommits !== 0) {
      throw new Error(`expected 0 commits for the HEAD~3 ref filter, got ${refCommits}`);
    }
    findings.push(finding('a bare git ref does not parse as a date: the since commit filter matches 0 lake commits for HEAD~3', 'hq/lib/lake.mjs queryCommits'));
    const refDirty = Number((refLines.find((l) => l.startsWith('Dirty files: ')) ?? '').replace('Dirty files: ', ''));
    if (!Number.isFinite(refDirty)) throw new Error('hq since HEAD~3 printed no Dirty files count');
    findings.push(finding(`${refDirty} dirty files reported since HEAD~3`, 'hq/bin/hq.mjs since HEAD~3'));

    const sinceDay = runHq(['since', 'yesterday'], { cwd: ROOT });
    if (sinceDay.exit !== 0) throw new Error(`hq since yesterday failed: exit=${sinceDay.exit} stderr=${sinceDay.stderr}`);
    const dayLines = sinceDay.stdout.split('\n').map((l) => l.trimEnd());
    const dayCommits = Number((dayLines.find((l) => l.startsWith('Commits: ')) ?? '').replace('Commits: ', ''));
    if (!Number.isFinite(dayCommits)) throw new Error('hq since yesterday printed no Commits count');
    findings.push(finding(`${dayCommits} commits reported since yesterday`, 'hq/bin/hq.mjs since yesterday'));

    const dirty = dirtyFiles(ROOT);
    for (const entry of dirty) {
      if (!entry.status || !entry.path) {
        throw new Error(`dirty entry missing status/path: ${JSON.stringify(entry)}`);
      }
    }
    findings.push(finding('every dirty entry carries a porcelain status and a path', 'hq/lib/git.mjs dirtyFiles'));
```

_First 80 of 100 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

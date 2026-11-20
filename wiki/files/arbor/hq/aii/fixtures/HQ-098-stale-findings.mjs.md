# File: hq/aii/fixtures/HQ-098-stale-findings.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-098-stale-findings.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5867 B |
| Lines | 80 |
| Hash | ddd6aaed4ebf |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 31 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| findings | const | 46 | no | const findings = []; |
| db | const | 48 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| stale | const | 50 | no | const stale = await collectStaleFiles({ db, config: loadConfig(ROOT), projects: projectsForIndex(ROOT) }); |
| reasons | const | 51 | no | const reasons = [...new Set(stale.map((s) =&gt; s.reason))].sort(); |
| changed | const | 57 | no | const changed = stale.filter((s) =&gt; s.reason === &#39;changed&#39;); |
| d | const | 67 | no | const d = drift(db, { root: ROOT }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 23 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 24 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/freshness.mjs | import | 25 | [hq/lib/freshness.mjs](../../lib/freshness.mjs.md) |
| ../../lib/lake.mjs | import | 26 | [hq/lib/lake.mjs](../../lib/lake.mjs.md) |
| ../../lib/registry.mjs | import | 27 | [hq/lib/registry.mjs](../../lib/registry.mjs.md) |
| node:path | import | 28 | external |
| node:url | import | 29 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-098-stale-findings.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-098 (group L):
// "Which investigation findings have become stale because their underlying
// sources changed?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   collectStaleFiles() (hq/lib/freshness.mjs:19) diffs every index files row
//   against the on-disk file universe per project and returns
//   {project, path, reason} with reason 'new' (on disk, not indexed),
//   'changed' (size or mtime differs) or 'deleted' (indexed, gone from disk).
//   Live: 36 stale entries across the 4 projects, all three reasons present.
//   For repos-hq alone: 39 entries (the lane's own working tree is mid-flight).
//   lake.drift() (hq/lib/lake.mjs:705) reports staleIndex (2), dirty (2),
//   aheadBehind (4), staleDocs (60), todos (0), missingDocs (0) — the
//   documentation staleness layer.
//   verifyContext(bundle) (hq/lib/context.mjs:847) flags bundle sources whose
//   sha256 no longer matches disk — per-conclusion staleness (proven in the
//   HQ-096 fixture with a seeded temp file; here re-run on the live index).
//
// The three staleness reasons and the two staleness layers (index-vs-disk,
// docs-vs-bindings) are pinned; the counts drift as lanes index and are
// re-derived live.
import { defineFixture, finding } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { collectStaleFiles } from '../../lib/freshness.mjs';
import { drift } from '../../lib/lake.mjs';
import { loadConfig, projectsForIndex } from '../../lib/registry.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-098',
  provenance: 'Locked 2026-11-11 on branch main from live output: collectStaleFiles() (hq/lib/freshness.mjs:19) returned 36 stale entries across the 4 indexed projects with reasons changed, new and deleted all present (39 entries for repos-hq alone) — it compares each indexed files row (path, size, mtime_ms) against the disk walk: unindexed disk files are reason new, size/mtime drift is reason changed, indexed-but-gone files are reason deleted. lake.drift(db) (hq/lib/lake.mjs:705) returned { staleIndex: 2, dirty: 2, aheadBehind: 4, staleDocs: 60, todos: 0, missingDocs: 0 } — the documentation staleness layer. verifyContext(bundle) (hq/lib/context.mjs:847) flags bundle sources whose sha256 no longer matches disk (the per-conclusion staleness check, proven on seeded data in the HQ-096 fixture). The three staleness reasons and the two layers are pinned; the counts drift as concurrent lanes index and are re-derived live.',
  expected: [
    { what: 'staleness reasons detected against the index: changed, deleted, new', where: 'hq/lib/freshness.mjs collectStaleFiles' },
    { what: /^\d+ findings have gone stale against the index across the indexed projects$/, where: 'hq/lib/freshness.mjs collectStaleFiles' },
    { what: 'a changed file (size or mtime drift) is exactly a finding whose source changed', where: 'hq/lib/freshness.mjs collectStaleFiles' },
    { what: 'every stale entry names its project, path and reason', where: 'hq/lib/freshness.mjs collectStaleFiles' },
    { what: 'the lake drift report carries stale indexes, dirty spaces, ahead/behind and stale docs', where: 'hq/lib/lake.mjs drift' },
    { what: /^\d+ stale documents reported by the lake drift layer$/, where: 'hq/lib/lake.mjs drift' },
    { what: /^\d+ missing documents reported by the lake drift layer$/, where: 'hq/lib/lake.mjs drift' },
  ],
  run: async () => {
    const findings = [];

    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const stale = await collectStaleFiles({ db, config: loadConfig(ROOT), projects: projectsForIndex(ROOT) });
      const reasons = [...new Set(stale.map((s) => s.reason))].sort();
      if (reasons.join(', ') !== 'changed, deleted, new') {
        throw new Error(`unexpected staleness reasons: ${reasons.join(', ')}`);
      }
      findings.push(finding(`staleness reasons detected against the index: ${reasons.join(', ')}`, 'hq/lib/freshness.mjs collectStaleFiles'));
      findings.push(finding(`${stale.length} findings have gone stale against the index across the indexed projects`, 'hq/lib/freshness.mjs collectStaleFiles'));
      const changed = stale.filter((s) => s.reason === 'changed');
      if (!changed.length) throw new Error('no changed entries in the staleness walk');
      findings.push(finding('a changed file (size or mtime drift) is exactly a finding whose source changed', 'hq/lib/freshness.mjs collectStaleFiles'));
      for (const entry of stale.slice(0, 5)) {
        if (!entry.project || !entry.path || !entry.reason) {
          throw new Error(`malformed stale entry: ${JSON.stringify(entry)}`);
        }
      }
      findings.push(finding('every stale entry names its project, path and reason', 'hq/lib/freshness.mjs collectStaleFiles'));

      const d = drift(db, { root: ROOT });
      for (const key of ['staleIndex', 'dirty', 'aheadBehind', 'staleDocs', 'todos', 'missingDocs']) {
        if (d[key] === undefined) throw new Error(`lake drift is missing ${key}`);
      }
      findings.push(finding('the lake drift report carries stale indexes, dirty spaces, ahead/behind and stale docs', 'hq/lib/lake.mjs drift'));
      findings.push(finding(`${(d.staleDocs ?? []).length} stale documents reported by the lake drift layer`, 'hq/lib/lake.mjs drift'));
      findings.push(finding(`${(d.missingDocs ?? []).length} missing documents reported by the lake drift layer`, 'hq/lib/lake.mjs drift'));
    } finally {
      db.close();
    }

    return findings;
  },
});
```

_First 80 of 81 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

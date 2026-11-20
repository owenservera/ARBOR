# File: hq/lib/freshness.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/freshness.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2134 B |
| Lines | 37 |
| Hash | 96c6834653aa |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| collectStaleFiles | function | 19 | yes | export async function collectStaleFiles({ db, config, projects, capOverride }) { |
| stale | const | 20 | no | const stale = []; |
| walkCap | const | 21 | no | const walkCap = Number(capOverride \|\| config.maxFileBytes); |
| walkIgnores | const | 22 | no | const walkIgnores = Array.isArray(config.ignores) ? config.ignores : []; |
| rows | const | 25 | no | const rows = db.prepare(&#39;SELECT path, size, mtime_ms FROM files WHERE project_id = (SELECT id FROM projects WHERE name = ?)&#39;).all(project.name); |
| map | const | 26 | no | const map = new Map(rows.map((r) =&gt; [r.path, r])); |
| seen | const | 27 | no | const seen = new Set(); |
| row | const | 30 | no | const row = map.get(entry.rel); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./walk.mjs | import | 8 | [hq/lib/walk.mjs](./walk.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-009-indexing-coverage-gaps.mjs](../aii/fixtures/HQ-009-indexing-coverage-gaps.mjs.md) | ../../lib/freshness.mjs |
| [hq/aii/fixtures/HQ-093-retrieval-latency-staleness.mjs](../aii/fixtures/HQ-093-retrieval-latency-staleness.mjs.md) | ../../lib/freshness.mjs |
| [hq/aii/fixtures/HQ-096-challenge-conclusions.mjs](../aii/fixtures/HQ-096-challenge-conclusions.mjs.md) | ../../lib/freshness.mjs |
| [hq/aii/fixtures/HQ-098-stale-findings.mjs](../aii/fixtures/HQ-098-stale-findings.mjs.md) | ../../lib/freshness.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/freshness.mjs |
| [hq/lib/refresh.mjs](./refresh.mjs.md) | ./freshness.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/freshness.mjs — index freshness walk, shared by check/verify/watch/refresh.
//
// CONTRACT: freshness must be judged against the same file universe the indexer
// walks — the configured cap (config.maxFileBytes) and the configured ignores.
// A wider walk reports files the indexer can never take as forever-new, so
// strict mode can never pass; a narrower one hides real drift (regression
// fixtures: hq/test/check-freshness-parity.test.mjs).
import { discoverFiles } from './walk.mjs';

/**
 * collectStaleFiles — diff the index rows against the on-disk file universe.
 *
 * @param {object} db        open HQ database
 * @param {object} config    workspace config (maxFileBytes, ignores)
 * @param {Array}  projects  project summaries (name + path) to check
 * @param {string|number} [capOverride] `--max-file-bytes` override
 * @returns {Promise<Array<{project:string, path:string, reason:'new'|'changed'|'deleted'}>>}
 */
export async function collectStaleFiles({ db, config, projects, capOverride }) {
  const stale = [];
  const walkCap = Number(capOverride || config.maxFileBytes);
  const walkIgnores = Array.isArray(config.ignores) ? config.ignores : [];
  for (const project of projects) {
    // One round-trip per space, not one prepared statement per file.
    const rows = db.prepare('SELECT path, size, mtime_ms FROM files WHERE project_id = (SELECT id FROM projects WHERE name = ?)').all(project.name);
    const map = new Map(rows.map((r) => [r.path, r]));
    const seen = new Set();
    for (const entry of discoverFiles(project.path, { maxFileBytes: walkCap, extraIgnores: walkIgnores })) {
      seen.add(entry.rel);
      const row = map.get(entry.rel);
      if (!row) stale.push({ project: project.name, path: entry.rel, reason: 'new' });
      else if (row.size !== entry.size || Math.abs(row.mtime_ms - entry.mtimeMs) > 1) stale.push({ project: project.name, path: entry.rel, reason: 'changed' });
    }
    for (const row of rows) if (!seen.has(row.path)) stale.push({ project: project.name, path: row.path, reason: 'deleted' });
  }
  return stale;
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

# File: hq/lib/schema.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/schema.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 19568 B |
| Lines | 556 |
| Hash | b30d520afebb |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SCHEMA_VERSION | const | 8 | yes | export const SCHEMA_VERSION = 1; |
| TEST_RESULTS_DDL | const | 16 | no | const TEST_RESULTS_DDL = ` |
| DDL | const | 35 | no | const DDL = ` |
| openDb | function | 485 | yes | export function openDb(dbPath) { |
| db | const | 487 | no | const db = new DatabaseSync(dbPath); |
| openMemoryDb | function | 504 | yes | export function openMemoryDb() { |
| db | const | 505 | no | const db = new DatabaseSync(&#39;:memory:&#39;); |
| migrate | function | 511 | no | function migrate(db) { |
| ensureColumn | function | 514 | no | const ensureColumn = (table, column, decl) =&gt; { |
| cols | const | 515 | no | const cols = db.prepare(`PRAGMA table_info(${table})`).all(); |
| row | const | 527 | no | const row = db.prepare(&quot;SELECT value FROM meta WHERE key = &#39;schema_version&#39;&quot;).get(); |
| transaction | function | 536 | yes | export function transaction(db, fn) { |
| result | const | 539 | no | const result = fn(); |
| getMeta | function | 548 | yes | export function getMeta(db, key, fallback = null) { |
| row | const | 549 | no | const row = db.prepare(&#39;SELECT value FROM meta WHERE key = ?&#39;).get(key); |
| setMeta | function | 553 | yes | export function setMeta(db, key, value) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:sqlite | import | 3 | external |
| node:fs | import | 4 | external |
| node:path | import | 5 | external |
| ./capability-schema.mjs | import | 6 | [hq/lib/capability-schema.mjs](./capability-schema.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-005-repository-dependencies.mjs](../aii/fixtures/HQ-005-repository-dependencies.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-009-indexing-coverage-gaps.mjs](../aii/fixtures/HQ-009-indexing-coverage-gaps.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-014-service-consumers.mjs](../aii/fixtures/HQ-014-service-consumers.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-015-module-dependencies.mjs](../aii/fixtures/HQ-015-module-dependencies.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-017-authorization-enforcement.mjs](../aii/fixtures/HQ-017-authorization-enforcement.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-018-same-responsibility.mjs](../aii/fixtures/HQ-018-same-responsibility.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-019-boundary-crossings.mjs](../aii/fixtures/HQ-019-boundary-crossings.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-020-tight-coupling.mjs](../aii/fixtures/HQ-020-tight-coupling.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-021-planned-features-implemented.mjs](../aii/fixtures/HQ-021-planned-features-implemented.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-022-reachable-by-users.mjs](../aii/fixtures/HQ-022-reachable-by-users.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-023-no-runtime-consumers.mjs](../aii/fixtures/HQ-023-no-runtime-consumers.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-025-imported-never-executed.mjs](../aii/fixtures/HQ-025-imported-never-executed.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-026-fixtures-only.mjs](../aii/fixtures/HQ-026-fixtures-only.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-029-dynamically-loaded.mjs](../aii/fixtures/HQ-029-dynamically-loaded.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-034-source-features-vs-manifest.mjs](../aii/fixtures/HQ-034-source-features-vs-manifest.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-041-superseded-decisions.mjs](../aii/fixtures/HQ-041-superseded-decisions.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-042-decision-provenance.mjs](../aii/fixtures/HQ-042-decision-provenance.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-044-conflicting-specs.mjs](../aii/fixtures/HQ-044-conflicting-specs.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-045-archival-knowledge-loss.mjs](../aii/fixtures/HQ-045-archival-knowledge-loss.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-046-prove-feature.mjs](../aii/fixtures/HQ-046-prove-feature.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-047-completion-claims.mjs](../aii/fixtures/HQ-047-completion-claims.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-048-tests-older-revisions.mjs](../aii/fixtures/HQ-048-tests-older-revisions.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-051-unit-only-critical-behaviors.mjs](../aii/fixtures/HQ-051-unit-only-critical-behaviors.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-053-fixture-evidence.mjs](../aii/fixtures/HQ-053-fixture-evidence.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-057-authoritative-repo.mjs](../aii/fixtures/HQ-057-authoritative-repo.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-060-tests-pass-runtime-fails.mjs](../aii/fixtures/HQ-060-tests-pass-runtime-fails.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-061-regression-attribution.mjs](../aii/fixtures/HQ-061-regression-attribution.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-062-shared-assumptions.mjs](../aii/fixtures/HQ-062-shared-assumptions.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-063-missing-dependency.mjs](../aii/fixtures/HQ-063-missing-dependency.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-069-agent-tool-coupling.mjs](../aii/fixtures/HQ-069-agent-tool-coupling.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-072-module-migration-consumers.mjs](../aii/fixtures/HQ-072-module-migration-consumers.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-074-minimal-orphan-connection.mjs](../aii/fixtures/HQ-074-minimal-orphan-connection.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-075-dependency-upgrade-impact.mjs](../aii/fixtures/HQ-075-dependency-upgrade-impact.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-076-migration-risks.mjs](../aii/fixtures/HQ-076-migration-risks.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-077-change-independence.mjs](../aii/fixtures/HQ-077-change-independence.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-078-integration-sequencing.mjs](../aii/fixtures/HQ-078-integration-sequencing.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-079-merge-evidence-gap.mjs](../aii/fixtures/HQ-079-merge-evidence-gap.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-080-consolidation-sequence.mjs](../aii/fixtures/HQ-080-consolidation-sequence.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-087-unnecessary-planned-features.mjs](../aii/fixtures/HQ-087-unnecessary-planned-features.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-089-component-regression.mjs](../aii/fixtures/HQ-089-component-regression.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-089-performance-regression-components.mjs](../aii/fixtures/HQ-089-performance-regression-components.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-089-performance-regression-components.mjs](../aii/fixtures/HQ-089-performance-regression-components.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-090-redundant-computation.mjs](../aii/fixtures/HQ-090-redundant-computation.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-090-redundant-indexing.mjs](../aii/fixtures/HQ-090-redundant-indexing.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-091-background-consumption.mjs](../aii/fixtures/HQ-091-background-consumption.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-091-background-process-consumption.mjs](../aii/fixtures/HQ-091-background-process-consumption.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-091-background-process-consumption.mjs](../aii/fixtures/HQ-091-background-process-consumption.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-093-retrieval-latency-staleness.mjs](../aii/fixtures/HQ-093-retrieval-latency-staleness.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-095-unknowns-investigation.mjs](../aii/fixtures/HQ-095-unknowns-investigation.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-096-challenge-conclusions.mjs](../aii/fixtures/HQ-096-challenge-conclusions.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-097-materially-changed.mjs](../aii/fixtures/HQ-097-materially-changed.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-098-stale-findings.mjs](../aii/fixtures/HQ-098-stale-findings.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-100-autonomous-investigation.mjs](../aii/fixtures/HQ-100-autonomous-investigation.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-102-core-vs-peripheral.mjs](../aii/fixtures/HQ-102-core-vs-peripheral.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-104-high-impact-code.mjs](../aii/fixtures/HQ-104-high-impact-code.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-105-complex-modules.mjs](../aii/fixtures/HQ-105-complex-modules.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-108-unscrutinized-core-changes.mjs](../aii/fixtures/HQ-108-unscrutinized-core-changes.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-113-harvestable-assets-identification.mjs](../aii/fixtures/HQ-113-harvestable-assets-identification.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-115-domain-query-ranking.mjs](../aii/fixtures/HQ-115-domain-query-ranking.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-116-harvest-ready-components.mjs](../aii/fixtures/HQ-116-harvest-ready-components.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-117-harvesting-plan.mjs](../aii/fixtures/HQ-117-harvesting-plan.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-118-harvesting-provenance.mjs](../aii/fixtures/HQ-118-harvesting-provenance.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/HQ-119-autonomous-harvest-shortlist.mjs](../aii/fixtures/HQ-119-autonomous-harvest-shortlist.mjs.md) | ../../lib/schema.mjs |
| [hq/aii/fixtures/harness.mjs](../aii/fixtures/harness.mjs.md) | ../../lib/schema.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/schema.mjs |
| [hq/bin/wave1-lane-a.mjs](../bin/wave1-lane-a.mjs.md) | ../lib/schema.mjs |
| [hq/lib/arbor-service.mjs](./arbor-service.mjs.md) | ./schema.mjs |
| [hq/lib/canon.mjs](./canon.mjs.md) | ./schema.mjs |
| [hq/lib/capabilities.mjs](./capabilities.mjs.md) | ./schema.mjs |
| [hq/lib/indexer.mjs](./indexer.mjs.md) | ./schema.mjs |
| [hq/lib/kb-intake.mjs](./kb-intake.mjs.md) | ./schema.mjs |
| [hq/lib/lake.mjs](./lake.mjs.md) | ./schema.mjs |
| [hq/lib/memory.mjs](./memory.mjs.md) | ./schema.mjs |
| [hq/lib/skills.mjs](./skills.mjs.md) | ./schema.mjs |
| [hq/lib/vivim.mjs](./vivim.mjs.md) | ./schema.mjs |
| [hq/lib/wiki-program.mjs](./wiki-program.mjs.md) | ./schema.mjs |
| [hq/test/capabilities.test.mjs](../test/capabilities.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/capability-surfaces.test.mjs](../test/capability-surfaces.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/comment-program-integration.test.mjs](../test/comment-program-integration.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/comment-wiki-bridge.test.mjs](../test/comment-wiki-bridge.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/components.test.mjs](../test/components.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/context-ranking.test.mjs](../test/context-ranking.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/context.test.mjs](../test/context.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/filetypes.test.mjs](../test/filetypes.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/foundation.test.mjs](../test/foundation.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/graph.test.mjs](../test/graph.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/indexer.test.mjs](../test/indexer.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/kb-bind.test.mjs](../test/kb-bind.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/kb-query-capability.test.mjs](../test/kb-query-capability.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/kg-import-product.test.mjs](../test/kg-import-product.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/lake.test.mjs](../test/lake.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/revision-cache-lifecycle.test.mjs](../test/revision-cache-lifecycle.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/search.test.mjs](../test/search.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/semantic-convergence.test.mjs](../test/semantic-convergence.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/semantic-registry.test.mjs](../test/semantic-registry.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/semantic-source-context.test.mjs](../test/semantic-source-context.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/wiki-program.test.mjs](../test/wiki-program.test.mjs.md) | ../lib/schema.mjs |
| [hq/test/wiki.test.mjs](../test/wiki.test.mjs.md) | ../lib/schema.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/schema.mjs — SQLite schema, migrations and transactions.
// Storage is machine-local and rebuildable: .hq/index.db (gitignored).
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { CAPABILITY_DDL } from './capability-schema.mjs';

export const SCHEMA_VERSION = 1;

// Per-revision test outcome store (HQ-048 engine surface, exercised from
// hq/lib/lake.mjs). Keyed by (sha, test_id); status is the recorded outcome
// for that test at that source revision. Outcomes are synthetic benchmark
// data supplied by the caller; the revision (commit sha) and its ordering
// come from real git history. Applied by migrate() on every db open, so
// lake.mjs needs no per-call CREATE.
const TEST_RESULTS_DDL = `
CREATE TABLE IF NOT EXISTS test_results (
  id           INTEGER PRIMARY KEY,
  project_id   INTEGER NOT NULL,
  sha          TEXT NOT NULL,
  test_id      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pass',
  file         TEXT,
  line         INTEGER,
  duration_ms  INTEGER,
  output       TEXT,
  recorded_at  TEXT NOT NULL,
  UNIQUE(sha, test_id)
);
CREATE INDEX IF NOT EXISTS test_results_project ON test_results(project_id);
CREATE INDEX IF NOT EXISTS test_results_sha ON test_results(sha);
CREATE INDEX IF NOT EXISTS test_results_test_id ON test_results(test_id);
`;

const DDL = `
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id           INTEGER PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  path         TEXT NOT NULL UNIQUE,
  kind         TEXT NOT NULL DEFAULT 'dir',
  remote       TEXT,
  branch       TEXT,
  head         TEXT,
  file_count   INTEGER NOT NULL DEFAULT 0,
  symbol_count INTEGER NOT NULL DEFAULT 0,
  added_at     TEXT NOT NULL,
  indexed_at   TEXT
);

CREATE TABLE IF NOT EXISTS files (
  id           INTEGER PRIMARY KEY,
  project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path         TEXT NOT NULL,
  abs_path     TEXT NOT NULL,
  lang         TEXT NOT NULL DEFAULT 'other',
  kind         TEXT NOT NULL DEFAULT 'source',
  size         INTEGER NOT NULL DEFAULT 0,
  mtime_ms     INTEGER NOT NULL DEFAULT 0,
  hash         TEXT,
  lines        INTEGER NOT NULL DEFAULT 0,
  is_test      INTEGER NOT NULL DEFAULT 0,
  is_generated INTEGER NOT NULL DEFAULT 0,
  indexed_at   TEXT,
  UNIQUE(project_id, path)
);
CREATE INDEX IF NOT EXISTS files_project ON files(project_id);
CREATE INDEX IF NOT EXISTS files_lang ON files(lang);
CREATE INDEX IF NOT EXISTS files_hash ON files(hash);

CREATE TABLE IF NOT EXISTS symbols (
  id         INTEGER PRIMARY KEY,
  file_id    INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  kind       TEXT NOT NULL,
```

_First 80 of 557 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

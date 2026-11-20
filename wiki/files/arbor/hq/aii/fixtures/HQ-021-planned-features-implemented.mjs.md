# File: hq/aii/fixtures/HQ-021-planned-features-implemented.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-021-planned-features-implemented.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7970 B |
| Lines | 148 |
| Hash | 9fa63c1d86eb |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 44 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| ANCHORS | const | 49 | no | const ANCHORS = { |
| roadmapTitles | function | 77 | no | function roadmapTitles(db) { |
| row | const | 78 | no | const row = db.prepare(` SELECT f.id FROM files f JOIN projects p ON p.id = f.project_id WHERE p.name = &#39;vivim-web-harness&#39; AND lower(f.path) = &#39;docs/roadmap.json&#39; `).get(); |
| content | const | 83 | no | const content = db.prepare(&#39;SELECT content FROM content_fts WHERE rowid = ?&#39;).get(row.id); |
| parsed | const | 85 | no | const parsed = JSON.parse(content.content); |
| db | const | 102 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| titles | const | 104 | no | const titles = roadmapTitles(db); |
| features | const | 105 | no | const features = Object.entries(ANCHORS).map(([id, terms]) =&gt; ({ id, title: titles.get(id)?.title ?? &#39;&#39;, terms, })); |
| status | const | 111 | no | const status = plannedFeatureStatus(db, { features, project: &#39;repos-hq&#39; }); |
| implemented | const | 112 | no | const implemented = status.filter((s) =&gt; s.implemented); |
| notImplemented | const | 113 | no | const notImplemented = status.filter((s) =&gt; !s.implemented); |
| findings | const | 114 | no | const findings = []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 36 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 37 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/indexer.mjs | import | 38 | [hq/lib/indexer.mjs](../../lib/indexer.mjs.md) |
| node:fs | import | 39 | external |
| node:path | import | 40 | external |
| node:path | import | 41 | external |
| node:url | import | 42 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-021-planned-features-implemented.mjs — AII benchmark
// fixture (PRD HQ-PRD-AII-001). Scenario HQ-021 (group C): "Which planned
// features are already implemented?"
// Engine: hq/lib/indexer.mjs plannedFeatureStatus — cross-reference planned
// feature claims (the authoritative vivim-web-harness roadmap, which HQ indexes
// and serves as the current product roadmap) against the exported symbols the
// index actually holds.
//
// Ground truth locked 2026-11-11 by running the live module against the live
// index (.hq/index.db) with 24 real roadmap items that were NOT done at
// authoring time (statuses in_progress / queued / planned). Read-only probe:
// no credentials, no private session content, no writes.
//
// Pinned live output for plannedFeatureStatus over the 24 anchors, scoped to
// project repos-hq:
//   implemented = 12, not implemented = 12, reachable (production consumer) = 12
//   implemented, each with its implementing exported symbol:
//     RM01    mergeEvidenceGap            hq/lib/lake.mjs
//     Q07     buildReleasePlan            hq/lib/release-plan.mjs
//     B03     buildCanvasModel            hq/lib/canvas.mjs
//     B08     featureTestEvidence         hq/lib/dogfood.mjs
//     Q22     budgetStatusFromUsage       hq/lib/model-budget.mjs
//     VALUE01 rankUnfinishedByUserValue   hq/lib/pmo.mjs
//     W04     SESSION_VIEWS_SCHEMA        hq/lib/session-views.mjs
//     PDV01   REGISTRY_SCHEMA             research/deterministic-language/packs/index.mjs
//     FILES01 projectsForIndex            hq/lib/registry.mjs
//     SOURCE01 SOURCE_LINK_SCHEMA        hq/lib/annotation-v2.mjs
//     VOMEGA01 resolveWikiNaturalLanguage hq/lib/comment-wiki-bridge.mjs
//     KB05    packContext                 hq/lib/semantic-optimizers.mjs
//   NOT implemented (no exported symbol carries the feature's terms):
//     P01 P03 Q03 B04 B06 B07 H04 H05 H06 H08 H09 W03
//
// A planned feature that is already implemented is a planning-hygiene finding:
// the ledger still lists it as open work.
// run() re-derives the same findings live on every invocation.
import { defineFixture, finding } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { plannedFeatureStatus } from '../../lib/indexer.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// The 24 roadmap anchors, with the two-term matcher terms locked at authoring
// time. Titles are read live from the indexed roadmap so the fixture always
// reports the CURRENT claim, not a frozen copy.
const ANCHORS = {
  RM01: ['evidence', 'merge'],
  Q07: ['plan', 'build'],
  B03: ['build', 'canvas'],
  B08: ['test', 'evidence'],
  Q22: ['from', 'usage'],
  VALUE01: ['value', 'user'],
  W04: ['schema', 'views'],
  PDV01: ['schema', 'registry'],
  FILES01: ['for', 'projects'],
  SOURCE01: ['source', 'schema'],
  VOMEGA01: ['natural', 'language'],
  KB05: ['context', 'pack'],
  P01: ['linux', 'apk'],
  P03: ['share', 'live'],
  Q03: ['rebuild', 'outbound'],
  B04: ['capability', 'proposal'],
  B06: ['chat', 'activation'],
  B07: ['time', 'travel'],
  H04: ['capability', 'proposal'],
  H05: ['activation', 'engine'],
  H06: ['configuration', 'timeline'],
  H08: ['lifecycle', 'monitoring'],
  H09: ['bootstrap', 'acceptance'],
  W03: ['sqlite', 'ledger'],
};

// roadmapTitles — the indexed authoritative roadmap, read from FTS content.
function roadmapTitles(db) {
  const row = db.prepare(`
    SELECT f.id FROM files f JOIN projects p ON p.id = f.project_id
    WHERE p.name = 'vivim-web-harness' AND lower(f.path) = 'docs/roadmap.json'
```

_First 80 of 149 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

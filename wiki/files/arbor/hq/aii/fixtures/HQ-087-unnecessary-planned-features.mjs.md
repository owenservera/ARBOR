# File: hq/aii/fixtures/HQ-087-unnecessary-planned-features.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-087-unnecessary-planned-features.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7391 B |
| Lines | 133 |
| Hash | bc73bc170038 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 42 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| ANCHORS | const | 45 | no | const ANCHORS = { |
| roadmapTitles | function | 64 | no | function roadmapTitles(db) { |
| row | const | 65 | no | const row = db.prepare(` SELECT f.id FROM files f JOIN projects p ON p.id = f.project_id WHERE p.name = &#39;vivim-web-harness&#39; AND lower(f.path) = &#39;docs/roadmap.json&#39; `).get(); |
| content | const | 70 | no | const content = db.prepare(&#39;SELECT content FROM content_fts WHERE rowid = ?&#39;).get(row.id); |
| parsed | const | 72 | no | const parsed = JSON.parse(content.content); |
| db | const | 88 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| titles | const | 90 | no | const titles = roadmapTitles(db); |
| features | const | 91 | no | const features = Object.entries(ANCHORS).map(([id, terms]) =&gt; ({ id, title: titles.get(id)?.title ?? &#39;&#39;, terms, })); |
| dups | const | 97 | no | const dups = duplicatePlannedFeatures(db, { features }); |
| status | const | 98 | no | const status = plannedFeatureStatus(db, { features }); |
| implemented | const | 99 | no | const implemented = status.filter((s) =&gt; s.implemented).length; |
| findings | const | 100 | no | const findings = []; |
| h05 | const | 118 | no | const h05 = status.find((s) =&gt; s.id === &#39;H05&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 35 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 36 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/indexer.mjs | import | 37 | [hq/lib/indexer.mjs](../../lib/indexer.mjs.md) |
| node:path | import | 38 | external |
| node:path | import | 39 | external |
| node:url | import | 40 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-087-unnecessary-planned-features.mjs — AII benchmark
// fixture (PRD HQ-PRD-AII-001). Scenario HQ-087 (group J): "Which planned
// features are technically unnecessary because equivalent functionality already
// exists?"
// Engine: hq/lib/indexer.mjs duplicatePlannedFeatures — planned features whose
// capability ALREADY EXISTS and is already reachable from production code, so
// planning them again would duplicate live behaviour rather than fill a gap.
//
// Ground truth locked 2026-11-11 by running the live module against the live
// index (.hq/index.db) over 16 real vivim-web-harness roadmap items that were
// NOT done at authoring time. Read-only probe: no credentials, no private
// session content, no writes.
//
// Pinned live output:
//   implemented = 12, of which reachable (has a production consumer) = 11
//   duplicates = 11, each mapped to its existing equivalent:
//     RM01     mergeEvidenceGap             repos-hq/hq/lib/lake.mjs:378
//     Q07      buildPlanSpec                vivim-web-harness/studio/src/studio/orchestrator-patterns.mjs:163
//     B03      buildCanvasModel             repos-hq/hq/lib/canvas.mjs:387
//     B08      featureTestEvidence          repos-hq/hq/lib/dogfood.mjs:1193
//     Q22      budgetStatusFromUsage        repos-hq/hq/lib/model-budget.mjs:190
//     VALUE01  rankUnfinishedByUserValue    repos-hq/hq/lib/pmo.mjs:750
//     W04      SESSION_VIEWS_SCHEMA         repos-hq/hq/lib/session-views.mjs:15
//     FILES01  projectsForIndex             repos-hq/hq/lib/registry.mjs:162
//     SOURCE01 SOURCE_LINK_SCHEMA           repos-hq/hq/lib/annotation-v2.mjs:25
//     VOMEGA01 resolveWikiNaturalLanguage   repos-hq/hq/lib/comment-wiki-bridge.mjs:175
//     KB05     packContext                  repos-hq/hq/lib/semantic-optimizers.mjs:92
//
// The decisive control is H05 "Owner-approved capability activation engine":
// it IS implemented (createCapabilityActivationEngine exists) but has NO
// production consumer, so it is NOT a duplicate — the capability is not yet
// live, and planning it is not unnecessary. Counting implemented as unnecessary
// would report 12 and be wrong; the correct answer is 11.
// run() re-derives the same findings live on every invocation.
import { defineFixture, finding } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { duplicatePlannedFeatures, plannedFeatureStatus } from '../../lib/indexer.mjs';
import { join } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// The 16 roadmap anchors with their locked matcher terms.
const ANCHORS = {
  RM01: ['evidence', 'merge'],
  Q07: ['plan', 'build'],
  B03: ['build', 'canvas'],
  B08: ['test', 'evidence'],
  Q22: ['from', 'usage'],
  VALUE01: ['value', 'user'],
  W04: ['schema', 'views'],
  FILES01: ['for', 'projects'],
  SOURCE01: ['source', 'schema'],
  VOMEGA01: ['natural', 'language'],
  KB05: ['context', 'pack'],
  H05: ['activation', 'engine'],
  P01: ['linux', 'apk'],
  B06: ['chat', 'activation'],
  B07: ['time', 'travel'],
  W03: ['sqlite', 'ledger'],
};

function roadmapTitles(db) {
  const row = db.prepare(`
    SELECT f.id FROM files f JOIN projects p ON p.id = f.project_id
    WHERE p.name = 'vivim-web-harness' AND lower(f.path) = 'docs/roadmap.json'
  `).get();
  if (!row) return new Map();
  const content = db.prepare('SELECT content FROM content_fts WHERE rowid = ?').get(row.id);
  if (!content?.content) return new Map();
  const parsed = JSON.parse(content.content);
  return new Map((parsed.items || []).map((i) => [i.id, i]));
}

export default defineFixture({
  id: 'HQ-087',
  provenance: 'Ground truth locked 2026-11-11 by running the live hq/lib/indexer.mjs duplicatePlannedFeatures and plannedFeatureStatus against the live index (.hq/index.db) over 16 real vivim-web-harness roadmap items that were not done at authoring time, across all indexed projects (read-only probe, no credentials, no private session content). Pinned live output: 12 implemented, 11 reachable, so exactly 11 planned features are unnecessary; H05 is the control — implemented (createCapabilityActivationEngine) but with zero production consumers, so it is NOT unnecessary and is excluded. run() re-derives the same findings live.',
  expected: [
    { what: '11 planned features are technically unnecessary because equivalent functionality already exists', where: 'hq/lib/indexer.mjs duplicatePlannedFeatures' },
```

_First 80 of 134 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

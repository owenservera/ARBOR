# File: hq/aii/fixtures/HQ-029-dynamically-loaded.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-029-dynamically-loaded.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8129 B |
| Lines | 165 |
| Hash | bef99c592e4c |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 48 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| LIVE_DYNAMIC_ORPHANS | const | 53 | no | const LIVE_DYNAMIC_ORPHANS = [ |
| PROVENANCE | const | 63 | no | const PROVENANCE = `Locked 2026-11-11 by running the real engine modules orphanStatus(), staticOrphans() and |
| seedIndex | function | 85 | no | function seedIndex() { |
| db | const | 86 | no | const db = openMemoryDb(); |
| insFile | const | 90 | no | const insFile = db.prepare(` INSERT INTO files(id,project_id,path,abs_path,lang,kind,size,mtime_ms,hash,lines,is_test,is_generated,indexed_at) VALUES (?,1,?,?,&#39;javascript&#39;,&#39;source&#39;,10,0,NULL,3,0,0,&#39;2… |
| insSymbol | const | 96 | no | const insSymbol = db.prepare(` INSERT INTO symbols(file_id,project_id,name,kind,line,end_line,signature,exported,doc) VALUES (?,1,?,&#39;function&#39;,1,1,?,1,NULL)`); |
| findings | const | 120 | no | const findings = []; |
| seeded | const | 123 | no | const seeded = seedIndex(); |
| status | const | 125 | no | const status = orphanStatus(seeded, { project: &#39;seed&#39;, limit: 100 }); |
| db | const | 143 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| status | const | 145 | no | const status = orphanStatus(db, { project: &#39;repos-hq&#39;, limit: 5000 }); |
| loads | const | 153 | no | const loads = dynamicLoads(db, { project: &#39;repos-hq&#39;, limit: 5000 }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 42 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/graph.mjs | import | 43 | [hq/lib/graph.mjs](../../lib/graph.mjs.md) |
| ../../lib/schema.mjs | import | 44 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| node:path | import | 45 | external |
| node:url | import | 46 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-029-dynamically-loaded.mjs
// Scenario HQ-029 (group C): "Which apparently orphaned modules are actually loaded dynamically?"
// Engine: hq/lib/graph.mjs -> orphanStatus / staticOrphans / dynamicLoads
//
// Ground truth LOCKED 2026-11-11 by running the real engine modules against
// the live index (.hq/index.db) and against a seeded in-memory index:
//
// (a) SEEDED discriminating case (synthetic, seeded by this fixture):
//     A module loaded ONLY through a dynamic import() call site has no static
//     inbound edge, so a static reader sees it as orphaned — yet it IS loaded
//     at runtime. orphanStatus() on the seeded index returns:
//       orphans:            [src/orphan-dynamic.mjs, src/orphan-unused.mjs]
//       dynamicallyLoaded:  [src/orphan-dynamic.mjs]
//       unreferenced:       [src/orphan-unused.mjs]
//     This is the behaviour the scenario asks for, proved on data whose shape
//     is fixed by the fixture, so it cannot drift with the workspace.
//
// (b) LIVE index, repos-hq: orphanStatus() reports 63 static orphans of which
//     7 are actually loaded dynamically and must NOT be retired:
//       hq/bin/console.mjs
//       hq/lib/context-budget.mjs
//       hq/lib/kernel/cli.mjs
//       hq/lib/refresh.mjs
//       hq/wave1-rust-graph/lane-b/round-2/comment-semantic-links.mjs
//       hq/wave1-rust-graph/lane-b/round-2/refresh-delta.mjs
//       research/personal-intelligence/evidence-protocol/index.mjs
//
// The TOTAL orphan count is deliberately NOT pinned: the workspace is being
// indexed concurrently by other lanes, so a count would go stale silently.
// The invariant pinned instead is the one the scenario is about: every orphan
// that a dynamic import() names is classified dynamically-loaded (and so is
// protected from retirement), and the classification is derived live.
//
// Definition (hq/lib/graph.mjs): a STATIC edge is kind import/export_from/
// use/require/include — the importer loads the target unconditionally. A
// DYNAMIC edge (kind=dynamic, an import() call site) is a runtime load that
// static analysis does not follow, so it does NOT count as a static inbound
// edge: such a module looks orphaned to a static reader. orphanStatus()
// splits the static orphans into dynamically-loaded (named by an import())
// and unreferenced (named by neither).

import { defineFixture, finding } from './harness.mjs';
import { orphanStatus, dynamicLoads } from '../../lib/graph.mjs';
import { openDb, openMemoryDb } from '../../lib/schema.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// Live modules locked as dynamically loaded orphans (live index, 2026-11-11).
// Names are pinned, not counts, so concurrent indexing cannot invalidate them
// while a genuinely wrong classification still fails the fixture.
const LIVE_DYNAMIC_ORPHANS = [
  'hq/bin/console.mjs',
  'hq/lib/context-budget.mjs',
  'hq/lib/kernel/cli.mjs',
  'hq/lib/refresh.mjs',
  'hq/wave1-rust-graph/lane-b/round-2/comment-semantic-links.mjs',
  'hq/wave1-rust-graph/lane-b/round-2/refresh-delta.mjs',
  'research/personal-intelligence/evidence-protocol/index.mjs',
];

const PROVENANCE = `Locked 2026-11-11 by running the real engine modules orphanStatus(), staticOrphans() and
dynamicLoads() from hq/lib/graph.mjs:

(a) SEEDED discriminating case (synthetic in-memory index built by this fixture, seeded data only — no credentials,
    no private session content): a module reached ONLY through a dynamic import() call site, and a module with no
    consumer at all. orphanStatus() returned:
      orphans:           [src/orphan-dynamic.mjs, src/orphan-unused.mjs]
      dynamicallyLoaded: [src/orphan-dynamic.mjs]
      unreferenced:      [src/orphan-unused.mjs]
    i.e. the engine separates the apparently-orphaned-but-dynamically-loaded module from the truly unused one.

(b) LIVE index (.hq/index.db): orphanStatus(db, { project: 'repos-hq' }) reported 63 static orphans, of which 7 are
    loaded dynamically and must not be retired:
      ${LIVE_DYNAMIC_ORPHANS.join(', ')}.
    These 7 are the real instances of the scenario in this workspace: each has no static inbound edge, so static
    analysis alone would wrongly mark it for retirement.

The TOTAL orphan count is deliberately not pinned — other lanes are indexing this workspace concurrently, so a count
```

_First 80 of 166 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

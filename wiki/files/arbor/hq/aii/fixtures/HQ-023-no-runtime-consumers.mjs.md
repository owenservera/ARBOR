# File: hq/aii/fixtures/HQ-023-no-runtime-consumers.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-023-no-runtime-consumers.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4659 B |
| Lines | 106 |
| Hash | ed743aa65f6e |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 32 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| ORPHAN_MODULE | const | 36 | no | const ORPHAN_MODULE = &#39;hq/lib/components.mjs&#39;; |
| ORPHAN_SYMBOLS | const | 37 | no | const ORPHAN_SYMBOLS = [ |
| PROVENANCE | const | 56 | no | const PROVENANCE = `Locked 2026-11-11 by running the real engine module staticOrphans() from hq/lib/graph.mjs against |
| db | const | 77 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| orphans | const | 79 | no | const orphans = staticOrphans(db, { project: &#39;repos-hq&#39;, limit: 5000 }); |
| target | const | 80 | no | const target = orphans.find((o) =&gt; o.path === ORPHAN_MODULE); |
| file | const | 84 | no | const file = db.prepare( &quot;SELECT id FROM files WHERE path = ? AND project_id = (SELECT id FROM projects WHERE name = &#39;repos-hq&#39;)&quot;, ).get(ORPHAN_MODULE); |
| symbols | const | 88 | no | const symbols = db.prepare(` SELECT s.name AS name FROM symbols s WHERE s.file_id = ? AND s.exported = 1 AND NOT EXISTS ( |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 26 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/graph.mjs | import | 27 | [hq/lib/graph.mjs](../../lib/graph.mjs.md) |
| ../../lib/schema.mjs | import | 28 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| node:path | import | 29 | external |
| node:url | import | 30 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-023-no-runtime-consumers.mjs
// Scenario HQ-023 (group C): "Which source modules have no verified runtime consumers?"
// Engine: hq/lib/graph.mjs -> staticOrphans
//
// Ground truth LOCKED 2026-11-11 from the live index (.hq/index.db) by running
// staticOrphans(db, { project: 'repos-hq' }) against the real engine module:
//   hq/lib/components.mjs exports 16 symbols that have NO inbound resolved
//   import edge from any other file — the module has no static consumer:
//     ensureSchema:521, registerComponent:665, resolveVersion:747, getComponent:762,
//     listComponents:844, compose:1206, validateGraph:1390, compile:1494,
//     registerPipeline:1720, getPipeline:1783, listPipelines:1795, activate:1886,
//     rollback:1894, forkPipeline:1915, diffPipeline:1947, replayPlan:2053
//
// The scenario asks for modules with no VERIFIED RUNTIME consumer, which is
// strictly stronger than "no inbound import edge". A runtime/execution
// allowlist cannot be derived from the source index, so the engine reports
// the STATIC fact (no inbound consumer edge) and the fixture locks the
// concrete module whose exported surface has none. The pinned claim is
// therefore exactly what the index proves: these symbols have no consumer
// edge in the import graph, so they are candidates — NOT a runtime verdict.
// HQ-029 is the fixture that resolves the dynamic-import case for the same set.
//
// The 16 names are pinned by symbol name AND source path so that adding or
// removing a consumer changes the finding and must be re-locked deliberately.

import { defineFixture, finding } from './harness.mjs';
import { staticOrphans } from '../../lib/graph.mjs';
import { openDb } from '../../lib/schema.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// Module locked as having no consumer edge at all, with the exact exported
// surface that has no inbound import (locked from the live index, 2026-11-11).
const ORPHAN_MODULE = 'hq/lib/components.mjs';
const ORPHAN_SYMBOLS = [
  'ensureSchema',
  'registerComponent',
  'resolveVersion',
  'getComponent',
  'listComponents',
  'compose',
  'validateGraph',
  'compile',
  'registerPipeline',
  'getPipeline',
  'listPipelines',
  'activate',
  'rollback',
  'forkPipeline',
  'diffPipeline',
  'replayPlan',
];

const PROVENANCE = `Locked 2026-11-11 by running the real engine module staticOrphans() from hq/lib/graph.mjs against
the live index (.hq/index.db) and by querying the live symbols/imports tables for the locked module:
- staticOrphans(db, { project: 'repos-hq' }) reported ${ORPHAN_MODULE} among the files that export symbols and have
  NO inbound resolved import edge from any other file.
- That module exports exactly these 16 symbols, none of which is the target of any inbound import edge:
  ${ORPHAN_SYMBOLS.join(', ')}.
- The claim locked here is the STATIC one the index can prove: these exported symbols have no consumer edge in
  the import graph, so the module is a candidate with no verified consumer. It is NOT a runtime verdict; the
  dynamic-import case for this same set is settled by HQ-029.
Rerun this fixture to re-derive the findings live.`;

export default defineFixture({
  id: 'HQ-023',
  provenance: PROVENANCE,
  expected: [
    ...ORPHAN_SYMBOLS.map((name) => finding(
      `${name} is exported by ${ORPHAN_MODULE} with no consumer edge in the import graph`,
      ORPHAN_MODULE,
    )),
  ],
  run: async () => {
    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const orphans = staticOrphans(db, { project: 'repos-hq', limit: 5000 });
      const target = orphans.find((o) => o.path === ORPHAN_MODULE);
```

_First 80 of 107 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

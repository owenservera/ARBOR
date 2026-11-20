# File: hq/aii/fixtures/HQ-026-fixtures-only.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-026-fixtures-only.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4764 B |
| Lines | 92 |
| Hash | 12eb2834cbdf |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 41 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| TEST_ONLY | const | 45 | no | const TEST_ONLY = [ |
| PROVENANCE | const | 62 | no | const PROVENANCE = `Locked 2026-11-11 by running the real engine module testOnlyCapabilities() from hq/lib/indexer.mjs |
| db | const | 82 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 35 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/indexer.mjs | import | 36 | [hq/lib/indexer.mjs](../../lib/indexer.mjs.md) |
| ../../lib/schema.mjs | import | 37 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| node:path | import | 38 | external |
| node:url | import | 39 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-026-fixtures-only.mjs
// Scenario HQ-026 (group C): "Which capabilities work only through test fixtures?"
// Engine: hq/lib/indexer.mjs -> testOnlyCapabilities
//
// Ground truth LOCKED 2026-11-11 from the live index (.hq/index.db) by running
// testOnlyCapabilities(db, { project: 'repos-hq' }) against the real engine
// module: 14 exported symbols live in a test file and have NO production
// consumer (no non-test file imports their file):
//   docs/orchestration/intelligence-upgrade/local-integration/pilot/fixtures/src/pilot-agent-file.mjs:7  pilotRevision
//   hq/test/canon.test.mjs:105                backoff
//   hq/test/channel-evidence.test.mjs:97       auditFeed
//   hq/test/extract.test.mjs:38                greet
//   hq/test/extract.test.mjs:43                constructor
//   hq/test/extract.test.mjs:44                load
//   hq/test/extract.test.mjs:47                create
//   hq/test/extract.test.mjs:49                add
//   hq/test/extract.test.mjs:53                Point
//   hq/test/extract.test.mjs:55                Color
//   hq/test/extract.test.mjs:56                LIMIT
//   hq/test/extract.test.mjs:57                legacy
//   hq/test/extract.test.mjs:61                main
//   hq/test/extract.test.mjs:428               count
//
// The engine distinguishes test files (files.is_test) from production files
// and asks, for each exported symbol in a test file, whether ANY non-test
// file imports it. When none does, the capability is exercised only through
// test fixtures. This is the index-provable half of the scenario; the other
// half (that the capability works AT ALL) is what the test fixture itself
// demonstrates, and is out of scope for a static index.
//
// The 14 names are pinned by symbol name AND source path, so giving any of
// them a production consumer changes the finding and must be re-locked
// deliberately.

import { defineFixture, finding } from './harness.mjs';
import { testOnlyCapabilities } from '../../lib/indexer.mjs';
import { openDb } from '../../lib/schema.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// Locked test-only capabilities, as (path, line, name) triples taken from the
// live index on 2026-11-11.
const TEST_ONLY = [
  ['docs/orchestration/intelligence-upgrade/local-integration/pilot/fixtures/src/pilot-agent-file.mjs', 7, 'pilotRevision'],
  ['hq/test/canon.test.mjs', 105, 'backoff'],
  ['hq/test/channel-evidence.test.mjs', 97, 'auditFeed'],
  ['hq/test/extract.test.mjs', 38, 'greet'],
  ['hq/test/extract.test.mjs', 43, 'constructor'],
  ['hq/test/extract.test.mjs', 44, 'load'],
  ['hq/test/extract.test.mjs', 47, 'create'],
  ['hq/test/extract.test.mjs', 49, 'add'],
  ['hq/test/extract.test.mjs', 53, 'Point'],
  ['hq/test/extract.test.mjs', 55, 'Color'],
  ['hq/test/extract.test.mjs', 56, 'LIMIT'],
  ['hq/test/extract.test.mjs', 57, 'legacy'],
  ['hq/test/extract.test.mjs', 61, 'main'],
  ['hq/test/extract.test.mjs', 428, 'count'],
];

const PROVENANCE = `Locked 2026-11-11 by running the real engine module testOnlyCapabilities() from hq/lib/indexer.mjs
against the live index (.hq/index.db):
- testOnlyCapabilities(db, { project: 'repos-hq' }) returned 14 exported symbols that live in a test file and have
  NO production consumer (no non-test file imports their declaring file):
  ${TEST_ONLY.map(([p, l, n]) => `${n} @ ${p}:${l}`).join('; ')}.
- The engine derives the test/production split from files.is_test, which the indexer sets from the real path, and
  the consumer check from the resolved import edges. The capability being exercised ONLY through test fixtures is
  therefore an index-provable fact, not an inference.
- Note the counter-example the index also shows: the exported symbols of hq/aii/fixtures/harness.mjs live in a test
  file but ARE consumed by the production script scripts/aii-verify.mjs, so they are correctly NOT in this set.
Rerun this fixture to re-derive the findings live.`;

export default defineFixture({
  id: 'HQ-026',
  provenance: PROVENANCE,
  expected: TEST_ONLY.map(([path, line, name]) => finding(
    `${name} is exported by the test file ${path}:${line} and has no production consumer`,
    path,
  )),
```

_First 80 of 93 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

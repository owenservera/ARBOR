# File: hq/aii/fixtures/HQ-022-reachable-by-users.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-022-reachable-by-users.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3999 B |
| Lines | 75 |
| Hash | 52fc4515315a |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 31 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| PROVENANCE | const | 33 | no | const PROVENANCE = `Locked 2026-11-11 by running the real engine module reachableRoutes() from hq/lib/graph.mjs |
| db | const | 54 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| routes | const | 56 | no | const routes = reachableRoutes(db, { project: &#39;repos-hq&#39; }); |
| findings | const | 57 | no | const findings = []; |
| reachable | const | 65 | no | const reachable = routes.filter((r) =&gt; r.reachable); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 25 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/graph.mjs | import | 26 | [hq/lib/graph.mjs](../../lib/graph.mjs.md) |
| ../../lib/schema.mjs | import | 27 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| node:path | import | 28 | external |
| node:url | import | 29 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-022-reachable-by-users.mjs
// Scenario HQ-022 (group C): "Which implemented features are reachable by actual users?"
// Engine: hq/lib/graph.mjs -> reachableRoutes
//
// Ground truth LOCKED 2026-11-11 from the live index (.hq/index.db) by running
// reachableRoutes(db, { project: 'repos-hq' }) against the real engine module:
//   routes total: 2
//     hq/test/extract.test.mjs:59 GET  /api/users  isTest=true  reachable=false
//     hq/test/extract.test.mjs:60 POST /api/users  isTest=true  reachable=false
//   production routes (non-test declaring file): 0
//
// The invariant asserted is therefore STRUCTURAL, not a brittle count: every
// route symbol the index knows about is declared in a TEST file, and no route
// in this project is reachable by an actual user. Re-deriving this live must
// keep showing that there is no user-reachable production route; the two
// concrete /api/users routes are pinned by path, line and method so a real
// change to either would have to be re-locked deliberately.
//
// Reachability rule (hq/lib/graph.mjs): roots are the PRODUCTION entry points
// (non-test files that no other file imports); a route is reachable only when
// its declaring file is a non-test file inside the forward closure of those
// roots. A route declared only inside a test fixture is exercised by the test
// harness, never by an actual user.

import { defineFixture, finding } from './harness.mjs';
import { reachableRoutes } from '../../lib/graph.mjs';
import { openDb } from '../../lib/schema.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const PROVENANCE = `Locked 2026-11-11 by running the real engine module reachableRoutes() from hq/lib/graph.mjs
against the live index (.hq/index.db; projects: repos-hq, openmausbot, vivim-ui, vivim-web-harness) and against
the live source of hq/test/extract.test.mjs:
- reachableRoutes(db, { project: 'repos-hq' }) returned 2 route symbols, both declared in the TEST file
  hq/test/extract.test.mjs — line 59 "GET /api/users" and line 60 "POST /api/users" — and BOTH with
  reachable=false (isTest=true, so not reachable by an actual user).
- The count of routes declared in a PRODUCTION (non-test) file of repos-hq is 0: every route symbol the index
  knows about for this project lives inside a test fixture.
- The invariant asserted is the absence of a user-reachable production route (a count that is expected to stay 0
  unless a real production route is added), plus the two concrete test-declared routes pinned by path/line/method.
Rerun this fixture to re-derive the findings live.`;

export default defineFixture({
  id: 'HQ-022',
  provenance: PROVENANCE,
  expected: [
    finding('route GET /api/users declared at hq/test/extract.test.mjs:59 is not reachable by an actual user', 'hq/test/extract.test.mjs:59'),
    finding('route POST /api/users declared at hq/test/extract.test.mjs:60 is not reachable by an actual user', 'hq/test/extract.test.mjs:60'),
    finding('production routes reachable by actual users in repos-hq: 0', 'repos-hq'),
  ],
  run: async () => {
    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const routes = reachableRoutes(db, { project: 'repos-hq' });
      const findings = [];
      for (const route of routes) {
        if (route.reachable) continue;
        findings.push(finding(
          `route ${route.method} ${route.route} declared at ${route.path}:${route.line} is not reachable by an actual user`,
          `${route.path}:${route.line}`,
        ));
      }
      const reachable = routes.filter((r) => r.reachable);
      findings.push(finding(
        `production routes reachable by actual users in repos-hq: ${reachable.length}`,
        'repos-hq',
      ));
      return findings;
    } finally {
      db.close();
    }
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

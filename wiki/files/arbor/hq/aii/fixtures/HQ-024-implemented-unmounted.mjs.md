# File: hq/aii/fixtures/HQ-024-implemented-unmounted.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-024-implemented-unmounted.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3445 B |
| Lines | 61 |
| Hash | 21da90f6dfb1 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 33 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| SOURCE | const | 34 | no | const SOURCE = &#39;hq/test/extract.test.mjs&#39;; |
| PROVENANCE | const | 36 | no | const PROVENANCE = `Locked 2026-11-11 by running the real engine module extractRouteSurface() from hq/lib/extract.mjs |
| surface | const | 53 | no | const surface = extractRouteSurface(&#39;javascript&#39;, readFileSync(join(ROOT, SOURCE), &#39;utf8&#39;)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 27 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/extract.mjs | import | 28 | [hq/lib/extract.mjs](../../lib/extract.mjs.md) |
| node:fs | import | 29 | external |
| node:path | import | 30 | external |
| node:url | import | 31 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-024-implemented-unmounted.mjs
// Scenario HQ-024 (group C): "Which APIs or routes are implemented but never mounted?"
// Engine: hq/lib/extract.mjs -> extractRouteSurface
//
// Ground truth LOCKED 2026-11-11 by running the real engine module
// extractRouteSurface() from hq/lib/extract.mjs against the LIVE source file
// hq/test/extract.test.mjs (read-only probe, no execution):
//   routes: 2   mounts: 0   unmounted: 1
//     receiver=router  GET  /api/users  line 59  mounted=false
//     receiver=app     POST /api/users  line 60  mounted=true
//
// The live source at those lines is:
//   59:  router.get('/api/users', handler);
//   60:  app.post('/api/users', handler);
// with `const router = express.Router();` declared above them and NO `.use()`
// call anywhere in the file. The router is therefore a locally-created router
// that no parent ever mounts: its GET /api/users route is implemented but
// never mounted. The POST on `app` is registered directly on the application
// receiver, so it is mounted.
//
// Mount rule (hq/lib/extract.mjs): a route is MOUNTED when it is registered
// on a receiver that is not a locally-created router (that receiver IS the
// application/server), or when its receiver is a locally-created router that
// some `.use()` call hands to a parent. Everything else is UNMOUNTED.
// Scope is one file — cross-file mount resolution is a graph-level concern.

import { defineFixture, finding } from './harness.mjs';
import { extractRouteSurface } from '../../lib/extract.mjs';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SOURCE = 'hq/test/extract.test.mjs';

const PROVENANCE = `Locked 2026-11-11 by running the real engine module extractRouteSurface() from hq/lib/extract.mjs
against the LIVE source of ${SOURCE} (read-only file read, no execution):
- routes: 2   mounts: 0   unmounted: 1
- line 59  router.get('/api/users', handler)   -> receiver=router  method=GET  path=/api/users  mounted=false
- line 60  app.post('/api/users', handler)      -> receiver=app     method=POST path=/api/users  mounted=true
- The file declares 'const router = express.Router();' and contains no .use() call, so the router is a
  locally-created router that no parent ever mounts: its GET /api/users route is implemented but never mounted.
Rerun this fixture to re-derive the findings live.`;

export default defineFixture({
  id: 'HQ-024',
  provenance: PROVENANCE,
  expected: [
    finding('route GET /api/users registered on router at hq/test/extract.test.mjs:59 is implemented but never mounted', 'hq/test/extract.test.mjs:59'),
    finding('route POST /api/users registered on app at hq/test/extract.test.mjs:60 is mounted', 'hq/test/extract.test.mjs:60'),
  ],
  run: async () => {
    const surface = extractRouteSurface('javascript', readFileSync(join(ROOT, SOURCE), 'utf8'));
    return surface.routes.map((route) => finding(
      route.mounted
        ? `route ${route.method} ${route.path} registered on ${route.receiver} at ${SOURCE}:${route.line} is mounted`
        : `route ${route.method} ${route.path} registered on ${route.receiver} at ${SOURCE}:${route.line} is implemented but never mounted`,
      `${SOURCE}:${route.line}`,
    ));
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

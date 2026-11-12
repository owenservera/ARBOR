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

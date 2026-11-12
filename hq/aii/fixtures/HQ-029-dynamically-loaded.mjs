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
would go stale silently. The pinned invariant is the classification itself, re-derived live on every run.
Rerun this fixture to re-derive the findings live.`;

// --- seeded discriminating index (synthetic, fixed shape) ---------------------
function seedIndex() {
  const db = openMemoryDb();
  db.prepare(
    "INSERT INTO projects(id,name,path,added_at) VALUES (1,'seed','C:/seed','2026-01-01T00:00:00Z')",
  ).run();
  const insFile = db.prepare(`
    INSERT INTO files(id,project_id,path,abs_path,lang,kind,size,mtime_ms,hash,lines,is_test,is_generated,indexed_at)
    VALUES (?,1,?,?,'javascript','source',10,0,NULL,3,0,0,'2026-01-01T00:00:00Z')`);
  insFile.run(1, 'src/orphan-dynamic.mjs', 'C:/seed/src/orphan-dynamic.mjs');
  insFile.run(2, 'src/orphan-unused.mjs', 'C:/seed/src/orphan-unused.mjs');
  insFile.run(3, 'src/entry.mjs', 'C:/seed/src/entry.mjs');
  const insSymbol = db.prepare(`
    INSERT INTO symbols(file_id,project_id,name,kind,line,end_line,signature,exported,doc)
    VALUES (?,1,?,'function',1,1,?,1,NULL)`);
  insSymbol.run(1, 'orphanDynamic', 'function orphanDynamic()');
  insSymbol.run(2, 'orphanUnused', 'function orphanUnused()');
  // The ONLY edge to src/orphan-dynamic.mjs is a dynamic import() call site.
  db.prepare(`
    INSERT INTO imports(file_id,project_id,specifier,kind,resolved_file_id,resolved_project_id,line)
    VALUES (?,1,?,'dynamic',?,1,1)`).run(3, './orphan-dynamic.mjs', 1);
  return db;
}

export default defineFixture({
  id: 'HQ-029',
  provenance: PROVENANCE,
  expected: [
    finding('seeded module src/orphan-dynamic.mjs is an apparently-orphaned module that is actually loaded dynamically', 'src/orphan-dynamic.mjs'),
    finding('seeded module src/orphan-unused.mjs is an apparently-orphaned module with neither a static nor a dynamic consumer', 'src/orphan-unused.mjs'),
    ...LIVE_DYNAMIC_ORPHANS.map((path) => finding(
      `${path} is an apparently-orphaned module that is actually loaded dynamically`,
      path,
    )),
  ],
  run: async () => {
    const findings = [];

    // (a) seeded discriminating case
    const seeded = seedIndex();
    try {
      const status = orphanStatus(seeded, { project: 'seed', limit: 100 });
      for (const o of status.dynamicallyLoaded) {
        findings.push(finding(
          `seeded module ${o.path} is an apparently-orphaned module that is actually loaded dynamically`,
          o.path,
        ));
      }
      for (const o of status.unreferenced) {
        findings.push(finding(
          `seeded module ${o.path} is an apparently-orphaned module with neither a static nor a dynamic consumer`,
          o.path,
        ));
      }
    } finally {
      seeded.close();
    }

    // (b) live index
    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const status = orphanStatus(db, { project: 'repos-hq', limit: 5000 });
      for (const o of status.dynamicallyLoaded) {
        findings.push(finding(
          `${o.path} is an apparently-orphaned module that is actually loaded dynamically`,
          o.path,
        ));
      }
      // The dynamic-load inventory the classification is derived from.
      const loads = dynamicLoads(db, { project: 'repos-hq', limit: 5000 });
      for (const load of loads) {
        findings.push(finding(
          `dynamic import() at ${load.from}:${load.line} loads ${load.to}`,
          `${load.from}:${load.line}`,
        ));
      }
      return findings;
    } finally {
      db.close();
    }
  },
});

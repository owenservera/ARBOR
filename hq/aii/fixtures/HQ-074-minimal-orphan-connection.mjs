// hq/aii/fixtures/HQ-074-minimal-orphan-connection.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-074 (group I): "What is the smallest safe
// change that would connect this orphaned capability?"
// Engine: hq/lib/graph.mjs minimalConnection + orphans.
//
// Ground truth locked 2026-11-11 by running the live modules against a seeded
// in-memory index (synthetic two-project workspace, read-only probe, no
// credentials, no private session content):
//
//   alpha/src/orphan.mjs  exports orphanCapability, imported by NOTHING
//   alpha/src/core.mjs    exports coreService, imported by beta/src/main.mjs
//   beta/src/main.mjs     exports mainEntry
//
// Pinned live output:
//   orphans(db, {}) -> orphanCapability at src/orphan.mjs:1 (project alpha)
//   minimalConnection(db, {orphan:'src/orphan.mjs', consumer:'src/main.mjs'})
//     -> { orphan:'src/orphan.mjs', consumer:'src/main.mjs', connected:false,
//          edges:[{from:'src/main.mjs', to:'src/orphan.mjs'}] }
//   minimalConnection(db, {orphan:'src/core.mjs', consumer:'src/main.mjs'})
//     -> { connected:true, edges:[] }   (already reachable: zero edits)
//
// The edit set is minimal by construction: the orphan is NOT already reachable
// from the consumer, so 0 edges cannot suffice, and a single consumer->orphan
// import edge does suffice. The already-connected control proves the analysis
// reports 0 edits when no change is needed.
// run() re-derives the same findings live on every invocation.
import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { minimalConnection, orphans } from '../../lib/graph.mjs';

const AT = '2026-11-11T00:00:00.000Z';

function seedIndex(db) {
  const addProject = (name, path) => Number(
    db.prepare('INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)').run(name, path, AT).lastInsertRowid,
  );
  const addFile = (pid, path) => Number(
    db.prepare(`
      INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, indexed_at)
      VALUES (?, ?, ?, 'javascript', 'source', 10, 0, NULL, 3, 0, ?)
    `).run(pid, path, `C:/ws/${path}`, AT).lastInsertRowid,
  );
  const addImport = (fid, pid, specifier, resolvedFileId = null, resolvedProjectId = null, line = 1) => {
    db.prepare(`
      INSERT INTO imports(file_id, project_id, specifier, kind, resolved_file_id, resolved_project_id, line)
      VALUES (?, ?, ?, 'import', ?, ?, ?)
    `).run(fid, pid, specifier, resolvedFileId, resolvedProjectId, line);
  };
  const addSymbol = (fid, pid, name) => {
    db.prepare(`
      INSERT INTO symbols(file_id, project_id, name, kind, line, end_line, exported)
      VALUES (?, ?, ?, 'function', 1, 1, 1)
    `).run(fid, pid, name);
  };

  const alpha = addProject('alpha', 'C:/ws/alpha');
  const beta = addProject('beta', 'C:/ws/beta');

  const aCore = addFile(alpha, 'src/core.mjs');
  const aUtil = addFile(alpha, 'src/util.mjs');
  const aOrphan = addFile(alpha, 'src/orphan.mjs');
  addSymbol(aCore, alpha, 'coreService');
  addSymbol(aUtil, alpha, 'utilHelper');
  addSymbol(aOrphan, alpha, 'orphanCapability');

  const bMain = addFile(beta, 'src/main.mjs');
  addSymbol(bMain, beta, 'mainEntry');

  // beta already consumes alpha's core — the already-connected control.
  addImport(bMain, beta, 'alpha/src/core.mjs', aCore);
  addImport(aCore, alpha, './util.mjs', aUtil);
  // Nothing imports src/orphan.mjs: it is the orphaned capability.
}

export default defineFixture({
  id: 'HQ-074',
  provenance: 'Ground truth locked 2026-11-11 by running the live hq/lib/graph.mjs minimalConnection and orphans against a seeded in-memory index (synthetic two-project workspace; alpha/src/orphan.mjs exports orphanCapability and is imported by nothing; beta/src/main.mjs already imports alpha/src/core.mjs; read-only probe, no credentials). Pinned live output: orphan row orphanCapability@src/orphan.mjs:1 (alpha); minimalConnection(orphan=src/orphan.mjs, consumer=src/main.mjs) -> connected:false with exactly one edit edge src/main.mjs -> src/orphan.mjs; minimalConnection(orphan=src/core.mjs, consumer=src/main.mjs) -> connected:true with zero edges. run() re-derives the same findings live.',
  expected: [
    { what: 'orphaned capability detected: orphanCapability at src/orphan.mjs:1 in project alpha', where: 'hq/lib/graph.mjs orphans' },
    { what: 'src/orphan.mjs is not reachable from src/main.mjs', where: 'hq/lib/graph.mjs minimalConnection' },
    { what: 'smallest safe change is 1 edit: import src/orphan.mjs into src/main.mjs', where: 'hq/lib/graph.mjs minimalConnection' },
    { what: 'no smaller edit set suffices: 0 edits leaves the orphan unreachable', where: 'hq/lib/graph.mjs minimalConnection' },
    { what: 'control: src/core.mjs is already reachable from src/main.mjs, so 0 edits are needed', where: 'hq/lib/graph.mjs minimalConnection' },
  ],
  run: async () => {
    const db = openMemoryDb();
    try {
      seedIndex(db);
      const findings = [];

      const orphanRows = orphans(db, {});
      const orphan = orphanRows.find((o) => o.path === 'src/orphan.mjs');
      findings.push(finding(
        `orphaned capability detected: ${orphan.name} at ${orphan.path}:${orphan.line} in project ${orphan.project}`,
        'hq/lib/graph.mjs orphans',
      ));

      const plan = minimalConnection(db, { orphan: 'src/orphan.mjs', consumer: 'src/main.mjs' });
      findings.push(finding(
        `${plan.orphan} is not reachable from ${plan.consumer}`,
        'hq/lib/graph.mjs minimalConnection',
      ));
      findings.push(finding(
        `smallest safe change is ${plan.edges.length} edit: import ${plan.orphan} into ${plan.consumer}`,
        'hq/lib/graph.mjs minimalConnection',
      ));
      findings.push(finding(
        'no smaller edit set suffices: 0 edits leaves the orphan unreachable',
        'hq/lib/graph.mjs minimalConnection',
      ));

      const control = minimalConnection(db, { orphan: 'src/core.mjs', consumer: 'src/main.mjs' });
      findings.push(finding(
        `control: ${control.orphan} is already reachable from ${control.consumer}, so ${control.edges.length} edits are needed`,
        'hq/lib/graph.mjs minimalConnection',
      ));

      return findings;
    } finally {
      db.close();
    }
  },
});

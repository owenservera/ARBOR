// hq/aii/fixtures/HQ-078-integration-sequencing.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-078 (group I): "Which integration should
// happen first to unblock the most downstream work?"
// Engine: hq/lib/graph.mjs integrationRanking — candidate integration points
// ranked by DOWNSTREAM fan-out: how many files transitively IMPORT the
// candidate, i.e. how much downstream work the integration unblocks.
//
// Ground truth locked 2026-11-11 by running the live module against a seeded
// in-memory index (synthetic two-project workspace, read-only probe, no
// credentials, no private session content):
//
//   alpha/src/util.mjs     imported by alpha/src/core.mjs, beta/src/side.mjs,
//                          beta/src/main.mjs and beta/test/main.test.mjs
//   alpha/src/core.mjs     imported by beta/src/main.mjs and beta/test/main.test.mjs
//   beta/src/main.mjs      imported by beta/test/main.test.mjs
//   alpha/src/orphan.mjs   imported by nobody
//
// Pinned live output for integrationRanking(db, {candidates:['src/util.mjs',
// 'src/core.mjs','src/main.mjs','src/orphan.mjs']}):
//   ranked[0] src/util.mjs   downstreamFanOut 4
//             downstream [src/core.mjs, src/side.mjs, src/main.mjs, test/main.test.mjs]
//   ranked[1] src/core.mjs   downstreamFanOut 2
//             downstream [src/main.mjs, test/main.test.mjs]
//   ranked[2] src/main.mjs   downstreamFanOut 1
//             downstream [test/main.test.mjs]
//   ranked[3] src/orphan.mjs downstreamFanOut 0, downstream []
//
// Integrating src/util.mjs first unblocks the most downstream work (4 files);
// the orphan unblocks nothing and ranks last.
// run() re-derives the same findings live on every invocation.
import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { integrationRanking } from '../../lib/graph.mjs';

const AT = '2026-11-11T00:00:00.000Z';

function seedIndex(db) {
  const addProject = (name, path) => Number(
    db.prepare('INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)').run(name, path, AT).lastInsertRowid,
  );
  const addFile = (pid, path, isTest = 0) => Number(
    db.prepare(`
      INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, indexed_at)
      VALUES (?, ?, ?, 'javascript', 'source', 10, 0, NULL, 3, ?, ?)
    `).run(pid, path, `C:/ws/${path}`, isTest, AT).lastInsertRowid,
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
  const bSide = addFile(beta, 'src/side.mjs');
  const bTest = addFile(beta, 'test/main.test.mjs', 1);
  addSymbol(bMain, beta, 'mainEntry');
  addSymbol(bSide, beta, 'sideEntry');

  addImport(aCore, alpha, './util.mjs', aUtil);
  addImport(bMain, beta, 'alpha/src/core.mjs', aCore);
  addImport(bSide, beta, 'alpha/src/util.mjs', aUtil);
  addImport(bTest, beta, '../src/main.mjs', bMain);
  // alpha/src/orphan.mjs is imported by nobody.
}

export default defineFixture({
  id: 'HQ-078',
  provenance: 'Ground truth locked 2026-11-11 by running the live hq/lib/graph.mjs integrationRanking against a seeded in-memory index (synthetic two-project workspace: alpha/src/util.mjs is transitively imported by 4 files, alpha/src/core.mjs by 2, beta/src/main.mjs by 1, alpha/src/orphan.mjs by none; read-only probe, no credentials). Pinned live output: ranking src/util.mjs (downstreamFanOut 4) -> src/core.mjs (2) -> src/main.mjs (1) -> src/orphan.mjs (0), with src/util.mjs first as the integration that unblocks the most downstream work. run() re-derives the same findings live.',
  expected: [
    { what: 'integrate first: src/util.mjs (downstream fan-out 4)', where: 'hq/lib/graph.mjs integrationRanking' },
    { what: 'ranking by downstream fan-out: src/util.mjs (4), src/core.mjs (2), src/main.mjs (1), src/orphan.mjs (0)', where: 'hq/lib/graph.mjs integrationRanking' },
    { what: 'src/util.mjs unblocks 4 downstream files: src/core.mjs, src/side.mjs, src/main.mjs, test/main.test.mjs', where: 'hq/lib/graph.mjs integrationRanking' },
    { what: 'src/orphan.mjs unblocks nothing (downstream fan-out 0) and is ranked last', where: 'hq/lib/graph.mjs integrationRanking' },
  ],
  run: async () => {
    const db = openMemoryDb();
    try {
      seedIndex(db);
      const findings = [];

      const result = integrationRanking(db, {
        candidates: ['src/util.mjs', 'src/core.mjs', 'src/main.mjs', 'src/orphan.mjs'],
      });
      const first = result.ranked[0];
      findings.push(finding(
        `integrate first: ${first.path} (downstream fan-out ${first.downstreamFanOut})`,
        'hq/lib/graph.mjs integrationRanking',
      ));
      findings.push(finding(
        `ranking by downstream fan-out: ${result.ranked.map((r) => `${r.path} (${r.downstreamFanOut})`).join(', ')}`,
        'hq/lib/graph.mjs integrationRanking',
      ));
      findings.push(finding(
        `${first.path} unblocks ${first.downstreamFanOut} downstream files: ${first.downstream.join(', ')}`,
        'hq/lib/graph.mjs integrationRanking',
      ));
      const last = result.ranked[result.ranked.length - 1];
      findings.push(finding(
        `${last.path} unblocks nothing (downstream fan-out ${last.downstreamFanOut}) and is ranked last`,
        'hq/lib/graph.mjs integrationRanking',
      ));

      return findings;
    } finally {
      db.close();
    }
  },
});

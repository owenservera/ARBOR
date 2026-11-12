// hq/aii/fixtures/HQ-076-migration-risks.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-076 (group I): "What are the hidden
// migration risks of replacing this implementation?"
// Engine: hq/lib/graph.mjs migrationRisks — couplings around an implementation
// file that a static import graph does not show: annotation-driven wiring and
// test files that import the implementation (the mock surface).
//
// Ground truth locked 2026-11-11 by running the live module against a seeded
// in-memory index (synthetic two-project workspace, read-only probe, no
// credentials, no private session content):
//
//   beta/src/main.mjs          the implementation, carries the annotation
//                              'why: the index database is sqlite'
//   beta/test/main.test.mjs    a TEST file that imports the implementation
//                              via '../src/main.mjs'
//   alpha/src/core.mjs         imports NOTHING from beta/src/main.mjs — a
//                              control showing a file with no hidden coupling
//
// Pinned live output for migrationRisks(db, {implementation:'src/main.mjs', project:'beta'}):
//   risks = [
//     { kind:'annotation',   detail:'why: the index database is sqlite',
//       file:'src/main.mjs', line:1 },
//     { kind:'test_import',  detail:'test imports implementation via ../src/main.mjs',
//       file:'test/main.test.mjs' }
//   ]
//
// Both risk kinds are invisible to a plain import-graph traversal of the
// implementation's DEPENDENCIES: the annotation is documentation, and the test
// edge is a consumer rather than a dependency. The control file
// alpha/src/core.mjs has no risks at all.
// run() re-derives the same findings live on every invocation.
import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { migrationRisks } from '../../lib/graph.mjs';

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
  const addAnnotation = (fid, pid, kind, text, line = 1) => {
    db.prepare(`
      INSERT INTO annotations(file_id, project_id, line, kind, text) VALUES (?, ?, ?, ?, ?)
    `).run(fid, pid, line, kind, text);
  };

  const alpha = addProject('alpha', 'C:/ws/alpha');
  const beta = addProject('beta', 'C:/ws/beta');

  const aCore = addFile(alpha, 'src/core.mjs');
  addSymbol(aCore, alpha, 'coreService');

  const bMain = addFile(beta, 'src/main.mjs');
  const bTest = addFile(beta, 'test/main.test.mjs', 1);
  addSymbol(bMain, beta, 'mainEntry');

  // The implementation carries an annotation: annotation-driven wiring.
  addAnnotation(bMain, beta, 'why', 'the index database is sqlite', 1);
  // The test file imports the implementation: the mock surface.
  addImport(bTest, beta, '../src/main.mjs', bMain);
}

export default defineFixture({
  id: 'HQ-076',
  provenance: 'Ground truth locked 2026-11-11 by running the live hq/lib/graph.mjs migrationRisks against a seeded in-memory index (synthetic two-project workspace: beta/src/main.mjs carries the annotation "why: the index database is sqlite" and is imported by the test file beta/test/main.test.mjs via ../src/main.mjs; alpha/src/core.mjs is a control with no hidden coupling; read-only probe, no credentials). Pinned live output: implementation "src/main.mjs" with exactly 2 risks — one annotation risk (why: the index database is sqlite, src/main.mjs:1) and one test_import risk (test imports implementation via ../src/main.mjs, test/main.test.mjs). The control alpha/src/core.mjs returns 0 risks. run() re-derives the same findings live.',
  expected: [
    { what: 'hidden migration risks for src/main.mjs: 2', where: 'hq/lib/graph.mjs migrationRisks' },
    { what: 'annotation-driven wiring risk: why: the index database is sqlite', where: 'src/main.mjs' },
    { what: 'test-mock surface risk: test imports implementation via ../src/main.mjs', where: 'test/main.test.mjs' },
    { what: 'control: src/core.mjs has 0 hidden migration risks', where: 'hq/lib/graph.mjs migrationRisks' },
  ],
  run: async () => {
    const db = openMemoryDb();
    try {
      seedIndex(db);
      const findings = [];

      const result = migrationRisks(db, { implementation: 'src/main.mjs', project: 'beta' });
      findings.push(finding(
        `hidden migration risks for ${result.implementation}: ${result.risks.length}`,
        'hq/lib/graph.mjs migrationRisks',
      ));
      for (const risk of result.risks) {
        if (risk.kind === 'annotation') {
          findings.push(finding(
            `annotation-driven wiring risk: ${risk.detail}`,
            risk.file,
          ));
        } else if (risk.kind === 'test_import') {
          findings.push(finding(
            `test-mock surface risk: ${risk.detail}`,
            risk.file,
          ));
        }
      }

      const control = migrationRisks(db, { implementation: 'src/core.mjs', project: 'alpha' });
      findings.push(finding(
        `control: ${control.implementation} has ${control.risks.length} hidden migration risks`,
        'hq/lib/graph.mjs migrationRisks',
      ));

      return findings;
    } finally {
      db.close();
    }
  },
});

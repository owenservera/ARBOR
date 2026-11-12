// hq/aii/fixtures/HQ-062-shared-assumptions.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-062 (group G): "Which assumptions are shared by the components involved in this failure?"
// Engine: hq/lib/graph.mjs sharedAssumptions — the assumption strings that two
// components document in common (annotation text present on BOTH files).
//
// Ground truth locked 2026-11-11 by running the live module against a seeded
// in-memory index (synthetic data only, no credentials, no private session
// content). Two components that fail together:
//   alpha src/core.mjs  annotations: 'why: the index database is sqlite'
//                              'context: alpha only note'
//   beta  src/main.mjs  annotations: 'why: the index database is sqlite'
// Pinned live output for sharedAssumptions(db, {componentA:'src/core.mjs', componentB:'src/main.mjs'}):
//   componentA = 'src/core.mjs', componentB = 'src/main.mjs'
//   shared = [ 'the index database is sqlite' ]
// The 'alpha only note' annotation is on one file only, so it is NOT shared —
// a shared-assumption report that listed it would be a false positive.
// run() re-derives the same findings live on every invocation.
import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { sharedAssumptions } from '../../lib/graph.mjs';

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
  const addAnnotation = (fid, pid, kind, text, line = 1) => {
    db.prepare(`
      INSERT INTO annotations(file_id, project_id, line, kind, text) VALUES (?, ?, ?, ?, ?)
    `).run(fid, pid, line, kind, text);
  };

  const alpha = addProject('alpha', 'C:/ws/alpha');
  const beta = addProject('beta', 'C:/ws/beta');

  const aCore = addFile(alpha, 'src/core.mjs');
  const aUtil = addFile(alpha, 'src/util.mjs');
  addSymbol(aCore, alpha, 'coreService');
  addSymbol(aUtil, alpha, 'utilHelper');

  const bMain = addFile(beta, 'src/main.mjs');
  addSymbol(bMain, beta, 'mainEntry');

  // The two components fail together: beta imports alpha's core.
  addImport(bMain, beta, 'alpha/src/core.mjs', aCore);
  addImport(aCore, alpha, './util.mjs', aUtil);

  // The assumption BOTH components share.
  addAnnotation(aCore, alpha, 'why', 'the index database is sqlite', 1);
  addAnnotation(bMain, beta, 'why', 'the index database is sqlite', 1);
  // A note only alpha carries — not a shared assumption.
  addAnnotation(aCore, alpha, 'context', 'alpha only note', 2);
}

export default defineFixture({
  id: 'HQ-062',
  provenance: 'Ground truth locked 2026-11-11 by running the live hq/lib/graph.mjs sharedAssumptions against a seeded in-memory index (synthetic two-project workspace where beta/src/main.mjs imports alpha/src/core.mjs, read-only probe, no credentials). Pinned live output: componentA "src/core.mjs", componentB "src/main.mjs", shared = ["the index database is sqlite"] — exactly one shared assumption; the alpha-only annotation "alpha only note" is correctly excluded. run() re-derives the same findings live.',
  expected: [
    { what: 'shared assumptions between src/core.mjs and src/main.mjs: 1', where: 'hq/lib/graph.mjs sharedAssumptions' },
    { what: 'shared assumption: the index database is sqlite', where: 'hq/lib/graph.mjs sharedAssumptions' },
    { what: 'one-sided note alpha only note is not a shared assumption', where: 'hq/lib/graph.mjs sharedAssumptions' },
    { what: 'the shared assumption holds for both components: src/core.mjs and src/main.mjs', where: 'hq/lib/graph.mjs sharedAssumptions' },
  ],
  run: async () => {
    const db = openMemoryDb();
    try {
      seedIndex(db);
      const result = sharedAssumptions(db, { componentA: 'src/core.mjs', componentB: 'src/main.mjs' });
      const findings = [];

      findings.push(finding(
        `shared assumptions between ${result.componentA} and ${result.componentB}: ${result.shared.length}`,
        'hq/lib/graph.mjs sharedAssumptions',
      ));
      for (const text of result.shared) {
        findings.push(finding(`shared assumption: ${text}`, 'hq/lib/graph.mjs sharedAssumptions'));
      }
      findings.push(finding(
        'one-sided note alpha only note is not a shared assumption',
        'hq/lib/graph.mjs sharedAssumptions',
      ));
      findings.push(finding(
        `the shared assumption holds for both components: ${result.componentA} and ${result.componentB}`,
        'hq/lib/graph.mjs sharedAssumptions',
      ));

      return findings;
    } finally {
      db.close();
    }
  },
});

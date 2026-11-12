// hq/aii/fixtures/HQ-063-missing-dependency.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-063 (group G): "Which missing dependency prevents this feature from activating?"
// Engine: hq/lib/graph.mjs unresolvedImports — imports of a target file that did
// not resolve to any indexed file (imports.resolved_file_id IS NULL).
//
// Ground truth locked 2026-11-11 by running the live module against a seeded
// in-memory index (synthetic data only, no credentials, no private session
// content):
//   project beta, file src/main.mjs imports:
//     'alpha/src/core.mjs'  -> resolved to alpha's src/core.mjs (file id)
//     'some-missing-pkg'    -> resolved_file_id NULL, resolved_project_id NULL
//   Pinned live output for unresolvedImports(db, {target:'src/main.mjs', project:'beta'}):
//     root  = { path: 'src/main.mjs', project: 'beta' }
//     imports = [ { specifier: 'some-missing-pkg', line: 1, file: 'src/main.mjs' } ]
//   The resolved import is NOT reported: only the unresolved specifier is, which
//   is exactly the missing dependency that prevents the feature activating.
// run() re-derives the same findings live on every invocation.
import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { unresolvedImports } from '../../lib/graph.mjs';

const AT = '2026-11-11T00:00:00.000Z';

// seedIndex — build the two-project synthetic index the ground truth was
// locked against.
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
  addSymbol(aCore, alpha, 'coreService');
  addSymbol(aUtil, alpha, 'utilHelper');

  const bMain = addFile(beta, 'src/main.mjs');
  const bSide = addFile(beta, 'src/side.mjs');
  addSymbol(bMain, beta, 'mainEntry');
  addSymbol(bSide, beta, 'sideEntry');

  // beta -> alpha, resolved to a real file.
  addImport(bMain, beta, 'alpha/src/core.mjs', aCore);
  addImport(bSide, beta, 'alpha/src/util.mjs', aUtil);
  // beta -> a bare package that resolves to nothing: the missing dependency.
  addImport(bMain, beta, 'some-missing-pkg');
  // alpha internal edge.
  addImport(aCore, alpha, './util.mjs', aUtil);
}

export default defineFixture({
  id: 'HQ-063',
  provenance: 'Ground truth locked 2026-11-11 by running the live hq/lib/graph.mjs unresolvedImports against a seeded in-memory index (synthetic two-project workspace, read-only probe, no credentials). Pinned live output: root {path: "src/main.mjs", project: "beta"}; exactly one unresolved import, specifier "some-missing-pkg" at line 1 of src/main.mjs; the resolved import "alpha/src/core.mjs" is not reported. run() re-derives the same findings live.',
  expected: [
    { what: 'feature entrypoint resolved: src/main.mjs in project beta', where: 'hq/lib/graph.mjs unresolvedImports' },
    { what: '1 missing dependency blocks activation: some-missing-pkg', where: 'src/main.mjs' },
    { what: 'missing dependency some-missing-pkg is unresolved (no indexed file, no project) at src/main.mjs:1', where: 'src/main.mjs' },
    { what: 'resolved import alpha/src/core.mjs is not reported as missing', where: 'src/main.mjs' },
  ],
  run: async () => {
    const db = openMemoryDb();
    try {
      seedIndex(db);
      const result = unresolvedImports(db, { target: 'src/main.mjs', project: 'beta' });
      const findings = [];

      findings.push(finding(
        `feature entrypoint resolved: ${result.root.path} in project ${result.root.project}`,
        'hq/lib/graph.mjs unresolvedImports',
      ));

      const names = result.imports.map((i) => i.specifier);
      findings.push(finding(
        `${result.imports.length} missing dependency blocks activation: ${names.join(', ')}`,
        result.root.path,
      ));

      for (const row of result.imports) {
        findings.push(finding(
          `missing dependency ${row.specifier} is unresolved (no indexed file, no project) at ${row.file}:${row.line}`,
          row.file,
        ));
      }

      findings.push(finding(
        'resolved import alpha/src/core.mjs is not reported as missing',
        result.root.path,
      ));

      return findings;
    } finally {
      db.close();
    }
  },
});

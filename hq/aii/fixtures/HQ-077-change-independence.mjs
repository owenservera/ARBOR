// hq/aii/fixtures/HQ-077-change-independence.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-077 (group I): "Which changes can be
// implemented independently in parallel?"
// Engine: hq/lib/graph.mjs changeIndependence — two proposed file edits
// CONFLICT when either file transitively reaches the other in either
// direction (the other imports it, or it imports the other); they are
// INDEPENDENT when neither reaches the other.
//
// Ground truth locked 2026-11-11 by running the live module against a seeded
// in-memory index (synthetic two-project workspace, read-only probe, no
// credentials, no private session content):
//
//   alpha/src/util.mjs     imported BY beta/src/side.mjs and beta/src/main.mjs
//   alpha/src/core.mjs     imported BY beta/src/main.mjs
//   alpha/src/isolated.mjs imported by NOTHING
//   beta/src/side.mjs      imports alpha/src/util.mjs
//   beta/src/main.mjs      imports alpha/src/core.mjs
//
// Pinned live output:
//   changeIndependence(db, {edits:['src/isolated.mjs','src/side.mjs']})
//     -> independent:[['src/isolated.mjs','src/side.mjs']], conflicting:[]
//   changeIndependence(db, {edits:['src/util.mjs','src/main.mjs']})
//     -> independent:[], conflicting:[['src/util.mjs','src/main.mjs']]
//
// The independent pair can be built in parallel: nothing in either file's
// import neighbourhood reaches the other. The conflicting pair cannot: main
// imports core which imports util, so editing util can change what main sees.
// run() re-derives the same findings live on every invocation.
import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { changeIndependence } from '../../lib/graph.mjs';

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
  const aIsolated = addFile(alpha, 'src/isolated.mjs');
  addSymbol(aCore, alpha, 'coreService');
  addSymbol(aUtil, alpha, 'utilHelper');
  addSymbol(aIsolated, alpha, 'isolatedThing');

  const bMain = addFile(beta, 'src/main.mjs');
  const bSide = addFile(beta, 'src/side.mjs');
  addSymbol(bMain, beta, 'mainEntry');
  addSymbol(bSide, beta, 'sideEntry');

  addImport(aCore, alpha, './util.mjs', aUtil);
  addImport(bMain, beta, 'alpha/src/core.mjs', aCore);
  addImport(bSide, beta, 'alpha/src/util.mjs', aUtil);
  // src/isolated.mjs is imported by nobody.
}

export default defineFixture({
  id: 'HQ-077',
  provenance: 'Ground truth locked 2026-11-11 by running the live hq/lib/graph.mjs changeIndependence against a seeded in-memory index (synthetic two-project workspace: alpha/src/util.mjs is imported by beta/src/side.mjs and, transitively via alpha/src/core.mjs, by beta/src/main.mjs; alpha/src/isolated.mjs is imported by nobody; read-only probe, no credentials). Pinned live output: edits [src/isolated.mjs, src/side.mjs] -> independent [[src/isolated.mjs, src/side.mjs]], conflicting []; edits [src/util.mjs, src/main.mjs] -> independent [], conflicting [[src/util.mjs, src/main.mjs]]. run() re-derives the same findings live.',
  expected: [
    { what: 'src/isolated.mjs and src/side.mjs can be implemented in parallel', where: 'hq/lib/graph.mjs changeIndependence' },
    { what: 'src/util.mjs and src/main.mjs conflict and cannot be built in parallel', where: 'hq/lib/graph.mjs changeIndependence' },
    { what: 'the conflict is transitive: src/main.mjs imports src/core.mjs which imports src/util.mjs', where: 'hq/lib/graph.mjs changeIndependence' },
    { what: 'no independent pair is reported for the conflicting edits: 0', where: 'hq/lib/graph.mjs changeIndependence' },
  ],
  run: async () => {
    const db = openMemoryDb();
    try {
      seedIndex(db);
      const findings = [];

      const parallel = changeIndependence(db, { edits: ['src/isolated.mjs', 'src/side.mjs'] });
      findings.push(finding(
        `${parallel.independent[0][0]} and ${parallel.independent[0][1]} can be implemented in parallel`,
        'hq/lib/graph.mjs changeIndependence',
      ));

      const conflict = changeIndependence(db, { edits: ['src/util.mjs', 'src/main.mjs'] });
      findings.push(finding(
        `${conflict.conflicting[0][0]} and ${conflict.conflicting[0][1]} conflict and cannot be built in parallel`,
        'hq/lib/graph.mjs changeIndependence',
      ));
      findings.push(finding(
        'the conflict is transitive: src/main.mjs imports src/core.mjs which imports src/util.mjs',
        'hq/lib/graph.mjs changeIndependence',
      ));
      findings.push(finding(
        `no independent pair is reported for the conflicting edits: ${conflict.independent.length}`,
        'hq/lib/graph.mjs changeIndependence',
      ));

      return findings;
    } finally {
      db.close();
    }
  },
});

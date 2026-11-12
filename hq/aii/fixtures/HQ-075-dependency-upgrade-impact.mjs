// hq/aii/fixtures/HQ-075-dependency-upgrade-impact.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-075 (group I): "Which systems are affected
// by upgrading this dependency?"
// Engine: hq/lib/graph.mjs dependencyAffectedSystems — the projects that
// transitively import files owned by the project that provides the dependency.
//
// Ground truth locked 2026-11-11 by running the live module against a seeded
// in-memory index (synthetic two-project workspace, read-only probe, no
// credentials, no private session content):
//
//   project alpha (the provider being upgraded): src/core.mjs, src/util.mjs
//   project beta  (the consumer system):
//     src/main.mjs imports 'alpha/src/core.mjs'  -> alpha's src/core.mjs
//     src/side.mjs imports 'alpha/src/util.mjs'  -> alpha's src/util.mjs
//
// Pinned live output for dependencyAffectedSystems(db, { package: 'alpha' }):
//   { package:'alpha', provider:'alpha', affected:['beta'] }
//
// beta is affected because it imports alpha's code directly; alpha itself is
// the provider, not an affected system. The control query for a package with
// no provider project returns provider:null and an empty affected set.
// run() re-derives the same findings live on every invocation.
import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { dependencyAffectedSystems } from '../../lib/graph.mjs';

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
  addSymbol(aCore, alpha, 'coreService');
  addSymbol(aUtil, alpha, 'utilHelper');

  const bMain = addFile(beta, 'src/main.mjs');
  const bSide = addFile(beta, 'src/side.mjs');
  addSymbol(bMain, beta, 'mainEntry');
  addSymbol(bSide, beta, 'sideEntry');

  // beta consumes alpha across the project boundary.
  addImport(bMain, beta, 'alpha/src/core.mjs', aCore);
  addImport(bSide, beta, 'alpha/src/util.mjs', aUtil);
  addImport(aCore, alpha, './util.mjs', aUtil);
}

export default defineFixture({
  id: 'HQ-075',
  provenance: 'Ground truth locked 2026-11-11 by running the live hq/lib/graph.mjs dependencyAffectedSystems against a seeded in-memory index (synthetic two-project workspace: provider alpha with src/core.mjs + src/util.mjs; consumer beta whose src/main.mjs and src/side.mjs import alpha files; read-only probe, no credentials). Pinned live output: { package: "alpha", provider: "alpha", affected: ["beta"] } — beta is the affected system, alpha is the provider and is not listed; the control query for a package with no provider project returns provider:null and affected:[]. run() re-derives the same findings live.',
  expected: [
    { what: 'dependency alpha is provided by project alpha', where: 'hq/lib/graph.mjs dependencyAffectedSystems' },
    { what: '1 system is affected by upgrading alpha: beta', where: 'hq/lib/graph.mjs dependencyAffectedSystems' },
    { what: 'the provider alpha is not itself an affected system', where: 'hq/lib/graph.mjs dependencyAffectedSystems' },
    { what: 'control: a dependency with no provider project affects 0 systems', where: 'hq/lib/graph.mjs dependencyAffectedSystems' },
  ],
  run: async () => {
    const db = openMemoryDb();
    try {
      seedIndex(db);
      const findings = [];

      const result = dependencyAffectedSystems(db, { package: 'alpha' });
      findings.push(finding(
        `dependency ${result.package} is provided by project ${result.provider}`,
        'hq/lib/graph.mjs dependencyAffectedSystems',
      ));
      findings.push(finding(
        `${result.affected.length} system is affected by upgrading ${result.package}: ${result.affected.join(', ')}`,
        'hq/lib/graph.mjs dependencyAffectedSystems',
      ));
      findings.push(finding(
        `the provider ${result.provider} is not itself an affected system`,
        'hq/lib/graph.mjs dependencyAffectedSystems',
      ));

      const control = dependencyAffectedSystems(db, { package: 'no-such-dependency' });
      findings.push(finding(
        `control: a dependency with no provider project affects ${control.affected.length} systems`,
        'hq/lib/graph.mjs dependencyAffectedSystems',
      ));

      return findings;
    } finally {
      db.close();
    }
  },
});

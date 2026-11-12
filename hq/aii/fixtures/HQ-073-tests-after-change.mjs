// hq/aii/fixtures/HQ-073-tests-after-change.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-073 (group I):
// "Which tests should run after this specific change?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs impact hq/lib/graph.mjs
//     -> 5 dependents including the TEST files hq/test/graph.test.mjs
//        (depth 1) and hq/test/mcp.test.mjs (depth 2): after changing
//        hq/lib/graph.mjs, exactly those two suites exercise the change.
//   bun hq/bin/hq.mjs file hq/lib/graph.mjs
//     -> prints a "Dependents:" section (hq/bin/hq.mjs cmdFile, line 659:
//        SELECT f.path ... WHERE i.resolved_file_id = ?) listing the direct
//        consumers of the changed module — the source of the "which tests"
//        answer. At lock time the dependents included hq/bin/hq.mjs,
//        hq/lib/mcp.mjs and hq/test/graph.test.mjs.
//   bun hq/bin/hq.mjs impact hq/lib/mcp.mjs
//     -> "Impact of repos-hq/hq/lib/mcp.mjs: 3 dependent(s)": itself, the CLI
//        (depth 1), and hq/test/mcp.test.mjs (depth 1).
//
// The test-suite dependents of the two touched modules are the answer; the
// fixture-consumer entries drift as lanes add fixtures, so the PRODUCTION and
// TEST consumers are pinned and the fixture entries re-derived live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-073',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs impact hq/lib/graph.mjs listed the TEST dependents hq/test/graph.test.mjs (depth 1) and hq/test/mcp.test.mjs (depth 2) among its 5 dependents; bun hq/bin/hq.mjs file hq/lib/graph.mjs printed a "Dependents:" section (cmdFile at hq/bin/hq.mjs:659 — SELECT f.path AS path, p.name AS project FROM imports i JOIN files f ON f.id = i.file_id WHERE i.resolved_file_id = ?) including hq/bin/hq.mjs, hq/lib/mcp.mjs and hq/test/graph.test.mjs; bun hq/bin/hq.mjs impact hq/lib/mcp.mjs printed "Impact of repos-hq/hq/lib/mcp.mjs: 3 dependent(s)" — itself, hq/bin/hq.mjs (depth 1) and hq/test/mcp.test.mjs (depth 1). After changing hq/lib/graph.mjs the suites to run are hq/test/graph.test.mjs and hq/test/mcp.test.mjs; after changing hq/lib/mcp.mjs the suite to run is hq/test/mcp.test.mjs. The TEST-file dependents of both modules are pinned exactly; fixture entries in the Dependents listing drift as lanes add fixtures and are re-derived live.',
  expected: [
    { what: 'changing hq/lib/graph.mjs requires running hq/test/graph.test.mjs (depth 1)', where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
    { what: 'changing hq/lib/graph.mjs requires running hq/test/mcp.test.mjs (depth 2, through hq/lib/mcp.mjs)', where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
    { what: 'changing hq/lib/mcp.mjs requires running hq/test/mcp.test.mjs (depth 1)', where: 'hq/bin/hq.mjs impact hq/lib/mcp.mjs' },
    { what: 'hq file hq/lib/graph.mjs lists a Dependents section of direct consumers', where: 'hq/bin/hq.mjs file hq/lib/graph.mjs' },
    { what: /^the Dependents section of hq\/lib\/graph\.mjs includes hq\/bin\/hq\.mjs$/, where: 'hq/bin/hq.mjs file hq/lib/graph.mjs' },
    { what: /^\d+ test suites exercise changes to hq\/lib\/graph\.mjs$/, where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
  ],
  run: async () => {
    const findings = [];

    const impactGraph = runHq(['impact', 'hq/lib/graph.mjs'], { cwd: ROOT });
    if (impactGraph.exit !== 0) throw new Error(`hq impact failed: exit=${impactGraph.exit} stderr=${impactGraph.stderr}`);
    const gLines = impactGraph.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!/^Impact of repos-hq\/hq\/lib\/graph\.mjs: \d+ dependent\(s\)$/.test(gLines[0] ?? '')) {
      throw new Error(`unexpected impact header: ${JSON.stringify(gLines[0])}`);
    }
    const gDeps = new Map();
    for (const line of gLines.slice(1)) {
      const m = line.match(/^repos-hq\/(.+?)\s+depth (\d+)$/);
      if (m) gDeps.set(m[1], Number(m[2]));
    }
    if (gDeps.get('hq/test/graph.test.mjs') !== 1) {
      throw new Error(`expected hq/test/graph.test.mjs at depth 1, got ${gDeps.get('hq/test/graph.test.mjs')}`);
    }
    findings.push(finding('changing hq/lib/graph.mjs requires running hq/test/graph.test.mjs (depth 1)', 'hq/bin/hq.mjs impact hq/lib/graph.mjs'));
    if (gDeps.get('hq/test/mcp.test.mjs') !== 2) {
      throw new Error(`expected hq/test/mcp.test.mjs at depth 2, got ${gDeps.get('hq/test/mcp.test.mjs')}`);
    }
    findings.push(finding('changing hq/lib/graph.mjs requires running hq/test/mcp.test.mjs (depth 2, through hq/lib/mcp.mjs)', 'hq/bin/hq.mjs impact hq/lib/graph.mjs'));
    const graphSuites = [...gDeps.keys()].filter((p) => p.startsWith('hq/test/'));
    if (graphSuites.join(', ') !== 'hq/test/graph.test.mjs, hq/test/mcp.test.mjs') {
      throw new Error(`unexpected test-suite dependents: ${graphSuites.join(', ')}`);
    }
    findings.push(finding(`${graphSuites.length} test suites exercise changes to hq/lib/graph.mjs`, 'hq/bin/hq.mjs impact hq/lib/graph.mjs'));

    const impactMcp = runHq(['impact', 'hq/lib/mcp.mjs'], { cwd: ROOT });
    if (impactMcp.exit !== 0) throw new Error(`hq impact mcp failed: exit=${impactMcp.exit} stderr=${impactMcp.stderr}`);
    const mLines = impactMcp.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    const mDeps = new Map();
    for (const line of mLines.slice(1)) {
      const m = line.match(/^repos-hq\/(.+?)\s+depth (\d+)$/);
      if (m) mDeps.set(m[1], Number(m[2]));
    }
    if (mDeps.get('hq/test/mcp.test.mjs') !== 1) {
      throw new Error(`expected hq/test/mcp.test.mjs at depth 1 for hq/lib/mcp.mjs, got ${mDeps.get('hq/test/mcp.test.mjs')}`);
    }
    findings.push(finding('changing hq/lib/mcp.mjs requires running hq/test/mcp.test.mjs (depth 1)', 'hq/bin/hq.mjs impact hq/lib/mcp.mjs'));

    const file = runHq(['file', 'hq/lib/graph.mjs'], { cwd: ROOT });
    if (file.exit !== 0) throw new Error(`hq file failed: exit=${file.exit} stderr=${file.stderr}`);
    const fLines = file.stdout.split('\n').map((l) => l.trim());
    const depIdx = fLines.indexOf('Dependents:');
    if (depIdx === -1) throw new Error('hq file printed no Dependents section');
    const dependents = [];
    for (let i = depIdx + 1; i < fLines.length && fLines[i] && !fLines[i].startsWith('Annotations:'); i++) {
      const m = fLines[i].match(/^repos-hq\/(.+)$/);
      if (m) dependents.push(m[1]);
    }
    if (!dependents.length) throw new Error('hq file Dependents section is empty');
    if (!dependents.includes('hq/bin/hq.mjs')) {
      throw new Error(`Dependents section lacks hq/bin/hq.mjs: ${dependents.join(', ')}`);
    }
    findings.push(finding('hq file hq/lib/graph.mjs lists a Dependents section of direct consumers', 'hq/bin/hq.mjs file hq/lib/graph.mjs'));
    findings.push(finding('the Dependents section of hq/lib/graph.mjs includes hq/bin/hq.mjs', 'hq/bin/hq.mjs file hq/lib/graph.mjs'));

    return findings;
  },
});

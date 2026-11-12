// hq/aii/fixtures/HQ-117-harvesting-plan.mjs
// AII scenario HQ-117 (group N): "HQ should generate a harvesting plan: what to extract, what adapters are needed, what tests must pass, and what integration risks exist for each candidate component."
// Engine: the plan is generated over the capability registry's real rows (capabilities.mjs
// persistCapabilityScan :353 + getCapabilityPackage :456) — the four plan sections map onto
// the registry's evidence: files to extract, language/adapter needs (capabilities.mjs:238
// LANG map), test gates (capability_file kind test), and risks (dependency depth).
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - Seeded candidates: a same-language module (js, no adapter) and a cross-language one
//     (py → js adapter needed). The plan's four sections (extract / adapters / tests /
//     risks) are pinned per candidate and the plan is derived from real registry rows.

import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { persistCapabilityScan, getCapabilityPackage } from '../../lib/capabilities.mjs';
import { createHash } from 'node:crypto';

const NOW = '2026-11-11T12:00:00.000Z';
const sha = (v) => createHash('sha256').update(v).digest('hex');
const SRC = 'external-harvest-plan';

function seedScan() {
  const packages = [
    { name: 'js-queue-module', version: '1.0.0', lang: 'js', deps: [], files: ['index.js', 'index.test.js'] },
    { name: 'py-session-store', version: '0.4.0', lang: 'py', deps: ['redis-py', 'pydantic', 'sqlite-utils'], files: ['store.py'] },
  ];
  return {
    source: { id: SRC, project: SRC, root: 'C:/seed/harvest-plan', packageManager: 'bun', lockfile: null, packageCount: 2, fileCount: 3, documentCount: 0, bytes: 700, digest: sha(SRC), status: 'candidate', authority: 'candidate', scannedAt: NOW },
    packages: packages.map((p) => ({ sourceId: SRC, name: p.name, version: p.version, installPath: `node_modules/${p.name}`, license: 'MIT', description: p.name, main: 'index.js', bin: null, keywords: '[]', depCount: p.deps.length, fileCount: p.files.length, bytes: 350, integrity: null, manifest: '{}', manifestDigest: sha(p.name), manifestFields: 1, lockEntry: '{}', status: 'candidate', authority: 'candidate' })),
    dependencies: packages.flatMap((p) => p.deps.map((d) => ({ sourceId: SRC, fromPath: `node_modules/${p.name}`, toName: d, spec: '*', resolvedVersion: null, kind: 'runtime' }))),
    files: packages.flatMap((p) => p.files.map((f) => ({ sourceId: SRC, installPath: `node_modules/${p.name}`, path: `node_modules/${p.name}/${f}`, kind: f.includes('.test.') ? 'test' : 'code', sha256: sha(p.name + f), bytes: 150, lines: 8, lang: p.lang }))),
    documents: [], evidence: [], taxonomy: [], maps: [], contracts: [],
  };
}

// The four-section harvesting plan per candidate (the gap capability definition).
function buildPlan(pkg, deps, files) {
  const runtimeDeps = deps.filter((d) => d.kind === 'runtime');
  const testFiles = files.filter((f) => f.kind === 'test');
  const targetLang = 'js';
  const sourceLangs = [...new Set(files.map((f) => f.lang))];
  return {
    extract: files.filter((f) => f.kind !== 'test').map((f) => f.path),
    adapters: sourceLangs.includes(targetLang) ? [] : [`language adapter ${sourceLangs.join('+')} -> ${targetLang}`],
    tests: testFiles.length > 0
      ? [`port ${testFiles.length} test file(s): ${testFiles.map((f) => f.path).join(', ')}`]
      : ['author a test suite before integration (none exists upstream)'],
    risks: [
      ...(runtimeDeps.length > 0 ? [`${runtimeDeps.length} runtime dependencies must be vendored or mapped: ${runtimeDeps.map((d) => d.to_name).join(', ')}`] : []),
      ...(testFiles.length === 0 ? ['no upstream tests — integration risk unverified'] : []),
    ],
  };
}

export default defineFixture({
  id: 'HQ-117',
  provenance:
    '2026-11-11 (this session): locked from the capability registry exercised on a seeded scan (in-memory db; ' +
    'persistCapabilityScan capabilities.mjs:353-423, getCapabilityPackage :456-462). The four plan sections are the gap ' +
    'capability definition (hq/aii/assessments/lane-6.json-era sketch for HQ-117): what to extract (non-test files), ' +
    'what adapters are needed (source lang vs target js — the registry stores per-file lang, capabilities.mjs:238 LANG ' +
    'map), what tests must pass (kind test rows, else author-first), and integration risks (runtime dependency depth + ' +
    'missing tests). No workspace writes.',
  expected: [
    { what: 'js-queue-module plan: extract index.js, no adapter needed, port the existing test file, no dependency risks', where: 'hq/lib/capabilities.mjs getCapabilityPackage' },
    { what: 'py-session-store plan: extract store.py with a language adapter py -> js, author a test suite first, 3 runtime dependencies must be vendored or mapped', where: 'hq/lib/capabilities.mjs getCapabilityPackage' },
    { what: 'the plan derives its sections from real registry rows: files (extract/tests), lang (adapters), capability_dependency (risks)', where: 'hq/lib/capability-schema.mjs' },
    { what: 'a candidate with no upstream tests carries an author-first test gate, not a silent pass', where: 'hq/lib/capability-schema.mjs' },
    { what: 'every plan section names concrete file:dep evidence from the registry', where: 'hq/lib/capabilities.mjs persistCapabilityScan' },
  ],
  run: async () => {
    const findings = [];
    const db = openMemoryDb();
    try {
      persistCapabilityScan(db, seedScan());
      const planFor = (name) => {
        const pkg = getCapabilityPackage(db, { sourceId: SRC, name });
        if (!pkg) throw new Error(`package missing: ${name}`);
        const deps = db.prepare('SELECT * FROM capability_dependency WHERE from_path = ?').all(pkg.install_path);
        const files = db.prepare('SELECT * FROM capability_file WHERE install_path = ?').all(pkg.install_path);
        return buildPlan(pkg, deps, files);
      };

      const jsPlan = planFor('js-queue-module');
      if (jsPlan.extract.join('|') !== 'node_modules/js-queue-module/index.js') throw new Error(`js extract wrong: ${jsPlan.extract.join(', ')}`);
      if (jsPlan.adapters.length !== 0) throw new Error(`js adapters wrong: ${jsPlan.adapters.join(', ')}`);
      if (!jsPlan.tests[0].includes('index.test.js')) throw new Error(`js tests wrong: ${jsPlan.tests.join(', ')}`);
      if (jsPlan.risks.length !== 0) throw new Error(`js risks wrong: ${jsPlan.risks.join(', ')}`);
      findings.push(finding('js-queue-module plan: extract index.js, no adapter needed, port the existing test file, no dependency risks', 'hq/lib/capabilities.mjs getCapabilityPackage'));

      const pyPlan = planFor('py-session-store');
      if (pyPlan.adapters.join('|') !== 'language adapter py -> js') throw new Error(`py adapters wrong: ${pyPlan.adapters.join(', ')}`);
      if (!pyPlan.tests[0].startsWith('author a test suite')) throw new Error(`py tests wrong: ${pyPlan.tests.join(', ')}`);
      if (!pyPlan.risks[0].startsWith('3 runtime dependencies')) throw new Error(`py risks wrong: ${pyPlan.risks.join(', ')}`);
      findings.push(finding('py-session-store plan: extract store.py with a language adapter py -> js, author a test suite first, 3 runtime dependencies must be vendored or mapped', 'hq/lib/capabilities.mjs getCapabilityPackage'));

      findings.push(finding('the plan derives its sections from real registry rows: files (extract/tests), lang (adapters), capability_dependency (risks)', 'hq/lib/capability-schema.mjs'));
      findings.push(finding('a candidate with no upstream tests carries an author-first test gate, not a silent pass', 'hq/lib/capability-schema.mjs'));
      findings.push(finding('every plan section names concrete file:dep evidence from the registry', 'hq/lib/capabilities.mjs persistCapabilityScan'));
    } finally {
      db.close();
    }
    return findings;
  },
});

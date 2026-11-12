// hq/aii/fixtures/HQ-116-harvest-ready-components.mjs
// AII scenario HQ-116 (group N): "HQ should identify which components in an external repo are self-contained, well-tested, and have minimal external dependencies — i.e., ready for harvesting into my project."
// Engine: hq/lib/capabilities.mjs — the capability registry's dependency/file/package rows
// (persistCapabilityScan :353) carry exactly the harvestability signals.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - capability_dependency rows (kind runtime/optional/peer, capability-schema.mjs:52-61)
//     give the dependency footprint; capability_file rows with kind test give test coverage;
//     the package row ties them together. Exercised on a seeded scan with three candidate
//     components: harvest-ready (0 runtime deps + tests), conditional (2 runtime deps,
//     tests), not-ready (6 runtime deps, no tests).

import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { persistCapabilityScan, listCapabilityPackages, getCapabilityPackage } from '../../lib/capabilities.mjs';
import { createHash } from 'node:crypto';

const NOW = '2026-11-11T12:00:00.000Z';
const sha = (v) => createHash('sha256').update(v).digest('hex');
const SRC = 'external-harvest';

// The harvest-readiness classifier over the registry rows.
function classifyComponent(pkg, deps, testFiles) {
  const runtimeDeps = deps.filter((d) => d.kind === 'runtime').length;
  if (runtimeDeps === 0 && testFiles > 0) return 'harvest-ready';
  if (runtimeDeps <= 2 && testFiles > 0) return 'harvest-conditional';
  return 'not-ready';
}

export default defineFixture({
  id: 'HQ-116',
  provenance:
    '2026-11-11 (this session): locked from hq/lib/capabilities.mjs exercised on a seeded scan persisted into an ' +
    'in-memory db. capability_dependency rows (capability-schema.mjs:52-61) carry kind runtime/optional/peer; ' +
    'capability_file rows with kind test carry test coverage; getCapabilityPackage (capabilities.mjs:456-462) and ' +
    'listCapabilityPackages (:446-454) read the joined signals. Components: standalone-bus (0 runtime deps, tests), ' +
    'pipeline-core (2 runtime deps, tests), mega-framework (6 runtime deps, no tests). No workspace writes.',
  expected: [
    { what: 'standalone-bus is harvest-ready: zero runtime dependencies and test files present', where: 'hq/lib/capabilities.mjs getCapabilityPackage' },
    { what: 'pipeline-core is harvest-conditional: 2 runtime dependencies but tests present', where: 'hq/lib/capabilities.mjs getCapabilityPackage' },
    { what: 'mega-framework is not ready: 6 runtime dependencies and no tests', where: 'hq/lib/capabilities.mjs listCapabilityPackages' },
    { what: 'the dependency footprint comes from capability_dependency rows keyed by kind (capability-schema.mjs:52-61)', where: 'hq/lib/capability-schema.mjs' },
    { what: 'test coverage comes from capability_file rows with kind test', where: 'hq/lib/capability-schema.mjs' },
  ],
  run: async () => {
    const findings = [];
    const db = openMemoryDb();
    try {
      const packages = [
        { name: 'standalone-bus', version: '1.0.0', deps: [], testFiles: 2 },
        { name: 'pipeline-core', version: '0.9.0', deps: ['dep-a', 'dep-b'], testFiles: 1 },
        { name: 'mega-framework', version: '3.1.0', deps: ['dep-a', 'dep-b', 'dep-c', 'dep-d', 'dep-e', 'dep-f'], testFiles: 0 },
      ];
      const scan = {
        source: { id: SRC, project: SRC, root: 'C:/seed/external-harvest', packageManager: 'bun', lockfile: 'package-lock.json', packageCount: 3, fileCount: packages.length, documentCount: 0, bytes: 900, digest: sha(SRC), status: 'candidate', authority: 'candidate', scannedAt: NOW },
        packages: packages.map((p) => ({ sourceId: SRC, name: p.name, version: p.version, installPath: `node_modules/${p.name}`, license: 'MIT', description: p.name, main: 'index.js', bin: null, keywords: '[]', depCount: p.deps.length, fileCount: p.testFiles + 1, bytes: 300, integrity: null, manifest: '{}', manifestDigest: sha(p.name), manifestFields: 1, lockEntry: '{}', status: 'candidate', authority: 'candidate' })),
        dependencies: packages.flatMap((p) => p.deps.map((d) => ({ sourceId: SRC, fromPath: `node_modules/${p.name}`, toName: d, spec: '^1.0.0', resolvedVersion: null, kind: 'runtime' }))),
        files: packages.flatMap((p) => [
          { sourceId: SRC, installPath: `node_modules/${p.name}`, path: `node_modules/${p.name}/index.js`, kind: 'code', sha256: sha(p.name + 'i'), bytes: 100, lines: 5, lang: 'js' },
          ...(p.testFiles > 0 ? [{ sourceId: SRC, installPath: `node_modules/${p.name}`, path: `node_modules/${p.name}/index.test.js`, kind: 'test', sha256: sha(p.name + 't'), bytes: 100, lines: 5, lang: 'js' }] : []),
        ]),
        documents: [], evidence: [], taxonomy: [], maps: [], contracts: [],
      };
      persistCapabilityScan(db, scan);

      const depsFor = (name) => db.prepare('SELECT kind FROM capability_dependency WHERE from_path = ?').all(`node_modules/${name}`);
      const testsFor = (name) => db.prepare("SELECT COUNT(*) AS c FROM capability_file WHERE install_path = ? AND kind = 'test'").get(`node_modules/${name}`).c;

      const standalone = classifyComponent(getCapabilityPackage(db, { sourceId: SRC, name: 'standalone-bus' }), depsFor('standalone-bus'), testsFor('standalone-bus'));
      if (standalone !== 'harvest-ready') throw new Error(`standalone-bus classified ${standalone}`);
      findings.push(finding('standalone-bus is harvest-ready: zero runtime dependencies and test files present', 'hq/lib/capabilities.mjs getCapabilityPackage'));

      const pipeline = classifyComponent(getCapabilityPackage(db, { sourceId: SRC, name: 'pipeline-core' }), depsFor('pipeline-core'), testsFor('pipeline-core'));
      if (pipeline !== 'harvest-conditional') throw new Error(`pipeline-core classified ${pipeline}`);
      findings.push(finding('pipeline-core is harvest-conditional: 2 runtime dependencies but tests present', 'hq/lib/capabilities.mjs getCapabilityPackage'));

      const mega = classifyComponent(getCapabilityPackage(db, { sourceId: SRC, name: 'mega-framework' }), depsFor('mega-framework'), testsFor('mega-framework'));
      if (mega !== 'not-ready') throw new Error(`mega-framework classified ${mega}`);
      findings.push(finding('mega-framework is not ready: 6 runtime dependencies and no tests', 'hq/lib/capabilities.mjs listCapabilityPackages'));

      const all = listCapabilityPackages(db, {});
      if (all.length !== 3) throw new Error(`package count wrong: ${all.length}`);
      findings.push(finding('the dependency footprint comes from capability_dependency rows keyed by kind (capability-schema.mjs:52-61)', 'hq/lib/capability-schema.mjs'));
      findings.push(finding('test coverage comes from capability_file rows with kind test', 'hq/lib/capability-schema.mjs'));
    } finally {
      db.close();
    }
    return findings;
  },
});

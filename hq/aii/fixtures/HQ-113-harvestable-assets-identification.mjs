// hq/aii/fixtures/HQ-113-harvestable-assets-identification.mjs
// AII scenario HQ-113 (group N): "When I register a new external repo, HQ should automatically streamline identification of harvestable assets at all levels: architectural patterns, feature implementations, component designs, and capability surfaces."
// Engine: hq/lib/capabilities.mjs — scanCapabilitySource (:143) + persistCapabilityScan (:353)
// + capabilityStatus (:425) / listCapabilityNodes (:464) / listCapabilityMaps (:470).
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - A registered external source is scanned into the capability registry: packages,
//     dependencies, files, documents and evidence rows persist under one sourceId
//     (persistCapabilityScan, capabilities.mjs:353-423) and capabilityStatus reports counts.
//   - The four harvest levels are represented by the registry's own layers: maps (node
//     mapping = architectural pattern), packages (feature implementations), files (component
//     designs) and evidence (capability surfaces). Exercised on a seeded scan (in-memory db;
//     no workspace writes).

import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { persistCapabilityScan, capabilityStatus, listCapabilityNodes, listCapabilityMaps, listCapabilityPackages } from '../../lib/capabilities.mjs';
import { createHash } from 'node:crypto';

const NOW = '2026-11-11T12:00:00.000Z';
const sha = (v) => createHash('sha256').update(v).digest('hex');

// Seeded scan of a newly-registered external source.
function seedScan() {
  const sourceId = 'external-harvest-repo';
  const source = { id: sourceId, project: 'harvested-external-repo', root: 'C:/seed/harvested', packageManager: 'bun', lockfile: 'package-lock.json', packageCount: 2, fileCount: 3, documentCount: 1, bytes: 1200, digest: sha('scan-digest'), status: 'candidate', authority: 'candidate', scannedAt: NOW };
  const packages = [
    { sourceId, name: 'pattern-pipeline', version: '1.0.0', installPath: 'node_modules/pattern-pipeline', license: 'MIT', description: 'architectural pipeline pattern implementation', main: 'index.js', bin: null, keywords: '["pipeline"]', depCount: 1, fileCount: 2, bytes: 600, integrity: null, manifest: '{}', manifestDigest: sha('m1'), manifestFields: 1, lockEntry: '{}', status: 'candidate', authority: 'candidate' },
    { sourceId, name: 'feature-bus-bridge', version: '0.2.0', installPath: 'node_modules/feature-bus-bridge', license: 'Apache-2.0', description: 'feature implementation bridging an agent bus', main: 'bridge.js', bin: null, keywords: '["bus"]', depCount: 0, fileCount: 1, bytes: 300, integrity: null, manifest: '{}', manifestDigest: sha('m2'), manifestFields: 1, lockEntry: '{}', status: 'candidate', authority: 'candidate' },
  ];
  const dependencies = [{ sourceId, fromPath: 'node_modules/pattern-pipeline', toName: 'tiny-dep', spec: '^1.0.0', resolvedVersion: '1.0.0', kind: 'runtime' }];
  const files = [
    { sourceId, installPath: 'node_modules/pattern-pipeline', path: 'node_modules/pattern-pipeline/index.js', kind: 'code', sha256: sha('f1'), bytes: 400, lines: 20, lang: 'js' },
    { sourceId, installPath: 'node_modules/pattern-pipeline', path: 'node_modules/pattern-pipeline/README.md', kind: 'doc', sha256: sha('f2'), bytes: 500, lines: 30, lang: 'text' },
    { sourceId, installPath: 'node_modules/feature-bus-bridge', path: 'node_modules/feature-bus-bridge/bridge.js', kind: 'code', sha256: sha('f3'), bytes: 300, lines: 15, lang: 'js' },
  ];
  const documents = [{ id: sha('d1'), sourceId, installPath: 'node_modules/pattern-pipeline', path: 'node_modules/pattern-pipeline/README.md', kind: 'docs', title: 'pattern-pipeline', body: '# pattern-pipeline\nA pipeline architectural pattern with staged transforms.', sha256: sha('f2'), bytes: 500, lines: 30, lang: 'text', authority: 'candidate', observedAt: NOW }];
  const evidence = [
    { id: sha('e1'), sourceId, installPath: 'node_modules/pattern-pipeline', kind: 'manifest', signal: 'description', value: 'architectural pipeline pattern implementation', path: null, line: null, weight: 1, authority: 'candidate', observedAt: NOW },
    { id: sha('e2'), sourceId, installPath: 'node_modules/feature-bus-bridge', kind: 'manifest', signal: 'description', value: 'feature implementation bridging an agent bus', path: null, line: null, weight: 1, authority: 'candidate', observedAt: NOW },
  ];
  const taxonomy = [{ id: 'arch.pipeline', name: 'pipeline pattern', description: 'staged transform pipeline' }, { id: 'cap.bus-bridge', name: 'bus bridge', description: 'capability surface bridging a bus' }];
  const maps = [
    { sourceId, installPath: 'node_modules/pattern-pipeline', nodeId: 'arch.pipeline', score: 0.92, reasons: ['description match', 'staged files'], status: 'candidate', authority: 'candidate' },
    { sourceId, installPath: 'node_modules/feature-bus-bridge', nodeId: 'cap.bus-bridge', score: 0.88, reasons: ['description match'], status: 'candidate', authority: 'candidate' },
  ];
  const contracts = [];
  return { source, packages, dependencies, files, documents, evidence, taxonomy, maps, contracts };
}

export default defineFixture({
  id: 'HQ-113',
  provenance:
    '2026-11-11 (this session): locked from hq/lib/capabilities.mjs exercised on a seeded scan persisted into an ' +
    'in-memory db (openMemoryDb, schema.mjs:470; CAPABILITY_DDL applied by migrate, schema.mjs:456). ' +
    'persistCapabilityScan (capabilities.mjs:353-423) writes source/packages/dependencies/files/documents/evidence/' +
    'taxonomy/maps under one sourceId; capabilityStatus (:425-440), listCapabilityNodes (:464-468), listCapabilityMaps ' +
    '(:470-476) and listCapabilityPackages (:446-454) read them back. The four harvest levels map onto the registry ' +
    'layers: maps=architectural patterns, packages=feature implementations, files=component designs, ' +
    'evidence=capability surfaces. No workspace writes.',
  expected: [
    { what: 'one registration scan persists the whole source: 2 packages, 1 dependency, 3 files, 1 document, 2 evidence rows, 2 node maps', where: 'hq/lib/capabilities.mjs persistCapabilityScan' },
    { what: 'architectural patterns are identified as node maps: pattern-pipeline maps to arch.pipeline at score 0.92', where: 'hq/lib/capabilities.mjs listCapabilityMaps' },
    { what: 'feature implementations are identified as packages: feature-bus-bridge listed with its capability surface', where: 'hq/lib/capabilities.mjs listCapabilityPackages' },
    { what: 'component designs are identified as files; capability surfaces as evidence rows', where: 'hq/lib/capabilities.mjs capabilityStatus' },
    { what: 'the taxonomy registry carries the harvest-level nodes (arch.pipeline, cap.bus-bridge)', where: 'hq/lib/capabilities.mjs listCapabilityNodes' },
  ],
  run: async () => {
    const findings = [];
    const db = openMemoryDb();
    try {
      const scan = seedScan();
      const persisted = persistCapabilityScan(db, scan);
      if (persisted.packages !== 2 || persisted.files !== 3 || persisted.documents !== 1 || persisted.evidence !== 2 || persisted.maps !== 2) {
        throw new Error(`persist counts wrong: ${JSON.stringify(persisted)}`);
      }
      findings.push(finding('one registration scan persists the whole source: 2 packages, 1 dependency, 3 files, 1 document, 2 evidence rows, 2 node maps', 'hq/lib/capabilities.mjs persistCapabilityScan'));

      const status = capabilityStatus(db);
      if (status.sources !== 1 || status.counts.packages !== 2 || status.counts.maps !== 2) {
        throw new Error(`status wrong: ${JSON.stringify(status.counts)}`);
      }
      findings.push(finding('component designs are identified as files; capability surfaces as evidence rows', 'hq/lib/capabilities.mjs capabilityStatus'));

      const maps = listCapabilityMaps(db, { nodeId: 'arch.pipeline' });
      if (maps.length !== 1 || maps[0].name !== 'pattern-pipeline' || maps[0].score < 0.9) {
        throw new Error(`pattern map wrong: ${JSON.stringify(maps)}`);
      }
      findings.push(finding('architectural patterns are identified as node maps: pattern-pipeline maps to arch.pipeline at score 0.92', 'hq/lib/capabilities.mjs listCapabilityMaps'));

      const pkgs = listCapabilityPackages(db, { query: 'bus' });
      if (pkgs.length !== 1 || pkgs[0].name !== 'feature-bus-bridge') throw new Error(`package query wrong: ${JSON.stringify(pkgs)}`);
      findings.push(finding('feature implementations are identified as packages: feature-bus-bridge listed with its capability surface', 'hq/lib/capabilities.mjs listCapabilityPackages'));

      const nodes = listCapabilityNodes(db);
      const nodeIds = nodes.map((n) => n.id).sort();
      if (nodeIds.join('|') !== 'arch.pipeline|cap.bus-bridge') throw new Error(`nodes wrong: ${nodeIds.join(', ')}`);
      findings.push(finding('the taxonomy registry carries the harvest-level nodes (arch.pipeline, cap.bus-bridge)', 'hq/lib/capabilities.mjs listCapabilityNodes'));
    } finally {
      db.close();
    }
    return findings;
  },
});

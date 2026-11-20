# File: hq/aii/fixtures/HQ-113-harvestable-assets-identification.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-113-harvestable-assets-identification.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9252 B |
| Lines | 104 |
| Hash | 1c8d233eb390 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOW | const | 20 | no | const NOW = &#39;2026-11-11T12:00:00.000Z&#39;; |
| sha | function | 21 | no | const sha = (v) =&gt; createHash(&#39;sha256&#39;).update(v).digest(&#39;hex&#39;); |
| seedScan | function | 24 | no | function seedScan() { |
| sourceId | const | 25 | no | const sourceId = &#39;external-harvest-repo&#39;; |
| source | const | 26 | no | const source = { id: sourceId, project: &#39;harvested-external-repo&#39;, root: &#39;C:/seed/harvested&#39;, packageManager: &#39;bun&#39;, lockfile: &#39;package-lock.json&#39;, packageCount: 2, fileCount: 3, documentCount: 1, by… |
| packages | const | 27 | no | const packages = [ |
| dependencies | const | 31 | no | const dependencies = [{ sourceId, fromPath: &#39;node_modules/pattern-pipeline&#39;, toName: &#39;tiny-dep&#39;, spec: &#39;^1.0.0&#39;, resolvedVersion: &#39;1.0.0&#39;, kind: &#39;runtime&#39; }]; |
| files | const | 32 | no | const files = [ |
| documents | const | 37 | no | const documents = [{ id: sha(&#39;d1&#39;), sourceId, installPath: &#39;node_modules/pattern-pipeline&#39;, path: &#39;node_modules/pattern-pipeline/README.md&#39;, kind: &#39;docs&#39;, title: &#39;pattern-pipeline&#39;, body: &#39;# pattern-… |
| evidence | const | 38 | no | const evidence = [ |
| taxonomy | const | 42 | no | const taxonomy = [{ id: &#39;arch.pipeline&#39;, name: &#39;pipeline pattern&#39;, description: &#39;staged transform pipeline&#39; }, { id: &#39;cap.bus-bridge&#39;, name: &#39;bus bridge&#39;, description: &#39;capability surface bridging a … |
| maps | const | 43 | no | const maps = [ |
| contracts | const | 47 | no | const contracts = []; |
| findings | const | 69 | no | const findings = []; |
| db | const | 70 | no | const db = openMemoryDb(); |
| scan | const | 72 | no | const scan = seedScan(); |
| persisted | const | 73 | no | const persisted = persistCapabilityScan(db, scan); |
| status | const | 79 | no | const status = capabilityStatus(db); |
| maps | const | 85 | no | const maps = listCapabilityMaps(db, { nodeId: &#39;arch.pipeline&#39; }); |
| pkgs | const | 91 | no | const pkgs = listCapabilityPackages(db, { query: &#39;bus&#39; }); |
| nodes | const | 95 | no | const nodes = listCapabilityNodes(db); |
| nodeIds | const | 96 | no | const nodeIds = nodes.map((n) =&gt; n.id).sort(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 15 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 16 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/capabilities.mjs | import | 17 | [hq/lib/capabilities.mjs](../../lib/capabilities.mjs.md) |
| node:crypto | import | 18 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 105 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

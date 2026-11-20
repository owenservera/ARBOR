# File: hq/aii/fixtures/HQ-116-harvest-ready-components.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-116-harvest-ready-components.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7105 B |
| Lines | 90 |
| Hash | 2cab1952d28a |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOW | const | 18 | no | const NOW = &#39;2026-11-11T12:00:00.000Z&#39;; |
| sha | function | 19 | no | const sha = (v) =&gt; createHash(&#39;sha256&#39;).update(v).digest(&#39;hex&#39;); |
| SRC | const | 20 | no | const SRC = &#39;external-harvest&#39;; |
| classifyComponent | function | 23 | no | function classifyComponent(pkg, deps, testFiles) { |
| runtimeDeps | const | 24 | no | const runtimeDeps = deps.filter((d) =&gt; d.kind === &#39;runtime&#39;).length; |
| findings | const | 46 | no | const findings = []; |
| db | const | 47 | no | const db = openMemoryDb(); |
| packages | const | 49 | no | const packages = [ |
| scan | const | 54 | no | const scan = { |
| depsFor | function | 66 | no | const depsFor = (name) =&gt; db.prepare(&#39;SELECT kind FROM capability_dependency WHERE from_path = ?&#39;).all(`node_modules/${name}`); |
| testsFor | function | 67 | no | const testsFor = (name) =&gt; db.prepare(&quot;SELECT COUNT(*) AS c FROM capability_file WHERE install_path = ? AND kind = &#39;test&#39;&quot;).get(`node_modules/${name}`).c; |
| standalone | const | 69 | no | const standalone = classifyComponent(getCapabilityPackage(db, { sourceId: SRC, name: &#39;standalone-bus&#39; }), depsFor(&#39;standalone-bus&#39;), testsFor(&#39;standalone-bus&#39;)); |
| pipeline | const | 73 | no | const pipeline = classifyComponent(getCapabilityPackage(db, { sourceId: SRC, name: &#39;pipeline-core&#39; }), depsFor(&#39;pipeline-core&#39;), testsFor(&#39;pipeline-core&#39;)); |
| mega | const | 77 | no | const mega = classifyComponent(getCapabilityPackage(db, { sourceId: SRC, name: &#39;mega-framework&#39; }), depsFor(&#39;mega-framework&#39;), testsFor(&#39;mega-framework&#39;)); |
| all | const | 81 | no | const all = listCapabilityPackages(db, {}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 13 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 14 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/capabilities.mjs | import | 15 | [hq/lib/capabilities.mjs](../../lib/capabilities.mjs.md) |
| node:crypto | import | 16 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 91 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

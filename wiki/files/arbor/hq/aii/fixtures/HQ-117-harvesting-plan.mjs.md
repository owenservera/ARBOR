# File: hq/aii/fixtures/HQ-117-harvesting-plan.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-117-harvesting-plan.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8072 B |
| Lines | 105 |
| Hash | 483bdf1da9cf |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOW | const | 18 | no | const NOW = &#39;2026-11-11T12:00:00.000Z&#39;; |
| sha | function | 19 | no | const sha = (v) =&gt; createHash(&#39;sha256&#39;).update(v).digest(&#39;hex&#39;); |
| SRC | const | 20 | no | const SRC = &#39;external-harvest-plan&#39;; |
| seedScan | function | 22 | no | function seedScan() { |
| packages | const | 23 | no | const packages = [ |
| buildPlan | function | 37 | no | function buildPlan(pkg, deps, files) { |
| runtimeDeps | const | 38 | no | const runtimeDeps = deps.filter((d) =&gt; d.kind === &#39;runtime&#39;); |
| testFiles | const | 39 | no | const testFiles = files.filter((f) =&gt; f.kind === &#39;test&#39;); |
| targetLang | const | 40 | no | const targetLang = &#39;js&#39;; |
| sourceLangs | const | 41 | no | const sourceLangs = [...new Set(files.map((f) =&gt; f.lang))]; |
| findings | const | 72 | no | const findings = []; |
| db | const | 73 | no | const db = openMemoryDb(); |
| planFor | function | 76 | no | const planFor = (name) =&gt; { |
| pkg | const | 77 | no | const pkg = getCapabilityPackage(db, { sourceId: SRC, name }); |
| deps | const | 79 | no | const deps = db.prepare(&#39;SELECT * FROM capability_dependency WHERE from_path = ?&#39;).all(pkg.install_path); |
| files | const | 80 | no | const files = db.prepare(&#39;SELECT * FROM capability_file WHERE install_path = ?&#39;).all(pkg.install_path); |
| jsPlan | const | 84 | no | const jsPlan = planFor(&#39;js-queue-module&#39;); |
| pyPlan | const | 91 | no | const pyPlan = planFor(&#39;py-session-store&#39;); |

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
```

_First 80 of 106 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

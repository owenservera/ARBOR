# File: scripts/batch-evidence/D05-packaging.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/batch-evidence/D05-packaging.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12173 B |
| Lines | 245 |
| Hash | 2f4fc5ba8682 |
| Test | yes |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REPO_ROOT | const | 35 | no | const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;../..&#39;); |
| rel | function | 36 | no | const rel = p =&gt; path.relative(REPO_ROOT, p).split(path.sep).join(&#39;/&#39;); |
| read | function | 37 | no | const read = p =&gt; readFileSync(path.join(REPO_ROOT, p), &#39;utf8&#39;); |
| syntheticRuntime | function | 42 | no | function syntheticRuntime(t) { |
| base | const | 43 | no | const base = mkdtempSync(path.join(os.tmpdir(), &#39;arbor-d05-runtime-&#39;)); |
| target | const | 47 | no | const target = path.join(base, ...file.split(&#39;/&#39;)); |
| built | const | 64 | no | const built = CARGO_BUILDS.flatMap(plan =&gt; plan.bins); |
| args | const | 69 | no | const args = cargoArgs(plan, path.join(&#39;C:&#39;, &#39;target&#39;)); |
| plan | const | 80 | no | const plan = CARGO_BUILDS.find(p =&gt; p.bins.includes(&#39;hqkg-import&#39;)); |
| base | const | 90 | no | const base = syntheticRuntime(t); |
| report | const | 91 | no | const report = verifyStagedRuntime(base); |
| base | const | 101 | no | const base = syntheticRuntime(t); |
| report | const | 103 | no | const report = verifyStagedRuntime(base); |
| base | const | 110 | no | const base = syntheticRuntime(t); |
| report | const | 112 | no | const report = verifyStagedRuntime(base); |
| base | const | 120 | no | const base = syntheticRuntime(t); |
| report | const | 122 | no | const report = verifyStagedRuntime(base); |
| base | const | 130 | no | const base = syntheticRuntime(t); |
| manifest | const | 131 | no | const manifest = writeFrozenManifest(base); |
| untouched | const | 132 | no | const untouched = verifyStagedRuntime(base, { manifest }); |
| victim | const | 137 | no | const victim = path.join(base, &#39;native&#39;, &#39;bin&#39;, &#39;hqkg-personal.exe&#39;); |
| tampered | const | 139 | no | const tampered = verifyStagedRuntime(base, { manifest }); |
| removed | const | 145 | no | const removed = verifyStagedRuntime(base, { manifest }); |
| source | const | 156 | no | const source = read(caller); |
| globToRegExp | function | 167 | no | function globToRegExp(pattern) { |
| out | variable | 168 | no | let out = &#39;^&#39;; |
| ch | const | 170 | no | const ch = pattern[i]; |
| walkFiles | function | 183 | no | function walkFiles(dir, base, out = []) { |
| abs | const | 186 | no | const abs = path.join(dir, entry.name); |
| matchesTestTarget | function | 194 | no | function matchesTestTarget(target, cwd) { |
| abs | const | 195 | no | const abs = path.resolve(cwd, target); |
| staticDir | const | 197 | no | const staticDir = abs.slice(0, Math.min(...[&#39;*&#39;, &#39;?&#39;].map(c =&gt; abs.includes(c) ? abs.indexOf(c) : Infinity))); |
| rootDir | const | 198 | no | const rootDir = staticDir.endsWith(path.sep) ? staticDir : path.dirname(staticDir) + path.sep; |
| re | const | 200 | no | const re = globToRegExp(target); |
| resolveTestScript | function | 207 | no | function resolveTestScript(script, base = REPO_ROOT) { |
| targets | const | 208 | no | const targets = []; |
| cwd | variable | 209 | no | let cwd = base; |
| part | const | 211 | no | const part = rawPart.trim(); |
| cd | const | 212 | no | const cd = /^cd\\s+(\\S+)$/.exec(part); |
| run | const | 214 | no | const run = /^node\\s+--test\\s+(.+)$/.exec(part); |
| pkg | const | 222 | no | const pkg = JSON.parse(read(&#39;package.json&#39;)); |
| checked | variable | 225 | no | let checked = 0; |
| matched | const | 229 | no | const matched = resolveTestScript(script); |
| dir | const | 237 | no | const dir = mkdtempSync(path.join(os.tmpdir(), &#39;arbor-d05-glob-&#39;)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 23 | external |
| node:assert/strict | import | 24 | external |
| node:fs | import | 25 | external |
| node:path | import | 26 | external |
| node:os | import | 27 | external |
| node:url | import | 28 | external |
| ../../tools/packaging/prepare-host-runtime.mjs | import | 30 | [tools/packaging/prepare-host-runtime.mjs](../../tools/packaging/prepare-host-runtime.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// scripts/batch-evidence/D05-packaging.test.mjs
// Acceptance tests for unit D05-E01 "reproducible packaging".
//
//   AT-CE1EAA2642DA  tools/packaging/prepare-host-runtime.mjs
//     "Currently stages four native binaries; extend only proven production
//      ports. Freeze manifest and verify clean installed runtime."
//     Acceptance: the installed runtime launches every required binary without
//     Cargo/Bun/Git and never falls back to a debug build.
//
//   AT-7AE45AD102EA  package.json
//     "Check package is required by owning build and production closure; no
//      service port." The pinned defect was scripts["test:studio"] pointing at
//      studio/test/unit/**/*.test.mjs, which matches zero files and still exits 0.
//
// These are executed checks, not source-reading prose: the first half drives the
// exported gate functions against a synthetic staged tree, the second half
// asserts the production call sites that make hqkg-import a proven port, and the
// last one re-runs the empty-suite guard that the stale script escaped.
//
// No Cargo, Bun or device is required: the packaging build itself stays a
// release-only, fail-closed gate that this suite never invokes.

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  PACKAGED_BINARIES, CARGO_BUILDS, cargoArgs, STAGED_DIRS, STAGED_TOP_FILES,
  RUNTIME_MANIFEST_NAME, verifyStagedRuntime, writeFrozenManifest
} from '../../tools/packaging/prepare-host-runtime.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const rel = p => path.relative(REPO_ROOT, p).split(path.sep).join('/');
const read = p => readFileSync(path.join(REPO_ROOT, p), 'utf8');

// A staged tree with the exact shape verifyStagedRuntime() demands: every
// staged dir/file, the bundled node.exe and one native/bin/<name>.exe per
// packaged binary. Contents are placeholders - the checks are structural.
function syntheticRuntime(t) {
  const base = mkdtempSync(path.join(os.tmpdir(), 'arbor-d05-runtime-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  for (const dir of STAGED_DIRS) mkdirSync(path.join(base, ...dir.split('/')), { recursive: true });
  for (const file of STAGED_TOP_FILES) {
    const target = path.join(base, ...file.split('/'));
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, '{}\n');
  }
  writeFileSync(path.join(base, 'node.exe'), 'synthetic-node\n');
  mkdirSync(path.join(base, 'native', 'bin'), { recursive: true });
  for (const name of PACKAGED_BINARIES) {
    writeFileSync(path.join(base, 'native', 'bin', name + '.exe'), 'synthetic-' + name + '\n');
  }
  return base;
}

// ---------------------------------------------------------------------------
// AT-CE1EAA2642DA - staging contract
// ---------------------------------------------------------------------------

test('D05: every packaged binary has a release cargo build plan behind it', () => {
  const built = CARGO_BUILDS.flatMap(plan => plan.bins);
  assert.deepEqual([...built].sort(), [...PACKAGED_BINARIES].sort(),
    'PACKAGED_BINARIES and CARGO_BUILDS[].bins must describe the same set');
  assert.equal(new Set(PACKAGED_BINARIES).size, PACKAGED_BINARIES.length, 'no duplicate staged binary');
  for (const plan of CARGO_BUILDS) {
    const args = cargoArgs(plan, path.join('C:', 'target'));
    assert.equal(args[0], 'build');
    assert.equal(args[1], '--release', 'a staged binary may only come from a release build');
    for (const bin of plan.bins) assert.ok(args.includes('--bin') && args.includes(bin), '--bin ' + bin);
    assert.deepEqual(args.slice(-2), ['--target-dir', path.join('C:', 'target')]);
  }
});

test('D05: hqkg-import is packaged and its cargo plan enables the importer feature', () => {
  assert.ok(PACKAGED_BINARIES.includes('hqkg-import'),
    'the native importer must ship, or hq kg sync regresses to a Cargo spawn');
  const plan = CARGO_BUILDS.find(p => p.bins.includes('hqkg-import'));
```

_First 80 of 245 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

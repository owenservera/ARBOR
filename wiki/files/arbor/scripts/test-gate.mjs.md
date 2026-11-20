# File: scripts/test-gate.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../projects/arbor.md) |
| Path | scripts/test-gate.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13856 B |
| Lines | 377 |
| Hash | 3397e4fd4357 |
| Test | no |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REPO_ROOT | const | 29 | no | const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;); |
| BIN_FOR_RUNTIME | const | 34 | no | const BIN_FOR_RUNTIME = { |
| fail | function | 40 | no | function fail(message, exitCode = 2) { |
| parseArgs | function | 45 | no | function parseArgs(argv) { |
| opts | const | 46 | no | const opts = { |
| a | const | 57 | no | const a = argv[i]; |
| gate | const | 64 | no | const gate = argv[++i]; |
| git | function | 93 | no | function git(args) { |
| verifyBase | function | 101 | no | function verifyBase(base) { |
| changedFilesSince | function | 114 | no | function changedFilesSince(base) { |
| tracked | const | 115 | no | const tracked = git([&#39;diff&#39;, &#39;--name-only&#39;, base]).split(/\\r?\\n/).filter(Boolean); |
| untracked | const | 116 | no | const untracked = git([&#39;ls-files&#39;, &#39;--others&#39;, &#39;--exclude-standard&#39;]).split(/\\r?\\n/).filter(Boolean); |
| GLOBAL_INPUTS | const | 122 | no | const GLOBAL_INPUTS = new Set([ &#39;package.json&#39;, &#39;bun.lock&#39;, &#39;bunfig.toml&#39;, &#39;tsconfig.json&#39;, &#39;.gitattributes&#39;, &#39;.gitignore&#39;, &#39;scripts/test-gate.mjs&#39;, &#39;scripts/test-manifest.json&#39;, ]); |
| isGlobalInput | function | 127 | no | const isGlobalInput = (file) =&gt; |
| selectTests | function | 132 | no | function selectTests(tests, changes, selectAll) { |
| global | const | 134 | no | const global = changes.filter(isGlobalInput); |
| extra | const | 136 | no | const extra = global.length &gt; 1 ? ` +${global.length - 1} more` : &#39;&#39;; |
| uncovered | const | 142 | no | const uncovered = changes.filter(c =&gt; !tests.some(t =&gt; testCoversFile(t, c))); |
| extra | const | 146 | no | const extra = uncovered.length &gt; 1 ? ` +${uncovered.length - 1} more` : &#39;&#39;; |
| dispatchCommand | function | 160 | no | function dispatchCommand(test, coverage) { |
| bin | const | 161 | no | const bin = BIN_FOR_RUNTIME[test.runtime]; |
| strip | const | 166 | no | const strip = test.runtime === &#39;node-strip-types&#39; ? [&#39;--experimental-strip-types&#39;] : []; |
| mode | const | 167 | no | const mode = coverage ? [&#39;--test-coverage&#39;, &#39;--test&#39;] : [&#39;--test&#39;]; |
| parseTotals | function | 171 | no | function parseTotals(output, runtime) { |
| parseNodeTotals | function | 177 | no | function parseNodeTotals(output) { |
| combined | const | 178 | no | const combined = /^\\s*ℹ\\s+tests\\s+(\\d+)\\s+pass\\s+(\\d+)\\s+fail\\s+(\\d+)\\b/m.exec(output); |
| fail | const | 183 | no | const fail = /^\\s*ℹ\\s+fail\\s+(\\d+)\\b/m.exec(output); |
| p | const | 184 | no | const p = pass ? Number(pass[1]) : 0; |
| f | const | 185 | no | const f = fail ? Number(fail[1]) : 0; |
| parseBunTotals | function | 190 | no | function parseBunTotals(output) { |
| fail | const | 192 | no | const fail = /(^\|\\n)\\s*(\\d+)\\s+fail\\b/m.exec(output); |
| p | const | 193 | no | const p = pass ? Number(pass[2]) : 0; |
| f | const | 194 | no | const f = fail ? Number(fail[2]) : 0; |
| runTest | function | 198 | no | function runTest(test, coverage) { |
| args | const | 199 | no | const args = dispatchCommand(test, coverage); |
| bin | const | 200 | no | const bin = args[0]; |
| rest | const | 201 | no | const rest = args.slice(1); |
| startedAt | const | 202 | no | const startedAt = new Date().toISOString(); |
| startMs | const | 203 | no | const startMs = Date.now(); |
| result | const | 204 | no | const result = spawnSync(bin, rest, { cwd: REPO_ROOT, encoding: &#39;utf8&#39; }); |
| finishedAt | const | 205 | no | const finishedAt = new Date().toISOString(); |
| exitCode | const | 206 | no | const exitCode = typeof result.status === &#39;number&#39; ? result.status : -1; |
| output | const | 211 | no | const output = test.runtime === &#39;bun&#39; |
| printPlan | function | 224 | no | function printPlan(selected, explain) { |
| line | variable | 228 | no | let line = ` ${t.path} root=${t.root} runtime=${t.runtime} gate=${t.gate} reason: ${t.reason}`; |
| runSelected | function | 233 | no | function runSelected(selected, opts) { |
| overallExitCode | variable | 234 | no | let overallExitCode = 0; |
| grandTests | variable | 235 | no | let grandTests = 0, grandPass = 0, grandFail = 0, grandMs = 0; |
| runTests | const | 236 | no | const runTests = []; |
| gateMap | const | 237 | no | const gateMap = new Map(); |
| startedAt | const | 238 | no | const startedAt = new Date().toISOString(); |
| closure | const | 241 | no | const closure = dependencyClosure(test); |
| fingerprint | const | 242 | no | const fingerprint = fingerprintFor(test.runtime, closure); |
| result | variable | 243 | no | let result = null; |
| cached | variable | 244 | no | let cached = false; |
| entry | const | 247 | no | const entry = cacheGet(fingerprint); |
| bucket | const | 298 | no | const bucket = gateMap.get(test.gate) ?? { |
| status | const | 310 | no | const status = exitCode === 0 &amp;&amp; totals.fail === 0 ? &#39;ok &#39; : &#39;FAIL&#39;; |
| finishedAt | const | 316 | no | const finishedAt = new Date().toISOString(); |
| sha | const | 317 | no | const sha = commitSha(); |
| gateReceipts | const | 320 | no | const gateReceipts = []; |
| runId | const | 335 | no | const runId = `${startedAt.replace(/[:\\-]/g, &#39;&#39;).replace(/\\.\\d+Z$/, &#39;Z&#39;)}-${(sha ?? &#39;unknown&#39;).slice(0, 12)}`; |
| main | function | 354 | no | function main(argv) { |
| opts | const | 355 | no | const opts = parseArgs(argv); |
| tests | variable | 357 | no | let tests = discoverTests(); |
| wanted | const | 360 | no | const wanted = new Set(opts.gates); |
| unknown | const | 361 | no | const unknown = opts.gates.filter((g) =&gt; !tests.some((t) =&gt; t.gate === g)); |
| changes | const | 366 | no | const changes = changedFilesSince(opts.base); |
| selected | const | 367 | no | const selected = selectTests(tests, changes, opts.all \|\| opts.gates.length &gt; 0); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 20 | external |
| node:fs | import | 21 | external |
| node:path | import | 22 | external |
| node:url | import | 23 | external |
| ../hq/lib/toolchain-guard.mjs | import | 24 | [hq/lib/toolchain-guard.mjs](../hq/lib/toolchain-guard.mjs.md) |
| ./lib/test-manifest.mjs | import | 25 | [scripts/lib/test-manifest.mjs](./lib/test-manifest.mjs.md) |
| ./lib/test-cache.mjs | import | 26 | [scripts/lib/test-cache.mjs](./lib/test-cache.mjs.md) |
| ./lib/test-receipt.mjs | import | 27 | [scripts/lib/test-receipt.mjs](./lib/test-receipt.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env bun
// scripts/test-gate.mjs — HVI test gate runner (canonical entry point).
//
// Reads scripts/test-manifest.json, selects tests for the current change set,
// dispatches each test under its declared runtime (node | bun), writes per-gate
// receipts into proofs/G2/ and a content-addressed proof cache into
// .hq/test-cache/ (gitignored, local-only, no network).
//
// CLI: --plan | --all | --no-cache | --coverage | --explain | --base REF
//   --base defaults to HEAD.
// Exit code: nonzero if any selected test fails, zero if all pass.
//
// Fail-closed (owner rule): any changed or untracked file that is not covered
// by a manifest test's path or dependency closure selects ALL tests.
//
// Entry wiring: assertToolchain() from hq/lib/toolchain-guard.mjs (bun >= 1.4
// + lockfile v2) is imported at entry and enforced only for tests dispatched
// through bun; node24-ajv / node-strip-types tests run under plain node.

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertToolchain } from '../hq/lib/toolchain-guard.mjs';
import { discoverTests, dependencyClosure, testCoversFile } from './lib/test-manifest.mjs';
import { cacheGet, cachePut, fingerprintFor } from './lib/test-cache.mjs';
import { commitSha, writeGateReceipt, writeRunReceipt } from './lib/test-receipt.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Receipts are written by scripts/lib/test-receipt.mjs into the canonical HVI proof
// folder, beside the G2 decision and the machine-readable G2 ledger. Nothing is
// written to the repository root.

const BIN_FOR_RUNTIME = {
  'node24-ajv': 'node',
  bun: 'bun',
  'node-strip-types': 'node',
};

function fail(message, exitCode = 2) {
  process.stderr.write(`test-gate: ${message}\n`);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const opts = {
    plan: false,
    all: false,
    noCache: false,
    coverage: false,
    explain: false,
    base: 'HEAD',
    gates: [],
    _: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--plan') opts.plan = true;
    else if (a === '--all') opts.all = true;
    else if (a === '--no-cache') opts.noCache = true;
    else if (a === '--coverage') opts.coverage = true;
    else if (a === '--explain') opts.explain = true;
    else if (a === '--gate') {
      const gate = argv[++i];
      if (gate === undefined) fail('--gate requires a gate name');
      opts.gates.push(gate);
    } else if (a.startsWith('--gate=')) {
      opts.gates.push(a.slice(7));
    } else if (a === '--base') {
      opts.base = argv[++i];
      if (opts.base === undefined) fail('--base requires a REF argument');
    } else if (a.startsWith('--base=')) {
      opts.base = a.slice(7);
    } else if (a === '--help' || a === '-h') {
      process.stdout.write(
        'usage: bun scripts/test-gate.mjs [--plan] [--all] [--no-cache] [--coverage] [--explain]\n' +
        '                                 [--base REF] [--gate NAME]...\n' +
        '  --gate NAME  run only the named gate (repeatable). The hvi-* gates mirror\n' +
        '               the canonical CI contract file-for-file: hvi-g1-g2,\n' +
        '               hvi-host-read-port, hvi-discovery, hvi-hq-boundary,\n' +
```

_First 80 of 378 lines._

---

[HQ wiki](../../../index.md) · [Symbols](../../../symbols.md) · [Dependency graph](../../../graph.md) · [Documentation](../../../docs.md) · [Changes](../../../changes.md) · [Open tasks](../../../todos.md) · [Deprecated](../../../deprecated.md) · [Agent annotation protocol](../../../protocol.md) · [Glossary](../../../glossary.md) · [Using HQ](../../../context.md) · [Capabilities](../../../capabilities.md) · [Search index](../../../search.json) · [Browser view](../../../index.html)

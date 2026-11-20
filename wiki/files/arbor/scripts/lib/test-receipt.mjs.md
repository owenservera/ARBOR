# File: scripts/lib/test-receipt.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/lib/test-receipt.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4958 B |
| Lines | 138 |
| Hash | 9d4673bf3146 |
| Test | no |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REPO_ROOT | const | 14 | no | const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;); |
| PROOFS_DIR | const | 15 | no | const PROOFS_DIR = join( REPO_ROOT, &#39;.integration&#39;, &#39;proposal5&#39;, &#39;hq-version-intelligence&#39;, &#39;proofs&#39;, &#39;G2&#39;, ); |
| commitSha | function | 20 | yes | export function commitSha() { |
| versionCache | const | 35 | no | const versionCache = new Map(); |
| binaryVersion | function | 36 | yes | export function binaryVersion(binary) { |
| version | variable | 38 | no | let version = null; |
| RUNTIME_BINARY | const | 49 | no | const RUNTIME_BINARY = { |
| runtimeEvidence | function | 55 | yes | export function runtimeEvidence(runtimes = []) { |
| names | const | 56 | no | const names = [...new Set(runtimes)].sort(); |
| binary | const | 64 | no | const binary = RUNTIME_BINARY[name] ?? name; |
| ajvVersion | function | 74 | yes | export function ajvVersion() { |
| isoSafe | function | 84 | no | function isoSafe(iso) { |
| writeJson | function | 88 | no | function writeJson(path, value) { |
| writeGateReceipt | function | 93 | yes | export function writeGateReceipt({ gate, command, totals, exitCode, durationMs, startedAt, finishedAt, runtimes = [] }) { |
| sha | const | 94 | no | const sha = commitSha(); |
| receipt | const | 95 | no | const receipt = { |
| path | const | 111 | no | const path = join(PROOFS_DIR, `${gate}-receipt-${sha ?? &#39;unknown&#39;}.json`); |
| writeRunReceipt | function | 116 | yes | export function writeRunReceipt({ runId, commitSha: sha, totals, exitCode, durationMs, startedAt, finishedAt, tests, gates }) { |
| receipt | const | 117 | no | const receipt = { |
| path | const | 135 | no | const path = join(PROOFS_DIR, `run-receipt-${runId}.json`); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 8 | external |
| node:fs | import | 9 | external |
| node:os | import | 10 | external |
| node:path | import | 11 | external |
| node:url | import | 12 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [scripts/roadmap/a05-cycle.mjs](../roadmap/a05-cycle.mjs.md) | ../lib/test-receipt.mjs |
| [scripts/test-gate.mjs](../test-gate.mjs.md) | ./lib/test-receipt.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// scripts/lib/test-receipt.mjs — machine-readable receipts for the HVI test gate.
//
// Per-gate receipts: <canonical HVI proofs>/G2/<gate>-receipt-<sha>.json
// Per-run receipt:  <canonical HVI proofs>/G2/run-receipt-<runId>.json
// Local-only, no network. Receipts land beside the G2 decision and the
// machine-readable G2 ledger, never at the repository root.

import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { arch, release, platform } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PROOFS_DIR = join(
  REPO_ROOT, '.integration', 'proposal5', 'hq-version-intelligence', 'proofs', 'G2',
);

// Commit the gate was run against.
export function commitSha() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

// The version of a REAL runtime binary.
//
// The gate itself runs under Bun, and Bun reports `process.version` as the Node
// version it emulates (currently v26.x). That is NOT the version that executed
// the tests: the gate dispatches `node` or `bun` as a child process. Recording
// the gate's own `process.version` would state a runtime that never ran a
// single test, so every receipt resolves the dispatched binaries instead.
const versionCache = new Map();
export function binaryVersion(binary) {
  if (versionCache.has(binary)) return versionCache.get(binary);
  let version = null;
  try {
    version = execFileSync(binary, ['--version'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    version = null;
  }
  versionCache.set(binary, version);
  return version;
}

// The runtime that actually executed a test, by the manifest runtime name.
const RUNTIME_BINARY = {
  'node24-ajv': 'node',
  'node-strip-types': 'node',
  bun: 'bun',
};

export function runtimeEvidence(runtimes = []) {
  const names = [...new Set(runtimes)].sort();
  return {
    // The runtime the GATE itself ran under.
    gateRuntime: `bun ${binaryVersion('bun') ?? 'unknown'}`,
    // The runtimes that actually executed the tests, with their real versions.
    // Each manifest runtime is named separately even when two of them share a
    // binary, so the record never hides which mode ran which test.
    testRuntimes: names.map((name) => {
      const binary = RUNTIME_BINARY[name] ?? name;
      return { runtime: name, binary, version: binaryVersion(binary) };
    }),
    nodeVersion: binaryVersion('node'),
    bunVersion: binaryVersion('bun'),
  };
}

// ajv version from the hq-version-intelligence test root's local install
// (that root declares ajv 8.17.1 and installs it into node_modules).
export function ajvVersion() {
  try {
    return JSON.parse(
      readFileSync(join(REPO_ROOT, 'tests', 'hq-version-intelligence', 'node_modules', 'ajv', 'package.json'), 'utf8'),
    ).version;
  } catch {
    return null;
```

_First 80 of 139 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

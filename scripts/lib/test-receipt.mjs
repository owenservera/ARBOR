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
    testRuntimes: names.map((name) => {
      const binary = RUNTIME_BINARY[name] ?? name;
      return `${binary} ${binaryVersion(binary) ?? 'unknown'}`;
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
  }
}

function isoSafe(iso) {
  return iso.replace(/[:\-]/g, '').replace(/\.\d+Z$/, 'Z');
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
}

export function writeGateReceipt({ gate, command, totals, exitCode, durationMs, startedAt, finishedAt, runtimes = [] }) {
  const sha = commitSha();
  const receipt = {
    schema: 'arbor.hvi.gate-receipt/1',
    command,
    os: platform(),
    osRelease: release(),
    osArch: arch(),
    ...runtimeEvidence(runtimes),
    ajvVersion: ajvVersion(),
    commitSha: sha,
    gate,
    totals: { tests: Number(totals.tests ?? 0), pass: Number(totals.pass ?? 0), fail: Number(totals.fail ?? 0) },
    exitCode: Number(exitCode ?? 0),
    durationMs: Number(durationMs ?? 0),
    startedAt,
    finishedAt,
  };
  const path = join(PROOFS_DIR, `${gate}-receipt-${sha ?? 'unknown'}.json`);
  writeJson(path, receipt);
  return receipt;
}

export function writeRunReceipt({ runId, commitSha: sha, totals, exitCode, durationMs, startedAt, finishedAt, tests, gates }) {
  const receipt = {
    schema: 'arbor.hvi.gate-run-receipt/1',
    runId,
    command: 'bun scripts/test-gate.mjs',
    os: platform(),
    osRelease: release(),
    osArch: arch(),
    ...runtimeEvidence(tests.map((t) => t.runtime)),
    ajvVersion: ajvVersion(),
    commitSha: sha,
    totals: { tests: Number(totals.tests ?? 0), pass: Number(totals.pass ?? 0), fail: Number(totals.fail ?? 0) },
    exitCode: Number(exitCode ?? 0),
    durationMs: Number(durationMs ?? 0),
    startedAt,
    finishedAt,
    tests,
    gates,
  };
  const path = join(PROOFS_DIR, `run-receipt-${runId}.json`);
  writeJson(path, receipt);
  return receipt;
}

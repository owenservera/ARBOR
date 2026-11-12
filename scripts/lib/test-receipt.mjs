// scripts/lib/test-receipt.mjs — machine-readable receipts for the HVI test gate.
//
// Per-gate receipts: proofs/G2/<gate>-receipt-<sha>.json
// Per-run receipt:      proofs/G2/run-receipt-<runId>.json
// Local-only, no network.

import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PROOFS_DIR = join(REPO_ROOT, 'proofs', 'G2');

// Commit the gate was run against.
export function commitSha() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
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

export function writeGateReceipt({ gate, command, totals, exitCode, durationMs, startedAt, finishedAt }) {
  const sha = commitSha();
  const receipt = {
    command,
    os: process.platform,
    nodeVersion: process.version,
    bunVersion: typeof process.versions.bun === 'string' ? process.versions.bun : null,
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
    runId,
    command: 'bun scripts/test-gate.mjs',
    os: process.platform,
    nodeVersion: process.version,
    bunVersion: typeof process.versions.bun === 'string' ? process.versions.bun : null,
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

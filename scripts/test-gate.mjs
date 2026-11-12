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
        '               hvi-tierflow-inspector. Other gates: host-suite, hq-suite,\n' +
        '               interop, compatibility, uncategorized.\n',
      );
      process.exit(0);
    } else {
      opts._.push(a);
    }
  }
  if (opts._.length > 0) fail(`unknown argument(s): ${opts._.join(' ')}`);
  return opts;
}

function git(args) {
  try {
    return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' });
  } catch {
    return '';
  }
}

function verifyBase(base) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', base], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    return true;
  } catch {
    return false;
  }
}

// Changed/untracked files relative to --base (tracked worktree diff + untracked).
function changedFilesSince(base) {
  const tracked = git(['diff', '--name-only', base]).split(/\r?\n/).filter(Boolean);
  const untracked = git(['ls-files', '--others', '--exclude-standard']).split(/\r?\n/).filter(Boolean);
  return [...new Set([...tracked, ...untracked])];
}

// Files that can change any test's outcome. A change here selects the full suite
// with an explicit reason instead of the generic "uncovered change".
const GLOBAL_INPUTS = new Set([
  'package.json', 'bun.lock', 'bunfig.toml', 'tsconfig.json',
  '.gitattributes', '.gitignore',
  'scripts/test-gate.mjs', 'scripts/test-manifest.json',
]);
const isGlobalInput = (file) =>
  GLOBAL_INPUTS.has(file) ||
  file.startsWith('scripts/lib/') ||
  file.startsWith('.github/workflows/');

function selectTests(tests, changes, selectAll) {
  if (selectAll) return tests.map(t => ({ ...t, reason: '--all' }));
  const global = changes.filter(isGlobalInput);
  if (global.length > 0) {
    const extra = global.length > 1 ? ` +${global.length - 1} more` : '';
    return tests.map(t => ({
      ...t,
      reason: `fail-closed: global runtime or runner change ${global[0]}${extra}`,
    }));
  }
  const uncovered = changes.filter(c => !tests.some(t => testCoversFile(t, c)));
  // Fail-closed: any changed/untracked file outside every test's path and
  // dependency closure selects ALL tests.
  if (uncovered.length > 0) {
    const extra = uncovered.length > 1 ? ` +${uncovered.length - 1} more` : '';
    return tests.map(t => ({
      ...t,
      reason: `fail-closed: uncovered change ${uncovered[0]}${extra}`,
    }));
  }
  return tests
    .filter(t => changes.some(c => testCoversFile(t, c)))
    .map(t => ({
      ...t,
      reason: changes.filter(c => testCoversFile(t, c)).join(', '),
    }));
}

function dispatchCommand(test, coverage) {
  const bin = BIN_FOR_RUNTIME[test.runtime];
  if (!bin) fail(`test-gate: unknown runtime ${test.runtime} for ${test.path}`);
  if (test.runtime === 'bun') {
    return [bin, coverage ? ['test', '--coverage'] : ['test'], test.path].flat();
  }
  const strip = test.runtime === 'node-strip-types' ? ['--experimental-strip-types'] : [];
  const mode = coverage ? ['--test-coverage', '--test'] : ['--test'];
  return [bin, ...strip, ...mode, test.path];
}

function parseTotals(output, runtime) {
  if (runtime === 'bun') return parseBunTotals(output);
  return parseNodeTotals(output);
}

// node --test summary: "ℹ pass 5" / "ℹ fail 1" (combined: "ℹ tests N pass P fail F").
function parseNodeTotals(output) {
  const combined = /^\s*ℹ\s+tests\s+(\d+)\s+pass\s+(\d+)\s+fail\s+(\d+)\b/m.exec(output);
  if (combined) {
    return { tests: Number(combined[1]), pass: Number(combined[2]), fail: Number(combined[3]) };
  }
  const pass = /^\s*ℹ\s+pass\s+(\d+)\b/m.exec(output);
  const fail = /^\s*ℹ\s+fail\s+(\d+)\b/m.exec(output);
  const p = pass ? Number(pass[1]) : 0;
  const f = fail ? Number(fail[1]) : 0;
  return { tests: p + f, pass: p, fail: f };
}

// bun test summary: " 3 pass" / " 0 fail".
function parseBunTotals(output) {
  const pass = /(^|\n)\s*(\d+)\s+pass\b/m.exec(output);
  const fail = /(^|\n)\s*(\d+)\s+fail\b/m.exec(output);
  const p = pass ? Number(pass[2]) : 0;
  const f = fail ? Number(fail[2]) : 0;
  return { tests: p + f, pass: p, fail: f };
}

function runTest(test, coverage) {
  const args = dispatchCommand(test, coverage);
  const bin = args[0];
  const rest = args.slice(1);
  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  const result = spawnSync(bin, rest, { cwd: REPO_ROOT, encoding: 'utf8' });
  const finishedAt = new Date().toISOString();
  const exitCode = typeof result.status === 'number' ? result.status : -1;
  return {
    command: args.join(' '),
    exitCode,
    totals: parseTotals(result.stdout ?? '', test.runtime),
    durationMs: Date.now() - startMs,
    startedAt,
    finishedAt,
  };
}

function printPlan(selected, explain) {
  process.stdout.write('test-gate --plan (test selection only, no tests executed)\n');
  process.stdout.write(`selected ${selected.length} test(s)\n`);
  for (const t of selected) {
    let line = `  ${t.path}  root=${t.root}  runtime=${t.runtime}  gate=${t.gate}  reason: ${t.reason}`;
    process.stdout.write(line + '\n');
  }
}

function runSelected(selected, opts) {
  let overallExitCode = 0;
  let grandTests = 0, grandPass = 0, grandFail = 0, grandMs = 0;
  const runTests = [];
  const gateMap = new Map();
  const startedAt = new Date().toISOString();

  for (const test of selected) {
    const closure = dependencyClosure(test);
    const fingerprint = fingerprintFor(test.runtime, closure);
    let result = null;
    let cached = false;

    if (!opts.noCache) {
      const entry = cacheGet(fingerprint);
      if (entry) {
        result = {
          command: entry.command,
          exitCode: entry.exitCode,
          totals: entry.totals,
          durationMs: entry.durationMs,
        };
        cached = true;
      }
    }

    if (!cached) {
      // Entry wiring: enforce the toolchain guard (bun >= 1.4 + lockfile v2)
      // only for tests dispatched through bun. node24-ajv / node-strip-types
      // tests run under plain node.
      if (test.runtime === 'bun') assertToolchain();
      result = runTest(test, opts.coverage);
      // Never write a proof for a failed or interrupted run: interrupted runs
      // never reach here, and failed runs exit nonzero below.
      if (!opts.noCache && result.exitCode === 0) {
        cachePut(fingerprint, {
          command: result.command,
          exitCode: 0,
          totals: result.totals,
          durationMs: result.durationMs,
          gate: test.gate,
          path: test.path,
        });
      }
    }

    const { exitCode, totals, durationMs, command } = result;
    if (exitCode !== 0 || totals.fail > 0) overallExitCode = 1;
    grandTests += totals.tests;
    grandPass += totals.pass;
    grandFail += totals.fail;
    grandMs += durationMs;

    runTests.push({
      path: test.path,
      root: test.root,
      runtime: test.runtime,
      gate: test.gate,
      cached,
      exitCode,
      totals,
      durationMs,
      command,
    });

    const bucket = gateMap.get(test.gate) ?? {
      tests: 0, pass: 0, fail: 0, exitCode: 0, durationMs: 0, command: null,
    };
    bucket.tests += totals.tests;
    bucket.pass += totals.pass;
    bucket.fail += totals.fail;
    bucket.exitCode = Math.max(bucket.exitCode, exitCode);
    bucket.durationMs += durationMs;
    if (!bucket.command) bucket.command = command;
    gateMap.set(test.gate, bucket);

    const status = exitCode === 0 && totals.fail === 0 ? 'ok  ' : 'FAIL';
    process.stdout.write(
      `${status} ${test.path}  ${test.runtime}  ${test.gate}  ${totals.pass} pass ${totals.fail} fail  ${durationMs}ms${cached ? ' (cached)' : ''}\n`,
    );
  }

  const finishedAt = new Date().toISOString();
  const sha = commitSha();

  // Per-gate receipts.
  const gateReceipts = [];
  for (const [gate, bucket] of gateMap) {
    gateReceipts.push(writeGateReceipt({
      gate,
      command: bucket.command,
      totals: { tests: bucket.tests, pass: bucket.pass, fail: bucket.fail },
      exitCode: bucket.exitCode,
      durationMs: bucket.durationMs,
      startedAt,
      finishedAt,
    }));
  }

  // Per-run receipt.
  const runId = `${startedAt.replace(/[:\-]/g, '').replace(/\.\d+Z$/, 'Z')}-${(sha ?? 'unknown').slice(0, 12)}`;
  writeRunReceipt({
    runId,
    commitSha: sha,
    totals: { tests: grandTests, pass: grandPass, fail: grandFail },
    exitCode: overallExitCode,
    durationMs: grandMs,
    startedAt,
    finishedAt,
    tests: runTests,
    gates: gateReceipts,
  });

  process.stdout.write(
    `\ntest-gate: ${selected.length} selected, ${grandPass} pass, ${grandFail} fail -> exit ${overallExitCode}\n`,
  );
  return overallExitCode;
}

function main(argv) {
  const opts = parseArgs(argv);
  if (!verifyBase(opts.base)) fail(`base ref ${opts.base} does not exist`);
  let tests = discoverTests();
  if (tests.length === 0) fail('no tests discovered in manifest roots', 2);
  if (opts.gates.length > 0) {
    const wanted = new Set(opts.gates);
    const unknown = opts.gates.filter((g) => !tests.some((t) => t.gate === g));
    if (unknown.length > 0) fail(`unknown gate(s): ${unknown.join(', ')}`);
    tests = tests.filter((t) => wanted.has(t.gate));
    if (tests.length === 0) fail('no tests in the requested gate(s)', 2);
  }
  const changes = changedFilesSince(opts.base);
  const selected = selectTests(tests, changes, opts.all || opts.gates.length > 0);

  if (opts.plan) {
    printPlan(selected, opts.explain);
    return 0;
  }

  return runSelected(selected, opts);
}

process.exit(main(process.argv.slice(2)));

// hq/aii/fixtures/HQ-032-running-executable-version.mjs
// AII scenario HQ-032 (group D): "Which executable version is currently running?"
// Engine: hq/lib/channel-seats.mjs classifySeat (:91) — the runtime-observation vocabulary
// HQ has (seat states carry no version), named by the gap slice (recheck-scope.json). The gap:
// hq status --json has no running-executable version field; the version observation for the
// runtimes HQ itself depends on (bun, git) is demonstrated read-only in the fixture.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - `bun hq/bin/hq.mjs status --json` prints db path, lastIndexed and project rows (head,
//     branch, symbol_count) — no running-executable version field anywhere (re-verified).
//   - classifySeat's state vocabulary (NO_SESSION | UNKNOWN | ACTIVE | IDLE) cannot express
//     a version — verified from channel-seats.mjs:91-105.
//   - Read-only version probes: `bun --version` and `git --version` (spawnSync, no mutation).

import { defineFixture, finding, runHq } from './harness.mjs';
import { spawnSync } from 'node:child_process';
import { classifySeat } from '../../lib/channel-seats.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const SEMVERISH = /^\d+\.\d+\.\d+/;

function probeVersion(cmd, args) {
  const res = spawnSync(cmd, args, { encoding: 'utf8', timeout: 30000, windowsHide: true });
  const out = String(res.stdout ?? '').trim().split('\n')[0];
  return { exit: res.status, version: out };
}

export default defineFixture({
  id: 'HQ-032',
  provenance:
    '2026-11-11 (this session): locked from the engine named by hq/aii/assessments/recheck-scope.json HQ-032 gap.engine ' +
    '(hq/lib/channel-seats.mjs classifySeat :91 — the runtime-observation vocabulary, which carries NO version ' +
    'dimension). Explicit zero re-verified this session: bun hq/bin/hq.mjs status --json prints db path, lastIndexed ' +
    'and per-project rows (head, branch, symbol_count) with no running-executable version field. The version ' +
    'observation is demonstrated read-only on the runtimes HQ depends on: spawnSync("bun", ["--version"]) and ' +
    'spawnSync("git", ["--version"]) — no mutation, no effect on the machine.',
  expected: [
    { what: 'hq status --json carries no running-executable version field (explicit zero, re-derived live)', where: 'hq/bin/hq.mjs status --json' },
    { what: 'the seat-state vocabulary cannot express a version: classifySeat states are NO_SESSION, UNKNOWN, ACTIVE, IDLE', where: 'hq/lib/channel-seats.mjs classifySeat' },
    { what: 'the bun runtime version is observable read-only and parses as a version number', where: 'spawnSync bun --version' },
    { what: 'the git runtime version is observable read-only and parses as a version number', where: 'spawnSync git --version' },
    { what: 'the version observation attaches to the binary, not to a seat state — the two dimensions are distinct', where: 'hq/lib/channel-seats.mjs classifySeat' },
  ],
  run: async () => {
    const findings = [];

    const status = runHq(['status', '--json'], { cwd: ROOT });
    if (status.exit !== 0) throw new Error(`hq status --json failed: exit=${status.exit} ${status.stderr}`);
    const emitted = JSON.parse(status.stdout);
    const flat = JSON.stringify(emitted).toLowerCase();
    if (/runningversion|executableversion|bunversion|gitversion/.test(flat)) {
      throw new Error('status --json gained a version field — refresh this fixture');
    }
    findings.push(finding('hq status --json carries no running-executable version field (explicit zero, re-derived live)', 'hq/bin/hq.mjs status --json'));

    const bun = probeVersion('bun', ['--version']);
    if (bun.exit !== 0 || !SEMVERISH.test(bun.version)) {
      throw new Error(`bun --version unreadable: exit=${bun.exit} out=${bun.version}`);
    }
    findings.push(finding('the bun runtime version is observable read-only and parses as a version number', 'spawnSync bun --version'));

    const git = probeVersion('git', ['--version']);
    if (git.exit !== 0 || !/git version \d+\.\d+\.\d+/.test(git.version)) {
      throw new Error(`git --version unreadable: exit=${git.exit} out=${git.version}`);
    }
    findings.push(finding('the git runtime version is observable read-only and parses as a version number', 'spawnSync git --version'));

    const seat = { id: 'x', session: 's-1' };
    const state = classifySeat(seat, { ageMinutes: 1, title: null, updated: null }, { idleMinutes: 10 });
    if (!['NO_SESSION', 'UNKNOWN', 'ACTIVE', 'IDLE'].includes(state.state)) {
      throw new Error(`unexpected seat state: ${state.state}`);
    }
    if (JSON.stringify(state).toLowerCase().includes('version')) {
      throw new Error('seat state gained a version dimension — refresh this fixture');
    }
    findings.push(finding('the seat-state vocabulary cannot express a version: classifySeat states are NO_SESSION, UNKNOWN, ACTIVE, IDLE', 'hq/lib/channel-seats.mjs classifySeat'));
    findings.push(finding('the version observation attaches to the binary, not to a seat state — the two dimensions are distinct', 'hq/lib/channel-seats.mjs classifySeat'));
    return findings;
  },
});

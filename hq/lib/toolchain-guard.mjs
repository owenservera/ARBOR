// hq/lib/toolchain-guard.mjs — ZAIQ-014 toolchain guard: bun >= 1.4 + bun.lock v2.
//
// Why this exists: bun 1.3.14 silently rewrote this repo's bun.lock from the
// v2 JSON format ("lockfileVersion": 2) to the legacy v1 text format, breaking
// installs (recovered via `git checkout bun.lock`). The machine now runs
// bun 1.4.4, which needs node:sqlite and expects the v2 lockfile; package.json
// engines already require bun >=1.4. This module enforces that contract at
// tool entry (hq/bin/hq.mjs and scripts/test-smart.mjs) BEFORE any command
// does real work.
//
// Guard refusals exit with dedicated codes, distinct from the CLI's own
// 0 (success) / 1 (command failure) / 2 (unknown command):
//   2 — bun older than REQUIRED_BUN (detected via Bun.version / process.versions.bun)
//   3 — bun.lock carries the legacy v1 text-format signature (downgrade damage)
//
// Both checks are bypassed with HQ_TOOLCHAIN_UNGUARDED=1 (also stated in every
// guard message). The guard is deliberately fast (no install, no network, one
// small file read) and tolerant, because the always-on `hq watch` daemon and
// CI-style runs must never be killed by a false positive: a missing, empty,
// unreadable, unparseable or future-format lockfile, and an undetectable bun
// version (e.g. plain node), are all tolerated. Only an unmistakable v1
// signature — a text lockfile that opens with a `#` comment header — or a
// version that parses strictly below 1.4.0 can refuse.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REQUIRED_BUN = '1.4.0';
export const TOOLCHAIN_EXIT_BUN_TOO_OLD = 2;
export const TOOLCHAIN_EXIT_LOCKFILE_V1 = 3;
export const TOOLCHAIN_OVERRIDE_ENV = 'HQ_TOOLCHAIN_UNGUARDED';

// The lockfile lives at the repo root beside package.json, two levels above
// this module (hq/lib/ -> hq/ -> repo root), independent of the caller's cwd.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LOCKFILE_PATH = join(REPO_ROOT, 'bun.lock');

// "1.4.4" | "1.4" | "v1.4.4-canary.abc" -> [major, minor, patch]; null when
// the string is not a recognizable dotted version.
export function parseVersion(version) {
  if (typeof version !== 'string') return null;
  const match = /^v?(\d+)\.(\d+)(?:\.(\d+))?/.exec(version.trim());
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)];
}

// -1 | 0 | 1 like a normal comparator; null when either side is unparseable
// (callers must treat that as "cannot determine", never as a refusal).
export function compareVersions(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (!left || !right) return null;
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] < right[i] ? -1 : 1;
  }
  return 0;
}

// Returns the lockfile's major format version, or null when it should be
// tolerated: v2 (and any future format) is a JSON object whose first field is
// a numeric "lockfileVersion" — note bun writes JSON WITH trailing commas,
// so a strict JSON.parse would reject the real v2 file; the header field is
// matched directly instead. The legacy v1 format is a text file opening with
// a `#` comment header ("# To install ...") followed by quoted package
// entries — the exact shape bun <= 1.3 writes when it silently downgrades a
// v2 file.
export function sniffLockfileVersion(text) {
  if (typeof text !== 'string') return null;
  const head = text.slice(0, 1024).trimStart();
  if (!head) return null;
  if (head.startsWith('{')) {
    const match = /"lockfileVersion"\s*:\s*(\d+)/.exec(head);
    return match ? Number(match[1]) : null;
  }
  if (head.startsWith('#')) return 1; // legacy text lockfile: downgrade signature
  return null;
}

// Pure decision core. null when the toolchain is fine (or undeterminable —
// the guard only refuses on explicit evidence), otherwise
// { exitCode, message } with a one-line message naming the remedy and the
// override. Version evidence wins over lockfile evidence when both are bad.
export function toolchainProblem({ bunVersion, lockfileText } = {}) {
  if (bunVersion != null) {
    const ordering = compareVersions(bunVersion, REQUIRED_BUN);
    if (ordering !== null && ordering < 0) {
      return {
        exitCode: TOOLCHAIN_EXIT_BUN_TOO_OLD,
        message: `hq: toolchain guard (exit ${TOOLCHAIN_EXIT_BUN_TOO_OLD}): bun >=${REQUIRED_BUN} required (node:sqlite, bun.lock v2), detected bun ${bunVersion} — upgrade bun, or bypass with ${TOOLCHAIN_OVERRIDE_ENV}=1`,
      };
    }
  }
  if (sniffLockfileVersion(lockfileText) === 1) {
    return {
      exitCode: TOOLCHAIN_EXIT_LOCKFILE_V1,
      message: `hq: toolchain guard (exit ${TOOLCHAIN_EXIT_LOCKFILE_V1}): bun.lock is in the legacy v1 text format (bun <1.4 downgrade signature, breaks installs) — restore with \`git checkout bun.lock\`, or bypass with ${TOOLCHAIN_OVERRIDE_ENV}=1`,
    };
  }
  return null;
}

function detectedBunVersion() {
  if (typeof Bun !== 'undefined' && typeof Bun.version === 'string') return Bun.version;
  const fromProcess = typeof process !== 'undefined' && process.versions && process.versions.bun;
  return typeof fromProcess === 'string' && fromProcess ? fromProcess : null;
}

function readRepoLockfile() {
  try {
    return existsSync(LOCKFILE_PATH) ? readFileSync(LOCKFILE_PATH, 'utf8') : null;
  } catch {
    return null; // an unreadable lockfile never kills the watcher
  }
}

// Tool-entry enforcement, called once at the top of hq/bin/hq.mjs and
// scripts/test-smart.mjs. Inject bunVersion / lockfileText / env / stream /
// exit in tests; in production it reads the real runtime version and the
// repo's committed bun.lock. Returns the refusal object when the toolchain
// is rejected (after writing the message and exiting), null otherwise.
export function assertToolchain(options = {}) {
  const env = options.env ?? process.env;
  const override = env[TOOLCHAIN_OVERRIDE_ENV];
  if (override === '1' || override === 'true') return null;
  const problem = toolchainProblem({
    bunVersion: options.bunVersion ?? detectedBunVersion(),
    lockfileText: options.lockfileText ?? readRepoLockfile(),
  });
  if (!problem) return null;
  (options.stream ?? process.stderr).write(problem.message + '\n');
  (options.exit ?? process.exit)(problem.exitCode);
  return problem;
}

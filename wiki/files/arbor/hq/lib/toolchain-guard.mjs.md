# File: hq/lib/toolchain-guard.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/toolchain-guard.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6586 B |
| Lines | 133 |
| Hash | 6515d7a3edf2 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REQUIRED_BUN | const | 28 | yes | export const REQUIRED_BUN = &#39;1.4.0&#39;; |
| TOOLCHAIN_EXIT_BUN_TOO_OLD | const | 29 | yes | export const TOOLCHAIN_EXIT_BUN_TOO_OLD = 2; |
| TOOLCHAIN_EXIT_LOCKFILE_V1 | const | 30 | yes | export const TOOLCHAIN_EXIT_LOCKFILE_V1 = 3; |
| TOOLCHAIN_OVERRIDE_ENV | const | 31 | yes | export const TOOLCHAIN_OVERRIDE_ENV = &#39;HQ_TOOLCHAIN_UNGUARDED&#39;; |
| REPO_ROOT | const | 35 | no | const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;); |
| LOCKFILE_PATH | const | 36 | no | const LOCKFILE_PATH = join(REPO_ROOT, &#39;bun.lock&#39;); |
| parseVersion | function | 40 | yes | export function parseVersion(version) { |
| compareVersions | function | 49 | yes | export function compareVersions(a, b) { |
| left | const | 50 | no | const left = parseVersion(a); |
| right | const | 51 | no | const right = parseVersion(b); |
| sniffLockfileVersion | function | 67 | yes | export function sniffLockfileVersion(text) { |
| head | const | 69 | no | const head = text.slice(0, 1024).trimStart(); |
| toolchainProblem | function | 83 | yes | export function toolchainProblem({ bunVersion, lockfileText } = {}) { |
| ordering | const | 85 | no | const ordering = compareVersions(bunVersion, REQUIRED_BUN); |
| detectedBunVersion | function | 102 | no | function detectedBunVersion() { |
| fromProcess | const | 104 | no | const fromProcess = typeof process !== &#39;undefined&#39; &amp;&amp; process.versions &amp;&amp; process.versions.bun; |
| readRepoLockfile | function | 108 | no | function readRepoLockfile() { |
| assertToolchain | function | 121 | yes | export function assertToolchain(options = {}) { |
| env | const | 122 | no | const env = options.env ?? process.env; |
| problem | const | 125 | no | const problem = toolchainProblem({ bunVersion: options.bunVersion ?? detectedBunVersion(), lockfileText: options.lockfileText ?? readRepoLockfile(), }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 24 | external |
| node:path | import | 25 | external |
| node:url | import | 26 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/toolchain-guard.mjs |
| [scripts/test-gate.mjs](../../scripts/test-gate.mjs.md) | ../hq/lib/toolchain-guard.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 134 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

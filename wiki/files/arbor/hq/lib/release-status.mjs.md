# File: hq/lib/release-status.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/release-status.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5131 B |
| Lines | 129 |
| Hash | 67376c805bf5 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| RELEASE_STATUS_SCHEMA | const | 13 | yes | export const RELEASE_STATUS_SCHEMA = &#39;hq.release-status/1&#39;; |
| git | function | 15 | no | function git(root, args) { |
| result | const | 16 | no | const result = spawnSync(&#39;git&#39;, args, { cwd: root, encoding: &#39;utf8&#39;, windowsHide: true }); |
| readJson | function | 20 | no | function readJson(path) { |
| latestTag | function | 24 | no | function latestTag(root, prefix) { |
| tag | const | 25 | no | const tag = git(root, [&#39;describe&#39;, &#39;--tags&#39;, &#39;--abbrev=0&#39;, &#39;--match&#39;, `${prefix}[0-9]*`]); |
| commitsSince | function | 29 | no | function commitsSince(root, baseRef) { |
| raw | const | 31 | no | const raw = git(root, [&#39;log&#39;, &#39;--no-merges&#39;, &#39;--format=%H%x00%s%x00%b%x1e&#39;, `${baseRef}..HEAD`]); |
| firstReleaseBase | function | 35 | no | function firstReleaseBase(root) { |
| releaseStatus | function | 44 | yes | export function releaseStatus({ root, prefix = &#39;v&#39;, branch = &#39;main&#39; } = {}) { |
| pkg | const | 45 | no | const pkg = readJson(join(root, &#39;package.json&#39;)); |
| version | const | 46 | no | const version = pkg?.version ? String(pkg.version) : null; |
| versionValid | variable | 47 | no | let versionValid = true; |
| isRepo | const | 52 | no | const isRepo = git(root, [&#39;rev-parse&#39;, &#39;--is-inside-work-tree&#39;]) === &#39;true&#39;; |
| currentBranch | const | 53 | no | const currentBranch = isRepo ? git(root, [&#39;rev-parse&#39;, &#39;--abbrev-ref&#39;, &#39;HEAD&#39;]) : null; |
| dirtyRaw | const | 54 | no | const dirtyRaw = isRepo ? git(root, [&#39;status&#39;, &#39;--porcelain&#39;]) : null; |
| clean | const | 55 | no | const clean = isRepo ? dirtyRaw === &#39;&#39; : null; |
| lastTag | const | 56 | no | const lastTag = isRepo ? latestTag(root, prefix) : null; |
| baseRef | const | 57 | no | const baseRef = lastTag ?? (isRepo ? firstReleaseBase(root) : null); |
| commits | const | 58 | no | const commits = commitsSince(root, baseRef); |
| plan | variable | 60 | no | let plan = null; |
| bundleManifest | const | 65 | no | const bundleManifest = readJson(join(root, &#39;dist&#39;, &#39;hq-single&#39;, &#39;BUNDLE.json&#39;)); |
| bundleVersion | const | 66 | no | const bundleVersion = bundleManifest?.version ? String(bundleManifest.version) : null; |
| bundle | const | 67 | no | const bundle = bundleManifest |
| gate | const | 76 | no | const gate = readJson(join(root, &#39;.hq&#39;, &#39;quality-gate.json&#39;)); |
| head | const | 77 | no | const head = isRepo ? git(root, [&#39;rev-parse&#39;, &#39;HEAD&#39;]) : null; |
| qualityGate | const | 78 | no | const qualityGate = gate |
| workflows | const | 92 | no | const workflows = [&#39;ci.yml&#39;, &#39;release.yml&#39;].filter((name) =&gt; existsSync(join(root, &#39;.github&#39;, &#39;workflows&#39;, name))); |
| reason | variable | 94 | no | let reason = null; |
| releasable | variable | 95 | no | let releasable = false; |
| compareVersionsSafe | function | 127 | no | function compareVersionsSafe(left, right) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 8 | external |
| node:path | import | 9 | external |
| node:child_process | import | 10 | external |
| ./release-plan.mjs | import | 11 | [hq/lib/release-plan.mjs](./release-plan.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-081-remaining-release-work.mjs](../aii/fixtures/HQ-081-remaining-release-work.mjs.md) | ../../lib/release-status.mjs |
| [hq/aii/fixtures/HQ-088-release-blocking-integrations.mjs](../aii/fixtures/HQ-088-release-blocking-integrations.mjs.md) | ../../lib/release-status.mjs |
| [hq/lib/mcp.mjs](./mcp.mjs.md) | ./release-status.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 1 | context | — | — | Read-only release readiness — version, pending bump, bundle and gate evidence. |
| 2 | owner | hq-agent | — | hq-agent |
| 3 | task | — | — | release-automation |

## Excerpt

```javascript
// @hq:context Read-only release readiness — version, pending bump, bundle and gate evidence.
// @hq:owner hq-agent
// @hq:task release-automation
//
// This module never mutates anything: it answers "is this checkout releasable
// right now?" from the working tree, git history and the last quality-gate
// report. Executing a release stays with scripts/release.mjs and its gates.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildReleasePlan, compareVersions, parseGitLog, parseVersion } from './release-plan.mjs';

export const RELEASE_STATUS_SCHEMA = 'hq.release-status/1';

function git(root, args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true });
  return result.status === 0 ? String(result.stdout ?? '').trim() : null;
}

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

function latestTag(root, prefix) {
  const tag = git(root, ['describe', '--tags', '--abbrev=0', '--match', `${prefix}[0-9]*`]);
  return tag || null;
}

function commitsSince(root, baseRef) {
  if (!baseRef) return [];
  const raw = git(root, ['log', '--no-merges', '--format=%H%x00%s%x00%b%x1e', `${baseRef}..HEAD`]);
  return raw ? parseGitLog(raw) : [];
}

function firstReleaseBase(root) {
  return git(root, ['log', '-1', '--format=%H', '--', 'package.json']) || null;
}

/**
 * Build the release-readiness report.
 * `releasable` is deliberately conservative: a dirty tree, a non-main branch or
 * a missing baseline tag all make an automatic release ineligible.
 */
export function releaseStatus({ root, prefix = 'v', branch = 'main' } = {}) {
  const pkg = readJson(join(root, 'package.json'));
  const version = pkg?.version ? String(pkg.version) : null;
  let versionValid = true;
  if (version) {
    try { parseVersion(version); } catch { versionValid = false; }
  }

  const isRepo = git(root, ['rev-parse', '--is-inside-work-tree']) === 'true';
  const currentBranch = isRepo ? git(root, ['rev-parse', '--abbrev-ref', 'HEAD']) : null;
  const dirtyRaw = isRepo ? git(root, ['status', '--porcelain']) : null;
  const clean = isRepo ? dirtyRaw === '' : null;
  const lastTag = isRepo ? latestTag(root, prefix) : null;
  const baseRef = lastTag ?? (isRepo ? firstReleaseBase(root) : null);
  const commits = commitsSince(root, baseRef);

  let plan = null;
  if (versionValid && version) {
    plan = buildReleasePlan({ currentVersion: version, lastTag, commits, requestedBump: 'auto' });
  }

  const bundleManifest = readJson(join(root, 'dist', 'hq-single', 'BUNDLE.json'));
  const bundleVersion = bundleManifest?.version ? String(bundleManifest.version) : null;
  const bundle = bundleManifest
    ? {
        present: true,
        version: bundleVersion,
        digest: bundleManifest.digest ?? null,
        matchesPackageVersion: Boolean(version && bundleVersion && compareVersionsSafe(bundleVersion, version) === 0),
      }
    : { present: false, version: null, digest: null, matchesPackageVersion: false };

  const gate = readJson(join(root, '.hq', 'quality-gate.json'));
  const head = isRepo ? git(root, ['rev-parse', 'HEAD']) : null;
  const qualityGate = gate
    ? {
        present: true,
```

_First 80 of 130 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

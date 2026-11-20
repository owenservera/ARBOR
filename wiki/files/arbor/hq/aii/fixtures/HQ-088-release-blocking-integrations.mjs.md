# File: hq/aii/fixtures/HQ-088-release-blocking-integrations.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-088-release-blocking-integrations.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5660 B |
| Lines | 78 |
| Hash | d2501e016271 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 28 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| findings | const | 43 | no | const findings = []; |
| status | const | 45 | no | const status = releaseStatus({ root: ROOT }); |
| tags | const | 52 | no | const tags = (tryGit(ROOT, [&#39;tag&#39;, &#39;--list&#39;, &#39;v[0-9]*&#39;]) ?? &#39;&#39;).trim(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 22 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/release-status.mjs | import | 23 | [hq/lib/release-status.mjs](../../lib/release-status.mjs.md) |
| ../../lib/git.mjs | import | 24 | [hq/lib/git.mjs](../../lib/git.mjs.md) |
| node:path | import | 25 | external |
| node:url | import | 26 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-088-release-blocking-integrations.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-088 (group J):
// "Which unfinished integrations could prevent release acceptance?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   releaseStatus({ root }) (hq/lib/release-status.mjs:44) — the acceptance
//   gate — returned releasable false with reason "working_tree_dirty":
//   the release-acceptance chain at hq/lib/release-status.mjs:94-104 requires,
//   in order: a package version (no_package_version), a valid semver
//   (invalid_package_version), a git repo (not_a_git_repository), branch main
//   (branch_is_*), a CLEAN TREE (working_tree_dirty), a baseline tag
//   (no_baseline_tag), release commits (no_release_commits) and both release
//   workflows (missing_release_workflows). Live state satisfies all but the
//   clean tree and the baseline tag: `git tag --list 'v[0-9]*'` is empty.
//   The gate refuses before the quality gate and bundle checks are reached.
//   Both release workflows exist (ci.yml, release.yml) and the bundle is
//   present and version-matched (1.1.1) — those integrations are done.
//
// The unfinished integrations that WOULD block acceptance: the dirty tree and
// the missing baseline tag. Both are pinned; the rest of the chain is verified
// as satisfied.
import { defineFixture, finding } from './harness.mjs';
import { releaseStatus } from '../../lib/release-status.mjs';
import { tryGit } from '../../lib/git.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-088',
  provenance: 'Locked 2026-11-11 on branch main from live output: releaseStatus({ root }) (hq/lib/release-status.mjs:44) returned releasable false with reason "working_tree_dirty", clean false, branch main, version 1.1.1, lastTag null, workflows [ci.yml, release.yml], bundle { present: true, version 1.1.1, matchesPackageVersion true }, qualityGate { present: false }. The gate chain at hq/lib/release-status.mjs:94-104 checks, in order: no_package_version, invalid_package_version, not_a_git_repository, branch_is_*, working_tree_dirty, no_baseline_tag, no_release_commits, missing_release_workflows. `git tag --list "v[0-9]*"` printed nothing (explicit zero — the baseline tag does not exist). So the unfinished integrations that block release acceptance are the dirty working tree and the missing baseline tag; the workflow and bundle integrations are complete. All gate-chain facts are pinned exactly.',
  expected: [
    { what: 'release acceptance is blocked by the dirty working tree', where: 'hq/lib/release-status.mjs releaseStatus' },
    { what: 'release acceptance is blocked by the missing baseline tag', where: 'hq/lib/release-status.mjs releaseStatus' },
    { what: 'the working tree is not clean', where: 'hq/lib/release-status.mjs releaseStatus' },
    { what: 'no v-prefixed baseline tag exists in the repository', where: 'git tag --list v[0-9]*' },
    { what: 'the release workflows integration is complete (ci.yml and release.yml present)', where: 'hq/lib/release-status.mjs releaseStatus' },
    { what: 'the bundle integration is complete (bundle present and version-matched)', where: 'hq/lib/release-status.mjs releaseStatus' },
    { what: 'the checkout is on the expected branch main', where: 'hq/lib/release-status.mjs releaseStatus' },
  ],
  run: async () => {
    const findings = [];

    const status = releaseStatus({ root: ROOT });
    if (status.releasable !== false) throw new Error(`expected releasable=false, got ${status.releasable}`);
    if (status.reason !== 'working_tree_dirty') {
      throw new Error(`unexpected release reason: ${status.reason}`);
    }
    findings.push(finding('release acceptance is blocked by the dirty working tree', 'hq/lib/release-status.mjs releaseStatus'));

    const tags = (tryGit(ROOT, ['tag', '--list', 'v[0-9]*']) ?? '').trim();
    if (tags !== '') throw new Error(`expected no v* tags, got ${JSON.stringify(tags)}`);
    findings.push(finding('no v-prefixed baseline tag exists in the repository', 'git tag --list v[0-9]*'));
    if (status.lastTag !== null) throw new Error(`expected lastTag null, got ${status.lastTag}`);
    findings.push(finding('release acceptance is blocked by the missing baseline tag', 'hq/lib/release-status.mjs releaseStatus'));

    if (status.clean !== false) throw new Error(`expected clean=false, got ${status.clean}`);
    findings.push(finding('the working tree is not clean', 'hq/lib/release-status.mjs releaseStatus'));

    if (status.workflows.join(', ') !== 'ci.yml, release.yml') {
      throw new Error(`unexpected workflows: ${status.workflows.join(', ')}`);
    }
    findings.push(finding('the release workflows integration is complete (ci.yml and release.yml present)', 'hq/lib/release-status.mjs releaseStatus'));

    if (!status.bundle.present || !status.bundle.matchesPackageVersion) {
      throw new Error(`unexpected bundle: ${JSON.stringify(status.bundle)}`);
    }
    findings.push(finding('the bundle integration is complete (bundle present and version-matched)', 'hq/lib/release-status.mjs releaseStatus'));

    if (status.branch !== status.expectedBranch) {
      throw new Error(`unexpected branch: ${status.branch} != ${status.expectedBranch}`);
    }
    findings.push(finding('the checkout is on the expected branch main', 'hq/lib/release-status.mjs releaseStatus'));

    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

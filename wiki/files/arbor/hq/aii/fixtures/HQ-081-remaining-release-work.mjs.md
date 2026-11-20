# File: hq/aii/fixtures/HQ-081-remaining-release-work.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-081-remaining-release-work.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7536 B |
| Lines | 102 |
| Hash | 4b24e1e54c1f |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 35 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| findings | const | 52 | no | const findings = []; |
| status | const | 54 | no | const status = releaseStatus({ root: ROOT }); |
| plan | const | 61 | no | const plan = buildReleasePlan({ currentVersion: status.version ?? &#39;1.1.1&#39;, lastTag: null, commits: [], requestedBump: &#39;auto&#39; }); |
| initiativesFile | const | 84 | no | const initiativesFile = join(ROOT, &#39;docs&#39;, &#39;integration&#39;, &#39;STRATEGIC-INITIATIVES.md&#39;); |
| tasksFile | const | 85 | no | const tasksFile = &#39;C:/VIVIM/channel/tasks/active-tasks.md&#39;; |
| model | const | 86 | no | const model = buildPortfolio({ qeueDir: join(ROOT, &#39;qeue&#39;), initiativesText: existsSync(initiativesFile) ? readFileSync(initiativesFile, &#39;utf8&#39;) : null, tasksText: existsSync(tasksFile) ? readFileSyn… |
| m | const | 92 | no | const m = model.verdict.text.match(/^(\\d+) items · (\\d+) accepted · (\\d+) blocked · (\\d+) untracked$/); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 26 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/release-status.mjs | import | 27 | [hq/lib/release-status.mjs](../../lib/release-status.mjs.md) |
| ../../lib/release-plan.mjs | import | 28 | [hq/lib/release-plan.mjs](../../lib/release-plan.mjs.md) |
| ../../lib/pmo.mjs | import | 29 | [hq/lib/pmo.mjs](../../lib/pmo.mjs.md) |
| node:fs | import | 30 | external |
| node:fs | import | 31 | external |
| node:path | import | 32 | external |
| node:url | import | 33 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-081-remaining-release-work.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-081 (group J):
// "What is the actual remaining work needed for release?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   releaseStatus({ root }) (hq/lib/release-status.mjs:44) answered the
//   release question live:
//     version 1.1.1, branch main, lastTag null, baseRef e6860b59..., 788
//     commits since base, bump null, nextVersion null, releasable false,
//     reason "working_tree_dirty", clean false, bundle present (version
//     1.1.1, matchesPackageVersion true), qualityGate present false,
//     workflows [ci.yml, release.yml], readOnly true.
//   The remaining work: establish a baseline tag (no v* tag exists — `git tag
//   --list 'v[0-9]*'` is empty), commit the dirty tree, then the release
//   commits.
//   buildPortfolio() (hq/lib/pmo.mjs:530) over the real registers (qeue/,
//   docs/integration/STRATEGIC-INITIATIVES.md, C:/VIVIM/channel/tasks/
//   active-tasks.md) returned verdict "600 items · 0 accepted · 0 blocked ·
//   575 untracked" over 6 lanes of 100 items and 12 initiatives.
//   buildReleasePlan() (hq/lib/release-plan.mjs:127) with no lastTag refuses
//   to invent a baseline: action none, reason no_baseline_tag.
//
// The releasable=false verdict and its reason chain are the stable answer;
// the counts (commits since base, dirty entries, portfolio items) drift as
// lanes work, so they are re-derived live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { releaseStatus } from '../../lib/release-status.mjs';
import { buildReleasePlan } from '../../lib/release-plan.mjs';
import { buildPortfolio } from '../../lib/pmo.mjs';
import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-081',
  provenance: 'Locked 2026-11-11 on branch main from live output: releaseStatus({ root }) (hq/lib/release-status.mjs:44) returned version 1.1.1, branch main, lastTag null, commitsSinceBase 788, bump null, nextVersion null, releasable false, reason "working_tree_dirty", clean false, bundle { present: true, version 1.1.1, matchesPackageVersion true }, qualityGate { present: false }, workflows [ci.yml, release.yml], readOnly true. `git tag --list "v[0-9]*"` printed nothing (explicit zero — no baseline tag). buildReleasePlan({ currentVersion: "1.1.1", lastTag: null, commits: [] }) (hq/lib/release-plan.mjs:127) returned action "none" with reason "no_baseline_tag" — auto refuses to invent a baseline. buildPortfolio() (hq/lib/pmo.mjs:530) over the real registers returned verdict "600 items · 0 accepted · 0 blocked · 575 untracked" across 6 lanes of 100 and 12 initiatives. The remaining work for release: commit the dirty tree, establish the first baseline tag, then the release commits. The releasable=false verdict and reason chain are the stable answer; counts (commits since base, dirty files, portfolio items) drift as lanes work and are re-derived live.',
  expected: [
    { what: 'the checkout is not releasable right now: working_tree_dirty', where: 'hq/lib/release-status.mjs releaseStatus' },
    { what: 'no baseline tag exists, so no release can be computed (no_baseline_tag)', where: 'hq/lib/release-plan.mjs buildReleasePlan' },
    { what: 'the release bundle is present and matches the package version', where: 'hq/lib/release-status.mjs releaseStatus' },
    { what: 'no quality-gate report exists yet', where: 'hq/lib/release-status.mjs releaseStatus' },
    { what: 'both release workflows are present (ci.yml, release.yml)', where: 'hq/lib/release-status.mjs releaseStatus' },
    { what: 'the portfolio register shows the remaining work queue: 0 accepted of the tracked items', where: 'hq/lib/pmo.mjs buildPortfolio' },
    { what: /^\d+ items in the portfolio with \d+ untracked$/, where: 'hq/lib/pmo.mjs buildPortfolio' },
    { what: /^\d+ initiatives tracked in the portfolio$/, where: 'hq/lib/pmo.mjs buildPortfolio' },
    { what: /^\d+ commits since the release base$/, where: 'hq/lib/release-status.mjs releaseStatus' },
  ],
  run: async () => {
    const findings = [];

    const status = releaseStatus({ root: ROOT });
    if (status.releasable !== false) throw new Error(`expected releasable=false, got ${status.releasable}`);
    if (status.reason !== 'working_tree_dirty') {
      throw new Error(`unexpected release reason: ${status.reason}`);
    }
    findings.push(finding('the checkout is not releasable right now: working_tree_dirty', 'hq/lib/release-status.mjs releaseStatus'));

    const plan = buildReleasePlan({ currentVersion: status.version ?? '1.1.1', lastTag: null, commits: [], requestedBump: 'auto' });
    if (plan.action !== 'none' || plan.reason !== 'no_baseline_tag') {
      throw new Error(`unexpected plan: ${JSON.stringify({ action: plan.action, reason: plan.reason })}`);
    }
    findings.push(finding('no baseline tag exists, so no release can be computed (no_baseline_tag)', 'hq/lib/release-plan.mjs buildReleasePlan'));

    if (!status.bundle.present || !status.bundle.matchesPackageVersion) {
      throw new Error(`unexpected bundle state: ${JSON.stringify(status.bundle)}`);
    }
    findings.push(finding('the release bundle is present and matches the package version', 'hq/lib/release-status.mjs releaseStatus'));

    if (status.qualityGate.present !== false) {
      throw new Error(`unexpected quality gate: ${JSON.stringify(status.qualityGate)}`);
    }
    findings.push(finding('no quality-gate report exists yet', 'hq/lib/release-status.mjs releaseStatus'));

    if (status.workflows.join(', ') !== 'ci.yml, release.yml') {
      throw new Error(`unexpected workflows: ${status.workflows.join(', ')}`);
    }
    findings.push(finding('both release workflows are present (ci.yml, release.yml)', 'hq/lib/release-status.mjs releaseStatus'));
```

_First 80 of 103 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

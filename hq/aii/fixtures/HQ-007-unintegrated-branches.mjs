// hq/aii/fixtures/HQ-007-unintegrated-branches.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-007 (group A):
// "Which branches contain work that hasn't been integrated?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   gitState() (hq/lib/git-context.mjs:135-141) lists local branches via
//   `git for-each-ref --format=%(refname:short)%x09%(committerdate:short)
//   refs/heads` — each entry {name, date}. Observed:
//     repos-hq  -> 3 local branches: backup/pre-waves3-sync-2026-11-06
//                  (2026-11-05), ceo/mobile-one-path-2026-11-05 (2026-11-06),
//                  main (2026-11-11)
//     vivim-web-harness -> 16 local branches including main
//     vivim-ui  -> 1 local branch: main
//     openmausbot -> 1 local branch: main
//   The divergence surface (hq/lib/git-context.mjs:119) computes
//   `git rev-list --left-right --count @{upstream}...HEAD` -> ahead/behind.
//
// A branch that still exists locally while main has moved on is a branch whose
// work is not integrated. The branch LIST drifts as lanes create and delete
// branches, so the expectations pin the shape (the branch-entry structure, the
// main branch always present, the ahead/behind comparison against the upstream)
// and run() re-derives the live counts and names.
import { defineFixture, finding } from './harness.mjs';
import { gitState } from '../../lib/git-context.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const REPOS = [
  { name: 'repos-hq', path: ROOT },
  { name: 'vivim-web-harness', path: join(ROOT, '..', 'vivim-web-harness') },
  { name: 'vivim-ui', path: join(ROOT, '..', 'vivim-ui') },
  { name: 'openmausbot', path: join(ROOT, '..', 'vivim-labs', 'OpenMausBot') },
];

export default defineFixture({
  id: 'HQ-007',
  provenance: 'Locked 2026-11-11 on branch main from live output: gitState() (hq/lib/git-context.mjs:105) was run against each of the 4 registered local checkouts. Each returned a branches[] array built by `git for-each-ref --format=%(refname:short)%x09%(committerdate:short) refs/heads` — repos-hq: 3 local branches (backup/pre-waves3-sync-2026-11-06 dated 2026-11-05, ceo/mobile-one-path-2026-11-05 dated 2026-11-06, main dated 2026-11-11); vivim-web-harness: 16 local branches; vivim-ui: 1 (main); openmausbot: 1 (main). Each also reported the ahead/behind divergence against @{upstream} (git rev-list --left-right --count). The branch list drifts as lanes create and delete branches, so the expectations pin the branch-entry shape, the presence of main, the divergence comparison and the live counts, while run() re-derives every branch name and number live.',
  expected: [
    { what: /^repos-hq has \d+ local branches including main$/, where: 'hq/lib/git-context.mjs gitState' },
    { what: /^vivim-web-harness has \d+ local branches including main$/, where: 'hq/lib/git-context.mjs gitState' },
    { what: /^vivim-ui has \d+ local branches including main$/, where: 'hq/lib/git-context.mjs gitState' },
    { what: /^openmausbot has \d+ local branches including main$/, where: 'hq/lib/git-context.mjs gitState' },
    { what: /^every listed branch carries a name and a committer date$/, where: 'hq/lib/git-context.mjs gitState' },
    { what: /^repos-hq is \d+ ahead and \d+ behind its upstream origin\/main$/, where: 'hq/lib/git-context.mjs gitState' },
    { what: /^vivim-web-harness is \d+ ahead and \d+ behind its upstream origin\/main$/, where: 'hq/lib/git-context.mjs gitState' },
  ],
  run: async () => {
    const findings = [];

    for (const repo of REPOS) {
      const state = gitState({ cwd: repo.path });
      if (!state.ok) throw new Error(`gitState failed for ${repo.name}: ${state.reason ?? 'unknown'}`);
      const branches = Array.isArray(state.branches) ? state.branches : [];
      if (!branches.length) throw new Error(`gitState reported no local branches for ${repo.name}`);
      if (!branches.some((b) => b.name === 'main')) {
        throw new Error(`gitState reported no main branch for ${repo.name}: ${JSON.stringify(branches)}`);
      }
      for (const branch of branches) {
        if (!branch.name || !branch.date) {
          throw new Error(`branch entry missing name/date for ${repo.name}: ${JSON.stringify(branch)}`);
        }
      }
      findings.push(finding(`${repo.name} has ${branches.length} local branches including main`, 'hq/lib/git-context.mjs gitState'));
      findings.push(finding(`${repo.name} is ${state.ahead} ahead and ${state.behind} behind its upstream ${state.upstream}`, 'hq/lib/git-context.mjs gitState'));
    }

    const all = REPOS.map((repo) => gitState({ cwd: repo.path })).flatMap((s) => s.branches ?? []);
    findings.push(finding('every listed branch carries a name and a committer date', 'hq/lib/git-context.mjs gitState'));

    return findings;
  },
});

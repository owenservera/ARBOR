// hq/aii/fixtures/HQ-006-local-vs-github.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-006 (group A):
// "What is different between my local checkout and GitHub?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   gitState() (hq/lib/git-context.mjs:105) — the local-vs-remote surface —
//   per registered repository returned: ok:true, branch, head, remote,
//   upstream, ahead, behind, dirty[] (one {status,path} per porcelain line)
//   and branches[]. Observed remotes and branches:
//     repos-hq            main  origin/main  https://github.com/owenservera/repos-hq.git
//     vivim-web-harness   main  origin/main  https://github.com/owenservera/vivim-web-harness.git
//     vivim-ui            main  origin/main  https://github.com/owenservera/tierflow.git
//     openmausbot         main  origin/main  https://github.com/milind-soni/OpenMausBot.git
//   bun hq/bin/hq.mjs since yesterday
//     -> "Changes since yesterday (2026-11-10T01:31:33.996Z)", "Commits: 50",
//        "Dirty files: 444" — both counts drift as lanes commit and work.
//
// The commit SHAs, the ahead/behind numbers and the commit/dirty counts drift
// as concurrent lanes commit, so the expectations pin the remote identities,
// the per-repository divergence FIELDS and the since-summary shape, while
// run() re-derives every number live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { gitState } from '../../lib/git-context.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// The four registered repositories and their local checkout paths (projects.json).
const REPOS = [
  { name: 'repos-hq', path: ROOT, remote: 'https://github.com/owenservera/repos-hq.git' },
  { name: 'vivim-web-harness', path: join(ROOT, '..', 'vivim-web-harness'), remote: 'https://github.com/owenservera/vivim-web-harness.git' },
  { name: 'vivim-ui', path: join(ROOT, '..', 'vivim-ui'), remote: 'https://github.com/owenservera/tierflow.git' },
  { name: 'openmausbot', path: join(ROOT, '..', 'vivim-labs', 'OpenMausBot'), remote: 'https://github.com/milind-soni/OpenMausBot.git' },
];

export default defineFixture({
  id: 'HQ-006',
  provenance: 'Locked 2026-11-11 on branch main from live output: gitState() (hq/lib/git-context.mjs:105) was run against each of the 4 registered local checkouts and returned ok:true with branch, head, remote, upstream, ahead, behind, dirty[] and branches[] — repos-hq (main, origin/main, https://github.com/owenservera/repos-hq.git), vivim-web-harness (main, origin/main, https://github.com/owenservera/vivim-web-harness.git), vivim-ui (main, origin/main, https://github.com/owenservera/tierflow.git), openmausbot (main, origin/main, https://github.com/milind-soni/OpenMausBot.git). bun hq/bin/hq.mjs since yesterday printed the local divergence summary ("Changes since yesterday (<iso>)", "Commits: 50", "Dirty files: 444"). The commit SHAs, the ahead/behind numbers and the commit/dirty counts drift as concurrent lanes commit and work, so the expectations pin the remote identities, the per-repository divergence fields and the since-summary shape while run() re-derives every number live.',
  expected: [
    { what: 'repos-hq local checkout tracks remote https://github.com/owenservera/repos-hq.git', where: 'hq/lib/git-context.mjs gitState' },
    { what: 'vivim-web-harness local checkout tracks remote https://github.com/owenservera/vivim-web-harness.git', where: 'hq/lib/git-context.mjs gitState' },
    { what: 'vivim-ui local checkout tracks remote https://github.com/owenservera/tierflow.git', where: 'hq/lib/git-context.mjs gitState' },
    { what: 'openmausbot local checkout tracks remote https://github.com/milind-soni/OpenMausBot.git', where: 'hq/lib/git-context.mjs gitState' },
    { what: /^repos-hq diverges from origin\/main by \d+ ahead and \d+ behind commits$/, where: 'hq/lib/git-context.mjs gitState' },
    { what: /^repos-hq has \d+ uncommitted file entr(y|ies) in the local checkout$/, where: 'hq/lib/git-context.mjs gitState' },
    { what: /^Changes since yesterday \(\S+\)$/, where: 'hq/bin/hq.mjs since yesterday' },
    { what: /^\d+ commits since yesterday reported against the local checkout$/, where: 'hq/bin/hq.mjs since yesterday' },
    { what: /^\d+ dirty files since yesterday reported against the local checkout$/, where: 'hq/bin/hq.mjs since yesterday' },
  ],
  run: async () => {
    const findings = [];

    for (const repo of REPOS) {
      const state = gitState({ cwd: repo.path });
      if (!state.ok) throw new Error(`gitState failed for ${repo.name}: ${state.reason ?? 'unknown'}`);
      if (state.remote !== repo.remote) {
        throw new Error(`unexpected remote for ${repo.name}: ${state.remote}`);
      }
      if (state.upstream !== 'origin/main') {
        throw new Error(`unexpected upstream for ${repo.name}: ${state.upstream}`);
      }
      findings.push(finding(`${repo.name} local checkout tracks remote ${state.remote}`, 'hq/lib/git-context.mjs gitState'));
      findings.push(finding(`${repo.name} diverges from ${state.upstream} by ${state.ahead} ahead and ${state.behind} behind commits`, 'hq/lib/git-context.mjs gitState'));
      const dirtyCount = Array.isArray(state.dirty) ? state.dirty.length : 0;
      findings.push(finding(`${repo.name} has ${dirtyCount} uncommitted file ${dirtyCount === 1 ? 'entry' : 'entries'} in the local checkout`, 'hq/lib/git-context.mjs gitState'));
    }

    const since = runHq(['since', 'yesterday'], { cwd: ROOT });
    if (since.exit !== 0) throw new Error(`hq since failed: exit=${since.exit} stderr=${since.stderr}`);
    const lines = since.stdout.split('\n').map((l) => l.trimEnd());
    const header = (lines.find((l) => l.startsWith('Changes since yesterday')) ?? '').trim();
    if (!/^Changes since yesterday \(\S+\)$/.test(header)) {
      throw new Error(`unexpected since header: ${JSON.stringify(header)}`);
    }
    findings.push(finding(header, 'hq/bin/hq.mjs since yesterday'));
    const commits = Number((lines.find((l) => l.startsWith('Commits: ')) ?? '').replace('Commits: ', ''));
    if (!Number.isFinite(commits)) throw new Error('hq since printed no Commits count');
    findings.push(finding(`${commits} commits since yesterday reported against the local checkout`, 'hq/bin/hq.mjs since yesterday'));
    const dirty = Number((lines.find((l) => l.startsWith('Dirty files: ')) ?? '').replace('Dirty files: ', ''));
    if (!Number.isFinite(dirty)) throw new Error('hq since printed no Dirty files count');
    findings.push(finding(`${dirty} dirty files since yesterday reported against the local checkout`, 'hq/bin/hq.mjs since yesterday'));

    return findings;
  },
});

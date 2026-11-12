// hq/aii/fixtures/HQ-008-uncommitted-changes.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-008 (group A):
// "Which repositories have uncommitted changes, and what do they affect?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   gitState() (hq/lib/git-context.mjs:121-124) computes dirty per repository
//   from `git status --porcelain`, mapping each line to {status, path}.
//   Observed dirty counts at lock time:
//     repos-hq            -> dirty (72 entries: modified hq/lib/*.mjs,
//                            hq/test/canon.test.mjs, hq/aii/coverage.json,
//                            docs/AII-COVERAGE.md, .zcode/workflows/..., plus
//                            untracked files)
//     vivim-web-harness   -> dirty (4 entries)
//     vivim-ui            -> clean (0 entries)
//     openmausbot         -> clean (0 entries)
//   bun hq/bin/hq.mjs since yesterday prints the same dirty set with its
//   porcelain status, one line per file: "  <project>: <path> (<status>)".
//
// WHICH repositories are dirty is the stable fact and is pinned per repository;
// the per-file counts drift as lanes work, so they are re-derived live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { gitState } from '../../lib/git-context.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const REPOS = [
  { name: 'repos-hq', path: ROOT, dirtyAtLock: true },
  { name: 'vivim-web-harness', path: join(ROOT, '..', 'vivim-web-harness'), dirtyAtLock: true },
  { name: 'vivim-ui', path: join(ROOT, '..', 'vivim-ui'), dirtyAtLock: false },
  { name: 'openmausbot', path: join(ROOT, '..', 'vivim-labs', 'OpenMausBot'), dirtyAtLock: false },
];

export default defineFixture({
  id: 'HQ-008',
  provenance: 'Locked 2026-11-11 on branch main from live output: gitState() (hq/lib/git-context.mjs:121-124) computed dirty per repository from `git status --porcelain`, each line mapped to {status, path}. At lock time repos-hq was dirty (72 entries — modified hq/lib/autonomy.mjs, hq/lib/canon.mjs, hq/lib/dogfood.mjs, hq/lib/evidence-join.mjs, hq/lib/extract.mjs, hq/lib/git-context.mjs, hq/lib/graph.mjs, hq/lib/indexer.mjs, hq/lib/lake.mjs, hq/lib/pmo.mjs, hq/lib/registry.mjs, hq/lib/release-plan.mjs, hq/lib/semantic-registry.mjs, hq/lib/team-panel.mjs, hq/lib/work-orders.mjs, hq/lib/zcode-doctor.mjs, hq/test/canon.test.mjs, hq/aii/coverage.json, docs/AII-COVERAGE.md, .zcode/workflows/aii-coverage.dwf.ts plus untracked files) and vivim-web-harness was dirty (4 entries); vivim-ui and openmausbot were clean (0 entries). bun hq/bin/hq.mjs since yesterday printed the same dirty set as "  <project>: <path> (<status>)" lines. The per-file counts drift as lanes work, so the expectations pin WHICH repositories are dirty (a per-repository dirty/clean verdict) and the shape of the dirty entries, while run() re-derives the live counts and paths.',
  expected: [
    { what: 'repos-hq has uncommitted changes in the working tree', where: 'hq/lib/git-context.mjs gitState' },
    { what: 'vivim-web-harness has uncommitted changes in the working tree', where: 'hq/lib/git-context.mjs gitState' },
    { what: 'vivim-ui has no uncommitted changes in the working tree', where: 'hq/lib/git-context.mjs gitState' },
    { what: 'openmausbot has no uncommitted changes in the working tree', where: 'hq/lib/git-context.mjs gitState' },
    { what: /^every dirty entry carries a porcelain status and a path$/, where: 'hq/lib/git-context.mjs gitState' },
    { what: /^repos-hq has \d+ uncommitted file entr(y|ies)$/, where: 'hq/lib/git-context.mjs gitState' },
    { what: /^hq since lists dirty files per repository as <project>: <path> \(<status>\)$/, where: 'hq/bin/hq.mjs since yesterday' },
  ],
  run: async () => {
    const findings = [];

    for (const repo of REPOS) {
      const state = gitState({ cwd: repo.path });
      if (!state.ok) throw new Error(`gitState failed for ${repo.name}: ${state.reason ?? 'unknown'}`);
      const dirty = Array.isArray(state.dirty) ? state.dirty : [];
      for (const entry of dirty) {
        if (!entry.status || !entry.path) {
          throw new Error(`dirty entry missing status/path for ${repo.name}: ${JSON.stringify(entry)}`);
        }
      }
      findings.push(finding(
        dirty.length ? `${repo.name} has uncommitted changes in the working tree` : `${repo.name} has no uncommitted changes in the working tree`,
        'hq/lib/git-context.mjs gitState',
      ));
      findings.push(finding(`${repo.name} has ${dirty.length} uncommitted file ${dirty.length === 1 ? 'entry' : 'entries'}`, 'hq/lib/git-context.mjs gitState'));
    }

    const allDirty = REPOS.flatMap((repo) => gitState({ cwd: repo.path }).dirty ?? []);
    findings.push(finding('every dirty entry carries a porcelain status and a path', 'hq/lib/git-context.mjs gitState'));

    const since = runHq(['since', 'yesterday'], { cwd: ROOT });
    if (since.exit !== 0) throw new Error(`hq since failed: exit=${since.exit} stderr=${since.stderr}`);
    const dirtyLines = since.stdout.split('\n').map((l) => l.trim()).filter((l) => /^[^:\s]+: .+ \(\S+\)$/.test(l));
    if (!dirtyLines.length) throw new Error('hq since printed no dirty file lines');
    const sample = dirtyLines[0];
    if (!/^[^:\s]+: .+ \(\S+\)$/.test(sample)) {
      throw new Error(`unexpected dirty line shape: ${JSON.stringify(sample)}`);
    }
    findings.push(finding('hq since lists dirty files per repository as <project>: <path> (<status>)', 'hq/bin/hq.mjs since yesterday'));

    return findings;
  },
});

// hq/aii/fixtures/HQ-079-merge-evidence-gap.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-079 (group I): "What additional evidence
// do we need before merging these branches?"
//
// Engine: hq/lib/lake.mjs `mergeEvidenceGap` (added by lane
// p1-regression-merge-evidence). Ground truth locked 2026-11-11 by running the
// real module against a synthetic git workspace with two diverging branches
// (see PROVENANCE). The fixture re-derives every finding live at run time.
//
// Synthetic/seeded data only: a throwaway git repo in the OS temp dir with
// fixed author/committer dates. No credentials, no private session content, no
// provider messages, no Host-world writes — the probe only reads git history
// through lake.mjs and writes to a temp directory.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openMemoryDb } from '../../lib/schema.mjs';
import { ingestProject, mergeEvidenceGap } from '../../lib/lake.mjs';
import { defineFixture, finding } from './harness.mjs';

const PROVENANCE = `Ground truth locked 2026-11-11 by running the real hq/lib/lake.mjs
mergeEvidenceGap() against a synthetic git workspace (the same one this fixture
rebuilds at run time), and pinning exactly what it returned:

  bun C:/Users/VIVIM.inc/AppData/Local/Temp/probe-hq079.mjs
    log --oneline --all --graph:
    * eef7d36 feat(main): main-only change
    * 8cac72c feat(main): change shared file
    | * 2ecaa67 feat(feature): feature-only change
    | * 939fb10 feat(feature): change shared file
    |/
    * 048f8c9 feat: base
    ingest: {"project":"demo","inserted":3,"skipped":0,"commits":3}

    === BARE (no evidence surfaces supplied) ===
    changedFiles     : ["src/feature-only.js","src/main-only.js","src/shared.js"]
    conflictingFiles : ["src/shared.js"]
    aNotInB len      : 2
    bNotInA len      : 2
    missing classes  : ["branch_since","unresolved_conflicts","untested_changed_files","absent_receipts"]
       - branch_since :: no since evidence for divergent commits on main <-> feature
       - unresolved_conflicts :: same file changed on both branches: src/shared.js
       - untested_changed_files :: no verify result for changed files: src/feature-only.js, src/main-only.js, src/shared.js
       - absent_receipts :: no receipts recorded for this merge decision

    === SUPPLIED (since/verify/conflicts/drift present) ===
    missing classes  : ["unresolved_conflicts","untested_changed_files","absent_receipts","dirty_tree","stale_index"]
       - unresolved_conflicts :: same file changed on both branches: src/shared.js
       - untested_changed_files :: changed files without test evidence: src/feature-only.js, src/main-only.js, src/shared.js
       - absent_receipts :: no receipts recorded for this merge decision
       - dirty_tree :: uncommitted files: src/feature-only.js
       - stale_index :: files changed since last index: demo

The pinned ground truth is the semantic evidence-class set (which classes are
named and what they name), not a stored copy of the output. Re-derive live to
confirm.`;

function buildWorkspace(root) {
  const git = (args, opts = {}) => execFileSync('git', args, {
    cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts,
  });
  const write = (rel, content) => {
    const abs = join(root, rel);
    mkdirSync(join(abs, '..'), { recursive: true });
    writeFileSync(abs, content, 'utf8');
  };
  const commit = (message, iso) => {
    git(['add', '-A']);
    git(['commit', '-q', '-m', message], {
      env: { ...process.env, GIT_AUTHOR_DATE: iso, GIT_COMMITTER_DATE: iso },
    });
  };

  git(['init', '-q', '-b', 'main']);
  git(['config', 'user.email', 'hq@example.test']);
  git(['config', 'user.name', 'HQ Fixture']);

  // Common base — both branches descend from this commit.
  write('README.md', '# Demo\n');
  write('src/shared.js', 'export const shared = 1;\n');
  commit('feat: base', '2024-01-01T10:00:00+00:00');

  // feature branches OFF THE BASE, so main and feature truly diverge.
  git(['checkout', '-q', '-b', 'feature']);
  write('src/shared.js', 'export const shared = 2;\n');
  commit('feat(feature): change shared file', '2024-01-02T10:00:00+00:00');
  write('src/feature-only.js', 'export const featureOnly = 1;\n');
  commit('feat(feature): feature-only change', '2024-01-03T10:00:00+00:00');

  // Back to main (still at the base) and move main ahead — also touching the
  // same shared file, which is what makes it a merge-conflict candidate.
  git(['checkout', '-q', 'main']);
  write('src/shared.js', 'export const shared = 3;\n');
  commit('feat(main): change shared file', '2024-01-04T10:00:00+00:00');
  write('src/main-only.js', 'export const mainOnly = 1;\n');
  commit('feat(main): main-only change', '2024-01-05T10:00:00+00:00');

  return { baseSha: git(['rev-parse', 'main~2']).trim() };
}

export default defineFixture({
  id: 'HQ-079',
  provenance: PROVENANCE,
  expected: [
    finding('missing evidence classes: branch_since, unresolved_conflicts, untested_changed_files, absent_receipts', 'hq/lib/lake.mjs mergeEvidenceGap'),
    finding('same file changed on both branches: src/shared.js', 'hq/lib/lake.mjs mergeEvidenceGap'),
    finding('no verify result for changed files: src/feature-only.js, src/main-only.js, src/shared.js', 'hq/lib/lake.mjs mergeEvidenceGap'),
    finding('no receipts recorded for this merge decision', 'hq/lib/lake.mjs mergeEvidenceGap'),
    finding('no since evidence for divergent commits on main <-> feature', 'hq/lib/lake.mjs mergeEvidenceGap'),
    finding('branches diverge: 2 commits only on main, 2 commits only on feature', 'hq/lib/lake.mjs mergeEvidenceGap'),
    finding('conflicting files changed on both branches: src/shared.js', 'hq/lib/lake.mjs mergeEvidenceGap'),
    finding('with since/verify/conflicts/drift supplied, still missing: unresolved_conflicts, untested_changed_files, absent_receipts, dirty_tree, stale_index', 'hq/lib/lake.mjs mergeEvidenceGap'),
  ],
  run: async () => {
    const root = mkdtempSync(join(tmpdir(), 'hq079-fixture-'));
    try {
      buildWorkspace(root);
      const db = openMemoryDb();
      try {
        const project = { name: 'demo', path: root };
        ingestProject(db, project);

        const findings = [];

        // (a) No evidence surfaces supplied at all: every evidence class the
        //     merge needs is missing.
        const bare = mergeEvidenceGap(db, { project, branchA: 'main', branchB: 'feature' });
        findings.push(finding(
          `missing evidence classes: ${bare.missingEvidence.map((m) => m.class).join(', ')}`,
          'hq/lib/lake.mjs mergeEvidenceGap',
        ));

        const byClass = new Map(bare.missingEvidence.map((m) => [m.class, m.detail]));
        findings.push(finding(
          byClass.get('unresolved_conflicts') ?? 'unresolved_conflicts not reported',
          'hq/lib/lake.mjs mergeEvidenceGap',
        ));
        findings.push(finding(
          byClass.get('untested_changed_files') ?? 'untested_changed_files not reported',
          'hq/lib/lake.mjs mergeEvidenceGap',
        ));
        findings.push(finding(
          byClass.get('absent_receipts') ?? 'absent_receipts not reported',
          'hq/lib/lake.mjs mergeEvidenceGap',
        ));
        findings.push(finding(
          byClass.get('branch_since') ?? 'branch_since not reported',
          'hq/lib/lake.mjs mergeEvidenceGap',
        ));

        // (b) The two branches really do diverge, each with its own commits.
        findings.push(finding(
          `branches diverge: ${bare.divergence.aNotInB.length} commits only on main, ${bare.divergence.bNotInA.length} commits only on feature`,
          'hq/lib/lake.mjs mergeEvidenceGap',
        ));

        // (c) The conflicting file is the one both sides changed.
        findings.push(finding(
          `conflicting files changed on both branches: ${bare.conflictingFiles.join(', ')}`,
          'hq/lib/lake.mjs mergeEvidenceGap',
        ));

        // (d) Supplying since/verify/conflicts/drift clears branch_since and
        //     adds the drift-derived classes; the conflict, test-evidence and
        //     receipt gaps persist because the underlying facts persist.
        const supplied = mergeEvidenceGap(db, {
          project, branchA: 'main', branchB: 'feature',
          since: { commits: 2 },
          verify: { ok: true },
          conflicts: [],
          drift: {
            dirty: [{ project: 'demo', files: ['src/feature-only.js'] }],
            staleIndex: [{ project: 'demo', changedSinceIndex: 3 }],
          },
        });
        findings.push(finding(
          `with since/verify/conflicts/drift supplied, still missing: ${supplied.missingEvidence.map((m) => m.class).join(', ')}`,
          'hq/lib/lake.mjs mergeEvidenceGap',
        ));

        return findings;
      } finally {
        db.close();
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
});

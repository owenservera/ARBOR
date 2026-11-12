// hq/aii/fixtures/HQ-096-challenge-conclusions.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-096 (group L):
// "Challenge your previous conclusions and look for evidence that could
// disprove them."
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   verifyContext(bundle) (hq/lib/context.mjs:847) re-reads every bundle
//   source, recomputes the sha256 per line range and the whole-bundle digest,
//   and returns { valid, expected, current, changed[] } — a conclusion is
//   DISPROVED exactly when a source hash changed (valid false, changed[] lists
//   the ref). Proven live on a SEEDED bundle (a temp file that was edited
//   between compose and verify): valid=false and the edited ref appears in
//   changed[]. The workspace index is never written.
//   bun hq/bin/hq.mjs conflicts
//     -> 4 duplicate_term conflicts, each "CANON term <term> is defined in 2
//        sources and was not merged" — recorded, self-contradicting conclusions.
//   collectStaleFiles() (hq/lib/freshness.mjs:19) returns {reason:
//   'new'|'changed'|'deleted'} for index-vs-disk drift — the evidence that a
//   previous snapshot no longer holds.
//
// The disproval mechanism (verifyContext flips valid on a changed source) and
// the duplicate-term conflicts are pinned; live drift counts are re-derived.
import { defineFixture, finding, runHq } from './harness.mjs';
import { composeContext, verifyContext } from '../../lib/context.mjs';
import { openDb } from '../../lib/schema.mjs';
import { documentHealth } from '../../lib/canon.mjs';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// The duplicate CANON terms recorded as conflicting conclusions (locked live).
const CONFLICT_TERMS = [
  'every case asserts the transport was NOT called where the policy refuses',
  'pure: no fs, no childprocess, no clock read. now is an argument and is required',
];

export default defineFixture({
  id: 'HQ-096',
  provenance: 'Locked 2026-11-11 on branch main from live output and seeded proof: verifyContext(bundle) (hq/lib/context.mjs:847) re-reads every source, recomputes per-range sha256 and the bundle digest, returning { valid, expected, current, changed[] }; a SEEDED bundle built over a temp file (composeContext over the real module with the temp file in the workspace, then the file edited) verified as valid=false with the edited ref listed in changed[] — the mechanism that disproves a previous conclusion, proven without writing the workspace index. bun hq/bin/hq.mjs conflicts printed 4 duplicate_term conflicts, each "CANON term <term> is defined in 2 sources and was not merged", including "every case asserts the transport was NOT called where the policy refuses" (hq/test/channel-broker.test.mjs, hq/test/channel-seat.test.mjs) and "pure: no fs, no childprocess, no clock read. now is an argument and is required" (hq/lib/revive-daemon.mjs, hq/lib/revive-lane.mjs). documentHealth(db) (hq/lib/canon.mjs:192) returned the same conflicts. collectStaleFiles() (hq/lib/freshness.mjs:19) returns reason new|changed|deleted for index-vs-disk drift. The disproval mechanism and the two recorded contradictions are pinned exactly; live drift counts are re-derived.',
  expected: [
    { what: 'a conclusion backed by a changed source is disproved: verifyContext flips valid and names the changed ref', where: 'hq/lib/context.mjs verifyContext' },
    { what: 'an unmodified bundle verifies as valid=true with no changed sources', where: 'hq/lib/context.mjs verifyContext' },
    { what: 'the challenge surface lists the ref whose sha256 no longer matches', where: 'hq/lib/context.mjs verifyContext' },
    { what: 'recorded contradiction: "every case asserts the transport was NOT called where the policy refuses" is defined in 2 sources and was not merged', where: 'hq/lib/canon.mjs documentHealth' },
    { what: 'recorded contradiction: "pure: no fs, no childprocess, no clock read. now is an argument and is required" is defined in 2 sources and was not merged', where: 'hq/lib/canon.mjs documentHealth' },
    { what: 'the staleness walk reports index-vs-disk drift with reasons new, changed, deleted', where: 'hq/lib/freshness.mjs collectStaleFiles' },
  ],
  run: async () => {
    const findings = [];

    // Seeded disproval proof on a temp workspace, read-only w.r.t. the repo.
    const tmp = mkdtempSync(join(tmpdir(), 'hq096-fixture-'));
    try {
      const docPath = join(tmp, 'challenge-target.md');
      writeFileSync(docPath, '# Challenge target\n\nInitial conclusion text.\n', 'utf8');
      const db = openDb(join(ROOT, '.hq', 'index.db'));
      let bundle;
      try {
        // A real bundle over the live index: compose and verify in the same
        // state, so nothing has changed on disk between the two steps.
        bundle = composeContext(db, { task: 'git context', budgetTokens: 2000 });
      } finally {
        db.close();
      }
      const verified = verifyContext(bundle);
      if (verified.valid !== true || verified.changed.length !== 0) {
        throw new Error(`a freshly composed bundle must verify clean: ${JSON.stringify({ valid: verified.valid, changed: verified.changed })}`);
      }
      findings.push(finding('an unmodified bundle verifies as valid=true with no changed sources', 'hq/lib/context.mjs verifyContext'));

      // Seed a bundle whose source digest matches the file's INITIAL content,
      // then edit the file: verifyContext must disprove the conclusion and
      // name the changed ref.
      const { sha256 } = await import('../../lib/util.mjs');
      const initial = '# Challenge target\n\nInitial conclusion text.\n';
      const sourceBundle = {
        task: 'challenge target conclusion',
        digest: null,
        sources: [{
          ref: 'seed:challenge-target.md',
          project: 'seed',
          path: docPath,
          kind: 'doc',
          lang: 'markdown',
          sha256: sha256(initial),
          lines: [1, 1],
          estimatedTokens: 10,
          score: 1,
          reason: 'seed',
          digest: null,
          absPath: docPath,
        }],
      };
      writeFileSync(docPath, '# Challenge target\n\nREVISED conclusion text.\n', 'utf8');
      const afterEdit = verifyContext(sourceBundle);
      if (afterEdit.valid !== false) {
        throw new Error('verifyContext did not disprove the conclusion after the source changed');
      }
      if (!afterEdit.changed.includes('seed:challenge-target.md')) {
        throw new Error(`changed[] lacks the edited ref: ${JSON.stringify(afterEdit.changed)}`);
      }
      findings.push(finding('a conclusion backed by a changed source is disproved: verifyContext flips valid and names the changed ref', 'hq/lib/context.mjs verifyContext'));
      findings.push(finding('the challenge surface lists the ref whose sha256 no longer matches', 'hq/lib/context.mjs verifyContext'));
      // A bundle without a recorded digest is NOT verifiable — memory is not
      // authority (verifyContext requires expected === current).
      const noDigest = verifyContext({ task: 'x', digest: null, sources: [] });
      if (noDigest.valid !== false || noDigest.expected !== null) {
        throw new Error(`a digest-less bundle must be unverifiable: ${JSON.stringify(noDigest)}`);
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }

    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const health = documentHealth(db, { root: ROOT });
      const conflicts = (health.conflicts ?? []).filter((c) => c.kind === 'duplicate_term');
      const byTerm = new Map(conflicts.map((c) => [c.a, c]));
      for (const term of CONFLICT_TERMS) {
        const conflict = byTerm.get(term);
        if (!conflict) throw new Error(`expected a recorded contradiction for ${JSON.stringify(term)}`);
        if (!/is defined in 2 sources and was not merged/.test(String(conflict.message))) {
          throw new Error(`unexpected conflict message: ${conflict.message}`);
        }
        findings.push(finding(`recorded contradiction: "${term}" is defined in 2 sources and was not merged`, 'hq/lib/canon.mjs documentHealth'));
      }
    } finally {
      db.close();
    }

    const db2 = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const { collectStaleFiles } = await import('../../lib/freshness.mjs');
      const { loadConfig, projectsForIndex } = await import('../../lib/registry.mjs');
      const stale = await collectStaleFiles({ db: db2, config: loadConfig(ROOT), projects: projectsForIndex(ROOT) });
      const reasons = [...new Set(stale.map((s) => s.reason))].sort();
      if (reasons.join(', ') !== 'changed, deleted, new') {
        throw new Error(`unexpected drift reasons: ${reasons.join(', ')}`);
      }
      findings.push(finding('the staleness walk reports index-vs-disk drift with reasons new, changed, deleted', 'hq/lib/freshness.mjs collectStaleFiles'));
    } finally {
      db2.close();
    }

    return findings;
  },
});

// hq/aii/fixtures/HQ-056-disagreeing-completion-reports.mjs
// AII scenario HQ-056 (group G): "Why do two reports disagree about whether this feature is finished?"
// Engine: hq conflicts (canon.mjs documentHealth) + hq docs health (canon.mjs:1955 staleDocs)
// + hq/lib/dogfood.mjs evidenceTasks (dogfood.mjs:857) — the report-disagreement surfaces.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - bun hq/bin/hq.mjs conflicts printed 4 duplicate_term conflicts, each naming the two
//     disagreeing sources (stable structure, re-derived live at run time).
//   - bun hq/bin/hq.mjs docs health printed "Missing families: 3 · Orphans: 885 · Stale: 114"
//     (stale count drifts with doc touches → re-derived live with a bounded RegExp).
//   - The completion disagreement mechanism: evidenceTasks flags "evidence state is CLAIMED,
//     not observed" (dogfood.mjs:875) — one report says OK (the receipt), the other says the
//     outcome was never observed.

import { defineFixture, finding } from './harness.mjs';
import { evidenceTasks } from '../../lib/dogfood.mjs';
import { runHq } from './harness.mjs';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-056',
  provenance:
    '2026-11-11 (this session): locked from live CLI output on branch main — bun hq/bin/hq.mjs conflicts printed ' +
    '4 duplicate_term conflicts, each naming two disagreeing sources (canon.mjs documentHealth); bun hq/bin/hq.mjs ' +
    'docs health printed "Missing families: 3 · Orphans: 885 · Stale: 114" (staleDocs, canon.mjs:1955-1978 — the ' +
    'stale count drifts as docs are touched and is re-derived live). The receipt-vs-outcome disagreement mechanism is ' +
    'exercised on seeded rows through evidenceTasks (dogfood.mjs:857): an OK receipt whose outcome evidenceState is ' +
    'CLAIMED is exactly the two-reports-disagree shape (dogfood.mjs:875).',
  expected: [
    { what: 'the conflicts surface reports duplicate_term conflicts naming two disagreeing sources each', where: 'hq conflicts (canon.mjs documentHealth)' },
    { what: /^stale docs \(bounded count, re-derived: \d+\) are the doc-says-finished disagreement source$/, where: 'hq docs health (canon.mjs staleDocs)' },
    { what: 'one report says OK while the outcome evidence is CLAIMED, not observed — the completion disagreement', where: 'hq/lib/dogfood.mjs evidenceTasks' },
    { what: 'an OK effect contradicted by its outcome effect is the second disagreement shape', where: 'hq/lib/dogfood.mjs evidenceTasks' },
    { what: 'both reports name their sources — the disagreement is explainable, not silent', where: 'hq conflicts (canon.mjs documentHealth)' },
  ],
  run: async () => {
    const findings = [];

    const conf = runHq(['conflicts'], { cwd: ROOT });
    if (conf.exit !== 0) throw new Error(`hq conflicts failed: exit=${conf.exit} ${conf.stderr}`);
    const conflictLines = conf.stdout.split('\n').filter((l) => l.startsWith('duplicate_term'));
    if (conflictLines.length < 1) throw new Error(`no duplicate_term conflicts: ${conf.stdout.slice(0, 200)}`);
    for (const line of conflictLines) {
      const parts = line.split('\t');
      if (parts.length < 4 || !parts[2].includes(',')) {
        throw new Error(`conflict line does not name two sources: ${line.slice(0, 120)}`);
      }
    }
    findings.push(finding('the conflicts surface reports duplicate_term conflicts naming two disagreeing sources each', 'hq conflicts (canon.mjs documentHealth)'));
    findings.push(finding('both reports name their sources — the disagreement is explainable, not silent', 'hq conflicts (canon.mjs documentHealth)'));

    const health = runHq(['docs', 'health'], { cwd: ROOT });
    if (health.exit !== 0) throw new Error(`hq docs health failed: exit=${health.exit} ${health.stderr}`);
    const stale = health.stdout.match(/Stale:\s*(\d+)/);
    if (!stale || Number(stale[1]) < 1) throw new Error(`no stale docs: ${health.stdout.slice(0, 200)}`);
    findings.push(finding(`stale docs (bounded count, re-derived: ${stale[1]}) are the doc-says-finished disagreement source`, 'hq docs health (canon.mjs staleDocs)'));

    const { tasks } = evidenceTasks(
      [{ receiptId: 'rcpt_seed_claims_done', requestId: 'req-301', actor: { id: 'chatgpt' }, effect: 'OK', thread: { after: 'thread-301' } }],
      [{ requestId: 'req-301', effect: 'OK', evidenceState: 'CLAIMED' }],
    );
    const claimed = tasks.find((t) => t.quote === 'evidence state is CLAIMED, not observed');
    if (!claimed) throw new Error(`CLAIMED disagreement not flagged: ${JSON.stringify(tasks)}`);
    findings.push(finding('one report says OK while the outcome evidence is CLAIMED, not observed — the completion disagreement', 'hq/lib/dogfood.mjs evidenceTasks'));

    const { tasks: t2 } = evidenceTasks(
      [{ receiptId: 'rcpt_seed_ok_fail', requestId: 'req-302', actor: { id: 'gemini' }, effect: 'OK', thread: { after: 'thread-302' } }],
      [{ requestId: 'req-302', effect: 'SEND_FAILED' }],
    );
    if (!t2.some((t) => t.quote === 'effect OK but outcome says SEND_FAILED')) {
      throw new Error(`OK-vs-outcome disagreement not flagged: ${JSON.stringify(t2)}`);
    }
    findings.push(finding('an OK effect contradicted by its outcome effect is the second disagreement shape', 'hq/lib/dogfood.mjs evidenceTasks'));

    return findings;
  },
});

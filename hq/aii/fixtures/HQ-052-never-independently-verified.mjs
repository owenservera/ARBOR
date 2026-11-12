// hq/aii/fixtures/HQ-052-never-independently-verified.mjs
// AII scenario HQ-052 (group F): "Which reported successes were never independently verified?"
// Engine: hq/lib/dogfood.mjs evidenceTasks (dogfood.mjs:857) + the dogfood recon register.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - evidenceTasks(receipts, outcomes) (hq/lib/dogfood.mjs:857-899) flags exactly the
//     unverified successes: OK effect with no outcome, OK vs disagreeing outcome, CLAIMED
//     evidence state (dogfood.mjs:875), placeholder-thread touches (dogfood.mjs:877).
//   - Live recon register re-derived this session: dogfood/recon/*.json holds 18 rows —
//     3 blocked, 12 partial, 2 absent, 1 proven (statuses verified by reading the files);
//     RECON_STATES = ['proven','partial','blocked','absent'] (dogfood.mjs:45).

import { defineFixture, finding } from './harness.mjs';
import { evidenceTasks } from '../../lib/dogfood.mjs';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname ?? '.', '..', '..', '..');

// Seeded channel receipts/outcomes covering each unverified-success shape.
const RECEIPTS = [
  { receiptId: 'rcpt_seed_ok_no_outcome', requestId: 'req-101', actor: { id: 'chatgpt' }, effect: 'OK', thread: { after: 'thread-a' } },
  { receiptId: 'rcpt_seed_claimed', requestId: 'req-102', actor: { id: 'gemini' }, effect: 'OK', thread: { after: 'thread-b' } },
  { receiptId: 'rcpt_seed_disagree', requestId: 'req-103', actor: { id: 'claude' }, effect: 'OK', thread: { after: 'thread-c' } },
  { receiptId: 'rcpt_seed_placeholder', requestId: 'req-104', actor: { id: 'claude' }, effect: 'OK', thread: { after: 'live-tab capture' } },
  // req-104 carries an observed outcome so the placeholder-thread check (dogfood.mjs:876-879,
  // applied only when no stronger mismatch exists) is what flags it.
  { receiptId: 'rcpt_seed_verified', requestId: 'req-105', actor: { id: 'chatgpt' }, effect: 'OK', thread: { after: 'thread-e' } },
];
const OUTCOMES = [
  { requestId: 'req-102', effect: 'OK', evidenceState: 'CLAIMED' },
  { requestId: 'req-103', effect: 'SEND_FAILED' },
  { requestId: 'req-104', effect: 'OK', evidenceState: 'observed' },
  { requestId: 'req-105', effect: 'OK', evidenceState: 'observed' },
];

export default defineFixture({
  id: 'HQ-052',
  provenance:
    '2026-11-11 (this session): locked from the engine named by hq/aii/assessments/lane-6.json HQ-052 capSurfaces. ' +
    'evidenceTasks(receipts, outcomes) (hq/lib/dogfood.mjs:857-899) was exercised on seeded receipts/outcomes covering ' +
    'each unverified-success shape (no workspace writes). Live recon register re-derived this session by reading ' +
    'dogfood/recon/*.json: 18 rows with statuses {blocked:3, partial:12, absent:2, proven:1}; RECON_STATES ' +
    "(dogfood.mjs:45) = ['proven','partial','blocked','absent'] — 'not_verified' means unproven, never missing " +
    '(dogfood.mjs:18). The live recon count is re-derived at run time; the seeded classification is pinned.',
  expected: [
    { what: 'an OK effect with no outcome for its requestId is unproven, not fine', where: 'hq/lib/dogfood.mjs evidenceTasks' },
    { what: 'evidence state CLAIMED with an OK effect is not independent verification', where: 'hq/lib/dogfood.mjs evidenceTasks' },
    { what: 'an OK effect contradicted by its outcome effect is flagged for verification', where: 'hq/lib/dogfood.mjs evidenceTasks' },
    { what: 'a receipt touching a placeholder/live-tab thread is flagged', where: 'hq/lib/dogfood.mjs evidenceTasks' },
    { what: 'a receipt whose outcome is OK with observed evidence state passes as verified', where: 'hq/lib/dogfood.mjs evidenceTasks' },
    { what: /^the live dogfood recon register holds \d+ rows with statuses \{.*\} — unproven rows are ranked work, not success$/, where: 'dogfood/recon' },
  ],
  run: async () => {
    const findings = [];
    const { tasks, defects } = evidenceTasks(RECEIPTS, OUTCOMES);
    const whyOf = (requestId) => tasks.find((t) => t.proof?.includes(requestId))?.quote ?? null;

    if (whyOf('req-101') !== 'effect OK but no outcome for this requestId') {
      throw new Error(`req-101 not flagged as OK-without-outcome: ${JSON.stringify(tasks)}`);
    }
    findings.push(finding('an OK effect with no outcome for its requestId is unproven, not fine', 'hq/lib/dogfood.mjs evidenceTasks'));

    if (whyOf('req-102') !== 'evidence state is CLAIMED, not observed') {
      throw new Error(`req-102 not flagged as CLAIMED: ${JSON.stringify(tasks)}`);
    }
    findings.push(finding('evidence state CLAIMED with an OK effect is not independent verification', 'hq/lib/dogfood.mjs evidenceTasks'));

    if (whyOf('req-103') !== 'effect OK but outcome says SEND_FAILED') {
      throw new Error(`req-103 not flagged as disagreeing: ${JSON.stringify(tasks)}`);
    }
    findings.push(finding('an OK effect contradicted by its outcome effect is flagged for verification', 'hq/lib/dogfood.mjs evidenceTasks'));

    if (!/placeholder thread/.test(whyOf('req-104') ?? '')) {
      throw new Error(`req-104 not flagged as placeholder: ${JSON.stringify(tasks)}`);
    }
    findings.push(finding('a receipt touching a placeholder/live-tab thread is flagged', 'hq/lib/dogfood.mjs evidenceTasks'));

    if (whyOf('req-105') !== null) throw new Error(`verified receipt was flagged: ${whyOf('req-105')}`);
    findings.push(finding('a receipt whose outcome is OK with observed evidence state passes as verified', 'hq/lib/dogfood.mjs evidenceTasks'));

    // Live recon register (read-only).
    const reconDir = join(ROOT, 'dogfood', 'recon');
    const rows = readdirSync(reconDir).filter((f) => f.endsWith('.json'))
      .map((f) => JSON.parse(readFileSync(join(reconDir, f), 'utf8')));
    const counts = {};
    for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;
    const unproven = (counts.partial ?? 0) + (counts.blocked ?? 0) + (counts.absent ?? 0);
    if (unproven < 1) throw new Error(`no unproven recon rows: ${JSON.stringify(counts)}`);
    findings.push(finding(`the live dogfood recon register holds ${rows.length} rows with statuses ${JSON.stringify(counts)} — unproven rows are ranked work, not success`, 'dogfood/recon'));
    return findings;
  },
});

// hq/aii/fixtures/HQ-041-superseded-decisions.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-041 (group E):
// "Which architectural decisions have been superseded?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs decisions --status superseded
//     -> "No decisions." (exit 0) — the superseded set is EMPTY.
//   bun hq/bin/hq.mjs decisions
//     -> 50 rows: 1 proposed + 49 observed. The proposed one is
//        DEC-2026-11-05-ONE-VERTICAL-SLICE (authority architecture,
//        date 2026-11-05, source_path
//        docs/decisions/DEC-2026-11-05-ONE-VERTICAL-SLICE.md).
//   decisionRegister(db, { status: 'superseded' }) (hq/lib/canon.mjs:1752)
//     -> [] on the live index: zero decisions carry status 'superseded'.
//   supersedeDecision(db, { id, by, ownerConfirmed }) (hq/lib/canon.mjs:1820)
//     -> without ownerConfirmed it refuses with
//        "OWNER_CONFIRMATION_REQUIRED: the owner must confirm this promotion
//        explicitly"; with ownerConfirmed it records the supersession by
//        closing the old row (valid_to) and keeping both rows.
//
// The question is "which decisions have been superseded", so the live answer —
// NONE — is the pinned ground truth, and the mechanism that would produce one
// is proven on a seeded in-memory database (read-only w.r.t. the workspace).
import { defineFixture, finding, runHq } from './harness.mjs';
import { openDb, openMemoryDb } from '../../lib/schema.mjs';
import { decisionRegister, supersedeDecision } from '../../lib/canon.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-041',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs decisions --status superseded printed "No decisions." and exited 0 — the live superseded set is EMPTY. bun hq/bin/hq.mjs decisions printed 50 rows, 1 proposed (DEC-2026-11-05-ONE-VERTICAL-SLICE, authority architecture, date 2026-11-05, source_path docs/decisions/DEC-2026-11-05-ONE-VERTICAL-SLICE.md) and 49 observed. decisionRegister(db, { status: "superseded" }) (hq/lib/canon.mjs:1752) returned [] against the live index, so zero decisions carry status superseded. supersedeDecision() (hq/lib/canon.mjs:1820) was then exercised on a seeded IN-MEMORY database: without ownerConfirmed it refuses with "OWNER_CONFIRMATION_REQUIRED: the owner must confirm this promotion explicitly", and with ownerConfirmed it records the supersession while keeping both rows (the old row closed with valid_to, the new row carrying status superseded). The live empty supersession set is the pinned ground truth; the mechanism is proven on seeded data so the workspace index is never written.',
  expected: [
    { what: 'no decision in the live register is superseded', where: 'hq/lib/canon.mjs decisionRegister' },
    { what: 'the superseded decision set is empty', where: 'hq/bin/hq.mjs decisions --status superseded' },
    { what: 'the decision register holds proposed and observed decisions', where: 'hq/lib/canon.mjs decisionRegister' },
    { what: /^\d+ decisions in the live register$/, where: 'hq/lib/canon.mjs decisionRegister' },
    { what: 'supersedeDecision refuses without owner confirmation', where: 'hq/lib/canon.mjs supersedeDecision' },
    { what: 'supersedeDecision records the supersession and keeps both rows', where: 'hq/lib/canon.mjs supersedeDecision' },
  ],
  run: async () => {
    const findings = [];

    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const superseded = decisionRegister(db, { status: 'superseded' });
      if (superseded.length !== 0) {
        throw new Error(`expected 0 superseded decisions, got ${superseded.length}`);
      }
      findings.push(finding('no decision in the live register is superseded', 'hq/lib/canon.mjs decisionRegister'));

      const all = decisionRegister(db, {});
      const statuses = [...new Set(all.map((d) => d.status))].sort();
      if (statuses.join(', ') !== 'observed, proposed') {
        throw new Error(`unexpected decision statuses: ${statuses.join(', ')}`);
      }
      findings.push(finding('the decision register holds proposed and observed decisions', 'hq/lib/canon.mjs decisionRegister'));
      findings.push(finding(`${all.length} decisions in the live register`, 'hq/lib/canon.mjs decisionRegister'));
    } finally {
      db.close();
    }

    const cli = runHq(['decisions', '--status', 'superseded'], { cwd: ROOT });
    if (cli.exit !== 0) throw new Error(`hq decisions --status superseded failed: exit=${cli.exit} stderr=${cli.stderr}`);
    const text = cli.stdout.trim();
    if (text !== 'No decisions.') {
      throw new Error(`unexpected CLI output: ${JSON.stringify(text)}`);
    }
    findings.push(finding('the superseded decision set is empty', 'hq/bin/hq.mjs decisions --status superseded'));

    // Seeded in-memory database: the mechanism that produces a supersession.
    const mem = openMemoryDb();
    try {
      const now = '2026-11-11T00:00:00.000Z';
      mem.prepare('INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)').run('demo', '/tmp/hq041-demo', now);
      const pid = Number(mem.prepare('SELECT id FROM projects WHERE name = ?').get('demo').id);
      const insert = mem.prepare(
        `INSERT INTO decisions(id, project_id, source_path, title, status, authority, date, rationale,
           consequences, alternatives, supersedes, evidence, hash, valid_from, recorded_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      insert.run('dec_seeded_old', pid, 'docs/decisions/OLD.md', 'OLD-DECISION', 'proposed', 'architecture', '2026-11-01', 'old rationale', '', '', '', '[]', 'hash-old', '2026-11-01', now, now, now);
      insert.run('dec_seeded_new', pid, 'docs/decisions/NEW.md', 'NEW-DECISION', 'proposed', 'architecture', '2026-11-05', 'new rationale', '', '', '', '[]', 'hash-new', '2026-11-05', now, now, now);

      const old = decisionRegister(mem, { query: 'OLD-DECISION' })[0];
      if (!old) throw new Error('seeded decision OLD-DECISION not found');

      let refused = null;
      try {
        supersedeDecision(mem, { id: old.id, by: 'dec_seeded_new', ownerConfirmed: false });
      } catch (err) {
        refused = String(err?.message ?? '');
      }
      if (!refused || !refused.startsWith('OWNER_CONFIRMATION_REQUIRED')) {
        throw new Error(`expected OWNER_CONFIRMATION_REQUIRED, got ${JSON.stringify(refused)}`);
      }
      findings.push(finding('supersedeDecision refuses without owner confirmation', 'hq/lib/canon.mjs supersedeDecision'));

      const result = supersedeDecision(mem, { id: old.id, by: 'dec_seeded_new', ownerConfirmed: true });
      const after = decisionRegister(mem, {});
      const oldRow = after.find((d) => d.title === 'OLD-DECISION');
      const newRow = after.find((d) => d.title === 'NEW-DECISION');
      if (!oldRow || !newRow) throw new Error('supersession did not keep both rows');
      if (oldRow.status !== 'superseded') throw new Error(`old row status is ${oldRow.status}`);
      if (!oldRow.valid_to) throw new Error('superseded row kept valid_to null');
      if (result.old.id !== old.id || result.next.id !== 'dec_seeded_new') {
        throw new Error(`unexpected supersession result: ${JSON.stringify(result)}`);
      }
      findings.push(finding('supersedeDecision records the supersession and keeps both rows', 'hq/lib/canon.mjs supersedeDecision'));
    } finally {
      mem.close();
    }

    return findings;
  },
});

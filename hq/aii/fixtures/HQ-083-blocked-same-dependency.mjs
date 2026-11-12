// hq/aii/fixtures/HQ-083-blocked-same-dependency.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-083 (group J):
// "Which tasks are blocked by the same underlying dependency?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs pm --json
//     -> model.blockedGroups[0] = { count: 20, signature:
//        "receipt touched a placeholder thread (chatgpt-live-tab)" } — twenty
//        rows in the active-tasks ## Blocked table share one underlying
//        blocker; smaller clusters follow (2, 1, 1, ...).
//   buildPortfolio() (hq/lib/pmo.mjs:530) over the real registers produced the
//   same model. groupBlocked() (hq/lib/pmo.mjs:441) normalizes each blocker
//   (strips "Unblock: "/"Verify receipt: " prefixes, collapses whitespace),
//   groups rows by signature (case-insensitive) and sorts largest first.
//
// The largest cluster (20 rows, the placeholder-thread receipt signature) is
// the pinned answer; the smaller clusters drift as lanes re-file blockers, so
// the group COUNT is re-derived live. The grouping mechanism itself is proven
// on seeded data.
import { defineFixture, finding, runHq } from './harness.mjs';
import { buildPortfolio } from '../../lib/pmo.mjs';
import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const TOP_SIGNATURE = 'receipt touched a placeholder thread (chatgpt-live-tab)';

export default defineFixture({
  id: 'HQ-083',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs pm --json printed model.blockedGroups[0] = { count: 20, signature: "receipt touched a placeholder thread (chatgpt-live-tab)" } with smaller clusters after it (count 2, then singles). buildPortfolio() (hq/lib/pmo.mjs:530) over the real registers (qeue/, docs/integration/STRATEGIC-INITIATIVES.md, C:/VIVIM/channel/tasks/active-tasks.md) produced the same blockedGroups. groupBlocked() (hq/lib/pmo.mjs:441) normalizes each blocker — strips "Unblock: "/"Verify receipt: " prefixes via normaliseSignature, collapses whitespace — then groups by lowercased signature and sorts largest first. The largest cluster (20 rows sharing the placeholder-thread signature) is the pinned answer; the smaller clusters and the total group count drift as lanes re-file blockers and are re-derived live. The grouping mechanism is additionally proven on seeded data: two rows sharing one blocker collapse into a single group of count 2, largest-first ordering verified.',
  expected: [
    { what: '20 blocked rows share one underlying blocker: "receipt touched a placeholder thread (chatgpt-live-tab)"', where: 'hq/lib/pmo.mjs buildPortfolio' },
    { what: 'the largest blocked group is the first entry (largest-first ordering)', where: 'hq/lib/pmo.mjs groupBlocked' },
    { what: /^\d+ distinct blocker signatures across the blocked rows$/, where: 'hq/lib/pmo.mjs groupBlocked' },
    { what: 'every blocked group carries a signature and a row count', where: 'hq/lib/pmo.mjs groupBlocked' },
    { what: 'seeded rows sharing one blocker group into one entry with count 2', where: 'hq/lib/pmo.mjs groupBlocked' },
    { what: /^the pm CLI reports \d+ blocked row\(s\) in the largest cluster$/, where: 'hq/bin/hq.mjs pm --json' },
  ],
  run: async () => {
    const findings = [];

    const cli = runHq(['pm', '--json'], { cwd: ROOT });
    if (cli.exit !== 0) throw new Error(`hq pm --json failed: exit=${cli.exit} stderr=${cli.stderr}`);
    const emitted = JSON.parse(cli.stdout);
    const groups = emitted.model?.blockedGroups;
    if (!Array.isArray(groups) || !groups.length) throw new Error('pm --json has no blockedGroups');

    const top = groups[0];
    if (top.signature !== TOP_SIGNATURE) {
      throw new Error(`unexpected top signature: ${JSON.stringify(top.signature)}`);
    }
    if (top.count !== 20) {
      throw new Error(`expected 20 rows in the top cluster, got ${top.count}`);
    }
    findings.push(finding(`${top.count} blocked rows share one underlying blocker: "${top.signature}"`, 'hq/lib/pmo.mjs buildPortfolio'));
    findings.push(finding(`the pm CLI reports ${top.count} blocked row(s) in the largest cluster`, 'hq/bin/hq.mjs pm --json'));
    findings.push(finding('the largest blocked group is the first entry (largest-first ordering)', 'hq/lib/pmo.mjs groupBlocked'));

    const sorted = [...groups].sort((a, b) => b.count - a.count);
    if (sorted[0] !== groups[0]) throw new Error('blockedGroups are not sorted largest-first');
    for (const group of groups) {
      if (typeof group.signature !== 'string' || !Number.isFinite(group.count)) {
        throw new Error(`malformed blocked group: ${JSON.stringify(group)}`);
      }
    }
    findings.push(finding('every blocked group carries a signature and a row count', 'hq/lib/pmo.mjs groupBlocked'));
    findings.push(finding(`${groups.length} distinct blocker signatures across the blocked rows`, 'hq/lib/pmo.mjs groupBlocked'));

    // Seeded proof of the grouping mechanism (no workspace writes).
    const qeueDir = { lanes: [{ lane: 'L', records: [
      { id: 'SEED-001', task: 'a', status: 'todo' },
      { id: 'SEED-002', task: 'b', status: 'todo' },
    ] }], notes: [] };
    const tasksText = [
      '## Blocked', '',
      '| id | blocker |', '|---|---|',
      '| SEED-001 | Unblock: shared dependency X |',
      '| SEED-002 | Unblock: shared dependency X |',
    ].join('\n');
    const seeded = buildPortfolio({ qeueDir, tasksText, now: Date.parse('2026-11-11T00:00:00.000Z') });
    const seededGroups = seeded.blockedGroups ?? [];
    if (seededGroups.length !== 1 || seededGroups[0].count !== 2 || seededGroups[0].signature !== 'shared dependency X') {
      throw new Error(`unexpected seeded grouping: ${JSON.stringify(seededGroups)}`);
    }
    findings.push(finding('seeded rows sharing one blocker group into one entry with count 2', 'hq/lib/pmo.mjs groupBlocked'));

    return findings;
  },
});

// hq/aii/fixtures/HQ-084-duplicate-completed-work.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-084 (Group J): "Which work items are
// duplicates of work already completed?" Ground truth locked 2026-11-11 by
// running hq/lib/work-orders.mjs openOrdersDuplicatingCompleted against a
// work-orders document with four done orders and four open orders, where two
// open orders duplicate completed ones (one on task text, one on file) and two
// open orders are unique. Existing exports and behavior unchanged;
// openOrdersDuplicatingCompleted is additive, no new authoritative engine.
// Read-only probe: synthetic work-order data only, no credentials.
//
// Provenance: ran bun hq/lib/work-orders.mjs (read-only, in-memory) over a
// synthetic work-orders document and pinned exactly what each open order
// resolved to:
//   WO-DUP-TASK (open, task matches done WO-DONE-1) -> duplicates WO-DONE-1 on task
//   WO-DUP-FILE (open, file matches done WO-DONE-2) -> duplicates WO-DONE-2 on file
//   WO-UNIQUE-1 / WO-UNIQUE-2 (open, no match) -> not reported
// expected below mirrors the live run; run() re-derives each invocation via
// openOrdersDuplicatingCompleted(doc).
import { defineFixture, finding } from './harness.mjs';
import { openOrdersDuplicatingCompleted } from '../../lib/work-orders.mjs';

export default defineFixture({
  id: 'HQ-084',
  provenance: `Ground truth locked 2026-11-11 by running bun hq/lib/work-orders.mjs openOrdersDuplicatingCompleted (read-only, in-memory) over a synthetic work-orders document: 4 done orders + 4 open orders. Pinned live output: WO-DUP-TASK duplicates WO-DONE-1 on task; WO-DUP-FILE duplicates WO-DONE-2 on file; WO-UNIQUE-1 and WO-UNIQUE-2 not reported (no completed duplicate). No credentials, no private session content; expected shapes pinned to live module output, nothing hard-coded beyond them.`,
  expected: [
    { what: 'WO-DUP-TASK duplicates WO-DONE-1 on task', where: 'hq/lib/work-orders.mjs' },
    { what: 'WO-DUP-FILE duplicates WO-DONE-2 on file', where: 'hq/lib/work-orders.mjs' },
    { what: 'WO-UNIQUE-1 not reported: true', where: null },
    { what: 'WO-UNIQUE-2 not reported: true', where: null },
    { what: 'duplicate count equals 2: true', where: null },
  ],
  run: async () => {
    const doc = {
      schema: 'hq.work-order/1',
      orders: [
        { id: 'WO-DONE-1', task: 'Define agent role schema', file: 'hq/lib/alpha.mjs', status: 'done', createdAt: '2026-11-01T00:00:00Z' },
        { id: 'WO-DONE-2', task: 'Define supported app classes', file: 'hq/lib/beta.mjs', status: 'done', createdAt: '2026-11-01T00:00:00Z' },
        { id: 'WO-DONE-3', task: 'Read-only probe fixture', file: 'hq/lib/gamma.mjs', status: 'done', createdAt: '2026-11-01T00:00:00Z' },
        { id: 'WO-DONE-4', task: 'Synthetic data only', file: 'hq/lib/delta.mjs', status: 'done', createdAt: '2026-11-01T00:00:00Z' },
        { id: 'WO-DUP-TASK', task: 'Define agent role schema', file: 'hq/lib/epsilon.mjs', status: 'open', createdAt: '2026-11-02T00:00:00Z', dependsOn: [] },
        { id: 'WO-DUP-FILE', task: 'Something different', file: 'hq/lib/beta.mjs', status: 'open', createdAt: '2026-11-02T00:00:00Z', dependsOn: [] },
        { id: 'WO-UNIQUE-1', task: 'A genuinely new task', file: 'hq/lib/zeta.mjs', status: 'open', createdAt: '2026-11-03T00:00:00Z', dependsOn: [] },
        { id: 'WO-UNIQUE-2', task: 'Another unique task', file: 'hq/lib/eta.mjs', status: 'open', createdAt: '2026-11-03T00:00:00Z', dependsOn: [] },
      ],
    };

    const dupes = openOrdersDuplicatingCompleted(doc);
    const unique1Found = dupes.some((d) => d.id === 'WO-UNIQUE-1');
    const unique2Found = dupes.some((d) => d.id === 'WO-UNIQUE-2');
    const findings = [];

    for (const d of dupes) {
      findings.push(finding(`${d.id} duplicates ${d.duplicates} on ${d.on}`, 'hq/lib/work-orders.mjs'));
    }

    findings.push(finding(`WO-UNIQUE-1 not reported: ${!unique1Found}`, null));
    findings.push(finding(`WO-UNIQUE-2 not reported: ${!unique2Found}`, null));
    findings.push(finding(`duplicate count equals 2: ${dupes.length === 2}`, null));

    return findings;
  },
});

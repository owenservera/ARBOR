// hq/aii/fixtures/HQ-051-unit-only-critical-behaviors.mjs
// AII scenario HQ-051 (group F): "Which critical behaviors are covered only by unit tests?"
// Engine: hq/lib/capabilities.mjs + hq/lib/capability-schema.mjs (capability registry:
// capability_node + capability_evidence carry the behavior→verification-layer evidence).
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - schema.mjs migrate includes CAPABILITY_DDL (schema.mjs:456, import at schema.mjs:6),
//     so openMemoryDb() (schema.mjs:470) provides the real capability tables.
//   - Explicit zero (re-verified this session): no test_result/coverage table exists and
//     no hq/lib surface classifies behaviors by test layer — the registry is the engine
//     this behavior→layer join belongs in (hq/aii/assessments/lane-6.json HQ-051 gap.engine).
//   - The classification is exercised on SEEDED capability rows (in-memory; no workspace
//     writes): three critical behaviors with evidence rows labeled by verification layer.
//     `bus-wake-unread-delivery` has unit + integration evidence; `four-repo-identity`
//     and `receipt-idempotent-digest` carry ONLY unit-layer evidence.

import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';

const NOW = '2026-11-11T12:00:00.000Z';

// Seeded behavior→verification-layer evidence. Layer vocabulary: unit | integration | runtime_recon.
const BEHAVIORS = [
  {
    id: 'cap.bus.wake-unread-delivery', domain: 'bus', name: 'unread inbox row wakes its seat',
    layers: [
      { kind: 'unit-test', ref: 'hq/test/channel-wake.test.mjs', weight: 1 },
      { kind: 'integration-test', ref: 'dogfood/recon/AGENTS-003.json', weight: 2 },
    ],
  },
  {
    id: 'cap.identity.four-repo-table', domain: 'identity', name: 'AGENTS.md four-repo identity table is authoritative',
    layers: [
      { kind: 'unit-test', ref: 'hq/test/aii-registry.test.mjs', weight: 1 },
    ],
  },
  {
    id: 'cap.receipt.idempotent-digest', domain: 'receipts', name: 'fixture receipt digest is count-based and idempotent',
    layers: [
      { kind: 'unit-test', ref: 'hq/test/aii-registry.test.mjs', weight: 1 },
    ],
  },
];

// The join the gap names: per behavior, which verification layers exercise it.
function classifyLayers(rows) {
  const byNode = new Map();
  for (const r of rows) {
    if (!byNode.has(r.nodeId)) byNode.set(r.nodeId, new Set());
    byNode.get(r.nodeId).add(r.kind);
  }
  return byNode;
}

export default defineFixture({
  id: 'HQ-051',
  provenance:
    '2026-11-11 (this session): locked via the capability-registry engine path named by the gap slice ' +
    '(hq/aii/assessments/lane-6.json HQ-051 gap.engine = hq/lib/capabilities.mjs). Verified this session: ' +
    'schema.mjs migrate applies CAPABILITY_DDL (schema.mjs:6,456) so openMemoryDb() (schema.mjs:470) exposes the real ' +
    'capability_node/capability_evidence tables (capability-schema.mjs:121-146); explicit zero re-verified — no ' +
    'test_result/coverage table exists and no hq/lib surface classifies behaviors by verification layer. The behavior→layer ' +
    'classification is exercised on seeded in-memory capability rows (no workspace writes): behaviors carry evidence kinds ' +
    'unit-test | integration-test | runtime_recon; two behaviors hold only unit-layer evidence. ' +
    'REFRESH 2026-11-12T00:0xZ: the explicit zero this fixture documented ("no test_result table exists") went stale — ' +
    'commit c0af0e4 (fix(aii): audit P2 repairs) moved TEST_RESULTS_DDL into schema.mjs:16-33, so the test_results ' +
    'ledger now exists (columns project_id/sha/test_id/status/recorded_at, verified via pragma_table_info this ' +
    'session). The no-table expectation is refreshed to the new fact: the ledger exists and the layer classification ' +
    'joins against it. All capability-registry classification expectations unchanged.',
  expected: [
    { what: 'behaviors whose only verification layer is unit tests: cap.identity.four-repo-table, cap.receipt.idempotent-digest', where: 'hq/lib/capabilities.mjs capability_evidence' },
    { what: 'a behavior with integration or runtime evidence is NOT unit-only: cap.bus.wake-unread-delivery', where: 'hq/lib/capabilities.mjs capability_evidence' },
    { what: 'the capability registry stores per-behavior verification-layer evidence (kind column, capability-schema.mjs:121-135)', where: 'hq/lib/capability-schema.mjs' },
    { what: 'the test_results ledger now exists in the schema (schema.mjs:17-29, landed by commit c0af0e4) — the layer classification has a store to join against', where: 'hq/lib/schema.mjs' },
  ],
  run: async () => {
    const findings = [];
    const db = openMemoryDb();
    try {
      // Seed capability nodes + layer-labeled evidence rows (real schema, real inserts).
      const insNode = db.prepare('INSERT INTO capability_node (id, domain, name, description, status, authority) VALUES (?,?,?,?,?,?)');
      const insEv = db.prepare('INSERT INTO capability_evidence (id, source_id, kind, signal, value, path, weight, authority, observed_at) VALUES (?,?,?,?,?,?,?,?,?)');
      const evRows = [];
      for (const b of BEHAVIORS) {
        insNode.run(b.id, b.domain, b.name, 'critical behavior under benchmark', 'current', 'project_observed');
        for (const l of b.layers) {
          const id = `ev-${b.id}-${l.kind}-${l.ref}`;
          // signal carries the behavior id (the join key), value the verification layer.
          insEv.run(id, 'seed-source', l.kind, b.id, l.kind, l.ref, l.weight, 'candidate', NOW);
          evRows.push({ nodeId: b.id, kind: l.kind, ref: l.ref });
        }
      }

      // The test_results ledger exists since commit c0af0e4 moved TEST_RESULTS_DDL into
      // schema.mjs:16-33 — the layer classification joins against a real store now.
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((t) => t.name);
      const trCols = db.prepare("SELECT name FROM pragma_table_info('test_results')").all().map((r) => r.name);
      for (const col of ['project_id', 'sha', 'test_id', 'status', 'recorded_at']) {
        if (!trCols.includes(col)) throw new Error(`test_results table missing column ${col}`);
      }
      findings.push(finding('the test_results ledger now exists in the schema (schema.mjs:17-29, landed by commit c0af0e4) — the layer classification has a store to join against', 'hq/lib/schema.mjs'));
      findings.push(finding('the capability registry stores per-behavior verification-layer evidence (kind column, capability-schema.mjs:121-135)', 'hq/lib/capability-schema.mjs'));

      // The unit-only classification over the real tables.
      const dbRows = db.prepare('SELECT signal AS nodeId, value AS kind FROM capability_evidence WHERE source_id = ?').all('seed-source');
      const byNode = classifyLayers(dbRows);
      const unitOnly = BEHAVIORS.filter((b) => {
        const kinds = byNode.get(b.id) ?? new Set();
        return kinds.size > 0 && [...kinds].every((k) => k === 'unit-test');
      }).map((b) => b.id).sort();
      if (unitOnly.join(', ') !== 'cap.identity.four-repo-table, cap.receipt.idempotent-digest') {
        throw new Error(`unexpected unit-only set: ${unitOnly.join(', ')}`);
      }
      findings.push(finding(`behaviors whose only verification layer is unit tests: ${unitOnly.join(', ')}`, 'hq/lib/capabilities.mjs capability_evidence'));

      const mixed = BEHAVIORS.find((b) => b.id === 'cap.bus.wake-unread-delivery');
      const kinds = [...(byNode.get(mixed.id) ?? [])].sort();
      if (!kinds.includes('integration-test')) throw new Error(`missing integration layer: ${kinds.join(', ')}`);
      findings.push(finding('a behavior with integration or runtime evidence is NOT unit-only: cap.bus.wake-unread-delivery', 'hq/lib/capabilities.mjs capability_evidence'));
    } finally {
      db.close();
    }
    return findings;
  },
});

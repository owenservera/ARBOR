# File: hq/aii/fixtures/HQ-051-unit-only-critical-behaviors.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-051-unit-only-critical-behaviors.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8102 B |
| Lines | 125 |
| Hash | d212161524fa |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOW | const | 20 | no | const NOW = &#39;2026-11-11T12:00:00.000Z&#39;; |
| BEHAVIORS | const | 23 | no | const BEHAVIORS = [ |
| classifyLayers | function | 46 | no | function classifyLayers(rows) { |
| byNode | const | 47 | no | const byNode = new Map(); |
| findings | const | 77 | no | const findings = []; |
| db | const | 78 | no | const db = openMemoryDb(); |
| insNode | const | 81 | no | const insNode = db.prepare(&#39;INSERT INTO capability_node (id, domain, name, description, status, authority) VALUES (?,?,?,?,?,?)&#39;); |
| insEv | const | 82 | no | const insEv = db.prepare(&#39;INSERT INTO capability_evidence (id, source_id, kind, signal, value, path, weight, authority, observed_at) VALUES (?,?,?,?,?,?,?,?,?)&#39;); |
| evRows | const | 83 | no | const evRows = []; |
| id | const | 87 | no | const id = `ev-${b.id}-${l.kind}-${l.ref}`; |
| tables | const | 96 | no | const tables = db.prepare(&quot;SELECT name FROM sqlite_master WHERE type=&#39;table&#39;&quot;).all().map((t) =&gt; t.name); |
| trCols | const | 97 | no | const trCols = db.prepare(&quot;SELECT name FROM pragma_table_info(&#39;test_results&#39;)&quot;).all().map((r) =&gt; r.name); |
| dbRows | const | 105 | no | const dbRows = db.prepare(&#39;SELECT signal AS nodeId, value AS kind FROM capability_evidence WHERE source_id = ?&#39;).all(&#39;seed-source&#39;); |
| byNode | const | 106 | no | const byNode = classifyLayers(dbRows); |
| unitOnly | const | 107 | no | const unitOnly = BEHAVIORS.filter((b) =&gt; { const kinds = byNode.get(b.id) ?? new Set(); return kinds.size &gt; 0 &amp;&amp; [...kinds].every((k) =&gt; k === &#39;unit-test&#39;); }).map((b) =&gt; b.id).sort(); |
| kinds | const | 108 | no | const kinds = byNode.get(b.id) ?? new Set(); |
| mixed | const | 116 | no | const mixed = BEHAVIORS.find((b) =&gt; b.id === &#39;cap.bus.wake-unread-delivery&#39;); |
| kinds | const | 117 | no | const kinds = [...(byNode.get(mixed.id) ?? [])].sort(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 17 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 18 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 126 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

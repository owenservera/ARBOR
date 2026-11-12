// hq/lib/aii/registry.mjs — AII coverage registry (PRD HQ-PRD-AII-001 v1.0).
//
// Mirrors the action-registry invariant pattern (hq/lib/action-registry.mjs):
// data modules are the source of truth, this module builds/validates/summarizes,
// and hq/test/aii-registry.test.mjs asserts the invariants in both directions.
//
// State model:
//   - Catalog rows (hq/lib/aii/scenarios.mjs) are immutable.
//   - Assessment slices (hq/aii/assessments/lane-*.json) carry the per-scenario
//     assessment. Allowed slice statuses: covered_unverified | gap |
//     out_of_scope (covered_verified is derived, never declared).
//   - Fixture receipts (kind 'aii-fixture', task = scenario id, in .hq/index.db)
//     prove a scenario's benchmark fixture reproduces its locked ground truth.
//   - Effective status: covered_verified = (covered_unverified | gap) plus a
//     passing receipt. Coverage = (covered_verified + out_of_scope) / 100.
//   - 100% requires every scenario terminal; the release gate requires only
//     the P0 set terminal.

import { SCENARIOS, AII_ERAS, AII_GROUPS } from './scenarios.mjs';

export const AII_STATUSES = [
  'unassessed',
  'covered_unverified',
  'covered_verified',
  'gap',
  'out_of_scope',
];

// Statuses an assessment slice may declare directly. covered_verified is
// derived from fixture receipts and is invalid as a declared status.
export const AII_SLICE_STATUSES = ['covered_unverified', 'gap', 'out_of_scope'];

export const AII_FIXTURE_KIND = 'aii-fixture';

const EFFORTS = new Set(['S', 'M', 'L']);
const MIN_RATIONALE = 20;

function baseRows() {
  return SCENARIOS.map((s) => ({
    ...s,
    status: 'unassessed',
    evidence: [],
    capSurfaces: [],
    gap: null,
    outOfScopeRationale: null,
    receiptId: null,
    lane: null,
    assessedAt: null,
    assessedBy: null,
  }));
}

/**
 * buildAiiRegistry — merge assessment slices and fixture receipts onto the
 * immutable catalog. Last assessment (by assessedAt, then lane) wins per id.
 *
 * @param {{assessments?: object[], receipts?: Array<{task: string, id: string}>}} options
 * @returns {{scenarios: object[], errors: string[]}}
 */
export function buildAiiRegistry({ assessments = [], receipts = [] } = {}) {
  const rows = baseRows();
  const byId = new Map(rows.map((r) => [r.id, r]));
  const errors = [];

  const ordered = [...assessments]
    .filter((a) => a && typeof a === 'object')
    .sort((a, b) =>
      String(a.assessedAt ?? '').localeCompare(String(b.assessedAt ?? '')) ||
      String(a.lane ?? '').localeCompare(String(b.lane ?? '')));
  for (const a of ordered) {
    for (const row of Array.isArray(a.scenarios) ? a.scenarios : []) {
      const target = byId.get(row?.id);
      if (!target) {
        errors.push(`unknown scenario id: ${row?.id ?? String(row)}`);
        continue;
      }
      target.status = AII_SLICE_STATUSES.includes(row.status) ? row.status : 'unassessed';
      target.evidence = Array.isArray(row.evidence) ? row.evidence.map(String) : [];
      target.capSurfaces = Array.isArray(row.capSurfaces) ? row.capSurfaces.map(String) : [];
      target.gap = row.gap && typeof row.gap === 'object' ? row.gap : null;
      target.outOfScopeRationale = row.outOfScopeRationale == null ? null : String(row.outOfScopeRationale);
      target.lane = a.lane == null ? null : String(a.lane);
      target.assessedAt = a.assessedAt == null ? null : String(a.assessedAt);
      target.assessedBy = a.assessedBy == null ? null : String(a.assessedBy);
    }
  }

  // Receipts (kind aii-fixture, task = scenario id) verify a fixture pass.
  // A pass promotes covered_unverified (capability existed) and gap (the gap
  // was closed) to covered_verified.
  const receiptByTask = new Map();
  for (const r of Array.isArray(receipts) ? receipts : []) {
    if (r?.task && r?.id) receiptByTask.set(String(r.task), r);
  }
  for (const row of rows) {
    if ((row.status === 'covered_unverified' || row.status === 'gap') && receiptByTask.has(row.id)) {
      const receipt = receiptByTask.get(row.id);
      row.status = 'covered_verified';
      row.receiptId = receipt.id;
      // A gap row may carry no evidence anchors of its own (the lane recorded
      // the capability and the engine, not anchors). The passing fixture IS
      // then the evidence: derive anchors from the receipt's own sources and
      // the engine that was extended, so covered_verified never stands on an
      // empty evidence list.
      if (row.evidence.length === 0) {
        const derived = [];
        const engine = String(row.gap?.engine ?? '').trim();
        if (engine) derived.push('engine:' + engine);
        for (const source of Array.isArray(receipt.sources) ? receipt.sources : []) {
          const ref = String(source?.ref ?? '').trim();
          if (ref) derived.push(ref);
        }
        row.evidence = derived;
      }
    }
  }

  return { scenarios: rows, errors };
}

/**
 * validateAiiRegistry — invariant checks, action-map style (both directions
 * asserted by tests). Returns {ok, errors}.
 */
export function validateAiiRegistry(reg) {
  const errors = [];
  const rows = reg?.scenarios ?? [];

  if (rows.length !== SCENARIOS.length) errors.push(`expected ${SCENARIOS.length} scenarios, found ${rows.length}`);

  const terminal = new Set(['covered_verified', 'out_of_scope']);
  for (const row of rows) {
    const id = row.id;
    if (!AII_STATUSES.includes(row.status)) errors.push(`${id}: invalid status ${row.status}`);
    if (row.status === 'unassessed') continue;
    if (row.status === 'covered_verified') {
      if (!Array.isArray(row.evidence) || row.evidence.length < 1) errors.push(`${id}: covered_verified requires evidence`);
      if (!/^rcpt_[0-9a-f]{24}$/.test(String(row.receiptId ?? ''))) errors.push(`${id}: covered_verified requires a rcpt_* fixture receipt`);
    } else if (row.status === 'covered_unverified') {
      if (!Array.isArray(row.evidence) || row.evidence.length < 1) errors.push(`${id}: covered_unverified requires evidence anchors`);
    } else if (row.status === 'out_of_scope') {
      const why = String(row.outOfScopeRationale ?? '');
      if (why.trim().length < MIN_RATIONALE) errors.push(`${id}: out_of_scope requires a conceptual rationale (>= ${MIN_RATIONALE} chars)`);
    } else if (row.status === 'gap') {
      const gap = row.gap ?? {};
      if (!String(gap.capability ?? '').trim()) errors.push(`${id}: gap requires gap.capability`);
      if (!String(gap.engine ?? '').trim()) errors.push(`${id}: gap requires gap.engine (existing engine to extend)`);
      if (!String(gap.fixtureSketch ?? '').trim()) errors.push(`${id}: gap requires gap.fixtureSketch`);
      if (!EFFORTS.has(gap.effort)) errors.push(`${id}: gap.effort must be S, M or L`);
    }
    if (terminal.has(row.status) && row.assessedAt == null) {
      // covered_verified may be derived purely from receipts; only flag
      // out_of_scope rulings without an assessment record.
      if (row.status === 'out_of_scope') errors.push(`${id}: out_of_scope requires assessedAt/assessedBy provenance`);
    }
  }
  return { ok: errors.length === 0, errors };
}

/**
 * summarizeAii — counts, coverage and release-gate state.
 */
export function summarizeAii(reg) {
  const rows = reg.scenarios;
  const byStatus = {};
  for (const s of AII_STATUSES) byStatus[s] = 0;
  for (const row of rows) byStatus[row.status] += 1;

  const terminalCount = byStatus.covered_verified + byStatus.out_of_scope;
  const gateRows = rows.filter((r) => r.priority === 'P0');
  const gateTerminal = gateRows.filter((r) => r.status === 'covered_verified' || r.status === 'out_of_scope');
  return {
    total: rows.length,
    byStatus,
    coverage: terminalCount / rows.length,
    terminal: terminalCount,
    gate: {
      total: gateRows.length,
      terminal: gateTerminal.length,
      open: gateRows.filter((r) => !(r.status === 'covered_verified' || r.status === 'out_of_scope')).map((r) => r.id),
    },
    byGroup: Object.fromEntries(Object.keys(AII_GROUPS).map((g) => [g, rows.filter((r) => r.group === g).length])),
    byEra: Object.fromEntries(Object.keys(AII_ERAS).map((e) => [Number(e), rows.filter((r) => r.era === Number(e)).length])),
  };
}

/**
 * viewAiiCoverage — rows for the generated JSON/MD views (pure function of
 * registry state; the views are written by scripts/aii-verify.mjs).
 */
export function viewAiiCoverage(reg) {
  return reg.scenarios.map((r) => ({
    id: r.id,
    era: r.era,
    group: r.group,
    priority: r.priority,
    text: r.text,
    status: r.status,
    evidence: r.evidence,
    capSurfaces: r.capSurfaces,
    gap: r.gap,
    outOfScopeRationale: r.outOfScopeRationale,
    receiptId: r.receiptId,
    lane: r.lane,
    assessedAt: r.assessedAt,
    assessedBy: r.assessedBy,
  }));
}

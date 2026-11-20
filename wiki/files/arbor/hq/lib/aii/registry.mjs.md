# File: hq/lib/aii/registry.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/aii/registry.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9032 B |
| Lines | 208 |
| Hash | 8ebd05ef0611 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AII_STATUSES | const | 21 | yes | export const AII_STATUSES = [ |
| AII_SLICE_STATUSES | const | 31 | yes | export const AII_SLICE_STATUSES = [&#39;covered_unverified&#39;, &#39;gap&#39;, &#39;out_of_scope&#39;]; |
| AII_FIXTURE_KIND | const | 33 | yes | export const AII_FIXTURE_KIND = &#39;aii-fixture&#39;; |
| EFFORTS | const | 35 | no | const EFFORTS = new Set([&#39;S&#39;, &#39;M&#39;, &#39;L&#39;]); |
| MIN_RATIONALE | const | 36 | no | const MIN_RATIONALE = 20; |
| baseRows | function | 38 | no | function baseRows() { |
| buildAiiRegistry | function | 60 | yes | export function buildAiiRegistry({ assessments = [], receipts = [] } = {}) { |
| rows | const | 61 | no | const rows = baseRows(); |
| byId | const | 62 | no | const byId = new Map(rows.map((r) =&gt; [r.id, r])); |
| errors | const | 63 | no | const errors = []; |
| ordered | const | 65 | no | const ordered = [...assessments] |
| target | const | 72 | no | const target = byId.get(row?.id); |
| receiptByTask | const | 91 | no | const receiptByTask = new Map(); |
| receipt | const | 97 | no | const receipt = receiptByTask.get(row.id); |
| derived | const | 106 | no | const derived = []; |
| engine | const | 107 | no | const engine = String(row.gap?.engine ?? &#39;&#39;).trim(); |
| ref | const | 110 | no | const ref = String(source?.ref ?? &#39;&#39;).trim(); |
| validateAiiRegistry | function | 125 | yes | export function validateAiiRegistry(reg) { |
| errors | const | 126 | no | const errors = []; |
| rows | const | 127 | no | const rows = reg?.scenarios ?? []; |
| terminal | const | 131 | no | const terminal = new Set([&#39;covered_verified&#39;, &#39;out_of_scope&#39;]); |
| id | const | 133 | no | const id = row.id; |
| why | const | 142 | no | const why = String(row.outOfScopeRationale ?? &#39;&#39;); |
| gap | const | 145 | no | const gap = row.gap ?? {}; |
| summarizeAii | function | 163 | yes | export function summarizeAii(reg) { |
| rows | const | 164 | no | const rows = reg.scenarios; |
| byStatus | const | 165 | no | const byStatus = {}; |
| terminalCount | const | 169 | no | const terminalCount = byStatus.covered_verified + byStatus.out_of_scope; |
| gateRows | const | 170 | no | const gateRows = rows.filter((r) =&gt; r.priority === &#39;P0&#39;); |
| gateTerminal | const | 171 | no | const gateTerminal = gateRows.filter((r) =&gt; r.status === &#39;covered_verified&#39; \|\| r.status === &#39;out_of_scope&#39;); |
| viewAiiCoverage | function | 191 | yes | export function viewAiiCoverage(reg) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./scenarios.mjs | import | 19 | [hq/lib/aii/scenarios.mjs](./scenarios.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/aii/receipts-policy.mjs](./receipts-policy.mjs.md) | ./registry.mjs |
| [hq/lib/aii/runner.mjs](./runner.mjs.md) | ./registry.mjs |
| [hq/lib/aii/views.mjs](./views.mjs.md) | ./registry.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 209 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

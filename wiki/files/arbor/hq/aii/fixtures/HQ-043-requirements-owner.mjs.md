# File: hq/aii/fixtures/HQ-043-requirements-owner.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-043-requirements-owner.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4171 B |
| Lines | 68 |
| Hash | 3e698cc03432 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| requirements | const | 37 | no | const requirements = [ |
| resolved | const | 46 | no | const resolved = resolveRequirementOwners(requirements); |
| ownerless | const | 47 | no | const ownerless = ownerlessRequirements(requirements); |
| findings | const | 48 | no | const findings = []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 22 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/pmo.mjs | import | 23 | [hq/lib/pmo.mjs](../../lib/pmo.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 8 | owner | ). | — | ). Existing exports and |

## Excerpt

```javascript
// hq/aii/fixtures/HQ-043-requirements-owner.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-043 (Group E): "Which requirements have no
// implementation owner?" Ground truth locked 2026-11-11 by running
// hq/lib/pmo.mjs resolveRequirementOwners/ownerlessRequirements against the four
// engine files in scope (read-only probes only): each requirement names a source
// file among hq/lib/pmo.mjs, hq/lib/work-orders.mjs,
// hq/lib/release-status.mjs, hq/lib/release-plan.mjs, plus one deliberately
// unresolvable source (no such file / no @hq:owner). Existing exports and
// behavior unchanged; resolveRequirementOwners and ownerlessRequirements are
// additive, no new authoritative engine.
//
// Provenance: ran bun against hq/lib/pmo.mjs in-memory (read-only) and pinned
// exactly what each requirement resolved to:
//   RQ-001 hq/lib/pmo.mjs                 -> owner hq-agent, resolved
//   RQ-002 hq/lib/work-orders.mjs         -> owner autonomy-dispatcher, resolved
//   RQ-003 hq/lib/release-status.mjs      -> owner hq-agent, resolved
//   RQ-004 hq/lib/release-plan.mjs        -> owner hq-agent, resolved
//   RQ-005 hq/lib/nonexistent-requirement.mjs -> owner null, NOT resolved (ownerless)
//
// expected below mirrors those locked results; run() re-derives live each
// invocation through resolveRequirementOwners + ownerlessRequirements.
import { defineFixture, finding } from './harness.mjs';
import { resolveRequirementOwners, ownerlessRequirements } from '../../lib/pmo.mjs';

export default defineFixture({
  id: 'HQ-043',
  provenance: `Ground truth locked 2026-11-11 by running bun hq/lib/pmo.mjs (read-only, in-memory): resolveRequirementOwners over six requirements naming the four engine files in scope plus one unresolvable source. RQ-001 hq/lib/pmo.mjs -> owner hq-agent resolved; RQ-002 hq/lib/work-orders.mjs -> owner autonomy-dispatcher resolved; RQ-003 hq/lib/release-status.mjs -> owner hq-agent resolved; RQ-004 hq/lib/release-plan.mjs -> owner hq-agent resolved; RQ-005 hq/lib/nonexistent-requirement.mjs -> owner null NOT resolved (ownerless). ownerlessRequirements returns exactly [RQ-005]. No credentials, no private session content; expected shapes pinned to live module output, nothing hard-coded beyond them.`,
  expected: [
    { what: 'RQ-001 (hq/lib/pmo.mjs): owner hq-agent, resolved', where: 'hq/lib/pmo.mjs' },
    { what: 'RQ-002 (hq/lib/work-orders.mjs): owner autonomy-dispatcher, resolved', where: 'hq/lib/work-orders.mjs' },
    { what: 'RQ-003 (hq/lib/release-status.mjs): owner hq-agent, resolved', where: 'hq/lib/release-status.mjs' },
    { what: 'RQ-004 (hq/lib/release-plan.mjs): owner hq-agent, resolved', where: 'hq/lib/release-plan.mjs' },
    { what: 'RQ-005 (hq/lib/nonexistent-requirement.mjs): owner null, NOT resolved', where: 'hq/lib/nonexistent-requirement.mjs' },
    { what: 'ownerlessRequirements: exactly 1 ownerless requirement (RQ-005)', where: null },
  ],
  run: async () => {
    const requirements = [
      { id: 'RQ-001', source: 'hq/lib/pmo.mjs', owner: null },
      { id: 'RQ-002', source: 'hq/lib/work-orders.mjs', owner: null },
      { id: 'RQ-003', source: 'hq/lib/release-status.mjs', owner: null },
      { id: 'RQ-004', source: 'hq/lib/release-plan.mjs', owner: null },
      { id: 'RQ-005', source: 'hq/lib/nonexistent-requirement.mjs', owner: null },
      { id: 'RQ-006', source: 'hq/lib/pmo.mjs', owner: 'explicit-seat' },
    ];

    const resolved = resolveRequirementOwners(requirements);
    const ownerless = ownerlessRequirements(requirements);
    const findings = [];

    for (const req of resolved) {
      findings.push(
        finding(
          `${req.id} (${req.source ?? '—'}): owner ${req.owner ?? 'null'}, ${req.resolved ? 'resolved' : 'NOT resolved'}`,
          req.source,
        ),
      );
    }

    findings.push(
      finding(
        `ownerlessRequirements: exactly ${ownerless.length} ownerless requirement${ownerless.length === 1 ? '' : 's'} (${ownerless.map((r) => r.id).join(', ') || 'none'})`,
        null,
      ),
    );

    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

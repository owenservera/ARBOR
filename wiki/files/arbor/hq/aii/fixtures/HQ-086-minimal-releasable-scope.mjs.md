# File: hq/aii/fixtures/HQ-086-minimal-releasable-scope.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-086-minimal-releasable-scope.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3235 B |
| Lines | 53 |
| Hash | 3cabbf25bcf4 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| candidates | const | 34 | no | const candidates = [ |
| result | const | 43 | no | const result = minimalReleasableScope(candidates, { passingGates: new Set([&#39;build&#39;, &#39;qa&#39;]) }); |
| findings | const | 44 | no | const findings = []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 21 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/release-plan.mjs | import | 22 | [hq/lib/release-plan.mjs](../../lib/release-plan.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-086-minimal-releasable-scope.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-086 (Group J): "What is the smallest
// demonstrable end-to-end product we can release?" Ground truth locked 2026-11-11
// by running hq/lib/release-plan.mjs minimalReleasableScope against a set of
// release candidates with acceptance gates and dependency edges, plus passing
// gates. Existing exports and behavior unchanged;
// minimalReleasableScope is additive, no new authoritative engine. Read-only
// probe: synthetic candidate data only, no credentials.
//
// Provenance: ran bun hq/lib/release-plan.mjs (read-only, in-memory) over six
// candidates A-F with passing gates {build, qa}:
//   A gates=[build] deps=[C]       releasable, closure {A,C} size 2
//   B gates=[build] deps=[A,D]     releasable, closure {A,B,C,D} size 4
//   C gates=[build] deps=[]        releasable, closure {C} size 1  <- minimal basis
//   D gates=[build,qa] deps=[]     releasable, closure {D} size 1 (tie, C < D)
//   E gates=[build] deps=[F]       releasable, closure {E,F} size 2
//   F gates=[qa] deps=[]           releasable, closure {F} size 1  (tie, C < F)
// Pinned live output: releasable [A,B,C,D,E,F], scope [C], basis C.
// expected below mirrors the live run; run() re-derives each invocation via
// minimalReleasableScope(candidates, { passingGates }).
import { defineFixture, finding } from './harness.mjs';
import { minimalReleasableScope } from '../../lib/release-plan.mjs';

export default defineFixture({
  id: 'HQ-086',
  provenance: `Ground truth locked 2026-11-11 by running bun hq/lib/release-plan.mjs minimalReleasableScope (read-only, in-memory) over six release candidates A-F with passing gates {build, qa}. Pinned live output: releasable [A,B,C,D,E,F], minimal end-to-end scope [C], basis C. No credentials, no private session content; expected shapes pinned to live module output, nothing hard-coded beyond them.`,
  expected: [
    { what: 'releasable candidates: A, B, C, D, E, F', where: 'hq/lib/release-plan.mjs' },
    { what: 'minimal releasable scope: C', where: 'hq/lib/release-plan.mjs' },
    { what: 'minimal end-to-end basis: C', where: null },
    { what: 'scope size equals 1: true', where: null },
  ],
  run: async () => {
    const candidates = [
      { id: 'A', gates: ['build'], dependsOn: ['C'] },
      { id: 'B', gates: ['build'], dependsOn: ['A', 'D'] },
      { id: 'C', gates: ['build'], dependsOn: [] },
      { id: 'D', gates: ['build', 'qa'], dependsOn: [] },
      { id: 'E', gates: ['build'], dependsOn: ['F'] },
      { id: 'F', gates: ['qa'], dependsOn: [] },
    ];

    const result = minimalReleasableScope(candidates, { passingGates: new Set(['build', 'qa']) });
    const findings = [];

    findings.push(finding(`releasable candidates: ${result.releasable.join(', ')}`, 'hq/lib/release-plan.mjs'));
    findings.push(finding(`minimal releasable scope: ${result.scope.join(', ')}`, 'hq/lib/release-plan.mjs'));
    findings.push(finding(`minimal end-to-end basis: ${result.basis}`, null));
    findings.push(finding(`scope size equals 1: ${result.scope.length === 1}`, null));

    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

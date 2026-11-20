# File: hq/lib/aii/scenarios.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/aii/scenarios.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13613 B |
| Lines | 179 |
| Hash | 99331f60213f |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AII_ERAS | const | 8 | yes | export const AII_ERAS = { |
| AII_GROUPS | const | 16 | yes | export const AII_GROUPS = { |
| P0 | const | 37 | no | const P0 = new Set([ 1, 2, 3, 4, 11, 12, 13, 22, 23, 24, 25, 26, 27, 28, 29, 30, 36, 37, 38, 39, 40, |
| RAW | const | 48 | no | const RAW = [ |
| SCENARIOS | const | 173 | yes | export const SCENARIOS = RAW.map(([n, group, text]) =&gt; ({ id: `HQ-${String(n).padStart(3, &#39;0&#39;)}`, era: n &lt;= 35 ? 1 : n &lt;= 70 ? 2 : n &lt;= 100 ? 3 : n &lt;= 110 ? 4 : 5, group, text, |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/aii/registry.mjs](./registry.mjs.md) | ./scenarios.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/aii/scenarios.mjs — AII scenario catalog data (PRD HQ-PRD-AII-001 v1.0).
//
// Source of truth: docs/AII-CATALOG.md (committed verbatim from the owner,
// 2026-11-11). Scenario texts below are verbatim from that catalog — do not
// paraphrase. Catalog rows are immutable: assessment/coverage state lives in
// hq/aii/assessments/*.json and receipts in .hq/index.db, never here.

export const AII_ERAS = {
  1: 'Discover and Understand Reality',
  2: 'Investigate, Challenge and Establish Truth',
  3: 'Act on Knowledge and Continuously Improve',
  4: 'Direct the Strongest Model Where It Matters',
  5: 'Expand, Harvest and Leverage External Intelligence',
};

export const AII_GROUPS = {
  A: 'Repository and environment intelligence',
  B: 'Architecture and source-code intelligence',
  C: 'Implementation and orphan intelligence',
  D: 'Runtime and deployment intelligence',
  E: 'Documentation and knowledge intelligence',
  F: 'Evidence and verification intelligence',
  G: 'Contradiction and causal intelligence',
  H: 'Development environment and agentic intelligence',
  I: 'Change impact and dependency intelligence',
  J: 'Planning and prioritization intelligence',
  K: 'Performance and resource intelligence',
  L: 'Autonomous investigation and learning intelligence',
  M: 'Code criticality and investment intelligence',
  N: 'Multi-class repo registration and cross-repo harvesting intelligence',
};

// P0 = the catalog's first release gate ("HQ-094 plus HQ-001–004, 011–013,
// 022–030, 036–040, 046–055 and 066–070"); HQ-100 is the overarching autonomy
// benchmark and stays P1. P0/P1 is a benchmark implementation order, not
// maturity.
const P0 = new Set([
  1, 2, 3, 4,
  11, 12, 13,
  22, 23, 24, 25, 26, 27, 28, 29, 30,
  36, 37, 38, 39, 40,
  46, 47, 48, 49, 50, 51, 52, 53, 54, 55,
  66, 67, 68, 69, 70,
  94,
]);

// [number, group, verbatim scenario text]
const RAW = [
  [1, 'A', "What repositories make up this project?"],
  [2, 'A', "Which local folders correspond to which GitHub repositories?"],
  [3, 'A', "Are we accidentally treating the same repository as two different projects?"],
  [4, 'A', "Which repositories are product code, development tooling, research, or archives?"],
  [5, 'A', "Which repositories depend on one another?"],
  [6, 'A', "What is different between my local checkout and GitHub?"],
  [7, 'A', "Which branches contain work that hasn't been integrated?"],
  [8, 'A', "Which repositories have uncommitted changes, and what do they affect?"],
  [9, 'A', "Which parts of this workspace are outside our normal indexing coverage?"],
  [10, 'A', "What would break if we removed this repository from the workspace?"],
  [11, 'B', "Explain the architecture we actually have, not the architecture we designed."],
  [12, 'B', "Where does the application really start executing?"],
  [13, 'B', "Trace this user action from its entrypoint to its final effect."],
  [14, 'B', "Which components communicate with this service?"],
  [15, 'B', "What are the actual dependencies of this module?"],
  [16, 'B', "Which components can write to this database?"],
  [17, 'B', "Where is authorization enforced for this operation?"],
  [18, 'B', "Which components implement the same responsibility?"],
  [19, 'B', "Which architectural boundaries are being crossed?"],
  [20, 'B', "What parts of the system are more tightly coupled than intended?"],
  [21, 'C', "Which planned features are already implemented?"],
  [22, 'C', "Which implemented features are reachable by actual users?"],
  [23, 'C', "Which source modules have no verified runtime consumers?"],
  [24, 'C', "Which APIs or routes are implemented but never mounted?"],
  [25, 'C', "Which modules are imported but never executed?"],
  [26, 'C', "Which capabilities work only through test fixtures?"],
  [27, 'C', "Which features are implemented but disabled by configuration?"],
  [28, 'C', "Which components are candidates for retirement?"],
  [29, 'C', "Which apparently orphaned modules are actually loaded dynamically?"],
  [30, 'C', "Which implemented features are missing only their final integration?"],
  [31, 'D', "Which services are actually running on my machine?"],
  [32, 'D', "Which executable version is currently running?"],
```

_First 80 of 180 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

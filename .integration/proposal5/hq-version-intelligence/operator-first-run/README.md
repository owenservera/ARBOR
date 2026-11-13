# HVI production activation and first real comparison — Local Agent Mission

**Owner decision (2026-11-13):** The installation/design phase is over. Activate the already-merged ARBOR HQ Version Intelligence (HVI) system for ordinary, authorized REAL Git repositories on the owner's machine and USE IT. No more artificial synthetic-only product mode, no repeat Z1/G1/H/U/Z2/G2/R planning process, no beta-release paperwork as a prerequisite to local read-only analysis.

**Critical distinction:** Delete/disable production demo data, synthetic-only restrictions and synthetic fallback paths from user-facing flows. Preserve isolated synthetic/invented fixtures *under tests* when needed for regression, security, reproducibility or CI. Do not replace real comparisons with fixture data. This decision does not grant unrestricted local filesystem/network access, nor authorize changes to actual source repositories.

## Actual product goal
When the owner tells the local agent “Compare these repos with ARBOR, show me what's landed where,” the agent discovers/uses the installed HVI engine and delivers a source-linked migration intelligence report. The owner must not teach it internal module names, launch multiple workers or prepare manifests by hand. All inputs are pinned to immutable commit SHAs, and every finding is sourced and labeled by evidence strength.

**Operator instruction:** [EXECUTE-LOCAL-MISSION.md](EXECUTE-LOCAL-MISSION.md). Machine-readable seed candidates: [SOURCE-SET.json](SOURCE-SET.json); output shape: [REPORT-CONTRACT.md](REPORT-CONTRACT.md); starter: [LOCAL-AGENT-STARTER.md](LOCAL-AGENT-STARTER.md).

## Scope
- Target: current `owenservera/ARBOR` HEAD, pinned at run start.
- Candidate original repos: `owenservera/repos-hq`, `owenservera/vivim-web-harness`, `owenservera/tierflow`, `owenservera/vivim-labs`; include only currently present/approved local or GitHub sources. Optionally inspect approved research branches later.
- Runtime: the existing local ARBOR checkout, Node24/Bun as appropriate, HVI library and existing Host/MCP/capability adapters; no new graph, planner, scheduler, browser sender or second Host dispatcher.
- Outputs: one executive report, complete deterministic machine inventories, explicit completeness, capability lineage, evidence index, prioritized *proposed* improvements. No automatic migration, retire/delete, merge or pushes of donor source.
- **Execute real analysis only when the local operator requests this run**, with existing owner identity and independently authorized source roots. At rest, no scheduled scans or hidden fetches.

## What is NOT an acceptable completed mission
- “The system has passed synthetic tests” with no actual repo comparisons.
- “Use `--synthetic-stdin`” or rename real repos to `synthetic/...` to evade a restriction.
- Returning a fixture result, a source-only README, an invented completion percentage or a missing-path-as-missing-capability claim.
- Calling a remote source grant “approved” just because a user typed a repository name.
- Stopping to write yet another wave/plan when an actionable local source/runtime fix can be implemented and tested.

## Truthful completion
`OPERATIONAL_REAL_COMPARISON_COMPLETE` only if the native path executed on at least two *real* authorized pinned source revisions/repositories, produced validated artifacts and recorded observed commands/exits, with no source mutation. `PARTIAL_REAL_COMPARISON` if source scope or analysis is incomplete. `BLOCKED_REAL_SOURCE_AUTHORIZATION` or `BLOCKED_RUNTIME` if real execution is not permitted/possible: fix what is locally fixable, then report exactly what is needed rather than fabricating success.

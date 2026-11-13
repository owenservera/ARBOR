# Mission outputs — evidence-led human and machine reports
Write a new run directory on approved local storage. If eligible for GitHub, use `.integration/proposal5/hq-version-intelligence/runs/<UTC-date>-<run-id>/` **with sanitized metadata only**. Do not commit private absolute paths, secrets or full private source content.

## Required outputs
```text
RUN-RECEIPT.json
01-EXECUTIVE-SUMMARY.md
02-REPOSITORY-REVISION-MATRIX.md
03-CAPABILITY-LANDING-MATRIX.md
04-MISSING-REPLACED-AND-DUPLICATE-AUTHORITIES.md
05-LABS-AND-RESEARCH-STATUS.md
06-PRIORITIZED-BACKLOG.md
07-VERIFICATION-AND-UNCERTAINTY.md
data/source-pins.json
data/source-parity.json
data/lineage.json
data/capability-atlas.json
data/evidence-index.json
data/backlog.json
```

## Executive report (2 pages max)
Include exact target/donor repo+commit pins and collection time; counts split by `EXACT_BLOB`, `SAME_PATH_CHANGED`, `EXACT_RELOCATION`, `SIMILARITY_CANDIDATE`, `MISSING_AT_TARGET`, `UNOBSERVABLE`; only count capabilities as `LANDED`, `ADAPTED`, `REPLACED`, `NOT_WIRED`, `MISSING_CANDIDATE`, `RESEARCH_ONLY`, `DESIGN_ONLY`, `DUPLICATE_AUTHORITY`, `UNKNOWN` when evidence supports that category. Show top actual discoveries, top risks and 5 prioritized *proposed* next steps. No single migration percentage inferred from file-path presence.

## Detailed rows
Each row: `id`, `originRepo`, `originSha`, `originPath`, `originBlobSha`, `targetRepo`, `targetSha`, `targetPaths[]`, `targetBlobs[]`, `capabilityId?`, `sourceState`, `capabilityState`, `runtimeState`, `certainty`, `evidenceIds[]`, `owner`, `explanation`, `recommendedAction?`, `sourceCompleteness`. Replacements/splits/combined sources must be many-to-many and retain uncertainty. Keep exact pin manifest/digest for replay.

## Evidence
Every material source/capability finding links to actual pinned Git SHA+blob and paths/symbols/contract/test receipts. `FILE_PRESENT` is not `SOURCE_WIRED`; `SOURCE_WIRED` is not `RUNTIME_VERIFIED`; `MISSING_AT_ORIGINAL_PATH` is not `MISSING_CAPABILITY`. Explicitly record incomplete/unavailable source sets and excluded scope. A Labs document is not a deployed capability.

## Prioritized backlog
Proposals only, each with `priority`, `impact`, `owner`, `source`, `destination`, `risk`, `dependency`, `testNeeded`, `decisionNeeded`, `evidenceIds[]`, `estimatedWorkband`. No source migration automatically executed.

## RUN-RECEIPT.json
Schema `arbor.hvi.operator-run/1`, status `OPERATIONAL_REAL_COMPARISON_COMPLETE | PARTIAL_REAL_COMPARISON | BLOCKED_REAL_SOURCE_AUTHORIZATION | BLOCKED_RUNTIME`. Must record `generatedAt`, `targetPin`, `sourcePins`, `sourceGrants` (receipt IDs not tokens), `actualInvocation` (redacted), `testedEngineSha`, `sourceManifestDigests`, `reportDigests`, `coverage`, `unknownCount`, `tests[]` with exact commands/OS/tool version/exit, `realComparisonExecuted` boolean and `sourceMutationOccurred=false`. If blocked, do NOT emit placeholder real findings or fake run receipts.

## Operator handoff
Say how to repeat it later in one ordinary English request, how to add approved sources, how to switch target/revisions, and where artifacts live. Ensure all claims are drawn from actual HVI outputs rather than the old S0/D census.

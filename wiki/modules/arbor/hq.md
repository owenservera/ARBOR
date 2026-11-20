# Module: arbor/hq

> Generated 2026-11-19 · 370 files · 16678 symbols

## Files

| File | Language | Lines | Symbols |
| --- | --- | --- | --- |
| [hq/.gitignore](../../files/arbor/hq/.gitignore.md) | Other | 18 | 0 |
| [hq/MIGRATION-REPORT.md](../../files/arbor/hq/MIGRATION-REPORT.md.md) | Markdown | 87 | 0 |
| [hq/README.md](../../files/arbor/hq/README.md.md) | Markdown | 70 | 0 |
| [hq/W01D-FOLLOWUP-REPORT.md](../../files/arbor/hq/W01D-FOLLOWUP-REPORT.md.md) | Markdown | 137 | 0 |
| [hq/aii/fixtures/HQ-001-repositories.mjs](../../files/arbor/hq/aii/fixtures/HQ-001-repositories.mjs.md) | JavaScript | 64 | 10 |
| [hq/aii/fixtures/HQ-002-repo-folders.mjs](../../files/arbor/hq/aii/fixtures/HQ-002-repo-folders.mjs.md) | JavaScript | 72 | 9 |
| [hq/aii/fixtures/HQ-003-same-repo-not-duplicated.mjs](../../files/arbor/hq/aii/fixtures/HQ-003-same-repo-not-duplicated.mjs.md) | JavaScript | 86 | 14 |
| [hq/aii/fixtures/HQ-004-repository-classification.mjs](../../files/arbor/hq/aii/fixtures/HQ-004-repository-classification.mjs.md) | JavaScript | 57 | 3 |
| [hq/aii/fixtures/HQ-005-repository-dependencies.mjs](../../files/arbor/hq/aii/fixtures/HQ-005-repository-dependencies.mjs.md) | JavaScript | 89 | 13 |
| [hq/aii/fixtures/HQ-006-local-vs-github.mjs](../../files/arbor/hq/aii/fixtures/HQ-006-local-vs-github.mjs.md) | JavaScript | 86 | 10 |
| [hq/aii/fixtures/HQ-007-unintegrated-branches.mjs](../../files/arbor/hq/aii/fixtures/HQ-007-unintegrated-branches.mjs.md) | JavaScript | 74 | 6 |
| [hq/aii/fixtures/HQ-008-uncommitted-changes.mjs](../../files/arbor/hq/aii/fixtures/HQ-008-uncommitted-changes.mjs.md) | JavaScript | 81 | 9 |
| [hq/aii/fixtures/HQ-009-indexing-coverage-gaps.mjs](../../files/arbor/hq/aii/fixtures/HQ-009-indexing-coverage-gaps.mjs.md) | JavaScript | 99 | 13 |
| [hq/aii/fixtures/HQ-010-removal-blast-radius.mjs](../../files/arbor/hq/aii/fixtures/HQ-010-removal-blast-radius.mjs.md) | JavaScript | 103 | 14 |
| [hq/aii/fixtures/HQ-011-architecture.mjs](../../files/arbor/hq/aii/fixtures/HQ-011-architecture.mjs.md) | JavaScript | 52 | 7 |
| [hq/aii/fixtures/HQ-012-entrypoint.mjs](../../files/arbor/hq/aii/fixtures/HQ-012-entrypoint.mjs.md) | JavaScript | 55 | 9 |
| [hq/aii/fixtures/HQ-013-trace.mjs](../../files/arbor/hq/aii/fixtures/HQ-013-trace.mjs.md) | JavaScript | 48 | 8 |
| [hq/aii/fixtures/HQ-014-service-consumers.mjs](../../files/arbor/hq/aii/fixtures/HQ-014-service-consumers.mjs.md) | JavaScript | 96 | 12 |
| [hq/aii/fixtures/HQ-015-module-dependencies.mjs](../../files/arbor/hq/aii/fixtures/HQ-015-module-dependencies.mjs.md) | JavaScript | 91 | 13 |
| [hq/aii/fixtures/HQ-016-database-writers.mjs](../../files/arbor/hq/aii/fixtures/HQ-016-database-writers.mjs.md) | JavaScript | 57 | 9 |
| [hq/aii/fixtures/HQ-017-authorization-enforcement.mjs](../../files/arbor/hq/aii/fixtures/HQ-017-authorization-enforcement.mjs.md) | JavaScript | 39 | 3 |
| [hq/aii/fixtures/HQ-018-same-responsibility.mjs](../../files/arbor/hq/aii/fixtures/HQ-018-same-responsibility.mjs.md) | JavaScript | 104 | 11 |
| [hq/aii/fixtures/HQ-019-boundary-crossings.mjs](../../files/arbor/hq/aii/fixtures/HQ-019-boundary-crossings.mjs.md) | JavaScript | 112 | 17 |
| [hq/aii/fixtures/HQ-020-tight-coupling.mjs](../../files/arbor/hq/aii/fixtures/HQ-020-tight-coupling.mjs.md) | JavaScript | 139 | 23 |
| [hq/aii/fixtures/HQ-021-planned-features-implemented.mjs](../../files/arbor/hq/aii/fixtures/HQ-021-planned-features-implemented.mjs.md) | JavaScript | 148 | 13 |
| [hq/aii/fixtures/HQ-022-reachable-by-users.mjs](../../files/arbor/hq/aii/fixtures/HQ-022-reachable-by-users.mjs.md) | JavaScript | 75 | 6 |
| [hq/aii/fixtures/HQ-023-no-runtime-consumers.mjs](../../files/arbor/hq/aii/fixtures/HQ-023-no-runtime-consumers.mjs.md) | JavaScript | 106 | 9 |
| [hq/aii/fixtures/HQ-024-implemented-unmounted.mjs](../../files/arbor/hq/aii/fixtures/HQ-024-implemented-unmounted.mjs.md) | JavaScript | 61 | 4 |
| [hq/aii/fixtures/HQ-025-imported-never-executed.mjs](../../files/arbor/hq/aii/fixtures/HQ-025-imported-never-executed.mjs.md) | JavaScript | 83 | 7 |
| [hq/aii/fixtures/HQ-026-fixtures-only.mjs](../../files/arbor/hq/aii/fixtures/HQ-026-fixtures-only.mjs.md) | JavaScript | 92 | 4 |
| [hq/aii/fixtures/HQ-027-disabled-by-config.mjs](../../files/arbor/hq/aii/fixtures/HQ-027-disabled-by-config.mjs.md) | JavaScript | 55 | 4 |
| [hq/aii/fixtures/HQ-028-retirement-candidates.mjs](../../files/arbor/hq/aii/fixtures/HQ-028-retirement-candidates.mjs.md) | JavaScript | 70 | 11 |
| [hq/aii/fixtures/HQ-029-dynamically-loaded.mjs](../../files/arbor/hq/aii/fixtures/HQ-029-dynamically-loaded.mjs.md) | JavaScript | 165 | 13 |
| [hq/aii/fixtures/HQ-030-missing-final-integration.mjs](../../files/arbor/hq/aii/fixtures/HQ-030-missing-final-integration.mjs.md) | JavaScript | 63 | 9 |
| [hq/aii/fixtures/HQ-031-machine-snapshot.json](../../files/arbor/hq/aii/fixtures/HQ-031-machine-snapshot.json.md) | JSON | 21 | 0 |
| [hq/aii/fixtures/HQ-031-running-services.mjs](../../files/arbor/hq/aii/fixtures/HQ-031-running-services.mjs.md) | JavaScript | 91 | 12 |
| [hq/aii/fixtures/HQ-032-running-executable-version.mjs](../../files/arbor/hq/aii/fixtures/HQ-032-running-executable-version.mjs.md) | JavaScript | 83 | 13 |
| [hq/aii/fixtures/HQ-032-running-version.mjs](../../files/arbor/hq/aii/fixtures/HQ-032-running-version.mjs.md) | JavaScript | 64 | 7 |
| [hq/aii/fixtures/HQ-033-platform-conditional-features.mjs](../../files/arbor/hq/aii/fixtures/HQ-033-platform-conditional-features.mjs.md) | JavaScript | 77 | 10 |
| [hq/aii/fixtures/HQ-034-source-features-vs-manifest.mjs](../../files/arbor/hq/aii/fixtures/HQ-034-source-features-vs-manifest.mjs.md) | JavaScript | 86 | 11 |
| [hq/aii/fixtures/HQ-035-device-verification-absence.mjs](../../files/arbor/hq/aii/fixtures/HQ-035-device-verification-absence.mjs.md) | JavaScript | 81 | 12 |
| [hq/aii/fixtures/HQ-036-documented-capabilities-without-implementation.mjs](../../files/arbor/hq/aii/fixtures/HQ-036-documented-capabilities-without-implementation.mjs.md) | JavaScript | 135 | 13 |
| [hq/aii/fixtures/HQ-037-labs-designs-implemented-elsewhere.mjs](../../files/arbor/hq/aii/fixtures/HQ-037-labs-designs-implemented-elsewhere.mjs.md) | JavaScript | 127 | 12 |
| [hq/aii/fixtures/HQ-038-research-prototype-promotion.mjs](../../files/arbor/hq/aii/fixtures/HQ-038-research-prototype-promotion.mjs.md) | JavaScript | 134 | 14 |
| [hq/aii/fixtures/HQ-039-outdated-docs.mjs](../../files/arbor/hq/aii/fixtures/HQ-039-outdated-docs.mjs.md) | JavaScript | 60 | 5 |
| [hq/aii/fixtures/HQ-040-contradicting-docs.mjs](../../files/arbor/hq/aii/fixtures/HQ-040-contradicting-docs.mjs.md) | JavaScript | 69 | 8 |
| [hq/aii/fixtures/HQ-041-superseded-decisions.mjs](../../files/arbor/hq/aii/fixtures/HQ-041-superseded-decisions.mjs.md) | JavaScript | 118 | 18 |
| [hq/aii/fixtures/HQ-042-decision-provenance.mjs](../../files/arbor/hq/aii/fixtures/HQ-042-decision-provenance.mjs.md) | JavaScript | 96 | 10 |
| [hq/aii/fixtures/HQ-043-requirements-owner.mjs](../../files/arbor/hq/aii/fixtures/HQ-043-requirements-owner.mjs.md) | JavaScript | 68 | 4 |
| [hq/aii/fixtures/HQ-044-conflicting-specs.mjs](../../files/arbor/hq/aii/fixtures/HQ-044-conflicting-specs.mjs.md) | JavaScript | 91 | 10 |
| [hq/aii/fixtures/HQ-045-archival-knowledge-loss.mjs](../../files/arbor/hq/aii/fixtures/HQ-045-archival-knowledge-loss.mjs.md) | JavaScript | 93 | 12 |
| [hq/aii/fixtures/HQ-046-prove-feature.mjs](../../files/arbor/hq/aii/fixtures/HQ-046-prove-feature.mjs.md) | JavaScript | 41 | 7 |
| [hq/aii/fixtures/HQ-047-completion-claims.mjs](../../files/arbor/hq/aii/fixtures/HQ-047-completion-claims.mjs.md) | JavaScript | 49 | 8 |
| [hq/aii/fixtures/HQ-048-tests-older-revisions.mjs](../../files/arbor/hq/aii/fixtures/HQ-048-tests-older-revisions.mjs.md) | JavaScript | 73 | 10 |
| [hq/aii/fixtures/HQ-049-not-reproducible.mjs](../../files/arbor/hq/aii/fixtures/HQ-049-not-reproducible.mjs.md) | JavaScript | 41 | 5 |
| [hq/aii/fixtures/HQ-050-evidence-needed.mjs](../../files/arbor/hq/aii/fixtures/HQ-050-evidence-needed.mjs.md) | JavaScript | 98 | 18 |
| [hq/aii/fixtures/HQ-051-unit-only-critical-behaviors.mjs](../../files/arbor/hq/aii/fixtures/HQ-051-unit-only-critical-behaviors.mjs.md) | JavaScript | 125 | 18 |
| [hq/aii/fixtures/HQ-052-never-independently-verified.mjs](../../files/arbor/hq/aii/fixtures/HQ-052-never-independently-verified.mjs.md) | JavaScript | 93 | 9 |
| [hq/aii/fixtures/HQ-053-fixture-evidence.mjs](../../files/arbor/hq/aii/fixtures/HQ-053-fixture-evidence.mjs.md) | JavaScript | 104 | 14 |
| [hq/aii/fixtures/HQ-054-uninspectable-environments.mjs](../../files/arbor/hq/aii/fixtures/HQ-054-uninspectable-environments.mjs.md) | JavaScript | 71 | 9 |
| [hq/aii/fixtures/HQ-055-strongest-evidence.mjs](../../files/arbor/hq/aii/fixtures/HQ-055-strongest-evidence.mjs.md) | JavaScript | 95 | 9 |
| [hq/aii/fixtures/HQ-056-disagreeing-completion-reports.mjs](../../files/arbor/hq/aii/fixtures/HQ-056-disagreeing-completion-reports.mjs.md) | JavaScript | 81 | 8 |
| [hq/aii/fixtures/HQ-057-authoritative-repo.mjs](../../files/arbor/hq/aii/fixtures/HQ-057-authoritative-repo.mjs.md) | JavaScript | 106 | 13 |
| [hq/aii/fixtures/HQ-058-route-documented-not-mounted.mjs](../../files/arbor/hq/aii/fixtures/HQ-058-route-documented-not-mounted.mjs.md) | JavaScript | 100 | 14 |
| [hq/aii/fixtures/HQ-059-changes-between-versions.mjs](../../files/arbor/hq/aii/fixtures/HQ-059-changes-between-versions.mjs.md) | JavaScript | 69 | 8 |
| [hq/aii/fixtures/HQ-060-tests-pass-runtime-fails.mjs](../../files/arbor/hq/aii/fixtures/HQ-060-tests-pass-runtime-fails.mjs.md) | JavaScript | 97 | 10 |
| [hq/aii/fixtures/HQ-061-regression-attribution.mjs](../../files/arbor/hq/aii/fixtures/HQ-061-regression-attribution.mjs.md) | JavaScript | 167 | 17 |
| [hq/aii/fixtures/HQ-062-shared-assumptions.mjs](../../files/arbor/hq/aii/fixtures/HQ-062-shared-assumptions.mjs.md) | JavaScript | 111 | 15 |
| [hq/aii/fixtures/HQ-063-missing-dependency.mjs](../../files/arbor/hq/aii/fixtures/HQ-063-missing-dependency.mjs.md) | JavaScript | 115 | 16 |
| [hq/aii/fixtures/HQ-064-evidence-to-distinguish-explanations.mjs](../../files/arbor/hq/aii/fixtures/HQ-064-evidence-to-distinguish-explanations.mjs.md) | JavaScript | 25 | 2 |
| [hq/aii/fixtures/HQ-065-root-cause.mjs](../../files/arbor/hq/aii/fixtures/HQ-065-root-cause.mjs.md) | JavaScript | 25 | 2 |
| [hq/aii/fixtures/HQ-066-agent-systems.mjs](../../files/arbor/hq/aii/fixtures/HQ-066-agent-systems.mjs.md) | JavaScript | 65 | 9 |
| [hq/aii/fixtures/HQ-067-zcode-vs-opencode-config.mjs](../../files/arbor/hq/aii/fixtures/HQ-067-zcode-vs-opencode-config.mjs.md) | JavaScript | 109 | 6 |
| [hq/aii/fixtures/HQ-068-custom-hooks.mjs](../../files/arbor/hq/aii/fixtures/HQ-068-custom-hooks.mjs.md) | JavaScript | 73 | 9 |
| [hq/aii/fixtures/HQ-069-agent-tool-coupling.mjs](../../files/arbor/hq/aii/fixtures/HQ-069-agent-tool-coupling.mjs.md) | JavaScript | 87 | 6 |
| [hq/aii/fixtures/HQ-070-agent-instruction-conflicts.mjs](../../files/arbor/hq/aii/fixtures/HQ-070-agent-instruction-conflicts.mjs.md) | JavaScript | 60 | 3 |
| [hq/aii/fixtures/HQ-071-interface-change-impact.mjs](../../files/arbor/hq/aii/fixtures/HQ-071-interface-change-impact.mjs.md) | JavaScript | 77 | 10 |
| [hq/aii/fixtures/HQ-072-module-migration-consumers.mjs](../../files/arbor/hq/aii/fixtures/HQ-072-module-migration-consumers.mjs.md) | JavaScript | 104 | 13 |
| [hq/aii/fixtures/HQ-073-tests-after-change.mjs](../../files/arbor/hq/aii/fixtures/HQ-073-tests-after-change.mjs.md) | JavaScript | 100 | 16 |
| [hq/aii/fixtures/HQ-074-minimal-orphan-connection.mjs](../../files/arbor/hq/aii/fixtures/HQ-074-minimal-orphan-connection.mjs.md) | JavaScript | 123 | 18 |
| [hq/aii/fixtures/HQ-075-dependency-upgrade-impact.mjs](../../files/arbor/hq/aii/fixtures/HQ-075-dependency-upgrade-impact.mjs.md) | JavaScript | 111 | 16 |
| [hq/aii/fixtures/HQ-076-migration-risks.mjs](../../files/arbor/hq/aii/fixtures/HQ-076-migration-risks.mjs.md) | JavaScript | 127 | 16 |
| [hq/aii/fixtures/HQ-077-change-independence.mjs](../../files/arbor/hq/aii/fixtures/HQ-077-change-independence.mjs.md) | JavaScript | 119 | 17 |
| [hq/aii/fixtures/HQ-078-integration-sequencing.mjs](../../files/arbor/hq/aii/fixtures/HQ-078-integration-sequencing.mjs.md) | JavaScript | 125 | 19 |
| [hq/aii/fixtures/HQ-079-merge-evidence-gap.mjs](../../files/arbor/hq/aii/fixtures/HQ-079-merge-evidence-gap.mjs.md) | JavaScript | 190 | 13 |
| [hq/aii/fixtures/HQ-080-consolidation-sequence.mjs](../../files/arbor/hq/aii/fixtures/HQ-080-consolidation-sequence.mjs.md) | JavaScript | 103 | 16 |
| [hq/aii/fixtures/HQ-081-remaining-release-work.mjs](../../files/arbor/hq/aii/fixtures/HQ-081-remaining-release-work.mjs.md) | JavaScript | 102 | 8 |
| [hq/aii/fixtures/HQ-082-rank-unfinished-by-user-value.mjs](../../files/arbor/hq/aii/fixtures/HQ-082-rank-unfinished-by-user-value.mjs.md) | JavaScript | 70 | 3 |
| [hq/aii/fixtures/HQ-083-blocked-same-dependency.mjs](../../files/arbor/hq/aii/fixtures/HQ-083-blocked-same-dependency.mjs.md) | JavaScript | 92 | 12 |
| [hq/aii/fixtures/HQ-084-duplicate-completed-work.mjs](../../files/arbor/hq/aii/fixtures/HQ-084-duplicate-completed-work.mjs.md) | JavaScript | 62 | 5 |
| [hq/aii/fixtures/HQ-085-critical-path-ownerless.mjs](../../files/arbor/hq/aii/fixtures/HQ-085-critical-path-ownerless.mjs.md) | JavaScript | 90 | 13 |
| [hq/aii/fixtures/HQ-086-minimal-releasable-scope.mjs](../../files/arbor/hq/aii/fixtures/HQ-086-minimal-releasable-scope.mjs.md) | JavaScript | 53 | 3 |
| [hq/aii/fixtures/HQ-087-unnecessary-planned-features.mjs](../../files/arbor/hq/aii/fixtures/HQ-087-unnecessary-planned-features.mjs.md) | JavaScript | 133 | 14 |
| [hq/aii/fixtures/HQ-088-release-blocking-integrations.mjs](../../files/arbor/hq/aii/fixtures/HQ-088-release-blocking-integrations.mjs.md) | JavaScript | 78 | 4 |
| [hq/aii/fixtures/HQ-089-component-regression.mjs](../../files/arbor/hq/aii/fixtures/HQ-089-component-regression.mjs.md) | JavaScript | 101 | 10 |
| [hq/aii/fixtures/HQ-089-performance-regression-components.mjs](../../files/arbor/hq/aii/fixtures/HQ-089-performance-regression-components.mjs.md) | JavaScript | 202 | 22 |
| [hq/aii/fixtures/HQ-090-redundant-computation.mjs](../../files/arbor/hq/aii/fixtures/HQ-090-redundant-computation.mjs.md) | JavaScript | 110 | 16 |
| [hq/aii/fixtures/HQ-090-redundant-indexing.mjs](../../files/arbor/hq/aii/fixtures/HQ-090-redundant-indexing.mjs.md) | JavaScript | 76 | 10 |
| [hq/aii/fixtures/HQ-091-background-consumption.mjs](../../files/arbor/hq/aii/fixtures/HQ-091-background-consumption.mjs.md) | JavaScript | 92 | 11 |
| [hq/aii/fixtures/HQ-091-background-process-consumption.mjs](../../files/arbor/hq/aii/fixtures/HQ-091-background-process-consumption.mjs.md) | JavaScript | 251 | 26 |
| [hq/aii/fixtures/HQ-092-best-verified-configuration.mjs](../../files/arbor/hq/aii/fixtures/HQ-092-best-verified-configuration.mjs.md) | JavaScript | 103 | 9 |
| [hq/aii/fixtures/HQ-093-retrieval-latency-staleness.mjs](../../files/arbor/hq/aii/fixtures/HQ-093-retrieval-latency-staleness.mjs.md) | JavaScript | 109 | 17 |
| [hq/aii/fixtures/HQ-094-investigate-architectural-question.mjs](../../files/arbor/hq/aii/fixtures/HQ-094-investigate-architectural-question.mjs.md) | JavaScript | 94 | 10 |
| [hq/aii/fixtures/HQ-095-unknowns-investigation.mjs](../../files/arbor/hq/aii/fixtures/HQ-095-unknowns-investigation.mjs.md) | JavaScript | 97 | 10 |
| [hq/aii/fixtures/HQ-096-challenge-conclusions.mjs](../../files/arbor/hq/aii/fixtures/HQ-096-challenge-conclusions.mjs.md) | JavaScript | 150 | 20 |
| [hq/aii/fixtures/HQ-097-materially-changed.mjs](../../files/arbor/hq/aii/fixtures/HQ-097-materially-changed.mjs.md) | JavaScript | 99 | 14 |
| [hq/aii/fixtures/HQ-098-stale-findings.mjs](../../files/arbor/hq/aii/fixtures/HQ-098-stale-findings.mjs.md) | JavaScript | 80 | 7 |
| [hq/aii/fixtures/HQ-099-self-audit.mjs](../../files/arbor/hq/aii/fixtures/HQ-099-self-audit.mjs.md) | JavaScript | 132 | 20 |
| [hq/aii/fixtures/HQ-100-autonomous-investigation.mjs](../../files/arbor/hq/aii/fixtures/HQ-100-autonomous-investigation.mjs.md) | JavaScript | 137 | 12 |
| [hq/aii/fixtures/HQ-101-frontier-model-candidates.mjs](../../files/arbor/hq/aii/fixtures/HQ-101-frontier-model-candidates.mjs.md) | JavaScript | 92 | 14 |
| [hq/aii/fixtures/HQ-102-core-vs-peripheral.mjs](../../files/arbor/hq/aii/fixtures/HQ-102-core-vs-peripheral.mjs.md) | JavaScript | 85 | 11 |
| [hq/aii/fixtures/HQ-103-strongest-model-only-components.mjs](../../files/arbor/hq/aii/fixtures/HQ-103-strongest-model-only-components.mjs.md) | JavaScript | 88 | 14 |
| [hq/aii/fixtures/HQ-104-high-impact-code.mjs](../../files/arbor/hq/aii/fixtures/HQ-104-high-impact-code.mjs.md) | JavaScript | 74 | 11 |
| [hq/aii/fixtures/HQ-105-complex-modules.mjs](../../files/arbor/hq/aii/fixtures/HQ-105-complex-modules.mjs.md) | JavaScript | 121 | 17 |
| [hq/aii/fixtures/HQ-106-expensive-areas.mjs](../../files/arbor/hq/aii/fixtures/HQ-106-expensive-areas.mjs.md) | JavaScript | 83 | 9 |
| [hq/aii/fixtures/HQ-107-work-queue-model-ranking.mjs](../../files/arbor/hq/aii/fixtures/HQ-107-work-queue-model-ranking.mjs.md) | JavaScript | 79 | 10 |
| [hq/aii/fixtures/HQ-108-unscrutinized-core-changes.mjs](../../files/arbor/hq/aii/fixtures/HQ-108-unscrutinized-core-changes.mjs.md) | JavaScript | 74 | 8 |
| [hq/aii/fixtures/HQ-109-subsystem-implicit-knowledge.mjs](../../files/arbor/hq/aii/fixtures/HQ-109-subsystem-implicit-knowledge.mjs.md) | JavaScript | 77 | 6 |
| [hq/aii/fixtures/HQ-110-autonomous-routing-decision.mjs](../../files/arbor/hq/aii/fixtures/HQ-110-autonomous-routing-decision.mjs.md) | JavaScript | 90 | 8 |
| [hq/aii/fixtures/HQ-111-register-new-repo-class.mjs](../../files/arbor/hq/aii/fixtures/HQ-111-register-new-repo-class.mjs.md) | JavaScript | 84 | 11 |
| [hq/aii/fixtures/HQ-112-multi-class-sources.mjs](../../files/arbor/hq/aii/fixtures/HQ-112-multi-class-sources.mjs.md) | JavaScript | 73 | 8 |
| [hq/aii/fixtures/HQ-113-harvestable-assets-identification.mjs](../../files/arbor/hq/aii/fixtures/HQ-113-harvestable-assets-identification.mjs.md) | JavaScript | 104 | 22 |
| [hq/aii/fixtures/HQ-114-compare-registered-repos.mjs](../../files/arbor/hq/aii/fixtures/HQ-114-compare-registered-repos.mjs.md) | JavaScript | 109 | 16 |
| [hq/aii/fixtures/HQ-115-domain-query-ranking.mjs](../../files/arbor/hq/aii/fixtures/HQ-115-domain-query-ranking.mjs.md) | JavaScript | 114 | 13 |
| [hq/aii/fixtures/HQ-116-harvest-ready-components.mjs](../../files/arbor/hq/aii/fixtures/HQ-116-harvest-ready-components.mjs.md) | JavaScript | 90 | 15 |
| [hq/aii/fixtures/HQ-117-harvesting-plan.mjs](../../files/arbor/hq/aii/fixtures/HQ-117-harvesting-plan.mjs.md) | JavaScript | 105 | 18 |
| [hq/aii/fixtures/HQ-118-harvesting-provenance.mjs](../../files/arbor/hq/aii/fixtures/HQ-118-harvesting-provenance.mjs.md) | JavaScript | 79 | 6 |
| [hq/aii/fixtures/HQ-119-autonomous-harvest-shortlist.mjs](../../files/arbor/hq/aii/fixtures/HQ-119-autonomous-harvest-shortlist.mjs.md) | JavaScript | 93 | 12 |
| [hq/aii/fixtures/HQ-120-harvestable-update-monitoring.mjs](../../files/arbor/hq/aii/fixtures/HQ-120-harvestable-update-monitoring.mjs.md) | JavaScript | 106 | 20 |
| [hq/aii/fixtures/harness.mjs](../../files/arbor/hq/aii/fixtures/harness.mjs.md) | JavaScript | 226 | 40 |
| [hq/bin/arbor-hq.mjs](../../files/arbor/hq/bin/arbor-hq.mjs.md) | JavaScript | 49 | 7 |
| [hq/bin/autonomy.mjs](../../files/arbor/hq/bin/autonomy.mjs.md) | JavaScript | 542 | 81 |
| [hq/bin/console.mjs](../../files/arbor/hq/bin/console.mjs.md) | JavaScript | 164 | 53 |
| [hq/bin/dogfood-execution.mjs](../../files/arbor/hq/bin/dogfood-execution.mjs.md) | JavaScript | 1088 | 175 |
| [hq/bin/dogfood.mjs](../../files/arbor/hq/bin/dogfood.mjs.md) | JavaScript | 310 | 86 |
| [hq/bin/hq.mjs](../../files/arbor/hq/bin/hq.mjs.md) | JavaScript | 4395 | 898 |
| [hq/bin/revive.mjs](../../files/arbor/hq/bin/revive.mjs.md) | JavaScript | 245 | 51 |
| [hq/bin/spawn.mjs](../../files/arbor/hq/bin/spawn.mjs.md) | JavaScript | 540 | 129 |
| [hq/bin/wave1-kb-export.mjs](../../files/arbor/hq/bin/wave1-kb-export.mjs.md) | JavaScript | 26 | 9 |
| [hq/bin/wave1-lane-a.mjs](../../files/arbor/hq/bin/wave1-lane-a.mjs.md) | JavaScript | 67 | 25 |
| [hq/capabilities/registry/contracts.v1.json](../../files/arbor/hq/capabilities/registry/contracts.v1.json.md) | JSON | 215 | 0 |
| [hq/capabilities/registry/taxonomy.v1.json](../../files/arbor/hq/capabilities/registry/taxonomy.v1.json.md) | JSON | 197 | 0 |
| [hq/catalogue-identity/EXPORT-CONTRACT.md](../../files/arbor/hq/catalogue-identity/EXPORT-CONTRACT.md.md) | Markdown | 79 | 0 |
| [hq/catalogue-identity/README.md](../../files/arbor/hq/catalogue-identity/README.md.md) | Markdown | 28 | 0 |
| [hq/catalogue-identity/cli.mjs](../../files/arbor/hq/catalogue-identity/cli.mjs.md) | JavaScript | 48 | 9 |
| [hq/catalogue-identity/crosswalk.mjs](../../files/arbor/hq/catalogue-identity/crosswalk.mjs.md) | JavaScript | 294 | 105 |
| [hq/catalogue-identity/labs-adapter.mjs](../../files/arbor/hq/catalogue-identity/labs-adapter.mjs.md) | JavaScript | 29 | 2 |
| [hq/catalogue-identity/observer-export.mjs](../../files/arbor/hq/catalogue-identity/observer-export.mjs.md) | JavaScript | 58 | 13 |
| [hq/catalogue-identity/source-adapters.mjs](../../files/arbor/hq/catalogue-identity/source-adapters.mjs.md) | JavaScript | 68 | 7 |
| [hq/catalogue-identity/test/benchmark.mjs](../../files/arbor/hq/catalogue-identity/test/benchmark.mjs.md) | JavaScript | 13 | 4 |
| [hq/catalogue-identity/test/crosswalk.test.mjs](../../files/arbor/hq/catalogue-identity/test/crosswalk.test.mjs.md) | JavaScript | 156 | 39 |
| [hq/lib/action-registry.mjs](../../files/arbor/hq/lib/action-registry.mjs.md) | JavaScript | 286 | 47 |
| [hq/lib/action-router.mjs](../../files/arbor/hq/lib/action-router.mjs.md) | JavaScript | 205 | 37 |
| [hq/lib/actions/aliases.mjs](../../files/arbor/hq/lib/actions/aliases.mjs.md) | JavaScript | 78 | 8 |
| [hq/lib/actions/domains-1.mjs](../../files/arbor/hq/lib/actions/domains-1.mjs.md) | JavaScript | 104 | 1 |
| [hq/lib/actions/domains-2.mjs](../../files/arbor/hq/lib/actions/domains-2.mjs.md) | JavaScript | 270 | 1 |
| [hq/lib/actions/domains-3.mjs](../../files/arbor/hq/lib/actions/domains-3.mjs.md) | JavaScript | 262 | 1 |
| [hq/lib/actions/domains-4.mjs](../../files/arbor/hq/lib/actions/domains-4.mjs.md) | JavaScript | 260 | 1 |
| [hq/lib/actions/handlers.mjs](../../files/arbor/hq/lib/actions/handlers.mjs.md) | JavaScript | 68 | 1 |
| [hq/lib/actions/verbs.mjs](../../files/arbor/hq/lib/actions/verbs.mjs.md) | JavaScript | 115 | 1 |
| [hq/lib/aii/plan.mjs](../../files/arbor/hq/lib/aii/plan.mjs.md) | JavaScript | 335 | 77 |
| [hq/lib/aii/receipts-policy.mjs](../../files/arbor/hq/lib/aii/receipts-policy.mjs.md) | JavaScript | 240 | 39 |
| [hq/lib/aii/registry.mjs](../../files/arbor/hq/lib/aii/registry.mjs.md) | JavaScript | 208 | 31 |
| [hq/lib/aii/runner.mjs](../../files/arbor/hq/lib/aii/runner.mjs.md) | JavaScript | 291 | 41 |
| [hq/lib/aii/scenarios.mjs](../../files/arbor/hq/lib/aii/scenarios.mjs.md) | JavaScript | 179 | 5 |
| [hq/lib/aii/state.mjs](../../files/arbor/hq/lib/aii/state.mjs.md) | JavaScript | 223 | 41 |
| [hq/lib/aii/views.mjs](../../files/arbor/hq/lib/aii/views.mjs.md) | JavaScript | 211 | 23 |
| [hq/lib/annotation-v2.mjs](../../files/arbor/hq/lib/annotation-v2.mjs.md) | JavaScript | 363 | 68 |
| [hq/lib/approvals.mjs](../../files/arbor/hq/lib/approvals.mjs.md) | JavaScript | 348 | 58 |
| [hq/lib/arbor-service.mjs](../../files/arbor/hq/lib/arbor-service.mjs.md) | JavaScript | 581 | 150 |
| [hq/lib/ask.mjs](../../files/arbor/hq/lib/ask.mjs.md) | JavaScript | 144 | 9 |
| [hq/lib/automation.mjs](../../files/arbor/hq/lib/automation.mjs.md) | JavaScript | 646 | 119 |
| [hq/lib/autonomy.mjs](../../files/arbor/hq/lib/autonomy.mjs.md) | JavaScript | 901 | 137 |
| [hq/lib/canon.mjs](../../files/arbor/hq/lib/canon.mjs.md) | JavaScript | 2559 | 578 |
| [hq/lib/canvas.mjs](../../files/arbor/hq/lib/canvas.mjs.md) | JavaScript | 899 | 220 |
| [hq/lib/capabilities.mjs](../../files/arbor/hq/lib/capabilities.mjs.md) | JavaScript | 566 | 161 |
| [hq/lib/capability-schema.mjs](../../files/arbor/hq/lib/capability-schema.mjs.md) | JavaScript | 197 | 1 |
| [hq/lib/catalogue-delta.mjs](../../files/arbor/hq/lib/catalogue-delta.mjs.md) | JavaScript | 169 | 58 |
| [hq/lib/channel-broker.mjs](../../files/arbor/hq/lib/channel-broker.mjs.md) | JavaScript | 1033 | 151 |
| [hq/lib/channel-seats.mjs](../../files/arbor/hq/lib/channel-seats.mjs.md) | JavaScript | 358 | 63 |
| [hq/lib/channel-transport.mjs](../../files/arbor/hq/lib/channel-transport.mjs.md) | JavaScript | 414 | 73 |
| [hq/lib/channel-wake.mjs](../../files/arbor/hq/lib/channel-wake.mjs.md) | JavaScript | 143 | 21 |
| [hq/lib/cnp.mjs](../../files/arbor/hq/lib/cnp.mjs.md) | JavaScript | 190 | 56 |
| [hq/lib/comment-wiki-bridge.mjs](../../files/arbor/hq/lib/comment-wiki-bridge.mjs.md) | JavaScript | 194 | 55 |
| [hq/lib/comms-roof.mjs](../../files/arbor/hq/lib/comms-roof.mjs.md) | JavaScript | 561 | 145 |
| [hq/lib/components.mjs](../../files/arbor/hq/lib/components.mjs.md) | JavaScript | 2158 | 481 |
| [hq/lib/context-budget.mjs](../../files/arbor/hq/lib/context-budget.mjs.md) | JavaScript | 319 | 78 |
| [hq/lib/context.mjs](../../files/arbor/hq/lib/context.mjs.md) | JavaScript | 1045 | 256 |
| [hq/lib/dogfood.mjs](../../files/arbor/hq/lib/dogfood.mjs.md) | JavaScript | 1233 | 223 |
| [hq/lib/evidence-join.mjs](../../files/arbor/hq/lib/evidence-join.mjs.md) | JavaScript | 361 | 56 |
| [hq/lib/extract.mjs](../../files/arbor/hq/lib/extract.mjs.md) | JavaScript | 1420 | 297 |
| [hq/lib/filetypes.mjs](../../files/arbor/hq/lib/filetypes.mjs.md) | JavaScript | 971 | 171 |
| [hq/lib/freshness.mjs](../../files/arbor/hq/lib/freshness.mjs.md) | JavaScript | 37 | 8 |
| [hq/lib/fsf/client.mjs](../../files/arbor/hq/lib/fsf/client.mjs.md) | JavaScript | 262 | 36 |
| [hq/lib/fsf/server.mjs](../../files/arbor/hq/lib/fsf/server.mjs.md) | JavaScript | 816 | 92 |
| [hq/lib/fsf/slices.mjs](../../files/arbor/hq/lib/fsf/slices.mjs.md) | JavaScript | 343 | 32 |
| [hq/lib/fsf/store.mjs](../../files/arbor/hq/lib/fsf/store.mjs.md) | JavaScript | 397 | 53 |
| [hq/lib/git-context.mjs](../../files/arbor/hq/lib/git-context.mjs.md) | JavaScript | 424 | 71 |
| [hq/lib/git.mjs](../../files/arbor/hq/lib/git.mjs.md) | JavaScript | 152 | 45 |
| [hq/lib/graph.mjs](../../files/arbor/hq/lib/graph.mjs.md) | JavaScript | 854 | 198 |
| [hq/lib/home.mjs](../../files/arbor/hq/lib/home.mjs.md) | JavaScript | 887 | 208 |
| [hq/lib/indexer.mjs](../../files/arbor/hq/lib/indexer.mjs.md) | JavaScript | 972 | 165 |
| [hq/lib/kb-bind.mjs](../../files/arbor/hq/lib/kb-bind.mjs.md) | JavaScript | 243 | 44 |
| [hq/lib/kb-intake.mjs](../../files/arbor/hq/lib/kb-intake.mjs.md) | JavaScript | 1597 | 275 |
| [hq/lib/kb.mjs](../../files/arbor/hq/lib/kb.mjs.md) | JavaScript | 1185 | 241 |
| [hq/lib/kernel/cli.mjs](../../files/arbor/hq/lib/kernel/cli.mjs.md) | JavaScript | 113 | 22 |
| [hq/lib/kernel/store.mjs](../../files/arbor/hq/lib/kernel/store.mjs.md) | JavaScript | 681 | 124 |
| [hq/lib/kg-export.mjs](../../files/arbor/hq/lib/kg-export.mjs.md) | JavaScript | 498 | 100 |
| [hq/lib/lake.mjs](../../files/arbor/hq/lib/lake.mjs.md) | JavaScript | 1393 | 275 |
| [hq/lib/lane-health.mjs](../../files/arbor/hq/lib/lane-health.mjs.md) | JavaScript | 151 | 25 |
| [hq/lib/lang.mjs](../../files/arbor/hq/lib/lang.mjs.md) | JavaScript | 121 | 23 |
| [hq/lib/live-graph/wave1/lane-a-r2-audit.mjs](../../files/arbor/hq/lib/live-graph/wave1/lane-a-r2-audit.mjs.md) | JavaScript | 184 | 49 |
| [hq/lib/live-graph/wave1/lane-a-r2-discovery.mjs](../../files/arbor/hq/lib/live-graph/wave1/lane-a-r2-discovery.mjs.md) | JavaScript | 85 | 33 |
| [hq/lib/live-graph/wave1/lane-a.mjs](../../files/arbor/hq/lib/live-graph/wave1/lane-a.mjs.md) | JavaScript | 119 | 35 |
| [hq/lib/machine-probe.mjs](../../files/arbor/hq/lib/machine-probe.mjs.md) | JavaScript | 300 | 57 |
| [hq/lib/mcp-team-tools.mjs](../../files/arbor/hq/lib/mcp-team-tools.mjs.md) | JavaScript | 691 | 126 |
| [hq/lib/mcp.mjs](../../files/arbor/hq/lib/mcp.mjs.md) | JavaScript | 419 | 48 |
| [hq/lib/memory.mjs](../../files/arbor/hq/lib/memory.mjs.md) | JavaScript | 257 | 48 |
| [hq/lib/mission-evaluator.mjs](../../files/arbor/hq/lib/mission-evaluator.mjs.md) | JavaScript | 115 | 23 |
| [hq/lib/mission-intelligence.mjs](../../files/arbor/hq/lib/mission-intelligence.mjs.md) | JavaScript | 181 | 46 |
| [hq/lib/mission-shadow.mjs](../../files/arbor/hq/lib/mission-shadow.mjs.md) | JavaScript | 136 | 36 |
| [hq/lib/mission-sources.mjs](../../files/arbor/hq/lib/mission-sources.mjs.md) | JavaScript | 90 | 23 |
| [hq/lib/model-budget.mjs](../../files/arbor/hq/lib/model-budget.mjs.md) | JavaScript | 381 | 80 |
| [hq/lib/model-inventory.mjs](../../files/arbor/hq/lib/model-inventory.mjs.md) | JavaScript | 120 | 39 |
| [hq/lib/model-router.mjs](../../files/arbor/hq/lib/model-router.mjs.md) | JavaScript | 762 | 150 |
| [hq/lib/nomenclature.mjs](../../files/arbor/hq/lib/nomenclature.mjs.md) | JavaScript | 125 | 10 |
| [hq/lib/personal-corpus-contract.mjs](../../files/arbor/hq/lib/personal-corpus-contract.mjs.md) | JavaScript | 154 | 30 |
| [hq/lib/pmo.mjs](../../files/arbor/hq/lib/pmo.mjs.md) | JavaScript | 978 | 187 |
| [hq/lib/protocol.mjs](../../files/arbor/hq/lib/protocol.mjs.md) | JavaScript | 515 | 87 |
| [hq/lib/realtime.mjs](../../files/arbor/hq/lib/realtime.mjs.md) | JavaScript | 413 | 65 |
| [hq/lib/receipts.mjs](../../files/arbor/hq/lib/receipts.mjs.md) | JavaScript | 123 | 24 |
| [hq/lib/refresh.mjs](../../files/arbor/hq/lib/refresh.mjs.md) | JavaScript | 395 | 70 |
| [hq/lib/registry.mjs](../../files/arbor/hq/lib/registry.mjs.md) | JavaScript | 315 | 80 |
| [hq/lib/release-plan.mjs](../../files/arbor/hq/lib/release-plan.mjs.md) | JavaScript | 321 | 64 |
| [hq/lib/release-status.mjs](../../files/arbor/hq/lib/release-status.mjs.md) | JavaScript | 129 | 31 |
| [hq/lib/revive-daemon.mjs](../../files/arbor/hq/lib/revive-daemon.mjs.md) | JavaScript | 230 | 25 |
| [hq/lib/revive-lane.mjs](../../files/arbor/hq/lib/revive-lane.mjs.md) | JavaScript | 223 | 38 |
| [hq/lib/revocations.mjs](../../files/arbor/hq/lib/revocations.mjs.md) | JavaScript | 234 | 44 |
| [hq/lib/schema.mjs](../../files/arbor/hq/lib/schema.mjs.md) | JavaScript | 556 | 16 |
| [hq/lib/search.mjs](../../files/arbor/hq/lib/search.mjs.md) | JavaScript | 530 | 133 |
| [hq/lib/seat-heartbeat.mjs](../../files/arbor/hq/lib/seat-heartbeat.mjs.md) | JavaScript | 420 | 58 |
| [hq/lib/seat-watch.mjs](../../files/arbor/hq/lib/seat-watch.mjs.md) | JavaScript | 236 | 31 |
| [hq/lib/semantic-optimizers.mjs](../../files/arbor/hq/lib/semantic-optimizers.mjs.md) | JavaScript | 267 | 88 |
| [hq/lib/semantic-registry.mjs](../../files/arbor/hq/lib/semantic-registry.mjs.md) | JavaScript | 473 | 108 |
| [hq/lib/session-card.mjs](../../files/arbor/hq/lib/session-card.mjs.md) | JavaScript | 234 | 49 |
| [hq/lib/session-import.mjs](../../files/arbor/hq/lib/session-import.mjs.md) | JavaScript | 365 | 70 |
| [hq/lib/session-parts.mjs](../../files/arbor/hq/lib/session-parts.mjs.md) | JavaScript | 375 | 56 |
| [hq/lib/session-views.mjs](../../files/arbor/hq/lib/session-views.mjs.md) | JavaScript | 221 | 46 |
| [hq/lib/sessions.mjs](../../files/arbor/hq/lib/sessions.mjs.md) | JavaScript | 1711 | 382 |
| [hq/lib/skills.mjs](../../files/arbor/hq/lib/skills.mjs.md) | JavaScript | 522 | 118 |
| [hq/lib/spawn.mjs](../../files/arbor/hq/lib/spawn.mjs.md) | JavaScript | 341 | 44 |
| [hq/lib/task-lifecycle.mjs](../../files/arbor/hq/lib/task-lifecycle.mjs.md) | JavaScript | 416 | 62 |
| [hq/lib/taxonomy.mjs](../../files/arbor/hq/lib/taxonomy.mjs.md) | JavaScript | 374 | 67 |
| [hq/lib/team-automation.mjs](../../files/arbor/hq/lib/team-automation.mjs.md) | JavaScript | 610 | 111 |
| [hq/lib/team-dashboard.mjs](../../files/arbor/hq/lib/team-dashboard.mjs.md) | JavaScript | 629 | 101 |
| [hq/lib/team-panel.mjs](../../files/arbor/hq/lib/team-panel.mjs.md) | JavaScript | 515 | 103 |
| [hq/lib/team-protocol.mjs](../../files/arbor/hq/lib/team-protocol.mjs.md) | JavaScript | 408 | 19 |
| [hq/lib/telemetry.mjs](../../files/arbor/hq/lib/telemetry.mjs.md) | JavaScript | 817 | 149 |
| [hq/lib/thread-index.mjs](../../files/arbor/hq/lib/thread-index.mjs.md) | JavaScript | 397 | 69 |
| [hq/lib/thread-resolve.mjs](../../files/arbor/hq/lib/thread-resolve.mjs.md) | JavaScript | 147 | 21 |
| [hq/lib/toolchain-guard.mjs](../../files/arbor/hq/lib/toolchain-guard.mjs.md) | JavaScript | 133 | 20 |
| [hq/lib/torrent/auto.mjs](../../files/arbor/hq/lib/torrent/auto.mjs.md) | JavaScript | 141 | 29 |
| [hq/lib/torrent/dispatch-adapter.mjs](../../files/arbor/hq/lib/torrent/dispatch-adapter.mjs.md) | JavaScript | 249 | 47 |
| [hq/lib/torrent/library.mjs](../../files/arbor/hq/lib/torrent/library.mjs.md) | JavaScript | 256 | 28 |
| [hq/lib/torrent/poll.mjs](../../files/arbor/hq/lib/torrent/poll.mjs.md) | JavaScript | 544 | 95 |
| [hq/lib/torrent/qbittorrent.mjs](../../files/arbor/hq/lib/torrent/qbittorrent.mjs.md) | JavaScript | 129 | 26 |
| [hq/lib/torrent/releases.mjs](../../files/arbor/hq/lib/torrent/releases.mjs.md) | JavaScript | 156 | 32 |
| [hq/lib/torrent/search1337x.mjs](../../files/arbor/hq/lib/torrent/search1337x.mjs.md) | JavaScript | 106 | 26 |
| [hq/lib/torrent/wanted.mjs](../../files/arbor/hq/lib/torrent/wanted.mjs.md) | JavaScript | 135 | 22 |
| [hq/lib/util.mjs](../../files/arbor/hq/lib/util.mjs.md) | JavaScript | 144 | 33 |
| [hq/lib/vivim.mjs](../../files/arbor/hq/lib/vivim.mjs.md) | JavaScript | 1067 | 288 |
| [hq/lib/walk.mjs](../../files/arbor/hq/lib/walk.mjs.md) | JavaScript | 121 | 25 |
| [hq/lib/wave1-kb-read.mjs](../../files/arbor/hq/lib/wave1-kb-read.mjs.md) | JavaScript | 174 | 55 |
| [hq/lib/wiki-program.mjs](../../files/arbor/hq/lib/wiki-program.mjs.md) | JavaScript | 610 | 106 |
| [hq/lib/wiki-runtime/graph-index.mjs](../../files/arbor/hq/lib/wiki-runtime/graph-index.mjs.md) | JavaScript | 162 | 36 |
| [hq/lib/wiki-runtime/rust-comment-adapter.mjs](../../files/arbor/hq/lib/wiki-runtime/rust-comment-adapter.mjs.md) | JavaScript | 173 | 38 |
| [hq/lib/wiki.mjs](../../files/arbor/hq/lib/wiki.mjs.md) | JavaScript | 2480 | 372 |
| [hq/lib/work-orders.mjs](../../files/arbor/hq/lib/work-orders.mjs.md) | JavaScript | 438 | 74 |
| [hq/lib/zcode-doctor.mjs](../../files/arbor/hq/lib/zcode-doctor.mjs.md) | JavaScript | 378 | 65 |
| [hq/package.json](../../files/arbor/hq/package.json.md) | JSON | 22 | 0 |
| [hq/registry/agentic-file-registry.v1.json](../../files/arbor/hq/registry/agentic-file-registry.v1.json.md) | JSON | 8045 | 0 |
| [hq/registry/canonical-taxonomy.v1.json](../../files/arbor/hq/registry/canonical-taxonomy.v1.json.md) | JSON | 2237 | 0 |
| [hq/registry/kb-binding.v1.json](../../files/arbor/hq/registry/kb-binding.v1.json.md) | JSON | 362 | 0 |
| [hq/source-provenance.json](../../files/arbor/hq/source-provenance.json.md) | JSON | 1925 | 0 |
| [hq/test/action-map.test.mjs](../../files/arbor/hq/test/action-map.test.mjs.md) | JavaScript | 178 | 36 |
| [hq/test/action-registry-builder.test.mjs](../../files/arbor/hq/test/action-registry-builder.test.mjs.md) | JavaScript | 254 | 18 |
| [hq/test/annotation-v2.test.mjs](../../files/arbor/hq/test/annotation-v2.test.mjs.md) | JavaScript | 396 | 38 |
| [hq/test/arbor-boundary.test.mjs](../../files/arbor/hq/test/arbor-boundary.test.mjs.md) | JavaScript | 150 | 22 |
| [hq/test/arbor-service.test.mjs](../../files/arbor/hq/test/arbor-service.test.mjs.md) | JavaScript | 46 | 9 |
| [hq/test/capabilities.test.mjs](../../files/arbor/hq/test/capabilities.test.mjs.md) | JavaScript | 393 | 68 |
| [hq/test/capability-surfaces.test.mjs](../../files/arbor/hq/test/capability-surfaces.test.mjs.md) | JavaScript | 208 | 33 |
| [hq/test/catalogue-delta.test.mjs](../../files/arbor/hq/test/catalogue-delta.test.mjs.md) | JavaScript | 80 | 20 |
| [hq/test/check-freshness-parity.test.mjs](../../files/arbor/hq/test/check-freshness-parity.test.mjs.md) | JavaScript | 114 | 18 |
| [hq/test/cli.test.mjs](../../files/arbor/hq/test/cli.test.mjs.md) | JavaScript | 23 | 4 |
| [hq/test/comment-program-integration.test.mjs](../../files/arbor/hq/test/comment-program-integration.test.mjs.md) | JavaScript | 243 | 50 |
| [hq/test/comment-wiki-bridge.test.mjs](../../files/arbor/hq/test/comment-wiki-bridge.test.mjs.md) | JavaScript | 300 | 61 |
| [hq/test/components.test.mjs](../../files/arbor/hq/test/components.test.mjs.md) | JavaScript | 651 | 86 |
| [hq/test/context-budget.test.mjs](../../files/arbor/hq/test/context-budget.test.mjs.md) | JavaScript | 247 | 28 |
| [hq/test/context-ranking.test.mjs](../../files/arbor/hq/test/context-ranking.test.mjs.md) | JavaScript | 211 | 39 |
| [hq/test/context.test.mjs](../../files/arbor/hq/test/context.test.mjs.md) | JavaScript | 253 | 41 |
| [hq/test/day-one-context.test.mjs](../../files/arbor/hq/test/day-one-context.test.mjs.md) | JavaScript | 128 | 20 |
| [hq/test/evidence-join.test.mjs](../../files/arbor/hq/test/evidence-join.test.mjs.md) | JavaScript | 189 | 13 |
| [hq/test/extract.test.mjs](../../files/arbor/hq/test/extract.test.mjs.md) | JavaScript | 447 | 80 |
| [hq/test/filetypes.test.mjs](../../files/arbor/hq/test/filetypes.test.mjs.md) | JavaScript | 331 | 46 |
| [hq/test/foundation.test.mjs](../../files/arbor/hq/test/foundation.test.mjs.md) | JavaScript | 115 | 12 |
| [hq/test/git-context.test.mjs](../../files/arbor/hq/test/git-context.test.mjs.md) | JavaScript | 33 | 4 |
| [hq/test/git-main-sync.test.mjs](../../files/arbor/hq/test/git-main-sync.test.mjs.md) | JavaScript | 142 | 23 |
| [hq/test/git.test.mjs](../../files/arbor/hq/test/git.test.mjs.md) | JavaScript | 30 | 2 |
| [hq/test/graph.test.mjs](../../files/arbor/hq/test/graph.test.mjs.md) | JavaScript | 203 | 36 |
| [hq/test/hvi-live-source-composition.test.mjs](../../files/arbor/hq/test/hvi-live-source-composition.test.mjs.md) | JavaScript | 204 | 28 |
| [hq/test/hvi-mcp-tool.test.mjs](../../files/arbor/hq/test/hvi-mcp-tool.test.mjs.md) | JavaScript | 85 | 21 |
| [hq/test/in-repo-closure.test.mjs](../../files/arbor/hq/test/in-repo-closure.test.mjs.md) | JavaScript | 16 | 2 |
| [hq/test/indexer.test.mjs](../../files/arbor/hq/test/indexer.test.mjs.md) | JavaScript | 401 | 66 |
| [hq/test/intelligence-contracts.test.mjs](../../files/arbor/hq/test/intelligence-contracts.test.mjs.md) | JavaScript | 93 | 15 |
| [hq/test/kb-bind.test.mjs](../../files/arbor/hq/test/kb-bind.test.mjs.md) | JavaScript | 157 | 28 |
| [hq/test/kb-query-capability.test.mjs](../../files/arbor/hq/test/kb-query-capability.test.mjs.md) | JavaScript | 199 | 31 |
| [hq/test/kg-export.test.mjs](../../files/arbor/hq/test/kg-export.test.mjs.md) | JavaScript | 198 | 49 |
| [hq/test/kg-import-product.test.mjs](../../files/arbor/hq/test/kg-import-product.test.mjs.md) | JavaScript | 282 | 47 |
| [hq/test/lake.test.mjs](../../files/arbor/hq/test/lake.test.mjs.md) | JavaScript | 246 | 33 |
| [hq/test/live-graph-wave1-a-r2-audit.test.mjs](../../files/arbor/hq/test/live-graph-wave1-a-r2-audit.test.mjs.md) | JavaScript | 106 | 35 |
| [hq/test/live-graph-wave1-a-r2-discovery.test.mjs](../../files/arbor/hq/test/live-graph-wave1-a-r2-discovery.test.mjs.md) | JavaScript | 55 | 15 |
| [hq/test/live-graph-wave1-a-r2-preflight.test.mjs](../../files/arbor/hq/test/live-graph-wave1-a-r2-preflight.test.mjs.md) | JavaScript | 50 | 16 |
| [hq/test/live-graph-wave1-a.test.mjs](../../files/arbor/hq/test/live-graph-wave1-a.test.mjs.md) | JavaScript | 58 | 14 |
| [hq/test/live-graph-wave1-master.test.mjs](../../files/arbor/hq/test/live-graph-wave1-master.test.mjs.md) | JavaScript | 203 | 36 |
| [hq/test/native-graph-wiki-admission.test.mjs](../../files/arbor/hq/test/native-graph-wiki-admission.test.mjs.md) | JavaScript | 117 | 16 |
| [hq/test/nomenclature.test.mjs](../../files/arbor/hq/test/nomenclature.test.mjs.md) | JavaScript | 64 | 1 |
| [hq/test/registry.test.mjs](../../files/arbor/hq/test/registry.test.mjs.md) | JavaScript | 56 | 11 |
| [hq/test/revision-cache-lifecycle.test.mjs](../../files/arbor/hq/test/revision-cache-lifecycle.test.mjs.md) | JavaScript | 312 | 58 |
| [hq/test/search.test.mjs](../../files/arbor/hq/test/search.test.mjs.md) | JavaScript | 244 | 41 |
| [hq/test/semantic-convergence.test.mjs](../../files/arbor/hq/test/semantic-convergence.test.mjs.md) | JavaScript | 345 | 47 |
| [hq/test/semantic-optimizers.test.mjs](../../files/arbor/hq/test/semantic-optimizers.test.mjs.md) | JavaScript | 210 | 35 |
| [hq/test/semantic-packet.test.mjs](../../files/arbor/hq/test/semantic-packet.test.mjs.md) | JavaScript | 41 | 10 |
| [hq/test/semantic-registry.test.mjs](../../files/arbor/hq/test/semantic-registry.test.mjs.md) | JavaScript | 322 | 52 |
| [hq/test/semantic-source-context.test.mjs](../../files/arbor/hq/test/semantic-source-context.test.mjs.md) | JavaScript | 133 | 29 |
| [hq/test/taxonomy.test.mjs](../../files/arbor/hq/test/taxonomy.test.mjs.md) | JavaScript | 207 | 26 |
| [hq/test/util.test.mjs](../../files/arbor/hq/test/util.test.mjs.md) | JavaScript | 19 | 0 |
| [hq/test/vlang-compiled-context.test.mjs](../../files/arbor/hq/test/vlang-compiled-context.test.mjs.md) | JavaScript | 89 | 11 |
| [hq/test/walk-bin-source.test.mjs](../../files/arbor/hq/test/walk-bin-source.test.mjs.md) | JavaScript | 123 | 13 |
| [hq/test/walk.test.mjs](../../files/arbor/hq/test/walk.test.mjs.md) | JavaScript | 55 | 10 |
| [hq/test/wiki-program.test.mjs](../../files/arbor/hq/test/wiki-program.test.mjs.md) | JavaScript | 431 | 65 |
| [hq/test/wiki.test.mjs](../../files/arbor/hq/test/wiki.test.mjs.md) | JavaScript | 493 | 79 |
| [hq/types/bun-test.d.ts](../../files/arbor/hq/types/bun-test.d.ts.md) | TypeScript | 34 | 10 |
| [hq/version-intelligence/TESTING.md](../../files/arbor/hq/version-intelligence/TESTING.md.md) | Markdown | 182 | 0 |
| [hq/version-intelligence/compare/index.mjs](../../files/arbor/hq/version-intelligence/compare/index.mjs.md) | JavaScript | 297 | 96 |
| [hq/version-intelligence/compare/index.test.mjs](../../files/arbor/hq/version-intelligence/compare/index.test.mjs.md) | JavaScript | 111 | 32 |
| [hq/version-intelligence/identity/index.mjs](../../files/arbor/hq/version-intelligence/identity/index.mjs.md) | JavaScript | 229 | 90 |
| [hq/version-intelligence/identity/legacy-adapters.mjs](../../files/arbor/hq/version-intelligence/identity/legacy-adapters.mjs.md) | JavaScript | 84 | 17 |
| [hq/version-intelligence/identity/test/identity.test.mjs](../../files/arbor/hq/version-intelligence/identity/test/identity.test.mjs.md) | JavaScript | 125 | 30 |
| [hq/version-intelligence/integration/AGENT-USAGE.md](../../files/arbor/hq/version-intelligence/integration/AGENT-USAGE.md.md) | Markdown | 125 | 0 |
| [hq/version-intelligence/integration/cli.mjs](../../files/arbor/hq/version-intelligence/integration/cli.mjs.md) | JavaScript | 30 | 5 |
| [hq/version-intelligence/integration/comparison-report-adapter.mjs](../../files/arbor/hq/version-intelligence/integration/comparison-report-adapter.mjs.md) | JavaScript | 73 | 10 |
| [hq/version-intelligence/integration/host-inspector-projection.mjs](../../files/arbor/hq/version-intelligence/integration/host-inspector-projection.mjs.md) | JavaScript | 127 | 28 |
| [hq/version-intelligence/integration/index.mjs](../../files/arbor/hq/version-intelligence/integration/index.mjs.md) | JavaScript | 169 | 29 |
| [hq/version-intelligence/integration/parity-evidence-adapter.mjs](../../files/arbor/hq/version-intelligence/integration/parity-evidence-adapter.mjs.md) | JavaScript | 58 | 11 |
| [hq/version-intelligence/integration/source-manifest-adapter.mjs](../../files/arbor/hq/version-intelligence/integration/source-manifest-adapter.mjs.md) | JavaScript | 109 | 26 |
| [hq/version-intelligence/parity/README.md](../../files/arbor/hq/version-intelligence/parity/README.md.md) | Markdown | 8 | 0 |
| [hq/version-intelligence/parity/atlas.mjs](../../files/arbor/hq/version-intelligence/parity/atlas.mjs.md) | JavaScript | 146 | 44 |
| [hq/version-intelligence/parity/atlas.test.mjs](../../files/arbor/hq/version-intelligence/parity/atlas.test.mjs.md) | JavaScript | 102 | 26 |
| [hq/version-intelligence/report/README.md](../../files/arbor/hq/version-intelligence/report/README.md.md) | Markdown | 39 | 0 |
| [hq/version-intelligence/report/index.mjs](../../files/arbor/hq/version-intelligence/report/index.mjs.md) | JavaScript | 316 | 109 |
| [hq/version-intelligence/report/test/benchmark.mjs](../../files/arbor/hq/version-intelligence/report/test/benchmark.mjs.md) | JavaScript | 15 | 6 |
| [hq/version-intelligence/report/test/generate-samples.mjs](../../files/arbor/hq/version-intelligence/report/test/generate-samples.mjs.md) | JavaScript | 27 | 5 |
| [hq/version-intelligence/report/test/report.test.mjs](../../files/arbor/hq/version-intelligence/report/test/report.test.mjs.md) | JavaScript | 157 | 36 |
| [hq/version-intelligence/sources/README.md](../../files/arbor/hq/version-intelligence/sources/README.md.md) | Markdown | 23 | 0 |
| [hq/version-intelligence/sources/adapters.mjs](../../files/arbor/hq/version-intelligence/sources/adapters.mjs.md) | JavaScript | 336 | 96 |
| [hq/version-intelligence/sources/common.mjs](../../files/arbor/hq/version-intelligence/sources/common.mjs.md) | JavaScript | 75 | 17 |
| [hq/version-intelligence/sources/fixtures.mjs](../../files/arbor/hq/version-intelligence/sources/fixtures.mjs.md) | JavaScript | 92 | 24 |
| [hq/version-intelligence/sources/index.mjs](../../files/arbor/hq/version-intelligence/sources/index.mjs.md) | JavaScript | 6 | 8 |
| [hq/version-intelligence/sources/snapshots.mjs](../../files/arbor/hq/version-intelligence/sources/snapshots.mjs.md) | JavaScript | 358 | 58 |
| [hq/version-intelligence/sources/snapshots.test.mjs](../../files/arbor/hq/version-intelligence/sources/snapshots.test.mjs.md) | JavaScript | 193 | 54 |

## Symbols

| Symbol | Kind | Exported | Line |
| --- | --- | --- | --- |
| [/api/users](../../files/arbor/hq/test/extract.test.mjs.md) | route | no | 59 |
| [/api/users](../../files/arbor/hq/test/extract.test.mjs.md) | route | no | 60 |
| [A](../../files/arbor/hq/test/native-graph-wiki-admission.test.mjs.md) | const | no | 15 |
| [ACTION](../../files/arbor/hq/version-intelligence/report/index.mjs.md) | const | no | 186 |
| [ACTIONS](../../files/arbor/hq/test/action-map.test.mjs.md) | const | no | 28 |
| [ACTIONS_PER_DOMAIN](../../files/arbor/hq/test/action-map.test.mjs.md) | const | no | 33 |
| [ACTION_LIMIT](../../files/arbor/hq/lib/home.mjs.md) | const | no | 39 |
| [ACTION_STATUSES](../../files/arbor/hq/lib/action-registry.mjs.md) | const | yes | 27 |
| [ACTIVATION_SCHEMA](../../files/arbor/hq/lib/components.mjs.md) | const | no | 16 |
| [ACTIVE](../../files/arbor/hq/lib/mission-intelligence.mjs.md) | const | no | 19 |
| [ADAPTER_METHODS](../../files/arbor/hq/version-intelligence/sources/adapters.mjs.md) | const | no | 14 |
| [ADR_EXTS](../../files/arbor/hq/lib/canon.mjs.md) | const | no | 111 |
| [AGENTS](../../files/arbor/hq/test/day-one-context.test.mjs.md) | const | no | 26 |
| [AGENTS_FILE](../../files/arbor/hq/lib/registry.mjs.md) | const | no | 195 |
| [AGENTS_PATH](../../files/arbor/hq/test/day-one-context.test.mjs.md) | const | no | 22 |
| [AGENT_TOOL_DIRS](../../files/arbor/hq/lib/graph.mjs.md) | const | no | 474 |
| [AGENT_TOOL_SQL](../../files/arbor/hq/lib/graph.mjs.md) | function | no | 483 |
| [AII_COVERAGE_SCHEMA](../../files/arbor/hq/lib/aii/views.mjs.md) | const | yes | 23 |
| [AII_ERAS](../../files/arbor/hq/lib/aii/scenarios.mjs.md) | const | yes | 8 |
| [AII_FIXTURE_KIND](../../files/arbor/hq/lib/aii/registry.mjs.md) | const | yes | 33 |
| [AII_FIXTURE_KIND](../../files/arbor/hq/lib/aii/runner.mjs.md) | export | yes | 291 |
| [AII_FIXTURE_MANIFEST_SCHEMA](../../files/arbor/hq/lib/aii/plan.mjs.md) | const | yes | 20 |
| [AII_GROUPS](../../files/arbor/hq/lib/aii/scenarios.mjs.md) | const | yes | 16 |
| [AII_JOURNAL_SCHEMA](../../files/arbor/hq/lib/aii/state.mjs.md) | const | yes | 28 |
| [AII_LEGACY_STATE_SCHEMA](../../files/arbor/hq/lib/aii/state.mjs.md) | const | yes | 29 |
| [AII_PLAN_SCHEMA](../../files/arbor/hq/lib/aii/plan.mjs.md) | const | yes | 19 |
| [AII_SLICE_STATUSES](../../files/arbor/hq/lib/aii/registry.mjs.md) | const | yes | 31 |
| [AII_STATUSES](../../files/arbor/hq/lib/aii/registry.mjs.md) | const | yes | 21 |
| [ALIASES](../../files/arbor/hq/lib/actions/aliases.mjs.md) | const | yes | 13 |
| [ALLOWED_AUTHORITIES](../../files/arbor/hq/lib/kb-intake.mjs.md) | const | no | 42 |
| [ANCHORS](../../files/arbor/hq/aii/fixtures/HQ-021-planned-features-implemented.mjs.md) | const | no | 49 |
| [ANCHORS](../../files/arbor/hq/aii/fixtures/HQ-087-unnecessary-planned-features.mjs.md) | const | no | 45 |
| [ANCHORS](../../files/arbor/hq/aii/fixtures/HQ-109-subsystem-implicit-knowledge.mjs.md) | const | no | 27 |
| [ANNOTATION_KINDS](../../files/arbor/hq/lib/extract.mjs.md) | const | no | 19 |
| [ANNOTATION_KINDS](../../files/arbor/hq/lib/protocol.mjs.md) | const | yes | 12 |
| [ANNOTATION_SCAN_CAP](../../files/arbor/hq/lib/canon.mjs.md) | const | no | 113 |
| [ANNOTATION_V2_SCHEMA](../../files/arbor/hq/lib/annotation-v2.mjs.md) | const | yes | 24 |
| [ANNOTATION_V2_TAGS](../../files/arbor/hq/lib/annotation-v2.mjs.md) | const | yes | 27 |
| [ANN_SOURCE](../../files/arbor/hq/test/extract.test.mjs.md) | const | no | 303 |
| [APPROVAL_SCHEMA](../../files/arbor/hq/lib/approvals.mjs.md) | const | yes | 18 |
| [ARCHIVE_SEGMENTS](../../files/arbor/hq/lib/canon.mjs.md) | const | no | 118 |
| [AREAS](../../files/arbor/hq/aii/fixtures/HQ-106-expensive-areas.mjs.md) | const | no | 26 |
| [ARTIFACTS](../../files/arbor/hq/aii/fixtures/HQ-055-strongest-evidence.mjs.md) | const | no | 22 |
| [ARTIFACTS](../../files/arbor/hq/lib/kb-intake.mjs.md) | const | no | 570 |
| [ASSIGNMENT](../../files/arbor/hq/lib/sessions.mjs.md) | const | no | 82 |
| [ASSIGNMENT_QUOTED](../../files/arbor/hq/lib/sessions.mjs.md) | const | no | 81 |
| [AT](../../files/arbor/hq/aii/fixtures/HQ-062-shared-assumptions.mjs.md) | const | no | 22 |
| [AT](../../files/arbor/hq/aii/fixtures/HQ-063-missing-dependency.mjs.md) | const | no | 22 |
| [AT](../../files/arbor/hq/aii/fixtures/HQ-074-minimal-orphan-connection.mjs.md) | const | no | 31 |
| [AT](../../files/arbor/hq/aii/fixtures/HQ-075-dependency-upgrade-impact.mjs.md) | const | no | 27 |
| [AT](../../files/arbor/hq/aii/fixtures/HQ-076-migration-risks.mjs.md) | const | no | 36 |
| [AT](../../files/arbor/hq/aii/fixtures/HQ-077-change-independence.mjs.md) | const | no | 33 |
| [AT](../../files/arbor/hq/aii/fixtures/HQ-078-integration-sequencing.mjs.md) | const | no | 35 |
| [AT](../../files/arbor/hq/test/capability-surfaces.test.mjs.md) | const | no | 19 |
| [AT](../../files/arbor/hq/test/kb-query-capability.test.mjs.md) | const | no | 12 |
| [AT](../../files/arbor/hq/test/semantic-convergence.test.mjs.md) | const | no | 16 |
| [ATLAS_SCHEMA](../../files/arbor/hq/version-intelligence/parity/atlas.mjs.md) | const | yes | 8 |
| [ATTENTION_LABELS](../../files/arbor/hq/lib/home.mjs.md) | const | no | 20 |
| [ATTENTION_LIMIT](../../files/arbor/hq/lib/home.mjs.md) | const | no | 38 |
| [AT_EARLY](../../files/arbor/hq/test/capabilities.test.mjs.md) | const | no | 22 |
| [AT_LATE](../../files/arbor/hq/test/capabilities.test.mjs.md) | const | no | 23 |
| [AUDIT_SCHEMA](../../files/arbor/hq/lib/live-graph/wave1/lane-a-r2-audit.mjs.md) | const | yes | 11 |
| [AUTHORITY](../../files/arbor/hq/lib/canon.mjs.md) | const | yes | 93 |
| [AUTHORITY](../../files/arbor/hq/lib/kg-export.mjs.md) | const | yes | 24 |
| [AUTH_RE](../../files/arbor/hq/lib/model-budget.mjs.md) | const | no | 13 |
| [A_SOURCE](../../files/arbor/hq/test/context.test.mjs.md) | const | no | 15 |
| [B](../../files/arbor/hq/test/native-graph-wiki-admission.test.mjs.md) | const | no | 16 |
| [BAD](../../files/arbor/hq/catalogue-identity/crosswalk.mjs.md) | const | no | 32 |
| [BANNED_KEYS](../../files/arbor/hq/lib/comment-wiki-bridge.mjs.md) | const | no | 18 |
| [BASE](../../files/arbor/hq/aii/fixtures/HQ-120-harvestable-update-monitoring.mjs.md) | const | no | 29 |
| [BASELINE_AT](../../files/arbor/hq/aii/fixtures/HQ-089-performance-regression-components.mjs.md) | const | no | 48 |
| [BASELINE_SINCE](../../files/arbor/hq/aii/fixtures/HQ-089-component-regression.mjs.md) | const | no | 21 |
| [BEARER_VALUE](../../files/arbor/hq/lib/sessions.mjs.md) | const | no | 83 |
| [BEHAVIORS](../../files/arbor/hq/aii/fixtures/HQ-051-unit-only-critical-behaviors.mjs.md) | const | no | 23 |
| [BINARY_EXT](../../files/arbor/hq/lib/lang.mjs.md) | const | no | 38 |
| [BINDING_AUTHORITY](../../files/arbor/hq/lib/kb-bind.mjs.md) | const | yes | 32 |
| [BINDING_KIND](../../files/arbor/hq/lib/kb-bind.mjs.md) | const | yes | 33 |
| [BINDING_STATUS](../../files/arbor/hq/lib/kb-bind.mjs.md) | const | yes | 31 |
| [BIND_CAP](../../files/arbor/hq/lib/canon.mjs.md) | const | no | 114 |
| [BIN_DIR](../../files/arbor/hq/test/kg-import-product.test.mjs.md) | const | no | 31 |
| [BLOCKED](../../files/arbor/hq/lib/dogfood.mjs.md) | const | no | 289 |
| [BLOCKED_CAP](../../files/arbor/hq/lib/canvas.mjs.md) | const | no | 28 |
| [BLOCKED_GROUP_CAP](../../files/arbor/hq/lib/canvas.mjs.md) | const | no | 31 |
| [BLOCKED_PART](../../files/arbor/hq/version-intelligence/integration/source-manifest-adapter.mjs.md) | const | no | 17 |
| [BODY](../../files/arbor/hq/test/kb-query-capability.test.mjs.md) | const | no | 16 |
| [BODY_CAP](../../files/arbor/hq/lib/kb.mjs.md) | const | no | 65 |
| [BODY_CAP](../../files/arbor/hq/lib/skills.mjs.md) | const | no | 14 |
| [BOLD_BULLET_RE](../../files/arbor/hq/lib/canon.mjs.md) | const | no | 1456 |
| [BOOL](../../files/arbor/hq/bin/hq.mjs.md) | const | no | 87 |
| [BOOL](../../files/arbor/hq/lib/kernel/cli.mjs.md) | const | no | 13 |
| [BOUNDARY_RE](../../files/arbor/hq/lib/skills.mjs.md) | const | no | 37 |
| [BREAKING_BODY](../../files/arbor/hq/lib/release-plan.mjs.md) | const | no | 13 |
| [BRIDGE_MODULE](../../files/arbor/hq/test/live-graph-wave1-master.test.mjs.md) | const | no | 28 |
| [BROKER_SCHEMA](../../files/arbor/hq/lib/channel-broker.mjs.md) | const | yes | 31 |
| [BUDGET_RE](../../files/arbor/hq/lib/model-budget.mjs.md) | const | no | 11 |
| [BUDGET_RE](../../files/arbor/hq/lib/model-router.mjs.md) | const | no | 22 |
| [BUILDERS](../../files/arbor/hq/lib/thread-index.mjs.md) | const | no | 284 |
| [BUN](../../files/arbor/hq/test/day-one-context.test.mjs.md) | const | no | 33 |
| [BUNDLE_SCHEMA](../../files/arbor/hq/lib/context.mjs.md) | const | no | 22 |
| [BUN_BOOT_MS](../../files/arbor/hq/lib/aii/plan.mjs.md) | const | no | 57 |
| [BUS](../../files/arbor/hq/test/day-one-context.test.mjs.md) | const | no | 27 |
| [BUS_PATH](../../files/arbor/hq/test/day-one-context.test.mjs.md) | const | no | 28 |
| [BY_EXT](../../files/arbor/hq/lib/lang.mjs.md) | const | no | 5 |
| [B_SOURCE](../../files/arbor/hq/test/context.test.mjs.md) | const | no | 34 |
| [CANON](../../files/arbor/hq/version-intelligence/identity/index.mjs.md) | const | no | 15 |
| [CANONICAL_TAXONOMY_REL_PATH](../../files/arbor/hq/lib/kb-bind.mjs.md) | const | yes | 29 |
| [CANON_COLUMNS](../../files/arbor/hq/lib/canon.mjs.md) | const | no | 1025 |
| [CANON_PATH_RE](../../files/arbor/hq/lib/canon.mjs.md) | const | no | 108 |
| [CANON_PATTERN](../../files/arbor/hq/catalogue-identity/crosswalk.mjs.md) | const | no | 30 |
| [CANON_ROOT_FILES](../../files/arbor/hq/lib/canon.mjs.md) | const | no | 104 |
| [CANON_SQL](../../files/arbor/hq/lib/kb.mjs.md) | const | no | 173 |
| [CANON_TERMS](../../files/arbor/hq/aii/fixtures/HQ-036-documented-capabilities-without-implementation.mjs.md) | const | no | 53 |
| [CANON_TERM_STATUSES](../../files/arbor/hq/test/taxonomy.test.mjs.md) | const | no | 52 |
| [CANVAS_ROOT_ID](../../files/arbor/hq/lib/canvas.mjs.md) | const | yes | 22 |
| [CANVAS_SCHEMA](../../files/arbor/hq/lib/canvas.mjs.md) | const | yes | 19 |
| [CAP](../../files/arbor/hq/test/revision-cache-lifecycle.test.mjs.md) | const | no | 26 |
| [CAPABILITIES](../../files/arbor/hq/aii/fixtures/HQ-035-device-verification-absence.mjs.md) | const | no | 18 |
| [CAPABILITY_DDL](../../files/arbor/hq/lib/capability-schema.mjs.md) | const | yes | 4 |
| [CAPABILITY_KIND](../../files/arbor/hq/lib/kb.mjs.md) | const | no | 28 |
| [CAPABILITY_PATH](../../files/arbor/hq/test/kb-query-capability.test.mjs.md) | const | no | 15 |
| [CAPABILITY_REGISTRY_SCHEMA](../../files/arbor/hq/lib/capabilities.mjs.md) | const | yes | 13 |
| [CAPABILITY_STATES](../../files/arbor/hq/version-intelligence/parity/atlas.mjs.md) | const | yes | 11 |
| [CAPABILITY_STATES](../../files/arbor/hq/version-intelligence/report/index.mjs.md) | const | no | 15 |
| [CAPABILITY_STEMS](../../files/arbor/hq/lib/canon.mjs.md) | const | no | 2146 |
| [CAP_RE](../../files/arbor/hq/lib/model-budget.mjs.md) | const | no | 10 |
| [CAP_RE](../../files/arbor/hq/lib/model-router.mjs.md) | const | no | 20 |
| [CARGO_MS](../../files/arbor/hq/lib/aii/plan.mjs.md) | const | no | 59 |
| [CATALOG](../../files/arbor/hq/aii/fixtures/HQ-101-frontier-model-candidates.mjs.md) | const | no | 19 |
| [CATALOG](../../files/arbor/hq/aii/fixtures/HQ-103-strongest-model-only-components.mjs.md) | const | no | 16 |
| [CATALOG](../../files/arbor/hq/aii/fixtures/HQ-106-expensive-areas.mjs.md) | const | no | 20 |
| [CATALOG](../../files/arbor/hq/aii/fixtures/HQ-107-work-queue-model-ranking.mjs.md) | const | no | 20 |
| [CATALOG](../../files/arbor/hq/aii/fixtures/HQ-110-autonomous-routing-decision.mjs.md) | const | no | 18 |
| [CATALOGUE_SCHEMA](../../files/arbor/hq/lib/catalogue-delta.mjs.md) | const | yes | 10 |
| [CHANGELOG_PREAMBLE](../../files/arbor/hq/lib/release-plan.mjs.md) | const | no | 209 |
| [CHANNEL](../../files/arbor/hq/bin/dogfood.mjs.md) | const | no | 16 |
| [CHANNEL_WAKE_SCHEMA](../../files/arbor/hq/lib/channel-wake.mjs.md) | const | yes | 22 |
| [CHAT_ASK_EFFECTS](../../files/arbor/hq/lib/channel-broker.mjs.md) | const | no | 814 |
| [CHAT_ASK_SCHEMA](../../files/arbor/hq/lib/channel-broker.mjs.md) | const | no | 813 |
| [CLAIMS](../../files/arbor/hq/aii/fixtures/HQ-047-completion-claims.mjs.md) | const | no | 22 |
| [CLASS_POLICIES](../../files/arbor/hq/aii/fixtures/HQ-112-multi-class-sources.mjs.md) | const | no | 22 |
| [CLI](../../files/arbor/hq/bin/spawn.mjs.md) | const | no | 40 |
| [CLI](../../files/arbor/hq/test/check-freshness-parity.test.mjs.md) | const | no | 24 |
| [CLI](../../files/arbor/hq/test/cli.test.mjs.md) | const | no | 14 |
| [CLI](../../files/arbor/hq/test/kg-export.test.mjs.md) | const | no | 17 |
| [CLI](../../files/arbor/hq/test/kg-import-product.test.mjs.md) | const | no | 30 |
| [CLI_REASONING_LEVELS](../../files/arbor/hq/lib/model-router.mjs.md) | const | yes | 44 |
| [CNP_SCHEMA](../../files/arbor/hq/lib/cnp.mjs.md) | const | yes | 14 |
| [CODES](../../files/arbor/hq/lib/autonomy.mjs.md) | const | yes | 26 |
| [CODE_EXT](../../files/arbor/hq/lib/capabilities.mjs.md) | const | no | 34 |
| [CODE_EXT](../../files/arbor/hq/lib/live-graph/wave1/lane-a-r2-discovery.mjs.md) | const | no | 13 |
| [COMMAND_COST_MS](../../files/arbor/hq/lib/aii/plan.mjs.md) | const | no | 31 |
| [COMMAND_INPUT_FIELDS](../../files/arbor/hq/lib/dogfood.mjs.md) | const | yes | 368 |
| [COMMAND_INTENT_SCHEMA](../../files/arbor/hq/lib/comment-wiki-bridge.mjs.md) | const | yes | 13 |
| [COMMENT_PROGRAM_SCHEMA](../../files/arbor/hq/lib/comment-wiki-bridge.mjs.md) | const | yes | 12 |
| [COMMIT](../../files/arbor/hq/lib/live-graph/wave1/lane-a-r2-audit.mjs.md) | const | no | 14 |
| [COMPACTION_PLAN_SCHEMA](../../files/arbor/hq/lib/context-budget.mjs.md) | const | yes | 11 |
| [COMPARE](../../files/arbor/hq/catalogue-identity/crosswalk.mjs.md) | function | no | 27 |
| [COMPARISON_SCHEMA](../../files/arbor/hq/version-intelligence/compare/index.mjs.md) | const | yes | 10 |
| [COMPARISON_SCHEMA](../../files/arbor/hq/version-intelligence/report/index.mjs.md) | const | yes | 9 |
| [COMPLETENESS](../../files/arbor/hq/version-intelligence/compare/index.mjs.md) | const | no | 21 |
| [COMPLETENESS](../../files/arbor/hq/version-intelligence/report/index.mjs.md) | const | no | 16 |
| [COMPONENT_CLASSES](../../files/arbor/hq/aii/fixtures/HQ-103-strongest-model-only-components.mjs.md) | const | no | 22 |
| [COMPONENT_KINDS](../../files/arbor/hq/lib/components.mjs.md) | const | no | 18 |
| [COMPONENT_META_KEY](../../files/arbor/hq/lib/telemetry.mjs.md) | const | yes | 232 |
| [COMPONENT_SCHEMA](../../files/arbor/hq/lib/components.mjs.md) | const | no | 12 |
| [COMPONENT_STATUSES](../../files/arbor/hq/lib/components.mjs.md) | const | no | 19 |
| [CONCLUSION](../../files/arbor/hq/aii/fixtures/HQ-055-strongest-evidence.mjs.md) | const | no | 18 |
| [CONFIG](../../files/arbor/hq/aii/fixtures/HQ-089-component-regression.mjs.md) | const | no | 22 |
| [CONFIG](../../files/arbor/hq/aii/fixtures/HQ-090-redundant-indexing.mjs.md) | const | no | 24 |
| [CONFIG_FILE](../../files/arbor/hq/lib/registry.mjs.md) | const | yes | 10 |
| [CONFIG_LANGS](../../files/arbor/hq/lib/lang.mjs.md) | const | no | 50 |
| [CONFIG_PATH](../../files/arbor/hq/bin/console.mjs.md) | const | no | 23 |
| [CONFIG_SPEC](../../files/arbor/hq/lib/wiki-program.mjs.md) | const | no | 66 |
| [CONFLICT_TERMS](../../files/arbor/hq/aii/fixtures/HQ-096-challenge-conclusions.mjs.md) | const | no | 35 |
| [CONSUMER_SCHEMA](../../files/arbor/hq/lib/seat-heartbeat.mjs.md) | const | yes | 20 |
| [CONSUMER_VERDICTS](../../files/arbor/hq/lib/seat-heartbeat.mjs.md) | const | yes | 230 |
| [CONTENT_BLOCK_TYPES](../../files/arbor/hq/lib/session-import.mjs.md) | const | no | 27 |
| [CONTENT_HITS](../../files/arbor/hq/lib/context.mjs.md) | const | no | 39 |
| [CONTENT_STOPWORDS](../../files/arbor/hq/lib/search.mjs.md) | const | yes | 118 |
| [CONTEXT7_TOOLS](../../files/arbor/hq/lib/team-panel.mjs.md) | const | yes | 33 |
| [CONTEXT_BUDGET_SCHEMA](../../files/arbor/hq/lib/context-budget.mjs.md) | const | yes | 10 |
| [CONTEXT_PRIORITY](../../files/arbor/hq/lib/sessions.mjs.md) | const | no | 1556 |
| [CONTRACTS](../../files/arbor/hq/test/intelligence-contracts.test.mjs.md) | const | no | 33 |
| [CONTRACTS_DIR](../../files/arbor/hq/test/intelligence-contracts.test.mjs.md) | const | no | 22 |
| [CONTROL](../../files/arbor/hq/lib/extract.mjs.md) | const | no | 34 |
| [CONTROL_NAMES](../../files/arbor/hq/test/extract.test.mjs.md) | const | no | 12 |
| [CONVENTIONAL](../../files/arbor/hq/lib/release-plan.mjs.md) | const | no | 12 |
| [CONVENTIONAL_RE](../../files/arbor/hq/lib/lake.mjs.md) | const | no | 75 |
| [CORPUS_AVAILABILITY](../../files/arbor/hq/lib/personal-corpus-contract.mjs.md) | const | yes | 16 |
| [CORPUS_KINDS](../../files/arbor/hq/lib/personal-corpus-contract.mjs.md) | const | yes | 11 |
| [CORPUS_PROCESS_STATES](../../files/arbor/hq/lib/personal-corpus-contract.mjs.md) | const | yes | 17 |
| [CORPUS_SCHEMA](../../files/arbor/hq/lib/personal-corpus-contract.mjs.md) | const | yes | 10 |
| [CORPUS_SOURCE_IDS](../../files/arbor/hq/lib/personal-corpus-contract.mjs.md) | const | yes | 15 |
| [CORRECTION](../../files/arbor/hq/lib/dogfood.mjs.md) | const | no | 286 |
| [COST_CLASSES](../../files/arbor/hq/lib/components.mjs.md) | const | no | 22 |
| [COVERAGE_CHARS](../../files/arbor/hq/lib/context.mjs.md) | const | no | 32 |
| [CRITERIA](../../files/arbor/hq/bin/dogfood-execution.mjs.md) | const | no | 36 |
| [CROSSWALK](../../files/arbor/hq/test/semantic-convergence.test.mjs.md) | const | no | 58 |
| [CSS](../../files/arbor/hq/lib/canvas.mjs.md) | const | no | 590 |
| [CSS](../../files/arbor/hq/lib/pmo.mjs.md) | const | no | 793 |
| [CSS](../../files/arbor/hq/lib/team-dashboard.mjs.md) | const | no | 116 |
| [CS_SOURCE](../../files/arbor/hq/test/extract.test.mjs.md) | const | no | 267 |
| [CURRENT_AT](../../files/arbor/hq/aii/fixtures/HQ-089-performance-regression-components.mjs.md) | const | no | 49 |
| [Color](../../files/arbor/hq/test/extract.test.mjs.md) | enum | yes | 55 |
| [DANGEROUS_PATTERNS](../../files/arbor/hq/lib/channel-broker.mjs.md) | const | no | 739 |
| [DATA_LANGS](../../files/arbor/hq/lib/lang.mjs.md) | const | no | 51 |
| [DAY](../../files/arbor/hq/test/context-budget.test.mjs.md) | const | no | 24 |
| [DAY_MS](../../files/arbor/hq/lib/context-budget.mjs.md) | const | no | 22 |
| [DAY_ONE_PRESENT](../../files/arbor/hq/test/day-one-context.test.mjs.md) | const | no | 23 |
| [DAY_ONE_SKIP](../../files/arbor/hq/test/day-one-context.test.mjs.md) | const | no | 24 |
| [DDL](../../files/arbor/hq/lib/components.mjs.md) | const | no | 361 |
| [DDL](../../files/arbor/hq/lib/kernel/store.mjs.md) | const | no | 105 |
| [DDL](../../files/arbor/hq/lib/schema.mjs.md) | const | no | 35 |
| [DDL](../../files/arbor/hq/test/comment-program-integration.test.mjs.md) | const | no | 37 |
| [DDL](../../files/arbor/hq/test/comment-wiki-bridge.test.mjs.md) | const | no | 16 |
| [DEAD_STATUSES](../../files/arbor/hq/lib/work-orders.mjs.md) | const | no | 22 |
| [DEBOUNCE_MS](../../files/arbor/hq/bin/hq.mjs.md) | const | no | 2378 |
| [DECISIONS](../../files/arbor/hq/lib/live-graph/wave1/lane-a-r2-audit.mjs.md) | const | no | 16 |
| [DECISIONS_DOC](../../files/arbor/hq/aii/fixtures/HQ-036-documented-capabilities-without-implementation.mjs.md) | const | no | 59 |
| [DECISION_CAP](../../files/arbor/hq/lib/pmo.mjs.md) | const | no | 34 |
| [DECISION_COLUMNS](../../files/arbor/hq/lib/canon.mjs.md) | const | no | 1013 |
| [DECISION_COMPARE](../../files/arbor/hq/lib/canon.mjs.md) | const | no | 1274 |
| [DECISION_COMPARE](../../files/arbor/hq/lib/kb-intake.mjs.md) | const | no | 864 |
| [DECISION_PATH](../../files/arbor/hq/aii/fixtures/HQ-042-decision-provenance.mjs.md) | const | no | 32 |
| [DECISION_PATH_RE](../../files/arbor/hq/lib/canon.mjs.md) | const | no | 107 |
| [DECISION_ROOT_FILES](../../files/arbor/hq/lib/canon.mjs.md) | const | no | 101 |
| [DECISION_SQL](../../files/arbor/hq/lib/kb.mjs.md) | const | no | 161 |
| [DECISION_STATES](../../files/arbor/hq/version-intelligence/identity/index.mjs.md) | const | yes | 10 |
| [DECISION_STATUS](../../files/arbor/hq/lib/canon.mjs.md) | const | yes | 88 |
| [DECISION_STATUS](../../files/arbor/hq/lib/kb-intake.mjs.md) | const | no | 46 |
| [DECISION_TITLE](../../files/arbor/hq/aii/fixtures/HQ-042-decision-provenance.mjs.md) | const | no | 31 |
| [DECISION_UPSERT](../../files/arbor/hq/lib/canon.mjs.md) | const | no | 1250 |
| [DECISION_UPSERT](../../files/arbor/hq/lib/kb-intake.mjs.md) | const | no | 840 |
| [DECLARED_INTERESTS](../../files/arbor/hq/aii/fixtures/HQ-120-harvestable-update-monitoring.mjs.md) | const | no | 43 |
| [DECL_RE](../../files/arbor/hq/lib/extract.mjs.md) | const | no | 1359 |
| [DEFAULT_AGENTS_DIR](../../files/arbor/hq/lib/team-panel.mjs.md) | const | yes | 26 |
| [DEFAULT_ASK_CHARS](../../files/arbor/hq/lib/session-views.mjs.md) | const | no | 17 |
| [DEFAULT_CHANNEL_ROOT](../../files/arbor/hq/lib/channel-broker.mjs.md) | export | yes | 35 |
| [DEFAULT_CHANNEL_ROOT](../../files/arbor/hq/lib/channel-seats.mjs.md) | const | yes | 18 |
| [DEFAULT_CHANNEL_ROOT](../../files/arbor/hq/lib/team-panel.mjs.md) | const | yes | 27 |
| [DEFAULT_COMMAND_MS](../../files/arbor/hq/lib/aii/plan.mjs.md) | const | no | 56 |
| [DEFAULT_CONTENT_LIMIT](../../files/arbor/hq/lib/search.mjs.md) | const | no | 85 |
| [DEFAULT_FILE](../../files/arbor/hq/lib/taxonomy.mjs.md) | const | no | 25 |
| [DEFAULT_FILE_LIMIT](../../files/arbor/hq/lib/search.mjs.md) | const | no | 87 |
| [DEFAULT_GIT_CONFIG](../../files/arbor/hq/lib/git-context.mjs.md) | const | yes | 27 |
| [DEFAULT_HARNESS_ROOT](../../files/arbor/hq/lib/torrent/dispatch-adapter.mjs.md) | const | yes | 24 |
| [DEFAULT_IDLE_MINUTES](../../files/arbor/hq/lib/channel-seats.mjs.md) | const | yes | 19 |
| [DEFAULT_IDLE_MS](../../files/arbor/hq/lib/seat-heartbeat.mjs.md) | const | yes | 35 |
| [DEFAULT_IGNORES](../../files/arbor/hq/lib/walk.mjs.md) | const | yes | 14 |
| [DEFAULT_INBOX_ROOTS](../../files/arbor/hq/lib/comms-roof.mjs.md) | const | yes | 210 |

_Showing 250 of 16678 symbols._

## Dependencies

### Outgoing

| Target | Imports |
| --- | --- |
| external:node:path | 181 |
| external:node:fs | 161 |
| external:node:url | 90 |
| external:node:assert | 57 |
| external:node:test | 54 |
| external:node:os | 49 |
| external:node:crypto | 45 |
| external:node:child_process | 35 |
| external:node:sqlite | 11 |
| external:bun:test | 9 |
| arbor/mobile-relay | 3 |
| external:node:module | 3 |
| external:node:perf_hooks | 3 |
| external:bun:sqlite | 2 |
| arbor/vivim-host | 1 |
| external:fs | 1 |
| external:glob | 1 |
| external:node:async_hooks | 1 |
| external:node:http | 1 |
| external:node:zlib | 1 |
| external:strings | 1 |
| external:vue | 1 |

### Incoming

| Source | Imports |
| --- | --- |
| arbor/hq | 30 |

## Context annotations

| Kind | File | Line | Owner | Text |
| --- | --- | --- | --- | --- |
| context | hq/bin/autonomy.mjs | 4 | — | Autonomy dispatcher CLI — plan one dispatch cycle from the seat roster and the open queue, journal the intent before the effect, and either wake a seat or emit a subagent work order |
| context | hq/bin/console.mjs | 4 | — | Multi-model console: one-line health dashboard for every model in provider_config.json. |
| context | hq/bin/dogfood-execution.mjs | 3 | — | WO-028 dogfood execution runner - reads the WO-027 dogfood design, drives the real |
| context | hq/bin/revive.mjs | 4 | — | The revive daemon CLI — the thing that actually runs when a model dies. Reads the ZCode |
| context | hq/bin/spawn.mjs | 4 | — | The spawn CLI: start a new ZCode conversation headless, in plan mode when it is a manager, and |
| context | hq/catalogue-identity/cli.mjs | 3 | — | Bounded local JSON-to-HQ crosswalk export; no network or source mutations. |
| context | hq/catalogue-identity/crosswalk.mjs | 3 | — | Lane C4-B deterministic, read-only catalogue identity and orphan projection. |
| context | hq/catalogue-identity/labs-adapter.mjs | 2 | — | Read-only adapter for Labs seed and Lane A source catalogue. |
| context | hq/catalogue-identity/observer-export.mjs | 2 | — | Explicit allowlist projection of HQ crosswalk for Labs observers. |
| context | hq/catalogue-identity/source-adapters.mjs | 2 | — | Pure source-owned catalogue adapters. No code-presence or production inference. |
| context | hq/catalogue-identity/test/benchmark.mjs | 1 | — | Local deterministic performance probe, no network or production DB. |
| context | hq/catalogue-identity/test/crosswalk.test.mjs | 2 | — | C4 Lane B crosswalk contract, privacy, replay, and orphan regression tests. |
| context | hq/lib/action-registry.mjs | 3 | — | Build the action registry: expand domains x objects x verbs into one flat action list, then summarize and validate it |
| context | hq/lib/action-router.mjs | 3 | — | Action router — rank registered actions against one plain-English sentence by exact token weight, and refuse rather than guess when nothing scores |
| context | hq/lib/actions/aliases.mjs | 3 | — | The words an operator actually uses, mapped onto the registry&#39;s vocabulary, so |
| context | hq/lib/actions/domains-1.mjs | 3 | — | The first five action domains — bus, seat, thread, cnp, evidence — each carrying the ten objects an action can be performed on. |
| context | hq/lib/actions/domains-2.mjs | 3 | — | Action domains, second group — the five object vocabularies (approval, revocation, task, inbox, bot) that the registry lane composes into action ids, each object named after a thing that a module in … |
| context | hq/lib/actions/domains-3.mjs | 3 | — | Registry domain catalogue, part 3 — the five transport and intelligence domains (anet, acp, mcp, index, context) with exactly ten lowercase-hyphenated objects each. |
| context | hq/lib/actions/domains-4.mjs | 3 | — | Domain catalog, part four — the memory, wiki, kernel, workspace and ops domains, each with exactly ten objects and one sentence saying what the object is for. |
| context | hq/lib/actions/handlers.mjs | 3 | — | The wired map: which `&lt;domain&gt;.&lt;verb&gt;` pairs have a real command behind them. An action is |
| context | hq/lib/actions/verbs.mjs | 3 | — | Action verbs — the closed ten-verb vocabulary (list, show, create, update, delete, validate, repair, export, watch, dispatch) with the risk, mutation, actor and approval facts that gate each one. |
| context | hq/lib/annotation-v2.mjs | 2 | — | Additive v2 annotation grammar: typed semantic tags parsed from source comments only. |
| context | hq/lib/approvals.mjs | 3 | — | Approval queue for agent actions — append-only JSONL of requests and decisions, expiry applied when the queue is read |
| context | hq/lib/autonomy.mjs | 3 | — | Autonomy dispatch planner — decide which seat may take which open task this cycle, as a pure function of roster, queue, provider funding, journal and an injected clock |
| context | hq/lib/autonomy.mjs | 645 | — | Autonomous investigation — given a complex objective, independently |
| context | hq/lib/canon.mjs | 2 | — | Document intelligence: the 21-family document inventory, the |
| context | hq/lib/canvas.mjs | 3 | — | Inline-fragment renderer for the ZCode Desktop UI: one conversation message that shows live team state. |
| context | hq/lib/catalogue-delta.mjs | 2 | — | Read-only bounded C4 catalogue export and replay over existing HQ semantic and source authorities. |
| context | hq/lib/channel-broker.mjs | 3 | — | ChatGPT coordination broker — a queue/dispatcher ADAPTER over the existing Studio |
| context | hq/lib/channel-seats.mjs | 3 | — | Channel seat transport — resolve a channel seat, classify it idle or active, and wake it through ACP with a journaled record |
| context | hq/lib/channel-transport.mjs | 3 | — | The only place that touches a live ZCode session: read-only liveness from the session store, and a wake that runs the real ACP method (session/prompt) in a detached worker with evidence instead of an… |
| context | hq/lib/channel-wake.mjs | 3 | — | Event-driven channel wake core — snapshot the channel (outcomes/, pending/, |
| context | hq/lib/cnp.mjs | 3 | — | CNP/1 — the chat naming protocol: a stable stem for a conversation, per-domain lineage, |
| context | hq/lib/comms-roof.mjs | 3 | — | One roof over every comms and agent-state source: the playbook bot roster, channel seats, |
| context | hq/lib/components.mjs | 2 | — | Reusable action component registry: immutable versions, versioned pipeline composition, activation, fork/diff/replay. |
| context | hq/lib/context-budget.mjs | 2 | — | Per-session context census and compaction planner over ZCode usage rows: names the token-cost driver (context size per request) and the sessions over a ceiling. |
| context | hq/lib/dogfood.mjs | 3 | — | The dogfood engine: it turns our own live conversations, channel evidence and the |
| context | hq/lib/evidence-join.mjs | 3 | — | The receipt/outcome/decision join: what a channel receipt claimed, what its outcome |
| context | hq/lib/fsf/client.mjs | 3 | — | FSF snapshot freshness — decide from the values alone whether a cached snapshot is current, how long remains before it must be refreshed, how a delta resolves, and how one HTTP read maps to a result. |
| context | hq/lib/fsf/server.mjs | 3 | — | FSF (Fleet State Feed) HTTP surface: versioned snapshot, delta, live SSE stream and an Atom projection rendered from the same snapshot, behind one token check. |
| context | hq/lib/fsf/slices.mjs | 3 | — | The seven FSF read slices — identity, capacity, work, locks, health, policy, time — each collected behind its own guard and degraded in isolation. |
| context | hq/lib/fsf/store.mjs | 3 | — | FSF feed store — an in-memory, versioned snapshot ring that publishes slice maps and |
| context | hq/lib/git-context.mjs | 2 | — | Git and GitHub repository context bundle with default config and |
| context | hq/lib/kb-bind.mjs | 2 | — | Bind the VIVIM KB type registry to HQ&#39;s semantic vocabulary: |
| context | hq/lib/kb-intake.mjs | 2 | — | VIVIM KB handover intake: classify an incoming KB package, |
| context | hq/lib/kb.mjs | 2 | — | Unified read model over documents, decisions, CANON terms, sessions, notes, wiki pages and capability documents. |
| context | hq/lib/kernel/cli.mjs | 2 | — | kernel CLI verbs (init, verify, read, history, lock, unlock) for L0 to wire into hq/bin/hq.mjs |
| context | hq/lib/kernel/store.mjs | 2 | — | durable kernel store outside .hq/: append-only revisions, single-writer lock, provenance, receipts |
| context | hq/lib/kg-export.mjs | 2 | — | The single HQ -&gt; Rust graph transport: reads the Bun/SQLite index (the |
| context | hq/lib/lane-health.mjs | 3 | — | Lane health — name the one predicate that stopped a routing role resolving (role, ladder, profile entry, or health list) from the values alone. |
| context | hq/lib/live-graph/wave1/lane-a-r2-audit.mjs | 2 | — | Wave 1 Lane A Round 2: isolated source-evidence and coverage auditor. |
| context | hq/lib/live-graph/wave1/lane-a-r2-discovery.mjs | 2 | — | Opt-in read-only Git-pinned discovery for Lane A Round 2. |
| context | hq/lib/mcp-team-tools.mjs | 2 | — | MCP tools that let one chat read and steer the whole agent team. |
| context | hq/lib/mission-evaluator.mjs | 2 | — | M1/M2 trusted read-only mission evaluator, anchored to canonical |
| context | hq/lib/mission-intelligence.mjs | 2 | — | Mission Intelligence v1 — read-only outcome-aware projection over existing |
| context | hq/lib/mission-shadow.mjs | 2 | — | M3 shadow-only mission decision and revision proposal. |
| context | hq/lib/mission-sources.mjs | 2 | — | Read-only HQ mission snapshot from existing work orders, task JSONL, |
| context | hq/lib/model-budget.mjs | 2 | — | Automated model budget tracking: per-provider/model budget status computed from usage + provider config, for smart routing that never sends to a dead model. |
| context | hq/lib/model-inventory.mjs | 2 | — | Offline unified model inventory and provider budget evidence snapshot for context consumers. |
| context | hq/lib/model-router.mjs | 2 | — | Budget-aware model routing: choose the cheapest healthy model that can do the task. |

---

[HQ wiki](../../index.md) · [Symbols](../../symbols.md) · [Dependency graph](../../graph.md) · [Documentation](../../docs.md) · [Changes](../../changes.md) · [Open tasks](../../todos.md) · [Deprecated](../../deprecated.md) · [Agent annotation protocol](../../protocol.md) · [Glossary](../../glossary.md) · [Using HQ](../../context.md) · [Capabilities](../../capabilities.md) · [Search index](../../search.json) · [Browser view](../../index.html)

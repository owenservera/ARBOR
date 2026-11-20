# File: hq/aii/fixtures/harness.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/harness.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10294 B |
| Lines | 226 |
| Hash | e7de765946b4 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| defineFixture | function | 28 | yes | export function defineFixture(def) { |
| problems | const | 29 | no | const problems = []; |
| finding | function | 38 | yes | export function finding(what, where = null) { |
| matchesFinding | function | 42 | yes | export function matchesFinding(expected, findingRow) { |
| whatOk | const | 43 | no | const whatOk = expected.what instanceof RegExp |
| whereOk | const | 48 | no | const whereOk = expected.where instanceof RegExp |
| probeStore | const | 64 | no | const probeStore = new AsyncLocalStorage(); |
| WRITE_HEADS | const | 66 | no | const WRITE_HEADS = new Set([ &#39;reset&#39;, &#39;install&#39;, &#39;uninstall&#39;, &#39;sync&#39;, &#39;note&#39;, &#39;init&#39;, &#39;record&#39;, &#39;delete&#39;, &#39;remove&#39;, &#39;apply&#39;, &#39;enable&#39;, &#39;disable&#39;, &#39;wake&#39;, &#39;spawn&#39;, &#39;send&#39;, ]); |
| WRITE_PAIRS | const | 70 | no | const WRITE_PAIRS = new Set([ &#39;project add&#39;, &#39;project remove&#39;, &#39;hooks install&#39;, &#39;hooks uninstall&#39;, &#39;kb intake&#39;, &#39;docs index&#39;, &#39;seat wake&#39;, &#39;seat spawn&#39;, &#39;comms send&#39;, &#39;decisions confirm&#39;, &#39;canon conf… |
| WRITE_FLAGS | const | 75 | no | const WRITE_FLAGS = new Set([&#39;--write&#39;, &#39;--apply&#39;, &#39;--out&#39;, &#39;--commit&#39;, &#39;--run&#39;]); |
| isMutatingProbe | function | 77 | yes | export function isMutatingProbe(args) { |
| list | const | 78 | no | const list = (Array.isArray(args) ? args : []).map(String); |
| head | const | 79 | no | const head = list[0] ?? &#39;&#39;; |
| probeContext | function | 96 | yes | export function probeContext(store, fn) { |
| runHq | function | 108 | yes | export function runHq(args, { timeoutMs = 120_000, cwd = process.cwd() } = {}) { |
| ctx | const | 109 | no | const ctx = probeStore.getStore(); |
| list | const | 110 | no | const list = (Array.isArray(args) ? args : []).map(String); |
| startedAt | const | 111 | no | const startedAt = Date.now(); |
| key | const | 118 | no | const key = `${cwd}\\0${list.join(&#39;\\0&#39;)}`; |
| hit | const | 120 | no | const hit = ctx.cache.get(key); |
| budgetLeft | const | 124 | no | const budgetLeft = Number.isFinite(ctx.timeoutMs) ? Math.max(1_000, ctx.timeoutMs) : timeoutMs; |
| effective | const | 125 | no | const effective = Math.min(Number(timeoutMs) \|\| 120_000, budgetLeft); |
| result | const | 126 | no | const result = spawnHq(list, { timeoutMs: effective, cwd }); |
| spawnHq | function | 135 | no | function spawnHq(list, { timeoutMs, cwd }) { |
| res | const | 136 | no | const res = spawnSync(&#39;bun&#39;, [&#39;hq/bin/hq.mjs&#39;, ...list], { encoding: &#39;utf8&#39;, timeout: timeoutMs, cwd, windowsHide: true, |
| fixtureDigest | function | 148 | yes | export function fixtureDigest(id, findingsCount) { |
| fixtureFingerprint | function | 153 | yes | export function fixtureFingerprint({ id, fixtureSha, catalogSha, expectedSha, findingsCount }) { |
| target | const | 164 | no | const target = process.argv[2]; |
| fixturePath | const | 169 | no | const fixturePath = resolve(target); |
| ROOT | const | 173 | no | const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| mod | const | 175 | no | const mod = await import(pathToFileURL(fixturePath).href); |
| findings | const | 177 | no | const findings = await probeContext({ cwd: ROOT }, () =&gt; def.run()); |
| missing | const | 179 | no | const missing = def.expected.filter((exp) =&gt; !findings.some((f) =&gt; matchesFinding(exp, f))); |
| fixtureSha | const | 185 | no | const fixtureSha = createHash(&#39;sha256&#39;) |
| db | const | 188 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| catalogSha | const | 194 | no | const catalogSha = createHash(&#39;sha256&#39;) |
| receipt | const | 197 | no | const receipt = await recordReceiptWithRetry(db, buildFixtureReceipt({ id: def.id, fixtureSha, expectedSha: expectationsDigest(def.expected), findings: findings.length, |
| recordReceiptWithRetry | function | 213 | no | async function recordReceiptWithRetry(db, receipt, attempts = 6) { |
| lastError | variable | 214 | no | let lastError = null; |
| message | const | 219 | no | const message = String(err?.message ?? err); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:async_hooks | import | 18 | external |
| node:child_process | import | 19 | external |
| node:crypto | import | 20 | external |
| node:fs | import | 21 | external |
| node:path | import | 22 | external |
| node:url | import | 23 | external |
| ../../lib/schema.mjs | import | 24 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/receipts.mjs | import | 25 | [hq/lib/receipts.mjs](../../lib/receipts.mjs.md) |
| ../../lib/aii/receipts-policy.mjs | import | 26 | [hq/lib/aii/receipts-policy.mjs](../../lib/aii/receipts-policy.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-001-repositories.mjs](./HQ-001-repositories.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-002-repo-folders.mjs](./HQ-002-repo-folders.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-003-same-repo-not-duplicated.mjs](./HQ-003-same-repo-not-duplicated.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-004-repository-classification.mjs](./HQ-004-repository-classification.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-005-repository-dependencies.mjs](./HQ-005-repository-dependencies.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-006-local-vs-github.mjs](./HQ-006-local-vs-github.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-007-unintegrated-branches.mjs](./HQ-007-unintegrated-branches.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-008-uncommitted-changes.mjs](./HQ-008-uncommitted-changes.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-009-indexing-coverage-gaps.mjs](./HQ-009-indexing-coverage-gaps.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-010-removal-blast-radius.mjs](./HQ-010-removal-blast-radius.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-011-architecture.mjs](./HQ-011-architecture.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-012-entrypoint.mjs](./HQ-012-entrypoint.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-013-trace.mjs](./HQ-013-trace.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-014-service-consumers.mjs](./HQ-014-service-consumers.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-015-module-dependencies.mjs](./HQ-015-module-dependencies.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-016-database-writers.mjs](./HQ-016-database-writers.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-017-authorization-enforcement.mjs](./HQ-017-authorization-enforcement.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-018-same-responsibility.mjs](./HQ-018-same-responsibility.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-019-boundary-crossings.mjs](./HQ-019-boundary-crossings.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-020-tight-coupling.mjs](./HQ-020-tight-coupling.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-021-planned-features-implemented.mjs](./HQ-021-planned-features-implemented.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-022-reachable-by-users.mjs](./HQ-022-reachable-by-users.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-023-no-runtime-consumers.mjs](./HQ-023-no-runtime-consumers.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-024-implemented-unmounted.mjs](./HQ-024-implemented-unmounted.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-025-imported-never-executed.mjs](./HQ-025-imported-never-executed.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-026-fixtures-only.mjs](./HQ-026-fixtures-only.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-027-disabled-by-config.mjs](./HQ-027-disabled-by-config.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-028-retirement-candidates.mjs](./HQ-028-retirement-candidates.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-029-dynamically-loaded.mjs](./HQ-029-dynamically-loaded.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-030-missing-final-integration.mjs](./HQ-030-missing-final-integration.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-031-running-services.mjs](./HQ-031-running-services.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-032-running-executable-version.mjs](./HQ-032-running-executable-version.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-032-running-version.mjs](./HQ-032-running-version.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-033-platform-conditional-features.mjs](./HQ-033-platform-conditional-features.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-034-source-features-vs-manifest.mjs](./HQ-034-source-features-vs-manifest.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-035-device-verification-absence.mjs](./HQ-035-device-verification-absence.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-036-documented-capabilities-without-implementation.mjs](./HQ-036-documented-capabilities-without-implementation.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-037-labs-designs-implemented-elsewhere.mjs](./HQ-037-labs-designs-implemented-elsewhere.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-038-research-prototype-promotion.mjs](./HQ-038-research-prototype-promotion.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-039-outdated-docs.mjs](./HQ-039-outdated-docs.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-040-contradicting-docs.mjs](./HQ-040-contradicting-docs.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-041-superseded-decisions.mjs](./HQ-041-superseded-decisions.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-042-decision-provenance.mjs](./HQ-042-decision-provenance.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-043-requirements-owner.mjs](./HQ-043-requirements-owner.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-044-conflicting-specs.mjs](./HQ-044-conflicting-specs.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-045-archival-knowledge-loss.mjs](./HQ-045-archival-knowledge-loss.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-046-prove-feature.mjs](./HQ-046-prove-feature.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-047-completion-claims.mjs](./HQ-047-completion-claims.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-048-tests-older-revisions.mjs](./HQ-048-tests-older-revisions.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-049-not-reproducible.mjs](./HQ-049-not-reproducible.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-050-evidence-needed.mjs](./HQ-050-evidence-needed.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-051-unit-only-critical-behaviors.mjs](./HQ-051-unit-only-critical-behaviors.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-052-never-independently-verified.mjs](./HQ-052-never-independently-verified.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-053-fixture-evidence.mjs](./HQ-053-fixture-evidence.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-054-uninspectable-environments.mjs](./HQ-054-uninspectable-environments.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-055-strongest-evidence.mjs](./HQ-055-strongest-evidence.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-056-disagreeing-completion-reports.mjs](./HQ-056-disagreeing-completion-reports.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-056-disagreeing-completion-reports.mjs](./HQ-056-disagreeing-completion-reports.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-057-authoritative-repo.mjs](./HQ-057-authoritative-repo.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-058-route-documented-not-mounted.mjs](./HQ-058-route-documented-not-mounted.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-059-changes-between-versions.mjs](./HQ-059-changes-between-versions.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-060-tests-pass-runtime-fails.mjs](./HQ-060-tests-pass-runtime-fails.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-061-regression-attribution.mjs](./HQ-061-regression-attribution.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-062-shared-assumptions.mjs](./HQ-062-shared-assumptions.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-063-missing-dependency.mjs](./HQ-063-missing-dependency.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-064-evidence-to-distinguish-explanations.mjs](./HQ-064-evidence-to-distinguish-explanations.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-065-root-cause.mjs](./HQ-065-root-cause.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-066-agent-systems.mjs](./HQ-066-agent-systems.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-067-zcode-vs-opencode-config.mjs](./HQ-067-zcode-vs-opencode-config.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-068-custom-hooks.mjs](./HQ-068-custom-hooks.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-069-agent-tool-coupling.mjs](./HQ-069-agent-tool-coupling.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-070-agent-instruction-conflicts.mjs](./HQ-070-agent-instruction-conflicts.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-071-interface-change-impact.mjs](./HQ-071-interface-change-impact.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-072-module-migration-consumers.mjs](./HQ-072-module-migration-consumers.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-073-tests-after-change.mjs](./HQ-073-tests-after-change.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-074-minimal-orphan-connection.mjs](./HQ-074-minimal-orphan-connection.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-075-dependency-upgrade-impact.mjs](./HQ-075-dependency-upgrade-impact.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-076-migration-risks.mjs](./HQ-076-migration-risks.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-077-change-independence.mjs](./HQ-077-change-independence.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-078-integration-sequencing.mjs](./HQ-078-integration-sequencing.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-079-merge-evidence-gap.mjs](./HQ-079-merge-evidence-gap.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-080-consolidation-sequence.mjs](./HQ-080-consolidation-sequence.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-081-remaining-release-work.mjs](./HQ-081-remaining-release-work.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-082-rank-unfinished-by-user-value.mjs](./HQ-082-rank-unfinished-by-user-value.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-083-blocked-same-dependency.mjs](./HQ-083-blocked-same-dependency.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-084-duplicate-completed-work.mjs](./HQ-084-duplicate-completed-work.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-085-critical-path-ownerless.mjs](./HQ-085-critical-path-ownerless.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-086-minimal-releasable-scope.mjs](./HQ-086-minimal-releasable-scope.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-087-unnecessary-planned-features.mjs](./HQ-087-unnecessary-planned-features.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-088-release-blocking-integrations.mjs](./HQ-088-release-blocking-integrations.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-089-component-regression.mjs](./HQ-089-component-regression.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-089-performance-regression-components.mjs](./HQ-089-performance-regression-components.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-090-redundant-computation.mjs](./HQ-090-redundant-computation.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-090-redundant-indexing.mjs](./HQ-090-redundant-indexing.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-091-background-consumption.mjs](./HQ-091-background-consumption.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-091-background-process-consumption.mjs](./HQ-091-background-process-consumption.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-092-best-verified-configuration.mjs](./HQ-092-best-verified-configuration.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-093-retrieval-latency-staleness.mjs](./HQ-093-retrieval-latency-staleness.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-094-investigate-architectural-question.mjs](./HQ-094-investigate-architectural-question.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-095-unknowns-investigation.mjs](./HQ-095-unknowns-investigation.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-096-challenge-conclusions.mjs](./HQ-096-challenge-conclusions.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-097-materially-changed.mjs](./HQ-097-materially-changed.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-098-stale-findings.mjs](./HQ-098-stale-findings.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-099-self-audit.mjs](./HQ-099-self-audit.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-100-autonomous-investigation.mjs](./HQ-100-autonomous-investigation.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-101-frontier-model-candidates.mjs](./HQ-101-frontier-model-candidates.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-102-core-vs-peripheral.mjs](./HQ-102-core-vs-peripheral.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-103-strongest-model-only-components.mjs](./HQ-103-strongest-model-only-components.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-104-high-impact-code.mjs](./HQ-104-high-impact-code.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-105-complex-modules.mjs](./HQ-105-complex-modules.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-106-expensive-areas.mjs](./HQ-106-expensive-areas.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-107-work-queue-model-ranking.mjs](./HQ-107-work-queue-model-ranking.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-108-unscrutinized-core-changes.mjs](./HQ-108-unscrutinized-core-changes.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-109-subsystem-implicit-knowledge.mjs](./HQ-109-subsystem-implicit-knowledge.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-110-autonomous-routing-decision.mjs](./HQ-110-autonomous-routing-decision.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-111-register-new-repo-class.mjs](./HQ-111-register-new-repo-class.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-112-multi-class-sources.mjs](./HQ-112-multi-class-sources.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-113-harvestable-assets-identification.mjs](./HQ-113-harvestable-assets-identification.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-114-compare-registered-repos.mjs](./HQ-114-compare-registered-repos.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-115-domain-query-ranking.mjs](./HQ-115-domain-query-ranking.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-116-harvest-ready-components.mjs](./HQ-116-harvest-ready-components.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-117-harvesting-plan.mjs](./HQ-117-harvesting-plan.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-118-harvesting-provenance.mjs](./HQ-118-harvesting-provenance.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-119-autonomous-harvest-shortlist.mjs](./HQ-119-autonomous-harvest-shortlist.mjs.md) | ./harness.mjs |
| [hq/aii/fixtures/HQ-120-harvestable-update-monitoring.mjs](./HQ-120-harvestable-update-monitoring.mjs.md) | ./harness.mjs |
| [hq/lib/aii/runner.mjs](../../lib/aii/runner.mjs.md) | ../../aii/fixtures/harness.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/harness.mjs — shared contract for AII benchmark fixtures
// (PRD HQ-PRD-AII-001). Idiom from scripts/context-bench.mjs: ground truth is
// locked at authoring time (with a provenance note) and re-derived at run time.
//
// A fixture file hq/aii/fixtures/HQ-NNN-<slug>.mjs default-exports
// defineFixture({ id, provenance, expected, run }):
//   id          — the scenario id, HQ-NNN
//   provenance  — how/when the expected findings were locked (required)
//   expected    — non-empty array of {what, where?}; what is an exact string or
//                 RegExp, where is a path prefix or RegExp (optional)
//   run         — async () => findings[] via finding(what, where?)
//
// Fixtures are read-only probes: no provider messages, no Host-world writes,
// no approvals. Synthetic/seeded data only — no credentials, no private
// session content. Build lanes check ONE fixture at a time with this CLI;
// scripts/aii-verify.mjs is the whole-suite runner (acceptance phase only).

import { AsyncLocalStorage } from 'node:async_hooks';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openDb } from '../../lib/schema.mjs';
import { recordReceipt } from '../../lib/receipts.mjs';
import { buildFixtureReceipt, expectationsDigest } from '../../lib/aii/receipts-policy.mjs';

export function defineFixture(def) {
  const problems = [];
  if (!/^HQ-\d{3}$/.test(String(def.id ?? ''))) problems.push('id must match HQ-NNN');
  if (!Array.isArray(def.expected) || def.expected.length === 0) problems.push('expected must be a non-empty array');
  if (typeof def.run !== 'function') problems.push('run must be a function');
  if (!String(def.provenance ?? '').trim()) problems.push('provenance is required (how ground truth was locked)');
  if (problems.length) throw new Error(`invalid fixture ${def.id ?? '(no id)'}: ${problems.join('; ')}`);
  return def;
}

export function finding(what, where = null) {
  return where == null ? { what } : { what, where };
}

export function matchesFinding(expected, findingRow) {
  const whatOk = expected.what instanceof RegExp
    ? expected.what.test(String(findingRow.what))
    : String(expected.what) === String(findingRow.what);
  if (!whatOk) return false;
  if (expected.where == null) return true;
  const whereOk = expected.where instanceof RegExp
    ? expected.where.test(String(findingRow.where ?? ''))
    : String(findingRow.where ?? '').startsWith(String(expected.where));
  return whereOk;
}

// Read-only hq CLI probe helper. Never pass mutating flags (reset, do --run,
// project add/remove, hooks install...); the verifier records what it ran.
//
// Inside a verifier run the call is governed by an ambient probe context:
//   - write-shaped commands are refused before spawn (status mutating-probe),
//   - identical probes are cached for the life of the process, because the
//     result cannot change between fixtures in one run,
//   - the per-probe timeout is capped by the fixture's remaining wall clock.
// Outside a context (a bare `bun hq/aii/fixtures/harness.mjs <file>` run)
// behaviour is exactly the old one.
const probeStore = new AsyncLocalStorage();

const WRITE_HEADS = new Set([
  'reset', 'install', 'uninstall', 'sync', 'note', 'init', 'record',
  'delete', 'remove', 'apply', 'enable', 'disable', 'wake', 'spawn', 'send',
]);
const WRITE_PAIRS = new Set([
  'project add', 'project remove', 'hooks install', 'hooks uninstall',
  'kb intake', 'docs index', 'seat wake', 'seat spawn', 'comms send',
  'decisions confirm', 'canon confirm', 'decisions supersede', 'canon deprecate',
]);
const WRITE_FLAGS = new Set(['--write', '--apply', '--out', '--commit', '--run']);

export function isMutatingProbe(args) {
  const list = (Array.isArray(args) ? args : []).map(String);
  const head = list[0] ?? '';
  if (WRITE_HEADS.has(head)) return true;
```

_First 80 of 227 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

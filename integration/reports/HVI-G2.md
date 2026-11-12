> **MAIN DRIFT RECONCILED AFTER INITIAL STAGING (2026-11-12):** Concurrent ARBOR main PR #23 advanced main from `3d45fbf1c3963e4834a5e51ee7f6e63f3a0da298` to `9b79d732da8b92713d399040db4a02d505bc7cf1`. Compare identified 11 paths all under `.integration/proposal5/rescore-expansion/**`, none touching HVI. A two-parent, no-force integration-branch merge `08abdd1f71471fa9d87ab89c3c46c449ff9d9b52` preserved new main's exact blobs and staged G2 source. No main write by this worker. See `.integration/proposal5/hq-version-intelligence/proofs/G2/MAIN-DRIFT-RECONCILIATION.md`. This does **not** change the `REPAIR_REQUIRED` gate or make G1 accepted.

# ARBOR Proposal 5 — HVI G2 serial integration (NATIVE TOOLING ONLY)

**2026-11-12 decision:** `REPAIR_REQUIRED`. **Status:** `PREPARED_NOT_PROMOTED` / `HVI_TOOLING_INSTALLED_NOT_VERIFIED` on the G integration branch only. **NOT** `GO_FOR_READINESS_REVIEW`, `HVI_TOOLING_READY`, real-repo audit, runtime security acceptance or beta GO.

## Authority and exact bases
- Repository: `owenservera/ARBOR`; work branch: `integrate/p5-hq-version-intelligence-r001`.
- G1 candidate source parent: `69447c09f420310aa84c24a1908dede91c963ec8`.
- `main` observed before G2: `3d45fbf1c3963e4834a5e51ee7f6e63f3a0da298`; accepted G1 **main** SHA: **null**.
- H final source head `d24daa9966abb222cd25210f41dcbb4758aa1209`: seven files staged in commit `546132d92639af78f70d398c8a5a86d5d6a64738`.
- U final source head `5836e9c9f5ba3bee36dbe6896ebfd22364b4c450`: eight files staged in commit `4bb70bfbadc9b35f13b36232b44044c16900976c`.
- Z2 independent proof head `725132c640a1f21d3af5c4b9123b314e4df3133d`: five proofs staged in commit `9aac22f151e89ea7554ef7ee5cc65b30e5b34e21`. Z2's actual gate is `REPAIR_REQUIRED`, NOT `GO_FOR_G2_TOOLING_REVIEW`.
- H/U forked common W2 owner-waiver candidate `bbe7e4896eea02bcdec6f8fedb66eab885250161`; final G1 changed one documentation/report commit beyond this point. No old pinned source or worker branch reset, no X audit import. X remains DEFERRED.

## G2 reconciliations actually committed
1. Corrected U synthetic test's incorrect expectation of more than four *direct* canonical root children; TierFlow groups sections. `packages/tierflow/tests/hvi-inspector.test.mjs`, commit `535293ae94626a8b78617803a51ff7b8a2a8f950`.
2. Added a new **pure derived projection, not a source store or authority**, `hq/version-intelligence/integration/host-inspector-projection.mjs`. It verifies G1 comparison envelope and digest, bounds rows, redacts secret-looking paths, retains original digest provenance while recomputing a distinct derived digest, rechecks each pinned source grant before and after projection. Initial commit `9713499f86bfb4ce8f7069ccd876deb06ed22d4d`; regex fix `2acc4fb69dcdc21e4403ffc4b909d83aaecaf88f`.
3. Existing H local read port now returns one sanitized, grant-rechecked H→U typed inspector DTO alongside its read-only summary; `apps/vivim-host/control/hvi-capability.mjs` commit `cd6764ab291157dbeca5ac0923b662341ac932a4`. Canonical Host catalog action `versions.compare.pinned` remains **enforcement_missing / null executor**; there is no attested live development-source grant service or production invocation.
4. TierFlow inspector requires an explicit trusted fixture marker in addition to the existing synthetic preview flags; prevents treating arbitrary output as a synthetic fixture. `packages/tierflow/src/visual-runtime/render/hvi-inspector.mjs` commit `c9092d8bab26de270113cc7a2895c71cea2229b9`, corresponding U synthetic test fixture change `0539d23404ef5b1de12ad646d807a2fda57c6ab6`. **Live rendering still disabled.**
5. Added synthetic Host→U tests in `tests/hq-version-intelligence/g2-host-ui.test.mjs`: three immutable SHA pins in one invented repo; five independent invented repos; current-grant/refusal/revoke, metadata redaction, typed DTO, non-publisher and no-effects. Commits `8dcbc05695c7f2262157de684189c7db4bfabc46` and `bc644e2e3314ed80a3f9891695d8ad4798cee6b9`. **Authored tests are not passed tests.**

## Observed test truth — executed receipts

All suites below ran on the integration branch at commit `a256611b9375bbed1c657393f2ff034e278b8bed` (branch `integrate/p5-hq-version-intelligence-r001`), Windows 10.0.29704 x64 (MINGW64_NT-10.0-29704 3.6.5-22c95533.x86_64), Node v24.22.1, bun 1.4.2, AJV 8.17.1 (CI-exact). All are synthetic-only: invented Git-object fixtures, no real repository, no network, no provider, no browser, no personal data, no donor comparison. Machine-readable receipts live under `.integration/proposal5/hq-version-intelligence/proofs/G2/`.

| Gate | Command | Tests | Passed | Failed | Exit |
|---|---|---|---|---|---|
| G1/G2 synthetic schema suites | `node --test tests/hq-version-intelligence/*.test.mjs` | 73 | 73 | 0 | 0 |
| Host native read port | `node --test apps/vivim-host/test/hvi-capability.test.mjs` | 8 | 8 | 0 | 0 |
| Host development-source grant | `node --test apps/vivim-host/test/hvi-source-grant.test.mjs` | 9 | 9 | 0 | 0 |
| Native HQ discovery / MCP tool | `node --test hq/test/hvi-mcp-tool.test.mjs` | 4 | 4 | 0 | 0 |
| HQ boundary suite | `node --test hq/test/arbor-boundary.test.mjs` | 13 | 9 | 0 | 0 |
| TierFlow inert inspector | `node --experimental-strip-types --test packages/tierflow/tests/hvi-inspector.test.mjs` | 17 | 17 | 0 | 0 |
| HVI module suites | `node --test hq/catalogue-identity/test/crosswalk.test.mjs hq/version-intelligence/compare/index.test.mjs hq/version-intelligence/identity/test/identity.test.mjs hq/version-intelligence/parity/atlas.test.mjs hq/version-intelligence/report/test/report.test.mjs hq/version-intelligence/sources/snapshots.test.mjs` | 81 | 81 | 0 | 0 |
| CLI offline no-donor replay | `node hq/version-intelligence/integration/cli.mjs --synthetic-stdin < synthetic-request.json` | 1 execution | 1 | 0 | 0 |

Receipts: `.integration/proposal5/hq-version-intelligence/proofs/G2/g1-g2-receipt.json`, `.integration/proposal5/hq-version-intelligence/proofs/G2/host-read-port-receipt.json`, `.integration/proposal5/hq-version-intelligence/proofs/G2/host-source-grant-receipt.json`, `.integration/proposal5/hq-version-intelligence/proofs/G2/hvi-discovery-receipt.json`, `.integration/proposal5/hq-version-intelligence/proofs/G2/hq-boundary-receipt.json`, `.integration/proposal5/hq-version-intelligence/proofs/G2/tierflow-inspector-receipt.json`, `.integration/proposal5/hq-version-intelligence/proofs/G2/hvi-modules-receipt.json`, `.integration/proposal5/hq-version-intelligence/proofs/G2/cli-offline-replay-receipt.json`.

**Honest framing:** every passing result above proves ONLY synthetic-source conformance. None of it is G1/G2 runtime acceptance, a live donor comparison, Host security acceptance, canonical dispatch acceptance, or executable evidence of main promotion. G1/G2 still require independent review and live canonical Host grant/publisher gates. No real donor comparison or runtime acceptance is claimed.

The connector can read and commit GitHub source but does not execute a checked-out Node24 suite. No test pass may be inferred from GitHub `startup_failure`, authoring source, or isolated V8 tests. Node22 environment observations elsewhere do not count as G2 runtime acceptance.

## P0/P1 blockers — exact owners

| Blocker | Status | Kind | Owner | Notes |
|---|---|---|---|---|
| `G1_NOT_ACCEPTED` | unchanged | process | G1/CI | No accepted G1 `main` commit (accepted G1 main SHA: null). Outside this branch's scope. Review and run actual Node24/AJV synthetic-only tests; merge via normal gate after actual receipts. Owner development waiver grants remote source repair only, not main promotion. |
| `REMOTE_CI_STARTUP_FAILURE` | confirmed | infrastructure | CI | CONFIRMED account-level, not repo-config: every workflow on this repo (including unrelated branches) returns `startup_failure` with 0 jobs at ~0s. Repo Actions permissions are enabled/all. NOT fixable from this branch. |
| `LIVE_SOURCE_GRANT_MISSING` | implemented_pending_acceptance | process | Host security | The grant IS implemented (`apps/vivim-host/control/hvi-source-grant.mjs`) and verified on synthetic fixtures, but awaits Host security acceptance. No live grant service or production invocation. |
| `HOST_NATIVE_DISPATCH_DISABLED` | documented | architecture | H/G2 | Documented architectural fact: Host dispatcher is synchronous by construction; HVI engine is async; direct wiring would produce false `applied`. Kept disabled until independently accepted. |
| `EXECUTABLE_EVIDENCE_UNRUN` | resolved | process | G1/H/U/G2 QA | RESOLVED with real receipts under `.integration/proposal5/hq-version-intelligence/proofs/G2/` (see table above). All exits 0, synthetic-only. |
| `PUBLISHER_REVISION_UNATTESTED` | unchanged | process | U/Host publisher | Out of scope; TierFlow publisher live feature stays OFF. Requires current revision observation from existing UiCore/UiStore and CAS guard, not caller-controlled revision. |
| `BETA_GATES_BLOCKED` | blocked | process | beta release owners | `integration/beta-gates.json` remains `BLOCKED_NOT_BETA`; out of scope; zero inference from HVI staging. |

## Security, privacy and rollback
Read-only source analysis only. No real ARBOR/VIVIM/Labs/donor comparison; no personal World data; no provider API, Playwright/Puppeteer, Chrome sender, effect writer, source grant database, scheduler, graph store or competing TierFlow publisher was created. No privileged remote source reads enabled. All changes are on the existing integration branch. No modification or merge to `main`, no rewriting immutable S0/D counts or source pins, no changed beta gate. Rollback is a reviewed candidate-branch revert; **rollback drill UNRUN**.

## Required next owner gate
Obtain G1 actual Node24 + AJV receipt and accepted `main` SHA; re-review G2 drift, wire canonical live grant and Host action dispatch without new authority; attest current UiCore revision; run and record full synthetic 2/3/5-source, 3-SHA, denial/revoke/expiry, secret/redaction, deterministic replay, report and UI tests; obtain new independent Z2 consent/review. **Only after the verified combined gate** may the integrator submit/merge a reviewed PR to main and issue `GO_FOR_READINESS_REVIEW`. Current final gate is `REPAIR_REQUIRED`; do not bypass gates based on owner source-development approval.

Machine-readable receipts: `.integration/proposal5/hq-version-intelligence/proofs/G2/g1-g2-receipt.json`, `.integration/proposal5/hq-version-intelligence/proofs/G2/host-read-port-receipt.json`, `.integration/proposal5/hq-version-intelligence/proofs/G2/host-source-grant-receipt.json`, `.integration/proposal5/hq-version-intelligence/proofs/G2/hvi-discovery-receipt.json`, `.integration/proposal5/hq-version-intelligence/proofs/G2/hq-boundary-receipt.json`, `.integration/proposal5/hq-version-intelligence/proofs/G2/tierflow-inspector-receipt.json`, `.integration/proposal5/hq-version-intelligence/proofs/G2/hvi-modules-receipt.json`, `.integration/proposal5/hq-version-intelligence/proofs/G2/cli-offline-replay-receipt.json` (schema `arbor.proposal5.hvi.g2.receipt/1`). Historical ledger: `.integration/proposal5/hq-version-intelligence/proofs/G2/G2-RECEIPT.json` (immutable, not edited).

## G2 follow-through: native HQ source-read security repairs (2026-11-12)

**Actual code commits** on the existing integration branch after original G2 staging:

1. `77bec293a7f0144d1c0bae01a1102a26bf1a7e9f` — align the low-level immutable Git source helper's sensitive-path exclusions with C bridge policy, including `.ssh`, `.aws`, private paths and key/certificate file extensions; `readPinnedBlob` now reuses the broadened helper.
2. `eec8a16f00e1e26459c6ad6a7e4c4c9851300d23` — directly supplied N-way comparator source manifests use the same sensitive-path guard, not only the A→C bridge.
3. `06858bf389338695969cff12e55ea1f1138bb20e` and `33b6059615aab0ec5571a3acf5674725b67fcd9f` — authored new synthetic regression cases for direct credential reads, projection redaction, disallowed repos, cancellation, and a malicious C manifest with a recomputed digest. **Tests authored, NOT executed on Node24**.

**Observed verification**: 14/14 V8 assertions of the fetched native sensitive-path source slice and V8 syntax parse of the extended test file. **No OS test exit, full module import, cryptographic comparison, integrated Node24 or AJV receipt.** GitHub Actions latest [43319733234](https://github.com/owenservera/ARBOR/actions/runs/43319733234) on source SHA `33b6059615aab0ec5571a3acf5674725b67fcd9f`: `startup_failure`, jobs=0. A failed-job retry returned 403 `This workflow run cannot be retried`. Opened [tracking issue #24](https://github.com/owenservera/ARBOR/issues/24); [PR #21](https://github.com/owenservera/ARBOR/pull/21) remains DRAFT, no reviews, not merged.

This advances source hardening but **does not change** `G1_NOT_ACCEPTED`, `Z2_REPAIR_REQUIRED`, `REPAIR_REQUIRED`, `HVI_TOOLING_INSTALLED_NOT_VERIFIED`, the disabled production Host action, the pending UiCore authoritative-revision requirement, or `BLOCKED_NOT_BETA`. A final R certificate is impermissible before real main and security gates. No real user-repository/donor comparisons were performed.

**Dedicated test automation staged:** `.github/workflows/hvi-native-synthetic.yml` (`d2411bae45964f533b5c48f0faac727c31140932`) would run Node24, pinned AJV, synthetic G1/G2, Host and TierFlow tests without a real donor comparison or checkout token persistence. GitHub [run 43320303173](https://github.com/owenservera/ARBOR/actions/runs/43320303173) still returned `startup_failure` and zero jobs. This is infrastructure preparation, **not an executed test**; acceptance stays `REPAIR_REQUIRED`.

# HVI G2 — Serial integration decision, 2026-11-12

**Decision: `REPAIR_REQUIRED`.** G2 source repairs are committed and can continue on the remote integration branch under the existing owner development waiver. **`GO_FOR_READINESS_REVIEW` is NOT issued.** `PREPARED_NOT_PROMOTED`, `HVI_TOOLING_INSTALLED_NOT_VERIFIED`. No beta GO.

## Verified source and authority pins
- G1 candidate base: `69447c09f420310aa84c24a1908dede91c963ec8`; accepted G1 `main` SHA **null**.
- H source: `d24daa9966abb222cd25210f41dcbb4758aa1209`, source-stage commit `546132d92639af78f70d398c8a5a86d5d6a64738`.
- U source: `5836e9c9f5ba3bee36dbe6896ebfd22364b4c450`, source-stage commit `4bb70bfbadc9b35f13b36232b44044c16900976c`.
- Z2 independent proof: `725132c640a1f21d3af5c4b9123b314e4df3133d`, proof-stage commit `9aac22f151e89ea7554ef7ee5cc65b30e5b34e21`; Z2 gave `REPAIR_REQUIRED`, not a positive gate.
- Pre-G2 `main` observed: `3d45fbf1c3963e4834a5e51ee7f6e63f3a0da298`; never rewritten or merged.
- G2 synthetic source/test staging through commit `bc644e2e3314ed80a3f9891695d8ad4798cee6b9`; machine receipt `2a512b12d4027dc498dd3b22e583ed186adc4490`; human integration report `472a2be7ea69f4edd94774aba1bda26cb3011ddb`.

## What was accomplished
H and U were serially imported with 20 total scoped files including Z2 proofs; no X branch/source dependency. H→U typed sanitized detailed report bridge, per-grant before/after projector checks, source-only digest lineage, and TierFlow synthetic-only preview guard are staged. Grouped test assertion corrected. End-to-end 3-SHA same-repository and 5-invented-repository test source authored. No new Host effect writer, development grant authority, graph store, scheduler, browser provider sender or TierFlow publisher; no actual repository comparison and no activation of HVI remote source reads.

## Executed vs UNRUN
- **Executed:** six GitHub-source modules/test files isolated V8 transformed syntax evaluation, no exceptions; synthetic pure bridge and TierFlow projector V8 assertions **12/12 passed**, with a noncryptographic digest test-double. These are **NOT** OS/Node process exits or complete G2 runtime acceptance.
- **GitHub Actions:** run `43315512755` at synthetic test staging SHA `bc644e2e3314ed80a3f9891695d8ad4798cee6b9`: `startup_failure`, **zero jobs**, no exit.
- **UNRUN, exit=null:** integrated Node24, G1/Host/U/G2 Node tests, strict AJV Draft 2020-12, synthetic CLI offline replay, real Host grant/session expiration/revoke, canonical NL dispatch, UiCore publisher revision/CAS, live security, physical PWA/Android/Windows, rollback drill.
- **Defer:** X real-repository audit and 361 original-path semantic review; fixed S0/D historical counts were not remeasured.

## Owner action and stop
G1+CI: attain executable synthetic test receipts and accepted main via reviewed PR. Host security/H: wire real canonical revocable development-source grants and admitted action (default disabled until proof). U/G2: attest live UiCore revision and run full synthetic UI tests. Independent Z2: review repairs and exits. Only then may G2 request a reviewed main promotion and possibly issue `GO_FOR_READINESS_REVIEW`. Keep `integration/beta-gates.json` blocked.

Detailed evidence: `integration/reports/HVI-G2.md` and `proofs/G2/G2-RECEIPT.json`.

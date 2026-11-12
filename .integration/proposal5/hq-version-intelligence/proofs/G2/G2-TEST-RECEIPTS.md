# G2 test execution receipts — synthetic-only / not runtime accepted

**2026-11-12. Status:** `REPAIR_REQUIRED`, `PREPARED_NOT_PROMOTED`. The environment diagnostic exits below are NOT G2 test process exits.

| Command or check | Environment / observation | Actual exit | Acceptance |
|---|---|---:|---|
| `node --version` | Isolated Linux container, `v22.16.0` | **0** | Infrastructure check only; required Node24 unavailable |
| `git ls-remote https://github.com/owenservera/ARBOR.git HEAD` | Isolated container DNS `Could not resolve host: github.com` | **128** | Connectivity check only; no clone/read of repository content |
| GitHub Actions run [43315512755](https://github.com/owenservera/ARBOR/actions/runs/43315512755) on `bc644e2e3314ed80a3f9891695d8ad4798cee6b9` | `startup_failure`, jobs=0 | **null** | Test runner never started |
| Connected GitHub six-source V8 transformed module parsing | Six fetched G2/Host/TierFlow source/test blobs accepted by JS parser, not Node ESM loader | **null** | Static transformation/syntax-only |
| Synthetic injected V8 bridge + TierFlow projection | **12 assertions executed / 12 passed**: grant checks, revocation before return, digest mismatch, redaction, bounds, U display projection, disabled live UI. Noncryptographic test-double digest for deterministic smoke only | **null** | Isolated V8 smoke, NOT Node24, AJV or cryptographic proof |
| `node --test apps/vivim-host/test/hvi-capability.test.mjs` | **UNRUN** (no checked-out ARBOR source/Node24) | **null** | No runtime receipt |
| `node --experimental-strip-types --test packages/tierflow/tests/hvi-inspector.test.mjs` | **UNRUN** | **null** | No runtime receipt |
| `node --test tests/hq-version-intelligence/g2-host-ui.test.mjs` | **UNRUN**, authored 3-SHA + 5 invented-repo tests only | **null** | No runtime receipt |
| Combined G1 `tests/hq-version-intelligence/*.test.mjs`, strict AJV Draft2020-12, offline synthetic CLI replay | **UNRUN** | **null** | No runtime receipt |
| Canonical live Host NL action dispatch, real owner/session/revocable source grant, UiCore revision/CAS | **UNRUN**, disabled for safety | **null** | No live security acceptance |
| Windows, Bun/Cargo, physical PWA/Android, rollback drill | **UNRUN** | **null** | Beta/device scope unchanged |

Source blob identities for isolated V8 checks:
- `hq/version-intelligence/integration/host-inspector-projection.mjs` = `2a2eaf7e9fd23de6f2dc721b24a0ac585464ef00`
- `packages/tierflow/src/visual-runtime/knowledge/hvi-inspector.mjs` = `122105e966ffc4574402b09da62ea669d38d4ca8`
- `apps/vivim-host/control/hvi-capability.mjs` = `e4deec0c3b39e827fc5d519ffdee99337bf16848`
- `packages/tierflow/src/visual-runtime/render/hvi-inspector.mjs` = `afbe2a55e531e4de3379f536f4a0d91fb0e66ab9`
- `tests/hq-version-intelligence/g2-host-ui.test.mjs` = `f0866be4cf1c5ed546f54849dce095db5dbc9998`
- `packages/tierflow/tests/hvi-inspector.test.mjs` = `f8a1707d154bb9d94824e03f5153b1131521ba60`

No actual ARBOR/VIVIM/Labs or donor-repository comparison was performed. Next owner must run checked-out Node24 tests with injected **invented** Git fixtures on a functioning approved runner and record SHA, OS, commands and literal exits. No main merge or readiness gate before independent evidence review.

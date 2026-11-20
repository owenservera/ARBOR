# File: integration/reports/HVI-G2.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | integration/reports/HVI-G2.md |
| Language | Markdown |
| Kind | doc |
| Size | 25322 B |
| Lines | 140 |
| Hash | bd17c963dfd5 |
| Test | no |
| Generated | no |
| Component | integration |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

````markdown
> **MAIN DRIFT RECONCILED AFTER INITIAL STAGING (2026-11-12):** Concurrent ARBOR main PR #23 advanced main from `3d45fbf1c3963e4834a5e51ee7f6e63f3a0da298` to `9b79d732da8b92713d399040db4a02d505bc7cf1`. Compare identified 11 paths all under `.integration/proposal5/rescore-expansion/**`, none touching HVI. A two-parent, no-force integration-branch merge `08abdd1f71471fa9d87ab89c3c46c449ff9d9b52` preserved new main's exact blobs and staged G2 source. No main write by this worker. See `.integration/proposal5/hq-version-intelligence/proofs/G2/MAIN-DRIFT-RECONCILIATION.md`. This does **not** change the `REPAIR_REQUIRED` gate or make G1 accepted.

# ARBOR Proposal 5 — HVI G2 serial integration (NATIVE TOOLING ONLY)

**2026-11-13 decision:** `REPAIR_REQUIRED`. **Status:** `PREPARED_NOT_PROMOTED` / `HVI_TOOLING_INSTALLED_NOT_VERIFIED` on the G integration branch only. **NOT** `GO_FOR_READINESS_REVIEW`, `HVI_TOOLING_READY`, real-repo audit, runtime security acceptance or beta GO.

The executable-evidence blocker that made every earlier G2 receipt read `UNRUN` is now closed with real receipts from a checked-out Node 24 runner. The gate itself remains `REPAIR_REQUIRED` for the reasons in the blocker table — not because the tests never ran.

## Authority and exact bases
- Repository: `owenservera/ARBOR`; work branch: `integrate/p5-hq-version-intelligence-r001`.
- G1 candidate source parent: `69447c09f420310aa84c24a1908dede91c963ec8`.
- `main` observed: `9b79d732da8b92713d399040db4a02d505bc7cf1` (unchanged since the G2 staging merge; `main` is the merge base of this branch, so the branch is 0 behind and no main drift needed reconciling).
- H final source head `d24daa9966abb222cd25210f41dcbb4758aa1209`: seven files staged in commit `546132d92639af78f70d398c8a5a86d5d6a64738`.
- U final source head `5836e9c9f5ba3bee36dbe6896ebfd22364b4c450`: eight files staged in commit `4bb70bfbadc9b35f13b36232b44044c16900976c`.
- Z2 independent proof head `725132c640a1f21d3af5c4b9123b314e4df3133d`: five proofs staged in commit `9aac22f151e89ea7554ef7ee5cc65b30e5b34e21`. Z2's actual gate is `REPAIR_REQUIRED`, NOT `GO_FOR_G2_TOOLING_REVIEW`.
- H/U forked common W2 owner-waiver candidate `bbe7e4896eea02bcdec6f8fedb66eab885250161`; final G1 changed one documentation/report commit beyond this point. No old pinned source or worker branch reset, no X audit import. X remains DEFERRED.

## G2 reconciliations actually committed
1. Corrected U synthetic test's incorrect expectation of more than four *direct* canonical root children; TierFlow groups sections. `packages/tierflow/tests/hvi-inspector.test.mjs`, commit `535293ae94626a8b78617803a51ff7b8a2a8f950`.
2. Added a new **pure derived projection, not a source store or authority**, `hq/version-intelligence/integration/host-inspector-projection.mjs`. It verifies G1 comparison envelope and digest, bounds rows, redacts secret-looking paths, retains original digest provenance while recomputing a distinct derived digest, rechecks each pinned source grant before and after projection. Initial commit `9713499f86bfb4ce8f7069ccd876deb06ed22d4d`; regex fix `2acc4fb69dcdc21e4403ffc4b909d83aaecaf88f`.
3. Existing H local read port now returns one sanitized, grant-rechecked H→U typed inspector DTO alongside its read-only summary; `apps/vivim-host/control/hvi-capability.mjs` commit `cd6764ab291157dbeca5ac0923b662341ac932a4`. Canonical Host catalog action `versions.compare.pinned` remains **enforcement_missing / null executor**; see the blocker table for why it is not promoted.
4. TierFlow inspector requires an explicit trusted fixture marker in addition to the existing synthetic preview flags; prevents treating arbitrary output as a synthetic fixture. `packages/tierflow/src/visual-runtime/render/hvi-inspector.mjs` commit `c9092d8bab26de270113cc7a2895c71cea2229b9`, corresponding U synthetic test fixture change `0539d23404ef5b1de12ad646d807a2fda57c6ab6`. **Live rendering still disabled.**
5. Added synthetic Host→U tests in `tests/hq-version-intelligence/g2-host-ui.test.mjs`: three immutable SHA pins in one invented repo; five independent invented repos; current-grant/refusal/revoke, metadata redaction, typed DTO, non-publisher and no-effects. Commits `8dcbc05695c7f2262157de684189c7db4bfabc46` and `bc644e2e3314ed80a3f9891695d8ad4798cee6b9`.

## Second G2 pass: defects only an actual run could find (2026-11-13)

The HVI suites had never executed on a real Node 24 runner, so several authored tests carried assumptions no run had ever falsified. Commit `4a26e641445c89256a900768300b88f62c3c6578` repairs them:

1. **`hq/version-intelligence/identity/index.mjs`** — `seen.values()` returns a Map *iterator*, so `.sort()` threw a `TypeError` and every identity crosswalk carrying decisions crashed. Spread it, matching the `[...uniqueEdges.values()]` pattern already used three lines below. This was a real engine defect, not a test defect.
2. **`tests/hq-version-intelligence/g2-host-ui.test.mjs`** — asserted `originalComparison.sourcePins[0]` was the first *requested* revision. The C comparison envelope is canonically ordered by `pinId` (`compare/index.mjs` `cleanPins = ordered(...)`), and that ordering is what keeps `reproducibilityDigest` stable across differently-ordered requests. The assertion is now order-independent and additionally pins the canonical ordering, so it is **stronger** than before.
3. **`apps/vivim-host/test/hvi-capability.test.mjs`** — each negative case replaced `sources` with fewer than three entries while `req()` kept `targetIndex: 2`, so the targetIndex range check fired first and masked the code under test; the first case was passing for the wrong reason. `targetIndex` is now explicit per case, and the secret-subpath, unapproved-repo and moved-SHA cases genuinely assert `SCOPE_ESCAPE`, `SOURCE_UNAUTHORIZED` and `PIN_MOVED`.
4. **`packages/tierflow/tests/hvi-inspector.test.mjs`** — counted every node naming the repo, but the target-relative coverage rows legitimately repeat the repo label. It now counts the pin **selectors** (`SOURCE`/`TARGET` prefixed), which is what the test name asserts, and separately asserts the coverage-row count.
5. **`hq/lib/schema.mjs`** — a failed `openDb` leaked the sqlite handle: the caller never receives the `db` object, so nothing could close it, and the file stayed `EBUSY`-locked on Windows, breaking disposable-index cleanup. The handle is now closed on the failure path. **Pre-existing on `origin/main`** (proved by a baseline run of the same suite at `9b79d73`), and required for the HQ boundary suite to pass.
6. **`hq/test/arbor-service.test.mjs`** — omitted the now-mandatory `mode`, so the case failed at construction instead of exercising the source-root denial. Also pre-existing on `origin/main`.
7. **`.gitignore`** added — the repository had none, and `npm install --prefix tests/hq-version-intelligence` puts `node_modules/` inside a tracked package directory, which `git add -A` would otherwise have committed.

## Second G2 pass: native registration, grant and revision (2026-11-13)

Commit `a256611b9375bbed1c657393f2ff034e278b8bed`:

1. **Native HQ capability discovery and invocation** — `hq/lib/mcp.mjs` registers `hvi_compare_pinned` in the existing MCP tool list, so the capability is discoverable through `tools/list` and invocable through `tools/call`. `tools/call` is awaited (`mcp.mjs:322`), which is what makes the async HVI engine reachable at all: the Host control plane is synchronous by construction (`dispatcher.mjs` contains no `async`/`await`/`Promise`), so an async executor there would store a Promise as the result, serialise to `{}`, escape the receipt `try/catch` as an unhandled rejection and turn the `uncertain` outcome into a false `applied` after the effect fence was already claimed. The tool is synthetic-only in this wave: every source repository identity must start with `synthetic/`, exactly like the operator CLI gate, and the result carries `provenance: 'SYNTHETIC_ONLY'` and `runtimeAccepted: false`.
2. **Revocable, expiring development-source authorization** — `apps/vivim-host/control/hvi-source-grant.mjs`. The grant names **which** repositories the owner authorised and **for how long**, and can be revoked. It reuses the existing bootstrap ledger `meta` store and the existing bounded-grant vocabulary (`readGrant`/`writeGrant`/`grantExpiryMs`/`GRANT_MAX_EXPIRY_MS` from `bootstrap/service.mjs`): no new store, no new authority, no new endpoint, no scheduler. Evaluation order is fixed and matches the house order — revoked → not granted → expired → repository scope — and absence, expiry and revocation all fail closed. An absent or unreadable expiry is treated as expired, because this grant type has no legacy unbounded form. Revocation writes a tombstone under its own key, so `HVI_SOURCE_GRANT_REVOKED` stays distinguishable from `HVI_SOURCE_GRANT_REQUIRED`. The grant authorises **repositories, not identities**: who the caller is stays the Host owner's business, and a valid owner session alone never grants repository access.
3. **UI revision verification** — `apps/vivim-host/control/hvi-capability.mjs` now **observes** the current UI revision from the canonical owner (`runtime.uiRevisionStatus()`) instead of taking it from the caller. The request schema is closed and carries no revision field, so no caller can claim one; the observed revision travels with the result as `uiRevision`. A failing observer fails closed. The registration guard now reads readiness from the catalog instead of hard-coding `enforcement_missing`, and still refuses a `verified` row (which asserts live Windows Host and paired-phone receipts this branch does not hold).
4. **Docs** — `hq/version-intelligence/integration/AGENT-USAGE.md` corrects eight stale or missing claims, including that `runHviTool` is async and every failure is a promise rejection. `apps/vivim-host/control/hvi-native-guide.json` now states the three registrations and what remains pending.

### What is deliberately NOT wired, and why
The canonical Host action `versions.compare.pinned` stays `readiness: enforcement_missing` with a **null executor**. The Host control plane is synchronously fenced by design and the HVI engine is async; promoting the row to `source_wired` would make the catalog claim an executor that cannot run the analysis, which the catalog's own glossary defines as "Host dispatcher executor exists **and offline tests pass**". The exact remediation options, and the files each touches, are in the blocker table. The native HQ registration above is what makes the capability discoverable and invocable by an agent today, without inventing a second executor.

## Canonical test gate (2026-11-13)

ARBOR previously had **no canonical testing system** at all. The intelligent impact-aware runner in the original workspace (`repos_hq scripts/test-smart.mjs` + `scripts/lib/test-selection.mjs`) is Bun-only and discovers only `hq/test`, so it cannot run ARBOR's Node 24 + AJV HVI gate and cannot see most of this repository's tests. Commits `d12aa2c`, `77fc1bc`, `962ba96`, `997eff0` add the ARBOR-native equivalent under `scripts/`, to the same invariants:

- **Unknown or uncovered changes fail closed to the full suite.**
- **A cached proof is never granted for a failed or interrupted run.**
- **Local only** — the proof cache lives under the gitignored `.hq/test-cache/`.
- **No network, no provider API, no browser, no personal corpus.**

What it adds over the original runner:
- **Multi-root discovery: 271 tests** across `hq/test`, `apps/vivim-host/test`, `apps/mobile-relay/test`, `tests/hq-version-intelligence`, `packages/tierflow/tests`, `tests/compatibility`, `tests/privacy`, `harness/test` and the nested suites. The original runner saw 51.
- **A committed manifest** (`scripts/test-manifest.json`) declares each test's runtime and gate, so selection and receipts are driven by data rather than by filename convention.
- **A real per-test runtime matrix**, derived from the transitive import closure: `bun` when anything in the closure imports a `bun:` module, `node-strip-types` when anything in the closure is or imports TypeScript, `node24-ajv` otherwise — 193 / 32 / 46 respectively. The TierFlow inspector is `node-strip-types` because the `.mjs` it imports pulls in `.ts`; a first-pass detector that looked only at the test file's own imports got that wrong.
- **A real transitive static import-graph dependency closure**, so impact selection actually narrows instead of always failing closed to everything.
- **Per-gate and per-run machine-readable receipts** carrying the command, OS, tool versions, commit SHA, test totals, exit code and duration.
- **Gates that mirror the canonical CI contract file-for-file**: `hvi-g1-g2` (6), `hvi-host-read-port` (2), `hvi-discovery` (1), `hvi-hq-boundary` (3), `hvi-tierflow-inspector` (1), `hvi-modules` (6) — 19 files that are exactly the HVI surface. Broader suites are `host-suite`, `hq-suite`, `interop`, `compatibility`, `uncategorized`.

### Observed gate behaviour (all three invariants verified by execution)

| Property | How it was proved | Observed |
|---|---|---|
| Impact selection narrows | touched `hq/version-intelligence/identity/index.mjs`, ran `--plan` | 6 of 271 selected, each naming the changed file |
| Unknown change fails closed | added `hq/lib/__probe_uncovered__.mjs`, ran `--plan` | all 271 selected, reason `fail-closed: uncovered change …` |
| No proof for a failure | broke `g1-v2-schema.test.mjs`, ran the gate | exit 1, `70 pass, 1 fail`, cache written with **0 entries** |

### Canonical gate command

```
bun scripts/test-gate.mjs --no-cache \
  --gate hvi-g1-g2 --gate hvi-host-read-port --gate hvi-discovery \
  --gate hvi-hq-boundary --gate hvi-tierflow-inspector --gate hvi-modules
```
````

_First 80 of 141 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

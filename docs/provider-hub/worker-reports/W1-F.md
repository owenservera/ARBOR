# Provider Hub R002 — W1-F seeded source simulators

**Lane status:** SOURCE_PREPARED / MOCK_ONLY; focused synthetic tests PASS in a local byte-identical mirror; NOT ARBOR_SOURCE_WIRED, NOT LIVE_VERIFIED.  
**Target:** `owenservera/ARBOR`  
**Branch:** `work/provider-hub-W1-F-r001`  
**Pinned starting SHA:** `e0c510712b7e93c9f2e8d0c4991b06dc0b6c92c0` (ARBOR `main`, 2026-11-13 13:44:39 UTC)  
**Accepted W0 gate:** **NOT FOUND** in ARBOR branch list / `docs/provider-hub` at execution time. This branch is intentionally **provisional from main**; G MUST re-pin/reconcile against a subsequently accepted W0 source-lock before integration. No W0 acceptance is asserted.

## Source truth inspected (actual ARBOR main)

| Existing owner source | Blob SHA | Verified source behavior / limitation |
| --- | --- | --- |
| `.integration/proposal5/README.md` | `603539b3695cb72ef1fb32fb74501e4809edfd11` | One self-contained ARBOR, Host owns grants/effects/World; architecture proposal is not runtime acceptance |
| `.integration/proposal5/foundations/FOUNDATIONAL-ARCHITECTURE.md` | `fbed362c00d771350a50fc2654546048292cd4ed` | Host effect boundary and Studio data-only learning; future architecture is not already wired |
| `apps/vivim-host/control/dispatcher.mjs` | `723865482b8a0f98ab3214b2ec6a83aaea629c43` | `createControlDispatcher` owns plan/approval/claim/receipt; never let fake source send |
| `apps/vivim-host/control/journal.mjs` | `b9739a00c8345a0513dba32ddc0361e96bb9b16f` | Claimed without receipt = `uncertain`, no re-execute |
| `apps/vivim-host/control/action-catalog.v1.json` | `770feb4f66497fb8c5d0a9396d1e24fb14162a96` | Existing Host fixed action catalog; simulator adds no action IDs |
| `studio/src/studio/adapter-factory-service.mjs` | `9449caee531b4703fbf9dd7edd852f8a7bca3c97` | `learnedAdapterFromCandidate` is read-only; learned selectors cannot send |
| `studio/src/studio/adapter-accepted-session.mjs` | `b4cc8d81056548af1c4ae3610542b48d4d2d5294` | Accepted DOM turns are scoped; account binding remains caller-scoped-unverified, not a generic social account identity |
| `studio/src/studio/world-service.mjs` | `6df7bc873b03b90bcea37410c2526c2e75ece0f7` | Existing World routes use Host journal / Studio state; not evidence of fully migrated social provider World |
| `studio/src/studio/world-control-lineage.mjs` | `1a45090b53dee48677056fd18460f247ba91caa2` | Read-only Host metadata projection, not authority |
| `harness/src/providers/index.mjs` | `b814174d3ba8f997c9e6dd8ad5369a6ac5d5f12d` | AI chat model/webapp profile registry, NOT social/messaging Hub registry |
| `apps/mobile-relay/sw.js` | `d717d5e6669f31d604b23a5bd5b9648c17a7cb5d` | Shell-only cache; no offline effect replay |

Root `AGENTS.md`, `docs/provider-hub` and `apps/vivim-host/provider-hub` were absent on main at the pinned SHA. Labs R002 README/architecture/manifest were read; their operations are **proposed ports**, not an existing running API.

## Owned changes and immutable source evidence

- `apps/vivim-host/provider-hub/mock/seeded-source.mjs`: `createSeededStudioSourcePort`, `createSeededClock`, `mockAccountContext`, `mockReceiptMarker`; Git blob `98c3583ce4ba77698886a019df448eba5532cf6b`.
- `apps/vivim-host/provider-hub/mock/seeded-source.test.mjs`: focused Node built-in `node:test`; Git blob `8b43f99753a2695384a61c146648f652a430097e`.
- This report: `docs/provider-hub/worker-reports/W1-F.md`.

**Code commit (source + tests):** `bb13ef45c1a1f2d64876a03febda2ab4bed14ae0` (parent includes source commit `4bad0611e6f931773920d0298da5ee2769470e6e`). Final report commit is the current Lane F branch tip, to be resolved by G; no self-referential SHA claim.

### Stable boundary and data

The read-only port is `vivim.provider-hub.mock-source/1` and returns source-linked, copy-isolated, bounded pages (`listStreams`, `readThread`, `readUnit`, `search`). It has **no** `send`, `execute`, permission-grant, network, browser, graph, or durable World writer. An explicit `mode: 'MOCK_ONLY'` is compulsory; there is no fallback from live to mock. All records include `synthetic://` source/account/thread IDs, original/mock provenance digest, world/principal, revision, observed/occurred time, coverage and privacy classification. Synthetic seed: 10 services × 2 fake accounts × 3 units = **60 invented units**. Data includes literal adversarial source text that is never evaluated.

Scripted deterministic source outcomes include OFFLINE, RATE_LIMITED, LOCKED, CORRUPT_EXPORT, SESSION_REVOKED, PARTIAL_UNAVAILABLE and UNCERTAIN. The fake clock has no timer or OS side effects; account epoch changes and source revocation invalidate reads and old cursors. Messenger/WhatsApp E2EE gaps return `content:null`, not invented text. `MOCK_RECEIPT` is a **diagnostic marker**, never a Host receipt, approval or proof of delivery; `APPLIED` is explicitly refused.

## Actual verification

Environment: ephemeral local Node **v22.16.0**, synthetic mirror under `/mnt/data/laneF/mock`. Git blob SHA for each remote file was compared to `git hash-object` of the exact locally tested file, and **both matched**.

| Command run | Actual exit | Actual outcome |
| --- | --- | --- |
| `node --check /mnt/data/laneF/mock/seeded-source.mjs` | **0** | Syntax valid |
| `node --check /mnt/data/laneF/mock/seeded-source.test.mjs` | **0** | Syntax valid |
| `node --test /mnt/data/laneF/mock/seeded-source.test.mjs` | **0** | 5 tests passed, 0 failed |

Tests cover 10/10 seeds, pagination repeatability, bounded source reads, clone isolation, cross-world denial, account swap, old cursor refusal, origin mismatch, unavailable source, E2EE null body, prompt injection as inert content, external-effect refusal, no effect methods, five deterministic fault outcomes, fake clock, uncertain marker and refusal to mark applied.

**UNRUN**: `node --test apps/vivim-host/provider-hub/mock/seeded-source.test.mjs` from a full ARBOR checkout; root Bun/Cargo gates, W1-A validators, B Hub core service integration, C World grants, D action port, E graph port, Studio/PWA UI routes, Windows package, paired device and any real provider session/read/write. Connected GitHub cannot execute the full remote repository test suite. No LIVE_READ_VERIFIED, LIVE_WRITE_VERIFIED or DEVICE_VERIFIED claim.

## Duplicate authority and external-effect inspection

Only two new `.mjs` files and this report are owned by F. No new Host/World, second journal, Chrome actor, AI provider registry, TierFlow publisher, graph store, phone application, root manifest or provider API integration. No `fetch`, socket, filesystem writes, credentials, contact data, cookies or real sends. `setObservedSourceState` changes **only the in-memory fake observation**, never a Host grant.

## Blockers / G handoff (serial, explicit)

1. **HARD INTEGRATION BLOCKER — W0 accepted gate missing** when this branch was created. G must inspect/reconcile exact accepted W0 gate SHA, ensure source-lock compatibility and cherry-pick/rebase safely without touching other workers.
2. **W1-A versioned contracts not yet accepted:** map `vivim.provider-hub.mock-source/1` fields to the final `StudioSourcePort`, `StreamEnvelope` and `AccountBinding` validators, or have G specify a small serial adapter patch outside F ownership. Do not publish the provisional types as canonical.
3. **W1-B ProviderHub injection:** G must wire an **explicit mock-only injected SourcePort** through the existing Hub-facing read handlers, never let Studio/PWA import fixtures directly and never silently fall back in LIVE mode. The fake methods are synchronous deterministic returns; G can wrap with `Promise.resolve()` if the final service is async.
4. **W1-C Host/World authority:** gate the source behind real Host context/grants/freshness where available; F's fake principal/account/epoch check is synthetic defense in depth and does **not** authenticate a real owner.
5. **W1-D action + W1-E graph:** treat `mockReceiptMarker` as pure diagnostic data only, never as a Host journal or effect receipt. Action plans and graph changes stay inert until their existing owners admit them.
6. **W2/W3/W4 normalization:** map kind vocabulary and coverage semantics; missing E2EE content stays unavailable, IDs stay source-qualified; preserve cursor/account epoch and dedup proofs. Verify 10-provider schema compatibility against later packs.
7. G must rerun `node --test apps/vivim-host/provider-hub/mock/seeded-source.test.mjs` in an actual ARBOR checkout, test Hub consumers/negative cases and record real process exits. No readiness promotion without those outcomes.

**Proposed G decision:** **GO_FOR_G_RECONCILIATION / NO_GO_FOR_LIVE / BLOCKED_FOR_W1_INTEGRATION_UNTIL_W0_AND_CONTRACTS**. The mock source is code-prepared and locally tested, not end-to-end wired.

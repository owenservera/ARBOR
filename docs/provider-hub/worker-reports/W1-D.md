# ARBOR Provider Hub R002 — W1/D worker report

**Lane:** W1/D — fake Host action boundary  
**Disposition:** SOURCE_PREPARED_MOCK_TESTED; **G decision: CONDITIONAL / BLOCKED until W0-G accepted gate is established**  
**Repository/branch:** `owenservera/ARBOR` / `work/provider-hub-W1-D-r001`  
**Provisional base SHA:** `e0c510712b7e93c9f2e8d0c4991b06dc0b6c92c0` (ARBOR `main`, 2026-11-13)  
**Source commit SHA:** `07326f0bbb48da0950650283a644891b4e2a938d`  
**Report commit:** this branch's subsequent HEAD; resolve GitHub branch ref (self-referential SHA cannot be embedded in the committed report).

## Source truth and prerequisite discrepancy

At lane start, ARBOR main matched Labs `SOURCE-PINS.json` SHA `e0c5107...`. GitHub had **no** `integrate/provider-hub-r001` branch, `docs/provider-hub/gates/W0-G.md`, or accepted W0 gate head visible; root `AGENTS.md` and `apps/vivim-host/provider-hub/` were absent on main. Other lanes were already independently creating worker branches. W1/D was started from exact `main` only as **provisional isolated work**, because waiting for other workers was prohibited; this does **not** satisfy the requested accepted-W0 base and must be reconciled by G. No main merge or shared integration branch update was performed.

Inspected these source-owned authorities and program contracts:
- `apps/vivim-host/control/dispatcher.mjs` (blob `723865482b8a0f98ab3214b2ec6a83aaea629c43`): `createControlDispatcher().plan/execute/status`, digest/expiry/catalog checks, owner approval, journal claim fence and uncertain handling. It is the **sole existing Host effect admission**, not a provider-hub social send service.
- `apps/vivim-host/control/journal.mjs` (blob `b9739a00c8345a0513dba32ddc0361e96bb9b16f`): exclusive plan/approval/claim/receipt entries; a claimed-but-unreceipted action is uncertain and never retried.
- `apps/vivim-host/control/action-catalog.v1.json` (blob `770feb4f66497fb8c5d0a9396d1e24fb14162a96`): Host catalog readiness/executor authority. No W1/D catalog edits.
- `.integration/proposal5/README.md`, `09-EXECUTION-PLAYBOOK.md`, `foundations/FOUNDATIONAL-ARCHITECTURE.md` and Labs R002 `README.md`, `03-ARCHITECTURE-AND-MOCK-PORTS.md`, `04-EXECUTION-PROTOCOL.md`, `05-ACCEPTANCE.md`, `WAVE-MANIFEST.json`, `SOURCE-PINS.json`, W1/D and W0/G prompts.

**Classification:** existing Host dispatcher and journal = SOURCE_PRESENT; social-provider dispatch = NOT_IMPLEMENTED; this lane's injected fake port = MOCK_ONLY; verified provider interactions = UNRUN.

## Changed paths (all within W1/D authorization)

1. `apps/vivim-host/provider-hub/ports/actions/mock-host-action-port.mjs` — blob `3f06cddcfe16cc40ed2d599c86b9999a00944839`: versioned four-method injected port `proposeAction/readback/approve/actionStatus`. Exact principal/World/provider/account/epoch/grant/revision/recipient/thread/draft/attachments binding. Inert SHA-256 plan/review digests, 10-min plan expiry, scoped idempotency, mocked readback and explicit mocked desktop decision.
2. `apps/vivim-host/provider-hub/ports/actions/mock-host-action-port.d.ts` — blob `d51350bba7e2095d79cb8e982723c523a515cf95`: TypeScript mirror of provisional v1 port and mock receipt types.
3. `apps/vivim-host/provider-hub/ports/actions/mock-host-action-port.test.mjs` — blob `3a36b1963b88696022ba6af60988c2f675e48679`: 13 deterministic Node built-in tests with seeded clock, all-synthetic IDs, fake Host snapshots and scripted outcomes.
4. `docs/provider-hub/worker-reports/W1-D.md` — this report.

No files were edited in other workers' scopes; root `package.json`, Host catalog, dispatcher, journal, World, Studio, mobile-relay, Graph and `main` remain untouched.

## Test evidence — actual local execution vs unrun

Source and test **GitHub blob SHAs equal the locally executed files** (verified by `git hash-object` and connected `fetch_file` after push).

| Command / environment | Exit | Observed |
| --- | --- | --- |
| `node --check /mnt/data/provider-hub-W1-D/apps/vivim-host/provider-hub/ports/actions/mock-host-action-port.mjs` | **0** | Parser check passed |
| `node --test /mnt/data/provider-hub-W1-D/apps/vivim-host/provider-hub/ports/actions/mock-host-action-port.test.mjs` | **0** | **13 passed, 0 failed, 0 skipped**, ~91ms, Node v22.16.0 Linux isolated lane checkout |
| `git hash-object` on three local owned files compared to GitHub file blobs | **0** | Exact blob identity for source, tests and declaration |
| Full ARBOR Host suite, Bun workspace, Cargo/native suite | **UNRUN** | No full ARBOR workspace/runtime checked out; no blanket test claim |
| Windows Host, live provider webapp, approval via authenticated desktop/phone, network/E2EE and physical PWA | **UNRUN** | No credentials/browser/phone/device used |

Focused tests include: proposal/readback/explicit mock approval, mismatched digest, model or phone approval refusal, account/principal/World/epoch swap, recipient/thread/draft swap, grant revocation/rotation, privacy hard-no, offline/unsupported, idempotency conflict, expiry, owner denial, injected source/secret fields, replay, thrown/partial/unknown outcomes and fail-closed missing mock dependencies.

## No-duplicate-authority and no-effects proof

- Only Node `node:crypto` imported; **no fetch, browser, shell, provider API, filesystem, Host executor invocation, graph or database**. No `send` or `execute` API is exposed.
- `hostSnapshot`, `now`, `mockOutcome` are mandatory **injected fakes**. The private Map is ephemeral deterministic fixture state, **not** a durable Host journal or permission owner.
- All mock refs use `synthetic://`. Every receipt is `vivim.provider-hub.mock-receipt/1`, `MOCK_RECEIPT`, `MOCK_ONLY`, `externalEffectPerformed:false`, `liveVerification:UNRUN`; even `status:applied` means a *simulated* result only.
- A claim is simulated exactly once; scripted crash, partial or unknown outcome becomes immutable `uncertain`, never automatically replayed. A repeated approval returns the existing fake receipt.
- Fake actor `mock-owner` and desktop approval string **are not authentication** and must never be treated as trusted production proof. Learned Studio read adapters cannot enter this action pathway.

## Blockers / G serial handoff

1. **P0 base:** W0-G accepted gate SHA was absent. G must establish/verify the accepted baseline and safely cherry-pick or rebase this isolated commit without overwriting source changes. Branch is not merge-approved.
2. **Cross-lane contract:** W1/A owns `contracts/provider-hub/v1/**` and W1/B owns the canonical Hub service. G must reconcile field IDs, enum labels, API signatures and validators. No edits to those owners are authorized here. Treat this local `.d.ts` as provisional, not a competing authority.
3. **Fake World / Host:** W1/C must provide the injected source-of-truth identity, grant, session and privacy snapshot shape. This lane intentionally has no real Host auth or durable claim. G must wire the fake only through the canonical Hub service after schema convergence.
4. **Live action adaptation (future, separate gate):** Do **not** promote fake `approve()` to a real send. Only the existing `apps/vivim-host/control/dispatcher.mjs` may admit effects, using its journal and a verified, exact account/thread/recipient/draft Host binding; source-verified Studio browser executor and any catalog update are serial Host-owner/G changes. Unsupported until proven.
5. **Execution:** full root/Host tests, physical Windows/phone, real account, E2EE and provider delivery outcomes remain UNRUN.

**Proposed G decision:** `SOURCE_PREPARED_FOR_SERIAL_RECONCILIATION`; do not issue `LIVE_VERIFIED` or W1 integration GO solely from these tests. On a real accepted W0 base, G checks scope, reconciles A/B/C contracts, runs cross-lane tests, and records a truthful gate. This branch is safe for mock-only review, **not** for live authorization or provider send.

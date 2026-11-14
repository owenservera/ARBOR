# Provider Hub WorldPort v1 — W1/C

**Status: MOCK_ONLY / NOT WIRED.** This is a versioned interface and deterministic in-memory fake for a **future injected adapter to the existing ARBOR Host World**, not a separate durable World. world-port.mjs validates strict input, world-port.d.ts declares the boundary, and fake-world-port.mjs supplies createFakeWorldPort({grants,clock}) => {port,scenario}. Inject only port; scenario is synthetic test control and must never be exposed on Host routes or UI.

## Invariants

- Evidence only: synthetic source ref/revision, SHA-256 digest, observation time, coverage/gap codes. No user content, cookies, credentials, contacts, provider network, browser, graph writer, effect sender, grant issuer or disk storage.
- Exact world/principal/provider/account/epoch/origin/grant/scope binding, expiry and per-read recheck; account swap, refusal and revocation invalidate cached projections.
- All receipts are explicitly MOCK_RECEIPT and MOCK_ONLY, with distinct MOCK_APPLIED, PARTIAL, DENIED, NOT_FOUND and UNCERTAIN. They never certify provider delivery or authorize Host actions.
- In-memory compare-and-swap revisions, per-world evidence dedup, intent idempotency, no retry after injected uncertain claim, bounded page reads and storage.
- No fallback from a failed live binding to the fake. No second personal World, Host dispatcher, journal, phone application, TierFlow publisher or graph store.

## G serial integration handoff

1. Reconcile W1/A canonical schemas and W1/B service with this v1 port; suggested injection shape: createProviderHub({worldPort:port,...}). This is a **proposal**, not an existing ARBOR API.
2. Real World mapping must call existing Host owner/World grants immediately before every read/commit; route durable evidence and receipts through the one Host writer. Do not promote mock grant fixtures or MOCK_APPLIED to live outcomes.
3. Reconcile W1/D claimed/uncertain action receipts and W1/E scoped graph proposals without a new authority. G alone may edit shared source paths and manifests.
4. The accepted W0 G gate and integrate/provider-hub-r001 head were absent at lane start; this branch was conservatively based on pinned ARBOR main. It is source-prepared, not authorized for promotion until G reconciles that base.
5. Tests: node --test apps/vivim-host/provider-hub/ports/world/fake-world-port.test.mjs. No Host, Windows, paired phone or live-provider acceptance has been performed.

See docs/provider-hub/worker-reports/W1-C.md for exact source pins, test exits, blockers and G gate decision.

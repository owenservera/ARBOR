# W1 Lane B — Hub registry and service (R002)

**State:** SOURCE_PREPARED / NOT_INTEGRATED / NOT_LIVE_VERIFIED  
**Target:** owenservera/ARBOR  
**Branch:** `work/provider-hub-W1-B-r001`  
**Starting SHA:** `e0c510712b7e93c9f2e8d0c4991b06dc0b6c92c0` (observed current main; **not** an accepted W0 gate)  
**Code commit:** `705220f2241b5e969bb714c8731d9c1c0211178a`  
**Test commit:** `5c317568d71874a20022ba89d65cf49aefa6561d`

## Source inspected

- ARBOR `apps/vivim-host/control/dispatcher.mjs`: existing Host-only plan/approve/claim/receipt fence; social Hub does not call or replicate executors.
- ARBOR `apps/vivim-host/server.mjs`: current Host HTTP owner; no Hub HTTP endpoint added outside scope.
- ARBOR `harness/src/providers/index.mjs`: AI chat profile registry, explicitly not reused as a social provider backend.
- ARBOR `apps/vivim-host/package.json`: Node ESM and `node --test` convention.
- ARBOR `.integration/proposal5/README.md`: one internal Host, World and effects owner, one PWA, no donor runtime.
- Labs R002 `execution-rounds/README.md`, `03-ARCHITECTURE-AND-MOCK-PORTS.md`, `04-EXECUTION-PROTOCOL.md`, `WAVE-MANIFEST.json` and W1/B work order.

ARBOR root `AGENTS.md` was not found at main. Expected `docs/provider-hub/gates/W0-G.md` was not found at main; branch search for `provider-hub` returned no accepted gate branch at execution time. Work began independently from pinned main as a **provisional worker branch**; G must reconcile against the actual accepted W0 SHA before integrating.

## Source changes (authorized only)

1. `apps/vivim-host/provider-hub/core/provider-hub.mjs`: `vivim.provider-hub/1`, `createProviderHub` with required injected source, World-auth and inert action ports; registered capability descriptors; per-call owner/world/account/epoch check; bounded cursor/limit/page results; list providers/streams, read thread, search, inert action proposal and receipt status.
2. `apps/vivim-host/provider-hub/core/provider-hub.test.mjs`: synthetic source and permission ports with refusal, wrong epoch, invalid cursor, oversized page, denied-data leakage, untrusted approval, unsafe action port, uncertain mock receipt and no live fallback.

No other lane path, shared catalog, manifest, server, browser controller, Rust graph or Host dispatcher was edited. No real provider, account, network, send, approval, grant writer or durable World call occurred.

## Tests and actual exits

- `node --test apps/vivim-host/provider-hub/core/provider-hub.test.mjs`: **UNRUN**, no exit code. Connected GitHub can commit source but does not execute tests; the separate runtime could not reach GitHub (DNS resolution failure), and no matched local checkout was available.
- ARBOR Host full suite, World/Studio/PWA integration, Windows and Android/PWA device acceptance: **UNRUN**.
- Static diff/source review: performed; not a substitute for execution.

Do **not** infer test pass from committed test cases.

## Known limitations and blockers

1. **W0 gate base missing:** no accepted W0 head verified. G must reconcile this worker branch with the ratified W0 base and re-check ownership.
2. **W1-A schema pending:** descriptor, context, action, receipt and paging fields are lane-local `vivim.provider-hub/1` drafts until versioned contract reconciliation. G must map field names, validators and refusal states to W1-A without weakening checks.
3. **W1-C/D/F ports pending:** deliberately injected interfaces, not plugged into World, Host action or Studio source. G must adapt contract-faithful mock and verified Host seams; no implicit fallback.
4. **No runtime test exit:** actual Node execution and integration remain required.
5. **Production truth:** no signed-in social source, live browser or send, actual owner approval, graph write, phone endpoint or end-to-end acceptance.

## G handoff

- Fetch branch head, compare exclusively authorized paths, and verify provisional base against accepted W0.
- Execute `node --test apps/vivim-host/provider-hub/core/provider-hub.test.mjs` from ARBOR root; capture exit and investigate failures.
- Reconcile W1-A validators and W1-C/D/F port shape serially. Host-owned World/dispatcher must remain sole authority. Add Host routes only under G-authorized scope; do not claim this service source-wired merely because importable.
- Validate negative cases: denial, account epoch change, unsupported capability, unknown provider, oversized page, refused approval and uncertain receipt. Confirm `MOCK_ONLY` is visible and live path never silently substitutes synthetic data.
- **Proposed decision:** `PREPARED_NOT_PROMOTED`; **NO_GO_FOR_LIVE**. Reconsider promotion only after W0 base reconciliation, contract integration and actual passing tests.

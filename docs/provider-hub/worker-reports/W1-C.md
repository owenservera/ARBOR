# ARBOR Provider Hub R002 — W1 Lane C worker report

**Lane:** W1/C fake future World port  
**Repository:** owenservera/ARBOR  
**Worker branch:** work/provider-hub-W1-C-r001  
**Base/start SHA:** e0c510712b7e93c9f2e8d0c4991b06dc0b6c92c0 (ARBOR main, rechecked unchanged)  
**Latest implementation/test commit before this report:** debad88e5813a136f4db679d0e0a0d63d5bf3c35  
**Disposition:** SOURCE_PREPARED_NOT_PROMOTED; G must reconcile the missing accepted W0 gate and contract consumers. NOT LIVE_VERIFIED.

## ERA 1 — Source-verified owner mapping

Read Labs execution-rounds README, 03-ARCHITECTURE-AND-MOCK-PORTS.md, 04-EXECUTION-PROTOCOL.md, 05-ACCEPTANCE.md, WAVE-MANIFEST.json, SOURCE-PINS.json and this W1/C work order. ARBOR AGENTS.md is absent at pinned main (404, checked). Inspected ARBOR .integration/proposal5/README.md, 09-EXECUTION-PLAYBOOK.md, foundations/FOUNDATIONAL-ARCHITECTURE.md and current source.

| Source at pinned main | Observed implementation, not proposal |
|---|---|
| apps/vivim-host/control/dispatcher.mjs | createControlDispatcher with plan/execute/status; journal-backed owner approval before effect. Existing action owner MUST remain sole effect dispatcher. |
| apps/vivim-host/control/journal.mjs | createControlJournal, exclusive approved/claimed/receipt files, claim-without-receipt => uncertain; no resend after claim. This is a durable owner; fake World MUST NOT duplicate it. |
| apps/vivim-host/bootstrap/service.mjs | createBootstrapService, readGrant, grantRefusal, claimGrantSend, grantBootstrap/revokeGrant via Host ledger. These bootstrap scopes are real code but are NOT verified social-provider World grants. |
| apps/vivim-host/bootstrap/runtime.mjs | createBootstrapRuntime, local ledger path and World scope; not a social-provider Host WorldPort implementation. |
| apps/vivim-host/conversations/studio-journal-evidence.mjs | createStudioJournalEvidence read-only evidence correlation; not an independent effect grant. |
| studio/src/intelligence/world-evolution.mjs | createWorldEvolution uses injected verifyOwner/verifyGrant/verifyEvidence and compareAndSave; a bounded source primitive, NOT proof that personal World is fully migrated or provider streams are wired. |
| harness/src/providers/index.mjs | ChatGPT/Claude/etc AI webapp profiles only; NOT Facebook/Messenger/WhatsApp social SourcePort. |
| .integration/proposal5/README.md / 09-EXECUTION-PLAYBOOK.md | Host owns personal World/effects and the self-contained ARBOR source paths; many proposed migration gates are not runtime evidence. |

**Gate observation:** No integrate/provider-hub-r001 branch, accepted W0-G head, or docs/provider-hub/gates/W0-G.md was found when starting or on later recheck. W0-A branch later appeared, but its existence is not acceptance. To follow the user's do-not-wait instruction without inventing a gate, C began from exact current main, isolated on its prescribed branch, and must be rebased/cherry-picked by G only after the W0 gate is established. No worker touched main.

## ERA 2 — Source and deterministic test outputs

Authorized changed source paths (all under apps/vivim-host/provider-hub/ports/world/):
- world-port.mjs: v1 strict validators for context/grant/evidence and injected WorldPort method shape.
- world-port.d.ts: typed WorldContext, WorldEvidence, GrantDecision, WorldPort and explicitly mock-only receipt.
- fake-world-port.mjs: volatile synthetic grants, revocation, account epoch switch, bounded metadata-only evidence commit/read, CAS, dedup and idempotent mock receipts.
- index.mjs: single public mock/contract surface, no Host side effects.
- fake-world-port.test.mjs: 15 negative/positive synthetic tests.
- account-isolation.test.mjs: explicit two-account anti-leak test.
- README.md: usage, exclusions, and serial integration contract.

**Stable boundary:** arbor.provider-hub.world-port/1; WorldPort methods checkGrant, commitEvidence, readEvidence, readReceipt. Fake is explicitly MOCK_ONLY and every response receipt kind is MOCK_RECEIPT. No real World authority is minted. Only synthetic:// references can cross this fake boundary; raw payloads, real URLs, secret fields or prompt-injected body keys are refused.

**Observed local test platform:** Linux container with Node v22.16.0. Tests executed against a local isolated exact-byte source copy, NOT an ARBOR checkout, GitHub CI, or live Host. GitHub blobs checked against local git hash-object SHA:
- world-port.mjs 9810217b60d2410e3c270bff099bcdfa30923a2b
- fake-world-port.mjs 46de6cd869bf70fcd030752d1988bf7fe40fa669
- fake-world-port.test.mjs 837248778147bd55072ead7763301df9fee66b26
- account-isolation.test.mjs 39799169c28fbe6daa63c057daaff9dc1f803d64
- index.mjs 601fc995c75b38158795114eebaef0f68a29ebf4

**Actual command:** node --test apps/vivim-host/provider-hub/ports/world/*.test.mjs  
**Actual exit:** 0. **Tests:** 16 passed, 0 failed, 0 skipped, 0 cancelled.  
**Actual commands:** node --check for each of world-port.mjs, fake-world-port.mjs, index.mjs, fake-world-port.test.mjs, account-isolation.test.mjs — all exit 0.

A first local 15-case test run failed (exit 1) on synthetic ../ reference traversal; hardened strict ref validation and reran to pass. A later two-account audit found projection leakage and was repaired by account-qualified evidence/receipt keys. The 16-test final run covers owner isolation, account swap, revocation before cached reads, grant expiry/scope, origin mismatch, CAS, duplicate source, idempotency replay/conflict, offline before claim, permanent uncertainty after claim, E2EE PARTIAL, untrusted content/schema refusal, bounded pagination and no instance persistence.

**UNRUN:** ARBOR in-repo full Host test script; integrated ProviderHub W1/A+B+D+E+F tests; Bun workspace; Rust/Cargo; GitHub Actions CI; Windows packaging; Studio/Chrome account; physical PWA/device; live provider read/write and any real World migration. No provider API, browser UI, graph store, local files or real effects were invoked.

## ERA 3 — Duplicate-authority review, blockers, G handoff

**No duplicate authority created:** only per-instance Maps, no filesystem imports or durable ledger; no send(), providerFetch(), grantPermission(), world.commit(), writeGrant(), Host dispatcher, second app, phone process, browser controller, TierFlow publisher or graph store. The mock's scenario controls are returned separately from injected port and may never be connected to UI or production. An uncertain synthetic claim stays UNCERTAIN, not applied and never auto-retried. A fake receipt does NOT establish provider delivery.

**Blockers:**
1. P0 orchestration: accepted W0-G gate SHA is unavailable; this branch's main-based parent is explicitly provisional and must not be promoted by a worker.
2. P1 integration: W1/A and W1/B versioned consumer contract has not been serially reconciled; G must compare actual commits and decide mapping, no guessed imports or root manifest changes by C.
3. P1 live boundary: no source-proven generic social-provider Host World grant/writer entrypoint. Bootstrap grant and world-evolution adapter are NOT substitutes. Host-only owner and durable receipt mapping are still required.
4. P1 runtime: only the isolated Node fake suite was executed; main Host/PWA/Windows/device and real account acceptance remain UNRUN.

**Proposed G decision:** ACCEPT_C_SOURCE_AS_MOCK_PREPARED, but HOLD_INTEGRATION / REBASE_REQUIRED until W0-G is accepted. If W0 authority mapping rejects an interface field, G applies the smallest schema bridge serially rather than C modifying shared paths.

**Precise G work:**
1. Pin accepted W0-G head; compare this branch against it and rebase/cherry-pick only authorized C paths. Verify no competing World or owner manifests; do not fast-forward main from C.
2. Reconcile W1/A schema and W1/B ProviderHub dependency-injection signature to this port. Proposed (not implemented) construction: createProviderHub({worldPort: fake.port, ...}); never implicit mock fallback in live mode.
3. For any future HOST_INJECTED adapter, route grant checks and evidence commits through the existing Host World permission/ledger, not createWorldEvolution or bootstrap grants by assumption. Preserve Host claim/receipt uncertain semantics, get exact account epoch/binding from trusted Host/Studio, and attach native graph proposals only via W1/E.
4. Run these focused tests from an actual checked-out branch, then integrated Node/Bun tests; verify refused wrong account, expired grant, cross-owner read and claimed-without-receipt at Host callsites. Report LIVE_READ_VERIFIED / LIVE_WRITE_VERIFIED only in a later real account approval program.

**No main merge, no modification outside authorized two roots, no claim of live provider integration.**

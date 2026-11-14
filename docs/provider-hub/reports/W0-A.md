# ARBOR Provider Hub R002 — W0/A Host/World identity and authority

**Classification:** SOURCE_INSPECTED / EVIDENCE_ONLY / TESTS_UNRUN / NOT_LIVE_VERIFIED
**Source baseline:** ARBOR main e0c510712b7e93c9f2e8d0c4991b06dc0b6c92c0 (2026-11-14 inspection)
**Worker branch:** work/provider-hub-W0-A-r001
**Write scope:** docs/provider-hub/reports/W0-A.md and docs/provider-hub/worker-reports/W0-A.md only
**Program:** vivim-labs/adaptors-providers/execution-rounds; W0/A; first R002 wave, no preceding Provider Hub G acceptance head
**Policy:** No direct provider API, browser send, credential collection, private corpus, real social account, alternate World, alternative publisher/phone, or live mock fallback.

## 1. Scope and source lock

Read: Labs R002 W0/A prompt, 00-MASTER-EXECUTE.md, README.md, 03-ARCHITECTURE-AND-MOCK-PORTS.md, 04-EXECUTION-PROTOCOL.md, 05-ACCEPTANCE.md, WAVE-MANIFEST.json and SOURCE-PINS.json. Read ARBOR Proposal 5 README, 09-EXECUTION-PLAYBOOK.md, foundational architecture, source-truth material, 08-BETA-GATES.json, and selected actual Host source/test files listed below. ARBOR root AGENTS.md returned GitHub NOT_FOUND (404); no root AGENTS.md was assumed. The source lock is current main SHA above, not a claim that a beta gate passed. Proposal 5 08-BETA-GATES.json itself says PROPOSED_UNRUN; G04 Host effects and G11 World/storage are UNRUN.

The exact existing candidate authority source files, with Git blob SHAs observed:
- apps/vivim-host/server.mjs — f779cbc873057124960d78e3445bee924dfb7e39
- apps/vivim-host/control/dispatcher.mjs — 723865482b8a0f98ab3214b2ec6a83aaea629c43
- apps/vivim-host/control/journal.mjs — b9739a00c8345a0513dba32ddc0361e96bb9b16f
- apps/vivim-host/control/intent-planner.mjs — 3d1bbcd5ad80ffa6276ea4e5d2b5f0cfbd8cf4ab
- apps/vivim-host/control/action-catalog.v1.json — 770feb4f66497fb8c5d0a9396d1e24fb14162a96
- apps/vivim-host/bootstrap/runtime.mjs — cc6805424bf5a382168bcfac0ec4dafa1d1ab096
- apps/vivim-host/bootstrap/ledger.mjs — b40eb9ba34e49b034875936a0e7fc14964270a54
- apps/vivim-host/bootstrap/service.mjs — 308b10d5679c34a8a7e164190f0f3b74c77a6055
- apps/vivim-host/bootstrap/owner-auth.mjs — 22d25dfe2484bf0db56b6c2b3970c209a0351c5f
- apps/vivim-host/direct-phone.mjs — ae2fb37e7d766f034bcf715ed52f70c4c9c476ff
- apps/vivim-host/conversations/studio-journal-evidence.mjs — 0bb6ec0430aa7a309f10acfe23be9153ff4bca63
- contracts/interop/v1/README.md — 3d804cd0d5532f87fe1a317ec04c41f90170cc53

This report maps functions found in source. A documented intention, existing narrow working implementation, and unverified future migration are deliberately separate.

## 2. The current authority graph (observed source)

| Concern | Actual source owner/call site | Observed behavior | Verdict |
| --- | --- | --- | --- |
| Local Host assembly | server.mjs createHostServer, lines 172-255 | Lazily opens the bootstrap runtime, creates one cached Control dispatcher, one device-enrollment service, and the existing Direct phone handler | SOURCE_PRESENT, not packaged-device-proven |
| Control discovery and plan | control/intent-planner.mjs createControlPlanner, lines 98-175 | Validates known catalog IDs and exact typed argument shapes; reports readiness; semantic World is a versioned command interpretation model, NOT the private personal World database | SOURCE_PRESENT |
| Control approval and execute | control/dispatcher.mjs createControlDispatcher, lines 147-319 | Journal-before-effect typed plan with SHA-256 digest, expiry, catalog-version check, refusal on stale semantic rules and wrong approval channel, fixed executors only | SOURCE_PRESENT, limited to catalog |
| Exclusive effect fence | control/journal.mjs createControlJournal, lines 18-78 | Exclusive plan/approval/claim/receipt files under dataRoot/control/plans, plus event log; claimed-without-receipt is uncertain and never retried | SOURCE_PRESENT; durable semantics still need failure-injection proof |
| Host HTTP Control | server.mjs handleControl, lines 596-745 | Owner token or owner UI session, method/origin/CSRF checks; exact control plan and execute; read-only bounded PWA view | SOURCE_PRESENT |
| Device authority | server.mjs lines 223-252, 696-713; direct-phone.mjs lines 445-490 | Current Host enrollment and Direct identity/grant validation; execute additionally demands control:execute, write origin/header, Host dispatcher | SOURCE_PRESENT, not a social-account grant |
| Personalization World slice | bootstrap/runtime.mjs lines 14-34, 67-125; bootstrap/service.mjs lines 150-818 | Host-owned scoped bootstrap service, default world-local, bounded projections, private personalization writes | SOURCE_PRESENT, not the complete future Provider Hub World |
| SQLite persistence | bootstrap/ledger.mjs openLedger, lines 206-252; entity stores lines 254-493 | SQLite ledger with BEGIN IMMEDIATE transactions, metadata/claims/observations/preferences/provenance, pass/job/receipt/UI revision/web evidence tables scoped to world_id | SOURCE_PRESENT for those domains only |
| Bootstrap permission | bootstrap/service.mjs grantRefusal and claimGrantSend, lines 26-134 | Specific onboarding scopes, owner grants, expiry, prompt digest, thread freshness, capped send accounting; grant claims via Host SQLite transaction | SOURCE_PRESENT but NOT provider messaging permission |
| Owner token | bootstrap/owner-auth.mjs loadOwnerToken/verifyOwnerToken, lines 59-110 | Private owner token file, host owner authorization | SOURCE_PRESENT |
| Studio outcome evidence | conversations/studio-journal-evidence.mjs lines 1-48 | Read-only correlation of Studio requests, turns and send observations; rejects source mismatches; no send authority | SOURCE_PRESENT, not a Messenger/WhatsApp sender |
| Current AI providers | Host onboarding provider checks, server.mjs lines 230-248 | Known signed-in AI-chat profile checks; does not establish a social account, thread or outbound social action | WRONG DOMAIN FOR SOCIAL HUB |

**Important terminology correction:** controlFor().world() exposes the command planner's WorldModel vocabulary/revision, not a general-purpose durable personal World grant service. Do not silently repurpose it as WorldPort. Likewise bootstrap/runtime.mjs worldId is a scope for existing bootstrap ledger records, not proof that account identity, social exports, provider sessions, attachment permissions or all World migration stages exist.

## 3. Actual call chain and effect ownership

**Current catalog-backed desktop:** Host HTTP /api/host/control/plan → createControlDispatcher.plan → createControlPlanner.planTyped/planText → for R1/R2 write control journal plan and digest; /api/host/control/execute → exact desktop owner channel → revalidate digest, catalog, rule/context, expiry → journal.approve → journal.claim exclusive → fixed Host executor → journal.finish receipt. Read R0 actions call fixed read executor immediately and do not create an effect plan.

**Current Direct phone:** direct-phone.mjs api/control/* authorizes a device for control:read, verifies origin/header, requires control:execute for action execution and sends exact planId + planDigest to the SAME Host Control dispatcher. R2 mobile approval is refused in dispatcher.mjs: sensitive R2 action requires desktop-owner-token; planning from mobile returns unavailable for R2.

**Current persistence:** Host bootstrap runtime opens a private SQLite file dataRoot/bootstrap/ledger.db through openLedger. This is the Host-owned personalization, provenance, UI and selected memory store. The Control action journal separately owns exact plan/claim/receipt evidence in dataRoot/control/plans and dataRoot/control/events.jsonl. The existing bridge/Studio journal is a distinct bounded conversation evidence path, not a Provider Hub journal to duplicate.

**Catalog reality:** action-catalog.v1.json version 7 has 20 entries: 17 source_wired, 0 verified, 3 enforcement_missing/unsupported. The source-wired entries cover Host diagnostics/device changes/preferences/theme/privacy/lexicon, not social messaging. In particular, there is NO catalog action such as social.message.send, messenger.send or provider-hub action. Startup enforces catalog/executor consistency through CONTROL_EXECUTOR_MISMATCH. W1 must not claim a mock Hub action is an already authorized catalog-backed live send.

## 4. Critical legacy-write seam — must be ruled by G

There is a **real exception** to a naive 'all current Host mutations go through Control' claim:

- server.mjs BOOTSTRAP_MUTATIONS (lines 338-353) includes grant/revoke, F01/F02/pass, preset/undo, hard-no, pass-state and UI-proposal.
- server.mjs handleBootstrap (lines 454-470) checks owner token and bootstrap CSRF header, then directly invokes mutate(runtime, body); this is not the UTC Control plan/claim/receipt path.
- Device management legacy writes DO return CONTROL_ACTION_PLAN_REQUIRED (server.mjs lines 404-420 and 697-713), and worker recover also returns this refusal (lines 300-314); their safe retirement must NOT be projected onto all bootstrap routes.
- bootstrap/service.mjs uses its own Host-owned grant, transactional ledger and receipt/idempotency mechanisms. This is not a second external Host, but it is not the same universal Control journal.

**Classification:** two existing in-Host specialized mutation mechanisms coexist. This may be intentional legacy behavior; the first Provider Hub release MUST NOT adopt the direct-bootstrap route for social outbound effects. **Proposed G decision:** select current Control dispatcher as sole action admission/effect owner for any future Provider Hub action, or explicitly name a compatible pre-existing Host sender owner after B/F inspection. G records how legacy bootstrap routes are reconciled separately; do not broaden this lane's write scope or quietly rewrite legacy routes.

## 5. Minimum versioned Provider Hub boundary recommended for W1 G (PROPOSAL ONLY)

The following are contract requirements, not implemented calls. Proposed namespace: vivim.provider-hub.world-port/1; no new persistent store.

Input context:
- principalRef, personalWorldRef, opaque providerId/productId/accountRef, accountEpoch and observedAt;
- source origin, exact thread/recipient/sourceRef where applicable, freshness, source revision and provenance digest;
- caller/device authenticated by existing Host, explicit scoped grant reference, intent ID and idempotency key;
- mode MOCK_ONLY versus LIVE, typed support/maturity, no implicit fallback.

Read port:
- getScopedAccountBinding(context), getGrantProjection(context), readEvidenceProjection(context, cursor, limit), readReceiptProjection(context, planId).
- Every read returns a bounded, versioned, privacy-filtered state: SOURCE_BACKED, MOCK_ONLY, PARTIAL, STALE, DENIED, UNAVAILABLE or UNSUPPORTED; no fabricated messages from missing evidence.

Inert write proposal:
- proposeEvidenceImport(context, expectedRevision, candidateRefs) returns a revision-bound proposal, not a World commit.
- proposeAction(context, exact provider/account/thread/recipient/draftHash/attachmentHashes/sourceRevision) returns an inert plan for the existing Host review path.
- No WorldPort.commit(), grantPermission(), send(), network fetch(), control executor or new claim journal in Provider Hub.

Receipts:
- Only existing Host effect owner can approve/claim/execute and project an external outcome; when no independently validated provider confirmation exists, state is UNCERTAIN rather than APPLIED.
- In MOCK_ONLY, injected fake World/Action ports yield synthetic:// references and unmistakable MOCK_RECEIPT, never live-ready.
- Future live binding is explicit and fails closed on missing World migration, stale epoch/grant/revision or browser source uncertainty.

**No source patch authorized from W0/A.** G should decide the exact type home, call site, account-grant owner and Host Control catalog integration before W1/A/C/D/G implementations converge. Proposed names are not assertions of existing APIs.

## 6. Synthetic negative acceptance matrix (specified, NOT RUN in W0/A)

| Synthetic scenario | Expected deterministic result | Existing related source guard / gap |
| --- | --- | --- |
| Wrong digest, modified recipient after approval | Refuse CONTROL_PLAN_MISMATCH or equivalent typed binding rejection; no claim | Control dispatcher digest check exists; provider recipient fields do not |
| Fake model approval channel | Refuse CONTROL_APPROVAL_CHANNEL | Dispatcher checks fixed APPROVAL_CHANNELS |
| Account A → B while Messenger draft remains open | Deny as ACCOUNT_EPOCH_STALE; force new proposal; no send | Account/session epoch is NOT implemented as social binding |
| Revoke/expire grant between preview and claim | DENIED or STALE; zero attempt | Bootstrap grantRefusal is for onboarding, not a social grant |
| Claimed send, crash before confirmed receipt | UNCERTAIN, no replay, no retry | Control journal/dispatcher source supports uncertainty for catalog actions |
| Privacy hard-NO forbids a target/message | DENIED with no candidate action | Existing owner hard-NO storage/read exists; specific Provider Hub enforcement NOT wired |
| Cross-World or spoofed provider identity | DENIED, zero evidence import | bootstrap ledger scopes worldId; social binding verification absent |
| E2EE gaps / unavailable history | PARTIAL or UNAVAILABLE, no invented body | no social SourcePort yet |
| Prompt injection in imported message | Inert source text only; cannot mint permission or dispatch | fixed Host catalog guard exists; Hub ingestion boundary not implemented |
| Offline PWA draft / uncertain action | Inert local draft; no deferred effect replay | no social PWA flow exists yet |
| Unsupported send capability | UNSUPPORTED, not a fake live receipt | current Control catalog explicitly refuses unavailable actions |
| Synthetic fixture requests cookies or provider network | Hard failure; no external I/O | future SourcePort fake must be isolated |

Test references inspected as **source tests, not executed in this session**: apps/vivim-host/test/control-dispatcher.test.mjs contains assertions for wrong digest, model channel, claimed-without-receipt, plan expiry, missing grant and privacy exclusions; Host package.json declares node --test test/*.test.mjs. They do not test social account swapping or the proposed port. Actual test command executions: NONE; all proposed and incumbent tests are UNRUN in this session. No CLI exit codes exist to report. GitHub source reading and commit writes are not a test runner. No personal/social data or real provider traffic was used.

## 7. Blockers and G decisions

- **P0 / Social write admission missing.** No social provider action/capability exists in catalog v7. G must select existing Host action extension or an existing verified Host-owned Studio sender seam after Lane B; never fake production send.
- **P0 / World port migration unverified.** Existing bootstrap SQLite data and World scope do not provide verified social identity, grants, accountEpoch, thread/recipient binding, import evidence, revocation or receipt lifecycle. G/W1/C establish an injected MOCK_ONLY boundary without another writer.
- **P0 / Legacy bootstrap direct mutation route.** Owner-token/bootstrap-grant writes remain outside universal Control claim fence. G explicitly resolves future use; social sends may not use that route.
- **P1 / Phone proof and privacy coverage.** Device-bound control:read/execute exists in Direct route source but physical phone, revocation races, real owner scope and account-scoped source grants are not runtime accepted.
- **P1 / Evidence maturity.** Proposal 5 G04 and G11 remain UNRUN. Code comments and stored tests are not live acceptance. No real Windows package, user browser or PWA device checked.
- **P1 / Call-site scope conflict.** W1 future code may require updates to server.mjs, dispatcher.mjs, action-catalog.v1.json and direct-phone.mjs, which are outside current per-lane source scopes. G must schedule serial/shared-owner patch and tests before claiming PWA/Host route wiring.
- **P2 / Current Host README is historically narrow.** Its older no-execute claim does not reflect latest dispatcher/server source. Prefer actual code and catalog v7 over README status prose.

## 8. G handoff — exact actions

1. Accept W0/A as **SOURCE_INSPECTED_REPORT_ONLY**, not implementation or a test gate. Preserve this source pin; re-read moved main at G.
2. Adopt the authority map: existing apps/vivim-host/control dispatcher/journal is Control-effect authority, bootstrap runtime/service/ledger is existing narrower personal-state owner, Studio readback is evidence only, and Direct phone routes reuse the Host dispatcher.
3. Cross-compare W0/B/C/D/F findings, then authorize a single versioned WorldPort facade backed by injected fake in W1/C; it must reject missing identity/grant, stale account epoch, cross-World, partial evidence and mock→live promotion.
4. Assign any necessary shared changes to G or the designated Host owner: exact planned file targets server.mjs, dispatcher.mjs, action-catalog.v1.json, direct-phone.mjs, plus isolated Host tests; no W0/A edit requested.
5. Choose whether to gate social proposeAction until Host catalog extension is merged (recommended) and whether legacy BOOTSTRAP_MUTATIONS are fenced/retained explicitly. Do not substitute bootstrap send grants for social send consent.
6. Require W1/W2 negative tests with exits, deterministic synthetic account swap/revoke/unknown/uncertain/error paths and Host/PWA transport integration before MOCK_RUNNING; for LIVE_READ_VERIFIED/WRITE_VERIFIED demand separate later owner-authorized device and browser evidence.
7. Gate recommendation: **READY_FOR_G_SOURCE_RECONCILIATION / NOT_GO_FOR_LIVE / TESTS_UNRUN**. G must not treat this one lane as approval of W0 or start W1 without collective W0 G decision.

## 9. Change and test summary

Files changed by this lane: this report and worker-reports/W0-A.md only (both new, documentation-only). Runtime code changed: NONE. Duplicate authorities created: NONE. Tests executed: NONE. Runtime fixtures created: NONE. User account/profile/network effects: NONE. No merge, no main mutation, no source implementation or live integration claimed.

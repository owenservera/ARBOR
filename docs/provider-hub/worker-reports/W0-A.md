# Provider Hub R002 — W0/A worker report

**Worker:** W0/A Host/World identity and authority
**Repository:** owenservera/ARBOR
**Branch:** work/provider-hub-W0-A-r001
**Base/source SHA:** e0c510712b7e93c9f2e8d0c4991b06dc0b6c92c0
**Source report commit SHA:** fe3a7f8202629591bda61fb36d61d89bccc50f65
**Current worker report commit SHA:** identify from branch HEAD when G fetches this report (a Git commit cannot contain its own SHA)
**Status:** SOURCE_INSPECTED / REPORT_COMMITTED / TESTS_UNRUN / NOT_LIVE_VERIFIED
**Gate proposal:** READY_FOR_G_SOURCE_RECONCILIATION (NOT W0 G GO)

## Exact changed paths
1. docs/provider-hub/reports/W0-A.md — detailed pinned Host/World authority inventory, negative matrix, contract proposal, blockers and G patch decisions.
2. docs/provider-hub/worker-reports/W0-A.md — this execution handoff.

No source, manifest, other lane, main branch, shared integration branch or live runtime was changed. No merge or PR requested/performed.

## Read-source evidence
- ARBOR main source lock e0c510712b7e93c9f2e8d0c4991b06dc0b6c92c0; Labs SOURCE-PINS same SHA.
- Existing Host creates one cached Control dispatcher in server.mjs:createHostServer and shares it with direct-phone.mjs.
- Control/dispatcher.mjs:plan/execute/status uses catalog verification, plan digest, claim fence, fixed Host executors and uncertain handling.
- Control/journal.mjs:createControlJournal persists exclusive planned, approved, claimed and receipt transitions.
- Bootstrap/runtime.mjs:createBootstrapRuntime and bootstrap/ledger.mjs:openLedger provide a narrower Host-owned SQLite World/personalization state, not verified social account migration.
- Bootstrap/service.mjs:grantRefusal/claimGrantSend are onboarding-specific and do not authorize social sends.
- server.mjs:handleBootstrap still accepts owner-token authenticated BOOTSTRAP_MUTATIONS directly; not all legacy mutations pass through the Control claim journal. This is an explicit source-backed integration blocker, not permission to create a new writer.
- action-catalog.v1.json version 7 has 20 actions (17 source_wired, none verified, 3 unavailable). No social-provider send action is present.
- direct-phone.mjs requires device control:read and control:execute scope, Direct origin/header checks and the same Host dispatcher; no physical phone verification done.
- studio-journal-evidence.mjs is read-only verified-correlation evidence, not an outbound provider effect owner.
- ARBOR root AGENTS.md 404 NOT_FOUND; Proposal 5 beta gates G04/G11 remain UNRUN. No R002 W0 prior accepted gate head exists.

## Verification with actual commands/exits

| Verification | Command or operation | Actual outcome | Exit |
| --- | --- | --- | --- |
| Work order fetch | connected GitHub fetch_file (Labs prompts/W0/A.md) | SUCCESS | N/A (connector API, no process exit) |
| Source inspections | connected GitHub fetch_file/fetch for ARBOR main and Labs architecture | SUCCESS | N/A (connector API, no process exit) |
| Branch creation | connected GitHub create_branch from exact base | SUCCESS | N/A (connector API, no process exit) |
| Source report commit | connected GitHub create_file | SUCCESS, commit fe3a7f8202629591bda61fb36d61d89bccc50f65 | N/A (connector API, no process exit) |
| Existing Host focused tests | node --test apps/vivim-host/test/control-dispatcher.test.mjs | UNRUN: GitHub connector does not execute shell tests | UNRUN |
| Existing Host full tests | node --test apps/vivim-host/test/*.test.mjs | UNRUN | UNRUN |
| Host HTTP and Direct phone tests | node --test apps/vivim-host/test/control-http.test.mjs apps/vivim-host/test/direct-phone.test.mjs | UNRUN | UNRUN |
| Provider Hub negative fixtures | future W1/W2 tests | NOT IMPLEMENTED / UNRUN (W0 is evidence-only) | UNRUN |
| Windows signed package / browser / physical PWA | later live acceptance | UNRUN | UNRUN |

Tests seen in source are **not executed tests** and no zero exit has been inferred. All exercised fixtures in this report are specified future synthetic cases; no real fixtures, social data or external provider traffic were used.

## Required negative/refusal evidence and gaps
- Source-guarded cases: wrong digest → CONTROL_PLAN_MISMATCH; model approval channel → CONTROL_APPROVAL_CHANNEL; claimed-but-no-receipt → CONTROL_UNCERTAIN; expiry → CONTROL_PLAN_EXPIRED; R2 Direct-phone approval denied; missing bootstrap grant → GRANT_REQUIRED failed receipt; unsupported catalog actions unavailable. Existing test file contains assertions for several of these, UNRUN here.
- Not yet implemented as Provider Hub code: account-swap epoch invalidation, exact Messenger thread/recipient/draft binding, social consent/revocation, E2EE partial handling, imported-content prompt-injection rejection, cross-personal-World graph imports. W1/W2 must test with seeded fakes against the production-facing Host service/ports.
- Privacy: Host projection can filter private owner data, but a new Provider Hub source cannot infer broad World consent from an onboarding grant; no outbound social actions were attempted.

## Duplicate-authority audit
No new Host, World database, graph store, browser controller, phone application, social send function, claim journal, TierFlow publisher, or provider API introduced. Existing Control journal and bootstrap ledger remain unchanged. Legacy bootstrap mutations require explicit G decision; they were not modified.

## Blockers
1. P0: Current Control catalog has no social-provider action; no verified live effect path.
2. P0: Migrated social World grant/account/source binding not proven; fake WorldPort cannot be treated as live.
3. P0: Authenticated legacy bootstrap mutations bypass universal Control journal; G must rule on single admission boundary before integration.
4. P1: Provider/account epoch, exact target/revision/recipient and re-consent gates do not exist for social channel.
5. P1: Existing tests not executed, Proposal 5 G04/G11 UNRUN; physical Windows/PWA/browser acceptance absent.
6. P1: Future required Host server/catalog/dispatcher/Direct callsite edits fall outside lane-specific ownership; serial G patch assignment required.

## Exact G handoff
Read docs/provider-hub/reports/W0-A.md at this branch head. Re-pin current ARBOR main, inspect all W0 A–F reports and choose one Host-owned WorldPort/ActionPort integration seam. Assign any shared server.mjs, dispatcher.mjs, action-catalog.v1.json and direct-phone.mjs edits to a designated owner or G; no W0 worker may silently patch them. W1/C must mock an injected versioned World boundary, W1/D fake only Host approval/receipt, W1/B call one Hub service; mock receipts must say MOCK_RECEIPT. Hold W1 until W0 G decision. Do not promote live or device verification from source inspection or mocks.

**Terminal classification for lane:** evidence prepared and committed; awaiting serial G reconciliation, NOT a LIVE or runtime acceptance gate.

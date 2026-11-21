# OW-20261121-009/010 — ARBOR agent-native closed loop / live-system execution status

**Date:** 2026-11-21. **Repository:** ARBOR, `main`. **Coding owner:** ChatGPT.  
**ZCode and Desktop Commander:** not used for the final ChatGPT-local coding and tests.  
**Truth convention:** CODED does not imply physically verified; tests are named separately.

## Integrated implementation

The initial owner-fenced draft-edit path is now represented by **one existing Rust live-system fabric** and one Host effect authority:

1. The existing Direct PWA first-contact Talk `#text` reports a bounded owner-only input observation; real human input, IME, visibility, and disconnect change the source fence.
2. Rust `LiveSystemState` integrates the owner-scope `phone.composer` region and refuses out-of-date edits. `agent_composer::prepare_draft` uses the existing `admit_edit` policy and returns **inert** candidates.
3. The desktop owner stages a candidate via `/api/host/live-system/composer/stage` or an explicit `stage-file` call after Rust validates the separate editable JSON proposal.
4. The **existing Host Control dispatcher/catalog/journal** alone owns the typed `pwa.composer.draft.set` R1 plan, explicit desktop-owner approval, effect claim, and final receipt.
5. The existing Direct phone session can receive an authorized one-shot delivery. The actual PWA textbox applies it using its ordinary `input` handlers; **no Send, provider call, synthetic Enter, or duplicate execution**.
6. Phone source readback with matching correlation and revision is independently checked through Rust before the Control effect becomes `applied`; uncertain paths do not retry.
7. An owner-only canonical JSON snapshot is atomically exported. The separate `owner.proposal.json` never gets overwritten by ordinary GETs; rebasing requires an explicit discard confirmation.
8. A bounded owner change feed `GET /api/host/live-system/changes?epoch=...&after=...&wait=...` gives a snapshot/cursor, deltas, reset or gap. It uses Rust-projected region revisions and one-shot long polling. It is **not** a second graph, database, journal, permission system, or general filesystem watcher.

## Tests and verification

- ChatGPT container: **14/14 Node tests PASS** across browser/IME/human-collision (6), change-feed cursors/gaps/restarts (5), owner client cursor validation (3).
- ChatGPT container: Node 22 TS type stripping PASS; TypeScript 5.8 strict/noEmit compatibility check PASS on the edited/new TypeScript modules. Production preference remains TypeScript 7+.
- Previously, before the final ChatGPT-local coding round: 4 Rust `agent_composer` tests PASS; 12 live-system Host tests PASS; 1 native Rust/Host/Direct-phone HTTP roundtrip PASS. These previous results do not validate the new change-feed wiring or physical device.
- **UNRUN in this ChatGPT container:** complete Rust workspace, new Host route integration with packaged native binary, WASM bundle, real Windows Host, paired Android/PWA UI, cross-device render and screenshot/geometry evidence.
- Final route integration test in `apps/vivim-host/test/agent-composer-http-roundtrip.test.mjs` now also checks owner source delta changes and file proposal → Host plan → Direct delivery → readback. It requires a packaged Rust product binary and is not marked PASS until executed.

## Original 60-item live-surface wiring ledger — honest current disposition

This report records deltas to the canonical local Labs ledger at
`vivim-labs/ARBOR-LIVE-SURFACE-DOCUMENT/WIRING-LEDGER.md`. It does **not** rename a CODED item to WIRED without real device/source proof.

| Existing ledger IDs | Disposition |
| --- | --- |
| 01–05 | Rust live-system, inert edit admission, Host computation and visual contract are CODED. Existing focused tests passed; WASM/device acceptance UNRUN. |
| 06–10 | Full mounted visual producer, stable component identity, TierFlow imports and VEC visual integration remain OPEN. |
| 11–12 | Existing `#text` composer now source-backed and one-shot writable; true browser/phone focus, selection and keyboard acceptance remain UNRUN. |
| 13–18 | Geometry, accessibility, opt-in screenshot/3-second capture, capture-to-revision alignment, paging and full visual event coverage remain OPEN. |
| 19–20 | Host source observation and status are CODED; producer-driven PWA composer observation integrated. General all-source subscription is PARTIAL. |
| 21–25 | Existing conversations/Wiki/HQKG/VLANG sources remain in their original homes. Wiki revision summary is visible; complete knowledge and command regions remain OPEN. |
| 26–27 | Existing Host Control catalog/dispatcher/journal now handle an R1 composer draft plan with owner approval and source receipt; full physical-device acceptance UNRUN. |
| 28–29 | Owner Tailnet Direct PWA draft transport is CODED; separate device-grant scopes/revocation-aware multi-device subscriptions are OPEN. |
| 30–32 | Atomic canonical JSON + separate editable file + explicit Rust admission + owner-Control stage and receipt are CODED; automatic filesystem watcher is intentionally NOT enabled. |
| 33 | Bounded owner cursor/delta/gap/epoch long-poll is CODED; 5 isolated Node tests PASS. Wiki/journal-wide push notifications remain OPEN. |
| 34–35 | Rust HQKG replay and worker supervision expansions remain OPEN. |
| 36–37 | External ZCode/model orchestration is NOT delegated in this work; no integration claim. |
| 38–46 | Studio capture/replay, provider effects, native GPUI/Tauri migration, voice, SDK/MCP/LSP expansions remain OPEN. |
| 47–51 | Source CAS, one-shot uncertainty, owner scoping and bounded resource controls are PARTIAL. Full privacy audit, retention and crash/reconnect proof OPEN. |
| 52–55 | Real visual 42→75, capture alignment, Windows+Android convergence and performance acceptance UNRUN. |
| 56–58 | Composer correlation and explicit source/refusal schemas CODED; general graph causal trace, observability and upgrade acceptance OPEN. |
| 59–60 | Global object query OPEN; incomplete source/coverage manifest explicitly reported by Host, complete coverage NOT claimed. |

**Next evidence that changes status:** actual mounted first-contact PWA receives an owner-approved terminal draft and displays the new text without Send, with independent Host Control receipt, current source revision and no conflict. Then verify Android, Wiki/Studio visual projections and deliberately opt-in capture. No ZCode coding or product migration is authorized by this report.

## Repeatable focused commands

```sh
node --experimental-strip-types --test apps/mobile-relay/test/agent-composer-browser.test.mjs apps/vivim-host/test/live-system-delta-feed.test.mjs apps/vivim-host/test/live-system-client.test.mjs
cargo test --manifest-path core/programmability/Cargo.toml agent_composer
node --test apps/vivim-host/test/agent-composer-bridge.test.mjs apps/vivim-host/test/live-system-read-port.test.mjs apps/vivim-host/test/live-system-file-mirror.test.mjs apps/vivim-host/test/live-system-route.test.mjs apps/vivim-host/test/agent-composer-http-roundtrip.test.mjs
```

No deployment, service restart, real phone interaction, screenshot capture, or autonomous Send has been performed in the final coding round.

## New tracked feature — AV-001: live agent typing and truthful tap dots (DESIGN ONLY)

**Owner requirement:** On the *real first-contact phone PWA*, visibly watch an authorized agent update the existing textarea step-by-step, and see a short-lived touch dot only at the actual on-device target when a permitted agent UI activation is dispatched. This is a temporary human supervision/confirmation loop, not proof that ChatGPT is already connected to the phone.

**Design / new-agent handoff:** [OW-20261121-PWA-LIVE-AGENT-VISIBILITY-DESIGN.md](OW-20261121-PWA-LIVE-AGENT-VISIBILITY-DESIGN.md). Also tracked as **AV-01–AV-08** in [FIRST-CUSTOMER-TRACKER.md](../FIRST-CUSTOMER-TRACKER.md).

| Scope | Status (2026-11-21) | Source / required next step |
| --- | --- | --- |
| Progressive visible typing in real `#text` | **OPEN / DESIGN READY** | Existing `first-contact-composer.ts` currently performs one-shot write; add bounded grapheme-safe visible frames with human takeover and final-only Rust/Host receipt |
| Dot for actual authorized agent tap | **OPEN / DESIGN READY / BLOCKED on UI target action** | Existing composer receipt does not grant click authority. First add semantic/layout-fenced Host Control UI activation; then render phone-local dot on dispatch only |
| Typed action/gesture provenance and source/receipt evidence | **PARTIAL / DESIGN READY** | Compose source and Host effect receipt exist; no visual-frame proof or general tap-source proof yet |
| Android owner confirms typing/tap on unchanged Direct URL | **UNRUN** | Real paired Android browser, positive/negative tests and correlated Host receipts required |

**Ledger relationship:** original Labs wiring IDs **11–18** (input/geometry/accessibility), **26–29** (Control/device authority) and **47–58** (source/receipts/real acceptance). Its canonical local `WIRING-LEDGER.md` was not edited because it is not accessible in the connected GitHub `vivim-labs` tree. This section and the first-customer tracker are the actionable GitHub-side entries pending explicit reconciliation. **No feature source code was changed in this documentation task.**

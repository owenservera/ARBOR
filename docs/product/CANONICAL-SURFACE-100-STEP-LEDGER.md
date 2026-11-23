# VIVIM / ARBOR — 100-Step Canonical Surface Execution Ledger

**Owner directive:** 2026-11-22. **Authority:** [ONE-CANONICAL-LIVE-SURFACE.md](ONE-CANONICAL-LIVE-SURFACE.md). **Goal:** One First Contact surface, native GPUI on PC, PWA on mobile, Host sole state/effect authority; no browser UI on Windows.

**Ownership:** ChatGPT Cloud Dev commits Rust-first source directly to ARBOR `main`; ZCode and Desktop Commander perform authorized local read-only observation, post-push build and on-device acceptance. No second source coder or parallel UI.

**Workflow:** Each task goes `TODO → IN_PROGRESS → CODED → VERIFIED`, with `BLOCKED` as needed. Record commit SHA, device, exact test, screenshot and result. Static compile != actual Windows acceptance. No silent 100-task completion claims.

**Baseline:** Win32 HMENU with seven categories/command mapping verified; 37/37 GPUI library tests PASS and desktop build PASS. Real painted menu nonclient region, Alt/mouse access, two-device sync UNPROVEN. Isolated source `f2322bf`.


## 2026-11-23 — Canonical planner reconciliation (latest source-evidence view)

**Audit identity:** [ARBOR issue #33](https://github.com/owenservera/ARBOR/issues/33) is the 71-item execution oversight ledger; this document is the separate 100-step GPUI/PWA acceptance checklist, not 100 more independently assigned active development jobs. [Issue #31](https://github.com/owenservera/ARBOR/issues/31) is release/two-device evidence, [issue #32](https://github.com/owenservera/ARBOR/issues/32) is provider conversations, and Labs [TASK-CLAIMS](https://github.com/owenservera/vivim-labs/blob/main/ZCODE-DESKTOP-COMMANDER-OPERATIONS/TASK-CLAIMS.md) controls exact source/file ownership. Preserve existing 100 CS identifiers and completion rules.

**Recounted state:** **3/100 VERIFIED, 97 OPEN**. Only CS-001, CS-002 and CS-006 are checked. Do not turn authored code, passing isolated Node/Rust tests or historical device screenshots into new full acceptance checks without the task's exact required evidence. The accepted integrated top-row titlebar at ARBOR `e2e6902` is an important historical physical/owner acceptance but it does **not** establish every File/Edit/Tools mouse/Alt command or new-source packaged runtime.

**Latest observed canonical source:** [ARBOR `a34a7f5a88afb687f86fc9fba79a7e886052f48c`](https://github.com/owenservera/ARBOR/commit/a34a7f5a88afb687f86fc9fba79a7e886052f48c). Independent actual Windows no-effect regressions at this SHA include **44/44 Host/Studio/Work** tests and **26/26 mobile/Host/Studio** tests, each separate suite. The live Work store was observed `initialized:false`; no actual owner-approved Work POST, provider message, Android acknowledgment or same-SHA full release was demonstrated.

**Latest observer state on physical PC:** `local-logs/native-verifier/latest.json` exact `a34a7f5a`, finished **2026-11-23 20:14:05 UTC**, reports **BLOCKED / PARALLEL_TEST_RUNNER_EXIT_3**. Accompanying `vlang-iterations/latest.json`: **AutoWiki 12/12 PASS**, **visual 21/21 PASS**; **VLANG assertion failures plus timeout** and **safety timeout** without reliable full case totals. These are source-test findings, not CS-031–040 UI proof; older 215/215 on a different SHA is historical. The deterministic hourly native verifier remains separate from **zero verified live ZCode model-driven workflow workers** at the last audited point.

| Existing CS waves | Status audited | Outstanding acceptance gate |
|---|---|---|
| CS-001–010 — native menu | 3 verified / 7 open | OS/GPUI physical Alt, click and focus proof on accepted menu implementation |
| CS-011–020 — Developer evidence | 0 verified / 10 open | Real screenshots, diagnostics, negative privacy receipts |
| CS-021–030 — First Contact | 0 verified / 10 open | Full latest-source native canvas, typing, clear and IME acceptance |
| CS-031–040 — AutoWiki | 0 verified / 10 open | Real source-backed native Wiki queries and persisted revision/epoch |
| CS-041–050 — Host authority | 0 verified / 10 open | End-to-end reviewed action, grant/refusal, source and receipt proof |
| CS-051–060 — PC↔Android | 0 verified / 10 open | Actual paired two-way revision and screenshot receipts |
| CS-061–070 — TierFlow | 0 verified / 10 open | Shared semantic parity and justified legacy retirement |
| CS-071–080 — Windows menu | 0 verified / 10 open | Accepted physical top-level menu commands, screenshot and rollback |
| CS-081–090 — semantic compiler | 0 verified / 10 open | Natural-language plan, VLANG guards and visual feedback on real Host data |
| CS-091–100 — release | 0 verified / 10 open | Single immutable source package, safe promote and Android verification |

**Current source-to-device ladder:** CODED/PUSHED for guarded Studio channel and Work ingress; SOURCE_TESTED for focused suites; STUDIO_CHAT_WORKER_LIVE previously verified at PID 17188 (must check current OS liveness before use); **REAL_PROVIDER_SEND, SETTLED_REPLY, HOST_CHAT_RECEIPT, PHONE_ACK, CURRENT_SAME_SHA_PACKAGE and GPUI↔ANDROID_SYNC all OPEN**. Historical uncertain ChatGPT turn must not be retried. Do not deploy/restart user runtime or change phone URL/pairing to improve checklist numbers.

**Update rule for every CS row:** record exact ARBOR SHA, relevant test/run exit status, served artifact SHA if released, physical device/interaction evidence, Host source/revision/receipt and negative cases where relevant. If one element is absent keep `[ ]` and describe intermediate maturity separately. The 71-item ledger may close its documentation-reconciliation task only after this audit is committed and independently re-fetched.

---

## Wave 1 — Win32 shell visibility

- [x] **CS-001** Reproduce the native menu painting defect in the isolated GPUI build. **Status:** VERIFIED. **Evidence:** Win32 7-menu handle and actual GPU-composited screenshot showed Terminal chrome where menu should paint; prior source and SITREP.
- [x] **CS-002** Record HWND, HMENU, client/nonclient geometry and OS/window styles. **Status:** VERIFIED. **Evidence:** Windows style probes and GetMenuBarInfo/rect measurements captured on DESKTOP-9KB03LU.
- [ ] **CS-003** Gate native menu readiness on actual visible menu geometry. **Status:** CODED. **Evidence:** `5296840` geometry admission added; `0541169` disables visual cutover until explicit native acceptance; physical fallback proof pending.
- [ ] **CS-004** Keep the existing GPUI menu fallback visible when Win32 painting is unproven. **Status:** CODED. **Evidence:** `0541169` makes visible shell default unless experimental opt-in; native screenshot of this exact build pending.
- [ ] **CS-005** Request safe nonclient frame recalculation after mounting HMENU. **Status:** CODED. **Evidence:** `682d743` calls SetWindowPos SWP_FRAMECHANGED and DrawMenuBar; menu repaint visually still unaccepted.
- [x] **CS-006** Confirm native menu item rectangles through Win32 geometry probes. **Status:** VERIFIED. **Evidence:** GetMenuItemRect and GetMenuBarInfo returned nonempty rect 12,26..44,45; pixels contradicted the menu, so visual gate remains BLOCKED.
- [ ] **CS-007** Exercise all seven native sections with Alt-key interaction. **Status:** TODO.
- [ ] **CS-008** Exercise each native submenu using physical mouse interaction. **Status:** TODO.
- [ ] **CS-009** Verify menu commands preserve editor focus and restore home. **Status:** TODO.
- [ ] **CS-010** Capture accepted before/after menu-visible device evidence. **Status:** TODO.

## Wave 2 — Developer evidence

- [ ] **CS-011** Give screenshot action a saved-path or error receipt. **Status:** TODO.
- [ ] **CS-012** Capture GPU-composited own foreground window without black pixels. **Status:** TODO.
- [ ] **CS-013** Refuse occluded/unfocused/wrong-window capture. **Status:** TODO.
- [ ] **CS-014** Verify screenshot bounds include correct app chrome. **Status:** TODO.
- [ ] **CS-015** Exercise screenshot via physical Developer menu click. **Status:** TODO.
- [ ] **CS-016** Exercise diagnostics via physical Developer menu click. **Status:** TODO.
- [ ] **CS-017** Prove reports never include secrets/draft/wiki content. **Status:** TODO.
- [ ] **CS-018** Verify screenshot folder action opens intended directory. **Status:** TODO.
- [ ] **CS-019** Provide read-only Host/Wiki/VEC diagnostics with revision. **Status:** TODO.
- [ ] **CS-020** Store verified receipts in canonical tracker. **Status:** TODO.

## Wave 3 — First Contact canvas

- [ ] **CS-021** Confirm only blank canvas and composer at startup. **Status:** TODO.
- [ ] **CS-022** Compare native screen with accepted Edge PWA reference. **Status:** TODO.
- [ ] **CS-023** Match composer placement/padding/width/radius. **Status:** TODO.
- [ ] **CS-024** Match font, placeholder, caret and focus styles. **Status:** TODO.
- [ ] **CS-025** Match Enter/multiline/IME behavior. **Status:** TODO.
- [ ] **CS-026** Hide diagnostics on clean home. **Status:** TODO.
- [ ] **CS-027** Show Wiki only for meaningful typed text. **Status:** TODO.
- [ ] **CS-028** Clear Wiki when composer is emptied. **Status:** TODO.
- [ ] **CS-029** Handle resize without layout divergence. **Status:** TODO.
- [ ] **CS-030** Capture accepted empty/typed/cleared states. **Status:** TODO.

## Wave 4 — AutoWiki

- [ ] **CS-031** Authenticate native Host Wiki lookup. **Status:** TODO.
- [ ] **CS-032** Remove synthetic and cached-fallback Wiki content. **Status:** TODO.
- [ ] **CS-033** Wire input changes to same Wiki read contract. **Status:** TODO.
- [ ] **CS-034** Bound rapid-query traffic and maintain last draft. **Status:** TODO.
- [ ] **CS-035** Fence results by source epoch and query. **Status:** TODO.
- [ ] **CS-036** Discard stale results after newer input. **Status:** TODO.
- [ ] **CS-037** Preserve page identity and source revision. **Status:** TODO.
- [ ] **CS-038** Show accurate empty/error/offline states. **Status:** TODO.
- [ ] **CS-039** Reflect persisted Wiki changes without restart. **Status:** TODO.
- [ ] **CS-040** Test three real typed queries on PC. **Status:** TODO.

## Wave 5 — Host authority

- [ ] **CS-041** Verify Host sole persisted-state and effect authority. **Status:** TODO.
- [ ] **CS-042** Reuse existing owner auth without second token store. **Status:** TODO.
- [ ] **CS-043** Route product commands through existing Rust contracts. **Status:** TODO.
- [ ] **CS-044** Prove typing never produces an effect. **Status:** TODO.
- [ ] **CS-045** Use existing command preview and plan types. **Status:** TODO.
- [ ] **CS-046** Require explicit owner approval for effects. **Status:** TODO.
- [ ] **CS-047** Bind receipts to exact source revision. **Status:** TODO.
- [ ] **CS-048** Test cancellation/error/recovery without silent retries. **Status:** TODO.
- [ ] **CS-049** Inspect source/provenance in Developer only. **Status:** TODO.
- [ ] **CS-050** Run authorization regression tests. **Status:** TODO.

## Wave 6 — PC-phone live state

- [ ] **CS-051** Verify phone PWA uses canonical Host URL. **Status:** TODO.
- [ ] **CS-052** Validate session and phone draft source admission. **Status:** TODO.
- [ ] **CS-053** Read phone draft in GPUI Devices with privacy default. **Status:** TODO.
- [ ] **CS-054** Display authenticated revision/source identity. **Status:** TODO.
- [ ] **CS-055** Publish PC-origin draft through canonical Host observation. **Status:** TODO.
- [ ] **CS-056** Project PC-origin draft back to phone without duplicate state. **Status:** TODO.
- [ ] **CS-057** Preserve partial typing and IME semantics. **Status:** TODO.
- [ ] **CS-058** Resolve concurrent drafts with source ordering. **Status:** TODO.
- [ ] **CS-059** Demonstrate PC-to-phone and phone-to-PC propagation. **Status:** TODO.
- [ ] **CS-060** Capture two-device synchronized Wiki proof. **Status:** TODO.

## Wave 7 — TierFlow migration

- [ ] **CS-061** Inventory TierFlow primitives already present in Rust. **Status:** TODO.
- [ ] **CS-062** Map missing layouts into shared canonical VEC. **Status:** TODO.
- [ ] **CS-063** Map visual tokens into GPUI renderer. **Status:** TODO.
- [ ] **CS-064** Map gestures into shared semantic intents. **Status:** TODO.
- [ ] **CS-065** Map feedback transitions into native events. **Status:** TODO.
- [ ] **CS-066** Reuse VEC identities and revision guards. **Status:** TODO.
- [ ] **CS-067** Keep mobile renderer as same definition projection. **Status:** TODO.
- [ ] **CS-068** Migrate one TierFlow primitive under parity tests. **Status:** TODO.
- [ ] **CS-069** Validate shared layout and interaction in two viewports. **Status:** TODO.
- [ ] **CS-070** Retire legacy TierFlow pieces only after parity. **Status:** TODO.

## Wave 8 — Windows app menu

- [ ] **CS-071** Keep all seven menu groups at app shell level. **Status:** TODO.
- [ ] **CS-072** Prove File menu returns to First Contact. **Status:** TODO.
- [ ] **CS-073** Prove Edit focus and clear draft actions. **Status:** TODO.
- [ ] **CS-074** Prove View Wiki inspector stays secondary. **Status:** TODO.
- [ ] **CS-075** Prove Tools Host actions respect permission boundary. **Status:** TODO.
- [ ] **CS-076** Prove Developer screenshot and report action receipts. **Status:** TODO.
- [ ] **CS-077** Persist Windows-specific Settings in APPDATA. **Status:** TODO.
- [ ] **CS-078** Verify privacy default and preference round-trip. **Status:** TODO.
- [ ] **CS-079** Show Help/About build provenance safely. **Status:** TODO.
- [ ] **CS-080** Verify every menu item with mouse and keyboard. **Status:** TODO.

## Wave 9 — Build and launcher

- [ ] **CS-081** Pin immutable release folder to exact ARBOR SHA. **Status:** TODO.
- [ ] **CS-082** Run Rust/TS checks with exact status receipts. **Status:** TODO.
- [ ] **CS-083** Build native Windows binary without browser UI. **Status:** TODO.
- [ ] **CS-084** Keep mobile Tailnet URL unchanged. **Status:** TODO.
- [ ] **CS-085** Ensure sole Host supervisor listener. **Status:** TODO.
- [ ] **CS-086** Validate crash/stale/offline recovery. **Status:** TODO.
- [ ] **CS-087** Expose launch failure in Developer diagnostics. **Status:** TODO.
- [ ] **CS-088** Rehearse rollback without changing phone PWA. **Status:** TODO.
- [ ] **CS-089** Archive duplicate shortcuts after verified replacement. **Status:** TODO.
- [ ] **CS-090** Verify exactly one product launch path and process. **Status:** TODO.

## Wave 10 — Physical acceptance

- [ ] **CS-091** Prove PC empty→type→Wiki→clear. **Status:** TODO.
- [ ] **CS-092** Prove Android empty→type→Wiki→clear. **Status:** TODO.
- [ ] **CS-093** Prove simultaneous drafts synchronize. **Status:** TODO.
- [ ] **CS-094** Prove Wiki revisions propagate exactly. **Status:** TODO.
- [ ] **CS-095** Prove keyboard/touch/long-press behavior. **Status:** TODO.
- [ ] **CS-096** Prove Windows menu/screenshot/diagnostics via human input. **Status:** TODO.
- [ ] **CS-097** Run final Rust/Host/PWA regression suites. **Status:** TODO.
- [ ] **CS-098** Publish source and device evidence with blockers. **Status:** TODO.
- [ ] **CS-099** Update ZCode verification mission and tracker statuses. **Status:** TODO.
- [ ] **CS-100** Promote canonical release only when all blockers close. **Status:** TODO.

## Gates and evidence rules

**First:** CS-001–010; **then:** evidence CS-011–020, composer CS-021–040, Host and sync CS-041–060; TierFlow and Win32 expansion support these, release CS-091–100 is last. Status ledger records only the actions actually completed in this 2026-11-22 execution cycle; remaining tasks remain TODO. A task is VERIFIED only when the specified visible action, source result and authorized device proof exist. Do not change the permanent launcher or mobile URL until physically accepted.

## First-tranche activity receipt — 2026-11-22

- Code: `682d743` native menu geometry and safe Windows frame recalculation; `5296840` fallback visibility gate; `0541169` default visible app shell until human visual acceptance. These are cloud GitHub `main` source commits.
- Device: DESKTOP-9KB03LU, isolated GPUI checkout; full prior build on `f2322bf` displayed First Contact but invisible native menu region. Win32 probes measured root item rectangle and seven categories, yet screenshot had Terminal chrome: **native painting BLOCKED**.
- New source state `0541169`: local Rust tests / desktop check / screenshot must be recorded when the currently running Windows build reaches a final result. **Do not infer completion.**
- ZCode independent read-only mission: [GPUI verifier](ZCODE-GPUI-NATIVE-MENU-VERIFIER-R001.md). ZCode brief SITREP on the device PASS as a health check (14 name-matched processes; not 14 workers), no active verifier session claim.

## Native capability intake / deterministic VLANG continuation — 2026-11-22

- [Implementation receipt and sequence](NATIVE-CAPABILITIES-VLANG-EXECUTION-20261122.md) tracks source-donor extraction from DesktopCommanderMCP-VIVIM **into ARBOR native code**, not an additional MCP server.
- First slice committed on `main`: `f6633a2` bounded screenshot-directory metadata inspection; `d30e194` Developer diagnostic integration. **CODED/PUSHED; current SHA compilation and device tests UNRUN**.
- Next product slice is existing deterministic NLCL/VLANG text → typed catalog-bound candidate → inert GPUI/mobile preview → explicit Host plan/approval → authorized command receipt. **No LLM required** for supported phrases; no auto-execution while typing.
- Align with CS-031–060 and CS-091–099. This addendum does not mark any physical acceptance item VERIFIED.

## Continuous development receipt — R002 / long-draft VLANG admission (2026-11-22)

- **Source integration:** `85afcc7332757ebf0eb0254a2324b8cb3aafd4ca` (Rust pure admission and boundary tests), `cec50e0c61a0daf95e822a380db669d2a612cdfc` (GPUI latest-input inert interpretation independently of Wiki search), `1ebd270ebff9d7e40fd965db1bfe8d6cbe8c6934` (actual newline control regression). All committed to GitHub `main` via cloud source owner; subsequent parallel commits require their own verification.
- **Behavioral contract:** Wiki search remains independently limited to 160 visible characters; the same preexisting Host NLCL/VLANG interpreter accepts nonempty, control-free drafts up to 1000 UTF-16 units. Valid 161–1000-unit composer text no longer loses its inert command preview merely because Wiki search is unavailable. The existing latest-edit epoch and Host approval/uncertain guards remain; typing never calls Host plan/execute.
- **Post-push Windows source test:** `DESKTOP-9KB03LU` isolated, detached worktree `C:\\0-BlackBoxProject-0\\.arbor-gpui-releases\\1ebd270ebff9`; exact checkout `1ebd270ebff9d7e40fd965db1bfe8d6cbe8c6934`. The earlier `13c200e94b08` checkout and screenshot evidence were left intact.
- **Rust library:** `cargo test --manifest-path native/gpui-desktop/Cargo.toml --lib --offline --locked` **PASS 42/42** (includes new `first_contact::tests::semantic_input_is_independent_of_the_short_wiki_search_limit`). **Native desktop check:** `cargo check --manifest-path native/gpui-desktop/Cargo.toml --features desktop --offline --locked` **PASS (exit 0)** after compilation. The exact Windows test directory was used for both commands.
- **Host/NLP tests:** `node --test apps/vivim-host/test/vlang-command-compilation.test.mjs apps/vivim-host/test/control-intent-planner.test.mjs apps/vivim-host/test/command-intent-native.test.mjs apps/mobile-relay/test/composer-assist.test.mjs` **PASS 26/26**; the suite itself marks multiple independent native binary checks **UNRUN**.
- **Reproducibility caveat:** a clean offline test checkout initially failed dependency selection for `core-foundation 0.10.0` versus `0.10.1`. The test checkout reused the **existing previously successful local untracked** `native/gpui-desktop/Cargo.lock` (SHA256 `2519E25032EE77F9C396F15E067AA3353B070E8E2B4A78C2A0C13422E0A2A279`). No source or old evidence was patched locally. This is a tested dependency resolution, **not** proof of clean no-lock offline reproducibility.
- **CI:** GitHub Actions push workflow for `1ebd270` reported `startup_failure`, not a code test failure or success. Local Windows tests above are the actual receipts.
- **Still UNRUN/BLOCKED:** current subsequent `main` HEAD exact-SHA tests, release executable link/run, physical GPUI empty→long typed draft→VLANG/Wiki→clear, native Win32 menu painting/keyboard/mouse, Android behavior and bidirectional PC↔phone revision evidence. No permanent launcher or phone URL change.
- **Next cycle:** rebuild updated `main` at exact SHA once concurrent changes settle; collect foreground GPUI evidence of 161+ character deterministic interpretation without Wiki results; then close CS-091/096 and move to CS-055–060 PC→Host→phone synchronized draft contract. ZCode remains read-only, deterministic, rate-limit-safe until its one-scout model health gate passes.

## Continuous development receipt — R003 / native phone projection admission (2026-11-22)

- **Cloud source fix pushed:** [`b89a5d529bf41f40cd16611e8ab28366fa57c150`](https://github.com/owenservera/ARBOR/commit/b89a5d529bf41f40cd16611e8ab28366fa57c150), `native/gpui-desktop/src/first_contact.rs`. GitHub `main` file blob independently re-read and confirmed at `cd9475a6dfa642845da7908995192a72960a5036` after concurrent commits moved HEAD.
- **Contract change:** native read-only phone projection now requires the existing Host's `exposure:"owner"`, `data.target:"vivim"`, strictly positive source/view/local revision, lowercase canonical 32-hex phone session. It still refuses stale/hidden/duplicate/oversized regions and never stages, plans or executes an effect.
- **Regression source added:** `refuses_non_owner_or_wrong_product_phone_draft`, `refuses_noncanonical_phone_session_identity`; existing unversioned-source test extended to zero revisions. Test cases use the actual `agent-composer-bridge.mjs` observation fields and existing Host local revision contract.
- **Verification:** CODED/PUSHED and independently SOURCE RE-READ on `main`. Native cargo test, desktop compile check, live PC screenshot, and Android two-device sync for this exact SHA **UNRUN**, not PASS. The connected Windows Remote Desktop Commander replied online, but a PowerShell command session returned no usable command/build output; no source was modified on the PC.
- **Ledger impact:** CS-052 (source-admission substep) strengthened **IN CODE, DEVICE UNVERIFIED**. CS-053–059 and CS-091–099 stay TODO until real device/Host evidence. No launch shortcut or phone URL changes. Next: repeat post-push immutable Windows build and verify foreground GPUI typing/menu; implement PC-origin staged composer edits only through the existing Host Control owner-approval/receipt contract; prove cross-device source revisions and race behavior.

### R002 native/VLANG development cycle — 2026-11-22

- [Exact source commits, unit-test receipts and unresolved native acceptance](DEV-CYCLE-NATIVE-VLANG-R002-20261122.md).
- Verified exact source `4a26454` on isolated Windows: **45/45 GPUI Rust library tests PASS** and **27/27 deterministic Host/VLANG tests PASS**; node-native subchecks remain UNRUN.
- The latest native source and model-free feedback are library-test verified at `4a26454`; **desktop-feature compilation was interrupted without pass**, and physical GPUI typing, native menu painting, and Android parity remain UNVERIFIED.
- CI startup failure (zero jobs) is NOT a source test failure or pass. Preserve the existing launcher, phone URL and dirty local development workspace.

## Native executable build receipt — R003 / reuse existing checkout (2026-11-22)

- **Build source:** exact commit `e3f8b0d038abb0ef300acee11d8ba5e5c51b4f2b` in existing detached Windows checkout `C:\\0-BlackBoxProject-0\\.arbor-gpui-releases\\verify-e3f8b0d`; reused the existing local `Cargo.lock` (SHA256 `2519E25032EE77F9C396F15E067AA3353B070E8E2B4A78C2A0C13422E0A2A279`) and existing shared Cargo target. No new checkout, source patch, listener, UI runtime, shortcut or phone URL.
- **Actual binary:** `cargo build --manifest-path native/gpui-desktop/Cargo.toml --features desktop --offline --locked` **PASS exit 0**. Windows output `C:\\0-BlackBoxProject-0\\.arbor-gpui-releases\\gpui-shared-target\\debug\\vivim-gpui-desktop.exe`, 51,322,880 bytes, SHA256 `0F7906B9835816F9D34A6CA53E8E6327FC741D0448A149034CCE4AB7884B4539`. Debug native binary, not an installed/promoted release. Warning: future-incompatible upstream `proc-macro-error2 2.0.1`.
- **Exact-source Rust:** `cargo test --manifest-path native/gpui-desktop/Cargo.toml --lib --offline --locked` **PASS 43/43, exit 0**; includes new metadata-only local-directory inspection regression.
- **Exact-source Host/NLP/onboarding:** `node --test apps/vivim-host/test/vlang-command-compilation.test.mjs apps/vivim-host/test/control-intent-planner.test.mjs apps/vivim-host/test/command-intent-native.test.mjs apps/mobile-relay/test/composer-assist.test.mjs apps/vivim-host/test/onboarding.test.mjs apps/vivim-host/test/oracle-onboarding-prompts.test.mjs` **PASS 40/40, exit 0**. Node suite logs independent native-binary parity subchecks **UNRUN**, not accepted.
- **No duplicated active application:** post-build Windows process inspection found one already-running `vivim-gpui-desktop.exe` PID 16832 and its existing Host PID 15232, both launched from earlier `13c200e94b08` checkout. The new executable has **NOT** been run, installed or substituted for the live instance; no visual/menu/mobile device acceptance is claimed.
- **Next:** controlled native replacement/foreground verification after preserving unsaved user draft and proving stable Host attachment, then real empty→typed→Wiki/VLANG→clear evidence and Win32 menu acceptance. Never mark CS-083 as device-verified merely because a binary links. Subsequent GitHub `main` commits require their own exact-SHA checks.


## R004 — native deterministic argument preview (2026-11-22)

- **In existing command architecture:** `native/gpui-desktop/src/control.rs` now projects Host-typed `candidate.args` as bounded inert GPUI hints, without a second NLP grammar or LLM dependency. Risk R2/R3 values are masked; invalid fields/control characters fail closed. Source: `e4f509f`, corrected regression `1324cc2`.
- **Verified isolated Windows tests on exact `1324cc2`:** GPUI Rust library **45/45 PASS** and four-file deterministic Host/NLP **27/27 PASS**, exit 0. These do not prove physical GUI acceptance or an active provider.
- **Native desktop build:** exact `1324cc2` `cargo build --features desktop --offline --locked` **UNVERIFIED**, deliberately terminated after 570.52 seconds while compiling Rust core; no compiler diagnostic. See [R002/R004 evidence log](DEV-CYCLE-NATIVE-VLANG-R002-20261122.md). The older `e3f8b0d` binary did build successfully, but it does not certify newer source. No launcher/phone URL change and no live-device parity claimed.
- **No duplicate ownership:** another agent implements PC→phone handoff; this slice supplies its read-only VLANG argument projection and leaves Host effects/approvals unchanged.

## Native PC→phone draft proposal — R004 (2026-11-22)

- **Cloud integration (GitHub `main`):** `0cfd4c9a81d3cb910d5dc1e02bed216adfd05927` (`native/gpui-desktop/src/control.rs`) reuses the existing Host owner capability, `/api/host/live-system` and `/api/host/live-system/composer/stage` followed by `/api/host/control/plan`. It enforces owner/private/visible/non-composing current phone source, the real writable `pwa.composer.draft.set` action, exact epoch/sequence/view/source fences, 1000 UTF-8 byte limit, SHA-256 staged digest, nonce correlation and a returned R1 Control approval-required plan. It never calls Control execute.
- **Native UI:** `cb8bb7de3daf7608af98693e30ab815ff46964fe` and `13892cbca7a6c8213f21dcbb6a2b131cdbbec079` provide a Devices-panel button and reuse the same GPUI Input entity. The proposal remains inert until the owner separately approves its exact Host plan in Control. New PC edits discard an old phone plan, and Host independently rejects raced/stale phone revisions during execution.
- **No duplicate architecture:** the existing phone composer bridge, Control plan/approval/execute/receipt and Host revision graph remain authoritative. This is explicit, owner-reviewed handoff, **not automatic continuous PC↔phone sync** and not an extra state store.
- **Verification:** source present on GitHub `main` and exact detached Windows checkout `C:\\0-BlackBoxProject-0\\.arbor-gpui-releases\\verify-13892cb` at `13892cbca7a6c8213f21dcbb6a2b131cdbbec079`; `rustfmt --edition 2024 --emit stdout` parsing both changed Rust files **PASS exit 0**. `node --test` over existing `agent-composer-bridge.test.mjs`, `vlang-command-compilation.test.mjs`, and `composer-assist.test.mjs` **PASS 13/13 exit 0**. The exact Rust cargo library run entered **waiting for build-directory file lock** (other Cargo/Rust compilers present), so no Rust library PASS or desktop-feature compile is claimed until its output is collected. No fresh native UI or Android device evidence.
- **Acceptance:** CS-052 retained source admission; CS-055 has a **CODED explicit proposal substep** but remains TODO for observed authorized phone delivery. CS-056–060 and CS-091–100 remain unverified. Preserve running GPUI instance, existing Host and phone URL; do not promote the native executable without real device acceptance.

## R005 — real GPUI cutover and volatile bootstrap observation (2026-11-22)

- Real Windows cutover: DESKTOP-9KB03LU gracefully closed old GPUI PID 16832 and started the verified 5f0b4d4 native executable as sole GPUI PID 15536, preserving existing Host PID 15232, loopback port 43187, native HWND 984820. Binary SHA256 F3C3A31F4D01DB9D28CBB6F3A365750F73CF357D9B06ED0A9333ED5CD70DEE84; 51,323,904 bytes. No second Host, changed phone URL, new launcher or browser runtime. Rollback executable retained.
- Pinned native tests: GPUI 45/45 PASS; six-file Host/NLP/Oracle 41/41 PASS. Some direct native-parity subchecks remain UNRUN.
- Foreground evidence: %LOCALAPPDATA%/VIVIM/Screenshots/gpui-cutover-5f0b4d4-empty-20261122.png (SHA256 34B310C4F0DE2239BAC31ED198AA6E45F09E93EDA440312ED0CA5D0CBE1DC3D8) showed the graphite First Contact canvas, one bottom composer, seven GPUI fallback menu groups. Does NOT prove actual Win32 menu painting.
- Physical OS input 'wiki' visibly reached the composer and opened inert Wiki/VLANG context. Capture gpui-cutover-5f0b4d4-typed-wiki-20261122.png (SHA256 951EA06A9996AF202BEAE7982337174A1FF742693156DA14506A8925C2C4859B). Wiki showed 'source unavailable'; the attempted clear screenshot was refused because foreground focus changed. No false cleared-state proof.
- Root-cause readback: owner-authenticated Host Wiki GET returned HTTP 200, revision 1, two pages; consecutive bodies identical. PWA view GET returned source-backed HTTP 200 but successive snapshots differed solely at snapshot.bootstrap.observedAt. The exact structural comparison therefore refused a coherent Wiki. Host live-system separately returned HTTP 503, so PC-phone sync remains unproven.
- Cloud Rust fix: 7a5ade3d51a3f87f1ded91f0803e19cd09f732ae changes only GPUI snapshot coherence comparison to disregard that single observation timestamp and still refuse every substantive Wiki/control/device/bootstrap generation or phase drift. Added regression tests for accepted clock drift and rejected actual drift.
- Deployment of fix: verifier checkout pinned to 7a5ade3, Rust test queued behind another agent's shared Cargo build lock. No new Rust PASS, new executable or on-device AutoWiki repair claimed until the exact pinned test/build/relaunch and screenshot are complete. Active GPUI still runs the 5f0b4d4 build.

## R006 — live AutoWiki source-backed visible acceptance (2026-11-22)

- **Source and build:** existing verifier checkout `C:\\0-BlackBoxProject-0\\.arbor-gpui-releases\\verify-e3f8b0d` pinned to `7a5ade3d51a3f87f1ded91f0803e19cd09f732ae` (Host bootstrap observation-clock coherence fix). Existing shared-target Cargo native `--features desktop --offline --locked` build **PASS exit 0**, executable `gpui-shared-target\\debug\\vivim-gpui-desktop.exe`, **51,404,288 bytes**, SHA256 `2C298C4ABD73FA464149F7B9D4AB2FD5D8B3FCD2E140069FD87523B82F08E9AB`. Pinned GPUI Rust library **48/48 PASS** (prior queued test); earlier 41/41 targeted Host tests were on earlier source `5f0b4d4`, not misattributed to this revision.
- **Existing Host preserved:** another lane had already launched single Host from `.arbor-pwa-releases\\10006454b433\\apps\\vivim-host\\server.mjs` as Windows PID **14900**, listening on original `127.0.0.1:43187`. Preflight status HTTP **200**. The earlier PID 15232 was no longer running at the start of this cycle; no additional Host was spawned.
- **Native GPUI launched:** no prior GPUI process, started the verified binary as sole GPUI **PID 15232**, Win32 main-window handle **1770232**. One native GUI process, one existing Host, no new checkout/runtime/shortcut or phone URL change.
- **Real-device visual sequence, verified by inspecting actual screenshots** under existing `%LOCALAPPDATA%\\VIVIM\\Screenshots`:
  - `gpui-autowiki-7a5ade3-before-20261122.png`, SHA256 `E71CBEE8D765C75D7CB41EFC2BCEC6EEDA5A84345535CA874877999CABC89E87`: blank graphite First Contact and single empty bottom composer.
  - `gpui-autowiki-7a5ade3-typed-20261122.png`, SHA256 `1B4C8B3B96114AF0DA2F336783B04A9E21DE7BA999163BA9A0C8C0B0D7F22BA1`: native OS keyboard typed `wiki`; AutoWiki displayed **3 real source-backed matches, revision 1** (Main/About, Main/HowTo, Main/Sources); inert VLANG displayed no deterministic command match and **no action taken**.
  - `gpui-autowiki-7a5ade3-cleared-20261122.png`, SHA256 `A9BC150CB511DF7A35CC39128365931090E2C9308B0FA67268BB2D6294A7848F`: real Ctrl+A/Backspace restored empty composer and removed contextual Wiki/VLANG cards.
- **Acceptance disposition:** actual blank→type→AutoWiki→clear interaction **PASS on Windows GPUI**. GPUI fallback seven-section File/Edit/View/Tools/Developer/Settings/Help menu visibly rendered; real Win32 native menu painting, menu interactions, Android and PC↔phone revision/effect delivery remain **UNVERIFIED**. This test confirms read-only local Host Wiki coherence and inert command preview, not approval or execution authority.

### R004 exact-SHA Windows verification recovery — 2026-11-22

- **Exact source:** `13892cbca7a6c8213f21dcbb6a2b131cdbbec079`, detached Windows checkout `C:\\0-BlackBoxProject-0\\.arbor-gpui-releases\\verify-13892cb`; application source untouched.
- **Rust library:** `cargo test --manifest-path native/gpui-desktop/Cargo.toml --lib --offline --locked` **PASS 47/47 exit 0**; prior shared Cargo lock released and the phone owner/stage safety tests passed.
- **Desktop compilation:** `cargo check --manifest-path native/gpui-desktop/Cargo.toml --features desktop --offline --locked` **PASS exit 0**; only upstream `proc-macro-error2 v2.0.1` future-compat warning.
- **Host regression:** `node --test` over `agent-composer-bridge.test.mjs`, `vlang-command-compilation.test.mjs`, `composer-assist.test.mjs` **PASS 13/13 exit 0**.
- **Executable link:** `cargo build --features desktop --offline --locked` **BLOCKED exit 1** because Windows rejected replacing the existing shared-target `vivim-gpui-desktop.exe` (`os error 5: Access is denied`). A running native app was observed; do not kill the current session to force a pass. Use isolated alternate target for next build. No Rust compiler diagnostic was emitted.
- **Visual evidence:** inspected `gpui-cutover-5f0b4d4-typed-wiki-20261122.png`: native typed `wiki` and inert no-match feedback are visible; AutoWiki says source unavailable. This predates `7a5ade3` timestamp-drift fix and cannot verify it. No permanent launcher/phone URL replacement performed here.

## R007 — physical File menu and inert deterministic VLANG preview (2026-11-22)

- **Same native process as R006:** sole GPUI PID 15232 on the original build hash `2C298C4ABD73FA464149F7B9D4AB2FD5D8B3FCD2E140069FD87523B82F08E9AB` with the existing single Host on port 43187. No application-source edits, new process or runtime introduced.
- **Real File-menu mouse acceptance:** clicked the GPUI-rendered File item at screen coordinates (114,86); image `%LOCALAPPDATA%\\VIVIM\\Screenshots\\gpui-menu-file-7a5ade3-20261122.png`, SHA256 `BAF62521A55D074E1B6CD79C01CE2B4A8C0613DFC39761407B77F1A44B801E1D`. Reviewed pixels show File opens two menu entries: "First Contact" and "Refresh sources". **GPUI fallback menu interaction PASS**; actual Win32 native menu painting is still UNVERIFIED.
- **Real deterministic user-language command preview:** mouse clicked existing composer and OS keyboard typed `Set my theme to dusk`. Image `%LOCALAPPDATA%\\VIVIM\\Screenshots\\gpui-vlang-theme-preview-7a5ade3-20261122.png`, SHA256 `0FC399A5147F8A240B34E0D562DB77990708D1C8175140DB3F672D77E725CADD`, visibly shows `Recognized: ui.theme.set_preset · arguments: preset=dusk · R1 · submit for a separate approved plan`. The native command interpreter matched without an LLM; typing produced **inert preview only**, and the test did not invoke plan approval or execution. The Wiki panel showed 0 matches at revision 1, not a source error.
- **Cleanup limitation:** attempted to send Ctrl+A/Backspace/Escape to remove the theme test draft, but the Windows Desktop Commander command guard rejected the command before running it (PowerShell command check timeout). **Theme draft may remain visible; do not claim cleared**. The earlier `wiki` typed-and-cleared cycle in R006 was separately photographed and accepted.
- **Remaining gates:** Win32 native menu painting, authoritative phone pairing and bidirectional PC-phone synchronization/receipts remain unverified. Preserve the current single app/Host and existing phone URL; do not duplicate development infrastructure.


## R006 — Active PWA Host missing native live-system kernel (2026-11-22)

- **Observed on Windows, read-only:** Host listener `127.0.0.1:43187`, process observed as the Host `server.mjs` from pinned PWA checkout `10006454b433efd53affc74e5e7a3d6518f96432` (`.arbor-pwa-releases/10006454b433`). All five binary locations searched by the existing `resolveBundledRustBinary('vivim-product-pure')` were absent in that checkout. Existing root `ARBOR/target/debug/vivim-product-pure.exe` is in a **different checkout** and must NOT be copied into the active release without same-source validation. GPUI process was **not running at the inspection instant**; Host listener remained active. No live process restarted or swapped.
- **Existing packaging gate invoked without mutation:** `node tools/packaging/prepare-host-runtime.mjs --verify --dir <active PWA checkout>` returned `ok:false`, **13 contract problems**, including the missing `native/bin/vivim-product-pure.exe`; runtime manifest also absent. This is an ad hoc source checkout, **not** an accepted frozen runtime. The prior HTTP 503 live-system observation is consistent with the absent native dependency; no owner-authenticated new HTTP 200 is claimed.
- **Cloud source fix (no replacement engine):** `2309f1828ec6e28c48a52143f50b53ee20217a1c` distinguishes an existing `NATIVE_NOT_PACKAGED` response in the Host live-system read port; `7725de4de89960da5ec24b8a853b986f8f1139ef` returns only the bounded owner-authorized `LIVE_SYSTEM_NATIVE_NOT_PACKAGED` code on HTTP 503, with no paths, logs, secrets or effect authority. Other unavailable states remain generic and fail closed.
- **Existing test/packaging contract strengthened:** `b8f40205a4d0da5a925dd9094a3e2c379e99a71f` exercises absent kernel refusal; `87143c69a587d1456d01b148735d37785ad0a7f4` adds targeted proof to the incumbent D05 runtime verifier; `384c6368a44d9934b9fce112b29c6e3e952a08eb` repairs a pre-existing hash-test fixture to modify bytes without modifying length (the original test incorrectly expected a digest failure from a file-size change).
- **Exact-code verification:** isolated detached Windows checkout `verify-livecore-87143c6` switched to `384c636`; `node --test apps/vivim-host/test/live-system-read-port.test.mjs scripts/batch-evidence/D05-packaging.test.mjs` **PASS 17/17, exit 0**. `node --check apps/vivim-host/server.mjs` and the four-file deterministic NLCL/VLANG suite **PASS 27/27, exit 0**. Independent native-binary crosschecks explicitly remain UNRUN. The first 16/17 test failure was a test fixture issue and was corrected/retested. No application source edited in the local dirty workspace.
- **Release blocker:** the active PWA checkout has no pinned Rust product kernel and no frozen manifest. Canonical GitHub root currently lacks `Cargo.lock` and `bun.lock`; the *existing* frozen packager requires both. **Do not bypass** the frozen build, mix binaries from unrelated SHAs, create a new MCP daemon, claim Wiki live parity, or change the owner phone URL. Required next delivery: produce/review both lockfiles, build the existing `vivim-product-pure` and other packager-required native binaries from the same pinned source, stage through `prepare-host-runtime.mjs`, verify complete manifest, then make a controlled Host/GPUI cutover and owner-authorized HTTP+physical Wiki/phone acceptance.
- **Status:** Source diagnostics and regression gates **CODED / PUSHED / TESTED**; **active deployed release not repaired**, `/api/host/live-system` HTTP 200 and AutoWiki/PC↔phone physical acceptance **UNVERIFIED**. Preserve existing Host, drafts, binary rollback, mobile URL and launcher.

## R008 — combined GPUI / mobile source verification (2026-11-22)

- **Pinned source:** `2b2b47764544a9b09a537aafdf060e037e42b9db` in detached Windows test checkout `C:\\0-BlackBoxProject-0\\.arbor-gpui-releases\\verify-2b2b477`. This includes the native explicit PC→phone proposal and the later Host Wiki snapshot coherence fix. Do not assume current moving `main` has the same head.
- **Host/mobile/phone integration tests:** `node --test` over `agent-composer-bridge.test.mjs`, `direct-phone.test.mjs`, `composer-assist.test.mjs`, `provider-handoff.test.mjs` **PASS 19/19, exit 0**.
- **Broader PWA safety and surface tests:** `node --test` over `ux-surfaces.test.mjs`, `chat-universal-controller.test.mjs`, `build-vec-routing.test.mjs`, `mobile-first-entry.test.mjs`, `diagnostics.test.mjs` **PASS 58/58, exit 0**. These tests include pairing, offline privacy, Today/World/Me surfaces, revocation, truthful Host readbacks, media and plan boundaries. **77/77 targeted Node tests total** on this exact source.
- **Native binary build:** avoided the `os error 5` occupied shared executable by creating isolated `C:\\0-BlackBoxProject-0\\.arbor-gpui-releases\\verify-2b2b477-target` with `CARGO_INCREMENTAL=0`. `cargo build --features desktop --offline --locked` launched on the exact worktree, compiling dependencies; **BUILD IN PROGRESS at this receipt, no PASS/FAIL claimed**. No active GPUI/Host termination or launcher change.
- **Independent device facts from R006/R007 (not attributed to this still-building binary):** real Windows native typing `wiki` showed three source-backed Wiki hits at revision 1; `Set my theme to dusk` showed inert `ui.theme.set_preset` argument preview; GPUI fallback File menu physically opens. The Win32 painted menu and PC↔phone effect/receipt remain unverified.
- **Open gate:** complete the isolated exact-SHA link/build receipt; only then plan any guarded foreground swap with unsaved drafts preserved. Real Android and PC↔phone revision/receipt acceptance not covered by green offline tests.

## R009 — PWA protected shell activation and deployment drift (2026-11-22)

- **Cloud source owner:** directly updated existing PWA modules and regression tests on canonical GitHub `main`, without creating a new renderer, data store, effect engine or secondary branch. Exact tested source commit: [`8bf5c76bd0ded654abdcefe601b5b89090ac4eb2`](https://github.com/owenservera/ARBOR/commit/8bf5c76bd0ded654abdcefe601b5b89090ac4eb2).
- **Source paths:** `apps/mobile-relay/app.js`, `apps/mobile-relay/ux/local-notes-ui.mjs`, `apps/mobile-relay/ux/voice-capture.mjs`, plus focused tests in `test/pwa-activation-readiness.test.mjs`, `test/pwa-local-notes.test.mjs`, `test/pwa-voice-capture.test.mjs`.
- **Behavior:** existing service-worker takeover waits for a safe foreground state. An unsent composer draft, active `S.sending`/`N.sending`, pending Host transport work, pending approvals/files, an open or unsaved Quick Capture note, or active/unreviewed local microphone/dictation now defers reload. Existing `controllerchange` and safe retry mechanisms remain authoritative. No automatic send, Host write, cloud voice fallback or draft migration was introduced.
- **Exact-SHA independent Node verification:** preserved the dirty root ARBOR working tree and created an isolated source archive in `C:\0-BlackBoxProject-0\.arbor-pwa-releases\verify-8bf5c76\src` from a fetched `origin/main` commit. On Windows Node v24.22.1, command `node --test` over `pwa-activation-readiness.test.mjs`, `pwa-voice-capture.test.mjs`, `pwa-local-notes.test.mjs`: **PASS 18/18 exit 0**. Command `node --test` over `service-worker.test.mjs`, `pwa-source-coherence.test.mjs`, `wiki-live-context.test.mjs`, `agent-composer-browser.test.mjs`: **PASS 40/40 exit 0**. Total focused tests **58 PASS / 0 FAIL**. Not a complete workspace Rust/release test.
- **Live drift observation, read-only:** Host listener `127.0.0.1:43187` PID 1940; `GET /mobile/sw.js` and `GET /mobile/app.js` both HTTP 200. The served worker advertises `vivim-relay-shell-v41`, but served `app.js` does **not** include `hasPendingLocalWork`, which proves this source fix is **not active in the current Host PWA**. No deployment or Android phone proof claimed.
- **Release/physical gate still BLOCKED:** active frozen package/runtime must be source-pinned with required Rust kernel(s), frozen manifest and verified `Cargo.lock`/`bun.lock`, using the existing `tools/packaging/prepare-host-runtime.mjs`. No borrowing unrelated native EXEs, no forced swap of Host, launcher, old GPUI, phone URL, or existing private work. Only then prove owner-authenticated `/api/host/live-system` HTTP 200 and actual GPUI↔phone source revisions, rendered acknowledgment and Control receipts. Win32 menu painting and Studio provider round trip remain separate gates.
- **CI:** recent GitHub Actions still `startup_failure` before jobs; existing issue #24 tracks this infrastructure defect. Focused Windows Node PASS does not certify CI, release or physical device acceptance.
- **Disposition:** protected mobile shell activation **CODED / PUSHED / TESTED**; **NOT DEPLOYED / NOT PHONE VERIFIED**. Existing CS-051–060 and CS-091–100 remain open. Next source owner must not start a second sync implementation.

## R010 — Integrated GPUI titlebar visual owner acceptance (2026-11-22)

- **Owner instruction:** File/Edit/View/Tools/Developer/Settings/Help share the same topmost Windows titlebar, NOT a separate row beneath the blue OS caption. Source implemented on canonical `main` at [`e2e6902c183c8b88dd1f09d825d0594f1da30b8a`](https://github.com/owenservera/ARBOR/commit/e2e6902c183c8b88dd1f09d825d0594f1da30b8a), `native/gpui-desktop/src/main.rs`: GPUI transparent Windows titlebar with native drag/minimize/maximize/close hit-test regions, one GPUI-drawn menu row; no Win32 HMENU during normal startup, no new Host or mobile state.
- **Exact-source isolated Windows build:** `cargo test --features desktop --bin vivim-gpui-desktop --offline --locked` **2/2 PASS exit 0**; `cargo build --features desktop --bin vivim-gpui-desktop --offline --locked` **PASS exit 0**, using previously resolved local GPUI Cargo.lock only in isolated test checkout. Executable SHA256 `10B792DDE0F5E993AE17A9BA4735E74C5AA472E958BDE3580AFD743542158CA2`.
- **Physical screenshot:** native candidate PID 19052 on DESKTOP-9KB03LU, captured actual foreground GPUI window `%LOCALAPPDATA%\\VIVIM\\Screenshots\\gpui-integrated-single-titlebar-e2e6902-20261122.png`, SHA256 `86CAD61F862A015D02F35795C15CD37B922418225BA022A53AAEE6334CD1D1E2`. The image shows VIVIM and all seven sections on one top row, with the bottom composer and no second OS menu band. Read-only `GetMenu` returned 0.
- **Owner acceptance:** user directly confirmed seeing the new integrated row and said `I see it yeah thats ok`. Treat single-row visual placement as **OWNER VISUALLY ACCEPTED**. Do not make unsolicited titlebar-spacing/desktop-window-bounds changes to chase non-blocking layout details.
- **Limitations / next checks:** menu command click interactions, drag, minimize, maximize, close, keyboard focus/Alt and Snap behavior are **not yet physically verified** on this exact candidate. Screenshot does not certify these interactions. Permanent launcher and packaged production runtime were not changed; this is an isolated running GPUI candidate. Preserve rollback and existing Host/phone URL.

## R011 — Owner P0: signed-in AI conversations and safe ChatGPT worker (2026-11-22)

- **Owner priority:** first connect actual user conversations from VIVIM native GPUI and mobile PWA to ChatGPT through already signed-in Studio browser sessions; only then broaden Gemini, Claude, Qwen and other supported accounts. This supersedes more Windows menu polish; previously accepted integrated titlebar is unchanged. Track acceptance and parallel owner/ZCode lanes in [issue #32](https://github.com/owenservera/ARBOR/issues/32).
- **Existing capabilities, not rebuilt:** PWA `apps/mobile-relay/provider-handoff.mjs` already admits explicit `Ask ChatGPT:` and `/ai` provider selection as draft-only; `studio/bin/lib/relay-chat-studio.mjs` already binds a Studio conversation to one claimed bridge command and exact request key; `apps/vivim-host/phone-sessions.mjs` and `apps/vivim-host/chat/provider-projection.mjs` retain Host read-model authority and readiness gates. No new provider API, second browser controller, or GPUI effect writer.
- **Read-only live inventory:** Host port 43187 PID 1940 and Studio port 38730 PID 1476 respond. Studio GET `/api/v1/conversations` returned 73 records (59 closed, 6 blocked, 4 needs-reconciliation, 3 ready, 1 busy). No browser owner restart, session dismissal, or historic provider-send retry performed. Before this round, chatWorker heartbeat was October-stale; ledger snapshots showed 9 historic relay-chat IDs (2 queued, 2 failed, 5 done).
- **Source fix:** exact source `bfc80122ab1cdd4bd070ab7ad41a33a6f4158241` on GitHub main; `studio/bin/relay-chat-mvp.mjs`, `studio/src/studio/relay-chat-startup-fence.mjs` and `studio/test/unit/relay-chat-startup-fence.test.mjs`. The startup fence scans all historical bridge record IDs before any queue claim, rather than assuming a 200-record preview is exhaustive, and refuses corrupt/torn or changing ledger. Historic requests cannot silently send on a new worker start. No credentials or prompt text logged.
- **Tests:** 5/5 startup-fence Node tests passed on isolated exact-SHA Windows snapshot; combined composer selection/thread identity/startup-fence tests **15/15 PASS**, mobile provider-handoff tests **6/6 PASS**. Exact commands `node --test studio/test/unit/{capture-conversation-composer-selection,capture-conversation-thread,relay-chat-startup-fence}.test.mjs` and `node --test apps/mobile-relay/test/provider-handoff.test.mjs` in separate immutable source archives. No live user/provider send was attempted.
- **Live worker now running:** Node PID **20112**, Studio-mode `--root C:\VIVIM --studio-url http://127.0.0.1:38730 --transport direct`, staged from exact GitHub source under `C:\0-BlackBoxProject-0\.arbor-studio-releases\studio-relay-bfc8012`. Heartbeat `chatWorker` reports outcome `ok`, only supported provider `chatgpt`. Startup log confirms **9 historic IDs fenced**. The old 2 queued/2 failed/5 done counts are unchanged after startup, so no historic messages were submitted. This is WORKER LIVE, not REPLY VERIFIED.
- **Open blockers:** The currently running Studio browser owner is an older source release and one Studio conversation is busy. Never restart it merely to load the new ChatGPT typing readback selection fix. Previously uncertain `CREATION_UNPINNED/TYPING_UNCONFIRMED` ChatGPT send must stay non-retried until reconciled. Before any ChatGPT completion claim require a **new owner-initiated, explicitly chosen** turn: fresh signed-in check, one exact-key submission, current thread pin, settled verified reply, Host ledger receipt, phone render acknowledgment and then GPUI conversation display. Other provider modes require their own verified transport/readback capability; don't advertise from adapter presence.
- **Parallel work allocation:** ChatGPT cloud/GitHub main owns source changes and orchestration; ZCode and Desktop Commander only deterministic local tests, read-only snapshots and proposed regressions, no unbounded agents or provider effect. Prior ZCode model 429 and lack of vision acceptance remain honest limitations.
- **Disposition:** ChatGPT cold-start protection CODED/PUSHED/TESTED, browser Studio-mode chatWorker LIVE and heartbeat verified; PWA handoff source TESTED; actual ChatGPT send/reply, same-thread continuation, GPUI render, Android render, production Studio source promotion and multi-provider parity **UNVERIFIED**.

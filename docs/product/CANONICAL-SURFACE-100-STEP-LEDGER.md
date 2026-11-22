# VIVIM / ARBOR — 100-Step Canonical Surface Execution Ledger

**Owner directive:** 2026-11-22. **Authority:** [ONE-CANONICAL-LIVE-SURFACE.md](ONE-CANONICAL-LIVE-SURFACE.md). **Goal:** One First Contact surface, native GPUI on PC, PWA on mobile, Host sole state/effect authority; no browser UI on Windows.

**Ownership:** ChatGPT Cloud Dev commits Rust-first source directly to ARBOR `main`; ZCode and Desktop Commander perform authorized local read-only observation, post-push build and on-device acceptance. No second source coder or parallel UI.

**Workflow:** Each task goes `TODO → IN_PROGRESS → CODED → VERIFIED`, with `BLOCKED` as needed. Record commit SHA, device, exact test, screenshot and result. Static compile != actual Windows acceptance. No silent 100-task completion claims.

**Baseline:** Win32 HMENU with seven categories/command mapping verified; 37/37 GPUI library tests PASS and desktop build PASS. Real painted menu nonclient region, Alt/mouse access, two-device sync UNPROVEN. Isolated source `f2322bf`.


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

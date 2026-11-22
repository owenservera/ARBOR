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

# ARBOR / VIVIM — FULL ENGINEERING HANDOFF
**Date:** 2026-11-22 · Europe/Madrid  
**Snapshot HEAD before this handoff:** `e7f0ed8e7ec59fa3eeac86fe7e8f18ba0dd26d6c` on `owenservera/ARBOR` `main`. **Refresh HEAD before any change; do not pin future work to this snapshot.**  
**Program:** Canonical GPUI / PWA surface, Host/AutoWiki, VLANG + natural-language-to-command, TierFlow→Rust migration, Windows app shell, ZCode continuous improvement.  
**Status:** Source work underway; native compilation and targeted tests passed on a prior exact source SHA; physical Windows + Android parity NOT accepted; no full release/promotion.

> **Read this document first.** Then read `AGENTS.md`, [ONE-CANONICAL-LIVE-SURFACE.md](ONE-CANONICAL-LIVE-SURFACE.md), [the 100-step execution ledger](CANONICAL-SURFACE-100-STEP-LEDGER.md), and [ZCode VLANG iteration mission](ZCODE-VLANG-NLP-AUTOWIKI-ITERATION-R001.md). This is a transfer-of-control document: it does not authorize a new source owner, new runtime, permission model, provider spend, or unconditional physical cutover.

## 0. TL;DR: where we are and what to do next

**What is working in source:** a Windows GPUI executable, First Contact as the default clean page, a shared app-level menu catalog, a real Win32 HMENU adapter, developer screenshot/report actions, live Host/Wiki source reads, bounded Wiki refresh after typing, and an **inert** command interpretation preview through the *existing* Host deterministic NLCL/VLANG path. Existing Host approval/receipt path is reused, not duplicated.

**Verified:** on Windows test checkout SHA `3beaf36b7a955fd514bb80ad45bf347630e4bec1`, `cargo test --manifest-path native/gpui-desktop/Cargo.toml --lib --offline` **41 passed / 0 failed**; `cargo check --manifest-path native/gpui-desktop/Cargo.toml --features desktop --offline --locked` **PASS**; four targeted Node files **26 passed / 0 failed** (with explicit native-binary checks UNRUN within those tests). Actual deterministic Host sample: `create wiki page notes` → `candidate wiki.page.create` R1; `edit wiki section notes/tasks saying item` → `candidate wiki.section.edit` R1; `stop all traffic` → clarification, not a destructive command.

**Not yet verified:** the latest full GUI with a human typing into GPUI; AutoWiki results appearing from real persisted user Wiki; the new VLANG preview visibly updating and invalidating on the real window; correct physical mouse/Alt-key Win32 native menu painting; Android/PC simultaneous bidirectional updates; one-native-launcher promotion. Do not conflate a cargo PASS, `GetMenu(hwnd)`, `WM_COMMAND` injection, or an API response with end-to-end GUI acceptance.

**Top next slice:** get a release built from refreshed main, launch isolated GPUI (no Edge), take *foreground, app-bounded* evidence; physically type three read-only/draft-only inputs and verify Wiki + VLANG; fix actual identified defects in Rust on GitHub main, recheck; run independent deterministic ZCode test loops even if models remain unavailable.

## 1. Owner rules — supersede earlier conflicting plans

1. **ONE VIVIM SURFACE → ONE CANONICAL STATE MODEL → MULTIPLE SYNCHRONIZED VIEWPORTS.** GPUI is Windows master **authoring/control and native rendering**; phone PWA is a responsive rendering of the same revisioned VEC/LiveSurface semantics. Do **not** literally stream GPUI pixels to mobile or hand-maintain another separately authoritative mobile product.
2. **Host is sole persistence/effect authority** for authentic user state, permissions, plan/grant, explicit approval, effect, receipt and recovery. GPUI master does **not** make GPUI the effect authority. User typing or model suggestions cannot authorize or send effects.
3. **First Contact before expansion:** the default desktop product canvas is blank graphite with the one bottom composer, like the last successful Edge/PWA reference. AutoWiki and command hints are contextual after typing; Host status, other panels, debug controls and device reports belong to *Windows app shell*, not an empty product home.
4. **Windows topmost app shell** has File / Edit / View / Tools / Developer / Settings / Help. Put screenshot, source/Host/Wiki/VEC inspection, native preferences and future PC-only tools here. This chrome is outside the shared phone product. The GPUI-drawn bar may be a visual fallback to ensure discoverability while native Win32 HMENU paint remains broken.
5. **TierFlow capabilities migrate into Rust-led shared VEC/GPUI**, incrementally with exact parity proofs. Do not throw away working TierFlow/PWA source first. GPUI drawing and mobile HTML renderer are different *projections* of the same canonical semantic contract, not a split state tree.
6. **Rust first; TypeScript 7+ for web/tooling exceptions.** Do not add a second parser, Host, bus, graph, database, journal, planning engine, browser shell, Tauri app, WebView or external effect authority.
7. **ChatGPT Cloud Dev owns source engineering**, directly on `owenservera/ARBOR` `main` via GitHub tools. No routine branches or PRs. Before every edit fetch latest HEAD and file SHA; preserve concurrent work. No source patches/commits via Desktop Commander or ZCode. Remote Desktop Commander = read local context and **post-push authorized Windows verification**.
8. **ZCode must improve product behavior, not just produce SITREPs**, but initially as independent read-only bounded observers, deterministic test runners, reproducers, regression-test proposals and verifiers. A ChatGPT owner applies source fixes. Do not launch the older `arbor-life` *write-capable* mode unchanged. A genuinely delegated write lane requires an explicit later owner decision, disjoint file ownership and integration contract.
9. **No free model = no silent paid model fallback.** ZCode pilot `openrouter-2/baidu/ernie-5.5-flash-preview:free` returned HTTP **429** upstream. It was stopped. One proposed four-lane program is **NOT** four live workers. Use deterministic tests until a one-scout health/admission test succeeds.
10. **Do not collapse permanent Windows shortcuts or change Android phone PWA URL** until exact-SHA build, physical UI, two-device sync and rollback acceptance pass. Edge is a *historical visual reference*, not a runtime fallback or target PC UI.

## 2. Repositories, owners, real paths

| Asset | Role | Location |
|---|---|---|
| **ARBOR** | Canonical integration/source authority | `https://github.com/owenservera/ARBOR`, branch `main` |
| **vivim-labs** | Research/operations references | `https://github.com/owenservera/vivim-labs` |
| GPUI desktop | Native Windows app + Host supervisor | `native/gpui-desktop/` |
| Shared Rust product language | VEC, Wiki, commands, meaning, source revision | `core/programmability/src/` |
| Host | Server, control routes, receipt/journal, live-system feed | `apps/vivim-host/` |
| PWA | Responsive First Contact product renderer | `apps/mobile-relay/` |
| ZCode existing workflows | Old DWFs; **read before running** | Local `C:\0-BlackBoxProject-0\ARBOR\.zcode\workflows` |
| Existing ops design | DWF parallel patterns / orchestration / lane specs | Local `C:\0-BlackBoxProject-0\vivim-labs\ZCODE-DESKTOP-COMMANDER-OPERATIONS\CONTINUOUS-IMPROVEMENT-FLEET` |
| Immutable GPUI Windows test checkout | Post-push build / runtime test, **not source editing venue** | `C:\0-BlackBoxProject-0\.arbor-gpui-releases\13c200e94b08` |
| Local Host default base | Existing owner Host, not second server | `http://127.0.0.1:43187` (only when live) |
| Native screenshot output | Explicit owner-requested PNG | `%LOCALAPPDATA%\VIVIM\Screenshots` |
| Bounded local diagnostic reports | Owner-requested, no draft text/secrets | `%LOCALAPPDATA%\VIVIM\Diagnostics` |

Last observed Desktop Commander device: `DESKTOP-9KB03LU`, device id `459ecfaf-a8aa-4836-84c5-d973d62c3722`. This **is not a guarantee the device, Host or executable is currently online**. Check every new session. The isolated test checkout may have untracked screenshot/log/lock evidence; do not `git clean`, reset, overwrite, or forcibly delete it. The phone URL and Windows desktop shortcuts were intentionally left unchanged.

## 3. Architecture / data and effect paths

```text
 Windows GPUI native app                                    Android PWA
 ┌───────────────────────────────────────┐       ┌───────────────────────────┐
 │ Windows app chrome: File...Developer  │       │ responsive mobile renderer│
 │ one GPUI First Contact: composer      │       │ same semantic First Contact│
 │ context: Wiki + VLANG meaning         │       │ same Host source revision  │
 └───────────────┬───────────────────────┘       └──────────┬────────────────┘
                 │                                         │
                 └──────┬──────────────────────────────────┘
                        ▼
              existing Host owner routes
              live-system revisions/deltas
              Wiki journal/context; NLCL grammar
              control catalog/world + source pins
              typed PLAN → explicit APPROVAL
              → sole Host EFFECT → RECEIPT
                        ▲
                        │
             Rust product kernel / VEC /
           TierFlow capabilities migration
```

**Text → command:** the mobile composer-assist and owner Host already use the canonical NLCL deterministic reading. Native `control::interpret_composer` POSTs to **existing** `/api/host/control/interpret` with `{"text":"…","composer":true}`, owner bearer + same Origin/CSRF headers. Server returns `vivim.control-language/1` including `vivim.composer-assist/1`, `authority:"none"`, and outcomes `candidate`, `clarification_required`, etc. GPUI projects **inert** action identity, risk/readiness, a hint, or a clarification; no `plan`, `execute` or auto-send from typing.

**Wiki:** GPUI input updates its local in-memory query immediately and uses `core/programmability::wiki_read::search_view` on the current authenticated Host snapshot. A bounded debounce schedules newer Host readback; the precise source revision/guard must be revalidated, and older asynchronous responses must never overwrite newer input. No fabricated Wiki target, result, or cached/offline placeholder masquerading as current.

**Phone:** existing Host live-system and agent-composer bridge already carry owner-authenticated phone draft data, session and source revision; GPUI consumes a read-only view. PC-origin → mobile writes must use existing Host-approved composer staged action and revision fences, not direct local API-authority improvisation. Do not claim full bidirectional phone sync merely because GPUI reads phone state.

## 4. Product source map — first code files to open

| Source | What it controls / current status |
|---|---|
| `native/gpui-desktop/src/main.rs` | GPUI `Desktop`, menu, First Contact, semantic/Wiki input observers, bounded source refresh, read-only phone projection. ~1,534 lines at snapshot. `on_composer_changed`, `read_composer_semantics`, `refresh`, `render`, and `main` are the immediate product debugging points. |
| `native/gpui-desktop/src/first_contact.rs` | Phone draft parsing, `WIKI_COMPOSER_DEBOUNCE`, `WIKI_REFRESH_MIN_INTERVAL`, delayed refresh policy; pure regression tests. |
| `native/gpui-desktop/src/control.rs` | Owner-authenticated Host control client; plan/execute/receipt; newly added `ComposerMeaning` projector and inert `interpret_composer`. |
| `native/gpui-desktop/src/native_windows_menu.rs` | Real Win32 `HMENU`, `WM_COMMAND` to canonical `desktop_menu` catalog; `SetWindowPos(SWP_FRAMECHANGED)` frame calculation; **native visual admission experimental only**. |
| `native/gpui-desktop/src/desktop_menu.rs` | Single menu/action catalog for File/Edit/View/Tools/Developer/Settings/Help; no second product navigation. |
| `native/gpui-desktop/src/desktop_capture.rs` | Foreground-gated compositor screenshot; black-GDI screenshot fix; PNG; errors avoid false evidence. |
| `native/gpui-desktop/src/desktop_settings.rs` | PC-only preferences under APPDATA, privacy-safe default. |
| `native/gpui-desktop/src/lib.rs`, `visual.rs` | Current owner snapshot/Wiki/Vec read ports, revision/coherence guard, render IR. |
| `core/programmability/src/first_contact.rs`, `wiki_read.rs` | Pure product contract and real source-backed Wiki search. |
| `core/programmability/src/command_intent_projection.rs`, `command_program.rs`, `control_planning.rs`, `command_ai_guard.rs` | Pure Rust command projections/typed programs and guarded AI candidates; **not** new independent NLP grammar/effect engine. |
| `apps/vivim-host/control/intent-planner.mjs`, `command-intent.mjs` | Existing Host NLCL interpretation/catalog/world and safety. |
| `apps/vivim-host/control/action-catalog.v1.json` | Canonical actions, readiness, risks; **v16** observed. Never fabricate an action or upgrade source_wired to device-verified by assertion. |
| `apps/mobile-relay/composer-assist.mjs` | Inert shared semantic draft assistance; suggestions/slots, existing identity and revision semantics. |
| `apps/vivim-host/server.mjs` `handleControl` | `POST /api/host/control/interpret` (with `composer:true`), plan, execute, authentic owner auth. |
| `apps/vivim-host/control/agent-composer-bridge.mjs` | Existing phone draft observation/staged delivery and ACK; do not add a parallel bus. |
| `apps/mobile-relay/first-contact-composer.ts` | Current phone PWA observation and receiver glue. |
| `apps/mobile-relay/app.js`, `index.html` | Proven First Contact visual/behavioral baseline; reference, not GPUI browser embed. |

**Critical caution for incoming dev:** `main.rs` currently couples semantic meaning refresh to admitted `wiki_query` (160 visible-char search limit) and uses `semantic_pending` / `semantic_busy` for latest-input wins. Verify long-but-valid (161–1000 UTF-16 units) NLP requests, IME events, stale completion invalidation, unavailable Host, and approval/read fences before changing this. The current 41 tests verify pure admission/parsing, **not** these GPU/device interactions. Similarly, guard delayed Wiki refresh against busy/read/approval and old-query outcomes; never create a second polling/authority pathway.

## 5. Commits and evidence — do not overclaim

| SHA / source | What changed | Validation status |
|---|---|---|
| `f2322bf9cbff21312fe57b4764a76b4da34c3d0e` | Foreground-composited GPU screenshot after black GDI capture | File with actual GPUI composer pixels observed; nonclient menu region still defective |
| `0541169d0bf99065ec1ea0df124adb5fce377ccf` | Default visible GPUI app menu until actual Win32 acceptance | Coded; human menu proof missing |
| `682d743...`, `5296840...` | Win32 menu frame/geometry check; drawn fallback | Source coded; geometry != visually accepted menu |
| `3ce0800162add4160abcaf6b0f57dadf64c101cd` | Pure debounce/refresh policy | Then tested in native library |
| `756fc169e2013563b26eb06d1d4b99774c1013d4` | GPUI typed-input-driven Host Wiki refresh | Superseded by subsequent delay fix/integration |
| `d5e605a731eb22f0e5a87e63e2dd464788a3fca8` | Delay rather than drop latest Wiki query after a recent Host read | Source coded, test added |
| `e455bb7d96e6e8aac27f573d560010f846dd6866` | Native inert Host composer meaning projector | Rust projector tests PASS |
| `3beaf36b7a955fd514bb80ad45bf347630e4bec1` | GPUI contextual VLANG preview + Wiki debounce scheduling | **41/41 Rust tests PASS; native desktop check PASS** on isolated Windows source SHA |
| `9242d53d582210572feb904405ed1f3c8e2498c5` | Four ZCode VLANG/AutoWiki scout missions | Mission defined, not four workers running |
| `e7f0ed8e7ec59fa3eeac86fe7e8f18ba0dd26d6c` | ZCode pilot evidence: 429 and deterministic fallback | Documentation/evidence commit, not a new binary |

**Exact test receipt from previous session, Windows checkout `3beaf36`:**

```powershell
cargo test --manifest-path native/gpui-desktop/Cargo.toml --lib --offline
# PASS: 41 passed, 0 failed
cargo check --manifest-path native/gpui-desktop/Cargo.toml --features desktop --offline --locked
# PASS: CHECK_EXIT=0
node --test apps/vivim-host/test/vlang-command-compilation.test.mjs apps/vivim-host/test/control-intent-planner.test.mjs apps/vivim-host/test/command-intent-native.test.mjs apps/mobile-relay/test/composer-assist.test.mjs
# PASS: 26 passed, 0 failed
```

Some targeted Node tests explicitly log "native binary unavailable / native parity UNRUN" despite passing their Host assertions. A clean, rebuilt native binary acceptance remains required. Subsequent source/docs commits on GitHub main were **not** all separately built as a release; new handoff changes do not imply deployment.

**Read-only deterministic examples verified against real Host planner:**

| Text | Expected Host meaning | Safety |
|---|---|---|
| `create wiki page notes` | `candidate`, `wiki.page.create`, risk R1, source_wired | **No effect from typing**; submit creates separate plan/approval |
| `edit wiki section notes/tasks saying item` | `candidate`, `wiki.section.edit`, risk R1, source_wired | Same |
| `stop all traffic` | `clarification_required` with "pause only VIVIM outbound activity" vs "disconnect networking for entire machine" | Never silently disconnect network |

Do not use those mutation-like sentences to execute an approved plan during a UI preview test. Testing interpretation is safe; testing execution requires separate authorization, target validation and recorded receipt.

## 6. Current blockers / risky assumptions

### B1 — Native Windows menu paints incorrectly
- A real seven-section Win32 HMENU is attached; `GetMenu`, item count, `WM_COMMAND` dispatch, and `GetMenuItemRect` all passed on an earlier test executable. A programmatically sent About command opened the real GPUI About screen; native screenshot/diagnostic menu commands wrote files.
- **However:** actual screenshots showed Windows Terminal chrome where the nonclient HMENU menu region should render. Geometry probes were positive but pixels were not trustworthy. Human Alt-key/mouse click acceptance is unrun.
- Current `native_windows_menu::visually_ready()` requires `VIVIM_EXPERIMENTAL_WIN32_MENU=1` **and** nonzero Win32 geometry. Without opt-in, the visible **GPUI-drawn app shell remains**; this is an intentional safe fallback, still the *Windows app layer*, never the mobile product tree.
- Fix actual Win32/GPUI nonclient compositor integration; don't remove fallback based on geometry alone. Never change the user's desktop shortcuts during exploration.

### B2 — First Contact GPUI / phone parity not physically accepted
- Binary compilation passes; real owner typing→Wiki rendering, VLANG meaning updates, clear/reset and Android simultaneous state have not been evidenced on current source. Need screenshot/video proof and versioned Host source identity, not screenshot similarity alone.
- Host live-system state is the actual authority; changes must use existing revision/long-poll or staged-delivery interfaces. No direct provider APIs or browser for desktop internal UI.

### B3 — AutoWiki freshness + NLP asynchronous interaction
- Source has direct local Rust Wiki filtering and bounded delayed read; newly added `wiki_refresh_delay_on_input`, `read_composer_semantics`, `semantic_pending`.
- Confirm against real Host source drift, rapid typing, IME, scroll, clearing, source 401/403, stale host, approval/read barrier, recent-read delays, and no duplicate request storm. A basic cargo check does not prove correctness.

### B4 — ZCode model fanout unavailable
- Actual one-scout CLI `zcode --mode plan --workflow-mode disabled ...` reached OpenRouter free `baidu/ernie-5.5-flash-preview:free` and received **HTTP 429, rate_limit_exceeded / tpm_rate_limit_exceeded** (upstream shared pool). The pilot did **not** produce a completed assessment and was terminated. **Do not retry this model repeatedly or run four model scouts**; re-evaluate quota/routing only once explicitly authorized and credit-safe. Previous GLM and alternate routes also have stale quota notes; don't assume them healthy.
- Deterministic Node/Rust checks can run without model costs. The prior ZCode workflow has conflicting old model ladder comments and retired demo endpoints; **never run it unchanged**.

### B5 — Launcher and environment release
- Windows may have legacy VIVIM shortcuts pointing to Edge or Host; purposefully retained until native acceptance. The immutable test checkout contains untracked screenshots and logs; do not `git clean`, remove them or repoint launchers without rollback plan.
- If local Host `http://127.0.0.1:43187` is down, verify actual process/startup and associated owner token; an old `LIVE_SERVED_SHA.txt` is not a readiness proof. Do not start a second Host that races the live user instance.

### B6 — Handoff/source version concurrency
- A GitHub `main` read can advance while another agent edits. Refresh branch HEAD and each target file SHA at every mutation. Commit direct to main with a narrow diff; never force-push, discard untracked files or claim the repo is at the old SHA.

## 7. Full execution tracker and current counts

Canonical [100-step ledger](CANONICAL-SURFACE-100-STEP-LEDGER.md) covers 10 × 10 tasks:

| Range | Domain | Critical gate |
|---|---|---|
| CS-001–010 | Windows shell paint/accessibility | Native app menu visible and clickable with real input |
| CS-011–020 | Developer capture/evidence/privacy | Readable proper foreground screenshot and authorized report |
| CS-021–030 | First Contact visual parity | Empty → typing → clear; no extra dashboard |
| CS-031–040 | AutoWiki | Source-backed matches while typing; stale guards |
| CS-041–050 | Host authority | Same plan/approval/effect/receipt with no typing effect |
| CS-051–060 | Phone ↔ PC synchronization | Both directions, identity/revision fences |
| CS-061–070 | TierFlow → Rust/VEC | Migrate capability only after parity |
| CS-071–080 | Windows shell expansion | Standard menu actions/prefs remain native |
| CS-081–090 | Build and one launcher | SHA-pinned release, rollback; no Edge UI |
| CS-091–100 | Physical product acceptance | Real device proof + promotion |

At snapshot: **CS-001, CS-002, CS-006 VERIFIED** (diagnostic observation); **CS-003, CS-004, CS-005 CODED, acceptance pending**; the other **94 TODO in the canonical ledger**. This is conservative; a related passing test never upgrades a step retroactively. Historical shell tasks and later NLP code changes are not proof that the corresponding product/device step is VERIFIED.

### Exact next 12 actions for core dev (priority order)

1. **Refresh HEAD** and inspect `AGENTS.md`, this handoff, ledger, source paths; pin one source SHA and log it.
2. **Verify code build at refreshed SHA**: Rust library test, GPUI desktop check, targeted Node VLANG tests. Fix compile failures on GitHub main, not local checkout.
3. **Create/inspect immutable Windows test release** from that SHA without changing permanent desktop shortcuts, phone URL or production Host. Preserve untracked artifacts and credential sources.
4. **Check real Windows menu fallback** on app start; capture actual foreground native window, compare title/menu pixels to Win32 HMENU geometry; record pass/fail (do not certify from GetMenu alone).
5. **Prove basic First Contact**: clean initial composer, focus, caret, typing, clear; screenshot empty and typed state. No debug overlay or browser.
6. **Prove AutoWiki** using three *existing source-backed* Wiki queries; check query revision, matching rows, clear/hide and stale old results. For unavailable Host, show truthful status rather than invented matches.
7. **Prove VLANG** with read-only interpretation examples above. First Contact should display recognized action and ambiguity hints while typing and invalidate prior hints immediately on edit/clear; no plan/effect.
8. **Inspect and fix coupling** between `wiki_query` (160 chars) and semantic candidate (up to 1000 UTF-16 units), also current `semantic_pending` error/disconnect behavior and Host read-busy gates. Add bounded regression tests first; source edits GitHub main.
9. **Test Host command authority** only in read-only/plan/refusal paths; ensure no approval is minted or effect executed by keystrokes.
10. **Prove phone→GPUI source read** using existing `phone.composer` region and revision; respect privacy default. Then implement explicit source-fenced PC→phone route through the existing Host staged-draft bridge, not a new bus.
11. **Run independent deterministic ZCode scouts** on same frozen SHA, first language and Wiki; produce actual test receipts and a reproduction-driven proposal. Do not consume model credits until provider health gates pass.
12. **Update ledger** with exact per-step `CODED/VERIFIED/BLOCKED/UNRUN`, commit SHA, native binary SHA, human/device evidence and defects. Only then decide whether to collapse shortcuts and promote.

**Exit criterion for first canonical milestone:** default native GPUI blank home with composer; Wiki responds to physical typing on actual persisted Host; VLANG recognizes and clarifies without effects; same source/view follows in mobile PWA both ways; developer menu works with screenshots and diagnostics; verified one native launcher with rollback. All gates are separately evidenced.

## 8. Parallel work: maximize productive capability without collisions

Reuse existing ZCode orchestration design, not a new agent runtime: local `CONTINUOUS-IMPROVEMENT-FLEET` docs `ORCHESTRATION.md`, `LANE-SPECS.md`, `DWF-PARALLEL-PATTERNS.md`; local `.zcode/workflows/arbor-batch1.dwf.ts` uses native `future(async()=>...) / Promise.all` dependency joins. **Do not assume concurrency just because definitions exist.** Each active run must return a real run ID/receipt.

**Roles:** ChatGPT Cloud Dev = **one main source integrator**. ZCode = **up to four read-only scouts** with disjoint evidence scopes; one independent adversarial verifier. Model concurrency stays **zero** until provider health/spend limits are verified; when admitted, first **one scout**, later max two model calls globally / one per provider. Deterministic tests may run concurrently on isolated source states.

**ZCode scout matrix:**

| Scout | Inspect / vary | Expected output |
|---|---|---|
| **Z-AUTO** | Source-backed Wiki relevance, stale source, final edit, empty/offline state | Exact input/revision, expected/current hits, one reproducible Wiki defect |
| **Z-VLANG** | NLCL action ID, arg normalization, paraphrase, catalog/world stamps | Frozen typed candidate/clarification/refusal, real action metadata, one language regression |
| **Z-SAFETY** | Negation, compound commands, stale approval, unknown capability, R3, invalid scope | Refusal/clarification proof, no plan/effect |
| **Z-VISUAL** | GPUI/PWA text/IME, context preview, menu/First Contact/phone parity | Screenshots and machine version with physical proof or UNRUN |

**One improvement cycle (repeatable):**
```text
 source SHA + owner/user-visible failure
       ├── Z-AUTO  ─┐
       ├── Z-VLANG ─┤ read-only evidence (up to four)
       ├── Z-SAFETY ┤
       └── Z-VISUAL ┘
              ↓
    rank one actual defect by user visibility,
    reproducibility, safety and low-cost fix
              ↓
    ChatGPT cloud coder → refreshed main,
    narrow Rust-first patch → commit SHA
              ↓
    independent replay at new exact SHA
              ↓
   PASS/FAIL/UNRUN receipt + ledger update
              ↓
    repeat only when new source delta or real failure
```

**Circuit breakers:** hard 429 / 401/403 / exhausted quota; source SHA mismatch; ambiguous execution receipt; model cost unexpectedly nonzero; 2 no-progress iterations; stale/unknown authority; no physical screenshot when one is essential. Never auto-learn a command grant or let scouts act on user state. A ZCode DWF run must terminate/fail/cancel; don't replace it with an infinite prompting loop.

**Older `arbor-life.dwf.ts` caveat:** its comments refer to old `/demo`, `/api/mutate`, `/chat`, `/wiki` product paths, full `mode=life` write/build loops, and contradictory model ladders. They are historical implementation context and source of *patterns* only, **not** proof of current authority or a safe workflow to run unmodified. Use an explicit audit-only scope or fresh bounded verifier design. The one actual ZCode pilot returned 429 and was stopped; there are **zero verified concurrent model improvement workers** in this handoff.

**Evidence envelope** for each loop:
```json
{
  "runId": "actual-id-or-UNRUN",
  "lane": "Z-AUTO|Z-VLANG|Z-SAFETY|Z-VISUAL",
  "sourceSha": "git commit",
  "device": "actual-id-or-none",
  "observedCommand": "exact test command",
  "inputDigest": "nonsecret",
  "expected": "bounded",
  "actual": "bounded",
  "outcome": "PASS|FAIL|BLOCKED|UNRUN",
  "errorCode": "actual-code-or-null",
  "proposedOneFix": "evidenced minimal source intervention",
  "artifactPaths": ["existing actual paths"],
  "authorization": "observation-only"
}
```
Never include owner token, passwords, private Wiki body, personal draft text or device-secret identifiers in published reports.

## 9. Fast, non-mutating baseline commands

Use these from a **fresh source checkout with correct SHA** (cloud preferred; Windows after GitHub push for native acceptance). These do not perform Host effects:

```powershell
git rev-parse HEAD
cargo test --manifest-path native/gpui-desktop/Cargo.toml --lib --offline
cargo check --manifest-path native/gpui-desktop/Cargo.toml --features desktop --offline --locked
node --test apps/vivim-host/test/vlang-command-compilation.test.mjs apps/vivim-host/test/control-intent-planner.test.mjs apps/vivim-host/test/command-intent-native.test.mjs apps/mobile-relay/test/composer-assist.test.mjs
```

For physical acceptance, **only in an authorized isolated test release**, use existing launcher:
```powershell
& 'C:\0-BlackBoxProject-0\.arbor-gpui-releases\13c200e94b08\tools\packaging\launch-gpui-only.ps1' -Configuration debug
```
Check the exact process executable path, real window handle, screenshot evidence and Host readiness. The launcher example reflects a *past test release*; inspect the current active source pointer before using it, and avoid launching duplicate Hosts. The native menu experimental env var is **NOT** a production default.

The local ZCode health check can read `ZCODE-DESKTOP-COMMANDER-OPERATIONS/scripts/sitrep-brief.ps1` or the R004 fleet health script; **do not** use health output as proof of active workers, healthy models or source deployment. Do not re-run `zcode --prompt` with the known-throttled free model without an explicit route/quota check.

## 10. Full continuity checklist for a receiving agent

- [ ] Read `AGENTS.md` and `ONE-CANONICAL-LIVE-SURFACE.md`; note GPUI is native Windows master, phone PWA same product semantics, Host effect authority.
- [ ] Refresh GitHub main SHA and file SHAs. Do not trust the snapshot SHA in this doc as latest.
- [ ] Confirm Desktop Commander device and local release status without modifying source.
- [ ] Read 100-step tracker, collect the previous exact verified tests, keep no unverified PASS.
- [ ] Keep Windows app shell separate from First Contact; do not embed a browser.
- [ ] Keep real Win32 HMENU adapter and safe drawn menu fallback while nonclient paint is broken.
- [ ] Rebuild from refreshed main before claiming `41/41` still holds.
- [ ] Exercise real typed AutoWiki + command previews with no mutating Host operation.
- [ ] Preserve plan→approval→effect→receipt Host ownership.
- [ ] Keep provider model fanout halted following HTTP 429 until verified.
- [ ] Assign ZCode one bounded observation pilot first; collect actual run ID/receipt.
- [ ] Start with next failing product behavior; source patch from ChatGPT on main; replay.
- [ ] Update tracker and publish changed commit+evidence+blockers.
- [ ] Preserve original PWA and shortcut rollback until Android and Windows proof.
- [ ] Do not promise background execution or secretly schedule ongoing cycles.

## 11. Copy-ready next-agent mission

> **Role:** You are ChatGPT Cloud Dev / primary ARBOR integrator. Read `AGENTS.md`, `docs/product/ONE-CANONICAL-LIVE-SURFACE.md`, `docs/product/FULL-HANDOFF-GPUI-PWA-VLANG-ZCODE-20261122.md`, `docs/product/CANONICAL-SURFACE-100-STEP-LEDGER.md`, and `docs/product/ZCODE-VLANG-NLP-AUTOWIKI-ITERATION-R001.md`. Refresh `owenservera/ARBOR` `main` and exact file blobs before editing. Your current goal: one actual GPUI First Contact composer that displays real AutoWiki and Host-owned VLANG meaning while typing, plus a reliable Windows application menu, before pursuing expanded TierFlow/UI features. ChatGPT alone codes via GitHub main, Rust first; Desktop Commander post-push build/device evidence only; ZCode for bounded read-only independent improvement scans. First run exact Rust+Node baseline tests, then solve actual physically evidenced GPUI typing/Wiki/VLANG/Win32-menu defects. Do not assume old Edge app is current PC UI. No second parser, Host, bus, store, screenshot stream or approval path. Do not auto-execute text commands. Keep native visual acceptance honest and phone PWA/launcher unchanged until two-device success. Return exact SHA, tests, screenshots, outstanding blockers and ledger status. Start with the next reproducible user-visible failure, not orchestration framework design.

## 12. Linked canonical handoff artifacts

- [Owner architecture and one surface](ONE-CANONICAL-LIVE-SURFACE.md)
- [100-step product ledger](CANONICAL-SURFACE-100-STEP-LEDGER.md)
- [ZCode VLANG / NLP / AutoWiki improvement loop](ZCODE-VLANG-NLP-AUTOWIKI-ITERATION-R001.md)
- [ZCode Win32 menu verification mission](ZCODE-GPUI-NATIVE-MENU-VERIFIER-R001.md)
- [Native Windows shell implementation SITREP](GPUI-NATIVE-WINDOWS-SHELL-SITREP-20261122.md)
- [ARBOR owner/agent rules](../../AGENTS.md)

**Finish line:** One stable native Windows app with its native app shell; one canonical First Contact product canvas, shared live state and revisioned Wiki/VLANG semantics on Windows and Android; every mutating command through the existing Host's explicit approval and receipt path; one accepted launcher only after independent, physical two-device proof.

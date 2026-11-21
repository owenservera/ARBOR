# ARBOR — Tauri → GPUI native desktop replacement worklog

**Assessed:** 2026-11-21 (Europe/Madrid)  
**Repository:** `owenservera/ARBOR`, `main`  
**Read-only source baseline:** `98890827832ea74eba698566cb88bc3a4a7d520c`  
**Intent:** GPUI replaces Tauri as the native Windows desktop shell, without replacing the canonical Host/World authority, the shared Rust core, or the PWA-first mobile experience.  
**Execution policy:** Fix real code directly on `main`; no PRs/branches; preserve stashes and other lane changes. No GitHub Actions dependency, provider APIs, synthetic product data, or second journal/permission/graph engine.  
**Evidence standard:** SOURCE_PRESENT, VERIFIED_BY_SOURCE, UNRUN, FAIL or PASS with commands and observed exits. Source presence is **not** a passing build or device smoke test.

## 1. Executive determination

**TAURI NOT RETIRED. GPUI IS A SUBSTANTIAL NATIVE IMPLEMENTATION, NOT YET A STANDALONE SHIPPABLE HOST REPLACEMENT.**

- Production Rust workspace `Cargo.toml` contains `src-tauri` as a member, while `native/gpui-desktop/Cargo.toml` is a separate `[workspace]`, with GPUI optional behind feature `desktop`.
- `src-tauri/src/main.rs` (1,076 lines at baseline) still owns the Windows Host child process lifecycle, packaged runtime resolution, crash recovery, attach/refuse policies, one-use browser control session, and native status/restart/validation commands.
- GPUI (`main.rs`, `lib.rs`, `control.rs`, `visual.rs`: 1,793 total source lines at baseline) has a native window, Overview/Wiki/Build/Graph/Decisions panels, authenticated bounded Host reads, shared Rust Wiki/VEC/HQKG projections, source-revision fences, live window-derived viewport changes, a 15-second passive observer, and canonical plan/approve/receipt/inspect commands.
- GPUI's startup path opens a window and reads an already-running Host; no equivalent owned child supervisor/packaged launch implementation is present in its four files.
- Existing runtime packager stages under `src-tauri/resources/runtime` and assumes Tauri config; the native GPUI binary has no installer packaging integration.
- Current committed tree lacks root `Cargo.lock` and `bun.lock`, and lacks `native/gpui-desktop/Cargo.lock`. Nested `src-tauri/Cargo.lock`, `native/hqkg/Cargo.lock`, `core/programmability/Cargo.lock` and R004 evidence lockfiles do not substitute for root/GPUI production locks. Reproducible `--locked` build and frozen release staging remain unproved.
- Rust unit-test definitions present in source: GPUI 24 (14 in lib, 5 control, 4 visual, 1 main), Tauri main 9; **none executed in this assessment**.
- No shipped GPUI Windows installer, real paired-device acceptance receipt, UI screenshot comparison, or signed upgrade verification was found in inspected source. Do not infer absence in an uninspected external release system.

## 2. Implementation history reconstructed from file-scoped GitHub commit history

| Date UTC | Source-confirmed progress | Representative commits | Classification |
|---|---|---|---|
| Nov 12 | Imported Tauri/Harness, HQKG and core into ARBOR | `718fd5b6296` | Source imported |
| Nov 18–20 | Native validation, Host packaging closure, approved Rust executables | `30e9b4b8233`, `2f0774957e4` | Native infrastructure |
| Nov 20 20:12–20:22 | GPUI Host read projection, committed TierFlow view, command approval, live binding | `6d79605360a`, `413924c704f`, `3eed637c2ff`, `56d6a530131` | GPUI source present |
| Nov 20 22:24–22:59 | GPUI Wiki, graph, navigation, shared receipt/plan and native source identity | `2e52072dc08`, `25889da2ed7`, `be9691ec301`, `6bb0814ff9e` | GPUI source present |
| Nov 21 00:14–02:46 | Window-derived viewport, async read fences, double-bracket snapshots, bounded retries, graph/Wiki high water | `093d72a46ca`, `ce3fa1ce11d`, `21836a5ff2b`, `09896c1b7fe`, `639266ff15a` | GPUI source present |
| Nov 21 02:24–02:51 | Tauri child supervision, restart, fail-closed packaging, authenticated owner browser session and recovery hardening | `13fcaed9859`, `579ca1f7957`, `792b0129c6f`, `03601c9850c` | Tauri still advancing |
| Nov 21 03:36–03:49 | Post-integration fixes on personal-rule reducer and tests across mobile/Host/HQKG | `ea2b000389e` through `98890827832` | No GPUI release proof |

The GPUI README opens with “Opt-in native renderer, not a replacement for the shipped Tauri shell”, and requires desktop parity plus owner decision before Tauri retirement. Some README statements (e.g. preset viewport controls and no automatic window tracking) lag the actual current `main.rs` window-bounds listener. Update README based on source, not vice versa.

## 3. Exact capability migration crosswalk

| Tauri responsibility / legacy surface | Existing implementation | GPUI replacement status | Work item |
|---|---|---|---|
| Win32 desktop window and event loop | `src-tauri/src/main.rs`, Tauri/Wry | GPUI `Application::new`, native window; Windows GPU smoke unrun | R07,R13 |
| Spawn packaged `node.exe` / Host entry | `HostProcess::start`, `resolve_runtime` | No equivalent supervisor in GPUI | R01,R02 |
| Attach independent healthy Host and refuse foreign listener | Tauri `ensure_ready_locked` | GPUI validates Host schema only, no OS ownership | R01,R03 |
| Child exit, bounded recovery, restart, shutdown detach | Tauri `HostProcess` + IPC `host_restart` | Not GPUI-owned | R01,R02,R03 |
| One-use browser UI session | Tauri `desktop_launch_url`, `present_owner_session` | GPUI native bearer-authorized reads/actions; no browser UI session launcher | R03,R08 |
| Host native status reporting | Tauri `host_status`, `host_is_running` | GPUI has Host HTTP health and source summary, lacks owned-child/runtime-origin diagnostic equivalence | R02,R08 |
| Pure Rust native program validation IPC | Tauri `validate_native_program`; Studio `native-bridge.mjs` `__TAURI__` | Shared Rust validation exists; Studio bridge still Tauri-specific | R09 |
| Built-in web Host control UI | Tauri webview loads `apps/vivim-host/public` | GPUI five native panels; no full control-panel screen parity | R07,R08 |
| Command plan/approval/receipt | Host web control and native IPC/HTTP | GPUI `control.rs` plan/execute/inspect with one-use approval | R06 |
| Knowledge, Wiki, graph, visual source | Host webviews/TierFlow | GPUI Rust adapters and revision guards | R05 |
| Device approval, revoke, preferences, browser memory, onboarding | `apps/vivim-host/public/control-panel.js` and Host | Not implemented as dedicated GPUI workflows | R08 |
| Tauri MSI, icon, resources, installer ID | `src-tauri/tauri.conf.json` | No GPUI installer/upgrade path | R04,R10,R14 |
| Frozen Node/Host/nine Rust binary closure | `tools/packaging/prepare-host-runtime.mjs` | Still bound to `src-tauri/resources` and Tauri config | R04 |
| Release lock and source closure | root manifests, packaging script, local gate | Root+GPUI locks missing from committed tree | R10 |
| Native desktop e2e | Source unit tests, GPUI CI check command | No demonstrated Windows runtime/installer/upgrade acceptance | R11,R12,R13 |

### Approved shipped native binaries (preserve exact contract)

`hqkg-personal`, `hqkg-chat-context`, `hqkg-web-feed`, `hqkg-import`, `hqkg-development`, `vivim-program-validate`, `vivim-vec-project`, `vivim-product-pure`, `vivim-private-shares`.

## 4. Implementation worklog — ordered by dependency, not a new parallel architecture

All tasks below are **OPEN / UNRUN** unless marked SOURCE_PRESENT. They are implementation tasks; there is no claim of acceptance.

| ID | Priority | Implementation target | Exact handoff / acceptance condition | Status |
|---|---|---|---|---|
| R01 | P0 | **Extract** Tauri `HostProcess` + runtime classifier + bounded recovery into reusable native Rust supervisor module/crate | One canonical OS-child owner, attach/refuse semantics, no Host effect replay; test start/exit/restart/foreign listener; preserve real Host journal | OPEN |
| R02 | P0 | Integrate supervisor into GPUI lifecycle and diagnostics | Start from workspace or validated installed runtime, nonblocking GUI boot, visible owned/attached/failed/recovering status, explicit restart, detach on close | OPEN |
| R03 | P0 | Harden loopback process identity and owner session boundary | Never submit persistent owner token to unverified listener; protected handshake/process binding and existing Host owner authority; adversarial occupied-port tests, no extra grant path | OPEN |
| R04 | P0 | Decouple frozen packager from `src-tauri` | Shared staged Node+Host+PWA+9 binaries unchanged; neutral resource root; SHA256 manifest verifies; no undeclared files or dev fallback in release | OPEN |
| R05 | P1 | Complete source-coherent GPUI Wiki/HQKG/VEC readback | Current Rust revisions, exact source identity, visual admission, graph invalidation, panels render real Host data; retained node identity/interaction parity tested | SOURCE_PRESENT / LIVE UNRUN |
| R06 | P1 | Harden native approval/receipt/recovery across restart | Plan review and one-use execute remain Host-owned; unknown effect never auto-retried; durable inspect and resume after desktop restart | SOURCE_PRESENT / LIVE UNRUN |
| R07 | P1 | Compare actual desktop UX against PWA/TierFlow | Nav, resize, composer, links, panels, component styles, keyboard/touch/accessibility, no effects during render; capture real Windows screenshots | PARTIAL |
| R08 | P1 | Preserve desktop access to device grants, onboarding, preferences, browser memory, Studio | Implement native views or explicit secure handoff to same Host-backed PWA interface; no silently lost controls | OPEN |
| R09 | P1 | Remove Tauri-only Studio native-bridge assumption | Decide native program validation via existing Host/native Rust route; degrade non-Tauri web securely; remove `__TAURI__` dependency after parity | OPEN |
| R10 | P0 | Reproducible GPUI Windows release | Generate/review genuine root+GPUI locks, build GPUI release exe, package runtime and create signed installer with tested uninstall/upgrade/data preservation; no CI dependency | OPEN |
| R11 | P0 | Local cross-component execution | Cargo core/HQKG/GPUI, Host and PWA local suites, working Host startup, owner authorized commands, Wiki/visual rev synchronization with exact exit/status evidence | UNRUN |
| R12 | P0 | Safety regression exercise on Windows device | Foreign listener, missing/corrupt runtime, wrong owner token, crash/restart, concurrent command, pending approvals, unacknowledged effects, shutdown, offline/no-store behavior | UNRUN |
| R13 | P0 | Physical Windows acceptance | Cold start from installed GPUI MSI, pair actual PWA phone, Wiki updates, native commands/receipts, native GPU rendering, app close/reopen and upgrade test; log real observations | UNRUN |
| R14 | P2 | Retire Tauri only after R01–R13 have real evidence | Remove `src-tauri/`, dependency/member/build refs, obsolete IPC/schema/tests, Tauri installer and resource paths; do not delete Host JavaScript, Rust kernel, or frozen package validation | BLOCKED |
| R15 | P2 | Update documentation, runner, and coordination ledger | GPUI README truthful; local-run recipes and owner decisions/actual commit IDs/verification results recorded; Tauri marked retired only after R14 | OPEN |

**Critical path:** R01 → R02/R03 → R04/R10 → R11/R12/R13 → R14. R05–R09 run in parallel where file ownership does not conflict.

## 5. Invariants not to change

1. Host alone owns approvals, receipts, persistence, effects, browser provider interaction, and authority. GPUI is UI + native supervisor, not another World.
2. Shared Rust programmable kernel, HQKG graph/journal and VEC are reused; do not create second data engines, synthetic state or a new ledger.
3. PWA-first mobile remains independent of Windows desktop renderer; no renewed APK requirement.
4. Installed release does not fall back to checkout, unvalidated binaries, tools, unapproved executables, or arbitrary listener.
5. Ownership transitions preserve pending Host effects; desktop restart must not silently retry uncertain commands.
6. Local verification is authoritative until Actions allowance/availability returns. A green Rust unit suite does not prove Windows GPU, installer, pairing or delivery.

## 6. Execution recipes (not executed by this assessment)

From an actual Windows 11 checkout at current `main`, preserve stashes; capture commands, exit codes, SHA, rustc/Node/Bun versions, environment and failures:

```powershell
git fetch origin main
git status --short
git rev-parse HEAD
cargo test -p vivim-programmability-core
cargo test -p hq-knowledge-graph --features importer,native-program
cargo test --manifest-path native/gpui-desktop/Cargo.toml --lib
cargo check --manifest-path native/gpui-desktop/Cargo.toml --features desktop
cargo build --manifest-path native/gpui-desktop/Cargo.toml --features desktop --release
node integration/scripts/pwa-run-now.mjs
node --test apps/vivim-host/test/control-http.test.mjs apps/vivim-host/test/control-desktop-surface.test.mjs apps/vivim-host/test/native-ui-view.test.mjs
```

After generating and reviewing the actual applicable lockfiles, rerun with `--locked` where supported. Do **not** claim packaging based on a plain `cargo check`. After R01/R04/R10, run the *new* native supervisor/packaging path with a real installed application, physical Windows GPU/display and paired phone, and log observed results and receipts.

## 7. Known verification blockers, historical caveats

- The latest five main GitHub Actions runs at snapshot ended `startup_failure` with 0 jobs. This is **not** application test failure evidence; skip Actions per owner direction.
- Current root lacks committed lockfiles needed by `tools/packaging/prepare-host-runtime.mjs` and W01-G/r004 `--locked` workflows. Do not treat nested/evidence lockfiles as canonical.
- An archived R004 `cargo-check-locked` record reported `exit=0` for `vivim-host` in a separate worktree; it cannot establish latest-main GPUI parity, packaged Windows boot or current integration.
- Tauri `src-tauri/NATIVE-SECURITY-W02-PREP.md` contains historical claims about configuration/health as of Nov 12; use actual current `src-tauri/src/main.rs` and `capabilities/default.json` for present behavior.
- GPUI README’s old preset-viewport/no-auto-window claim is superseded in source by `observe_window_bounds` and `viewport_for_window`; behavioral parity still unverified.
- Studio’s `native-bridge.mjs` assumes Tauri injected global IPC. Current `capabilities/default.json` has no `remote.urls` grant, so do not claim the remote Studio page has working IPC merely because the JS helper exists.

## 8. Source of truth and follow-up log format

Core refs at assessed SHA:
- `Cargo.toml`; `src-tauri/Cargo.toml`; `src-tauri/src/main.rs`; `src-tauri/tauri.conf.json`; `src-tauri/capabilities/default.json`.
- `native/gpui-desktop/Cargo.toml`; `native/gpui-desktop/{README.md,src/{main.rs,lib.rs,control.rs,visual.rs}}`.
- `tools/packaging/prepare-host-runtime.mjs`; `studio/src/studio/ui/native-bridge.mjs`; `apps/vivim-host/public/control-panel.js`.
- `integration/scripts/pwa-run-now.mjs`; `integration/scripts/w01g-r001-windows.ps1`; `integration/scripts/r004-local-gate.mjs`.
- Historical commit path queries: `/commits?path=native/gpui-desktop/src/main.rs`, `/commits?path=src-tauri/src/main.rs` on `owenservera/ARBOR`.

Record each implementation entry using this precise template (no placeholder PASS):
```text
UTC date | work item | before SHA -> after SHA | actual files changed
Command | cwd / target / environment | exit code | PASS/FAIL/UNRUN
Real behavior observed | protected data preserved? | failure / next handoff
```

**Retirement verdict as of this assessment: BLOCKED.** Keep Tauri usable until GPUI can launch and supervise the identical canonical Host, package/upgrade reliably, preserve required desktop flows, and pass actual Windows acceptance. Once that is demonstrated, delete Tauri decisively rather than maintaining two shipped desktop runtimes.

## 9. In-thread implementation ledger (2026-11-21)

**Direct commits to main, preserving prior work:**

| Commit | Actual source change | Verification |
|---|---|---|
| `eecfdf629516` | New shared native/host-supervisor crate; root Rust workspace registration; GPUI launches Host from native worker and shows status | SOURCE_PRESENT; Windows compile UNRUN |
| `133f26bc24ba` | Tauri-independent portable GPUI bundler and parser tests; consumes existing frozen runtime and actual release PE | SOURCE_PRESENT; bundling UNRUN |
| `28fd77e6fbab` | Tauri now calls shared full SHA256 frozen-runtime verifier; Rust staged-manifest tests updated for real empty-file digest; shared verifier tightened | SOURCE_PRESENT; Cargo tests UNRUN |
| `1dbb7dfc9c2c` | Neutral `--stage-gpui` frozen runtime path reuses canonical Host staging logic; test covers Tauri/GPUI destinations | SOURCE_PRESENT; staging UNRUN |
| `b9e509ef93ac` | Correct literal `--stage-gpui` path selection after refactor | SOURCE_PRESENT; staging UNRUN |
| `a9c161ac70b8` | Frozen packaging now explicitly requires both root lockfiles and uses `cargo build --locked --release` for each native executable | SOURCE_PRESENT; packaging UNRUN |

**Status updates:**
- R01 PARTIAL: shared native supervisor exists; Tauri still has lifecycle implementation and has not delegated its process state machine.
- R02 PARTIAL: GPUI now starts or attaches Host on a background worker and observes bounded owned-child exit recovery; real Windows build/boot unverified.
- R03 OPEN: schema-only attached-host health is not cryptographic/OS process attestation; don't claim owner bearer is safe against forged listeners. Protected process-bound bootstrap still required.
- R04 PARTIAL: same canonical frozen runtime packager supports GPUI path independent of Tauri and portable bundle script exists; real verified package not yet generated.
- R05/R06 SOURCE_PRESENT / LIVE UNRUN as before.
- R07/R08/R09 OPEN/PARTIAL as before; no native UI parity claim.
- R10 BLOCKED ON REAL ROOT LOCKFILES + WINDOWS BUILD/SIGNING; portable bundling source does not equal MSI.
- R11–R13 UNRUN; no cargo, Bun, GPU/device or installer test run in this in-thread GitHub-only execution.
- R14 TAURI RETIREMENT BLOCKED until R03/R10–R13 have real acceptance; do not delete working shell.

**Next actual local commands (Windows, recorded exits):**
```powershell
cargo test -p vivim-host-supervisor
cargo test -p vivim-host --bin vivim-host
cargo test --manifest-path native/gpui-desktop/Cargo.toml --lib
cargo check --manifest-path native/gpui-desktop/Cargo.toml --features desktop
node --test tools/packaging/test/stage-gpui-runtime.test.mjs tools/packaging/test/bundle-gpui-desktop.test.mjs
```
Only after genuine root `Cargo.lock` and `bun.lock` are generated, reviewed and committed, stage/build/verify the native distribution using the GPUI README commands. Never mark release PASS on a source-only commit.

# VIVIM GPUI desktop — native Host interaction

GPUI is the **only supported UI entrypoint for this Windows desktop launch**. It starts or attaches to the canonical Host using the shared native supervisor, without launching a browser UI. Tauri source may remain in the repository for migration/rollback engineering, but the GPUI-only launcher neither starts it nor falls back to it. Native Windows GPU and installer acceptance are tracked separately.
The canonical Host remains the only state/effect authority. No provider calls, extra grants, local journal, fake UI data, or new execution endpoints are introduced. The Host exposes one new read-only owner-proof endpoint to authenticate native transports. Native commands reuse the existing owner-authorized control plan/execute/inspect endpoints.

## Run from repository root

From a development checkout GPUI starts/attaches to the existing Host (Node on PATH). Installed GPUI requires an adjacent verified frozen runtime/ tree. Run:

```powershell
cargo test --manifest-path native/gpui-desktop/Cargo.toml
cargo check --manifest-path native/gpui-desktop/Cargo.toml --features desktop
cargo run --manifest-path native/gpui-desktop/Cargo.toml --features desktop
```

Uses official Apache-2.0 GPUI 0.2.2; separate Cargo workspace avoids modifying the
production root lock and default build. This initial crate does not yet have a
generated lockfile. Generate and review it on the Windows build machine.

## Implemented source
- Owner-authorized native visual GET uses the same canonical TierFlow plan and committed Host surface as PWA. No blank draft substitution. Native client validates source/plan identities, complete trace, revision and monotonic head during the session; preview actions are inert.
- Native layout maps stack/grid/card/text and structured rows, source colors and bounded presentation. Native window-resize observations request the existing Host planner at the actual bounded drawable width; this does not establish pixel/font/animation or full interactive parity; live binding rows reuse the canonical workspace projection, with bounded totals and source revisions. Missing data stays unavailable. Session high-water fencing independently checks every observed live binding revision and rejects same-revision content conflicts.
- Loopback-only client with no redirects or proxies, bounded response size,
  timeouts and existing native owner-token convention.
- Canonical GET Host status, private PWA projection, private Wiki projection.
- Schema-checked source-backed overview with Wiki revision, page names,
  active paired-device count, recent Host decision states and explicit refresh.
- Background reads, fail-closed state, only bounded source-drift retries, and no writes from refresh.
- Production text input using pinned gpui-component 0.5.0, native plan review, explicit one-click approval, canonical receipt validation and original plan inspection.
- Unknown execution outcomes block new commands in the current UI session; inspect locally before opening a new session. Closing the window does not resolve an uncertain effect.
- Projection and exact approval/receipt contract tests (not live acceptance).

## Required convergence
1. Run and record actual Windows GPU build and smoke; verify wiki-view payload
   against the Host cold-started by the native supervisor or explicitly attached. No live acceptance is claimed.
2. Migrate the remaining Tauri-specific owner session and supervisor behaviors
   into native/host-supervisor, with strong process attestation and no extra grants.
3. Map existing VEC/TierFlow component/schema contracts into GPUI elements,
   preserving stable IDs and revision semantics; reuse theme tokens.
4. Native plan/approve/receipt source exists; validate on Windows and add typed preview widgets, explicit recovery across restart, composer assistance and accessibility. Never execute on render.
5. Add HQ/Wiki live revision projection, accessible keyboard/touch navigation,
   resizing and device pairing parity, then opt-in installer packaging.
6. Retire Tauri after the GPUI lifecycle, installer, signed upgrade and device
   parity are demonstrated with real Windows acceptance. PWA mobile remains unchanged.

No build or GPU/device runtime evidence is claimed by this source change.

The native workspace has Overview, Wiki, Build, Graph and Decisions panels; exact local Wiki/Build/Control navigation uses the shared Rust grammar without sending an effect. The Rust Wiki read model displays committed pages, sections, links and source-validated personal captures. Native viewport choices request fresh TierFlow plans from the Host; stale in-flight viewport responses are discarded.

The native window polls the authenticated read projections every 15 seconds while idle, skips pending approvals, retains read-only receipt status, and refreshes immediately after a known execution outcome. The shared Rust delta reports changed/added/removed UI nodes; it does not yet prove retained GPU element reuse or server push.

## Native Host supervisor (2026-11-21)

The GPUI process starts `native/host-supervisor` on a native background thread. It refuses occupied foreign ports, honors an existing Host, bounds recovery of an OS-observed exited *owned* Host (two attempts), and never kills a living unhealthy Host or replays effects. A release binary refuses source workspace fallback and verifies the entire frozen runtime manifest by SHA256 before running the bundled Node and nine Rust executables. GPUI shows supervisor status in its native UI.

**Still outstanding:** the Tauri shell has its legacy supervisor until shared lifecycle migration is verified; an adjacent GPUI release runtime, signed installer, and physical Windows acceptance are not yet present. Native owned/attached readiness now requires an owner-secret HMAC proof; this still does not bind the socket to an OS PID or prevent every localhost proxy/race attack. Do not call this cutover complete.


### Portable Windows GPUI bundle

The source now includes a **Tauri-independent portable bundle assembly** (not an MSI or signed release). It consumes a *real*, already-frozen runtime and a built Windows release executable:

```powershell
cargo build --manifest-path native/gpui-desktop/Cargo.toml --features desktop --release
node tools/packaging/bundle-gpui-desktop.mjs --bundle --runtime C:\verified-host-runtime --binary native/gpui-desktop/target/release/vivim-gpui-desktop.exe --out C:\vivim-gpui-portable
node tools/packaging/bundle-gpui-desktop.mjs --verify --out C:\vivim-gpui-portable
```

The adjacent runtime/ tree is mandatory. The packager refuses nonexistent/fake executables, invalid manifests, symlinks in frozen staging, existing outputs, and non-Windows bundling. It copies no owner data. **No installer acceptance or signed distribution has been performed.** Neutral frozen-runtime staging is now implemented with `--stage-gpui`; actual release validation remains pending.

### New neutral staging command

`node tools/packaging/prepare-host-runtime.mjs --stage-gpui` builds the **same** frozen Node/Host/nine Rust executable runtime into `native/gpui-desktop/resources/runtime` without consulting Tauri configuration. It requires real root Cargo/Bun lockfiles, a verified Windows Node 24+ binary, and the original frozen production inputs. Then `bundle-gpui-desktop.mjs` assembles the portable directory beside the built GPUI release executable. These commands have not been executed in this assessment.

### Current GPUI-first developer entry points

```powershell
bun run desktop
bun run desktop:test:local
# Windows release prerequisites: genuine root Cargo.lock + bun.lock,
# native/gpui-desktop/Cargo.lock, and verified ARBOR_NODE24_* environment.
bun run desktop:portable
```

**Windows GPUI-only UI policy (owner directive 2026-11-21):** the desktop launcher must start the native `vivim-gpui-desktop.exe` and must never fall back to Edge, Chrome, PWA app mode, WebView, or a browser. The GPUI workspace includes native **Reconnect Host**, command planning/approval, read-only Host decisions, Wiki and VEC projections. The former **Open Host controls / pairing** browser button and its one-use browser session adapter have been removed. Device-pairing administration that has not yet been integrated into GPUI is explicitly **UNAVAILABLE in the native UI**, not silently delegated to another UI. The separate phone PWA is unaffected; no claim of native/phone visual parity is made. Windows GPUI acceptance requires a real GPU window and source-stamped readback. If the native executable cannot be built/launched, fail closed rather than launching a browser.

### Standalone Windows installer source

`tools/packaging/gpui-windows-installer.iss` describes a per-user, independent GPUI installer using the verified portable payload. `tools/packaging/build-gpui-installer.mjs` invokes an **explicit**, installed Inno Setup compiler only after verifying that payload. Example:

```powershell
bun run desktop:installer -- --portable C:\vivim-gpui-portable --iscc "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
```

This is **not an installed, signed, upgrade-tested release**. Do not remove Tauri until the running Windows desktop, device, signer, upgrades, and fallback/rollback are verified against actual owner data.

### Local evidence rule

`tools/packaging/gpui-local-integration.mjs` produces a private system-temp JSON receipt with source SHA, exact commands, PASS/FAIL/UNRUN, and blocked lockfile/toolchain checks. It never invokes GitHub Actions, invents lockfiles, or reports manual Windows GPU/device acceptance as passing.

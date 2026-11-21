# VIVIM GPUI desktop — native Host interaction

GPUI is the intended native Windows desktop replacement. It can now start or attach to the canonical Host via the shared native supervisor. Tauri stays as fallback pending real Windows installer and lifecycle acceptance.
The canonical Host remains the only state/effect authority. No provider calls, extra grants, local journal, fake UI data, or NEW execution endpoints are introduced. Native commands reuse the existing owner-authorized control plan/execute/inspect endpoints.

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
- Native layout maps stack/grid/card/text and structured rows, source colors and bounded presentation. Native viewport controls request the existing Host planner at 360, 768, 1000 or 1440px; this is not automatic window-size tracking and makes no pixel/font/animation or interactive parity claim; live binding rows reuse the canonical workspace projection, with bounded totals and source revisions. Missing data stays unavailable. Session high-water fencing independently checks every observed live binding revision and rejects same-revision content conflicts.
- Loopback-only client with no redirects or proxies, bounded response size,
  timeouts and existing native owner-token convention.
- Canonical GET Host status, private PWA projection, private Wiki projection.
- Schema-checked source-backed overview with Wiki revision, page names,
  active paired-device count, recent Host decision states and explicit refresh.
- Background fetch, fail-closed state, no automatic retry or writes from refresh.
- Production text input using pinned gpui-component 0.5.0, native plan review, explicit one-click approval, canonical receipt validation and original plan inspection.
- Unknown execution outcomes block new commands in the current UI session; inspect locally before opening a new session. Closing the window does not resolve an uncertain effect.
- Projection and exact approval/receipt contract tests (not live acceptance).

## Required convergence
1. Run and record actual Windows GPU build and smoke; verify wiki-view payload
   against the running Host. The Host is started separately in this slice.
2. Extract common native owner/session and supervisor logic rather than
   duplicating it; prefer short-lived native sessions when supported.
3. Map existing VEC/TierFlow component/schema contracts into GPUI elements,
   preserving stable IDs and revision semantics; reuse theme tokens.
4. Native plan/approve/receipt source exists; validate on Windows and add typed preview widgets, explicit recovery across restart, composer assistance and accessibility. Never execute on render.
5. Add HQ/Wiki live revision projection, accessible keyboard/touch navigation,
   resizing and device pairing parity, then opt-in installer packaging.
6. Retire the Tauri renderer only after reproducible desktop parity and owner
   decision. PWA mobile remains unchanged.

No build or GPU/device runtime evidence is claimed by this source change.

The native workspace has Overview, Wiki, Build, Graph and Decisions panels; exact local Wiki/Build/Control navigation uses the shared Rust grammar without sending an effect. The Rust Wiki read model displays committed pages, sections, links and source-validated personal captures. Native viewport choices request fresh TierFlow plans from the Host; stale in-flight viewport responses are discarded.

The native window now polls the authenticated read projections every 15 seconds while idle, skips pending approvals, retains read-only receipt status, and refreshes immediately after a known execution outcome. The shared Rust delta reports changed/added/removed UI nodes; it does not yet prove retained GPU element reuse or server push.

## Native Host supervisor (2026-11-21)

The GPUI process starts `native/host-supervisor` on a native background thread. It refuses occupied foreign ports, honors an existing Host, bounds recovery of an OS-observed exited *owned* Host (two attempts), and never kills a living unhealthy Host or replays effects. A release binary refuses source workspace fallback and verifies the entire frozen runtime manifest by SHA256 before running the bundled Node and nine Rust executables. GPUI shows supervisor status in its native UI.

**Still outstanding:** the Tauri shell has its legacy supervisor until shared lifecycle migration is verified; an adjacent GPUI release runtime, signed installer, and physical Windows acceptance are not yet present. Schema-valid attached Host status is not strong process attestation. Do not call this cutover complete.


### Portable Windows GPUI bundle

The source now includes a **Tauri-independent portable bundle assembly** (not an MSI or signed release). It consumes a *real*, already-frozen runtime and a built Windows release executable:

\`\`\`powershell
cargo build --manifest-path native/gpui-desktop/Cargo.toml --features desktop --release
node tools/packaging/bundle-gpui-desktop.mjs --bundle --runtime C:\\verified-host-runtime --binary native/gpui-desktop/target/release/vivim-gpui-desktop.exe --out C:\\vivim-gpui-portable
node tools/packaging/bundle-gpui-desktop.mjs --verify --out C:\\vivim-gpui-portable
\`\`\`

The adjacent runtime/ tree is mandatory. The packager refuses nonexistent/fake executables, invalid manifests, symlinks in frozen staging, existing outputs, and non-Windows bundling. It copies no owner data. **No installer acceptance or signed distribution has been performed.** The frozen-runtime producer remains an independent pending step; a future neutral staging mode should remove the legacy Tauri resource-path coupling entirely.

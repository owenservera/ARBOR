# VIVIM GPUI desktop — native Host interaction

Opt-in native renderer, not a replacement for the shipped Tauri shell or PWA.
The canonical Host remains the only state/effect authority. No provider calls, extra grants, local journal, fake UI data, or NEW execution endpoints are introduced. Native commands reuse the existing owner-authorized control plan/execute/inspect endpoints.

## Run from repository root

Start the existing Host using its usual owner workflow. Then:

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
- Native layout maps stack/grid/card/text and structured rows, source colors and bounded presentation. Fixed 1000px plan viewport for now, no pixel/font/animation or interactive parity claim; live binding rows reuse the canonical workspace projection, with bounded totals and source revisions. Missing data stays unavailable.
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

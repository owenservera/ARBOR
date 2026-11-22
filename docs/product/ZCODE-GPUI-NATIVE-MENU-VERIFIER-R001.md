# ZCode verifier mission — GPUI canonical-surface W1 (2026-11-22)

**Type:** Read-only local observation and device evidence; **not** a source coding assignment. **Planner/coder:** ChatGPT Cloud Dev, pushing directly to `owenservera/ARBOR` `main`.

## Purpose
Independently verify the 100-step ledger's CS-001–010 for the exact GPUI Windows release SHA, while the ChatGPT agent changes Rust sources in GitHub. Avoid extra agent frameworks or a new product UI.

**Current issue:** Windows `GetMenu(hwnd)` returns an HMENU with seven top-level sections, `WM_COMMAND` works, and `GetMenuItemRect` + `GetMenuBarInfo` return geometry; nevertheless a physical capture shows Windows Terminal chrome overlapping the nonclient menu area. The *visible GPUI app-shell menu* must remain available until native painting is proven. Do not report native menu PASS solely from a nonzero handle.

## Allowed, bounded checks

1. Read ARBOR `docs/product/CANONICAL-SURFACE-100-STEP-LEDGER.md`, `native/gpui-desktop/src/native_windows_menu.rs`, `docs/product/GPUI-NATIVE-WINDOWS-SHELL-SITREP-20261122.md`; record exact SHA.
2. Run the already existing `ZCODE-DESKTOP-COMMANDER-OPERATIONS/scripts/sitrep-brief.ps1` **read only**. If ZCode model routing returns a 429, mark UNAVAILABLE; do not burn repeated free API requests.
3. Inspect a **separate, explicitly approved** Windows GPUI test release only. Never edit local app source, change a launcher, restart the phone Host or move files.
4. Record Windows-native `GetMenu`, `GetMenuItemCount`, `GetMenuBarInfo`, `GetMenuItemRect` including client rectangle.
5. Capture the whole actual GPUI app window **only upon explicit owner request**. Compare the menu title region against real pixels, not merely Win32 geometry.
6. Compare the empty First Contact canvas with last accepted Edge/PWA screenshot, noting composer position and overlays. Do not submit typed commands or exercise Host effects.
7. Return one terse receipt: `{sha, device, hwnd, win32_menu_handle, menu_geometry, native_visible:PASS|FAIL|UNRUN, drawn_menu_visible:PASS|FAIL|UNRUN, screenshot, blockers}`.

## Explicitly prohibited

No application source patches, no workspace git commits, no PWA/Host restarts, no browser logins, no synthetic Wiki fixtures, no effects, no wallpaper/desktop capture, no second UI, no continuous sessions without express owner approval.

## Acceptance

ChatGPT Cloud Dev owns CS-003–005 source changes. ZCode verifies **pixels and human interaction only**. If cannot execute, report UNRUN and do not manufacture a PASS. Any human mouse/Alt-key tests require actual user-visible physical action; automated WM_COMMAND dispatch is only a command-routing test.

Linked execution ledger: [100 steps](CANONICAL-SURFACE-100-STEP-LEDGER.md).

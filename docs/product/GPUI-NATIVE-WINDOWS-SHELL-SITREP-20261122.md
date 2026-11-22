# GPUI Windows native application shell — 2026-11-22 SITREP

**Authority:** Owner's [ONE-CANONICAL-LIVE-SURFACE.md](ONE-CANONICAL-LIVE-SURFACE.md).  
**Scope:** Windows desktop application chrome **above**, never inside, the shared First Contact PWA-style canvas.  
**Source:** `owenservera/ARBOR` main, latest code patch `f2322bf9cbff21312fe57b4764a76b4da34c3d0e`. Documentation changes follow on main.

## Implemented

- `native/gpui-desktop/src/native_windows_menu.rs`: real Win32 `HMENU`, seven conventional top-level categories (File, Edit, View, Tools, Developer, Settings, Help); `WM_COMMAND` IDs map back to the **same** `desktop_menu` catalog and GPUI action handlers.
- GPUI-drawn menu remains in source as a fallback for non-Windows/failed attachment; it is not a second product surface.
- Existing clean First Contact canvas remains default, with one composer.
- Developer actions: native window screenshot, bounded no-draft diagnostic report, screenshot directory, read-only Host/Wiki/VEC/graph/phone inspectors.
- `desktop_capture.rs`: screen-composited foreground-only image extraction of the application's own HWND bounds, replacing black GPU `GetWindowDC` capture. No automatic recording, refuses unfocused/black capture.
- Existing Host state/permission/effect authority unchanged; phone PWA not modified.

## Actual Windows evidence (DESKTOP-9KB03LU)

- Isolated, SHA-pinned release checkout: `C:\0-BlackBoxProject-0\.arbor-gpui-releases\13c200e94b08`.
- `cargo test --manifest-path native/gpui-desktop/Cargo.toml --lib --offline`: **37 passed**.
- `cargo check --manifest-path native/gpui-desktop/Cargo.toml --features desktop --offline --locked`: **PASS**.
- `cargo build --manifest-path native/gpui-desktop/Cargo.toml --features desktop --offline --locked`: **PASS** on code patch `f2322bf`.
- Real Windows `GetMenu(hwnd)` returned nonzero `HMENU`; `GetMenuItemCount` = **7**, labeled File/Edit/View/Tools/Developer/Settings/Help.
- Win32 `WM_COMMAND` → GPUI `About VIVIM` screen: **PASS**; this confirms actual command routing, not just a source mock.
- Win32 `WM_COMMAND` → local diagnostic report: **PASS**, report under `%LOCALAPPDATA%\VIVIM\Diagnostics` without draft text.
- Win32 `WM_COMMAND` → native screenshot: **PASS** after GPU capture fix, a 22KB PNG with visible First Contact composer, under `%LOCALAPPDATA%\VIVIM\Screenshots`. This proves image bytes are not uniformly black and the window remains alive. Screenshot must be explicitly initiated.
- Actual test GPUI window had a live HWND after action dispatch, with Host separate from browser UI.

## Remaining acceptance defects / NOT yet proved

1. **Real native menu painting in non-client region:** Win32 `HMENU` exists and command routing works, but the window capture included Windows Terminal tabs where menu/title chrome should render. GPUI's Windows GPU/no-redirection compositing may be involved; this is **not** equivalent to a visually accepted Windows menu.
2. **Physical mouse and Alt-key menu acceptance:** menu activation and submenu accessibility using human input on actual PC **UNRUN**. Programmatic `WM_COMMAND` is not proof of user clicks.
3. **Screenshot framing correctness:** compositor screenshot captures the window body but non-client region may show an underlying window. Need full-frame, menu-visible screenshot validation; don't claim visual parity from PNG alone.
4. **Host Wiki/phone PWA parity:** fresh auto-Wiki data loading, native human typing and phone bidirectional sync on this build **UNRUN/UNPROVEN**. These are not menu regressions and remain the canonical surface gating tasks.
5. **Windows permanent launcher cutover:** **NOT DONE**. Preserve previous working Edge/PWA reference, unchanged phone URL, and rollback. Do not replace shortcuts from this test build alone.

## Next engineering slice (strict)

Use the current GPUI/Win32 adapter, not another UI engine. Determine why the OS menu non-client region fails visual capture (check WS_EX_NOREDIRECTIONBITMAP, GPUI DirectComposition/Win32 frame interaction and OS menu placement); validate in an actual foreground Windows session. If native HMENU cannot paint reliably with this GPUI renderer, retain the **single menu action catalog** and a visible native-app fallback until OS integration is proven—do not leave the owner without an accessible menu or add a second product UI. Separately prove menu click→screenshot and click→diagnostics by real PC interaction, then return to composer/Wiki/phone parity. Continue source changes cloud-first on ARBOR main; Desktop Commander is only for post-push native build and physical acceptance.

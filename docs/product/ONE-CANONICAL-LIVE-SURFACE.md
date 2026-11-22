# VIVIM — One Canonical Live Surface (Owner Architecture Rule)

**Owner directive:** 2026-11-22. **Status:** MANDATORY architecture and acceptance invariant.

## Rule

**ONE VIVIM SURFACE → ONE CANONICAL STATE MODEL → MULTIPLE SYNCHRONIZED VIEWPORTS.**

The native Windows GPUI application and mobile PWA MUST NOT evolve into two separately authored product interfaces. They are two renderers/viewports of the **same live VIVIM surface**, carrying the same semantic UI definition, product state, Wiki revisions, interaction outcomes, permissions and verified receipts.

## Architecture boundary

- **GPUI (Windows):** the master **native authoring, control and rendering environment**. Native GPU output; no Edge, Chrome, Tauri or WebView as a desktop UI fallback.
- **TierFlow:** migrate its visual runtime capabilities—layout, styling, composition, gestures, interaction and live-feedback behavior—**into the shared Rust-led surface architecture used by GPUI**, reusing existing VEC, LiveSurface and native adapters. TierFlow must not remain a competing, separately authoritative UI runtime. Migration is incremental: source remains until parity has been proven; no premature deletion.
- **VEC / canonical surface definition:** shared, revisioned, platform-neutral visual and interaction semantics that drive both renderers. GPUI-specific drawing stays native.
- **ARBOR Host:** the sole authority for state persistence, source revisions, commands, approvals, effects, receipts, authorization and recovery. GPUI's master role means **authoring/control**, not a second state or effect authority.
- **Mobile PWA:** a responsive web projection of the *same* surface and state, not a hand-maintained second product. A web renderer is allowed on the phone, not inside the native PC app.
- **Synchronization:** bidirectional, source-backed changes with revision/coherence fences and explicit source identity. PC changes propagate to the PWA, phone interactions reflect back to GPUI. Do not equate visual similarity with proven live parity.

## First canonical milestone (scope gate)

Use the **already-working Edge First Contact release solely as the visual and behavioral reference**, not as the future desktop runtime. First make GPUI present the same simple default VIVIM interface:

1. One First Contact composer (matching the existing PWA copy/behavior).
2. AutoWiki results update while typing, without a manual Search button.
3. Identical source-backed Wiki data, correct revisions, empty/error states, and stale result invalidation.
4. Real bidirectional PC↔phone synchronized input/state on the same Host with observation receipts.
5. Same exact Host permission/approval/effect boundaries, with no automatic action from typing.
6. One native Windows VIVIM launch path; archive/remove competing active desktop shortcuts only after the native replacement is built, deployed, and verified. Preserve rollback.
7. Device acceptance on the actual PC and Android phone; capture concrete evidence of parity and synchronization.

**No expanded PC product features until the first canonical surface is tight and physically verified.** Existing diagnostic panels may remain internal but are not a competing product home.

## Engineering consequences

- Prefer **shared contracts and one state graph** over a GPUI-to-browser screenshot stream. The phone renders a responsive shared UI definition, not raw GPUI pixels.
- Reuse existing `core/programmability`, VEC, LiveSurface, Host live-system change feed, TierFlow visual logic and GPUI adapters. No second event bus, UI engine, backend database, grant authority or command executor.
- Ship each migration slice through refreshed ARBOR `main` using the cloud-first ChatGPT coding rule in `AGENTS.md`; Desktop Commander is for Windows runtime observation/verification and explicitly approved post-push deployment only.
- Tests must distinguish source integration, native compilation, deployed GPUI behavior, on-device phone behavior, and **proven** cross-viewport propagation.
- Treat this rule as an invariant in all product planning, migration, agent handoffs and acceptance; do not silently return to an Edge-based PC UI or two independently maintained visual products.


## Windows native application shell — TOP-LAYER RULE (owner amendment, 2026-11-22)

The PC application has a **persistent top-level Windows app shell**, separate from the VIVIM product surface. The shell is the place for native PC functionality as the application grows; it must **never** become an independent second PWA-like product experience.

**Hierarchy:** Windows native application chrome and menus -> one canonical PWA-parity First Contact canvas -> contextual results such as AutoWiki.

- The initial main product screen remains **blank graphite with one composer**, matching the successful Edge/PWA reference. AutoWiki appears only contextually. No developer cards, Host status, phone mirror or diagnostic workspace on the empty home.
- The PC app exposes recognizable **File, Edit, View, Tools, Developer, Settings, Help** groups. Screenshots, local evidence, Host/Wiki diagnostics, debug inspectors, connection controls and Windows-only preferences all belong to the app layer. Only explicit owner actions may capture a screenshot or write diagnostic reports.
- Preserve **one menu hierarchy and one set of underlying actions**. Avoid another launcher, a separate diagnostic application, a second internal product surface, or a new state/effect authority.
- PC-only capabilities can expand within the app shell while First Contact product behavior, state and semantics remain shared with the mobile PWA.
- **Native window-level acceptance:** the menu is application-owned chrome, independent of the PWA content and persists when the product screen changes. Prefer actual Win32 window menu/title-bar integration when supported, with keyboard access and native discoverability. The GPUI-drawn header/menu is a **fallback**, not the preferred Windows implementation. The pinned GPUI 0.2.2 Windows backend stores `set_menus` without mounting a Win32 menu, so `native/gpui-desktop/src/native_windows_menu.rs` mounts an actual Windows `HMENU` and routes the same catalog through `WM_COMMAND` into existing GPUI handlers. A native menu handle and seven category labels were verified on a running Windows build on 2026-11-22. Interactive human click/keyboard accessibility and reliable menu-region screenshot proof remain device-acceptance checks, not inferred from the handle alone.
- Screenshots go to `%LOCALAPPDATA%\\VIVIM\\Screenshots`; diagnostics to `%LOCALAPPDATA%\\VIVIM\\Diagnostics`. Capture is explicitly owner-triggered, uses the composited GPU display only if the GPUI window is foreground, and rejects black or inaccessible images rather than creating false proof. No automatic recording or private draft data in diagnostic reports.
- Keep the verified desktop launcher and existing phone URL stable until a built, locally captured, physically accepted native release is ready. New source builds are not automatic cutovers.

This rule supersedes the previous ad-hoc "hamburger menu in the product canvas" interpretation. A menu must not be one more widget inside the canonical VIVIM phone/PWA surface.

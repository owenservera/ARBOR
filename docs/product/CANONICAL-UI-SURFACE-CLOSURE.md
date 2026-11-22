# VIVIM — canonical UI surface closure

**Owner directive:** 2026-11-22. **Source authority:** ARBOR `main`, Rust `native/gpui-desktop/src/surface_registry.rs`. **Status:** implementation underway; not all legacy capabilities have native parity.

## Invariant

One installed local user-interface process: **native Windows GPUI**. It renders one shared VIVIM product (same canonical Host/VEC semantics as the phone PWA). The seven permanent native Windows menu groups are File, Edit, View, Tools, Developer, Settings and Help. There is **no local browser/WebView alternate product window**. Chrome provider accounts are external signed-in *targets of Studio*, not a VIVIM UI renderer.

One canonical mobile web product: `apps/mobile-relay/index.html`, with the established Today, Talk, Build, World, Wiki, Me and Control surfaces. No second phone app/PWA owned by Studio, Host setup pages or TierFlow should supersede it.

The existing Host is the sole effect and state authority. There is no new router, backend database, browser emulator, independent approval path or event bus created by this consolidation.

## Source inventory — enforceable

Rust `SURFACES` inventories **20 HTML files in ARBOR** plus the sole GPUI entrypoint and retired Tauri shell. Its unit test walks all seven HTML-containing ARBOR source roots and **fails when a new HTML page appears without a classification**.

Rust `DONOR_SURFACES` identifies **29 additional HTML source paths** across `vivim-labs` (2), `vivim-web-harness` (16), `vivim-ui` (2), `craft-anything` (2), and `repos_hq` (7). Many duplicate one another or are old previews, generated dashboards, marketing or vendor examples. Donors remain read-only; ARBOR is the integration home.

All 49 HTML sources are discoverable through **VIVIM → Developer → All UI source surfaces**, grouped with their prospective menu category. **Source classification is not feature parity.** Every noncanonical row shows its actual legacy/pending/reference disposition, not a synthetic success receipt.

## Final destination map

| Capability | Product/Windows destination | Preserve and migrate |
|---|---|---|
| Human chat, conversation selection, provider targets | Shared Talk canvas, identical on PWA and GPUI | Existing Host authority, Studio signed-in provider sessions and relay channels |
| Live Wiki, semantic autocomplete, visual composition | Shared Wiki/Build canvas | Existing Host-backed Rust Wiki, VLANG/NLCL, VEC, TierFlow source renderer |
| Today, World, Me, Control | Shared VIVIM canvas, not second standalone dashboard | Host projections; phone implementation is source reference |
| Workspace, Drive, file capture/export | Native File menu, using Host-scoped effects | Studio Drive API and saved workspace data; legacy drive HTML pending |
| Studio recorder, provider/browser capture, sessions, profile tooling | Native Tools menu and source-backed Host/Studio capability ports | Preserve CDP/browser ownership, API, session files; never reopen its own product dashboard |
| Host supervision, device pairing, permissions, approvals | Tools and Settings menu, with Host sole authority | Existing Host controls and GPUI native review/approval |
| Personal AI onboarding and corpus inspection | Native Tools/Settings, shared Me when phone-relevant | Existing Host/Studio native-backed corpus and onboarding |
| VEC/TierFlow internals, source graph, Craft intel, adapter profiling, experiments, logs | Native Developer menu | Existing Rust/HQKG graph, VEC/visual, Studio APIs; donor views only reference |
| Windows window chrome, screenshot capture, preferences, diagnostics | Native GPUI app shell/menu only | GPUI app-owned menu; no PWA chrome duplicates |
| Documentation, marketing pages, demo previews, vendor examples | Source/reference only | Do not install, serve as VIVIM product, or delete provenance before port acceptance |
| Tauri WebView shell | Retired (explicit recovery only) | Source archived; default `main()` refuses launch |

## Retirement already implemented

- Default desktop entry uses guarded GPUI build and a SHA-256 source/build receipt.
- Historical Edge app-mode Start Menu shortcut and pre-update GPUI executable were moved to rollback archives, not deleted.
- Studio CLI `start`/`serve` **no longer opens its own dashboard URL**. Its signed-in Chrome provider and capture service remain intact; its historical HTTP UI source routes are still present for migration compatibility and must not be mistaken for a completed port.
- Legacy Tauri main refuses to launch unless an explicit `VIVIM_LEGACY_TAURI_ALLOW=1` recovery override is supplied.
- Source is kept intact for areas that lack accepted native equivalents.

## Still-open acceptance and retirement work (no false closure)

1. Close actual product-tab parity: seven PWA surfaces must use the canonical Rust/Host/VEC state and render acceptably in GPUI. Blank First Contact remains the only default desktop home.
2. Port remaining Studio interaction workflows (capture, profiles, Drive, provider sessions, personal agent and platform) behind native menu/Host APIs, **including effect approval and receipts**. Existing menu inventory rows saying `pending` are not their replacement.
3. Port legacy Host first-run/onboarding/control routes and retire browser pages only after native functions are operable. Preserve paired-phone access while transitioning.
4. Stop serving the old Studio HTML routes, Host legacy HTML routes and TierFlow mission-control dashboard only when replacements and recovery paths are validated. Keep backend APIs, Studio provider/browser sessions, and archive evidence.
5. Verify native menu painting and selection by actual PC pixels and mouse/keyboard. Verify phone state updates and PC↔phone reconciliation with receipts; no claimed parity from HTTP 200 or code tests.
6. Publish a release-specific deployment receipt on the PC and PWA. Source merge or Cargo compile alone is not a deployed visual acceptance.
7. Never automatically replay uncertain provider sends or restart a busy Studio recording while consolidating UI.

**Rules:** Do not delete donor source or legacy runtime data. Do not expose a non-ported legacy UI as a second default local window. Do not label migration *complete* until the corresponding Host-backed action and GUI are physically tested on the real devices.

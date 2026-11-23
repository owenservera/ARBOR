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

## Graceful merge — design ruling (2026-11-23)

**Status: DESIGN, not feature/device acceptance.** This section refines this existing closure document; it does **not** create a second plan, tracker, frontend, Host, or renderer. Governed by [ONE-CANONICAL-LIVE-SURFACE.md](ONE-CANONICAL-LIVE-SURFACE.md), [the original owner product-design deep dive](../../.coordination/pdr/chatgpt-product-design-deepdive-20261118.md), and the [owner design ruling](../../.coordination/pdr/chatgpt-guidance-20261118-design-ruling.md). Source inventory inspected at ARBOR main \`ca26d4f32ea2106a99b49312e5ba511f44342013\`. The user-facing finish line is a coherent product, **not** a collection of imported dashboards.

### Product decision: collapse interfaces, not value

Retain proven functions, useful information, source provenance, personal history, native device affordances, interaction behavior and recovery. Collapse duplicate navigation, page chrome, alternate app homes, independent state ownership and shadow implementations. A source that remains in the inventory is neither a newly installed capability nor a migration PASS.

**Do not reduce VIVIM to only Chat, Wiki, or an admin dashboard.** The original dimensions of ownership remain: My AI, My Knowledge, My Machine, My Apps, My History and My Evolution. Make each available through one continuous interaction. The user should not need to know which old subsystem provided a capability.

### Screen anatomy: one canvas with progressive disclosure

1. **Quiet default:** a clean graphite First Contact canvas, one shared bottom composer, no forced onboarding, status dashboard, developer cards or phone mirror. Windows application chrome is a **single topmost** native title/menu layer above the canvas (never a second menu under a blue title bar), with File/Edit/View/Tools/Developer/Settings/Help. Mobile uses device-appropriate navigation, not a copy of Windows chrome.
2. **Assisted on input/selection:** semantic recognition (icons, color, inline concepts, links), two-TAB completion, context/source hints, live AutoWiki and visual proposals appear without navigating away or losing draft/focus. The same conversation, Wiki or Build material is one context tray, sheet or expandable workspace. The user can choose a deeper mode; no action is sent merely because text appeared.
3. **VIEW ALL:** an opt-in *user-facing* semantic X-ray showing grounded intent, producer/source provenance, capability identity, missing parameters, ambiguity, rejected candidates, authorization/approval state, revision and counterevidence. It is not restricted to the Developer menu or treated as console debug.
4. **Focused workspace:** expand a useful object (conversation, Wiki page, project, document, agent job, visual program or World entity) into a persistent context workspace **within the same canonical canvas**, with Back/Close returning to the live composer. Switching focus does not spawn a separate product app or produce a duplicate journal.
5. **Explicit effect review:** the same reusable review/diff/approve/receipt/recover interaction is used by Wiki edits, UI revisions, Drive/browser operations and machine commands. Proposed changes are inert until approved by the existing Host, which alone owns effect authorization and persistence.

**Seven existing domains are semantic lenses, not seven independent applications.** Today = temporal priorities/continuity; Talk = provider conversations and comparisons; Build = UI/program/workspace composition; World = objects, relationships and spatial views; Wiki = personal knowledge + contextual AutoWiki; Me = memory, agent, setup and preferences; Control = authorized machine/device actions and history. The current PWA tabs must not be destructively removed before a working, discoverable substitute exists. On mobile, group frequently used lenses behind a small navigation dock with access to all seven; on PC, expose lenses contextually through the canvas and Windows View/Tools menus. Their data, identities, intents and revisions are shared, even when presentation differs.

### Graceful source-to-capability disposition: keep the useful part

| Legacy frontend in Rust SURFACES | Preserve the genuinely useful feature | Collapse into | Retirement acceptance |
|---|---|---|---|
| Host control \`apps/vivim-host/public/index.html\` | Grants, preferences, request review, paired devices, receipts, history/recovery | Native Tools/Settings and shared Control review | Every owner action has a native/Host receipt-backed equivalent |
| Host first-run \`mobile-first.html\` | First Contact baseline and connection clarity | One canonical Home | Same clean Home on direct and cloud mobile; no alternate root |
| Host onboarding \`onboarding.html\` | Private consent, pairing, setup progression | Me/contextual setup + native Settings | Reversible nonblocking setup; no old wizard needed |
| Host chat \`pages/chat.html\` | Deterministic intent preview, saved meaning, command refusal | Talk composer and Assisted/View All | Real UI → Host → visible outcome with no implicit effect |
| Host Wiki \`pages/wiki.html\` | Source search, provenance, edit preview/diff, stale conflict, authorized commit | Wiki contextual view + focused editor | Real revisioned edit/readback on both devices |
| TierFlow \`packages/tierflow/web/index.html\` | Objects, selection, gesture/interaction, pending ops, preview and publish | Build/World with shared VEC semantics | Actual GPUI/PWA visual/interaction parity, no secondary mission-control app |
| Studio capture \`studio/src/studio/ui/index.html\` | Browser capture, recordings, sessions, streams, knowledge, profiles | Native Tools → Capture and Development inspector | Recording/provenance controls work through existing Studio owner/API |
| Studio chat \`studio/src/studio/ui/chat.html\` | Provider selection, saved threads, compare responses, source evidence, personal workspaces | Shared Talk; comparisons as inline/focused workspace | One session identity per provider thread; settled replies and accurate send status |
| Studio craft \`studio/src/studio/ui/craft-intel.html\` | Evidence lineage, reconciliation and coverage | Native Developer → Evidence | Read-only inspection reproduces source-backed outputs |
| Studio Drive \`studio/src/studio/ui/drive.html\` | Site selection, dry-run, queued job, cancel, batch operation evidence | Native File/Tools → Workspace and Drive actions | Dry-run + approval + bounded execution + receipt, no blind multi-send |
| Studio live \`studio/src/studio/ui/live.html\` | Live capture text with source/session identity | Native Tools → Capture session detail | Live observation and disconnect without creating another window |
| Studio mobile \`studio/src/studio/ui/mobile.html\` | Personal-app views and authenticated mobile continuity | Existing canonical PWA Build/Me lenses | Original app capabilities covered by the single PWA entrypoint |
| Studio personal agent \`studio/src/studio/ui/personal-agent.html\` | Bootstrap, personal memory ownership, saved replies, work items, export | Shared Me + native Tools/Settings for local actions | Local-authorized memory/workflow functions and provenance preserved |
| Studio platform \`studio/src/studio/ui/platform.html\` | Source discovery/search/graph, dedupe, registry, CSV, benchmark | Native Developer → Source/Evidence tools | Useful engine capabilities available without serving old HTML |

The **29 donor HTML sources and 5 ARBOR references** are not features to re-create one-by-one. Triage by (a) actual user value, (b) unique functionality already absent from ARBOR, (c) proven underlying API/source, (d) portability/security burden. Port only differentiated capabilities; retain the rest as read-only source/reference, without shipping duplicate UI or asserting parity.

### Architectural merge seam: no iframe migration

Existing **Host** persists authenticated source, live graph/revision identity, capabilities, approval, effects, journal and receipts. **Rust programmable core / VEC / NLCL** provides typed intent, Wiki, visual program and UI revision proposals; TierFlow capabilities are progressively ported to the shared semantic contract, not kept as a competing runtime. **Studio** stays the sole owner of signed-in provider/browser capture and existing sessions/transport, never an alternate VIVIM product. **GPUI** renders the native Windows projection and top-level shell; **PWA** renders responsive mobile from the same Host/VEC semantics.

A port MUST move the **behavior contract and its source identity**, not embed a legacy page, iframe, browser dashboard or pixel stream inside GPUI. Platform-specific presentation and accessibility are allowed; independently authored state and effect dispatch are not. Reuse existing LiveSurface/VEC/Host transports and revision guards; do not introduce a new global reducer, synchronization bus, API backend or private-memory store.

### Migration protocol — preserve, converge, accept, retire

- **Trace and classify:** use current Rust \`SURFACES\` and \`DONOR_SURFACES\` registry and the existing 100-step ledger; inspect each legacy UI's visible actions and underlying API. Mark \`KEEP_ENGINE\`, \`PORT_CAPABILITY\`, \`REFERENCE_ONLY\`, \`RETIRE_AFTER_PARITY\`; maintain distinct CODED/PUSHED/TESTED/DEPLOYED/DEVICE_VERIFIED outcomes. These are dispositions, not additional work queues.
- **Adopt small slices, not wholesale HTML:** start with a complete user journey (composer → semantic preview → contextual AutoWiki → Host approval/diff → persistent revision → both renderers), then migrate high-value Studio Talk/capture and local controls. Port a shared contract once and write only the thin native/web adapters necessary.
- **Shadow comparison:** during each port, preserve legacy source and data; compare old and new behavior in an isolated environment against exact source/identity/revision/effect boundaries. Do not auto-open the old dashboard in normal PC use.
- **Real acceptance:** execute a user-visible interaction on the actual GPUI and actual Android PWA, observe matching Host state, source revision, permissions and receipts, with screenshots/interaction traces. A browser test means real UI event handlers and real visible output; neither isolated HTTP nor unit tests count as user acceptance. No Playwright/Puppeteer. Include one negative/denied/stale case; never resend an uncertain provider turn.
- **One-way retirement:** once the replacement is actually accepted and rollback preserved, disable or redirect the *legacy product HTML route* to the canonical UI and then remove it from release packaging. Preserve API/data, archived HTML and source provenance. Do not disable signed-in provider Chrome or revoke live user sessions while removing old Studio product pages.

### The first practical three product increments

1. **One shell / one Home:** verify GPUI menu at the topmost window chrome and clean composer; ensure the same Direct/Cloud PWA Home and a predictable, nonmandatory Connect action. Guard against alternative installed local UI and implicit dashboard browser launch.
2. **One living interaction:** typed text → deterministic meaning, AutoWiki and explicit review; choose one safe Wiki update, approve through Host, show updated source/revision in GPUI and PWA. Include VIEW ALL and truthful unavailable/uncertain states.
3. **One preserved high-value workflow:** bring real Studio provider thread selection/comparison/capture (using the sole browser owner) into the shared Talk workspace; one verified reply and same-thread continuation must render and persist on the phone before claiming completion. Keep Drive/batch send gated until approval and cancel receipts are complete.

The finished product is **one quiet canvas, one native PC shell, one mobile renderer, one Host authority and deeply preserved capability**, not 49 transplanted dashboards. Do not mark this section implemented merely because this design is committed.

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

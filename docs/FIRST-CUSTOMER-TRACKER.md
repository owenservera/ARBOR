# ARBOR first-customer product tracker

Updated: 2026-11-21. Owner: ARBOR integration. Current execution checkout: `ARBOR-first-contact` (isolated worktree from remote main). Do not overwrite other agents' uncommitted changes.

## Product invariant

Build the customer-facing PWA by actually using it: one blank canvas and a text composer, with user-owned Host authority. Shared Rust product kernel and its WASM ABI own input admission, semantic processing and source-backed projections. The browser still needs platform DOM/CSS/event and network glue; those are not native Rust pixels. Provider sessions are never assumed merely from account registration; verify with existing Studio/Host registry. Never use provider APIs or create competing Host/graph/journal/permissions.

## Priority and disposition

| Priority | Capability | Status | Existing seams / next acceptance |
|---|---|---|---|
| P0 | First-contact blank PWA, single text box | SOURCE IMPLEMENTED, LIVE UNRUN | `?first=1` Direct phone, uses existing pairing, control Host send, Rust first-contact operation |
| P0 | Wiki appears as the user types | SOURCE IMPLEMENTED, LIVE UNRUN | Existing authorized `/mobile/api/wiki` + Rust `wiki-source-stamp`/`wiki-source-search`; display max six admitted results, no writes; verify physical Android and revocation |
| P0 | Genuine on-device Rust WASM artifact and compatible Host | RELEASE BUILT AND ABI TESTED | Installed `wasm32-unknown-unknown` for pinned Rust 1.99.0; normal `build:rust:pwa` succeeded, staged SHA256 `bf18c2b717082034a120eaf5a9b433f923885a1caa33a32041d866c03bfc70a7`, and live-module ABI test passed. Physical Android and Host serving still UNRUN |
| P0 | Verify Tailscale HTTPS URL opens, resumption and sends | UNRUN | Existing `https://desktop-9kb03lu.taild7271a.ts.net/mobile/`, Serve reverse proxy targets 127.0.0.1:43187; cold-start actual Host, WebSocket/network and paired device validation still needed |
| P1 | Search source code + HQKG graph from same composer | NOT WIRED TO PHONE | Existing HQKG indexed sources and owner-only development read port; define carefully scoped, authorized phone read and provenance, no source-leaking shortcuts |
| P1 | PWA conversation reaches signed-in ChatGPT through Studio | NOT YET VERIFIED | Existing Studio/Harness browser owner and relay paths; distinguish this ChatGPT conversation from an authenticated website session; no claim of invisible session equivalence |
| P1 | Wiki-first interaction design and source-detail expand | NEXT UX ROUND | Iteratively author via real owner turns: selection, source cards, links, context, revision receipts |
| P1 | Studio + CraftAnything combined evidence-driven workflow | RESEARCH/CONNECTOR PRESENT | Existing Studio read-only Craft atlas and Labs adapter, bring into real development UX when live evidence available |
| P2 | Personalization and appearance built through NL commands | DEFERRED | Existing TierFlow/VEC, colors, layouts, context, client-side DOM adapter |
| P2 | Replace remaining JS decision logic with typed Rust | CONTINUOUS | Keep browser glue small; source-backed admission and Wiki matching in Rust; do not claim HTML/CSS/native input are Rust |
| P2 | Make first-contact the default product landing | BLOCKED | Only after real paired phone tests, Host approval/effect receipts, WASM proof and offline/revocation acceptance |

## Rust / GPUI migration decision

Tauri is now excluded from active Cargo workspace resolution and removed from the root desktop command. GPUI remains the production desktop entry point, intentionally with its own Cargo lock/workspace. Legacy `src-tauri/` remains as a reference only. This removes the `webkit2gtk` resolver conflict without deleting archived work. Source files are additive in an isolated worktree, and `main` is updated only by a fast-forward push.

## Customer acceptance sequence

1. Open Direct HTTPS mobile URL; resume existing approved phone grant without prompting for provider re-registration.
2. See no tabs, provider buttons, prompts or onboarding clutter; only the single composer.
3. Type an existing Wiki term. Read-only results appear as user types, citing Wiki page/section and source revision; no write or provider call occurs.
4. Type a new command. Rust admits the bounded text; existing Host previews safely; explicit user confirmation remains necessary for any effect.
5. Lose/revoke phone grant. Immediately hide all private results and refuse sends; no old request may repaint the screen.
6. Return and refresh. Existing provider registry and Wiki source are reobserved; no invented ChatGPT session or default billable routing.

## Evidence standard

SOURCE IMPLEMENTED is not a passing mobile browser flow. PASS requires actual commands, HTTP responses, Rust artifact SHA, Host receipt, phone UI/device observations. Never auto-launch agents, book model calls, alter provider configuration or create broad background tasks while executing the first-customer slice.

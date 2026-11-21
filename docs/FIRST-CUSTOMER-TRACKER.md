# ARBOR first-customer product tracker

Updated: 2026-11-21. Owner: ARBOR integration. Current execution checkout: `ARBOR-first-contact` (isolated worktree from remote main). Do not overwrite other agents' uncommitted changes.

## Product invariant

Build the customer-facing PWA by actually using it: one blank canvas and a text composer, with user-owned Host authority. Shared Rust product kernel and its WASM ABI own input admission, semantic processing and source-backed projections. The browser still needs platform DOM/CSS/event and network glue; those are not native Rust pixels. Provider sessions are never assumed merely from account registration; verify with existing Studio/Host registry. Never use provider APIs or create competing Host/graph/journal/permissions.

## Priority and disposition

| Priority | Capability | Status | Existing seams / next acceptance |
|---|---|---|---|
| P0 — AV-01/02/03/07 | Agent's approved draft visibly types into the **real** first-contact PWA field, with preemption and verified finish | **DESIGN READY; FEATURE NOT IMPLEMENTED; DEVICE UNRUN** | [AV-001 design](integration/OW-20261121-PWA-LIVE-AGENT-VISIBILITY-DESIGN.md); existing one-shot `first-contact-composer.ts` + Host Control bridge. Incremental grapheme-safe actual field edits, final-only receipt, no Send; first implementation priority |
| P1 — AV-04/05/06/07 | Dot shows where an **actually dispatched, owner-authorized** agent tap occurred | **DESIGN READY; BLOCKED ON AUTHORIZED UI ACTION; DEVICE UNRUN** | [AV-001 design](integration/OW-20261121-PWA-LIVE-AGENT-VISIBILITY-DESIGN.md); need semantic PWA targets + existing Host Control approval/effect before noninteractive phone-local dot |
| P0/P1 — AV-08 | Owner confirmation on real paired Android PWA, correlation with Host source and Control receipt | **UNRUN; EVIDENCE REQUIRED** | Real device shows visible typing and true tap dot, human intervention cancels and no implicit Send; no synthetic fixture counts as acceptance |
| P0 | First-contact blank PWA, single text box | OWNER PHONE SCREEN OBSERVED; NEW LIVE ROUND UNRUN | Actual Android screenshot confirmed blank composer visible with `vlang` typed. First-contact Wiki mode now has no send button; next owner refresh must confirm immediate search status and sourced outcome |
| P0 | Wiki appears as the user types | LIVE SOURCE + TRACE HTTP PASS; ANDROID REPAINT UNRUN | Input now debounces 180 ms, shows `Searching Wiki…`, fetches authenticated Tailnet-owner Host Wiki, invokes native Rust/WASM source stamp and search, then renders results/explicit zero matches/error. Telemetry POST returns 204 and persists bounded event stages; Android refresh/repaint remains to validate |
| P0 | Genuine on-device Rust WASM artifact and compatible Host | RELEASE BUILT AND ABI TESTED | Installed `wasm32-unknown-unknown` for pinned Rust 1.99.0; normal `build:rust:pwa` succeeded, staged SHA256 `bf18c2b717082034a120eaf5a9b433f923885a1caa33a32041d866c03bfc70a7`, and live-module ABI test passed. Physical Android and Host serving still UNRUN |
| P0 | Verify Tailscale HTTPS URL opens, resumption and sends | LOCAL DIRECT PASS; PHONE UNRUN | Real Host refreshed from GitHub main. Owner-identity Direct simulation: PWA HTTP 200, JS HTTP 200, read-only Wiki HTTP 200 (source rev 1); private device-granted Wiki 401 without enrollment; other Tailnet identity 403. Live phone browser visual verification still outstanding. Host control sends require paired grant |
| P1 | Search source code + HQKG graph from same composer | NOT WIRED TO PHONE | Existing HQKG indexed sources and owner-only development read port; define carefully scoped, authorized phone read and provenance, no source-leaking shortcuts |
| P1 | PWA conversation reaches signed-in ChatGPT through Studio | NOT YET VERIFIED | Existing Studio/Harness browser owner and relay paths; distinguish this ChatGPT conversation from an authenticated website session; no claim of invisible session equivalence |
| P1 | Wiki-first interaction design and source-detail expand | AUTO-SEARCH + READ-ONLY DETAIL IMPLEMENTED | Search triggers while typing without pressing send; panel distinguishes searching, empty, Rust error and source error. A Rust-ranked result expands up to 1,600 Unicode characters of existing Host Wiki, plain text only and revision-bound. Physical Android interaction still pending |
| P1 | Studio + CraftAnything combined evidence-driven workflow | RESEARCH/CONNECTOR PRESENT | Existing Studio read-only Craft atlas and Labs adapter, bring into real development UX when live evidence available |
| P2 | Personalization and appearance built through NL commands | DEFERRED | Existing TierFlow/VEC, colors, layouts, context, client-side DOM adapter |
| P2 | Replace remaining JS decision logic with typed Rust | CONTINUOUS | Keep browser glue small; source-backed admission and Wiki matching in Rust; do not claim HTML/CSS/native input are Rust |
| P2 | Make first-contact the default product landing | BLOCKED | Only after real paired phone tests, Host approval/effect receipts, WASM proof and offline/revocation acceptance |

## Rust / GPUI migration decision

Tauri is now excluded from active Cargo workspace resolution and removed from the root desktop command. GPUI remains the production desktop entry point, intentionally with its own Cargo lock/workspace. Legacy `src-tauri/` remains as a reference only. This removes the `webkit2gtk` resolver conflict without deleting archived work. Source files are additive in an isolated worktree, and `main` is updated only by a fast-forward push.

## Customer acceptance sequence

1. Open Direct HTTPS mobile URL; resume existing approved phone grant without prompting for provider re-registration.
2. See no tabs, provider buttons, prompts or onboarding clutter; only the single composer.
3. Type an existing Wiki term. Within the input debounce, `Searching Wiki…` becomes a source-revision-bearing result or explicit empty/error. No send button, no write and no provider call.
4. Native Host commands and ChatGPT-through-Studio are intentionally **not wired** into unpaired Wiki mode; later command mode requires its own explicit owner authorization and effects remain Host-approved.
5. Lose/revoke phone grant. Immediately hide all private results and refuse sends; no old request may repaint the screen.
6. Return and refresh. Existing provider registry and Wiki source are reobserved; no invented ChatGPT session or default billable routing.

## Evidence standard

SOURCE IMPLEMENTED is not a passing mobile browser flow. PASS requires actual commands, HTTP responses, Rust artifact SHA, Host receipt, phone UI/device observations. Never auto-launch agents, book model calls, alter provider configuration or create broad background tasks while executing the first-customer slice.

## Live event observation round (2026-11-21)

Host emits read-only first-contact diagnostic metadata to `diagnostics/first-contact-events.jsonl` under the existing data root; details, security and cross-session LiveSystemState handoff are in [FIRST-CONTACT-LIVE-OBSERVABILITY.md](FIRST-CONTACT-LIVE-OBSERVABILITY.md). On the development PC, Host HTTP 200 for PWA/JS/Wiki and POST 204 for an **artificial** `wasm-ready` observation passed; disk log confirmed. The focused tests passed 11/11. Real Android events remain unobserved until the owner refreshes the same URL and types again; never confuse this artificial event with a phone receipt.

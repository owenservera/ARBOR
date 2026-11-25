# Native workstation operations — parity and beyond

Owner direction 2026-11-25: all workstation capabilities belong in ARBOR's existing Rust command layer, not in a parallel agent/authority. Reference MIT fork `owenservera/DesktopCommanderMCP-VIVIM` at `9a101b17e44577f0baefa4c7120f087881c5cc56`; preserve upstream license and credits when porting code. Its 25 declared tools are the reference, not a claim of runtime parity. No vendor relay cloning or access-control bypass.

## Native execution contract
Use `core/programmability` typed deterministic planning, preclaim and effect disposition; the existing `vivim-product-pure` kernel for pure transformations. Host alone owns local source grants, command catalog, approval/claim, effects, CAS, receipts, revocation and recovery. Existing HQ work orders, provider admissions and model router remain authoritative. GPUI is the one product renderer; PWA remains its remote viewport. The existing local stdio compatibility adapter is transitional, never imported into the health-only browser tunnel.

The native Rust `workstation-coverage` operation computes exact coverage against the current Host action catalog, without treating source/catalog claims as live acceptance. All proposed workstation action IDs are inert requirements; none is registered by the crosswalk. The `workstation-edit-preview` operation prepares a unique exact replacement bound to source ID and SHA-256, preserves UTF-8/line endings, rejects stale/ambiguous matches and yields before/after digests. Host must bind an approved source and revalidate before any write. No filesystem effects are performed by the pure kernel.

## Work packages
| ID | Capability | Proof required |
|---|---|---|
| N01 | Reference inventory + deterministic edit primitive | Exact-source Rust tests; no fabricated parity |
| N02 | Scoped native filesystem read/list/inspect, multi-read, file search | Existing Host source grants, symlink/reparse protection, bounded results, real fixture files and local acceptance |
| N03 | Native writes, edit/move/mkdir, PDF using supported local document engine | Host-owned target binding, CAS, actual receipts, rollback, refusal and uncertain-outcome tests |
| N04 | Native process/session lifecycle | Explicit authorized process identity, bounded task, progress/output, cancellation and recovery, no implicit replay; no unrestricted browser shell |
| N05 | Config, statistics, receipt visibility | Typed Host policy changes, local receipts and privacy; vendor feedback replaced with owned local feedback |
| N06 | Agent protocols and HQ orchestration | ZCode/Codex/Claude Code/Antigravity/OpenCode/Gemini; actual native task receipts and approved model admission |
| N07 | Beyond parity | Source-grounded HQKG, AutoWiki feedback, typed semantic command reuse, single GPUI surface, multi-device capability routing and end-to-end acceptance |

No capability becomes available merely by listing it. Each action must pass current catalog/executor consistency, source-pinned tests, live acceptance and supported client authorization before exposure.

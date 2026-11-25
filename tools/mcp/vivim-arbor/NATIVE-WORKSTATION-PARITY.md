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

## Independence-first delivery sequence — R015 (2026-11-25)

Owner goal: use Desktop Commander only to bootstrap the smallest self-sufficient VIVIM development loop; then use VIVIM itself to finish native parity. These are ordered slices of N01–N07 and PLAN U01/U02/U10, not a competing backlog or task owner.

Baseline: clone reference 25 tools (24 general plus vendor feedback); ARBOR main 57de3f8, Host catalog v17 / 43 actions / 0 workstation.* registrations; private browser MCP only vivim_tunnel_health, live ready with hostDiscovery=false. Windows N02 source read/search 24/24 and N04 native direct-child 5/5 PASS; no remote workstation acceptance. Local MIT v0.3.4 wrapper historically tested, not independently remote. Commercial allowance last reported 94% consumed; use remaining calls for essential local bootstrap and recovery only.

| Step | Deliverable and dependency | Acceptance before advancement |
|---|---|---|
| B01 | Preserve current working tunnel and launcher; inventory exact installed transport, Host and build roots; stage isolated candidate and rollback. | Existing health still succeeds; source/runtime version and backup recorded. No secret output or live working-tree overwrite. |
| B02 | Host-owned first command execution vertical slice: register the fixed scoped process launch/status/output/cancel contract, bind locally configured executable/workspace/argument rules, reuse plan/digest/approval/claim/receipt and native owned child. Licensed local clone may supply temporary implementation only behind this exact authority, not a direct remote relay. | Launch harmless native version probe and one approved bounded test command, capture actual output/exit code, cancel owned child, reject unauthorized/replayed actions. No automatic retry after uncertain effect. |
| B03 | Authenticated MCP projection of only admitted Host process actions; supported client discovery/refresh, session identity, authorization/revocation and bounded responses. | Actual browser VIVIM call runs harmless command on real Windows PC, returns process handle and correlated result, with denial/cancel tests. Health-only connection retained or recoverable; no generic unrestricted shell. |
| B04 | Persistent process sessions: output cursors, explicit completion, ownership and TTL, bounded concurrent work, native process-tree containment and interactive input where approved. | Start long command, disconnect/reconnect, resume output without loss/duplicates within retention, cancel process tree, never terminate unrelated PID. |
| B05 | Minimal authorized live filesystem: list/inspect/read ranges, mkdir, write/edit within approved development root; atomic writes, stale-digest refusal, symlink/reparse confinement. Reuse existing exact edit preview. | Create/read/edit/readback temporary project test file, reject out-of-scope paths and stale revisions. Real browser calls, not just fixture proof. |
| B06 | Self-build loop: fetch canonical GitHub SHA into isolated source directory, run native Rust/Node checks, capture logs, verify files, no force reset. | One full real ChatGPT -> VIVIM -> local Git/build/test -> receipt cycle, with zero commercial Commander calls. |
| B07 | Self-update and recovery: stage immutable candidate from exact source, validate independently; Host-owned supervised promotion, rollback and reconnection using existing launcher. Do not terminate the only working session before fallback is ready. | Upgrade VIVIM using its own tools, regain browser connection, prove new tool and rollback/reconnect; no secrets copied or unmanaged persistent executor. If supported ChatGPT consent/rediscovery requires user, identify exact action rather than claim automation. |
| B08 | Native ZCode work: start approved scoped agent in isolated workspace using installed native protocol and existing model admission; status/output/cancel and Git evidence. | Genuine task from existing claims ledger, actual agent work/test receipt, source readback, no unapproved paid fallback. |
| B09 | Cutover: retire commercial Commander as routine dependency. | Complete two consecutive real development cycles (including one code upgrade), no commercial calls; keep bounded emergency fallback until independent recovery verified. |
| B10 | Finish full parity incrementally: filesystem breadth, streaming search, editing/rename, process listing/termination with exact ownership, document formats, config, stats and receipts; retire transitional MIT adapter as native equivalents pass. | Each reference operation source-wired, locally tested, and actually callable under appropriate grants; vendor feedback replaced with owned feedback. |

Critical path B01→B02→B03→B04→B05→B06→B07→B09. B08 is the requested practical agent demonstration after B03/B04 with source/workspace safety; it is not a prerequisite to ordinary Git/Rust/Node self-development. B10 may be developed in parallel only where it does not delay the cutover. Host/catalog, transport and local deployment must advance as a vertical slice instead of accumulating disconnected pure primitives.

Prioritize the live process launch/output/cancel slice before richer filesystem formats, fuzzy editing, broad search, other agent adapters or UI work. Use direct GitHub for source work now; use commercial Commander once per genuinely local installation/test batch, not repeated polling when avoidable. No background continuation implied without a verified running scheduler. Current first actionable gap B02/B03 remains OPEN; no new capability is activated by this plan.

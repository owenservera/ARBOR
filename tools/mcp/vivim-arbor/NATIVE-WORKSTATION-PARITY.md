# Native workstation operations — parity and beyond

Owner direction 2026-11-25: all workstation capabilities belong in ARBOR's existing Rust command layer, not in a parallel agent/authority. Reference MIT fork `owenservera/DesktopCommanderMCP-VIVIM` at `9a101b17e44577f0baefa4c7120f087881c5cc56`; preserve upstream license and credits when porting code. Its 25 declared tools are the reference, not a claim of runtime parity. No vendor relay cloning or access-control bypass.

## R031 — Complete 48-deliverable independence and acceleration register (2026-11-25)

Owner requested preservation and enhancement of the original three-era checklist. This is the consolidated view of the original 32 milestones, eight R021 accelerators and eight R023 live-evolution extensions. It is an evidence/acceptance projection of the existing N01–N07, B01–B10 and U01–U12 scope, **not a separate ownership ledger**. Original milestone names are preserved from the recovered conversation list; where the verbatim original was unavailable, labels were reconstructed from R020/R021 and not represented as exact historical quotations.

**Snapshot:** original checklist 15/32 accepted, 9 partial, 8 open (previous frozen R021 baseline 14/32; +1 for R030 direct general terminal). Expanded view 17/48 accepted, 19 partial, 12 open. Extensions overlap original criteria; never add extension completions to the 32-item score. This is a documentation reconciliation based on prior receipts, not a new runtime test. A = accepted at the milestone's defined scope; T = partial/tested; O = open/unverified; P = preserve accepted behavior; P0 = critical-path closure; P1 = acceleration/parity; P2 = later integration.

Evidence references are revision anchors in [HANDOFF.md](HANDOFF.md), unless marked N/B/U/R021/R023 (historical sections here or [PLAN.md](PLAN.md)). A source commit, successful stage or version probe alone does not prove live end-to-end acceptance.

### Era I — Bootstrap and remote execution

| ID | Deliverable | State | Priority | Dependencies | Closure evidence | Current provenance |
|---|---|---|---|---|---|---|
| 01 | Secure independent MCP connection | A | P | — | Independent authenticated transport; reconnect, denial and revocation evidence retained. | R020/R030 |
| 02 | Native Rust process execution | A | P | 01 | Actual native child with exact argv, exit and captured output. | R019/R030 |
| 03 | Host command approval and receipts | A | P | 02 | Plan/digest, local approval, idempotent receipt and denied scope evidence. | R019/R020 |
| 04 | MCP-to-Host execution bridge | A | P | 03 | Real client-to-Host execution with correlated session receipt. | R020/R030 |
| 05 | Live Windows plugin upgrade | A | P | 04 | Source-pinned candidate activated, previous runtime retained, reconnect verified. | R030 |
| 06 | ChatGPT tool discovery | A | P | 05 | Client tools/list exposes installed actions; refresh accepted and actual call succeeds. | R030 |
| 07 | First real remote native command | A | P | 06 | Harmless direct command completes with exit 0 and actual output. | R020/R030 |

### Era II — Eliminate Desktop Commander dependency

| ID | Deliverable | State | Priority | Dependencies | Closure evidence | Current provenance |
|---|---|---|---|---|---|---|
| 08 | Permanent production Host integration | A | P | 04 | Installed Host exposes native actions; authenticated readiness and live effects. | R020/R030 |
| 09 | General authorized terminal commands | A | P | 08 | Dynamic typed argv and cwd via current local grant; actual ChatGPT invocation, not recipe-only. | R030: ctl-c07d97d3f4ed802b |
| 10 | Persistent process sessions | A | P | 08 | Owned session survives connector reconnect; resume status/output within retention. | R020 |
| 11 | Incremental stdout/stderr retrieval | A | P | 10 | Cursor-based separate streams, no duplicate or lost bytes within retention; settled exit. | R020/R030 |
| 12 | Interactive terminal input | A | P | 10 | Live input receipt, actual echo and exit; piped input only; full PTY is 26 subcriterion. | R020 |
| 13 | Process-tree cancellation | T | P0 | 10 | Live remote owned descendant tree cancelled; timeout/drop containment; unrelated process survives. | R030 Windows native tests; remote descendant proof open |
| 14 | Live filesystem read and listing | A | P | 08 | Real granted root list/read with exact bytes and denial outside scope. | R020 |
| 15 | Live filesystem write and editing | A | P | 14 | Scratch create/edit/readback, stale digest refusal; no unrelated source mutation. | R020 |
| 16 | Native Git synchronization | A | P | 09 | Fetch and non-destructive fast-forward to exact GitHub SHA, verified readback. | R020 |
| 17 | Independent Rust and Node builds | T | P0 | 09,16 | VIVIM-only source-pinned Rust and Node build/test runs, real exit 0, logs and artifact hashes; no Commander. | R030 build via temporary bridge |
| 18 | Self-update and rollback | T | P0 | 13,17,L+01–07 | VIVIM-owned supervised stage/promote/reconnect, failed-candidate rollback, stable data and grants; no Commander. | R030 assisted handover |
| 19 | Real ZCode agent development task | O | P0 | 09,11,12 | Direct CLI bounded real claimed task; actual selected approved Codex OAuth model, output, test and Git evidence; no workflow or silent fallback. | R030 version only; R027 model constraints |
| 20 | Two complete independent development cycles | O | P0 | 13,16–19 | Two consecutive cloud-code → VIVIM sync/build/test/receipt cycles, one upgrades the runtime; zero Commander calls. | B09 open |

### Era III-A — Original full parity and beyond

| ID | Deliverable | State | Priority | Dependencies | Closure evidence | Current provenance |
|---|---|---|---|---|---|---|
| 21 | Streaming filesystem search | T | P1 | 14 | Recursive bounded search, streamed pages, cancellation, exclude rules and real large-tree measurement. | R021 selected literal search only |
| 22 | File metadata and multi-file operations | T | P1 | 14 | Typed metadata, batch reads, per-file failures, limits and symlink/reparse denial, live calls. | R021 selected multi-read/basic metadata |
| 23 | File creation, move and rename | T | P1 | 15 | Create directories/files, CAS-bound move/rename with collision and recovery proof. | R020 scratch create/edit |
| 24 | Native PDF, DOCX and Excel operations | O | P2 | 14,15 | Read/create/edit supported documents with fidelity, limits and round-trip verification using owned document tooling. | N03 |
| 25 | Advanced fuzzy editing and diff | O | P1 | 15 | Unique match preview, ambiguity/stale refusal, digest-bound patch, diff and reversible receipt. | N01 exact preview only |
| 26 | Process discovery and management | T | P1 | 10,13 | Authorized process listing, identity-safe owned termination, resource stats; ConPTY/PTY resize, Unicode and terminal control acceptance. | N04/R030 piped sessions |
| 27 | Configuration and operational statistics | O | P1 | 03,08 | Typed centrally owned configuration, revision and permissions, usage/latency/errors, receipt readback and revocation. | N05 |
| 28 | Multi-device management | O | P2 | 01,08 | Explicit per-device identity, scoped pairing, command routing, disconnect/reconnect and revocation; no cross-device leakage. | N07 |
| 29 | Native agent integration | T | P1 | 19,A+05 | Approved adapters for relevant installed agents; common lifecycle, model verification, budget and cancellation receipts. | R027/R030 direct CLI version |
| 30 | VLANG and AutoWiki integration | O | P2 | A+07 | Existing registry projects command descriptions and actual execution receipts into VLANG/AutoWiki; no second compiler or graph. | N07 |
| 31 | GPUI and mobile operational parity | O | P2 | 28,A+07 | One GPUI surface mirrored to paired phone, same commands and actual physical device receipts. | N07 |
| 32 | Retire transitional Commander engine | T | P1 | 20,21–31 | Inventory remaining reference operations, verify owned equivalents and remove routine dependency; preserve supported emergency recovery. | R030 routine policy cutover |

### Era III-B — Original acceleration extensions

| ID | Deliverable | State | Priority | Dependencies | Closure evidence | Current provenance |
|---|---|---|---|---|---|---|
| A+01 | Source-pinned development pipeline | T | P0 | 16,17 | Exact SHA, approved edit scope, resumable build/test logs, exit and receipt; no dirty checkout overwrite. | B06/R030 |
| A+02 | Intelligent test selection | O | P1 | A+01,A+07 | Existing HQKG impact selection compared with full suite; track false negatives, periodic complete runs. | R021 |
| A+03 | Rust build acceleration | T | P0 | 17 | Reuse existing cache/Blaze tooling where available; measured cold/warm speed, disk/RAM ceilings and correctness parity. | R030 cache reuse; acceleration benchmark open |
| A+04 | Automated release lifecycle | T | P0 | 18,L+01–07 | Immutable manifests, supported staging, supervised promotion and rollback, grant renewal and real recovery. | R030 assisted handover |
| A+05 | Native agent task contracts | T | P0 | 19 | Existing claim/task binding, explicit model and budget, progress, pause/cancel/resume and evidence handoff. | R027/R030 |
| A+06 | Parallel native development | O | P1 | A+01,A+05 | Resource-bounded jobs and isolated outputs using existing HQ/Host coordination, no duplicate writers; owner-approved concurrency. | R021 |
| A+07 | Universal capability descriptions | T | P1 | 08 | Existing typed catalogue projected to MCP/VLANG/GPUI/AutoWiki/graph; revision consistency and no duplicate registry. | R030 catalogue v24; projections open |
| A+08 | Development-cycle benchmarks | O | P1 | 20,A+01–06 | Measure baseline vs improvements: edit-to-verified result, cold/warm builds, manual interventions, retries, resource use and relay calls. | R021 |

### Era III-C — Original future-proof live-evolution extensions

| ID | Deliverable | State | Priority | Dependencies | Closure evidence | Current provenance |
|---|---|---|---|---|---|---|
| L+01 | Exact release and runtime-binding evidence | A | P | 17 | Seal exact candidate, tests and runtime identity; tamper rejection and real staging readback. | R030 sealed release |
| L+02 | Minimum-interruption change classification | T | P0 | L+01 | Classify doc-only/no restart, compatible reload, catalogue refresh, full handover; verify each path. | R023 |
| L+03 | Stable control plane and maintenance | A | P | 08 | Live health persists, drain admitted calls, new effects blocked, status/output retained; supervised maintenance clear. | R030 live maintenance |
| L+04 | Generation-pinned native workers | T | P0 | 13,L+03 | Existing sessions finish on old generation; new sessions use verified next; durable output and receipts. | R023/R030 containment only |
| L+05 | Supervised Host handover | T | P0 | L+01,L+03,L+04 | Host-wide quiescence, data binding, one writer, readiness and reconnect via owned lifecycle. | R030 bridge-assisted handover |
| L+06 | Transactional promotion and recovery | T | P0 | L+05 | Durable transaction and previous runtime, deliberate failed-candidate recovery, crash/restart and no duplicate effects. | R030 rollback backup only |
| L+07 | Compatible contracts and authorization lifecycle | T | P0 | L+02,L+03 | Versioned contracts, explicit supported renewal/revocation, Studio UI refresh and actual new-client call. | R030 refresh and direct call; renewal open |
| L+08 | Component-level live replaceability | O | P1 | L+04,L+06,L+07 | Independently replace worker/adapter/semantic projection with measured interruption and rollback; reuse existing owners. | R023 |

### Execution order — immediately actionable critical path

1. **Preserve existing access:** discover actual tools, health and current grant; read [R030 startup contract](HANDOFF.md#r030--production-general-terminal-accepted-mandatory-vivim-first-migration-2026-11-25). PowerShell 7+ only; never assume a time-limited grant is still valid. Record exact source/runtime identity. Coordinate via existing TASK-CLAIMS and canonical ARBOR tracker before source changes.
2. **Close 13/17 and A+01/A+03:** use direct VIVIM sessions for real descendant cancellation and exact-source Rust/Node build/test with actual exit. Use bounded scratch fixtures, resource headroom, and no unrelated process termination.
3. **Close 19 and A+05:** direct installed ZCode CLI (no workflows), discover actual registered Codex OAuth model ID, verify actual model usage on a bounded approved task. Preferred GPT-6.2 Sol, GPT-6 only as owner-named alternative if verified and admitted; no silent fallback. Avoid shared config mutation. Run in isolation, maintain task claim and read back changes; ChatGPT/GitHub retains primary source authority.
4. **Close 18 with L+01–07/A+04:** build and seal a candidate, use the supported locally authorized release lifecycle, keep previous known-good runtime, drain all affected work, test failed-candidate recovery and verify connector recovery. Native Studio settings navigation/scroll/Tools/Refresh tools and actual client discovery become a reusable supported operation. If a required authority is unavailable, report blocker rather than bypassing the installed grant. No routine Desktop Commander.
5. **Close 20 and A+08:** record two successive complete independent cycles, one actual upgrade, with zero commercial Commander calls; establish measured baseline and only then claim independence at the broader scope.
6. **Expand Era III:** N02/N03/N04/N05 parity breadth → A+02/A+06/A+07/L+08 → N06/N07 integration, coordinated with existing product owners. Continue allowed non-conflicting parallel work without delaying critical path.

### Enhanced future-proof acceptance refinements (subcriteria, not new numbered milestones)

- **18/L+06/L+07 — one-click onboarding and recovery:** versioned installer exposes optional computer control after signed-in provider selection, explicit authorization, pairing, tool discovery, expiry/revoke and recovery; prove clean install and repeat install on separate development candidate, never overwrite working production to test.
- **26/L+04 — terminal fidelity:** distinguish current piped sessions from actual ConPTY/PTY. Verify resize, Ctrl-C semantics, Unicode, long output, backpressure, reconnect and bounded retention; no claim of full terminal emulation until accepted.
- **27/L+07 — central settings ownership:** use existing Host configuration and revision authority; surface scoped settings and grant status in GPUI/paired viewport; audit without exporting secrets; no second settings store.
- **29/A+05/A+06 — agent acceleration:** use direct CLI adapters and existing model registry, observable model identity, approved costs, cancellation, non-overlapping work and measured parallel gain; no duplicate scheduler or default delegation.
- **31/A+07/L+08 — reusable UI operations:** Studio understands external software; VLANG internal capability descriptions. Use existing typed registry, proven browser interactions, Host receipts and single GPUI surface. Respect current product-workstream owners; this lane owns the tooling integration only.
- **A+08 — measurement and reproducibility:** measure real wall time, memory, free disk, cache hits, manual interventions, retry count, evidence integrity and zero commercial calls. Compare like-for-like source and toolchain; separate local verification from cloud code/test evidence.

### Receipt and status update contract

For each attempted closure capture: milestone ID, existing claim/owner, timestamp, canonical source SHA and deployed runtime SHA (separate), exact non-secret command or operation, approved scope, plan/session receipt identifier, exit and stream completion, artifact digest or observable readback, test environment, negative test and remaining blocker. Record evidence in HANDOFF and canonical existing tracker/claim, then update this projection. Never infer acceptance from a listed tool or source-only implementation. Keep historical checkpoint sections unchanged. No new scheduling or grants implied by this register.

## R030 — Live production terminal accepted

General terminal is operational in production and directly callable from ChatGPT. [Handoff R030](https://github.com/owenservera/ARBOR/blob/main/tools/mcp/vivim-arbor/HANDOFF.md) records verified release, tests, client refresh and actual native command receipt. Routine local operations are VIVIM-first. Remaining parity is not yet complete; the historical strict checklist must be reconciled against evidence before increasing its count.

## R028 (historical) — Owner P0 override: general terminal

General-purpose terminal execution is the sole immediate MCP independence priority. Reuse the current Rust worker and Host plan/receipt/session lifecycle; replace per-command recipes for this explicitly locally authorized mode with a general argv/cwd/program contract. Source 596ff8c and tests 8fb581b define its initial strict request shape; 18 focused V8 checks passed, not deployed. Next: locally authorized program resolution and explicit terminal grant, Host dispatcher/session wiring, private MCP projection, supervised install and live Windows acceptance. Existing recipe grant does not authorize this new mode. A working directory is not a sandbox. Accept real dynamic argv, interactive input, cancellation, reconnect, denial without grant, then direct ZCode CLI using verified Codex OAuth model selection. Defer all unrelated work; retain working tunnel. Strict 14/32 unchanged.

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

## R021 — Dedicated independence and acceleration ownership (2026-11-25)

Current observed baseline: 7/7 Era 1, 7/13 Era 2, 0/12 Era 3 = 14/32 strictly live-accepted. This is a conservative checklist count, not percentage of all engineering work. Live VIVIM health ready/private-workstation/12 tools; eleven recipes in the current grant, arbor and scratch roots. Previous actual remote operations are documented in R020 HANDOFF. Do not regress this baseline. Source implementation alone is not acceptance.

| Era 2 remaining | Evidence and next action |
| --- | --- |
| General authorized terminal commands | Registered recipe execution works; broaden typed development operations only via locally admitted recipes/Host. |
| Process-tree cancellation | Windows creation-time Job Object source fca7d0e; additional drop test d9d8998; compile, real descendant cancellation, timeout and unrelated-job protection, then live deployment. |
| Independent Rust and Node builds | Cargo previously launched Rustup; Node printed passes but timed out. Toolchain pinning d9d8998 and local build/stage entrypoint 7ccd378 are source-only. Verify actual exit, not TAP lines alone. |
| Self-update and rollback | Stage entrypoint exists; installed profile has no builder/promotion recipe. Need supported locally admitted build capability, coordinated replacement, prior runtime recovery, reconnect and rollback proof. No bypass or use of commercial Commander. |
| Real ZCode task | Existing grant includes version/help only; use native protocol, scoped actual work order and existing provider admission. |
| Two independent development cycles | Each real cycle syncs, implements, builds, tests and records evidence using VIVIM/GitHub; one cycle includes an upgrade. |

Era 3: keep all 12 original deliverables: streaming filesystem search; metadata/multi-file; create/move/rename; PDF/DOCX/Excel; fuzzy edit/diff; process discovery/management; config/statistics; multi-device; native agent integration; VLANG/AutoWiki integration; GPUI/mobile parity; retire transitional Commander engine. Existing selected multi-read and selected literal search source 4c00dd7 are partial, not recursive streaming or live acceptance. Basic file metadata, directory creation and exact edits have live evidence but do not complete their larger Era 3 checklist items.

**Beyond parity, focused acceleration extensions (not a competing backlog):**
- A+01: source-pinned edit/build/test pipeline and resumable logs, with actual exit and receipt.
- A+02: incremental source/impact-driven relevant test selection using existing HQKG source intelligence; compare full suite and retain periodic complete verification.
- A+03: reuse existing Rust build acceleration/cache tooling; choose CPU/RAM/disk-aware job limits, measure cold/warm rebuilds, avoid duplicate caches.
- A+04: exact source/runtime manifests, staged release, supervised promotion/rollback and supported authorization renewal; never overwrite sole known-good runtime.
- A+05: native agent task contracts (ZCode first), task-claim/source ownership, scoped cost admission, pause/cancel/resume, evidence handoff.
- A+06: parallel isolated build and agent workloads, concurrency/resource scheduling through existing HQ/Host contracts; no competing orchestrator.
- A+07: canonical machine-readable typed capability descriptions consumed by existing VLANG/MCP/GPUI/AutoWiki/graph surfaces, without a second registry or renderer.
- A+08: real development-cycle benchmarks: time from approved source change to verified local result, cold/warm rebuild, failed retries, manual interventions, local resource consumption and zero commercial relay calls.

Priority: finish Era 2 before broad Era 3 expansion; implement A+01/A+03/A+04 on the critical path, then A+05/A+02/A+06/A+07/A+08 as they accelerate the vision. Research and product intelligence workstreams are consumers, not ownership targets. Rust first. Existing Host remains effect authority. Update the existing claims ledger and tracker rather than adding independent work ownership. All source changes to main use compare-and-set and exact readback.

## R023 — Future-proof live evolution (subdeliverables of B07/A+04/A+07)

Owner priority: maximize in-place upgrades without weakening existing authority or interrupting unrelated work. The original 32 checklist items and eight acceleration extensions remain unchanged. These eight additional acceptance work packages refine existing scope; they are not eight extra completed checklist items.

| ID | Future-proof work | Acceptance |
| --- | --- | --- |
| L+01 | Exact release and runtime-binding evidence | Complete candidate sealed against successful builds; changed data root/executable/config forces handover; reject tampering. |
| L+02 | Minimum-interruption change classification | Documentation-only no restart; compatible adapter reload only; explicit contract changes refresh metadata; unknown changes conservatively require handover. |
| L+03 | Stable control plane and maintenance | Keep tunnel and health available, drain admitted calls, reject new effects while maintaining permitted output/status. |
| L+04 | Generation-pinned native worker lifecycle | Existing sessions finish on their original worker generation; new sessions start on verified next generation only; Windows Job Object containment and durable output/receipt reconciliation. |
| L+05 | Supervised Host handover | Verify all affected product work is quiescent, preserve same data and authority, never overlap production writers, bounded recovery without effect replay. |
| L+06 | Transactional promotion, rollback and crash recovery | Keep previous immutable runtime; verify local activation, reconnect and rollback through durable release transaction; prove recovery with an actual failed candidate. |
| L+07 | Compatible contracts and authorization lifecycle | Independently version capabilities and adapters; retain scoped locally approved grant, renew through supported authorization, verify client discovery only when needed; no indirect grant expansion. |
| L+08 | Component-level replaceability | Independently versioned workstation workers, agent adapters, computation and semantic capability projections; use existing Host/registry/GPUI contracts, verify actual interruption and resource cost. Product intelligence implementation remains with its owning workstreams. |

Current: L+01–03 have source implementation and limited logic verification, not Windows deployed acceptance. L+04–08 are incomplete. Strict original acceptance remains 14/32. First prerequisite: locally admit a verified build/stage and promotion lifecycle; current production tool catalogue does not expose that operation. No commercial Desktop Commander, no unapproved indirect command path. A source fast-forward is not a runtime upgrade.

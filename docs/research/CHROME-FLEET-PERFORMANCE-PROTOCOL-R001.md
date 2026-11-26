# VIVIM Chrome Fleet Performance Protocol — R001

Date: 2026-11-26
Status: PROVISIONAL / PRESSURE TEST REQUIRED / NOT DEPLOYED
Scope: dedicated, authenticated real Google Chrome fleet workers on Windows; not the VIVIM product UI.
Authority: existing Host/Studio ownership, grants, journal, receipts and recovery. No provider API, alternative browser driver, or independent execution authority.

## 1. Objective and invariants
Maximize reliable concurrent AI web-app throughput and incremental incoming stream delivery; minimize local latency, CPU, RAM, disk writes and unnecessary browser work. Never trade correctness or security for speed. Preserve signed-in profiles, exact tab/thread ownership, drafts, observed or uncertain turns, and independent next-turn readiness. Never automatically resend an observed/uncertain turn. Keep Chrome sandbox, site isolation, TLS verification, and security updates. Loopback-only CDP on a dedicated user-data directory; no credentials in telemetry. No online research was performed for this proposal.

## 2. Baseline and configuration candidates
Local inspection of studio/src/chrome/launch.mjs found dedicated profile, loopback CDP, no-first-run/no-default-browser-check, optional extra arguments, and Chrome/Chromium/Edge discovery. The production fleet should pin and validate installed Google Chrome Stable; reject silent browser-family fallback. Current deployed version, process arguments and settings must be measured, not inferred from source.
Default experiment: one managed Chrome instance with independently owned tabs, compare separate profiles/processes only when isolation or performance warrants it. Preserve authentication; no shared profile across simultaneous browser processes.
- Exempt active AI sites from Memory Saver/discard; disable Energy Saver for dedicated workers as a test variable. Idle workers may be recycled only with proven safe state.
- Keep hardware acceleration initially; compare GPU on/off only with measured CPU/GPU/memory tradeoffs. Avoid unnecessary windows, animations, notifications, media autoplay, preloading and nonessential extensions/sync. Preserve required extensions, cookies, site data and cache.
- Keep network connections warm and reuse normal Chrome networking. No provider direct endpoints; do not disable certificate checks or HTTP security.
- Selective image/media blocking only after provider-specific compatibility evidence; never block required scripts, styles, fonts, auth, challenge, or stream requests blindly. Prefer supported settings over internal flags.
- Normal Windows priority initially; evaluate Above Normal only with whole-system contention measurements. No realtime priority.
- Candidate launch flags, individually tested against default: --disable-background-timer-throttling, --disable-renderer-backgrounding, --disable-backgrounding-occluded-windows, --disable-extensions (only if none required), --disable-sync. Existing --no-first-run and --no-default-browser-check are startup convenience, not proven stream improvements. Flags may be ignored/changed by Chrome; record exact version and observed behavior. Minimized, covered, background, and foreground are distinct cases. Removing background throttling can worsen fleet-wide CPU/memory and fairness. No blanket flag bundle or policy mutation.
- No active production settings change before acceptance; use owned test routes, safe restart/restore and rollback.

## 3. Streaming architecture
Reuse incumbent Studio capture/CDP, Host journal, and provider adapter registry. Rust-first for hot-path implementation where justified; avoid second driver or authority. Persistent CDP event capture bound to exact browser epoch/target/session/request/turn. Use incremental response data where actually supported and validated (SSE, WebSocket or provider-specific framing); dataReceived byte counts alone do not prove content. Handle split UTF-8/JSON/SSE frames, event ordering, duplicates, cancellation, navigation, disconnect and reconnection. Network/DOM reconciliation verifies final text and independent composer readiness; transport completion alone is insufficient. Retain a bounded DOM fallback and fail closed on uncertainty.
Use bounded queues, incremental parsing, sequence numbers and monotonic timestamps, low-copy buffers, asynchronous persistence with explicit durability and backpressure. Coalesce UI updates without losing ordered data. Eliminate redundant screenshots, full DOM scans, polling and repeated whole-response serialization when measured; no loss of evidence or mandatory receipts. Separate low-latency forwarding from archive/export work, retain original evidence and preserve reconciliation on overflow. Avoid multiple consumers recording the same stream unnecessarily.

## 4. Engineering tracks
| ID | Deliverable |
|---|---|
| F01 | Dedicated Chrome performance profiles and exact executable pin |
| F02 | Event-driven capture instead of avoidable polling |
| F03 | Incremental SSE/provider stream decoding |
| F04 | Low-copy Rust buffers where practical |
| F05 | Eliminate repeated full DOM scans |
| F06 | Eliminate unnecessary screenshots |
| F07 | Active/idle worker scheduling |
| F08 | Adaptive fleet concurrency |
| F09 | Move noncritical disk persistence off hot path |
| F10 | Persistent CDP connections |
| F11 | Connection warming and reuse |
| F12 | Memory-pressure-aware fleet management |
| F13 | Conversation DOM bloat management |
| F14 | Exact stream completion and independent readiness |
| F15 | Per-worker performance telemetry |
| F16 | Safe worker recycling and recovery |
| F17 | Immediate event-driven orchestration |
| F18 | Selective capture without evidence loss |
| F19 | Backpressure and bounded queues |
| F20 | Chrome flag A/B benchmarking |

## 5. Pressure-test procedure (UNRUN)
1. Record OS, Chrome executable/version, launch args, profile policy, power source, hardware, available memory/disk, Studio/Host source and runtime IDs, provider/model, response size, active workers and tab visibility. Inventory Chrome process tree without reading credentials. Establish an unmodified baseline.
2. Run real, authorized, exact-owned web conversations at concurrency 1, 2, 4, 6, 8 (only escalate if resources and provider limits permit). Use matched prompt/output classes; alternate baseline and one candidate, randomize order where practical; distinguish cold/warm runs. Repeat sufficiently (initial target 20 completed observations per condition; expand for noisy tails). Record failures and censoring; do not silently drop slow/failed turns. Do not retry uncertain submissions. Test active background, occluded/minimized, foreground and mixed idle/active workloads. Avoid production sessions and rate-limit violations.
3. Timestamp dispatch, observed send, response headers, first decoded content delta, each received delta, local ingress/forward/consume, terminal event, final verification and independently settled readiness. Use monotonic elapsed time within process; cross-process comparisons require calibrated clock or same-clock ingress/egress. Measure p50/p95/p99 local forwarding, provider time-to-first-content separately, throughput, maximum inter-delta gap, queue depth, CPU (Chrome tree/Host/system), working set and commit, paging, disk writes, GPU, reconnects and completion/uncertainty. Provider model speed is not browser performance. Preserve final evidence hashes and attributable byte/text coverage; never claim incremental capture from a single final snapshot.
4. Pressure test long conversations, extended soak (initial target 60 minutes), memory pressure, network interruption, CDP disconnect, navigation, slow consumer and disk pressure. Use bounded tests and stop on safety/ownership/draft risk. Test recorder lifetime across outgoing send, partial stream, terminal event and settled readiness. Confirm overflow is observable and recoverable without silent loss or duplicate sends.
5. Compare one variable at a time; then test only individually accepted candidates together. Report raw receipts, distributions, sample count, failure counts, version and exact configuration. Record negative findings. Re-run baseline after changes to distinguish provider drift.

## 6. Provisional targets and promotion
- Local forwarding p95 <=10 ms from attributable decoded delta ingress to Host consumer, explicitly excluding provider generation/network; measure, not assume.
- Zero avoidable stream polling in proven event-driven paths; fallback permitted and labelled.
- Zero duplicate submissions, missing final response content, cross-thread attribution errors, lost drafts, unauthorized effects or silent data loss.
- Higher verified completed turns per minute at equal correctness, no material regression in tail readiness, memory pressure or system responsiveness. Suggested initial performance promotion threshold: >=10% improvement in target metric or demonstrated resource reduction at equivalent throughput; repeat to distinguish noise. This is a proposed threshold, not a measured fact.
- No universal fleet size guarantee. Admission adapts to measured CPU, memory/commit/paging, queue pressure and provider limits; pause escalation on contention. Preserve fairness to active workers.
- Promote a candidate only with actual live acceptance, recorded owner/Host authority, exact version/configuration and repeatable evidence. Keep default profile configuration and prior runtime available for rollback. On any invariant violation or material regression, stop new dispatches, reconcile active/uncertain turns, safely restore previous config using the managed supervisor. Never kill unrelated Chrome or abandon unresolved sends.

## 7. Next execution sequence
A: capture actual baseline and repair streaming lifecycle/settlement if required; do not confound browser settings with capture bugs.
B: run profile and fleet concurrency experiments plus event-path overhead analysis.
C: pressure test combined winners and publish an evidence-backed R002 production recommendation, including rejected settings and rollback.
Coordinate with existing Harness engineering/integration/planning owners; this document is not a second backlog, a deployment authorization, or a claim that tests passed.

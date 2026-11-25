# LEGACY-001 — ChatGPT account history synchronization integration R001
2026-11-25 | Owner-requested implementation plan; not implemented or live verified.
Canonical product: ARBOR main, existing Studio/Harness/Host. Crosswalk #32 and #33 (A09–12, A16, O01–06, C01–05, U05–07, S10/S13). No new parallel backlog or source owner.

## Goal
From GPUI or its paired PWA viewport, the owner can request "Sync ChatGPT", "Enable real-time sync", search/read their locally synchronized history and resume a specific original thread through the existing Host-approved send path. Full means all accessible, authorized records in the declared scope, with measured coverage; never assume remote completeness from a partial view. Sync is read-only at the provider, local persistence is explicit, and continuation is a separate effect.

## Recovered donor evidence
Local root: vivim-app-og (non-Git copy inspected 2026-11-25; source ancestry and license still to verify). Paths relative to it:
- EXTENSION/extension/background/sync-engine.js (360 lines; actual pagination, dedup, rate-limit handling, bounded pool and detail retrieval).
- EXTENSION/extension/conductor/chatgpt_bridge_backend_overlay/background/{sync-engine.js,conv-parser.js,actions.js,api-client.js,state.js,rpc-schema.js,message-router.js}; overlay README documents historical pagination/hydration, SSE, attachments and backoff.
- docs/superpowers/plans/2026-04-27-chatgpt-sync-m1-backend.md (plan, not implementation receipt).
- pwa-integration-plan/chatgpt-full/chatgpt-specs/05-ChatGPT-Synchronization-Orchestrator.md (reference algorithm: header fingerprints, delta hydration, fast-track on change).
- pwa-integration-plan/chatgpt_pwa_sync_full_code.md; EXTENSION/CHATGPT-PROTOCOLS.md (research).
- vivim-windows-app/db/bridge/sync/chatgpt.py (normalization/import candidate only; Playwright transport excluded).
- EXTENSION/server/sync/sync-engine.ts is explicitly simulated/stubbed; reject as production donor.
- Older parser picks first leaf and flattens messages; this loses sibling branches and may choose wrong active branch. Do not copy behavior. Old fingerprint rounds timestamps and uses title length at dataset level; equal-length title edits and subsecond changes can collide semantically. Improve canonical hashing.
No donor code, personal history, credentials or raw account traffic was copied to Git in this plan. Historical live success is owner-reported, current compatibility unverified.

## Canonical boundaries
Read docs/product/STUDIO-CORE-CONVERGENCE-R001.md, studio/README.md, issue #32 and #33, Labs TASK-CLAIMS, and Labs adaptors-providers/UNIVERSAL-API-V2.md + stream envelope before claiming a slice. Recheck main and live owners. ARBOR current source owns implementation, not legacy vivim-web-harness duplicate. Studio's existing browser actuator, accepted session/account binding, capture and decoder own browser observation; Host alone authorizes and supervises. No second CDP actor, provider API substitution, Playwright/Puppeteer, token extraction/export, arbitrary evaluate public tools, independent send worker or legacy UI. Use approved observations of normal signed-in web-app activity and supported UI interactions; check current compatibility and provider constraints. If access is unsupported/denied, report partial coverage or use owner-provided official export; never bypass restrictions. Native Rust for pure computation; retain minimal MJS adapters at existing boundaries until equivalence is proven. No second conversation store/catalogue/journal/graph. Preserve existing local records, pairing/URL and uncertain-send fences.

## Era 1 — Recover and implement read-only sync (P0)
H01 Donor census: source/hash/license, distinguish implementation vs overlays/extracted third-party references vs stubs. Find original commit if available; inspect dependency closure and tests; no indiscriminate copy.
H02 Reconcile current Studio sources: studio/src/capture/conversation-{service,runtime,thread,browser-adapter,prefix,evidence}.mjs, studio/src/studio/conversation-{api,events,tools}.mjs, existing store/versioned, Host corpus and conversation projection. Map exact existing read/write/identity owners and obtain claims; no changes to busy sessions.
H03 Establish owner-authorized scoped read using verified account binding. Dedicated signed-in Chrome; normal provider history listing/navigation, permitted observation and official export fallback. Test one authorized record, record opaque IDs and coverage only. Determine actual archived/project/branch/attachment visibility. No fabricated data or provider calls from native engine.
H04 Pure Rust normalization: typed conversation header, tree nodes (parent/children/current node), content parts, attachment references, provider/account/workspace/thread key, source revision, observed time, digest and provenance. Validate unknown fields, duplicate IDs, missing links, cycles, malformed timestamps, orphan nodes. Preserve all observed branches; never invent unavailable content. Compare against approved donor inputs locally with redacted receipts; no private fixture commits.
H05 Pure Rust sync planner: bounded page traversal, repeated-cursor detection, stable ID dedupe, revision and content digest comparison (full canonical title, no lossy timestamp rounding), prioritized hydration, backoff on throttling, cancel and restart. Separate page cursor from committed durable checkpoint; no advance on failed transaction. Explicit partial/truncated/unavailable states. Never infer deletion from a missing page or inaccessible chat.
H06 Persistence: existing Studio/Host canonical local records and revisioned storage; transaction/CAS or current supported atomic write and readback. No new DB service; use existing native storage integration if applicable, decide after census. Raw content stays local, account-separated, access-restricted; protect at rest according to current product policy and report limitations. Do not write content into HQ/dev wiki, cloud logs or Git. Retain provider references, local user annotations and revision history. Support grant revocation, pause and user-approved removal.
H07 Real initial sync: start with a bounded authorized scope, then full accessible scope under explicit owner authorization. Count enumerated, hydrated, unchanged, failed, unavailable, archived, unresolved and attachments independently; compare against visible source scope/export when possible; restart, duplicate run, offline search and persistence readback. No claiming completeness without authoritative coverage evidence.

## Era 2 — Continuous synchronization and local intelligence (P0/P1)
H08 Host-supervised sync lifecycle per account/scope (idle, enumerating, hydrating, live, paused, offline, throttled, reauth_required, partial, failed). One lease per account and one writer; coalesce events, persist checkpoints, no busy-tab interference. Observe settled changes from existing Studio events, then bounded reconciliation on reconnect; periodic refresh only under explicit active grant and supported transport. No promise of instant unseen remote events. Target locally observed settled turns visible within 2 seconds p95 as an engineering goal, measure actual; other-device changes eventually reconcile when allowed.
H09 Read model: reuse canonical personal World search/index, offline conversation listing, full-text retrieval, branch selection, timestamps and attachment availability. Search must distinguish source record vs local annotation, account and scope; no inference-only results. Private corpus grant separately authorizes Oracle/AutoWiki semantic projection (no raw developer wiki ingestion); support correction, revocation and deletion propagation.
H10 VLANG/Host integration: derive typed operation identities from current registry (proposed labels, not registered IDs): history.sync(scope), sync.enable(scope), sync.pause, sync.status, conversation.search(query), conversation.read(ref,branch), conversation.open(ref), conversation.continue(ref,message), attachment.retrieve(ref). Sync.enable requires active persistent read grant; local read vs external read vs send distinct; exact account/thread resolution, ambiguous matches disambiguate, no LLM required for known commands. All effects use canonical Host plan/receipt and existing Studio transport. No raw scripts or credentials exposed.
H11 GPUI: history library, searchable list, thread tree/transcript, sync control/status and provenance, partial/offline/reauth/error and pause/resume. Paired phone shows the same native GPUI surface, not a second web renderer; preserve current pairing and phone URL. Local search available when disconnected from provider (paired Host still required on phone).

## Era 3 — Historical interaction and provider expansion
H12 Open and continue original ChatGPT thread: exact provider/account/thread identity, active branch and revision verification; use existing conversation runtime/Host send journal and #32 acceptance. No auto-send on sync/restart, no uncertain-key retry, explicit fresh owner send only. Confirm settled reply and sync readback into the same identity; no duplicate conversation or message.
H13 Attachments: preserve authorized metadata/references and local availability, download only explicitly authorized accessible assets via supported existing browser path; content-type/size checks, safe names, content digest, bounded disk usage, separate absent/expired/unsupported status. Never claim all files downloadable. Preserve code blocks, multimodal parts and source structure; unknown fields remain unknown.
H14 Release: exact-source tests, isolated Windows integration, then approved live signed-in account and physical GPUI/phone acceptance. Record source SHA, runtime version, counts/digests and timings (no bodies), rollback preserving old data. No blanket "verified" from mocks, source existence or historical receipts.
H15 Generalize: derive reusable provider-neutral read/normalization contracts from verified ChatGPT binding; independently inspect recovered Gemini and Claude sync donors and then other providers. Per-provider capability and coverage evidence; no inferred parity.

## Parallel execution / ownership
Studio core session 05 / provider lane L01: H01–03, H08 browser boundary, H12–13; existing browser custody and live send work retained.
Native computation session 03: H04–05 and native parity, no browser/effect owner.
Context/AutoWiki session 02 / L03: H06/H09 with existing store owner and private corpus grants; no raw development graph import.
VLANG session 01 / L04: H10 typed semantics and deterministic phrase tests, no new catalogue owner.
GPUI L02: H11; L05 release/evidence: H14. H07 coordinated by current Studio/Host owner and H15 follows H14. Reconcile TASK-CLAIMS before any source edits; ownership above is proposed routing, not agent dispatch.

## Acceptance matrix
- First sync: authorized visible source records persisted/read back with counts and known omissions.
- Repeat sync: no duplicate IDs/messages; unchanged input yields zero unnecessary hydration; title edits, branch changes and same-second updates recognized.
- Interrupted sync: cancel, crash/restart, rate-limit/re-auth and repeated cursor never lose committed checkpoint or spin; no secret/body leakage.
- Isolation: wrong account, revoked grant, stale binding, unavailable page and malformed tree handled without cross-account data.
- History: all observed branch edges preserved; selected branch matches source, unknown data explicit; archived scope measured.
- Local intelligence: exact search returns real authorized record offline with provenance; scoped Oracle projection only after grant.
- Real-time: measured settled-turn propagation and reconnect reconciliation; no duplicate worker or unexpected network activity.
- Original thread: one fresh authorized send, settled reply, existing journal receipt, same local conversation, physical phone GPUI mirror. Historical uncertain send never retried.
- Release: existing records and paired URL unchanged, rollback and privacy receipts verified.

## First implementation increment
Claim H01/H02 only; produce a sanitized donor/source disposition and exact dependency map, then H04/H05 pure native computation in parallel with H03 authorized one-record read when the existing browser owner is ready. Use real locally authorized evidence for live acceptance. Plan is not runtime proof. No tasks closed in master issue by this document.

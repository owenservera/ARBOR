# Native VIVIM MCP integration — R001
Status: integration preparation, NOT deployed. Provider: ChatGPT web. Canonical authority: Host + existing Studio runtime and browser owner. No provider API, no alternate browser driver, no ZCode dependency.

## Reuse path
Remote VIVIM MCP -> authenticated Host principal and provider/account/workspace scope -> existing Studio HTTP/MCP registry -> executeConversationTool / CONVERSATION_TOOLS -> incumbent conversation runtime -> existing signed-in Chrome -> journal/receipts -> scoped response. The remote bridge must not instantiate a second Studio runtime or expose a generic shell/CDP endpoint. Do not forward arbitrary URL, executable, selectors, port, profile, credentials, or raw browser state. Studio owns effects; MCP is a typed transport and projection.

Use source-native definitions in `studio/src/studio/conversation-tools.mjs` (schema, annotations, routes and validators) and `studio/src/recipes/catalog.mjs`. `CAPABILITIES.json` is an evidence/admission overlay, not an independent schema. The existing internal registration function is `registerConversationTools({add, conversationRuntime})`. Use the running owner's registered local route via the incumbent Host transport; never call that registration with a newly constructed runtime in remote handlers. Verify current service availability before publishing remote tools.

## Proposed tool contract map
Names below are proposed remote aliases (not currently installed). Parameters are a narrowed ChatGPT-specific projection of the canonical source. Bounds and validation must be inherited from native source and reapplied by the owner. All results must be scoped to the requesting principal, authorized account/profile and exact conversation/target where applicable.

| Remote alias | Native tool | Input | R001 disposition |
|---|---|---|---|
| vivim_chatgpt_targets | conversation_targets | {} | candidate; filter ChatGPT |
| vivim_chatgpt_list_visible | chat_index | targetId, optional maxEntries/maxTitleChars/scanLimit from source | candidate; fixed site=chatgpt, no caller-defined selectors; complete=false |
| vivim_chatgpt_list_local | list_conversations | {} | candidate; filter scoped ChatGPT snapshots |
| vivim_chatgpt_get | get_conversation | conversation | candidate; metadata default, reply body only with content-read grant |
| vivim_chatgpt_capabilities | conversation_capsule | conversation | candidate; advisory |
| vivim_chatgpt_status | get_conversation | conversation | candidate; same implementation, bounded status-only view |
| vivim_chatgpt_read | read_conversation | conversation, optional maxMessages/maxChars | candidate; content-read grant, currently rendered only |
| vivim_chatgpt_connect | connect_conversation | targetId, expectedThread | candidate after effect grant; inject site=chatgpt, freshTab=false |
| vivim_chatgpt_finish | finish_conversation | conversation | candidate after effect grant; closeTab=false only |
| vivim_chatgpt_create | create_conversation | {} | hold for standalone acceptance; inject site=chatgpt |
| vivim_chatgpt_submit | submit_conversation_turn | conversation, key, prompt, confirm=true, expectedRevision | hold for explicit-key first-send acceptance; existing-thread continuation blocked |
| vivim_chatgpt_reconcile | reconcile_conversation | conversation, expectedRevision, optional turnId | hold until recovery acceptance |

Do not duplicate a reply/result store or poll scheduler. `status` is a projection of the same get tool; results refer to the original attempt. For bounded polling/events, return current status and cursor where the native runtime supports it; do not keep a remote MCP call open indefinitely. An accepted command response is not an effect receipt. Preserve `not-attempted`, `observed`, `unknown`, evidence and readiness distinctly; report network completion independently. Use original keys and Host receipts for recovery. Never auto-resend after disconnect or timeout. For an authorized new chat, creation is not a provider send; first send has its own explicit authorization and key.

## Admission phases
1. **Owner lifecycle and read plane:** fix executable/manifest port propagation, identify incumbent service on workstation, verify transport health/identity, then expose target discovery, bounded sidebar index, scoped local summaries, get/status/capsule and bounded transcript read. Explicit content-read scope; do not return other chats by default. Native service unavailable at R001 recipe-route probe (503); direct runtime verification does not certify service exposure.
2. **Local session operations:** exact attach and finish with scoped grants; standalone fresh create without submit; explicit first-turn operation with durable key, owner authorization, journal and settled reply. Test no duplicate delivery for same key+payload and conflicting payload refusal. Keep existing-thread submit disabled until hydration/fence bug is reconciled with source and verified in live test.
3. **Recovery and expansion:** original-attempt reconcile, stale/unknown send inspection, restart recovery and process lifecycle, then explicit provider stop, bounded attachments/artifacts, model/effort discovery, visible search, UI pagination and exact navigation. Add further providers under same command family, not new engines.

## Acceptance (real Windows + signed-in provider)
- Native route/service and remote tool list match authorized contract; no missing runtime advertised; tools fail safely when owner service unavailable.
- Scope refusal for other provider, account, foreign target/unknown conversation, over-limit input, invalid UUID, unsupported fields and revoked grant. Read scope cannot submit; connect/finish cannot send; no raw cookies/tokens or private provider endpoints.
- Discovery returns canonical refs with limited coverage and freshness; distinguish local stored snapshots from rendered sidebar. Read authorized test thread, verify exact prior marker and stable hydrated transcript.
- Create fresh tab without message; verify owned unbound state. First explicitly approved send uses unique original key, exact payload and expectedRevision. Capture observed user turn, exact /c/ identity, actual assistant response, readiness state, receipt.
- Replay same key+payload without second user turn; changed payload with same key refused. Disconnect and resume original operation without resending. Test stale revision, blocked draft, exact-thread conflict and unknown delivery. No manual fence edits.
- Existing-thread continuation: reproduce PRIOR_REPLY_CHANGED and THREAD_FENCED from R001; fix root cause through incumbent hydration/fence reconciliation, then verify exact prior transcript, same provider thread and one new settled reply. Do not count R001 attach/read as continuation success.
- Finish releases writer/capture and process terminates or persistent owner remains healthy by design. Verify no duplicate Chrome profile owner or orphan terminal jobs. Page-settled, formal network completion and capture integrity/acceptance each reported separately.
- Update the evidence overlay only with exact native evidence. Do not promote SOURCE_PRESENT or LIVE_COMPOSITE to independently verified until acceptance passed. Remote MCP deployment and auth are separate verification scope.

## Implementation ownership
Existing Studio module remains JS because it is the incumbent implementation; new Host/native MCP work should follow Rust-first project policy unless a minimal transport binding requires existing JS tooling. This folder introduces no provider driver, production migration, grants, daemon or deployment. See EVIDENCE-R001.json for exact test sessions, conversation, turn, refusal and unit evidence.

## R002 additions (native Studio source only)
- `vivim_chatgpt_surface` → `chatgpt_surface` (POST /api/v1/chatgpt-surface, input exact targetId). Fixed canonical ChatGPT origin; bounded semantic candidates and explicit incompleteness, no selectors or action authority.
- `vivim_chatgpt_search_visible` → `search_chatgpt_visible` (POST /api/v1/chatgpt-visible-search, input targetId, query and optional existing index bounds). Exact verified profile continuity; no provider UI search, pagination, or complete history. Query/body private; titles only with authorized content-read scope.
Both are in the incumbent native tool and recipe registry; 24/24 native tests passed on the exact source snapshot. Remote VIVIM MCP aliases remain proposed and live signed-in probe remains blocked. Do not admit new effectful operations merely because the observation group exists. Full coverage matrix: CRAFT-SURFACE-R002.json.

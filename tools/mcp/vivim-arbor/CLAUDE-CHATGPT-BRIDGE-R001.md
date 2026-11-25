# ChatGPT.com ↔ Claude.ai via VIVIM ARBOR — R001
2026-11-25 | Owner-directed design, not deployed or live-accepted.

## Objective
Register a private VIVIM remote MCP connector in both ChatGPT.com and Claude.ai, allowing explicit AI-to-AI requests and replies through the owner’s ARBOR Host. No model API, no new browser actuator, no secondary World/Host, no paid fallback. Complement U07 and ARBOR #32; coordinate with current Host, Studio and workstation owners before editing their modules.

## Verified baseline
Browser VIVIM health returned ready, profile private-fixed-probe, hostDiscovery=false, workstationProbe=true. Browser catalogue currently contains only health and fixed workstation probe. HANDOFF R018 records actual one-shot native command receipt, not production admission. Claude provider is declared in Studio; current signed-in readiness, sends and replies are unverified. Do not extend the isolated acceptance Host or repurpose its fixed grant. Preserve working ChatGPT connection.

## Transport
Claude.ai custom remote MCP connects from Anthropic cloud; use supported externally reachable HTTPS transport, never a localhost address or public owner token. Verify whether incumbent secure tunnel supports independent Claude clients; if not, add a separate authenticated transport adapter to the same production Host. Do not introduce a second product authority. OAuth resource metadata, issuer discovery, resource/audience validation, per-client grants, expiry/revocation, no token passthrough. Register Claude's published client identity if supported; otherwise use its supported registration procedure. Negotiate actual client protocol revisions; test both clients rather than assuming identical transport support. Use client-bound identity, not caller-provided provider names as authorization. Do not rely on server-initiated MCP sampling or waking idle web chat: negotiated client tool calls only. MCP 2026-07-28 uses multi-round-trip input requirements instead of the older server-initiated channel; do not assume either client supports sampling. No private backend endpoints or provider cookies exposed.

## Proposed narrow tools (not live)
- vivim_ai_request: {target, thread_ref, prompt, request_id}; submit one owner-authorized explicit task to an admitted provider or registered peer inbox. Return operation_id, status, receipt_ref; never report reply before observed.
- vivim_ai_inbox: {conversation_ref, cursor?}; read bounded outstanding messages for the authenticated participant, no global conversations or credentials.
- vivim_ai_reply: {message_id, reply, request_id}; respond to an assigned inbox message, identity and scope checked; idempotent.
- vivim_ai_status: {operation_id}; read only authorized operation lifecycle and settled reply, if any.
- vivim_ai_cancel: {operation_id}; cancel an owned pending operation where supported, report uncertainty if effect cannot be retracted.
Proposed names/schema subject to reuse of current Host action, task and relay contracts; do not implement a parallel scheduler or ledger. Bind exact request, participants, target thread, owner grant, revision and bounded payload. Separate read/write/send scopes; limit turn count, pending tasks, bytes, time and cost. Never interpret peer text as tool authority. Explicit consent to data shared with another provider; no implicit local files, credentials, or personal corpus. All effects recorded via incumbent Host claims/receipts.

## Two execution paths
A. Cooperative MCP inbox: ChatGPT submits message; active Claude chat calls inbox, reasons, calls reply; ChatGPT reads status. Reverse direction works with roles exchanged. User must initiate/enable the Claude conversation or otherwise use a supported trigger; registering connector does not wake idle chats. First test uses a harmless unique challenge, no browser automation and no provider API.
B. Active Studio relay: explicit admitted request to Claude triggers existing Studio browser conversation actor through Host, pins signed-in account/thread, verifies exact composer readback, claims send once, observes settled reply, returns receipt. No second CDP actor. No automatic resend after uncertain send. Claude can use the same operation to address ChatGPT only after independent provider acceptance. Prevent recursive AI loops with trace/parent ID and explicit bounded task budgets.

## Acceptance and order
1. Verify supported secure remote endpoint and Claude authentication/registration; independently call health from Claude.ai and ChatGPT.com. Test unauthorized/expired/revoked access.
2. Reuse incumbent Host-owned scoped task/relay storage for cooperative message exchange. Test identity isolation, idempotency, expiry, cancellation and restart. No live grants from the test harness.
3. Admit one explicitly approved cross-provider message. Both active web sessions call the tools; verify message and reply readback with correlated real Host receipt. Reverse direction.
4. Close #32 provider-specific Studio acceptance for Claude and ChatGPT, then enable one-call active dispatch and status retrieval. Verify no duplicate send after timeout, uncertain state, no hidden costs.
5. Add GPUI inspection/readback and PWA viewport via existing renderer; extend shared task pattern only after real acceptance.

## Claude registration
Customize > Connectors > Add custom connector (or Custom > Web); use the actual deployed HTTPS MCP endpoint, choose sign-in/OAuth according to verified server configuration, enable the connector in a conversation. Do not invent an endpoint or reuse secret tunnel credentials. A verified endpoint and authorization flow are still missing; no user registration action can be completed with this document alone.

## Documentation
Context7 library /websites/modelcontextprotocol_io_specification_2026-07-28 (OAuth/resource discovery); /websites/platform_claude_en (API-oriented MCP docs, not consumer connector evidence). Consumer instructions verified separately:
- https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
- https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization
- https://blog.modelcontextprotocol.io/posts/2026-07-28/
- Existing ARBOR tools/mcp/vivim-arbor/HANDOFF.md, PLAN.md, docs/product/STUDIO-CORE-CONVERGENCE-R001.md, issue #32.

Status: DESIGN COMMITTED only. No new tool, deployment, live Claude connector, message or reply verified.

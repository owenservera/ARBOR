# ChatGPT — canonical verified Studio commands (R001)
Owner: Studio/Host browser capability authority. Date: 2026-11-26.
Purpose: one provider-specific operational knowledge and verification overlay for agents and MCP adapters. Not a second actuator, scheduler, browser owner, schema catalogue, or journal.

## Start here
- [CAPABILITIES.json](CAPABILITIES.json): typed capability identifiers, native Studio tool/recipe mapping, evidence state and MCP admission recommendation.
- [EVIDENCE-R001.json](EVIDENCE-R001.json): bounded live Windows test evidence, known gaps and native unit results.
- [CRAFT-SURFACE-R002.json](CRAFT-SURFACE-R002.json): 20-family gap assessment of actual Craft output, raw evidence hashes, new native read operations and tests.
- [MCP-INTEGRATION.md](MCP-INTEGRATION.md): native remote tool integration plan and acceptance tests.
- Implementation authority: [CONVERSATION_TOOLS](../../../src/studio/conversation-tools.mjs), [recipe catalogue](../../../src/recipes/catalog.mjs), [conversation runtime](../../../src/capture/conversation-runtime.mjs), [CLI](../../../bin/commands/chat.mjs). Always import those definitions; never retype them or infer deployment from a row here.

## Operating rules
1. Reuse the owner's signed-in VIVIM Chrome profile; verify profile ownership and exact origin/thread identity. Never inspect or export cookies, tokens, credentials, browser storage or undocumented provider APIs. No Playwright/Puppeteer; no second browser owner. Host owns authorization and effects.
2. Discover workspace paths and executable from completed workspace manifest; use its CDP port, not a remembered port. On the measured Windows installation the manifest port was 38702 while generic CLI context defaulted to 9222; explicit CHROME_PATH was required by the legacy one-shot CLI. These are observations, not hard-coded deployment defaults.
3. When running Studio owns the browser, use its registered tools/recipes through the existing authenticated local service. Do not start a competing runtime. For an isolated authorized diagnostic only, the incumbent runtime factory and executeConversationTool can run inside one process when the existing owner is absent. Never expose the diagnostic shell to external clients.
4. Local snapshot ID, provider thread ref, target ID, operation/request key and turn ID are distinct. Never use a title or current active tab as a durable thread identity.
5. Fresh creation without sending is distinct from a persisted provider conversation: a native /c/ identity generally becomes available after a first submitted turn. Require explicit send authorization; a returned registration is not delivery. One durable key and expected revision per send. Never auto-resend on timeout/uncertainty; inspect and reconcile the original.
6. For existing threads, require exact binding and stable rendered prior transcript before sending. R001 reproduced PRIOR_REPLY_CHANGED (not-attempted) and a later THREAD_FENCED refusal even after hydration; do not clear the fence manually or bypass it using drive/another browser. Continuation is not verified.
7. Page reply verified + settled + nonpartial and idle controls establish interactive readiness. They do not prove provider network completion or capture completeness. Journal, completion and capture acceptance are distinct. Always report each honestly.
8. Sidebar index is bounded rendered candidates only, complete=false, not whole account history. Local conversation list is a different dataset. Read currently rendered transcript only; never treat empty pre-hydration result as absence.
9. Explicit finish releases writer/capture, not necessarily CLI process; first successful round trip emitted evidence but its terminal process timed out at 130s. Job containment may terminate Chrome. Fix service lifecycle separately; never abandon uncertain send or retry on exit status alone.

## Reproduce
Run from ARBOR root in a locally authorized context. First inspect:
```powershell
node studio/bin/studio.mjs doctor --json
node studio/bin/studio.mjs recipe list --json
node studio/bin/studio.mjs agent status --json
```
When owner service is running, use `recipe show <id>`, `recipe plan <id> --input <file>`, and `recipe run <id> --input <file> --json` according to the native schema. Mutations require `--execute` and provider sends `--authorize-send`; supply original operation ID where required. Content readback is opt-in. If service returns STUDIO_REQUEST_UNKNOWN/503, recover its incumbent lifecycle, do not silently spawn another actor.

Previously live-proven one-shot command (only with explicit owner authorization, no concurrent Studio owner, verified dedicated profile, resolved executable and port):
```powershell
$env:CHROME_PATH = '<workspace manifest Chrome executable>'
node studio/bin/studio.mjs chat chatgpt --fresh --prompt '<approved benign prompt>' --execute --accept-sends --timeout 90 --json --port <manifest-port> --data-dir <workspace-root>
```
R001 first success used the generic CLI port (not independently verified from its output). Subsequent runtime probes used manifest port 38702. The legacy CLI generates its own turn key; MCP must instead use the native explicit-key submit contract. Do not replay the one-shot command after uncertainty.

## Status vocabulary
LIVE_VERIFIED: actual owner-machine operation observed; only claims in evidence scope.
LIVE_COMPOSITE: observed as a step inside a real round trip, standalone contract still unverified.
LIVE_PARTIAL: real invocation but coverage/semantics remain incomplete.
LIVE_BLOCKED: actual refusal or defect observed, not ready for general use.
SOURCE_PRESENT: source contract exists; independent live verification not run.
PROPOSED: no current admitted implementation. Native source and local unit tests do not promote a capability to LIVE_VERIFIED.

## Next
Fix exact-thread hydration and durable fencing reconciliation, stabilize owner lifecycle and process exit, verify standalone create + same-key replay, reconcile, then integrate typed remote tools in the incumbent VIVIM MCP/Host path. No production deployment or new grants in this folder.

## R002 — Craft surface reconciliation (2026-11-26)
Actual workstation output: 5 Craft walkthrough receipts (4 completed, 1 aborted), 6 accessibility captures (38–94 controls per capture). Most names were redacted; no claim of 94 unique actionable capabilities or complete settings coverage. Native unit verification on pinned source 8560572c67bd2d35210fe9901d31074caa49a7cb: 24/24 PASS. Two new native read-only Studio tools/recipes: `chatgpt_surface` / `provider.chatgpt-surface` and `search_chatgpt_visible` / `provider.chatgpt-search-visible`. Run through the existing Studio owner with exact target ID and authorized content scope. For recipe input use a JSON file with targetId, and for visible search query plus optional bounded index limits. Observation covers 20 family rows, not 20 proven effect bindings. Search filters only the rendered candidate set. Exact profile continuity is mandatory. New live probe was denied/outcome uncertain by workstation MCP; no live proof, deployment or remote MCP publication claimed. See R002 evidence for remaining action-specific gaps.

## R003 — live verification (2026-11-26)
[EVIDENCE-R003.json](EVIDENCE-R003.json) supersedes the R002 live-test blocker for CG-037 and CG-038 only. Actual dedicated Windows Chrome owner verified at manifest port 38702; both native tools and recipe definitions registered in source-pinned Studio. Surface: 24 controls, 7/20 families with candidate labels, 14 unclassified; incomplete. Visible search: 16 unique rendered candidates, one exact known test thread, zero matches for a negative query. Title search remains unit-tested only. No sends, settings changes or provider actions. Both read capabilities now LIVE_VERIFIED within these bounds. Persistent service route, process exit, active checkout deployment and remote MCP publication remain separate. This does not verify all 20 families or authorize actions.

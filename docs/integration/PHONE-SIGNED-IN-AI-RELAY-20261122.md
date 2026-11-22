# Phone ↔ signed-in AI relay — build and acceptance record
**Observed:** 2026-11-22, Europe/Madrid. **Source authority:** ARBOR `main`; local test/release observations came from the Windows Host using an isolated pinned Git worktree, not edits to the dirty development checkout.

## Shipping state
- **Live Host:** `127.0.0.1:43187`; retains existing owner data root and existing Tailscale phone URL.
- **Live source release:** `10006454b433efd53affc74e5e7a3d6518f96432`; deployment script returned `CUTOVER_PASS samePhoneURL=true`.
- **Test evidence:** focused `node --test` checks passed; `node integration/scripts/pwa-run-now.mjs` full mobile/Host/PWA suite passed from a pinned isolated worktree at that SHA. Live /mobile/app.js, /mobile/provider-handoff.mjs, /mobile/sw.js each HTTP 200; unauthenticated /api/host/control/pwa-view HTTP 401; Studio /api/v1/conversations HTTP 200.
- **Signed-in Studio browser:** dedicated existing Windows VIVIM Chrome profile, CDP 38702, same Studio owner at loopback 38730. No provider APIs, credentials, second browser executor or implicit resend.
- **User-visible integration:** one mobile composer, explicit `Ask ChatGPT: ...` / `Ask Gemini: ...` handoff, original Host/Studio queue and phone session projections; unverified draft preserved; conversation target not silently changed; selected-provider read-only freshness check; no send without owner pairing, verified account and compatible live chatWorker heartbeat.
- **Receipt producers:** the existing `studio/bin/relay-chat-mvp.mjs` worker and `studio/src/studio/worker-heartbeat.mjs` now declare mode-specific provider acceptance. `apps/vivim-host/diagnostics.mjs` and `apps/vivim-host/chat/provider-projection.mjs` project truthful heartbeat and login evidence. Account sign-in is never treated as verified delivery.

## Exact browser observations (non-sending Studio probes)
All six probes used Studio's existing owned-tab `/api/v1/conversations/create` and finished with `closeTab:true`, without prompting any model:
| Site | Studio readiness | Notes |
| --- | --- | --- |
| ChatGPT | ready | Verified live browser login; not proof of delivered messages |
| Gemini | ready | Verified live browser login; mobile relay transport not verified |
| Qwen | ready | Verified live browser login; mobile relay transport not verified |
| Claude | blocked | `DRAFT_PRESENT`, untouched |
| Z.ai | blocked | `BINDING_CHANGED`, did not override |
| DeepSeek | blocked | `BINDING_CHANGED`, did not override |

## One explicitly submitted ChatGPT web-turn probe — NOT successful
- One Studio conversation created as `ready`; exactly one `POST /api/v1/conversations/:id/turns` accepted HTTP 202; read-only polling showed `preparing/not-attempted` and then `uncertain/uncertain`, `CREATION_UNPINNED`. No settled verified reply.
- **Never resend this request**. Its original Studio conversation/turn journal must be read and reconciled separately; no second submission, no “done” receipt and no claimed user delivery. The unsent/uncertain distinction is part of the safety contract.
- The existing Studio HTTP conversation worker is restricted to default ChatGPT text; it depends on a new thread pin and can encounter `CREATION_UNPINNED`. `studio/bin/commands/chat.mjs` documents the older single-owner Studio Drive workaround, but no new alternative sender was wired or launched here.
- **Live Host chatWorker:** no active worker/heartbeat. Read-only canonical bridge inventory found **queued=0, claimed=0** for harness consumer (one old done and two old failed entries, all many days old). A cached account check cannot authorize a queue send.
- The live product therefore does **not** yet have demonstrated phone → provider → phone completion. The gate now preserves drafts instead of claiming success or queuing into an absent consumer.

## Explicit acceptance blockers and next executable slices
1. **AIR-01 — Studio-owned delivery transport:** integrate a single Studio-owned, durable-send-once web-turn transport that works for new and existing provider tabs without requiring an unpinned conversation `/c/<uuid>` identity; preserve the existing write-ahead journal, exact provider target, uncertainty, and no second Chrome driver. Wire into existing `studio/bin/lib/relay-chat-studio.mjs`/Studio port, **not** a second provider stack. Test one provider at a time, never retry the uncertain ChatGPT probe.
2. **AIR-02 — Mode-specific provider support:** Studio phone relay currently admits default ChatGPT text only, while Studio's adapter registry lists more providers. Add genuine verified browser-output support per selected account (ChatGPT, Gemini, Qwen, then Claude/Z.ai/DeepSeek after readiness), and declare capability only after proven delivery evidence.
3. **AIR-03 — Physical phone acceptance:** real paired mobile sends one explicitly reviewed turn; Studio records exactly one provider submission and verified settled reply; Host returns the exact matching relay command and live delivery receipt; phone renders it and can acknowledge only an observed delivery. Verify revocation, offline, uncertain and refresh race conditions.
4. **AIR-04 — Durable host/Studio startup:** production Host had stopped once and was restored from exact pinned release. Harden Windows launcher/supervisor and worker leases without duplicate writers or silently processing backlog.
5. **AIR-05 — Separate packaging gate:** Host reported `SHARE_RUST_NOT_PACKAGED` for private-sharing maintenance. Do not mistake it for the AI relay's send state.

## Policies
GitHub `main` remains the source writer. ZCode and Desktop Commander provide context, local operations, tests and review, never substitute for the source owner. Rust is default for new core logic, TypeScript 7+ where browser contracts require it. Provider APIs and Playwright/Puppeteer are not part of this architecture. No prompt or reply bodies, device tokens, personal account identifiers, or sign-in credentials are included in this record.

## Final Direct-ingress amendment — 2026-11-22
- The Host now checks a current `chatWorker` heartbeat, a mode-declared supported provider and a fresh Studio `signedIn` verification **at the authenticated `POST /mobile/api/relay?path=commands` boundary**, immediately before queue admission. The device is re-authorized for `relay:write`. Missing worker fails 503, unverified provider fails 409, and neither adds a queued command. These are in addition to the phone's disabled Send gate.
- Revision `10006454b433efd53affc74e5e7a3d6518f96432` passed focused Direct-phone tests and the full PWA/Host Node suite from an isolated release worktree. Deployment returned `CUTOVER_PASS samePhoneURL=true`; post-cutover mobile assets responded HTTP 200, unauthenticated owner PWA returned HTTP 401, and Studio remained reachable.
- **Still not accepted:** the live chat worker is not running and the single Studio ChatGPT creation attempt remains `CREATION_UNPINNED / uncertain`. No resend, no verified settled reply, no physical phone end-to-end success assertion.

## AIR-01 readback continuation — 2026-11-22
- **Root observation (from original, non-retried Studio probe):** persisted conversation was `CREATION_UNPINNED` / `uncertain`, with `creationFailureDetail.subStep = type-step` and `code = TYPING_UNCONFIRMED`. It is not a verified send or reply. Its journal is left untouched; the probe is not reissued.
- **Defect identified:** `studio/src/capture/conversation-thread.mjs` used the first visible selector match in `turnObservationExpression()`, while `findComposer/typeText` typed into the actual focused, remembered editor. When the page shows multiple candidate editables, source readback could inspect the wrong field. The repair prefers the visible focused composer, then the exact remembered visible element, and refuses unresolved multiple candidates.
- **Source commits:** `e64cc59c5623a08527b814cf9ba15b42189c81a5` (readback alignment + four tests); `d365723456b5865a652e6430533cd93602997303` (focused element priority + count-only typing diagnostics + fifth test). These changes are to **Studio's existing** readback and journal, not a second browser driver or provider API. They retain strict exact-text acceptance before send; no fallback that treats unverified text as delivered.
- **Test evidence:** five pure DOM-editor selection tests pass, existing thread-identity tests pass, and original full PWA/Host test at this source point passed. The wider Studio suite had four failures also reproduced on the pre-change `10006454...` release (two browser companion ingress, two service-boundary), not introduced here.
- **Packaging cross-lane:** a D05 frozen-manifest fixture initially changed the file size and expected the digest-specific error. Parallel ARBOR change `384c6368a44d...` corrected the fixture to change bytes without changing size. The corrected packaging suite passed in the pinned combined checkout.
- **Production truth:** Direct Host still runs `10006454b433efd53affc74e5e7a3d6518f96432`, and Studio remains on its existing running process. A Z.ai conversation was observed `busy` with capture `recording`; no Studio restart, additional provider send, or phone acceptance was attempted. Updated Studio source cannot be claimed live until the sole browser owner is safely switched and tested.
- **Next acceptance:** reconcile that existing busy Studio session without disturbing it; establish a single-owner browser window; send one **new** uniquely keyed test only after checking the old uncertain key, then require exact observed delivery and settled reply before claiming phone functionality. Continue to gate the current phone send by live worker capability and verified signed-in account.

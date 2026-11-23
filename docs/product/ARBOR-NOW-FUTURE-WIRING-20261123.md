# ARBOR now → future: source-backed wiring audit and execution order
**Observed 2026-11-23 (Europe/Madrid)** · **STATUS: evidence-based working plan, NOT device/release acceptance**  
**Snapshot refs:** ARBOR `main` `7991f675d8bbcd4d31daf0de76d1cebab8a03a56`; VIVIM Labs `main` `78472401a1c9c7b75c8688c81ef22379aae3732f`. These are *observation pins*; re-read HEAD and any file SHA before executing.  
**Canonical task authority:** [#33 master 71-task ledger](https://github.com/owenservera/ARBOR/issues/33), [#32 provider conversations](https://github.com/owenservera/ARBOR/issues/32), [#31 same-SHA release and device parity](https://github.com/owenservera/ARBOR/issues/31). **Do not create a replacement backlog.**  
**Agent pickup and task claims:** [Labs existing execution pack R001](https://github.com/owenservera/vivim-labs/tree/main/ZCODE-DESKTOP-COMMANDER-OPERATIONS/DEVOPS-PLANNING/PACKS/EXECUTION-20261123-R001) and [TASK-CLAIMS](https://github.com/owenservera/vivim-labs/blob/main/ZCODE-DESKTOP-COMMANDER-OPERATIONS/TASK-CLAIMS.md). A published pack is not evidence of a started agent or accepted handoff.

## 1. Owner architecture — immutable
ONE VIVIM SURFACE → ONE CANONICAL STATE MODEL → MULTIPLE SYNCHRONIZED VIEWPORTS.
- GPUI native Windows is master **authoring/control/rendering**, with one true topmost native File/Edit/View/Tools/Developer/Settings/Help shell.
- Mobile `apps/mobile-relay/` is the **one** PWA renderer of the same Host-backed VEC/LiveSurface semantics; retain today's phone URL/pairing during migration.
- Existing Host `apps/vivim-host/` is **sole** persistent state, grant, approval, effect, journal, recovery, and receipt authority.
- Existing Studio is **sole** signed-in browser/provider conversation owner; never create an API route, second Chrome/CDP controller, Playwright/Puppeteer driver, or autonomous replay.
- Rust `core/programmability/` owns shared VLANG/NLCL, VEC, LiveSurface, Wiki and gesture contracts. TierFlow remains a donor until real parity proves safe retirement.
- ChatGPT cloud/GitHub `main` codes application source. ZCode reads/tests bounded scopes; Desktop Commander observes Windows and performs explicitly authorized post-push device/runtime validation. No duplicate writer or router. No paid-model fallback without approval.

## 2. Physical/source evidence ledger (do not promote a weaker proof)
| Edge | NOW: observed source/receipt | FUTURE: acceptance needed | Canonical IDs |
| --- | --- | --- | --- |
| GPUI input → deterministic semantic preview → Host plan/approval/receipt | **Physical Windows verified** for `Set theme to tide`, `Undo theme`, `Show my theme` at `0cd77a2`; durable Host R1 plan receipts, no auto effect from typing. Separate implementation `native/gpui-desktop/src/control.rs`; live receipt #33 comment 7111167909. | Typed compound UI commands, complete risk/ambiguity handling, replay-safe restart, keyboard/IME and no old-receipt bleed. | U06/U07/U09 |
| Host theme source → native GPUI palette | **Physical repaint verified**: Dusk → Tide → undo in one GPUI PID after `126f32e` and `0cd77a2`; Host `pwa-view` theme tokens readback. | Full layout/typography/density semantics, committed UI revision (native-ui-view formerly state:absent), mobile same revision. | U03/U09, S07–S10 |
| GPUI input → AutoWiki | **Physical Windows verified**: `wiki` yielded 3 source-backed Wiki sections at revision 1, F00 regression fixed. `native/gpui-desktop/src/first_contact.rs` reads existing Host snapshot. | Persisted-source changes stream to both viewports, stale readback fencing, privacy/grant exclusions, user/corpus provenance. | U05, O03–O06 |
| Host state → dual viewports | **Source implementation exists**, not real 2-way proof: `control/live-system-read-port.mjs`, `live-system-delta-feed.mjs` and `agent-composer-bridge.mjs` expose source revisions, region fences, one-shot acknowledged draft stage. Native `first_contact.rs` projects phone draft; shared `core/programmability/src/live_surface.rs` defines inert revisioned edits. | PC→actual Android→Host ACK and Android→PC with same epoch, region/source/view revision, no duplicate effect, no stale repaint, preserved pairing URL. | #31, S07–S14 |
| Studio service and signed-in provider owner | Latest Labs Dev SITREP documents recovered Studio `:38730` status/Drive read routes, fixed `/api` vs `/api/v1` ownership, capture idle and browser **not running** at that check. Host `onboarding/studio-port.mjs` + GPUI/PWA status projection exist. | Reconcile old uncertain ChatGPT turn and any currently busy session read-only; verify browser owner/composer/thread pin, only then one fresh owner-submitted turn, settled reply, same-thread continuation. | #32 A01–A06 |
| Provider reply → Host → phone/GPUI | Guarded `studio/bin/relay-chat-mvp.mjs`, `relay-chat-startup-fence.mjs`, `relay-chat-transport-readiness.mjs`, Host Studio journal evidence and mobile provider handoff are **coded**; historical guarded worker receipt is not current live readiness. | Exactly-one fresh send; independent provider reply and thread identity; durable Host relay timeline/receipt; physical Android and GPUI render/ACK. **Old `CREATION_UNPINNED / TYPING_UNCONFIRMED` key MUST NOT replay.** | #32 A04–A16 |
| Oracle personal corpus and knowledge provenance | Rust Wiki/Activity Fabric, `studio-journal-evidence.mjs` and read-only Host knowledge projection exist; Labs pre-code R003/R005/R006 includes **authored** Rust tests but not verified integrated producer/grants. | Authorized real conversation ingestion with exact source IDs, revocable actor/source grant, graph exclusion, seven discovery passes, dedup/correction/deletion, view reconciliation. Never invent a grant producer. | O01–O06 |
| TierFlow/legacy UI → one product | `docs/product/CANONICAL-UI-SURFACE-CLOSURE.md` inventories 20 ARBOR HTML and 29 donor HTML paths; several alternate entrypoints retired/redirected. Presence in Developer source inventory **does not imply feature parity**. | Feature-by-feature disposition; preserve unique capabilities/receipts/history and rollback, retire remaining HTML only after equivalence in canonical GPUI/PWA canvas or native menu. | U10/U11, R07 |
| ZCode safe parallel evidence | Existing four-lane observer, not 93 active agents; prior `7b9e7db` 215/215 passed. Latest physical file `local-logs/vlang-iterations/latest.json` at `0cd77a2`: **210/215** with 2-lane contention; native wrapper latest state `BLOCKED`. Labs `78472401` now serializes native-heavy lanes, but NO matching new PASS observed in this audit. | Re-run exactly current SHA after runner update; classify true semantic regression vs subprocess timeout; hash-bound binary+runner; maintain effects=0/sends=0/sourceWrites=0; then optional one-scout admitted free model only. | Z01–Z07 |
| GitHub CI | Actions `startup_failure` / zero jobs; deleted BuildFailed workflow identity recorded across ARBOR, Labs, repos-hq. | Real job allocation and source-pinned run ID. GitHub Billing/Actions eligibility and Support may be required; do not relabel infra failure as source-test PASS/FAIL. | S12/R04 |

**Evidence strength:** SOURCE CODED < TESTED < PACKAGED < LIVE SERVED < PHYSICAL GPUI < PHYSICAL ANDROID < EXACT TWO-WAY RECEIPT. No code-only test counts as phone acceptance. Current master #33 last explicit accepted checklist count was 6/71; newer physical progress needs reconciliation, not automatic checkbox closure.

## 3. Desired future wiring — one canonical execution path
```
Human / agent / voice / signed-in provider
  -> First Contact shared semantic input (GPUI native or mobile PWA)
  -> Rust deterministic VLANG/NLCL classification first
       -> ambiguous or unsupported: request clarification or explicitly approved LLM proposal
       -> read/query: Host-authorized source-backed Wiki/Oracle read, no effect
       -> action: typed VEC/Host plan with source/actor/revision/risk
  -> Existing Host exact grant + explicit user review/approval
  -> One Host effect authority (Wiki / visual / device / Studio via existing owner)
  -> Durable Host journal receipt + revisioned LiveSurface/Activity Fabric projection
  -> Independent GPUI and Android render of same committed source identity
  -> Device/reply acknowledgment, correction/undo/recovery in same provenance graph
```
**Provider exception:** ChatGPT/Gemini/etc. browser execution remains a fenced, Studio-owned effect. Host may authorize it but never silently sends from semantic input or on worker startup. Browser user auth is not a provider transport PASS.

## 4. Next gates — dependency graph, no parallel file collision
1. **GATE P0-A — safe Studio readiness and no-replay reconciliation.** Read `#32`, `studio/src/studio/relay-chat-*`, Host Studio status, current worker + browser ownership. Output READINESS PASS/BLOCKED with old-key fenced and no provider send. Block new send unless fresh user-submitted turn.
2. **GATE P0-B — exact-source runtime identity.** Freeze one ARBOR commit into real Node24/Rust/native/PWA/Studio artifacts with lockfiles, SHA256 manifest and preserved rollback. Compare *running* Host/GPUI/PWA source stamps rather than root HTTP status. Isolated candidate first; no unsafe restart or URL change.
3. **GATE P0-C — real two-way First Contact.** Typed GPUI Wiki/draft → Host epoch+region revision → Android render/ACK; Android input → Host → GPUI render/ACK; concurrency, offline/restart, IME, service-worker hard-refresh. Source-only route unit test ≠ acceptance.
4. **GATE P0-D — one signed-in AI reply.** After P0-A and a fresh owner-submitted prompt only: composer/thread pin → one Studio send → settled reply → Host receipt → GPUI/phone render. Stop on uncertainty, never replay.
5. **GATE P1-E — bounded multi-intent and visual semantics.** Extend existing Rust intent/typed UI plan, not a new parser; compose independent reviewable edits, explicit risks and undo. Shared Host tokens drive both renderers; no automatic apply on typing.
6. **GATE P1-F — Oracle grant+corpus and TierFlow retirement.** Join existing Labs R003/R005/R006 safety packs to a *verified* source grant owner; integrate only after Dev acknowledgment. Feature-parity disposition for each retired frontend.
7. **GATE OPS-G — verified ongoing observer and CI.** Re-run with Labs serialized native-heavy runner at exact current ARBOR source; inspect native timeout cases. Keep existing scheduled task and workflows; no new parallel scheduler. CI backend incident remains separate.

## 5. Executable package routing (reuse existing R001 package identifiers)
| Package | Dependency | Allowed owner / file boundary | Deliverable |
| --- | --- | --- | --- |
| `P0-AI-CHAT` | Gate A, then owner fresh prompt | ChatGPT Dev; Studio relay + Host bridge; no other Studio source writer | Ready/blocked receipt then real thread/turn/Host/render evidence |
| `P0-RELEASE-SYNC` | Gate B → C | ChatGPT Dev packaging and bounded Host/PWA adapter; Desktop Commander only post-push runtime/evidence | One-SHA manifest + two-way device proof, rollback |
| `P1-GPUI` | native source claim, Gate B | ChatGPT Dev `native/gpui-desktop/src/`; no collision with live native shell work | Native review/menu/IME/visual evidence linked to live Host |
| `P1-VLANG-WIKI-ORACLE` | semantic source claim; grant producer | ChatGPT Dev core/Host; Labs Planning pre-integration and Oracle audit only | Typed deterministic safe command, authorized corpus + revision evidence |
| `OPS-OBSERVERS` | Labs `78472401`, isolated exact source | ZCode bounded deterministic observer, DC local; ChatGPT reconciles | Fresh hash-bound full suite receipt and CI incident update |

**Pickup rule:** Agent must read newest `TASK-CLAIMS.md` and relevant GitHub file SHA; `READY` is not `ACTIVE`. If another chat owns the same files or an agent is still running, report collision and observe rather than seize. Only explicit `ACCEPTED_BY` changes a sender-owned handoff. Agents must attach `TASK_ID | EXECUTOR | CLAIM_STATE | SOURCE_SHA | PATHS | COMMANDS | PASS/FAIL/UNRUN | RUNTIME_SHA | DEVICE_RECEIPT | NEXT | BLOCKER`.

## 6. No-regret next action
First produce a **current, no-effect exact-SHA observer receipt** after Labs `78472401`; in parallel (different code paths) read-only reconcile Studio worker/browser/uncertain turn. Do NOT start a fresh provider message or promote the phone release as an implicit consequence of planning. Advance source-facing fixes one narrowly owned slice at a time on GitHub `main` once actual failure evidence is pinned.

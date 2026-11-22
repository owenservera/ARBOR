# Oracle corpus — ZCode improvement loop R001

Cloud-owned product code: apps/vivim-host/onboarding/service.mjs, apps/mobile-relay/bootstrap-prompts.mjs, existing Studio send-once journal, Host bootstrap runtime and trusted ledger. This does not install another runtime or auto-send a ChatGPT message.

## Deterministic workflow

Use .zcode/workflows/arbor-oracle-corpus-verify.dwf.ts on an isolated clean checkout of current GitHub main. ZCode must run from that checkout, never the owner's dirty C:\0-BlackBoxProject-0\ARBOR. Admission enforces HEAD == origin/main and clean tracked files. Workflow uses ZCode world.run on four existing Node suites and emits SHA, counts, PASS/FAIL and UNRUN live boundaries. It makes zero model calls, has zero provider sends, and stops after one bounded cycle. If no exact-SHA checkout exists, report BLOCKED_SOURCE_UNPINNED; don't patch or reset the user's tree.

After each cloud push: read new main; materialize isolated validation checkout; run single ZCode verifier; inspect failures/negative cases; ChatGPT Cloud Dev fixes one evidenced defect and pushes on main; repeat verifier on new SHA. Older arbor-life and arbor-product write-capable workflows must not run unchanged.

A model-based optional scout, once a free model proves healthy and is explicitly scoped, can independently assess (a) D03–D07 output conformance, (b) duplicate/replay/expiry/crash handling, (c) claim quality/sensitivity/recency and (d) AutoWiki/Oracle retrieval grounded in persisted source. Do not scale beyond one pilot until its receipt is observed. Previous free-model ZCode pilot failed HTTP 429; do not silently switch to paid models or retry in a tight loop. Model-generated observations are test hypotheses, never corpus facts.

## Product acceptance

1. F02, F01, D03–D07 exact prompts appear in the same owner review; no background sends before approval.
2. Studio verifies real, signed-in ChatGPT readiness through its existing owned browser session; no direct account scraping, APIs, passwords or session export.
3. One exact-once send per approved prompt, receipt or explicit uncertainty; no uncertain-send resend.
4. Authenticated Host ledger receipt persists each typed provider-reported claim with source thread, generation, freshness, confidence and sensitivity.
5. Read-only retrieval (later Oracle/AutoWiki connection) has source revisions, respects revocation, and excludes sensitive bodies from phone projection.
6. Onboarding does not imply access to ChatGPT's entire chat history; claims distinguish actual available memory from inference and unknowns.
7. GPUI and phone PWA show the same Host-backed progress/knowledge revisions. Physical end-to-end tests are separate from Node simulation.

No corpus extraction is accepted as LIVE VERIFIED without a real Studio journal receipt and Host ledger/readback tied to the same generation and source ID. Never publish personal corpus contents or credentials into GitHub or ZCode logs.

# ChatGPT strategic loop — live state (updated 2026-11-18 ~11:40Z)

**Transport (PROVEN)**: `bun C:\0-BlackBoxProject-0\vivim-web-harness\studio\bin\studio.mjs drive chatgpt --reuse-tab --prompt "..." --timeout 300 --json` (owner's ChatGPT tab, no new tabs, reply read via `studio export transcript <session> --confirm`). `chat chatgpt --target <tab>` is blocked DRAFT_PRESENT on a tab that already has a thread. Owner rule: commit+push ~1 min before each ChatGPT turn.

**Authority model (owner 2026-11-18 ~11:40Z)**: ChatGPT = PRODUCT QUEUE GENERATOR + OVERALL ORCHESTRATOR of all workstreams. Execution via this session/thread (engine tools: CreateWorkflow, AmendWorkflow, TaskStop, ResumeWorkflowRun, CronUpdate, sync bus). Owner = final authority; keeper = sole roadmap.v1.json writer; escalation only on integrity violation or both-provider outage.

## Steer log
- **#1** (02:55Z, 0dab26a): fleet briefing → P0 set (A05/A06 reconcile, A07 receipt, A03 dep), 4-lane topology, verification tiers, model split, channel roles.
- **#2** (08:17Z): A05 4-slices (Select/Execute/Verify/Proof), GOAL-3 = vertical journey lane, per-sweep flip-debt, step-5 primary/mistral fallback, GLM out, ernie probe-only.
- **#3** (09:22Z, a59f587): GOAL-3 round-1 = bounded READ-ONLY AUDIT (trace + first broken edge), keeper 2-sweep KEEPER_RECONCILIATION_STALLED escalation, A07 receipt NOT_RUN ≠ acceptance, A05.1 source-pinned, checkpoint order journey→A05.1→keeper→models.
- **#4** (10:57Z, 2ed478f): PRODUCT-FIRST OVERRIDE (owner challenge upheld). 90% product / 10% verification; scorecard = product behavior. North star: user changes their own Wiki by typing naturally — PWA shows meaning, previews change, requests approval, executes through Host, shows update + evidence. Four product deliverables: VLANG/VEC NL wiki-edit, Host authorized mutation, PWA Chat command surface, Wiki revision projection. Anti-stall: 2 rounds without product diff → redirect to next real-PWA failure. Infra frozen. WORKFLOWS UPDATED: cron f2dd9a68 prompt rewritten (product-first lanes: GOAL-3 / item=A05 / GOAL-1 / GOAL-2), arbor-life.dwf.ts frontmatter + mandate + USER persona carry the north star.

## Lane state 2026-11-18 ~11:35Z
- dwfrun-9da1a9a3 GOAL-2 lane: round 1 VERIFIED (gate 0, retest 4/4, rewalk 9/9) → keeper handoff + claim release 11:34Z; continuing to next round (2.6M tokens).
- dwfrun-e9da48fe A05 queue lane ("status flipped"): running, 3.5M tokens — the keeper flipped A05 feedable.
- GOAL-3 / GOAL-1 / goals lanes: between launches (cron relaunches per product-first spread).

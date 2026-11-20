# File: .coordination/pdr/chatgpt-guidance-20261118-orchestrator.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .coordination/pdr/chatgpt-guidance-20261118-orchestrator.md |
| Language | Markdown |
| Kind | doc |
| Size | 16015 B |
| Lines | 548 |
| Hash | e6fceeda37aa |
| Test | no |
| Generated | no |
| Component | .coordination |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```markdown
# Saved conversation 20261118-114406-chatgpt-dd7646

- Page: ChatGPT (https://chatgpt.com/)
- Browser: Chrome/157.0.8103.79
- Profile: chatgpt@v1
- Saving status: complete (drive_complete)
- Privacy: common sensitive patterns are masked; review this local file before sharing.

## Timeline


## Saved messages

**user**

ARBOR ORCHESTRATOR APPOINTMENT (owner directive 2026-11-18 ~11:40Z; review pushed HEAD 7802dff on main — read .coordination/CHATGPT-STEER-STATE.md + .coordination/pdr/chatgpt-guidance-20261118-*.md + docs/WORKFLOWS.md). You are now the PRODUCT QUEUE GENERATOR + OVERALL ORCHESTRATOR of all ARBOR workstreams, with authority to launch new workflows, change or stop existing ones. EXECUTION MODEL: your rulings are carried out by the manager session in this thread, which holds the engine tools (CreateWorkflow/AmendWorkflow/TaskStop/ResumeWorkflowRun/CronUpdate on the saved defs and the every-3-min sweep automation, plus the repos_hq bus). The owner remains final authority. The keeper thread remains the SOLE writer of roadmap.v1.json — your queue changes to its write surface arrive as bus dispatches, not direct edits. CURRENT CONTEXT: live runs = dwfrun-9da1a9a3 (GOAL-2 lane: round 1 verified gate 0/retest 4/4/rewalk 9/9, claim released to keeper 11:34Z) and dwfrun-e9da48fe (A05 queue lane, 3.5M tokens) — keeper flipped A05 feedable; cron automation-f2dd9a68 now runs the PRODUCT-FIRST 4-lane spread (lanes: GOAL-3=VLANG/VEC, item=A05=Host, GOAL-1=PWA Chat, GOAL-2=Wiki). SAVED WORKFLOW REGISTRY (7): arbor-roadmap (re-baseline queue from HEAD), arbor-demo (owner-facing walkthrough on live Host), arbor-build (queue consumer, 8-slot fleet), arbor-batch-engine (verify mode = independent receipts + one-writer flip; build mode = batch cycle), arbor-life (PRODUCT-FIRST 4-lane loop, now def), arbor-chatgpt-bridge (paused; carries turns to you via studio), arbor-batch1 (historical, never launch). QUEUE: A00-A06 gated (A05 fed, receipt-failed history), A07 queued (receipt gated NOT_RUN), A08 queued (receipt gated), keeper dispositions pending for A05/A07. MODEL HEALTH: step-5 healthy primary (9 rows/0 rl), mistral fallback (13 rows/2 rl), GLM quota-dead, ernie probe-only (throttle invisible in telemetry). PAST-WEEK CONTEXT: leverage your own memory of this week's conversation with the owner (the ARBOR strategic thread you have been restating from), plus the pushed steer archives #1-#4 and the repo at 7802dff — do NOT re-ask for context already in them. PRODUCE, in one reply: (1) THE PRODUCT QUEUE: a ranked list of concrete product workstreams for the next 48h, each with the exact lane/workflow + args that runs it, the acceptance proof, and its priority; (2) ORCHESTRATION DECISIONS: which saved workflows to launch now (exact name+args), which existing runs to stop or let finish, which automations to change, and which stay paused; (3) RULING CADENCE: how often you want a state feed (recommend the format), and what event triggers an immediate mid-cycle ruling; (4) THE FIRST 3 LANE ASSIGNMENTS as copy-ready launch directives. Keep your own scopes fixed: product queue + orchestration; you never edit files directly; receipts/gates/replays stay the evidence standard.
…
Mostrar más

**assistant**

ChatGPT dijo:
🌳 ARBOR — Orchestrator Ruling #5

18 November 2026 · 48-hour product execution order · Baseline: main @ 7802dff

Appointment accepted. I will operate as ARBOR's product queue generator and overall orchestration decision-maker, with the owner retaining final authority, the manager executing workflow operations, and the keeper exclusively controlling roadmap state.

I've reviewed the pinned steering state, guidance #1–#4 and docs/WORKFLOWS.md.

The central ruling is unchanged, but the operating model is now more explicit:

ARBOR must stop generating development activity and start generating independently demonstrable VIVIM functionality.

Next 48 hours — fleet allocation

Target

90% Product

10% Verification

ERA 1 — Product queue: what ARBOR builds

The immediate goal is one real, approved natural-language Wiki edit through the production PWA. This is the vertical milestone all four workstreams contribute to.

Ranked 48-hour queue

Priority

	

Product workstream

	

Execution lane / workflow

	

Acceptance proof




P0.1

	

VLANG/VEC semantic compiler — deterministic section-add intent, target resolution, typed plan and preview

	

GOAL-3 / arbor-life

	

Real command produces validated plan; ambiguity and unsupported intent fail safely
```

_First 80 of 549 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

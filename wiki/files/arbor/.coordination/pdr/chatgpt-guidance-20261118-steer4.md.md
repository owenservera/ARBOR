# File: .coordination/pdr/chatgpt-guidance-20261118-steer4.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .coordination/pdr/chatgpt-guidance-20261118-steer4.md |
| Language | Markdown |
| Kind | doc |
| Size | 16237 B |
| Lines | 338 |
| Hash | ea5e149fc940 |
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
# Saved conversation 20261118-105739-chatgpt-231ce4

- Page: ChatGPT (https://chatgpt.com/)
- Browser: Chrome/157.0.8103.79
- Profile: chatgpt@v1
- Saving status: complete (drive_complete)
- Privacy: common sensitive patterns are masked; review this local file before sharing.

## Timeline


## Saved messages

**user**

ARBOR steer #4 — OWNER OBJECTIVE CHALLENGE (2026-11-18 ~10:15Z, review pushed HEAD 2ed478f on main). The owner's doubt, verbatim in spirit: 'are we focusing on the right objective? it seems we are just optimizing the workflow and not actually working on vlang, host, PWA etc.' HONEST EVIDENCE FOR THE DOUBT: the LIFE lineage has spent ~40M tokens over ~14h; the durable PRODUCT deltas are thin — GOAL-1 wiki-tab navigation fix + its regression tests (mobile-relay/app.js), and the new scripts/roadmap/a05-cycle.mjs cycle driver (reuses keeper/demo contracts, fail-closed, artifacts under scripts/roadmap/). Almost everything else is lane plumbing: model-ladder retunes after GLM quota death and ernie throttle, wedge un-stops, args-drop relaunches, flip-debt on roadmap.v1.json, receipts hygiene. A00-A06 sit gated/stalled (A03 blocked by A00 acceptance; A05's receipt deleted as stale; A07 receipt gated NOT_RUN); the queue has produced no accepted product increment in days. THE REAL PRODUCT SURFACE EXISTS: Host routes /api/state /api/wiki /api/mutate /api/journal /api/file-surface /api/roadmap + host bootstrap/control family (apps/vivim-host/server.mjs); PWA pages chat.html/wiki.html + mobile phone app (apps/mobile-relay); VEC semantic layer (packages/vec-ui-engines, apps/mobile-relay/vec, proposal5 corpus at .integration/). QUESTIONS: (1) Is the objective right? Name what the fleet SHOULD be building in the next 24-48h — concrete deliverables on vlang/VEC semantics, Host effects/authorization, and PWA chat/wiki surfaces. (2) What is the smallest set of REAL product features that would make the PWA demonstrably better for a user this week — be specific, not 'complete the loop'. (3) Should the workflow-optimization loop PAUSE entirely so all four lanes do product work? If yes, what minimal verification still runs (gate + fresh-user replay only)? (4) If the answer is 'neither pure factory nor pure feature-work', give the exact ratio and the switch rule. Answer with a ranked directive.
…
Mostrar más

**assistant**

ChatGPT dijo:
ARBOR STEER #4 — PRODUCT-FIRST OVERRIDE

18 November 2026 · Reviewed commit 2ed478f767df · Strategic decision

ERA 1 — Correct the objective immediately

The owner's criticism is justified. ARBOR has been optimizing its development machinery faster than it has been developing VIVIM.

The objective is still right: build an intelligent, local-first application in which natural language becomes understandable, authorized, verifiable software behavior.

But the fleet's operational objective has drifted from building that product to maintaining the machinery intended to build it.

The A05 driver at the reviewed commit makes this particularly clear. It connects existing roadmap, test, verification and demo contracts, but:

It explicitly refuses independent acceptance.

Its demonstration stage is a disk-only poll, not a live Host/PWA journey.

It does not implement a Host user effect.

It produces additional process evidence without making the PWA more capable.

This is not worthless infrastructure. It is simply no longer the bottleneck worth spending most of the fleet's capacity on.

Directive: Immediately suspend discretionary workflow optimization. Redirect all four LIFE lanes to product delivery, with verification embedded in their work.

Do not delete the existing orchestration, receipts, roadmap or agent infrastructure. Freeze it in its current usable state.

NEW NORTH-STAR ACCEPTANCE

A user changes their own Wiki by speaking or typing naturally.

The PWA shows what the command means, previews the proposed change, requests approval, executes through Host, and displays the resulting Wiki update and evidence of what happened.

One real user action. One authoritative effect. Visible, trustworthy feedback.

The critical change in thinking is this:

VLANG/VEC is the intelligence being built. Host is the authority and execution system. The PWA and Wiki are the user's product. LIFE is supporting infrastructure.

Infrastructure must now be judged by how much working product it delivers, not how many cycles, receipts, agents or tasks it processes.

ERA 2 — What the four lanes must build
P0 — Four lanes, four product deliverables

Start from the existing implementation at 2ed478f. Each lane traces its assigned path, identifies the first missing or broken edge, and implements it. No greenfield replacements of working components.

Lane 1 — VLANG/VEC: make language executable

Implement one deterministic natural-language Wiki-edit capability through the existing semantic engine. Support an actual phrase such as “Add a section called Project Risks to my ARBOR page.”

Deliver an intent-to-typed-plan translation, target resolution, validation against the existing capability/authority contract, and a structured preview. Include explicit ambiguity and unsupported-intent handling.

Exit: The same intent consistently produces the same validated operation, without the frontend inventing execution semantics.

Lane 2 — Host: make the operation real and safe

Connect the semantic plan to the existing Host authority using /api/state, /api/wiki, /api/mutate and /api/journal.
```

_First 80 of 339 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

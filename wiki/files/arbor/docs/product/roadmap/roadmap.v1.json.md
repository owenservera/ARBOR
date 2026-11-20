# File: docs/product/roadmap/roadmap.v1.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | docs/product/roadmap/roadmap.v1.json |
| Language | JSON |
| Kind | config |
| Size | 183026 B |
| Lines | 2600 |
| Hash | 99ea0027a008 |
| Test | no |
| Generated | no |
| Component | docs |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```json
{
  "schema": "arbor.product-roadmap/1",
  "generatedFrom": {
    "proposal5Corpus": true,
    "vivimLabs": true,
    "hqIndex": true,
    "gapSweep": true
  },
  "layers": {
    "L0": [
      {
        "id": "L0-DEMO",
        "layer": "L0",
        "title": "ARBOR demo workstream — realtime fast-iteration design-and-acceptance gate",
        "description": "Owner emphasis 2026-11-14 (supersedes 2026-11-13 banked): demo is the realtime fast-iteration design and acceptance gate over the build workstream; top priority goes to every component the capture and gap sweep found that accelerates the realtime automated loop — the self-driving cycle: demo surfaces design verdicts → build applies them → new queue batch is drawn → repeat (demo >> build >> new queue batch >> demo > build). GAP STATEMENT: no compiled work package from the four L2 compilers covers the demo workstream — no demo backlog, no automated acceptance-check harness, no queue-batch generator exists in the compiler outputs. Nearest loop accelerators found by the gap sweep (candidates, not compiled): harness/CONTRACT.md (approval-gated sendOnce, receipt-before-effect journal), vivim-ui PLAN.md three-tier agentic runtime, FINAL-WAVE Gate 5/6 matrices, DUAL-EXECUTION-PROTOCOL session lifecycle. Candidate program compiled at L1-DEMO-LOOP.",
        "status": "active",
        "sources": [
          "OWNER EMPHASIS (ask, 2026-11-14)"
        ],
        "dependsOn": [],
        "priority": "high"
      },
      {
        "id": "L0-BUILD",
        "layer": "L0",
        "title": "ARBOR build workstream — roadmap implementation track",
        "description": "The build workstream: proposal5 master integration beta program (G00-G13, all PROPOSED_UNRUN per .integration/proposal5/08-BETA-GATES.json:14-209), VEC/vlang NL-programming system convergence, and the vec-ui-engines 100-agent fleet as co-equal pillars. 40 L2 work packages compiled below. Gate statuses honest per 08-BETA-GATES.json — UNRUN is not pass; source presence is not runtime admission; the build queue stays pending owner prioritization (priority null throughout). Conflicting root integration/beta-gates.json ACCEPTED claims are recorded in conflicts, not adopted.",
        "status": "active",
        "sources": [
          "OWNER EMPHASIS (ask, 2026-11-14)",
          ".integration/proposal5/08-BETA-GATES.json:14-209"
        ],
        "dependsOn": [],
        "priority": null
      },
      {
        "id": "L0-WININSTALL",
        "layer": "L0",
        "title": "Windows install workstream — ordinary workstream, NOT a gate",
        "description": "Owner emphasis 2026-11-14: the Windows+PWA install/release contract is an ordinary workstream, one of the three, never a G-gate or a blocking criterion. CONFLICT FLAGGED (read-only stage, gate doc untouched): G13 in 08-BETA-GATES.json:196-209 documents 'Windows package and PWA version compatible' as a BLOCKER gate — owner reclassification needs reconciliation at synthesis. Candidate program compiled at L1-WININSTALL.",
        "status": "active",
        "sources": [
          "OWNER EMPHASIS (ask, 2026-11-14)",
          ".integration/proposal5/08-BETA-GATES.json:196-209"
        ],
        "dependsOn": [],
        "priority": null
      }
    ],
    "L1": [
      {
        "id": "L1-DEMO-LOOP",
        "layer": "L1",
        "title": "Demo↔build self-driving loop — candidate program, no compiled package",
        "description": "Candidate L1 from owner emphasis + gap sweep (not from the four compilers). Loop-accelerating components found untracked by proposal5/HVI sources: harness/CONTRACT.md (byte-identical ARBOR/vivim-web-harness, sha1 b47fb0be4afc637242955373e409652dcb5776a5: lane ownership A/B/C :10-28, receipt-before-effect journal :52-54, approval-gated sendOnce :55-61, single Chrome profile loopback 9333, Lane B six provider profiles chatgpt/claude/deepseek/qwen/zai/gemini, Lane C wh CLI + wh serve + wh-mcp, seven safety acceptance tests :72-74 — no roadmap gate cites it, adjacent to G04/G07); vivim-ui PLAN.md (three-tier agentic runtime, Intent→Plan→JobSpec→RunMeta→BusEvent, lanes L0-L9, gates G0-G9, verified 57 pass/1 fail of 58, Rust bench 709,697 ev/s vs TS 246,336 ev/s = 2.9×, Gate 0 PASS 2026-11-02); VIVIM-VISUAL-RUNTIME/FINAL-WAVE/README.md (Gate 5 BLOCKED/Gate 6 BLOCKED, 23/23 commands exit 0, 1046 pass/0 fail, Wave 4B repair src/visual-runtime/device/wave4-phone-adapter.ts:227); VIVIM-VISUAL-RUNTIME/DUAL-EXECUTION-PROTOCOL.md (eight-state session lifecycle, fresh-head CAS publication); docs/SESSION-LEDGER.md (8-lane halt state, 7 carried defects incl P0 registry substring routing bug). Status candidate — queue pending owner prioritization.\nR002: ACTIVE ACCELERATION FIRST. Work orders A00/A03/A05 connect demo feedback, scoped building, independent verification and requeue. Readiness depends on source/evidence, not candidate descriptions.",
        "status": "active",
        "sources": [
          "OWNER EMPHASIS (ask, 2026-11-14)",
          "harness/CONTRACT.md",
          "vivim-ui/VIVIM-VISUAL-RUNTIME/FINAL-WAVE/README.md",
          "vivim-ui/VIVIM-VISUAL-RUNTIME/DUAL-EXECUTION-PROTOCOL.md",
          "vivim-ui/docs/SESSION-LEDGER.md"
        ],
        "dependsOn": [
          "L0-DEMO"
        ],
        "priority": "high"
      },
      {
        "id": "L1-P5-INTEGRATION",
        "layer": "L1",
        "title": "Proposal5 master integration program — W0-W6, serial G, gates G00-G13, status ledger",
        "description": "One-time master integration program on integrate/proposal5-beta-r001; wave matrix at 09-EXECUTION-PLAYBOOK.md:31-37; playbook status NOT STARTED (:4). Gates G00-G13 all PROPOSED_UNRUN with observed_evidence null and owner_accepted false (08-BETA-GATES.json) — the conflicting root integration/beta-gates.json (UNBLOCKED, G01-G13 ACCEPTED, betaGo true, mergeCommit 7586f28) is treated as an unverified ledger claim contradicted by the same repo's release-manifest.json (BLOCKED_NOT_BUILT, betaGo false, mergeCommit dc2ae811, releaseAllowed false); reconciliation is an open owner decision (see conflicts). Compiled as P5-W0..W6, P5-SERIAL-G, P5-STATUS-LEDGER, G00..G11, G12-G13.",
        "status": "todo",
        "sources": [
          ".integration/proposal5/09-EXECUTION-PLAYBOOK.md:4,31-37",
          ".integration/proposal5/08-BETA-GATES.json:14-209"
        ],
        "dependsOn": [
          "L0-BUILD"
```

_First 80 of 2600 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

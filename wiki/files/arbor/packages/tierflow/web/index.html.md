# File: packages/tierflow/web/index.html

> Generated 2026-11-19 · HTML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/web/index.html |
| Language | HTML |
| Kind | source |
| Size | 17149 B |
| Lines | 323 |
| Hash | 74383d9e91f3 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark" />
<meta name="description" content="TIERFLOW mission control: live view of the three tier agentic workflow." />
<title>TIERFLOW // mission control</title>
<link rel="stylesheet" href="./styles.css" />
<link rel="stylesheet" href="./world.css" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28'%3E%3Cpath d='M3.5 7.5 14 2.6 24.5 7.5 14 12.4Z' fill='none' stroke='%23ff9d3d' stroke-width='1.8'/%3E%3Cpath d='M3.5 14.4 14 19.3 24.5 14.4' fill='none' stroke='%234cc2e0' stroke-width='1.8'/%3E%3Cpath d='M3.5 21.3 14 26.2 24.5 21.3' fill='none' stroke='%237f8fa3' stroke-width='1.8'/%3E%3C/svg%3E" />
<link rel="modulepreload" href="./world.js" />
</head>
<body>

<div class="app">

  <!-- ============================ HEADER ============================ -->
  <header class="hdr">
    <div class="hdr__brand">
      <svg class="mark" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
        <path d="M3.5 7.5 14 2.6 24.5 7.5 14 12.4Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" opacity=".95"/>
        <path d="M3.5 14.4 14 19.3 24.5 14.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" opacity=".5"/>
        <path d="M3.5 21.3 14 26.2 24.5 21.3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" opacity=".25"/>
      </svg>
      <span class="mark__word">TIERFLOW</span>
      <span class="mark__proto" id="proto-id">tierflow/1</span>
      <span class="mark__pid" id="pid-id">PID --</span>
    </div>

    <div class="hdr__status">
      <button class="world-toggle" id="btn-world" type="button" aria-pressed="false" aria-controls="world">World</button>
      <span class="badge" id="hot-badge" data-hot="unknown">HOTPATH --</span>
      <span class="conn" id="conn" data-state="connecting">
        <span class="conn__dot" aria-hidden="true"></span>
        <span class="conn__text" id="conn-text">CONNECTING</span>
      </span>
    </div>

    <div class="hdr__counters" id="counters" aria-label="Session counters">
      <div class="ctr"><span class="ctr__k">INTENTS</span><span class="ctr__v" id="c-intents">0</span></div>
      <div class="ctr"><span class="ctr__k">PLANS</span><span class="ctr__v" id="c-plans">0</span></div>
      <div class="ctr"><span class="ctr__k">RUNS</span><span class="ctr__v" id="c-runs">0</span></div>
      <div class="ctr"><span class="ctr__k">EVENTS</span><span class="ctr__v" id="c-events">0</span></div>
    </div>
  </header>

  <!-- ============================ TIER STACK ============================ -->
  <section class="panel panel--tiers" aria-label="Tier topology">
    <div class="panel__bar">
      <span class="panel__title">Tier stack</span>
      <span class="panel__spacer"></span>
      <span class="panel__meta" id="tier-flow">FLOW IDLE</span>
    </div>
    <div class="tiers__host" id="tiers-host">
      <svg id="tier-svg" role="img" aria-label="Topology: Tier 1 interactive agent sends intents down to Tier 2 orchestrator, Tier 2 dispatches down to Tier 3 executor, Tier 3 returns results up to Tier 2 and Tier 2 returns narration up to Tier 1."></svg>
    </div>
    <ul class="tiers__legend">
      <li><i class="sw sw--t1" aria-hidden="true"></i>T1 interactive</li>
      <li><i class="sw sw--t2" aria-hidden="true"></i>T2 orchestrator</li>
      <li><i class="sw sw--t3" aria-hidden="true"></i>T3 executor</li>
    </ul>
  </section>

  <!-- ============================ CENTER ============================ -->
  <section class="center">

    <div class="panel panel--timeline">
      <div class="panel__bar">
        <span class="panel__title">Live timeline</span>
        <span class="panel__spacer"></span>
        <span class="tl-legend" aria-hidden="true">
          <i class="sw sw--t1"></i><i class="sw sw--t2"></i><i class="sw sw--t3"></i>
        </span>
        <span class="readout"><span class="readout__k">rate</span><span class="readout__v" id="tl-rate">0/s</span></span>
        <span class="readout"><span class="readout__k">p95</span><span class="readout__v" id="tl-p95">--</span></span>
        <span class="readout"><span class="readout__k">win</span><span class="readout__v">30s</span></span>
      </div>
      <div class="tl-host">
        <canvas id="timeline"></canvas>
```

_First 80 of 324 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

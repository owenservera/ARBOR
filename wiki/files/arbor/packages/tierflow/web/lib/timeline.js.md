# File: packages/tierflow/web/lib/timeline.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/web/lib/timeline.js |
| Language | JavaScript |
| Kind | source |
| Size | 12324 B |
| Lines | 355 |
| Hash | 1b2ff29345b6 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MAX_FRAMES | const | 14 | no | const MAX_FRAMES = 900; |
| MAX_LANE_POINTS | const | 15 | no | const MAX_LANE_POINTS = 600; |
| MAX_LANES | const | 16 | no | const MAX_LANES = 24; |
| MAX_VISIBLE_LANES | const | 17 | no | const MAX_VISIBLE_LANES = 6; |
| createTimeline | function | 19 | yes | export function createTimeline(canvas, theme, options) { |
| opts | const | 20 | no | const opts = options \|\| {}; |
| windowMs | const | 21 | no | const windowMs = opts.windowMs \|\| 30000; |
| ctx | const | 22 | no | const ctx = canvas.getContext(&quot;2d&quot;, { alpha: false }); |
| cssW | variable | 24 | no | let cssW = 1; |
| cssH | variable | 25 | no | let cssH = 1; |
| dpr | variable | 26 | no | let dpr = 1; |
| frames | const | 28 | no | const frames = []; |
| lanes | const | 29 | no | const lanes = new Map(); |
| latestTs | variable | 32 | no | let latestTs = 0; |
| resize | function | 34 | no | function resize() { |
| host | const | 35 | no | const host = canvas.parentElement; |
| rect | const | 36 | no | const rect = host ? host.getBoundingClientRect() : canvas.getBoundingClientRect(); |
| ro | const | 49 | no | const ro = new ResizeObserver(function () { resize(); }); |
| tierSplit | function | 57 | no | function tierSplit(frame) { |
| by | const | 58 | no | const by = frame.byTier \|\| {}; |
| one | const | 59 | no | const one = Number(by[&quot;1&quot;]) \|\| 0; |
| two | const | 60 | no | const two = Number(by[&quot;2&quot;]) \|\| 0; |
| three | const | 61 | no | const three = Number(by[&quot;3&quot;]) \|\| 0; |
| sum | const | 62 | no | const sum = one + two + three; |
| rate | const | 63 | no | const rate = typeof frame.rate === &quot;number&quot; &amp;&amp; isFinite(frame.rate) ? frame.rate : 0; |
| k | const | 65 | no | const k = rate / sum; |
| pushFrame | function | 69 | no | function pushFrame(frame, ts) { |
| t | const | 71 | no | const t = typeof ts === &quot;number&quot; ? ts : Date.now(); |
| ensureLane | function | 82 | no | function ensureLane(runId, label) { |
| lane | variable | 83 | no | let lane = lanes.get(runId); |
| oldest | variable | 89 | no | let oldest = null; |
| pushEvent | function | 101 | no | function pushEvent(event, ts) { |
| t | const | 103 | no | const t = typeof ts === &quot;number&quot; ? ts : Date.now(); |
| lane | const | 105 | no | const lane = ensureLane(event.runId); |
| setRun | function | 111 | no | function setRun(run, ts) { |
| lane | const | 113 | no | const lane = ensureLane(run.runId, run.label); |
| setLaneState | function | 119 | no | function setLaneState(runId, state) { |
| lane | const | 120 | no | const lane = lanes.get(runId); |
| reset | function | 124 | no | function reset(runList, recentList) { |
| runs | const | 128 | no | const runs = runList \|\| []; |
| recent | const | 130 | no | const recent = recentList \|\| []; |
| ev | const | 132 | no | const ev = recent[i]; |
| activeLanes | function | 137 | no | function activeLanes(now) { |
| list | const | 138 | no | const list = []; |
| live | const | 140 | no | const live = lane.state === &quot;running&quot; \|\| lane.state === &quot;queued&quot;; |
| draw | function | 149 | no | function draw() { |
| W | const | 150 | no | const W = cssW; |
| H | const | 151 | no | const H = cssH; |
| M | const | 155 | no | const M = { l: 106, r: 82, t: 30, b: 16 }; |
| plotL | const | 156 | no | const plotL = M.l; |
| plotR | const | 157 | no | const plotR = Math.max(plotL + 60, W - M.r); |
| plotW | const | 158 | no | const plotW = plotR - plotL; |
| lanesList | const | 160 | no | const lanesList = activeLanes(latestTs \|\| Date.now()); |
| shown | const | 161 | no | const shown = lanesList.slice(0, MAX_VISIBLE_LANES); |
| laneH | const | 162 | no | const laneH = Math.max(13, Math.min(30, (H * 0.34) / Math.max(1, shown.length))); |
| lanesTop | const | 163 | no | const lanesTop = M.t; |
| lanesH | const | 164 | no | const lanesH = Math.max(30, shown.length * laneH); |
| errY | const | 165 | no | const errY = lanesTop + lanesH + 6; |
| sparkTop | const | 166 | no | const sparkTop = errY + 20; |
| sparkBot | const | 167 | no | const sparkBot = Math.max(sparkTop + 18, H - M.b); |
| now | const | 169 | no | const now = latestTs \|\| Date.now(); |
| t0 | const | 170 | no | const t0 = now - windowMs; |
| mapT | function | 172 | no | function mapT(t) { |
| stepSec | const | 180 | no | const stepSec = windowMs / 1000 / 6; |
| x | const | 182 | no | const x = plotL + (plotW * i) / 6; |
| label | const | 191 | no | const label = i === 6 ? &quot;now&quot; : &quot;-&quot; + Math.round((6 - i) * stepSec) + &quot;s&quot;; |
| lane | const | 200 | no | const lane = shown[i]; |
| y0 | const | 201 | no | const y0 = lanesTop + i * laneH; |
| color | const | 202 | no | const color = theme.state[lane.state] \|\| theme.txt3; |
| points | const | 216 | no | const points = lane.points; |
| cut | variable | 217 | no | let cut = 0; |
| point | const | 222 | no | const point = points[p]; |
| x | const | 223 | no | const x = mapT(point.t); |
| f | const | 268 | no | const f = frames[i]; |
| x | const | 270 | no | const x = mapT(f.t); |
| visible | const | 278 | no | const visible = []; |
| maxTotal | variable | 291 | no | let maxTotal = 0; |
| total | const | 293 | no | const total = visible[i].tiers[0] + visible[i].tiers[1] + visible[i].tiers[2]; |
| bandColors | const | 298 | no | const bandColors = [theme.t1, theme.t2, theme.t3]; |
| span | const | 299 | no | const span = sparkBot - sparkTop; |
| f | const | 304 | no | const f = visible[i]; |
| lower | const | 305 | no | const lower = f.tiers[0] * (band &gt;= 1 ? 1 : 0) + f.tiers[1] * (band &gt;= 2 ? 1 : 0); |
| upper | const | 306 | no | const upper = lower + f.tiers[band]; |
| x | const | 307 | no | const x = mapT(f.t); |
| y | const | 308 | no | const y = sparkBot - (upper / maxTotal) * span; |
| f | const | 313 | no | const f = visible[i]; |
| lower | const | 314 | no | const lower = f.tiers[0] * (band &gt;= 1 ? 1 : 0) + f.tiers[1] * (band &gt;= 2 ? 1 : 0); |
| x | const | 315 | no | const x = mapT(f.t); |
| y | const | 316 | no | const y = sparkBot - (lower / maxTotal) * span; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./format.js | import | 12 | [packages/tierflow/web/lib/format.js](./format.js.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/web/app.js](../app.js.md) | ./lib/timeline.js |

## Annotations

_No annotations._

## Excerpt

```javascript
// Live timeline canvas.
//
// Three stacked bands share one 30 second window:
//   1. one lane per run, each event drawn as a tick coloured by level
//   2. a strip of error ticks taken from frames that reported errors
//   3. a stacked area chart of events/sec, split per tier from frame.byTier
//
// Raw events are never drawn per frame message: frames arrive around 20/s
// and each one carries pre-aggregated counters, so the canvas only ever
// consumes aggregates plus the individual event timestamps used for lane ticks.

import { FONT_MONO, truncate } from "./format.js";

const MAX_FRAMES = 900;
const MAX_LANE_POINTS = 600;
const MAX_LANES = 24;
const MAX_VISIBLE_LANES = 6;

export function createTimeline(canvas, theme, options) {
  const opts = options || {};
  const windowMs = opts.windowMs || 30000;
  const ctx = canvas.getContext("2d", { alpha: false });

  let cssW = 1;
  let cssH = 1;
  let dpr = 1;

  const frames = [];
  const lanes = new Map();
  // The window is anchored to the newest server timestamp, not to the page
  // clock, so the timeline stays correct when the two disagree.
  let latestTs = 0;

  function resize() {
    const host = canvas.parentElement;
    const rect = host ? host.getBoundingClientRect() : canvas.getBoundingClientRect();
    cssW = Math.max(1, Math.round(rect.width));
    cssH = Math.max(1, Math.round(rect.height));
    dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(function () {
      resize();
    });
    ro.observe(canvas.parentElement || canvas);
  } else {
    window.addEventListener("resize", resize);
  }

  function tierSplit(frame) {
    const by = frame.byTier || {};
    const one = Number(by["1"]) || 0;
    const two = Number(by["2"]) || 0;
    const three = Number(by["3"]) || 0;
    const sum = one + two + three;
    const rate = typeof frame.rate === "number" && isFinite(frame.rate) ? frame.rate : 0;
    if (sum <= 0) return [rate, 0, 0];
    const k = rate / sum;
    return [one * k, two * k, three * k];
  }

  function pushFrame(frame, ts) {
    if (!frame || typeof frame !== "object") return;
    const t = typeof ts === "number" ? ts : Date.now();
    if (t > latestTs) latestTs = t;
    frames.push({
      t: t,
      rate: typeof frame.rate === "number" ? frame.rate : 0,
      errors: Number(frame.errors) || 0,
      tiers: tierSplit(frame),
    });
    if (frames.length > MAX_FRAMES) frames.splice(0, frames.length - MAX_FRAMES);
  }
```

_First 80 of 356 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

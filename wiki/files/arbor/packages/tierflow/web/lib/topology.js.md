# File: packages/tierflow/web/lib/topology.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/web/lib/topology.js |
| Language | JavaScript |
| Kind | source |
| Size | 9293 B |
| Lines | 279 |
| Hash | cbf7742fe925 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TIERS | const | 11 | no | const TIERS = [ |
| EDGES | const | 17 | no | const EDGES = [ |
| createTopology | function | 24 | yes | export function createTopology(svg) { |
| defs | const | 25 | no | const defs = svgEl(&quot;defs&quot;); |
| markerCool | const | 26 | no | const markerCool = svgEl(&quot;marker&quot;, { id: &quot;tf-arrow-cool&quot;, viewBox: &quot;0 0 8 8&quot;, refX: &quot;6&quot;, refY: &quot;4&quot;, |
| markerLive | const | 36 | no | const markerLive = svgEl(&quot;marker&quot;, { id: &quot;tf-arrow-live&quot;, viewBox: &quot;0 0 8 8&quot;, refX: &quot;6&quot;, refY: &quot;4&quot;, |
| edgeLayer | const | 49 | no | const edgeLayer = svgEl(&quot;g&quot;, { class: &quot;tp__edges&quot; }); |
| nodeLayer | const | 50 | no | const nodeLayer = svgEl(&quot;g&quot;, { class: &quot;tp__nodes&quot; }); |
| edgeNodes | const | 55 | no | const edgeNodes = []; |
| nodeNodes | const | 56 | no | const nodeNodes = []; |
| spec | const | 59 | no | const spec = EDGES[i]; |
| group | const | 60 | no | const group = svgEl(&quot;g&quot;, { class: &quot;tp__edge tp__edge--&quot; + spec.dir }); |
| path | const | 61 | no | const path = svgEl(&quot;path&quot;, { class: &quot;tp__edge-line&quot;, fill: &quot;none&quot;, &quot;marker-end&quot;: spec.dir === &quot;down&quot; ? &quot;url(#tf-arrow-cool)&quot; : &quot;url(#tf-arrow-live)&quot;, }); |
| label | const | 66 | no | const label = svgEl(&quot;text&quot;, { class: &quot;tp__edge-label&quot; }); |
| spec | const | 75 | no | const spec = TIERS[i]; |
| group | const | 76 | no | const group = svgEl(&quot;g&quot;, { class: &quot;tp__node&quot; }); |
| box | const | 79 | no | const box = svgEl(&quot;rect&quot;, { class: &quot;tp__box&quot;, rx: &quot;4&quot;, ry: &quot;4&quot; }); |
| tab | const | 80 | no | const tab = svgEl(&quot;rect&quot;, { class: &quot;tp__tab&quot; }); |
| pulse | const | 81 | no | const pulse = svgEl(&quot;circle&quot;, { class: &quot;tp__pulse&quot;, r: &quot;4&quot; }); |
| dot | const | 82 | no | const dot = svgEl(&quot;circle&quot;, { class: &quot;tp__dot&quot;, r: &quot;3&quot; }); |
| code | const | 83 | no | const code = svgEl(&quot;text&quot;, { class: &quot;tp__code&quot; }); |
| name | const | 85 | no | const name = svgEl(&quot;text&quot;, { class: &quot;tp__name&quot; }); |
| count | const | 87 | no | const count = svgEl(&quot;text&quot;, { class: &quot;tp__count&quot; }); |
| unit | const | 89 | no | const unit = svgEl(&quot;text&quot;, { class: &quot;tp__unit&quot; }); |
| state | const | 120 | no | const state = { |
| layout | function | 127 | no | function layout() { |
| rect | const | 128 | no | const rect = svg.getBoundingClientRect(); |
| w | const | 129 | no | const w = Math.max(120, Math.round(rect.width)); |
| h | const | 130 | no | const h = Math.max(160, Math.round(rect.height)); |
| padX | const | 137 | no | const padX = 14; |
| padY | const | 138 | no | const padY = 12; |
| avail | const | 139 | no | const avail = h - padY * 2; |
| nodeH | const | 140 | no | const nodeH = Math.max(44, Math.min(78, Math.round(avail * 0.23))); |
| gap | const | 141 | no | const gap = Math.max(40, (avail - nodeH * 3) / 2); |
| midX | const | 148 | no | const midX = Math.round(w / 2); |
| e | const | 151 | no | const e = edgeNodes[i]; |
| upper | const | 152 | no | const upper = state.boxes[e.spec.from]; |
| lower | const | 153 | no | const lower = state.boxes[e.spec.to]; |
| isDown | const | 154 | no | const isDown = e.spec.dir === &quot;down&quot;; |
| x | const | 155 | no | const x = isDown ? midX - 30 : midX + 30; |
| top | const | 156 | no | const top = isDown ? upper.y + upper.h + 6 : lower.y + lower.h + 6; |
| bottom | const | 157 | no | const bottom = isDown ? lower.y - 10 : upper.y - 10; |
| anchor | const | 159 | no | const anchor = isDown ? &quot;end&quot; : &quot;start&quot;; |
| labelX | const | 160 | no | const labelX = isDown ? x - 8 : x + 8; |
| labelY | const | 161 | no | const labelY = (top + bottom) / 2 + 3; |
| n | const | 168 | no | const n = nodeNodes[i]; |
| box | const | 169 | no | const box = state.boxes[i]; |
| wBox | const | 170 | no | const wBox = w - padX * 2; |
| codeSize | const | 181 | no | const codeSize = Math.max(13, Math.min(23, Math.round(box.h * 0.3))); |
| countSize | const | 197 | no | const countSize = Math.max(13, Math.min(21, Math.round(box.h * 0.27))); |
| ro | const | 213 | no | const ro = new ResizeObserver(function () { layout(); }); |
| setCount | function | 221 | no | function setCount(tier, value) { |
| n | const | 222 | no | const n = nodeNodes[tier - 1]; |
| next | const | 224 | no | const next = Math.max(0, Math.round(value \|\| 0)); |
| pulse | function | 231 | no | function pulse(tier) { |
| n | const | 232 | no | const n = nodeNodes[tier - 1]; |
| setFlow | function | 238 | no | function setFlow(rate) { |
| next | const | 239 | no | const next = Math.max(0, Math.round(rate \|\| 0)); |
| dur | const | 242 | no | const dur = Math.max(0.35, Math.min(2.4, 2.2 - next / 2600)); |
| tick | function | 246 | no | function tick(now) { |
| n | const | 248 | no | const n = nodeNodes[i]; |
| age | const | 249 | no | const age = now - n.pulseAt; |
| k | const | 251 | no | const k = Math.max(0, Math.min(1, 1 - age / 620)); |
| hot | const | 259 | no | const hot = now - n.pulseAt &lt; 1400; |
| bump | const | 264 | no | const bump = now - n.bumpAt; |
| reset | function | 269 | no | function reset() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./dom.js | import | 8 | [packages/tierflow/web/lib/dom.js](./dom.js.md) |
| ./format.js | import | 9 | [packages/tierflow/web/lib/format.js](./format.js.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/web/app.js](../app.js.md) | ./lib/topology.js |

## Annotations

_No annotations._

## Excerpt

```javascript
// Tier stack topology.
//
// The three tiers are drawn as SVG (not stacked divs) so the message flow
// between them is legible: solid cyan edges carry commands downward, amber
// edges carry results upward, and both animate their dash offset at a speed
// proportional to live throughput.

import { svgEl } from "./dom.js";
import { fmtCompact } from "./format.js";

const TIERS = [
  { tier: 1, code: "T1", name: "Interactive agent" },
  { tier: 2, code: "T2", name: "Orchestrator" },
  { tier: 3, code: "T3", name: "Executor" },
];

const EDGES = [
  { from: 0, to: 1, dir: "down", label: "intent" },
  { from: 1, to: 0, dir: "up", label: "narration" },
  { from: 1, to: 2, dir: "down", label: "dispatch" },
  { from: 2, to: 1, dir: "up", label: "reconcile" },
];

export function createTopology(svg) {
  const defs = svgEl("defs");
  const markerCool = svgEl("marker", {
    id: "tf-arrow-cool",
    viewBox: "0 0 8 8",
    refX: "6",
    refY: "4",
    markerWidth: "5",
    markerHeight: "5",
    orient: "auto",
  });
  markerCool.appendChild(svgEl("path", { d: "M0 0 L8 4 L0 8 Z", fill: "var(--cool)" }));
  const markerLive = svgEl("marker", {
    id: "tf-arrow-live",
    viewBox: "0 0 8 8",
    refX: "6",
    refY: "4",
    markerWidth: "5",
    markerHeight: "5",
    orient: "auto",
  });
  markerLive.appendChild(svgEl("path", { d: "M0 0 L8 4 L0 8 Z", fill: "var(--live)" }));
  defs.appendChild(markerCool);
  defs.appendChild(markerLive);

  const edgeLayer = svgEl("g", { class: "tp__edges" });
  const nodeLayer = svgEl("g", { class: "tp__nodes" });
  svg.appendChild(defs);
  svg.appendChild(edgeLayer);
  svg.appendChild(nodeLayer);

  const edgeNodes = [];
  const nodeNodes = [];

  for (let i = 0; i < EDGES.length; i += 1) {
    const spec = EDGES[i];
    const group = svgEl("g", { class: "tp__edge tp__edge--" + spec.dir });
    const path = svgEl("path", {
      class: "tp__edge-line",
      fill: "none",
      "marker-end": spec.dir === "down" ? "url(#tf-arrow-cool)" : "url(#tf-arrow-live)",
    });
    const label = svgEl("text", { class: "tp__edge-label" });
    label.textContent = spec.label.toUpperCase();
    group.appendChild(path);
    group.appendChild(label);
    edgeLayer.appendChild(group);
    edgeNodes.push({ spec, group, path, label });
  }

  for (let i = 0; i < TIERS.length; i += 1) {
    const spec = TIERS[i];
    const group = svgEl("g", { class: "tp__node" });
    group.setAttribute("data-tier", String(spec.tier));

    const box = svgEl("rect", { class: "tp__box", rx: "4", ry: "4" });
    const tab = svgEl("rect", { class: "tp__tab" });
```

_First 80 of 280 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

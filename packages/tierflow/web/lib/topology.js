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
    const pulse = svgEl("circle", { class: "tp__pulse", r: "4" });
    const dot = svgEl("circle", { class: "tp__dot", r: "3" });
    const code = svgEl("text", { class: "tp__code" });
    code.textContent = spec.code;
    const name = svgEl("text", { class: "tp__name" });
    name.textContent = spec.name.toUpperCase();
    const count = svgEl("text", { class: "tp__count" });
    count.textContent = "0";
    const unit = svgEl("text", { class: "tp__unit" });
    unit.textContent = "EVT / 30S";

    group.appendChild(box);
    group.appendChild(tab);
    group.appendChild(pulse);
    group.appendChild(dot);
    group.appendChild(code);
    group.appendChild(name);
    group.appendChild(count);
    group.appendChild(unit);
    nodeLayer.appendChild(group);

    nodeNodes.push({
      spec,
      group,
      box,
      tab,
      pulse,
      dot,
      code,
      name,
      count,
      unit,
      value: 0,
      pulseAt: 0,
      bumpAt: 0,
      hot: false,
    });
  }

  const state = {
    width: 0,
    height: 0,
    boxes: [],
    flow: 0,
  };

  function layout() {
    const rect = svg.getBoundingClientRect();
    const w = Math.max(120, Math.round(rect.width));
    const h = Math.max(160, Math.round(rect.height));
    state.width = w;
    state.height = h;
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("width", String(w));
    svg.setAttribute("height", String(h));

    const padX = 14;
    const padY = 12;
    const avail = h - padY * 2;
    const nodeH = Math.max(44, Math.min(78, Math.round(avail * 0.23)));
    const gap = Math.max(40, (avail - nodeH * 3) / 2);

    state.boxes = [];
    for (let i = 0; i < TIERS.length; i += 1) {
      state.boxes.push({ y: padY + i * (nodeH + gap), h: nodeH });
    }

    const midX = Math.round(w / 2);

    for (let i = 0; i < edgeNodes.length; i += 1) {
      const e = edgeNodes[i];
      const upper = state.boxes[e.spec.from];
      const lower = state.boxes[e.spec.to];
      const isDown = e.spec.dir === "down";
      const x = isDown ? midX - 30 : midX + 30;
      const top = isDown ? upper.y + upper.h + 6 : lower.y + lower.h + 6;
      const bottom = isDown ? lower.y - 10 : upper.y - 10;
      e.path.setAttribute("d", "M" + x + " " + top + " L" + x + " " + bottom);
      const anchor = isDown ? "end" : "start";
      const labelX = isDown ? x - 8 : x + 8;
      const labelY = (top + bottom) / 2 + 3;
      e.label.setAttribute("x", String(labelX));
      e.label.setAttribute("y", String(labelY));
      e.label.setAttribute("text-anchor", anchor);
    }

    for (let i = 0; i < nodeNodes.length; i += 1) {
      const n = nodeNodes[i];
      const box = state.boxes[i];
      const wBox = w - padX * 2;
      n.box.setAttribute("x", String(padX));
      n.box.setAttribute("y", String(box.y));
      n.box.setAttribute("width", String(wBox));
      n.box.setAttribute("height", String(box.h));
      n.tab.setAttribute("x", String(padX));
      n.tab.setAttribute("y", String(box.y + 4));
      n.tab.setAttribute("width", "3");
      n.tab.setAttribute("height", String(Math.max(8, box.h - 8)));
      n.tab.setAttribute("rx", "1.5");

      const codeSize = Math.max(13, Math.min(23, Math.round(box.h * 0.3)));
      n.code.setAttribute("x", String(padX + 14));
      n.code.setAttribute("y", String(box.y + box.h * 0.47));
      n.code.setAttribute("font-size", String(codeSize));

      n.name.setAttribute("x", String(padX + 14));
      n.name.setAttribute("y", String(box.y + box.h * 0.74));
      n.name.setAttribute("font-size", String(Math.max(8, Math.min(10, Math.round(box.h * 0.13)))));

      n.dot.setAttribute("cx", String(padX + 15));
      n.dot.setAttribute("cy", String(box.y + box.h * 0.18));
      n.dot.setAttribute("r", "3");
      n.pulse.setAttribute("cx", String(padX + 15));
      n.pulse.setAttribute("cy", String(box.y + box.h * 0.18));
      n.pulse.setAttribute("r", "4");

      const countSize = Math.max(13, Math.min(21, Math.round(box.h * 0.27)));
      n.count.setAttribute("x", String(w - padX));
      n.count.setAttribute("y", String(box.y + box.h * 0.52));
      n.count.setAttribute("text-anchor", "end");
      n.count.setAttribute("font-size", String(countSize));

      n.unit.setAttribute("x", String(w - padX));
      n.unit.setAttribute("y", String(box.y + box.h * 0.78));
      n.unit.setAttribute("text-anchor", "end");
      n.unit.setAttribute("font-size", "8");
    }
  }

  layout();

  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(function () {
      layout();
    });
    ro.observe(svg);
  } else {
    window.addEventListener("resize", layout);
  }

  function setCount(tier, value) {
    const n = nodeNodes[tier - 1];
    if (!n) return;
    const next = Math.max(0, Math.round(value || 0));
    if (next === n.value) return;
    n.value = next;
    n.count.textContent = fmtCompact(next);
    n.bumpAt = performance.now();
  }

  function pulse(tier) {
    const n = nodeNodes[tier - 1];
    if (!n) return;
    n.pulseAt = performance.now();
  }

  // Dash speed tracks live throughput so a quiet stack reads as quiet.
  function setFlow(rate) {
    const next = Math.max(0, Math.round(rate || 0));
    if (next === state.flow) return;
    state.flow = next;
    const dur = Math.max(0.35, Math.min(2.4, 2.2 - next / 2600));
    svg.style.setProperty("--tp-flow", dur.toFixed(2) + "s");
  }

  function tick(now) {
    for (let i = 0; i < nodeNodes.length; i += 1) {
      const n = nodeNodes[i];
      const age = now - n.pulseAt;
      if (age >= 0 && age < 620) {
        const k = Math.max(0, Math.min(1, 1 - age / 620));
        n.pulse.setAttribute("r", String(4 + k * 15));
        n.pulse.style.opacity = String(k * 0.55);
        n.dot.style.opacity = "1";
      } else {
        n.pulse.style.opacity = "0";
        n.dot.style.opacity = "0.35";
      }
      const hot = now - n.pulseAt < 1400;
      if (hot !== n.hot) {
        n.hot = hot;
        n.group.classList.toggle("is-hot", hot);
      }
      const bump = now - n.bumpAt;
      n.count.style.fill = bump >= 0 && bump < 260 ? "#ffffff" : "";
    }
  }

  function reset() {
    for (let i = 0; i < nodeNodes.length; i += 1) {
      nodeNodes[i].value = -1;
      nodeNodes[i].pulseAt = 0;
      nodeNodes[i].bumpAt = 0;
      setCount(i + 1, 0);
    }
  }

  return { layout, setCount, pulse, setFlow, tick, reset };
}

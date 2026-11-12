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

  function ensureLane(runId, label) {
    let lane = lanes.get(runId);
    if (!lane) {
      lane = { runId: runId, label: label || runId, state: "running", points: [], last: 0 };
      lanes.set(runId, lane);
      if (lanes.size > MAX_LANES) {
        // Drop the least recently active lane, never a running one.
        let oldest = null;
        lanes.forEach(function (candidate) {
          if (candidate.state === "running" || candidate.state === "queued") return;
          if (!oldest || candidate.last < oldest.last) oldest = candidate;
        });
        if (oldest) lanes.delete(oldest.runId);
      }
    }
    if (label) lane.label = label;
    return lane;
  }

  function pushEvent(event, ts) {
    if (!event || !event.runId) return;
    const t = typeof ts === "number" ? ts : Date.now();
    if (t > latestTs) latestTs = t;
    const lane = ensureLane(event.runId);
    lane.points.push({ t: t, level: event.level || "info", type: event.type || "" });
    if (lane.points.length > MAX_LANE_POINTS) lane.points.splice(0, lane.points.length - MAX_LANE_POINTS);
    if (t > lane.last) lane.last = t;
  }

  function setRun(run, ts) {
    if (!run || !run.runId) return;
    const lane = ensureLane(run.runId, run.label);
    lane.state = run.state || lane.state;
    if (typeof run.startedAt === "number" && run.startedAt > lane.last) lane.last = run.startedAt;
    if (typeof ts === "number" && ts > lane.last) lane.last = ts;
  }

  function setLaneState(runId, state) {
    const lane = lanes.get(runId);
    if (lane && state) lane.state = state;
  }

  function reset(runList, recentList) {
    frames.length = 0;
    lanes.clear();
    latestTs = 0;
    const runs = runList || [];
    for (let i = 0; i < runs.length; i += 1) setRun(runs[i], runs[i] && runs[i].startedAt);
    const recent = recentList || [];
    for (let i = 0; i < recent.length; i += 1) {
      const ev = recent[i];
      if (ev && ev.runId) pushEvent(ev, typeof ev.ts === "number" ? ev.ts : Date.now());
    }
  }

  function activeLanes(now) {
    const list = [];
    lanes.forEach(function (lane) {
      const live = lane.state === "running" || lane.state === "queued";
      if (live || now - lane.last < windowMs) list.push(lane);
    });
    list.sort(function (a, b) {
      return b.last - a.last;
    });
    return list;
  }

  function draw() {
    const W = cssW;
    const H = cssH;
    ctx.fillStyle = theme.inset;
    ctx.fillRect(0, 0, W, H);

    const M = { l: 106, r: 82, t: 30, b: 16 };
    const plotL = M.l;
    const plotR = Math.max(plotL + 60, W - M.r);
    const plotW = plotR - plotL;

    const lanesList = activeLanes(latestTs || Date.now());
    const shown = lanesList.slice(0, MAX_VISIBLE_LANES);
    const laneH = Math.max(13, Math.min(30, (H * 0.34) / Math.max(1, shown.length)));
    const lanesTop = M.t;
    const lanesH = Math.max(30, shown.length * laneH);
    const errY = lanesTop + lanesH + 6;
    const sparkTop = errY + 20;
    const sparkBot = Math.max(sparkTop + 18, H - M.b);

    const now = latestTs || Date.now();
    const t0 = now - windowMs;

    function mapT(t) {
      return plotL + ((t - t0) / windowMs) * plotW;
    }

    // ---- ruler + grid -------------------------------------------------
    ctx.save();
    ctx.font = "9px " + FONT_MONO;
    ctx.textBaseline = "middle";
    const stepSec = windowMs / 1000 / 6;
    for (let i = 0; i <= 6; i += 1) {
      const x = plotL + (plotW * i) / 6;
      ctx.strokeStyle = "rgba(255,255,255,0.035)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, lanesTop - 8);
      ctx.lineTo(Math.round(x) + 0.5, sparkBot);
      ctx.stroke();
      ctx.fillStyle = theme.txt3;
      ctx.textAlign = i === 0 ? "left" : i === 6 ? "right" : "center";
      const label = i === 6 ? "now" : "-" + Math.round((6 - i) * stepSec) + "s";
      ctx.fillText(label, x, lanesTop - 14);
    }
    ctx.restore();

    // ---- run lanes ----------------------------------------------------
    ctx.save();
    ctx.textBaseline = "middle";
    for (let i = 0; i < shown.length; i += 1) {
      const lane = shown[i];
      const y0 = lanesTop + i * laneH;
      const color = theme.state[lane.state] || theme.txt3;

      ctx.font = "10px " + FONT_MONO;
      ctx.textAlign = "right";
      ctx.fillStyle = theme.txt2;
      ctx.fillText(truncate(lane.label, 14), plotL - 10, y0 + laneH / 2 - 1);

      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotL, Math.round(y0 + laneH - 4.5) + 0.5);
      ctx.lineTo(plotR, Math.round(y0 + laneH - 4.5) + 0.5);
      ctx.stroke();

      const points = lane.points;
      let cut = 0;
      while (cut < points.length && points[cut].t < t0) cut += 1;
      if (cut > 0) points.splice(0, cut);

      for (let p = 0; p < points.length; p += 1) {
        const point = points[p];
        const x = mapT(point.t);
        if (x < plotL - 2 || x > plotR + 2) continue;
        ctx.fillStyle = theme.level[point.level] || theme.lvlInfo;
        ctx.fillRect(x, y0 + 2, 1.4, Math.max(3, laneH - 9));
      }

      ctx.font = "8.5px " + FONT_MONO;
      ctx.textAlign = "right";
      ctx.fillStyle = color;
      ctx.fillText(String(lane.state || "unknown").toUpperCase(), W - 8, y0 + laneH / 2 - 1);
    }
    ctx.restore();

    if (shown.length === 0) {
      ctx.save();
      ctx.font = "10px " + FONT_MONO;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = theme.txt3;
      ctx.fillText(
        lanesList.length ? "NO LANES IN WINDOW" : "NO RUNS — SEND A CHAT LINE OR START A SYNTHETIC RUN",
        plotL + plotW / 2,
        lanesTop + lanesH / 2
      );
      ctx.restore();
    } else if (lanesList.length > shown.length) {
      ctx.save();
      ctx.font = "9px " + FONT_MONO;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = theme.txt3;
      ctx.fillText("+" + (lanesList.length - shown.length) + " MORE RUNS", W - 8, lanesTop + lanesH - 4);
      ctx.restore();
    }

    // ---- error strip --------------------------------------------------
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.fillRect(plotL, errY, plotW, 10);
    ctx.font = "8px " + FONT_MONO;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = theme.txt3;
    ctx.fillText("ERRORS", plotL - 10, errY + 5);
    for (let i = 0; i < frames.length; i += 1) {
      const f = frames[i];
      if (f.errors <= 0 || f.t < t0) continue;
      const x = mapT(f.t);
      if (x < plotL - 2 || x > plotR + 2) continue;
      ctx.fillStyle = theme.warn;
      ctx.fillRect(x - 1, errY, 2, 10);
    }
    ctx.restore();

    // ---- stacked rate area --------------------------------------------
    const visible = [];
    for (let i = 0; i < frames.length; i += 1) {
      if (frames[i].t >= t0) visible.push(frames[i]);
    }

    ctx.save();
    ctx.font = "8px " + FONT_MONO;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = theme.txt3;
    ctx.fillText("EV/S", plotL - 10, sparkTop + 6);

    if (visible.length > 1) {
      let maxTotal = 0;
      for (let i = 0; i < visible.length; i += 1) {
        const total = visible[i].tiers[0] + visible[i].tiers[1] + visible[i].tiers[2];
        if (total > maxTotal) maxTotal = total;
      }
      if (maxTotal <= 0) maxTotal = 1;

      const bandColors = [theme.t1, theme.t2, theme.t3];
      const span = sparkBot - sparkTop;

      for (let band = 0; band < 3; band += 1) {
        ctx.beginPath();
        for (let i = 0; i < visible.length; i += 1) {
          const f = visible[i];
          const lower = f.tiers[0] * (band >= 1 ? 1 : 0) + f.tiers[1] * (band >= 2 ? 1 : 0);
          const upper = lower + f.tiers[band];
          const x = mapT(f.t);
          const y = sparkBot - (upper / maxTotal) * span;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (let i = visible.length - 1; i >= 0; i -= 1) {
          const f = visible[i];
          const lower = f.tiers[0] * (band >= 1 ? 1 : 0) + f.tiers[1] * (band >= 2 ? 1 : 0);
          const x = mapT(f.t);
          const y = sparkBot - (lower / maxTotal) * span;
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = bandColors[band];
        ctx.fill();
        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = bandColors[band];
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotL, Math.round(sparkBot) + 0.5);
      ctx.lineTo(plotR, Math.round(sparkBot) + 0.5);
      ctx.stroke();
    } else {
      ctx.textAlign = "center";
      ctx.fillStyle = theme.txt3;
      ctx.fillText("AWAITING FRAMES", plotL + plotW / 2, sparkTop + 12);
    }
    ctx.restore();
  }

  return {
    draw: draw,
    pushFrame: pushFrame,
    pushEvent: pushEvent,
    setRun: setRun,
    setLaneState: setLaneState,
    reset: reset,
    laneCount: function () {
      return lanes.size;
    },
  };
}

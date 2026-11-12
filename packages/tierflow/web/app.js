// TIERFLOW mission control — application entry point.
//
// One websocket carries six message kinds. Everything inbound is buffered and
// drained inside a single animation frame, so the DOM is touched at most once
// per frame no matter how fast the server emits. Frames are aggregates and
// drive the readouts; individual events drive the timeline lanes, the tier
// topology and the transcript.
//
// Outbound control frames: chat, stop, maintain, sim.

import { readTheme } from "./lib/palette.js";
import { fmtNum, fmtCompact, fmtDur, fmtUs, truncate, summarize, summarizeText } from "./lib/format.js";
import { createTopology } from "./lib/topology.js";
import { createTimeline } from "./lib/timeline.js";
import { createTranscript } from "./lib/transcript.js";
import { createRunBoard } from "./lib/runboard.js";
import { createWorldSurface } from "./world.js";

const THEME = readTheme();
const $ = function (id) {
  return document.getElementById(id);
};

const ui = {
  proto: $("proto-id"),
  pid: $("pid-id"),
  hot: $("hot-badge"),
  conn: $("conn"),
  connText: $("conn-text"),
  cIntents: $("c-intents"),
  cPlans: $("c-plans"),
  cRuns: $("c-runs"),
  cEvents: $("c-events"),
  tierFlow: $("tier-flow"),
  tlRate: $("tl-rate"),
  tlP95: $("tl-p95"),
  tlHint: $("tl-hint"),
  tlog: $("tlog"),
  jump: $("btn-jump"),
  composer: $("composer"),
  chat: $("chat"),
  btnSend: $("btn-send"),
  btnMaintain: $("btn-maintain"),
  btnClear: $("btn-clear"),
  btnSim: $("btn-sim"),
  boardList: $("board-list"),
  boardCount: $("board-count"),
  fWs: $("f-ws"),
  fBackoff: $("f-backoff"),
  fSeq: $("f-seq"),
  fRate: $("f-rate"),
  fP95: $("f-p95"),
  fDrops: $("f-drops"),
  fUptime: $("f-uptime"),
  live: $("live-status"),
};

const topology = createTopology($("tier-svg"));
const timeline = createTimeline($("timeline"), THEME, { windowMs: 30000 });
const transcript = createTranscript(ui.tlog, { max: 300 });
const board = createRunBoard(ui.boardList, {
  onStop: function (runId) {
    send({ op: "stop", runId: runId });
    transcript.add(note("stop requested for " + runId));
    transcript.commit();
  },
});

/* ------------------------------------------------------------------ */
/* Tier meter: rolling 30 second per-tier event counts.               */
/* ------------------------------------------------------------------ */

function createMeter(buckets) {
  const size = buckets;
  const data = { 1: new Array(size).fill(0), 2: new Array(size).fill(0), 3: new Array(size).fill(0) };
  let head = 0;
  let lastSecond = -1;

  function advance(ts) {
    const sec = Math.floor((ts || Date.now()) / 1000);
    if (lastSecond < 0) {
      lastSecond = sec;
      return;
    }
    let diff = sec - lastSecond;
    if (diff <= 0) return;
    if (diff > size) diff = size;
    for (let i = 0; i < diff; i += 1) {
      head = (head + 1) % size;
      data[1][head] = 0;
      data[2][head] = 0;
      data[3][head] = 0;
    }
    lastSecond = sec;
  }

  return {
    push: function (tier, ts) {
      if (tier !== 1 && tier !== 2 && tier !== 3) return;
      advance(ts);
      data[tier][head] += 1;
    },
    advance: advance,
    reset: function () {
      data[1].fill(0);
      data[2].fill(0);
      data[3].fill(0);
      head = 0;
      lastSecond = -1;
    },
    count: function (tier) {
      let sum = 0;
      const row = data[tier];
      for (let i = 0; i < size; i += 1) sum += row[i];
      return sum;
    },
  };
}

const meter = createMeter(30);

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

const state = {
  protocol: "tierflow/1",
  hotpath: null,
  sessionId: null,
  pid: null,
  startedAt: Date.now(),
  counters: { intents: 0, plans: 0, runs: 0, events: 0 },
  lastSeq: 0,
  lastFrame: null,
  serverClock: { ts: 0, page: 0 },
  conn: "connecting",
};

// The server owns the clock. The newest server timestamp is remembered and
// extrapolated with elapsed page time, which gives an accurate "server now"
// without a smoothing filter and without ever drifting.
function syncClock(serverTs) {
  if (typeof serverTs !== "number" || !isFinite(serverTs)) return;
  const page = Date.now();
  if (serverTs > state.serverClock.ts) {
    state.serverClock.ts = serverTs;
    state.serverClock.page = page;
  }
}

function serverNow() {
  const clock = state.serverClock;
  if (!clock.ts) return Date.now();
  return clock.ts + (Date.now() - clock.page);
}

/* ------------------------------------------------------------------ */
/* Transport                                                           */
/* ------------------------------------------------------------------ */

const sock = { ws: null, timer: 0, delay: 500, queue: [] };

function wsUrl() {
  const scheme = location.protocol === "https:" ? "wss:" : "ws:";
  return scheme + "//" + location.host + "/ws";
}

function setConn(kind, label) {
  const changed = state.conn !== kind;
  state.conn = kind;
  ui.conn.dataset.state = kind;
  ui.connText.textContent = label;
  ui.fWs.textContent = label.toLowerCase();
  if (changed) ui.live.textContent = "WebSocket " + label.toLowerCase();
}

function connect() {
  setConn("connecting", "CONNECTING");
  let ws;
  try {
    ws = new WebSocket(wsUrl());
  } catch (err) {
    scheduleRetry();
    return;
  }
  sock.ws = ws;

  ws.onopen = function () {
    sock.delay = 500;
    ui.fBackoff.textContent = "-";
    setConn("live", "LIVE");
    while (sock.queue.length) {
      try {
        ws.send(sock.queue.shift());
      } catch (err) {
        break;
      }
    }
  };

  ws.onmessage = function (message) {
    if (typeof message.data !== "string") return;
    let parsed;
    try {
      parsed = JSON.parse(message.data);
    } catch (err) {
      return;
    }
    ingest(parsed);
  };

  ws.onclose = function () {
    setConn("retrying", "RECONNECTING");
    scheduleRetry();
  };

  ws.onerror = function () {
    // onclose always follows; the retry loop is handled there.
  };
}

function scheduleRetry() {
  const delay = sock.delay;
  sock.delay = Math.min(8000, sock.delay * 2);
  ui.fBackoff.textContent = (delay / 1000).toFixed(1) + "s";
  window.clearTimeout(sock.timer);
  sock.timer = window.setTimeout(connect, delay);
}

function send(payload) {
  const raw = JSON.stringify(payload);
  if (sock.ws && sock.ws.readyState === 1) {
    try {
      sock.ws.send(raw);
      return true;
    } catch (err) {
      // fall through to the queue
    }
  }
  sock.queue.push(raw);
  while (sock.queue.length > 50) sock.queue.shift();
  return false;
}

/* ------------------------------------------------------------------ */
/* Inbound buffering                                                   */
/* ------------------------------------------------------------------ */

let pending = [];

// The world surface opens on demand; its frames are routed here so the mission
// control buffers never see a ui.* message.
let worldSurface = null;

function ingest(message) {
  if (!message || typeof message !== "object") return;
  if (worldSurface && typeof message.kind === "string" && message.kind.slice(0, 3) === "ui.") {
    worldSurface.applyServerMessage(message);
    return;
  }
  pending.push(message);
}

const NOISY_TYPES = { "job.stdout": true, "job.stderr": true, "job.heartbeat": true };

function isImportant(event) {
  if (!event) return false;
  if (event.level === "error" || event.level === "warn") return true;
  if (event.level === "debug") return false;
  return !NOISY_TYPES[event.type];
}

function note(text) {
  return { kind: "note", tag: "NOTE", type: "system.note", text: text, ts: serverNow() };
}

function tierEntry(event) {
  const text = event.text ? truncate(String(event.text), 400) : "";
  let summary = summarize(event.data);
  if (!summary && event.text) summary = summarizeText(event.text);
  return {
    kind: "t" + event.tier,
    tag: "T" + event.tier,
    type: event.type,
    text: text,
    summary: summary ? (text ? " · " + summary : summary) : "",
    ts: event.ts,
  };
}

function aggregateEntry(total, samples) {
  const tally = {};
  for (let i = 0; i < samples.length; i += 1) {
    const type = samples[i].type || "event";
    tally[type] = (tally[type] || 0) + 1;
  }
  const parts = [];
  for (const key in tally) {
    if (!Object.prototype.hasOwnProperty.call(tally, key)) continue;
    parts.push(key + " x" + tally[key]);
  }
  const ts = samples.length ? samples[samples.length - 1].ts : serverNow();
  return {
    kind: "agg",
    tag: "AGG",
    type: "coalesced",
    text: total + " events coalesced · " + (parts.join(" · ") || "stream"),
    summary: "",
    ts: ts,
  };
}

function planEntry(plan) {
  const steps = plan.steps || [];
  const labels = [];
  for (let i = 0; i < steps.length; i += 1) {
    labels.push(steps[i].label || steps[i].id || "step");
  }
  let summary = plan.id + " · " + steps.length + " step" + (steps.length === 1 ? "" : "s");
  if (labels.length) summary += " · " + labels.join(" → ");
  return {
    kind: "t2",
    tag: "T2",
    type: "plan.created",
    text: plan.rationale ? truncate(String(plan.rationale), 300) : "plan dispatched",
    summary: " · " + summary,
    ts: plan.createdAt,
  };
}

function userEntry(text) {
  return { kind: "you", tag: "YOU", type: "input", text: text, summary: "", ts: serverNow() };
}

function deriveRun(event) {
  if (!event || !event.runId) return;
  const data = event.data || {};
  let next = null;
  switch (event.type) {
    case "job.queued":
      next = "queued";
      break;
    case "job.started":
      next = "running";
      break;
    case "job.exit":
      next = data.exitCode !== undefined && data.exitCode !== null && Number(data.exitCode) !== 0 ? "failed" : "succeeded";
      break;
    case "job.cancelled":
      next = "cancelled";
      break;
    case "job.timeout":
      next = "timed_out";
      break;
    case "job.restart":
      next = "running";
      break;
    case "run.state":
      next = typeof data.state === "string" ? data.state : null;
      break;
    default:
      next = null;
  }
  if (!next) return;
  board.setState(event.runId, next, event);
  timeline.setLaneState(event.runId, next);
}

function onHello(snapshot) {
  const snap = snapshot || {};
  if (typeof snap.protocol === "string") state.protocol = snap.protocol;
  if (typeof snap.sessionId === "string") state.sessionId = snap.sessionId;
  if (typeof snap.pid === "number") state.pid = snap.pid;
  if (typeof snap.startedAt === "number") {
    // startedAt is the server boot time, not "now": it must never be used to
    // sync the clock offset or every timestamp would shift back by the uptime.
    state.startedAt = snap.startedAt;
  }
  if (typeof snap.hotpath === "string") state.hotpath = snap.hotpath;

  const counters = snap.counters || {};
  state.counters = {
    intents: Number(counters.intents) || 0,
    plans: Number(counters.plans) || 0,
    runs: Number(counters.runs) || 0,
    events: Number(counters.events) || 0,
  };
  state.lastSeq = state.counters.events;

  ui.proto.textContent = state.protocol;
  ui.pid.textContent = "PID " + (state.pid === null ? "--" : state.pid);
  setHotpath(state.hotpath);

  meter.reset();
  board.replaceAll(snap.runs || []);
  timeline.reset(snap.runs || [], snap.recent || []);

  transcript.rule(
    "SESSION " + String(state.sessionId || "-").slice(0, 12) + " · RESYNC · PID " + (state.pid === null ? "--" : state.pid)
  );

  const recent = snap.recent || [];
  let noisy = 0;
  const samples = [];
  for (let i = 0; i < recent.length; i += 1) {
    const event = recent[i];
    if (!event) continue;
    meter.push(event.tier, event.ts);
    if (event.runId) timeline.pushEvent(event, event.ts);
    if (isImportant(event)) transcript.add(tierEntry(event));
    else {
      noisy += 1;
      if (samples.length < 5) samples.push(event);
    }
  }
  if (noisy > 0) transcript.add(aggregateEntry(noisy, samples));
}

function setHotpath(hotpath) {
  if (hotpath === "rust") {
    ui.hot.textContent = "RUST";
    ui.hot.dataset.hot = "rust";
  } else if (hotpath === "ts-fallback") {
    ui.hot.textContent = "TS-FALLBACK";
    ui.hot.dataset.hot = "ts";
  } else {
    ui.hot.textContent = "HOTPATH --";
    ui.hot.dataset.hot = "unknown";
  }
}

/* ------------------------------------------------------------------ */
/* Frame loop                                                          */
/* ------------------------------------------------------------------ */

// Messages are applied strictly in arrival order. Bucketing them by kind
// would let a late `run` frame overwrite a newer `job.exit` event, so the
// dispatch is a single ordered pass. Only the transcript noise is coalesced,
// and it is flushed before any important row so chronology stays intact.
function flushPending() {
  if (!pending.length) return;
  const messages = pending;
  pending = [];

  let noisy = 0;
  const samples = [];

  function flushNoise() {
    if (noisy <= 0) return;
    transcript.add(aggregateEntry(noisy, samples));
    noisy = 0;
    samples.length = 0;
  }

  for (let i = 0; i < messages.length; i += 1) {
    const message = messages[i];
    if (!message || typeof message !== "object") continue;

    if (message.kind === "event" && message.event) {
      const event = message.event;
      syncClock(event.ts);
      meter.push(event.tier, event.ts);
      topology.pulse(event.tier);
      if (event.runId) timeline.pushEvent(event, event.ts);

      if (typeof event.seq === "number" && event.seq > state.lastSeq) {
        state.lastSeq = event.seq;
        state.counters.events = event.seq;
        if (event.type === "intent.received") state.counters.intents += 1;
        if (event.type === "plan.created") state.counters.plans += 1;
        if (event.type === "job.started") state.counters.runs += 1;
      }

      deriveRun(event);

      if (isImportant(event)) {
        flushNoise();
        transcript.add(tierEntry(event));
      } else {
        noisy += 1;
        if (samples.length < 5) samples.push(event);
      }
      continue;
    }

    if (message.kind === "run" && message.run) {
      flushNoise();
      board.upsert(message.run);
      continue;
    }

    if (message.kind === "plan" && message.plan) {
      flushNoise();
      transcript.add(planEntry(message.plan));
      continue;
    }

    if (message.kind === "note" && typeof message.text === "string") {
      flushNoise();
      transcript.add(note(message.text));
      continue;
    }

    if (message.kind === "frame" && message.frame) {
      syncClock(message.frame.ts);
      timeline.pushFrame(message.frame, message.frame.ts);
      state.lastFrame = message.frame;
      continue;
    }

    if (message.kind === "hello" && message.snapshot) {
      flushNoise();
      onHello(message.snapshot);
      continue;
    }
  }

  flushNoise();
  transcript.commit();
}

const bumpAt = {};

function setCounter(node, value) {
  const text = fmtNum(value);
  if (node.textContent === text) return;
  node.textContent = text;
  const now = performance.now();
  if (now - (bumpAt[node.id] || 0) < 120) return;
  bumpAt[node.id] = now;
  if (typeof node.animate === "function") {
    node.animate(
      [
        { transform: "translateY(-3px)", filter: "brightness(1.6)" },
        { transform: "translateY(0)", filter: "brightness(1)" },
      ],
      { duration: 260, easing: "cubic-bezier(.2,.7,.3,1)" }
    );
  }
}

let lastSlowTick = -1e6;

function updateSlowReadouts(now) {
  setCounter(ui.cIntents, state.counters.intents);
  setCounter(ui.cPlans, state.counters.plans);
  setCounter(ui.cRuns, state.counters.runs);
  setCounter(ui.cEvents, state.counters.events);

  const frame = state.lastFrame;
  if (frame) {
    const rate = fmtCompact(frame.rate) + "/s";
    if (ui.tlRate.textContent !== rate) ui.tlRate.textContent = rate;
    if (ui.fRate.textContent !== rate) ui.fRate.textContent = rate;
    const p95 = fmtUs(frame.p95GapUs);
    if (ui.tlP95.textContent !== p95) ui.tlP95.textContent = p95;
    if (ui.fP95.textContent !== p95) ui.fP95.textContent = p95;
    const drops = fmtNum(frame.drops);
    if (ui.fDrops.textContent !== drops) ui.fDrops.textContent = drops;
    const seq = fmtNum(frame.seq);
    if (ui.fSeq.textContent !== seq) ui.fSeq.textContent = seq;
    topology.setFlow(frame.rate);
    const flow = "FLOW " + rate;
    if (ui.tierFlow.textContent !== flow) ui.tierFlow.textContent = flow;
    if (!ui.tlHint.hidden) ui.tlHint.hidden = true;
  }

  for (let tier = 1; tier <= 3; tier += 1) topology.setCount(tier, meter.count(tier));

  const total = board.total();
  const active = board.activeCount();
  const label = total + (total === 1 ? " run" : " runs") + (active ? " · " + active + " active" : "");
  if (ui.boardCount.textContent !== label) ui.boardCount.textContent = label;

  if (active > 0) {
    if (!ui.btnSim.disabled) {
      ui.btnSim.disabled = true;
      ui.btnSim.textContent = "Run active";
    }
  } else if (ui.btnSim.disabled) {
    ui.btnSim.disabled = false;
    ui.btnSim.textContent = "Synthetic run";
  }

  const uptime = fmtDur(Math.max(0, serverNow() - state.startedAt));
  if (ui.fUptime.textContent !== uptime) ui.fUptime.textContent = uptime;

  board.tick(serverNow());
  lastSlowTick = now;
}

function loop(now) {
  window.requestAnimationFrame(loop);
  flushPending();
  timeline.draw();
  topology.tick(now);
  if (now - lastSlowTick > 220) updateSlowReadouts(now);
}

/* ------------------------------------------------------------------ */
/* Interaction                                                         */
/* ------------------------------------------------------------------ */

function submitChat() {
  const raw = ui.chat.value;
  const text = raw.replace(/\s+$/, "");
  if (!text.trim()) return;
  transcript.add(userEntry(text));
  transcript.commit();
  send({ op: "chat", text: text });
  ui.chat.value = "";
  ui.chat.style.height = "auto";
  ui.chat.focus();
}

ui.composer.addEventListener("submit", function (event) {
  event.preventDefault();
  submitChat();
});

ui.chat.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    submitChat();
  }
});

ui.chat.addEventListener("input", function () {
  ui.chat.style.height = "auto";
  ui.chat.style.height = Math.min(140, ui.chat.scrollHeight) + "px";
});

ui.btnMaintain.addEventListener("click", function () {
  send({ op: "maintain" });
  transcript.add(note("maintenance sweep requested"));
  transcript.commit();
});

ui.btnSim.addEventListener("click", function () {
  send({ op: "sim", rate: 2000, seconds: 5 });
  transcript.add(note("synthetic run requested · 2000 ev/s for 5s"));
  transcript.commit();
});

ui.btnClear.addEventListener("click", function () {
  transcript.clear();
  transcript.rule("TRANSCRIPT CLEARED");
  transcript.commit();
  ui.chat.focus();
});

ui.jump.addEventListener("click", function () {
  transcript.scrollToLive();
});

transcript.onPinChange = function (pinned) {
  ui.jump.hidden = pinned;
};

window.addEventListener("keydown", function (event) {
  const key = (event.key || "").toLowerCase();
  if ((event.ctrlKey || event.metaKey) && key === "l") {
    event.preventDefault();
    transcript.clear();
    transcript.rule("TRANSCRIPT CLEARED");
    transcript.commit();
    ui.chat.focus();
  }
});

window.addEventListener("beforeunload", function () {
  if (sock.ws) {
    try {
      sock.ws.close();
    } catch (err) {
      // closing during unload is best effort
    }
  }
});

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

setHotpath(null);
worldSurface = createWorldSurface({ actorId: "studio" });
connect();
window.requestAnimationFrame(loop);

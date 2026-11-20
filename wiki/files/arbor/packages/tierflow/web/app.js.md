# File: packages/tierflow/web/app.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/web/app.js |
| Language | JavaScript |
| Kind | source |
| Size | 20772 B |
| Lines | 688 |
| Hash | bfd02e0c3d42 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| THEME | const | 19 | no | const THEME = readTheme(); |
| $ | function | 20 | no | const $ = function (id) { |
| ui | const | 24 | no | const ui = { |
| topology | const | 58 | no | const topology = createTopology($(&quot;tier-svg&quot;)); |
| timeline | const | 59 | no | const timeline = createTimeline($(&quot;timeline&quot;), THEME, { windowMs: 30000 }); |
| transcript | const | 60 | no | const transcript = createTranscript(ui.tlog, { max: 300 }); |
| board | const | 61 | no | const board = createRunBoard(ui.boardList, { onStop: function (runId) { send({ op: &quot;stop&quot;, runId: runId }); transcript.add(note(&quot;stop requested for &quot; + runId)); transcript.commit(); |
| createMeter | function | 73 | no | function createMeter(buckets) { |
| size | const | 74 | no | const size = buckets; |
| data | const | 75 | no | const data = { 1: new Array(size).fill(0), 2: new Array(size).fill(0), 3: new Array(size).fill(0) }; |
| head | variable | 76 | no | let head = 0; |
| lastSecond | variable | 77 | no | let lastSecond = -1; |
| advance | function | 79 | no | function advance(ts) { |
| sec | const | 80 | no | const sec = Math.floor((ts \|\| Date.now()) / 1000); |
| diff | variable | 85 | no | let diff = sec - lastSecond; |
| sum | variable | 112 | no | let sum = 0; |
| row | const | 113 | no | const row = data[tier]; |
| meter | const | 120 | no | const meter = createMeter(30); |
| state | const | 126 | no | const state = { |
| syncClock | function | 142 | no | function syncClock(serverTs) { |
| page | const | 144 | no | const page = Date.now(); |
| serverNow | function | 151 | no | function serverNow() { |
| clock | const | 152 | no | const clock = state.serverClock; |
| sock | const | 161 | no | const sock = { ws: null, timer: 0, delay: 500, queue: [] }; |
| wsUrl | function | 163 | no | function wsUrl() { |
| scheme | const | 164 | no | const scheme = location.protocol === &quot;https:&quot; ? &quot;wss:&quot; : &quot;ws:&quot;; |
| setConn | function | 168 | no | function setConn(kind, label) { |
| changed | const | 169 | no | const changed = state.conn !== kind; |
| connect | function | 177 | no | function connect() { |
| ws | variable | 179 | no | let ws; |
| parsed | variable | 203 | no | let parsed; |
| scheduleRetry | function | 222 | no | function scheduleRetry() { |
| delay | const | 223 | no | const delay = sock.delay; |
| send | function | 230 | no | function send(payload) { |
| raw | const | 231 | no | const raw = JSON.stringify(payload); |
| pending | variable | 249 | no | let pending = []; |
| worldSurface | variable | 253 | no | let worldSurface = null; |
| ingest | function | 255 | no | function ingest(message) { |
| NOISY_TYPES | const | 264 | no | const NOISY_TYPES = { &quot;job.stdout&quot;: true, &quot;job.stderr&quot;: true, &quot;job.heartbeat&quot;: true }; |
| isImportant | function | 266 | no | function isImportant(event) { |
| note | function | 273 | no | function note(text) { |
| tierEntry | function | 277 | no | function tierEntry(event) { |
| text | const | 278 | no | const text = event.text ? truncate(String(event.text), 400) : &quot;&quot;; |
| summary | variable | 279 | no | let summary = summarize(event.data); |
| aggregateEntry | function | 291 | no | function aggregateEntry(total, samples) { |
| tally | const | 292 | no | const tally = {}; |
| parts | const | 297 | no | const parts = []; |
| ts | const | 302 | no | const ts = samples.length ? samples[samples.length - 1].ts : serverNow(); |
| planEntry | function | 313 | no | function planEntry(plan) { |
| steps | const | 314 | no | const steps = plan.steps \|\| []; |
| labels | const | 315 | no | const labels = []; |
| summary | variable | 319 | no | let summary = plan.id + &quot; · &quot; + steps.length + &quot; step&quot; + (steps.length === 1 ? &quot;&quot; : &quot;s&quot;); |
| userEntry | function | 331 | no | function userEntry(text) { |
| deriveRun | function | 335 | no | function deriveRun(event) { |
| data | const | 337 | no | const data = event.data \|\| {}; |
| next | variable | 338 | no | let next = null; |
| onHello | function | 369 | no | function onHello(snapshot) { |
| snap | const | 370 | no | const snap = snapshot \|\| {}; |
| counters | const | 381 | no | const counters = snap.counters \|\| {}; |
| recent | const | 402 | no | const recent = snap.recent \|\| []; |
| noisy | variable | 403 | no | let noisy = 0; |
| samples | const | 404 | no | const samples = []; |
| event | const | 406 | no | const event = recent[i]; |
| setHotpath | function | 419 | no | function setHotpath(hotpath) { |
| flushPending | function | 440 | no | function flushPending() { |
| messages | const | 442 | no | const messages = pending; |
| noisy | variable | 445 | no | let noisy = 0; |
| samples | const | 446 | no | const samples = []; |
| flushNoise | function | 448 | no | function flushNoise() { |
| message | const | 456 | no | const message = messages[i]; |
| event | const | 460 | no | const event = message.event; |
| bumpAt | const | 522 | no | const bumpAt = {}; |
| setCounter | function | 524 | no | function setCounter(node, value) { |
| text | const | 525 | no | const text = fmtNum(value); |
| now | const | 528 | no | const now = performance.now(); |
| lastSlowTick | variable | 542 | no | let lastSlowTick = -1e6; |
| updateSlowReadouts | function | 544 | no | function updateSlowReadouts(now) { |
| frame | const | 550 | no | const frame = state.lastFrame; |
| rate | const | 552 | no | const rate = fmtCompact(frame.rate) + &quot;/s&quot;; |
| p95 | const | 555 | no | const p95 = fmtUs(frame.p95GapUs); |
| drops | const | 558 | no | const drops = fmtNum(frame.drops); |
| seq | const | 560 | no | const seq = fmtNum(frame.seq); |
| flow | const | 563 | no | const flow = &quot;FLOW &quot; + rate; |
| total | const | 570 | no | const total = board.total(); |
| active | const | 571 | no | const active = board.activeCount(); |
| label | const | 572 | no | const label = total + (total === 1 ? &quot; run&quot; : &quot; runs&quot;) + (active ? &quot; · &quot; + active + &quot; active&quot; : &quot;&quot;); |
| uptime | const | 585 | no | const uptime = fmtDur(Math.max(0, serverNow() - state.startedAt)); |
| submitChat | function | 604 | no | function submitChat() { |
| raw | const | 605 | no | const raw = ui.chat.value; |
| text | const | 606 | no | const text = raw.replace(/\\s+$/, &quot;&quot;); |
| key | const | 661 | no | const key = (event.key \|\| &quot;&quot;).toLowerCase(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./lib/palette.js | import | 11 | [packages/tierflow/web/lib/palette.js](./lib/palette.js.md) |
| ./lib/format.js | import | 12 | [packages/tierflow/web/lib/format.js](./lib/format.js.md) |
| ./lib/topology.js | import | 13 | [packages/tierflow/web/lib/topology.js](./lib/topology.js.md) |
| ./lib/timeline.js | import | 14 | [packages/tierflow/web/lib/timeline.js](./lib/timeline.js.md) |
| ./lib/transcript.js | import | 15 | [packages/tierflow/web/lib/transcript.js](./lib/transcript.js.md) |
| ./lib/runboard.js | import | 16 | [packages/tierflow/web/lib/runboard.js](./lib/runboard.js.md) |
| ./world.js | import | 17 | [packages/tierflow/web/world.js](./world.js.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 689 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

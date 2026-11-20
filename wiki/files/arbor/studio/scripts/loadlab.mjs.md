# File: studio/scripts/loadlab.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/loadlab.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 89509 B |
| Lines | 1956 |
| Hash | 9267c4be1983 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| require | const | 67 | no | const require = createRequire(import.meta.url); |
| fs | const | 68 | no | const fs = require(&#39;node:fs&#39;); |
| os | const | 69 | no | const os = require(&#39;node:os&#39;); |
| path | const | 70 | no | const path = require(&#39;node:path&#39;); |
| crypto | const | 71 | no | const crypto = require(&#39;node:crypto&#39;); |
| SELF | const | 74 | no | const SELF = path.resolve(process.argv[1] ?? &#39;&#39;); |
| SCRIPT_PATH | const | 75 | no | const SCRIPT_PATH = path.resolve(fileURLToPath(import.meta.url)); |
| IS_MAIN | const | 79 | no | const IS_MAIN = SCRIPT_PATH.toLowerCase() === SELF.toLowerCase(); |
| SCHEMA | const | 80 | no | const SCHEMA = &#39;aion-capture-studio.loadlab/1&#39;; |
| MAX_MB | const | 81 | no | const MAX_MB = 512; |
| MAX_REPEATS | const | 82 | no | const MAX_REPEATS = 50; |
| RAW_FLUSH_BATCH_BYTES | const | 85 | no | const RAW_FLUSH_BATCH_BYTES = 4 * 1024 * 1024; |
| LAYERS | const | 90 | no | const LAYERS = { |
| PROBE_FNS | const | 125 | no | const PROBE_FNS = [&#39;writeSync&#39;, &#39;fsyncSync&#39;, &#39;fdatasyncSync&#39;, &#39;appendFileSync&#39;, &#39;writeFileSync&#39;, &#39;renameSync&#39;, &#39;mkdirSync&#39;, &#39;openSync&#39;, &#39;closeSync&#39;, &#39;readFileSync&#39;]; |
| installFsProbe | function | 127 | no | function installFsProbe() { |
| counts | const | 128 | no | const counts = {}; |
| patched | const | 129 | no | const patched = {}; |
| orig | const | 131 | no | const orig = fs[name]; |
| wrapped | function | 133 | no | const wrapped = function (...args) { |
| DEFAULTS | const | 146 | no | const DEFAULTS = { mb: 64, chunkKb: 64, streams: 4, domRows: 2000, seed: 1337, repeats: 5, scenario: &#39;saturation&#39;, rateKbps: 40, durationS: 20, burstMb: 6 }; |
| MAX_CHAT_DURATION_S | const | 147 | no | const MAX_CHAT_DURATION_S = 120; |
| CHAT_TARGETS | const | 150 | no | const CHAT_TARGETS = { eventLoopP99Ms: 50, longestStallMs: 100, queueAgeP99Ms: 100 }; |
| usage | function | 152 | no | function usage() { |
| parseArgs | function | 178 | no | function parseArgs(argv) { |
| cfg | const | 179 | no | const cfg = { ...DEFAULTS, json: false, out: null, keep: false, help: false, worker: false, mode: null, profile: false }; |
| num | function | 180 | no | const num = (v, name) =&gt; { |
| n | const | 181 | no | const n = Number(v); |
| a | const | 186 | no | const a = argv[i]; |
| next | function | 187 | no | const next = () =&gt; { |
| v | const | 188 | no | const v = argv[++i]; |
| WORDS | const | 243 | no | const WORDS = [&#39;alpha&#39;, &#39;bravo&#39;, &#39;charlie&#39;, &#39;delta&#39;, &#39;echo&#39;, &#39;foxtrot&#39;, &#39;golf&#39;, &#39;hotel&#39;, &#39;india&#39;, &#39;juliet&#39;, &#39;kilo&#39;, &#39;lima&#39;, &#39;mike&#39;, &#39;november&#39;, &#39;oscar&#39;, &#39;papa&#39;, &#39;quebec&#39;, &#39;romeo&#39;, &#39;sierra&#39;, &#39;tango&#39;]; |
| mulberry32 | function | 245 | no | function mulberry32(seed) { |
| a | variable | 246 | no | let a = seed &gt;&gt;&gt; 0; |
| t | variable | 249 | no | let t = Math.imul(a ^ (a &gt;&gt;&gt; 15), 1 \| a); |
| byteSource | function | 265 | no | function byteSource(kind, rand, budget) { |
| doc | const | 267 | no | const doc = buildDocument(rand, budget); |
| off | variable | 268 | no | let off = 0; |
| n | const | 275 | no | const n = Math.min(size, doc.length - off); |
| out | const | 276 | no | const out = Buffer.from(doc.subarray(off, off + n)); |
| pending | variable | 283 | no | let pending = Buffer.alloc(0); |
| produced | variable | 284 | no | let produced = 0; |
| item | variable | 285 | no | let item = 0; |
| first | variable | 286 | no | let first = true; |
| nextUnit | function | 288 | no | const nextUnit = () =&gt; { |
| n | const | 289 | no | const n = String(item++).padStart(6, &#39;0&#39;); |
| v | const | 290 | no | const v = Math.floor(rand() * 100000); |
| t | const | 291 | no | const t = WORDS[Math.floor(rand() * WORDS.length)]; |
| w | function | 293 | no | const w = () =&gt; WORDS[Math.floor(rand() * WORDS.length)]; |
| sep | const | 302 | no | const sep = first ? &#39;&#39; : &#39;&#39;; |
| out | const | 313 | no | const out = Buffer.allocUnsafe(size); |
| off | variable | 314 | no | let off = 0; |
| take | const | 317 | no | const take = Math.min(size - off, pending.length); |
| buildDocument | function | 330 | no | function buildDocument(rand, budget) { |
| parts | const | 332 | no | const parts = []; |
| skeleton | const | 334 | no | const skeleton = `{${parts.join(&#39;,&#39;)}}`; |
| padLen | const | 335 | no | const padLen = budget - skeleton.length - 2; // the two quote characters of the pad value |
| doc | const | 338 | no | const doc = `{${parts.join(&#39;,&#39;)}}`; |
| head | const | 343 | no | const head = &#39;{&quot;pad&quot;:&quot;&#39;; |
| tail | const | 344 | no | const tail = &#39;&quot;}&#39;; |
| padLen | const | 345 | no | const padLen = Math.max(0, budget - head.length - tail.length); |
| FakeCdpSocket | class | 356 | no | class FakeCdpSocket { |
| constructor | method | 357 | yes | constructor(handlers = {}) { |
| addEventListener | method | 364 | yes | addEventListener(type, fn) { |
| removeEventListener | method | 369 | yes | removeEventListener(type, fn) { |
| _emit | method | 373 | yes | _emit(type, ev) { |
| send | method | 377 | yes | send(text) { |
| msg | const | 379 | no | const msg = JSON.parse(text); |
| result | const | 380 | no | const result = this.handlers[msg.method]?.(msg.params ?? {}) ?? {}; |
| reply | const | 381 | no | const reply = { id: msg.id, result }; |
| deliver | method | 385 | yes | deliver(obj) { |
| close | method | 389 | yes | close() { |
| CDP_HANDLERS | const | 396 | no | const CDP_HANDLERS = { |
| runScenario | function | 418 | no | async function runScenario({ mode, cfg }) { |
| probe | const | 419 | no | const probe = installFsProbe(); |
| warnings | const | 420 | no | const warnings = []; |
| capture | const | 421 | no | const capture = mode === &#39;capture&#39;; |
| esmFs | const | 438 | no | const esmFs = await import(&#39;node:fs&#39;); |
| tmpRoot | const | 442 | no | const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), &#39;cs-loadlab-&#39;)); |
| safeTmp | const | 443 | no | const safeTmp = path.resolve(os.tmpdir()); |
| profile | const | 447 | no | const profile = normalizeProfile({ name: &#39;loadlab&#39;, capture: { websockets: false, retrospectiveFallback: true }, dom: { enabled: true, flushMs: 100 }, }); |
| pageUrl | const | 453 | no | const pageUrl = &#39;https://lab.invalid/&#39;; |
| rand | const | 454 | no | const rand = mulberry32(cfg.seed); |
| totalBytes | const | 457 | no | const totalBytes = Math.round(cfg.mb * 1024 * 1024); |
| chunkBytes | const | 458 | no | const chunkBytes = Math.round(cfg.chunkKb * 1024); |
| nStreams | const | 459 | no | const nStreams = cfg.streams; |
| documentBudget | const | 462 | no | const documentBudget = Math.min(4 * 1024 * 1024, Math.floor(totalBytes / nStreams)); |
| otherCount | const | 463 | no | const otherCount = Math.max(1, nStreams - (nStreams &gt;= 4 ? 1 : 0)); |
| otherBudget | const | 464 | no | const otherBudget = Math.floor((totalBytes - documentBudget) / otherCount); |
| shapes | const | 465 | no | const shapes = [&#39;sse&#39;, &#39;json&#39;, &#39;ndjson&#39;, &#39;document&#39;]; |
| streams | const | 466 | no | const streams = []; |
| isDocument | const | 468 | no | const isDocument = nStreams &gt;= 4 &amp;&amp; i === nStreams - 1; |
| budget | const | 469 | no | const budget = isDocument ? documentBudget : otherBudget; |
| kind | const | 470 | no | const kind = isDocument ? &#39;document&#39; : shapes[i % 3]; |
| mime | const | 471 | no | const mime = kind === &#39;sse&#39; ? &#39;text/event-stream&#39; : kind === &#39;ndjson&#39; ? &#39;application/x-ndjson&#39; : &#39;application/json&#39;; |
| recorder | variable | 488 | no | let recorder = null; |
| session | variable | 489 | no | let session = null; |
| dom | variable | 490 | no | let dom = null; |
| socket | variable | 491 | no | let socket = null; |
| cdpSession | variable | 492 | no | let cdpSession = null; |
| append | function | 523 | no | const append = (rec) =&gt; recorder._append(rec); |
| conn | const | 541 | no | const conn = new CdpConnection(socket, { requestTimeoutMs: 0, url: &#39;ws://127.0.0.1:0/loadlab&#39; }); |
| statusTicks | variable | 551 | no | let statusTicks = 0; |
| persistTicks | variable | 552 | no | let persistTicks = 0; |
| statusTimer | const | 553 | no | const statusTimer = capture ? setInterval(() =&gt; { try { recorder.emit(&#39;status&#39;, recorder.status()); statusTicks++; } catch (e) { warnings.push(`status timer: ${e?.message ?? e}`); } }, 1000) : null; |
| persistTimer | const | 556 | no | const persistTimer = capture ? setInterval(() =&gt; { try { recorder._persist(); persistTicks++; } catch (e) { warnings.push(`persist timer: ${e?.message ?? e}`); } }, 5000) : null; |
| hist | const | 564 | no | const hist = monitorEventLoopDelay({ resolution: 10 }); |
| datasetPushes | variable | 567 | no | let datasetPushes = 0; |
| ds | const | 569 | no | const ds = recorder.eventsDs; |
| origPush | const | 570 | no | const origPush = ds.push.bind(ds); |
| rawFlushBatches | variable | 573 | no | let rawFlushBatches = 0; |
| queueAgesMs | const | 582 | no | const queueAgesMs = []; |
| queueAgeArmed | variable | 583 | no | let queueAgeArmed = false; |
| queueFlushSamples | variable | 584 | no | let queueFlushSamples = 0; |
| queuePeakBytesSeen | variable | 585 | no | let queuePeakBytesSeen = 0; |
| raw | const | 587 | no | const raw = session.raw; |
| origFlush | const | 588 | no | const origFlush = raw.flush.bind(raw); |
| now | const | 591 | no | const now = Date.now(); |
| batchBytes | variable | 592 | no | let batchBytes = 0; |
| r | const | 594 | no | const r = raw.queue[i]; |
| maxFrame | const | 606 | no | const maxFrame = { ms: 0, method: null, kind: null, frame: null }; |
| slowestFrames | const | 607 | no | const slowestFrames = []; |
| cdpFrames | variable | 608 | no | let cdpFrames = 0; |
| dataFrames | variable | 609 | no | let dataFrames = 0; |
| controlFrames | variable | 610 | no | let controlFrames = 0; |
| domFrames | variable | 611 | no | let domFrames = 0; |
| rssStart | const | 613 | no | const rssStart = process.memoryUsage().rss; |
| rssPeak | variable | 614 | no | let rssPeak = rssStart; |
| tick | function | 615 | no | const tick = () =&gt; new Promise((r) =&gt; setImmediate(r)); |
| deliver | function | 617 | no | const deliver = (obj, method, kind = null) =&gt; { |
| t0 | const | 618 | no | const t0 = process.hrtime.bigint(); |
| dt | const | 620 | no | const dt = Number(process.hrtime.bigint() - t0) / 1e6; |
| t0 | const | 629 | no | const t0 = process.hrtime.bigint(); |
| domBatchRows | const | 678 | no | const domBatchRows = 100; |
| domBatches | const | 679 | no | const domBatches = Math.ceil(cfg.domRows / domBatchRows); |
| domRowsSent | variable | 680 | no | let domRowsSent = 0; |
| domBatchIndex | variable | 681 | no | let domBatchIndex = 0; |
| emitDomBatch | function | 683 | no | const emitDomBatch = () =&gt; { |
| rows | const | 684 | no | const rows = Math.min(domBatchRows, cfg.domRows - domRowsSent); |
| items | const | 686 | no | const items = []; |
| n | const | 688 | no | const n = domRowsSent + i; |
| active | const | 707 | no | const active = streams.filter((s) =&gt; s.budget &gt; 0); |
| chunkIndex | variable | 708 | no | let chunkIndex = 0; |
| domEvery | const | 709 | no | const domEvery = Math.max(1, Math.ceil(active.reduce((a, s) =&gt; a + Math.ceil(s.budget / chunkBytes), 0) / Math.max(1, domBatches))); |
| s | const | 712 | no | const s = active[i]; |
| want | const | 713 | no | const want = Math.min(chunkBytes, s.budget - s.bytesEmitted); |
| buf | const | 715 | no | const buf = s.source.next(want); |
| wallMs | const | 755 | no | const wallMs = Number(process.hrtime.bigint() - t0) / 1e6; |
| integrity | variable | 771 | no | let integrity = null; |
| perStream | const | 772 | no | const perStream = []; |
| bytesEqual | variable | 773 | no | let bytesEqual = null; |
| rawBytes | variable | 774 | no | let rawBytes = 0; |
| reassembledSha | const | 782 | no | const reassembledSha = crypto.createHash(&#39;sha256&#39;).update(bytes).digest(&#39;hex&#39;); |
| emittedSha | const | 783 | no | const emittedSha = s.hash.digest(&#39;hex&#39;); |
| counters | const | 799 | no | const counters = { |
| delay | const | 824 | no | const delay = { |
| syncFs | const | 834 | no | const syncFs = { |
| result | const | 842 | no | const result = { |
| round3 | function | 894 | no | function round3(n) { |
| percentile | function | 910 | yes | export function percentile(values, p) { |
| xs | const | 911 | no | const xs = values.filter(Number.isFinite).sort((a, b) =&gt; a - b); |
| h | const | 913 | no | const h = (xs.length - 1) * (p / 100); |
| lo | const | 914 | no | const lo = Math.floor(h); |
| hi | const | 915 | no | const hi = Math.ceil(h); |
| median | function | 919 | yes | export function median(values) { |
| summarize | function | 923 | yes | export function summarize(values) { |
| xs | const | 924 | no | const xs = values.filter(Number.isFinite); |
| n | const | 925 | no | const n = xs.length; |
| mean | const | 927 | no | const mean = xs.reduce((a, b) =&gt; a + b, 0) / n; |
| cv | variable | 928 | no | let cv = null; |
| variance | const | 930 | no | const variance = xs.reduce((a, b) =&gt; a + (b - mean) ** 2, 0) / (n - 1); |
| CHAT | const | 960 | no | const CHAT = { |
| CHAT_PAGE_URL | const | 971 | no | const CHAT_PAGE_URL = &#39;https://lab.invalid/&#39;; |
| planChatWorkload | function | 973 | yes | export function planChatWorkload({ seed = DEFAULTS.seed, durationS = DEFAULTS.durationS, rateKbps = DEFAULTS.rateKbps, burstMb = DEFAULTS.burstMb, |
| durationMs | const | 980 | no | const durationMs = Math.round(durationS * 1000); |
| bytesPerMs | const | 981 | no | const bytesPerMs = (rateKbps * 1024) / 1000; |
| rPlan | const | 984 | no | const rPlan = mulberry32(seed); |
| rText | const | 985 | no | const rText = mulberry32(seed + 1); |
| rBurst | const | 986 | no | const rBurst = mulberry32(seed + 2); |
| rBg | const | 987 | no | const rBg = mulberry32(seed + 3); |
| streams | const | 989 | no | const streams = []; |
| hashes | const | 990 | no | const hashes = new Map(); |
| events | const | 991 | no | const events = []; |
| pushEvent | function | 992 | no | const pushEvent = (atMs, ev) =&gt; { events.push({ ...ev, atMs, seq: events.length }); }; |
| makeStream | function | 993 | no | const makeStream = (role, kind, mime, requestId, url) =&gt; { |
| s | const | 994 | no | const s = { index: streams.length, role, kind, mime, requestId, sid: `p:${requestId}`, url, budget: 0, chunks: 0, finishAtMs: 0 }; |
| openStream | function | 999 | no | const openStream = (s, atMs) =&gt; { |
| addChunk | function | 1030 | no | const addChunk = (s, atMs, buf) =&gt; { |
| sseSizes | const | 1045 | no | const sseSizes = []; |
| size | const | 1047 | no | const size = CHAT.sseChunkMin + Math.floor(rPlan() * (CHAT.sseChunkMax - CHAT.sseChunkMin + 1)); |
| sseTotal | const | 1051 | no | const sseTotal = sseSizes.reduce((a, c) =&gt; a + c.size, 0); |
| sseText | variable | 1052 | no | let sseText = &#39;event: message_start\\ndata: {&quot;type&quot;:&quot;message_start&quot;}\\n\\n&#39;; |
| w | function | 1054 | no | const w = () =&gt; WORDS[Math.floor(rText() * WORDS.length)]; |
| sseBytes | const | 1057 | no | const sseBytes = Buffer.from(sseText, &#39;utf8&#39;); |
| sse | const | 1058 | no | const sse = makeStream(&#39;sse&#39;, &#39;sse&#39;, &#39;text/event-stream&#39;, &#39;lab-chat-sse&#39;, &#39;https://lab.invalid/api/chat/completion&#39;); |
| sseOff | variable | 1060 | no | let sseOff = 0; |
| s | const | 1069 | no | const s = makeStream(&#39;analytics&#39;, &#39;ndjson&#39;, &#39;application/x-ndjson&#39;, `lab-chat-bg-${i}`, `https://lab.invalid/collect/analytics-${i}`); |
| k | variable | 1071 | no | let k = 0; |
| burstAtMs | const | 1081 | no | const burstAtMs = Math.round(durationMs * CHAT.burstFraction); |
| burstBytes | const | 1082 | no | const burstBytes = Math.round(burstMb * 1024 * 1024); |
| burst | const | 1083 | no | const burst = makeStream(&#39;burst&#39;, &#39;document&#39;, &#39;application/json&#39;, &#39;lab-chat-burst&#39;, &#39;https://lab.invalid/api/conversations/history&#39;); |
| doc | const | 1085 | no | const doc = buildDocument(rBurst, burstBytes); |
| domCount | const | 1092 | no | const domCount = Math.floor((durationMs * CHAT.domHz) / 1000); |
| start | const | 1094 | no | const start = Math.floor((domRows * k) / domCount); |
| items | const | 1097 | no | const items = []; |
| sumWhere | function | 1126 | no | const sumWhere = (pred) =&gt; streams.filter(pred).reduce((a, s) =&gt; a + s.budget, 0); |
| withinTarget | function | 1158 | no | function withinTarget(value, limit) { |
| runChatScenario | function | 1162 | no | async function runChatScenario({ mode, cfg }) { |
| probe | const | 1163 | no | const probe = installFsProbe(); |
| warnings | const | 1164 | no | const warnings = []; |
| capture | const | 1165 | no | const capture = mode === &#39;capture&#39;; |
| esmFs | const | 1179 | no | const esmFs = await import(&#39;node:fs&#39;); |
| tmpRoot | const | 1183 | no | const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), &#39;cs-loadlab-&#39;)); |
| safeTmp | const | 1184 | no | const safeTmp = path.resolve(os.tmpdir()); |
| profile | const | 1188 | no | const profile = normalizeProfile({ name: &#39;loadlab&#39;, capture: { websockets: false, retrospectiveFallback: true }, dom: { enabled: true, flushMs: 100 }, }); |
| plan | const | 1195 | no | const plan = planChatWorkload({ seed: cfg.seed, durationS: cfg.durationS, rateKbps: cfg.rateKbps, burstMb: cfg.burstMb, domRows: cfg.domRows }); |
| recorder | variable | 1198 | no | let recorder = null; |
| session | variable | 1199 | no | let session = null; |
| dom | variable | 1200 | no | let dom = null; |
| append | function | 1221 | no | const append = (rec) =&gt; recorder._append(rec); |
| socket | const | 1231 | no | const socket = new FakeCdpSocket(CDP_HANDLERS); |
| conn | const | 1232 | no | const conn = new CdpConnection(socket, { requestTimeoutMs: 0, url: &#39;ws://127.0.0.1:0/loadlab&#39; }); |
| cdpSession | const | 1233 | no | const cdpSession = await conn.attach(&#39;LAB-TARGET&#39;); |
| statusTicks | variable | 1239 | no | let statusTicks = 0; |
| persistTicks | variable | 1240 | no | let persistTicks = 0; |
| statusTimer | const | 1241 | no | const statusTimer = capture ? setInterval(() =&gt; { try { recorder.emit(&#39;status&#39;, recorder.status()); statusTicks++; } catch (e) { warnings.push(`status timer: ${e?.message ?? e}`); } }, 1000) : null; |
| persistTimer | const | 1244 | no | const persistTimer = capture ? setInterval(() =&gt; { try { recorder._persist(); persistTicks++; } catch (e) { warnings.push(`persist timer: ${e?.message ?? e}`); } }, 5000) : null; |
| hist | const | 1251 | no | const hist = monitorEventLoopDelay({ resolution: 10 }); |
| datasetPushes | variable | 1254 | no | let datasetPushes = 0; |
| rawFlushBatches | variable | 1255 | no | let rawFlushBatches = 0; |
| ds | const | 1257 | no | const ds = recorder.eventsDs; |
| origPush | const | 1258 | no | const origPush = ds.push.bind(ds); |
| queueAgesMs | const | 1264 | no | const queueAgesMs = []; |
| queueAgeArmed | variable | 1265 | no | let queueAgeArmed = false; |
| queueFlushSamples | variable | 1266 | no | let queueFlushSamples = 0; |
| queuePeakBytesSeen | variable | 1267 | no | let queuePeakBytesSeen = 0; |
| raw | const | 1269 | no | const raw = session.raw; |
| origFlush | const | 1270 | no | const origFlush = raw.flush.bind(raw); |
| now | const | 1273 | no | const now = Date.now(); |
| batchBytes | variable | 1274 | no | let batchBytes = 0; |
| r | const | 1276 | no | const r = raw.queue[i]; |
| t0 | variable | 1291 | no | let t0 = process.hrtime.bigint(); |
| nowMs | function | 1292 | no | const nowMs = () =&gt; Number(process.hrtime.bigint() - t0) / 1e6; |
| probeDue | variable | 1293 | no | let probeDue = 0; |
| probeTimer | variable | 1294 | no | let probeTimer = null; |
| probing | variable | 1295 | no | let probing = false; |
| longest | variable | 1296 | no | let longest = { ms: 0, startMs: null, endMs: null }; |
| stalls | const | 1297 | no | const stalls = []; |
| probeTick | function | 1298 | no | const probeTick = () =&gt; { |
| now | const | 1300 | no | const now = nowMs(); |
| late | const | 1301 | no | const late = now - probeDue; |
| st | const | 1303 | no | const st = { ms: round3(late), startMs: round3(probeDue), endMs: round3(now) }; |
| tick | function | 1313 | no | const tick = () =&gt; new Promise((r) =&gt; setImmediate(r)); |
| sleepFor | function | 1314 | no | const sleepFor = (ms) =&gt; new Promise((r) =&gt; setTimeout(r, ms)); |
| streamState | const | 1315 | no | const streamState = new Map(plan.streams.map((s) =&gt; [s.index, { hash: crypto.createHash(&#39;sha256&#39;), bytes: 0, chunks: 0 }])); |
| maxFrame | const | 1316 | no | const maxFrame = { ms: 0, method: null, kind: null, frame: null }; |
| cdpFrames | variable | 1317 | no | let cdpFrames = 0; |
| dataFrames | variable | 1318 | no | let dataFrames = 0; |
| controlFrames | variable | 1319 | no | let controlFrames = 0; |
| domFrames | variable | 1320 | no | let domFrames = 0; |
| domRowsSent | variable | 1321 | no | let domRowsSent = 0; |
| domBatchIndex | variable | 1322 | no | let domBatchIndex = 0; |
| burstFrames | variable | 1323 | no | let burstFrames = 0; |
| burstStartMs | variable | 1324 | no | let burstStartMs = null; |
| burstEndMs | variable | 1325 | no | let burstEndMs = null; |
| rssStart | const | 1326 | no | const rssStart = process.memoryUsage().rss; |
| rssPeak | variable | 1327 | no | let rssPeak = rssStart; |
| send | function | 1329 | no | const send = (ev) =&gt; { |
| isDom | const | 1330 | no | const isDom = ev.kind === &#39;dom&#39;; |
| startedAt | const | 1331 | no | const startedAt = nowMs(); |
| t1 | const | 1332 | no | const t1 = process.hrtime.bigint(); |
| dt | const | 1338 | no | const dt = Number(process.hrtime.bigint() - t1) / 1e6; |
| st | const | 1342 | no | const st = streamState.get(ev.stream); |
| wait | const | 1370 | no | const wait = ev.atMs - nowMs(); |
| wallMs | const | 1378 | no | const wallMs = nowMs(); |
| integrity | variable | 1391 | no | let integrity = null; |
| perStream | const | 1392 | no | const perStream = []; |
| bytesEqual | variable | 1393 | no | let bytesEqual = null; |
| rawBytes | variable | 1394 | no | let rawBytes = 0; |
| st | const | 1400 | no | const st = streamState.get(s.index); |
| reassembledSha | const | 1402 | no | const reassembledSha = crypto.createHash(&#39;sha256&#39;).update(bytes).digest(&#39;hex&#39;); |
| emittedSha | const | 1403 | no | const emittedSha = st.hash.digest(&#39;hex&#39;); |
| bytesEmitted | const | 1419 | no | const bytesEmitted = [...streamState.values()].reduce((a, st) =&gt; a + st.bytes, 0); |
| sseBytesEmitted | const | 1420 | no | const sseBytesEmitted = plan.streams.filter((s) =&gt; s.role === &#39;sse&#39;).reduce((a, s) =&gt; a + streamState.get(s.index).bytes, 0); |
| seconds | const | 1421 | no | const seconds = wallMs / 1000; |
| stallsTop | const | 1422 | no | const stallsTop = [...stalls].sort((a, b) =&gt; b.ms - a.ms).slice(0, CHAT.keptStalls); |
| relToBurst | function | 1423 | no | const relToBurst = (ms) =&gt; (burstStartMs === null \|\| ms === null \|\| ms === undefined ? null : round3(ms - burstStartMs)); |
| burstStartRel | const | 1424 | no | const burstStartRel = burstStartMs === null ? null : round3(burstStartMs); |
| burstEndRel | const | 1425 | no | const burstEndRel = burstEndMs === null ? null : round3(burstEndMs); |
| counters | const | 1427 | no | const counters = { |
| delay | const | 1450 | no | const delay = { |
| syncFs | const | 1460 | no | const syncFs = { |
| result | const | 1468 | no | const result = { |
| buildChatReport | function | 1543 | no | function buildChatReport(cfg, scenarios) { |
| captureRuns | const | 1544 | no | const captureRuns = scenarios.filter((s) =&gt; s.mode === &#39;capture&#39;); |
| baselineRuns | const | 1545 | no | const baselineRuns = scenarios.filter((s) =&gt; s.mode === &#39;baseline&#39;); |
| med | function | 1546 | no | const med = (runs, f) =&gt; summarize(runs.map(f)); |
| modeSummary | function | 1547 | no | const modeSummary = (runs, isCapture) =&gt; ({ runs: runs.length, eventLoopP50Ms: med(runs, (s) =&gt; s.eventLoopDelayMs.p50), eventLoopP99Ms: med(runs, (s) =&gt; s.eventLoopDelayMs.p99), eventLoopMaxMs: med(… |
| summary | const | 1573 | no | const summary = { capture: modeSummary(captureRuns, true), baseline: modeSummary(baselineRuns, false) }; |
| verdictFor | function | 1574 | no | const verdictFor = (m, isCapture) =&gt; { |
| T | const | 1575 | no | const T = CHAT_TARGETS; |
| checks | const | 1576 | no | const checks = { |
| within | function | 1581 | no | const within = (r) =&gt; withinTarget(r.eventLoopP99Ms, T.eventLoopP99Ms) |
| chatTable | function | 1629 | no | function chatTable(report) { |
| fmt | function | 1630 | no | const fmt = (v, d = 2) =&gt; (v === null \|\| v === undefined \|\| !Number.isFinite(Number(v)) ? &#39;n/a&#39; : Number(v).toFixed(d)); |
| cell | function | 1631 | no | const cell = (v, n) =&gt; String(v).padStart(n); |
| head | const | 1632 | no | const head = [ |
| rows | const | 1637 | no | const rows = [head, &#39;-&#39;.repeat(head.length)]; |
| q | const | 1639 | no | const q = s.queue; |
| rel | const | 1640 | no | const rel = s.longestStall.relativeToBurstStartMs; |
| v | const | 1658 | no | const v = report.verdict; |
| x | const | 1669 | no | const x = v[key]; |
| parts | const | 1670 | no | const parts = Object.entries(x.checks).map(([k, ok]) =&gt; `${k} ${ok ? &#39;met&#39; : &#39;missed&#39;}`).join(&#39;, &#39;); |
| T | const | 1673 | no | const T = report.targets; |
| runWorker | function | 1683 | no | function runWorker(mode, cfg) { |
| args | const | 1684 | no | const args = [SELF, &#39;--worker&#39;, &#39;--mode&#39;, mode, &#39;--mb&#39;, String(cfg.mb), &#39;--chunk&#39;, String(cfg.chunkKb), |
| profileDir | variable | 1690 | no | let profileDir = null; |
| res | const | 1697 | no | const res = spawnSync(process.execPath, args, { encoding: &#39;utf8&#39;, maxBuffer: 32 * 1024 * 1024 }); |
| summary | const | 1700 | no | const summary = summarizeProfile(profileDir); |
| line | const | 1709 | no | const line = (res.stdout \|\| &#39;&#39;).trim().split(&#39;\\n&#39;).filter(Boolean).at(-1); |
| scenario | variable | 1711 | no | let scenario; |
| summarizeProfile | function | 1723 | no | function summarizeProfile(dir) { |
| files | variable | 1724 | no | let files = []; |
| prof | const | 1727 | no | const prof = JSON.parse(fs.readFileSync(path.join(dir, files[0]), &#39;utf8&#39;)); |
| byId | const | 1728 | no | const byId = new Map(prof.nodes.map((n) =&gt; [n.id, n])); |
| self | const | 1729 | no | const self = new Map(); |
| id | const | 1731 | no | const id = prof.samples[i]; |
| dt | const | 1732 | no | const dt = prof.timeDeltas?.[i] ?? 0; |
| agg | const | 1735 | no | const agg = new Map(); |
| n | const | 1737 | no | const n = byId.get(id); |
| cf | const | 1739 | no | const cf = n.callFrame; |
| file | const | 1740 | no | const file = (cf.url \|\| &#39;&#39;).split(/[\\\\/]/).slice(-2).join(&#39;/&#39;); |
| key | const | 1741 | no | const key = `${cf.functionName \|\| &#39;(anonymous)&#39;} @ ${file}:${(cf.lineNumber ?? 0) + 1}`; |
| total | const | 1744 | no | const total = [...agg.values()].reduce((a, b) =&gt; a + b, 0); |
| representativeRun | function | 1754 | no | function representativeRun(list) { |
| sorted | const | 1756 | no | const sorted = [...list].sort((a, b) =&gt; (a.eventLoopDelayMs.p99 ?? 0) - (b.eventLoopDelayMs.p99 ?? 0)); |
| repeatStats | function | 1760 | no | function repeatStats(list) { |
| out | const | 1761 | no | const out = { |
| buildReport | function | 1774 | no | function buildReport(cfg, scenarios) { |
| captureRuns | const | 1775 | no | const captureRuns = scenarios.filter((s) =&gt; s.mode === &#39;capture&#39;); |
| baselineRuns | const | 1776 | no | const baselineRuns = scenarios.filter((s) =&gt; s.mode === &#39;baseline&#39;); |
| capture | const | 1777 | no | const capture = representativeRun(captureRuns); |
| baseline | const | 1778 | no | const baseline = representativeRun(baselineRuns); |
| cP99 | const | 1779 | no | const cP99 = summarize(captureRuns.map((s) =&gt; s.eventLoopDelayMs.p99)); |
| bP99 | const | 1780 | no | const bP99 = summarize(baselineRuns.map((s) =&gt; s.eventLoopDelayMs.p99)); |
| p99Delta | const | 1781 | no | const p99Delta = cP99.median === null \|\| bP99.median === null ? null : round3(cP99.median - bP99.median); |
| d | function | 1782 | no | const d = (a, b) =&gt; (a === null \|\| a === undefined \|\| b === null \|\| b === undefined ? null : round3(a - b)); |
| threshold | const | 1783 | no | const threshold = 50; |
| over | function | 1784 | no | const over = (s) =&gt; !!s &amp;&amp; s.eventLoopDelayMs.p99 !== null &amp;&amp; s.eventLoopDelayMs.p99 &gt; threshold; |
| table | function | 1837 | no | function table(report) { |
| rows | const | 1838 | no | const rows = []; |
| pad | function | 1839 | no | const pad = (v, n, right = true) =&gt; { |
| s | const | 1840 | no | const s = String(v); |
| head | const | 1843 | no | const head = [ |
| d | const | 1864 | no | const d = report.delta; |
| fmt | function | 1870 | no | const fmt = (v, d = 2) =&gt; (v === null \|\| v === undefined ? &#39;n/a&#39; : Number(v).toFixed(d)); |
| line | function | 1871 | no | const line = (label, s, unit, d = 2) =&gt; ` ${label.padEnd(30)} median ${fmt(s.median, d)} p95 ${fmt(s.p95, d)} min ${fmt(s.min, d)} max ${fmt(s.max, d)} CV ${s.cv === null ? &#39;n/a&#39; : (s.cv * 100).toFix… |
| rs | const | 1872 | no | const rs = report.repeats; |
| st | const | 1877 | no | const st = rs.stats[mode]; |
| tag | const | 1878 | no | const tag = mode === &#39;capture&#39; ? &#39;capture ON &#39; : &#39;baseline OFF&#39;; |
| c | const | 1888 | no | const c = rs.comparison; |
| c | const | 1894 | no | const c = report.scenarios.find((s) =&gt; s.mode === &#39;capture&#39;); |
| main | function | 1907 | no | async function main() { |
| cfg | variable | 1908 | no | let cfg; |
| mode | const | 1922 | no | const mode = cfg.mode === &#39;baseline&#39; ? &#39;baseline&#39; : &#39;capture&#39;; |
| scenario | const | 1923 | no | const scenario = cfg.scenario === &#39;chat&#39; ? await runChatScenario({ mode, cfg }) : await runScenario({ mode, cfg }); |
| scenarios | const | 1930 | no | const scenarios = []; |
| order | const | 1932 | no | const order = r % 2 === 1 ? [&#39;capture&#39;, &#39;baseline&#39;] : [&#39;baseline&#39;, &#39;capture&#39;]; |
| scenario | const | 1935 | no | const scenario = runWorker(mode, cfg); |
| isChat | const | 1940 | no | const isChat = cfg.scenario === &#39;chat&#39;; |
| report | const | 1941 | no | const report = isChat ? buildChatReport(cfg, scenarios) : buildReport(cfg, scenarios); |
| text | const | 1942 | no | const text = isChat ? chatTable(report) : table(report); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:module | import | 64 | external |
| node:child_process | import | 65 | external |
| node:fs | require | 68 | external |
| node:os | require | 69 | external |
| node:path | require | 70 | external |
| node:crypto | require | 71 | external |
| node:url | require | 72 | external |
| ../src/capture/dom.mjs | dynamic | 427 | [studio/src/capture/dom.mjs](../src/capture/dom.mjs.md) |
| ../src/cdp/client.mjs | dynamic | 428 | [studio/src/cdp/client.mjs](../src/cdp/client.mjs.md) |
| ../src/profiles/profiles.mjs | dynamic | 429 | [studio/src/profiles/profiles.mjs](../src/profiles/profiles.mjs.md) |
| ../src/capture/recorder.mjs | dynamic | 430 | [studio/src/capture/recorder.mjs](../src/capture/recorder.mjs.md) |
| ../src/capture/network.mjs | dynamic | 431 | [studio/src/capture/network.mjs](../src/capture/network.mjs.md) |
| ../src/replay/reducer.mjs | dynamic | 432 | [studio/src/replay/reducer.mjs](../src/replay/reducer.mjs.md) |
| ../src/shapes/infer.mjs | dynamic | 433 | [studio/src/shapes/infer.mjs](../src/shapes/infer.mjs.md) |
| ../src/store/session.mjs | dynamic | 434 | [studio/src/store/session.mjs](../src/store/session.mjs.md) |
| ../src/replay/derive.mjs | dynamic | 435 | [studio/src/replay/derive.mjs](../src/replay/derive.mjs.md) |
| ../src/capture/privacy.mjs | dynamic | 436 | [studio/src/capture/privacy.mjs](../src/capture/privacy.mjs.md) |
| node:fs | dynamic | 438 | external |
| node:perf_hooks | dynamic | 563 | external |
| ../src/capture/dom.mjs | dynamic | 1168 | [studio/src/capture/dom.mjs](../src/capture/dom.mjs.md) |
| ../src/cdp/client.mjs | dynamic | 1169 | [studio/src/cdp/client.mjs](../src/cdp/client.mjs.md) |
| ../src/profiles/profiles.mjs | dynamic | 1170 | [studio/src/profiles/profiles.mjs](../src/profiles/profiles.mjs.md) |
| ../src/capture/recorder.mjs | dynamic | 1171 | [studio/src/capture/recorder.mjs](../src/capture/recorder.mjs.md) |
| ../src/capture/network.mjs | dynamic | 1172 | [studio/src/capture/network.mjs](../src/capture/network.mjs.md) |
| ../src/replay/reducer.mjs | dynamic | 1173 | [studio/src/replay/reducer.mjs](../src/replay/reducer.mjs.md) |
| ../src/shapes/infer.mjs | dynamic | 1174 | [studio/src/shapes/infer.mjs](../src/shapes/infer.mjs.md) |
| ../src/store/session.mjs | dynamic | 1175 | [studio/src/store/session.mjs](../src/store/session.mjs.md) |
| ../src/replay/derive.mjs | dynamic | 1176 | [studio/src/replay/derive.mjs](../src/replay/derive.mjs.md) |
| ../src/capture/privacy.mjs | dynamic | 1177 | [studio/src/capture/privacy.mjs](../src/capture/privacy.mjs.md) |
| node:fs | dynamic | 1179 | external |
| node:perf_hooks | dynamic | 1250 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Capture-path load lab (Phase A.1 of docs/DESIGN-live-drive-studio.md, section 16).
//
// QUESTION
//   Does Studio's CAPTURE PATH starve the Node event loop?
//
// WHAT THIS IS
//   A hermetic load generator. No Chrome, no browser, no network, no server, no real site.
//   Synthetic CDP frames are pushed through an in-process fake DevTools socket into the REAL
//   capture code (src/cdp/client.mjs -> src/capture/network.mjs -> src/capture/recorder.mjs
//   -> src/store/raw-log.mjs -> src/replay/reducer.mjs -> src/shapes/infer.mjs, plus
//   src/capture/dom.mjs for the rendered-DOM batch path).
//
//   Every scenario runs twice:
//     capture  - the real capture path is attached (network handlers, recorder._append,
//                reducer, shapes, dataset, raw log, the recorder's own 1 s status timer and
//                5 s persist timer).
//     baseline - the SAME emitter, the SAME CDP frame parsing, but no capture handlers are
//                attached (handlers no-op). The difference between the two is therefore the
//                capture path itself, not the synthetic load generator.
//
//   Each scenario runs in its own child process so peak RSS and event-loop delay are not
//   polluted by the other one.
//
// MEASURED
//   perf_hooks.monitorEventLoopDelay (p50/p99/max), wall time, bytes/s, peak RSS, sync fs call
//   counts (when the fs facade can be instrumented), and raw byte equality: the sha256 of the
//   bytes the fake browser emitted vs the sha256 of the bytes reassembled from the saved raw
//   log with the existing replay/derive reader.
//
// SAFETY
//   Everything is written under os.tmpdir() in a fresh mkdtemp directory that is removed at the
//   end (unless --keep). The real Capture Studio data dir and any session under LOCALAPPDATA
//   are never touched. The session dir is created with Session.create() inside the temp dir.
//
// USAGE
//   node scripts/loadlab.mjs [--mb N] [--chunk KB] [--streams N] [--dom-rows N]
//                             [--seed N] [--repeats N] [--json] [--out FILE] [--keep] [--help]
//                             [--scenario saturation|chat] [--rate-kbps N] [--duration-s N] [--burst-mb N]
//
//   --scenario chat  realistic AI-chat load instead of saturation (see the CHAT section below):
//                    a paced SSE reply, 4 Hz DOM batches, one history burst at 40 % of the run and
//                    three analytics-like streams. Reports event-loop stalls, their timing relative
//                    to the burst, queue age, peak queue bytes, frames/s, and PASS/FAIL verdicts.
//   Chat run:        node scripts/loadlab.mjs --scenario chat --duration-s 20 --repeats 3 --json
//
//   --repeats N   run each mode (capture ON, baseline OFF) N times, alternating the order per
//                 repeat (default 5). The report then carries median / p95 / min / max / CV over
//                 the repeats for event-loop p99, throughput MB/s and wall time, plus queue age
//                 p50/p99 and peak queue bytes for capture. Synthetic in-process numbers only.
//   --mb N        total synthetic payload bytes across all streams (default 64, hard cap 512)
//   --chunk KB    bytes per Network.dataReceived frame (default 64)
//   --streams N   parallel HTTP streams (default 4)
//   --dom-rows N  total rendered-DOM rows across DOM batches (default 2000)
//   --seed N      deterministic seed (default 1337)
//   --json        print the JSON report on stdout (the table goes to stderr)
//   --profile     attach a V8 CPU profile summary to each scenario (slower, but names the hot
//                 functions of the capture path)
//   --out FILE    also write the JSON report to FILE
//   --keep        keep the temp session dir and print its path
//
//   Headline run:  node scripts/loadlab.mjs --mb 64 --streams 4

import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { fileURLToPath } = require('node:url');

const SELF = path.resolve(process.argv[1] ?? '');
const SCRIPT_PATH = path.resolve(fileURLToPath(import.meta.url));
// main() only runs when this file is the entry point. Importing it (the unit test does, to check
// the repeat statistics) must not start a load run. Workers are spawned with this file as argv[1],
// so they still run main().
const IS_MAIN = SCRIPT_PATH.toLowerCase() === SELF.toLowerCase();
const SCHEMA = 'aion-capture-studio.loadlab/1';
```

_First 80 of 1957 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

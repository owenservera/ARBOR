# File: studio/scripts/always-on.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/always-on.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 28618 B |
| Lines | 609 |
| Hash | fd79c2ad386b |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 51 | no | const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;..&#39;); |
| STUDIO | const | 52 | no | const STUDIO = path.join(ROOT, &#39;bin&#39;, &#39;studio.mjs&#39;); |
| LOG_MAX_BYTES | const | 53 | no | const LOG_MAX_BYTES = 5 * 1024 * 1024; |
| BACKOFF_MS | const | 54 | no | const BACKOFF_MS = [2000, 4000, 8000, 16000, 32000, 60000]; // capped at 60 s, never gives up |
| SHORT_CYCLE_MS | const | 55 | no | const SHORT_CYCLE_MS = 60_000; |
| STOP_WAIT_MS | const | 56 | no | const STOP_WAIT_MS = 20_000; |
| GRACEFUL_STOP_MS | const | 57 | no | const GRACEFUL_STOP_MS = 30_000; // how long an IPC-stopped recorder gets to finalize |
| CHROME_READY_MS | const | 58 | no | const CHROME_READY_MS = 25_000; // how long a freshly launched Chrome gets to answer /json/version |
| WARN_EVERY | const | 59 | no | const WARN_EVERY = 10; |
| usage | function | 64 | no | function usage(msg) { |
| parseArgs | function | 70 | no | function parseArgs(argv) { |
| o | const | 71 | no | const o = { status: false, stop: false, json: false, once: false, dryRun: false, ensureChrome: null }; |
| a | const | 73 | no | const a = argv[i]; |
| eq | const | 74 | no | const eq = a.startsWith(&#39;--&#39;) &amp;&amp; a.includes(&#39;=&#39;) ? a.indexOf(&#39;=&#39;) : -1; |
| name | const | 75 | no | const name = eq &gt; 0 ? a.slice(0, eq) : a; |
| inline | const | 76 | no | const inline = eq &gt; 0 ? a.slice(eq + 1) : null; |
| value | function | 77 | no | const value = () =&gt; (inline !== null ? inline : argv[++i]); |
| v | const | 85 | no | const v = value(); |
| num | function | 103 | no | const num = (v, label, min) =&gt; { |
| n | const | 105 | no | const n = Number(v); |
| ANSI | const | 119 | no | const ANSI = /\\u001b\\[[0-9;?]*[ -/]*[@-~]\|\\u001b\\][^\\u0007]*\\u0007/g; |
| stripAnsi | function | 120 | no | const stripAnsi = (s) =&gt; String(s).replace(ANSI, &#39;&#39;); |
| now | function | 121 | no | const now = () =&gt; new Date().toISOString(); |
| pidAlive | function | 123 | no | function pidAlive(pid) { |
| killTree | function | 128 | no | function killTree(pid, { force = true } = {}) { |
| r | const | 131 | no | const r = spawnSync(&#39;taskkill&#39;, [&#39;/PID&#39;, String(pid), &#39;/T&#39;, &#39;/F&#39;], { windowsHide: true, stdio: &#39;ignore&#39; }); |
| sleep | function | 137 | no | const sleep = (ms) =&gt; new Promise((r) =&gt; setTimeout(r, ms)); |
| waitDead | function | 139 | no | async function waitDead(pid, timeoutMs) { |
| readJson | function | 148 | no | function readJson(file) { |
| writeJsonAtomic | function | 152 | no | function writeJsonAtomic(file, value) { |
| makeLogger | function | 160 | no | function makeLogger(file) { |
| fd | variable | 161 | no | let fd = openSync(file, &#39;a&#39;); |
| write | function | 162 | no | const write = (text) =&gt; { |
| body | const | 168 | no | const body = stripAnsi(message).replace(/\\r/g, &#39;&#39;).replace(/\\n+$/, &#39;&#39;); |
| rotateLog | function | 176 | no | function rotateLog(file) { |
| prev | const | 179 | no | const prev = `${file}.1`; |
| expandEnv | function | 190 | no | function expandEnv(value) { |
| setup | function | 195 | no | function setup(argv) { |
| o | const | 196 | no | const o = parseArgs(argv); |
| dataDir | const | 197 | no | const dataDir = o.dataDir ? path.resolve(o.dataDir) : defaultDataDir(); |
| paths | const | 198 | no | const paths = dataPaths(dataDir); |
| settings | const | 199 | no | const settings = resolveSettings({ configFile: paths.config }).settings; |
| port | const | 200 | no | const port = o.port ?? settings.cdpPort; // config.mjs:78 — no invented default |
| stateFile | const | 202 | no | const stateFile = path.join(dataDir, &#39;always-on.json&#39;); |
| logFile | const | 203 | no | const logFile = path.join(dataDir, &#39;always-on.log&#39;); |
| stopFile | const | 204 | no | const stopFile = path.join(dataDir, &#39;always-on.stop&#39;); |
| chromeProfile | const | 205 | no | const chromeProfile = o.chromeProfile ? path.resolve(expandEnv(o.chromeProfile)) : null; |
| ensureChrome | const | 208 | no | const ensureChrome = o.ensureChrome ?? Boolean(chromeProfile); |
| recorderArgs | function | 213 | no | function recorderArgs(cfg) { |
| chromeArgs | function | 227 | no | function chromeArgs(port, profileDir) { |
| quoteArg | function | 238 | no | const quoteArg = (a) =&gt; (String(a).includes(&#39; &#39;) ? `&quot;${a}&quot;` : String(a)); |
| formatCmd | function | 239 | no | const formatCmd = (exe, args) =&gt; [quoteArg(exe), ...args.map(quoteArg)].join(&#39; &#39;); |
| cmdStatus | function | 244 | no | function cmdStatus(cfg) { |
| state | const | 245 | no | const state = readJson(cfg.stateFile); |
| supervisorAlive | const | 251 | no | const supervisorAlive = pidAlive(state.pid); |
| childAlive | const | 252 | no | const childAlive = pidAlive(state.childPid); |
| running | const | 253 | no | const running = supervisorAlive \|\| childAlive; |
| ensureBrowser | function | 272 | no | async function ensureBrowser(cfg, say) { |
| exe | variable | 287 | no | let exe; |
| args | const | 289 | no | const args = chromeArgs(cfg.port, cfg.chromeProfile); |
| startedAt | const | 291 | no | const startedAt = Date.now(); |
| child | variable | 292 | no | let child; |
| cmdDryRun | function | 316 | no | function cmdDryRun(cfg) { |
| exe | variable | 317 | no | let exe = &#39;(none: chrome only starts if the port is unreachable)&#39;; |
| lines | const | 321 | no | const lines = [ |
| cmdStop | function | 343 | no | async function cmdStop(cfg) { |
| state | const | 344 | no | const state = readJson(cfg.stateFile); |
| log | const | 349 | no | const log = makeLogger(cfg.logFile); |
| childAlive | const | 350 | no | const childAlive = pidAlive(state.childPid); |
| supervisorAlive | const | 351 | no | const supervisorAlive = pidAlive(state.pid); |
| runCycle | function | 394 | no | function runCycle(cfg, log, onChild) { |
| args | const | 395 | no | const args = recorderArgs(cfg); |
| startedAt | const | 396 | no | const startedAt = Date.now(); |
| child | const | 398 | no | const child = spawn(process.execPath, args, { cwd: ROOT, env: { ...process.env, CAPTURE_STUDIO_HOME: cfg.dataDir, CAPTURE_STUDIO_CDP_PORT: String(cfg.port) }, windowsHide: true, // fd 3 is the IPC ch… |
| stdout | variable | 407 | no | let stdout = &#39;&#39;; |
| lastErr | variable | 408 | no | let lastErr = &#39;&#39;; |
| pump | function | 409 | no | const pump = (stream, tag) =&gt; { |
| buf | variable | 410 | no | let buf = &#39;&#39;; |
| i | variable | 415 | no | let i; |
| line | const | 417 | no | const line = stripAnsi(buf.slice(0, i)); |
| line | const | 425 | no | const line = stripAnsi(buf); |
| sessionId | variable | 440 | no | let sessionId = null; |
| cmdRun | function | 450 | no | async function cmdRun(cfg) { |
| existing | const | 451 | no | const existing = readJson(cfg.stateFile); |
| log | const | 457 | no | const log = makeLogger(cfg.logFile); |
| state | const | 459 | no | const state = { |
| persist | function | 474 | no | const persist = () =&gt; writeJsonAtomic(cfg.stateFile, state); |
| child | variable | 478 | no | let child = null; |
| stopping | variable | 479 | no | let stopping = false; |
| backoffIndex | variable | 480 | no | let backoffIndex = 0; |
| shortFailures | variable | 481 | no | let shortFailures = 0; |
| stopPoll | variable | 482 | no | let stopPoll = null; |
| gracefulStop | function | 487 | no | const gracefulStop = async (why) =&gt; { |
| pid | const | 488 | no | const pid = child?.pid; |
| sent | variable | 490 | no | let sent = false; |
| shutdown | function | 511 | no | const shutdown = async (why) =&gt; { |
| rotateTimer | variable | 544 | no | let rotateTimer = null; |
| result | const | 545 | no | const result = await runCycle(cfg, log, (c) =&gt; { child = c; state.childPid = c.pid ?? null; persist(); // Rotation safety net: the recorder normally ends the cycle with its own --duration timer. |
| healthy | const | 567 | no | const healthy = result.ms &gt;= SHORT_CYCLE_MS; |
| waitMs | const | 580 | no | const waitMs = BACKOFF_MS[backoffIndex]; |
| cmdOnce | function | 590 | no | async function cmdOnce(cfg) { |
| log | const | 592 | no | const log = makeLogger(cfg.logFile); |
| result | const | 595 | no | const result = await runCycle(cfg, log); |
| cfg | const | 604 | no | const cfg = setup(process.argv.slice(2)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 43 | external |
| node:fs | import | 44 | external |
| node:path | import | 45 | external |
| node:url | import | 46 | external |
| ../src/config.mjs | import | 47 | [studio/src/config.mjs](../src/config.mjs.md) |
| ../src/cdp/discovery.mjs | import | 48 | [studio/src/cdp/discovery.mjs](../src/cdp/discovery.mjs.md) |
| ../src/chrome/launch.mjs | import | 49 | [studio/src/chrome/launch.mjs](../src/chrome/launch.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// always-on.mjs — supervise `studio record` so capture keeps running, restarting after crashes
// and rotating sessions so no single recording grows forever.
//
// Zero-dependency ESM (Node 22+). Facts this file depends on, verified in the tree:
//
//   * `record` and its real flags live in bin/commands/capture.mjs:77-94 (recordFlags).
//     `--tabs` is a string with choices all|one (capture.mjs:81), `--follow` is a boolean
//     (capture.mjs:82), `--duration SECONDS` (capture.mjs:86) is wired to a stop timer at
//     capture.mjs:193, and `--max-mb MB` (capture.mjs:89) becomes maxSessionBytes at
//     capture.mjs:130, which the recorder enforces as a clean `quota_reached` stop
//     (src/capture/recorder.mjs:499). So duration-based rotation is genuinely supported.
//   * `record` is ATTACH-ONLY: Recorder.start calls browserVersion({port})
//     (src/capture/recorder.mjs:77) and never launches Chrome. This script therefore does
//     NOT pass --no-launch (that flag exists only on `capture`, capture.mjs:250/259, not on
//     `record`). Launching the dedicated browser is done by the `launch` command
//     (capture.mjs:29-32, via ensureChrome/launchChrome in src/chrome/launch.mjs:35-77) and
//     lazily by `capture` (capture.mjs:258-263). Consequence, stated plainly: a cycle with no
//     browser serving DevTools on the port fails fast and is retried with backoff — run
//     `node bin/studio.mjs launch` once (or start the studio) before leaving this running.
//   * Data dir: CAPTURE_STUDIO_HOME (src/config.mjs:12), paths from dataPaths()
//     (src/config.mjs:18). DevTools port: setting `cdpPort`, env CAPTURE_STUDIO_CDP_PORT,
//     default 9222 (src/config.mjs:78). The port default here is read from resolveSettings(),
//     never invented.
//   * Global `--data-dir` and `--port` flags are accepted after the subcommand
//     (bin/lib/registry.mjs:7-10, parsed over the whole argv in bin/studio.mjs:55-56).
//   * With --json, `record` writes exactly one pretty-printed JSON object to stdout whose
//     `id` is the session id (bin/lib/ui.mjs:70-73, summarizeRecording capture.mjs:96-107);
//     progress/warnings go to stderr. The session id is therefore recovered by parsing the
//     accumulated stdout at exit, not per line.
//
// Usage: node scripts/always-on.mjs [--tabs all|one] [--rotate-min N] [--max-mb N] [--port N]
//        [--chrome-profile DIR] [--ensure-chrome|--no-ensure-chrome] [--data-dir DIR]
//        [--status] [--stop] [--json] [--once] [--dry-run]
// --once runs one cycle and exits with the child's exit code; it writes no state file.
// --dry-run prints the resolved settings and the exact argv it would use, then exits 0.
//
// Stopping: the recorder is asked to stop over its IPC channel ({type:'stop'}), because on Windows
// a SIGINT sent to a child kills it before its finalize code runs (that left sessions stuck at
// "recording" with an unfinalized raw segment). bin/studio.mjs turns that message into the same
// SIGINT event Ctrl+C produces. Only if the child ignores the request for 30 s is it force-killed.

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, closeSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dataPaths, defaultDataDir, resolveSettings } from '../src/config.mjs';
import { isReachable } from '../src/cdp/discovery.mjs';
import { findChrome } from '../src/chrome/launch.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STUDIO = path.join(ROOT, 'bin', 'studio.mjs');
const LOG_MAX_BYTES = 5 * 1024 * 1024;
const BACKOFF_MS = [2000, 4000, 8000, 16000, 32000, 60000]; // capped at 60 s, never gives up
const SHORT_CYCLE_MS = 60_000;
const STOP_WAIT_MS = 20_000;
const GRACEFUL_STOP_MS = 30_000; // how long an IPC-stopped recorder gets to finalize
const CHROME_READY_MS = 25_000;   // how long a freshly launched Chrome gets to answer /json/version
const WARN_EVERY = 10;

// ---------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------
function usage(msg) {
  if (msg) process.stderr.write(`always-on: ${msg}\n`);
  process.stderr.write('usage: node scripts/always-on.mjs [--tabs all|one] [--rotate-min N] [--max-mb N] [--port N] [--chrome-profile DIR] [--ensure-chrome|--no-ensure-chrome] [--data-dir DIR] [--status] [--stop] [--json] [--once] [--dry-run]\n');
  process.exit(2);
}

function parseArgs(argv) {
  const o = { status: false, stop: false, json: false, once: false, dryRun: false, ensureChrome: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const eq = a.startsWith('--') && a.includes('=') ? a.indexOf('=') : -1;
    const name = eq > 0 ? a.slice(0, eq) : a;
    const inline = eq > 0 ? a.slice(eq + 1) : null;
    const value = () => (inline !== null ? inline : argv[++i]);
    switch (name) {
      case '--tabs': o.tabs = value(); break;
      case '--rotate-min': o.rotateMin = value(); break;
```

_First 80 of 610 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

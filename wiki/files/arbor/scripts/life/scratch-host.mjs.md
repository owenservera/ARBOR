# File: scripts/life/scratch-host.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/life/scratch-host.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10809 B |
| Lines | 207 |
| Hash | af5f91758d0c |
| Test | no |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 32 | no | const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), &#39;../..&#39;); |
| SERVER | const | 33 | no | const SERVER = &#39;apps/vivim-host/server.mjs&#39;; |
| REAL_PORT | const | 34 | no | const REAL_PORT = 43187; |
| ISO_MARKER | const | 35 | no | const ISO_MARKER = &#39;arbor-life-scratch-&#39;; |
| watchdog | function | 38 | no | function watchdog(ppid) { |
| timer | const | 39 | no | const timer = setInterval(() =&gt; { let alive = true; try { process.kill(ppid, 0); } catch { alive = false; } if (!alive) { clearInterval(timer); try { process.kill(process.ppid, &#39;SIGKILL&#39;); } catch { … |
| alive | variable | 40 | no | let alive = true; |
| freePort | function | 47 | no | function freePort() { |
| srv | const | 49 | no | const srv = net.createServer(); |
| flaggedRoot | function | 59 | no | function flaggedRoot(dataRoot) { |
| real | const | 60 | no | const real = realpathSync(dataRoot); |
| start | function | 64 | no | async function start(parentPid) { |
| port | const | 65 | no | const port = await freePort(); |
| dataRoot | const | 67 | no | const dataRoot = realpathSync(mkdtempSync(join(os.tmpdir(), ISO_MARKER))); |
| child | const | 72 | no | const child = spawn(&#39;bun&#39;, [SERVER], { cwd: ROOT, env: { ...process.env, VIVIM_HOST_PORT: String(port), VIVIM_HOST_DATA_DIR: dataRoot }, stdio: &#39;ignore&#39;, detached: true, |
| baseUrl | const | 78 | no | const baseUrl = `http://127.0.0.1:${port}`; |
| up | variable | 79 | no | let up = false; |
| stop | function | 98 | no | function stop(args) { |
| portIdx | const | 99 | no | const portIdx = args.indexOf(&#39;--port&#39;); |
| rootIdx | const | 100 | no | const rootIdx = args.indexOf(&#39;--data-root&#39;); |
| port | const | 101 | no | const port = portIdx &gt;= 0 ? Number(args[portIdx + 1]) : NaN; |
| dataRoot | const | 102 | no | const dataRoot = rootIdx &gt;= 0 ? args[rootIdx + 1] : &#39;&#39;; |
| pidFile | const | 104 | no | const pidFile = join(os.tmpdir(), `arbor-life-scratch-${port}.pid`); |
| killed | variable | 105 | no | let killed = false; |
| pid | const | 107 | no | const pid = Number(readFileSync(pidFile, &#39;utf8&#39;).trim()); |
| r | const | 109 | no | const r = spawnSync(&#39;taskkill&#39;, [&#39;/PID&#39;, String(pid), &#39;/T&#39;, &#39;/F&#39;], { encoding: &#39;utf8&#39; }); |
| removed | variable | 114 | no | let removed = false; |
| run | function | 119 | no | function run(args) { |
| sepIdx | const | 120 | no | const sepIdx = args.indexOf(&#39;--&#39;); |
| r | const | 123 | no | const r = spawnSync(cmd, rest, { cwd: ROOT, stdio: &#39;inherit&#39;, env: process.env, shell: process.platform === &#39;win32&#39; }); |
| journey | function | 131 | no | async function journey(args) { |
| chats | const | 132 | no | const chats = []; |
| nlc | const | 133 | no | const nlc = []; |
| port | const | 139 | no | const port = await freePort(); |
| dataRoot | const | 141 | no | const dataRoot = realpathSync(mkdtempSync(join(os.tmpdir(), ISO_MARKER))); |
| child | const | 142 | no | const child = spawn(&#39;bun&#39;, [SERVER], { cwd: ROOT, env: { ...process.env, VIVIM_HOST_PORT: String(port), VIVIM_HOST_DATA_DIR: dataRoot }, stdio: [&#39;ignore&#39;, &#39;pipe&#39;, &#39;pipe&#39;], detached: true, |
| baseUrl | const | 150 | no | const baseUrl = `http://127.0.0.1:${port}`; |
| up | variable | 151 | no | let up = false; |
| report | const | 157 | no | const report = { scratch: { baseUrl, dataRoot, port, pid: child.pid, up }, posts: [], verified: null, stopped: false }; |
| isChat | const | 160 | no | const isChat = chats.includes(text); |
| payload | const | 161 | no | const payload = isChat |
| status | variable | 164 | no | let status = 0; let body = &#39;&#39;; |
| res | const | 166 | no | const res = await fetch(baseUrl + &#39;/api/mutate&#39;, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39; }, body: JSON.stringify(payload) }); |
| res | const | 172 | no | const res = await fetch(baseUrl + &#39;/api/state&#39;); |
| state | const | 173 | no | const state = await res.json(); |
| pIdx | const | 194 | no | const pIdx = rest.indexOf(&#39;--parent-pid&#39;); |
| parentPid | const | 195 | no | const parentPid = pIdx &gt;= 0 ? Number(rest[pIdx + 1]) : 0; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 25 | external |
| node:fs | import | 26 | external |
| node:net | import | 27 | external |
| node:os | import | 28 | external |
| node:path | import | 29 | external |
| node:url | import | 30 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env bun
// scratch-host.mjs — turnkey ISOLATED ARBOR Host for LIFE journeys (R002 steering ERA 3.2).
//
// Problem this solves: simulated-user journeys that POST /api/mutate against the shared Host on
// 127.0.0.1:43187 mutate real demo state (recorded as DEFECTs in the A00/A01 receipts). The A01
// evidence contract boots an isolated Host instead; this helper makes that pattern turnkey for
// journey subagents.
//
// Usage (journeys: prefer `journey` — one call, self-cleaning, no caller-side steps):
//   bun scripts/life/scratch-host.mjs journey --chat "<text>" [--chat "<text2>"...] [--nlcl '<json>']
//     -> boots scratch Host, POSTs each payload to /api/mutate, verifies /api/state projection,
//        ALWAYS stops + removes the data root, prints ONE JSON {scratch, posts, verified, stopped}
//   bun scripts/life/scratch-host.mjs session -> ONE JSON line {baseUrl, dataRoot, port, pid}
//     (persistent scratch Host for multi-step walks: GETs, wiki edits, browser; the watchdog
//      reaps it if your shell dies; ALWAYS pair with stop)
//   bun scripts/life/scratch-host.mjs start [--parent-pid <ppid>] -> same as session + explicit watchdog
//   bun scripts/life/scratch-host.mjs stop --port <port> [--data-root <dir>]
//   bun scripts/life/scratch-host.mjs run -- <command...>   (env injected, cwd = repo root)
//
// Guarantees: scratch port != 43187 (ephemeral, race-checked); data root is a flagged mkdtemp
// dir (arbor-life-scratch-*) beneath the OS temp dir; the real port-43187 data root is never
// read or written; stop removes the data root. run/stop exit 1 with a message on any violation.
// Detached by design (survives the caller): pass --parent-pid <ppid> (typically $$) and a
// watchdog kills this scratch Host if the parent dies — prevents orphaned Hosts after crashes.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, lstatSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SERVER = 'apps/vivim-host/server.mjs';
const REAL_PORT = 43187;
const ISO_MARKER = 'arbor-life-scratch-';

// Watchdog: exit (and take the scratch Host with us, via the stop path) once `ppid` is gone.
function watchdog(ppid) {
  const timer = setInterval(() => {
    let alive = true;
    try { process.kill(ppid, 0); } catch { alive = false; }
    if (!alive) { clearInterval(timer); try { process.kill(process.ppid, 'SIGKILL'); } catch { /* parent already gone */ } process.exit(0); }
  }, 5000);
  timer.unref?.();
}

function freePort() {
  return new Promise((res, rej) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', rej);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => res(port));
    });
  });
}

function flaggedRoot(dataRoot) {
  const real = realpathSync(dataRoot);
  return real.startsWith(realpathSync(os.tmpdir()) + sep) && lstatSync(real).isDirectory() && real.includes(ISO_MARKER);
}

async function start(parentPid) {
  const port = await freePort();
  if (port === REAL_PORT) throw new Error('refuse: scratch port equals real port 43187');
  const dataRoot = realpathSync(mkdtempSync(join(os.tmpdir(), ISO_MARKER)));
  // stdio 'ignore' (not pipes): this command must EXIT after printing its ONE JSON line — held
  // pipes keep the event loop alive so a synchronous caller (world.run, subagent shell) waits
  // forever (observed 2026-11-17: boot "failed" on a 90s timeout while the host was actually up).
  // An ignored stdout can also never block the child on a full buffer; health is proven by probes.
  const child = spawn('bun', [SERVER], {
    cwd: ROOT,
    env: { ...process.env, VIVIM_HOST_PORT: String(port), VIVIM_HOST_DATA_DIR: dataRoot },
    stdio: 'ignore',
    detached: true,
  });
  const baseUrl = `http://127.0.0.1:${port}`;
  let up = false;
  for (let i = 0; i < 60 && !up; i++) {
```

_First 80 of 207 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

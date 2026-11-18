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
    if (child.exitCode !== null) break;
    try { const r = await fetch(baseUrl + '/api/state'); up = r.ok; } catch { /* not up yet */ }
    if (!up) await new Promise((r) => setTimeout(r, 500));
  }
  child.unref(); // release the parent-side handle only after the probe loop
  if (!up) {
    try { child.kill(); } catch { /* already gone */ }
    rmSync(dataRoot, { recursive: true, force: true });
    throw new Error('scratch Host did not answer on ' + baseUrl + (child.exitCode !== null ? ` (child exited ${child.exitCode})` : ''));
  }
  // PID sidecar for deterministic stop (avoids shell process matching).
  writeFileSync(join(os.tmpdir(), `arbor-life-scratch-${port}.pid`), String(child.pid));
  if (parentPid) watchdog(parentPid);
  console.log(JSON.stringify({ baseUrl, dataRoot, port, pid: child.pid }));
  process.exit(0); // session mode prints ONE line and MUST exit — detached child outlives us
}

function stop(args) {
  const portIdx = args.indexOf('--port');
  const rootIdx = args.indexOf('--data-root');
  const port = portIdx >= 0 ? Number(args[portIdx + 1]) : NaN;
  const dataRoot = rootIdx >= 0 ? args[rootIdx + 1] : '';
  if (!Number.isInteger(port) || port < 1024 || port === REAL_PORT) { console.error('stop: --port <scratchPort> required (!= 43187)'); process.exit(1); }
  const pidFile = join(os.tmpdir(), `arbor-life-scratch-${port}.pid`);
  let killed = false;
  if (existsSync(pidFile)) {
    const pid = Number(readFileSync(pidFile, 'utf8').trim());
    if (Number.isInteger(pid) && pid > 0) {
      const r = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { encoding: 'utf8' });
      killed = r.status === 0;
    }
    rmSync(pidFile, { force: true });
  }
  let removed = false;
  if (dataRoot && existsSync(dataRoot) && flaggedRoot(dataRoot)) { rmSync(dataRoot, { recursive: true, force: true }); removed = true; }
  console.log(JSON.stringify({ stopped: port, killed, dataRootRemoved: removed }));
}

function run(args) {
  const sepIdx = args.indexOf('--');
  if (sepIdx < 0 || sepIdx === args.length - 1) { console.error('run: `run -- <command...>` required'); process.exit(1); }
  const [cmd, ...rest] = args.slice(sepIdx + 1);
  const r = spawnSync(cmd, rest, { cwd: ROOT, stdio: 'inherit', env: process.env, shell: process.platform === 'win32' });
  process.exit(r.status ?? 1);
}

// journey — ONE self-sufficient call: boot the scratch Host, POST each --chat payload (or
// --nlcl payload) to /api/mutate, verify the projection via /api/state, ALWAYS stop the Host
// and remove its data root, then print ONE JSON report. No caller-side post-start steps, no
// orphan risk: the Host never outlives this command.
async function journey(args) {
  const chats = [];
  const nlc = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--chat') chats.push(args[++i]);
    else if (args[i] === '--nlcl') nlc.push(args[++i]);
  }
  if (chats.length === 0 && nlc.length === 0) { console.error('journey: pass at least one --chat "<text>" or --nlcl "<text>"'); process.exit(1); }
  const port = await freePort();
  if (port === REAL_PORT) throw new Error('refuse: scratch port equals real port 43187');
  const dataRoot = realpathSync(mkdtempSync(join(os.tmpdir(), ISO_MARKER)));
  const child = spawn('bun', [SERVER], {
    cwd: ROOT,
    env: { ...process.env, VIVIM_HOST_PORT: String(port), VIVIM_HOST_DATA_DIR: dataRoot },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  child.stdout?.on('data', () => {});
  child.stderr?.on('data', () => {});
  const baseUrl = `http://127.0.0.1:${port}`;
  let up = false;
  for (let i = 0; i < 60 && !up; i++) {
    if (child.exitCode !== null) break;
    try { const r = await fetch(baseUrl + '/api/state'); up = r.ok; } catch { /* not up yet */ }
    if (!up) await new Promise((r) => setTimeout(r, 500));
  }
  const report = { scratch: { baseUrl, dataRoot, port, pid: child.pid, up }, posts: [], verified: null, stopped: false };
  if (up) {
    for (const text of [...chats, ...nlc]) {
      const isChat = chats.includes(text);
      const payload = isChat
        ? { kind: 'chat-send', actor: 'human', schemaVersion: 1, text }
        : text; // --nlcl payload is a full JSON envelope the caller built
      let status = 0; let body = '';
      try {
        const res = await fetch(baseUrl + '/api/mutate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
        status = res.status; body = (await res.text()).slice(0, 200);
      } catch (e) { status = 0; body = String(e && e.message || e); }
      report.posts.push({ kind: payload.kind, text: String(payload.text ?? '').slice(0, 60), status, body });
    }
    try {
      const res = await fetch(baseUrl + '/api/state');
      const state = await res.json();
      report.verified = { status: res.status, revision: state.revision ?? null, chatLen: Array.isArray(state.chat) ? state.chat.length : null };
    } catch (e) { report.verified = { error: String(e && e.message || e) }; }
  }
  // ALWAYS stop + clean, even on failures. Windows: the child may still hold file locks for
  // a moment after kill — force-kill the tree, then retry the removal a few times.
  try { spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { encoding: 'utf8' }); } catch { /* best-effort */ }
  try { child.kill(); } catch { /* already gone */ }
  try { if (existsSync(join(os.tmpdir(), `arbor-life-scratch-${port}.pid`))) rmSync(join(os.tmpdir(), `arbor-life-scratch-${port}.pid`), { force: true }); } catch { /* best-effort */ }
  if (existsSync(dataRoot) && flaggedRoot(dataRoot)) {
    for (let i = 0; i < 5; i++) {
      try { rmSync(dataRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 400 }); report.stopped = true; break; }
      catch { await new Promise((r) => setTimeout(r, 600)); }
    }
  }
  console.log(JSON.stringify(report));
  process.exit(0);
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'start' || cmd === 'session') {
  const pIdx = rest.indexOf('--parent-pid');
  const parentPid = pIdx >= 0 ? Number(rest[pIdx + 1]) : 0;
  if (pIdx >= 0) rest.splice(pIdx, 2);
  start(parentPid).catch((e) => { console.error(String(e && e.message || e)); process.exit(1); });
} else if (cmd === 'stop') {
  stop(rest);
} else if (cmd === 'run') {
  run(rest);
} else if (cmd === 'journey') {
  journey(rest).catch((e) => { console.error(String(e && e.message || e)); process.exit(1); });
} else {
  console.error('usage: scratch-host.mjs session [--parent-pid <ppid>] | journey --chat "<text>"... [--nlcl <json>]... | stop --port <port> [--data-root <dir>] | run -- <command...>');
  process.exit(1);
}
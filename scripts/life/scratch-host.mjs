#!/usr/bin/env bun
// scratch-host.mjs — turnkey ISOLATED ARBOR Host for LIFE journeys (R002 steering ERA 3.2).
//
// Problem this solves: simulated-user journeys that POST /api/mutate against the shared Host on
// 127.0.0.1:43187 mutate real demo state (recorded as DEFECTs in the A00/A01 receipts). The A01
// evidence contract boots an isolated Host instead; this helper makes that pattern turnkey for
// journey subagents.
//
// Usage:
//   bun scripts/life/scratch-host.mjs start   -> prints ONE JSON line {baseUrl, dataRoot, port}
//   bun scripts/life/scratch-host.mjs stop --port <port> [--data-root <dir>]
//   bun scripts/life/scratch-host.mjs run -- <command...>   (env injected, cwd = repo root)
//
// Guarantees: scratch port != 43187 (ephemeral, race-checked); data root is a flagged mkdtemp
// dir (arbor-life-scratch-*) beneath the OS temp dir; the real port-43187 data root is never
// read or written; stop removes the data root. run/stop exit 1 with a message on any violation.
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

async function start() {
  const trace = (m) => { try { writeFileSync(join(os.tmpdir(), 'arbor-life-scratch-trace.log'), m + '\n', { flag: 'a' }); } catch { /* tracing is best-effort */ } };
  trace('start: begin');
  const port = await freePort();
  trace('start: port ' + port);
  if (port === REAL_PORT) throw new Error('refuse: scratch port equals real port 43187');
  const dataRoot = realpathSync(mkdtempSync(join(os.tmpdir(), ISO_MARKER)));
  const child = spawn('bun', [SERVER], {
    cwd: ROOT,
    env: { ...process.env, VIVIM_HOST_PORT: String(port), VIVIM_HOST_DATA_DIR: dataRoot },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  // Hold the pipes open: on Windows an unread child pipe can block the child on a full buffer.
  child.stdout?.on('data', () => {});
  child.stderr?.on('data', () => {});
  trace('start: spawned pid ' + String(child.pid));
  const baseUrl = `http://127.0.0.1:${port}`;
  let up = false;
  for (let i = 0; i < 60 && !up; i++) {
    if (child.exitCode !== null) { trace('start: child exited ' + String(child.exitCode)); break; }
    try { const r = await fetch(baseUrl + '/api/state'); up = r.ok; } catch { /* not up yet */ }
    if (!up) await new Promise((r) => setTimeout(r, 500));
  }
  trace('start: probe done up=' + String(up));
  child.unref(); // release the parent-side handle only after the probe loop
  if (!up) {
    try { child.kill(); } catch { /* already gone */ }
    rmSync(dataRoot, { recursive: true, force: true });
    throw new Error('scratch Host did not answer on ' + baseUrl + (child.exitCode !== null ? ` (child exited ${child.exitCode})` : ''));
  }
  // PID sidecar for deterministic stop (avoids shell process matching).
  writeFileSync(join(os.tmpdir(), `arbor-life-scratch-${port}.pid`), String(child.pid));
  trace('start: ready');
  console.log(JSON.stringify({ baseUrl, dataRoot, port, pid: child.pid }));
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

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'start') {
  start().catch((e) => { console.error(String(e && e.message || e)); process.exit(1); });
} else if (cmd === 'stop') {
  stop(rest);
} else if (cmd === 'run') {
  run(rest);
} else {
  console.error('usage: scratch-host.mjs start | stop --port <port> [--data-root <dir>] | run -- <command...>');
  process.exit(1);
}
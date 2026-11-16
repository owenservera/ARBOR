#!/usr/bin/env node
// A01 independent evidence — "One-command live Host and acceptance runner"
// (arbor.item-receipt/1).
// Static: the Host boot path (apps/vivim-host/server.mjs: VIVIM_HOST_PORT +
// VIVIM_HOST_DATA_DIR data-root env) and the one-command acceptance entry
// (package.json scripts / apps/vivim-host/README.md line) exist and agree.
// Live: boots an ISOLATED loopback Host on a scratch port with a flagged temp
// data root via the real boot path, GET / and /api/state must answer 200, then
// shuts it down. Port 43187's real data root is never contacted or mutated.
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, lstatSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SERVER = 'apps/vivim-host/server.mjs';
const README = 'apps/vivim-host/README.md';
const ACCEPTANCE_RUNNER = 'scripts/acceleration/live-host-check.mjs';
const REAL_PORT = 43187;
const ISO_MARKER = 'arbor-a01-isolated-';

const hash = value => createHash('sha256').update(value).digest('hex');

// First 1-based line of `pattern` in `source`, or 0.
export function findLine(source, pattern) {
  const lines = String(source).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) if (pattern.test(lines[i])) return i + 1;
  return 0;
}

export function assertIsolatedLive(baseUrl, isolated) {
  let url;
  try { url = new URL(baseUrl); } catch { throw new Error('Explicit isolated loopback base URL required'); }
  if (!isolated || url.protocol !== 'http:' ||
      !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
      url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('--live requires an explicit isolated http://127.0.0.1:<port> Host (no credentials/query/hash)');
  }
}

// The boot env the real entrypoint (server.mjs:1118-1121) reads.
export function bootEnvFor(port, dataRoot, env = process.env) {
  return { ...env, VIVIM_HOST_PORT: String(port), VIVIM_HOST_DATA_DIR: dataRoot };
}

// True only for an explicitly flagged mkdtemp root beneath the system temp dir.
export function isFlaggedIsolatedRoot(dataRoot, tmpdir = os.tmpdir()) {
  try {
    const real = realpathSync(dataRoot);
    const parent = realpathSync(tmpdir);
    return real.startsWith(parent + sep) &&
      lstatSync(real).isDirectory() && real.includes(ISO_MARKER);
  } catch { return false; }
}

async function freePort() {
  return new Promise((res, rej) => {
    const srv = net.createServer();
    srv.once('error', rej);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => res(port));
    });
  });
}

async function waitReady(baseUrl, fetchImpl, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let last = 'not attempted';
  while (Date.now() < deadline) {
    try {
      const res = await fetchImpl(baseUrl + '/', { signal: AbortSignal.timeout(2000) });
      if (res.status === 200) return true;
      last = 'status=' + res.status;
    } catch (error) { last = String(error?.message || error); }
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('isolated Host not ready within ' + timeoutMs + 'ms (last: ' + last + ')');
}

async function stopHost(child) {
  if (!child || child.exitCode !== null || child.signalCode) return child?.exitCode ?? 0;
  child.kill('SIGTERM');
  const code = await new Promise(res => {
    const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch {} res('killed'); }, 8000);
    child.once('exit', (c, s) => { clearTimeout(timer); res(c ?? s ?? 0); });
  });
  return code;
}

function makeTransport(baseUrl, fetchImpl) {
  return {
    get: async route => {
      const response = await fetchImpl(baseUrl + route, { signal: AbortSignal.timeout(5000) });
      return { status: response.status, type: response.headers.get('content-type') || '', body: await response.text() };
    }
  };
}

export async function runA01Evidence({
  root = ROOT, live = false, fetchImpl = globalThis.fetch,
  spawnImpl = spawn, boot = null, tmpdir = os.tmpdir()
} = {}) {
  const checks = [];
  const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail: String(detail) });
  const safe = async (name, fn) => {
    try { const value = await fn(); check(name, true, typeof value === 'string' ? value : 'validated'); return value; }
    catch (error) { check(name, false, String(error?.message || error)); return null; }
  };
  const read = file => readFileSync(resolve(root, file), 'utf8');
  const exists = file => existsSync(resolve(root, file));

  // ---------------- static: boot path + one-command acceptance entry ----------------
  let serverSrc = '';
  await safe('host-boot-path-env', () => {
    serverSrc = read(SERVER);
    const portLine = findLine(serverSrc, /process\.env\.VIVIM_HOST_PORT/);
    const rangeLine = findLine(serverSrc, /VIVIM_HOST_PORT must be 1024\.\.65535/);
    const dataDirLine = findLine(serverSrc, /env\.VIVIM_HOST_DATA_DIR/);
    const listenLine = findLine(serverSrc, /server\.listen\(port, '127\.0\.0\.1'/);
    if (!portLine || !rangeLine || !dataDirLine || !listenLine)
      throw new Error('boot env missing: VIVIM_HOST_PORT@' + portLine + ' range@' + rangeLine +
        ' VIVIM_HOST_DATA_DIR@' + dataDirLine + ' listen@' + listenLine);
    return SERVER + ':' + portLine + ' VIVIM_HOST_PORT (range guard :' + rangeLine +
      '), :' + dataDirLine + ' VIVIM_HOST_DATA_DIR data root, :' + listenLine + " listen 127.0.0.1";
  });

  let readme = '';
  await safe('readme-one-command-entry', () => {
    readme = read(README);
    const startLine = findLine(readme, /node apps\/vivim-host\/server\.mjs/);
    const addrLine = findLine(readme, /http:\/\/127\.0\.0\.1:43187/);
    const portEnvLine = findLine(readme, /VIVIM_HOST_PORT.*default 43187/);
    const dataEnvLine = findLine(readme, /VIVIM_HOST_DATA_DIR/);
    if (!startLine || !addrLine || !portEnvLine || !dataEnvLine)
      throw new Error('README entry incomplete: start@' + startLine + ' addr@' + addrLine +
        ' portEnv@' + portEnvLine + ' dataEnv@' + dataEnvLine);
    return README + ':' + startLine + ' `node apps/vivim-host/server.mjs` one command, :' + addrLine +
      ' http://127.0.0.1:43187, :' + portEnvLine + ' VIVIM_HOST_PORT default 43187, :' + dataEnvLine + ' VIVIM_HOST_DATA_DIR';
  });

  await safe('package-scripts-consistent', () => {
    const pkg = JSON.parse(read('package.json'));
    const scripts = pkg.scripts || {};
    const testGate = scripts['test:gate'];
    const testHost = scripts['test:host'];
    if (testGate !== 'bun scripts/test-gate.mjs') throw new Error('scripts["test:gate"]=' + JSON.stringify(testGate));
    if (!exists('scripts/test-gate.mjs')) throw new Error('scripts/test-gate.mjs missing');
    if (testHost !== 'node --test apps/vivim-host/test/*.test.mjs')
      throw new Error('scripts["test:host"]=' + JSON.stringify(testHost));
    const readmeTests = findLine(readme, /node --test apps\/vivim-host\/test\/\*\.test\.mjs/);
    if (!readmeTests) throw new Error('README targeted-tests line missing');
    if (!exists('apps/vivim-host/test')) throw new Error('apps/vivim-host/test dir missing');
    return 'package.json scripts.test:gate="' + testGate + '", scripts.test:host="' + testHost +
      '" == ' + README + ':' + readmeTests;
  });

  await safe('acceptance-runner-entry', () => {
    if (!exists(ACCEPTANCE_RUNNER)) throw new Error(ACCEPTANCE_RUNNER + ' missing');
    const src = read(ACCEPTANCE_RUNNER);
    const oneCmd = findLine(src, /One command: node scripts\/acceleration\/live-host-check\.mjs/);
    const iso = findLine(src, /mkdtempSync/);
    const host = findLine(src, /createHostServer/);
    if (!oneCmd || !iso || !host) throw new Error('runner wiring missing: oneCmd@' + oneCmd + ' mkdtemp@' + iso + ' createHostServer@' + host);
    if (!exists('scripts/acceleration/live-host-check.test.mjs')) throw new Error('runner test missing');
    const manifest = JSON.parse(read('scripts/test-manifest.json'));
    if (!manifest.some(t => t.path === ACCEPTANCE_RUNNER.replace(/\.mjs$/, '.test.mjs')))
      throw new Error('runner test not registered in scripts/test-manifest.json');
    return ACCEPTANCE_RUNNER + ':' + oneCmd + ' one command; isolated mkdtemp dataRoot :' + iso +
      ', createHostServer :' + host + '; registered in scripts/test-manifest.json';
  });

  check('port-default-consistency', (() => {
    const m = /VIVIM_HOST_PORT \|\| (\d+)/.exec(serverSrc);
    const readmePort = /http:\/\/127\.0\.0\.1:(\d+)/.exec(readme);
    return Boolean(m && readmePort && m[1] === readmePort[1] && m[1] === String(REAL_PORT));
  })(), 'server.mjs default ' + (/VIVIM_HOST_PORT \|\| (\d+)/.exec(serverSrc) || [])[1] +
    ' == README ' + (/http:\/\/127\.0\.0\.1:(\d+)/.exec(readme) || [])[1] + ' == live Host port ' + REAL_PORT);

  // ---------------- live: boot an ISOLATED loopback Host on a scratch port ----------------
  if (live) {
    let dataRoot = null;
    let child = null;
    let baseUrl = '';
    try {
      const port = await freePort();
      dataRoot = mkdtempSync(join(tmpdir, ISO_MARKER));
      const realRoot = realpathSync(dataRoot);
      baseUrl = 'http://127.0.0.1:' + port;
      let guardDetail = 'scratch port ' + port + ' (!= ' + REAL_PORT + '), flagged temp data root ' + realRoot +
        ' under ' + realpathSync(tmpdir);
      let guardPass = port !== REAL_PORT && isFlaggedIsolatedRoot(realRoot, tmpdir);
      try { assertIsolatedLive(baseUrl, true); } catch (error) { guardPass = false; guardDetail += ' | ' + error.message; }
      check('isolated-boot-guard', guardPass, guardDetail);
      const bootFn = boot || (async () => {
        child = spawnImpl('bun', [resolve(root, SERVER)], {
          cwd: root, env: bootEnvFor(port, realRoot), stdio: ['ignore', 'pipe', 'pipe']
        });
        child.stdout?.on('data', () => {});
        child.stderr?.on('data', () => {});
        await waitReady(baseUrl, fetchImpl);
      });
      await safe('isolated-host-ready', () => bootFn());
      const io = makeTransport(baseUrl, fetchImpl);
      await safe('isolated-root-get-200', async () => {
        const out = await io.get('/');
        if (out.status !== 200 || !/text\/html/i.test(out.type || ''))
          throw new Error('GET / status=' + out.status + ' type=' + out.type);
        return 'GET / status=200 type=' + out.type + ' bytes=' + out.body.length;
      });
      await safe('isolated-state-get-200', async () => {
        const out = await io.get('/api/state');
        if (out.status !== 200 || !/application\/json/i.test(out.type || ''))
          throw new Error('GET /api/state status=' + out.status + ' type=' + out.type);
        const value = JSON.parse(out.body);
        if (!Array.isArray(value.chat) || !Number.isSafeInteger(value.wikiRevision))
          throw new Error('Invalid isolated /api/state shape');
        return 'GET /api/state status=200 chat=' + value.chat.length + ' wikiRevision=' + value.wikiRevision +
          ' revision=' + value.revision + ' at=' + value.at;
      });
      check('real-host-data-untouched', port !== REAL_PORT && isFlaggedIsolatedRoot(realRoot, tmpdir),
        'all requests went to ' + baseUrl + ' only; port ' + REAL_PORT + ' data root never contacted; data root is the flagged temp dir');
    } catch (error) {
      check('isolated-live-boot', false, String(error?.message || error));
    } finally {
      if (child) {
        const code = await stopHost(child);
        check('isolated-host-shutdown', true, 'scratch Host stopped (exit=' + code + ')');
      }
      if (dataRoot) { try { rmSync(dataRoot, { recursive: true, force: true }); } catch {} }
    }
  }

  const ok = checks.every(c => c.pass);
  return {
    schema: 'arbor.item-receipt/1', ok, item: 'A01',
    scope: live ? 'SOURCE_PLUS_ISOLATED_LIVE_BOOT' : 'SOURCE_ONLY',
    isolation: live ? 'SCRATCH_PORT_FLAGGED_TEMP_DATA_ROOT_ONLY' : 'NONE',
    browserDom: 'UNRUN', physicalDevice: 'UNRUN', independentKeeperAcceptance: 'UNRUN',
    checks, digest: hash(JSON.stringify(checks))
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write('Usage: node scripts/batch-evidence/A01.mjs [--static|--live]\n');
    return;
  }
  const flags = args.filter(x => x === '--static' || x === '--live');
  if (args.length !== flags.length || new Set(flags).size !== flags.length || flags.length > 1) {
    process.stderr.write('Unknown or duplicate argument\n'); process.exitCode = 2; return;
  }
  try {
    const result = await runA01Evidence({ live: flags.includes('--live') });
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    process.stderr.write('A01 evidence unavailable: ' + String(error?.message || error) + '\n');
    process.exitCode = 2;
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

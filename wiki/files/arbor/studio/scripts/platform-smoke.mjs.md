# File: studio/scripts/platform-smoke.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/platform-smoke.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5454 B |
| Lines | 120 |
| Hash | 772fb648b453 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 10 | no | const root = fileURLToPath(new URL(&#39;../&#39;, import.meta.url)); |
| cli | const | 11 | no | const cli = path.join(root, &#39;bin&#39;, &#39;studio.mjs&#39;); |
| home | const | 12 | no | const home = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-platform-smoke-&#39;)); |
| env | const | 13 | no | const env = { ...process.env, CAPTURE_STUDIO_HOME: home }; |
| report | const | 14 | no | const report = { platform: process.platform, node: process.version, checks: [] }; |
| mark | function | 15 | no | const mark = (what) =&gt; report.checks.push(what); |
| command | function | 17 | no | function command(args) { |
| res | const | 18 | no | const res = spawnSync(process.execPath, [cli, ...args], { cwd: root, env, encoding: &#39;utf8&#39;, timeout: 25000, maxBuffer: 2 * 1024 * 1024, }); |
| serve | function | 26 | no | function serve() { |
| child | const | 28 | no | const child = spawn(process.execPath, [cli, &#39;serve&#39;, &#39;--no-open&#39;, &#39;--studio-port&#39;, &#39;0&#39;, &#39;--data-dir&#39;, home], { cwd: root, env, stdio: [&#39;ignore&#39;, &#39;pipe&#39;, &#39;pipe&#39;, &#39;ipc&#39;], windowsHide: true, }); |
| stdout | variable | 31 | no | let stdout = &#39;&#39;, stderr = &#39;&#39;, settled = false; |
| settle | function | 32 | no | const settle = (fn, value) =&gt; { |
| fail | function | 38 | no | const fail = (error) =&gt; { if (!settled) child.kill(); settle(reject, error); }; |
| timeout | const | 39 | no | const timeout = setTimeout(() =&gt; fail(new Error(`Studio startup timeout: ${stdout.slice(-200)} ${stderr.slice(-400)}`)), 25000); |
| url | const | 42 | no | const url = stdout.match(/http:\\/\\/127\\.0\\.0\\.1:\\d+\\//)?.[0]; |
| stopGracefully | function | 51 | no | async function stopGracefully(child) { |
| exit | const | 53 | no | const exit = new Promise((resolve) =&gt; { const timeout = setTimeout(() =&gt; resolve({ timedOut: true }), 10000); child.once(&#39;exit&#39;, (code, signal) =&gt; { clearTimeout(timeout); resolve({ code, signal }); … |
| timeout | const | 54 | no | const timeout = setTimeout(() =&gt; resolve({ timedOut: true }), 10000); |
| outcome | const | 60 | no | const outcome = await exit; |
| child | variable | 69 | no | let child = null, failure = null; |
| commands | const | 73 | no | const commands = JSON.parse(command([&#39;commands&#39;, &#39;--json&#39;])); |
| dirs | const | 76 | no | const dirs = JSON.parse(command([&#39;paths&#39;, &#39;--data-dir&#39;, home, &#39;--json&#39;])); |
| inventory | const | 81 | no | const inventory = spawnSync(process.execPath, [path.join(root, &#39;scripts&#39;, &#39;architecture-inventory.mjs&#39;), &#39;--check&#39;], { cwd: root, encoding: &#39;utf8&#39;, timeout: 25000 }); |
| running | const | 86 | no | const running = await serve(); |
| read | function | 88 | no | const read = async (route, type) =&gt; { |
| response | const | 89 | no | const response = await fetch(new URL(route, running.url), { signal: AbortSignal.timeout(10000) }); |
| health | const | 100 | no | const health = await (await read(&#39;api/v1/health&#39;, /json/)).json(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:assert/strict | import | 3 | external |
| node:child_process | import | 4 | external |
| node:fs | import | 5 | external |
| node:os | import | 6 | external |
| node:path | import | 7 | external |
| node:url | import | 8 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Native Windows/Linux integration smoke. Private roots are disposable; zero Chrome/provider effects.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = path.join(root, 'bin', 'studio.mjs');
const home = mkdtempSync(path.join(os.tmpdir(), 'vivim-platform-smoke-'));
const env = { ...process.env, CAPTURE_STUDIO_HOME: home };
const report = { platform: process.platform, node: process.version, checks: [] };
const mark = (what) => report.checks.push(what);

function command(args) {
  const res = spawnSync(process.execPath, [cli, ...args], {
    cwd: root, env, encoding: 'utf8', timeout: 25000, maxBuffer: 2 * 1024 * 1024,
  });
  if (res.error || res.status !== 0)
    throw new Error(`studio ${args.join(' ')}: ${res.error?.message ?? res.stderr ?? res.status}`);
  return res.stdout;
}

function serve() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, 'serve', '--no-open', '--studio-port', '0', '--data-dir', home], {
      cwd: root, env, stdio: ['ignore', 'pipe', 'pipe', 'ipc'], windowsHide: true,
    });
    let stdout = '', stderr = '', settled = false;
    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      fn(value);
    };
    const fail = (error) => { if (!settled) child.kill(); settle(reject, error); };
    const timeout = setTimeout(() => fail(new Error(`Studio startup timeout: ${stdout.slice(-200)} ${stderr.slice(-400)}`)), 25000);
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      const url = stdout.match(/http:\/\/127\.0\.0\.1:\d+\//)?.[0];
      if (url) settle(resolve, { child, url });
    });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.once('error', fail);
    child.once('exit', (code, signal) => fail(new Error(`Studio exited early: ${code}/${signal}; ${stderr.slice(-400)}`)));
  });
}

async function stopGracefully(child) {
  if (!child || child.exitCode !== null) return child?.exitCode ?? null;
  const exit = new Promise((resolve) => {
    const timeout = setTimeout(() => resolve({ timedOut: true }), 10000);
    child.once('exit', (code, signal) => { clearTimeout(timeout); resolve({ code, signal }); });
  });
  // bin/studio.mjs routes IPC 'stop' through the existing SIGINT close handler.
  // Unlike process.kill('SIGINT'), this works gracefully on Windows too.
  if (child.connected) child.send({ type: 'stop' });
  const outcome = await exit;
  if (outcome.timedOut) {
    child.kill();
    throw new Error('Studio did not exit after IPC stop within 10 seconds');
  }
  assert.equal(outcome.code, 0, `Graceful Studio exit: ${JSON.stringify(outcome)}`);
  return outcome.code;
}

let child = null, failure = null;
try {
  assert.match(command(['--version']), /^\S+\s+[0-9a-f]{16}\s*$/);
  mark('CLI source version');
  const commands = JSON.parse(command(['commands', '--json']));
  assert.ok(Array.isArray(commands) && commands.some((x) => x.command === 'serve'));
  mark('native CLI command registry');
  const dirs = JSON.parse(command(['paths', '--data-dir', home, '--json']));
  assert.equal(dirs.root, home);
  assert.ok(dirs.sessions.startsWith(home));
  mark('disposable private storage');
  // Structural gate: a moved or newly owned code path must be reflected in the manifest.
```

_First 80 of 121 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

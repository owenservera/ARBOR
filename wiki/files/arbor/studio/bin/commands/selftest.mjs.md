# File: studio/bin/commands/selftest.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/selftest.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13499 B |
| Lines | 270 |
| Hash | 6b77d9a2e056 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| STUDIO_URL | const | 21 | no | const STUDIO_URL = new URL(&#39;../studio.mjs&#39;, import.meta.url); |
| collectModules | function | 24 | no | function collectModules() { |
| srcRoot | const | 25 | no | const srcRoot = path.join(TOOL_ROOT, &#39;src&#39;); |
| files | const | 26 | no | const files = []; |
| walk | function | 27 | no | const walk = (dir) =&gt; { |
| full | const | 29 | no | const full = path.join(dir, entry.name); |
| cmdDir | const | 39 | no | const cmdDir = path.join(TOOL_ROOT, &#39;bin&#39;, &#39;commands&#39;); |
| commands | const | 40 | no | const commands = existsSync(cmdDir) |
| importModules | function | 47 | no | async function importModules(mods) { |
| failures | const | 48 | no | const failures = []; |
| withEventLoopAlive | function | 59 | no | async function withEventLoopAlive(fn) { |
| keepAlive | const | 60 | no | const keepAlive = setInterval(() =&gt; {}, 250); |
| httpGet | function | 65 | no | function httpGet(port, urlPath, token, timeoutMs = 5000) { |
| req | const | 67 | no | const req = http.request({ host: &#39;127.0.0.1&#39;, port, path: urlPath, method: &#39;GET&#39;, agent: false, headers: token ? { &#39;x-studio-token&#39;: token } : {}, }, (res) =&gt; { const chunks = []; |
| chunks | const | 71 | no | const chunks = []; |
| text | const | 74 | no | const text = Buffer.concat(chunks).toString(&#39;utf8&#39;); |
| body | variable | 75 | no | let body = null; |
| runChecks | function | 98 | no | async function runChecks(ctx) { |
| checks | const | 99 | no | const checks = []; |
| run | function | 101 | no | const run = async (name, severity, fn) =&gt; { |
| started | const | 102 | no | const started = Date.now(); |
| detail | const | 104 | no | const detail = await fn(); |
| major | const | 115 | no | const major = Number(process.versions.node.split(&#39;.&#39;)[0]); |
| mods | const | 123 | no | const mods = [ |
| failures | const | 127 | no | const failures = await importModules(mods); |
| root | const | 134 | no | const root = ctx.paths.root; |
| probe | const | 136 | no | const probe = path.join(root, `.selftest-${process.pid}-${Date.now()}.tmp`); |
| installs | const | 145 | no | const installs = chromeInstalls(); |
| probe | const | 152 | no | const probe = await discoveryProbe({ port: ctx.port }); |
| detected | const | 159 | no | const detected = await detectAndScan(&#39;a,b\\n1,2\\n&#39;); |
| csv | const | 162 | no | const csv = await csvAnalyze(&#39;x,y\\n1,2\\n&#39;); |
| expanded | const | 166 | no | const expanded = expandTerm(&#39;tickt&#39;, [&#39;ticket&#39;]); |
| studio | variable | 174 | no | let studio = null; |
| token | variable | 175 | no | let token = null; |
| port | variable | 176 | no | let port = null; |
| startedOk | const | 178 | no | const startedOk = await run(&#39;studio-start&#39;, &#39;required&#39;, async () =&gt; { token = randomBytes(18).toString(&#39;base64url&#39;); studio = await startStudio({ paths: ctx.paths, profileStore: ctx.profiles(), famil… |
| res | const | 193 | no | const res = await httpGet(port, &#39;/api/x/stats&#39;, token, 30_000); |
| res | const | 199 | no | const res = await httpGet(port, &#39;/api/x/registry&#39;, token); |
| res | const | 205 | no | const res = await httpGet(port, &#39;/api/v1/openapi.json&#39;, token); |
| res | const | 211 | no | const res = await httpGet(port, &#39;/platform&#39;, token); |
| started | const | 219 | no | const started = Date.now(); |
| detail | variable | 220 | no | let detail = &#39;Studio stopped&#39;; |
| ok | variable | 221 | no | let ok = true; |
| dir | const | 234 | no | const dir = mkdtempSync(path.join(os.tmpdir(), &#39;studio-selftest-mirror-&#39;)); |
| table | const | 237 | no | const table = buildRouteTable(dir); |
| required | const | 243 | no | const required = checks.filter((c) =&gt; c.severity === &#39;required&#39;); |
| failed | const | 244 | no | const failed = required.filter((c) =&gt; !c.ok); |
| ok | const | 245 | no | const ok = failed.length === 0; |
| payload | const | 246 | no | const payload = { |
| mark | const | 255 | no | const mark = { true: o.c.green(&#39;ok &#39;), false: o.c.red(&#39;FAIL&#39;) }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 3 | external |
| node:http | import | 4 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| node:crypto | import | 7 | external |
| node:url | import | 8 | external |
| ../../src/config.mjs | import | 9 | [studio/src/config.mjs](../../src/config.mjs.md) |
| ../lib/registry.mjs | import | 10 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../../src/studio/server.mjs | import | 11 | [studio/src/studio/server.mjs](../../src/studio/server.mjs.md) |
| ../../src/chrome/launch.mjs | import | 12 | [studio/src/chrome/launch.mjs](../../src/chrome/launch.mjs.md) |
| ../../src/cdp/discovery.mjs | import | 13 | [studio/src/cdp/discovery.mjs](../../src/cdp/discovery.mjs.md) |
| ../../src/intel/platform.mjs | import | 14 | [studio/src/intel/platform.mjs](../../src/intel/platform.mjs.md) |
| ../../src/intel/rank.mjs | import | 15 | [studio/src/intel/rank.mjs](../../src/intel/rank.mjs.md) |
| ../../src/mirror/index.mjs | dynamic | 233 | [studio/src/mirror/index.mjs](../../src/mirror/index.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/selftest.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// selftest: fast local health check for this build (Node, module imports, data dir, Chrome, CDP,
// platform functions, Studio HTTP API, mirror route table).
import { existsSync, readdirSync, mkdtempSync, rmSync, writeFileSync, unlinkSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { EXIT, TOOL_ROOT } from '../../src/config.mjs';
import { define } from '../lib/registry.mjs';
import { startStudio } from '../../src/studio/server.mjs';
import { chromeInstalls } from '../../src/chrome/launch.mjs';
import { discoveryProbe } from '../../src/cdp/discovery.mjs';
import { detectAndScan, csvAnalyze } from '../../src/intel/platform.mjs';
import { expandTerm } from '../../src/intel/rank.mjs';

// ---------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------

const STUDIO_URL = new URL('../studio.mjs', import.meta.url);

// Every .mjs under src/ (minus the browser-only UI scripts) and every command module.
function collectModules() {
  const srcRoot = path.join(TOOL_ROOT, 'src');
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (path.relative(TOOL_ROOT, full).split(path.sep).join('/') === 'src/studio/ui') continue;
        walk(full);
        continue;
      }
      if (entry.name.endsWith('.mjs')) files.push(full);
    }
  };
  if (existsSync(srcRoot)) walk(srcRoot);
  const cmdDir = path.join(TOOL_ROOT, 'bin', 'commands');
  const commands = existsSync(cmdDir)
    ? readdirSync(cmdDir).filter((f) => f.endsWith('.mjs')).sort().map((f) => path.join(cmdDir, f))
    : [];
  return { src: files, commands };
}

// Import each module one by one so the first failing file is reported precisely.
async function importModules(mods) {
  const failures = [];
  for (const mod of mods) {
    try { await import(mod.url); }
    catch (e) { failures.push({ label: mod.label, error: String(e?.message ?? e).split('\n')[0] }); }
  }
  return failures;
}

// Some engine helpers (src/cdp/client.mjs sleep()) unref their timers, so a failing probe can let
// the event loop drain and Node exit silently mid-run. Keep one ref'd timer alive for the whole
// check sequence so every check actually reports.
async function withEventLoopAlive(fn) {
  const keepAlive = setInterval(() => {}, 250);
  try { return await fn(); } finally { clearInterval(keepAlive); }
}

// One HTTP GET against the local Studio, without keep-alive sockets.
function httpGet(port, urlPath, token, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const req = http.request({
      host: '127.0.0.1', port, path: urlPath, method: 'GET', agent: false,
      headers: token ? { 'x-studio-token': token } : {},
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let body = null;
        try { body = JSON.parse(text); } catch { body = null; }
        resolve({ status: res.statusCode ?? 0, body, text });
      });
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`timeout after ${timeoutMs} ms`)));
```

_First 80 of 271 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

# File: studio/scripts/adapter-factory-demo.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/adapter-factory-demo.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 25770 B |
| Lines | 436 |
| Hash | 486bbd40e763 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HERE | const | 32 | no | const HERE = path.dirname(fileURLToPath(import.meta.url)); |
| ROOT | const | 33 | no | const ROOT = path.resolve(HERE, &#39;..&#39;); |
| STUDIO | const | 34 | no | const STUDIO = path.join(ROOT, &#39;bin&#39;, &#39;studio.mjs&#39;); |
| sleep | function | 35 | no | const sleep = (ms) =&gt; new Promise((r) =&gt; setTimeout(r, ms)); |
| oneLine | function | 36 | no | const oneLine = (s) =&gt; String(s ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| steps | const | 38 | no | const steps = []; |
| failed | variable | 39 | no | let failed = false; |
| step | function | 40 | no | async function step(name, fn) { |
| t0 | const | 41 | no | const t0 = Date.now(); |
| detail | const | 43 | no | const detail = await fn(); |
| freePort | function | 54 | no | function freePort() { |
| srv | const | 56 | no | const srv = createServer(); |
| findChromeBinary | function | 62 | no | function findChromeBinary() { |
| cache | const | 64 | no | const cache = path.join(os.homedir(), &#39;.cache&#39;, &#39;ms-playwright&#39;); |
| candidates | const | 65 | no | const candidates = []; |
| runCli | function | 77 | no | async function runCli(args, { env = {}, timeoutMs = 300000 } = {}) { |
| child | const | 79 | no | const child = spawn(process.execPath, [STUDIO, ...args], { env: { ...process.env, ...env }, stdio: [&#39;ignore&#39;, &#39;pipe&#39;, &#39;pipe&#39;], }); |
| stdout | variable | 83 | no | let stdout = &#39;&#39;, stderr = &#39;&#39;; |
| timer | const | 84 | no | const timer = setTimeout(() =&gt; { child.kill(&#39;SIGKILL&#39;); resolve({ code: 124, stdout, stderr: `${stderr}\\ntimeout` }); }, timeoutMs); |
| api | function | 91 | no | async function api(port, method, pathname, body) { |
| res | const | 92 | no | const res = await fetch(`http://127.0.0.1:${port}${pathname}`, { method, headers: { &#39;content-type&#39;: &#39;application/json&#39; }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), }); |
| text | const | 97 | no | const text = await res.text(); |
| json | variable | 98 | no | let json = null; |
| tlsApi | function | 105 | no | function tlsApi(port, method, pathname, body) { |
| payload | const | 107 | no | const payload = body !== undefined ? JSON.stringify(body) : null; |
| req | const | 108 | no | const req = https.request({ host: &#39;127.0.0.1&#39;, port, method, path: pathname, rejectUnauthorized: false, headers: { &#39;content-type&#39;: &#39;application/json&#39;, ...(payload ? { &#39;content-length&#39;: Buffer.byteLen… |
| text | variable | 111 | no | let text = &#39;&#39;; |
| json | variable | 114 | no | let json = null; |
| httpApi | function | 127 | no | function httpApi(port, method, pathname, body) { |
| payload | const | 129 | no | const payload = body !== undefined ? JSON.stringify(body) : null; |
| req | const | 130 | no | const req = http.request({ host: &#39;127.0.0.1&#39;, port, method, path: pathname, headers: { &#39;content-type&#39;: &#39;application/json&#39;, ...(payload ? { &#39;content-length&#39;: Buffer.byteLength(payload) } : {}) }, time… |
| text | variable | 133 | no | let text = &#39;&#39;; |
| json | variable | 136 | no | let json = null; |
| cdpOpenTab | function | 150 | no | async function cdpOpenTab(cdpPort, url) { |
| created | const | 151 | no | const created = await (await fetch(`http://127.0.0.1:${cdpPort}/json/new`, { method: &#39;PUT&#39; })).json(); |
| ws | const | 152 | no | const ws = new WebSocket(created.webSocketDebuggerUrl); |
| id | variable | 154 | no | let id = 0; const pending = new Map(); |
| call | function | 156 | no | const call = (method, params = {}) =&gt; new Promise((res) =&gt; { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); }); |
| cdpCloseTab | function | 162 | no | async function cdpCloseTab(cdpPort, targetId) { |
| waitForTabUrl | function | 165 | no | async function waitForTabUrl(cdpPort, targetId, urlPart, { timeoutMs = 20000 } = {}) { |
| list | const | 168 | no | const list = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json(); |
| hit | const | 169 | no | const hit = list.find((t) =&gt; t.id === targetId); |
| main | function | 177 | no | async function main() { |
| dataDir | const | 178 | no | const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), &#39;aion-adapter-demo-&#39;)); |
| resultsFile | const | 179 | no | const resultsFile = path.join(dataDir, &#39;adapter-factory-demo-result.json&#39;); |
| certDir | const | 180 | no | const certDir = path.join(dataDir, &#39;tls&#39;); |
| keyFile | const | 182 | no | const keyFile = path.join(certDir, &#39;key.pem&#39;), certFile = path.join(certDir, &#39;cert.pem&#39;); |
| fixturePort | const | 183 | no | const fixturePort = await freePort(), cdpPort = await freePort(), servePort = await freePort(); |
| ORIGIN | const | 184 | no | const ORIGIN = `https://127.0.0.1:${fixturePort}`; |
| chromeBin | const | 185 | no | const chromeBin = findChromeBinary(); |
| env | const | 186 | no | const env = { |
| SITE | const | 191 | no | const SITE = &#39;nimbus-chat&#39;; // unregistered site id for the learned adapter |
| fixture | variable | 195 | no | let fixture = null, serve = null; |
| startFixture | function | 197 | no | const startFixture = (v2) =&gt; { |
| child | const | 198 | no | const child = spawn(process.execPath, [path.join(HERE, &#39;adapter-fixture-site.mjs&#39;)], { env: { ...process.env, FIXTURE_PORT: String(fixturePort), FIXTURE_TLS_KEY_FILE: keyFile, FIXTURE_TLS_CERT_FILE: … |
| stopFixture | function | 206 | no | const stopFixture = async () =&gt; { if (fixture) { fixture.kill(&#39;SIGTERM&#39;); await sleep(300); fixture = null; } }; |
| tlsOk | const | 208 | no | const tlsOk = spawnSync(&#39;openssl&#39;, [&#39;version&#39;]).status === 0; |
| chromeOk | const | 209 | no | const chromeOk = !!chromeBin; |
| browserPossible | const | 210 | no | const browserPossible = tlsOk &amp;&amp; chromeOk; |
| skipNote | const | 211 | no | const skipNote = !browserPossible ? (tlsOk ? &#39;no Chrome binary&#39; : &#39;no openssl&#39;) : null; |
| r | const | 217 | no | const r = spawnSync(&#39;openssl&#39;, [&#39;req&#39;, &#39;-x509&#39;, &#39;-newkey&#39;, &#39;rsa:2048&#39;, &#39;-keyout&#39;, keyFile, &#39;-out&#39;, certFile, &#39;-days&#39;, &#39;2&#39;, &#39;-nodes&#39;, &#39;-subj&#39;, &#39;/CN=127.0.0.1&#39;, &#39;-addext&#39;, &#39;subjectAltName=IP:127.0.0.1&#39;… |
| r | const | 223 | no | const r = await runCli([&#39;doctor&#39;, &#39;--json&#39;], { env }); |
| dj | const | 224 | no | const dj = JSON.parse(r.stdout); |
| okCount | const | 225 | no | const okCount = (dj.checks ?? []).filter((c) =&gt; c.level === &#39;ok&#39;).length; |
| r | const | 241 | no | const r = await runCli([&#39;launch&#39;, &#39;--headless&#39;, &#39;--json&#39;], { env }); |
| lj | const | 242 | no | const lj = JSON.parse(r.stdout); |
| drives | const | 249 | no | const drives = {}; |
| prompts | const | 250 | no | const prompts = [&#39;Tell me about the alpha feature.&#39;, &#39;Tell me about the beta feature.&#39;, &#39;Tell me about the gamma feature.&#39;, &#39;Tell me about the delta feature.&#39;]; |
| r | const | 254 | no | const r = await runCli([&#39;drive&#39;, `${ORIGIN}/`, &#39;--prompt&#39;, prompt, &#39;--json&#39;, &#39;--timeout&#39;, &#39;90&#39;], { env, timeoutMs: 150000 }); |
| dj | const | 255 | no | const dj = JSON.parse(r.stdout); |
| candidate | variable | 278 | no | let candidate = null, shadow = null; |
| out | const | 280 | no | const out = await api(servePort, &#39;POST&#39;, &#39;/api/v1/adapters/learned/synthesize&#39;, { siteId: SITE, origin: ORIGIN, sessionIds: [drives[1], drives[2], drives[3]] }); |
| rec | const | 293 | no | const rec = await api(servePort, &#39;POST&#39;, &#39;/api/v1/adapters/learned/promote&#39;, { candidate, sessionIds: [drives[4]], shadow, expectedVersion: null, note: &#39;v1 from three held training captures&#39; }); |
| t | const | 299 | no | const t = await api(servePort, &#39;GET&#39;, `/api/v1/adapters/learned/${SITE}/transcript?session=${drives[4]}`); |
| tabId | const | 309 | no | const tabId = await cdpOpenTab(cdpPort, `${ORIGIN}/`); |
| started | const | 312 | no | const started = await api(servePort, &#39;POST&#39;, &#39;/api/record/start&#39;, { target: tabId }); |
| st | const | 315 | no | const st = await api(servePort, &#39;GET&#39;, &#39;/api/status&#39;); |
| t | const | 320 | no | const t = await api(servePort, &#39;GET&#39;, `/api/v1/adapters/learned/${SITE}/transcript?live=1`); |
| read | const | 331 | no | const read = await api(servePort, &#39;GET&#39;, `/api/v1/adapters/read/${SITE}`); |
| exec | const | 333 | no | const exec = await runCli([&#39;drive&#39;, `${ORIGIN}/`, &#39;--dry-run&#39;, &#39;--json&#39;], { env }); |
| dj | const | 334 | no | const dj = JSON.parse(exec.stdout); |
| drives2 | const | 346 | no | const drives2 = {}; |
| i | variable | 347 | no | let i = 0; |
| r | const | 349 | no | const r = await runCli([&#39;drive&#39;, `${ORIGIN}/`, &#39;--prompt&#39;, prompt, &#39;--json&#39;, &#39;--timeout&#39;, &#39;90&#39;], { env, timeoutMs: 150000 }); |
| dj | const | 350 | no | const dj = JSON.parse(r.stdout); |
| tabId | const | 362 | no | const tabId = await cdpOpenTab(cdpPort, `${ORIGIN}/`); |
| st | const | 368 | no | const st = await api(servePort, &#39;GET&#39;, &#39;/api/status&#39;); |
| drives2 | const | 373 | no | const drives2 = globalThis.__drives2; |
| out | const | 374 | no | const out = await api(servePort, &#39;POST&#39;, &#39;/api/v1/adapters/learned/synthesize&#39;, { siteId: SITE, origin: ORIGIN, sessionIds: [drives2[1], drives2[2]], priorName: SITE, live: true, }); |
| reasons | const | 377 | no | const reasons = [...new Set(out.drift.map((d) =&gt; d.reason))]; |
| drives2 | const | 390 | no | const drives2 = globalThis.__drives2; |
| shadow2 | const | 391 | no | const shadow2 = await api(servePort, &#39;POST&#39;, &#39;/api/v1/adapters/learned/shadow-evaluate&#39;, { candidate: globalThis.__v2candidate, sessionIds: [drives2[3]] }); |
| rec2 | const | 393 | no | const rec2 = await api(servePort, &#39;POST&#39;, &#39;/api/v1/adapters/learned/promote&#39;, { candidate: globalThis.__v2candidate, sessionIds: [drives2[3]], shadow: shadow2, expectedVersion: 1, note: &#39;v2 relearn a… |
| r1 | const | 399 | no | const r1 = await api(servePort, &#39;POST&#39;, `/api/v1/adapters/learned/${SITE}/rollback`, { version: 1, confirm: true, expectedVersion: 2 }); |
| a1 | const | 400 | no | const a1 = await api(servePort, &#39;GET&#39;, `/api/v1/adapters/learned/${SITE}`); |
| sel1 | const | 401 | no | const sel1 = a1.adapter?.userTurn?.selectors?.[0]; |
| r2 | const | 402 | no | const r2 = await api(servePort, &#39;POST&#39;, `/api/v1/adapters/learned/${SITE}/rollback`, { version: 2, confirm: true, expectedVersion: r1.version }); |
| a2 | const | 403 | no | const a2 = await api(servePort, &#39;GET&#39;, `/api/v1/adapters/learned/${SITE}`); |
| sel2 | const | 404 | no | const sel2 = a2.adapter?.userTurn?.selectors?.[0]; |
| gaps | const | 415 | no | const gaps = { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 23 | external |
| node:net | import | 24 | external |
| node:fs | import | 25 | external |
| node:os | import | 26 | external |
| node:path | import | 27 | external |
| node:https | import | 28 | external |
| node:http | import | 29 | external |
| node:url | import | 30 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Adapter Factory end-to-end demonstration: a previously UNSEEN webapp (scripts/adapter-fixture-site.mjs,
// an unregistered synthetic AI chat host) goes from zero handwritten adapters to a versioned,
// READ-ONLY learned adapter through Capture Studio's own evidence path:
//
//   phase 0  prerequisites: openssl self-signed cert, isolated data dir, headless Chrome
//   phase 1  DISCOVER + INTERACT: four real `studio drive` exchanges on the unseen host, through
//            Studio's single actor with GENERIC heuristics only (no adapter exists for it)
//   phase 2  GENERATE: synthesizeWebappAdapter over the three training captures (saved-evidence probes)
//   phase 3  SHADOW VALIDATE: held-out capture replay -> candidate-read-only-preview
//   phase 4  ACTIVATE (read-only): server-side re-verified promotion -> VersionedStore v1
//   phase 5  READ-ONLY CONVERSATION EXPERIENCE: saved-session transcript + LIVE transcript while
//            a capture is attached, plus the registry read view; the execution path is proven
//            untouched (getAdapter still returns nothing for the learned host)
//   phase 6  DRIFT + RELEARN: the site ships a v2 UI (role attribute renamed); two more drives +
//            a live measurement with prior-selector absence -> drift detected -> v2 promoted
//   phase 7  ROLLBACK safety: pointer moves between v1 and v2
//
// Every step prints PASS/FAIL with a one-line detail. Result JSON: <data-dir>/adapter-factory-demo-result.json
// Evidence classes: the fixture host is synthetic (SANDBOX-DEMO); the captures, probes and
// learned adapter are real products of the real pipeline against that real (local) webapp.
// No third-party provider, authenticated surface or Windows-specific claim is made.
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const STUDIO = path.join(ROOT, 'bin', 'studio.mjs');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const oneLine = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

const steps = [];
let failed = false;
async function step(name, fn) {
  const t0 = Date.now();
  try {
    const detail = await fn();
    steps.push({ name, status: 'PASS', ms: Date.now() - t0, detail: oneLine(detail) });
    console.log(`PASS  ${name}  (${Date.now() - t0} ms)  ${oneLine(detail)}`);
  } catch (e) {
    failed = true;
    steps.push({ name, status: 'FAIL', ms: Date.now() - t0, detail: oneLine(e.message) });
    console.log(`FAIL  ${name}  (${Date.now() - t0} ms)  ${oneLine(e.message)}`);
    throw e;
  }
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => { const p = srv.address().port; srv.close(() => resolve(p)); });
  });
}

function findChromeBinary() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const cache = path.join(os.homedir(), '.cache', 'ms-playwright');
  const candidates = [];
  try {
    for (const d of fs.readdirSync(cache).filter((x) => x.startsWith('chromium-') && !x.includes('headless'))) {
      for (const layout of ['chrome-linux/chrome', 'chrome-linux64/chrome']) {
        candidates.push(path.join(cache, d, layout));
      }
    }
  } catch { /* no cache dir */ }
  candidates.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium');
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

async function runCli(args, { env = {}, timeoutMs = 300000 } = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [STUDIO, ...args], {
      env: { ...process.env, ...env },
```

_First 80 of 437 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

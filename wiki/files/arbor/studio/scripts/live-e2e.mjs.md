# File: studio/scripts/live-e2e.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/live-e2e.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 37133 B |
| Lines | 552 |
| Hash | 00375a9cc482 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HERE | const | 47 | no | const HERE = path.dirname(fileURLToPath(import.meta.url)); |
| ROOT | const | 48 | no | const ROOT = path.resolve(HERE, &#39;..&#39;); |
| STUDIO | const | 49 | no | const STUDIO = path.join(ROOT, &#39;bin&#39;, &#39;studio.mjs&#39;); |
| KEEP | const | 50 | no | const KEEP = process.argv.includes(&#39;--keep&#39;); |
| NO_BROWSER | const | 51 | no | const NO_BROWSER = process.argv.includes(&#39;--no-browser&#39;); |
| sleep | function | 53 | no | const sleep = (ms) =&gt; new Promise((r) =&gt; setTimeout(r, ms)); |
| oneLine | function | 54 | no | const oneLine = (s) =&gt; String(s ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| freePort | function | 56 | no | function freePort() { |
| srv | const | 58 | no | const srv = createServer(); |
| safeJson | function | 67 | no | function safeJson(text) { |
| wordsInOrder | function | 72 | no | function wordsInOrder(text, words) { |
| at | variable | 73 | no | let at = -1; |
| i | const | 75 | no | const i = text.indexOf(w, at + 1); |
| main | function | 82 | no | async function main() { |
| startedAt | const | 83 | no | const startedAt = new Date().toISOString(); |
| base | const | 84 | no | const base = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, &#39;Temp&#39;, &#39;opencode&#39;) : path.join(os.tmpdir(), &#39;opencode&#39;); |
| dataDir | const | 85 | no | const dataDir = path.join(base, `cs-live-e2e-${Date.now()}`); |
| cdpPort | const | 87 | no | const cdpPort = await freePort(); |
| childEnv | const | 88 | no | const childEnv = { |
| steps | const | 95 | no | const steps = []; |
| spawned | const | 96 | no | const spawned = []; |
| fixture | variable | 97 | no | let fixture = null; |
| chromePid | variable | 98 | no | let chromePid = null; |
| chromeProfile | variable | 99 | no | let chromeProfile = null; |
| fatal | variable | 100 | no | let fatal = false; |
| SESSION_STEPS | const | 108 | no | const SESSION_STEPS = /^(5\|6\|7\|8\|9\|10\|12) /; |
| step | function | 109 | no | const step = async (name, fn, { prereq = false } = {}) =&gt; { |
| t0 | const | 112 | no | const t0 = Date.now(); |
| r | const | 114 | no | const r = await fn(); |
| runCli | function | 126 | no | const runCli = (args, { timeoutMs = 240000 } = {}) =&gt; new Promise((resolve) =&gt; { const child = spawn(process.execPath, [STUDIO, ...args], { env: childEnv, stdio: [&#39;ignore&#39;, &#39;pipe&#39;, &#39;pipe&#39;], windowsHi… |
| child | const | 127 | no | const child = spawn(process.execPath, [STUDIO, ...args], { env: childEnv, stdio: [&#39;ignore&#39;, &#39;pipe&#39;, &#39;pipe&#39;], windowsHide: true }); |
| stdout | variable | 129 | no | let stdout = &#39;&#39;, stderr = &#39;&#39;; |
| timer | const | 130 | no | const timer = setTimeout(() =&gt; { try { child.kill(); } catch { /* gone */ } }, timeoutMs); |
| spawnCli | function | 138 | no | const spawnCli = (args) =&gt; { |
| child | const | 139 | no | const child = spawn(process.execPath, [STUDIO, ...args], { env: childEnv, stdio: [&#39;ignore&#39;, &#39;pipe&#39;, &#39;pipe&#39;], windowsHide: true }); |
| st | const | 141 | no | const st = { child, stdout: &#39;&#39;, stderr: &#39;&#39; }; |
| waitForJson | function | 147 | no | const waitForJson = async (st, ms = 20000) =&gt; { |
| text | const | 150 | no | const text = st.stdout.trim(); |
| json | const | 152 | no | const json = safeJson(text); |
| sessionId | variable | 161 | no | let sessionId = null; |
| sessionDir | variable | 162 | no | let sessionDir = null; |
| packetResult | variable | 163 | no | let packetResult = null; |
| acceptance | variable | 164 | no | let acceptance = null; |
| browserSkipReason | variable | 165 | no | let browserSkipReason = NO_BROWSER ? &#39;browser steps disabled (--no-browser)&#39; : null; |
| doctor | const | 184 | no | const doctor = await step(&#39;2 doctor&#39;, async () =&gt; { const r = await runCli([&#39;doctor&#39;, &#39;--json&#39;], { timeoutMs: 60000 }); const json = safeJson(r.stdout); const checks = Array.isArray(json?.checks) ? j… |
| r | const | 185 | no | const r = await runCli([&#39;doctor&#39;, &#39;--json&#39;], { timeoutMs: 60000 }); |
| json | const | 186 | no | const json = safeJson(r.stdout); |
| checks | const | 187 | no | const checks = Array.isArray(json?.checks) ? json.checks : []; |
| browserOnly | const | 189 | no | const browserOnly = new Set([&#39;chrome&#39;, &#39;devtools&#39;]); |
| hard | const | 190 | no | const hard = checks.filter((c) =&gt; c.level === &#39;fail&#39; &amp;&amp; !browserOnly.has(c.name)); |
| soft | const | 191 | no | const soft = checks.filter((c) =&gt; c.level === &#39;fail&#39; &amp;&amp; browserOnly.has(c.name)); |
| chromeOk | const | 192 | no | const chromeOk = checks.find((c) =&gt; c.name === &#39;chrome&#39;)?.level === &#39;ok&#39;; |
| detail | const | 195 | no | const detail = `${checks.length} checks ok` + (chromeOk ? &#39;&#39; : &#39; (chrome missing: browser steps will be skipped)&#39;); |
| r | const | 208 | no | const r = await runCli([&#39;launch&#39;, &#39;--headless&#39;, &#39;--json&#39;], { timeoutMs: 90000 }); |
| json | const | 209 | no | const json = safeJson(r.stdout); |
| r | const | 227 | no | const r = await runCli([&#39;capture&#39;, fixture.url, &#39;--idle&#39;, &#39;3&#39;, &#39;--json&#39;], { timeoutMs: 300000 }); |
| json | const | 228 | no | const json = safeJson(r.stdout); |
| r | const | 240 | no | const r = await runCli([&#39;session&#39;, &#39;list&#39;, &#39;--json&#39;], { timeoutMs: 60000 }); |
| json | const | 241 | no | const json = safeJson(r.stdout); |
| sessions | const | 242 | no | const sessions = Array.isArray(json?.sessions) ? json.sessions : []; |
| stats | const | 251 | no | const stats = await runCli([&#39;session&#39;, &#39;stats&#39;, sessionId, &#39;--json&#39;], { timeoutMs: 60000 }); |
| statsJson | const | 252 | no | const statsJson = safeJson(stats.stdout); |
| verify | const | 254 | no | const verify = await runCli([&#39;verify&#39;, sessionId, &#39;--json&#39;], { timeoutMs: 120000 }); |
| verifyJson | const | 255 | no | const verifyJson = safeJson(verify.stdout); |
| d | const | 265 | no | const d = await runCli([&#39;derive&#39;, sessionId, &#39;--full&#39;, &#39;--json&#39;], { timeoutMs: 300000 }); |
| dj | const | 266 | no | const dj = safeJson(d.stdout); |
| s | const | 269 | no | const s = await runCli([&#39;kb&#39;, &#39;search&#39;, CHAT_WORDS[0], &#39;--json&#39;], { timeoutMs: 120000 }); |
| sj | const | 270 | no | const sj = safeJson(s.stdout); |
| hits | const | 271 | no | const hits = Array.isArray(sj?.rows) ? sj.rows.length : Number(sj?.count ?? 0); |
| s | const | 280 | no | const s = await runCli([&#39;kb&#39;, &#39;search&#39;, CHAT_WORD_TYPO, &#39;--json&#39;], { timeoutMs: 120000 }); |
| sj | const | 281 | no | const sj = safeJson(s.stdout); |
| hits | const | 282 | no | const hits = Array.isArray(sj?.rows) ? sj.rows.length : Number(sj?.count ?? 0); |
| session | const | 289 | no | const session = Session.open(path.join(dataDir, &#39;sessions&#39;), sessionId); |
| before | const | 295 | no | const before = rawDigest(session).digest; |
| moduleUrl | const | 296 | no | const moduleUrl = pathToFileURL(path.resolve(ROOT, &#39;src/export/saved-session-outcome.mjs&#39;)); |
| p | const | 299 | no | const p = packetResult.packet; |
| exportDir | const | 311 | no | const exportDir = path.join(dataDir, &#39;exports&#39;); |
| eventsFile | const | 313 | no | const eventsFile = path.join(exportDir, `${sessionId}-events.jsonl`); |
| transcriptFile | const | 314 | no | const transcriptFile = path.join(exportDir, `${sessionId}-transcript.md`); |
| e | const | 315 | no | const e = await runCli([&#39;export&#39;, &#39;dataset&#39;, sessionId, &#39;--dataset&#39;, &#39;events&#39;, &#39;--format&#39;, &#39;jsonl&#39;, &#39;--out&#39;, eventsFile], { timeoutMs: 120000 }); |
| t | const | 317 | no | const t = await runCli([&#39;export&#39;, &#39;transcript&#39;, sessionId, &#39;--format&#39;, &#39;md&#39;, &#39;--out&#39;, transcriptFile], { timeoutMs: 120000 }); |
| eventsText | const | 319 | no | const eventsText = fs.readFileSync(eventsFile, &#39;utf8&#39;); |
| transcriptText | const | 320 | no | const transcriptText = fs.readFileSync(transcriptFile, &#39;utf8&#39;); |
| inEvents | const | 321 | no | const inEvents = wordsInOrder(eventsText, CHAT_WORDS); |
| inTranscript | const | 322 | no | const inTranscript = wordsInOrder(transcriptText, CHAT_WORDS); |
| st | const | 335 | no | const st = spawnCli([&#39;mirror&#39;, sessionId, &#39;--port&#39;, &#39;0&#39;, &#39;--json&#39;]); |
| info | const | 336 | no | const info = await waitForJson(st, 30000); |
| baseUrl | const | 337 | no | const baseUrl = String(info.url ?? &#39;&#39;).replace(/\\/+$/, &#39;&#39;); |
| itemsRes | const | 339 | no | const itemsRes = await fetch(`${baseUrl}/api/items`, { signal: AbortSignal.timeout(30000) }); |
| itemsText | const | 340 | no | const itemsText = await itemsRes.text(); |
| itemsJson | const | 342 | no | const itemsJson = safeJson(itemsText); |
| chatRes | const | 344 | no | const chatRes = await fetch(`${baseUrl}/api/chat`, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39; }, body: JSON.stringify({ prompt: &#39;hello fixture&#39; }), signal: AbortSignal.timeout(60… |
| chatText | const | 345 | no | const chatText = await chatRes.text(); |
| csvFile | const | 356 | no | const csvFile = path.join(dataDir, &#39;fixture-data.csv&#39;); |
| csvRes | const | 357 | no | const csvRes = await fetch(`${fixture.url}data.csv`); |
| csvBody | const | 358 | no | const csvBody = await csvRes.text(); |
| csv | const | 360 | no | const csv = await runCli([&#39;csv&#39;, csvFile, &#39;--json&#39;], { timeoutMs: 60000 }); |
| csvJson | const | 361 | no | const csvJson = safeJson(csv.stdout); |
| columns | const | 363 | no | const columns = (Array.isArray(csvJson.header) ? csvJson.header.length : 0) \|\| (Array.isArray(csvJson.columns) ? csvJson.columns.length : 0); |
| rows | const | 364 | no | const rows = (Array.isArray(csvJson.records) ? csvJson.records.length : 0) \|\| (Array.isArray(csvJson.rows) ? csvJson.rows.length : 0) \|\| Number(csvJson.stats?.rows ?? 0); |
| detect | const | 366 | no | const detect = await runCli([&#39;detect&#39;, csvFile, &#39;--json&#39;], { timeoutMs: 60000 }); |
| detectJson | const | 367 | no | const detectJson = safeJson(detect.stdout); |
| dedupeNote | const | 369 | no | const dedupeNote = sessionId &amp;&amp; !fatal |
| dir | const | 379 | no | const dir = sessionDir ?? path.join(dataDir, &#39;sessions&#39;, sessionId); |
| b | const | 380 | no | const b = await runCli([&#39;integrity&#39;, &#39;build&#39;, dir, &#39;--json&#39;], { timeoutMs: 120000 }); |
| bj | const | 381 | no | const bj = safeJson(b.stdout); |
| v | const | 383 | no | const v = await runCli([&#39;integrity&#39;, &#39;verify&#39;, dir, &#39;--json&#39;], { timeoutMs: 120000 }); |
| vj | const | 384 | no | const vj = safeJson(v.stdout); |
| st | const | 394 | no | const st = spawnCli([&#39;serve&#39;, &#39;--studio-port&#39;, &#39;0&#39;, &#39;--no-open&#39;, &#39;--json&#39;]); |
| info | const | 395 | no | const info = await waitForJson(st, 30000); |
| token | const | 396 | no | const token = new URL(info.url).searchParams.get(&#39;token&#39;); |
| headers | const | 397 | no | const headers = token ? { &#39;x-studio-token&#39;: token } : {}; |
| origin | const | 398 | no | const origin = `http://127.0.0.1:${info.port}`; |
| statsRes | const | 399 | no | const statsRes = await fetch(`${origin}/api/x/stats`, { headers, signal: AbortSignal.timeout(30000) }); |
| statsText | const | 400 | no | const statsText = await statsRes.text(); |
| platformRes | const | 402 | no | const platformRes = await fetch(`${origin}/platform`, { headers, signal: AbortSignal.timeout(30000) }); |
| platformText | const | 404 | no | const platformText = await platformRes.text(); |
| get | function | 407 | no | const get = async (suffix) =&gt; { |
| response | const | 408 | no | const response = await fetch(`${origin}/api/sessions/${encodeURIComponent(sessionId)}${suffix}`, { headers, signal: AbortSignal.timeout(30000) }); |
| saved | const | 412 | no | const saved = await get(&#39;&#39;); |
| label | const | 414 | no | const label = await get(&#39;/acceptance&#39;); |
| turns | const | 417 | no | const turns = await get(&#39;/turns&#39;); |
| index | const | 419 | no | const index = Number(e.canonical.json_pointer.split(&#39;/&#39;)[1]); |
| linked | const | 421 | no | const linked = await fetch(new URL(e.canonical.ui_href, origin), { headers }); |
| postBody | const | 429 | no | const postBody = JSON.stringify({ conversation: { prompt: &#39;hello fixture&#39;, expectedReplyWords: [...CHAT_WORDS], completionRule: { requireDone: true, stableObserved: true }, baseline: { userTurns: 0, … |
| postRes | const | 431 | no | const postRes = await fetch(`${origin}/api/sessions/${encodeURIComponent(sessionId)}/acceptance`, { method: &#39;POST&#39;, headers: { ...headers, &#39;content-type&#39;: &#39;application/json&#39; }, signal: AbortSignal.ti… |
| receipt | const | 434 | no | const receipt = await postRes.json(); |
| after | const | 438 | no | const after = await get(&#39;/acceptance&#39;); |
| runsUrl | const | 443 | no | const runsUrl = `${origin}/api/v1/harness/runs`; |
| manifest | const | 444 | no | const manifest = await (await fetch(`${origin}/api/v1/integrations/tools`, { headers, signal: AbortSignal.timeout(30000) })).json(); |
| runRes | const | 448 | no | const runRes = await fetch(runsUrl, { method: &#39;POST&#39;, headers: { ...headers, &#39;content-type&#39;: &#39;application/json&#39; }, body: JSON.stringify({ task: &#39;live-e2e harness verification&#39; }) }); |
| run | const | 450 | no | const run = (await runRes.json()).run; |
| stepCall | function | 451 | no | const stepCall = (key, tool, args) =&gt; fetch(`${runsUrl}/${run.id}/steps`, { method: &#39;POST&#39;, headers: { ...headers, &#39;content-type&#39;: &#39;application/json&#39; }, body: JSON.stringify({ key, tool, arguments: a… |
| exec | const | 453 | no | const exec = await (await stepCall(&#39;list-1&#39;, &#39;list_conversations&#39;, {})).json(); |
| replay | const | 457 | no | const replay = await (await stepCall(&#39;list-1&#39;, &#39;list_conversations&#39;, {})).json(); |
| conflict | const | 459 | no | const conflict = await stepCall(&#39;list-1&#39;, &#39;list_conversations&#39;, { differing: true }); |
| fin | const | 461 | no | const fin = await (await fetch(`${runsUrl}/${run.id}/finish`, { method: &#39;POST&#39;, headers: { ...headers, &#39;content-type&#39;: &#39;application/json&#39; }, body: JSON.stringify({ status: &#39;succeeded&#39; }) })).json(); |
| obsRes | const | 467 | no | const obsRes = await fetch(`${origin}/api/v1/sessions/${encodeURIComponent(sessionId)}/observation`, { headers, signal: AbortSignal.timeout(30000) }); |
| obs | const | 469 | no | const obs = (await obsRes.json()).observation; |
| info | const | 498 | no | const info = safeJson(execFileSync(&#39;powershell.exe&#39;, [&#39;-NoProfile&#39;, &#39;-Command&#39;, `Get-CimInstance Win32_Process -Filter &quot;ProcessId = ${Number(chromePid)}&quot; \| Select-Object ProcessId,Name,CommandLine \| … |
| killError | variable | 504 | no | let killError = null; |
| remaining | const | 507 | no | const remaining = execFileSync(&#39;powershell.exe&#39;, [&#39;-NoProfile&#39;, &#39;-Command&#39;, `Get-CimInstance Win32_Process -Filter &quot;ProcessId = ${Number(chromePid)}&quot; \| Select-Object ProcessId \| ConvertTo-Json -Compr… |
| failures | const | 523 | no | const failures = steps.filter((s) =&gt; s.status === &#39;FAIL&#39;); |
| skipped | const | 524 | no | const skipped = steps.filter((s) =&gt; s.status === &#39;SKIP&#39;); |
| passed | const | 525 | no | const passed = steps.filter((s) =&gt; s.status === &#39;PASS&#39;); |
| finishedAt | const | 526 | no | const finishedAt = new Date().toISOString(); |
| result | const | 527 | no | const result = { |
| width | const | 536 | no | const width = Math.max(36, ...steps.map((s) =&gt; s.name.length)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 37 | external |
| node:net | import | 38 | external |
| node:fs | import | 39 | external |
| node:os | import | 40 | external |
| node:path | import | 41 | external |
| node:url | import | 42 | external |
| ./fixture-site.mjs | import | 43 | [studio/scripts/fixture-site.mjs](./fixture-site.mjs.md) |
| ../src/store/session.mjs | import | 44 | [studio/src/store/session.mjs](../src/store/session.mjs.md) |
| ../src/capture/acceptance.mjs | import | 45 | [studio/src/capture/acceptance.mjs](../src/capture/acceptance.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Capture Studio — live end-to-end driver.
//
//   node scripts/live-e2e.mjs [--keep] [--no-browser]
//
// The driver spawns the real CLI (bin/studio.mjs) against an isolated data directory and a
// local fixture site (scripts/fixture-site.mjs), then walks the whole product path:
//
//    1  start the fixture site
//    2  studio doctor
//    3  launch a headless Chrome through the CLI (studio launch --headless)
//    4  studio capture <fixture-url> --idle 3 --json              (record + derive in one shot)
//    5  studio session list --json                                 contains the new session
//    6  studio session stats <id> and studio verify <id>
//    7  studio derive <id> --full, then studio kb search "<word>"  >= 1 hit
//    8  studio kb search "<word with a typo>"                     >= 1 hit (fuzzy)
//    9  studio export dataset / export transcript                  the streamed words in order
//   10  studio mirror <id> --port 0                               replayed JSON + replayed SSE
//   11  studio dedupe <id>, studio detect and studio csv on the fixture /data.csv body
//   12  studio integrity build <session dir> then studio integrity verify
//   13  studio serve (studio UI only): GET /api/x/stats and GET /platform
//
// Every step prints PASS / FAIL / SKIP with its duration and a one-line detail. The run stops
// early only when a prerequisite step fails; the remaining steps are then reported as SKIP.
//
// Isolation: the CLI always runs with CAPTURE_STUDIO_HOME set to a fresh temporary data
// directory and CAPTURE_STUDIO_CDP_PORT set to a free port, so the real user data folder and
// the user's own browser are never touched. The Chrome this driver starts is killed at the end.
//
// Flags:
//   --keep         Keep the isolated Chrome profile directory (default: it is removed).
//   --no-browser   Skip every browser-dependent step; no Chrome is started.
//
// A summary table is printed and the machine-readable result is written to
// <data-dir>/live-e2e-result.json. Exit code 0 only when no step failed.

import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startFixture, CHAT_WORDS, CHAT_WORD_TYPO, ITEMS, CSV_TEXT } from './fixture-site.mjs';
import { Session } from '../src/store/session.mjs';
import { readAcceptance, rawDigest } from '../src/capture/acceptance.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const STUDIO = path.join(ROOT, 'bin', 'studio.mjs');
const KEEP = process.argv.includes('--keep');
const NO_BROWSER = process.argv.includes('--no-browser');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const oneLine = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function safeJson(text) {
  try { return JSON.parse(String(text ?? '').trim()); } catch { return null; }
}

// True when the words appear in `text` in this order (not necessarily adjacent).
function wordsInOrder(text, words) {
  let at = -1;
  for (const w of words) {
    const i = text.indexOf(w, at + 1);
    if (i < 0) return false;
    at = i;
  }
  return true;
}
```

_First 80 of 553 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

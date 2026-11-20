# File: studio/scripts/human-check.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/human-check.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 20773 B |
| Lines | 450 |
| Hash | 5f85c32d2fab |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEFAULT_TEXT | const | 34 | no | const DEFAULT_TEXT = &#39;The quick brown fox jumps over 13 lazy dogs near the river bank.&#39;; |
| HOST | const | 35 | no | const HOST = &#39;127.0.0.1&#39;; |
| FIXTURE_NAME | const | 36 | no | const FIXTURE_NAME = &#39;aion-human-check.html&#39;; |
| parseArgs | function | 41 | no | function parseArgs(argv) { |
| out | const | 42 | no | const out = { port: 9222, text: DEFAULT_TEXT, json: false, keepOpen: false }; |
| a | const | 44 | no | const a = argv[i]; |
| sleep | function | 63 | no | const sleep = (ms) =&gt; new Promise((r) =&gt; setTimeout(r, ms)); |
| norm | function | 64 | no | const norm = (s) =&gt; String(s ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| round | function | 65 | no | const round = (n) =&gt; (Number.isFinite(n) ? Math.round(n * 1000) / 1000 : null); |
| stats | function | 67 | no | function stats(values) { |
| sorted | const | 69 | no | const sorted = [...values].sort((a, b) =&gt; a - b); |
| sum | const | 70 | no | const sum = sorted.reduce((a, b) =&gt; a + b, 0); |
| at | function | 71 | no | const at = (q) =&gt; sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))]; |
| FIXTURE_HTML | const | 84 | no | const FIXTURE_HTML = `&lt;!doctype html&gt; |
| TYPES | variable | 108 | no | var TYPES = [&#39;keydown&#39;, &#39;keypress&#39;, &#39;keyup&#39;, &#39;input&#39;, &#39;beforeinput&#39;]; |
| targetId | function | 109 | no | function targetId(t) { |
| MEASURE | const | 136 | no | const MEASURE = `(() =&gt; { const norm = (s) =&gt; String(s == null ? &#39;&#39; : s).replace(/\\\\s+/g, &#39; &#39;).trim(); const ev = Array.isArray(window.__ev) ? window.__ev : []; const TYPES = [&#39;keydown&#39;, &#39;keypress&#39;, … |
| norm | function | 137 | no | const norm = (s) =&gt; String(s == null ? &#39;&#39; : s).replace(/\\\\s+/g, &#39; &#39;).trim(); |
| ev | const | 138 | no | const ev = Array.isArray(window.__ev) ? window.__ev : []; |
| TYPES | const | 139 | no | const TYPES = [&#39;keydown&#39;, &#39;keypress&#39;, &#39;keyup&#39;, &#39;input&#39;, &#39;beforeinput&#39;]; |
| counts | function | 140 | no | const counts = (target) =&gt; { |
| out | const | 141 | no | const out = {}; |
| input | const | 145 | no | const input = document.getElementById(&#39;i&#39;); |
| editable | const | 146 | no | const editable = document.getElementById(&#39;e&#39;); |
| kd | const | 147 | no | const kd = ev.filter((e) =&gt; e.type === &#39;keydown&#39; &amp;&amp; e.target === &#39;i&#39;); |
| gaps | const | 148 | no | const gaps = []; |
| trusted | const | 150 | no | const trusted = { keydown: 0, input: 0 }; |
| evaluate | function | 171 | no | async function evaluate(page, expression) { |
| waitForPageReady | function | 184 | no | async function waitForPageReady(page, { timeoutMs = 8000 } = {}) { |
| deadline | const | 185 | no | const deadline = Date.now() + timeoutMs; |
| last | variable | 186 | no | let last = null; |
| state | const | 189 | no | const state = await evaluate(page, &#39;({ ready: document.readyState, hasInput: !!document.getElementById(&quot;i&quot;), hasEditor: !!document.getElementById(&quot;e&quot;), hasRecorder: Array.isArray(window.__ev) })&#39;); |
| focusField | function | 200 | no | async function focusField(page, id) { |
| el | const | 202 | no | const el = document.getElementById(${JSON.stringify(id)}); |
| sel | const | 207 | no | const sel = window.getSelection(); |
| addCheck | function | 213 | no | function addCheck(checks, name, pass, detail) { |
| main | function | 220 | no | async function main() { |
| args | variable | 221 | no | let args; |
| say | function | 230 | no | const say = (line) =&gt; { if (!args.json) process.stderr.write(`${line}\\n`); }; |
| base | const | 231 | no | const base = endpointBase({ host: HOST, port: args.port }); |
| human | variable | 236 | no | let human; |
| wsUrl | variable | 256 | no | let wsUrl; |
| fixturePath | const | 269 | no | const fixturePath = path.join(os.tmpdir(), FIXTURE_NAME); |
| fixtureUrl | const | 271 | no | const fixtureUrl = pathToFileURL(fixturePath).href; |
| conn | variable | 273 | no | let conn = null; |
| targetId | variable | 274 | no | let targetId = null; |
| page | variable | 275 | no | let page = null; |
| receipt | const | 276 | no | const receipt = { |
| newUrl | const | 286 | no | const newUrl = `${base}/json/new?${encodeURIComponent(fixtureUrl)}`; |
| info | variable | 287 | no | let info = null; |
| lastStatus | variable | 288 | no | let lastStatus = &#39;&#39;; |
| res | const | 291 | no | const res = await fetch(newUrl, { method }); |
| targets | const | 300 | no | const targets = await listTargets({ host: HOST, port: args.port }); |
| hit | const | 301 | no | const hit = targets.find((t) =&gt; String(t.url ?? &#39;&#39;).includes(FIXTURE_NAME)); |
| ready | const | 310 | no | const ready = await evaluate(page, &#39;({ ready: document.readyState })&#39;); |
| prep | const | 314 | no | const prep = await prepareHumanEnvironment(page, { focus: true }); |
| chars | const | 319 | no | const chars = Array.from(args.text).length; |
| inputResult | variable | 322 | no | let inputResult = null; |
| inputError | variable | 323 | no | let inputError = null; |
| afterInput | const | 326 | no | const afterInput = await evaluate(page, MEASURE); |
| editableResult | variable | 329 | no | let editableResult = null; |
| editableError | variable | 330 | no | let editableError = null; |
| afterEditable | const | 333 | no | const afterEditable = await evaluate(page, MEASURE); |
| corrections | const | 336 | no | const corrections = Number(inputResult?.stats?.corrections ?? 0); |
| expectedKeydown | const | 339 | no | const expectedKeydown = chars + corrections * 2; |
| keydownCount | const | 340 | no | const keydownCount = afterInput?.counts?.input?.keydown ?? 0; |
| inputEvents | const | 341 | no | const inputEvents = afterInput?.counts?.input?.input ?? 0; |
| gapStats | const | 342 | no | const gapStats = stats(afterEditable &amp;&amp; afterInput ? afterInput.gaps ?? [] : []); |
| sub15 | const | 343 | no | const sub15 = (afterInput?.gaps ?? []).filter((g) =&gt; g &lt; 15); |
| gapsBelow5 | const | 344 | no | const gapsBelow5 = (afterInput?.gaps ?? []).filter((g) =&gt; g &lt; 5); |
| ua | const | 345 | no | const ua = String(afterEditable?.env?.ua ?? &#39;&#39;); |
| webdriver | const | 346 | no | const webdriver = afterEditable?.env?.webdriver ?? null; |
| hasFocus | const | 347 | no | const hasFocus = afterEditable?.env?.hasFocus ?? null; |
| checks | const | 386 | no | const checks = receipt.checks; |
| KEEP_ALIVE | const | 436 | no | const KEEP_ALIVE = setInterval(() =&gt; {}, 1000); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 27 | external |
| node:os | import | 28 | external |
| node:path | import | 29 | external |
| node:url | import | 30 | external |
| ../src/cdp/client.mjs | import | 31 | [studio/src/cdp/client.mjs](../src/cdp/client.mjs.md) |
| ../src/cdp/discovery.mjs | import | 32 | [studio/src/cdp/discovery.mjs](../src/cdp/discovery.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Capture Studio — human-typing verification harness.
//
//   node scripts/human-check.mjs [--port 9222] [--text "..."] [--json] [--keep-open]
//
// Proves that src/capture/human.mjs types like a person and not like a script, without touching
// a real website. It builds a data-only local fixture page in the OS temp directory, opens it as
// a file:// tab over the project's own CDP plumbing, then measures what the page actually saw.
//
// Measured (each one becomes a check in the receipt):
//   * keydown count on the input  == characters typed + deliberate corrections
//   * the input's value           == the text that was typed (whitespace-normalised)
//   * the contenteditable's text  == the text that was typed (whitespace-normalised)
//   * input events on the input   >= one per typed character
//   * inter-key gaps              min >= 5 ms, max <= 2000 ms, zero gaps < 15 ms
//   * navigator.webdriver         === false
//   * document.hasFocus()         reported; WARN (not a failure) when the OS window is unfocused
//   * user agent                  does not contain "HeadlessChrome"
//
// Output: one JSON receipt on stdout ({ ok, checks, gaps, events, env }). A short human summary
// goes to stderr (suppressed by --json). Exit 0 = all checks passed, 1 = a check failed,
// 2 = environment failure (no CDP on the port, or the sibling module is missing).
//
// Safety: only the local fixture is typed into. Nothing about the person's profile is changed
// beyond opening (and, by default, closing) one file:// tab.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { CdpConnection } from '../src/cdp/client.mjs';
import { browserWsUrl, endpointBase, listTargets } from '../src/cdp/discovery.mjs';

const DEFAULT_TEXT = 'The quick brown fox jumps over 13 lazy dogs near the river bank.';
const HOST = '127.0.0.1';
const FIXTURE_NAME = 'aion-human-check.html';

// ---------------------------------------------------------------------------------------------
// argv
// ---------------------------------------------------------------------------------------------
function parseArgs(argv) {
  const out = { port: 9222, text: DEFAULT_TEXT, json: false, keepOpen: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') out.json = true;
    else if (a === '--keep-open') out.keepOpen = true;
    else if (a === '--port') out.port = Number(argv[++i]);
    else if (a.startsWith('--port=')) out.port = Number(a.slice(7));
    else if (a === '--text') out.text = String(argv[++i] ?? '');
    else if (a.startsWith('--text=')) out.text = a.slice(7);
    else if (a === '--help' || a === '-h') { out.help = true; }
    else throw new Error(`Unknown argument: ${a}`);
  }
  if (!Number.isInteger(out.port) || out.port <= 0 || out.port > 65535) {
    throw new Error(`--port must be an integer between 1 and 65535 (got ${out.port})`);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const round = (n) => (Number.isFinite(n) ? Math.round(n * 1000) / 1000 : null);

function stats(values) {
  if (!values.length) return { count: 0, mean: null, median: null, p95: null, min: null, max: null };
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const at = (q) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))];
  return {
    count: sorted.length,
    mean: round(sum / sorted.length),
    median: round(at(0.5)),
    p95: round(at(0.95)),
    min: round(sorted[0]),
    max: round(sorted[sorted.length - 1]),
  };
}
```

_First 80 of 451 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

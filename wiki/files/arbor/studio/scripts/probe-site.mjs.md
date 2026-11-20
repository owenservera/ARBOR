# File: studio/scripts/probe-site.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/probe-site.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 33656 B |
| Lines | 743 |
| Hash | 5da09830c789 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HERE | const | 31 | no | const HERE = path.dirname(fileURLToPath(import.meta.url)); |
| ROOT | const | 32 | no | const ROOT = path.resolve(HERE, &#39;..&#39;); |
| DEFAULT_OUT | const | 33 | no | const DEFAULT_OUT = path.join(ROOT, &#39;docs&#39;, &#39;research&#39;, &#39;probe&#39;); |
| collectPageFacts | function | 39 | no | function collectPageFacts() { |
| normText | function | 40 | no | const normText = (v) =&gt; String(v == null ? &#39;&#39; : v).replace(/\\u00a0/g, &#39; &#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| vis | function | 42 | no | const vis = (el) =&gt; { |
| r | const | 44 | no | const r = el.getBoundingClientRect(); |
| cs | const | 46 | no | const cs = getComputedStyle(el); |
| rectOf | function | 51 | no | const rectOf = (el) =&gt; { |
| r | const | 52 | no | const r = el.getBoundingClientRect(); |
| esc | function | 56 | no | const esc = (s) =&gt; { |
| v | const | 57 | no | const v = String(s); |
| unique | function | 62 | no | const unique = (sel) =&gt; { |
| stableSelector | function | 68 | no | const stableSelector = (el) =&gt; { |
| v | const | 72 | no | const v = el.getAttribute &amp;&amp; el.getAttribute(attr); |
| s | const | 74 | no | const s = el.tagName.toLowerCase() + &#39;[&#39; + attr + &#39;=&quot;&#39; + String(v).replace(/&quot;/g, &#39;\\\\&quot;&#39;) + &#39;&quot;]&#39;; |
| parts | const | 77 | no | const parts = []; |
| cur | variable | 78 | no | let cur = el; |
| depth | variable | 79 | no | let depth = 0; |
| part | variable | 81 | no | let part = cur.tagName.toLowerCase(); |
| parent | const | 82 | no | const parent = cur.parentElement; |
| sameTag | const | 84 | no | const sameTag = []; |
| candidate | const | 89 | no | const candidate = parts.join(&#39; &gt; &#39;); |
| describe | function | 97 | no | const describe = (el) =&gt; { |
| bits | const | 98 | no | const bits = []; |
| v | const | 100 | no | const v = el.getAttribute &amp;&amp; el.getAttribute(attr); |
| t | const | 103 | no | const t = normText(el.innerText \|\| el.textContent \|\| &#39;&#39;); |
| isBlocked | function | 108 | no | const isBlocked = (el) =&gt; el.disabled === true \|\| el.readOnly === true \|\| el.getAttribute(&#39;aria-disabled&#39;) === &#39;true&#39;; |
| isSearchLike | function | 112 | no | const isSearchLike = (el) =&gt; { |
| meta | const | 113 | no | const meta = [ |
| composerSelectorList | const | 125 | no | const composerSelectorList = [&#39;textarea&#39;, &#39;[contenteditable]&#39;, &#39;[role=&quot;textbox&quot;]&#39;]; |
| composerCandidates | const | 126 | no | const composerCandidates = []; |
| seenComposers | const | 127 | no | const seenComposers = new Set(); |
| els | variable | 129 | no | let els = []; |
| form | const | 136 | no | const form = el.closest(&#39;form&#39;); |
| genericSels | const | 155 | no | const genericSels = [&#39;textarea&#39;, &#39;[contenteditable=&quot;true&quot;]&#39;, &#39;[contenteditable=&quot;&quot;]&#39;, &#39;[role=&quot;textbox&quot;]&#39;]; |
| cands | const | 156 | no | const cands = []; |
| els | variable | 158 | no | let els = []; |
| r | const | 163 | no | const r = el.getBoundingClientRect(); |
| genericWinner | const | 168 | no | const genericWinner = cands.length |
| sendRe | const | 184 | no | const sendRe = /send\|submit\|arrow\|stop\|enviar\|envoyer\|envoi\|senden\|absenden\|invia\|отправ\|送信\|发送\|detener\|arr[eê]ter\|stoppen\|interrump/i; |
| sendControls | const | 185 | no | const sendControls = []; |
| seenButtons | const | 186 | no | const seenButtons = new Set(); |
| label | const | 191 | no | const label = normText( (b.getAttribute(&#39;aria-label&#39;) \|\| &#39;&#39;) + &#39; &#39; + (b.getAttribute(&#39;title&#39;) \|\| &#39;&#39;) + &#39; &#39; + (b.getAttribute(&#39;data-testid&#39;) \|\| &#39;&#39;) + &#39; &#39; + (b.getAttribute(&#39;data-test-id&#39;) \|\| &#39;&#39;) + &#39; &#39;… |
| assistantSels | const | 213 | no | const assistantSels = [ |
| assistantContainers | const | 223 | no | const assistantContainers = []; |
| seenAssist | const | 224 | no | const seenAssist = new Set(); |
| els | variable | 226 | no | let els = []; |
| text | const | 233 | no | const text = String(el.innerText \|\| el.textContent \|\| &#39;&#39;); |
| streamingSels | const | 245 | no | const streamingSels = [ |
| streamingMarkers | const | 252 | no | const streamingMarkers = []; |
| els | variable | 254 | no | let els = []; |
| visible | variable | 256 | no | let visible = 0; |
| classCounts | const | 267 | no | const classCounts = new Map(); |
| scanned | variable | 268 | no | let scanned = 0; |
| cn | const | 271 | no | const cn = String(el.getAttribute(&#39;class&#39;) \|\| &#39;&#39;).trim(); |
| pageClasses | const | 275 | no | const pageClasses = Array.from(classCounts.entries()) |
| pathname | variable | 282 | no | let pathname = &#39;&#39;; |
| urlWall | const | 284 | no | const urlWall = /(^\|\\/)(login\|log-in\|signin\|sign-in\|auth\|authorize\|signup\|register)(\\/\|$)/.test(pathname); |
| loginLinks | const | 285 | no | const loginLinks = []; |
| els | variable | 287 | no | let els = []; |
| bodyText | const | 296 | no | const bodyText = String((document.body &amp;&amp; document.body.innerText) \|\| &#39;&#39;).slice(0, 4000); |
| wallMatch | const | 297 | no | const wallMatch = bodyText.match(/(sign in to continue\|log in to continue\|you need to sign in\|please sign in\|you must be signed in\|continue with google\|continue with email\|enter your email\|sign up to… |
| chatComposers | const | 300 | no | const chatComposers = composerCandidates.filter((c) =&gt; !c.searchLike &amp;&amp; ( c.isContentEditable === true \|\| c.tag === &#39;textarea&#39; \|\| c.tag === &#39;input&#39; \|\| c.matched === &#39;[role=&quot;textbox&quot;]&#39; )); |
| hasComposer | const | 303 | no | const hasComposer = chatComposers.length &gt; 0; |
| evidence | const | 304 | no | const evidence = []; |
| loggedOut | const | 310 | no | const loggedOut = !hasComposer &amp;&amp; (urlWall \|\| loginLinks.length &gt; 0 \|\| !!wallMatch); |
| hostMatches | function | 337 | no | function hostMatches(adapter, url) { |
| host | variable | 338 | no | let host = &#39;&#39;; |
| bare | const | 340 | no | const bare = host.replace(/^www\\./, &#39;&#39;); |
| w | const | 342 | no | const w = String(raw).toLowerCase().replace(/^www\\./, &#39;&#39;); |
| bareHost | function | 348 | no | function bareHost(value) { |
| v | variable | 349 | no | let v = String(value ?? &#39;&#39;).trim().toLowerCase(); |
| slugify | function | 357 | no | function slugify(value) { |
| pathPattern | function | 362 | no | function pathPattern(rawUrl) { |
| u | variable | 363 | no | let u; |
| p | variable | 365 | no | let p = u.pathname |
| evaluate | function | 373 | no | async function evaluate(page, expression, { awaitPromise = true, returnByValue = true } = {}) { |
| r | const | 374 | no | const r = await page.send(&#39;Runtime.evaluate&#39;, { expression, awaitPromise, returnByValue }); |
| d | const | 376 | no | const d = r.exceptionDetails; |
| openTab | function | 382 | no | async function openTab(port, url) { |
| endpoint | const | 383 | no | const endpoint = `http://127.0.0.1:${port}/json/new?${encodeURI(url)}`; |
| res | variable | 384 | no | let res = await fetch(endpoint, { method: &#39;PUT&#39; }); |
| waitForTargetId | function | 390 | no | async function waitForTargetId(port, id, { timeoutMs = 20000, intervalMs = 300 } = {}) { |
| deadline | const | 391 | no | const deadline = Date.now() + timeoutMs; |
| targets | const | 393 | no | const targets = await listTargets({ port }).catch(() =&gt; []); |
| hit | const | 394 | no | const hit = id ? targets.find((t) =&gt; t.id === id) : null; |
| waitForLoaded | function | 401 | no | async function waitForLoaded(page, deadlineMs) { |
| deadline | const | 402 | no | const deadline = Date.now() + deadlineMs; |
| state | variable | 404 | no | let state = null; |
| composerHasDraft | function | 413 | no | async function composerHasDraft(page) { |
| v | const | 415 | no | const v = await evaluate(page, `(() =&gt; { for (const el of document.querySelectorAll(&#39;textarea,[contenteditable=&quot;true&quot;],[role=&quot;textbox&quot;]&#39;)) { const r = el.getBoundingClientRect(); if (!(r.width &gt; 1 &amp;&amp;… |
| r | const | 417 | no | const r = el.getBoundingClientRect(); |
| t | const | 419 | no | const t = String(el.value != null &amp;&amp; el.tagName === &#39;TEXTAREA&#39; ? el.value : (el.innerText \|\| el.textContent \|\| &#39;&#39;)).trim(); |
| createNetworkRecorder | function | 431 | no | function createNetworkRecorder(page) { |
| requests | const | 432 | no | const requests = new Map(); |
| websockets | const | 433 | no | const websockets = []; |
| websocketFrames | variable | 434 | no | let websocketFrames = 0; |
| failed | variable | 435 | no | let failed = 0; |
| entry | const | 450 | no | const entry = requests.get(p.requestId); |
| headers | const | 454 | no | const headers = p.response?.headers \|\| {}; |
| ct | const | 455 | no | const ct = headers[&#39;content-type&#39;] \|\| headers[&#39;Content-Type&#39;] \|\| null; |
| host | variable | 460 | no | let host = &#39;&#39;; |
| list | const | 473 | no | const list = []; |
| interesting | const | 478 | no | const interesting = /(chat\|completion\|conversation\|message\|generate\|stream\|reply\|chat_)/i; |
| byPattern | const | 479 | no | const byPattern = new Map(); |
| pattern | const | 483 | no | const pattern = pathPattern(entry.url); |
| key | const | 484 | no | const key = pattern + &#39; &#39; + entry.method; |
| prev | const | 485 | no | const prev = byPattern.get(key); |
| parseArgs | function | 513 | no | function parseArgs(argv) { |
| out | const | 514 | no | const out = { input: null, port: 9222, outDir: DEFAULT_OUT, wait: 8, keepOpen: false, reload: false, help: false, errors: [] }; |
| a | const | 516 | no | const a = argv[i]; |
| HELP | const | 529 | no | const HELP = `probe-site — read-only DOM/transport probe for one AI chat site |
| main | function | 544 | no | async function main() { |
| args | const | 545 | no | const args = parseArgs(process.argv.slice(2)); |
| errors | const | 550 | no | const errors = []; |
| port | const | 551 | no | const port = args.port; |
| isUrl | const | 558 | no | const isUrl = /^[a-z][a-z0-9+.-]*:\\/\\//i.test(args.input); |
| adapter | const | 559 | no | const adapter = await getAdapter(args.input); |
| site | const | 560 | no | const site = adapter?.id ?? (isUrl ? slugify(args.input) : slugify(args.input)); |
| targets | variable | 563 | no | let targets = []; |
| matchFor | const | 567 | no | const matchFor = (adapter ?? { hosts: [bareHost(args.input)] }); |
| target | variable | 568 | no | let target = targets.find((t) =&gt; hostMatches(matchFor, t.url)) ?? null; |
| openedByProbe | const | 569 | no | const openedByProbe = !target; |
| conn | variable | 570 | no | let conn = null; |
| openUrl | const | 574 | no | const openUrl = adapter?.url ?? (isUrl ? args.input : `https://${bareHost(args.input)}/`); |
| created | const | 576 | no | const created = await openTab(port, openUrl); |
| page | const | 588 | no | const page = await conn.attach(target.id); |
| net | const | 591 | no | const net = createNetworkRecorder(page); |
| facts | variable | 603 | no | let facts = null; |
| settled | const | 611 | no | const settled = facts?.readyState === &#39;complete&#39;; |
| haveChat | const | 612 | no | const haveChat = (facts?.login?.chatComposerCount ?? 0) &gt; 0; |
| draft | const | 622 | no | const draft = await composerHasDraft(page); |
| netSummary | const | 632 | no | const netSummary = net.summary(); |
| sidecar | variable | 637 | no | let sidecar = null; |
| sideUrl | const | 639 | no | const sideUrl = adapter?.url ?? facts.url ?? target.url; |
| sideId | variable | 640 | no | let sideId = null; |
| created | const | 642 | no | const created = await openTab(port, sideUrl); |
| sideTarget | const | 643 | no | const sideTarget = await waitForTargetId(port, created?.id, { timeoutMs: 15000 }); |
| sidePage | const | 646 | no | const sidePage = await conn.attach(sideId); |
| sideNet | const | 648 | no | const sideNet = createNetworkRecorder(sidePage); |
| hit | const | 665 | no | const hit = netSummary.streamCandidates.find((x) =&gt; x.path === c.path &amp;&amp; x.method === c.method); |
| login | const | 675 | no | const login = facts.login ?? { loggedOut: false, hasComposer: false, evidence: [] }; |
| loggedOut | const | 676 | no | const loggedOut = !!login.loggedOut; |
| document_ | const | 678 | no | const document_ = { |
| outFile | const | 708 | no | const outFile = path.join(args.outDir, `${site}.json`); |
| compact | function | 711 | no | const compact = (v, n = 96) =&gt; (v ? (v.length &gt; n ? v.slice(0, n) + &#39;…&#39; : v) : &#39;—&#39;); |
| winner | const | 712 | no | const winner = document_.genericWinner; |
| top | const | 721 | no | const top = netSummary.streamCandidates.slice(0, 5); |
| code | const | 739 | no | const code = await main().catch((e) =&gt; { console.error(`probe: ${e?.stack ?? e}`); return 5; }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 24 | external |
| node:path | import | 25 | external |
| node:url | import | 26 | external |
| ../src/cdp/client.mjs | import | 27 | [studio/src/cdp/client.mjs](../src/cdp/client.mjs.md) |
| ../src/cdp/discovery.mjs | import | 28 | [studio/src/cdp/discovery.mjs](../src/cdp/discovery.mjs.md) |
| ../src/profiles/sites/index.mjs | import | 29 | [studio/src/profiles/sites/index.mjs](../src/profiles/sites/index.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Read-only evidence probe for one AI chat site.
//
// Purpose: learn the REAL DOM and transport facts (composer shape, send controls, assistant
// containers, streaming markers, chat/stream endpoints, websockets) so per-site adapters and
// capture profiles are written from evidence instead of guesswork.
//
// Safety contract — this script is read-only:
//   * it never types, never pastes, never sends a message, never clicks a send control,
//     never submits a form and never dispatches input events;
//   * it reuses an existing tab when the host matches (keeping the person's session intact)
//     and otherwise opens one via /json/new;
//   * it closes ONLY the tab it opened, and only when --keep-open was not passed;
//   * it writes exactly one JSON file per site and nothing else.
//
// Reuse: CDP plumbing comes from src/cdp/*; adapter resolution from src/profiles/sites/index.mjs.
// The in-page collector mirrors the heuristics in src/capture/actions.mjs (findComposer generic
// branch, isStreaming, readTranscript) WITHOUT importing the send/type primitives.
//
// Usage: node scripts/probe-site.mjs <site|url> [--port 9222] [--out <dir>] [--wait S]
//                                    [--keep-open] [--reload] [--help]
// Exit:  0 success, 3 site unreachable or login-walled, 5 environment failure (no CDP).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CdpConnection, sleep } from '../src/cdp/client.mjs';
import { browserWsUrl, isReachable, listTargets } from '../src/cdp/discovery.mjs';
import { getAdapter } from '../src/profiles/sites/index.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DEFAULT_OUT = path.join(ROOT, 'docs', 'research', 'probe');

// ---------------------------------------------------------------------------------------------
// In-page collector. Serialized with Function.prototype.toString and evaluated in the page, so it
// must be fully self-contained: no imports, no closures over module scope, no template syntax.
// ---------------------------------------------------------------------------------------------
function collectPageFacts() {
  const normText = (v) => String(v == null ? '' : v).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

  const vis = (el) => {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (!(r.width > 1 && r.height > 1)) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
    return true;
  };

  const rectOf = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };

  const esc = (s) => {
    const v = String(s);
    try { if (typeof CSS !== 'undefined' && CSS && CSS.escape) return CSS.escape(v); } catch (e) { /* fall through */ }
    return v.replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c);
  };

  const unique = (sel) => {
    try { return document.querySelectorAll(sel).length === 1; } catch (e) { return false; }
  };

  // A readable, mostly-stable CSS path: id or data-testid when unique, else a short ancestor chain
  // with nth-of-type disambiguation, stopping as soon as the path resolves to a single element.
  const stableSelector = (el) => {
    if (!el || el.nodeType !== 1) return null;
    if (el.id && unique('#' + esc(el.id))) return '#' + esc(el.id);
    for (const attr of ['data-testid', 'data-message-author-role', 'data-placeholder', 'name']) {
      const v = el.getAttribute && el.getAttribute(attr);
      if (!v || String(v).length > 80) continue;
      const s = el.tagName.toLowerCase() + '[' + attr + '="' + String(v).replace(/"/g, '\\"') + '"]';
      if (unique(s)) return s;
    }
    const parts = [];
    let cur = el;
    let depth = 0;
    while (cur && cur.nodeType === 1 && depth < 8) {
```

_First 80 of 744 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

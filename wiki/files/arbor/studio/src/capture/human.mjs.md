# File: studio/src/capture/human.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/human.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 22217 B |
| Lines | 471 |
| Hash | c7cb7533c2df |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEFAULT_PACE | const | 19 | yes | export const DEFAULT_PACE = Object.freeze({ keyMinMs: 35, keyMaxMs: 110, wordPauseMs: [70, 190], sentencePauseMs: [220, 520], thinkPauseEveryChars: 24, thinkPauseMs: [300, 800], preSendPauseMs: [700,… |
| msg | function | 26 | no | const msg = (e) =&gt; String(e &amp;&amp; e.message ? e.message : e); |
| paceOf | function | 28 | no | function paceOf(pace) { |
| jitter | function | 37 | yes | export function jitter(range) { |
| raw | const | 38 | no | const raw = Array.isArray(range) ? range : [0, Number(range)]; |
| lo | variable | 39 | no | let lo = Number(raw[0]); |
| hi | variable | 40 | no | let hi = Number(raw[1]); |
| a | const | 43 | no | const a = Math.min(lo, hi); |
| b | const | 44 | no | const b = Math.max(lo, hi); |
| loI | const | 45 | no | const loI = Math.ceil(a); |
| hiI | const | 46 | no | const hiI = Math.floor(b); |
| sleepMs | function | 51 | yes | export function sleepMs(ms) { |
| n | const | 52 | no | const n = Number(ms); |
| wait | const | 53 | no | const wait = Number.isFinite(n) &amp;&amp; n &gt; 0 ? Math.round(n) : 0; |
| IS_EDITABLE | const | 60 | no | const IS_EDITABLE = `(el) =&gt; !!el &amp;&amp; (el.tagName === &#39;TEXTAREA&#39; \|\| el.tagName === &#39;INPUT&#39; \|\| el.isContentEditable === true \|\| el.getAttribute(&#39;role&#39;) === &#39;textbox&#39;)`; |
| PICK_EDITABLE | const | 61 | no | const PICK_EDITABLE = `document.querySelector(&#39;textarea, [contenteditable=&quot;true&quot;], [contenteditable=&quot;&quot;], [role=&quot;textbox&quot;]&#39;)`; |
| READ_COMPOSER | const | 63 | no | const READ_COMPOSER = String.raw`(() =&gt; { const ed = ${IS_EDITABLE}; let el = globalThis.__aionDrive &amp;&amp; globalThis.__aionDrive.el; if (!el \|\| !el.isConnected) { const a = document.activeElement; |
| ed | const | 64 | no | const ed = ${IS_EDITABLE}; |
| el | variable | 65 | no | let el = globalThis.__aionDrive &amp;&amp; globalThis.__aionDrive.el; |
| a | const | 67 | no | const a = document.activeElement; |
| ENSURE_FOCUS | const | 76 | no | const ENSURE_FOCUS = String.raw`(() =&gt; { const ed = ${IS_EDITABLE}; const a = document.activeElement; if (ed(a)) return { ok: true, already: true }; let el = globalThis.__aionDrive &amp;&amp; globalThis.__ai… |
| ed | const | 77 | no | const ed = ${IS_EDITABLE}; |
| a | const | 78 | no | const a = document.activeElement; |
| el | variable | 80 | no | let el = globalThis.__aionDrive &amp;&amp; globalThis.__aionDrive.el; |
| now | const | 84 | no | const now = document.activeElement; |
| READ_ENV | const | 88 | no | const READ_ENV = String.raw`(() =&gt; ({ webdriver: (typeof navigator !== &#39;undefined&#39; &amp;&amp; &#39;webdriver&#39; in navigator) ? navigator.webdriver : null, hasFocus: (typeof document !== &#39;undefined&#39; &amp;&amp; typeof docu… |
| evaluate | function | 94 | no | async function evaluate(page, expression) { |
| r | const | 95 | no | const r = await page.send(&#39;Runtime.evaluate&#39;, { expression, awaitPromise: true, returnByValue: true, userGesture: true }); |
| d | const | 97 | no | const d = r.exceptionDetails; |
| tryEval | function | 103 | no | async function tryEval(page, expression) { |
| normText | function | 108 | no | const normText = (v) =&gt; String(v == null ? &#39;&#39; : v).replace(/\\u00a0/g, &#39; &#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| readComposerText | function | 110 | no | async function readComposerText(page) { |
| r | const | 111 | no | const r = await tryEval(page, READ_COMPOSER); |
| PUNCT | const | 118 | no | const PUNCT = { |
| keyFor | function | 129 | no | function keyFor(ch) { |
| p | const | 143 | no | const p = PUNCT[ch]; |
| BACKSPACE | const | 148 | no | const BACKSPACE = { key: &#39;Backspace&#39;, code: &#39;Backspace&#39;, windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 }; |
| dispatchChar | function | 160 | no | async function dispatchChar(page, ch) { |
| k | const | 161 | no | const k = keyFor(ch); |
| base | const | 162 | no | const base = { |
| dispatchBackspace | function | 172 | no | async function dispatchBackspace(page) { |
| humanType | function | 187 | yes | export async function humanType(page, text, { pace = DEFAULT_PACE, human = false, beforeInsert, chunked = false } = {}) { |
| startedAt | const | 188 | no | const startedAt = Date.now(); |
| p | const | 189 | no | const p = paceOf(pace); |
| s | const | 191 | no | const s = String(text == null ? &#39;&#39; : text).replace(/\\r\\n?/g, &#39;\\n&#39;); |
| stats | const | 192 | no | const stats = { chars: s.length, durationMs: 0, pauses: 0, corrections: 0, methodCounts: { key: 0, insertText: 0 } }; |
| errors | const | 193 | no | const errors = []; |
| focus | const | 201 | no | const focus = await tryEval(page, ENSURE_FOCUS); |
| typed | const | 230 | no | const typed = await readComposerText(page); |
| want | const | 231 | no | const want = normText(s); |
| probe | const | 232 | no | const probe = want.slice(-Math.min(28, want.length)); |
| ok | const | 233 | no | const ok = errors.length === 0 &amp;&amp; !!probe &amp;&amp; normText(typed).includes(probe); |
| chars | const | 242 | no | const chars = [...s]; |
| typoAt | const | 245 | no | const typoAt = human &amp;&amp; chars.length &gt;= 20 ? 6 + jitter([0, Math.max(0, Math.floor(chars.length * 0.5) - 6)]) : -1; |
| corrected | variable | 246 | no | let corrected = false; |
| ch | const | 249 | no | const ch = chars[i]; |
| pool | const | 252 | no | const pool = &#39;etaoinshrdlucmfwypvbgkjqxz&#39;.split(&#39;&#39;).filter((c) =&gt; c !== ch.toLowerCase()); |
| wrong | const | 253 | no | const wrong = pool[jitter([0, pool.length - 1])] \|\| &#39;x&#39;; |
| mapped | const | 269 | no | const mapped = !!keyFor(ch); |
| extra | variable | 270 | no | let extra = 0; |
| delay | variable | 285 | no | let delay = 15; |
| every | const | 293 | no | const every = Number(p.thinkPauseEveryChars) \|\| 0; |
| typed | const | 300 | no | const typed = await readComposerText(page); |
| want | const | 301 | no | const want = normText(s); |
| probe | const | 302 | no | const probe = want.slice(-Math.min(28, want.length)); |
| ok | const | 303 | no | const ok = !!probe &amp;&amp; normText(typed).includes(probe); |
| key | const | 307 | no | const key = stats.methodCounts.key; |
| ins | const | 308 | no | const ins = stats.methodCounts.insertText; |
| method | const | 309 | no | const method = key === 0 &amp;&amp; ins === 0 ? &#39;none&#39; : key &gt;= ins ? &#39;key&#39; : &#39;insertText&#39;; |
| humanClick | function | 320 | yes | export async function humanClick(page, { x, y } = {}, { pace = DEFAULT_PACE } = {}) { |
| p | const | 321 | no | const p = paceOf(pace); |
| errors | const | 322 | no | const errors = []; |
| tx | const | 323 | no | const tx = Number(x); |
| ty | const | 324 | no | const ty = Number(y); |
| px | const | 328 | no | const px = Math.round(tx); |
| py | const | 329 | no | const py = Math.round(ty); |
| sx | const | 332 | no | const sx = Math.max(0, px + (Math.random() &lt; 0.5 ? -1 : 1) * jitter([140, 420])); |
| sy | const | 333 | no | const sy = Math.max(0, py + jitter([-90, 90])); |
| cx | const | 334 | no | const cx = (sx + px) / 2 + jitter([-70, 70]); |
| cy | const | 335 | no | const cy = (sy + py) / 2 + jitter([-70, 70]); |
| steps | const | 336 | no | const steps = Math.max(2, jitter(p.mouseMoveSteps)); |
| path | const | 338 | no | const path = []; |
| ok | variable | 339 | no | let ok = true; |
| t | const | 341 | no | const t = i / steps; |
| mt | const | 342 | no | const mt = 1 - t; |
| qx | const | 343 | no | const qx = Math.round(mt * mt * sx + 2 * mt * t * cx + t * t * px); |
| qy | const | 344 | no | const qy = Math.round(mt * mt * sy + 2 * mt * t * cy + t * t * py); |
| humanPressEnter | function | 374 | yes | export async function humanPressEnter(page, { pace = DEFAULT_PACE } = {}) { |
| p | const | 375 | no | const p = paceOf(pace); |
| base | const | 379 | no | const base = { key: &#39;Enter&#39;, code: &#39;Enter&#39;, windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }; |
| viewportCenter | function | 400 | no | async function viewportCenter(page) { |
| m | const | 402 | no | const m = await page.send(&#39;Page.getLayoutMetrics&#39;, {}); |
| v | const | 403 | no | const v = m?.cssVisualViewport ?? m?.layoutViewport; |
| w | const | 404 | no | const w = Number(v?.clientWidth), h = Number(v?.clientHeight); |
| humanScroll | function | 411 | yes | export async function humanScroll(page, { deltaY = -240, steps = 6, x, y } = {}) { |
| total | const | 412 | no | const total = Number(deltaY) \|\| 0; |
| n | const | 413 | no | const n = Math.max(1, Math.floor(Number(steps) \|\| 1)); |
| share | const | 414 | no | const share = total / n; |
| at | const | 415 | no | const at = Number.isFinite(x) &amp;&amp; Number.isFinite(y) ? { x, y } : await viewportCenter(page); |
| sent | variable | 416 | no | let sent = 0; |
| errors | const | 417 | no | const errors = []; |
| chunk | const | 419 | no | const chunk = i === n - 1 ? Math.round(total - share * (n - 1)) : Math.round(share); |
| humanIdle | function | 435 | yes | export async function humanIdle(page, { pace = DEFAULT_PACE } = {}) { |
| ms | const | 437 | no | const ms = jitter([400, 1200]); |
| prepareHumanEnvironment | function | 444 | yes | export async function prepareHumanEnvironment(page, { focus = true } = {}) { |
| notes | const | 445 | no | const notes = []; |
| webdriver | variable | 455 | no | let webdriver = null; |
| hasFocus | variable | 456 | no | let hasFocus = null; |
| ua | variable | 457 | no | let ua = null; |
| probe | const | 458 | no | const probe = await tryEval(page, READ_ENV); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/capture/actions.mjs](./actions.mjs.md) | ./human.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Human-pacing layer for CDP interaction.
//
// Requirement: a real logged-in AI chat app must see a person, not a script. Everything here is
// driven through `page.send(method, params)` on an already-attached target session, exactly like
// actions.mjs, so this module stays self-contained (no project imports, only `node:` builtins).
//
// Ground rules encoded below (verified on a live rich composer):
//  - Never write `.value` / `.textContent`: ProseMirror/Lexical keep their own state, so the app
//    would never believe the text exists and Enter would silently do nothing.
//  - `Input.insertText` updates app state but emits no key events -> only a per-character fallback.
//  - Printable characters go through `Input.dispatchKeyEvent` with a real `text` payload so the
//    page receives keydown/keypress/keyup + `input`, i.e. what a keyboard produces.
//
// Every CDP call is wrapped: a failure is reported in the returned object, never thrown.

// ---------------------------------------------------------------------------------------------
// Pacing profile
// ---------------------------------------------------------------------------------------------
export const DEFAULT_PACE = Object.freeze({
  keyMinMs: 35, keyMaxMs: 110,
  wordPauseMs: [70, 190], sentencePauseMs: [220, 520],
  thinkPauseEveryChars: 24, thinkPauseMs: [300, 800],
  preSendPauseMs: [700, 1900], mouseMoveSteps: [8, 22],
});

const msg = (e) => String(e && e.message ? e.message : e);

function paceOf(pace) {
  return { ...DEFAULT_PACE, ...(pace && typeof pace === 'object' ? pace : {}) };
}

// ---------------------------------------------------------------------------------------------
// Timing primitives
// ---------------------------------------------------------------------------------------------

// Inclusive integer draw from [range[0], range[1]]; order-tolerant, never NaN.
export function jitter(range) {
  const raw = Array.isArray(range) ? range : [0, Number(range)];
  let lo = Number(raw[0]);
  let hi = Number(raw[1]);
  if (!Number.isFinite(lo)) lo = 0;
  if (!Number.isFinite(hi)) hi = lo;
  const a = Math.min(lo, hi);
  const b = Math.max(lo, hi);
  const loI = Math.ceil(a);
  const hiI = Math.floor(b);
  if (hiI <= loI) return Math.round(a);
  return loI + Math.floor(Math.random() * (hiI - loI + 1));
}

export function sleepMs(ms) {
  const n = Number(ms);
  const wait = Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  return new Promise((resolve) => setTimeout(resolve, wait));
}

// ---------------------------------------------------------------------------------------------
// In-page probes (read-only; never mutate the page)
// ---------------------------------------------------------------------------------------------
const IS_EDITABLE = `(el) => !!el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable === true || el.getAttribute('role') === 'textbox')`;
const PICK_EDITABLE = `document.querySelector('textarea, [contenteditable="true"], [contenteditable=""], [role="textbox"]')`;

const READ_COMPOSER = String.raw`(() => {
  const ed = ${IS_EDITABLE};
  let el = globalThis.__aionDrive && globalThis.__aionDrive.el;
  if (!el || !el.isConnected) {
    const a = document.activeElement;
    if (ed(a)) el = a;
  }
  if (!el || !el.isConnected) el = ${PICK_EDITABLE};
  if (!el) return '';
  if (typeof el.value === 'string') return String(el.value);
  return String(el.innerText != null ? el.innerText : (el.textContent != null ? el.textContent : ''));
})()`;

const ENSURE_FOCUS = String.raw`(() => {
  const ed = ${IS_EDITABLE};
  const a = document.activeElement;
  if (ed(a)) return { ok: true, already: true };
  let el = globalThis.__aionDrive && globalThis.__aionDrive.el;
```

_First 80 of 472 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

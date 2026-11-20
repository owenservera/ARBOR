# File: studio/src/capture/actions.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/actions.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 90390 B |
| Lines | 1613 |
| Hash | f61c5f55b750 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| IN_PAGE | const | 23 | no | const IN_PAGE = String.raw` |
| vis | function | 24 | no | const vis = (el) =&gt; { |
| r | const | 26 | no | const r = el.getBoundingClientRect(); |
| cs | const | 28 | no | const cs = getComputedStyle(el); |
| txt | function | 32 | no | const txt = (el) =&gt; String(el.innerText ?? el.textContent ?? &#39;&#39;).replace(/\\r/g, &#39;&#39;).replace(/[ \\t]+\\n/g, &#39;\\n&#39;).replace(/\\n{3,}/g, &#39;\\n\\n&#39;).trim(); |
| store | function | 33 | no | const store = (el, kind, tag) =&gt; { globalThis.__aionDrive = { el: el, kind: kind, tag: tag, at: Date.now() }; return globalThis.__aionDrive; }; |
| live | function | 34 | no | const live = () =&gt; { const s = globalThis.__aionDrive; return s &amp;&amp; s.el &amp;&amp; s.el.isConnected ? s.el : null; }; |
| norm | function | 37 | no | const norm = (v) =&gt; String(v ?? &#39;&#39;).replace(/\\u00a0/g, &#39; &#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| evaluate | function | 42 | yes | export async function evaluate(page, expression, { awaitPromise = true, returnByValue = true } = {}) { |
| r | const | 43 | no | const r = await page.send(&#39;Runtime.evaluate&#39;, { expression, awaitPromise, returnByValue, userGesture: true }); |
| d | const | 45 | no | const d = r.exceptionDetails; |
| tryEval | function | 51 | no | async function tryEval(page, expression) { |
| findComposer | function | 59 | yes | export async function findComposer(page, adapter = null) { |
| selectors | const | 60 | no | const selectors = Array.isArray(adapter?.composer?.selectors) ? adapter.composer.selectors : []; |
| expr | const | 61 | no | const expr = String.raw`(() =&gt; { ${IN_PAGE} const adapterSels = ${JSON.stringify(selectors)}; const kindOf = (el) =&gt; el.tagName === &#39;TEXTAREA&#39; ? &#39;textarea&#39; : el.tagName === &#39;INPUT&#39; ? &#39;input&#39; : el.isC… |
| adapterSels | const | 62 | no | const adapterSels = ${JSON.stringify(selectors)}; |
| kindOf | function | 63 | no | const kindOf = (el) =&gt; el.tagName === &#39;TEXTAREA&#39; ? &#39;textarea&#39; |
| blocked | function | 67 | no | const blocked = (el) =&gt; el.disabled === true \|\| el.readOnly === true \|\| el.getAttribute(&#39;aria-disabled&#39;) === &#39;true&#39;; |
| usable | function | 68 | no | const usable = (el) =&gt; vis(el) &amp;&amp; !blocked(el); |
| els | variable | 71 | no | let els = []; |
| genericSels | const | 80 | no | const genericSels = [&#39;textarea&#39;, &#39;[contenteditable=&quot;true&quot;]&#39;, &#39;[contenteditable=&quot;&quot;]&#39;, &#39;[role=&quot;textbox&quot;]&#39;]; |
| cands | const | 81 | no | const cands = []; |
| els | variable | 83 | no | let els = []; |
| r | const | 88 | no | const r = el.getBoundingClientRect(); |
| pick | const | 97 | no | const pick = cands[0].el; |
| r | const | 101 | no | const r = await tryEval(page, expr); |
| waitForComposer | function | 108 | yes | export async function waitForComposer(page, adapter = null, { timeoutMs = 20000, intervalMs = 400 } = {}) { |
| deadline | const | 109 | no | const deadline = Date.now() + Math.max(1000, timeoutMs); |
| last | variable | 110 | no | let last = null; |
| focusComposer | function | 122 | yes | export async function focusComposer(page, target = null) { |
| found | const | 123 | no | const found = target &amp;&amp; typeof target === &#39;object&#39; &amp;&amp; &#39;found&#39; in target |
| box | const | 128 | no | const box = await tryEval(page, String.raw`(() =&gt; { ${IN_PAGE} const el = live(); if (!el) return null; el.scrollIntoView({ block: &#39;center&#39;, inline: &#39;nearest&#39; }); const r = el.getBoundingClientRect()… |
| el | const | 129 | no | const el = live(); if (!el) return null; |
| r | const | 131 | no | const r = el.getBoundingClientRect(); |
| b | const | 135 | no | const b = box.ok ? box.value : null; |
| method | variable | 136 | no | let method = &#39;focus&#39;; |
| st | const | 145 | no | const st = await tryEval(page, String.raw`(() =&gt; { ${IN_PAGE} const el = live(); if (!el) return { ok: false }; try { el.focus({ preventScroll: true }); } catch (e) { /* read-only or detached */ } co… |
| el | const | 146 | no | const el = live(); if (!el) return { ok: false }; |
| a | const | 148 | no | const a = document.activeElement; |
| ok | const | 149 | no | const ok = a === el \|\| (a &amp;&amp; el.contains(a)); |
| composerText | function | 155 | no | async function composerText(page) { |
| r | const | 156 | no | const r = await tryEval(page, String.raw`(() =&gt; { ${IN_PAGE} const el = live() \|\| document.querySelector(&#39;form div[contenteditable=&quot;true&quot;]&#39;) \|\| document.querySelector(&#39;textarea&#39;); if (!el) return nul… |
| el | const | 157 | no | const el = live() \|\| document.querySelector(&#39;form div[contenteditable=&quot;true&quot;]&#39;) \|\| document.querySelector(&#39;textarea&#39;); |
| text | const | 159 | no | const text = el.tagName === &#39;TEXTAREA&#39; \|\| el.tagName === &#39;INPUT&#39; ? el.value : (el.innerText ?? el.textContent); |
| readableComposerText | function | 168 | no | async function readableComposerText(page, { timeoutMs = 2500, pollMs = 150 } = {}) { |
| deadline | const | 169 | no | const deadline = Date.now() + timeoutMs; |
| text | variable | 170 | no | let text = await composerText(page); |
| clearComposer | function | 175 | yes | export async function clearComposer(page) { |
| before | const | 176 | no | const before = await readableComposerText(page); |
| ctrl | const | 179 | no | const ctrl = { modifiers: 2, windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65, key: &#39;a&#39;, code: &#39;KeyA&#39; }; |
| bs | const | 183 | no | const bs = { windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8, key: &#39;Backspace&#39;, code: &#39;Backspace&#39; }; |
| after | const | 187 | no | const after = await composerText(page); |
| cleared | const | 189 | no | const cleared = !norm(after); |
| typeText | function | 201 | yes | export async function typeText(page, text, { human = true, pace = DEFAULT_PACE, beforeInsert, requireEmpty = false, chunked = false } = {}) { |
| s | const | 202 | no | const s = String(text ?? &#39;&#39;); |
| focus | const | 205 | no | const focus = await tryEval(page, String.raw`(() =&gt; { ${IN_PAGE} let el = live() \|\| document.querySelector(&#39;form div[contenteditable=&quot;true&quot;]&#39;) \|\| document.querySelector(&#39;div[contenteditable=&quot;true&quot;]&#39;)… |
| el | variable | 206 | no | let el = live() \|\| document.querySelector(&#39;form div[contenteditable=&quot;true&quot;]&#39;) \|\| document.querySelector(&#39;div[contenteditable=&quot;true&quot;]&#39;) \|\| document.querySelector(&#39;textarea&#39;); |
| a | const | 208 | no | const a = document.activeElement; |
| before | const | 218 | no | const before = await composerText(page); |
| res | const | 221 | no | const res = await humanType(page, s, { pace, human, beforeInsert, chunked }); |
| after | const | 222 | no | const after = res.typed ?? await composerText(page); |
| clickStoredOnce | function | 238 | no | async function clickStoredOnce(page, globalName, { canDispatch, beforeClick } = {}) { |
| box | const | 239 | no | const box = await tryEval(page, String.raw`(() =&gt; { const el = globalThis.${globalName}; if (!el \|\| !el.isConnected) return null; el.scrollIntoView({ block: &#39;center&#39; }); const r = el.getBoundingClien… |
| b | const | 242 | no | const b = box.ok ? box.value : null; |
| dispatched | variable | 244 | no | let dispatched = false; |
| dispatchError | variable | 245 | no | let dispatchError = null; |
| clickStored | function | 261 | no | async function clickStored(page, globalName) { |
| r | const | 262 | no | const r = await clickStoredOnce(page, globalName); |
| pressEnter | function | 267 | no | async function pressEnter(page) { |
| base | const | 271 | no | const base = { windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: &#39;Enter&#39;, code: &#39;Enter&#39; }; |
| dispatchError | variable | 272 | no | let dispatchError = null; |
| SEND_OBSERVE_WAITS | const | 284 | no | const SEND_OBSERVE_WAITS = Object.freeze([900, 1200, 1500]); |
| findSendButton | function | 287 | yes | export async function findSendButton(page, adapter = null) { |
| btn | const | 288 | no | const btn = await tryEval(page, String.raw`(() =&gt; { ${IN_PAGE} const sels = ${JSON.stringify(Array.isArray(adapter?.send?.buttonSelectors) ? adapter.send.buttonSelectors : [])}; for (const sel of sel… |
| sels | const | 289 | no | const sels = ${JSON.stringify(Array.isArray(adapter?.send?.buttonSelectors) ? adapter.send.buttonSelectors : [])}; |
| els | variable | 291 | no | let els = []; |
| b | const | 295 | no | const b = el.closest(&#39;button,[role=&quot;button&quot;],input[type=&quot;submit&quot;]&#39;) \|\| el; |
| sendMessage | function | 317 | yes | export async function sendMessage(page, adapter = null, deps = {}) { |
| d | const | 318 | no | const d = { |
| strategy | const | 324 | no | const strategy = adapter?.send?.strategy ?? &#39;both&#39;; |
| notAttempted | function | 325 | no | const notAttempted = (method, reason) =&gt; ({ ok: false, sent: false, method, dispatched: false, sendStatus: &#39;not-attempted&#39;, uncertain: false, reason }); |
| before | variable | 330 | no | let before; |
| method | variable | 336 | no | let method = &#39;enter&#39;; |
| button | variable | 338 | no | let button; |
| dispatchError | variable | 345 | no | let dispatchError = null; |
| c | const | 354 | no | const c = await d.clickSendButton(page); |
| after | variable | 362 | no | let after = null; |
| observed | const | 370 | no | const observed = !!(after?.evalOk &amp;&amp; after?.sent); |
| detail | const | 371 | no | const detail = after?.reason ?? &#39;no observation&#39;; |
| sendState | function | 388 | yes | export async function sendState(page, adapter = null, before = null) { |
| state | const | 389 | no | const state = await tryEval(page, String.raw`(() =&gt; { ${IN_PAGE} let composer = live(); if (!composer) { const a = document.activeElement; if (a &amp;&amp; (a.tagName === &#39;TEXTAREA&#39; \|\| a.tagName === &#39;INPUT&#39; … |
| composer | variable | 390 | no | let composer = live(); |
| a | const | 392 | no | const a = document.activeElement; |
| text | const | 397 | no | const text = String(composer.value ?? composer.innerText ?? composer.textContent ?? &#39;&#39;); |
| TURN_SEL | const | 398 | no | const TURN_SEL = [ |
| turns | variable | 409 | no | let turns = 0; |
| root | const | 411 | no | const root = document.querySelector(&#39;main&#39;) \|\| document.body; |
| bodyLen | const | 412 | no | const bodyLen = String((root &amp;&amp; root.innerText) \|\| &#39;&#39;).length; |
| buttons | const | 413 | no | const buttons = [...document.querySelectorAll(&#39;button,[role=&quot;button&quot;]&#39;)].filter(vis); |
| sendDisabled | const | 414 | no | const sendDisabled = buttons.some((b) =&gt; { const l = ((b.getAttribute(&#39;aria-label&#39;) \|\| &#39;&#39;) + &#39; &#39; + (b.innerText \|\| &#39;&#39;)).toLowerCase(); if (!/send\|发送\|submit\|发送消息/.test(l)) return false; return b.disab… |
| l | const | 415 | no | const l = ((b.getAttribute(&#39;aria-label&#39;) \|\| &#39;&#39;) + &#39; &#39; + (b.innerText \|\| &#39;&#39;)).toLowerCase(); |
| s | const | 421 | no | const s = state.value; |
| draftChars | const | 427 | no | const draftChars = norm(s.text).length; |
| cleared | const | 428 | no | const cleared = !norm(s.text); |
| streaming | variable | 429 | no | let streaming = null; |
| stream | const | 431 | no | const stream = await isStreaming(page, adapter); |
| baseline | const | 436 | no | const baseline = before?.evalOk === true &amp;&amp; Number.isSafeInteger(before.draftChars) &amp;&amp; before.draftChars &gt; 0 |
| draftDecreased | const | 438 | no | const draftDecreased = baseline &amp;&amp; draftChars &lt; before.draftChars; |
| newTurn | const | 439 | no | const newTurn = baseline &amp;&amp; s.turns &gt; before.turns; |
| startedStreaming | const | 440 | no | const startedStreaming = baseline &amp;&amp; before.streaming === false &amp;&amp; streaming; |
| sent | const | 441 | no | const sent = !!(baseline &amp;&amp; (newTurn &amp;&amp; (draftDecreased \|\| startedStreaming) \|\| startedStreaming &amp;&amp; draftDecreased)); |
| readTranscript | function | 460 | yes | export async function readTranscript(page, adapter = null, { exclude = [] } = {}) { |
| excluded | const | 461 | no | const excluded = (Array.isArray(exclude) ? exclude : [exclude]) |
| r | const | 464 | no | const r = await tryEval(page, String.raw`(() =&gt; { ${IN_PAGE} const turns = []; const seen = new Set(); // The prompt we sent is not an answer. Its own text must not count as new content. const EXCLUD… |
| turns | const | 465 | no | const turns = []; |
| seen | const | 466 | no | const seen = new Set(); |
| EXCLUDED | const | 468 | no | const EXCLUDED = ${JSON.stringify(excluded)}; |
| IGNORE | const | 473 | no | const IGNORE = ${JSON.stringify(Array.isArray(adapter?.assistant?.ignoreSelectors) ? adapter.assistant.ignoreSelectors : [])}; |
| ignored | function | 474 | no | const ignored = (el) =&gt; { |
| STRIP | const | 481 | no | const STRIP = ${JSON.stringify(Array.isArray(adapter?.assistant?.stripSelectors) ? adapter.assistant.stripSelectors : [])}; |
| push | function | 482 | no | const push = (role, text) =&gt; { |
| t | const | 483 | no | const t = String(text \|\| &#39;&#39;).trim(); |
| key | const | 485 | no | const key = role + &#39;:&#39; + t.slice(0, 120); |
| collect | function | 496 | no | const collect = (els) =&gt; { |
| composer | const | 497 | no | const composer = live(); |
| composerForm | const | 504 | no | const composerForm = composer &amp;&amp; composer.closest ? composer.closest(&#39;form&#39;) : null; |
| inComposer | function | 505 | no | const inComposer = (el) =&gt; { |
| stripPrompt | function | 517 | no | const stripPrompt = (text) =&gt; { |
| flat | variable | 518 | no | let flat = String(text \|\| &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| readText | function | 527 | no | const readText = (el) =&gt; { |
| clone | const | 530 | no | const clone = el.cloneNode(true); |
| shown | const | 537 | no | const shown = els.filter((el) =&gt; vis(el) &amp;&amp; !inComposer(el) &amp;&amp; !ignored(el)); |
| texts | const | 538 | no | const texts = shown.map(readText).filter((t) =&gt; t.length &gt;= 4); |
| meaningful | const | 540 | no | const meaningful = texts.filter((t) =&gt; t.length &gt;= 8); |
| authored | const | 547 | no | const authored = [...document.querySelectorAll(&#39;[data-message-author-role]&#39;)]; |
| asstEls | const | 549 | no | const asstEls = authored.filter((el) =&gt; { const role = el.getAttribute(&#39;data-message-author-role&#39;); return role === &#39;assistant&#39; &amp;&amp; vis(el); }); |
| role | const | 550 | no | const role = el.getAttribute(&#39;data-message-author-role&#39;); |
| asstTexts | const | 553 | no | const asstTexts = asstEls.map((el) =&gt; txt(el)); |
| meaningful | const | 555 | no | const meaningful = asstTexts.filter((t) =&gt; t.length &gt;= 8); |
| els | variable | 563 | no | let els = []; |
| c | const | 565 | no | const c = collect(els); |
| els | const | 570 | no | const els = [...document.querySelectorAll(&#39;[data-testid*=&quot;assistant&quot; i]&#39;)]; |
| c | const | 571 | no | const c = collect(els); |
| assistantSels | const | 579 | no | const assistantSels = [ |
| els | variable | 589 | no | let els = []; |
| c | const | 591 | no | const c = collect(els); |
| userSels | const | 595 | no | const userSels = [ |
| els | variable | 602 | no | let els = []; |
| lastA | const | 607 | no | const lastA = [...turns].reverse().find((t) =&gt; t.role === &#39;assistant&#39;); |
| composer | const | 614 | no | const composer = live(); |
| root | const | 615 | no | const root = document.querySelector(&#39;main&#39;) \|\| document.body; |
| CHROME_ANCESTOR | const | 622 | no | const CHROME_ANCESTOR = &#39;nav,aside,header,footer,[role=&quot;navigation&quot;],[role=&quot;banner&quot;],[role=&quot;complementary&quot;]&#39;; |
| CHROME_SELF | const | 623 | no | const CHROME_SELF = &#39;[class*=&quot;sidebar&quot;],[class*=&quot;side-bar&quot;],[class*=&quot;navigation&quot;],[class*=&quot;menu&quot;],[class*=&quot;toolbar&quot;],[class*=&quot;breadcrumb&quot;]&#39;; |
| STATUS | const | 625 | no | const STATUS = /^(thinking\|thinking\\.{0,3}\|generating\|generating\\.{0,3}\|loading\|loading\\.{0,3}\|working\|stop\|stopping\|cancel\|思考中\|正在思考\|思考\\.{0,3}\|生成中\|正在生成\|加载中\|\\.{0,3})$/i; |
| blocks | const | 627 | no | const blocks = []; |
| seenText | const | 628 | no | const seenText = new Set(); |
| BLOCK_SEL | const | 629 | no | const BLOCK_SEL = &#39;p,li,pre,blockquote,h1,h2,h3,h4,td&#39;; |
| composerTop | variable | 632 | no | let composerTop = Infinity; |
| composerForm | variable | 633 | no | let composerForm = null; |
| cr | const | 636 | no | const cr = composer.getBoundingClientRect(); |
| top | const | 646 | no | const top = el.getBoundingClientRect().top + window.scrollY; |
| t | const | 662 | no | const t = txt(el); |
| flat | const | 664 | no | const flat = t.replace(/\\s+/g, &#39; &#39;).trim(); |
| linkLabels | const | 671 | no | const linkLabels = Array.from(el.querySelectorAll(&#39;a,button,[role=&quot;button&quot;],[role=&quot;link&quot;]&#39;)) |
| prose | variable | 675 | no | let prose = flat; |
| stripped | variable | 681 | no | let stripped = flat; |
| tail | const | 694 | no | const tail = blocks.slice(-8).map((b) =&gt; b.t).join(&#39;\\n&#39;).slice(-12000); |
| last | const | 695 | no | const last = blocks.length ? blocks[blocks.length - 1].t : &#39;&#39;; |
| expectedWordsFromPrompt | function | 708 | yes | export function expectedWordsFromPrompt(prompt) { |
| p | const | 709 | no | const p = String(prompt ?? &#39;&#39;); |
| m | const | 710 | no | const m = p.match(/nothing else:\\s*([a-z0-9 ]+?)\\s*$/i); |
| words | const | 712 | no | const words = m[1].trim().toLowerCase().split(/\\s+/).filter(Boolean); |
| containsWords | function | 717 | yes | export function containsWords(text, words) { |
| flat | const | 719 | no | const flat = String(text ?? &#39;&#39;).toLowerCase().replace(/[^a-z0-9\\s]/g, &#39; &#39;).replace(/\\s+/g, &#39; &#39;); |
| at | variable | 720 | no | let at = 0; |
| i | const | 722 | no | const i = flat.indexOf(w, at); |
| isStreaming | function | 729 | yes | export async function isStreaming(page, adapter = null) { |
| r | const | 730 | no | const r = await tryEval(page, String.raw`(() =&gt; { ${IN_PAGE} // English and Spanish labels: a localised UI must still be readable as &quot;stop generating&quot;. const stopLabel = /stop (generating\|streaming\|r… |
| stopLabel | const | 732 | no | const stopLabel = /stop (generating\|streaming\|responding\|response\|output\|replying)\|stop generation\|detener (la )?(generaci\|respuesta)\|parar de generar/i; |
| strong | function | 733 | no | const strong = (el) =&gt; { |
| b | const | 734 | no | const b = el.closest(&#39;button,[role=&quot;button&quot;]&#39;); |
| label | const | 735 | no | const label = String((b ? (b.getAttribute(&#39;aria-label&#39;) \|\| b.innerText \|\| &#39;&#39;) : (el.getAttribute(&#39;aria-label&#39;) \|\| &#39;&#39;)) \|\| &#39;&#39;).trim(); |
| state | const | 745 | no | const state = String(el.getAttribute(&#39;data-talvt-turn-state&#39;) \|\| &#39;&#39;).trim(); |
| weak | const | 753 | no | const weak = []; |
| els | variable | 755 | no | let els = []; |
| label | const | 766 | no | const label = String((b.getAttribute(&#39;aria-label&#39;) \|\| &#39;&#39;) + &#39; &#39; + (b.innerText \|\| &#39;&#39;)).trim(); |
| waitForCompletion | function | 783 | yes | export async function waitForCompletion(page, adapter = null, { timeoutMs = 120000, stableMs = 2500, pollMs = 400, baseline = null, baseCount = null, exclude = [], signal, onUpdate } = {}) { |
| startedAt | const | 784 | no | const startedAt = Date.now(); |
| lastText | variable | 785 | no | let lastText = &#39;&#39;; |
| lastChangeAt | variable | 786 | no | let lastChangeAt = startedAt; |
| lastStreamingAt | variable | 787 | no | let lastStreamingAt = 0; |
| evidence | variable | 788 | no | let evidence = &#39;none&#39;; |
| text | variable | 789 | no | let text = &#39;&#39;; |
| texts | variable | 790 | no | let texts = []; |
| publishedText | variable | 791 | no | let publishedText = null; |
| base | const | 792 | no | const base = baseline == null ? null : norm(baseline); |
| now | const | 796 | no | const now = Date.now(); |
| stream | const | 797 | no | const stream = await isStreaming(page, adapter); |
| tr | const | 799 | no | const tr = await readTranscript(page, adapter, { exclude }); |
| last | const | 800 | no | const last = [...(tr.turns ?? [])].reverse().find((t) =&gt; t.role === &#39;assistant&#39;); |
| newest | const | 803 | no | const newest = tr.last \|\| last?.text \|\| &#39;&#39;; |
| failure | const | 816 | no | const failure = await detectSiteFailure(page, adapter); |
| quietFor | const | 821 | no | const quietFor = now - Math.max(lastChangeAt, lastStreamingAt); |
| grew | const | 825 | no | const grew = baseCount === null \|\| (tr.count ?? 0) &gt; baseCount; |
| changed | const | 826 | no | const changed = grew \|\| (base === null \|\| norm(text) !== base); |
| detectSiteFailure | function | 842 | yes | export async function detectSiteFailure(page, adapter = null) { |
| r | const | 843 | no | const r = await tryEval(page, String.raw`(() =&gt; { ${IN_PAGE} const patterns = [ /network error/i, /something went wrong/i, /you&#39;?re out of usage credits/i, |
| patterns | const | 844 | no | const patterns = [ |
| root | const | 860 | no | const root = document.querySelector(&#39;main&#39;) \|\| document.body; |
| dt | const | 868 | no | const dt = String(d.innerText \|\| &#39;&#39;).replace(/\\s+/g, &#39; &#39;).slice(0, 400); |
| m | const | 870 | no | const m = dt.match(p); |
| mainEl | const | 877 | no | const mainEl = document.querySelector(&#39;main&#39;); |
| hasTurns | const | 878 | no | const hasTurns = !!document.querySelector(&#39;[data-message-author-role],[data-testid*=&quot;conversation-turn&quot;],article&#39;); |
| text | variable | 879 | no | let text; |
| m | const | 888 | no | const m = text.match(p); |
| detectAuthWall | function | 901 | yes | export async function detectAuthWall(page, adapter = null) { |
| r | const | 902 | no | const r = await tryEval(page, String.raw`(() =&gt; { ${IN_PAGE} const composer = live(); const hasComposer = !!(composer &amp;&amp; composer.isConnected); const hits = []; for (const sel of ${JSON.stringify(Arr… |
| composer | const | 903 | no | const composer = live(); |
| hasComposer | const | 904 | no | const hasComposer = !!(composer &amp;&amp; composer.isConnected); |
| hits | const | 905 | no | const hits = []; |
| els | variable | 907 | no | let els = []; |
| signedIn | const | 913 | no | const signedIn = []; |
| els | variable | 915 | no | let els = []; |
| url | const | 920 | no | const url = location.href; |
| pathname | variable | 921 | no | let pathname = &#39;&#39;; |
| urlWall | const | 925 | no | const urlWall = /(^\|\\/)(login\|log-in\|signin\|sign-in\|auth\|authorize\|signup\|register)(\\/\|$)/.test(pathname) |
| body | const | 927 | no | const body = String((document.body &amp;&amp; document.body.innerText) \|\| &#39;&#39;).slice(0, 4000); |
| wall | const | 928 | no | const wall = /(sign in to continue\|log in to continue\|you need to sign in\|please sign in\|you must be signed in\|continue with google\|continue with email\|enter your email\|verify you are human\|create an… |
| m | const | 929 | no | const m = body.match(wall); |
| composerUsable | const | 933 | no | const composerUsable = hasComposer &amp;&amp; !composer.disabled &amp;&amp; !composer.readOnly &amp;&amp; composer.getAttribute(&#39;aria-disabled&#39;) !== &#39;true&#39;; |
| modalWall | variable | 937 | no | let modalWall = null; |
| t | const | 940 | no | const t = String(d.innerText \|\| &#39;&#39;).slice(0, 400); |
| dismissCookieBanner | function | 977 | yes | export async function dismissCookieBanner(page, adapter = null) { |
| found | const | 978 | no | const found = await tryEval(page, String.raw`(() =&gt; { ${IN_PAGE} const cookieish = /cookie\|consent\|privacy preference\|gdpr/i; // A link that OPENS the settings modal is not a choice: clicking it leav… |
| cookieish | const | 979 | no | const cookieish = /cookie\|consent\|privacy preference\|gdpr/i; |
| settingsish | const | 982 | no | const settingsish = /setting\|manage\|configur\|customi\|preference\|policy\|more info\|learn more/i; |
| cands | const | 983 | no | const cands = []; |
| t | const | 986 | no | const t = String(el.innerText \|\| &#39;&#39;).slice(0, 600); |
| banner | const | 994 | no | const banner = cands[0]; |
| options | const | 995 | no | const options = []; |
| label | const | 998 | no | const label = String((b.innerText \|\| b.value \|\| b.getAttribute(&#39;aria-label&#39;) \|\| &#39;&#39;)).replace(/\\s+/g, &#39; &#39;).trim(); |
| conservative | const | 1001 | no | const conservative = /necessary\|essential only\|reject all\|declin\|deny\|only necessary\|continue without\|reject/i.test(label); |
| permissive | const | 1002 | no | const permissive = /accept all\|allow all\|agree/i.test(label); |
| pick | const | 1006 | no | const pick = options.find((o) =&gt; o.conservative) \|\| null; |
| permissiveOnly | const | 1007 | no | const permissiveOnly = options.filter((o) =&gt; o.permissive).map((o) =&gt; o.label); |
| label | const | 1011 | no | const label = String((b.innerText \|\| b.value \|\| b.getAttribute(&#39;aria-label&#39;) \|\| &#39;&#39;)).replace(/\\s+/g, &#39; &#39;).trim(); |
| info | const | 1021 | no | const info = found.value; |
| clicked | const | 1024 | no | const clicked = await clickStored(page, &#39;__aionCookieBtn&#39;); |
| closed | const | 1027 | no | const closed = await closeCookieModal(page); |
| closeCookieModal | function | 1033 | yes | export async function closeCookieModal(page) { |
| probe | const | 1034 | no | const probe = String.raw`(() =&gt; ({ url: location.href, dialogs: [...document.querySelectorAll(&#39;[role=&quot;dialog&quot;],dialog&#39;)].filter((el) =&gt; { const r = el.getBoundingClientRect(); return r.width &gt; 1 &amp;&amp; r… |
| r | const | 1037 | no | const r = el.getBoundingClientRect(); |
| before | const | 1041 | no | const before = await tryEval(page, probe); |
| b | const | 1043 | no | const b = before.value; |
| looksOpen | const | 1044 | no | const looksOpen = /manage-cookies\|cookie[-_]?settings/i.test(String(b.url ?? &#39;&#39;)) \|\| (b.dialogs ?? 0) &gt; 0; |
| esc | const | 1047 | no | const esc = { key: &#39;Escape&#39;, code: &#39;Escape&#39;, windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 }; |
| after | const | 1054 | no | const after = await tryEval(page, probe); |
| a | const | 1055 | no | const a = after.ok ? after.value : { url: b.url, dialogs: b.dialogs }; |
| closed | const | 1056 | no | const closed = !/manage-cookies/i.test(String(a.url ?? &#39;&#39;)) &amp;&amp; (a.dialogs ?? 0) === 0; |
| hostMatches | function | 1063 | no | function hostMatches(adapter, url) { |
| host | variable | 1064 | no | let host = &#39;&#39;; |
| bare | const | 1066 | no | const bare = host.replace(/^www\\./, &#39;&#39;); |
| w | const | 1068 | no | const w = String(raw).toLowerCase().replace(/^www\\./, &#39;&#39;); |
| openTab | function | 1075 | no | async function openTab(port, url) { |
| endpoint | const | 1076 | no | const endpoint = `http://127.0.0.1:${port}/json/new?${encodeURI(url)}`; |
| res | variable | 1077 | no | let res = await fetch(endpoint, { method: &#39;PUT&#39; }); |
| waitForTargetId | function | 1083 | no | async function waitForTargetId(port, id, { timeoutMs = 20000, intervalMs = 300 } = {}) { |
| deadline | const | 1084 | no | const deadline = Date.now() + timeoutMs; |
| targets | const | 1086 | no | const targets = await listTargets({ port }).catch(() =&gt; []); |
| hit | const | 1087 | no | const hit = id ? targets.find((t) =&gt; t.id === id) : null; |
| page_bringToFront | function | 1096 | no | async function page_bringToFront(port, targetId) { |
| conn | const | 1097 | no | const conn = await CdpConnection.connect(await browserWsUrl({ port }), { requestTimeoutMs: 15000 }); |
| page | const | 1099 | no | const page = await conn.attach(targetId); |
| closeTab | function | 1107 | no | async function closeTab(port, targetId) { |
| res | const | 1110 | no | const res = await fetch(`http://127.0.0.1:${port}/json/close/${targetId}`); |
| attachFile | function | 1120 | no | async function attachFile(page, filePath) { |
| stat | variable | 1121 | no | let stat; |
| findInput | function | 1128 | no | const findInput = async () =&gt; { |
| search | const | 1130 | no | const search = await page.send(&#39;DOM.performSearch&#39;, { query: &#39;input[type=&quot;file&quot;]&#39;, includeUserAgentShadowDOM: true }); |
| hits | const | 1132 | no | const hits = await page.send(&#39;DOM.getSearchResults&#39;, { searchId: search.searchId, fromIndex: 0, toIndex: search.resultCount }); |
| nodeId | variable | 1138 | no | let nodeId = await findInput(); |
| backendNodeId | variable | 1142 | no | let backendNodeId = 0; |
| onChooser | function | 1143 | no | const onChooser = (ev) =&gt; { if (ev &amp;&amp; ev.backendNodeId) backendNodeId = ev.backendNodeId; }; |
| want | const | 1150 | no | const want = /(a\\u00f1adir archivos\|add files\|adjuntar\|attach files\|upload files)/i; |
| hit | const | 1151 | no | const hit = [...document.querySelectorAll(&#39;button,[role=&quot;button&quot;]&#39;)] |
| waitUntil | const | 1159 | no | const waitUntil = Date.now() + 4000; |
| want | const | 1166 | no | const want = /(ordenador\|computer\|subir\|upload\|mi pc\|from device)/i; |
| hit | const | 1167 | no | const hit = [...document.querySelectorAll(&#39;[role=&quot;menuitem&quot;],[role=&quot;menuitemradio&quot;],button,[role=&quot;button&quot;]&#39;)] |
| shape | variable | 1187 | no | let shape = &#39;unreadable&#39;; |
| probe | const | 1189 | no | const probe = await page.send(&#39;Runtime.evaluate&#39;, { returnByValue: true, expression: `(() =&gt; { let fileInputs = 0; const walk = (root) =&gt; { |
| fileInputs | variable | 1192 | no | let fileInputs = 0; |
| walk | function | 1193 | no | const walk = (root) =&gt; { |
| labels | const | 1200 | no | const labels = [...document.querySelectorAll(&#39;button,[role=&quot;button&quot;]&#39;)] |
| v | const | 1206 | no | const v = probe?.result?.value; |
| pasteOutcome | variable | 1209 | no | let pasteOutcome = &#39;not-attempted&#39;; |
| fs | const | 1211 | no | const fs = await import(&#39;node:fs&#39;); |
| pathMod | const | 1212 | no | const pathMod = await import(&#39;node:path&#39;); |
| buf | const | 1213 | no | const buf = fs.readFileSync(filePath); |
| name | const | 1215 | no | const name = pathMod.basename(filePath); |
| ext | const | 1216 | no | const ext = pathMod.extname(filePath).toLowerCase(); |
| mime | const | 1217 | no | const mime = ext === &#39;.md&#39; ? &#39;text/markdown&#39; : ext === &#39;.json&#39; ? &#39;application/json&#39; |
| pasted | const | 1220 | no | const pasted = await page.send(&#39;Runtime.evaluate&#39;, { returnByValue: true, userGesture: true, expression: `(() =&gt; { const b64 = ${JSON.stringify(buf.toString(&#39;base64&#39;))}; |
| b64 | const | 1224 | no | const b64 = ${JSON.stringify(buf.toString(&#39;base64&#39;))}; |
| bin | const | 1225 | no | const bin = atob(b64); |
| bytes | const | 1226 | no | const bytes = new Uint8Array(bin.length); |
| file | const | 1228 | no | const file = new File([bytes], ${JSON.stringify(name)}, { type: ${JSON.stringify(mime)} }); |
| dt | const | 1229 | no | const dt = new DataTransfer(); |
| target | const | 1231 | no | const target = document.querySelector(&#39;form div[contenteditable=&quot;true&quot;]&#39;) |
| evt | const | 1236 | no | const evt = new ClipboardEvent(&#39;paste&#39;, { clipboardData: dt, bubbles: true, cancelable: true }); |
| how | const | 1241 | no | const how = pasted?.result?.value; |
| driveSite | function | 1266 | yes | export async function driveSite({ adapter, prompt, port = 9222, dataDir, record = true, timeoutMs = 120000, humanPace = true, freshTab = true, onEvent = null, attachmentPath = null } = {}) { |
| lease | const | 1267 | no | const lease = acquireDriveLease({ port, holder: { kind: &#39;drive-job&#39;, id: `legacy-${process.pid}` } }); |
| startedAt | const | 1268 | no | const startedAt = Date.now(); |
| errors | const | 1269 | no | const errors = []; |
| result | const | 1270 | no | const result = { |
| emit | function | 1274 | no | const emit = (ev) =&gt; { try { onEvent?.(ev); } catch { /* a listener must never break the drive */ } }; |
| recorder | variable | 1276 | no | let recorder = null; |
| conn | variable | 1277 | no | let conn = null; |
| page | variable | 1278 | no | let page = null; |
| openedTabId | variable | 1279 | no | let openedTabId = null; |
| captureStopFailed | variable | 1280 | no | let captureStopFailed = false; |
| sendAttempted | variable | 1282 | no | let sendAttempted = false; |
| cleanup | function | 1284 | no | const cleanup = async () =&gt; { |
| closed | const | 1296 | no | const closed = await closeTab(port, openedTabId); |
| openSession | function | 1302 | no | const openSession = async (target) =&gt; { |
| dir | const | 1304 | no | const dir = dataDir ? path.resolve(dataDir) : defaultDataDir(); |
| paths | const | 1305 | no | const paths = dataPaths(dir); |
| store | const | 1307 | no | const store = new ProfileStore(paths.profiles); |
| profileName | variable | 1309 | no | let profileName; |
| session | const | 1313 | no | const session = await recorder.start({ target: target.id, profile: profileName, label: adapter?.id, tabs: &#39;one&#39;, follow: false }); |
| openUrl | const | 1323 | no | const openUrl = adapter?.url ?? (adapter?.hosts?.[0] ? `https://${adapter.hosts[0]}/` : null); |
| expectedThread | const | 1324 | no | const expectedThread = openUrl ? parseThread(adapter?.id, openUrl) : null; |
| threadOf | function | 1326 | no | const threadOf = (url) =&gt; parseThread(adapter?.id, url); |
| openOwnTab | function | 1329 | no | const openOwnTab = async () =&gt; { |
| created | const | 1332 | no | const created = await openTab(port, openUrl); |
| target | const | 1334 | no | const target = await waitForTargetId(port, openedTabId, { timeoutMs: 30000 }); |
| run | function | 1343 | no | const run = async () =&gt; { |
| targets | variable | 1344 | no | let targets; |
| target | variable | 1355 | no | let target = null; |
| eligibleNewChatTab | function | 1359 | no | const eligibleNewChatTab = (t) =&gt; { |
| probe | variable | 1377 | no | let probe = null; |
| composerFound | variable | 1378 | no | let composerFound = null; |
| probePage | const | 1381 | no | const probePage = await probe.attach(target.id); |
| auth | const | 1382 | no | const auth = await detectAuthWall(probePage, adapter); |
| env | const | 1400 | no | const env = await prepareHumanEnvironment(page, { focus: true }); |
| consent | const | 1407 | no | const consent = await dismissCookieBanner(page, adapter); |
| here | variable | 1424 | no | let here = await where(); |
| onThread | const | 1428 | no | const onThread = here.ok ? threadOf(`${here.value?.origin}${here.value?.path}`) : null; |
| home | const | 1441 | no | const home = await where(); |
| path | const | 1447 | no | const path = home.value.path; |
| turns | const | 1448 | no | const turns = Number(home.value.turns); |
| found | const | 1458 | no | const found = await waitForComposer(page, adapter, { timeoutMs: 20000 }); |
| focus | variable | 1464 | no | let focus = await focusComposer(page, found); |
| cleared | const | 1469 | no | const cleared = await clearComposer(page); |
| pre | const | 1479 | no | const pre = await readTranscript(page, adapter, { exclude: [result.prompt] }); |
| baseline | const | 1480 | no | const baseline = pre.last \|\| [...(pre.turns ?? [])].reverse().find((t) =&gt; t.role === &#39;assistant&#39;)?.text \|\| &#39;&#39;; |
| baseCount | const | 1481 | no | const baseCount = pre.count ?? 0; |
| t0 | const | 1489 | no | const t0 = await recorder.domTurns(); |
| attached | const | 1497 | no | const attached = await attachFile(page, attachmentPath); |
| wantName | const | 1507 | no | const wantName = String(attachmentPath).split(/[\\\\/]/).pop(); |
| showBy | const | 1508 | no | const showBy = Date.now() + 25000; |
| shown | variable | 1509 | no | let shown = false; |
| probe | const | 1512 | no | const probe = await page.send(&#39;Runtime.evaluate&#39;, { returnByValue: true, expression: `document.body.innerText.includes(${JSON.stringify(wantName)})`, }); |
| typed | const | 1528 | no | const typed = await typeText(page, result.prompt, { human: humanPace, requireEmpty: true }); |
| promptError | variable | 1540 | no | let promptError = null; |
| sent | const | 1543 | no | const sent = await sendMessage(page, adapter, { verifyDispatch: async () =&gt; { const actual = await readableComposerText(page); promptError = actual === null ? &#39;composer-unreadable&#39; : norm(actual) ===… |
| actual | const | 1545 | no | const actual = await readableComposerText(page); |
| currentThread | function | 1563 | no | const currentThread = async () =&gt; { |
| at | const | 1564 | no | const at = await tryEval(page, &#39;location.origin + location.pathname&#39;); |
| thread | variable | 1567 | no | let thread = await currentThread(); |
| wait | const | 1573 | no | const wait = await waitForCompletion(page, adapter, { timeoutMs, baseline, baseCount, exclude: [result.prompt] }); |
| after | const | 1580 | no | const after = await currentThread(); |
| words | const | 1598 | no | const words = expectedWordsFromPrompt(result.prompt); |
| texts | const | 1600 | no | const texts = wait.texts ?? []; |
| hit | const | 1601 | no | const hit = [...texts].reverse().find((t) =&gt; containsWords(t, words)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 10 | external |
| ../cdp/client.mjs | import | 11 | [studio/src/cdp/client.mjs](../cdp/client.mjs.md) |
| ../cdp/discovery.mjs | import | 12 | [studio/src/cdp/discovery.mjs](../cdp/discovery.mjs.md) |
| ../config.mjs | import | 13 | [studio/src/config.mjs](../config.mjs.md) |
| ../profiles/profiles.mjs | import | 14 | [studio/src/profiles/profiles.mjs](../profiles/profiles.mjs.md) |
| ./recorder.mjs | import | 15 | [studio/src/capture/recorder.mjs](./recorder.mjs.md) |
| ./human.mjs | import | 16 | [studio/src/capture/human.mjs](./human.mjs.md) |
| ./drive-lease.mjs | import | 17 | [studio/src/capture/drive-lease.mjs](./drive-lease.mjs.md) |
| ./conversation-thread.mjs | import | 18 | [studio/src/capture/conversation-thread.mjs](./conversation-thread.mjs.md) |
| node:fs | dynamic | 1122 | external |
| node:fs | dynamic | 1211 | external |
| node:path | dynamic | 1212 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/drive.mjs](../../bin/commands/drive.mjs.md) | ../../src/capture/actions.mjs |
| [studio/src/capture/campaign.mjs](./campaign.mjs.md) | ./actions.mjs |
| [studio/src/capture/conversation-browser-adapter.mjs](./conversation-browser-adapter.mjs.md) | ./actions.mjs |
| [studio/src/studio/drive-api.mjs](../studio/drive-api.mjs.md) | ../capture/actions.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Interaction primitives for driving a live AI web app through CDP.
//
// Design: the generic heuristics below are the primary mechanism and must work with no adapter
// at all; site adapters (src/profiles/sites/<id>.mjs) only refine selector choice. Everything
// here runs over an already-attached page session (the object Recorder exposes as `recorder.page`),
// so `page.send(method, params)` is the only capability assumed.
//
// The chosen composer is remembered in page state (`globalThis.__aionDrive`), never by mutating
// the page's DOM: no marker attributes, no injected elements.
import path from 'node:path';
import { CdpConnection, sleep } from '../cdp/client.mjs';
import { listTargets, browserWsUrl } from '../cdp/discovery.mjs';
import { dataPaths, defaultDataDir, ensureDataDirs } from '../config.mjs';
import { ProfileStore } from '../profiles/profiles.mjs';
import { Recorder } from './recorder.mjs';
import { humanType, humanPressEnter, humanClick, humanIdle, prepareHumanEnvironment, DEFAULT_PACE } from './human.mjs';
import { acquireDriveLease } from './drive-lease.mjs';
import { parseThread } from './conversation-thread.mjs';

// ---------------------------------------------------------------------------------------------
// Shared in-page helpers. Kept free of template-literal syntax so it can be embedded verbatim.
// ---------------------------------------------------------------------------------------------
const IN_PAGE = String.raw`
  const vis = (el) => {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (!(r.width > 1 && r.height > 1)) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
    return true;
  };
  const txt = (el) => String(el.innerText ?? el.textContent ?? '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const store = (el, kind, tag) => { globalThis.__aionDrive = { el: el, kind: kind, tag: tag, at: Date.now() }; return globalThis.__aionDrive; };
  const live = () => { const s = globalThis.__aionDrive; return s && s.el && s.el.isConnected ? s.el : null; };
`;

const norm = (v) => String(v ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------------------------
export async function evaluate(page, expression, { awaitPromise = true, returnByValue = true } = {}) {
  const r = await page.send('Runtime.evaluate', { expression, awaitPromise, returnByValue, userGesture: true });
  if (r?.exceptionDetails) {
    const d = r.exceptionDetails;
    throw new Error(d.exception?.description ?? d.text ?? 'Runtime.evaluate failed');
  }
  return returnByValue ? r?.result?.value : r?.result;
}

async function tryEval(page, expression) {
  try { return { ok: true, value: await evaluate(page, expression) }; }
  catch (e) { return { ok: false, error: String(e?.message ?? e) }; }
}

// ---------------------------------------------------------------------------------------------
// Composer discovery + focus
// ---------------------------------------------------------------------------------------------
export async function findComposer(page, adapter = null) {
  const selectors = Array.isArray(adapter?.composer?.selectors) ? adapter.composer.selectors : [];
  const expr = String.raw`(() => { ${IN_PAGE}
    const adapterSels = ${JSON.stringify(selectors)};
    const kindOf = (el) => el.tagName === 'TEXTAREA' ? 'textarea'
      : el.tagName === 'INPUT' ? 'input'
      : el.isContentEditable ? 'contenteditable'
      : 'textbox';
    const blocked = (el) => el.disabled === true || el.readOnly === true || el.getAttribute('aria-disabled') === 'true';
    const usable = (el) => vis(el) && !blocked(el);

    for (const sel of adapterSels) {
      let els = [];
      try { els = [...document.querySelectorAll(sel)]; } catch (e) { els = []; }
      for (const el of els) {
        if (!usable(el)) continue;
        store(el, kindOf(el), el.tagName.toLowerCase());
        return { found: true, kind: kindOf(el), tag: el.tagName.toLowerCase(), reason: 'adapter selector: ' + sel };
      }
    }

    const genericSels = ['textarea', '[contenteditable="true"]', '[contenteditable=""]', '[role="textbox"]'];
```

_First 80 of 1614 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

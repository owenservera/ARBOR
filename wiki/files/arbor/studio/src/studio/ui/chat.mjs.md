# File: studio/src/studio/ui/chat.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/ui/chat.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 162446 B |
| Lines | 2396 |
| Hash | 3c562d9e50e3 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| API | const | 5 | no | const API = &#39;/api/v1&#39;; |
| SELECTED_KEY | const | 6 | no | const SELECTED_KEY = &#39;capture-studio.chat.selected&#39;; |
| RAW_KEY | const | 7 | no | const RAW_KEY = &#39;capture-studio.chat.plain-reply&#39;; |
| CONVERSATION_STATES | const | 11 | no | const CONVERSATION_STATES = { |
| SEND_STATES | const | 16 | no | const SEND_STATES = { |
| REPLY_STATES | const | 20 | no | const REPLY_STATES = { |
| CAPTURE_STATES | const | 24 | no | const CAPTURE_STATES = { |
| SOURCE_LABELS | const | 28 | no | const SOURCE_LABELS = { |
| BLOCK_LABELS | const | 34 | no | const BLOCK_LABELS = { |
| GATE_LABELS | const | 38 | no | const GATE_LABELS = { |
| GATE_VALUES | const | 42 | no | const GATE_VALUES = { passed: [&#39;Passed&#39;, &#39;t-ok&#39;], failed: [&#39;Failed&#39;, &#39;t-bad&#39;], &#39;not-checked&#39;: [&#39;Not checked&#39;, &#39;t-mute&#39;], unknown: [&#39;Unknown&#39;, &#39;t-warn&#39;] }; |
| REASONS | const | 45 | no | const REASONS = { |
| UNCERTAINTY | const | 54 | no | const UNCERTAINTY = { |
| FINISH_ERRORS | const | 62 | no | const FINISH_ERRORS = { |
| ERROR_TEXT | const | 66 | no | const ERROR_TEXT = { |
| word | function | 102 | no | const word = (s) =&gt; String(s ?? &#39;&#39;).replace(/[-_]+/g, &#39; &#39;).trim(); |
| pair | function | 103 | no | const pair = (table, key, prefix) =&gt; table[key] ?? [(prefix ? prefix + &#39;: &#39; : &#39;&#39;) + (key ? word(key) : &#39;unknown&#39;), &#39;t-warn&#39;]; |
| isCode | function | 104 | no | const isCode = (s) =&gt; typeof s === &#39;string&#39; &amp;&amp; /^[A-Z][A-Z0-9_]{2,}$/.test(s); |
| siteName | function | 106 | yes | export const siteName = (site) =&gt; (typeof site === &#39;string&#39; ? site : site?.id ?? &#39;&#39;); |
| conversationChip | function | 107 | yes | export const conversationChip = (state) =&gt; pair(CONVERSATION_STATES, state, &#39;State&#39;); |
| sendChip | function | 108 | yes | export const sendChip = (state) =&gt; pair(SEND_STATES, state, &#39;Send&#39;); |
| replyChip | function | 109 | yes | export const replyChip = (state) =&gt; pair(REPLY_STATES, state, &#39;Reply&#39;); |
| captureChip | function | 111 | yes | export const captureChip = (state) =&gt; pair(CAPTURE_STATES, state, &#39;Capture&#39;); |
| sourceLabel | function | 112 | yes | export const sourceLabel = (source) =&gt; SOURCE_LABELS[source] ?? &#39;Source: unknown&#39;; |
| completionLabel | function | 113 | yes | export function completionLabel(completion) { |
| gateChip | function | 117 | yes | export function gateChip(value) { return GATE_VALUES[value] ?? GATE_VALUES.unknown; } |
| gateValue | function | 119 | yes | export function gateValue(g) { return g?.state ?? g?.value ?? (g?.ok === true ? &#39;passed&#39; : g?.ok === false ? &#39;failed&#39; : &#39;unknown&#39;); } |
| gateLabel | function | 120 | yes | export function gateLabel(gate) { return gate?.label ?? GATE_LABELS[gate?.id] ?? word(gate?.id ?? &#39;Check&#39;); } |
| integrityText | function | 121 | yes | export function integrityText(capture) { |
| i | const | 122 | no | const i = capture?.integrity; |
| reasonText | function | 129 | yes | export function reasonText(code) { |
| uncertaintyText | function | 133 | yes | export function uncertaintyText(code) { return code ? (UNCERTAINTY[code] ?? &#39;Studio reported: &#39; + word(code) + &#39;.&#39;) : &#39;&#39;; } |
| finishErrorText | function | 134 | yes | export function finishErrorText(err) { return err ? (FINISH_ERRORS[err] ?? String(err)) : &#39;&#39;; } |
| explainError | function | 135 | yes | export function explainError({ status, code, message } = {}) { |
| c | const | 137 | no | const c = code ?? (isCode(message) ? message : null); |
| errorLink | function | 144 | yes | export function errorLink(code) { return code === &#39;DRIVE_LEASE_BUSY&#39; ? { href: &#39;/drive&#39;, text: &#39;Open Live drive&#39; } : null; } |
| notSentReported | function | 146 | yes | export const notSentReported = (err) =&gt; [err?.data?.send?.state, err?.data?.sendState, err?.data?.turn?.send?.state, err?.data?.conversation?.turn?.send?.state].includes(&#39;not-attempted&#39;); |
| sendRejection | function | 148 | yes | export function sendRejection(err) { |
| code | const | 149 | no | const code = err?.data?.code ?? (isCode(err?.message) ? err.message : null); |
| text | variable | 150 | no | let text = (notSentReported(err) ? &#39;Not sent. &#39; : &#39;Studio rejected this request. &#39;) + explainError({ status: err?.status, code, message: err?.message }); |
| hasTurn | function | 155 | yes | export const hasTurn = (snap) =&gt; !!snap?.turn; |
| isBlockedTurn | function | 157 | yes | export const isBlockedTurn = (snap) =&gt; snap?.turn?.phase === &#39;blocked&#39; &amp;&amp; snap?.turn?.send?.state === &#39;not-attempted&#39;; |
| messageStarted | function | 159 | yes | export const messageStarted = (snap) =&gt; !!snap?.turn &amp;&amp; snap.turn.send?.state !== &#39;not-attempted&#39;; |
| isPreparing | function | 160 | yes | export const isPreparing = (snap) =&gt; snap?.turn?.phase === &#39;preparing&#39;; |
| turnsOf | function | 164 | yes | export const turnsOf = (snap) =&gt; (Array.isArray(snap?.turns) &amp;&amp; snap.turns.length ? snap.turns : snap?.turn ? [snap.turn] : []); |
| turnBlockedBeforeTyping | function | 165 | no | const turnBlockedBeforeTyping = (t) =&gt; t?.phase === &#39;blocked&#39; &amp;&amp; t?.send?.state === &#39;not-attempted&#39;; |
| turnSettled | function | 167 | yes | export const turnSettled = (t) =&gt; t?.send?.state === &#39;observed&#39; &amp;&amp; t?.reply?.state === &#39;ready&#39; &amp;&amp; t?.readiness?.state === &#39;ready&#39;; |
| turnInFlight | function | 169 | yes | export const turnInFlight = (snap) =&gt; turnsOf(snap).some((t) =&gt; !turnBlockedBeforeTyping(t) &amp;&amp; !turnSettled(t)); |
| hasUncertainTurn | function | 170 | yes | export const hasUncertainTurn = (snap) =&gt; turnsOf(snap).some((t) =&gt; t?.send?.state === &#39;uncertain&#39; \|\| t?.phase === &#39;needs-reconciliation&#39;); |
| turnCount | function | 171 | yes | export const turnCount = (snap) =&gt; turnsOf(snap).filter((t) =&gt; !turnBlockedBeforeTyping(t)).length; |
| composerOpen | function | 173 | yes | export const composerOpen = (snap) =&gt; !!snap &amp;&amp; ![&#39;closed&#39;, &#39;finalizing&#39;].includes(snap.state) &amp;&amp; !turnInFlight(snap); |
| turnRows | function | 175 | yes | export function turnRows(snap, prompts = {}) { |
| turns | const | 176 | no | const turns = turnsOf(snap); |
| detail | const | 177 | no | const detail = [...turns].reverse().find((t) =&gt; !turnBlockedBeforeTyping(t) \|\| t?.phase === &#39;preparing&#39;); |
| blocked | const | 179 | no | const blocked = turnBlockedBeforeTyping(t), reply = t?.reply ?? {}; |
| historyRow | function | 189 | yes | export function historyRow(c) { |
| n | const | 190 | no | const n = turnCount(c), cs = c?.capture?.state, site = siteName(c?.site); |
| title | const | 191 | no | const title = (typeof c?.binding?.title === &#39;string&#39; &amp;&amp; c.binding.title.trim()) \|\| site \|\| c?.id \|\| &#39;Conversation&#39;; |
| meta | const | 192 | no | const meta = [site &amp;&amp; title !== site ? site : null, n ? n + (n === 1 ? &#39; turn&#39; : &#39; turns&#39;) : turnsOf(c).length ? &#39;Nothing sent&#39; : null, cs ? captureChip(cs)[0] : null, threadRef(c?.binding) ? &#39;Chat t… |
| HISTORY_PAGE | const | 195 | yes | export const HISTORY_PAGE = 20; |
| historyShown | function | 196 | yes | export const historyShown = (list, all) =&gt; (all ? list : list.slice(0, HISTORY_PAGE)); |
| draftInfo | function | 198 | yes | export function draftInfo(snap) { |
| d | const | 199 | no | const d = snap?.readiness?.draft ?? snap?.draft ?? snap?.binding?.draft ?? null; |
| reason | const | 202 | no | const reason = snap?.readiness?.reason ?? snap?.blocked?.reason ?? snap?.blockedReason ?? snap?.reason; |
| isUncertain | function | 205 | yes | export const isUncertain = (snap) =&gt; snap?.turn?.send?.state === &#39;uncertain&#39; \|\| snap?.state === &#39;needs-reconciliation&#39;; |
| providerName | function | 207 | yes | export const providerName = (site) =&gt; { const s = siteName(site); return s.toLowerCase() === &#39;chatgpt&#39; ? &#39;ChatGPT&#39; : s ? s.charAt(0).toUpperCase() + s.slice(1) : &#39;your AI&#39;; }; |
| tabHref | function | 209 | yes | export function tabHref(snap) { return safeHref(snap?.binding?.url ?? snap?.binding?.origin ?? &#39;&#39;); } |
| uncertainView | function | 212 | yes | export function uncertainView(snap, { pending = false, detail = &#39;&#39;, checks = 0, maxChecks = 3 } = {}) { |
| who | const | 213 | no | const who = providerName(snap?.site); |
| sendUnsure | const | 214 | no | const sendUnsure = pending \|\| snap?.turn?.send?.state === &#39;uncertain&#39; \|\| snap?.diagnostic?.uncertainty === &#39;send-acknowledgement-lost&#39;; |
| lines | const | 215 | no | const lines = [uncertaintyText(snap?.diagnostic?.uncertainty), finishErrorText(snap?.diagnostic?.finishError), reasonText(snap?.turn?.reason)].filter(Boolean); |
| note | const | 218 | no | const note = checks &gt;= maxChecks |
| chromeGuidance | function | 231 | yes | export function chromeGuidance(snap, sendUnsure) { |
| tab | const | 232 | no | const tab = snap?.binding?.title \|\| (snap?.binding?.url ? shortUrl(snap.binding.url) : &#39;&#39;); |
| how | const | 234 | no | const how = tabHref(snap) ? &#39; Use the button above, or switch to it in Chrome.&#39; : &#39; Switch to it in Chrome.&#39;; |
| blockedTurns | function | 239 | no | const blockedTurns = (snap) =&gt; turnsOf(snap).filter(turnBlockedBeforeTyping); |
| sendStateView | function | 240 | yes | export function sendStateView(snap) { |
| off | const | 241 | no | const off = { show: false, head: &#39;&#39;, note: &#39;&#39;, resend: false }; |
| blocked | const | 244 | no | const blocked = blockedTurns(snap); |
| reason | const | 246 | no | const reason = reasonText(blocked.at(-1)?.reason); |
| replyStopped | function | 254 | no | const replyStopped = (snap) =&gt; snap?.reply?.state === &#39;interrupted&#39; \|\| [&#39;closed&#39;, &#39;finalizing&#39;, &#39;needs-reconciliation&#39;].includes(snap?.state); |
| replyStateView | function | 255 | yes | export function replyStateView(snap) { |
| off | const | 256 | no | const off = { show: false, kind: null, head: &#39;&#39;, note: &#39;&#39;, recheck: false }; |
| r | const | 258 | no | const r = snap.reply, who = providerName(snap.site), text = typeof r.text === &#39;string&#39; ? r.text : &#39;&#39;; |
| readinessChip | function | 277 | yes | export function readinessChip(snap) { |
| r | const | 279 | no | const r = snap.readiness, d = draftInfo(snap); |
| readinessText | function | 285 | yes | export function readinessText(snap) { |
| r | const | 286 | no | const r = snap?.readiness; |
| d | const | 290 | no | const d = draftInfo(snap); |
| readinessPanel | function | 295 | yes | export function readinessPanel(snap) { |
| off | const | 296 | no | const off = { show: false, draft: false, chars: null, heading: &#39;&#39;, lines: [] }; |
| d | const | 300 | no | const d = draftInfo(snap), lines = [], add = (t) =&gt; { if (t &amp;&amp; !lines.includes(t)) lines.push(t); }; |
| r | const | 301 | no | const r = snap.readiness; |
| isActive | function | 309 | yes | export function isActive(snap) { |
| canSend | function | 317 | yes | export function canSend(snap, { prompt = &#39;&#39;, busy = false } = {}) { |
| earlierTurn | const | 337 | no | const earlierTurn = turnCount(snap) &gt; 0; |
| pickSnapshot | function | 345 | yes | export function pickSnapshot(current, incoming) { |
| unwrapConversation | function | 357 | yes | export function unwrapConversation(data) { |
| c | const | 358 | no | const c = data?.conversation ?? data?.resource ?? data; |
| isAmbiguous | function | 362 | yes | export function isAmbiguous(err) { return !err \|\| err.status === 0 \|\| err.status === 408 \|\| err.status &gt;= 500 \|\| err.malformed === true; } |
| pendingRegistered | function | 364 | yes | export const pendingRegistered = (pending, snap) =&gt; !!pending &amp;&amp; !!snap &amp;&amp; pending.convId === snap.id &amp;&amp; !!snap.turn &amp;&amp; snap.turn.id !== (pending.priorTurnId ?? null); |
| pendingUnknown | function | 366 | yes | export const pendingUnknown = (pending, snap, submitting = false) =&gt; !!pending &amp;&amp; !!snap &amp;&amp; !submitting &amp;&amp; pending.convId === snap.id &amp;&amp; !pendingRegistered(pending, snap); |
| checkFoundNoMessage | function | 368 | yes | export const checkFoundNoMessage = (pending, snap) =&gt; pendingUnknown(pending, snap) &amp;&amp; !isUncertain(snap) &amp;&amp; !hasUncertainTurn(snap) |
| ownedByStudio | function | 370 | yes | export function ownedByStudio(snap) { |
| b | const | 371 | no | const b = snap?.binding ?? {}; |
| canCloseTab | function | 374 | yes | export const canCloseTab = (snap) =&gt; ownedByStudio(snap) &amp;&amp; !isUncertain(snap) &amp;&amp; !snap?.diagnostic?.uncertainty; |
| AUTO_CHECK_DELAYS | const | 376 | yes | export const AUTO_CHECK_DELAYS = Object.freeze([2000, 5000, 12000]); |
| pollDelay | function | 377 | yes | export function pollDelay(snap, { hidden = false, failures = 0 } = {}) { |
| replyBlocks | function | 384 | yes | export function replyBlocks(reply) { |
| raw | const | 386 | no | const raw = Array.isArray(reply.blocks) &amp;&amp; reply.blocks.length ? reply.blocks : null; |
| blocks | const | 387 | no | const blocks = raw |
| shownChars | function | 395 | yes | export function shownChars(blocks) { return blocks.filter((b) =&gt; b.kind === &#39;answer&#39;).reduce((n, b) =&gt; n + (b.text?.length ?? 0), 0); } |
| mergeReplyText | function | 400 | yes | export function mergeReplyText(reply, r) { |
| cur | const | 402 | no | const cur = typeof reply.text === &#39;string&#39; ? reply.text : &#39;&#39;; |
| curChars | const | 403 | no | const curChars = Number.isFinite(reply.chars) ? reply.chars : cur.length; |
| evChars | const | 404 | no | const evChars = Number.isFinite(r.chars) ? r.chars : r.text.length; |
| text | const | 405 | no | const text = r.truncated &amp;&amp; r.text.length &lt; cur.length ? cur : (r.text.length &gt; cur.length ? r.text : cur); |
| PRIVATE_USE | const | 415 | no | const PRIVATE_USE = /[\\uE000-\\uF8FF]/g; |
| safeHref | function | 416 | yes | export function safeHref(u) { |
| hostOf | function | 419 | yes | export function hostOf(u) { try { const x = new URL(u); return x.protocol === &#39;mailto:&#39; ? x.pathname : x.host; } catch { return &#39;&#39;; } } |
| ESCAPABLE | const | 421 | no | const ESCAPABLE = &#39;\\\\`*_{}[]()#+-.!\|~&gt;&#39;; |
| matchClose | function | 422 | no | function matchClose(s, open, a, b) { |
| depth | variable | 423 | no | let depth = 0; |
| parseInline | function | 431 | yes | export function parseInline(src, depth = 0) { |
| s | const | 432 | no | const s = String(src ?? &#39;&#39;), out = []; |
| buf | variable | 433 | no | let buf = &#39;&#39;, i = 0; |
| flush | function | 434 | no | const flush = () =&gt; { if (buf) { out.push({ t: &#39;text&#39;, s: buf.replace(PRIVATE_USE, &#39;&#39;) }); buf = &#39;&#39;; } }; |
| ch | const | 436 | no | const ch = s[i]; |
| m | const | 439 | no | const m = /^\\uE200cite((?:\\uE202[^\\uE200-\\uE2FF]*)+)\\uE201/.exec(s.slice(i, i + 400)); |
| n | variable | 443 | no | let n = 1; while (s[i + n] === &#39;`&#39;) n++; |
| fence | const | 444 | no | const fence = &#39;`&#39;.repeat(n), end = s.indexOf(fence, i + n); |
| two | const | 453 | no | const two = s.substr(i, 2); |
| bad | function | 462 | no | const bad = (e) =&gt; /\\s/.test(s[e - 1]) \|\| s[e + 1] === ch \|\| s[e - 1] === ch \|\| (ch === &#39;_&#39; &amp;&amp; /[A-Za-z0-9]/.test(s[e + 1] ?? &#39;&#39;)); |
| image | const | 467 | no | const image = ch === &#39;!&#39;, open = image ? i + 1 : i, close = matchClose(s, open, &#39;[&#39;, &#39;]&#39;); |
| label | const | 469 | no | const label = s.slice(open + 1, close); |
| p | const | 471 | no | const p = matchClose(s, close + 1, &#39;(&#39;, &#39;)&#39;); |
| um | const | 473 | no | const um = /^&lt;([^&gt;]*)&gt;\|^(\\S+)/.exec(s.slice(close + 2, p).trim()), url = um ? (um[1] ?? um[2]) : &#39;&#39;; |
| num | const | 477 | no | const num = /^\\^?(\\d{1,3})$/.exec(label); |
| url | variable | 482 | no | let url = /^https?:\\/\\/[^\\s&lt;&gt;\\u0000]+/i.exec(s.slice(i))[0]; |
| count | function | 483 | no | const count = (c) =&gt; url.split(c).length - 1; |
| FENCE | const | 494 | no | const FENCE = /^\\s*(`{3,}\|~{3,})\\s*([^\\s`]*)[^`]*$/; |
| HEADING | const | 495 | no | const HEADING = /^ {0,3}(#{1,6})[ \\t]+(.+?)(?:[ \\t]+#+)?[ \\t]*$/; |
| RULE | const | 496 | no | const RULE = /^ {0,3}([-*_])(?:[ \\t]*\\1){2,}[ \\t]*$/; |
| LIST_ITEM | const | 497 | no | const LIST_ITEM = /^(\\s*)([-*+]\|\\d{1,9}[.)])[ \\t]+(.*)$/; |
| QUOTE | const | 498 | no | const QUOTE = /^ {0,3}&gt;[ \\t]?(.*)$/; |
| LINK_DEF | const | 499 | no | const LINK_DEF = /^ {0,3}\\[\\^?([^\\]\\s][^\\]]{0,60})\\]:[ \\t]*&lt;?(\\S+?)&gt;?(?:[ \\t]+[&quot;&#39;(].*[&quot;&#39;)])?[ \\t]*$/; |
| TABLE_DELIM | const | 500 | no | const TABLE_DELIM = /^\\s*\\\|?\\s*:?-+:?\\s*(?:\\\|\\s*:?-+:?\\s*)*\\\|?\\s*$/; |
| splitRow | function | 501 | no | const splitRow = (line) =&gt; { |
| t | const | 502 | no | const t = line.trim().replace(/^\\\|/, &#39;&#39;).replace(/(?&lt;!\\\\)\\\|$/, &#39;&#39;); |
| indentOf | function | 505 | no | const indentOf = (s) =&gt; s.replace(/\\t/g, &#39; &#39;).length; |
| isTableStart | function | 506 | no | const isTableStart = (lines, k) =&gt; k + 1 &lt; lines.length &amp;&amp; lines[k].includes(&#39;\|&#39;) &amp;&amp; lines[k + 1].includes(&#39;\|&#39;) &amp;&amp; TABLE_DELIM.test(lines[k + 1]) |
| startsBlock | function | 508 | no | const startsBlock = (lines, k) =&gt; FENCE.test(lines[k]) \|\| HEADING.test(lines[k]) \|\| RULE.test(lines[k]) \|\| QUOTE.test(lines[k]) \|\| LIST_ITEM.test(lines[k]) \|\| isTableStart(lines, k); |
| parseBlocks | function | 510 | yes | export function parseBlocks(text, depth = 0) { |
| lines | const | 511 | no | const lines = String(text ?? &#39;&#39;).replace(/\\r\\n?/g, &#39;\\n&#39;).split(&#39;\\n&#39;), out = []; |
| i | variable | 512 | no | let i = 0; |
| line | const | 514 | no | const line = lines[i]; |
| m | variable | 516 | no | let m; |
| mark | const | 518 | no | const mark = m[1], body = []; let closed = false; i++; |
| t | const | 520 | no | const t = lines[i].trim(); |
| inner | const | 531 | no | const inner = []; |
| head | const | 537 | no | const head = splitRow(line), align = splitRow(lines[i + 1]).map((c) =&gt; (c.startsWith(&#39;:&#39;) &amp;&amp; c.endsWith(&#39;:&#39;) ? &#39;center&#39; : c.endsWith(&#39;:&#39;) ? &#39;right&#39; : c.startsWith(&#39;:&#39;) ? &#39;left&#39; : null)); |
| rows | const | 538 | no | const rows = []; i += 2; |
| cells | const | 540 | no | const cells = splitRow(lines[i]); while (cells.length &lt; head.length) cells.push(&#39;&#39;); |
| items | const | 547 | no | const items = [], stack = [], base = indentOf(m[1]), topOrdered = /\\d/.test(m[2]); |
| sameList | function | 549 | no | const sameList = (x) =&gt; indentOf(x[1]) &gt; base \|\| /\\d/.test(x[2]) === topOrdered; |
| depthFor | function | 550 | no | const depthFor = (ind) =&gt; { while (stack.length &amp;&amp; stack.at(-1) &gt; ind) stack.pop(); if (!stack.length \|\| stack.at(-1) &lt; ind) stack.push(ind); return Math.min(stack.length - 1, 4); }; |
| l | const | 552 | no | const l = lines[i]; |
| k | variable | 554 | no | let k = i; while (k &lt; lines.length &amp;&amp; !lines[k].trim()) k++; |
| nm | const | 555 | no | const nm = k &lt; lines.length ? LIST_ITEM.exec(lines[k]) : null; |
| im | const | 560 | no | const im = LIST_ITEM.exec(l); |
| ind | const | 562 | no | const ind = indentOf(im[1]); if (ind &lt; base \|\| !sameList(im)) break; |
| t | variable | 563 | no | let t = im[3], task = null; const tm = /^\\[([ xX])\\][ \\t]+(.*)$/.exec(t); if (tm) { task = tm[1] !== &#39; &#39;; t = tm[2]; } |
| para | const | 572 | no | const para = [line.trimEnd()]; i++; |
| FILE_EXT | const | 580 | no | const FILE_EXT = { html: &#39;html&#39;, svg: &#39;svg&#39;, xml: &#39;xml&#39;, mermaid: &#39;mmd&#39;, markdown: &#39;md&#39;, md: &#39;md&#39;, tex: &#39;tex&#39;, latex: &#39;tex&#39;, csv: &#39;csv&#39;, javascript: &#39;js&#39;, js: &#39;js&#39;, jsx: &#39;jsx&#39;, typescript: &#39;ts&#39;, |
| DOCUMENT_LANGS | const | 582 | no | const DOCUMENT_LANGS = new Set([&#39;html&#39;, &#39;svg&#39;, &#39;xml&#39;, &#39;mermaid&#39;, &#39;markdown&#39;, &#39;md&#39;, &#39;tex&#39;, &#39;latex&#39;, &#39;csv&#39;]); |
| artifactInfo | function | 583 | yes | export function artifactInfo(block) { |
| lines | const | 585 | no | const lines = block.text.split(&#39;\\n&#39;).length; |
| parseRich | function | 589 | yes | export function parseRich(text) { |
| blocks | const | 590 | no | const blocks = parseBlocks(text); |
| n | variable | 591 | no | let n = 0; |
| eachInline | function | 596 | no | function eachInline(blocks, fn) { |
| eachBlock | function | 604 | no | function eachBlock(blocks, fn) { for (const b of blocks) { fn(b); if (b.type === &#39;quote&#39;) eachBlock(b.children, fn); } } |
| walkLinks | function | 605 | no | function walkLinks(nodes, fn) { for (const n of nodes) { if (n.t === &#39;link&#39;) fn(n); else if (n.c) walkLinks(n.c, fn); } } |
| replySources | function | 609 | yes | export function replySources(reply, blocks = []) { |
| out | const | 610 | no | const out = [], seen = new Set(), numbers = new Set(); |
| add | function | 611 | no | const add = (url, title, extra) =&gt; { |
| href | const | 612 | no | const href = safeHref(url); if (!href \|\| seen.has(href)) return; |
| n | variable | 615 | no | let n = Number.isFinite(extra.n) &amp;&amp; extra.n &gt; 0 ? extra.n : 1; |
| reported | const | 620 | no | const reported = []; |
| items | const | 624 | no | const items = b.items ?? b.payload?.items ?? b.payload?.citations; if (Array.isArray(items)) reported.push(...items); |
| inlineText | function | 634 | no | const inlineText = (nodes) =&gt; (nodes ?? []).map((n) =&gt; n.s ?? inlineText(n.c)).join(&#39;&#39;); |
| sourcesSig | function | 635 | yes | export const sourcesSig = (sources) =&gt; sources.map((s) =&gt; s.n + &#39;:&#39; + s.url).join(&#39;\|&#39;); |
| sourcesNote | function | 636 | yes | export function sourcesNote(sources) { |
| replyArtifacts | function | 644 | yes | export function replyArtifacts(reply) { |
| raw | const | 645 | no | const raw = Array.isArray(reply?.artifacts) ? reply.artifacts : []; |
| text | const | 648 | no | const text = typeof a.text === &#39;string&#39; ? a.text : typeof a.content === &#39;string&#39; ? a.content : null, href = safeHref(a.url ?? a.href); |
| lang | const | 650 | no | const lang = String(a.language ?? a.lang ?? a.kind ?? &#39;&#39;).toLowerCase().replace(/^.*\\//, &#39;&#39;); |
| artifactFileName | function | 654 | yes | export function artifactFileName(n, ext, title = &#39;&#39;) { |
| base | const | 655 | no | const base = String(title).toLowerCase().replace(/[^a-z0-9]+/g, &#39;-&#39;).replace(/^-+\|-+$/g, &#39;&#39;).slice(0, 40); |
| tableToTsv | function | 658 | yes | export function tableToTsv(head, rows) { |
| cell | function | 659 | no | const cell = (c) =&gt; String(c).replace(/[\\t\\r\\n]+/g, &#39; &#39;); |
| createRichRenderer | function | 664 | yes | export function createRichRenderer(doc, { copy = async () =&gt; false, download = () =&gt; false, notice = () =&gt; {} } = {}) { |
| t | function | 665 | no | const t = (s) =&gt; doc.createTextNode(s); |
| h | function | 666 | no | const h = (tag, props = {}, kids = []) =&gt; { |
| n | const | 667 | no | const n = doc.createElement(tag); |
| flash | function | 677 | no | const flash = (btn, base, ok) =&gt; { |
| timer | const | 680 | no | const timer = setTimeout(() =&gt; { btn.textContent = base; }, 1800); timer?.unref?.(); |
| copyButton | function | 682 | no | const copyButton = (label, getText, aria) =&gt; { |
| btn | const | 683 | no | const btn = h(&#39;button&#39;, { type: &#39;button&#39;, class: &#39;mini&#39;, text: label, &#39;aria-label&#39;: aria }); |
| sup | function | 687 | no | const sup = (n, title, link) =&gt; h(&#39;sup&#39;, { class: &#39;cite&#39;, title }, link ? [h(&#39;a&#39;, { href: link, target: &#39;_blank&#39;, rel: &#39;noopener noreferrer&#39; }, [&#39;[&#39; + n + &#39;]&#39;, h(&#39;span&#39;, { class: &#39;sr&#39;, text: &#39; (opens… |
| inline | function | 689 | no | function inline(nodes, ctx) { |
| label | const | 695 | no | const label = inline(n.c, ctx); |
| nums | const | 702 | no | const nums = n.refs.map((r) =&gt; { if (!ctx.refs.has(r)) ctx.refs.set(r, ctx.refs.size + 1); return ctx.refs.get(r); }); |
| src | const | 705 | no | const src = ctx.sources.find((s) =&gt; s.n === n.n); |
| align | function | 711 | no | const align = (a) =&gt; (a === &#39;right&#39; ? &#39;al-r&#39; : a === &#39;center&#39; ? &#39;al-c&#39; : null); |
| codeBlock | function | 713 | no | function codeBlock(blk, ctx) { |
| art | const | 714 | no | const art = blk.artifact; |
| textNode | const | 715 | no | const textNode = t(blk.text), code = h(&#39;code&#39;, {}, [textNode]), pre = h(&#39;pre&#39;, { tabindex: 0, &#39;aria-label&#39;: (art ? &#39;Artifact &#39; + art.n + &#39; &#39; : &#39;Code &#39;) + (blk.lang \|\| &#39;text&#39;) }, [code]); |
| meta | const | 716 | no | const meta = h(&#39;span&#39;, { class: &#39;codeblk-meta&#39; }); |
| cur | variable | 717 | no | let cur = blk, now = ctx; |
| describe | function | 718 | no | const describe = () =&gt; { |
| lines | const | 719 | no | const lines = cur.text ? cur.text.split(&#39;\\n&#39;).length : 0; |
| buttons | const | 723 | no | const buttons = [copyButton(&#39;Copy&#39;, () =&gt; cur.text, (art ? &#39;Copy artifact &#39; + art.n : &#39;Copy code&#39;) + (cur.lang ? &#39; (&#39; + cur.lang + &#39;)&#39; : &#39;&#39;))]; |
| dl | const | 725 | no | const dl = h(&#39;button&#39;, { type: &#39;button&#39;, class: &#39;mini&#39;, text: &#39;Download&#39;, &#39;aria-label&#39;: &#39;Download artifact &#39; + art.n }); |
| head | const | 729 | no | const head = h(&#39;div&#39;, { class: &#39;codeblk-head&#39; }, [h(&#39;span&#39;, { class: &#39;codeblk-lang&#39;, text: (art ? &#39;Artifact &#39; + art.n + &#39; · &#39; : &#39;&#39;) + (blk.lang \|\| &#39;text&#39;) }), meta, h(&#39;span&#39;, { class: &#39;codeblk-action… |
| root | const | 730 | no | const root = h(&#39;figure&#39;, { class: &#39;codeblk&#39; + (art ? &#39; artifact&#39; : &#39;&#39;), role: &#39;group&#39; }, [head, pre]); |
| tableBlock | function | 734 | no | function tableBlock(blk, ctx) { |
| cells | function | 735 | no | const cells = (tag, row) =&gt; row.map((c, i) =&gt; h(tag, { class: align(blk.align[i]), scope: tag === &#39;th&#39; ? &#39;col&#39; : null }, inline(parseInline(c), ctx))); |
| table | const | 736 | no | const table = h(&#39;table&#39;, {}, [h(&#39;thead&#39;, {}, [h(&#39;tr&#39;, {}, cells(&#39;th&#39;, blk.head))]), h(&#39;tbody&#39;, {}, blk.rows.map((r) =&gt; h(&#39;tr&#39;, {}, cells(&#39;td&#39;, r))))]); |
| label | const | 737 | no | const label = &#39;Table, &#39; + blk.rows.length + (blk.rows.length === 1 ? &#39; row, &#39; : &#39; rows, &#39;) + blk.head.length + (blk.head.length === 1 ? &#39; column&#39; : &#39; columns&#39;) + &#39;. Scroll sideways if it is wide.&#39;; |
| wrap | const | 738 | no | const wrap = h(&#39;div&#39;, { class: &#39;tablewrap&#39;, role: &#39;region&#39;, tabindex: 0, &#39;aria-label&#39;: label }, [table]); |
| listBlock | function | 741 | no | function listBlock(blk, ctx) { |
| root | const | 742 | no | const root = h(blk.items[0]?.ordered ? &#39;ol&#39; : &#39;ul&#39;, { start: blk.items[0]?.ordered &amp;&amp; blk.items[0].start !== 1 ? blk.items[0].start : null }); |
| levels | const | 743 | no | const levels = [{ list: root, li: null }]; |
| top | const | 747 | no | const top = levels.at(-1); |
| sub | const | 749 | no | const sub = h(it.ordered ? &#39;ol&#39; : &#39;ul&#39;); top.li.append(sub); |
| body | const | 752 | no | const body = inline(parseInline(it.text), ctx); |
| li | const | 753 | no | const li = h(&#39;li&#39;, { class: it.task == null ? null : &#39;task&#39; }, [...(it.task == null ? [] : [h(&#39;span&#39;, { class: &#39;taskbox&#39;, text: it.task ? &#39;☑ &#39; : &#39;☐ &#39;, &#39;aria-label&#39;: it.task ? &#39;Done: &#39; : &#39;Not done: &#39; … |
| build | function | 758 | no | function build(blk, ctx) { |
| sync | function | 770 | no | function sync(root, state, parsed, ctx) { |
| full | const | 772 | no | const full = { sources: ctx.sources ?? [], streaming: !!ctx.streaming, refs: state.refs }; |
| base | const | 773 | no | const base = sourcesSig(full.sources); |
| sig | const | 775 | no | const sig = base + (blk.type === &#39;code&#39; ? (full.streaming ? &#39;~&#39; : &#39;=&#39;) : &#39;&#39;) + JSON.stringify(blk), cur = state.items[i]; |
| want | const | 781 | no | const want = state.items.map((x) =&gt; x.node).filter(Boolean), have = Array.from(root.children); |
| sourceRow | function | 784 | no | function sourceRow(src) { |
| artifactCard | function | 792 | no | function artifactCard(a) { |
| kids | const | 793 | no | const kids = [h(&#39;div&#39;, { class: &#39;codeblk-head&#39; }, [h(&#39;span&#39;, { class: &#39;codeblk-lang&#39;, text: &#39;Artifact · &#39; + a.title + (a.lang ? &#39; · &#39; + a.lang : &#39;&#39;) }), h(&#39;span&#39;, { class: &#39;codeblk-actions&#39; }, [ ...(… |
| renderStatic | function | 803 | no | function renderStatic(root, text, ctx = {}) { const state = {}; sync(root, state, parseRich(text).blocks, ctx); return state; } |
| SOURCE_TONES | const | 808 | no | const SOURCE_TONES = { network: &#39;t-info&#39;, page: &#39;t-mute&#39;, differ: &#39;t-warn&#39;, candidate: &#39;t-warn&#39; }; |
| sourceChip | function | 809 | yes | export const sourceChip = (source) =&gt; [sourceLabel(source), SOURCE_TONES[source] ?? &#39;t-warn&#39;]; |
| completionKnown | function | 810 | yes | export const completionKnown = (c) =&gt; !(c == null \|\| c === &#39;&#39; \|\| c === &#39;unknown&#39;); |
| completionChip | function | 811 | yes | export const completionChip = (c) =&gt; (completionKnown(c) ? [&#39;Network completion: &#39; + word(c), &#39;t-info&#39;] : [&#39;Network completion: unknown&#39;, &#39;t-warn&#39;]); |
| PARTIAL_TEXT | const | 812 | yes | export const PARTIAL_TEXT = &#39;This answer may be incomplete. Studio couldn’t confirm that the site finished it.&#39;; |
| replyMayBePartial | function | 813 | yes | export const replyMayBePartial = (reply) =&gt; [&#39;interrupted&#39;, &#39;unknown&#39;].includes(reply?.state); |
| ago | function | 814 | yes | export function ago(ms) { const s = Math.max(0, Math.floor(ms / 1000)); return s &lt; 2 ? &#39;just now&#39; : s &lt; 60 ? s + &#39;s ago&#39; : Math.floor(s / 60) + &#39; min ago&#39;; } |
| replyCountText | function | 815 | yes | export function replyCountText(chars, ageMs = null) { |
| n | const | 816 | no | const n = Number.isFinite(chars) ? chars : 0; |
| replyReadyText | function | 820 | yes | export function replyReadyText(snap) { |
| r | const | 821 | no | const r = snap?.reply; |
| stageInfo | function | 826 | yes | export function stageInfo(snap, { pending = false, submitting = false } = {}) { |
| total | const | 827 | no | const total = 5, at = (n, label) =&gt; ({ n, total, label, text: &#39;Step &#39; + n + &#39; of &#39; + total + &#39;: &#39; + label }); |
| r | const | 835 | no | const r = snap.reply?.state; |
| finishControl | function | 845 | yes | export function finishControl(snap, { working = false } = {}) { |
| closed | const | 847 | no | const closed = snap.state === &#39;closed&#39;, fin = snap.state === &#39;finalizing&#39; \|\| snap.capture?.state === &#39;finalizing&#39;; |
| early | const | 848 | no | const early = !closed &amp;&amp; !fin &amp;&amp; messageStarted(snap) &amp;&amp; [&#39;waiting&#39;, &#39;streaming&#39;].includes(snap.reply?.state); |
| evidenceOf | function | 854 | yes | export const evidenceOf = (snap) =&gt; snap?.evidence ?? snap?.turn?.evidence ?? snap?.capture?.evidence ?? null; |
| finishOutcome | function | 856 | yes | export function finishOutcome(snap) { |
| cs | const | 858 | no | const cs = snap.capture?.state; |
| gates | const | 860 | no | const gates = Array.isArray(evidenceOf(snap)?.gates) ? evidenceOf(snap).gates : []; |
| reasons | const | 861 | no | const reasons = gates.filter((g) =&gt; [&#39;failed&#39;, &#39;unknown&#39;].includes(gateValue(g))).map((g) =&gt; { const note = typeof g?.reason === &#39;string&#39; &amp;&amp; g.reason ? &#39; (&#39; + reasonText(g.reason).replace(/\\.$/, &#39;&#39;) … |
| note | const | 862 | no | const note = typeof g?.reason === &#39;string&#39; &amp;&amp; g.reason ? &#39; (&#39; + reasonText(g.reason).replace(/\\.$/, &#39;&#39;) + &#39;)&#39; : &#39;&#39;; |
| limitStatus | function | 868 | yes | export function limitStatus(capture, now = Date.now()) { |
| lines | const | 869 | no | const lines = []; let warn = false; |
| max | const | 871 | no | const max = Number(capture.maxBytes), used = Number(capture.bytesWritten); |
| ends | const | 876 | no | const ends = typeof capture.endsAt === &#39;number&#39; ? capture.endsAt : Date.parse(capture.endsAt ?? &#39;&#39;); |
| left | const | 878 | no | const left = Math.max(0, Math.round((ends - now) / 60000)); |
| mib | function | 884 | no | function mib(n) { return (n / 1048576).toFixed(n &gt;= 10485760 ? 0 : 1) + &#39; MiB&#39;; } |
| shortUrl | function | 885 | yes | export function shortUrl(u) { try { const x = new URL(u); return x.host + x.pathname + (x.search ? &#39;?…&#39; : &#39;&#39;); } catch { return String(u ?? &#39;&#39;); } } |
| newKey | function | 886 | yes | export function newKey() { |
| c | const | 887 | no | const c = globalThis.crypto; |
| b | const | 889 | no | const b = new Uint8Array(16); c?.getRandomValues?.(b); |
| limitationText | function | 892 | yes | export function limitationText(l) { return typeof l === &#39;string&#39; ? l : l?.message ?? l?.text ?? l?.reason ?? JSON.stringify(l); } |
| targetHint | function | 893 | yes | export function targetHint(t) { |
| IDENTITY_CHIPS | const | 903 | no | const IDENTITY_CHIPS = { |
| IDENTITY_REASONS | const | 906 | no | const IDENTITY_REASONS = { |
| READ_MAX | const | 914 | yes | export const READ_MAX = Object.freeze({ maxMessages: 200, maxChars: 200000 }); |
| threadRef | function | 917 | yes | export function threadRef(x) { |
| t | const | 918 | no | const t = x?.thread; |
| identityState | function | 922 | yes | export const identityState = (identity) =&gt; (identity &amp;&amp; typeof identity === &#39;object&#39; &amp;&amp; typeof identity.state === &#39;string&#39; ? identity.state : null); |
| identityChip | function | 923 | yes | export const identityChip = (identity) =&gt; pair(IDENTITY_CHIPS, identityState(identity), &#39;Thread&#39;); |
| identityReasonText | function | 924 | yes | export function identityReasonText(identity) { |
| reason | const | 925 | no | const reason = identity?.reason; |
| identityView | function | 930 | yes | export function identityView(snap) { |
| identity | const | 931 | no | const identity = snap?.identity, state = identityState(identity); |
| ref | const | 933 | no | const ref = threadRef(snap.binding), lines = [identityReasonText(identity)]; |
| isRecovered | function | 939 | yes | export const isRecovered = (snap) =&gt; snap?.recovery?.pending === true \|\| snap?.diagnostic?.uncertainty === &#39;runtime-restarted&#39; |
| targetThread | function | 943 | yes | export function targetThread(t) { |
| ref | const | 944 | no | const ref = threadRef(t), state = identityState(t?.identity); |
| line | const | 946 | no | const line = state === &#39;bound&#39; ? (ref ? &#39;Chat thread &#39; + ref : &#39;Chat thread identified&#39;) |
| why | const | 948 | no | const why = identityReasonText(t.identity); |
| note | const | 949 | no | const note = state === &#39;bound&#39; ? &#39;Studio will connect only if this tab is still on this exact chat. If it has moved to another chat, nothing is connected.&#39; |
| canRead | function | 955 | yes | export function canRead(snap, { reading = false, submitting = false, working = false } = {}) { |
| count | function | 967 | no | const count = (v) =&gt; (Number.isSafeInteger(v) &amp;&amp; v &gt;= 0 ? v : null); |
| plural | function | 968 | no | const plural = (n, one, many) =&gt; n + &#39; &#39; + (n === 1 ? one : many); |
| roleLabel | function | 969 | yes | export const roleLabel = (role) =&gt; (role === &#39;user&#39; ? &#39;You&#39; : role === &#39;assistant&#39; ? &#39;Assistant&#39; : word(role) \|\| &#39;Unknown role&#39;); |
| sourceText | function | 970 | yes | export function sourceText(source) { |
| readAtText | function | 973 | yes | export function readAtText(iso, fmt = (d) =&gt; d.toISOString().slice(11, 19) + &#39; UTC&#39;) { |
| d | const | 974 | no | const d = new Date(typeof iso === &#39;string&#39; ? iso : NaN); |
| draftReadText | function | 977 | yes | export function draftReadText(draft) { |
| limitsText | function | 982 | yes | export function limitsText(l) { |
| m | const | 983 | no | const m = count(l?.maxMessages), c = count(l?.maxChars); |
| coverageLines | function | 987 | yes | export function coverageLines(cov) { |
| lines | const | 989 | no | const lines = []; |
| rendered | const | 991 | no | const rendered = count(cov.renderedMessages), returned = count(cov.returnedMessages), omitted = count(cov.omittedMessages), omittedChars = count(cov.omittedChars); |
| cut | const | 994 | no | const cut = count(cov.truncatedMessages); |
| skipped | const | 996 | no | const skipped = [[&#39;hiddenSkipped&#39;, &#39;hidden&#39;], [&#39;nestedDropped&#39;, &#39;nested duplicate&#39;], [&#39;ambiguousSkipped&#39;, &#39;of unclear author&#39;], [&#39;invalidMessages&#39;, &#39;unreadable&#39;]] |
| older | const | 999 | no | const older = cov.olderHistory, newer = cov.newerHistory; |
| readView | function | 1010 | yes | export function readView(t, snap = null) { |
| unreadable | variable | 1014 | no | let unreadable = 0; |
| rows | const | 1015 | no | const rows = []; |
| n | const | 1018 | no | const n = count(m.index); |
| messages | const | 1022 | no | const messages = rows.sort((a, b) =&gt; a.order - b.order); |
| cov | const | 1023 | no | const cov = t.coverage, rendered = count(cov?.renderedMessages); |
| headline | const | 1024 | no | const headline = !messages.length ? &#39;Studio found no messages on the page.&#39; |
| lim | const | 1026 | no | const lim = t.limits &amp;&amp; typeof t.limits === &#39;object&#39; ? t.limits : null; |
| more | const | 1027 | no | const more = (count(cov?.omittedMessages) ?? 0) &gt; 0 &amp;&amp; !!lim &amp;&amp; (lim.maxMessages &lt; READ_MAX.maxMessages \|\| lim.maxChars &lt; READ_MAX.maxChars); |
| lines | const | 1028 | no | const lines = coverageLines(cov); |
| lim2 | const | 1030 | no | const lim2 = limitsText(lim); if (lim2) lines.push(lim2); |
| readFailure | function | 1039 | yes | export function readFailure(err) { |
| code | const | 1040 | no | const code = err?.data?.code ?? (isCode(err?.message) ? err.message : null); |
| text | const | 1041 | no | const text = &#39;Couldn’t read the page: &#39; + explainError({ status: err?.status, code, message: err?.message }) + &#39; Nothing was sent, typed or changed.&#39;; |
| welcomeView | function | 1046 | yes | export function welcomeView(snapshot, connecting = false) { |
| active | const | 1047 | no | const active = Boolean(snapshot &amp;&amp; ![&#39;closed&#39;, &#39;disconnected&#39;].includes(snapshot.state)); |
| boot | function | 1058 | no | function boot() { |
| universalRender | function | 1060 | no | let universalRender = () =&gt; {}; |
| $ | function | 1063 | no | const $ = (sel) =&gt; document.querySelector(sel); |
| warnedMissing | const | 1065 | no | const warnedMissing = new Set(); |
| opt | function | 1066 | no | const opt = (sel) =&gt; { |
| n | const | 1067 | no | const n = document.querySelector(sel); |
| optText | function | 1071 | no | const optText = (sel, text) =&gt; { const n = opt(sel); if (n &amp;&amp; n.textContent !== text) n.textContent = text; }; |
| optHidden | function | 1072 | no | const optHidden = (sel, hidden) =&gt; { const n = opt(sel); if (n) n.hidden = hidden; }; |
| el | function | 1073 | no | const el = (tag, props = {}, kids = []) =&gt; { |
| node | const | 1074 | no | const node = document.createElement(tag); |
| chip | function | 1084 | no | const chip = ([label, tone]) =&gt; el(&#39;span&#39;, { class: &#39;pill &#39; + tone }, [tone === &#39;t-rec&#39; \|\| tone === &#39;t-live&#39; ? el(&#39;span&#39;, { class: &#39;dot&#39;, &#39;aria-hidden&#39;: &#39;true&#39; }) : null, label]); |
| setText | function | 1086 | no | const setText = (node, text) =&gt; { if (node.textContent !== text) node.textContent = text; }; |
| syncChips | function | 1087 | no | const syncChips = (node, list) =&gt; { |
| sig | const | 1088 | no | const sig = list.map(([l, t]) =&gt; t + &#39;:&#39; + l).join(&#39;\|&#39;); |
| syncList | function | 1092 | no | const syncList = (node, lines) =&gt; { |
| sig | const | 1093 | no | const sig = lines.join(&#39;\\n&#39;); |
| newTabLink | function | 1097 | no | const newTabLink = (href, label) =&gt; el(&#39;a&#39;, { class: &#39;hit&#39;, href, target: &#39;_blank&#39;, rel: &#39;noopener&#39; }, [label, el(&#39;span&#39;, { class: &#39;sr&#39;, text: &#39; (new tab)&#39; })]); |
| textBlocks | const | 1098 | no | const textBlocks = new Map(); // reply block key -&gt; { root, textNode } |
| store | const | 1099 | no | const store = { |
| copyText | function | 1105 | no | async function copyText(text) { |
| clip | const | 1106 | no | const clip = globalThis.navigator?.clipboard; |
| downloadText | function | 1110 | no | function downloadText(text, name) { |
| url | const | 1112 | no | const url = URL.createObjectURL(new Blob([String(text)], { type: &#39;text/plain;charset=utf-8&#39; })); |
| a | const | 1113 | no | const a = document.createElement(&#39;a&#39;); a.href = url; a.download = name; a.rel = &#39;noopener&#39;; |
| timer | const | 1115 | no | const timer = setTimeout(() =&gt; URL.revokeObjectURL(url), 4000); timer?.unref?.(); |
| rich | const | 1119 | no | const rich = createRichRenderer(document, { copy: copyText, download: downloadText, notice: (m) =&gt; { $(&#39;#announce&#39;).textContent = m; } }); |
| S | const | 1121 | no | const S = { |
| api | function | 1144 | no | async function api(path, { method = &#39;GET&#39;, body } = {}) { |
| res | variable | 1145 | no | let res; |
| e | const | 1149 | no | const e = new Error(&#39;Could not reach the Studio. Check that it is still running.&#39;); e.status = 0; throw e; |
| data | variable | 1151 | no | let data = {}, malformed = false; |
| text | const | 1152 | no | const text = await res.text(); |
| e | const | 1156 | no | const e = new Error(data?.error \|\| res.statusText \|\| &#39;Request failed&#39;); |
| setAuth | function | 1161 | no | function setAuth(on) { |
| describe | function | 1165 | no | const describe = (e) =&gt; explainError({ status: e.status, code: e.data?.code, message: e.message }); |
| setError | function | 1167 | no | function setError(sel, text, link = null) { |
| n | const | 1168 | no | const n = $(sel); n.textContent = text \|\| &#39;&#39;; |
| unreadable | function | 1171 | no | const unreadable = () =&gt; Object.assign(new Error(&#39;The Studio sent a conversation we couldn’t read.&#39;), { status: 200, malformed: true }); |
| applySnapshot | function | 1174 | no | function applySnapshot(next) { |
| prevId | const | 1175 | no | const prevId = S.snap?.id; |
| picked | const | 1176 | no | const picked = pickSnapshot(S.snap, next); |
| saved | const | 1186 | no | const saved = store.get(&#39;sessionStorage&#39;, &#39;chat.draft.&#39; + picked.id) ?? &#39;&#39;; |
| i | const | 1198 | no | const i = S.list.findIndex((c) =&gt; c.id === S.snap.id); |
| summary | const | 1200 | no | const summary = { id: S.snap.id, site: S.snap.site, state: S.snap.state, revision: S.snap.revision, binding: S.snap.binding, capture: S.snap.capture, |
| loadPending | function | 1205 | no | function loadPending(id) { |
| loadPrompts | function | 1208 | no | function loadPrompts(id) { |
| rememberPrompt | function | 1211 | no | function rememberPrompt(convId, turnId, text) { |
| savePending | function | 1216 | no | function savePending() { if (S.pending) store.set(&#39;sessionStorage&#39;, &#39;chat.pending.&#39; + S.pending.convId, JSON.stringify(S.pending)); } |
| clearPending | function | 1217 | no | function clearPending() { if (S.pending) store.del(&#39;sessionStorage&#39;, &#39;chat.pending.&#39; + S.pending.convId); S.pending = null; } |
| stillOn | function | 1220 | no | const stillOn = (id) =&gt; S.snap?.id === id; |
| refresh | function | 1221 | no | async function refresh(id = S.snap?.id) { |
| data | const | 1224 | no | const data = await api(&#39;/conversations/&#39; + encodeURIComponent(id)); |
| c | const | 1226 | no | const c = unwrapConversation(data); |
| stopPolling | function | 1243 | no | function stopPolling() { clearTimeout(S.timer); S.timer = null; } |
| schedulePoll | function | 1244 | no | function schedulePoll() { |
| delay | const | 1246 | no | const delay = pollDelay(S.snap, { hidden: document.hidden, failures: S.failures }); |
| id | const | 1248 | no | const id = S.snap.id; |
| showProblem | function | 1251 | no | function showProblem(text) { const p = $(&#39;#problem&#39;); p.textContent = text; p.hidden = !text; } |
| maybeAutoCheck | function | 1254 | no | function maybeAutoCheck(snap, active) { |
| delay | const | 1260 | no | const delay = AUTO_CHECK_DELAYS[S.autoCheck.tries]; |
| closeStream | function | 1270 | no | function closeStream() { |
| openStream | function | 1274 | no | function openStream(id) { |
| source | variable | 1277 | no | let source; |
| data | variable | 1281 | no | let data; try { data = JSON.parse(ev.data); } catch { return; } |
| merged | const | 1283 | no | const merged = mergeReplyText(S.snap.reply, data.reply); |
| loadTargets | function | 1300 | no | async function loadTargets() { |
| data | const | 1303 | no | const data = await api(&#39;/conversation-targets&#39;); |
| t | const | 1309 | no | const t = selectedTarget(); |
| loadList | function | 1316 | no | async function loadList() { |
| data | const | 1319 | no | const data = await api(&#39;/conversations&#39;); |
| openConversation | function | 1325 | no | async function openConversation(id) { |
| requestSeq | const | 1326 | no | const requestSeq = ++S.openSeq; |
| c | const | 1328 | no | const c = unwrapConversation(await api(&#39;/conversations/&#39; + encodeURIComponent(id))); |
| selectedTarget | function | 1347 | no | const selectedTarget = () =&gt; S.targets.targets.find((t) =&gt; t.id === S.targetId) ?? null; |
| targetUsable | function | 1348 | no | const targetUsable = (t) =&gt; !!t?.site &amp;&amp; !t.recorderOwner; |
| connectReady | function | 1349 | no | function connectReady() { |
| t | const | 1354 | no | const t = selectedTarget(); |
| connect | function | 1359 | no | async function connect() { |
| ready | const | 1360 | no | const ready = connectReady(); if (!ready.ok) { renderConnect(); return; } |
| body | const | 1362 | no | const body = S.mode === &#39;new&#39; ? { site: S.site, freshTab: true } |
| known | const | 1364 | no | const known = new Set(S.list.map((c) =&gt; c.id)); |
| c | const | 1367 | no | const c = unwrapConversation(await api(&#39;/conversations&#39;, { method: &#39;POST&#39;, body })); |
| msg | variable | 1372 | no | let msg = (isAmbiguous(e) ? &#39;We couldn’t confirm the connection: &#39; : &#39;Couldn’t connect: &#39;) + describe(e) + &#39; Studio does not retry by itself.&#39;; |
| code | const | 1375 | no | const code = e.data?.code ?? (isCode(e.message) ? e.message : null); |
| created | const | 1382 | no | const created = S.list.filter((c) =&gt; !known.has(c.id) &amp;&amp; c.state !== &#39;closed&#39;); |
| sendMessage | function | 1392 | no | async function sendMessage() { |
| snap | const | 1393 | no | const snap = S.snap; if (!snap \|\| S.submitting \|\| S.pending) return; |
| check | const | 1394 | no | const check = canSend(snap, { prompt: $(&#39;#prompt&#39;).value, busy: false }); |
| prompt | const | 1396 | no | const prompt = $(&#39;#prompt&#39;).value.replace(/\\s+$/, &#39;&#39;); |
| attempt | const | 1398 | no | const attempt = S.pending; |
| body | const | 1400 | no | const body = { key: attempt.key, prompt, confirm: true, expectedRevision: attempt.expectedRevision }; |
| c | const | 1405 | no | const c = unwrapConversation(await api(&#39;/conversations/&#39; + encodeURIComponent(snap.id) + &#39;/turns&#39;, { method: &#39;POST&#39;, body })); |
| r | const | 1421 | no | const r = sendRejection(e); setError(&#39;#sendError&#39;, r.text, r.link); |
| sendAgain | function | 1428 | no | function sendAgain() { |
| text | const | 1430 | no | const text = S.pending.prompt; |
| box | const | 1432 | no | const box = $(&#39;#prompt&#39;); box.readOnly = false; box.value = text; |
| copyMine | function | 1435 | no | async function copyMine() { |
| text | const | 1436 | no | const text = S.pending?.prompt \|\| S.sentPrompt \|\| &#39;&#39;; if (!text) return; |
| clip | const | 1437 | no | const clip = globalThis.navigator?.clipboard; |
| reconcile | function | 1445 | no | async function reconcile(errorSel = &#39;#reconcileError&#39;) { |
| id | const | 1447 | no | const id = S.snap.id; |
| released | variable | 1449 | no | let released = false; |
| c | const | 1451 | no | const c = unwrapConversation(await api(&#39;/conversations/&#39; + encodeURIComponent(id) + &#39;/reconcile&#39;, { method: &#39;POST&#39;, body: { expectedRevision: Number(S.snap.revision) } })); |
| finish | function | 1468 | no | async function finish() { |
| id | const | 1470 | no | const id = S.snap.id; |
| closeTab | const | 1471 | no | const closeTab = !$(&#39;#closeTabField&#39;).hidden &amp;&amp; $(&#39;#closeTab&#39;).checked &amp;&amp; canCloseTab(S.snap); |
| c | const | 1474 | no | const c = unwrapConversation(await api(&#39;/conversations/&#39; + encodeURIComponent(id) + &#39;/finish&#39;, { method: &#39;POST&#39;, body: { closeTab } })); |
| newConversation | function | 1485 | no | function newConversation() { |
| renderConnect | function | 1495 | no | function renderConnect() { |
| sel | const | 1496 | no | const sel = $(&#39;#site&#39;); |
| site | const | 1499 | no | const site = S.targets.sites.find((s) =&gt; s.id === S.site); |
| list | const | 1502 | no | const list = $(&#39;#targetList&#39;); |
| usable | const | 1510 | no | const usable = targetUsable(t), id = &#39;tg-&#39; + i, hint = targetHint(t); |
| input | const | 1511 | no | const input = el(&#39;input&#39;, { type: &#39;radio&#39;, name: &#39;target&#39;, id, value: t.id, checked: t.id === S.targetId, disabled: !usable, onchange: () =&gt; { S.targetId = t.id; S.pickRef = threadRef(t); S.pickNote … |
| th | const | 1512 | no | const th = targetThread(t); |
| chosen | const | 1522 | no | const chosen = S.mode === &#39;existing&#39; ? selectedTarget() : null; |
| ready | const | 1524 | no | const ready = connectReady(); |
| renderChrome | function | 1530 | no | function renderChrome() { |
| snap | const | 1531 | no | const snap = S.snap, box = $(&#39;#connectBox&#39;); |
| renderStage | function | 1538 | no | function renderStage(snap) { |
| renderChips | function | 1541 | no | function renderChips(snap) { |
| out | const | 1543 | no | const out = [conversationChip(snap.state)]; |
| ready | const | 1544 | no | const ready = readinessChip(snap); |
| setNodeText | function | 1558 | no | function setNodeText(textNode, next) { |
| prev | const | 1559 | no | const prev = textNode.data; |
| makeBlock | function | 1563 | no | function makeBlock(b, formatted = false) { |
| textNode | const | 1565 | no | const textNode = document.createTextNode(&#39;&#39;); |
| body | const | 1566 | no | const body = el(&#39;p&#39;, { class: &#39;body&#39; }, [textNode]); |
| d | const | 1568 | no | const d = el(&#39;details&#39;, { class: &#39;blk&#39; }, [el(&#39;summary&#39;, { text: b.label }), body]); |
| syncReplyBlocks | function | 1573 | no | function syncReplyBlocks(blocks, reply) { |
| holder | const | 1574 | no | const holder = $(&#39;#replyBlocks&#39;), want = []; |
| ph | variable | 1576 | no | let ph = textBlocks.get(&#39;placeholder&#39;); |
| parsed | const | 1583 | no | const parsed = new Map(blocks.filter((b) =&gt; b.kind === &#39;answer&#39; &amp;&amp; typeof b.text === &#39;string&#39;).map((b) =&gt; [b.key, parseRich(b.text).blocks])); |
| formatted | const | 1584 | no | const formatted = S.rawView ? new Map() : parsed; // sources are listed in both views |
| sources | const | 1585 | no | const sources = replySources(reply, [...parsed.values()].flat()), live = [&#39;waiting&#39;, &#39;streaming&#39;].includes(reply.state); |
| keep | const | 1586 | no | const keep = new Set(); |
| isRich | const | 1588 | no | const isRich = formatted.has(b.key), rk = b.key + (isRich ? &#39;~formatted&#39; : &#39;&#39;); |
| rec | variable | 1589 | no | let rec = textBlocks.get(rk); |
| have | const | 1596 | no | const have = Array.from(holder.children); |
| answerText | const | 1599 | no | const answerText = blocks.filter((b) =&gt; b.kind === &#39;answer&#39; &amp;&amp; typeof b.text === &#39;string&#39;).map((b) =&gt; b.text).join(&#39;\\n\\n&#39;); |
| renderSources | function | 1604 | no | function renderSources(sources, artifacts) { |
| box | const | 1605 | no | const box = $(&#39;#replySources&#39;), sig = sourcesSig(sources); |
| list | const | 1608 | no | const list = $(&#39;#sourcesList&#39;); |
| abox | const | 1610 | no | const abox = $(&#39;#replyArtifacts&#39;), asig = artifacts.map((a) =&gt; a.n + &#39;:&#39; + a.title + &#39;:&#39; + (a.text?.length ?? a.href)).join(&#39;\|&#39;); |
| copyReply | function | 1614 | no | async function copyReply() { |
| reply | const | 1615 | no | const reply = S.snap?.reply, text = replyBlocks(reply).filter((b) =&gt; b.kind === &#39;answer&#39; &amp;&amp; typeof b.text === &#39;string&#39;).map((b) =&gt; b.text).join(&#39;\\n\\n&#39;); |
| ok | const | 1617 | no | const ok = await copyText(text); |
| timer | const | 1620 | no | const timer = setTimeout(() =&gt; setText($(&#39;#btnCopyReply&#39;), &#39;Copy reply&#39;), 1800); timer?.unref?.(); |
| toggleRaw | function | 1622 | no | function toggleRaw() { |
| renderTurns | function | 1629 | no | function renderTurns(snap) { |
| list | const | 1630 | no | const list = $(&#39;#turnList&#39;), rows = snap ? turnRows(snap, S.prompts) : []; |
| sig | const | 1632 | no | const sig = JSON.stringify([S.rawView, rows.map((r) =&gt; [r.n, r.id, r.current, r.blocked, r.chips, r.reason, r.sessionId, r.prompt, r.current ? &#39;&#39; : r.reply])]); |
| earlierReply | function | 1636 | no | const earlierReply = (text) =&gt; { |
| holder | const | 1638 | no | const holder = el(&#39;div&#39;, { class: &#39;rich&#39; }); |
| renderTranscript | function | 1649 | no | function renderTranscript(snap) { |
| started | const | 1650 | no | const started = messageStarted(snap), preparing = isPreparing(snap); |
| empty | const | 1652 | no | const empty = $(&#39;#emptyState&#39;); |
| n | const | 1658 | no | const n = turnCount(snap), own = S.prompts[snap.turn.id]; |
| fallback | const | 1659 | no | const fallback = preparing &amp;&amp; !started ? (S.pending?.prompt \|\| $(&#39;#prompt&#39;).value) : n &lt;= 1 ? (S.sentPrompt \|\| $(&#39;#prompt&#39;).value) : S.sentPrompt; |
| copy | const | 1664 | no | const copy = $(&#39;#btnCopy&#39;); |
| reply | const | 1669 | no | const reply = snap.reply; if (!reply) return; |
| blocks | const | 1671 | no | const blocks = replyBlocks(reply); |
| total | const | 1674 | no | const total = Number(reply.chars), shown = shownChars(blocks), chars = Number.isFinite(total) ? total : shown; |
| now | const | 1675 | no | const now = Date.now(), live = [&#39;waiting&#39;, &#39;streaming&#39;].includes(reply.state); |
| partial | const | 1679 | no | const partial = replyMayBePartial(reply); |
| rs | const | 1683 | no | const rs = replyStateView(snap); |
| rn | const | 1684 | no | const rn = $(&#39;#replyStream&#39;); |
| renderBanners | function | 1690 | no | function renderBanners(snap) { |
| pend | const | 1692 | no | const pend = pendingUnknown(S.pending, snap, S.submitting), server = !!snap &amp;&amp; isUncertain(snap); |
| unc | const | 1693 | no | const unc = !!snap &amp;&amp; (server \|\| pend); |
| banner | const | 1694 | no | const banner = $(&#39;#uncertain&#39;); |
| sendUnsure | const | 1697 | no | const sendUnsure = pend \|\| snap.turn?.send?.state === &#39;uncertain&#39; \|\| snap.diagnostic?.uncertainty === &#39;send-acknowledgement-lost&#39;; |
| v | const | 1698 | no | const v = uncertainView(snap, { pending: pend &amp;&amp; !server, detail: S.unknownDetail, checks: S.autoCheck.tries, maxChecks: AUTO_CHECK_DELAYS.length }); |
| href | const | 1704 | no | const href = tabHref(snap), link = $(&#39;#openChatTab&#39;); |
| bv | const | 1714 | no | const bv = sendStateView(snap); |
| focusKey | const | 1718 | no | const focusKey = unc ? snap.id + &#39;:&#39; + (pend ? &#39;pending:&#39; + S.pending.key : snap.turn?.id ?? &#39;&#39;) : &#39;&#39;; |
| rp | const | 1723 | no | const rp = readinessPanel(snap); |
| renderComposer | function | 1734 | no | function renderComposer() { |
| snap | const | 1735 | no | const snap = S.snap, prompt = $(&#39;#prompt&#39;); |
| locked | const | 1736 | no | const locked = !!S.pending &amp;&amp; !!snap &amp;&amp; S.pending.convId === snap.id &amp;&amp; !pendingRegistered(S.pending, snap); |
| check | const | 1745 | no | const check = canSend(snap, { prompt: prompt.value, busy: S.submitting \|\| locked }); |
| renderFinish | function | 1751 | no | function renderFinish(snap) { |
| bar | const | 1752 | no | const bar = $(&#39;#finishBar&#39;); |
| closed | const | 1755 | no | const closed = snap.state === &#39;closed&#39;; |
| ctl | const | 1756 | no | const ctl = finishControl(snap, { working: S.working }), out = finishOutcome(snap); |
| bits | const | 1757 | no | const bits = []; |
| fe | const | 1766 | no | const fe = finishErrorText(snap.diagnostic?.finishError); |
| showClose | const | 1768 | no | const showClose = !closed &amp;&amp; canCloseTab(snap); |
| sid | const | 1778 | no | const sid = snap.sessionId, links = $(&#39;#finishLinks&#39;), linkSig = out &amp;&amp; sid ? sid : &#39;&#39;; |
| renderDetails | function | 1786 | no | function renderDetails(snap) { |
| kv | const | 1787 | no | const kv = $(&#39;#detailsKv&#39;); |
| rows | const | 1790 | no | const rows = [ |
| idv | const | 1798 | no | const idv = identityView(snap); |
| ev | const | 1806 | no | const ev = snap?.evidence ?? snap?.turn?.evidence ?? snap?.capture?.evidence ?? null; |
| gates | const | 1807 | no | const gates = Array.isArray(ev?.gates) ? ev.gates : []; |
| unknowns | const | 1812 | no | const unknowns = Array.isArray(ev?.unknowns) ? ev.unknowns : []; |
| lim | const | 1814 | no | const lim = limitStatus(snap?.capture); |
| lims | const | 1816 | no | const lims = Array.isArray(snap?.limitations) ? snap.limitations : []; |
| sid | const | 1818 | no | const sid = snap?.sessionId; |
| renderList | function | 1825 | no | function renderList() { |
| ul | const | 1826 | no | const ul = $(&#39;#convList&#39;), state = $(&#39;#listState&#39;); |
| shown | const | 1829 | no | const shown = historyShown(S.list, S.listAll), hidden = S.list.length - shown.length; |
| row | const | 1834 | no | const row = historyRow(c), [label, tone] = row.chip; |
| b | const | 1835 | no | const b = el(&#39;button&#39;, { type: &#39;button&#39;, onclick: () =&gt; openConversation(c.id) }, [ el(&#39;span&#39;, { class: &#39;conv-title&#39;, text: row.title }), el(&#39;span&#39;, { class: &#39;pill &#39; + (row.attention ? &#39;t-warn&#39; : ton… |
| announce | function | 1842 | no | function announce(snap) { |
| unsure | const | 1844 | no | const unsure = pendingUnknown(S.pending, snap, S.submitting); |
| ready | const | 1845 | no | const ready = replyReadyText(snap); |
| key | const | 1846 | no | const key = snap ? [snap.state, snap.turn?.phase, snap.turn?.send?.state, snap.reply?.state, snap.capture?.state, snap.readiness?.ready, unsure, ready, turnCount(snap), composerOpen(snap)].join(&#39;\|&#39;) … |
| parts | const | 1850 | no | const parts = [conversationChip(snap.state)[0]]; |
| rc | const | 1851 | no | const rc = readinessChip(snap); if (rc) parts.push(rc[0]); |
| renderThread | function | 1859 | no | function renderThread(snap) { |
| v | const | 1860 | no | const v = identityView(snap), strip = $(&#39;#threadStrip&#39;); |
| renderRead | function | 1869 | no | function renderRead() { |
| snap | const | 1870 | no | const snap = S.snap, box = $(&#39;#readBox&#39;); |
| chk | const | 1873 | no | const chk = canRead(snap, { reading: S.reading, submitting: S.submitting, working: S.working }); |
| t | const | 1877 | no | const t = S.transcript &amp;&amp; S.transcript.convId === snap.id ? S.transcript : null, v = t?.view ?? null; |
| readPage | function | 1894 | no | async function readPage(limits = null) { |
| snap | const | 1895 | no | const snap = S.snap; if (!snap) return; |
| chk | const | 1896 | no | const chk = canRead(snap, { reading: S.reading, submitting: S.submitting, working: S.working }); |
| id | const | 1898 | no | const id = snap.id, seq = ++S.readSeq; |
| data | const | 1901 | no | const data = await api(&#39;/conversations/&#39; + encodeURIComponent(id) + &#39;/read&#39;, { method: &#39;POST&#39;, body: limits ?? {} }); |
| view | const | 1903 | no | const view = readView(data?.transcript, S.snap); |
| r | const | 1909 | no | const r = readFailure(e); setError(&#39;#readError&#39;, r.text, r.link); |
| renderWelcome | function | 1913 | no | function renderWelcome(snap) { |
| view | const | 1914 | no | const view = welcomeView(snap, S.connecting); |
| panel | const | 1915 | no | const panel = $(&#39;#vivimWelcome&#39;); |
| choices | const | 1920 | no | const choices = $(&#39;#vivimProviders&#39;); |
| sites | const | 1921 | no | const sites = Array.isArray(S.targets?.sites) ? S.targets.sites.filter((site) =&gt; typeof site?.id === &#39;string&#39; &amp;&amp; /^[a-z0-9-]{1,60}$/.test(site.id)) : []; |
| signature | const | 1923 | no | const signature = sites.map((site) =&gt; site.id).join(&#39;\|&#39;) + (!sites.length ? &#39;:&#39; + S.targetsState : &#39;&#39;); |
| providerButtons | const | 1944 | no | const providerButtons = typeof choices.querySelectorAll === &#39;function&#39; |
| provider | const | 1948 | no | const provider = button.getAttribute?.(&#39;data-provider&#39;) ?? button.dataset?.provider ?? button.attrs?.[&#39;data-provider&#39;]; |
| strip | const | 1952 | no | const strip = $(&#39;#vivimChatProviders&#39;); |
| stripButtons | const | 1968 | no | const stripButtons = typeof strip.querySelectorAll === &#39;function&#39; |
| active | const | 1971 | no | const active = !!snap &amp;&amp; snap.state !== &#39;closed&#39;; |
| provider | const | 1973 | no | const provider = button.getAttribute?.(&#39;data-provider&#39;) ?? button.dataset?.provider ?? button.attrs?.[&#39;data-provider&#39;]; |
| render | function | 1978 | no | function render() { |
| snap | const | 1979 | no | const snap = S.snap; |
| view | const | 1996 | no | const view = $(&#39;#viewConversations&#39;); |
| wide | const | 2027 | no | const wide = window.matchMedia?.(&#39;(min-width: 1100px)&#39;); |
| syncDetails | function | 2028 | no | const syncDetails = () =&gt; { if (wide?.matches) $(&#39;#detailsBox&#39;).open = true; }; |
| renderUniversal | function | 2036 | no | const renderUniversal = (snap) =&gt; { |
| universal | variable | 2040 | no | let universal = null; |
| inBrowser | const | 2045 | no | const inBrowser = typeof location !== &#39;undefined&#39; &amp;&amp; /^https?:$/.test(location?.protocol ?? &#39;&#39;); |
| u1root | const | 2048 | no | const u1root = document.createElement(&#39;div&#39;); |
| comparePanel | const | 2062 | no | const comparePanel = document.getElementById(&#39;comparePanel&#39;); |
| el | function | 2064 | no | const el = id =&gt; document.getElementById(id); |
| SITES | const | 2066 | no | const SITES = [[&#39;chatgpt&#39;, &#39;ChatGPT&#39;], [&#39;claude&#39;, &#39;Claude&#39;], [&#39;zai&#39;, &#39;Z.ai&#39;], [&#39;qwen&#39;, &#39;Qwen&#39;], [&#39;deepseek&#39;, &#39;DeepSeek&#39;], [&#39;gemini&#39;, &#39;Gemini&#39;]]; |
| SITE_LABELS | const | 2067 | no | const SITE_LABELS = Object.fromEntries(SITES); |
| SITES_KEY | const | 2068 | no | const SITES_KEY = &#39;vivim.compare.sites&#39;; |
| grid | const | 2069 | no | const grid = el(&#39;compareGrid&#39;); |
| compareCards | const | 2070 | no | const compareCards = new Map(); // site -&gt; { root, state, body }, kept and updated in place across polls |
| make | function | 2071 | no | const make = (tag, props = {}) =&gt; { |
| node | const | 2072 | no | const node = document.createElement(tag); |
| loadSavedSites | function | 2077 | no | function loadSavedSites() { |
| saved | const | 2079 | no | const saved = JSON.parse(localStorage.getItem(SITES_KEY) \|\| &#39;null&#39;); |
| applySavedSites | function | 2084 | no | function applySavedSites() { |
| saved | const | 2085 | no | const saved = loadSavedSites(); if (!saved) return; |
| wanted | const | 2086 | no | const wanted = new Set(saved); |
| saveSites | function | 2089 | no | function saveSites() { |
| sites | const | 2090 | no | const sites = [...document.querySelectorAll(&#39;input[name=&quot;compareSite&quot;]:checked&#39;)].map(i =&gt; i.value); |
| compareJob | variable | 2095 | no | let compareJob = null, compareTimer = null, posting = false, compareVersion = 0, fastestVersion = 0, fastestDoneFor = null; |
| liveCompare | function | 2096 | no | const liveCompare = job =&gt; [&#39;queued&#39;, &#39;running&#39;].includes(job?.state); |
| compareRequest | function | 2097 | no | const compareRequest = async (url, body) =&gt; { |
| controller | const | 2098 | no | const controller = new AbortController(), timeout = setTimeout(() =&gt; controller.abort(), 15000); |
| response | const | 2100 | no | const response = await fetch(API + url, { method: body === undefined ? &#39;GET&#39; : &#39;POST&#39;, credentials: &#39;same-origin&#39;, ...(body === undefined ? {} : { headers: { &#39;content-type&#39;: &#39;application/json&#39; }, bod… |
| detail | const | 2103 | no | const detail = await response.json().catch(() =&gt; null); |
| missingCompare | function | 2109 | no | const missingCompare = error =&gt; error?.status === 404 &amp;&amp; error?.code === &#39;COMPARE_NOT_FOUND&#39;; |
| refreshFastest | function | 2112 | no | async function refreshFastest() { |
| version | const | 2113 | no | const version = ++fastestVersion; |
| data | variable | 2114 | no | let data; |
| fastest | const | 2117 | no | const fastest = (Array.isArray(data?.providers) ? data.providers : []) |
| maybeRefreshFastest | function | 2124 | no | function maybeRefreshFastest(job) { |
| compareCard | function | 2128 | no | function compareCard(site) { |
| card | variable | 2129 | no | let card = compareCards.get(site); |
| root | const | 2131 | no | const root = make(&#39;div&#39;, { class: &#39;compare-card&#39;, role: &#39;listitem&#39; }); |
| heading | const | 2132 | no | const heading = make(&#39;h3&#39;, { text: SITE_LABELS[site] ?? site }); |
| state | const | 2133 | no | const state = make(&#39;p&#39;, { class: &#39;state&#39; }); |
| body | const | 2134 | no | const body = make(&#39;div&#39;, { class: &#39;body&#39; }); |
| compareStatusWords | function | 2141 | no | function compareStatusWords(result) { |
| label | const | 2142 | no | const label = SITE_LABELS[result.site] ?? result.site; |
| ms | const | 2144 | no | const ms = Date.parse(result.answeredAt ?? &#39;&#39;) - Date.parse(result.startedAt ?? &#39;&#39;); |
| renderCompareGrid | function | 2149 | no | function renderCompareGrid(job) { |
| nodes | const | 2150 | no | const nodes = (Array.isArray(job?.results) ? job.results : []).map(result =&gt; { const card = compareCard(result.site); setText(card.state, compareStatusWords(result)); setText(card.body, result.answer… |
| card | const | 2151 | no | const card = compareCard(result.site); |
| have | const | 2156 | no | const have = Array.from(grid.children); |
| forgetCompare | function | 2159 | no | const forgetCompare = () =&gt; { |
| renderCompare | function | 2171 | no | const renderCompare = job =&gt; { |
| pollCompare | function | 2180 | no | const pollCompare = async () =&gt; { |
| id | const | 2184 | no | const id = compareJob.id, version = ++compareVersion; |
| data | const | 2187 | no | const data = await compareRequest(&#39;/compare/&#39; + encodeURIComponent(id)); |
| sites | const | 2216 | no | const sites = [...document.querySelectorAll(&#39;input[name=&quot;compareSite&quot;]:checked&#39;)].map(input =&gt; input.value); |
| data | const | 2222 | no | const data = await compareRequest(&#39;/compare&#39;, { question: el(&#39;compareQuestion&#39;).value, sites }); |
| id | const | 2234 | no | const id = compareJob.id, version = ++compareVersion; |
| data | const | 2238 | no | const data = await compareRequest(&#39;/compare/&#39; + encodeURIComponent(id) + &#39;/cancel&#39;, {}); |
| id | const | 2251 | no | const id = localStorage.getItem(&#39;vivim.compare.job&#39;); |
| myAisPanel | const | 2266 | no | const myAisPanel = document.getElementById(&#39;myAisPanel&#39;); |
| el | function | 2268 | no | const el = id =&gt; document.getElementById(id); |
| MYAIS_SITES | const | 2269 | no | const MYAIS_SITES = [[&#39;chatgpt&#39;, &#39;ChatGPT&#39;], [&#39;claude&#39;, &#39;Claude&#39;], [&#39;zai&#39;, &#39;Z.ai&#39;], [&#39;qwen&#39;, &#39;Qwen&#39;], [&#39;deepseek&#39;, &#39;DeepSeek&#39;], [&#39;gemini&#39;, &#39;Gemini&#39;]]; |
| myAisGrid | const | 2270 | no | const myAisGrid = el(&#39;myAisGrid&#39;); |
| myAisCards | const | 2271 | no | const myAisCards = new Map(); // site -&gt; dom refs, kept and updated in place across refreshes |
| make | function | 2272 | no | const make = (tag, props = {}) =&gt; { |
| node | const | 2273 | no | const node = document.createElement(tag); |
| myAisTimer | variable | 2277 | no | let myAisTimer = null, myAisVisible = false, myAisLast = null, myAisSeq = 0; // last good data is kept on a failed refresh |
| myAisTrackText | function | 2279 | no | function myAisTrackText(p) { |
| answered | const | 2281 | no | const answered = Number.isFinite(p.completed) ? p.completed : 0; |
| bits | const | 2282 | no | const bits = [&#39;Answered &#39; + answered + &#39; of &#39; + p.jobs]; |
| myAisProblemText | function | 2289 | no | function myAisProblemText(p) { |
| e | const | 2290 | no | const e = p?.lastError; if (!e) return &#39;&#39;; |
| text | const | 2291 | no | const text = e.message \|\| (e.code ? &#39;Studio reported: &#39; + word(e.code).toLowerCase() + &#39;.&#39; : &#39;&#39;); |
| myAisCard | function | 2294 | no | function myAisCard(site, label) { |
| card | variable | 2295 | no | let card = myAisCards.get(site); |
| root | const | 2297 | no | const root = make(&#39;div&#39;, { class: &#39;myais-card&#39;, role: &#39;listitem&#39; }); |
| heading | const | 2298 | no | const heading = make(&#39;h3&#39;, { text: label }); |
| openLine | const | 2299 | no | const openLine = make(&#39;p&#39;, { class: &#39;note&#39; }); |
| trackLine | const | 2300 | no | const trackLine = make(&#39;p&#39;, { class: &#39;note&#39; }); |
| problemLine | const | 2301 | no | const problemLine = make(&#39;p&#39;, { class: &#39;note&#39; }); |
| ask | const | 2302 | no | const ask = make(&#39;button&#39;, { type: &#39;button&#39;, class: &#39;mini&#39; }); |
| renderMyAis | function | 2317 | no | function renderMyAis(targets, perf, failed) { |
| bySite | const | 2318 | no | const bySite = new Map((Array.isArray(perf?.providers) ? perf.providers : []).map(p =&gt; [p.site, p])); |
| nodes | const | 2319 | no | const nodes = MYAIS_SITES.map(([site, label]) =&gt; { const card = myAisCard(site, label); const open = Array.isArray(targets) &amp;&amp; targets.some(t =&gt; t?.site === site); setText(card.openLine, open ? label… |
| card | const | 2320 | no | const card = myAisCard(site, label); |
| open | const | 2321 | no | const open = Array.isArray(targets) &amp;&amp; targets.some(t =&gt; t?.site === site); |
| have | const | 2327 | no | const have = Array.from(myAisGrid.children); |
| refreshMyAis | function | 2331 | no | async function refreshMyAis() { |
| seq | const | 2332 | no | const seq = ++myAisSeq; |
| stopMyAisPolling | function | 2344 | no | function stopMyAisPolling() { clearTimeout(myAisTimer); myAisTimer = null; } |
| startMyAisPolling | function | 2345 | no | function startMyAisPolling() { |
| worldRoot | const | 2371 | no | const worldRoot = document.getElementById(&#39;worldShell&#39;); |
| worldModes | const | 2372 | no | const worldModes = document.getElementById(&#39;shellModes&#39;); |
| worldChat | const | 2373 | no | const worldChat = document.getElementById(&#39;chatApp&#39;); |
| world | const | 2375 | no | const world = mod.mountWorldView({ document, root: worldRoot, modes: worldModes, chat: worldChat, rich, announce: (m) =&gt; { const n = document.getElementById(&#39;announce&#39;); if (n) n.textContent = m; }, … |
| saved | const | 2387 | no | const saved = store.get(&#39;localStorage&#39;, SELECTED_KEY); |
| open | const | 2388 | no | const open = S.list.find((c) =&gt; c.id === saved) |
| id | const | 2390 | no | const id = open?.id ?? (S.listState !== &#39;ok&#39; ? saved : null); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./universal-chat.mjs | dynamic | 2047 | [studio/src/studio/ui/universal-chat.mjs](./universal-chat.mjs.md) |
| ./world-view.mjs | dynamic | 2370 | [studio/src/studio/ui/world-view.mjs](./world-view.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Chat workspace. Same-origin fetches only; the studio cookie authenticates every request.
// Everything that comes from a site or the service (titles, replies, reasons) is rendered with
// textContent and DOM nodes, never as HTML. The pure helpers below are exported for offline tests.

const API = '/api/v1';
const SELECTED_KEY = 'capture-studio.chat.selected';
const RAW_KEY = 'capture-studio.chat.plain-reply';


/* ---------------- pure helpers (no DOM, no network) ---------------- */
const CONVERSATION_STATES = {
  disconnected: ['Disconnected', 't-mute'], attaching: ['Connecting…', 't-live'], ready: ['Ready', 't-info'],
  busy: ['Busy', 't-live'], blocked: ['Not sent', 't-warn'], 'needs-reconciliation': ['Checking', 't-warn'],
  finalizing: ['Finishing…', 't-warn'], closed: ['Closed', 't-mute'],
};
const SEND_STATES = {
  'not-attempted': ['Not sent yet', 't-mute'], submitting: ['Submitting', 't-live'],
  observed: ['Send observed', 't-info'], uncertain: ['Send not confirmed', 't-warn'],
};
const REPLY_STATES = {
  waiting: ['Waiting for the answer', 't-mute'], streaming: ['Answering…', 't-live'], ready: ['Answer ready', 't-info'],
  interrupted: ['Answer stopped early', 't-warn'], unknown: ['Answer not confirmed', 't-warn'],
};
const CAPTURE_STATES = {
  recording: ['Recording', 't-rec'], idle: ['Not recording', 't-mute'], finalizing: ['Finishing capture…', 't-warn'], accepted: ['Capture accepted', 't-ok'],
  rejected: ['Capture rejected', 't-bad'], incomplete: ['Capture incomplete', 't-warn'],
};
const SOURCE_LABELS = {
  network: 'Source: network stream',
  page: 'Source: page text (network stream not matched)',
  differ: 'Source: network stream and page text differ',
  candidate: 'Source: unverified candidate',
};
const BLOCK_LABELS = {
  answer: 'Answer', reasoning: 'Reasoning shown by the site', tool: 'Tool activity', 'tool-activity': 'Tool activity',
  tool_activity: 'Tool activity', citations: 'Citations', citation: 'Citations',
};
const GATE_LABELS = {
  G1: 'New message observed (page, network or both)', G2: 'A new reply appeared', G3: 'Reply finished',
  G4: 'Recording stopped cleanly', G5: 'Recording integrity check', G6: 'Data extracted', G7: 'Page text and network data agree',
};
const GATE_VALUES = { passed: ['Passed', 't-ok'], failed: ['Failed', 't-bad'], 'not-checked': ['Not checked', 't-mute'], unknown: ['Unknown', 't-warn'] };

// Service reason codes -> plain sentences. Unknown codes are shown as words, never hidden.
const REASONS = {
  DRAFT_PRESENT: 'There’s text in the chat box.',
  DRAFT_OR_BINDING_NOT_READY: 'Studio couldn’t confirm that the chat box is empty and that this is still the tab you connected.',
  BINDING_CHANGED: 'This is no longer the tab you connected (different tab or site).',
  PREFLIGHT_FAILED: 'Studio couldn’t inspect the chat box.',
  NOT_CHECKED: 'Studio hasn’t checked the chat box yet.',
  SUBMISSION_STOPPED: 'Sending was stopped before it finished.',
  THREAD_IDENTITY_UNVERIFIED: 'Studio can’t tell which chat this tab is showing, so it won’t send.',
};
const UNCERTAINTY = {
  'runtime-restarted': 'Studio restarted. It never replays an earlier action.',
  'partial-draft-possible': 'Typing may have been interrupted, so partial text could be in the chat box. Nothing is known to have been sent.',
  'send-acknowledgement-lost': 'Studio lost the confirmation for the send.',
  'attachment-interrupted': 'Connecting to the tab didn’t finish cleanly.',
  'attachment-failed': 'Connecting to the tab didn’t finish cleanly.',
  'attachment-binding-mismatch': 'Connecting to the tab didn’t finish cleanly.',
};
const FINISH_ERRORS = {
  CAPTURE_STOP_FAILED: 'Studio couldn’t confirm that recording stopped.',
  TAB_CLOSE_UNCONFIRMED: 'Studio couldn’t confirm that the tab was closed.',
};
const ERROR_TEXT = {
  STALE_REVISION: 'This conversation changed since you last saw it, so nothing was sent. It has been refreshed.',
  ONE_TURN_LIMIT: 'This release sends one message per conversation.',
  THREAD_FENCED: 'The previous turn in this chat isn’t complete or confirmed yet, so Studio won’t send another. Nothing was sent.',
  PRIOR_TURN_CAPTURE_NOT_FINALIZED: 'The previous turn’s recording isn’t finished, so Studio won’t start the next turn. Nothing was sent.',
  PRIOR_REPLY_OBSERVER_PENDING: 'Still finishing the last answer — try again in a moment.',
  THREAD_CHANGED_BETWEEN_TURNS: 'This chat changed since the last turn (an earlier message was edited, removed or regenerated). Nothing was sent.',
  NOT_READY: 'Studio isn’t ready to send. Use Check again (read-only) first.',
  CONFIRM_REQUIRED: 'Sending needs your explicit confirmation.',
  INVALID_SUBMISSION: 'The message is empty or longer than 250000 characters.',
  IDEMPOTENCY_CONFLICT: 'That request ID was already used for a different message.',
  CONVERSATION_FINISHED: 'This conversation has been finished.',
  CONVERSATION_NOT_WRITABLE: 'This conversation can’t send: it was recovered after a restart, or another Studio process owns it.',
  CONVERSATION_OWNED_BY_ANOTHER_RUNTIME: 'Another Studio process owns this conversation.',
  CONVERSATION_NOT_FOUND: 'That conversation no longer exists.',
```

_First 80 of 2397 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

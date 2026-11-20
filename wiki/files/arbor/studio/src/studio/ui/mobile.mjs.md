# File: studio/src/studio/ui/mobile.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/ui/mobile.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 85856 B |
| Lines | 1536 |
| Hash | cc8c0345ec1d |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MOBILE_API | const | 8 | yes | export const MOBILE_API = &#39;/api/v1/personal-apps&#39;; |
| APP_ID | const | 9 | no | const APP_ID = /^app-[a-f0-9]{32}$/; |
| ITEM_ID | const | 10 | no | const ITEM_ID = /^item-[a-f0-9]{32}$/; |
| SCREENS | const | 11 | no | const SCREENS = new Set([&#39;home&#39;, &#39;agent&#39;, &#39;builder&#39;, &#39;notes&#39;, &#39;tasks&#39;, &#39;dashboard&#39;, &#39;blank&#39;]); |
| CONVERSATIONS_API | const | 14 | no | const CONVERSATIONS_API = &#39;/api/v1/conversations&#39;; |
| ASK_STORE | const | 15 | no | const ASK_STORE = &#39;vivim.mobile.ask.v1&#39;; |
| ASK_POLL_MS | const | 16 | no | const ASK_POLL_MS = 2500; |
| ASK_SITES | const | 19 | no | const ASK_SITES = { chatgpt: &#39;ChatGPT&#39;, claude: &#39;Claude&#39;, zai: &#39;Z.ai&#39;, qwen: &#39;Qwen&#39;, deepseek: &#39;DeepSeek&#39;, gemini: &#39;Gemini&#39; }; |
| DESIGN_SITES | const | 22 | no | const DESIGN_SITES = ASK_SITES; |
| COMPARE_API | const | 26 | no | const COMPARE_API = &#39;/api/v1/compare&#39;; |
| COMPARE_JOB_ID | const | 27 | no | const COMPARE_JOB_ID = /^cmp-[a-f0-9]{24}$/; |
| COMPARE_ACTIVE | const | 28 | no | const COMPARE_ACTIVE = new Set([&#39;queued&#39;, &#39;running&#39;]); |
| isCompareActive | function | 29 | no | const isCompareActive = job =&gt; Boolean(job &amp;&amp; typeof job.state === &#39;string&#39; &amp;&amp; COMPARE_ACTIVE.has(job.state)); |
| ASK_BUSY_CODES | const | 31 | no | const ASK_BUSY_CODES = new Set([&#39;DRIVE_LEASE_BUSY&#39;, &#39;CONVERSATION_OWNED_BY_ANOTHER_RUNTIME&#39;, &#39;CONVERSATION_NOT_WRITABLE&#39;, &#39;RUNTIME_CLOSED&#39;]); |
| ASK_REFUSAL_CODES | const | 32 | no | const ASK_REFUSAL_CODES = new Set([...ASK_BUSY_CODES, &#39;BROWSER_UNAVAILABLE&#39;, &#39;DRAFT_PRESENT&#39;, &#39;STALE_REVISION&#39;, &#39;THREAD_IDENTITY_UNVERIFIED&#39;, &#39;BINDING_CHANGED&#39;, &#39;THREAD_FENCED&#39;, &#39;PRIOR_TURN_CAPTURE_N… |
| MAX_SHARED_ASK_CHARS | const | 40 | no | const MAX_SHARED_ASK_CHARS = 10000; |
| sharedAskFromHash | function | 41 | no | function sharedAskFromHash(raw) { |
| text | variable | 44 | no | let text; try { text = decodeURIComponent(match[1]); } catch { text = match[1]; } |
| validateMobileScaffold | function | 52 | yes | export function validateMobileScaffold(payload, id) { |
| value | const | 53 | no | const value = payload?.scaffold; |
| keys | const | 61 | no | const keys = new Set(); |
| validateMobileContent | function | 77 | yes | export function validateMobileContent(content, id) { |
| mountMobile | function | 87 | yes | export function mountMobile({ document: doc, root, fetchImpl = globalThis.fetch, search = globalThis.location?.search ?? &#39;&#39;, hash = globalThis.location?.hash ?? &#39;&#39;, uuid = () =&gt; globalThis.crypto?.ra… |
| state | const | 92 | no | const state = { appId: null, scaffold: null, version: null, active: &#39;home&#39;, |
| requestTicket | variable | 102 | no | let requestTicket = 0; |
| designReadTicket | variable | 103 | no | let designReadTicket = 0; |
| el | function | 104 | no | function el(tag, text, cls) { |
| node | const | 105 | no | const node = doc.createElement(tag); |
| attr | function | 110 | no | function attr(node, key, value) { node.setAttribute(key, String(value)); return node; } |
| on | function | 111 | no | const on = (node, type, fn) =&gt; node.addEventListener(type, fn); |
| btn | function | 112 | no | const btn = (text, fn, cls) =&gt; { |
| node | const | 113 | no | const node = el(&#39;button&#39;, text, cls); |
| link | function | 117 | no | function link(text, href, cls) { |
| node | const | 118 | no | const node = el(&#39;a&#39;, text, cls); attr(node, &#39;href&#39;, href); return node; |
| request | function | 120 | no | async function request(path, options = {}) { |
| controller | const | 121 | no | const controller = typeof AbortController === &#39;function&#39; ? new AbortController() : null; |
| timer | const | 122 | no | const timer = controller ? globalThis.setTimeout(() =&gt; controller.abort(), options.timeoutMs ?? 20000) : null; |
| response | const | 124 | no | const response = await fetchImpl(path, { credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39;, ...(controller ? { signal: controller.signal } : {}), ...(options.body ? { headers: { &#39;content-type&#39;: &#39;applicat… |
| data | variable | 128 | no | let data; try { data = await response.json(); } catch { data = null; } |
| message | function | 134 | no | function message(target) { |
| notice | const | 136 | no | const notice = el(&#39;section&#39;, undefined, &#39;notice&#39;); attr(notice, &#39;role&#39;, &#39;status&#39;); |
| check | const | 140 | no | const check = btn(state.recovering ? &#39;Checking connection…&#39; : &#39;Check connection&#39;, () =&gt; recoverConnection()); |
| header | function | 146 | no | function header() { |
| top | const | 147 | no | const top = el(&#39;header&#39;, undefined, &#39;top&#39;), name = el(&#39;div&#39;); |
| actions | const | 149 | no | const actions = el(&#39;div&#39;, undefined, &#39;top-actions&#39;); |
| privacy | function | 156 | no | function privacy(target) { |
| renderIndex | function | 163 | no | function renderIndex(target) { |
| hero | const | 164 | no | const hero = el(&#39;section&#39;, undefined, &#39;card hero&#39;); |
| list | const | 169 | no | const list = el(&#39;section&#39;, undefined, &#39;card&#39;); |
| button | const | 174 | no | const button = btn(app.title + &#39; · &#39; + app.screenCount + &#39; screens&#39;, () =&gt; openApp(app.id), &#39;tile&#39;); |
| renderHome | function | 182 | no | function renderHome(target) { |
| hero | const | 183 | no | const hero = el(&#39;section&#39;, undefined, &#39;card hero&#39;); |
| tiles | const | 188 | no | const tiles = el(&#39;section&#39;, undefined, &#39;card&#39;); |
| renderAgent | function | 195 | no | function renderAgent(target) { |
| box | const | 196 | no | const box = el(&#39;section&#39;, undefined, &#39;card&#39;); |
| read | const | 199 | no | const read = btn(&#39;Read local agent status&#39;, () =&gt; readAgent(), &#39;primary&#39;); |
| counts | const | 206 | no | const counts = state.agent.work?.byStatus; |
| renderBuilder | function | 213 | no | function renderBuilder(target) { |
| b | const | 214 | no | const b = state.builder; |
| box | const | 215 | no | const box = el(&#39;section&#39;, undefined, &#39;card&#39;); |
| kinds | const | 219 | no | const kinds = el(&#39;div&#39;, undefined, &#39;row&#39;); |
| choice | const | 221 | no | const choice = btn(label, () =&gt; { b.kind = kind; b.preview = null; render(); }); |
| form | const | 225 | no | const form = el(&#39;form&#39;, undefined, &#39;stack&#39;); |
| label | const | 226 | no | const label = builderField(form, &#39;Screen name&#39;, b.label, 64, value =&gt; { b.label = value; b.preview = null; }); |
| preview | const | 227 | no | const preview = btn(&#39;Preview screen&#39;, () =&gt; {}); attr(preview, &#39;type&#39;, &#39;submit&#39;); |
| designFailed | const | 233 | no | const designFailed = b.job?.state === &#39;failed&#39;; |
| alt | const | 238 | no | const alt = Object.keys(DESIGN_SITES).find(site =&gt; site !== b.job.site); |
| sites | const | 241 | no | const sites = el(&#39;div&#39;, undefined, &#39;row&#39;); |
| choice | const | 243 | no | const choice = btn(DESIGN_SITES[site], () =&gt; { b.site = site; render(); }); |
| design | const | 248 | no | const design = btn(designFailed ? &#39;Try with another AI&#39; : &#39;Design with my AI&#39;, () =&gt; designAction(&#39;start&#39;), &#39;primary&#39;); |
| job | const | 256 | no | const job = b.job; |
| status | const | 257 | no | const status = el(&#39;p&#39;, job.state === &#39;ready-to-review&#39; ? &#39;Your AI has ideas ready to review.&#39; : job.state === &#39;failed&#39; ? (job.error?.message \|\| &#39;Your AI could not finish. Nothing changed. Check the c… |
| builderButton | function | 282 | no | function builderButton(target, text, fn, cls) { |
| button | const | 283 | no | const button = btn(text, fn, cls); button.disabled = state.busy; target.append(button); return button; |
| builderField | function | 285 | no | function builderField(target, text, value, max, change, multiline = false) { |
| label | const | 286 | no | const label = el(&#39;label&#39;, text, &#39;field&#39;), input = el(multiline ? &#39;textarea&#39; : &#39;input&#39;, undefined, &#39;field-input&#39;); |
| renderDiff | function | 295 | no | function renderDiff(target, preview) { |
| list | const | 297 | no | const list = el(&#39;ul&#39;); |
| renderTemplates | function | 301 | no | function renderTemplates(target) { |
| box | const | 302 | no | const box = el(&#39;section&#39;, undefined, &#39;card&#39;); |
| choice | const | 305 | no | const choice = builderButton(box, template.title, () =&gt; { state.template = template.id; state.creationKey = null; render(); }); |
| create | const | 311 | no | const create = builderButton(box, &#39;Create app&#39;, () =&gt; createTemplateApp(), &#39;primary&#39;); |
| builderError | function | 315 | no | function builderError(result) { |
| code | const | 316 | no | const code = result.data?.code; |
| builderRequest | function | 324 | no | async function builderRequest(suffix, body) { |
| id | const | 326 | no | const id = state.appId, ticket = requestTicket; |
| result | const | 328 | no | const result = await request(MOBILE_API + &#39;/&#39; + id + suffix, { method: &#39;POST&#39;, body, timeoutMs: 20000 }); |
| createTemplateApp | function | 334 | no | async function createTemplateApp() { |
| key | const | 337 | no | const key = uuid(); |
| ticket | const | 341 | no | const ticket = requestTicket; |
| result | const | 343 | no | const result = await request(MOBILE_API + &#39;/from-template&#39;, { method: &#39;POST&#39;, timeoutMs: 20000, body: { template: state.template, ...(state.appTitle.trim() ? { title: state.appTitle.trim() } : {}), i… |
| previewScreen | function | 351 | no | async function previewScreen() { |
| proposal | const | 353 | no | const proposal = { schema: &#39;vivim.personal-app-change/1&#39;, appId: state.appId, baseVersion: state.version, |
| data | const | 356 | no | const data = await builderRequest(&#39;/preview-change&#39;, { proposal }); |
| previewSavedReply | function | 359 | no | async function previewSavedReply(reply) { |
| data | const | 361 | no | const data = await builderRequest(&#39;/preview-provider-reply&#39;, { conversation: reply.conversation, turnId: reply.turnId }); |
| applyBuilderPreview | function | 364 | no | async function applyBuilderPreview() { |
| b | const | 365 | no | const b = state.builder, preview = b.preview; |
| body | const | 367 | no | const body = { expectedVersion: preview.baseVersion, approval: &#39;user-confirmed&#39; }; |
| data | const | 368 | no | const data = b.source ? await builderRequest(&#39;/apply-provider-reply&#39;, { ...body, conversation: b.source.conversation, turnId: b.source.turnId, replyDigest: preview.provenance?.replyDigest }) : |
| refreshBuilder | function | 373 | no | async function refreshBuilder() { |
| id | const | 375 | no | const id = state.appId, ticket = requestTicket; |
| result | const | 377 | no | const result = await request(MOBILE_API + &#39;/&#39; + id + &#39;/scaffold&#39;, { timeoutMs: 20000 }); |
| stopDesignPoll | function | 386 | no | function stopDesignPoll() { |
| readDesign | function | 391 | no | async function readDesign() { |
| id | const | 394 | no | const id = state.appId, ticket = requestTicket, designTicket = designReadTicket, old = state.builder.job; |
| path | const | 395 | no | const path = old?.id ? &#39;/ai-design/&#39; + encodeURIComponent(old.id) : &#39;/&#39; + id + &#39;/ai-design&#39;; |
| result | const | 396 | no | const result = await request(MOBILE_API + path, { timeoutMs: 20000 }); |
| wasChecked | const | 399 | no | const wasChecked = state.builder.designChecked; |
| designAction | function | 411 | no | async function designAction(action) { |
| id | const | 414 | no | const id = state.appId, ticket = requestTicket, b = state.builder; |
| path | const | 419 | no | const path = action === &#39;start&#39; ? &#39;/&#39; + id + &#39;/ai-design&#39; : &#39;/ai-design/&#39; + b.job.id + &#39;/&#39; + action; |
| result | const | 420 | no | const result = await request(MOBILE_API + path, { method: &#39;POST&#39;, timeoutMs: 20000, body: action === &#39;start&#39; ? { site: b.site, request: b.wish } : {} }); |
| loadBuilderReplies | function | 430 | no | async function loadBuilderReplies() { |
| ticket | const | 432 | no | const ticket = requestTicket; |
| result | const | 434 | no | const result = await request(CONVERSATIONS_API, { timeoutMs: 20000 }); |
| renderDataScreen | function | 445 | no | function renderDataScreen(target, screen) { |
| box | const | 446 | no | const box = el(&#39;section&#39;, undefined, &#39;card&#39;); |
| kind | const | 447 | no | const kind = screen.kind === &#39;notes&#39; ? &#39;note&#39; : &#39;task&#39;; |
| refresh | const | 449 | no | const refresh = btn(&#39;Reload saved content&#39;, () =&gt; loadContent()); |
| entries | const | 455 | no | const entries = state.content.items.filter(item =&gt; item.kind === kind); |
| row | const | 458 | no | const row = el(&#39;article&#39;, undefined, &#39;item&#39;); |
| toggle | const | 462 | no | const toggle = btn(item.completed ? &#39;Mark not done&#39; : &#39;Mark done&#39;, () =&gt; setComplete(item.id, !item.completed)); |
| form | const | 469 | no | const form = el(&#39;form&#39;, undefined, &#39;stack&#39;); |
| heading | const | 470 | no | const heading = el(&#39;label&#39;, &#39;Title&#39;, &#39;field&#39;), title = el(&#39;input&#39;, undefined, &#39;field-input&#39;); |
| bodyLabel | const | 476 | no | const bodyLabel = el(&#39;label&#39;, &#39;Details (optional)&#39;, &#39;field&#39;); |
| body | const | 477 | no | const body = el(&#39;textarea&#39;, undefined, &#39;field-input&#39;); |
| save | const | 482 | no | const save = btn(&#39;Save &#39; + kind + &#39; locally&#39;, () =&gt; {}); |
| renderDashboard | function | 489 | no | function renderDashboard(target) { |
| box | const | 490 | no | const box = el(&#39;section&#39;, undefined, &#39;card&#39;); |
| items | const | 496 | no | const items = state.content.items; |
| BRIDGE_API | const | 506 | no | const BRIDGE_API = &#39;/api/v1/bridge/commands&#39;; |
| openBootstrap | function | 508 | no | function openBootstrap() { |
| bootPoll | function | 513 | no | function bootPoll() { |
| bootRefresh | function | 520 | no | async function bootRefresh(quiet) { |
| b | const | 521 | no | const b = state.boot; |
| bootSend | function | 529 | no | async function bootSend(text, extra = {}) { |
| b | const | 530 | no | const b = state.boot; |
| res | const | 533 | no | const res = await request(BRIDGE_API, { method: &#39;POST&#39;, body: { text, ...extra } }); |
| bootRunLocal | function | 538 | no | async function bootRunLocal() { |
| b | const | 539 | no | const b = state.boot; |
| res | const | 542 | no | const res = await request(&#39;/api/v1/personal-agent/bootstrap&#39;, { method: &#39;POST&#39;, timeoutMs: 60000, body: { expectedVersion: b.agent?.initialized ? b.agent.version : null } }); |
| renderBootstrap | function | 549 | no | function renderBootstrap(page) { |
| b | const | 550 | no | const b = state.boot; |
| head | const | 551 | no | const head = el(&#39;section&#39;, undefined, &#39;card hero&#39;); |
| st | const | 557 | no | const st = el(&#39;section&#39;, undefined, &#39;card&#39;); |
| a | const | 559 | no | const a = b.agent; |
| stages | const | 563 | no | const stages = a.stages ?? {}; |
| names | const | 564 | no | const names = Object.keys(stages).length ? Object.keys(stages) : (a.nextStage ? [a.nextStage] : []); |
| row | const | 566 | no | const row = el(&#39;div&#39;, undefined, &#39;item&#39;); |
| s0 | const | 567 | no | const s0 = stages[name]?.status ?? &#39;pending&#39;; |
| ask | const | 569 | no | const ask = btn(&#39;Ask bridge to run&#39;, () =&gt; bootSend(&#39;Run bootstrap stage &#39; + name, { kind: &#39;stage&#39;, stage: name })); |
| run | const | 573 | no | const run = btn(b.busy ? &#39;Working\\u2026&#39; : &#39;Run remaining stages on PC&#39;, () =&gt; bootRunLocal(), &#39;primary&#39;); |
| form | const | 577 | no | const form = el(&#39;form&#39;, undefined, &#39;card ask-composer&#39;); |
| label | const | 578 | no | const label = el(&#39;label&#39;, &#39;Bootstrap command&#39;, &#39;field&#39;); attr(label, &#39;for&#39;, &#39;bootCmd&#39;); |
| box | const | 579 | no | const box = el(&#39;textarea&#39;, undefined, &#39;field-input&#39;); box.id = &#39;bootCmd&#39;; attr(box, &#39;maxlength&#39;, 8000); |
| send | const | 582 | no | const send = el(&#39;button&#39;, b.busy ? &#39;Sending\\u2026&#39; : &#39;Send to bridge&#39;, &#39;primary&#39;); attr(send, &#39;type&#39;, &#39;submit&#39;); send.disabled = b.busy; |
| hist | const | 585 | no | const hist = el(&#39;section&#39;, undefined, &#39;card&#39;); |
| it | const | 589 | no | const it = el(&#39;div&#39;, undefined, &#39;item&#39;); attr(it, &#39;data-bridge-id&#39;, c.id); |
| render | function | 596 | no | function render() { |
| page | const | 597 | no | const page = el(&#39;div&#39;); |
| meta | const | 606 | no | const meta = el(&#39;p&#39;, &#39;On this PC · Blueprint v&#39; + state.version, &#39;eyebrow&#39;); |
| tabs | const | 608 | no | const tabs = el(&#39;nav&#39;, undefined, &#39;tabs&#39;); attr(tabs, &#39;aria-label&#39;, &#39;App screens&#39;); attr(tabs, &#39;role&#39;, &#39;tablist&#39;); |
| control | const | 610 | no | const control = btn(screen.label, () =&gt; chooseScreen(screen.key)); |
| selected | const | 616 | no | const selected = state.scaffold.screens.find(x =&gt; x.key === state.active) ?? state.scaffold.screens[0]; |
| area | const | 617 | no | const area = el(&#39;main&#39;, undefined, &#39;screen&#39;); |
| blank | const | 624 | no | const blank = el(&#39;section&#39;, undefined, &#39;card&#39;); |
| paint | function | 633 | no | function paint(page) { |
| view | const | 634 | no | const view = doc.defaultView ?? globalThis; |
| scroller | const | 635 | no | const scroller = typeof view?.scrollY === &#39;number&#39; &amp;&amp; typeof view?.scrollTo === &#39;function&#39; ? view : null; |
| top | const | 636 | no | const top = scroller ? view.scrollY : null; |
| focused | const | 637 | no | const focused = doc.activeElement; |
| selection | const | 638 | no | const selection = focused?.id === &#39;askMessage&#39; |
| box | const | 642 | no | const box = doc.getElementById(&#39;askMessage&#39;); |
| height | const | 649 | no | const height = doc.scrollingElement?.scrollHeight ?? doc.documentElement?.scrollHeight ?? 0; |
| loadIndex | function | 653 | no | async function loadIndex() { |
| ticket | const | 654 | no | const ticket = ++requestTicket; |
| openApp | function | 670 | no | async function openApp(id) { |
| ticket | const | 674 | no | const ticket = ++requestTicket; |
| result | const | 681 | no | const result = await request(MOBILE_API + &#39;/&#39; + encodeURIComponent(id) + &#39;/scaffold&#39;); |
| loadContent | function | 691 | no | async function loadContent() { |
| id | const | 692 | no | const id = state.appId, ticket = requestTicket; |
| result | const | 695 | no | const result = await request(MOBILE_API + &#39;/&#39; + encodeURIComponent(id) + &#39;/content&#39;); |
| chooseScreen | function | 704 | no | function chooseScreen(key) { |
| priorKind | const | 706 | no | const priorKind = state.scaffold.screens.find(screen =&gt; screen.key === state.active)?.kind; |
| kind | const | 709 | no | const kind = state.scaffold.screens.find(screen =&gt; screen.key === key).kind; |
| createItem | function | 715 | no | async function createItem(kind) { |
| id | const | 716 | no | const id = state.appId, content = state.content; |
| key | const | 719 | no | const key = uuid(); |
| title | const | 723 | no | const title = state.draftTitle, body = state.draftBody; |
| sentKey | const | 724 | no | const sentKey = state.pendingKey, ticket = requestTicket; |
| result | const | 726 | no | const result = await request(MOBILE_API + &#39;/&#39; + id + &#39;/content/items&#39;, { method: &#39;POST&#39;, body: { expectedVersion: content.version, idempotencyKey: state.pendingKey, kind, title, body }, }); |
| setComplete | function | 746 | no | async function setComplete(itemId, completed) { |
| id | const | 747 | no | const id = state.appId, current = state.content, ticket = requestTicket; |
| result | const | 750 | no | const result = await request(MOBILE_API + &#39;/&#39; + id + &#39;/content/items/&#39; + itemId + &#39;/completion&#39;, { method: &#39;POST&#39;, body: { expectedVersion: current.version, completed }, }); |
| readAgent | function | 763 | no | async function readAgent() { |
| ticket | const | 765 | no | const ticket = requestTicket, id = state.appId; |
| result | const | 767 | no | const result = await request(&#39;/api/v1/personal-agent/status&#39;); |
| askSite | function | 780 | no | const askSite = () =&gt; ASK_SITES[state.ask.site] ?? &#39;your AI&#39;; |
| askUnwrap | function | 781 | no | const askUnwrap = (data) =&gt; { |
| c | const | 782 | no | const c = data?.conversation ?? data?.resource ?? data; |
| compareUnwrap | function | 786 | no | const compareUnwrap = (data) =&gt; { |
| job | const | 787 | no | const job = data?.job; |
| askTurns | function | 791 | no | const askTurns = () =&gt; (Array.isArray(state.ask.snapshot?.turns) ? state.ask.snapshot.turns : []); |
| askFindTurn | function | 792 | no | const askFindTurn = (key) =&gt; askTurns().find(turn =&gt; turn?.key === key) ?? null; |
| askStorage | function | 793 | no | function askStorage() { try { return globalThis.localStorage ?? null; } catch { return null; } } |
| saveAsk | function | 796 | no | function saveAsk() { |
| store | const | 797 | no | const store = askStorage(); if (!store) return; |
| restoreAsk | function | 805 | no | function restoreAsk() { |
| store | const | 806 | no | const store = askStorage(); if (!store) return; |
| saved | const | 808 | no | const saved = JSON.parse(store.getItem(ASK_STORE) ?? &#39;null&#39;); |
| sites | const | 821 | no | const sites = saved.compareSites.filter(site =&gt; Object.hasOwn(ASK_SITES, site)); |
| askStopPolling | function | 831 | no | function askStopPolling() { |
| askSchedulePoll | function | 836 | no | function askSchedulePoll() { |
| askSignature | function | 841 | no | function askSignature() { |
| ask | const | 842 | no | const ask = state.ask; |
| askPoll | function | 848 | no | async function askPoll() { |
| ask | const | 849 | no | const ask = state.ask, pending = ask.pending; |
| ticket | const | 851 | no | const ticket = requestTicket, before = askSignature(); |
| ok | const | 853 | no | const ok = await askRefresh(ticket); |
| outcome | const | 869 | no | const outcome = askResolve(); |
| askApply | function | 879 | no | function askApply(snapshot) { |
| ask | const | 880 | no | const ask = state.ask; |
| askRefresh | function | 887 | no | async function askRefresh(ticket) { |
| ask | const | 888 | no | const ask = state.ask; |
| result | const | 891 | no | const result = await request(CONVERSATIONS_API + &#39;/&#39; + encodeURIComponent(ask.conversationId), { timeoutMs: 20000 }); |
| snapshot | const | 893 | no | const snapshot = askUnwrap(result.data); |
| askResolve | function | 914 | no | function askResolve() { |
| ask | const | 915 | no | const ask = state.ask, pending = ask.pending; |
| turn | const | 917 | no | const turn = askFindTurn(pending.key); |
| reply | const | 929 | no | const reply = turn.reply ?? {}; |
| askSendError | function | 955 | no | function askSendError(code) { |
| name | const | 956 | no | const name = askSite(); |
| askCreateError | function | 976 | no | function askCreateError(code) { |
| name | const | 977 | no | const name = askSite(); |
| askBlocked | function | 986 | no | function askBlocked() { |
| ask | const | 987 | no | const ask = state.ask, name = askSite(); |
| turns | const | 991 | no | const turns = askTurns(), last = turns[turns.length - 1]; |
| askCreate | function | 1000 | no | async function askCreate(ticket) { |
| ask | const | 1001 | no | const ask = state.ask, site = ask.site; |
| result | const | 1002 | no | const result = await request(CONVERSATIONS_API + &#39;/create&#39;, { method: &#39;POST&#39;, body: { site }, timeoutMs: 120000 }); |
| snapshot | const | 1005 | no | const snapshot = askUnwrap(result.data); |
| askPostPending | function | 1019 | no | async function askPostPending(ticket) { |
| ask | const | 1020 | no | const ask = state.ask, pending = ask.pending; |
| result | const | 1022 | no | const result = await request(CONVERSATIONS_API + &#39;/&#39; + encodeURIComponent(ask.conversationId) + &#39;/turns&#39;, { method: &#39;POST&#39;, timeoutMs: 120000, body: { key: pending.key, prompt: pending.prompt, confir… |
| snapshot | const | 1027 | no | const snapshot = askUnwrap(result.data); |
| refreshed | const | 1036 | no | const refreshed = await askRefresh(ticket); |
| askPost | function | 1045 | no | async function askPost(prompt, ticket) { |
| ask | const | 1046 | no | const ask = state.ask, turns = askTurns(); |
| key | const | 1047 | no | const key = uuid() \|\| &#39;mobile-&#39; + Date.now().toString(36) + &#39;-&#39; + Math.random().toString(16).slice(2, 10); |
| pending | const | 1048 | no | const pending = { key, prompt, at: Date.now(), polls: 0, code: null, |
| askSend | function | 1057 | no | async function askSend() { |
| ask | const | 1058 | no | const ask = state.ask, prompt = ask.draft.replace(/\\s+$/, &#39;&#39;); |
| ticket | const | 1060 | no | const ticket = requestTicket; |
| askRetry | function | 1076 | no | async function askRetry() { |
| ask | const | 1077 | no | const ask = state.ask, pending = ask.pending; |
| ticket | const | 1079 | no | const ticket = requestTicket; |
| ok | const | 1081 | no | const ok = await askRefresh(ticket); |
| askCheckAgain | function | 1106 | no | async function askCheckAgain() { |
| ask | const | 1107 | no | const ask = state.ask; |
| ticket | const | 1110 | no | const ticket = requestTicket; |
| ok | const | 1112 | no | const ok = await askRefresh(ticket); |
| askNewChat | function | 1129 | no | async function askNewChat() { |
| ask | const | 1130 | no | const ask = state.ask; |
| id | const | 1132 | no | const id = ask.conversationId; |
| ticket | const | 1135 | no | const ticket = requestTicket; |
| result | const | 1136 | no | const result = id ? await request(CONVERSATIONS_API + &#39;/&#39; + encodeURIComponent(id) + &#39;/finish&#39;, { method: &#39;POST&#39;, body: { closeTab: true }, timeoutMs: 20000 }) : null; |
| askChooseSite | function | 1153 | no | function askChooseSite(site) { |
| ask | const | 1154 | no | const ask = state.ask; |
| askSetMode | function | 1158 | no | function askSetMode(mode) { |
| compareToggleSite | function | 1167 | no | function compareToggleSite(site) { |
| c | const | 1168 | no | const c = state.compare; |
| picked | const | 1170 | no | const picked = new Set(c.sites); |
| compareStopPolling | function | 1175 | no | function compareStopPolling() { |
| compareSchedulePoll | function | 1178 | no | function compareSchedulePoll() { |
| c | const | 1180 | no | const c = state.compare; |
| compareRefresh | function | 1186 | no | async function compareRefresh() { |
| c | const | 1187 | no | const c = state.compare, jobId = c.job?.id; |
| ticket | const | 1189 | no | const ticket = requestTicket; |
| result | const | 1190 | no | const result = await request(COMPARE_API + &#39;/&#39; + encodeURIComponent(jobId), { timeoutMs: 20000 }); |
| job | const | 1192 | no | const job = compareUnwrap(result.data); |
| compareStart | function | 1212 | no | async function compareStart() { |
| c | const | 1213 | no | const c = state.compare, question = c.question.trim(); |
| ticket | const | 1215 | no | const ticket = requestTicket; |
| result | const | 1217 | no | const result = await request(COMPARE_API, { method: &#39;POST&#39;, timeoutMs: 20000, body: { question, sites: c.sites } }); |
| job | const | 1220 | no | const job = compareUnwrap(result.data); |
| compareCancel | function | 1232 | no | async function compareCancel() { |
| c | const | 1233 | no | const c = state.compare, jobId = c.job?.id; |
| ticket | const | 1235 | no | const ticket = requestTicket; |
| result | const | 1237 | no | const result = await request(COMPARE_API + &#39;/&#39; + encodeURIComponent(jobId) + &#39;/cancel&#39;, { method: &#39;POST&#39;, timeoutMs: 20000 }); |
| job | const | 1240 | no | const job = compareUnwrap(result.data); |
| compareReset | function | 1245 | no | function compareReset() { |
| c | const | 1246 | no | const c = state.compare; |
| openAsk | function | 1250 | no | function openAsk() { |
| askLoadOnOpen | function | 1260 | no | async function askLoadOnOpen() { |
| ticket | const | 1262 | no | const ticket = requestTicket; |
| ok | const | 1264 | no | const ok = await askRefresh(ticket); |
| recoverConnection | function | 1282 | no | async function recoverConnection() { |
| ticket | const | 1285 | no | const ticket = requestTicket; |
| result | const | 1286 | no | const result = await request(MOBILE_API, { timeoutMs: 10000 }); |
| askRows | function | 1298 | no | function askRows() { |
| ask | const | 1299 | no | const ask = state.ask, local = new Map(ask.turns.map(turn =&gt; [turn.key, turn.prompt])); |
| rows | const | 1300 | no | const rows = [], seen = new Set(); |
| key | const | 1302 | no | const key = typeof turn?.key === &#39;string&#39; ? turn.key : &#39;&#39;; |
| askDots | function | 1314 | no | function askDots(name) { |
| dots | const | 1315 | no | const dots = el(&#39;span&#39;, undefined, &#39;typing&#39;); |
| askBubble | function | 1320 | no | function askBubble(row, last) { |
| name | const | 1321 | no | const name = askSite(); |
| node | const | 1322 | no | const node = el(&#39;div&#39;, undefined, &#39;bubble &#39; + (row.role === &#39;you&#39; ? &#39;you&#39; : &#39;ai&#39;)); |
| reply | const | 1328 | no | const reply = row.turn?.reply ?? null, text = typeof reply?.text === &#39;string&#39; ? reply.text : &#39;&#39;; |
| renderAskEntry | function | 1345 | no | function renderAskEntry(target) { |
| ask | const | 1346 | no | const ask = state.ask; |
| card | const | 1347 | no | const card = el(&#39;button&#39;, undefined, &#39;ask-card&#39;); |
| askComposer | function | 1356 | no | function askComposer() { |
| ask | const | 1357 | no | const ask = state.ask, name = askSite(); |
| form | const | 1358 | no | const form = el(&#39;section&#39;, undefined, &#39;card ask-composer&#39;); |
| field | const | 1359 | no | const field = el(&#39;label&#39;, &#39;Your message&#39;, &#39;field&#39;); |
| box | const | 1361 | no | const box = el(&#39;textarea&#39;, undefined, &#39;field-input&#39;); |
| actions | const | 1366 | no | const actions = el(&#39;div&#39;, undefined, &#39;ask-actions&#39;); |
| send | const | 1367 | no | const send = btn(&#39;Send&#39;, () =&gt; askSend(), &#39;primary&#39;); |
| fresh | const | 1369 | no | const fresh = btn(&#39;New chat&#39;, () =&gt; askNewChat()); |
| blocked | const | 1378 | no | const blocked = askBlocked(); |
| renderCompare | function | 1382 | no | function renderCompare(page) { |
| c | const | 1383 | no | const c = state.compare, active = isCompareActive(c.job); |
| pick | const | 1384 | no | const pick = el(&#39;section&#39;, undefined, &#39;card&#39;); |
| grid | const | 1387 | no | const grid = el(&#39;div&#39;, undefined, &#39;seg&#39;); |
| choice | const | 1390 | no | const choice = btn(ASK_SITES[site], () =&gt; compareToggleSite(site)); |
| field | const | 1396 | no | const field = el(&#39;label&#39;, &#39;Your question&#39;, &#39;field&#39;); |
| area | const | 1398 | no | const area = el(&#39;textarea&#39;, undefined, &#39;field-input&#39;); |
| send | const | 1403 | no | const send = btn(&#39;Ask several&#39;, () =&gt; compareStart(), &#39;primary&#39;); |
| results | const | 1415 | no | const results = el(&#39;section&#39;, undefined, &#39;card&#39;); |
| row | const | 1424 | no | const row = el(&#39;article&#39;, undefined, &#39;item&#39;); |
| stop | const | 1432 | no | const stop = btn(&#39;Stop waiting&#39;, () =&gt; compareCancel()); |
| again | const | 1435 | no | const again = btn(&#39;Ask again&#39;, () =&gt; compareReset()); |
| renderAsk | function | 1440 | no | function renderAsk(page) { |
| ask | const | 1441 | no | const ask = state.ask; |
| hero | const | 1442 | no | const hero = el(&#39;section&#39;, undefined, &#39;card hero&#39;); |
| modeRow | const | 1445 | no | const modeRow = el(&#39;div&#39;, undefined, &#39;seg&#39;); |
| choice | const | 1448 | no | const choice = btn(label, () =&gt; askSetMode(key)); |
| name | const | 1457 | no | const name = askSite(); |
| siteCard | const | 1458 | no | const siteCard = el(&#39;section&#39;, undefined, &#39;card&#39;); |
| seg | const | 1460 | no | const seg = el(&#39;div&#39;, undefined, &#39;seg&#39;); |
| choice | const | 1463 | no | const choice = btn(ASK_SITES[site], () =&gt; askChooseSite(site)); |
| thread | const | 1472 | no | const thread = el(&#39;section&#39;, undefined, &#39;card&#39;); |
| rows | const | 1474 | no | const rows = askRows(); |
| log | const | 1479 | no | const log = el(&#39;div&#39;, undefined, &#39;bubbles&#39;); |
| status | const | 1485 | no | const status = el(&#39;div&#39;); |
| again | const | 1491 | no | const again = btn(&#39;Try again&#39;, () =&gt; askRetry()); |
| check | const | 1496 | no | const check = btn(&#39;Check again&#39;, () =&gt; askCheckAgain()); |
| app | const | 1504 | no | const app = new URLSearchParams(search).get(&#39;app&#39;); |
| view | const | 1506 | no | const view = doc.defaultView; |
| shared | const | 1511 | no | const shared = sharedAskFromHash(hash); |
| loc | const | 1515 | no | const loc = view?.location; |
| registerMobileShell | function | 1528 | yes | export function registerMobileShell(nav = typeof navigator !== &#39;undefined&#39; ? navigator : null, secure = typeof isSecureContext !== &#39;undefined&#39; &amp;&amp; isSecureContext) { |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM mobile surface: same owner, same Studio APIs, fixed trusted components only.
// Phone-shaped working view served by the user's own PC: loopback by default, or reachable from a phone on
// the same WiFi only when the PC runs `studio start|serve --lan-pair` (explicit opt-in, token required;
// see docs/architecture/MOBILE-LAN-PAIRING.md). Installable as a PWA (manifest + shell-only service
// worker; the shell opens offline, but data and every mutation always need the live PC). Chrome only
// installs/registers the worker in a secure context (https, localhost, or `adb reverse`); over plain
// http://<LAN-IP> it still works as a normal page. NOT an APK, cloud sync, or offline data/queued writes.
export const MOBILE_API = '/api/v1/personal-apps';
const APP_ID = /^app-[a-f0-9]{32}$/;
const ITEM_ID = /^item-[a-f0-9]{32}$/;
const SCREENS = new Set(['home', 'agent', 'builder', 'notes', 'tasks', 'dashboard', 'blank']);
// "Ask my AI" talks to the same in-process conversation runtime the desktop Chat page uses. Same origin, same
// Studio cookie: the phone never holds a provider credential and never contacts a provider directly.
const CONVERSATIONS_API = '/api/v1/conversations';
const ASK_STORE = 'vivim.mobile.ask.v1';
const ASK_POLL_MS = 2500;
// All six signed-in AI websites the phone may ask directly (same set the backend's create and compare
// routes accept). "Ask my AI" lets the user pick any one of these, remembered on this phone.
const ASK_SITES = { chatgpt: 'ChatGPT', claude: 'Claude', zai: 'Z.ai', qwen: 'Qwen', deepseek: 'DeepSeek', gemini: 'Gemini' };
// "Design with my AI" accepts the same six signed-in AI websites as Ask my AI and Ask several
// (personal-app-ai-design.mjs AI_DESIGN_SITES === conversation-api.mjs CREATE_SITES).
const DESIGN_SITES = ASK_SITES;
// "Ask several": one question sent to more than one AI at once, through the shared compare job runner
// (src/studio/compare-service.mjs). Same no-resend rule as a single chat: polling only ever re-reads the
// SAME job id; a new question is the only thing that starts a new job.
const COMPARE_API = '/api/v1/compare';
const COMPARE_JOB_ID = /^cmp-[a-f0-9]{24}$/;
const COMPARE_ACTIVE = new Set(['queued', 'running']);
const isCompareActive = job => Boolean(job && typeof job.state === 'string' && COMPARE_ACTIVE.has(job.state));
// Recognized refusals get specific advice; every retry still requires a fresh stored read with no matching key.
const ASK_BUSY_CODES = new Set(['DRIVE_LEASE_BUSY', 'CONVERSATION_OWNED_BY_ANOTHER_RUNTIME', 'CONVERSATION_NOT_WRITABLE', 'RUNTIME_CLOSED']);
const ASK_REFUSAL_CODES = new Set([...ASK_BUSY_CODES, 'BROWSER_UNAVAILABLE', 'DRAFT_PRESENT',
  'STALE_REVISION', 'THREAD_IDENTITY_UNVERIFIED', 'BINDING_CHANGED', 'THREAD_FENCED',
  'PRIOR_TURN_CAPTURE_NOT_FINALIZED', 'ONE_TURN_LIMIT', 'CONVERSATION_FINISHED',
  'CONVERSATION_NOT_FOUND', 'INVALID_SUBMISSION']);
// Android's Share sheet hands selected text from any app to the native shell, which opens the
// paired PC URL with it as a #ask=<encoded text> fragment (see android/.../MainActivity.java).
// Fragments never reach the server or its logs. Read once on load, prefill (never auto-send) the
// Ask my AI box, then the caller clears the fragment so Back/reload cannot resubmit the same text.
const MAX_SHARED_ASK_CHARS = 10000;
function sharedAskFromHash(raw) {
  const match = /^#ask=([\s\S]*)$/.exec(typeof raw === 'string' ? raw : '');
  if (!match) return null;
  let text; try { text = decodeURIComponent(match[1]); } catch { text = match[1]; }
  text = text.trim();
  if (!text) return null;
  if (text.length <= MAX_SHARED_ASK_CHARS) return { text, notice: '' };
  return { text: text.slice(0, MAX_SHARED_ASK_CHARS),
    notice: 'The shared text was long, so it was trimmed to 10,000 characters.' };
}

export function validateMobileScaffold(payload, id) {
  const value = payload?.scaffold;
  if (!value || value.schema !== 'vivim.personal-mobile-scaffold/1' ||
      value.appId !== id || !APP_ID.test(id) ||
      !Number.isSafeInteger(payload.version) || payload.version < 1 ||
      typeof value.name !== 'string' || value.name.length > 80 ||
      !Array.isArray(value.screens) || value.screens.length < 3 || value.screens.length > 12 ||
      value.runnableCode !== false || value.intelligence?.dispatch !== 'disabled' ||
      value.connection?.paired !== false) throw new Error('Unsupported or unsafe local app scaffold');
  const keys = new Set();
  for (const screen of value.screens) {
    if (!screen || typeof screen.key !== 'string' ||
        !/^[a-z][a-z0-9-]{0,48}$/.test(screen.key) ||
        !SCREENS.has(screen.kind) ||
        typeof screen.label !== 'string' || !screen.label.trim() ||
        screen.label.length > 64 || keys.has(screen.key)) {
      throw new Error('Unsupported mobile screen');
    }
    keys.add(screen.key);
  }
  if (!['home', 'agent', 'builder'].every(key => keys.has(key))) {
    throw new Error('Required VIVIM screens are missing');
  }
  return value;
}
export function validateMobileContent(content, id) {
  if (!content || content.schema !== 'vivim.personal-app-content/1' ||
      content.appId !== id || !Number.isSafeInteger(content.version) ||
      content.version < 0 || !Array.isArray(content.items) || content.items.length > 200 ||
```

_First 80 of 1537 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

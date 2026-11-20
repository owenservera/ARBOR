# File: apps/mobile-relay/app.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/app.js |
| Language | JavaScript |
| Kind | source |
| Size | 122494 B |
| Lines | 2186 |
| Hash | c1ba732bdd16 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| $ | function | 22 | no | const $ = id =&gt; document.getElementById(id); |
| api | const | 23 | no | const api = transport.request; |
| shellPresentation | const | 24 | no | const shellPresentation=createShellPresentation(document.body); |
| HOST_PREVIEW | const | 27 | no | const HOST_PREVIEW = new URLSearchParams(location.search).get(&#39;host-preview&#39;) === &#39;1&#39; |
| pocketButton | const | 32 | no | const pocketButton = document.getElementById(&#39;pocket-native&#39;); |
| pair | function | 41 | no | async function pair(secret) { await api(&#39;pair&#39;, { method: &#39;POST&#39;, body: JSON.stringify({ secret }) }); } |
| el | function | 44 | no | const el = (tag, cls, text) =&gt; { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }; |
| esc | function | 45 | no | const esc = s =&gt; String(s).replace(/&amp;/g, &#39;&amp;amp;&#39;).replace(/&lt;/g, &#39;&amp;lt;&#39;).replace(/&gt;/g, &#39;&amp;gt;&#39;).replace(/&quot;/g, &#39;&amp;quot;&#39;).replace(/&#39;/g, &#39;&amp;#39;&#39;); |
| lsGet | function | 46 | no | const lsGet = (k, d) =&gt; { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } }; |
| lsSet | function | 47 | no | const lsSet = (k, v) =&gt; { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }; |
| hex16 | function | 48 | no | const hex16 = () =&gt; Array.from(crypto.getRandomValues(new Uint8Array(8)), b =&gt; b.toString(16).padStart(2, &#39;0&#39;)).join(&#39;&#39;); |
| tsOf | function | 49 | no | const tsOf = c =&gt; Date.parse(c.createdAt) \|\| Number(c.createdAt) \|\| 0; |
| MAXTEXT | const | 50 | no | const MAXTEXT = 4000; |
| inline | function | 53 | no | function inline(t) { |
| st | const | 54 | no | const st = []; const keep = h =&gt; &#39;\\u0001&#39; + (st.push(h) - 1) + &#39;\\u0001&#39;; |
| emph | function | 55 | no | const emph = x =&gt; x.replace(/\\*\\*([^*\\n]+)\\*\\*/g, &#39;&lt;strong&gt;$1&lt;/strong&gt;&#39;) |
| md | function | 65 | no | function md(src) { |
| fences | const | 66 | no | const fences = []; |
| s | const | 67 | no | const s = esc(src).replace(/```([\\w+-]*)[ \\t]*\\n([\\s\\S]*?)(?:```\|$)/g, (m, l, c) =&gt; { fences.push(&#39;&lt;pre&gt;&lt;code&gt;&#39; + c.replace(/\\n$/, &#39;&#39;) + &#39;&lt;/code&gt;&lt;/pre&gt;&#39;); return &#39;\\n\\u0000&#39; + (fences.length - 1) + &#39;\\… |
| out | const | 69 | no | const out = []; let para = [], list = null; |
| fp | function | 70 | no | const fp = () =&gt; { if (para.length) { out.push(&#39;&lt;p&gt;&#39; + para.join(&#39;&lt;br&gt;&#39;) + &#39;&lt;/p&gt;&#39;); para = []; } }; |
| fl | function | 71 | no | const fl = () =&gt; { if (list) { out.push(&#39;&lt;&#39; + list.t + &#39;&gt;&#39; + list.i.map(x =&gt; &#39;&lt;li&gt;&#39; + x + &#39;&lt;/li&gt;&#39;).join(&#39;&#39;) + &#39;&lt;/&#39; + list.t + &#39;&gt;&#39;); list = null; } }; |
| m | variable | 73 | no | let m; |
| FALLBACK | const | 84 | no | const FALLBACK = [[&#39;chatgpt&#39;, &#39;ChatGPT&#39;], [&#39;claude&#39;, &#39;Claude&#39;], [&#39;qwen&#39;, &#39;Qwen&#39;], [&#39;zai&#39;, &#39;Z.ai&#39;]] |
| S | const | 86 | no | const S = { |
| buildBindingSequence | variable | 94 | no | let buildBindingSequence=0; |
| combinedInbox | variable | 95 | no | let combinedInbox = true; // UI-only inbox aggregation; never fan-out or a provider target. |
| providerRefreshBusy | variable | 96 | no | let providerRefreshBusy = false; |
| N | const | 97 | no | const N = { target: transport.direct ? &#39;vivim&#39; : &#39;harness&#39;, session: &#39;&#39;, sessions: [], messages: [], timer: 0, generation: 0, sending: false, note: &#39;&#39;, pending: null }; |
| chatHasApproval | variable | 100 | no | let chatHasApproval = false; |
| vivimChat | const | 101 | no | const vivimChat = createControlChat({ host: $(&#39;msgs&#39;), transport, getSurface: () =&gt; S.tab, onChange: () =&gt; { chatHasApproval = vivimChat.hasPendingApproval(); |
| status | const | 114 | no | const status=await api(&#39;status&#39;); |
| bootstrap | const | 115 | no | const bootstrap=status?.snapshot?.bootstrap; |
| surface | variable | 118 | no | let surface; |
| build | variable | 135 | no | let build = null, buildTimer = 0, buildKey = &#39;&#39;; |
| dockAssist | variable | 136 | no | let dockAssist=null; |
| composerScope | function | 137 | no | function composerScope(){ |
| headers | const | 139 | no | const headers=transport.deviceHeaders?.(); |
| session | const | 140 | no | const session=headers?.[&#39;x-vivim-device-session&#39;];if(!session)return null; |
| revision | const | 141 | no | const revision=build?.surface()?.revision??S.statusObj?.snapshot?.bootstrap?.uiRevision?.revision??0; |
| classifyDraftUi | function | 144 | no | function classifyDraftUi(request){ |
| surface | const | 145 | no | const surface=build?.surface()??build?.draftSurface()??buildSurfaceFromBootstrap(S.statusObj?.snapshot?.bootstrap); |
| welcome | variable | 148 | no | let welcome = null; |
| capabilityLauncher | variable | 149 | no | let capabilityLauncher = null; |
| localNotes | variable | 150 | no | let localNotes = null; |
| localVoice | variable | 151 | no | let localVoice = null; |
| approvalPoll | variable | 152 | no | let approvalPoll = null; |
| starting | variable | 153 | no | let starting = null; |
| saveNativePending | function | 155 | no | function saveNativePending() { try { if (N.pending) sessionStorage.setItem(&#39;vivim.phone.pending.v1&#39;, JSON.stringify(N.pending)); else sessionStorage.removeItem(&#39;vivim.phone.pending.v1&#39;); } catch {} } |
| saveConvs | function | 157 | no | const saveConvs = () =&gt; { lsSet(&#39;relay.convs.v1&#39;, S.convs.slice(0, 50)); lsSet(&#39;relay.active.v1&#39;, S.active); }; |
| providers | function | 158 | no | const providers = () =&gt; (S.manifest &amp;&amp; Array.isArray(S.manifest.providers) ? S.manifest.providers : FALLBACK).filter(p =&gt; p.signedIn); |
| curConv | function | 159 | no | const curConv = () =&gt; S.convs.find(c =&gt; c.id === S.active) \|\| null; |
| msgsOf | function | 160 | no | const msgsOf = id =&gt; S.cmds.filter(c =&gt; c.conversationId === id).reverse(); |
| isPend | function | 161 | no | const isPend = m =&gt; m.status === &#39;queued&#39; \|\| m.status === &#39;claimed&#39;; |
| pending | function | 162 | no | const pending = id =&gt; !!id &amp;&amp; msgsOf(id).some(isPend); |
| mkPrefix | function | 163 | no | const mkPrefix = c =&gt; &#39;@&#39; + c.provider + (c.model ? &#39;:&#39; + c.model : &#39;&#39;) + (c.effort ? &#39;@&#39; + c.effort : &#39;&#39;) + &#39; &#39;; |
| PFX | const | 164 | no | const PFX = /^@[\\w.-]+(?::[^\\s@]+)?(?:@[\\w.-]+)?\\s/; |
| TAG | const | 165 | no | const TAG = /^\\[([^\\]\\n]{1,80})\\]\\s*/; |
| stripPrefix | function | 166 | no | const stripPrefix = t =&gt; String(t \|\| &#39;&#39;).replace(PFX, &#39;&#39;); |
| targetLabel | function | 167 | no | const targetLabel = m =&gt; { const t = m.target \|\| {}; const s = (t.provider \|\| &#39;&#39;) + (t.model ? &#39;:&#39; + t.model : &#39;&#39;); return s \|\| m.consumer \|\| &#39;assistant&#39;; }; |
| toastT | variable | 168 | no | let toastT; |
| toast | function | 169 | no | function toast(msg) { const t = $(&#39;toast&#39;); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() =&gt; { t.hidden = true; }, 4000); } |
| setConn | function | 170 | no | function setConn(text, bad) { S.conn = { label: text, tone: bad ? &#39;bad&#39; : &#39;ok&#39; }; text = (HOST_PREVIEW ? &#39;Host&#39; : transport.direct ? &#39;Direct&#39; : &#39;Cloud&#39;) + &#39; · &#39; + text; $(&#39;conn&#39;).textContent = text; … |
| dockExpanded | variable | 175 | no | let dockExpanded = false; |
| chatContextEpoch | variable | 176 | no | let chatContextEpoch = 0; |
| chatContext | variable | 177 | no | let chatContext = null; |
| focusReturn | variable | 178 | no | let focusReturn = null; |
| CHAT_FOCUS | const | 179 | no | const CHAT_FOCUS = Object.freeze([&#39;today&#39;,&#39;talk&#39;,&#39;build&#39;,&#39;world&#39;,&#39;wiki&#39;,&#39;me&#39;,&#39;control&#39;]); |
| updateDock | function | 180 | no | function updateDock() { |
| composer | const | 181 | no | const composer = $(&#39;chat-composer&#39;); |
| expanded | const | 183 | no | const expanded = S.tab === &#39;talk&#39; \|\| dockExpanded; |
| expandDock | function | 204 | no | function expandDock() { |
| switchChatTarget | function | 210 | no | function switchChatTarget(next) { |
| focusPreview | function | 220 | no | function focusPreview(text,details) { |
| item | const | 221 | no | const item=el(&#39;div&#39;,&#39;chat-context-evidence&#39;); |
| renderFocusPanel | function | 226 | no | function renderFocusPanel() { |
| panel | const | 227 | no | const panel=$(&#39;chat-context-panel&#39;); |
| focus | const | 229 | no | const focus=$(&#39;chat-focus-views&#39;); |
| b | const | 232 | no | const b=el(&#39;button&#39;,&#39;&#39;,tab.charAt(0).toUpperCase()+tab.slice(1)); |
| rust | const | 238 | no | const rust=$(&#39;chat-rust-items&#39;);rust.replaceChildren(); |
| available | const | 239 | no | const available=chatContext?.state===&#39;source-backed&#39; &amp;&amp; chatContext.focus===S.tab; |
| activity | const | 258 | no | const activity=$(&#39;chat-focus-activity&#39;);activity.replaceChildren(); |
| current | const | 259 | no | const current=todayModel(S.statusObj,S.cmds,surfaceContext()); |
| entries | const | 260 | no | const entries=[...(current.attention\|\|[]),...(current.running\|\|[])].slice(0,6); |
| readGraphContext | function | 270 | no | async function readGraphContext() { |
| focus | const | 271 | no | const focus=S.tab; |
| device | const | 272 | no | const device=transport.deviceHeaders?.(); |
| epoch | const | 279 | no | const epoch=++chatContextEpoch; |
| response | const | 282 | no | const response=await fetch(&#39;/mobile/api/chat/context?focus=&#39;+encodeURIComponent(focus),{ method:&#39;GET&#39;,credentials:&#39;same-origin&#39;,cache:&#39;no-store&#39;,headers:device }); |
| data | const | 285 | no | const data=await response.json(); |
| openFocusPanel | function | 312 | no | function openFocusPanel() { |
| panel | const | 313 | no | const panel=$(&#39;chat-context-panel&#39;); |
| closeFocusPanel | function | 320 | no | function closeFocusPanel() { |
| mountUniversalDock | function | 325 | no | function mountUniversalDock() { |
| normalizeConv | function | 356 | no | function normalizeConv() { |
| c | const | 357 | no | const c = curConv(); if (!c) return; |
| ps | const | 358 | no | const ps = providers(); if (!ps.length) return; |
| p | variable | 359 | no | let p = ps.find(x =&gt; x.id === c.provider), dirty = false; |
| lv | const | 362 | no | const lv = (p.thinkingLevels \|\| []).find(l =&gt; l.id === c.effort); |
| newConv | function | 367 | no | function newConv() { |
| cur | const | 368 | no | const cur = curConv(); |
| ps | const | 370 | no | const ps = providers(); |
| same | const | 371 | no | const same = cur &amp;&amp; ps.some(p =&gt; p.id === cur.provider); |
| c | const | 372 | no | const c = { id: &#39;c-&#39; + hex16(), title: &#39;&#39;, provider: same ? cur.provider : ((ps[0] &amp;&amp; ps[0].id) \|\| &#39;chatgpt&#39;), |
| ensureActive | function | 376 | no | function ensureActive() { |
| latest | const | 378 | no | const latest = [...S.convs].sort((a, b) =&gt; b.updatedAt - a.updatedAt)[0]; |
| selectConv | function | 381 | no | function selectConv(id) { S.active = id; S.files = []; saveConvs(); closeDrawer(); renderAll(true); schedule(); } |
| deleteConv | function | 382 | no | function deleteConv(id) { |
| mergeServerConvs | function | 388 | no | function mergeServerConvs() { |
| dirty | variable | 389 | no | let dirty = false; |
| c | variable | 392 | no | let c = S.convs.find(x =&gt; x.id === m.conversationId); const t = tsOf(m) \|\| Date.now(); |
| tg | const | 394 | no | const tg = m.target \|\| {}; |
| renderTabs | function | 409 | no | function renderTabs() { |
| selected | const | 412 | no | const selected = b.dataset.tab === S.tab; |
| surfaceContext | function | 433 | no | function surfaceContext() { |
| goTab | function | 462 | no | function goTab(tab) { |
| wikiReadSequence | variable | 485 | no | let wikiReadSequence = 0; |
| wikiSourceSurface | variable | 486 | no | let wikiSourceSurface=null,wikiSourcePanel=null,wikiSourceList=null,wikiSourceExcerpt=null,wikiSourceSelection=null,wikiSourceEpoch=0,wikiSourceStatus=&#39;Source index not loaded&#39;; |
| clearWikiSources | function | 487 | no | function clearWikiSources(reason=&#39;Source index not loaded&#39;){ |
| ingestWikiSources | function | 491 | no | function ingestWikiSources(surface){ |
| readWikiSource | function | 498 | no | async function readWikiSource(card){ |
| epoch | const | 500 | no | const epoch=++wikiSourceEpoch;wikiSourceSelection=card; |
| response | const | 503 | no | const response=await fetch(exactSourceContextUrl(card),{credentials:&#39;same-origin&#39;,cache:&#39;no-store&#39;,signal:AbortSignal.timeout(15000)}); |
| data | const | 504 | no | const data=response.ok?await response.json():null; |
| renderWikiSources | function | 513 | no | function renderWikiSources(){ |
| cards | const | 521 | no | const cards=sourceCards(wikiSourceSurface); |
| clearWiki | function | 526 | no | function clearWiki(reason = &#39;Wiki unavailable&#39;) { |
| semanticRows | function | 532 | no | function semanticRows(context) { |
| graph | const | 533 | no | const graph = context.semantics; |
| nodes | const | 539 | no | const nodes = new Map(); |
| labels | const | 544 | no | const labels = { &#39;changed-section&#39;: &#39;changed&#39;, &#39;supersedes-change&#39;: &#39;supersedes&#39;, |
| priority | const | 549 | no | const priority = { &#39;confirmed-change&#39;: 0, &#39;changed-section&#39;: 1, &#39;supersedes-change&#39;: 2, |
| rows | const | 552 | no | const rows = []; |
| ids | const | 553 | no | const ids = new Set(); |
| renderSemanticKnowledge | function | 573 | no | function renderSemanticKnowledge(card, context) { |
| knowledge | const | 575 | no | const knowledge = semanticRows(context); |
| item | const | 580 | no | const item = el(&#39;div&#39;,&#39;ux-item&#39;); |
| renderWikiContext | function | 589 | no | function renderWikiContext() { |
| card | const | 590 | no | const card = el(&#39;section&#39;, &#39;ux-card&#39;); |
| context | const | 592 | no | const context = S.wikiContext; |
| row | const | 600 | no | const row = el(&#39;div&#39;, &#39;ux-item&#39;); |
| row | const | 609 | no | const row = el(&#39;div&#39;, &#39;ux-item&#39;); |
| effects | const | 617 | no | const effects = context.applicationEffects; |
| row | const | 624 | no | const row = el(&#39;div&#39;, &#39;ux-item&#39;); |
| activity | const | 637 | no | const activity=projectStudioActivity(context.studioOutcomes); |
| validAppliedEffects | function | 647 | no | function validAppliedEffects(effects) { |
| validWikiContext | function | 660 | no | function validWikiContext(context, wiki) { |
| validEntry | function | 661 | no | const validEntry = item =&gt; item?.source === &#39;host-product-journal&#39; &amp;&amp; typeof item.entryId === &#39;string&#39; &amp;&amp; |
| renderWiki | function | 678 | no | function renderWiki() { |
| host | const | 679 | no | const host = $(&#39;v-wiki&#39;); if (!host) return; |
| scroll | const | 680 | no | const scroll = el(&#39;div&#39;, &#39;ux-scroll&#39;); |
| head | const | 681 | no | const head = el(&#39;section&#39;, &#39;ux-card&#39;); |
| refresh | const | 684 | no | const refresh = el(&#39;button&#39;, &#39;btn sm&#39;, &#39;Refresh Wiki&#39;); |
| contextButton | const | 687 | no | const contextButton = el(&#39;button&#39;, &#39;btn sm&#39;, &#39;Source context&#39;); |
| pageCards | const | 699 | no | const pageCards=new Map(),captures=new Map(); |
| captureProjection | const | 700 | no | const captureProjection=readPersonalCaptures(S.wiki); |
| summary | const | 703 | no | const summary=el(&#39;section&#39;,&#39;ux-card&#39;);summary.append(el(&#39;h3&#39;,&#39;ux-card-title&#39;,&#39;Personal captures&#39;)); |
| counts | const | 704 | no | const counts=captureProjection.counts; |
| content | const | 708 | no | const content=S.wiki.pages[row.page].sections[row.section].replace(/\\s+/g,&#39; &#39;).slice(0,90); |
| open | const | 709 | no | const open=el(&#39;button&#39;,&#39;btn sm ux-secondary&#39;,(row.kind===&#39;task&#39;?row.status+&#39; task&#39;:&#39;Note&#39;)+&#39; · &#39;+content);open.type=&#39;button&#39;; |
| card | const | 715 | no | const card = el(&#39;section&#39;, &#39;ux-card&#39;); |
| capture | const | 717 | no | const capture=captures.get(name); |
| revision | const | 721 | no | const revision=S.wiki.revision,status=capture.status===&#39;Open&#39;?&#39;Done&#39;:&#39;Open&#39;; |
| action | const | 722 | no | const action=el(&#39;button&#39;,&#39;btn sm ux-secondary&#39;,status===&#39;Done&#39;?&#39;Review completion&#39;:&#39;Review reopen&#39;);action.type=&#39;button&#39;; |
| links | const | 727 | no | const links=Array.isArray(page.links)?page.links.filter(p=&gt;typeof p===&#39;string&#39;&amp;&amp;Object.hasOwn(S.wiki.pages,p)):[]; |
| button | const | 731 | no | const button=el(&#39;button&#39;,&#39;btn sm ux-secondary&#39;,target);button.type=&#39;button&#39;; |
| item | const | 737 | no | const item = el(&#39;div&#39;, &#39;ux-item&#39;); |
| changes | const | 746 | no | const changes = S.wiki.autoWiki; |
| card | const | 747 | no | const card = el(&#39;section&#39;, &#39;ux-card&#39;); |
| refreshWiki | function | 768 | no | async function refreshWiki() { |
| sequence | const | 770 | no | const sequence = ++wikiReadSequence; |
| session | const | 778 | no | const session = HOST_PREVIEW ? null : transport.deviceHeaders(); |
| owner | const | 783 | no | const owner = await fetch(&#39;/api/host/control/ui-state&#39;, { method: &#39;GET&#39;, credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39; }); |
| response | const | 788 | no | const response = await fetch(HOST_PREVIEW ? &#39;/api/host/control/wiki-view&#39; : &#39;/mobile/api/wiki&#39;, { method: &#39;GET&#39;, credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39;, headers: session \|\| {} }); |
| denied | const | 793 | no | const denied = await response.json().catch(() =&gt; ({})); |
| wiki | const | 800 | no | const wiki = await response.json(); |
| context | variable | 807 | no | let context = null, contextError = &#39;&#39;,sourceSurface=null; |
| privateRead | const | 810 | no | const privateRead = await fetch(&#39;/api/host/control/wiki-context&#39;, { method: &#39;GET&#39;, credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39; }); |
| data | const | 814 | no | const data = await privateRead.json(); |
| sourceResponse | const | 820 | no | const sourceResponse=await fetch(&#39;/api/file-surface?limit=16&#39;,{credentials:&#39;same-origin&#39;,cache:&#39;no-store&#39;,signal:AbortSignal.timeout(5000)}); |
| isInvalidDeviceSession | function | 842 | no | function isInvalidDeviceSession(code) { |
| clearPrivatePhoneState | function | 848 | no | function clearPrivatePhoneState() { |
| playerActive | variable | 877 | no | let playerActive = false; |
| priorMediaFocus | variable | 878 | no | let priorMediaFocus = null; |
| playerOpen | variable | 879 | no | let playerOpen = null; |
| playerEpoch | variable | 880 | no | let playerEpoch = 0; |
| deferredInstallPrompt | variable | 881 | no | let deferredInstallPrompt = null; |
| requestPwaInstall | function | 895 | no | async function requestPwaInstall() { |
| prompt | const | 897 | no | const prompt = deferredInstallPrompt; |
| choice | const | 903 | no | const choice = await prompt.userChoice; |
| stopMediaPlayer | function | 909 | no | function stopMediaPlayer() { |
| wasOpeningOrPlaying | const | 910 | no | const wasOpeningOrPlaying = playerActive; |
| current | const | 915 | no | const current = transport.deviceHeaders?.(); |
| sheet | const | 924 | no | const sheet = $(&#39;media-player-sheet&#39;); |
| video | const | 925 | no | const video = $(&#39;media-player-video&#39;); |
| restore | const | 932 | no | const restore = priorMediaFocus; |
| ensureMediaPlayer | function | 936 | no | function ensureMediaPlayer() { |
| sheet | const | 938 | no | const sheet = el(&#39;section&#39;, &#39;media-player-sheet&#39;); |
| header | const | 944 | no | const header = el(&#39;div&#39;, &#39;media-player-head&#39;); |
| title | const | 945 | no | const title = el(&#39;h2&#39;, &#39;&#39;, &#39;Your media&#39;); |
| close | const | 947 | no | const close = el(&#39;button&#39;, &#39;btn sm&#39;, &#39;Close&#39;); |
| video | const | 951 | no | const video = document.createElement(&#39;video&#39;); |
| state | const | 957 | no | const state = el(&#39;p&#39;, &#39;muted&#39;, &#39;&#39;); |
| openMediaPlayer | function | 967 | no | async function openMediaPlayer(mediaId, title) { |
| device | const | 970 | no | const device = transport.deviceHeaders?.(); |
| epoch | const | 973 | no | const epoch = ++playerEpoch; |
| controller | const | 974 | no | const controller = new AbortController(); |
| response | const | 977 | no | const response = await fetch(&#39;/mobile/api/media/open&#39;, { method: &#39;POST&#39;, credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39;, signal: controller.signal, headers: { ...device, origin: location.origin, &#39;x-vi… |
| payload | const | 984 | no | const payload = await response.json().catch(() =&gt; ({})); |
| mediaGeneration | variable | 1023 | no | let mediaGeneration = 0; |
| refreshMedia | function | 1024 | no | async function refreshMedia(force = false, offset = S.mediaOffset) { |
| headers | const | 1034 | no | const headers = transport.deviceHeaders?.(); |
| generation | const | 1040 | no | const generation = mediaGeneration; |
| response | const | 1045 | no | const response = await fetch(&#39;/mobile/api/media/library?offset=&#39; + offset, { credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39;, headers }); |
| result | const | 1048 | no | const result = await response.json(); |
| openVivimDraft | function | 1077 | no | function openVivimDraft(text) { |
| renderSurfaces | function | 1086 | no | function renderSurfaces() { |
| ctx | const | 1087 | no | const ctx = surfaceContext(); |
| host | variable | 1088 | no | let host = null, model = null; |
| sig | const | 1095 | no | const sig = S.tab + &#39;\|&#39; + JSON.stringify(model); |
| options | const | 1098 | no | const options = { onNavigate: goTab, |
| report | const | 1110 | no | const report = safeReadinessReport(surfaceContext().readiness); |
| renderList | function | 1131 | no | function renderList() { |
| items | const | 1137 | no | const items = S.convs.filter(c =&gt; N.target !== &#39;harness&#39; \|\| combinedInbox \|\| c.provider === curConv()?.provider).sort((a, b) =&gt; b.updatedAt - a.updatedAt); |
| sig | const | 1139 | no | const sig = S.active + &#39;\|&#39; + N.target + &#39;\|&#39; + combinedInbox + &#39;\|&#39; + |
| box | const | 1142 | no | const box = $(&#39;convlist&#39;); box.replaceChildren(); |
| row | const | 1144 | no | const row = el(&#39;div&#39;, &#39;conv&#39; + (c.id === S.active ? &#39; on&#39; : &#39;&#39;)); |
| b | const | 1145 | no | const b = el(&#39;button&#39;, &#39;pick&#39;); b.type = &#39;button&#39;; b.dataset.id = c.id; |
| d | const | 1147 | no | const d = el(&#39;button&#39;, &#39;del&#39;, &#39;×&#39;); d.type = &#39;button&#39;; d.dataset.del = c.id; d.setAttribute(&#39;aria-label&#39;, &#39;Remove conversation from this device&#39;); |
| fmtSize | function | 1152 | no | function fmtSize(n) { return n &lt; 1024 ? n + &#39; B&#39; : n &lt; 1048576 ? (n / 1024).toFixed(0) + &#39; KB&#39; : (n / 1048576).toFixed(1) + &#39; MB&#39;; } |
| renderComposer | function | 1153 | no | function renderComposer() { |
| c | const | 1180 | no | const c = curConv(), ps = providers(), p = c &amp;&amp; ps.find(x =&gt; x.id === c.provider); |
| sig | const | 1181 | no | const sig = JSON.stringify([ps, combinedInbox, c &amp;&amp; [c.id, c.provider, c.model, c.effort], S.files.map(f =&gt; f.name + f.size)]); |
| chips | const | 1185 | no | const chips = $(&#39;chips&#39;); chips.replaceChildren(); |
| combined | const | 1186 | no | const combined = el(&#39;button&#39;,&#39;chip&#39;,&#39;Combined&#39;); |
| models | const | 1196 | no | const models = (p &amp;&amp; p.models) \|\| [], cur = models.find(m =&gt; m.current); |
| ms | const | 1198 | no | const ms = $(&#39;model&#39;); ms.replaceChildren(new Option(&#39;Default&#39; + (cur ? &#39; (&#39; + (cur.label \|\| cur.id) + &#39;)&#39; : &#39;&#39;), &#39;&#39;), ...models.map(m =&gt; new Option(m.label \|\| m.id, m.id))); |
| lv | const | 1200 | no | const lv = (p &amp;&amp; p.thinkingLevels) \|\| []; |
| es | const | 1202 | no | const es = $(&#39;effort&#39;); es.replaceChildren(new Option(&#39;Thinking: default&#39;, &#39;&#39;), ...lv.map(l =&gt; { const o = new Option((l.label \|\| l.id) + (l.locked ? &#39; · locked&#39; : &#39;&#39;), l.id); o.disabled = !!l.locked… |
| fb | const | 1205 | no | const fb = $(&#39;files&#39;); fb.replaceChildren(); fb.hidden = !S.files.length; |
| updateSend | function | 1212 | no | function updateSend() { |
| autogrow | function | 1220 | no | function autogrow() { const t = $(&#39;text&#39;); t.style.height = &#39;auto&#39;; t.style.height = Math.min(t.scrollHeight, 160) + &#39;px&#39;; } |
| dots | function | 1221 | no | function dots(st) { const d = el(&#39;span&#39;, &#39;dots&#39;); d.setAttribute(&#39;role&#39;, &#39;status&#39;); d.setAttribute(&#39;aria-label&#39;, st === &#39;claimed&#39; ? &#39;Working&#39; : &#39;Queued&#39;); d.append(el(&#39;i&#39;), el(&#39;i&#39;), el(&#39;i&#39;)); return … |
| acknowledgedRenders | const | 1224 | no | const acknowledgedRenders=new Set(),pendingRenders=new Set(); |
| acknowledgeRenderedReply | function | 1225 | no | async function acknowledgeRenderedReply({commandId,messageId,conversationId,replyRevision}) { |
| key | const | 1227 | no | const key=commandId+&#39;:&#39;+replyRevision; |
| device | const | 1229 | no | const device=transport.deviceHeaders?.(); |
| response | const | 1233 | no | const response=await fetch(&#39;/mobile/api/live/ack&#39;,{ method:&#39;POST&#39;,credentials:&#39;same-origin&#39;,cache:&#39;no-store&#39;, headers:{...device,&#39;content-type&#39;:&#39;application/json&#39;,&#39;x-vivim-ack&#39;:&#39;1&#39;}, body:JSON.string… |
| renderMsgs | function | 1242 | no | function renderMsgs(force) { |
| box | const | 1255 | no | const box = $(&#39;msgs&#39;), c = curConv(), list = c ? msgsOf(c.id) : []; |
| timeline | const | 1257 | no | const timeline = S.statusObj?.snapshot?.live; |
| lifecycle | const | 1258 | no | const lifecycle = transport.direct &amp;&amp; timeline?.state !== &#39;unavailable&#39; |
| lifeByCommand | const | 1260 | no | const lifeByCommand = new Map((lifecycle?.messages \|\| []).map(m =&gt; [m.commandId, m])); |
| sig | const | 1261 | no | const sig = (c ? c.id : &#39;-&#39;) + &#39;\|&#39; + list.map(m =&gt; m.id + m.status + (m.result ? m.result.length : 0)).join(&#39;,&#39;) |
| state | const | 1269 | no | const state=lifeByCommand.get(m.id); |
| switched | const | 1284 | no | const switched = S.shownConv !== (c &amp;&amp; c.id); S.shownConv = c &amp;&amp; c.id; |
| near | const | 1285 | no | const near = box.scrollHeight - box.scrollTop - box.clientHeight &lt; 140; |
| frag | const | 1286 | no | const frag = document.createDocumentFragment(); |
| renderAcks | const | 1287 | no | const renderAcks=[]; |
| when | const | 1290 | no | const when = tsOf(m) ? new Date(tsOf(m)).toLocaleString() : &#39;&#39;; |
| u | const | 1291 | no | const u = el(&#39;div&#39;, &#39;m u&#39;); |
| ub | const | 1293 | no | const ub = el(&#39;div&#39;, &#39;bub&#39;, stripPrefix(m.text)); ub.title = when; u.append(ub); frag.append(u); |
| failed | const | 1294 | no | const failed = m.status === &#39;failed&#39;, pend = isPend(m); |
| res | variable | 1296 | no | let res = String(m.result \|\| &#39;&#39;), tag = null; const tm = TAG.exec(res); |
| a | const | 1298 | no | const a = el(&#39;div&#39;, &#39;m a&#39; + (failed ? &#39; err&#39; : &#39;&#39;)); a.append(el(&#39;div&#39;, &#39;badge&#39;, tag \|\| targetLabel(m))); |
| observed | const | 1299 | no | const observed = lifeByCommand.get(m.id); |
| b | const | 1303 | no | const b = el(&#39;div&#39;, &#39;bub&#39;); |
| renderDebug | function | 1322 | no | function renderDebug() { |
| s | const | 1324 | no | const s = S.statusObj; |
| box | const | 1326 | no | const box = $(&#39;dbglist&#39;); box.replaceChildren(); |
| d | const | 1328 | no | const d = el(&#39;div&#39;, &#39;dcard&#39;); d.append((c.status \|\| &#39;&#39;) + &#39; · &#39; + (c.kind \|\| c.mode \|\| &#39;cmd&#39;) + &#39; → &#39; + (c.consumer \|\| &#39;&#39;) + &#39; · &#39; + (tsOf(c) ? new Date(tsOf(c)).toLocaleString() : &#39;&#39;)); |
| renderAll | function | 1332 | no | function renderAll(force) { renderTabs(); renderList(); renderComposer(); renderMsgs(force); renderDebug(); renderSurfaces(); } |
| closeDrawer | function | 1335 | no | function closeDrawer() { $(&#39;drawer&#39;).classList.remove(&#39;open&#39;); $(&#39;scrim&#39;).hidden = true; } |
| openDebug | function | 1336 | no | function openDebug() { $(&#39;dbg&#39;).hidden = false; $(&#39;connection-resolved&#39;).hidden = !transport.pending(); renderDebug(); } |
| closeDebug | function | 1337 | no | function closeDebug() { $(&#39;dbg&#39;).hidden = true; } |
| installHostMenu | function | 1341 | no | function installHostMenu() { |
| section | const | 1342 | no | const section = el(&#39;section&#39;, &#39;host-preview-menu&#39;); |
| heading | const | 1346 | no | const heading = el(&#39;h2&#39;, &#39;&#39;, &#39;Your VIVIM Host&#39;); |
| description | const | 1347 | no | const description = el(&#39;p&#39;, &#39;muted&#39;, &#39;The phone app is your starting point. Administrative tools open only when you choose them.&#39;); |
| items | const | 1348 | no | const items = el(&#39;nav&#39;, &#39;host-preview-links&#39;); |
| anchor | const | 1355 | no | const anchor = el(&#39;a&#39;, &#39;&#39;, label); |
| personalize | const | 1360 | no | const personalize = el(&#39;button&#39;, &#39;&#39;, &#39;Appearance&#39;); |
| close | const | 1367 | no | const close = el(&#39;button&#39;, &#39;btn sm&#39;, &#39;Close menu&#39;); |
| toggleHostMenu | function | 1376 | no | function toggleHostMenu() { |
| menu | const | 1377 | no | const menu = $(&#39;host-preview-menu&#39;); |
| previewReadSequence | variable | 1382 | no | let previewReadSequence = 0; |
| renderHostPreviewActivity | function | 1383 | no | function renderHostPreviewActivity() { |
| section | variable | 1384 | no | let section = $(&#39;host-preview-activity&#39;); |
| recent | const | 1390 | no | const recent = S.statusObj?.snapshot?.control?.recent; |
| list | const | 1396 | no | const list = el(&#39;ul&#39;, &#39;ux-list&#39;); |
| item | const | 1398 | no | const item = el(&#39;li&#39;, &#39;ux-item&#39;); |
| refreshHostPreview | function | 1406 | no | async function refreshHostPreview() { |
| sequence | const | 1408 | no | const sequence = ++previewReadSequence; |
| response | const | 1410 | no | const response = await fetch(&#39;/api/host/control/pwa-view&#39;, { method: &#39;GET&#39;, credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39; }); |
| data | const | 1414 | no | const data = await response.json(); |
| startHostPreview | function | 1444 | no | async function startHostPreview() { |
| fragment | const | 1447 | no | const fragment = location.hash; |
| renderNative | function | 1478 | no | function renderNative() { |
| box | const | 1483 | no | const box = $(&#39;msgs&#39;), session = N.sessions.find(s =&gt; s.id === N.session); |
| near | const | 1486 | no | const near = box.scrollHeight - box.scrollTop - box.clientHeight &lt; 140; |
| frag | const | 1487 | no | const frag = document.createDocumentFragment(); |
| row | const | 1491 | no | const row = el(&#39;div&#39;, &#39;m &#39; + (m.type === &#39;user&#39; ? &#39;u&#39; : &#39;a&#39;)); |
| bubble | const | 1493 | no | const bubble = el(&#39;div&#39;, &#39;bub&#39;, String(m.text \|\| &#39;&#39;)); bubble.style.whiteSpace = &#39;pre-wrap&#39;; row.append(bubble); frag.append(row); |
| row | const | 1496 | no | const row = el(&#39;div&#39;, &#39;m u&#39;); row.append(el(&#39;div&#39;, &#39;badge&#39;, N.pending.accepted ? &#39;Queued · awaiting transcript&#39; : &#39;Send uncertain · not resent&#39;)); |
| bubble | const | 1497 | no | const bubble = el(&#39;div&#39;, &#39;bub&#39;, N.pending.text); row.append(bubble); frag.append(row); |
| nativeSessions | function | 1501 | no | async function nativeSessions() { |
| result | const | 1504 | no | const result = await api(&#39;sessions&#39;); |
| nativeRefresh | function | 1513 | no | async function nativeRefresh() { |
| session | const | 1516 | no | const session = N.session, generation = N.generation; |
| result | const | 1518 | no | const result = await api(&#39;sessions/&#39; + encodeURIComponent(session) + &#39;/messages&#39;); |
| index | const | 1522 | no | const index = N.messages.findIndex(m =&gt; m.id === N.pending.id &amp;&amp; m.type === &#39;user&#39;); |
| reply | const | 1524 | no | const reply = N.messages.slice(index + 1).find(m =&gt; m.type === &#39;assistant&#39;); |
| nativeSend | function | 1536 | no | async function nativeSend() { |
| text | const | 1537 | no | const text = $(&#39;text&#39;).value.trim(), session = N.session; |
| item | const | 1539 | no | const item = { id: &#39;msg_&#39; + hex16() + hex16(), text, session, accepted: false }; |
| result | const | 1542 | no | const result = await api(&#39;sessions/&#39; + encodeURIComponent(session) + &#39;/prompt&#39;, { method: &#39;POST&#39;, body: JSON.stringify({ id: item.id, text }) }); |
| send | function | 1554 | no | async function send() { |
| field | const | 1565 | no | const field = $(&#39;text&#39;), body = field.value.trim(); |
| c | const | 1575 | no | const c = curConv(), ta = $(&#39;text&#39;), body = ta.value.trim(); if (!c \|\| !body) return; |
| p | const | 1576 | no | const p = providers().find(x =&gt; x.id === c.provider); if (!p) { toast(&#39;Pick a signed-in provider&#39;); return; } |
| prefix | const | 1577 | no | const prefix = mkPrefix(c); |
| first | const | 1579 | no | const first = !c.sent &amp;&amp; !msgsOf(c.id).length; |
| payload | const | 1580 | no | const payload = { text: prefix + body, kind: &#39;command&#39;, consumer: &#39;harness&#39;, mode: &#39;relay-chat&#39;, conversationId: c.id, |
| schedule | function | 1595 | no | function schedule() { |
| refresh | function | 1610 | no | async function refresh() { |
| needStatus | const | 1614 | no | const needStatus = !S.statusAt \|\| Date.now() - S.statusAt &gt; 7500; |
| refreshBuildInspector | function | 1642 | no | function refreshBuildInspector(rows){ |
| bar | const | 1643 | no | const bar=$(&#39;build-inspector&#39;),select=$(&#39;build-inspect-select&#39;);if(!bar\|\|!select)return; |
| updateBuildSelection | function | 1649 | no | function updateBuildSelection(row){ |
| mountBuild | function | 1656 | no | function mountBuild() { |
| host | const | 1658 | no | const host = $(&#39;build-surface&#39;); if (!host) return; |
| toggle | const | 1666 | no | const toggle=$(&#39;build-inspect-toggle&#39;),select=$(&#39;build-inspect-select&#39;),configure=$(&#39;build-inspect-configure&#39;); |
| compose | variable | 1681 | no | let compose = null; |
| mountCompose | function | 1682 | no | function mountCompose() { |
| host | const | 1684 | no | const host = $(&#39;build-compose&#39;); if (!host) return; |
| conversationId | const | 1700 | no | const conversationId = &#39;c-&#39; + hex16(); |
| created | const | 1702 | no | const created = await api(&#39;commands&#39;, { method: &#39;POST&#39;, body: JSON.stringify({ text: prompt, kind: &#39;command&#39;, consumer: &#39;harness&#39;, mode: &#39;relay-chat&#39;, conversationId, newChat: true, target: { provide… |
| canCapture | function | 1716 | no | const canCapture=()=&gt;!HOST_PREVIEW&amp;&amp;S.paired&amp;&amp;transport.direct&amp;&amp;navigator.onLine!==false&amp;&amp;!!transport.deviceHeaders?.()&amp;&amp;S.device.scopes?.includes(&#39;control:execute&#39;)===true&amp;&amp;!vivimChat.busy(); |
| launcherContext | function | 1731 | no | function launcherContext() { |
| launcherActivate | function | 1747 | no | function launcherActivate(item) { |
| target | const | 1752 | no | const target = item.id === &#39;ai&#39; ? &#39;harness&#39; |
| scheduleBuild | function | 1770 | no | function scheduleBuild(delay = 6000) { |
| refreshBuildBindings | function | 1775 | no | async function refreshBuildBindings(snapshot){ |
| surface | const | 1776 | no | const surface=build?.surface();if(S.tab!==&#39;build&#39;\|\|!surface\|\|!hasWorkspaceBinding(surface))return; |
| seq | const | 1777 | no | const seq=++buildBindingSequence,revision=surface.revision; |
| headers | const | 1778 | no | const headers=HOST_PREVIEW?{}:transport.deviceHeaders?.(); |
| authorized | function | 1779 | no | const authorized=()=&gt;HOST_PREVIEW?!!S.statusObj:transport.direct&amp;&amp;S.paired&amp;&amp;navigator.onLine!==false&amp;&amp; |
| outcomes | const | 1783 | no | const outcomes=HOST_PREVIEW?snapshot?.studioOutcomes: |
| wiki | variable | 1785 | no | let wiki=null; |
| response | const | 1788 | no | const response=await fetch(HOST_PREVIEW?&#39;/api/host/control/wiki-view&#39;:&#39;/mobile/api/wiki&#39;, {credentials:&#39;same-origin&#39;,cache:&#39;no-store&#39;,headers,signal:AbortSignal.timeout(4000)}); |
| pollBuild | function | 1803 | no | async function pollBuild() { |
| st | const | 1807 | no | const st = await api(&#39;status&#39;); |
| rev | const | 1809 | no | const rev = st &amp;&amp; st.snapshot &amp;&amp; st.snapshot.bootstrap ? st.snapshot.bootstrap.uiRevision : null; |
| observed | const | 1812 | no | const observed = build.setSurface(rev, st?.snapshot?.bootstrap); |
| showBrowserPairHelp | function | 1826 | no | function showBrowserPairHelp(problem) { |
| existing | const | 1829 | no | const existing = document.getElementById(&#39;vivim-device-handoff&#39;); |
| panel | const | 1831 | no | const panel = el(&#39;section&#39;, &#39;pair-handoff&#39;); |
| title | const | 1835 | no | const title = el(&#39;h2&#39;, &#39;&#39;, &#39;Pair directly in your browser&#39;); |
| detail | const | 1836 | no | const detail = el(&#39;p&#39;, &#39;muted&#39;, &#39;VIVIM needs private HTTPS, browser cryptography and site storage. &#39; + &#39;Use Chrome with the trusted PC address and allow site storage. No pairing code has been consume… |
| reason | const | 1839 | no | const reason = el(&#39;p&#39;, &#39;muted&#39;, &#39;Browser check: &#39; + String(problem?.code \|\| problem?.message \|\| &#39;unavailable&#39;).slice(0, 100)); |
| retry | const | 1841 | no | const retry = el(&#39;button&#39;, &#39;btn pri&#39;, &#39;Try browser pairing again&#39;); |
| showPairingState | function | 1848 | no | function showPairingState(status, message = &#39;&#39;) { |
| titles | const | 1851 | no | const titles = { |
| showOfflineShell | function | 1878 | no | function showOfflineShell() { |
| start | function | 1893 | no | async function start() { |
| attempt | const | 1898 | no | const attempt=runStart(); |
| runStart | function | 1902 | no | async function runStart() { |
| fragment | const | 1906 | no | const fragment = parsePairFragment(location.hash); |
| signer | variable | 1912 | no | let signer; |
| challenge | const | 1925 | no | const challenge = await redeemDevicePairToken(fragment.token, { direct: transport.direct, fetchImpl: fetch }); |
| device | const | 1940 | no | const device = await resumeDeviceSession(transport); |
| paired | variable | 1966 | no | let paired; try { ({ paired } = await api(&#39;session&#39;)); } catch (e) { |
| keys | const | 1984 | no | const keys = [&#39;ArrowRight&#39;, &#39;ArrowLeft&#39;, &#39;Home&#39;, &#39;End&#39;]; |
| all | const | 1986 | no | const all = Array.from($(&#39;tabs&#39;).querySelectorAll(&#39;[role=&quot;tab&quot;]&#39;)); |
| active | const | 1987 | no | const active = all.indexOf(document.activeElement); |
| next | const | 1990 | no | const next = event.key === &#39;Home&#39; ? 0 : event.key === &#39;End&#39; ? all.length - 1 |
| native | const | 2000 | no | const native = N.target === &#39;phone&#39;, controller = N.target === &#39;vivim&#39;; |
| d | const | 2041 | no | const d = e.target.closest(&#39;[data-del]&#39;); if (d) return deleteConv(d.dataset.del); |
| b | const | 2042 | no | const b = e.target.closest(&#39;[data-id]&#39;); if (b) selectConv(b.dataset.id); |
| b | const | 2048 | no | const b=e.target.closest(&#39;[data-p]&#39;),c=curConv(); |
| changed | const | 2050 | no | const changed=c.provider!==b.dataset.p; |
| headers | const | 2074 | no | const headers=transport.deviceHeaders?.(); |
| response | const | 2079 | no | const response=await fetch(&#39;/mobile/api/chat/providers/refresh&#39;,{ method:&#39;POST&#39;,cache:&#39;no-store&#39;,credentials:&#39;same-origin&#39;, headers:{...headers,origin:location.origin,&#39;x-vivim-providers&#39;:&#39;1&#39;} }); |
| result | const | 2083 | no | const result=await response.json(); |
| count | const | 2096 | no | const count=result.providers.filter(p=&gt;p.signedIn===true).length; |
| typing | const | 2132 | no | const typing = [&#39;INPUT&#39;,&#39;TEXTAREA&#39;,&#39;SELECT&#39;].includes(document.activeElement?.tagName) \|\| |
| text | const | 2147 | no | const text = $(&#39;dbgtext&#39;).value.trim(); if (!text) return; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./transport.mjs | import | 2 | [apps/mobile-relay/transport.mjs](./transport.mjs.md) |
| ./generative-ui/phone-surface.mjs | import | 3 | [apps/mobile-relay/generative-ui/phone-surface.mjs](./generative-ui/phone-surface.mjs.md) |
| ./build-canvas.mjs | import | 4 | [apps/mobile-relay/build-canvas.mjs](./build-canvas.mjs.md) |
| ./control-client.mjs | import | 5 | [apps/mobile-relay/control-client.mjs](./control-client.mjs.md) |
| ./generative-ui/workspace-live-data.mjs | import | 6 | [apps/mobile-relay/generative-ui/workspace-live-data.mjs](./generative-ui/workspace-live-data.mjs.md) |
| ./build-composer.mjs | import | 7 | [apps/mobile-relay/build-composer.mjs](./build-composer.mjs.md) |
| ./welcome.mjs | import | 8 | [apps/mobile-relay/welcome.mjs](./welcome.mjs.md) |
| ./pairing-link.mjs | import | 9 | [apps/mobile-relay/pairing-link.mjs](./pairing-link.mjs.md) |
| ./device-enrollment.mjs | import | 10 | [apps/mobile-relay/device-enrollment.mjs](./device-enrollment.mjs.md) |
| ./ux/model.mjs | import | 11 | [apps/mobile-relay/ux/model.mjs](./ux/model.mjs.md) |
| ./ux/render.mjs | import | 12 | [apps/mobile-relay/ux/render.mjs](./ux/render.mjs.md) |
| ./control-chat.mjs | import | 13 | [apps/mobile-relay/control-chat.mjs](./control-chat.mjs.md) |
| ./composer-assist.mjs | import | 14 | [apps/mobile-relay/composer-assist.mjs](./composer-assist.mjs.md) |
| ./wiki-source-view.mjs | import | 15 | [apps/mobile-relay/wiki-source-view.mjs](./wiki-source-view.mjs.md) |
| ./ux/readiness.mjs | import | 16 | [apps/mobile-relay/ux/readiness.mjs](./ux/readiness.mjs.md) |
| ./ux/launcher-ui.mjs | import | 17 | [apps/mobile-relay/ux/launcher-ui.mjs](./ux/launcher-ui.mjs.md) |
| ./ux/shell-inspection.mjs | import | 18 | [apps/mobile-relay/ux/shell-inspection.mjs](./ux/shell-inspection.mjs.md) |
| ./ux/shell-presentation.mjs | import | 19 | [apps/mobile-relay/ux/shell-presentation.mjs](./ux/shell-presentation.mjs.md) |
| ./ux/local-notes-ui.mjs | import | 20 | [apps/mobile-relay/ux/local-notes-ui.mjs](./ux/local-notes-ui.mjs.md) |
| ./ux/voice-capture.mjs | import | 21 | [apps/mobile-relay/ux/voice-capture.mjs](./ux/voice-capture.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

````javascript
// grokbot-authored. Relay PWA shell: same-origin only, no secrets stored in JS-readable storage.
import { transport } from './transport.mjs';
import { mountBuildSurface } from './generative-ui/phone-surface.mjs';
import { mountBuildCanvas } from './build-canvas.mjs';
import { createControlClient } from './control-client.mjs';
import {workspaceBindingData,hasWorkspaceBinding,projectStudioActivity,readPersonalCaptures} from './generative-ui/workspace-live-data.mjs';
import { resolveBuildRequest, buildSurfaceFromBootstrap, themeDraftCandidates, templateDraftCandidates } from './build-composer.mjs';
import { mountWelcome } from './welcome.mjs';
import { parsePairFragment, redeemDevicePairToken } from './pairing-link.mjs';
import { prepareDeviceSigner, enrollWithChallenge, resumeDeviceSession } from './device-enrollment.mjs';
import { worldModel, meModel, todayModel, LIVE_STATE_LABELS, TABS } from './ux/model.mjs';
import { renderToday, renderWorld, renderMe } from './ux/render.mjs';
import { createControlChat } from './control-chat.mjs';
import { mountComposerAssist } from './composer-assist.mjs';
import { sourceCards, sameSourceCard, matchesSourceContext, exactSourceContextUrl, reconcileSourceCards } from './wiki-source-view.mjs';
import { deriveReadiness, safeReadinessReport } from './ux/readiness.mjs';
import { mountCapabilityLauncher } from './ux/launcher-ui.mjs';
import { inspectShell, selectShell } from './ux/shell-inspection.mjs';
import { createShellPresentation } from './ux/shell-presentation.mjs';
import { mountLocalNotes } from './ux/local-notes-ui.mjs';
import { mountVoiceCapture } from './ux/voice-capture.mjs';
const $ = id => document.getElementById(id);
const api = transport.request;
const shellPresentation=createShellPresentation(document.body);
// Only the loopback Host wrapper may display a read-only, unpaired desktop
// preview. An HTTPS phone, cloud relay or arbitrary public origin never can.
const HOST_PREVIEW = new URLSearchParams(location.search).get('host-preview') === '1'
  && ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
  && location.pathname.startsWith('/mobile/');
// This action exists only inside the signed VIVIM Android shell. The online surface
// remains the single Host-operated phone; Pocket holds local raw evidence only.
const pocketButton = document.getElementById('pocket-native');
if (pocketButton && (navigator.userAgent || '').includes('VIVIM/1.0.0')) {
  pocketButton.hidden = false;
  pocketButton.addEventListener('click', () => {
    window.location.href = 'vivim://pocket';
  });
}
// This entry point exists only for Direct Host; never advertise it on the Cloud PWA.
if (!transport.direct) document.getElementById('grokbot-direct-link')?.setAttribute('hidden', '');
async function pair(secret) { await api('pair', { method: 'POST', body: JSON.stringify({ secret }) }); }

/* ---------- helpers ---------- */
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const hex16 = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, '0')).join('');
const tsOf = c => Date.parse(c.createdAt) || Number(c.createdAt) || 0;
const MAXTEXT = 4000;

/* ---------- tiny safe markdown (escape first) ---------- */
function inline(t) {
  const st = []; const keep = h => '\u0001' + (st.push(h) - 1) + '\u0001';
  const emph = x => x.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\s][^*\n]*?)\*(?![*\w])/g, '$1<em>$2</em>')
    .replace(/(^|[^_\w])_([^_\s][^_\n]*?)_(?![_\w])/g, '$1<em>$2</em>');
  t = t.replace(/`([^`\n]+)`/g, (m, c) => keep('<code>' + c + '</code>'));
  t = t.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, (m, l, u) => keep('<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + emph(l) + '</a>'));
  t = t.replace(/(^|[\s(])(https?:\/\/[^\s]*[^\s.,;:!?)])/g, (m, p, u) => p + keep('<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + u + '</a>'));
  t = emph(t);
  for (let i = 0; i < 3; i++) t = t.replace(/\u0001(\d+)\u0001/g, (m, k) => st[+k]);
  return t;
}
function md(src) {
  const fences = [];
  const s = esc(src).replace(/```([\w+-]*)[ \t]*\n([\s\S]*?)(?:```|$)/g, (m, l, c) => {
    fences.push('<pre><code>' + c.replace(/\n$/, '') + '</code></pre>'); return '\n\u0000' + (fences.length - 1) + '\u0000\n'; });
  const out = []; let para = [], list = null;
  const fp = () => { if (para.length) { out.push('<p>' + para.join('<br>') + '</p>'); para = []; } };
  const fl = () => { if (list) { out.push('<' + list.t + '>' + list.i.map(x => '<li>' + x + '</li>').join('') + '</' + list.t + '>'); list = null; } };
  for (const line of s.split('\n')) {
    let m;
    if ((m = /^\u0000(\d+)\u0000$/.exec(line))) { fp(); fl(); out.push(fences[+m[1]]); }
    else if ((m = /^\s{0,3}(#{1,4})\s+(.+?)\s*#*\s*$/.exec(line))) { fp(); fl(); const n = m[1].length + 2; out.push('<h' + n + '>' + inline(m[2]) + '</h' + n + '>'); }
    else if ((m = /^\s*(?:([-*+])|(\d+)[.)])\s+(.*)$/.exec(line))) { fp(); const t = m[1] ? 'ul' : 'ol'; if (list && list.t !== t) fl(); (list = list || { t, i: [] }).i.push(inline(m[3])); }
    else if (!line.trim()) { fp(); fl(); }
    else { fl(); para.push(inline(line.trim())); }
  }
  fp(); fl(); return out.join('');
````

_First 80 of 2187 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

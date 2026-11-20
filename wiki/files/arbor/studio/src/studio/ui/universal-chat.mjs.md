# File: studio/src/studio/ui/universal-chat.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/ui/universal-chat.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 24575 B |
| Lines | 290 |
| Hash | 7ad6ba6759d4 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| U1_SCHEMA | const | 2 | yes | export const U1_SCHEMA = &#39;aion.ui.universal-chat/1&#39;; |
| STATES | const | 3 | no | const STATES = new Set([&#39;supported&#39;,&#39;unavailable&#39;,&#39;unverified&#39;]); |
| KNOWN | const | 4 | no | const KNOWN = new Set([&#39;text&#39;,&#39;markdown&#39;,&#39;code&#39;,&#39;table&#39;,&#39;citation&#39;,&#39;citations&#39;,&#39;artifact&#39;,&#39;progress&#39;,&#39;tool-activity-observed&#39;,&#39;image&#39;,&#39;file&#39;,&#39;reference&#39;,&#39;visible-thinking-summary&#39;,&#39;error&#39;]); |
| asArray | function | 5 | no | const asArray = x =&gt; Array.isArray(x) ? x : []; |
| val | function | 6 | no | const val = x =&gt; typeof x === &#39;string&#39; ? x : &#39;&#39;; |
| obj | function | 7 | no | const obj = x =&gt; x &amp;&amp; typeof x === &#39;object&#39; &amp;&amp; !Array.isArray(x) ? x : {}; |
| id | function | 8 | no | const id = x =&gt; typeof x === &#39;string&#39; &amp;&amp; x.length &gt; 0 ? x : null; |
| safeUrl | function | 9 | no | const safeUrl = x =&gt; { try { const u = new URL(x); return /^https?:$/.test(u.protocol) ? u.href : null; } catch { return null; } }; |
| textValue | function | 10 | no | const textValue = x =&gt; String(x ?? &#39;&#39;); |
| projectWorkspace | function | 13 | yes | export function projectWorkspace(snapshot = {}, { openTabs = [], accountChats = [] } = {}) { |
| snap | const | 14 | no | const snap = obj(snapshot), binding = obj(snap.binding), ident = obj(snap.identity); |
| state | const | 15 | no | const state = [&#39;bound&#39;,&#39;unbound&#39;,&#39;unverified&#39;].includes(ident.state) ? ident.state : &#39;unverified&#39;; |
| nativeThread | const | 16 | no | const nativeThread = id(ident.threadKey) \|\| id(binding.thread?.key) \|\| id(binding.threadKey) \|\| null; |
| bindingThread | const | 17 | no | const bindingThread = id(binding.thread?.key) \|\| id(binding.threadKey); |
| exact | const | 18 | no | const exact = state === &#39;bound&#39; &amp;&amp; !!nativeThread &amp;&amp; !!id(snap.id) &amp;&amp; (!bindingThread \|\| bindingThread === nativeThread); |
| provider | const | 19 | no | const provider = id(snap.site?.id) \|\| id(snap.site) \|\| id(snap.provider) \|\| &#39;unknown&#39;; |
| accountState | const | 20 | no | const accountState = [&#39;signed-in&#39;,&#39;signed-out&#39;,&#39;unknown&#39;].includes(snap.account?.state) ? snap.account.state : &#39;unknown&#39;; |
| projectRail | function | 30 | yes | export function projectRail(providers = [], tasks = []) { |
| projectObservedPageRead | function | 47 | yes | export function projectObservedPageRead(snapshot = {}, pageRead = null) { |
| snap | const | 48 | no | const snap = obj(snapshot), read = obj(pageRead), view = obj(read.view); |
| unavailable | function | 49 | no | const unavailable = reason =&gt; ({ state: &#39;unavailable&#39;, reason, messages: [], coverage: [], grounded: false, nativeIds: false, accepted: false }); |
| thread | function | 52 | no | const thread = binding =&gt; { |
| b | const | 53 | no | const b = obj(binding), t = b.thread; |
| messages | const | 60 | no | const messages = []; |
| chars | variable | 61 | no | let chars = 0; |
| text | const | 64 | no | const text = m.text.slice(0, Math.max(0, 200000 - chars)); |
| projectCapability | function | 79 | yes | export function projectCapability(x = {}) { |
| c | const | 80 | no | const c = obj(x); const state = v =&gt; STATES.has(v) ? v : &#39;unverified&#39;; |
| evidenceRef | function | 84 | yes | export function evidenceRef(x) { |
| e | const | 85 | no | const e = obj(x); |
| sid | const | 86 | no | const sid = id(e.sid) \|\| id(e.sessionId) \|\| id(e.captureRef); |
| seq | const | 87 | no | const seq = Number.isSafeInteger(e.sequence) &amp;&amp; e.sequence &gt;= 0 ? e.sequence : Number.isSafeInteger(e.seq) &amp;&amp; e.seq &gt;= 0 ? e.seq : null; |
| verified | const | 88 | no | const verified = e.grounded === true &amp;&amp; !!sid &amp;&amp; seq !== null; |
| projectOutcome | function | 93 | yes | export function projectOutcome(x = {}) { |
| a | const | 94 | no | const a = obj(x); |
| recoveryView | function | 101 | yes | export function recoveryView(x = {}) { |
| r | const | 102 | no | const r = obj(x); |
| unknown | const | 103 | no | const unknown = [&#39;uncertain&#39;,&#39;in_flight&#39;,&#39;needs-reconciliation&#39;].includes(r.effectState) \|\| r.sendState === &#39;uncertain&#39; \|\| r.uncertainty === true; |
| projectAdapter | function | 110 | yes | export function projectAdapter(x = {}) { |
| a | const | 111 | no | const a = obj(x), version = id(a.version), baseline = id(a.seedVersion), training = asArray(a.trainingSessionIds), heldout = asArray(a.heldoutSessionIds); |
| independent | const | 112 | no | const independent = heldout.length &gt; 0 &amp;&amp; training.length &gt; 0 &amp;&amp; heldout.every(s =&gt; !training.includes(s)) &amp;&amp; a.trainingComplete === true; |
| source | const | 113 | no | const source = a.source === &#39;learned&#39; ? &#39;learned&#39; : a.source === &#39;seed&#39; ? &#39;seed&#39; : &#39;unknown&#39;; |
| stage | const | 114 | no | const stage = [&#39;discovered&#39;,&#39;shadow&#39;,&#39;read-only-active&#39;,&#39;rejected&#39;,&#39;rolled-back&#39;,&#39;unverified&#39;].includes(a.stage) ? a.stage : &#39;unverified&#39;; |
| effectEligible | const | 115 | no | const effectEligible = false; // This read model is never an effect grant, including when a server reports a seed or learned adapter. |
| keyOf | function | 124 | no | function keyOf(turn, block) { return `${turn}\\u0000${block}`; } |
| createConversationStore | function | 126 | yes | export function createConversationStore({ maxRevisions = 20 } = {}) { |
| turns | const | 127 | no | const turns = new Map(); let changes = 0; |
| asKey | function | 128 | no | const asKey = (e) =&gt; ({ turn: id(e.turnId), block: id(e.blockId), event: id(e.eventId), sequence: e.sequence }); |
| accept | function | 129 | no | function accept(event) { |
| e | const | 130 | no | const e = obj(event), k = asKey(e); |
| kind | const | 132 | no | const kind = id(e.kind) \|\| &#39;unknown&#39;; |
| t | variable | 134 | no | let t = turns.get(k.turn); |
| b | variable | 137 | no | let b = t.blocks.get(k.block); |
| getTurn | function | 166 | no | function getTurn(turnId) { |
| t | const | 167 | no | const t=turns.get(turnId); |
| appendText | function | 173 | no | const appendText = (document, parent, tag, content, className) =&gt; { const el=document.createElement(tag); if(className) el.className=className; el.textContent=textValue(content); parent.appendChild(e… |
| renderLink | function | 174 | no | const renderLink = (document,parent, ref) =&gt; { |
| u | const | 175 | no | const u=safeUrl(ref?.url), el=document.createElement(u?&#39;a&#39;:&#39;span&#39;); |
| renderNativeBlock | function | 180 | yes | export function renderNativeBlock(document, parent, block) { |
| b | const | 181 | no | const b=obj(block), p=obj(b.payload), kind=val(b.kind); |
| wrap | const | 182 | no | const wrap=document.createElement(&#39;section&#39;); wrap.className=&#39;aion-u1-block&#39;; wrap.dataset.kind=kind\|\|&#39;unknown&#39;; |
| source | const | 184 | no | const source=evidenceRef(b.evidence); |
| table | const | 189 | no | const table=document.createElement(&#39;table&#39;), thead=document.createElement(&#39;thead&#39;), tr=document.createElement(&#39;tr&#39;); |
| tbody | const | 191 | no | const tbody=document.createElement(&#39;tbody&#39;);asArray(p.rows).forEach(row=&gt;{const r=document.createElement(&#39;tr&#39;);asArray(row).forEach(c=&gt;appendText(document,r,&#39;td&#39;,c));tbody.appendChild(r);});table.app… |
| mountUniversalChat | function | 213 | yes | export function mountUniversalChat({ document, root, onInspect = () =&gt; {}, onEvidence = () =&gt; {}, onReviewAdapter = () =&gt; {} }) { |
| store | variable | 215 | no | let store=createConversationStore(), shown=false, lastScope=null; |
| ui | const | 216 | no | const ui=document.createElement(&#39;section&#39;);ui.className=&#39;aion-u1&#39;;ui.setAttribute(&#39;aria-label&#39;,&#39;Universal webapp intelligence&#39;); |
| cache | const | 218 | no | const cache=new Map(); |
| show | function | 219 | no | function show({ snapshot={},openTabs=[],accountChats=[],providers=[],tasks=[],adapters=[],capabilities=[],events=[],turnIds=[],outcome={},pageRead=null }={}) { |
| scope | const | 220 | no | const scope=JSON.stringify([id(snapshot?.id), id(snapshot?.binding?.targetId)\|\|id(snapshot?.binding?.tabId), id(snapshot?.binding?.thread?.ref)\|\|id(snapshot?.binding?.thread?.key)\|\|id(snapshot?.bindi… |
| ws | const | 227 | no | const ws=projectWorkspace(snapshot,{openTabs,accountChats}); |
| observedRead | const | 232 | no | const observedRead = projectObservedPageRead(snapshot, pageRead); |
| panel | const | 234 | no | const panel=document.createElement(&#39;section&#39;);panel.setAttribute(&#39;aria-label&#39;,&#39;Observed page transcript (not native evidence)&#39;); |
| item | const | 240 | no | const item=document.createElement(&#39;article&#39;); |
| rail | const | 248 | no | const rail=projectRail(providers,tasks); |
| v | const | 263 | no | const v=projectAdapter(a);const box=document.createElement(&#39;details&#39;); |
| rec | const | 273 | no | const rec=recoveryView({effectState:snapshot?.effectState,sendState:snapshot?.turn?.send?.state,uncertainty:snapshot?.diagnostic?.uncertainty != null}); |
| inspect | const | 275 | no | const inspect=document.createElement(&#39;button&#39;);inspect.type=&#39;button&#39;;inspect.textContent=&#39;Inspect original (read-only)&#39;;inspect.addEventListener(&#39;click&#39;,()=&gt;onInspect({conversationId:ws.conversationI… |
| o | const | 276 | no | const o=projectOutcome(outcome);appendText(document,ui,&#39;p&#39;,`Send ${o.send}; reply ${o.reply}; network ended ${o.networkEnded}; page stable ${o.pageStable}; fresh reply ${o.freshReply}; capture final … |
| t | const | 278 | no | const t=store.getTurn(tid);if(!t)continue; |
| article | const | 279 | no | const article=document.createElement(&#39;article&#39;);article.dataset.turnId=tid;appendText(document,article,&#39;h4&#39;,`Turn ${tid}`); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/ui/chat.mjs](./chat.mjs.md) | ./universal-chat.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/** AION U1 universal chat projection: client only. No network, browser or effect authority. */
export const U1_SCHEMA = 'aion.ui.universal-chat/1';
const STATES = new Set(['supported','unavailable','unverified']);
const KNOWN = new Set(['text','markdown','code','table','citation','citations','artifact','progress','tool-activity-observed','image','file','reference','visible-thinking-summary','error']);
const asArray = x => Array.isArray(x) ? x : [];
const val = x => typeof x === 'string' ? x : '';
const obj = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {};
const id = x => typeof x === 'string' && x.length > 0 ? x : null;
const safeUrl = x => { try { const u = new URL(x); return /^https?:$/.test(u.protocol) ? u.href : null; } catch { return null; } };
const textValue = x => String(x ?? '');

/** Keep browser attachment distinct from verified conversation identity, and tabs distinct from account index. */
export function projectWorkspace(snapshot = {}, { openTabs = [], accountChats = [] } = {}) {
  const snap = obj(snapshot), binding = obj(snap.binding), ident = obj(snap.identity);
  const state = ['bound','unbound','unverified'].includes(ident.state) ? ident.state : 'unverified';
  const nativeThread = id(ident.threadKey) || id(binding.thread?.key) || id(binding.threadKey) || null;
  const bindingThread = id(binding.thread?.key) || id(binding.threadKey);
  const exact = state === 'bound' && !!nativeThread && !!id(snap.id) && (!bindingThread || bindingThread === nativeThread);
  const provider = id(snap.site?.id) || id(snap.site) || id(snap.provider) || 'unknown';
  const accountState = ['signed-in','signed-out','unknown'].includes(snap.account?.state) ? snap.account.state : 'unknown';
  return {
    schema: U1_SCHEMA, provider, conversationId: id(snap.id), identity: { state, exact, threadRef: exact ? nativeThread : null },
    attachment: { tabRef: id(binding.targetId) || id(binding.tabId), title: val(binding.title), status: val(snap.state) || 'unknown' },
    accountState, openTabs: asArray(openTabs).map(t => ({ tabRef: id(t.id), title: val(t.title), site: val(t.site), kind: 'browser-tab' })),
    accountChats: asArray(accountChats).map(t => ({ threadRef: id(t.threadRef), title: val(t.title), coverage: val(t.coverage) || 'partial', kind: 'account-index' })),
  };
}

/** Data-driven provider rail and task index; presented availability is not effect permission. */
export function projectRail(providers = [], tasks = []) {
  return {
    providers: asArray(providers).map(p=>({ id:id(p.id) || 'unknown', label:val(p.label)||id(p.id)||'unknown provider',
      accountState:['signed-in','signed-out'].includes(p.accountState)?p.accountState:'unknown',
      readState:STATES.has(p.readState)?p.readState:'unverified',
      sendState:STATES.has(p.sendState)?p.sendState:'unverified' })),
    tasks: asArray(tasks).map(t=>({ id:id(t.id), title:val(t.title)||'Unnamed task', conversationId:id(t.conversationId),
      status:val(t.status)||'unknown', provider:id(t.provider)||'unknown' }))
  };
}

/**
 * Render the existing /chat zero-send page read as an explicitly limited observation.
 * A page transcript has positional rows, NOT verified native message IDs, grounded
 * capture SID/seq, or a trustworthy account index. Never convert it into U1 native
 * stream events or mark it as an accepted recording.
 */
export function projectObservedPageRead(snapshot = {}, pageRead = null) {
  const snap = obj(snapshot), read = obj(pageRead), view = obj(read.view);
  const unavailable = reason => ({ state: 'unavailable', reason, messages: [], coverage: [], grounded: false, nativeIds: false, accepted: false });
  if (!pageRead) return unavailable('not-read');
  if (!id(snap.id) || read.convId !== snap.id) return unavailable('conversation-mismatch');
  const thread = binding => {
    const b = obj(binding), t = b.thread;
    return typeof t === 'string' && t ? t : id(t?.ref) || id(t?.key) || id(b.threadKey) || null;
  };
  // The read is tied to the thread observed when the response arrived, even if
  // a later snapshot keeps the same local conversation ID but changes binding.
  if (!Object.hasOwn(read, 'threadRef') || read.threadRef !== thread(snap.binding)) return unavailable('thread-mismatch');
  if (!Number.isSafeInteger(read.seq) || read.seq < 1 || view.ok !== true || !Array.isArray(view.messages)) return unavailable('invalid-read');
  const messages = [];
  let chars = 0;
  for (const m of view.messages.slice(0, 200)) {
    if (!['user','assistant'].includes(m?.role) || typeof m.text !== 'string') continue;
    const text = m.text.slice(0, Math.max(0, 200000 - chars));
    chars += text.length;
    messages.push({ role: m.role, text, cut: m.cut === true || text.length < m.text.length, position: Number.isSafeInteger(m.n) && m.n > 0 ? m.n : null });
    if (chars >= 200000) break;
  }
  return {
    state: 'observed', reason: null, messages, grounded: false, nativeIds: false, accepted: false,
    identity: snap.identity?.state === 'bound' ? 'bound' : 'unverified',
    coverage: Array.isArray(view.lines) ? view.lines.filter(x => typeof x === 'string').slice(0, 12) : [],
    completePageRead: view.chips?.some?.(x => x?.[0] === 'Not a complete copy') === false,
    readAt: typeof view.readAt === 'string' ? view.readAt : null,
  };
}

/** Capability is a multi-dimension read model, never one misleading 'supported' boolean. */
export function projectCapability(x = {}) {
  const c = obj(x); const state = v => STATES.has(v) ? v : 'unverified';
```

_First 80 of 291 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

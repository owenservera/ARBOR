# File: apps/mobile-relay/control-chat.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/control-chat.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 32175 B |
| Lines | 592 |
| Hash | 480413da07f7 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MAX_TEXT | const | 8 | no | const MAX_TEXT = 1000; |
| MAX_TURNS | const | 9 | no | const MAX_TURNS = 30; |
| KNOWN_OUTCOMES | const | 10 | no | const KNOWN_OUTCOMES = new Set([ &#39;done&#39;, &#39;approval_required&#39;, &#39;clarification_required&#39;, &#39;incomplete&#39;, &#39;interpretation_required&#39;, &#39;unavailable&#39;, &#39;refused&#39; ]); |
| CONTROL_CHAT_EXAMPLES | const | 14 | yes | export const CONTROL_CHAT_EXAMPLES = Object.freeze([ &#39;show status&#39;, &#39;open World&#39;, &#39;what can I say?&#39; ]); |
| resolveLocalDestination | export | 17 | yes | export { resolveLocalDestination } |
| SURFACE_EXAMPLES | const | 20 | no | const SURFACE_EXAMPLES = Object.freeze({ today: [&#39;show status&#39;, &#39;open World&#39;, &#39;what can I say?&#39;], talk: [&#39;show status&#39;, &#39;open Build&#39;, &#39;what can I say?&#39;], build: [&#39;show status&#39;, &#39;open World&#39;, &#39;what ca… |
| examplesForSurface | function | 29 | yes | export function examplesForSurface(surface) { |
| createControlChat | function | 33 | yes | export function createControlChat({ host, transport, fetchImpl, onChange = () =&gt; {}, onNavigate = null, onOpenPocket = null, getSurface = null, classifyBuild = null, onBuildDraft = null } = {}) { |
| client | const | 40 | no | const client = createControlClient({ transport, fetchImpl }); |
| doc | const | 41 | no | const doc = host.ownerDocument; |
| messages | variable | 42 | no | let messages = []; |
| busy | variable | 43 | no | let busy = false; |
| suggestions | variable | 44 | no | let suggestions = []; |
| loadingSuggestions | variable | 45 | no | let loadingSuggestions = false; |
| suggestionEpoch | variable | 46 | no | let suggestionEpoch = 0; |
| sharedPrograms | variable | 47 | no | let sharedPrograms=null,programLoading=false,programError=&#39;&#39;; |
| elem | function | 49 | no | const elem = (tag, className, content) =&gt; { |
| node | const | 50 | no | const node = doc.createElement(tag); |
| redraw | function | 55 | no | const redraw = () =&gt; { render(); onChange(); }; |
| note | function | 56 | no | const note = (text, status = &#39;info&#39;, plan = null, receipt = null) =&gt; { |
| msg | const | 57 | no | const msg = { role: &#39;vivim&#39;, text: String(text).slice(0, 1500), status, plan, receipt }; |
| describe | function | 62 | no | const describe = value =&gt; { |
| planText | function | 67 | no | const planText = plan =&gt; { |
| result | const | 70 | no | const result = plan.result; |
| fail | function | 100 | no | function fail(reply, error) { |
| code | const | 101 | no | const code = error?.code; |
| settle | function | 112 | no | async function settle(reply, plan, requestText = null) { |
| reading | variable | 139 | no | let reading=null; |
| route | const | 144 | no | const route=resolveProductRoute(requestText,{hostMeaning:plan, compileUi:reading?()=&gt;reading:null}); |
| requestAction | function | 167 | no | async function requestAction(source, action, label, once) { |
| args | const | 169 | no | const args = action.args &amp;&amp; typeof action.args === &#39;object&#39; &amp;&amp; !Array.isArray(action.args) |
| reply | const | 173 | no | const reply = note(label, &#39;waiting&#39;); |
| send | function | 185 | no | async function send(raw) { |
| text | const | 186 | no | const text = String(raw \|\| &#39;&#39;).trim(); |
| destination | const | 193 | no | const destination = resolveLocalDestination(text); |
| available | const | 195 | no | const available = destination === &#39;pocket&#39; |
| reply | const | 208 | no | const reply = note(&#39;Asking your PC to preview the command…&#39;, &#39;waiting&#39;); |
| previewCapture | function | 223 | no | async function previewCapture(capture){ |
| reply | const | 226 | no | const reply=note(&#39;Previewing your reviewed &#39;+capture.kind+&#39; on the Host…&#39;,&#39;waiting&#39;); |
| notifyWikiCommitted | function | 235 | no | function notifyWikiCommitted(receipt) { |
| approve | function | 244 | no | async function approve(reply) { |
| plan | const | 246 | no | const plan = reply.plan; |
| receipt | const | 254 | no | const receipt = await client.execute(plan); |
| reconcile | function | 283 | no | async function reconcile(reply) { |
| status | const | 290 | no | const status = await client.status(reply.planId); |
| receipt | const | 291 | no | const receipt = status?.receipt; |
| cancel | function | 317 | no | function cancel(reply) { |
| exampleChip | function | 325 | no | function exampleChip(text) { |
| button | const | 326 | no | const button = elem(&#39;button&#39;, &#39;chip&#39;, text); |
| receiptCard | function | 335 | no | function receiptCard(msg) { |
| receipt | const | 336 | no | const receipt = msg.receipt; |
| card | const | 337 | no | const card = elem(&#39;div&#39;, &#39;vivim-receipt&#39;); |
| open | const | 342 | no | const open = elem(&#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;View updated Wiki&#39;); |
| undo | const | 347 | no | const undo = receipt.undo; |
| button | const | 349 | no | const button = elem(&#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;Undo this change&#39;); |
| loadSharedPrograms | function | 359 | no | async function loadSharedPrograms(){ |
| epoch | const | 361 | no | const epoch=suggestionEpoch;programLoading=true;programError=&#39;&#39;;redraw(); |
| renderSharedPrograms | function | 368 | no | function renderSharedPrograms(){ |
| programs | const | 369 | no | const programs=elem(&#39;section&#39;,&#39;vivim-plan&#39;); |
| load | const | 370 | no | const load=elem(&#39;button&#39;,&#39;btn sm ux-secondary&#39;,programLoading?&#39;Reading shared programs…&#39;:sharedPrograms?&#39;Refresh shared programs&#39;:&#39;Shared programs&#39;);load.type=&#39;button&#39;;load.disabled=programLoading;lo… |
| row | const | 375 | no | const row=elem(&#39;div&#39;,&#39;vivim-plan&#39;);row.append(elem(&#39;strong&#39;,&#39;&#39;,entry.phrase),elem(&#39;p&#39;,&#39;ux-meta&#39;,entry.steps+&#39; steps · &#39;+(entry.kind===&#39;read&#39;?&#39;read only&#39;:&#39;fresh approval required&#39;)+(entry.parameter?&#39; … |
| draft | const | 376 | no | const draft=elem(&#39;button&#39;,&#39;btn sm&#39;,&#39;Draft invocation&#39;);draft.type=&#39;button&#39;;draft.disabled=!entry.available; |
| field | variable | 377 | no | let field=null; |
| status | const | 379 | no | const status=elem(&#39;p&#39;,&#39;ux-meta&#39;,&#39;&#39;); |
| parameter | const | 382 | no | const parameter=field?.value.trim()??&#39;&#39;; |
| render | function | 392 | no | function render() { |
| fragment | const | 393 | no | const fragment = doc.createDocumentFragment(); |
| surface | const | 396 | no | const surface = typeof getSurface === &#39;function&#39; ? getSurface() : null; |
| prompts | const | 397 | no | const prompts = suggestions.length ? suggestions : examplesForSurface(surface); |
| empty | const | 399 | no | const empty = elem(&#39;div&#39;, &#39;vivim-intro&#39;); |
| examples | const | 405 | no | const examples = elem(&#39;div&#39;, &#39;vivim-examples&#39;); |
| row | const | 412 | no | const row = elem(&#39;div&#39;, &#39;m &#39; + (msg.role === &#39;owner&#39; ? &#39;u&#39; : &#39;a&#39;)); |
| bubble | const | 414 | no | const bubble = elem(&#39;div&#39;, &#39;bub&#39;, msg.text); |
| card | const | 423 | no | const card = receiptCard(msg); |
| check | const | 429 | no | const check = elem(&#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;Check PC receipt&#39;); |
| meaning | const | 434 | no | const meaning = msg.plan?.language?.vec?.proposal ?? msg.meaning; |
| context | const | 437 | no | const context=msg.requestContext; |
| details | const | 439 | no | const details=elem(&#39;details&#39;,&#39;vivim-plan&#39;); |
| read | const | 447 | no | const read=elem(&#39;button&#39;,&#39;chip&#39;,&#39;Read &#39;+p.page+&#39;/&#39;+section); |
| open | const | 460 | no | const open = elem(&#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;Review in Build&#39;); |
| redirect | const | 466 | no | const redirect = elem(&#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;Ask my AI instead&#39;); |
| revise | const | 477 | no | const revise = elem(&#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;Edit original request&#39;); |
| choices | const | 485 | no | const choices = elem(&#39;div&#39;, &#39;vivim-choices&#39;); |
| button | const | 487 | no | const button = elem(&#39;button&#39;, &#39;chip&#39;, (choice.title \|\| choice.actionId) + (choice.requiredArgs?.length ? &#39; · needs &#39; + choice.requiredArgs.join(&#39;, &#39;) : &#39;&#39;)); |
| plan | const | 506 | no | const plan = msg.plan; |
| card | const | 507 | no | const card = elem(&#39;div&#39;, &#39;vivim-plan&#39;); |
| binding | const | 512 | no | const binding=plan.approvalMeaning; |
| args | const | 520 | no | const args = plan.args &amp;&amp; typeof plan.args === &#39;object&#39; ? Object.entries(plan.args).slice(0, 12) : []; |
| actions | const | 531 | no | const actions = elem(&#39;div&#39;, &#39;vivim-plan-actions&#39;); |
| yes | const | 532 | no | const yes = elem(&#39;button&#39;, &#39;btn pri&#39;, &#39;Approve &amp; apply&#39;); |
| no | const | 534 | no | const no = elem(&#39;button&#39;, &#39;btn&#39;, &#39;Cancel&#39;); |
| settled | const | 542 | no | const settled = messages.length &amp;&amp; !busy &amp;&amp; |
| next | const | 545 | no | const next = elem(&#39;div&#39;, &#39;vivim-examples&#39;); |
| loadSuggestions | function | 554 | no | async function loadSuggestions() { |
| epoch | const | 556 | no | const epoch = suggestionEpoch; |
| catalog | const | 559 | no | const catalog = await client.call(&#39;catalog&#39;); |
| actions | const | 561 | no | const actions = Array.isArray(catalog?.actions) ? catalog.actions : []; |
| verified | const | 562 | no | const verified = actions.filter(a =&gt; [&#39;source_wired&#39;, &#39;verified&#39;].includes(a.readiness) &amp;&amp; a.risk === &#39;R0&#39; &amp;&amp; Array.isArray(a.examples)); |
| redact | function | 575 | no | function redact() { |
| clear | function | 582 | no | function clear() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./control-client.mjs | import | 5 | [apps/mobile-relay/control-client.mjs](./control-client.mjs.md) |
| ./control-language.mjs | import | 6 | [apps/mobile-relay/control-language.mjs](./control-language.mjs.md) |
| ./control-language.mjs | export_from | 17 | [apps/mobile-relay/control-language.mjs](./control-language.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/app.js](./app.js.md) | ./control-chat.mjs |
| [apps/mobile-relay/test/product-semantic-parity.test.mjs](./test/product-semantic-parity.test.mjs.md) | ../control-chat.mjs |
| [apps/mobile-relay/test/universal-control-chat.test.mjs](./test/universal-control-chat.test.mjs.md) | ../control-chat.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Chat-first VIVIM control on the existing phone Talk surface.
// Every request is planned by the same Host control dispatcher used by Control.
// Nothing is applied from a typed message; approval is a separate deliberate tap.
// Transcript is in-memory only: private control text is never duplicated in storage.
import { createControlClient } from './control-client.mjs';
import { resolveLocalDestination, resolveProductRoute } from './control-language.mjs';

const MAX_TEXT = 1000;
const MAX_TURNS = 30;
const KNOWN_OUTCOMES = new Set([
  'done', 'approval_required', 'clarification_required', 'incomplete',
  'interpretation_required', 'unavailable', 'refused'
]);
export const CONTROL_CHAT_EXAMPLES = Object.freeze([
  'show status', 'open World', 'what can I say?'
]);
export { resolveLocalDestination } from './control-language.mjs';
// Each mounted screen must be able to state what can be asked from it.
// These prompts only fill the shared composer; none of them sends or executes.
const SURFACE_EXAMPLES = Object.freeze({
  today: ['show status', 'open World', 'what can I say?'],
  talk: ['show status', 'open Build', 'what can I say?'],
  build: ['show status', 'open World', 'what can I say?'],
  world: ['open media library', 'show status', 'what can I say?'],
  wiki: ['open Wiki', 'show status', 'what can I say?'],
  me: ['show status', 'open Control', 'what can I say?'],
  control: ['show status', 'open Today', 'what can I say?']
});
export function examplesForSurface(surface) {
  return SURFACE_EXAMPLES[surface] || CONTROL_CHAT_EXAMPLES;
}

export function createControlChat({
  host, transport, fetchImpl, onChange = () => {},
  onNavigate = null, onOpenPocket = null, getSurface = null,
  classifyBuild = null, onBuildDraft = null
} = {}) {
  if (!host || typeof host.replaceChildren !== 'function')
    throw new TypeError('Chat transcript root required');
  const client = createControlClient({ transport, fetchImpl });
  const doc = host.ownerDocument;
  let messages = [];
  let busy = false;
  let suggestions = [];
  let loadingSuggestions = false;
  let suggestionEpoch = 0;
  let sharedPrograms=null,programLoading=false,programError='';

  const elem = (tag, className, content) => {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (content != null) node.textContent = String(content);
    return node;
  };
  const redraw = () => { render(); onChange(); };
  const note = (text, status = 'info', plan = null, receipt = null) => {
    const msg = { role: 'vivim', text: String(text).slice(0, 1500), status, plan, receipt };
    messages.push(msg);
    if (messages.length > MAX_TURNS) messages = messages.slice(-MAX_TURNS);
    return msg;
  };
  const describe = value => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value.slice(0, 500);
    try { return JSON.stringify(value).slice(0, 600); } catch { return 'Host returned details unavailable for display'; }
  };
  const planText = plan => {
    switch (plan.outcome) {
      case 'done': {
        const result = plan.result;
        if (plan.actionId === 'wiki.section.read' && typeof result?.content === 'string')
          return result.page + '/' + result.section + ' · Wiki revision ' + result.wikiRevision +
            '\n' + (result.content || '(Empty section)') + (result.relatedPages?.length ? '\nRelated Wiki pages: '+result.relatedPages.join(', ') : '');
        if (plan.actionId === 'wiki.pages.list' && Array.isArray(result?.pages))
          return 'Wiki · revision ' + result.wikiRevision + '\n' +
            (result.pages.map(p => p.page + ': ' + (p.sections.join(', ') || '(no sections)') +
              (p.omittedSections ? ' (+' + p.omittedSections + ' more)' : '') +
              (p.relatedPages?.length ? ' · related: '+p.relatedPages.join(', ') : '')).join('\n') || '(No pages)') +
            (result.omitted ? '\n' + result.omitted + ' more pages not shown.' : '');
        if(plan.actionId==='program.read_wiki'&&Array.isArray(result?.steps))return 'Wiki sequence · revision '+result.wikiRevision+' · '+result.steps.length+' completed read steps';
```

_First 80 of 593 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

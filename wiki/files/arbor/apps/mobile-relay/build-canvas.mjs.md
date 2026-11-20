# File: apps/mobile-relay/build-canvas.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/build-canvas.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 29305 B |
| Lines | 455 |
| Hash | dd535b22f629 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PENDING_KEY | const | 12 | no | const PENDING_KEY = &#39;vivim.build.pending.v1&#39;; |
| PAUSE | function | 13 | no | const PAUSE = ms =&gt; new Promise(resolve =&gt; setTimeout(resolve, ms)); |
| LABELS | const | 14 | no | const LABELS = { chatgpt: &#39;ChatGPT&#39;, claude: &#39;Claude&#39;, gemini: &#39;Gemini&#39;, qwen: &#39;Qwen&#39;, zai: &#39;Z.ai&#39;, deepseek: &#39;DeepSeek&#39; }; |
| committedUiRevision | function | 17 | yes | export function committedUiRevision(command, surface, expectedPreview = null) { |
| body | variable | 25 | no | let body = command?.result; |
| stable | function | 37 | no | const stable=value=&gt;Array.isArray(value)?value.map(stable):value&amp;&amp;typeof value===&#39;object&#39;? |
| s | const | 39 | no | const s=expectedPreview.surface; |
| projection | const | 40 | no | const projection=digestJson(stable({audience:&#39;phone&#39;,surfaceId:expectedPreview.surfaceId, catalogVersion:expectedPreview.catalogVersion,theme:s.theme,tree:s.tree})); |
| buildRequestRoute | function | 50 | yes | export function buildRequestRoute(text) { |
| tab | const | 51 | no | const tab=resolveLocalDestination(text); |
| assertBuildPreviewCurrent | function | 57 | yes | export function assertBuildPreviewCurrent(submitted, live) { |
| fresh | const | 61 | no | const fresh = compileUiProposal({ proposal: submitted.proposal, surface: live, approvedRefs: [], audience: &#39;phone&#39; }); |
| matchesCommittedUiReadback | function | 68 | yes | export function matchesCommittedUiReadback(proof, expected, live) { |
| actual | const | 74 | no | const actual = validateSurface(live, { refs: new Set() }); |
| intended | const | 75 | no | const intended = validateSurface({ ...expected, revision: proof.committedRevision }, { refs: new Set() }); |
| buildUndoProposal | function | 83 | yes | export function buildUndoProposal({ original, before, committed, live }) { |
| op | const | 87 | no | const op = original.proposal.operations[0]; |
| find | function | 88 | no | const find = (node, id, parent = null) =&gt; { |
| found | const | 91 | no | const found = find(child, id, node); |
| inverse | variable | 96 | no | let inverse; |
| prior | const | 100 | no | const prior = find(before.tree, op.componentId); |
| proposal | const | 115 | no | const proposal = { schema: &#39;vivim.ui-proposal/1&#39;, surfaceId: live.surfaceId, |
| preview | const | 118 | no | const preview = compileUiProposal({ proposal, surface: live, approvedRefs: [], audience: &#39;phone&#39; }); |
| restored | const | 119 | no | const restored = validateSurface({ ...before, revision: live.revision }, { refs: new Set() }); |
| mountBuildCanvas | function | 125 | yes | export function mountBuildCanvas({ host, request, getSurface, getProvider, send, apply, prepareVisual = null, onApplied = () =&gt; {}, navigate = () =&gt; {}, openControlDraft = null, openProviderDraft = n… |
| state | variable | 126 | no | let state = { name: &#39;idle&#39; }, text = &#39;&#39;, run = 0, assistance=null; |
| el | function | 127 | no | const el = (tag, cls, content) =&gt; { const e = document.createElement(tag); if (cls) e.className = cls; if (content != null) e.textContent = content; return e; }; |
| current | function | 128 | no | const current = () =&gt; getSurface?.() ?? null; |
| empty | function | 129 | no | const empty = () =&gt; !current()?.tree?.children?.length; |
| saved | function | 130 | no | const saved = () =&gt; { try { return JSON.parse(storage.getItem(PENDING_KEY) \|\| &#39;null&#39;); } catch { return null; } }; |
| keep | function | 131 | no | const keep = value =&gt; { try { value ? storage.setItem(PENDING_KEY, JSON.stringify(value)) : storage.removeItem(PENDING_KEY); } catch { /* the pending note is a convenience */ } }; |
| set | function | 132 | no | const set = next =&gt; { state = next; render(); }; |
| ready | function | 133 | no | async function ready(draft){ |
| token | const | 135 | no | const token=++run; |
| plan | const | 139 | no | const plan=await prepareVisual(draft.proposal); |
| exact | const | 141 | no | const exact=plan?.approvalMeaning,remote=plan?.visualPreview; |
| watch | function | 153 | no | async function watch(id, token) { |
| started | const | 154 | no | const started = Date.now(); |
| surface | const | 163 | no | const surface = current(); |
| out | const | 165 | no | const out = previewReply({ reply: record.result, surface }); |
| ask | function | 173 | no | async function ask() { |
| checkedText | const | 175 | no | const checkedText=text; |
| destination | const | 176 | no | const destination=resolveLocalDestination(checkedText); |
| checkRun | const | 185 | no | const checkRun=++run; |
| meaning | variable | 187 | no | let meaning=null; |
| surface | const | 191 | no | const surface=current(); |
| route | const | 192 | no | const route=resolveProductRoute(checkedText,{hostMeaning:meaning, hostRequired:typeof interpretControl===&#39;function&#39;, compileUi:surface?request=&gt;resolveBuildRequest({request,surface}):null}); |
| local | const | 203 | no | const local=route.reading; |
| askDesign | function | 214 | no | async function askDesign(){ |
| surface | const | 216 | no | const surface=current(); |
| provider | const | 220 | no | const provider = getProvider(); |
| prompt | variable | 221 | no | let prompt; |
| token | const | 224 | no | const token = ++run; |
| id | const | 227 | no | const id = await send(prompt, provider); |
| refreshCommittedScreen | function | 233 | no | async function refreshCommittedScreen(proof) { |
| waitForReadback | function | 242 | no | async function waitForReadback(proof, expected) { |
| view | const | 244 | no | const view = getSurface?.(); |
| activate | function | 250 | no | async function activate() { |
| submitted | const | 252 | no | const submitted = state; |
| proof | variable | 258 | no | let proof; |
| confirmed | const | 265 | no | const confirmed = await waitForReadback(proof, submitted.preview.surface); |
| undo | function | 270 | no | async function undo() { |
| prior | const | 272 | no | const prior = state; |
| draft | const | 273 | no | const draft = buildUndoProposal({ original: prior.original, before: prior.before, committed: prior.proof, live: current() }); |
| composer | function | 281 | no | function composer() { |
| box | const | 282 | no | const box = el(&#39;div&#39;, &#39;compose-box&#39;); |
| label | const | 283 | no | const label = el(&#39;label&#39;, null, empty() ? &#39;What would you like to create?&#39; : &#39;What would you like to change?&#39;); label.htmlFor = &#39;build-text&#39;; label.className = empty() ? &#39;compose-title&#39; : &#39;compose-la… |
| area | const | 284 | no | const area = el(&#39;textarea&#39;); area.id = &#39;build-text&#39;; area.rows = 3; area.maxLength = 400; area.value = text; area.placeholder = empty() ? &#39;Describe it in your own words&#39; : &#39;For example: show my proje… |
| chips | const | 287 | no | const chips = el(&#39;div&#39;, &#39;chips compose-chips&#39;); |
| panel | const | 291 | no | const panel=el(&#39;div&#39;,&#39;composer-assist&#39;);box.append(panel); |
| control | const | 298 | no | const control = el(&#39;button&#39;, &#39;btn&#39;, &#39;Ask VIVIM instead&#39;); |
| proposalCard | function | 308 | no | function proposalCard() { |
| card | const | 309 | no | const card = el(&#39;article&#39;, &#39;proposal&#39;); |
| typed | const | 314 | no | const typed = el(&#39;details&#39;, &#39;proposal-details&#39;); |
| d | const | 319 | no | const d = state.detail; |
| swatch | const | 323 | no | const swatch = el(&#39;span&#39;, &#39;color-swatch&#39;); |
| componentStyles | const | 335 | no | const componentStyles=state.proposal.operations.filter(op=&gt;op.type===&#39;set-presentation&#39;); |
| note | const | 337 | no | const note=el(&#39;section&#39;,&#39;proposal-details&#39;);note.append(el(&#39;strong&#39;,null,&#39;Exact component appearance changes&#39;)); |
| bindingChanges | const | 342 | no | const bindingChanges=state.proposal.operations.filter(op=&gt;op.type===&#39;set-live-binding&#39;); |
| note | const | 344 | no | const note=el(&#39;section&#39;,&#39;proposal-details&#39;);note.append(el(&#39;strong&#39;,null,&#39;Exact read-only data source changes&#39;),el(&#39;p&#39;,&#39;muted&#39;,&#39;No additional source permissions, data copies or automatic effects. Liv… |
| oldShell | const | 348 | no | const oldShell=state.surface.theme.shell??{},newShell=state.preview.surface.theme.shell??{}; |
| shellFields | const | 349 | no | const shellFields=[&#39;background&#39;,&#39;secondary&#39;,&#39;accent&#39;,&#39;fontSizePx&#39;,&#39;radiusPx&#39;,&#39;spacingScale&#39;]; |
| shellChanges | const | 350 | no | const shellChanges=shellFields.filter(k=&gt;oldShell[k]!==newShell[k]); |
| note | const | 352 | no | const note=el(&#39;section&#39;,&#39;proposal-details&#39;); |
| view | const | 358 | no | const view = el(&#39;div&#39;, &#39;proposal-preview&#39;); |
| previewVisible | variable | 359 | no | let previewVisible = true; |
| actions | const | 362 | no | const actions = el(&#39;div&#39;, &#39;compose-row&#39;); |
| yes | const | 363 | no | const yes = el(&#39;button&#39;, &#39;btn pri&#39;, state.name === &#39;applying&#39; ? &#39;Adding…&#39; : &#39;Activate&#39;); yes.type = &#39;button&#39;; yes.disabled = state.name === &#39;applying&#39; \|\| !previewVisible \|\| !state.hostPlan; yes.oncli… |
| change | const | 364 | no | const change = el(&#39;button&#39;, &#39;btn&#39;, &#39;Change it&#39;); change.type = &#39;button&#39;; change.disabled = state.name === &#39;applying&#39;; change.onclick = () =&gt; { if (state.name === &#39;ready&#39;) set({ name: &#39;idle&#39; }); }; |
| no | const | 365 | no | const no = el(&#39;button&#39;, &#39;btn&#39;, &#39;Not now&#39;); no.type = &#39;button&#39;; no.disabled = state.name === &#39;applying&#39;; no.onclick = () =&gt; { if (state.name === &#39;ready&#39;) { text = &#39;&#39;; set({ name: &#39;idle&#39; }); } }; |
| render | function | 371 | no | function render() { |
| wait | const | 375 | no | const wait = el(&#39;div&#39;, &#39;proposal is-wait&#39;); wait.setAttribute(&#39;role&#39;, &#39;status&#39;); |
| choice | const | 379 | no | const choice=el(&#39;div&#39;,&#39;proposal&#39;); |
| design | const | 381 | no | const design=el(&#39;button&#39;,&#39;btn pri&#39;,&#39;Ask AI to design&#39;);design.type=&#39;button&#39;;design.onclick=askDesign; |
| conversation | const | 382 | no | const conversation=el(&#39;button&#39;,&#39;btn&#39;,&#39;Ask my AI instead&#39;);conversation.type=&#39;button&#39;; |
| cancel | const | 385 | no | const cancel=el(&#39;button&#39;,&#39;btn&#39;,&#39;Edit request&#39;);cancel.type=&#39;button&#39;;cancel.onclick=()=&gt;set({name:&#39;idle&#39;}); |
| wait | const | 388 | no | const wait = el(&#39;div&#39;, &#39;proposal is-wait&#39;); wait.setAttribute(&#39;role&#39;, &#39;status&#39;); |
| confirmed | const | 393 | no | const confirmed = state.name === &#39;done&#39;; |
| ok | const | 394 | no | const ok = el(&#39;div&#39;, &#39;proposal is-done&#39;); ok.setAttribute(&#39;role&#39;, &#39;status&#39;); |
| p | const | 399 | no | const p = state.proof; |
| panel | const | 400 | no | const panel = el(&#39;div&#39;, &#39;proof-panel&#39;); |
| ids | const | 404 | no | const ids = state.original.proposal.operations.map(op =&gt; op.component?.id ?? op.componentId ?? (op.type === &#39;set-theme&#39; ? &#39;root&#39; : null)).filter(Boolean); |
| row | const | 411 | no | const row = el(&#39;div&#39;, &#39;compose-row&#39;); |
| check | const | 413 | no | const check = el(&#39;button&#39;, &#39;btn&#39;, &#39;Check live screen&#39;); check.type = &#39;button&#39;; |
| view | const | 415 | no | const view = state; |
| undoButton | const | 421 | no | const undoButton = el(&#39;button&#39;, &#39;btn&#39;, &#39;Undo&#39;); |
| more | const | 423 | no | const more = el(&#39;button&#39;, &#39;btn&#39;, &#39;Ask for something else&#39;); |
| bad | const | 434 | no | const bad = el(&#39;div&#39;, &#39;proposal is-error&#39;); bad.setAttribute(&#39;role&#39;, &#39;alert&#39;); |
| check | const | 436 | no | const check = el(&#39;button&#39;, &#39;btn&#39;, &#39;Refresh live screen&#39;); check.type = &#39;button&#39;; |
| reset | const | 438 | no | const reset = el(&#39;button&#39;, &#39;btn&#39;, &#39;Return to Build&#39;); reset.type = &#39;button&#39;; |
| bad | const | 442 | no | const bad = el(&#39;div&#39;, &#39;proposal is-error&#39;); bad.setAttribute(&#39;role&#39;, &#39;alert&#39;); |
| retry | const | 443 | no | const retry = el(&#39;button&#39;, &#39;btn&#39;, &#39;Try again&#39;); retry.type = &#39;button&#39;; retry.onclick = () =&gt; set({ name: &#39;idle&#39; }); |
| pending | const | 448 | no | const pending = saved(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./build-composer.mjs | import | 4 | [apps/mobile-relay/build-composer.mjs](./build-composer.mjs.md) |
| ./control-language.mjs | import | 5 | [apps/mobile-relay/control-language.mjs](./control-language.mjs.md) |
| ./composer-assist.mjs | import | 6 | [apps/mobile-relay/composer-assist.mjs](./composer-assist.mjs.md) |
| ./generative-ui/renderer.mjs | import | 7 | [apps/mobile-relay/generative-ui/renderer.mjs](./generative-ui/renderer.mjs.md) |
| ./generative-ui/compiler.mjs | import | 8 | [apps/mobile-relay/generative-ui/compiler.mjs](./generative-ui/compiler.mjs.md) |
| ./generative-ui/catalog.mjs | import | 9 | [apps/mobile-relay/generative-ui/catalog.mjs](./generative-ui/catalog.mjs.md) |
| ./generative-ui/portable-digest.mjs | import | 10 | [apps/mobile-relay/generative-ui/portable-digest.mjs](./generative-ui/portable-digest.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/app.js](./app.js.md) | ./build-canvas.mjs |
| [apps/mobile-relay/test/build-live-readback.test.mjs](./test/build-live-readback.test.mjs.md) | ../build-canvas.mjs |
| [apps/mobile-relay/test/build-vec-theme.test.mjs](./test/build-vec-theme.test.mjs.md) | ../build-canvas.mjs |
| [apps/mobile-relay/test/component-presentation.test.mjs](./test/component-presentation.test.mjs.md) | ../build-canvas.mjs |
| [apps/mobile-relay/test/product-semantic-parity.test.mjs](./test/product-semantic-parity.test.mjs.md) | ../build-canvas.mjs |
| [apps/vivim-host/test/direct-phone.test.mjs](../vivim-host/test/direct-phone.test.mjs.md) | ../../mobile-relay/build-canvas.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// The Build canvas request screen. It asks the owner's main AI for a draft, shows it as a dashed
// proposal, and applies it only when the owner taps Activate. Sending and applying are injected, so
// this file never talks to a provider itself and never resends: a draft that is still pending is polled, not re-asked.
import { SUGGESTIONS, buildDesignPrompt, resolveBuildRequest, previewReply, failureText } from './build-composer.mjs';
import { resolveLocalDestination, resolveProductRoute } from './control-language.mjs';
import { mountComposerAssist } from './composer-assist.mjs';
import { renderSurface, planTierflowSurface, tierflowViewport } from './generative-ui/renderer.mjs';
import { compileUiProposal } from './generative-ui/compiler.mjs';
import { validateSurface } from './generative-ui/catalog.mjs';
import { digestJson } from './generative-ui/portable-digest.mjs';

const PENDING_KEY = 'vivim.build.pending.v1';
const PAUSE = ms => new Promise(resolve => setTimeout(resolve, ms));
const LABELS = { chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini', qwen: 'Qwen', zai: 'Z.ai', deepseek: 'DeepSeek' };

// Queue completion alone is never proof of a persisted Host UI revision.
export function committedUiRevision(command, surface, expectedPreview = null) {
  // Existing worker receipt shape remains readable for history only. The live
  // Build path obtains the durable control receipt through createControlClient.
  if(command?.schema==='vivim.control-receipt/1'){
    if(command.status!=='applied'||command.executionPerformed!==true||command.actionId!=='ui.visual.apply')
      throw new Error('Host visual effect not confirmed');
    command={status:'done',result:{...command.result,schema:'vivim.bootstrap-command-worker/1',action:'apply-proposal'}};
  }
  let body = command?.result;
  try { if (typeof body === 'string') body = JSON.parse(body); }
  catch { throw new Error('Host commit confirmation unreadable'); }
  if (command?.status !== 'done' ||
      body?.schema !== 'vivim.bootstrap-command-worker/1' ||
      body.action !== 'apply-proposal' || body.persisted !== true ||
      !Number.isSafeInteger(body.revision) ||
      body.revision !== surface.revision + 1 ||
      body.parentRevision !== surface.revision ||
      body.surfaceId !== surface.surfaceId)
    throw new Error('Host did not confirm the expected persisted revision');
  if(expectedPreview){
    const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
      Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
    const s=expectedPreview.surface;
    const projection=digestJson(stable({audience:'phone',surfaceId:expectedPreview.surfaceId,
      catalogVersion:expectedPreview.catalogVersion,theme:s.theme,tree:s.tree}));
    if(body.previewDigest!==expectedPreview.previewDigest||body.projectionDigest!==projection||
       typeof body.changeId!=='string'||!body.changeId.startsWith('chg-'))
      throw new Error('Host proof does not match the approved preview');
  }
  return { committedRevision: body.revision, parentRevision: body.parentRevision,
    surfaceId: body.surfaceId };
}

export function buildRequestRoute(text) {
  const tab=resolveLocalDestination(text);
  return tab?{kind:'navigate',tab}:{kind:'design'};
}

// Recompile only for validation: the proposal and preview approved by the owner
// must remain identical on the currently loaded Host surface.
export function assertBuildPreviewCurrent(submitted, live) {
  if (!live || live.surfaceId !== submitted.surface.surfaceId ||
      live.revision !== submitted.surface.revision)
    throw new Error('Stale or unavailable Host surface revision');
  const fresh = compileUiProposal({ proposal: submitted.proposal, surface: live,
    approvedRefs: [], audience: 'phone' });
  if (fresh.proposalDigest !== submitted.preview.proposalDigest ||
      fresh.previewDigest !== submitted.preview.previewDigest)
    throw new Error('Stale or changed Host preview');
}

export function matchesCommittedUiReadback(proof, expected, live) {
  if (!live || !expected || live.surfaceId !== proof.surfaceId ||
      expected.surfaceId !== proof.surfaceId || expected.revision !== proof.parentRevision ||
      proof.committedRevision !== proof.parentRevision + 1 ||
      live.revision !== proof.committedRevision) return false;
  try {
    const actual = validateSurface(live, { refs: new Set() });
    const intended = validateSurface({ ...expected, revision: proof.committedRevision }, { refs: new Set() });
    return JSON.stringify(actual) === JSON.stringify(intended);
  } catch { return false; }
}

// An undo is a compensating UI proposal on the verified current head, not
```

_First 80 of 456 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

# File: apps/mobile-relay/generative-ui/phone-surface.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/generative-ui/phone-surface.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8571 B |
| Lines | 180 |
| Hash | af42e8bef9c1 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PAUSE | function | 11 | no | const PAUSE = ms =&gt; new Promise(resolve =&gt; setTimeout(resolve, ms)); |
| mounted | variable | 12 | no | let mounted = false; |
| surface | variable | 13 | no | let surface = null; |
| pending | variable | 14 | no | let pending = false; |
| handleStatus | function | 15 | no | let handleStatus = () =&gt; {}; |
| clearBuildSurface | function | 16 | no | let clearBuildSurface = () =&gt; {}; |
| locate | function | 18 | no | function locate(node, id) { |
| found | const | 21 | no | const found = locate(c, id); |
| MEANING_INTENT | const | 30 | no | const MEANING_INTENT = Object.freeze({ &#39;select-component&#39;: &#39;select&#39;, &#39;preview-only&#39;: &#39;select&#39;, &#39;inspect-meaning&#39;: &#39;inspect-meaning&#39;, &#39;preview-layout&#39;: &#39;preview-layout&#39;, |
| meaningOf | function | 38 | no | function meaningOf(intent, semantic) { |
| visual | const | 40 | no | const visual = MEANING_INTENT[intent.intent]; |
| sendProposal | function | 47 | yes | export async function sendProposal() { |
| repaint | function | 51 | no | async function repaint() { |
| status | const | 53 | no | const status = await transport.request(&#39;status&#39;); |
| mountBuildSurface | function | 58 | yes | export function mountBuildSurface(mount, { onCommit = () =&gt; {}, semantic = null, readOnly = false, onInstances=()=&gt;{}, onSelection=()=&gt;{} } = {}) { |
| revisionGuard | const | 61 | no | const revisionGuard = createHostRevisionGuard(); |
| initialDraft | variable | 62 | no | let initialDraft = null,instances=new Map(),highlighted=null,selected=null,mountedSemantic=null,inspecting=false,liveData=null; |
| clear | function | 64 | no | function clear() { |
| render | function | 74 | no | function render(s) { |
| restore | const | 76 | no | const restore=selected?.revision===s.revision&amp;&amp;selected?.surfaceId===s.surfaceId?selected.instanceId:null; |
| component | const | 86 | no | const component=locate(surface.tree,intent.targetId); |
| setSurface | function | 98 | no | function setSurface(record, bootstrap = null) { |
| next | const | 100 | no | const next = revisionGuard.observe(record); |
| notice | const | 120 | no | const notice = mount.ownerDocument.createElement(&#39;p&#39;); |
| publicRow | function | 140 | no | function publicRow({element,...row}){return {...row,settings:{...row.settings},configurableProperties:[...(row.configurableProperties??[])]};} |
| listInstances | function | 141 | no | function listInstances(){return surface?Array.from(instances.values(),publicRow):[];} |
| selectInstance | function | 142 | no | function selectInstance(id,revision,source=&#39;glyph&#39;){ |
| row | const | 143 | no | const row=instances.get(id); |
| meaning | const | 145 | no | const meaning=meaningOf({targetId:id,intent:&#39;select-component&#39;,source},mountedSemantic); |
| selectedInstance | function | 153 | no | function selectedInstance(){ |
| setInspecting | function | 157 | no | function setInspecting(enabled){ |
| hit | const | 164 | no | const hit=event.target?.closest?.(&#39;[data-component-id]&#39;); |
| target | const | 166 | no | const target=hit.getAttribute(&#39;data-component-id&#39;); |
| setLiveData | function | 171 | no | function setLiveData(data,revision){ |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./renderer.mjs | import | 5 | [apps/mobile-relay/generative-ui/renderer.mjs](./renderer.mjs.md) |
| ./catalog.mjs | import | 6 | [apps/mobile-relay/generative-ui/catalog.mjs](./catalog.mjs.md) |
| ./semantic-projection.mjs | import | 7 | [apps/mobile-relay/generative-ui/semantic-projection.mjs](./semantic-projection.mjs.md) |
| ../transport.mjs | import | 8 | [apps/mobile-relay/transport.mjs](../transport.mjs.md) |
| ./host-revision-guard.mjs | import | 9 | [apps/mobile-relay/generative-ui/host-revision-guard.mjs](./host-revision-guard.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/app.js](../app.js.md) | ./generative-ui/phone-surface.mjs |
| [apps/mobile-relay/test/host-build-consumer.test.mjs](../test/host-build-consumer.test.mjs.md) | ../generative-ui/phone-surface.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Phone-side Build surface: renders the Host-committed vivim.ui-revision/1 surface
// and exposes component taps as inert semantic inspection. Explicit Build activation
// uses the existing bootstrap command channel. Browser-only; no Node imports.
// A tap never sends a provider prompt and is never automatically resent while uncertain.
import { renderSurface } from './renderer.mjs';
import { createSurface } from './catalog.mjs';
import { projectVisualIntent, projectMountedVisualSemantics } from './semantic-projection.mjs';
import { transport } from '../transport.mjs';
import { createHostRevisionGuard } from './host-revision-guard.mjs';

const PAUSE = ms => new Promise(resolve => setTimeout(resolve, ms));
let mounted = false;
let surface = null;
let pending = false;
let handleStatus = () => {};
let clearBuildSurface = () => {};

function locate(node, id) {
  if (node.id === id) return node;
  for (const c of node.children ?? []) {
    const found = locate(c, id);
    if (found) return found;
  }
  return null;
}

// Component intents are UI-local; the semantic projection names the same tap with a
// visual intent. A projection that does not describe this component leaves the tap
// name-only, so rendering and previewing never depend on the projection.
const MEANING_INTENT = Object.freeze({
  'select-component': 'select',
  'preview-only': 'select',
  'inspect-meaning': 'inspect-meaning',
  'preview-layout': 'preview-layout',
  'preview-style': 'preview-style'
});

function meaningOf(intent, semantic) {
  if (!semantic) return null;
  const visual = MEANING_INTENT[intent.intent];
  if (!visual) return null;
  try {
    return projectVisualIntent({ source: intent.source??'tap', targetId: intent.targetId, intent: visual, layout: null, style: null, semantic });
  } catch { return null; }
}

export async function sendProposal() {
  throw new Error('Visual changes require an approved Host control plan. Command pending or uncertain; not resent.');
}

async function repaint() {
  try {
    const status = await transport.request('status');
    handleStatus(status);
  } catch { clearBuildSurface(); /* offline or unauthorized projections must not remain actionable */ }
}

export function mountBuildSurface(mount, { onCommit = () => {}, semantic = null, readOnly = false, onInstances=()=>{}, onSelection=()=>{} } = {}) {
  if (mounted) throw new Error('Build surface already mounted');
  mounted = true;
  const revisionGuard = createHostRevisionGuard();
  let initialDraft = null,instances=new Map(),highlighted=null,selected=null,mountedSemantic=null,inspecting=false,liveData=null;

  function clear() {
    revisionGuard.disconnect();
    surface = null;
    initialDraft = null;instances.clear();highlighted=null;selected=null;mountedSemantic=null;inspecting=false;liveData=null;
    mount?.removeAttribute?.('data-vivim-inspect-mode');
    if (mount?.replaceChildren) mount.replaceChildren();
    onInstances([]);onSelection(null);
  }
  clearBuildSurface = clear;

  function render(s) {
    if (!mount || !mount.replaceChildren || !mount.ownerDocument) return;
    const restore=selected?.revision===s.revision&&selected?.surfaceId===s.surfaceId?selected.instanceId:null;
    instances.clear();highlighted=null;selected=null;mountedSemantic=null;
    renderSurface(mount, s, {
      audience: 'phone',
      tierflow: true,
```

_First 80 of 181 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

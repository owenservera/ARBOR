# File: apps/mobile-relay/generative-ui/renderer.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/generative-ui/renderer.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13315 B |
| Lines | 168 |
| Hash | b22dfaa5ee09 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| runtimeRoot | const | 8 | no | const runtimeRoot = new URL(import.meta.url.startsWith(&#39;file:&#39;) ? &#39;../../../packages/tierflow/src/visual-runtime/&#39; : &#39;../tierflow-runtime/&#39;, import.meta.url); |
| tierflowRuntime | const | 10 | no | const tierflowRuntime = await Promise.all([ import(new URL(&#39;document/import-legacy.ts&#39;, runtimeRoot).href), import(new URL(&#39;render/dom.ts&#39;, runtimeRoot).href) ]).catch(() =&gt; null); |
| BUILD_TYPES | const | 14 | no | const BUILD_TYPES = new Set([&#39;stack&#39;,&#39;grid&#39;,&#39;text&#39;,&#39;card&#39;,&#39;button&#39;,&#39;collection&#39;,&#39;profile-card&#39;,&#39;project-card&#39;,&#39;timeline&#39;,&#39;chart&#39;]); |
| tierflowViewport | function | 15 | yes | export function tierflowViewport(mount) { |
| width | const | 16 | no | const width = mount?.ownerDocument?.defaultView?.innerWidth ?? 390; |
| planTierflowSurface | function | 19 | yes | export function planTierflowSurface(surface, {audience=&#39;phone&#39;,approvedRefs=[],viewportPx=390}={}) { |
| source | const | 21 | no | const source = projectSurface(surface,{audience,refs:new Set(approvedRefs)}); |
| sourceNodes | const | 22 | no | const sourceNodes = new Map(); |
| walk | function | 23 | no | const walk = n =&gt; { |
| converted | const | 33 | no | const converted = importer.importLegacyUiDocument(source,{ ownerRef:&#39;host-projection-unbound-owner&#39;,workspaceRef:source.surfaceId,sourceRef:source.surfaceId, localSelectionControls:true,projectedCard… |
| document | const | 40 | no | const document = converted.document; |
| nodes | const | 41 | no | const nodes = new Map(document.nodes.map(n=&gt;[n.id,n])); |
| identities | const | 42 | no | const identities = new Map(); |
| canonical | const | 46 | no | const canonical = nodes.get(id); |
| a | const | 50 | no | const a = resolveUiSourceIdentity({schema:source.schema,nativeType:n.type,props:n.props}); |
| d | const | 51 | no | const d = resolveUiSourceIdentity({schema:document.schema,nativeType:canonical.type,props:canonical.props}); |
| plan | const | 57 | no | const plan = renderer.renderUiDocument(document,{viewportPx}); |
| FONT | const | 66 | no | const FONT={system:&#39;system-ui, sans-serif&#39;,humanist:&#39;&quot;Segoe UI&quot;, sans-serif&#39;,geometric:&#39;&quot;Century Gothic&quot;, sans-serif&#39;,editorial:&#39;Georgia, serif&#39;,mono:&#39;Consolas, monospace&#39;}; |
| ink | function | 67 | no | function ink(hex){const rgb=[1,3,5].map(i=&gt;{const v=parseInt(hex.slice(i,i+2),16)/255;return v&lt;=.04045?v/12.92:((v+.055)/1.055)**2.4;});const L=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];return (L+.05)/.… |
| renderSurface | function | 68 | yes | export function renderSurface(mount,surface,{audience=&#39;phone&#39;,approvedRefs=[],onIntent=()=&gt;{},tierflow=false,onMounted=null,interactiveLocal=false,liveData=null}={}){ |
| projected | const | 71 | no | const projected=tierflow?planTierflowSurface(surface,{audience,approvedRefs,viewportPx:tierflowViewport(mount)}):null; |
| s | const | 72 | no | const s=projected?.source??projectSurface(surface,{audience,refs:new Set(approvedRefs)}); |
| doc | const | 73 | no | const doc=mount.ownerDocument; |
| element | function | 74 | no | const element=(tag,cls,text)=&gt;{const el=doc.createElement(tag);if(cls)el.className=&#39;vivim-ui-&#39;+cls;if(text!==undefined)el.textContent=text;return el;}; |
| t | const | 75 | no | const t=s.theme; |
| container | const | 76 | no | const container=element(&#39;section&#39;,&#39;surface&#39;);container.setAttribute(&#39;data-surface-id&#39;,s.surfaceId); |
| instances | const | 79 | no | const instances=[]; |
| applyPresentation | function | 81 | no | function applyPresentation(el,n){ |
| p | const | 82 | no | const p=n.presentation;if(!p)return; |
| render | function | 89 | no | const render=(n,planNode=null,parentId=null)=&gt;{ |
| p | const | 91 | no | const p=projected?projected.nodes.get(n.id).props:n.props;let el; |
| list | const | 104 | no | const list=element(&#39;ul&#39;,&#39;items&#39;); |
| view | const | 108 | no | const view=liveData?.[n.liveBinding]; |
| available | const | 109 | no | const available=view?.state===&#39;source-backed&#39;&amp;&amp;Number.isSafeInteger(view.revision)&amp;&amp;Number.isSafeInteger(view.total)&amp;&amp;Array.isArray(view.items)&amp;&amp;view.items.length&lt;=16&amp;&amp;view.total&gt;=view.items.length; |
| planItem | const | 116 | no | const planItem=planNode?.children[i]; |
| li | const | 118 | no | const li=element(&#39;li&#39;,&#39;item&#39;,planItem?.text??item.label); |
| values | const | 121 | no | const values=p.items.map(x=&gt;x.value),min=Math.min(0,...values),max=Math.max(0,...values),range=max-min; |
| zero | const | 122 | no | const zero=range?(-min/range)*100:50; |
| extent | const | 123 | no | const extent=range?Math.abs(item.value)/range*100:0; |
| track | const | 124 | no | const track=element(&#39;span&#39;,&#39;chart-track&#39;);track.setAttribute(&#39;aria-hidden&#39;,&#39;true&#39;); |
| axis | const | 125 | no | const axis=element(&#39;span&#39;,&#39;chart-zero&#39;);axis.style.left=zero+&#39;%&#39;; |
| bar | const | 126 | no | const bar=element(&#39;span&#39;,&#39;chart-bar&#39;);bar.style.left=(item.value&lt;0?zero-extent:zero)+&#39;%&#39;;bar.style.width=extent+&#39;%&#39;;bar.style.backgroundColor=n.presentation?.background?ink(n.presentation.background)… |
| settings | const | 136 | no | const settings=Object.fromEntries(Object.entries(p).filter(([k])=&gt;[&#39;direction&#39;,&#39;gap&#39;,&#39;columns&#39;,&#39;variant&#39;].includes(k))); |
| structuralChildren | const | 153 | no | const structuralChildren=[&#39;collection&#39;,&#39;timeline&#39;,&#39;chart&#39;].includes(n.type)?[]:planNode.children; |
| sourceChild | const | 156 | no | const sourceChild=n.children.find(c=&gt;c.id===child.id); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./catalog.mjs | import | 2 | [apps/mobile-relay/generative-ui/catalog.mjs](./catalog.mjs.md) |
| ../vec/ui-taxonomy/registry.mjs | import | 3 | [apps/mobile-relay/vec/ui-taxonomy/registry.mjs](../vec/ui-taxonomy/registry.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/build-canvas.mjs](../build-canvas.mjs.md) | ./generative-ui/renderer.mjs |
| [apps/mobile-relay/generative-ui/phone-surface.mjs](./phone-surface.mjs.md) | ./renderer.mjs |
| [apps/mobile-relay/test/component-presentation.test.mjs](../test/component-presentation.test.mjs.md) | ../generative-ui/renderer.mjs |
| [apps/mobile-relay/test/generative-ui.test.mjs](../test/generative-ui.test.mjs.md) | ../generative-ui/renderer.mjs |
| [apps/mobile-relay/test/tierflow-build.test.mjs](../test/tierflow-build.test.mjs.md) | ../generative-ui/renderer.mjs |
| [apps/mobile-relay/test/workspace-template-wiring.test.mjs](../test/workspace-template-wiring.test.mjs.md) | ../generative-ui/renderer.mjs |
| [apps/vivim-host/bootstrap/service.mjs](../../vivim-host/bootstrap/service.mjs.md) | ../../mobile-relay/generative-ui/renderer.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// GUI01 single safe DOM renderer. Never uses innerHTML, eval, remote assets, or code-bearing handlers.
import {projectSurface,invalid,componentPresentationBindings} from './catalog.mjs';
import {resolveUiSourceIdentity} from '../vec/ui-taxonomy/registry.mjs';

// One source of TierFlow computation. The Host serves only these reviewed TS
// modules with types stripped; Node/Bun consumers use the same package sources.
// A missing runtime is a refusal for Build, never a legacy-render success.
const runtimeRoot = new URL(import.meta.url.startsWith('file:')
  ? '../../../packages/tierflow/src/visual-runtime/' : '../tierflow-runtime/', import.meta.url);
const tierflowRuntime = await Promise.all([
  import(new URL('document/import-legacy.ts', runtimeRoot).href),
  import(new URL('render/dom.ts', runtimeRoot).href)
]).catch(() => null);
const BUILD_TYPES = new Set(['stack','grid','text','card','button','collection','profile-card','project-card','timeline','chart']);
export function tierflowViewport(mount) {
  const width = mount?.ownerDocument?.defaultView?.innerWidth ?? 390;
  return Math.max(240, Math.min(3840, Math.round(width) || 390));
}
export function planTierflowSurface(surface, {audience='phone',approvedRefs=[],viewportPx=390}={}) {
  if (!tierflowRuntime) invalid('TierFlow runtime unavailable');
  const source = projectSurface(surface,{audience,refs:new Set(approvedRefs)});
  const sourceNodes = new Map();
  const walk = n => {
    if (!BUILD_TYPES.has(n.type)) invalid('unsupported TierFlow component: '+n.type);
    sourceNodes.set(n.id,n);
    n.children.forEach(walk);
  };
  walk(source.tree);
  for(const n of sourceNodes.values())if(n.type==='button'&&n.props.targetId&&!sourceNodes.has(n.props.targetId))invalid('local selection target unavailable');
  const [importer, renderer] = tierflowRuntime;
  // Scope labels satisfy the inert projection schema only. No identity, grant
  // or authority is derived here; the caller owns the Host revision guard.
  const converted = importer.importLegacyUiDocument(source,{
    ownerRef:'host-projection-unbound-owner',workspaceRef:source.surfaceId,sourceRef:source.surfaceId,
    localSelectionControls:true,projectedCardRefs:approvedRefs,projectedPresentation:true
  });
  if (converted.status !== 'preview' ||
      converted.losses.some(loss=>loss.code!=='THEME_NOT_MIGRATED'))
    invalid('TierFlow document conversion refused');
  const document = converted.document;
  const nodes = new Map(document.nodes.map(n=>[n.id,n]));
  const identities = new Map();
  if (document.revision!==source.revision || document.rootId!==source.tree.id ||
      nodes.size!==sourceNodes.size) invalid('TierFlow document identity mismatch');
  for (const [id,n] of sourceNodes) {
    const canonical = nodes.get(id);
    if (!canonical || canonical.type!==n.type ||
        JSON.stringify(canonical.children)!==JSON.stringify(n.children.map(c=>c.id)))
      invalid('TierFlow source identity mismatch');
    const a = resolveUiSourceIdentity({schema:source.schema,nativeType:n.type,props:n.props});
    const d = resolveUiSourceIdentity({schema:document.schema,nativeType:canonical.type,props:canonical.props});
    if (a.outcome!=='mapped' || d.outcome!=='mapped' ||
        a.source.status!=='source-closed' || d.source.status!=='source-closed' ||
        a.component.id!==d.component.id) invalid('TierFlow canonical component identity mismatch');
    identities.set(id,a.component.id);
  }
  const plan = renderer.renderUiDocument(document,{viewportPx});
  if (plan.status!=='ok' || plan.documentId!==document.documentId ||
      plan.revision!==source.revision || plan.root.children.length!==1 ||
      plan.root.children[0].id!==document.rootId ||
      plan.trace.length!==nodes.size ||
      plan.trace.some(t=>t.outcome!=='rendered'||t.id!==t.sourceId||!nodes.has(t.id)))
    invalid('TierFlow render plan refused');
  return {source,document,nodes,identities,plan};
}
const FONT={system:'system-ui, sans-serif',humanist:'"Segoe UI", sans-serif',geometric:'"Century Gothic", sans-serif',editorial:'Georgia, serif',mono:'Consolas, monospace'};
function ink(hex){const rgb=[1,3,5].map(i=>{const v=parseInt(hex.slice(i,i+2),16)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});const L=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];return (L+.05)/.05>=1.05/(L+.05)?'#000000':'#ffffff';}
export function renderSurface(mount,surface,{audience='phone',approvedRefs=[],onIntent=()=>{},tierflow=false,onMounted=null,interactiveLocal=false,liveData=null}={}){
  if(!mount||typeof mount.replaceChildren!=='function'||!mount.ownerDocument)invalid('DOM mount required');
  if(typeof onIntent!=='function')invalid('intent handler required');
  const projected=tierflow?planTierflowSurface(surface,{audience,approvedRefs,viewportPx:tierflowViewport(mount)}):null;
  const s=projected?.source??projectSurface(surface,{audience,refs:new Set(approvedRefs)});
  const doc=mount.ownerDocument;
  const element=(tag,cls,text)=>{const el=doc.createElement(tag);if(cls)el.className='vivim-ui-'+cls;if(text!==undefined)el.textContent=text;return el;};
  const t=s.theme;
  const container=element('section','surface');container.setAttribute('data-surface-id',s.surfaceId);
  Object.assign(container.style,{backgroundColor:t.background,color:ink(t.background),fontFamily:FONT[t.fontFamily],fontSize:t.fontSizePx+'px',borderRadius:t.radiusPx+'px'});
  if(projected){container.setAttribute('data-tierflow-document',projected.document.documentId);container.setAttribute('data-tierflow-revision',String(s.revision));container.setAttribute('data-tierflow-status',projected.plan.status);}
  const instances=[];
  // One bounded DOM mapping, shared by preview and the committed mount. No model CSS.
```

_First 80 of 169 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

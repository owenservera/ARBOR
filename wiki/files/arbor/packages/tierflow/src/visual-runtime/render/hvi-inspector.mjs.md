# File: packages/tierflow/src/visual-runtime/render/hvi-inspector.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/render/hvi-inspector.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8462 B |
| Lines | 136 |
| Hash | e244f29fae85 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HVI_RENDER_SCHEMA | const | 11 | yes | export const HVI_RENDER_SCHEMA = &#39;tierflow.hvi.render/1&#39;; |
| HVI_INSPECTOR_FEATURE | const | 12 | yes | export const HVI_INSPECTOR_FEATURE = Object.freeze({ id:&#39;tierflow.hvi.inspector&#39;, enabled:false, liveResultRendering:false, syntheticPreviewOnly:true, requiredCapability:&#39;arbor.hvi.compare.pinned/1&#39;,… |
| ID | const | 17 | no | const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/; |
| label | const | 18 | no | const label = safeHviText; |
| state | function | 19 | no | function state(mode) { |
| makeDocument | function | 32 | no | function makeDocument(view, revision, expandedRowIds, ownerRef, workspaceRef) { |
| nodes | const | 33 | no | const nodes=[], root={id:&#39;hvi_root&#39;,type:&#39;stack&#39;,props:{direction:&#39;vertical&#39;,gap:&#39;md&#39;}, |
| group | variable | 38 | no | let group=null; |
| nextGroup | function | 39 | no | const nextGroup=()=&gt;{ |
| id | const | 40 | no | const id=&#39;hvi_group_&#39;+String(nodes.length).padStart(2,&#39;0&#39;); |
| add | function | 45 | no | const add=(kind, value)=&gt;{ |
| id | const | 48 | no | const id=&#39;hvi_&#39;+String(nodes.length).padStart(2,&#39;0&#39;); |
| safe | const | 49 | no | const safe=label(value,kind===&#39;card&#39;?80:220); |
| node | const | 50 | no | const node=kind===&#39;card&#39; |
| p | const | 67 | no | const p=view.pins.find(x=&gt;x.pinId===c.sourcePinId); |
| refs | const | 75 | no | const refs=row.evidenceRefs.slice(0,2); |
| doc | const | 85 | no | const doc={schema:&#39;vivim.ui-document/1&#39;,documentId:&#39;hvi_version_inspector&#39;, |
| renderHviInspector | function | 96 | yes | export function renderHviInspector({ envelope=null, selectedPins=null,targetPinId=null,offset=0,limit=16, synthetic=false,previewSynthetic=false,permission=&#39;not_requested&#39;, phase=&#39;idle&#39;, expandedRowI… |
| needsRevision | const | 103 | no | const needsRevision = envelope!==null\|\|expectedRevision!==null\|\|currentRevision!==null; |
| stale | const | 104 | no | const stale = needsRevision&amp;&amp;(!Number.isSafeInteger(expectedRevision)\|\|expectedRevision&lt;0\|\| expectedRevision&gt;1e9\|\|currentRevision!==expectedRevision); |
| invalidScope | const | 106 | no | const invalidScope=!ID.test(ownerRef)\|\|!ID.test(workspaceRef); |
| view | variable | 110 | no | let view; |
| denied | const | 111 | no | const denied=permission===&#39;denied&#39;\|\|permission===&#39;revoked&#39;; |
| document | const | 126 | no | const document=makeDocument(view,Number.isSafeInteger(currentRevision)&amp;&amp;currentRevision&gt;=0?currentRevision:0, expandedRowIds,ownerRef,workspaceRef); |
| checked | const | 128 | no | const checked=validateUiDocument(document); |
| plan | const | 131 | no | const plan=renderUiDocument(checked.document,{viewportPx}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../knowledge/hvi-inspector.mjs | import | 7 | [packages/tierflow/src/visual-runtime/knowledge/hvi-inspector.mjs](../knowledge/hvi-inspector.mjs.md) |
| ../document/validate.ts | import | 8 | [packages/tierflow/src/visual-runtime/document/validate.ts](../document/validate.ts.md) |
| ./dom.ts | import | 9 | [packages/tierflow/src/visual-runtime/render/dom.ts](./dom.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/tests/hvi-inspector.test.mjs](../../../tests/hvi-inspector.test.mjs.md) | ../src/visual-runtime/render/hvi-inspector.mjs |
| [tests/hq-version-intelligence/g2-host-ui.test.mjs](../../../../../tests/hq-version-intelligence/g2-host-ui.test.mjs.md) | ../../packages/tierflow/src/visual-runtime/render/hvi-inspector.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * HVI U -> the existing canonical TierFlow document validator + semantic renderer.
 * This is a read-only view adapter. The ONE UiCore/UiStore publisher is untouched.
 * No network, Host authorization simulation, provider control, or browser effects.
 * Source reports are HIDDEN until H/G2 live authorization is independently verified.
 */
import { projectHviInspector, HVI_INSPECTOR_SCHEMA, safeHviText } from '../knowledge/hvi-inspector.mjs';
import { validateUiDocument } from '../document/validate.ts';
import { renderUiDocument } from './dom.ts';

export const HVI_RENDER_SCHEMA = 'tierflow.hvi.render/1';
export const HVI_INSPECTOR_FEATURE = Object.freeze({
  id:'tierflow.hvi.inspector', enabled:false, liveResultRendering:false,
  syntheticPreviewOnly:true, requiredCapability:'arbor.hvi.compare.pinned/1',
  hostApproval:'per-invocation-current-grant', activePublisher:'existing-UiCore',
});
const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/;
const label = safeHviText;
function state(mode) {
  return {
    empty:'No comparison has been run. Select 2 or more immutable revision pins.',
    'request-access':'Source access must be requested through Host for each comparison.',
    denied:'Source access denied or revoked. No prior report is displayed.',
    progress:'Host comparison in progress. Cancel using the existing Host task control.',
    cancelled:'Comparison cancelled. No partial result is retained here.',
    stale:'Source or publisher revision changed. Request a fresh authorized report.',
    partial:'Partial source evidence. Unknown does not mean missing.',
    'source-report':'Read-only source findings. Runtime verification remains UNRUN.',
    unavailable:'Version inspection is unavailable without a valid Host report.',
  }[mode] ?? 'Version inspection is unavailable.';
}
function makeDocument(view, revision, expandedRowIds, ownerRef, workspaceRef) {
  const nodes=[], root={id:'hvi_root',type:'stack',props:{direction:'vertical',gap:'md'},
    a11y:{role:'main',name:'HQ pinned version inspector'},children:[]};
  nodes.push(root);
  // Keep the existing canonical 24-child limit by grouping sections; never
  // increase UiDocument limits or introduce a second renderer.
  let group=null;
  const nextGroup=()=>{
    const id='hvi_group_'+String(nodes.length).padStart(2,'0');
    group={id,type:'stack',props:{direction:'vertical',gap:'sm'},
      a11y:{role:'group',name:'Version inspector section'},children:[]};
    nodes.push(group);root.children.push(id);
  };
  const add=(kind, value)=>{
    if(nodes.length>=62) return false;
    if(group===null||group.children.length>=20) nextGroup();
    const id='hvi_'+String(nodes.length).padStart(2,'0');
    const safe=label(value,kind==='card'?80:220);
    const node=kind==='card'
      ? {id,type:'card',props:{title:safe},a11y:{role:'region',name:safe},children:[]}
      : {id,type:'text',props:{value:safe},a11y:{role:'text',name:safe.slice(0,120)},children:[]};
    nodes.push(node);group.children.push(id);return true;
  };
  add('card','HQ version inspector - read only');
  add('text',state(view.mode));
  add('text','No source scanning, migration, merging or publisher actions are available here.');
  if(view.synthetic) add('card','SYNTHETIC FIXTURE - NOT A REAL REPOSITORY COMPARISON');
  if(view.mode==='source-report'||view.mode==='partial') {
    add('text','Target revision: '+(view.pins.find(x=>x.pinId===view.targetPinId)?.sha.slice(0,12)??'UNKNOWN'));
    add('card','Pinned version selectors (immutable)');
    for(const p of view.pins.slice(0,16)) {
      add('text',(p.pinId===view.targetPinId?'TARGET ':'SOURCE ')+label(p.repo,90)+' @ '+p.sha.slice(0,12)+' - '+p.completeness);
    }
    add('card','Target-relative source coverage');
    for(const c of view.coverage.slice(0,16)) {
      const p=view.pins.find(x=>x.pinId===c.sourcePinId);
      add('text',label(p?.repo??'source',90)+': '+label(c.sourceCompleteness,20)+' / target '+label(c.targetCompleteness,20)+'; observed '+String(c.observedFiles));
    }
    add('card','Source findings (capability equivalence not inferred)');
    // Deliberately bounded to protect canonical 64-node/32KiB renderer limits.
    for(const row of view.rows.slice(0,8)) {
      if(!add('text',label(row.originPath??'unknown',95)+' -> '+label(row.sourceState,40)+'; certainty '+label(row.certainty,35))) break;
      if(expandedRowIds.includes(row.id)) {
        const refs=row.evidenceRefs.slice(0,2);
        if(!refs.length) add('text','No provenance receipt provided.');
        for(const ref of refs) add('text','Source evidence: '+label(ref,200));
      }
    }
    add('text','Rows '+String(view.page?.offset??0)+'-'+String((view.page?.offset??0)+Math.min(view.rows.length,8))+
```

_First 80 of 137 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)

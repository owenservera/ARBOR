# File: apps/mobile-relay/generative-ui/semantic-projection.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/generative-ui/semantic-projection.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9187 B |
| Lines | 122 |
| Hash | 0c112608a3c4 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SEMANTIC_SCHEMA | const | 5 | yes | export const SEMANTIC_SCHEMA=&#39;vivim.semantic-projection/1&#39;; |
| LAYOUT_INTENTS | const | 6 | yes | export const LAYOUT_INTENTS=Object.freeze([&#39;cluster&#39;,&#39;timeline&#39;,&#39;mindmap&#39;,&#39;kanban&#39;,&#39;grid&#39;,&#39;free&#39;]); |
| SOURCE_PASSES | const | 7 | yes | export const SOURCE_PASSES=Object.freeze([&#39;F02&#39;,&#39;F01&#39;,&#39;D03&#39;,&#39;D04&#39;,&#39;D05&#39;,&#39;D06&#39;,&#39;D07&#39;]); |
| DEEP_KIND_LAYOUT | const | 8 | no | const DEEP_KIND_LAYOUT=Object.freeze({card:&#39;grid&#39;,collection:&#39;grid&#39;,timeline:&#39;timeline&#39;,mode:&#39;cluster&#39;}); |
| VIEW_KIND | const | 9 | no | const VIEW_KIND=Object.freeze({card:&#39;card&#39;,collection:&#39;collection&#39;,timeline:&#39;timeline&#39;,mode:&#39;mode&#39;}); |
| uniq | function | 10 | no | function uniq(a){return [...new Set(a)];} |
| boundedRef | function | 11 | no | function boundedRef(v){return id(v);} |
| node | function | 12 | no | function node(ref,{label,pass,kind,privacy,basis=&#39;unknown&#39;,freshness=&#39;unknown&#39;,confidence=null}={}){ |
| requireCompiled | function | 15 | no | function requireCompiled(pass,compiled,worldId,requestId){ |
| schema | const | 19 | no | const schema=pass===&#39;F02&#39;?&#39;vivim.render-plan/1&#39;:pass===&#39;F01&#39;?&#39;vivim.bootstrap-profile/1&#39;:&#39;vivim.bootstrap-output/1&#39;; |
| projectBootstrapSemantics | function | 22 | yes | export function projectBootstrapSemantics({pass,compiled,worldId,requestId,surfaceId=&#39;my-space&#39;}={}) { |
| objects | const | 24 | no | const objects=[],views=[],edges=[],unknowns=[]; |
| privatePass | const | 25 | no | const privatePass=pass===&#39;D06&#39;\|\|pass===&#39;D07&#39;; |
| seen | const | 26 | no | const seen=new Set(); |
| addObject | function | 27 | no | const addObject=(ref,attrs)=&gt;{boundedRef(ref);if(!seen.has(ref)){objects.push(node(ref,attrs));seen.add(ref);}}; |
| addView | function | 28 | no | const addView=(v)=&gt;{id(v.componentId);if(v.objectRefs.some(ref=&gt;!seen.has(ref)))invalid(&#39;view points at missing knowledge&#39;);views.push(v);}; |
| claims | const | 34 | no | const claims=new Map((compiled.claims??[]).filter(c=&gt;c.section===&#39;focus&#39;).map(c=&gt;[c.label?.toLowerCase(),c])); |
| claim | const | 41 | no | const claim=claims.get(card.focus.toLowerCase());if(!claim\|\|!seen.has(claim.id))continue; |
| privacy | const | 47 | no | const privacy=privatePass?&#39;pc-private&#39;:&#39;phone&#39;; |
| projection | const | 66 | no | const projection={schema:SEMANTIC_SCHEMA,worldId,surfaceId,pass,requestId,objects,views,edges,unknowns:uniq(unknowns), |
| projectSemanticsForAudience | function | 71 | yes | export function projectSemanticsForAudience(projection,{audience=&#39;phone&#39;}={}){ |
| objects | const | 75 | no | const objects=(projection.objects??[]).filter(o=&gt;audience===&#39;pc&#39;\|\|o.privacy===&#39;phone&#39;); |
| visible | const | 76 | no | const visible=new Set(objects.map(o=&gt;o.id)); |
| views | const | 77 | no | const views=(projection.views??[]).filter(v=&gt;(audience===&#39;pc&#39;\|\|v.privacy===&#39;phone&#39;)&amp;&amp;v.objectRefs.every(r=&gt;visible.has(&#39;k.&#39;+r))); |
| viewIds | const | 78 | no | const viewIds=new Set(views.map(v=&gt;v.componentId)); |
| edges | const | 79 | no | const edges=(projection.edges??[]).filter(e=&gt;viewIds.has(e.from)&amp;&amp;visible.has(e.to)); |
| VISUAL_INTENTS | const | 82 | yes | export const VISUAL_INTENTS=Object.freeze([&#39;select&#39;,&#39;preview-layout&#39;,&#39;preview-style&#39;,&#39;inspect-meaning&#39;]); |
| INTENT_INPUTS | const | 83 | yes | export const INTENT_INPUTS=Object.freeze([&#39;tap&#39;,&#39;language&#39;,&#39;glyph&#39;,&#39;gesture&#39;,&#39;keyboard&#39;]); |
| projectMountedVisualSemantics | function | 85 | yes | export function projectMountedVisualSemantics({surfaceId,revision,instances}={}){ |
| seen | const | 88 | no | const seen=new Set(),views=instances.map(row=&gt;{ const componentId=id(row.instanceId); if(seen.has(componentId)\|\|row.surfaceId!==surfaceId\|\|row.revision!==revision\|\| typeof row.componentId!==&#39;string&#39;\|… |
| componentId | const | 89 | no | const componentId=id(row.instanceId); |
| projectVisualIntent | function | 98 | yes | export function projectVisualIntent({source,targetId,intent,layout=null,style=null,semantic}={}){ |
| view | const | 102 | no | const view=semantic.views.find(v=&gt;v.componentId===targetId);if(!view)invalid(&#39;unknown target&#39;); |
| meaning | const | 106 | no | const meaning={schema:&#39;vivim.visual-intent/1&#39;,surfaceId:semantic.surfaceId,targetId,intent, |
| LEGACY_MUTATION_COMPAT | const | 113 | yes | export const LEGACY_MUTATION_COMPAT=Object.freeze({ replace:{uiOp:&#39;replace-props&#39;,status:&#39;conditional&#39;,note:&#39;only same-component props; replacing type requires explicit new proposal&#39;}, insert:{uiOp:&#39;… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./portable-digest.mjs | import | 3 | [apps/mobile-relay/generative-ui/portable-digest.mjs](./portable-digest.mjs.md) |
| ./catalog.mjs | import | 4 | [apps/mobile-relay/generative-ui/catalog.mjs](./catalog.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/generative-ui/bootstrap-adapters.mjs](./bootstrap-adapters.mjs.md) | ./semantic-projection.mjs |
| [apps/mobile-relay/generative-ui/phone-surface.mjs](./phone-surface.mjs.md) | ./semantic-projection.mjs |
| [apps/mobile-relay/test/generative-browser-compat.test.mjs](../test/generative-browser-compat.test.mjs.md) | ../generative-ui/semantic-projection.mjs |
| [apps/mobile-relay/test/generative-semantic.test.mjs](../test/generative-semantic.test.mjs.md) | ../generative-ui/semantic-projection.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// GUI02 semantic projection: derivative, read-only representation of Host-compiled bootstrap.
// Knowledge identity, UI instance and command intent are distinct. No new World writer.
import {digestJson,utf8Length} from './portable-digest.mjs';
import {id,str,invalid} from './catalog.mjs';
export const SEMANTIC_SCHEMA='vivim.semantic-projection/1';
export const LAYOUT_INTENTS=Object.freeze(['cluster','timeline','mindmap','kanban','grid','free']);
export const SOURCE_PASSES=Object.freeze(['F02','F01','D03','D04','D05','D06','D07']);
const DEEP_KIND_LAYOUT=Object.freeze({card:'grid',collection:'grid',timeline:'timeline',mode:'cluster'});
const VIEW_KIND=Object.freeze({card:'card',collection:'collection',timeline:'timeline',mode:'mode'});
function uniq(a){return [...new Set(a)];}
function boundedRef(v){return id(v);}
function node(ref,{label,pass,kind,privacy,basis='unknown',freshness='unknown',confidence=null}={}){
  return {id:'k.'+boundedRef(ref),objectRef:ref,kind,pass,label:str(label,120),privacy,basis,freshness,confidence};
}
function requireCompiled(pass,compiled,worldId,requestId){
  if(!SOURCE_PASSES.includes(pass))invalid('unknown semantic pass');
  id(worldId);id(requestId);
  if(compiled?.worldId!==worldId||compiled?.requestId!==requestId)invalid('semantic provenance mismatch');
  const schema=pass==='F02'?'vivim.render-plan/1':pass==='F01'?'vivim.bootstrap-profile/1':'vivim.bootstrap-output/1';
  if(compiled?.schema!==schema||((pass==='F02'?compiled.pass:compiled.passId)!==pass))invalid('semantic source schema mismatch');
}
export function projectBootstrapSemantics({pass,compiled,worldId,requestId,surfaceId='my-space'}={}) {
  requireCompiled(pass,compiled,worldId,requestId);id(surfaceId);
  const objects=[],views=[],edges=[],unknowns=[];
  const privatePass=pass==='D06'||pass==='D07';
  const seen=new Set();
  const addObject=(ref,attrs)=>{boundedRef(ref);if(!seen.has(ref)){objects.push(node(ref,attrs));seen.add(ref);}};
  const addView=(v)=>{id(v.componentId);if(v.objectRefs.some(ref=>!seen.has(ref)))invalid('view points at missing knowledge');views.push(v);};
  if(pass==='F02'){
    // This is a design token proposal, not a person or knowledge claim.
    views.push({componentId:'root',viewKind:'theme',layoutIntent:'grid',objectRefs:[],privacy:'phone',suggested:true});
    for(const u of compiled.assertions?.unknowns??[]) unknowns.push(str(u,120));
  }else if(pass==='F01'){
    const claims=new Map((compiled.claims??[]).filter(c=>c.section==='focus').map(c=>[c.label?.toLowerCase(),c]));
    for(const c of claims.values()){
      if(!c?.id||!c.label||!c.statement||c.basis==='tentative_inference')continue;
      addObject(c.id,{label:c.label,pass,kind:c.kind??'focus',privacy:'phone',basis:c.basis,freshness:c.freshness});
    }
    for(const card of compiled.cards??[]){
      if(!card.focus)continue;
      const claim=claims.get(card.focus.toLowerCase());if(!claim||!seen.has(claim.id))continue;
      addView({componentId:'f01.'+id(card.id),viewKind:claim.kind==='project'?'project-card':'profile-card',layoutIntent:'grid',objectRefs:[claim.id],privacy:'phone',suggested:true});
      edges.push({from:'f01.'+card.id,to:'k.'+claim.id,relation:'presents',basis:'exact-focus-reference'});
    }
    for(const u of compiled.unknowns??[])unknowns.push(str(u,120));
  }else{
    const privacy=privatePass?'pc-private':'phone';
    for(const a of compiled.assertions??[]){
      addObject(id(a.id),{label:str(a.label,80),pass,kind:a.section,privacy,
        basis:a.basis,freshness:a.freshness,confidence:a.confidence});
    }
    // Observations are evidence objects. No unsupported endpoints are fabricated into graph edges.
    for(const o of compiled.observations??[]){
      addObject(id(o.id),{label:str(o.category,64),pass,kind:'observation',
        privacy:privatePass||o.sensitive===true?'pc-private':'phone',confidence:o.confidence});
    }
    for(const v of compiled.viewProposals??[]){
      id(v.id);if(!Object.hasOwn(DEEP_KIND_LAYOUT,v.kind))invalid('unknown deep view kind');
      // A proposed view is an intention, not a confirmed object or inferred relation to others.
      views.push({componentId:pass.toLowerCase()+'.'+v.id,viewKind:VIEW_KIND[v.kind],layoutIntent:DEEP_KIND_LAYOUT[v.kind],
        objectRefs:[],sourceRef:v.id,privacy,suggested:true});
    }
    for(const u of compiled.unknowns??[])unknowns.push(str(u,140));
  }
  if(objects.length>64||views.length>24||edges.length>32||unknowns.length>16)invalid('semantic bounds exceeded');
  const projection={schema:SEMANTIC_SCHEMA,worldId,surfaceId,pass,requestId,objects,views,edges,unknowns:uniq(unknowns),
    authority:'derived-from-compiled-bootstrap',effects:'none',persisted:false};
  if(utf8Length(JSON.stringify(projection))>32768)invalid('semantic projection oversized');
  return projection;
}
export function projectSemanticsForAudience(projection,{audience='phone'}={}){
  if(!projection||projection.schema!==SEMANTIC_SCHEMA)invalid('invalid semantic projection');
  if(!['pc','phone'].includes(audience))invalid('unknown audience');
  // Always reconstruct sanitized output; never trust client-authored privacy or allow shallow leaks.
  const objects=(projection.objects??[]).filter(o=>audience==='pc'||o.privacy==='phone');
  const visible=new Set(objects.map(o=>o.id));
  const views=(projection.views??[]).filter(v=>(audience==='pc'||v.privacy==='phone')&&v.objectRefs.every(r=>visible.has('k.'+r)));
  const viewIds=new Set(views.map(v=>v.componentId));
  const edges=(projection.edges??[]).filter(e=>viewIds.has(e.from)&&visible.has(e.to));
  return {...projection,objects,views,edges,unknowns:audience==='pc'?projection.unknowns:[],effects:'none',persisted:false};
```

_First 80 of 123 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

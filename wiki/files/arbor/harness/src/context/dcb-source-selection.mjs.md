# File: harness/src/context/dcb-source-selection.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/context/dcb-source-selection.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6211 B |
| Lines | 103 |
| Hash | eb0e7b317fd1 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DCB_SOURCE_SELECTION_SCHEMA | const | 5 | yes | export const DCB_SOURCE_SELECTION_SCHEMA=&#39;vivim.dcb-source-selection/1&#39;; |
| REF | const | 6 | no | const REF=/^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/; |
| TRUST | const | 7 | no | const TRUST={owner_confirmed:6,observed:4,sourced:3,provider_reported:1,untrusted:0}; |
| CLASS_TO_FIELD | const | 8 | no | const CLASS_TO_FIELD={ |
| STOP | const | 13 | no | const STOP=new Set([&#39;this&#39;,&#39;that&#39;,&#39;with&#39;,&#39;from&#39;,&#39;what&#39;,&#39;about&#39;,&#39;have&#39;,&#39;will&#39;,&#39;your&#39;,&#39;their&#39;,&#39;into&#39;,&#39;where&#39;,&#39;which&#39;,&#39;when&#39;,&#39;then&#39;,&#39;them&#39;,&#39;these&#39;,&#39;those&#39;,&#39;there&#39;,&#39;been&#39;,&#39;being&#39;,&#39;were&#39;,&#39;the&#39;,&#39;and&#39;,&#39;for&#39;… |
| fail | function | 14 | no | const fail=(code,message)=&gt;Object.assign(new Error(message),{code}); |
| refs | function | 15 | no | const refs=(arr,name)=&gt;{ |
| words | function | 20 | no | const words=t=&gt;[...new Set((String(t).toLowerCase().match(/[a-z0-9_-]{3,}/g)??[]).filter(x=&gt;!STOP.has(x)))]; |
| candidateMetadata | function | 21 | no | function candidateMetadata(c) { |
| selectDcbSources | function | 33 | yes | export function selectDcbSources({bundleSourceRefs,sourceCandidates,taskText=&#39;&#39;, mandatorySourceRefs=[],maxSources=32,flavorComposition=null,now}={}) { |
| universe | const | 35 | no | const universe=refs(bundleSourceRefs,&#39;bundleSourceRefs&#39;); |
| mandatory | const | 36 | no | const mandatory=refs(mandatorySourceRefs,&#39;mandatorySourceRefs&#39;); |
| byRef | const | 47 | no | const byRef=new Map(); |
| c | const | 49 | no | const c=candidateMetadata(c0); |
| valid | const | 56 | no | const valid=universe.filter(x=&gt;byRef.has(x)&amp;&amp;![&#39;superseded&#39;,&#39;revoked&#39;].includes(byRef.get(x).status)); |
| terms | const | 59 | no | const terms=words(taskText); |
| options | const | 60 | no | const options=valid.map(ref=&gt;{ const c=byRef.get(ref); const bag=new Set(words([...(c.keywords??[]),c.ref,c.classification,c.layer??&#39;&#39;].join(&#39; &#39;))); const match=terms.filter(x=&gt;bag.has(x)).length; co… |
| c | const | 61 | no | const c=byRef.get(ref); |
| bag | const | 62 | no | const bag=new Set(words([...(c.keywords??[]),c.ref,c.classification,c.layer??&#39;&#39;].join(&#39; &#39;))); |
| coverage | const | 64 | no | const coverage=terms.length?match/terms.length:0; |
| strength | const | 65 | no | const strength=TRUST[c.trust]??0; |
| field | const | 66 | no | const field=CLASS_TO_FIELD[c.classification]??&#39;provenance&#39;; |
| domain | const | 67 | no | const domain=Number(flavorComposition?.relevance?.[field]??1); |
| safeDomain | const | 68 | no | const safeDomain=Number.isFinite(domain)?Math.max(0,Math.min(10,domain)):1; |
| age | const | 69 | no | const age=c.updatedAt&amp;&amp;Number.isFinite(Date.parse(c.updatedAt)) |
| freshness | const | 71 | no | const freshness=Math.exp(-age/90); |
| historical | const | 72 | no | const historical=c.status===&#39;historical&#39;?3:0; |
| score | const | 73 | no | const score=Math.round((coverage*100+strength*8+safeDomain*3+freshness*10-historical*10)*100)/100; |
| optionsByRef | const | 77 | no | const optionsByRef=new Map(options.map(x=&gt;[x.ref,x])); |
| chosen | const | 78 | no | const chosen=mandatory.map(x=&gt;optionsByRef.get(x)); |
| remaining | const | 79 | no | const remaining=options.filter(x=&gt;!x.mandatory); |
| ranked | const | 83 | no | const ranked=remaining.map(x=&gt;{ const entityPenalty=x.entityRef&amp;&amp;chosen.some(y=&gt;y.entityRef===x.entityRef)?15:0; const classPenalty=chosen.some(y=&gt;y.classification===x.classification)?4:0; return {..… |
| entityPenalty | const | 84 | no | const entityPenalty=x.entityRef&amp;&amp;chosen.some(y=&gt;y.entityRef===x.entityRef)?15:0; |
| classPenalty | const | 85 | no | const classPenalty=chosen.some(y=&gt;y.classification===x.classification)?4:0; |
| best | const | 88 | no | const best=ranked[0]; |
| selectedRefs | const | 92 | no | const selectedRefs=chosen.map(x=&gt;x.ref).sort(); |
| omissions | const | 93 | no | const omissions=universe.filter(x=&gt;!selectedRefs.includes(x)).map(ref=&gt;({ ref,reason:!byRef.has(ref)?&#39;metadata_unavailable&#39;: [&#39;superseded&#39;,&#39;revoked&#39;].includes(byRef.get(ref).status)?&#39;invalidated&#39;: &#39;l… |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [harness/bench/dcb-synthetic-eval.mjs](../../bench/dcb-synthetic-eval.mjs.md) | ../src/context/dcb-source-selection.mjs |
| [harness/src/context/dcb-v2-planner.mjs](./dcb-v2-planner.mjs.md) | ./dcb-source-selection.mjs |
| [harness/test/context/dcb-source-selection.test.mjs](../../test/context/dcb-source-selection.test.mjs.md) | ../../src/context/dcb-source-selection.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Deterministic adaptive source selection for persistent/composite DCBs.
// Source metadata only; no memory bodies, unapproved graph writes or grants.
// "Mandatory" references come from Host-owned activity/intent policy, NEVER
// from a provider answer or an untrusted selected flavor.
export const DCB_SOURCE_SELECTION_SCHEMA='vivim.dcb-source-selection/1';
const REF=/^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/;
const TRUST={owner_confirmed:6,observed:4,sourced:3,provider_reported:1,untrusted:0};
const CLASS_TO_FIELD={
  decision:'claims',personal:'identity',conversation:'history',
  project:'task',source:'provenance',test:'provenance',
  receipt:'history',task_evidence:'task',
};
const STOP=new Set(['this','that','with','from','what','about','have','will','your','their','into','where','which','when','then','them','these','those','there','been','being','were','the','and','for','are','can','you','our','was','who','how']);
const fail=(code,message)=>Object.assign(new Error(message),{code});
const refs=(arr,name)=>{
  if(!Array.isArray(arr)||arr.length>500||arr.some(x=>typeof x!=='string'||!REF.test(x)))
    throw fail('DCB_SELECTION_REFS','Invalid '+name);
  return [...new Set(arr)].sort();
};
const words=t=>[...new Set((String(t).toLowerCase().match(/[a-z0-9_-]{3,}/g)??[]).filter(x=>!STOP.has(x)))];
function candidateMetadata(c) {
  if(!c||typeof c.ref!=='string'||!REF.test(c.ref))throw fail('DCB_SELECTION_CANDIDATE','Invalid source metadata');
  if(c.keywords!==undefined&&(!Array.isArray(c.keywords)||c.keywords.length>100
    ||c.keywords.some(x=>typeof x!=='string'||x.length>160)))
    throw fail('DCB_SELECTION_CANDIDATE','Invalid keywords');
  if(c.status!==undefined&&!['active','historical','superseded','revoked'].includes(c.status))
    throw fail('DCB_SELECTION_CANDIDATE','Unknown source state');
  if(c.entityRef!==undefined&&c.entityRef!==null&&
    (typeof c.entityRef!=='string'||!REF.test(c.entityRef)))
    throw fail('DCB_SELECTION_CANDIDATE','Invalid entity reference');
  return c;
}
export function selectDcbSources({bundleSourceRefs,sourceCandidates,taskText='',
  mandatorySourceRefs=[],maxSources=32,flavorComposition=null,now}={}) {
  const universe=refs(bundleSourceRefs,'bundleSourceRefs');
  const mandatory=refs(mandatorySourceRefs,'mandatorySourceRefs');
  if(mandatory.some(x=>!universe.includes(x)))
    throw fail('DCB_SELECTION_REQUIRED','Mandatory source outside bundle');
  if(!Number.isSafeInteger(maxSources)||maxSources<1||maxSources>250||mandatory.length>maxSources)
    throw fail('DCB_SELECTION_BUDGET','Mandatory source count exceeds source budget');
  if(typeof taskText!=='string'||taskText.length>10000)
    throw fail('DCB_SELECTION_TEXT','Invalid task text');
  if(typeof now!=='string'||!Number.isFinite(Date.parse(now))||new Date(now).toISOString()!==now)
    throw fail('DCB_SELECTION_TIME','Pinned UTC now required');
  if(!Array.isArray(sourceCandidates)||sourceCandidates.length>500)
    throw fail('DCB_SELECTION_CANDIDATE','Bounded metadata list required');
  const byRef=new Map();
  for(const c0 of sourceCandidates) {
    const c=candidateMetadata(c0);
    if(!universe.includes(c.ref))continue;
    if(byRef.has(c.ref))throw fail('DCB_SELECTION_COLLISION','Duplicate source identity');
    byRef.set(c.ref,c);
  }
  if(mandatory.some(x=>!byRef.has(x)))
    throw fail('DCB_SELECTION_REQUIRED','Mandatory source metadata unavailable');
  const valid=universe.filter(x=>byRef.has(x)&&!['superseded','revoked'].includes(byRef.get(x).status));
  if(mandatory.some(x=>!valid.includes(x)))
    throw fail('DCB_SELECTION_REQUIRED','Mandatory source invalidated');
  const terms=words(taskText);
  const options=valid.map(ref=>{
    const c=byRef.get(ref);
    const bag=new Set(words([...(c.keywords??[]),c.ref,c.classification,c.layer??''].join(' ')));
    const match=terms.filter(x=>bag.has(x)).length;
    const coverage=terms.length?match/terms.length:0;
    const strength=TRUST[c.trust]??0;
    const field=CLASS_TO_FIELD[c.classification]??'provenance';
    const domain=Number(flavorComposition?.relevance?.[field]??1);
    const safeDomain=Number.isFinite(domain)?Math.max(0,Math.min(10,domain)):1;
    const age=c.updatedAt&&Number.isFinite(Date.parse(c.updatedAt))
      ?Math.max(0,(Date.parse(now)-Date.parse(c.updatedAt))/86400000):365;
    const freshness=Math.exp(-age/90);
    const historical=c.status==='historical'?3:0;
    const score=Math.round((coverage*100+strength*8+safeDomain*3+freshness*10-historical*10)*100)/100;
    return {ref,score,entityRef:c.entityRef??null,
      classification:c.classification??'source',mandatory:mandatory.includes(ref)};
  });
  const optionsByRef=new Map(options.map(x=>[x.ref,x]));
  const chosen=mandatory.map(x=>optionsByRef.get(x));
  const remaining=options.filter(x=>!x.mandatory);
  // Greedy maximal marginal relevance: new entities/classes win over redundant
```

_First 80 of 104 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

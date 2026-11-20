# File: studio/src/intelligence/world-evolution.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intelligence/world-evolution.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12878 B |
| Lines | 170 |
| Hash | f7ae1087a9b5 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WORLD_EVOLUTION_SCHEMA | const | 5 | yes | export const WORLD_EVOLUTION_SCHEMA=&#39;vivim.world-evolution/1&#39;; |
| ID | const | 6 | no | const ID=/^[a-z][a-z0-9_-]{0,63}$/; |
| WORLD | const | 7 | no | const WORLD=/^[a-z0-9][a-z0-9_-]{0,63}$/; |
| FIELD_TYPES | const | 8 | no | const FIELD_TYPES=new Set([&#39;string&#39;,&#39;number&#39;,&#39;boolean&#39;,&#39;date&#39;,&#39;enum&#39;,&#39;ref&#39;,&#39;list&#39;,&#39;object&#39;]); |
| VIEWS | const | 9 | no | const VIEWS=new Set([&#39;card&#39;,&#39;list&#39;,&#39;detail&#39;,&#39;timeline&#39;,&#39;gallery&#39;]); |
| FAIL | function | 10 | no | const FAIL=code=&gt;Object.assign(new Error(code),{code}); |
| stable | function | 11 | no | const stable=x=&gt;Array.isArray(x)?x.map(stable):x&amp;&amp;typeof x===&#39;object&#39; |
| hash | function | 13 | no | const hash=x=&gt;createHash(&#39;sha256&#39;).update(JSON.stringify(stable(x))).digest(&#39;hex&#39;); |
| plain | function | 14 | no | const plain=x=&gt;x!==null&amp;&amp;typeof x===&#39;object&#39;&amp;&amp;!Array.isArray(x)&amp;&amp;Object.getPrototypeOf(x)===Object.prototype; |
| deep | function | 15 | no | const deep=x=&gt;structuredClone(x); |
| safeText | function | 16 | no | function safeText(x,max=256){return typeof x===&#39;string&#39;&amp;&amp;x.length&gt;0&amp;&amp;x.length&lt;=max&amp;&amp;!/[&lt;&gt;\\u0000-\\u001F]/.test(x);} |
| schemaSize | function | 17 | no | function schemaSize(o){return Buffer.byteLength(JSON.stringify(o),&#39;utf8&#39;);} |
| checkField | function | 18 | no | function checkField(f,worldId,depth=1){ |
| validateWorldType | function | 41 | yes | export function validateWorldType(input,worldId){ |
| diffTypes | function | 60 | no | function diffTypes(previous,next){ |
| prev | const | 61 | no | const prev=previous?.fields??{},nextFields=next.fields; |
| removed | const | 62 | no | const removed=Object.keys(prev).filter(k=&gt;!Object.hasOwn(nextFields,k)); |
| structural | function | 66 | no | const structural=f=&gt;{const copy=deep(f);delete copy.description;delete copy.privacy; |
| breaking | const | 70 | no | const breaking=Object.keys(prev).filter(k=&gt;Object.hasOwn(nextFields,k)&amp;&amp; hash(structural(prev[k]))!==hash(structural(nextFields[k]))); |
| added | const | 72 | no | const added=Object.keys(nextFields).filter(k=&gt;!Object.hasOwn(prev,k)); |
| hasSensitive | function | 74 | no | const hasSensitive=f=&gt;f.privacy===&#39;sensitive&#39;\|\|(f.type===&#39;list&#39;&amp;&amp;hasSensitive(f.items))\|\| |
| sensitive | const | 76 | no | const sensitive=Object.values(nextFields).some(hasSensitive) \|\| |
| stateOf | function | 81 | no | function stateOf(raw,worldId){ |
| createWorldEvolution | function | 86 | yes | export function createWorldEvolution({store,worldId,verifyOwner,verifyGrant,verifyEvidence,now=()=&gt;new Date().toISOString()}={}){ |
| name | const | 89 | no | const name=&#39;types-&#39;+worldId; |
| read | function | 90 | no | function read(){const revision=store.current(name);return {revision,state:stateOf(revision===null?null:store.load(name),worldId)};} |
| preview | function | 91 | no | function preview({candidate,proposalId,idempotencyKey,baseRevision,evidenceRefs=[]}={}){ |
| next | const | 94 | no | const next=validateWorldType(candidate,worldId), {revision,state}=read(); |
| activeRef | const | 96 | no | const activeRef=state.active[next.typeId], old=activeRef?state.definitions[activeRef]?.definition:null; |
| diff | const | 97 | no | const diff=diffTypes(old,next); |
| previousVersion | const | 99 | no | const previousVersion=activeRef?Number(activeRef.split(&#39;@&#39;).at(-1)):0; |
| candidateRef | const | 100 | no | const candidateRef=`${next.typeId}@${previousVersion+1}`; |
| risk | const | 101 | no | const risk=diff.sensitive?&#39;R2_SENSITIVE&#39;:&#39;R1_ADDITIVE&#39;; |
| base | const | 102 | no | const base={schema:&#39;vivim.world-type-plan/1&#39;,worldId,proposalId,idempotencyKey,baseRevision, |
| activate | function | 106 | no | async function activate(input,approval){ |
| current | const | 108 | no | const current=read(); |
| old | const | 109 | no | const old=current.state.receipts.find(r=&gt;r.idempotencyKey===input.idempotencyKey); |
| p | const | 111 | no | const p=preview({candidate:input.candidate,proposalId:input.proposalId,idempotencyKey:input.idempotencyKey, baseRevision:input.baseRevision,evidenceRefs:input.evidenceRefs}); |
| state | const | 124 | no | const state=current.state; |
| next | const | 126 | no | const next=deep(state); |
| receipt | const | 131 | no | const receipt={schema:WORLD_EVOLUTION_SCHEMA,worldId,idempotencyKey:p.idempotencyKey,planDigest:p.planDigest, |
| saved | const | 134 | no | const saved=store.compareAndSave(name,next,{expectedVersion:p.baseRevision,changeNote:`type ${p.candidateRef}`}); |
| previewRollback | function | 137 | no | function previewRollback({typeId,targetRef,baseRevision,idempotencyKey}={}){ |
| body | const | 142 | no | const body={schema:&#39;vivim.world-type-rollback/1&#39;,worldId,typeId,targetRef,baseRevision,idempotencyKey, |
| rollback | function | 146 | no | async function rollback(input,approval){ |
| previously | const | 148 | no | const previously=read().state.receipts.find(r=&gt;r.idempotencyKey===input.idempotencyKey); |
| p | const | 151 | no | const p=previewRollback(input), {state}=read(); |
| next | const | 160 | no | const next=deep(state);next.active[p.typeId]=p.targetRef; |
| receipt | const | 162 | no | const receipt={schema:WORLD_EVOLUTION_SCHEMA,worldId,idempotencyKey:p.idempotencyKey,planDigest:p.planDigest, |
| saved | const | 166 | no | const saved=store.compareAndSave(name,next,{expectedVersion:p.baseRevision,changeNote:`type rollback ${p.typeId}`}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 4 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM W02: declarative personal-World type evolution. Uses the existing
// VersionedStore as the sole registry authority, with immutable CAS revisions.
// No generated SQL/JS/HTML/CSS or provider ability to mutate a schema.
import { createHash } from 'node:crypto';
export const WORLD_EVOLUTION_SCHEMA='vivim.world-evolution/1';
const ID=/^[a-z][a-z0-9_-]{0,63}$/;
const WORLD=/^[a-z0-9][a-z0-9_-]{0,63}$/;
const FIELD_TYPES=new Set(['string','number','boolean','date','enum','ref','list','object']);
const VIEWS=new Set(['card','list','detail','timeline','gallery']);
const FAIL=code=>Object.assign(new Error(code),{code});
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'
  ? Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const hash=x=>createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const deep=x=>structuredClone(x);
function safeText(x,max=256){return typeof x==='string'&&x.length>0&&x.length<=max&&!/[<>\u0000-\u001F]/.test(x);}
function schemaSize(o){return Buffer.byteLength(JSON.stringify(o),'utf8');}
function checkField(f,worldId,depth=1){
  if(!plain(f)||depth>8||!FIELD_TYPES.has(f.type)||typeof f.required!=='boolean'||
     !['public','private','sensitive'].includes(f.privacy)||
     Object.keys(f).some(x=>!['type','required','privacy','description','values','items','properties','target','indexable'].includes(x)))throw FAIL('WORLD_FIELD_INVALID');
  if(f.description!==undefined&&!safeText(f.description,300))throw FAIL('WORLD_FIELD_INVALID');
  if(f.indexable!==undefined&&typeof f.indexable!=='boolean')throw FAIL('WORLD_FIELD_INVALID');
  if(f.type==='enum'){
    if(!Array.isArray(f.values)||f.values.length<1||f.values.length>50||
       f.values.some(x=>!safeText(x,80))||new Set(f.values).size!==f.values.length)throw FAIL('WORLD_ENUM_INVALID');
  }else if(f.values!==undefined)throw FAIL('WORLD_FIELD_INVALID');
  if(f.type==='ref'){
    if(!safeText(f.target??'',160)||!/^(personal\.[a-z0-9_-]+\.[a-z0-9_-]+|domain\.[a-z0-9_-]+\.[a-z0-9_-]+)@\d+$/.test(f.target))throw FAIL('WORLD_REF_INVALID');
    if(f.target.startsWith('personal.')&&!f.target.startsWith(`personal.${worldId}.`))throw FAIL('WORLD_CROSS_WORLD_REF');
  }else if(f.target!==undefined)throw FAIL('WORLD_FIELD_INVALID');
  if(f.type==='list'){
    if(!plain(f.items))throw FAIL('WORLD_LIST_INVALID');
    checkField(f.items,worldId,depth+1);
  }else if(f.items!==undefined)throw FAIL('WORLD_FIELD_INVALID');
  if(f.type==='object'){
    if(!plain(f.properties)||Object.keys(f.properties).length>32)throw FAIL('WORLD_OBJECT_INVALID');
    for(const [k,v] of Object.entries(f.properties)){if(!ID.test(k))throw FAIL('WORLD_FIELD_NAME'); checkField(v,worldId,depth+1);}
  }else if(f.properties!==undefined)throw FAIL('WORLD_FIELD_INVALID');
}
export function validateWorldType(input,worldId){
  if(!WORLD.test(worldId??'')||!plain(input)||!safeText(input.typeId??'',160)||
     !input.typeId.startsWith(`personal.${worldId}.`)||
     !/^personal\.[a-z0-9_-]+\.[a-z0-9_-]+$/.test(input.typeId)||
     !plain(input.fields)||Object.keys(input.fields).length>32||
     !Array.isArray(input.relations)||input.relations.length>24||
     !Array.isArray(input.views)||input.views.length>5||input.views.some(x=>!VIEWS.has(x))||
     Object.keys(input).some(k=>!['typeId','fields','relations','views','description'].includes(k)))throw FAIL('WORLD_TYPE_INVALID');
  if(input.description!==undefined&&!safeText(input.description,800))throw FAIL('WORLD_TYPE_INVALID');
  for(const [k,v] of Object.entries(input.fields)){if(!ID.test(k))throw FAIL('WORLD_FIELD_NAME');checkField(v,worldId);}
  for(const r of input.relations){
    if(!plain(r)||!ID.test(r.predicate??'')||typeof r.target!=='string'||r.target.length>160||
       !/^(personal\.[a-z0-9_-]+\.[a-z0-9_-]+|domain\.[a-z0-9_-]+\.[a-z0-9_-]+)@\d+$/.test(r.target)||
       Object.keys(r).some(k=>!['predicate','target'].includes(k)))throw FAIL('WORLD_RELATION_INVALID');
    if(r.target.startsWith('personal.')&&!r.target.startsWith(`personal.${worldId}.`))throw FAIL('WORLD_CROSS_WORLD_REF');
  }
  if(schemaSize(input)>256*1024)throw FAIL('WORLD_TYPE_OVERSIZED');
  return deep(input);
}
function diffTypes(previous,next){
  const prev=previous?.fields??{},nextFields=next.fields;
  const removed=Object.keys(prev).filter(k=>!Object.hasOwn(nextFields,k));
  // V1 supports additive optional fields. Existing field semantics cannot mutate
  // under the same type identity, including nested fields, target refs and enum values.
  // Privacy/description changes create a new version but retain field meaning.
  const structural=f=>{const copy=deep(f);delete copy.description;delete copy.privacy;
    if(copy.items)copy.items=structural(copy.items);
    if(copy.properties)copy.properties=Object.fromEntries(Object.entries(copy.properties).map(([k,v])=>[k,structural(v)]));
    return copy;};
  const breaking=Object.keys(prev).filter(k=>Object.hasOwn(nextFields,k)&&
    hash(structural(prev[k]))!==hash(structural(nextFields[k])));
  const added=Object.keys(nextFields).filter(k=>!Object.hasOwn(prev,k));
  if(previous && added.some(k=>nextFields[k].required===true))breaking.push(...added.filter(k=>nextFields[k].required===true));
  const hasSensitive=f=>f.privacy==='sensitive'||(f.type==='list'&&hasSensitive(f.items))||
    (f.type==='object'&&Object.values(f.properties).some(hasSensitive));
  const sensitive=Object.values(nextFields).some(hasSensitive) ||
    Object.keys(prev).some(k=>nextFields[k]&&['public','private','sensitive'].indexOf(nextFields[k].privacy)<
      ['public','private','sensitive'].indexOf(prev[k].privacy));
  return {removed,breaking,added,sensitive};
}
```

_First 80 of 171 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

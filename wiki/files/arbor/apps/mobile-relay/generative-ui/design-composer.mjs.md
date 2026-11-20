# File: apps/mobile-relay/generative-ui/design-composer.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/generative-ui/design-composer.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5543 B |
| Lines | 114 |
| Hash | adcbbaff3394 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DESIGN_CONTEXT_SCHEMA | const | 8 | yes | export const DESIGN_CONTEXT_SCHEMA=&#39;vivim.design-context/1&#39;; |
| DEVICE_CLASSES | const | 9 | yes | export const DEVICE_CLASSES=Object.freeze([&#39;phone&#39;,&#39;mobile&#39;,&#39;tablet&#39;,&#39;pc&#39;]); |
| MAX_USER_REQUEST | const | 10 | yes | export const MAX_USER_REQUEST=400; |
| MAX_CONSTRAINT | const | 11 | yes | export const MAX_CONSTRAINT=160; |
| MAX_CONSTRAINTS | const | 12 | yes | export const MAX_CONSTRAINTS=12; |
| MAX_SELECTION | const | 13 | yes | export const MAX_SELECTION=25; |
| MAX_APPROVED_REFS | const | 14 | yes | export const MAX_APPROVED_REFS=64; |
| MAX_LABEL | const | 15 | yes | export const MAX_LABEL=80; |
| OMITTED_PRIVATE | const | 16 | no | const OMITTED_PRIVATE=&#39;private-memory&#39;; |
| REF_TAG | const | 17 | no | const REF_TAG=&#39;ref:&#39;; |
| CONTROL | const | 20 | no | const CONTROL=/[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]/; |
| deepFreeze | function | 22 | no | function deepFreeze(v) { |
| listOf | function | 26 | no | function listOf(v,label,max) { |
| approvalOf | function | 32 | no | function approvalOf(refs) { |
| ids | const | 33 | no | const ids=new Set(),sensitive=new Set(),withheld=new Set(); |
| rid | const | 37 | no | const rid=id(ref.id); |
| userRequestText | function | 44 | no | function userRequestText(v) { |
| text | const | 46 | no | const text=v.trim(); |
| allowedTypes | function | 51 | no | function allowedTypes(input) { |
| source | const | 52 | no | const source=listOf(input,&#39;allowed components&#39;,TYPES.length); |
| out | const | 54 | no | const out=[]; |
| boundedConstraints | function | 61 | no | function boundedConstraints(input) { |
| out | const | 62 | no | const out=[]; |
| text | const | 64 | no | const text=str(raw,MAX_CONSTRAINT); |
| indexTree | function | 70 | no | function indexTree(node,index) { |
| props | const | 71 | no | const props=node.props??{}; |
| label | const | 72 | no | const label=props.title??props.label??props.value; |
| composeDesignContext | function | 79 | yes | export function composeDesignContext({ surface, surfaceId, selectedComponentIds=[], baseRevision, userRequest, deviceClass=&#39;phone&#39;, rendererCatalogVersion=CATALOG_VERSION, allowedComponents=[], const… |
| approval | const | 84 | no | const approval=approvalOf(approvedRefs); |
| validated | const | 85 | no | const validated=validateSurface(surface,{refs:approval.ids}); |
| session | const | 86 | no | const session=id(sessionId),task=id(taskId); |
| declared | const | 87 | no | const declared=surfaceId===undefined?validated.surfaceId:id(surfaceId); |
| revision | const | 89 | no | const revision=int(baseRevision,0,1e9); |
| catalogVersion | const | 91 | no | const catalogVersion=int(rendererCatalogVersion,0,1e9); |
| device | const | 93 | no | const device=en(deviceClass,DEVICE_CLASSES); |
| allowed | const | 94 | no | const allowed=allowedTypes(allowedComponents); |
| limits | const | 95 | no | const limits=boundedConstraints(constraints); |
| request | const | 96 | no | const request=userRequestText(userRequest); |
| index | const | 97 | no | const index=indexTree(validated.tree,new Map()); |
| picked | const | 98 | no | const picked=[]; |
| cid | const | 100 | no | const cid=id(raw); |
| items | const | 105 | no | const items=picked.map(cid=&gt;index.get(cid)); |
| refs | const | 106 | no | const refs=[...new Set([...approval.sensitive,...approval.withheld])].sort(); |
| omitted | const | 107 | no | const omitted=[OMITTED_PRIVATE,...refs.map(ref=&gt;REF_TAG+ref)]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./catalog.mjs | import | 6 | [apps/mobile-relay/generative-ui/catalog.mjs](./catalog.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/build-composer.mjs](../build-composer.mjs.md) | ./generative-ui/design-composer.mjs |
| [apps/mobile-relay/test/design-composer.test.mjs](../test/design-composer.test.mjs.md) | ../generative-ui/design-composer.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// GUI03: bounded, scoped design-context composer for Build design turns.
// Outbound vivim.design-context/1 is presentation scope only: selected structure,
// catalog constraints and owner intent. No memory content, credentials, cookies,
// session state, full component tree, network call or provider effect.
// Pure and browser-safe: imports only the closed catalog vocabulary.
import {CATALOG_VERSION,TYPES,validateSurface,id,str,int,en,keys,plain,invalid} from './catalog.mjs';

export const DESIGN_CONTEXT_SCHEMA='vivim.design-context/1';
export const DEVICE_CLASSES=Object.freeze(['phone','mobile','tablet','pc']);
export const MAX_USER_REQUEST=400;
export const MAX_CONSTRAINT=160;
export const MAX_CONSTRAINTS=12;
export const MAX_SELECTION=25;
export const MAX_APPROVED_REFS=64;
export const MAX_LABEL=80;
const OMITTED_PRIVATE='private-memory';
const REF_TAG='ref:';
// Only C0/C1 noise is refused here. A user request may legitimately contain a URL;
// it is owner-authored intent, not model-authored UI text.
const CONTROL=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

function deepFreeze(v) {
  if(v!==null&&typeof v==='object'){for(const k of Object.keys(v))deepFreeze(v[k]);Object.freeze(v);}
  return v;
}
function listOf(v,label,max) {
  if(!Array.isArray(v)||v.length>max)invalid(label+' must be a bounded array');
  return v;
}
// Approved references may be bare ids or explicit {id,sensitive,approved} records.
// Only approved ids unseal the surface; flagged sensitive refs are never forwarded.
function approvalOf(refs) {
  const ids=new Set(),sensitive=new Set(),withheld=new Set();
  for(const ref of listOf(refs,'approved references',MAX_APPROVED_REFS)){
    if(typeof ref==='string'){ids.add(id(ref));continue;}
    keys(ref,['id','sensitive','approved'],'approved reference');
    const rid=id(ref.id);
    if(ref.approved===false){withheld.add(rid);continue;}
    ids.add(rid);
    if(ref.sensitive===true)sensitive.add(rid);
  }
  return {ids,sensitive,withheld};
}
function userRequestText(v) {
  if(typeof v!=='string')invalid('user request must be a string');
  const text=v.trim();
  if(!text||text.length>MAX_USER_REQUEST)invalid('user request must be 1..'+MAX_USER_REQUEST+' characters');
  if(CONTROL.test(text))invalid('user request contains control characters');
  return text;
}
function allowedTypes(input) {
  const source=listOf(input,'allowed components',TYPES.length);
  if(!source.length)return Object.freeze([...TYPES]);
  const out=[];
  for(const type of source){
    if(!TYPES.includes(type))invalid('component type outside catalog');
    if(!out.includes(type))out.push(type);
  }
  return Object.freeze(out);
}
function boundedConstraints(input) {
  const out=[];
  for(const raw of listOf(input,'constraints',MAX_CONSTRAINTS)){
    const text=str(raw,MAX_CONSTRAINT);
    if(!out.includes(text))out.push(text);
  }
  return Object.freeze(out);
}
// Component ids and short display labels only. Descriptions, refs and content stay local.
function indexTree(node,index) {
  const props=node.props??{};
  const label=props.title??props.label??props.value;
  index.set(node.id,Object.freeze({componentId:node.id,type:node.type,
    label:typeof label==='string'?label.slice(0,MAX_LABEL):node.type}));
  for(const child of node.children)indexTree(child,index);
  return index;
}

export function composeDesignContext({
  surface, surfaceId, selectedComponentIds=[], baseRevision, userRequest,
```

_First 80 of 115 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

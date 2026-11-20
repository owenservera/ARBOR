# File: apps/vivim-host/control/request-context.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/request-context.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6489 B |
| Lines | 117 |
| Hash | 46d54086096b |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REQUEST_CONTEXT_SCHEMA | const | 7 | yes | export const REQUEST_CONTEXT_SCHEMA = &#39;vivim.request-context/1&#39;; |
| MAX_PAGES | const | 8 | no | const MAX_PAGES = 6, MAX_SECTIONS = 8; |
| SOURCE_IDS | const | 9 | no | const SOURCE_IDS = new Set([&#39;vivim.vec-compile@0.1&#39;,&#39;vivim.command-intent@0.1&#39;]); |
| unavailable | function | 10 | no | const unavailable = () =&gt; ({status:&#39;unavailable&#39;}); |
| compare | function | 11 | no | const compare = (a,b) =&gt; a&lt;b?-1:a&gt;b?1:0; |
| idPattern | const | 12 | no | const idPattern = /(?:^\|[\\s(\\x60&quot;&#39;])(([a-z0-9][a-z0-9._-]*)@\\d+(?:\\.\\d+)*)(?=$\|[\\s)\\x60&quot;&#39;,;?!])/g; |
| requestSourceIds | function | 14 | yes | export function requestSourceIds(text, plan) { |
| compiled | const | 15 | no | const compiled=plan?.language?.vec; |
| resolvePage | function | 29 | no | function resolvePage(wiki, value) { |
| matches | const | 31 | no | const matches=Object.keys(wiki.pages).filter(p=&gt;p.toLowerCase()===value.toLowerCase()); |
| resolveSection | function | 34 | no | function resolveSection(wiki,page,value) { |
| matches | const | 36 | no | const matches=Object.keys(wiki.pages[page].sections).filter(s=&gt;s.toLowerCase()===value.toLowerCase()); |
| linkTargets | function | 39 | no | function linkTargets(wiki,page) { |
| selectRequestWiki | function | 45 | yes | export function selectRequestWiki(wiki, plan) { |
| action | const | 46 | no | const action=plan?.actionId; |
| expected | const | 50 | no | const expected=plan.preview?.expectedRevision??plan.result?.wikiRevision; |
| args | const | 52 | no | const args=plan.args??{}, targets=[]; |
| add | function | 54 | no | const add=(name,section)=&gt;{ |
| page | const | 55 | no | const page=resolvePage(wiki,name); |
| selected | const | 64 | no | const selected=new Map(targets.map(t=&gt;[t.page,{...t,relation:&#39;exact-target&#39;}])); |
| journalLinks | const | 75 | no | const journalLinks=wiki.wikiStructure?.wikiRevision===wiki.revision?wiki.wikiStructure.links\|\|[]:[]; |
| pages | const | 76 | no | const pages=[...selected.values()].map(({page,section,relation})=&gt;{ const names=Object.keys(wiki.pages[page].sections); const items=names.slice(0,MAX_SECTIONS); if(section&amp;&amp;!items.includes(section))i… |
| names | const | 77 | no | const names=Object.keys(wiki.pages[page].sections); |
| items | const | 78 | no | const items=names.slice(0,MAX_SECTIONS); |
| evidence | const | 80 | no | const evidence=relation===&#39;linked-page&#39;?journalLinks.find(e=&gt; e.status===&#39;current-link&#39;&amp;&amp;((e.edit.from===page&amp;&amp;targets.some(t=&gt;t.page===e.edit.to))\|\| (e.edit.to===page&amp;&amp;targets.some(t=&gt;t.page===e.edi… |
| attachRequestContext | function | 95 | yes | export async function attachRequestContext(plan,{text,readWiki,compileSources}={}) { |
| wiki | variable | 98 | no | let wiki=null,source=null; |
| sourceSemanticIds | const | 104 | no | const sourceSemanticIds=requestSourceIds(text,plan); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 4 | external |
| ../chat/wiki-semantics.mjs | import | 5 | [apps/vivim-host/chat/wiki-semantics.mjs](../chat/wiki-semantics.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/direct-phone.mjs](../direct-phone.mjs.md) | ./control/request-context.mjs |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./control/request-context.mjs |
| [apps/vivim-host/test/request-context.test.mjs](../test/request-context.test.mjs.md) | ../control/request-context.mjs |
| [apps/vivim-host/test/wiki-living-knowledge.test.mjs](../test/wiki-living-knowledge.test.mjs.md) | ../control/request-context.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Request-scoped, inert VLANG context. No new store, inference engine, command
// parser or grants. Context is compiled from the Host's existing typed result,
// never from a client-supplied candidate, path, identity list or permission.
import { createHash } from 'node:crypto';
import { sectionId } from '../chat/wiki-semantics.mjs';

export const REQUEST_CONTEXT_SCHEMA = 'vivim.request-context/1';
const MAX_PAGES = 6, MAX_SECTIONS = 8;
const SOURCE_IDS = new Set(['vivim.vec-compile@0.1','vivim.command-intent@0.1']);
const unavailable = () => ({status:'unavailable'});
const compare = (a,b) => a<b?-1:a>b?1:0;
const idPattern = /(?:^|[\s(\x60"'])(([a-z0-9][a-z0-9._-]*)@\d+(?:\.\d+)*)(?=$|[\s)\x60"',;?!])/g;

export function requestSourceIds(text, plan) {
  const compiled=plan?.language?.vec;
  if(compiled?.schema==='vivim.vec-compile/0.1' && compiled.domain==='command' &&
     compiled.outcome==='candidate' && compiled.authorization==='none' &&
     compiled.executed===false && compiled.persisted===false &&
     compiled.proposal?.schema==='vivim.command-intent/0.1' &&
     compiled.proposal.actionId===plan.actionId &&
     Array.isArray(compiled.sourceSemanticIds))
    return [...new Set(compiled.sourceSemanticIds.filter(id=>SOURCE_IDS.has(id)))].sort(compare);
  // For unresolved *source lookups*, only a literal versioned source reference
  // can ground the request. This is identity extraction, not a second interpreter.
  if(plan?.outcome!=='interpretation_required' || typeof text!=='string')return [];
  return [...new Set([...text.matchAll(idPattern)].map(m=>m[1]).filter(id=>id.length<=160))].sort(compare).slice(0,4);
}

function resolvePage(wiki, value) {
  if(typeof value!=='string')return null;
  const matches=Object.keys(wiki.pages).filter(p=>p.toLowerCase()===value.toLowerCase());
  return matches.length===1?matches[0]:null;
}
function resolveSection(wiki,page,value) {
  if(typeof value!=='string')return null;
  const matches=Object.keys(wiki.pages[page].sections).filter(s=>s.toLowerCase()===value.toLowerCase());
  return matches.length===1?matches[0]:null;
}
function linkTargets(wiki,page) {
  return [...new Set([
    ...(wiki.pages[page].links||[]).filter(p=>Object.hasOwn(wiki.pages,p)),
    ...Object.keys(wiki.pages).filter(p=>wiki.pages[p].links?.includes(page))
  ])].sort(compare);
}
export function selectRequestWiki(wiki, plan) {
  const action=plan?.actionId;
  if(typeof action!=='string' || !action.startsWith('wiki.'))return null;
  if(!['approval_required','done','incomplete','clarification_required'].includes(plan.outcome))return null;
  if(!Number.isSafeInteger(wiki?.revision)||!wiki.pages)return unavailable();
  const expected=plan.preview?.expectedRevision??plan.result?.wikiRevision;
  if(expected!==undefined&&expected!==wiki.revision)return {status:'stale'};
  const args=plan.args??{}, targets=[];
  const [editPage,editSection]=typeof args.target==='string'?args.target.split('/'):[];
  const add=(name,section)=>{
    const page=resolvePage(wiki,name);
    if(page&&!targets.some(t=>t.page===page))
      targets.push({page,section:resolveSection(wiki,page,section)});
  };
  if(action!=='wiki.page.create'){
    add(editPage,editSection);
    add(args.page,args.section);
    add(args.from); add(args.to);
  }
  const selected=new Map(targets.map(t=>[t.page,{...t,relation:'exact-target'}]));
  for(const {page} of targets)
    for(const related of linkTargets(wiki,page)){
      if(selected.size>=MAX_PAGES)break;
      if(!selected.has(related))selected.set(related,{page:related,section:null,relation:'linked-page'});
    }
  if(!selected.size && (action==='wiki.pages.list'||plan.outcome==='incomplete'||plan.outcome==='clarification_required')) {
    // Names only when a target is missing; no fabricated target or auto-selection.
    for(const page of Object.keys(wiki.pages).slice(0,MAX_PAGES))
      selected.set(page,{page,section:null,relation:'available-target'});
  }
  const journalLinks=wiki.wikiStructure?.wikiRevision===wiki.revision?wiki.wikiStructure.links||[]:[];
  const pages=[...selected.values()].map(({page,section,relation})=>{
    const names=Object.keys(wiki.pages[page].sections);
    const items=names.slice(0,MAX_SECTIONS);
    if(section&&!items.includes(section))items[items.length-1]=section;
    const evidence=relation==='linked-page'?journalLinks.find(e=>
```

_First 80 of 118 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

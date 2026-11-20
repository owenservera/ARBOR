# File: apps/vivim-host/chat/wiki-semantics.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/chat/wiki-semantics.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 16280 B |
| Lines | 254 |
| Hash | 3a960e841aff |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| digest | function | 4 | no | const digest = value =&gt; createHash(&#39;sha256&#39;).update(JSON.stringify(value)).digest(&#39;hex&#39;); |
| pageId | function | 5 | yes | export const pageId = page =&gt; &#39;wiki:page:&#39; + encodeURIComponent(page); |
| sectionId | function | 6 | yes | export const sectionId = (page, section) =&gt; &#39;wiki:section:&#39; + encodeURIComponent(page) + &#39;/&#39; + encodeURIComponent(section); |
| actionId | function | 7 | no | const actionId = id =&gt; &#39;control:action:&#39; + id; |
| journalId | function | 8 | no | const journalId = id =&gt; &#39;journal:&#39; + id; |
| receiptId | function | 9 | yes | export const receiptId = id =&gt; &#39;receipt:&#39; + id; |
| validAction | function | 10 | no | const validAction = id =&gt; typeof id === &#39;string&#39; &amp;&amp; /^[a-z0-9][a-z0-9_.-]{0,127}$/.test(id); |
| resolveSemanticWikiTarget | function | 14 | yes | export function resolveSemanticWikiTarget(wiki, intent) { |
| target | const | 16 | no | const target = intent.candidate.args?.target; |
| pages | const | 19 | no | const pages = Object.keys(wiki?.pages \|\| {}).filter(name =&gt; name.toLowerCase() === p); |
| page | const | 21 | no | const page = pages[0]; |
| sections | const | 22 | no | const sections = Object.keys(wiki.pages[page]?.sections \|\| {}).filter(name =&gt; name.toLowerCase() === s); |
| projectWikiStructure | function | 30 | yes | export function projectWikiStructure(records, wiki) { |
| items | const | 31 | no | const items=[], active=new Map(), pageEvidence=new Map(); |
| hasPage | function | 32 | no | const hasPage=page=&gt;typeof page===&#39;string&#39;&amp;&amp;Object.hasOwn(wiki?.pages\|\|{},page); |
| edit | const | 36 | no | const edit=e.edit, revision=e.expectedRevision+1; |
| item | const | 44 | no | const item={source:&#39;host-product-journal&#39;,kind:&#39;committed-wiki-structure&#39;, |
| links | const | 57 | no | const links=[...active.values()], selectedLinks=links.slice(-24); |
| selectedPages | const | 60 | no | const selectedPages=new Set(selectedLinks.flatMap(e=&gt;[e.edit.from,e.edit.to])); |
| pageSources | const | 63 | no | const pageSources=[...selectedPages].sort().map(page=&gt;pageEvidence.get(page)); |
| resolveSemanticWikiPages | function | 70 | yes | export function resolveSemanticWikiPages(wiki,intent) { |
| names | const | 74 | no | const names=actionId===&#39;wiki.pages.link&#39;?[args.from,args.to]: |
| matching | const | 78 | no | const matching=Object.keys(wiki.pages).filter(p=&gt;p.toLowerCase()===name.toLowerCase()); |
| wikiClaimEvidence | function | 86 | yes | export function wikiClaimEvidence(record,context){ |
| source | const | 87 | no | const source=record.source; |
| historical | const | 88 | no | const historical=record.classification===&#39;committed-change&#39;\|\|record.freshness?.startsWith(&#39;historical&#39;)\|\|record.freshness?.startsWith(&#39;superseded&#39;); |
| fresh | const | 89 | no | const fresh=historical?&#39;historical&#39;:source?.authority===&#39;host-product-journal&#39;&amp;&amp; |
| base | const | 92 | no | const base={freshness:fresh,conflict:false,planningEligible:false}; |
| supported | const | 100 | no | const supported=source?.authority===&#39;host-product-journal&#39;&amp;&amp;typeof source.ref===&#39;string&#39;&amp;&amp; |
| projectWikiSemantics | function | 108 | yes | export function projectWikiSemantics(context) { |
| nodes | const | 109 | no | const nodes = new Map(), relations = new Map(); |
| put | function | 110 | no | const put = node =&gt; { nodes.set(node.id, node); return node.id; }; |
| link | function | 111 | no | function link(from, kind, to, classification, source) { |
| id | const | 112 | no | const id = &#39;relation:&#39; + digest([from,kind,to,source.authority,source.ref]); |
| pageNode | function | 115 | no | function pageNode(page,source) { |
| id | const | 116 | no | const id=pageId(page); |
| section | function | 122 | no | function section(target, source, classification) { |
| page | const | 123 | no | const page = pageNode(target.page); |
| id | const | 124 | no | const id = sectionId(target.page,target.section); |
| membershipId | const | 129 | no | const membershipId = &#39;relation:&#39; + digest([id, &#39;belongs-to-page&#39;, page]); |
| existing | const | 130 | no | const existing = relations.get(membershipId); |
| action | function | 136 | no | function action(id) { |
| journalSource | function | 139 | no | function journalSource(item) { |
| observations | const | 144 | no | const observations = (context.items \|\| []).slice(-24); |
| changes | const | 145 | no | const changes = (context.wikiChanges?.items \|\| []).slice(-24); |
| effects | const | 146 | no | const effects = context.applicationEffects?.state === &#39;source-backed&#39; |
| latest | const | 148 | no | const latest = new Map(); |
| source | const | 150 | no | const source = { ...journalSource(item), wikiRevision: item.wikiRevision, digest: item.contentDigest }; |
| id | const | 151 | no | const id = put({ id: journalId(item.entryId), kind: &#39;wiki-change&#39;, label: item.captureKind===&#39;task&#39;?&#39;Captured personal task&#39;:item.captureKind===&#39;note&#39;?&#39;Captured personal note&#39;:&#39;Committed Wiki edit&#39;, … |
| target | const | 153 | no | const target = section(item.relationship, source, &#39;observed-state&#39;); |
| previous | const | 155 | no | const previous = latest.get(target); |
| structure | const | 162 | no | const structure=context.wikiStructure; |
| events | const | 166 | no | const events=new Map([...(structure.items\|\|[]),...(structure.links\|\|[])].map(e=&gt;[e.entryId,e])); |
| source | const | 168 | no | const source={...journalSource(item),wikiRevision:item.wikiRevision,digest:item.contentDigest}; |
| edit | const | 169 | no | const edit=item.edit; |
| id | const | 170 | no | const id=put({id:journalId(item.entryId),kind:&#39;wiki-structure-change&#39;, label:edit.action===&#39;create-page&#39;?&#39;Created Wiki page&#39;: edit.action===&#39;move-page&#39;?&#39;Moved Wiki page&#39;:&#39;Linked Wiki pages&#39;, classifi… |
| edgeId | const | 180 | no | const edgeId=&#39;relation:&#39;+digest([from,&#39;wiki-page-link&#39;,to]); |
| page | const | 185 | no | const page=pageNode(edit.page,source); |
| source | const | 192 | no | const source = journalSource(item); |
| id | const | 193 | no | const id = put({ id: journalId(item.entryId), kind: &#39;user-observation&#39;, label: &#39;User statement&#39;, classification: &#39;user-statement-unverified&#39;, freshness: &#39;historical-statement&#39;, source }); |
| meaning | const | 195 | no | const meaning = item.interpretation; |
| resolved | const | 202 | no | const resolved = { ...source, wikiRevision: context.wikiRevision }; |
| source | const | 210 | no | const source = { authority: &#39;host-control-receipt&#39;, ref: item.planId, digest: item.planDigest, |
| id | const | 212 | no | const id = put({ id: receiptId(item.planId), kind: &#39;applied-effect&#39;, label: &#39;Applied Host action&#39;, classification: &#39;executed-effect&#39;, freshness: &#39;historical-receipt&#39;, source }); |
| change | const | 215 | no | const change = item.wikiLink &amp;&amp; nodes.get(journalId(item.wikiLink.entryId)); |
| structural | const | 219 | no | const structural=item.structureLink&amp;&amp;nodes.get(journalId(item.structureLink.entryId)); |
| order | function | 223 | no | const order = (a,b) =&gt; a.id &lt; b.id ? -1 : a.id &gt; b.id ? 1 : 0; |
| priority | function | 226 | no | const priority=r=&gt;r.kind===&#39;wiki-page-link&#39;?0:r.kind===&#39;confirmed-change&#39;?1: |
| ordered | const | 228 | no | const ordered=[...relations.values()].sort((a,b)=&gt;priority(a)-priority(b)\|\|order(a,b)); |
| boundedNodes | const | 229 | no | const boundedNodes=new Map(), boundedRelations=[]; |
| missing | const | 231 | no | const missing=[...new Set([relation.from,relation.to])].filter(id=&gt;!boundedNodes.has(id)); |
| result | const | 241 | no | const result = { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 2 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/chat/product-journal.mjs](./product-journal.mjs.md) | ./wiki-semantics.mjs |
| [apps/vivim-host/chat/rust-context.mjs](./rust-context.mjs.md) | ./wiki-semantics.mjs |
| [apps/vivim-host/control/request-context.mjs](../control/request-context.mjs.md) | ../chat/wiki-semantics.mjs |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./chat/wiki-semantics.mjs |
| [apps/vivim-host/test/product-journal.test.mjs](../test/product-journal.test.mjs.md) | ../chat/wiki-semantics.mjs |
| [apps/vivim-host/test/wiki-living-knowledge.test.mjs](../test/wiki-living-knowledge.test.mjs.md) | ../chat/wiki-semantics.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Pure read projection of the existing owner-private Wiki context. No persistence.
import { createHash } from 'node:crypto';

const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const pageId = page => 'wiki:page:' + encodeURIComponent(page);
export const sectionId = (page, section) => 'wiki:section:' + encodeURIComponent(page) + '/' + encodeURIComponent(section);
const actionId = id => 'control:action:' + id;
const journalId = id => 'journal:' + id;
export const receiptId = id => 'receipt:' + id;
const validAction = id => typeof id === 'string' && /^[a-z0-9][a-z0-9_.-]{0,127}$/.test(id);

// Only the existing typed Wiki action may resolve a candidate target.
// Text mentions, approximate matches and project-name guesses grant no link.
export function resolveSemanticWikiTarget(wiki, intent) {
  if (intent?.outcome !== 'candidate' || intent.candidate?.actionId !== 'wiki.section.edit') return null;
  const target = intent.candidate.args?.target;
  if (typeof target !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,78}\/[a-z0-9][a-z0-9_-]{0,78}$/i.test(target)) return null;
  const [p, s] = target.toLowerCase().split('/');
  const pages = Object.keys(wiki?.pages || {}).filter(name => name.toLowerCase() === p);
  if (pages.length !== 1) return null;
  const page = pages[0];
  const sections = Object.keys(wiki.pages[page]?.sections || {}).filter(name => name.toLowerCase() === s);
  if (sections.length !== 1 || typeof wiki.pages[page].sections[sections[0]] !== 'string') return null;
  return { page, section: sections[0] };
}

// The journal is the authority. Do not convert seed pages or a mere text
// mention into a committed fact. Keep current link evidence independent of
// recent event history so later unrelated changes do not immediately hide it.
export function projectWikiStructure(records, wiki) {
  const items=[], active=new Map(), pageEvidence=new Map();
  const hasPage=page=>typeof page==='string'&&Object.hasOwn(wiki?.pages||{},page);
  for (const e of records) {
    if(e?.kind!=='wiki-structure'||typeof e.entryId!=='string'||
       !Number.isSafeInteger(e.sequence)||!Number.isSafeInteger(e.expectedRevision))continue;
    const edit=e.edit, revision=e.expectedRevision+1;
    if(!wiki||revision>wiki.revision)continue;
    if(edit?.action==='create-page'||edit?.action==='move-page'){
      if(!hasPage(edit.page))continue;
    }else if(edit?.action==='link-pages'){
      if(!hasPage(edit.from)||!hasPage(edit.to)||edit.from===edit.to||
         !wiki.pages[edit.from].links?.includes(edit.to))continue;
    }else continue;
    const item={source:'host-product-journal',kind:'committed-wiki-structure',
      entryId:e.entryId,sequence:e.sequence,receivedAt:e.receivedAt,
      previousWikiRevision:e.expectedRevision,wikiRevision:revision,
      edit:{...edit},contentDigest:digest(edit),...(e.sequenceBinding?{sequenceBinding:e.sequenceBinding}:{}),
      status:edit.action==='link-pages'?'current-link':
        edit.action==='create-page'?'current-page':'historical-order-change'};
    items.push(item);
    if(edit.action==='link-pages'){
      active.set(JSON.stringify([edit.from,edit.to]),item);
      pageEvidence.set(edit.from,{page:edit.from,role:'from',event:item});
      pageEvidence.set(edit.to,{page:edit.to,role:'to',event:item});
    }else pageEvidence.set(edit.page,{page:edit.page,role:'page',event:item});
  }
  const links=[...active.values()], selectedLinks=links.slice(-24);
  // Page evidence is selected from the full validated journal, not the recent
  // event window: a later move must never regress to an older source revision.
  const selectedPages=new Set(selectedLinks.flatMap(e=>[e.edit.from,e.edit.to]));
  for(const item of [...pageEvidence.values()].sort((a,b)=>b.event.sequence-a.event.sequence).slice(0,24))
    selectedPages.add(item.page);
  const pageSources=[...selectedPages].sort().map(page=>pageEvidence.get(page));
  return {wikiRevision:wiki?.revision??null,total:items.length,omitted:Math.max(0,items.length-24),
    items:items.slice(-24),totalLinks:links.length,omittedLinks:Math.max(0,links.length-24),
    links:selectedLinks,pageSources};
}

// Exact typed targets are associations, not proof that an effect occurred.
export function resolveSemanticWikiPages(wiki,intent) {
  if(intent?.outcome!=='candidate'||!wiki?.pages)return [];
  const {actionId,args}=intent.candidate??{};
  if(!args)return [];
  const names=actionId==='wiki.pages.link'?[args.from,args.to]:
    ['wiki.page.move','wiki.section.read','wiki.page.delete'].includes(actionId)?[args.page]:[];
  return [...new Set(names.flatMap(name=>{
    if(typeof name!=='string')return [];
    const matching=Object.keys(wiki.pages).filter(p=>p.toLowerCase()===name.toLowerCase());
    return matching.length===1?matching:[];
  }))];
```

_First 80 of 255 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

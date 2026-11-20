# File: apps/vivim-host/test/request-context.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/request-context.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3816 B |
| Lines | 58 |
| Hash | eae5cd4badd8 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| wiki | const | 6 | no | const wiki = { revision:4, pages:{ |
| plan | const | 11 | no | const plan = {actionId:&#39;wiki.section.read&#39;,outcome:&#39;done&#39;,args:{page:&#39;main&#39;,section:&#39;about&#39;}, |
| context | const | 27 | no | const context=selectRequestWiki(wiki,plan); |
| missing | const | 34 | no | const missing=selectRequestWiki(wiki,{actionId:&#39;wiki.section.read&#39;,outcome:&#39;incomplete&#39;}); |
| p | const | 41 | no | const p={...plan,planDigest:&#39;bound&#39;,outcome:&#39;approval_required&#39;,preview:{expectedRevision:4}}; |
| reads | variable | 42 | no | let reads=0; |
| result | const | 43 | no | const result=await attachRequestContext(p,{text:&#39;read wiki page main in section about&#39;, readWiki:async()=&gt;({...wiki,revision:++reads===1?4:5}), compileSources:async args=&gt;{ assert.deepEqual(args.sour… |
| phone | const | 54 | no | const phone=await attachRequestContext(plan,{text:&#39;read wiki page main in section about&#39;,readWiki:async()=&gt;wiki}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:crypto | import | 3 | external |
| ../control/request-context.mjs | import | 4 | [apps/vivim-host/control/request-context.mjs](../control/request-context.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { requestSourceIds, selectRequestWiki, attachRequestContext } from '../control/request-context.mjs';

const wiki = { revision:4, pages:{
  Main:{sections:{About:'Private to the authorized Wiki',Notes:'Another section'},links:['Project']},
  Project:{sections:{About:'Actual related content'}},
  Other:{sections:{About:'Unrelated'}}
}};
const plan = {actionId:'wiki.section.read',outcome:'done',args:{page:'main',section:'about'},
  result:{wikiRevision:4}, language:{vec:{schema:'vivim.vec-compile/0.1',domain:'command',
    outcome:'candidate',authorization:'none',executed:false,persisted:false,
    proposal:{schema:'vivim.command-intent/0.1',actionId:'wiki.section.read'},
    sourceSemanticIds:['vivim.command-intent@0.1','vivim.vec-compile@0.1','private.forged@1']}}};

test('context is selected from canonical compiler identities and never trusts foreign IDs',()=>{
  assert.deepEqual(requestSourceIds('read wiki page main in section about',plan),
    ['vivim.command-intent@0.1','vivim.vec-compile@0.1']);
  assert.deepEqual(requestSourceIds('explain vivim.command-intent@0.1',{outcome:'interpretation_required'}),
    ['vivim.command-intent@0.1']);
  assert.deepEqual(requestSourceIds('explain vivim.command-intent@0.1',{outcome:'refused'}),[]);
  assert.deepEqual(requestSourceIds('hello unrelated world',{outcome:'interpretation_required'}),[]);
});

test('Wiki context includes exact and directly linked targets without unrelated content',()=>{
  const context=selectRequestWiki(wiki,plan);
  assert.equal(context.wikiRevision,4);
  assert.deepEqual(context.pages.map(p=>[p.page,p.relation]),[['Main','exact-target'],['Project','linked-page']]);
  assert.equal(context.pages[0].section.contentDigest,createHash('sha256').update(wiki.pages.Main.sections.About).digest('hex'));
  assert.ok(!JSON.stringify(context).includes(wiki.pages.Main.sections.About));
  assert.ok(!JSON.stringify(context).includes(wiki.pages.Project.sections.About));
  assert.equal(selectRequestWiki({...wiki,revision:5},plan).status,'stale');
  const missing=selectRequestWiki(wiki,{actionId:'wiki.section.read',outcome:'incomplete'});
  assert.ok(missing.pages.every(p=>p.relation==='available-target'));
  assert.ok(missing.pages.every(p=>!p.section));
  assert.equal(selectRequestWiki(wiki,{actionId:'wiki.page.create',outcome:'approval_required',args:{page:'New'},preview:{expectedRevision:4}}).status,'empty');
});

test('automatic context preserves the actual plan and isolates source failure and revision drift',async()=>{
  const p={...plan,planDigest:'bound',outcome:'approval_required',preview:{expectedRevision:4}};
  let reads=0;
  const result=await attachRequestContext(p,{text:'read wiki page main in section about',
    readWiki:async()=>({...wiki,revision:++reads===1?4:5}),
    compileSources:async args=>{
      assert.deepEqual(args.sourceSemanticIds,['vivim.command-intent@0.1','vivim.vec-compile@0.1']);
      throw new Error('unavailable');
    }});
  assert.deepEqual(result.requestContext.wiki,{status:'stale'});
  assert.equal(result.requestContext.source.status,'unavailable');
  const {requestContext,...unchanged}=result;
  assert.deepEqual(unchanged,p);
  assert.equal(p.requestContext,undefined);
  const phone=await attachRequestContext(plan,{text:'read wiki page main in section about',readWiki:async()=>wiki});
  assert.equal(phone.requestContext.wiki.status,'source-backed');
  assert.equal(Object.hasOwn(phone.requestContext,'source'),false);
  assert.equal(await attachRequestContext({outcome:'refused'},{text:'read wiki',readWiki:()=>{throw new Error('must not read');}}).then(p=>p.requestContext),undefined);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

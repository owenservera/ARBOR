# File: apps/vivim-host/test/wiki-read-program.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/wiki-read-program.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7072 B |
| Lines | 66 |
| Hash | ba8364dddcde |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| commands | const | 5 | no | const commands=&#39;list wiki pages\\nread wiki page main in section about&#39;; |
| wiki | const | 6 | no | const wiki={revision:3,pages:{main:{sections:{about:&#39;Current text&#39;}}}}; |
| planner | const | 7 | no | const planner=createControlPlanner({catalog:loadControlCatalog()}); |
| native | function | 8 | no | const native=async ({program})=&gt;{const p=JSON.parse(program);return {outcome:&#39;compiled&#39;,programId:p.id,programRevision:p.revision,orderedStepIds:p.steps.map(s=&gt;s.id),executionAuthorized:false,effectP… |
| planCommand | function | 9 | no | const planCommand=text=&gt;planner.planText(text,{source:&#39;desktop&#39;}); |
| readAction | function | 10 | no | const readAction=(p,w)=&gt;({wikiRevision:w.revision,...(p.actionId===&#39;wiki.section.read&#39;?{content:w.pages[p.args.page].sections[p.args.section]}:{pages:Object.keys(w.pages)})}); |
| p | const | 12 | no | const p=planner.planText(&#39;run wiki read sequence:\\n&#39;+commands,{source:&#39;desktop&#39;}); |
| out | const | 17 | no | const out=await runWikiReadProgram({commands,planCommand,readWiki:async()=&gt;wiki,nativeProgram:native,readAction}); |
| reads | variable | 21 | no | let reads=0; |
| args | const | 22 | no | const args={commands,planCommand,readWiki:async()=&gt;wiki,nativeProgram:native,readAction:()=&gt;{reads++;throw Error(&#39;unexpected&#39;)}}; |
| snapshots | variable | 24 | no | let snapshots=0; |
| catalog | const | 31 | no | const catalog=loadControlCatalog(),recipe=compileWikiReadRecipe(commands,planCommand,catalog); |
| out | const | 33 | no | const out=await runWikiReadProgram({commands,recipe,catalog,planCommand:()=&gt;{throw Error(&#39;must not re-interpret&#39;)},planTyped:step=&gt;planner.planTyped({...step,source:&#39;desktop&#39;}),readWiki:async()=&gt;wiki… |
| stale | const | 35 | no | const stale=structuredClone(catalog);stale.actions.find(a=&gt;a.id===&#39;wiki.section.read&#39;).title=&#39;changed&#39;; |
| revoked | const | 37 | no | const revoked=await runWikiReadProgram({commands,recipe,catalog,planTyped:step=&gt;planner.planTyped({...step,source:&#39;desktop&#39;}),readWiki:async()=&gt;wiki,nativeProgram:native,readAction,stillCurrent:()=&gt;f… |
| source | const | 42 | no | const source={kind:&#39;committed-wiki-edit&#39;,status:&#39;current-section-revision&#39;,entryId:&#39;11111111-1111-1111-1111-111111111111&#39;,wikiRevision:2,contentDigest}; |
| readEvidence | const | 43 | no | const readEvidence=async(targets,revision)=&gt;({schema:&#39;vivim.wiki-program-evidence/1&#39;,authority:&#39;host-product-journal&#39;,wikiRevision:revision,items:targets.map(t=&gt;({...t,source}))}); |
| out | const | 44 | no | const out=await runWikiReadProgram({commands,planCommand,readWiki:async()=&gt;wiki,readEvidence,readAction,nativeProgram:async(args)=&gt;{const p=JSON.parse(args.program);assert.deepEqual(p.steps[0].inputs… |
| bad | const | 46 | no | const bad=await runWikiReadProgram({commands,planCommand,readWiki:async()=&gt;wiki,readEvidence:async(...args)=&gt;{const e=await readEvidence(...args);e.items[0].source.contentDigest=&#39;0&#39;.repeat(64);return… |
| catalog | const | 50 | no | const catalog=loadControlCatalog(),commands=&#39;create wiki page research\\nedit wiki section research/About saying research stays literal&#39;; |
| recipe | const | 51 | no | const recipe=compileWikiWriteRecipe(commands,planCommand,catalog,&#39;research&#39;);assert.ok(recipe);assert.equal(validWikiWriteRecipe(recipe,commands,catalog),true); |
| bound | const | 52 | no | const bound=bindWikiWriteRecipe(recipe,commands,catalog,&#39;new-project&#39;);assert.equal(bound[0].args.page,&#39;new-project&#39;);assert.equal(bound[1].args.target,&#39;new-project/About&#39;);assert.equal(bound[1].args… |
| altered | const | 55 | no | const altered=structuredClone(catalog);altered.actions.find(a=&gt;a.id===&#39;wiki.section.edit&#39;).title=&#39;Changed&#39;;assert.equal(validWikiWriteRecipe(recipe,commands,altered),false); |
| catalog | const | 59 | no | const catalog=loadControlCatalog();const text=&#39;create wiki page research\\nlink wiki pages research and main&#39;; |
| lines | const | 61 | no | const lines=[{actionId:&#39;wiki.page.create&#39;,args:{page:&#39;research&#39;}},{actionId:&#39;wiki.pages.link&#39;,args:{from:&#39;research&#39;,to:&#39;main&#39;}}].map(s=&gt;({...s,risk:&#39;R1&#39;,origin:&#39;deterministic&#39;,outcome:&#39;approval_requi… |
| recipe | const | 62 | no | const recipe=compileWikiWriteRecipe(text,(_,i)=&gt;lines[i],catalog,&#39;research&#39;);assert.ok(recipe); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../control/wiki-read-program.mjs | import | 3 | [apps/vivim-host/control/wiki-read-program.mjs](../control/wiki-read-program.mjs.md) |
| ../control/intent-planner.mjs | import | 4 | [apps/vivim-host/control/intent-planner.mjs](../control/intent-planner.mjs.md) |
| node:crypto | dynamic | 41 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {runWikiReadProgram,compileWikiReadRecipe,validWikiRecipe,compileWikiWriteRecipe,validWikiWriteRecipe,bindWikiWriteRecipe} from '../control/wiki-read-program.mjs';
import {createControlPlanner,loadControlCatalog} from '../control/intent-planner.mjs';
const commands='list wiki pages\nread wiki page main in section about';
const wiki={revision:3,pages:{main:{sections:{about:'Current text'}}}};
const planner=createControlPlanner({catalog:loadControlCatalog()});
const native=async ({program})=>{const p=JSON.parse(program);return {outcome:'compiled',programId:p.id,programRevision:p.revision,orderedStepIds:p.steps.map(s=>s.id),executionAuthorized:false,effectPerformed:false,programDigest:'a'.repeat(64)}};
const planCommand=text=>planner.planText(text,{source:'desktop'});
const readAction=(p,w)=>({wikiRevision:w.revision,...(p.actionId==='wiki.section.read'?{content:w.pages[p.args.page].sections[p.args.section]}:{pages:Object.keys(w.pages)})});
test('VLANG envelope and child commands use the existing canonical planner',()=>{
 const p=planner.planText('run wiki read sequence:\n'+commands,{source:'desktop'});
 assert.equal(p.actionId,'program.read_wiki');assert.equal(p.outcome,'ready');assert.equal(p.args.commands,commands);
 assert.equal(planner.planText('list wiki pages and delete everything',{source:'desktop'}).outcome,'clarification_required');
});
test('validated dependency sequence returns actual pinned Wiki reads and no mutation authority',async()=>{
 const out=await runWikiReadProgram({commands,planCommand,readWiki:async()=>wiki,nativeProgram:native,readAction});
 assert.equal(out.outcome,'completed');assert.equal(out.steps.length,2);assert.equal(out.steps[1].result.content,'Current text');assert.equal(out.mutationPerformed,false);
});
test('a write, stale revision or failed native validation never runs child reads',async()=>{
 let reads=0;
 const args={commands,planCommand,readWiki:async()=>wiki,nativeProgram:native,readAction:()=>{reads++;throw Error('unexpected')}};
 assert.equal((await runWikiReadProgram({...args,commands:'list wiki pages\ncreate wiki page forbidden'})).reasonCode,'PROGRAM_CHILD_NOT_READ_ONLY');
 let snapshots=0;
 assert.equal((await runWikiReadProgram({...args,readWiki:async()=>({...wiki,revision:3+snapshots++})})).reasonCode,'PROGRAM_WIKI_STALE');
 assert.equal((await runWikiReadProgram({...args,nativeProgram:async()=>({outcome:'unavailable',reasonCode:'NO_BINARY'})})).reasonCode,'NO_BINARY');
 assert.equal(reads,0);
});

test('reviewed recipe reuses typed child meanings without calling the language interpreter',async()=>{
 const catalog=loadControlCatalog(),recipe=compileWikiReadRecipe(commands,planCommand,catalog);
 assert.ok(recipe);assert.equal(validWikiRecipe(recipe,commands,catalog),true);
 const out=await runWikiReadProgram({commands,recipe,catalog,planCommand:()=>{throw Error('must not re-interpret')},planTyped:step=>planner.planTyped({...step,source:'desktop'}),readWiki:async()=>wiki,nativeProgram:native,readAction});
 assert.equal(out.outcome,'completed');assert.equal(out.reusedRecipe,true);
 const stale=structuredClone(catalog);stale.actions.find(a=>a.id==='wiki.section.read').title='changed';
 assert.equal(validWikiRecipe(recipe,commands,stale),false);
 const revoked=await runWikiReadProgram({commands,recipe,catalog,planTyped:step=>planner.planTyped({...step,source:'desktop'}),readWiki:async()=>wiki,nativeProgram:native,readAction,stillCurrent:()=>false});assert.equal(revoked.reasonCode,'PROGRAM_RECIPE_STALE');
});

test('native wire contains exact committed section references and never invented seed identities',async()=>{
 const {createHash}=await import('node:crypto');const contentDigest=createHash('sha256').update('Current text','utf8').digest('hex');
 const source={kind:'committed-wiki-edit',status:'current-section-revision',entryId:'11111111-1111-1111-1111-111111111111',wikiRevision:2,contentDigest};
 const readEvidence=async(targets,revision)=>({schema:'vivim.wiki-program-evidence/1',authority:'host-product-journal',wikiRevision:revision,items:targets.map(t=>({...t,source}))});
 const out=await runWikiReadProgram({commands,planCommand,readWiki:async()=>wiki,readEvidence,readAction,nativeProgram:async(args)=>{const p=JSON.parse(args.program);assert.deepEqual(p.steps[0].inputs,[]);assert.equal(p.steps[1].inputs[0].source_id,source.entryId);return {...await native(args),sourceReferencesVerified:1};}});
 assert.equal(out.outcome,'completed');assert.equal(out.steps[0].sourceEvidence.state,'snapshot-only');assert.equal(out.steps[1].sourceEvidence.state,'committed-section');
 const bad=await runWikiReadProgram({commands,planCommand,readWiki:async()=>wiki,readEvidence:async(...args)=>{const e=await readEvidence(...args);e.items[0].source.contentDigest='0'.repeat(64);return e;},readAction,nativeProgram:async()=>{throw Error('must not run')}});assert.equal(bad.reasonCode,'PROGRAM_SOURCE_UNAVAILABLE');
});

test('typed mutation recipes bind only page fields, never literal content or arbitrary commands',()=>{
 const catalog=loadControlCatalog(),commands='create wiki page research\nedit wiki section research/About saying research stays literal';
 const recipe=compileWikiWriteRecipe(commands,planCommand,catalog,'research');assert.ok(recipe);assert.equal(validWikiWriteRecipe(recipe,commands,catalog),true);
 const bound=bindWikiWriteRecipe(recipe,commands,catalog,'new-project');assert.equal(bound[0].args.page,'new-project');assert.equal(bound[1].args.target,'new-project/About');assert.equal(bound[1].args.content,'research stays literal');
 assert.equal(bindWikiWriteRecipe(recipe,commands,catalog,'a;delete'),null);assert.equal(bindWikiWriteRecipe(recipe,commands,catalog,'constructor'),null);
 assert.equal(compileWikiWriteRecipe('create wiki page research\nlist wiki pages',planCommand,catalog,'research'),null);
 const altered=structuredClone(catalog);altered.actions.find(a=>a.id==='wiki.section.edit').title='Changed';assert.equal(validWikiWriteRecipe(recipe,commands,altered),false);
});

test('recipe slot requires a single explicit page-creation target and preserves unrelated page links',()=>{
 const catalog=loadControlCatalog();const text='create wiki page research\nlink wiki pages research and main';
 // Typed planner outputs are boundary inputs in this narrow binding test; real grammar is checked above.
 const lines=[{actionId:'wiki.page.create',args:{page:'research'}},{actionId:'wiki.pages.link',args:{from:'research',to:'main'}}].map(s=>({...s,risk:'R1',origin:'deterministic',outcome:'approval_required'}));
 const recipe=compileWikiWriteRecipe(text,(_,i)=>lines[i],catalog,'research');assert.ok(recipe);
 assert.deepEqual(bindWikiWriteRecipe(recipe,text,catalog,'alpha')[1].args,{from:'alpha',to:'main'});
 assert.equal(compileWikiWriteRecipe(text,(_,i)=>lines[i],catalog,'unrelated'),null);
 assert.equal(compileWikiWriteRecipe(text,()=>lines[0],catalog,'research'),null);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

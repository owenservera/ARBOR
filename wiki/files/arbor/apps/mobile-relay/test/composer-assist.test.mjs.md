# File: apps/mobile-relay/test/composer-assist.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/composer-assist.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7162 B |
| Lines | 119 |
| Hash | ec9bd773ed68 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| planner | const | 7 | no | const planner=createControlPlanner(),catalog=planner.describe(); |
| interpret | function | 8 | no | const interpret=text=&gt;planner.interpretText(text,{source:&#39;mobile&#39;}); |
| wiki | const | 9 | no | const wiki={revision:7,pages:{Main:{sections:{About:&#39;private text&#39;,Notes:&#39;other text&#39;}}, |
| response | function | 11 | no | const response=text=&gt;composerResponse(text,interpret(text),{catalog,wiki,interpret,source:&#39;mobile&#39;}); |
| text | const | 14 | no | const text=&#39;read wiki page launch-plan in section &#39;; |
| meaning | const | 15 | no | const meaning=response(text),suggestions=draftSuggestions(text,meaning); |
| resolved | const | 20 | no | const resolved=interpret(suggestion.text); |
| partial | const | 25 | no | const partial=&#39;edit wiki section launch-plan/a&#39;; |
| draft | const | 26 | no | const draft=draftSuggestions(partial,response(partial)); |
| literal | const | 29 | no | const literal=&#39;edit wiki section Main/About saying EXACT Literal&#39;; |
| local | const | 34 | no | const local=describeDraft(&#39;open Wiki&#39;,null); |
| found | const | 36 | no | const found=describeDraft(&#39;list wiki pages&#39;,response(&#39;list wiki pages&#39;)); |
| denied | const | 39 | no | const denied=describeDraft(&#39;delete wiki page launch-plan&#39;,response(&#39;delete wiki page launch-plan&#39;)); |
| hint | const | 42 | no | const hint=composeDraftHints(&#39;read wiki page launch-plan in section &#39;,{catalog,wiki,interpret:()=&gt;({outcome:&#39;refused&#39;})}); |
| Node | class | 47 | no | class Node { |
| constructor | method | 48 | yes | constructor(tag=&#39;div&#39;){this.tagName=tag;this.value=&#39;&#39;;this.hidden=false;this.disabled=false; |
| setAttribute | method | 50 | yes | setAttribute(k,v){this.attributes[k]=v;} |
| append | method | 51 | yes | append(...v){this.children.push(...v);} |
| replaceChildren | method | 52 | yes | replaceChildren(...v){this.children=v;} |
| addEventListener | method | 53 | yes | addEventListener(k,fn){const list=this.events.get(k)\|\|[];list.push(fn);this.events.set(k,list);} |
| removeEventListener | method | 54 | yes | removeEventListener(k,fn){this.events.set(k,(this.events.get(k)\|\|[]).filter(x=&gt;x!==fn));} |
| focus | method | 55 | yes | focus(){} |
| fire | method | 56 | yes | fire(k,extra={}){let stopped=false;for(const fn of this.events.get(k)\|\|[])fn({preventDefault(){stopped=true},...extra});return stopped;} |
| wait | function | 58 | no | const wait=ms=&gt;new Promise(r=&gt;setTimeout(r,ms)); |
| setup | function | 60 | no | const setup=()=&gt;{const field=new Node(&#39;input&#39;),host=new Node();field.ownerDocument={createElement:t=&gt;new Node(t)};return {field,host}}; |
| scope | variable | 64 | no | let scope=&#39;session-a&#39;,requests=[],drafts=[]; |
| pending | const | 65 | no | const pending=[]; |
| assist | const | 66 | no | const assist=mountComposerAssist({field,host,delay:0,getScope:()=&gt;scope, interpret:text=&gt;{requests.push(text);return new Promise(resolve=&gt;pending.push(()=&gt;resolve(response(text))))}, onDraft:text=&gt;dr… |
| original | const | 78 | no | const original=field.value; |
| assist | const | 93 | no | const assist=mountComposerAssist({field,host,delay:0,getScope:()=&gt;true, interpret:async text=&gt;{calls++;return response(text)}}); |
| text | const | 106 | no | const text=&#39;edit wiki section Main/About saying EXACT Literal&#39;; |
| action | const | 107 | no | const action={actionId:&#39;wiki.section.edit&#39;,readiness:&#39;source_wired&#39;,args:{page:{type:&#39;string&#39;},section:{type:&#39;string&#39;},content:{type:&#39;string&#39;}}}; |
| meaning | const | 108 | no | const meaning={outcome:&#39;candidate&#39;,candidate:{actionId:action.actionId,args:{page:&#39;Main&#39;,section:&#39;About&#39;,content:&#39;EXACT Literal&#39;}},feedback:{worldV:1},composer:{catalogVersion:1,wikiRevision:7}}; |
| slots | const | 109 | no | const slots=semanticDraftSlots(text,meaning,action); |
| after | const | 113 | no | const after=structuredClone(meaning);after.candidate.args.section=&#39;Notes&#39;; |
| incomplete | const | 117 | no | const incomplete={outcome:&#39;incomplete&#39;,candidate:{actionId:action.actionId,args:{}},missing:[{arg:&#39;section&#39;}]}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../vivim-host/control/intent-planner.mjs | import | 3 | [apps/vivim-host/control/intent-planner.mjs](../../vivim-host/control/intent-planner.mjs.md) |
| ../composer-assist.mjs | import | 4 | [apps/mobile-relay/composer-assist.mjs](../composer-assist.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createControlPlanner } from '../../vivim-host/control/intent-planner.mjs';
import { composeDraftHints, composerResponse, describeDraft, draftSuggestions,
  mountComposerAssist, semanticDraftSlots, correctedSlotDraft, matchesSlotCorrection } from '../composer-assist.mjs';

const planner=createControlPlanner(),catalog=planner.describe();
const interpret=text=>planner.interpretText(text,{source:'mobile'});
const wiki={revision:7,pages:{Main:{sections:{About:'private text',Notes:'other text'}},
  'launch-plan':{sections:{About:'owner-authored content'}}}};
const response=text=>composerResponse(text,interpret(text),{catalog,wiki,interpret,source:'mobile'});

test('canonical compiler validates current Wiki completions without leaking content',()=>{
  const text='read wiki page launch-plan in section ';
  const meaning=response(text),suggestions=draftSuggestions(text,meaning);
  assert.equal(meaning.composer.wikiRevision,7);
  assert.equal(meaning.composer.authority,'none');
  assert.ok(suggestions.some(s=>s.text===text+'About'));
  for(const suggestion of suggestions){
    const resolved=interpret(suggestion.text);
    assert.equal(resolved.outcome,'candidate');
    assert.equal(resolved.candidate.actionId,'wiki.section.read');
  }
  assert.doesNotMatch(JSON.stringify(meaning.composer),/owner-authored content|private text|sprint-notes/);
  const partial='edit wiki section launch-plan/a';
  const draft=draftSuggestions(partial,response(partial));
  assert.ok(draft.some(s=>s.text===partial+'bout saying '&&s.partial));
  assert.equal(draftSuggestions('delete wiki page ',response('delete wiki page ')).length,0);
  const literal='edit wiki section Main/About saying EXACT Literal';
  assert.equal(draftSuggestions(literal,response(literal)).length,0);
});

test('draft route is canonical, inert and reports unsupported action truthfully',()=>{
  const local=describeDraft('open Wiki',null);
  assert.equal(local.kind,'navigate');
  const found=describeDraft('list wiki pages',response('list wiki pages'));
  assert.equal(found.kind,'candidate');
  assert.match(found.label,/wiki.pages.list/);
  const denied=describeDraft('delete wiki page launch-plan',response('delete wiki page launch-plan'));
  assert.notEqual(denied.kind,'candidate');
  assert.equal(describeDraft('hello from the user',null).kind,'unavailable');
  const hint=composeDraftHints('read wiki page launch-plan in section ',{catalog,wiki,interpret:()=>({outcome:'refused'})});
  assert.deepEqual(hint,[]);
  assert.deepEqual(draftSuggestions('read ',{composer:{schema:'vivim.composer-assist/1',authority:'execute',suggestions:[{text:'read anything',source:'wiki'}]}}),[]);
});

class Node {
  constructor(tag='div'){this.tagName=tag;this.value='';this.hidden=false;this.disabled=false;
    this.children=[];this.dataset={};this.attributes={};this.events=new Map();}
  setAttribute(k,v){this.attributes[k]=v;}
  append(...v){this.children.push(...v);}
  replaceChildren(...v){this.children=v;}
  addEventListener(k,fn){const list=this.events.get(k)||[];list.push(fn);this.events.set(k,list);}
  removeEventListener(k,fn){this.events.set(k,(this.events.get(k)||[]).filter(x=>x!==fn));}
  focus(){}
  fire(k,extra={}){let stopped=false;for(const fn of this.events.get(k)||[])fn({preventDefault(){stopped=true},...extra});return stopped;}
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(predicate){for(let i=0;i<100;i++){if(predicate())return;await wait(5)}assert.fail('Timed out waiting for assistance');}
const setup=()=>{const field=new Node('input'),host=new Node();field.ownerDocument={createElement:t=>new Node(t)};return {field,host}};

test('Tab selects, second Tab inserts; input and session drift discard in-flight results',async t=>{
  const {field,host}=setup();
  let scope='session-a',requests=[],drafts=[];
  const pending=[];
  const assist=mountComposerAssist({field,host,delay:0,getScope:()=>scope,
    interpret:text=>{requests.push(text);return new Promise(resolve=>pending.push(()=>resolve(response(text))))},
    onDraft:text=>drafts.push(text)});
  t.after(()=>assist.dispose());
  field.value='read wiki page launch-plan in section ';field.fire('input');
  await until(()=>requests.length===1);
  field.value='read wiki page Main in section ';field.fire('input');
  await wait(10);
  assert.equal(requests.length,1,'only one read in flight');
  pending.shift()();await until(()=>requests.length===2);
  assert.equal(host.hidden,true,'stale first response cannot render');
  pending.shift()();await until(()=>!host.hidden);
  const original=field.value;
  assert.equal(field.fire('keydown',{key:'Tab'}),true);
  assert.equal(field.value,original);
```

_First 80 of 120 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

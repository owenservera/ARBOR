import test from 'node:test';
import assert from 'node:assert/strict';
import { createControlPlanner } from '../../vivim-host/control/intent-planner.mjs';
import { composeDraftHints, composerResponse, describeDraft, draftSuggestions,
  mountComposerAssist, semanticDraftSlots, correctedSlotDraft, matchesSlotCorrection,
  needsWikiDraftContext } from '../composer-assist.mjs';

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

test('malformed Host choices do not crash or trigger Wiki draft-context reads',()=>{
  const text='ordinary draft with no Wiki target';
  assert.equal(needsWikiDraftContext(text,{choices:[{},null,7]}),false);
  assert.equal(needsWikiDraftContext(text,{choices:{0:'wiki.section.read'}}),false);
  assert.equal(needsWikiDraftContext(text,{candidate:{actionId:{value:'wiki.section.read'}}}),false);
  assert.equal(needsWikiDraftContext(text,{choices:['other.action','wiki.section.read']}),true);
  assert.equal(needsWikiDraftContext(text,{candidate:{actionId:'wiki.section.read'}}),true);
  assert.equal(needsWikiDraftContext(text,{outcome:'refused',choices:['wiki.section.read']}),false);
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
  assert.deepEqual(drafts,[]);
  assert.equal(field.fire('keydown',{key:'Tab'}),true);
  assert.equal(field.value,original+'About');
  assert.deepEqual(drafts,[field.value]);
  await until(()=>requests.length===3);
  scope='session-b';assist.reset();pending.shift()();await wait(10);
  assert.equal(host.hidden,true);
  assert.equal(field.fire('keydown',{key:'Tab'}),false,'normal Tab restored');
});

test('composition is inert and local navigation does not query the Host',async t=>{
  const {field,host}=setup();let calls=0;
  const assist=mountComposerAssist({field,host,delay:0,getScope:()=>true,
    interpret:async text=>{calls++;return response(text)}});
  t.after(()=>assist.dispose());
  field.fire('compositionstart');field.value='open Wiki';field.fire('input');await wait(10);
  assert.equal(calls,0);assert.equal(host.hidden,true);
  field.fire('compositionend');await until(()=>!host.hidden);
  assert.equal(calls,0);
  assert.equal(field.fire('keydown',{key:'Escape'}),true);
  assert.equal(host.hidden,true);
});


test('live typed slots preserve unrelated literals and cannot accept changed meaning',()=>{
  const text='edit wiki section Main/About saying EXACT Literal';
  const action={actionId:'wiki.section.edit',readiness:'source_wired',args:{page:{type:'string'},section:{type:'string'},content:{type:'string'}}};
  const meaning={outcome:'candidate',candidate:{actionId:action.actionId,args:{page:'Main',section:'About',content:'EXACT Literal'}},feedback:{worldV:1},composer:{catalogVersion:1,wikiRevision:7}};
  const slots=semanticDraftSlots(text,meaning,action);
  assert.equal(slots.length,3);
  assert.equal(correctedSlotDraft(text,slots[1],'Notes'),'edit wiki section Main/Notes saying EXACT Literal');
  assert.equal(correctedSlotDraft(text,slots[1],'\n'),null);
  const after=structuredClone(meaning);after.candidate.args.section='Notes';
  assert.equal(matchesSlotCorrection(meaning,after,'section','Notes'),true);
  after.candidate.args.content='changed';
  assert.equal(matchesSlotCorrection(meaning,after,'section','Notes'),false);
  const incomplete={outcome:'incomplete',candidate:{actionId:action.actionId,args:{}},missing:[{arg:'section'}]};
  assert.equal(semanticDraftSlots(text,incomplete,action).find(s=>s.key==='section').state,'missing');
});

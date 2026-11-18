import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceCards,sameSourceCard,matchesSourceContext,exactSourceContextUrl,reconcileSourceCards } from '../wiki-source-view.mjs';

const h=c=>c.repeat(64);
const file=(name,letter='a')=>({
  project:'arbor',path:name,sourceId:'arbor:'+name,sourceDigest:h('c'),currentDigest:h('c'),freshness:'indexed',
  annotations:[{semanticId:'vivim.contract@1',kind:'consumes',line:12,resolution:'current',
    semanticAnchor:{anchorId:'hq:file-anchor:'+h(letter),fingerprint:h('d'),semanticId:'vivim.contract@1',
      annotationKind:'consumes',contentHash:h('c'),lines:[12],state:'indexed'},
    evidence:{origin:'extracted',assurance:'verified',claim:'annotation-occurrence',conflict:false}}]
});
const surface=(...files)=>({schema:'vivim.file-surface/1',authority:'read_only_projection',files});
function context(card){
  return {schema:'vivim.source-context/1',status:'indexed',sourceId:card.sourceId,sourceDigest:card.sourceDigest,
    anchor:{anchorId:card.id,fingerprint:card.fingerprint,line:card.line,semanticId:card.semanticId,resolution:card.resolution,authority:'read_only_projection'},
    context:{schema:'hq.context-bundle/1',authority:'read_only_projection',digest:h('e'),fragment:'literal source',
      sources:[{ref:card.sourceId,contentHash:card.sourceDigest,semanticReferences:[{line:card.line,
        semanticAnchor:{anchorId:card.id,fingerprint:card.fingerprint}}]}]}};
}
test('only exact authorized occurrence is readable; stale, contradicted and deprecated remain visible',()=>{
  const f=file('src/a.mjs'); const card=sourceCards(surface(f))[0];
  assert.equal(card.readable,true);
  assert.equal(card.state,'verified-occurrence');
  assert.equal(matchesSourceContext(card,context(card)),true);
  assert.match(exactSourceContextUrl(card),/anchor=hq%3Afile-anchor%3A/);
  f.currentDigest=h('b');f.freshness='stale';
  const stale=sourceCards(surface(f))[0];
  assert.equal(stale.state,'stale');assert.equal(stale.readable,false);
  assert.equal(sameSourceCard(stale,card),false);
  assert.equal(matchesSourceContext(stale,context(card)),false);
  f.currentDigest=f.sourceDigest;f.freshness='indexed';f.annotations[0].semanticAnchor.state='ambiguous';
  assert.equal(sourceCards(surface(f))[0].state,'contradicted');
  f.annotations[0].semanticAnchor.state='indexed';f.annotations[0].resolution='deprecated';
  assert.equal(sourceCards(surface(f))[0].state,'deprecated');
  assert.equal(sourceCards({...surface(f),authority:'write'}).length,0);
});
test('context cannot substitute anchor, source digest, occurrence, lifecycle or sibling source',()=>{
  const card=sourceCards(surface(file('src/a.mjs')))[0];
  for(const tamper of [v=>v.anchor.fingerprint=h('b'),v=>v.anchor.line=13,v=>v.anchor.resolution='deprecated',
    v=>v.sourceDigest=h('b'),v=>v.context.sources.push({ref:'another'}),
    v=>v.context.sources[0].semanticReferences[0].semanticAnchor.anchorId='hq:file-anchor:'+h('b')]){
    const v=context(card);tamper(v);assert.equal(matchesSourceContext(card,v),false);
  }
});
test('reconcile changes only affected cards; clear revoked source and preserve unaffected node identity',()=>{
  class Node{constructor(tag){this.tagName=tag;this.dataset={};this.children=[];this.listeners={};}
    appendChild(n){this.children.push(n);return n}
    replaceChildren(...v){this.children=v}
    addEventListener(k,f){this.listeners[k]=f}}
  const root=new Node('div'),createElement=tag=>new Node(tag),reads=[];
  const a=file('src/a.mjs'),b=file('src/b.mjs','b');
  const render=()=>reconcileSourceCards(root,sourceCards(surface(a,b)),{createElement,onRead:c=>reads.push(c)});
  render();const [first,second]=root.children;first.open=true;
  render();assert.equal(root.children[0],first);assert.equal(root.children[1],second);
  b.freshness='stale';b.currentDigest=h('a');render();
  assert.equal(root.children[0],first);assert.equal(first.open,true);
  assert.notEqual(root.children[1],second);
  assert.equal(root.children[1].children.some(n=>n.tagName==='button'),false);
  root.children[0].children.find(n=>n.tagName==='button').listeners.click();
  assert.equal(reads[0].id,first.dataset.anchorId);
  reconcileSourceCards(root,[],{createElement,onRead:()=>{}});assert.equal(root.children.length,0);
});

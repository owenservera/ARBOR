// L03 O05 — deterministic owner-scoped Wiki readback revocation contracts.
// Fixtures and injected pure functions only; no Host start, account, corpus or effect.
import test from 'node:test';
import assert from 'node:assert/strict';
import {runWikiReadProgram} from '../control/wiki-read-program.mjs';

const wiki=()=>({revision:7,pages:{Inbox:{sections:{About:'synthetic fixture'},links:[]}}});
const commands='list my wiki pages\nshow my wiki pages';
const planCommand=()=>({
  outcome:'ready',risk:'R0',origin:'deterministic',
  actionId:'wiki.pages.list',args:{}
});
const nativeProgram=async ({program})=>{
  const p=JSON.parse(program);
  return {outcome:'compiled',programId:p.id,programRevision:p.revision,
    programDigest:'a'.repeat(64),orderedStepIds:p.steps.map(step=>step.id),
    sourceReferencesVerified:0,executionAuthorized:false,effectPerformed:false};
};
const sourceEvidence=(revision,update=()=>{})=>async(targets,requested)=>{
  assert.deepEqual(targets,[]);assert.equal(requested,revision);
  update();
  return {schema:'vivim.wiki-program-evidence/1',authority:'host-product-journal',
    wikiRevision:revision,items:[]};
};
const invoke=overrides=>runWikiReadProgram({
  commands,planCommand,readWiki:async()=>wiki(),nativeProgram,
  readAction:()=>({wikiRevision:7,pages:['Inbox']}),
  ...overrides
});
const inert=result=>{
  assert.equal(result.effectPerformed,false);
  assert.equal(result.mutationPerformed,false);
};

test('authorization lost before Wiki read does not call a read or native evaluator',async()=>{
  let readCalls=0,nativeCalls=0,actionCalls=0;
  const reply=await invoke({
    stillCurrent:()=>false,
    readWiki:async()=>{readCalls++;return wiki();},
    nativeProgram:async()=>{nativeCalls++;return {};},
    readAction:()=>{actionCalls++;return {};},
  });
  assert.equal(reply.outcome,'refused');
  assert.equal(reply.reasonCode,'PROGRAM_RECIPE_STALE');
  assert.equal(readCalls,0);assert.equal(nativeCalls,0);assert.equal(actionCalls,0);
  inert(reply);
});

test('revocation after source evidence but before final readback suppresses all results',async()=>{
  let allowed=true,readCalls=0,actionCalls=0;
  const reply=await invoke({
    stillCurrent:()=>allowed,
    readWiki:async()=>{readCalls++;return wiki();},
    readEvidence:sourceEvidence(7,()=>{allowed=false;}),
    readAction:()=>{actionCalls++;return {wikiRevision:7,pages:[]};}
  });
  assert.equal(reply.outcome,'refused');
  assert.equal(reply.reasonCode,'PROGRAM_RECIPE_STALE');
  assert.equal(readCalls,2);assert.equal(actionCalls,0);
  assert.equal(reply.steps,undefined);
  inert(reply);
});

test('same-revision source change during readback is stale and never returns data',async()=>{
  let calls=0,actions=0;
  const reply=await invoke({
    readWiki:async()=>{
      calls++;
      const snapshot=wiki();
      if(calls===2)snapshot.pages.Inbox.sections.About='synthetic changed source';
      return snapshot;
    },
    readAction:()=>{actions++;return {wikiRevision:7,pages:[]};}
  });
  assert.equal(reply.outcome,'refused');
  assert.equal(reply.reasonCode,'PROGRAM_WIKI_STALE');
  assert.equal(calls,2);assert.equal(actions,0);
  inert(reply);
});

test('stale source evidence is unavailable and does not reach native or read actions',async()=>{
  let actions=0,nativeCalls=0;
  const reply=await invoke({
    readEvidence:async()=>({schema:'vivim.wiki-program-evidence/1',
      authority:'host-product-journal',wikiRevision:6,items:[]}),
    nativeProgram:async()=>{nativeCalls++;return {};},
    readAction:()=>{actions++;return {};}
  });
  assert.equal(reply.outcome,'unavailable');
  assert.equal(reply.reasonCode,'PROGRAM_SOURCE_UNAVAILABLE');
  assert.equal(nativeCalls,0);assert.equal(actions,0);
  inert(reply);
});

test('unchanged admitted source completes as read-only without a mutation',async()=>{
  let reads=0,actions=0;
  const reply=await invoke({
    readWiki:async()=>{reads++;return wiki();},
    readAction:()=>{actions++;return {wikiRevision:7,pages:['Inbox']};}
  });
  assert.equal(reply.outcome,'completed');
  assert.equal(reply.authority,'read-only');
  assert.equal(reply.wikiRevision,7);
  assert.equal(reply.steps.length,2);
  assert.equal(reads,2);assert.equal(actions,2);
  inert(reply);
});

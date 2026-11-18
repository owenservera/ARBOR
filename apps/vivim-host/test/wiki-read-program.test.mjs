import test from 'node:test';
import assert from 'node:assert/strict';
import {runWikiReadProgram} from '../control/wiki-read-program.mjs';
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

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

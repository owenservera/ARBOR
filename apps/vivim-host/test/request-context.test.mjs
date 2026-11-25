import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { requestSourceIds, selectRequestWiki, selectRequestActionContract, attachRequestContext } from '../control/request-context.mjs';

import { createControlPlanner, loadControlCatalog } from '../control/intent-planner.mjs';

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


test('actual catalog-bound read intent carries declared slots but never execution or access grants', async () => {
  const catalog=loadControlCatalog();
  const planner=createControlPlanner({catalog});
  const text='read wiki page main in section about';
  const typed=planner.planText(text,{source:'desktop'});
  assert.equal(typed.actionId,'wiki.section.read');
  assert.equal(typed.executionPerformed,false);
  const contract=selectRequestActionContract(typed,catalog);
  assert.equal(contract.status,'declared');
  assert.equal(contract.catalogRevision,catalog.version);
  assert.equal(contract.planningEligible,false);
  assert.deepEqual(contract.slots,[{name:'page',type:'string',required:true,min:1,max:80},
    {name:'section',type:'string',required:true,min:1,max:80}]);
  assert.deepEqual(contract.missing,['verified-action-contract','effective-access-policy']);
  assert.match(contract.declarationDigest,/^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(contract).includes('"main"'));
  assert.ok(!JSON.stringify(contract).includes('"about"'));
  assert.deepEqual(selectRequestActionContract({...typed,args:{...typed.args,page:'other'}},catalog),{status:'unavailable'});
  assert.deepEqual(selectRequestActionContract(typed,{...catalog,version:catalog.version+1}),{status:'stale'});
  const result=await attachRequestContext(typed,{text,compileSources:async()=>({status:'unavailable'}),
    readCatalog:()=>catalog});
  assert.deepEqual(result.requestContext.action,contract);
  assert.equal(result.executionPerformed,false);
  const phone=await attachRequestContext(typed,{text,readWiki:async()=>wiki});
  assert.equal(phone.requestContext?.action,undefined);
  const drift=await attachRequestContext(typed,{text,compileSources:async()=>({status:'unavailable'}),
    readCatalog:()=>({...catalog,version:catalog.version+1})});
  assert.deepEqual(drift.requestContext.action,{status:'stale'});
});

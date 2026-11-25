import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDevIntelligence } from '../lib/arbor-service.mjs';
import { createControlPlanner } from '../../apps/vivim-host/control/intent-planner.mjs';
import { attachRequestContext } from '../../apps/vivim-host/control/request-context.mjs';

test('real VLANG implementation, multilingual typed intent and AutoWiki share source pins before and after reindex',async()=>{
  const root=mkdtempSync(join(tmpdir(),'arbor-semantic-wiki-'));
  const sourceRoot=join(root,'source'), dataDir=join(root,'data');
  mkdirSync(sourceRoot);
  const file=join(sourceRoot,'intent-planner.mjs');
  const original=readFileSync(new URL('../../apps/vivim-host/control/intent-planner.mjs',import.meta.url),'utf8');
  writeFileSync(file,original);
  try {
    const hq=createDevIntelligence({mode:'diagnostic',dataDir,approvedRoots:[sourceRoot]});
    hq.registerSource({name:'actual-control',path:sourceRoot});
    assert.equal(hq.index({useGit:false}).errors.length,0);
    const text='Muéstrame las páginas de la wiki';
    const planner=createControlPlanner();
    const plan=planner.planText(text,{source:'desktop'});
    assert.equal(plan.actionId,'wiki.pages.list');
    assert.equal(plan.executionPerformed,false);
    const compileSources=params=>hq.compiledContext(params);
    const result=await attachRequestContext(plan,{text,compileSources});
    assert.equal(result.requestContext.source.status,'indexed');
    assert.equal(result.requestContext.action.status,'declared');
    assert.equal(result.requestContext.action.planningEligible,false);
    const bundle=result.requestContext.source.context;
    assert.equal(bundle.semanticPacket.planningEligible,false);
    assert.equal(hq.verifyContext(bundle).valid,true);
    assert.ok(bundle.semanticPacket.dependencies.length>0);
    const wikiFile=join(dataDir,'wiki','semantics.md');
    hq.wiki();
    let wiki=readFileSync(wikiFile,'utf8');
    assert.match(wiki,/Indexed semantic occurrences/);
    assert.match(wiki,/No semantic identity is registered/);
    for(const dep of bundle.semanticPacket.dependencies){
      assert.ok(wiki.includes(dep.semanticId));
      assert.ok(wiki.includes(dep.anchorId));
      assert.ok(wiki.includes(dep.fingerprint));
      assert.ok(wiki.includes(dep.contentHash));
    }
    // Actual implementation bytes change in the isolated copy, not in main or
    // the live Host. Old pins must fail before reindex; new Wiki pins must agree.
    writeFileSync(file,original+'\n// isolated source revision for semantic projection regression\n');
    assert.equal(hq.verifyContext(bundle).valid,false);
    const stale=await attachRequestContext(plan,{text,compileSources});
    assert.equal(stale.requestContext.source.status,'stale');
    assert.equal(hq.index({useGit:false}).errors.length,0);
    const fresh=await attachRequestContext(plan,{text,compileSources});
    assert.equal(fresh.requestContext.source.status,'indexed');
    const updated=fresh.requestContext.source.context;
    assert.notEqual(updated.digest,bundle.digest);
    assert.equal(hq.verifyContext(updated).valid,true);
    hq.wiki();
    wiki=readFileSync(wikiFile,'utf8');
    for(const dep of updated.semanticPacket.dependencies){
      const prior=bundle.semanticPacket.dependencies.find(x=>x.anchorId===dep.anchorId);
      assert.ok(prior);
      assert.notEqual(prior.fingerprint,dep.fingerprint);
      assert.ok(wiki.includes(dep.fingerprint));
      assert.ok(!wiki.includes(prior.fingerprint));
    }
    assert.equal(hq.semanticIds().length??hq.semanticIds().items?.length??0,0);
  }finally{rmSync(root,{recursive:true,force:true})}
});

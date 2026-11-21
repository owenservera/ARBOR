import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {projectCraftIntelligence,registerCraftIntelRoutes,CRAFT_INTEL_SCHEMA} from '../../src/studio/craft-intel-routes.mjs';
const id='ev_'+'a'.repeat(64);
function atlas(){
  return {schema:'vivim.application-surface-atlas/0.1',
    target:{siteId:'vivim-mvp',origin:'http://127.0.0.1:4173',ownedTarget:true},
    source:{producer:'craft-anything',version:1,bundleDigest:'b'.repeat(64),nativeVerified:false},
    evidence:[{evidenceId:id,operation:'web_site_capture'}],
    controls:[{sourceEvidenceId:id,role:'button',label:'PRIVATE USER TEXT',effectAuthorized:false,locatorVerified:false}],
    observations:[{kind:'website-capture',evidenceId:id,effectAuthorized:false}],
    unknownIds:['private-note'],
    authority:{executionAuthorized:false,activationPermitted:false,sendPermission:false}};
}
function recon(){
  return {schema:'vivim.application-surface-reconciliation/1',
    target:{siteId:'vivim-mvp',origin:'http://127.0.0.1:4173'},
    features:[{owner:'studio',featureId:'project.create',observationStatus:'not-observed-in-scoped-capture',sourcePath:'PRIVATE PATH'}],
    divergences:[{onlyInFirst:['PRIVATE SELECTOR']}],
    authority:{executionAuthorized:false,activationPermitted:false}};
}
test('projection summarizes without private labels or selectors',()=>{
  const p=projectCraftIntelligence(atlas(),recon());
  assert.equal(p.schema,CRAFT_INTEL_SCHEMA);
  assert.equal(p.counts.controls,1);
  assert.equal(p.reconciliation.sourceDivergences,1);
  assert.equal(p.authority.executionAuthorized,false);
  assert.ok(!JSON.stringify(p).includes('PRIVATE'));
});
test('reconciliation target and effect authority are strict',()=>{
  const r=recon();r.target.origin='https://other.example';
  assert.throws(()=>projectCraftIntelligence(atlas(),r),{code:'CRAFT_RECONCILIATION_REJECTED'});
  const a=atlas();a.authority.activationPermitted=true;
  assert.throws(()=>projectCraftIntelligence(a),{code:'CRAFT_ATLAS_REJECTED'});
});
test('a control must reference a known evidence record',()=>{
  const a=atlas();a.controls[0].sourceEvidenceId='ev_'+'f'.repeat(64);
  assert.throws(()=>projectCraftIntelligence(a),{code:'CRAFT_ATLAS_REJECTED'});
});
test('unconfigured mode cannot write or call a browser',()=>{
  const found=[];registerCraftIntelRoutes({add:(...a)=>found.push(a),atlasPath:()=>null});
  assert.equal(found.length,1);assert.equal(found[0][0],'GET');
  assert.equal(found[0][3]().status,'not-configured');
});
test('path comes from operator config, not an HTTP argument',()=>{
  const dir=mkdtempSync(join(tmpdir(),'studio-craft-'));
  const path=join(dir,'atlas.json');writeFileSync(path,JSON.stringify(atlas()));
  const routes=[];registerCraftIntelRoutes({add:(...a)=>routes.push(a),atlasPath:()=>path,reconciliationPath:()=>null});
  const projected=routes[0][3]({q:{path:'/etc/passwd'},body:{path:'/etc/passwd'}});
  assert.equal(projected.counts.controls,1);
});
test('refuses malformed source identity, authorization and unknown references',()=>{
  const a=atlas();a.evidence[0].operation='invalid private data';
  assert.throws(()=>projectCraftIntelligence(a),{code:'CRAFT_ATLAS_REJECTED'});
  const b=atlas();b.observations[0].evidenceId='ev_'+'c'.repeat(64);
  assert.throws(()=>projectCraftIntelligence(b),{code:'CRAFT_ATLAS_REJECTED'});
});

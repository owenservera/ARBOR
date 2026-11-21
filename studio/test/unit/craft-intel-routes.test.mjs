import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
  projectCraftIntelligence,projectCraftDelta,parseCraftSourceIndex,registerCraftIntelRoutes,
  CRAFT_INTEL_SCHEMA,CRAFT_DELTA_SCHEMA,CRAFT_SOURCE_INDEX_SCHEMA,
} from '../../src/studio/craft-intel-routes.mjs';
const id='ev_'+'a'.repeat(64), id2='ev_'+'b'.repeat(64);
const schema='vivim.application-surface-atlas/0.1';
function atlas(){return {schema,target:{siteId:'vivim-mvp',origin:'http://127.0.0.1:4173',ownedTarget:true},
  source:{producer:'craft-anything',version:1,bundleDigest:'b'.repeat(64),nativeVerified:false},
  evidence:[{evidenceId:id,operation:'web_site_capture',confidence:'observed',coverage:'partial',limitationCodes:['one_state']}],
  controls:[{sourceEvidenceId:id,role:'button',label:'PRIVATE CONTENT',effectAuthorized:false,locatorVerified:false}],
  observations:[{kind:'website-capture',evidenceId:id,effectAuthorized:false}],
  unknownIds:['PRIVATE UNKNOWN'],
  authority:{executionAuthorized:false,activationPermitted:false,sendPermission:false}};}
function recon(){return {schema:'vivim.application-surface-reconciliation/1',
  target:{siteId:'vivim-mvp',origin:'http://127.0.0.1:4173'},
  features:[{owner:'studio',featureId:'project.create',observationStatus:'not-observed-in-scoped-capture',sourcePath:'PRIVATE PATH',evidenceRefs:[{evidenceId:id}]}],
  divergences:[{onlyInFirst:['PRIVATE SELECTOR']}],unmapped:[{label:'PRIVATE LABEL'}],
  authority:{executionAuthorized:false,activationPermitted:false,sendPermission:false}};}
function index(targets){return {schema:CRAFT_SOURCE_INDEX_SCHEMA,targets};}
const pathFile=(dir,name,data)=>{let p=join(dir,name);writeFileSync(p,JSON.stringify(data));return p;};
function setup(){const dir=mkdtempSync(join(tmpdir(),'arbor-craft-test-'));return {dir,cleanup:()=>rmSync(dir,{recursive:true,force:true})};}
function routes(opts){const all=[];registerCraftIntelRoutes({add:(...args)=>all.push(args),...opts});return all;}
function route(all,suffix){let r=all.find(x=>x[1]===suffix);assert.ok(r,`missing ${suffix}`);return r[3];}

test('projection preserves old summary contract and adds provenance without target text',()=>{
  const r=projectCraftIntelligence(atlas(),recon());
  assert.equal(r.schema,CRAFT_INTEL_SCHEMA);
  assert.equal(r.counts.controls,1);
  assert.equal(r.reconciliation.sourceDivergences,1);
  assert.deepEqual(r.confidence,[{confidence:'observed',count:1}]);
  assert.equal(r.evidence[0].evidenceId,id);
  assert.equal(r.reconciliation.features[0].evidenceCount,1);
  assert.equal(r.source.verificationAuthority,'unattested-external-report');
  assert.equal(r.authority.executionAuthorized,false);
  assert.ok(!JSON.stringify(r).includes('PRIVATE'));
});
test('rejects reconciliation target conflicts and executable authority',()=>{
  const r=recon();r.target.origin='https://wrong.example';
  assert.throws(()=>projectCraftIntelligence(atlas(),r),{code:'CRAFT_RECONCILIATION_REJECTED'});
  const a=atlas();a.authority.activationPermitted=true;
  assert.throws(()=>projectCraftIntelligence(a),{code:'CRAFT_ATLAS_REJECTED'});
});
test('controls and observations must link to evidence',()=>{
  const a=atlas();a.controls[0].sourceEvidenceId=id2;
  assert.throws(()=>projectCraftIntelligence(a),{code:'CRAFT_ATLAS_REJECTED'});
  const b=atlas();b.observations[0].evidenceId=id2;
  assert.throws(()=>projectCraftIntelligence(b),{code:'CRAFT_ATLAS_REJECTED'});
});
test('rejects duplicate evidence and unknown observation kind',()=>{
  const a=atlas();a.evidence.push(a.evidence[0]);
  assert.throws(()=>projectCraftIntelligence(a),{code:'CRAFT_ATLAS_REJECTED'});
  const b=atlas();b.observations[0].kind='script';
  assert.throws(()=>projectCraftIntelligence(b),{code:'CRAFT_ATLAS_REJECTED'});
});
test('rejected confidence and coverage cannot look measured',()=>{
  const a=atlas();a.evidence[0].confidence='proven';
  assert.throws(()=>projectCraftIntelligence(a),{code:'CRAFT_ATLAS_REJECTED'});
  const b=atlas();b.evidence[0].coverage='unlimited';
  assert.throws(()=>projectCraftIntelligence(b),{code:'CRAFT_ATLAS_REJECTED'});
});
test('records state types but never a clickable control descriptor',()=>{
  const a=atlas();a.observations.push({kind:'interaction-state',evidenceId:id,effectAuthorized:false,label:'PRIVATE'});
  const p=projectCraftIntelligence(a);
  assert.equal(p.counts.states,1);
  assert.deepEqual(p.observationKinds,[{kind:'interaction-state',count:1},{kind:'website-capture',count:1}]);
  assert.ok(!JSON.stringify(p).includes('PRIVATE'));
});
test('delta tracks observations, not application feature removal',()=>{
  const before=atlas(),after=atlas();
  after.evidence.push({evidenceId:id2,operation:'web_page_states_capture',confidence:'derived',coverage:'partial'});
  after.controls.push({sourceEvidenceId:id2,role:'tab',label:'PRIVATE',effectAuthorized:false,locatorVerified:false});
  after.observations.push({kind:'state-capture',evidenceId:id2,effectAuthorized:false});
  const d=projectCraftDelta(before,after);
  assert.equal(d.schema,CRAFT_DELTA_SCHEMA);
  assert.equal(d.observedEvidence.added,1);
  assert.equal(d.states.after,1);
  assert.equal(d.status,'observation-difference-only');
  assert.equal(d.roleCounts.find(x=>x.role==='tab').delta,1);
  assert.equal(d.authority.executionAuthorized,false);
});
test('delta refuses cross-origin comparison',()=>{
  const b=atlas();b.target.origin='https://example.invalid';
  assert.throws(()=>projectCraftDelta(atlas(),b),{code:'CRAFT_DELTA_SCOPE_MISMATCH'});
});
test('index requires exact identities and absolute operator paths',()=>{
  assert.throws(()=>parseCraftSourceIndex(index([{siteId:'a',atlasPath:'relative/file'}])),{code:'CRAFT_INDEX_REJECTED'});
  assert.throws(()=>parseCraftSourceIndex(index([{siteId:'a',atlasPath:'/tmp/a'},{siteId:'a',atlasPath:'/tmp/b'}])),{code:'CRAFT_INDEX_REJECTED'});
  assert.throws(()=>parseCraftSourceIndex(index([{siteId:'a',atlasPath:'/tmp/a',sendPermission:true}])),{code:'CRAFT_INDEX_REJECTED'});
});
test('index sorts entries deterministically and does not echo source paths',()=>{
  const r=parseCraftSourceIndex(index([{siteId:'z',atlasPath:'/tmp/z'},{siteId:'a',atlasPath:'/tmp/a'}]));
  assert.deepEqual(r.map(x=>x.siteId),['a','z']);
});
test('unconfigured legacy route is inert and registered beside new read routes',()=>{
  const all=routes({atlasPath:()=>null,indexPath:()=>null});
  assert.equal(all.length,4);
  assert.ok(all.every(x=>x[0]==='GET'&&x[4]?.annotations?.readOnlyHint===true));
  assert.equal(route(all,'/dev/craft-intelligence')().status,'not-configured');
  const listed=route(all,'/dev/craft-intelligence/targets')();
  assert.deepEqual(listed.targets,[]);
});
test('operator index selects target and ignores request-supplied file path',()=>{
  const {dir,cleanup}=setup();
  try{
    const atlasPath=pathFile(dir,'atlas.json',atlas());
    const reconcilePath=pathFile(dir,'recon.json',recon());
    const idx=pathFile(dir,'index.json',index([{siteId:'vivim-mvp',atlasPath,reconciliationPath:reconcilePath}]));
    const all=routes({indexPath:()=>idx,atlasPath:()=>'/etc/passwd'});
    assert.equal(route(all,'/dev/craft-intelligence')().status,'index-configured');
    const listed=route(all,'/dev/craft-intelligence/targets')();
    assert.equal(listed.targets[0].siteId,'vivim-mvp');
    assert.ok(!JSON.stringify(listed).includes(dir));
    const p=route(all,'/dev/craft-intelligence/targets/{siteId}')({p:{siteId:'vivim-mvp'},q:{file:'/etc/passwd'},body:{file:'/etc/passwd'}});
    assert.equal(p.counts.evidence,1);
    assert.ok(!JSON.stringify(p).includes(dir));
  }finally{cleanup();}
});
test('registered id must equal atlas target identity',()=>{
  const {dir,cleanup}=setup();try{
    const a=atlas();a.target.siteId='unexpected';
    const file=pathFile(dir,'atlas.json',a);
    const idx=pathFile(dir,'index.json',index([{siteId:'vivim-mvp',atlasPath:file}]));
    const all=routes({indexPath:()=>idx});
    assert.throws(()=>route(all,'/dev/craft-intelligence/targets/{siteId}')({p:{siteId:'vivim-mvp'}}),{code:'CRAFT_TARGET_MISMATCH'});
  }finally{cleanup();}
});
test('unknown requested site does not trigger arbitrary file lookup',()=>{
  const {dir,cleanup}=setup();try{
    const file=pathFile(dir,'atlas.json',atlas());
    const idx=pathFile(dir,'index.json',index([{siteId:'vivim-mvp',atlasPath:file}]));
    const all=routes({indexPath:()=>idx});
    assert.throws(()=>route(all,'/dev/craft-intelligence/targets/{siteId}')({p:{siteId:'elsewhere'}}),{code:'CRAFT_TARGET_MISSING'});
  }finally{cleanup();}
});
test('configured previous capture emits read-only delta',()=>{
  const {dir,cleanup}=setup();try{
    const before=atlas(),after=atlas();
    after.observations.push({kind:'state-capture',evidenceId:id,effectAuthorized:false});
    const atlasPath=pathFile(dir,'atlas.json',after),previousAtlasPath=pathFile(dir,'previous.json',before);
    const idx=pathFile(dir,'index.json',index([{siteId:'vivim-mvp',atlasPath,previousAtlasPath}]));
    const all=routes({indexPath:()=>idx});
    const d=route(all,'/dev/craft-intelligence/targets/{siteId}/delta')({p:{siteId:'vivim-mvp'}});
    assert.equal(d.states.before,0);assert.equal(d.states.after,1);
  }finally{cleanup();}
});
test('no previous atlas reports missing without inventing change claims',()=>{
  const {dir,cleanup}=setup();try{
    const atlasPath=pathFile(dir,'atlas.json',atlas());
    const idx=pathFile(dir,'index.json',index([{siteId:'vivim-mvp',atlasPath}]));
    const all=routes({indexPath:()=>idx});
    assert.throws(()=>route(all,'/dev/craft-intelligence/targets/{siteId}/delta')({p:{siteId:'vivim-mvp'}}),{code:'CRAFT_DELTA_UNAVAILABLE'});
  }finally{cleanup();}
});
test('legacy single-atlas API stays compatible',()=>{
  const {dir,cleanup}=setup();try{
    const p=pathFile(dir,'atlas.json',atlas());
    const all=routes({atlasPath:()=>p,indexPath:()=>null,reconciliationPath:()=>null});
    const data=route(all,'/dev/craft-intelligence')();
    assert.equal(data.counts.controls,1);
    assert.equal(route(all,'/dev/craft-intelligence/targets')().targets[0].siteId,'vivim-mvp');
  }finally{cleanup();}
});
test('invalid configured JSON is refused rather than represented as no data',()=>{
  const {dir,cleanup}=setup();try{
    const p=join(dir,'invalid.json');writeFileSync(p,'not-json');
    const all=routes({indexPath:()=>p});
    assert.throws(()=>route(all,'/dev/craft-intelligence/targets')(),{code:'CRAFT_SOURCE_INVALID'});
  }finally{cleanup();}
});

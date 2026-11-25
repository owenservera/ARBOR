import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectCraftNativeProjection} from '../control/craft-intelligence-native.mjs';
import {projectCraftIntelligence} from '../../../studio/src/studio/craft-intel-routes.mjs';

const id='ev_'+'a'.repeat(64), id2='ev_'+'b'.repeat(64);
const authority=()=>({executionAuthorized:false,activationPermitted:false,sendPermission:false});
const fixture=(siteId='chatgpt',origin='https://chatgpt.com')=>({
  atlas:{schema:'vivim.application-surface-atlas/0.1',target:{siteId,origin},
    source:{producer:'craft-anything',version:1,bundleDigest:'b'.repeat(64),nativeVerified:true},
    evidence:[{evidenceId:id,operation:'web_site_capture',confidence:'observed',coverage:'partial',private:'PRIVATE'},{evidenceId:id2,operation:'web_page_states_capture',cleanRoom:true}],
    controls:[{sourceEvidenceId:id,role:'button',label:'PRIVATE',effectAuthorized:false,locatorVerified:false}],
    observations:[{evidenceId:id2,kind:'state-capture',effectAuthorized:false}],
    unknownIds:[],authority:authority()},
  reconciliation:{schema:'vivim.application-surface-reconciliation/1',target:{siteId,origin},
    features:[{owner:'studio',featureId:'chat.composer',evidenceRefs:[{evidenceId:id,position:0},{evidenceId:id,position:0},{evidenceId:id2}]}],
    divergences:[],unmapped:[],authority:authority()}
});
const mirror=(op,{atlas,reconciliation})=>({schema:'vivim.application-intelligence-native/1',
  executionAuthorized:false,projection:projectCraftIntelligence(atlas,reconciliation)});

test('comparison preserves incumbent wire format and inert authority',()=>{
  const f=fixture(), r=inspectCraftNativeProjection(f,{nativeProject:mirror});
  assert.equal(r.status,'native-matched');
  assert.deepEqual(r.projection,projectCraftIntelligence(f.atlas,f.reconciliation));
  assert.equal(r.source.selected,'studio-incumbent');
  assert.deepEqual(r.authority,authority());
  assert.ok(!JSON.stringify(r).includes('PRIVATE'));
});
test('unavailable binary, failure, divergence and authority elevation are explicit',()=>{
  const f=fixture();
  for(const [nativeProject,expected] of [
    [()=>null,'native-unavailable-or-refused'],
    [()=>{throw Error('PRIVATE')},'native-failed'],
    [()=>({...mirror('',f),projection:{private:'PRIVATE'}}),'native-diverged'],
    [()=>({...mirror('',f),executionAuthorized:true}),'native-diverged']
  ]) {
    const r=inspectCraftNativeProjection(f,{nativeProject});
    assert.equal(r.status,expected);
    assert.ok(!JSON.stringify(r).includes('PRIVATE'));
    assert.equal(r.authority.executionAuthorized,false);
  }
});
test('invalid incumbent evidence never reaches the native port',()=>{
  const f=fixture();f.atlas.controls[0].sourceEvidenceId='ev_'+'c'.repeat(64);
  let called=false;
  assert.throws(()=>inspectCraftNativeProjection(f,{nativeProject:()=>{called=true}}),{code:'CRAFT_ATLAS_REJECTED'});
  assert.equal(called,false);
});

// The previous tests exercise adapter control flow only. Enable this test on
// a source-matched packaged binary; no fixture is represented as live evidence.
test('native binary parity across campaign origins and owned Host',
  {skip:process.env.VIVIM_TEST_CRAFT_NATIVE!=='1'},()=>{
    for(const [siteId,origin] of [['chatgpt','https://chatgpt.com'],['claude','https://claude.ai'],['gemini','https://gemini.google.com'],['facebook','https://www.facebook.com'],['vivim-mvp','http://127.0.0.1:43187']]){
      const r=inspectCraftNativeProjection(fixture(siteId,origin));
      assert.equal(r.status,'native-matched',siteId);
    }
  });

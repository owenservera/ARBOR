import test from 'node:test';
import assert from 'node:assert/strict';
import { projectHviInspector } from '../src/visual-runtime/knowledge/hvi-inspector.mjs';
const A='a'.repeat(64),B='b'.repeat(64),C='c'.repeat(64),D='d'.repeat(64),E='e'.repeat(64);
const sample=(n=3)=>{const ids=[A,B,C,D,E].slice(0,n),target=ids.at(-1);
const comparison={schema:'arbor.hvi.version-comparison/1',targetPinId:target,reproducibilityDigest:'f'.repeat(64),
sourcePins:ids.map((x,i)=>({pinId:x,repoIdentity:'synthetic/repo'+i,resolvedCommitSha:String(i+1).repeat(40),completeness:'complete'})),
sourceDeltas:ids.slice(0,-1).map((x,i)=>({id:'finding-'+i,originPinId:x,targetPinId:target,originPath:'src/a.mjs',targetPaths:['src/b.mjs'],state:'EXACT_RELOCATION',certainty:'source_verified',evidenceRefs:['fixture']})),
coverage:ids.slice(0,-1).map(x=>({sourcePinId:x,targetPinId:target,sourceCompleteness:'complete',targetCompleteness:'complete',totalCompared:1})),
limits:{truncated:false},errors:[]};
return {schema:'arbor.hvi.adapter.comparison-report/1',runtimeAccepted:false,syntheticPreviewAllowed:true,status:'SOURCE_ONLY_UNVERIFIED',sourceComparisonDigest:'f'.repeat(64),originalComparison:comparison,report:{schema:'arbor.hvi.report/1',targetPinId:target}};
};
test('empty does not scan or show phantom results',()=>{let v=projectHviInspector();assert.equal(v.mode,'empty');assert.equal(v.actions.length,0);assert.equal(v.featureEnabled,false)});
test('denied and revoked suppress source metadata',()=>{for(const permission of ['denied','revoked']){let v=projectHviInspector({envelope:sample(),permission});assert.equal(v.mode,'denied');assert.equal(v.pins.length,0)}});
test('three synthetic revision matrix is read-only',()=>{let v=projectHviInspector({envelope:sample(),synthetic:true});assert.equal(v.pins.length,3);assert.equal(v.rows[0].sourceState,'EXACT_RELOCATION');assert.equal(v.rows[0].capabilityState,'UNKNOWN');assert.equal(v.runtimeVerified,false);assert.equal(v.featureEnabled,false)});
test('five synthetic repository matrix retains full selected pin count',()=>{let v=projectHviInspector({envelope:sample(5),synthetic:true});assert.equal(v.pins.length,5);assert.equal(v.coverage.length,4)});
test('incomplete scan stays partial and cannot assert capability absence',()=>{let x=sample();x.originalComparison.sourcePins[0].completeness='partial';let v=projectHviInspector({envelope:x});assert.equal(v.mode,'partial');assert.equal(v.rows[0].capabilityState,'UNKNOWN')});
test('forged runtime accepted and mismatched digest are rejected',()=>{let x=sample();x.runtimeAccepted=true;assert.throws(()=>projectHviInspector({envelope:x}),{code:'UNTRUSTED_REPORT'});let y=sample();y.sourceComparisonDigest='0'.repeat(64);assert.throws(()=>projectHviInspector({envelope:y}),{code:'UNTRUSTED_REPORT'})});
test('invalid selectors and bounds fail closed',()=>{let x=sample();assert.throws(()=>projectHviInspector({envelope:x,selectedPins:[A,A]}),{code:'INVALID_SELECTION'});assert.throws(()=>projectHviInspector({envelope:x,limit:201}),{code:'RESOURCE_LIMIT'})});

import { renderHviInspector, HVI_INSPECTOR_FEATURE } from '../src/visual-runtime/render/hvi-inspector.mjs';
const renderOpts={expectedRevision:7,currentRevision:7,synthetic:true,previewSynthetic:true};
const flatten=(node)=>[node,...node.children.flatMap(flatten)];
test('same repository at three invented SHAs remains three distinct selectors and renders via canonical renderer',()=>{
  const e=sample();e.originalComparison.sourcePins.forEach(p=>p.repoIdentity='invented/same-repo');
  const r=renderHviInspector({...renderOpts,envelope:e},{viewportPx:360});
  assert.equal(r.mode,'source-report');assert.ok(r.document.nodes.length>4);
  assert.ok(r.document.nodes[0].children.length>=1,'grouped canonical sections are present');
  assert.equal(r.renderPlan.schema,'vivim.ui-render-plan/1');
  assert.equal(r.renderPlan.status,'ok');assert.equal(r.published,false);assert.equal(r.effectsInvoked,false);
  // Count the pin SELECTORS, not every node naming the repo: the target-relative
  // coverage rows legitimately repeat the repo label and are not extra selectors.
  const all=flatten(r.renderPlan.root);
  const selectors=all.filter(n=>/^(?:SOURCE|TARGET) /.test(n.text||''));
  assert.equal(selectors.length,3);
  assert.equal(new Set(selectors.map(n=>n.text)).size,3);
  assert.ok(selectors.every(n=>(n.text||'').includes('invented/same-repo')));
  assert.equal(all.filter(n=>/: complete \/ target complete; observed/.test(n.text||'')).length,2);
});
test('five synthetic repositories render in phone and desktop viewports without actions',()=>{
  for(const viewportPx of [320,390,1280]){
    const r=renderHviInspector({...renderOpts,envelope:sample(5)},{viewportPx});
    assert.equal(r.renderPlan.status,'ok');
    assert.deepEqual(r.renderPlan.focusOrder,[]);
    assert.equal(r.document.views.length,2);
    assert.equal(r.document.nodes.every(n=>!n.actionRefs||n.actionRefs.length===0),true);
  }
});
test('denied, revoked, stale publisher revision and cancellation hide all pins',()=>{
  for(const opts of [{permission:'denied'},{permission:'revoked'},{expectedRevision:6},{phase:'cancelled'}]){
    const r=renderHviInspector({...renderOpts,envelope:sample(5),...opts});
    assert.equal(['denied','stale','cancelled'].includes(r.mode),true);
    assert.equal(JSON.stringify(r).includes('synthetic/repo'),false);
  }
});
test('real report remains feature-gated even with caller-supplied granted permission',()=>{
  const r=renderHviInspector({envelope:sample(3),permission:'granted',expectedRevision:7,currentRevision:7});
  assert.equal(r.mode,'unavailable');assert.equal(HVI_INSPECTOR_FEATURE.enabled,false);
  assert.equal(JSON.stringify(r).includes('synthetic/repo'),false);
});
test('access request, progress and cancelled states are inert and explicit',()=>{
  for(const [phase,mode] of [['request','request-access'],['progress','progress'],['cancelled','cancelled']]){
    const r=renderHviInspector({expectedRevision:1,currentRevision:1,phase});
    assert.equal(r.mode,mode);assert.equal(r.renderPlan.status,'ok');
  }
});
test('synthetic partial, truncated, expansion and revised target do not claim verified results',()=>{
  const e=sample(5);e.originalComparison.limits.truncated=true;
  const finding=e.originalComparison.sourceDeltas[0].id;
  const partial=renderHviInspector({...renderOpts,envelope:e,expandedRowIds:[finding],limit:1});
  assert.equal(partial.mode,'partial');assert.equal(partial.renderPlan.status,'ok');
  assert.equal(partial.feature.liveResultRendering,false);
  const target=e.originalComparison.sourcePins[1].pinId;
  const changed=renderHviInspector({...renderOpts,envelope:e,targetPinId:target});
  assert.equal(changed.mode,'request-access');assert.equal(JSON.stringify(changed).includes('synthetic/repo'),false);
});
test('secret-looking synthetic paths are redacted and cannot reach canonical HTML text',()=>{
  const e=sample();e.originalComparison.sourceDeltas[0].originPath='.env.production';
  e.originalComparison.sourceDeltas[0].targetPaths=['secrets/password.key'];
  const r=renderHviInspector({...renderOpts,envelope:e,expandedRowIds:['finding-0']});
  assert.equal(r.renderPlan.status,'ok');assert.equal(JSON.stringify(r).includes('.env.production'),false);
  assert.equal(JSON.stringify(r).includes('secrets/password.key'),false);
});
test('digest, scope, malformed expansion and viewport fail safely',()=>{
  const e=sample();const r=renderHviInspector({...renderOpts,envelope:e,expectedDigest:'0'.repeat(64)});
  assert.equal(r.mode,'stale');
  assert.throws(()=>renderHviInspector({...renderOpts,envelope:e,ownerRef:'../bad'}),/INVALID_SCOPE/);
  assert.throws(()=>renderHviInspector({...renderOpts,envelope:e,expandedRowIds:[1]}),/INVALID_EXPANSION/);
  assert.equal(renderHviInspector({...renderOpts,envelope:e},{viewportPx:120}).renderPlan.status,'unavailable');
});

test('uninitialized inspector has an actual empty state, not a stale source',()=>{
  const r=renderHviInspector();
  assert.equal(r.mode,'empty');
  assert.equal(r.renderPlan.status,'ok');
  assert.equal(JSON.stringify(r).includes('synthetic/repo'),false);
});
test('maximum 16 invented source pins keep the canonical child/label bounds',()=>{
  const ids=Array.from({length:16},(_,i)=>i.toString(16).padStart(64,'0'));
  const target=ids.at(-1), e=sample();
  e.originalComparison.targetPinId=target;e.report.targetPinId=target;
  e.originalComparison.sourcePins=ids.map((pinId,i)=>({
    pinId,repoIdentity:'invented/repo'+i,resolvedCommitSha:i.toString(16).repeat(40),completeness:'complete',
  }));
  e.originalComparison.coverage=ids.slice(0,-1).map(sourcePinId=>({
    sourcePinId,targetPinId:target,sourceCompleteness:'complete',
    targetCompleteness:'complete',totalCompared:1,
  }));
  e.originalComparison.sourceDeltas=ids.slice(0,-1).map((originPinId,i)=>({
    id:'synthetic-finding-'+i,originPinId,targetPinId:target,originPath:'src/main.ts',
    targetPaths:['src/renamed.ts'],state:'EXACT_RELOCATION',
    certainty:'source_verified',evidenceRefs:['fixture'],
  }));
  const r=renderHviInspector({...renderOpts,envelope:e});
  assert.equal(r.mode,'source-report');
  assert.equal(r.renderPlan.status,'ok');
  assert.ok(r.document.nodes.length<=64);
  assert.ok(r.document.nodes.every(n=>n.children.length<=24));
  assert.ok(r.document.nodes.every(n=>n.a11y.name.length<=120));
  assert.equal(r.feature.enabled,false);
});

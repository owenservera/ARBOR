/**
 * G2: executable synthetic Host -> sanitized metadata -> inert TierFlow seam.
 * No real repository, donor, token, provider, browser, or personal source IO.
 * This must run on a checked-out Node24 test runner before G2 acceptance.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHviHostReadPort, HVI_HOST_REQUEST_SCHEMA } from '../../apps/vivim-host/control/hvi-capability.mjs';
import { syntheticSource, SYNTHETIC_SHAS } from '../../hq/version-intelligence/sources/fixtures.mjs';
import { projectHviInspector } from '../../packages/tierflow/src/visual-runtime/knowledge/hvi-inspector.mjs';
import { renderHviInspector } from '../../packages/tierflow/src/visual-runtime/render/hvi-inspector.mjs';

const request=()=>({schema:HVI_HOST_REQUEST_SCHEMA,targetIndex:2,
  sources:['v1','v2','v3'].map(ref=>({repo:'synthetic/g2-fixture',ref}))});
const port=overrides=>createHviHostReadPort({actorId:'synthetic-owner',sessionId:'synthetic-local',
  approvedRepositories:['synthetic/g2-fixture'],
  verifySession:()=>true,verifyGrant:()=>true,enabled:true,...overrides});

test('synthetic 3-SHA local Host analysis produces redacted typed U DTO without live publishing',async()=>{
  const fixture=syntheticSource();let reads=0;
  const out=await port({verifyGrant:()=>{reads++;return true;}})
    .invoke(request(),{adapter:fixture.adapter});
  assert.equal(out.report.sourcePins.length,3);
  assert.equal(out.report.sourcePins[2].resolvedCommitSha,SYNTHETIC_SHAS.v3);
  assert.equal(out.inspector.schema,'arbor.hvi.adapter.comparison-report/1');
  assert.equal(out.inspector.privacy,'METADATA_ONLY_REDACTED');
  assert.equal(out.inspector.syntheticPreviewAllowed,false);
  assert.equal(out.inspector.runtimeAccepted,false);
  assert.ok(reads>=20,'grants were checked during source reads, comparison and UI projection');
  assert.ok(!JSON.stringify(out).includes('MUST_NOT_READ_SECRET'));
  assert.ok(!JSON.stringify(out).includes('.env.production'));
  assert.ok(!JSON.stringify(out).includes('synthetic-local'));
  const view=projectHviInspector({envelope:out.inspector,synthetic:true});
  assert.equal(view.pins.length,3);
  assert.equal(view.runtimeVerified,false);
  assert.equal(view.canApply,false);
  const ui=renderHviInspector({envelope:out.inspector,synthetic:true,
    previewSynthetic:true,expectedRevision:7,currentRevision:7});
  assert.equal(ui.mode,'unavailable','live result cannot masquerade as a synthetic preview');
  assert.equal(ui.published,false);
  assert.equal(ui.effectsInvoked,false);
  assert.equal(fixture.calls.blobs.length,0);
});
test('revocation specifically during final H -> U projection suppresses entire result',async()=>{
  const fixture=syntheticSource();
  await assert.rejects(port({verifyGrant:ctx=>
    ctx.operation!=='hvi.inspector.before-return'})
    .invoke(request(),{adapter:fixture.adapter}),{code:'SOURCE_UNAUTHORIZED'});
});
test('missing exact development-source grant denies before Git object source reads',async()=>{
  const fixture=syntheticSource();
  await assert.rejects(port({verifyGrant:()=>false})
    .invoke(request(),{adapter:fixture.adapter}),{code:'SOURCE_UNAUTHORIZED'});
  assert.equal(fixture.calls.refs.length,0);
});
test('reused same-repository pins never imply runtime or semantic equivalence',async()=>{
  const out=await port().invoke(request(),{adapter:syntheticSource().adapter});
  const c=out.inspector.originalComparison;
  assert.equal(new Set(c.sourcePins.map(p=>p.pinId)).size,3);
  assert.equal(new Set(c.sourcePins.map(p=>p.repoIdentity)).size,1);
  assert.equal(c.sourcePins[0].resolvedCommitSha,SYNTHETIC_SHAS.v1);
  assert.ok(c.sourceDeltas.every(r=>r.state!=='RUNTIME_VERIFIED'));
  assert.equal(out.remoteAccepted,false);
  assert.equal(out.runtimeAccepted,false);
});

test('five invented repositories resolve distinct exact pins without implicit HEAD',async()=>{
  const repos=Array.from({length:5},(_,i)=>'synthetic/g2-invented-'+i);
  const sources=repos.map((repo,i)=>({repo,ref:['v1','v2','v3','v1','v2'][i]}));
  const fixture=syntheticSource();
  const out=await port({approvedRepositories:repos}).invoke(
    {schema:HVI_HOST_REQUEST_SCHEMA,sources,targetIndex:4},
    {adapter:fixture.adapter});
  assert.equal(out.inspector.originalComparison.sourcePins.length,5);
  assert.equal(new Set(out.inspector.originalComparison.sourcePins.map(p=>p.pinId)).size,5);
  assert.equal(out.inspector.originalComparison.coverage.length,4);
  assert.equal(out.inspector.runtimeAccepted,false);
  assert.equal(fixture.calls.blobs.length,0);
});

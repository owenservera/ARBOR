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
  // The C comparison envelope is canonically ordered by pinId (compare/index.mjs
  // `cleanPins = ordered(...)`), so request order is NOT preserved here. Assert the
  // three distinct revisions by value, and pin the canonical ordering itself.
  assert.deepEqual(c.sourcePins.map(p=>p.pinId),[...c.sourcePins.map(p=>p.pinId)].sort());
  assert.deepEqual([...new Set(c.sourcePins.map(p=>p.resolvedCommitSha))].sort(),
    [SYNTHETIC_SHAS.v1,SYNTHETIC_SHAS.v2,SYNTHETIC_SHAS.v3].sort());
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

test('native readPinnedBlob denies credential-family paths even with caller-supplied allow callback',async()=>{
  const { resolvePin, snapshotAt, readPinnedBlob } =
    await import('../../hq/version-intelligence/sources/snapshots.mjs');
  const fixture=syntheticSource({malicious:{
    path:'private/invented.key',mode:'100644',type:'blob',
    sha:'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',size:12,
  }});
  const authorize=()=>true;
  const pin=await resolvePin({provider:'github',repo:'synthetic/g2-fixture',
    ref:'v1',approvedScope:'development'}, {adapter:fixture.adapter,authorize});
  const manifest=await snapshotAt(pin,{adapter:fixture.adapter,authorize,
    inspectContent:false});
  const blocked=manifest.entries.find(e=>e.path==='private/invented.key');
  assert.equal(blocked.excludedReason,'sensitive_path');
  await assert.rejects(readPinnedBlob(manifest.pin,'private/invented.key',{
    adapter:fixture.adapter,authorize,manifest}),{code:'SOURCE_UNAUTHORIZED'});
  assert.equal(fixture.calls.blobs.length,0,'no credential bytes read');
});

test('A-to-C bridge removes private source paths from downstream Host and inspector reports',async()=>{
  const fixture=syntheticSource({malicious:{
    path:'private/invented.key',mode:'100644',type:'blob',
    sha:'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',size:12,
  }});
  const out=await port().invoke(request(),{adapter:fixture.adapter});
  const serialized=JSON.stringify(out);
  assert.ok(!serialized.includes('invented.key'));
  assert.ok(!serialized.includes('private/invented'));
  assert.equal(out.report.sourcePins.length,3);
  assert.equal(out.inspector.status,'INCOMPLETE_SOURCE_EVIDENCE');
  assert.equal(fixture.calls.blobs.length,0);
});

test('repository allowlist and cancellation refuse before any Git ref resolution',async()=>{
  const forbidden=syntheticSource();
  await assert.rejects(port({approvedRepositories:[]})
    .invoke(request(),{adapter:forbidden.adapter}),{code:'SOURCE_UNAUTHORIZED'});
  assert.equal(forbidden.calls.refs.length,0);
  const cancelled=syntheticSource();
  await assert.rejects(port().invoke(request(),{
    adapter:cancelled.adapter,signal:{aborted:true}}),{code:'CANCELLED'});
  assert.equal(cancelled.calls.refs.length,0);
});

test('native source secret-path classifier blocks a consistent set of credential families',async()=>{
  const { sensitivePath }=await import('../../hq/version-intelligence/sources/common.mjs');
  for(const path of ['.ssh/config','.aws/credentials','private/notes.txt',
    'metadata/id_ecdsa','auth/config.pfx','secrets/values.json',
    'user/login data','work/storage-state.json','data/profile.key',
    'tokens/live.json','data/.env.production']){
    assert.equal(sensitivePath(path),true,path);
  }
  for(const path of ['src/main.mjs','docs/overview.md','src/public/report.json'])
    assert.equal(sensitivePath(path),false,path);
});

test('direct comparator refuses sensitive Git metadata even when caller supplies a matching digest',async()=>{
  const { resolvePin, snapshotAt } =
    await import('../../hq/version-intelligence/sources/snapshots.mjs');
  const { bridgeSourceManifest } =
    await import('../../hq/version-intelligence/integration/source-manifest-adapter.mjs');
  const { comparePinned, digestManifest } =
    await import('../../hq/version-intelligence/compare/index.mjs');
  const fixture=syntheticSource(), authorize=()=>true;
  const bridges=[];
  for(const ref of ['v1','v2']){
    const pin=await resolvePin({provider:'github',repo:'synthetic/g2-fixture',
      ref,approvedScope:'development'}, {adapter:fixture.adapter,authorize});
    bridges.push(bridgeSourceManifest(await snapshotAt(pin,{
      adapter:fixture.adapter,authorize,inspectContent:false})));
  }
  const hostile={...bridges[0].manifest,entries:[...bridges[0].manifest.entries,
    {path:'private/invented.key',mode:'100644',kind:'file',
      blobSha:'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      capabilityIds:[],excludedReason:null}]};
  hostile.digest=digestManifest(hostile);
  const hostilePin={...bridges[0].pin,manifestDigest:hostile.digest};
  assert.throws(()=>comparePinned({pins:[hostilePin,bridges[1].pin],
    manifests:[hostile,bridges[1].manifest],targetPinId:bridges[1].pin.pinId}),
    {code:'SOURCE_UNAUTHORIZED'});
  assert.equal(fixture.calls.blobs.length,0);
});

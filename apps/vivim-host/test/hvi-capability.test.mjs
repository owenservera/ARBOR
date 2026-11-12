// Synthetic-only HVI read tests. No real corpus access.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHviHostReadPort,HVI_HOST_ACTION_ID,HVI_HOST_REQUEST_SCHEMA,
  HVI_HOST_REPORT_SCHEMA,createHviLocalOwnerGate} from '../control/hvi-capability.mjs';
import {loadControlCatalog,createControlPlanner} from '../control/intent-planner.mjs';
import {syntheticSource,SYNTHETIC_SHAS} from '../../../hq/version-intelligence/sources/fixtures.mjs';
const sources=()=>['v1','v2','v3'].map(ref=>({repo:'synthetic/w2-host',ref}));
const req=(o={})=>({schema:HVI_HOST_REQUEST_SCHEMA,sources:sources(),targetIndex:2,...o});
const port=(o={})=>createHviHostReadPort({actorId:'owner',sessionId:'local',
  approvedRepositories:['synthetic/w2-host'],verifySession:()=>true,
  verifyGrant:()=>true,enabled:true,...o});
test('single native catalog descriptor is discoverable, not executable',()=>{
  const catalog=loadControlCatalog();
  const hits=catalog.actions.filter(a=>a.id===HVI_HOST_ACTION_ID);
  assert.equal(hits.length,1);assert.equal(hits[0].readiness,'enforcement_missing');
  const planner=createControlPlanner({catalog});
  assert.equal(planner.describe().actions.find(a=>a.actionId===HVI_HOST_ACTION_ID).executable,false);
  assert.equal(planner.planTyped({actionId:HVI_HOST_ACTION_ID,
    args:{selection:'synthetic commits v1 v2 v3'}}).outcome,'unavailable');
});
test('disabled and missing authority refuse',async()=>{
  const fixture=syntheticSource();
  await assert.rejects(port({enabled:false}).invoke(req(),{adapter:fixture.adapter}),
    {code:'HOST_FEATURE_DISABLED'});
  assert.throws(()=>createHviHostReadPort({actorId:'owner',sessionId:'local'}),
    {code:'AUTHORITY_REQUIRED'});
});
test('three immutable same-repo SHAs; many live checks; safe projection',async()=>{
  const fixture=syntheticSource();let grants=0,sessions=0;
  const result=await port({verifyGrant:()=>{grants++;return true;},
    verifySession:()=>{sessions++;return true;}}).invoke(req(),{adapter:fixture.adapter});
  assert.equal(result.report.schema,HVI_HOST_REPORT_SCHEMA);
  assert.equal(result.report.sourcePins.length,3);
  assert.equal(result.report.sourcePins[2].resolvedCommitSha,SYNTHETIC_SHAS.v3);
  assert.ok(grants>=15);assert.equal(sessions,grants);
  assert.equal(fixture.calls.blobs.length,0);
  assert.equal(result.remoteAccepted,false);
  assert.equal(result.runtimeAccepted,false);
  assert.ok(!JSON.stringify(result).includes('MUST_NOT_READ_SECRET'));
  assert.ok(!JSON.stringify(result).includes('.env.production'));
  assert.ok(!JSON.stringify(result).includes('"sessionId":"local"'));
});
test('no live grant or approved repository: no source read',async()=>{
  const fixture=syntheticSource();
  await assert.rejects(port({verifyGrant:()=>false}).invoke(req(),{adapter:fixture.adapter}),
    {code:'SOURCE_UNAUTHORIZED'});
  await assert.rejects(port({approvedRepositories:[]}).invoke(req(),{adapter:fixture.adapter}),
    {code:'SOURCE_UNAUTHORIZED'});
  assert.equal(fixture.calls.refs.length,0);
});
test('revocation during source page denies without report',async()=>{
  const fixture=syntheticSource();let n=0;
  await assert.rejects(port({verifyGrant:()=>++n<4}).invoke(req(),{adapter:fixture.adapter}),
    {code:'SOURCE_UNAUTHORIZED'});
  assert.ok(n>=4);
});
test('revocation at final projection denies',async()=>{
  const fixture=syntheticSource();let n=0;
  await assert.rejects(port({verifyGrant:()=>++n<=15}).invoke(req(),{adapter:fixture.adapter}),
    {code:'SOURCE_UNAUTHORIZED'});
});
test('incomplete pin list, secret subpath, moved SHA, unknown repository fail',async()=>{
  const adapter=syntheticSource().adapter;
  await assert.rejects(port().invoke(req({sources:[sources()[0]]}),{adapter}),
    {code:'INVALID_REQUEST'});
  await assert.rejects(port().invoke(req({sources:[{repo:'synthetic/w2-host',ref:'v1',subPath:'.env.production'},sources()[1]]}),{adapter}),
    {code:'SCOPE_ESCAPE'});
  await assert.rejects(port().invoke(req({sources:[{repo:'other/unapproved',ref:'v1'},sources()[1]]}),{adapter}),
    {code:'SOURCE_UNAUTHORIZED'});
  await assert.rejects(port().invoke(req({sources:[{repo:'synthetic/w2-host',ref:'v1',sha:SYNTHETIC_SHAS.v2},sources()[1]]}),{adapter}),
    {code:'PIN_MOVED'});
});


test('existing Host owner token rechecked, source permission independent',async()=>{
  const token='synthetic-owner-token-'.padEnd(48,'x');
  const request={headers:{host:'127.0.0.1:43187',origin:'http://127.0.0.1:43187',
    authorization:'Bearer '+token}};
  let current=token,sourceAllowed=false;
  const gate=createHviLocalOwnerGate({request,ownerTokenFor:()=>current,
    verifyDevelopmentSourceGrant:()=>sourceAllowed});
  assert.equal(gate.verifySession(),true);
  assert.equal(await gate.verifyGrant({repoIdentity:'synthetic/w2-host'}),false);
  sourceAllowed=true;
  assert.equal(await gate.verifyGrant({repoIdentity:'synthetic/w2-host'}),true);
  current='another-private-token'.padEnd(48,'q');
  assert.equal(gate.verifySession(),false);
  assert.equal(await gate.verifyGrant({repoIdentity:'synthetic/w2-host'}),false);
  request.headers['tailscale-user-login']='phone';
  assert.equal(gate.verifySession(),false);
});

// HVI W2 H source-only synthetic tests; never run against real donor repositories.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHviHostReadPort, HVI_HOST_ACTION_ID } from '../control/hvi-capability.mjs';
import { syntheticSource } from '../../../hq/version-intelligence/sources/fixtures.mjs';
import { resolvePin, snapshotAt } from '../../../hq/version-intelligence/sources/snapshots.mjs';
import { HVI_TOOL_REQUEST_SCHEMA } from '../../../hq/version-intelligence/integration/index.mjs';
const source = async () => {
  const fixture = syntheticSource(); const manifests = [];
  for (const ref of ['v1','v2','v3']) {
    const p = await resolvePin({ provider:'github',repo:'synthetic/w2-host',ref,approvedScope:'development' },
      { adapter:fixture.adapter,authorize:()=>true });
    manifests.push(await snapshotAt(p,{adapter:fixture.adapter,authorize:()=>true}));
  }
  return {schema:HVI_TOOL_REQUEST_SCHEMA,sourceManifests:manifests,targetPinId:manifests[2].pin.pinId};
};
test('H has one discoverable existing action-registry descriptor, no enabled Host effect', () => {
  const port=createHviHostReadPort({actorId:'owner',sessionId:'test',verifyGrant:()=>true});
  assert.equal(port.action.id,HVI_HOST_ACTION_ID);
  assert.equal(port.discover('compare pinned versions').outcome,'DECLARED_DISABLED');
  assert.equal(port.remoteAccessible,false);
  assert.equal(port.enabled,false);
});
test('H disabled mode refuses even synthetic data', async () => {
  const port=createHviHostReadPort({actorId:'owner',sessionId:'test',verifyGrant:()=>true});
  await assert.rejects(port.invoke(await source()),{code:'HOST_FEATURE_DISABLED'});
});
test('H demands actor, session and live-grant callback', () => {
  assert.throws(()=>createHviHostReadPort({actorId:'owner',sessionId:'test'}),{code:'AUTHORITY_REQUIRED'});
  assert.throws(()=>createHviHostReadPort({actorId:'',sessionId:'test',verifyGrant:()=>true}),{code:'AUTHORITY_REQUIRED'});
});
test('H injected revoked grant denies all source analysis', async () => {
  const port=createHviHostReadPort({actorId:'owner',sessionId:'test',enabled:true,verifyGrant:()=>false});
  await assert.rejects(port.invoke(await source()),{code:'SOURCE_UNAUTHORIZED'});
});
test('H synthetic local grant checks re-evaluate for each of 3 pins', async () => {
  let calls=0;
  const port=createHviHostReadPort({actorId:'owner',sessionId:'test',enabled:true,
    verifyGrant:({actorId,sessionId})=>{calls++;return actorId==='owner'&&sessionId==='test'}});
  const out=await port.invoke(await source());
  assert.equal(out.grantCheckCount,3);
  assert.equal(calls,3);
  assert.equal(out.result.comparison.coverage.length,2);
  assert.equal(out.remoteAccepted,false);
});

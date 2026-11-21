import test from 'node:test';
import assert from 'node:assert/strict';
import {readOwnerLiveSystemChanges} from '../control/live-system-client.ts';
function reply(payload,status=200){
  return async (path,opts)=>{
    assert.match(path,/^\/api\/host\/live-system\/changes\?/);
    assert.equal(opts.method,'GET');
    return {ok:status===200,json:async()=>payload};
  };
}
const envelope=(state,sequence,extra={})=>({schema:'vivim.host-live-system-changes/1',
  state,epoch:'host.unit',sequence,...extra});
test('owner client requires a reconciled initial snapshot and then accepts bounded deltas',async()=>{
  const first=await readOwnerLiveSystemChanges(reply(envelope('snapshot',1,{regions:[]})),null);
  assert.equal(first.needsReconciliation,true);
  assert.deepEqual(first.cursor,{epoch:'host.unit',sequence:1});
  const delta=await readOwnerLiveSystemChanges(reply(envelope('delta',2,{events:[{sequence:2}]})),first.cursor);
  assert.equal(delta.needsReconciliation,false);
  assert.equal(delta.events.length,1);
});
test('an explicit gap is not silently treated as an applied update',async()=>{
  const res=await readOwnerLiveSystemChanges(reply(envelope('gap',140,{regions:[]})),
    {epoch:'host.unit',sequence:1});
  assert.equal(res.needsReconciliation,true);
  assert.equal(res.state,'gap');
});
test('malformed or stale cursor claims fail closed',async()=>{
  await assert.rejects(readOwnerLiveSystemChanges(reply(envelope('delta',1,{events:[{sequence:1}]})),
    {epoch:'host.unit',sequence:1}),/LIVE_CHANGES_DELTA_INVALID/);
  await assert.rejects(readOwnerLiveSystemChanges(reply(envelope('idle',1,{events:[{sequence:2}]})),
    {epoch:'host.unit',sequence:1}),/LIVE_CHANGES_IDLE_INVALID/);
  await assert.rejects(readOwnerLiveSystemChanges(reply({schema:'untrusted'})),/LIVE_CHANGES_HOST_INVALID/);
});

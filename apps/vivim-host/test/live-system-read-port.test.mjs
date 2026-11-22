import test from 'node:test';
import assert from 'node:assert/strict';
import { createLiveSystemReadPort } from '../control/live-system-read-port.mjs';

// Contract tests with an inert Rust-envelope emulator. Production computes via
// the existing Rust binary and refuses missing/invalid native replies.
const computed = result => ({
  schema:'vivim.product-pure-response/1', operation:'live-system', state:'computed',
  authority:'none', executionAuthorized:false, effectPerformed:false,
  result:{schema:'vivim.live-system-computation/1',state:'computed',
    authority:'none',executionAuthorized:false,effectPerformed:false,result}
});
function wire() {
  let calls=0;
  const compute=async (op, args)=>{
    assert.equal(op,'live-system');
    calls++;
    const {operation,observation}=args;
    if(operation==='new') return computed({schema:'vivim.live-system-state/1',
      epoch:args.epoch,sequence:0,regions:[]});
    const s=args.state;
    if(operation==='project') return computed({...s,
      regions:s.regions.filter(r=>args.allowedIds.includes(r.id))});
    if(operation==='integrate') {
      assert.ok(args.correlationId);
      const prior=s.regions.find(r=>r.id===observation.id);
      if(prior && observation.sourceRevision<prior.sourceRevision)
        throw Error('stale');
      if(prior && observation.sourceRevision===prior.sourceRevision &&
         JSON.stringify(observation.data)!==JSON.stringify(prior.data)) throw Error('conflict');
      if(prior && observation.sourceRevision===prior.sourceRevision) return computed({state:s,event:null});
      const next={...s,sequence:s.sequence+1,regions:[
        ...s.regions.filter(r=>r.id!==observation.id),
        {...observation,viewRevision:(prior?.viewRevision??0)+1,digest:'a'.repeat(64)}]};
      return computed({state:next,event:{sequence:next.sequence}});
    }
    throw Error('unrecognized');
  };
  return {compute,calls:()=>calls};
}
test('wiki and Host status are real source inputs, not private content', async ()=>{
  const kernel=wire();
  let revision=4;
  const view=createLiveSystemReadPort({compute:kernel.compute,epoch:'host.unit',
    clock:()=>123456,
    readWiki:async()=>({wiki:{revision,pages:{Home:{sections:{Secret:'never exported'}}}}}),
    readStatus:async()=>({host:{state:'online',secret:'no'},services:{
      relay:{state:'unknown',pid:123},chatWorker:{state:'running',token:'no'}},
      bridge:{state:'observed',recent:[{prompt:'private'}]}})});
  const first=await view.snapshot();
  assert.equal(first.revision,2);
  assert.equal(first.regions.length,2);
  assert.equal(first.authority,'read-only-projection');
  assert.equal(first.effectPerformed,false);
  assert.ok(!JSON.stringify(first).includes('Secret'));
  assert.ok(!JSON.stringify(first).includes('token'));
  assert.ok(!JSON.stringify(first).includes('private'));
  assert.equal((await view.snapshot()).revision,2);
  revision=5;
  const changed=await view.snapshot();
  assert.equal(changed.revision,3);
  assert.equal(changed.regions.find(x=>x.id==='wiki.summary').data.revision,5);
});
test('concurrent readers serialize a single epoch and do not fabricate updates',async()=>{
  const kernel=wire();
  const port=createLiveSystemReadPort({compute:kernel.compute, epoch:'host.concurrent',
    clock:()=>123456,
    readWiki:async()=>({wiki:{revision:0,pages:{}}}),
    readStatus:async()=>({host:{state:'online'}})});
  const snapshots=await Promise.all(Array.from({length:6},()=>port.snapshot()));
  assert.deepEqual(snapshots.map(x=>x.revision),[2,2,2,2,2,2]);
  assert.ok(kernel.calls()>=6);
});
test('stale Wiki input refuses without advancing view',async()=>{
  const kernel=wire();let rev=2;
  const port=createLiveSystemReadPort({compute:kernel.compute, epoch:'host.stale',
    clock:()=>123456,
    readWiki:async()=>({wiki:{revision:rev,pages:{}}}),
    readStatus:async()=>({host:{state:'online'}})});
  assert.equal((await port.snapshot()).revision,2);
  rev=1;
  await assert.rejects(port.snapshot(),/stale/);
  rev=2;
  assert.equal((await port.snapshot()).revision,2);
});
test('invalid or unavailable native responses fail closed',async()=>{
  const port=createLiveSystemReadPort({compute:async()=>({state:'unavailable'}),
    clock:()=>123456,readWiki:async()=>({wiki:{revision:1,pages:{}}}),
    readStatus:async()=>({})});
  await assert.rejects(port.snapshot(),{code:'LIVE_SYSTEM_NATIVE_UNAVAILABLE'});
});
test('unpackaged Rust kernel is reported explicitly, without a fabricated live view', async()=>{
  const port=createLiveSystemReadPort({
    compute:async()=>({schema:'vivim.product-pure-response/1',
      operation:'live-system',state:'unavailable',code:'NATIVE_NOT_PACKAGED',
      authority:'none',executionAuthorized:false,effectPerformed:false}),
    clock:()=>123456,
    readWiki:async()=>({wiki:{revision:1,pages:{}}}),
    readStatus:async()=>({host:{state:'online'}})
  });
  await assert.rejects(port.snapshot(),{code:'LIVE_SYSTEM_NATIVE_NOT_PACKAGED'});
  await assert.rejects(port.snapshot(),{code:'LIVE_SYSTEM_NATIVE_NOT_PACKAGED'});
});
test('bad Wiki revision or unexpected structure is unavailable', async()=>{
  const kernel=wire();
  const port=createLiveSystemReadPort({compute:kernel.compute,
    epoch:'host.bad',clock:()=>123456,readWiki:async()=>({wiki:{revision:'42',pages:{}}}),
    readStatus:async()=>({host:{state:'online'}})});
  await assert.rejects(port.snapshot(),{code:'LIVE_SYSTEM_WIKI_UNAVAILABLE'});
});
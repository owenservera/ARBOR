import test from 'node:test';
import assert from 'node:assert/strict';
import {createHostComposerBridge} from '../control/agent-composer-bridge.mjs';

const phone='0123456789abcdef0123456789abcdef';
const action='pwa.composer.draft.set';
function scenario(){
  let now=100000,seq=0,rev=0,last=null;
  let bridge;
  const readSnapshot=async()=>{
    const obs=bridge.observation();
    if(obs.length){
      const source=obs[0];
      const change=!last||source.sourceRevision!==last.sourceRevision||
        source.freshness!==last.freshness||JSON.stringify(source.writable)!==JSON.stringify(last.writable);
      if(change){seq++;rev++;}
      last=source;
      return {epoch:'host.unit',revision:seq,regions:[{...source,viewRevision:rev}]};
    }
    return {epoch:'host.unit',revision:0,regions:[]};
  };
  const compute=async(operation,payload)=>{
    assert.equal(operation,'agent-composer');
    assert.equal(payload.schema,'vivim.agent-composer-request/1');
    const c=payload.intent,o=payload.state.regions.find(r=>r.id===c.regionId);
    const prior=o.data.draft;
    const next=c.operation==='append'?prior+c.text:c.text;
    assert.equal(payload.actor.actorId,'desktop-owner');
    return {schema:'vivim.product-pure-response/1',state:'computed',
      operation,authority:'none',executionAuthorized:false,effectPerformed:false,
      result:{schema:'vivim.agent-composer-computation/1',
        state:'computed',authority:'none',executionAuthorized:false,effectPerformed:false,
        result:{schema:'vivim.agent-composer-proposal/1',actorId:'desktop-owner',
          effectPerformed:false,executionAuthorized:false,candidate:{
            regionId:c.regionId,sourceId:o.sourceId,actionId:action,pointer:'/draft',
            correlationId:c.correlationId,expectedSourceRevision:o.sourceRevision,
            expectedRegionRevision:o.viewRevision,expectedSystemSequence:payload.state.sequence,
            oldValue:prior,newValue:next,effectPerformed:false
          }}
      }
    };
  };
  bridge=createHostComposerBridge({readSnapshot,compute,clock:()=>now});
  const observe=async(text,revision,correlationId)=>{
    const body={sessionId:phone,revision,text,mode:'vivim',visible:true,composing:false,
      ...(correlationId?{correlationId}:{})};
    return bridge.observeWithFence(body);
  };
  const intent=(fence,text,correlationId='draft.unit')=>({
    epoch:fence.epoch,regionId:'phone.composer',pointer:'/draft',
    expectedSequence:fence.systemSequence,expectedViewRevision:fence.viewRevision,
    expectedSourceRevision:fence.sourceRevision,correlationId,operation:'replace',text
  });
  return {bridge,observe,intent,now:value=>{now=value;}};
}
test('one-shot composer draft requires Host executor claim and independently observed readback',async()=>{
  const {bridge,observe,intent}=scenario();
  const fence=await observe('before',1);
  assert.equal(fence.regionId,'phone.composer');
  const staged=await bridge.stage({sessionId:phone,intent:intent(fence,'after')});
  assert.equal(staged.state,'staged');
  assert.ok(!JSON.stringify(staged).includes('after'));
  assert.equal(bridge.delivery(phone).state,'none');
  const effect=bridge.execute(staged.stageId);
  // Executor fences current Rust state asynchronously before exposing a poll.
  await new Promise(resolve=>setImmediate(resolve));
  const delivery=bridge.delivery(phone);
  assert.equal(delivery.schema,'vivim.agent-composer-delivery/1');
  assert.equal(delivery.candidate.oldValue,'before');
  assert.equal(delivery.candidate.newValue,'after');
  assert.equal(bridge.delivery(phone).state,'none'); // consumption, not replay
  const next=await observe('after',2,'draft.unit');
  assert.ok(next.sourceRevision>fence.sourceRevision);
  const ack=await bridge.acknowledge({sessionId:phone,correlationId:'draft.unit',stage:'applied-local'});
  assert.equal(ack.state,'verified');
  const effectReceipt=await effect;
  assert.equal(effectReceipt.status,'verified');
  assert.equal(effectReceipt.draftSent,false);
  assert.equal(effectReceipt.providerEffect,false);
});
test('human changes invalidate staged authorizations and never overwrite a later draft',async()=>{
  const {bridge,observe,intent}=scenario();
  const first=await observe('human one',1);
  const staged=await bridge.stage({sessionId:phone,intent:intent(first,'agent text')});
  await observe('human two',2);
  await assert.rejects(bridge.execute(staged.stageId),{code:'COMPOSER_STAGE_STALE'});
  assert.equal(bridge.delivery(phone).state,'none');
});
test('pause and loss of observation freshness revoke writable source with real revision',async()=>{
  const {bridge,observe,intent,now}=scenario();
  const fence=await observe('draft',1);
  assert.equal(bridge.observation()[0].writable[0].actionId,action);
  const staged=await bridge.stage({sessionId:phone,intent:intent(fence,'change')});
  const before=bridge.observation()[0].sourceRevision;
  bridge.setPaused(true);
  assert.equal(bridge.observation()[0].writable.length,0);
  assert.ok(bridge.observation()[0].sourceRevision>before);
  await assert.rejects(bridge.execute(staged.stageId),{code:'COMPOSER_STAGE_STALE'});
  bridge.setPaused(false);
  now(200000);
  const lost=bridge.observation()[0];
  assert.equal(lost.freshness,'stale');
  assert.equal(lost.writable.length,0);
  assert.equal(bridge.status().connected,false);
  const renewed=await observe('draft',1); // same client revision, fresh reconnection
  assert.ok(renewed.sourceRevision>lost.sourceRevision);
  assert.equal(bridge.observation()[0].writable.length,1);
});
test('owner bridge rejects source tampering, oversized text and unverified ACK',async()=>{
  const {bridge,observe,intent}=scenario();
  await assert.rejects(observe('a'.repeat(1001),1),{code:'COMPOSER_OBSERVATION_INVALID'});
  const fence=await observe('start',1);
  await assert.rejects(observe('different',1),{code:'COMPOSER_SOURCE_REVISION_CONFLICT'});
  const staged=await bridge.stage({sessionId:phone,intent:intent(fence,'finish')});
  const pending=bridge.execute(staged.stageId);
  await new Promise(resolve=>setImmediate(resolve));
  const delivery=bridge.delivery(phone);
  assert.equal(delivery.schema,'vivim.agent-composer-delivery/1');
  await assert.rejects(bridge.acknowledge({sessionId:phone,correlationId:'draft.unit',stage:'applied-local'}),
    {code:'COMPOSER_ACK_SOURCE_MISMATCH'});
  bridge.setPaused(true);
  await assert.rejects(pending,{code:'COMPOSER_OUTCOME_UNCERTAIN'});
});

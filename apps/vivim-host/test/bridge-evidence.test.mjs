import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createBridgeStore} from '../../../studio/src/studio/bridge-commands.mjs';
import {createBridgeEvidence} from '../conversations/bridge-evidence.mjs';
import {createSourceVerifiedLiveProjection} from '../conversations/live-projection.mjs';

const conv='c-'+'a'.repeat(16);
function setup(t){
  const dataRoot=mkdtempSync(path.join(os.tmpdir(),'vivim-verified-bridge-'));
  t.after(()=>rmSync(dataRoot,{recursive:true,force:true}));
  return {dataRoot,bridge:createBridgeStore({root:dataRoot})};
}

test('relay queue and Studio claim are separate verified authorities',async t=>{
  const {dataRoot,bridge}=setup(t),adapter=createBridgeEvidence({dataRoot});
  const record=bridge.create({origin:'relay',text:'private text',consumer:'harness',
    chat:{conversationId:conv,mode:'relay-chat',target:{provider:'chatgpt'}}});
  const queued=adapter.observe(record.id);
  assert.equal(queued.kind,'transport.queued');
  assert.equal(queued.source,'relay');
  assert.equal((await adapter.verify(queued)).verified,true);
  assert.equal(JSON.stringify(queued).includes('private text'),false);
  assert.equal((await adapter.verify({...queued,evidenceDigest:'0'.repeat(64)})).verified,false);
  bridge.claim(record.id,{by:'harness'});
  assert.equal((await adapter.verify(queued)).verified,true); // historical queued revision remains attested
  const claimed=adapter.observe(record.id);
  assert.equal(claimed.kind,'bridge.claimed');
  assert.equal(claimed.source,'bridge');
  assert.equal((await adapter.verify(claimed)).verified,true);
  bridge.reply(record.id,'result',{status:'done'});
  assert.equal(adapter.observe(record.id),null);
  assert.equal((await adapter.verify(claimed)).verified,true); // append-only claim retained after completion
});

test('actual relay-chat acceptance creates source-backed conversation intent and queue',async t=>{
  const {dataRoot,bridge}=setup(t);
  const rec=bridge.create({origin:'relay',text:'private text',consumer:'harness',
    chat:{conversationId:conv,mode:'relay-chat',target:{provider:'chatgpt'}}});
  const live=createSourceVerifiedLiveProjection({dataRoot,worldId:'world-local'});
  const first=await live.recordAcceptedRelay(rec.id);
  assert.equal(first.phase,'remote_queued');
  assert.equal(live.messageState(first.messageId).commandId,rec.id);
  assert.equal(live.worldTimeline().conversations[0].messages[0].delivered,false);
  const again=await live.recordAcceptedRelay(rec.id);
  assert.equal(again.replayed,true);
  bridge.claim(rec.id,{by:'harness'});
  await live.recordBridgeTransition({commandId:rec.id,messageId:first.messageId,idempotencyKey:'claim-'+rec.id});
  assert.equal(live.messageState(first.messageId).phase,'claimed');
  assert.equal(live.worldTimeline().conversations[0].messages[0].delivered,false);
  await assert.rejects(()=>live.recordBridgeTransition({commandId:rec.id,messageId:'msg-incorrect',idempotencyKey:'wrong-'+rec.id}),
    /LIVE_BRIDGE_MESSAGE_MISMATCH/);
});

test('unrelated queue records cannot be promoted into conversation evidence',async t=>{
  const {dataRoot,bridge}=setup(t);
  const record=bridge.create({text:'bootstrap',consumer:'bootstrap',origin:'relay',
    chat:{mode:'bootstrap',action:'choose-preset'}});
  const adapter=createBridgeEvidence({dataRoot});
  assert.equal(adapter.observe(record.id),null);
  const live=createSourceVerifiedLiveProjection({dataRoot,worldId:'world-local'});
  await assert.rejects(()=>live.recordAcceptedRelay(record.id),/LIVE_RELAY_EVIDENCE_UNAVAILABLE/);
});

test('fast worker completion remains reconstructible without inferring provider delivery',async t=>{
  const {dataRoot,bridge}=setup(t);
  const record=bridge.create({origin:'relay',text:'private body',consumer:'harness',
    chat:{conversationId:conv,mode:'relay-chat'}});
  bridge.claim(record.id,{by:'harness'});
  bridge.reply(record.id,'worker completed',{status:'done'});
  const live=createSourceVerifiedLiveProjection({dataRoot,worldId:'world-local'});
  const accepted=await live.recordAcceptedRelay(record.id);
  assert.equal(accepted.phase,'remote_queued');
  const reconciled=await live.reconcileBridgeClaims();
  assert.equal(reconciled.recorded,1);
  assert.equal(live.messageState(accepted.messageId).phase,'claimed');
  assert.equal(live.worldTimeline().conversations[0].messages[0].delivered,false);
  assert.equal(JSON.stringify(live.worldTimeline()).includes('private body'),false);
});

test('recovery resumes an intent persisted before its queue event, without adding another intent',async t=>{
  const {dataRoot,bridge}=setup(t);
  const record=bridge.create({origin:'relay',text:'private text',consumer:'harness',
    chat:{conversationId:conv,mode:'relay-chat'}});
  const adapter=createBridgeEvidence({dataRoot});
  const live=createSourceVerifiedLiveProjection({dataRoot,worldId:'world-local'});
  const creation=adapter.observe(record.id,'conversation.created');
  const intent=adapter.observe(record.id,'message.intent');
  await live.record({...creation,idempotencyKey:'conversation-'+conv});
  await live.record({...intent,idempotencyKey:'intent-'+record.id});
  assert.equal(live.messageState(intent.messageId).phase,'created');
  const repaired=await live.recordAcceptedRelay(record.id);
  assert.equal(repaired.phase,'remote_queued');
  assert.equal(repaired.replayed,true);
  const snapshot=live.snapshot();
  assert.equal(snapshot.revision,3);
  assert.equal(snapshot.conversations[0].messages.length,1);
  const repeat=await live.recordAcceptedRelay(record.id);
  assert.equal(repeat.replayed,true);
  assert.equal(live.snapshot().revision,3);
});

test('read-side reconciliation recovers accepted but missing intent and late Studio claim',async t=>{
  const {dataRoot,bridge}=setup(t);
  const rec=bridge.create({origin:'relay',text:'private',consumer:'harness',
    chat:{conversationId:conv,mode:'relay-chat'}});
  bridge.claim(rec.id,{by:'harness'});
  bridge.reply(rec.id,'worker completed',{status:'done'});
  const live=createSourceVerifiedLiveProjection({dataRoot,worldId:'world-local'});
  const first=await live.reconcileBridgeClaims();
  assert.equal(first.recovered,1);
  assert.equal(first.recorded,1);
  const state=live.messageState('msg-'+rec.id.slice(4));
  assert.equal(state.phase,'claimed');
  assert.equal(state.delivered,false);
  const again=await live.reconcileBridgeClaims();
  assert.equal(again.recovered,0);
  assert.equal(again.recorded,0);
  assert.equal(live.snapshot().revision,4);
});

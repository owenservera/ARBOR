import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createBridgeStore} from '../../../studio/src/studio/bridge-commands.mjs';
import {createThreadTurnJournal,digestTurnPayload,canonicalThreadKey} from '../../../studio/src/capture/thread-turn-journal.mjs';
import {createStudioJournalEvidence} from '../conversations/studio-journal-evidence.mjs';
import {createSourceVerifiedLiveProjection} from '../conversations/live-projection.mjs';

const phoneConversation='c-'+'a'.repeat(16);
const uuid='00000000-0000-0000-0000-000000000001';
const thread={kind:'chatgpt-c',id:uuid,ref:'chatgpt-c:'+uuid};
const origin='https://chatgpt.com',stamp='2026-11-01T12:00:00.000Z';
function fixture(t) {
  const dataRoot=mkdtempSync(path.join(os.tmpdir(),'vivim-journal-transition-'));
  t.after(()=>rmSync(dataRoot,{recursive:true,force:true}));
  const bridge=createBridgeStore({root:dataRoot});
  const command=bridge.create({origin:'relay',text:'private exact prompt',consumer:'harness',
    chat:{mode:'relay-chat',conversationId:phoneConversation,target:{provider:'chatgpt'}}});
  const live=createSourceVerifiedLiveProjection({dataRoot,worldId:'world-local'});
  return {dataRoot,bridge,command,live};
}
test('unmatched Studio journals cannot invent send authorization',async t=>{
  const {dataRoot,bridge,command,live}=fixture(t);
  await live.recordAcceptedRelay(command.id);
  bridge.claim(command.id,{by:'harness'});
  await live.reconcileBridgeClaims();
  const status=await live.reconcileStudioJournal();
  assert.equal(status.authorized,0);
  assert.equal(live.messageState('msg-'+command.id.slice(4)).phase,'claimed');
  assert.equal(createStudioJournalEvidence({dataRoot}).observe(command.id,'send.observed'),null);
});
test('exact Studio journal joins send stages; only a paired phone render receipt acknowledges delivery',async t=>{
  const {dataRoot,bridge,command,live}=fixture(t);
  await live.recordAcceptedRelay(command.id);
  bridge.claim(command.id,{by:'harness'});
  await live.reconcileBridgeClaims();
  const studioId='studio-owner-1',dir=path.join(dataRoot,'conversations');
  mkdirSync(dir,{recursive:true});
  const journal=createThreadTurnJournal({dataDir:path.join(dir,'thread-turns'),
    namespace:'local-owner',origin,thread});
  const digest=digestTurnPayload(command.text);
  const boundary={sessionId:'capture-1',sequence:10,transcriptCount:2};
  let turn=journal.reserve({key:command.studioRequestKey,conversationId:studioId,
    payloadDigest:digest}).turn;
  turn=journal.markTyping({turnId:turn.id,expectedRevision:turn.revision,boundary});
  turn=journal.markDispatching({turnId:turn.id,expectedRevision:turn.revision});
  const replyText='verified reply',replyDigest=digestTurnPayload(replyText),chars=replyText.length;
  const delivery={turnId:turn.id,payloadDigest:digest,sessionId:'capture-1',
    sequence:11,kind:'outgoing-request',source:'network',identity:'outgoing-1'};
  turn=journal.observeDelivery({turnId:turn.id,expectedRevision:turn.revision,evidence:delivery});
  const reply={turnId:turn.id,payloadDigest:digest,sessionId:'capture-1',
    sequence:12,kind:'assistant-reply',source:'network',identity:'reply-1',
    revision:1,contentDigest:replyDigest,chars};
  turn=journal.recordReply({turnId:turn.id,expectedRevision:turn.revision,evidence:reply});
  const meta={identity:reply.identity,revision:reply.revision,
    contentDigest:reply.contentDigest,chars:reply.chars};
  const ready={turnId:turn.id,payloadDigest:digest,sessionId:'capture-1',
    boundarySequence:10,threadKey:canonicalThreadKey({namespace:'local-owner',origin,thread}),
    ...meta,sequence:14,kind:'interactive-ready',source:'adapter',
    rule:'chatgpt-controls-idle',ruleVersion:1,
    samples:[{...meta,sequence:13},{...meta,sequence:14}],
    controls:{observed:true,state:'idle',idleControlPresent:true,
      stopPresent:false,composerEnabled:true}};
  turn=journal.recordReadiness({turnId:turn.id,expectedRevision:turn.revision,evidence:ready});
  const snapshot={version:1,id:studioId,site:'chatgpt',revision:3,state:'ready',
    binding:{targetId:'tab-1',origin,ownedByStudio:true,thread},
    identity:{state:'bound',reason:null},sessionId:'capture-1',
    uncertainty:null,assertions:[],finish:{requested:false,phase:'idle'},
    createdAt:stamp,updatedAt:stamp,attempts:[{
      id:turn.id,key:turn.key,payloadDigest:digest,phase:'observed',
      createdAt:stamp,updatedAt:stamp,boundary,
      send:{state:'observed'},reply:{state:'ready',text:replyText}}]};
  writeFileSync(path.join(dir,studioId+'.conversation.json'),JSON.stringify(snapshot));
  const evidence=createStudioJournalEvidence({dataRoot});
  const observed=evidence.observe(command.id,'send.observed');
  assert.equal((await evidence.verify(observed)).verified,true);
  assert.equal((await evidence.verify({...observed,evidenceDigest:'0'.repeat(64)})).verified,false);
  const first=await live.reconcileStudioJournal();
  assert.deepEqual({authorized:first.authorized,sent:first.sent,replied:first.replied},
    {authorized:1,sent:1,replied:1});
  const state=live.messageState('msg-'+command.id.slice(4));
  assert.equal(state.phase,'reply_observed');
  assert.equal(state.delivered,false);
  assert.equal(live.worldTimeline().conversations[0].messages[0].delivered,false);
  const revision=live.snapshot().revision;
  await live.reconcileStudioJournal();
  assert.equal(live.snapshot().revision,revision,'re-read does not append duplicate lifecycle evidence');
  const args={commandId:command.id,messageId:'msg-'+command.id.slice(4),
    conversationId:phoneConversation,deviceId:'a'.repeat(32),replyRevision:state.revision};
  // A journal-verified reply is not a verified *phone display* until the
  // separately persisted bridge result contains exactly those provider bytes.
  assert.equal(live.verifiedReplyDisplays().has(command.id),false);
  await assert.rejects(()=>live.recordPhoneDelivery(args),
    /LIVE_PHONE_ACK_DISPLAY_NOT_VERIFIED/);
  bridge.reply(command.id,'[chatgpt] '+replyText);
  assert.equal(live.verifiedReplyDisplays().has(command.id),true);
  await assert.rejects(()=>live.recordPhoneDelivery({...args,replyRevision:state.revision+1}),
    /LIVE_PHONE_ACK_STALE_REPLY/);
  const ack=await live.recordPhoneDelivery(args);
  assert.equal(ack.state,'delivered');
  assert.equal(ack.replayed,false);
  assert.equal(live.messageState(args.messageId).phase,'delivered');
  assert.equal(live.worldTimeline().conversations[0].messages[0].delivered,true);
  const finalRevision=live.snapshot().revision;
  const duplicate=await live.recordPhoneDelivery(args);
  assert.equal(duplicate.replayed,true);
  assert.equal(live.snapshot().revision,finalRevision);
  await assert.rejects(()=>live.recordPhoneDelivery({...args,deviceId:'b'.repeat(32)}),
    /PHONE_ACK_CONFLICT/);
});

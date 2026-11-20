// Focused proof for the conversations native-knowledge boundary:
//   * a committed source change appears in the incremental knowledge projection
//     with exact source identity (sourceRef), revision and evidence digest;
//   * a replay re-derives byte-identical rows (stable identity, no duplicates);
//   * revoked/withdrawn evidence is absent, leaving only a scoped tombstone;
//   * no prompt, reply or provider text is ever copied into a row.
// The Host's native ingest call site (chat/rust-context.mjs) is a separate
// unit; these rows use that adapter's row field names so it can ingest them
// without transformation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createBridgeStore} from '../../../studio/src/studio/bridge-commands.mjs';
import {createThreadTurnJournal,digestTurnPayload,canonicalThreadKey} from '../../../studio/src/capture/thread-turn-journal.mjs';
import {createBridgeEvidence,CONVERSATION_KNOWLEDGE_SCHEMA} from '../conversations/bridge-evidence.mjs';
import {createStudioJournalEvidence} from '../conversations/studio-journal-evidence.mjs';
import {createSourceVerifiedLiveProjection} from '../conversations/live-projection.mjs';

const conv='c-'+'a'.repeat(16);
const uuid='00000000-0000-0000-0000-000000000001';
const thread={kind:'chatgpt-c',id:uuid,ref:'chatgpt-c:'+uuid};
const origin='https://chatgpt.com';
const stamp='2026-11-01T12:00:00.000Z';
const ROW_KEYS=['id','kind','stage','ledger','source','sourceRef','sourceRevision','digest',
  'revision','order','semanticId','title','summary','authority'];
function setup(t){
  const dataRoot=mkdtempSync(path.join(os.tmpdir(),'vivim-conversation-knowledge-'));
  t.after(()=>rmSync(dataRoot,{recursive:true,force:true}));
  return {dataRoot,bridge:createBridgeStore({root:dataRoot})};
}
function assertRowContract(row){
  assert.deepEqual(Object.keys(row).sort(),[...ROW_KEYS].sort());
  assert.equal(row.authority,'host-read-only');
  assert.match(row.id,/^vivim-context-c-[a-f0-9]{64}$/);
  assert.match(row.sourceRef,/^(cmd-[0-9a-f]{16}|studio-turn-[a-f0-9]{64}|msg-[0-9a-f]{16})$/);
  assert.match(row.digest,/^[a-f0-9]{64}$/);
  assert.ok(Number.isSafeInteger(row.sourceRevision)&&row.sourceRevision>=0);
}

test('bridge evidence revision reaches native knowledge with source identity and provenance',async t=>{
  const {dataRoot,bridge}=setup(t);
  const adapter=createBridgeEvidence({dataRoot});
  const record=bridge.create({origin:'relay',text:'private prompt',consumer:'harness',
    chat:{conversationId:conv,mode:'relay-chat',target:{provider:'chatgpt'}}});
  const first=adapter.nativeKnowledge();
  assert.equal(first.schema,CONVERSATION_KNOWLEDGE_SCHEMA);
  assert.equal(first.authority,'host-read-only');
  assert.equal(first.items.length,1);
  const queuedObservation=adapter.observe(record.id);
  const queued=first.items[0];
  assertRowContract(queued);
  assert.equal(queued.stage,'transport.queued');
  assert.equal(queued.source,'relay');
  assert.equal(queued.ledger,'studio-bridge');
  assert.equal(queued.sourceRef,record.id);
  assert.equal(queued.sourceRevision,1);
  assert.equal(queued.digest,(await adapter.verify(adapter.observe(record.id))).evidenceDigest);
  assert.equal(queued.semanticId,'vivim:conversation:'+conv+':msg-'+record.id.slice(4));
  assert.equal(JSON.stringify(first).includes('private prompt'),false);
  // A replay re-derives the same row: stable identity, no duplicate node.
  assert.deepEqual(adapter.nativeKnowledge().items,[queued]);

  bridge.claim(record.id,{by:'harness'});
  const claimObservation=adapter.observe(record.id);
  const claimed=adapter.nativeKnowledge();
  assert.equal(claimed.items.length,1,'the same command stays one node across revisions');
  assert.equal(claimed.items[0].stage,'bridge.claimed');
  assert.equal(claimed.items[0].source,'bridge');
  assert.equal(claimed.items[0].sourceRevision,2,'the committed claim revision appears');
  assert.equal(claimed.items[0].id,adapter.nativeKnowledge().items[0].id);
  assert.deepEqual(claimed.tombstones,[{sourceRef:record.id,stage:'transport.queued',
    reason:'superseded-by-bridge.claimed'}],'the superseded stage is retracted by identity');
  assert.equal(claimed.items[0].digest,
    (await adapter.verify(adapter.observe(record.id))).evidenceDigest);

  // Completion withdraws the queue/claim evidence: no row survives, only identity.
  bridge.reply(record.id,'private result',{status:'done'});
  const done=adapter.nativeKnowledge();
  assert.deepEqual(done.items,[]);
  assert.deepEqual(done.tombstones,[{sourceRef:record.id,stage:'bridge.claimed',
    reason:'left-queue-or-claim-state'},{sourceRef:record.id,stage:'transport.queued',
    reason:'left-queue-or-claim-state'}]);
  // Historical attestation of the earlier revisions is unchanged.
  assert.equal((await adapter.verify(adapter.observe(record.id))).verified,false);
  assert.equal((await adapter.verify(queuedObservation)).verified,true);
  assert.equal((await adapter.verify(claimObservation)).verified,true);
});

test('unrelated bridge records and unverifiable observations never become native knowledge',async t=>{
  const {dataRoot,bridge}=setup(t);
  const adapter=createBridgeEvidence({dataRoot});
  const bootstrap=bridge.create({text:'bootstrap',consumer:'bootstrap',origin:'relay',
    chat:{mode:'bootstrap',action:'choose-preset'}});
  assert.deepEqual(adapter.nativeKnowledge().items,[]);
  assert.deepEqual(adapter.nativeKnowledge().tombstones,[]);
  // A tampered observation cannot be promoted, even though a relay record exists.
  const record=bridge.create({origin:'relay',text:'private prompt',consumer:'harness',
    chat:{conversationId:conv,mode:'relay-chat'}});
  const observation=adapter.observe(record.id);
  assert.equal((await adapter.verify({...observation,evidenceDigest:'0'.repeat(64)})).verified,false);
  assert.equal((await adapter.verify({...observation,sourceRevision:99})).verified,false);
  assert.equal(adapter.nativeKnowledge().items.length,1,'the verified record still stands');
  assert.notEqual(bootstrap.id,record.id);
});

// Builds one real Studio thread-turn journal correlation for `command` and
// returns the journal so a test can advance or withdraw its stages.
function journalFixture(t,{deliver=true}={}){
  const {dataRoot,bridge}=setup(t);
  const command=bridge.create({origin:'relay',text:'private exact prompt',consumer:'harness',
    chat:{mode:'relay-chat',conversationId:conv,target:{provider:'chatgpt'}}});
  // A correlation only exists for a command the harness consumer really claimed.
  bridge.claim(command.id,{by:'harness'});
  const studioId='studio-owner-1',dir=path.join(dataRoot,'conversations');
  mkdirSync(dir,{recursive:true});
  const journal=createThreadTurnJournal({dataDir:path.join(dir,'thread-turns'),
    namespace:'local-owner',origin,thread});
  const digest=digestTurnPayload(command.text);
  const boundary={sessionId:'capture-1',sequence:10,transcriptCount:2};
  let turn=journal.reserve({key:command.studioRequestKey,conversationId:studioId,payloadDigest:digest}).turn;
  turn=journal.markTyping({turnId:turn.id,expectedRevision:turn.revision,boundary});
  turn=journal.markDispatching({turnId:turn.id,expectedRevision:turn.revision});
  const replyText='verified reply',replyDigest=digestTurnPayload(replyText),chars=replyText.length;
  if(deliver){
    const delivery={turnId:turn.id,payloadDigest:digest,sessionId:'capture-1',
      sequence:11,kind:'outgoing-request',source:'network',identity:'outgoing-1'};
    turn=journal.observeDelivery({turnId:turn.id,expectedRevision:turn.revision,evidence:delivery});
  } else {
    // A dispatched turn with no delivery observation is *uncertain*, never sent.
    turn=journal.markUnknown({turnId:turn.id,expectedRevision:turn.revision,reason:'NO_DELIVERY_YET'});
  }
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
  if(deliver)turn=journal.recordReadiness({turnId:turn.id,expectedRevision:turn.revision,evidence:ready});
  const snapshot={version:1,id:studioId,site:'chatgpt',revision:3,state:'ready',
    binding:{targetId:'tab-1',origin,ownedByStudio:true,thread},
    identity:{state:'bound',reason:null},sessionId:'capture-1',
    uncertainty:null,assertions:[],finish:{requested:false,phase:'idle'},
    createdAt:stamp,updatedAt:stamp,attempts:[{
      id:turn.id,key:turn.key,payloadDigest:digest,phase:deliver?'observed':'uncertain',
      createdAt:stamp,updatedAt:stamp,boundary,
      send:{state:deliver?'observed':'submitting'},reply:{state:'ready',text:replyText}}]};
  writeFileSync(path.join(dir,studioId+'.conversation.json'),JSON.stringify(snapshot));
  return {dataRoot,bridge,command,journal,turn,studioId,digest};
}

test('Studio journal stages reach native knowledge with journal source identity',async t=>{
  const fixture=journalFixture(t);
  const evidence=createStudioJournalEvidence({dataRoot:fixture.dataRoot});
  const first=evidence.nativeKnowledge();
  assert.equal(first.schema,CONVERSATION_KNOWLEDGE_SCHEMA);
  assert.equal(first.items.length,3,'authorization, observed send and observed reply');
  const stages=first.items.map(row=>row.stage).sort();
  assert.deepEqual(stages,['reply.observed','send.authorized','send.observed']);
  for(const row of first.items){
    assertRowContract(row);
    assert.equal(row.ledger,'studio-thread-turn-journal');
    assert.equal(row.sourceRef,'studio-turn-'+evidence.observe(fixture.command.id,'send.observed').sourceRef.slice('studio-turn-'.length));
    assert.equal(row.order,null,'no commit time is exposed by the correlation; never synthesized');
  }
  assert.equal(JSON.stringify(first).includes('private exact prompt'),false);
  assert.equal(JSON.stringify(first).includes('verified reply'),false);
  assert.deepEqual(evidence.nativeKnowledge().items,first.items,'replay is byte-identical');
  // A tampered correlation proof can never be projected.
  const observed=evidence.observe(fixture.command.id,'send.observed');
  assert.equal((await evidence.verify({...observed,evidenceDigest:'0'.repeat(64)})).verified,false);
});

test('an observed send withdraws the uncertain stage: absent from items, tombstoned',async t=>{
  const fixture=journalFixture(t,{deliver:false});
  const evidence=createStudioJournalEvidence({dataRoot:fixture.dataRoot});
  const link=evidence.links().find(l=>l.commandId===fixture.command.id);
  assert.ok(link);
  assert.equal(link.stages.uncertain,true,'an undispatched turn is uncertain');
  assert.equal(link.stages.sendObserved,false);
  // Before any delivery the uncertain stage is current knowledge.
  const before=evidence.nativeKnowledge();
  assert.ok(before.items.some(row=>row.stage==='send.uncertain'));
  // A delivery observation supersedes it: the uncertain row is gone from the
  // projection (the native side deletes it as an omission) and the observed
  // send row appears instead. No content is ever copied into either row.
  const delivery={turnId:fixture.turn.id,payloadDigest:fixture.digest,sessionId:'capture-1',
    sequence:11,kind:'outgoing-request',source:'network',identity:'outgoing-2'};
  fixture.journal.observeDelivery({turnId:fixture.turn.id,expectedRevision:fixture.turn.revision,
    evidence:delivery});
  const after=evidence.nativeKnowledge();
  assert.equal(after.items.some(row=>row.stage==='send.uncertain'),false,
    'withdrawn uncertainty is absent from the projection');
  assert.equal(after.tombstones.length,0,'the correlation exposes no history to tombstone');
  assert.equal(after.items.some(row=>row.stage==='send.observed'),true);
  assert.ok(after.items.every(row=>row.ledger==='studio-thread-turn-journal'));
});

test('live projection rows carry proof identity; quarantine removes forward evidence',async t=>{
  const {dataRoot,bridge}=setup(t);
  const record=bridge.create({origin:'relay',text:'private prompt',consumer:'harness',
    chat:{conversationId:conv,mode:'relay-chat'}});
  const live=createSourceVerifiedLiveProjection({dataRoot,worldId:'world-local'});
  const accepted=await live.recordAcceptedRelay(record.id);
  const queued=live.nativeKnowledge();
  assert.equal(queued.schema,CONVERSATION_KNOWLEDGE_SCHEMA);
  assert.deepEqual(queued.sources,['bridge','studio-journal','live-state']);
  const queueRows=queued.items.filter(row=>row.stage==='transport.queued');
  assert.ok(queueRows.length>=1);
  const liveRow=queueRows.find(row=>row.ledger==='host-live-state');
  assert.ok(liveRow,'the live-state log contributes its own provenance node');
  assertRowContract(liveRow);
  assert.equal(liveRow.source,'relay');
  assert.equal(liveRow.ledger,'host-live-state');
  assert.equal(liveRow.sourceRef,record.id);
  assert.equal(liveRow.semanticId,'vivim:conversation:'+conv+':'+accepted.messageId+':transport.queued');
  assert.equal(queueRows.find(row=>row.source==='relay').sourceRef,record.id,
    'the bridge ledger node carries the same source identity');
  assert.equal(JSON.stringify(queued).includes('private prompt'),false);
  assert.deepEqual(live.nativeKnowledge().items,queued.items,'replay is byte-identical');

  bridge.claim(record.id,{by:'harness'});
  await live.recordBridgeTransition({commandId:record.id,messageId:accepted.messageId,
    idempotencyKey:'claim-'+record.id});
  const claimed=live.nativeKnowledge();
  const claimRow=claimed.items.find(row=>row.stage==='bridge.claimed');
  assert.ok(claimRow,'the committed claim revision appears');
  assert.equal(claimRow.source,'bridge');
  assert.equal(claimed.items.filter(row=>row.stage==='transport.queued').length,1,
    'the historical queue proof is not retracted by a later stage');
});

test('a quarantined message contributes no forward row and is tombstoned',async t=>{
  const fixture=journalFixture(t,{deliver:false});
  const {dataRoot,bridge,command}=fixture;
  const live=createSourceVerifiedLiveProjection({dataRoot,worldId:'world-local'});
  const accepted=await live.recordAcceptedRelay(command.id);
  await live.reconcileBridgeClaims();
  const reconciliation=await live.reconcileStudioJournal();
  assert.equal(reconciliation.authorized,0,'an uncertain turn never authorizes a send');
  assert.equal(reconciliation.uncertain,1,'a turn with no delivery is recorded as uncertain');
  const state=live.messageState(accepted.messageId);
  assert.equal(state.phase,'uncertain');
  const knowledge=live.nativeKnowledge();
  assert.equal(knowledge.items.some(row=>row.ledger==='host-live-state'&&
    row.stage==='send.uncertain'),false,
    'the live-state log never promotes uncertainty to a forward stage');
  assert.equal(knowledge.items.some(row=>row.ledger==='host-live-state'&&
    row.stage==='send.observed'),false,'no send or reply row is invented');
  assert.equal(knowledge.items.some(row=>row.ledger==='studio-thread-turn-journal'&&
    row.stage==='send.uncertain'),true,
    'the Studio journal still attests its own uncertainty stage');
  assert.ok(knowledge.tombstones.some(t=>t.sourceRef===accepted.messageId&&
    t.stage==='message.evidence'&&t.reason==='quarantined-uncertain'),
  'the quarantined message is tombstoned by identity');
  assert.ok(knowledge.tombstones.some(t=>t.sourceRef===command.id&&
    t.stage==='transport.queued'),'the bridge tombstone is merged into the same envelope');
  assert.ok(knowledge.items.some(row=>row.stage==='transport.queued'),
    'earlier verified proofs are retained, only the conclusion is withdrawn');
});

test('an unverified live event never reaches native knowledge',async t=>{
  const {dataRoot}=setup(t);
  const live=createSourceVerifiedLiveProjection({dataRoot,worldId:'world-local'});
  const observation={kind:'message.intent',idempotencyKey:'intent-cmd-0000000000000000',
    conversationId:conv,messageId:'msg-'+'0'.repeat(16),commandId:'cmd-'+'0'.repeat(16),
    source:'host',sourceRef:'cmd-'+'0'.repeat(16),sourceRevision:1,
    evidenceDigest:'0'.repeat(64)};
  await assert.rejects(()=>live.record(observation),/LIVE_EVIDENCE_UNVERIFIED/);
  const knowledge=live.nativeKnowledge();
  assert.deepEqual(knowledge.items,[]);
  assert.deepEqual(knowledge.tombstones,[]);
  assert.equal(knowledge.revision,0);
});

test('native knowledge envelope is bounded and carries no private bodies',async t=>{
  const {dataRoot,bridge}=setup(t);
  const adapter=createBridgeEvidence({dataRoot});
  const ids=[];
  for(let i=0;i<3;i++){
    const record=bridge.create({origin:'relay',text:'secret-'+i,consumer:'harness',
      chat:{conversationId:conv,mode:'relay-chat'}});
    ids.push(record.id);
  }
  const knowledge=adapter.nativeKnowledge();
  assert.equal(knowledge.items.length,3);
  assert.equal(new Set(knowledge.items.map(row=>row.id)).size,3,'stable identity, no duplicates');
  assert.ok(knowledge.omitted===0);
  const serialized=JSON.stringify(knowledge);
  for(let i=0;i<3;i++)assert.equal(serialized.includes('secret-'+i),false);
});
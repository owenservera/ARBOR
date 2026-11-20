# File: apps/vivim-host/test/conversation-native-knowledge.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/conversation-native-knowledge.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 17787 B |
| Lines | 299 |
| Hash | 04dd40355068 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| conv | const | 21 | no | const conv=&#39;c-&#39;+&#39;a&#39;.repeat(16); |
| uuid | const | 22 | no | const uuid=&#39;00000000-0000-0000-0000-000000000001&#39;; |
| thread | const | 23 | no | const thread={kind:&#39;chatgpt-c&#39;,id:uuid,ref:&#39;chatgpt-c:&#39;+uuid}; |
| origin | const | 24 | no | const origin=&#39;https://chatgpt.com&#39;; |
| stamp | const | 25 | no | const stamp=&#39;2026-11-01T12:00:00.000Z&#39;; |
| ROW_KEYS | const | 26 | no | const ROW_KEYS=[&#39;id&#39;,&#39;kind&#39;,&#39;stage&#39;,&#39;ledger&#39;,&#39;source&#39;,&#39;sourceRef&#39;,&#39;sourceRevision&#39;,&#39;digest&#39;, |
| setup | function | 28 | no | function setup(t){ |
| dataRoot | const | 29 | no | const dataRoot=mkdtempSync(path.join(os.tmpdir(),&#39;vivim-conversation-knowledge-&#39;)); |
| assertRowContract | function | 33 | no | function assertRowContract(row){ |
| adapter | const | 44 | no | const adapter=createBridgeEvidence({dataRoot}); |
| first | const | 47 | no | const first=adapter.nativeKnowledge(); |
| queuedObservation | const | 51 | no | const queuedObservation=adapter.observe(record.id); |
| queued | const | 52 | no | const queued=first.items[0]; |
| claimObservation | const | 66 | no | const claimObservation=adapter.observe(record.id); |
| claimed | const | 67 | no | const claimed=adapter.nativeKnowledge(); |
| done | const | 80 | no | const done=adapter.nativeKnowledge(); |
| adapter | const | 93 | no | const adapter=createBridgeEvidence({dataRoot}); |
| bootstrap | const | 94 | no | const bootstrap=bridge.create({text:&#39;bootstrap&#39;,consumer:&#39;bootstrap&#39;,origin:&#39;relay&#39;, chat:{mode:&#39;bootstrap&#39;,action:&#39;choose-preset&#39;}}); |
| observation | const | 101 | no | const observation=adapter.observe(record.id); |
| journalFixture | function | 110 | no | function journalFixture(t,{deliver=true}={}){ |
| command | const | 112 | no | const command=bridge.create({origin:&#39;relay&#39;,text:&#39;private exact prompt&#39;,consumer:&#39;harness&#39;, chat:{mode:&#39;relay-chat&#39;,conversationId:conv,target:{provider:&#39;chatgpt&#39;}}}); |
| studioId | const | 116 | no | const studioId=&#39;studio-owner-1&#39;,dir=path.join(dataRoot,&#39;conversations&#39;); |
| journal | const | 118 | no | const journal=createThreadTurnJournal({dataDir:path.join(dir,&#39;thread-turns&#39;), namespace:&#39;local-owner&#39;,origin,thread}); |
| digest | const | 120 | no | const digest=digestTurnPayload(command.text); |
| boundary | const | 121 | no | const boundary={sessionId:&#39;capture-1&#39;,sequence:10,transcriptCount:2}; |
| turn | variable | 122 | no | let turn=journal.reserve({key:command.studioRequestKey,conversationId:studioId,payloadDigest:digest}).turn; |
| replyText | const | 125 | no | const replyText=&#39;verified reply&#39;,replyDigest=digestTurnPayload(replyText),chars=replyText.length; |
| delivery | const | 127 | no | const delivery={turnId:turn.id,payloadDigest:digest,sessionId:&#39;capture-1&#39;, |
| reply | const | 134 | no | const reply={turnId:turn.id,payloadDigest:digest,sessionId:&#39;capture-1&#39;, |
| meta | const | 138 | no | const meta={identity:reply.identity,revision:reply.revision, |
| ready | const | 140 | no | const ready={turnId:turn.id,payloadDigest:digest,sessionId:&#39;capture-1&#39;, |
| snapshot | const | 148 | no | const snapshot={version:1,id:studioId,site:&#39;chatgpt&#39;,revision:3,state:&#39;ready&#39;, |
| fixture | const | 161 | no | const fixture=journalFixture(t); |
| evidence | const | 162 | no | const evidence=createStudioJournalEvidence({dataRoot:fixture.dataRoot}); |
| first | const | 163 | no | const first=evidence.nativeKnowledge(); |
| stages | const | 166 | no | const stages=first.items.map(row=&gt;row.stage).sort(); |
| observed | const | 178 | no | const observed=evidence.observe(fixture.command.id,&#39;send.observed&#39;); |
| fixture | const | 183 | no | const fixture=journalFixture(t,{deliver:false}); |
| evidence | const | 184 | no | const evidence=createStudioJournalEvidence({dataRoot:fixture.dataRoot}); |
| link | const | 185 | no | const link=evidence.links().find(l=&gt;l.commandId===fixture.command.id); |
| before | const | 190 | no | const before=evidence.nativeKnowledge(); |
| delivery | const | 195 | no | const delivery={turnId:fixture.turn.id,payloadDigest:fixture.digest,sessionId:&#39;capture-1&#39;, |
| after | const | 199 | no | const after=evidence.nativeKnowledge(); |
| live | const | 211 | no | const live=createSourceVerifiedLiveProjection({dataRoot,worldId:&#39;world-local&#39;}); |
| accepted | const | 212 | no | const accepted=await live.recordAcceptedRelay(record.id); |
| queued | const | 213 | no | const queued=live.nativeKnowledge(); |
| queueRows | const | 216 | no | const queueRows=queued.items.filter(row=&gt;row.stage===&#39;transport.queued&#39;); |
| liveRow | const | 218 | no | const liveRow=queueRows.find(row=&gt;row.ledger===&#39;host-live-state&#39;); |
| claimed | const | 233 | no | const claimed=live.nativeKnowledge(); |
| claimRow | const | 234 | no | const claimRow=claimed.items.find(row=&gt;row.stage===&#39;bridge.claimed&#39;); |
| fixture | const | 242 | no | const fixture=journalFixture(t,{deliver:false}); |
| live | const | 244 | no | const live=createSourceVerifiedLiveProjection({dataRoot,worldId:&#39;world-local&#39;}); |
| accepted | const | 245 | no | const accepted=await live.recordAcceptedRelay(command.id); |
| reconciliation | const | 247 | no | const reconciliation=await live.reconcileStudioJournal(); |
| state | const | 250 | no | const state=live.messageState(accepted.messageId); |
| knowledge | const | 252 | no | const knowledge=live.nativeKnowledge(); |
| live | const | 272 | no | const live=createSourceVerifiedLiveProjection({dataRoot,worldId:&#39;world-local&#39;}); |
| observation | const | 273 | no | const observation={kind:&#39;message.intent&#39;,idempotencyKey:&#39;intent-cmd-0000000000000000&#39;, |
| knowledge | const | 278 | no | const knowledge=live.nativeKnowledge(); |
| adapter | const | 286 | no | const adapter=createBridgeEvidence({dataRoot}); |
| ids | const | 287 | no | const ids=[]; |
| knowledge | const | 293 | no | const knowledge=adapter.nativeKnowledge(); |
| serialized | const | 297 | no | const serialized=JSON.stringify(knowledge); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 10 | external |
| node:assert/strict | import | 11 | external |
| node:fs | import | 12 | external |
| node:os | import | 13 | external |
| node:path | import | 14 | external |
| ../../../studio/src/studio/bridge-commands.mjs | import | 15 | [studio/src/studio/bridge-commands.mjs](../../../studio/src/studio/bridge-commands.mjs.md) |
| ../../../studio/src/capture/thread-turn-journal.mjs | import | 16 | [studio/src/capture/thread-turn-journal.mjs](../../../studio/src/capture/thread-turn-journal.mjs.md) |
| ../conversations/bridge-evidence.mjs | import | 17 | [apps/vivim-host/conversations/bridge-evidence.mjs](../conversations/bridge-evidence.mjs.md) |
| ../conversations/studio-journal-evidence.mjs | import | 18 | [apps/vivim-host/conversations/studio-journal-evidence.mjs](../conversations/studio-journal-evidence.mjs.md) |
| ../conversations/live-projection.mjs | import | 19 | [apps/vivim-host/conversations/live-projection.mjs](../conversations/live-projection.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 299 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

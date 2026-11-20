# File: apps/vivim-host/test/studio-journal-evidence.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/studio-journal-evidence.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7054 B |
| Lines | 112 |
| Hash | b5fbe96996b3 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| phoneConversation | const | 11 | no | const phoneConversation=&#39;c-&#39;+&#39;a&#39;.repeat(16); |
| uuid | const | 12 | no | const uuid=&#39;00000000-0000-0000-0000-000000000001&#39;; |
| thread | const | 13 | no | const thread={kind:&#39;chatgpt-c&#39;,id:uuid,ref:&#39;chatgpt-c:&#39;+uuid}; |
| origin | const | 14 | no | const origin=&#39;https://chatgpt.com&#39;,stamp=&#39;2026-11-01T12:00:00.000Z&#39;; |
| fixture | function | 15 | no | function fixture(t) { |
| dataRoot | const | 16 | no | const dataRoot=mkdtempSync(path.join(os.tmpdir(),&#39;vivim-journal-transition-&#39;)); |
| bridge | const | 18 | no | const bridge=createBridgeStore({root:dataRoot}); |
| command | const | 19 | no | const command=bridge.create({origin:&#39;relay&#39;,text:&#39;private exact prompt&#39;,consumer:&#39;harness&#39;, chat:{mode:&#39;relay-chat&#39;,conversationId:phoneConversation,target:{provider:&#39;chatgpt&#39;}}}); |
| live | const | 21 | no | const live=createSourceVerifiedLiveProjection({dataRoot,worldId:&#39;world-local&#39;}); |
| status | const | 29 | no | const status=await live.reconcileStudioJournal(); |
| studioId | const | 39 | no | const studioId=&#39;studio-owner-1&#39;,dir=path.join(dataRoot,&#39;conversations&#39;); |
| journal | const | 41 | no | const journal=createThreadTurnJournal({dataDir:path.join(dir,&#39;thread-turns&#39;), namespace:&#39;local-owner&#39;,origin,thread}); |
| digest | const | 43 | no | const digest=digestTurnPayload(command.text); |
| boundary | const | 44 | no | const boundary={sessionId:&#39;capture-1&#39;,sequence:10,transcriptCount:2}; |
| turn | variable | 45 | no | let turn=journal.reserve({key:command.studioRequestKey,conversationId:studioId, payloadDigest:digest}).turn; |
| replyText | const | 49 | no | const replyText=&#39;verified reply&#39;,replyDigest=digestTurnPayload(replyText),chars=replyText.length; |
| delivery | const | 50 | no | const delivery={turnId:turn.id,payloadDigest:digest,sessionId:&#39;capture-1&#39;, |
| reply | const | 53 | no | const reply={turnId:turn.id,payloadDigest:digest,sessionId:&#39;capture-1&#39;, |
| meta | const | 57 | no | const meta={identity:reply.identity,revision:reply.revision, |
| ready | const | 59 | no | const ready={turnId:turn.id,payloadDigest:digest,sessionId:&#39;capture-1&#39;, |
| snapshot | const | 67 | no | const snapshot={version:1,id:studioId,site:&#39;chatgpt&#39;,revision:3,state:&#39;ready&#39;, |
| evidence | const | 76 | no | const evidence=createStudioJournalEvidence({dataRoot}); |
| observed | const | 77 | no | const observed=evidence.observe(command.id,&#39;send.observed&#39;); |
| first | const | 80 | no | const first=await live.reconcileStudioJournal(); |
| state | const | 83 | no | const state=live.messageState(&#39;msg-&#39;+command.id.slice(4)); |
| revision | const | 87 | no | const revision=live.snapshot().revision; |
| args | const | 90 | no | const args={commandId:command.id,messageId:&#39;msg-&#39;+command.id.slice(4), |
| ack | const | 101 | no | const ack=await live.recordPhoneDelivery(args); |
| finalRevision | const | 106 | no | const finalRevision=live.snapshot().revision; |
| duplicate | const | 107 | no | const duplicate=await live.recordPhoneDelivery(args); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../../../studio/src/studio/bridge-commands.mjs | import | 6 | [studio/src/studio/bridge-commands.mjs](../../../studio/src/studio/bridge-commands.mjs.md) |
| ../../../studio/src/capture/thread-turn-journal.mjs | import | 7 | [studio/src/capture/thread-turn-journal.mjs](../../../studio/src/capture/thread-turn-journal.mjs.md) |
| ../conversations/studio-journal-evidence.mjs | import | 8 | [apps/vivim-host/conversations/studio-journal-evidence.mjs](../conversations/studio-journal-evidence.mjs.md) |
| ../conversations/live-projection.mjs | import | 9 | [apps/vivim-host/conversations/live-projection.mjs](../conversations/live-projection.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 113 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

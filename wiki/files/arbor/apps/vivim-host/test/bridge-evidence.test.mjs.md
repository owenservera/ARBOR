# File: apps/vivim-host/test/bridge-evidence.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/bridge-evidence.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6746 B |
| Lines | 122 |
| Hash | b98aac03640a |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| conv | const | 10 | no | const conv=&#39;c-&#39;+&#39;a&#39;.repeat(16); |
| setup | function | 11 | no | function setup(t){ |
| dataRoot | const | 12 | no | const dataRoot=mkdtempSync(path.join(os.tmpdir(),&#39;vivim-verified-bridge-&#39;)); |
| queued | const | 21 | no | const queued=adapter.observe(record.id); |
| claimed | const | 29 | no | const claimed=adapter.observe(record.id); |
| rec | const | 40 | no | const rec=bridge.create({origin:&#39;relay&#39;,text:&#39;private text&#39;,consumer:&#39;harness&#39;, chat:{conversationId:conv,mode:&#39;relay-chat&#39;,target:{provider:&#39;chatgpt&#39;}}}); |
| live | const | 42 | no | const live=createSourceVerifiedLiveProjection({dataRoot,worldId:&#39;world-local&#39;}); |
| first | const | 43 | no | const first=await live.recordAcceptedRelay(rec.id); |
| again | const | 47 | no | const again=await live.recordAcceptedRelay(rec.id); |
| adapter | const | 61 | no | const adapter=createBridgeEvidence({dataRoot}); |
| live | const | 63 | no | const live=createSourceVerifiedLiveProjection({dataRoot,worldId:&#39;world-local&#39;}); |
| live | const | 73 | no | const live=createSourceVerifiedLiveProjection({dataRoot,worldId:&#39;world-local&#39;}); |
| accepted | const | 74 | no | const accepted=await live.recordAcceptedRelay(record.id); |
| reconciled | const | 76 | no | const reconciled=await live.reconcileBridgeClaims(); |
| adapter | const | 87 | no | const adapter=createBridgeEvidence({dataRoot}); |
| live | const | 88 | no | const live=createSourceVerifiedLiveProjection({dataRoot,worldId:&#39;world-local&#39;}); |
| creation | const | 89 | no | const creation=adapter.observe(record.id,&#39;conversation.created&#39;); |
| intent | const | 90 | no | const intent=adapter.observe(record.id,&#39;message.intent&#39;); |
| repaired | const | 94 | no | const repaired=await live.recordAcceptedRelay(record.id); |
| snapshot | const | 97 | no | const snapshot=live.snapshot(); |
| repeat | const | 100 | no | const repeat=await live.recordAcceptedRelay(record.id); |
| rec | const | 107 | no | const rec=bridge.create({origin:&#39;relay&#39;,text:&#39;private&#39;,consumer:&#39;harness&#39;, chat:{conversationId:conv,mode:&#39;relay-chat&#39;}}); |
| live | const | 111 | no | const live=createSourceVerifiedLiveProjection({dataRoot,worldId:&#39;world-local&#39;}); |
| first | const | 112 | no | const first=await live.reconcileBridgeClaims(); |
| state | const | 115 | no | const state=live.messageState(&#39;msg-&#39;+rec.id.slice(4)); |
| again | const | 118 | no | const again=await live.reconcileBridgeClaims(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../../../studio/src/studio/bridge-commands.mjs | import | 6 | [studio/src/studio/bridge-commands.mjs](../../../studio/src/studio/bridge-commands.mjs.md) |
| ../conversations/bridge-evidence.mjs | import | 7 | [apps/vivim-host/conversations/bridge-evidence.mjs](../conversations/bridge-evidence.mjs.md) |
| ../conversations/live-projection.mjs | import | 8 | [apps/vivim-host/conversations/live-projection.mjs](../conversations/live-projection.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 123 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

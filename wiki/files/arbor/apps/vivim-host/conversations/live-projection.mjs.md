# File: apps/vivim-host/conversations/live-projection.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/conversations/live-projection.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 26775 B |
| Lines | 411 |
| Hash | c6d892448f50 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LIVE_SCHEMA | const | 11 | yes | export const LIVE_SCHEMA=&#39;vivim.live-state/1&#39;; |
| FORWARD_KINDS | const | 15 | no | const FORWARD_KINDS=[&#39;transport.queued&#39;,&#39;bridge.claimed&#39;,&#39;send.authorized&#39;,&#39;send.observed&#39;,&#39;reply.observed&#39;,&#39;delivery.acked&#39;]; |
| QUARANTINED_PHASES | const | 16 | no | const QUARANTINED_PHASES=new Set([&#39;uncertain&#39;,&#39;failed_before_send&#39;,&#39;failed_after_send&#39;]); |
| ID | const | 17 | no | const ID=/^[a-zA-Z][a-zA-Z0-9._:-]{0,119}$/; |
| CMD | const | 18 | no | const CMD=/^cmd-[0-9a-f]{16}$/; |
| DIGEST | const | 19 | no | const DIGEST=/^[a-f0-9]{64}$/; |
| EVENT_KINDS | const | 20 | no | const EVENT_KINDS=new Set([&#39;conversation.created&#39;,&#39;message.intent&#39;,&#39;transport.queued&#39;,&#39;bridge.claimed&#39;,&#39;send.authorized&#39;,&#39;send.observed&#39;,&#39;reply.observed&#39;,&#39;delivery.acked&#39;,&#39;send.uncertain&#39;,&#39;send.faile… |
| SOURCES | const | 21 | no | const SOURCES=Object.freeze({&#39;conversation.created&#39;:&#39;host&#39;,&#39;message.intent&#39;:&#39;host&#39;,&#39;transport.queued&#39;:&#39;relay&#39;,&#39;bridge.claimed&#39;:&#39;bridge&#39;, &#39;send.authorized&#39;:&#39;studio&#39;,&#39;send.observed&#39;:&#39;journal&#39;,&#39;reply.ob… |
| ERROR | function | 24 | no | const ERROR=(code)=&gt;Object.assign(new Error(code),{code}); |
| plain | function | 25 | no | const plain=x=&gt;!!x&amp;&amp;typeof x===&#39;object&#39;&amp;&amp;!Array.isArray(x)&amp;&amp;(Object.getPrototypeOf(x)===Object.prototype\|\|Object.getPrototypeOf(x)===null); |
| canonical | function | 26 | no | const canonical=x=&gt;Array.isArray(x)?x.map(canonical):plain(x)?Object.fromEntries(Object.keys(x).sort().map(k=&gt;[k,canonical(x[k])])):x; |
| sha | function | 27 | no | const sha=x=&gt;createHash(&#39;sha256&#39;).update(JSON.stringify(canonical(x))).digest(&#39;hex&#39;); |
| valid | function | 28 | no | const valid=(v,label,pattern=ID)=&gt;{if(typeof v!==&#39;string&#39;\|\|!pattern.test(v))throw ERROR(&#39;LIVE_INVALID_&#39;+label.toUpperCase());return v;}; |
| fields | const | 29 | no | const fields=[&#39;kind&#39;,&#39;idempotencyKey&#39;,&#39;conversationId&#39;,&#39;messageId&#39;,&#39;commandId&#39;,&#39;requestId&#39;,&#39;provider&#39;,&#39;model&#39;,&#39;threadRef&#39;,&#39;source&#39;,&#39;sourceRef&#39;,&#39;sourceRevision&#39;,&#39;evidenceDigest&#39;]; |
| normalize | function | 30 | no | function normalize(o){ |
| x | const | 32 | no | const x={kind:o.kind,idempotencyKey:valid(o.idempotencyKey,&#39;key&#39;),conversationId:valid(o.conversationId,&#39;conversation&#39;)}; |
| apply | function | 51 | no | function apply(state,e){ |
| c | const | 52 | no | const c=state.conversations.get(e.conversationId); |
| m | variable | 59 | no | let m=state.messages.get(e.messageId); |
| allowed | const | 67 | no | const allowed={ |
| next | const | 76 | no | const next={&#39;transport.queued&#39;:&#39;remote_queued&#39;,&#39;bridge.claimed&#39;:&#39;claimed&#39;,&#39;send.authorized&#39;:&#39;send_authorized&#39;, |
| readable | function | 83 | no | function readable(dir){ |
| filename | function | 87 | no | const filename=n=&gt;&#39;e-&#39;+String(n).padStart(8,&#39;0&#39;)+&#39;.json&#39;; |
| createLiveStateProjection | function | 88 | yes | export function createLiveStateProjection({dir,worldId,verifyObservation,now=()=&gt;new Date().toISOString(),maxEvents=20000}={}){ |
| root | const | 91 | no | const root=path.join(dir,&#39;live-state&#39;,worldId),lock=path.join(root,&#39;.writer.lock&#39;); |
| readAll | function | 92 | no | function readAll(){ |
| names | const | 94 | no | const names=fs.readdirSync(root).filter(n=&gt;/^e-\\d{8}\\.json$/.test(n)).sort(); |
| events | const | 96 | no | const events=[];let prev=&#39;0&#39;.repeat(64); |
| file | const | 99 | no | const file=path.join(root,names[i]);if(!fs.lstatSync(file).isFile())throw ERROR(&#39;LIVE_PATH_UNSAFE&#39;); |
| e | variable | 100 | no | let e;try{e=JSON.parse(fs.readFileSync(file,&#39;utf8&#39;));}catch{throw ERROR(&#39;LIVE_EVENT_CORRUPT&#39;);} |
| validatedEvents | function | 107 | no | function validatedEvents(){ |
| events | const | 108 | no | const events=readAll(),state={conversations:new Map(),messages:new Map()},keys=new Map(); |
| normalized | const | 110 | no | const normalized=normalize(Object.fromEntries(fields.filter(k=&gt;e[k]!==undefined).map(k=&gt;[k,e[k]]))); |
| e | const | 118 | no | const e=normalize(observation); |
| verified | const | 119 | no | const verified=await verifyObservation({...e}); |
| fd | variable | 123 | no | let fd;try{fd=fs.openSync(lock,&#39;wx&#39;,0o600);fs.writeFileSync(fd,JSON.stringify({pid:process.pid,worldId,startedAt:now()}));fs.fsyncSync(fd);}catch(ex){if(ex.code===&#39;EEXIST&#39;)throw ERROR(&#39;LIVE_WRITER_BU… |
| sequence | const | 131 | no | const sequence=events.length+1,previousDigest=events.at(-1)?.digest??&#39;0&#39;.repeat(64); |
| event | const | 132 | no | const event={schema:LIVE_SCHEMA,worldId,sequence,...e,observedAt:now(),previousDigest}; |
| f | variable | 138 | no | let f;try{f=fs.openSync(temp,&#39;wx&#39;,0o600);fs.writeFileSync(f,JSON.stringify(event)+&#39;\\n&#39;);fs.fsyncSync(f);fs.closeSync(f);f=undefined; |
| outcomeProjection | function | 146 | no | function outcomeProjection(events,state){ |
| kinds | const | 147 | no | const kinds={&#39;reply.observed&#39;:&#39;reply_observed&#39;,&#39;delivery.acked&#39;:&#39;delivered&#39;, |
| rows | const | 149 | no | const rows=[]; |
| e | const | 151 | no | const e=events[m.revision-1];if(!e\|\|kinds[e.kind]!==m.phase)continue; |
| studioOutcomes | function | 162 | no | function studioOutcomes(){const {events,state}=validatedEvents();return outcomeProjection(events,state);} |
| nativeKnowledge | function | 169 | no | function nativeKnowledge(){ |
| latest | const | 171 | no | const latest=new Map(); |
| items | const | 173 | no | const items=[],tombstones=[]; |
| proof | const | 178 | no | const proof=m.proofs[stage];if(!proof)continue; |
| event | const | 179 | no | const event=latest.get(m.id+&#39;\\u0000&#39;+stage);if(!event)continue; |
| snapshot | function | 190 | no | function snapshot(){ |
| changesSince | function | 198 | no | function changesSince(cursor={sequence:0,digest:&#39;0&#39;.repeat(64)},{limit=50,transport=&#39;direct&#39;}={}){ |
| events | const | 200 | no | const events=readAll(),seq=cursor?.sequence,digest=cursor?.digest; |
| expected | const | 202 | no | const expected=seq===0?&#39;0&#39;.repeat(64):events[seq-1]?.digest; |
| chunk | const | 204 | no | const chunk=events.slice(seq,seq+limit); |
| projected | const | 207 | no | const projected=chunk.map(e=&gt;({sequence:e.sequence,kind:e.kind,conversationId:e.conversationId, messageId:e.messageId??null,commandId:e.commandId??null,source:e.source,digest:e.digest})); |
| messageState | function | 214 | no | function messageState(messageId) { |
| m | const | 217 | no | const m=state.messages.get(messageId); |
| worldTimeline | function | 228 | no | function worldTimeline() { |
| current | const | 229 | no | const current = snapshot(); |
| createSourceVerifiedLiveProjection | function | 250 | yes | export function createSourceVerifiedLiveProjection({dataRoot,worldId,verifyOtherSource,now}={}) { |
| bridge | const | 251 | no | const bridge=createBridgeEvidence({dataRoot}); |
| studioJournal | const | 252 | no | const studioJournal=createStudioJournalEvidence({dataRoot}); |
| phoneAcks | const | 253 | no | const phoneAcks=createPhoneDeliveryAcks({dataRoot}); |
| verifyObservation | function | 254 | no | const verifyObservation=observation=&gt; |
| projection | const | 259 | no | const projection=createLiveStateProjection({dir:dataRoot,worldId,verifyObservation,now}); |
| recordAcceptedRelay | function | 262 | no | async function recordAcceptedRelay(commandId) { |
| conversation | const | 263 | no | const conversation=bridge.observe(commandId,&#39;conversation.created&#39;); |
| intent | const | 264 | no | const intent=bridge.observe(commandId,&#39;message.intent&#39;); |
| queued | const | 265 | no | const queued=bridge.observe(commandId,&#39;transport.queued&#39;); |
| before | variable | 269 | no | let before=projection.messageState(intent.messageId); |
| alreadyPresent | const | 270 | no | const alreadyPresent=Boolean(before); |
| after | const | 280 | no | const after=projection.messageState(intent.messageId); |
| recordBridgeTransition | function | 284 | no | async function recordBridgeTransition({commandId,messageId,idempotencyKey}={}) { |
| evidence | const | 285 | no | const evidence=bridge.observe(commandId,&#39;bridge.claimed&#39;); |
| prior | const | 287 | no | const prior=projection.messageState(messageId); |
| reconcileBridgeClaims | function | 292 | no | async function reconcileBridgeClaims() { |
| recovered | variable | 293 | no | let recovered=0,recorded=0,skipped=0,failed=0; |
| messageId | const | 297 | no | const messageId=&#39;msg-&#39;+item.commandId.slice(4); |
| before | const | 298 | no | const before=projection.messageState(messageId); |
| receipt | const | 301 | no | const receipt=await recordAcceptedRelay(item.commandId); |
| messageId | const | 308 | no | const messageId=&#39;msg-&#39;+claim.commandId.slice(4); |
| state | const | 309 | no | const state=projection.messageState(messageId); |
| reconcileStudioJournal | function | 321 | no | async function reconcileStudioJournal() { |
| authorized | variable | 322 | no | let authorized=0,sent=0,replied=0,uncertain=0,skipped=0,failed=0; |
| links | const | 325 | no | const links=studioJournal.links(); |
| verifiedReplyDisplayCommands | const | 326 | no | const verifiedReplyDisplayCommands=links.filter(link=&gt; link.stages.replyDisplayMatchesJournal===true).map(link=&gt;link.commandId); |
| messageId | const | 332 | no | const messageId=&#39;msg-&#39;+link.commandId.slice(4); |
| state | variable | 333 | no | let state=projection.messageState(messageId); |
| evidence | const | 342 | no | const evidence=studioJournal.observe(link.commandId,kind,link); |
| evidence | const | 355 | no | const evidence=studioJournal.observe(link.commandId,&#39;send.uncertain&#39;,link); |
| recordPhoneDelivery | function | 367 | no | async function recordPhoneDelivery({commandId,messageId,conversationId,deviceId,replyRevision}={}) { |
| before | const | 368 | no | const before=projection.messageState(messageId); |
| saved | const | 382 | no | const saved=phoneAcks.put({commandId,messageId,conversationId,deviceId,replyRevision}); |
| event | const | 385 | no | const event={kind:&#39;delivery.acked&#39;,idempotencyKey:&#39;phone-ack-&#39;+commandId, |
| recorded | const | 387 | no | const recorded=await projection.record(event); |
| verifiedReplyDisplays | function | 391 | no | const verifiedReplyDisplays=()=&gt;new Set(studioJournal.links() .filter(link=&gt;link.stages.replyDisplayMatchesJournal===true) .map(link=&gt;link.commandId)); |
| nativeKnowledge | function | 399 | no | function nativeKnowledge(){ |
| live | const | 400 | no | const live=projection.nativeKnowledge(); |
| bridgeRows | const | 401 | no | const bridgeRows=bridge.nativeKnowledge(); |
| studioRows | const | 402 | no | const studioRows=studioJournal.nativeKnowledge(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 4 | external |
| node:path | import | 5 | external |
| node:crypto | import | 6 | external |
| ./bridge-evidence.mjs | import | 7 | [apps/vivim-host/conversations/bridge-evidence.mjs](./bridge-evidence.mjs.md) |
| ./studio-journal-evidence.mjs | import | 8 | [apps/vivim-host/conversations/studio-journal-evidence.mjs](./studio-journal-evidence.mjs.md) |
| ./phone-delivery-acks.mjs | import | 9 | [apps/vivim-host/conversations/phone-delivery-acks.mjs](./phone-delivery-acks.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/direct-phone.mjs](../direct-phone.mjs.md) | ./conversations/live-projection.mjs |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./conversations/live-projection.mjs |
| [apps/vivim-host/test/bridge-evidence.test.mjs](../test/bridge-evidence.test.mjs.md) | ../conversations/live-projection.mjs |
| [apps/vivim-host/test/conversation-native-knowledge.test.mjs](../test/conversation-native-knowledge.test.mjs.md) | ../conversations/live-projection.mjs |
| [apps/vivim-host/test/phone-sessions.test.mjs](../test/phone-sessions.test.mjs.md) | ../conversations/live-projection.mjs |
| [apps/vivim-host/test/studio-journal-evidence.test.mjs](../test/studio-journal-evidence.test.mjs.md) | ../conversations/live-projection.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM M2A/C16/H07 — PC-local metadata projection, NOT a conversation-send API.
// Source of truth remains Studio's conversation snapshots, journal and bridge; this log is
// a reconstructible, append-only, hash-linked read model. No prompts/replies/credentials.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { createBridgeEvidence, knowledgeRow, knowledgeEnvelope } from './bridge-evidence.mjs';
import { createStudioJournalEvidence } from './studio-journal-evidence.mjs';
import { createPhoneDeliveryAcks } from './phone-delivery-acks.mjs';

export const LIVE_SCHEMA='vivim.live-state/1';
// Stages that assert forward progress. `send.uncertain` and the failure stages
// are deliberately excluded: they are quarantine signals, never evidence that a
// provider accepted or delivered anything.
const FORWARD_KINDS=['transport.queued','bridge.claimed','send.authorized','send.observed','reply.observed','delivery.acked'];
const QUARANTINED_PHASES=new Set(['uncertain','failed_before_send','failed_after_send']);
const ID=/^[a-zA-Z][a-zA-Z0-9._:-]{0,119}$/;
const CMD=/^cmd-[0-9a-f]{16}$/;
const DIGEST=/^[a-f0-9]{64}$/;
const EVENT_KINDS=new Set(['conversation.created','message.intent','transport.queued','bridge.claimed','send.authorized','send.observed','reply.observed','delivery.acked','send.uncertain','send.failed_before','send.failed_after']);
const SOURCES=Object.freeze({'conversation.created':'host','message.intent':'host','transport.queued':'relay','bridge.claimed':'bridge',
  'send.authorized':'studio','send.observed':'journal','reply.observed':'studio','delivery.acked':'phone',
  'send.uncertain':'journal','send.failed_before':'journal','send.failed_after':'journal'});
const ERROR=(code)=>Object.assign(new Error(code),{code});
const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&(Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
const canonical=x=>Array.isArray(x)?x.map(canonical):plain(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const sha=x=>createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
const valid=(v,label,pattern=ID)=>{if(typeof v!=='string'||!pattern.test(v))throw ERROR('LIVE_INVALID_'+label.toUpperCase());return v;};
const fields=['kind','idempotencyKey','conversationId','messageId','commandId','requestId','provider','model','threadRef','source','sourceRef','sourceRevision','evidenceDigest'];
function normalize(o){
  if(!plain(o)||Object.keys(o).some(k=>!fields.includes(k))||!EVENT_KINDS.has(o.kind))throw ERROR('LIVE_EVENT_INVALID');
  const x={kind:o.kind,idempotencyKey:valid(o.idempotencyKey,'key'),conversationId:valid(o.conversationId,'conversation')};
  if(o.kind!=='conversation.created')x.messageId=valid(o.messageId,'message');
  if(o.kind==='conversation.created'||o.kind==='message.intent'){
    if(o.provider!==undefined)x.provider=valid(o.provider,'provider');
    if(o.model!==undefined)x.model=valid(o.model,'model');
  }
  if(o.kind!=='conversation.created')x.commandId=valid(o.commandId,'command',CMD);
  if(['send.authorized','send.observed','reply.observed','send.uncertain','send.failed_before','send.failed_after'].includes(o.kind))x.requestId=valid(o.requestId,'request');
  if(o.threadRef!==undefined)x.threadRef=valid(o.threadRef,'thread');
  x.source=valid(o.source,'source');
  // A queue-backed phone intent is a Relay observation, not a synthetic Host receipt.
  if(x.source!==SOURCES[o.kind] && !(x.source==='relay' &&
    ['conversation.created','message.intent'].includes(o.kind)))throw ERROR('LIVE_WRONG_SOURCE');
  x.sourceRef=valid(o.sourceRef,'source_reference');
  if(!Number.isSafeInteger(o.sourceRevision)||o.sourceRevision<0)throw ERROR('LIVE_INVALID_REVISION');
  x.sourceRevision=o.sourceRevision;
  x.evidenceDigest=valid(o.evidenceDigest,'evidence_digest',DIGEST);
  return x;
}
function apply(state,e){
  const c=state.conversations.get(e.conversationId);
  if(e.kind==='conversation.created'){
    if(c)throw ERROR('LIVE_CONVERSATION_EXISTS');
    state.conversations.set(e.conversationId,{id:e.conversationId,provider:e.provider??null,model:e.model??null,messages:[],revision:e.sequence});
    return;
  }
  if(!c)throw ERROR('LIVE_CONVERSATION_MISSING');
  let m=state.messages.get(e.messageId);
  if(e.kind==='message.intent'){
    if(m||[...state.messages.values()].some(x=>x.commandId===e.commandId))throw ERROR('LIVE_MESSAGE_EXISTS');
    m={id:e.messageId,conversationId:e.conversationId,commandId:e.commandId,provider:e.provider??c.provider,model:e.model??c.model,
      requestId:null,threadRef:null,phase:'created',revision:e.sequence,proofs:{}};
    state.messages.set(m.id,m);c.messages.push(m.id);c.revision=e.sequence;return;
  }
  if(!m||m.conversationId!==e.conversationId||m.commandId!==e.commandId)throw ERROR('LIVE_MESSAGE_MISSING');
  const allowed={
    'transport.queued':['created'], 'bridge.claimed':['remote_queued'], 'send.authorized':['claimed'],
    'send.observed':['send_authorized'], 'reply.observed':['waiting_reply'], 'delivery.acked':['reply_observed'],
    'send.uncertain':['claimed','send_authorized','waiting_reply'],
    'send.failed_before':['claimed','send_authorized'], 'send.failed_after':['send_authorized','waiting_reply']
  };
  if(!allowed[e.kind]?.includes(m.phase))throw ERROR('LIVE_TRANSITION_INVALID');
  if(e.requestId){if(m.requestId&&m.requestId!==e.requestId)throw ERROR('LIVE_REQUEST_BINDING_CHANGED');m.requestId=e.requestId;}
  if(e.threadRef){if(m.threadRef&&m.threadRef!==e.threadRef)throw ERROR('LIVE_THREAD_BINDING_CHANGED');m.threadRef=e.threadRef;}
  const next={'transport.queued':'remote_queued','bridge.claimed':'claimed','send.authorized':'send_authorized',
    'send.observed':'waiting_reply','reply.observed':'reply_observed','delivery.acked':'delivered',
    'send.uncertain':'uncertain','send.failed_before':'failed_before_send','send.failed_after':'failed_after_send'};
  m.phase=next[e.kind];m.revision=e.sequence;
  m.proofs[e.kind]={source:e.source,ref:e.sourceRef,revision:e.sourceRevision,evidenceDigest:e.evidenceDigest};
```

_First 80 of 412 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

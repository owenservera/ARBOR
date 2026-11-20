# File: apps/vivim-host/conversations/bridge-evidence.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/conversations/bridge-evidence.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9682 B |
| Lines | 156 |
| Hash | 7d20174ff6b6 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CONVERSATION_KNOWLEDGE_SCHEMA | const | 6 | yes | export const CONVERSATION_KNOWLEDGE_SCHEMA=&#39;vivim.conversation-knowledge/1&#39;; |
| MAX_KNOWLEDGE_ROWS | const | 7 | no | const MAX_KNOWLEDGE_ROWS=500; |
| COMMAND | const | 8 | no | const COMMAND=/^cmd-[0-9a-f]{16}$/; |
| CONVERSATION | const | 9 | no | const CONVERSATION=/^c-[a-f0-9]{16}$/; |
| sha | function | 10 | no | const sha=value=&gt;createHash(&#39;sha256&#39;).update(JSON.stringify(value)).digest(&#39;hex&#39;); |
| clean | function | 18 | no | const clean=value=&gt;String(value??&#39;&#39;).replace(/[\\u0000-\\u001f\\u007f]/g,&#39; &#39;).replace(/\\s+/gu,&#39; &#39;).trim().slice(0,100); |
| knowledgeRow | function | 19 | yes | export function knowledgeRow({stage,source,ledger,sourceRef,sourceRevision,digest,order,semanticId,title,summary}){ |
| knowledgeEnvelope | function | 24 | yes | export function knowledgeEnvelope({revision,items,tombstones,omitted=0,extra={}}={}){ |
| byId | const | 25 | no | const byId=new Map(),gone=new Map(); |
| rows | const | 28 | no | const rows=[...byId.values()].sort((a,b)=&gt;a.id&lt;b.id?-1:a.id&gt;b.id?1:0); |
| goneRows | const | 29 | no | const goneRows=[...gone.values()].sort((a,b)=&gt;a.sourceRef&lt;b.sourceRef?-1:a.sourceRef&gt;b.sourceRef?1: a.stage&lt;b.stage?-1:a.stage&gt;b.stage?1:0); |
| proofOf | function | 36 | no | const proofOf=record=&gt;({ source:record.status===&#39;queued&#39;?&#39;relay&#39;:&#39;bridge&#39;, sourceRef:record.id, sourceRevision:record.rev, evidenceDigest:sha({id:record.id,rev:record.rev,status:record.status, origin… |
| createBridgeEvidence | function | 42 | yes | export function createBridgeEvidence({dataRoot}={}) { |
| store | const | 44 | no | const store=createBridgeStore({root:dataRoot}); |
| observe | function | 45 | no | function observe(commandId,kind=null,revision=null) { |
| wantedStatus | const | 49 | no | const wantedStatus=[&#39;conversation.created&#39;,&#39;message.intent&#39;,&#39;transport.queued&#39;].includes(kind) |
| records | const | 52 | no | const records=store.history(commandId); |
| current | const | 60 | no | const current=record.status===&#39;queued&#39;?&#39;transport.queued&#39;:&#39;bridge.claimed&#39;; |
| eventKind | const | 62 | no | const eventKind=kind??current; |
| base | const | 63 | no | const base={kind:eventKind,conversationId:record.conversationId,...proofOf(record)}; |
| verify | function | 72 | no | async function verify(observation) { |
| current | const | 75 | no | const current=observe(observation.sourceRef,observation.kind,observation.sourceRevision); |
| verifyObservation | function | 86 | no | async function verifyObservation(observation,verifyOtherSource) { |
| recentRelayChats | function | 93 | no | const recentRelayChats=()=&gt;store.list({limit:200}).items |
| currentClaims | function | 98 | no | const currentClaims=()=&gt;{ |
| latest | const | 99 | no | const latest=store.list({limit:200}).items.filter(r=&gt; r.origin===&#39;relay&#39; &amp;&amp; r.mode===&#39;relay-chat&#39; &amp;&amp; CONVERSATION.test(r.conversationId??&#39;&#39;)); |
| histories | const | 101 | no | const histories=store.histories(latest.map(r=&gt;r.id)); |
| claimed | const | 103 | no | const claimed=(histories.get(r.id)\|\|[]).find(x=&gt; x.status===&#39;claimed&#39; &amp;&amp; x.origin===&#39;relay&#39; &amp;&amp; x.mode===&#39;relay-chat&#39; &amp;&amp; x.conversationId===r.conversationId); |
| nativeKnowledge | function | 115 | no | function nativeKnowledge({limit=200}={}) { |
| records | variable | 116 | no | let records; |
| items | const | 123 | no | const items=[],tombstones=[];let omitted=0; |
| order | const | 127 | no | const order=Date.parse(record.createdAt); |
| current | const | 129 | no | const current=observe(record.id); |
| queued | const | 130 | no | const queued=current?.kind===&#39;transport.queued&#39;?current:observe(record.id,&#39;transport.queued&#39;); |
| claimed | const | 131 | no | const claimed=current?.kind===&#39;bridge.claimed&#39;?current:observe(record.id,&#39;bridge.claimed&#39;); |
| stage | const | 140 | no | const stage=current.kind; |
| other | const | 148 | no | const other=stage===&#39;bridge.claimed&#39;?&#39;transport.queued&#39;:&#39;bridge.claimed&#39;; |
| superseded | const | 149 | no | const superseded=other===&#39;transport.queued&#39;?queued:claimed; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 2 | external |
| node:path | import | 3 | external |
| ../../../studio/src/studio/bridge-commands.mjs | import | 4 | [studio/src/studio/bridge-commands.mjs](../../../studio/src/studio/bridge-commands.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/conversations/live-projection.mjs](./live-projection.mjs.md) | ./bridge-evidence.mjs |
| [apps/vivim-host/conversations/studio-journal-evidence.mjs](./studio-journal-evidence.mjs.md) | ./bridge-evidence.mjs |
| [apps/vivim-host/test/bridge-evidence.test.mjs](../test/bridge-evidence.test.mjs.md) | ../conversations/bridge-evidence.mjs |
| [apps/vivim-host/test/conversation-native-knowledge.test.mjs](../test/conversation-native-knowledge.test.mjs.md) | ../conversations/bridge-evidence.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Evidence adapter: the Studio bridge ledger is canonical. No provider send or reply proof.
import {createHash} from 'node:crypto';
import path from 'node:path';
import {createBridgeStore} from '../../../studio/src/studio/bridge-commands.mjs';

export const CONVERSATION_KNOWLEDGE_SCHEMA='vivim.conversation-knowledge/1';
const MAX_KNOWLEDGE_ROWS=500;
const COMMAND=/^cmd-[0-9a-f]{16}$/;
const CONVERSATION=/^c-[a-f0-9]{16}$/;
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
// Native ingestion consumes durable nodes keyed by stable source identity. Rows
// carry the same field names as the Host's existing native knowledge rows
// (chat/rust-context.mjs buildNativeKnowledge): id, kind, semanticId, sourceRef,
// digest, revision, sourceRevision, order, title, summary. Provenance is the
// (source, ledger, sourceRef, sourceRevision, digest) tuple; authority stays
// host-read-only. `order` is the ledger commit time when the source exposes one
// and null otherwise - it is never synthesized, so replays stay byte-identical.
const clean=value=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/gu,' ').trim().slice(0,100);
export function knowledgeRow({stage,source,ledger,sourceRef,sourceRevision,digest,order,semanticId,title,summary}){
  return {id:'vivim-context-c-'+sha([ledger,source,stage,sourceRef]),kind:'conversation-evidence',
    stage,ledger,source,sourceRef,sourceRevision,digest,revision:sourceRevision,order,
    semanticId,title:clean(title),summary:clean(summary),authority:'host-read-only'};
}
export function knowledgeEnvelope({revision,items,tombstones,omitted=0,extra={}}={}){
  const byId=new Map(),gone=new Map();
  for(const row of items)if(row&&!byId.has(row.id))byId.set(row.id,row);
  for(const t of tombstones??[]){const key=t.sourceRef+'\u0000'+t.stage;if(!gone.has(key))gone.set(key,{sourceRef:t.sourceRef,stage:t.stage,reason:clean(t.reason)});}
  const rows=[...byId.values()].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  const goneRows=[...gone.values()].sort((a,b)=>a.sourceRef<b.sourceRef?-1:a.sourceRef>b.sourceRef?1:
    a.stage<b.stage?-1:a.stage>b.stage?1:0);
  return {schema:CONVERSATION_KNOWLEDGE_SCHEMA,authority:'host-read-only',
    revision:Number.isSafeInteger(revision)&&revision>=0?revision:0,
    items:rows.slice(0,MAX_KNOWLEDGE_ROWS),tombstones:goneRows,
    omitted:omitted+Math.max(0,rows.length-MAX_KNOWLEDGE_ROWS),...extra};
}
const proofOf=record=>({
  source:record.status==='queued'?'relay':'bridge', sourceRef:record.id, sourceRevision:record.rev,
  evidenceDigest:sha({id:record.id,rev:record.rev,status:record.status,
    origin:record.origin,mode:record.mode,consumer:record.consumer,
    conversationId:record.conversationId??null,target:record.target??null})
});
export function createBridgeEvidence({dataRoot}={}) {
  if(typeof dataRoot!=='string'||!path.isAbsolute(dataRoot))throw new TypeError('Absolute dataRoot required');
  const store=createBridgeStore({root:dataRoot});
  function observe(commandId,kind=null,revision=null) {
    if(!COMMAND.test(commandId??''))return null;
    let record;
    try {
      const wantedStatus=['conversation.created','message.intent','transport.queued'].includes(kind)
        ? 'queued' : kind==='bridge.claimed' ? 'claimed' : null;
      if(wantedStatus || revision!==null) {
        const records=store.history(commandId);
        record=records.find(r=>r.status===wantedStatus &&
          (revision===null||r.rev===revision));
      } else record=store.get(commandId);
    } catch {return null;}
    if(!record||!['queued','claimed'].includes(record.status) ||
       record.origin!=='relay'||record.mode!=='relay-chat'||
       !CONVERSATION.test(record.conversationId??''))return null;
    const current=record.status==='queued'?'transport.queued':'bridge.claimed';
    if(kind!==null && kind!==current && !(['conversation.created','message.intent'].includes(kind) && record.status==='queued'))return null;
    const eventKind=kind??current;
    const base={kind:eventKind,conversationId:record.conversationId,...proofOf(record)};
    if(eventKind==='conversation.created')return {...base,
      ...(record.target?.provider?{provider:record.target.provider}:{}),
      ...(record.target?.model?{model:record.target.model}:{})};
    return {...base,commandId:record.id,
      ...(eventKind==='message.intent'?{messageId:'msg-'+record.id.slice(4),
        ...(record.target?.provider?{provider:record.target.provider}:{}),
        ...(record.target?.model?{model:record.target.model}:{})}:{})};
  }
  async function verify(observation) {
    if(!observation||!['relay','bridge'].includes(observation.source)||
       !COMMAND.test(observation.sourceRef??''))return {verified:false};
    const current=observe(observation.sourceRef,observation.kind,observation.sourceRevision);
    if(!current)return {verified:false};
    for(const key of ['kind','conversationId','messageId','commandId','provider','model',
      'source','sourceRef','sourceRevision','evidenceDigest']) {
      // Queue/claim records carry no messageId; the projection binds it to commandId.
      if(key==='messageId'&&current.messageId===undefined&&current.commandId!==undefined)continue;
```

_First 80 of 157 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

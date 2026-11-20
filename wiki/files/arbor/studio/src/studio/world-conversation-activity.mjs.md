# File: studio/src/studio/world-conversation-activity.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/world-conversation-activity.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4139 B |
| Lines | 71 |
| Hash | bdeec772c513 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| STUDIO_CONVERSATION_ACTIVITY_SCHEMA | const | 9 | yes | export const STUDIO_CONVERSATION_ACTIVITY_SCHEMA=&#39;vivim.world-studio-conversation-activity/1&#39;; |
| NAME | const | 10 | no | const NAME=/^([a-zA-Z0-9][a-zA-Z0-9_-]{0,127})\\.conversation\\.json$/; |
| MAX_BYTES | const | 11 | no | const MAX_BYTES=4*1024*1024; |
| readStudioConversationActivity | function | 12 | yes | export function readStudioConversationActivity({dataRoot,limit=40}={}) { |
| root | const | 15 | no | const root=path.join(dataRoot,&#39;conversations&#39;); |
| empty | const | 16 | no | const empty={schema:STUDIO_CONVERSATION_ACTIVITY_SCHEMA,source:&#39;studio-conversation-snapshot&#39;, |
| rootStat | const | 19 | no | const rootStat=lstatSync(root); |
| candidates | const | 23 | no | const candidates=readdirSync(root).filter(name=&gt;NAME.test(name)) |
| conversations | const | 27 | no | const conversations=[]; |
| unavailable | variable | 28 | no | let unavailable=0; |
| id | const | 31 | no | const id=NAME.exec(filename)[1],file=path.join(root,filename); |
| stat | const | 33 | no | const stat=lstatSync(file); |
| raw | const | 35 | no | const raw=JSON.parse(readFileSync(file,&#39;utf8&#39;)); |
| journal | variable | 37 | no | let journal={state:&#39;missing&#39;,turns:[]}; |
| byTurn | const | 46 | no | const byTurn=new Map(journal.turns.map(t=&gt;[t.id,t])); |
| j | const | 54 | no | const j=byTurn.get(a.id); |
| attributed | const | 55 | no | const attributed=j &amp;&amp; j.key===a.key &amp;&amp; j.payloadDigest===a.payloadDigest ? j:null; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 4 | external |
| node:path | import | 5 | external |
| ../capture/conversation-service.mjs | import | 6 | [studio/src/capture/conversation-service.mjs](../capture/conversation-service.mjs.md) |
| ../capture/thread-turn-journal.mjs | import | 7 | [studio/src/capture/thread-turn-journal.mjs](../capture/thread-turn-journal.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/world-service.mjs](./world-service.mjs.md) | ./world-conversation-activity.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Pure Personal World projection of Studio's saved conversation snapshots.
// No browser access, replay, journal mutation, transcript bodies or delivery claims.
// Studio's own conversation service and thread journal remain source authorities.
import {readdirSync,lstatSync,readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {validConversationSnapshot} from '../capture/conversation-service.mjs';
import {readThreadTurnJournalEvidence} from '../capture/thread-turn-journal.mjs';

export const STUDIO_CONVERSATION_ACTIVITY_SCHEMA='vivim.world-studio-conversation-activity/1';
const NAME=/^([a-zA-Z0-9][a-zA-Z0-9_-]{0,127})\.conversation\.json$/;
const MAX_BYTES=4*1024*1024;
export function readStudioConversationActivity({dataRoot,limit=40}={}) {
  if(!path.isAbsolute(dataRoot??'')||!Number.isInteger(limit)||limit<1||limit>100)
    throw new TypeError('Invalid Studio conversation activity scope');
  const root=path.join(dataRoot,'conversations');
  const empty={schema:STUDIO_CONVERSATION_ACTIVITY_SCHEMA,source:'studio-conversation-snapshot',
    authoritativeFor:'saved-snapshot-only',state:'no-snapshots',conversations:[]};
  if(!existsSync(root))return empty;
  const rootStat=lstatSync(root);
  if(!rootStat.isDirectory()||rootStat.isSymbolicLink())return {...empty,state:'unavailable'};
  // The limit caps files read, not source-name discovery. UUID filenames do
  // not encode recency, so sort by source mtime rather than lexicographic id.
  const candidates=readdirSync(root).filter(name=>NAME.test(name))
    .map(name=>{try{return {name,mtime:lstatSync(path.join(root,name)).mtimeMs};}
      catch{return {name,mtime:-1};}})
    .sort((a,b)=>b.mtime-a.mtime).slice(0,200).map(x=>x.name);
  const conversations=[];
  let unavailable=0;
  for(const filename of candidates) {
    if(conversations.length>=limit)break;
    const id=NAME.exec(filename)[1],file=path.join(root,filename);
    try {
      const stat=lstatSync(file);
      if(!stat.isFile()||stat.isSymbolicLink()||stat.size>MAX_BYTES)throw new Error('UNSAFE_SOURCE');
      const raw=JSON.parse(readFileSync(file,'utf8'));
      if(!validConversationSnapshot(raw,id))throw new Error('INVALID_SNAPSHOT');
      let journal={state:'missing',turns:[]};
      if(raw.binding?.thread) {
        try {
          journal=readThreadTurnJournalEvidence({
            dataDir:path.join(root,'thread-turns'),namespace:'local-owner',
            origin:raw.binding.origin,thread:raw.binding.thread,conversationId:id
          });
        } catch { journal={state:'unavailable',turns:[]}; }
      }
      const byTurn=new Map(journal.turns.map(t=>[t.id,t]));
      conversations.push({id,site:raw.site??null,state:raw.state??'unknown',
        revision:raw.revision,updatedAt:raw.updatedAt??null,
        journalState:journal.state,journalRevision:journal.revision??null,
        // A snapshot is not proof of a current browser effect or that the
        // phone received a response. Never expose prompt/reply text.
        deliveryAcknowledged:false,
        attempts:raw.attempts.slice(-30).map(a=>{
          const j=byTurn.get(a.id);
          const attributed=j && j.key===a.key && j.payloadDigest===a.payloadDigest ? j:null;
          return {id:a.id,phase:a.phase??null,
            // Snapshot observation is distinct from verified journal evidence.
            sendState:a.send?.state??'unknown',replyState:a.reply?.state??'unknown',
            journalVerified:Boolean(attributed),
            journalDispatchAuthorized:attributed?.dispatchAuthorized??false,
            journalDeliveryObserved:attributed?.deliveryObserved??false,
            journalReplyObserved:attributed?.replyObserved??false,
            journalReadiness:attributed?.readiness??'unknown',
            journalCompletion:attributed?.completion??'unknown',
            uncertain:a.send?.state==='uncertain'||a.phase==='unknown'||
              attributed?.uncertainty===true};
        })});
    } catch {unavailable++; }
  }
  return {...empty,state:'source-backed',conversations,unavailable};
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

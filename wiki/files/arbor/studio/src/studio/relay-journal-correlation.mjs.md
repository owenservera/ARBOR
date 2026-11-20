# File: studio/src/studio/relay-journal-correlation.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/relay-journal-correlation.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6505 B |
| Lines | 119 |
| Hash | 6e7465a1e675 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| RELAY_JOURNAL_LINK_SCHEMA | const | 13 | yes | export const RELAY_JOURNAL_LINK_SCHEMA=&#39;vivim.relay-studio-journal-correlation/1&#39;; |
| FILE | const | 14 | no | const FILE=/^([a-zA-Z0-9][a-zA-Z0-9_-]{0,127})\\.conversation\\.json$/; |
| COMMAND | const | 15 | no | const COMMAND=/^cmd-[a-f0-9]{16}$/; |
| hash | function | 16 | no | const hash=text=&gt;createHash(&#39;sha256&#39;).update(text,&#39;utf8&#39;).digest(&#39;hex&#39;); |
| safeFile | function | 17 | no | const safeFile=file=&gt;{ |
| stat | const | 18 | no | const stat=lstatSync(file); |
| readRelayJournalCorrelations | function | 21 | yes | export function readRelayJournalCorrelations({dataRoot,limit=50}={}) { |
| store | const | 25 | no | const store=createBridgeStore({root:dataRoot}); |
| commands | const | 26 | no | const commands=store.list({limit:200}).items.filter(r=&gt; COMMAND.test(r.id??&#39;&#39;)&amp;&amp;r.origin===&#39;relay&#39;&amp;&amp;r.mode===&#39;relay-chat&#39;&amp;&amp; r.consumer===&#39;harness&#39;&amp;&amp;typeof r.text===&#39;string&#39;&amp;&amp; r.studioRequestKey===&#39;re… |
| root | const | 30 | no | const root=path.join(dataRoot,&#39;conversations&#39;); |
| base | const | 31 | no | const base={schema:RELAY_JOURNAL_LINK_SCHEMA, |
| stat | const | 36 | no | const stat=lstatSync(root); |
| candidates | const | 38 | no | const candidates=readdirSync(root).filter(n=&gt;FILE.test(n)) |
| indexed | const | 42 | no | const indexed=new Map(); |
| unavailable | variable | 43 | no | let unavailable=0; |
| id | const | 45 | no | const id=FILE.exec(name)[1],file=path.join(root,name); |
| snapshot | const | 48 | no | const snapshot=JSON.parse(readFileSync(file,&#39;utf8&#39;)); |
| matches | const | 52 | no | const matches=indexed.get(attempt.key)??[]; |
| correlations | const | 59 | no | const correlations=[]; |
| history | variable | 64 | no | let history; |
| candidates | const | 67 | no | const candidates=indexed.get(command.studioRequestKey)??[]; |
| intent | variable | 74 | no | let intent; |
| journal | variable | 78 | no | let journal; |
| turns | const | 85 | no | const turns=journal.turns.filter(t=&gt;t.id===attempt.id&amp;&amp; t.key===attempt.key&amp;&amp;t.payloadDigest===attempt.payloadDigest); |
| turn | const | 88 | no | const turn=turns[0]; |
| replyPrefix | const | 93 | no | const replyPrefix=&#39;[&#39;+intent.provider+&#39;] &#39;; |
| replyDisplayMatchesJournal | const | 94 | no | const replyDisplayMatchesJournal=command.status===&#39;done&#39; &amp;&amp; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 5 | external |
| node:fs | import | 6 | external |
| node:path | import | 7 | external |
| ./bridge-commands.mjs | import | 8 | [studio/src/studio/bridge-commands.mjs](./bridge-commands.mjs.md) |
| ./relay-chat-intent.mjs | import | 9 | [studio/src/studio/relay-chat-intent.mjs](./relay-chat-intent.mjs.md) |
| ../capture/conversation-service.mjs | import | 10 | [studio/src/capture/conversation-service.mjs](../capture/conversation-service.mjs.md) |
| ../capture/thread-turn-journal.mjs | import | 11 | [studio/src/capture/thread-turn-journal.mjs](../capture/thread-turn-journal.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/conversations/studio-journal-evidence.mjs](../../../apps/vivim-host/conversations/studio-journal-evidence.mjs.md) | ../../../studio/src/studio/relay-journal-correlation.mjs |
| [studio/src/studio/world-service.mjs](./world-service.mjs.md) | ./relay-journal-correlation.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Trust-preserving join of an existing relay command and a Studio-owned send-once turn.
// Read-only: no claim, submit, reply, journal mutation or provider action.
// A match requires the exact bridge-generated request key, unchanged payload digest,
// and checksum-validated, conversation-owned thread journal evidence.
import {createHash} from 'node:crypto';
import {existsSync,lstatSync,readdirSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {createBridgeStore} from './bridge-commands.mjs';
import {parseRelayChatIntent} from './relay-chat-intent.mjs';
import {validConversationSnapshot} from '../capture/conversation-service.mjs';
import {readThreadTurnJournalEvidence} from '../capture/thread-turn-journal.mjs';

export const RELAY_JOURNAL_LINK_SCHEMA='vivim.relay-studio-journal-correlation/1';
const FILE=/^([a-zA-Z0-9][a-zA-Z0-9_-]{0,127})\.conversation\.json$/;
const COMMAND=/^cmd-[a-f0-9]{16}$/;
const hash=text=>createHash('sha256').update(text,'utf8').digest('hex');
const safeFile=file=>{
  const stat=lstatSync(file);
  return stat.isFile()&&!stat.isSymbolicLink()&&stat.size<=4*1024*1024;
};
export function readRelayJournalCorrelations({dataRoot,limit=50}={}) {
  if(typeof dataRoot!=='string'||!path.isAbsolute(dataRoot)||
      !Number.isInteger(limit)||limit<1||limit>100)
    throw new TypeError('Invalid relay journal correlation scope');
  const store=createBridgeStore({root:dataRoot});
  const commands=store.list({limit:200}).items.filter(r=>
    COMMAND.test(r.id??'')&&r.origin==='relay'&&r.mode==='relay-chat'&&
    r.consumer==='harness'&&typeof r.text==='string'&&
    r.studioRequestKey==='relay-'+r.id);
  const root=path.join(dataRoot,'conversations');
  const base={schema:RELAY_JOURNAL_LINK_SCHEMA,
    source:'bridge-and-studio-thread-journal',readOnly:true,
    state:'no-studio-snapshots',checkedCommands:commands.length,correlations:[],
    unmatched:commands.length,unavailableSnapshots:0};
  if(!existsSync(root))return base;
  const stat=lstatSync(root);
  if(!stat.isDirectory()||stat.isSymbolicLink())return {...base,state:'unavailable'};
  const candidates=readdirSync(root).filter(n=>FILE.test(n))
    .map(name=>{try{return {name,mtime:lstatSync(path.join(root,name)).mtimeMs};}
      catch{return {name,mtime:-1};}})
    .sort((a,b)=>b.mtime-a.mtime).slice(0,200).map(x=>x.name);
  const indexed=new Map();
  let unavailable=0;
  for(const name of candidates) {
    const id=FILE.exec(name)[1],file=path.join(root,name);
    try {
      if(!safeFile(file))throw new Error('UNSAFE_SNAPSHOT');
      const snapshot=JSON.parse(readFileSync(file,'utf8'));
      if(!validConversationSnapshot(snapshot,id)||!snapshot.binding?.thread)continue;
      for(const attempt of snapshot.attempts??[]) {
        if(typeof attempt.key==='string'&&attempt.key.startsWith('relay-cmd-')) {
          const matches=indexed.get(attempt.key)??[];
          matches.push({snapshot,attempt});
          indexed.set(attempt.key,matches);
        }
      }
    } catch {unavailable++; }
  }
  const correlations=[];
  for(const command of commands) {
    if(correlations.length>=limit)break;
    // The bridge must really have been claimed by its harness consumer; a
    // manually completed but never claimed job is not a Studio execution.
    let history;
    try{history=store.history(command.id);}catch{continue;}
    if(!history.some(r=>r.status==='claimed'&&r.consumer==='harness'&&r.origin==='relay'))continue;
    const candidates=indexed.get(command.studioRequestKey)??[];
    // Ambiguous duplicates must not be resolved by file-order preference.
    if(candidates.length!==1)continue;
    const {snapshot,attempt}=candidates[0];
    // Mirror the *actual* Studio worker's prompt bytes, including a validated
    // @provider prefix. A prefix is routing syntax, not part of the sent prompt.
    // Reject any provider/target conflict rather than guessing.
    let intent;
    try{intent=parseRelayChatIntent(command);}catch{continue;}
    if(intent.provider!==snapshot.site||intent.model||intent.effort)continue;
    if(attempt.payloadDigest!==hash(intent.prompt))continue;
    let journal;
    try{journal=readThreadTurnJournalEvidence({
      dataDir:path.join(root,'thread-turns'),namespace:'local-owner',
```

_First 80 of 120 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

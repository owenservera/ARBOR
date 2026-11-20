# File: apps/vivim-host/chat/rust-context.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/chat/rust-context.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 23371 B |
| Lines | 375 |
| Hash | 5e60406a75a5 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| execFile | const | 13 | no | const execFile=promisify(execFileCb); |
| CHAT_CONTEXT_SCHEMA | const | 14 | yes | export const CHAT_CONTEXT_SCHEMA=&#39;vivim.hqkg-chat-context/1&#39;; |
| MAX_OUTPUT | const | 15 | no | const MAX_OUTPUT=32768; |
| FOCUS | const | 16 | no | const FOCUS=new Set([&#39;today&#39;,&#39;talk&#39;,&#39;build&#39;,&#39;world&#39;,&#39;wiki&#39;,&#39;me&#39;,&#39;control&#39;]); |
| unavailable | function | 17 | no | const unavailable=reason=&gt;({ schema:CHAT_CONTEXT_SCHEMA,state:&#39;unavailable&#39;,core:&#39;hqkg&#39;,authority:&#39;read-only&#39;, reason,items:[] }); |
| createRustChatContext | function | 21 | yes | export function createRustChatContext({ env=process.env,execute=execFile,dataRoot=null,productJournal=null,control=null, executePersonal=runPersonal,repoRoot=DEFAULT_ROOT,isFile=regularFile }={}){ |
| binary | const | 26 | no | const binary=env.VIVIM_CHAT_CORE_BIN; |
| journal | const | 27 | no | const journal=env.VIVIM_CHAT_CORE_JOURNAL; |
| seed | const | 28 | no | const seed=env.VIVIM_CHAT_CORE_SEED; |
| stdout | variable | 35 | no | let stdout; |
| data | variable | 44 | no | let data;try{data=JSON.parse(stdout)}catch{return unavailable(&#39;RUST_CORE_OUTPUT_INVALID&#39;)} |
| items | const | 54 | no | const items=[]; |
| DEFAULT_ROOT | const | 83 | no | const DEFAULT_ROOT = fileURLToPath(new URL(&#39;../../../&#39;, import.meta.url)); |
| PERSONAL_SCHEMA | const | 84 | no | const PERSONAL_SCHEMA = &#39;vivim.hqkg-personal/1&#39;; |
| digest | function | 85 | no | const digest = value =&gt; createHash(&#39;sha256&#39;).update(JSON.stringify(value)).digest(&#39;hex&#39;); |
| SHA | const | 86 | no | const SHA = /^[a-f0-9]{64}$/; |
| safe | function | 87 | no | const safe = (value, max) =&gt; String(value ?? &#39;&#39;).replace(/[\\x00-\\x1f\\x7f-\\x9f]/g, &#39; &#39;) |
| safeUInt | function | 89 | no | const safeUInt = n =&gt; Number.isSafeInteger(n) &amp;&amp; n &gt;= 0; |
| regularFile | function | 90 | no | function regularFile(file) { |
| resolveBundledRustBinary | function | 95 | yes | export function resolveBundledRustBinary(name,{repoRoot=DEFAULT_ROOT,isFile=regularFile,platform=process.platform}={}) { |
| ext | const | 97 | no | const ext = platform === &#39;win32&#39; ? &#39;.exe&#39; : &#39;&#39;; |
| dirs | const | 98 | no | const dirs = [path.join(repoRoot,&#39;native&#39;,&#39;bin&#39;), path.join(repoRoot,&#39;target&#39;,&#39;release&#39;), |
| resolveRustContextRuntime | function | 103 | yes | export function resolveRustContextRuntime({env=process.env,repoRoot=DEFAULT_ROOT,isFile=regularFile,platform=process.platform}={}) { |
| choose | function | 104 | no | const choose=(name,override)=&gt;override!==undefined |
| buildNativeKnowledge | function | 114 | yes | export function buildNativeKnowledge(snapshot, effects) { |
| rows | const | 118 | no | const rows = []; |
| relation | const | 120 | no | const relation = e.relationship; |
| structure | const | 137 | no | const structure=snapshot.context?.wikiStructure; |
| pages | const | 138 | no | const pages=new Map(); |
| captures | const | 153 | no | const captures=snapshot.context?.capturePages??[]; |
| captureIds | const | 155 | no | const captureIds=new Set(); |
| selected | const | 169 | no | const selected=new Set(); |
| pair | const | 171 | no | const pair=[item.edit.from,item.edit.to].filter(p=&gt;!selected.has(p)); |
| wikiLink | const | 189 | no | const wikiLink = e.wikiLink ?? null; |
| sequenceLinks | const | 195 | no | const sequenceLinks=e.sequenceLinks??null; |
| visual | const | 199 | no | const visual=e.visualLink??null; |
| linked | const | 207 | no | const linked = wikiLink ? &#39; · Wiki revision &#39;+wikiLink.wikiRevision : |
| buildNativeRelationships | function | 224 | yes | export function buildNativeRelationships(snapshot,rows){ |
| ids | const | 225 | no | const ids=new Map(rows.filter(r=&gt;r.kind===&#39;wiki&#39;&amp;&amp;r.semanticId.startsWith(&#39;wiki:page:&#39;)) .map(r=&gt;[r.semanticId,r.id])); |
| links | const | 227 | no | const links=snapshot.context?.wikiStructure?.links\|\|[]; |
| runPersonal | function | 240 | no | function runPersonal(binary, journal, packet) { |
| child | const | 242 | no | const child=execFileCb(binary,[&#39;--journal&#39;,journal],{ encoding:&#39;utf8&#39;,shell:false,windowsHide:true,timeout:8000,maxBuffer:MAX_OUTPUT },(error,stdout)=&gt;{ if (error) { let reason; |
| reason | variable | 246 | no | let reason; |
| code | const | 248 | no | const code=typeof reason===&#39;string&#39; &amp;&amp; reason.startsWith(&#39;RECOVERY_REQUIRED&#39;) |
| nativePacket | function | 260 | no | async function nativePacket(result) { |
| managedReader | function | 266 | no | function managedReader({env,dataRoot,productJournal,control,executePersonal,repoRoot,isFile}) { |
| root | const | 267 | no | const root=typeof dataRoot===&#39;string&#39; &amp;&amp; path.isAbsolute(dataRoot) ? path.resolve(dataRoot) : null; |
| journal | const | 270 | no | const journal=env.VIVIM_CHAT_CORE_JOURNAL ?? (root &amp;&amp; path.join(root,&#39;hqkg&#39;,&#39;personal.hqj&#39;)); |
| scope | const | 271 | no | const scope=root &amp;&amp; digest([&#39;vivim-host-personal/1&#39;,root]); |
| queue | variable | 272 | no | let queue=Promise.resolve(); |
| inflight | const | 273 | no | const inflight=new Map(); |
| snapshot | function | 274 | no | async function snapshot() { |
| current | const | 275 | no | const current=await productJournal.readNativeKnowledge({nativeOnly:true}); |
| effects | const | 276 | no | const effects=projectAppliedControlEffects(control(),current.context.wikiChanges,current.context.wikiStructure); |
| rows | const | 277 | no | const rows=buildNativeKnowledge(current,effects); |
| read | function | 280 | no | async function read(view) { |
| runtime | const | 283 | no | const runtime=resolveRustContextRuntime({env,repoRoot,isFile}); |
| dir | const | 286 | no | const dir=path.dirname(journal); |
| st | const | 288 | no | const st=await lstat(dir); |
| projection | const | 294 | no | const projection=await snapshot(),{rows,relationships}=projection,fingerprint=digest(projection); |
| packet | const | 295 | no | const packet=await nativePacket(await executePersonal(runtime.personal,journal,{ schema:PERSONAL_SCHEMA,scope,op:&#39;sync-context-read&#39;,view,nodes:rows,relationships })); |
| result | const | 303 | no | const result=packet.context; |
| nativeLinks | const | 313 | no | const nativeLinks=result.pageRelationships??[]; |
| expectedLinks | const | 316 | no | const expectedLinks=new Map(relationships.map(link=&gt;[link.id,link])); |
| expected | const | 318 | no | const expected=expectedLinks.get(link?.id); |
| byRef | const | 323 | no | const byRef=new Map(rows.map(row=&gt;[row.sourceRef,row])); |
| seen | const | 324 | no | const seen=new Set(), items=[]; |
| sum | variable | 325 | no | let sum=0; |
| expected | const | 327 | no | const expected=byRef.get(item?.sourceRef); |
| view | const | 362 | no | const view=owner?&#39;owner&#39;:&#39;wiki&#39;; |
| pending | variable | 366 | no | let pending=inflight.get(view); |
| run | const | 368 | no | const run=queue.then(()=&gt;read(view)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 4 | external |
| node:fs | import | 5 | external |
| node:fs/promises | import | 6 | external |
| node:url | import | 7 | external |
| node:crypto | import | 8 | external |
| ./product-journal.mjs | import | 9 | [apps/vivim-host/chat/product-journal.mjs](./product-journal.mjs.md) |
| ./wiki-semantics.mjs | import | 10 | [apps/vivim-host/chat/wiki-semantics.mjs](./wiki-semantics.mjs.md) |
| node:child_process | import | 11 | external |
| node:util | import | 12 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/bootstrap/rust-web-reader.mjs](../bootstrap/rust-web-reader.mjs.md) | ../chat/rust-context.mjs |
| [apps/vivim-host/control/native-program.mjs](../control/native-program.mjs.md) | ../chat/rust-context.mjs |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./chat/rust-context.mjs |
| [apps/vivim-host/test/chat-rust-context.test.mjs](../test/chat-rust-context.test.mjs.md) | ../chat/rust-context.mjs |
| [apps/vivim-host/test/control-dispatcher.test.mjs](../test/control-dispatcher.test.mjs.md) | ../chat/rust-context.mjs |
| [apps/vivim-host/test/native-capture-wiring.test.mjs](../test/native-capture-wiring.test.mjs.md) | ../chat/rust-context.mjs |
| [apps/vivim-host/test/native-knowledge-integration.test.mjs](../test/native-knowledge-integration.test.mjs.md) | ../chat/rust-context.mjs |
| [apps/vivim-host/test/wiki-living-knowledge.test.mjs](../test/wiki-living-knowledge.test.mjs.md) | ../chat/rust-context.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Host-owned, read-only adapter to the existing native HQKG graph.
// No local Rust binary or existing journal => report unavailable; never
// substitute synthetic context, accept client-selected graph IDs or spawn a shell.
import path from 'node:path';
import { lstatSync } from 'node:fs';
import { mkdir, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { projectAppliedControlEffects } from './product-journal.mjs';
import { sectionId, receiptId, pageId } from './wiki-semantics.mjs';
import {execFile as execFileCb} from 'node:child_process';
import {promisify} from 'node:util';
const execFile=promisify(execFileCb);
export const CHAT_CONTEXT_SCHEMA='vivim.hqkg-chat-context/1';
const MAX_OUTPUT=32768;
const FOCUS=new Set(['today','talk','build','world','wiki','me','control']);
const unavailable=reason=>({
  schema:CHAT_CONTEXT_SCHEMA,state:'unavailable',core:'hqkg',authority:'read-only',
  reason,items:[]
});
export function createRustChatContext({
  env=process.env,execute=execFile,dataRoot=null,productJournal=null,control=null,
  executePersonal=runPersonal,repoRoot=DEFAULT_ROOT,isFile=regularFile
}={}){
  if (productJournal) return managedReader({env,dataRoot,productJournal,control,executePersonal,repoRoot,isFile});
  const binary=env.VIVIM_CHAT_CORE_BIN;
  const journal=env.VIVIM_CHAT_CORE_JOURNAL;
  const seed=env.VIVIM_CHAT_CORE_SEED;
  return async function readChatContext(focus='talk'){
    if(!FOCUS.has(focus))return unavailable('FOCUS_INVALID');
    if(typeof binary!=='string'||!path.isAbsolute(binary)||
       typeof journal!=='string'||!path.isAbsolute(journal)||
       typeof seed!=='string'||!seed||seed.length>120||/[\x00-\x1f\x7f]/.test(seed))
      return unavailable('RUST_CORE_NOT_CONFIGURED');
    let stdout;
    try{
      ({stdout}=await execute(binary,[journal,seed,'320'],{
        encoding:'utf8',shell:false,windowsHide:true,
        timeout:2500,maxBuffer:MAX_OUTPUT
      }));
    }catch{return unavailable('RUST_CORE_READ_FAILED');}
    if(typeof stdout!=='string'||Buffer.byteLength(stdout,'utf8')>MAX_OUTPUT)
      return unavailable('RUST_CORE_OUTPUT_INVALID');
    let data;try{data=JSON.parse(stdout)}catch{return unavailable('RUST_CORE_OUTPUT_INVALID')}
    if(data?.schema!==CHAT_CONTEXT_SCHEMA||data.state!=='source-backed'||
       data.core!=='hqkg'||data.authority!=='read-only'||data.seed!==seed||
       !Number.isSafeInteger(data.epoch)||data.epoch<0||
       !Number.isSafeInteger(data.tokensUsed)||data.tokensUsed>320||
       data.budgetTokens!==320||data.staleCount!==0||
       !Number.isSafeInteger(data.totalRetrieved)||data.totalRetrieved<0||
       typeof data.budgetExhausted!=='boolean'||!Array.isArray(data.items)||
       data.items.length>8||data.items.length>data.totalRetrieved)
      return unavailable('RUST_CORE_CONTRACT_INVALID');
    const items=[];
    for(const row of data.items){
      if(!row||typeof row.title!=='string'||row.title.length>100||
         /[\x00-\x1f\x7f]/.test(row.title)||
         !Number.isSafeInteger(row.depth)||row.depth<0||row.depth>3||
         !Number.isSafeInteger(row.revision)||row.revision<0||
         !Number.isSafeInteger(row.sourceCount)||row.sourceCount<0||
         !Number.isSafeInteger(row.estimatedTokens)||row.estimatedTokens<0||
         row.estimatedTokens>320)
        return unavailable('RUST_CORE_CONTRACT_INVALID');
      // Deliberately strip all Rust-provided unknown fields and file references.
      items.push({title:row.title,depth:row.depth,revision:row.revision,
        sourceCount:row.sourceCount,estimatedTokens:row.estimatedTokens});
    }
    return {
      schema:CHAT_CONTEXT_SCHEMA,state:'source-backed',core:'hqkg',
      authority:'read-only',focus,epoch:data.epoch,
      tokensUsed:data.tokensUsed,budgetTokens:320,staleCount:0,
      budgetExhausted:data.budgetExhausted,totalRetrieved:data.totalRetrieved,
      items,note:'Context is advisory. Host owns plans, approvals, execution and receipts.'
    };
  };
}



// Existing packaged runtime root and workspace Cargo outputs. No PATH probing,
```

_First 80 of 376 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

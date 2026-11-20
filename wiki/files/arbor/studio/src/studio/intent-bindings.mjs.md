# File: studio/src/studio/intent-bindings.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/intent-bindings.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7509 B |
| Lines | 120 |
| Hash | 735e327a9e30 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| INTENT_BINDING_SCHEMA | const | 9 | yes | export const INTENT_BINDING_SCHEMA = &#39;aion.harness-intent-binding/1&#39;; |
| err | function | 10 | no | const err = (code) =&gt; Object.assign(new Error(code), { code }); |
| isHex64 | function | 11 | no | const isHex64 = s =&gt; typeof s === &#39;string&#39; &amp;&amp; /^[a-f0-9]{64}$/.test(s); |
| nonempty | function | 12 | no | const nonempty = (s, n = 256) =&gt; typeof s === &#39;string&#39; &amp;&amp; s.length &gt; 0 &amp;&amp; s.length &lt;= n &amp;&amp; !/[\\x00-\\x1f\\x7f]/.test(s); |
| keyFileName | function | 13 | no | const keyFileName = (runId, stepKey) =&gt; createHash(&#39;sha256&#39;).update(`${runId}\\u0000${stepKey}`).digest(&#39;hex&#39;)+&#39;.json&#39;; |
| digest | function | 14 | no | const digest = x =&gt; createHash(&#39;sha256&#39;).update(JSON.stringify(x)).digest(&#39;hex&#39;); |
| ident | function | 15 | no | const ident = r =&gt; [r.runId,r.stepKey,r.stepTool,r.argsDigest,r.conversationId,r.threadKey]; |
| identityEqual | function | 16 | no | const identityEqual = (r, a) =&gt; ident(r).every((v,i)=&gt;v===ident(a)[i]); |
| shape | function | 17 | no | const shape = r =&gt; r &amp;&amp; r.schema===INTENT_BINDING_SCHEMA &amp;&amp; r.source===&#39;trusted-pre-effect&#39; |
| publicRecord | function | 23 | no | const publicRecord = r =&gt; Object.fromEntries(Object.entries(r).filter(([k])=&gt;k!==&#39;integrity&#39;)); |
| encode | function | 24 | no | const encode = r =&gt; JSON.stringify({...r,integrity:digest(r)})+&#39;\\n&#39;; |
| LINK_UNSUPPORTED | const | 26 | no | const LINK_UNSUPPORTED = new Set([&#39;EPERM&#39;,&#39;ENOTSUP&#39;,&#39;EOPNOTSUPP&#39;,&#39;EXDEV&#39;,&#39;ENOSYS&#39;]); |
| createIntentBindingStore | function | 28 | yes | export function createIntentBindingStore({dir}={}) { |
| fileFor | function | 31 | no | const fileFor=(runId,stepKey)=&gt;path.join(dir,keyFileName(runId,stepKey)); |
| linkable | variable | 32 | no | let linkable=true; // cleared on the first filesystem that refuses hard links |
| load | function | 33 | no | const load=file=&gt;{ |
| saved | variable | 34 | no | let saved; |
| rec | const | 36 | no | const rec=publicRecord(saved); |
| writeNew | function | 40 | no | const writeNew=(file,record)=&gt;{ |
| body | const | 41 | no | const body=encode(record); |
| temp | const | 48 | no | const temp=`${file}.${randomUUID()}.tmp`; |
| fd | variable | 49 | no | let fd; |
| fd | variable | 60 | no | let fd; |
| writeReplacement | function | 66 | no | const writeReplacement=(file,record)=&gt;{ |
| temp | const | 67 | no | const temp=`${file}.${randomUUID()}.tmp`; |
| fd | variable | 68 | no | let fd; |
| checkedArgs | function | 75 | no | const checkedArgs=a=&gt;{ |
| input | const | 83 | no | const input=checkedArgs(args),file=fileFor(input.runId,input.stepKey); |
| existing | const | 88 | no | const existing=load(file); // unreadable in-flight or corrupt record: fail closed |
| file | const | 96 | no | const file=fileFor(runId,stepKey),lock=`${file}.lock`; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 5 | external |
| node:fs | import | 6 | external |
| node:path | import | 7 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/server.mjs](./server.mjs.md) | ./intent-bindings.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Agent 14 Round 9 — drop-in replacement for Z.ai Round 8 src/studio/intent-bindings.mjs.
// Same createIntentBindingStore({dir})/{record,complete,find,verify} contract.
// Record is exclusive and same-key SAME-intent replay is read-only, not a second effect grant.
// Existing harness run store is the sole effect-admission authority; this file never sends.
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, existsSync, openSync, writeFileSync, fsyncSync, closeSync, readFileSync, renameSync, unlinkSync, rmdirSync, linkSync } from 'node:fs';
import path from 'node:path';

export const INTENT_BINDING_SCHEMA = 'aion.harness-intent-binding/1';
const err = (code) => Object.assign(new Error(code), { code });
const isHex64 = s => typeof s === 'string' && /^[a-f0-9]{64}$/.test(s);
const nonempty = (s, n = 256) => typeof s === 'string' && s.length > 0 && s.length <= n && !/[\x00-\x1f\x7f]/.test(s);
const keyFileName = (runId, stepKey) => createHash('sha256').update(`${runId}\u0000${stepKey}`).digest('hex')+'.json';
const digest = x => createHash('sha256').update(JSON.stringify(x)).digest('hex');
const ident = r => [r.runId,r.stepKey,r.stepTool,r.argsDigest,r.conversationId,r.threadKey];
const identityEqual = (r, a) => ident(r).every((v,i)=>v===ident(a)[i]);
const shape = r => r && r.schema===INTENT_BINDING_SCHEMA && r.source==='trusted-pre-effect'
  && nonempty(r.runId,128) && nonempty(r.stepKey,200) && r.stepTool==='submit_conversation_turn'
  && isHex64(r.argsDigest) && nonempty(r.conversationId,128) && nonempty(r.threadKey,200)
  && nonempty(r.recordedAt,64) && (r.journalTurnKey===null || nonempty(r.journalTurnKey,200))
  && (r.journalPayloadDigest===null || isHex64(r.journalPayloadDigest))
  && (r.journalTurnKey===null)===(r.journalPayloadDigest===null);
const publicRecord = r => Object.fromEntries(Object.entries(r).filter(([k])=>k!=='integrity'));
const encode = r => JSON.stringify({...r,integrity:digest(r)})+'\n';
// Filesystems that cannot hard-link (some network/overlay mounts) fall back to exclusive create.
const LINK_UNSUPPORTED = new Set(['EPERM','ENOTSUP','EOPNOTSUPP','EXDEV','ENOSYS']);

export function createIntentBindingStore({dir}={}) {
  if(typeof dir!=='string'||!dir)throw new TypeError('dir is required');
  mkdirSync(dir,{recursive:true});
  const fileFor=(runId,stepKey)=>path.join(dir,keyFileName(runId,stepKey));
  let linkable=true; // cleared on the first filesystem that refuses hard links
  const load=file=>{
    let saved;
    try {saved=JSON.parse(readFileSync(file,'utf8'));} catch(e){if(e.code==='ENOENT')return null;throw err('INTENT_BINDING_UNREADABLE');}
    const rec=publicRecord(saved);
    if(!shape(rec)||!isHex64(saved.integrity)||digest(rec)!==saved.integrity)throw err('INTENT_BINDING_CORRUPT');
    return rec;
  };
  const writeNew=(file,record)=>{
    const body=encode(record);
    // A record must never be observable before it is complete. openSync(file,'wx') publishes an
    // empty target for the whole duration of writeFileSync, so a second process recording the SAME
    // intent read '' and failed closed with INTENT_BINDING_UNREADABLE instead of converging.
    // link() is an atomic exclusive create: the name appears only once the record is durable, and
    // it still refuses to replace an existing record (EEXIST).
    if(linkable){
      const temp=`${file}.${randomUUID()}.tmp`;
      let fd;
      try {
        fd=openSync(temp,'wx',0o600);writeFileSync(fd,body);fsyncSync(fd);closeSync(fd);fd=undefined;
        linkSync(temp,file);
        return;
      } catch(e){
        if(e.code==='EEXIST')throw e;
        if(!LINK_UNSUPPORTED.has(e.code))throw e;
        linkable=false; // filesystem without hard links: fall back to exclusive create + write
      } finally {if(fd!==undefined)closeSync(fd);try{unlinkSync(temp);}catch{}}
    }
    let fd;
    try {
      fd=openSync(file,'wx',0o600); // atomic exclusive create, even across separate processes
      writeFileSync(fd,body); fsyncSync(fd);
    } finally {if(fd!==undefined)closeSync(fd);}
  };
  const writeReplacement=(file,record)=>{
    const temp=`${file}.${randomUUID()}.tmp`;
    let fd;
    try {
      fd=openSync(temp,'wx',0o600);writeFileSync(fd,encode(record));fsyncSync(fd);closeSync(fd);fd=undefined;
      renameSync(temp,file);
      fd=openSync(file,'r+');fsyncSync(fd);closeSync(fd);fd=undefined; // 'r+': Windows fsync (FlushFileBuffers) needs a write-capable handle
    } finally {if(fd!==undefined)closeSync(fd);try{unlinkSync(temp);}catch{}}
  };
  const checkedArgs=a=>{
    const {runId,stepKey,stepTool,argsDigest,conversationId,threadKey}=a??{};
    if(!nonempty(runId,128)||!nonempty(stepKey,200)||stepTool!=='submit_conversation_turn'
      ||!isHex64(argsDigest)||!nonempty(conversationId,128)||!nonempty(threadKey,200))throw new TypeError('INVALID_INTENT_BINDING_FIELDS');
    return {runId,stepKey,stepTool,argsDigest,conversationId,threadKey};
  };
```

_First 80 of 120 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

# File: studio/src/studio/browser-companion/web-memory-core.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/browser-companion/web-memory-core.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2551 B |
| Lines | 44 |
| Hash | f205a0aea9dc |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| createWebMemoryCoreIngestor | function | 5 | yes | export function createWebMemoryCoreIngestor({root, binary=process.env.VIVIM_WEB_MEMORY_BIN, journal=process.env.VIVIM_WEB_MEMORY_JOURNAL \|\| path.join(root,&#39;browser-companion&#39;,&#39;web-memory.hqj&#39;), spawn… |
| queue | variable | 9 | no | let queue=Promise.resolve(); |
| uncertain | variable | 12 | no | let uncertain=false; |
| once | const | 13 | no | const once=async(payload)=&gt;{ |
| data | const | 17 | no | const data=JSON.stringify(payload); |
| child | const | 20 | no | const child=spawnImpl(binary,[journal],{shell:false,windowsHide:true,stdio:[&#39;pipe&#39;,&#39;pipe&#39;,&#39;pipe&#39;]}); |
| stdout | variable | 21 | no | let stdout=&#39;&#39;,stderr=&#39;&#39;,finished=false; |
| finish | function | 22 | no | const finish=(err,result)=&gt;{if(finished)return;finished=true;clearTimeout(timer);err?reject(err):resolve(result);}; |
| timer | const | 23 | no | const timer=setTimeout(()=&gt;{uncertain=true;try{child.kill();}catch{}finish(new Error(&#39;WEB_MEMORY_CORE_TIMEOUT&#39;));},timeoutMs); |
| counts | const | 29 | no | const counts=stdout.match(/(?:^\|\\s)accepted=(\\d+) inserted=(\\d+)(?:\\s\|$)/); |
| accepted | const | 30 | no | const accepted=counts?Number(counts[1]):NaN,inserted=counts?Number(counts[2]):NaN; |
| run | const | 40 | no | const run=queue.then(()=&gt;once(payload)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 2 | external |
| node:path | import | 3 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/server.mjs](../server.mjs.md) | ./browser-companion/web-memory-core.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Studio -> Rust HQKG data-only bridge. No browser control, model access or execution grants.
import { spawn } from 'node:child_process';
import path from 'node:path';

export function createWebMemoryCoreIngestor({root, binary=process.env.VIVIM_WEB_MEMORY_BIN,
  journal=process.env.VIVIM_WEB_MEMORY_JOURNAL || path.join(root,'browser-companion','web-memory.hqj'),
  spawnImpl=spawn, timeoutMs=12000}={}){
  if (!root) throw new Error('web memory root required');
  let queue=Promise.resolve();
  // A timed-out child may have persisted before it stopped. Refuse overlapping writes
  // until Studio is restarted and Rust can reconcile the original event IDs.
  let uncertain=false;
  const once=async(payload)=>{
    if (uncertain) throw new Error('WEB_MEMORY_CORE_UNCERTAIN_RESTART_REQUIRED');
    if (!binary || !path.isAbsolute(binary)) throw new Error('WEB_MEMORY_CORE_NOT_CONFIGURED');
    if (!path.isAbsolute(journal)) throw new Error('WEB_MEMORY_JOURNAL_NOT_ABSOLUTE');
    const data=JSON.stringify(payload);
    if(Buffer.byteLength(data)>64*1024)throw new Error('WEB_MEMORY_BATCH_TOO_LARGE');
    return await new Promise((resolve,reject)=>{
      const child=spawnImpl(binary,[journal],{shell:false,windowsHide:true,stdio:['pipe','pipe','pipe']});
      let stdout='',stderr='',finished=false;
      const finish=(err,result)=>{if(finished)return;finished=true;clearTimeout(timer);err?reject(err):resolve(result);};
      const timer=setTimeout(()=>{uncertain=true;try{child.kill();}catch{}finish(new Error('WEB_MEMORY_CORE_TIMEOUT'));},timeoutMs);
      child.on('error',err=>finish(err));
      child.stdout?.on('data',d=>{stdout=(stdout+d.toString()).slice(0,4096);});
      child.stderr?.on('data',d=>{stderr=(stderr+d.toString()).slice(0,4096);});
      child.on('close',code=>{
        if(code!==0)return finish(new Error('WEB_MEMORY_CORE_REJECTED: '+stderr.slice(0,240)));
        const counts=stdout.match(/(?:^|\s)accepted=(\d+) inserted=(\d+)(?:\s|$)/);
        const accepted=counts?Number(counts[1]):NaN,inserted=counts?Number(counts[2]):NaN;
        if(accepted!==payload.events.length||!Number.isSafeInteger(inserted)||inserted<0||inserted>accepted)
          return finish(new Error('WEB_MEMORY_CORE_ACK_MISMATCH'));
        finish(null,{accepted,inserted});
      });
      child.stdin?.on('error',err=>finish(err));
      child.stdin?.end(data);
    });
  };
  return payload=>{
    const run=queue.then(()=>once(payload));
    queue=run.catch(()=>{});
    return run;
  };
}
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

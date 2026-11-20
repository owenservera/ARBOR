# File: harness/bin/share-feed.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | harness/bin/share-feed.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2651 B |
| Lines | 48 |
| Hash | 5680d791cae8 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 8 | no | const root=fileURLToPath(new URL(&#39;../../runtime/&#39;, import.meta.url)); |
| dir | const | 9 | no | const dir=join(root,&#39;journal&#39;); |
| stateFile | const | 10 | no | const stateFile=join(root,&#39;shares&#39;,&#39;feed-cursor.json&#39;); |
| statuses | const | 11 | no | const statuses=new Map([[&#39;accepted&#39;,&#39;request.created&#39;],[&#39;approved&#39;,&#39;request.approved&#39;],[&#39;complete&#39;,&#39;request.completed&#39;],[&#39;blocked&#39;,&#39;request.blocked&#39;]]); |
| safe | const | 12 | no | const safe=/^[a-z0-9_-]{1,32}$/; |
| pause | function | 13 | no | const pause=ms=&gt;new Promise(r=&gt;setTimeout(r,ms)); |
| flags | const | 14 | no | const flags=new Set(process.argv.slice(2)); |
| known | variable | 18 | no | let known={}; |
| scan | function | 20 | no | async function scan(){ |
| files | const | 21 | no | const files=await readdir(dir).catch(e=&gt;e.code===&#39;ENOENT&#39;?[]:Promise.reject(e)); |
| current | const | 22 | no | const current={}; |
| rec | const | 26 | no | const rec=JSON.parse(await readFile(join(dir,file),&#39;utf8&#39;)); |
| status | const | 27 | no | const status=String(rec.state??&#39;&#39;).toLowerCase(); |
| marker | const | 30 | no | const marker=[status,String(rec.updatedAt??&#39;&#39;)].join(&#39;:&#39;); |
| event | const | 33 | no | const event={type,at:new Date().toISOString()}; |
| tmp | const | 42 | no | const tmp=stateFile+&#39;.tmp&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs/promises | import | 4 | external |
| node:path | import | 5 | external |
| node:url | import | 6 | external |
| ../src/share/feed-publisher.mjs | import | 7 | [harness/src/share/feed-publisher.mjs](../src/share/feed-publisher.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Publish sanitized *future* journal status transitions, never prompts or replies.
// No browser access; no modifications to harness journal or approvals.
import { readFile, readdir, mkdir, writeFile, rename } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishFeedEvent } from '../src/share/feed-publisher.mjs';
const root=fileURLToPath(new URL('../../runtime/', import.meta.url));
const dir=join(root,'journal');
const stateFile=join(root,'shares','feed-cursor.json');
const statuses=new Map([['accepted','request.created'],['approved','request.approved'],['complete','request.completed'],['blocked','request.blocked']]);
const safe=/^[a-z0-9_-]{1,32}$/;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const flags=new Set(process.argv.slice(2));
if(flags.has('--help')){console.log('Usage: node harness/bin/share-feed.mjs --watch | --once  (requires VIVIM_SHARE_FEED_URL and VIVIM_FEED_PUBLISH_TOKEN; initial run baselines without publishing historic data)');process.exit(0)}
if(!flags.has('--once')&&!flags.has('--watch')) throw Error('Use --once or --watch');
if(!process.env.VIVIM_SHARE_FEED_URL||!process.env.VIVIM_FEED_PUBLISH_TOKEN) throw Error('Feed URL and publish token required');
let known={};
try{known=JSON.parse(await readFile(stateFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e}
async function scan(){
  const files=await readdir(dir).catch(e=>e.code==='ENOENT'?[]:Promise.reject(e));
  const current={};
  for(const file of files){
    if(!/^[A-Za-z0-9_-]{1,128}\.json$/.test(file)) continue;
    try {
      const rec=JSON.parse(await readFile(join(dir,file),'utf8'));
      const status=String(rec.state??'').toLowerCase();
      const type=statuses.get(status);
      if(!type)continue;
      const marker=[status,String(rec.updatedAt??'')].join(':');
      current[file]=marker;
      if(Object.hasOwn(known,file) && known[file]!==marker){
        const event={type,at:new Date().toISOString()};
        if(typeof rec.provider==='string'&&safe.test(rec.provider))event.provider=rec.provider;
        event.status=status;
        await publishFeedEvent(event);
        console.log('published',type,event.provider??'');
      }
    }catch(e){console.error('Skipped record',file,e.message)}
  }
  await mkdir(resolve(root,'shares'),{recursive:true});
  const tmp=stateFile+'.tmp';
  await writeFile(tmp,JSON.stringify(current,null,2),{mode:0o600});
  await rename(tmp,stateFile);
  known=current;
}
await scan();
if(flags.has('--watch')) for(;;){await pause(15000);await scan()}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

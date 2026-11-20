# File: apps/vivim-host/grokbot/run.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/grokbot/run.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3301 B |
| Lines | 56 |
| Hash | ec48e29cbf1a |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| repoAdapters | const | 10 | no | const repoAdapters=path.resolve(path.dirname(fileURLToPath(import.meta.url)),&#39;adapters&#39;); |
| dataRoot | const | 11 | no | const dataRoot=path.resolve(process.env.VIVIM_HOST_DATA_DIR \|\| process.env.CAPTURE_STUDIO_HOME \|\| path.join(process.env.XDG_DATA_HOME \|\| path.join(os.homedir(),&#39;.local&#39;,&#39;share&#39;),&#39;aion-capture-studio&#39;… |
| dir | const | 13 | no | const dir=path.join(dataRoot,&#39;bridge&#39;),lock=path.join(dir,&#39;grokbot-runner.lock&#39;); |
| heartbeat | const | 14 | no | const heartbeat=path.join(dir,&#39;grokbot-worker.json&#39;),temp=heartbeat+&#39;.tmp&#39;; |
| adapterName | const | 15 | no | const adapterName=process.env.VIVIM_GROKBOT_NATIVE_ADAPTER; |
| adapterPath | const | 21 | no | const adapterPath=path.join(repoAdapters,adapterName+&#39;.mjs&#39;); |
| fd | variable | 27 | no | let fd; |
| stopped | variable | 30 | no | let stopped=false; |
| cleanup | function | 31 | no | const cleanup=()=&gt;{ |
| imported | const | 39 | no | const imported=await import(pathToFileURL(adapterPath).href); |
| adapter | const | 40 | no | const adapter=imported.default; |
| worker | const | 42 | no | const worker=createGrokbotWorker({dataRoot,adapter,log:event=&gt;console.error(&#39;[grokbot]&#39;,event.event,event.id\|\|&#39;&#39;)}); |
| writeHealth | function | 43 | no | const writeHealth=()=&gt;{const record={schema:&#39;vivim.grokbot-worker-health/1&#39;,pid:process.pid,adapter:adapterName, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 4 | external |
| node:path | import | 5 | external |
| node:os | import | 6 | external |
| node:url | import | 7 | external |
| ./worker.mjs | import | 8 | [apps/vivim-host/grokbot/worker.mjs](./worker.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Run one configured Grokbot native adapter against the shared Direct bridge.
// No shell commands, no browser/controller launch, no cloud network calls.
import { existsSync, mkdirSync, openSync, closeSync, unlinkSync, writeFileSync, renameSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createGrokbotWorker } from './worker.mjs';

const repoAdapters=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'adapters');
const dataRoot=path.resolve(process.env.VIVIM_HOST_DATA_DIR || process.env.CAPTURE_STUDIO_HOME ||
  path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(),'.local','share'),'aion-capture-studio'));
const dir=path.join(dataRoot,'bridge'),lock=path.join(dir,'grokbot-runner.lock');
const heartbeat=path.join(dir,'grokbot-worker.json'),temp=heartbeat+'.tmp';
const adapterName=process.env.VIVIM_GROKBOT_NATIVE_ADAPTER;
if (process.platform!=='linux') { console.error('Linux-only runner'); process.exit(2); }
if (!adapterName || !/^[a-z0-9-]{1,48}$/.test(adapterName)) {
  console.error('Native adapter not configured. Set VIVIM_GROKBOT_NATIVE_ADAPTER to a verified adapter name.');
  process.exit(2);
}
const adapterPath=path.join(repoAdapters,adapterName+'.mjs');
if (!existsSync(adapterPath) || !statSync(adapterPath).isFile() || !realpathSync(adapterPath).startsWith(realpathSync(repoAdapters)+path.sep)) {
  console.error('Verified native adapter not found under apps/vivim-host/grokbot/adapters');
  process.exit(2);
}
mkdirSync(dir,{recursive:true,mode:0o700});
let fd;
try {fd=openSync(lock,'wx',0o600);writeFileSync(fd,JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}));}
catch { console.error('Another Grokbot runner may own the lock. Inspect it; never steal a stale lock automatically.');process.exit(3); }
let stopped=false;
const cleanup=()=>{
  stopped=true;
  try { unlinkSync(heartbeat); } catch {}
  try {closeSync(fd);}catch{}
  try {unlinkSync(lock);}catch{}
};
for (const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{cleanup();process.exit(0);});
try {
  const imported=await import(pathToFileURL(adapterPath).href);
  const adapter=imported.default;
  if (!adapter || typeof adapter.execute!=='function' || adapter.verified!==true) throw new Error('Adapter must explicitly expose verified:true and execute');
  const worker=createGrokbotWorker({dataRoot,adapter,log:event=>console.error('[grokbot]',event.event,event.id||'')});
  const writeHealth=()=>{const record={schema:'vivim.grokbot-worker-health/1',pid:process.pid,adapter:adapterName,
    available:true,protocol:adapter.protocol||'native',at:new Date().toISOString()};
    writeFileSync(temp,JSON.stringify(record),{mode:0o600});renameSync(temp,heartbeat);};
  writeHealth();
  console.error('Grokbot worker started; direct local bridge only');
  while(!stopped) {
    try {await worker.runOnce();writeHealth();}
    catch(e){console.error('Worker loop error:',e?.name||'Error');}
    await new Promise(resolve=>setTimeout(resolve,3000));
  }
} catch(e) {
  console.error('Grokbot adapter unavailable:',e?.message||'Error');
  process.exitCode=2;
} finally {cleanup();}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

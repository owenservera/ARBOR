# File: apps/vivim-host/test/grokbot-worker.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/grokbot-worker.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2086 B |
| Lines | 40 |
| Hash | 0670a6e97c5a |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fixture | function | 9 | no | const fixture = fn =&gt; async () =&gt; { |
| dir | const | 10 | no | const dir=mkdtempSync(path.join(tmpdir(),&#39;vivim-grokbot-&#39;)); |
| store | const | 14 | no | const store=createBridgeStore({root:dir}); |
| job | const | 15 | no | const job=store.create({text:&#39;inspect status&#39;,consumer:&#39;grokbot&#39;,stage:&#39;inspect&#39;}); |
| worker | const | 16 | no | const worker=createGrokbotWorker({dataRoot:dir}); |
| store | const | 22 | no | const store=createBridgeStore({root:dir}); |
| job | const | 23 | no | const job=store.create({text:&#39;inspect status&#39;,consumer:&#39;grokbot&#39;,stage:&#39;inspect&#39;}); |
| count | variable | 24 | no | let count=0; |
| worker | const | 25 | no | const worker=createGrokbotWorker({dataRoot:dir,adapter:{protocol:&#39;test&#39;,async execute({id}){count++;assert.equal(id,job.id);return {confirmed:true,text:&#39;completed&#39;};}}}); |
| store | const | 32 | no | const store=createBridgeStore({root:dir}); |
| job | const | 33 | no | const job=store.create({text:&#39;inspect status&#39;,consumer:&#39;grokbot&#39;,stage:&#39;inspect&#39;}); |
| count | variable | 34 | no | let count=0; |
| worker | const | 35 | no | const worker=createGrokbotWorker({dataRoot:dir,adapter:{async execute(){count++;throw new Error(&#39;link dropped&#39;);}}}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../grokbot/worker.mjs | import | 6 | [apps/vivim-host/grokbot/worker.mjs](../grokbot/worker.mjs.md) |
| ../../../studio/src/studio/bridge-commands.mjs | import | 7 | [studio/src/studio/bridge-commands.mjs](../../../studio/src/studio/bridge-commands.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createGrokbotWorker } from '../grokbot/worker.mjs';
import { createBridgeStore } from '../../../studio/src/studio/bridge-commands.mjs';

const fixture = fn => async () => {
 const dir=mkdtempSync(path.join(tmpdir(),'vivim-grokbot-'));
 try { await fn(dir); } finally { rmSync(dir,{recursive:true,force:true}); }
};
test('unconfigured adapter leaves queued jobs unclaimed',fixture(async dir=>{
 const store=createBridgeStore({root:dir});
 const job=store.create({text:'inspect status',consumer:'grokbot',stage:'inspect'});
 const worker=createGrokbotWorker({dataRoot:dir});
 assert.equal(worker.status().available,false);
 assert.equal((await worker.runOnce()).state,'unavailable');
 assert.equal(store.get(job.id).status,'queued');
}));
test('confirmed native response is journaled exactly once',fixture(async dir=>{
 const store=createBridgeStore({root:dir});
 const job=store.create({text:'inspect status',consumer:'grokbot',stage:'inspect'});
 let count=0;
 const worker=createGrokbotWorker({dataRoot:dir,adapter:{protocol:'test',async execute({id}){count++;assert.equal(id,job.id);return {confirmed:true,text:'completed'};}}});
 assert.equal((await worker.runOnce()).state,'done');
 assert.equal((await worker.runOnce()).state,'idle');
 assert.equal(count,1);
 assert.equal(store.get(job.id).result,'completed');
}));
test('uncertain adapter never replays a claimed command',fixture(async dir=>{
 const store=createBridgeStore({root:dir});
 const job=store.create({text:'inspect status',consumer:'grokbot',stage:'inspect'});
 let count=0;
 const worker=createGrokbotWorker({dataRoot:dir,adapter:{async execute(){count++;throw new Error('link dropped');}}});
 assert.equal((await worker.runOnce()).state,'uncertain');
 assert.equal((await worker.runOnce()).state,'idle');
 assert.equal(store.get(job.id).status,'claimed');
 assert.equal(count,1);
}));
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

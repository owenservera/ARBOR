# File: apps/vivim-host/test/bootstrap-command.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/bootstrap-command.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2029 B |
| Lines | 41 |
| Hash | 30aed4cf5741 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 11 | no | const root=mkdtempSync(path.join(os.tmpdir(),&#39;vivim-phone-vertical-&#39;)); |
| bridge | const | 13 | no | const bridge=createBridgeStore({root}); |
| runtime | const | 14 | no | const runtime=createBootstrapRuntime({dataRoot:root,file:&#39;:memory:&#39;}); |
| worker | const | 17 | no | const worker=createBootstrapCommandWorker({root,runtime,store:bridge}); |
| enqueue | function | 18 | no | const enqueue=(action,preset)=&gt;bridge.create({ text:action,consumer:&#39;bootstrap&#39;,kind:&#39;command&#39;,origin:&#39;relay&#39;, chat:{mode:&#39;bootstrap&#39;,action,...(preset?{preset}:{})} }); |
| talk | const | 22 | no | const talk=bridge.create({text:&#39;@chatgpt hello&#39;,consumer:&#39;harness&#39;,kind:&#39;command&#39;, origin:&#39;relay&#39;,chat:{mode:&#39;relay-chat&#39;}}); |
| grant | const | 24 | no | const grant=enqueue(&#39;grant-visual&#39;); |
| choice | const | 28 | no | const choice=enqueue(&#39;choose-preset&#39;,&#39;dusk&#39;); |
| result | const | 29 | no | const result=worker.tick(); |
| undo | const | 34 | no | const undo=enqueue(&#39;undo-theme&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:path | import | 4 | external |
| node:os | import | 5 | external |
| ../../../studio/src/studio/bridge-commands.mjs | import | 6 | [studio/src/studio/bridge-commands.mjs](../../../studio/src/studio/bridge-commands.mjs.md) |
| ../bootstrap/runtime.mjs | import | 7 | [apps/vivim-host/bootstrap/runtime.mjs](../bootstrap/runtime.mjs.md) |
| ../bootstrap/command-worker.mjs | import | 8 | [apps/vivim-host/bootstrap/command-worker.mjs](../bootstrap/command-worker.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createBridgeStore} from '../../../studio/src/studio/bridge-commands.mjs';
import {createBootstrapRuntime} from '../bootstrap/runtime.mjs';
import {createBootstrapCommandWorker} from '../bootstrap/command-worker.mjs';

test('real local bridge executes visual grant, owner preset and Undo once without claiming Talk',t=>{
  const root=mkdtempSync(path.join(os.tmpdir(),'vivim-phone-vertical-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const bridge=createBridgeStore({root});
  const runtime=createBootstrapRuntime({dataRoot:root,file:':memory:'});
  t.after(()=>runtime.close());
  assert.equal(runtime.state,'ready');
  const worker=createBootstrapCommandWorker({root,runtime,store:bridge});
  const enqueue=(action,preset)=>bridge.create({
    text:action,consumer:'bootstrap',kind:'command',origin:'relay',
    chat:{mode:'bootstrap',action,...(preset?{preset}:{})}
  });
  const talk=bridge.create({text:'@chatgpt hello',consumer:'harness',kind:'command',
    origin:'relay',chat:{mode:'relay-chat'}});
  const grant=enqueue('grant-visual');
  assert.equal(worker.tick().length,1);
  assert.equal(bridge.get(grant.id).status,'done');
  assert.equal(bridge.get(talk.id).status,'queued');
  const choice=enqueue('choose-preset','dusk');
  const result=worker.tick();
  assert.equal(result[0].status,'done');
  assert.equal(runtime.projection().source,'owner-choice');
  assert.equal(runtime.projection().revision,0);
  assert.equal(runtime.projection().undo.available,true);
  const undo=enqueue('undo-theme');
  assert.equal(worker.tick()[0].status,'done');
  assert.equal(bridge.get(undo.id).status,'done');
  assert.equal(runtime.projection().themeStatus,'provisional');
  assert.equal(worker.tick().length,0);
  assert.equal(bridge.get(talk.id).status,'queued');
  worker.close();
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

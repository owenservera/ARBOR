# File: apps/vivim-host/test/insights.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/insights.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4134 B |
| Lines | 62 |
| Hash | 74619ac12bb2 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| input | function | 10 | no | const input = (status, { stage, cloud = false, chat = &#39;online&#39;, relay = &#39;online&#39;, journalState = null } = {}) =&gt; ({ services: { relay:{state:relay}, chatWorker:{state:chat} }, bridge: {state:&#39;observe… |
| root | const | 30 | no | const root=mkdtempSync(path.join(os.tmpdir(),&#39;vivim-m1c-&#39;)); |
| bridge | const | 32 | no | const bridge=path.join(root,&#39;bridge&#39;); mkdirSync(bridge); |
| id | const | 33 | no | const id=&#39;cmd-1234567890abcdef&#39;, request=&#39;12345678-1234-4234-8234-123456789012&#39;; |
| s | const | 38 | no | const s=messageJourney(root); |
| server | const | 44 | no | const server=createHostServer({dataRoot:path.join(os.tmpdir(),&#39;no-vivim-m1c&#39;)}); |
| response | const | 47 | no | const response=await fetch(&#39;http://127.0.0.1:&#39;+server.address().port+&#39;/api/host/status&#39;); |
| snapshot | const | 49 | no | const snapshot=await response.json(); |
| root | const | 55 | no | const root=new URL(&#39;../public/&#39;,import.meta.url); |
| html | const | 56 | no | const html=readFileSync(new URL(&#39;index.html&#39;,root),&#39;utf8&#39;); |
| script | const | 57 | no | const script=readFileSync(new URL(&#39;host.js&#39;,root),&#39;utf8&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:path | import | 4 | external |
| node:os | import | 5 | external |
| ../insights.mjs | import | 6 | [apps/vivim-host/insights.mjs](../insights.mjs.md) |
| ../diagnostics.mjs | import | 7 | [apps/vivim-host/diagnostics.mjs](../diagnostics.mjs.md) |
| ../server.mjs | import | 8 | [apps/vivim-host/server.mjs](../server.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { diagnoseHost } from '../insights.mjs';
import { messageJourney } from '../diagnostics.mjs';
import { hostSnapshot, createHostServer } from '../server.mjs';

const input = (status, { stage, cloud = false, chat = 'online', relay = 'online', journalState = null } = {}) => ({
  services: { relay:{state:relay}, chatWorker:{state:chat} },
  bridge: {state:'observed'},
  journey: {state:'observed', recent:[{id:'cmd-abcdef0123456789',status,consumer:'harness',currentStage:stage,
    evidence:{cloudUpdateAccepted:cloud, journalState}}]}
});
test('safe diagnostic distinctions for local queue, claim, uncertainty and cloud acknowledgement', () => {
  assert.equal(diagnoseHost(input('queued',{chat:'stale'})).code,'CHAT_WORKER_NOT_HEALTHY');
  assert.equal(diagnoseHost(input('queued',{chat:'unknown'})).code,'CHAT_WORKER_NOT_VERIFIED');
  assert.equal(diagnoseHost(input('claimed',{chat:'online'})).code,'LOCAL_COMMAND_PROCESSING');
  assert.equal(diagnoseHost(input('claimed',{chat:'stale'})).code,'CLAIMED_WORKER_NOT_VERIFIED');
  assert.equal(diagnoseHost(input('claimed',{stage:'send_outcome_uncertain',journalState:'uncertain'})).code,'UNCERTAIN_SEND');
  assert.equal(diagnoseHost(input('done')).code,'CLOUD_UPDATE_PENDING');
  assert.equal(diagnoseHost(input('done',{cloud:true})).code,'CLOUD_UPDATE_ACCEPTED');
  assert.match(diagnoseHost(input('done',{cloud:true})).detail,/not verified/i);
  assert.equal(diagnoseHost(input('failed',{cloud:true})).code,'LOCAL_COMMAND_FAILED');
  assert.equal(diagnoseHost({journey:{state:'not_observed',recent:[]},services:{}}).code,'NO_LOCAL_ACTIVITY');
  assert.equal(diagnoseHost({journey:{state:'unavailable'},services:{}}).code,'LOCAL_EVIDENCE_UNAVAILABLE');
});
test('bridge request ID survives a later final answer without leaking text', () => {
  const root=mkdtempSync(path.join(os.tmpdir(),'vivim-m1c-'));
  try {
    const bridge=path.join(root,'bridge'); mkdirSync(bridge);
    const id='cmd-1234567890abcdef', request='12345678-1234-4234-8234-123456789012';
    writeFileSync(path.join(bridge,'commands.jsonl'),[
      {id,rev:1,status:'claimed',origin:'relay',consumer:'harness',result:'sent to claude, waiting… (request '+request+')',updatedAt:'2026-10-31T12:00:00Z'},
      {id,rev:2,status:'done',origin:'relay',consumer:'harness',result:'TOP SECRET ANSWER',updatedAt:'2026-10-31T12:00:01Z'}
    ].map(JSON.stringify).join('\n'));
    const s=messageJourney(root);
    assert.equal(s.recent[0].requestId,request);
    assert.doesNotMatch(JSON.stringify(s),/TOP SECRET|sent to claude/);
  } finally {rmSync(root,{recursive:true,force:true});}
});
test('read-only endpoint includes a diagnosis, not an enabled Talk send', async () => {
  const server=createHostServer({dataRoot:path.join(os.tmpdir(),'no-vivim-m1c')});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/host/status');
    assert.equal(response.status,200);
    const snapshot=await response.json();
    assert.equal(typeof snapshot.diagnosis.title,'string');
    assert.equal(snapshot.capabilities.localTalkSend,false);
  } finally {await new Promise(resolve=>server.close(resolve));}
});
test('dark Host UI has diagnosis, message evidence, and no remote scripts', () => {
  const root=new URL('../public/',import.meta.url);
  const html=readFileSync(new URL('index.html',root),'utf8');
  const script=readFileSync(new URL('host.js',root),'utf8');
  for (const id of ['diagnosis','diagnosis-title','diagnosis-detail','diagnosis-action','cards','activity','activity-detail','connection-strip','copy-report','refresh']) assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(script,/document\.createElement/);
  assert.doesNotMatch(html,/<script[^>]+src="https?:/i);
  assert.doesNotMatch(script,/innerHTML\s*=/);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

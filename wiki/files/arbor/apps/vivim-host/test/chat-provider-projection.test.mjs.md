# File: apps/vivim-host/test/chat-provider-projection.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/chat-provider-projection.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1705 B |
| Lines | 29 |
| Hash | 6d18c45bf5a9 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| t | const | 5 | no | const t=Date.parse(&#39;2026-11-13T14:00:00Z&#39;); |
| records | const | 7 | no | const records=[ |
| m | const | 13 | no | const m=projectChatProviders(records,t); |
| m | const | 21 | no | const m=projectChatProviders([ {id:&#39;chatgpt&#39;,label:&#39;ChatGPT&#39;,signedIn:true,check:{verified:false,state:&#39;ready&#39;,observedAt:new Date(t).toISOString()}}, {id:&#39;claude&#39;,label:&#39;Claude&#39;,check:{verified:true… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../chat/provider-projection.mjs | import | 3 | [apps/vivim-host/chat/provider-projection.mjs](../chat/provider-projection.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {projectChatProviders,CHAT_PROVIDER_SCHEMA} from '../chat/provider-projection.mjs';

const t=Date.parse('2026-11-13T14:00:00Z');
test('Host exposes only recent explicitly verified Studio owner sign-ins',()=>{
 const records=[
 {id:'chatgpt',label:'ChatGPT',check:{verified:true,state:'ready',observedAt:new Date(t-1000).toISOString()}},
 {id:'claude',label:'Claude',check:{verified:true,state:'ready',observedAt:new Date(t-46000).toISOString()}},
 {id:'qwen',label:'Qwen',check:{verified:false,state:'ready',observedAt:new Date(t-100).toISOString()}},
 {id:'zai',label:'Z.ai',check:null}
 ];
 const m=projectChatProviders(records,t);
 assert.equal(m.schema,CHAT_PROVIDER_SCHEMA);
 assert.deepEqual(m.providers.map(p=>p.signedIn),[true,false,false,false]);
 assert.equal(m.providers[0].models.length,0);
 assert.equal(m.providers[0].attachments,false);
 assert.equal(m.verification,'explicit-Studio-owner-check');
});
test('malformed or non-source fields cannot forge signed-in provider state',()=>{
 const m=projectChatProviders([
 {id:'chatgpt',label:'ChatGPT',signedIn:true,check:{verified:false,state:'ready',observedAt:new Date(t).toISOString()}},
 {id:'claude',label:'Claude',check:{verified:true,state:'signed_in',observedAt:new Date(t).toISOString()}},
 {id:'chatgpt',label:'duplicate',check:{verified:true,state:'ready',observedAt:new Date(t).toISOString()}},
 {id:'BAD ID',check:{verified:true,state:'ready',observedAt:new Date(t).toISOString()}}
 ],t);
 assert.deepEqual(m.providers.map(p=>p.id),['chatgpt','claude']);
 assert.deepEqual(m.providers.map(p=>p.signedIn),[false,false]);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

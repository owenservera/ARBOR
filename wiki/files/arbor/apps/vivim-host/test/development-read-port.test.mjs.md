# File: apps/vivim-host/test/development-read-port.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/development-read-port.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2638 B |
| Lines | 28 |
| Hash | 090bf4e64fa7 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| live | variable | 6 | no | let live=true,registered=[],indexed=0;const root=path.resolve(&#39;approved-repo&#39;); |
| port | const | 7 | no | const port=createDevelopmentReadPort({config:{approvedRoots:[root]},sessionId:&#39;local&#39;,stillOwner:()=&gt;live, createSurface:async opts=&gt;({status:()=&gt;({sources:[],index:{}}),register:({name,path})=&gt;{ ass… |
| status | const | 11 | no | const status=await port.status();assert.equal(status.approvedRoots.length,1); |
| port | const | 18 | no | const port=createDevelopmentReadPort({sessionId:&#39;local&#39;,stillOwner:()=&gt;true}); |
| valid | variable | 22 | no | let valid=true,calls=0;const store={status:()=&gt;({granted:true,id:&#39;grant-one&#39;,repoIdentities:[&#39;owner/repo&#39;]}),verify:()=&gt;valid?{ok:true,grant:{id:&#39;grant-one&#39;}}:{ok:false}}; |
| adapter | const | 23 | no | const adapter={authorizedDevelopmentSource:true,resolveRef(){},readCommit(){},listTree(){},readBlob(){}}; |
| port | const | 24 | no | const port=createDevelopmentReadPort({config:{hviRepositories:[&#39;owner/repo&#39;],hviAdapter:adapter},runtime:{ledger:{}},sessionId:&#39;local&#39;,stillOwner:()=&gt;true, createGrantStore:()=&gt;store,createHviPort:op… |
| selection | const | 26 | no | const selection={schema:&#39;vivim.host.hvi-source-request/1&#39;,sources:[{repo:&#39;owner/repo&#39;,sha:&#39;a&#39;.repeat(40)},{repo:&#39;owner/repo&#39;,sha:&#39;b&#39;.repeat(40)}],targetIndex:1}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:path | import | 3 | external |
| ../control/development-read-port.mjs | import | 4 | [apps/vivim-host/control/development-read-port.mjs](../control/development-read-port.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createDevelopmentReadPort} from '../control/development-read-port.mjs';
test('register only explicitly approved root, index never implicit, live owner required',async()=>{
 let live=true,registered=[],indexed=0;const root=path.resolve('approved-repo');
 const port=createDevelopmentReadPort({config:{approvedRoots:[root]},sessionId:'local',stillOwner:()=>live,
  createSurface:async opts=>({status:()=>({sources:[],index:{}}),register:({name,path})=>{
   assert.equal(opts.authorize({actorId:'desktop-owner',sessionId:'local',domain:'development',operation:'source.register'}),true);
   registered.push(path);return {name,sourceId:'dev-source:example'};},refresh:()=>{indexed++;return {status:'indexed'}}})});
 const status=await port.status();assert.equal(status.approvedRoots.length,1);
 await assert.rejects(port.register({name:'bad',rootKey:'wrong'}),{code:'HQ_SOURCE_NOT_APPROVED'});
 assert.equal((await port.register({name:'arbor',rootKey:status.approvedRoots[0].key})).indexed,false);
 assert.deepEqual(registered,[root]);assert.equal(indexed,0);await port.refresh({});assert.equal(indexed,1);
 live=false;await assert.rejects(port.status(),{code:'OWNER_AUTH'});
});
test('missing source adapter cannot fall back or compare',async()=>{
 const port=createDevelopmentReadPort({sessionId:'local',stillOwner:()=>true});
 await assert.rejects(port.compare('{}'),{code:'HVI_SOURCE_ADAPTER_UNAVAILABLE'});
});
test('compare pins live grant and refuses revocation before report',async()=>{
 let valid=true,calls=0;const store={status:()=>({granted:true,id:'grant-one',repoIdentities:['owner/repo']}),verify:()=>valid?{ok:true,grant:{id:'grant-one'}}:{ok:false}};
 const adapter={authorizedDevelopmentSource:true,resolveRef(){},readCommit(){},listTree(){},readBlob(){}};
 const port=createDevelopmentReadPort({config:{hviRepositories:['owner/repo'],hviAdapter:adapter},runtime:{ledger:{}},sessionId:'local',stillOwner:()=>true,
  createGrantStore:()=>store,createHviPort:opts=>({invoke:async input=>{calls++;assert.equal(input.sources[0].sourceGrantRef,'grant-one');assert.equal(opts.verifyGrant({repoIdentity:'owner/repo',sourceGrantRef:'grant-one'}),true);valid=false;return {outcome:'SOURCE_ANALYSIS_ONLY'};}})});
 const selection={schema:'vivim.host.hvi-source-request/1',sources:[{repo:'owner/repo',sha:'a'.repeat(40)},{repo:'owner/repo',sha:'b'.repeat(40)}],targetIndex:1};
 await assert.rejects(port.compare(JSON.stringify(selection)),{code:'HVI_SOURCE_GRANT_STALE'});assert.equal(calls,1);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

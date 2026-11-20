# File: apps/vivim-host/control/development-read-port.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/development-read-port.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6522 B |
| Lines | 83 |
| Hash | c99df7341b67 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fail | function | 9 | no | const fail=(code,status=400)=&gt;{throw Object.assign(Error(code),{code,status})}; |
| plain | function | 10 | no | const plain=v=&gt;v&amp;&amp;typeof v===&#39;object&#39;&amp;&amp;!Array.isArray(v)&amp;&amp;Object.getPrototypeOf(v)===Object.prototype; |
| keys | function | 11 | no | const keys=(v,allowed)=&gt;plain(v)&amp;&amp;Object.keys(v).every(k=&gt;allowed.includes(k)); |
| hash | function | 12 | no | const hash=s=&gt;createHash(&#39;sha256&#39;).update(s,&#39;utf8&#39;).digest(&#39;hex&#39;); |
| unavailable | function | 13 | no | const unavailable=code=&gt;({state:&#39;unavailable&#39;,code}); |
| createDevelopmentReadPort | function | 14 | yes | export function createDevelopmentReadPort({config={},runtime,actorId=&#39;desktop-owner&#39;,sessionId,stillOwner, createSurface=createLiveSourceSurface,createGrantStore=createHviSourceGrantStore,createHviPo… |
| authorize | function | 17 | no | const authorize=()=&gt;{if(stillOwner()!==true)fail(&#39;OWNER_AUTH&#39;,401);}; |
| roots | const | 18 | no | const roots=Array.isArray(config.approvedRoots)?config.approvedRoots.filter(r=&gt;typeof r===&#39;string&#39;&amp;&amp;isAbsolute(r)):[]; |
| rootChoices | const | 19 | no | const rootChoices=[...new Set(roots)].map(path=&gt;({key:hash(path),path})); |
| repos | const | 20 | no | const repos=[...new Set((Array.isArray(config.hviRepositories)?config.hviRepositories:[]).map(r=&gt;canonicalRepo(r)))]; |
| adapter | const | 21 | no | const adapter=config.hviAdapter; |
| hviReady | const | 22 | no | const hviReady=adapter?.authorizedDevelopmentSource===true&amp;&amp;[&#39;resolveRef&#39;,&#39;readCommit&#39;,&#39;listTree&#39;,&#39;readBlob&#39;].every(k=&gt;typeof adapter[k]===&#39;function&#39;)&amp;&amp;repos.length&gt;0; |
| grants | function | 23 | no | const grants=()=&gt;runtime?.ledger?createGrantStore({ledger:runtime.ledger}):null; |
| surface | function | 24 | no | async function surface(operation){ |
| port | const | 26 | no | const port=await createSurface({approvedRoots:roots,dataDir:config.dataDir,actorId,sessionId, authorize:q=&gt;q.actorId===actorId&amp;&amp;q.sessionId===sessionId&amp;&amp;q.domain===&#39;development&#39;&amp;&amp; [&#39;source.read&#39;,&#39;sou… |
| status | function | 31 | no | async function status(){ |
| grant | const | 34 | no | const grant=grants()?.status()??unavailable(&#39;HVI_LEDGER_UNAVAILABLE&#39;);authorize(); |
| register | function | 38 | no | async function register(input){ |
| root | const | 40 | no | const root=rootChoices.find(r=&gt;r.key===input.rootKey);if(!root)fail(&#39;HQ_SOURCE_NOT_APPROVED&#39;,403); |
| p | const | 41 | no | const p=await surface(&#39;register&#39;);authorize();const record=await p.register({name:input.name,path:root.path});authorize(); |
| refresh | function | 44 | no | async function refresh(input){ |
| issueGrant | function | 47 | no | function issueGrant(input){ |
| requested | const | 49 | no | const requested=input.repoIdentities.map(r=&gt;canonicalRepo(r)); |
| store | const | 51 | no | const store=grants();if(!store)fail(&#39;HVI_LEDGER_UNAVAILABLE&#39;,503); |
| revokeGrant | function | 54 | no | function revokeGrant(input){ |
| compare | function | 57 | no | async function compare(selection){ |
| input | variable | 61 | no | let input;try{input=JSON.parse(selection)}catch{fail(&#39;HVI_SELECTION_INVALID&#39;)} |
| store | const | 64 | no | const store=grants();const grant=store?.status(); |
| sources | const | 68 | no | const sources=input.sources.map(s=&gt;{ if(!keys(s,[&#39;repo&#39;,&#39;ref&#39;,&#39;sha&#39;,&#39;subPath&#39;])\|\|typeof s.repo!==&#39;string&#39;)fail(&#39;HVI_SELECTION_INVALID&#39;); const repo=canonicalRepo(s.repo);if(!repos.includes(repo)\|\|!gr… |
| repo | const | 70 | no | const repo=canonicalRepo(s.repo);if(!repos.includes(repo)\|\|!grant.repoIdentities.includes(repo))fail(&#39;HVI_SOURCE_NOT_GRANTED&#39;,403); |
| verifyGrant | function | 73 | no | const verifyGrant=ctx=&gt;{if(stillOwner()!==true\|\|ctx.sourceGrantRef!==grant.id)return false; |
| v | const | 74 | no | const v=store.verify({repoIdentity:ctx.repoIdentity});return v.ok===true&amp;&amp;v.grant.id===grant.id;}; |
| port | const | 75 | no | const port=createHviPort({actorId,sessionId,verifySession:()=&gt;stillOwner()===true,verifyGrant, approvedRepositories:repos,enabled:true}); |
| result | const | 77 | no | const result=await port.invoke({...input,sources},{adapter}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 3 | external |
| node:path | import | 4 | external |
| ./live-source-surface.mjs | import | 5 | [apps/vivim-host/control/live-source-surface.mjs](./live-source-surface.mjs.md) |
| ./hvi-capability.mjs | import | 6 | [apps/vivim-host/control/hvi-capability.mjs](./hvi-capability.mjs.md) |
| ./hvi-source-grant.mjs | import | 7 | [apps/vivim-host/control/hvi-source-grant.mjs](./hvi-source-grant.mjs.md) |
| ../../../hq/version-intelligence/sources/common.mjs | import | 8 | [hq/version-intelligence/sources/common.mjs](../../../hq/version-intelligence/sources/common.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./control/development-read-port.mjs |
| [apps/vivim-host/test/development-read-port.test.mjs](../test/development-read-port.test.mjs.md) | ../control/development-read-port.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Request-scoped desktop owner boundary over the existing HQ and HVI engines.
// No Git executable, network client, implicit source grant or additional project registry.
import {createHash} from 'node:crypto';
import {isAbsolute} from 'node:path';
import {createLiveSourceSurface} from './live-source-surface.mjs';
import {createHviHostReadPort} from './hvi-capability.mjs';
import {createHviSourceGrantStore} from './hvi-source-grant.mjs';
import {canonicalRepo} from '../../../hq/version-intelligence/sources/common.mjs';
const fail=(code,status=400)=>{throw Object.assign(Error(code),{code,status})};
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const keys=(v,allowed)=>plain(v)&&Object.keys(v).every(k=>allowed.includes(k));
const hash=s=>createHash('sha256').update(s,'utf8').digest('hex');
const unavailable=code=>({state:'unavailable',code});
export function createDevelopmentReadPort({config={},runtime,actorId='desktop-owner',sessionId,stillOwner,
  createSurface=createLiveSourceSurface,createGrantStore=createHviSourceGrantStore,createHviPort=createHviHostReadPort}={}){
  if(typeof stillOwner!=='function'||typeof sessionId!=='string'||!sessionId||actorId!=='desktop-owner')fail('OWNER_AUTH',401);
  const authorize=()=>{if(stillOwner()!==true)fail('OWNER_AUTH',401);};
  const roots=Array.isArray(config.approvedRoots)?config.approvedRoots.filter(r=>typeof r==='string'&&isAbsolute(r)):[];
  const rootChoices=[...new Set(roots)].map(path=>({key:hash(path),path}));
  const repos=[...new Set((Array.isArray(config.hviRepositories)?config.hviRepositories:[]).map(r=>canonicalRepo(r)))];
  const adapter=config.hviAdapter;
  const hviReady=adapter?.authorizedDevelopmentSource===true&&['resolveRef','readCommit','listTree','readBlob'].every(k=>typeof adapter[k]==='function')&&repos.length>0;
  const grants=()=>runtime?.ledger?createGrantStore({ledger:runtime.ledger}):null;
  async function surface(operation){
    authorize();if(!roots.length)fail('HQ_SOURCE_ROOTS_NOT_CONFIGURED',503);
    const port=await createSurface({approvedRoots:roots,dataDir:config.dataDir,actorId,sessionId,
      authorize:q=>q.actorId===actorId&&q.sessionId===sessionId&&q.domain==='development'&&
        ['source.read','source.status',...(operation==='register'?['source.register']:operation==='index'?['source.index']:[])].includes(q.operation)&&stillOwner()===true});
    authorize();return port;
  }
  async function status(){
    authorize();let hq=unavailable('HQ_SOURCE_ROOTS_NOT_CONFIGURED');
    if(roots.length){try{hq={state:'source-backed',...await (await surface('status')).status()};}catch(e){if(e?.code==='OWNER_AUTH')throw e;hq=unavailable('HQ_STATUS_UNAVAILABLE');}}
    const grant=grants()?.status()??unavailable('HVI_LEDGER_UNAVAILABLE');authorize();
    return {schema:'vivim.development-read-port/1',hq,approvedRoots:rootChoices,
      hvi:{adapterReady:hviReady,approvedRepositories:repos,grant,executionPerformed:false}};
  }
  async function register(input){
    authorize();if(!keys(input,['name','rootKey'])||typeof input.name!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(input.name)||typeof input.rootKey!=='string')fail('HQ_REGISTER_INVALID');
    const root=rootChoices.find(r=>r.key===input.rootKey);if(!root)fail('HQ_SOURCE_NOT_APPROVED',403);
    const p=await surface('register');authorize();const record=await p.register({name:input.name,path:root.path});authorize();
    return {schema:'vivim.development-registration/1',state:'registered',name:record.name,sourceId:record.sourceId,indexed:false};
  }
  async function refresh(input){
    if(!keys(input,[]))fail('HQ_INDEX_INVALID');const p=await surface('index');authorize();const out=await p.refresh();authorize();return out;
  }
  function issueGrant(input){
    authorize();if(!keys(input,['repoIdentities','expiresInMs'])||!Array.isArray(input.repoIdentities)||!input.repoIdentities.length||input.repoIdentities.length>16)fail('HVI_GRANT_INVALID');
    const requested=input.repoIdentities.map(r=>canonicalRepo(r));
    if(requested.some(r=>!repos.includes(r)))fail('HVI_SOURCE_NOT_CONFIGURED',403);
    const store=grants();if(!store)fail('HVI_LEDGER_UNAVAILABLE',503);
    return store.issue({actorId,repoIdentities:requested,expiresInMs:input.expiresInMs});
  }
  function revokeGrant(input){
    authorize();if(!keys(input,[]))fail('HVI_GRANT_INVALID');const store=grants();if(!store)fail('HVI_LEDGER_UNAVAILABLE',503);return store.revoke({actorId});
  }
  async function compare(selection){
    authorize();
    if(!hviReady)fail('HVI_SOURCE_ADAPTER_UNAVAILABLE',503);
    if(typeof selection!=='string'||Buffer.byteLength(selection,'utf8')>8000)fail('HVI_SELECTION_INVALID');
    let input;try{input=JSON.parse(selection)}catch{fail('HVI_SELECTION_INVALID')}
    if(!keys(input,['schema','sources','targetIndex','scope','budgets','pairwise','includeParity','reportOptions'])||
      input.schema!=='vivim.host.hvi-source-request/1'||!Array.isArray(input.sources)||input.sources.length<2||input.sources.length>16)fail('HVI_SELECTION_INVALID');
    const store=grants();const grant=store?.status();
    if(!grant?.granted||grant.expired||grant.revoked||!grant.id)fail('HVI_SOURCE_GRANT_REQUIRED',403);
    // Never accept a caller-selected grant. Every read is pinned to the exact live grant
    // identified at admission, including final projection and owner session rechecks.
    const sources=input.sources.map(s=>{
      if(!keys(s,['repo','ref','sha','subPath'])||typeof s.repo!=='string')fail('HVI_SELECTION_INVALID');
      const repo=canonicalRepo(s.repo);if(!repos.includes(repo)||!grant.repoIdentities.includes(repo))fail('HVI_SOURCE_NOT_GRANTED',403);
      return {...s,repo,sourceGrantRef:grant.id};
    });
    const verifyGrant=ctx=>{if(stillOwner()!==true||ctx.sourceGrantRef!==grant.id)return false;
      const v=store.verify({repoIdentity:ctx.repoIdentity});return v.ok===true&&v.grant.id===grant.id;};
    const port=createHviPort({actorId,sessionId,verifySession:()=>stillOwner()===true,verifyGrant,
      approvedRepositories:repos,enabled:true});
    const result=await port.invoke({...input,sources},{adapter});
    authorize();
    if(sources.some(s=>!verifyGrant({sourceGrantRef:grant.id,repoIdentity:s.repo})))fail('HVI_SOURCE_GRANT_STALE',403);
    return result;
```

_First 80 of 84 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

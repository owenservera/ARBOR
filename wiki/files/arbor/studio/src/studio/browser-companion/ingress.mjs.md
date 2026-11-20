# File: studio/src/studio/browser-companion/ingress.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/browser-companion/ingress.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9282 B |
| Lines | 119 |
| Hash | 89be2714e250 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| EXT | const | 6 | no | const EXT = /^[a-p]{32}$/; |
| UUID | const | 7 | no | const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; |
| PROVIDERS | const | 8 | no | const PROVIDERS = new Set([&#39;chatgpt&#39;,&#39;claude&#39;,&#39;gemini&#39;,&#39;qwen&#39;,&#39;zai&#39;,&#39;deepseek&#39;,&#39;grok&#39;,&#39;kimi&#39;]); |
| TYPES | const | 9 | no | const TYPES = new Set([&#39;tab.created&#39;,&#39;tab.updated&#39;,&#39;tab.removed&#39;,&#39;tab.activated&#39;,&#39;tab.replaced&#39;,&#39;snapshot&#39;,&#39;visit.observed&#39;]); |
| credFile | function | 10 | no | const credFile = root =&gt; path.join(root,&#39;browser-companion&#39;,&#39;credential.json&#39;); |
| stateFile | function | 11 | no | const stateFile = root =&gt; path.join(root,&#39;browser-companion&#39;,&#39;state.json&#39;); |
| atomic | function | 12 | no | function atomic(file,value){mkdirSync(path.dirname(file),{recursive:true,mode:0o700});const temp=file+&#39;.&#39;+process.pid+&#39;.&#39;+randomBytes(4).toString(&#39;hex&#39;)+&#39;.tmp&#39;;writeFileSync(temp,JSON.stringify(value… |
| read | function | 13 | no | function read(file){try{return JSON.parse(readFileSync(file,&#39;utf8&#39;))}catch{return null}} |
| pairCompanion | function | 14 | yes | export function pairCompanion(root,extensionId){if(!EXT.test(extensionId))throw Error(&#39;Extension ID must be 32 lowercase a-p characters&#39;);const token=randomBytes(32).toString(&#39;hex&#39;);atomic(credFile(r… |
| revokeCompanion | function | 15 | yes | export function revokeCompanion(root){const c=read(credFile(root));if(c)atomic(credFile(root),{extensionId:c.extensionId,token:randomBytes(32).toString(&#39;hex&#39;)});return !!c;} |
| companionState | function | 16 | yes | export function companionState(root){const s=read(stateFile(root));return s?{...s,connected:Date.now()-Date.parse(s.lastSeen)&lt;150000,verified:false,source:&#39;extension_observation&#39;}:{connected:false,ve… |
| fail | function | 17 | no | function fail(code){return{status:code,body:{error:code===401?&#39;unauthorized&#39;:code===503?&#39;web_memory_core_unavailable&#39;:&#39;invalid companion observation&#39;}}} |
| only | function | 18 | no | function only(o,keys){return o&amp;&amp;typeof o===&#39;object&#39;&amp;&amp;!Array.isArray(o)&amp;&amp;Object.keys(o).every(k=&gt;keys.includes(k))} |
| canonical | function | 19 | no | function canonical(value){return Array.isArray(value)?value.map(canonical):value&amp;&amp;typeof value===&#39;object&#39;?Object.fromEntries(Object.keys(value).sort().map(k=&gt;[k,canonical(value[k])])):value} |
| digest | function | 20 | no | function digest(value){return createHash(&#39;sha256&#39;).update(JSON.stringify(canonical(value))).digest(&#39;hex&#39;)} |
| companionIngress | function | 21 | yes | export function companionIngress({root,publish=()=&gt;{},ingestVisits=async()=&gt;{throw Error(&#39;WEB_MEMORY_CORE_NOT_CONFIGURED&#39;)},now=()=&gt;Date.now()}){ |
| c | const | 23 | no | const c=read(credFile(root));const host=req.headers.host; |
| ip | const | 24 | no | const ip=req.socket?.remoteAddress; |
| origin | const | 26 | no | const origin=&#39;chrome-extension://&#39;+c.extensionId; |
| headers | const | 28 | no | const headers={&#39;access-control-allow-origin&#39;:origin,&#39;vary&#39;:&#39;Origin&#39;,&#39;cache-control&#39;:&#39;no-store&#39;,&#39;x-content-type-options&#39;:&#39;nosniff&#39;}; |
| given | const | 34 | no | const given=String(req.headers.authorization\|\|&#39;&#39;).replace(/^Bearer /,&#39;&#39;); |
| actual | const | 35 | no | const actual=Buffer.from(given),expected=Buffer.from(c.token); |
| clean | const | 39 | no | const clean=[]; |
| p | const | 43 | no | const p=e.page; |
| normalized | const | 49 | no | const normalized=pageFor(p.url,p.browserTabId); |
| tabs | const | 54 | no | const tabs=e.type===&#39;snapshot&#39;?e.tabs:[e.tab]; |
| previous | const | 61 | no | const previous=read(stateFile(root)); |
| same | const | 62 | no | const same=previous?.installationId===body.installationId&amp;&amp;previous?.sessionId===body.sessionId; |
| ids | const | 63 | no | const ids=same?(previous.ids\|\|[]):[]; |
| priorDigests | const | 64 | no | const priorDigests=same?(previous.digests\|\|{}):{}; |
| known | const | 65 | no | const known=new Set(ids),digests={...priorDigests},accepted=[]; |
| hash | const | 67 | no | const hash=digest(e); |
| visits | const | 73 | no | const visits=clean.filter(e=&gt;e.type===&#39;visit.observed&#39;); |
| result | variable | 74 | no | let result; |
| freshVisits | const | 86 | no | const freshVisits=visits.filter(e=&gt;!known.has(e.id)); |
| inserted | const | 88 | no | const inserted=Number.isSafeInteger(result?.inserted)&amp;&amp;result.inserted&gt;=0 |
| providers | variable | 90 | no | let providers=same?(previous.providers\|\|[]):[]; |
| notifications | const | 91 | no | const notifications=[]; |
| counts | const | 97 | no | const counts={};for(const t of e.tabs)counts[t.provider]=(counts[t.provider]\|\|0)+1; |
| recent | const | 108 | no | const recent=[...known].slice(-512),recentSet=new Set(recent); |
| recentDigests | const | 109 | no | const recentDigests=Object.fromEntries(Object.entries(digests).filter(([id])=&gt;recentSet.has(id))); |
| lastSeen | const | 110 | no | const lastSeen=new Date(now()).toISOString(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 2 | external |
| ../../../../apps/browser-companion/protocol.mjs | import | 3 | external |
| node:fs | import | 4 | external |
| node:path | import | 5 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/companion.mjs](../../../bin/commands/companion.mjs.md) | ../../src/studio/browser-companion/ingress.mjs |
| [studio/src/studio/server.mjs](../server.mjs.md) | ./browser-companion/ingress.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Observation-only Browser Companion credential and bounded ingress. No CDP, no browser actions.
import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { pageFor } from '../../../../apps/browser-companion/protocol.mjs';
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import path from 'node:path';
const EXT = /^[a-p]{32}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROVIDERS = new Set(['chatgpt','claude','gemini','qwen','zai','deepseek','grok','kimi']);
const TYPES = new Set(['tab.created','tab.updated','tab.removed','tab.activated','tab.replaced','snapshot','visit.observed']);
const credFile = root => path.join(root,'browser-companion','credential.json');
const stateFile = root => path.join(root,'browser-companion','state.json');
function atomic(file,value){mkdirSync(path.dirname(file),{recursive:true,mode:0o700});const temp=file+'.'+process.pid+'.'+randomBytes(4).toString('hex')+'.tmp';writeFileSync(temp,JSON.stringify(value),{mode:0o600});renameSync(temp,file);}
function read(file){try{return JSON.parse(readFileSync(file,'utf8'))}catch{return null}}
export function pairCompanion(root,extensionId){if(!EXT.test(extensionId))throw Error('Extension ID must be 32 lowercase a-p characters');const token=randomBytes(32).toString('hex');atomic(credFile(root),{extensionId,token});return {extensionId,token};}
export function revokeCompanion(root){const c=read(credFile(root));if(c)atomic(credFile(root),{extensionId:c.extensionId,token:randomBytes(32).toString('hex')});return !!c;}
export function companionState(root){const s=read(stateFile(root));return s?{...s,connected:Date.now()-Date.parse(s.lastSeen)<150000,verified:false,source:'extension_observation'}:{connected:false,verified:false,source:'extension_observation',providers:[],lastSeen:null};}
function fail(code){return{status:code,body:{error:code===401?'unauthorized':code===503?'web_memory_core_unavailable':'invalid companion observation'}}}
function only(o,keys){return o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>keys.includes(k))}
function canonical(value){return Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value}
function digest(value){return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex')}
export function companionIngress({root,publish=()=>{},ingestVisits=async()=>{throw Error('WEB_MEMORY_CORE_NOT_CONFIGURED')},now=()=>Date.now()}){
 return async(req,{port,body})=>{
 const c=read(credFile(root));const host=req.headers.host;
 const ip=req.socket?.remoteAddress;
 if(!c||!EXT.test(c.extensionId)||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(ip)|| ![`127.0.0.1:${port}`,`localhost:${port}`].includes(host))return fail(403);
 const origin='chrome-extension://'+c.extensionId;
 if(req.headers.origin!==origin)return fail(403);
 const headers={'access-control-allow-origin':origin,'vary':'Origin','cache-control':'no-store','x-content-type-options':'nosniff'};
 if(req.method==='OPTIONS'){
  if(req.headers['access-control-request-method']!=='POST'||!String(req.headers['access-control-request-headers']||'').toLowerCase().split(',').map(x=>x.trim()).every(x=>['authorization','content-type'].includes(x)))return fail(403);
  return{status:204,headers:{...headers,'access-control-allow-methods':'POST','access-control-allow-headers':'authorization, content-type'},body:null};
 }
 if(req.method!=='POST')return fail(405);
 const given=String(req.headers.authorization||'').replace(/^Bearer /,'');
 const actual=Buffer.from(given),expected=Buffer.from(c.token);
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return fail(401);
 if(!String(req.headers['content-type']||'').startsWith('application/json')||!body||Buffer.byteLength(JSON.stringify(body))>65536)return fail(400);
 if(!only(body,['schema','installationId','sessionId','events'])||body.schema!=='vivim.browser-companion/1'||!UUID.test(body.installationId)||!UUID.test(body.sessionId)||!Array.isArray(body.events)||body.events.length<1||body.events.length>32)return fail(400);
 const clean=[];
 for(const e of body.events){
  if(!only(e,['id','type','at','tab','tabs','page'])||!UUID.test(e.id)||!TYPES.has(e.type)||typeof e.at!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(e.at)||!Number.isFinite(Date.parse(e.at))||Math.abs(now()-Date.parse(e.at))>86400000)return fail(400);
  if(e.type==='visit.observed'){
    const p=e.page;
    if(!only(p,['browserTabId','site','url'])||!Number.isSafeInteger(p?.browserTabId)||p.browserTabId<0 ||
       typeof p?.site!=='string'||!(/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(p.site))||p.site.length>253||
       typeof p?.url!=='string'||p.url.length>1024 || e.tab!==undefined || e.tabs!==undefined)return fail(400);
    // Validate with the exact extension sanitizer: no encoded/secret path, port, query,
    // fragment, credentials, local IP, private route or site/URL mismatch.
    const normalized=pageFor(p.url,p.browserTabId);
    if(!normalized||normalized.site!==p.site||normalized.url!==p.url)return fail(400);
    clean.push(e);continue;
  }
  if(e.page!==undefined)return fail(400);
  const tabs=e.type==='snapshot'?e.tabs:[e.tab];
  if(!Array.isArray(tabs)||tabs.length>(e.type==='snapshot'?100:1)|| (e.type==='snapshot'&&e.tab!==undefined)||(e.type!=='snapshot'&&e.tabs!==undefined))return fail(400);
  for(const t of tabs)if(!only(t,['browserTabId','windowId','provider','active','loading'])||!Number.isInteger(t.browserTabId)||t.browserTabId<0||!Number.isInteger(t.windowId)||!PROVIDERS.has(t.provider)||typeof t.active!=='boolean'||typeof t.loading!=='boolean')return fail(400);
  clean.push(e);
 }
 // Reject intra-batch duplicate IDs even if the client supplied identical payloads.
 if(new Set(clean.map(e=>e.id)).size!==clean.length)return fail(400);
 const previous=read(stateFile(root));
 const same=previous?.installationId===body.installationId&&previous?.sessionId===body.sessionId;
 const ids=same?(previous.ids||[]):[];
 const priorDigests=same?(previous.digests||{}):{};
 const known=new Set(ids),digests={...priorDigests},accepted=[];
 for(const e of clean){
   const hash=digest(e);
   if(digests[e.id]&&digests[e.id]!==hash)return fail(409);
   digests[e.id]=hash;
 }
 // Always send visit replays through Rust, even if Studio has seen the ID before.
 // Only Rust's durable node can authenticate a same-ID visit or reject a conflict.
 const visits=clean.filter(e=>e.type==='visit.observed');
 let result;
 if(visits.length){
   try{result=await ingestVisits({schema:'vivim.browser-companion/1',
     installationId:body.installationId,sessionId:body.sessionId,events:visits});}
   catch{return fail(503);}
 }
 // The production bridge returns exact Rust accepted/inserted counts.
```

_First 80 of 120 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

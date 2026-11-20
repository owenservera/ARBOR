# File: apps/vivim-host/bootstrap/readiness-gate.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/bootstrap/readiness-gate.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6037 B |
| Lines | 93 |
| Hash | 7e6621f2b605 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| READINESS_GATE_SCHEMA | const | 4 | yes | export const READINESS_GATE_SCHEMA=&#39;vivim.provider-readiness/1&#39;; |
| PROVIDER_STATES | const | 5 | yes | export const PROVIDER_STATES=Object.freeze([&#39;signed_in&#39;,&#39;signed_out&#39;,&#39;auth_wall&#39;,&#39;captcha&#39;,&#39;usage_limited&#39;,&#39;rate_limited&#39;,&#39;unreachable&#39;,&#39;unknown&#39;]); |
| ID | const | 6 | no | const ID=/^[a-z][a-z0-9_-]{1,31}$/; |
| MODEL_ID | const | 7 | no | const MODEL_ID=/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/; |
| MAX_MODELS | const | 8 | no | const MAX_MODELS=80,MAX_EFFORTS=12; |
| fail | function | 9 | no | const fail=(code,reason=code)=&gt;Object.assign(new Error(reason),{code}); |
| duplicateSafe | function | 10 | no | const duplicateSafe = arr =&gt; [...new Set(arr)]; |
| cloned | function | 11 | no | const cloned=x=&gt;structuredClone(x); |
| normalizedModels | function | 12 | no | function normalizedModels(value){ |
| list | const | 14 | no | const list=[]; |
| efforts | const | 18 | no | const efforts=Array.isArray(row.efforts)?duplicateSafe(row.efforts.filter(x=&gt;typeof x===&#39;string&#39;&amp;&amp;MODEL_ID.test(x)).slice(0,MAX_EFFORTS)):[]; |
| createReadinessGate | function | 24 | yes | export function createReadinessGate({probe,owner,now=Date.now,ttlMs=60000,providerIds=[&#39;chatgpt&#39;,&#39;claude&#39;,&#39;qwen&#39;,&#39;zai&#39;]}={}){ |
| allowed | const | 28 | no | const allowed=duplicateSafe(providerIds).sort(); |
| cache | const | 29 | no | const cache=new Map(),inflight=new Map(); |
| fresh | function | 30 | no | const fresh=r=&gt;Number.isFinite(Date.parse(r?.observedAt))&amp;&amp;Math.abs(now()-Date.parse(r.observedAt))&lt;=ttlMs; |
| unknown | function | 31 | no | function unknown(provider,reason=&#39;not_verified&#39;){ |
| normalize | function | 35 | no | function normalize(provider,result,ownerOk){ |
| state | const | 37 | no | const state=PROVIDER_STATES.includes(result.state)?result.state:&#39;unknown&#39;; |
| timestamp | const | 38 | no | const timestamp=result.observedAt; |
| observedAt | const | 40 | no | const observedAt=new Date(Date.parse(timestamp)).toISOString(); |
| signals | const | 42 | no | const signals=result.signals; |
| signedIn | const | 43 | no | const signedIn=state===&#39;signed_in&#39;&amp;&amp;ownerOk===true&amp;&amp;result.source===&#39;studio_owner&#39; |
| verified | const | 48 | no | const verified=state===&#39;signed_in&#39;&amp;&amp;signedIn; |
| check | function | 54 | no | async function check(provider,{refresh=false}={}){ |
| cached | const | 56 | no | const cached=cache.get(provider); |
| pending | function | 59 | no | const pending=(async()=&gt;{ let result,ownerOk=false; try {ownerOk=await owner.verify()===true;if(ownerOk)result=await probe(provider,{readOnly:true});} catch{return unknown(provider,&#39;probe_unavailable… |
| result | variable | 60 | no | let result,ownerOk=false; |
| manifest | function | 70 | no | async function manifest({refresh=false}={}){ |
| results | const | 71 | no | const results=await Promise.all(allowed.map(p=&gt;check(p,{refresh}))); |
| usable | const | 72 | no | const usable=results.filter(r=&gt;r.verified&amp;&amp;r.state===&#39;signed_in&#39;); |
| schedulerReadiness | function | 79 | no | const schedulerReadiness=()=&gt;check(&#39;chatgpt&#39;); |
| row | const | 82 | no | const row=cache.get(provider); |
| model | const | 85 | no | const model=row.models.find(m=&gt;m.id===modelId&amp;&amp;m.selectionVerified); |
| invalidate | function | 91 | no | function invalidate(provider=null){if(provider===null)cache.clear();else cache.delete(provider);} |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM B02/H02 — metadata-only conservative readiness aggregator.
// Never sends, starts a browser, selects a model, clears drafts, or treats tab presence as login proof.
// Only authenticated Studio owner read-only probes can establish signed_in.
export const READINESS_GATE_SCHEMA='vivim.provider-readiness/1';
export const PROVIDER_STATES=Object.freeze(['signed_in','signed_out','auth_wall','captcha','usage_limited','rate_limited','unreachable','unknown']);
const ID=/^[a-z][a-z0-9_-]{1,31}$/;
const MODEL_ID=/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/;
const MAX_MODELS=80,MAX_EFFORTS=12;
const fail=(code,reason=code)=>Object.assign(new Error(reason),{code});
const duplicateSafe = arr => [...new Set(arr)];
const cloned=x=>structuredClone(x);
function normalizedModels(value){
  if(!Array.isArray(value))return [];
  const list=[];
  for(const row of value.slice(0,MAX_MODELS)){
    if(!row||typeof row!=='object'||typeof row.id!=='string'||!MODEL_ID.test(row.id))continue;
    if(row.selectionVerified!==true)continue;
    const efforts=Array.isArray(row.efforts)?duplicateSafe(row.efforts.filter(x=>typeof x==='string'&&MODEL_ID.test(x)).slice(0,MAX_EFFORTS)):[];
    list.push({id:row.id,label:typeof row.label==='string'?row.label.slice(0,80):row.id,
      selectionVerified:true,efforts,attachments:row.attachmentsVerified===true});
  }
  return list.sort((a,b)=>a.id.localeCompare(b.id));
}
export function createReadinessGate({probe,owner,now=Date.now,ttlMs=60000,providerIds=['chatgpt','claude','qwen','zai']}={}){
  if(typeof probe!=='function'||typeof owner?.verify!=='function')throw fail('READINESS_DEPENDENCY');
  if(!Number.isInteger(ttlMs)||ttlMs<1000||ttlMs>300000)throw fail('READINESS_TTL_INVALID');
  if(!Array.isArray(providerIds)||providerIds.length<1||providerIds.length>20||providerIds.some(x=>typeof x!=='string'||!ID.test(x)))throw fail('READINESS_PROVIDERS_INVALID');
  const allowed=duplicateSafe(providerIds).sort();
  const cache=new Map(),inflight=new Map();
  const fresh=r=>Number.isFinite(Date.parse(r?.observedAt))&&Math.abs(now()-Date.parse(r.observedAt))<=ttlMs;
  function unknown(provider,reason='not_verified'){
    return {schema:READINESS_GATE_SCHEMA,provider,state:'unknown',verified:false,observedAt:new Date(now()).toISOString(),
      reason,models:[],attachments:false};
  }
  function normalize(provider,result,ownerOk){
    if(!result||typeof result!=='object'||result.provider!==provider)return unknown(provider,'invalid_provenance');
    const state=PROVIDER_STATES.includes(result.state)?result.state:'unknown';
    const timestamp=result.observedAt;
    if(!fresh(result))return unknown(provider,'stale_provenance');
    const observedAt=new Date(Date.parse(timestamp)).toISOString();
    // Strong, narrow evidence from the active Studio owner, not heuristics about loaded HTML.
    const signals=result.signals;
    const signedIn=state==='signed_in'&&ownerOk===true&&result.source==='studio_owner'
      &&result.readOnly===true&&result.verified===true
      &&signals?.accountMarkerPresent===true&&signals?.composerVisible===true
      &&signals?.authWallAbsent===true&&signals?.exactTargetOwned===true;
    if(state==='signed_in'&&!signedIn)return {...unknown(provider,'insufficient_signin_evidence'),observedAt};
    const verified=state==='signed_in'&&signedIn;
    return {schema:READINESS_GATE_SCHEMA,provider,state,verified,observedAt,
      reason:state==='signed_in'?null:String(result.reason||state).slice(0,100),
      models:verified?normalizedModels(result.models):[],
      attachments:verified&&result.attachmentsVerified===true};
  }
  async function check(provider,{refresh=false}={}){
    if(!allowed.includes(provider))throw fail('READINESS_PROVIDER_UNSUPPORTED');
    const cached=cache.get(provider);
    if(!refresh&&cached&&fresh(cached))return cloned(cached);
    if(inflight.has(provider))return cloned(await inflight.get(provider));
    const pending=(async()=>{
      let result,ownerOk=false;
      try {ownerOk=await owner.verify()===true;if(ownerOk)result=await probe(provider,{readOnly:true});}
      catch{return unknown(provider,'probe_unavailable');}
      if(!ownerOk)return unknown(provider,'owner_unverified');
      return normalize(provider,result,ownerOk);
    })();
    inflight.set(provider,pending);
    try {const done=await pending;cache.set(provider,done);return cloned(done);}
    finally {inflight.delete(provider);}
  }
  async function manifest({refresh=false}={}){
    const results=await Promise.all(allowed.map(p=>check(p,{refresh})));
    const usable=results.filter(r=>r.verified&&r.state==='signed_in');
    return {schema:READINESS_GATE_SCHEMA,observedAt:new Date(now()).toISOString(),
      providers:results,signedInProviders:usable.map(r=>r.provider),
      canBootstrap:usable.some(r=>r.provider==='chatgpt'),
      note:'Provider state is read-only point-in-time evidence, not authority to send'};
  }
  // The Round-1 scheduler asks for the ChatGPT-specific row, not the entire manifest.
  const schedulerReadiness=()=>check('chatgpt');
  function select(provider,modelId=null,effort=null){
```

_First 80 of 94 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

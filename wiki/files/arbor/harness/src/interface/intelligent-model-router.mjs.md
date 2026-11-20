# File: harness/src/interface/intelligent-model-router.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/interface/intelligent-model-router.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7977 B |
| Lines | 103 |
| Hash | 357ac49b0bd3 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AUTO_ROUTER_SCHEMA | const | 4 | yes | export const AUTO_ROUTER_SCHEMA=&#39;vivim.auto-model-router/1&#39;; |
| TASKS | const | 5 | no | const TASKS=Object.freeze([&#39;coding&#39;,&#39;visual&#39;,&#39;research&#39;,&#39;documents&#39;,&#39;data&#39;,&#39;reasoning&#39;,&#39;general&#39;]); |
| ID | const | 6 | no | const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/; |
| fail | function | 7 | no | const fail=code=&gt;Object.assign(new Error(code),{code}); |
| finite | function | 8 | no | const finite=(n,lo=0,hi=1)=&gt;typeof n===&#39;number&#39;&amp;&amp;Number.isFinite(n)&amp;&amp;n&gt;=lo&amp;&amp;n&lt;=hi; |
| clamp | function | 9 | no | const clamp=n=&gt;Math.max(0,Math.min(1,n)); |
| age | function | 10 | no | const age=(at,now)=&gt;typeof at===&#39;string&#39;&amp;&amp;Number.isFinite(Date.parse(at))?now-Date.parse(at):Infinity; |
| plain | function | 11 | no | const plain=x=&gt;x&amp;&amp;typeof x===&#39;object&#39;&amp;&amp;!Array.isArray(x); |
| normalizeScores | function | 12 | no | function normalizeScores(row) { |
| c | const | 13 | no | const c=plain(row?.quality) ? row.quality : {}; |
| normalProfiles | function | 16 | no | function normalProfiles(rows) { |
| by | const | 18 | no | const by=new Map(); |
| normalRules | function | 30 | no | function normalRules(rules){ |
| normalLearned | function | 40 | no | function normalLearned(rows) { |
| by | const | 42 | no | const by=new Map(); |
| RANK_WEIGHTS | const | 50 | no | const RANK_WEIGHTS=Object.freeze({quality:0.45,reliability:0.24,latency:0.10,cost:0.11,learned:0.10}); |
| createIntelligentModelRouter | function | 51 | yes | export function createIntelligentModelRouter({profiles=[],ownerRules=[],learned=[],now=Date.now,maxAgeMs=60000}={}){ |
| prof | const | 52 | no | const prof=normalProfiles(profiles), rules=normalRules(ownerRules), learnedMap=normalLearned(learned); |
| route | function | 54 | no | function route({taskClass=&#39;general&#39;,manifest,constraints={}}={}){ |
| allowed | const | 59 | no | const allowed=constraints.allowedProviders??null; |
| list | const | 65 | no | const list=[]; |
| profile | const | 73 | no | const profile=prof.get(`${p.provider}:${m.id}`); |
| l | const | 75 | no | const l=learnedMap.get(`${p.provider}:${m.id}:${taskClass}`); |
| learnedWeight | const | 76 | no | const learnedWeight=l ? l.sampleCount/(l.sampleCount+12):0; |
| experience | const | 77 | no | const experience=l ? 0.5+(l.successRate-0.5)*learnedWeight:0.5; |
| q | const | 78 | no | const q=profile?.quality[taskClass]??0.5, reliability=profile?.reliability??0.5; |
| latency | const | 79 | no | const latency=profile?.latencyMs===null\|\|profile?.latencyMs===undefined?0.5:1/(1+profile.latencyMs/30000); |
| cost | const | 80 | no | const cost=1-(profile?.costTier??0.5); |
| score | const | 81 | no | const score=Math.round(10000*(RANK_WEIGHTS.quality*q+RANK_WEIGHTS.reliability*reliability+ RANK_WEIGHTS.latency*latency+RANK_WEIGHTS.cost*cost+RANK_WEIGHTS.learned*experience))/100; |
| applicable | const | 89 | no | const applicable=rules.filter(r=&gt;r.taskClass===taskClass&amp;&amp; (r.scope!==&#39;project&#39;\|\|r.projectRef===constraints.projectRef)); |
| explicit | const | 91 | no | const explicit=applicable.find(r=&gt;r.scope===&#39;project&#39;)??applicable.find(r=&gt;r.scope!==&#39;project&#39;); |
| matches | const | 92 | no | const matches=explicit?list.filter(x=&gt;x.provider===explicit.provider&amp;&amp;(!explicit.model\|\|x.model===explicit.model)&amp;&amp; (!explicit.effort\|\|manifest.providers.find(p=&gt;p.provider===x.provider)?.models?.fin… |
| ranked | const | 96 | no | const ranked=matches.map(x=&gt;({...x,effort:explicit?.effort??x.effort})).sort((a,b)=&gt;b.score-a.score\|\|a.provider.localeCompare(b.provider)\|\|a.model.localeCompare(b.model)); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [harness/src/interface/router.mjs](./router.mjs.md) | ./intelligent-model-router.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM Q20/Q21/Q22 — pure policy decision. Never drives Chrome, makes a provider API call,
// grants a send, or promotes inferred preferences to explicit owner instructions.
// Availability is ONLY the verified, recent readiness-gate snapshot (Round 2).
export const AUTO_ROUTER_SCHEMA='vivim.auto-model-router/1';
const TASKS=Object.freeze(['coding','visual','research','documents','data','reasoning','general']);
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/;
const fail=code=>Object.assign(new Error(code),{code});
const finite=(n,lo=0,hi=1)=>typeof n==='number'&&Number.isFinite(n)&&n>=lo&&n<=hi;
const clamp=n=>Math.max(0,Math.min(1,n));
const age=(at,now)=>typeof at==='string'&&Number.isFinite(Date.parse(at))?now-Date.parse(at):Infinity;
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
function normalizeScores(row) {
  const c=plain(row?.quality) ? row.quality : {};
  return Object.fromEntries(TASKS.map(t=>[t,finite(c[t])?c[t]:0.5]));
}
function normalProfiles(rows) {
  if(!Array.isArray(rows)||rows.length>400)throw fail('ROUTER_PROFILE_INVALID');
  const by=new Map();
  for(const row of rows){
    if(!plain(row)||!ID.test(row.provider??'')||!ID.test(row.model??'')||by.has(`${row.provider}:${row.model}`))throw fail('ROUTER_PROFILE_INVALID');
    if(row.reliability!==undefined&&!finite(row.reliability) || row.costTier!==undefined&&!finite(row.costTier) ||
      row.latencyMs!==undefined&&(!Number.isFinite(row.latencyMs)||row.latencyMs<0))throw fail('ROUTER_PROFILE_INVALID');
    by.set(`${row.provider}:${row.model}`,{...row,quality:normalizeScores(row),
      reliability:finite(row.reliability)?row.reliability:0.5,
      costTier:finite(row.costTier)?row.costTier:0.5,
      latencyMs:Number.isFinite(row.latencyMs)?row.latencyMs:null});
  }
  return by;
}
function normalRules(rules){
  if(!Array.isArray(rules)||rules.length>100)throw fail('ROUTER_RULE_INVALID');
  return rules.filter(r=>r?.enabled!==false).map((r,i)=>{
    if(!plain(r)|| !TASKS.includes(r.taskClass) || !ID.test(r.provider??'') ||
      r.model!==undefined&&!ID.test(r.model) || r.effort!==undefined&&!ID.test(r.effort) ||
      r.scope!==undefined&&!['owner','project'].includes(r.scope)||
      r.scope==='project'&&(!r.projectRef||typeof r.projectRef!=='string'||r.projectRef.length>160))throw fail('ROUTER_RULE_INVALID');
    return {...r,order:i};
  });
}
function normalLearned(rows) {
  if(!Array.isArray(rows)||rows.length>1000)throw fail('ROUTER_LEARNED_INVALID');
  const by=new Map();
  for(const x of rows){
    if(!plain(x)||!ID.test(x.provider??'')||!ID.test(x.model??'')||!TASKS.includes(x.taskClass)||
      !Number.isInteger(x.sampleCount)||x.sampleCount<0||x.sampleCount>1000000||!finite(x.successRate)) throw fail('ROUTER_LEARNED_INVALID');
    by.set(`${x.provider}:${x.model}:${x.taskClass}`,x);
  }
  return by;
}
const RANK_WEIGHTS=Object.freeze({quality:0.45,reliability:0.24,latency:0.10,cost:0.11,learned:0.10});
export function createIntelligentModelRouter({profiles=[],ownerRules=[],learned=[],now=Date.now,maxAgeMs=60000}={}){
  const prof=normalProfiles(profiles), rules=normalRules(ownerRules), learnedMap=normalLearned(learned);
  if(!Number.isInteger(maxAgeMs)||maxAgeMs<1000||maxAgeMs>300000)throw fail('ROUTER_TTL_INVALID');
  function route({taskClass='general',manifest,constraints={}}={}){
    if(!TASKS.includes(taskClass)||!plain(constraints))throw fail('ROUTER_TASK_INVALID');
    if(!plain(manifest)||manifest.schema!=='vivim.provider-readiness/1'||!Array.isArray(manifest.providers)||
      manifest.providers.length>30||manifest.providers.some(p=>Array.isArray(p?.models)&&p.models.length>80)||
      Math.abs(age(manifest.observedAt,now()))>maxAgeMs) return {schema:AUTO_ROUTER_SCHEMA,status:'blocked',reason:'MANIFEST_UNVERIFIED_OR_STALE',ranked:[]};
    const allowed=constraints.allowedProviders??null;
    if(allowed!==null&&(!Array.isArray(allowed)||allowed.length>30||allowed.some(x=>!ID.test(x))))throw fail('ROUTER_CONSTRAINT_INVALID');
    for(const x of ['provider','model','effort'])if(constraints[x]!==undefined&&!ID.test(constraints[x]))throw fail('ROUTER_CONSTRAINT_INVALID');
    if(constraints.requireAttachments!==undefined&&typeof constraints.requireAttachments!=='boolean')throw fail('ROUTER_CONSTRAINT_INVALID');
    if(constraints.projectRef!==undefined&&(typeof constraints.projectRef!=='string'||constraints.projectRef.length>160))throw fail('ROUTER_CONSTRAINT_INVALID');
    if(constraints.maxLatencyMs!==undefined&&(!Number.isFinite(constraints.maxLatencyMs)||constraints.maxLatencyMs<0))throw fail('ROUTER_CONSTRAINT_INVALID');
    const list=[];
    for(const p of manifest.providers){
      if(!p?.verified||p.state!=='signed_in'||!ID.test(p.provider??'')||Math.abs(age(p.observedAt,now()))>maxAgeMs)continue;
      if(constraints.provider&&p.provider!==constraints.provider || allowed&&!allowed.includes(p.provider))continue;
      for(const m of p.models??[]){
        if(m?.selectionVerified!==true||!ID.test(m.id??''))continue;
        if(constraints.model&&m.id!==constraints.model || constraints.requireAttachments&&m.attachments!==true)continue;
        if(constraints.effort&&!(m.efforts??[]).includes(constraints.effort))continue;
        const profile=prof.get(`${p.provider}:${m.id}`);
        if(constraints.maxLatencyMs!==undefined&&(profile?.latencyMs===null||profile?.latencyMs===undefined||profile.latencyMs>constraints.maxLatencyMs))continue;
        const l=learnedMap.get(`${p.provider}:${m.id}:${taskClass}`);
        const learnedWeight=l ? l.sampleCount/(l.sampleCount+12):0;
        const experience=l ? 0.5+(l.successRate-0.5)*learnedWeight:0.5;
        const q=profile?.quality[taskClass]??0.5, reliability=profile?.reliability??0.5;
        const latency=profile?.latencyMs===null||profile?.latencyMs===undefined?0.5:1/(1+profile.latencyMs/30000);
        const cost=1-(profile?.costTier??0.5);
```

_First 80 of 104 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

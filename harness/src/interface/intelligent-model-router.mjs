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
        const score=Math.round(10000*(RANK_WEIGHTS.quality*q+RANK_WEIGHTS.reliability*reliability+
          RANK_WEIGHTS.latency*latency+RANK_WEIGHTS.cost*cost+RANK_WEIGHTS.learned*experience))/100;
        list.push({provider:p.provider,model:m.id,effort:constraints.effort??null,score,
          evidence:{availability:'verified',modelSelection:'verified',qualitySource:profile?.source??'unrated',
            learnedSamples:l?.sampleCount??0},components:{quality:q,reliability,latency,cost,learned:experience}});
      }
    }
    // Project-scoped owner rules take precedence only inside their exact project.
    const applicable=rules.filter(r=>r.taskClass===taskClass&&
      (r.scope!=='project'||r.projectRef===constraints.projectRef));
    const explicit=applicable.find(r=>r.scope==='project')??applicable.find(r=>r.scope!=='project');
    const matches=explicit?list.filter(x=>x.provider===explicit.provider&&(!explicit.model||x.model===explicit.model)&&
      (!explicit.effort||manifest.providers.find(p=>p.provider===x.provider)?.models?.find(m=>m.id===x.model)?.efforts?.includes(explicit.effort))):list;
    if(explicit&&!matches.length)return {schema:AUTO_ROUTER_SCHEMA,status:'blocked',reason:'EXPLICIT_OWNER_RULE_UNAVAILABLE',
      rule:{taskClass:explicit.taskClass,provider:explicit.provider,model:explicit.model??null},ranked:[]};
    const ranked=matches.map(x=>({...x,effort:explicit?.effort??x.effort})).sort((a,b)=>b.score-a.score||a.provider.localeCompare(b.provider)||a.model.localeCompare(b.model));
    if(!ranked.length)return {schema:AUTO_ROUTER_SCHEMA,status:'blocked',reason:'NO_VERIFIED_MODEL',ranked:[]};
    return {schema:AUTO_ROUTER_SCHEMA,status:'selected',reason:explicit?'OWNER_RULE':'WEIGHTED_VERIFIED_RANKING',
      taskClass,selected:ranked[0],ranked:ranked.slice(0,15),
      policy:'readiness-verified-only; metadata research is ranking signal, never proof of access'};
  }
  return {schema:AUTO_ROUTER_SCHEMA,route};
}

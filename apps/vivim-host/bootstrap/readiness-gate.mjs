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
    if(!allowed.includes(provider))throw fail('READINESS_PROVIDER_UNSUPPORTED');
    const row=cache.get(provider);
    if(!row||!fresh(row)||!row.verified||row.state!=='signed_in')throw fail('READINESS_PROVIDER_NOT_VERIFIED');
    if(modelId!==null){
      const model=row.models.find(m=>m.id===modelId&&m.selectionVerified);
      if(!model)throw fail('READINESS_MODEL_NOT_VERIFIED');
      if(effort!==null&&!model.efforts.includes(effort))throw fail('READINESS_EFFORT_NOT_VERIFIED');
    }else if(effort!==null)throw fail('READINESS_EFFORT_REQUIRES_MODEL');
    return {provider,model:modelId,effort,observedAt:row.observedAt};
  }
  function invalidate(provider=null){if(provider===null)cache.clear();else cache.delete(provider);}
  return {schema:READINESS_GATE_SCHEMA,check,manifest,schedulerReadiness,select,invalidate};
}

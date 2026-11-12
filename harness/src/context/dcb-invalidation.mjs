// Pure DCB background invalidation planner. No polling, timers, source reads,
// persistence, graph writer or provider effects. Host owns authenticated source
// observations, enqueue/replay, disclosure and execution of recomputation.
export const DCB_INVALIDATION_SCHEMA='vivim.dcb-invalidation-plan/1';
const REF=/^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/;
const fail=(code,message)=>Object.assign(new Error(message),{code});
function refs(arr,label) {
  if(!Array.isArray(arr)||arr.length>500||arr.some(x=>typeof x!=='string'||!REF.test(x)))
    throw fail('DCB_INVALIDATION_INPUT','Invalid '+label);
  return [...new Set(arr)].sort();
}
export function planDcbInvalidations({ definitionStore, changedSourceRefs=[],
  revokedSourceRefs=[], revokedBundleIds=[], changedBundleIds=[], at, limit=500 }={}) {
  if(typeof definitionStore?.list!=='function') throw fail('DCB_INVALIDATION_STORE','Scoped definition store required');
  if(typeof at!=='string'||!Number.isFinite(Date.parse(at))||new Date(at).toISOString()!==at)
    throw fail('DCB_INVALIDATION_TIME','Pinned UTC timestamp required');
  if(!Number.isSafeInteger(limit)||limit<1||limit>500) throw fail('DCB_INVALIDATION_LIMIT','Bounded limit required');
  const changed=new Set(refs(changedSourceRefs,'changedSourceRefs'));
  const revoked=new Set(refs(revokedSourceRefs,'revokedSourceRefs'));
  const revokedBundles=new Set(refs(revokedBundleIds,'revokedBundleIds'));
  const changedBundles=new Set(refs(changedBundleIds,'changedBundleIds'));
  const listed=definitionStore.list({limit:500});
  if(!listed || listed.truncated || !Array.isArray(listed.items))
    throw fail('DCB_INVALIDATION_STORE','Incomplete definition enumeration');
  const nodes=new Map(), children=new Map();
  for(const d of listed.items) {
    if(typeof d.id!=='string'||!REF.test(d.id)||nodes.has(d.id))
      throw fail('DCB_INVALIDATION_STORE','Invalid or duplicate definition');
    nodes.set(d.id,d);
  }
  for(const d of nodes.values()) {
    for(const p of d.parentRefs??[]) {
      if(!nodes.has(p)) throw fail('DCB_INVALIDATION_PARENT','Missing parent definition');
      const arr=children.get(p)??[];
      arr.push(d.id);
      children.set(p,arr);
    }
  }
  const states=new Map(), queue=[];
  const mark=(id,status,reason)=>{
    const old=states.get(id);
    if(!old) {
      states.set(id,{status,reasons:new Set([reason])});
      queue.push(id);
    } else {
      if(status==='blocked') old.status='blocked';
      old.reasons.add(reason);
    }
  };
  for(const d of nodes.values()) {
    if(d.status!=='active') mark(d.id,'blocked',d.status);
    if(d.expiresAt && at>=d.expiresAt) mark(d.id,'blocked','expired');
    if(revokedBundles.has(d.id)) mark(d.id,'blocked','bundle_revoked');
    if(changedBundles.has(d.id)) mark(d.id,'stale','bundle_changed');
    if((d.sourceRefs??[]).some(x=>revoked.has(x))) mark(d.id,'blocked','source_revoked');
    if((d.sourceRefs??[]).some(x=>changed.has(x))) mark(d.id,'stale','source_changed');
  }
  // Graph propagation: a changed parent dirties descendants. A blocked parent
  // blocks descendants. No alternative path can widen a permission.
  while(queue.length) {
    const id=queue.shift();
    const state=states.get(id);
    for(const child of (children.get(id)??[]).sort()) {
      const next=state.status==='blocked'?'blocked':'stale';
      const prev=states.get(child);
      const prevStatus=prev?.status;
      const reason=next==='blocked'?'blocked_parent':'changed_parent';
      mark(child,next,reason);
      // Only re-enqueue when a previously stale child becomes blocked. mark()
      // already enqueues new nodes.
      if(prev && prevStatus!=='blocked' && state.status==='blocked') queue.push(child);
    }
    if(queue.length>500*500) throw fail('DCB_INVALIDATION_CYCLE','Unbounded propagation');
  }
  const jobs=[...states].map(([bundleId,value])=>({
    bundleId,status:value.status,reasons:[...value.reasons].sort(),
    definitionRevision:nodes.get(bundleId).revision,
  })).sort((a,b)=>a.bundleId.localeCompare(b.bundleId));
  if(jobs.length>limit) throw fail('DCB_INVALIDATION_LIMIT','Plan exceeds requested limit');
  return Object.freeze({
    schema:DCB_INVALIDATION_SCHEMA,at,jobCount:jobs.length,jobs,
    status:'planning_only',isSendAuthorized:false,
  });
}

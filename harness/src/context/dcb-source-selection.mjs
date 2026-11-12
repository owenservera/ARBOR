// Deterministic adaptive source selection for persistent/composite DCBs.
// Source metadata only; no memory bodies, unapproved graph writes or grants.
// "Mandatory" references come from Host-owned activity/intent policy, NEVER
// from a provider answer or an untrusted selected flavor.
export const DCB_SOURCE_SELECTION_SCHEMA='vivim.dcb-source-selection/1';
const REF=/^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/;
const TRUST={owner_confirmed:6,observed:4,sourced:3,provider_reported:1,untrusted:0};
const CLASS_TO_FIELD={
  decision:'claims',personal:'identity',conversation:'history',
  project:'task',source:'provenance',test:'provenance',
  receipt:'history',task_evidence:'task',
};
const STOP=new Set(['this','that','with','from','what','about','have','will','your','their','into','where','which','when','then','them','these','those','there','been','being','were','the','and','for','are','can','you','our','was','who','how']);
const fail=(code,message)=>Object.assign(new Error(message),{code});
const refs=(arr,name)=>{
  if(!Array.isArray(arr)||arr.length>500||arr.some(x=>typeof x!=='string'||!REF.test(x)))
    throw fail('DCB_SELECTION_REFS','Invalid '+name);
  return [...new Set(arr)].sort();
};
const words=t=>[...new Set((String(t).toLowerCase().match(/[a-z0-9_-]{3,}/g)??[]).filter(x=>!STOP.has(x)))];
function candidateMetadata(c) {
  if(!c||typeof c.ref!=='string'||!REF.test(c.ref))throw fail('DCB_SELECTION_CANDIDATE','Invalid source metadata');
  if(c.keywords!==undefined&&(!Array.isArray(c.keywords)||c.keywords.length>100
    ||c.keywords.some(x=>typeof x!=='string'||x.length>160)))
    throw fail('DCB_SELECTION_CANDIDATE','Invalid keywords');
  if(c.status!==undefined&&!['active','historical','superseded','revoked'].includes(c.status))
    throw fail('DCB_SELECTION_CANDIDATE','Unknown source state');
  if(c.entityRef!==undefined&&c.entityRef!==null&&
    (typeof c.entityRef!=='string'||!REF.test(c.entityRef)))
    throw fail('DCB_SELECTION_CANDIDATE','Invalid entity reference');
  return c;
}
export function selectDcbSources({bundleSourceRefs,sourceCandidates,taskText='',
  mandatorySourceRefs=[],maxSources=32,flavorComposition=null,now}={}) {
  const universe=refs(bundleSourceRefs,'bundleSourceRefs');
  const mandatory=refs(mandatorySourceRefs,'mandatorySourceRefs');
  if(mandatory.some(x=>!universe.includes(x)))
    throw fail('DCB_SELECTION_REQUIRED','Mandatory source outside bundle');
  if(!Number.isSafeInteger(maxSources)||maxSources<1||maxSources>250||mandatory.length>maxSources)
    throw fail('DCB_SELECTION_BUDGET','Mandatory source count exceeds source budget');
  if(typeof taskText!=='string'||taskText.length>10000)
    throw fail('DCB_SELECTION_TEXT','Invalid task text');
  if(typeof now!=='string'||!Number.isFinite(Date.parse(now))||new Date(now).toISOString()!==now)
    throw fail('DCB_SELECTION_TIME','Pinned UTC now required');
  if(!Array.isArray(sourceCandidates)||sourceCandidates.length>500)
    throw fail('DCB_SELECTION_CANDIDATE','Bounded metadata list required');
  const byRef=new Map();
  for(const c0 of sourceCandidates) {
    const c=candidateMetadata(c0);
    if(!universe.includes(c.ref))continue;
    if(byRef.has(c.ref))throw fail('DCB_SELECTION_COLLISION','Duplicate source identity');
    byRef.set(c.ref,c);
  }
  if(mandatory.some(x=>!byRef.has(x)))
    throw fail('DCB_SELECTION_REQUIRED','Mandatory source metadata unavailable');
  const valid=universe.filter(x=>byRef.has(x)&&!['superseded','revoked'].includes(byRef.get(x).status));
  if(mandatory.some(x=>!valid.includes(x)))
    throw fail('DCB_SELECTION_REQUIRED','Mandatory source invalidated');
  const terms=words(taskText);
  const options=valid.map(ref=>{
    const c=byRef.get(ref);
    const bag=new Set(words([...(c.keywords??[]),c.ref,c.classification,c.layer??''].join(' ')));
    const match=terms.filter(x=>bag.has(x)).length;
    const coverage=terms.length?match/terms.length:0;
    const strength=TRUST[c.trust]??0;
    const field=CLASS_TO_FIELD[c.classification]??'provenance';
    const domain=Number(flavorComposition?.relevance?.[field]??1);
    const safeDomain=Number.isFinite(domain)?Math.max(0,Math.min(10,domain)):1;
    const age=c.updatedAt&&Number.isFinite(Date.parse(c.updatedAt))
      ?Math.max(0,(Date.parse(now)-Date.parse(c.updatedAt))/86400000):365;
    const freshness=Math.exp(-age/90);
    const historical=c.status==='historical'?3:0;
    const score=Math.round((coverage*100+strength*8+safeDomain*3+freshness*10-historical*10)*100)/100;
    return {ref,score,entityRef:c.entityRef??null,
      classification:c.classification??'source',mandatory:mandatory.includes(ref)};
  });
  const optionsByRef=new Map(options.map(x=>[x.ref,x]));
  const chosen=mandatory.map(x=>optionsByRef.get(x));
  const remaining=options.filter(x=>!x.mandatory);
  // Greedy maximal marginal relevance: new entities/classes win over redundant
  // sources when basic lexical, trust and temporal scores are otherwise close.
  while(chosen.length<maxSources&&remaining.length) {
    const ranked=remaining.map(x=>{
      const entityPenalty=x.entityRef&&chosen.some(y=>y.entityRef===x.entityRef)?15:0;
      const classPenalty=chosen.some(y=>y.classification===x.classification)?4:0;
      return {...x,marginalScore:x.score-entityPenalty-classPenalty};
    }).sort((a,b)=>b.marginalScore-a.marginalScore||a.ref.localeCompare(b.ref));
    const best=ranked[0];
    chosen.push(optionsByRef.get(best.ref));
    remaining.splice(remaining.findIndex(x=>x.ref===best.ref),1);
  }
  const selectedRefs=chosen.map(x=>x.ref).sort();
  const omissions=universe.filter(x=>!selectedRefs.includes(x)).map(ref=>({
    ref,reason:!byRef.has(ref)?'metadata_unavailable':
      ['superseded','revoked'].includes(byRef.get(ref).status)?'invalidated':
      'lower_relevance_or_source_budget',
  }));
  return Object.freeze({
    schema:DCB_SOURCE_SELECTION_SCHEMA,selectedRefs,mandatoryRefs:mandatory,
    omissions,sourceCount:universe.length,selectedCount:selectedRefs.length,
    mode:'adaptive',authority:'ranking_projection_only',isSendAuthorized:false,
  });
}

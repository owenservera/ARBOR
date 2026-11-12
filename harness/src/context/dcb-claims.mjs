// DCB v2 claim reconciliation. Pure canonical-graph projection: never writes facts,
// permissions, personal memory, or sends a provider request.
// Claim IDs and value hashes come from Host-owned source adapters, not this module.
export const DCB_CLAIMS_SCHEMA='vivim.dcb-claim-reconciliation/1';
const REF=/^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/;
const SHA=/^[a-f0-9]{64}$/;
const VALID_STATES=new Set(['verified','owner_confirmed','observed','inferred','proposed','provider_reported']);
const TRUST={owner_confirmed:6,verified:5,observed:4,inferred:2,proposed:1,provider_reported:1};
const fail=(code,msg)=>Object.assign(new Error(msg),{code});
const check=(value,name)=>{if(typeof value!=='string'||!REF.test(value))throw fail('DCB_CLAIM_REF','Invalid '+name);return value};
const utc=(s,name)=>{if(s===null)return null;if(typeof s!=='string'||!Number.isFinite(Date.parse(s))||new Date(s).toISOString()!==s)throw fail('DCB_CLAIM_TIME','Invalid '+name);return s};
const unique=x=>[...new Set(x)].sort();
function normalize(row) {
  if(!row||typeof row!=='object'||Array.isArray(row))throw fail('DCB_CLAIM_INVALID','Claim record required');
  const id=check(row.id,'claim id'),subjectRef=check(row.subjectRef,'subject'),
    predicate=check(row.predicate,'predicate'),sourceRef=check(row.sourceRef,'source');
  if(typeof row.valueDigest!=='string'||!SHA.test(row.valueDigest))throw fail('DCB_CLAIM_DIGEST','Invalid value digest');
  if(!VALID_STATES.has(row.evidenceClass))throw fail('DCB_CLAIM_EVIDENCE','Unknown evidence class');
  if(typeof row.sourceRevision!=='string'||!REF.test(row.sourceRevision))throw fail('DCB_CLAIM_REVISION','Source revision required');
  const observedAt=utc(row.observedAt,'observedAt'), validFrom=utc(row.validFrom??null,'validFrom'),
    validUntil=utc(row.validUntil??null,'validUntil');
  if(!observedAt||(validUntil&&validFrom&&validUntil<=validFrom))throw fail('DCB_CLAIM_TIME','Invalid temporal interval');
  if(row.supersedes!==undefined&&!Array.isArray(row.supersedes))throw fail('DCB_CLAIM_SUPERSEDES','Invalid supersession');
  const supersedes=unique((row.supersedes??[]).map(x=>check(x,'supersession claim')));
  if(supersedes.includes(id))throw fail('DCB_CLAIM_CYCLE','Claim cannot supersede itself');
  if(row.revoked!==undefined&&typeof row.revoked!=='boolean')throw fail('DCB_CLAIM_REVOKED','Invalid revocation flag');
  return {id,subjectRef,predicate,valueDigest:row.valueDigest,sourceRef,
    sourceRevision:row.sourceRevision,evidenceClass:row.evidenceClass,observedAt,
    validFrom,validUntil,supersedes,revoked:row.revoked===true};
}
function score(a,b) {
  return TRUST[b.evidenceClass]-TRUST[a.evidenceClass]||
    b.observedAt.localeCompare(a.observedAt)||a.id.localeCompare(b.id);
}
export function reconcileDcbClaims({claims=[],allowedSourceRefs=[],now,maxClaims=500}={}) {
  if(typeof now!=='string')throw fail('DCB_CLAIM_TIME','Pinned time required');
  utc(now,'now');
  if(!Array.isArray(claims)||claims.length>maxClaims||!Number.isSafeInteger(maxClaims)
    ||maxClaims<1||maxClaims>5000)throw fail('DCB_CLAIM_LIMIT','Invalid claim count');
  if(!Array.isArray(allowedSourceRefs)||allowedSourceRefs.length>5000)
    throw fail('DCB_CLAIM_SCOPE','Exact permitted source refs required');
  const permitted=new Set(allowedSourceRefs.map(x=>check(x,'allowed source')));
  const normalized=claims.map(normalize);
  const byId=new Map();
  for(const row of normalized) {
    if(byId.has(row.id)) {
      if(JSON.stringify(byId.get(row.id))!==JSON.stringify(row))
        throw fail('DCB_CLAIM_ID_COLLISION','Conflicting payloads share claim identity');
      continue;
    }
    byId.set(row.id,row);
  }
  // Never infer an authorization from a flavor or bundle. Only exact permitted
  // source IDs can enter even the metadata-only reconciliation result.
  const eligible=[...byId.values()].filter(x=>permitted.has(x.sourceRef));
  const eligibleMap=new Map(eligible.map(x=>[x.id,x]));
  const superseded=new Map(), prior=new Map();
  for(const row of eligible) {
    for(const old of row.supersedes) {
      const target=eligibleMap.get(old);
      if(!target) {
        // Unknown/filtered ancestry is NOT permission to rewrite or suppress it.
        continue;
      }
      if(target.subjectRef!==row.subjectRef||target.predicate!==row.predicate)
        throw fail('DCB_CLAIM_SUPERSESSION_SCOPE','Supersession must address same subject and predicate');
      const arr=prior.get(row.id)??[];
      arr.push(old); prior.set(row.id,arr);
    }
  }
  // Traverse declared supersession to detect cycles before suppressing anything.
  const color=new Map();
  function visit(id) {
    if(color.get(id)===1)throw fail('DCB_CLAIM_CYCLE','Cyclic supersession');
    if(color.get(id)===2)return;
    color.set(id,1);for(const v of prior.get(id)??[])visit(v);color.set(id,2);
  }
  for(const row of eligible)visit(row.id);
  // A proposed or provider-reported observation cannot supersede an owner-
  // confirmed or verified fact, even when it explicitly names its predecessor.
  for(const row of eligible)for(const old of prior.get(row.id)??[]) {
    const target=eligibleMap.get(old);
    if(TRUST[row.evidenceClass]<TRUST[target.evidenceClass])
      throw fail('DCB_CLAIM_UNTRUSTED_SUPERSESSION','Lower-trust claim cannot supersede stronger evidence');
    if(row.observedAt<target.observedAt)
      throw fail('DCB_CLAIM_SUPERSESSION_TIME','Supersession predates its predecessor');
    if(row.revoked || (row.validFrom&&row.validFrom>now) || (row.validUntil&&row.validUntil<=now)) continue;
    const set=superseded.get(old)??new Set();set.add(row.id);superseded.set(old,set);
  }
  const groups=new Map(),excluded=[];
  for(const row of eligible) {
    let reason=null;
    if(row.revoked) reason='revoked';
    else if(row.validFrom&&row.validFrom>now)reason='not_yet_valid';
    else if(row.validUntil&&row.validUntil<=now)reason='historical';
    else if(superseded.has(row.id))reason='superseded';
    if(reason){excluded.push({id:row.id,reason});continue;}
    const key=JSON.stringify([row.subjectRef,row.predicate]);
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(row);
  }
  const selected=[],duplicates=[],contradictions=[];
  for(const [key,group] of [...groups].sort((a,b)=>a[0].localeCompare(b[0]))) {
    const values=new Map();
    for(const row of group) {
      const arr=values.get(row.valueDigest)??[];arr.push(row);values.set(row.valueDigest,arr);
    }
    const winners=[];
    for(const [valueDigest,rows] of [...values].sort((a,b)=>a[0].localeCompare(b[0]))) {
      rows.sort(score);
      winners.push(rows[0]);
      for(const row of rows.slice(1))duplicates.push({id:row.id,representedBy:rows[0].id});
    }
    winners.sort(score);
    for(const row of winners)selected.push({id:row.id,sourceRef:row.sourceRef,
      sourceRevision:row.sourceRevision,evidenceClass:row.evidenceClass,
      subjectRef:row.subjectRef,predicate:row.predicate,valueDigest:row.valueDigest});
    if(winners.length>1) {
      const [subjectRef,predicate]=JSON.parse(key);
      contradictions.push({subjectRef,predicate,claimIds:winners.map(x=>x.id).sort(),
        status:'unresolved_conflict'});
    }
  }
  selected.sort((a,b)=>a.id.localeCompare(b.id));
  duplicates.sort((a,b)=>a.id.localeCompare(b.id));
  excluded.sort((a,b)=>a.id.localeCompare(b.id));
  return Object.freeze({schema:DCB_CLAIMS_SCHEMA,selected,duplicates,excluded,contradictions,
    eligibleCount:eligible.length,filteredCount:byId.size-eligible.length,
    authority:'read_only_projection',isSendAuthorized:false});
}

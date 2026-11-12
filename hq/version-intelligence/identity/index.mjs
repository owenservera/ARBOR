/**
 * ARBOR HVI B — read-only, source-scoped identity projection.
 * This is an adapter to the original hq.catalogue-crosswalk/1, not a registry.
 * No files, network, DB, Host effects, personal data, or discovery of HEAD.
 */
import { createHash } from 'node:crypto';

export const HVI_IDENTITY_SCHEMA = 'arbor.hvi.identity/1';
export const HVI_IDENTITY_INPUT_SCHEMA = 'arbor.hvi.identity-input/1';
export const DECISION_STATES = Object.freeze(['keep_separate','reject_candidate','confirm_equivalence']);
const SHA40=/^[0-9a-f]{40}$/;
const HEX64=/^[0-9a-f]{64}$/;
const REPO=/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SAFE_ID=/^[A-Za-z0-9][A-Za-z0-9:._@/+#-]{0,239}$/;
const CANON=/^(?:cap:[a-z0-9][a-z0-9.-]*|[a-z0-9][a-z0-9._-]*@\d+(?:\.\d+)*)$/;
const UNSAFE=/(?:^|[\/\\])(?:\.env[^\/\\]*|[^\/\\]+\.env|[^\/\\]+\.(?:pem|p12|keystore)|cookies|login data|storage-state\.json|session\.json|release-profile\.json)(?:[\/\\]|$)|(?:^|[?&])(?:token|password|secret|api[_-]?key)=|(?:^|[\/\\])\.\.(?:[\/\\]|$)/i;
const SOURCE_STATES=new Set(['complete','partial','blocked','missing']);
const TYPES=new Set(['capability','tracker','implementation','file','consumer','algorithm','test','research','release','deployment','schema','catalogue']);
const RELATIONS=new Set(['implements','tracks','consumes','tests','researches','releases','deploys','depends_on','documents','references','equivalent_candidate']);
const cmp=(a,b)=>a<b?-1:a>b?1:0;
function stable(value) {
  if(Array.isArray(value)) return value.map(stable);
  if(value && typeof value==='object') return Object.fromEntries(Object.keys(value).sort(cmp).map(k=>[k,stable(value[k])]));
  return value;
}
const sha=(s)=>createHash('sha256').update(s).digest('hex');
const digest=(x)=>sha(JSON.stringify(stable(x)));
export class HviIdentityError extends Error {
  constructor(code) {super(code);this.name='HviIdentityError';this.code=code;}
}
function fail(code){throw new HviIdentityError(code);}
function field(v,max=240) {
  if(typeof v!=='string'||!v.trim()||v.length>max||/[\x00-\x1f]/.test(v)||UNSAFE.test(v))fail('SOURCE_UNAUTHORIZED');
  return v.trim();
}
function id(v){const s=field(v);if(!SAFE_ID.test(s))fail('ID_CONFLICT');return s;}
function safePath(v){
  const s=field(v,1024);
  if(s.startsWith('/')||s.includes('\\')||s.split('/').some(p=>!p||p==='.'||p==='..'))fail('SCOPE_ESCAPE');
  return s;
}
function pinDigest(v){if(typeof v!=='string'||!HEX64.test(v))fail('DIGEST_CONFLICT');return v;}
const makeIdentity=(repo,revision,sourceScopedRecordId)=>'hvi-row:'+sha(repo+'\0'+revision+'\0'+sourceScopedRecordId).slice(0,40);
const makeLineage=(repo,sourceScopedRecordId)=>'hvi-lineage:'+sha(repo+'\0'+sourceScopedRecordId).slice(0,40);
const makePair=(a,b)=>'hvi-pair:'+sha([a,b].sort(cmp).join('\0')).slice(0,40);
export const sourceScopedRevisionId=makeIdentity;
export const stableLineageId=makeLineage;
function validatePins(input){
  if(!Array.isArray(input)||input.length<1||input.length>32)fail('RESOURCE_LIMIT');
  const pins=[],byId=new Map(),byRevision=new Map();
  for(const p of input){
    if(!p||typeof p!=='object')fail('PIN_NOT_FOUND');
    const pinId=id(p.pinId),repoIdentity=field(p.repoIdentity,180);
    if(!REPO.test(repoIdentity)||!SHA40.test(p.resolvedCommitSha))fail('PIN_NOT_FOUND');
    if(!SOURCE_STATES.has(p.completeness))fail('INCOMPLETE_SCAN');
    const manifestDigest=pinDigest(p.manifestDigest);
    const entry={pinId,repoIdentity,resolvedCommitSha:p.resolvedCommitSha,manifestDigest,completeness:p.completeness};
    if(byId.has(pinId))fail('ID_CONFLICT');
    const revKey=repoIdentity+'\0'+p.resolvedCommitSha;
    if(byRevision.has(revKey)&&byRevision.get(revKey)!==manifestDigest)fail('DIGEST_CONFLICT');
    byId.set(pinId,entry);byRevision.set(revKey,manifestDigest);pins.push(entry);
  }
  return {pins:pins.sort((a,b)=>cmp(a.pinId,b.pinId)),byId};
}
function sourceRecord(raw,pin){
  const sourceScopedRecordId=id(raw.sourceScopedRecordId);
  const identityId=makeIdentity(pin.repoIdentity,pin.resolvedCommitSha,sourceScopedRecordId);
  const lineageId=makeLineage(pin.repoIdentity,sourceScopedRecordId);
  const type=field(raw.type,60);
  if(!TYPES.has(type))fail('ID_CONFLICT');
  const name=field(raw.name,400);
  const canonicalId=raw.canonicalId==null?null:field(raw.canonicalId);
  if(canonicalId&&!CANON.test(canonicalId))fail('ID_CONFLICT');
  const owner=field(raw.owner??'source_unverified',150);
  const implementationDigest=raw.implementationDigest??null;
  if(implementationDigest!=null&&!SHA40.test(implementationDigest)&&!HEX64.test(implementationDigest))fail('DIGEST_CONFLICT');
  const sourcePath=raw.sourcePath==null?null:safePath(raw.sourcePath);
  const sourceBlobSha=raw.sourceBlobSha??null;
  if(sourceBlobSha!=null&&!SHA40.test(sourceBlobSha))fail('DIGEST_CONFLICT');
  const evidenceRefs=raw.evidenceRefs??[];
  if(!Array.isArray(evidenceRefs)||evidenceRefs.length>32)fail('RESOURCE_LIMIT');
  const evidence=[...new Set(evidenceRefs.map(e=>field(e,1024)))].sort(cmp);
  if(sourcePath&&sourceBlobSha)evidence.push('git:'+pin.repoIdentity+'@'+pin.resolvedCommitSha+':'+sourcePath+'#'+sourceBlobSha);
  if(!evidence.length)fail('EQUIVALENCE_UNPROVEN');
  evidence.sort(cmp);
  return {id:identityId,lineageId,pinId:pin.pinId,repoIdentity:pin.repoIdentity,
    commitSha:pin.resolvedCommitSha,sourceScopedRecordId,type,name,canonicalId,owner,
    implementationDigest,sourcePath,sourceBlobSha,evidenceRefs:evidence,
    visibility:pin.completeness==='complete'?'observed':'observed_partial',
    authority:'source_claim_only',runtimeProof:'UNRUN'};
}
function validPrevious(previous){
  if(previous==null)return null;
  if(previous.schema!==HVI_IDENTITY_SCHEMA||typeof previous.digest!=='string'||!HEX64.test(previous.digest))fail('DIGEST_CONFLICT');
  const {digest:oldDigest,...body}=previous;
  if(digest(body)!==oldDigest||!Array.isArray(previous.records)||!Array.isArray(previous.pins))fail('DIGEST_CONFLICT');
  return previous;
}
function sanitizeDecision(raw,known){
  if(!raw||!DECISION_STATES.includes(raw.decision))fail('EQUIVALENCE_UNPROVEN');
  const a=id(raw.left),b=id(raw.right);
  if(a===b||!known.has(a)||!known.has(b))fail('EQUIVALENCE_UNPROVEN');
  const reviewer=field(raw.reviewer,180), evidenceRef=field(raw.evidenceRef,1024);
  if(raw.decision==='confirm_equivalence' && (raw.ownerConfirmed!==true||raw.reviewed!==true))fail('EQUIVALENCE_UNPROVEN');
  return {id:makePair(a,b),left:[a,b].sort(cmp)[0],right:[a,b].sort(cmp)[1],decision:raw.decision,
    reviewer,evidenceRef,ownerConfirmed:raw.ownerConfirmed===true,reviewed:raw.reviewed===true,
    evidenceType:'owner_decision',receiptCryptographicallyVerified:false};
}
function overlaps(records,decisions,maxPairs){
  const candidates=new Map(),conflicts=new Map(),groups=new Map();
  const byId=new Map(records.map(r=>[r.id,r]));
  const add=(a,b,basis)=>{
    if(a.id===b.id)return;
    const k=makePair(a.id,b.id);
    if(!candidates.has(k)){
      if(candidates.size>=maxPairs)return;
      candidates.set(k,{id:k,left:[a.id,b.id].sort(cmp)[0],right:[a.id,b.id].sort(cmp)[1],
        basis:new Set(),disposition:'REVIEW_REQUIRED',sourceRevisions:[a.commitSha,b.commitSha].sort(cmp),
        evidenceRefs:[...new Set([...a.evidenceRefs,...b.evidenceRefs])].sort(cmp),certainty:'candidate'});
    }
    candidates.get(k)?.basis.add(basis);
    const differentImplementation=a.implementationDigest&&b.implementationDigest&&a.implementationDigest!==b.implementationDigest;
    const differentOwner=a.owner!==b.owner;
    const differentType=a.type!==b.type;
    if(differentImplementation||differentOwner||differentType){
      conflicts.set(k,{id:'hvi-conflict:'+k.slice(9),candidateId:k,
        types:[...(differentImplementation?['IMPLEMENTATION_COLLISION']:[]),...(differentOwner?['OWNER_CONFLICT']:[]),...(differentType?['TYPE_CONFLICT']:[])],
        resolution:'REVIEW_REQUIRED',recordIds:[a.id,b.id].sort(cmp),evidenceRefs:candidates.get(k).evidenceRefs});
    }
  };
  for(const r of records.filter(r=>r.visibility.startsWith('observed'))){
    for(const key of [r.lineageId,r.canonicalId&&'canonical:'+r.canonicalId].filter(Boolean)){
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(r);
    }
  }
  for(const [key,group] of groups){
    group.sort((a,b)=>cmp(a.id,b.id));
    for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++)add(group[i],group[j],key.startsWith('canonical:')?'DECLARED_CANONICAL_ID':'SAME_REPO_SOURCE_LINEAGE');
  }
  const result=[...candidates.values()].sort((a,b)=>cmp(a.id,b.id)).map(c=>{
    const decision=decisions.find(d=>d.id===c.id)??null;
    return {...c,basis:[...c.basis].sort(cmp),decision,
      disposition:decision?.decision??c.disposition,mergePerformed:false};
  });
  const orphanDecisions=decisions.filter(d=>!candidates.has(d.id));
  if(orphanDecisions.length)fail('EQUIVALENCE_UNPROVEN');
  return {candidates:result,conflicts:[...conflicts.values()].sort((a,b)=>cmp(a.id,b.id)),
    truncated:candidates.size>=maxPairs};
}
/** Read-only source comparison identity projection. Input requires immutable pins, not refs or live HEAD. */
export function buildPinnedIdentityCrosswalk({pins:rawPins,records:rawRecords=[],links:rawLinks=[],decisions:rawDecisions=[],previous=null,maxRecords=100000,maxCandidatePairs=10000}={}){
  const prior=validPrevious(previous);
  const {pins,byId}=validatePins(rawPins);
  const bound=Math.min(100000,Math.max(1,Number.isInteger(maxRecords)?maxRecords:100000));
  const pairBound=Math.min(10000,Math.max(1,Number.isInteger(maxCandidatePairs)?maxCandidatePairs:10000));
  if(!Array.isArray(rawRecords)||rawRecords.length>bound||!Array.isArray(rawLinks)||rawLinks.length>bound)fail('RESOURCE_LIMIT');
  const prevPins=new Map((prior?.pins??[]).map(p=>[p.pinId,p]));
  const revs=new Map((prior?.pins??[]).map(p=>[p.repoIdentity+'\0'+p.resolvedCommitSha,p.manifestDigest]));
  for(const p of pins){
    const old=prevPins.get(p.pinId);
    if(old&&(old.repoIdentity!==p.repoIdentity||old.resolvedCommitSha!==p.resolvedCommitSha||old.manifestDigest!==p.manifestDigest))fail('DIGEST_CONFLICT');
    const digestOld=revs.get(p.repoIdentity+'\0'+p.resolvedCommitSha);
    if(digestOld&&digestOld!==p.manifestDigest)fail('DIGEST_CONFLICT');
  }
  const records=[],mapped=new Map(),priorMap=new Map((prior?.records??[]).map(r=>[r.id,r]));
  for(const raw of rawRecords){
    const pin=byId.get(raw.pinId);
    if(!pin)fail('PIN_NOT_FOUND');
    if(['missing','blocked'].includes(pin.completeness))fail('INCOMPLETE_SCAN');
    const row=sourceRecord(raw,pin),old=mapped.get(row.id);
    if(old&&digest(old)!==digest(row))fail('ID_CONFLICT');
    const fromPrevious=priorMap.get(row.id);
    if(fromPrevious&&fromPrevious.visibility.startsWith('observed')&&fromPrevious.commitSha===row.commitSha){
      const check=Object.fromEntries(Object.entries(fromPrevious).filter(([k])=>k!=='visibility'));
      const next=Object.fromEntries(Object.entries(row).filter(([k])=>k!=='visibility'));
      if(digest(check)!==digest(next))fail('ID_CONFLICT');
    }
    mapped.set(row.id,row);
  }
  const retained=[];
  for(const old of prior?.records??[]){
    if(mapped.has(old.id))continue;
    const pin=byId.get(old.pinId);
    const visibility=pin&&pin.completeness==='missing'?'source_unavailable':'unobserved';
    retained.push({...old,visibility,runtimeProof:'UNRUN'});
  }
  records.push(...mapped.values(),...retained);
  records.sort((a,b)=>cmp(a.id,b.id));
  const known=new Set(records.map(r=>r.id)),edges=[];
  for(const raw of rawLinks){
    const pin=byId.get(raw.pinId),target=byId.get(raw.targetPinId);
    if(!pin||!target)fail('PIN_NOT_FOUND');
    const relation=field(raw.relation,60);if(!RELATIONS.has(relation))fail('ID_CONFLICT');
    const from=makeIdentity(pin.repoIdentity,pin.resolvedCommitSha,id(raw.sourceScopedRecordId));
    const to=makeIdentity(target.repoIdentity,target.resolvedCommitSha,id(raw.targetSourceScopedRecordId));
    if(!known.has(from))fail('ID_CONFLICT');
    edges.push({id:'hvi-edge:'+sha(from+'\0'+relation+'\0'+to).slice(0,40),
      from,to,relation,evidenceRefs:records.find(r=>r.id===from).evidenceRefs,
      status:known.has(to)?'SOURCE_DECLARED':'TARGET_UNOBSERVED',mergePerformed:false});
  }
  const uniqueEdges=new Map();
  for(const e of edges){if(uniqueEdges.has(e.id)&&digest(uniqueEdges.get(e.id))!==digest(e))fail('ID_CONFLICT');uniqueEdges.set(e.id,e);}
  const seen=new Map(),decisions=[];
  for(const r of rawDecisions){
    const d=sanitizeDecision(r,known),old=seen.get(d.id);
    if(old&&digest(old)!==digest(d))fail('ID_CONFLICT');
    seen.set(d.id,d);
  }
  decisions.push(...seen.values().sort((a,b)=>cmp(a.id,b.id)));
  const {candidates,conflicts,truncated}=overlaps(records,decisions,pairBound);
  const sourceUnobserved=pins.filter(p=>p.completeness!=='complete').map(p=>({pinId:p.pinId,
    status:p.completeness,meaning:'UNKNOWN_NOT_MISSING'}));
  const body={schema:HVI_IDENTITY_SCHEMA,pins,records,edges:[...uniqueEdges.values()].sort((a,b)=>cmp(a.id,b.id)),
    identityCandidates:candidates,authorityConflicts:conflicts,decisions,
    unobserved:sourceUnobserved,retainedCount:retained.length,limits:{maxRecords:bound,maxCandidatePairs:pairBound,
      candidateTruncated:truncated,recordTruncated:false},
    policy:{identity:'repo_commit_source_scoped_record',canonical:'source_declared_only',
      equivalence:'review_annotation_never_merge',tombstone:'owner_receipt_only_never_inferred',
      authority:'Host_only_effects',graph:'existing_HQKG_projection_only',runtime:'UNRUN'}};
  return {...body,digest:digest(body)};
}
export const projectPinnedIdentities=buildPinnedIdentityCrosswalk;

// VIVIM W02: declarative personal-World type evolution. Uses the existing
// VersionedStore as the sole registry authority, with immutable CAS revisions.
// No generated SQL/JS/HTML/CSS or provider ability to mutate a schema.
import { createHash } from 'node:crypto';
export const WORLD_EVOLUTION_SCHEMA='vivim.world-evolution/1';
const ID=/^[a-z][a-z0-9_-]{0,63}$/;
const WORLD=/^[a-z0-9][a-z0-9_-]{0,63}$/;
const FIELD_TYPES=new Set(['string','number','boolean','date','enum','ref','list','object']);
const VIEWS=new Set(['card','list','detail','timeline','gallery']);
const FAIL=code=>Object.assign(new Error(code),{code});
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'
  ? Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const hash=x=>createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const deep=x=>structuredClone(x);
function safeText(x,max=256){return typeof x==='string'&&x.length>0&&x.length<=max&&!/[<>\u0000-\u001F]/.test(x);}
function schemaSize(o){return Buffer.byteLength(JSON.stringify(o),'utf8');}
function checkField(f,worldId,depth=1){
  if(!plain(f)||depth>8||!FIELD_TYPES.has(f.type)||typeof f.required!=='boolean'||
     !['public','private','sensitive'].includes(f.privacy)||
     Object.keys(f).some(x=>!['type','required','privacy','description','values','items','properties','target','indexable'].includes(x)))throw FAIL('WORLD_FIELD_INVALID');
  if(f.description!==undefined&&!safeText(f.description,300))throw FAIL('WORLD_FIELD_INVALID');
  if(f.indexable!==undefined&&typeof f.indexable!=='boolean')throw FAIL('WORLD_FIELD_INVALID');
  if(f.type==='enum'){
    if(!Array.isArray(f.values)||f.values.length<1||f.values.length>50||
       f.values.some(x=>!safeText(x,80))||new Set(f.values).size!==f.values.length)throw FAIL('WORLD_ENUM_INVALID');
  }else if(f.values!==undefined)throw FAIL('WORLD_FIELD_INVALID');
  if(f.type==='ref'){
    if(!safeText(f.target??'',160)||!/^(personal\.[a-z0-9_-]+\.[a-z0-9_-]+|domain\.[a-z0-9_-]+\.[a-z0-9_-]+)@\d+$/.test(f.target))throw FAIL('WORLD_REF_INVALID');
    if(f.target.startsWith('personal.')&&!f.target.startsWith(`personal.${worldId}.`))throw FAIL('WORLD_CROSS_WORLD_REF');
  }else if(f.target!==undefined)throw FAIL('WORLD_FIELD_INVALID');
  if(f.type==='list'){
    if(!plain(f.items))throw FAIL('WORLD_LIST_INVALID');
    checkField(f.items,worldId,depth+1);
  }else if(f.items!==undefined)throw FAIL('WORLD_FIELD_INVALID');
  if(f.type==='object'){
    if(!plain(f.properties)||Object.keys(f.properties).length>32)throw FAIL('WORLD_OBJECT_INVALID');
    for(const [k,v] of Object.entries(f.properties)){if(!ID.test(k))throw FAIL('WORLD_FIELD_NAME'); checkField(v,worldId,depth+1);}
  }else if(f.properties!==undefined)throw FAIL('WORLD_FIELD_INVALID');
}
export function validateWorldType(input,worldId){
  if(!WORLD.test(worldId??'')||!plain(input)||!safeText(input.typeId??'',160)||
     !input.typeId.startsWith(`personal.${worldId}.`)||
     !/^personal\.[a-z0-9_-]+\.[a-z0-9_-]+$/.test(input.typeId)||
     !plain(input.fields)||Object.keys(input.fields).length>32||
     !Array.isArray(input.relations)||input.relations.length>24||
     !Array.isArray(input.views)||input.views.length>5||input.views.some(x=>!VIEWS.has(x))||
     Object.keys(input).some(k=>!['typeId','fields','relations','views','description'].includes(k)))throw FAIL('WORLD_TYPE_INVALID');
  if(input.description!==undefined&&!safeText(input.description,800))throw FAIL('WORLD_TYPE_INVALID');
  for(const [k,v] of Object.entries(input.fields)){if(!ID.test(k))throw FAIL('WORLD_FIELD_NAME');checkField(v,worldId);}
  for(const r of input.relations){
    if(!plain(r)||!ID.test(r.predicate??'')||typeof r.target!=='string'||r.target.length>160||
       !/^(personal\.[a-z0-9_-]+\.[a-z0-9_-]+|domain\.[a-z0-9_-]+\.[a-z0-9_-]+)@\d+$/.test(r.target)||
       Object.keys(r).some(k=>!['predicate','target'].includes(k)))throw FAIL('WORLD_RELATION_INVALID');
    if(r.target.startsWith('personal.')&&!r.target.startsWith(`personal.${worldId}.`))throw FAIL('WORLD_CROSS_WORLD_REF');
  }
  if(schemaSize(input)>256*1024)throw FAIL('WORLD_TYPE_OVERSIZED');
  return deep(input);
}
function diffTypes(previous,next){
  const prev=previous?.fields??{},nextFields=next.fields;
  const removed=Object.keys(prev).filter(k=>!Object.hasOwn(nextFields,k));
  // V1 supports additive optional fields. Existing field semantics cannot mutate
  // under the same type identity, including nested fields, target refs and enum values.
  // Privacy/description changes create a new version but retain field meaning.
  const structural=f=>{const copy=deep(f);delete copy.description;delete copy.privacy;
    if(copy.items)copy.items=structural(copy.items);
    if(copy.properties)copy.properties=Object.fromEntries(Object.entries(copy.properties).map(([k,v])=>[k,structural(v)]));
    return copy;};
  const breaking=Object.keys(prev).filter(k=>Object.hasOwn(nextFields,k)&&
    hash(structural(prev[k]))!==hash(structural(nextFields[k])));
  const added=Object.keys(nextFields).filter(k=>!Object.hasOwn(prev,k));
  if(previous && added.some(k=>nextFields[k].required===true))breaking.push(...added.filter(k=>nextFields[k].required===true));
  const hasSensitive=f=>f.privacy==='sensitive'||(f.type==='list'&&hasSensitive(f.items))||
    (f.type==='object'&&Object.values(f.properties).some(hasSensitive));
  const sensitive=Object.values(nextFields).some(hasSensitive) ||
    Object.keys(prev).some(k=>nextFields[k]&&['public','private','sensitive'].indexOf(nextFields[k].privacy)<
      ['public','private','sensitive'].indexOf(prev[k].privacy));
  return {removed,breaking,added,sensitive};
}
function stateOf(raw,worldId){
  if(!raw)return {schema:WORLD_EVOLUTION_SCHEMA,worldId,definitions:{},active:{},receipts:[]};
  if(raw.schema!==WORLD_EVOLUTION_SCHEMA||raw.worldId!==worldId||!plain(raw.definitions)||!plain(raw.active)||!Array.isArray(raw.receipts))throw FAIL('WORLD_STATE_CORRUPT');
  return deep({schema:raw.schema,worldId,definitions:raw.definitions,active:raw.active,receipts:raw.receipts});
}
export function createWorldEvolution({store,worldId,verifyOwner,verifyGrant,verifyEvidence,now=()=>new Date().toISOString()}={}){
  if(!WORLD.test(worldId??'')||!store?.current||!store?.load||!store?.compareAndSave||
     typeof verifyOwner!=='function'||typeof verifyGrant!=='function'||typeof verifyEvidence!=='function')throw FAIL('WORLD_DEPENDENCY');
  const name='types-'+worldId;
  function read(){const revision=store.current(name);return {revision,state:stateOf(revision===null?null:store.load(name),worldId)};}
  function preview({candidate,proposalId,idempotencyKey,baseRevision,evidenceRefs=[]}={}){
    if(!ID.test(proposalId??'')||!ID.test(idempotencyKey??'')||!Array.isArray(evidenceRefs)||
       evidenceRefs.length>30||evidenceRefs.some(x=>!safeText(x,128)))throw FAIL('WORLD_PROPOSAL_INVALID');
    const next=validateWorldType(candidate,worldId), {revision,state}=read();
    if(revision!==baseRevision)throw FAIL('WORLD_STALE_BASE');
    const activeRef=state.active[next.typeId], old=activeRef?state.definitions[activeRef]?.definition:null;
    const diff=diffTypes(old,next);
    if(diff.removed.length||diff.breaking.length)throw FAIL('WORLD_BREAKING_MIGRATION_REQUIRED');
    const previousVersion=activeRef?Number(activeRef.split('@').at(-1)):0;
    const candidateRef=`${next.typeId}@${previousVersion+1}`;
    const risk=diff.sensitive?'R2_SENSITIVE':'R1_ADDITIVE';
    const base={schema:'vivim.world-type-plan/1',worldId,proposalId,idempotencyKey,baseRevision,
      candidateRef,candidate:next,evidenceRefs:[...new Set(evidenceRefs)].sort(),risk,diff};
    return Object.freeze({...base,planDigest:hash(base)});
  }
  async function activate(input,approval){
    if(!plain(input)||!plain(approval))throw FAIL('WORLD_PLAN_REQUIRED');
    const current=read();
    const old=current.state.receipts.find(r=>r.idempotencyKey===input.idempotencyKey);
    if(old){if(old.planDigest!==input.planDigest)throw FAIL('WORLD_IDEMPOTENCY_CONFLICT');return {...deep(old),replayed:true};}
    const p=preview({candidate:input.candidate,proposalId:input.proposalId,idempotencyKey:input.idempotencyKey,
      baseRevision:input.baseRevision,evidenceRefs:input.evidenceRefs});
    if(JSON.stringify(stable(p))!==JSON.stringify(stable(input)))throw FAIL('WORLD_PLAN_TAMPERED');
    if(approval.worldId!==worldId||approval.planDigest!==p.planDigest||approval.baseRevision!==p.baseRevision||
       !ID.test(approval.approvalId??'')||!Number.isFinite(Date.parse(approval.expiresAt))||
       Date.parse(approval.expiresAt)<=Date.parse(now()))throw FAIL('WORLD_APPROVAL_INVALID');
    const [auth,grant,evidence]=await Promise.all([
      verifyOwner({approval,plan:p,requireFresh:p.risk==='R2_SENSITIVE'}),
      verifyGrant({worldId,typeRef:p.candidateRef,risk:p.risk,planDigest:p.planDigest}),
      verifyEvidence({worldId,refs:p.evidenceRefs})]);
    if(auth?.verified!==true||auth?.approvalId!==approval.approvalId||auth?.planDigest!==p.planDigest||
       auth?.revoked===true||p.risk==='R2_SENSITIVE'&&auth?.fresh!==true||grant?.allowed!==true||evidence?.valid!==true)
      throw FAIL('WORLD_AUTHORITY_REQUIRED');
    const state=current.state;
    if(state.receipts.length>=500)throw FAIL('WORLD_RECEIPT_CAPACITY');
    const next=deep(state);
    if(next.definitions[p.candidateRef])throw FAIL('WORLD_DUPLICATE_TYPE_VERSION');
    next.definitions[p.candidateRef]={definition:p.candidate,digest:hash(p.candidate),evidenceRefs:p.evidenceRefs,
      proposalId:p.proposalId,createdAt:now(),risk:p.risk};
    next.active[p.candidate.typeId]=p.candidateRef;
    const receipt={schema:WORLD_EVOLUTION_SCHEMA,worldId,idempotencyKey:p.idempotencyKey,planDigest:p.planDigest,
      proposalId:p.proposalId,activeRef:p.candidateRef,baseRevision:p.baseRevision,approvalId:approval.approvalId,at:now()};
    next.receipts.push(receipt);
    const saved=store.compareAndSave(name,next,{expectedVersion:p.baseRevision,changeNote:`type ${p.candidateRef}`});
    return {...receipt,revision:saved.version};
  }
  function previewRollback({typeId,targetRef,baseRevision,idempotencyKey}={}){
    const {revision,state}=read();
    if(revision!==baseRevision||!ID.test(idempotencyKey??'')||!safeText(typeId??'',160)||!safeText(targetRef??'',200)||
       state.active[typeId]===targetRef||!state.definitions[targetRef]||
       !targetRef.startsWith(typeId+'@'))throw FAIL('WORLD_ROLLBACK_INVALID');
    const body={schema:'vivim.world-type-rollback/1',worldId,typeId,targetRef,baseRevision,idempotencyKey,
      warning:'Changes only the active type pointer; existing instances remain pinned'};
    return {...body,planDigest:hash(body)};
  }
  async function rollback(input,approval){
    if(!plain(input)||!plain(approval))throw FAIL('WORLD_ROLLBACK_INVALID');
    const previously=read().state.receipts.find(r=>r.idempotencyKey===input.idempotencyKey);
    if(previously){if(previously.planDigest!==input.planDigest)throw FAIL('WORLD_IDEMPOTENCY_CONFLICT');
      return {...deep(previously),replayed:true};}
    const p=previewRollback(input), {state}=read();
    if(JSON.stringify(stable(p))!==JSON.stringify(stable(input))||approval?.worldId!==worldId||
       approval?.planDigest!==p.planDigest||!ID.test(approval?.approvalId??'')||
       !Number.isFinite(Date.parse(approval.expiresAt))||Date.parse(approval.expiresAt)<=Date.parse(now()))throw FAIL('WORLD_ROLLBACK_INVALID');
    const [auth,grant]=await Promise.all([
      verifyOwner({approval,plan:p,requireFresh:true}),
      verifyGrant({worldId,typeRef:p.targetRef,risk:'R2_SENSITIVE',planDigest:p.planDigest})]);
    if(auth?.verified!==true||auth?.fresh!==true||auth?.approvalId!==approval.approvalId||
       auth?.planDigest!==p.planDigest||auth?.revoked===true||grant?.allowed!==true)throw FAIL('WORLD_AUTHORITY_REQUIRED');
    const next=deep(state);next.active[p.typeId]=p.targetRef;
    if(next.receipts.length>=500)throw FAIL('WORLD_RECEIPT_CAPACITY');
    const receipt={schema:WORLD_EVOLUTION_SCHEMA,worldId,idempotencyKey:p.idempotencyKey,planDigest:p.planDigest,
      approvalId:approval.approvalId,activeRef:p.targetRef,baseRevision:p.baseRevision,at:now(),
      historyPreserved:true,instancesMigrated:false};
    next.receipts.push(receipt);
    const saved=store.compareAndSave(name,next,{expectedVersion:p.baseRevision,changeNote:`type rollback ${p.typeId}`});
    return {...receipt,revision:saved.version};
  }
  return {schema:WORLD_EVOLUTION_SCHEMA,read,preview,activate,previewRollback,rollback};
}

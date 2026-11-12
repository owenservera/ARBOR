// Typed DCB observation intake, for adapters to existing Host World/capture
// receipts. Produces metadata-only reconciliation hints; NO graph writes,
// transcript ingestion, provider calls, permission changes or browser effects.
// The Host MUST authenticate source, receipt, owner and source digest first.
export const DCB_OBSERVATION_SCHEMA='vivim.dcb-observation/1';
export const DCB_OBSERVATION_DELTA_SCHEMA='vivim.dcb-observation-delta/1';
const REF=/^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/;
const SHA=/^[a-f0-9]{64}$/;
const KINDS=new Set(['source.observed','claim.proposed','owner.corrected','source.revoked']);
const EVIDENCE=new Set(['observed','provider_reported','inferred','owner_confirmed','verified']);
const SENS=new Set(['public','internal','private','sensitive','secret']);
const fail=(code,msg)=>Object.assign(new Error(msg),{code});
const ref=(s,name)=>{if(typeof s!=='string'||!REF.test(s))throw fail('DCB_OBSERVATION_REF','Invalid '+name);return s};
const iso=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;
const hash=s=>typeof s==='string'&&SHA.test(s);
export function validateDcbObservation(event) {
  if(!event||typeof event!=='object'||Array.isArray(event)
    ||event.schema!==DCB_OBSERVATION_SCHEMA||!KINDS.has(event.kind)
    ||!EVIDENCE.has(event.evidenceClass)||!SENS.has(event.sensitivity)
    ||!iso(event.observedAt)||!hash(event.sourceDigest))
    throw fail('DCB_OBSERVATION_INVALID','Invalid versioned Host observation');
  for(const field of ['id','principalRef','sourceRef','sourceRevision','receiptRef'])
    ref(event[field],field);
  if(event.subjectRef!=null)ref(event.subjectRef,'subjectRef');
  if(event.activityRef!=null)ref(event.activityRef,'activityRef');
  if(event.providerRef!=null)ref(event.providerRef,'providerRef');
  if(event.kind==='owner.corrected'&&
    (event.evidenceClass!=='owner_confirmed'||!REF.test(event.ownerProofRef??'')))
    throw fail('DCB_OBSERVATION_OWNER','Owner correction needs confirmed evidence and proof');
  if(event.kind==='claim.proposed'&&event.evidenceClass==='owner_confirmed')
    throw fail('DCB_OBSERVATION_PROMOTION','Proposals cannot claim confirmed owner authority');
  if(event.kind==='source.revoked'&&
    (event.evidenceClass!=='owner_confirmed'||!REF.test(event.ownerProofRef??'')))
    throw fail('DCB_OBSERVATION_REVOKE','Source revocation requires owner evidence and proof');
  if(event.providerRef&&event.evidenceClass==='owner_confirmed'
    &&event.kind!=='owner.corrected'&&event.kind!=='source.revoked')
    throw fail('DCB_OBSERVATION_PROMOTION','Provider observations cannot self-promote to owner truth');
  // Strip unknown fields and ALL possible raw body payloads.
  return Object.freeze({
    schema:DCB_OBSERVATION_SCHEMA,id:event.id,kind:event.kind,
    principalRef:event.principalRef,sourceRef:event.sourceRef,
    sourceRevision:event.sourceRevision,sourceDigest:event.sourceDigest,
    receiptRef:event.receiptRef,subjectRef:event.subjectRef??null,
    activityRef:event.activityRef??null,providerRef:event.providerRef??null,
    observedAt:event.observedAt,evidenceClass:event.evidenceClass,
    sensitivity:event.sensitivity,ownerProofRef:event.ownerProofRef??null,
  });
}
export function planDcbObservationIntegration({event,previous=null}={}) {
  const e=validateDcbObservation(event);
  if(previous!==null){
    if(!previous||previous.sourceRef!==e.sourceRef
      ||!ref(previous.sourceRevision,'previousSourceRevision')
      ||!hash(previous.sourceDigest)||!iso(previous.observedAt)
      ||typeof previous.revoked!=='boolean')
      throw fail('DCB_OBSERVATION_PREVIOUS','Invalid Host source projection');
    if(e.observedAt<previous.observedAt)
      throw fail('DCB_OBSERVATION_TIME','Older evidence cannot overwrite newer source state');
    if(previous.revoked&&e.kind!=='source.revoked')
      throw fail('DCB_OBSERVATION_TOMBSTONE','Revoked source cannot be silently restored');
  }
  const same=previous&&previous.sourceRevision===e.sourceRevision
    &&previous.sourceDigest===e.sourceDigest;
  const revoked=e.kind==='source.revoked';
  const action=revoked?'tombstone':
    e.kind==='owner.corrected'?'owner_correction_proposal':
    e.kind==='claim.proposed'||e.evidenceClass==='provider_reported'
      ?'unconfirmed_claim':
    same?'no_change':'source_revision_observed';
  // A provider observation only produces proposed evidence. The Host's
  // canonical World writer decides whether/when to promote after review.
  return Object.freeze({
    schema:DCB_OBSERVATION_DELTA_SCHEMA,observationId:e.id,receiptRef:e.receiptRef,
    sourceRef:e.sourceRef,sourceRevision:e.sourceRevision,sourceDigest:e.sourceDigest,
    action,evidenceClass:e.evidenceClass,
    changedSourceRefs:action==='no_change'?[]:revoked?[]:[e.sourceRef],
    revokedSourceRefs:revoked?[e.sourceRef]:[],
    canPromoteAutomatically:false,rawBodyStored:false,isSendAuthorized:false,
    authority:'metadata_proposal_only',
  });
}

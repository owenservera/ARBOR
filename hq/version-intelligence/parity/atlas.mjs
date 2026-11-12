/**
 * ARBOR HVI Lane D — pure source/capability parity projection.
 * Inputs are already-acquired pinned manifests, not live refs or filesystem paths.
 * No I/O, store, graph mutation, scheduler, permission grant or effect execution.
 */
import { createHash } from 'node:crypto';

export const ATLAS_SCHEMA = 'arbor.hvi.parity-atlas/1';
export const SOURCE_STATES = Object.freeze(['EXACT_BLOB', 'SAME_PATH_CHANGED',
  'EXACT_RELOCATION', 'MISSING_AT_TARGET', 'UNOBSERVABLE']);
export const CAPABILITY_STATES = Object.freeze(['UNKNOWN','PRESENT_EQUIVALENT_CONFIRMED',
  'PRESENT_CHANGED','IMPORTED_NOT_WIRED','SOURCE_WIRED_UNVERIFIED',
  'RUNTIME_VERIFIED','DESIGN_ONLY','RESEARCH_IMPLEMENTED','INTENTIONALLY_EXCLUDED','BLOCKED']);
const SHA = /^[0-9a-f]{40}$/;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SECRET = /^(?:\.env.*|.*\.env|.*\.pem|.*\.p12|.*\.keystore|session\.json|storage-state\.json|release-profile\.json|cookies|login data)$/i;
const MAX_ENTRIES = 10000;
const MAX_EVIDENCE = 10000;
function fail(code) { throw new Error('HVI_PARITY_' + code); }
function safePath(path) {
  if (typeof path !== 'string' || !path.length || path.length > 1024
    || path.includes('\\') || path.startsWith('/') || /[\x00-\x1f]/.test(path)
    || /[?#]/.test(path)) fail('SCOPE_ESCAPE');
  const parts = path.split('/');
  if (parts.some(p => !p || p === '.' || p === '..' || SECRET.test(p))) fail('SCOPE_ESCAPE');
  return path;
}
function pin(source) {
  if (!source || !REPO.test(source.repo) || !SHA.test(source.commitSha)
      || !['complete','partial','blocked','missing'].includes(source.completeness)) fail('INVALID_PIN');
  if (source.scope !== 'development') fail('SOURCE_UNAUTHORIZED');
  return { repo: source.repo, commitSha: source.commitSha, completeness: source.completeness };
}
function manifest(source) {
  const p = pin(source);
  if (!Array.isArray(source.entries) || source.entries.length > MAX_ENTRIES) fail('RESOURCE_LIMIT');
  const found = new Map();
  for (const entry of source.entries) {
    const path = safePath(entry?.path);
    if (found.has(path)) fail('DUPLICATE_PATH');
    if (!SHA.test(entry?.blobSha)) fail('INVALID_BLOB');
    found.set(path, Object.freeze({ path, blobSha: entry.blobSha, kind: entry.kind ?? 'blob' }));
  }
  return { ...p, entries: [...found.values()].sort((a,b)=>a.path.localeCompare(b.path)) };
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>[k,canonical(v)]));
  return value;
}
function digest(value) { return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex'); }
function sourceKey(ref) { return ref.repo + '@' + ref.commitSha + ':' + ref.path; }
function sourceMatches(ref, entry, p) {
  return Boolean(ref && ref.repo === p.repo && ref.commitSha === p.commitSha
    && ref.path === entry.path && ref.blobSha === entry.blobSha);
}
function indexEvidence(evidence) {
  if (!Array.isArray(evidence) || evidence.length > MAX_EVIDENCE) fail('RESOURCE_LIMIT');
  const map = new Map();
  for (const e of evidence) {
    if (!e || typeof e.id !== 'string' || !/^[\w.:@/-]{1,200}$/.test(e.id)
        || !['source_blob','source_symbol','contract','fixture','executed_test','host_receipt','device_receipt','owner_decision'].includes(e.kind)) fail('INVALID_EVIDENCE');
    if (map.has(e.id)) fail('DUPLICATE_EVIDENCE');
    if (e.source) {
      if (!REPO.test(e.source.repo) || !SHA.test(e.source.commitSha)
        || !SHA.test(e.source.blobSha)) fail('INVALID_EVIDENCE_SOURCE');
      safePath(e.source.path);
    }
    map.set(e.id, e);
  }
  return map;
}
function ownerFor(path, owners) {
  return owners.filter(x => x && x.path === path && typeof x.owner === 'string');
}
function acceptDecision(path, owners, decisions, evidence) {
  const row = decisions.filter(x=>x.path===path);
  if (row.length>1) fail('CONFLICTING_DECISIONS');
  if (!row.length) return null;
  const d=row[0];
  if (!CAPABILITY_STATES.includes(d.state) || !ownerFor(path,owners).some(x=>x.owner===d.owner)
      || !d.ownerAccepted || !Array.isArray(d.evidenceIds) || !d.evidenceIds.length
      || !d.evidenceIds.every(id=>evidence.has(id))) fail('UNPROVEN_OWNER_DECISION');
  if (d.state==='RUNTIME_VERIFIED') fail('RUNTIME_REQUIRES_RECEIPT');
  if (d.state==='INTENTIONALLY_EXCLUDED' && (!d.tombstoneRef || !evidence.has(d.tombstoneRef)
      || evidence.get(d.tombstoneRef).kind!=='owner_decision')) fail('UNPROVEN_TOMBSTONE');
  return d;
}
/** A receipt MUST explicitly bind its target pin and current authorized Host context. */
function acceptedRuntimeReceipt(receipts, target, entry) {
  return receipts.some(r=>r && ['host_receipt','device_receipt'].includes(r.kind)
    && r.accepted===true && r.exitCode===0 && r.source?.repo===target.repo
    && r.source?.commitSha===target.commitSha && r.source?.path===entry.path
    && r.source?.blobSha===entry.blobSha && typeof r.actorRef==='string'
    && r.actorRef.length>0 && typeof r.sessionRef==='string'
    && r.sessionRef.length>0 && typeof r.grantRef==='string'
    && r.grantRef.length>0 && r.provenanceVerified===true);
}
/**
 * @param {{donor:object,target:object,owners?:Array,sourceEvidence?:Array,
 *          testReceipts?:Array,ownerDecisions?:Array}} input
 * @returns {object} stable bounded read-only evidence atlas
 */
export function buildParityAtlas(input={}) {
  const donor=manifest(input.donor), target=manifest(input.target);
  if (!Array.isArray(input.owners??[]) || !Array.isArray(input.ownerDecisions??[])
    || !Array.isArray(input.testReceipts??[])) fail('INVALID_INPUT');
  if (input.testReceipts.length>MAX_EVIDENCE || input.ownerDecisions.length>MAX_EVIDENCE) fail('RESOURCE_LIMIT');
  const evidence=indexEvidence(input.sourceEvidence??[]);
  const targetByPath=new Map(target.entries.map(e=>[e.path,e]));
  const targetByBlob=new Map();
  for(const e of target.entries) (targetByBlob.get(e.blobSha)??targetByBlob.set(e.blobSha,[]).get(e.blobSha)).push(e);
  const rows=[];
  for(const entry of donor.entries){
    const found=targetByPath.get(entry.path);
    const relocated=targetByBlob.get(entry.blobSha)?.[0]??null;
    const same=found?.blobSha===entry.blobSha;
    const sourceState=same?'EXACT_BLOB':found?'SAME_PATH_CHANGED':
      relocated?'EXACT_RELOCATION':target.completeness==='complete'?'MISSING_AT_TARGET':'UNOBSERVABLE';
    const targetEntries=found?[found]:(relocated?[relocated]:[]);
    const inspected=[...evidence.values()].filter(e=>
      ['source_symbol','source_blob','contract'].includes(e.kind)
      && e.inspected===true && sourceMatches(e.source,entry,donor));
    const d=acceptDecision(entry.path,input.owners??[],input.ownerDecisions??[],evidence);
    let capabilityState=d?.state??'UNKNOWN';
    // A byte match is physical parity only; never manufacture functional equivalence.
    // No runtime promotion from tests, documentation or previous user claims.
    if(capabilityState==='RUNTIME_VERIFIED') fail('RUNTIME_REQUIRES_RECEIPT');
    if(!d && targetEntries.some(e=>acceptedRuntimeReceipt(input.testReceipts,target,e)))
      capabilityState='RUNTIME_VERIFIED';
    const evidenceIds=[...new Set([...inspected.map(x=>x.id),...(d?.evidenceIds??[])])].sort();
    rows.push({ id:digest([sourceKey({...donor,...entry}),target.repo,target.commitSha]).slice(0,24),
      origin_repo:donor.repo,origin_sha:donor.commitSha,origin_path:entry.path,
      origin_blob:entry.blobSha,target_repo:target.repo,target_sha:target.commitSha,
      target_path:targetEntries.map(e=>e.path),target_blob:targetEntries.map(e=>e.blobSha),
      source_state:sourceState,capability_state:capabilityState,
      decision:d?'OWNER_ACCEPTED':'UNKNOWN_UNREVIEWED',
      certainty:d?'owner_receipt':inspected.length?'source_inspected':'path_only',
      owner:d?.owner??ownerFor(entry.path,input.owners??[])[0]?.owner??null,
      inspected:inspected.length>0,evidence_refs:evidenceIds,
      tests:input.testReceipts.some(r=>r.kind==='executed_test'&&sourceMatches(r.source,entry,donor)&&r.exitCode===0)
        ?'TEST_EXECUTED':'UNRUN',
      runtime_evidence:capabilityState==='RUNTIME_VERIFIED'?'VERIFIED_RECEIPT':'UNRUN'});
  }
  const inspected=rows.filter(x=>x.inspected).length;
  const counts=Object.fromEntries(SOURCE_STATES.map(s=>[s,rows.filter(r=>r.source_state===s).length]));
  const body={schema:ATLAS_SCHEMA,donorPin:{repo:donor.repo,sha:donor.commitSha,completeness:donor.completeness},
    targetPin:{repo:target.repo,sha:target.commitSha,completeness:target.completeness},
    coverage:{sourceFiles:rows.length,inspectedFiles:inspected,inspectedPercent:rows.length?Number((100*inspected/rows.length).toFixed(2)):100,
      meaning:'direct file inspection with pinned source evidence; not capability or runtime acceptance'},
    sourceCounts:counts,rows,authority:'read_only_development_projection',runtimeAccepted:false};
  return {...body,reproducibilityDigest:digest(body)};
}

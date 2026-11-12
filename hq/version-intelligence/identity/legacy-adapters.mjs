/**
 * Explicit schema shims: no rewrite of vivim.catalogue-export/1 or
 * hq.catalogue-crosswalk/1 and no inference of runtime installation.
 */
import { createHash } from 'node:crypto';
import { CATALOGUE_SCHEMA, queryCatalogueSnapshot } from '../../lib/catalogue-delta.mjs';
import { SCHEMA as C4_SCHEMA } from '../../catalogue-identity/crosswalk.mjs';
import { HVI_IDENTITY_INPUT_SCHEMA, HviIdentityError } from './index.mjs';

const canon = (x) => Array.isArray(x) ? x.map(canon) :
  x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])])) : x;
const digest = (x) => createHash('sha256').update(JSON.stringify(canon(x))).digest('hex');
const ID=/^(?:cap:[a-z0-9][a-z0-9.-]*|[a-z0-9][a-z0-9._-]*@\d+(?:\.\d+)*)$/;
const ensure=(ok,code)=>{if(!ok)throw new HviIdentityError(code);};
function checkPin(pin){
  ensure(pin&&/^[a-f0-9]{40}$/.test(pin.resolvedCommitSha)&&typeof pin.pinId==='string'&&typeof pin.repoIdentity==='string','PIN_NOT_FOUND');
}
/**
 * Existing catalogue-delta source is a distinct schema and has no canonical
 * identity assertion for arbitrary record IDs. Map these as source records.
 * Its digest is validated by the existing exported read-only query first.
 * The caller must separately attest that the selected pin includes the input
 * catalogue; a catalogue claim alone cannot authorize a new Git pin.
 */
export function adaptCatalogueDeltaToHvi({envelope,pin}){
  checkPin(pin);
  ensure(envelope?.schema===CATALOGUE_SCHEMA,'ID_CONFLICT');
  try { queryCatalogueSnapshot(envelope,{limit:0}); } // existing digest check
  catch { throw new HviIdentityError('DIGEST_CONFLICT'); }
  const sources=new Map(envelope.sources.map(s=>[s.id,s]));
  const records=envelope.records.map(r=>{
    const s=sources.get(r.sourceId);
    ensure(s,'ID_CONFLICT');
    const all=(r.evidence??[]).map(e=>e.ref);
    if(!all.length)all.push('catalogue-digest:'+envelope.digest);
    return {pinId:pin.pinId,sourceScopedRecordId:r.sourceId+':'+r.id,
      type:'catalogue',name:r.id,canonicalId:ID.test(r.id)?r.id:null,owner:s.owner,
      implementationDigest:r.contentDigest,evidenceRefs:all,
      legacy:{schema:CATALOGUE_SCHEMA,sourceRevisionClaim:r.sourceRevision,status:r.status,
        tombstoneClaim:r.tombstone??null}};
  });
  return {schema:HVI_IDENTITY_INPUT_SCHEMA,pins:[pin],records,links:[],advisory:{
    sourceSchema:CATALOGUE_SCHEMA,validation:'existing catalogue digest verified',
    sourceRevision:'legacy claim only, not a Git SHA substitute',runtime:'UNRUN'}};
}
/**
 * Original C4 crosswalk can hold many source repos/revisions. Require an
 * independently resolved pin for every included source; never map all C4 rows
 * to ARBOR's pin or rely on a branch name.
 */
export function adaptC4CrosswalkToHvi({snapshot,pinsBySourceId}){
  ensure(snapshot?.schema===C4_SCHEMA,'ID_CONFLICT');
  const {snapshot_sha256,...body}=snapshot;
  ensure(digest(body)===snapshot_sha256,'DIGEST_CONFLICT');
  ensure(pinsBySourceId&&typeof pinsBySourceId==='object','PIN_NOT_FOUND');
  const pinMap=new Map(),pins=[];
  for(const s of snapshot.sources){
    const p=pinsBySourceId[s.id];
    checkPin(p);
    ensure(s.repository===p.repoIdentity&&s.revision===p.resolvedCommitSha,'PIN_MOVED');
    pinMap.set(s.id,p);
    if(!pins.some(x=>x.pinId===p.pinId))pins.push(p);
  }
  const records=snapshot.records.filter(r=>r.visibility==='observed').map(r=>{
    const pin=pinMap.get(r.source_id);
    ensure(pin,'PIN_NOT_FOUND');
    return {pinId:pin.pinId,sourceScopedRecordId:r.source_id+':'+r.source_item_id,
      type:r.type,name:r.name,canonicalId:r.canonical_id,owner:r.authority_claim,
      evidenceRefs:r.evidence.length?r.evidence.map(e=>e.ref):['c4-snapshot:'+snapshot_sha256],
      legacy:{schema:C4_SCHEMA,rowId:r.id,sourceRevision:r.source_revision,
        tombstoneClaim:r.tombstone??null}};
  });
  const sourceRows=new Map(snapshot.records.map(r=>[r.id,r]));
  const links=snapshot.edges.filter(e=>e.relation!=='identifies').flatMap(e=>{
    const from=sourceRows.get(e.from),to=sourceRows.get(e.to);
    if(!from||!to||!pinMap.has(from.source_id)||!pinMap.has(to.source_id))return [];
    return [{pinId:pinMap.get(from.source_id).pinId,sourceScopedRecordId:from.source_id+':'+from.source_item_id,
      targetPinId:pinMap.get(to.source_id).pinId,targetSourceScopedRecordId:to.source_id+':'+to.source_item_id,
      relation:e.relation}];
  });
  return {schema:HVI_IDENTITY_INPUT_SCHEMA,pins,records,links,advisory:{
    sourceSchema:C4_SCHEMA,validation:'source digest verified',canonical:'source declarations only',
    ownerDecisions:'not auto-adopted',runtime:'UNRUN'}};
}

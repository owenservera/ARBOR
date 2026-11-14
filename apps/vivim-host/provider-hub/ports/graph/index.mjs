// Provider Hub W1-E — injectable, mock-only graph PROPOSAL port; never a writer.
import { createHash } from 'node:crypto';
export const GRAPH_PORT_SCHEMA = 'arbor.provider-hub.graph-port/1';
export const GRAPH_PROPOSAL_SCHEMA = 'arbor.provider-hub.graph-proposal/1';
export const MOCK_GRAPH_CHECK_SCHEMA = 'arbor.provider-hub.graph-mock-check/1';
export const RUST_SCOPED_RECORD_SCHEMA = 'hqkg.scoped-record/1';
export const MOCK_ONLY = 'MOCK_ONLY';
export class GraphPortError extends Error { constructor(code) { super(code); this.code=code; this.name='GraphPortError'; } }
const deny = code => { throw new GraphPortError(code); };
const obj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const str = (v,max,code) => { if (typeof v!=='string'||!v||Buffer.byteLength(v)>max||/[\x00-\x1f\x7f-\x9f]/u.test(v)) deny(code); return v; };
const positive = v => Number.isSafeInteger(v) && v>0;
const epoch = v => Number.isSafeInteger(v) && v>=0;
const hash = v => createHash('sha256').update(v).digest('hex');
const stable = v => Array.isArray(v)?v.map(stable):obj(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const digest = v => hash(JSON.stringify(stable(v)));
export function personalNamespace(owner) { str(owner,80,'GRAPH_NAMESPACE_INVALID'); const prefix='personal:'+Buffer.byteLength(owner)+':'+owner+'/'; if(Buffer.byteLength(prefix)>180)deny('GRAPH_NAMESPACE_INVALID');return {namespace:{domain:'personal',owner},prefix}; }
export const expectedFrom = a => ({ owner:a.owner,worldId:a.worldId,graphEpoch:a.graphEpoch,accountRef:a.accountRef,accountEpoch:a.accountEpoch,grantRevision:a.grantRevision });
function authority(raw){
 if(!obj(raw)||raw.mode!==MOCK_ONLY)deny('GRAPH_AUTHORITY_UNAVAILABLE');
 const a={owner:str(raw.owner,80,'GRAPH_NAMESPACE_INVALID'),worldId:str(raw.worldId,80,'GRAPH_WORLD_INVALID'),accountRef:str(raw.accountRef,200,'GRAPH_ACCOUNT_INVALID'),graphEpoch:raw.graphEpoch,accountEpoch:raw.accountEpoch,grantRevision:raw.grantRevision};
 if(!a.accountRef.startsWith('synthetic://'))deny('GRAPH_MOCK_ACCOUNT_REQUIRED');
 if(!epoch(a.graphEpoch)||!positive(a.accountEpoch)||!positive(a.grantRevision))deny('GRAPH_REVISION_INVALID');
 if(raw.sessionState!=='active'||raw.identityVerified!==true)deny('GRAPH_IDENTITY_UNVERIFIED');
 if(raw.grantState!=='active'||raw.graphReadAllowed!==true)deny('GRAPH_GRANT_DENIED');
 return a;
}
function sameRevision(e,a){
 if(!obj(e))deny('GRAPH_EXPECTED_REVISION_REQUIRED');
 if(e.owner!==a.owner||e.worldId!==a.worldId)deny('GRAPH_CROSS_WORLD');
 if(e.accountRef!==a.accountRef||e.accountEpoch!==a.accountEpoch)deny('GRAPH_ACCOUNT_STALE');
 if(e.graphEpoch!==a.graphEpoch||e.grantRevision!==a.grantRevision)deny('GRAPH_REVISION_STALE');
}
function records(rows,a){
 if(!Array.isArray(rows)||rows.length===0||rows.length>100)deny('GRAPH_BATCH_INVALID');
 const unique=new Map();
 for(const r of rows){
  if(!obj(r))deny('GRAPH_SOURCE_INVALID');
  if(Object.keys(r).some(k=>!['providerId','accountRef','sourceRef','sourceRevision','provenanceDigest','coverage'].includes(k)))deny('GRAPH_PRIVATE_PAYLOAD_REFUSED');
  str(r.providerId,80,'GRAPH_PROVIDER_INVALID');str(r.accountRef,200,'GRAPH_ACCOUNT_INVALID');
  if(r.accountRef!==a.accountRef)deny('GRAPH_ACCOUNT_STALE');
  str(r.sourceRef,256,'GRAPH_SOURCE_INVALID');if(!r.sourceRef.startsWith('synthetic://'))deny('GRAPH_MOCK_SOURCE_REQUIRED');
  if(!positive(r.sourceRevision)||typeof r.provenanceDigest!=='string'||!(/^[a-f0-9]{64}$/).test(r.provenanceDigest))deny('GRAPH_PROVENANCE_INVALID');
  if(r.coverage!=='complete')deny('GRAPH_PARTIAL_SOURCE');
  if(unique.has(r.sourceRef)&&digest(unique.get(r.sourceRef))!==digest(r))deny('GRAPH_SOURCE_CONFLICT');
  unique.set(r.sourceRef,r);
 }
 return [...unique.values()].sort((a,b)=>a.sourceRef<b.sourceRef?-1:a.sourceRef>b.sourceRef?1:0);
}
/** Pure Rust-shaped projection, NOT Rust serialization, a Host grant or a graph commit. */
export function buildSourceGraphProposal({authority:a,records:rows}){
 if(!a)deny('GRAPH_AUTHORITY_UNAVAILABLE');
 const {namespace,prefix}=personalNamespace(a.owner);
 const ops=records(rows,a).map(r=>{
  const id=prefix+'source-'+hash(r.providerId+'\0'+r.accountRef+'\0'+r.sourceRef).slice(0,40);
  if(Buffer.byteLength(id)>256)deny('GRAPH_SOURCE_ID_OVERSIZE');
  return {op:'PutNode',node:{id,kind:'Document',title:'Provider source reference',sources:[r.sourceRef],properties:{'hqkg.contract':RUST_SCOPED_RECORD_SCHEMA,'hqkg.namespace':'personal:'+a.owner,'hqkg.provenance.source':r.sourceRef,'hqkg.provenance.revision':String(r.sourceRevision),'hqkg.provenance.digest':r.provenanceDigest}}};
 });
 const expected=expectedFrom(a),contentDigest=digest({namespace,expected,ops});
 return {schema:GRAPH_PROPOSAL_SCHEMA,mode:MOCK_ONLY,targetContract:RUST_SCOPED_RECORD_SCHEMA,target:'native/hqkg/src/scoped_graph.rs::apply_scoped',namespace,expectedRevision:{namespace,graph_epoch:a.graphEpoch},expected,proposalRef:'synthetic://provider-hub/graph-proposals/'+contentDigest,contentDigest,changeSet:{change_set_id:prefix+'provider-hub-'+contentDigest.slice(0,48),parent_change_set_id:null,source:'synthetic://provider-hub/graph',ops},proposedOnly:true,effectsAuthorized:false,persistRequested:false};
}
/** Host-supplied callbacks required. No persistence, browser access or implicit fallback. */
export function createMockGraphPort({readAuthority,verifySourceRef,fault=()=> 'none'}={}){
 if(typeof readAuthority!=='function'||typeof verifySourceRef!=='function'||typeof fault!=='function')deny('GRAPH_INJECTED_PORTS_REQUIRED');
 const injected=point=>{let f;try{f=fault(point);}catch{deny('GRAPH_FAULT_UNAVAILABLE');}if(f==='none')return;if(f==='denied')deny('GRAPH_GRANT_DENIED');if(f==='offline')deny('GRAPH_SOURCE_OFFLINE');if(f==='partial')deny('GRAPH_PARTIAL_SOURCE');if(f==='uncertain')deny('GRAPH_UNCERTAIN_NO_RETRY');deny('GRAPH_FAULT_INVALID');};
 const snapshot=async()=>{try{return authority(await readAuthority());}catch(e){if(e instanceof GraphPortError)throw e;deny('GRAPH_AUTHORITY_UNAVAILABLE');}};
 const attest=async(rows,e)=>{
  injected('before-attest');const first=await snapshot();sameRevision(e,first);const clean=records(rows,first);
  for(const r of clean){let verdict;try{verdict=await verifySourceRef(r,{...first});}catch{deny('GRAPH_EVIDENCE_UNAVAILABLE');}if(verdict!==true)deny('GRAPH_EVIDENCE_REFUSED');}
  const after=await snapshot();sameRevision(e,after);injected('after-attest');return {after,clean};
 };
 return Object.freeze({schema:GRAPH_PORT_SCHEMA,mode:MOCK_ONLY,
  async propose({expected,sources}={}){const {after,clean}=await attest(sources,expected);return buildSourceGraphProposal({authority:after,records:clean});},
  async check({proposal,sources}={}){
   if(!proposal||proposal.schema!==GRAPH_PROPOSAL_SCHEMA||proposal.mode!==MOCK_ONLY||proposal.proposedOnly!==true||proposal.effectsAuthorized!==false)deny('GRAPH_PROPOSAL_INVALID');
   const {after,clean}=await attest(sources,proposal.expected),fresh=buildSourceGraphProposal({authority:after,records:clean});
   if(digest(proposal)!==digest(fresh))deny('GRAPH_PROPOSAL_TAMPERED');
   injected('before-check-result');return Object.freeze({schema:MOCK_GRAPH_CHECK_SCHEMA,mode:MOCK_ONLY,status:'MOCK_VALIDATED',proposalRef:fresh.proposalRef,graphEpoch:after.graphEpoch,applied:false,persisted:false,effectsAuthorized:false,rustValidated:false,hostCommitted:false,mockReceipt:false});
  }
 });
}

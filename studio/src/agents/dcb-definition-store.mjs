// Host-owned DCB definition persistence on existing VersionedStore.
// Stores identifiers and lifecycle metadata only. NOT a memory store, grant, or sender.
import path from 'node:path';
import { createHash } from 'node:crypto';
import { VersionedStore } from '../store/versioned.mjs';
import {
  DCB_DEFINITION_SCHEMA, createDcbDefinition, reviseDcbDefinition,
  createCompositeDcbDefinition, assessDcbDefinition,
} from '../../../harness/src/context/dcb-lifecycle.mjs';

export const DCB_RECORD_SCHEMA = 'vivim.dcb-definition-record/1';
const refRe = /^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/;
const fail = (code, msg) => Object.assign(new Error(msg), { code });
const ref = id => {
  if (typeof id !== 'string' || !refRe.test(id)) throw fail('DCB_STORE_REF','Invalid DCB ID');
  return id;
};
const nameFor = id => 'dcb-' + createHash('sha256').update(ref(id)).digest('hex').slice(0,40);
const iso = t => typeof t === 'string' && Number.isFinite(Date.parse(t)) && new Date(t).toISOString() === t;
const uniq = a => [...new Set(a)].sort();

export function createDcbDefinitionStore({ paths, ownerRef, store, clock = () => new Date().toISOString() } = {}) {
  ref(ownerRef);
  if (!store && (!paths?.root || !path.isAbsolute(paths.root))) throw fail('DCB_STORE_ROOT','Absolute Host root required');
  const db = store ?? new VersionedStore(path.join(paths.root,'context','dcb-definitions'),{kind:'DCB definition'});
  if (['has','load','names','compareAndSave'].some(x=>typeof db[x]!=='function'))
    throw fail('DCB_STORE_ADAPTER','VersionedStore-compatible storage required');
  const now = () => {
    const t = clock();
    if (!iso(t)) throw fail('DCB_STORE_TIME','Clock must be canonical UTC');
    return t;
  };
  function get(id) {
    const n = nameFor(id);
    if (!db.has(n)) return null;
    const row = db.load(n);
    const d = row?.definition;
    if (row?.schema!==DCB_RECORD_SCHEMA || row.name!==n || !Number.isSafeInteger(row.version)
      || d?.schema!==DCB_DEFINITION_SCHEMA || d.id!==id || d.ownerRef!==ownerRef
      || d.revision!==row.version || !iso(d.createdAt) || !iso(d.updatedAt)
      || d.updatedAt<d.createdAt || !['active','suspended','retired'].includes(d.status))
      throw fail('DCB_STORE_CORRUPT','Version, identity, owner or state mismatch');
    const normalized = createDcbDefinition(d);
    const expected = {...normalized,status:d.status,revision:d.revision,updatedAt:d.updatedAt};
    if (JSON.stringify(expected)!==JSON.stringify(d))
      throw fail('DCB_STORE_CORRUPT','Noncanonical or extra metadata fields');
    return Object.freeze(structuredClone(d));
  }
  function persist(d, expectedVersion, description) {
    const row = db.compareAndSave(nameFor(d.id),
      {schema:DCB_RECORD_SCHEMA,definition:d},{expectedVersion,changeNote:description});
    if (row.version!==d.revision) throw fail('DCB_STORE_REVISION','Storage revision mismatch');
    return Object.freeze(structuredClone(d));
  }
  function create(input) {
    if (!input || typeof input!=='object' || Array.isArray(input)) throw fail('DCB_STORE_INPUT','Expected object');
    if (db.names().filter(n=>/^dcb-[a-f0-9]{40}$/.test(n)).length>=500)
      throw fail('DCB_STORE_CAP','Definition limit reached');
    const d = createDcbDefinition({...input,ownerRef,createdAt:input.createdAt ?? now()});
    return persist(d,null,'DCB definition created');
  }
  // Read-only ancestry preview. A candidate source union is NEVER an authorization.
  function resolve(id,{at=now(),override=null}={}) {
    if (!iso(at)) throw fail('DCB_STORE_TIME','Invalid timestamp');
    const pending=new Set(), seen=new Map(), sources=[], flavors=[];
    const visit=(id,depth)=>{
      if (pending.has(id)) throw fail('DCB_STORE_CYCLE','Cyclic composite');
      if (seen.has(id)) return;
      if (depth>16 || seen.size+pending.size>500) throw fail('DCB_STORE_CAP','Ancestry too large');
      const d=override?.id===id ? override : get(id);
      if (!d) throw fail('DCB_STORE_MISSING','Missing definition');
      if (assessDcbDefinition(d,{at}).status!=='candidate_current')
        throw fail('DCB_STORE_INACTIVE','Inactive or expired definition');
      pending.add(id);
      if (d.mode==='composite') for(const p of d.parentRefs) visit(p,depth+1);
      else sources.push(...d.sourceRefs);
      flavors.push(...d.flavorRefs);
      pending.delete(id);
      seen.set(id,d.revision);
    };
    visit(id,0);
    const sourceRefs=uniq(sources);
    if (sourceRefs.length>250) throw fail('DCB_STORE_CAP','Too many sources');
    return Object.freeze({
      schema:'vivim.dcb-resolution/1',bundleId:id,sourceRefs,flavorRefs:uniq(flavors),
      dependencies:[...seen].map(([ref,revision])=>({ref,revision})),
      authority:'read_only_projection',isSendAuthorized:false,
    });
  }
  function revise(id,patch,{expectedRevision,at=now()}={}) {
    const prev=get(id);
    if (!prev) throw fail('DCB_STORE_MISSING','Definition not found');
    const next=reviseDcbDefinition(prev,patch,{expectedRevision,at});
    if (next===prev) return prev;
    if (next.status==='active' && next.mode==='composite') resolve(id,{at,override:next});
    return persist(next,prev.revision,'DCB definition revised');
  }
  function composite({id,parentIds,flavorRefs,policyVersion,activityRef=null,expiresAt=null,createdAt=now()}={}) {
    if (!Array.isArray(parentIds) || parentIds.length<2)
      throw fail('DCB_STORE_PARENT','Two parents required');
    const parents=parentIds.map(id=>get(id));
    if (parents.some(x=>!x)) throw fail('DCB_STORE_MISSING','Missing parent');
    for(const p of parents) resolve(p.id,{at:createdAt});
    const d=createCompositeDcbDefinition({id,parents,flavorRefs,policyVersion,activityRef,expiresAt,createdAt});
    resolve(d.id,{at:createdAt,override:d});
    return create(d);
  }
  function list({limit=100,status}={}) {
    if (!Number.isSafeInteger(limit)||limit<1||limit>500) throw fail('DCB_STORE_LIMIT','Invalid limit');
    if (status!==undefined && !['active','suspended','retired'].includes(status))
      throw fail('DCB_STORE_STATUS','Invalid status');
    const names=db.names().filter(n=>/^dcb-[a-f0-9]{40}$/.test(n));
    if (names.length>500) throw fail('DCB_STORE_CAP','Excessive definitions');
    const rows=names.map(n=>{
      const row=db.load(n),id=row?.definition?.id;
      if (nameFor(id)!==n) throw fail('DCB_STORE_CORRUPT','Index collision or invalid ID');
      return get(id);
    }).filter(d=>status===undefined||d.status===status).sort((a,b)=>a.id.localeCompare(b.id));
    return {items:rows.slice(0,limit),truncated:rows.length>limit};
  }
  return Object.freeze({get,create,revise,composite,resolve,list});
}

# File: studio/src/agents/dcb-definition-store.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/agents/dcb-definition-store.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6795 B |
| Lines | 122 |
| Hash | bcc41da59faa |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DCB_RECORD_SCHEMA | const | 11 | yes | export const DCB_RECORD_SCHEMA = &#39;vivim.dcb-definition-record/1&#39;; |
| refRe | const | 12 | no | const refRe = /^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/; |
| fail | function | 13 | no | const fail = (code, msg) =&gt; Object.assign(new Error(msg), { code }); |
| ref | function | 14 | no | const ref = id =&gt; { |
| nameFor | function | 18 | no | const nameFor = id =&gt; &#39;dcb-&#39; + createHash(&#39;sha256&#39;).update(ref(id)).digest(&#39;hex&#39;).slice(0,40); |
| iso | function | 19 | no | const iso = t =&gt; typeof t === &#39;string&#39; &amp;&amp; Number.isFinite(Date.parse(t)) &amp;&amp; new Date(t).toISOString() === t; |
| uniq | function | 20 | no | const uniq = a =&gt; [...new Set(a)].sort(); |
| createDcbDefinitionStore | function | 22 | yes | export function createDcbDefinitionStore({ paths, ownerRef, store, clock = () =&gt; new Date().toISOString() } = {}) { |
| db | const | 25 | no | const db = store ?? new VersionedStore(path.join(paths.root,&#39;context&#39;,&#39;dcb-definitions&#39;),{kind:&#39;DCB definition&#39;}); |
| now | function | 28 | no | const now = () =&gt; { |
| t | const | 29 | no | const t = clock(); |
| get | function | 33 | no | function get(id) { |
| n | const | 34 | no | const n = nameFor(id); |
| row | const | 36 | no | const row = db.load(n); |
| d | const | 37 | no | const d = row?.definition; |
| normalized | const | 43 | no | const normalized = createDcbDefinition(d); |
| expected | const | 44 | no | const expected = {...normalized,status:d.status,revision:d.revision,updatedAt:d.updatedAt}; |
| persist | function | 49 | no | function persist(d, expectedVersion, description) { |
| row | const | 50 | no | const row = db.compareAndSave(nameFor(d.id), {schema:DCB_RECORD_SCHEMA,definition:d},{expectedVersion,changeNote:description}); |
| create | function | 55 | no | function create(input) { |
| d | const | 59 | no | const d = createDcbDefinition({...input,ownerRef,createdAt:input.createdAt ?? now()}); |
| resolve | function | 63 | no | function resolve(id,{at=now(),override=null}={}) { |
| pending | const | 65 | no | const pending=new Set(), seen=new Map(), sources=[], flavors=[]; |
| visit | function | 66 | no | const visit=(id,depth)=&gt;{ |
| d | const | 70 | no | const d=override?.id===id ? override : get(id); |
| sourceRefs | const | 82 | no | const sourceRefs=uniq(sources); |
| revise | function | 90 | no | function revise(id,patch,{expectedRevision,at=now()}={}) { |
| prev | const | 91 | no | const prev=get(id); |
| next | const | 93 | no | const next=reviseDcbDefinition(prev,patch,{expectedRevision,at}); |
| composite | function | 98 | no | function composite({id,parentIds,flavorRefs,policyVersion,activityRef=null,expiresAt=null,createdAt=now()}={}) { |
| parents | const | 101 | no | const parents=parentIds.map(id=&gt;get(id)); |
| d | const | 104 | no | const d=createCompositeDcbDefinition({id,parents,flavorRefs,policyVersion,activityRef,expiresAt,createdAt}); |
| list | function | 108 | no | function list({limit=100,status}={}) { |
| names | const | 112 | no | const names=db.names().filter(n=&gt;/^dcb-[a-f0-9]{40}$/.test(n)); |
| rows | const | 114 | no | const rows=names.map(n=&gt;{ const row=db.load(n),id=row?.definition?.id; if (nameFor(id)!==n) throw fail(&#39;DCB_STORE_CORRUPT&#39;,&#39;Index collision or invalid ID&#39;); return get(id); }).filter(d=&gt;status===unde… |
| row | const | 115 | no | const row=db.load(n),id=row?.definition?.id; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 3 | external |
| node:crypto | import | 4 | external |
| ../store/versioned.mjs | import | 5 | [studio/src/store/versioned.mjs](../store/versioned.mjs.md) |
| ../../../harness/src/context/dcb-lifecycle.mjs | import | 6 | [harness/src/context/dcb-lifecycle.mjs](../../../harness/src/context/dcb-lifecycle.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/agents/dcb-context-runtime.mjs](./dcb-context-runtime.mjs.md) | ./dcb-definition-store.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 123 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

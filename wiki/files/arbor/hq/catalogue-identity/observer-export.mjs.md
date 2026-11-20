# File: hq/catalogue-identity/observer-export.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/catalogue-identity/observer-export.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3472 B |
| Lines | 58 |
| Hash | 66dadd221089 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sha | function | 9 | no | const sha = x =&gt; createHash(&#39;sha256&#39;).update(x).digest(&#39;hex&#39;); |
| cmp | function | 10 | no | const cmp = (a,b) =&gt; a&lt;b?-1:a&gt;b?1:0; |
| stable | function | 11 | no | function stable(x){ |
| sorted | function | 16 | no | const sorted = arr =&gt; [...arr].sort((a,b)=&gt;a.id &lt; b.id?-1:a.id &gt; b.id?1:0); |
| observerExport | function | 23 | yes | export function observerExport(snapshot, {allowSourceIds=[]}={}) { |
| allow | const | 28 | no | const allow=new Set(allowSourceIds); |
| sources | const | 29 | no | const sources=sorted(snapshot.sources.filter(s=&gt;allow.has(s.id)).map(s=&gt;({ id:s.id,repository:s.repository,revision:s.revision,completeness:s.completeness, lifecycle:s.lifecycle, }))); |
| visible | const | 33 | no | const visible=sorted(snapshot.records.filter(r=&gt;allow.has(r.source_id)).map(r=&gt;({ id:r.id,source_id:r.source_id,type:r.type,name:r.name, canonical_id:r.canonical_id,visibility:r.visibility,lifecycle:… |
| ids | const | 38 | no | const ids=new Set(visible.map(r=&gt;r.id)); |
| edges | const | 39 | no | const edges=sorted(snapshot.edges.filter(e=&gt;ids.has(e.from) &amp;&amp; (ids.has(e.to)\|\| (e.relation===&#39;identifies&#39; &amp;&amp; visible.some(r=&gt;r.id===e.from &amp;&amp; r.canonical_id===e.to)))) .map(e=&gt;({id:e.id,from:e.from,… |
| dupe | const | 42 | no | const dupe=sorted(snapshot.duplicate_candidates.filter(x=&gt;ids.has(x.left)&amp;&amp;ids.has(x.right)) .map(x=&gt;({id:x.id,left:x.left,right:x.right,kind:x.kind, confidence:x.confidence,disposition:x.disposition… |
| orphans | const | 45 | no | const orphans=sorted(snapshot.orphan_findings.filter(x=&gt;ids.has(x.record_id)).map(x=&gt;({ id:x.id,kind:x.kind,record_id:x.record_id,certainty:x.certainty,reason:x.reason, }))); |
| conflicts | const | 48 | no | const conflicts=sorted(snapshot.authority_conflicts.filter(x=&gt;x.record_ids.every(id=&gt;ids.has(id))) .map(x=&gt;({id:x.id,kind:x.kind,canonical_id:x.canonical_id, record_ids:x.record_ids,resolution:x.reso… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 7 | external |
| ./crosswalk.mjs | import | 8 | [hq/catalogue-identity/crosswalk.mjs](./crosswalk.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/catalogue-identity/test/crosswalk.test.mjs](./test/crosswalk.test.mjs.md) | ../observer-export.mjs |
| [hq/version-intelligence/identity/test/identity.test.mjs](../version-intelligence/identity/test/identity.test.mjs.md) | ../../../catalogue-identity/observer-export.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Explicit allowlist projection of HQ crosswalk for Labs observers. |
| 3 | owner | repos-hq | — | repos-hq |
| 4 | task | — | — | VIVIM-WAVE-C4-LANE-B |
| 5 | invariant | — | — | No unapproved private source content or raw evidence leaves HQ. |

## Excerpt

```javascript
// @ts-check
/** @hq:context Explicit allowlist projection of HQ crosswalk for Labs observers.
 * @hq:owner repos-hq
 * @hq:task VIVIM-WAVE-C4-LANE-B
 * @hq:invariant No unapproved private source content or raw evidence leaves HQ.
 */
import { createHash } from 'node:crypto';
import { SCHEMA } from './crosswalk.mjs';
const sha = x => createHash('sha256').update(x).digest('hex');
const cmp = (a,b) => a<b?-1:a>b?1:0;
function stable(x){
  if(Array.isArray(x))return x.map(stable);
  if(x&&typeof x==='object')return Object.fromEntries(Object.keys(x).sort(cmp).map(k=>[k,stable(x[k])]));
  return x;
}
const sorted = arr => [...arr].sort((a,b)=>a.id < b.id?-1:a.id > b.id?1:0);
/**
 * Projection for Labs dashboards. Caller must explicitly allow each source ID.
 * Suppressed records remain counted as withheld, but their names, locators,
 * evidence, reviewer identities, raw record IDs, and graph links never leave.
 * This function never changes authoritative HQ data or activation status.
 */
export function observerExport(snapshot, {allowSourceIds=[]}={}) {
  if (snapshot?.schema!==SCHEMA) throw new Error('invalid_snapshot');
  const {snapshot_sha256, ...body}=snapshot;
  if (sha(JSON.stringify(stable(body)))!==snapshot_sha256) throw new Error('invalid_snapshot_digest');
  if(!Array.isArray(allowSourceIds)||allowSourceIds.some(id=>typeof id!=='string'))throw new Error('invalid_source_allowlist');
  const allow=new Set(allowSourceIds);
  const sources=sorted(snapshot.sources.filter(s=>allow.has(s.id)).map(s=>({
    id:s.id,repository:s.repository,revision:s.revision,completeness:s.completeness,
    lifecycle:s.lifecycle,
  })));
  const visible=sorted(snapshot.records.filter(r=>allow.has(r.source_id)).map(r=>({
    id:r.id,source_id:r.source_id,type:r.type,name:r.name,
    canonical_id:r.canonical_id,visibility:r.visibility,lifecycle:r.lifecycle,
    source_revision:r.source_revision,
  })));
  const ids=new Set(visible.map(r=>r.id));
  const edges=sorted(snapshot.edges.filter(e=>ids.has(e.from) && (ids.has(e.to)||
    (e.relation==='identifies' && visible.some(r=>r.id===e.from && r.canonical_id===e.to))))
    .map(e=>({id:e.id,from:e.from,to:e.to,relation:e.relation,confidence:e.confidence})));
  const dupe=sorted(snapshot.duplicate_candidates.filter(x=>ids.has(x.left)&&ids.has(x.right))
    .map(x=>({id:x.id,left:x.left,right:x.right,kind:x.kind,
      confidence:x.confidence,disposition:x.disposition,reason:x.reason})));
  const orphans=sorted(snapshot.orphan_findings.filter(x=>ids.has(x.record_id)).map(x=>({
    id:x.id,kind:x.kind,record_id:x.record_id,certainty:x.certainty,reason:x.reason,
  })));
  const conflicts=sorted(snapshot.authority_conflicts.filter(x=>x.record_ids.every(id=>ids.has(id)))
    .map(x=>({id:x.id,kind:x.kind,canonical_id:x.canonical_id,
      record_ids:x.record_ids,resolution:x.resolution})));
  return {schema:'hq.catalogue-observer/1',hq_snapshot_sha256:snapshot.snapshot_sha256,
    sources,records:visible,edges,duplicate_candidates:dupe,orphan_findings:orphans,
    authority_conflicts:conflicts,
    counts:{visible_records:visible.length,withheld_records:snapshot.records.length-visible.length,
      visible_sources:sources.length,withheld_sources:snapshot.sources.length-sources.length},
    policy:{projection:'explicit_source_allowlist',production:'not_inferred',
      permissions:'none',owner:'repos-hq',consumer:'vivim-labs'}};
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

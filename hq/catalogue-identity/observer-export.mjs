// @ts-check
/** @hq:context Explicit allowlist projection of HQ crosswalk for Labs observers.
 * @hq:owner repos-hq
 * @hq:task VIVIM-WAVE-C4-LANE-B
 * @hq:invariant No unapproved private source content or raw evidence leaves HQ.
 */
import { createHash } from 'node:crypto';
import { SCHEMA } from './crosswalk.mjs';
const sha = x => createHash('sha256').update(x).digest('hex');
const sorted = arr => [...arr].sort((a,b)=>a.id < b.id?-1:a.id > b.id?1:0);
/**
 * Projection for Labs dashboards. Caller must explicitly allow each source ID.
 * Suppressed records remain counted as withheld, but their names, locators,
 * evidence, reviewer identities, raw record IDs, and graph links never leave.
 * This function never changes authoritative HQ data or activation status.
 */
export function observerExport(snapshot, {allowSourceIds=[]}={}) {
  if (snapshot?.schema!==SCHEMA) throw new Error('invalid_snapshot');
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

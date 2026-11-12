// @ts-check
/**
 * @hq:context Lane C4-B deterministic, read-only catalogue identity and orphan projection.
 * @hq:owner repos-hq
 * @hq:task VIVIM-WAVE-C4-LANE-B
 * @hq:invariant Source IDs, owner authority, and tombstones are never invented or auto-promoted.
 * @hq:invariant A candidate duplicate is not a merged entity; missing sources cannot delete facts.
 * @hq:invariant No files, network, database, browser, provider API or Host effects.
 * @hq:see hq/lib/semantic-registry.mjs
 * @hq:see research/agentic-knowledge-graph/HQKG-INTEGRATION.md
 */
import { createHash } from 'node:crypto';

export const SCHEMA = 'hq.catalogue-crosswalk/1';
export const RECORD_TYPES = Object.freeze([
  'capability', 'tracker', 'implementation', 'file', 'consumer', 'algorithm',
  'test', 'research', 'release', 'deployment', 'schema', 'catalogue',
]);
export const LINK_TYPES = Object.freeze([
  'implements', 'tracks', 'consumes', 'tests', 'researches', 'releases',
  'deploys', 'depends_on', 'documents', 'references', 'equivalent_candidate',
]);
export const EVIDENCE_TYPES = Object.freeze([
  'source_record', 'source_file', 'test_result', 'research', 'release',
  'deployment', 'runtime_receipt', 'owner_decision',
]);
const COMPARE = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const SORT = (a, b) => COMPARE(a.id, b.id);
const KEY_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9:._@/+#-]{0,239}$/;
const CANON_PATTERN = /^(?:cap:[a-z0-9][a-z0-9.-]*|[a-z0-9][a-z0-9._-]*@\d+(?:\.\d+)*)$/;
const SECRET = /(^|[/\\])(?:\.env[^/\\]*|[^/\\]+\.env|[^/\\]+\.(?:keystore|pem|p12)|session\.json|storage-state\.json|release-profile\.json|cookies|login data)(?:[/\\]|$)/i;
const BAD = new Set(['secret', 'restricted', 'credential']);
const STOP = new Set('the a an and or of to in for with by on from into new old one existing current future system feature capability tool ability proposed actual journey'.split(' '));
const SEMANTIC_TYPES = new Set(['capability','tracker','implementation','consumer','algorithm','research','schema']);
const MAX_RECORDS = 100000;
const MAX_PAIRS = 15000;
const MAX_DUPLICATES = 10000;

const sha = (x) => createHash('sha256').update(x).digest('hex');
const digest = (x) => sha(JSON.stringify(stable(x)));
function stable(x) {
  if (Array.isArray(x)) return x.map(stable);
  if (x && typeof x === 'object') return Object.fromEntries(Object.keys(x).sort(COMPARE).map(k => [k, stable(x[k])]));
  return x;
}
function text(x, field, limit = 1000) {
  if (typeof x !== 'string' || !x.trim() || x.length > limit || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(x)) throw new Error(`invalid_${field}`);
  return x.trim();
}
function key(x, field) { const v = text(x, field, 240); if (!KEY_PATTERN.test(v)) throw new Error(`invalid_${field}`); return v; }
function safeRef(x, field) {
  const v = text(x, field, 2048);
  if (SECRET.test(v) || v.includes('..\\') || v.includes('../') || /(?:token|password|authorization|api[_-]?key)=/i.test(v)) throw new Error(`unsafe_${field}`);
  return v;
}
function sourceKey(sourceId, sourceItemId) { return `row:${sha(`${sourceId}\0${sourceItemId}`).slice(0, 32)}`; }
export const stableRecordId = sourceKey;
const normalized = x => String(x).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
const tokens = x => new Set(normalized(x).split(' ').filter(t => t.length > 2 && !STOP.has(t)));
function intersection(a, b) { let n = 0; for (const t of a) if (b.has(t)) n++; return n; }
const pairId = (a, b) => `pair:${sha([a,b].sort(COMPARE).join('\0')).slice(0,32)}`;
function date(x, field) { const v = text(x, field, 40); if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(v) || !Number.isFinite(Date.parse(v))) throw new Error(`invalid_${field}`); return v; }
function evidenceRow(ev, owner, revision) {
  if (!ev || !EVIDENCE_TYPES.includes(ev.kind)) throw new Error('invalid_evidence_kind');
  const ref = safeRef(ev.ref, 'evidence_ref');
  const id = `ev:${sha(`${owner}\0${ev.kind}\0${ref}\0${revision}`).slice(0,32)}`;
  return { id, kind: ev.kind, ref, source_revision: revision, status: ev.status ?? 'observed', source_record: owner };
}
function unique(items, field) {
  const map = new Map();
  for (const item of items) {
    const old = map.get(item.id);
    if (old && digest(old) !== digest(item)) throw new Error(`conflicting_${field}_id:${item.id}`);
    map.set(item.id, item);
  }
  return [...map.values()].sort(SORT);
}
function readSources(input) {
  const sources = (input.sources ?? []).map(raw => {
    const id = key(raw.id, 'source_id');
    const revision = text(raw.revision, 'source_revision', 60);
    if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('invalid_source_revision');
    const completeness = raw.completeness ?? 'partial';
    if (!['complete', 'partial', 'missing'].includes(completeness)) throw new Error('invalid_completeness');
    return {id, repository: text(raw.repository, 'repository', 180), revision, completeness,
      authority: text(raw.authority ?? 'source_owned', 'authority', 150),
      lifecycle: ['active','historical'].includes(raw.lifecycle) ? raw.lifecycle : 'unknown'};
  });
  return unique(sources, 'source');
}
function readRecord(raw, source) {
  const source_item_id = key(raw.source_item_id, 'source_item_id');
  const id = sourceKey(source.id, source_item_id);
  if (!RECORD_TYPES.includes(raw.type)) throw new Error('invalid_record_type');
  const canonical_id = raw.canonical_id == null ? null : text(raw.canonical_id, 'canonical_id', 240);
  if (canonical_id && !CANON_PATTERN.test(canonical_id)) throw new Error('invalid_canonical_id');
  if (BAD.has(raw.sensitivity)) throw new Error('restricted_record');
  if (!Array.isArray(raw.evidence ?? []) || (raw.evidence ?? []).length > 128 || !Array.isArray(raw.links ?? []) || (raw.links ?? []).length > 128) throw new Error('record_relation_limit');
  const evidence = (raw.evidence ?? []).map(e => evidenceRow(e, id, source.revision));
  const links = (raw.links ?? []).map(l => {
    const target_source_id = key(l.target_source_id, 'target_source_id');
    const target_item_id = key(l.target_item_id, 'target_item_id');
    if (!LINK_TYPES.includes(l.relation)) throw new Error('invalid_relation');
    return { id: `edge:${sha(`${id}\0${l.relation}\0${target_source_id}\0${target_item_id}`).slice(0,32)}`,
      from: id, to: sourceKey(target_source_id, target_item_id), relation: l.relation,
      evidence_ids: evidence.map(e=>e.id).sort(COMPARE), origin: 'source_explicit', confidence: 1 };
  });
  let tombstone = null;
  if (raw.tombstone) {
    if (!raw.tombstone.receipt || !raw.tombstone.owner_confirmed) throw new Error('tombstone_requires_owner_receipt');
    tombstone = { receipt: safeRef(raw.tombstone.receipt, 'tombstone_receipt'), owner_confirmed: true };
  }
  return {
    id, source_id: source.id, source_item_id, type: raw.type,
    name: text(raw.name, 'name', 400), canonical_id,
    authority_claim: text(raw.authority_claim ?? source.authority, 'authority_claim', 150),
    lifecycle: ['active','historical','research','retired'].includes(raw.lifecycle) ? raw.lifecycle : source.lifecycle,
    updated_at: raw.updated_at ? date(raw.updated_at, 'updated_at') : null,
    locator: raw.locator ? safeRef(raw.locator, 'locator') : null,
    source_revision: source.revision, visibility: 'observed', tombstone,
    evidence, links,
  };
}
function readDecisions(items, known) {
  return unique(items.map(x => {
    if (!['confirm_equivalence','keep_separate','reject_candidate'].includes(x.decision)) throw new Error('invalid_decision');
    const left = key(x.left, 'decision_left'), right = key(x.right, 'decision_right');
    if (left === right || !known.has(left) || !known.has(right)) throw new Error('invalid_decision_pair');
    const id = pairId(left,right);
    const reviewer = safeRef(x.reviewer, 'reviewer');
    const evidence_ref = safeRef(x.evidence_ref,'decision_evidence');
    if (x.decision === 'confirm_equivalence' && x.owner_confirmed !== true) throw new Error('owner_confirmation_required');
    return {id, left:[left,right].sort(COMPARE)[0], right:[left,right].sort(COMPARE)[1],
      decision:x.decision, reviewer, evidence_ref, owner_confirmed:x.owner_confirmed === true};
  }), 'decision');
}
function candidates(records, decisions) {
  const groups = new Map(), candidateMap = new Map();
  const usable = records.filter(r => !r.tombstone && r.visibility === 'observed');
  for (const r of usable) {
    const k = `${r.type}\0${normalized(r.name)}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  let truncatedDuplicates = false;
  const add = (a,b,kind,score,reason) => {
    if (a.id === b.id) return;
    if (candidateMap.size >= MAX_DUPLICATES) {truncatedDuplicates=true;return;}
    const id = pairId(a.id,b.id), old=candidateMap.get(id);
    if (!old || score > old.confidence) candidateMap.set(id, {id,left:[a.id,b.id].sort(COMPARE)[0],right:[a.id,b.id].sort(COMPARE)[1],
      kind, confidence:score,reason,disposition:'review_required'});
  };
  for (const arr of groups.values()) if(arr.length>1) {
    for(let i=0;i<arr.length;i++) for(let j=i+1;j<arr.length;j++) add(arr[i],arr[j],'exact_duplicate',1,'same_type_and_normalized_name');
  }
  // Bounded inverted token index: no all-record O(n^2) comparison and no auto-merge.
  const index=new Map(); let budget=MAX_PAIRS;
  for (const r of usable.sort(SORT)) {
    if (!SEMANTIC_TYPES.has(r.type)) continue;
    const ts=tokens(r.name); if (ts.size<2) continue;
    const seen=new Set();
    for (const t of ts) for(const prior of index.get(`${r.type}:${t}`)??[]) seen.add(prior);
    for (const prior of [...seen].sort(SORT)) {
      if (!budget) break;
      budget--;
      if (normalized(r.name)===normalized(prior.name)) continue;
      const ps=tokens(prior.name), overlap=intersection(ts,ps);
      const score=overlap / (ts.size+ps.size-overlap);
      if (overlap>=2 && score>=0.75) add(prior,r,'semantic_candidate',Number(score.toFixed(3)),'token_jaccard_review_only');
    }
    for (const t of ts) {const k=`${r.type}:${t}`; const a=index.get(k)??[]; if (a.length<300) a.push(r); index.set(k,a);}
  }
  const lookup=new Map(decisions.map(d=>[d.id,d]));
  const result=[...candidateMap.values()].sort(SORT).map(c=>({
    ...c, decision:lookup.get(c.id)??null,
    disposition:lookup.has(c.id) ? lookup.get(c.id).decision : 'review_required',
  }));
  return {pairs:result, pairs_examined:MAX_PAIRS-budget, pair_limit_hit:budget===0, output_limit_hit:truncatedDuplicates};
}
function findings(records, links, sources, at) {
  const map=new Map(records.map(r=>[r.id,r]));
  const children=new Map();
  for (const e of links) {
    if (!map.has(e.from) || !map.has(e.to)) continue;
    if (!children.has(e.from)) children.set(e.from,new Set());
    if (!children.has(e.to)) children.set(e.to,new Set());
    children.get(e.from).add(e.to);children.get(e.to).add(e.from);
  }
  const out=[];
  const add=(kind,row,reason,certainty='candidate',extra={}) => out.push({
    id:`finding:${sha(`${kind}\0${row.id}\0${reason}`).slice(0,32)}`,kind,record_id:row.id,
    certainty,reason,source_revision:row.source_revision,...extra});
  const complete=new Map(sources.map(s=>[s.id,s.completeness==='complete']));
  for (const r of records) {
    if (r.tombstone) continue;
    if (r.visibility!=='observed') {add('source_unavailable',r,'retained_without_current_source','unknown');continue;}
    const peers=[...(children.get(r.id)??[])].map(id=>map.get(id));
    const linkedType=(...types)=>peers.some(p=>types.includes(p.type) && !p.tombstone && p.visibility==='observed');
    const certainty=complete.get(r.source_id) ? 'candidate' : 'unknown';
    if (!r.canonical_id && !linkedType('capability')) add('unmapped_identity',r,'no_explicit_canonical_identity',certainty);
    if (r.type==='research' && !linkedType('implementation','consumer')) add('researched_unadopted',r,'no_verified_adoption_link',certainty);
    if ((r.type==='implementation'||r.type==='file') && !linkedType('tracker','capability')) add('code_untracked',r,'no_tracker_or_capability_link',certainty);
    if ((r.type==='tracker'||r.type==='capability') && !linkedType('implementation','file')) add('tracker_without_code',r,'no_implementation_link',certainty);
    if (r.updated_at && (Date.parse(at)-Date.parse(r.updated_at))/86400000>180 && ['active','research'].includes(r.lifecycle)) add('stale_work',r,'older_than_180_days',certainty);
  }
  for (const e of links) if (!map.has(e.to) || map.get(e.to).visibility!=='observed') {
    const row=map.get(e.from);
    add('missing_reference',row,'linked_target_not_currently_observed','unknown',{target:e.to,relation:e.relation});
  }
  return out.sort(SORT);
}
/**
 * Pure deterministic projection. Pass source snapshots and, optionally, previous export.
 * Missing/partial source never causes deletion. Only explicit owner-receipted tombstones retire records.
 */
export function buildCrosswalk(input) {
  if (!input || typeof input!=='object' || !Array.isArray(input.sources) || !Array.isArray(input.records)) throw new Error('invalid_input');
  if (input.records.length>MAX_RECORDS || input.sources.length>10000) throw new Error('input_limit_exceeded');
  const as_of=date(input.as_of,'as_of');
  const sources=readSources(input), bySource=new Map(sources.map(s=>[s.id,s]));
  const current=unique(input.records.map(raw=>{
    const sid=key(raw.source_id,'record_source_id'), source=bySource.get(sid);
    if (!source || source.completeness==='missing') throw new Error('record_source_missing');
    return readRecord(raw,source);
  }),'record');
  const recordMap=new Map(current.map(r=>[r.id,r]));
  const previous=input.previous?.schema===SCHEMA ? input.previous : null;
  if (input.previous && !previous) throw new Error('invalid_previous_schema');
  if (previous) {
    const {snapshot_sha256, ...unsigned}=previous;
    if (digest(unsigned)!==snapshot_sha256) throw new Error('invalid_previous_digest');
    if (!Array.isArray(previous.records) || previous.records.length > MAX_RECORDS) throw new Error('invalid_previous_records');
  }
  const sourceSet=new Map(sources.map(s=>[s.id,s]));
  const retained=[];const missing=[];
  if(previous) for (const old of previous.records??[]) {
    if(recordMap.has(old.id)) continue;
    const source=sourceSet.get(old.source_id);
    // Never silently tombstone a vanished entry. Retain until explicit evidence.
    const visibility=source?.completeness==='missing'||!source ? 'source_unavailable' : 'unobserved';
    const row={...old,visibility};
    retained.push(row);
    missing.push({record_id:old.id,source_id:old.source_id,reason:visibility});
  }
  const records=unique([...current,...retained], 'record');
  const known=new Set(records.map(r=>r.id));
  const decisions=readDecisions(input.decisions??[],known);
  const evidence=unique(records.flatMap(r=>r.evidence??[]),'evidence');
  const edges=unique(records.flatMap(r=>r.links??[]),'edge');
  const entityLinks=records.filter(r=>r.canonical_id).map(r=>({
    id:`edge:${sha(`${r.id}\0${r.canonical_id}`).slice(0,32)}`,
    from:r.id,to:r.canonical_id,relation:'identifies',confidence:1,origin:'source_declared',evidence_ids:r.evidence.map(e=>e.id),
  }));
  const allEdges=unique([...edges,...entityLinks],'edge');
  const duplicate=candidates(records,decisions);
  const conflicts=[];const byCanonical=new Map();
  for(const r of records.filter(r=>r.canonical_id && !r.tombstone && r.visibility==='observed')) {
    if(!byCanonical.has(r.canonical_id)) byCanonical.set(r.canonical_id,[]);
    byCanonical.get(r.canonical_id).push(r);
  }
  for(const [canonical_id,rs] of byCanonical) if (new Set(rs.map(r=>r.authority_claim)).size>1) conflicts.push({
    id:`conflict:${sha(canonical_id).slice(0,32)}`,canonical_id,
    kind:'authority_conflict',record_ids:rs.map(r=>r.id).sort(COMPARE),
    authority_claims:[...new Set(rs.map(r=>r.authority_claim))].sort(COMPARE),resolution:'manual_review_required',
  });
  const orphanFindings=findings(records,edges,sources,as_of);
  const previousMap=new Map((previous?.records??[]).map(r=>[r.id,r]));
  const delta={added:[],changed:[],unchanged:[],retained_unobserved:[],tombstoned:[]};
  for(const r of records) {
    if(r.visibility!=='observed') {delta.retained_unobserved.push(r.id);continue;}
    if(r.tombstone) delta.tombstoned.push(r.id);
    const old=previousMap.get(r.id);
    if(!old) delta.added.push(r.id);
    else if (digest({...old,visibility:'observed'})===digest(r)) delta.unchanged.push(r.id);
    else delta.changed.push(r.id);
  }
  const counts={source_count:sources.length,source_missing:sources.filter(s=>s.completeness==='missing').length,
    records:records.length,observed:records.filter(r=>r.visibility==='observed').length,
    canonical_declared:records.filter(r=>r.canonical_id && r.visibility==='observed').length,
    without_canonical:records.filter(r=>!r.canonical_id && r.visibility==='observed').length,
    exact_duplicates:duplicate.pairs.filter(p=>p.kind==='exact_duplicate').length,
    semantic_candidates:duplicate.pairs.filter(p=>p.kind==='semantic_candidate').length,
    authority_conflicts:conflicts.length,
    orphans_by_class:Object.fromEntries([...new Set(orphanFindings.map(x=>x.kind))].sort(COMPARE).map(k=>[k,orphanFindings.filter(x=>x.kind===k).length]))};
  const body={schema:SCHEMA,as_of,sources,records,edges:allEdges,evidence,decisions,
    duplicate_candidates:duplicate.pairs,authority_conflicts:conflicts,orphan_findings:orphanFindings,
    missing_since_previous:missing.sort((a,b)=>COMPARE(a.record_id,b.record_id)),
    delta,counts,limits:{max_records:MAX_RECORDS,examined_candidate_pairs:duplicate.pairs_examined,
      pair_limit_hit:duplicate.pair_limit_hit,output_limit_hit:duplicate.output_limit_hit},
    policy:{canonical_identity:'explicit_source_declared_only',duplicate_action:'review_only',
      missing_source:'retain_unknown_not_tombstone',production_activation:'never_inferred',
      graph_owner:'repos-hq',lab_role:'observer'}};
  return {...body,snapshot_sha256:digest(body)};
}

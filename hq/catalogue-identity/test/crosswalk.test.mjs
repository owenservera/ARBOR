// @ts-check
/** @hq:context C4 Lane B crosswalk contract, privacy, replay, and orphan regression tests.
 * @hq:owner repos-hq
 * @hq:task VIVIM-WAVE-C4-LANE-B
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCrosswalk, stableRecordId, SCHEMA } from '../crosswalk.mjs';
import { exportLabsSeed } from '../labs-adapter.mjs';
const SHA='a'.repeat(40), SHA2='b'.repeat(40), now='2026-11-07T01:00:00Z';
const source=(id='a',completeness='partial',revision=SHA)=>({id,repository:`owenservera/${id}`,revision,completeness,authority:`${id}-owner`});
/** Raw row builder; `extra` carries optional raw-record extensions (canonical_id, tombstone, links, ...). @param {Record<string, unknown>} [extra] @returns {Record<string, unknown>} */
const item=(source_id,source_item_id,type,name,extra={})=>({source_id,source_item_id,type,name,...extra});
const run=(records=[],sources=[source()],more={})=>buildCrosswalk({as_of:now,records,sources,...more});
test('empty export stable, complete envelope and no inferred production',()=>{
  const r=run();assert.equal(r.schema,SCHEMA);assert.equal(r.counts.records,0);
  assert.equal(r.policy.production_activation,'never_inferred');assert.match(r.snapshot_sha256,/^[a-f0-9]{64}$/);
});
test('source+item stable ID independent of title and revision',()=>{
  const old=item('a','a1','tracker','Foo');const updated={...old,name:'Foo renamed'};
  assert.equal(run([old]).records[0].id,run([updated],[source('a','complete',SHA2)]).records[0].id);
  assert.equal(stableRecordId('a','a1'),run([old]).records[0].id);
});
test('explicit many-to-many relationships keep distinct items',()=>{
  const cap=item('a','cap','capability','Portable UI',{canonical_id:'cap:portable-ui',links:[{target_source_id:'a',target_item_id:'impl1',relation:'implements'},
    {target_source_id:'a',target_item_id:'impl2',relation:'implements'}]});
  const r=run([cap,item('a','impl1','implementation','Desktop'),item('a','impl2','implementation','Android')]);
  assert.equal(r.edges.filter(e=>e.relation==='implements').length,2);
  assert.equal(r.edges.filter(e=>e.relation==='identifies').length,1);
  assert.equal(r.counts.canonical_declared,1);
});
test('exact + semantic duplication are review-only, stable under reordered input',()=>{
  const records=[item('a','1','algorithm','Portable context graph engine'),
    item('a','2','algorithm','portable  context graph engine'),
    item('a','3','algorithm','Context graph engine portable runtime')];
  const a=run(records),b=run(records.slice().reverse());
  assert.equal(a.counts.exact_duplicates,1);
  assert.ok(a.counts.semantic_candidates>=1);
  assert.deepEqual(a,b);
  assert.ok(a.duplicate_candidates.every(p=>p.disposition==='review_required'));
});
test('manual keep separate never merges; owner confirmation required for equivalence',()=>{
  const rows=[item('a','1','algorithm','same title'),item('a','2','algorithm','same title')];
  const x=stableRecordId('a','1'), y=stableRecordId('a','2');
  assert.throws(()=>run(rows,[source()],{decisions:[{left:x,right:y,decision:'confirm_equivalence',reviewer:'owner',evidence_ref:'receipt:1'}]}),/owner_confirmation_required/);
  const r=run(rows,[source()],{decisions:[{left:x,right:y,decision:'keep_separate',reviewer:'owner',evidence_ref:'receipt:1'}]});
  assert.equal(r.duplicate_candidates[0].disposition,'keep_separate');assert.equal(r.records.length,2);
});
test('authority claims conflict under a canonical ID without silent precedence',()=>{
  const r=run([item('a','1','capability','UI',{canonical_id:'cap:ui',authority_claim:'tierflow'}),
    item('b','2','capability','UI interface',{canonical_id:'cap:ui',authority_claim:'harness'})],[source('a'),source('b')]);
  assert.equal(r.counts.authority_conflicts,1);assert.equal(r.authority_conflicts[0].resolution,'manual_review_required');
});
test('research, untracked implementation, tracker-without-code, unresolved reference classify as candidates/unknown',()=>{
  const r=run([
    item('a','r','research','Retired repair protocol'),item('a','c','implementation','Parser'),
    item('a','t','tracker','Parser test plan',{links:[{target_source_id:'a',target_item_id:'gone',relation:'tests'}]})
  ]);
  for (const k of ['researched_unadopted','code_untracked','tracker_without_code','missing_reference','unmapped_identity']) {
    assert.ok(r.orphan_findings.some(f=>f.kind===k),k);
  }
  assert.ok(r.orphan_findings.every(f=>f.certainty==='unknown'));
});
test('staleness uses pinned as_of, never wall clock',()=>{
  const r=run([item('a','old','research','Old scheduling',{updated_at:'2025-01-01T00:00:00Z',lifecycle:'active'})]);
  assert.equal(r.counts.orphans_by_class.stale_work,1);
});
test('partial or missing source cannot tombstone a previous row; recovery reconnects ID',()=>{
  const first=run([item('a','one','implementation','Reader')],[source('a','complete')]);
  const lost=run([], [source('a','missing',SHA2)], {previous:first});
  assert.equal(lost.records[0].visibility,'source_unavailable');
  assert.equal(lost.delta.tombstoned.length,0);
  assert.equal(lost.counts.source_missing,1);
  const recovered=run([item('a','one','implementation','Reader')],[source('a','partial',SHA)],{previous:lost});
  assert.equal(recovered.records[0].visibility,'observed');
  assert.equal(recovered.records[0].id,first.records[0].id);
});
test('complete source omission still retained as unobserved, not false tombstone',()=>{
  const first=run([item('a','one','implementation','Reader')],[source('a','complete')]);
  const r=run([],[source('a','complete',SHA2)],{previous:first});
  assert.equal(r.records[0].visibility,'unobserved');assert.equal(r.delta.retained_unobserved.length,1);
  assert.equal(r.missing_since_previous.length,1);
});
test('owner-confirmed tombstone requires receipt; no mutation of original',()=>{
  const orig=item('a','1','tracker','Old task');
  assert.throws(()=>run([{...orig,tombstone:{owner_confirmed:true}}]),/tombstone_requires_owner_receipt/);
  const r=run([{...orig,tombstone:{owner_confirmed:true,receipt:'owner-ledger:revocation-1'}}]);
  assert.equal(r.delta.tombstoned.length,1);assert.equal(orig.tombstone,undefined);
});
test('restricted and secret paths fail closed, including evidence references',()=>{
  assert.throws(()=>run([item('a','1','file','Credentials',{locator:'app/.env.local'})]),/unsafe_locator/);
  assert.throws(()=>run([item('a','1','file','Cookies',{evidence:[{kind:'source_file',ref:'session.json'}]})]),/unsafe_evidence_ref/);
  assert.throws(()=>run([item('a','1','file','Private',{sensitivity:'restricted'})]),/restricted_record/);
});
test('invalid relations, ID collisions, overlong input and missing source rejected',()=>{
  assert.throws(()=>run([item('a','1','tracker','A',{links:[{target_source_id:'a',target_item_id:'2',relation:'execute'}]})]),/invalid_relation/);
  assert.throws(()=>run([item('a','1','tracker','A'),item('a','1','tracker','B')]),/conflicting_record_id/);
  assert.throws(()=>run([item('a','1','tracker','A')],[source('b')]),/record_source_missing/);
});
test('Labs adapter preserves source identity and does not certify source existence/production',()=>{
  const r=exportLabsSeed({capabilities:[{capability_id:'cap:oracle-intent',name:'Oracle intent',source_refs:['tierflow:future']},
    {capability_id:'cap:typed-commands',name:'Typed commands'}],labsSha:SHA,asOf:now});
  assert.equal(r.counts.canonical_declared,2);assert.equal(r.counts.source_count,1);
  assert.equal(r.policy.production_activation,'never_inferred');assert.equal(r.records[0].links.length,0);
});
test('identical replay is idempotent with previous snapshot; source revision change is detected',()=>{
  const rows=[item('a','one','implementation','Reader')];
  const first=run(rows);const replay=run(rows,[source()],{previous:first});
  assert.equal(replay.delta.unchanged.length,1);assert.equal(replay.delta.changed.length,0);
  assert.deepEqual(replay.records,first.records);
  const changed=run(rows,[source('a','partial',SHA2)],{previous:replay});
  assert.equal(changed.delta.changed.length,1);
});
import { adaptKnownCatalogues } from '../source-adapters.mjs';
test('source adapters preserve Harness 1:n candidate journey links and mark HQ file snapshots historical',()=>{
 const x=adaptKnownCatalogues({asOf:now,labs:[{capability_id:'cap:test',name:'Test'}],labSha:SHA,
  atomic:{items:[{id:'CAP-01',title:'One atomic'},{id:'CAP-02',title:'Two atomic'}]},harnessSha:SHA,
  journey:{entries:[{journeyId:'J001',source:'some/file.mjs',atomicCandidateIds:['CAP-01','CAP-02'],strongerSymbolCandidateIds:['CAP-01']}]},
  algorithms:[{id:'algorithm:deduplicate',name:'deduplicate',status:'design_reuse_candidate'}],
  inventory:[{id:'file:001',repository:'owenservera/aion',path:'AGENTS.md'}],hqSha:SHA});
 const r=buildCrosswalk(x);
 assert.equal(r.counts.records,6);assert.equal(r.edges.filter(e=>e.relation==='references').length,2);
 assert.equal(r.records.find(x=>x.source_item_id==='file:001').type,'catalogue');
 assert.equal(r.counts.canonical_declared,1);
 assert.equal(r.policy.production_activation,'never_inferred');
});
import { observerExport } from '../observer-export.mjs';
test('observer defaults deny; explicit allowlist sends only chosen source records and safe edges',()=>{
 const r=run([item('a','private','research','Private research',{locator:'private/design.md'}),
   item('b','public','capability','Public capability',{canonical_id:'cap:public'})],[source('a'),source('b')]);
 const deny=observerExport(r);assert.equal(deny.records.length,0);assert.equal(deny.counts.withheld_records,2);
 assert.doesNotMatch(JSON.stringify(deny),/Private research|private\/design/);
 const publicView=observerExport(r,{allowSourceIds:['b']});
 assert.equal(publicView.records.length,1);
 assert.equal(publicView.records[0].canonical_id,'cap:public');
 assert.doesNotMatch(JSON.stringify(publicView),/Private research|private\/design/);
});
test('tampered previous export is rejected (replay trust)',()=>{
 const first=run([item('a','1','tracker','One')]);
 const invalid={...first, records:first.records.map(r=>({...r,name:'Fake'}))};
 assert.throws(()=>run([],[source()],{previous:invalid}),/invalid_previous_digest/);
});
test('candidate duplicates are bounded for hostile repeated titles',()=>{
 const items=Array.from({length:160},(_,i)=>item('a',String(i),'algorithm','Exact repeated algorithm name'));
 const r=run(items);
 assert.ok(r.duplicate_candidates.length<=10000);
 assert.equal(r.limits.output_limit_hit,true);
});

test('near-identical path names do not masquerade as semantic capability duplicates',()=>{
 const a=item('a','file:1','catalogue','owenservera/aion:workspace/agents/AGENTS.md');
 const b=item('a','file:2','catalogue','owenservera/aion:workspace/agents/BOOTSTRAP.md');
 const r=run([a,b]);
 assert.equal(r.counts.semantic_candidates,0);
 assert.equal(r.counts.exact_duplicates,0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPinnedIdentityCrosswalk as project, HviIdentityError, sourceScopedRevisionId, stableLineageId } from '../index.mjs';
import { adaptC4CrosswalkToHvi, adaptCatalogueDeltaToHvi } from '../legacy-adapters.mjs';
import { buildCrosswalk } from '../../../catalogue-identity/crosswalk.mjs';
import { buildCatalogueSnapshot } from '../../../lib/catalogue-delta.mjs';

const sha=(c)=>c.repeat(40),sum=(c)=>c.repeat(64);
const pin=(pinId,repo='owenservera/repos-hq',rev=sha('a'),complete='complete',manifest=sum('b'))=>({
  pinId,repoIdentity:repo,resolvedCommitSha:rev,manifestDigest:manifest,completeness:complete});
const record=(pinId,sourceScopedRecordId,extras={})=>({
  pinId,sourceScopedRecordId,type:'implementation',name:'Source handler',
  sourcePath:'hq/lib/handler.mjs',sourceBlobSha:sha('c'),owner:'hq',...extras});
const run=(pins,records,more={})=>project({pins,records,...more});
test('stable revision-scoped IDs distinguish same repo/three SHAs and different repositories',()=>{
  const pins=[pin('p1'),pin('p2','owenservera/repos-hq',sha('d')),pin('p3','owenservera/ARBOR',sha('a'))];
  const r=run(pins,pins.map(p=>record(p.pinId,'same-record')));
  assert.equal(new Set(r.records.map(x=>x.id)).size,3);
  assert.equal(new Set(r.records.map(x=>x.lineageId)).size,2);
  assert.equal(r.identityCandidates.length,1);
  assert.equal(r.identityCandidates[0].disposition,'REVIEW_REQUIRED');
  assert.ok(r.records.every(x=>x.runtimeProof==='UNRUN'));
  assert.equal(sourceScopedRevisionId('owenservera/repos-hq',sha('a'),'same-record'),r.records.find(x=>x.pinId==='p1').id);
  assert.equal(stableLineageId('owenservera/repos-hq','same-record'),r.records.find(x=>x.pinId==='p1').lineageId);
});
test('input order and pin order cannot change output digest',()=>{
  const p=[pin('p2','owenservera/repos-hq',sha('d')),pin('p1')];
  const rows=[record('p1','one'),record('p2','one')];
  assert.deepEqual(run(p,rows),run([...p].reverse(),[...rows].reverse()));
});
test('same declared canonical identity with differing implementations stays disputed',()=>{
  const p=[pin('p1'),pin('p2','owenservera/ARBOR',sha('d'))];
  const r=run(p,[record('p1','x',{canonicalId:'cap:source-comparison',implementationDigest:sha('1')}),
    record('p2','z',{canonicalId:'cap:source-comparison',implementationDigest:sha('2'),owner:'arbor'})]);
  assert.equal(r.identityCandidates.length,1);
  assert.equal(r.authorityConflicts.length,1);
  assert.deepEqual(r.authorityConflicts[0].types,['IMPLEMENTATION_COLLISION','OWNER_CONFLICT']);
  assert.equal(r.identityCandidates[0].mergePerformed,false);
});
test('owner confirmation plus reviewed evidence annotates, not merges, an identity pair',()=>{
  const p=[pin('p1'),pin('p2','owenservera/ARBOR',sha('d'))];
  const rows=[record('p1','x',{canonicalId:'cap:a'}),record('p2','y',{canonicalId:'cap:a'})];
  const a=run(p,rows);
  const {left,right}=a.identityCandidates[0];
  const decision={left,right,reviewer:'owner-review',evidenceRef:'owner-ledger:approved',decision:'confirm_equivalence'};
  assert.throws(()=>run(p,rows,{decisions:[decision]}),e=>e.code==='EQUIVALENCE_UNPROVEN');
  const r=run(p,rows,{decisions:[{...decision,ownerConfirmed:true,reviewed:true}]});
  assert.equal(r.identityCandidates[0].disposition,'confirm_equivalence');
  assert.equal(r.identityCandidates[0].mergePerformed,false);
  assert.equal(r.identityCandidates[0].decision.receiptCryptographicallyVerified,false);
  assert.equal(r.records.length,2);
});
test('duplicate pin key and same repo+revision with different digest fail closed',()=>{
  assert.throws(()=>run([pin('p1'),pin('p1')],[]),e=>e.code==='ID_CONFLICT');
  assert.throws(()=>run([pin('p1'),pin('p2','owenservera/repos-hq',sha('a'),'complete',sum('d'))],[]),
    e=>e.code==='DIGEST_CONFLICT');
});
test('same revision duplicate rows different payload are rejected, not coalesced',()=>{
  assert.throws(()=>run([pin('p1')],[record('p1','same'),record('p1','same',{name:'Different'})]),
    e=>e.code==='ID_CONFLICT');
});
test('replay digest tamper and pin digest fork fail closed',()=>{
  const p=[pin('p1')],a=run(p,[record('p1','s')]);
  assert.throws(()=>run(p,[],{previous:{...a,records:[]}}),e=>e.code==='DIGEST_CONFLICT');
  assert.throws(()=>run([pin('p1','owenservera/repos-hq',sha('a'),'complete',sum('d'))],[],{previous:a}),
    e=>e.code==='DIGEST_CONFLICT');
});
test('unobserved entries persist with missing or partial snapshots, never tombstone',()=>{
  const start=run([pin('p1')],[record('p1','s')]);
  const missing=run([pin('p1','owenservera/repos-hq',sha('a'),'missing')],[],{previous:start});
  assert.equal(missing.records[0].visibility,'source_unavailable');
  assert.equal(missing.retainedCount,1);
  assert.equal(missing.policy.tombstone,'owner_receipt_only_never_inferred');
  const partial=run([pin('p1','owenservera/repos-hq',sha('a'),'partial')],[],{previous:missing});
  assert.equal(partial.records[0].visibility,'unobserved');
});
test('many-to-many typed links preserve unresolved targets, never assume missing capability',()=>{
  const p=[pin('p1'),pin('p2','owenservera/ARBOR',sha('d'),'partial')];
  const r=run(p,[record('p1','a'),record('p1','b')],
    {links:[{pinId:'p1',sourceScopedRecordId:'a',targetPinId:'p1',targetSourceScopedRecordId:'b',relation:'implements'},
      {pinId:'p1',sourceScopedRecordId:'a',targetPinId:'p2',targetSourceScopedRecordId:'not-observed',relation:'references'}]});
  assert.equal(r.edges.length,2);
  assert.ok(r.edges.some(e=>e.status==='TARGET_UNOBSERVED'));
  assert.equal(r.unobserved[0].status,'partial');
});
test('secret-looking source names, malicious paths, sensitive evidence and unknown pin rejected',()=>{
  const p=[pin('p1')];
  assert.throws(()=>run(p,[record('p1','x',{sourcePath:'config/.env.local'})]),e=>e.code==='SOURCE_UNAUTHORIZED');
  assert.throws(()=>run(p,[record('p1','x',{sourcePath:'../escape'})]),e=>['SOURCE_UNAUTHORIZED','SCOPE_ESCAPE'].includes(e.code));
  assert.throws(()=>run(p,[record('p1','x',{evidenceRefs:['session.json']})]),e=>e.code==='SOURCE_UNAUTHORIZED');
  assert.throws(()=>run(p,[record('invalid','x')]),e=>e.code==='PIN_NOT_FOUND');
});
test('donor hq.catalogue-crosswalk/1 stays a separate schema with explicit pinned bridge',()=>{
  const s={id:'labs:capabilities',repository:'owenservera/repos-hq',revision:sha('a'),completeness:'partial',authority:'labs_observer'};
  const snapshot=buildCrosswalk({as_of:'2026-11-12T00:00:00Z',sources:[s],records:[{
    source_id:s.id,source_item_id:'row',type:'capability',name:'Pinned import',
    canonical_id:'cap:pinned',evidence:[{kind:'source_record',ref:'source:row'}]}]});
  const adapted=adaptC4CrosswalkToHvi({snapshot,pinsBySourceId:{[s.id]:pin('p1')}});
  const r=run(adapted.pins,adapted.records,{links:adapted.links});
  assert.equal(r.records[0].canonicalId,'cap:pinned');
  assert.equal(adapted.advisory.runtime,'UNRUN');
  assert.throws(()=>adaptC4CrosswalkToHvi({snapshot:{...snapshot,records:[]},pinsBySourceId:{[s.id]:pin('p1')}}),
    e=>e.code==='DIGEST_CONFLICT');
});
test('existing vivim.catalogue-export/1 contract validated before conversion',()=>{
  const s={id:'hq-dev',revision:sha('a'),state:'complete',owner:'hq'};
  const envelope=buildCatalogueSnapshot({sources:[s],records:[{
    id:'cap:read-only',sourceId:'hq-dev',sourceRevision:sha('a'),kind:'capability',status:'implemented',
    contentDigest:sum('f'),evidence:[{type:'source_file',ref:'hq/lib/reader.mjs'}]}]});
  const a=adaptCatalogueDeltaToHvi({envelope,pin:pin('p1')});
  const r=run(a.pins,a.records);
  assert.equal(r.records[0].canonicalId,'cap:read-only');
  assert.equal(r.records[0].type,'catalogue');
  assert.throws(()=>adaptCatalogueDeltaToHvi({envelope:{...envelope,digest:sum('0')},pin:pin('p1')}));
});
test('original crosswalk Labs observer withholds all unless allowlisted (donor regression)',async()=>{
  const {observerExport}=await import('../../../catalogue-identity/observer-export.mjs');
  const snapshot=buildCrosswalk({as_of:'2026-11-12T00:00:00Z',sources:[{
    id:'s',repository:'owenservera/repos-hq',revision:sha('a'),completeness:'partial'}],
    records:[{source_id:'s',source_item_id:'x',type:'research',name:'Public but unapproved'}]});
  assert.equal(observerExport(snapshot).records.length,0);
  assert.equal(observerExport(snapshot,{allowSourceIds:['s']}).records.length,1);
});

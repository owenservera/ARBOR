# File: hq/catalogue-identity/test/crosswalk.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/catalogue-identity/test/crosswalk.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11061 B |
| Lines | 156 |
| Hash | d6b736e98351 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SHA | const | 10 | no | const SHA=&#39;a&#39;.repeat(40), SHA2=&#39;b&#39;.repeat(40), now=&#39;2026-11-07T01:00:00Z&#39;; |
| source | function | 11 | no | const source=(id=&#39;a&#39;,completeness=&#39;partial&#39;,revision=SHA)=&gt;({id,repository:`owenservera/${id}`,revision,completeness,authority:`${id}-owner`}); |
| item | function | 13 | no | const item=(source_id,source_item_id,type,name,extra={})=&gt;({source_id,source_item_id,type,name,...extra}); |
| run | const | 14 | no | const run=(records=[],sources=[source()],more={})=&gt;buildCrosswalk({as_of:now,records,sources,...more}); |
| r | const | 16 | no | const r=run();assert.equal(r.schema,SCHEMA);assert.equal(r.counts.records,0); |
| old | const | 20 | no | const old=item(&#39;a&#39;,&#39;a1&#39;,&#39;tracker&#39;,&#39;Foo&#39;);const updated={...old,name:&#39;Foo renamed&#39;}; |
| cap | const | 25 | no | const cap=item(&#39;a&#39;,&#39;cap&#39;,&#39;capability&#39;,&#39;Portable UI&#39;,{canonical_id:&#39;cap:portable-ui&#39;,links:[{target_source_id:&#39;a&#39;,target_item_id:&#39;impl1&#39;,relation:&#39;implements&#39;}, {target_source_id:&#39;a&#39;,target_item_id:&#39;i… |
| r | const | 27 | no | const r=run([cap,item(&#39;a&#39;,&#39;impl1&#39;,&#39;implementation&#39;,&#39;Desktop&#39;),item(&#39;a&#39;,&#39;impl2&#39;,&#39;implementation&#39;,&#39;Android&#39;)]); |
| records | const | 33 | no | const records=[item(&#39;a&#39;,&#39;1&#39;,&#39;algorithm&#39;,&#39;Portable context graph engine&#39;), |
| a | const | 36 | no | const a=run(records),b=run(records.slice().reverse()); |
| rows | const | 43 | no | const rows=[item(&#39;a&#39;,&#39;1&#39;,&#39;algorithm&#39;,&#39;same title&#39;),item(&#39;a&#39;,&#39;2&#39;,&#39;algorithm&#39;,&#39;same title&#39;)]; |
| x | const | 44 | no | const x=stableRecordId(&#39;a&#39;,&#39;1&#39;), y=stableRecordId(&#39;a&#39;,&#39;2&#39;); |
| r | const | 46 | no | const r=run(rows,[source()],{decisions:[{left:x,right:y,decision:&#39;keep_separate&#39;,reviewer:&#39;owner&#39;,evidence_ref:&#39;receipt:1&#39;}]}); |
| r | const | 50 | no | const r=run([item(&#39;a&#39;,&#39;1&#39;,&#39;capability&#39;,&#39;UI&#39;,{canonical_id:&#39;cap:ui&#39;,authority_claim:&#39;tierflow&#39;}), item(&#39;b&#39;,&#39;2&#39;,&#39;capability&#39;,&#39;UI interface&#39;,{canonical_id:&#39;cap:ui&#39;,authority_claim:&#39;harness&#39;})],[source(&#39;… |
| r | const | 55 | no | const r=run([ item(&#39;a&#39;,&#39;r&#39;,&#39;research&#39;,&#39;Retired repair protocol&#39;),item(&#39;a&#39;,&#39;c&#39;,&#39;implementation&#39;,&#39;Parser&#39;), item(&#39;a&#39;,&#39;t&#39;,&#39;tracker&#39;,&#39;Parser test plan&#39;,{links:[{target_source_id:&#39;a&#39;,target_item_id:&#39;gone&#39;… |
| r | const | 65 | no | const r=run([item(&#39;a&#39;,&#39;old&#39;,&#39;research&#39;,&#39;Old scheduling&#39;,{updated_at:&#39;2025-01-01T00:00:00Z&#39;,lifecycle:&#39;active&#39;})]); |
| first | const | 69 | no | const first=run([item(&#39;a&#39;,&#39;one&#39;,&#39;implementation&#39;,&#39;Reader&#39;)],[source(&#39;a&#39;,&#39;complete&#39;)]); |
| lost | const | 70 | no | const lost=run([], [source(&#39;a&#39;,&#39;missing&#39;,SHA2)], {previous:first}); |
| recovered | const | 74 | no | const recovered=run([item(&#39;a&#39;,&#39;one&#39;,&#39;implementation&#39;,&#39;Reader&#39;)],[source(&#39;a&#39;,&#39;partial&#39;,SHA)],{previous:lost}); |
| first | const | 79 | no | const first=run([item(&#39;a&#39;,&#39;one&#39;,&#39;implementation&#39;,&#39;Reader&#39;)],[source(&#39;a&#39;,&#39;complete&#39;)]); |
| r | const | 80 | no | const r=run([],[source(&#39;a&#39;,&#39;complete&#39;,SHA2)],{previous:first}); |
| orig | const | 85 | no | const orig=item(&#39;a&#39;,&#39;1&#39;,&#39;tracker&#39;,&#39;Old task&#39;); |
| r | const | 87 | no | const r=run([{...orig,tombstone:{owner_confirmed:true,receipt:&#39;owner-ledger:revocation-1&#39;}}]); |
| r | const | 101 | no | const r=exportLabsSeed({capabilities:[{capability_id:&#39;cap:oracle-intent&#39;,name:&#39;Oracle intent&#39;,source_refs:[&#39;tierflow:future&#39;]}, {capability_id:&#39;cap:typed-commands&#39;,name:&#39;Typed commands&#39;}],labsSha:SHA… |
| rows | const | 107 | no | const rows=[item(&#39;a&#39;,&#39;one&#39;,&#39;implementation&#39;,&#39;Reader&#39;)]; |
| first | const | 108 | no | const first=run(rows);const replay=run(rows,[source()],{previous:first}); |
| changed | const | 111 | no | const changed=run(rows,[source(&#39;a&#39;,&#39;partial&#39;,SHA2)],{previous:replay}); |
| x | const | 116 | no | const x=adaptKnownCatalogues({asOf:now,labs:[{capability_id:&#39;cap:test&#39;,name:&#39;Test&#39;}],labSha:SHA, atomic:{items:[{id:&#39;CAP-01&#39;,title:&#39;One atomic&#39;},{id:&#39;CAP-02&#39;,title:&#39;Two atomic&#39;}]},harnessSha:SHA, jou… |
| r | const | 121 | no | const r=buildCrosswalk(x); |
| r | const | 129 | no | const r=run([item(&#39;a&#39;,&#39;private&#39;,&#39;research&#39;,&#39;Private research&#39;,{locator:&#39;private/design.md&#39;}), item(&#39;b&#39;,&#39;public&#39;,&#39;capability&#39;,&#39;Public capability&#39;,{canonical_id:&#39;cap:public&#39;})],[source(&#39;a&#39;),source(&#39;b&#39;)… |
| deny | const | 131 | no | const deny=observerExport(r);assert.equal(deny.records.length,0);assert.equal(deny.counts.withheld_records,2); |
| publicView | const | 133 | no | const publicView=observerExport(r,{allowSourceIds:[&#39;b&#39;]}); |
| first | const | 139 | no | const first=run([item(&#39;a&#39;,&#39;1&#39;,&#39;tracker&#39;,&#39;One&#39;)]); |
| invalid | const | 140 | no | const invalid={...first, records:first.records.map(r=&gt;({...r,name:&#39;Fake&#39;}))}; |
| items | const | 144 | no | const items=Array.from({length:160},(_,i)=&gt;item(&#39;a&#39;,String(i),&#39;algorithm&#39;,&#39;Exact repeated algorithm name&#39;)); |
| r | const | 145 | no | const r=run(items); |
| a | const | 151 | no | const a=item(&#39;a&#39;,&#39;file:1&#39;,&#39;catalogue&#39;,&#39;owenservera/aion:workspace/agents/AGENTS.md&#39;); |
| b | const | 152 | no | const b=item(&#39;a&#39;,&#39;file:2&#39;,&#39;catalogue&#39;,&#39;owenservera/aion:workspace/agents/BOOTSTRAP.md&#39;); |
| r | const | 153 | no | const r=run([a,b]); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 6 | external |
| node:assert/strict | import | 7 | external |
| ../crosswalk.mjs | import | 8 | [hq/catalogue-identity/crosswalk.mjs](../crosswalk.mjs.md) |
| ../labs-adapter.mjs | import | 9 | [hq/catalogue-identity/labs-adapter.mjs](../labs-adapter.mjs.md) |
| ../source-adapters.mjs | import | 114 | [hq/catalogue-identity/source-adapters.mjs](../source-adapters.mjs.md) |
| ../observer-export.mjs | import | 127 | [hq/catalogue-identity/observer-export.mjs](../observer-export.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | C4 Lane B crosswalk contract, privacy, replay, and orphan regression tests. |
| 3 | owner | repos-hq | — | repos-hq |
| 4 | task | — | — | VIVIM-WAVE-C4-LANE-B |

## Excerpt

```javascript
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
```

_First 80 of 157 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

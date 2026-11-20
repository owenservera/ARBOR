# File: hq/version-intelligence/identity/test/identity.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/identity/test/identity.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8763 B |
| Lines | 125 |
| Hash | 04335372a0da |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sha | function | 8 | no | const sha=(c)=&gt;c.repeat(40),sum=(c)=&gt;c.repeat(64); |
| pin | const | 9 | no | const pin=(pinId,repo=&#39;owenservera/repos-hq&#39;,rev=sha(&#39;a&#39;),complete=&#39;complete&#39;,manifest=sum(&#39;b&#39;))=&gt;({ pinId,repoIdentity:repo,resolvedCommitSha:rev,manifestDigest:manifest,completeness:complete}); |
| run | function | 14 | no | const run=(pins,records,more={})=&gt;project({pins,records,...more}); |
| pins | const | 16 | no | const pins=[pin(&#39;p1&#39;),pin(&#39;p2&#39;,&#39;owenservera/repos-hq&#39;,sha(&#39;d&#39;)),pin(&#39;p3&#39;,&#39;owenservera/ARBOR&#39;,sha(&#39;a&#39;))]; |
| r | const | 17 | no | const r=run(pins,pins.map(p=&gt;record(p.pinId,&#39;same-record&#39;))); |
| p | const | 27 | no | const p=[pin(&#39;p2&#39;,&#39;owenservera/repos-hq&#39;,sha(&#39;d&#39;)),pin(&#39;p1&#39;)]; |
| rows | const | 28 | no | const rows=[record(&#39;p1&#39;,&#39;one&#39;),record(&#39;p2&#39;,&#39;one&#39;)]; |
| p | const | 32 | no | const p=[pin(&#39;p1&#39;),pin(&#39;p2&#39;,&#39;owenservera/ARBOR&#39;,sha(&#39;d&#39;))]; |
| r | const | 33 | no | const r=run(p,[record(&#39;p1&#39;,&#39;x&#39;,{canonicalId:&#39;cap:source-comparison&#39;,implementationDigest:sha(&#39;1&#39;)}), record(&#39;p2&#39;,&#39;z&#39;,{canonicalId:&#39;cap:source-comparison&#39;,implementationDigest:sha(&#39;2&#39;),owner:&#39;arbor&#39;})… |
| p | const | 41 | no | const p=[pin(&#39;p1&#39;),pin(&#39;p2&#39;,&#39;owenservera/ARBOR&#39;,sha(&#39;d&#39;))]; |
| rows | const | 42 | no | const rows=[record(&#39;p1&#39;,&#39;x&#39;,{canonicalId:&#39;cap:a&#39;}),record(&#39;p2&#39;,&#39;y&#39;,{canonicalId:&#39;cap:a&#39;})]; |
| a | const | 43 | no | const a=run(p,rows); |
| decision | const | 45 | no | const decision={left,right,reviewer:&#39;owner-review&#39;,evidenceRef:&#39;owner-ledger:approved&#39;,decision:&#39;confirm_equivalence&#39;}; |
| r | const | 47 | no | const r=run(p,rows,{decisions:[{...decision,ownerConfirmed:true,reviewed:true}]}); |
| p | const | 63 | no | const p=[pin(&#39;p1&#39;)],a=run(p,[record(&#39;p1&#39;,&#39;s&#39;)]); |
| start | const | 69 | no | const start=run([pin(&#39;p1&#39;)],[record(&#39;p1&#39;,&#39;s&#39;)]); |
| missing | const | 70 | no | const missing=run([pin(&#39;p1&#39;,&#39;owenservera/repos-hq&#39;,sha(&#39;a&#39;),&#39;missing&#39;)],[],{previous:start}); |
| partial | const | 74 | no | const partial=run([pin(&#39;p1&#39;,&#39;owenservera/repos-hq&#39;,sha(&#39;a&#39;),&#39;partial&#39;)],[],{previous:missing}); |
| p | const | 78 | no | const p=[pin(&#39;p1&#39;),pin(&#39;p2&#39;,&#39;owenservera/ARBOR&#39;,sha(&#39;d&#39;),&#39;partial&#39;)]; |
| r | const | 79 | no | const r=run(p,[record(&#39;p1&#39;,&#39;a&#39;),record(&#39;p1&#39;,&#39;b&#39;)], {links:[{pinId:&#39;p1&#39;,sourceScopedRecordId:&#39;a&#39;,targetPinId:&#39;p1&#39;,targetSourceScopedRecordId:&#39;b&#39;,relation:&#39;implements&#39;}, {pinId:&#39;p1&#39;,sourceScopedRecordI… |
| p | const | 87 | no | const p=[pin(&#39;p1&#39;)]; |
| s | const | 94 | no | const s={id:&#39;labs:capabilities&#39;,repository:&#39;owenservera/repos-hq&#39;,revision:sha(&#39;a&#39;),completeness:&#39;partial&#39;,authority:&#39;labs_observer&#39;}; |
| snapshot | const | 95 | no | const snapshot=buildCrosswalk({as_of:&#39;2026-11-12T00:00:00Z&#39;,sources:[s],records:[{ source_id:s.id,source_item_id:&#39;row&#39;,type:&#39;capability&#39;,name:&#39;Pinned import&#39;, canonical_id:&#39;cap:pinned&#39;,evidence:[{kin… |
| adapted | const | 98 | no | const adapted=adaptC4CrosswalkToHvi({snapshot,pinsBySourceId:{[s.id]:pin(&#39;p1&#39;)}}); |
| r | const | 99 | no | const r=run(adapted.pins,adapted.records,{links:adapted.links}); |
| s | const | 106 | no | const s={id:&#39;hq-dev&#39;,revision:sha(&#39;a&#39;),state:&#39;complete&#39;,owner:&#39;hq&#39;}; |
| envelope | const | 107 | no | const envelope=buildCatalogueSnapshot({sources:[s],records:[{ id:&#39;cap:read-only&#39;,sourceId:&#39;hq-dev&#39;,sourceRevision:sha(&#39;a&#39;),kind:&#39;capability&#39;,status:&#39;implemented&#39;, contentDigest:sum(&#39;f&#39;),evidence:[{ty… |
| a | const | 110 | no | const a=adaptCatalogueDeltaToHvi({envelope,pin:pin(&#39;p1&#39;)}); |
| r | const | 111 | no | const r=run(a.pins,a.records); |
| snapshot | const | 118 | no | const snapshot=buildCrosswalk({as_of:&#39;2026-11-12T00:00:00Z&#39;,sources:[{ id:&#39;s&#39;,repository:&#39;owenservera/repos-hq&#39;,revision:sha(&#39;a&#39;),completeness:&#39;partial&#39;}], records:[{source_id:&#39;s&#39;,source_item_id:&#39;x&#39;,… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../index.mjs | import | 3 | [hq/version-intelligence/identity/index.mjs](../index.mjs.md) |
| ../legacy-adapters.mjs | import | 4 | [hq/version-intelligence/identity/legacy-adapters.mjs](../legacy-adapters.mjs.md) |
| ../../../catalogue-identity/crosswalk.mjs | import | 5 | [hq/catalogue-identity/crosswalk.mjs](../../../catalogue-identity/crosswalk.mjs.md) |
| ../../../lib/catalogue-delta.mjs | import | 6 | [hq/lib/catalogue-delta.mjs](../../../lib/catalogue-delta.mjs.md) |
| ../../../catalogue-identity/observer-export.mjs | dynamic | 117 | [hq/catalogue-identity/observer-export.mjs](../../../catalogue-identity/observer-export.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 126 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

# File: hq/version-intelligence/parity/atlas.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/parity/atlas.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5660 B |
| Lines | 102 |
| Hash | 4415f662bb5c |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sha | function | 5 | no | const sha = c =&gt; c.repeat(40); |
| donor | function | 6 | no | const donor = (entries, completeness=&#39;complete&#39;) =&gt; ({ repo: &#39;owenservera/repos-hq&#39;, commitSha: sha(&#39;a&#39;), completeness, scope:&#39;development&#39;, entries, }); |
| target | function | 10 | no | const target = (entries, completeness=&#39;complete&#39;) =&gt; ({ repo: &#39;owenservera/ARBOR&#39;, commitSha: sha(&#39;b&#39;), completeness, scope:&#39;development&#39;, entries, }); |
| entry | const | 14 | no | const entry=(path,blobSha=sha(&#39;c&#39;))=&gt;({path,blobSha,kind:&#39;blob&#39;}); |
| run | function | 15 | no | const run=(d,t,extra={})=&gt;buildParityAtlas({donor:d,target:t,...extra}); |
| r | const | 18 | no | const r=run(donor([entry(&#39;hq/x.mjs&#39;)]),target([entry(&#39;hq/x.mjs&#39;)])); |
| r | const | 26 | no | const r=run(donor([entry(&#39;hq/x.mjs&#39;)]),target([entry(&#39;hq/x.mjs&#39;,sha(&#39;d&#39;))])); |
| r | const | 31 | no | const r=run(donor([entry(&#39;hq/x.mjs&#39;)]),target([entry(&#39;hq/new/x.mjs&#39;)])); |
| d | const | 41 | no | const d=donor([entry(&#39;hq/x.mjs&#39;),entry(&#39;hq/y.mjs&#39;)]); |
| source | const | 42 | no | const source={repo:d.repo,commitSha:d.commitSha,path:&#39;hq/x.mjs&#39;,blobSha:sha(&#39;c&#39;)}; |
| r | const | 43 | no | const r=run(d,target([]),{sourceEvidence:[ {id:&#39;e1&#39;,kind:&#39;source_symbol&#39;,source,inspected:true}, {id:&#39;e2&#39;,kind:&#39;fixture&#39;,source,inspected:true}, ]}); |
| d | const | 52 | no | const d=donor([entry(&#39;hq/x.mjs&#39;)]),t=target([]); |
| options | const | 53 | no | const options={owners:[{path:&#39;hq/x.mjs&#39;,owner:&#39;HQ&#39;}],ownerDecisions:[ |
| r | const | 57 | no | const r=run(d,t,{...options,sourceEvidence:[{id:&#39;e1&#39;,kind:&#39;owner_decision&#39;}]}); |
| d | const | 61 | no | const d=donor([entry(&#39;hq/x.mjs&#39;)]),t=target([]); |
| d | const | 69 | no | const d=donor([entry(&#39;hq/x.mjs&#39;)]),t=target([entry(&#39;hq/x.mjs&#39;)]); |
| source | const | 70 | no | const source={repo:t.repo,commitSha:t.commitSha,path:&#39;hq/x.mjs&#39;,blobSha:sha(&#39;c&#39;)}; |
| fake | const | 71 | no | const fake={kind:&#39;host_receipt&#39;,accepted:true,exitCode:0,source,provenanceVerified:true}; |
| d | const | 75 | no | const d=donor([entry(&#39;hq/x.mjs&#39;)]),t=target([entry(&#39;hq/x.mjs&#39;)]); |
| source | const | 76 | no | const source={repo:t.repo,commitSha:t.commitSha,path:&#39;hq/x.mjs&#39;,blobSha:sha(&#39;c&#39;)}; |
| receipt | const | 77 | no | const receipt={kind:&#39;host_receipt&#39;,accepted:true,exitCode:0,source, |
| r | const | 79 | no | const r=run(d,t,{testReceipts:[receipt]}); |
| a | const | 92 | no | const a=entry(&#39;hq/a.mjs&#39;),b=entry(&#39;hq/b.mjs&#39;); |
| x | const | 93 | no | const x=run(donor([b,a]),target([a,b])); |
| y | const | 94 | no | const y=run(donor([a,b]),target([b,a])); |
| huge | const | 100 | no | const huge=Array.from({length:10001},(_,i)=&gt;entry(&#39;hq/&#39;+i+&#39;.mjs&#39;)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ./atlas.mjs | import | 3 | [hq/version-intelligence/parity/atlas.mjs](./atlas.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildParityAtlas, ATLAS_SCHEMA } from './atlas.mjs';

const sha = c => c.repeat(40);
const donor = (entries, completeness='complete') => ({
  repo: 'owenservera/repos-hq', commitSha: sha('a'), completeness,
  scope:'development', entries,
});
const target = (entries, completeness='complete') => ({
  repo: 'owenservera/ARBOR', commitSha: sha('b'), completeness,
  scope:'development', entries,
});
const entry=(path,blobSha=sha('c'))=>({path,blobSha,kind:'blob'});
const run=(d,t,extra={})=>buildParityAtlas({donor:d,target:t,...extra});

test('physical exact blobs do not certify semantic or runtime parity',()=>{
 const r=run(donor([entry('hq/x.mjs')]),target([entry('hq/x.mjs')]));
 assert.equal(r.schema, ATLAS_SCHEMA);
 assert.equal(r.rows[0].source_state,'EXACT_BLOB');
 assert.equal(r.rows[0].capability_state,'UNKNOWN');
 assert.equal(r.rows[0].runtime_evidence,'UNRUN');
 assert.equal(r.coverage.inspectedFiles,0);
});
test('file changed at same path is not a confirmed replacement',()=>{
 const r=run(donor([entry('hq/x.mjs')]),target([entry('hq/x.mjs',sha('d'))]));
 assert.equal(r.rows[0].source_state,'SAME_PATH_CHANGED');
 assert.equal(r.rows[0].capability_state,'UNKNOWN');
});
test('exact relocation is physical only',()=>{
 const r=run(donor([entry('hq/x.mjs')]),target([entry('hq/new/x.mjs')]));
 assert.equal(r.rows[0].source_state,'EXACT_RELOCATION');
 assert.deepEqual(r.rows[0].target_path,['hq/new/x.mjs']);
 assert.equal(r.rows[0].capability_state,'UNKNOWN');
});
test('complete absent vs partial unobservable remain distinct',()=>{
 assert.equal(run(donor([entry('hq/x.mjs')]),target([])).rows[0].source_state,'MISSING_AT_TARGET');
 assert.equal(run(donor([entry('hq/x.mjs')]),target([],'partial')).rows[0].source_state,'UNOBSERVABLE');
});
test('coverage counts inspected source files, not test files or capability claims',()=>{
 const d=donor([entry('hq/x.mjs'),entry('hq/y.mjs')]);
 const source={repo:d.repo,commitSha:d.commitSha,path:'hq/x.mjs',blobSha:sha('c')};
 const r=run(d,target([]),{sourceEvidence:[
  {id:'e1',kind:'source_symbol',source,inspected:true},
  {id:'e2',kind:'fixture',source,inspected:true},
 ]});
 assert.equal(r.coverage.inspectedFiles,1);
 assert.equal(r.coverage.inspectedPercent,50);
 assert.equal(r.rows.find(x=>x.origin_path==='hq/y.mjs').decision,'UNKNOWN_UNREVIEWED');
});
test('owner cannot retire/exclude without matching owner decision evidence',()=>{
 const d=donor([entry('hq/x.mjs')]),t=target([]);
 const options={owners:[{path:'hq/x.mjs',owner:'HQ'}],ownerDecisions:[
  {path:'hq/x.mjs',owner:'HQ',state:'INTENTIONALLY_EXCLUDED',ownerAccepted:true,
   evidenceIds:['e1'],tombstoneRef:'e1'}]};
 assert.throws(()=>run(d,t,{...options,sourceEvidence:[{id:'e1',kind:'fixture'}]}),/UNPROVEN_TOMBSTONE/);
 const r=run(d,t,{...options,sourceEvidence:[{id:'e1',kind:'owner_decision'}]});
 assert.equal(r.rows[0].capability_state,'INTENTIONALLY_EXCLUDED');
});
test('unapproved owner changes and unproven runtime self-declarations fail closed',()=>{
 const d=donor([entry('hq/x.mjs')]),t=target([]);
 for(const state of ['PRESENT_EQUIVALENT_CONFIRMED','RUNTIME_VERIFIED']){
  assert.throws(()=>run(d,t,{ownerDecisions:[
   {path:'hq/x.mjs',owner:'imposter',state,ownerAccepted:true,evidenceIds:['e1']}],
   sourceEvidence:[{id:'e1',kind:'owner_decision'}]}),/UNPROVEN_OWNER_DECISION/);
 }
});
test('source-only test receipt is never runtime verification',()=>{
 const d=donor([entry('hq/x.mjs')]),t=target([entry('hq/x.mjs')]);
 const source={repo:t.repo,commitSha:t.commitSha,path:'hq/x.mjs',blobSha:sha('c')};
 const fake={kind:'host_receipt',accepted:true,exitCode:0,source,provenanceVerified:true};
 assert.equal(run(d,t,{testReceipts:[fake]}).rows[0].capability_state,'UNKNOWN');
});
test('even caller-marked attested receipts cannot promote runtime without Host verifier',()=>{
 const d=donor([entry('hq/x.mjs')]),t=target([entry('hq/x.mjs')]);
 const source={repo:t.repo,commitSha:t.commitSha,path:'hq/x.mjs',blobSha:sha('c')};
 const receipt={kind:'host_receipt',accepted:true,exitCode:0,source,
  actorRef:'actor',sessionRef:'session',grantRef:'grant',provenanceVerified:true};
 const r=run(d,t,{testReceipts:[receipt]});
 assert.equal(r.rows[0].capability_state,'UNKNOWN');
```

_First 80 of 103 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

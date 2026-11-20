# File: hq/test/live-graph-wave1-a-r2-audit.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/live-graph-wave1-a-r2-audit.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10564 B |
| Lines | 106 |
| Hash | 8eb27559c2ae |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| h | function | 8 | no | const h = x =&gt; createHash(&#39;sha256&#39;).update(x).digest(&#39;hex&#39;); |
| rootSha | const | 9 | no | const rootSha = &#39;a&#39;.repeat(40); |
| canSymlink | function | 12 | no | const canSymlink = (() =&gt; { try { const probe = mkdtempSync(join(tmpdir(), &#39;hq-symlink-probe-&#39;)); writeFileSync(join(probe, &#39;probe.txt&#39;), &#39;probe&#39;); symlinkSync(join(probe, &#39;probe.txt&#39;), join(probe, &#39;… |
| probe | const | 14 | no | const probe = mkdtempSync(join(tmpdir(), &#39;hq-symlink-probe-&#39;)); |
| testSymlink | const | 21 | no | const testSymlink = canSymlink ? test : test.skip; |
| fixture | function | 22 | no | function fixture(contents = {&#39;src/app.mjs&#39;:&#39;export const app = 1;\\n&#39;}) { |
| dir | const | 23 | no | const dir = mkdtempSync(join(tmpdir(), &#39;hq-a-r2-&#39;)); |
| files | const | 25 | no | const files=Object.entries(contents).map(([path,bytes],i)=&gt;({id:&#39;hqg1:file&#39;+i,rootId:&#39;repos-hq&#39;,path,sourceHash:h(bytes),size:Buffer.byteLength(bytes),lang:&#39;javascript&#39;})); |
| records | const | 26 | no | const records={schema:INPUT_SCHEMA,project:{id:&#39;vivim-unified-architecture&#39;,intentRevision:1},roots:[{id:&#39;repos-hq&#39;,headSha:rootSha}],files,symbols:[],imports:[],annotations:[],digest:h(&#39;origin&#39;)}; |
| inventory | const | 27 | no | const inventory=files.map(f=&gt;({rootId:f.rootId,path:f.path,decision:&#39;eligible&#39;})); |
| cleanup | function | 30 | no | function cleanup(f){rmSync(f.dir,{recursive:true,force:true});} |
| audit | function | 31 | no | const audit=f=&gt;auditLaneASources(f.records,f.opts); |
| f | const | 37 | no | const f=fixture();try{const a=audit(f),b=audit(f);assert.equal(a.schema,AUDIT_SCHEMA);assert.deepEqual(a,b);assert.equal(a.status,&#39;AUDIT_CONSISTENT_NOT_INTEGRATED&#39;);assert.equal(a.roots[0].verified,1… |
| f | const | 40 | no | const f=fixture();try{const r=audit(f);assert.equal(r.provenance.localHeadsVerified,false);assert.equal(r.provenance.sourceScannedByAuditor,false);}finally{cleanup(f);} |
| f | const | 43 | no | const f=fixture();try{assert.throws(()=&gt;auditLaneASources({...f.records,schema:&#39;v2&#39;},f.opts),/UNSUPPORTED_SOURCE_SCHEMA/);assert.throws(()=&gt;auditLaneASources({...f.records,files:null},f.opts),/MALFOR… |
| f | const | 46 | no | const f=fixture();try{writeFileSync(join(f.dir,&#39;src/app.mjs&#39;),&#39;export const bad = 1;\\n&#39;);const r=audit(f);assert.equal(r.status,&#39;BLOCKED&#39;);assert.ok(r.diagnostics.some(d=&gt;d.code===&#39;SOURCE_HASH_MISMAT… |
| f | const | 49 | no | const f=fixture();try{f.records.files[0].size+=1;const r=audit(f);assert.ok(r.diagnostics.some(d=&gt;d.code===&#39;SOURCE_SIZE_MISMATCH&#39;));}finally{cleanup(f);} |
| f | const | 52 | no | const f=fixture();try{const r=auditLaneASources(f.records,{rootPaths:f.opts.rootPaths});assert.equal(r.status,&#39;BLOCKED&#39;);assert.equal(r.roots[0].coverage,null);assert.ok(r.diagnostics.some(d=&gt;d.code=… |
| f | const | 55 | no | const f=fixture();try{const r=auditLaneASources(f.records,{...f.opts,rootPaths:{}});assert.ok(r.diagnostics.some(d=&gt;d.code===&#39;ROOT_NOT_MOUNTED&#39;));}finally{cleanup(f);} |
| f | const | 58 | no | const f=fixture();try{f.opts.inventory=[];const r=audit(f);assert.ok(r.diagnostics.some(d=&gt;d.code===&#39;INDEX_OUTSIDE_INVENTORY&#39;));}finally{cleanup(f);} |
| f | const | 61 | no | const f=fixture({&#39;a.mjs&#39;:&#39;let x=1;&#39;,&#39;b.mjs&#39;:&#39;let y=2;&#39;});try{f.records.files.pop();const r=audit(f);assert.equal(r.roots[0].eligible,2);assert.equal(r.roots[0].missing,1);assert.ok(r.diagnostics.some… |
| f | const | 64 | no | const f=fixture();try{f.opts.inventory=[{rootId:&#39;repos-hq&#39;,path:&#39;src/app.mjs&#39;,decision:&#39;excluded&#39;,reason:&#39;generated&#39;}];const r=audit(f);assert.equal(r.roots[0].excluded,1);assert.ok(r.diagnostics.som… |
| f | const | 67 | no | const f=fixture();try{f.opts.inventory.push({rootId:&#39;repos-hq&#39;,path:&#39;new.mjs&#39;,decision:&#39;unknown&#39;,reason:&#39;read failed&#39;});const r=audit(f);assert.equal(r.roots[0].unknown,1);assert.ok(r.diagnostics.som… |
| f | const | 70 | no | const f=fixture();try{rmSync(join(f.dir,&#39;src/app.mjs&#39;));const r=audit(f);assert.ok(r.diagnostics.some(d=&gt;d.code===&#39;SOURCE_READ_FAILED&#39;));}finally{cleanup(f);} |
| f | const | 73 | no | const f=fixture();const outside=mkdtempSync(join(tmpdir(),&#39;hq-a-r2-external-&#39;)); |
| f | const | 77 | no | const f=fixture();try{f.records.files.push({...f.records.files[0]});const r=audit(f);assert.ok(r.diagnostics.some(d=&gt;d.code===&#39;FILE_DUPLICATE_ID_OR_PATH&#39;));}finally{cleanup(f);} |
| f | const | 80 | no | const f=fixture();try{f.records.annotations=[{id:&#39;hqg1:v1&#39;,fileId:f.records.files[0].id,line:1,kind:&#39;context&#39;,claimStatus:&#39;unverified&#39;},{id:&#39;hqg1:v1&#39;,fileId:f.records.files[0].id,line:1,kind:&#39;todo&#39;,c… |
| f | const | 83 | no | const f=fixture();try{f.records.imports=[{id:&#39;hqg1:import1&#39;,from:f.records.files[0].id,to:null,line:1,relation:&#39;socket-send&#39;,observation:&#39;observed&#39;}];const r=audit(f);assert.ok(r.diagnostics.some(d=&gt;… |
| f | const | 86 | no | const f=fixture();try{f.records.annotations=[{id:&#39;hqg1:ann&#39;,fileId:f.records.files[0].id,line:1,kind:&#39;action&#39;,claimStatus:&#39;wired&#39;}];const r=audit(f);assert.ok(r.diagnostics.some(d=&gt;d.code===&#39;ANNOTATI… |
| f | const | 89 | no | const f=fixture();try{f.records.symbols=[{id:&#39;hqg1:sym&#39;,fileId:&#39;unknown&#39;,line:1,name:&#39;abc&#39;,endLine:1}];f.records.imports=[{id:&#39;hqg1:imp&#39;,from:f.records.files[0].id,to:&#39;unknown&#39;,line:1,relation:&#39;stati… |
| f | const | 92 | no | const f=fixture();try{f.records.roots.push(f.records.roots[0]);assert.throws(()=&gt;audit(f),/INVALID_ROOT_OR_HEAD/);}finally{cleanup(f);} |
| f | const | 95 | no | const f=fixture();try{const report=assessLaneECompatibility(f.records,{});assert.equal(report.status,&#39;BLOCKED_CONTRACT_CROSSWALK&#39;);assert.equal(report.emittedEFeed,false);assert.ok(report.issues.incl… |
| f | const | 98 | no | const f=fixture();try{const scope={schema:&#39;vivim.wave1.project-scope/1&#39;,projectId:f.records.project.id,revision:1,intentId:&#39;vivim.graph-intent@1&#39;,roots:[{id:&#39;repos-hq&#39;,repo:&#39;owenservera/repos-hq&#39;,pat… |
| f | const | 101 | no | const f=fixture();try{const scope={schema:&#39;vivim.wave1.project-scope/1&#39;,projectId:&#39;vivim&#39;,revision:2,intentId:&#39;x&#39;,roots:[{id:&#39;repos-hq&#39;,repo:&#39;owenservera/repos-hq&#39;,path:&#39;hq&#39;,commitSha:&#39;b&#39;.repeat(40)}… |
| f | const | 105 | no | const f=fixture();try{f.records.symbols=[{id:&#39;hqg1:sym&#39;,fileId:f.records.files[0].id,line:500,endLine:501,name:&#39;absurd&#39;}];const r=audit(f);assert.ok(r.diagnostics.some(d=&gt;d.code===&#39;ANCHOR_OUTSIDE_SOU… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:crypto | import | 3 | external |
| node:fs | import | 4 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| ../lib/live-graph/wave1/lane-a-r2-audit.mjs | import | 7 | [hq/lib/live-graph/wave1/lane-a-r2-audit.mjs](../lib/live-graph/wave1/lane-a-r2-audit.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { AUDIT_SCHEMA, INPUT_SCHEMA, auditLaneASources, verifySourceBytes, safeRelativePath, classifyRelativePath, assessLaneECompatibility } from '../lib/live-graph/wave1/lane-a-r2-audit.mjs';
const h = x => createHash('sha256').update(x).digest('hex');
const rootSha = 'a'.repeat(40);
// Windows without Developer Mode/admin refuses symlink creation (EPERM -4048);
// the symlink rule below stays enforced wherever the OS allows creating one.
const canSymlink = (() => {
  try {
    const probe = mkdtempSync(join(tmpdir(), 'hq-symlink-probe-'));
    writeFileSync(join(probe, 'probe.txt'), 'probe');
    symlinkSync(join(probe, 'probe.txt'), join(probe, 'probe-link'));
    rmSync(probe, { recursive: true, force: true });
    return true;
  } catch { return false; }
})();
const testSymlink = canSymlink ? test : test.skip;
function fixture(contents = {'src/app.mjs':'export const app = 1;\n'}) {
  const dir = mkdtempSync(join(tmpdir(), 'hq-a-r2-'));
  for (const [p,v] of Object.entries(contents)) { const abs=join(dir,p); mkdirSync(dirname(abs),{recursive:true});writeFileSync(abs,v); }
  const files=Object.entries(contents).map(([path,bytes],i)=>({id:'hqg1:file'+i,rootId:'repos-hq',path,sourceHash:h(bytes),size:Buffer.byteLength(bytes),lang:'javascript'}));
  const records={schema:INPUT_SCHEMA,project:{id:'vivim-unified-architecture',intentRevision:1},roots:[{id:'repos-hq',headSha:rootSha}],files,symbols:[],imports:[],annotations:[],digest:h('origin')};
  const inventory=files.map(f=>({rootId:f.rootId,path:f.path,decision:'eligible'}));
  return {dir,records,inventory,opts:{rootPaths:{'repos-hq':dir},inventory,inventoryProof:{mode:'test-fixture'}}};
}
function cleanup(f){rmSync(f.dir,{recursive:true,force:true});}
const audit=f=>auditLaneASources(f.records,f.opts);
test('safe relative path blocks traversal/secret/different separator/drive/control chars',()=>{
  for(const p of ['../outside','.env','src/.env.production','x/foo.pem','session.json','x/login data','C:/secret','/etc/passwd','a\\b','src/./x','src//x','src/../x','\0'])assert.equal(safeRelativePath(p),false,p);
  assert.equal(safeRelativePath('src/日本語.ts'),true);assert.equal(classifyRelativePath('src/settings.mjs'),'allowed');
});
test('unmodified v1 input yields consistent SHA-pinned audit without root paths in output',()=>{
  const f=fixture();try{const a=audit(f),b=audit(f);assert.equal(a.schema,AUDIT_SCHEMA);assert.deepEqual(a,b);assert.equal(a.status,'AUDIT_CONSISTENT_NOT_INTEGRATED');assert.equal(a.roots[0].verified,1);assert.deepEqual(a.roots[0].coverage,{verified:1,eligible:1});assert.ok(!JSON.stringify(a).includes(f.dir));assert.equal(a.boundaries.rustJournalWritten,false);}finally{cleanup(f);}
});
test('source integrity not automatically equated with real root HEAD verification',()=>{
  const f=fixture();try{const r=audit(f);assert.equal(r.provenance.localHeadsVerified,false);assert.equal(r.provenance.sourceScannedByAuditor,false);}finally{cleanup(f);}
});
test('rejects malformed v1 contract or missing primary arrays',()=>{
  const f=fixture();try{assert.throws(()=>auditLaneASources({...f.records,schema:'v2'},f.opts),/UNSUPPORTED_SOURCE_SCHEMA/);assert.throws(()=>auditLaneASources({...f.records,files:null},f.opts),/MALFORMED/);}finally{cleanup(f);}
});
test('refuses SHA drift even when size stays unchanged',()=>{
  const f=fixture();try{writeFileSync(join(f.dir,'src/app.mjs'),'export const bad = 1;\n');const r=audit(f);assert.equal(r.status,'BLOCKED');assert.ok(r.diagnostics.some(d=>d.code==='SOURCE_HASH_MISMATCH'));}finally{cleanup(f);}
});
test('rejects source size drift even with a correct content SHA',()=>{
  const f=fixture();try{f.records.files[0].size+=1;const r=audit(f);assert.ok(r.diagnostics.some(d=>d.code==='SOURCE_SIZE_MISMATCH'));}finally{cleanup(f);}
});
test('no inventory cannot count as coverage pass',()=>{
  const f=fixture();try{const r=auditLaneASources(f.records,{rootPaths:f.opts.rootPaths});assert.equal(r.status,'BLOCKED');assert.equal(r.roots[0].coverage,null);assert.ok(r.diagnostics.some(d=>d.code==='INVENTORY_NOT_SUPPLIED'));}finally{cleanup(f);}
});
test('unmounted root blocks even if source hash is present',()=>{
  const f=fixture();try{const r=auditLaneASources(f.records,{...f.opts,rootPaths:{}});assert.ok(r.diagnostics.some(d=>d.code==='ROOT_NOT_MOUNTED'));}finally{cleanup(f);}
});
test('index includes file absent from independent inventory: blocked',()=>{
  const f=fixture();try{f.opts.inventory=[];const r=audit(f);assert.ok(r.diagnostics.some(d=>d.code==='INDEX_OUTSIDE_INVENTORY'));}finally{cleanup(f);}
});
test('inventory eligible but unindexed: measured missing denominator and blocked',()=>{
  const f=fixture({'a.mjs':'let x=1;','b.mjs':'let y=2;'});try{f.records.files.pop();const r=audit(f);assert.equal(r.roots[0].eligible,2);assert.equal(r.roots[0].missing,1);assert.ok(r.diagnostics.some(d=>d.code==='ELIGIBLE_NOT_INDEXED'));}finally{cleanup(f);}
});
test('excluded file indexed is refused with complete denominator',()=>{
  const f=fixture();try{f.opts.inventory=[{rootId:'repos-hq',path:'src/app.mjs',decision:'excluded',reason:'generated'}];const r=audit(f);assert.equal(r.roots[0].excluded,1);assert.ok(r.diagnostics.some(d=>d.code==='INDEXED_EXCLUDED_FILE'));}finally{cleanup(f);}
});
test('unknown discovered source refuses PASS, does not vanish from denominator',()=>{
  const f=fixture();try{f.opts.inventory.push({rootId:'repos-hq',path:'new.mjs',decision:'unknown',reason:'read failed'});const r=audit(f);assert.equal(r.roots[0].unknown,1);assert.ok(r.diagnostics.some(d=>d.code==='INVENTORY_UNKNOWN'));}finally{cleanup(f);}
});
test('missing source is read failure, not a silently stale file',()=>{
  const f=fixture();try{rmSync(join(f.dir,'src/app.mjs'));const r=audit(f);assert.ok(r.diagnostics.some(d=>d.code==='SOURCE_READ_FAILED'));}finally{cleanup(f);}
});
testSymlink('symlink outside root is refused and never followed',()=>{
  const f=fixture();const outside=mkdtempSync(join(tmpdir(),'hq-a-r2-external-'));
  try{writeFileSync(join(outside,'secret.mjs'),'export const x = 1;');symlinkSync(join(outside,'secret.mjs'),join(f.dir,'src/link.mjs'));f.records.files.push({...f.records.files[0],id:'hqg1:link',path:'src/link.mjs',sourceHash:h('export const x = 1;'),size:19});f.opts.inventory.push({rootId:'repos-hq',path:'src/link.mjs',decision:'eligible'});const r=audit(f);assert.ok(r.diagnostics.some(d=>d.code==='SOURCE_SYMLINK'));}finally{cleanup(f);rmSync(outside,{recursive:true,force:true});}
});
test('same file stable id collisions are not accidentally overwritten',()=>{
  const f=fixture();try{f.records.files.push({...f.records.files[0]});const r=audit(f);assert.ok(r.diagnostics.some(d=>d.code==='FILE_DUPLICATE_ID_OR_PATH'));}finally{cleanup(f);}
});
test('v1 same-line duplicate ID is exposed rather than silently deduplicated',()=>{
  const f=fixture();try{f.records.annotations=[{id:'hqg1:v1',fileId:f.records.files[0].id,line:1,kind:'context',claimStatus:'unverified'},{id:'hqg1:v1',fileId:f.records.files[0].id,line:1,kind:'todo',claimStatus:'unverified'}];const r=audit(f);assert.ok(r.diagnostics.some(d=>d.code==='DUPLICATE_OR_INVALID_RECORD_ID'));}finally{cleanup(f);}
```

_First 80 of 107 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

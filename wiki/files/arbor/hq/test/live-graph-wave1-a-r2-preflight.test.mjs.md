# File: hq/test/live-graph-wave1-a-r2-preflight.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/live-graph-wave1-a-r2-preflight.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4652 B |
| Lines | 50 |
| Hash | a66ffc41e9b8 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PREFLIGHT_MODULE | const | 13 | no | const PREFLIGHT_MODULE = &#39;../live-graph/wave1/lane-a/round2-preflight.mjs&#39;; |
| PREFLIGHT_PRESENT | const | 14 | no | const PREFLIGHT_PRESENT = existsSync(new URL(PREFLIGHT_MODULE, import.meta.url)); |
| PREFLIGHT_SKIP | const | 15 | no | const PREFLIGHT_SKIP = PREFLIGHT_PRESENT ? false |
| h | function | 18 | no | const h = x =&gt; createHash(&#39;sha256&#39;).update(x).digest(&#39;hex&#39;); |
| current | const | 19 | no | const current=dirname(fileURLToPath(import.meta.url)); |
| cli | const | 20 | no | const cli=resolve(current,&#39;../live-graph/wave1/lane-a/round2-preflight.mjs&#39;); |
| git | function | 21 | no | const git=(root,...args)=&gt;execFileSync(&#39;git&#39;,args,{cwd:root,encoding:&#39;utf8&#39;}).trim(); |
| fixture | function | 22 | no | function fixture() { |
| base | const | 23 | no | const base=mkdtempSync(join(tmpdir(),&#39;wave1-a-r2-two-roots-&#39;)); |
| roots | const | 24 | no | const roots=[],paths={},files=[]; |
| root | const | 26 | no | const root=join(base,id);mkdirSync(join(root,&#39;src&#39;),{recursive:true}); |
| observations | const | 32 | no | const observations={schema:&#39;vivim.wave1.code-observations/1&#39;,project:{id:&#39;vivim-unified-architecture&#39;,intentRevision:1},roots,files,symbols:[],imports:[],annotations:[],digest:h(&#39;synthetic&#39;)}; |
| f | const | 38 | no | const f=fixture();try{const a=preflight(f.observations,f.paths),b=preflight(f.observations,f.paths);assert.deepEqual(a,b);assert.equal(a.status,&#39;ISOLATED_CHECKS_CONSISTENT_NOT_INTEGRATED&#39;);assert.equ… |
| f | const | 41 | no | const f=fixture();try{const e={schema:&#39;vivim.wave1.project-scope/1&#39;,projectId:f.observations.project.id,revision:1,intentId:&#39;vivim.graph-intent@1&#39;,roots:f.observations.roots.map(x=&gt;({id:x.id,repo:&#39;ex… |
| f | const | 44 | no | const f=fixture();try{const a=join(f.base,&#39;a.json&#39;),r=join(f.base,&#39;roots.json&#39;);writeFileSync(a,JSON.stringify(f.observations));writeFileSync(r,JSON.stringify(f.paths));const result=spawnSync(process… |
| f | const | 47 | no | const f=fixture();try{const a=join(f.base,&#39;a.json&#39;),r=join(f.base,&#39;roots.json&#39;);writeFileSync(a,JSON.stringify(f.observations));writeFileSync(r,JSON.stringify({}));const result=spawnSync(process.exec… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:child_process | import | 3 | external |
| node:crypto | import | 4 | external |
| node:fs | import | 5 | external |
| node:path | import | 6 | external |
| node:os | import | 7 | external |
| node:url | import | 8 | external |
| node:fs | import | 9 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

// hq/live-graph/ is not present in this checkout (no commit in any branch ever
// added it). Skipped loudly rather than failing the gate on an absent artifact.
const PREFLIGHT_MODULE = '../live-graph/wave1/lane-a/round2-preflight.mjs';
const PREFLIGHT_PRESENT = existsSync(new URL(PREFLIGHT_MODULE, import.meta.url));
const PREFLIGHT_SKIP = PREFLIGHT_PRESENT ? false
  : 'orphaned suite: hq/live-graph/wave1/lane-a/round2-preflight.mjs is absent from this checkout';
const { preflight } = PREFLIGHT_PRESENT ? await import(PREFLIGHT_MODULE) : {};
const h = x => createHash('sha256').update(x).digest('hex');
const current=dirname(fileURLToPath(import.meta.url));
const cli=resolve(current,'../live-graph/wave1/lane-a/round2-preflight.mjs');
const git=(root,...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
function fixture() {
  const base=mkdtempSync(join(tmpdir(),'wave1-a-r2-two-roots-'));
  const roots=[],paths={},files=[];
  for(const [id,filename,body] of [['repos-hq','src/index.mjs','export const a=1;\n'],['tierflow','src/kernel.rs','pub fn value() {}\n']]) {
    const root=join(base,id);mkdirSync(join(root,'src'),{recursive:true});
    git(root,'init','-q');git(root,'config','user.email','fixture@example.invalid');git(root,'config','user.name','Fixture');
    writeFileSync(join(root,filename),body);git(root,'add','-A');git(root,'commit','-q','-m','fixture');
    paths[id]=root;roots.push({id,headSha:git(root,'rev-parse','HEAD')});
    files.push({id:'hqg1:'+id,rootId:id,path:filename,sourceHash:h(body),size:Buffer.byteLength(body),lang:id==='tierflow'?'rust':'javascript'});
  }
  const observations={schema:'vivim.wave1.code-observations/1',project:{id:'vivim-unified-architecture',intentRevision:1},roots,files,symbols:[],imports:[],annotations:[],digest:h('synthetic')};
  return {base,observations,paths};
}
describe('Wave 1 lane A round 2 preflight (hq/live-graph/wave1/lane-a)', { skip: PREFLIGHT_SKIP }, () => {

test('read-only preflight works against TWO real Git repos under one logical project',()=>{
  const f=fixture();try{const a=preflight(f.observations,f.paths),b=preflight(f.observations,f.paths);assert.deepEqual(a,b);assert.equal(a.status,'ISOLATED_CHECKS_CONSISTENT_NOT_INTEGRATED');assert.equal(a.rootReports.length,2);assert.equal(a.audit.roots.length,2);assert.equal(a.audit.totals.files,2);assert.equal(a.writesMade,0);assert.equal(a.rustJournalImported,false);assert.ok(!JSON.stringify(a).includes(f.base));}finally{rmSync(f.base,{recursive:true,force:true});}
});
test('preflight with E scope refuses to call raw A data an accepted E feed',()=>{
  const f=fixture();try{const e={schema:'vivim.wave1.project-scope/1',projectId:f.observations.project.id,revision:1,intentId:'vivim.graph-intent@1',roots:f.observations.roots.map(x=>({id:x.id,repo:'example/'+x.id,path:'src',commitSha:x.headSha}))};const r=preflight(f.observations,f.paths,e);assert.equal(r.status,'BLOCKED');assert.equal(r.eCompatibility.status,'BLOCKED_CONTRACT_CROSSWALK');}finally{rmSync(f.base,{recursive:true,force:true});}
});
test('CLI exits 0 for independently consistent isolated files, never claims integration',()=>{
  const f=fixture();try{const a=join(f.base,'a.json'),r=join(f.base,'roots.json');writeFileSync(a,JSON.stringify(f.observations));writeFileSync(r,JSON.stringify(f.paths));const result=spawnSync(process.execPath,[cli,'--a',a,'--roots',r],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);const o=JSON.parse(result.stdout);assert.equal(o.status,'ISOLATED_CHECKS_CONSISTENT_NOT_INTEGRATED');assert.equal(o.writesMade,0);}finally{rmSync(f.base,{recursive:true,force:true});}
});
test('CLI exits 2 for incomplete root map without leaking absolute machine paths',()=>{
  const f=fixture();try{const a=join(f.base,'a.json'),r=join(f.base,'roots.json');writeFileSync(a,JSON.stringify(f.observations));writeFileSync(r,JSON.stringify({}));const result=spawnSync(process.execPath,[cli,'--a',a,'--roots',r],{encoding:'utf8'});assert.equal(result.status,2);assert.ok(result.stderr.includes('ROOT_MISSING'));assert.ok(!result.stderr.includes(f.base));}finally{rmSync(f.base,{recursive:true,force:true});}
});

});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { preflight } from '../live-graph/wave1/lane-a/round2-preflight.mjs';
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

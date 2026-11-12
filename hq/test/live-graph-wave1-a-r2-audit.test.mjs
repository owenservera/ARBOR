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
});
test('false observed runtime import assertions are rejected',()=>{
  const f=fixture();try{f.records.imports=[{id:'hqg1:import1',from:f.records.files[0].id,to:null,line:1,relation:'socket-send',observation:'observed'}];const r=audit(f);assert.ok(r.diagnostics.some(d=>d.code==='NONSTATIC_IMPORT_ASSERTION'));}finally{cleanup(f);}
});
test('unverified source declaration must not promote action authority',()=>{
  const f=fixture();try{f.records.annotations=[{id:'hqg1:ann',fileId:f.records.files[0].id,line:1,kind:'action',claimStatus:'wired'}];const r=audit(f);assert.ok(r.diagnostics.some(d=>d.code==='ANNOTATION_AUTHORITY_ESCALATION'));}finally{cleanup(f);}
});
test('unbound symbol and unresolved target import are reported',()=>{
  const f=fixture();try{f.records.symbols=[{id:'hqg1:sym',fileId:'unknown',line:1,name:'abc',endLine:1}];f.records.imports=[{id:'hqg1:imp',from:f.records.files[0].id,to:'unknown',line:1,relation:'static-import',observation:'source-only'}];const r=audit(f);assert.ok(r.diagnostics.some(d=>d.code==='ORPHAN_SYMBOL'));assert.ok(r.diagnostics.some(d=>d.code==='IMPORT_TO_UNKNOWN_FILE'));}finally{cleanup(f);}
});
test('no aliasing root row with duplicate root id',()=>{
  const f=fixture();try{f.records.roots.push(f.records.roots[0]);assert.throws(()=>audit(f),/INVALID_ROOT_OR_HEAD/);}finally{cleanup(f);}
});
test('incomplete E scope cannot be described as assembled feed',()=>{
  const f=fixture();try{const report=assessLaneECompatibility(f.records,{});assert.equal(report.status,'BLOCKED_CONTRACT_CROSSWALK');assert.equal(report.emittedEFeed,false);assert.ok(report.issues.includes('E_SCOPE_NOT_PROVIDED'));}finally{cleanup(f);}
});
test('matched E project and scope still requires independently approved lowering',()=>{
  const f=fixture();try{const scope={schema:'vivim.wave1.project-scope/1',projectId:f.records.project.id,revision:1,intentId:'vivim.graph-intent@1',roots:[{id:'repos-hq',repo:'owenservera/repos-hq',path:'hq',commitSha:rootSha}]};const r=assessLaneECompatibility(f.records,scope);assert.deepEqual(r.issues,['SOURCE_RECORD_LOWERING_REQUIRED']);assert.equal(r.wroteRustJournal,false);}finally{cleanup(f);}
});
test('E root/head discrepancy is explicit, not coerced',()=>{
  const f=fixture();try{const scope={schema:'vivim.wave1.project-scope/1',projectId:'vivim',revision:2,intentId:'x',roots:[{id:'repos-hq',repo:'owenservera/repos-hq',path:'hq',commitSha:'b'.repeat(40)}]};const r=assessLaneECompatibility(f.records,scope);assert.ok(r.issues.includes('PROJECT_ID_MISMATCH'));assert.ok(r.issues.includes('SCOPE_REVISION_MISMATCH'));assert.ok(r.issues.includes('E_ROOT_SHA_MISMATCH:repos-hq'));}finally{cleanup(f);}
});

test('anchor source line must exist in a SHA-verified file',()=>{
  const f=fixture();try{f.records.symbols=[{id:'hqg1:sym',fileId:f.records.files[0].id,line:500,endLine:501,name:'absurd'}];const r=audit(f);assert.ok(r.diagnostics.some(d=>d.code==='ANCHOR_OUTSIDE_SOURCE'));}finally{cleanup(f);}
});

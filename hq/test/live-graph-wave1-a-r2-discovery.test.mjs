import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { discoverPinnedRoot, discoveryAsInventory, DISCOVERY_SCHEMA } from '../lib/live-graph/wave1/lane-a-r2-discovery.mjs';
const git=(root,...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
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
function setup(files={'src/app.ts':'export const a = 1;\n'}) {
  const root=mkdtempSync(join(tmpdir(),'hq-a-r2-git-'));
  git(root,'init','-q');git(root,'config','user.name','Fixture');git(root,'config','user.email','fixture@example.invalid');
  for(const [p,data] of Object.entries(files)){const dest=join(root,p);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,data);}
  git(root,'add','-A');git(root,'commit','-q','-m','fixture');
  return {root,headSha:git(root,'rev-parse','HEAD'),opts:{rootId:'repos-hq',rootPath:root,headSha:git(root,'rev-parse','HEAD')}};
}
const dispose=x=>rmSync(x.root,{recursive:true,force:true});
test('real Git pinned source reader inventories tracked source and documentation',()=>{
  const f=setup({'src/app.ts':'export const a = 1;\n','README.md':'# Title\n','data/config.json':'{"ok":true}\n'});
  try{const p=discoverPinnedRoot(f.opts);assert.equal(p.schema,DISCOVERY_SCHEMA);assert.equal(p.counts.eligible,3);assert.equal(p.rootHeadCheckedBeforeAndAfter,true);assert.equal(p.trackedOnly,true);assert.equal(p.items.filter(x=>x.sha256).length,3);assert.deepEqual(p,discoverPinnedRoot(f.opts));assert.ok(!JSON.stringify(p).includes(f.root));assert.equal(discoveryAsInventory(p).length,3);}finally{dispose(f);}
});
test('dirty real root and untracked source refuse scan, never call it success',()=>{
  const f=setup();try{writeFileSync(join(f.root,'src/unknown.ts'),'let bad=1;');assert.throws(()=>discoverPinnedRoot(f.opts),/DISCOVERY_DIRTY_ROOT/);}finally{dispose(f);}
});
test('commit head mismatch refuses scan',()=>{
  const f=setup();try{assert.throws(()=>discoverPinnedRoot({...f.opts,headSha:'f'.repeat(40)}),/DISCOVERY_HEAD_STALE/);}finally{dispose(f);}
});
test('excluded generated secrets, unsupported unknown extensions and code with nul classified',()=>{
  const f=setup({'src/app.ts':'export const a=1','node_modules/vendor.ts':'const x=0','secrets.json':'{"x":1}','src/.env.local':'x=1','app.bin':'XXX','src/binary.ts':Buffer.from([65,0,66]),'mystery.weird':'hello','README.md':'yes'});
  try{const p=discoverPinnedRoot(f.opts);const byPath=Object.fromEntries(p.items.map(x=>[x.path,x]));assert.equal(byPath['src/app.ts'].decision,'eligible');assert.equal(byPath['README.md'].decision,'eligible');assert.equal(byPath['src/.env.local'].decision,'excluded');assert.equal(byPath['node_modules/vendor.ts'].reason,'generated-or-vendor');assert.equal(byPath['src/binary.ts'].reason,'binary-nul');assert.equal(byPath['mystery.weird'].decision,'unsupported');assert.equal(byPath['secrets.json'].decision,'unknown');}finally{dispose(f);}
});
test('bounded max file size excludes large source without reading file bytes',()=>{
  const f=setup({'src/large.ts':'a'.repeat(100)});try{const p=discoverPinnedRoot({...f.opts,maxFileBytes:40});assert.equal(p.counts.excluded,1);assert.equal(p.items[0].reason,'file-too-large');}finally{dispose(f);}
});
testSymlink('tracked symbolic link is an unknown, never accepted as source bytes',()=>{
  const dir=mkdtempSync(join(tmpdir(),'hq-a-r2-target-'));const f=setup({'src/app.ts':'abc'});
  try{writeFileSync(join(dir,'private.ts'),'private');symlinkSync(join(dir,'private.ts'),join(f.root,'src/external.ts'));git(f.root,'add','-A');git(f.root,'commit','-q','-m','add external link');f.opts.headSha=git(f.root,'rev-parse','HEAD');const p=discoverPinnedRoot(f.opts);const link=p.items.find(x=>x.path==='src/external.ts');assert.equal(link.decision,'unknown');assert.equal(link.reason,'unverified-physical-source');}finally{dispose(f);rmSync(dir,{recursive:true,force:true});}
});
test('invalid max records and limits refused',()=>{
  const f=setup({'src/a.ts':'const a=1','src/b.ts':'const b=2'});try{assert.throws(()=>discoverPinnedRoot({...f.opts,maxRecords:0}),/DISCOVERY_LIMIT_INVALID/);assert.throws(()=>discoverPinnedRoot({...f.opts,maxRecords:1}),/DISCOVERY_TOO_MANY_FILES/);}finally{dispose(f);}
});
test('actual source bytes pinned to HEAD and mutation changes scan eligibility to blocked',()=>{
  const f=setup();try{const before=discoverPinnedRoot(f.opts);writeFileSync(join(f.root,'src/app.ts'),'export const a = 2;\n');assert.throws(()=>discoverPinnedRoot(f.opts),/DISCOVERY_DIRTY_ROOT/);assert.equal(before.items[0].decision,'eligible');}finally{dispose(f);}
});

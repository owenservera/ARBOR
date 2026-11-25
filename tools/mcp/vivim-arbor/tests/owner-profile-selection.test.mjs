import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveOwnerSelection,readOwnerSelection} from '../server/owner-profile-selection.mjs';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,symlinkSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const digest=b=>createHash('sha256').update(b).digest('hex');
const H='a'.repeat(64);
const ctx={baseRoots:[{id:'arbor',path:'C:\\work\\ARBOR'},{id:'scratch',path:'C:\\connect\\scratch'}],basePrograms:[{id:'node',path:'C:\\tools\\node.exe',sha256:H}],protectedPaths:['C:\\connect','C:\\VIVIM','C:\\Users\\owner\\.ssh','C:\\Users\\owner\\AppData'],resolvePath:x=>x,hashProgram:()=>H};
const selection=()=>({schema:'vivim.owner-workstation-selection/1',roots:[{id:'labs',path:'C:\\work\\vivim-labs'},{id:'craft',path:'D:\\craft'}],programs:[{id:'craft-cli',path:'D:\\craft\\target\\release\\craft-anything-cli.exe',sha256:H}],expiresInMinutes:120,allowInteractive:true,allowWrites:false});
test('explicit roots and pinned Craft executable extend existing IDs',()=>{const r=resolveOwnerSelection(selection(),ctx);assert.equal(r.roots.length,4);assert.equal(r.programs.length,2);assert.equal(r.programs[1].sha256,H);assert.equal(r.allowWrites,false);assert.equal(r.expiresInMinutes,120);assert.equal(ctx.baseRoots.length,2);});
test('does not infer roots or programs from installed applications',()=>{const s=selection();s.programs=[];const r=resolveOwnerSelection(s,ctx);assert.equal(r.programs.length,1);});
test('rejects authority ancestors, descendants, overlapping roots and credential locations',()=>{for(const path of ['C:\\','C:\\connect','C:\\connect\\new','C:\\work','C:\\work\\ARBOR\\sub','C:\\Users\\owner\\.ssh','C:\\Users\\owner\\AppData\\Local']){const s=selection();s.roots[0].path=path;assert.throws(()=>resolveOwnerSelection(s,ctx),/INVALID/);}});
test('rejects relative, UNC, device, dot traversal, alternate stream and trailing dot paths',()=>{for(const path of ['labs','\\\\server\\share','\\\\?\\C:\\labs','C:\\work\\..\\labs','C:\\labs:stream','C:\\labs.']){const s=selection();s.roots[0].path=path;assert.throws(()=>resolveOwnerSelection(s,ctx),/INVALID/);}});
test('rejects duplicate IDs, paths, executable aliases and non-executables',()=>{for(const [id,path] of [['node','D:\\a.exe'],['craft-cli','C:\\tools\\node.exe'],['craft-cli','C:\\x\\Microsoft\\WindowsApps\\pwsh.exe'],['craft-cli','D:\\craft.cmd']]){const s=selection();s.programs=[{id,path,sha256:H}];assert.throws(()=>resolveOwnerSelection(s,ctx),/INVALID/);}});
test('rejects resolved protected target and malformed hash',()=>{assert.throws(()=>resolveOwnerSelection(selection(),{...ctx,resolvePath:()=> 'C:\\connect\\private'}),/INVALID/);assert.throws(()=>resolveOwnerSelection(selection(),{...ctx,hashProgram:()=> 'bad'}),/INVALID/);});
test('requires explicit bounded selection and flags',()=>{for(const tweak of [s=>s.expiresInMinutes=481,s=>s.allowInteractive='yes',s=>s.remoteApproval=true,s=>{s.roots=[];s.programs=[]},s=>s.roots[0].id='arbor']){const s=selection();tweak(s);assert.throws(()=>resolveOwnerSelection(s,ctx),/INVALID/);}});

test('rejects executable changes after owner review',()=>{
 const s=selection();assert.throws(()=>resolveOwnerSelection(s,{...ctx,hashProgram:()=> 'b'.repeat(64)}),/INVALID/);
 delete s.programs[0].sha256;assert.throws(()=>resolveOwnerSelection(s,ctx),/INVALID/);
});
test('reviewed selection digest binds exact file bytes',()=>{
 const dir=mkdtempSync(join(tmpdir(),'vivim-owner-pin-'));
 try{
  const file=join(dir,'selection.json'),bytes=Buffer.from(JSON.stringify(selection()));
  writeFileSync(file,bytes);assert.deepEqual(readOwnerSelection(file,digest(bytes)),selection());
  writeFileSync(file,Buffer.concat([bytes,Buffer.from('\n')]));
  assert.throws(()=>readOwnerSelection(file,digest(bytes)),/INVALID/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('Windows CLI projects real paths, rejects a junction and detects changed executable', {skip:process.platform!=='win32'},()=>{
 const dir=realpathSync(mkdtempSync(join(tmpdir(),'vivim-owner-path-')));
 try{
  const labs=join(dir,'labs'),craft=join(dir,'craft'),privateRoot=join(dir,'private'),scratch=join(dir,'scratch'),arbor=join(dir,'arbor');
  for(const x of [labs,craft,privateRoot,scratch,arbor])mkdirSync(x);
  const exe=join(craft,'craft-anything-cli.exe'),bytes=Buffer.from('fixture-only executable hash; never run');
  writeFileSync(exe,bytes);
  const file=join(dir,'selection.json'),context=join(dir,'context.json');
  writeFileSync(context,JSON.stringify({baseRoots:[{id:'arbor',path:arbor},{id:'scratch',path:scratch}],basePrograms:[],protectedPaths:[privateRoot,join(dir,'authority')]}));
  const s={...selection(),roots:[{id:'labs',path:labs},{id:'craft',path:craft}],programs:[{id:'craft-cli',path:exe,sha256:digest(bytes)}]};
  const invoke=(v)=>{
   const b=Buffer.from(JSON.stringify(v));writeFileSync(file,b);
   return spawnSync(process.execPath,[fileURLToPath(new URL('../server/owner-profile-selection.mjs',import.meta.url)),file,context,digest(b)],{encoding:'utf8',timeout:10000});
  };
  let r=invoke(s);assert.equal(r.status,0,r.stderr);const result=JSON.parse(r.stdout);
  assert.equal(result.roots.length,4);assert.equal(result.programs[0].sha256,digest(bytes));
  const junction=join(dir,'redirect');symlinkSync(privateRoot,junction,'junction');
  r=invoke({...s,roots:[{id:'labs',path:junction}]});assert.notEqual(r.status,0);
  writeFileSync(exe,'changed');r=invoke(s);assert.notEqual(r.status,0);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

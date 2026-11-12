import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {INTENT_SCHEMA,validateIntent,verifyRoots,checkOutputDirectory,projectIndex} from '../lib/live-graph/wave1/lane-a.mjs';

const head='a'.repeat(40);
const manifest=path=>({schema:INTENT_SCHEMA,projectId:'vivim-unified-architecture',revision:1,purpose:'Discover safe code evidence',questions:['What imports what?'],mode:'dev-observation-only',effectsAllowed:false,roots:[{id:'repos-hq',path,headSha:head,role:'intelligence',ignores:['vendor']}]});

test('rejects unsafe scope and unpinned or duplicate project roots',()=>{
  const good=manifest('/example/abs');
  assert.equal(validateIntent(good).projectId,good.projectId);
  assert.throws(()=>validateIntent({...good,effectsAllowed:true}),/INTENT_EFFECTS_FORBIDDEN/);
  assert.throws(()=>validateIntent({...good,roots:[{...good.roots[0],headSha:'latest'}]}),/INTENT_ROOT_SHA_UNPINNED/);
  assert.throws(()=>validateIntent({...good,roots:[good.roots[0],good.roots[0]]}),/INTENT_ROOT_ID_DUPLICATE/);
  assert.throws(()=>validateIntent({...good,roots:[{...good.roots[0],path:'/home/u/.env'}]}),/INTENT_ROOT_PATH_INVALID/);
});
test('rejects stale or dirty actual root and never assumes missing paths exist',()=>{
  const dir=mkdtempSync(join(tmpdir(),'vivim-lane-a-'));
  try{
    const mock=(headValue,dirty)=> (command,args)=>args[1]==='--show-toplevel'?dir+'\n':args[1]==='HEAD'?headValue:dirty;
    const intent=manifest(dir);
    assert.equal(verifyRoots(intent,{git:mock(head,'')}).length,1);
    assert.throws(()=>verifyRoots(intent,{git:mock('b'.repeat(40),'')}),/ROOT_HEAD_STALE/);
    assert.throws(()=>verifyRoots(intent,{git:mock(head,' M file.ts')}),/ROOT_DIRTY_UNVERIFIED/);
    assert.throws(()=>verifyRoots({...intent,roots:[{...intent.roots[0],path:join(dir,'missing')}]},{git:mock(head,'')}),/ROOT_NOT_DIRECTORY/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('isolated output must be below explicit dev run folder',()=>{
  const dir=mkdtempSync(join(tmpdir(),'vivim-lane-a-'));
  try{
    const good=join(dir,'.hq','wave1-index-runs','first');
    assert.equal(checkOutputDirectory(dir,good),good);
    assert.throws(()=>checkOutputDirectory(dir,join(dir,'.hq','index.db')),/OUTPUT_NOT_ISOLATED_DEV_RUN/);
    assert.throws(()=>checkOutputDirectory(dir,join(dir,'.hq','wave1-index-runs')),/OUTPUT_NOT_ISOLATED_DEV_RUN/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('stable projection labels imports static, unknown resolution and v1 claims unverified',()=>{
  const dir=mkdtempSync(join(tmpdir(),'vivim-lane-a-'));
  try{
    const file=join(dir,'lib','a.mjs');mkdirSync(join(dir,'lib'),{recursive:true});writeFileSync(file,'export const a=1;');
    const root={id:'repos-hq',path:dir,headSha:head,role:'intelligence',ignores:[]};
    const rows={
      'SELECT f.id':[{id:1,root_id:'repos-hq',path:'lib/a.mjs',abs_path:file,lang:'js',hash:'f'.repeat(64),size:17},{id:2,root_id:'other',path:'bad',abs_path:'/tmp/bad',lang:'js',hash:'e'.repeat(64),size:3}],
      'SELECT s.file_id':[{file_id:1,name:'a',kind:'const',line:1,end_line:1}],
      'SELECT i.file_id':[{file_id:1,specifier:'./unknown.mjs',kind:'import',line:1,resolved_file_id:null,resolved_project_id:null}],
      'SELECT a.file_id':[{file_id:1,line:1,kind:'context',text:'private comment'}]
    };
    const db={prepare:sql=>({all:()=>rows[Object.keys(rows).find(k=>sql.startsWith(k))]||[]})};
    const a=projectIndex(db,manifest(dir),[root]),b=projectIndex(db,manifest(dir),[root]);
    assert.deepEqual(a,b);assert.equal(a.counts.files,1);assert.equal(a.counts.symbols,1);
    assert.equal(a.imports[0].resolution,'unknown');assert.equal(a.imports[0].observation,'source-only');
    assert.equal(a.annotations[0].claimStatus,'unverified');
    assert.equal(a.diagnostics[0].code,'FILE_UNTRUSTED_SCOPE_OR_HASH');
    assert.ok(!JSON.stringify(a).includes('private comment'));
  }finally{rmSync(dir,{recursive:true,force:true});}
});

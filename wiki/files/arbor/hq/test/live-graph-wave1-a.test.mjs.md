# File: hq/test/live-graph-wave1-a.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/live-graph-wave1-a.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4170 B |
| Lines | 58 |
| Hash | 760f47809688 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| head | const | 8 | no | const head=&#39;a&#39;.repeat(40); |
| manifest | function | 9 | no | const manifest=path=&gt;({schema:INTENT_SCHEMA,projectId:&#39;vivim-unified-architecture&#39;,revision:1,purpose:&#39;Discover safe code evidence&#39;,questions:[&#39;What imports what?&#39;],mode:&#39;dev-observation-only&#39;,effect… |
| good | const | 12 | no | const good=manifest(&#39;/example/abs&#39;); |
| dir | const | 20 | no | const dir=mkdtempSync(join(tmpdir(),&#39;vivim-lane-a-&#39;)); |
| mock | function | 22 | no | const mock=(headValue,dirty)=&gt; (command,args)=&gt;args[1]===&#39;--show-toplevel&#39;?dir+&#39;\\n&#39;:args[1]===&#39;HEAD&#39;?headValue:dirty; |
| intent | const | 23 | no | const intent=manifest(dir); |
| dir | const | 31 | no | const dir=mkdtempSync(join(tmpdir(),&#39;vivim-lane-a-&#39;)); |
| good | const | 33 | no | const good=join(dir,&#39;.hq&#39;,&#39;wave1-index-runs&#39;,&#39;first&#39;); |
| dir | const | 40 | no | const dir=mkdtempSync(join(tmpdir(),&#39;vivim-lane-a-&#39;)); |
| file | const | 42 | no | const file=join(dir,&#39;lib&#39;,&#39;a.mjs&#39;);mkdirSync(join(dir,&#39;lib&#39;),{recursive:true});writeFileSync(file,&#39;export const a=1;&#39;); |
| root | const | 43 | no | const root={id:&#39;repos-hq&#39;,path:dir,headSha:head,role:&#39;intelligence&#39;,ignores:[]}; |
| rows | const | 44 | no | const rows={ |
| db | const | 50 | no | const db={prepare:sql=&gt;({all:()=&gt;rows[Object.keys(rows).find(k=&gt;sql.startsWith(k))]\|\|[]})}; |
| a | const | 51 | no | const a=projectIndex(db,manifest(dir),[root]),b=projectIndex(db,manifest(dir),[root]); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../lib/live-graph/wave1/lane-a.mjs | import | 6 | [hq/lib/live-graph/wave1/lane-a.mjs](../lib/live-graph/wave1/lane-a.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

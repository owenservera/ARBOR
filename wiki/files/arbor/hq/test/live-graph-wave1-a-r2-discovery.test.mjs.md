# File: hq/test/live-graph-wave1-a-r2-discovery.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/live-graph-wave1-a-r2-discovery.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5378 B |
| Lines | 55 |
| Hash | 39497fe06a87 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| git | function | 8 | no | const git=(root,...args)=&gt;execFileSync(&#39;git&#39;,args,{cwd:root,encoding:&#39;utf8&#39;}).trim(); |
| canSymlink | function | 11 | no | const canSymlink = (() =&gt; { try { const probe = mkdtempSync(join(tmpdir(), &#39;hq-symlink-probe-&#39;)); writeFileSync(join(probe, &#39;probe.txt&#39;), &#39;probe&#39;); symlinkSync(join(probe, &#39;probe.txt&#39;), join(probe, &#39;… |
| probe | const | 13 | no | const probe = mkdtempSync(join(tmpdir(), &#39;hq-symlink-probe-&#39;)); |
| testSymlink | const | 20 | no | const testSymlink = canSymlink ? test : test.skip; |
| setup | function | 21 | no | function setup(files={&#39;src/app.ts&#39;:&#39;export const a = 1;\\n&#39;}) { |
| root | const | 22 | no | const root=mkdtempSync(join(tmpdir(),&#39;hq-a-r2-git-&#39;)); |
| dispose | function | 28 | no | const dispose=x=&gt;rmSync(x.root,{recursive:true,force:true}); |
| f | const | 30 | no | const f=setup({&#39;src/app.ts&#39;:&#39;export const a = 1;\\n&#39;,&#39;README.md&#39;:&#39;# Title\\n&#39;,&#39;data/config.json&#39;:&#39;{&quot;ok&quot;:true}\\n&#39;}); |
| f | const | 34 | no | const f=setup();try{writeFileSync(join(f.root,&#39;src/unknown.ts&#39;),&#39;let bad=1;&#39;);assert.throws(()=&gt;discoverPinnedRoot(f.opts),/DISCOVERY_DIRTY_ROOT/);}finally{dispose(f);} |
| f | const | 37 | no | const f=setup();try{assert.throws(()=&gt;discoverPinnedRoot({...f.opts,headSha:&#39;f&#39;.repeat(40)}),/DISCOVERY_HEAD_STALE/);}finally{dispose(f);} |
| f | const | 40 | no | const f=setup({&#39;src/app.ts&#39;:&#39;export const a=1&#39;,&#39;node_modules/vendor.ts&#39;:&#39;const x=0&#39;,&#39;secrets.json&#39;:&#39;{&quot;x&quot;:1}&#39;,&#39;src/.env.local&#39;:&#39;x=1&#39;,&#39;app.bin&#39;:&#39;XXX&#39;,&#39;src/binary.ts&#39;:Buffer.from([65,0,66]),&#39;mystery.wei… |
| f | const | 44 | no | const f=setup({&#39;src/large.ts&#39;:&#39;a&#39;.repeat(100)});try{const p=discoverPinnedRoot({...f.opts,maxFileBytes:40});assert.equal(p.counts.excluded,1);assert.equal(p.items[0].reason,&#39;file-too-large&#39;);}finally… |
| dir | const | 47 | no | const dir=mkdtempSync(join(tmpdir(),&#39;hq-a-r2-target-&#39;));const f=setup({&#39;src/app.ts&#39;:&#39;abc&#39;}); |
| f | const | 51 | no | const f=setup({&#39;src/a.ts&#39;:&#39;const a=1&#39;,&#39;src/b.ts&#39;:&#39;const b=2&#39;});try{assert.throws(()=&gt;discoverPinnedRoot({...f.opts,maxRecords:0}),/DISCOVERY_LIMIT_INVALID/);assert.throws(()=&gt;discoverPinnedRoot({...f… |
| f | const | 54 | no | const f=setup();try{const before=discoverPinnedRoot(f.opts);writeFileSync(join(f.root,&#39;src/app.ts&#39;),&#39;export const a = 2;\\n&#39;);assert.throws(()=&gt;discoverPinnedRoot(f.opts),/DISCOVERY_DIRTY_ROOT/);asser… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:child_process | import | 3 | external |
| node:fs | import | 4 | external |
| node:path | import | 5 | external |
| node:os | import | 6 | external |
| ../lib/live-graph/wave1/lane-a-r2-discovery.mjs | import | 7 | [hq/lib/live-graph/wave1/lane-a-r2-discovery.mjs](../lib/live-graph/wave1/lane-a-r2-discovery.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

# File: apps/vivim-host/test/media-playback.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/media-playback.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5422 B |
| Lines | 103 |
| Hash | 0be965f0d366 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| dir | const | 20 | no | const dir = await mkdtemp(path.join(os.tmpdir(),&#39;vivim-media-playback-&#39;)); |
| store | const | 22 | no | const store = path.join(dir,&#39;store&#39;), files = path.join(dir,&#39;files&#39;); |
| movie | const | 24 | no | const movie = path.join(files,&#39;films&#39;,&#39;Sample.mp4&#39;); |
| service | const | 32 | no | const service=createMediaPlaybackService({storeDir:store,filesRoot:files}); |
| listing | const | 33 | no | const listing=await service.list(); |
| id | const | 39 | no | const id=listing.items[0].mediaId; |
| info | const | 40 | no | const info=await service.resolve(id); |
| denied | const | 60 | no | const denied=await service.list(); |
| dir | const | 66 | no | const dir=await mkdtemp(path.join(os.tmpdir(),&#39;vivim-media-no-map-&#39;)); |
| service | const | 70 | no | const service=createMediaPlaybackService({storeDir:dir,filesRoot:null}); |
| r | const | 71 | no | const r=await service.list(); |
| dir | const | 78 | no | const dir=await mkdtemp(path.join(os.tmpdir(),&#39;vivim-media-paged-&#39;)); |
| store | const | 80 | no | const store=path.join(dir,&#39;store&#39;),files=path.join(dir,&#39;files&#39;); |
| service | const | 91 | no | const service=createMediaPlaybackService({storeDir:store,filesRoot:files}); |
| first | const | 92 | no | const first=await service.list(); |
| second | const | 96 | no | const second=await service.list({offset:25}); |
| opened | const | 100 | no | const opened=await service.resolve(second.items[3].mediaId); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:path | import | 4 | external |
| node:os | import | 5 | external |
| ../media/playback.mjs | import | 6 | [apps/vivim-host/media/playback.mjs](../media/playback.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createMediaPlaybackService, parseMediaRange } from '../media/playback.mjs';

test('single byte ranges use exact inclusive limits and reject multipart/overflow', () => {
  assert.deepEqual(parseMediaRange(undefined,100),{start:0,end:99,partial:false});
  assert.deepEqual(parseMediaRange('bytes=0-9',100),{start:0,end:9,partial:true});
  assert.deepEqual(parseMediaRange('bytes=90-',100),{start:90,end:99,partial:true});
  assert.deepEqual(parseMediaRange('bytes=-10',100),{start:90,end:99,partial:true});
  assert.deepEqual(parseMediaRange('bytes=0-500',100),{start:0,end:99,partial:true});
  for (const bad of ['bytes=100-','bytes=-0','bytes=2-1','bytes=0-1,3-4',
    'bytes=abc-def','bytes=9007199254740992-','items=0-1'])
    assert.throws(()=>parseMediaRange(bad,100), {code:'MEDIA_RANGE_INVALID'});
});

test('only explicit, non-symlinked HQ catalog-backed media is streamable', async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(),'vivim-media-playback-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  const store = path.join(dir,'store'), files = path.join(dir,'files');
  await mkdir(store); await mkdir(path.join(files,'films'),{recursive:true});
  const movie = path.join(files,'films','Sample.mp4');
  await writeFile(movie,Buffer.from('0123456789'));
  await writeFile(path.join(store,'library.json'),JSON.stringify({version:1,entries:[
    {id:'abc',kind:'movie',title:'Film',state:'complete',sourceUrl:'https://secret.invalid'},
    {id:'pending',kind:'show',title:'Not ready',state:'dispatched'}
  ]}));
  await writeFile(path.join(store,'playback.json'),JSON.stringify({version:1,entries:[
    {libraryId:'abc',relativePath:'films/Sample.mp4'}]}));
  const service=createMediaPlaybackService({storeDir:store,filesRoot:files});
  const listing=await service.list();
  assert.equal(listing.state,'ready');
  assert.equal(listing.playback,'available');
  assert.equal(listing.items.find(x=>x.title==='Film').playable,true);
  assert.equal(listing.items.find(x=>x.title==='Not ready').playable,false);
  assert.doesNotMatch(JSON.stringify(listing),/secret|Sample\.mp4|libraryId|relativePath|\/files/);
  const id=listing.items[0].mediaId;
  const info=await service.resolve(id);
  assert.equal(info.size,10); assert.equal(info.mime,'video/mp4');
  assert.equal(typeof info.fingerprint,'string');
  await info.handle.close();
  await assert.rejects(service.resolve('f'.repeat(32)),{code:'MEDIA_NOT_PLAYABLE'});
  await writeFile(movie,Buffer.from('changed!'));
  await assert.rejects(service.resolve(id,info.fingerprint),{code:'MEDIA_FILE_CHANGED'});
  await rm(movie);
  // Windows forbids symlink creation without Developer Mode or elevation. That is a
  // host capability, not a product defect: skip the tamper check instead of failing
  // every dev run, and say why.
  try {
    await symlink(path.join(dir,'outside.mp4'),movie);
  } catch (error) {
    if (error.code === 'EPERM' || error.code === 'EACCES') {
      console.warn('SKIP symlink-tamper check: this host does not permit symlink creation (' + error.code + ')');
      return;
    }
    throw error;
  }
  const denied=await service.list();
  assert.equal(denied.items[0].playable,false);
  await assert.rejects(service.resolve(id));
});

test('unconfigured media never infers playback from a completed download',async t=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'vivim-media-no-map-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  await writeFile(path.join(dir,'library.json'),JSON.stringify({version:1,entries:[
    {id:'a',kind:'movie',title:'Unmapped',state:'complete'}]}));
  const service=createMediaPlaybackService({storeDir:dir,filesRoot:null});
  const r=await service.list();
  assert.equal(r.playback,'not-configured');
  assert.equal(r.items[0].playable,false);
});


test('a mapped playable file beyond the first catalog page is still authorized',async t=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'vivim-media-paged-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  const store=path.join(dir,'store'),files=path.join(dir,'files');
```

_First 80 of 104 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

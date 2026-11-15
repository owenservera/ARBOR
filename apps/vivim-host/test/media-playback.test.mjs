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
  await Promise.all([mkdir(store),mkdir(files)]);
  await writeFile(path.join(files,'last.mp4'),Buffer.from('0123456789'));
  await writeFile(path.join(store,'library.json'),JSON.stringify({version:1,
    entries:Array.from({length:29},(_,i)=>({
      id:'movie-'+i,title:'Movie '+String(i).padStart(2,'0'),
      kind:'movie',state:'complete'
    }))}));
  await writeFile(path.join(store,'playback.json'),JSON.stringify({version:1,entries:[
    {libraryId:'movie-28',relativePath:'last.mp4'}
  ]}));
  const service=createMediaPlaybackService({storeDir:store,filesRoot:files});
  const first=await service.list();
  assert.equal(first.total,29);
  assert.equal(first.shown,25);
  assert.equal(first.playback,'none-mapped');
  const second=await service.list({offset:25});
  assert.equal(second.shown,4);
  assert.equal(second.playback,'available');
  assert.equal(second.items[3].playable,true);
  const opened=await service.resolve(second.items[3].mediaId);
  assert.equal(opened.size,10);
  await opened.handle.close();
});

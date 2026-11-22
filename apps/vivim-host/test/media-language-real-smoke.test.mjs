// Explicit real-engine smoke test (not run by the normal suite).
// VIVIM_MEDIA_LANGUAGE_SMOKE_INPUT must be an owner-controlled local audio file.
// It exercises the same Host job service and local model stack as the phone API.
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { open, readFile, mkdtemp, rm, lstat } from 'node:fs/promises';
import { setTimeout as pause } from 'node:timers/promises';
import { createMediaLanguageService } from '../media/language-service.mjs';

const sourcePath=process.env.VIVIM_MEDIA_LANGUAGE_SMOKE_INPUT;
test('explicit real local English audio -> Spanish MP3 Host smoke', {
  skip: !sourcePath
}, async t => {
  const original=await readFile(sourcePath);
  assert.ok(original.length>100 && original.length<10*1024*1024,
    'Use a short synthetic, local voice fixture');
  const id=randomBytes(16).toString('hex');
  const digest=createHash('sha256').update(original).digest('hex');
  const dataRoot=await mkdtemp(path.join(os.tmpdir(),'vivim-language-smoke-'));
  t.after(()=>rm(dataRoot,{recursive:true,force:true,maxRetries:10,retryDelay:200}));
  const media={async resolve(mediaId,expectedFingerprint=null) {
    if(mediaId!==id||(expectedFingerprint!==null&&expectedFingerprint!==digest))
      throw Object.assign(new Error('MEDIA_SOURCE_STALE'),{code:'MEDIA_SOURCE_STALE',status:409});
    const stat=await lstat(sourcePath);
    if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==original.length ||
       createHash('sha256').update(await readFile(sourcePath)).digest('hex')!==digest)
      throw Object.assign(new Error('MEDIA_SOURCE_CHANGED'),{code:'MEDIA_SOURCE_CHANGED',status:409});
    return {handle:await open(sourcePath,'r'),size:stat.size,mime:'audio/wav',fingerprint:digest};
  }};
  const host=createMediaLanguageService({dataRoot,media});
  assert.equal(host.available(),true,'PC models, voice and runtime must be installed');
  const start=await host.start(id);
  assert.equal(start.schema,'vivim.media-language-job/1');
  let state=start;
  const expires=Date.now()+5*60_000;
  while(state.status==='running'&&Date.now()<expires){
    await pause(1000);
    state=await host.status(start.jobId);
  }
  assert.equal(state.status,'ready',JSON.stringify(state));
  assert.equal(state.mediaId,start.jobId);
  const audio=await host.resolve(start.jobId);
  const bytes=await audio.handle.readFile();
  await audio.handle.close();
  assert.equal(audio.mime,'audio/mpeg');
  assert.ok(bytes.length>1024,'Real encoded MP3 contains actual speech bytes');
  assert.deepEqual(await readFile(sourcePath),original,'Source never overwritten');
  assert.equal((await host.start(id)).status,'ready','Saved derivative reused');
  console.log('Verified local Spanish MP3 derivative:',bytes.length,'bytes; job',start.jobId);
});

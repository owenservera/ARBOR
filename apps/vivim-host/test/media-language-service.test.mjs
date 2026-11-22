import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,open,writeFile,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createMediaLanguageService,LANGUAGE_JOB_SCHEMA} from '../media/language-service.mjs';

const MEDIA_ID='a'.repeat(32);
async function setup(t,{execute}={}) {
  const dir=await mkdtemp(path.join(os.tmpdir(),'vivim-local-language-'));
  t.after(()=>rm(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100}));
  const dataRoot=path.join(dir,'host'),engine=path.join(dir,'engine');
  await Promise.all([mkdir(dataRoot),mkdir(engine)]);
  const input=path.join(dir,'original.mp3');
  const original=Buffer.alloc(4096,5);
  await writeFile(input,original);
  const python=path.join(engine,'python.exe'),voice=path.join(engine,'spanish.onnx');
  await Promise.all([writeFile(python,'fake'),writeFile(voice,'fake'),
    writeFile(voice+'.json','{}')]);
  let fingerprint='f'.repeat(64);
  const media={async resolve(id,wanted=null){
    if(id!==MEDIA_ID)throw Object.assign(new Error('MEDIA_NOT_PLAYABLE'),{status:404});
    if(wanted!==null&&wanted!==fingerprint)
      throw Object.assign(new Error('MEDIA_FILE_CHANGED'),{status:409});
    const handle=await open(input,'r');
    return {handle,size:original.length,mime:'audio/mpeg',fingerprint};
  }};
  const calls=[];
  const worker=execute??(async ({input,output,report})=>{
    calls.push(input);
    report('translating');
    assert.deepEqual(await readFile(input),original);
    await writeFile(output,Buffer.alloc(512,7));
  });
  const config={python,voice,cache:engine,ffmpeg:'ffmpeg'};
  const service=createMediaLanguageService({dataRoot,media,config,execute:worker});
  return {service,dataRoot,input,original,calls,media,setFingerprint:x=>{fingerprint=x},config};
}
async function completed(service,id) {
  for(let tries=0;tries<100;tries++) {
    const status=await service.status(id);
    if(status?.status!=='running')return status;
    await new Promise(resolve=>setTimeout(resolve,20));
  }
  throw new Error('job did not settle');
}
test('PC-local conversion keeps original and publishes immutable derived audio',async t=>{
  const {service,input,original,calls,media,dataRoot,config}=await setup(t);
  assert.equal(service.available(),true);
  const initial=await service.start(MEDIA_ID);
  assert.equal(initial.schema,LANGUAGE_JOB_SCHEMA);
  assert.equal(initial.targetLanguage,'es-ES');
  assert.match(initial.jobId,/^[a-f0-9]{32}$/);
  const ready=await completed(service,initial.jobId);
  assert.equal(ready.status,'ready');
  assert.equal(ready.stage,'complete');
  assert.equal(ready.mediaId,initial.jobId);
  assert.equal(ready.sourceMediaId,MEDIA_ID);
  assert.equal(calls.length,1);
  assert.deepEqual(await readFile(input),original);
  const result=await service.resolve(initial.jobId);
  assert.equal(result.size,512);
  assert.equal(result.mime,'audio/mpeg');
  assert.deepEqual(await result.handle.readFile(),Buffer.alloc(512,7));
  await result.handle.close();
  assert.equal((await service.start(MEDIA_ID)).jobId,initial.jobId);
  assert.equal(calls.length,1);
  const recovered=createMediaLanguageService({dataRoot,media,config,execute:()=>{
    throw new Error('Should not reprocess persisted derivative');
  }});
  assert.equal((await recovered.status(initial.jobId)).status,'ready');
});
test('new source revision prevents stale derivative streaming',async t=>{
  const {service,setFingerprint}=await setup(t);
  const run=await service.start(MEDIA_ID);
  assert.equal((await completed(service,run.jobId)).status,'ready');
  setFingerprint('b'.repeat(64));
  await assert.rejects(service.resolve(run.jobId),{code:'MEDIA_DERIVATIVE_UNAVAILABLE'});
  assert.equal(await service.status(run.jobId),null);
});
test('uninstalled engine and unsupported language fail before spawning',async t=>{
  const {service,config,dataRoot,media}=await setup(t);
  await assert.rejects(service.start(MEDIA_ID,{targetLanguage:'fr-FR'}),
    {code:'MEDIA_LANGUAGE_PACK_UNAVAILABLE'});
  await assert.rejects(service.start('../private.mp3'),{code:'MEDIA_ID_INVALID'});
  await rm(config.voice);
  const missing=createMediaLanguageService({dataRoot,media,config});
  assert.equal(missing.available(),false);
  await assert.rejects(missing.start(MEDIA_ID),{code:'MEDIA_LANGUAGE_ENGINE_UNAVAILABLE'});
});
test('conversion errors are bounded failure states, not fake audio',async t=>{
  const {service}=await setup(t,{execute:async()=>{throw new Error('private source details')}});
  const run=await service.start(MEDIA_ID);
  const failed=await completed(service,run.jobId);
  assert.equal(failed.status,'failed');
  assert.equal(failed.code,'MEDIA_LANGUAGE_FAILED');
  assert.doesNotMatch(JSON.stringify(failed),/private source details/);
  await assert.rejects(service.resolve(run.jobId),{code:'MEDIA_DERIVATIVE_UNAVAILABLE'});
});

// VIVIM Host-owned, single-PC offline language job adapter.
// The existing media service is the ONLY source-to-file resolver. Neither the
// PWA nor this worker accepts a user-supplied path, URL, model or executable.
// No cloud provider, extra server, alternate grant store or second media catalog.
import { createReadStream } from 'node:fs';
import { constants, existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, readFile, writeFile, rename, lstat, open } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LANGUAGE_JOB_SCHEMA = 'vivim.media-language-job/1';
const MAX_INPUT_BYTES = 100 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 200 * 1024 * 1024;
const MAX_CONCURRENT = 1;
const MAX_STAGE_LINES = 100;
const WORKER = fileURLToPath(new URL('./language-worker.py', import.meta.url));
const invalid = (code, status=409) => Object.assign(new Error(code), { code, status });
const hex32 = x => typeof x==='string' && /^[a-f0-9]{32}$/.test(x);
const encode = x => createHash('sha256').update(x).digest('hex');
const ENGINE_VERSION = 'vivim.offline.en-es/1';
const engineHome = process.platform==='win32'
  ? path.join(process.env.LOCALAPPDATA || os.homedir(), 'VIVIM', 'Engines', 'language') : null;
function defaultConfig() {
  const root = process.env.VIVIM_LANGUAGE_ENGINE_DIR || engineHome;
  return root ? {
    python:path.join(root,'.venv',process.platform==='win32'?'Scripts':'bin',
      process.platform==='win32'?'python.exe':'python'),
    cache:path.join(root,'models'),
    voice:path.join(root,'voices','es_ES-davefx-medium.onnx'),
    ffmpeg:'ffmpeg'
  } : null;
}

async function subprocess(file,args,{timeoutMs=300_000,onLine=()=>{}}={}) {
  return new Promise((resolve,reject)=>{
    let child,closed=false,lines=0,buffer='';
    try { child=spawn(file,args,{windowsHide:true,stdio:['ignore','pipe','pipe'],shell:false,env:{
      ...process.env, HF_HUB_OFFLINE:'1', TRANSFORMERS_OFFLINE:'1',
      ARGOS_DEVICE_TYPE:'cpu'
    }}); } catch { reject(invalid('MEDIA_ENGINE_START_FAILED',503)); return; }
    const timer=setTimeout(()=>{child.kill('SIGKILL');},timeoutMs);
    child.stdout.on('data',chunk=>{
      buffer+=chunk.toString('utf8');
      if(buffer.length>8192)buffer=buffer.slice(-4096);
      let idx;
      while((idx=buffer.indexOf('\n'))!==-1 && lines<MAX_STAGE_LINES){
        const line=buffer.slice(0,idx);buffer=buffer.slice(idx+1);lines++;
        if(line.length<1200)try{onLine(JSON.parse(line));}catch{}
      }
    });
    // Do not log stdout/stderr or source media, which may contain private text.
    child.stderr.on('data',()=>{});
    child.on('error',()=>{if(closed)return;closed=true;clearTimeout(timer);reject(invalid('MEDIA_ENGINE_START_FAILED',503));});
    child.on('close',(code,signal)=>{
      if(closed)return;closed=true;clearTimeout(timer);
      if(code===0)resolve();
      else reject(invalid(signal?'MEDIA_ENGINE_TIMEOUT':'MEDIA_ENGINE_FAILED',503));
    });
  });
}

async function offlineConvert({input,output,workDir,config,report}) {
  const pcm=path.join(workDir,'english.wav');
  const translated=path.join(workDir,'spanish.wav');
  const root=path.resolve(config.cache);
  const python=path.resolve(config.python);
  const voice=path.resolve(config.voice);
  report('extracting');
  await subprocess(config.ffmpeg,['-nostdin','-hide_banner','-loglevel','error',
    '-i',input,'-map','0:a:0','-vn','-ac','1','-ar','16000','-f','wav',pcm],
  {timeoutMs:120000});
  report('transcribing');
  await subprocess(python,[WORKER,'--input',pcm,'--output',translated,
    '--model-cache',root,'--voice',voice,'--source-language','en',
    '--target-language','es-ES','--asr-model','base'],
  {timeoutMs:25*60_000,onLine:line=>{
    if(line?.schema==='vivim.media-language-progress/1' &&
       ['transcribing','translating','synthesizing'].includes(line.stage))report(line.stage);
  }});
  report('encoding');
  await subprocess(config.ffmpeg,['-nostdin','-hide_banner','-loglevel','error',
    '-i',translated,'-c:a','libmp3lame','-q:a','4',output],
  {timeoutMs:120000});
}

export function createMediaLanguageService({
  dataRoot, media, config=defaultConfig(), execute=offlineConvert
}={}) {
  if(typeof dataRoot!=='string'||!path.isAbsolute(dataRoot)||!media?.resolve)
    throw new TypeError('Host-owned media and absolute dataRoot required');
  const root=path.join(dataRoot,'media-language');
  const active=new Map();
  const present=()=>!!config && [config.python,config.voice,
    config.voice+'.json',WORKER].every(file=>existsSync(file));
  const projection=record=>({
    schema:LANGUAGE_JOB_SCHEMA,
    jobId:record.jobId,sourceMediaId:record.sourceMediaId,targetLanguage:'es-ES',
    stage:record.stage,status:record.status,
    createdAt:record.createdAt, ...(record.status==='ready'?{mediaId:record.jobId}:{}),
    ...(record.status==='failed'?{code:record.code}:{}),
  });
  async function saved(jobId) {
    try {
      const receipt=JSON.parse(await readFile(path.join(root,jobId+'.json'),'utf8'));
      if(receipt?.schema!==LANGUAGE_JOB_SCHEMA||receipt.jobId!==jobId||
          !hex32(receipt.sourceMediaId)||!/^[a-f0-9]{64}$/.test(receipt.sourceFingerprint)||
          receipt.engine!==ENGINE_VERSION||receipt.status!=='ready')return null;
      return receipt;
    }catch{return null;}
  }
  async function readCompleted(jobId){
    const receipt=await saved(jobId);
    if(!receipt)return null;
    let source;
    try {
      source=await media.resolve(receipt.sourceMediaId,receipt.sourceFingerprint);
      await source.handle.close();
    }catch{return null;}
    const filename=path.join(root,jobId+'.mp3');
    try {
      const info=await lstat(filename);
      if(!info.isFile()||info.isSymbolicLink()||info.size<64||info.size>MAX_OUTPUT_BYTES)
        return null;
      return receipt;
    }catch{return null;}
  }
  async function status(jobId) {
    if(!hex32(jobId))throw invalid('MEDIA_JOB_ID_INVALID',400);
    const live=active.get(jobId);
    if(live)return projection(live);
    const receipt=await readCompleted(jobId);
    return receipt?projection(receipt):null;
  }
  async function run(record,source) {
    let workDir;
    try {
      await mkdir(root,{recursive:true,mode:0o700});
      workDir=await mkdtemp(path.join(root,'.work-'));
      const input=path.join(workDir,'source.media');
      const dest=path.join(workDir,'spanish.mp3');
      const stat=await source.handle.stat();
      if(stat.size!==source.size)throw invalid('MEDIA_SOURCE_CHANGED',409);
      record.stage='copying';
      await pipeline(source.handle.createReadStream({autoClose:false}),
        createWriteStream(input,{flags:'wx',mode:0o600}));
      await source.handle.close();
      record.stage='extracting';
      await execute({input,output:dest,workDir,config,report:stage=>{
        if(['extracting','transcribing','translating','synthesizing','encoding'].includes(stage))
          record.stage=stage;
      }});
      const info=await lstat(dest);
      if(!info.isFile()||info.isSymbolicLink()||info.size<64||info.size>MAX_OUTPUT_BYTES)
        throw invalid('MEDIA_OUTPUT_INVALID',503);
      // The original identity remains authoritative even after slow inference.
      const verify=await media.resolve(record.sourceMediaId,record.sourceFingerprint);
      await verify.handle.close();
      await rename(dest,path.join(root,record.jobId+'.mp3'));
      const receipt={schema:LANGUAGE_JOB_SCHEMA,jobId:record.jobId,
        sourceMediaId:record.sourceMediaId,sourceFingerprint:record.sourceFingerprint,
        engine:ENGINE_VERSION,voice:'es_ES-davefx-medium',
        targetLanguage:'es-ES',createdAt:record.createdAt,status:'ready',
        stage:'complete'};
      const temp=path.join(workDir,'receipt.json');
      await writeFile(temp,JSON.stringify(receipt),{flag:'wx',mode:0o600});
      await rename(temp,path.join(root,record.jobId+'.json'));
      record.stage='complete';record.status='ready';
    }catch(error){
      record.stage='failed';record.status='failed';
      record.code=error?.code==='MEDIA_SOURCE_CHANGED'?'MEDIA_SOURCE_CHANGED':
        error?.code==='MEDIA_OUTPUT_INVALID'?'MEDIA_OUTPUT_INVALID':'MEDIA_LANGUAGE_FAILED';
    }finally{
      try{await source.handle.close()}catch{}
      if(workDir)await rm(workDir,{recursive:true,force:true,maxRetries:4,retryDelay:100}).catch(()=>{});
      // Completed state survives via receipt and immutable derivative, not
      // by retaining a second in-memory identity database indefinitely.
      if(record.status==='ready')active.delete(record.jobId);
    }
  }
  async function start(mediaId,{targetLanguage='es-ES'}={}) {
    if(!hex32(mediaId))throw invalid('MEDIA_ID_INVALID',400);
    if(targetLanguage!=='es-ES')throw invalid('MEDIA_LANGUAGE_PACK_UNAVAILABLE',422);
    const source=await media.resolve(mediaId);
    if(source.size>MAX_INPUT_BYTES){await source.handle.close();throw invalid('MEDIA_INPUT_TOO_LARGE',413);}
    const identity=encode(JSON.stringify([ENGINE_VERSION,mediaId,
      source.fingerprint,targetLanguage,'es_ES-davefx-medium']));
    const jobId=identity.slice(0,32);
    const current=await status(jobId);
    if(current){await source.handle.close();return current;}
    if(!present()){await source.handle.close();throw invalid('MEDIA_LANGUAGE_ENGINE_UNAVAILABLE',503);}
    if([...active.values()].filter(x=>x.status==='running').length>=MAX_CONCURRENT){
      await source.handle.close();throw invalid('MEDIA_LANGUAGE_BUSY',429);
    }
    const record={jobId,sourceMediaId:mediaId,sourceFingerprint:source.fingerprint,
      createdAt:new Date().toISOString(),status:'running',stage:'queued'};
    active.set(jobId,record);
    void run(record,source);
    return projection(record);
  }
  async function resolve(jobId,wantedFingerprint=null) {
    const receipt=await readCompleted(jobId);
    if(!receipt)throw invalid('MEDIA_DERIVATIVE_UNAVAILABLE',404);
    const filename=path.join(root,jobId+'.mp3');
    const fd=await open(filename,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
    try {
      const info=await fd.stat();
      const disk=await lstat(filename);
      if(!info.isFile()||info.size<64||info.size>MAX_OUTPUT_BYTES||
         info.dev!==disk.dev||info.ino!==disk.ino||info.size!==disk.size ||
         info.mtimeMs!==disk.mtimeMs)throw invalid('MEDIA_DERIVATIVE_CHANGED',409);
      const fingerprint=encode([jobId,receipt.sourceFingerprint,info.size,info.mtimeMs].join(':'));
      if(wantedFingerprint&&fingerprint!==wantedFingerprint)
        throw invalid('MEDIA_FILE_CHANGED',409);
      return {handle:fd,size:info.size,mime:'audio/mpeg',
        fingerprint,etag:'"'+fingerprint.slice(0,32)+'"'};
    }catch(e){await fd.close();throw e;}
  }
  return {start,status,resolve,available:present};
}

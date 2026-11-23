import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStudioPort, projectStudioOperations } from '../onboarding/studio-port.mjs';
import { createHostServer } from '../server.mjs';

const jobId='11111111-1111-4111-8111-111111111111';
const targetId='0123456789abcdef0123456789abcdef';
const rawTargets=[{id:targetId,type:'page',url:'https://chatgpt.com/private/path?token=hidden',title:'PRIVATE THREAD'}];
const rawSites={sites:[{id:'chatgpt',url:'https://private.invalid/'}]};
const rawStatus={
  browserConnection:{state:'available',verified:true,recoveryCommand:'SECRET'},
  recorder:{state:'recording',id:'private-session',pageUrl:'https://private.invalid/'},
  dataDir:'C:\\private',chrome:'secret-browser'
};
const rawJobs={jobs:[{id:jobId,mode:'drive',state:'running',dryRun:true,
  sites:['https://private.invalid'],prompt:'private prompt',reply:'private reply',
  error:'private diagnostic'}]};
const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const close=server=>new Promise(resolve=>server.close(resolve));

test('capture and Drive projection retains only bounded source-backed operating state',()=>{
  const view=projectStudioOperations(rawStatus,rawJobs);
  assert.equal(view.schema,'vivim.studio-operations/1');
  assert.equal(view.authority,'read-only');
  assert.equal(view.state,'source-backed');
  assert.deepEqual(view.capture,{state:'source-backed',recorderState:'recording',
    browserState:'available',browserVerified:true,targetsState:'unavailable',targets:[]});
  assert.equal(view.drive.shown,1);
  assert.equal(view.drive.active,1);
  assert.deepEqual(view.drive.jobs,[{id:jobId,mode:'drive',state:'running',dryRun:true}]);
  const withChoices=projectStudioOperations(rawStatus,rawJobs,rawTargets,rawSites);
  assert.deepEqual(withChoices.capture.targets,[{id:targetId,host:'chatgpt.com'}]);
  assert.deepEqual(withChoices.drive.sites,['chatgpt']);
  assert.doesNotMatch(JSON.stringify(withChoices),/PRIVATE THREAD|private\/path|token=hidden/);
  const serialized=JSON.stringify(view);
  for(const privateText of ['private-session','private.invalid','private prompt',
    'private reply','private diagnostic','C:\\private','SECRET']){
    assert.ok(!serialized.includes(privateText),privateText+' must not leak');
  }
  assert.deepEqual(projectStudioOperations(null,null).drive.jobs,[]);
  assert.equal(projectStudioOperations(null,null).state,'unavailable');
  assert.equal(projectStudioOperations({...rawStatus,recorder:{state:'unknown'}},rawJobs).capture.state,'unavailable');
  assert.equal(projectStudioOperations(rawStatus,{jobs:[{...rawJobs.jobs[0],state:'delivered'}]}).drive.state,'unavailable');
  assert.equal(projectStudioOperations(rawStatus,{jobs:Array.from({length:21},()=>rawJobs.jobs[0])}).drive.state,'unavailable');
});

test('Studio port skips CDP tab scans during active recording and handles offline sources',async()=>{
  const seen=[];
  const port=createStudioPort({url:'http://127.0.0.1:38730',token:'secret-private-owner-token',
    fetchImpl:async(url,opts)=>{
      seen.push({url,method:opts.method,headers:opts.headers});
      const body=url.endsWith('/status')?rawStatus:url.endsWith('/drive/jobs')?rawJobs:
        url.endsWith('/targets')?rawTargets:rawSites;
      return new Response(JSON.stringify(body),{status:200,
        headers:{'content-type':'application/json'}});
    }});
  const view=await port.operations();
  assert.equal(view.capture.recorderState,'recording');
  assert.equal(view.drive.shown,1);
  assert.equal(seen.length,3);
  assert.deepEqual(seen.map(x=>x.method),['GET','GET','GET']);
  assert.ok(seen.every(x=>x.headers['x-studio-token']==='secret-private-owner-token'));
  assert.deepEqual(seen.map(x=>new URL(x.url).pathname),[
    '/api/status','/api/v1/drive/jobs','/api/v1/drive/sites'
  ],'capture compatibility uses Studio legacy API while Drive uses versioned API');
  assert.ok(!JSON.stringify(view).includes('secret-private-owner-token'));
  const offline=createStudioPort({url:'http://127.0.0.1:38730',
    fetchImpl:async()=>{throw Error('offline') }});
  assert.equal((await offline.operations()).state,'unavailable');
});

test('Studio only enumerates exact browser targets when idle and owner-verified',async()=>{
  const paths=[];
  const status={...rawStatus,recorder:{state:'idle'}};
  const port=createStudioPort({url:'http://127.0.0.1:38730',fetchImpl:async(url,opts)=>{
    const pathname=new URL(url).pathname;
    paths.push([opts.method,pathname]);
    const body=pathname==='/api/status'?status:pathname==='/api/targets'?rawTargets:
      pathname==='/api/v1/drive/jobs'?rawJobs:rawSites;
    return new Response(JSON.stringify(body),{status:200,
      headers:{'content-type':'application/json'}});
  }});
  const view=await port.operations();
  assert.deepEqual(paths,[['GET','/api/status'],['GET','/api/v1/drive/jobs'],
    ['GET','/api/v1/drive/sites'],['GET','/api/targets']]);
  assert.deepEqual(view.capture.targets,[{id:targetId,host:'chatgpt.com'}]);
  assert.ok(!JSON.stringify(view).includes('PRIVATE THREAD'));
  paths.length=0;status.browserConnection={state:'not-running',verified:false};
  const off=await port.operations();
  assert.equal(paths.length,3,'offline browser must not trigger CDP enumeration');
  assert.deepEqual(off.capture.targets,[]);
});

test('Host owner PWA view gets sanitized Studio operations, unauthorized callers trigger no Studio read',async()=>{
  const root=mkdtempSync(path.join(os.tmpdir(),'vivim-studio-port-'));
  const seen=[];
  const studio=http.createServer((req,res)=>{
    seen.push([req.url,req.method,req.headers['x-studio-token']]);
    const value=req.url==='/api/status'?rawStatus:req.url==='/api/v1/drive/jobs'?rawJobs:
      req.url==='/api/targets'?rawTargets:req.url==='/api/v1/drive/sites'?rawSites:null;
    res.writeHead(value?200:404,{'content-type':'application/json'});
    res.end(JSON.stringify(value??{code:'NOT_FOUND'}));
  });
  let host;
  try{
    await listen(studio);
    const studioUrl='http://127.0.0.1:'+studio.address().port;
    host=createHostServer({dataRoot:root,ownerToken:'owner-unit-test-token-for-pwa-0001',
      studioUrl,studioToken:'studio-service-secret'});
    await listen(host);
    const base='http://127.0.0.1:'+host.address().port;
    const route='/api/host/control/pwa-view';
    assert.equal((await fetch(base+route)).status,401);
    assert.equal(seen.length,0,'no Studio work before Host authentication');
    const response=await fetch(base+route,{headers:{authorization:'Bearer owner-unit-test-token-for-pwa-0001'}});
    assert.equal(response.status,200);
    const body=await response.json();
    assert.equal(body.snapshot.studioOperations.schema,'vivim.studio-operations/1');
    assert.equal(body.snapshot.studioOperations.drive.active,1);
    assert.equal(body.snapshot.studioOperations.capture.recorderState,'recording');
    assert.deepEqual(seen.map(x=>x[1]),['GET','GET','GET']);
    assert.deepEqual(seen.map(x=>x[0]),['/api/status','/api/v1/drive/jobs',
      '/api/v1/drive/sites']);
    assert.ok(seen.every(x=>x[2]==='studio-service-secret'));
    const serialized=JSON.stringify(body.snapshot.studioOperations);
    assert.ok(!serialized.includes('private.invalid'));
    assert.ok(!serialized.includes('studio-service-secret'));
  }finally{
    if(host)await close(host);
    await close(studio);
    rmSync(root,{recursive:true,force:true});
  }
});

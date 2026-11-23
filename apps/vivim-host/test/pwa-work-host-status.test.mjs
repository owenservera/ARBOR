// PY-001: actual Host HTTP owner-only Work readiness route, no Work mutation,
// browser, provider message, new task DB or personal corpus initialization.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHostServer} from '../server.mjs';

const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const close=server=>new Promise(resolve=>server.close(resolve));
const TOKEN='owner-verified-pwa-work-scope-00001';
const SCOPE='local-dir-sha256:'+'c'.repeat(64);
async function fixture(t,{initialized=false,studioOffline=false}={}){
  const dir=mkdtempSync(path.join(os.tmpdir(),'vivim-py001-status-'));
  const observed=[];
  const studio=http.createServer((req,res)=>{
    observed.push({method:req.method,path:req.url,token:req.headers['x-studio-token']});
    res.setHeader('content-type','application/json');
    if(studioOffline){res.writeHead(503);res.end(JSON.stringify({code:'STUDIO_OFFLINE'}));return;}
    if(req.method==='GET'&&req.url==='/api/v1/personal-agent/status'){
      res.writeHead(200);res.end(JSON.stringify({
        initialized,scope:'local-data-directory',scopeFingerprint:SCOPE,
        schemaVersion:1,...(initialized?{version:4}:{})}));return;
    }
    res.writeHead(404);res.end(JSON.stringify({code:'NOT_FOUND'}));
  });
  let host;
  await listen(studio);
  try{
    host=createHostServer({dataRoot:dir,ownerToken:TOKEN,
      studioUrl:'http://127.0.0.1:'+studio.address().port,
      studioToken:'private-studio-token'});
    await listen(host);
  }catch(e){
    if(host)await close(host);
    await close(studio);
    rmSync(dir,{recursive:true,force:true});
    throw e;
  }
  t.after(async()=>{await close(host);await close(studio);rmSync(dir,{recursive:true,force:true});});
  return {base:'http://127.0.0.1:'+host.address().port,observed};
}
const route='/api/host/control/work-status';
const authorized={authorization:'Bearer '+TOKEN};

test('unauthorized caller sees no Studio Work state and triggers zero Studio reads',async t=>{
  const f=await fixture(t,{initialized:true});
  const result=await fetch(f.base+route);
  assert.equal(result.status,401);
  assert.equal(f.observed.length,0);
  const invalid=await fetch(f.base+route,{headers:{authorization:'Bearer wrong-token'}});
  assert.equal(invalid.status,401);
  assert.equal(f.observed.length,0);
});
test('owner-only GET reports true uninitialized state without creating identity',async t=>{
  const f=await fixture(t);
  const response=await fetch(f.base+route,{headers:authorized});
  assert.equal(response.status,200);
  const view=await response.json();
  assert.deepEqual(view,{schema:'vivim.studio-work-status/1',
    state:'uninitialized',version:null,execution:'not-dispatched'});
  assert.match(response.headers.get('cache-control'),/no-store/);
  assert.deepEqual(f.observed.map(e=>[e.method,e.path]),
    [['GET','/api/v1/personal-agent/status']]);
  assert.equal(f.observed[0].token,'private-studio-token');
});
test('initialized owner Work status is bounded and does not expose personal records',async t=>{
  const f=await fixture(t,{initialized:true});
  const response=await fetch(f.base+route,{headers:authorized});
  assert.equal(response.status,200);
  const view=await response.json();
  assert.equal(view.schema,'vivim.studio-work-status/1');
  assert.equal(view.state,'source-backed');
  assert.equal(view.version,4);
  assert.equal(view.scopeFingerprint,SCOPE);
  assert.equal(view.execution,'not-dispatched');
  assert.equal(f.observed.length,1);
  assert.equal(JSON.stringify(view).includes('private-studio-token'),false);
});
test('wrong Origin and non-GET methods never invoke Studio or create Work',async t=>{
  const f=await fixture(t,{initialized:true});
  const wrongOrigin=await fetch(f.base+route,{headers:{...authorized,origin:'https://evil.invalid'}});
  assert.equal(wrongOrigin.status,403);
  const post=await fetch(f.base+route,{method:'POST',
    headers:{...authorized,origin:f.base,'x-vivim-control':'1'},body:'{}'});
  assert.equal(post.status,405);
  assert.equal(f.observed.length,0);
});
test('unavailable Studio is sanitized and never represented as initialized',async t=>{
  const f=await fixture(t,{studioOffline:true});
  const response=await fetch(f.base+route,{headers:authorized});
  assert.equal(response.status,503);
  const view=await response.json();
  assert.deepEqual(view,{schema:'vivim.studio-work-status/1',
    state:'unavailable',code:'STUDIO_WORK_UNAVAILABLE'});
  assert.equal(f.observed.length,1);
});

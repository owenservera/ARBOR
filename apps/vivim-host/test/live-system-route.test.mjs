import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHostServer} from '../server.mjs';
import {createBootstrapRuntime} from '../bootstrap/runtime.mjs';

const KEY='test_owner_live_system_read_only_12345678';
test('owner-only live-system GET uses real journal source and native Rust computation',async t=>{
  const root=mkdtempSync(path.join(tmpdir(),'vivim-live-system-'));
  const runtime=createBootstrapRuntime({dataRoot:root});
  const host=createHostServer({dataRoot:root,bootstrap:runtime,ownerToken:KEY,
    onboarding:{phoneSeen:()=>{},primary:()=>null,providerSnapshot:()=>[]}});
  await new Promise(ok=>host.listen(0,'127.0.0.1',ok));
  t.after(async()=>{await new Promise(ok=>host.close(ok));runtime.close();
    rmSync(root,{recursive:true,force:true});});
  const req=(method='GET',extra={})=>new Promise((resolve,reject)=>{
    const request=http.request({host:'127.0.0.1',port:host.address().port,
      path:'/api/host/live-system',method,headers:{host:'127.0.0.1:'+host.address().port,...extra}},
      response=>{let body='';response.on('data',c=>body+=c);response.on('end',()=>
        resolve({status:response.statusCode,body:body?JSON.parse(body):null}));});
    request.on('error',reject);request.end();
  });
  assert.equal((await req()).status,401);
  assert.equal((await req('POST',{authorization:'Bearer '+KEY})).status,405);
  assert.equal((await req('GET',{authorization:'Bearer '+KEY,origin:'http://evil.invalid'})).status,403);
  const first=await req('GET',{authorization:'Bearer '+KEY});
  // This test runs on a machine with the compiled native product kernel.
  // A 503 must fail the integration gate rather than silently pass.
  assert.equal(first.status,200,JSON.stringify(first.body));
  assert.equal(first.body.schema,'vivim.host-live-system/1');
  assert.equal(first.body.state,'source-backed');
  assert.equal(first.body.authority,'read-only-projection');
  assert.equal(first.body.effectPerformed,false);
  assert.equal(first.body.executionAuthorized,false);
  assert.deepEqual(first.body.regions.map(x=>x.id),['host.health','wiki.summary']);
  assert.ok(first.body.regions.every(x=>x.exposure==='owner'));
  assert.ok(!JSON.stringify(first.body).includes('ownerToken'));
  const again=await req('GET',{authorization:'Bearer '+KEY});
  assert.equal(again.status,200);
  assert.equal(again.body.epoch,first.body.epoch);
  assert.equal(again.body.revision,first.body.revision);
});
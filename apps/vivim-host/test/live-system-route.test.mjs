import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
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
  t.after(async()=>{host.closeAllConnections();await new Promise(ok=>host.close(ok));runtime.close();
    rmSync(root,{recursive:true,force:true});});
  const req=(method='GET',extra={},uri='/api/host/live-system')=>new Promise((resolve,reject)=>{
    const request=http.request({host:'127.0.0.1',port:host.address().port,
      path:uri,method,headers:{host:'127.0.0.1:'+host.address().port,...extra}},
      response=>{let body='';response.on('data',c=>body+=c);response.on('end',()=>
        resolve({status:response.statusCode,body:body?JSON.parse(body):null}));});
    request.setTimeout(5000,()=>request.destroy(Error('LIVE_HTTP_TIMEOUT')));
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
  assert.equal(first.body.mirror?.state,'written');
  const mirrorFile=path.join(root,'live-system','owner.current.json');
  const mirror=JSON.parse(readFileSync(mirrorFile,'utf8'));
  assert.equal(mirror.schema,'vivim.live-system-state/1');
  assert.equal(mirror.sequence,first.body.revision);
  assert.equal(first.body.authority,'read-only-projection');
  assert.equal(first.body.effectPerformed,false);
  assert.equal(first.body.coverage?.complete,false);
  assert.ok(first.body.coverage?.missingCapabilities.includes('pwa.full-surface'));
  assert.equal(first.body.executionAuthorized,false);
  assert.deepEqual(first.body.regions.map(x=>x.id),['host.health','wiki.summary']);
  assert.ok(first.body.regions.every(x=>x.exposure==='owner'));
  assert.ok(!JSON.stringify(first.body).includes('ownerToken'));
  const again=await req('GET',{authorization:'Bearer '+KEY});
  assert.equal(again.status,200);
  assert.equal(again.body.epoch,first.body.epoch);
  assert.equal(again.body.revision,first.body.revision);
  // Real diagnostic append is consumed without copying typed words or claiming
  // a screenshot/DOM mirror. This is the first PWA input+render state feed.
  mkdirSync(path.join(root,'diagnostics'),{recursive:true});
  const stamp=new Date().toISOString();
  const envelope=(stage,extra)=>JSON.stringify({schema:'vivim.first-contact-observation/1',
    origin:'owner-tailnet-http',time:stamp,stage,...extra});
  writeFileSync(path.join(root,'diagnostics','first-contact-events.jsonl'),
    envelope('input',{length:5})+'\n'+envelope('render-matches',{matches:2,revision:1})+'\n');
  const live=await req('GET',{authorization:'Bearer '+KEY});
  assert.equal(live.status,200,JSON.stringify(live.body));
  assert.equal(live.body.revision,first.body.revision+2);
  assert.deepEqual(live.body.regions.map(x=>x.id),
    ['host.health','pwa.input','pwa.view','wiki.summary']);
  assert.equal(live.body.regions.find(x=>x.id==='pwa.input').data.length,5);
  assert.equal(live.body.regions.find(x=>x.id==='pwa.view').data.matches,2);
  assert.ok(!JSON.stringify(live.body).includes('ownerToken'));
  const admission='/api/host/live-system/admit-file';
  assert.equal((await req('POST',{authorization:'Bearer '+KEY},admission)).status,403);
  const headers={authorization:'Bearer '+KEY,origin:'http://127.0.0.1:'+host.address().port,
    'x-vivim-control':'1'};
  const unchanged=await req('POST',headers,admission);
  assert.equal(unchanged.status,200);
  assert.equal(unchanged.body.state,'refused');
  const edited=JSON.parse(readFileSync(mirrorFile,'utf8'));
  edited.regions.find(r=>r.id==='wiki.summary').data.pageCount=999;
  writeFileSync(path.join(root,'live-system','owner.proposal.json'),JSON.stringify(edited)+'\n');
  const refused=await req('POST',headers,admission);
  assert.equal(refused.status,200);
  assert.equal(refused.body.state,'refused');
  assert.equal(refused.body.effectPerformed,false);
  assert.equal(refused.body.executionAuthorized,false);
});
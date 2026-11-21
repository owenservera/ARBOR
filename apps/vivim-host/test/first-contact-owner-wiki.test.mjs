import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHostServer} from '../server.mjs';
import {createBootstrapRuntime} from '../bootstrap/runtime.mjs';

test('first-contact Wiki admits only authenticated Tailscale owner without a device grant',async t=>{
  const root=mkdtempSync(path.join(tmpdir(),'vivim-first-contact-owner-'));
  const runtime=createBootstrapRuntime({dataRoot:root});
  const host=createHostServer({dataRoot:root,bootstrap:runtime,
    onboarding:{phoneSeen:()=>{},primary:()=>null,providerSnapshot:()=>[]},
    directPhone:{origin:'https://owner.example.ts.net',user:'owner@example.com'}});
  await new Promise(ok=>host.listen(0,'127.0.0.1',ok));
  t.after(async()=>{await new Promise(ok=>host.close(ok));runtime.close();
    rmSync(root,{recursive:true,force:true});});
  async function call(uri,{method='GET',login='owner@example.com',proto='https'}={}){
    return new Promise((resolve,reject)=>{
      const req=http.request({host:'127.0.0.1',port:host.address().port,path:uri,
        method,headers:{host:'owner.example.ts.net',
          'x-forwarded-proto':proto,'tailscale-user-login':login}},res=>{
        let bytes='';res.setEncoding('utf8');res.on('data',c=>bytes+=c);
        res.on('end',()=>resolve({status:res.statusCode,body:bytes}));
      });req.on('error',reject);req.end();
    });
  }
  const wiki=await call('/mobile/api/first-contact/wiki');
  assert.equal(wiki.status,200);
  const body=JSON.parse(wiki.body);
  assert.ok(Number.isSafeInteger(body.revision));
  assert.equal(typeof body.pages,'object');
  assert.equal((await call('/mobile/api/first-contact/wiki',{login:'another@example.com'})).status,403);
  assert.equal((await call('/mobile/api/first-contact/wiki',{login:''})).status,403);
  assert.equal((await call('/mobile/api/first-contact/wiki',{proto:'http'})).status,403);
  assert.equal((await call('/mobile/api/first-contact/wiki',{method:'POST'})).status,405);
  assert.equal((await call('/mobile/api/wiki')).status,401);
  assert.equal((await call('/mobile/api/chat/context?focus=wiki')).status,401);
});

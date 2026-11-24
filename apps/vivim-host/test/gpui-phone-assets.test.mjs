import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PHONE_ASSETS,serveLoopbackPhoneAsset,createDirectPhoneHandler} from '../direct-phone.mjs';

const moduleNames=[
  'gpui-viewport-contract.mjs',
  'gpui-canvas-viewport.mjs',
  'gpui-text-input-contract.mjs'
];
const source=resolve(fileURLToPath(new URL('../../mobile-relay/',import.meta.url)));
function response(){
  return {
    status:null,headers:{},body:null,
    setHeader(name,value){this.headers[name.toLowerCase()]=value;},
    writeHead(code){this.status=code;return this;},
    end(value){this.body=value??null;return this;}
  };
}
const realBytes=name=>readFileSync(join(source,name));

test('all three SINGLE-renderer GPUI phone modules are on incumbent bounded allowlist',()=>{
  for(const name of moduleNames){
    assert.deepEqual(PHONE_ASSETS.get(name),[name,'text/javascript; charset=utf-8']);
    assert.ok(realBytes(name).length>50);
  }
  assert.equal(PHONE_ASSETS.has('gpui-native-application.js'),false,
    'phone must not introduce a second GPUI/DOM application renderer');
  assert.equal(PHONE_ASSETS.has('../native/gpui-desktop/src/main.rs'),false);
});
test('owner loopback preview GET serves exact canonical viewport modules, not copies',async()=>{
  for(const name of moduleNames){
    const req={method:'GET',url:'/mobile/'+name},res=response();
    assert.equal(await serveLoopbackPhoneAsset(req,res,'/mobile/'+name),true);
    assert.equal(res.status,200);
    assert.equal(res.headers['content-type'],'text/javascript; charset=utf-8');
    assert.deepEqual(Buffer.from(res.body),realBytes(name));
    assert.match(res.headers['content-security-policy'],/script-src 'self'/);
    assert.equal(res.headers['x-frame-options'],'SAMEORIGIN');
  }
});
test('loopback HEAD returns allowed metadata but no private or duplicate content',async()=>{
  const req={method:'HEAD',url:'/mobile/gpui-canvas-viewport.mjs'},res=response();
  assert.equal(await serveLoopbackPhoneAsset(req,res,req.url),true);
  assert.equal(res.status,200);
  assert.equal(res.body,null);
  assert.equal(res.headers['content-type'],'text/javascript; charset=utf-8');
});
test('unknown GPUI-looking assets and dangerous methods never get served',async()=>{
  for(const name of ['gpui-other-renderer.js','gpui-frame-secret.json','../server.mjs']){
    const path='/mobile/'+name, res=response();
    assert.equal(await serveLoopbackPhoneAsset({method:'GET',url:path},res,path),true);
    assert.equal(res.status,404);
  }
  const res=response();
  await serveLoopbackPhoneAsset({method:'POST',url:'/mobile/gpui-canvas-viewport.mjs'},res,
    '/mobile/gpui-canvas-viewport.mjs');
  assert.equal(res.status,405);
});
test('existing Direct HTTPS/Tailscale route serves identical bytes at same phone URL',async()=>{
  const dataRoot=mkdtempSync(join(tmpdir(),'vivim-gpui-phone-assets-'));
  const origin='https://pc.tailnet.ts.net',user='owner@example.test';
  let handler;
  try{
    handler=createDirectPhoneHandler({origin,user,dataRoot,
      projection:async()=>({cards:[],preferences:[],hardNos:[]})});
    for(const name of moduleNames){
      const req={method:'GET',url:'/mobile/'+name,socket:{remoteAddress:'127.0.0.1'},
        headers:{host:'pc.tailnet.ts.net','x-forwarded-proto':'https',
          'tailscale-user-login':user}},
        res=response();
      await handler(req,res);
      assert.equal(res.status,200,name);
      assert.deepEqual(Buffer.from(res.body),realBytes(name));
      assert.equal(res.headers['content-type'],'text/javascript; charset=utf-8');
      assert.match(res.headers['content-security-policy'],/script-src 'self'/);
    }
  } finally{
    handler?.close();rmSync(dataRoot,{recursive:true,force:true});
  }
});
test('Direct URL asset check cannot bypass trusted local proxy identity',async()=>{
  const dataRoot=mkdtempSync(join(tmpdir(),'vivim-gpui-phone-denial-'));
  const origin='https://pc.tailnet.ts.net',user='owner@example.test';
  let handler;
  try{
    handler=createDirectPhoneHandler({origin,user,dataRoot,
      projection:async()=>({cards:[],preferences:[],hardNos:[]})});
    for(const headers of [
      {host:'pc.tailnet.ts.net','x-forwarded-proto':'https'},
      {host:'pc.tailnet.ts.net','x-forwarded-proto':'http','tailscale-user-login':user},
      {host:'pc.tailnet.ts.net','x-forwarded-proto':'https','tailscale-user-login':'attacker@example.test'}
    ]){
      const res=response();
      await handler({method:'GET',url:'/mobile/gpui-canvas-viewport.mjs',
        socket:{remoteAddress:'127.0.0.1'},headers},res);
      assert.equal(res.status,403);
      assert.equal(String(res.body).includes('createGpuiHostFrameRelay'),false);
    }
  }finally{
    handler?.close();rmSync(dataRoot,{recursive:true,force:true});
  }
});

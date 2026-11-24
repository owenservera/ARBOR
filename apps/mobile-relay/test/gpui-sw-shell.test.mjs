import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
function sw(scope='https://pc.tailnet.ts.net/mobile/'){
  const handlers=new Map(),requests=[],cachePut=[];
  const base=new URL(scope);
  const registration={scope};
  const self={registration,location:{href:new URL('sw.js',base).href},
    addEventListener:(name,fn)=>handlers.set(name,fn),
    skipWaiting:()=>Promise.resolve(),
    clients:{claim:()=>Promise.resolve()}};
  const cache={put:(k,v)=>{cachePut.push(k);return Promise.resolve(v);},
    match:()=>Promise.resolve(null)};
  const caches={open:async()=>cache,delete:async()=>true,keys:async()=>[]};
  const fetch=async(url,opts)=>{requests.push({url,opts});
    return {ok:true,type:'basic',redirected:false,clone(){return this;}};};
  runInNewContext(source,{self,URL,Promise,fetch,caches,console});
  return {handlers,requests,cachePut,caches,scope};
}
test('atomic service-worker generation includes all one-renderer phone modules',()=>{
  assert.match(source,/vivim-relay-shell-v49/);
  for(const name of ['gpui-phone-mount.mjs','gpui-phone-channel.mjs',
    'gpui-viewport-contract.mjs','gpui-canvas-viewport.mjs',
    'gpui-text-input-contract.mjs']){
    assert.ok(source.includes("'"+name+"'"),name+' is an optional shell asset');
  }
  assert.match(source,/if \(critical\) throw error/);
  assert.match(source,/if \(critical\) throw new Error/);
});
test('Direct install can cache only shell assets under incumbent phone origin',async()=>{
  const f=sw();
  let task;
  f.handlers.get('install')({waitUntil:p=>{task=p;}});
  await task;
  for(const name of ['gpui-phone-channel.mjs','gpui-phone-mount.mjs'])
    assert.ok(f.cachePut.includes('https://pc.tailnet.ts.net/mobile/'+name));
  assert.equal(f.cachePut.some(x=>x.includes('/api/')),false);
  assert.equal(f.cachePut.some(x=>x.includes('token=')),false);
});
test('offline service-worker fetch bypasses authentication-bearing GPUI frame and inputs',()=>{
  const f=sw();
  let handled=0;
  const request=(path,method='GET',headers={})=>{
    f.handlers.get('fetch')({request:{
      url:'https://pc.tailnet.ts.net/mobile/'+path,method,
      headers:{get:k=>headers[k]||null},mode:'same-origin'
    },respondWith:()=>{handled++;}});
  };
  request('api/gpui/frame');
  request('api/gpui/input','POST');
  request('api/gpui/native-frame','POST');
  request('gpui-phone-channel.mjs','GET',{'x-vivim-grant-id':'a'.repeat(32)});
  request('gpui-phone-mount.mjs','GET',{'authorization':'Bearer private'});
  request('gpui-phone-mount.mjs','POST');
  assert.equal(handled,0,'no API/mutation/grant-bearing request may be served by SW');
});
test('native GPUI module requests are cached only as an optional read-only shell resource',()=>{
  const f=sw();
  let handled=0;
  f.handlers.get('fetch')({request:{
    url:'https://pc.tailnet.ts.net/mobile/gpui-phone-mount.mjs',
    method:'GET',headers:{get:()=>null},mode:'same-origin'
  },respondWith:()=>{handled++;}});
  assert.equal(handled,1);
});

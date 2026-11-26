'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomBytes,randomUUID}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),https=require('node:https');
const {once}=require('node:events');
const {createRelay,pollOnce,runNativeProbe}=require('../server/device-peer.cjs');
const {createDeviceTools}=require('../server/device-router.cjs');

test('real loopback HTTPS: bounded authenticated fixed-probe routing and receipt',async t=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'vivim-peer-tls-'));
 t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
 const openssl=process.platform==='win32'?path.resolve(execFileSync('git',['--exec-path'],{encoding:'utf8'}).trim(),'../../../usr/bin/openssl.exe'):'openssl';
 const key=path.join(tmp,'key.pem'),cert=path.join(tmp,'cert.pem');
 execFileSync(openssl,['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','1','-subj','/CN=localhost','-addext','subjectAltName=IP:127.0.0.1'],{stdio:'ignore'});
 const ca=fs.readFileSync(cert),token=randomBytes(32).toString('hex');
 const relay=createRelay({tls:{key:fs.readFileSync(key),cert:ca},token,ttlMs:1000});
 t.after(()=>relay.close());
 relay.server.listen(0,'127.0.0.1');await once(relay.server,'listening');
 const origin='https://127.0.0.1:'+relay.server.address().port;
 const fetcher=(url,init)=>new Promise((resolve,reject)=>{
  const req=https.request(url,{method:init.method,headers:init.headers,ca,signal:init.signal},res=>{
   const parts=[];res.on('data',b=>parts.push(b));res.on('end',()=>resolve(new Response(Buffer.concat(parts),{status:res.statusCode})));res.on('error',reject);
  });req.on('error',reject);req.end(init.body);
 });
 const post=(route,value,credential=token)=>fetcher(origin+route,{method:'POST',headers:{authorization:'Bearer '+credential,'content-type':'application/json'},body:JSON.stringify(value)});
 const [,health,probe]=createDeviceTools({android:relay.adapter},{timeoutMs:2000});
 const fixture=async tool=>tool.endsWith('health')?{schema:'vivim.android-health/1',status:'ready',platform:'android'}:{schema:'vivim.android-probe/1',platform:'android',machine:'aarch64',exitCode:0};
 await t.test('unauthorized peer refused',async()=>assert.equal((await post('/poll',{},randomBytes(32).toString('hex'))).status,403));
 await t.test('no pending job',async()=>assert.equal(await pollOnce({origin,token,fetcher,probe:fixture}),false));
 await t.test('health routes through actual TLS',async()=>{
  const pending=health[3]({device_id:'android'});
  assert.equal(await pollOnce({origin,token,fetcher,probe:fixture}),true);
  assert.equal((await pending).result.platform,'android');
 });
 await t.test('probe receipt and no duplicate claim',async()=>{
  const pending=probe[3]({device_id:'android'});
  const {job}=await (await post('/poll',{})).json();
  assert.equal(job.tool,'vivim_android_probe');
  assert.equal((await (await post('/poll',{})).json()).job,null);
  assert.equal((await post('/result',{requestId:job.requestId,ok:true,value:await fixture(job.tool),extra:true})).status,409);
  assert.equal((await post('/result',{requestId:job.requestId,ok:true,value:await fixture(job.tool)})).status,200);
  assert.equal((await pending).requestId,job.requestId);
  assert.equal((await post('/result',{requestId:job.requestId,ok:true,value:await fixture(job.tool)})).status,409);
 });
 await t.test('unknown operation rejected',async()=>assert.rejects(relay.adapter.call('shell',{}, {requestId:randomUUID()}),/DENIED/));
 await t.test('cancellation and no retry',async()=>{
  const abort=new AbortController(),pending=relay.adapter.call('vivim_android_probe',{}, {requestId:randomUUID(),signal:abort.signal});
  abort.abort();await assert.rejects(pending,/ABORTED/);
  assert.equal((await (await post('/poll',{})).json()).job,null);
 });
 await t.test('offline peer fails with bounded timeout',async()=>assert.rejects(health[3]({device_id:'android'}),/TIMEOUT/));
 await t.test('native probe refuses non-Android',async()=>assert.rejects(runNativeProbe('vivim_android_probe',{platform:'linux'}),/NOT_NATIVE_TERMUX/));
});

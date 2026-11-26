'use strict';
// R001: fixed-probe device routing contract. No remote shell, no new grants.
// Device adapters must be bound by the local operator; never infer a target.
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const allowed=Object.freeze({
 windows:Object.freeze({health:'vivim_tunnel_health'}),
 android:Object.freeze({health:'vivim_android_health',probe:'vivim_android_probe'})
});
const schema=(fields)=>({type:'object',properties:Object.fromEntries(fields.map(k=>[k,{type:'string'}])),required:fields,additionalProperties:false});
function createDeviceTools(adapters,{timeoutMs=5000}={}){
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<100||timeoutMs>30000)throw Error('INVALID_TIMEOUT');
 const bound=new Map();
 for(const [id,adapter] of Object.entries(adapters)){
  if(!Object.hasOwn(allowed,id)||typeof adapter?.call!=='function')throw Error('INVALID_DEVICE_BINDING');
  bound.set(id,adapter);
 }
 async function route(device,operation){
  if(!bound.has(device)||!Object.hasOwn(allowed[device],operation))throw Error('DEVICE_OR_OPERATION_NOT_GRANTED');
  const adapter=bound.get(device),requestId=randomUUID();
  const signal=AbortSignal.timeout(timeoutMs);
  let onAbort;
  try{
   const response=await Promise.race([
    Promise.resolve().then(()=>adapter.call(allowed[device][operation],{}, {signal,requestId})),
    new Promise((_,reject)=>{onAbort=()=>reject(Error('DEVICE_TIMEOUT'));signal.addEventListener('abort',onAbort,{once:true});})
   ]);
   if(!response||response.isError||typeof response!=='object')throw Error('DEVICE_CALL_FAILED');
   // Only project known fixed-probe fields. Do not expose credentials or raw logs.
   const payload=response.content?JSON.parse(response.content[0].text):response;
   if(device==='android'){
    if(operation==='health'&&(payload.schema!=='vivim.android-health/1'||payload.status!=='ready'||payload.platform!=='android'))throw Error('ANDROID_IDENTITY_UNVERIFIED');
    if(operation==='probe'&&(payload.schema!=='vivim.android-probe/1'||payload.platform!=='android'||payload.exitCode!==0||!['aarch64','arm64','armv7l','x86_64','i686'].includes(payload.machine)))throw Error('ANDROID_IDENTITY_UNVERIFIED');
    return {schema:'vivim.device-receipt/1',deviceId:device,requestId,operation,result:operation==='health'?{status:payload.status,platform:payload.platform}:{platform:payload.platform,machine:payload.machine,exitCode:payload.exitCode}};
   }
   if(payload.schema!=='vivim.tunnel-health/1'||payload.status!=='ready')throw Error('WINDOWS_HEALTH_UNVERIFIED');
   return {schema:'vivim.device-receipt/1',deviceId:device,requestId,operation,result:{status:payload.status,profile:payload.profile}};
  }finally{if(onAbort)signal.removeEventListener('abort',onAbort);}
 }
 return [
 ['vivim_devices','List explicitly bound device IDs; presence is not liveness.',schema([]),()=>({schema:'vivim.devices/1',devices:[...bound.keys()].map(deviceId=>({deviceId,operations:Object.keys(allowed[deviceId]),liveness:'unverified'}))}),true],
 ['vivim_device_health','Check health of exactly one locally bound device.',schema(['device_id']),a=>route(a.device_id,'health'),true],
 ['vivim_device_probe','Run the fixed native identity probe on an explicitly bound Android device.',schema(['device_id']),a=>route(a.device_id,'probe'),true]
 ];
}
module.exports={createDeviceTools};
if(require.main===module){
 (async()=>{
  const win={call:async()=>({schema:'vivim.tunnel-health/1',status:'ready',profile:'private-workstation'})};
  const android={call:async(name)=>name.endsWith('health')?{schema:'vivim.android-health/1',status:'ready',platform:'android'}:{schema:'vivim.android-probe/1',platform:'android',machine:'aarch64',exitCode:0}};
  const [list,health,probe]=createDeviceTools({windows:win,android});
  assert.deepEqual(list[3]().devices.map(x=>x.deviceId),['windows','android']);
  assert.equal((await health[3]({device_id:'windows'})).deviceId,'windows');
  assert.equal((await health[3]({device_id:'android'})).result.platform,'android');
  assert.equal((await probe[3]({device_id:'android'})).result.machine,'aarch64');
  await assert.rejects(probe[3]({device_id:'windows'}),/NOT_GRANTED/);
  await assert.rejects(health[3]({device_id:'unknown'}),/NOT_GRANTED/);
  const [,bad]=createDeviceTools({android:{call:async()=>({schema:'vivim.android-health/1',status:'ready',platform:'linux'})}});
  await assert.rejects(bad[3]({device_id:'android'}),/IDENTITY_UNVERIFIED/);
  assert.throws(()=>createDeviceTools({unknown:win}),/INVALID_DEVICE_BINDING/);
  const [,slow]=createDeviceTools({android:{call:()=>new Promise(()=>{})}},{timeoutMs:100});
  const keep=setTimeout(()=>{},200);
  try{await assert.rejects(slow[3]({device_id:'android'}),/TIMEOUT/);}finally{clearTimeout(keep);}
  const [,err]=createDeviceTools({android:{call:async()=>({isError:true})}});
  await assert.rejects(err[3]({device_id:'android'}),/CALL_FAILED/);
  console.log('10/10 router contract tests passed (fixture device adapters; not live Android)');
 })().catch(e=>{console.error(e);process.exitCode=1});
}

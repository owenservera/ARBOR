'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createProfile}=require('../server/tunnel-readonly.cjs');
async function init(options={}){
 const p=createProfile({},options);
 const req=(method,params={})=>p.dispatch({jsonrpc:'2.0',id:1,method,params});
 await req('initialize',{protocolVersion:'2025-11-25'});
 await p.dispatch({jsonrpc:'2.0',method:'notifications/initialized'});
 return {req,call:(name,args={})=>req('tools/call',{name,arguments:args})};
}
const health={schema:'vivim.android-health/1',status:'ready',platform:'android'};
test('default catalogue remains unchanged',async()=>{
 const {req}=await init();
 assert.deepEqual((await req('tools/list')).result.tools.map(t=>t.name),['vivim_tunnel_health']);
});
test('explicit device adapter is additive, never inferred from remote input',async()=>{
 let calls=0;
 const {req,call}=await init({deviceAdapters:{android:{call:async()=>{calls++;return health;}}}});
 const tools=(await req('tools/list')).result.tools;
 assert.deepEqual(tools.map(t=>t.name),['vivim_tunnel_health','vivim_devices','vivim_device_health','vivim_device_probe']);
 assert.ok(tools.every(t=>t.annotations.readOnlyHint));
 assert.equal((await call('vivim_device_health',{device_id:'windows'})).result.isError,true);
 assert.equal((await call('vivim_device_health',{device_id:'android',command:'uname'})).error.code,-32602);
 assert.equal(calls,0);
 const r=JSON.parse((await call('vivim_device_health',{device_id:'android'})).result.content[0].text);
 assert.equal(r.deviceId,'android');assert.equal(r.result.platform,'android');assert.equal(calls,1);
});
test('duplicate names refused; unknown adapter fails closed',()=>{
 assert.throws(()=>createProfile({},{deviceAdapters:{linux:{call(){}}}}),/INVALID_DEVICE_BINDING/);
 assert.throws(()=>createProfile({},{workstation:[['vivim_devices','duplicate',{},()=>{}]],deviceAdapters:{}}),/DUPLICATE_MCP_TOOL_ID/);
});

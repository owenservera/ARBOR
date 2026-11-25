'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createMaintenanceGate,createAdmission}=require('../server/maintenance-gate.cjs');
const {createProfile}=require('../server/tunnel-readonly.cjs');
test('maintenance marker only denies; missing marker is normal, malformed marker fails closed',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vivim-maintenance-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const read=createMaintenanceGate({directory:dir}),file=path.join(dir,'drain.json');
 assert.equal(read(),null);fs.writeFileSync(file,'{}');assert.equal(read().reason,'invalid-maintenance-record');
 const marker={schema:'vivim.workstation-maintenance/1',id:'a'.repeat(32)};
 fs.writeFileSync(file,JSON.stringify(marker));assert.equal(read().id,marker.id);
 fs.unlinkSync(file);assert.equal(read(),null);
});
test('drain waits for admitted request and refuses new effects without replay',async()=>{
 let marker=null,finish,count=0;const a=createAdmission(()=>marker);
 const pending=a.run('vivim_session_start',()=>{count++;return new Promise(r=>finish=r)});
 marker={id:'a'.repeat(32),reason:'local-operator-maintenance'};
 assert.equal(a.status().state,'draining');assert.equal(a.status().inFlight,1);
 await assert.rejects(a.run('vivim_session_start',()=>count++),/MAINTENANCE/);
 assert.equal(await a.run('vivim_session_status',()=>42),42);
 finish('done');assert.equal(await pending,'done');assert.equal(a.status().state,'drained');assert.equal(count,1);
 marker=null;assert.equal(a.status(),null);await a.run('vivim_session_start',()=>count++);assert.equal(count,2);
});
test('MCP health remains callable during drain; tool list unchanged; effect refused',async()=>{
 let marker=null,called=0;
 const schema={type:'object',properties:{},required:[],additionalProperties:false};
 const p=createProfile({}, {maintenance:()=>marker,workstation:[['vivim_session_start','test',schema,()=>{called++;return {ok:true}},false]]});
 const call=(id,name)=>p.dispatch({jsonrpc:'2.0',id,method:'tools/call',params:{name,arguments:{}}});
 await p.dispatch({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-11-25'}});
 await p.dispatch({jsonrpc:'2.0',method:'notifications/initialized'});
 const before=await p.dispatch({jsonrpc:'2.0',id:2,method:'tools/list'});
 marker={id:'b'.repeat(32),reason:'local-operator-maintenance'};
 const health=JSON.parse((await call(3,'vivim_tunnel_health')).result.content[0].text);
 assert.equal(health.status,'maintenance');assert.equal(health.maintenance.state,'drained');
 assert.equal((await call(4,'vivim_session_start')).result.isError,true);assert.equal(called,0);
 const after=await p.dispatch({jsonrpc:'2.0',id:5,method:'tools/list'});assert.deepEqual(after.result,before.result);
 marker=null;assert.equal((await call(6,'vivim_session_start')).result.isError,undefined);assert.equal(called,1);
});

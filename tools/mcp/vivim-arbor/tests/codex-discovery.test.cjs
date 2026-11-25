'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createDiscoveryProtocol,resolveExecutable,observeCodex}=require('../server/codex-discovery.cjs');
const init={id:1,result:{userAgent:'codex-fixture',codexHome:'private'}};
function ready(){const p=createDiscoveryProtocol();assert.equal(p.start().method,'initialize');assert.deepEqual(p.receive(init).send,[{method:'initialized'},{id:2,method:'thread/list',params:{limit:10,archived:false}}]);return p;}
test('exact fixed discovery flow and aggregate-only result',()=>{
 const p=ready();assert.deepEqual(p.receive({method:'thread/started',params:{private:'secret'}}),{});
 const r=p.receive({id:2,result:{data:[{id:'private-id',preview:'secret',cwd:'private-path'}],nextCursor:'private-cursor'}}).result;
 assert.deepEqual(r,{schema:'vivim.codex-observation/1',adapter:'codex-app-server',initialized:true,threadPageCount:1,hasMore:true,scope:'local-history-sample',accountAuthentication:'not-tested',inference:'not-requested',effectAuthority:'none'});
});
test('deny unexpected server requests, never auto-approve',()=>{
 const p=ready();assert.throws(()=>p.receive({id:99,method:'item/commandExecution/requestApproval',params:{}}),/CODEX_UNEXPECTED_SERVER_REQUEST/);
});
test('invalid or mismatched responses fail closed',()=>{
 for(const m of [{id:3,result:{}},{id:2,error:{message:'private'}},{id:2,result:{data:Array(11).fill({id:'a'})}},{id:2,result:{data:[{id:'a'},{id:'a'}]}},{id:2,result:{data:[{}]}},{id:2,result:{data:[],nextCursor:42}}])
  assert.throws(()=>ready().receive(m),/CODEX_/);
});
test('empty history is a successful observation, not evidence of provider admission',()=>{
 const r=ready().receive({id:2,result:{data:[],nextCursor:null}}).result;
 assert.equal(r.threadPageCount,0);assert.equal(r.hasMore,false);assert.equal(r.accountAuthentication,'not-tested');
});
test('local executable must be explicit absolute native binary, not a shell or arbitrary program',async()=>{
 assert.throws(()=>resolveExecutable({VIVIM_CODEX_EXE:'relative'}),/CODEX_EXECUTABLE_UNCONFIGURED/);
 await assert.rejects(observeCodex({env:{VIVIM_CODEX_EXE:'relative'},workspace:process.cwd(),spawnChild:()=>assert.fail('spawned')}),/CODEX_EXECUTABLE_UNCONFIGURED/);
});

'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {createAcceptance}=require('../server/probe-acceptance.cjs');
const {createProfile}=require('../server/tunnel-readonly.cjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const value={schema:'vivim.tunnel-workstation-receipt/1',planId:'ctl-0123456789abcdef',actionId:'workstation.process.start',status:'applied',recipe:'node-version',version:'v24.22.1',exitCode:0};
function fixture(t){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'vivim-acceptance-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
 const helper=path.join(directory,process.platform==='win32'?'vivim-workstation-probe.exe':'vivim-workstation-probe');
 const runner=path.join(directory,'runtime','tools','mcp','vivim-arbor','server','probe-acceptance-runner.mjs');
 fs.mkdirSync(path.dirname(runner),{recursive:true});fs.writeFileSync(helper,'helper');fs.writeFileSync(runner,'runner');
 const grant={schema:'vivim.local-probe-grant/1',id:'a'.repeat(32),helperSha256:hash('helper'),runnerSha256:hash('runner'),expiresAt:Date.now()+600000};
 const file=path.join(directory,'grant.json');fs.writeFileSync(file,JSON.stringify(grant));
 return {directory,grant,file,helper,runner};
}
test('default disabled and expired grant denied',t=>{const f=fixture(t);assert.equal(createAcceptance({directory:f.directory,now:()=>f.grant.expiresAt+1}),null);fs.unlinkSync(f.file);assert.equal(createAcceptance({directory:f.directory}),null)});
test('one exact child, bounded projected receipt, credential isolation, replay',async t=>{
 const f=fixture(t);let count=0;
 const tool=createAcceptance({directory:f.directory,execute:async(exe,args,opts)=>{count++;assert.equal(exe,process.execPath);assert.deepEqual(args,[fs.realpathSync(f.runner)]);assert.equal(opts.shell,false);assert.equal(opts.env.CONTROL_PLANE_API_KEY,undefined);return {stdout:JSON.stringify({...value,private:'omit'})}}});
 assert.deepEqual(await tool[3](),value);assert.deepEqual(await tool[3](),value);assert.equal(count,1);
 const profile=createProfile({},{acceptance:tool});await profile.dispatch({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-11-25'}});await profile.dispatch({jsonrpc:'2.0',method:'notifications/initialized'});
 const list=await profile.dispatch({jsonrpc:'2.0',id:2,method:'tools/list'});assert.deepEqual(list.result.tools.map(t=>t.name),['vivim_tunnel_health','vivim_workstation_probe']);
 assert.equal((await profile.dispatch({jsonrpc:'2.0',id:3,method:'tools/call',params:{name:tool[0],arguments:{command:'not allowed'}}})).error.code,-32602);
});
test('changed grant or binary denied before launch',async t=>{
 const f=fixture(t);const tool=createAcceptance({directory:f.directory,execute:()=>assert.fail('must not run')});fs.writeFileSync(f.helper,'changed');await assert.rejects(tool[3]());fs.writeFileSync(f.file,JSON.stringify({...f.grant,id:'b'.repeat(32)}));await assert.rejects(tool[3]());
});
test('ambiguous child failure never launches again',async t=>{
 const f=fixture(t);let count=0;const tool=createAcceptance({directory:f.directory,execute:async()=>{count++;throw Error('lost')}});await assert.rejects(tool[3]());await assert.rejects(tool[3]());assert.equal(count,1);
});

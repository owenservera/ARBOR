'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const {createProfile}=require('../server/tunnel-readonly.cjs');
const request=(id,method,params)=>({jsonrpc:'2.0',id,method,params});
const notification={jsonrpc:'2.0',method:'notifications/initialized'};
async function ready(env={}) {
  const p=createProfile(env);
  const init=await p.dispatch(request(1,'initialize',{protocolVersion:'2025-11-25'}));
  assert.equal(init.result.protocolVersion,'2025-11-25');
  assert.equal(await p.dispatch(notification),null);
  return p;
}
const call=(p,name,args={})=>p.dispatch(request(3,'tools/call',{name,arguments:args}));
test('default surface exposes exactly one harmless tool',async()=>{
  const p=await ready();
  const list=await p.dispatch(request(2,'tools/list'));
  assert.deepEqual(list.result.tools.map(x=>x.name),['vivim_tunnel_health']);
  assert.equal(list.result.tools[0].annotations.readOnlyHint,true);
  const r=await call(p,'vivim_tunnel_health');
  assert.deepEqual(JSON.parse(r.result.content[0].text),{schema:'vivim.tunnel-health/1',status:'ready',profile:'private-readonly',hostDiscovery:false});
});
test('explicit opt-in exposes only existing Host discovery tools',async()=>{
  const p=await ready({VIVIM_TUNNEL_HOST_DISCOVERY:'1'});
  const list=await p.dispatch(request(2,'tools/list'));
  assert.deepEqual(list.result.tools.map(x=>x.name),['vivim_tunnel_health','vivim_host_sources','vivim_host_capabilities','vivim_host_targets','vivim_host_capability']);
  assert.ok(list.result.tools.every(x=>x.annotations.readOnlyHint&&!x.annotations.destructiveHint));
});
test('generic desktop, filesystem, private Wiki and execution never exposed',async()=>{
  for (const env of [{},{VIVIM_TUNNEL_HOST_DISCOVERY:'1'}]) {
    const p=await ready(env);
    for (const name of ['start_process','read_file','write_file','vivim_sitrep','vivim_wiki_source','vivim_host_execute','vivim_zcode_observe']) assert.equal((await call(p,name)).error.code,-32602);
  }
});
test('missing local Host credential fails without leaking detail',async()=>{
  const p=await ready({VIVIM_TUNNEL_HOST_DISCOVERY:'1'});
  const r=await call(p,'vivim_host_sources');
  assert.equal(r.result.isError,true);
  assert.equal(r.result.content[0].text,'Local discovery unavailable or denied');
});
test('untrusted arguments, null and inherited property names rejected',async()=>{
  const p=await ready({VIVIM_TUNNEL_HOST_DISCOVERY:'1'});
  for(const args of [null,[],{q:1},{q:'ok',cursor:42},{q:'ok',extra:'bad'},JSON.parse('{"q":"ok","__proto__":"bad"}')]) assert.equal((await call(p,'vivim_host_capabilities',args)).error.code,-32602);
  assert.equal((await call(p,'vivim_tunnel_health',{token:'not permitted'})).error.code,-32602);
});
test('initialization, notifications and reconnection are isolated',async()=>{
  const p=createProfile({});
  await p.dispatch(notification);
  assert.equal((await p.dispatch(request(2,'tools/list'))).error.code,-32002);
  await p.dispatch(request(1,'initialize',{protocolVersion:'unknown'}));
  assert.equal((await p.dispatch(request(2,'tools/list'))).error.code,-32002);
  await p.dispatch(notification);
  assert.ok((await p.dispatch(request(2,'tools/list'))).result);
  assert.equal((await p.dispatch(request(4,'initialize',{protocolVersion:'2025-11-25'}))).result.protocolVersion,'2025-11-25');
  assert.ok((await p.dispatch(request(5,'tools/list'))).result);
  assert.equal((await p.dispatch(request(6,'initialize',{}))).error.code,-32602);
  const fresh=createProfile({});
  assert.equal((await fresh.dispatch(request(2,'tools/list'))).error.code,-32002);
});
test('notifications cannot invoke tools; repeated reads have no effect',async()=>{
  const p=await ready();
  assert.equal(await p.dispatch({jsonrpc:'2.0',method:'tools/call',params:{name:'vivim_tunnel_health'}}),null);
  assert.deepEqual(await call(p,'vivim_tunnel_health'),await call(p,'vivim_tunnel_health'));
});
test('real stdio process handshake, malformed and oversized lines',()=>{
  const messages=[JSON.stringify(request(1,'initialize',{protocolVersion:'2025-11-25'})),JSON.stringify(notification),'not json',' '.repeat(65537),JSON.stringify(request(2,'tools/list')),JSON.stringify(request(3,'tools/call',{name:'vivim_tunnel_health'}))];
  const r=spawnSync(process.execPath,[path.join(__dirname,'../server/tunnel-readonly.cjs')],{input:messages.join('\n')+'\n',encoding:'utf8',env:{...process.env,VIVIM_TUNNEL_HOST_DISCOVERY:'0'},timeout:10000});
  assert.equal(r.status,0,r.stderr);
  const out=r.stdout.trim().split('\n').map(JSON.parse);
  assert.equal(out.length,5);
  assert.equal(out[1].error.code,-32700);
  assert.equal(out[2].error.code,-32600);
  assert.equal(out[3].result.tools.length,1);
  assert.equal(JSON.parse(out[4].result.content[0].text).status,'ready');
});

test('relay reuses the same stdio process for multiple initialize and health calls',()=>{
 const init=id=>request(id,'initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'relay-client',version:'1'}});
 const health=id=>request(id,'tools/call',{name:'vivim_tunnel_health',arguments:{}});
 const messages=[init(1),notification,request(2,'tools/list'),init(3),notification,health(4),init(5),health(6)];
 const r=spawnSync(process.execPath,[path.join(__dirname,'../server/tunnel-readonly.cjs')],{input:messages.map(x=>JSON.stringify(x)).join('\n')+'\n',encoding:'utf8',env:{...process.env,VIVIM_TUNNEL_HOST_DISCOVERY:'0'},timeout:10000});
 assert.equal(r.status,0,r.stderr);
 const out=r.stdout.trim().split('\n').map(JSON.parse);
 assert.equal(out.length,6);
 assert.ok(out.every(x=>x.result&&!x.error));
 for(const id of [4,6]) assert.equal(JSON.parse(out.find(x=>x.id===id).result.content[0].text).status,'ready');
});

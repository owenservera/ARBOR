'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createProfile}=require('../server/tunnel-readonly.cjs');
const name='vivim_workstation_probe',id='ctl-0123456789abcdef',digest='a'.repeat(64);
const env=()=>({VIVIM_TUNNEL_WORKSTATION_PROBE:'1',VIVIM_MCP_HOST_TOKEN:'x'.repeat(40),VIVIM_TUNNEL_PROBE_PLAN_ID:id,VIVIM_TUNNEL_PROBE_PLAN_DIGEST:digest});
const receipt={schema:'vivim.control-receipt/1',planId:id,planDigest:digest,actionId:'workstation.process.start',args:{recipe:'node-version'},approvedVia:'desktop-owner-token',status:'applied',executionPerformed:true,result:{schema:'vivim.workstation-process-result/1',recipe:'node-version',exitCode:0,version:'v24.22.1'}};
const plan={planId:id,actionId:receipt.actionId,args:receipt.args,risk:'R2',state:'planned',expiresAt:'2099-01-01T00:00:00.000Z'};
const req=(id,method,params)=>({jsonrpc:'2.0',id,method,params});
async function ready(e,fetcher){const p=createProfile(e,{fetcher});await p.dispatch(req(1,'initialize',{protocolVersion:'2025-11-25'}));await p.dispatch({jsonrpc:'2.0',method:'notifications/initialized'});return p;}
const call=(p,args={})=>p.dispatch(req(3,'tools/call',{name,arguments:args}));
const json=x=>new Response(JSON.stringify(x),{status:200});
test('missing opt-in or incomplete local binding exposes no probe',async()=>{
 for(const e of [{}, {VIVIM_TUNNEL_WORKSTATION_PROBE:'1'}, {...env(),VIVIM_TUNNEL_PROBE_PLAN_DIGEST:'bad'}]){
  const p=await ready(e,()=>assert.fail('unexpected request'));assert.equal((await call(p)).error.code,-32602);}
});
test('locally bound plan executes only exact fixed request and receipt is redacted; no second execution on replay',async()=>{
 const e=env();let posted=0,seen=[];
 const p=await ready(e,async(url,o)=>{
  seen.push([url,o.method]);assert.equal(o.headers.authorization,'Bearer '+e.VIVIM_MCP_HOST_TOKEN);
  assert.equal(o.redirect,'error');assert.equal(o.headers.origin,'http://127.0.0.1:43187');
  if(o.method==='GET'){assert.equal(url,'http://127.0.0.1:43187/api/host/control/plans/'+id);return json(posted?{...plan,state:'applied',receipt}:plan);}
  assert.equal(url,'http://127.0.0.1:43187/api/host/control/execute');assert.equal(o.headers['x-vivim-control'],'1');
  assert.deepEqual(JSON.parse(o.body),{planId:id,planDigest:digest});posted++;return json({...receipt,private:'omit'});
 });
 const list=(await p.dispatch(req(2,'tools/list'))).result.tools;
 assert.equal(list.length,2);assert.equal(list.find(t=>t.name===name).annotations.readOnlyHint,false);
 const a=await call(p);assert.deepEqual(JSON.parse(a.result.content[0].text),{schema:'vivim.tunnel-workstation-receipt/1',planId:id,actionId:receipt.actionId,status:'applied',recipe:'node-version',version:'v24.22.1',exitCode:0});
 assert.deepEqual(await call(p),a);assert.equal(posted,1);assert.equal(seen.length,3);
 assert.equal((await call(p,{planId:'other'})).error.code,-32602);
});
test('foreign, expired and uncertain plans are refused before POST',async()=>{
 for(const bad of [{...plan,actionId:'wiki.page.delete'},{...plan,state:'uncertain'},{...plan,expiresAt:'2000-01-01'},{...plan,args:{recipe:'other'}}]){
  const p=await ready(env(),async(_,o)=>{assert.equal(o.method,'GET');return json(bad);});assert.equal((await call(p)).result.isError,true);
 }
});
test('changed local grant after read refuses execution; invalid receipt never reports success',async()=>{
 const e=env();const p=await ready(e,async(_,o)=>{assert.equal(o.method,'GET');e.VIVIM_TUNNEL_WORKSTATION_PROBE='0';return json(plan);});assert.equal((await call(p)).result.isError,true);
 const q=await ready(env(),async(_,o)=>json(o.method==='GET'?plan:{...receipt,planDigest:'b'.repeat(64)}));assert.equal((await call(q)).result.isError,true);
});
test('ambiguous POST never retried inside one invocation',async()=>{
 let posts=0;const p=await ready(env(),async(_,o)=>{if(o.method==='GET')return json(plan);posts++;throw Error('socket lost');});
 const r=await call(p);assert.equal(r.result.isError,true);assert.equal(posts,1);
});

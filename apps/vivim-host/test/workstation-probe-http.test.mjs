import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHostServer} from '../server.mjs';

test('isolated real MCP stdio -> authenticated incumbent Host HTTP -> Rust child -> journal receipt',{skip:!process.env.VIVIM_WORKSTATION_PROBE_EXE,timeout:45000},async t=>{
 const root=mkdtempSync(path.join(os.tmpdir(),'vivim-probe-http-'));
 const token=randomBytes(32).toString('base64url');
 const server=createHostServer({dataRoot:root,ownerToken:token});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));try{rmSync(root,{recursive:true,force:true,maxRetries:5,retryDelay:200});}catch{}});
 const port=String(server.address().port),origin='http://127.0.0.1:'+port;
 const headers={authorization:'Bearer '+token,origin,'x-vivim-control':'1','content-type':'application/json'};
 const planBody={actionId:'workstation.process.start',args:{recipe:'node-version'}};
 const planUrl=origin+'/api/host/control/plan';
 assert.equal((await fetch(planUrl,{method:'POST',headers:{...headers,authorization:'Bearer invalid'},body:JSON.stringify(planBody)})).status,401);
 const p=await fetch(planUrl,{method:'POST',headers,body:JSON.stringify(planBody)});
 assert.equal(p.status,200);const plan=await p.json();assert.equal(plan.outcome,'approval_required');
 const script=fileURLToPath(new URL('../../../tools/mcp/vivim-arbor/server/tunnel-readonly.cjs',import.meta.url));
 const child=spawn(process.execPath,[script],{env:{...process.env,VIVIM_TUNNEL_HOST_DISCOVERY:'0',
  VIVIM_TUNNEL_WORKSTATION_PROBE:'1',VIVIM_HOST_PORT:port,VIVIM_MCP_HOST_TOKEN:token,
  VIVIM_TUNNEL_PROBE_PLAN_ID:plan.planId,VIVIM_TUNNEL_PROBE_PLAN_DIGEST:plan.planDigest},stdio:['pipe','pipe','pipe'],windowsHide:true});
 t.after(()=>{if(child.exitCode===null)child.kill()});
 const rpc=(id,method,params)=>({jsonrpc:'2.0',id,method,params});
 const frames=[rpc(1,'initialize',{protocolVersion:'2025-11-25'}),{jsonrpc:'2.0',method:'notifications/initialized'},
  rpc(2,'tools/list'),rpc(3,'tools/call',{name:'vivim_workstation_probe',arguments:{}}),
  rpc(4,'tools/call',{name:'vivim_workstation_probe',arguments:{}})];
 const stdout=[],stderr=[];
 child.stdout.on('data',b=>stdout.push(b));child.stderr.on('data',b=>stderr.push(b));
 const closed=new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve)});
 child.stdin.end(frames.map(x=>JSON.stringify(x)).join('\n')+'\n');
 assert.equal(await closed,0,'stdio MCP child failed');
 const out=Buffer.concat(stdout).toString().trim().split('\n').map(JSON.parse);
 assert.equal(out.length,4);
 assert.deepEqual(out[1].result.tools.map(x=>x.name),['vivim_tunnel_health','vivim_workstation_probe']);
 const receipt=JSON.parse(out[2].result.content[0].text);
 assert.equal(receipt.status,'applied');assert.equal(receipt.version,process.version);
 assert.equal(receipt.exitCode,0);assert.equal(receipt.planId,plan.planId);
 assert.deepEqual(out[3].result,out[2].result);
 const r=await fetch(origin+'/api/host/control/plans/'+plan.planId,{headers});
 assert.equal(r.status,200);const state=await r.json();assert.equal(state.state,'applied');
 assert.equal(state.receipt.planDigest,plan.planDigest);assert.equal(state.receipt.result.version,process.version);
 assert.ok(!JSON.stringify(out).includes(token));assert.ok(!Buffer.concat(stderr).toString().includes(token));
 console.log('MCP_HTTP_NATIVE_RECEIPT='+JSON.stringify(receipt));
});

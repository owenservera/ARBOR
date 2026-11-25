// Run one fixed acceptance command through the incumbent Host HTTP + journal.
// Isolated data root and ephemeral loopback port, no production worker/credentials.
import {randomBytes} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHostServer} from '../../../../apps/vivim-host/server.mjs';
import probe from './workstation-probe-tunnel.cjs';
const root=mkdtempSync(path.join(os.tmpdir(),'vivim-live-probe-'));
const token=randomBytes(32).toString('base64url');
let server;
try{
 server=createHostServer({dataRoot:root,ownerToken:token,autoPump:false});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const port=String(server.address().port),origin='http://127.0.0.1:'+port;
 const response=await fetch(origin+'/api/host/control/plan',{method:'POST',headers:{authorization:'Bearer '+token,origin,'x-vivim-control':'1','content-type':'application/json'},
   body:JSON.stringify({actionId:'workstation.process.start',args:{recipe:'node-version'}}),signal:AbortSignal.timeout(10000),redirect:'error'});
 if(!response.ok)throw Error('Host plan denied');
 const plan=await response.json();
 if(plan.outcome!=='approval_required')throw Error('Host plan not ready');
 const tool=probe.createProbe({env:{VIVIM_TUNNEL_WORKSTATION_PROBE:'1',VIVIM_HOST_PORT:port,VIVIM_MCP_HOST_TOKEN:token,VIVIM_TUNNEL_PROBE_PLAN_ID:plan.planId,VIVIM_TUNNEL_PROBE_PLAN_DIGEST:plan.planDigest}});
 if(!tool)throw Error('Probe not ready');
 const receipt=await tool[3]();
 const state=await fetch(origin+'/api/host/control/plans/'+plan.planId,{headers:{authorization:'Bearer '+token,origin},signal:AbortSignal.timeout(10000)});
 if(!state.ok||(await state.json()).state!=='applied')throw Error('Receipt readback failed');
 process.stdout.write(JSON.stringify(receipt)+'\n');
}catch{process.stderr.write('VIVIM_ACCEPTANCE_FAILED\n');process.exitCode=1;}
finally{
 if(server){server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));}
 try{rmSync(root,{recursive:true,force:true,maxRetries:2,retryDelay:100})}catch{}
}

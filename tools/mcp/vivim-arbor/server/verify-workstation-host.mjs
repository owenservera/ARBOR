// Local-only deployment readiness. Never prints the owner credential.
import {loadOwnerToken} from '../../../../apps/vivim-host/bootstrap/owner-auth.mjs';
import {studioDataDir} from '../../../../apps/vivim-host/server.mjs';
const root=studioDataDir(),token=loadOwnerToken({dataRoot:root,create:false}).token;
if(!token)throw Error('OWNER_AUTH_UNAVAILABLE');
const origin='http://127.0.0.1:43187',headers={authorization:'Bearer '+token,origin,'x-vivim-control':'1','content-type':'application/json'};
async function call(route,body){
 const r=await fetch(origin+'/api/host/control/'+route,{method:body?'POST':'GET',headers,...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(12000),redirect:'error'});
 if(!r.ok)throw Error('HOST_CONTROL_UNAVAILABLE_'+r.status);return r.json();
}
const catalog=await call('catalog');
const file=await call('plan',{actionId:'workstation.directory.list',args:{root_id:'scratch',path:'.'}});
if(file.outcome!=='done'||file.result?.configSha!==process.env.VIVIM_WORKSTATION_ROOTS_SHA256||file.result.rootId!=='scratch')throw Error('FILE_GRANT_UNAVAILABLE');
const plan=await call('plan',{actionId:'workstation.session.start',args:{recipe:'node-version'}});
if(plan.outcome!=='approval_required'||plan.workstationBinding?.configSha!==process.env.VIVIM_WORKSTATION_RECIPES_SHA256)throw Error('RECIPE_GRANT_UNAVAILABLE');
let terminalPlan=false;
if(process.env.VIVIM_WORKSTATION_TERMINAL_POLICY_SHA256){
 const args={request:'b64:'+Buffer.from(JSON.stringify({program:'node',args:['--version'],root_id:'scratch',cwd:'.',interactive:false,timeout_ms:10000})).toString('base64')};
 const p=await call('plan',{actionId:'workstation.session.terminal_start',args});
 if(p.outcome!=='approval_required'||p.workstationBinding?.schema!=='vivim.workstation-terminal-binding/1'||p.workstationBinding?.configSha!==process.env.VIVIM_WORKSTATION_TERMINAL_POLICY_SHA256)throw Error('TERMINAL_GRANT_UNAVAILABLE');
 terminalPlan=true;
}
process.stdout.write(JSON.stringify({schema:'vivim.workstation-host-readiness/1',catalogVersion:catalog.version,workstationActions:catalog.actions.filter(a=>a.actionId.startsWith('workstation.')).length,filesystem:true,processPlan:true,terminalPlan})+'\n');

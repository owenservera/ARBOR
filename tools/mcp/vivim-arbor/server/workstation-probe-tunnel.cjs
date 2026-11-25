'use strict';
// Narrow, locally provisioned bridge for one exact Host-approved fixed probe.
// The private tunnel is not itself the owner authority. No remote path, command,
// plan ID, digest or credential is accepted; the Host journal owns execution.
const name='vivim_workstation_probe';
const action='workstation.process.start',recipe='node-version';
function binding(env){
 const port=env.VIVIM_HOST_PORT||'43187',token=env.VIVIM_MCP_HOST_TOKEN,
   planId=env.VIVIM_TUNNEL_PROBE_PLAN_ID,planDigest=env.VIVIM_TUNNEL_PROBE_PLAN_DIGEST;
 if(env.VIVIM_TUNNEL_WORKSTATION_PROBE!=='1'||!(/^[1-9][0-9]{0,4}$/.test(port))||Number(port)>65535||
    typeof token!=='string'||token.length<32||/[\r\n]/.test(token)||
    typeof planId!=='string'||!/^ctl-[a-f0-9]{16}$/.test(planId)||
    typeof planDigest!=='string'||!(/^[a-f0-9]{64}$/.test(planDigest)))return null;
 return {port,token,planId,planDigest};
}
function createProbe({env=process.env,fetcher=globalThis.fetch}={}){
 const b=binding(env);if(!b)return null;
 const origin='http://127.0.0.1:'+b.port;
 const stillBound=()=>{const n=binding(env);if(!n||Object.keys(b).some(k=>b[k]!==n[k]))throw Error('Local binding changed');};
 async function request(route,body){
  stillBound();
  const response=await fetcher(origin+'/api/host/control/'+route,{
   method:body?'POST':'GET',
   headers:{authorization:'Bearer '+b.token,origin,accept:'application/json',
    ...(body?{'content-type':'application/json','x-vivim-control':'1'}:{})},
   ...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(20000)});
  if(!response.ok){await response.body?.cancel();throw Error('Host refused request');}
  const reader=response.body?.getReader();if(!reader)throw Error('Host response missing');
  const chunks=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
   if(size>16384)throw Error('Host response too large');chunks.push(Buffer.from(value));}}
  finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
  stillBound();
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));
 }
 function receipt(r){
  const v=r?.result;
  if(r?.schema!=='vivim.control-receipt/1'||r.planId!==b.planId||r.planDigest!==b.planDigest||
    r.actionId!==action||r.args?.recipe!==recipe||r.approvedVia!=='desktop-owner-token'||
    r.status!=='applied'||r.executionPerformed!==true||
    v?.schema!=='vivim.workstation-process-result/1'||v.recipe!==recipe||v.exitCode!==0||
    typeof v.version!=='string'||v.version.length>80||!/^v[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?$/.test(v.version))
   throw Error('No verified applied receipt');
  return {schema:'vivim.tunnel-workstation-receipt/1',planId:b.planId,actionId:action,status:'applied',
   recipe,version:v.version,exitCode:0};
 }
 async function invoke(){
  const p=await request('plans/'+b.planId);
  if(p?.planId!==b.planId||p.actionId!==action||p.risk!=='R2'||p.args?.recipe!==recipe||
     Object.keys(p.args).length!==1)throw Error('Plan binding invalid');
  if(p.state==='applied')return receipt(p.receipt);
  // No retry or reapproval of failed/uncertain/claimed effects. Only this exact
  // locally bound digest can be submitted, and Host checks it again before claim.
  if(p.state!=='planned'||!Number.isFinite(Date.parse(p.expiresAt))||Date.parse(p.expiresAt)<=Date.now())
   throw Error('Plan unavailable');
  return receipt(await request('execute',{planId:b.planId,planDigest:b.planDigest}));
 }
 return [name,'Execute only the locally pre-authorized exact Node-version probe plan via the incumbent Host; return its bounded receipt. No arbitrary command or new authorization.',
  {type:'object',properties:{},required:[],additionalProperties:false},invoke];
}
module.exports={createProbe,name};

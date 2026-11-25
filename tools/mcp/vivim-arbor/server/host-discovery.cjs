'use strict';
// Thin transport into ARBOR's existing owner-authenticated Host API. No effects.
const BASE='/api/host/control/';
const schema=(properties={},required=[])=>({type:'object',properties,required,additionalProperties:false});
const str={type:'string'};
function createDiscovery({env=process.env,fetcher=globalThis.fetch}={}){
 async function read(route,query,expected){
  const port=env.VIVIM_HOST_PORT||'43187';
  const token=env.VIVIM_MCP_HOST_TOKEN;
  if(!/^[1-9][0-9]{0,4}$/.test(port)||Number(port)>65535)throw Error('Invalid local Host port');
  if(typeof token!=='string'||token.length<32||/[\r\n]/.test(token))throw Error('Local Host credential not configured');
  const origin=`http://127.0.0.1:${port}`;
  const url=new URL(BASE+route,origin);
  for(const [key,value] of Object.entries(query))url.searchParams.set(key,value);
  let response;
  try{response=await fetcher(url,{method:'GET',headers:{authorization:'Bearer '+token,origin,accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(10000)});}catch{throw Error('Local Host unavailable');}
  if(!response.ok){await response.body?.cancel();throw Error(`Host rejected discovery (HTTP ${response.status})`);}
  const reader=response.body?.getReader(); if(!reader)throw Error('Host response missing');
  const chunks=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1024*1024)throw Error('Host discovery response too large');chunks.push(Buffer.from(value));}}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
  // Do not release a result fetched under a replaced local credential or endpoint.
  if(env.VIVIM_MCP_HOST_TOKEN!==token||(env.VIVIM_HOST_PORT||'43187')!==port)throw Error('Local Host binding changed');
  let data;try{data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));}catch{throw Error('Invalid Host JSON response');}
  if(data?.schema!==expected)throw Error('Unexpected Host discovery schema');
  return data;
 }
 const search=(kind,a)=>{
  const {q,cursor}=a;
  if(typeof q!=='string'||q.length>160|| (cursor!==undefined&&(typeof cursor!=='string'||!cursor.length||cursor.length>1024)))throw Error('Invalid search arguments');
  return read(kind==='actions'?'capabilities':'integration-targets/search',{q,limit:'25',...(cursor?{cursor}:{})},'vivim.discovery-page/1').then(data=>{if(data.kind!==kind||!Array.isArray(data.entries)||data.entries.length>25)throw Error('Unexpected Host page');return data;});
 };
 return [
 ['vivim_host_sources','Read authenticated live Host, Studio descriptor and research inventory coverage. Does not grant permissions.',schema(),()=>read('capability-sources',{},'vivim.capability-sources/1')],
 ['vivim_host_capabilities','Search existing Host capability catalog with a bounded page and optional opaque cursor. No action executes.',schema({q:str,cursor:str},['q']),a=>search('actions',a)],
 ['vivim_host_targets','Search the canonical research-only integration inventory, not a list of working adapters.',schema({q:str,cursor:str},['q']),a=>search('targets',a)],
 ['vivim_host_capability','Describe one exact Host action contract; authorization remains unevaluated.',schema({actionId:str},['actionId']),a=>{if(typeof a.actionId!=='string'||!(/^[a-z][a-z0-9._-]{2,95}$/).test(a.actionId))throw Error('Invalid action ID');const actionId=a.actionId;return read('capabilities/'+actionId,{},'vivim.capability-description/1').then(data=>{if(data.capability?.id!==actionId||data.source?.actionId!==actionId||data.authority!=='catalog-description-only'||data.authorization!=='not-evaluated')throw Error('Unexpected Host capability identity or authority');return data;});}]
 ];
}
module.exports=createDiscovery;

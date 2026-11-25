'use strict';
// Opt-in loopback MCP resource adapter. Never a public listener or token issuer.
const http=require('node:http');
const {authorizeHostDiscovery}=require('./remote-grant.cjs');
const {createProfile}=require('./tunnel-readonly.cjs');
const MAX=65536, VERSIONS=new Set(['2025-03-26','2025-06-18','2025-11-25']);
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const str=x=>typeof x==='string'&&/^[a-zA-Z0-9._-]{1,96}$/.test(x)?x:undefined;
const count=x=>Number.isSafeInteger(x)&&x>=0?x:undefined;
const projectEntry=e=>({id:str(e?.id),category:str(e?.category),risk:str(e?.risk),readiness:str(e?.readiness),tier:str(e?.tier),executable:typeof e?.executable==='boolean'?e.executable:undefined,available:typeof e?.available==='boolean'?e.available:undefined});
function project(data){
 if(data?.schema==='vivim.tunnel-health/1')return {schema:data.schema,status:'ready',profile:'private-readonly',hostDiscovery:data.hostDiscovery===true};
 if(data?.schema==='vivim.discovery-page/1'&&['actions','targets'].includes(data.kind)&&Array.isArray(data.entries)&&data.entries.length<=25)return {schema:data.schema,kind:data.kind,authority:data.kind==='actions'?'catalog-description-only':'research-only',total:count(data.total),entries:data.entries.map(projectEntry),nextCursor:typeof data.nextCursor==='string'&&data.nextCursor.length<=1024&&/^[A-Za-z0-9_.-]+$/.test(data.nextCursor)?data.nextCursor:null};
 if(data?.schema==='vivim.capability-description/1')return {schema:data.schema,authority:'catalog-description-only',capability:projectEntry(data.capability),authorization:'not-evaluated'};
 if(data?.schema==='vivim.capability-sources/1')return {schema:data.schema,authority:'discovery-only',host:{count:count(data.host?.count)},researchTargets:{count:count(data.researchTargets?.count)},studio:{count:count(data.studio?.count)},liveAcceptance:'not-established-by-source-coverage'};
 throw Error('Unexpected discovery result');
}
function createRemoteHttp({getPolicy=()=>null,env=process.env}={}){
 let active=0;
 const server=http.createServer({maxHeaderSize:24576,requestTimeout:15000,headersTimeout:5000,keepAliveTimeout:1000},async(req,res)=>{
  const send=(status,value,headers={})=>{if(res.destroyed||res.writableEnded)return;res.writeHead(status,{'cache-control':'no-store','x-content-type-options':'nosniff',...(value===undefined?{}:{'content-type':'application/json'}),...headers});res.end(value===undefined?undefined:JSON.stringify(value));};
  const reject=(status,message,headers={})=>{send(status,{error:message},{connection:'close',...headers});};
  if(req.socket.remoteAddress!=='127.0.0.1'||req.headers.host!=='127.0.0.1:'+server.address()?.port||req.headers.origin!==undefined)return reject(403,'Transport denied');
  if(req.url!=='/mcp')return reject(404,'Not found');
  const auth=()=>authorizeHostDiscovery(req.headers.authorization,getPolicy());
  try{auth();}catch{return reject(401,'Remote authorization denied',{'www-authenticate':'Bearer'});}
  if(req.method!=='POST')return reject(405,'Method not allowed',{allow:'POST'});
  if(req.headers['mcp-session-id']!==undefined)return reject(400,'Stateless transport');
  const version=req.headers['mcp-protocol-version'];
  if(version!==undefined&&!VERSIONS.has(version))return reject(400,'Unsupported protocol');
  if(!/^application\/json(?:\s*;.*)?$/i.test(req.headers['content-type']||'')||req.headers['content-encoding']!==undefined)return reject(415,'JSON required');
  if(!String(req.headers.accept||'').includes('application/json')||!String(req.headers.accept||'').includes('text/event-stream'))return reject(406,'MCP accept types required');
  if(Number(req.headers['content-length'])>MAX)return reject(413,'Request too large');
  if(active>=4)return reject(503,'Busy');
  active++;
  const timer=setTimeout(()=>{reject(408,'Request timeout');req.destroy();},15000);
  try{
   const chunks=[];let size=0;
   for await(const chunk of req){size+=chunk.length;if(size>MAX){reject(413,'Request too large');return;}chunks.push(chunk);}
   let m;try{m=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return send(400,{error:'Invalid JSON'});}
   if(!record(m)||m.jsonrpc!=='2.0'||typeof m.method!=='string')return send(400,{error:'Invalid request'});
   // No client session or shared initialization state. Fixed read-only profile per request.
   auth();
   const profile=createProfile(env);
   if(m.method!=='initialize'){
    await profile.dispatch({jsonrpc:'2.0',id:0,method:'initialize',params:{protocolVersion:version||'2025-03-26'}});
    await profile.dispatch({jsonrpc:'2.0',method:'notifications/initialized'});
   }
   const result=await profile.dispatch(m);
   // Recheck after upstream read: revoked or expired grants cannot release results.
   auth();
   if(result?.result?.content&&!result.result.isError){
    const original=JSON.parse(result.result.content[0].text);
    result.result.content=[{type:'text',text:JSON.stringify(project(original))}];
   }
   if(!result)return send(202);
   return send(200,result);
  }catch{return reject(403,'Request denied or unavailable');}
  finally{clearTimeout(timer);active--;}
 });
 server.maxConnections=16;
 return {server,listen:(port=0)=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>{server.removeListener('error',reject);resolve(server.address());});})};
}
module.exports={createRemoteHttp,project};

'use strict';
// Dedicated stdio profile for an authenticated private MCP tunnel.
// Never import operations.cjs or commander.cjs here.
const readline = require('node:readline');
const createDiscovery = require('./host-discovery.cjs');
const {createProbe,name:probeName}=require('./workstation-probe-tunnel.cjs');
const {createAcceptance}=require('./probe-acceptance.cjs');
const {createWorkstationTools}=require('./workstation-tunnel.cjs');
const {createMaintenanceGate,createAdmission}=require('./maintenance-gate.cjs');
const VERSIONS = ['2025-03-26', '2025-06-18', '2025-11-25'];
const HOST_NAMES = new Set(['vivim_host_sources', 'vivim_host_capabilities', 'vivim_host_targets', 'vivim_host_capability']);
const isRecord = x => x !== null && typeof x === 'object' && !Array.isArray(x);
function createProfile(env = process.env, {fetcher=globalThis.fetch,acceptance=null,workstation=[],maintenance=()=>null}={}) {
  const admission=createAdmission(maintenance);
  const probe=createProbe({env,fetcher})??acceptance;
  const tools = [
    ['vivim_tunnel_health', 'Read the private VIVIM transport profile health. No personal data or actions.',
      {type:'object',properties:{},required:[],additionalProperties:false},
      () => {const maintenanceState=admission.status();return {schema:'vivim.tunnel-health/1',status:maintenanceState?'maintenance':'ready',...(maintenanceState?{maintenance:maintenanceState}:{}),profile:workstation.length?'private-workstation':probe?'private-fixed-probe':'private-readonly',hostDiscovery:env.VIVIM_TUNNEL_HOST_DISCOVERY === '1',...(probe?{workstationProbe:true}:{}),...(workstation.length?{workstationTools:workstation.length}:{})};}]
  ];
  // Explicit opt-in by the local operator, not by remote tool arguments.
  if (env.VIVIM_TUNNEL_HOST_DISCOVERY === '1') {
    tools.push(...createDiscovery({env}).filter(([name]) => HOST_NAMES.has(name)));
  }
  if(probe)tools.push(probe);
  tools.push(...workstation);
  const map = new Map(tools.map(d => [d[0],d]));
  const annotations = {readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false};
  let initialized = false;
  let negotiated = false;
  const error = (id,code,message) => ({jsonrpc:'2.0',id,error:{code,message}});
  const reply = (id,result) => ({jsonrpc:'2.0',id,result});
  async function dispatch(m) {
    if (!isRecord(m) || m.jsonrpc !== '2.0' || typeof m.method !== 'string') return error(null,-32600,'Invalid request');
    const hasId = Object.hasOwn(m,'id');
    if (!hasId) {
      if (m.method === 'notifications/initialized' && negotiated) initialized = true;
      return null;
    }
    if (!(typeof m.id === 'string' || (typeof m.id === 'number' && Number.isSafeInteger(m.id)))) return error(null,-32600,'Invalid request ID');
    const id=m.id;
    if (m.method === 'initialize') {
      if (!isRecord(m.params) || typeof m.params.protocolVersion !== 'string' || !m.params.protocolVersion.length) return error(id,-32602,'Invalid initialization');
      // The secure relay can reuse a stdio child across logical MCP clients.
      // A repeated valid initialize is an idempotent negotiation, not a new grant.
      // Preserve readiness: the fixed read-only tool surface has no session-specific authority.
      negotiated = true;
      return reply(id,{protocolVersion:VERSIONS.includes(m.params.protocolVersion)?m.params.protocolVersion:VERSIONS.at(-1),capabilities:{tools:{listChanged:false}},serverInfo:{name:'vivim-arbor-private-tunnel',version:'0.2.0'}});
    }
    if (m.method === 'ping') return reply(id,{});
    if (!initialized) return error(id,-32002,'Server not initialized');
    if (m.method === 'tools/list') return reply(id,{tools:tools.map(([name,description,inputSchema,,readOnly])=>({name,description,inputSchema,annotations:name===probeName||readOnly===false?{...annotations,readOnlyHint:false,destructiveHint:true}:annotations}))});
    if (m.method !== 'tools/call') return error(id,-32601,'Method not found');
    const p=m.params;
    if (!isRecord(p) || typeof p.name !== 'string' || !map.has(p.name)) return error(id,-32602,'Unknown tool');
    const d=map.get(p.name), schema=d[2], args=Object.hasOwn(p,'arguments')?p.arguments:{};
    if (!isRecord(args) || Object.keys(args).some(k=>!Object.hasOwn(schema.properties,k)||typeof args[k]!=='string') ||
        schema.required.some(k=>!Object.hasOwn(args,k))) return error(id,-32602,'Invalid tool arguments');
    try {
      const result=p.name==='vivim_tunnel_health'?await d[3](args):await admission.run(p.name,()=>d[3](args));
      return reply(id,{content:[{type:'text',text:JSON.stringify(result)}]});
    } catch(e) {
      if(e?.message==='WORKSTATION_MAINTENANCE')return reply(id,{isError:true,content:[{type:'text',text:'VIVIM is draining for local maintenance; no new effect was admitted.'}]});
      // No underlying exception strings, URLs, credentials or stack traces.
      return reply(id,{isError:true,content:[{type:'text',text:p.name===probeName?'Exact probe unavailable or denied; inspect local Host receipt before retrying':p.name.startsWith('vivim_session_')||p.name.startsWith('vivim_file_')||p.name.startsWith('vivim_directory_')?'Local workstation request denied or outcome uncertain; use same request ID for receipt inspection, never automatically repeat effects':'Local discovery unavailable or denied'}]});
    }
  }
  return {dispatch};
}
async function main() {
  const healthOnly=process.env.VIVIM_TUNNEL_FORCE_HEALTH_ONLY==='1';
  const profile=createProfile(process.env,{acceptance:healthOnly?null:createAcceptance(),workstation:healthOnly?[]:createWorkstationTools(),maintenance:healthOnly?()=>null:createMaintenanceGate()});
  const input=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
  // Sequential dispatch prevents concurrent reads against the existing Host.
  for await (const line of input) {
    let response;
    try {
      if (Buffer.byteLength(line)>65536) response={jsonrpc:'2.0',id:null,error:{code:-32600,message:'Request too large'}};
      else {
        let m;
        try {m=JSON.parse(line);} catch {response={jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}};}
        if (!response) response=await profile.dispatch(m);
      }
    } catch {response={jsonrpc:'2.0',id:null,error:{code:-32603,message:'Internal error'}};}
    if (response) process.stdout.write(JSON.stringify(response)+'\n');
  }
}
if (require.main===module) main().catch(()=>{process.exitCode=1;});
module.exports={createProfile};

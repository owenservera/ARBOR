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
      async () => {
        const maintenanceState=admission.status();
        let workstationHealth;
        if(!maintenanceState&&typeof workstation.workstationHealth==='function'){
          try{workstationHealth=await workstation.workstationHealth();}
          catch{workstationHealth={grant:'unavailable',cDrive:'unchecked'};}
        }
        const degraded=workstationHealth&&(workstationHealth.grant!=='valid'||(workstationHealth.machineScope&&workstationHealth.cDrive!=='accessible'));
        return {schema:'vivim.tunnel-health/1',status:maintenanceState?'maintenance':degraded?'degraded':'ready',...(maintenanceState?{maintenance:maintenanceState}:{}),profile:workstation.length?'private-workstation':probe?'private-fixed-probe':'private-readonly',hostDiscovery:env.VIVIM_TUNNEL_HOST_DISCOVERY === '1',...(probe?{workstationProbe:true}:{}),...(workstation.length?{workstationTools:workstation.length}:{}),...(workstationHealth?{workstationHealth}:{})};
      }]
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
      return reply(id,{isError:true,content:[{type:'text',text:p.name===probeName?'Exact probe unavailable or denied; inspect local Host receipt before retrying':p.name.startsWith('vivim_terminal_')||p.name.startsWith('vivim_session_')||p.name.startsWith('vivim_file_')||p.name.startsWith('vivim_directory_')?'Local workstation request denied or outcome uncertain; use same request ID for receipt inspection, never automatically repeat effects':'Local discovery unavailable or denied'}]});
    }
  }
  return {dispatch};
}
async function main() {
  const healthOnly=process.env.VIVIM_TUNNEL_FORCE_HEALTH_ONLY==='1';
  const profile=createProfile(process.env,{acceptance:healthOnly?null:createAcceptance(),workstation:healthOnly?[]:createWorkstationTools(),maintenance:healthOnly?()=>null:createMaintenanceGate()});
  const input=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
  await serve(profile,input,line=>new Promise((resolve,reject)=>process.stdout.write(line,e=>e?reject(e):resolve())));
}
async function serve(profile,input,write) {
  // Concurrent observations, ordered mutations, separate cursor waits.
  const reads=new Set(),waits=new Set();
  const readNames=new Set(['vivim_file_read','vivim_development_file_read','vivim_file_inspect','vivim_file_read_many','vivim_file_search_selected','vivim_directory_list','vivim_session_status','vivim_session_output']);
  let writeTail=Promise.resolve();
  const emit=r=>{if(!r)return Promise.resolve();const job=writeTail.then(()=>write(JSON.stringify(r)+'\n'));writeTail=job;return job;};
  const failure=id=>({jsonrpc:'2.0',id:id??null,error:{code:-32603,message:'Internal error'}});
  function schedule(m,set){
    const task=Promise.resolve().then(()=>profile.dispatch(m)).catch(()=>failure(m.id)).then(emit);
    set.add(task);task.then(()=>set.delete(task),()=>set.delete(task));
  }
  for await(const line of input){
    let m;
    if(Buffer.byteLength(line)>65536){await emit({jsonrpc:'2.0',id:null,error:{code:-32600,message:'Request too large'}});continue;}
    try{m=JSON.parse(line);}catch{await emit({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}});continue;}
    const name=m?.method==='tools/call'?m.params?.name:null;
    if(name==='vivim_session_wait'){
      if(waits.size>=32){await emit({jsonrpc:'2.0',id:m.id??null,error:{code:-32000,message:'Wait capacity reached'}});continue;}
      schedule(m,waits);continue;
    }
    if(readNames.has(name)){
      while(reads.size>=16)await Promise.race(reads);
      schedule(m,reads);continue;
    }
    await Promise.all(reads);
    await emit(await Promise.resolve().then(()=>profile.dispatch(m)).catch(()=>failure(m?.id)));
  }
  await Promise.all([...reads,...waits]);await writeTail;
}
if (require.main===module) main().catch(()=>{process.exitCode=1;});
module.exports={createProfile,serve};

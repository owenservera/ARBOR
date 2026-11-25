'use strict';
// Private tunnel projection of the existing Host. Local grant is authoritative
// for its exact recipe/root subset. The adapter never exports an owner token,
// accepts a shell command/absolute path, or creates an independent executor.
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const hash=b=>createHash('sha256').update(b).digest('hex');
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const digest=x=>hash(JSON.stringify(stable(x)));
const hex=(s,n)=>typeof s==='string'&&s.length===n&&/^[a-f0-9]+$/.test(s);
const ctl=s=>typeof s==='string'&&/^ctl-[a-f0-9]{16}$/.test(s);
const identifier=s=>typeof s==='string'&&/^[a-z][a-z0-9-]{0,63}$/.test(s);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const keys=(x,a)=>obj(x)&&Object.keys(x).every(k=>a.includes(k));
const bad=()=>{throw Error('Workstation request denied or outcome uncertain')};
// Bounded disk quota, not an authorization decision. Never delete replay claims to make room.
const MAX_LEDGER_CLAIMS=8192;
const same=(a,b)=>digest(a)===digest(b);
const S='workstation.session.',F='workstation.file.',D='workstation.directory.';
const TERMINAL=S+'terminal_start';
const definitions=[
 ['vivim_terminal_start',TERMINAL,['request_json'],true],
 ['vivim_session_start',S+'start',['recipe'],true],
 ['vivim_session_status',S+'status',['session_id'],false],
 ['vivim_session_output',S+'output',['session_id','stdout_cursor','stderr_cursor'],false],
 ['vivim_session_cancel',S+'cancel',['session_id'],true],
 ['vivim_session_input',S+'input',['session_id','input'],true],
 ['vivim_file_read',F+'read',['root_id','path'],false],
 ['vivim_development_file_read','workstation.development.file.read',['root_id','path'],false],
 ['vivim_file_inspect',F+'inspect',['root_id','path'],false],
 ['vivim_file_read_many','workstation.files.read',['root_id','path','paths_json'],false],
 ['vivim_file_search_selected','workstation.files.search_selected',['root_id','path','paths_json','literal'],false],
 ['vivim_directory_list',D+'list',['root_id','path'],false],
 ['vivim_directory_create',D+'create',['root_id','path'],true],
 ['vivim_file_write',F+'write',['root_id','path','expected_digest','content'],true],
 ['vivim_file_edit',F+'edit',['root_id','path','expected_digest','old_text','new_text'],true]
];
function privateBytes(file,max){
 const st=fs.lstatSync(file);
 if(!st.isFile()||st.isSymbolicLink()||st.size>max||(process.platform!=='win32'&&(st.mode&0o077)))bad();
 return fs.readFileSync(file);
}
function createWorkstationTools({directory=path.join(__dirname,'..','session-authority'),now=Date.now,fetcher=globalThis.fetch,credential=null}={}){
 let g,initial;
 function load(){
  const raw=privateBytes(path.join(directory,'grant.json'),16384),v=JSON.parse(raw);
  if(!keys(v,['schema','id','expiresAt','port','dataRoot','ownerAuthModule','ownerAuthSha256','recipeConfigSha','rootConfigSha','recipes','roots','interactiveRecipes','allowWrites','terminal','machineScope'])||
   v.schema!=='vivim.workstation-tunnel-grant/1'||!hex(v.id,32)||!Number.isSafeInteger(v.expiresAt)||
   v.expiresAt<=now()||v.expiresAt-now()>86400000||!Number.isSafeInteger(v.port)||v.port<1024||v.port>65535||
   typeof v.dataRoot!=='string'||!path.isAbsolute(v.dataRoot)||typeof v.ownerAuthModule!=='string'||!path.isAbsolute(v.ownerAuthModule)||
   path.basename(v.ownerAuthModule)!=='owner-auth.mjs'||!hex(v.ownerAuthSha256,64)||!hex(v.recipeConfigSha,64)||!hex(v.rootConfigSha,64)||
   !Array.isArray(v.recipes)||v.recipes.length>32||!v.recipes.every(identifier)||
   !Array.isArray(v.roots)||v.roots.length>16||!v.roots.every(identifier)||
   !Array.isArray(v.interactiveRecipes)||!v.interactiveRecipes.every(x=>v.recipes.includes(x))||typeof v.allowWrites!=='boolean')bad();
  if(v.terminal!==undefined&&(!keys(v.terminal,['configSha','programs','roots','allowInteractive'])||!hex(v.terminal.configSha,64)||!Array.isArray(v.terminal.programs)||v.terminal.programs.length<1||v.terminal.programs.length>64||!v.terminal.programs.every(p=>typeof p==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(p))||!Array.isArray(v.terminal.roots)||!v.terminal.roots.length||!v.terminal.roots.every(r=>v.roots.includes(r))||typeof v.terminal.allowInteractive!=='boolean'))bad();
  if(v.machineScope!==undefined&&(v.machineScope!==true||!v.terminal))bad();
  return {v,h:hash(raw)};
 }
 try{({v:g,h:initial}=load())}catch{return []}
 function check(){if(load().h!==initial)bad();}
 async function token(){
  check();if(credential)return credential();
  const real=fs.realpathSync(g.ownerAuthModule);if(real!==g.ownerAuthModule||hash(fs.readFileSync(real))!==g.ownerAuthSha256)bad();
  const mod=await import(pathToFileURL(real).href);
  // Use incumbent private owner-token loader, never create or copy a token here.
  const env={};if(process.platform==='win32'&&process.env.SystemRoot)env.SystemRoot=process.env.SystemRoot;
  const loaded=mod.loadOwnerToken({dataRoot:g.dataRoot,env,create:false});
  if(typeof loaded.token!=='string'||loaded.token.length<32)bad();return loaded.token;
 }
 async function request(route,body,timeoutMs=30000){
  const bearer=await token();check();const origin='http://127.0.0.1:'+g.port;
  const r=await fetcher(origin+'/api/host/control/'+route,{method:body?'POST':'GET',
   headers:{authorization:'Bearer '+bearer,origin,accept:'application/json',...(body?{'content-type':'application/json','x-vivim-control':'1'}:{})},
   ...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(timeoutMs)});
  if(!r.ok){await r.body?.cancel();bad();}
  const reader=r.body?.getReader();if(!reader)bad();let size=0;const chunks=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>524288)bad();chunks.push(Buffer.from(value));}}
  finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
  check();return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));
 }
 const state=path.join(directory,'ledger-'+g.id);
 try{fs.mkdirSync(state,{mode:0o700});}catch(e){if(e.code!=='EEXIST')return [];}
 try{const st=fs.lstatSync(state);if(!st.isDirectory()||st.isSymbolicLink())return [];}catch{return [];}
 const file=(id,suffix)=>path.join(state,id+'.'+suffix+'.json');
 function read(id,suffix){return JSON.parse(privateBytes(file(id,suffix),65536));}
 function create(id,suffix,value){fs.writeFileSync(file(id,suffix),JSON.stringify(value)+'\n',{flag:'wx',mode:0o600});}
 function owns(sessionId){
  if(!ctl(sessionId))bad();const s=read(sessionId,'session');
  if(s.grant!==initial||s.sessionId!==sessionId||(s.mode==='terminal'?!g.terminal:!g.recipes.includes(s.recipe)))bad();
  return s;
 }
 function terminalRequest(args){
  if(!g.terminal||!keys(args,['request'])||typeof args.request!=='string'||!args.request.startsWith('b64:')||args.request.length>8000)bad();
  const bytes=Buffer.from(args.request.slice(4),'base64');
  if(bytes.toString('base64')!==args.request.slice(4))bad();
  const v=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  if(!keys(v,['program','args','root_id','cwd','interactive','timeout_ms'])||Object.keys(v).length!==6||
    !(v.root_id==='machine'?g.machineScope===true&&typeof v.program==='string'&&v.program.length<=1024&&typeof v.cwd==='string'&&/^[a-z]:[\\/]/i.test(v.cwd):g.terminal.programs.includes(v.program)&&g.terminal.roots.includes(v.root_id))||typeof v.interactive!=='boolean'||
    (v.interactive&&!g.terminal.allowInteractive)||!Array.isArray(v.args)||!v.args.every(a=>typeof a==='string')||
    typeof v.cwd!=='string'||!Number.isSafeInteger(v.timeout_ms))bad();
  return v;
 }
 function authorize(action,args,mutating){
  check();
  if(action===TERMINAL){terminalRequest(args);}
  else if(action===S+'start'){if(!g.recipes.includes(args.recipe))bad();}
  else if(action.startsWith(S)){
   const s=owns(args.session_id);
   if(action===S+'input'&&(!(s.mode==='terminal'?g.terminal.allowInteractive&&s.interactive:g.interactiveRecipes.includes(s.recipe))||typeof args.input!=='string'||args.input.length>5468))bad();
  }else{
   if(typeof args.path!=='string'||args.path.length>1024||
    !(args.root_id==='machine'?g.machineScope===true&&/^[a-z]:[\\/]/i.test(args.path):g.roots.includes(args.root_id)&&!args.path.startsWith('/')&&!args.path.includes('\\')&&!args.path.includes(':'))||
    (mutating&&!g.allowWrites))bad();
  }
 }
 function projection(r,p,action,args){
  if(r?.schema!=='vivim.control-receipt/1'||r.planId!==p.planId||r.planDigest!==p.planDigest||
   r.actionId!==action||!same(r.args,args)||r.approvedVia!=='desktop-owner-token'||!['applied','failed','uncertain'].includes(r.status))bad();
  if(r.status==='applied'&&(!r.executionPerformed||!obj(r.result)))bad();
  if(r.status==='applied'&&(action===S+'start'||action===TERMINAL)){
   if(r.result.sessionId!==r.planId)bad();
   const ownership=action===TERMINAL?{grant:initial,sessionId:r.planId,mode:'terminal',interactive:terminalRequest(args).interactive}:{grant:initial,sessionId:r.planId,recipe:args.recipe};
   try{create(r.planId,'session',ownership)}catch(e){if(e.code!=='EEXIST'||!same(read(r.planId,'session'),ownership))bad();}
  }
  return {schema:'vivim.workstation-tunnel-receipt/1',planId:r.planId,actionId:action,status:r.status,
   ...(r.status==='applied'?{result:r.result}:{code:'HOST_EFFECT_NOT_APPLIED'})};
 }
 async function mutation(action,args,requestId){
  if(!hex(requestId,32))throw Error('WORKSTATION_REQUEST_ID_INVALID: expected exactly 32 lowercase hexadecimal characters; rejected before submission');
  authorize(action,args,true);const intent={grant:initial,action,argsDigest:digest(args)};
  let existing=false;
  try{if(!fs.existsSync(file(requestId,'claim'))&&fs.readdirSync(state).filter(n=>n.endsWith('.claim.json')).length>=MAX_LEDGER_CLAIMS)throw Error('WORKSTATION_LEDGER_CAPACITY: request not submitted; local operator must renew the grant or resolve capacity');create(requestId,'claim',intent);}
  catch(e){if(e.code!=='EEXIST')throw e;existing=true;if(!same(read(requestId,'claim'),intent))bad();}
  if(existing){
   // Never resubmit an effect after an ambiguous delivery. Only read Host truth.
   const p=read(requestId,'plan'),status=await request('plans/'+p.planId);
   if(!status?.receipt)bad();return projection(status.receipt,p,action,args);
  }
  const p=await request('plan',{actionId:action,args});
  if(p?.outcome!=='approval_required'||p.actionId!==action||p.risk!=='R2'||!same(p.args,args)||!ctl(p.planId)||!hex(p.planDigest,64))bad();
  if(action===S+'start'&&p.workstationBinding?.configSha!==g.recipeConfigSha)bad();
  if(action===TERMINAL&&(p.workstationBinding?.schema!=='vivim.workstation-terminal-binding/1'||p.workstationBinding?.configSha!==g.terminal.configSha))bad();
  if(!action.startsWith(S)&&p.workstationBinding?.configSha!==g.rootConfigSha)bad();
  const binding={planId:p.planId,planDigest:p.planDigest};
  create(requestId,'plan',binding);
  authorize(action,args,true);
  // Exact locally admitted request. The incumbent Host still enforces plan
  // digest, fresh desktop-owner approval, preclaim and one-shot receipt.
  const r=await request('execute',binding);return projection(r,binding,action,args);
 }
 async function readAction(action,args,timeoutMs=30000){
  authorize(action,args,false);const p=await request('plan',{actionId:action,args},timeoutMs);
  if(p?.outcome!=='done'||p.actionId!==action||!same(p.args,args)||p.effect!=='read'||!obj(p.result))bad();
  if(action.startsWith(S)){if((action===S+'output'?p.result.status?.sessionId:p.result.sessionId)!==args.session_id)bad();}
  else if(p.result.schema!=='vivim.workstation-file-read/1'||p.result.rootId!==args.root_id||p.result.path!==args.path||p.result.configSha!==g.rootConfigSha)bad();
  authorize(action,args,false);return p.result;
 }
 // Bounded cursor-driven wait. No new Host effects or unsolicited client turns.
 let activeWaits=0;
 async function waitOutput(a){
  const {session_id,stdout_cursor,stderr_cursor,wait_ms}=a;
  const cursor=x=>typeof x==='string'&&/^(0|[1-9][0-9]{0,15})$/.test(x)&&Number.isSafeInteger(Number(x));
  if(!cursor(stdout_cursor)||!cursor(stderr_cursor)||typeof wait_ms!=='string'||!/^[0-9]{1,5}$/.test(wait_ms)||Number(wait_ms)<250||Number(wait_ms)>20000)bad();
  owns(session_id);check();
  if(activeWaits>=4)throw Error('WORKSTATION_WAIT_BUSY');
  activeWaits++;
  const started=performance.now(),deadline=started+Number(wait_ms);
  try{
   while(true){
    const remaining=Math.max(1,Math.ceil(deadline-performance.now()));
    const out=await readAction(S+'output',{session_id,stdout_cursor,stderr_cursor},remaining);
    const channels=[out.stdout,out.stderr];
    if(channels.some(c=>!obj(c)||!Number.isSafeInteger(c.next)))bad();
    const changed=channels.some((c,i)=>c.next!==Number(i?stderr_cursor:stdout_cursor)||c.gap||c.readFailed);
    const terminal=out.status.state!=='running'&&out.status.state!=='starting';
    if(changed||terminal||performance.now()>=deadline){
     check();return {schema:'vivim.workstation-session-wait/1',reason:changed?'output':terminal?'terminal':'timeout',elapsed_ms:Math.round(performance.now()-started),...out};
    }
    await new Promise(resolve=>setTimeout(resolve,Math.min(250,Math.max(1,deadline-performance.now()))));
    check();
    if(performance.now()>=deadline)return {schema:'vivim.workstation-session-wait/1',reason:'timeout',elapsed_ms:Math.round(performance.now()-started),...out};
   }
  }finally{activeWaits--;}
 }
 const tools=[['vivim_workstation_recipes','List currently locally granted recipe IDs and workspace IDs; no executable paths or credentials.',
  {type:'object',properties:{},required:[],additionalProperties:false},()=>{check();return {schema:'vivim.workstation-tunnel-grant-summary/1',recipes:g.recipes,roots:g.roots,interactiveRecipes:g.interactiveRecipes,allowWrites:g.allowWrites,expiresAt:g.expiresAt,...(g.machineScope===true?{machineScope:true}:{}),...(g.terminal?{terminal:{programs:g.terminal.programs,roots:g.terminal.roots,allowInteractive:g.terminal.allowInteractive}}:{})};},true]];
 for(const [name,action,fields,mutating]of definitions){
  if(action===TERMINAL&&!g.terminal)continue;
  if(action===S+'start'&&!g.recipes.length)continue;
  if(action.startsWith(S)&&!g.recipes.length&&!g.terminal)continue;
  if(action===S+'input'&&!g.interactiveRecipes.length&&!g.terminal?.allowInteractive)continue;
  if(!action.startsWith(S)&&(!g.roots.length||(mutating&&!g.allowWrites)))continue;
  const required=mutating?[...fields,'request_id']:fields;
  tools.push([name,(action==='workstation.development.file.read'?'Development only: read source with project-scoped Meta-VLANG coding context. Use for coding tasks, not generic file reads. ':action===TERMINAL?(g.machineScope===true?'Owner-machine mode: root_id machine accepts absolute local cwd and resolved executable path/name; OS permissions apply. ':'')+'Start an explicitly locally authorized terminal session. request_json is JSON with program (granted ID), args (string array), root_id (granted root), cwd (relative path or .), interactive (boolean), timeout_ms (integer 100–1800000). Limit 5997 UTF-8 bytes; never include credentials. ':'Use only the locally granted Host '+action+' capability. ')+(mutating?'Supply a unique 32-character lowercase hexadecimal request_id; repeat only the same ID to inspect an uncertain receipt.':'Read-only, scoped to granted workspace or owned session.'),
   {type:'object',properties:Object.fromEntries(required.map(k=>[k,{type:'string'}])),required,additionalProperties:false},
   a=>{if(action===TERMINAL){const v=a.request_json;if(typeof v!=='string'||Buffer.byteLength(v)>5997)bad();return mutation(action,{request:'b64:'+Buffer.from(v,'utf8').toString('base64')},a.request_id);}const args=Object.fromEntries(fields.map(k=>{if(['content','old_text','new_text','input','literal'].includes(k)){const v=a[k];if(typeof v!=='string'||v.includes('\0')||Buffer.byteLength(v)>(k==='input'?4096:k==='literal'?160:5997))bad();return [k,'b64:'+Buffer.from(v,'utf8').toString('base64')];}return [k,a[k]];}));return mutating?mutation(action,args,a.request_id):readAction(action,args);},!mutating]);
 }
 if(g.recipes.length||g.terminal){
  const required=['session_id','stdout_cursor','stderr_cursor','wait_ms'];
  tools.push(['vivim_session_wait','Wait 250–20000 ms for output, cursor gap, read failure or terminal state from an owned session. Resume with returned next cursors. Read-only; does not subscribe to unsolicited chat events.',{type:'object',properties:Object.fromEntries(required.map(k=>[k,{type:'string'}])),required,additionalProperties:false},waitOutput,true]);
 }
 return tools;
}
module.exports={createWorkstationTools};

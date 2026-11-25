'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createWorkstationTools}=require('../server/workstation-tunnel.cjs');
const planId='ctl-0123456789abcdef',planDigest='a'.repeat(64),recipeConfigSha='b'.repeat(64),rootConfigSha='c'.repeat(64);
const action='workstation.session.start',args={recipe:'node-version'};
const json=x=>new Response(JSON.stringify(x),{status:200});
function fixture(t){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'vivim-workstation-tunnel-'));
 t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
 const g={schema:'vivim.workstation-tunnel-grant/1',id:'a'.repeat(32),expiresAt:Date.now()+600000,port:43187,dataRoot:directory,ownerAuthModule:path.join(directory,'owner-auth.mjs'),ownerAuthSha256:'d'.repeat(64),recipeConfigSha,rootConfigSha,recipes:['node-version'],roots:['repo'],interactiveRecipes:[],allowWrites:true};
 const file=path.join(directory,'grant.json');fs.writeFileSync(file,JSON.stringify(g),{mode:0o600});
 return {directory,g,file};
}
test('default closed, expired grant rejected',t=>{const f=fixture(t);assert.equal(createWorkstationTools({directory:f.directory,now:()=>f.g.expiresAt+1}).length,0);fs.unlinkSync(f.file);assert.equal(createWorkstationTools({directory:f.directory}).length,0)});
test('fixed recipe uses exact Host plan, one execution, durable session ownership and receipt replay',async t=>{
 const f=fixture(t);let posts=0;
 const receipt={schema:'vivim.control-receipt/1',planId,planDigest,actionId:action,args,approvedVia:'desktop-owner-token',status:'applied',executionPerformed:true,result:{sessionId:planId,state:'running'}};
 const tools=createWorkstationTools({directory:f.directory,credential:async()=> 'test-only-token',fetcher:async(url,o)=>{
  assert.equal(o.headers.authorization,'Bearer test-only-token');assert.equal(o.redirect,'error');
  if(url.endsWith('/execute')){posts++;assert.deepEqual(JSON.parse(o.body),{planId,planDigest});return json(receipt);}
  if(url.endsWith('/plans/'+planId))return json({receipt});
  const b=JSON.parse(o.body);
  if(b.actionId===action){assert.deepEqual(b.args,args);return json({outcome:'approval_required',risk:'R2',actionId:action,args,planId,planDigest,workstationBinding:{configSha:recipeConfigSha}});}
  assert.equal(b.actionId,'workstation.session.status');return json({outcome:'done',actionId:b.actionId,args:b.args,effect:'read',result:{sessionId:planId,state:'running'}});
 }});
 const call=(name,a)=>tools.find(x=>x[0]===name)[3](a);
 assert.ok(!tools.some(x=>x[0]==='vivim_session_input'));
 await assert.rejects(call('vivim_session_start',{recipe:'not-allowed',request_id:'e'.repeat(32)}));
 await assert.rejects(call('vivim_session_status',{session_id:planId}));
 const a=await call('vivim_session_start',{recipe:'node-version',request_id:'f'.repeat(32)});assert.equal(a.status,'applied');
 assert.deepEqual(await call('vivim_session_start',{recipe:'node-version',request_id:'f'.repeat(32)}),a);assert.equal(posts,1);
 assert.equal((await call('vivim_session_status',{session_id:planId})).state,'running');
 fs.unlinkSync(f.file);await assert.rejects(call('vivim_session_status',{session_id:planId}));
});
test('foreign binding or root is refused before execute; ambiguous request is not resubmitted',async t=>{
 const f=fixture(t);let requests=0;
 const tools=createWorkstationTools({directory:f.directory,credential:async()=> 'test-only-token',fetcher:async(_,o)=>{requests++;const b=JSON.parse(o.body);return json({outcome:'approval_required',risk:'R2',actionId:b.actionId,args:b.args,planId,planDigest,workstationBinding:{configSha:'e'.repeat(64)}})}});
 const call=(name,a)=>tools.find(x=>x[0]===name)[3](a);
 await assert.rejects(call('vivim_file_read',{root_id:'unknown',path:'x'}));assert.equal(requests,0);
 await assert.rejects(call('vivim_session_start',{recipe:'node-version',request_id:'f'.repeat(32)}));assert.equal(requests,1);
 await assert.rejects(call('vivim_session_start',{recipe:'node-version',request_id:'f'.repeat(32)}));assert.equal(requests,1);
});

test('batch reads and literal search use same scoped read authority',async t=>{
 const f=fixture(t);let calls=0;
 const tools=createWorkstationTools({directory:f.directory,credential:async()=> 'test-only-token',fetcher:async(url,o)=>{
  calls++;assert.ok(url.endsWith('/plan'));const b=JSON.parse(o.body);
  assert.equal(b.args.root_id,'repo');assert.equal(b.args.path,'.');assert.equal(b.args.paths_json,'["a.txt"]');
  if(b.actionId==='workstation.files.search_selected')assert.equal(b.args.literal,'b64:bmVlZGxl');
  return json({outcome:'done',actionId:b.actionId,args:b.args,effect:'read',result:{schema:'vivim.workstation-file-read/1',rootId:'repo',path:'.',configSha:rootConfigSha}});
 }});
 const call=(name,a)=>tools.find(x=>x[0]===name)[3](a);
 const args={root_id:'repo',path:'.',paths_json:'["a.txt"]'};
 await call('vivim_file_read_many',args);
 await call('vivim_file_search_selected',{...args,literal:'needle'});
 await assert.rejects(call('vivim_file_read_many',{...args,root_id:'foreign'}));assert.equal(calls,2);
});

test('general terminal is not exposed by a legacy recipe grant',t=>{
 const f=fixture(t);
 assert.ok(!createWorkstationTools({directory:f.directory}).some(x=>x[0]==='vivim_terminal_start'));
});
test('terminal projection requires matching local policy, preserves argv, and owns only applied sessions',async t=>{
 const f=fixture(t),configSha='e'.repeat(64),terminalAction='workstation.session.terminal_start';
 f.g.terminal={configSha,programs:['node'],roots:['repo'],allowInteractive:true};
 fs.writeFileSync(f.file,JSON.stringify(f.g));
 const req={program:'node',args:['--version',' a ','🧪',''],root_id:'repo',cwd:'.',interactive:true,timeout_ms:1000};
 const encoded={request:'b64:'+Buffer.from(JSON.stringify(req)).toString('base64')};
 let calls=0,executions=0,readCalls=0;
 const receipt={schema:'vivim.control-receipt/1',planId,planDigest,actionId:terminalAction,args:encoded,approvedVia:'desktop-owner-token',status:'applied',executionPerformed:true,result:{sessionId:planId,state:'running'}};
 const opts={directory:f.directory,credential:async()=> 'test-only-token',fetcher:async(url,o)=>{
  calls++;
  if(url.endsWith('/execute')){executions++;return json(receipt);}
  if(url.endsWith('/plans/'+planId))return json({receipt});
  const b=JSON.parse(o.body);
  if(b.actionId===terminalAction){assert.deepEqual(b.args,encoded);return json({outcome:'approval_required',risk:'R2',actionId:b.actionId,args:b.args,planId,planDigest,workstationBinding:{schema:'vivim.workstation-terminal-binding/1',configSha}});}
  readCalls++;return json({outcome:'done',actionId:b.actionId,args:b.args,effect:'read',result:{sessionId:planId,state:'running'}});
 }};
 const tools=createWorkstationTools(opts),call=(name,a)=>tools.find(x=>x[0]===name)[3](a);
 assert.ok(tools.some(x=>x[0]==='vivim_session_input'));
 await assert.rejects(call('vivim_terminal_start',{request_json:JSON.stringify({...req,program:'foreign'}),request_id:'1'.repeat(32)}));
 assert.equal(calls,0);
 await assert.rejects(call('vivim_session_status',{session_id:planId}));
 const args={request_json:JSON.stringify(req),request_id:'2'.repeat(32)};
 assert.equal((await call('vivim_terminal_start',args)).status,'applied');
 const restarted=createWorkstationTools(opts);
 assert.equal((await restarted.find(x=>x[0]==='vivim_terminal_start')[3](args)).status,'applied');
 assert.equal(executions,1);
 assert.equal((await restarted.find(x=>x[0]==='vivim_session_status')[3]({session_id:planId})).state,'running');
 assert.equal(readCalls,1);
 fs.unlinkSync(f.file);await assert.rejects(call('vivim_session_status',{session_id:planId}));
});
test('terminal plan with mismatched policy hash is never executed',async t=>{
 const f=fixture(t);f.g.terminal={configSha:'e'.repeat(64),programs:['node'],roots:['repo'],allowInteractive:false};fs.writeFileSync(f.file,JSON.stringify(f.g));
 let calls=0;
 const tools=createWorkstationTools({directory:f.directory,credential:async()=> 'test-only-token',fetcher:async(url,o)=>{
  calls++;assert.ok(url.endsWith('/plan'));const b=JSON.parse(o.body);
  return json({outcome:'approval_required',risk:'R2',actionId:b.actionId,args:b.args,planId,planDigest,workstationBinding:{schema:'vivim.workstation-terminal-binding/1',configSha:'f'.repeat(64)}});
 }});
 const call=tools.find(x=>x[0]==='vivim_terminal_start')[3],a={request_json:JSON.stringify({program:'node',args:['--version'],root_id:'repo',cwd:'.',interactive:false,timeout_ms:1000}),request_id:'3'.repeat(32)};
 await assert.rejects(call(a));await assert.rejects(call(a));assert.equal(calls,1);
});

test('explicit machine scope reaches the same Host plan; legacy refuses absolute paths and executables',async t=>{
 const f=fixture(t),configSha='e'.repeat(64);
 f.g.terminal={configSha,programs:['node'],roots:['repo'],allowInteractive:true};
 fs.writeFileSync(f.file,JSON.stringify(f.g));
 let plans=0,execs=0,last;
 const opts={directory:f.directory,credential:async()=> 'test-only-token',fetcher:async(url,o)=>{
  if(url.endsWith('/execute')){execs++;return json({schema:'vivim.control-receipt/1',planId,planDigest,actionId:last.actionId,args:last.args,approvedVia:'desktop-owner-token',status:'applied',executionPerformed:true,result:{sessionId:planId,state:'running'}})}
  plans++;last=JSON.parse(o.body);
  if(last.actionId==='workstation.file.read')return json({outcome:'done',actionId:last.actionId,args:last.args,effect:'read',result:{schema:'vivim.workstation-file-read/1',rootId:'machine',path:last.args.path,configSha:rootConfigSha,text:'fixture'}});
  return json({outcome:'approval_required',risk:'R2',actionId:last.actionId,args:last.args,planId,planDigest,workstationBinding:{schema:'vivim.workstation-terminal-binding/1',configSha}});
 }};
 const term={request_json:JSON.stringify({program:'D:\\tools\\fixture.exe',root_id:'machine',cwd:'C:\\work',args:['--version'],interactive:false,timeout_ms:1000}),request_id:'9'.repeat(32)};
 const file={root_id:'machine',path:'D:\\work\\fixture.txt'};
 const call=(tools,name,a)=>tools.find(x=>x[0]===name)[3](a);
 const legacy=createWorkstationTools(opts);
 await assert.rejects(call(legacy,'vivim_terminal_start',term));await assert.rejects(call(legacy,'vivim_file_read',file));assert.equal(plans,0);
 f.g.machineScope=true;fs.writeFileSync(f.file,JSON.stringify(f.g));
 const machine=createWorkstationTools(opts);
 assert.equal((await call(machine,'vivim_workstation_recipes',{})).machineScope,true);
 assert.equal((await call(machine,'vivim_file_read',file)).text,'fixture');
 assert.equal((await call(machine,'vivim_terminal_start',term)).status,'applied');assert.equal(execs,1);
 assert.deepEqual(JSON.parse(Buffer.from(last.args.request.slice(4),'base64').toString('utf8')),JSON.parse(term.request_json));
 fs.unlinkSync(f.file);await assert.rejects(call(machine,'vivim_file_read',file));
});

// Malformed request IDs are local validation failures, never uncertain effects.
test('invalid request ID reports pre-submission failure and never contacts Host',async t=>{
 const f=fixture(t);let calls=0;
 const tools=createWorkstationTools({directory:f.directory,credential:async()=> 'test-only-token',fetcher:async()=>{calls++;throw Error('unexpected Host request');}});
 const start=tools.find(x=>x[0]==='vivim_session_start')[3];
 for(const request_id of ['a'.repeat(31),'a'.repeat(33),'A'.repeat(32),'g'.repeat(32)]){
  await assert.rejects(start({recipe:'node-version',request_id}),/WORKSTATION_REQUEST_ID_INVALID.*rejected before submission/);
 }
 assert.equal(calls,0);
});

test('development ledger admits new work after 256 claims and preserves prior receipt replay',async t=>{
 const f=fixture(t);let posts=0;
 const receipt={schema:'vivim.control-receipt/1',planId,planDigest,actionId:action,args,approvedVia:'desktop-owner-token',status:'applied',executionPerformed:true,result:{sessionId:planId,state:'running'}};
 const tools=createWorkstationTools({directory:f.directory,credential:async()=> 'test-only-token',fetcher:async(url,o)=>{
  if(url.endsWith('/execute')){posts++;return json(receipt);}
  if(url.endsWith('/plans/'+planId))return json({receipt});
  return json({outcome:'approval_required',risk:'R2',actionId:action,args,planId,planDigest,workstationBinding:{configSha:recipeConfigSha}});
 }});
 const start=tools.find(x=>x[0]==='vivim_session_start')[3];
 const first='f'.repeat(32);
 const a=await start({recipe:'node-version',request_id:first});
 const ledger=path.join(f.directory,'ledger-'+f.g.id);
 for(let i=0;i<255;i++)fs.writeFileSync(path.join(ledger,i.toString(16).padStart(32,'0')+'.claim.json'),'{}',{flag:'wx',mode:0o600});
 assert.equal(fs.readdirSync(ledger).filter(n=>n.endsWith('.claim.json')).length,256);
 assert.deepEqual(await start({recipe:'node-version',request_id:first}),a);
 assert.equal(posts,1);
 const b=await start({recipe:'node-version',request_id:'e'.repeat(32)});
 assert.equal(b.status,'applied');assert.equal(posts,2);
 assert.equal(fs.readdirSync(ledger).filter(n=>n.endsWith('.claim.json')).length,257);
 assert.deepEqual(await start({recipe:'node-version',request_id:'e'.repeat(32)}),b);assert.equal(posts,2);
});

test('session wait reports new cursor, quiet timeout, terminal and rejects foreign sessions',async t=>{
 const f=fixture(t);let reads=0,mode='output';
 const channel=(cursor,next)=>({requested:Number(cursor),next,closed:false,gap:false,readFailed:false});
 const tools=createWorkstationTools({directory:f.directory,credential:async()=> 'test-only-token',fetcher:async(_,o)=>{
  const b=JSON.parse(o.body);reads++;
  assert.equal(b.actionId,'workstation.session.output');
  const next=mode==='output'&&reads>1?5:Number(b.args.stdout_cursor);
  return json({outcome:'done',actionId:b.actionId,args:b.args,effect:'read',result:{status:{sessionId:planId,state:mode==='terminal'?'exited':'running'},stdout:channel(b.args.stdout_cursor,next),stderr:channel(b.args.stderr_cursor,0)}});
 }});
 const wait=tools.find(x=>x[0]==='vivim_session_wait')[3];
 const a={session_id:planId,stdout_cursor:'0',stderr_cursor:'0',wait_ms:'1000'};
 await assert.rejects(wait(a));assert.equal(reads,0);
 const ledger=path.join(f.directory,'ledger-'+f.g.id);
 fs.writeFileSync(path.join(ledger,planId+'.session.json'),JSON.stringify({grant:require('node:crypto').createHash('sha256').update(fs.readFileSync(f.file)).digest('hex'),sessionId:planId,recipe:'node-version'}),{mode:0o600});
 const first=await wait(a);assert.equal(first.reason,'output');assert.equal(first.stdout.next,5);
 mode='quiet';const quiet=await wait({...a,stdout_cursor:'5',wait_ms:'250'});assert.equal(quiet.reason,'timeout');assert.equal(quiet.stdout.next,5);
 mode='terminal';assert.equal((await wait({...a,stdout_cursor:'5'})).reason,'terminal');
 fs.unlinkSync(f.file);await assert.rejects(wait(a));
});

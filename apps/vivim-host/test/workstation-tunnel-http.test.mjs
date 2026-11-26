import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync,readFileSync,copyFileSync,realpathSync} from 'node:fs';
import path from 'node:path';import os from 'node:os';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHostServer} from '../server.mjs';
import {loadOwnerToken} from '../bootstrap/owner-auth.mjs';
const hash=f=>createHash('sha256').update(readFileSync(f)).digest('hex');
const rid=()=>randomBytes(16).toString('hex');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
test('real MCP stdio, protected owner auth, Host HTTP, native session reconnect and live file operations',
 {skip:!process.env.VIVIM_WORKSTATION_SESSION_EXE||!process.env.VIVIM_WORKSTATION_FILES_EXE,timeout:150000},async t=>{
 const root=mkdtempSync(path.join(os.tmpdir(),'vivim-full-mcp-')),data=path.join(root,'data'),workspace=path.join(root,'workspace'),
 profile=path.join(root,'profile'),serverDir=path.join(profile,'server'),grantDir=path.join(profile,'session-authority');
 mkdirSync(workspace);mkdirSync(serverDir,{recursive:true});mkdirSync(grantDir);
 const authModule=realpathSync(fileURLToPath(new URL('../bootstrap/owner-auth.mjs',import.meta.url)));
 const token=loadOwnerToken({dataRoot:data,create:true,env:process.platform==='win32'?{SystemRoot:process.env.SystemRoot}:{} }).token;
 const recipes=path.join(root,'recipes.json'),roots=path.join(root,'roots.json');
 writeFileSync(recipes,JSON.stringify({schema:'vivim.workstation-recipes/1',recipes:[{id:'node-version',executable:process.execPath,executableSha256:hash(process.execPath),workspace,args:['--version'],environment:process.platform==='win32'?['SystemRoot']:[],interactive:false,timeoutMs:15000}]}));
 writeFileSync(roots,JSON.stringify({schema:'vivim.workstation-roots/1',roots:[{id:'repo',path:workspace}]}));
 const config={VIVIM_WORKSTATION_RECIPES:recipes,VIVIM_WORKSTATION_RECIPES_SHA256:hash(recipes),
  VIVIM_WORKSTATION_SESSION_SHA256:hash(process.env.VIVIM_WORKSTATION_SESSION_EXE),
  VIVIM_WORKSTATION_ROOTS:roots,VIVIM_WORKSTATION_ROOTS_SHA256:hash(roots),
  VIVIM_WORKSTATION_FILES_SHA256:hash(process.env.VIVIM_WORKSTATION_FILES_EXE)};
 const sdk=process.env.VIVIM_TEST_PROTOCOL_EXE;
 const actualSource=process.env.VIVIM_TEST_PROTOCOL_SOURCE;
 if(sdk){
  const binding=path.join(root,'development-binding.json');
  writeFileSync(binding,JSON.stringify({schema:'vivim.coding-context-binding/1',sdkPath:realpathSync(sdk),sdkSha256:hash(sdk),sdkSource:process.env.VIVIM_TEST_PROTOCOL_SOURCE_SHA||'2773e22044c5f5d44023b04e29e1103ac058fdee',projects:[{id:'sdk-test',root:workspace,instructions:['Use the existing Meta-VLANG grammar. Preserve code behavior and test changes.']}]}));
  config.VIVIM_META_VLANG_CONFIG=binding;config.VIVIM_META_VLANG_CONFIG_SHA256=hash(binding);
 }
 const before=Object.fromEntries(Object.keys(config).map(k=>[k,process.env[k]]));Object.assign(process.env,config);
 const server=createHostServer({dataRoot:data,ownerToken:token,autoPump:false});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));for(const[k,v]of Object.entries(before))if(v===undefined)delete process.env[k];else process.env[k]=v;try{rmSync(root,{recursive:true,force:true,maxRetries:3,retryDelay:200})}catch{}});
 const source=fileURLToPath(new URL('../../../tools/mcp/vivim-arbor/server/',import.meta.url));
 for(const name of ['tunnel-readonly.cjs','host-discovery.cjs','workstation-probe-tunnel.cjs','probe-acceptance.cjs','workstation-tunnel.cjs','maintenance-gate.cjs'])copyFileSync(path.join(source,name),path.join(serverDir,name));
 const grant={schema:'vivim.workstation-tunnel-grant/1',id:rid(),expiresAt:Date.now()+600000,port:server.address().port,dataRoot:data,ownerAuthModule:authModule,ownerAuthSha256:hash(authModule),recipeConfigSha:hash(recipes),rootConfigSha:hash(roots),recipes:['node-version'],roots:['repo'],interactiveRecipes:[],allowWrites:true};
 writeFileSync(path.join(grantDir,'grant.json'),JSON.stringify(grant),{mode:0o600});
 async function calls(requests){
  const env={};for(const k of ['SystemRoot','WINDIR','PATH','TEMP','TMP','USERPROFILE','LOCALAPPDATA','APPDATA','HOME'])if(process.env[k])env[k]=process.env[k];
  const c=spawn(process.execPath,[path.join(serverDir,'tunnel-readonly.cjs')],{env,stdio:['pipe','pipe','pipe'],windowsHide:true});
  const output=[],errors=[];c.stdout.on('data',b=>output.push(b));c.stderr.on('data',b=>errors.push(b));
  const done=new Promise((resolve,reject)=>{c.once('error',reject);c.once('close',resolve)});
  const frames=[{jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-11-25'}},{jsonrpc:'2.0',method:'notifications/initialized'},
   {jsonrpc:'2.0',id:2,method:'tools/list'},...requests.map(([name,args],i)=>({jsonrpc:'2.0',id:i+3,method:'tools/call',params:{name,arguments:args}}))];
  c.stdin.end(frames.map(x=>JSON.stringify(x)).join('\n')+'\n');
  assert.equal(await done,0,'MCP child failed');
  const raw=Buffer.concat(output).toString();assert.ok(!raw.includes(token));assert.ok(!Buffer.concat(errors).toString().includes(token));
  const responses=raw.trim().split('\n').map(JSON.parse);
  assert.ok(responses[1].result.tools.some(x=>x.name==='vivim_session_start'));
  return responses.slice(2).sort((a,b)=>a.id-b.id).map(r=>{assert.equal(r.result?.isError,undefined,r.result?.content?.[0]?.text);return JSON.parse(r.result.content[0].text)});
 }
 const requestId=rid(),[start]=await calls([['vivim_session_start',{recipe:'node-version',request_id:requestId}]]);
 assert.equal(start.status,'applied');
 await sleep(300);
 const [replayed,output,created,written,readback]=await calls([
  ['vivim_session_start',{recipe:'node-version',request_id:requestId}],
  ['vivim_session_output',{session_id:start.planId,stdout_cursor:'0',stderr_cursor:'0'}],
  ['vivim_directory_create',{root_id:'repo',path:'src',request_id:rid()}],
  ['vivim_file_write',{root_id:'repo',path:'src/test.txt',expected_digest:'absent',content:'hello',request_id:rid()}],
  ['vivim_file_read',{root_id:'repo',path:'src/test.txt'}]
 ]);
 assert.deepEqual(replayed,start);assert.equal(output.status.exitCode,0);assert.equal(output.stdout.text.trim(),process.version);
 assert.equal(created.status,'applied');assert.equal(written.status,'applied');assert.equal(readback.text,'hello');
 const [edited,final]=await calls([['vivim_file_edit',{root_id:'repo',path:'src/test.txt',expected_digest:readback.digest,old_text:'hello',new_text:'VIVIM',request_id:rid()}],['vivim_file_read',{root_id:'repo',path:'src/test.txt'}]]);
 assert.equal(edited.status,'applied');assert.equal(final.text,'VIVIM');
 if(sdk){
  const text=actualSource?readFileSync(actualSource,'utf8'):'//! @hq:context Test source\nfn main() {}\n';
  writeFileSync(path.join(workspace,'src','sdk.rs'),text);
  const args={root_id:'repo',path:'src/sdk.rs'};
  const [ordinary,development]=await calls([['vivim_file_read',args],['vivim_development_file_read',args]]);
  assert.equal(ordinary.text,text);assert.equal(ordinary.codingContext,undefined);
  assert.equal(development.text,ordinary.text);assert.equal(development.digest,ordinary.digest);
  const c=development.codingContext;assert.equal(c.status,'compiled',JSON.stringify(c));
  assert.equal(c.semantic.sourceDigest,ordinary.digest);
  assert.equal(c.policy.authority,'locally-pinned-project-policy');
  assert.ok(c.semantic.declarations.some(d=>d.tag==='context'&&d.assurance==='source-assertion'));
  assert.equal(c.semantic.language.availableTags.length,18);
  assert.equal(c.semantic.language.definitions.find(d=>d.id==='annotation.context').meaning,'Purpose and semantic orientation');
  console.log('DEVELOPMENT_MCP_PROOF='+JSON.stringify({sourceDigest:c.sourceDigest,actualSource:Boolean(actualSource),policy:c.policy,semantic:c.semantic,genericUnchanged:true}));
 }
 console.log('MCP_WORKSTATION_RECEIPTS='+JSON.stringify({session:start.planId,version:output.stdout.text.trim(),edit:edited.planId,readback:true,reconnected:true}));
});

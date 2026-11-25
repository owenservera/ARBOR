'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createWorkstationTools}=require('../server/workstation-tunnel.cjs');
test('development is an explicit tool; ordinary read remains unchanged',async t=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'vivim-dev-read-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
 const sha='a'.repeat(64),g={schema:'vivim.workstation-tunnel-grant/1',id:'b'.repeat(32),expiresAt:Date.now()+60000,port:43187,dataRoot:directory,ownerAuthModule:path.join(directory,'owner-auth.mjs'),ownerAuthSha256:sha,recipeConfigSha:sha,rootConfigSha:sha,recipes:[],roots:['repo'],interactiveRecipes:[],allowWrites:false};
 fs.writeFileSync(path.join(directory,'grant.json'),JSON.stringify(g),{mode:0o600});
 const actions=[];
 const tools=createWorkstationTools({directory,credential:async()=> 'test-only',fetcher:async(_,o)=>{
  const b=JSON.parse(o.body);actions.push(b.actionId);
  return new Response(JSON.stringify({outcome:'done',actionId:b.actionId,args:b.args,effect:'read',result:{schema:'vivim.workstation-file-read/1',rootId:'repo',path:b.args.path,configSha:sha,text:'source',digest:sha,...(b.actionId==='workstation.development.file.read'?{codingContext:{schema:'vivim.coding-context/1',status:'compiled'}}:{})}}));
 }});
 const args={root_id:'repo',path:'src/lib.rs'},call=(n)=>tools.find(x=>x[0]===n)[3](args);
 assert.equal((await call('vivim_file_read')).codingContext,undefined);
 assert.equal((await call('vivim_development_file_read')).codingContext.status,'compiled');
 assert.deepEqual(actions,['workstation.file.read','workstation.development.file.read']);
});

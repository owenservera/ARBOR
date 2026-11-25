'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {generateKeyPairSync,sign}=require('node:crypto');
const fs=require('node:fs'), os=require('node:os'), path=require('node:path'), http=require('node:http');
const {createConfiguredRemoteHttp}=require('../server/remote-policy.cjs');
const keys=generateKeyPairSync('rsa',{modulusLength:2048});
const policy={enabled:true,issuer:'https://issuer.fixture.invalid/',audience:'https://resource.fixture.invalid/mcp',subject:'owner',keyId:'key',publicKeyPem:keys.publicKey.export({type:'spki',format:'pem'})};
const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
function grant(){const now=Math.floor(Date.now()/1000),a=enc({alg:'RS256',kid:'key',typ:'at+jwt'}),b=enc({iss:policy.issuer,aud:policy.audience,sub:policy.subject,scope:'vivim:host:read',iat:now-1,exp:now+60});return 'Bearer '+a+'.'+b+'.'+sign('RSA-SHA256',Buffer.from(a+'.'+b),keys.privateKey).toString('base64url');}
async function fixture(fn,env={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vivim-configured-')),file=path.join(dir,'policy.json');
 const write=p=>{const next=file+'.new';fs.writeFileSync(next,JSON.stringify(p));fs.renameSync(next,file);};
 const {server,listen}=createConfiguredRemoteHttp({env:{...env,VIVIM_MCP_HTTP_POLICY_FILE:file}});
 const address=await listen();const token=grant();
 const call=(name)=>fetch('http://127.0.0.1:'+address.port+'/mcp',{method:'POST',headers:{authorization:token,'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name}})});
 try{await fn({write,file,call});}finally{server.closeAllConnections();await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
}
test('configured server requires absolute operator policy file',()=>assert.throws(()=>createConfiguredRemoteHttp({env:{}}),/Absolute local policy path required/));
test('same grant denied, admitted, disabled, restored and removed without restart',()=>fixture(async({write,file,call})=>{
 assert.equal((await call('vivim_tunnel_health')).status,401);
 write(policy);let r=await call('vivim_tunnel_health');assert.equal(r.status,200);assert.equal(JSON.parse((await r.json()).result.content[0].text).status,'ready');
 write({...policy,enabled:false});assert.equal((await call('vivim_tunnel_health')).status,401);
 write(policy);assert.equal((await call('vivim_tunnel_health')).status,200);
 write({...policy,subject:'different-owner'});assert.equal((await call('vivim_tunnel_health')).status,401);
 fs.unlinkSync(file);assert.equal((await call('vivim_tunnel_health')).status,401);
}));
test('revocation during upstream response prevents disclosure',async()=>{
 const local='x'.repeat(48);
 let onRequest,release;
 const arrived=new Promise(r=>onRequest=r),gate=new Promise(r=>release=r);
 const upstream=http.createServer(async(req,res)=>{onRequest();await gate;res.setHeader('content-type','application/json');res.end(JSON.stringify({schema:'vivim.capability-sources/1',host:{count:123456}}));});
 await new Promise(r=>upstream.listen(0,'127.0.0.1',r));
 try{await fixture(async({write,call})=>{
  write(policy);
  const pending=call('vivim_host_sources');
  let timer;
  try{await Promise.race([arrived,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('Upstream not reached')),3000))]);write({...policy,enabled:false});}finally{clearTimeout(timer);release();}
  const response=await pending;assert.equal(response.status,403);assert.ok(!(await response.text()).includes('123456'));
 },{VIVIM_TUNNEL_HOST_DISCOVERY:'1',VIVIM_HOST_PORT:String(upstream.address().port),VIVIM_MCP_HOST_TOKEN:local});}finally{release();upstream.closeAllConnections();await new Promise(r=>upstream.close(r));}
});

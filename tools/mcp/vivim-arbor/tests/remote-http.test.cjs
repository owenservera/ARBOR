'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {generateKeyPairSync,sign}=require('node:crypto');
const http=require('node:http');
const {createRemoteHttp,project}=require('../server/remote-http.cjs');
const keys=generateKeyPairSync('rsa',{modulusLength:2048});
const base={enabled:true,issuer:'https://issuer.fixture.invalid/',audience:'https://resource.fixture.invalid/mcp',subject:'owner',keyId:'key',publicKeyPem:keys.publicKey.export({type:'spki',format:'pem'})};
const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
function token(overrides={}){const now=Math.floor(Date.now()/1000),a=enc({alg:'RS256',kid:'key',typ:'at+jwt'}),b=enc({iss:base.issuer,aud:base.audience,sub:base.subject,scope:'vivim:host:read',iat:now-1,exp:now+60,...overrides});return 'Bearer '+a+'.'+b+'.'+sign('RSA-SHA256',Buffer.from(a+'.'+b),keys.privateKey).toString('base64url');}
const rpc=(method,params={})=>({jsonrpc:'2.0',id:1,method,params});
async function fixture(fn,env={}){
 let policy=base;
 const {server,listen}=createRemoteHttp({getPolicy:()=>policy,env});
 const a=await listen();const url='http://127.0.0.1:'+a.port+'/mcp';
 const call=(body,headers={},method='POST')=>fetch(url,{method,headers:{authorization:token(),'content-type':'application/json',accept:'application/json, text/event-stream',...headers},...(method==='POST'?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});
 try{await fn(call,p=>{policy=p;},url);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
}
test('stateless HTTP negotiation, notifications, health-only and no operations',()=>fixture(async call=>{
 let r=await call(rpc('initialize',{protocolVersion:'2025-11-25'}));assert.equal(r.status,200);assert.equal((await r.json()).result.protocolVersion,'2025-11-25');
 r=await call({jsonrpc:'2.0',method:'notifications/initialized'});assert.equal(r.status,202);
 r=await call(rpc('tools/list'));assert.deepEqual((await r.json()).result.tools.map(x=>x.name),['vivim_tunnel_health']);
 r=await call(rpc('tools/call',{name:'vivim_tunnel_health'}));assert.equal(JSON.parse((await r.json()).result.content[0].text).status,'ready');
 r=await call(rpc('tools/call',{name:'vivim_execute'}));assert.equal((await r.json()).error.code,-32602);
}));
test('deny missing, wrong subject, expiry and dynamic revocation on every request',()=>fixture(async(call,set)=>{
 for(const t of ['',token({sub:'other'}),token({exp:1})])assert.equal((await call(rpc('tools/list'),{authorization:t})).status,401);
 const t=token();assert.equal((await call(rpc('tools/list'),{authorization:t})).status,200);set({...base,enabled:false});assert.equal((await call(rpc('tools/list'),{authorization:t})).status,401);
}));
test('deny origin, method, protocol, content type, session, oversized or bad JSON',()=>fixture(async call=>{
 for(const [h,status] of [[{origin:'https://evil.invalid'},403],[{'mcp-session-id':'x'},400],[{'mcp-protocol-version':'unknown'},400],[{'content-type':'text/plain'},415],[{accept:'application/json'},406]])assert.equal((await call(rpc('tools/list'),h)).status,status);
 assert.equal((await call(null,{},'GET')).status,405);
 assert.equal((await call('x'.repeat(65537))).status,413);
 assert.equal((await call('{')).status,400);
}));
test('actual loopback Host read uses separate local auth and projects response',async()=>{
 const local='z'.repeat(48);let hits=0;
 const host=http.createServer((req,res)=>{hits++;assert.equal(req.method,'GET');assert.equal(req.headers.authorization,'Bearer '+local);res.setHeader('content-type','application/json');res.end(JSON.stringify({schema:'vivim.capability-sources/1',host:{count:7,privatePath:'C:/secret'},secret:local}));});
 await new Promise(r=>host.listen(0,'127.0.0.1',r));
 try{await fixture(async call=>{
  let r=await call(rpc('tools/list'));assert.equal((await r.json()).result.tools.length,5);
  r=await call(rpc('tools/call',{name:'vivim_host_sources'}),{authorization:token({scope:'other'})});assert.equal(r.status,401);assert.equal(hits,0);
  r=await call(rpc('tools/call',{name:'vivim_host_sources'}));const output=JSON.parse((await r.json()).result.content[0].text);assert.equal(output.host.count,7);assert.equal(hits,1);assert.ok(!JSON.stringify(output).includes(local));assert.ok(!JSON.stringify(output).includes('secret'));
 },{VIVIM_TUNNEL_HOST_DISCOVERY:'1',VIVIM_HOST_PORT:String(host.address().port),VIVIM_MCP_HOST_TOKEN:local});}
 finally{host.closeAllConnections();await new Promise(r=>host.close(r));}
});
test('projection never copies arbitrary title, args, invocation or credentials',()=>{
 const p=project({schema:'vivim.capability-description/1',capability:{id:'test.read',title:'private',args:{token:'secret'},available:true},invocation:{path:'/execute'}});
 assert.deepEqual(JSON.parse(JSON.stringify(p)),{schema:'vivim.capability-description/1',authority:'catalog-description-only',capability:{id:'test.read',available:true},authorization:'not-evaluated'});
});

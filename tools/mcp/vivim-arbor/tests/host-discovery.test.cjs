'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const http=require('node:http');const create=require('../server/host-discovery.cjs');
const TOKEN='t'.repeat(48);
const find=(defs,name)=>defs.find(x=>x[0]===name)[3];
test('live loopback HTTP contract: all four reads, auth and paging',async()=>{
 const requests=[];const s=http.createServer((req,res)=>{requests.push({method:req.method,url:req.url,auth:req.headers.authorization});const route=new URL(req.url,'http://localhost');let data;if(route.pathname.endsWith('capability-sources'))data={schema:'vivim.capability-sources/1',authority:'discovery-only'};else if(route.pathname.endsWith('/capabilities/test.read'))data={schema:'vivim.capability-description/1',authority:'catalog-description-only',capability:{id:'test.read'},source:{actionId:'test.read'},authorization:'not-evaluated'};else data={schema:'vivim.discovery-page/1',kind:route.pathname.endsWith('capabilities')?'actions':'targets',entries:[],nextCursor:null};res.setHeader('content-type','application/json');res.end(JSON.stringify(data));});
 await new Promise(r=>s.listen(0,'127.0.0.1',r));try{const defs=create({env:{VIVIM_HOST_PORT:String(s.address().port),VIVIM_MCP_HOST_TOKEN:TOKEN}});await find(defs,'vivim_host_sources')({});await find(defs,'vivim_host_capabilities')({q:'AI & chat',cursor:'opaque'});await find(defs,'vivim_host_targets')({q:'Claude'});await find(defs,'vivim_host_capability')({actionId:'test.read'});assert.equal(requests.length,4);assert.ok(requests.every(r=>r.method==='GET'&&r.auth==='Bearer '+TOKEN));assert.equal(new URL(requests[1].url,'http://localhost').searchParams.get('q'),'AI & chat');}finally{await new Promise(r=>s.close(r));}});
test('missing credential and invalid port never call transport',async()=>{for(const env of [{},{VIVIM_HOST_PORT:'123/evil',VIVIM_MCP_HOST_TOKEN:TOKEN}]){const defs=create({env,fetcher:()=>assert.fail('network invoked')});await assert.rejects(find(defs,'vivim_host_sources')({}));}});
test('rejects action traversal and oversized queries',async()=>{const defs=create({env:{VIVIM_MCP_HOST_TOKEN:TOKEN},fetcher:()=>assert.fail('network invoked')});assert.throws(()=>find(defs,'vivim_host_capability')({actionId:'../../execute'}));assert.throws(()=>find(defs,'vivim_host_capabilities')({q:'x'.repeat(161)}));});
test('auth rejection does not leak response or token; redirects forbidden',async()=>{const defs=create({env:{VIVIM_MCP_HOST_TOKEN:TOKEN},fetcher:async(url,opts)=>{assert.equal(opts.redirect,'error');return new Response(TOKEN,{status:401})}});await assert.rejects(find(defs,'vivim_host_sources')({}),e=>e.message==='Host rejected discovery (HTTP 401)');});
test('reject wrong schema and oversize body',async()=>{for(const body of ['{"schema":"wrong"}','x'.repeat(1024*1024+1)]){const defs=create({env:{VIVIM_MCP_HOST_TOKEN:TOKEN},fetcher:async()=>new Response(body)});await assert.rejects(find(defs,'vivim_host_sources')({}));}});
test('exact capability result must match the requested canonical action and remain descriptive',async()=>{
 const valid={schema:'vivim.capability-description/1',authority:'catalog-description-only',capability:{id:'test.read'},source:{actionId:'test.read'},authorization:'not-evaluated'};
 for(const data of [{...valid,capability:{id:'other.read'}},{...valid,source:{actionId:'other.read'}},{...valid,source:null},{...valid,authorization:'granted'},{...valid,authority:'effect-authority'}]){
  const defs=create({env:{VIVIM_MCP_HOST_TOKEN:TOKEN},fetcher:async()=>new Response(JSON.stringify(data))});
  await assert.rejects(find(defs,'vivim_host_capability')({actionId:'test.read'}),/Unexpected Host capability identity or authority/);
 }
});
test('local Host credential or endpoint change during the read denies disclosure',async()=>{
 for(const [key,value] of [['VIVIM_MCP_HOST_TOKEN','n'.repeat(48)],['VIVIM_HOST_PORT','43188']]){
  const env={VIVIM_MCP_HOST_TOKEN:TOKEN};
  const defs=create({env,fetcher:async()=>new Response(new ReadableStream({pull(controller){env[key]=value;controller.enqueue(Buffer.from('{"schema":"vivim.capability-sources/1"}'));controller.close();}}))});
  await assert.rejects(find(defs,'vivim_host_sources')({}),/Local Host binding changed/);
 }
});
test('malformed UTF-8 response cannot be silently repaired into discovery JSON',async()=>{
 const body=Buffer.concat([Buffer.from('{"schema":"vivim.capability-sources/1","label":"'),Buffer.from([0xff]),Buffer.from('"}')]);
 const defs=create({env:{VIVIM_MCP_HOST_TOKEN:TOKEN},fetcher:async()=>new Response(body)});
 await assert.rejects(find(defs,'vivim_host_sources')({}),/Invalid Host JSON response/);
});

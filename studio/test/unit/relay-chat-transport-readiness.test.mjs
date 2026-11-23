import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { probeStudioRelayReadiness } from '../../src/studio/relay-chat-transport-readiness.mjs';

const origin='http://127.0.0.1:38730';
const reply=(v,status=200)=>({ok:status===200,status,json:async()=>v});
const verified={recorder:{state:'idle'},browserConnection:{state:'available',verified:true}};
const simulated=(targets,conversations,status=verified)=>async url=>{
  if(url.endsWith('/api/status'))return reply(status);
  if(url.endsWith('/conversation-targets'))return reply(targets);
  if(url.endsWith('/conversations'))return reply(conversations);
  throw new Error('unexpected route');
};
const sites={sites:['chatgpt','claude']};
test('read-only Studio owner admits a single verified supported browser path',async()=>{
  const called=[];
  const fetchImpl=async(url,init)=>{called.push({url,method:init.method});return simulated(sites,{conversations:[{state:'ready',writer:{active:false}},{state:'closed',writer:{active:false}},{state:'blocked',writer:{active:false}}]})(url)};
  const state=await probeStudioRelayReadiness({url:origin,fetchImpl});
  assert.equal(state.ready,true);
  assert.deepEqual(state.supportedProviders,['chatgpt']);
  assert.deepEqual(called.map(x=>x.method),['GET','GET','GET']);
  assert.deepEqual(called.map(x=>x.url),[origin+'/api/status',origin+'/api/v1/conversation-targets',origin+'/api/v1/conversations']);
});
test('actively owned Z.ai capture blocks ChatGPT queue claims',async()=>{
  const state=await probeStudioRelayReadiness({url:origin,fetchImpl:simulated(sites,{
    conversations:[{site:'zai',state:'busy',writer:{active:true}},{site:'chatgpt',state:'ready',writer:{active:false}}]})});
  assert.deepEqual(state,{ready:false,reason:'STUDIO_WRITER_BUSY_OR_UNKNOWN'});
});
test('missing, malformed or failed Studio owner never produces positive heartbeat',async()=>{
  for(const value of [null,{}, {conversations:[{}]}, {conversations:[null]}, {conversations:[{state:'attaching'}]},
    {conversations:[{state:'finalizing'}]}]){
    const actual=await probeStudioRelayReadiness({url:origin,fetchImpl:simulated(sites,value)});
    assert.equal(actual.ready,false);
  }
  assert.equal((await probeStudioRelayReadiness({url:origin,fetchImpl:simulated({sites:['gemini']},{conversations:[]})})).ready,false);
  assert.equal((await probeStudioRelayReadiness({url:'https://chatgpt.com',fetchImpl:()=>{throw new Error('must not run')}})).ready,false);
  assert.equal((await probeStudioRelayReadiness({url:origin,fetchImpl:async()=>reply({},503)})).ready,false);
  assert.equal((await probeStudioRelayReadiness({url:origin,fetchImpl:async()=>{throw new Error('offline')}})).ready,false);
});
test('browser offline, unverified, recording or malformed status never admits sends',async()=>{
  for(const state of [
    null,{},
    {recorder:{state:'idle'},browserConnection:{state:'not-running',verified:false}},
    {recorder:{state:'recording'},browserConnection:{state:'available',verified:true}},
    {recorder:{state:'idle'},browserConnection:{state:'available',verified:false}}
  ]){
    const called=[];
    const fetchImpl=async(url)=>{called.push(url);return simulated(sites,{conversations:[{state:'ready'}]},state)(url)};
    const actual=await probeStudioRelayReadiness({url:origin,fetchImpl});
    assert.deepEqual(actual,{ready:false,reason:'STUDIO_BROWSER_UNVERIFIED'});
    assert.deepEqual(called,[origin+'/api/status']);
  }
});
test('historical unresolved turns with no active writer do not deadlock independent fresh sends',async()=>{
  const actual=await probeStudioRelayReadiness({url:origin,fetchImpl:simulated(sites,{
    conversations:[
      {site:'chatgpt',state:'needs-reconciliation',writer:{active:false}},
      {site:'claude',state:'needs-reconciliation',writer:{active:false}},
      {site:'zai',state:'blocked',writer:{active:false}},
      {site:'chatgpt',state:'ready',writer:{active:false}}
    ]
  })});
  assert.deepEqual(actual,{ready:true,reason:'STUDIO_OWNER_IDLE',supportedProviders:['chatgpt']});
});
test('unknown, active, or unverifiable owner states fail closed before any relay claim',async()=>{
  for(const state of ['disconnected','unknown','busy','attaching','finalizing']){
    const actual=await probeStudioRelayReadiness({url:origin,fetchImpl:simulated(sites,{
      conversations:[{state,writer:{active:false}}]
    })});
    assert.deepEqual(actual,{ready:false,reason:'STUDIO_WRITER_BUSY_OR_UNKNOWN'},state);
  }
  for(const row of [
    {state:'needs-reconciliation',writer:{active:true}},
    {state:'ready',writer:{active:true}},
    {state:'ready'},
    {state:'ready',writer:{}},
    {state:'closed',writer:{active:'false'}},
    {state:'needs-reconciliation',writer:null}
  ]){
    const actual=await probeStudioRelayReadiness({url:origin,fetchImpl:simulated(sites,{conversations:[row]})});
    assert.deepEqual(actual,{ready:false,reason:'STUDIO_WRITER_BUSY_OR_UNKNOWN'},JSON.stringify(row));
  }
});
test('existing relay worker fences claims and reports blocked heartbeat before dispatch',()=>{
  const code=readFileSync(new URL('../../bin/relay-chat-mvp.mjs',import.meta.url),'utf8');
  assert.match(code,/await probeStudioRelayReadiness\(\{ url: studioUrl \}\)/);
  assert.match(code,/heartbeat\.record\(studioReadiness\.ready \? 'ok' : 'error'\)/);
  assert.match(code,/if \(!studioReadiness\.ready\)[\s\S]*?continue;/);
  assert.ok(code.indexOf('if (!studioReadiness.ready)')<code.indexOf('for (const cmd of commands)'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {probeStudioChannelEndpoint} from '../../src/studio/relay-chat-channel-preflight.mjs';

const port = 38702;
const origin='http://127.0.0.1:38702';
const version = {
  Browser:'Chrome/144.0.7559.0',
  webSocketDebuggerUrl:'ws://127.0.0.1:38702/devtools/browser/01234567-89ab-cdef-0123-456789abcdef'
};
const reply=(body,ok=true)=>({ok,json:async()=>body});
test('only a read-only local Chrome owner endpoint satisfies channel preflight',async()=>{
  const calls=[];
  const got=await probeStudioChannelEndpoint({port,fetchImpl:async(url,init)=>{
    calls.push({url,init}); return reply(version);
  }});
  assert.deepEqual(got,{ready:true,reason:'STUDIO_CHANNEL_LOOPBACK_AVAILABLE'});
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,origin+'/json/version');
  assert.equal(calls[0].init.method,'GET');
  assert.equal(calls[0].init.redirect,'error');
  assert.equal(calls[0].init.cache,'no-store');
});
test('invalid port and injected fetch fail before touching any endpoint',async()=>{
  for(const candidate of [null,undefined,0,-1,65536,1.5,NaN,'38702']){
    const got=await probeStudioChannelEndpoint({port:candidate,fetchImpl:()=>{
      throw new Error('must not be called');
    }});
    assert.deepEqual(got,{ready:false,reason:'STUDIO_CHANNEL_PORT_INVALID'});
  }
  assert.equal((await probeStudioChannelEndpoint({port,fetchImpl:null})).ready,false);
});
test('misdirected or fake CDP endpoint cannot claim readiness',async()=>{
  const urls=[
    'ws://evil.example:38702/devtools/browser/01234567-89ab-cdef-0123-456789abcdef',
    'ws://127.0.0.1:38703/devtools/browser/01234567-89ab-cdef-0123-456789abcdef',
    'wss://127.0.0.1:38702/devtools/browser/01234567-89ab-cdef-0123-456789abcdef',
    'ws://127.0.0.1:38702/devtools/page/01234567-89ab-cdef-0123-456789abcdef',
    'ws://127.0.0.1:38702/devtools/browser/01234567-89ab-cdef-0123-456789abcdef?token=something',
    'ws://name:pass@127.0.0.1:38702/devtools/browser/01234567-89ab-cdef-0123-456789abcdef',
    'not a url',
  ];
  for(const url of urls){
    const got=await probeStudioChannelEndpoint({port,fetchImpl:async()=>reply({
      ...version,webSocketDebuggerUrl:url
    })});
    assert.deepEqual(got,{ready:false,reason:'STUDIO_CHANNEL_IDENTITY_UNVERIFIED'},url);
  }
  for(const invalid of [{},{Browser:'Fake/1',webSocketDebuggerUrl:version.webSocketDebuggerUrl},
    {...version,Browser:'Other/144'}, {...version,webSocketDebuggerUrl:null}]){
    const got=await probeStudioChannelEndpoint({port,fetchImpl:async()=>reply(invalid)});
    assert.equal(got.ready,false);
  }
});
test('unavailable local port, malformed response, refused HTTP and timeout fail closed',async()=>{
  const bad=[
    async()=>reply({},false),
    async()=>{throw new Error('ECONNREFUSED')},
    async()=>{throw Object.assign(new Error('timeout'),{name:'TimeoutError'})},
    async()=>({ok:true,json:async()=>{throw new Error('malformed') }})
  ];
  for(const fetchImpl of bad){
    const got=await probeStudioChannelEndpoint({port,fetchImpl});
    assert.equal(got.ready,false);
  }
});
test('worker checks channel preflight before heartbeating or claiming any request',()=>{
  const worker=readFileSync(new URL('../../bin/relay-chat-mvp.mjs',import.meta.url),'utf8');
  assert.match(worker,/probeStudioChannelEndpoint/);
  const start=worker.indexOf('const studioReadiness = ');
  const check=worker.indexOf('await probeStudioChannelEndpoint(');
  const heartbeat=worker.indexOf('heartbeat.record(studioReadiness.ready');
  const claim=worker.indexOf('for (const cmd of commands)');
  assert.ok(start>=0&&start<check&&check<heartbeat&&heartbeat<claim,
    'local channel proof must happen before positive heartbeat and any claim');
});

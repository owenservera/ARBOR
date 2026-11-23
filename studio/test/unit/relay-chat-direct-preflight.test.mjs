// A02/A04: a fresh session is not permission to send until Studio says ready.
// Pure fake HTTP transport: no signed-in browser, provider effect or local data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudioRelayChat } from '../../bin/lib/relay-chat-studio.mjs';

const id='cmd-0000000000000001';
function command() {
  return {schema:'vivim.bridge-command/1',id,rev:2,mode:'relay-chat',
    consumer:'harness',status:'claimed',transport:'direct',
    studioRequestKey:'relay-'+id,newChat:true,text:'@chatgpt Hi',
    target:{provider:'chatgpt',model:null,effort:null}};
}

test('new Studio session in a non-ready owner state cannot post a turn or finish a busy session',async()=>{
  const states=['busy','attaching','finalizing','disconnected',
    'needs-reconciliation','unknown',null,undefined];
  for(const state of states){
    const calls=[],outcomes=[];
    const fetchImpl=async(url,init)=>{
      calls.push({url,method:init.method});
      assert.equal(init.method,'POST');
      assert.ok(url.endsWith('/api/v1/conversations/create'),
        'must never submit or finish when created state is not ready: '+String(state));
      return {ok:true,json:async()=>({conversation:{
        id:'conv-safe',revision:0,...(state === undefined ? {} : {state})
      }})};
    };
    const store={file:'/not-a-real-bridge-journal',reply:(id,result,opts)=>
      outcomes.push({id,result,opts})};
    const adapter=createStudioRelayChat({
      url:'http://127.0.0.1:38730',store,fetchImpl
    });
    const cmd=command();
    await adapter.handle({cmd,rec:cmd,provider:'chatgpt',
      model:null,effort:null,prompt:'Hi'});
    assert.equal(calls.length,1,'only the existing Studio create request is allowed');
    assert.deepEqual(outcomes,[{id,result:'STUDIO_CONVERSATION_NOT_READY',
      opts:{status:'failed'}}]);
    assert.equal(adapter.halted(),false);
  }
});

test('an invalid Studio conversation identity never proceeds to a turn',async()=>{
  const failures=[],calls=[];
  const store={file:'/not-a-real-bridge-journal',reply:(id,result,opts)=>
    failures.push({result,opts})};
  const fetchImpl=async(url,init)=>{
    calls.push(url);
    assert.equal(init.method,'POST');
    return {ok:true,json:async()=>({conversation:{id:'bad/id',revision:0,state:'ready'}})};
  };
  const adapter=createStudioRelayChat({url:'http://127.0.0.1:38730',store,fetchImpl});
  const cmd=command();
  await adapter.handle({cmd,rec:cmd,provider:'chatgpt',model:null,effort:null,prompt:'Hi'});
  assert.equal(calls.length,1);
  assert.deepEqual(failures,[{result:'STUDIO_INVALID_CONVERSATION',
    opts:{status:'failed'}}]);
});

test('ready but unbound to the correct fresh ChatGPT tab never submits or finishes',async()=>{
  const valid={
    id:'conv-safe',revision:0,state:'ready',site:'chatgpt',
    identity:{state:'unbound',reason:'NEW_CHAT'},
    binding:{ownedByStudio:true,targetId:'target-123',
      origin:'https://chatgpt.com',thread:null},
    writer:{active:false},recovery:{pending:false}
  };
  const cases=[
    {site:'claude'},
    {site:undefined},
    {identity:{state:'bound',reason:null}},
    {identity:{state:'unverified',reason:'UNSUPPORTED_PATH'}},
    {binding:{...valid.binding,thread:{ref:'chatgpt-c:old'}}},
    {binding:{...valid.binding,ownedByStudio:false}},
    {binding:{...valid.binding,targetId:'pending-conv-safe'}},
    {binding:{...valid.binding,origin:'https://claude.ai'}},
    {writer:{active:true}},
    {writer:{}},
    {recovery:{pending:true}}
  ];
  for(const changes of cases){
    const calls=[],failures=[];
    const fetchImpl=async(url,init)=>{
      calls.push({url,method:init.method});
      assert.ok(url.endsWith('/api/v1/conversations/create'),
        'identity failure must not request a turn or finish the tab');
      return {ok:true,json:async()=>({conversation:{...valid,...changes}})};
    };
    const store={file:'/not-a-real-bridge-journal',
      reply:(id,result,opts)=>failures.push({id,result,opts})};
    const adapter=createStudioRelayChat({
      url:'http://127.0.0.1:38730',store,fetchImpl
    });
    const cmd=command();
    await adapter.handle({cmd,rec:cmd,provider:'chatgpt',
      model:null,effort:null,prompt:'Hi'});
    assert.equal(calls.length,1);
    assert.deepEqual(failures,[{
      id,result:'STUDIO_CONVERSATION_BINDING_UNVERIFIED',opts:{status:'failed'}
    }]);
  }
});

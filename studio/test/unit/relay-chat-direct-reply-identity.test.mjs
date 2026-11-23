// A06/A07: a settled Studio reply is only safe to project when it is from
// the claimed provider, exact conversation, target and native thread.
// This suite injects fake loopback HTTP replies; it never reaches a browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createStudioRelayChat } from '../../bin/lib/relay-chat-studio.mjs';

const ID='cmd-0000000000000001', KEY='relay-'+ID;
const THREAD='chatgpt-c:11111111-2222-3333-4444-555555555555';
const newCommand=()=>({id:ID,studioRequestKey:KEY,consumer:'harness',
  status:'claimed',transport:'direct',mode:'relay-chat',
  text:'@chatgpt Hi',target:{provider:'chatgpt',model:null,effort:null},
  newChat:true});
const created={
  id:'conv-safe',revision:1,state:'ready',site:'chatgpt',
  identity:{state:'unbound',reason:'NEW_CHAT'},
  binding:{targetId:'studio-target-1',origin:'https://chatgpt.com',
    ownedByStudio:true,thread:null},
  writer:{active:false},recovery:{pending:false}
};
const settled={
  id:'conv-safe',state:'ready',site:'chatgpt',identity:{state:'bound'},
  binding:{...created.binding,thread:{ref:THREAD}},
  turns:[{key:KEY,conversationId:'conv-safe',reply:{
    verified:true,settled:true,text:'Fixture settled answer'
  }}]
};
async function runCase(change={}){
  const root=mkdtempSync(path.join(os.tmpdir(),'vivim-studio-reply-identity-'));
  const calls=[],replies=[];
  try{
    const target={...settled,...change};
    const fetchImpl=async(url,init)=>{
      const route=new URL(url).pathname;
      calls.push({route,method:init.method});
      let conversation;
      if(route.endsWith('/conversations/create')&&init.method==='POST')conversation=created;
      else if(route.endsWith('/conv-safe/turns')&&init.method==='POST')conversation={};
      else if(route.endsWith('/conv-safe')&&init.method==='GET')conversation=target;
      else if(route.endsWith('/conv-safe/finish')&&init.method==='POST')conversation={};
      else throw Error('UNEXPECTED_FETCH '+route);
      return {ok:true,json:async()=>({conversation})};
    };
    const store={file:path.join(root,'commands.jsonl'),
      reply:(id,text,{status='done'}={})=>replies.push({id,text,status})};
    const adapter=createStudioRelayChat({
      url:'http://127.0.0.1:38730',store,fetchImpl
    });
    const cmd=newCommand();
    await adapter.handle({cmd,rec:cmd,provider:'chatgpt',
      model:null,effort:null,prompt:'Hi'});
    return {calls,replies};
  }finally{rmSync(root,{recursive:true,force:true});}
}
test('valid same-source settled ChatGPT reply projects once and finishes verified tab',async()=>{
  const {calls,replies}=await runCase();
  assert.equal(calls.filter(c=>c.route.endsWith('/turns')).length,1);
  assert.equal(calls.filter(c=>c.route.endsWith('/finish')).length,1);
  assert.deepEqual(replies,[{id:ID,text:'[chatgpt] Fixture settled answer',status:'done'}]);
});
test('wrong-site/thread/turn/target settled replies stay uncertain and are never projected',async()=>{
  const candidates=[
    {id:'other-conversation'},
    {site:'claude'},
    {identity:{state:'unbound'}},
    {binding:{...settled.binding,thread:null}},
    {binding:{...settled.binding,targetId:'another-tab'}},
    {binding:{...settled.binding,origin:'https://claude.ai'}},
    {binding:{...settled.binding,ownedByStudio:false}},
    {turns:[{...settled.turns[0],conversationId:'other-conversation'}]}
  ];
  for(const change of candidates){
    const {calls,replies}=await runCase(change);
    assert.equal(calls.filter(c=>c.route.endsWith('/turns')).length,1);
    assert.equal(calls.filter(c=>c.route.endsWith('/finish')).length,0,
      'unverified source must not finalize someone else\'s tab');
    assert.equal(replies.length,1);
    assert.equal(replies[0].status,'failed');
    assert.match(replies[0].text,/uncertain, not resent \(STUDIO_SETTLED_REPLY_IDENTITY_UNVERIFIED;/);
  }
});

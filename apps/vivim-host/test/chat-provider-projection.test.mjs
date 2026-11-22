import test from 'node:test';
import assert from 'node:assert/strict';
import {projectChatProviders,CHAT_PROVIDER_SCHEMA} from '../chat/provider-projection.mjs';

const t=Date.parse('2026-11-13T14:00:00Z');
test('Host exposes only recent explicitly verified Studio owner sign-ins',()=>{
 const records=[
 {id:'chatgpt',label:'ChatGPT',check:{verified:true,state:'ready',observedAt:new Date(t-1000).toISOString()}},
 {id:'claude',label:'Claude',check:{verified:true,state:'ready',observedAt:new Date(t-46000).toISOString()}},
 {id:'qwen',label:'Qwen',check:{verified:false,state:'ready',observedAt:new Date(t-100).toISOString()}},
 {id:'zai',label:'Z.ai',check:null}
 ];
 const m=projectChatProviders(records,t);
 assert.equal(m.schema,CHAT_PROVIDER_SCHEMA);
 assert.deepEqual(m.providers.map(p=>p.signedIn),[true,false,false,false]);
 assert.equal(m.providers[0].models.length,0);
 assert.equal(m.providers[0].attachments,false);
 assert.equal(m.verification,'explicit-Studio-owner-check');
});
test('malformed or non-source fields cannot forge signed-in provider state',()=>{
 const m=projectChatProviders([
 {id:'chatgpt',label:'ChatGPT',signedIn:true,check:{verified:false,state:'ready',observedAt:new Date(t).toISOString()}},
 {id:'claude',label:'Claude',check:{verified:true,state:'signed_in',observedAt:new Date(t).toISOString()}},
 {id:'chatgpt',label:'duplicate',check:{verified:true,state:'ready',observedAt:new Date(t).toISOString()}},
 {id:'BAD ID',check:{verified:true,state:'ready',observedAt:new Date(t).toISOString()}}
 ],t);
 assert.deepEqual(m.providers.map(p=>p.id),['chatgpt','claude']);
 assert.deepEqual(m.providers.map(p=>p.signedIn),[false,false]);
});

test('a current signed-in account cannot forge readiness for an absent or incompatible worker',()=>{
 const record={id:'chatgpt',label:'ChatGPT',check:{verified:true,state:'ready',observedAt:new Date(t).toISOString()}};
 for(const worker of [null,{state:'stale',supportedProviders:['chatgpt']},{state:'online',supportedProviders:[]}])
   assert.equal(projectChatProviders([record],t,worker).providers[0].queueConsumerReady,false);
 assert.equal(projectChatProviders([record],t,{state:'online',supportedProviders:['chatgpt']}).providers[0].queueConsumerReady,true);
 assert.equal(projectChatProviders([{...record,id:'gemini'}],t,{state:'online',supportedProviders:['chatgpt']}).providers[0].queueConsumerReady,false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createRustChatContext,CHAT_CONTEXT_SCHEMA} from '../chat/rust-context.mjs';
const config={VIVIM_CHAT_CORE_BIN:'/opt/hqkg-chat-context',VIVIM_CHAT_CORE_JOURNAL:'/tmp/context.hqj',VIVIM_CHAT_CORE_SEED:'world:local'};
const response={
 schema:CHAT_CONTEXT_SCHEMA,state:'source-backed',core:'hqkg',authority:'read-only',
 seed:'world:local',epoch:4,tokensUsed:22,budgetTokens:320,staleCount:0,
 totalRetrieved:1,budgetExhausted:false,
 items:[{title:'World',depth:0,revision:3,sourceCount:1,estimatedTokens:22,
  unsafeInternalPath:'/private/root',secret:'not-disclosed'}]
};
test('no binary configured means unavailable, with no fake core context',async()=>{
 const fn=createRustChatContext({env:{},execute:()=>{throw Error('must not run')}});
 assert.equal((await fn('world')).state,'unavailable');
 assert.equal((await fn('world')).reason,'RUST_CORE_NOT_CONFIGURED');
});
test('only fixed focus names, absolute Host-configured paths and bounded native response',async()=>{
 let calls=0;
 const fn=createRustChatContext({env:config,execute:async (bin,args,opts)=>{
   calls++;
   assert.equal(bin,config.VIVIM_CHAT_CORE_BIN);
   assert.deepEqual(args,['/tmp/context.hqj','world:local','320']);
   assert.equal(opts.shell,false);
   assert.equal(opts.timeout,2500);
   return {stdout:JSON.stringify(response)};
 }});
 const data=await fn('talk');
 assert.equal(data.state,'source-backed');
 assert.equal(data.focus,'talk');
 assert.equal(data.items[0].title,'World');
 assert.equal(JSON.stringify(data).includes('not-disclosed'),false);
 assert.equal(JSON.stringify(data).includes('/private/root'),false);
 assert.equal(calls,1);
 const wikiContext=await fn('wiki');
 assert.equal(wikiContext.state,'source-backed');
 assert.equal(wikiContext.focus,'wiki');
 assert.equal(wikiContext.authority,'read-only');
 assert.equal(calls,2);
 assert.equal((await fn('../../etc/passwd')).reason,'FOCUS_INVALID');
 assert.equal(calls,2);
});
test('invalid, stale, oversized, unreadable or untrusted Rust output fails closed',async()=>{
 for(const output of [null,{...response,staleCount:1},{...response,authority:'execute'},
   {...response,epoch:-1},{...response,items:[{...response.items[0],title:'A\nB'}]},
   {...response,budgetTokens:999},{...response,items:Array(12).fill(response.items[0])}]){
   const fn=createRustChatContext({env:config,execute:async()=>({stdout:JSON.stringify(output)})});
   assert.equal((await fn('today')).state,'unavailable');
 }
 const error=createRustChatContext({env:config,execute:async()=>{throw Error('offline')}});
 assert.equal((await error('talk')).reason,'RUST_CORE_READ_FAILED');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runExistingStudioChatAsk } from '../../bin/lib/relay-chat-studio-channel.mjs';
import { createStudioRelayChat } from '../../bin/lib/relay-chat-studio.mjs';
import { createChatChannel } from '../../src/studio/chat-channel.mjs';

const THREAD='chatgpt-c:11111111-2222-3333-4444-555555555555';
const KEY='relay-cmd-1111111111111111';
function sandbox(fn){
  const root=mkdtempSync(path.join(os.tmpdir(),'vivim-studio-phone-channel-'));
  return Promise.resolve().then(()=>fn(root)).finally(()=>rmSync(root,{recursive:true,force:true}));
}
const digest=value=>'sha256:'+createHash('sha256').update(value,'utf8').digest('hex');

test('existing Studio channel uses one isolated tab and accepts the matching durable receipt',()=>sandbox(async root=>{
  let calls=0,seenPrompt='';
  const run=async(exe,args,{cwd,env})=>{
    calls++;
    assert.ok(args.includes('--isolated-thread'));
    assert.equal(args[args.indexOf('--thread')+1],'new');
    assert.equal(args[args.indexOf('--port')+1],'38702');
    assert.equal(cwd,root);
    assert.equal(env.VIVIM_CHAT_TRANSPORT,'drive');
    seenPrompt=readFileSync(args[args.indexOf('--prompt-file')+1],'utf8');
    const receiptDir=path.join(root,'channel','receipts');mkdirSync(receiptDir,{recursive:true});
    writeFileSync(path.join(receiptDir,KEY+'.json'),JSON.stringify({
      schema:'vivim.chat-receipt/1',requestId:KEY,receiptId:'receipt-1',
      effect:'OK',thread:{after:THREAD},replyDigest:digest('Hello from Studio')
    }));
    return {exitCode:0,stdout:JSON.stringify({schema:'vivim.chat-ask-result/1',
      requestId:KEY,receiptId:'receipt-1',effect:'OK',
      threadId:THREAD,reply:'Hello from Studio'})};
  };
  const response=await runExistingStudioChatAsk({root,port:38702,requestId:KEY,
    prompt:'Hi ChatGPT',thread:'new',run});
  assert.deepEqual(response,{effect:'OK',threadId:THREAD,receiptId:'receipt-1',
    reply:'Hello from Studio'});
  assert.equal(calls,1);assert.equal(seenPrompt,'Hi ChatGPT');
  assert.throws(()=>readFileSync(path.join(root,'bridge','channel-staging',KEY+'.txt')),
    {code:'ENOENT'});
}));
// The same test explicitly verifies temporary plaintext is not left on disk.
test('a mismatched existing channel receipt is uncertain and never becomes a phone reply',()=>sandbox(async root=>{
  const run=async(exe,args)=>{
    const file=args[args.indexOf('--prompt-file')+1];
    assert.ok(readFileSync(file,'utf8').length);
    const dir=path.join(root,'channel','receipts');mkdirSync(dir,{recursive:true});
    writeFileSync(path.join(dir,KEY+'.json'),JSON.stringify({
      schema:'vivim.chat-receipt/1',requestId:KEY,receiptId:'receipt-1',
      effect:'OK',thread:{after:THREAD},replyDigest:digest('different text')
    }));
    return {exitCode:0,stdout:JSON.stringify({schema:'vivim.chat-ask-result/1',
      requestId:KEY,receiptId:'receipt-1',effect:'OK',
      threadId:THREAD,reply:'Hello from Studio'})};
  };
  await assert.rejects(
    runExistingStudioChatAsk({root,port:38702,requestId:KEY,prompt:'Hi',thread:'new',run}),
    /STUDIO_CHANNEL_RECEIPT_UNVERIFIED/);
  assert.throws(()=>readFileSync(path.join(root,'bridge','channel-staging',KEY+'.txt')),
    {code:'ENOENT'});
}));
test('continuations refuse wrong native thread even with an OK receipt',()=>sandbox(async root=>{
  const run=async(exe,args)=>{
    assert.equal(args[args.indexOf('--thread')+1],THREAD);
    return {exitCode:0,stdout:JSON.stringify({schema:'vivim.chat-ask-result/1',
      requestId:KEY,receiptId:'receipt-1',effect:'OK',threadId:'chatgpt-c:99999999-2222-3333-4444-555555555555',
      reply:'Wrong thread'})};
  };
  await assert.rejects(runExistingStudioChatAsk({
    root,port:38702,requestId:KEY,prompt:'Continue',thread:THREAD,run
  }),/STUDIO_CHANNEL_THREAD_UNVERIFIED/);
}));
test('invalid thread or child failure has no transport retry',()=>sandbox(async root=>{
  let calls=0;
  await assert.rejects(runExistingStudioChatAsk({root,port:38702,requestId:KEY,
    prompt:'Hi',thread:'chatgpt-live-tab',run:async()=>{calls++}}),/STUDIO_CHANNEL_INPUT_INVALID/);
  assert.equal(calls,0);
  const result=await runExistingStudioChatAsk({root,port:38702,requestId:KEY,
    prompt:'Hi',thread:'new',run:async()=>{calls++;return{exitCode:1,stdout:JSON.stringify({
      schema:'vivim.chat-ask-result/1',requestId:KEY,effect:'UNCERTAIN'
    })}}});
  assert.deepEqual(result,{effect:'UNCERTAIN',reason:'STUDIO_CHANNEL_UNCERTAIN'});
  assert.equal(calls,1);
}));
function memoryStore(pending=null){
  const receipts=new Map(),outcomes=new Map();let dispatched=0,cleared=0,put=0;
  return {
    receipts,stats:()=>({dispatched,cleared,put}),
    transport:{site:'chatgpt',createThread:async()=>({threadId:'chatgpt-new-tab'}),
      send:async()=>{dispatched++;return{effect:'OK',threadId:THREAD,
        journalKey:KEY,reply:'Studio replied'}}},
    store:{get:async id=>receipts.get(id)||null,put:async r=>{put++;receipts.set(r.requestId,r)},
      getPending:async()=>pending,putPending:async()=>{},
      clearPending:async()=>{cleared++},getOutcome:async id=>outcomes.get(id),
      putOutcome:async(id,r)=>outcomes.set(id,r),
      isRevoked:async()=>false,revoke:async()=>{}}
  };
}
test('channel persists the actual native ChatGPT thread in its existing receipt',async()=>{
  const m=memoryStore();
  const channel=createChatChannel({store:m.store,transport:m.transport});
  const result=await channel.run({scope:'chatgpt.send',requestId:KEY,
    actor:{kind:'phone',id:'test'},thread:'new',prompt:'Hi'});
  assert.equal(result.receipt.effect,'OK');
  assert.equal(result.receipt.thread.after,THREAD);
  assert.equal(result.outcome.threadId,THREAD);
  assert.equal(m.stats().dispatched,1);
});
test('channel crash-left pending entry survives; no duplicate effect or fake success',async()=>{
  const m=memoryStore({requestId:KEY,promptDigest:digest('Hi')});
  const channel=createChatChannel({store:m.store,transport:m.transport});
  const result=await channel.run({scope:'chatgpt.send',requestId:KEY,thread:'new',prompt:'Hi'});
  assert.equal(result.receipt.effect,'UNCERTAIN');
  assert.equal(result.outcome.reply,'');
  assert.equal(m.stats().dispatched,0);
  assert.equal(m.stats().cleared,0);
  assert.equal(m.stats().put,0);
});
function makeFakeBridge(root,rows){
  const file=path.join(root,'bridge','commands.jsonl');
  mkdirSync(path.dirname(file),{recursive:true});
  writeFileSync(file,rows.map(r=>JSON.stringify(r)+'\n').join(''));
  const latest=()=>new Map(readFileSync(file,'utf8').trim().split('\n').filter(Boolean)
    .map(line=>JSON.parse(line)).map(r=>[r.id,r]));
  return {file,get:id=>latest().get(id),
    reply(id,result,{status='done'}={}){
      const old=latest().get(id);
      const next={...old,status,result,rev:old.rev+1};
      writeFileSync(file,readFileSync(file,'utf8')+JSON.stringify(next)+'\n');
      return next;
    }};
}
function cmd(n,provider='chatgpt',extra={}){
  const id='cmd-'+String(n).padStart(16,'0');
  return {schema:'vivim.bridge-command/1',id,rev:2,
    consumer:'harness',status:'claimed',transport:'direct',mode:'relay-chat',
    conversationId:'c-test-one',text:'@'+provider+' Hi',target:{provider,model:null,effort:null},
    studioRequestKey:'relay-'+id,newChat:true,...extra};
}
test('phone relay uses existing Studio channel exactly once and records native thread',()=>sandbox(async root=>{
  const current=cmd(1),store=makeFakeBridge(root,[current]);let calls=0;
  const adapter=createStudioRelayChat({url:'http://127.0.0.1:38730',store,
    isolatedChannel:{root,port:38702},
    channelRun:async args=>{calls++;assert.equal(args.thread,'new');
      return{effect:'OK',threadId:THREAD,receiptId:'r1',reply:'Studio replied'}}});
  await adapter.handle({cmd:current,rec:current,provider:'chatgpt',model:null,
    effort:null,prompt:'Hi'});
  const done=store.get(current.id);
  assert.equal(calls,1);
  assert.equal(done.status,'done');
  assert.equal(done.studioThreadRef,THREAD);
  assert.equal(done.studioChannelReceiptId,'r1');
}));
test('phone relay refuses unsafe continuation and changed provider without effect',()=>sandbox(async root=>{
  const old=cmd(1,'chatgpt',{status:'failed',result:'uncertain',newChat:true});
  const next=cmd(2,'chatgpt',{newChat:false});
  const store=makeFakeBridge(root,[old,next]);let calls=0;
  const channelRun=async()=>{calls++;throw Error('never reach browser')};
  const adapter=createStudioRelayChat({url:'http://127.0.0.1:38730',store,
    isolatedChannel:{root,port:38702},channelRun});
  await adapter.handle({cmd:next,rec:next,provider:'chatgpt',model:null,effort:null,prompt:'Hi'});
  assert.equal(store.get(next.id).status,'failed');assert.equal(calls,0);
  const changed=cmd(3,'chatgpt',{newChat:false});
  const changedStore=makeFakeBridge(path.join(root,'separate'),[
    cmd(1,'claude',{status:'done',studioThreadRef:THREAD}),changed]);
  const changedAdapter=createStudioRelayChat({url:'http://127.0.0.1:38730',store:changedStore,
    isolatedChannel:{root,port:38702},channelRun});
  await changedAdapter.handle({cmd:changed,rec:changed,provider:'chatgpt',model:null,
    effort:null,prompt:'Hi'});
  assert.equal(changedStore.get(changed.id).status,'failed');assert.equal(calls,0);
}));

test('corrupted historical bridge revision blocks a fresh same-conversation send without replay',()=>sandbox(async root=>{
  const earlier=cmd(1,'chatgpt',{status:'done',newChat:true,studioThreadRef:THREAD});
  const next=cmd(2,'chatgpt',{newChat:true});
  const journalFile=path.join(root,'bridge','commands.jsonl');
  mkdirSync(path.dirname(journalFile),{recursive:true});
  const valid=JSON.stringify(earlier)+'\n'+JSON.stringify(next)+'\n';
  const cases=[
    JSON.stringify(earlier)+'\n'+'{not-json}\n'+JSON.stringify(next)+'\n',
    JSON.stringify(earlier)+'\n'+JSON.stringify({id:'not-a-command'})+'\n'+JSON.stringify(next)+'\n',
    valid+'{"id":'
  ];
  for(const journal of cases){
    writeFileSync(journalFile,journal);
    let calls=0;
    const failures=[];
    const store={file:journalFile,reply:(id,result,options)=>failures.push({id,result,options})};
    const adapter=createStudioRelayChat({url:'http://127.0.0.1:38730',store,
      isolatedChannel:{root,port:38702},
      channelRun:async()=>{calls++;throw Error('must never send');}});
    await adapter.handle({cmd:next,rec:next,provider:'chatgpt',model:null,effort:null,prompt:'Hi'});
    assert.equal(calls,0,'corrupt journal must never reach the browser');
    assert.deepEqual(failures,[{id:next.id,result:'STUDIO_RELAY_HISTORY_UNVERIFIED',
      options:{status:'failed'}}]);
  }
}));


test('preexisting channel receipt prevents any repeat child dispatch even if its JSON is torn',()=>sandbox(async root=>{
  const dir=path.join(root,'channel','receipts');
  mkdirSync(dir,{recursive:true});
  let dispatched=0;
  for(const prior of [
    JSON.stringify({schema:'vivim.chat-receipt/1',requestId:KEY,
      receiptId:'prior',effect:'OK',thread:{after:THREAD},
      replyDigest:digest('already replied')}),
    '{"schema":"vivim.chat-receipt/1","effect":'
  ]){
    writeFileSync(path.join(dir,KEY+'.json'),prior);
    await assert.rejects(runExistingStudioChatAsk({
      root,port:38702,requestId:KEY,prompt:'Do not resend',thread:'new',
      run:async()=>{dispatched++;throw Error('child must never run');}
    }),/STUDIO_CHANNEL_PRIOR_RECEIPT/);
    assert.equal(dispatched,0,'existing receipt must prohibit repeated effect');
    assert.throws(()=>readFileSync(path.join(root,'bridge','channel-staging',KEY+'.txt')),
      {code:'ENOENT'},'no plaintext staging permitted for a previously receipted key');
  }
}));


test('contradictory revisions of one historical command never hide an uncertain prior send',()=>sandbox(async root=>{
  const earlier=cmd(1,'chatgpt',{status:'failed',result:'uncertain, not resent'});
  const current=cmd(2,'chatgpt',{newChat:true});
  const journalFile=path.join(root,'bridge','commands.jsonl');
  mkdirSync(path.dirname(journalFile),{recursive:true});
  const revisions=[
    {conversationId:'other-phone-conversation'},
    {text:'@chatgpt changed owner instruction'},
    {transport:'alternate'},
    {target:{provider:'chatgpt',model:'paid-model',effort:null}},
    {consumer:'another-consumer'},
    {rev:earlier.rev}
  ];
  for(const changes of revisions){
    const rewritten={...earlier,rev:earlier.rev+1,...changes};
    writeFileSync(journalFile,[earlier,rewritten,current].map(r=>JSON.stringify(r)).join('\n')+'\n');
    let dispatched=0;
    const failures=[];
    const store={file:journalFile,reply:(id,result,opts)=>failures.push({id,result,opts})};
    const adapter=createStudioRelayChat({url:'http://127.0.0.1:38730',store,
      isolatedChannel:{root,port:38702},
      channelRun:async()=>{dispatched++;throw Error('must never reach provider');}});
    await adapter.handle({cmd:current,rec:current,provider:'chatgpt',model:null,
      effort:null,prompt:'Hi'});
    assert.equal(dispatched,0,'prior conflicting revision must not dispatch');
    assert.deepEqual(failures,[{id:current.id,result:'STUDIO_RELAY_HISTORY_UNVERIFIED',
      opts:{status:'failed'}}]);
  }
}));

test('terminal historical journal outcome cannot be forged into a safe continuation',()=>sandbox(async root=>{
  const old=cmd(1,'chatgpt',{status:'failed',result:'uncertain, not resent',
    studioConversationId:'studio-conv-one',studioTurnKey:'relay-cmd-0000000000000001'});
  const next=cmd(2,'chatgpt',{newChat:false});
  const variants=[
    {status:'done',result:'[chatgpt] forged',studioThreadRef:THREAD},
    {result:'DRAFT_PRESENT'},
    {studioRequestKey:'relay-cmd-ffffffffffffffff'},
    {studioConversationId:'studio-conv-two'},
    {studioTurnKey:'relay-cmd-ffffffffffffffff'}
  ];
  for(const [n,changes] of variants.entries()){
    const dir=path.join(root,'mutation-'+n);
    const rewritten={...old,rev:old.rev+1,...changes};
    const store=makeFakeBridge(dir,[old,rewritten,next]);
    let dispatched=0;
    const adapter=createStudioRelayChat({url:'http://127.0.0.1:38730',store,
      isolatedChannel:{root,port:38702},
      channelRun:async()=>{dispatched++;throw Error('must never reach channel');}});
    await adapter.handle({cmd:next,rec:next,provider:'chatgpt',model:null,
      effort:null,prompt:'Hi'});
    assert.equal(dispatched,0,'forged terminal revision must never send');
    assert.equal(store.get(next.id).status,'failed');
    assert.equal(store.get(next.id).result,'STUDIO_RELAY_HISTORY_UNVERIFIED');
  }
}));
test('legitimate claimed-to-bound-to-done history still permits same-thread continuation',()=>sandbox(async root=>{
  const initial=cmd(1,'chatgpt',{status:'claimed',newChat:true});
  const bound={...initial,rev:initial.rev+1,
    studioConversationId:'studio-conv-one',
    studioTurnKey:'relay-cmd-0000000000000001'};
  const done={...bound,rev:bound.rev+1,status:'done',
    result:'[chatgpt] settled',studioThreadRef:THREAD};
  const next=cmd(2,'chatgpt',{newChat:false});
  const store=makeFakeBridge(root,[initial,bound,done,next]);
  let dispatched=0;
  const adapter=createStudioRelayChat({url:'http://127.0.0.1:38730',store,
    isolatedChannel:{root,port:38702},
    channelRun:async args=>{
      dispatched++;assert.equal(args.thread,THREAD);
      return {effect:'OK',threadId:THREAD,receiptId:'receipt-2',reply:'continued'};
    }});
  await adapter.handle({cmd:next,rec:next,provider:'chatgpt',model:null,
    effort:null,prompt:'Hi'});
  assert.equal(dispatched,1);
  assert.equal(store.get(next.id).status,'done');
  assert.equal(store.get(next.id).studioThreadRef,THREAD);
}));

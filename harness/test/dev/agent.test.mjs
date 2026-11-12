import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDevAction, devPrompt, runDev } from '../../src/dev/agent.mjs';

function fake(steps) {
  const sends=[]; let n=0;
  return {
    sends,
    router: {
      async ask({provider,prompt,threadUrl}) { const id='req-'+(++n); sends.push({id,provider,prompt,threadUrl}); return {requestId:id,status:'pending_approval'}; },
      async wait(id) { return steps[sends.length-1]; }
    },
    approvals:{async approve(id){ return id; }}
  };
}
const w = () => ({list:async()=>({entries:[]}),read:async()=>({path:'harness/src/x.mjs',sha256:'a'.repeat(64),lines:[]}),search:async()=>({matches:[]}),edit:async()=>({ok:true}),create:async()=>({ok:true}),diff:()=>({diff:''}),testHarness:()=>({ok:true})});

test('parses exact tool action; rejects arbitrary host commands, unknown params and code fences',()=>{
  assert.equal(parseDevAction('{"tool":"list"}').tool,'list');
  for(const bad of ['```json\n{"tool":"list"}\n```','{"tool":"shell","cmd":"rm -rf /"}', '{"tool":"test","cmd":"curl example.com"}', '[{"tool":"list"}]','{"tool":"edit","path":"x"}']) assert.throws(()=>parseDevAction(bad));
  assert.match(devPrompt({task:'Make button'}),/READ-ONLY/);
});
test('read-only dev accepts inspected actions; two sends share exact thread, then finishes',async()=>{
  const s=fake([{status:'complete',reply:'{"tool":"list"}'},{status:'complete',reply:'{"tool":"finish","summary":"inspected"}'}]);
  const receipts=[];
  const job=await runDev({task:'Inspect code',provider:'chatgpt:gpt-6',router:s.router,workspace:w(),persist:async x=>receipts.push(JSON.parse(JSON.stringify(x))),resolveThreadUrl:async()=> 'https://chatgpt.com/c/hello',maxTurns:4});
  assert.equal(job.status,'complete'); assert.equal(job.turns.length,2); assert.equal(s.sends[1].threadUrl,'https://chatgpt.com/c/hello'); assert.match(s.sends[1].prompt,/Previous tool result/);
  assert(receipts.length>=4);
});
test('uncertain send is never replayed and leaves durable receipt',async()=>{
  const s=fake([{status:'uncertain'}]);const receipts=[];
  const job=await runDev({task:'Inspect code',provider:'chatgpt:gpt-6',router:s.router,workspace:w(),persist:async x=>receipts.push(JSON.parse(JSON.stringify(x)))});
  assert.equal(job.status,'uncertain');assert.equal(s.sends.length,1);assert.equal(receipts.at(-1).status,'uncertain');
});
test('read-only forbids edit: tool failure returned as data without invoking workspace edit',async()=>{
  const s=fake([{status:'complete',reply:JSON.stringify({tool:'edit',path:'harness/src/x.mjs',expectedSha256:'a'.repeat(64),find:'x',replace:'y'})},{status:'complete',reply:'{"tool":"finish","summary":"blocked write"}'}]);
  let edited=0;const ws=w();ws.edit=async()=>{edited++};
  const job=await runDev({task:'Try write',provider:'claude:x',router:s.router,workspace:ws,resolveThreadUrl:async()=> 'https://claude.ai/chat/abc'});
  assert.equal(edited,0);assert.equal(job.status,'complete'); assert.equal(job.turns[0].toolOk,false);
});
test('apply mode uses workspace edit only, still requires explicit model-send approval',async()=>{
  const s=fake([{status:'complete',reply:JSON.stringify({tool:'edit',path:'harness/src/x.mjs',expectedSha256:'a'.repeat(64),find:'x',replace:'y'})},{status:'complete',reply:'{"tool":"test"}'},{status:'complete',reply:'{"tool":"finish","summary":"done"}'}]);
  let edited=0, approvals=0;const ws=w();ws.edit=async()=>{edited++;return {changed:true}};
  const job=await runDev({task:'Edit',provider:'claude:model',router:s.router,workspace:ws,apply:true,ownerApproved:true,approvals:{approve:async()=>{approvals++}},resolveThreadUrl:async()=> 'https://claude.ai/chat/abc'});
  assert.equal(job.status,'complete');assert.equal(edited,1);assert.equal(approvals,3);
});
test('absence of exact thread URL stops before second send',async()=>{
 const s=fake([{status:'complete',reply:'{"tool":"list"}'}]);const j=await runDev({task:'Look',provider:'claude:model',router:s.router,workspace:w()});
 assert.equal(j.status,'blocked');assert.equal(j.result.reason,'THREAD_URL_UNKNOWN');assert.equal(s.sends.length,1);
});
test('budget stops sends at configured ceiling',async()=>{
 const s=fake([{status:'complete',reply:'{"tool":"list"}'},{status:'complete',reply:'{"tool":"list"}'}]);
 const j=await runDev({task:'Look',provider:'claude:model',router:s.router,workspace:w(),maxTurns:2,resolveThreadUrl:async()=> 'https://claude.ai/chat/abc'});
 assert.equal(j.status,'budget_exhausted');assert.equal(s.sends.length,2);
});

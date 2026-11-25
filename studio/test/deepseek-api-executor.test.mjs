import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareDeepSeekRequest,projectDeepSeekResult,executeDeepSeek} from '../src/security/deepseek-api-executor.mjs';
import {projectReceipt} from '../src/security/deepseek-api-provision.mjs';

test('Flash is default and only normalized messages are forwarded',()=>{
  assert.deepEqual(prepareDeepSeekRequest({messages:[{role:'user',content:'hello',extra:'discard'}]}),
    {model:'deepseek-flash',messages:[{role:'user',content:'hello'}],max_tokens:256});
});
test('unapproved model and excessive request are rejected',()=>{
  assert.throws(()=>prepareDeepSeekRequest({model:'other',messages:[{role:'user',content:'x'}]}),{code:'DEEPSEEK_INVALID_REQUEST'});
  assert.throws(()=>prepareDeepSeekRequest({messages:[{role:'tool',content:'x'}]}),{code:'DEEPSEEK_INVALID_MESSAGE'});
  assert.throws(()=>prepareDeepSeekRequest({messages:[{role:'user',content:'x'}],maxTokens:4097}),{code:'DEEPSEEK_INVALID_REQUEST'});
  assert.throws(()=>prepareDeepSeekRequest({messages:Array.from({length:64},()=>({role:'user',content:'x'.repeat(3000)}))}),{code:'DEEPSEEK_REQUEST_TOO_LARGE'});
});
test('result projection admits only expected fields and matching model',()=>{
  const r={state:'completed',model:'deepseek-flash',content:'ok',finishReason:'stop',usage:{inputTokens:5,outputTokens:1},extra:'discard'};
  assert.deepEqual(projectDeepSeekResult(r,'deepseek-flash'),{state:'completed',provider:'deepseek',model:'deepseek-flash',content:'ok',finishReason:'stop',usage:{inputTokens:5,outputTokens:1}});
  assert.throws(()=>projectDeepSeekResult(r,'deepseek-v4-pro'),{code:'DEEPSEEK_INVALID_RESPONSE'});
  assert.deepEqual(projectDeepSeekResult({state:'provider_error',httpStatus:401,extra:'discard'},'deepseek-flash'),{state:'provider_error',provider:'deepseek',httpStatus:401});
});
test('provisioning receipts never publish arbitrary fields',()=>{
  assert.deepEqual(projectReceipt({state:'verified',models:['deepseek-flash','unknown'],extra:'discard'}),{schema:'vivim.provider-credential-receipt/1',provider:'deepseek',state:'verified',credentialRef:'local:deepseek:dpapi-current-user',models:['deepseek-flash'],baseUrl:'https://api.deepseek.com'});
  assert.throws(()=>projectReceipt({state:'verified',models:[]}),{code:'PROVISION_MODELS_UNVERIFIED'});
});
// Only enable with an owner-authorized enrolled test account. One bounded billable call.
test('live DeepSeek inference', {skip:process.env.VIVIM_DEEPSEEK_LIVE_TEST!=='1'}, async()=>{
  const result=await executeDeepSeek({messages:[{role:'user',content:'Reply with exactly OK.'}],maxTokens:8});
  assert.equal(result.state,'completed');
  assert.equal(result.content.trim(),'OK');
});

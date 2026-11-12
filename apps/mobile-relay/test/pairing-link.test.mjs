import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePairFragment,redeemDevicePairToken} from '../pairing-link.mjs';
test('QR fragments are recognized, Share fragments are never consumed as pairing',()=>{
  const token='a'.repeat(64);
  assert.deepEqual(parsePairFragment('#'+token),{type:'device',token});
  assert.deepEqual(parsePairFragment('#ask=hello'),{type:'none'});
  assert.deepEqual(parsePairFragment('#%XX'),{type:'invalid'});
});
test('one-use enrollment posts exactly once to the Direct pair endpoint',async()=>{
  const token='b'.repeat(64),calls=[];
  const answer=await redeemDevicePairToken(token,{direct:true,fetchImpl:async(url,options)=>{
    calls.push({url,options});return {ok:true,status:202,json:async()=>({paired:false,enrollmentRequired:true,challengeId:'challenge-123'})};
  }});
  assert.equal(answer.paired,false);assert.equal(answer.status,'enrollment_required');assert.equal(answer.challengeId,'challenge-123');assert.equal(calls.length,1);
  assert.equal(calls[0].url,'/mobile/api/pair');
  assert.deepEqual(JSON.parse(calls[0].options.body),{token});
});
test('refuses non-Direct use and expired codes',async()=>{
  const token='c'.repeat(64);
  await assert.rejects(()=>redeemDevicePairToken(token,{direct:false,fetchImpl:()=>{throw Error('Unexpected fetch');}}),/private/);
  await assert.rejects(()=>redeemDevicePairToken(token,{direct:true,fetchImpl:async()=>({
    ok:false,status:410,json:async()=>({error:'TOKEN_EXPIRED'})
  })}),/expired/);
});

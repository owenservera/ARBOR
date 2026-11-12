import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createPhoneDeliveryAcks} from '../conversations/phone-delivery-acks.mjs';

const commandId='cmd-'+ 'a'.repeat(16);
const messageId='msg-'+ 'a'.repeat(16);
const conversationId='c-'+ 'b'.repeat(16);
const deviceId='c'.repeat(32);
const args={commandId,messageId,conversationId,deviceId,replyRevision:7};
function fixture(t){
  const root=mkdtempSync(path.join(os.tmpdir(),'vivim-phone-ack-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  return {root,store:createPhoneDeliveryAcks({dataRoot:root})};
}
test('exact paired-device render receipt is durable, metadata-only and idempotent',async t=>{
  const {root,store}=fixture(t);
  const first=store.put(args);
  assert.equal(first.replayed,false);
  const again=store.put(args);
  assert.equal(again.replayed,true);
  assert.deepEqual(first.proof,again.proof);
  const receipt={kind:'delivery.acked',...args,...first.proof};
  assert.equal((await store.verify(receipt)).verified,true);
  assert.equal((await store.verify({...receipt,sourceRevision:8})).verified,false);
  assert.equal((await store.verify({...receipt,evidenceDigest:'0'.repeat(64)})).verified,false);
  assert.throws(()=>store.put({...args,deviceId:'d'.repeat(32)}),
    /PHONE_ACK_CONFLICT/);
  assert.throws(()=>store.put({...args,replyRevision:8}),
    /PHONE_ACK_CONFLICT/);
  const text=readFileSync(path.join(root,'phone-render-acks',commandId+'.json'),'utf8');
  assert.ok(!text.includes('reply text'));
  assert.ok(!text.includes('private prompt'));
});
test('altered render receipt fails closed without rewriting it',async t=>{
  const {root,store}=fixture(t);
  store.put(args);
  const file=path.join(root,'phone-render-acks',commandId+'.json');
  const changed=JSON.parse(readFileSync(file,'utf8'));
  changed.replyRevision=99;
  writeFileSync(file,JSON.stringify(changed));
  assert.throws(()=>store.load(commandId),/PHONE_ACK_SOURCE_INVALID/);
  assert.equal((await store.verify({kind:'delivery.acked',
    ...args,...store.proof({...args,observedAt:new Date().toISOString(),
      schema:'vivim.phone-render-ack/1'})})).verified,false);
  assert.throws(()=>store.put(args),/PHONE_ACK_SOURCE_INVALID/);
});

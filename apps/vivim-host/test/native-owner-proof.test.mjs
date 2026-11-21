import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { nativeOwnerProof, NATIVE_OWNER_PROOF_SCHEMA } from '../bootstrap/native-owner-proof.mjs';
import { createHostServer } from '../server.mjs';

test('owner proof is a bound HMAC and never returns an owner token', () => {
  const key = randomBytes(32).toString('base64url');
  const nonce = randomBytes(32).toString('hex');
  const result = nativeOwnerProof(nonce, key);
  assert.deepEqual(Object.keys(result).sort(), ['challenge','mac','schema']);
  assert.equal(result.schema, NATIVE_OWNER_PROOF_SCHEMA);
  assert.equal(result.challenge, nonce);
  assert.equal(result.mac, createHmac('sha256',key)
    .update(NATIVE_OWNER_PROOF_SCHEMA+'\\n'+nonce).digest('hex'));
  assert.ok(!JSON.stringify(result).includes(key));
  assert.notEqual(nativeOwnerProof(randomBytes(32).toString('hex'),key).mac,result.mac);
  for (const challenge of ['', 'a'.repeat(63), '../owner-token', 'A'.repeat(64)]) {
    assert.throws(() => nativeOwnerProof(challenge,key),/HOST_PROOF_INPUT_INVALID/);
  }
  assert.throws(() => nativeOwnerProof(nonce,'too-short'),/HOST_PROOF_INPUT_INVALID/);
});
test('localhost native owner proof route is inert and rejects malformed requests', async t => {
  const root=mkdtempSync(path.join(os.tmpdir(),'vivim-native-owner-proof-'));
  const key=randomBytes(32).toString('base64url');
  const server=createHostServer({dataRoot:root,ownerToken:key});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{
    await new Promise(resolve=>server.close(resolve));
    rmSync(root,{recursive:true,force:true,maxRetries:10,retryDelay:100});
  });
  const base='http://127.0.0.1:'+server.address().port;
  const nonce=randomBytes(32).toString('hex');
  const ok=await fetch(base+'/api/host/native-owner-proof?challenge='+nonce,{cache:'no-store'});
  assert.equal(ok.status,200);
  assert.deepEqual(await ok.json(),nativeOwnerProof(nonce,key));
  assert.equal(ok.headers.get('cache-control'),'no-store');
  for(const suffix of ['','?challenge=no','?challenge='+nonce+'&extra=1','?challenge='+nonce+'&challenge='+nonce]){
    const bad=await fetch(base+'/api/host/native-owner-proof'+suffix);
    assert.equal(bad.status,400);
  }
  const post=await fetch(base+'/api/host/native-owner-proof?challenge='+nonce,{method:'POST'});
  assert.equal(post.status,405);
  const foreign=await fetch(base+'/api/host/native-owner-proof?challenge='+nonce,
    {headers:{Host:'example.invalid'}});
  assert.equal(foreign.status,403);
});

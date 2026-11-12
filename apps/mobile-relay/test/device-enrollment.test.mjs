import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { enrollWithChallenge, resumeDeviceSession, clearDeviceEnrollment } from '../device-enrollment.mjs';

test('signed QR enrollment stays pending; PC approval enables an ephemeral session', async (t) => {
  const originals = Object.fromEntries(['crypto','fetch','location','localStorage','VivimDeviceKey'].map(k=>[k,globalThis[k]]));
  t.after(() => { for (const [k,v] of Object.entries(originals)) {
    if (v === undefined) delete globalThis[k]; else Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true});
  } });
  const entries = new Map();
  const origin = 'https://phone.example.ts.net';
  const grantId = 'a'.repeat(32), sessionId = 'b'.repeat(32);
  let approved = false, issued = 0;
  const set = (k,v) => Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});
  set('crypto',webcrypto);
  set('location',{origin});
  set('localStorage',{getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v),removeItem:k=>entries.delete(k)});
  set('VivimDeviceKey',{publicKeyPem:async()=> 'PUBLIC_KEY',signEnrollment:async()=> 'SIGNED_ENROLLMENT',signSession:async()=> 'SIGNED_SESSION'});
  set('fetch',async (url,options) => {
    const body=options.body ? JSON.parse(options.body) : {};
    let payload;
    if (url.includes('prove')) {
      assert.equal(body.signature,'SIGNED_ENROLLMENT');
      assert.deepEqual(body.requestedScopes,['relay:read','relay:write','control:read','control:execute']);
      payload={grantId,status:'pending'};
    } else if (url.includes('grant-status')) payload={grantId,status:approved?'active':'pending'};
    else if (url.includes('session')) {
      assert.equal(body.deviceKeyProof,'SIGNED_SESSION');issued++;
      payload={grantId,sessionId,expiresAt:Date.now()+3600000,scopes:['relay:read']};
    } else throw new Error('Unexpected URL: '+url);
    return {ok:true,json:async()=>payload};
  });
  const transport={direct:true,setDeviceSession:v=>{transport.current=v;}};
  const challenge={challengeId:'c',challenge:'d',nonce:'e',origin,user:'owner@example.com'};
  await enrollWithChallenge(challenge);
  assert.equal((await resumeDeviceSession(transport)).status,'pending');
  assert.equal(issued,0);
  approved=true;
  assert.equal((await resumeDeviceSession(transport)).status,'active');
  assert.equal(issued,1);
  assert.equal(transport.current.sessionId,sessionId);
  assert.ok(!JSON.stringify([...entries]).includes(sessionId));
  clearDeviceEnrollment(transport);
  assert.equal(transport.current,null);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto, createPublicKey, verify } from 'node:crypto';
import { prepareDeviceSigner, enrollWithChallenge, resumeDeviceSession } from '../device-enrollment.mjs';

function fakeIndexedDB() {
  const records = new Map();
  const db = { objectStoreNames: {contains:()=>true}, close() {}, transaction() {
    const tx = {};
    tx.objectStore = () => ({
      get(k) { const r={}; queueMicrotask(()=>{r.result=records.get(k);r.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.())});return r; },
      put(v,k) { records.set(k,v); }
    });
    return tx;
  }};
  return { open() { const r={};queueMicrotask(()=>{r.result=db;r.onsuccess?.()});return r; },records };
}
function globals(t) {
  const names=['crypto','indexedDB','isSecureContext','localStorage','location','fetch','VivimDeviceKey'];
  const originals=Object.fromEntries(names.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
  t.after(()=>{for(const k of names){const x=originals[k];if(x) Object.defineProperty(globalThis,k,x);else delete globalThis[k]}});
  const set=(k,v)=>Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true});
  const values=new Map();
  set('crypto',webcrypto);set('indexedDB',fakeIndexedDB());set('isSecureContext',true);
  set('localStorage',{setItem:(k,v)=>values.set(k,String(v)),getItem:k=>values.get(k)??null,removeItem:k=>values.delete(k)});
  set('location',{origin:'https://pc.example.ts.net'});delete globalThis.VivimDeviceKey;
  return {values,set};
}
const check=(pem,msg,sig)=>verify('sha256',Buffer.from(msg),createPublicKey(pem),Buffer.from(sig,'base64'));

test('browser Direct Host proof -> pending PC grant -> approved session, then revocation',async t=>{
  const {values,set}=globals(t);
  const grantId='a'.repeat(32),sessionId='b'.repeat(32);
  const challenge={challengeId:'id',challenge:'challenge',nonce:'servernonce',origin:location.origin,user:'owner'};
  let state='pending',pub,sessionAttempts=0,proveAttempts=0;
  set('fetch',async (url,options)=>{
    let out;
    const b=options.body?JSON.parse(options.body):null;
    if(url.endsWith('/prove')){
      proveAttempts++;
      assert.equal(b.signedTranscript,['vivim-enrollment-v1','id','challenge','servernonce',location.origin,'owner'].join('\\n'));
      assert.equal(check(b.publicKeyPem,b.signedTranscript,b.signature),true);
      assert.deepEqual(b.requestedScopes,['relay:read','relay:write','control:read','control:execute']);
      pub=b.publicKeyPem;out={grantId,status:'pending'};
    }else if(url.includes('grant-status')) out={grantId,status:state};
    else if(url.endsWith('/session')){
      sessionAttempts++;
      assert.equal(state,'active');
      const signed=['vivim-session-v1',grantId,b.nonce,String(b.timestamp),location.origin,'owner'].join('\\n');
      assert.equal(check(pub,signed,b.deviceKeyProof),true);
      out={grantId,sessionId,expiresAt:Date.now()+100000,scopes:['relay:read']};
    }else throw new Error('Unexpected route '+url);
    return {ok:true,status:200,json:async()=>out};
  });
  const signer=await prepareDeviceSigner();
  assert.equal(signer.kind,'browser');
  await enrollWithChallenge(challenge,{signer});
  assert.equal(proveAttempts,1);
  assert.equal(JSON.parse(values.get('vivim.device.grant.v1')).kind,'browser');
  assert.equal(values.has('vivim.device.storage.probe'),false);
  const transport={direct:true,current:null,setDeviceSession(v){this.current=v}};
  assert.equal((await resumeDeviceSession(transport)).status,'pending');
  assert.equal(sessionAttempts,0);
  state='active';
  assert.equal((await resumeDeviceSession(transport)).status,'active');
  assert.equal(sessionAttempts,1);assert.equal(transport.current.sessionId,sessionId);
  assert.equal([...values.values()].some(x=>x.includes(sessionId)),false,'session bearer never persists');
  state='revoked';
  assert.equal((await resumeDeviceSession(transport)).status,'revoked');
  assert.equal(transport.current,null);
  assert.equal(values.has('vivim.device.grant.v1'),false);
});

test('unsupported browser and broken Android bridge fail before Host enrollment proof',async t=>{
  const {set}=globals(t);let calls=0;set('fetch',async()=>{calls++;throw Error('must not fetch')});
  set('isSecureContext',false);
  await assert.rejects(prepareDeviceSigner(),/SECURE_BROWSER_DEVICE_CRYPTO_REQUIRED/);
  assert.equal(calls,0);
  set('isSecureContext',true);
  set('VivimDeviceKey',{publicKeyPem:()=> 'incomplete'});
  await assert.rejects(prepareDeviceSigner(),/Android app is required/);
  assert.equal(calls,0);
});

test('native signer remains selected when Android bridge is complete',async t=>{
  const {set}=globals(t);
  set('VivimDeviceKey',{publicKeyPem:async()=> 'PEM',signEnrollment:async()=> 'NATIVE1',signSession:async()=> 'NATIVE2'});
  const signer=await prepareDeviceSigner();
  assert.equal(signer.kind,'native');assert.equal(await signer.signSession(),'NATIVE2');
});

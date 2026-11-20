# File: apps/mobile-relay/test/browser-enrollment-flow.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/browser-enrollment-flow.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5814 B |
| Lines | 104 |
| Hash | 8776a1d3221a |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fakeIndexedDB | function | 6 | no | function fakeIndexedDB() { |
| records | const | 7 | no | const records = new Map(); |
| db | const | 8 | no | const db = { objectStoreNames: {contains:()=&gt;true}, close() {}, transaction() { |
| tx | const | 9 | no | const tx = {}; |
| globals | function | 18 | no | function globals(t) { |
| names | const | 19 | no | const names=[&#39;crypto&#39;,&#39;indexedDB&#39;,&#39;isSecureContext&#39;,&#39;localStorage&#39;,&#39;location&#39;,&#39;fetch&#39;,&#39;VivimDeviceKey&#39;]; |
| originals | const | 20 | no | const originals=Object.fromEntries(names.map(k=&gt;[k,Object.getOwnPropertyDescriptor(globalThis,k)])); |
| set | function | 22 | no | const set=(k,v)=&gt;Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true}); |
| values | const | 23 | no | const values=new Map(); |
| check | function | 29 | no | const check=(pem,msg,sig)=&gt;verify(&#39;sha256&#39;,Buffer.from(msg),createPublicKey(pem),Buffer.from(sig,&#39;base64&#39;)); |
| grantId | const | 33 | no | const grantId=&#39;a&#39;.repeat(32),sessionId=&#39;b&#39;.repeat(32); |
| challenge | const | 34 | no | const challenge={challengeId:&#39;id&#39;,challenge:&#39;challenge&#39;,nonce:&#39;servernonce&#39;,origin:location.origin,user:&#39;owner&#39;}; |
| state | variable | 35 | no | let state=&#39;pending&#39;,pub,sessionAttempts=0,proveAttempts=0; |
| out | variable | 37 | no | let out; |
| b | const | 38 | no | const b=options.body?JSON.parse(options.body):null; |
| signed | const | 49 | no | const signed=[&#39;vivim-session-v1&#39;,grantId,b.nonce,String(b.timestamp),location.origin,&#39;owner&#39;].join(&#39;\\\\n&#39;); |
| signer | const | 55 | no | const signer=await prepareDeviceSigner(); |
| transport | const | 61 | no | const transport={direct:true,current:null,setDeviceSession(v){this.current=v}}; |
| signer | const | 88 | no | const signer=await prepareDeviceSigner(); |
| grantId | const | 94 | no | const grantId=&#39;c&#39;.repeat(32); |
| sessions | variable | 96 | no | let sessions=0; |
| transport | const | 101 | no | const transport={direct:true,setDeviceSession(){throw Error(&#39;Must not set session&#39;);}}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:crypto | import | 3 | external |
| ../device-enrollment.mjs | import | 4 | [apps/mobile-relay/device-enrollment.mjs](../device-enrollment.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 105 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

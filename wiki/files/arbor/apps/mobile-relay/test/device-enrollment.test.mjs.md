# File: apps/mobile-relay/test/device-enrollment.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/device-enrollment.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2675 B |
| Lines | 46 |
| Hash | 6aef2c2acfd8 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| originals | const | 7 | no | const originals = Object.fromEntries([&#39;crypto&#39;,&#39;fetch&#39;,&#39;location&#39;,&#39;localStorage&#39;,&#39;VivimDeviceKey&#39;].map(k=&gt;[k,globalThis[k]])); |
| entries | const | 11 | no | const entries = new Map(); |
| origin | const | 12 | no | const origin = &#39;https://phone.example.ts.net&#39;; |
| grantId | const | 13 | no | const grantId = &#39;a&#39;.repeat(32), sessionId = &#39;b&#39;.repeat(32); |
| approved | variable | 14 | no | let approved = false, issued = 0; |
| set | function | 15 | no | const set = (k,v) =&gt; Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true}); |
| body | const | 21 | no | const body=options.body ? JSON.parse(options.body) : {}; |
| payload | variable | 22 | no | let payload; |
| transport | const | 34 | no | const transport={direct:true,setDeviceSession:v=&gt;{transport.current=v;}}; |
| challenge | const | 35 | no | const challenge={challengeId:&#39;c&#39;,challenge:&#39;d&#39;,nonce:&#39;e&#39;,origin,user:&#39;owner@example.com&#39;}; |

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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

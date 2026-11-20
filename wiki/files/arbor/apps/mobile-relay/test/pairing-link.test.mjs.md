# File: apps/mobile-relay/test/pairing-link.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/pairing-link.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1543 B |
| Lines | 25 |
| Hash | 139ba9f24484 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| token | const | 5 | no | const token=&#39;a&#39;.repeat(64); |
| token | const | 11 | no | const token=&#39;b&#39;.repeat(64),calls=[]; |
| answer | const | 12 | no | const answer=await redeemDevicePairToken(token,{direct:true,fetchImpl:async(url,options)=&gt;{ calls.push({url,options});return {ok:true,status:202,json:async()=&gt;({paired:false,enrollmentRequired:true,c… |
| token | const | 20 | no | const token=&#39;c&#39;.repeat(64); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../pairing-link.mjs | import | 3 | [apps/mobile-relay/pairing-link.mjs](../pairing-link.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

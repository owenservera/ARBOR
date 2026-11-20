# File: apps/vivim-host/test/media-stream-guard.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/media-stream-guard.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2076 B |
| Lines | 47 |
| Hash | c539a061d893 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sink | function | 7 | no | function sink(onChunk = () =&gt; {}) { |
| checks | variable | 13 | no | let checks=0,bytes=0; |
| gate | const | 14 | no | const gate=createMediaStreamGrantGuard({ grantId:&#39;grant&#39;,sessionId:&#39;session&#39;,now:()=&gt;1000, validateGrant({grantId,sessionId}) { assert.equal(grantId,&#39;grant&#39;);assert.equal(sessionId,&#39;session&#39;); checks… |
| revoked | variable | 27 | no | let revoked=false,delivered=0; |
| gate | const | 28 | no | const gate=createMediaStreamGrantGuard({ grantId:&#39;grant&#39;,sessionId:&#39;session&#39;,now:()=&gt;1000, validateGrant() { if(revoked)throw Object.assign(new Error(&#39;GRANT_REVOKED&#39;),{status:403}); return {scopes:[&#39;… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:stream | import | 3 | external |
| node:stream/promises | import | 4 | external |
| ../media/stream-guard.mjs | import | 5 | [apps/vivim-host/media/stream-guard.mjs](../media/stream-guard.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createMediaStreamGrantGuard } from '../media/stream-guard.mjs';

function sink(onChunk = () => {}) {
  return new Writable({write(chunk,encoding,callback) {
    try { onChunk(chunk); callback(); } catch(error) { callback(error); }
  }});
}
test('stream guard permits only live Host control:read grants and checks final chunk', async()=>{
  let checks=0,bytes=0;
  const gate=createMediaStreamGrantGuard({
    grantId:'grant',sessionId:'session',now:()=>1000,
    validateGrant({grantId,sessionId}) {
      assert.equal(grantId,'grant');assert.equal(sessionId,'session');
      checks++;return {scopes:['control:read']};
    }
  });
  await pipeline(Readable.from(Array.from({length:8},()=>Buffer.alloc(64*1024))),
    gate,sink(chunk=>{bytes+=chunk.length;}));
  assert.equal(bytes,8*64*1024);
  assert.ok(checks>=3,'periodic checks and final check must run');
});
test('revoking during a stream terminates it before all bytes are delivered',async()=>{
  let revoked=false,delivered=0;
  const gate=createMediaStreamGrantGuard({
    grantId:'grant',sessionId:'session',now:()=>1000,
    validateGrant() {
      if(revoked)throw Object.assign(new Error('GRANT_REVOKED'),{status:403});
      return {scopes:['control:read']};
    }
  });
  await assert.rejects(pipeline(Readable.from(Array.from({length:12},()=>Buffer.alloc(64*1024))),
    gate,sink(chunk=>{
      delivered+=chunk.length;
      if(delivered>=3*64*1024)revoked=true;
    })),/GRANT_REVOKED/);
  assert.ok(delivered<12*64*1024,'a revoked grant cannot stream the remaining file');
});
test('a valid device without media read scope is always refused',async()=>{
  await assert.rejects(pipeline(Readable.from([Buffer.alloc(2)]),
    createMediaStreamGrantGuard({
      grantId:'g',sessionId:'s',validateGrant:()=>({scopes:['relay:write']})
    }),sink()),/MEDIA_STREAM_SCOPE_DENIED/);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

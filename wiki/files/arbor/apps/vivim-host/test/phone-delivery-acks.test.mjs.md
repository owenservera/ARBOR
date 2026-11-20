# File: apps/vivim-host/test/phone-delivery-acks.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/phone-delivery-acks.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2406 B |
| Lines | 49 |
| Hash | 2bfb2ae90dd3 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| commandId | const | 8 | no | const commandId=&#39;cmd-&#39;+ &#39;a&#39;.repeat(16); |
| messageId | const | 9 | no | const messageId=&#39;msg-&#39;+ &#39;a&#39;.repeat(16); |
| conversationId | const | 10 | no | const conversationId=&#39;c-&#39;+ &#39;b&#39;.repeat(16); |
| deviceId | const | 11 | no | const deviceId=&#39;c&#39;.repeat(32); |
| args | const | 12 | no | const args={commandId,messageId,conversationId,deviceId,replyRevision:7}; |
| fixture | function | 13 | no | function fixture(t){ |
| root | const | 14 | no | const root=mkdtempSync(path.join(os.tmpdir(),&#39;vivim-phone-ack-&#39;)); |
| first | const | 20 | no | const first=store.put(args); |
| again | const | 22 | no | const again=store.put(args); |
| receipt | const | 25 | no | const receipt={kind:&#39;delivery.acked&#39;,...args,...first.proof}; |
| text | const | 33 | no | const text=readFileSync(path.join(root,&#39;phone-render-acks&#39;,commandId+&#39;.json&#39;),&#39;utf8&#39;); |
| file | const | 40 | no | const file=path.join(root,&#39;phone-render-acks&#39;,commandId+&#39;.json&#39;); |
| changed | const | 41 | no | const changed=JSON.parse(readFileSync(file,&#39;utf8&#39;)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../conversations/phone-delivery-acks.mjs | import | 6 | [apps/vivim-host/conversations/phone-delivery-acks.mjs](../conversations/phone-delivery-acks.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

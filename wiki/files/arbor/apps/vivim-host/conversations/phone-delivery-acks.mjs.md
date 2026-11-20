# File: apps/vivim-host/conversations/phone-delivery-acks.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/conversations/phone-delivery-acks.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4557 B |
| Lines | 92 |
| Hash | ded729f43c1e |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CMD | const | 9 | no | const CMD=/^cmd-[a-f0-9]{16}$/; |
| MSG | const | 10 | no | const MSG=/^msg-[a-f0-9]{16}$/; |
| CONV | const | 11 | no | const CONV=/^c-[a-f0-9]{16}$/; |
| DEVICE | const | 12 | no | const DEVICE=/^[a-f0-9]{32}$/; |
| error | function | 13 | no | const error=code=&gt;Object.assign(new Error(code),{code}); |
| digest | function | 14 | no | const digest=x=&gt;createHash(&#39;sha256&#39;).update(JSON.stringify(x)).digest(&#39;hex&#39;); |
| createPhoneDeliveryAcks | function | 15 | yes | export function createPhoneDeliveryAcks({dataRoot}={}) { |
| dir | const | 17 | no | const dir=path.join(dataRoot,&#39;phone-render-acks&#39;); |
| fileFor | function | 18 | no | const fileFor=commandId=&gt;{ |
| shape | function | 22 | no | const shape=r=&gt;r&amp;&amp;r.schema===&#39;vivim.phone-render-ack/1&#39;&amp;&amp;CMD.test(r.commandId)&amp;&amp; |
| load | function | 26 | no | const load=commandId=&gt;{ |
| file | const | 27 | no | const file=fileFor(commandId); |
| raw | variable | 28 | no | let raw; |
| stat | const | 30 | no | const stat=fs.lstatSync(file); |
| saved | variable | 35 | no | let saved; |
| proof | function | 42 | no | const proof=record=&gt;({ source:&#39;phone&#39;,sourceRef:&#39;phone-ack-&#39;+record.commandId, sourceRevision:record.replyRevision,evidenceDigest:digest(record) }); |
| put | function | 46 | no | function put({commandId,messageId,conversationId,deviceId,replyRevision}={}) { |
| body | const | 47 | no | const body={schema:&#39;vivim.phone-render-ack/1&#39;,commandId,messageId, |
| existing | const | 50 | no | const existing=load(commandId); |
| dest | const | 58 | no | const dest=fileFor(commandId),temp=dest+&#39;.&#39;+randomBytes(8).toString(&#39;hex&#39;)+&#39;.tmp&#39;; |
| concurrent | const | 64 | no | const concurrent=load(commandId); |
| verify | function | 77 | no | async function verify(observation){ |
| evidence | const | 85 | no | const evidence=proof(record); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 5 | external |
| node:path | import | 6 | external |
| node:crypto | import | 7 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/conversations/live-projection.mjs](./live-projection.mjs.md) | ./phone-delivery-acks.mjs |
| [apps/vivim-host/test/phone-delivery-acks.test.mjs](../test/phone-delivery-acks.test.mjs.md) | ../conversations/phone-delivery-acks.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Host-owned, metadata-only evidence for a paired phone actually rendering a
// verified reply. The device's authenticated request is the source observation;
// this file is its durable receipt. NOT proof a human read the reply.
// A reply fetch or completed bridge command NEVER creates this receipt.
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomBytes} from 'node:crypto';

const CMD=/^cmd-[a-f0-9]{16}$/;
const MSG=/^msg-[a-f0-9]{16}$/;
const CONV=/^c-[a-f0-9]{16}$/;
const DEVICE=/^[a-f0-9]{32}$/;
const error=code=>Object.assign(new Error(code),{code});
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function createPhoneDeliveryAcks({dataRoot}={}) {
  if(!path.isAbsolute(dataRoot??''))throw error('PHONE_ACK_ROOT_INVALID');
  const dir=path.join(dataRoot,'phone-render-acks');
  const fileFor=commandId=>{
    if(!CMD.test(commandId??''))throw error('PHONE_ACK_ID_INVALID');
    return path.join(dir,commandId+'.json');
  };
  const shape=r=>r&&r.schema==='vivim.phone-render-ack/1'&&CMD.test(r.commandId)&&
    MSG.test(r.messageId)&&CONV.test(r.conversationId)&&DEVICE.test(r.deviceId)&&
    Number.isSafeInteger(r.replyRevision)&&r.replyRevision>0&&
    typeof r.observedAt==='string'&&Number.isFinite(Date.parse(r.observedAt));
  const load=commandId=>{
    const file=fileFor(commandId);
    let raw;
    try{
      const stat=fs.lstatSync(file);
      if(!stat.isFile()||stat.isSymbolicLink()||stat.size>4096)
        throw error('PHONE_ACK_SOURCE_INVALID');
      raw=fs.readFileSync(file,'utf8');
    }catch(e){if(e.code==='ENOENT')return null;throw error('PHONE_ACK_SOURCE_INVALID');}
    let saved;
    try{saved=JSON.parse(raw);}catch{throw error('PHONE_ACK_SOURCE_INVALID');}
    const {integrity,...data}=saved??{};
    if(!shape(data)||data.commandId!==commandId||integrity!==digest(data))
      throw error('PHONE_ACK_SOURCE_INVALID');
    return data;
  };
  const proof=record=>({
    source:'phone',sourceRef:'phone-ack-'+record.commandId,
    sourceRevision:record.replyRevision,evidenceDigest:digest(record)
  });
  function put({commandId,messageId,conversationId,deviceId,replyRevision}={}) {
    const body={schema:'vivim.phone-render-ack/1',commandId,messageId,
      conversationId,deviceId,replyRevision,observedAt:new Date().toISOString()};
    if(!shape(body))throw error('PHONE_ACK_FIELDS_INVALID');
    const existing=load(commandId);
    if(existing){
      if(existing.messageId!==messageId||existing.conversationId!==conversationId||
          existing.deviceId!==deviceId||existing.replyRevision!==replyRevision)
        throw error('PHONE_ACK_CONFLICT');
      return {record:existing,replayed:true,proof:proof(existing)};
    }
    fs.mkdirSync(dir,{recursive:true,mode:0o700});
    const dest=fileFor(commandId),temp=dest+'.'+randomBytes(8).toString('hex')+'.tmp';
    try{
      fs.writeFileSync(temp,JSON.stringify({...body,integrity:digest(body)}),{flag:'wx',mode:0o600});
      try{fs.linkSync(temp,dest);}
      catch(e) {
        if(e.code==='EEXIST') {
          const concurrent=load(commandId);
          if(concurrent?.deviceId===deviceId&&
             concurrent.messageId===messageId&&concurrent.conversationId===conversationId&&
             concurrent.replyRevision===replyRevision)
            return {record:concurrent,replayed:true,proof:proof(concurrent)};
          throw error('PHONE_ACK_CONFLICT');
        }
        // No unsafe non-atomic fallback if hardlinks are unavailable.
        throw error('PHONE_ACK_PERSISTENCE_UNAVAILABLE');
      }
    }finally{try{fs.unlinkSync(temp);}catch(e){if(e.code!=='ENOENT')throw e;}}
    return {record:body,replayed:false,proof:proof(body)};
  }
  async function verify(observation){
    if(observation?.source!=='phone'||!CMD.test(observation.commandId??''))
      return {verified:false};
    let record;
```

_First 80 of 93 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

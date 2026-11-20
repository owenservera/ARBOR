# File: apps/vivim-host/corpus/transport/protocol.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | apps/vivim-host/corpus/transport/protocol.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12261 B |
| Lines | 178 |
| Hash | 9c81ad93cd6b |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sha | function | 9 | no | const sha = b =&gt; createHash(&#39;sha256&#39;).update(b).digest(&#39;hex&#39;); |
| sort | function | 10 | no | const sort = x =&gt; Array.isArray(x) ? x.map(sort) : x &amp;&amp; typeof x === &#39;object&#39; ? |
| auth | const | 12 | no | const auth={grantId:&#39;grant-1&#39;,sessionId:&#39;session-1&#39;}; |
| makeCapture | function | 13 | no | function makeCapture(index, bytes=Buffer.from(&#39;some original evidence &#39;+index)) { |
| eventId | const | 14 | no | const eventId=&#39;evt-testcase&#39;+String(index).padStart(4,&#39;0&#39;); |
| assetId | const | 15 | no | const assetId=&#39;asset-testcase&#39;+String(index).padStart(4,&#39;0&#39;); |
| bytesFor | function | 23 | no | const bytesFor = index =&gt; Buffer.from(&#39;some original evidence &#39;+index); |
| fakeValidate | function | 24 | no | const fakeValidate = e =&gt; ({ok:e?.schema===&#39;vivim.corpus-intake/1&#39; &amp;&amp; e?.policy?.ownerInitiated===true &amp;&amp; e?.source?.publicUri===null &amp;&amp; typeof e.eventId===&#39;string&#39; &amp;&amp; (typeof e.asset?.sha256===&#39;stri… |
| fakeCanon | function | 28 | no | const fakeCanon = e=&gt;({ok:true,json:JSON.stringify(sort(e))}); |
| fixture | function | 29 | no | function fixture(t) { |
| dir | const | 30 | no | const dir=mkdtempSync(path.join(tmpdir(),&#39;vivim-w5a-&#39;)); |
| revoked | variable | 32 | no | let revoked=false, approved=true, receivingCalls=0, afterAccept=false, moment=Date.parse(&#39;2026-11-06T10:00:00Z&#39;); |
| receiverPath | const | 33 | no | const receiverPath=path.join(dir,&#39;receiver.json&#39;); |
| readReceiver | function | 34 | no | const readReceiver=()=&gt;{try{return JSON.parse(readFileSync(receiverPath,&#39;utf8&#39;));}catch(e){if(e.code===&#39;ENOENT&#39;)return {};throw e;}}; |
| accept | function | 35 | no | const accept = async ({envelope,eventDigest,expectedSha256,stagePath,idempotencyKey}) =&gt; { |
| prior | const | 37 | no | const prior=readReceiver(); |
| receipt | const | 43 | no | const receipt={durable:true,worldId:envelope.worldId,eventId:envelope.eventId,digest:eventDigest, |
| fd | const | 46 | no | const fd=openSync(receiverPath,&#39;w&#39;,0o600); |
| params | const | 51 | no | const params={dataRoot:dir,validateCapture:fakeValidate,canonicalCapture:fakeCanon, |
| scope | function | 64 | no | async function scope(h,p,events,ttlMs=60000){return p.issueScope({auth:h.auth,events,ttlMs});} |
| pos | function | 65 | no | const pos=(h,p,s,e)=&gt;p.inspect({auth:h.auth,scopeId:s.scopeId,eventId:e.eventId}); |
| push | function | 66 | no | const push=(h,p,s,e,offset,chunk)=&gt;p.pushChunk({auth:h.auth,scopeId:s.scopeId,eventId:e.eventId,offset,chunk}); |
| finish | function | 67 | no | const finish=(h,p,s,e)=&gt;p.finalize({auth:h.auth,scopeId:s.scopeId,eventId:e.eventId}); |
| code | function | 68 | no | const code=(value,expected)=&gt;assert.equal(value.code,expected); |
| h | const | 71 | no | const h=fixture(t), p=h.open();const es=Array.from({length:10},(_,i)=&gt;makeCapture(i)); |
| s | const | 73 | no | const s=await scope(h,p,es);assert.equal(s.events.length,10); |
| e | const | 75 | no | const e=es[i],buf=bytesFor(i); |
| another | const | 82 | no | const another=await scope(h,p,es); |
| h | const | 87 | no | const h=fixture(t),p=h.open(),e=makeCapture(41),s=await scope(h,p,[e]),b=bytesFor(41); |
| h | const | 97 | no | const h=fixture(t),p=h.open(),e=makeCapture(42),s=await scope(h,p,[e]),b=Buffer.from(bytesFor(42)); |
| h | const | 103 | no | const h=fixture(t),p=h.open(),e=makeCapture(43);await scope(h,p,[e]); |
| changed | const | 104 | no | const changed=structuredClone(e);changed.title=&#39;different claim&#39;; |
| changed2 | const | 106 | no | const changed2=structuredClone(e);changed2.asset.sha256=sha(&#39;other&#39;); |
| h | const | 110 | no | const h=fixture(t),p=h.open(),e=makeCapture(44),s=await scope(h,p,[e]),b=bytesFor(44); |
| newP | const | 115 | no | const newP=h.open();h.deny(); |
| h | const | 119 | no | const h=fixture(t),p=h.open(),e=makeCapture(46),s=await scope(h,p,[e]),b=bytesFor(46); |
| stageDir | const | 121 | no | const stageDir=path.join(h.dir,&#39;corpus-transfer-v1&#39;,&#39;staging&#39;); |
| file | const | 122 | no | const file=(await import(&#39;node:fs&#39;)).readdirSync(stageDir)[0]; |
| recovered | const | 124 | no | const recovered=h.open(); |
| h | const | 131 | no | const h=fixture(t),p=h.open(),e=makeCapture(47),s=await scope(h,p,[e]),b=bytesFor(47); |
| afterRestart | const | 135 | no | const afterRestart=h.open(); |
| h | const | 142 | no | const h=fixture(t),p=h.open(); |
| e | const | 145 | no | const e=makeCapture(55),s=await scope(h,p,[e]); |
| a | const | 149 | no | const a=makeCapture(400),differentWorld=makeCapture(400);differentWorld.worldId=&#39;world-other&#39;; |
| sizeOne | const | 151 | no | const sizeOne=makeCapture(301),sizeTwo=makeCapture(302); |
| wrong | const | 154 | no | const wrong=structuredClone(e);wrong.asset.bytes=TRANSPORT_LIMITS.maxAssetBytes+1; |
| h | const | 158 | no | const h=fixture(t),p=h.open(),e=makeCapture(56); |
| m | const | 160 | no | const m=structuredClone(e); |
| s | const | 162 | no | const s=await scope(h,p,[m]); |
| h | const | 167 | no | const h=fixture(t); |
| h | const | 171 | no | const h=fixture(t),p=h.open(),e=makeCapture(58),s=await scope(h,p,[e]); |
| lock | const | 172 | no | const lock=path.join(h.dir,&#39;corpus-transfer-v1&#39;,&#39;writer.lock&#39;);writeFileSync(lock,&#39;unknown owner&#39;); |
| sd | const | 175 | no | const sd=path.join(h.dir,&#39;corpus-transfer-v1&#39;,&#39;staging&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| node:crypto | import | 7 | external |
| ./protocol.mjs | import | 8 | [apps/vivim-host/corpus/transport/protocol.mjs](./protocol.mjs.md) |
| node:fs | dynamic | 122 | external |
| node:fs | dynamic | 176 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, openSync, closeSync, fsyncSync,
  mkdirSync, statSync, appendFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createCorpusTransferProtocol as create, TRANSPORT_SCHEMA, TRANSPORT_LIMITS } from './protocol.mjs';
const sha = b => createHash('sha256').update(b).digest('hex');
const sort = x => Array.isArray(x) ? x.map(sort) : x && typeof x === 'object' ?
  Object.fromEntries(Object.keys(x).sort().map(k=>[k,sort(x[k])])) : x;
const auth={grantId:'grant-1',sessionId:'session-1'};
function makeCapture(index, bytes=Buffer.from('some original evidence '+index)) {
  const eventId='evt-testcase'+String(index).padStart(4,'0');
  const assetId='asset-testcase'+String(index).padStart(4,'0');
  return { schema:'vivim.corpus-intake/1', eventId, assetId, worldId:'world-local', kind:'note',
    title:'Test note '+index,capturedAt:'2026-11-05T12:00:00.000Z',
    source:{registryId:'SRC-OWNER-INPUT',mechanism:'push',surface:'desktop.note',actor:'owner',publicUri:null},
    asset:{mediaType:'text/plain',availability:'stored',contentRef:'asset:'+assetId,sha256:sha(bytes),bytes:bytes.length,role:'original'},
    policy:{purpose:'private-personal-ai',sensitivity:'S1',thirdParty:'unknown',rights:'review_required',ownerInitiated:true,grantRef:null},
    lineage:{parents:[],evidenceRefs:[]} };
}
const bytesFor = index => Buffer.from('some original evidence '+index);
const fakeValidate = e => ({ok:e?.schema==='vivim.corpus-intake/1' &&
  e?.policy?.ownerInitiated===true && e?.source?.publicUri===null &&
  typeof e.eventId==='string' && (typeof e.asset?.sha256==='string' ||
  (e.asset?.availability==='metadata_only' && e.asset?.sha256===null))});
const fakeCanon = e=>({ok:true,json:JSON.stringify(sort(e))});
function fixture(t) {
  const dir=mkdtempSync(path.join(tmpdir(),'vivim-w5a-'));
  t.after(()=>rmSync(dir,{force:true,recursive:true}));
  let revoked=false, approved=true, receivingCalls=0, afterAccept=false, moment=Date.parse('2026-11-06T10:00:00Z');
  const receiverPath=path.join(dir,'receiver.json');
  const readReceiver=()=>{try{return JSON.parse(readFileSync(receiverPath,'utf8'));}catch(e){if(e.code==='ENOENT')return {};throw e;}};
  const accept = async ({envelope,eventDigest,expectedSha256,stagePath,idempotencyKey}) => {
    receivingCalls++;
    const prior=readReceiver();
    if (prior[idempotencyKey]) {
      if (prior[idempotencyKey].digest!==eventDigest) throw new Error('receiver-conflict');
      return prior[idempotencyKey];
    }
    if (expectedSha256 && sha(readFileSync(stagePath)) !== expectedSha256) throw new Error('receiver-hash');
    const receipt={durable:true,worldId:envelope.worldId,eventId:envelope.eventId,digest:eventDigest,
      sha256:expectedSha256,receiptId:'rcpt-'+envelope.eventId};
    prior[idempotencyKey]=receipt;
    const fd=openSync(receiverPath,'w',0o600);
    try {writeFileSync(fd,JSON.stringify(prior));fsyncSync(fd);} finally{closeSync(fd);}
    if(afterAccept)throw new Error('simulate response loss after durable receiver commit');
    return receipt;
  };
  const params={dataRoot:dir,validateCapture:fakeValidate,canonicalCapture:fakeCanon,
    authorizeDevice: a=>(!revoked && a?.grantId===auth.grantId && a?.sessionId===auth.sessionId ?
      {grantId:'grant-1',deviceId:'device-one',scopes:['corpus:upload']}:null),
    approveTransfer:async ({deviceId,grantId,expiresAt,events})=>approved ?
      {decision:'approved',approvalId:'approval-one',deviceId,grantId,expiresAt,events}:null,
    persistAccepted:accept,
    lookupAccepted:async ({worldId,eventId})=>readReceiver()[JSON.stringify([worldId,eventId])]??null,
    now:()=>moment};
  return {dir,open:()=>create(params), params, auth,
    revoke:()=>{revoked=true;}, allow:()=>{revoked=false;},deny:()=>{approved=false;},
    advance:n=>{moment+=n;}, afterAccept:()=>{afterAccept=true;},
    receivingCalls:()=>receivingCalls,readReceiver};
}
async function scope(h,p,events,ttlMs=60000){return p.issueScope({auth:h.auth,events,ttlMs});}
const pos=(h,p,s,e)=>p.inspect({auth:h.auth,scopeId:s.scopeId,eventId:e.eventId});
const push=(h,p,s,e,offset,chunk)=>p.pushChunk({auth:h.auth,scopeId:s.scopeId,eventId:e.eventId,offset,chunk});
const finish=(h,p,s,e)=>p.finalize({auth:h.auth,scopeId:s.scopeId,eventId:e.eventId});
const code=(value,expected)=>assert.equal(value.code,expected);

test('10 explicit approved captures produce 10 durable receipts; replay is a no-op',async t=>{
  const h=fixture(t), p=h.open();const es=Array.from({length:10},(_,i)=>makeCapture(i));
  assert.equal(TRANSPORT_SCHEMA,'vivim.corpus-transfer/1');
  const s=await scope(h,p,es);assert.equal(s.events.length,10);
  for(let i=0;i<10;i++) {
    const e=es[i],buf=bytesFor(i);
    assert.equal(push(h,p,s,e,0,buf).cursor,buf.length);
    assert.equal(push(h,p,s,e,0,buf).cursor,buf.length);
    assert.equal((await finish(h,p,s,e)).state,'accepted');
    assert.equal((await finish(h,p,s,e)).state,'accepted');
  }
```

_First 80 of 179 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

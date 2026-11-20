# File: apps/vivim-host/corpus/host-integration.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/corpus/host-integration.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 15117 B |
| Lines | 230 |
| Hash | 96faa1db4eff |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sha | function | 9 | no | const sha = bytes =&gt; createHash(&#39;sha256&#39;).update(bytes).digest(&#39;hex&#39;); |
| stable | function | 10 | no | const stable = v =&gt; JSON.stringify(v, (_, x) =&gt; x &amp;&amp; typeof x === &#39;object&#39; &amp;&amp; !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k =&gt; [k, x[k]])) : x); |
| fail | function | 12 | no | const fail = (code, status=403) =&gt; { throw Object.assign(new Error(code), {code,status}); }; |
| id | function | 13 | no | const id = v =&gt; typeof v === &#39;string&#39; &amp;&amp; /^[a-z0-9][a-z0-9._:-]{0,127}$/.test(v); |
| hmac | function | 14 | no | const hmac = (key, value) =&gt; createHmac(&#39;sha256&#39;,key).update(stable(value)).digest(&#39;hex&#39;); |
| eq | function | 15 | no | const eq = (a,b) =&gt; typeof a === &#39;string&#39; &amp;&amp; typeof b === &#39;string&#39; &amp;&amp; |
| signedJournal | function | 19 | no | function signedJournal(root, key) { |
| dir | const | 20 | no | const dir = path.join(root, &#39;corpus-integration-v1&#39;); |
| file | function | 22 | no | const file = name =&gt; path.join(dir, sha(name)+&#39;.json&#39;); |
| read | function | 23 | no | const read = name =&gt; { |
| data | const | 25 | no | const data = JSON.parse(readFileSync(file(name),&#39;utf8&#39;)); |
| write | function | 31 | no | const write = (name,value) =&gt; { |
| previous | const | 33 | no | const previous=read(name); |
| body | const | 38 | no | const body={schema:&#39;vivim.corpus-integration/1&#39;,name,value}, sealed={...body,seal:hmac(key,body)}; |
| dest | const | 39 | no | const dest=file(name), tmp=dest+&#39;.&#39;+process.pid+&#39;.tmp&#39;; |
| fd | variable | 40 | no | let fd; |
| lock | const | 44 | no | const lock=openSync(dest+&#39;.lock&#39;,&#39;wx&#39;,0o600); |
| createHostPocketCorpusBridge | function | 61 | yes | export function createHostPocketCorpusBridge({dataRoot,receiptKey,transportFactory,intakeFactory,hq, authorizeDevice,ownerApproval,rawGrantFor,verifyCurrentGrant,now=Date.now}) { |
| journal | const | 67 | no | const journal=signedJournal(dataRoot,receiptKey), corpusRoot=path.join(dataRoot,&#39;corpus-accepted&#39;); |
| activeFinalizations | const | 68 | no | const activeFinalizations=new Map(); // Ephemeral request credentials, never persisted or re-sent on restart. |
| deviceFor | function | 69 | no | const deviceFor=(auth,scope)=&gt;{ |
| p | const | 70 | no | const p=authorizeDevice(auth,scope); |
| canonical | function | 75 | no | const canonical=e=&gt;{ |
| c | const | 77 | no | const c=hq.canonicalCorpusJson(e); |
| intake | const | 81 | no | const intake=intakeFactory({root:corpusRoot,receiptKey, authenticate:auth=&gt;deviceFor(auth,&#39;corpus:intake&#39;), resolveGrant:(ref,principal)=&gt;verifyCurrentGrant(ref,principal),now}); |
| getApproval | function | 85 | no | const getApproval=(scopeId,eventId,device)=&gt;{ |
| grant | const | 86 | no | const grant=rawGrantFor({scopeId,eventId,device}); |
| acceptanceName | function | 95 | no | const acceptanceName=(worldId,eventId)=&gt;&#39;accepted:&#39;+worldId+&#39;:&#39;+eventId; |
| assertAccepted | function | 96 | no | const assertAccepted=(out,device,eventId)=&gt;{ |
| candidate | const | 97 | no | const candidate=out?.state===&#39;accepted&#39;?out.receipt:out; |
| proof | const | 99 | no | const proof=journal.read(acceptanceName(device.worldId,eventId)); |
| transport | const | 105 | no | const transport=transportFactory({dataRoot, validateCapture:hq.validateCorpusCapture,canonicalCapture:hq.canonicalCorpusJson, authorizeDevice:auth=&gt;deviceFor(auth,&#39;corpus:upload&#39;), approveTransfer:as… |
| approved | const | 109 | no | const approved=await ownerApproval(p); |
| c | const | 114 | no | const c=canonical(envelope); |
| binding | const | 117 | no | const binding=journal.read(&#39;scope:&#39;+scopeId); |
| liveAuth | const | 120 | no | const liveAuth=activeFinalizations.get(scopeId+&#39;:&#39;+envelope.eventId); |
| device | const | 122 | no | const device=deviceFor(liveAuth,&#39;corpus:intake&#39;); |
| grant | const | 124 | no | const grant=getApproval(scopeId,envelope.eventId,device); |
| bytes | const | 126 | no | const bytes=await readFile(stagePath); |
| result | const | 128 | no | const result=await intake.acceptBatch({batchId:grant.batchId,grantRef:grant.ref,session:liveAuth,items:[{envelope,bytes}]}); |
| proof | const | 133 | no | const proof={worldId:envelope.worldId,eventId:envelope.eventId,assetId:envelope.assetId, |
| receiptId | const | 138 | no | const receiptId=&#39;receipt:&#39;+sha(stable(result.receipt)); |
| proof | const | 143 | no | const proof=journal.read(acceptanceName(worldId,eventId)); |
| device | const | 155 | no | const device=deviceFor(auth,&#39;corpus:upload&#39;); |
| c | const | 158 | no | const c=canonical(e); |
| proof | const | 160 | no | const proof=journal.read(acceptanceName(e.worldId,e.eventId)); |
| result | const | 164 | no | const result=await transport.issueScope({auth,events,ttlMs}); |
| device | const | 171 | no | const device=deviceFor(args.auth,&#39;corpus:intake&#39;); |
| binding | const | 172 | no | const binding=journal.read(&#39;scope:&#39;+args.scopeId); |
| key | const | 174 | no | const key=args.scopeId+&#39;:&#39;+args.eventId; |
| out | const | 178 | no | const out=await transport.finalize(args); |
| device | const | 184 | no | const device=deviceFor(args.auth,&#39;corpus:intake&#39;); |
| binding | const | 185 | no | const binding=journal.read(&#39;scope:&#39;+args.scopeId); |
| out | const | 188 | no | const out=await transport.reconcile(args); |
| device | const | 194 | no | const device=deviceFor(auth,&#39;corpus:read&#39;); |
| entries | const | 197 | no | const entries=[], proofs=[]; |
| proof | const | 199 | no | const proof=journal.read(acceptanceName(worldId,eventId)); |
| current | const | 203 | no | const current=verifyCurrentGrant(proof.approvalRef,device); |
| receipt | const | 205 | no | const receipt={receiptRef:&#39;receipt:&#39;+sha(stable(proof.batchReceipt)),approvalRef:&#39;approval:&#39;+sha(proof.approvalRef), |
| bound | function | 211 | no | const bound=(r,d)=&gt;proofs.some(({receipt,proof})=&gt;stable(receipt)===stable(r)&amp;&amp; d.capture.eventId===proof.eventId&amp;&amp;d.eventHash===proof.eventDigest&amp;&amp; hq.verifyIntakeReceipt(proof.batchReceipt,receiptK… |
| active | function | 214 | no | const active=(r,d)=&gt;bound(r,d)&amp;&amp;(()=&gt;{const proof=proofs.find(p=&gt;stable(p.receipt)===stable(r))?.proof; const g=verifyCurrentGrant(proof.approvalRef,device);return g?.revoked===false&amp;&amp;Number.isFinite… |
| g | const | 215 | no | const g=verifyCurrentGrant(proof.approvalRef,device);return g?.revoked===false&amp;&amp;Number.isFinite(g.expiresAt)&amp;&amp;g.expiresAt&gt;now();})(); |
| result | const | 216 | no | const result=hq.projectPocketEvidence({entries},{verifyHostAcceptance:bound,verifyOwnerApproval:active, isScopeActive:active,verifyStoredAsset:(r,d)=&gt;{ if(!bound(r,d)) return false; const proof=proof… |
| proof | const | 219 | no | const proof=proofs.find(p=&gt;stable(p.receipt)===stable(r))?.proof; |
| key | const | 221 | no | const key=sha(proof.ownerId+&#39;\\0&#39;+proof.capture.worldId+&#39;\\0&#39;+proof.eventId); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 4 | external |
| node:fs | import | 5 | external |
| node:fs/promises | import | 6 | external |
| node:path | import | 7 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/corpus/host-integration.test.mjs](./host-integration.test.mjs.md) | ./host-integration.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Integration 5: Host-owned 5A -> 5B receipt boundary and read-only 5C gate.
// Requires the real HQ validator/projector and an owner-managed durable approval broker.
// No external provider, World, or KB write path is reachable from this module.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, openSync, closeSync, writeFileSync, fsyncSync, renameSync, unlinkSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const stable = v => JSON.stringify(v, (_, x) => x && typeof x === 'object' && !Array.isArray(x)
  ? Object.fromEntries(Object.keys(x).sort().map(k => [k, x[k]])) : x);
const fail = (code, status=403) => { throw Object.assign(new Error(code), {code,status}); };
const id = v => typeof v === 'string' && /^[a-z0-9][a-z0-9._:-]{0,127}$/.test(v);
const hmac = (key, value) => createHmac('sha256',key).update(stable(value)).digest('hex');
const eq = (a,b) => typeof a === 'string' && typeof b === 'string' &&
  /^[a-f0-9]{64}$/.test(a) && /^[a-f0-9]{64}$/.test(b) && timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));

// One authenticated journal per scope; no user-supplied path or acceptance records.
function signedJournal(root, key) {
  const dir = path.join(root, 'corpus-integration-v1');
  mkdirSync(dir,{recursive:true,mode:0o700});
  const file = name => path.join(dir, sha(name)+'.json');
  const read = name => {
    try {
      const data = JSON.parse(readFileSync(file(name),'utf8'));
      const {seal,...body} = data;
      if (body.schema !== 'vivim.corpus-integration/1' || !eq(seal,hmac(key,body)) || body.name !== name) fail('INTEGRATION_RECORD_CORRUPT',409);
      return body.value;
    } catch(e) { if(e.code === 'ENOENT') return null; if(e.code) throw e; fail('INTEGRATION_RECORD_CORRUPT',409); }
  };
  const write = (name,value) => {
    // Only create immutable records. Every replay is verified against its original value.
    const previous=read(name);
    if(previous !== null) {
      if(stable(previous)!==stable(value)) fail('INTEGRATION_REPLAY_CONFLICT',409);
      return;
    }
    const body={schema:'vivim.corpus-integration/1',name,value}, sealed={...body,seal:hmac(key,body)};
    const dest=file(name), tmp=dest+'.'+process.pid+'.tmp';
    let fd;
    try {
      fd=openSync(tmp,'wx',0o600); writeFileSync(fd,stable(sealed)); fsyncSync(fd); closeSync(fd);fd=undefined;
      // No overwrite of concurrent immutable records; a race leaves an explicit conflict.
      const lock=openSync(dest+'.lock','wx',0o600);
      try { if(read(name)!==null) fail('INTEGRATION_WRITER_CONFLICT',409); renameSync(tmp,dest); }
      finally {closeSync(lock);unlinkSync(dest+'.lock');}
      if(process.platform!=='win32') {const d=openSync(dir,'r');try{fsyncSync(d)}finally{closeSync(d)}}
    } finally {if(fd!==undefined)closeSync(fd);try{unlinkSync(tmp)}catch(e){if(e.code!=='ENOENT')throw e}}
  };
  return {read,write};
}

/**
 * Host integration contracts:
 * - authorizeDevice(auth, requiredScope) is backed by enrollment.validateGrant, never caller claims.
 * - ownerApproval({device,events,expiresAt}) is a PREEXISTING owner decision, not an auto-approval.
 * - rawGrantFor({scopeId,eventId,device}) is a PREEXISTING Host owner's per-event grant.
 * - verifyCurrentGrant(ref,device) rechecks rights, sensitivity and revocation from Host storage.
 * - HQ exports are passed from the canonical repos-hq modules, not copied validators.
 */
export function createHostPocketCorpusBridge({dataRoot,receiptKey,transportFactory,intakeFactory,hq,
  authorizeDevice,ownerApproval,rawGrantFor,verifyCurrentGrant,now=Date.now}) {
  if(typeof dataRoot!=='string'||!path.isAbsolute(dataRoot)||!Buffer.isBuffer(receiptKey)||receiptKey.length<32||
    [transportFactory,intakeFactory,authorizeDevice,ownerApproval,rawGrantFor,verifyCurrentGrant,now].some(f=>typeof f!=='function')||
    !hq||['validateCorpusCapture','canonicalCorpusJson','corpusEventDigest','projectPocketEvidence','verifyIntakeReceipt'].some(k=>typeof hq[k]!=='function'))
    throw new TypeError('HOST_INTEGRATION_TRUST_ADAPTER_REQUIRED');
  const journal=signedJournal(dataRoot,receiptKey), corpusRoot=path.join(dataRoot,'corpus-accepted');
  const activeFinalizations=new Map(); // Ephemeral request credentials, never persisted or re-sent on restart.
  const deviceFor=(auth,scope)=>{
    const p=authorizeDevice(auth,scope);
    if(!p||p.verified!==true||!id(p.deviceId)||!id(p.grantId)||!id(p.ownerId)||!id(p.worldId)||
      !Array.isArray(p.scopes)||!p.scopes.includes(scope)||!Number.isFinite(p.expiresAt)||p.expiresAt<=now()) fail('DEVICE_UNAUTHORIZED',401);
    return p;
  };
  const canonical=e=>{
    if(!hq.validateCorpusCapture(e)?.ok) fail('CANONICAL_CAPTURE_INVALID',400);
    const c=hq.canonicalCorpusJson(e);
    if(!c?.ok||typeof c.json!=='string') fail('CANONICAL_CAPTURE_INVALID',400);
    return c;
  };
```

_First 80 of 231 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

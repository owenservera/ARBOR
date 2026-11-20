# File: studio/src/studio/bootstrap-owner-adapter.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/bootstrap-owner-adapter.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10673 B |
| Lines | 160 |
| Hash | b34661837c55 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| BOOTSTRAP_OWNER_ADAPTER_SCHEMA | const | 9 | yes | export const BOOTSTRAP_OWNER_ADAPTER_SCHEMA = &#39;vivim.bootstrap-owner-adapter/1&#39;; |
| ID | const | 10 | no | const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/; |
| CHATGPT_THREAD | const | 11 | no | const CHATGPT_THREAD = /^chatgpt-c:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; |
| SHA | const | 12 | no | const SHA = /^[0-9a-f]{64}$/; |
| MAX_PROMPT_BYTES | const | 13 | no | const MAX_PROMPT_BYTES = 12000; |
| codeError | function | 14 | no | const codeError = (code, message = code) =&gt; Object.assign(new Error(message), { code }); |
| sha | function | 15 | no | const sha = text =&gt; createHash(&#39;sha256&#39;).update(text, &#39;utf8&#39;).digest(&#39;hex&#39;); |
| valid | function | 16 | no | const valid = (text, label) =&gt; { if (typeof text !== &#39;string&#39; \|\| !ID.test(text)) throw codeError(&#39;BOOTSTRAP_INVALID_PACKET&#39;, `${label} invalid`); return text; }; |
| clone | function | 17 | no | const clone = x =&gt; structuredClone(x); |
| safeReason | function | 18 | no | const safeReason = x =&gt; String(x \|\| &#39;UNKNOWN&#39;).replace(/[^A-Z0-9_]/gi, &#39;_&#39;).slice(0, 80); |
| checkPacket | function | 19 | no | function checkPacket(packet) { |
| validateApproval | function | 27 | no | function validateApproval(a, p, now) { |
| createBootstrapBindingStore | function | 37 | yes | export function createBootstrapBindingStore({ dir } = {}) { |
| file | function | 39 | no | const file = id =&gt; { valid(id,&#39;requestId&#39;); return path.join(dir, `${id}.json`); }; |
| read | function | 40 | no | function read(id) { |
| v | const | 42 | no | const v = JSON.parse(readFileSync(file(id),&#39;utf8&#39;)); |
| write | function | 47 | no | function write(id, record, exclusive) { |
| target | const | 49 | no | const target=file(id), data=JSON.stringify(record)+&#39;\\n&#39;; |
| fd | variable | 51 | no | let fd; |
| temp | const | 56 | no | const temp=`${target}.${process.pid}.${randomBytes(8).toString(&#39;hex&#39;)}.tmp`; |
| fd | variable | 57 | no | let fd; |
| studioConversationPort | function | 69 | yes | export function studioConversationPort(runtime) { |
| createStudioBootstrapOwnerAdapter | function | 84 | yes | export function createStudioBootstrapOwnerAdapter({conversation, store, verifyOwner, verifyApproval, now=Date.now}={}) { |
| busy | variable | 87 | no | let busy=false; |
| at | function | 88 | no | const at=()=&gt;new Date(now()).toISOString(); |
| receipt | function | 89 | no | function receipt(record,state,extra={}) { |
| inspectSnapshot | function | 92 | no | function inspectSnapshot(record,snapshot) { |
| matching | const | 95 | no | const matching=(snapshot.turns\|\|[]).filter(t=&gt;t.key===record.turnKey); |
| t | const | 97 | no | const t=matching[0]; |
| inspect | function | 111 | no | async function inspect(requestId) { |
| dispatch | function | 121 | no | async function dispatch(packet) { |
| approval | const | 128 | no | const approval=await verifyApproval({worldId:packet.worldId,generationId:packet.generationId,pass:packet.pass, requestId:packet.requestId,promptDigest:packet.promptDigest,provider:packet.provider,aut… |
| created | variable | 137 | no | let created; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 5 | external |
| node:fs | import | 6 | external |
| node:path | import | 7 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/onboarding/service.mjs](../../../apps/vivim-host/onboarding/service.mjs.md) | ../../../studio/src/studio/bootstrap-owner-adapter.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM BF01/H08 — Studio-only bootstrap dispatch bridge.
// This module NEVER connects to CDP, launches Chrome, creates an approval, or retries a send.
// Studio's existing conversation runtime remains the exclusive browser-effect and send-journal owner.
// Local correlation files contain only request/turn/thread metadata, never prompts or replies.
import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync, openSync, closeSync, fsyncSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const BOOTSTRAP_OWNER_ADAPTER_SCHEMA = 'vivim.bootstrap-owner-adapter/1';
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/;
const CHATGPT_THREAD = /^chatgpt-c:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA = /^[0-9a-f]{64}$/;
const MAX_PROMPT_BYTES = 12000;
const codeError = (code, message = code) => Object.assign(new Error(message), { code });
const sha = text => createHash('sha256').update(text, 'utf8').digest('hex');
const valid = (text, label) => { if (typeof text !== 'string' || !ID.test(text)) throw codeError('BOOTSTRAP_INVALID_PACKET', `${label} invalid`); return text; };
const clone = x => structuredClone(x);
const safeReason = x => String(x || 'UNKNOWN').replace(/[^A-Z0-9_]/gi, '_').slice(0, 80);
function checkPacket(packet) {
  if (!packet || packet.schema !== 'vivim.bootstrap-dispatch/1' || packet.provider !== 'chatgpt' || packet.thread !== 'new') throw codeError('BOOTSTRAP_INVALID_PACKET');
  for (const f of ['worldId','generationId','requestId','pass','authorizationRef']) valid(packet[f],f);
  if (!['F02','F01','D03','D04','D05','D06','D07'].includes(packet.pass)) throw codeError('BOOTSTRAP_INVALID_PASS');
  if (typeof packet.prompt !== 'string' || !packet.prompt.trim() || Buffer.byteLength(packet.prompt,'utf8') > MAX_PROMPT_BYTES) throw codeError('BOOTSTRAP_INVALID_PROMPT');
  if (!SHA.test(packet.promptDigest) || sha(packet.prompt) !== packet.promptDigest) throw codeError('BOOTSTRAP_DIGEST_MISMATCH');
  return packet;
}
function validateApproval(a, p, now) {
  if (!a || a.ownerApproved !== true || a.scope !== 'full-bootstrap' || a.source !== 'owner'
      || a.approvalRef !== p.authorizationRef || a.worldId !== p.worldId || a.generationId !== p.generationId
      || a.requestId !== p.requestId || a.pass !== p.pass || a.provider !== p.provider
      || a.promptDigest !== p.promptDigest || !Number.isFinite(Date.parse(a.expiresAt))
      || Date.parse(a.expiresAt) <= now()) throw codeError('BOOTSTRAP_APPROVAL_INVALID');
}

// Studio-local, metadata-only index, with exclusive creation for request IDs.
// The record is NOT a substitute for Studio's thread-turn send journal.
export function createBootstrapBindingStore({ dir } = {}) {
  if (typeof dir !== 'string' || !path.isAbsolute(dir)) throw codeError('BOOTSTRAP_BINDING_DIR','Absolute Studio-local directory required');
  const file = id => { valid(id,'requestId'); return path.join(dir, `${id}.json`); };
  function read(id) {
    try {
      const v = JSON.parse(readFileSync(file(id),'utf8'));
      if (v?.schema !== BOOTSTRAP_OWNER_ADAPTER_SCHEMA || v.requestId !== id) throw codeError('BOOTSTRAP_BINDING_CORRUPT');
      return v;
    } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
  }
  function write(id, record, exclusive) {
    mkdirSync(dir,{recursive:true,mode:0o700});
    const target=file(id), data=JSON.stringify(record)+'\n';
    if (exclusive) {
      let fd;
      try { fd=openSync(target,'wx',0o600);writeFileSync(fd,data);fsyncSync(fd);return true; }
      catch(e){if(e.code==='EEXIST')return false;throw e;}
      finally{if(fd!==undefined)closeSync(fd);}
    }
    const temp=`${target}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`;
    let fd;
    try { fd=openSync(temp,'wx',0o600);writeFileSync(fd,data);fsyncSync(fd);closeSync(fd);fd=undefined;renameSync(temp,target); }
    finally {if(fd!==undefined)closeSync(fd);try{unlinkSync(temp);}catch(e){if(e.code!=='ENOENT')throw e;}}
    return true;
  }
  return {read, reserve: record => write(record.requestId,record,true), update: record => {
    if (!read(record.requestId)) throw codeError('BOOTSTRAP_BINDING_MISSING');
    return write(record.requestId,record,false);
  }};
}

// Canonical in-process route: no new HTTP listener and no independent browser session.
export function studioConversationPort(runtime) {
  if (typeof runtime?.connect !== 'function' || typeof runtime?.submit !== 'function' || typeof runtime?.get !== 'function')
    throw codeError('BOOTSTRAP_STUDIO_RUNTIME_REQUIRED');
  return {
    create: () => runtime.connect({site:'chatgpt',freshTab:true}),
    submit: (id, body) => runtime.submit(id,body),
    get: id => runtime.get(id)
  };
}

// `conversation` must be a privileged, in-process wrapper around the existing Studio runtime:
//   create({site:'chatgpt'}) -> conversation snapshot     [POST /conversations/create]
```

_First 80 of 161 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

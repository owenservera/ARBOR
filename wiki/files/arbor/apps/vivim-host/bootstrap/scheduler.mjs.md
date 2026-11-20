# File: apps/vivim-host/bootstrap/scheduler.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/bootstrap/scheduler.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 17661 B |
| Lines | 290 |
| Hash | 32fbcce0f196 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SCHEDULER_SCHEMA | const | 14 | yes | export const SCHEDULER_SCHEMA = &#39;vivim.bootstrap-scheduler/1&#39;; |
| PASS_ORDER | const | 15 | yes | export const PASS_ORDER = Object.freeze([&#39;F02&#39;,&#39;F01&#39;,&#39;D03&#39;,&#39;D04&#39;,&#39;D05&#39;,&#39;D06&#39;,&#39;D07&#39;]); |
| FAST | const | 16 | no | const FAST = Object.freeze([&#39;F02&#39;,&#39;F01&#39;]); |
| ID | const | 17 | no | const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/; |
| TERMINAL | const | 18 | no | const TERMINAL = new Set([&#39;complete&#39;,&#39;blocked&#39;,&#39;failed&#39;,&#39;cancelled&#39;]); |
| IN_FLIGHT | const | 19 | no | const IN_FLIGHT = new Set([&#39;dispatching&#39;,&#39;awaiting&#39;,&#39;uncertain&#39;,&#39;ingesting&#39;]); |
| MAX_PROMPT | const | 20 | no | const MAX_PROMPT = 12000, MAX_REPLY = 120000, MAX_AGE_MS = 60000; |
| fail | function | 21 | no | const fail = (code, reason) =&gt; Object.assign(new Error(reason), { code }); |
| hash | function | 22 | no | const hash = s =&gt; createHash(&#39;sha256&#39;).update(String(s)).digest(&#39;hex&#39;); |
| clone | function | 23 | no | const clone = v =&gt; structuredClone(v); |
| validId | function | 24 | no | const validId = (s, label) =&gt; { |
| safeNow | function | 28 | no | const safeNow = now =&gt; { |
| value | const | 29 | no | const value = now(); const at = value instanceof Date ? value.toISOString() : String(value); |
| jobId | function | 33 | no | const jobId = requestId =&gt; `sch-${requestId}`; |
| requestIdFor | function | 34 | no | function requestIdFor(worldId, generationId, pass) { |
| serial | function | 37 | no | const serial = val =&gt; JSON.stringify(val); |
| publicState | function | 38 | no | function publicState(session) { |
| checkReply | function | 46 | no | function checkReply(packet, result) { |
| validThread | function | 67 | no | const validThread = value =&gt; typeof value === &#39;string&#39; &amp;&amp; value.length &gt;= 4 &amp;&amp; value.length &lt;= 512; |
| createBootstrapScheduler | function | 69 | yes | export function createBootstrapScheduler({ ledger, runtime, studio, readiness, authorize, promptForPass, worldId = &#39;world-local&#39;, now = () =&gt; new Date().toISOString() } = {}) { |
| key | const | 80 | no | const key = &#39;scheduler.v1.&#39; + worldId; |
| busy | variable | 81 | no | let busy = false; |
| read | function | 82 | no | const read = () =&gt; { |
| raw | const | 83 | no | const raw = ledger.meta.get(key); |
| data | const | 85 | no | const data = JSON.parse(raw); |
| change | function | 90 | no | function change(fn) { |
| old | const | 92 | no | const old = read(); |
| next | const | 93 | no | const next = fn(old ? clone(old) : null); |
| updatePass | function | 100 | no | function updatePass(generationId, pass, fromStatuses, patch) { |
| row | const | 103 | no | const row = s.passes.find(p =&gt; p.pass === pass); |
| startGeneration | function | 109 | no | function startGeneration({ generationId, passes = FAST } = {}) { |
| selected | const | 114 | no | const selected = PASS_ORDER.filter(p =&gt; passes.includes(p)); |
| at | const | 123 | no | const at = safeNow(now); |
| grantRevoked | function | 132 | no | function grantRevoked(grant = readGrant(ledger)) { |
| grantValid | function | 135 | no | function grantValid() { |
| state | const | 136 | no | const state = runtime.status(); |
| grant | const | 137 | no | const grant = state?.grant; |
| expiry | const | 149 | no | const expiry = grantExpiryMs(grant); |
| grantAllowsPacket | function | 158 | no | function grantAllowsPacket(grant, packet) { |
| refusal | const | 161 | no | const refusal = grantRefusal(grant, { worldId, promptDigest: packet.promptDigest, thread: packet.thread, send: true, now: Date.parse(safeNow(now)), revoked: grantRevoked(grant) \|\| grantRevoked() }); |
| verifiedReady | function | 169 | no | function verifiedReady(r) { |
| verifiedApproval | function | 174 | no | function verifiedApproval(record, packet) { |
| packetFor | function | 182 | no | function packetFor(session, pass) { |
| row | const | 183 | no | const row = session.passes.find(p =&gt; p.pass === pass); |
| prompt | const | 184 | no | const prompt = promptForPass(pass,session.generationId); |
| settle | function | 191 | no | async function settle(session, row, response) { |
| packet | const | 192 | no | const packet = { requestId:row.requestId,pass:row.pass,generationId:session.generationId }; |
| observed | const | 193 | no | const observed = checkReply(packet,response); |
| params | const | 212 | no | const params = {response:observed.reply,requestId:row.requestId,generationId:session.generationId,threadRef:observed.threadRef}; |
| receipt | const | 213 | no | const receipt = row.pass === &#39;F02&#39; ? runtime.ingestF02(params) |
| summary | const | 216 | no | const summary = {pass:row.pass,requestId:row.requestId,applied:true}; |
| snapshot | function | 227 | no | const snapshot = () =&gt; publicState(read()); |
| reconcile | function | 228 | no | async function reconcile() { |
| session | const | 232 | no | const session = read(); if (!session) return null; |
| row | const | 233 | no | const row = session.passes.find(p =&gt; IN_FLIGHT.has(p.status)); |
| reply | variable | 235 | no | let reply; |
| runOnce | function | 242 | no | async function runOnce() { |
| session | const | 246 | no | const session = read(); if (!session) return null; |
| row | const | 248 | no | const row = session.passes.find(p =&gt; p.status === &#39;queued&#39;); |
| packet | variable | 250 | no | let packet, approval, grant; |
| response | variable | 274 | no | let response; |
| cancelQueued | function | 281 | no | function cancelQueued(generationId) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 11 | external |
| ./service.mjs | import | 12 | [apps/vivim-host/bootstrap/service.mjs](./service.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/onboarding/service.mjs](../onboarding/service.mjs.md) | ../bootstrap/scheduler.mjs |
| [apps/vivim-host/test/bootstrap-grant.test.mjs](../test/bootstrap-grant.test.mjs.md) | ../bootstrap/scheduler.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM bootstrap scheduler v1. Draft: deterministic Host-side orchestrator,
// never a browser owner, approval authority, relay claimant, or model API client.
// Required adapters (all owned by the EXISTING Host/Studio processes):
//   ledger: openLedger({file}). meta.get/set + transaction + jobs.start/finish/get
//   runtime: createBootstrapRuntime(...): status, ingestF02/F01/Pass
//   studio: { dispatch(packet), inspect(requestId) }  // SAME Studio owner and journal
//   readiness(): signed-in, fresh, verified ChatGPT manifest
//   authorize(packet): owner-tap approval record for exact request/digest, verified
//   promptForPass(pass, generationId): exact prompt from pinned bootstrap templates
// No automatic retry, Chrome attach, profile launch, or approval creation.
import { createHash } from 'node:crypto';
import { claimGrantSend, grantExpiryMs, grantRefusal, readGrant, GRANT_REASONS, GRANT_REVOKED_META_KEY } from './service.mjs';

export const SCHEDULER_SCHEMA = 'vivim.bootstrap-scheduler/1';
export const PASS_ORDER = Object.freeze(['F02','F01','D03','D04','D05','D06','D07']);
const FAST = Object.freeze(['F02','F01']);
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/;
const TERMINAL = new Set(['complete','blocked','failed','cancelled']);
const IN_FLIGHT = new Set(['dispatching','awaiting','uncertain','ingesting']);
const MAX_PROMPT = 12000, MAX_REPLY = 120000, MAX_AGE_MS = 60000;
const fail = (code, reason) => Object.assign(new Error(reason), { code });
const hash = s => createHash('sha256').update(String(s)).digest('hex');
const clone = v => structuredClone(v);
const validId = (s, label) => {
  if (typeof s !== 'string' || !ID.test(s)) throw fail('SCHEDULER_INPUT', `${label} must be a bounded identifier`);
  return s;
};
const safeNow = now => {
  const value = now(); const at = value instanceof Date ? value.toISOString() : String(value);
  if (!Number.isFinite(Date.parse(at))) throw fail('SCHEDULER_CLOCK', 'Clock must return an ISO date');
  return at;
};
const jobId = requestId => `sch-${requestId}`;
function requestIdFor(worldId, generationId, pass) {
  return 'bs-' + hash(`${worldId}\0${generationId}\0${pass}`).slice(0, 28);
}
const serial = val => JSON.stringify(val);
function publicState(session) {
  if (!session) return null;
  return clone({ schema: SCHEDULER_SCHEMA, worldId: session.worldId,
    generationId: session.generationId, createdAt: session.createdAt,
    updatedAt: session.updatedAt, passes: session.passes.map(({pass,status,requestId,reason,threadRef,receipt}) => ({
      pass,status,requestId,reason:reason ?? null,threadBound:!!threadRef,receipt:receipt ?? null
    })) });
}
function checkReply(packet, result) {
  if (!result || typeof result !== 'object' || result.requestId !== packet.requestId) {
    throw fail('SCHEDULER_JOURNAL_MISMATCH', 'Studio result missing exact request correlation');
  }
  if (result.state === 'pending' || result.state === 'awaiting') return { kind: 'awaiting' };
  if (result.state === 'uncertain' || result.state === 'not_found' || result.state === 'unknown')
    return { kind: 'uncertain', reason: result.state };
  if (result.state === 'blocked' || result.state === 'failed') {
    if (result.submitted !== 'no' || !['blocked','failed'].includes(result.journalState))
      return { kind: 'uncertain', reason: 'effect_not_proven_absent' };
    return { kind: result.state, reason: String(result.reason || result.state).slice(0, 100) };
  }
  if (result.state !== 'complete' || result.provider !== 'chatgpt'
      || !['observed','complete'].includes(result.journalState)
      || result.submitted !== 'yes' || !validThread(result.threadRef)
      || typeof result.reply !== 'string' || !result.reply.trim()
      || Buffer.byteLength(result.reply, 'utf8') > MAX_REPLY) {
    throw fail('SCHEDULER_UNVERIFIED_REPLY', 'Reply lacks verified journal, thread, provider, or bounded content');
  }
  return { kind: 'complete', reply: result.reply, threadRef: result.threadRef };
}
const validThread = value => typeof value === 'string' && value.length >= 4 && value.length <= 512;

export function createBootstrapScheduler({
  ledger, runtime, studio, readiness, authorize, promptForPass,
  worldId = 'world-local', now = () => new Date().toISOString()
} = {}) {
  validId(worldId, 'worldId');
  if (!ledger?.meta?.get || !ledger?.meta?.set || !ledger?.transaction || !ledger?.jobs?.start || !ledger?.jobs?.finish)
    throw fail('SCHEDULER_DEPENDENCY', 'Existing Host ledger interface required');
  if (!runtime?.status || !runtime?.ingestF02 || !runtime?.ingestF01 || !runtime?.ingestPass)
    throw fail('SCHEDULER_DEPENDENCY', 'Existing bootstrap runtime required');
  if (!studio?.dispatch || !studio?.inspect || !readiness || !authorize || !promptForPass)
    throw fail('SCHEDULER_DEPENDENCY', 'Studio owner + readiness/authorization/prompt adapters required');
  const key = 'scheduler.v1.' + worldId;
```

_First 80 of 291 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

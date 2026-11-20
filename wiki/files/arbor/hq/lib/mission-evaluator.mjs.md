# File: hq/lib/mission-evaluator.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/mission-evaluator.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7626 B |
| Lines | 115 |
| Hash | 5373c586ba97 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| EVALUATION_SCHEMA | const | 13 | yes | export const EVALUATION_SCHEMA = &#39;hq.mission-evaluation/1&#39;; |
| DIGEST | const | 14 | no | const DIGEST = /^[a-f0-9]{64}$/; |
| ID | const | 15 | no | const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/; |
| matches | function | 16 | no | const matches = (a, b, fields) =&gt; fields.every((key) =&gt; a[key] === b[key]); |
| REF_KEYS | const | 17 | no | const REF_KEYS = [&#39;missionId&#39;,&#39;missionRevision&#39;,&#39;stepId&#39;,&#39;stepRevision&#39;,&#39;kind&#39;,&#39;source&#39;,&#39;sourceRef&#39;,&#39;sourceRevision&#39;,&#39;digest&#39;]; |
| reject | function | 18 | no | const reject = (code, detail = code) =&gt; ({ok:false,schema:EVALUATION_SCHEMA,code,detail,nextAction:&#39;INSPECT&#39;}); |
| validRef | function | 19 | no | function validRef(p) { |
| allowedProof | function | 27 | no | function allowedProof(mission, p) { |
| step | const | 29 | no | const step = mission.steps.find(s=&gt;s?.id===p.stepId); |
| validAttestation | function | 33 | no | function validAttestation(verified, candidate, nowMs) { |
| validDelivery | function | 41 | no | function validDelivery(receipt, claim, mission, nowMs) { |
| evaluateMissionFromSources | function | 58 | yes | export async function evaluateMissionFromSources({mission, sources, proposedProofs = [], deliveryClaim = null, verifyProof, verifyDelivery, now} = {}) { |
| at | const | 60 | no | const at = Date.parse(now ?? &#39;&#39;); |
| before | variable | 64 | no | let before; |
| canonicalProofs | const | 67 | no | const canonicalProofs = []; |
| seen | const | 68 | no | const seen = new Map(); |
| key | const | 71 | no | const key = `${claimed.stepId}\\0${claimed.kind}\\0${claimed.source}`; |
| prev | const | 72 | no | const prev = seen.get(key); |
| verified | variable | 77 | no | let verified; |
| authenticatedDelivery | variable | 88 | no | let authenticatedDelivery = null; |
| verified | variable | 96 | no | let verified; |
| after | variable | 104 | no | let after; |
| view | const | 109 | no | const view = projectMission({mission,workOrders:before.workOrders,taskView:before.taskView, lanes:before.lanes,proofs:canonicalProofs,delivery:authenticatedDelivery,now}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./mission-sources.mjs | import | 10 | [hq/lib/mission-sources.mjs](./mission-sources.mjs.md) |
| ./mission-intelligence.mjs | import | 11 | [hq/lib/mission-intelligence.mjs](./mission-intelligence.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | M1/M2 trusted read-only mission evaluator, anchored to canonical |
| 4 | owner | mission-intelligence | — | mission-intelligence |
| 5 | invariant | — | — | No untrusted client or AI supplied verified:true may confer PASS. |
| 6 | invariant | — | — | The trusted caller injects a verifier whose implementation reads the |
| 8 | invariant | — | — | No scheduling, retries, network, provider calls or delivery effects. |

## Excerpt

```javascript
/**
 * @hq:context M1/M2 trusted read-only mission evaluator, anchored to canonical
 *   HQ task/order/supervisor state and caller-injected independently verified receipts.
 * @hq:owner mission-intelligence
 * @hq:invariant No untrusted client or AI supplied verified:true may confer PASS.
 * @hq:invariant The trusted caller injects a verifier whose implementation reads the
 *   original authority, checks source revision/digest, and enforces reviewer identity.
 * @hq:invariant No scheduling, retries, network, provider calls or delivery effects.
 */
import { readMissionSources, MissionSourceError } from './mission-sources.mjs';
import { projectMission } from './mission-intelligence.mjs';

export const EVALUATION_SCHEMA = 'hq.mission-evaluation/1';
const DIGEST = /^[a-f0-9]{64}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;
const matches = (a, b, fields) => fields.every((key) => a[key] === b[key]);
const REF_KEYS = ['missionId','missionRevision','stepId','stepRevision','kind','source','sourceRef','sourceRevision','digest'];
const reject = (code, detail = code) => ({ok:false,schema:EVALUATION_SCHEMA,code,detail,nextAction:'INSPECT'});
function validRef(p) {
  return p && REF_KEYS.slice(0,6).every(k=>typeof p[k] === 'string' || (k.endsWith('Revision') && Number.isSafeInteger(p[k]))) &&
    ID.test(p.missionId) && ID.test(p.stepId) && ID.test(p.kind) && ID.test(p.source) &&
    Number.isSafeInteger(p.missionRevision) && p.missionRevision > 0 &&
    Number.isSafeInteger(p.stepRevision) && p.stepRevision > 0 &&
    Number.isSafeInteger(p.sourceRevision) && p.sourceRevision >= 0 &&
    ID.test(p.sourceRef ?? '') && DIGEST.test(p.digest ?? '');
}
function allowedProof(mission, p) {
  if (p.missionId !== mission.id || p.missionRevision !== mission.revision) return false;
  const step = mission.steps.find(s=>s?.id===p.stepId);
  return Boolean(step && step.revision === p.stepRevision && Array.isArray(step.requirements) &&
    step.requirements.some(r=>r?.kind===p.kind && r?.source===p.source));
}
function validAttestation(verified, candidate, nowMs) {
  return verified?.verified === true && verified.status === 'PASS' &&
    matches(verified, candidate, REF_KEYS) &&
    ID.test(verified.executor ?? '') && ID.test(verified.verifier ?? '') &&
    verified.executor !== verified.verifier && typeof verified.at === 'string' &&
    Number.isFinite(Date.parse(verified.at)) && Date.parse(verified.at) <= nowMs + 60000 &&
    (!verified.expiresAt || (Number.isFinite(Date.parse(verified.expiresAt)) && Date.parse(verified.expiresAt) > nowMs));
}
function validDelivery(receipt, claim, mission, nowMs) {
  return receipt?.verified === true && receipt?.status === 'ACKED' && receipt?.type === 'mission-outcome' &&
    receipt.source === 'host' && receipt.missionId === mission.id &&
    receipt.missionRevision === mission.revision && receipt.outcomeDigest === mission.outcomeDigest &&
    matches(receipt,claim,['missionId','missionRevision','outcomeDigest','receiptRef']) &&
    ID.test(receipt.receiptRef ?? '') &&
    typeof receipt.at === 'string' && Number.isFinite(Date.parse(receipt.at)) && Date.parse(receipt.at) <= nowMs + 60000;
}
/**
 * A trusted composition-root function. All callback inputs are untrusted proposal
 * identifiers; callbacks must independently load the source and return canonical
 * attributes (not echo caller input). A callback failure fails the whole evaluation.
 *
 * @param {{ mission:object, sources:object, proposedProofs?:object[],
 *  deliveryClaim?:object|null, verifyProof?:Function, verifyDelivery?:Function,
 *  now:string }} input
 */
export async function evaluateMissionFromSources({mission, sources, proposedProofs = [], deliveryClaim = null,
  verifyProof, verifyDelivery, now} = {}) {
  const at = Date.parse(now ?? '');
  if (!Number.isFinite(at)) return reject('BAD_CLOCK','Explicit valid observation time required');
  if (!Array.isArray(proposedProofs) || !sources || typeof sources !== 'object') return reject('BAD_INPUT');
  if (proposedProofs.length > 5000) return reject('TOO_MANY_PROOFS');
  let before;
  try { before = await readMissionSources({mission, ...sources}); }
  catch (e) { return reject(e?.code ?? 'SOURCE_UNAVAILABLE', e?.message); }
  const canonicalProofs = [];
  const seen = new Map();
  for (const claimed of proposedProofs) {
    if (!validRef(claimed) || !allowedProof(mission,claimed)) return reject('PROOF_INVALID','Receipt reference does not match mission step and requirement');
    const key = `${claimed.stepId}\0${claimed.kind}\0${claimed.source}`;
    const prev = seen.get(key);
    if (prev && !matches(prev,claimed,REF_KEYS)) return reject('PROOF_CONFLICT','Conflicting references for a single required proof');
    if (prev) continue;
    seen.set(key,claimed);
    if (typeof verifyProof !== 'function') return reject('PROOF_VERIFIER_MISSING');
    let verified;
    try { verified = await verifyProof(Object.freeze({ ...Object.fromEntries(REF_KEYS.map(k=>[k,claimed[k]])) })); }
    catch (e) { return reject('PROOF_SOURCE_UNAVAILABLE',e?.code ?? 'Verifier failed'); }
    if (!validAttestation(verified,claimed,at)) return reject('PROOF_UNVERIFIED','Source check did not return matching independent attestation');
```

_First 80 of 116 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

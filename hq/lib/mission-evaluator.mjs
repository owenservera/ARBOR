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
    // Derived exclusively from the returned canonical source record, never from the claim.
    canonicalProofs.push({missionId:verified.missionId,missionRevision:verified.missionRevision,
      stepId:verified.stepId,stepRevision:verified.stepRevision,kind:verified.kind,source:verified.source,
      sourceRef:verified.sourceRef,sourceRevision:verified.sourceRevision,digest:verified.digest,
      status:verified.status,verified:true,executor:verified.executor,verifier:verified.verifier,
      at:verified.at,expiresAt:verified.expiresAt});
  }
  let authenticatedDelivery = null;
  if (deliveryClaim != null) {
    if (!mission || !DIGEST.test(mission.outcomeDigest ?? '') || !deliveryClaim ||
      deliveryClaim.missionId !== mission.id || deliveryClaim.missionRevision !== mission.revision ||
      deliveryClaim.outcomeDigest !== mission.outcomeDigest || !ID.test(deliveryClaim.receiptRef ?? '')) {
      return reject('DELIVERY_CLAIM_INVALID');
    }
    if (typeof verifyDelivery !== 'function') return reject('DELIVERY_VERIFIER_MISSING');
    let verified;
    try { verified = await verifyDelivery(Object.freeze({ missionId:mission.id,missionRevision:mission.revision,
      outcomeDigest:mission.outcomeDigest,receiptRef:deliveryClaim.receiptRef })); }
    catch(e) { return reject('DELIVERY_SOURCE_UNAVAILABLE',e?.code ?? 'Verifier failed'); }
    if (!validDelivery(verified,deliveryClaim,mission,at)) return reject('DELIVERY_UNVERIFIED');
    authenticatedDelivery = { ...verified };
  }
  {
    let after;
    try { after = await readMissionSources({mission, ...sources}); }
    catch(e) { return reject(e?.code ?? 'SOURCE_CHANGED',e?.message); }
    if (before.fingerprint !== after.fingerprint) return reject('SOURCE_CHANGED','Canonical state changed during proof verification');
  }
  const view = projectMission({mission,workOrders:before.workOrders,taskView:before.taskView,
    lanes:before.lanes,proofs:canonicalProofs,delivery:authenticatedDelivery,now});
  if (!view.ok) return { ...view, code:'MISSION_INVALID' };
  return {...view, evaluationSchema:EVALUATION_SCHEMA, sourceFingerprint:before.fingerprint,
    verifiedProofCount:canonicalProofs.length,
    deliveryVerified:Boolean(authenticatedDelivery),authority:'read-only; no effect rights'};
}

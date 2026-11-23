// PY-001/PY-002: bounded, Host-authorized admission for an *explicit* Build -> Work
// request. No HTTP route is registered by this module; until the incumbent Host
// approval and existing Studio Work CAS are injected, it cannot persist anything.
// Never infer a user's Submit Work action from typing, previews, AI candidates,
// IME, voice partials, a phone-provided grant claim, or browser reconnects.
import { createHash } from 'node:crypto';

export const WORK_ADMISSION_SCHEMA = 'vivim.host-work-admission/1';
export const WORK_REQUEST_SCHEMA = 'vivim.pwa-work-request/1';
const SOURCE_SCHEMA = 'vivim.host-live-system/1';
const OWNER_ACTION_SCHEMA = 'vivim.host-reviewed-work-action/1';
const ACTION = 'personal.work.create';
const REGIONS = new Set(['pwa.view']);
const KEY = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{7,127}$/;
const HEX = /^[a-f0-9]{64}$/;
const WORK_ID = /^work-[a-f0-9]{32}$/;
const SAFE_ACTOR = /^[a-zA-Z0-9._:-]{1,128}$/;
const STATES = new Set(['queued', 'active', 'blocked', 'completed', 'cancelled']);
const FIELDS = new Set([
  'schema', 'action', 'title', 'objective', 'idempotencyKey',
  'expectedWorkVersion', 'expectedEpoch', 'expectedRevision',
  'expectedRegionRevision', 'expectedRegionDigest',
]);

export const workAdmissionError = (code, status = 409) =>
  Object.assign(new Error(code), { code, status });

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const bounded = n => Number.isSafeInteger(n) && n >= 0;
const text = (s, max) => typeof s === 'string' && !!s.trim() &&
  s === s.trim() && s.length <= max && !/[\u0000-\u001f\u007f]/.test(s);
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function validateWorkRequest(request) {
  if (!object(request) || Object.keys(request).some(k => !FIELDS.has(k)) ||
      request.schema !== WORK_REQUEST_SCHEMA || request.action !== 'submit-work' ||
      !text(request.title, 160) || !text(request.objective, 4000) ||
      !KEY.test(request.idempotencyKey ?? '') ||
      !Number.isSafeInteger(request.expectedWorkVersion) || request.expectedWorkVersion < 1 ||
      !text(request.expectedEpoch, 128) || !bounded(request.expectedRevision) ||
      !bounded(request.expectedRegionRevision) ||
      typeof request.expectedRegionDigest !== 'string' ||
      !HEX.test(request.expectedRegionDigest))
    throw workAdmissionError('WORK_REQUEST_INVALID', 400);
  // The digest binds every intended write and exact expected Host source to the
  // *separate* reviewed action. It does NOT certify the human clicked a button.
  const write = {
    title: request.title, objective: request.objective,
    idempotencyKey: request.idempotencyKey,
    expectedVersion: request.expectedWorkVersion,
  };
  const requestDigest = digest([
    request.schema, request.action, write, request.expectedEpoch,
    request.expectedRevision, request.expectedRegionRevision,
    request.expectedRegionDigest,
  ]);
  return Object.freeze({ write: Object.freeze(write), requestDigest });
}

function confirmSnapshot(snapshot, request) {
  if (!object(snapshot) || snapshot.schema !== SOURCE_SCHEMA ||
      snapshot.state !== 'source-backed' ||
      snapshot.authority !== 'read-only-projection' ||
      snapshot.executionAuthorized !== false || snapshot.effectPerformed !== false ||
      typeof snapshot.epoch !== 'string' || !snapshot.epoch ||
      !bounded(snapshot.revision) || !Array.isArray(snapshot.regions))
    throw workAdmissionError('WORK_SOURCE_UNTRUSTED', 503);
  if (snapshot.epoch !== request.expectedEpoch ||
      snapshot.revision !== request.expectedRevision)
    throw workAdmissionError('WORK_SOURCE_STALE');
  const rows = snapshot.regions.filter(row => row?.id === 'pwa.view');
  if (rows.length !== 1 || !REGIONS.has(rows[0]?.id) ||
      rows[0].exposure !== 'owner' ||
      !bounded(rows[0].viewRevision) || !HEX.test(rows[0].digest ?? ''))
    throw workAdmissionError('WORK_SOURCE_UNTRUSTED', 503);
  if (rows[0].viewRevision !== request.expectedRegionRevision ||
      rows[0].digest !== request.expectedRegionDigest ||
      rows[0].freshness !== 'current')
    throw workAdmissionError('WORK_SOURCE_STALE');
  return Object.freeze({
    epoch: snapshot.epoch, revision: snapshot.revision,
    viewRevision: rows[0].viewRevision, digest: rows[0].digest,
  });
}

function confirmAuthorization(approval, requestDigest, request, source, clock) {
  // Approval must come from the injected, existing Host owner/Control reviewer.
  // The PWA's payload has no approval or actor fields. A direct browser claim
  // or a Host/Studio HTTP 200 can never satisfy this contract.
  if (!object(approval) || approval.schema !== OWNER_ACTION_SCHEMA ||
      approval.actionId !== ACTION || approval.state !== 'reviewed' ||
      approval.effectOwner !== 'host' || approval.userConfirmed !== true ||
      approval.requestDigest !== requestDigest ||
      !SAFE_ACTOR.test(approval.actorId ?? '') ||
      !SAFE_ACTOR.test(approval.grantId ?? '') ||
      approval.sourceEpoch !== request.expectedEpoch ||
      approval.sourceRevision !== source.revision ||
      !Number.isFinite(Date.parse(approval.expiresAt ?? '')) ||
      Date.parse(approval.expiresAt) <= clock())
    throw workAdmissionError('WORK_OWNER_APPROVAL_REQUIRED', 403);
  return Object.freeze({ actorId: approval.actorId, grantId: approval.grantId });
}

/**
 * Integration adapter is deliberately dependency-injected and fail-closed:
 * - reviewHostAction: incumbent Host verifies explicit owner action and scope.
 * - readHostSnapshot: trusted Host source projection, not user-provided JSON.
 * - writeExistingWork: the existing local Personal Agent Work CAS, not a new DB.
 *
 * No provider, AI model, browser controller, dispatcher, or HTTP endpoint here.
 */
export function createPwaWorkAdmission({
  reviewHostAction, readHostSnapshot, writeExistingWork, clock = Date.now,
} = {}) {
  if (typeof reviewHostAction !== 'function' ||
      typeof readHostSnapshot !== 'function' ||
      typeof writeExistingWork !== 'function' || typeof clock !== 'function')
    throw workAdmissionError('WORK_AUTHORITY_NOT_WIRED', 503);

  return Object.freeze({
    async submit(request, caller) {
      const { write, requestDigest } = validateWorkRequest(request);
      if (!caller) throw workAdmissionError('WORK_OWNER_APPROVAL_REQUIRED', 403);
      const first = confirmSnapshot(await readHostSnapshot(caller), request);
      const reviewed = await reviewHostAction({
        caller, actionId: ACTION, requestDigest, source: first,
        // Raw authoring text never travels to the review/authority callback.
      });
      const authority = confirmAuthorization(reviewed, requestDigest, request, first, clock);
      // A pending approval must not authorize a later, different Host state.
      const second = confirmSnapshot(await readHostSnapshot(caller), request);
      if (second.epoch !== first.epoch || second.digest !== first.digest ||
          second.revision !== first.revision || second.viewRevision !== first.viewRevision)
        throw workAdmissionError('WORK_SOURCE_STALE');
      let saved;
      try {
        // This is the ONLY effectful call. It is not retried after uncertainty.
        saved = await writeExistingWork(write, authority);
      } catch (error) {
        if (error?.code === 'PERSONAL_AGENT_VERSION_CONFLICT' ||
            error?.code === 'PERSONAL_AGENT_WORK_IDEMPOTENCY_CONFLICT')
          throw workAdmissionError('WORK_CAS_CONFLICT');
        // Studio's verified Work-status preflight refused BEFORE any POST: it
        // cannot have created a Work item. Do not label this uncertain.
        if (['STUDIO_WORK_NOT_READY','STUDIO_UNAVAILABLE',
             'STUDIO_WORK_INPUT_INVALID'].includes(error?.code))
          throw workAdmissionError('WORK_STORE_NOT_READY', 503);
        // A timed-out or malformed POST/GET after a possible commit is truly
        // uncertain; never retry the same write automatically.
        throw workAdmissionError('WORK_COMMIT_UNCERTAIN', 503);
      }
      const item = saved?.item;
      if (!object(saved) || !object(item) || !WORK_ID.test(item.id ?? '') ||
          !STATES.has(item.status) ||
          item.title !== write.title || item.objective !== write.objective ||
          !Number.isSafeInteger(saved.version) || saved.version < 1 ||
          typeof saved.replayed !== 'boolean')
        throw workAdmissionError('WORK_COMMIT_UNCERTAIN', 503);
      return Object.freeze({
        schema: WORK_ADMISSION_SCHEMA, state: 'source-backed',
        workId: item.id, workStatus: item.status, workVersion: saved.version,
        replayed: saved.replayed, execution: 'not-dispatched',
        authority: 'host-reviewed-existing-work', requestDigest,
        sourceEpoch: first.epoch, sourceRevision: first.revision,
        workPersisted: true, providerExecutionPerformed: false, providerSends: 0,
      });
    },
  });
}

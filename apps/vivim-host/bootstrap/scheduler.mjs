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
  let busy = false;
  const read = () => {
    const raw = ledger.meta.get(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.schema !== SCHEDULER_SCHEMA || data?.worldId !== worldId)
      throw fail('SCHEDULER_CORRUPT', 'Stored scheduler session has wrong schema/World');
    return data;
  };
  function change(fn) {
    return ledger.transaction(() => {
      const old = read();
      const next = fn(old ? clone(old) : null);
      if (next === undefined) return publicState(old);
      next.updatedAt = safeNow(now);
      ledger.meta.set(key, serial(next));
      return publicState(next);
    });
  }
  function updatePass(generationId, pass, fromStatuses, patch) {
    return change(s => {
      if (!s || s.generationId !== generationId) throw fail('SCHEDULER_STALE', 'Generation changed');
      const row = s.passes.find(p => p.pass === pass);
      if (!row || !fromStatuses.includes(row.status)) throw fail('SCHEDULER_STALE', 'Pass state changed');
      Object.assign(row, patch);
      return s;
    });
  }
  function startGeneration({ generationId, passes = FAST } = {}) {
    validId(generationId, 'generationId');
    if (!Array.isArray(passes) || !passes.length || passes.length > PASS_ORDER.length
        || new Set(passes).size !== passes.length || passes.some(p => !PASS_ORDER.includes(p)))
      throw fail('SCHEDULER_INPUT', 'Invalid pass set');
    const selected = PASS_ORDER.filter(p => passes.includes(p));
    return change(old => {
      if (old?.generationId === generationId) {
        if (JSON.stringify(old.passes.map(p=>p.pass)) !== JSON.stringify(selected))
          throw fail('SCHEDULER_CONFLICT', 'Existing generation has different pass selection');
        return undefined;
      }
      if (old && old.passes.some(p => !TERMINAL.has(p.status)))
        throw fail('SCHEDULER_ACTIVE', 'Current generation has pending or uncertain work');
      const at = safeNow(now);
      return { schema:SCHEDULER_SCHEMA,worldId,generationId,createdAt:at,updatedAt:at,
        passes:selected.map(pass => ({pass,status:'queued',requestId:requestIdFor(worldId,generationId,pass),reason:null})) };
    });
  }
  // The service's exact revocation signal, so both surfaces enforce one refusal ordering:
  // a flag on the grant record, or the tombstone revokeGrant() leaves behind once the grant
  // row is cleared. A record with the flag is revoked even while its other fields still look
  // valid, and a cleared record is revoked only when that tombstone exists.
  function grantRevoked(grant = readGrant(ledger)) {
    return grant?.revoked === true || (!grant && Boolean(readGrant(ledger, GRANT_REVOKED_META_KEY)));
  }
  function grantValid() {
    const state = runtime.status();
    const grant = state?.grant;
    if (state?.state !== 'ready')
      throw fail('SCHEDULER_GRANT_REQUIRED', 'Existing Host full-bootstrap owner grant required');
    // Revoked is the first refusal everywhere. Keep the distinct REVOKED code instead of
    // folding it into 'not granted', and never let a revoked record fall through to the
    // expiry, scope or cap checks below.
    if (grantRevoked(grant))
      throw fail(GRANT_REASONS.revoked, 'Bootstrap grant was revoked by the owner');
    if (!grant || grant.worldId !== worldId || grant.scope !== 'full-bootstrap' || grant.source !== 'owner')
      throw fail('SCHEDULER_GRANT_REQUIRED', 'Existing Host full-bootstrap owner grant required');
    // A bounded grant may have lapsed or run out of sends. Both refuse here, before any
    // browser effect, with their own machine-readable code.
    const expiry = grantExpiryMs(grant);
    if (expiry !== null && Date.parse(safeNow(now)) >= expiry)
      throw fail(GRANT_REASONS.expired, 'Bootstrap grant expired; the owner must grant again');
    if (Number.isInteger(grant.maxSends) && Number(grant.sendsUsed || 0) >= grant.maxSends)
      throw fail(GRANT_REASONS.exhausted, 'Bootstrap grant send cap is exhausted');
    return grant;
  }
  // The grant may be bound to one prompt digest and to fresh threads only. The packet holds
  // the exact prompt the owner approved, so the binding is checked against that digest.
  function grantAllowsPacket(grant, packet) {
    // The record is re-read so a revocation that landed after the preflight still refuses here,
    // with the same signal and ordering the service's requireGrant() uses.
    const refusal = grantRefusal(grant, {
      worldId, promptDigest: packet.promptDigest, thread: packet.thread,
      send: true, now: Date.parse(safeNow(now)),
      revoked: grantRevoked(grant) || grantRevoked()
    });
    if (refusal) throw fail(refusal, 'Bootstrap grant refuses this send');
    return true;
  }
  function verifiedReady(r) {
    return r?.provider === 'chatgpt' && r?.state === 'signed_in' && r?.verified === true &&
      typeof r.observedAt === 'string' && Number.isFinite(Date.parse(r.observedAt)) &&
      Math.abs(Date.parse(safeNow(now)) - Date.parse(r.observedAt)) <= MAX_AGE_MS;
  }
  function verifiedApproval(record, packet) {
    return !!record && record.worldId === worldId && record.generationId === packet.generationId &&
      record.pass === packet.pass && record.requestId === packet.requestId &&
      record.promptDigest === packet.promptDigest && record.provider === 'chatgpt' &&
      record.scope === 'full-bootstrap' && record.ownerApproved === true &&
      typeof record.approvalRef === 'string' && ID.test(record.approvalRef) &&
      typeof record.expiresAt === 'string' && Date.parse(record.expiresAt) > Date.parse(safeNow(now));
  }
  function packetFor(session, pass) {
    const row = session.passes.find(p => p.pass === pass);
    const prompt = promptForPass(pass,session.generationId);
    if (typeof prompt !== 'string' || !prompt.trim() || Buffer.byteLength(prompt, 'utf8') > MAX_PROMPT)
      throw fail('SCHEDULER_PROMPT', 'Bounded pinned prompt is required');
    return { schema:'vivim.bootstrap-dispatch/1',worldId,generationId:session.generationId,
      pass,provider:'chatgpt',thread:'new',requestId:row.requestId,promptDigest:hash(prompt),prompt };
  }
  // Purely read-only effect reconciliation. Absence of a receipt is NOT proof of no send.
  async function settle(session, row, response) {
    const packet = { requestId:row.requestId,pass:row.pass,generationId:session.generationId };
    const observed = checkReply(packet,response);
    if (observed.kind === 'awaiting') {
      updatePass(session.generationId,row.pass,['dispatching','awaiting','uncertain'],{status:'awaiting',reason:null});
      return snapshot();
    }
    if (observed.kind === 'uncertain') {
      updatePass(session.generationId,row.pass,['dispatching','awaiting','uncertain'],{status:'uncertain',reason:'JOURNAL_RECONCILIATION_REQUIRED'});
      return snapshot();
    }
    if (observed.kind === 'blocked' || observed.kind === 'failed') {
      updatePass(session.generationId,row.pass,['dispatching','awaiting','uncertain'],{status:observed.kind,reason:observed.reason});
      ledger.jobs.finish(jobId(row.requestId),worldId,{status:observed.kind,finishedAt:safeNow(now),receipt:{reason:observed.reason}});
      return snapshot();
    }
    // Durable ingestion-intent marker BEFORE calling trusted Host writer. A crash
    // here re-enters idempotent ingestion only after the Studio journal re-proves completion.
    updatePass(session.generationId,row.pass,['dispatching','awaiting','uncertain','ingesting'],{
      status:'ingesting',reason:null,threadRef:observed.threadRef });
    try {
      const params = {response:observed.reply,requestId:row.requestId,generationId:session.generationId,threadRef:observed.threadRef};
      const receipt = row.pass === 'F02' ? runtime.ingestF02(params)
        : row.pass === 'F01' ? runtime.ingestF01(params) : runtime.ingestPass(params);
      if (receipt?.ok !== true) throw fail('SCHEDULER_INGEST', 'Host did not confirm ingestion');
      const summary = {pass:row.pass,requestId:row.requestId,applied:true};
      updatePass(session.generationId,row.pass,['ingesting'],{status:'complete',receipt:summary,reason:null});
      ledger.jobs.finish(jobId(row.requestId),worldId,{status:'done',finishedAt:safeNow(now),receipt:summary});
    } catch (error) {
      // A completed browser reply has NEVER been undone or resent. Operator must
      // resolve the Host writer error (including grant revocation/schema invalid).
      updatePass(session.generationId,row.pass,['ingesting'],{status:'blocked',reason:'HOST_INGEST_REVIEW_REQUIRED'});
      ledger.jobs.finish(jobId(row.requestId),worldId,{status:'blocked',finishedAt:safeNow(now),receipt:{code:error?.code ?? 'INGEST_ERROR'}});
    }
    return snapshot();
  }
  const snapshot = () => publicState(read());
  async function reconcile() {
    if (busy) throw fail('SCHEDULER_BUSY','One scheduler operation at a time');
    busy = true;
    try {
      const session = read(); if (!session) return null;
      const row = session.passes.find(p => IN_FLIGHT.has(p.status));
      if (!row) return snapshot();
      let reply;
      try { reply = await studio.inspect(row.requestId); }
      catch { return updatePass(session.generationId,row.pass,[row.status],{status:'uncertain',reason:'INSPECTION_UNAVAILABLE'}); }
      try { return await settle(session,row,reply); }
      catch { return updatePass(session.generationId,row.pass,[row.status],{status:'uncertain',reason:'JOURNAL_VERIFICATION_REQUIRED'}); }
    } finally { busy = false; }
  }
  async function runOnce() {
    if (busy) throw fail('SCHEDULER_BUSY','One scheduler operation at a time');
    busy = true;
    try {
      const session = read(); if (!session) return null;
      if (session.passes.some(p => IN_FLIGHT.has(p.status))) return snapshot(); // reconcile first, never resend
      const row = session.passes.find(p => p.status === 'queued');
      if (!row) return snapshot();
      let packet, approval, grant;
      try {
        grant = grantValid();
        if (!verifiedReady(await readiness())) throw fail('SCHEDULER_PROVIDER_NOT_READY','Signed-in ChatGPT not freshly verified');
        packet = packetFor(session,row.pass);
        approval = await authorize({...packet,prompt:undefined});
        if (!verifiedApproval(approval,packet)) throw fail('SCHEDULER_APPROVAL_REQUIRED','Exact owner-tap authorization missing');
        grantAllowsPacket(grant, packet);
      } catch (error) {
        // Before a browser effect, blocked is safe and visible; no retry implied.
        return updatePass(session.generationId,row.pass,['queued'],{status:'blocked',reason:error?.code ?? 'PREFLIGHT_FAILED'});
      }
      // The bounded grant is claimed before the browser effect. The claim is atomic in the
      // Host ledger, so two Host processes can never spend the same send.
      try {
        claimGrantSend({ ledger, worldId, promptDigest: packet.promptDigest, thread: packet.thread,
          requestId: packet.requestId, now: () => safeNow(now) });
      } catch (error) {
        return updatePass(session.generationId,row.pass,['queued'],{status:'blocked',reason:error?.code ?? 'GRANT_CLAIM_FAILED'});
      }
      // The reservation MUST commit before Studio receives any command.
      updatePass(session.generationId,row.pass,['queued'],{status:'dispatching',reason:null,promptDigest:packet.promptDigest});
      ledger.jobs.start({id:jobId(row.requestId),worldId,pass:row.pass,status:'running',requestId:row.requestId,
        startedAt:safeNow(now),attempt:1});
      let response;
      try { response = await studio.dispatch({...packet, authorizationRef:approval.approvalRef}); }
      catch { return updatePass(session.generationId,row.pass,['dispatching'],{status:'uncertain',reason:'DISPATCH_OUTCOME_UNKNOWN'}); }
      try { return await settle(session,row,response); }
      catch { return updatePass(session.generationId,row.pass,['dispatching','awaiting','ingesting'],{status:'uncertain',reason:'JOURNAL_VERIFICATION_REQUIRED'}); }
    } finally { busy = false; }
  }
  function cancelQueued(generationId) {
    validId(generationId,'generationId');
    return change(s => {
      if (!s || s.generationId !== generationId) throw fail('SCHEDULER_STALE','Wrong generation');
      for (const p of s.passes) if (p.status === 'queued') p.status = 'cancelled';
      return s;
    });
  }
  return {schema:SCHEDULER_SCHEMA,worldId,startGeneration,runOnce,reconcile,cancelQueued,snapshot};
}

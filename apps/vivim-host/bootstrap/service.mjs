// VIVIM bootstrap service: the single trusted local writer for personalization.
// ChatGPT output is untrusted data. This module validates it, assigns ids and
// revisions, persists through the bootstrap ledger, and projects a bounded,
// phone-safe view. It never sends to a provider, never executes generated SQL or
// JavaScript, and never treats provider inference as owner confirmation.
import { createHash, randomUUID } from 'node:crypto';
import { compileF02RenderPlan, parseF02Response } from '../../mobile-relay/bootstrap-f02.mjs';
import { compileUiProposal } from '../../mobile-relay/generative-ui/compiler.mjs';
import { compileF01Profile } from '../../mobile-relay/bootstrap-f01.mjs';
import { compilePassOutput, DEEP_PASSES } from '../../mobile-relay/bootstrap-pass.mjs';
import { compilePresetRenderPlan, compileProvisionalPlan, hasPreset, surfaceVariables } from '../../mobile-relay/theme-plan.mjs';
import { F02_FONT_STACKS } from '../../mobile-relay/bootstrap-f02.mjs';

export const BOOTSTRAP_SCHEMA = 'vivim.bootstrap-service/1';
export const WORLD_DEFAULT = 'world-local';
// Honest UI revision statuses (PRD 11 §5.3). A revision is only 'applied' after the Host
// committed it; 'superseded' and 'reverted' are history states the ledger keeps.
export const UI_REVISION_STATUSES = Object.freeze(['proposed', 'previewed', 'accepted', 'applied', 'rejected', 'conflict']);
export const UI_REVISION_HISTORY_STATUSES = Object.freeze(['superseded', 'reverted']);
const UI_REVISION_ANY = new Set([...UI_REVISION_STATUSES, ...UI_REVISION_HISTORY_STATUSES]);
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/;
const PHASES = ['connecting', 'learning', 'shaping', 'deepening', 'blocked', 'uncertain'];
const MAX_PROJECTION_BYTES = 32 * 1024;
// A grant is an owner decision with a bounded area. Nothing outside the granted area
// can be written by provider output, a phone command or the local UI.
const GRANT_SCOPES = Object.freeze({
  'onboarding-visual': ['visual'],
  'full-bootstrap': ['visual', 'profile', 'boundary', 'pass']
});

// Bounded grants. Every NEW grant carries a send cap, an absolute expiry and an optional
// prompt-digest binding. A grant record written before these fields existed keeps its
// original unbounded meaning, so upgrading never revokes authority the owner already gave.
export const GRANT_MAX_SENDS = 20;
export const GRANT_MAX_EXPIRY_MS = 24 * 3600000;
export const GRANT_META_KEY = 'grant.bootstrap';
export const GRANT_REVOKED_META_KEY = 'grant.bootstrap.revoked';
const SHA256_HEX = /^[a-f0-9]{64}$/;
// Distinct machine-readable refusal codes. The order of evaluation is fixed:
// revoked -> not granted -> expired -> scope -> digest -> thread -> exhausted.
export const GRANT_REASONS = Object.freeze({
  revoked: 'GRANT_REVOKED',
  notGranted: 'GRANT_REQUIRED',
  expired: 'GRANT_EXPIRED',
  scope: 'GRANT_SCOPE',
  digest: 'GRANT_DIGEST_MISMATCH',
  thread: 'GRANT_THREAD_REQUIRED',
  exhausted: 'GRANT_EXHAUSTED',
  claimUnavailable: 'GRANT_CLAIM_UNAVAILABLE',
  badBounds: 'GRANT_BAD_BOUNDS',
  badDigest: 'GRANT_BAD_DIGEST'
});

export function readGrant(ledger, key = GRANT_META_KEY) {
  try { const raw = ledger.meta.get(key); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function writeGrant(ledger, grant, key = GRANT_META_KEY) {
  ledger.meta.set(key, JSON.stringify(grant));
}
// Absent bound means a legacy unbounded record. An unreadable one fails closed as expired.
export function grantExpiryMs(grant) {
  if (!grant || grant.expiresAt === undefined || grant.expiresAt === null) return null;
  const parsed = typeof grant.expiresAt === 'string' ? Date.parse(grant.expiresAt) : Number(grant.expiresAt);
  return Number.isFinite(parsed) ? parsed : 0;
}
export function grantBoundDigest(grant) {
  return typeof grant?.promptDigest === 'string' && SHA256_HEX.test(grant.promptDigest) ? grant.promptDigest : null;
}
function grantRefusalMessage(code) {
  switch (code) {
    case GRANT_REASONS.revoked: return 'bootstrap grant was revoked by the owner';
    case GRANT_REASONS.notGranted: return 'bootstrap has not been granted by the owner';
    case GRANT_REASONS.expired: return 'bootstrap grant expired; the owner must grant again';
    case GRANT_REASONS.scope: return 'grant scope does not allow this write';
    case GRANT_REASONS.digest: return 'grant is bound to a different prompt digest';
    case GRANT_REASONS.thread: return 'bootstrap grant covers fresh threads only';
    case GRANT_REASONS.exhausted: return 'bootstrap grant send cap is exhausted';
    default: return 'bootstrap grant refused';
  }
}
// Pure refusal ordering, shared by the service and the scheduler. It returns null when the
// grant authorizes the request and a machine-readable reason otherwise. It never widens a
// grant: a legacy record without the bound fields keeps its unbounded meaning.
export function grantRefusal(grant, { worldId = null, area = null, promptDigest = null, thread = null, send = false, now = 0, revoked = false } = {}) {
  if (revoked) return GRANT_REASONS.revoked;
  if (!grant) return GRANT_REASONS.notGranted;
  const expiry = grantExpiryMs(grant);
  if (expiry !== null && now >= expiry) return GRANT_REASONS.expired;
  if (worldId && grant.worldId !== worldId) return GRANT_REASONS.scope;
  if (area) {
    const allowed = GRANT_SCOPES[grant.scope] ?? [];
    if (!allowed.includes(area)) return GRANT_REASONS.scope;
  }
  const bound = grantBoundDigest(grant);
  if (bound) {
    // A send must present exactly the bound digest. A local write that carries a digest must
    // carry the bound one; a local write without a digest is not a send and is not bound.
    if (send ? promptDigest !== bound : (promptDigest !== null && promptDigest !== bound)) return GRANT_REASONS.digest;
  }
  if (send && thread !== null && thread !== 'new' && grant.freshThreadOnly === true) return GRANT_REASONS.thread;
  if (send && Number.isInteger(grant.maxSends) && Number(grant.sendsUsed || 0) >= grant.maxSends) return GRANT_REASONS.exhausted;
  return null;
}

// Claims exactly one send from the grant. The claim is atomic across processes: the
// bootstrap ledger transaction is the Host's existing write-lock primitive (SQLite
// BEGIN IMMEDIATE), so the read-modify-write of the counter is serialized even when two
// Host processes consume from the same ledger file. Nothing is sent here: this is Host-side
// accounting of a send that the single Studio effect owner performs.
export function claimGrantSend({ ledger, worldId = WORLD_DEFAULT, area = 'pass', promptDigest = null, thread = 'new', requestId = null, now = () => new Date().toISOString() } = {}) {
  if (!ledger || typeof ledger.transaction !== 'function') throw coded(GRANT_REASONS.claimUnavailable, 'bootstrap ledger required');
  const raw = typeof now === 'function' ? now() : now;
  const stamp = typeof raw === 'string' ? raw : new Date(raw).toISOString();
  try {
    return ledger.transaction(() => {
      const grant = readGrant(ledger);
      const revoked = grant?.revoked === true || (!grant && Boolean(readGrant(ledger, GRANT_REVOKED_META_KEY)));
      const refusal = grantRefusal(grant, { worldId, area, promptDigest, thread, send: true, now: Date.parse(stamp), revoked });
      if (refusal) throw coded(refusal, grantRefusalMessage(refusal));
      if (!Number.isInteger(grant.maxSends)) {
        // A grant written before bounded grants existed has no cap: it stays unbounded and
        // records nothing, exactly as it behaved before this change.
        return { ok: true, grantId: grant.id ?? null, unbounded: true, slot: null, used: Number(grant.sendsUsed) || 0, remaining: null };
      }
      const used = Number(grant.sendsUsed) || 0;
      writeGrant(ledger, { ...grant, sendsUsed: used + 1, lastSendAt: stamp, lastSendRequestId: requestId ?? null });
      return { ok: true, grantId: grant.id ?? null, unbounded: false, slot: used, used: used + 1, remaining: grant.maxSends - used - 1 };
    });
  } catch (error) {
    if (typeof error?.code === 'string' && error.code.startsWith('GRANT_')) throw error;
    // Anything else (a busy or broken ledger) fails closed: no send is authorized.
    throw coded(GRANT_REASONS.claimUnavailable, 'bootstrap send claim failed: ' + String(error?.code ?? error?.message ?? 'LEDGER_ERROR').slice(0, 80));
  }
}

function fail(reason) { throw new TypeError('Bootstrap service: ' + reason); }
function coded(code, message) { return Object.assign(new TypeError('Bootstrap service: ' + message), { code }); }
function iso(now) { const v = now(); return typeof v === 'string' ? v : new Date(v).toISOString(); }
function idOk(value, name) { if (typeof value !== 'string' || !ID.test(value)) fail(name + ' must be a bounded id'); return value; }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]));
  return value;
}
function digestOf(value) { return createHash('sha256').update(JSON.stringify(stable(value))).digest('hex'); }
function receiptKey({ worldId, pass, requestId, generationId }) {
  return [worldId, pass, requestId, generationId ?? 'none'].join('\u0000');
}

export function createBootstrapService({ ledger, worldId = WORLD_DEFAULT, now = () => new Date().toISOString(), provider = 'chatgpt' } = {}) {
  if (!ledger || typeof ledger.transaction !== 'function') fail('ledger required');
  idOk(worldId, 'worldId');

  const readJson = (row, field, fallback) => {
    if (!row) return fallback;
    try { return JSON.parse(row[field]); } catch { return fallback; }
  };

  // UI revision status bookkeeping. The in-process map is the fast path; the same write
  // also lands on the ledger row so a restart and a second reader agree on the status.
  const uiRevisionStatusMap = new Map();
  function trackUiRevisionStatus(revision, status, actor, at, world = worldId) {
    const rev = Number(revision);
    if (!Number.isInteger(rev) || rev < 0) return null;
    if (!UI_REVISION_ANY.has(status)) fail('unsupported ui revision status ' + status);
    const entry = { status, actor: actor ?? null, at: at ?? iso(now) };
    uiRevisionStatusMap.set(rev, entry);
    const row = ledger.uiRevisions.byRevision(world, rev);
    if (row) ledger.uiRevisions.setStatus(row.id, status);
    return { revision: rev, ...entry };
  }
  // A read never throws for an unknown revision; it answers null, which is an honest miss.
  function uiRevisionStatus(revision = null) {
    const rev = revision === null || revision === undefined ? null : Number(revision);
    if (rev === null || !Number.isInteger(rev)) {
      const active = ledger.uiRevisions.active(worldId);
      return active ? uiRevisionStatus(Number(active.revision)) : null;
    }
    const local = uiRevisionStatusMap.get(rev);
    if (local) return { revision: rev, status: local.status, actor: local.actor, at: local.at };
    const row = ledger.uiRevisions.byRevision(worldId, rev);
    if (!row) return null;
    const stored = row.status === 'active' ? 'applied' : row.status === 'undone' ? 'reverted' : row.status ?? 'applied';
    const decision = readJson(row, 'decision_json', null);
    return { revision: rev, status: stored, actor: decision?.actor ?? null, at: decision?.at ?? row.created_at ?? null };
  }

  const meta = {
    grant: () => readGrant(ledger),
    setGrant: value => writeGrant(ledger, value),
    // A revocation tombstone keeps the distinct REVOKED refusal alive without leaving a
    // grant record behind that any status reader could mistake for live authority.
    grantRevoked: () => readGrant(ledger, GRANT_REVOKED_META_KEY),
    setGrantRevoked: value => ledger.meta.set(GRANT_REVOKED_META_KEY, JSON.stringify(value ?? null)),
    cards: () => { try { return JSON.parse(ledger.meta.get('cards.state') || '{"active":null,"revoked":[]}'); } catch { return { active: null, revoked: [] }; } },
    setCards: value => ledger.meta.set('cards.state', JSON.stringify(value)),
    lastUndo: () => { try { return JSON.parse(ledger.meta.get('theme.lastUndo') || 'null'); } catch { return null; } },
    setLastUndo: value => ledger.meta.set('theme.lastUndo', JSON.stringify(value))
  };

  // Bounds are decided at issue time and never inferred later.
  function grantBounds({ at, maxSends, expiresAt, expiresInMs, promptDigest, freshThreadOnly }) {
    const issued = Date.parse(at);
    if (!Number.isFinite(issued)) fail('grant issue time must be an ISO date');
    const cap = maxSends === undefined || maxSends === null ? GRANT_MAX_SENDS : maxSends;
    if (!Number.isInteger(cap) || cap < 1 || cap > GRANT_MAX_SENDS) {
      throw coded(GRANT_REASONS.badBounds, 'grant maxSends must be an integer from 1 to ' + GRANT_MAX_SENDS);
    }
    let expires = null;
    if (expiresAt !== undefined && expiresAt !== null) {
      const parsed = typeof expiresAt === 'string' ? Date.parse(expiresAt) : NaN;
      if (!Number.isFinite(parsed) || parsed <= issued || parsed > issued + GRANT_MAX_EXPIRY_MS) {
        throw coded(GRANT_REASONS.badBounds, 'grant expiresAt must be an ISO date within 24 hours of issue');
      }
      expires = new Date(parsed).toISOString();
    } else {
      const span = expiresInMs === undefined || expiresInMs === null ? GRANT_MAX_EXPIRY_MS : expiresInMs;
      if (!Number.isInteger(span) || span < 1 || span > GRANT_MAX_EXPIRY_MS) {
        throw coded(GRANT_REASONS.badBounds, 'grant expiresInMs must be an integer from 1 to 24 hours');
      }
      expires = new Date(issued + span).toISOString();
    }
    if (promptDigest !== undefined && promptDigest !== null
        && (typeof promptDigest !== 'string' || !SHA256_HEX.test(promptDigest))) {
      throw coded(GRANT_REASONS.badDigest, 'grant promptDigest must be a sha256 hex digest');
    }
    return {
      maxSends: cap, sendsUsed: 0, expiresAt: expires,
      promptDigest: promptDigest ?? null, freshThreadOnly: freshThreadOnly !== false
    };
  }

  // An explicit local owner action. Never reachable from provider output, and never
  // authorized by a caller-supplied confirmation callback: in the Host the issue paths are
  // the owner-token HTTP route (server.mjs -> verifyOwnerToken), the verified owner
  // approval (onboarding/service.mjs) and the validated phone relay command.
  function grantBootstrap({ scope = 'onboarding-visual', at = iso(now), maxSends, expiresAt, expiresInMs, promptDigest = null, freshThreadOnly = true } = {}) {
    if (!['onboarding-visual', 'full-bootstrap'].includes(scope)) fail('unsupported grant scope');
    const existing = meta.grant();
    if (existing?.scope === 'full-bootstrap' && existing.worldId === worldId && scope === 'onboarding-visual') return existing;
    const issuedAt = typeof at === 'string' ? at : new Date(at).toISOString();
    const bounds = grantBounds({ at: issuedAt, maxSends, expiresAt, expiresInMs, promptDigest, freshThreadOnly });
    const record = { id: 'grt-' + randomUUID(), scope, worldId, at: issuedAt, source: 'owner', ...bounds };
    ledger.transaction(() => {
      meta.setGrant(record);
      meta.setGrantRevoked(null);
    });
    return meta.grant();
  }
  function revokeGrant() {
    const prior = meta.grant();
    ledger.transaction(() => {
      meta.setGrant(null);
      meta.setGrantRevoked({ id: prior?.id ?? null, scope: prior?.scope ?? null, worldId, at: prior?.at ?? null, revokedAt: iso(now) });
    });
    return null;
  }

  // Every write path proves the owner granted this area first. Every refusal has its own
  // machine-readable code, the evaluation order is fixed and nothing here widens a grant.
  function requireGrant(area, { promptDigest = null, thread = null, send = false } = {}) {
    const grant = meta.grant();
    const revoked = grant?.revoked === true || (!grant && Boolean(meta.grantRevoked()));
    const refusal = grantRefusal(grant, { worldId, area, promptDigest, thread, send, now: Date.parse(iso(now)), revoked });
    if (refusal) throw coded(refusal, grantRefusalMessage(refusal));
    return grant;
  }

  // A send is only authorized when the grant is bound to exactly this prompt digest, still
  // covers the thread policy and still has a send left. The cap itself is claimed
  // atomically by consumeGrantSend, which is the only authority on the counter.
  function requireGrantForSend({ promptDigest = null, thread = 'new' } = {}) {
    return requireGrant('pass', { promptDigest, thread, send: true });
  }

  // Claims exactly one send slot. Pure Host-side accounting: it never sends anything.
  function consumeGrantSend({ promptDigest = null, thread = 'new', requestId = null } = {}) {
    return claimGrantSend({ ledger, worldId, promptDigest, thread, requestId, now: () => iso(now) });
  }

  // Bounded read of the grant as it now stands, including the derived send accounting.
  function grantState() {
    const grant = meta.grant();
    if (!grant) return null;
    const bounded = Number.isInteger(grant.maxSends);
    const used = Number(grant.sendsUsed) || 0;
    return {
      ...grant,
      maxSends: bounded ? grant.maxSends : null,
      expiresAt: grant.expiresAt ?? null,
      promptDigest: grant.promptDigest ?? null,
      freshThreadOnly: grant.freshThreadOnly === true,
      sendsUsed: used,
      sendsRemaining: bounded ? Math.max(0, grant.maxSends - used) : null
    };
  }

  function provenanceFor({ requestId, generationId = null, threadRef = null, kind, digest = null, basis = null }) {
    const id = 'prv-' + idOk(requestId, 'requestId');
    ledger.provenance.put({ id, kind, requestId, generationId, provider, threadRef, observedAt: iso(now), digest, basis });
    return id;
  }

  function activeThemeRow() { return ledger.themes.active(worldId); }
  function activePlan() {
    const row = activeThemeRow();
    if (!row) return compileProvisionalPlan(worldId);
    return { ...readJson(row, 'render_json', null), revision: row.revision, status: row.status, themeId: row.id };
  }
  const ownerThemeActive = () => {
    const row = activeThemeRow();
    return !!row && row.source_kind === 'owner-choice';
  };

  function recordPreferences(claims) {
    for (const claim of claims) {
      if (!claim.preference) continue;
      ledger.preferences.upsert({
        id: 'prf-' + claim.id.replace(/^clm-/, ''), worldId,
        key: claim.preference.key, value: claim.preference.value, polarity: claim.preference.polarity,
        hard: claim.preference.hard === true, basis: claim.basis, source: claim.status === 'owner-confirmed' ? 'owner' : 'provider',
        scope: claim.preference.scope ?? claim.scope ?? 'global', confidence: claim.confidence, updatedAt: iso(now)
      });
    }
  }

  // F02: visual signature. A validated plan is persisted as an append-only revision.
  // Replay-safe: same world+pass+request+generation returns the original receipt.
  function ingestF02({ response, requestId, generationId = null, threadRef = null, activate = null } = {}) {
    idOk(requestId, 'requestId');
    requireGrant('visual');
    if (generationId !== null) idOk(generationId, 'generationId');
    const parsed = parseF02Response(response);
    const digest = digestOf(parsed);
    const key = receiptKey({ worldId, pass: 'F02', requestId, generationId });
    return ledger.transaction(() => {
      const prior = ledger.receipts.get(key);
      if (prior) {
        if (prior.digest !== digest) throw coded('IDEMPOTENCY_CONFLICT', 'F02 reply changed for the same request and generation');
        return { ...JSON.parse(prior.receipt_json), replayed: true };
      }
      const revision = ledger.themes.nextRevision(worldId);
      const plan = compileF02RenderPlan(parsed, { worldId, requestId, revision });
      const wantActive = activate === null ? !!meta.grant() : activate === true;
      const blockedByOwner = ownerThemeActive();
      const active = wantActive && !blockedByOwner;
      const provenanceId = provenanceFor({ requestId, generationId, threadRef, kind: 'provider-inference', digest: 'f02:' + revision, basis: parsed.provisional ? 'provisional' : 'provider-memory' });
      const themeId = 'thm-' + worldId + '-' + revision;
      ledger.themes.insert({
        id: themeId, worldId, revision, status: active ? 'active' : 'suggested',
        sourceKind: 'provider-inference', sourceRef: requestId, palette: parsed.visual,
        appearance: parsed.visual.appearance, mood: parsed.visual.mood, texture: parsed.visual.texture,
        motion: parsed.visual.motion, density: parsed.visual.density,
        render: { ...plan, cssVariables: plan.cssVariables, typography: plan.typography },
        requestId, provenanceId, createdAt: iso(now), active
      });
      if (active) ledger.themes.activate(themeId);
      const claims = [
        ...parsed.preferences.map(p => ({
          id: 'clm-' + requestId + '-want-' + hash(p.trait), worldId, pass: 'F02', section: 'visual',
          label: p.trait, kind: 'preference', freshness: 'current', basis: p.basis,
          status: p.basis === 'explicit' ? 'owner-reported' : 'provider-reported', confidence: p.confidence,
          scope: p.scope, statement: p.trait,
          preference: { key: 'visual.' + hash(p.trait), value: p.trait, polarity: 'want', hard: false, scope: p.scope }
        })),
        ...parsed.dislikes.map(p => ({
          id: 'clm-' + requestId + '-avoid-' + hash(p.trait), worldId, pass: 'F02', section: 'visual',
          label: p.trait, kind: 'preference', freshness: 'current', basis: p.basis,
          status: p.basis === 'explicit' ? 'owner-reported' : 'provider-reported', confidence: p.confidence,
          scope: p.scope, statement: p.trait,
          preference: { key: 'visual.avoid.' + hash(p.trait), value: p.trait, polarity: 'avoid', hard: false, scope: p.scope }
        }))
      ];
      const at = iso(now);
      for (const claim of claims) ledger.claims.upsert({ ...claim, provenanceId, createdAt: at, updatedAt: at });
      recordPreferences(claims);
      ledger.passes.set({ worldId, pass: 'F02', status: 'complete', coverage: { areas: [{ name: 'visual', state: parsed.provisional ? 'partial' : 'covered' }] }, requestId, updatedAt: at });
      const receipt = {
        ok: true, pass: 'F02', revision, themeId, active,
        activation: active ? 'active' : blockedByOwner ? 'owner-theme-wins' : 'suggested-only',
        plan: { ...plan, revision, themeId, status: active ? 'active' : 'suggested' },
        provisional: parsed.provisional, preferences: claims.length, requestId
      };
      ledger.receipts.put({ key, worldId, pass: 'F02', requestId, generationId, digest, receipt, createdAt: at });
      return receipt;
    });
  }

  // Curated preset chosen by the owner on PC or phone. Always outranks inference.
  function choosePreset({ preset, requestId = 'owner-' + Date.now().toString(36), threadRef = null } = {}) {
    if (!hasPreset(preset)) fail('unknown preset');
    idOk(requestId, 'requestId');
    requireGrant('visual');
    return ledger.transaction(() => {
      const revision = ledger.themes.nextRevision(worldId);
      const plan = compilePresetRenderPlan(preset, { worldId, revision, source: 'owner-choice' });
      const provenanceId = provenanceFor({ requestId, threadRef, kind: 'owner-choice' });
      const themeId = 'thm-' + worldId + '-' + revision;
      ledger.themes.insert({
        id: themeId, worldId, revision, status: 'active', sourceKind: 'owner-choice', sourceRef: requestId,
        palette: plan.theme.palette, appearance: plan.theme.appearance, mood: plan.theme.mood,
        texture: plan.theme.texture, motion: plan.theme.motion, density: plan.theme.density,
        render: plan, requestId, provenanceId, createdAt: iso(now), active: true
      });
      ledger.themes.activate(themeId);
      ledger.passes.set({ worldId, pass: 'F00', status: 'complete', coverage: { areas: [{ name: 'visual', state: 'covered' }] }, requestId, updatedAt: iso(now) });
      return { ok: true, revision, themeId, preset, plan: { ...plan, revision, themeId, status: 'active' }, requestId };
    });
  }

  // Undo appends history; it never deletes. Returns the revision now in force.
  function undoTheme({ requestId = 'undo-' + Date.now().toString(36) } = {}) {
    idOk(requestId, 'requestId');
    requireGrant('visual');
    return ledger.transaction(() => {
      const current = activeThemeRow();
      const rows = ledger.themes.list(worldId, 50);
      const previous = current ? rows.find(r => r.revision < current.revision && r.status !== 'suggested') : null;
      const at = iso(now);
      const jobId = 'job-' + idOk(requestId, 'requestId');
      const pastJob = ledger.jobs.get(jobId, worldId);
      if (pastJob?.status === 'done') {
        const receipt = readJson(pastJob, 'receipt_json', {});
        return { ok: true, undone: receipt.from ?? null, active: receipt.to ?? null,
          provisional: receipt.to === null, plan: activePlan(), replayed: true };
      }
      ledger.jobs.start({ id: jobId, worldId, pass: 'F02', status: 'running', requestId, attempt: 1, startedAt: at });
      if (current) { ledger.themes.deactivateAll(worldId); ledger.themes.setStatus(current.id, 'undone'); }
      if (previous) { ledger.themes.activate(previous.id); ledger.themes.setStatus(previous.id, 'active'); }
      const plan = previous ? { ...readJson(previous, 'render_json', null), revision: previous.revision, status: 'active', themeId: previous.id } : compileProvisionalPlan(worldId);
      meta.setLastUndo({ requestId, at, from: current?.revision ?? null, to: previous?.revision ?? null });
      ledger.jobs.finish(jobId, worldId, { status: 'done', finishedAt: at, receipt: { kind: 'theme-undo', from: current?.revision ?? null, to: previous?.revision ?? null } });
      return { ok: true, undone: current?.revision ?? null, active: previous?.revision ?? null, provisional: !previous, plan };
    });
  }

  function ingestF01({ response, requestId, generationId = null, threadRef = null } = {}) {
    idOk(requestId, 'requestId');
    requireGrant('profile');
    if (generationId !== null) idOk(generationId, 'generationId');
    const profile = compileF01Profile(response, { worldId, requestId });
    const gen = generationId ?? profile.generationId ?? null;
    const digest = digestOf({ focus: profile.claims, cards: profile.cards, unknowns: profile.unknowns });
    const key = receiptKey({ worldId, pass: 'F01', requestId, generationId: gen });
    return ledger.transaction(() => {
      const prior = ledger.receipts.get(key);
      if (prior) {
        if (prior.digest !== digest) throw coded('IDEMPOTENCY_CONFLICT', 'F01 reply changed for the same request and generation');
        return { ...JSON.parse(prior.receipt_json), replayed: true };
      }
      const at = iso(now);
      const provenanceId = provenanceFor({ requestId, generationId, threadRef, kind: 'provider-inference', digest: 'f01:' + requestId, basis: 'recognition' });
      const contradictions = [];
      for (const claim of profile.claims) {
        const existing = ledger.claims.list(worldId, { section: claim.section, limit: 200 }).find(c => c.id === claim.id);
        if (existing && existing.status !== 'owner-confirmed' && existing.statement !== claim.statement) {
          contradictions.push({
            id: 'con-' + claim.id.replace(/^clm-/, '') + '-' + hash(claim.statement), worldId,
            claimA: existing.statement, claimB: claim.statement, resolution: 'unresolved',
            note: 'Provider re-stated "' + claim.label + '" differently across passes', createdAt: at
          });
        }
        ledger.claims.upsert({ ...claim, worldId, pass: 'F01', provenanceId, createdAt: at, updatedAt: at });
      }
      for (const c of contradictions) ledger.contradictions.put(c);
      recordPreferences(profile.claims);
      const cards = profile.cards.map(c => ({
        id: 'crd-' + c.id.replace(/^clm-/, ''), worldId, pass: 'F01', section: 'card', label: c.title,
        kind: 'card', freshness: 'current', basis: 'provider_memory_report', status: 'provider-reported',
        confidence: 0.6, scope: 'global', statement: c.focus ?? c.title,
        provenanceId, createdAt: at, updatedAt: at
      }));
      for (const card of cards) ledger.claims.upsert(card);
      const state = meta.cards();
      meta.setCards({ active: requestId, revoked: [...new Set([...state.revoked, ...(state.active ? [state.active] : [])])].filter(r => r !== requestId).slice(-20) });
      ledger.passes.set({ worldId, pass: 'F01', status: 'complete', coverage: { areas: [{ name: 'recognition', state: profile.unknowns.length ? 'partial' : 'covered' }] }, requestId, updatedAt: at });
      const receipt = { ok: true, pass: 'F01', requestId, claims: profile.claims.length, cards: profile.cards.length,
        contradictions: contradictions.length, unknowns: profile.unknowns, hardNos: profile.hardNos };
      ledger.receipts.put({ key, worldId, pass: 'F01', requestId, generationId: gen, digest, receipt, createdAt: at });
      return receipt;
    });
  }

  // D03–D07. Each pass is durable, replay-safe and independently undoable.
  function ingestPass({ response, requestId, generationId = null, threadRef = null } = {}) {
    idOk(requestId, 'requestId');
    requireGrant('profile');
    if (generationId !== null) idOk(generationId, 'generationId');
    const parsedOut = compilePassOutput(response, { worldId, requestId });
    if (!DEEP_PASSES.includes(parsedOut.passId)) fail('unsupported deep pass');
    const gen = generationId ?? parsedOut.generationId ?? null;
    const digest = digestOf({ passId: parsedOut.passId, observations: parsedOut.observations, assertions: parsedOut.assertions, coverage: parsedOut.coverage });
    const key = receiptKey({ worldId, pass: parsedOut.passId, requestId, generationId: gen });
    return ledger.transaction(() => {
      const prior = ledger.receipts.get(key);
      if (prior) {
        if (prior.digest !== digest) throw coded('IDEMPOTENCY_CONFLICT', parsedOut.passId + ' reply changed for the same request and generation');
        return { ...JSON.parse(prior.receipt_json), replayed: true };
      }
      const out = parsedOut;
      const at = iso(now);
      const provenanceId = provenanceFor({ requestId, generationId, threadRef, kind: 'provider-inference', digest: out.passId + ':' + requestId, basis: 'deep-pass' });
      let relationships = 0;
      for (const o of out.observations) {
        ledger.observations.put({ ...o, worldId, pass: out.passId, provenanceId, createdAt: at });
        if (o.category === 'relationship') {
          ledger.relationships.put({
            id: 'rel-' + o.id.replace(/^obs-/, ''), worldId, label: shorten(o.text, 80),
            relation: null, context: o.text, confidence: o.confidence, sensitive: true, provenanceId, createdAt: at
          });
          relationships++;
        }
      }
      for (const a of out.assertions) {
        ledger.claims.upsert({
          id: a.id, worldId, pass: out.passId, section: a.section, label: a.label, kind: out.passId,
          freshness: a.freshness, basis: a.basis, status: a.status, confidence: a.confidence,
          scope: a.scope, statement: a.value, preference: null, provenanceId, createdAt: at, updatedAt: at
        });
      }
      for (const s of out.schemaProposals) {
        ledger.schemaProposals.put({ ...s, worldId, pass: out.passId, createdAt: at });
      }
      // D07 is where the provider reports contradictions; keep them unresolved until the owner decides.
      if (out.passId === 'D07') {
        for (const u of out.unknowns) {
          ledger.contradictions.put({
            id: 'con-gap-' + hash(u), worldId, claimA: 'reported', claimB: u,
            resolution: 'unresolved', note: 'Explicit unknown reported by ' + out.passId, createdAt: at
          });
        }
      }
      ledger.passes.set({ worldId, pass: out.passId, status: 'complete', coverage: out.coverage, requestId, updatedAt: at });
      const jobId = 'job-' + requestId;
      ledger.jobs.start({ id: jobId, worldId, pass: out.passId, status: 'running', requestId, attempt: 1, startedAt: at });
      ledger.jobs.finish(jobId, worldId, {
        status: 'done', finishedAt: at,
        receipt: { observations: out.observations.length, assertions: out.assertions.length, relationships,
          schemaProposals: out.schemaProposals.length, viewProposals: out.viewProposals.length, coverage: out.coverage.areas.length }
      });
      const receipt = { ok: true, pass: out.passId, requestId, observations: out.observations.length,
        assertions: out.assertions.length, relationships, schemaProposals: out.schemaProposals.length,
        viewProposals: out.viewProposals, coverage: out.coverage };
      ledger.receipts.put({ key, worldId, pass: out.passId, requestId, generationId: gen, digest, receipt, createdAt: at });
      return receipt;
    });
  }

  function setPassState({ pass, status, requestId = null, coverage = null, receipt = null } = {}) {
    requireGrant('pass');
    if (!DEEP_PASSES.includes(pass) && !['F01', 'F02', 'F00'].includes(pass)) fail('unknown pass');
    if (!['queued', 'running', 'complete', 'blocked', 'uncertain', 'paused'].includes(status)) fail('unsupported pass status');
    const at = iso(now);
    if (requestId) {
      const jobId = 'job-' + idOk(requestId, 'requestId');
      ledger.jobs.start({ id: jobId, worldId, pass, status, requestId, attempt: 1, startedAt: at });
      if (status !== 'running' && status !== 'queued') ledger.jobs.finish(jobId, worldId, { status, finishedAt: at, receipt });
    }
    ledger.passes.set({ worldId, pass, status, coverage: coverage ?? { areas: [] }, requestId, updatedAt: at });
    return { ok: true, pass, status };
  }

  // Explicit owner preference, never provider-activated. The typed Host action
  // journal supplies plan approval, send-once effect fencing and receipts.
  function setOwnerPreference({ value } = {}) {
    requireGrant('boundary');
    if(typeof value!=='string'||!value.trim()||value!==value.trim()||value.length>200)
      fail('owner preference must be 1-200 trimmed characters');
    const token=digestOf(value.toLowerCase()).slice(0,24);
    const id='prf-owner-pref-'+token;
    const at=iso(now);
    ledger.preferences.upsert({id,worldId,key:'owner.preference.'+token,
      value,polarity:'want',hard:false,basis:'explicitly_stated',source:'owner',
      scope:'global',confidence:1,updatedAt:at});
    return {ok:true,id,value,source:'owner'};
  }
  function clearOwnerPreference({ id } = {}) {
    requireGrant('boundary');
    idOk(id,'id');
    if(!id.startsWith('prf-owner-pref-'))throw coded('OWNER_PREFERENCE_INVALID','not an editable owner preference');
    return ledger.transaction(()=>{
      const row=ledger.preferences.get(id,worldId);
      if(!row||row.source!=='owner'||Number(row.hard)!==0)
        throw coded('OWNER_PREFERENCE_NOT_OWNER','unknown or non-owner preference');
      ledger.preferences.remove(id,worldId);
      return {ok:true,id,value:row.value,source:'owner'};
    });
  }

  // Owner-stated hard NO. Outranks every provider inference, forever.
  function setHardNo({ trait, key = null } = {}) {
    requireGrant('boundary');
    const value = shorten(String(trait ?? '').trim(), 120);
    if (!value) fail('trait required');
    const at = iso(now);
    const id = 'prf-owner-' + hash(key || value);
    ledger.preferences.upsert({
      id, worldId, key: key || 'boundary.' + hash(value), value, polarity: 'avoid', hard: true,
      basis: 'explicitly_stated', source: 'owner', scope: 'global', confidence: 1, updatedAt: at
    });
    return { ok: true, id, value };
  }

  // Owner withdrawal. Only owner-sourced preferences may be removed: a provider
  // inference is withdrawn by the owner, never by the provider.
  function clearHardNo({ id } = {}) {
    requireGrant('boundary');
    idOk(id, 'id');
    return ledger.transaction(() => {
      const row = ledger.preferences.get(id, worldId);
      if (!row) fail('unknown preference');
      if (row.source !== 'owner') fail('only an owner-stated preference can be withdrawn');
      ledger.preferences.remove(id, worldId);
      const claim = ledger.claims.list(worldId, { section: 'boundary', limit: 200 }).find(c => c.preference_json && JSON.parse(c.preference_json).key === row.key);
      if (claim) ledger.claims.upsert({ ...claim, worldId, statement: claim.statement, status: 'withdrawn', confidence: 1, preference: JSON.parse(claim.preference_json), createdAt: claim.created_at, updatedAt: iso(now) });
      return { ok: true, id, key: row.key, value: row.value };
    });
  }

  // GUI04: commit a validated ui-proposal preview as a Host-owned surface revision.
  // The compiler decides validity; this method only assigns the revision and records it.
  function applyUiProposal({ proposal, surface, approvedRefs = [], requestId, worldId: targetWorld = worldId, now: at = null, actor = 'owner' } = {}) {
    requireGrant('visual');
    idOk(requestId, 'requestId');
    idOk(targetWorld, 'worldId');
    const stamp = typeof at === 'string' ? at : at ? new Date(at).toISOString() : iso(now);
    const preview = compileUiProposal({ proposal, surface, approvedRefs });
    const projectionDigest = digestOf({
      audience: 'phone', surfaceId: preview.surfaceId, catalogVersion: preview.catalogVersion,
      theme: preview.surface.theme, tree: preview.surface.tree
    });
    return ledger.transaction(() => {
      const parent = ledger.uiRevisions.active(targetWorld);
      const parentRevision = parent ? Number(parent.revision) : 0;
      // Compare-and-swap: the proposal must be built on the revision the Host still holds.
      if (preview.baseRevision !== parentRevision) {
        throw coded('UI_REJECTED', 'stale base revision ' + preview.baseRevision + ', active revision is ' + parentRevision);
      }
      const revision = parentRevision + 1;
      const changeId = 'chg-' + hash(requestId + ':' + revision);
      const committed = { ...preview.surface, revision };
      const receipt = {
        ok: true, pass: 'ui-proposal', revision, parentRevision, changeId,
        persisted: true, projectionDigest, previewDigest: preview.previewDigest
      };
      ledger.uiRevisions.insert({
        id: 'uir-' + targetWorld + '-' + revision, worldId: targetWorld, revision, parentRevision, changeId,
        catalogVersion: preview.catalogVersion, surface: committed,
        source: { kind: 'ui-proposal', requestId },
        decision: { scope: 'visual', actor, at: stamp },
        status: 'applied',
        receipt, createdAt: stamp, active: true
      });
      ledger.uiRevisions.activate('uir-' + targetWorld + '-' + revision);
      // The Host committed this revision, so it is 'applied' by that actor; the revision it
      // replaced stays in history as 'superseded' rather than pretending to still be active.
      const applied = trackUiRevisionStatus(revision, 'applied', actor, stamp, targetWorld);
      if (parent) trackUiRevisionStatus(parentRevision, 'superseded', actor, stamp, targetWorld);
      return {
        ok: true, revision, parentRevision, changeId, persisted: true, status: applied.status,
        surfaceId: preview.surfaceId, previewDigest: preview.previewDigest, projectionDigest
      };
    });
  }

  // Undo restores the revision below the active one. History is kept, never deleted.
  function undoUiRevision({ requestId = 'undo-ui-' + Date.now().toString(36), actor = 'owner' } = {}) {
    idOk(requestId, 'requestId');
    requireGrant('visual');
    return ledger.transaction(() => {
      const current = ledger.uiRevisions.active(worldId);
      const rows = ledger.uiRevisions.list(worldId, 100);
      const previous = current ? rows.find(r => r.revision < current.revision) : null;
      const at = iso(now);
      if (current) ledger.uiRevisions.deactivateAll(worldId);
      if (previous) ledger.uiRevisions.activate(previous.id);
      if (current) trackUiRevisionStatus(current.revision, 'reverted', actor, at);
      if (previous) trackUiRevisionStatus(previous.revision, 'applied', actor, at);
      ledger.meta.set('ui.lastUndo', JSON.stringify({ requestId, at, from: current?.revision ?? null, to: previous?.revision ?? null }));
      return { ok: true, undone: current?.revision ?? null, active: previous?.revision ?? null,
        status: previous ? 'applied' : null, persisted: true };
    });
  }

  function uiRevision() {
    const row = ledger.uiRevisions.active(worldId);
    return row ? readJson(row, 'surface_json', null) : null;
  }

  function phase() {
    const rows = ledger.passes.list(worldId);
    const by = Object.fromEntries(rows.map(r => [r.pass, r.status]));
    if (Object.values(by).includes('uncertain')) return 'uncertain';
    if (Object.values(by).includes('blocked')) return 'blocked';
    const deep = DEEP_PASSES.filter(p => by[p] === 'complete').length;
    const fast = ['F01', 'F02'].filter(p => by[p] === 'complete').length;
    if (deep > 0) return 'deepening';
    if (fast === 2 || (fast >= 1 && activeThemeRow())) return 'shaping';
    if (fast > 0 || rows.length > 0) return 'learning';
    return 'connecting';
  }

  function cards() {
    const state = meta.cards();
    const revoked = new Set(state.revoked ?? []);
    const all = ledger.claims.list(worldId, { section: 'card', limit: 50 })
      .filter(c => !revoked.has(String(c.provenance_id || '').replace(/^prv-/, '')));
    const byRequest = new Map();
    for (const c of all) {
      const key = String(c.provenance_id || '').replace(/^prv-/, '');
      if (!byRequest.has(key)) byRequest.set(key, []);
      byRequest.get(key).push(c);
    }
    const active = state.active && byRequest.has(state.active)
      ? byRequest.get(state.active)
      : [...byRequest.values()][0] ?? [];
    return active.slice(0, 3).map(c => ({ id: c.id, title: c.label, focus: c.statement, basis: c.basis, status: c.status }));
  }

  function fullStatus() {
    const theme = activePlan();
    const prefs = ledger.preferences.list(worldId).map(p => ({
      id: p.id, key: p.key, value: p.value, polarity: p.polarity, hard: Number(p.hard) === 1,
      basis: p.basis, source: p.source, scope: p.scope, confidence: p.confidence
    }));
    const passRows = ledger.passes.list(worldId).map(p => ({
      pass: p.pass, status: p.status, updatedAt: p.updated_at, coverage: readJson(p, 'coverage_json', { areas: [] })
    }));
    const contradictions = ledger.contradictions.list(worldId).map(c => ({
      id: c.id, resolution: c.resolution, note: c.note, createdAt: c.created_at
    }));
    return {
      schema: BOOTSTRAP_SCHEMA, worldId, observedAt: iso(now), phase: phase(),
      theme: { revision: theme.revision ?? null, status: theme.status ?? 'provisional', preset: theme.preset ?? null, themeId: theme.themeId ?? null,
        source: theme.theme?.source ?? { kind: 'provisional', ref: 'local.default' } },
      plan: theme,
      cards: cards(),
      preferences: prefs,
      hardNos: prefs.filter(p => p.hard && p.polarity === 'avoid').map(p => p.value).slice(0, 8),
      unknowns: ledger.claims.list(worldId, { section: 'unknown', limit: 20 }).length,
      passes: passRows,
      coverage: { areas: passRows.flatMap(p => p.coverage?.areas ?? []).slice(0, 12) },
      contradictions: contradictions.slice(0, 8),
      counts: ledger.stats(worldId),
      grant: grantState(),
      grantRevoked: meta.grantRevoked(),
      undo: meta.lastUndo(),
      capabilities: { localThemeWrite: true, providerSend: false, arbitrarySql: false, arbitraryCode: false }
    };
  }

  // Phone-safe projection: no relationship labels, no observation bodies, no raw requests.
  function projection() {
    const full = fullStatus();
    const theme = full.plan;
    const payload = {
      schema: 'vivim.bootstrap-phone/1', worldId, observedAt: full.observedAt, phase: full.phase,
      revision: full.theme.revision, themeStatus: full.theme.status, source: full.theme.source.kind,
      preset: full.theme.preset,
      cssVariables: theme?.cssVariables ?? compileProvisionalPlan(worldId).cssVariables,
      backgroundImage: theme?.cssVariables?.['--vivim-background-image'] ?? null,
      caps: {
        fontSize: theme?.typography?.fontSizePx ?? 15, headingSize: theme?.typography?.headingSizePx ?? 28,
        radius: theme?.typography?.radiusPx ?? 14, density: theme?.theme?.density ?? 'comfortable',
        mood: theme?.theme?.mood ?? 'serene', texture: theme?.theme?.texture ?? 'aurora'
      },
      cards: full.cards.map(c => ({ id: c.id, title: c.title, basis: c.basis })),
      hardNos: full.hardNos.map(v => shorten(v, 60)),
      preferences: full.preferences.filter(p => p.polarity === 'want').slice(0, 5).map(p => ({ value: shorten(p.value, 60), hard: p.hard })),
      progress: { passes: full.passes.map(p => ({ pass: p.pass, status: p.status })), cards: full.cards.length,
        observations: full.counts.observations, claims: full.counts.claims, contradictions: full.counts.contradictions },
      undo: { available: Boolean(activeThemeRow()), last: full.undo },
      // Studio-correlated status for the Build surface. The surface fields stay at the top
      // level so the phone can render the payload directly; the status fields are additive.
      uiRevision: (() => {
        const row = ledger.uiRevisions.active(worldId);
        if (!row) return null;
        const committed = readJson(row, 'surface_json', null);
        const status = uiRevisionStatus(Number(row.revision));
        return {
          ...(committed ?? {}),
          surface: committed,
          surfaceId: committed?.surfaceId ?? null,
          revision: Number(row.revision),
          status: status?.status ?? 'applied',
          changeId: row.change_id ?? null,
          parentRevision: Number(row.parent_revision ?? 0)
        };
      })()
    };
    const size = Buffer.byteLength(JSON.stringify(payload), 'utf8');
    if (size > MAX_PROJECTION_BYTES) throw new Error('Bootstrap projection exceeds ' + MAX_PROJECTION_BYTES + ' bytes');
    return payload;
  }

  return {
    schema: BOOTSTRAP_SCHEMA, worldId,
    grantBootstrap, revokeGrant, requireGrant, requireGrantForSend, consumeGrantSend, grantState,
    ingestF02, choosePreset, undoTheme, ingestF01, ingestPass, setPassState,
    setHardNo, clearHardNo, setOwnerPreference, clearOwnerPreference, applyUiProposal, undoUiRevision, uiRevision, uiRevisionStatus,
    phase, cards, fullStatus, projection, activePlan,
    // exposed for tests and the CLI without reaching into the ledger directly
    ledger
  };
}

function hash(value) {
  let h = 0x811c9dc5;
  const text = String(value);
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}
function shorten(value, limit) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length <= limit ? text : text.slice(0, limit - 1) + '…';
}
export { surfaceVariables, F02_FONT_STACKS };

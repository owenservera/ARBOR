// HVI development-source grant.
//
// Reuses the Host's EXISTING bounded-grant vocabulary and the EXISTING bootstrap
// ledger `meta` store. This file creates no new authority, no new store, no new
// endpoint, no scheduler, no second effect writer and no new bearer credential.
//
// A development-source grant names WHICH repositories the owner authorised, FOR HOW
// LONG, and can be revoked. Absence, expiry and revocation all fail closed and each
// refusal has its own machine-readable code. The evaluation order is fixed and
// mirrors the existing bootstrap grant: revoked -> not granted -> expired -> scope.
//
// The grant authorises REPOSITORIES, not identities: who the caller is stays the
// Host owner's business (see createHviLocalOwnerGate in ./hvi-capability.mjs). A
// valid owner session alone never grants repository access.
import { randomUUID } from 'node:crypto';
import { canonicalRepo } from '../../../hq/version-intelligence/sources/common.mjs';
import { readGrant, writeGrant, grantExpiryMs, GRANT_MAX_EXPIRY_MS } from '../bootstrap/service.mjs';

export const HVI_SOURCE_GRANT_KEY = 'grant.hvi.development-source';
export const HVI_SOURCE_GRANT_REVOKED_KEY = 'grant.hvi.development-source.revoked';
export const HVI_SOURCE_GRANT_MAX_REPOS = 16;

export const HVI_SOURCE_GRANT_REASONS = Object.freeze({
  revoked: 'HVI_SOURCE_GRANT_REVOKED',
  notGranted: 'HVI_SOURCE_GRANT_REQUIRED',
  expired: 'HVI_SOURCE_GRANT_EXPIRED',
  scope: 'HVI_SOURCE_GRANT_SCOPE',
  invalid: 'HVI_SOURCE_GRANT_INVALID',
});

const fail = code => { const e = new Error('HVI_SOURCE_GRANT_' + code); e.code = code; throw e; };
const refuse = (code, message) => ({ ok: false, code, message });

/**
 * A development-source grant store over the Host's existing ledger `meta` table.
 *
 * `ledger` is the EXISTING bootstrap ledger handle (apps/vivim-host/bootstrap/ledger.mjs).
 * The grant occupies its own meta key so it never widens or shadows the existing
 * bootstrap grant, and a revocation tombstone lives under a second key so "revoked"
 * stays distinguishable from "never granted".
 */
export function createHviSourceGrantStore({ ledger, now = () => new Date().toISOString() } = {}) {
  if (!ledger || typeof ledger.meta?.get !== 'function' || typeof ledger.meta?.set !== 'function'
      || typeof ledger.transaction !== 'function') fail('INVALID');
  const current = () => readGrant(ledger, HVI_SOURCE_GRANT_KEY);
  const tombstone = () => readGrant(ledger, HVI_SOURCE_GRANT_REVOKED_KEY);

  /** Owner action. Names the repositories, bounds the lifetime, clears any tombstone. */
  function issue({ actorId, repoIdentities, expiresInMs = GRANT_MAX_EXPIRY_MS } = {}) {
    if (typeof actorId !== 'string' || !actorId.trim()) fail('INVALID');
    if (!Array.isArray(repoIdentities) || repoIdentities.length < 1
        || repoIdentities.length > HVI_SOURCE_GRANT_MAX_REPOS) fail('INVALID');
    if (!Number.isInteger(expiresInMs) || expiresInMs < 1 || expiresInMs > GRANT_MAX_EXPIRY_MS) fail('INVALID');
    // canonicalRepo lowercases and rejects traversal, so the stored set is canonical.
    const repos = [...new Set(repoIdentities.map(repo => canonicalRepo(repo, 'github')))];
    const issuedAt = new Date(now()).toISOString();
    const issuedMs = Date.parse(issuedAt);
    if (!Number.isFinite(issuedMs)) fail('INVALID');
    const record = {
      id: 'hsg-' + randomUUID(),
      actorId: actorId.trim(),
      repoIdentities: repos,
      at: issuedAt,
      // Every NEW grant carries an absolute expiry, exactly like the bootstrap grant.
      expiresAt: new Date(issuedMs + expiresInMs).toISOString(),
      source: 'owner',
    };
    ledger.transaction(() => {
      writeGrant(ledger, record, HVI_SOURCE_GRANT_KEY);
      writeGrant(ledger, null, HVI_SOURCE_GRANT_REVOKED_KEY);
    });
    return { ...record, repoIdentities: [...record.repoIdentities] };
  }

  /** Owner action. Removes the grant and leaves a revocation tombstone behind. */
  function revoke({ actorId } = {}) {
    const prior = current();
    const revokedAt = new Date(now()).toISOString();
    ledger.transaction(() => {
      writeGrant(ledger, null, HVI_SOURCE_GRANT_KEY);
      writeGrant(ledger, {
        id: prior?.id ?? null,
        actorId: typeof actorId === 'string' && actorId.trim() ? actorId.trim() : null,
        repoIdentities: Array.isArray(prior?.repoIdentities) ? prior.repoIdentities : [],
        at: prior?.at ?? null,
        revokedAt,
      }, HVI_SOURCE_GRANT_REVOKED_KEY);
    });
    return { revoked: true, revokedAt, id: prior?.id ?? null };
  }

  /**
   * Pure authorization check. No side effects, so it is safe to call on EVERY source
   * read: the HVI port rechecks the grant per tree page, per blob and per projection.
   */
  function verify({ repoIdentity } = {}) {
    const nowMs = Date.parse(now());
    if (!Number.isFinite(nowMs)) return refuse(HVI_SOURCE_GRANT_REASONS.expired, 'grant clock is unreadable');
    // Revocation is checked FIRST: a revoked grant never becomes valid again by expiry.
    if (tombstone()) return refuse(HVI_SOURCE_GRANT_REASONS.revoked, 'development-source grant was revoked by the owner');
    const grant = current();
    if (!grant) return refuse(HVI_SOURCE_GRANT_REASONS.notGranted, 'no development-source grant exists');
    // An absent expiry is not evidence of a live grant: this grant type has no legacy
    // unbounded form, so absence fails closed. An unreadable expiry fails closed too
    // (grantExpiryMs returns 0 for it).
    const expiry = grantExpiryMs(grant);
    if (expiry === null || !Number.isFinite(expiry) || nowMs >= expiry) {
      return refuse(HVI_SOURCE_GRANT_REASONS.expired, 'development-source grant expired; the owner must grant again');
    }
    let repo;
    try { repo = canonicalRepo(repoIdentity, 'github'); }
    catch { return refuse(HVI_SOURCE_GRANT_REASONS.scope, 'repository identity is not canonical'); }
    if (!Array.isArray(grant.repoIdentities) || !grant.repoIdentities.includes(repo)) {
      return refuse(HVI_SOURCE_GRANT_REASONS.scope, 'repository is not in the granted development-source set');
    }
    return { ok: true, grant: { id: grant.id, repoIdentities: [...grant.repoIdentities], expiresAt: grant.expiresAt } };
  }

  /** Bounded, owner-readable status. Never exposes a path the owner did not grant. */
  function status() {
    const grant = current();
    const tomb = tombstone();
    const expiry = grant ? grantExpiryMs(grant) : null;
    const nowMs = Date.parse(now());
    return {
      schema: 'vivim.host.hvi-source-grant/1',
      granted: Boolean(grant) && !tomb,
      revoked: Boolean(tomb),
      expired: Boolean(grant) && (expiry === null || !Number.isFinite(expiry) || nowMs >= expiry),
      id: grant?.id ?? null,
      actorId: grant?.actorId ?? null,
      repoIdentities: Array.isArray(grant?.repoIdentities) ? [...grant.repoIdentities] : [],
      expiresAt: grant?.expiresAt ?? null,
      revokedAt: tomb?.revokedAt ?? null,
    };
  }

  return Object.freeze({ issue, revoke, verify, status });
}

/**
 * Adapter for the HVI read port's injected `verifyGrant` contract: the Host injects
 * this, the HVI port calls it on every source read.
 */
export function createHviSourceGrantVerifier(store) {
  if (!store || typeof store.verify !== 'function') fail('INVALID');
  return ctx => {
    const current = store.verify({ repoIdentity: ctx?.repoIdentity });
    if (current?.ok !== true) return false;
    const expected = ctx?.sourceGrantRef;
    // An admitted workstation read is pinned to its original grant, not merely
    // to a repository that might have been granted again during the read.
    if (ctx?.workstationReadOperation !== undefined || (expected !== undefined && expected !== null))
      return typeof expected === 'string' && expected.length > 0 && current.grant?.id === expected;
    // Legacy unpinned comparison callers still use live repository membership.
    return true;
  };
}

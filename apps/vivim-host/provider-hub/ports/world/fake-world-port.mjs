import { WORLD_PORT_SCHEMA, MOCK_MODE, MOCK_RECEIPT, assertWorldPort, validateWorldContext, validateWorldGrant, validateWorldEvidence, worldPortError } from './world-port.mjs';

// Synthetic scenario adapter, not a World persistence/authorization implementation.
// All state is per-instance and volatile. No network, file, browser or provider IO.
export function createFakeWorldPort({ grants, clock } = {}) {
  if (!Array.isArray(grants) || typeof clock !== 'function') throw worldPortError('WORLD_FAKE_DEPENDENCY');
  const fixtures = new Map(), revoked = new Set(), accountBindings = new Map();
  const worlds = new Map(), faults = new Map();
  const permittedFaults = new Set(['OFFLINE_BEFORE_CLAIM', 'UNCERTAIN_AFTER_CLAIM']);
  for (const item of grants) {
    const grant = validateWorldGrant(item);
    if (fixtures.has(grant.grantRef)) throw worldPortError('WORLD_GRANT_DUPLICATE');
    fixtures.set(grant.grantRef, grant);
    const key = [grant.worldId, grant.principalRef, grant.providerId].join('\0');
    const binding = grant.accountRef + '\0' + grant.accountEpoch;
    // The final seeded account is the initially active synthetic browser account.
    accountBindings.set(key, binding);
  }
  const snapshot = () => { const t = clock(); if (typeof t !== 'string' || !Number.isFinite(Date.parse(t))) throw worldPortError('WORLD_FAKE_CLOCK'); return Date.parse(t); };
  const worldKey = c => c.worldId + '\0' + c.principalRef;
  const keyFor = c => c.worldId + '\0' + c.principalRef + '\0' + c.providerId;
  const receiptKey = (c, id) => [c.providerId, c.accountRef, c.accountEpoch, id].join('\0');
  function state(c) {
    const key = worldKey(c);
    if (!worlds.has(key)) worlds.set(key, { revision: 0, evidence: new Map(), receipts: new Map() });
    return worlds.get(key);
  }
  function checkGrant({ context, capability }) {
    const c = validateWorldContext(context);
    if (typeof capability !== 'string' || !['stream.read','evidence.commit'].includes(capability)) throw worldPortError('WORLD_CAPABILITY_INVALID');
    const grant = fixtures.get(c.grantRef);
    let reason = null;
    if (!grant) reason = 'GRANT_UNKNOWN';
    else if (revoked.has(c.grantRef)) reason = 'GRANT_REVOKED';
    else if (snapshot() >= Date.parse(grant.expiresAt)) reason = 'GRANT_EXPIRED';
    else if (['worldId','principalRef','providerId','accountRef','accountEpoch','origin'].some(k => grant[k] !== c[k])) reason = 'BINDING_MISMATCH';
    else if (accountBindings.get(keyFor(c)) !== c.accountRef + '\0' + c.accountEpoch) reason = 'ACCOUNT_SWAPPED';
    else if (!grant.scopes.includes(capability)) reason = 'GRANT_SCOPE';
    return Object.freeze({ schema: WORLD_PORT_SCHEMA, mode: MOCK_MODE, decision: reason ? 'DENIED' : 'ALLOWED', reason });
  }
  function receipt(c, idempotencyKey, status, code, revision, extras = {}) {
    return Object.freeze({ schema: WORLD_PORT_SCHEMA, kind: MOCK_RECEIPT, mode: MOCK_MODE,
      worldId: c.worldId, principalRef: c.principalRef, providerId: c.providerId,
      accountRef: c.accountRef, accountEpoch: c.accountEpoch, idempotencyKey,
      status, code, revision, ...extras });
  }
  function commitEvidence({ context, evidence, expectedRevision, idempotencyKey }) {
    const c = validateWorldContext(context), e = validateWorldEvidence(evidence);
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 ||
        typeof idempotencyKey !== 'string' || !/^synthetic:\/\/intent\/[a-zA-Z0-9._~/-]{1,100}$/.test(idempotencyKey))
      throw worldPortError('WORLD_COMMIT_INVALID');
    const auth = checkGrant({ context: c, capability: 'evidence.commit' });
    if (auth.decision === 'DENIED') return receipt(c, idempotencyKey, 'DENIED', auth.reason, null);
    if (e.coverage === 'UNAVAILABLE') return receipt(c, idempotencyKey, 'DENIED', 'SOURCE_UNAVAILABLE', null);
    const s = state(c);
    const evidenceKey = [c.providerId, c.accountRef, c.accountEpoch, e.sourceRef, e.sourceRevision].join('\0');
    const intent = JSON.stringify({ c, e });
    const prior = s.receipts.get(receiptKey(c, idempotencyKey));
    if (prior) return prior.intent === intent ? Object.freeze({ ...prior.value, replayed: true })
      : receipt(c, idempotencyKey, 'DENIED', 'IDEMPOTENCY_CONFLICT', s.revision);
    if (s.revision !== expectedRevision) return receipt(c, idempotencyKey, 'DENIED', 'REVISION_CONFLICT', s.revision);
    const existing = s.evidence.get(evidenceKey);
    if (existing && existing.digest !== e.digest) return receipt(c, idempotencyKey, 'DENIED', 'SOURCE_CONFLICT', s.revision);
    if (s.receipts.size >= 1000 || s.evidence.size >= 1000) return receipt(c, idempotencyKey, 'DENIED', 'CAPACITY', s.revision);
    const fault = faults.get(idempotencyKey);
    if (fault === 'OFFLINE_BEFORE_CLAIM') return receipt(c, idempotencyKey, 'DENIED', 'OFFLINE', s.revision);
    if (fault === 'UNCERTAIN_AFTER_CLAIM') {
      // Effect fence is consumed; exactly this receipt is returned on replay. No retry.
      const result = receipt(c, idempotencyKey, 'UNCERTAIN', 'CLAIMED_WITHOUT_EVIDENCE', s.revision);
      s.receipts.set(receiptKey(c, idempotencyKey), { intent, value: result });
      return result;
    }
    if (!existing) { s.evidence.set(evidenceKey, e); s.revision++; }
    const result = receipt(c, idempotencyKey, e.coverage === 'PARTIAL' ? 'PARTIAL' : 'MOCK_APPLIED',
      existing ? 'DUPLICATE_EVIDENCE' : null, s.revision,
      { evidenceRef: e.sourceRef, coverage: e.coverage, gaps: e.gapCodes, deduplicated: Boolean(existing) });
    s.receipts.set(receiptKey(c, idempotencyKey), { intent, value: result });
    return result;
  }
  function readEvidence({ context, cursor = 0, limit = 20 }) {
    const c = validateWorldContext(context);
    if (!Number.isSafeInteger(cursor) || cursor < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw worldPortError('WORLD_PAGE_INVALID');
    const auth = checkGrant({ context: c, capability: 'stream.read' });
    if (auth.decision === 'DENIED') return Object.freeze({ schema: WORLD_PORT_SCHEMA, mode: MOCK_MODE, status: 'DENIED', code: auth.reason, items: Object.freeze([]), nextCursor: null });
    const s = state(c); const prefix = [c.providerId, c.accountRef, c.accountEpoch].join('\0') + '\0';
    const all = [...s.evidence.entries()].filter(([key]) => key.startsWith(prefix)).map(([, value]) => value);
    return Object.freeze({ schema: WORLD_PORT_SCHEMA, mode: MOCK_MODE, status: 'MOCK_ONLY', revision: s.revision,
      items: Object.freeze(all.slice(cursor, cursor + limit)), nextCursor: cursor + limit < all.length ? cursor + limit : null });
  }
  function readReceipt({ context, idempotencyKey }) {
    const c = validateWorldContext(context);
    if (typeof idempotencyKey !== 'string' || !/^synthetic:\/\/intent\/[a-zA-Z0-9._~/-]{1,100}$/.test(idempotencyKey)) throw worldPortError('WORLD_RECEIPT_REF_INVALID');
    const auth = checkGrant({ context: c, capability: 'evidence.commit' });
    if (auth.decision === 'DENIED') return receipt(c, idempotencyKey, 'DENIED', auth.reason, null);
    const found = state(c).receipts.get(receiptKey(c, idempotencyKey));
    return found ? found.value : receipt(c, idempotencyKey, 'NOT_FOUND', 'NO_MOCK_RECEIPT', null);
  }
  const port = Object.freeze({ schema: WORLD_PORT_SCHEMA, mode: MOCK_MODE, checkGrant, commitEvidence, readEvidence, readReceipt });
  assertWorldPort(port);
  // Test-only knobs are separately returned; they cannot be mistaken for Host methods.
  const scenario = Object.freeze({
    revoke(grantRef) { if (!fixtures.has(grantRef)) throw worldPortError('WORLD_GRANT_UNKNOWN'); revoked.add(grantRef); },
    switchAccount({ worldId, principalRef, providerId, accountRef, accountEpoch }) {
      if (![worldId, providerId].every(s => typeof s === 'string' && /^[a-z][a-z0-9-]{1,63}$/.test(s)) ||
          ![principalRef, accountRef].every(s => typeof s === 'string' && /^synthetic:\/\//.test(s)) ||
          !Number.isSafeInteger(accountEpoch) || accountEpoch < 0) throw worldPortError('WORLD_SCENARIO_INVALID');
      accountBindings.set([worldId,principalRef,providerId].join('\0'), accountRef + '\0' + accountEpoch);
    },
    fault(idempotencyKey, kind) {
      if (typeof idempotencyKey !== 'string' || !/^synthetic:\/\/intent\/[a-zA-Z0-9._~/-]{1,100}$/.test(idempotencyKey) ||
          !permittedFaults.has(kind)) throw worldPortError('WORLD_SCENARIO_INVALID');
      faults.set(idempotencyKey, kind);
    }
  });
  return Object.freeze({ port, scenario });
}

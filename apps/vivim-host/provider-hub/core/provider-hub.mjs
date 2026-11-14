// ARBOR Provider Hub W1-B. No external effects; all observations and actions use injected ports.
// Stable lane-local boundary; W1-G reconciles with contracts/provider-hub/v1.
export const HUB_SCHEMA = 'vivim.provider-hub/1';
export const HUB_MODE = Object.freeze({ MOCK: 'MOCK_ONLY', LIVE: 'LIVE_UNVERIFIED' });
export class HubError extends Error {
  constructor(code) { super(code); this.name = 'HubError'; this.code = code; }
}
const fail = code => { throw new HubError(code); };
const id = v => typeof v === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9:_./-]{0,159}$/.test(v);
const checked = (v, code) => { if (!id(v)) fail(code); return v; };
const validContext = ctx => {
  if (!ctx || typeof ctx !== 'object' || Array.isArray(ctx)) fail('CONTEXT_REQUIRED');
  return { principalRef: checked(ctx.principalRef, 'PRINCIPAL_REQUIRED'),
    worldRef: checked(ctx.worldRef, 'WORLD_REQUIRED'),
    accountRef: checked(ctx.accountRef, 'ACCOUNT_REQUIRED'),
    accountEpoch: Number.isSafeInteger(ctx.accountEpoch) && ctx.accountEpoch >= 0
      ? ctx.accountEpoch : fail('ACCOUNT_EPOCH_REQUIRED') };
};
const bounded = (limit, maximum = 50) => {
  if (limit === undefined) return 25;
  if (!Number.isInteger(limit) || limit < 1 || limit > maximum) fail('PAGE_LIMIT_INVALID');
  return limit;
};
const pageCursor = cursor => {
  if (cursor === undefined || cursor === null) return null;
  if (typeof cursor !== 'string' || cursor.length > 512 || !/^[A-Za-z0-9_-]+$/.test(cursor)) fail('CURSOR_INVALID');
  return cursor;
};
const requireRecord = (value, code) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(code);
  return value;
};
const safePage = (value, limit) => {
  requireRecord(value, 'PORT_PAGE_INVALID');
  if (!Array.isArray(value.items) || value.items.length > limit) fail('PORT_PAGE_INVALID');
  if (value.nextCursor !== null && value.nextCursor !== undefined) pageCursor(value.nextCursor);
  if (!['complete', 'partial', 'denied', 'uncertain', 'unavailable'].includes(value.state)) fail('PORT_STATE_INVALID');
  if (value.state === 'denied' && value.items.length) fail('DENIED_DATA_LEAK');
  return { schema: HUB_SCHEMA, state: value.state, items: value.items,
    nextCursor: value.nextCursor ?? null, evidenceRef: value.evidenceRef ?? null };
};
/** No credentials, network client, browser actor, durable store or implicit fallback. */
export function createProviderHub({ descriptors, sourcePort, worldPort, actionPort, mode = HUB_MODE.MOCK } = {}) {
  if (mode !== HUB_MODE.MOCK && mode !== HUB_MODE.LIVE) fail('MODE_INVALID');
  if (!Array.isArray(descriptors)) fail('DESCRIPTORS_REQUIRED');
  if (!sourcePort || !worldPort || !actionPort) fail('PORTS_REQUIRED');
  const registry = new Map();
  for (const d of descriptors) {
    requireRecord(d, 'DESCRIPTOR_INVALID');
    checked(d.providerId, 'PROVIDER_ID_INVALID');
    if (registry.has(d.providerId) || d.schema !== HUB_SCHEMA ||
      !Array.isArray(d.capabilities) || d.capabilities.some(x => !['streams', 'thread.read', 'search', 'action.propose', 'action.status'].includes(x)))
      fail('DESCRIPTOR_INVALID');
    registry.set(d.providerId, Object.freeze({ ...d, capabilities: Object.freeze([...d.capabilities]) }));
  }
  const port = (obj, method) => typeof obj[method] === 'function' ? obj[method].bind(obj) : fail('PORT_MISSING');
  const authorize = async (ctx, providerId, capability) => {
    const scope = validContext(ctx);
    checked(providerId, 'PROVIDER_ID_INVALID');
    const d = registry.get(providerId);
    if (!d) fail('PROVIDER_UNKNOWN');
    if (capability && !d.capabilities.includes(capability)) fail('CAPABILITY_UNSUPPORTED');
    const grant = requireRecord(await port(worldPort, 'authorize')({ ...scope, providerId, capability, mode }), 'WORLD_AUTH_INVALID');
    // Fail closed on stale account epoch, wrong principal, missing explicit grant or account swap.
    if (grant.allowed !== true || grant.principalRef !== scope.principalRef ||
        grant.worldRef !== scope.worldRef || grant.accountRef !== scope.accountRef ||
        grant.accountEpoch !== scope.accountEpoch) fail('ACCESS_DENIED');
    return { scope, d };
  };
  const checkedProvider = p => checked(p, 'PROVIDER_ID_INVALID');
  return Object.freeze({
    schema: HUB_SCHEMA,
    mode,
    async listProviders(ctx) {
      const scope = validContext(ctx);
      const rows = [];
      for (const d of registry.values()) {
        try {
          await authorize(scope, d.providerId, null);
          rows.push({ ...d, verification: mode === HUB_MODE.MOCK ? 'MOCK_ONLY' : 'LIVE_UNVERIFIED' });
        } catch (e) { if (e.code !== 'ACCESS_DENIED') throw e; }
      }
      return { schema: HUB_SCHEMA, providers: rows };
    },
    async listStreams(ctx, { providerId, kind, cursor = null, limit } = {}) {
      const { scope } = await authorize(ctx, checkedProvider(providerId), 'streams');
      checked(kind, 'STREAM_KIND_INVALID');
      return safePage(await port(sourcePort, 'listStreams')({ ...scope, providerId, kind, cursor: pageCursor(cursor), limit: bounded(limit), mode }), bounded(limit));
    },
    async readThread(ctx, { providerId, threadRef, cursor = null, limit } = {}) {
      const { scope } = await authorize(ctx, checkedProvider(providerId), 'thread.read');
      checked(threadRef, 'THREAD_REF_INVALID');
      return safePage(await port(sourcePort, 'readThread')({ ...scope, providerId, threadRef, cursor: pageCursor(cursor), limit: bounded(limit), mode }), bounded(limit));
    },
    async search(ctx, { providerId, query, cursor = null, limit } = {}) {
      const { scope } = await authorize(ctx, checkedProvider(providerId), 'search');
      if (typeof query !== 'string' || !query.trim() || query.length > 256) fail('QUERY_INVALID');
      return safePage(await port(sourcePort, 'search')({ ...scope, providerId, query, cursor: pageCursor(cursor), limit: bounded(limit), mode }), bounded(limit));
    },
    async proposeAction(ctx, proposal) {
      requireRecord(proposal, 'PROPOSAL_INVALID');
      const { providerId, accountRef, accountEpoch, threadRef, recipientRef, draftRef, draftDigest, expectedRevision } = proposal;
      const { scope } = await authorize(ctx, checkedProvider(providerId), 'action.propose');
      if (scope.accountRef !== accountRef || scope.accountEpoch !== accountEpoch) fail('ACCOUNT_SWAP');
      for (const [v, name] of [[threadRef, 'THREAD_REF_INVALID'], [recipientRef, 'RECIPIENT_REF_INVALID'],
        [draftRef, 'DRAFT_REF_INVALID'], [expectedRevision, 'REVISION_INVALID']]) checked(v, name);
      if (typeof draftDigest !== 'string' || !/^[a-f0-9]{64}$/.test(draftDigest)) fail('DRAFT_DIGEST_INVALID');
      // Never accept a caller's approval, success claim or raw draft/body as authority.
      if (['approval', 'approved', 'receipt', 'result', 'rawDraft', 'body', 'send'].some(k => Object.hasOwn(proposal, k))) fail('PROPOSAL_AUTHORITY_INVALID');
      const plan = requireRecord(await port(actionPort, 'propose')({
        schema: HUB_SCHEMA, mode, ...scope, providerId, threadRef, recipientRef,
        draftRef, draftDigest, expectedRevision }), 'ACTION_PLAN_INVALID');
      if (plan.executionPerformed !== false || plan.state !== 'proposed') fail('ACTION_PORT_UNSAFE');
      return { schema: HUB_SCHEMA, mode, state: 'proposed', executionPerformed: false, planRef: checked(plan.planRef, 'PLAN_REF_INVALID') };
    },
    async actionStatus(ctx, { providerId, planRef } = {}) {
      const { scope } = await authorize(ctx, checkedProvider(providerId), 'action.status');
      checked(planRef, 'PLAN_REF_INVALID');
      const result = requireRecord(await port(actionPort, 'status')({ ...scope, providerId, planRef, mode }), 'STATUS_INVALID');
      if (!['proposed', 'planned', 'approved', 'claimed', 'uncertain', 'applied', 'failed', 'denied'].includes(result.state)) fail('STATUS_INVALID');
      if (mode === HUB_MODE.MOCK && result.receipt && result.receipt.marker !== 'MOCK_RECEIPT') fail('MOCK_RECEIPT_REQUIRED');
      return { schema: HUB_SCHEMA, mode, state: result.state, receipt: result.receipt ?? null };
    },
  });
}

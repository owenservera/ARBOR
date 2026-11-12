/**
 * W2 H: inert Host development-source adapter to EXISTING HQ action registry/router.
 * No HTTP route, source reader, grant writer, alternate executor, or remote exposure.
 * Bootstrap registration into the actual Host command catalog remains a later H step.
 */
import { buildActions } from '../../../hq/lib/action-registry.mjs';
import { route } from '../../../hq/lib/action-router.mjs';
import { runHviTool, HVI_CAPABILITY_ID, HVI_TOOL_REQUEST_SCHEMA } from
  '../../../hq/version-intelligence/integration/index.mjs';

export const HVI_HOST_ACTION_ID = 'versions.compare.pinned';
export const HVI_HOST_BINDING_SCHEMA = 'vivim.host.hvi-read-port/1';
const fail = code => {
  const e = new Error('HVI_HOST_' + code); e.code = code; throw e;
};
function validIdentity(x) {
  return typeof x === 'string' && x.length > 0 && x.length <= 128 &&
    /^[A-Za-z0-9._:@-]+$/.test(x);
}

/** Caller injects the EXISTING Host authenticated grant authority. */
export function createHviHostReadPort({ actorId, sessionId, verifyGrant, enabled = false } = {}) {
  if (!validIdentity(actorId) || !validIdentity(sessionId) ||
    typeof verifyGrant !== 'function') fail('AUTHORITY_REQUIRED');
  const actions = buildActions({
    domains: [{ name: 'versions', purpose: 'read-only explicitly pinned source version intelligence',
      objects: [{ name: 'pinned', purpose: 'compare source versions and explain evidence and uncertainty' }] }],
    verbs: [{ verb: 'compare', purpose: 'compare explicitly selected immutable repository revisions',
      risk: 'medium', mutates: false, actors: ['owner'], approval: true }],
    // An actual handler requires live Host grants, not registry metadata.
    handlers: { 'versions.compare': { command: 'arbor.hvi.compare.pinned/1',
      note: 'Host live-grant validation required before invocation' } },
  });
  const action = actions.find(x => x.id === HVI_HOST_ACTION_ID);
  if (!action) fail('REGISTRATION_INVALID');
  const discover = query => {
    if (typeof query !== 'string' || !query.trim() || query.length > 1000)
      return { schema: HVI_HOST_BINDING_SCHEMA, outcome: 'NO_MATCH', actions: [] };
    const result = route(actions, query);
    return { schema: HVI_HOST_BINDING_SCHEMA,
      outcome: result.ok ? 'DECLARED_DISABLED' : 'NO_MATCH',
      actions: result.matches.map(m => ({ id: m.action.id, capabilityId: HVI_CAPABILITY_ID,
        score: m.score, enabled: false, requiresLiveGrant: true })),
      authority: 'none', liveRegistered: false };
  };
  const invoke = async (request, { signal } = {}) => {
    if (!enabled) fail('HOST_FEATURE_DISABLED');
    if (request?.schema !== HVI_TOOL_REQUEST_SCHEMA || !Array.isArray(request.sourceManifests))
      fail('INVALID_REQUEST');
    if (signal?.aborted) fail('CANCELLED');
    // An explicit source selection is required; no idle or implicit repo scan.
    if (request.sourceManifests.length < 2 || request.sourceManifests.length > 16)
      fail('RESOURCE_LIMIT');
    let checks = 0;
    const authorize = async ctx => {
      if (signal?.aborted) return false;
      checks++;
      return await verifyGrant({
        ...ctx, actorId, sessionId, sourceDomain: 'development',
        capabilityId: HVI_CAPABILITY_ID, liveCheckOrdinal: checks
      }) === true;
    };
    const result = await runHviTool(request, { authorize, signal,
      context: { actorId, sessionId, sourceDomain: 'development' } });
    return {
      schema: HVI_HOST_BINDING_SCHEMA, outcome: 'SOURCE_ANALYSIS_ONLY',
      result, grantCheckCount: checks, actorId, sessionId,
      remoteAccepted: false, runtimeAccepted: false,
      note: 'Local-source adapter, NOT a verified Host routed/remote grant integration',
    };
  };
  return Object.freeze({
    schema: HVI_HOST_BINDING_SCHEMA, action, actions,
    capabilityId: HVI_CAPABILITY_ID, discover,
    invoke, enabled, remoteAccessible: false,
  });
}

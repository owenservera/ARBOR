// A deliberately inert, versioned boundary. The *existing Host* must supply the
// production implementation after an explicit G-owned integration review.
export const WORLD_PORT_SCHEMA = 'arbor.provider-hub.world-port/1';
export const MOCK_MODE = 'MOCK_ONLY';
export const MOCK_RECEIPT = 'MOCK_RECEIPT';

const ID = /^[a-z][a-z0-9-]{1,63}$/;
const REF = /^synthetic:\/\/[a-z][a-z0-9-]*\/[a-zA-Z0-9._~/-]{1,160}$/;
const HEX = /^[a-f0-9]{64}$/;
const CAPABILITIES = new Set(['stream.read', 'evidence.commit']);
const COVERAGE = new Set(['COMPLETE', 'PARTIAL', 'UNAVAILABLE']);
const GAPS = new Set(['E2EE_UNAVAILABLE', 'HISTORY_GAP', 'OFFLINE', 'EXPORT_CORRUPT', 'REDACTED']);

export function worldPortError(code) { const error = new TypeError(code); error.code = code; return error; }
function requireShape(value, keys, required, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Object.prototype ||
      Object.keys(value).some(k => !keys.includes(k)) ||
      required.some(k => !Object.hasOwn(value, k))) throw worldPortError(code);
}
function validRef(s) { return typeof s === 'string' && REF.test(s) && s.split('/').slice(3).every(segment => segment !== '' && segment !== '.' && segment !== '..'); }
function timestamp(s) { return typeof s === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s) && Number.isFinite(Date.parse(s)); }
function validOrigin(s) { try { const u = new URL(s); return u.protocol === 'https:' && u.origin === s && !u.username && !u.password; } catch { return false; } }
function validBinding(v) { return ID.test(v.worldId) && validRef(v.principalRef) && ID.test(v.providerId) && validRef(v.accountRef) && Number.isSafeInteger(v.accountEpoch) && v.accountEpoch >= 0 && validOrigin(v.origin); }

export function validateWorldContext(context) {
  requireShape(context, ['worldId','principalRef','providerId','accountRef','accountEpoch','origin','grantRef'], ['worldId','principalRef','providerId','accountRef','accountEpoch','origin','grantRef'], 'WORLD_CONTEXT_INVALID');
  if (!validBinding(context) || !validRef(context.grantRef)) throw worldPortError('WORLD_CONTEXT_INVALID');
  return Object.freeze({ ...context });
}
export function validateWorldGrant(grant) {
  requireShape(grant, ['schema','worldId','principalRef','providerId','accountRef','accountEpoch','origin','grantRef','scopes','expiresAt'], ['schema','worldId','principalRef','providerId','accountRef','accountEpoch','origin','grantRef','scopes','expiresAt'], 'WORLD_GRANT_FIXTURE_INVALID');
  if (grant.schema !== WORLD_PORT_SCHEMA || !validBinding(grant) || !validRef(grant.grantRef) ||
      !Array.isArray(grant.scopes) || grant.scopes.length < 1 || grant.scopes.length > 2 ||
      new Set(grant.scopes).size !== grant.scopes.length || grant.scopes.some(s => !CAPABILITIES.has(s)) ||
      !timestamp(grant.expiresAt)) throw worldPortError('WORLD_GRANT_FIXTURE_INVALID');
  return Object.freeze({ ...grant, scopes: Object.freeze([...grant.scopes]) });
}
export function validateWorldEvidence(evidence) {
  requireShape(evidence, ['sourceRef','sourceRevision','digest','observedAt','coverage','gapCodes'], ['sourceRef','sourceRevision','digest','observedAt','coverage','gapCodes'], 'WORLD_EVIDENCE_INVALID');
  if (!validRef(evidence.sourceRef) || typeof evidence.sourceRevision !== 'string' ||
      !/^[a-zA-Z0-9._:-]{1,80}$/.test(evidence.sourceRevision) ||
      typeof evidence.digest !== 'string' || !HEX.test(evidence.digest) ||
      !timestamp(evidence.observedAt) || !COVERAGE.has(evidence.coverage) ||
      !Array.isArray(evidence.gapCodes) || evidence.gapCodes.length > 5 ||
      new Set(evidence.gapCodes).size !== evidence.gapCodes.length ||
      evidence.gapCodes.some(g => !GAPS.has(g)) ||
      (evidence.coverage === 'COMPLETE' && evidence.gapCodes.length !== 0) ||
      (evidence.coverage === 'PARTIAL' && evidence.gapCodes.length === 0)) throw worldPortError('WORLD_EVIDENCE_INVALID');
  // Source text, messages, recipients, tokens and URLs are deliberately NOT in this vocabulary.
  return Object.freeze({ ...evidence, gapCodes: Object.freeze([...evidence.gapCodes]) });
}
export function assertWorldPort(port) {
  if (!port || port.schema !== WORLD_PORT_SCHEMA || !['MOCK_ONLY','HOST_INJECTED'].includes(port.mode) ||
      ['checkGrant','commitEvidence','readEvidence','readReceipt'].some(k => typeof port[k] !== 'function'))
    throw worldPortError('WORLD_PORT_INVALID');
  return port;
}

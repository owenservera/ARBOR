// Direct Host enrollment: Android native Keystore or browser WebCrypto device proof.
// Only grant metadata persists in localStorage. Session bearers stay in memory.
import { createBrowserDeviceSigner } from './browser-device-key.mjs';
const KEY = 'vivim.device.grant.v1';
const SCOPES = ['relay:read','relay:write','control:read','control:execute'];
const nonce = () => [...crypto.getRandomValues(new Uint8Array(16))]
  .map(x => x.toString(16).padStart(2,'0')).join('');
// Main-frame promise facade backed by Android WebMessagePort, never a Java object.
const native = () => {
  const b = globalThis.VivimDeviceKey;
  if (!b || typeof b.publicKeyPem !== 'function' ||
      typeof b.signEnrollment !== 'function' || typeof b.signSession !== 'function')
    throw new Error('The VIVIM Android app is required for secure device enrollment.');
  return b;
};
export async function prepareDeviceSigner() {
  // Never silently downgrade a partially initialized native Android bridge.
  if (globalThis.VivimDeviceKey !== undefined) {
    const bridge = native();
    return Object.freeze({
      kind: 'native',
      publicKeyPem: (...args) => bridge.publicKeyPem(...args),
      signEnrollment: (...args) => bridge.signEnrollment(...args),
      signSession: (...args) => bridge.signSession(...args),
    });
  }
  const browser = createBrowserDeviceSigner();
  await browser.ready(); // Persists/validates nonextractable key before one-use QR redemption.
  // No QR is consumed if browser storage is unavailable.
  const probe = 'vivim.device.storage.probe';
  try { localStorage.setItem(probe, '1'); localStorage.removeItem(probe); }
  catch { throw Object.assign(new Error('BROWSER_GRANT_STORAGE_UNAVAILABLE'), { code: 'BROWSER_GRANT_STORAGE_UNAVAILABLE' }); }
  return browser;
}
async function signerForGrant(kind) {
  if (kind === 'browser') {
    const browser = createBrowserDeviceSigner();
    await browser.ready();
    return browser;
  }
  if (kind === 'native') return native();
  throw Object.assign(new Error('DEVICE_SIGNER_KIND_INVALID'), { code: 'DEVICE_SIGNER_KIND_INVALID' });
}
async function endpoint(path, method = 'GET', body) {
  const res = await fetch('/mobile/api/enrollment/' + path, {
    method, credentials:'same-origin', cache:'no-store',
    headers: {'content-type':'application/json', ...(method === 'POST' ? {'origin': location.origin} : {})},
    ...(body === undefined ? {} : {body:JSON.stringify(body)})
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(result.error || 'Enrollment unavailable'), {status:res.status});
  return result;
}
export async function enrollWithChallenge(challenge, { signer } = {}) {
  const b = signer ?? await prepareDeviceSigner();
  if (challenge.origin !== location.origin || !challenge.user ||
      !challenge.challengeId || !challenge.challenge || !challenge.nonce)
    throw new Error('Invalid PC enrollment challenge');
  const transcript = ['vivim-enrollment-v1',challenge.challengeId,challenge.challenge,
    challenge.nonce,challenge.origin,challenge.user].join('\\n');
  const grant = await endpoint('prove','POST',{
    challengeId:challenge.challengeId,
    publicKeyPem:await b.publicKeyPem(),
    signature:await b.signEnrollment(challenge.challengeId,challenge.challenge,
      challenge.nonce,challenge.origin,challenge.user),
    signedTranscript:transcript, requestedScopes:SCOPES
  });
  if (grant.status !== 'pending' || !/^[a-f0-9]{32}$/.test(grant.grantId || ''))
    throw new Error('Device grant was not accepted as pending');
  localStorage.setItem(KEY,JSON.stringify({grantId:grant.grantId,origin:challenge.origin,user:challenge.user,kind:b.kind === 'browser' ? 'browser' : 'native'}));
  return grant;
}
function savedGrant() {
  try {
    const grant = JSON.parse(localStorage.getItem(KEY));
    if (grant?.origin === location.origin && /^[a-f0-9]{32}$/.test(grant.grantId) && grant.user &&
        (grant.kind === undefined || grant.kind === 'native' || grant.kind === 'browser'))
      return grant;
  } catch {}
  return null;
}
export async function resumeDeviceSession(transport) {
  if (!transport.direct) return {status:'not-direct'};
  const grant = savedGrant();
  if (!grant) return {status:'unpaired'};
  const status = await endpoint('grant-status?id='+encodeURIComponent(grant.grantId));
  if (status.status === 'revoked') {
    localStorage.removeItem(KEY);
    transport.setDeviceSession(null);
    return {status:'revoked'};
  }
  if (status.status !== 'active') return {status:status.status};
  const b = await signerForGrant(grant.kind ?? 'native'), n = nonce(), timestamp = Date.now();
  const session = await endpoint('session','POST',{
    grantId:grant.grantId, nonce:n, timestamp,
    deviceKeyProof:await b.signSession(grant.grantId,n,String(timestamp),grant.origin,grant.user)
  });
  transport.setDeviceSession(session);
  return {status:'active',scopes:session.scopes};
}
export function clearDeviceEnrollment(transport) {
  localStorage.removeItem(KEY);
  transport.setDeviceSession(null);
}

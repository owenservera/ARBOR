# File: apps/mobile-relay/device-enrollment.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/device-enrollment.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5243 B |
| Lines | 104 |
| Hash | 31b491cfc8dd |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| KEY | const | 4 | no | const KEY = &#39;vivim.device.grant.v1&#39;; |
| SCOPES | const | 5 | no | const SCOPES = [&#39;relay:read&#39;,&#39;relay:write&#39;,&#39;control:read&#39;,&#39;control:execute&#39;]; |
| nonce | function | 6 | no | const nonce = () =&gt; [...crypto.getRandomValues(new Uint8Array(16))] |
| native | function | 9 | no | const native = () =&gt; { |
| b | const | 10 | no | const b = globalThis.VivimDeviceKey; |
| prepareDeviceSigner | function | 16 | yes | export async function prepareDeviceSigner() { |
| bridge | const | 19 | no | const bridge = native(); |
| browser | const | 27 | no | const browser = createBrowserDeviceSigner(); |
| probe | const | 30 | no | const probe = &#39;vivim.device.storage.probe&#39;; |
| signerForGrant | function | 35 | no | async function signerForGrant(kind) { |
| browser | const | 37 | no | const browser = createBrowserDeviceSigner(); |
| endpoint | function | 44 | no | async function endpoint(path, method = &#39;GET&#39;, body) { |
| res | const | 45 | no | const res = await fetch(&#39;/mobile/api/enrollment/&#39; + path, { method, credentials:&#39;same-origin&#39;, cache:&#39;no-store&#39;, headers: {&#39;content-type&#39;:&#39;application/json&#39;, ...(method === &#39;POST&#39; ? {&#39;origin&#39;: locati… |
| result | const | 50 | no | const result = await res.json().catch(() =&gt; ({})); |
| enrollWithChallenge | function | 54 | yes | export async function enrollWithChallenge(challenge, { signer } = {}) { |
| b | const | 55 | no | const b = signer ?? await prepareDeviceSigner(); |
| transcript | const | 59 | no | const transcript = [&#39;vivim-enrollment-v1&#39;,challenge.challengeId,challenge.challenge, |
| grant | const | 61 | no | const grant = await endpoint(&#39;prove&#39;,&#39;POST&#39;,{ challengeId:challenge.challengeId, publicKeyPem:await b.publicKeyPem(), signature:await b.signEnrollment(challenge.challengeId,challenge.challenge, chall… |
| savedGrant | function | 73 | no | function savedGrant() { |
| grant | const | 75 | no | const grant = JSON.parse(localStorage.getItem(KEY)); |
| resumeDeviceSession | function | 82 | yes | export async function resumeDeviceSession(transport) { |
| grant | const | 84 | no | const grant = savedGrant(); |
| status | const | 86 | no | const status = await endpoint(&#39;grant-status?id=&#39;+encodeURIComponent(grant.grantId)); |
| b | const | 93 | no | const b = await signerForGrant(grant.kind ?? &#39;native&#39;), n = nonce(), timestamp = Date.now(); |
| session | const | 94 | no | const session = await endpoint(&#39;session&#39;,&#39;POST&#39;,{ grantId:grant.grantId, nonce:n, timestamp, deviceKeyProof:await b.signSession(grant.grantId,n,String(timestamp),grant.origin,grant.user) }); |
| clearDeviceEnrollment | function | 101 | yes | export function clearDeviceEnrollment(transport) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./browser-device-key.mjs | import | 3 | [apps/mobile-relay/browser-device-key.mjs](./browser-device-key.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/app.js](./app.js.md) | ./device-enrollment.mjs |
| [apps/mobile-relay/test/a08-paired-pwa-acceptance.test.mjs](./test/a08-paired-pwa-acceptance.test.mjs.md) | ../device-enrollment.mjs |
| [apps/mobile-relay/test/a08-paired-pwa-acceptance.test.mjs](./test/a08-paired-pwa-acceptance.test.mjs.md) | ../device-enrollment.mjs |
| [apps/mobile-relay/test/browser-enrollment-flow.test.mjs](./test/browser-enrollment-flow.test.mjs.md) | ../device-enrollment.mjs |
| [apps/mobile-relay/test/device-enrollment.test.mjs](./test/device-enrollment.test.mjs.md) | ../device-enrollment.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
    await browser.requireExisting(); // Existing grant cannot silently rotate device identity.
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
```

_First 80 of 105 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

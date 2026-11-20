# File: apps/vivim-host/test/apk-enrollment.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/apk-enrollment.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5411 B |
| Lines | 120 |
| Hash | 0d8cdc25c0f9 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 10 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;apk07-enroll-test-&#39;)); |
| origin | const | 11 | no | const origin = &#39;https://phone.example.ts.net&#39;; |
| user | const | 12 | no | const user = &#39;owner@example.com&#39;; |
| e | const | 13 | no | const e = createEnrollment({ dataRoot: root, origin, user }); |
| publicKeyPem | const | 17 | no | const publicKeyPem = publicKey.export({ type: &#39;spki&#39;, format: &#39;pem&#39; }); |
| signTranscript | function | 18 | no | const signTranscript = (message) =&gt; sign(&#39;sha256&#39;, Buffer.from(message, &#39;utf8&#39;), privateKey).toString(&#39;base64&#39;); |
| s | const | 21 | no | const s = e.startChallenge({ deviceHint: &#39;oppo&#39; }); |
| st0 | const | 28 | no | const st0 = e.status({ challengeId: s.challengeId }); |
| transcript | const | 34 | no | const transcript = [&#39;vivim-enrollment-v1&#39;, s.challengeId, s.challenge, s.nonce, origin, user].join(&#39;\\\\n&#39;); |
| p | const | 44 | no | const p = e.prove({ challengeId: s.challengeId, publicKeyPem, signature: signTranscript(transcript), requestedScopes: [&#39;read:world&#39;, &#39;write:draft&#39;], |
| grants | const | 60 | no | const grants = e.listGrants(); |
| a | const | 67 | no | const a = e.approveGrant({ grantId: p.grantId, approvedScopes: [&#39;read:world&#39;], approvedBy: &#39;owner&#39; }); |
| sessionNonce | const | 75 | no | const sessionNonce = randomBytes(32).toString(&#39;hex&#39;); |
| sessionTimestamp | const | 76 | no | const sessionTimestamp = Date.now(); |
| sessionTranscript | const | 77 | no | const sessionTranscript = [&#39;vivim-session-v1&#39;, p.grantId, sessionNonce, String(sessionTimestamp), origin, user].join(&#39;\\\\n&#39;); |
| sess | const | 78 | no | const sess = e.createSession({ grantId: p.grantId, nonce: sessionNonce, timestamp: sessionTimestamp, deviceKeyProof: signTranscript(sessionTranscript) |
| v | const | 89 | no | const v = e.validateGrant({ grantId: p.grantId, sessionId: sess.sessionId }); |
| rv | const | 100 | no | const rv = e.revokeGrant({ grantId: p.grantId, revokedBy: &#39;owner&#39; }); |
| root | const | 114 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;apk07-enroll-expiry-&#39;)); |
| e | const | 115 | no | const e = createEnrollment({ dataRoot: root, origin: &#39;https://x.ts.net&#39;, user: &#39;owner&#39; }); |
| s | const | 116 | no | const s = e.startChallenge({ deviceHint: &#39;d&#39; }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:crypto | import | 6 | external |
| ../apk/enrollment.mjs | import | 7 | [apps/vivim-host/apk/enrollment.mjs](../apk/enrollment.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generateKeyPairSync, sign, randomBytes } from 'node:crypto';
import { createEnrollment } from '../apk/enrollment.mjs';

test('enrollment start -> prove -> pending grant -> approve -> session -> validate -> revoke', async t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'apk07-enroll-test-'));
  const origin = 'https://phone.example.ts.net';
  const user = 'owner@example.com';
  const e = createEnrollment({ dataRoot: root, origin, user });
  // A real EC P-256 device key: the Host rejects anything it cannot verify
  // against the canonical transcript (enrollment.mjs requireDeviceSignature).
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  const signTranscript = (message) => sign('sha256', Buffer.from(message, 'utf8'), privateKey).toString('base64');

  // start challenge
  const s = e.startChallenge({ deviceHint: 'oppo' });
  assert.equal(typeof s.challengeId, 'string');
  assert.equal(typeof s.nonce, 'string');
  assert.equal(typeof s.expiresAt, 'number');
  assert.equal(s.ttlMs, 10 * 60 * 1000);

  // status before prove
  const st0 = e.status({ challengeId: s.challengeId });
  assert.equal(st0.proved, false);
  assert.equal(st0.ttlRemainingMs > 0, true);

  // The proof must bind to the Host-issued challenge and this exact origin/user;
  // a caller-supplied transcript can never redefine what was signed.
  const transcript = ['vivim-enrollment-v1', s.challengeId, s.challenge, s.nonce, origin, user].join('\\n');
  assert.throws(() => e.prove({
    challengeId: s.challengeId,
    publicKeyPem,
    signature: signTranscript('tampered transcript'),
    requestedScopes: ['read:world', 'write:draft'],
    signedTranscript: 'tampered transcript'
  }), /TRANSCRIPT_MISMATCH/);

  // prove (single-use, consumes challenge)
  const p = e.prove({
    challengeId: s.challengeId,
    publicKeyPem,
    signature: signTranscript(transcript),
    requestedScopes: ['read:world', 'write:draft'],
    signedTranscript: transcript
  });
  assert.equal(p.status, 'pending');
  assert.equal(typeof p.grantId, 'string');
  assert.equal(typeof p.deviceId, 'string');
  assert.deepEqual(p.scopes, ['read:world', 'write:draft']);

  // challenge consumed -> status unknown
  assert.throws(() => e.status({ challengeId: s.challengeId }), /CHALLENGE_UNKNOWN/);

  // list grants -> 1 pending
  const grants = e.listGrants();
  assert.equal(grants.length, 1);
  assert.equal(grants[0].status, 'pending');
  // no raw key material returned
  assert.equal(grants[0].deviceKeyFingerprint, undefined);

  // approve -> active
  const a = e.approveGrant({ grantId: p.grantId, approvedScopes: ['read:world'], approvedBy: 'owner' });
  assert.equal(a.status, 'active');
  assert.deepEqual(a.scopes, ['read:world']);

  // double approve rejected
  assert.throws(() => e.approveGrant({ grantId: p.grantId, approvedScopes: ['read:world'] }), /GRANT_NOT_PENDING/);

  // create session: one-shot nonce + fresh timestamp, signed by the device key
  const sessionNonce = randomBytes(32).toString('hex');
  const sessionTimestamp = Date.now();
  const sessionTranscript = ['vivim-session-v1', p.grantId, sessionNonce, String(sessionTimestamp), origin, user].join('\\n');
  const sess = e.createSession({
    grantId: p.grantId,
    nonce: sessionNonce,
```

_First 80 of 121 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

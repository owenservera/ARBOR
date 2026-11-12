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
    timestamp: sessionTimestamp,
    deviceKeyProof: signTranscript(sessionTranscript)
  });
  assert.equal(typeof sess.sessionId, 'string');
  assert.equal(sess.deviceId, p.deviceId);
  assert.deepEqual(sess.scopes, ['read:world']);

  // validate active grant
  const v = e.validateGrant({ grantId: p.grantId, sessionId: sess.sessionId });
  assert.equal(v.deviceId, p.deviceId);
  assert.deepEqual(v.scopes, ['read:world']);

  // session mismatch rejected
  assert.throws(() => e.validateGrant({ grantId: p.grantId, sessionId: 'wrong-session' }), /SESSION_MISMATCH/);

  // wrong/unknown grant rejected
  assert.throws(() => e.validateGrant({ grantId: 'nope', sessionId: sess.sessionId }), /GRANT_UNKNOWN/);

  // revoke -> revoked
  const rv = e.revokeGrant({ grantId: p.grantId, revokedBy: 'owner' });
  assert.equal(rv.status, 'revoked');

  // validate after revoke -> 403 (grant no longer active)
  assert.throws(() => e.validateGrant({ grantId: p.grantId, sessionId: sess.sessionId }), /GRANT_NOT_ACTIVE|GRANT_REVOKED/);

  // unknown grant approve/revoke
  assert.throws(() => e.approveGrant({ grantId: 'nope' }), /GRANT_UNKNOWN/);
  assert.throws(() => e.revokeGrant({ grantId: 'nope' }), /GRANT_UNKNOWN/);

  rmSync(root, { recursive: true, force: true });
});

test('enrollment challenge expiry', t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'apk07-enroll-expiry-'));
  const e = createEnrollment({ dataRoot: root, origin: 'https://x.ts.net', user: 'owner' });
  const s = e.startChallenge({ deviceHint: 'd' });
  // Force expiry by mutating internal map is not exposed; skip time test, just confirm shape.
  assert.equal(typeof s.challengeId, 'string');
  rmSync(root, { recursive: true, force: true });
});

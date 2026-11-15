import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { generateKeyPairSync, sign, randomBytes } from 'node:crypto';
import { createHostServer } from '../server.mjs';
import { createEnrollment } from '../apk/enrollment.mjs';

// Contract integration across the actual Host route, file-backed token store,
// authenticated Direct proxy route and onboarding status projection. No fake
// pairing endpoint or second browser owner is involved.
test('an installed phone redeems a single-use Direct token and the PC observes the same device', async () => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-first-phone-'));
  const directOrigin = 'https://pc.tailnet.ts.net';
  // Pair registration is a privileged owner POST: it needs the Host owner
  // capability as well as the Direct identity. Mint one for this run.
  const ownerToken = randomBytes(32).toString('hex');
  const server = createHostServer({
    dataRoot, ownerToken, directPhone: { origin: directOrigin, user: 'owner@example.com' }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const call = (method, route, { direct = false, body, headers: extra = {} } = {}) => new Promise((resolve, reject) => {
    const headers = {
      host: direct ? 'pc.tailnet.ts.net' : '127.0.0.1:' + port,
      ...(direct ? { 'x-forwarded-proto': 'https', 'tailscale-user-login': 'owner@example.com',
                     origin: directOrigin } : {}),
      ...extra
    };
    if (body !== undefined) headers['content-type'] = 'application/json';
    const req = http.request({ hostname: '127.0.0.1', port, path: route, method, headers }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        try {
          const text = Buffer.concat(chunks).toString('utf8');
          resolve({ status: response.statusCode, body: text ? JSON.parse(text) : null });
        } catch (error) { reject(error); }
      });
    });
    req.on('error', reject);
    if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });
  try {
    const before = await call('GET', '/api/onboarding/pair-status');
    assert.equal(before.status, 200);
    assert.equal(before.body.paired, false);

    const issued = await call('POST', '/api/onboarding/pair/register', {
      body: {platform:'android',app:'vivim-mobile'},
      headers: { origin: 'http://127.0.0.1:' + port, 'x-vivim-control': '1',
        authorization: 'Bearer ' + ownerToken }
    });
    assert.equal(issued.status, 201);
    assert.match(issued.body.token, /^[a-f0-9]{64}$/);
    assert.ok(issued.body.expiresAt > Date.now());

    // QR redemption is discovery only: it consumes the token and issues an
    // enrollment challenge. It never pairs a device or mints a trusted ID.
    const proof = await call('POST', '/mobile/api/pair', { direct:true, body:{token:issued.body.token} });
    assert.equal(proof.status, 202);
    assert.equal(proof.body.ok, true);
    assert.equal(proof.body.paired, false);
    assert.equal(proof.body.enrollmentRequired, true);
    assert.equal(typeof proof.body.challengeId, 'string');
    assert.equal(typeof proof.body.challenge, 'string');
    assert.equal(typeof proof.body.nonce, 'string');

    // The phone proves the canonical transcript with a real EC P-256 device key.
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
    const transcript = ['vivim-enrollment-v1', proof.body.challengeId, proof.body.challenge,
      proof.body.nonce, directOrigin, 'owner@example.com'].join('\\n');
    const enrolled = await call('POST', '/mobile/api/enrollment/prove', { direct:true, body:{
      challengeId: proof.body.challengeId, publicKeyPem,
      signature: sign('sha256', Buffer.from(transcript, 'utf8'), privateKey).toString('base64'),
      signedTranscript: transcript, requestedScopes: ['relay:read', 'relay:write'] } });
    assert.equal(enrolled.status, 201);
    assert.equal(enrolled.body.status, 'pending');
    assert.match(enrolled.body.deviceId, /^[a-f0-9]{32}$/);

    // The PC sees a pending device, not a paired one: approval is owner-only.
    const pending = await call('GET', '/api/onboarding/pair-status');
    assert.equal(pending.body.paired, false);
    assert.equal(pending.body.pendingApprovals, 1);
    const owner = createEnrollment({ dataRoot, origin: null, user: null });
    owner.approveGrant({ grantId: enrolled.body.grantId,
      approvedScopes: ['relay:read', 'relay:write'], approvedBy: 'owner' });

    // The phone opens a signed device session; a relay read proves presence.
    const sessionNonce = randomBytes(16).toString('hex');
    const sessionTimestamp = Date.now();
    const sessionTranscript = ['vivim-session-v1', enrolled.body.grantId, sessionNonce,
      String(sessionTimestamp), directOrigin, 'owner@example.com'].join('\\n');
    const session = await call('POST', '/mobile/api/enrollment/session', { direct:true, body:{
      grantId: enrolled.body.grantId, nonce: sessionNonce, timestamp: sessionTimestamp,
      deviceKeyProof: sign('sha256', Buffer.from(sessionTranscript, 'utf8'), privateKey).toString('base64') } });
    assert.equal(session.status, 201);
    assert.ok(session.body.sessionId);

    const device = { 'x-vivim-grant-id': enrolled.body.grantId, 'x-vivim-device-session': session.body.sessionId };
    assert.equal((await call('GET', '/mobile/api/relay?path=session', { direct:true, headers: device })).status, 200);

    const pc = await call('GET', '/api/onboarding/pair-status');
    assert.equal(pc.body.paired, true, 'the approved grant is the PC-side pairing');
    assert.equal(pc.body.deviceId, enrolled.body.deviceId);

    const guided = await call('GET', '/api/onboarding/state');
    assert.equal(guided.status, 200);
    assert.equal(guided.body.onboarding.phone.paired, true);
    assert.equal(guided.body.onboarding.phone.deviceId, enrolled.body.deviceId);
    assert.equal(guided.body.onboarding.phone.connected, true);

    const repeated = await call('POST', '/mobile/api/pair', { direct:true, body:{token:issued.body.token} });
    assert.equal(repeated.status, 410, 'a redeemed QR code can never pair twice');

    const attacker = await call('POST', '/mobile/api/pair', { direct:true, body:{token:'a'.repeat(64)} });
    assert.equal(attacker.status, 410, 'unknown tokens never activate');
  } finally {
    await new Promise(resolve => server.close(resolve));
    try { rmSync(dataRoot, { recursive:true, force:true, maxRetries:10, retryDelay:250 }); } catch { /* leftover temp on Windows */ }
  }
});

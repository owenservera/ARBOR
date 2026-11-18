import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { generateKeyPairSync, sign, randomBytes } from 'node:crypto';
import { createEnrollment } from '../apk/enrollment.mjs';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHostServer } from '../server.mjs';

test('desktop and Direct mobile share one dispatcher with separate real authentication', async t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vivim-control-http-'));
  const origin = 'https://control.example.ts.net';
  const ownerToken = 'owner-test-token-'.repeat(3);
  const server = createHostServer({ dataRoot: root, ownerToken, directPhone: { origin, user: 'owner@example.com' } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); try { rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 }); } catch { /* leftover temp: enrollment sqlite handle lingers on Windows */ } });
  function call(url, { method = 'GET', headers = {}, body } = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port: server.address().port, path: url, method,
        headers: { host: 'localhost', ...headers } }, res => {
          const chunks = []; res.on('data', x => chunks.push(x));
          res.on('end', () => { const text = Buffer.concat(chunks).toString('utf8'); let json = null; try { json = JSON.parse(text); } catch { /* not json */ } resolve({ status: res.statusCode, json }); });
        });
      req.on('error', reject); req.end(body);
    });
  }
  const bearer = { authorization: 'Bearer ' + ownerToken };
  const desk = { ...bearer, origin: 'http://localhost', 'x-vivim-control': '1', 'content-type': 'application/json' };
  const post = (url, headers, obj) => call(url, { method: 'POST', headers, body: JSON.stringify(obj) });

  // --- desktop authentication ---
  assert.equal((await call('/api/host/control/catalog')).status, 401);
  const catalog = await call('/api/host/control/catalog', { headers: bearer });
  assert.equal(catalog.status, 200);
  assert.equal(catalog.json.status, 'plan_and_dispatch');
  assert.equal((await post('/api/host/control/plan', { ...bearer, 'content-type': 'application/json' }, { text: 'Set my theme to dusk' })).status, 403);
  assert.equal((await post('/api/host/control/plan', { ...desk, origin: 'https://evil.invalid' }, { text: 'Set my theme to dusk' })).status, 403);
  assert.equal((await call('/api/host/control/nope', { headers: bearer })).status, 404);

  // --- plan is not an effect; execution needs the exact digest ---
  const grant = await post('/api/host/bootstrap/grant', { ...bearer, origin: 'http://localhost', 'x-vivim-bootstrap': '1', 'content-type': 'application/json' }, { scope: 'onboarding-visual' });
  assert.equal(grant.status, 200);
  const plan = await post('/api/host/control/plan', desk, { text: 'Set my theme to dusk' });
  assert.equal(plan.status, 200);
  assert.equal(plan.json.actionId, 'ui.theme.set_preset');
  assert.equal(plan.json.outcome, 'approval_required');
  assert.equal(plan.json.executionPerformed, false);
  assert.equal((await post('/api/host/control/execute', desk, { planId: plan.json.planId, planDigest: '0'.repeat(64) })).status, 409);
  const receipt = await post('/api/host/control/execute', desk, { planId: plan.json.planId, planDigest: plan.json.planDigest });
  assert.equal(receipt.status, 200);
  assert.equal(receipt.json.status, 'applied');
  assert.equal(receipt.json.approvedVia, 'desktop-owner-token');
  assert.equal((await call('/api/host/control/plans/' + plan.json.planId, { headers: bearer })).json.state, 'applied');

  // --- Actual mounted HTTP → Host Control → product Wiki journal ---
  // Host Wiki is mutated only after approved Control plan and remains projected from disk.
  const wikiBefore = await call('/api/wiki');
  assert.equal(wikiBefore.status, 200);
  assert.equal(wikiBefore.json.revision, 1);
  const nlWiki = await post('/api/host/control/plan', desk,
    { text: 'Edit wiki section Main/HowTo saying Updated instructions' });
  assert.equal(nlWiki.status, 200, JSON.stringify(nlWiki.json));
  assert.equal(nlWiki.json.actionId, 'wiki.section.edit');
  assert.equal(nlWiki.json.outcome, 'approval_required');
  assert.deepEqual(nlWiki.json.preview, {
    target: 'Main/HowTo', before: wikiBefore.json.pages.Main.sections.HowTo,
    after: 'Updated instructions', expectedRevision: 1
  });
  assert.deepEqual((await call('/api/wiki')).json, wikiBefore.json, 'preview alone must never mutate');
  const wikiReceipt = await post('/api/host/control/execute', desk,
    { planId: nlWiki.json.planId, planDigest: nlWiki.json.planDigest });
  assert.equal(wikiReceipt.status, 200, JSON.stringify(wikiReceipt.json));
  assert.equal(wikiReceipt.json.status, 'applied');
  assert.equal(wikiReceipt.json.result.wikiRevision, 2);
  assert.equal((await call('/api/wiki')).json.pages.Main.sections.HowTo, 'Updated instructions');
  const wikiReplay = await post('/api/host/control/execute', desk,
    { planId: nlWiki.json.planId, planDigest: nlWiki.json.planDigest });
  assert.equal(wikiReplay.json.replayed, true);
  assert.equal((await call('/api/wiki')).json.revision, 2, 'replay must not append again');
  const staleWiki = await post('/api/host/control/plan', desk,
    { actionId: 'wiki.section.edit', args: { target: 'Main/HowTo', content: 'stale plan' } });
  const newerWiki = await post('/api/host/control/plan', desk,
    { actionId: 'wiki.section.edit', args: { target: 'Main/HowTo', content: 'newer content' } });
  assert.equal(staleWiki.json.outcome, 'approval_required');
  assert.equal(newerWiki.json.outcome, 'approval_required');
  assert.equal((await post('/api/host/control/execute', desk,
    { planId: newerWiki.json.planId, planDigest: newerWiki.json.planDigest })).json.status, 'applied');
  assert.equal((await post('/api/host/control/execute', desk,
    { planId: staleWiki.json.planId, planDigest: staleWiki.json.planDigest })).status, 409);
  assert.equal((await call('/api/wiki')).json.pages.Main.sections.HowTo, 'newer content');

  // --- Direct mobile: Tailscale identity, same origin, explicit header ---
  // Privileged phone control additionally requires an approved device grant
  // (Tailscale authenticates the network user, not the installed phone).
  const proxy = { host: 'control.example.ts.net', 'x-forwarded-proto': 'https', 'tailscale-user-login': 'owner@example.com' };
  assert.equal((await call('/mobile/api/control/catalog', { headers: { ...proxy, 'tailscale-user-login': 'attacker@example.com' } })).status, 403);
  for (const asset of ['control-phone.mjs', 'control-language.mjs', 'composer-assist.mjs', 'nlcl/index.mjs', 'nlcl/interpret.mjs']) {
    assert.equal((await call('/mobile/' + asset, { headers: proxy })).status, 200, asset);
  }
  // Enroll a real device: EC P-256 keypair proves the canonical transcript, the
  // owner approves control scopes, and the phone opens a signed session.
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  const enrollment = createEnrollment({ dataRoot: root, origin: null, user: null });
  // The Direct handler only answers on the exact HTTPS origin, so enrollment
  // traffic must carry the same Tailscale identity as the control reads.
  const start = (await call('/mobile/api/enrollment/start', {
    method: 'POST', headers: { ...proxy, 'content-type': 'application/json' }, body: '{}'
  })).json;
  const transcript = ['vivim-enrollment-v1', start.challengeId, start.challenge, start.nonce, origin, 'owner@example.com'].join('\\n');
  const proof = sign('sha256', Buffer.from(transcript), privateKey).toString('base64');
  const deviceGrant = (await call('/mobile/api/enrollment/prove', {
    method: 'POST', headers: { ...proxy, 'content-type': 'application/json' },
    body: JSON.stringify({ challengeId: start.challengeId, publicKeyPem, signature: proof,
      signedTranscript: transcript, requestedScopes: ['control:read', 'control:execute'] }),
  })).json;
  assert.equal(deviceGrant.status, 'pending');
  assert.equal((await call('/mobile/api/control/catalog', { headers: proxy })).status, 401,
    'un-enrolled phone identity is not enough for control reads');
  enrollment.approveGrant({ grantId: deviceGrant.grantId, approvedScopes: ['control:read', 'control:execute'], approvedBy: 'desktop-owner' });
  const nonce = randomBytes(16).toString('hex');
  const timestamp = Date.now();
  const signedSession = ['vivim-session-v1', deviceGrant.grantId, nonce, String(timestamp), origin, 'owner@example.com'].join('\\n');
  const sessionProof = sign('sha256', Buffer.from(signedSession), privateKey).toString('base64');
  const session = (await call('/mobile/api/enrollment/session', {
    method: 'POST', headers: { ...proxy, 'content-type': 'application/json' },
    body: JSON.stringify({ grantId: deviceGrant.grantId, nonce, timestamp, deviceKeyProof: sessionProof }),
  })).json;
  assert.ok(session.sessionId);
  const device = { 'x-vivim-grant-id': deviceGrant.grantId, 'x-vivim-device-session': session.sessionId };
  const phone = { ...proxy, ...device, origin, 'x-vivim-control': '1', 'content-type': 'application/json' };
  const mobileCatalog = await call('/mobile/api/control/catalog', { headers: { ...proxy, ...device } });
  assert.equal(mobileCatalog.json.actions.length, catalog.json.actions.length);
  const pack = await call('/mobile/api/control/language', { headers: { ...proxy, ...device } });
  assert.equal(pack.json.schema, 'vivim.control-language-pack/1');
  assert.equal((await post('/mobile/api/control/plan', proxy, { text: 'Set my theme to ember' })).status, 401);
  const mobilePlan = await post('/mobile/api/control/plan', phone, { text: 'Set my theme to ember' });
  assert.equal(mobilePlan.json.actionId, 'ui.theme.set_preset');
  assert.equal(mobilePlan.json.source, 'mobile');
  const mobileReceipt = await post('/mobile/api/control/execute', phone, { planId: mobilePlan.json.planId, planDigest: mobilePlan.json.planDigest });
  assert.equal(mobileReceipt.json.status, 'applied');
  assert.equal(mobileReceipt.json.approvedVia, 'direct-phone');
  const replay = await post('/mobile/api/control/execute', phone, { planId: mobilePlan.json.planId, planDigest: mobilePlan.json.planDigest });
  assert.equal(replay.json.replayed, true);
  const ambiguous = await post('/mobile/api/control/plan', phone, { text: 'stop all traffic' });
  assert.equal(ambiguous.json.outcome, 'clarification_required');
  const read = await post('/mobile/api/control/plan', phone, { text: 'show my theme' });
  assert.equal(read.json.outcome, 'done');
  assert.equal(read.json.result.preset, 'ember');
  assert.equal((await post('/mobile/api/control/execute', phone, { planId: 'ctl-0000000000000000', planDigest: 'x' })).status, 404);
});

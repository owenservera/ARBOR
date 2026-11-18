import test from 'node:test';
import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { generateKeyPairSync, sign, randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHostServer } from '../server.mjs';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createEnrollment } from '../apk/enrollment.mjs';

test('paired Direct phone: NL Wiki preview -> device approval -> durable Host state', async t => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'arbor-wiki-phone-'));
  const origin = 'https://wiki-phone.example.ts.net';
  const user = 'owner@example.com';
  const runtime = createBootstrapRuntime({ dataRoot });
  const server = createHostServer({
    dataRoot, bootstrap: runtime, onboarding: { phoneSeen() {}, primary: () => null },
    directPhone: { origin, user }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    runtime.close();
    rmSync(dataRoot, { recursive: true, force: true });
  });
  const port = server.address().port;
  const headers = { host: 'wiki-phone.example.ts.net',
    'x-forwarded-proto': 'https', 'tailscale-user-login': user };
  let deviceHeaders = {};
  const call = (route, { method = 'GET', body, extra = {} } = {}) =>
    new Promise((resolve, reject) => {
      const req = httpRequest({ host: '127.0.0.1', port, path: route, method,
        headers: { ...headers, ...deviceHeaders, ...extra } }, res => {
        let response = '';
        res.on('data', chunk => { response += chunk; });
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(response) }); }
          catch { reject(new Error('Unexpected non-JSON Host response: ' + route)); }
        });
      });
      req.on('error', reject);
      req.end(body === undefined ? undefined : JSON.stringify(body));
    });

  assert.equal((await call('/mobile/api/wiki')).status, 401);
  assert.equal((await call('/mobile/api/control/plan', {
    method: 'POST', extra: { origin, 'x-vivim-control': '1', 'content-type': 'application/json' },
    body: { text: 'edit wiki section main/about saying Updated from Phone' }
  })).status, 401);

  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  const challenge = (await call('/mobile/api/enrollment/start', {
    method: 'POST', extra: { 'content-type': 'application/json' }, body: {}
  })).body;
  const transcript = ['vivim-enrollment-v1', challenge.challengeId,
    challenge.challenge, challenge.nonce, origin, user].join('\\n');
  const grant = (await call('/mobile/api/enrollment/prove', {
    method: 'POST', extra: { 'content-type': 'application/json' },
    body: { challengeId: challenge.challengeId, publicKeyPem,
      signature: sign('sha256', Buffer.from(transcript), privateKey).toString('base64'),
      signedTranscript: transcript, requestedScopes: ['control:read', 'control:execute'] }
  })).body;
  assert.equal(grant.status, 'pending');
  const owner = createEnrollment({ dataRoot, origin: null, user: null });
  owner.approveGrant({ grantId: grant.grantId,
    approvedScopes: ['control:read', 'control:execute'], approvedBy: 'desktop-owner' });
  const nonce = randomBytes(16).toString('hex'), timestamp = Date.now();
  const signedSession = ['vivim-session-v1', grant.grantId, nonce, String(timestamp), origin, user].join('\\n');
  const device = (await call('/mobile/api/enrollment/session', {
    method: 'POST', extra: { 'content-type': 'application/json' },
    body: { grantId: grant.grantId, nonce, timestamp,
      deviceKeyProof: sign('sha256', Buffer.from(signedSession), privateKey).toString('base64') }
  })).body;
  assert.ok(device.sessionId);
  deviceHeaders = { 'x-vivim-grant-id': grant.grantId,
    'x-vivim-device-session': device.sessionId };

  const readCommand = body => call('/mobile/api/control/plan', {
    method: 'POST', extra: { origin, 'x-vivim-control': '1', 'content-type': 'application/json' }, body
  });
  const before = await call('/mobile/api/wiki');
  assert.equal(before.status, 200);
  const listed = await readCommand({ actionId: 'wiki.pages.list', args: {} });
  assert.equal(listed.status, 200);
  assert.equal(listed.body.outcome, 'done');
  assert.equal(listed.body.effect, 'read');
  assert.equal(listed.body.requiresApproval, false);
  assert.equal(listed.body.planId, undefined);
  assert.deepEqual(listed.body.result.pages.map(p => p.page), Object.keys(before.body.pages));
  const initial = await readCommand({ actionId: 'wiki.section.read', args: { page: 'main', section: 'about' } });
  assert.equal(initial.body.outcome, 'done');
  assert.equal(initial.body.result.content, before.body.pages.Main.sections.About);
  const nlList = await readCommand({ text: 'list wiki pages' });
  assert.equal(nlList.status, 200);
  assert.equal(nlList.body.actionId, 'wiki.pages.list');
  assert.equal(nlList.body.effect, 'read');
  assert.deepEqual(nlList.body.result, listed.body.result);
  const nlRead = await readCommand({ text: 'read wiki page main in section about' });
  assert.equal(nlRead.status, 200);
  assert.equal(nlRead.body.actionId, 'wiki.section.read');
  assert.deepEqual(nlRead.body.result, initial.body.result);
  const incomplete = await readCommand({ text: 'read wiki page main' });
  assert.equal(incomplete.body.outcome, 'incomplete');
  assert.equal(incomplete.body.executionPerformed, false);
  const missing = await readCommand({ actionId: 'wiki.section.read', args: { page: 'missing', section: 'about' } });
  assert.equal(missing.body.outcome, 'refused');
  assert.equal(missing.body.executionPerformed, false);
  assert.equal((await call('/mobile/api/wiki')).body.revision, before.body.revision);
  const preview = await call('/mobile/api/control/plan', {
    method: 'POST', extra: { origin, 'x-vivim-control': '1', 'content-type': 'application/json' },
    body: { text: 'edit wiki section main/about saying Updated from Phone' }
  });
  assert.equal(preview.status, 200, JSON.stringify(preview.body));
  assert.equal(preview.body.outcome, 'approval_required');
  assert.deepEqual(preview.body.approval.channels, ['direct-phone']);
  assert.deepEqual(preview.body.preview, {
    target: 'Main/About', before: before.body.pages.Main.sections.About,
    after: 'Updated from Phone', expectedRevision: before.body.revision
  });
  assert.equal((await call('/mobile/api/wiki')).body.revision, before.body.revision);
  const execute = () => call('/mobile/api/control/execute', {
    method: 'POST', extra: { origin, 'x-vivim-control': '1', 'content-type': 'application/json' },
    body: { planId: preview.body.planId, planDigest: preview.body.planDigest }
  });
  assert.equal((await call('/mobile/api/control/execute', {
    method: 'POST', extra: { origin: 'https://wrong-origin.example', 'x-vivim-control': '1',
      'content-type': 'application/json' },
    body: { planId: preview.body.planId, planDigest: preview.body.planDigest }
  })).status, 403);
  const receipt = await execute();
  assert.equal(receipt.status, 200, JSON.stringify(receipt.body));
  assert.equal(receipt.body.status, 'applied');
  assert.equal(receipt.body.result.wikiRevision, before.body.revision + 1);
  assert.equal(receipt.body.result.content, 'Updated from Phone');
  const after = await call('/mobile/api/wiki');
  assert.equal(after.body.pages.Main.sections.About, 'Updated from Phone');
  assert.equal(after.body.revision, before.body.revision + 1);
  assert.equal((await execute()).body.replayed, true);
  assert.equal((await call('/mobile/api/wiki')).body.revision, after.body.revision);
  const readback = await readCommand({ actionId: 'wiki.section.read', args: { page: 'MAIN', section: 'ABOUT' } });
  assert.equal(readback.body.outcome, 'done');
  const nlReadback = await readCommand({ text: 'read wiki page main in section about' });
  assert.equal(nlReadback.body.outcome, 'done');
  assert.deepEqual(nlReadback.body.result, readback.body.result);
  assert.deepEqual(readback.body.result, { page: 'Main', section: 'About',
    wikiRevision: after.body.revision, content: 'Updated from Phone' });
  const create=await readCommand({text:'create wiki page sprint-notes'});
  assert.equal(create.body.outcome,'approval_required',JSON.stringify(create.body));
  assert.equal(create.body.actionId,'wiki.page.create');
  assert.equal(create.body.preview.expectedRevision,after.body.revision);
  const approveStructure=p=>call('/mobile/api/control/execute',{
    method:'POST',extra:{origin,'x-vivim-control':'1','content-type':'application/json'},
    body:{planId:p.planId,planDigest:p.planDigest}
  });
  assert.equal(Object.hasOwn((await call('/mobile/api/wiki')).body.pages,'sprint-notes'),false);
  assert.equal((await approveStructure(create.body)).body.status,'applied');
  assert.equal((await approveStructure(create.body)).body.replayed,true);
  const linked=await readCommand({text:'link wiki pages from main to sprint-notes'});
  const move=await readCommand({text:'move wiki page sprint-notes to top'});
  assert.equal(linked.body.outcome,'approval_required',JSON.stringify(linked.body));
  assert.equal(linked.body.actionId,'wiki.pages.link');
  assert.equal(move.body.outcome,'approval_required',JSON.stringify(move.body));
  assert.equal(move.body.actionId,'wiki.page.move');
  assert.equal((await approveStructure(linked.body)).body.status,'applied');
  assert.notEqual((await approveStructure(move.body)).body.status,'applied');
  const freshMove=await readCommand({actionId:'wiki.page.move',args:{page:'sprint-notes',position:'top'}});
  assert.equal((await approveStructure(freshMove.body)).body.status,'applied');
  const structured=(await call('/mobile/api/wiki')).body;
  assert.equal(Object.keys(structured.pages)[0],'sprint-notes');
  assert.deepEqual(structured.pages.Main.links,['sprint-notes']);
  assert.equal(structured.pages.Main.sections.About,'Updated from Phone');
  assert.equal(structured.pages['sprint-notes'].sections.About,'');
  assert.equal(structured.revision,after.body.revision+3);
  const related=await readCommand({actionId:'wiki.section.read',args:{page:'sprint-notes',section:'About'}});
  assert.deepEqual(related.body.result.relatedPages,['Main']);
  const editNew=await readCommand({text:'edit wiki section sprint-notes/about saying Actual sprint notes'});
  assert.equal(editNew.body.outcome,'approval_required',JSON.stringify(editNew.body));
  assert.equal((await approveStructure(editNew.body)).body.status,'applied');
  const reread=await readCommand({text:'read wiki page sprint-notes in section about'});
  assert.equal(reread.body.result.content,'Actual sprint notes');
  assert.deepEqual(reread.body.result.relatedPages,['Main']);
  owner.revokeGrant({ grantId: grant.grantId, revokedBy: 'desktop-owner' });
  assert.equal((await readCommand({ actionId: 'wiki.pages.list', args: {} })).status, 403);
  assert.equal((await call('/mobile/api/wiki')).status, 403);
  assert.equal((await execute()).status, 403);
});

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
  // Unified API is a derived discovery surface, not a new execution authority.
  const apiPath = '/api/host/control/openapi.json';
  assert.equal((await call(apiPath)).status, 401);
  assert.equal((await call(apiPath, { headers: { ...bearer, origin: 'https://evil.invalid' } })).status, 403);
  const api = await call(apiPath, { headers: bearer });
  assert.equal(api.status, 200);
  assert.equal(api.json.openapi, '3.1.1');
  assert.equal(api.json['x-vivim'].catalogVersion, catalog.json.version);
  assert.deepEqual(api.json['x-vivim'].capabilities.map(a => a.id), catalog.json.actions.map(a => a.actionId));
  assert.equal(api.json.paths['/api/host/control/execute'].post.operationId, 'vivimApproveAndExecute');
  const alternatives = api.json.paths['/api/host/control/plan'].post.requestBody.content['application/json'].schema.oneOf;
  const wikiEdit = alternatives.find(a => a.properties.actionId?.const === 'wiki.section.edit');
  assert.deepEqual(wikiEdit.properties.args.required.sort(), ['content', 'target']);
  assert.equal(wikiEdit.properties.args.additionalProperties, false);
  assert.equal(api.json['x-vivim'].capabilities.filter(a => a.available).length, catalog.json.coverage.verified);
  assert.equal((await post(apiPath, desk, {})).status, 405);
  const targetsPath = '/api/host/control/integration-targets';
  assert.equal((await call(targetsPath)).status, 401);
  assert.equal((await call(targetsPath, { headers: { ...bearer, origin: 'https://evil.invalid' } })).status, 403);
  const targets = await call(targetsPath, { headers: bearer });
  assert.equal(targets.status, 200);
  assert.equal(targets.json.authority, 'research-only');
  assert.equal(targets.json.total, 1000);
  assert.equal(targets.json.entries.length, 1000);
  assert.equal(new Set(targets.json.entries.map(e => e.id)).size, 1000);
  assert.ok(targets.json.entries.every(e => !e.verified.web && !e.verified.api && !e.verified.native));
  assert.ok(targets.json.entries.every(e => !catalog.json.actions.some(a => a.actionId === e.id)));
  assert.equal((await post(targetsPath, desk, {})).status, 405);
  // Bounded v0.2 discovery, retaining the original full-catalog endpoint.
  const searchPath = targetsPath + '/search';
  assert.equal((await call(searchPath)).status, 401);
  assert.equal((await call(searchPath, { headers: { ...bearer, origin: 'https://evil.invalid' } })).status, 403);
  const page1 = await call(searchPath + '?limit=2', { headers: bearer });
  assert.equal(page1.status, 200);
  assert.equal(page1.json.authority, 'research-only');
  assert.equal(page1.json.total, 1000);
  assert.deepEqual(page1.json.entries.map(x => x.id), ['VIV-0001','VIV-0002']);
  assert.ok(page1.json.nextCursor);
  const next = '&cursor=' + encodeURIComponent(page1.json.nextCursor);
  const page2 = await call(searchPath + '?limit=2' + next, { headers: bearer });
  assert.equal(page2.status, 200);
  assert.deepEqual(page2.json.entries.map(x => x.id), ['VIV-0003','VIV-0004']);
  assert.equal(page2.json.revision, page1.json.revision);
  assert.equal((await call(searchPath + '?limit=3' + next, { headers: bearer })).status, 400);
  assert.equal((await call(searchPath + '?limit=2&q=gmail' + next, { headers: bearer })).status, 400);
  assert.equal((await call(searchPath + '?limit=2' + next + 'x', { headers: bearer })).status, 400);
  for (const invalid of ['limit=0','limit=101','limit=2&limit=3','unknown=1','tier=invalid']) {
    assert.equal((await call(searchPath + '?' + invalid, { headers: bearer })).status, 400);
  }
  const gmail = await call(searchPath + '?q=Gmail&category=Email%20and%20calendar&tier=P0', { headers: bearer });
  assert.equal(gmail.status, 200);
  assert.ok(gmail.json.entries.some(x=>x.id==='VIV-0003'));
  assert.ok(gmail.json.entries.every(x=>x.category==='Email and calendar' && x.tier==='P0'));
  const capabilitiesPath = '/api/host/control/capabilities';
  assert.equal((await call(capabilitiesPath)).status, 401);
  const reads = await call(capabilitiesPath + '?risk=R0&readiness=source_wired&limit=100',{headers:bearer});
  assert.equal(reads.status,200);
  assert.equal(reads.json.authority,'catalog-description-only');
  assert.equal(reads.json.total,catalog.json.actions.filter(x=>x.risk==='R0'&&x.readiness==='source_wired').length);
  assert.ok(reads.json.entries.every(x=>x.risk==='R0'&&x.readiness==='source_wired'&&!x.available));
  assert.equal((await call(capabilitiesPath+'?limit=2'+next,{headers:bearer})).status,400);
  assert.equal((await post(capabilitiesPath,desk,{})).status,405);
  assert.ok(api.json.paths[searchPath].get.parameters.some(x=>x.name==='cursor'));
  assert.ok(api.json.paths[capabilitiesPath].get.parameters.some(x=>x.name==='risk'));
  // Exact action detail is descriptive. Internal browser primitives are not tools.
  const detailPath=capabilitiesPath+'/wiki.section.edit';
  assert.equal((await call(detailPath)).status,401);
  assert.equal((await call(detailPath,{headers:{...bearer,origin:'https://evil.invalid'}})).status,403);
  const detail=await call(detailPath,{headers:bearer});
  assert.equal(detail.status,200);
  assert.equal(detail.json.capability.id,'wiki.section.edit');
  assert.equal(detail.json.capability.risk,'R1');
  assert.equal(detail.json.source.catalogVersion,catalog.json.version);
  assert.equal(detail.json.authorization,'not-evaluated');
  assert.equal(detail.json.semanticMapping.semanticId,null);
  assert.equal(detail.json.invocation.inputSchema.properties.actionId.const,'wiki.section.edit');
  assert.deepEqual(detail.json.invocation.inputSchema.properties.args.required.sort(),['content','target']);
  assert.equal((await call(capabilitiesPath+'/VIV-0003',{headers:bearer})).status,404);
  assert.equal((await call(capabilitiesPath+'/unknown.action',{headers:bearer})).status,404);
  assert.equal((await post(detailPath,desk,{})).status,405);
  const sourcesPath='/api/host/control/capability-sources';
  assert.equal((await call(sourcesPath)).status,401);
  const sources=await call(sourcesPath,{headers:bearer});
  assert.equal(sources.status,200);
  assert.equal(sources.json.host.count,catalog.json.actions.length);
  assert.equal(sources.json.researchTargets.count,1000);
  assert.equal(sources.json.researchTargets.authority,'research-only');
  assert.equal(sources.json.studio.publicInvocation,false);
  assert.equal(sources.json.countsAreNotAdditive,true);
  assert.equal(sources.json.semantic.mappedCount,null);
  assert.ok(['descriptor-complete','descriptor-partial','unavailable'].includes(sources.json.studio.status));
  if(sources.json.studio.status!=='unavailable'){
    assert.equal(sources.json.studio.families.reduce((n,f)=>n+f.count,0),sources.json.studio.count);
    assert.ok(!Object.hasOwn(sources.json.studio,'atoms'));
  }
  assert.ok(api.json.paths[sourcesPath]);
  assert.ok(api.json.paths[capabilitiesPath+'/{actionId}']);




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
  for (const asset of ['control-phone.mjs', 'control-language.mjs', 'composer-assist.mjs', 'wiki-source-view.mjs', 'nlcl/index.mjs', 'nlcl/interpret.mjs']) {
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

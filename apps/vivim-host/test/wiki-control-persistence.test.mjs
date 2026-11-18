import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHostServer } from '../server.mjs';

// Actual Host HTTP routes and actual persistent product/control journals; no mock Wiki writer.
test('natural-language Wiki edit: approval, CAS, once-only append and persistent readback', async t => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-wiki-control-'));
  const ownerToken = 'wiki-owner-test-token-'.repeat(3);
  let server = null;
  const start = async () => {
    const instance = createHostServer({ dataRoot, ownerToken, autoPump: false });
    await new Promise((resolve, reject) => {
      instance.once('error', reject);
      instance.listen(0, '127.0.0.1', resolve);
    });
    server = instance;
  };
  const stop = async () => {
    if (server?.listening) await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
    server = null;
  };
  t.after(async () => {
    await stop();
    try { rmSync(dataRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 }); }
    catch { /* SQLite handles may linger on Windows. Do not hide an assertion failure. */ }
  });
  const request = (url, { method = 'GET', headers = {}, body } = {}) => new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1', port: server.address().port, path: url, method,
      headers: { host: 'localhost', ...headers }
    }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(raw); } catch {}
        resolve({ status: res.statusCode, json, raw });
      });
    });
    req.on('error', reject);
    req.end(body);
  });
  const bearer = { authorization: 'Bearer ' + ownerToken };
  const desktop = { ...bearer, origin: 'http://localhost', 'x-vivim-control': '1', 'content-type': 'application/json' };
  const post = (url, headers, body) => request(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const plan = body => post('/api/host/control/plan', desktop, body);
  const execute = body => post('/api/host/control/execute', desktop, body);
  const wiki = async () => {
    const response = await request('/api/wiki');
    assert.equal(response.status, 200);
    return response.json;
  };
  const records = async () => {
    const response = await request('/api/journal');
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.json));
    return response.json;
  };

  await start();
  const before = await wiki();
  const original = before.pages.Main.sections.About;
  const text = 'Updated from VIVIM';
  const proposed = await plan({ text: 'edit wiki section main/about saying ' + text });
  assert.equal(proposed.status, 200, JSON.stringify(proposed.json));
  assert.equal(proposed.json.actionId, 'wiki.section.edit');
  assert.equal(proposed.json.outcome, 'approval_required');
  assert.equal(proposed.json.executionPerformed, false);
  assert.deepEqual(proposed.json.preview, {
    target: 'Main/About', before: original, after: text, expectedRevision: before.revision
  });
  assert.deepEqual(await wiki(), before, 'planning and preview must never modify the Wiki');
  assert.equal((await records()).filter(e => e.kind === 'wiki-edit').length, 0);

  const unknown = await plan({ actionId: 'wiki.section.edit',
    args: { target: 'Main/NoSuchSection', content: 'must not create a section' } });
  assert.equal(unknown.status, 404);
  assert.equal(unknown.json.code, 'CONTROL_WIKI_TARGET_UNKNOWN');
  assert.deepEqual(await wiki(), before);

  const approval = { planId: proposed.json.planId, planDigest: proposed.json.planDigest };
  assert.equal((await post('/api/host/control/execute',
    { ...desktop, authorization: 'Bearer wrong-owner' }, approval)).status, 401);
  assert.equal((await post('/api/host/control/execute',
    { ...desktop, origin: 'https://evil.invalid' }, approval)).status, 403);
  assert.equal((await execute({ ...approval, planDigest: '0'.repeat(64) })).status, 409);
  assert.deepEqual(await wiki(), before, 'unauthorized or invalid approval cannot mutate');

  const applied = await execute(approval);
  assert.equal(applied.status, 200, JSON.stringify(applied.json));
  assert.equal(applied.json.status, 'applied');
  assert.equal(applied.json.result.page, 'Main');
  assert.equal(applied.json.result.section, 'About');
  assert.equal(applied.json.result.wikiRevision, before.revision + 1);
  const after = await wiki();
  assert.equal(after.revision, before.revision + 1);
  assert.equal(after.pages.Main.sections.About, text);
  assert.equal((await records()).filter(e => e.kind === 'wiki-edit').length, 1);

  const replay = await execute(approval);
  assert.equal(replay.status, 200);
  assert.equal(replay.json.replayed, true);
  assert.equal((await records()).filter(e => e.kind === 'wiki-edit').length, 1,
    'duplicate execute must not append a second Wiki mutation');

  // Two plans based on one revision: only the first approved execution may commit.
  const stale = await plan({ actionId: 'wiki.section.edit',
    args: { target: 'Main/About', content: 'stale overwrite' } });
  const current = await plan({ actionId: 'wiki.section.edit',
    args: { target: 'Main/About', content: 'Latest approved revision' } });
  assert.equal(stale.json.outcome, 'approval_required');
  assert.equal(current.json.outcome, 'approval_required');
  assert.equal((await execute({
    planId: current.json.planId, planDigest: current.json.planDigest
  })).json.status, 'applied');
  const staleAttempt = await execute({ planId: stale.json.planId, planDigest: stale.json.planDigest });
  assert.equal(staleAttempt.status, 409);
  assert.equal(staleAttempt.json.code, 'CONTROL_WIKI_STALE');
  assert.equal((await records()).filter(e => e.kind === 'wiki-edit').length, 2);
  assert.equal((await wiki()).pages.Main.sections.About, 'Latest approved revision');

  // Restart the actual Host against the same dataRoot, never a recreated in-memory Wiki.
  const committedRevision = (await wiki()).revision;
  await stop();
  await start();
  const restored = await wiki();
  assert.equal(restored.revision, committedRevision);
  assert.equal(restored.pages.Main.sections.About, 'Latest approved revision');
  assert.equal((await records()).filter(e => e.kind === 'wiki-edit').length, 2);
  assert.equal((await request('/api/host/control/plans/' + approval.planId, { headers: bearer })).json.state, 'applied');
});

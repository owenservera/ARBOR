import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHostServer } from '../server.mjs';

test('production Host cannot serve or mutate retired demo routes; roadmap stays a live read-through', async t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'arbor-retired-demo-'));
  const token = 'test-owner-token-'.repeat(4);
  const host = createHostServer({ dataRoot: root, ownerToken: token });
  await new Promise(resolve => host.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + host.address().port;
  t.after(async () => {
    await new Promise(resolve => host.close(resolve));
    rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  });
  const headers = { authorization: 'Bearer ' + token, origin: base,
    'x-vivim-control': '1', 'content-type': 'application/json' };
  for (const route of ['/demo', '/demo/', '/demo/demo-shell.html', '/demo/controller.js',
    '/demo/fixture/index.json', '/demo/feedback/inbox.json', '/demo/journal.jsonl']) {
    assert.equal((await fetch(base + route)).status, 404, route);
    assert.equal((await fetch(base + route, { method: 'HEAD' })).status, 404, route);
  }
  const roadmap = await fetch(base + '/api/roadmap');
  assert.equal(roadmap.status, 200, '/api/roadmap');
  assert.equal((await roadmap.json()).schema, 'arbor.product-roadmap/1');
  for (const route of ['/demo/feedback', '/demo/mutate']) {
    assert.equal((await fetch(base + route, {method: 'POST', headers,
      body: JSON.stringify({kind: 'chat-send', actor: 'owner-browser', schemaVersion: 1, text: 'not saved'})})).status, 404);
  }
  assert.deepEqual(await (await fetch(base + '/api/journal')).json(), []);
  assert.equal((await fetch(base + '/chat')).status, 200);
  assert.equal((await fetch(base + '/wiki')).status, 200);
  assert.equal((await fetch(base + '/mobile/?host-preview=1')).status, 200);
});

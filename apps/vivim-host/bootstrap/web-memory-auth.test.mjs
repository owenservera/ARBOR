import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createHostServer } from '../server.mjs';

test('private Host web memory refuses anonymous/LAN-origin requests and supports owner UI session', async t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vivim-memory-auth-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const ownerToken = 'test-owner-token-abcdefghijklmnopqrstuvwxyz0123456789';
  let calls = 0;
  const host = createHostServer({ dataRoot: root, ownerToken, bootstrap: {
    worldId: 'world-local',
    webMemory: async () => { calls++; return { schema: 'vivim.web-memory-view/1',
      state: 'bridge-unavailable', coverage: 'not_connected', items: [] }; }
  } });
  host.listen(0, '127.0.0.1');
  await once(host, 'listening');
  t.after(async () => { await new Promise(resolve => host.close(resolve)); });
  const base = 'http://127.0.0.1:' + host.address().port;
  const endpoint = base + '/api/host/control/web-memory';
  const auth = { authorization: 'Bearer ' + ownerToken };

  let response = await fetch(endpoint);
  assert.equal(response.status, 401);
  assert.equal(calls, 0);

  response = await fetch(endpoint, { headers: { ...auth, origin: 'https://untrusted.example' } });
  assert.equal(response.status, 403);
  assert.equal(calls, 0);

  response = await fetch(endpoint + '?unknown=1', { headers: auth });
  assert.equal(response.status, 400);
  assert.equal(calls, 0);

  response = await fetch(endpoint + '?limit=20', { headers: auth });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).schema, 'vivim.web-memory-view/1');
  assert.equal(calls, 1);

  // Browser capability remains HttpOnly and scoped to the existing /api/host/control path.
  response = await fetch(base + '/api/host/control/ui-session', {
    method: 'POST', headers: { ...auth, origin: base, 'x-vivim-control': '1' }
  });
  assert.equal(response.status, 201);
  const launch = await response.json();
  response = await fetch(base + '/api/host/control/ui-exchange', {
    method: 'POST',
    headers: { origin: base, 'content-type': 'application/json', 'x-vivim-control': '1' },
    body: JSON.stringify({ code: launch.code })
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie?.startsWith('vivim_control_ui='));
  response = await fetch(endpoint, { headers: { cookie } });
  assert.equal(response.status, 200);
  assert.equal(calls, 2);
});

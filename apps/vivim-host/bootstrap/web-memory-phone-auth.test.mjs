import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createDirectPhoneHandler } from '../direct-phone.mjs';

test('Direct phone web memory never exposes owner history without a device grant', async t => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-phone-memory-'));
  t.after(() => rmSync(dataRoot, { recursive: true, force: true }));
  const origin = 'https://pc.example.ts.net';
  const user = 'owner@example.com';
  let sourceReads = 0;
  const handler = createDirectPhoneHandler({
    origin, user, dataRoot, projection: () => ({}),
    webMemory: async () => { sourceReads++; return { items: [{ url: 'https://example.org/' }] }; }
  });
  const server = http.createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { await new Promise(resolve => server.close(resolve)); });
  const url = 'http://127.0.0.1:' + server.address().port + '/mobile/api/memory/recent';
  const trustedProxy = { host: 'pc.example.ts.net', 'x-forwarded-proto': 'https',
    'tailscale-user-login': user };

  // Arbitrary LAN caller is rejected before any history read.
  let result = await fetch(url);
  assert.equal(result.status, 403);
  assert.equal(sourceReads, 0);

  // Even a trusted Tailscale identity has no device-read privilege by itself.
  result = await fetch(url, { headers: trustedProxy });
  assert.equal(result.status, 401);
  assert.equal(sourceReads, 0);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import path from 'node:path';
import { createHostServer, hostSnapshot, bridgeSnapshot, studioDataDir } from '../server.mjs';

test('Studio data path matches Windows and XDG defaults', () => {
  assert.equal(studioDataDir({ LOCALAPPDATA: 'C:\\Users\\Test\\AppData\\Local' }, 'win32', '/ignored').includes('AION'), true);
  assert.equal(studioDataDir({ XDG_DATA_HOME: '/tmp/xdg' }, 'linux', '/home/example'), '/tmp/xdg/aion-capture-studio');
});
test('read-only host status never claims unverified workers are online', () => {
  const s = hostSnapshot({ dataRoot: path.join(os.tmpdir(), 'missing-vivim-data') });
  assert.equal(s.host.state, 'online');
  for (const item of Object.values(s.services)) assert.equal(item.state, 'unknown');
  assert.equal(s.capabilities.localTalkSend, false);
  assert.equal(s.recovery.schema, 'vivim.host-recovery-read-model/1');
  assert.equal(s.recovery.automaticMutations, 0);
  assert.equal(s.recovery.automaticProviderResends, 0);
});
test('bridge snapshot strips private prompt/result and respects latest revision', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'vivim-host-'));
  try {
    mkdirSync(path.join(dir, 'bridge'));
    const id = 'cmd-0123456789abcdef';
    writeFileSync(path.join(dir, 'bridge', 'commands.jsonl'), [
      JSON.stringify({ id, status: 'queued', consumer: 'harness', text: 'secret prompt', rev: 1, updatedAt: '2026-10-30T10:00:00Z' }),
      JSON.stringify({ id, status: 'done', consumer: 'harness', result: 'private answer', rev: 2, updatedAt: '2026-10-30T10:01:00Z' }),
      '{not valid', ''
    ].join('\n'));
    const b = bridgeSnapshot(dir);
    assert.equal(b.totals.done, 1); assert.equal(b.totals.queued, 0);
    assert.equal(b.recent[0].id, id);
    assert.doesNotMatch(JSON.stringify(b), /secret prompt|private answer/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('loopback HTTP UI, no remote host-header access, no sending', async () => {
  const server = createHostServer({ dataRoot: path.join(os.tmpdir(), 'no-vivim-bridge') });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const r = await fetch(base + '/api/host/status'); assert.equal(r.status, 200);
    assert.equal((await r.json()).services.relay.state, 'unknown');
    assert.match(r.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    const ui = await fetch(base); assert.equal(ui.status, 200); assert.match(await ui.text(), /<title>VIVIM/); // Host Control, or the guided setup before a workspace exists
    const forbidden = await new Promise((resolve, reject) => {
      const req = http.request(base + '/api/host/status', { headers: { host: 'evil.example' } }, res => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
      req.on('error', reject); req.end();
    }); assert.equal(forbidden, 403);
    const post = await fetch(base + '/api/host/status', { method: 'POST' }); assert.equal(post.status, 405);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

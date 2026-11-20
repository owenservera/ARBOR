# File: apps/vivim-host/test/host.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/host.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3353 B |
| Lines | 53 |
| Hash | bf7008c8512f |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| s | const | 14 | no | const s = hostSnapshot({ dataRoot: path.join(os.tmpdir(), &#39;missing-vivim-data&#39;) }); |
| dir | const | 23 | no | const dir = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-host-&#39;)); |
| id | const | 26 | no | const id = &#39;cmd-0123456789abcdef&#39;; |
| b | const | 32 | no | const b = bridgeSnapshot(dir); |
| server | const | 39 | no | const server = createHostServer({ dataRoot: path.join(os.tmpdir(), &#39;no-vivim-bridge&#39;) }); |
| base | const | 41 | no | const base = `http://127.0.0.1:${server.address().port}`; |
| r | const | 43 | no | const r = await fetch(base + &#39;/api/host/status&#39;); assert.equal(r.status, 200); |
| ui | const | 46 | no | const ui = await fetch(base); assert.equal(ui.status, 200); assert.match(await ui.text(), /&lt;title&gt;VIVIM/); // Host Control, or the guided setup before a workspace exists |
| forbidden | const | 47 | no | const forbidden = await new Promise((resolve, reject) =&gt; { const req = http.request(base + &#39;/api/host/status&#39;, { headers: { host: &#39;evil.example&#39; } }, res =&gt; { res.resume(); res.on(&#39;end&#39;, () =&gt; resolv… |
| req | const | 48 | no | const req = http.request(base + &#39;/api/host/status&#39;, { headers: { host: &#39;evil.example&#39; } }, res =&gt; { res.resume(); res.on(&#39;end&#39;, () =&gt; resolve(res.statusCode)); }); |
| post | const | 51 | no | const post = await fetch(base + &#39;/api/host/status&#39;, { method: &#39;POST&#39; }); assert.equal(post.status, 405); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:http | import | 5 | external |
| node:path | import | 6 | external |
| ../server.mjs | import | 7 | [apps/vivim-host/server.mjs](../server.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

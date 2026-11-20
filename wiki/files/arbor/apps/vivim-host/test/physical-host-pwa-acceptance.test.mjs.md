# File: apps/vivim-host/test/physical-host-pwa-acceptance.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/physical-host-pwa-acceptance.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13412 B |
| Lines | 247 |
| Hash | b93b89f22212 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| hostRoot | const | 17 | no | const hostRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;..&#39;); |
| pkg | const | 21 | no | const pkg = JSON.parse(readFileSync(path.join(hostRoot, &#39;package.json&#39;), &#39;utf8&#39;)); |
| dataRoot | const | 28 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-a08-host-&#39;)); |
| port | const | 29 | no | const port = 43987; // deterministic, ephemeral-range, never the shared 43187 data root |
| child | const | 30 | no | const child = spawn(process.execPath, [&#39;server.mjs&#39;], { cwd: hostRoot, env: { ...process.env, VIVIM_HOST_PORT: String(port), VIVIM_HOST_DATA_DIR: dataRoot }, stdio: [&#39;ignore&#39;, &#39;ignore&#39;, &#39;ignore&#39;], de… |
| base | const | 36 | no | const base = `http://127.0.0.1:${port}`; |
| stop | function | 37 | no | const stop = async () =&gt; { |
| up | variable | 46 | no | let up = false; |
| home | const | 56 | no | const home = await fetch(base + &#39;/&#39;); |
| status | const | 61 | no | const status = await fetch(base + &#39;/api/host/status&#39;); |
| statusPost | const | 64 | no | const statusPost = await fetch(base + &#39;/api/host/status&#39;, { method: &#39;POST&#39;, body: &#39;{}&#39; }); |
| before | const | 68 | no | const before = await (await fetch(base + &#39;/api/state&#39;)).json(); |
| post | const | 69 | no | const post = await fetch(base + &#39;/api/mutate&#39;, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39; }, body: JSON.stringify({ kind: &#39;chat-send&#39;, actor: &#39;human&#39;, schemaVersion: 1, text: &#39;A0… |
| after | const | 74 | no | const after = await (await fetch(base + &#39;/api/state&#39;)).json(); |
| httpsDirect | function | 83 | no | function httpsDirect(port, headers, reqPath = &#39;/mobile/&#39;) { |
| req | const | 85 | no | const req = http.request({ host: &#39;127.0.0.1&#39;, port, path: reqPath, method: &#39;GET&#39;, headers }, res =&gt; { let body = &#39;&#39;; res.setEncoding(&#39;utf8&#39;); res.on(&#39;data&#39;, c =&gt; { body += c; }); res.on(&#39;end&#39;, () =&gt; … |
| body | variable | 86 | no | let body = &#39;&#39;; |
| origin | const | 97 | no | const origin = &#39;https://vivim.test.ts.net&#39;; |
| user | const | 98 | no | const user = &#39;owner@example.com&#39;; |
| carrier | const | 99 | no | const carrier = { host: &#39;vivim.test.ts.net&#39;, &#39;x-forwarded-proto&#39;: &#39;https&#39;, &#39;tailscale-user-login&#39;: user }; |
| server | const | 100 | no | const server = createHostServer({ dataRoot: mkdtempSync(path.join(os.tmpdir(), &#39;vivim-a08-paired-&#39;)), directPhone: { origin, user } }); |
| port | const | 103 | no | const port = server.address().port; |
| paired | const | 105 | no | const paired = await httpsDirect(port, carrier); |
| manifest | const | 116 | no | const manifest = await httpsDirect(port, carrier, &#39;/mobile/manifest.webmanifest&#39;); |
| manifestJson | const | 118 | no | const manifestJson = JSON.parse(manifest.text); |
| relay | const | 123 | no | const relay = await httpsDirect(port, carrier, &#39;/mobile/api/relay?path=commands&#39;); |
| wrongUser | const | 126 | no | const wrongUser = await httpsDirect(port, { ...carrier, &#39;tailscale-user-login&#39;: &#39;not-owner@example.com&#39; }); |
| plainHttp | const | 129 | no | const plainHttp = await httpsDirect(port, { ...carrier, &#39;x-forwarded-proto&#39;: &#39;http&#39; }); |
| root | const | 137 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-a08-unpaired-&#39;)); |
| server | const | 138 | no | const server = createHostServer({ dataRoot: root }); |
| unpaired | const | 141 | no | const unpaired = await httpsDirect(server.address().port, { host: &#39;vivim.test.ts.net&#39;, &#39;x-forwarded-proto&#39;: &#39;https&#39;, &#39;tailscale-user-login&#39;: &#39;owner@example.com&#39; }); |
| preview | const | 143 | no | const preview = await fetch(`http://127.0.0.1:${server.address().port}/mobile/?host-preview=1`); |
| dataRoot | const | 156 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-a08-restart-&#39;)); |
| port | const | 157 | no | const port = 43989; // deterministic, ephemeral-range, never the shared 43187 data root |
| boot | function | 158 | no | const boot = () =&gt; spawn(process.execPath, [&#39;server.mjs&#39;], { cwd: hostRoot, env: { ...process.env, VIVIM_HOST_PORT: String(port), VIVIM_HOST_DATA_DIR: dataRoot }, stdio: [&#39;ignore&#39;, &#39;ignore&#39;, &#39;ignore&#39;… |
| kill | function | 164 | no | const kill = (child) =&gt; { |
| waitUp | function | 168 | no | const waitUp = async (child) =&gt; { |
| first | variable | 176 | no | let first = null; |
| post | const | 180 | no | const post = await fetch(`http://127.0.0.1:${port}/api/mutate`, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39; }, body: JSON.stringify({ kind: &#39;chat-send&#39;, actor: &#39;human&#39;, schemaVers… |
| before | const | 185 | no | const before = await (await fetch(`http://127.0.0.1:${port}/api/state`)).json(); |
| second | const | 190 | no | const second = boot(); |
| after | const | 193 | no | const after = await (await fetch(`http://127.0.0.1:${port}/api/state`)).json(); |
| root | const | 212 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-a08-revoke-&#39;)); |
| server | const | 213 | no | const server = createHostServer({ dataRoot: root }); |
| base | const | 216 | no | const base = `http://127.0.0.1:${server.address().port}`; |
| revokePath | const | 217 | no | const revokePath = &#39;/api/host/devices/test-grant/revoke&#39;; |
| noHeader | const | 227 | no | const noHeader = await fetch(base + revokePath, { method: &#39;POST&#39;, body: &#39;{}&#39; }); |
| getStatus | const | 231 | no | const getStatus = await fetch(base + revokePath); |
| hdrOnly | const | 234 | no | const hdrOnly = await fetch(base + revokePath, { method: &#39;POST&#39;, headers: { &#39;x-vivim-bootstrap&#39;: &#39;1&#39; }, body: &#39;{}&#39; }); |
| badAuth | const | 238 | no | const badAuth = await fetch(base + revokePath, { method: &#39;POST&#39;, headers: { &#39;x-vivim-bootstrap&#39;: &#39;1&#39;, authorization: &#39;Bearer not-the-owner-token&#39; }, body: &#39;{}&#39; }); |
| approveNoHeader | const | 241 | no | const approveNoHeader = await fetch(base + &#39;/api/host/devices/test-grant/approve&#39;, { method: &#39;POST&#39;, body: &#39;{}&#39; }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 7 | external |
| node:assert/strict | import | 8 | external |
| node:child_process | import | 9 | external |
| node:fs | import | 10 | external |
| node:http | import | 11 | external |
| node:os | import | 12 | external |
| node:path | import | 13 | external |
| node:url | import | 14 | external |
| ../server.mjs | import | 15 | [apps/vivim-host/server.mjs](../server.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// A08 acceptance — Physical Windows Host and paired PWA.
// Proves the proven loop (isolated Host boot -> /api/mutate -> /api/state verify) on the
// physical Windows Host entry (apps/vivim-host/server.mjs, launched exactly as Windows does:
// `node server.mjs`), and the paired PWA acceptance surface over the real HTTPS Direct
// carrier (Host <tailscale-name> + x-forwarded-proto: https + tailscale-user-login).
// No shared 43187 data root is read or written; every boot uses its own temp data dir.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHostServer } from '../server.mjs';

const hostRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The exact Windows launch contract: package.json start runs the physical Host binary.
test('the Windows Host launch contract is node server.mjs in this app', () => {
  const pkg = JSON.parse(readFileSync(path.join(hostRoot, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.start, 'node server.mjs');
  assert.equal(pkg.scripts.test, 'node --test test/*.test.mjs');
});

// The proven loop, driven against the physical Host binary on Windows (this host is win32).
test('physical Windows Host boots isolated and the mutate/state loop verifies', async () => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-a08-host-'));
  const port = 43987; // deterministic, ephemeral-range, never the shared 43187 data root
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: hostRoot,
    env: { ...process.env, VIVIM_HOST_PORT: String(port), VIVIM_HOST_DATA_DIR: dataRoot },
    stdio: ['ignore', 'ignore', 'ignore'],
    detached: true,
  });
  const base = `http://127.0.0.1:${port}`;
  const stop = async () => {
    try { spawn.sync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* already gone */ }
    try { child.kill(); } catch { /* already gone */ }
    for (let i = 0; i < 5; i++) {
      try { rmSync(dataRoot, { recursive: true, force: true }); return; }
      catch { await new Promise(r => setTimeout(r, 400)); }
    }
  };
  try {
    let up = false;
    for (let i = 0; i < 60 && !up; i++) {
      if (child.exitCode !== null) break;
      try { up = (await fetch(base + '/api/state')).ok; } catch { /* booting */ }
      if (!up) await new Promise(r => setTimeout(r, 500));
    }
    assert.equal(child.exitCode, null, 'Host child must stay running');
    assert.ok(up, 'physical Windows Host must answer /api/state on ' + base);

    // Desktop entry opens the real phone PWA first (R001 mobile-first cutover).
    const home = await fetch(base + '/');
    assert.equal(home.status, 200);
    assert.match(await home.text(), /id="phone-surface"/);

    // Read-only diagnostics: GET/HEAD-only, never a mutation surface.
    const status = await fetch(base + '/api/host/status');
    assert.equal(status.status, 200);
    assert.equal(typeof (await status.json()), 'object'); // metadata only, no host internals leak
    const statusPost = await fetch(base + '/api/host/status', { method: 'POST', body: '{}' });
    assert.equal([405, 404].includes(statusPost.status), true, 'status must not accept POST');

    // The proven loop: mutate, then verify the projection advanced.
    const before = await (await fetch(base + '/api/state')).json();
    const post = await fetch(base + '/api/mutate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'chat-send', actor: 'human', schemaVersion: 1, text: 'A08 physical Windows Host acceptance' }),
    });
    assert.equal(post.status, 200);
    const after = await (await fetch(base + '/api/state')).json();
    assert.ok(after.revision > before.revision, 'revision must advance after chat-send');
    assert.ok(Array.isArray(after.chat) && after.chat.length > (before.chat?.length ?? 0), 'chat projection must grow');
  } finally {
    await stop();
  }
});
```

_First 80 of 247 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

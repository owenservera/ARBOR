# File: apps/vivim-host/test/demo-shell-assets.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/demo-shell-assets.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1870 B |
| Lines | 33 |
| Hash | 3313bc35857a |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 9 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;arbor-retired-demo-&#39;)); |
| token | const | 10 | no | const token = &#39;test-owner-token-&#39;.repeat(4); |
| host | const | 11 | no | const host = createHostServer({ dataRoot: root, ownerToken: token }); |
| base | const | 13 | no | const base = &#39;http://127.0.0.1:&#39; + host.address().port; |
| headers | const | 18 | no | const headers = { authorization: &#39;Bearer &#39; + token, origin: base, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../server.mjs | import | 6 | [apps/vivim-host/server.mjs](../server.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHostServer } from '../server.mjs';

test('production Host cannot serve or mutate retired demo and historical roadmap routes', async t => {
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
    '/demo/fixture/index.json', '/demo/feedback/inbox.json', '/demo/journal.jsonl', '/api/roadmap']) {
    assert.equal((await fetch(base + route)).status, 404, route);
    assert.equal((await fetch(base + route, { method: 'HEAD' })).status, 404, route);
  }
  for (const route of ['/demo/feedback', '/demo/mutate']) {
    assert.equal((await fetch(base + route, {method: 'POST', headers,
      body: JSON.stringify({kind: 'chat-send', actor: 'owner-browser', schemaVersion: 1, text: 'not saved'})})).status, 404);
  }
  assert.deepEqual(await (await fetch(base + '/api/journal')).json(), []);
  assert.equal((await fetch(base + '/chat')).status, 200);
  assert.equal((await fetch(base + '/wiki')).status, 200);
  assert.equal((await fetch(base + '/mobile/?host-preview=1')).status, 200);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

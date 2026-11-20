# File: apps/vivim-host/test/host-preview.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/host-preview.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4120 B |
| Lines | 92 |
| Hash | ab3b13c81755 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| mobileRoot | const | 10 | no | const mobileRoot = fileURLToPath(new URL(&#39;../../mobile-relay/&#39;, import.meta.url)); |
| collectImports | function | 12 | no | function collectImports(source) { |
| specs | const | 13 | no | const specs = []; |
| re | const | 14 | no | const re = /\\b(?:import\|export)\\s+(?:[^&#39;&quot;;]*?\\s+from\\s+)?[&#39;&quot;]([^&#39;&quot;]+)[&#39;&quot;]\|import\\(\\s*[&#39;&quot;]([^&#39;&quot;]+)[&#39;&quot;]\\s*\\)/g; |
| m | variable | 15 | no | let m; |
| walkGraph | function | 20 | no | function walkGraph(entryRoute, seen = new Set(), seenFiles = new Set()) { |
| asset | const | 23 | no | const asset = PHONE_ASSETS.get(entryRoute); |
| file | const | 25 | no | const file = path.resolve(mobileRoot, asset[0]); |
| src | const | 28 | no | const src = readFileSync(file, &#39;utf8&#39;); |
| resolved | const | 31 | no | const resolved = path.resolve(path.dirname(file), spec); |
| rel | const | 32 | no | const rel = path.relative(mobileRoot, resolved).replace(/\\\\/g, &#39;/&#39;); |
| root | const | 41 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-preview-&#39;)); |
| server | const | 42 | no | const server = createHostServer({ dataRoot: root }); |
| base | const | 45 | no | const base = &#39;http://127.0.0.1:&#39; + server.address().port; |
| shell | const | 47 | no | const shell = await fetch(base + &#39;/mobile/?host-preview=1&#39;); |
| r | const | 53 | no | const r = await fetch(base + &#39;/mobile/&#39; + route); |
| root | const | 69 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-preview-direct-&#39;)); |
| server | const | 70 | no | const server = createHostServer({ dataRoot: root, directPhone: { origin: &#39;https://phone.example.ts.net&#39;, user: &#39;owner@example.com&#39; } }); |
| base | const | 76 | no | const base = &#39;http://127.0.0.1:&#39; + server.address().port; |
| seen | const | 87 | no | const seen = new Set(); |
| missing | const | 89 | no | const missing = [...seen].filter(route =&gt; !PHONE_ASSETS.has(route)).sort(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:url | import | 6 | external |
| ../server.mjs | import | 7 | [apps/vivim-host/server.mjs](../server.mjs.md) |
| ../direct-phone.mjs | import | 8 | [apps/vivim-host/direct-phone.mjs](../direct-phone.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHostServer } from '../server.mjs';
import { PHONE_ASSETS } from '../direct-phone.mjs';

const mobileRoot = fileURLToPath(new URL('../../mobile-relay/', import.meta.url));

function collectImports(source) {
  const specs = [];
  const re = /\b(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = re.exec(source))) specs.push(m[1] || m[2]);
  return specs;
}

function walkGraph(entryRoute, seen = new Set(), seenFiles = new Set()) {
  if (seen.has(entryRoute)) return;
  seen.add(entryRoute);
  const asset = PHONE_ASSETS.get(entryRoute);
  if (!asset) return; // caller asserts; avoid double-fail noise
  const file = path.resolve(mobileRoot, asset[0]);
  if (seenFiles.has(file)) return;
  seenFiles.add(file);
  const src = readFileSync(file, 'utf8');
  for (const spec of collectImports(src)) {
    if (!spec.startsWith('.')) continue;
    const resolved = path.resolve(path.dirname(file), spec);
    const rel = path.relative(mobileRoot, resolved).replace(/\\/g, '/');
    if (rel.startsWith('..')) continue;
    // Only modules in the served mobile tree
    if (!/\.(?:m?js|json)$/i.test(rel) && !PHONE_ASSETS.has(rel)) continue;
    walkGraph(rel, seen, seenFiles);
  }
}

test('plain loopback preview serves allowlisted mobile assets read-only', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vivim-preview-'));
  const server = createHostServer({ dataRoot: root });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;

    const shell = await fetch(base + '/mobile/?host-preview=1');
    assert.equal(shell.status, 200);
    assert.equal(shell.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.match(shell.headers.get('content-security-policy') || '', /frame-ancestors 'self'/);

    for (const route of ['app.js', 'generative-ui/host-revision-guard.mjs']) {
      const r = await fetch(base + '/mobile/' + route);
      assert.equal(r.status, 200, route);
      assert.equal(r.headers.get('x-frame-options'), 'SAMEORIGIN');
      assert.match(r.headers.get('content-type') || '', /javascript/);
    }

    assert.equal((await fetch(base + '/mobile/')).status, 404);
    assert.equal((await fetch(base + '/mobile/?host-preview=1', { method: 'POST' })).status, 405);
    assert.equal((await fetch(base + '/mobile/api/relay')).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
    rmSync(root, { recursive: true, force: true });
  }
});

test('preview does not hijack direct phone traffic; plain loopback still preview', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vivim-preview-direct-'));
  const server = createHostServer({
    dataRoot: root,
    directPhone: { origin: 'https://phone.example.ts.net', user: 'owner@example.com' }
  });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    // Loopback request without proxy headers to preview path -> preview owns it
    assert.equal((await fetch(base + '/mobile/?host-preview=1')).status, 200);
    assert.equal((await fetch(base + '/mobile/api/relay')).status, 404);
  } finally {
```

_First 80 of 93 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

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
    await new Promise(resolve => server.close(resolve));
    rmSync(root, { recursive: true, force: true });
  }
});

test('mobile-relay static import graph is fully allowlisted', () => {
  const seen = new Set();
  walkGraph('app.js', seen);
  const missing = [...seen].filter(route => !PHONE_ASSETS.has(route)).sort();
  assert.deepEqual(missing, [], 'missing from phone asset allowlist: ' + missing.join(', '));
  assert.ok(PHONE_ASSETS.has('generative-ui/host-revision-guard.mjs'));
});

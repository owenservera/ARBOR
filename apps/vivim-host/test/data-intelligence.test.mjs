import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readIngressRegistry, projectDataInventory } from '../data-intelligence/catalog.mjs';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createHostServer } from '../server.mjs';

const TOKEN = 'test-owner-token-0123456789abcdef0123456789abcdef';
const here = path.dirname(fileURLToPath(import.meta.url));
const schema = name => JSON.parse(readFileSync(path.join(here, '../../../docs/data-intelligence/schemas', name), 'utf8'));

test('versioned ingress registry is complete, unique and defaults to zero new collection', () => {
  const data = readIngressRegistry();
  assert.equal(data.schema, 'vivim.ingress-registry/1');
  assert.equal(data.items.length, 13);
  assert.equal(new Set(data.items.map(x => x.id)).size, 13);
  assert.ok(data.items.every(x => x.captureEnabled === false));
  assert.ok(data.items.every(x => x.utilityStatus === 'untested' && x.rightsStatus === 'review_required'));
  assert.equal(data.items.find(x => x.id === 'TEL02').defaultCollection, 'off_opt_in');
  assert.equal(data.items.find(x => x.id === 'SEN01').defaultCollection, 'restricted_never_auto');
  assert.throws(() => readIngressRegistry({ read: () => JSON.stringify({ schema: 'vivim.ingress-registry/1', items: [data.items[0], data.items[0]] }) }), /INVALID/);
});

test('asset and relative utility JSON Schemas distinguish observed from requested and prohibit invented uplift', () => {
  const asset = schema('data-asset.v1.schema.json');
  const utility = schema('utility-assessment.v1.schema.json');
  assert.equal(asset.properties.schema.const, 'vivim.data-asset/1');
  assert.deepEqual(asset.properties.model.properties.observedState.enum, ['verified', 'unverified', 'unavailable']);
  assert.equal(asset.properties.content.properties.authorityRef.type.includes('null'), true);
  assert.equal(asset.additionalProperties, false);
  assert.equal(utility.properties.schema.const, 'vivim.data-utility-assessment/1');
  assert.equal(utility.additionalProperties, false);
  const measured = utility.allOf.find(x => x.if?.properties?.status?.const === 'measured');
  assert.equal(measured.then.properties.method.const, 'paired-ablation');
  assert.equal(measured.then.properties.evaluation.type, 'object');
});

test('bounded inventory projects existing record counts, not data asset values or private content', () => {
  const fake = { stats: () => ({
    observations: 3, claims: 5, relationships: 2, contradictions: 1,
    themes: 1, preferences: 7, passes: 2, jobs: 1,
    prompt: 'private text that must never appear',
    digest: 'source-hash-should-not-escape'
  }) };
  const out = projectDataInventory({ ledger: fake, worldId: 'world-test',
    now: () => '2026-10-31T20:00:00.000Z' });
  assert.equal(out.schema, 'vivim.data-inventory/1');
  assert.equal(out.counts.bootstrapClaims, 5);
  assert.equal(out.ingress.find(x => x.id === 'CT01').indexState, 'existing_aggregate_only');
  assert.equal(out.ingress.find(x => x.id === 'AI02').indexState, 'not_indexed');
  assert.equal(out.utility.status, 'not_measured');
  assert.equal(out.utility.multiplier, null);
  assert.equal(out.privateContentIncluded, false);
  assert.doesNotMatch(JSON.stringify(out), /private text|source-hash-should-not-escape/);
  assert.throws(() => projectDataInventory({ ledger: { stats: () => ({ observations: -1 }) } }), /COUNT_INVALID/);
});

test('private Host inventory route refuses unauthenticated, cross-origin and mutation requests', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'vivim-data-intelligence-'));
  const runtime = createBootstrapRuntime({ dataRoot: dir, file: ':memory:' });
  const server = createHostServer({ dataRoot: dir, bootstrap: runtime, ownerToken: TOKEN });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const noAuth = await fetch(base + '/api/host/data-intelligence/summary');
    assert.equal(noAuth.status, 401);
    const wrong = await fetch(base + '/api/host/data-intelligence/summary', { headers: { authorization: 'Bearer not-the-token' } });
    assert.equal(wrong.status, 401);
    const cross = await fetch(base + '/api/host/data-intelligence/summary', { headers: { authorization: 'Bearer ' + TOKEN, origin: 'https://other.example' } });
    assert.equal(cross.status, 403);
    const post = await fetch(base + '/api/host/data-intelligence/summary', { method: 'POST', headers: { authorization: 'Bearer ' + TOKEN } });
    assert.equal(post.status, 405);
    const missing = await fetch(base + '/api/host/data-intelligence/not-found', { headers: { authorization: 'Bearer ' + TOKEN } });
    assert.equal(missing.status, 404);
    const registry = await fetch(base + '/api/host/data-intelligence/registry', { headers: { authorization: 'Bearer ' + TOKEN } });
    assert.equal(registry.status, 200);
    assert.equal((await registry.json()).items.length, 13);
    const summary = await fetch(base + '/api/host/data-intelligence/summary', { headers: { authorization: 'Bearer ' + TOKEN } });
    assert.equal(summary.status, 200);
    const payload = await summary.json();
    assert.equal(payload.state, 'ready');
    assert.equal(payload.counts.bootstrapClaims, 0);
    assert.equal(payload.dataAssetIndexState, 'not_implemented');
    assert.equal(summary.headers.get('cache-control'), 'no-store');
    const head = await fetch(base + '/api/host/data-intelligence/summary', { method: 'HEAD', headers: { authorization: 'Bearer ' + TOKEN } });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
  } finally {
    await new Promise(resolve => server.close(resolve));
    runtime.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

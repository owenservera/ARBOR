# File: apps/vivim-host/test/data-intelligence.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/data-intelligence.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6059 B |
| Lines | 96 |
| Hash | e6028f6a4d2e |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TOKEN | const | 11 | no | const TOKEN = &#39;test-owner-token-0123456789abcdef0123456789abcdef&#39;; |
| here | const | 12 | no | const here = path.dirname(fileURLToPath(import.meta.url)); |
| schema | function | 13 | no | const schema = name =&gt; JSON.parse(readFileSync(path.join(here, &#39;../../../docs/data-intelligence/schemas&#39;, name), &#39;utf8&#39;)); |
| data | const | 16 | no | const data = readIngressRegistry(); |
| asset | const | 28 | no | const asset = schema(&#39;data-asset.v1.schema.json&#39;); |
| utility | const | 29 | no | const utility = schema(&#39;utility-assessment.v1.schema.json&#39;); |
| measured | const | 36 | no | const measured = utility.allOf.find(x =&gt; x.if?.properties?.status?.const === &#39;measured&#39;); |
| fake | const | 42 | no | const fake = { stats: () =&gt; ({ observations: 3, claims: 5, relationships: 2, contradictions: 1, themes: 1, preferences: 7, passes: 2, jobs: 1, prompt: &#39;private text that must never appear&#39;, digest: &#39;… |
| out | const | 48 | no | const out = projectDataInventory({ ledger: fake, worldId: &#39;world-test&#39;, now: () =&gt; &#39;2026-10-31T20:00:00.000Z&#39; }); |
| dir | const | 62 | no | const dir = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-data-intelligence-&#39;)); |
| runtime | const | 63 | no | const runtime = createBootstrapRuntime({ dataRoot: dir, file: &#39;:memory:&#39; }); |
| server | const | 64 | no | const server = createHostServer({ dataRoot: dir, bootstrap: runtime, ownerToken: TOKEN }); |
| base | const | 66 | no | const base = `http://127.0.0.1:${server.address().port}`; |
| noAuth | const | 68 | no | const noAuth = await fetch(base + &#39;/api/host/data-intelligence/summary&#39;); |
| wrong | const | 70 | no | const wrong = await fetch(base + &#39;/api/host/data-intelligence/summary&#39;, { headers: { authorization: &#39;Bearer not-the-token&#39; } }); |
| cross | const | 72 | no | const cross = await fetch(base + &#39;/api/host/data-intelligence/summary&#39;, { headers: { authorization: &#39;Bearer &#39; + TOKEN, origin: &#39;https://other.example&#39; } }); |
| post | const | 74 | no | const post = await fetch(base + &#39;/api/host/data-intelligence/summary&#39;, { method: &#39;POST&#39;, headers: { authorization: &#39;Bearer &#39; + TOKEN } }); |
| missing | const | 76 | no | const missing = await fetch(base + &#39;/api/host/data-intelligence/not-found&#39;, { headers: { authorization: &#39;Bearer &#39; + TOKEN } }); |
| registry | const | 78 | no | const registry = await fetch(base + &#39;/api/host/data-intelligence/registry&#39;, { headers: { authorization: &#39;Bearer &#39; + TOKEN } }); |
| summary | const | 81 | no | const summary = await fetch(base + &#39;/api/host/data-intelligence/summary&#39;, { headers: { authorization: &#39;Bearer &#39; + TOKEN } }); |
| payload | const | 83 | no | const payload = await summary.json(); |
| head | const | 88 | no | const head = await fetch(base + &#39;/api/host/data-intelligence/summary&#39;, { method: &#39;HEAD&#39;, headers: { authorization: &#39;Bearer &#39; + TOKEN } }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:url | import | 6 | external |
| ../data-intelligence/catalog.mjs | import | 7 | [apps/vivim-host/data-intelligence/catalog.mjs](../data-intelligence/catalog.mjs.md) |
| ../bootstrap/runtime.mjs | import | 8 | [apps/vivim-host/bootstrap/runtime.mjs](../bootstrap/runtime.mjs.md) |
| ../server.mjs | import | 9 | [apps/vivim-host/server.mjs](../server.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 97 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

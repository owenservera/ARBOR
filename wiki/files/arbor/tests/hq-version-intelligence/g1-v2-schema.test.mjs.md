# File: tests/hq-version-intelligence/g1-v2-schema.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | tests/hq-version-intelligence/g1-v2-schema.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3390 B |
| Lines | 56 |
| Hash | f73d5ef727dc |
| Test | yes |
| Generated | no |
| Component | tests |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| names | const | 12 | no | const names = [&#39;pin&#39;,&#39;source-manifest&#39;,&#39;comparison&#39;,&#39;migration-finding&#39;,&#39;adapter-receipt&#39;]; |
| ajv | const | 13 | no | const ajv = new Ajv2020({ allErrors: true, strict: true }); |
| schemas | const | 14 | no | const schemas = Object.fromEntries(names.map(name =&gt; { const path = new URL(&#39;../../contracts/hq-version-intelligence/schemas/v2/&#39; + name + &#39;.schema.json&#39;, import.meta.url); return [name, JSON.parse(r… |
| path | const | 15 | no | const path = new URL(&#39;../../contracts/hq-version-intelligence/schemas/v2/&#39; + name + &#39;.schema.json&#39;, import.meta.url); |
| validators | const | 18 | no | const validators = Object.fromEntries(names.map(name =&gt; [name, ajv.compile(schemas[name])])); |
| valid | function | 19 | no | function valid(name, value) { |
| ok | const | 20 | no | const ok = validators[name](value); |
| source | function | 23 | no | async function source(repo, ref, f) { |
| pin | const | 24 | no | const pin = await resolvePin({ provider:&#39;github&#39;, repo, ref, approvedScope:&#39;development&#39; }, { adapter:f.adapter, authorize:async()=&gt;true, acquiredAt:&#39;2026-01-01T00:00:00.000Z&#39; }); |
| f | const | 33 | no | const f = syntheticSource(); |
| a | const | 34 | no | const a = await source(&#39;synthetic/versioned&#39;,&#39;v1&#39;,f); |
| b | const | 35 | no | const b = await source(&#39;synthetic/versioned&#39;,&#39;v2&#39;,f); |
| p | const | 38 | no | const p = bridgeSourceManifest(a), q = bridgeSourceManifest(b); |
| comparison | const | 41 | no | const comparison = comparePinned({ pins:[p.pin,q.pin], manifests:[p.manifest,q.manifest], targetPinId:q.pin.pinId }); |
| f | const | 48 | no | const f=syntheticSource(); |
| a | const | 49 | no | const a=bridgeSourceManifest(await source(&#39;synthetic/versioned&#39;,&#39;v1&#39;,f)); |
| b | const | 50 | no | const b=bridgeSourceManifest(await source(&#39;synthetic/versioned&#39;,&#39;v2&#39;,f)); |
| c | const | 51 | no | const c=comparePinned({pins:[a.pin,b.pin],manifests:[a.manifest,b.manifest],targetPinId:b.pin.pinId}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 3 | external |
| node:assert/strict | import | 4 | external |
| node:fs | import | 5 | external |
| ajv/dist/2020.js | import | 6 | external |
| ../../hq/version-intelligence/sources/fixtures.mjs | import | 7 | [hq/version-intelligence/sources/fixtures.mjs](../../hq/version-intelligence/sources/fixtures.mjs.md) |
| ../../hq/version-intelligence/sources/snapshots.mjs | import | 8 | [hq/version-intelligence/sources/snapshots.mjs](../../hq/version-intelligence/sources/snapshots.mjs.md) |
| ../../hq/version-intelligence/integration/source-manifest-adapter.mjs | import | 9 | [hq/version-intelligence/integration/source-manifest-adapter.mjs](../../hq/version-intelligence/integration/source-manifest-adapter.mjs.md) |
| ../../hq/version-intelligence/compare/index.mjs | import | 10 | [hq/version-intelligence/compare/index.mjs](../../hq/version-intelligence/compare/index.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Draft 2020-12 real conformance; AJV 8 is mandatory, not a homegrown fallback.
// All Git objects are invented synthetic fixtures; never compare real donor repos.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import { syntheticSource } from '../../hq/version-intelligence/sources/fixtures.mjs';
import { resolvePin, snapshotAt } from '../../hq/version-intelligence/sources/snapshots.mjs';
import { bridgeSourceManifest } from '../../hq/version-intelligence/integration/source-manifest-adapter.mjs';
import { comparePinned } from '../../hq/version-intelligence/compare/index.mjs';

const names = ['pin','source-manifest','comparison','migration-finding','adapter-receipt'];
const ajv = new Ajv2020({ allErrors: true, strict: true });
const schemas = Object.fromEntries(names.map(name => {
  const path = new URL('../../contracts/hq-version-intelligence/schemas/v2/' + name + '.schema.json', import.meta.url);
  return [name, JSON.parse(readFileSync(path, 'utf8'))];
}));
const validators = Object.fromEntries(names.map(name => [name, ajv.compile(schemas[name])]));
function valid(name, value) {
  const ok = validators[name](value);
  assert.equal(ok, true, JSON.stringify(validators[name].errors));
}
async function source(repo, ref, f) {
  const pin = await resolvePin({ provider:'github', repo, ref, approvedScope:'development' },
    { adapter:f.adapter, authorize:async()=>true, acquiredAt:'2026-01-01T00:00:00.000Z' });
  return snapshotAt(pin, { adapter:f.adapter, authorize:async()=>true, inspectContent:true });
}
test('v2 Draft 2020-12 schemas compile using real AJV 8', () => {
  assert.equal(Object.keys(validators).length, 5);
  assert.equal(schemas.comparison.$schema, 'https://json-schema.org/draft/2020-12/schema');
});
test('native pin, A manifest, C manifest, dual receipt and C report satisfy v2', async () => {
  const f = syntheticSource();
  const a = await source('synthetic/versioned','v1',f);
  const b = await source('synthetic/versioned','v2',f);
  valid('pin', a.pin);
  valid('source-manifest', a);
  const p = bridgeSourceManifest(a), q = bridgeSourceManifest(b);
  valid('source-manifest', p.manifest);
  valid('adapter-receipt', p.receipt);
  const comparison = comparePinned({ pins:[p.pin,q.pin], manifests:[p.manifest,q.manifest],
    targetPinId:q.pin.pinId });
  valid('comparison', comparison);
  valid('migration-finding', comparison.sourceDeltas[0]);
  assert.ok(comparison.sourceDeltas.every(row => validators['migration-finding'](row)));
});
test('F v1 mislabeled as canonical is rejected; corrupt digest/refused pin rejected', async () => {
  const f=syntheticSource();
  const a=bridgeSourceManifest(await source('synthetic/versioned','v1',f));
  const b=bridgeSourceManifest(await source('synthetic/versioned','v2',f));
  const c=comparePinned({pins:[a.pin,b.pin],manifests:[a.manifest,b.manifest],targetPinId:b.pin.pinId});
  assert.equal(validators.comparison({...c,schema:'arbor.hvi.comparison/1'}),false);
  assert.equal(validators.pin({...a.pin,manifestDigest:'NOT_A_HASH'}),false);
  assert.equal(validators['adapter-receipt']({...a.receipt,losses:['silent_loss']}),false);
  assert.equal(validators['source-manifest']({...a.manifest,schema:'arbor.hvi.manifest/1'}),false);
});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

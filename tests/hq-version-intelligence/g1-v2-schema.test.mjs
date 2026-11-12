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

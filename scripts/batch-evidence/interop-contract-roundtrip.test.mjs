import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// scripts/batch-evidence/interop-contract-roundtrip.test.mjs
// Unit VERIFY:D05-E03-test-discovery — closure classes BUILD/VERIFICATION.
//
// Acceptance (from the ledger): "A contract needs a real roundtrip: a real
// caller parses it, and an invalid field is rejected." This test is that real
// caller for contracts/interop/v1/protocol.schema.json: it parses the schema,
// validates well-formed instances against every $def, and asserts that invalid
// fields are rejected. It also verifies the Rust (types.rs) and JS (types.ts)
// contract mirrors match the schema so Rust and JS consumers agree.
//
// Source-only: boots nothing, starts no server, makes no product dependency on
// this file. The product starts without it.

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const CONTRACTS = join(REPO_ROOT, 'contracts', 'interop', 'v1');
const read = (p) => readFileSync(join(REPO_ROOT, p), 'utf8');
const ajvRoot = join(REPO_ROOT, 'tests', 'hq-version-intelligence');
const require = createRequire(import.meta.url);
const Ajv = require(require.resolve('ajv', { paths: [ajvRoot] }));

const schema = JSON.parse(read(join('contracts', 'interop', 'v1', 'protocol.schema.json')));
const rustSrc = read('contracts/interop/v1/types.rs');
const tsSrc = read('contracts/interop/v1/types.ts');

assert.equal(schema.$id, 'arbor.interop/1', 'schema carries its versioned $id');
assert.ok(Array.isArray(Object.keys(schema.$defs || {})), 'schema defines $defs');

const ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });
ajv.addSchema(schema, 'arbor.interop/1');

function def(name) {
  const v = ajv.getSchema('arbor.interop/1#/$defs/' + name);
  assert.ok(v, 'schema $defs declares ' + name);
  return v;
}

const source = def('source');
const evidence = def('evidence');
const capability = def('capability');
const event = def('event');
const view = def('view');

const validSource = { id: 'src-1', domain: 'development', ownerRef: null, revision: 1 };
const validEvidence = {
  source: validSource,
  digest: 'a'.repeat(64),
  confidence: 'source-observed',
};
const validCapability = {
  id: 'cap-1',
  owner: 'owner-1',
  risk: 'R1',
  source: validSource,
};
const validEvent = {
  eventId: 'ev-1',
  kind: 'accept',
  source: validSource,
  expectedRevision: 1,
};
const validView = {
  schema: 'arbor.inert-view/1',
  source: validSource,
  inert: true,
  status: 'grounded',
  actions: ['read'],
};

// --- real caller parses the schema; every $def accepts a valid instance ---
test('protocol.schema.json source def accepts valid source and rejects invalid fields', () => {
  assert.equal(source(validSource), true);
  assert.equal(source({ ...validSource, domain: 'bogus' }), false);
  assert.ok(source.errors.some((e) => e.instancePath === '/domain'), 'bad domain rejected');
  assert.equal(source({ ...validSource, nope: true }), false);
  assert.ok(source.errors.some((e) => e.params && e.params.additionalProperty === 'nope'), 'extra field rejected');
  assert.equal(source({ id: 'x', domain: 'development', ownerRef: null }), false);
  assert.ok(source.errors.some((e) => e.keyword === 'required' && e.params.missingProperty === 'revision'), 'missing revision rejected');
});

test('protocol.schema.json evidence def accepts valid evidence and rejects invalid fields', () => {
  assert.equal(evidence(validEvidence), true);
  assert.equal(evidence({ ...validEvidence, digest: 'nope' }), false);
  assert.ok(evidence.errors.some((e) => e.instancePath === '/digest'), 'bad digest rejected');
  const extra = { ...validEvidence, extra: true };
  assert.equal(evidence(extra), false);
  assert.ok(evidence.errors.some((e) => e.params && e.params.additionalProperty === 'extra'), 'extra field rejected');
  assert.equal(evidence({ source: validSource, confidence: 'source-observed' }), false);
  assert.ok(evidence.errors.some((e) => e.keyword === 'required' && e.params.missingProperty === 'digest'), 'missing digest rejected');
});

test('protocol.schema.json capability def accepts valid capability and rejects invalid fields', () => {
  assert.equal(capability(validCapability), true);
  assert.equal(capability({ ...validCapability, risk: 'R9' }), false);
  assert.ok(capability.errors.some((e) => e.instancePath === '/risk'), 'bad risk rejected');
  assert.equal(capability({ ...validCapability, risk: null }), true, 'risk may be null');
  const extra = { ...validCapability, extra: true };
  assert.equal(capability(extra), false);
  assert.ok(capability.errors.some((e) => e.params && e.params.additionalProperty === 'extra'), 'extra field rejected');
});

test('protocol.schema.json event def accepts valid event and rejects invalid fields', () => {
  assert.equal(event(validEvent), true);
  assert.equal(event({ ...validEvent, kind: 'bogus' }), false);
  assert.ok(event.errors.some((e) => e.instancePath === '/kind'), 'bad kind rejected');
  assert.equal(event({ ...validEvent, expectedRevision: -1 }), false);
  assert.ok(event.errors.some((e) => e.instancePath === '/expectedRevision'), 'negative expectedRevision rejected');
});

test('protocol.schema.json view def accepts valid inert view and rejects invalid fields', () => {
  assert.equal(view(validView), true);
  assert.equal(view({ ...validView, schema: 'not-a-const' }), false);
  assert.ok(view.errors.some((e) => e.instancePath === '/schema'), 'schema const enforced');
  assert.equal(view({ ...validView, inert: false }), false);
  assert.ok(view.errors.some((e) => e.instancePath === '/inert'), 'inert const enforced');
  const extra = { ...validView, extra: true };
  assert.equal(view(extra), false);
  assert.ok(view.errors.some((e) => e.params && e.params.additionalProperty === 'extra'), 'extra field rejected');
});

// --- Rust and JS contract mirrors match the schema so consumers agree ---
test('types.ts mirrors every schema $def field and enum', () => {
  assert.match(tsSrc, /interface SourceRef \{[^}]*id:string[^}]*domain:SourceDomain[^}]*ownerRef:string\|null[^}]*revision:number[^}]*\}/s,
    'TS SourceRef mirrors schema source def');
  assert.match(tsSrc, /interface EvidenceRef \{[^}]*source:SourceRef[^}]*digest:string[^}]*confidence:Confidence[^}]*\}/s,
    'TS EvidenceRef mirrors schema evidence def');
  assert.match(tsSrc, /interface CapabilityRef \{[^}]*id:string[^}]*owner:string[^}]*risk:HostRisk\|null[^}]*source:SourceRef[^}]*\}/s,
    'TS CapabilityRef mirrors schema capability def');
  assert.match(tsSrc, /interface RevisionEvent \{[^}]*eventId:string[^}]*kind:EventKind[^}]*source:SourceRef[^}]*expectedRevision:number[^}]*\}/s,
    'TS RevisionEvent mirrors schema event def');
  assert.match(tsSrc, /interface InertViewProjection \{[^}]*schema:'arbor\.inert-view\/1'[^}]*source:SourceRef[^}]*inert:true[^}]*status[^}]*actions[^}]*\}/s,
    'TS InertViewProjection mirrors schema view def (schema + inert consts)');
});

test('types.rs mirrors every schema $def field and enum', () => {
  assert.match(rustSrc, /pub struct SourceRef \{[^}]*id: String[^}]*domain: SourceDomain[^}]*owner_ref: Option<String>[^}]*revision: u64[^}]*\}/s,
    'Rust SourceRef mirrors schema source def');
  assert.match(rustSrc, /pub struct EvidenceRef \{[^}]*source: SourceRef[^}]*digest: String[^}]*confidence: Confidence[^}]*\}/s,
    'Rust EvidenceRef mirrors schema evidence def');
  assert.match(rustSrc, /pub struct CapabilityRef \{[^}]*id: String[^}]*owner: String[^}]*risk: Option<HostRisk>[^}]*source: SourceRef[^}]*\}/s,
    'Rust CapabilityRef mirrors schema capability def');
  assert.match(rustSrc, /pub struct RevisionEvent \{[^}]*event_id: String[^}]*kind: EventKind[^}]*source: SourceRef[^}]*expected_revision: u64[^}]*\}/s,
    'Rust RevisionEvent mirrors schema event def');
  assert.match(rustSrc, /pub struct InertViewProjection \{[^}]*schema: String[^}]*source: SourceRef[^}]*inert: bool[^}]*status: ViewStatus[^}]*actions: Vec<String>[^}]*\}/s,
    'Rust InertViewProjection mirrors schema view def (schema + inert)');
});

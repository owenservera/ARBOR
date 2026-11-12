// hq/test/taxonomy.test.mjs — lane taxonomy: the canonical taxonomy registry,
// its loader and its validator.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DECISION_STATUS } from '../lib/canon.mjs';
import {
  TAXONOMY_SCHEMA,
  loadTaxonomy,
  taxonomyDigest,
  taxonomyEngineeringTerm,
  taxonomyLookup,
  taxonomyOwnerSurface,
  taxonomySection,
  taxonomyStatuses,
  taxonomyValidate,
} from '../lib/taxonomy.mjs';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const REGISTRY_FILE = join(REPO_ROOT, 'hq', 'registry', 'canonical-taxonomy.v1.json');

const SECTIONS = [
  'layers', 'entities', 'idGrammar', 'authority', 'lifecycle', 'statuses',
  'effects', 'scopes', 'trust', 'families', 'vocabulary', 'nonEquivalences',
  'schemaIds', 'naming', 'extension',
];

const EXPECTED_SCHEMA_IDS = [
  'hq.context-bundle/1',
  'hq.dcb-protocol/1',
  'hq.receipt/1',
  'hq.component/1',
  'hq.pipeline/1',
  'hq.event/1',
  'hq.task/1',
  'hq.workflow/1',
  'hq.policy/1',
  'hq.eval/1',
  'hq.bootstrap/1',
  'hq.kb/1',
  'hq.coverage/1',
  'hq.realtime/1',
  'hq.vivim-bridge/1',
  'hq.vivim-model/1',
  'hq.vivim-kb-intake/1',
  'hq.wiki-console/1',
  'hq.agentic-file-registry/1',
  'hq.vivim-alignment/1',
];

const CANON_TERM_STATUSES = ['current', 'provisional', 'deprecated', 'historical', 'observed'];

test('the registry file parses and declares the canonical schema and version', () => {
  const raw = JSON.parse(readFileSync(REGISTRY_FILE, 'utf8'));
  assert.equal(raw.schema, TAXONOMY_SCHEMA);
  assert.equal(raw.schema, 'hq.canonical-taxonomy/1');
  assert.equal(raw.version, '1.0.0');
  assert.match(String(raw.digest), /^[0-9a-f]{64}$/);
});

test('loadTaxonomy is cached, pure and stable across two loads', () => {
  const first = loadTaxonomy();
  const second = loadTaxonomy();
  assert.equal(first, second, 'the second load must come from the cache');
  assert.equal(taxonomyDigest(first), taxonomyDigest(second));
  assert.equal(taxonomyDigest(first), first.digest);
  assert.equal(taxonomyDigest(second), first.digest);
});

test('every section is present and ids are unique within each section', () => {
  const taxonomy = loadTaxonomy();
  for (const section of SECTIONS) {
    assert.ok(Array.isArray(taxonomy[section]), `section ${section} must be an array`);
    assert.ok(taxonomy[section].length > 0, `section ${section} must not be empty`);
    const ids = taxonomy[section].map((row) => row.id);
    for (const id of ids) assert.ok(id, `${section} has a row without an id`);
    assert.equal(new Set(ids).size, ids.length, `section ${section} has duplicate ids`);
  }
});

test('taxonomyValidate accepts the real registry', () => {
  const result = taxonomyValidate(loadTaxonomy());
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});

test('taxonomyValidate rejects a duplicate id, an unknown authority and a duplicate vocabulary term', () => {
  const taxonomy = loadTaxonomy();
  const broken = structuredClone(taxonomy);

  // 1. a duplicate id inside one section
  broken.entities[2].id = broken.entities[1].id;
  // 2. an authority value that is declared nowhere
  broken.entities[1].authority = 'invented_authority';
  // 3. two vocabulary rows that map to the same engineering term
  broken.vocabulary[1].engineering_term = broken.vocabulary[0].engineering_term;
  // keep the file-level digest honest so only the three real faults remain
  broken.digest = taxonomyDigest(broken);

  const result = taxonomyValidate(broken);
  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 3, JSON.stringify(result.errors));
  assert.ok(
    result.errors.some((error) => error === 'entities: duplicate id entity.document'),
    JSON.stringify(result.errors),
  );
  assert.ok(
    result.errors.some(
      (error) => error === 'entities.entity.document: unknown authority invented_authority',
    ),
    JSON.stringify(result.errors),
  );
  assert.ok(
    result.errors.some(
      (error) => error === 'vocabulary.vocab.space: duplicate engineering term workspace registry + local index',
    ),
    JSON.stringify(result.errors),
  );
});

test('the vocabulary round-trips owner term to engineering term and back for all 18 terms', () => {
  const taxonomy = loadTaxonomy();
  const rows = taxonomy.vocabulary.filter((row) => row.owner_term);
  assert.equal(rows.length, 18, JSON.stringify(rows.map((row) => row.id)));

  for (const row of rows) {
    const engineering = taxonomyOwnerSurface({ term: row.owner_term });
    assert.equal(engineering, row.engineering_term, row.owner_term);
    const owner = taxonomyEngineeringTerm({ term: engineering });
    assert.equal(owner, row.owner_term, engineering);
  }

  // The two columns are one vocabulary, not two.
  assert.equal(taxonomyOwnerSurface({ term: 'My World' }), 'workspace registry + local index');
  assert.equal(taxonomyEngineeringTerm({ term: 'workspace registry + local index' }), 'My World');
  assert.equal(taxonomyOwnerSurface({ term: 'Nothing At All' }), null);
});

test('the status enums are exactly the values the code uses', () => {
  const taxonomy = loadTaxonomy();

  assert.deepEqual(taxonomyStatuses({ record: 'decision' }), [...DECISION_STATUS]);
  assert.deepEqual(taxonomyStatuses({ record: 'decision' }), [
    'proposed', 'accepted', 'rejected', 'superseded', 'deprecated', 'observed',
  ]);

  const canonSource = readFileSync(join(REPO_ROOT, 'hq', 'lib', 'canon.mjs'), 'utf8');
  const canonValues = taxonomyStatuses({ record: 'canon_term' });
  assert.equal(canonValues.length, CANON_TERM_STATUSES.length);
  for (const value of CANON_TERM_STATUSES) {
    assert.ok(canonValues.includes(value), `canon term status ${value} is missing`);
    assert.ok(
      canonSource.includes(`'${value}'`),
      `canon.mjs does not contain the term status '${value}'`,
    );
  }

  assert.deepEqual(taxonomyStatuses({ record: 'component' }), [
    'active', 'draft', 'deprecated', 'retired',
  ]);
  assert.deepEqual(taxonomyStatuses({ record: 'bootstrap' }), [
    'uninitialized', 'identity', 'capability', 'authority', 'evidence', 'ready',
  ]);
  assert.deepEqual(taxonomyStatuses({ record: 'task' }), [
    'queued', 'running', 'waiting_approval', 'succeeded', 'failed', 'uncertain', 'cancelled',
  ]);
  assert.deepEqual(taxonomyStatuses({ record: 'intake' }), ['accepted', 'refused', 'partial']);
  assert.deepEqual(taxonomyStatuses({ record: 'not_a_record' }), []);
});

test('the schema ids cover every platform contract and each one has an owner', () => {
  const taxonomy = loadTaxonomy();
  const declared = taxonomy.schemaIds.map((row) => row.schema_id);
  assert.equal(declared.length, 20);
  assert.deepEqual(declared.slice().sort(), EXPECTED_SCHEMA_IDS.slice().sort());
  for (const row of taxonomy.schemaIds) {
    assert.ok(String(row.owner ?? '').trim(), `${row.schema_id} has no owner`);
  }
});

test('sections and lookups resolve by id', () => {
  const taxonomy = loadTaxonomy();
  assert.equal(taxonomySection({ section: 'families' }).length, 21);
  assert.equal(taxonomySection({ section: 'entities' }).length, 24);
  assert.deepEqual(taxonomySection({ section: 'nope' }), []);

  const entity = taxonomyLookup({ section: 'entities', id: 'entity.decision' });
  assert.ok(entity);
  assert.equal(entity.title, 'Decision');
  assert.equal(entity.owner, 'hq');
  assert.equal(entity.id_prefix, 'decision');
  assert.equal(taxonomyLookup({ section: 'entities', id: 'entity.nope' }), null);
});

test('a missing registry file throws an error naming the expected path', () => {
  const missing = join(REPO_ROOT, 'hq', 'registry', 'canonical-taxonomy.missing.json');
  assert.throws(
    () => loadTaxonomy({ path: missing }),
    (error) => {
      assert.ok(error instanceof Error);
      assert.ok(error.message.includes(missing), error.message);
      assert.match(error.message, /registry file not found/);
      return true;
    },
  );
});

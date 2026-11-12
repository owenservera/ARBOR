/**
 * @hq:context Conformance tests for the KB binding layer: one target per KB
 *   id, namespaced extension rows, canonical verification, explicit unbound
 *   entries and idempotent re-binding.
 * @hq:owner hq
 * @hq:task kb-binding-v1
 * @hq:invariant The database is in-memory or a temp fixture; the active
 *   `.hq/index.db` is never touched.
 * @hq:see hq/lib/kb-bind.mjs
 * @hq:see docs/KB-BINDING-MAP.md
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { openMemoryDb } from '../lib/schema.mjs';
import {
  EXTENSION_PREFIX, KB_BINDING_SCHEMA, bindingCounts, bindKbTypes,
  extensionTarget, loadKbBinding, validateKbBinding,
} from '../lib/kb-bind.mjs';

const row = (kbId, targetKind, target, extra = {}) => ({
  kbId,
  title: `${kbId} title`,
  target,
  targetKind,
  family: 'system',
  reason: `${kbId} reason`,
  ...extra,
});

function bindingOf(bindings) {
  return {
    schema: KB_BINDING_SCHEMA,
    version: 1,
    generatedFrom: { path: 'vivim-web-harness:docs/knowledge/kb-types.v1.json', sha256: 'a'.repeat(64) },
    bindings,
  };
}

const read = (db, id) => db.prepare('SELECT * FROM semantic_id WHERE id = ?').get(id) ?? null;

test('the checked-in binding covers every KB type exactly once', () => {
  const loaded = loadKbBinding();
  assert.deepEqual(loaded.errors, []);
  assert.equal(loaded.ok, true);
  const binding = loaded.binding;
  assert.equal(binding.schema, KB_BINDING_SCHEMA);
  assert.equal(binding.version, 1);
  assert.match(binding.generatedFrom.sha256, /^[0-9a-f]{64}$/);
  const ids = binding.bindings.map((entry) => entry.kbId);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 44);
  assert.deepEqual(bindingCounts(binding), { total: 44, canonical: 6, extension: 33, unbound: 5 });
  for (const entry of binding.bindings) {
    if (entry.targetKind === 'extension') assert.equal(entry.target, extensionTarget(entry.kbId));
    if (entry.targetKind === 'unbound') assert.ok(entry.reason.length > 20);
  }
});

test('first bind inserts extensions, verifies canonical ids and skips unbound', () => {
  const db = openMemoryDb();
  const binding = bindingOf([
    row('KB-ACTION', 'canonical', 'grammar.action'),
    row('KB-FEATURE', 'extension', extensionTarget('KB-FEATURE')),
    row('KB-PERSON', 'unbound', extensionTarget('KB-PERSON')),
  ]);

  const first = bindKbTypes(db, binding);
  assert.deepEqual(first, { inserted: 1, existing: 1, conflicts: [] });

  const inserted = read(db, 'hq.ext.kb-feature');
  assert.equal(inserted.kind, 'extension');
  assert.equal(inserted.name, 'KB-FEATURE');
  assert.equal(inserted.version, '1');
  assert.equal(inserted.label, 'KB-FEATURE title');
  assert.equal(inserted.description, 'KB-FEATURE reason');
  assert.equal(inserted.status, 'provisional');
  assert.equal(inserted.authority, 'project_observed');
  assert.equal(inserted.provenance, 'system');
  assert.equal(read(db, 'hq.ext.kb-person'), null);
  assert.equal(read(db, 'grammar.action'), null); // canonical ids are never created here

  const second = bindKbTypes(db, binding);
  assert.deepEqual(second, { inserted: 0, existing: 2, conflicts: [] });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM semantic_id').get().n, 1);
});

test('a canonical id collision is reported and the row is not mutated', () => {
  const db = openMemoryDb();
  db.prepare(
    `INSERT INTO semantic_id(id, kind, name, version, label, description, status, authority, provenance, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run('grammar.action', 'extension', 'KB-ACTION', '1', 'squatter', 'squatter', 'provisional', 'project_observed', 'system', '2026-11-03T00:00:00.000Z');

  const res = bindKbTypes(db, bindingOf([row('KB-ACTION', 'canonical', 'grammar.action')]));
  assert.equal(res.inserted, 0);
  assert.equal(res.existing, 0);
  assert.equal(res.conflicts.length, 1);
  assert.equal(res.conflicts[0].reason, 'id_collision');
  assert.equal(res.conflicts[0].target, 'grammar.action');
  const untouched = read(db, 'grammar.action');
  assert.equal(untouched.kind, 'extension');
  assert.equal(untouched.label, 'squatter');
});

test('an extension id collision keeps the existing row', () => {
  const db = openMemoryDb();
  db.prepare(
    `INSERT INTO semantic_id(id, kind, name, version, label, description, status, authority, provenance, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run('hq.ext.kb-feature', 'type', 'other', '1', 'other', 'other', 'current', 'owner', null, '2026-11-03T00:00:00.000Z');

  const res = bindKbTypes(db, bindingOf([row('KB-FEATURE', 'extension', extensionTarget('KB-FEATURE'))]));
  assert.equal(res.conflicts.length, 1);
  assert.equal(res.conflicts[0].reason, 'id_collision');
  assert.equal(read(db, 'hq.ext.kb-feature').name, 'other');
});

test('a non-current canonical row needs owner confirmation', () => {
  const db = openMemoryDb();
  db.prepare(
    `INSERT INTO semantic_id(id, kind, name, version, label, description, status, authority, provenance, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run('hq.component/1', 'contract', 'hq.component', '1', 'Component', 'Component', 'proposed', 'project_observed', null, '2026-11-03T00:00:00.000Z');

  const binding = bindingOf([row('KB-BOGUS', 'canonical', 'hq.component/1')]);
  const refused = bindKbTypes(db, binding);
  assert.equal(refused.existing, 0);
  assert.equal(refused.conflicts[0].reason, 'canonical_not_current');

  const confirmed = bindKbTypes(db, binding, { ownerConfirmed: true });
  assert.deepEqual(confirmed, { inserted: 0, existing: 1, conflicts: [] });
});

test('an unknown canonical target and an invalid binding are refused', () => {
  const db = openMemoryDb();
  const missing = bindKbTypes(db, bindingOf([row('KB-NOPE', 'canonical', 'grammar.nope')]));
  assert.equal(missing.conflicts[0].reason, 'canonical_target_missing');

  const bad = bindingOf([row('KB-FEATURE', 'extension', extensionTarget('KB-FEATURE')), row('KB-FEATURE', 'extension', extensionTarget('KB-FEATURE'))]);
  assert.ok(validateKbBinding(bad).some((error) => error.includes('duplicate')));
  const res = bindKbTypes(db, bad);
  assert.equal(res.inserted, 0);
  assert.equal(res.conflicts[0].reason, 'invalid_binding');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM semantic_id').get().n, 0);
});

test('binding the real registry inserts 33 rows and verifies 6 canonical ids', () => {
  const db = openMemoryDb();
  const loaded = loadKbBinding();
  const res = bindKbTypes(db, loaded.binding);
  assert.deepEqual(res, { inserted: 33, existing: 6, conflicts: [] });
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM semantic_id WHERE kind = 'extension'").get().n, 33);
  const again = bindKbTypes(db, loaded.binding);
  assert.deepEqual(again, { inserted: 0, existing: 39, conflicts: [] });
  assert.ok(EXTENSION_PREFIX.length > 0);
});

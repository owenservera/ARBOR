// hq/test/wiki-program.test.mjs — wiki program configuration writer.
//
// The fixture creates `wiki_program_version` itself, because the production
// module never runs DDL. The statement below is byte-identical to the DDL
// declared by the schema lane.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openMemoryDb } from '../lib/schema.mjs';
import {
  PROGRAM_CONFIG_KEYS, PROGRAM_FILTER_KEYS, PROGRAM_LAYOUT_KEYS,
  PROGRAM_SELECTION_KEYS, PROGRAM_SOURCE_VALUES, WIKI_PROGRAM_SCHEMA,
  activateProgram, canonicalProgramConfig, getActiveProgram, listProgramVersions,
  previewProgram, rollbackProgram, validateProgramConfig,
} from '../lib/wiki-program.mjs';

const WIKI_PROGRAM_DDL = `  CREATE TABLE IF NOT EXISTS wiki_program_version (
    id TEXT NOT NULL,
    version INTEGER NOT NULL,
    config TEXT NOT NULL,
    status TEXT NOT NULL,
    revision INTEGER NOT NULL,
    owner_confirmed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    receipt TEXT,
    PRIMARY KEY (id, version)
  );`;

function memoryDb() {
  const db = openMemoryDb();
  db.exec(WIKI_PROGRAM_DDL);
  return db;
}

const count = (db) => Number(db.prepare('SELECT COUNT(*) AS n FROM wiki_program_version').get().n);

function baseConfig() {
  return {
    id: 'project-overview',
    version: 1,
    project: 'repos-hq',
    source: 'index',
    filters: { kind: 'source', status: ['current', 'active'] },
    layout: {
      columns: ['path', 'lines'], groupBy: 'component', order: ['path'],
      depth: 2, budget: 2000, retrieval: 'bm25', density: 'compact',
    },
    selection: { mode: 'top', limit: 20, confidence: 0.6, strategy: 'coverage' },
    expectedRevision: 0,
  };
}

const codesOf = (result) => result.errors.map((error) => error.code);
const pathsOf = (result) => result.errors.map((error) => error.path);

// 1 -------------------------------------------------------------------------
test('a valid config validates', () => {
  const result = validateProgramConfig(baseConfig());
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(PROGRAM_CONFIG_KEYS, [
    'id', 'version', 'project', 'source', 'filters', 'layout', 'selection', 'expectedRevision',
  ]);
  assert.deepEqual([...PROGRAM_FILTER_KEYS], ['kind', 'status', 'authority', 'type', 'capability', 'query']);
  assert.deepEqual([...PROGRAM_LAYOUT_KEYS], ['columns', 'groupBy', 'order', 'depth', 'budget', 'retrieval', 'density']);
  assert.deepEqual([...PROGRAM_SELECTION_KEYS], ['mode', 'limit', 'confidence', 'strategy']);
  assert.deepEqual([...PROGRAM_SOURCE_VALUES], ['index', 'docs', 'decisions', 'canon', 'wiki', 'notes', 'sessions']);
  assert.equal(WIKI_PROGRAM_SCHEMA, 'hq.wiki-program/1');
});

// 2 -------------------------------------------------------------------------
test('unknown keys are refused at both levels', () => {
  const top = validateProgramConfig({ ...baseConfig(), theme: 'dark' });
  assert.equal(top.ok, false);
  assert.deepEqual(codesOf(top), ['unknown_key']);
  assert.deepEqual(pathsOf(top), ['theme']);

  const nested = validateProgramConfig({
    ...baseConfig(),
    filters: { kind: 'source', bogus: 'x' },
  });
  assert.equal(nested.ok, false);
  const finding = nested.errors.find((error) => error.code === 'unknown_key');
  assert.ok(finding);
  assert.equal(finding.path, 'filters.bogus');
});

// 3 -------------------------------------------------------------------------
test('forbidden keys are refused at both levels', () => {
  for (const key of ['command', 'exec', 'shell', 'send', 'sudo', 'token']) {
    const top = validateProgramConfig({ ...baseConfig(), [key]: 'x' });
    assert.equal(top.ok, false, `top-level ${key} must be refused`);
    assert.deepEqual(codesOf(top), ['forbidden_key'], `top-level ${key}`);
    assert.deepEqual(pathsOf(top), [key]);

    const nested = validateProgramConfig({ ...baseConfig(), layout: { ...baseConfig().layout, [key]: 'x' } });
    assert.equal(nested.ok, false, `nested ${key} must be refused`);
    assert.deepEqual(codesOf(nested), ['forbidden_key'], `nested ${key}`);
    assert.deepEqual(pathsOf(nested), [`layout.${key}`]);
  }
});

// 4 -------------------------------------------------------------------------
test('forbidden capability values are refused', () => {
  const shell = validateProgramConfig({ ...baseConfig(), project: 'shell' });
  assert.equal(shell.ok, false);
  assert.deepEqual(codesOf(shell), ['forbidden_value']);

  const url = validateProgramConfig({ ...baseConfig(), filters: { query: 'http://x' } });
  assert.equal(url.ok, false);
  assert.deepEqual(codesOf(url), ['forbidden_value']);

  const evil = validateProgramConfig({ ...baseConfig(), selection: { ...baseConfig().selection, strategy: 'eval' } });
  assert.equal(evil.ok, false);
  assert.deepEqual(codesOf(evil), ['forbidden_value']);
});

// 5 -------------------------------------------------------------------------
test('path traversal and absolute paths are refused', () => {
  for (const value of ['../etc/passwd', 'C:\\windows', '/abs']) {
    const result = validateProgramConfig({ ...baseConfig(), project: value });
    assert.equal(result.ok, false, `${value} must be refused`);
    assert.deepEqual(codesOf(result), ['path_traversal'], value);
    assert.deepEqual(pathsOf(result), ['project'], value);
  }
});

// 6 -------------------------------------------------------------------------
test('id, version and source have closed contracts', () => {
  const badId = validateProgramConfig({ ...baseConfig(), id: 'Bad Id' });
  assert.equal(badId.ok, false);
  assert.ok(codesOf(badId).includes('invalid_id'));
  assert.equal(validateProgramConfig({ ...baseConfig(), id: undefined }).errors[0].code, 'invalid_id');

  const badVersion = validateProgramConfig({ ...baseConfig(), version: 0 });
  assert.equal(badVersion.ok, false);
  assert.deepEqual(codesOf(badVersion), ['invalid_version']);

  const badSource = validateProgramConfig({ ...baseConfig(), source: 'filesystem' });
  assert.equal(badSource.ok, false);
  assert.deepEqual(codesOf(badSource), ['invalid_source']);
  assert.deepEqual(pathsOf(badSource), ['source']);
});

// 7 -------------------------------------------------------------------------
test('the error array is deterministically sorted', () => {
  const result = validateProgramConfig({
    theme: 'x',
    send: 'now',
    filters: { bogus: 'y', shell: 'z' },
    source: 'filesystem',
    id: 'Nope!',
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.length >= 5);
  const sorted = [...result.errors].sort((a, b) => (
    a.path < b.path ? -1 : a.path > b.path ? 1 : a.code < b.code ? -1 : a.code > b.code ? 1 : 0
  ));
  assert.deepEqual(result.errors, sorted);
  // Same input, same array, twice.
  assert.deepEqual(validateProgramConfig({
    theme: 'x', send: 'now', filters: { bogus: 'y', shell: 'z' }, source: 'filesystem', id: 'Nope!',
  }), result);
});

// 8 -------------------------------------------------------------------------
test('canonicalProgramConfig is order independent', () => {
  const a = {
    id: 'p',
    source: 'index',
    filters: { kind: 'source', status: 'active' },
    layout: { columns: ['path'], depth: 1 },
  };
  const b = {
    layout: { depth: 1, columns: ['path'] },
    filters: { status: 'active', kind: 'source' },
    source: 'index',
    id: 'p',
  };
  assert.notEqual(JSON.stringify(a), JSON.stringify(b));
  assert.equal(canonicalProgramConfig(a), canonicalProgramConfig(b));
  assert.equal(canonicalProgramConfig({ ...a }), canonicalProgramConfig(b));
});

// 9 -------------------------------------------------------------------------
test('previewProgram orders the plan and respects dependsOn', () => {
  const db = memoryDb();
  const preview = previewProgram(db, baseConfig());
  assert.equal(preview.schema, WIKI_PROGRAM_SCHEMA);
  assert.equal(preview.ok, true);
  assert.deepEqual(preview.errors, []);
  assert.equal(preview.plan.status, 'ordered');
  assert.ok(preview.plan.order.length > 0);
  assert.equal(preview.plan.order.length, preview.plan.steps.length);
  assert.deepEqual(preview.plan.order, [
    'resolve-source', 'apply-filters', 'apply-selection', 'apply-layout', 'render-projections',
  ]);
  const position = new Map(preview.plan.order.map((id, index) => [id, index]));
  for (const step of preview.plan.steps) {
    assert.ok(step.id && step.label, 'every step has an id and a label');
    for (const dependency of step.dependsOn) {
      assert.ok(position.has(dependency), `missing dependency ${dependency}`);
      assert.ok(position.get(dependency) < position.get(step.id), `${dependency} must precede ${step.id}`);
    }
  }
  // A plan never claims an order when the optimizer blocks it.
  assert.equal(preview.plan.missing, undefined);
  assert.equal(preview.plan.cycle, undefined);
  assert.equal(preview.activeVersion, null);
  assert.equal(preview.revision, 0);
  assert.equal(preview.diff.fromVersion, null);
  assert.deepEqual([...preview.affected.projections].sort(), preview.affected.projections);
  assert.equal(preview.affected.source, 'index');
  assert.equal(preview.affected.scope, 'repos-hq');
});

// 10 ------------------------------------------------------------------------
test('previewProgram is pure', () => {
  const db = memoryDb();
  const before = count(db);
  const first = previewProgram(db, baseConfig());
  const second = previewProgram(db, baseConfig());
  const after = count(db);
  assert.equal(before, 0);
  assert.equal(after, 0);
  assert.equal(first.digest, second.digest);
  assert.equal(first.digest.length, 64);
});

// 11 ------------------------------------------------------------------------
test('previewProgram diffs against the active version', () => {
  const db = memoryDb();
  const active = {
    id: 'differ',
    source: 'index',
    filters: { kind: 'source' },
    layout: { columns: ['path'] },
  };
  assert.equal(activateProgram(db, active, { ownerConfirmed: true }).ok, true);

  const next = {
    id: 'differ',
    source: 'index',
    filters: { kind: 'doc' },
    layout: { columns: ['path'] },
    selection: { mode: 'top' },
  };
  const preview = previewProgram(db, next);
  assert.equal(preview.ok, true);
  assert.deepEqual(preview.diff.changed, ['filters']);
  assert.deepEqual(preview.diff.added, ['selection']);
  assert.deepEqual(preview.diff.removed, []);
  assert.equal(preview.diff.fromVersion, 1);
  assert.equal(preview.activeVersion, 1);
  assert.equal(preview.revision, 1);
});

// 12 ------------------------------------------------------------------------
test('activateProgram refuses without owner confirmation and writes nothing', () => {
  const db = memoryDb();
  const refused = activateProgram(db, baseConfig());
  assert.deepEqual(refused, { ok: false, reason: 'owner_confirmation_required' });
  assert.equal(count(db), 0);

  const explicitFalse = activateProgram(db, baseConfig(), { ownerConfirmed: false });
  assert.deepEqual(explicitFalse, { ok: false, reason: 'owner_confirmation_required' });
  assert.equal(count(db), 0);
});

// 13 ------------------------------------------------------------------------
test('activateProgram writes version 1 as active with a revision and owner flag', () => {
  const db = memoryDb();
  const receipt = { kind: 'wiki-program', sources: [], digest: 'abc' };
  const result = activateProgram(db, baseConfig(), { ownerConfirmed: true, receipt });
  assert.equal(result.ok, true);
  assert.equal(result.id, 'project-overview');
  assert.equal(result.version, 1);
  assert.equal(result.revision, 1);
  assert.equal(result.digest.length, 64);
  assert.deepEqual(result.receipt, receipt);

  const row = db.prepare('SELECT * FROM wiki_program_version WHERE id = ? AND version = ?')
    .get('project-overview', 1);
  assert.equal(row.status, 'active');
  assert.equal(Number(row.owner_confirmed), 1);
  assert.equal(Number(row.revision), 1);
  assert.equal(row.config, canonicalProgramConfig(baseConfig()));
  assert.ok(row.created_at);
  assert.deepEqual(JSON.parse(row.receipt), receipt);

  const active = getActiveProgram(db, 'project-overview');
  assert.equal(active.version, 1);
  assert.equal(active.status, 'active');
  assert.equal(active.ownerConfirmed, true);
  assert.deepEqual(active.config, baseConfig());
  assert.deepEqual(active.receipt, receipt);
  assert.equal(active.createdAt, row.created_at);
});

// 14 ------------------------------------------------------------------------
test('a second activation supersedes version 1 and keeps it queryable', () => {
  const db = memoryDb();
  activateProgram(db, baseConfig(), { ownerConfirmed: true });
  const second = activateProgram(db, { ...baseConfig(), layout: { columns: ['path'] } }, { ownerConfirmed: true });
  assert.equal(second.ok, true);
  assert.equal(second.version, 2);
  assert.equal(second.revision, 2);
  assert.equal(count(db), 2);

  const versions = listProgramVersions(db, { id: 'project-overview' });
  assert.deepEqual(versions.map((row) => [row.version, row.status, row.revision]), [
    [1, 'superseded', 1],
    [2, 'active', 2],
  ]);
  assert.equal(getActiveProgram(db, 'project-overview').version, 2);
});

// 15 ------------------------------------------------------------------------
test('rollbackProgram restores config as a new version and retains history', () => {
  const db = memoryDb();
  const v1 = baseConfig();
  const v2 = { ...baseConfig(), layout: { columns: ['path'], depth: 4 }, selection: { mode: 'top', limit: 5 } };
  activateProgram(db, v1, { ownerConfirmed: true });
  activateProgram(db, v2, { ownerConfirmed: true });

  const rolled = rollbackProgram(db, { id: 'project-overview', toVersion: 1, ownerConfirmed: true });
  assert.equal(rolled.ok, true);
  assert.equal(rolled.id, 'project-overview');
  assert.equal(rolled.version, 3);
  assert.equal(rolled.revision, 3);
  assert.equal(rolled.fromVersion, 1);
  assert.equal(rolled.digest.length, 64);
  assert.equal(count(db), 3);

  const versions = listProgramVersions(db, { id: 'project-overview' });
  assert.deepEqual(versions.map((row) => [row.version, row.status]), [
    [1, 'superseded'], [2, 'superseded'], [3, 'active'],
  ]);
  // Version 3 carries version 1's config; version 2 is retained, not deleted.
  assert.equal(canonicalProgramConfig(versions[2].config), canonicalProgramConfig(v1));
  assert.equal(canonicalProgramConfig(versions[1].config), canonicalProgramConfig(v2));
  assert.equal(getActiveProgram(db, 'project-overview').version, 3);
});

// 16 ------------------------------------------------------------------------
test('rollbackProgram to an unknown version writes nothing', () => {
  const db = memoryDb();
  activateProgram(db, baseConfig(), { ownerConfirmed: true });
  const before = count(db);
  const missing = rollbackProgram(db, { id: 'project-overview', toVersion: 99, ownerConfirmed: true });
  assert.deepEqual(missing, { ok: false, reason: 'unknown_version' });
  const unknownId = rollbackProgram(db, { id: 'nope', toVersion: 1, ownerConfirmed: true });
  assert.deepEqual(unknownId, { ok: false, reason: 'unknown_version' });
  assert.equal(count(db), before);
});

// 17 ------------------------------------------------------------------------
test('rollbackProgram refuses without owner confirmation', () => {
  const db = memoryDb();
  activateProgram(db, baseConfig(), { ownerConfirmed: true });
  const before = count(db);
  assert.deepEqual(rollbackProgram(db, { id: 'project-overview', toVersion: 1 }), {
    ok: false, reason: 'owner_confirmation_required',
  });
  assert.deepEqual(rollbackProgram(db, { id: 'project-overview', toVersion: 1, ownerConfirmed: 'yes' }), {
    ok: false, reason: 'owner_confirmation_required',
  });
  assert.equal(count(db), before);
});

// 18 ------------------------------------------------------------------------
test('listProgramVersions is ordered deterministically and honors limit', () => {
  const db = memoryDb();
  activateProgram(db, { id: 'beta', source: 'docs' }, { ownerConfirmed: true });
  activateProgram(db, { id: 'alpha', source: 'index' }, { ownerConfirmed: true });
  activateProgram(db, { id: 'alpha', source: 'canon' }, { ownerConfirmed: true });
  activateProgram(db, { id: 'alpha', source: 'wiki' }, { ownerConfirmed: true });

  const all = listProgramVersions(db);
  assert.deepEqual(all.map((row) => [row.id, row.version]), [
    ['alpha', 1], ['alpha', 2], ['alpha', 3], ['beta', 1],
  ]);
  assert.deepEqual(listProgramVersions(db), all);

  const limited = listProgramVersions(db, { limit: 2 });
  assert.deepEqual(limited.map((row) => [row.id, row.version]), [['alpha', 1], ['alpha', 2]]);
  assert.deepEqual(listProgramVersions(db, { id: 'alpha', limit: 2 }).map((row) => row.version), [1, 2]);
  assert.deepEqual(listProgramVersions(db, { limit: 0 }), []);
  assert.equal(listProgramVersions(db, { limit: 5000 }).length, 4);
});

// 19 ------------------------------------------------------------------------
test('malformed input never throws', () => {
  const db = memoryDb();

  for (const value of [null, undefined, 'config', 42, [], true]) {
    const result = validateProgramConfig(value);
    assert.equal(result.ok, false);
    assert.deepEqual(codesOf(result), ['invalid_config']);
    assert.deepEqual(result.errors[0].path, '');
  }

  const previewed = previewProgram(db, null);
  assert.equal(previewed.schema, WIKI_PROGRAM_SCHEMA);
  assert.equal(previewed.ok, false);
  assert.equal(previewed.errors[0].code, 'invalid_config');
  assert.equal(previewed.plan.status, 'ordered');
  assert.equal(typeof previewed.digest, 'string');
  assert.equal(previewed.activeVersion, null);

  assert.deepEqual(activateProgram(db, undefined, {}), { ok: false, reason: 'owner_confirmation_required' });
  assert.deepEqual(activateProgram(db, null, { ownerConfirmed: true }), {
    ok: false,
    reason: 'invalid_config',
    errors: [{ code: 'invalid_config', path: '', message: 'config must be a plain object' }],
  });
  assert.deepEqual(rollbackProgram(db, {}), { ok: false, reason: 'owner_confirmation_required' });
  assert.deepEqual(rollbackProgram(db, undefined), { ok: false, reason: 'owner_confirmation_required' });
  assert.deepEqual(rollbackProgram(db, { ownerConfirmed: true }), { ok: false, reason: 'unknown_version' });
  assert.deepEqual(listProgramVersions(db, null), []);
  assert.equal(count(db), 0);
});

// 20 ------------------------------------------------------------------------
test('getActiveProgram returns null for an unknown id', () => {
  const db = memoryDb();
  assert.equal(getActiveProgram(db, 'missing'), null);
  activateProgram(db, baseConfig(), { ownerConfirmed: true });
  assert.equal(getActiveProgram(db, 'missing'), null);
  assert.equal(getActiveProgram(db, ''), null);
  assert.equal(getActiveProgram(db, null), null);
});

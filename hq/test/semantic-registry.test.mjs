/**
 * @hq:context Conformance tests for the versioned semantic registry: stable IDs,
 *   owner-confirmed promotion, alias referential integrity and source drift.
 * @hq:owner hq
 * @hq:task semantic-registry-v1
 * @hq:invariant A real temp directory is used for drift fixtures; the active
 *   `.hq/index.db` is never touched. The database is in-memory.
 * @hq:invariant Temp fixtures are removed deterministically under Bun: the SQLite
 *   handle is released by the GC finalizer, so cleanup forces `Bun.gc(true)` and
 *   yields to the event loop between retries.
 * @hq:see hq/lib/semantic-registry.mjs
 */
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb, openMemoryDb } from '../lib/schema.mjs';
import { sha256File } from '../lib/util.mjs';
import {
  SEMANTIC_KINDS, SEMANTIC_REGISTRY_SCHEMA, SEMANTIC_STATUS,
  deprecateSemanticId, detectSemanticDrift, getSemanticId, linkSemanticSource,
  listSemanticAliases, listSemanticIds, listSemanticLinks, promoteSemanticId,
  registerSemanticAlias, registerSemanticId, resolveSemanticAlias,
} from '../lib/semantic-registry.mjs';

const db = () => openMemoryDb();

// Temp fixture directories that are still on disk.
const TEMP_DIRS = new Set();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Remove a temp fixture directory deterministically.
 *
 * `rmSync({ maxRetries, retryDelay })` does not work under Bun for the EBUSY case:
 * Bun releases a SQLite file handle in the finalizer rather than inside `close()`, so
 * the directory is still locked when the synchronous retry budget runs out and the
 * fixture leaks on every run. Force the collection, then retry across rounds that
 * yield to the event loop so the pending finalizer can actually run before the next
 * attempt. A leftover temp directory must never fail the suite, and a locked fixture
 * must never leak silently.
 *
 * @param {string} path absolute path of the directory to remove
 * @returns {Promise<boolean>} true when the directory is gone
 */
async function cleanup(path) {
  TEMP_DIRS.add(path);
  for (let round = 0; round < 60; round += 1) {
    if (typeof Bun !== 'undefined' && typeof Bun.gc === 'function') Bun.gc(true);
    try {
      rmSync(path, { recursive: true, force: true });
      // rmSync can report success while the directory is still locked, so verify.
      if (!existsSync(path)) {
        TEMP_DIRS.delete(path);
        return true;
      }
    } catch { /* the handle is still held; try again on the next round */ }
    await sleep(25);
  }
  return false;
}

// A last sweep for anything a test left behind: the per-fixture hook owns the normal
// path, this one turns a remaining directory into a visible failure instead of a
// silent leak.
after(async () => {
  const leftovers = [];
  for (const path of [...TEMP_DIRS]) {
    if (!await cleanup(path)) leftovers.push(path);
  }
  if (leftovers.length) {
    throw new Error(`temp fixture cleanup failed for: ${leftovers.join(', ')}`);
  }
});

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'hq-semantic-registry-'));
  TEMP_DIRS.add(root);
  t.after(async () => { await cleanup(root); });
  return { root, write: (name, text) => { const p = join(root, name); writeFileSync(p, text); return p; } };
}

test('schema and vocabularies are explicitly versioned', () => {
  assert.equal(SEMANTIC_REGISTRY_SCHEMA, 'hq.semantic-registry/1');
  assert.deepEqual([...SEMANTIC_STATUS], ['proposed', 'current', 'deprecated']);
  assert.ok(SEMANTIC_KINDS.includes('type'));
  assert.ok(SEMANTIC_KINDS.includes('capability'));
});

test('1. register a valid type ID as proposed', () => {
  const d = db();
  const res = registerSemanticId(d, { id: 'widget@1', kind: 'type', label: 'Widget', description: 'A widget.' });
  assert.deepEqual(res, { ok: true, id: 'widget@1', status: 'proposed', reason: 'registered' });
  const row = getSemanticId(d, 'widget@1');
  assert.equal(row.kind, 'type');
  assert.equal(row.name, 'widget');
  assert.equal(row.version, '1');
  assert.equal(row.status, 'proposed');
  assert.equal(row.authority, 'project_observed');
  assert.equal(row.label, 'Widget');
});

test('2. malformed ID and unknown kind are refused', () => {
  const d = db();
  for (const id of ['widget', '@1', 'widget@', 'Widget@1', 'widget@one', 'wid get@1', 'widget@1@2', '']) {
    assert.equal(registerSemanticId(d, { id, kind: 'type' }).reason, 'invalid_id', id);
  }
  assert.equal(registerSemanticId(d, { id: 'widget@1', kind: 'gadget' }).reason, 'invalid_kind');
  assert.equal(registerSemanticId(d, { id: 'widget@1' }).reason, 'invalid_kind');
  assert.equal(listSemanticIds(d).length, 0);
});

test('3. duplicate ID with different content is a conflict and adds no row', () => {
  const d = db();
  assert.equal(registerSemanticId(d, { id: 'widget@1', kind: 'type', label: 'Widget' }).ok, true);
  const dup = registerSemanticId(d, { id: 'widget@1', kind: 'type', label: 'Other widget' });
  assert.equal(dup.ok, false);
  assert.equal(dup.reason, 'duplicate_id');
  assert.equal(listSemanticIds(d).length, 1);
  // kind-only difference is also a conflict
  assert.equal(registerSemanticId(d, { id: 'widget@1', kind: 'capability', label: 'Widget' }).reason, 'duplicate_id');
});

test('4. duplicate ID with identical content is idempotent', () => {
  const d = db();
  assert.equal(registerSemanticId(d, { id: 'widget@1', kind: 'type', label: 'Widget' }).reason, 'registered');
  const again = registerSemanticId(d, { id: 'widget@1', kind: 'type', label: 'Widget' });
  assert.equal(again.ok, true);
  assert.equal(again.reason, 'unchanged');
  assert.equal(again.status, 'proposed');
  assert.equal(listSemanticIds(d).length, 1);
});

test('5. registration cannot claim current', () => {
  const d = db();
  const res = registerSemanticId(d, { id: 'widget@1', kind: 'type', status: 'current' });
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'owner_confirmation_required');
  assert.equal(getSemanticId(d, 'widget@1'), null);
  assert.equal(registerSemanticId(d, { id: 'widget@1', kind: 'type', status: 'deprecated' }).reason, 'invalid_status');
});

test('6. promotion requires owner confirmation', () => {
  const d = db();
  registerSemanticId(d, { id: 'widget@1', kind: 'type', label: 'Widget' });
  const refused = promoteSemanticId(d, 'widget@1', { ownerConfirmed: false });
  assert.equal(refused.ok, false);
  assert.equal(refused.reason, 'owner_confirmation_required');
  assert.equal(getSemanticId(d, 'widget@1').status, 'proposed');
  assert.equal(promoteSemanticId(d, 'widget@1', {}).reason, 'owner_confirmation_required');

  const promoted = promoteSemanticId(d, 'widget@1', { ownerConfirmed: true });
  assert.deepEqual(promoted, { ok: true, id: 'widget@1', status: 'current', reason: 'promoted' });
  assert.equal(getSemanticId(d, 'widget@1').status, 'current');
  assert.equal(getSemanticId(d, 'widget@1').authority, 'owner');
  assert.equal(promoteSemanticId(d, 'missing@1', { ownerConfirmed: true }).reason, 'unknown_id');
});

test('7. a deprecated ID never returns to current', () => {
  const d = db();
  registerSemanticId(d, { id: 'widget@1', kind: 'type' });
  promoteSemanticId(d, 'widget@1', { ownerConfirmed: true });
  deprecateSemanticId(d, 'widget@1', { ownerConfirmed: true });
  const res = promoteSemanticId(d, 'widget@1', { ownerConfirmed: true });
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'invalid_transition');
  assert.equal(getSemanticId(d, 'widget@1').status, 'deprecated');
});

test('8. deprecation requires the owner and retains the row', () => {
  const d = db();
  registerSemanticId(d, { id: 'widget@1', kind: 'type', label: 'Widget' });
  assert.equal(deprecateSemanticId(d, 'widget@1').reason, 'owner_confirmation_required');
  assert.equal(getSemanticId(d, 'widget@1').status, 'proposed');
  const res = deprecateSemanticId(d, 'widget@1', { ownerConfirmed: true });
  assert.equal(res.ok, true);
  assert.equal(res.status, 'deprecated');
  const row = getSemanticId(d, 'widget@1');
  assert.equal(row.status, 'deprecated');
  assert.equal(row.label, 'Widget');
  assert.equal(listSemanticIds(d, { status: 'deprecated' }).length, 1);
  // idempotent, still retained
  assert.equal(deprecateSemanticId(d, 'widget@1', { ownerConfirmed: true }).reason, 'unchanged');
  assert.equal(listSemanticIds(d).length, 1);
});

test('9. alias referential integrity', () => {
  const d = db();
  registerSemanticId(d, { id: 'widget@1', kind: 'type' });
  const unknown = registerSemanticAlias(d, { alias: 'widget', targetId: 'missing@1' });
  assert.equal(unknown.ok, false);
  assert.equal(unknown.reason, 'unknown_target');
  assert.equal(registerSemanticAlias(d, { alias: '  ', targetId: 'widget@1' }).reason, 'invalid_alias');
  assert.equal(registerSemanticAlias(d, { alias: 'widget', targetId: 'widget@1' }).ok, true);
  assert.equal(registerSemanticAlias(d, { alias: 'widget', targetId: 'widget@1' }).reason, 'unchanged');
  assert.deepEqual(listSemanticAliases(d), [{ alias: 'widget', targetId: 'widget@1', kind: null }]);
});

test('10. alias resolution is exact, ambiguity-preserving and never throws', () => {
  const d = db();
  registerSemanticId(d, { id: 'widget@1', kind: 'type' });
  registerSemanticId(d, { id: 'gadget@1', kind: 'type' });
  registerSemanticAlias(d, { alias: 'widget', targetId: 'widget@1' });
  registerSemanticAlias(d, { alias: 'Widget gadget', targetId: 'gadget@1' });

  const exact = resolveSemanticAlias(d, '  WIDGET ');
  assert.equal(exact.status, 'resolved');
  assert.deepEqual(exact.targets, ['widget@1']);
  assert.equal(exact.source, 'registry');

  const collided = registerSemanticAlias(d, { alias: 'widget', targetId: 'gadget@1' });
  assert.equal(collided.ok, true);
  const ambiguous = resolveSemanticAlias(d, 'widget');
  assert.equal(ambiguous.status, 'ambiguous');
  assert.equal(ambiguous.total, 2);
  assert.deepEqual(ambiguous.targets, ['gadget@1', 'widget@1']);

  assert.equal(resolveSemanticAlias(d, '').status, 'invalid');
  assert.equal(resolveSemanticAlias(d, 'unseen').status, 'not_found');
  assert.equal(resolveSemanticAlias(d, null, null).status, 'invalid');
  assert.equal(resolveSemanticAlias(d, 'wid', { prefix: true }).status, 'ambiguous');
});

test('11. links require a known target and refuse secret paths', () => {
  const d = db();
  registerSemanticId(d, { id: 'widget@1', kind: 'type' });
  const unknown = linkSemanticSource(d, { semanticId: 'missing@1', path: 'src/a.mjs' });
  assert.equal(unknown.ok, false);
  assert.equal(unknown.reason, 'unknown_target');
  for (const path of ['.env.local', 'keys/service.keystore', 'config/session.json',
    'config/storage-state.json', 'config/release-profile.json', 'browser/Cookies', 'browser/Login Data']) {
    const res = linkSemanticSource(d, { semanticId: 'widget@1', path });
    assert.equal(res.ok, false, path);
    assert.equal(res.reason, 'secret_path', path);
  }
  const ok = linkSemanticSource(d, { semanticId: 'widget@1', path: 'src/widget.mjs', line: 12 });
  assert.equal(ok.ok, true);
  assert.equal(ok.id, 'widget@1::src/widget.mjs');
  assert.equal(listSemanticLinks(d).length, 1);
});

test('12. drift reports current, content_changed and missing_source', (t) => {
  const f = fixture(t);
  const d = db();
  registerSemanticId(d, { id: 'widget@1', kind: 'type' });
  const stable = f.write('stable.mjs', 'export const widget = 1;\n');
  const moving = f.write('moving.mjs', 'export const widget = 2;\n');
  const doomed = f.write('doomed.mjs', 'export const widget = 3;\n');

  linkSemanticSource(d, { id: 'stable', semanticId: 'widget@1', path: 'stable.mjs', contentHash: sha256File(stable) });
  linkSemanticSource(d, { id: 'moving', semanticId: 'widget@1', path: 'moving.mjs', contentHash: sha256File(moving) });
  linkSemanticSource(d, { id: 'doomed', semanticId: 'widget@1', path: 'doomed.mjs', contentHash: sha256File(doomed) });

  writeFileSync(moving, 'export const widget = 4;\n');
  rmSync(doomed);

  const report = detectSemanticDrift(d, { root: f.root });
  assert.equal(report.checked, 3);
  const byId = new Map(report.map((row) => [row.id, row]));
  assert.equal(byId.get('stable').status, 'current');
  assert.deepEqual(byId.get('stable').reasons, []);
  assert.equal(byId.get('moving').status, 'drift');
  assert.ok(byId.get('moving').reasons.includes('content_changed'));
  assert.equal(byId.get('doomed').status, 'drift');
  assert.ok(byId.get('doomed').reasons.includes('missing_source'));
  // Deterministic ordering by link ID.
  assert.deepEqual(report.map((row) => row.id), ['doomed', 'moving', 'stable']);
});

test('13. listings are deterministically ordered and bounded', () => {
  const d = db();
  for (const id of ['zulu@1', 'alpha@2', 'alpha@1', 'mike@10']) {
    registerSemanticId(d, { id, kind: 'type' });
  }
  assert.deepEqual(listSemanticIds(d).map((row) => row.id), ['alpha@1', 'alpha@2', 'mike@10', 'zulu@1']);
  assert.deepEqual(listSemanticIds(d, { limit: 2 }).map((row) => row.id), ['alpha@1', 'alpha@2']);
  assert.deepEqual(listSemanticIds(d, { limit: 0 }), []);
  assert.deepEqual(listSemanticIds(d, { kind: 'capability' }), []);
  assert.equal(listSemanticIds(d, { limit: 9999 }).length, 4);
});

test('14. malformed input never throws', () => {
  const d = db();
  for (const bad of [null, undefined, {}, { id: null }]) {
    const res = registerSemanticId(d, bad);
    assert.equal(res.ok, false);
    assert.equal(typeof res.reason, 'string');
  }
  assert.deepEqual(registerSemanticId(null, { id: 'widget@1', kind: 'type' }),
    { ok: false, id: 'widget@1', status: null, reason: 'unavailable' });
  assert.equal(promoteSemanticId(null, null, null).reason, 'owner_confirmation_required');
  assert.equal(deprecateSemanticId(null, null, null).reason, 'owner_confirmation_required');
  assert.equal(getSemanticId(null, null), null);
  assert.deepEqual(listSemanticIds(null), []);
  assert.deepEqual(listSemanticIds(null, null), []);
  assert.equal(registerSemanticAlias(d, null).reason, 'invalid_alias');
  assert.deepEqual(listSemanticAliases(null), []);
  assert.equal(resolveSemanticAlias(null, 'x', null).status, 'not_found');
  assert.equal(linkSemanticSource(d, null).reason, 'invalid_link');
  assert.equal(linkSemanticSource(null, { semanticId: 'widget@1', path: 'a.mjs' }).reason, 'unavailable');
  assert.deepEqual(listSemanticLinks(null), []);
  assert.deepEqual(listSemanticLinks(d, null), []);
  const drift = detectSemanticDrift(null, null);
  assert.ok(Array.isArray(drift));
  assert.equal(drift.checked, 0);
});

test('15. the migration adds the registry tables to a file database and is idempotent', (t) => {
  const f = fixture(t);
  const path = join(f.root, 'index.db');
  const tables = ['semantic_alias', 'semantic_id', 'semantic_link', 'wiki_program_version'];
  const first = openDb(path);
  const names = first.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name);
  first.close();
  for (const name of tables) assert.ok(names.includes(name), name);
  const second = openDb(path);
  assert.equal(second.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get().value, '1');
  assert.equal(second.prepare('SELECT COUNT(*) AS n FROM semantic_id').get().n, 0);
  second.close();
});

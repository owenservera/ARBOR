// hq/test/kb-query-capability.test.mjs — capability documents in the unified KB read model.
// The capability registry is additive: kbQuery must surface package documents when the
// tables exist, and degrade to the previous behaviour when they do not.
import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openMemoryDb } from '../lib/schema.mjs';
import { kbHealth, kbQuery } from '../lib/kb.mjs';

const AT = '2026-01-01T00:00:00.000Z';
const HASH = 'f'.repeat(64);

const CAPABILITY_PATH = 'node_modules/demo-pkg/README.md';
const BODY = 'Demo package. This template engine renders templates with a small API.';

function insertCapabilityDocument(db, row = {}) {
  const sourceId = row.sourceId ?? 'demo-source';
  const path = row.path ?? CAPABILITY_PATH;
  const title = row.title ?? 'Demo template engine';
  const body = row.body ?? BODY;
  db.prepare(`INSERT INTO capability_document
    (id, source_id, install_path, path, kind, title, body, sha256, bytes, lines, lang, authority, observed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    row.id ?? `${sourceId}:${path}`, sourceId, row.installPath ?? 'node_modules/demo-pkg', path,
    row.kind ?? 'docs', title, body, HASH, Buffer.byteLength(body), 1, 'markdown', 'candidate', AT,
  );
  db.prepare(`INSERT INTO capability_document_fts (source_id, install_path, path, kind, title, body)
    VALUES (?, ?, ?, ?, ?, ?)`).run(
    sourceId, row.installPath ?? 'node_modules/demo-pkg', path, row.kind ?? 'docs', title, body,
  );
}

function insertProject(db, name = 'demo') {
  const root = mkdtempSync(join(tmpdir(), 'hq-kb-cap-'));
  const info = db.prepare('INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)')
    .run(name, root, AT);
  return { root, projectId: Number(info.lastInsertRowid) };
}

function insertDocument(db, projectId, path, title) {
  db.prepare(`INSERT INTO documents(project_id, path, family, family_name, role, authority,
      lifecycle, origin_type, title, owner, hash, mtime_ms, last_verified, binds_to)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    projectId, path, '00', 'Source', 'note', 'project_observed', 'current', 'repository_file',
    title, null, HASH, 1, AT, null,
  );
}

function withDb(fn) {
  const db = openMemoryDb();
  const { root, projectId } = insertProject(db);
  try {
    return fn({ db, projectId });
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
}

test('kbQuery returns capability documents with kind, snippet and provenance', () => {
  withDb(({ db }) => {
    insertCapabilityDocument(db);

    const results = kbQuery(db, { query: 'template engine' });
    const hit = results.find((entry) => entry.kind === 'capability');
    assert.ok(hit, JSON.stringify(results));
    assert.equal(hit.kind, 'capability');
    assert.equal(hit.source, 'capability_document');
    assert.equal(hit.path, CAPABILITY_PATH);
    assert.equal(hit.install_path, 'node_modules/demo-pkg');
    assert.equal(hit.source_id, 'demo-source');
    assert.equal(hit.title, 'Demo template engine');
    assert.match(hit.snippet, /\[(template|engine)\]/);
    assert.ok(hit.score > 0);

    // The prefixed id is stable and carries the kind.
    assert.equal(hit.id, `capability:demo-source:${CAPABILITY_PATH}`);
  });
});

test('kind filter isolates capability rows and doc rows', () => {
  withDb(({ db, projectId }) => {
    insertCapabilityDocument(db);
    insertDocument(db, projectId, 'DOCS.md', 'Template engine notes');

    const onlyCapability = kbQuery(db, { query: 'template engine', kind: 'capability' });
    assert.ok(onlyCapability.length > 0);
    assert.ok(onlyCapability.every((entry) => entry.kind === 'capability'), JSON.stringify(onlyCapability));

    const onlyDocs = kbQuery(db, { query: 'template engine', kind: 'doc' });
    assert.ok(onlyDocs.length > 0);
    assert.ok(onlyDocs.every((entry) => entry.kind === 'doc'), JSON.stringify(onlyDocs));

    // Aliases resolve to the same kind.
    assert.deepEqual(
      kbQuery(db, { query: 'template engine', kind: 'capabilities' }).map((entry) => entry.id),
      onlyCapability.map((entry) => entry.id),
    );
  });
});

test('a documents row for the same path wins; no duplicate capability row', () => {
  withDb(({ db, projectId }) => {
    insertDocument(db, projectId, CAPABILITY_PATH, 'Template engine guide');
    db.prepare(`INSERT INTO content_fts(rowid, path, content, project, lang)
      VALUES (?, ?, ?, ?, ?)`).run(
      1, CAPABILITY_PATH, 'Template engine guide body', 'demo', 'markdown',
    );
    insertCapabilityDocument(db);

    const results = kbQuery(db, { query: 'template engine' });
    const forPath = results.filter((entry) => entry.id.endsWith(CAPABILITY_PATH));
    assert.equal(forPath.length, 1, JSON.stringify(results));
    assert.equal(forPath[0].kind, 'doc');
    assert.equal(results.some((entry) => entry.kind === 'capability'), false);
  });
});

test('capability results are deterministic, ordered and bounded by limit', () => {
  withDb(({ db }) => {
    insertCapabilityDocument(db, { path: 'node_modules/zeta/README.md', title: 'Zeta template engine' });
    insertCapabilityDocument(db, { path: 'node_modules/alpha/README.md', title: 'Alpha template engine' });

    const first = kbQuery(db, { query: 'template engine', limit: 10 });
    const second = kbQuery(db, { query: 'template engine', limit: 10 });
    assert.deepEqual(first, second);

    const onlyCapability = first.filter((entry) => entry.kind === 'capability');
    assert.equal(onlyCapability.length, 2);

    const limited = kbQuery(db, { query: 'template engine', limit: 1 });
    assert.equal(limited.length, 1);
    assert.equal(kbQuery(db, { query: 'template engine', limit: 0 }).length, 0);
  });
});

test('project filter excludes capability rows with no matching source project', () => {
  withDb(({ db }) => {
    insertCapabilityDocument(db);
    assert.equal(kbQuery(db, { query: 'template engine', project: 'demo' }).length, 0);

    db.prepare(`INSERT INTO capability_source
      (id, project, root, package_manager, lockfile, package_count, file_count, document_count,
       bytes, digest, status, authority, scanned_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'demo-source', 'demo', 'C:/demo', 'npm', 'package-lock.json', 1, 1, 1, 1, HASH, 'candidate', 'candidate', AT,
    );
    const scoped = kbQuery(db, { query: 'template engine', project: 'demo' });
    assert.equal(scoped.length, 1);
    assert.equal(scoped[0].kind, 'capability');
    assert.equal(scoped[0].project, 'demo');
  });
});

test('kbHealth adds capability document and package counts', () => {
  withDb(({ db }) => {
    insertCapabilityDocument(db);
    db.prepare(`INSERT INTO capability_package
      (source_id, name, version, install_path, license, description, main, bin, keywords,
       dep_count, file_count, bytes, integrity, manifest, manifest_digest, manifest_fields,
       lock_entry, status, authority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'demo-source', 'demo-pkg', '1.0.0', 'node_modules/demo-pkg', 'MIT', 'Demo', null, null, null,
      0, 1, 1, null, null, null, 0, null, 'candidate', 'candidate',
    );

    const health = kbHealth(db);
    assert.equal(health.counts.doc, 0); // capability rows never enter KB counts
    assert.deepEqual(health.capability, { documents: 1, packages: 1 });
  });
});

test('a database without capability tables still answers queries and never throws', () => {
  const db = openMemoryDb();
  const { root } = insertProject(db);
  try {
    for (const table of ['capability_document_fts', 'capability_document', 'capability_package', 'capability_source']) {
      db.exec(`DROP TABLE IF EXISTS ${table}`);
    }
    assert.doesNotThrow(() => kbQuery(db, { query: 'template engine' }));
    assert.deepEqual(kbQuery(db, { query: 'template engine' }), []);

    // The KB itself keeps working on the same database.
    const projectId = Number(db.prepare('SELECT id FROM projects LIMIT 1').get().id);
    insertDocument(db, projectId, 'DOCS.md', 'Template engine notes');
    const docs = kbQuery(db, { query: 'template engine' });
    assert.equal(docs.length, 1);
    assert.equal(docs[0].kind, 'doc');

    const health = kbHealth(db);
    assert.equal(health.capability, undefined);
    assert.equal(health.counts.doc, 1);
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});

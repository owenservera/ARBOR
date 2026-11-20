# File: hq/test/kb-query-capability.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/kb-query-capability.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8837 B |
| Lines | 199 |
| Hash | bfdda534486d |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AT | const | 12 | no | const AT = &#39;2026-01-01T00:00:00.000Z&#39;; |
| HASH | const | 13 | no | const HASH = &#39;f&#39;.repeat(64); |
| CAPABILITY_PATH | const | 15 | no | const CAPABILITY_PATH = &#39;node_modules/demo-pkg/README.md&#39;; |
| BODY | const | 16 | no | const BODY = &#39;Demo package. This template engine renders templates with a small API.&#39;; |
| insertCapabilityDocument | function | 18 | no | function insertCapabilityDocument(db, row = {}) { |
| sourceId | const | 19 | no | const sourceId = row.sourceId ?? &#39;demo-source&#39;; |
| path | const | 20 | no | const path = row.path ?? CAPABILITY_PATH; |
| title | const | 21 | no | const title = row.title ?? &#39;Demo template engine&#39;; |
| body | const | 22 | no | const body = row.body ?? BODY; |
| insertProject | function | 35 | no | function insertProject(db, name = &#39;demo&#39;) { |
| root | const | 36 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq-kb-cap-&#39;)); |
| info | const | 37 | no | const info = db.prepare(&#39;INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)&#39;) |
| insertDocument | function | 42 | no | function insertDocument(db, projectId, path, title) { |
| withDb | function | 51 | no | function withDb(fn) { |
| db | const | 52 | no | const db = openMemoryDb(); |
| results | const | 66 | no | const results = kbQuery(db, { query: &#39;template engine&#39; }); |
| hit | const | 67 | no | const hit = results.find((entry) =&gt; entry.kind === &#39;capability&#39;); |
| onlyCapability | const | 88 | no | const onlyCapability = kbQuery(db, { query: &#39;template engine&#39;, kind: &#39;capability&#39; }); |
| onlyDocs | const | 92 | no | const onlyDocs = kbQuery(db, { query: &#39;template engine&#39;, kind: &#39;doc&#39; }); |
| results | const | 113 | no | const results = kbQuery(db, { query: &#39;template engine&#39; }); |
| forPath | const | 114 | no | const forPath = results.filter((entry) =&gt; entry.id.endsWith(CAPABILITY_PATH)); |
| first | const | 126 | no | const first = kbQuery(db, { query: &#39;template engine&#39;, limit: 10 }); |
| second | const | 127 | no | const second = kbQuery(db, { query: &#39;template engine&#39;, limit: 10 }); |
| onlyCapability | const | 130 | no | const onlyCapability = first.filter((entry) =&gt; entry.kind === &#39;capability&#39;); |
| limited | const | 133 | no | const limited = kbQuery(db, { query: &#39;template engine&#39;, limit: 1 }); |
| scoped | const | 150 | no | const scoped = kbQuery(db, { query: &#39;template engine&#39;, project: &#39;demo&#39; }); |
| health | const | 169 | no | const health = kbHealth(db); |
| db | const | 176 | no | const db = openMemoryDb(); |
| projectId | const | 186 | no | const projectId = Number(db.prepare(&#39;SELECT id FROM projects LIMIT 1&#39;).get().id); |
| docs | const | 188 | no | const docs = kbQuery(db, { query: &#39;template engine&#39; }); |
| health | const | 192 | no | const health = kbHealth(db); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 4 | external |
| node:assert/strict | import | 5 | external |
| node:fs | import | 6 | external |
| node:os | import | 7 | external |
| node:path | import | 8 | external |
| ../lib/schema.mjs | import | 9 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/kb.mjs | import | 10 | [hq/lib/kb.mjs](../lib/kb.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 200 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

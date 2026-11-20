# File: hq/test/foundation.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/foundation.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5527 B |
| Lines | 115 |
| Hash | 351a1260dff8 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| db | const | 14 | no | const db = openMemoryDb(); |
| names | const | 15 | no | const names = db.prepare(&quot;SELECT name FROM sqlite_master WHERE type IN (&#39;table&#39;,&#39;view&#39;) ORDER BY name&quot;) |
| version | const | 23 | no | const version = db.prepare(&quot;SELECT value FROM meta WHERE key=&#39;schema_version&#39;&quot;).get(); |
| db | const | 28 | no | const db = openMemoryDb(); |
| db | const | 37 | no | const db = openMemoryDb(); |
| rows | const | 40 | no | const rows = db.prepare(&quot;SELECT path FROM content_fts WHERE content_fts MATCH ?&quot;).all(&#39;createUserService&#39;); |
| root | const | 79 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq-foundation-&#39;)); |
| entries | const | 87 | no | const entries = discoverFiles(root, { useGit: false, maxFileBytes: 1000 }); |
| rels | const | 88 | no | const rels = entries.map((e) =&gt; e.rel).sort(); |
| root | const | 96 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq-reg-&#39;)); |
| projectDir | const | 98 | no | const projectDir = join(root, &#39;harvest&#39;, &#39;demo&#39;); |
| data | const | 103 | no | const data = loadProjects(root); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| node:fs | import | 4 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| ../lib/schema.mjs | import | 7 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/util.mjs | import | 8 | [hq/lib/util.mjs](../lib/util.mjs.md) |
| ../lib/lang.mjs | import | 9 | [hq/lib/lang.mjs](../lib/lang.mjs.md) |
| ../lib/walk.mjs | import | 10 | [hq/lib/walk.mjs](../lib/walk.mjs.md) |
| ../lib/registry.mjs | import | 11 | [hq/lib/registry.mjs](../lib/registry.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/foundation.test.mjs — schema, util, lang, registry invariants.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openMemoryDb, transaction, SCHEMA_VERSION } from '../lib/schema.mjs';
import { digestOf, canonicalJson, tokenize, globToRegExp, toPosix } from '../lib/util.mjs';
import { detectLang, isTestPath, isGeneratedPath, componentOf } from '../lib/lang.mjs';
import { discoverFiles } from '../lib/walk.mjs';
import { registerProject, loadProjects, findProject } from '../lib/registry.mjs';

test('schema creates every expected table', () => {
  const db = openMemoryDb();
  const names = db.prepare("SELECT name FROM sqlite_master WHERE type IN ('table','view') ORDER BY name")
    .all().map((r) => r.name);
  for (const expected of [
    'meta', 'projects', 'files', 'symbols', 'imports', 'commits', 'commit_files',
    'events', 'instructions', 'notes', 'receipts', 'annotations', 'wiki_pages', 'content_fts',
  ]) {
    assert.ok(names.includes(expected), `missing table ${expected}`);
  }
  const version = db.prepare("SELECT value FROM meta WHERE key='schema_version'").get();
  assert.equal(Number(version.value), SCHEMA_VERSION);
});

test('transaction rolls back on throw', () => {
  const db = openMemoryDb();
  assert.throws(() => transaction(db, () => {
    db.prepare('INSERT INTO projects(name,path,added_at) VALUES (?,?,?)').run('x', 'C:/x', '2026-01-01T00:00:00Z');
    throw new Error('boom');
  }));
  assert.equal(db.prepare('SELECT count(*) c FROM projects').get().c, 0);
});

test('fts5 indexes and searches identifiers', () => {
  const db = openMemoryDb();
  db.prepare('INSERT INTO content_fts(rowid,path,content,project,lang) VALUES (?,?,?,?,?)')
    .run(1, 'src/user_service.mjs', 'export function createUserService(){ return fetchUserProfile() }', 'demo', 'javascript');
  const rows = db.prepare("SELECT path FROM content_fts WHERE content_fts MATCH ?").all('createUserService');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].path, 'src/user_service.mjs');
});

test('canonical digests are key-order independent', () => {
  assert.equal(digestOf({ b: 2, a: [1, { z: 1, y: 2 }] }), digestOf({ a: [1, { y: 2, z: 1 }], b: 2 }));
  assert.equal(canonicalJson({ b: 1, a: 2 }), '{\n  "a": 2,\n  "b": 1\n}\n');
});

test('tokenize is deterministic and deduped', () => {
  assert.deepEqual(tokenize('The user-service uses UserService, the user-service!'), [
    'the', 'user-service', 'userservice', 'uses',
  ]);
});

test('glob matching handles **, *, and braces', () => {
  assert.ok(globToRegExp('src/**/*.mjs').test('src/lib/deep/x.mjs'));
  assert.ok(!globToRegExp('src/*.mjs').test('src/lib/x.mjs'));
  assert.ok(globToRegExp('**/*.{md,mdx}').test('README.md'));
  assert.ok(globToRegExp('**/*.{md,mdx}').test('docs/x.mdx'));
});

test('language and path classification', () => {
  assert.deepEqual(detectLang('a/b/c.tsx'), { lang: 'typescript', kind: 'source', ext: '.tsx' });
  assert.equal(detectLang('README.md').kind, 'doc');
  assert.equal(detectLang('package.json').kind, 'config');
  assert.equal(detectLang('logo.png').kind, 'binary');
  assert.ok(isTestPath('test/x.test.mjs'));
  assert.ok(isTestPath('src/__tests__/x.js'));
  assert.ok(!isTestPath('src/contest.mjs'));
  assert.ok(isGeneratedPath('node_modules/x/index.js'));
  assert.ok(isGeneratedPath('dist/app.min.js'));
  assert.equal(componentOf('apps/vivim-host/server.mjs'), 'vivim-host');
  assert.equal(componentOf('harness/src/x.mjs'), 'harness');
  assert.equal(componentOf('README.md'), 'root');
});

test('discoverFiles walks a non-git project and skips ignored/binary/large', () => {
  const root = mkdtempSync(join(tmpdir(), 'hq-foundation-'));
  try {
```

_First 80 of 116 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

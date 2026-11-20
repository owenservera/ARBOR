# File: hq/test/wiki-program.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/wiki-program.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 19299 B |
| Lines | 431 |
| Hash | cd18fc5cd626 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WIKI_PROGRAM_DDL | const | 16 | no | const WIKI_PROGRAM_DDL = ` CREATE TABLE IF NOT EXISTS wiki_program_version ( id TEXT NOT NULL, version INTEGER NOT NULL, config TEXT NOT NULL, status TEXT NOT NULL, |
| memoryDb | function | 28 | no | function memoryDb() { |
| db | const | 29 | no | const db = openMemoryDb(); |
| count | function | 34 | no | const count = (db) =&gt; Number(db.prepare(&#39;SELECT COUNT(*) AS n FROM wiki_program_version&#39;).get().n); |
| baseConfig | function | 36 | no | function baseConfig() { |
| codesOf | function | 52 | no | const codesOf = (result) =&gt; result.errors.map((error) =&gt; error.code); |
| pathsOf | function | 53 | no | const pathsOf = (result) =&gt; result.errors.map((error) =&gt; error.path); |
| result | const | 57 | no | const result = validateProgramConfig(baseConfig()); |
| top | const | 72 | no | const top = validateProgramConfig({ ...baseConfig(), theme: &#39;dark&#39; }); |
| nested | const | 77 | no | const nested = validateProgramConfig({ ...baseConfig(), filters: { kind: &#39;source&#39;, bogus: &#39;x&#39; }, }); |
| finding | const | 82 | no | const finding = nested.errors.find((error) =&gt; error.code === &#39;unknown_key&#39;); |
| top | const | 90 | no | const top = validateProgramConfig({ ...baseConfig(), [key]: &#39;x&#39; }); |
| nested | const | 95 | no | const nested = validateProgramConfig({ ...baseConfig(), layout: { ...baseConfig().layout, [key]: &#39;x&#39; } }); |
| shell | const | 104 | no | const shell = validateProgramConfig({ ...baseConfig(), project: &#39;shell&#39; }); |
| url | const | 108 | no | const url = validateProgramConfig({ ...baseConfig(), filters: { query: &#39;http://x&#39; } }); |
| evil | const | 112 | no | const evil = validateProgramConfig({ ...baseConfig(), selection: { ...baseConfig().selection, strategy: &#39;eval&#39; } }); |
| result | const | 120 | no | const result = validateProgramConfig({ ...baseConfig(), project: value }); |
| badId | const | 129 | no | const badId = validateProgramConfig({ ...baseConfig(), id: &#39;Bad Id&#39; }); |
| badVersion | const | 134 | no | const badVersion = validateProgramConfig({ ...baseConfig(), version: 0 }); |
| badSource | const | 138 | no | const badSource = validateProgramConfig({ ...baseConfig(), source: &#39;filesystem&#39; }); |
| result | const | 146 | no | const result = validateProgramConfig({ theme: &#39;x&#39;, send: &#39;now&#39;, filters: { bogus: &#39;y&#39;, shell: &#39;z&#39; }, source: &#39;filesystem&#39;, |
| sorted | const | 155 | no | const sorted = [...result.errors].sort((a, b) =&gt; ( a.path &lt; b.path ? -1 : a.path &gt; b.path ? 1 : a.code &lt; b.code ? -1 : a.code &gt; b.code ? 1 : 0 )); |
| a | const | 167 | no | const a = { |
| b | const | 173 | no | const b = { |
| db | const | 186 | no | const db = memoryDb(); |
| preview | const | 187 | no | const preview = previewProgram(db, baseConfig()); |
| position | const | 197 | no | const position = new Map(preview.plan.order.map((id, index) =&gt; [id, index])); |
| db | const | 218 | no | const db = memoryDb(); |
| before | const | 219 | no | const before = count(db); |
| first | const | 220 | no | const first = previewProgram(db, baseConfig()); |
| second | const | 221 | no | const second = previewProgram(db, baseConfig()); |
| after | const | 222 | no | const after = count(db); |
| db | const | 231 | no | const db = memoryDb(); |
| active | const | 232 | no | const active = { |
| next | const | 240 | no | const next = { |
| preview | const | 247 | no | const preview = previewProgram(db, next); |
| db | const | 259 | no | const db = memoryDb(); |
| refused | const | 260 | no | const refused = activateProgram(db, baseConfig()); |
| explicitFalse | const | 264 | no | const explicitFalse = activateProgram(db, baseConfig(), { ownerConfirmed: false }); |
| db | const | 271 | no | const db = memoryDb(); |
| receipt | const | 272 | no | const receipt = { kind: &#39;wiki-program&#39;, sources: [], digest: &#39;abc&#39; }; |
| result | const | 273 | no | const result = activateProgram(db, baseConfig(), { ownerConfirmed: true, receipt }); |
| row | const | 281 | no | const row = db.prepare(&#39;SELECT * FROM wiki_program_version WHERE id = ? AND version = ?&#39;) |
| active | const | 290 | no | const active = getActiveProgram(db, &#39;project-overview&#39;); |
| db | const | 301 | no | const db = memoryDb(); |
| second | const | 303 | no | const second = activateProgram(db, { ...baseConfig(), layout: { columns: [&#39;path&#39;] } }, { ownerConfirmed: true }); |
| versions | const | 309 | no | const versions = listProgramVersions(db, { id: &#39;project-overview&#39; }); |
| db | const | 319 | no | const db = memoryDb(); |
| v1 | const | 320 | no | const v1 = baseConfig(); |
| v2 | const | 321 | no | const v2 = { ...baseConfig(), layout: { columns: [&#39;path&#39;], depth: 4 }, selection: { mode: &#39;top&#39;, limit: 5 } }; |
| rolled | const | 325 | no | const rolled = rollbackProgram(db, { id: &#39;project-overview&#39;, toVersion: 1, ownerConfirmed: true }); |
| versions | const | 334 | no | const versions = listProgramVersions(db, { id: &#39;project-overview&#39; }); |
| db | const | 346 | no | const db = memoryDb(); |
| before | const | 348 | no | const before = count(db); |
| missing | const | 349 | no | const missing = rollbackProgram(db, { id: &#39;project-overview&#39;, toVersion: 99, ownerConfirmed: true }); |
| unknownId | const | 351 | no | const unknownId = rollbackProgram(db, { id: &#39;nope&#39;, toVersion: 1, ownerConfirmed: true }); |
| db | const | 358 | no | const db = memoryDb(); |
| before | const | 360 | no | const before = count(db); |
| db | const | 372 | no | const db = memoryDb(); |
| all | const | 378 | no | const all = listProgramVersions(db); |
| limited | const | 384 | no | const limited = listProgramVersions(db, { limit: 2 }); |
| db | const | 393 | no | const db = memoryDb(); |
| result | const | 396 | no | const result = validateProgramConfig(value); |
| previewed | const | 402 | no | const previewed = previewProgram(db, null); |
| db | const | 425 | no | const db = memoryDb(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 6 | external |
| node:assert/strict | import | 7 | external |
| ../lib/schema.mjs | import | 8 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/wiki-program.mjs | import | 9 | [hq/lib/wiki-program.mjs](../lib/wiki-program.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 432 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

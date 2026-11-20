# File: hq/test/capability-surfaces.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/capability-surfaces.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8424 B |
| Lines | 208 |
| Hash | 7500004c856f |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AT | const | 19 | no | const AT = &#39;2026-11-03T00:00:00.000Z&#39;; |
| SOURCE_ID | const | 20 | no | const SOURCE_ID = &#39;fixture-cap&#39;; |
| fixtureTree | function | 24 | no | function fixtureTree() { |
| root | const | 25 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq-cap-surface-&#39;)); |
| write | function | 26 | no | const write = (rel, content) =&gt; { |
| abs | const | 27 | no | const abs = join(root, rel); |
| withFixture | function | 59 | no | function withFixture(fn) { |
| root | const | 60 | no | const root = fixtureTree(); |
| fixtureScan | function | 68 | no | function fixtureScan(root) { |
| scannedDb | function | 77 | no | function scannedDb(root) { |
| db | const | 78 | no | const db = openMemoryDb(); |
| workspace | function | 83 | no | function workspace() { |
| readPage | function | 87 | no | function readPage(dir, name) { |
| ws | const | 92 | no | const ws = workspace(); |
| db | const | 93 | no | const db = scannedDb(tree); |
| result | const | 95 | no | const result = buildWiki({ db, root: ws, projects: [], outDir: join(ws, &#39;wiki&#39;), force: true }); |
| page | const | 99 | no | const page = readPage(join(ws, &#39;wiki&#39;), &#39;capabilities.md&#39;); |
| ws | const | 126 | no | const ws = workspace(); |
| db | const | 127 | no | const db = scannedDb(tree); |
| page | const | 136 | no | const page = readPage(join(ws, &#39;wiki&#39;), &#39;capabilities.md&#39;); |
| ws | const | 147 | no | const ws = workspace(); |
| db | const | 148 | no | const db = scannedDb(tree); |
| one | const | 152 | no | const one = readPage(join(ws, &#39;one&#39;), &#39;capabilities.md&#39;); |
| two | const | 153 | no | const two = readPage(join(ws, &#39;two&#39;), &#39;capabilities.md&#39;); |
| db | const | 162 | no | const db = scannedDb(tree); |
| status | const | 164 | no | const status = capabilityStatus(db); |
| html | const | 165 | no | const html = renderHome({ capabilities: status }); |
| hidden | const | 173 | no | const hidden = renderHome({}); |
| unavailable | const | 175 | no | const unavailable = renderHome({ capabilities: { available: false, sources: 1 } }); |
| ws | const | 183 | no | const ws = workspace(); |
| db | const | 184 | no | const db = openMemoryDb(); |
| result | const | 197 | no | const result = buildWiki({ db, root: ws, projects: [], outDir: join(ws, &#39;wiki&#39;), force: true }); |
| page | const | 199 | no | const page = readPage(join(ws, &#39;wiki&#39;), &#39;capabilities.md&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 3 | external |
| node:assert/strict | import | 4 | external |
| node:fs | import | 5 | external |
| node:os | import | 6 | external |
| node:path | import | 7 | external |
| ../lib/schema.mjs | import | 8 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/wiki.mjs | import | 9 | [hq/lib/wiki.mjs](../lib/wiki.mjs.md) |
| ../lib/home.mjs | import | 10 | [hq/lib/home.mjs](../lib/home.mjs.md) |
| ../lib/capabilities.mjs | import | 11 | [hq/lib/capabilities.mjs](../lib/capabilities.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/capability-surfaces.test.mjs — wiki and home projections of the
// capability registry: candidates only, escaped, deterministic, and optional.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { openMemoryDb } from '../lib/schema.mjs';
import { buildWiki } from '../lib/wiki.mjs';
import { renderHome } from '../lib/home.mjs';
import {
  capabilityStatus,
  loadContracts,
  loadTaxonomy,
  persistCapabilityScan,
  scanCapabilitySource,
} from '../lib/capabilities.mjs';

const AT = '2026-11-03T00:00:00.000Z';
const SOURCE_ID = 'fixture-cap';

// Minimal npm v3 tree. `glob-fixture` matches the discovery.glob taxonomy rule
// through its name, description and keywords; `other` matches nothing.
function fixtureTree() {
  const root = mkdtempSync(join(tmpdir(), 'hq-cap-surface-'));
  const write = (rel, content) => {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  };
  write('package-lock.json', JSON.stringify({
    name: 'fixture-root',
    version: '1.0.0',
    lockfileVersion: 3,
    requires: true,
    packages: {
      '': { name: 'fixture-root', version: '1.0.0', dependencies: { 'glob-fixture': '^1.0.0' } },
      'node_modules/glob-fixture': { version: '1.0.0', license: 'MIT', integrity: 'sha512-aaa', dependencies: { other: '^2.0.0' } },
      'node_modules/glob-fixture/node_modules/other': { version: '2.0.0', license: 'ISC', integrity: 'sha512-bbb' },
    },
  }, null, 2));
  write('node_modules/glob-fixture/package.json', JSON.stringify({
    name: 'glob-fixture',
    version: '1.0.0',
    description: 'Glob pattern matcher for fixture paths',
    main: 'index.js',
    license: 'MIT',
    keywords: ['glob', 'pattern'],
    dependencies: { other: '^2.0.0' },
  }, null, 2));
  write('node_modules/glob-fixture/README.md', '# Glob fixture\n\nDemonstrates glob pattern matching across fixture paths.\n');
  write('node_modules/glob-fixture/index.js', "module.exports = { glob: true };\n");
  write('node_modules/glob-fixture/node_modules/other/package.json', JSON.stringify({
    name: 'other', version: '2.0.0', license: 'ISC', description: 'Nested dependency',
  }, null, 2));
  return root;
}

function withFixture(fn) {
  const root = fixtureTree();
  try {
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function fixtureScan(root) {
  return scanCapabilitySource(root, {
    id: SOURCE_ID,
    now: AT,
    taxonomy: loadTaxonomy(),
    contracts: loadContracts(),
  });
}

function scannedDb(root) {
  const db = openMemoryDb();
  persistCapabilityScan(db, fixtureScan(root));
  return db;
```

_First 80 of 209 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

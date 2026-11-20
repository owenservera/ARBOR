# File: hq/test/walk.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/walk.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1984 B |
| Lines | 55 |
| Hash | 26dacb27fd66 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fixture | function | 9 | no | function fixture(files) { |
| dir | const | 10 | no | const dir = mkdtempSync(join(tmpdir(), &#39;hq-walk-test-&#39;)); |
| full | const | 12 | no | const full = join(dir, rel); |
| rels | function | 19 | no | function rels(dir, opts) { |
| dir | const | 24 | no | const dir = fixture({ &#39;a.log&#39;: &#39;x&#39;, &#39;b.txt&#39;: &#39;y&#39;, &#39;sub/c.log&#39;: &#39;z&#39; }); |
| got | const | 26 | no | const got = rels(dir, { extraIgnores: [&#39;*.log&#39;] }); |
| dir | const | 36 | no | const dir = fixture({ &#39;a.log&#39;: &#39;x&#39;, &#39;b.txt&#39;: &#39;y&#39; }); |
| got | const | 38 | no | const got = rels(dir, { extraIgnores: [&#39;b.txt&#39;] }); |
| dir | const | 47 | no | const dir = fixture({ &#39;logs/server.log&#39;: &#39;x&#39;, &#39;keep.txt&#39;: &#39;y&#39; }); |
| got | const | 49 | no | const got = rels(dir, { extraIgnores: [&#39;logs&#39;] }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| node:path | import | 4 | external |
| node:fs | import | 5 | external |
| node:os | import | 6 | external |
| ../lib/walk.mjs | import | 7 | [hq/lib/walk.mjs](../lib/walk.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/walk.test.mjs — extraIgnores honours glob patterns.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { discoverFiles } from '../lib/walk.mjs';

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'hq-walk-test-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(join(dir, rel.split('/').slice(0, -1).join('/')), { recursive: true });
    writeFileSync(full, content ?? 'x', 'utf8');
  }
  return dir;
}

function rels(dir, opts) {
  return discoverFiles(dir, { useGit: false, ...opts }).map((e) => e.rel).sort();
}

test('extraIgnores glob excludes matching files anywhere in the tree', () => {
  const dir = fixture({ 'a.log': 'x', 'b.txt': 'y', 'sub/c.log': 'z' });
  try {
    const got = rels(dir, { extraIgnores: ['*.log'] });
    assert.equal(got.includes('a.log'), false);
    assert.equal(got.includes('sub/c.log'), false);
    assert.equal(got.includes('b.txt'), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('extraIgnores exact name still works', () => {
  const dir = fixture({ 'a.log': 'x', 'b.txt': 'y' });
  try {
    const got = rels(dir, { extraIgnores: ['b.txt'] });
    assert.equal(got.includes('b.txt'), false);
    assert.equal(got.includes('a.log'), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('extraIgnores directory name prunes the whole tree', () => {
  const dir = fixture({ 'logs/server.log': 'x', 'keep.txt': 'y' });
  try {
    const got = rels(dir, { extraIgnores: ['logs'] });
    assert.equal(got.includes('logs/server.log'), false);
    assert.equal(got.includes('keep.txt'), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

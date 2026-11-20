# File: hq/test/registry.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/registry.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2197 B |
| Lines | 56 |
| Hash | 35a5b535e705 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| dir | const | 10 | no | const dir = mkdtempSync(join(tmpdir(), &#39;hq-registry-test-&#39;)); |
| cfg | const | 14 | no | const cfg = loadConfig(dir); |
| dir | const | 26 | no | const dir = mkdtempSync(join(tmpdir(), &#39;hq-registry-test-&#39;)); |
| cfg | const | 28 | no | const cfg = loadConfig(dir); |
| root | const | 36 | no | const root = process.cwd(); |
| root | const | 41 | no | const root = process.cwd(); |
| child | const | 42 | no | const child = join(root, &#39;hq&#39;, &#39;lib&#39;, &#39;registry.mjs&#39;); |
| root | const | 47 | no | const root = process.cwd(); |
| external | const | 48 | no | const external = resolve(&#39;/&#39;, &#39;tmp&#39;, &#39;external&#39;); |
| root | const | 53 | no | const root = process.cwd(); |
| abs | const | 54 | no | const abs = resolveProjectPath(root, &#39;hq/lib/registry.mjs&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| ../lib/registry.mjs | import | 4 | [hq/lib/registry.mjs](../lib/registry.mjs.md) |
| node:path | import | 5 | external |
| node:fs | import | 6 | external |
| node:os | import | 7 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/registry.test.mjs — loadConfig deep merge and storedPath.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, defaultConfig, storedPath, resolveProjectPath } from '../lib/registry.mjs';
import { join, resolve } from 'node:path';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

test('loadConfig deep-merges nested defaults', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hq-registry-test-'));
  try {
    mkdirSync(join(dir, '.hq'), { recursive: true });
    writeFileSync(join(dir, '.hq', 'config.json'), JSON.stringify({ performance: { profile: 'x' } }), 'utf8');
    const cfg = loadConfig(dir);
    assert.equal(cfg.performance.profile, 'x');
    assert.ok(cfg.performance.limits);
    assert.equal(cfg.performance.limits.search, 20);
    assert.ok(cfg.performance.weights);
    assert.equal(cfg.performance.weights.speed, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('loadConfig returns defaults when no config file exists', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hq-registry-test-'));
  try {
    const cfg = loadConfig(dir);
    assert.deepEqual(cfg, defaultConfig());
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('storedPath returns "." for the workspace root itself', () => {
  const root = process.cwd();
  assert.equal(storedPath(root, root), '.');
});

test('storedPath returns a relative path for a child of the workspace', () => {
  const root = process.cwd();
  const child = join(root, 'hq', 'lib', 'registry.mjs');
  assert.equal(storedPath(root, child), 'hq/lib/registry.mjs');
});

test('storedPath returns an absolute path for an external path', () => {
  const root = process.cwd();
  const external = resolve('/', 'tmp', 'external');
  assert.equal(storedPath(root, external), external);
});

test('resolveProjectPath resolves a relative stored path', () => {
  const root = process.cwd();
  const abs = resolveProjectPath(root, 'hq/lib/registry.mjs');
  assert.equal(abs, resolve(root, 'hq/lib/registry.mjs'));
});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

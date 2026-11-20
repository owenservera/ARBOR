# File: hq/test/git.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/git.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1044 B |
| Lines | 30 |
| Hash | 8db2232128ee |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| dir | const | 14 | no | const dir = mkdtempSync(join(tmpdir(), &#39;hq-git-test-&#39;)); |
| dir | const | 23 | no | const dir = mkdtempSync(join(tmpdir(), &#39;hq-git-test-&#39;)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| ../lib/git.mjs | import | 4 | [hq/lib/git.mjs](../lib/git.mjs.md) |
| node:path | import | 5 | external |
| node:fs | import | 6 | external |
| node:os | import | 7 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/git.test.mjs — isGitRepo recognises real git workspaces.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isGitRepo } from '../lib/git.mjs';
import { join } from 'node:path';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

test('isGitRepo returns true in a real git workspace', () => {
  assert.equal(isGitRepo(process.cwd()), true);
});

test('isGitRepo returns false for a plain directory without .git', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hq-git-test-'));
  try {
    assert.equal(isGitRepo(dir), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('isGitRepo returns false for a directory with .git but not a git repo', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hq-git-test-'));
  try {
    writeFileSync(join(dir, '.git'), 'not a git dir');
    assert.equal(isGitRepo(dir), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

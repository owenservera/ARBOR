# File: hq/test/git-context.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/git-context.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1393 B |
| Lines | 33 |
| Hash | 65328d085c6b |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| merged | const | 7 | no | const merged = resolveGitConfig( { context: { commits: 5, dirty: true } }, { context: { commits: 9 } }, ); |
| merged | const | 16 | no | const merged = resolveGitConfig({ includeCommits: 5 }, { includeCommits: 2 }); |
| merged | const | 21 | no | const merged = resolveGitConfig({ github: { repo: &#39;owner/name&#39; } }); |
| merged | const | 27 | no | const merged = resolveGitConfig({ includeDirty: undefined }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| ../lib/git-context.mjs | import | 4 | [hq/lib/git-context.mjs](../lib/git-context.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/git-context.test.mjs — resolveGitConfig merges layers key by key.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveGitConfig, DEFAULT_GIT_CONFIG } from '../lib/git-context.mjs';

test('a later layer merges into a nested object instead of replacing it', () => {
  const merged = resolveGitConfig(
    { context: { commits: 5, dirty: true } },
    { context: { commits: 9 } },
  );
  assert.equal(merged.context.commits, 9);
  assert.equal(merged.context.dirty, true);
});

test('top-level scalar keys are still replaced by later layers', () => {
  const merged = resolveGitConfig({ includeCommits: 5 }, { includeCommits: 2 });
  assert.equal(merged.includeCommits, 2);
});

test('the github block merges key by key and keeps defaults for unset keys', () => {
  const merged = resolveGitConfig({ github: { repo: 'owner/name' } });
  assert.equal(merged.github.repo, 'owner/name');
  assert.equal(merged.github.cli, DEFAULT_GIT_CONFIG.github.cli);
});

test('undefined values in a layer do not clobber the merged value', () => {
  const merged = resolveGitConfig({ includeDirty: undefined });
  assert.equal(merged.includeDirty, DEFAULT_GIT_CONFIG.includeDirty);
});

test('an unknown protocol still throws', () => {
  assert.throws(() => resolveGitConfig({ protocol: 'nope' }), /unknown git protocol/);
});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

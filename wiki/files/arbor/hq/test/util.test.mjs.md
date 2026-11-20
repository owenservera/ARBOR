# File: hq/test/util.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/util.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 707 B |
| Lines | 19 |
| Hash | 054461b3877e |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

_No symbols._

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| ../lib/util.mjs | import | 4 | [hq/lib/util.mjs](../lib/util.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/util.test.mjs — estimateTokens and globToRegExp.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimateTokens, globToRegExp } from '../lib/util.mjs';

test('estimateTokens returns 0 for empty input', () => {
  assert.equal(estimateTokens(''), 0);
  assert.equal(estimateTokens(null), 0);
  assert.equal(estimateTokens(undefined), 0);
});

test('estimateTokens returns a positive count for non-empty input', () => {
  assert.ok(estimateTokens('hello world') > 0);
});

test('globToRegExp supports character classes', () => {
  assert.ok(globToRegExp('[abc].mjs').test('b.mjs'));
  assert.ok(!globToRegExp('[abc].mjs').test('x.mjs'));
});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

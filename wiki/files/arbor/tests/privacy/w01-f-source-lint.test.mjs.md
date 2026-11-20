# File: tests/privacy/w01-f-source-lint.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | tests/privacy/w01-f-source-lint.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 444 B |
| Lines | 8 |
| Hash | 15bdc13ba799 |
| Test | yes |
| Generated | no |
| Component | tests |

## Symbols

_No symbols._

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:url | import | 3 | external |
| ./w01-f-source-lint.mjs | import | 4 | [tests/privacy/w01-f-source-lint.mjs](./w01-f-source-lint.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {lintSelectedTree} from './w01-f-source-lint.mjs';
test('imported Wave 1F code has no credential-shaped filenames or donor relative imports',()=>{
 for(const p of ['../../contracts','../../capability-spaces','../fixtures/labs'])
   assert.deepEqual(lintSelectedTree(fileURLToPath(new URL(p,import.meta.url))),[]);
});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

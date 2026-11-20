# File: packages/tierflow/tests/fixtures/ts-mini/tests/fail.check.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/fixtures/ts-mini/tests/fail.check.ts |
| Language | TypeScript |
| Kind | source |
| Size | 469 B |
| Lines | 10 |
| Hash | 64ac2dda0011 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

_No symbols._

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 1 | external |
| ../src/sum.ts | import | 2 | [packages/tierflow/tests/fixtures/ts-mini/src/sum.ts](../src/sum.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import { expect, test } from "bun:test";
import { sum } from "../src/sum.ts";

// Deliberately wrong on purpose: this file exists so the executor can prove
// that a failing suite propagates as a non-zero exit code and a "failed"
// run state instead of being swallowed. It is never part of the default
// (green) suite: `bun run test:fail` targets it explicitly.
test("deliberate failure proves failure propagation", () => {
  expect(sum(2, 3)).toBe(6);
});
```

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)

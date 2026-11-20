# File: packages/tierflow/tests/fixtures/ts-mini/tests/sum.check.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/fixtures/ts-mini/tests/sum.check.ts |
| Language | TypeScript |
| Kind | source |
| Size | 280 B |
| Lines | 11 |
| Hash | d1899f116382 |
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

test("sum adds two positive numbers", () => {
  expect(sum(2, 3)).toBe(5);
});

test("sum handles negatives and zero", () => {
  expect(sum(-4, 4)).toBe(0);
  expect(sum(0, 0)).toBe(0);
});
```

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)

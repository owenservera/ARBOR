# File: packages/tierflow/tests/fixtures/ts-mini/README.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/fixtures/ts-mini/README.md |
| Language | Markdown |
| Kind | doc |
| Size | 642 B |
| Lines | 20 |
| Hash | 5cbc11ae65bc |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

````markdown
# ts-mini

A minimal TypeScript/Bun project that has nothing to do with TierFlow.

- no git repository
- no HQ tooling, no `.hq`, no index
- no dependencies, no `node_modules`, no install step
- imports only `bun:test`

Scripts:

```sh
bun run test        # green suite  -> exit 0
bun run test:fail   # red suite    -> exit 1 (failure propagation proof)
```

The test files use a `.check.ts` suffix on purpose. Bun's test discovery only
picks up names containing `.test`, `.spec`, `_test_` or `_spec_`, so the parent
repository's `bun test tests/` never picks these fixtures up; they are invoked
by explicit path instead.
````

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)

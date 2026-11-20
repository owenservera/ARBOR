# File: packages/tierflow/src/coordination/index.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/coordination/index.ts |
| Language | TypeScript |
| Kind | source |
| Size | 285 B |
| Lines | 9 |
| Hash | 66f4f5fc1a7b |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

_No symbols._

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./contract.ts | export_from | 8 | [packages/tierflow/src/coordination/contract.ts](./contract.ts.md) |
| ./poller.ts | export_from | 9 | [packages/tierflow/src/coordination/poller.ts](./poller.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Public surface of the project-neutral coordination layer.
 *
 * The core of TierFlow depends on these shapes only. A provider adapter
 * lives behind `src/adapters/` and is never imported from the tiers.
 */

export * from "./contract.ts";
export * from "./poller.ts";
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

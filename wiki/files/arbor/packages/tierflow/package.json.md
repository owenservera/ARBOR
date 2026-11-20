# File: packages/tierflow/package.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | packages/tierflow/package.json |
| Language | JSON |
| Kind | config |
| Size | 790 B |
| Lines | 21 |
| Hash | e2b0df726a57 |
| Test | no |
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

```json
{
  "name": "@software-hq/tierflow",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "ARBOR-internal source-preserved TierFlow visual renderer, typed commands and projections; no standalone product server",
  "scripts": {
    "test": "bun test tests/visual-runtime",
    "test:visual": "bun test tests/visual-runtime",
    "test:legacy": "bun test tests/",
    "typecheck": "tsc -p tsconfig.json",
    "typecheck:tsgo": "bunx @typescript/native-preview -p tsconfig.json",
    "verify": "bun run typecheck && bun run test:visual",
    "tokens:generate": "bun scripts/generate-host-tokens.mjs"
  },
  "devDependencies": {
    "@typescript/native-preview": "^7.0.0-dev.20260707.2",
    "bun-types": "latest",
    "typescript": "^7.0.2"
  }
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

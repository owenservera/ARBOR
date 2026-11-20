# File: hq/package.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../projects/arbor.md) |
| Path | hq/package.json |
| Language | JSON |
| Kind | config |
| Size | 850 B |
| Lines | 22 |
| Hash | 1b76c2a8f312 |
| Test | no |
| Generated | no |
| Component | hq |

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
  "name": "@arbor/dev-intelligence",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "ARBOR-internal, source-preserving development intelligence package",
  "engines": {
    "node": ">=24"
  },
  "exports": {
    ".": "./lib/arbor-service.mjs"
  },
  "bin": {
    "arbor-hq": "./bin/arbor-hq.mjs"
  },
  "scripts": {
    "test:core": "node --test test/arbor-service.test.mjs test/indexer.test.mjs test/search.test.mjs test/graph.test.mjs test/context.test.mjs test/wiki.test.mjs test/semantic-registry.test.mjs",
    "test:import": "node --test test/in-repo-closure.test.mjs",
    "check:syntax": "node --check lib/arbor-service.mjs && node --check bin/arbor-hq.mjs",
    "test:boundary": "node --test test/arbor-service.test.mjs test/arbor-boundary.test.mjs test/in-repo-closure.test.mjs"
  }
}
```

---

[HQ wiki](../../../index.md) · [Symbols](../../../symbols.md) · [Dependency graph](../../../graph.md) · [Documentation](../../../docs.md) · [Changes](../../../changes.md) · [Open tasks](../../../todos.md) · [Deprecated](../../../deprecated.md) · [Agent annotation protocol](../../../protocol.md) · [Glossary](../../../glossary.md) · [Using HQ](../../../context.md) · [Capabilities](../../../capabilities.md) · [Search index](../../../search.json) · [Browser view](../../../index.html)

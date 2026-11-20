# File: package.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../projects/arbor.md) |
| Path | package.json |
| Language | JSON |
| Kind | config |
| Size | 1261 B |
| Lines | 30 |
| Hash | ea59c1e54016 |
| Test | no |
| Generated | no |
| Component | root |

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
  "name": "arbor-proposal5-beta-workspace",
  "version": "0.1.0",
  "private": true,
  "packageManager": "bun@1.4.4",
  "workspaces": [
    "apps/vivim-host",
    "apps/mobile-relay",
    "studio",
    "harness",
    "hq",
    "packages/tierflow",
    "packages/vec-ui-engines"
  ],
  "engines": {
    "node": ">=24"
  },
  "scripts": {
    "test:host": "node --test apps/vivim-host/test/*.test.mjs",
    "test:hq": "cd hq && node --test test/arbor-service.test.mjs test/arbor-boundary.test.mjs test/in-repo-closure.test.mjs",
    "test:hvi": "node --test tests/hq-version-intelligence/*.test.mjs && node --test apps/vivim-host/test/hvi-capability.test.mjs apps/vivim-host/test/hvi-source-grant.test.mjs && cd hq && node --test test/hvi-mcp-tool.test.mjs",
    "test:gate": "bun scripts/test-gate.mjs",
    "test:gate:plan": "bun scripts/test-gate.mjs --plan",
    "test:gate:all": "bun scripts/test-gate.mjs --all",
    "test:interop": "node --test tests/compatibility/wave1f.test.mjs tests/privacy/w01-f-source-lint.test.mjs",
    "test:mobile": "cd apps/mobile-relay && node --test test/*.test.mjs",
    "test:tierflow": "cd packages/tierflow && bun test tests/visual-runtime",
    "test:rust": "cargo test --workspace"
  }
}
```

---

[HQ wiki](../../index.md) · [Symbols](../../symbols.md) · [Dependency graph](../../graph.md) · [Documentation](../../docs.md) · [Changes](../../changes.md) · [Open tasks](../../todos.md) · [Deprecated](../../deprecated.md) · [Agent annotation protocol](../../protocol.md) · [Glossary](../../glossary.md) · [Using HQ](../../context.md) · [Capabilities](../../capabilities.md) · [Search index](../../search.json) · [Browser view](../../index.html)

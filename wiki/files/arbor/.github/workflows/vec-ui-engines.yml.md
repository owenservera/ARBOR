# File: .github/workflows/vec-ui-engines.yml

> Generated 2026-11-19 · YAML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .github/workflows/vec-ui-engines.yml |
| Language | YAML |
| Kind | config |
| Size | 1371 B |
| Lines | 37 |
| Hash | 486df54c9ef6 |
| Test | no |
| Generated | no |
| Component | .github |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```yaml
name: VEC UI Engine source verification
on:
  pull_request:
    paths:
      - 'packages/vec-ui-engines/**'
      - '.integration/proposal5/vec-ui-engines/**'
      - '.github/workflows/vec-ui-engines.yml'
  workflow_dispatch:
permissions:
  contents: read
jobs:
  verify:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - name: Print actual runtime version
        run: node --version
      - name: Syntax check canonical engine source
        run: |
          node --check packages/vec-ui-engines/src/catalog.mjs
          node --check packages/vec-ui-engines/src/enum-choices.mjs
          node --check packages/vec-ui-engines/src/validators.mjs
          node --check packages/vec-ui-engines/src/tokens.mjs
          node --check packages/vec-ui-engines/src/registry.mjs
          node --check packages/vec-ui-engines/src/compiler.mjs
      - name: Execute actual synthetic engine unit suites
        run: |
          node --test packages/vec-ui-engines/test/engine-core.test.mjs packages/vec-ui-engines/test/tokens.test.mjs packages/vec-ui-engines/test/manifest.test.mjs
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

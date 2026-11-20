# File: .github/workflows/hvi-native-synthetic.yml

> Generated 2026-11-19 · YAML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .github/workflows/hvi-native-synthetic.yml |
| Language | YAML |
| Kind | config |
| Size | 8046 B |
| Lines | 203 |
| Hash | a696c82c1399 |
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
name: ARBOR HVI native synthetic tooling checks

# This job NEVER resolves real user/donor repositories. Source fixtures used
# by the test suite are invented in-tree Git objects and injected adapters.
on:
  push:
    branches:
      - integrate/p5-hq-version-intelligence-r001
    paths:
      - 'hq/version-intelligence/**'
      - 'hq/catalogue-identity/**'
      - 'hq/lib/mcp.mjs'
      - 'hq/lib/schema.mjs'
      - 'hq/test/arbor-service.test.mjs'
      - 'hq/test/hvi-mcp-tool.test.mjs'
      - 'contracts/hq-version-intelligence/**'
      - 'tests/hq-version-intelligence/**'
      - 'apps/vivim-host/control/hvi-capability.mjs'
      - 'apps/vivim-host/control/hvi-source-grant.mjs'
      - 'apps/vivim-host/control/hvi-native-guide.json'
      - 'apps/vivim-host/test/hvi-capability.test.mjs'
      - 'apps/vivim-host/test/hvi-source-grant.test.mjs'
      - 'packages/tierflow/**/hvi-inspector*'
      - 'scripts/**'
      - 'package.json'
      - '.github/workflows/hvi-native-synthetic.yml'
  pull_request:
    branches:
      - main
    paths:
      - 'hq/version-intelligence/**'
      - 'hq/catalogue-identity/**'
      - 'hq/lib/mcp.mjs'
      - 'hq/lib/schema.mjs'
      - 'hq/test/arbor-service.test.mjs'
      - 'hq/test/hvi-mcp-tool.test.mjs'
      - 'contracts/hq-version-intelligence/**'
      - 'tests/hq-version-intelligence/**'
      - 'apps/vivim-host/control/hvi-capability.mjs'
      - 'apps/vivim-host/control/hvi-source-grant.mjs'
      - 'apps/vivim-host/control/hvi-native-guide.json'
      - 'apps/vivim-host/test/hvi-capability.test.mjs'
      - 'apps/vivim-host/test/hvi-source-grant.test.mjs'
      - 'packages/tierflow/**/hvi-inspector*'
      - 'scripts/**'
      - 'package.json'
      - '.github/workflows/hvi-native-synthetic.yml'
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: hvi-synthetic-${{ github.ref }}
  cancel-in-progress: false

jobs:
  source-only-synthetic:
    name: Node24 HVI synthetic fixtures (no actual donor scans)
    runs-on: ubuntu-latest
    timeout-minutes: 20
    env:
      CI: 'true'
      HVI_NO_REAL_CORPUS: '1'
    steps:
      - name: Checkout approved candidate source only
        uses: actions/checkout@v4
        with:
          persist-credentials: false
      - name: Install Node 24
        uses: actions/setup-node@v4
        with:
          node-version: '24'
      - name: Record toolchain
        shell: bash
        run: |
          set -euo pipefail
          node --version
          npm --version
          git rev-parse HEAD
```

_First 80 of 204 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

# File: .github/workflows/pwa-main.yml

> Generated 2026-11-19 · YAML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .github/workflows/pwa-main.yml |
| Language | YAML |
| Kind | config |
| Size | 1641 B |
| Lines | 45 |
| Hash | e032d1be532d |
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
name: PWA-first main smoke checks
on:
  push:
    branches: [main]
    paths:
      - 'apps/mobile-relay/**'
      - 'apps/vivim-host/**'
      - '.github/workflows/pwa-main.yml'
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: pwa-main-${{ github.ref }}
  cancel-in-progress: true

jobs:
  pwa-source-and-contracts:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - name: Runtime identity and source syntax
        run: |
          node --version
          node --check apps/vivim-host/server.mjs
          node --check apps/vivim-host/direct-phone.mjs
          node --check apps/mobile-relay/app.js
          node --check apps/mobile-relay/control-client.mjs
          node --check apps/mobile-relay/build-canvas.mjs
          node --check apps/mobile-relay/build-composer.mjs
          node --check apps/mobile-relay/vec/compiler.mjs
          node --check apps/mobile-relay/vec/ui-adapter.mjs
          node --check apps/mobile-relay/sw.js
          node --check apps/vivim-host/media/playback.mjs
          node --check apps/vivim-host/media/library-summary.mjs
          node --input-type=module -e "import fs from 'node:fs'; const m=JSON.parse(fs.readFileSync('apps/mobile-relay/manifest.webmanifest','utf8')); if(m.start_url!=='./'||m.scope!=='./')process.exit(1)"
      - name: Run canonical local PWA verification suites
        run: node integration/scripts/pwa-run-now.mjs
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

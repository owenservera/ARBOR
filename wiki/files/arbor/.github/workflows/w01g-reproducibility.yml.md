# File: .github/workflows/w01g-reproducibility.yml

> Generated 2026-11-19 · YAML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .github/workflows/w01g-reproducibility.yml |
| Language | YAML |
| Kind | config |
| Size | 2392 B |
| Lines | 85 |
| Hash | a05e365dd1fb |
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
name: ARBOR W01-G reproducibility gate
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: w01g-${{ github.ref }}
  cancel-in-progress: false

jobs:
  generate-locks:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main' && github.actor != 'github-actions[bot]'
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - uses: dtolnay/rust-toolchain@stable
        with:
          toolchain: '1.99.0'
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: '1.4.4'
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - name: Identify actual toolchains
        run: |
          set -eu
          rustc -vV
          cargo -V
          bun -v
          node -v
      - name: Resolve real lockfiles
        run: |
          set -eu
          cargo generate-lockfile
          bun install --ignore-scripts
          cargo metadata --locked --format-version 1 > /dev/null
          bun install --frozen-lockfile --ignore-scripts
          test -s Cargo.lock
          test -s bun.lock
      - name: Preserve generated lockfiles for owner review
        uses: actions/upload-artifact@v4
        with:
          name: w01g-generated-lockfiles
          path: |
            Cargo.lock
            bun.lock
          retention-days: 7
          if-no-files-found: error

  verify:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          toolchain: '1.99.0'
          targets: x86_64-pc-windows-msvc
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: '1.4.4'
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - name: Run real Windows gate
        shell: pwsh
        run: |
          pwsh -File integration/scripts/w01g-r001-windows.ps1 -Mode Verify
```

_First 80 of 86 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

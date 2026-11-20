# File: .github/workflows/acceleration-r002-w1-b.yml

> Generated 2026-11-19 · YAML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .github/workflows/acceleration-r002-w1-b.yml |
| Language | YAML |
| Kind | config |
| Size | 4704 B |
| Lines | 122 |
| Hash | a31164300bcb |
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
name: ARBOR R002 W1-B isolated Host Node24 acceptance

on:
  push:
    branches:
      - main
      - work/accel-r002-w1-integration-keeper
      - work/accel-r002-w1-b-runtime-proof
    paths:
      - apps/vivim-host/**
      - scripts/acceleration/**
      - scripts/batch-evidence/**
      - scripts/roadmap/**
      - scripts/feedback-loop/**
      - docs/product/roadmap/**
      - .github/workflows/acceleration-r002-w1-b.yml
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: acceleration-r002-w1-b-${{ github.ref }}
  cancel-in-progress: false

jobs:
  isolated-host-node24:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: '1.4.4'
      - name: Record pinned source and actual runtime
        shell: bash
        run: |
          set -eu
          git rev-parse --verify HEAD
          node --version
          bun --version
          uname -a
          printf 'GITHUB_SHA=%s\n' "$GITHUB_SHA"
          test "$(git rev-parse HEAD)" = "$GITHUB_SHA"
      - name: Inspect reproducibility closure without generating locks
        shell: bash
        run: |
          set -eu
          if test -f bun.lock; then
            echo "BUN_LOCK_PRESENT: install recorded dependencies, no build hooks"
            bun install --frozen-lockfile --ignore-scripts
          else
            echo "BUN_LOCK_MISSING: direct Node24 Host tests will still run; lockfile recovery belongs to Lane G"
          fi
      - name: Run one-command live isolated Host acceptance
        if: always()
        shell: bash
        run: |
          set +e
          node scripts/acceleration/live-host-check.mjs > "$RUNNER_TEMP/b-cli.stdout" 2> "$RUNNER_TEMP/b-cli.stderr"
          status=$?
          printf '%s\n' "$status" > "$RUNNER_TEMP/b-cli.exit"
          echo "::group::Host CLI stdout"
          cat "$RUNNER_TEMP/b-cli.stdout"
          echo "::endgroup::"
          echo "::group::Host CLI stderr"
          cat "$RUNNER_TEMP/b-cli.stderr"
          echo "::endgroup::"
          printf 'HOST_CLI_EXIT=%s\n' "$status"
          exit "$status"
      - name: Run isolated Host receipt contract tests
        if: always()
        shell: bash
        run: |
          set +e
```

_First 80 of 123 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

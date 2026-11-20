# File: Cargo.toml

> Generated 2026-11-19 · TOML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../projects/arbor.md) |
| Path | Cargo.toml |
| Language | TOML |
| Kind | config |
| Size | 224 B |
| Lines | 15 |
| Hash | 708f436409de |
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

```toml
[workspace]
resolver = "2"
members = [
  "native/hqkg",
  "core/programmability",
  "src-tauri",
]
default-members = [
  "native/hqkg",
  "core/programmability",
]

[profile.dev]
debug = 0
incremental = false
```

---

[HQ wiki](../../index.md) · [Symbols](../../symbols.md) · [Dependency graph](../../graph.md) · [Documentation](../../docs.md) · [Changes](../../changes.md) · [Open tasks](../../todos.md) · [Deprecated](../../deprecated.md) · [Agent annotation protocol](../../protocol.md) · [Glossary](../../glossary.md) · [Using HQ](../../context.md) · [Capabilities](../../capabilities.md) · [Search index](../../search.json) · [Browser view](../../index.html)

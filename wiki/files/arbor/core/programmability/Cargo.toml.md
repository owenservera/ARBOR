# File: core/programmability/Cargo.toml

> Generated 2026-11-19 · TOML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | core/programmability/Cargo.toml |
| Language | TOML |
| Kind | config |
| Size | 375 B |
| Lines | 16 |
| Hash | af291fd0813b |
| Test | no |
| Generated | no |
| Component | core |

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
[package]
name = "vivim-programmability-core"
version = "0.1.0"
edition = "2021"
publish = false
description = "Pure native types and deterministic validation for VIVIM programmable transformations"

[lib]
name = "vivim_programmability_core"
path = "src/lib.rs"

[dependencies]

serde = { version = "1", features = ["derive"] }
serde_json = "1"
sha2 = "0.10"
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

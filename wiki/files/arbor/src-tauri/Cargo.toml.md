# File: src-tauri/Cargo.toml

> Generated 2026-11-19 · TOML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../projects/arbor.md) |
| Path | src-tauri/Cargo.toml |
| Language | TOML |
| Kind | config |
| Size | 685 B |
| Lines | 21 |
| Hash | 425cac256dcd |
| Test | no |
| Generated | no |
| Component | src-tauri |

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
name = "vivim-host"
version = "0.1.0"
edition = "2021"
publish = false

[dependencies]
tauri = { version = "=2.0.0", features = [] }
tauri-runtime = { version = "=2.0.0" }
tauri-runtime-wry = { version = "=2.0.0" }
windows-core = { version = "=0.58.0" }
windows = { version = "=0.58.0" }
webview2-com-sys = { version = "=0.33.0" }
tauri-utils = { version = "=2.0.0" }
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.12", default-features = false, features = ["blocking"] }
serde_json = "1"
vivim-programmability-core = { path = "../core/programmability" }

[build-dependencies]
tauri-build = { version = "=2.0.0", features = [] }
```

---

[HQ wiki](../../../index.md) · [Symbols](../../../symbols.md) · [Dependency graph](../../../graph.md) · [Documentation](../../../docs.md) · [Changes](../../../changes.md) · [Open tasks](../../../todos.md) · [Deprecated](../../../deprecated.md) · [Agent annotation protocol](../../../protocol.md) · [Glossary](../../../glossary.md) · [Using HQ](../../../context.md) · [Capabilities](../../../capabilities.md) · [Search index](../../../search.json) · [Browser view](../../../index.html)

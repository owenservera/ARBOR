# File: native/hqkg/src/adapters/mod.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/adapters/mod.rs |
| Language | Rust |
| Kind | source |
| Size | 152 B |
| Lines | 4 |
| Hash | 660c56fabbfa |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| dependency_manifest | module | 3 | yes | pub mod dependency_manifest; |
| research | module | 4 | yes | pub mod research; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| dependency_manifest | use | 3 | external |
| research | use | 4 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Source-specific adapters are not universal graph/kernel primitives.
#[cfg(feature = "importer")]
pub mod dependency_manifest;
pub mod research;
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

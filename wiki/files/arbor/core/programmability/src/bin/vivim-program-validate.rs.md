# File: core/programmability/src/bin/vivim-program-validate.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | core/programmability/src/bin/vivim-program-validate.rs |
| Language | Rust |
| Kind | source |
| Size | 803 B |
| Lines | 16 |
| Hash | 9e1497cbb56a |
| Test | no |
| Generated | no |
| Component | core |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| main | function | 4 | no | fn main() -&gt; io::Result&lt;()&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| std::io::{self, Read, Write} | use | 3 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! A bounded stdio entry point to the existing deterministic native validator.
//! No file paths, network, effect execution or policy grants.
use std::io::{self, Read, Write};
fn main() -> io::Result<()> {
    let mut bytes = Vec::new();
    io::stdin().lock().take(65_537).read_to_end(&mut bytes)?;
    let result = match std::str::from_utf8(&bytes) {
        Ok(input) => vivim_programmability_core::wire::validate_json(input),
        Err(_) => serde_json::json!({"schema":vivim_programmability_core::SCHEMA,
            "outcome":"refused","reasonCode":"INVALID_UTF8",
            "executionAuthorized":false,"effectPerformed":false}),
    };
    let mut out = io::stdout().lock();
    serde_json::to_writer(&mut out, &result).map_err(io::Error::other)?;
    out.write_all(b"\n")
}
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

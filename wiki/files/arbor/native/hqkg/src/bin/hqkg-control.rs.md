# File: native/hqkg/src/bin/hqkg-control.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/bin/hqkg-control.rs |
| Language | Rust |
| Kind | source |
| Size | 7560 B |
| Lines | 174 |
| Hash | f6c4b6e3e023 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| help | function | 7 | no | fn help() -&gt; &amp;&#39;static str { |
| integer | function | 10 | no | fn integer&lt;T: std::str::FromStr&gt;(v: &amp;str, key: &amp;str) -&gt; Result&lt;T&gt; { |
| bool_value | function | 14 | no | fn bool_value(v: &amp;str) -&gt; Result&lt;bool&gt; { |
| update | function | 21 | no | fn update(p: &amp;mut ConfigPatch, assignment: &amp;str) -&gt; Result&lt;()&gt; { |
| print_config | function | 43 | no | fn print_config(c: &amp;CoreConfig) { |
| run | function | 48 | no | fn run(args: Vec&lt;String&gt;) -&gt; Result&lt;()&gt; { |
| main | function | 169 | no | fn main() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::control::{ConfigPatch, CoreConfig, Mode} | use | 4 | external |
| hqkg::{Error, Journal, NodeKind, Result} | use | 5 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 1 | context | — | — | Explicit operator interface to inspect/revise core config and check journal health. |
| 2 | owner | repos-hq | — | repos-hq |
| 3 | invariant | — | — | No browser/provider actions; no silent recovery; CAS revision and --apply fences. |

## Excerpt

```rust
//! @hq:context Explicit operator interface to inspect/revise core config and check journal health.
//! @hq:owner repos-hq
//! @hq:invariant No browser/provider actions; no silent recovery; CAS revision and --apply fences.
use hqkg::control::{ConfigPatch, CoreConfig, Mode};
use hqkg::{Error, Journal, NodeKind, Result};

fn help() -> &'static str {
    "hqkg-control <journal.hqj> doctor | config show | config propose <revision> <key=value>... | config apply <revision> <key=value>... --apply | repair-tail <expected-epoch> --apply\nKeys: mode=development|production, allow_experimental=true|false, require_pinned_data=true|false, max_call_ms=N, max_output_bytes=N, telemetry_capacity=N, quarantine_after=N"
}
fn integer<T: std::str::FromStr>(v: &str, key: &str) -> Result<T> {
    v.parse::<T>()
        .map_err(|_| Error::Invalid(format!("invalid numeric setting {key}")))
}
fn bool_value(v: &str) -> Result<bool> {
    match v {
        "true" => Ok(true),
        "false" => Ok(false),
        _ => Err(Error::Invalid("expected true|false".into())),
    }
}
fn update(p: &mut ConfigPatch, assignment: &str) -> Result<()> {
    let (k, v) = assignment
        .split_once('=')
        .ok_or_else(|| Error::Invalid("expected key=value".into()))?;
    match k {
        "mode" => {
            p.mode = Some(match v {
                "development" => Mode::Development,
                "production" => Mode::Production,
                _ => return Err(Error::Invalid("unknown mode".into())),
            })
        }
        "allow_experimental" => p.allow_experimental = Some(bool_value(v)?),
        "require_pinned_data" => p.require_pinned_data = Some(bool_value(v)?),
        "max_call_ms" => p.max_call_ms = Some(integer(v, k)?),
        "max_output_bytes" => p.max_output_bytes = Some(integer(v, k)?),
        "telemetry_capacity" => p.telemetry_capacity = Some(integer(v, k)?),
        "quarantine_after" => p.quarantine_after = Some(integer(v, k)?),
        _ => return Err(Error::Invalid(format!("unknown config setting {k}"))),
    }
    Ok(())
}
fn print_config(c: &CoreConfig) {
    println!("revision={} mode={} allow_experimental={} require_pinned_data={} max_call_ms={} max_output_bytes={} telemetry_capacity={} quarantine_after={}",
        c.revision,c.mode.as_str(),c.allow_experimental,c.require_pinned_data,
        c.max_call_ms,c.max_output_bytes,c.telemetry_capacity,c.quarantine_after);
}
fn run(args: Vec<String>) -> Result<()> {
    if args.len() < 2 {
        return Err(Error::Invalid(help().into()));
    }
    let journal = Journal::new(&args[0]);
    let command = args[1].as_str();
    match command {
        "doctor" => {
            let state = journal.status()?;
            let graph = journal.load()?;
            graph.check_indexes()?;
            println!(
                "journal_exists={} epoch={} bytes={} valid_bytes={} trailing_bytes={}",
                state.exists,
                state.epoch,
                state.total_bytes,
                state.verified_bytes,
                state.trailing_bytes
            );
            println!(
                "graph_nodes={} graph_edges={}",
                graph.node_count(),
                graph.edge_count()
            );
            let mut warning = 0;
            for slot in graph.nodes().filter(|n| n.kind == NodeKind::EngineSlot) {
                let links = graph.outgoing(&slot.id, Some("active_engine"))?;
                if links.len() > 1 {
                    return Err(Error::Corrupt(format!(
                        "engine slot {} has multiple active generations",
                        slot.id
                    )));
                }
```

_First 80 of 175 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

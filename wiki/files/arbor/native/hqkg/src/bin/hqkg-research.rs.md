# File: native/hqkg/src/bin/hqkg-research.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/bin/hqkg-research.rs |
| Language | Rust |
| Kind | source |
| Size | 2255 B |
| Lines | 58 |
| Hash | d034f1861bb1 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| run | function | 9 | no | fn run() -&gt; Result&lt;()&gt; { |
| main | function | 53 | no | fn main() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::adapters::research::ResearchCatalogCompute | use | 4 | external |
| hqkg::control::{CoreConfig, CoreSupervisor, EnginePolicy} | use | 5 | external |
| hqkg::{EngineRegistry, EngineRequest, Error, Journal, Result} | use | 6 | external |
| std::sync::{Arc, RwLock} | use | 7 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 1 | context | — | — | Read-only one-command research explorer for the unified graph journal. |
| 2 | owner | repos-hq | — | repos-hq |
| 3 | invariant | — | — | Prints data-only catalog records; never installs, sends or activates research methods. |

## Excerpt

```rust
//! @hq:context Read-only one-command research explorer for the unified graph journal.
//! @hq:owner repos-hq
//! @hq:invariant Prints data-only catalog records; never installs, sends or activates research methods.
use hqkg::adapters::research::ResearchCatalogCompute;
use hqkg::control::{CoreConfig, CoreSupervisor, EnginePolicy};
use hqkg::{EngineRegistry, EngineRequest, Error, Journal, Result};
use std::sync::{Arc, RwLock};

fn run() -> Result<()> {
    let args = std::env::args().skip(1).collect::<Vec<_>>();
    if args.len() < 2 || args.len() > 3 {
        return Err(Error::Invalid("usage: hqkg-research <journal.hqj> summary|list_language|list_kgsi|list_scoring|list_placements|list_bindings|score_file|resource [semantic_id]".into()));
    }
    let journal = Journal::new(&args[0]);
    let graph = journal.load()?;
    if graph.node_count() == 0 {
        return Err(Error::Missing(
            "graph empty; use the HQKGX1 unified importer first".into(),
        ));
    }
    graph.check_indexes()?;
    let config = CoreConfig::latest_from_graph(&graph)?;
    let shared = Arc::new(RwLock::new(graph));
    let registry = EngineRegistry::new();
    let adapter = ResearchCatalogCompute::new(shared);
    registry.install(Arc::new(adapter), None)?;
    let mut supervisor = CoreSupervisor::new(&registry, config)?;
    supervisor.policies.insert(
        "hqkg:research-catalog".into(),
        EnginePolicy {
            production_ready: true,
            dependencies: vec![],
        },
    );
    let output = supervisor.execute_read_only(
        "hqkg:research-catalog",
        &EngineRequest {
            operation: args[1].clone(),
            data: args.get(2).cloned().unwrap_or_default(),
        },
    )?;
    println!("{}", output.output.data);
    eprintln!(
        "receipt slot={} generation={} config_rev={} elapsed_ms={} mode={}",
        output.receipt.slot,
        output.receipt.engine_generation,
        output.receipt.config_revision,
        output.receipt.elapsed_ms,
        output.receipt.mode.as_str()
    );
    Ok(())
}
fn main() {
    if let Err(err) = run() {
        eprintln!("hqkg-research: {err}");
        std::process::exit(2);
    }
}
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

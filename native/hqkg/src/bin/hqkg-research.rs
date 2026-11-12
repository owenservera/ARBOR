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

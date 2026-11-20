//! @hq:context Opt-in, bounded, journal-once importer for Repos HQ canonical graph projections.
//! @hq:owner repos-hq
//! @hq:invariant Never change the canonical Bun/SQLite store or activate any compute engine.
//! @hq:invariant The applied source namespace is reported on stdout so a packaged
//!   caller can bind the import to the namespace it expects before it advances
//!   any exchange state.
use hqkg::import::{parse, MAX_BYTES};
use hqkg::{Error, Journal, Result};
use std::fs;

fn run() -> Result<()> {
    let args = std::env::args().skip(1).collect::<Vec<_>>();
    if args.len() < 2 || args.len() > 3 || (args.len() == 3 && args[2] != "--dry-run") {
        return Err(Error::Invalid(
            "usage: hqkg-import <journal.hqj> <kg-exchange.jsonl> [--dry-run]".into(),
        ));
    }
    let metadata = fs::metadata(&args[1])?;
    if metadata.len() > MAX_BYTES as u64 {
        return Err(Error::Invalid("import exceeds 128 MiB".into()));
    }
    let exchange = parse(&fs::read(&args[1])?)?;
    let journal = Journal::new(&args[0]);
    let prior = journal.load()?;
    let old_epoch = prior.epoch();
    let mut next = prior.clone();
    let stats = exchange.apply(&mut next)?;
    exchange.verify_source_projection(&next)?;
    if args.len() == 2 && stats.changed() {
        journal.save(&next)?;
    }
    // An acknowledgment is now conditional on durable readback, not merely a
    // successful save call. No new snapshot or write is done for verification.
    if args.len() == 2 {
        let persisted=journal.load()?;
        if persisted.epoch()!=next.epoch(){
            return Err(Error::Corrupt("persisted graph epoch differs from applied exchange".into()));
        }
        exchange.verify_source_projection(&persisted)?;
    }
    println!(
        "schema={} source={} namespace={} digest={}",
        hqkg::import::SCHEMA,
        exchange.manifest.source,
        exchange.manifest.source,
        exchange.manifest.digest
    );
    println!(
        "node inserted={} updated={} unchanged={} deleted={} edge inserted={} updated={} unchanged={} deleted={}",
        stats.nodes_inserted,
        stats.nodes_updated,
        stats.nodes_unchanged,
        stats.nodes_deleted,
        stats.edges_inserted,
        stats.edges_updated,
        stats.edges_unchanged,
        stats.edges_deleted
    );
    println!(
        "epoch before={} after={} dry_run={} wrote_snapshot={}",
        old_epoch,
        next.epoch(),
        args.len() == 3,
        args.len() == 2 && stats.changed()
    );
    Ok(())
}
fn main() {
    if let Err(e) = run() {
        eprintln!("hqkg-import: {e}");
        std::process::exit(2);
    }
}

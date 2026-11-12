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
                if slot.properties.contains_key("active_generation") && links.len() != 1 {
                    return Err(Error::Corrupt(format!(
                        "engine slot {} missing active engine edge",
                        slot.id
                    )));
                }
            }
            for n in graph.nodes().filter(|n| n.kind == NodeKind::Database) {
                if hqkg::DatabaseSpec::from_node(n).is_err() {
                    warning += 1;
                }
            }
            let config = CoreConfig::latest_from_graph(&graph)?;
            print_config(&config);
            println!(
                "health={} warning_database_specs={} recoverable_tail_bytes={}",
                if state.trailing_bytes > 0 {
                    "degraded"
                } else {
                    "ready"
                },
                warning,
                state.trailing_bytes
            );
            if state.trailing_bytes > 0 {
                println!("repair-tail requires explicit expected epoch and --apply");
            }
        }
        "config" => {
            let g = journal.load()?;
            let mut config = CoreConfig::latest_from_graph(&g)?;
            if args.len() == 3 && args[2] == "show" {
                print_config(&config);
                return Ok(());
            }
            if args.len() < 5 || !matches!(args[2].as_str(), "propose" | "apply") {
                return Err(Error::Invalid(help().into()));
            }
            let mode = args[2].as_str();
            let expected = integer::<u64>(&args[3], "expected-revision")?;
            let apply = mode == "apply";
            let mut patch = ConfigPatch::default();
            let mut count = 0;
            for arg in args.iter().skip(4) {
                if arg == "--apply" {
                    continue;
                }
                update(&mut patch, arg)?;
                count += 1;
            }
            if count == 0 || (apply && args.last().map(String::as_str) != Some("--apply")) {
                return Err(Error::Invalid(
                    "at least one setting and final --apply required".into(),
                ));
            }
            let receipt = config.patch(expected, patch)?;
            print_config(&config);
            println!(
                "previous_revision={} new_revision={} changed={} applied={}",
                receipt.old_revision, receipt.new_revision, receipt.changed, apply
            );
            if apply && receipt.changed {
                let mut next = g.clone();
                // Anchor even the original default config in one journal transaction.
                if receipt.old_revision == 1 && !g.nodes().any(|n| n.id == "config:core:1") {
                    CoreConfig::default().record_snapshot(&mut next)?;
                }
                config.record_snapshot(&mut next)?;
                journal.save(&next)?;
            }
        }
        "repair-tail" => {
            if args.len() != 4 || args[3] != "--apply" {
                return Err(Error::Invalid(
                    "repair-tail <expected-epoch> --apply required".into(),
                ));
            }
            let expected = integer::<u64>(&args[2], "expected-epoch")?;
            let removed = journal.repair_torn_tail(expected)?;
            println!(
                "recovered_tail_bytes={} journal_epoch={}",
                removed, expected
            );
        }
        _ => return Err(Error::Invalid(help().into())),
    }
    Ok(())
}
fn main() {
    if let Err(err) = run(std::env::args().skip(1).collect()) {
        eprintln!("hqkg-control: {err}");
        std::process::exit(2);
    }
}

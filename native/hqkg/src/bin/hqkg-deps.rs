//! @hq:context Operator inspection for versioned dependency manifests; no runtime registration.
//! @hq:owner repos-hq
use hqkg::adapters::dependency_manifest::parse_manifest;
use hqkg::{Error, Result};
use std::fs;
fn run() -> Result<()> {
    let args = std::env::args().skip(1).collect::<Vec<_>>();
    if args.len() != 1 {
        return Err(Error::Invalid(
            "usage: hqkg-deps <module-dependencies.v1.json>".into(),
        ));
    }
    let bytes = fs::read(&args[0])?;
    let manifest = parse_manifest(&bytes)?;
    println!(
        "module={} slot={} interface={} version={} declared_ready={} runtime_approved=false",
        manifest.id,
        manifest.slot,
        manifest.interface,
        manifest.version.label(),
        manifest.declared_production_ready
    );
    for d in manifest.dependencies {
        let max = d
            .version
            .max_exclusive
            .map_or_else(|| "unbounded".into(), |v| v.label());
        println!(
            "dependency={} kind={:?} required={} range=[{}, {}) digest={} after={}",
            d.id,
            d.kind,
            d.required,
            d.version.min_inclusive.label(),
            max,
            d.expected_sha256.as_deref().unwrap_or("unpinned"),
            d.after.join(",")
        );
    }
    Ok(())
}
fn main() {
    if let Err(e) = run() {
        eprintln!("hqkg-deps: {e}");
        std::process::exit(2);
    }
}

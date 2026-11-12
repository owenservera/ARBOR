//! @hq:context Metadata-only web observation intake and versioned readback over HQKG journal.
//! @hq:owner repos-hq
//! @hq:invariant Never ACK before durable fsync; no provider, browser, or Host effects.
//! Build: cargo build --features importer --bin hqkg-web-feed
//! Original CLI: hqkg-web-feed <journal.hqj> (one JSON batch via stdin)
//! Persistent:   hqkg-web-feed <journal.hqj> serve (one bounded JSON batch per line)
//! Read-only:    hqkg-web-feed <journal.hqj> query [--site DOMAIN] [--since UTC] [--until UTC] [--after-cursor N] [--limit 1..100]
//! Revocation:   hqkg-web-feed <journal.hqj> revoke --id VISIT [--installation UUID] [--reason TEXT]
use hqkg::web_memory::{parse_batch, Query, RevocationRequest, WebMemory, MAX_BODY};
use hqkg::{Error, Journal, Result};
use std::io::{self, BufRead, Read, Write};

const USAGE: &str = "usage: hqkg-web-feed <journal.hqj> [serve|query ...|revoke --id VISIT [--installation UUID] [--reason TEXT]]";

fn query_args(args: &[String]) -> Result<Query> {
    let mut q = Query {
        limit: 50,
        ..Query::default()
    };
    let mut used = std::collections::BTreeSet::new();
    let mut i = 0;
    while i < args.len() {
        if i + 1 >= args.len() || !used.insert(args[i].as_str()) {
            return Err(Error::Invalid(
                "query requires unique --key value arguments".into(),
            ));
        }
        let val = &args[i + 1];
        match args[i].as_str() {
            "--site" => q.site = Some(val.clone()),
            "--since" => q.since = Some(val.clone()),
            "--until" => q.until = Some(val.clone()),
            "--after-cursor" => {
                q.after_cursor = val
                    .parse::<u64>()
                    .map_err(|_| Error::Invalid("invalid cursor".into()))?
            }
            "--limit" => {
                q.limit = val
                    .parse::<usize>()
                    .map_err(|_| Error::Invalid("invalid limit".into()))?
            }
            _ => {
                return Err(Error::Invalid(format!(
                    "unknown query argument: {}",
                    args[i]
                )))
            }
        }
        i += 2;
    }
    Ok(q)
}
fn revoke_args(args: &[String]) -> Result<RevocationRequest> {
    let mut req = RevocationRequest::default();
    let mut used = std::collections::BTreeSet::new();
    let mut i = 0;
    while i < args.len() {
        if i + 1 >= args.len() || !used.insert(args[i].as_str()) {
            return Err(Error::Invalid(
                "revoke requires unique --key value arguments".into(),
            ));
        }
        let val = &args[i + 1];
        match args[i].as_str() {
            "--id" => req.id = val.clone(),
            "--installation" => req.installation = Some(val.clone()),
            "--reason" => req.reason = Some(val.clone()),
            _ => {
                return Err(Error::Invalid(format!(
                    "unknown revoke argument: {}",
                    args[i]
                )))
            }
        }
        i += 2;
    }
    if req.id.trim().is_empty() {
        return Err(Error::Invalid("revoke requires --id".into()));
    }
    Ok(req)
}
fn run() -> Result<()> {
    let args = std::env::args().skip(1).collect::<Vec<_>>();
    if args.is_empty() {
        return Err(Error::Invalid(USAGE.into()));
    }
    let mut memory = WebMemory::open(Journal::new(&args[0]))?;
    if args.len() == 1 {
        let mut stdin = io::stdin().take((MAX_BODY + 1) as u64);
        let mut raw = Vec::new();
        stdin.read_to_end(&mut raw)?;
        let visits = parse_batch(&raw)?;
        let receipt = memory.accept(&visits)?;
        // Backward-compatible Studio stdout (transport success requires exit code 0).
        println!(
            "accepted={} inserted={} epoch={}",
            receipt.accepted_ids.len(),
            receipt.inserted,
            receipt.epoch
        );
        return Ok(());
    }
    match args[1].as_str() {
        "query" => {
            let q = query_args(&args[2..])?;
            println!("{}", memory.query(&q)?);
        }
        "revoke" => {
            let req = revoke_args(&args[2..])?;
            let receipt = memory.revoke(&req)?;
            // Revocation is idempotent: an unknown or already revoked id is a
            // successful no-op, reported as unknown=1 / already=1 with no
            // journal write and no epoch move.
            println!(
                "revoked={} already={} unknown={} epoch={}",
                u8::from(receipt.revoked),
                u8::from(receipt.already_revoked),
                u8::from(receipt.unknown),
                receipt.epoch
            );
        }
        "serve" if args.len() == 2 => {
            // One process can accept a long stream without replaying the graph per batch.
            // A malformed/conflicting batch closes the stream without a false ACK.
            let stdin = io::stdin();
            let mut reader = stdin.lock();
            let mut line = String::new();
            loop {
                line.clear();
                if reader.read_line(&mut line)? == 0 {
                    break;
                }
                let raw = line.trim_end_matches(&['\r', '\n'][..]).as_bytes();
                let visits = parse_batch(raw)?;
                let receipt = memory.accept(&visits)?;
                println!("{}", receipt.json());
                io::stdout().flush()?;
            }
        }
        _ => {
            return Err(Error::Invalid(USAGE.into()));
        }
    }
    Ok(())
}
fn main() {
    if let Err(e) = run() {
        eprintln!("hqkg-web-feed: {e}");
        std::process::exit(2);
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn query_flags_fail_closed() {
        assert!(query_args(&["--limit".into(), "101".into()]).is_ok()); // limits checked in WebMemory.query
        assert!(query_args(&["--exec".into(), "x".into()]).is_err());
        assert!(query_args(&[
            "--site".into(),
            "a.com".into(),
            "--site".into(),
            "b.com".into()
        ])
        .is_err());
        assert!(query_args(&["--after-cursor".into(), "-1".into()]).is_err());
    }
    #[test]
    fn revoke_flags_fail_closed() {
        assert!(
            revoke_args(&["--id".into(), "00000001-1234-4234-8234-123456789012".into()]).is_ok()
        );
        assert!(revoke_args(&[]).is_err());
        assert!(revoke_args(&["--reason".into(), "owner request".into()]).is_err());
        assert!(revoke_args(&["--id".into(), "a".into(), "--id".into(), "b".into()]).is_err());
        assert!(revoke_args(&["--exec".into(), "x".into()]).is_err());
        assert!(revoke_args(&["--id".into()]).is_err());
    }
}

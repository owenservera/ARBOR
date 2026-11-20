# File: native/hqkg/src/bin/hqkg-web-feed.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/bin/hqkg-web-feed.rs |
| Language | Rust |
| Kind | source |
| Size | 6961 B |
| Lines | 180 |
| Hash | f930cef1b9f3 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| USAGE | const | 13 | no | const USAGE: &amp;str = &quot;usage: hqkg-web-feed &lt;journal.hqj&gt; [serve\|query ...\|revoke --id VISIT [--installation UUID] [--reason TEXT]]&quot;; |
| query_args | function | 15 | no | fn query_args(args: &amp;[String]) -&gt; Result&lt;Query&gt; { |
| revoke_args | function | 54 | no | fn revoke_args(args: &amp;[String]) -&gt; Result&lt;RevocationRequest&gt; { |
| run | function | 83 | no | fn run() -&gt; Result&lt;()&gt; { |
| main | function | 147 | no | fn main() { |
| tests | module | 154 | no | mod tests { |
| query_flags_fail_closed | function | 157 | no | fn query_flags_fail_closed() { |
| revoke_flags_fail_closed | function | 170 | no | fn revoke_flags_fail_closed() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::web_memory::{parse_batch, Query, RevocationRequest, WebMemory, MAX_BODY} | use | 9 | external |
| hqkg::{Error, Journal, Result} | use | 10 | external |
| std::io::{self, BufRead, Read, Write} | use | 11 | external |
| super::* | use | 155 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 1 | context | — | — | Metadata-only web observation intake and versioned readback over HQKG journal. |
| 2 | owner | repos-hq | — | repos-hq |
| 3 | invariant | — | — | Never ACK before durable fsync; no provider, browser, or Host effects. |

## Excerpt

```rust
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
```

_First 80 of 181 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

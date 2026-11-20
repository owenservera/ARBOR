# File: native/hqkg/src/bin/hqkg-chat-context.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/bin/hqkg-chat-context.rs |
| Language | Rust |
| Kind | source |
| Size | 4902 B |
| Lines | 118 |
| Hash | 80d8985dae73 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SCHEMA | const | 11 | no | const SCHEMA: &amp;str = &quot;vivim.hqkg-chat-context/1&quot;; |
| MAX_JOURNAL_BYTES | const | 12 | no | const MAX_JOURNAL_BYTES: u64 = 64 * 1024 * 1024; |
| MAX_ITEMS | const | 13 | no | const MAX_ITEMS: usize = 8; |
| safe_title | function | 15 | no | fn safe_title(raw: &amp;str) -&gt; String { |
| project | function | 18 | no | fn project(journal: &amp;Path, seed: &amp;str, budget: u64) -&gt; Result&lt;Value&gt; { |
| run | function | 66 | no | fn run() -&gt; Result&lt;Value&gt; { |
| main | function | 78 | no | fn main() { |
| tests | module | 88 | no | mod tests { |
| temp | function | 91 | no | fn temp() -&gt; std::path::PathBuf { |
| bounded_source_backed_projection | function | 96 | no | fn bounded_source_backed_projection() { |
| invalid_input_does_not_disclose_content | function | 113 | no | fn invalid_input_does_not_disclose_content() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::context_retrieval::{retrieve, ContextRequest} | use | 3 | external |
| hqkg::{Error, Journal, Result} | use | 4 | external |
| hqkg::managed_context::project_managed | use | 5 | external |
| serde_json::{json, Value} | use | 6 | external |
| std::collections::BTreeSet | use | 7 | external |
| std::fs | use | 8 | external |
| std::path::Path | use | 9 | external |
| super::* | use | 89 | external |
| hqkg::{Graph, Node, NodeKind, Journal} | use | 90 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Read-only chat context projection from the **existing** HQKG journal.
 // No graph writes, browser calls, provider sends, authorization decisions, or second engine.
use hqkg::context_retrieval::{retrieve, ContextRequest};
use hqkg::{Error, Journal, Result};
use hqkg::managed_context::project_managed;
use serde_json::{json, Value};
use std::collections::BTreeSet;
use std::fs;
use std::path::Path;

const SCHEMA: &str = "vivim.hqkg-chat-context/1";
const MAX_JOURNAL_BYTES: u64 = 64 * 1024 * 1024;
const MAX_ITEMS: usize = 8;

fn safe_title(raw: &str) -> String {
    raw.chars().filter(|c| !c.is_control()).take(100).collect()
}
fn project(journal: &Path, seed: &str, budget: u64) -> Result<Value> {
    if !journal.is_absolute() || seed.is_empty() || seed.len() > 120 ||
        seed.chars().any(char::is_control) || !(1..=1024).contains(&budget) {
        return Err(Error::Invalid("unsafe chat context argument".into()));
    }
    let stat = fs::symlink_metadata(journal)?;
    if !stat.is_file() || stat.file_type().is_symlink() || stat.len() > MAX_JOURNAL_BYTES {
        return Err(Error::Invalid("chat context journal unavailable or unsafe".into()));
    }
    // The Rust graph owns deterministic retrieval; the Host owns who can view it.
    let graph = Journal::new(journal).load()?;
    graph.check_indexes()?;
    let request = ContextRequest {
        seeds: vec![seed.to_string()],
        budget_tokens: budget,
        excluded: BTreeSet::new(),
        watermark: None
    };
    let bundle = retrieve(&graph, &request)?;
    if bundle.stale_count != 0 {
        return Err(Error::Invalid("stale context is not disclosed".into()));
    }
    let items = bundle.items.iter().take(MAX_ITEMS).map(|item| {
        json!({
            "title": safe_title(&item.title),
            "depth": item.depth,
            "revision": item.version,
            "sourceCount": item.sources.len(),
            "estimatedTokens": item.tokens
        })
    }).collect::<Vec<_>>();
    Ok(json!({
        "schema": SCHEMA,
        "state": "source-backed",
        "core": "hqkg",
        "authority": "read-only",
        "seed": seed,
        "epoch": bundle.epoch,
        "tokensUsed": bundle.tokens_used,
        "budgetTokens": budget,
        "budgetExhausted": bundle.budget_exhausted,
        "staleCount": 0,
        "totalRetrieved": bundle.items.len(),
        "items": items,
        "note": "Native graph context is advisory. Host must plan, approve and receipt every effect."
    }))
}

fn run() -> Result<Value> {
    let args = std::env::args().skip(1).collect::<Vec<_>>();
    if args.len() == 5 && args[1] == "--managed" {
        let epoch = args[3].parse::<u64>().map_err(|_| Error::Invalid("invalid graph epoch".into()))?;
        return project_managed(Path::new(&args[0]), &args[2], epoch, &args[4]);
    }
    if args.len() != 3 {
        return Err(Error::Invalid("usage: hqkg-chat-context <absolute-journal.hqj> <host-selected-seed> <token-budget>".into()));
    }
    let budget = args[2].parse::<u64>().map_err(|_| Error::Invalid("invalid token budget".into()))?;
    project(Path::new(&args[0]), &args[1], budget)
}
fn main() {
    match run() {
        Ok(value) => println!("{value}"),
```

_First 80 of 119 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)

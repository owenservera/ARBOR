# File: native/hqkg/tests/keeper_recovery_matrix.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/keeper_recovery_matrix.rs |
| Language | Rust |
| Kind | source |
| Size | 23080 B |
| Lines | 580 |
| Hash | bfa909a2b186 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| tmp_journal | function | 32 | no | fn tmp_journal(tag: &amp;str) -&gt; PathBuf { |
| hq_id | function | 44 | no | fn hq_id(hex: &amp;str) -&gt; String { |
| exchange_bytes | function | 50 | no | fn exchange_bytes( source: &amp;str, nodes: &amp;[(&amp;str, &amp;str)], edges: &amp;[(&amp;str, &amp;str, &amp;str, &amp;str)], ) -&gt; Vec&lt;u8&gt; { |
| legacy_hqj1_tail_is_recovered_by_the_next_snapshot_write | function | 84 | no | fn legacy_hqj1_tail_is_recovered_by_the_next_snapshot_write() { |
| interrupted_hqd1_delta_tail_is_refused_at_the_write_boundary | function | 150 | no | fn interrupted_hqd1_delta_tail_is_refused_at_the_write_boundary() { |
| save_load_round_trip_preserves_nodes_edges_epoch_and_the_tombstone_effect | function | 232 | no | fn save_load_round_trip_preserves_nodes_edges_epoch_and_the_tombstone_effect() { |
| journal_save_refuses_a_stale_or_unchanged_epoch | function | 314 | no | fn journal_save_refuses_a_stale_or_unchanged_epoch() { |
| append_and_repair_refuse_stale_byte_and_epoch_expectations | function | 357 | no | fn append_and_repair_refuse_stale_byte_and_epoch_expectations() { |
| deleting_a_node_cascades_every_incident_edge_including_another_sources | function | 431 | no | fn deleting_a_node_cascades_every_incident_edge_including_another_sources() { |
| idempotent_replay_does_not_bump_the_epoch_but_a_real_mutation_does | function | 523 | no | fn idempotent_replay_does_not_bump_the_epoch_but_a_real_mutation_does() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::graph_change_set::{apply, ApplyLedger, GraphChangeSet} | use | 22 | external |
| hqkg::import::{parse, Exchange, Manifest} | use | 23 | external |
| hqkg::{serialize, Edge, Error, Graph, Journal, Node, NodeKind} | use | 24 | external |
| sha2::{Digest, Sha256} | use | 25 | external |
| std::fs::OpenOptions | use | 26 | external |
| std::io::Write | use | 27 | external |
| std::path::PathBuf | use | 28 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
#![cfg(feature = "importer")]
//! CHARACTERISATION tests for the HQKG recovery / epoch boundary matrix.
//!
//! These tests document what the code does **today**. They are not policy
//! proposals and they must not be tightened into new policy by accident.
//! Where the current behaviour is questionable, the open question is named in
//! a comment next to the assertion (STRATEGY.md priority 4,
//! WORKPLAN.md section 4).
//!
//! Coverage map (keeper mandate):
//!   1. legacy HQJ1 journal tail recovery still works exactly as today
//!   2. an interrupted HQD1 delta tail is refused (at the write boundary)
//!   3. save/load round trip preserves nodes, edges, epoch and the tombstone
//!      effect exactly
//!   4. the stale-writer / epoch-CAS refusal that exists is exercised
//!   5. deleting a node cascades its incident edges (actual behaviour, incl.
//!      edges owned by a different source)
//!   6. an idempotent replay bumps no epoch while a real mutation does
//!
//! Deterministic: BTreeMap ordering, no wall-clock, no randomness, no
//! network, and no filesystem outside the OS temp directory.
use hqkg::graph_change_set::{apply, ApplyLedger, GraphChangeSet};
use hqkg::import::{parse, Exchange, Manifest};
use hqkg::{serialize, Edge, Error, Graph, Journal, Node, NodeKind};
use sha2::{Digest, Sha256};
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;

/// A unique journal path inside the OS temp directory. The name carries the
/// process id so two concurrent runs never share a file.
fn tmp_journal(tag: &str) -> PathBuf {
    let path = std::env::temp_dir().join(format!(
        "hqkg-keeper-rec-{}-{}.hqj",
        tag,
        std::process::id()
    ));
    let _ = std::fs::remove_file(&path);
    let _ = std::fs::remove_file(path.with_extension("hqkg.lock"));
    path
}

/// A canonical bridge identity: `hqg1:` + 64 lowercase hex characters.
fn hq_id(hex: &str) -> String {
    format!("hqg1:{}", hex.repeat(64))
}

/// Build a valid HQKGX1 exchange body wrapped in a manifest whose SHA-256
/// digest covers exactly the body bytes (see `hqkg::import::parse`).
fn exchange_bytes(
    source: &str,
    nodes: &[(&str, &str)],
    edges: &[(&str, &str, &str, &str)],
) -> Vec<u8> {
    let mut body = String::new();
    for (id, title) in nodes {
        body.push_str(&format!(
            "{{\"id\":\"{id}\",\"kind\":\"file\",\"metadata\":{{}},\"title\":\"{title}\",\"type\":\"node\"}}\n"
        ));
    }
    for (id, from, to, relation) in edges {
        body.push_str(&format!(
            "{{\"from\":\"{from}\",\"id\":\"{id}\",\"metadata\":{{}},\"relation\":\"{relation}\",\"to\":\"{to}\",\"type\":\"edge\",\"weight\":1}}\n"
        ));
    }
    let digest = format!("{:x}", Sha256::digest(body.as_bytes()));
    format!(
        "{{\"authority\":\"data-only; no executable code or provider actions\",\"edge_count\":{},\"graph_sha256\":\"{digest}\",\"node_count\":{},\"schema\":\"repos-hq.hqkg-exchange/1\",\"source\":\"{source}\",\"type\":\"manifest\"}}\n{body}",
        edges.len(),
        nodes.len()
    )
    .into_bytes()
}

/// (1) Legacy HQJ1 tail recovery still works exactly as today.
///
/// A journal whose tail is a torn LEGACY `HQJ1` frame stays recoverable: the
/// next `Journal::save` truncates the torn tail back to the last verified
/// frame and appends a fresh snapshot (`src/lib.rs:1049-1082`). This is
/// deliberately *not* tightened here: STRATEGY.md priority 4 records
```

_First 80 of 581 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

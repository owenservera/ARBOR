# File: native/hqkg/tests/web_memory_revocation.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/web_memory_revocation.rs |
| Language | Rust |
| Kind | source |
| Size | 14160 B |
| Lines | 397 |
| Hash | b04aed894bd0 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REVOCATION_SCHEMA_ID | const | 15 | no | const REVOCATION_SCHEMA_ID: &amp;str = &quot;vivim.web-memory-revocation/1&quot;; |
| INSTALLATION | const | 16 | no | const INSTALLATION: &amp;str = &quot;12345678-1234-4234-8234-123456789012&quot;; |
| EVENT_ID | const | 17 | no | const EVENT_ID: &amp;str = &quot;00000001-1234-4234-8234-123456789012&quot;; |
| VISIT_NODE_ID | const | 18 | no | const VISIT_NODE_ID: &amp;str = |
| tmp | function | 21 | no | fn tmp(label: &amp;str) -&gt; PathBuf { |
| sample | function | 29 | no | fn sample() -&gt; Vec&lt;u8&gt; { |
| visit_node | function | 45 | no | fn visit_node() -&gt; Node { |
| tombstone_node | function | 62 | no | fn tombstone_node(installation: &amp;str, event_id: &amp;str) -&gt; Node { |
| open | function | 79 | no | fn open(path: &amp;PathBuf) -&gt; WebMemory { |
| query | function | 83 | no | fn query(memory: &amp;WebMemory, limit: usize, after: u64) -&gt; Value { |
| revoked_visit_is_absent_from_query_output | function | 94 | no | fn revoked_visit_is_absent_from_query_output() { |
| revocation_request | function | 110 | no | fn revocation_request(id: &amp;str) -&gt; hqkg::web_memory::RevocationRequest { |
| sample_for | function | 118 | no | fn sample_for(installation: &amp;str, event_id: &amp;str, url: &amp;str) -&gt; Vec&lt;u8&gt; { |
| the_crate_revocation_schema_matches_the_wire_format | function | 134 | no | fn the_crate_revocation_schema_matches_the_wire_format() { |
| revocation_is_durable_across_a_save_and_load_round_trip | function | 143 | no | fn revocation_is_durable_across_a_save_and_load_round_trip() { |
| a_revocation_survives_a_legacy_snapshot_save_and_load | function | 191 | no | fn a_revocation_survives_a_legacy_snapshot_save_and_load() { |
| revoking_twice_is_idempotent | function | 244 | no | fn revoking_twice_is_idempotent() { |
| revoking_an_unknown_id_is_a_no_op | function | 270 | no | fn revoking_an_unknown_id_is_a_no_op() { |
| a_stale_replay_cannot_resurrect_a_revoked_visit | function | 293 | no | fn a_stale_replay_cannot_resurrect_a_revoked_visit() { |
| a_revocation_is_scoped_to_the_owning_installation | function | 314 | no | fn a_revocation_is_scoped_to_the_owning_installation() { |
| OTHER | const | 315 | no | const OTHER: &amp;str = &quot;87654321-1234-4234-8234-123456789012&quot;; |
| only_a_browser_companion_visit_can_be_revoked | function | 357 | no | fn only_a_browser_companion_visit_can_be_revoked() { |
| a_malformed_revocation_id_is_refused | function | 379 | no | fn a_malformed_revocation_id_is_refused() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::web_memory::{parse_batch, Query, WebMemory} | use | 8 | external |
| hqkg::{Graph, Journal, Node, NodeKind} | use | 9 | external |
| serde_json::{json, Value} | use | 10 | external |
| std::{fs, path::PathBuf} | use | 11 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Revocation contract for browser metadata: a revoked visit must be absent |
| 5 | owner | repos-hq | — | repos-hq |
| 6 | invariant | — | — | Revocation is an additive tombstone in the same journal; it never rewrites |

## Excerpt

```rust
#![cfg(feature = "importer")]
//! @hq:context Revocation contract for browser metadata: a revoked visit must be absent
//! from query output and from the Host/phone projection, durably, idempotently, and it must
//! never be resurrected by a stale replay.
//! @hq:owner repos-hq
//! @hq:invariant Revocation is an additive tombstone in the same journal; it never rewrites
//! committed frames and never reserializes a graph snapshot.
use hqkg::web_memory::{parse_batch, Query, WebMemory};
use hqkg::{Graph, Journal, Node, NodeKind};
use serde_json::{json, Value};
use std::{fs, path::PathBuf};

/// Wire format of the durable tombstone. Pinned here so the fixture shape is a
/// contract, not an implementation detail of the crate.
const REVOCATION_SCHEMA_ID: &str = "vivim.web-memory-revocation/1";
const INSTALLATION: &str = "12345678-1234-4234-8234-123456789012";
const EVENT_ID: &str = "00000001-1234-4234-8234-123456789012";
const VISIT_NODE_ID: &str =
    "web:visit:12345678-1234-4234-8234-123456789012:00000001-1234-4234-8234-123456789012";

fn tmp(label: &str) -> PathBuf {
    let f = std::env::temp_dir().join(format!("hqkg-revoke-{}-{}.hqj", std::process::id(), label));
    let _ = fs::remove_file(&f);
    let _ = fs::remove_file(f.with_extension("hqkg.lock"));
    f
}

/// One browser-companion visit, exactly as the Studio ingress forwards it.
fn sample() -> Vec<u8> {
    serde_json::to_vec(&json!({
        "schema": "vivim.browser-companion/1",
        "installationId": INSTALLATION,
        "sessionId": INSTALLATION,
        "events": [{
            "id": EVENT_ID,
            "type": "visit.observed",
            "at": "2026-11-04T10:00:00.000Z",
            "page": {"browserTabId": 7, "site": "example.org", "url": "https://example.org/articles/1"}
        }]
    }))
    .unwrap()
}

/// The visit node the accept path writes (properties included), for snapshot fixtures.
fn visit_node() -> Node {
    Node::new(VISIT_NODE_ID, NodeKind::Document, "example.org")
        .property("source", "vivim.browser-companion")
        .property("url", "https://example.org/articles/1")
        .property("observedAt", "2026-11-04T10:00:00.000Z")
        .property("evidence", "browser-navigation-metadata")
        .property("payloadDigest", &"0".repeat(64))
        .property("installationId", INSTALLATION)
        .property("sessionId", INSTALLATION)
        .property("eventId", EVENT_ID)
        .property("browserTabId", "7")
        .property("site", "example.org")
        .property("cursor", "1")
        .source(&format!("browser:{}:{}", INSTALLATION, EVENT_ID))
}

/// The durable tombstone form: an additive node beside the visit, never a rewrite of it.
fn tombstone_node(installation: &str, event_id: &str) -> Node {
    Node::new(
        &format!("web:revocation:{}:{}", installation, event_id),
        NodeKind::Concept,
        "revoked web visit",
    )
    .property("source", "vivim.browser-companion")
    .property("revocationSchema", REVOCATION_SCHEMA_ID)
    .property("installationId", installation)
    .property("eventId", event_id)
    .property(
        "revokedVisit",
        &format!("web:visit:{}:{}", installation, event_id),
    )
    .source(&format!("browser:{}:{}", installation, event_id))
}

fn open(path: &PathBuf) -> WebMemory {
    WebMemory::open(Journal::new(path)).unwrap()
```

_First 80 of 398 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

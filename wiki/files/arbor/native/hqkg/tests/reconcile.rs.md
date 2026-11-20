# File: native/hqkg/tests/reconcile.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/reconcile.rs |
| Language | Rust |
| Kind | source |
| Size | 10049 B |
| Lines | 279 |
| Hash | 31092056c01a |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| node | function | 13 | no | fn node(id: &amp;str, kind: NodeKind, title: &amp;str) -&gt; Node { |
| find_duplicates_flags_same_normalized_title | function | 18 | no | fn find_duplicates_flags_same_normalized_title() { |
| find_duplicates_cites_identical_property_key_sets | function | 45 | no | fn find_duplicates_cites_identical_property_key_sets() { |
| find_duplicates_shared_neighbor_signal_with_threshold | function | 73 | no | fn find_duplicates_shared_neighbor_signal_with_threshold() { |
| find_orphans_zero_incident_edges_with_allowlist | function | 121 | no | fn find_orphans_zero_incident_edges_with_allowlist() { |
| plan_winner_rule_highest_version_then_lowest_id | function | 147 | no | fn plan_winner_rule_highest_version_then_lowest_id() { |
| plan_composes_and_applies_cleanly_end_to_end | function | 204 | no | fn plan_composes_and_applies_cleanly_end_to_end() { |
| plan_skips_stale_candidates_and_empty_plan_is_valid | function | 270 | no | fn plan_skips_stale_candidates_and_empty_plan_is_valid() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::graph_change_set::{apply, ApplyLedger} | use | 9 | external |
| hqkg::reconcile::{find_duplicates, find_orphans, reconciliation_plan, DuplicateSignal} | use | 10 | external |
| hqkg::{Edge, Graph, Node, NodeKind} | use | 11 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 6 | context | — | — | reconciliation tests for HQKG (OVN-B lane 3) |
| 7 | owner | hq-agent | — | hq-agent |
| 8 | task | — | — | OVN-B lane 3 (docs/orchestration/intelligence-upgrade/AUTONOMOUS-CONTINUOUS-WORK-ORDERS.md) |

## Excerpt

```rust
//! OVN-B lane 3: entity reconciliation, orphan/duplicate detection, federation.
//!
//! Detection proposes (exact signals only), the W4 change-set module applies.
//! End-to-end cycle: detect -> plan -> apply -> assert merged -> re-detect nothing.
//!
//! @hq:context reconciliation tests for HQKG (OVN-B lane 3)
//! @hq:owner hq-agent
//! @hq:task OVN-B lane 3 (docs/orchestration/intelligence-upgrade/AUTONOMOUS-CONTINUOUS-WORK-ORDERS.md)
use hqkg::graph_change_set::{apply, ApplyLedger};
use hqkg::reconcile::{find_duplicates, find_orphans, reconciliation_plan, DuplicateSignal};
use hqkg::{Edge, Graph, Node, NodeKind};

fn node(id: &str, kind: NodeKind, title: &str) -> Node {
    Node::new(id, kind, title)
}

#[test]
fn find_duplicates_flags_same_normalized_title() {
    let mut g = Graph::new();
    g.put_node(node("doc:1", NodeKind::Document, "Rust Core"))
        .unwrap();
    // Same normalized title (trim + lowercase), different id.
    g.put_node(node("doc:2", NodeKind::Document, "  rust CORE "))
        .unwrap();
    // Control: a distinct node must not be flagged.
    g.put_node(node("doc:3", NodeKind::Document, "Index Layer"))
        .unwrap();

    let dups = find_duplicates(&g);
    assert_eq!(dups.len(), 1, "expected exactly one candidate: {dups:?}");
    let c = &dups[0];
    assert_eq!(
        (c.id_a.as_str(), c.id_b.as_str()),
        ("doc:1", "doc:2"),
        "pairs must be ordered by id"
    );
    assert!(
        c.signals.iter().any(|s| matches!(s, DuplicateSignal::TitleMatch { normalized_title } if normalized_title == "rust core")),
        "title signal must cite its value: {:?}",
        c.signals
    );
}

#[test]
fn find_duplicates_cites_identical_property_key_sets() {
    let mut g = Graph::new();
    g.put_node(
        node("n:1", NodeKind::Fact, "Alpha")
            .property("lang", "rust")
            .property("owner", "hq"),
    )
    .unwrap();
    g.put_node(
        node("n:2", NodeKind::Fact, "Totally Different")
            .property("owner", "x")
            .property("lang", "y"),
    )
    .unwrap();

    let dups = find_duplicates(&g);
    assert_eq!(dups.len(), 1, "expected one candidate: {dups:?}");
    assert!(
        dups[0].signals.iter().any(
            |s| matches!(s, DuplicateSignal::PropertyKeySetMatch { keys }
            if keys == &vec!["lang".to_string(), "owner".to_string()])
        ),
        "property-key signal must cite the shared key set: {:?}",
        dups[0].signals
    );
}

#[test]
fn find_duplicates_shared_neighbor_signal_with_threshold() {
    let mut g = Graph::new();
    for id in ["h:1", "h:2", "a", "b", "c"] {
        g.put_node(node(id, NodeKind::Fact, id)).unwrap();
    }
    // a and b share TWO neighbors (h:1, h:2) -> candidate.
    g.put_edge(Edge::new("e:a-h1", "a", "mentions", "h:1"))
        .unwrap();
```

_First 80 of 280 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

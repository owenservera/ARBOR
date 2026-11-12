//! Durable, cross-process apply-ledger tests (OVN-A lane 4 / OVN-B durability).
//!
//! The W4 in-memory `ApplyLedger` is process-local; these tests pin the
//! `FileApplyLedger` contract: records survive drop+reopen (a cross-process
//! simulation), duplicates never grow the file, torn tails are discarded on
//! open, and the composite `apply_durable` refuses duplicates before applying
//! and never records a failed apply.
//!
//! @hq:context durable cross-process idempotency for HQKG change sets
//! @hq:owner hq-agent
//! @hq:task OVN-A lane 4 / OVN-B durability
use std::fs;
use std::path::PathBuf;

use hqkg::apply_ledger::{apply_durable, FileApplyLedger};
use hqkg::graph_change_set::GraphChangeSet;
use hqkg::{Edge, Graph, Node, NodeKind};

fn temp_dir(name: &str) -> PathBuf {
    let dir =
        std::env::temp_dir().join(format!("hqkg-apply-ledger-{}-{}", name, std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn node(id: &str) -> Node {
    Node::new(id, NodeKind::Concept, id)
}

fn seed_graph() -> Graph {
    let mut g = Graph::new();
    g.put_node(node("base")).unwrap();
    g
}

fn cs_put_two() -> GraphChangeSet {
    GraphChangeSet::new("cs-durable-1", "web-feed")
        .put_node(node("a"))
        .put_node(node("b"))
        .put_edge(Edge::new("ab", "a", "depends_on", "b"))
}

/// (1) record -> drop -> reopen: a fresh instance (cross-process simulation)
/// sees contains == true and the same length.
#[test]
fn record_survives_drop_and_reopen() {
    let dir = temp_dir("reopen");
    let path = dir.join("ledger.applied");
    let mut ledger = FileApplyLedger::open(&path).unwrap();
    assert!(ledger.record("cs-1").unwrap(), "first record returns true");
    assert!(ledger.contains("cs-1"));
    assert_eq!(ledger.len(), 1);
    drop(ledger);
    let reopened = FileApplyLedger::open(&path).unwrap();
    assert!(reopened.contains("cs-1"), "record must survive reopen");
    assert_eq!(reopened.len(), 1);
    assert!(!reopened.contains("cs-2"));
    fs::remove_dir_all(&dir).unwrap();
}

/// (2) duplicate record returns false and does not grow the file.
#[test]
fn duplicate_record_returns_false_and_does_not_grow_file() {
    let dir = temp_dir("dup");
    let path = dir.join("ledger.applied");
    let mut ledger = FileApplyLedger::open(&path).unwrap();
    assert!(ledger.record("cs-1").unwrap());
    let bytes_after_first = fs::metadata(&path).unwrap().len();
    let again = ledger.record("cs-1").unwrap();
    assert!(!again, "duplicate record returns false");
    let bytes_after_dup = fs::metadata(&path).unwrap().len();
    assert_eq!(
        bytes_after_first, bytes_after_dup,
        "duplicate must not append to the file"
    );
    assert_eq!(ledger.len(), 1);
    drop(ledger);
    let reopened = FileApplyLedger::open(&path).unwrap();
    assert_eq!(reopened.len(), 1);
    fs::remove_dir_all(&dir).unwrap();
}

/// (3) torn tail: bytes appended without a newline are a partial record;
/// open discards them and keeps every complete record, and the file is
/// repaired so the next record appends cleanly.
#[test]
fn torn_tail_is_discarded_on_open_and_complete_records_survive() {
    let dir = temp_dir("torn");
    let path = dir.join("ledger.applied");
    {
        let mut ledger = FileApplyLedger::open(&path).unwrap();
        assert!(ledger.record("cs-1").unwrap());
        assert!(ledger.record("cs-2").unwrap());
    }
    // Simulate a crash mid-append: a partial record with no newline.
    let mut torn = fs::OpenOptions::new().append(true).open(&path).unwrap();
    use std::io::Write;
    torn.write_all(b"cs-partial-torn-wri").unwrap();
    torn.sync_all().unwrap();
    drop(torn);

    let reopened = FileApplyLedger::open(&path).unwrap();
    assert!(reopened.contains("cs-1"), "complete record 1 survives");
    assert!(reopened.contains("cs-2"), "complete record 2 survives");
    assert!(
        !reopened.contains("cs-partial-torn-wri"),
        "partial tail must be discarded"
    );
    assert_eq!(reopened.len(), 2);

    // The torn bytes were removed, so a new record appends cleanly.
    let mut resumed = reopened;
    assert!(resumed.record("cs-3").unwrap());
    drop(resumed);
    let final_ledger = FileApplyLedger::open(&path).unwrap();
    assert!(final_ledger.contains("cs-3"));
    assert_eq!(final_ledger.len(), 3);
    let bytes = fs::read(&path).unwrap();
    assert!(
        bytes.ends_with(b"cs-3\n"),
        "file must end with a complete record after repair"
    );
    fs::remove_dir_all(&dir).unwrap();
}

/// (4) empty and missing files open clean.
#[test]
fn empty_and_missing_files_open_clean() {
    let dir = temp_dir("clean");
    let empty_path = dir.join("empty.applied");
    fs::write(&empty_path, b"").unwrap();
    let empty = FileApplyLedger::open(&empty_path).unwrap();
    assert_eq!(empty.len(), 0);
    assert!(empty.is_empty());
    assert!(!empty.contains("cs-1"));

    let missing_path = dir.join("missing.applied");
    let missing = FileApplyLedger::open(&missing_path).unwrap();
    assert_eq!(missing.len(), 0);
    assert!(!missing.contains("cs-1"));
    // A record into the fresh file works and is durable on reopen.
    let mut missing = missing;
    assert!(missing.record("cs-1").unwrap());
    drop(missing);
    let reopened = FileApplyLedger::open(&missing_path).unwrap();
    assert!(reopened.contains("cs-1"));
    fs::remove_dir_all(&dir).unwrap();
}

/// (5) end-to-end: apply_durable applies a real change set, the id survives a
/// reopen, and the same id applied again is a duplicate with epoch unchanged.
#[test]
fn apply_durable_is_idempotent_across_reopen() {
    let dir = temp_dir("e2e");
    let path = dir.join("ledger.applied");
    let mut g = seed_graph();

    let mut ledger = FileApplyLedger::open(&path).unwrap();
    let cs = cs_put_two();
    let first = apply_durable(&mut g, &cs, &mut ledger).unwrap();
    assert!(!first.duplicate);
    assert_eq!(first.applied, 3);
    assert!(g.node("a").is_some() && g.edge("ab").is_some());
    let epoch_after_first = g.epoch();
    drop(ledger);

    // Cross-process simulation: reopen the ledger fresh, replay the same set.
    let mut ledger2 = FileApplyLedger::open(&path).unwrap();
    let replay = apply_durable(&mut g, &cs, &mut ledger2).unwrap();
    assert!(replay.duplicate, "replay after reopen must be a duplicate");
    assert_eq!(replay.applied, 0);
    assert_eq!(replay.skipped, 0);
    assert!(replay.invalidation_set.is_empty());
    assert!(replay.tombstones.is_empty());
    assert_eq!(
        g.epoch(),
        epoch_after_first,
        "duplicate replay must not bump the graph epoch"
    );
    assert_eq!(g.node_count(), 3);
    assert_eq!(g.edge_count(), 1);
    fs::remove_dir_all(&dir).unwrap();
}

/// (6) a failed apply (missing edge endpoint) leaves the ledger unchanged and
/// the change set re-appliable after the repair.
#[test]
fn failed_apply_does_not_record_and_stays_reappliable() {
    let dir = temp_dir("failed");
    let path = dir.join("ledger.applied");
    let mut g = seed_graph();
    g.put_node(node("a")).unwrap();
    let mut ledger = FileApplyLedger::open(&path).unwrap();

    // "a" is seeded but "missing" is not: the edge op fails.
    let cs = GraphChangeSet::new("cs-fail", "web-feed").put_edge(Edge::new(
        "bad",
        "a",
        "depends_on",
        "missing",
    ));
    assert!(
        apply_durable(&mut g, &cs, &mut ledger).is_err(),
        "missing endpoint must fail the apply"
    );
    assert!(!ledger.contains("cs-fail"), "failed apply must not record");
    assert_eq!(ledger.len(), 0);
    let bytes_on_disk = fs::read(&path).unwrap();
    assert!(
        bytes_on_disk.is_empty(),
        "failed apply must not append to the ledger file"
    );

    // Repair: add the missing node, then the same change set applies.
    g.put_node(node("missing")).unwrap();
    let retry = apply_durable(&mut g, &cs, &mut ledger).unwrap();
    assert!(!retry.duplicate);
    assert_eq!(retry.applied, 1);
    assert!(ledger.contains("cs-fail"));
    assert!(g.edge("bad").is_some());
    fs::remove_dir_all(&dir).unwrap();
}

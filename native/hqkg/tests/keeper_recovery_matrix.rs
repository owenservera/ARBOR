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
/// "universal tail refusal is a compatibility decision, not a discovered
/// missing guard".
#[test]
fn legacy_hqj1_tail_is_recovered_by_the_next_snapshot_write() {
    let path = tmp_journal("hqj1-tail");
    let journal = Journal::new(&path);

    let mut g = Graph::new();
    g.put_node(
        Node::new("x", NodeKind::Fact, "First")
            .property("k", "v")
            .source("paper:1"),
    )
    .unwrap();
    journal.save(&g).unwrap();
    let verified = journal.status().unwrap().verified_bytes;

    // Simulate an interrupted legacy append: the frame magic is on disk but
    // the payload never arrived.
    let mut file = OpenOptions::new().append(true).open(&path).unwrap();
    file.write_all(b"HQJ1").unwrap();
    file.sync_all().unwrap();
    drop(file);

    let status = journal.status().unwrap();
    assert_eq!(
        status.trailing_bytes, 4,
        "the torn legacy tail must stay visible in the journal status"
    );
    // The reader keeps the last committed revision; the torn bytes are
    // ignored, never applied.
    let loaded = journal.load().unwrap();
    assert_eq!(loaded.node_count(), 1);
    assert!(loaded.node("x").is_some());

    // The next snapshot write RECOVERS the legacy tail instead of refusing.
    let mut next = loaded.clone();
    next.put_node(Node::new("y", NodeKind::Dataset, "Second"))
        .unwrap();
    journal.save(&next).unwrap();

    let after = journal.status().unwrap();
    assert_eq!(
        after.trailing_bytes, 0,
        "legacy tail recovery must leave no trailing bytes"
    );
    assert_eq!(after.total_bytes, after.verified_bytes);
    let reloaded = journal.load().unwrap();
    assert_eq!(reloaded.node_count(), 2);
    assert_eq!(reloaded.epoch(), next.epoch());
    // The recovered journal holds the old snapshot plus the new one; the last
    // frame wins on load.
    assert_eq!(
        after.total_bytes,
        verified + 20 + serialize(&next).unwrap().len() as u64
    );
    let _ = std::fs::remove_file(path);
}

/// (2) An interrupted HQD1 delta tail is refused.
///
/// CHARACTERISATION of the two different boundaries:
///   * `Journal::status` DETECTS the interruption (`trailing_bytes > 0`);
///   * `Journal::load` is deliberately TOLERANT - it returns the last
///     verified prefix and never applies a torn delta (`src/lib.rs:869-919`);
///   * `Journal::save` REFUSES - `Error::Corrupt("web delta tail requires
///     explicit repair")` (`src/lib.rs:1049-1062`). The refusal is the
///     contract: an unrepaired delta tail must not be silently overwritten.
#[test]
fn interrupted_hqd1_delta_tail_is_refused_at_the_write_boundary() {
    let path = tmp_journal("hqd1-tail");
    let journal = Journal::new(&path);

    let mut base = Graph::new();
    base.put_node(Node::new("x", NodeKind::Fact, "Base"))
        .unwrap();
    journal.save(&base).unwrap();
    let verified = journal.status().unwrap().verified_bytes;

    // Append one complete delta frame, then cut it short to imitate an
    // interrupted append.
    let mut delta = Graph::new();
    delta
        .put_node(Node::new("delta-node", NodeKind::Fact, "Delta"))
        .unwrap();
    journal.append_delta(&delta, verified).unwrap();
    let complete = std::fs::metadata(&path).unwrap().len();
    OpenOptions::new()
        .write(true)
        .open(&path)
        .unwrap()
        .set_len(complete - 8)
        .unwrap();
    let torn = complete - 8;

    let status = journal.status().unwrap();
    assert_eq!(
        status.verified_bytes, verified,
        "only the committed HQJ1 prefix is verified"
    );
    assert!(
        status.trailing_bytes > 0,
        "the interrupted delta must be visible as trailing bytes"
    );

    // The reader keeps the last verified revision and never applies the
    // torn delta.
    let loaded = journal.load().unwrap();
    assert_eq!(loaded.node_count(), 1);
    assert!(
        loaded.node("delta-node").is_none(),
        "a torn delta must never be applied"
    );

    // THE REFUSAL: a snapshot write over an unrepaired delta tail fails
    // closed.
    let mut next = loaded.clone();
    next.put_node(Node::new("y", NodeKind::Fact, "Next"))
        .unwrap();
    match journal.save(&next) {
        Err(Error::Corrupt(message)) => assert!(
            message.contains("explicit repair"),
            "unexpected refusal message: {message}"
        ),
        other => panic!("expected a Corrupt refusal for an interrupted delta tail, got {other:?}"),
    }
    assert_eq!(
        std::fs::metadata(&path).unwrap().len(),
        torn,
        "a refused save must not touch the journal"
    );

    // Explicit operator repair truncates the torn tail; only then may the
    // snapshot writer proceed.
    let removed = journal.repair_torn_tail(loaded.epoch()).unwrap();
    assert_eq!(removed, torn - verified);
    assert_eq!(journal.status().unwrap().trailing_bytes, 0);
    journal.save(&next).unwrap();
    assert_eq!(journal.load().unwrap().node_count(), 2);
    let _ = std::fs::remove_file(path);
}

/// (3) Save/load round trip preserves nodes, edges, epoch and tombstones
/// exactly.
///
/// The tombstone is characterised precisely: it is NOT a graph or journal
/// field. A tombstone is a *record* produced by a change set and carried in
/// `ApplyReport` (`src/graph_change_set.rs:21-29`). What the round trip
/// preserves is the deletion itself (the node and its cascaded edges stay
/// gone) plus the exact node/edge/epoch state.
#[test]
fn save_load_round_trip_preserves_nodes_edges_epoch_and_the_tombstone_effect() {
    let mut graph = Graph::new();
    let mut ledger = ApplyLedger::new();

    let build = GraphChangeSet::new("cs-round-trip", "fixture")
        .put_node(
            Node::new("a", NodeKind::Fact, "A")
                .property("k", "v")
                .source("paper:1"),
        )
        .put_node(Node::new("b", NodeKind::Fact, "B").source("paper:2"))
        .put_node(Node::new("c", NodeKind::Fact, "C"))
        .put_edge(Edge::new("ab", "a", "depends_on", "b"))
        .put_edge(Edge::new("bc", "b", "depends_on", "c"));
    let report = apply(&mut graph, &build, &mut ledger).unwrap();
    assert_eq!(report.applied, 5);
    assert_eq!(graph.node_count(), 3);
    assert_eq!(graph.edge_count(), 2);

    // A second change set deletes "b": its incident edges cascade away and a
    // tombstone record is produced.
    let delete = GraphChangeSet::new("cs-delete-b", "fixture").remove_node("b", "obsolete", 42);
    let deletion = apply(&mut graph, &delete, &mut ledger).unwrap();
    assert_eq!(deletion.applied, 1);
    assert_eq!(deletion.tombstones.len(), 1);
    assert_eq!(deletion.tombstones[0].entity_id, "b");
    assert_eq!(deletion.tombstones[0].reason, "obsolete");
    assert_eq!(deletion.tombstones[0].ts, 42);
    assert_eq!(graph.node_count(), 2);
    assert_eq!(graph.edge_count(), 0);

    let path = tmp_journal("round-trip");
    let journal = Journal::new(&path);
    journal.save(&graph).unwrap();
    let reloaded = journal.load().unwrap();

    assert_eq!(
        reloaded.epoch(),
        graph.epoch(),
        "epoch must survive the round trip"
    );
    assert_eq!(reloaded.node_count(), 2);
    assert_eq!(reloaded.edge_count(), 0);
    let a = reloaded.node("a").expect("node a survives");
    assert_eq!(a.kind, NodeKind::Fact);
    assert_eq!(a.title, "A");
    assert_eq!(a.properties.get("k").map(String::as_str), Some("v"));
    assert!(a.sources.contains("paper:1"));
    assert_eq!(a.version, graph.node("a").unwrap().version);
    assert!(
        reloaded.node("b").is_none(),
        "the deleted node stays deleted"
    );
    assert!(
        reloaded.edge("ab").is_none(),
        "the cascaded edge stays deleted"
    );
    assert!(
        reloaded.edge("bc").is_none(),
        "the cascaded edge stays deleted"
    );
    reloaded.check_indexes().unwrap();

    // The tombstone record itself is not persisted anywhere: it exists only
    // in the apply report (the graph/journal carry no tombstone field).
    assert_eq!(deletion.tombstones.len(), 1);
    let _ = std::fs::remove_file(path);
}

/// (4) Stale-writer / epoch-CAS refusal.
///
/// An epoch-CAS refusal API DOES exist, so this case is exercised rather
/// than omitted. It lives on the JOURNAL, not on the graph:
///   * `Journal::save` refuses a graph whose epoch is not newer than the
///     committed one (`src/lib.rs:1063-1065`);
///   * `Journal::append_delta` uses a file-length CAS (`src/lib.rs:1011-1015`);
///   * `Journal::repair_torn_tail` uses an epoch CAS (`src/lib.rs:958-963`);
///   * `Journal::compact_verified` uses a byte+epoch CAS
///     (`src/lib.rs:1125-1135`).
/// There is no separate `Graph`-level compare-and-swap write API; that is
/// why the CAS is asserted at the journal boundary.
#[test]
fn journal_save_refuses_a_stale_or_unchanged_epoch() {
    let path = tmp_journal("stale-writer");
    let journal = Journal::new(&path);

    let mut g = Graph::new();
    g.put_node(Node::new("x", NodeKind::Fact, "X")).unwrap();
    journal.save(&g).unwrap();
    let committed = g.epoch();
    assert_eq!(committed, 1);

    // A stale writer (older epoch) is refused.
    let stale = Graph::new();
    assert_eq!(stale.epoch(), 0);
    match journal.save(&stale) {
        Err(Error::Conflict(message)) => assert!(
            message.contains("epoch"),
            "unexpected stale-writer message: {message}"
        ),
        other => panic!("expected a stale-epoch refusal, got {other:?}"),
    }

    // An unchanged epoch (a second writer on the same revision) is refused
    // just the same.
    match journal.save(&g) {
        Err(Error::Conflict(message)) => assert!(
            message.contains("epoch"),
            "unexpected unchanged-epoch message: {message}"
        ),
        other => panic!("expected an unchanged-epoch refusal, got {other:?}"),
    }

    // A strictly newer epoch is accepted.
    let mut next = g.clone();
    next.put_node(Node::new("y", NodeKind::Fact, "Y")).unwrap();
    assert!(next.epoch() > committed);
    journal.save(&next).unwrap();
    assert_eq!(journal.load().unwrap().node_count(), 2);
    let _ = std::fs::remove_file(path);
}

/// (4 continued) The byte CAS of `append_delta` and the epoch CAS of
/// `repair_torn_tail`.
#[test]
fn append_and_repair_refuse_stale_byte_and_epoch_expectations() {
    let path = tmp_journal("cas");
    let journal = Journal::new(&path);

    let mut base = Graph::new();
    base.put_node(Node::new("x", NodeKind::Fact, "X")).unwrap();
    journal.save(&base).unwrap();
    let total = journal.status().unwrap().total_bytes;

    // Byte CAS: a writer that expects the wrong file length is refused.
    let mut delta = Graph::new();
    delta.put_node(Node::new("d", NodeKind::Fact, "D")).unwrap();
    match journal.append_delta(&delta, total - 1) {
        Err(Error::Conflict(message)) => assert!(
            message.contains("journal changed"),
            "unexpected byte-CAS message: {message}"
        ),
        other => panic!("expected a byte-CAS refusal, got {other:?}"),
    }
    assert_eq!(
        journal.status().unwrap().total_bytes,
        total,
        "a refused append must not write"
    );

    // Now append for real and cut the frame short, to give the repair path a
    // torn tail to work on.
    journal.append_delta(&delta, total).unwrap();
    let complete = std::fs::metadata(&path).unwrap().len();
    OpenOptions::new()
        .write(true)
        .open(&path)
        .unwrap()
        .set_len(complete - 8)
        .unwrap();
    let torn = complete - 8;

    // Epoch CAS: a stale expected epoch is refused and nothing is truncated.
    match journal.repair_torn_tail(base.epoch() + 99) {
        Err(Error::Conflict(message)) => assert!(
            message.contains("epoch"),
            "unexpected repair-CAS message: {message}"
        ),
        other => panic!("expected an epoch-CAS refusal, got {other:?}"),
    }
    assert_eq!(
        std::fs::metadata(&path).unwrap().len(),
        torn,
        "a refused repair must not truncate the journal"
    );

    // The observed epoch repairs the tail.
    assert_eq!(
        journal.repair_torn_tail(base.epoch()).unwrap(),
        torn - total
    );
    assert_eq!(journal.status().unwrap().trailing_bytes, 0);
    let _ = std::fs::remove_file(path);
}

/// (5) Deleting a node cascades its incident edges.
///
/// CHARACTERISATION OF THE ACTUAL BEHAVIOUR (`src/lib.rs:304-325`):
/// `Graph::remove_node` removes EVERY incident edge, whoever owns it. The
/// graph applies no per-source ownership fence to deletion.
///
/// OPEN POLICY QUESTION (cross-source incident-edge deletion):
/// should removing a node delete incident edges owned by ANOTHER source (here
/// "other/producer"), or should such edges survive / be re-homed / be
/// refused? The crate currently answers "delete" unconditionally. STRATEGY.md
/// priority 4 and WORKPLAN.md section 4 record this as an owner decision
/// ("decide cross-source incident-edge deletion policy"), so the test
/// documents the current answer instead of asserting a desired one.
#[test]
fn deleting_a_node_cascades_every_incident_edge_including_another_sources() {
    let mut g = Graph::new();
    g.put_node(Node::new("a", NodeKind::Fact, "A")).unwrap();
    g.put_node(Node::new("b", NodeKind::Fact, "B")).unwrap();

    // A foreign-owned edge can only be minted through the importer path: the
    // public write path refuses the reserved `hqkg.` prefix.
    let mut foreign = Edge::new("ab", "a", "depends_on", "b");
    foreign
        .properties
        .insert("hqkg.exchange.source".into(), "other/producer".into());
    let other = Exchange {
        manifest: Manifest {
            source: "other/producer".into(),
            digest: String::new(),
            node_count: 0,
            edge_count: 1,
            tombstone_count: 0,
            reconcile_edges: false,
        },
        nodes: Default::default(),
        edges: [(foreign.id.clone(), foreign)].into_iter().collect(),
        tombstones: Default::default(),
    };
    other.apply(&mut g).unwrap();
    assert_eq!(g.edge_count(), 1);
    assert_eq!(
        g.edge("ab").unwrap().properties["hqkg.exchange.source"],
        "other/producer"
    );

    // Deleting "a" cascades the incident edge away - INCLUDING the edge owned
    // by a different source. This is the current, unqualified behaviour.
    assert!(g.remove_node("a").unwrap());
    assert!(g.node("a").is_none());
    assert!(
        g.edge("ab").is_none(),
        "CURRENT behaviour: a foreign-owned incident edge is cascaded away too"
    );
    assert_eq!(g.edge_count(), 0);
    g.check_indexes().unwrap();

    // The same holds for the importer-grade tombstone path: a source's own
    // tombstone removes the node and every incident edge, foreign-owned ones
    // included.
    let id_a = hq_id("a");
    let id_b = hq_id("b");
    let payload = exchange_bytes("owner/producer", &[(&id_a, "A"), (&id_b, "B")], &[]);
    let exchange = parse(&payload).unwrap();
    let mut owned = Graph::new();
    exchange.apply(&mut owned).unwrap();
    let mut foreign_edge = Edge::new("foreign-edge", &id_a, "links_to", &id_b);
    foreign_edge
        .properties
        .insert("hqkg.exchange.source".into(), "other/producer".into());
    let other = Exchange {
        manifest: Manifest {
            source: "other/producer".into(),
            digest: String::new(),
            node_count: 0,
            edge_count: 1,
            tombstone_count: 0,
            reconcile_edges: false,
        },
        nodes: Default::default(),
        edges: [(foreign_edge.id.clone(), foreign_edge)]
            .into_iter()
            .collect(),
        tombstones: Default::default(),
    };
    other.apply(&mut owned).unwrap();
    assert_eq!(owned.edge_count(), 1);
    // The tombstone exchange is built separately so that the manifest counts
    // match its body.
    let body = format!("{{\"id\":\"{id_a}\",\"reason\":\"deleted\",\"type\":\"tombstone\"}}\n");
    let digest = format!("{:x}", Sha256::digest(body.as_bytes()));
    let payload = format!(
        "{{\"authority\":\"data-only; no executable code or provider actions\",\"edge_count\":0,\"graph_sha256\":\"{digest}\",\"node_count\":0,\"schema\":\"repos-hq.hqkg-exchange/1\",\"source\":\"owner/producer\",\"tombstone_count\":1,\"type\":\"manifest\"}}\n{body}"
    );
    let deletion = parse(payload.as_bytes()).unwrap();
    let stats = deletion.apply(&mut owned).unwrap();
    assert_eq!(stats.nodes_deleted, 1);
    assert!(owned.node(&id_a).is_none());
    assert!(
        owned.edge("foreign-edge").is_none(),
        "CURRENT behaviour: the tombstone cascade also removes the foreign-owned edge"
    );
    assert_eq!(owned.edge_count(), 0);
}

/// (6) An idempotent replay bumps no epoch while a real mutation does.
#[test]
fn idempotent_replay_does_not_bump_the_epoch_but_a_real_mutation_does() {
    let id_a = hq_id("a");
    let id_b = hq_id("b");
    let edge = hq_id("c");
    let payload = exchange_bytes(
        "repos-hq/agentic-knowledge-graph",
        &[(&id_a, "First"), (&id_b, "Second")],
        &[(&edge, &id_a, &id_b, "HAS_SECTION")],
    );
    let exchange = parse(&payload).unwrap();

    let mut g = Graph::new();
    let first = exchange.apply(&mut g).unwrap();
    assert_eq!(first.nodes_inserted, 2);
    assert_eq!(first.edges_inserted, 1);
    let epoch = g.epoch();

    // Replay: nothing changes and the epoch does not move.
    let replay = exchange.apply(&mut g).unwrap();
    assert_eq!(replay.nodes_unchanged, 2);
    assert_eq!(replay.edges_unchanged, 1);
    assert!(!replay.changed());
    assert_eq!(
        g.epoch(),
        epoch,
        "an idempotent exchange replay must not bump the epoch"
    );

    // A real mutation bumps the epoch by exactly one.
    g.put_node(Node::new("local", NodeKind::Fact, "Local"))
        .unwrap();
    assert_eq!(g.epoch(), epoch + 1);

    // A change-set replay through the ledger is equally inert.
    let mut ledger = ApplyLedger::new();
    let cs =
        GraphChangeSet::new("cs-1", "fixture").put_node(Node::new("cs-node", NodeKind::Fact, "CS"));
    let report = apply(&mut g, &cs, &mut ledger).unwrap();
    assert!(!report.duplicate);
    assert_eq!(report.applied, 1);
    let epoch = g.epoch();
    let duplicate = apply(&mut g, &cs, &mut ledger).unwrap();
    assert!(duplicate.duplicate);
    assert_eq!(duplicate.applied, 0);
    assert_eq!(
        g.epoch(),
        epoch,
        "a ledgered replay must not bump the epoch"
    );

    // And a removal of an already-absent entity is a skip, not a mutation.
    let epoch = g.epoch();
    let removal = GraphChangeSet::new("cs-2", "fixture").remove_node("not-there", "absent", 7);
    let report = apply(&mut g, &removal, &mut ledger).unwrap();
    assert_eq!(report.applied, 0);
    assert_eq!(report.skipped, 1);
    assert_eq!(g.epoch(), epoch);
}

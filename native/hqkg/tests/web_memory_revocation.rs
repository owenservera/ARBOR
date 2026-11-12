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
}

fn query(memory: &WebMemory, limit: usize, after: u64) -> Value {
    memory
        .query(&Query {
            limit,
            after_cursor: after,
            ..Query::default()
        })
        .unwrap()
}

#[test]
fn revoked_visit_is_absent_from_query_output() {
    // RED: a revocation tombstone beside the visit must take the visit out of query output.
    let f = tmp("tombstone-query");
    let mut g = Graph::new();
    g.put_node(visit_node()).unwrap();
    g.put_node(tombstone_node(INSTALLATION, EVENT_ID)).unwrap();
    Journal::new(&f).save(&g).unwrap();
    let doc = query(&open(&f), 10, 0);
    assert_eq!(
        doc["results"].as_array().unwrap().len(),
        0,
        "revoked visit is still returned by query: {doc}"
    );
    fs::remove_file(f).unwrap();
}

fn revocation_request(id: &str) -> hqkg::web_memory::RevocationRequest {
    hqkg::web_memory::RevocationRequest {
        id: id.into(),
        installation: None,
        reason: None,
    }
}

fn sample_for(installation: &str, event_id: &str, url: &str) -> Vec<u8> {
    serde_json::to_vec(&json!({
        "schema": "vivim.browser-companion/1",
        "installationId": installation,
        "sessionId": installation,
        "events": [{
            "id": event_id,
            "type": "visit.observed",
            "at": "2026-11-04T10:00:00.000Z",
            "page": {"browserTabId": 7, "site": "example.org", "url": url}
        }]
    }))
    .unwrap()
}

#[test]
fn the_crate_revocation_schema_matches_the_wire_format() {
    assert_eq!(
        hqkg::web_memory::REVOCATION_SCHEMA,
        REVOCATION_SCHEMA_ID,
        "the tombstone schema drifted from the fixture contract"
    );
}

#[test]
fn revocation_is_durable_across_a_save_and_load_round_trip() {
    let f = tmp("durable");
    let mut memory = open(&f);
    memory.accept(&parse_batch(&sample()).unwrap()).unwrap();
    let epoch_before = memory.graph().epoch();
    let bytes_before = memory.bytes();
    let receipt = memory.revoke(&revocation_request(VISIT_NODE_ID)).unwrap();
    assert!(receipt.revoked, "{receipt:?}");
    assert!(
        receipt.epoch > epoch_before,
        "revocation did not bump the epoch: {receipt:?}"
    );
    assert!(
        memory.bytes() > bytes_before,
        "revocation wrote nothing to the journal"
    );

    // Restart: the tombstone is still in force and the epoch survived.
    let reopened = open(&f);
    assert_eq!(
        query(&reopened, 10, 0)["results"].as_array().unwrap().len(),
        0,
        "a revoked visit came back after a restart"
    );
    assert_eq!(reopened.graph().epoch(), receipt.epoch);
    assert_eq!(
        Journal::new(&f).status().unwrap().epoch,
        receipt.epoch,
        "the journal epoch does not match the revocation receipt"
    );
    assert!(
        reopened
            .graph()
            .node(&format!("web:revocation:{}:{}", INSTALLATION, EVENT_ID))
            .is_some(),
        "the revocation tombstone is not durable"
    );
    // Documented residual: the visit node itself stays in the graph, so a
    // graph-level search for the revoked id can still find it. Revocation is
    // query-level and phone-level absence.
    assert!(
        reopened.graph().node(VISIT_NODE_ID).is_some(),
        "the visit node was rewritten instead of tombstoned"
    );
    fs::remove_file(f).unwrap();
}

#[test]
fn a_revocation_survives_a_legacy_snapshot_save_and_load() {
    // The literal journal save/load round trip: a legacy snapshot writer takes
    // the loaded graph, bumps the epoch and writes it back. The tombstone must
    // survive that rewrite, or the revocation would silently lapse.
    let f = tmp("snapshot-round-trip");
    let mut memory = open(&f);
    memory.accept(&parse_batch(&sample()).unwrap()).unwrap();
    let receipt = memory.revoke(&revocation_request(VISIT_NODE_ID)).unwrap();
    assert!(receipt.revoked, "{receipt:?}");

    let journal = Journal::new(&f);
    let mut reloaded = journal.load().unwrap();
    assert!(
        reloaded
            .node(&format!("web:revocation:{}:{}", INSTALLATION, EVENT_ID))
            .is_some(),
        "the loaded graph lost the tombstone"
    );
    reloaded
        .put_node(Node::new(
            "legacy:after-revocation",
            NodeKind::Fact,
            "later knowledge",
        ))
        .unwrap();
    journal.save(&reloaded).unwrap();

    let reopened = open(&f);
    assert!(
        reopened
            .graph()
            .node(&format!("web:revocation:{}:{}", INSTALLATION, EVENT_ID))
            .is_some(),
        "the tombstone was lost in the snapshot rewrite"
    );
    assert_eq!(
        query(&reopened, 10, 0)["results"].as_array().unwrap().len(),
        0,
        "a revoked visit came back after a snapshot save/load round trip"
    );
    // A stale replay still cannot resurrect it after the rewrite.
    let mut memory = open(&f);
    assert_eq!(
        memory
            .accept(&parse_batch(&sample()).unwrap())
            .unwrap()
            .inserted,
        0
    );
    fs::remove_file(f).unwrap();
}

#[test]
fn revoking_twice_is_idempotent() {
    let f = tmp("idempotent");
    let mut memory = open(&f);
    memory.accept(&parse_batch(&sample()).unwrap()).unwrap();
    let first = memory.revoke(&revocation_request(VISIT_NODE_ID)).unwrap();
    assert!(first.revoked, "{first:?}");
    let bytes = memory.bytes();
    let epoch = memory.graph().epoch();
    let second = memory.revoke(&revocation_request(VISIT_NODE_ID)).unwrap();
    assert!(!second.revoked, "{second:?}");
    assert!(second.already_revoked, "{second:?}");
    assert!(!second.unknown, "{second:?}");
    assert_eq!(second.epoch, epoch, "an idempotent revoke moved the epoch");
    assert_eq!(
        memory.bytes(),
        bytes,
        "an idempotent revoke grew the journal"
    );
    assert_eq!(
        query(&memory, 10, 0)["results"].as_array().unwrap().len(),
        0
    );
    fs::remove_file(f).unwrap();
}

#[test]
fn revoking_an_unknown_id_is_a_no_op() {
    let f = tmp("unknown");
    let mut memory = open(&f);
    memory.accept(&parse_batch(&sample()).unwrap()).unwrap();
    let bytes = memory.bytes();
    let epoch = memory.graph().epoch();
    let receipt = memory
        .revoke(&revocation_request("99999999-1234-4234-8234-123456789012"))
        .unwrap();
    assert!(receipt.unknown, "{receipt:?}");
    assert!(!receipt.revoked, "{receipt:?}");
    assert!(!receipt.already_revoked, "{receipt:?}");
    assert_eq!(receipt.epoch, epoch, "an unknown revoke moved the epoch");
    assert_eq!(memory.bytes(), bytes, "an unknown revoke grew the journal");
    // The real visit is untouched.
    assert_eq!(
        query(&memory, 10, 0)["results"].as_array().unwrap().len(),
        1
    );
    fs::remove_file(f).unwrap();
}

#[test]
fn a_stale_replay_cannot_resurrect_a_revoked_visit() {
    let f = tmp("replay");
    let mut memory = open(&f);
    let visits = parse_batch(&sample()).unwrap();
    memory.accept(&visits).unwrap();
    memory.revoke(&revocation_request(VISIT_NODE_ID)).unwrap();
    let replay = memory.accept(&visits).unwrap();
    assert_eq!(replay.inserted, 0, "a stale replay resurrected the visit");
    assert_eq!(
        query(&memory, 10, 0)["results"].as_array().unwrap().len(),
        0
    );
    // And the same holds after a restart.
    assert_eq!(
        query(&open(&f), 10, 0)["results"].as_array().unwrap().len(),
        0
    );
    fs::remove_file(f).unwrap();
}

#[test]
fn a_revocation_is_scoped_to_the_owning_installation() {
    const OTHER: &str = "87654321-1234-4234-8234-123456789012";
    let f = tmp("scoped");
    let mut memory = open(&f);
    memory
        .accept(
            &parse_batch(&sample_for(
                INSTALLATION,
                EVENT_ID,
                "https://example.org/articles/1",
            ))
            .unwrap(),
        )
        .unwrap();
    memory
        .accept(
            &parse_batch(&sample_for(
                OTHER,
                EVENT_ID,
                "https://example.org/articles/2",
            ))
            .unwrap(),
        )
        .unwrap();
    // A bare event id that names two installations is ambiguous: fail closed.
    let err = memory.revoke(&revocation_request(EVENT_ID)).unwrap_err();
    assert!(matches!(err, hqkg::Error::Invalid(_)), "{err:?}");
    // Scoped to one installation it resolves.
    let receipt = memory
        .revoke(&hqkg::web_memory::RevocationRequest {
            id: EVENT_ID.into(),
            installation: Some(OTHER.into()),
            reason: None,
        })
        .unwrap();
    assert!(receipt.revoked, "{receipt:?}");
    let rows = query(&memory, 10, 0);
    assert_eq!(rows["results"].as_array().unwrap().len(), 1);
    assert_eq!(rows["results"][0]["installationId"], INSTALLATION);
    fs::remove_file(f).unwrap();
}

#[test]
fn only_a_browser_companion_visit_can_be_revoked() {
    let f = tmp("ownership");
    let mut g = Graph::new();
    g.put_node(
        Node::new(VISIT_NODE_ID, NodeKind::Document, "example.org")
            .property("source", "some-other-producer")
            .property("url", "https://example.org/articles/1")
            .property("observedAt", "2026-11-04T10:00:00.000Z")
            .property("site", "example.org")
            .property("cursor", "1"),
    )
    .unwrap();
    Journal::new(&f).save(&g).unwrap();
    let mut memory = open(&f);
    let err = memory
        .revoke(&revocation_request(VISIT_NODE_ID))
        .unwrap_err();
    assert!(matches!(err, hqkg::Error::Conflict(_)), "{err:?}");
    fs::remove_file(f).unwrap();
}

#[test]
fn a_malformed_revocation_id_is_refused() {
    let f = tmp("malformed");
    let mut memory = open(&f);
    memory.accept(&parse_batch(&sample()).unwrap()).unwrap();
    for bad in ["not-a-uuid", "web:visit:1234:5678", ""] {
        let err = memory.revoke(&revocation_request(bad)).unwrap_err();
        assert!(matches!(err, hqkg::Error::Invalid(_)), "{bad}: {err:?}");
    }
    // A malformed reason is refused too.
    let err = memory
        .revoke(&hqkg::web_memory::RevocationRequest {
            id: VISIT_NODE_ID.into(),
            installation: None,
            reason: Some("line\nbreak".into()),
        })
        .unwrap_err();
    assert!(matches!(err, hqkg::Error::Invalid(_)), "{err:?}");
    fs::remove_file(f).unwrap();
}

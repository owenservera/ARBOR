#![cfg(feature = "importer")]
//! @hq:context Recovery, dedupe, query and scale proof for browser metadata deltas.
//! @hq:owner repos-hq
use hqkg::web_memory::{parse_batch, Query, WebMemory};
use hqkg::{Graph, Journal, Node, NodeKind};
use serde_json::{json, Value};
use std::{fs, io::Write, path::PathBuf, time::Instant};

fn tmp(label: &str) -> PathBuf {
    let f = std::env::temp_dir().join(format!("hqkg-web-{}-{}.hqj", std::process::id(), label));
    let _ = fs::remove_file(&f);
    let _ = fs::remove_file(f.with_extension("hqkg.lock"));
    f
}
fn sample(start: usize, count: usize) -> Vec<u8> {
    let mut events = Vec::new();
    for i in start..start + count {
        events.push(json!({"id":format!("{:08x}-1234-4234-8234-123456789012",i),
            "type":"visit.observed","at":format!("2026-11-04T{:02}:{:02}:{:02}.000Z",i/3600%24,i/60%60,i%60),
            "page":{"browserTabId":i%1000,"site":"example.org",
                "url":format!("https://example.org/articles/{}",i)}}));
    }
    serde_json::to_vec(&json!({"schema":"vivim.browser-companion/1",
        "installationId":"12345678-1234-4234-8234-123456789012",
        "sessionId":"12345678-1234-4234-8234-123456789012",
        "events":events}))
    .unwrap()
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
fn replay_rejects_conflicts_and_never_grows_on_duplicates() {
    let f = tmp("idempotent");
    let mut memory = open(&f);
    let input = parse_batch(&sample(1, 2)).unwrap();
    let first = memory.accept(&input).unwrap();
    assert_eq!((first.inserted, first.duplicates), (2, 0));
    let bytes = memory.bytes();
    let epoch = memory.graph().epoch();
    let same = memory.accept(&input).unwrap();
    assert_eq!((same.inserted, same.duplicates), (0, 2));
    assert_eq!((memory.bytes(), memory.graph().epoch()), (bytes, epoch));
    let mut conflict = input.clone();
    conflict[0].url = "https://example.org/changed".into();
    // A malformed precomputed digest must fail validation; a valid alternate payload must conflict.
    assert!(memory.accept(&conflict).is_err());
    let mut different = sample(1, 2);
    let mut payload: Value = serde_json::from_slice(&different).unwrap();
    payload["events"][0]["page"]["url"] = json!("https://example.org/changed");
    different = serde_json::to_vec(&payload).unwrap();
    let altered = parse_batch(&different).unwrap();
    assert!(memory.accept(&altered).is_err());
    assert_eq!((memory.bytes(), memory.graph().epoch()), (bytes, epoch));
    let reopened = open(&f);
    assert_eq!(
        query(&reopened, 10, 0)["results"].as_array().unwrap().len(),
        2
    );
    assert_eq!(reopened.graph().check_indexes().is_ok(), true);
    fs::remove_file(f).unwrap();
}
#[test]
fn malformed_batch_is_atomic_and_private_urls_are_refused() {
    let f = tmp("invalid");
    let mut memory = open(&f);
    let base: Value = serde_json::from_slice(&sample(1, 2)).unwrap();
    for bad in [
        "https://example.org/?token=secret",
        "https://user@example.org/",
        "https://other.org/",
        "https://example.org/article#fragment",
    ] {
        let mut data = base.clone();
        data["events"][1]["page"]["url"] = json!(bad);
        assert!(parse_batch(&serde_json::to_vec(&data).unwrap()).is_err());
    }
    let mut data = base.clone();
    data["events"][1]["at"] = json!("2026-02-30T01:00:00.000Z");
    assert!(parse_batch(&serde_json::to_vec(&data).unwrap()).is_err());
    let mut data = base.clone();
    data["events"][1]["id"] = json!("invalid-id");
    assert!(parse_batch(&serde_json::to_vec(&data).unwrap()).is_err());
    assert_eq!(
        memory
            .accept(&parse_batch(&sample(1, 2)).unwrap())
            .unwrap()
            .inserted,
        2
    );
    assert_eq!(
        query(&memory, 10, 0)["results"].as_array().unwrap().len(),
        2
    );
    fs::remove_file(f).unwrap();
}
#[test]
fn torn_delta_tail_requires_explicit_repair_without_false_ack() {
    let f = tmp("torn-tail");
    let mut memory = open(&f);
    memory.accept(&parse_batch(&sample(0, 3)).unwrap()).unwrap();
    let expected_epoch = memory.graph().epoch();
    let before = memory.bytes();
    fs::OpenOptions::new()
        .append(true)
        .open(&f)
        .unwrap()
        .write_all(b"HQD1\x01\x00")
        .unwrap(); // simulated torn header
    let journal = Journal::new(&f);
    let status = journal.status().unwrap();
    assert_eq!(status.trailing_bytes, 6);
    assert_eq!(status.verified_bytes, before);
    assert_eq!(
        journal.load().unwrap().node_count(),
        memory.graph().node_count()
    );
    assert!(WebMemory::open(Journal::new(&f)).is_err());
    assert_eq!(journal.repair_torn_tail(expected_epoch).unwrap(), 6);
    let again = open(&f);
    assert_eq!(query(&again, 10, 0)["results"].as_array().unwrap().len(), 3);
    assert_eq!(again.graph().check_indexes().is_ok(), true);
    fs::remove_file(f).unwrap();
}
#[test]
fn first_frame_crash_is_quarantined_until_operator_repair() {
    let f = tmp("first-tail");
    fs::write(&f, b"HQD1").unwrap();
    let journal = Journal::new(&f);
    let status = journal.status().unwrap();
    assert_eq!(status.epoch, 0);
    assert_eq!(status.trailing_bytes, 4);
    assert!(WebMemory::open(Journal::new(&f)).is_err());
    assert_eq!(journal.repair_torn_tail(0).unwrap(), 4);
    let mut memory = open(&f);
    assert_eq!(
        memory
            .accept(&parse_batch(&sample(0, 1)).unwrap())
            .unwrap()
            .inserted,
        1
    );
    assert_eq!(
        query(&open(&f), 10, 0)["results"].as_array().unwrap().len(),
        1
    );
    fs::remove_file(f).unwrap();
}
#[test]
fn mixed_legacy_snapshot_and_deltas_survive_restart() {
    let f = tmp("legacy");
    let journal = Journal::new(&f);
    let mut prior = Graph::new();
    prior
        .put_node(Node::new("legacy:fact", NodeKind::Fact, "prior knowledge"))
        .unwrap();
    journal.save(&prior).unwrap();
    let mut memory = open(&f);
    assert_eq!(
        memory
            .accept(&parse_batch(&sample(10, 3)).unwrap())
            .unwrap()
            .inserted,
        3
    );
    let mut reloaded = journal.load().unwrap();
    assert!(reloaded.node("legacy:fact").is_some());
    assert_eq!(
        query(&open(&f), 10, 0)["results"].as_array().unwrap().len(),
        3
    );
    reloaded
        .put_node(Node::new("legacy:later", NodeKind::Fact, "later knowledge"))
        .unwrap();
    journal.save(&reloaded).unwrap(); // old snapshot API still works after deltas
    let final_graph = journal.load().unwrap();
    assert!(final_graph.node("legacy:later").is_some());
    assert!(final_graph.check_indexes().is_ok());
    assert_eq!(
        query(&open(&f), 10, 0)["results"].as_array().unwrap().len(),
        3
    );
    fs::remove_file(f).unwrap();
}
#[test]
fn unsafe_legacy_location_is_not_disclosed_in_query() {
    let f = tmp("unsafe-legacy");
    let mut g = Graph::new();
    g.put_node(
        Node::new(
            "web:visit:12345678-1234-4234-8234-123456789012:22345678-1234-4234-8234-123456789012",
            NodeKind::Document,
            "example.org",
        )
        .property("url", "https://example.org/account")
        .property("observedAt", "2026-11-04T00:00:00.000Z")
        .property("source", "vivim.browser-companion"),
    )
    .unwrap();
    Journal::new(&f).save(&g).unwrap();
    let result = query(&open(&f), 10, 0);
    assert_eq!(result["omittedUnsafe"], 1);
    assert_eq!(result["results"].as_array().unwrap().len(), 0);
    fs::remove_file(f).unwrap();
}

/// A revoked row is withheld on purpose, so it is not disclosed and it is not
/// counted as an unsafe omission: the unsafe counter keeps describing exactly
/// the rows the safety check dropped, and nothing else.
#[test]
fn a_revoked_unsafe_row_is_neither_disclosed_nor_counted_as_omitted() {
    const INSTALLATION: &str = "12345678-1234-4234-8234-123456789012";
    const EVENT_ID: &str = "22345678-1234-4234-8234-123456789012";
    let f = tmp("unsafe-revoked");
    let mut g = Graph::new();
    g.put_node(
        Node::new(
            &format!("web:visit:{}:{}", INSTALLATION, EVENT_ID),
            NodeKind::Document,
            "example.org",
        )
        .property("url", "https://example.org/account")
        .property("observedAt", "2026-11-04T00:00:00.000Z")
        .property("source", "vivim.browser-companion"),
    )
    .unwrap();
    g.put_node(
        Node::new(
            &format!("web:revocation:{}:{}", INSTALLATION, EVENT_ID),
            NodeKind::Concept,
            "revoked web visit",
        )
        .property("source", "vivim.browser-companion")
        .property("revocationSchema", "vivim.web-memory-revocation/1")
        .property("installationId", INSTALLATION)
        .property("eventId", EVENT_ID)
        .property(
            "revokedVisit",
            &format!("web:visit:{}:{}", INSTALLATION, EVENT_ID),
        ),
    )
    .unwrap();
    Journal::new(&f).save(&g).unwrap();
    let result = query(&open(&f), 10, 0);
    assert_eq!(result["omittedUnsafe"], 0);
    assert_eq!(result["results"].as_array().unwrap().len(), 0);
    fs::remove_file(f).unwrap();
}
#[test]
fn legacy_snapshot_cannot_erase_unrepaired_web_tail() {
    let f = tmp("no-silent-erasure");
    let mut memory = open(&f);
    memory.accept(&parse_batch(&sample(0, 1)).unwrap()).unwrap();
    let journal = Journal::new(&f);
    let mut valid = journal.load().unwrap();
    fs::OpenOptions::new()
        .append(true)
        .open(&f)
        .unwrap()
        .write_all(b"HQD1")
        .unwrap();
    valid
        .put_node(Node::new("next", NodeKind::Fact, "later"))
        .unwrap();
    assert!(journal.save(&valid).is_err());
    assert_eq!(journal.status().unwrap().trailing_bytes, 4);
    fs::remove_file(f).unwrap();
}
#[test]
fn arbitrary_batch_replay_and_bounded_filtered_query() {
    let f = tmp("batches");
    let mut memory = open(&f);
    let mut offset = 0;
    for size in [1, 7, 32, 3, 28, 1, 32] {
        let batch = parse_batch(&sample(offset, size)).unwrap();
        assert_eq!(memory.accept(&batch).unwrap().inserted, size);
        assert_eq!(memory.accept(&batch).unwrap().inserted, 0);
        offset += size;
    }
    let total = offset;
    let restarted = open(&f);
    assert_eq!(
        query(&restarted, 100, 0)["results"]
            .as_array()
            .unwrap()
            .len(),
        100
    );
    let next = query(&restarted, 100, 0)["nextCursor"].as_u64().unwrap();
    assert_eq!(
        query(&restarted, 100, next)["results"]
            .as_array()
            .unwrap()
            .len(),
        total - 100
    );
    let ranged = restarted
        .query(&Query {
            site: Some("example.org".into()),
            since: Some("2026-11-04T00:00:10.000Z".into()),
            until: Some("2026-11-04T00:00:12.000Z".into()),
            limit: 10,
            after_cursor: 0,
        })
        .unwrap();
    assert_eq!(ranged["results"].as_array().unwrap().len(), 3);
    assert_eq!(ranged["schema"], "vivim.web-memory-query/1");
    assert!(restarted.graph().check_indexes().is_ok());
    assert_eq!(
        restarted
            .graph()
            .nodes()
            .filter(|n| n.id.starts_with("web:visit:"))
            .count(),
        total
    );
    fs::remove_file(f).unwrap();
}
#[test]
fn same_id_conflict_inside_one_batch_commits_nothing() {
    let f = tmp("intrabatch");
    let mut payload: Value = serde_json::from_slice(&sample(4, 2)).unwrap();
    let reused = payload["events"][0]["id"].clone();
    payload["events"][1]["id"] = reused;
    let visits = parse_batch(&serde_json::to_vec(&payload).unwrap()).unwrap();
    let mut memory = open(&f);
    assert!(memory.accept(&visits).is_err());
    assert_eq!(memory.bytes(), 0);
    assert_eq!(memory.graph().node_count(), 0);
}
#[test]
#[ignore = "synthetic stress; run with cargo test --features importer --test web_memory -- --ignored --nocapture"]
fn synthetic_event_stress() {
    let count = std::env::var("HQKG_WEB_BENCH_EVENTS")
        .ok()
        .and_then(|v| v.parse::<usize>().ok())
        .unwrap_or(1000)
        .clamp(1, 100_000);
    let f = tmp("stress");
    let mut memory = open(&f);
    let mut samples = Vec::<u128>::new();
    let started = Instant::now();
    let mut written = 0;
    while written < count {
        let step = (count - written).min(32);
        let visits = parse_batch(&sample(written, step)).unwrap();
        let at = Instant::now();
        assert_eq!(memory.accept(&visits).unwrap().inserted, step);
        samples.push(at.elapsed().as_micros());
        written += step;
    }
    let elapsed = started.elapsed();
    let bytes = memory.bytes();
    samples.sort_unstable();
    let p50 = samples[samples.len() / 2];
    let p95 = samples[((samples.len() - 1) * 95) / 100];
    let replay_at = Instant::now();
    let replayed = open(&f);
    let replay = replay_at.elapsed();
    let nodes = replayed
        .graph()
        .nodes()
        .filter(|n| n.id.starts_with("web:visit:"))
        .count();
    assert_eq!(nodes, count);
    assert!(replayed.graph().check_indexes().is_ok());
    println!("events={} batches={} elapsed_ms={} p50_batch_us={} p95_batch_us={} bytes={} replay_ms={} duplicate_events=0",
        count,samples.len(),elapsed.as_millis(),p50,p95,bytes,replay.as_millis());
    fs::remove_file(f).unwrap();
}

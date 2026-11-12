#![cfg(feature = "importer")]
//! @hq:context Process-boundary proof: the real hqkg-web-feed binary accepts one Studio batch, ACKs it,
//! answers a readback query, and the reloaded journal holds the visit, site and visited-site edge.
//! @hq:owner repos-hq
//! @hq:invariant No injected spawn, no mocked ingress: this test only talks to the built binary.
use hqkg::web_memory::WebMemory;
use hqkg::{Graph, Journal};
use serde_json::{json, Value};
use std::io::Write;
use std::path::PathBuf;
use std::process::{Command, Stdio};

const INSTALLATION: &str = "12345678-1234-4234-8234-123456789012";
const EVENT_ID: &str = "00000001-1234-4234-8234-123456789012";
const SECOND_EVENT_ID: &str = "00000002-1234-4234-8234-123456789012";

fn tmp(label: &str) -> PathBuf {
    let f = std::env::temp_dir().join(format!("hqkg-feed-{}-{}.hqj", std::process::id(), label));
    let _ = std::fs::remove_file(&f);
    let _ = std::fs::remove_file(f.with_extension("hqkg.lock"));
    f
}

/// The exact payload shape Studio's ingress forwards to the binary.
fn payload(url: &str) -> Vec<u8> {
    payload_for(EVENT_ID, url)
}

fn payload_for(event_id: &str, url: &str) -> Vec<u8> {
    serde_json::to_vec(&json!({
        "schema": "vivim.browser-companion/1",
        "installationId": INSTALLATION,
        "sessionId": INSTALLATION,
        "events": [{
            "id": event_id,
            "type": "visit.observed",
            "at": "2026-11-04T10:00:00.000Z",
            "page": {"browserTabId": 7, "site": "example.org", "url": url}
        }]
    }))
    .unwrap()
}

fn feed(bin: &str, journal: &PathBuf, body: &[u8]) -> (bool, String, String) {
    let mut child = Command::new(bin)
        .arg(journal)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("spawn hqkg-web-feed");
    child.stdin.take().unwrap().write_all(body).unwrap();
    let out = child.wait_with_output().unwrap();
    (
        out.status.success(),
        String::from_utf8_lossy(&out.stdout).trim().to_string(),
        String::from_utf8_lossy(&out.stderr).trim().to_string(),
    )
}

/// Run a subcommand against the real binary and return (exit code, stdout, stderr).
fn run(bin: &str, journal: &PathBuf, args: &[&str]) -> (i32, String, String) {
    let out = Command::new(bin)
        .arg(journal)
        .args(args)
        .output()
        .expect("run hqkg-web-feed");
    (
        out.status.code().unwrap_or(-1),
        String::from_utf8_lossy(&out.stdout).trim().to_string(),
        String::from_utf8_lossy(&out.stderr).trim().to_string(),
    )
}

fn query_rows(bin: &str, journal: &PathBuf) -> Vec<Value> {
    let (code, stdout, stderr) = run(bin, journal, &["query", "--limit", "50"]);
    assert_eq!(code, 0, "query failed: {stderr}");
    let doc: Value = serde_json::from_str(&stdout).expect("query did not print JSON");
    doc["results"].as_array().cloned().unwrap_or_default()
}

#[test]
fn real_binary_accepts_one_batch_and_reads_it_back() {
    let bin = env!("CARGO_BIN_EXE_hqkg-web-feed");
    let journal = tmp("process");
    let body = payload("https://example.org/articles/1");

    // 1. A first batch is accepted and durably written before the ACK is printed.
    let (ok, stdout, stderr) = feed(bin, &journal, &body);
    assert!(ok, "binary refused a valid batch: {stderr}");
    let first: Vec<&str> = stdout.split_whitespace().collect();
    assert_eq!(first.len(), 3, "unexpected receipt shape: {stdout}");
    assert_eq!(first[0], "accepted=1");
    assert_eq!(first[1], "inserted=1");
    assert!(first[2]
        .strip_prefix("epoch=")
        .and_then(|n| n.parse::<u64>().ok())
        .is_some_and(|n| n >= 1));

    // 2. Replaying the identical batch is idempotent: accepted, nothing inserted.
    let (ok, stdout, stderr) = feed(bin, &journal, &body);
    assert!(ok, "replay was refused: {stderr}");
    assert_eq!(
        stdout.split_whitespace().take(2).collect::<Vec<_>>(),
        vec!["accepted=1", "inserted=0"]
    );

    // 3. The readback query returns the visit with provenance and a verified digest.
    let query = Command::new(bin)
        .arg(&journal)
        .args(["query", "--limit", "1"])
        .output()
        .expect("run query");
    assert!(
        query.status.success(),
        "query failed: {}",
        String::from_utf8_lossy(&query.stderr)
    );
    let doc: Value = serde_json::from_slice(&query.stdout).expect("query did not print JSON");
    let results = doc["results"]
        .as_array()
        .expect("query has no results array");
    assert_eq!(results.len(), 1, "expected exactly one row: {doc}");
    assert_eq!(results[0]["site"], "example.org");
    assert_eq!(results[0]["url"], "https://example.org/articles/1");
    assert_eq!(results[0]["verified"], true);
    assert!(results[0]["provenance"]
        .as_str()
        .unwrap_or("")
        .contains(INSTALLATION));

    // 4. The journal on disk holds the visit node, the site concept and the edge between them.
    let memory = WebMemory::open(Journal::new(&journal)).expect("reopen journal");
    let graph: &Graph = memory.graph();
    let visit = graph
        .node(&format!("web:visit:{}:{}", INSTALLATION, EVENT_ID))
        .expect("visit node missing");
    assert_eq!(
        visit.properties.get("url").map(String::as_str),
        Some("https://example.org/articles/1")
    );
    assert!(
        graph.nodes().any(|n| n.id.starts_with("web:site:")),
        "site node missing"
    );
    assert!(
        graph.edges().any(|e| e.relation == "visited-site"),
        "visited-site edge missing"
    );

    let _ = std::fs::remove_file(&journal);
    let _ = std::fs::remove_file(journal.with_extension("hqkg.lock"));
}

#[test]
fn real_binary_rejects_a_conflicting_replay_without_growing() {
    let bin = env!("CARGO_BIN_EXE_hqkg-web-feed");
    let journal = tmp("conflict");
    let (ok, _, stderr) = feed(bin, &journal, &payload("https://example.org/articles/1"));
    assert!(ok, "first batch refused: {stderr}");
    let before = std::fs::metadata(&journal).map(|m| m.len()).unwrap_or(0);

    // Same event id, different URL: the binary must refuse and exit non-zero (2).
    let (ok, stdout, stderr) = feed(bin, &journal, &payload("https://example.org/articles/2"));
    assert!(!ok, "conflicting replay was accepted: {stdout}");
    assert!(
        stderr.contains("hqkg-web-feed:"),
        "no named error: {stderr}"
    );
    let after = std::fs::metadata(&journal).map(|m| m.len()).unwrap_or(0);
    assert_eq!(before, after, "a refused replay grew the journal");

    let _ = std::fs::remove_file(&journal);
    let _ = std::fs::remove_file(journal.with_extension("hqkg.lock"));
}

#[test]
fn real_binary_revokes_a_visit_and_the_readback_omits_it() {
    let bin = env!("CARGO_BIN_EXE_hqkg-web-feed");
    let journal = tmp("revoke");
    let (ok, _, stderr) = feed(bin, &journal, &payload("https://example.org/articles/1"));
    assert!(ok, "first batch refused: {stderr}");
    assert_eq!(query_rows(bin, &journal).len(), 1);

    // Revoke by the full visit node id: the id the Studio retraction ledger uses.
    let visit_id = format!("web:visit:{}:{}", INSTALLATION, EVENT_ID);
    let (code, stdout, stderr) = run(bin, &journal, &["revoke", "--id", &visit_id]);
    assert_eq!(code, 0, "revoke failed: {stderr}");
    assert!(
        stdout.contains("revoked=1"),
        "unexpected revoke receipt: {stdout}"
    );
    assert!(
        stdout.contains("already=0") && stdout.contains("unknown=0"),
        "unexpected revoke receipt: {stdout}"
    );

    // The revoked visit is gone from the query: the Host/phone page cannot see it.
    assert_eq!(query_rows(bin, &journal).len(), 0);

    // The journal still holds the visit node plus the durable tombstone. Revocation
    // is query-level and phone-level absence, not a rewrite of committed history.
    let memory = WebMemory::open(Journal::new(&journal)).expect("reopen journal");
    assert!(
        memory.graph().node(&visit_id).is_some(),
        "visit node missing"
    );
    assert!(
        memory
            .graph()
            .node(&format!("web:revocation:{}:{}", INSTALLATION, EVENT_ID))
            .is_some(),
        "revocation tombstone missing"
    );

    let _ = std::fs::remove_file(&journal);
    let _ = std::fs::remove_file(journal.with_extension("hqkg.lock"));
}

#[test]
fn revoke_is_idempotent_and_an_unknown_id_is_not_fatal() {
    let bin = env!("CARGO_BIN_EXE_hqkg-web-feed");
    let journal = tmp("revoke-idempotent");
    let (ok, _, stderr) = feed(bin, &journal, &payload("https://example.org/articles/1"));
    assert!(ok, "first batch refused: {stderr}");
    let visit_id = format!("web:visit:{}:{}", INSTALLATION, EVENT_ID);

    let (code, stdout, stderr) = run(bin, &journal, &["revoke", "--id", &visit_id]);
    assert_eq!(code, 0, "first revoke failed: {stderr}");
    assert!(stdout.contains("revoked=1"), "{stdout}");
    let after_first = std::fs::metadata(&journal).map(|m| m.len()).unwrap_or(0);

    // Revoking again is a successful no-op: nothing written, epoch unmoved.
    let (code, stdout, stderr) = run(bin, &journal, &["revoke", "--id", &visit_id]);
    assert_eq!(code, 0, "second revoke failed: {stderr}");
    assert!(stdout.contains("revoked=0"), "{stdout}");
    assert!(stdout.contains("already=1"), "{stdout}");
    assert!(stdout.contains("unknown=0"), "{stdout}");
    assert_eq!(
        std::fs::metadata(&journal).map(|m| m.len()).unwrap_or(0),
        after_first,
        "an idempotent revoke grew the journal"
    );

    // An unknown id is also a successful no-op, never a fatal error.
    let (code, stdout, stderr) = run(
        bin,
        &journal,
        &["revoke", "--id", "99999999-1234-4234-8234-123456789012"],
    );
    assert_eq!(code, 0, "unknown revoke failed: {stderr}");
    assert!(stdout.contains("revoked=0"), "{stdout}");
    assert!(stdout.contains("already=0"), "{stdout}");
    assert!(stdout.contains("unknown=1"), "{stdout}");
    assert_eq!(
        std::fs::metadata(&journal).map(|m| m.len()).unwrap_or(0),
        after_first,
        "an unknown revoke grew the journal"
    );

    let _ = std::fs::remove_file(&journal);
    let _ = std::fs::remove_file(journal.with_extension("hqkg.lock"));
}

#[test]
fn the_accept_receipt_contract_is_unchanged_by_the_revoke_command() {
    let bin = env!("CARGO_BIN_EXE_hqkg-web-feed");
    let journal = tmp("receipt-contract");
    let (ok, stdout, stderr) = feed(bin, &journal, &payload("https://example.org/articles/1"));
    assert!(ok, "batch refused: {stderr}");
    // Studio's parser matches exactly this shape: /accepted=(\d+) inserted=(\d+)/.
    let counts = stdout.match_indices("accepted=").collect::<Vec<_>>();
    assert_eq!(counts.len(), 1, "unexpected receipt shape: {stdout}");
    assert!(
        stdout.contains("accepted=1 inserted=1"),
        "unexpected receipt shape: {stdout}"
    );
    // The revoke receipt must never look like an accept receipt.
    let (_, revoke_stdout, _) = run(
        bin,
        &journal,
        &[
            "revoke",
            "--id",
            &format!("web:visit:{}:{}", INSTALLATION, EVENT_ID),
        ],
    );
    assert!(
        !revoke_stdout.contains("accepted="),
        "revoke receipt collides with the accept receipt: {revoke_stdout}"
    );

    let _ = std::fs::remove_file(&journal);
    let _ = std::fs::remove_file(journal.with_extension("hqkg.lock"));
}

#[test]
fn the_revoke_argv_contract_matches_the_fixture() {
    let bin = env!("CARGO_BIN_EXE_hqkg-web-feed");
    let fixture = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("tests/fixtures/web-memory-revision/revocation-cases.json");
    let doc: Value = serde_json::from_slice(&std::fs::read(&fixture).expect("read fixture"))
        .expect("fixture JSON");
    assert_eq!(doc["schema"], "vivim.web-memory-revision/1");
    let cases = doc["cases"].as_array().expect("fixture cases");
    assert!(!cases.is_empty(), "fixture has no cases");
    for case in cases {
        let name = case["name"].as_str().expect("case name");
        let journal = tmp(&format!("fixture-{}", name));
        // Two observed visits: the case decides which one is revoked.
        let (ok, _, stderr) = feed(bin, &journal, &payload("https://example.org/articles/1"));
        assert!(ok, "{name}: seed refused: {stderr}");
        let (ok, _, stderr) = feed(
            bin,
            &journal,
            &payload_for(SECOND_EVENT_ID, "https://example.org/articles/2"),
        );
        assert!(ok, "{name}: seed refused: {stderr}");
        if let Some(pre) = case.get("preRevoke").and_then(Value::as_array) {
            let args: Vec<&str> = pre
                .iter()
                .map(|v| v.as_str().expect("argv string"))
                .collect();
            let (code, _, stderr) = run(bin, &journal, &args);
            assert_eq!(code, 0, "{name}: pre-revoke failed: {stderr}");
        }
        let argv: Vec<&str> = case["argv"]
            .as_array()
            .expect("case argv")
            .iter()
            .map(|v| v.as_str().expect("argv string"))
            .collect();
        let (code, stdout, stderr) = run(bin, &journal, &argv);
        let expect = &case["expect"];
        assert_eq!(
            code as i64,
            expect["exit"].as_i64().expect("expected exit"),
            "{name}: unexpected exit code, stderr={stderr}"
        );
        if code == 0 {
            for key in ["revoked", "already", "unknown"] {
                let want = expect[key].as_u64().expect("expected receipt value");
                assert!(
                    stdout.contains(&format!("{}={}", key, want)),
                    "{name}: receipt {stdout} lacks {}={}",
                    key,
                    want
                );
            }
        } else {
            assert!(
                stderr.contains("hqkg-web-feed:"),
                "{name}: no named error: {stderr}"
            );
        }
        let rows = query_rows(bin, &journal);
        assert_eq!(
            rows.len() as u64,
            expect["rowsAfter"].as_u64().expect("expected row count"),
            "{name}: unexpected query rows {rows:?}"
        );
        let _ = std::fs::remove_file(&journal);
        let _ = std::fs::remove_file(journal.with_extension("hqkg.lock"));
    }
}

//! Independent acceptance gate for the Host-invoked personal lifecycle CLI.
//! Spawns the real `hqkg-personal` binary (Cargo builds it for the test target);
//! a missing binary fails the gate, it is never skipped. Synthetic data only.
#![cfg(feature = "importer")]
use serde_json::{json, Value};
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::process::{Command, Stdio};

const SCOPE_A: &str = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const SCOPE_B: &str = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

struct Sandbox {
    dir: PathBuf,
}
impl Sandbox {
    fn new(name: &str) -> Self {
        let dir = std::env::temp_dir().join(format!(
            "hqkg-personal-lc-{}-{}",
            std::process::id(),
            name
        ));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).expect("temp sandbox");
        Sandbox { dir }
    }
    fn journal(&self) -> PathBuf {
        self.dir.join("scope.hqj")
    }
}
impl Drop for Sandbox {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.dir);
    }
}

fn cli() -> String {
    std::env::var("CARGO_BIN_EXE_hqkg-personal")
        .expect("MISSING_REAL_BINARY: cargo builds the hqkg-personal bin for this test target")
}

/// Runs one CLI invocation; returns (exit code, parsed stdout JSON).
fn run(journal: &PathBuf, packet: &Value) -> (i32, Value) {
    let output = Command::new(cli())
        .arg("--journal")
        .arg(journal)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .and_then(|mut child| {
            child
                .stdin
                .as_mut()
                .expect("stdin")
                .write_all(serde_json::to_vec(packet).expect("packet").as_slice())?;
            child.wait_with_output()
        })
        .expect("cli spawn");
    let parsed: Value =
        serde_json::from_slice(&output.stdout).expect("CLI stdout is one JSON document");
    (output.status.code().unwrap_or(-1), parsed)
}

fn apply(op_id: &str, digest: &str, epoch: u64, bytes: u64, title: &str) -> Value {
    json!({
        "schema": "vivim.hqkg-personal/1",
        "scope": SCOPE_A,
        "op": "apply",
        "opId": op_id,
        "payloadDigest": digest,
        "expectedEpoch": epoch,
        "expectedBytes": bytes,
        "nodes": [{"id": "synthetic-native", "title": title}]
    })
}

fn inspect(op_id: Option<&str>) -> Value {
    let mut packet = json!({"schema": "vivim.hqkg-personal/1", "scope": SCOPE_A, "op": "inspect"});
    if let Some(id) = op_id {
        packet["opId"] = json!(id);
    }
    packet
}

#[test]
fn marker_survives_restart_deduplicates_and_refuses_stale_geometry() {
    let s = Sandbox::new("marker");
    let journal = s.journal();
    let (code, receipt) = run(&journal, &apply("rev-1", &"2".repeat(64), 0, 0, "SENTINEL"));
    assert_eq!(code, 0, "apply must succeed: {receipt}");
    assert_eq!(receipt["marker"]["opId"], json!("rev-1"));
    let (code, head) = run(&journal, &inspect(Some("rev-1")));
    assert_eq!(code, 0);
    assert_eq!(head["marker"]["payloadDigest"], json!("2".repeat(64)));
    // Response-loss replay with fresh geometry: byte-identical journal, duplicate receipt.
    let before = fs::read(&journal).expect("journal");
    let (code, dup) = run(
        &journal,
        &apply(
            "rev-1",
            &"2".repeat(64),
            head["epoch"].as_u64().unwrap(),
            head["bytes"].as_u64().unwrap(),
            "SENTINEL",
        ),
    );
    assert_eq!(code, 0);
    assert_eq!(dup["duplicate"], json!(true));
    assert_eq!(fs::read(&journal).expect("journal"), before, "no new frame");
    // Stale expectations fail closed before marker identity.
    let (code, stale) = run(&journal, &apply("rev-1", &"3".repeat(64), 0, 0, "SENTINEL"));
    assert_ne!(code, 0);
    assert!(
        stale["error"].as_str().unwrap().contains("stale epoch"),
        "stale geometry refusal: {stale}"
    );
    let (code, conflict) = run(
        &journal,
        &apply(
            "rev-1",
            &"3".repeat(64),
            head["epoch"].as_u64().unwrap(),
            head["bytes"].as_u64().unwrap(),
            "SENTINEL",
        ),
    );
    assert_ne!(code, 0);
    assert!(
        conflict["error"].as_str().unwrap().contains("marker conflict"),
        "changed digest under fresh geometry: {conflict}"
    );
    let (code, query) = run(&journal, &json!({"schema":"vivim.hqkg-personal/1","scope":SCOPE_A,"op":"query"}));
    assert_eq!(code, 0);
    assert_eq!(query["nodes"].as_array().unwrap().len(), 1);
}

#[test]
fn namespaces_are_isolated_per_scope() {
    let s = Sandbox::new("namespace");
    let journal = s.journal();
    let (code, _) = run(&journal, &apply("rev-1", &"2".repeat(64), 0, 0, "SCOPE_A_NODE"));
    assert_eq!(code, 0);
    let (code, cross) = run(
        &journal,
        &json!({"schema":"vivim.hqkg-personal/1","scope":SCOPE_B,"op":"query"}),
    );
    assert_ne!(code, 0, "foreign scope must not read scope A's journal");
    assert!(
        cross["error"].as_str().unwrap().contains("namespace"),
        "namespace conflict: {cross}"
    );
}

#[test]
fn erase_removes_historical_bytes_and_subsumes_prior_markers() {
    let s = Sandbox::new("erase");
    let journal = s.journal();
    let (_, first) = run(&journal, &apply("rev-1", &"2".repeat(64), 0, 0, "SENTINEL_HISTORICAL"));
    let raw = fs::read(&journal).expect("journal");
    assert!(
        raw.windows("SENTINEL_HISTORICAL".len())
            .any(|w| w == "SENTINEL_HISTORICAL".as_bytes()),
        "sentinel must exist in historical frames before erase"
    );
    let (code, erased) = run(
        &journal,
        &json!({
            "schema":"vivim.hqkg-personal/1","scope":SCOPE_A,"op":"erase",
            "opId":"erase-1","payloadDigest":"5".repeat(64),
            "expectedEpoch":first["epoch"],"expectedBytes":first["bytes"]
        }),
    );
    assert_eq!(code, 0, "erase: {erased}");
    let bytes = fs::read(&journal).expect("journal after erase");
    assert_eq!(
        bytes.len() as u64,
        20 + u64::from_le_bytes(bytes[4..12].try_into().unwrap()),
        "exactly one complete snapshot frame"
    );
    assert!(
        !bytes
            .windows("SENTINEL_HISTORICAL".len())
            .any(|w| w == "SENTINEL_HISTORICAL".as_bytes()),
        "historical content bytes must be gone after compaction"
    );
    let (_, head) = run(&journal, &inspect(Some("erase-1")));
    assert_eq!(head["marker"]["opId"], json!("erase-1"));
    // A fresh deletion-epoch fence subsumes the prior erase marker.
    let (code, erased2) = run(
        &journal,
        &json!({
            "schema":"vivim.hqkg-personal/1","scope":SCOPE_A,"op":"erase",
            "opId":"erase-2","payloadDigest":"7".repeat(64),
            "expectedEpoch":erased["epoch"],"expectedBytes":erased["bytes"]
        }),
    );
    assert_eq!(code, 0, "second fence: {erased2}");
    let (_, prior) = run(&journal, &inspect(Some("erase-1")));
    assert!(prior["marker"].is_null(), "prior marker subsumed");
    let (_, query) = run(&journal, &json!({"schema":"vivim.hqkg-personal/1","scope":SCOPE_A,"op":"query"}));
    assert_eq!(query["nodes"].as_array().unwrap().len(), 0);
    let bytes2 = fs::read(&journal).expect("journal after second fence");
    assert_eq!(
        bytes2.len() as u64,
        20 + u64::from_le_bytes(bytes2[4..12].try_into().unwrap())
    );
}

#[test]
fn artifacts_are_quarantined_without_automatic_repair() {
    let s = Sandbox::new("quarantine");
    let journal = s.journal();
    let (_, _) = run(&journal, &apply("rev-1", &"2".repeat(64), 0, 0, "QUARANTINE"));
    let cases: Vec<(&str, PathBuf, &[u8])> = vec![
        (
            "stale lock",
            journal.with_extension("hqkg.lock"),
            b"SYNTHETIC_OWNER_UNKNOWN",
        ),
        ("torn tail", journal.clone(), b"torn synthetic tail"),
        (
            "orphan compaction temp",
            journal.with_extension("hqkg.compact.tmp"),
            b"SYNTHETIC_ORPHAN",
        ),
        (
            "orphan preflight temp",
            journal.with_extension("hqkg.preflight.tmp"),
            b"SYNTHETIC_PREFLIGHT_ORPHAN",
        ),
    ];
    for (label, path, payload) in cases {
        if label == "torn tail" {
            // Append after the verified frame; fs::write would truncate the journal
            // and destroy the committed snapshot instead of simulating a torn tail.
            use std::io::Write as _;
            let mut f = fs::OpenOptions::new().append(true).open(&path).expect("open journal");
            f.write_all(payload).expect("append torn tail");
        } else {
            fs::write(&path, payload).expect("artifact");
        }
        let before = fs::read(&journal).expect("journal");
        let (code, refused) = run(&journal, &inspect(None));
        assert_ne!(code, 0, "{label} must not be silently repaired");
        let error = refused["error"].as_str().unwrap_or_default();
        assert!(
            error.contains("RECOVERY_REQUIRED") || error.contains("corrupt"),
            "{label} quarantined with an honest error, got: {error}"
        );
        assert_eq!(
            fs::read(&journal).expect("journal"),
            before,
            "{label} inspection must not mutate the journal"
        );
        if label != "torn tail" {
            fs::remove_file(&path).expect("remove artifact for next case");
        } else {
            // Restore the verified length for the following cases.
            let verified = 20 + u64::from_le_bytes(before[4..12].try_into().unwrap());
            let f = fs::OpenOptions::new().write(true).open(&journal).unwrap();
            f.set_len(verified).unwrap();
        }
    }
}

#[test]
fn preflight_projects_without_creating_or_growing_the_journal() {
    let s = Sandbox::new("preflight");
    let journal = s.journal();
    let (code, pre) = run(
        &journal,
        &json!({
            "schema":"vivim.hqkg-personal/1","scope":SCOPE_A,"op":"preflight",
            "opId":"rev-1","payloadDigest":"2".repeat(64),
            "expectedEpoch":0,"expectedBytes":0,
            "nodes":[{"id":"synthetic-native","title":"PREFLIGHT_SENTINEL"}]
        }),
    );
    assert_eq!(code, 0, "preflight: {pre}");
    assert!(pre["projectedBytes"].as_u64().unwrap() > 0);
    assert_eq!(pre["epoch"], json!(0));
    assert!(
        !journal.exists(),
        "preflight must not create the real journal"
    );
    // Preflight ignores stale expectations (pure read-only projection) and the
    // apply afterwards still succeeds with the original expected values.
    let (_, stale_projection) = run(
        &journal,
        &json!({
            "schema":"vivim.hqkg-personal/1","scope":SCOPE_A,"op":"preflight",
            "opId":"rev-1","payloadDigest":"2".repeat(64),
            "expectedEpoch":900,"expectedBytes":900,
            "nodes":[{"id":"synthetic-native","title":"PREFLIGHT_SENTINEL"}]
        }),
    );
    assert!(stale_projection["projectedBytes"].as_u64().unwrap() > 0);
    let (code, _) = run(&journal, &apply("rev-1", &"2".repeat(64), 0, 0, "PREFLIGHT_SENTINEL"));
    assert_eq!(code, 0, "preflight must not consume the expected geometry");
}

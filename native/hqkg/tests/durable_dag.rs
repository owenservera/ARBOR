use hqkg::durable_dag::*;
use hqkg::typed_dag::*;
use hqkg::Journal;
use std::fs;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

static SERIAL: AtomicU64 = AtomicU64::new(0);
fn path() -> std::path::PathBuf {
    let time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    std::env::temp_dir().join(format!(
        "hqkg-dag-{}-{}-{}.hqkg",
        std::process::id(),
        time,
        SERIAL.fetch_add(1, Ordering::SeqCst)
    ))
}
fn ns(domain: GraphDomain) -> Namespace {
    Namespace {
        domain,
        owner: "local".into(),
    }
}
fn report(scope: &Namespace) -> DagReport {
    DagReport {
        schema: CONTRACT,
        namespace: scope.clone(),
        revision: RevisionToken {
            namespace: scope.clone(),
            graph_epoch: 9,
        },
        state: RunState::Complete,
        failed_step: None,
        failure: None,
        effect_authorized: false,
        outputs: vec![MaterializedOutput {
            step_id: "normalize".into(),
            engine: "pure".into(),
            generation: 2,
            input_stamp: "SECRET-INPUT".into(),
            data: "PRIVATE-OUTPUT".into(),
            provenance: vec!["PERSONAL-PROVENANCE".into()],
            state: OutputState::Computed,
        }],
    }
}
#[test]
fn committed_descriptors_survive_restart_without_payloads() {
    let p = path();
    let scope = ns(GraphDomain::Personal);
    let receipt = commit_report(&Journal::new(&p), &scope, "run1", &report(&scope)).unwrap();
    assert_eq!(receipt.new_nodes, 3);
    let raw = fs::read(&p).unwrap();
    for secret in ["PRIVATE-OUTPUT", "SECRET-INPUT", "PERSONAL-PROVENANCE"] {
        assert!(!raw.windows(secret.len()).any(|b| b == secret.as_bytes()));
    }
    let recovered = recover_descriptions(&Journal::new(&p), &scope).unwrap();
    assert_eq!(recovered.len(), 1);
    assert_eq!(recovered[0].run_id, "run1");
    assert_eq!(recovered[0].state, "Complete");
    assert_eq!(recovered[0].steps, vec!["normalize"]);
    assert!(commit_report(&Journal::new(&p), &scope, "run1", &report(&scope)).is_err());
    fs::remove_file(p).unwrap();
}
#[test]
fn cross_domain_write_and_replay_are_refused() {
    let p = path();
    let personal = ns(GraphDomain::Personal);
    let development = ns(GraphDomain::Development);
    commit_report(
        &Journal::new(&p),
        &personal,
        "personal1",
        &report(&personal),
    )
    .unwrap();
    assert!(commit_report(
        &Journal::new(&p),
        &development,
        "dev1",
        &report(&development)
    )
    .is_err());
    assert!(recover_descriptions(&Journal::new(&p), &development).is_err());
    fs::remove_file(p).unwrap();
}
#[test]
fn torn_delta_requires_explicit_repair() {
    let p = path();
    let scope = ns(GraphDomain::Development);
    commit_report(&Journal::new(&p), &scope, "run1", &report(&scope)).unwrap();
    let mut raw = fs::OpenOptions::new().append(true).open(&p).unwrap();
    use std::io::Write;
    raw.write_all(b"HQD1\x00\x00").unwrap();
    raw.sync_all().unwrap();
    assert!(recover_descriptions(&Journal::new(&p), &scope).is_err());
    assert!(commit_report(&Journal::new(&p), &scope, "run2", &report(&scope)).is_err());
    let status = Journal::new(&p).status().unwrap();
    assert!(status.trailing_bytes > 0);
    fs::remove_file(p).unwrap();
}
#[test]
fn failed_run_preserves_status_not_error_text() {
    let p = path();
    let scope = ns(GraphDomain::Development);
    let mut r = report(&scope);
    r.state = RunState::Failed;
    r.failed_step = Some("normalize".into());
    r.failure = Some("SENSITIVE FILE PATH /secret".into());
    r.outputs.clear();
    commit_report(&Journal::new(&p), &scope, "fail1", &r).unwrap();
    let raw = fs::read(&p).unwrap();
    assert!(!raw.windows(15).any(|b| b == b"SENSITIVE FILE "));
    let recovered = recover_descriptions(&Journal::new(&p), &scope).unwrap();
    assert_eq!(recovered[0].state, "Failed");
    assert_eq!(recovered[0].failed_step.as_deref(), Some("normalize"));
    assert!(recovered[0].steps.is_empty());
    fs::remove_file(p).unwrap();
}

#[test]
fn snapshot_compaction_preserves_replay_and_rejects_stale_cas() {
    let p = path();
    let scope = ns(GraphDomain::Development);
    commit_report(&Journal::new(&p), &scope, "one", &report(&scope)).unwrap();
    commit_report(&Journal::new(&p), &scope, "two", &report(&scope)).unwrap();
    let journal = Journal::new(&p);
    let before = journal.status().unwrap();
    assert!(journal
        .compact_verified(before.total_bytes + 1, before.epoch)
        .is_err());
    let receipt = journal
        .compact_verified(before.total_bytes, before.epoch)
        .unwrap();
    assert_eq!(receipt.epoch, before.epoch);
    let after = journal.status().unwrap();
    assert_eq!(after.trailing_bytes, 0);
    assert_eq!(after.epoch, before.epoch);
    assert_eq!(after.total_bytes, receipt.new_bytes);
    let restored = recover_descriptions(&journal, &scope).unwrap();
    assert_eq!(
        restored
            .iter()
            .map(|r| r.run_id.as_str())
            .collect::<Vec<_>>(),
        vec!["one", "two"]
    );
    commit_report(&journal, &scope, "three", &report(&scope)).unwrap();
    assert_eq!(recover_descriptions(&journal, &scope).unwrap().len(), 3);
    fs::remove_file(p).unwrap();
}

#[test]
fn preexisting_unscoped_graph_must_be_migrated_explicitly() {
    let p = path();
    let scope = ns(GraphDomain::Development);
    let mut graph = hqkg::Graph::new();
    graph
        .put_node(hqkg::Node::new(
            "existing",
            hqkg::NodeKind::Document,
            "existing HQ data",
        ))
        .unwrap();
    let journal = Journal::new(&p);
    journal.save(&graph).unwrap();
    assert!(commit_report(&journal, &scope, "one", &report(&scope)).is_err());
    assert!(recover_descriptions(&journal, &scope).is_err());
    assert!(journal.load().unwrap().node("existing").is_some());
    fs::remove_file(p).unwrap();
}

#[test]
fn forged_effect_authorization_and_unsafe_metadata_refused() {
    let p = path();
    let scope = ns(GraphDomain::Personal);
    let mut report = report(&scope);
    report.effect_authorized = true;
    assert!(commit_report(&Journal::new(&p), &scope, "refused1", &report).is_err());
    report.effect_authorized = false;
    report.outputs[0].step_id = "prompt with spaces".into();
    assert!(commit_report(&Journal::new(&p), &scope, "refused2", &report).is_err());
    assert!(!p.exists());
}

# File: native/hqkg/tests/durable_dag.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/durable_dag.rs |
| Language | Rust |
| Kind | source |
| Size | 6757 B |
| Lines | 187 |
| Hash | c9de0136e475 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SERIAL | const | 8 | no | static SERIAL: AtomicU64 = AtomicU64::new(0); |
| path | function | 9 | no | fn path() -&gt; std::path::PathBuf { |
| ns | function | 21 | no | fn ns(domain: GraphDomain) -&gt; Namespace { |
| report | function | 27 | no | fn report(scope: &amp;Namespace) -&gt; DagReport { |
| committed_descriptors_survive_restart_without_payloads | function | 51 | no | fn committed_descriptors_survive_restart_without_payloads() { |
| cross_domain_write_and_replay_are_refused | function | 69 | no | fn cross_domain_write_and_replay_are_refused() { |
| torn_delta_requires_explicit_repair | function | 91 | no | fn torn_delta_requires_explicit_repair() { |
| failed_run_preserves_status_not_error_text | function | 106 | no | fn failed_run_preserves_status_not_error_text() { |
| snapshot_compaction_preserves_replay_and_rejects_stale_cas | function | 125 | no | fn snapshot_compaction_preserves_replay_and_rejects_stale_cas() { |
| preexisting_unscoped_graph_must_be_migrated_explicitly | function | 157 | no | fn preexisting_unscoped_graph_must_be_migrated_explicitly() { |
| forged_effect_authorization_and_unsafe_metadata_refused | function | 177 | no | fn forged_effect_authorization_and_unsafe_metadata_refused() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::durable_dag::* | use | 1 | external |
| hqkg::typed_dag::* | use | 2 | external |
| hqkg::Journal | use | 3 | external |
| std::fs | use | 4 | external |
| std::sync::atomic::{AtomicU64, Ordering} | use | 5 | external |
| std::time::{SystemTime, UNIX_EPOCH} | use | 6 | external |
| std::io::Write | use | 96 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
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
```

_First 80 of 188 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

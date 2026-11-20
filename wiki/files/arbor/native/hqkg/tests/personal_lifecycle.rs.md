# File: native/hqkg/tests/personal_lifecycle.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/personal_lifecycle.rs |
| Language | Rust |
| Kind | source |
| Size | 11664 B |
| Lines | 302 |
| Hash | 6f12399c10c2 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SCOPE_A | const | 11 | no | const SCOPE_A: &amp;str = &quot;aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&quot;; |
| SCOPE_B | const | 12 | no | const SCOPE_B: &amp;str = &quot;bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb&quot;; |
| Sandbox | struct | 14 | no | struct Sandbox { |
| journal | method | 28 | no | fn journal(&amp;self) -&gt; PathBuf { |
| drop | method | 33 | no | fn drop(&amp;mut self) { |
| cli | function | 38 | no | fn cli() -&gt; String { |
| run | function | 44 | no | fn run(journal: &amp;PathBuf, packet: &amp;Value) -&gt; (i32, Value) { |
| apply | function | 66 | no | fn apply(op_id: &amp;str, digest: &amp;str, epoch: u64, bytes: u64, title: &amp;str) -&gt; Value { |
| inspect | function | 79 | no | fn inspect(op_id: Option&lt;&amp;str&gt;) -&gt; Value { |
| marker_survives_restart_deduplicates_and_refuses_stale_geometry | function | 88 | no | fn marker_survives_restart_deduplicates_and_refuses_stale_geometry() { |
| namespaces_are_isolated_per_scope | function | 140 | no | fn namespaces_are_isolated_per_scope() { |
| erase_removes_historical_bytes_and_subsumes_prior_markers | function | 157 | no | fn erase_removes_historical_bytes_and_subsumes_prior_markers() { |
| artifacts_are_quarantined_without_automatic_repair | function | 212 | no | fn artifacts_are_quarantined_without_automatic_repair() { |
| preflight_projects_without_creating_or_growing_the_journal | function | 269 | no | fn preflight_projects_without_creating_or_growing_the_journal() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| serde_json::{json, Value} | use | 5 | external |
| std::fs | use | 6 | external |
| std::io::Write | use | 7 | external |
| std::path::PathBuf | use | 8 | external |
| std::process::{Command, Stdio} | use | 9 | external |
| std::io::Write as _ | use | 238 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
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
```

_First 80 of 303 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

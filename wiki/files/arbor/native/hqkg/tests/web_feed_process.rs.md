# File: native/hqkg/tests/web_feed_process.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/web_feed_process.rs |
| Language | Rust |
| Kind | source |
| Size | 14798 B |
| Lines | 365 |
| Hash | d163e928dc9d |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| INSTALLATION | const | 13 | no | const INSTALLATION: &amp;str = &quot;12345678-1234-4234-8234-123456789012&quot;; |
| EVENT_ID | const | 14 | no | const EVENT_ID: &amp;str = &quot;00000001-1234-4234-8234-123456789012&quot;; |
| SECOND_EVENT_ID | const | 15 | no | const SECOND_EVENT_ID: &amp;str = &quot;00000002-1234-4234-8234-123456789012&quot;; |
| tmp | function | 17 | no | fn tmp(label: &amp;str) -&gt; PathBuf { |
| payload | function | 25 | no | fn payload(url: &amp;str) -&gt; Vec&lt;u8&gt; { |
| payload_for | function | 29 | no | fn payload_for(event_id: &amp;str, url: &amp;str) -&gt; Vec&lt;u8&gt; { |
| feed | function | 44 | no | fn feed(bin: &amp;str, journal: &amp;PathBuf, body: &amp;[u8]) -&gt; (bool, String, String) { |
| run | function | 62 | no | fn run(bin: &amp;str, journal: &amp;PathBuf, args: &amp;[&amp;str]) -&gt; (i32, String, String) { |
| query_rows | function | 75 | no | fn query_rows(bin: &amp;str, journal: &amp;PathBuf) -&gt; Vec&lt;Value&gt; { |
| real_binary_accepts_one_batch_and_reads_it_back | function | 83 | no | fn real_binary_accepts_one_batch_and_reads_it_back() { |
| real_binary_rejects_a_conflicting_replay_without_growing | function | 156 | no | fn real_binary_rejects_a_conflicting_replay_without_growing() { |
| real_binary_revokes_a_visit_and_the_readback_omits_it | function | 178 | no | fn real_binary_revokes_a_visit_and_the_readback_omits_it() { |
| revoke_is_idempotent_and_an_unknown_id_is_not_fatal | function | 221 | no | fn revoke_is_idempotent_and_an_unknown_id_is_not_fatal() { |
| the_accept_receipt_contract_is_unchanged_by_the_revoke_command | function | 266 | no | fn the_accept_receipt_contract_is_unchanged_by_the_revoke_command() { |
| the_revoke_argv_contract_matches_the_fixture | function | 298 | no | fn the_revoke_argv_contract_matches_the_fixture() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::web_memory::WebMemory | use | 6 | external |
| hqkg::{Graph, Journal} | use | 7 | external |
| serde_json::{json, Value} | use | 8 | external |
| std::io::Write | use | 9 | external |
| std::path::PathBuf | use | 10 | external |
| std::process::{Command, Stdio} | use | 11 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Process-boundary proof: the real hqkg-web-feed binary accepts one Studio batch, ACKs it, |
| 4 | owner | repos-hq | — | repos-hq |
| 5 | invariant | — | — | No injected spawn, no mocked ingress: this test only talks to the built binary. |

## Excerpt

```rust
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
```

_First 80 of 366 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

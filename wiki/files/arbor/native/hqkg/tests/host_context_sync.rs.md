# File: native/hqkg/tests/host_context_sync.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/host_context_sync.rs |
| Language | Rust |
| Kind | source |
| Size | 20694 B |
| Lines | 388 |
| Hash | f4923cb74eb5 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SCOPE | const | 7 | no | const SCOPE: &amp;str = &quot;aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&quot;; |
| ENTRY | const | 8 | no | const ENTRY: &amp;str = &quot;aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&quot;; |
| NEXT | const | 9 | no | const NEXT: &amp;str = &quot;bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&quot;; |
| Temp | struct | 11 | no | struct Temp(PathBuf); |
| journal | method | 19 | no | fn journal(&amp;self) -&gt; PathBuf { self.0.join(&quot;personal.hqj&quot;) } |
| sync | function | 23 | no | fn sync(file:&amp;Path,scope:&amp;str,nodes:Vec&lt;Value&gt;) -&gt; (bool,Value) { |
| sync_with_relationships | function | 26 | no | fn sync_with_relationships(file:&amp;Path,scope:&amp;str,nodes:Vec&lt;Value&gt;,relationships:Vec&lt;Value&gt;) -&gt; (bool,Value) { |
| run_packet | function | 29 | no | fn run_packet(file:&amp;Path,packet:Value) -&gt; (bool,Value) { |
| delta | function | 38 | no | fn delta(file:&amp;Path,scope:&amp;str,base:u64,deltas:Vec&lt;Value&gt;) -&gt; (bool,Value) { |
| put | function | 42 | no | fn put(record:Value) -&gt; Value { |
| tombstone | function | 45 | no | fn tombstone(id:&amp;str,kind:&amp;str,revision:u64) -&gt; Value { |
| query | function | 48 | no | fn query(file:&amp;Path,scope:&amp;str) -&gt; Vec&lt;Value&gt; { |
| qualified_id | function | 53 | no | fn qualified_id(file:&amp;Path,scope:&amp;str,source_ref:&amp;str) -&gt; String { |
| node_id | function | 59 | no | fn node_id(file:&amp;Path,scope:&amp;str,source_ref:&amp;str) -&gt; String { |
| local | function | 64 | no | fn local(id:&amp;str)-&gt;&amp;str { |
| wiki_record | function | 72 | no | fn wiki_record(index:usize,revision:u64) -&gt; Value { |
| read | function | 80 | no | fn read(file:&amp;Path,scope:&amp;str,epoch:u64,view:&amp;str) -&gt; Option&lt;Value&gt; { |
| wiki | function | 86 | no | fn wiki(entry:&amp;str,revision:u64,summary:&amp;str)-&gt;Value { |
| effect | function | 93 | no | fn effect()-&gt;Value { |
| native_reconciles_sources_without_duplicate_frames_or_stale_links | function | 101 | no | fn native_reconciles_sources_without_duplicate_frames_or_stale_links() { |
| strict_cas_and_torn_tail_cannot_publish_stale_snapshot | function | 145 | no | fn strict_cas_and_torn_tail_cannot_publish_stale_snapshot() { |
| empty_source_sync_is_a_real_empty_native_journal | function | 161 | no | fn empty_source_sync_is_a_real_empty_native_journal() { |
| committed_page_links_reconcile_and_are_read_back_as_actual_native_edges | function | 170 | no | fn committed_page_links_reconcile_and_are_read_back_as_actual_native_edges() { |
| combined_sync_read_matches_standalone_durable_projection_and_rejects_unsafe_views | function | 204 | no | fn combined_sync_read_matches_standalone_durable_projection_and_rejects_unsafe_views() { |
| delta_batches_ingest_past_the_bounded_read_window_without_dropping_older_sources | function | 244 | no | fn delta_batches_ingest_past_the_bounded_read_window_without_dropping_older_sources() { |
| explicit_tombstones_remove_one_source_and_replay_is_a_byte_identical_no_op | function | 283 | no | fn explicit_tombstones_remove_one_source_and_replay_is_a_byte_identical_no_op() { |
| delta_tombstones_cannot_reach_another_namespace_or_a_non_context_record | function | 320 | no | fn delta_tombstones_cannot_reach_another_namespace_or_a_non_context_record() { |
| delta_ingestion_requires_a_base_revision | function | 351 | no | fn delta_ingestion_requires_a_base_revision() { |
| delta_ingestion_and_a_complete_projection_converge_on_the_same_durable_graph | function | 369 | no | fn delta_ingestion_and_a_complete_projection_converge_on_the_same_durable_graph() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::Journal | use | 3 | external |
| serde_json::{json, Value} | use | 4 | external |
| sha2::{Digest, Sha256} | use | 5 | external |
| std::{fs, io::Write, path::{Path, PathBuf}, process::{Command, Stdio}, time::{SystemTime, UNIX_EPOCH}} | use | 6 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Real existing CLI processes against a temporary HQKG journal.
#![cfg(feature = "importer")]
use hqkg::Journal;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{fs, io::Write, path::{Path, PathBuf}, process::{Command, Stdio}, time::{SystemTime, UNIX_EPOCH}};
const SCOPE: &str = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const ENTRY: &str = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const NEXT: &str = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

struct Temp(PathBuf);
impl Temp {
    fn new() -> Self {
        let p=std::env::temp_dir().join(format!("hqkg-host-context-{}-{}",
            std::process::id(),SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos()));
        fs::create_dir_all(&p).unwrap();
        Self(p)
    }
    fn journal(&self) -> PathBuf { self.0.join("personal.hqj") }
}
impl Drop for Temp { fn drop(&mut self) { let _=fs::remove_dir_all(&self.0); } }

fn sync(file:&Path,scope:&str,nodes:Vec<Value>) -> (bool,Value) {
    sync_with_relationships(file,scope,nodes,vec![])
}
fn sync_with_relationships(file:&Path,scope:&str,nodes:Vec<Value>,relationships:Vec<Value>) -> (bool,Value) {
    run_packet(file,json!({"schema":"vivim.hqkg-personal/1","scope":scope,"op":"sync-context","nodes":nodes,"relationships":relationships}))
}
fn run_packet(file:&Path,packet:Value) -> (bool,Value) {
    let mut child=Command::new(env!("CARGO_BIN_EXE_hqkg-personal"))
        .arg("--journal").arg(file).stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped()).spawn().unwrap();
    child.stdin.take().unwrap().write_all(&serde_json::to_vec(&packet).unwrap()).unwrap();
    let out=child.wait_with_output().unwrap();
    (out.status.success(),serde_json::from_slice(&out.stdout).unwrap())
}
// Durable delta ingestion: each record carries its own put/delete operation and
// the batch names the source revision it was projected from.
fn delta(file:&Path,scope:&str,base:u64,deltas:Vec<Value>) -> (bool,Value) {
    run_packet(file,json!({"schema":"vivim.hqkg-personal/1","scope":scope,"op":"sync-context",
        "baseRevision":base,"nodes":[],"relationships":[],"deltas":deltas}))
}
fn put(record:Value) -> Value {
    let mut d=record; d["op"]=json!("put"); d
}
fn tombstone(id:&str,kind:&str,revision:u64) -> Value {
    json!({"op":"delete","kind":kind,"id":id,"revision":revision})
}
fn query(file:&Path,scope:&str) -> Vec<Value> {
    let (ok,packet)=run_packet(file,json!({"schema":"vivim.hqkg-personal/1","scope":scope,"op":"query"}));
    assert!(ok,"{packet}");
    packet["nodes"].as_array().unwrap().clone()
}
fn qualified_id(file:&Path,scope:&str,source_ref:&str) -> String {
    query(file,scope).into_iter()
        .find(|n|n["properties"]["vivim.context.sourceRef"]==source_ref)
        .unwrap_or_else(||panic!("missing managed source {source_ref}"))["id"]
        .as_str().unwrap().to_string()
}
fn node_id(file:&Path,scope:&str,source_ref:&str) -> String {
    local(&qualified_id(file,scope,source_ref)).to_string()
}
// The delta protocol names records by their in-namespace local identity, exactly
// like the existing erase operations; the qualified id is the durable identity.
fn local(id:&str)->&str {
    match id.find("vivim-context-") {
        Some(at)=>&id[at..],
        None=>id,
    }
}
// A distinct managed Wiki observation per index, so a batch can carry far more
// records than one bounded read window will ever return.
fn wiki_record(index:usize,revision:u64) -> Value {
    json!({"id":format!("vivim-context-w-{:064x}",index as u64+1),"kind":"wiki",
        "sourceRef":format!("page-{index}"),
        "semanticId":format!("wiki:section:Page/{index}"),
        "digest":format!("{:064x}",index as u64+1),
        "revision":revision,"sourceRevision":revision,"order":index as u64+1,
        "title":format!("Wiki: Page/{index}"),"summary":format!("Committed text {index}")})
}
fn read(file:&Path,scope:&str,epoch:u64,view:&str) -> Option<Value> {
```

_First 80 of 389 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

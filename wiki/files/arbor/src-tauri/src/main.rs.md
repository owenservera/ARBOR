# File: src-tauri/src/main.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | src-tauri/src/main.rs |
| Language | Rust |
| Kind | source |
| Size | 26367 B |
| Lines | 707 |
| Hash | d3d8166dbfc8 |
| Test | no |
| Generated | no |
| Component | src-tauri |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HOST_HEALTH | const | 11 | no | const HOST_HEALTH: &amp;str = &quot;http://127.0.0.1:43187/api/host/status&quot;; |
| HOST_STATUS_SCHEMA | const | 14 | no | const HOST_STATUS_SCHEMA: &amp;str = &quot;vivim.host-status/1&quot;; |
| APPROVED_BINARIES | const | 18 | no | const APPROVED_BINARIES: [&amp;str; 5] = [ |
| RuntimeMode | enum | 29 | no | enum RuntimeMode { |
| as_str | method | 36 | no | fn as_str(self) -&gt; &amp;&#39;static str { |
| HostRuntime | struct | 46 | no | struct HostRuntime { |
| ChildState | enum | 55 | no | enum ChildState { |
| HostProcess | struct | 61 | no | struct HostProcess { |
| packaged_runtime | function | 74 | no | fn packaged_runtime(root: &amp;Path) -&gt; Option&lt;PathBuf&gt; { |
| approved_binaries | function | 85 | no | fn approved_binaries(root: &amp;Path) -&gt; Vec&lt;(&amp;&#39;static str, bool)&gt; { |
| missing_approved_binaries | function | 100 | no | fn missing_approved_binaries(root: &amp;Path) -&gt; Vec&lt;&amp;&#39;static str&gt; { |
| is_host_status | function | 111 | no | fn is_host_status(value: &amp;serde_json::Value) -&gt; bool { |
| repo_root | method | 129 | no | fn repo_root() -&gt; PathBuf { |
| classify_runtime | method | 149 | no | fn classify_runtime(packaged: Option&lt;PathBuf&gt;, root: PathBuf) -&gt; HostRuntime { |
| resolve_runtime | method | 172 | no | fn resolve_runtime(app: &amp;tauri::AppHandle) -&gt; HostRuntime { |
| start | method | 181 | no | fn start( app: &amp;tauri::AppHandle, ) -&gt; Result&lt;Child, Box&lt;dyn std::error::Error + Send + Sync&gt;&gt; { |
| desktop_launch_url | method | 220 | no | fn desktop_launch_url() -&gt; Option&lt;String&gt; { |
| probe_health | method | 281 | no | fn probe_health(client: &amp;reqwest::blocking::Client) -&gt; bool { |
| wait_healthy | method | 297 | no | fn wait_healthy(timeout: Duration) -&gt; bool { |
| probe_child | method | 318 | no | fn probe_child(&amp;self) -&gt; ChildState { |
| stop_owned | method | 336 | no | fn stop_owned(&amp;self) { |
| store_child | method | 348 | no | fn store_child(&amp;self, child: Child) { |
| status_payload | method | 353 | no | fn status_payload(&amp;self, runtime: &amp;HostRuntime) -&gt; serde_json::Value { |
| host_is_running | function | 383 | no | fn host_is_running(state: State&lt;&#39;_, Arc&lt;HostProcess&gt;&gt;) -&gt; bool { |
| host_status | function | 390 | no | fn host_status(app: tauri::AppHandle, state: State&lt;&#39;_, Arc&lt;HostProcess&gt;&gt;) -&gt; serde_json::Value { |
| host_restart | function | 401 | no | async fn host_restart( app: tauri::AppHandle, state: State&lt;&#39;_, Arc&lt;HostProcess&gt;&gt;, ) -&gt; Result&lt;serde_json::Value, String&gt; { |
| restart_blocking | function | 420 | no | fn restart_blocking(app: &amp;tauri::AppHandle, state: &amp;HostProcess) -&gt; serde_json::Value { |
| app_version | function | 440 | no | fn app_version() -&gt; String { |
| validate_native_program | function | 446 | no | fn validate_native_program(request: serde_json::Value) -&gt; serde_json::Value { |
| main | function | 450 | no | fn main() { |
| tests | module | 504 | no | mod tests { |
| scratch_dir | function | 508 | no | fn scratch_dir(tag: &amp;str) -&gt; PathBuf { |
| COUNTER | const | 509 | no | static COUNTER: AtomicU64 = AtomicU64::new(0); |
| touch | function | 521 | no | fn touch(path: &amp;Path) { |
| spawn_exit | function | 528 | no | fn spawn_exit(code: i32) -&gt; Child { |
| spawn_lived | function | 542 | no | fn spawn_lived() -&gt; Child { |
| wait_until | function | 556 | no | fn wait_until(mut predicate: impl FnMut() -&gt; bool, timeout: Duration) -&gt; bool { |
| exited_child_is_reported_and_exit_code_recorded | function | 568 | no | fn exited_child_is_reported_and_exit_code_recorded() { |
| live_child_is_reported_running | function | 582 | no | fn live_child_is_reported_running() { |
| stop_owned_is_repeatable | function | 591 | no | fn stop_owned_is_repeatable() { |
| packaged_runtime_requires_node_and_host_entry | function | 601 | no | fn packaged_runtime_requires_node_and_host_entry() { |
| runtime_classification_distinguishes_packaged_workspace_and_missing | function | 616 | no | fn runtime_classification_distinguishes_packaged_workspace_and_missing() { |
| approved_binary_discovery_reports_only_the_frozen_contract | function | 639 | no | fn approved_binary_discovery_reports_only_the_frozen_contract() { |
| status_payload_reports_real_child_state_and_runtime | function | 661 | no | fn status_payload_reports_real_child_state_and_runtime() { |
| health_identity_rejects_unrelated_listeners | function | 691 | no | fn health_identity_rejects_unrelated_listeners() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| std::path::{Path, PathBuf} | use | 3 | external |
| std::process::{Child, Command, Stdio} | use | 4 | external |
| std::sync::Arc | use | 5 | external |
| std::thread | use | 6 | external |
| std::time::{Duration, Instant} | use | 7 | external |
| tauri::{Manager, State} | use | 9 | external |
| super::* | use | 505 | external |
| std::sync::atomic::{AtomicU64, Ordering} | use | 506 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
#![windows_subsystem = "windows"]

use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant};

use tauri::{Manager, State};

const HOST_HEALTH: &str = "http://127.0.0.1:43187/api/host/status";
/// Every VIVIM Host status reply is stamped with this schema. An unrelated process
/// that happens to own 127.0.0.1:43187 must never pass as the Host.
const HOST_STATUS_SCHEMA: &str = "vivim.host-status/1";
/// Native binaries the frozen packaging contract may stage
/// (tools/packaging/prepare-host-runtime.mjs PACKAGED_BINARIES). The native shell
/// reports which of these the installed runtime actually ships.
const APPROVED_BINARIES: [&str; 5] = [
    "hqkg-personal",
    "hqkg-chat-context",
    "hqkg-web-feed",
    "hqkg-import",
    "vivim-program-validate",
];

/// Where the Host runtime was found. Kept distinct so a missing bundle is never
/// reported as a working development fallback.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum RuntimeMode {
    Packaged,
    Workspace,
    Missing,
}

impl RuntimeMode {
    fn as_str(self) -> &'static str {
        match self {
            RuntimeMode::Packaged => "packaged",
            RuntimeMode::Workspace => "workspace",
            RuntimeMode::Missing => "missing",
        }
    }
}

#[derive(Debug)]
struct HostRuntime {
    mode: RuntimeMode,
    root: PathBuf,
    node: PathBuf,
    server: PathBuf,
}

/// Liveness of the child this shell actually owns, observed through the OS.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum ChildState {
    NotStarted,
    Running,
    Exited,
}

struct HostProcess {
    child: std::sync::Mutex<Option<Child>>,
    exit_code: std::sync::Mutex<Option<i32>>,
}

impl Default for HostProcess {
    fn default() -> Self {
        Self::new()
    }
}

/// A staged bundle only counts as packaged when it can actually launch the Host:
/// the staged node.exe and the Host entry point must both be present.
fn packaged_runtime(root: &Path) -> Option<PathBuf> {
    let node = root.join("node.exe");
    let server = root.join("apps").join("vivim-host").join("server.mjs");
    if node.is_file() && server.is_file() {
        Some(root.to_path_buf())
    } else {
        None
```

_First 80 of 707 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

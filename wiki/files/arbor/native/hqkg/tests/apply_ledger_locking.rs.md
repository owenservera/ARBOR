# File: native/hqkg/tests/apply_ledger_locking.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/apply_ledger_locking.rs |
| Language | Rust |
| Kind | source |
| Size | 9087 B |
| Lines | 226 |
| Hash | 8c1170aec341 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| temp_dir | function | 22 | no | fn temp_dir(name: &amp;str) -&gt; PathBuf { |
| now_ms | function | 33 | no | fn now_ms() -&gt; u128 { |
| lock_path | function | 40 | no | fn lock_path(record: &amp;Path) -&gt; PathBuf { |
| plant_lock | function | 48 | no | fn plant_lock(record: &amp;Path, pid: u32, created_ms: u128) { |
| read_lock | function | 53 | no | fn read_lock(record: &amp;Path) -&gt; (u32, u128) { |
| foreign_pid | function | 62 | no | fn foreign_pid() -&gt; u32 { |
| assert_locked_naming | function | 71 | no | fn assert_locked_naming(err: hqkg::Error, want: u32) { |
| first_open_acquires_lock_file_naming_holder_pid | function | 82 | no | fn first_open_acquires_lock_file_naming_holder_pid() { |
| second_open_while_held_is_locked_naming_holder | function | 104 | no | fn second_open_while_held_is_locked_naming_holder() { |
| foreign_fresh_lock_is_locked_naming_that_pid | function | 118 | no | fn foreign_fresh_lock_is_locked_naming_that_pid() { |
| release_via_drop_and_close_allows_reopen_and_removes_lock_file | function | 132 | no | fn release_via_drop_and_close_allows_reopen_and_removes_lock_file() { |
| stale_ttl_lock_is_stealable_and_rewritten | function | 154 | no | fn stale_ttl_lock_is_stealable_and_rewritten() { |
| ttl_constructor_param_steals_fresh_lock_once_expired | function | 182 | no | fn ttl_constructor_param_steals_fresh_lock_once_expired() { |
| data_written_before_a_crash_is_readable_after_reopen | function | 204 | no | fn data_written_before_a_crash_is_readable_after_reopen() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| std::fs | use | 16 | external |
| std::path::{Path, PathBuf} | use | 17 | external |
| std::time::{SystemTime, UNIX_EPOCH} | use | 18 | external |
| hqkg::apply_ledger::{FileApplyLedger, DEFAULT_LOCK_TTL_MS} | use | 20 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 13 | context | — | — | cross-process writer lock for the durable apply ledger |
| 14 | owner | hq-agent | — | hq-agent |
| 15 | task | — | — | W9 concurrent-writer safety |

## Excerpt

```rust
//! W9 concurrent-writer safety tests for the `FileApplyLedger` lock contract.
//!
//! Pins the locking deliverable: a `<path>.lock` file acquired at open with
//! create-new (`O_CREATE|O_EXCL`) semantics holding `<pid> <created_ms>` text;
//! a second open while held (in-process recursion or foreign holder) is
//! `Error::Locked { holder }` naming the holder pid; release (drop or
//! `close()`) removes the lock file and allows re-open; a stale TTL lock is
//! stealable and rewritten; a fresh lock naming this pid but left by a dead
//! same-pid run (crash leftover) is reclaimed; and durability is independent
//! of the lock (records fsynced before a crash are fully readable after
//! re-open). The 6 durability tests in `tests/apply_ledger.rs` stay untouched.
//!
//! @hq:context cross-process writer lock for the durable apply ledger
//! @hq:owner hq-agent
//! @hq:task W9 concurrent-writer safety
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use hqkg::apply_ledger::{FileApplyLedger, DEFAULT_LOCK_TTL_MS};

fn temp_dir(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "hqkg-apply-ledger-locking-{}-{}",
        name,
        std::process::id()
    ));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn now_ms() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}

fn lock_path(record: &Path) -> PathBuf {
    let mut s = record.as_os_str().to_os_string();
    s.push(".lock");
    PathBuf::from(s)
}

/// Plant a lock file as a previous run would have left it (W9 test matrix:
/// "create lock ... via std"). Format must match the shipped lock format.
fn plant_lock(record: &Path, pid: u32, created_ms: u128) {
    fs::write(lock_path(record), format!("{pid} {created_ms}\n")).unwrap();
}

/// Read back the shipped lock file format: `<pid> <created_ms>`.
fn read_lock(record: &Path) -> (u32, u128) {
    let text = fs::read_to_string(lock_path(record)).unwrap();
    let mut parts = text.trim().split_whitespace();
    let pid: u32 = parts.next().unwrap().parse().unwrap();
    let created_ms: u128 = parts.next().unwrap().parse().unwrap();
    (pid, created_ms)
}

/// A pid that is certainly not this process's pid.
fn foreign_pid() -> u32 {
    let me = std::process::id();
    if me == 1 {
        2
    } else {
        1
    }
}

fn assert_locked_naming(err: hqkg::Error, want: u32) {
    match err {
        hqkg::Error::Locked { holder } => assert_eq!(holder, want, "holder pid mismatch"),
        other => panic!("expected Error::Locked, got {other:?}"),
    }
}

/// (1) First open acquires the lock: `<path>.lock` exists, holds this
/// process's pid as text plus a fresh created-ms timestamp, and the ledger
/// still records durably while the lock is held.
```

_First 80 of 227 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

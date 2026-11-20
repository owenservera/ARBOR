# File: native/hqkg/src/apply_ledger.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/apply_ledger.rs |
| Language | Rust |
| Kind | source |
| Size | 18491 B |
| Lines | 420 |
| Hash | 50d54e7f44b2 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MAX_ID_BYTES | const | 90 | no | const MAX_ID_BYTES: usize = 256; |
| validate_id | function | 92 | no | fn validate_id(id: &amp;str) -&gt; Result&lt;()&gt; { |
| DEFAULT_LOCK_TTL_MS | const | 111 | yes | pub const DEFAULT_LOCK_TTL_MS: u64 = 30_000; |
| HELD_LOCKS | const | 119 | no | static HELD_LOCKS: Mutex&lt;Vec&lt;PathBuf&gt;&gt; = Mutex::new(Vec::new()); |
| registry_holds | function | 121 | no | fn registry_holds(held: &amp;Vec&lt;PathBuf&gt;, lock_path: &amp;Path) -&gt; bool { |
| lock_path_for | function | 125 | no | fn lock_path_for(record: &amp;Path) -&gt; PathBuf { |
| now_ms | function | 131 | no | fn now_ms() -&gt; u128 { |
| read_lock | function | 139 | no | fn read_lock(lock_path: &amp;Path) -&gt; Option&lt;(u32, u128)&gt; { |
| create_lock_file | function | 149 | no | fn create_lock_file(lock_path: &amp;Path, pid: u32, created_ms: u128) -&gt; io::Result&lt;()&gt; { |
| release_lock | function | 161 | no | fn release_lock(lock_path: &amp;Path) { |
| acquire_lock | function | 172 | no | fn acquire_lock(lock_path: &amp;Path, ttl_ms: u64) -&gt; Result&lt;()&gt; { |
| reclaim_locked | function | 216 | no | fn reclaim_locked(held: &amp;mut Vec&lt;PathBuf&gt;, lock_path: &amp;Path, me: u32, now: u128) -&gt; Result&lt;()&gt; { |
| FileApplyLedger | struct | 239 | yes | pub struct FileApplyLedger { |
| open | method | 254 | yes | pub fn open(path: impl Into&lt;PathBuf&gt;) -&gt; Result&lt;Self&gt; { |
| open_with_ttl | method | 262 | yes | pub fn open_with_ttl(path: impl Into&lt;PathBuf&gt;, ttl_ms: u64) -&gt; Result&lt;Self&gt; { |
| recover_and_open | method | 286 | no | fn recover_and_open(path: &amp;Path) -&gt; Result&lt;(BTreeSet&lt;String&gt;, fs::File)&gt; { |
| contains | method | 351 | yes | pub fn contains(&amp;self, change_set_id: &amp;str) -&gt; bool { |
| len | method | 356 | yes | pub fn len(&amp;self) -&gt; usize { |
| is_empty | method | 361 | yes | pub fn is_empty(&amp;self) -&gt; bool { |
| path | method | 366 | yes | pub fn path(&amp;self) -&gt; &amp;Path { |
| close | method | 374 | yes | pub fn close(self) {} |
| drop | method | 378 | no | fn drop(&amp;mut self) { |
| apply_durable | function | 399 | yes | pub fn apply_durable( graph: &amp;mut Graph, cs: &amp;crate::graph_change_set::GraphChangeSet, ledger: &amp;mut FileApplyLedger, ) -&gt; Result&lt;ApplyReport&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| std::collections::BTreeSet | use | 78 | external |
| std::fs::{self, OpenOptions} | use | 79 | external |
| std::io::{self, Write} | use | 80 | external |
| std::path::{Path, PathBuf} | use | 81 | external |
| std::sync::Mutex | use | 82 | external |
| std::time::{SystemTime, UNIX_EPOCH} | use | 83 | external |
| crate::graph_change_set::{apply, ApplyReport} | use | 85 | external |
| crate::{Error, Graph, Result} | use | 86 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 75 | context | — | — | durable cross-process idempotency for HQKG change sets |
| 76 | owner | hq-agent | — | hq-agent |
| 77 | task | — | — | OVN-A lane 4 / OVN-B durability |

## Excerpt

```rust
//! Durable, cross-process idempotency ledger for graph change sets.
//!
//! The W4 [`ApplyLedger`](crate::graph_change_set::ApplyLedger) is process
//! state: it cannot survive a restart, so duplicate replay is only idempotent
//! within one process. [`FileApplyLedger`] closes that gap (OVN-A lane 4 /
//! OVN-B durability): the same surface shape as the in-memory ledger, backed
//! by an append-only record file.
//!
//! # File format
//!
//! One change set id per line, newline-terminated (`id\n`). Ids are validated
//! at the same bounds as graph identifiers (1..256 bytes, no control
//! characters), so an id can never contain the line terminator. Each record is
//! appended with a single `write_all` and made durable with `sync_all()` —
//! mirroring `Journal::append_delta` — before `record` returns `Ok`.
//!
//! # Torn-write recovery
//!
//! Because a record is a prefix-safe single write whose terminator is the last
//! byte, a crash mid-append can only leave a partial record with no trailing
//! newline. On [`FileApplyLedger::open`] everything after the last `\n` is
//! treated as a torn tail: it is DISCARDED (and the file is truncated back to
//! the last complete record boundary) so only complete records load. A
//! complete line that violates the id bounds is a `Error::Corrupt`, not a
//! silent discard.
//!
//! # Ordering guarantee (enforced by [`apply_durable`])
//!
//! check `contains` -> apply -> record. A duplicate is refused before any
//! graph mutation; a failed apply errors out before `record`, so the ledger is
//! never poisoned by a change set that did not fully land and stays
//! re-appliable after a repair. The converse hazard is documented: if the
//! apply succeeds but `record` itself fails on I/O, the id is unrecorded and a
//! re-run re-applies the set — safe because Put ops are last-writer-wins and
//! Remove ops are already-absent skips.
//!
//! # Concurrent writers (W9)
//!
//! The ledger is single-writer by contract and the contract is now enforced
//! with a lock file next to the record file (`<path>.lock`), acquired at
//! [`FileApplyLedger::open`] with create-new (`O_CREATE|O_EXCL`) semantics
//! and held for the ledger's lifetime. The lock file holds one line,
//! `<pid> <created_ms>`: the holder pid (written as text) and the acquire
//! time in milliseconds since the Unix epoch. It is released on `drop`
//! (best-effort `remove_file`, failures ignored — a leftover lock file is
//! always recoverable under the rules below, so a leaked lock never wedges
//! the ledger permanently) or explicitly via [`FileApplyLedger::close`].
//!
//! Shipped stale-lock recovery rule set — EXCL + TTL + pid identity, applied
//! in this order:
//!
//! 1. **Process-internal recursion**: the path is already held by an open
//!    ledger in this process (in-process registry) → `Error::Locked` naming
//!    this pid, regardless of age.
//! 2. **Dead same-pid writer**: the lock names this process's pid but this
//!    process does not hold it — a lock left by a previous crashed run of
//!    the same pid (a live writer with our pid cannot exist on one machine;
//!    re-checked under the registry lock to close the same-process race) →
//!    reclaimed immediately.
//! 3. **Fresh lock**: younger than the constructor TTL → `Error::Locked`
//!    naming the holder pid read from the lock file.
//! 4. **TTL expiry**: older than the TTL (default [`DEFAULT_LOCK_TTL_MS`],
//!    constructor parameter of [`FileApplyLedger::open_with_ttl`]) → stolen
//!    and rewritten with this process's pid and a fresh timestamp.
//! 5. **Unparseable lock** (e.g. a torn lock-file write) → reclaimed.
//!
//! Accepted std-only limitations: rule 4 can steal the lock of a live
//! writer on another process or machine whose session exceeds the TTL (30 s
//! default, far above any single record operation); rule 2 assumes pids are
//! unique among live processes on one machine (no network filesystems).
//! Durability is independent of the lock: records are fsynced before
//! `record` returns `Ok`, so data written before a crash without release is
//! fully readable once the lock is recovered.
//!
//! @hq:context durable cross-process idempotency for HQKG change sets
//! @hq:owner hq-agent
//! @hq:task OVN-A lane 4 / OVN-B durability
use std::collections::BTreeSet;
use std::fs::{self, OpenOptions};
use std::io::{self, Write};
```

_First 80 of 421 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

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
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::graph_change_set::{apply, ApplyReport};
use crate::{Error, Graph, Result};

/// Hard bounds for a record line; matches graph identifier rules so a change
/// set id can never smuggle a newline into the record file.
const MAX_ID_BYTES: usize = 256;

fn validate_id(id: &str) -> Result<()> {
    let bytes = id.as_bytes();
    if bytes.is_empty() {
        return Err(Error::Invalid("change set id: empty".into()));
    }
    if bytes.len() > MAX_ID_BYTES {
        return Err(Error::Invalid("change set id exceeds 256 bytes".into()));
    }
    if bytes.iter().any(|&b| b < 0x20 || b == 0x7f) {
        return Err(Error::Invalid(
            "change set id contains control characters".into(),
        ));
    }
    Ok(())
}

/// Default staleness TTL for the writer lock, in milliseconds: a lock file
/// older than this is stealable at open. Constructor parameter of
/// [`FileApplyLedger::open_with_ttl`]; `open` uses this default.
pub const DEFAULT_LOCK_TTL_MS: u64 = 30_000;

/// Process-internal registry of lock paths currently held by open ledgers in
/// this process. Makes the recursion guard exact (rule 1): a second `open`
/// on the same path in one process is `Error::Locked` even before the TTL
/// could matter. Entries are cleared on release/drop; a real crash clears
/// the whole registry with the process, which is why a fresh lock naming
/// this pid but absent here is a dead same-pid writer (rule 2), not us.
static HELD_LOCKS: Mutex<Vec<PathBuf>> = Mutex::new(Vec::new());

fn registry_holds(held: &Vec<PathBuf>, lock_path: &Path) -> bool {
    held.iter().any(|p| p.as_path() == lock_path)
}

fn lock_path_for(record: &Path) -> PathBuf {
    let mut s = record.as_os_str().to_os_string();
    s.push(".lock");
    PathBuf::from(s)
}

fn now_ms() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}

/// Shipped lock file format: a single line `<pid> <created_ms>\n`.
fn read_lock(lock_path: &Path) -> Option<(u32, u128)> {
    let text = fs::read_to_string(lock_path).ok()?;
    let mut parts = text.trim().split_whitespace();
    let pid = parts.next()?.parse().ok()?;
    let created_ms = parts.next()?.parse().ok()?;
    Some((pid, created_ms))
}

/// Acquire the lock file with create-new (`O_CREATE|O_EXCL`) semantics and
/// write the holder pid and created-ms as text.
fn create_lock_file(lock_path: &Path, pid: u32, created_ms: u128) -> io::Result<()> {
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(lock_path)?;
    file.write_all(format!("{pid} {created_ms}\n").as_bytes())?;
    file.sync_all()
}

/// Best-effort release: a failed removal (e.g. the lock was already stolen
/// after TTL expiry) leaves a file that is recoverable under the module's
/// rules, so a leaked lock never wedges the ledger permanently.
fn release_lock(lock_path: &Path) {
    let _ = fs::remove_file(lock_path);
    HELD_LOCKS
        .lock()
        .unwrap_or_else(|p| p.into_inner())
        .retain(|p| p.as_path() != lock_path);
}

/// Acquire the writer lock for `lock_path` under the shipped rule set (see
/// the module docs). Returns once this process holds it; every failure is
/// `Error::Locked` naming the holder pid.
fn acquire_lock(lock_path: &Path, ttl_ms: u64) -> Result<()> {
    let me = std::process::id();
    {
        let held = HELD_LOCKS.lock().unwrap_or_else(|p| p.into_inner());
        if registry_holds(&held, lock_path) {
            // Rule 1: process-internal recursion guard.
            return Err(Error::Locked { holder: me });
        }
    }
    let now = now_ms();
    match create_lock_file(lock_path, me, now) {
        Ok(()) => {
            HELD_LOCKS
                .lock()
                .unwrap_or_else(|p| p.into_inner())
                .push(lock_path.to_path_buf());
            Ok(())
        }
        Err(e) if e.kind() == io::ErrorKind::AlreadyExists => {
            // Re-check the registry under the same lock that governs
            // reclaiming, so a same-process opener that just registered
            // cannot have its live lock stolen via rule 2.
            let mut held = HELD_LOCKS.lock().unwrap_or_else(|p| p.into_inner());
            match read_lock(lock_path) {
                // Rule 2: dead same-pid writer (previous crashed run of this
                // pid; a live writer with our pid cannot exist on one machine).
                Some((pid, _)) if pid == me && !registry_holds(&held, lock_path) => {
                    reclaim_locked(&mut held, lock_path, me, now)
                }
                // Rule 3: fresh lock from another (live) process.
                Some((pid, created)) if now.saturating_sub(created) < u128::from(ttl_ms) => {
                    Err(Error::Locked { holder: pid })
                }
                // Rules 4/5: TTL expired, or unparseable (torn) lock file.
                _ => reclaim_locked(&mut held, lock_path, me, now),
            }
        }
        Err(e) => Err(e.into()),
    }
}

/// Steal a stale lock (rules 2/4/5) and rewrite it for this process. Called
/// with the registry lock held; if the reclaim race is lost, the new holder
/// is named.
fn reclaim_locked(held: &mut Vec<PathBuf>, lock_path: &Path, me: u32, now: u128) -> Result<()> {
    let _ = fs::remove_file(lock_path);
    match create_lock_file(lock_path, me, now) {
        Ok(()) => {
            held.push(lock_path.to_path_buf());
            Ok(())
        }
        Err(_) => match read_lock(lock_path) {
            Some((pid, _)) => Err(Error::Locked { holder: pid }),
            None => Err(Error::Io(io::Error::new(
                io::ErrorKind::AlreadyExists,
                "apply ledger lock file could not be reclaimed",
            ))),
        },
    }
}

/// Append-only durable ledger of applied change set ids. Same surface shape
/// as the W4 in-memory `ApplyLedger`; the idempotency boundary survives a
/// process restart. Single-writer: enforced with a lock file (`<path>.lock`)
/// held for the ledger's lifetime — see the module docs for the locking and
/// stale-recovery contract (W9).
#[derive(Debug)]
pub struct FileApplyLedger {
    path: PathBuf,
    applied: BTreeSet<String>,
    append: fs::File,
    lock_path: PathBuf,
}

impl FileApplyLedger {
    /// Open (and recover) the ledger at `path`. A missing or empty file opens
    /// clean. A trailing partial line (no terminator) is discarded and the
    /// file is truncated to the last complete record; see the module docs.
    ///
    /// Acquires the cross-process writer lock (`<path>.lock`) first, using
    /// the default stale-lock TTL [`DEFAULT_LOCK_TTL_MS`]; see
    /// [`FileApplyLedger::open_with_ttl`] for the explicit-TTL constructor.
    pub fn open(path: impl Into<PathBuf>) -> Result<Self> {
        Self::open_with_ttl(path, DEFAULT_LOCK_TTL_MS)
    }

    /// Like [`FileApplyLedger::open`], with an explicit stale-lock TTL in
    /// milliseconds: a lock file older than `ttl_ms` is stealable at open
    /// (module rule 4). The lock is held for the ledger's lifetime and
    /// released on `drop` (best-effort) or [`FileApplyLedger::close`].
    pub fn open_with_ttl(path: impl Into<PathBuf>, ttl_ms: u64) -> Result<Self> {
        let path = path.into();
        if let Some(parent) = path.parent().filter(|p| !p.as_os_str().is_empty()) {
            fs::create_dir_all(parent)?;
        }
        let lock_path = lock_path_for(&path);
        acquire_lock(&lock_path, ttl_ms)?;
        match Self::recover_and_open(&path) {
            Ok((applied, append)) => Ok(Self {
                path,
                applied,
                append,
                lock_path,
            }),
            Err(e) => {
                // A failed open must not wedge the path behind a held lock.
                release_lock(&lock_path);
                Err(e)
            }
        }
    }

    /// Torn-tail recovery and record loading (the previous `open` body), run
    /// only after the writer lock is held.
    fn recover_and_open(path: &Path) -> Result<(BTreeSet<String>, fs::File)> {
        let mut applied = BTreeSet::new();
        if path.exists() {
            let bytes = fs::read(&path)?;
            let complete = match bytes.iter().rposition(|&b| b == b'\n') {
                // Everything after the last newline is a torn tail: discard.
                Some(pos) => pos + 1,
                None => 0,
            };
            // `split` on a `\n`-terminated region yields one trailing empty
            // segment; an empty line anywhere else is a corrupt record.
            let segments: Vec<&[u8]> = bytes[..complete].split(|&b| b == b'\n').collect();
            let last = segments.len().saturating_sub(1);
            for (index, line) in segments.iter().enumerate() {
                if line.is_empty() {
                    if index != last {
                        return Err(Error::Corrupt(format!(
                            "empty ledger record in {}",
                            path.display()
                        )));
                    }
                    continue;
                }
                let id = std::str::from_utf8(line).map_err(|_| {
                    Error::Corrupt(format!("non-utf8 ledger record in {}", path.display()))
                })?;
                validate_id(id).map_err(|e| match e {
                    Error::Invalid(m) => {
                        Error::Corrupt(format!("invalid ledger record in {}: {m}", path.display()))
                    }
                    other => other,
                })?;
                applied.insert(id.to_owned());
            }
            if complete < bytes.len() {
                // Repair on disk so the next append starts at a record boundary.
                let file = OpenOptions::new().write(true).open(&path)?;
                file.set_len(complete as u64)?;
                file.sync_all()?;
            }
        }
        let append = OpenOptions::new().create(true).append(true).open(path)?;
        Ok((applied, append))
    }

    /// Record a change set id as applied. `Ok(true)` = first record (appended
    /// and fsynced before returning); `Ok(false)` = duplicate (the file is
    /// not touched). The record is durable when this returns `Ok`.
    pub fn record(&mut self, change_set_id: &str) -> Result<bool> {
        validate_id(change_set_id)?;
        if self.applied.contains(change_set_id) {
            return Ok(false);
        }
        let mut line = String::with_capacity(change_set_id.len() + 1);
        line.push_str(change_set_id);
        line.push('\n');
        self.append.write_all(line.as_bytes())?;
        self.append.flush()?;
        self.append.sync_all()?;
        self.applied.insert(change_set_id.to_owned());
        Ok(true)
    }

    /// True when `change_set_id` was already applied (from memory, which was
    /// recovered from disk at open).
    pub fn contains(&self, change_set_id: &str) -> bool {
        self.applied.contains(change_set_id)
    }

    /// Number of recorded change set ids.
    pub fn len(&self) -> usize {
        self.applied.len()
    }

    /// True when nothing has been recorded.
    pub fn is_empty(&self) -> bool {
        self.applied.is_empty()
    }

    /// The backing record file path.
    pub fn path(&self) -> &Path {
        &self.path
    }

    /// Explicitly release the writer lock and consume the ledger. The
    /// removal is best-effort, exactly like `drop` (a failed removal leaves
    /// a file recoverable under the module's stale-lock rules); provided so
    /// callers and tests can release without relying on scope end.
    pub fn close(self) {}
}

impl Drop for FileApplyLedger {
    fn drop(&mut self) {
        // Best-effort: a failed removal (e.g. the lock was already stolen
        // after TTL expiry) leaves a recoverable leftover, never a wedge.
        release_lock(&self.lock_path);
    }
}

/// Apply a change set against the graph with durable idempotency.
///
/// Ordering (enforced here, stated in the module docs): check `contains` ->
/// apply -> record.
///
/// 1. A duplicate (`ledger.contains`) is refused before any graph mutation
///    and reported with `duplicate: true`.
/// 2. The apply runs via [`apply`] with a scratch in-memory ledger. A failed
///    op returns `Err` before step 3, so a change set that did not fully land
///    is never recorded and stays re-appliable after a repair.
/// 3. Only after a successful apply is the id appended and fsynced
///    (`FileApplyLedger::record`). If that final record fails on I/O, the id
///    is unrecorded and a re-run re-applies the set — safe because Put ops
///    are last-writer-wins and Remove ops are already-absent skips.
pub fn apply_durable(
    graph: &mut Graph,
    cs: &crate::graph_change_set::GraphChangeSet,
    ledger: &mut FileApplyLedger,
) -> Result<ApplyReport> {
    if ledger.contains(&cs.change_set_id) {
        return Ok(ApplyReport {
            change_set_id: cs.change_set_id.clone(),
            duplicate: true,
            applied: 0,
            skipped: 0,
            invalidation_set: BTreeSet::new(),
            tombstones: Vec::new(),
        });
    }
    // Scratch ledger: apply() inserts into it after success; the durable
    // record below is the boundary that survives a restart.
    let mut scratch = crate::graph_change_set::ApplyLedger::new();
    let report = apply(graph, cs, &mut scratch)?;
    ledger.record(&cs.change_set_id)?;
    Ok(report)
}

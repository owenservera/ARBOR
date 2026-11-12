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
#[test]
fn first_open_acquires_lock_file_naming_holder_pid() {
    let dir = temp_dir("acquire");
    let path = dir.join("ledger.applied");
    let mut ledger = FileApplyLedger::open(&path).unwrap();
    let lock = lock_path(&path);
    assert!(lock.exists(), "lock file must exist while held");
    let (pid, created) = read_lock(&path);
    assert_eq!(pid, std::process::id(), "lock must name the holder pid");
    let age = now_ms().saturating_sub(created);
    assert!(age < 60_000, "lock created-ms must be fresh, age {age}ms");
    assert!(
        ledger.record("cs-1").unwrap(),
        "recording works while locked"
    );
    drop(ledger);
    fs::remove_dir_all(&dir).unwrap();
}

/// (2) Process-internal recursion guard: a second `open` on the same path
/// within one process while held is `Error::Locked` naming this pid, and the
/// first ledger keeps working afterwards.
#[test]
fn second_open_while_held_is_locked_naming_holder() {
    let dir = temp_dir("recursion");
    let path = dir.join("ledger.applied");
    let mut ledger = FileApplyLedger::open(&path).unwrap();
    let second = FileApplyLedger::open(&path);
    assert_locked_naming(second.unwrap_err(), std::process::id());
    assert!(ledger.record("cs-1").unwrap(), "first holder unaffected");
    drop(ledger);
    fs::remove_dir_all(&dir).unwrap();
}

/// (3) A fresh lock held by a foreign pid (simulated cross-process holder) is
/// `Error::Locked` naming THAT pid, not ours.
#[test]
fn foreign_fresh_lock_is_locked_naming_that_pid() {
    let dir = temp_dir("foreign");
    let path = dir.join("ledger.applied");
    fs::write(&path, b"").unwrap();
    let holder = foreign_pid();
    plant_lock(&path, holder, now_ms());
    let open = FileApplyLedger::open(&path);
    assert_locked_naming(open.unwrap_err(), holder);
    fs::remove_dir_all(&dir).unwrap();
}

/// (4) Release allows re-open and removes the lock file: via `drop` and via
/// the explicit `close()`.
#[test]
fn release_via_drop_and_close_allows_reopen_and_removes_lock_file() {
    let dir = temp_dir("release");
    let path = dir.join("ledger.applied");
    let mut ledger = FileApplyLedger::open(&path).unwrap();
    assert!(ledger.record("cs-1").unwrap());
    let lock = lock_path(&path);
    ledger.close();
    assert!(!lock.exists(), "close() must remove the lock file");
    let reopened = FileApplyLedger::open(&path).unwrap();
    assert!(reopened.contains("cs-1"), "records survive close+reopen");
    drop(reopened);
    assert!(!lock.exists(), "drop must remove the lock file");
    let again = FileApplyLedger::open(&path).unwrap();
    assert!(again.contains("cs-1"));
    drop(again);
    fs::remove_dir_all(&dir).unwrap();
}

/// (5) Stale TTL lock is stealable with the default TTL: a lock left behind
/// with a created-ms older than DEFAULT_LOCK_TTL_MS opens successfully and
/// the lock file is rewritten to name this process.
#[test]
fn stale_ttl_lock_is_stealable_and_rewritten() {
    let dir = temp_dir("stale-ttl");
    let path = dir.join("ledger.applied");
    let holder = foreign_pid();
    plant_lock(
        &path,
        holder,
        now_ms() - u128::from(DEFAULT_LOCK_TTL_MS) - 5_000,
    );
    let mut ledger = FileApplyLedger::open(&path).unwrap();
    let (pid, created) = read_lock(&path);
    assert_eq!(pid, std::process::id(), "stale lock must be rewritten");
    assert_eq!(
        read_lock(&path).0,
        pid,
        "rewritten lock still parses as pid + created-ms"
    );
    let age = now_ms().saturating_sub(created);
    assert!(age < 60_000, "rewritten lock must carry a fresh timestamp");
    assert!(ledger.record("cs-1").unwrap());
    drop(ledger);
    fs::remove_dir_all(&dir).unwrap();
}

/// (6) The TTL is a constructor parameter: `open_with_ttl` with a small TTL
/// steals a fresh lock once it ages past it, and a second fresh open of the
/// same young lock would have been refused without the small TTL.
#[test]
fn ttl_constructor_param_steals_fresh_lock_once_expired() {
    let dir = temp_dir("ttl-param");
    let path = dir.join("ledger.applied");
    let holder = foreign_pid();
    plant_lock(&path, holder, now_ms());
    // Fresh lock, generous TTL: refused.
    let open_default = FileApplyLedger::open_with_ttl(&path, DEFAULT_LOCK_TTL_MS);
    assert_locked_naming(open_default.unwrap_err(), holder);
    // Same lock after it ages past a small constructor TTL: stolen.
    std::thread::sleep(std::time::Duration::from_millis(120));
    let mut ledger = FileApplyLedger::open_with_ttl(&path, 50).unwrap();
    assert_eq!(read_lock(&path).0, std::process::id());
    assert!(ledger.record("cs-1").unwrap());
    drop(ledger);
    fs::remove_dir_all(&dir).unwrap();
}

/// (7) Durability is independent of the lock: data recorded before a crash
/// that never released the lock (leftover lock file from a dead same-pid run)
/// is fully readable after re-open, and the dead holder's lock is reclaimed
/// because a live writer with this pid cannot exist on one machine.
#[test]
fn data_written_before_a_crash_is_readable_after_reopen() {
    let dir = temp_dir("crash");
    let path = dir.join("ledger.applied");
    {
        let mut ledger = FileApplyLedger::open(&path).unwrap();
        assert!(ledger.record("cs-crash").unwrap());
        // record is fsynced before returning; the ledger is dropped here, but
        // the crash leftover is simulated below by re-planting the lock file
        // (a real crash would leave it behind; `mem::forget` would instead
        // keep this process's in-process registry entry, which a real crash
        // clears with the process).
    }
    plant_lock(&path, std::process::id(), now_ms());
    let ledger = FileApplyLedger::open(&path).unwrap();
    assert!(
        ledger.contains("cs-crash"),
        "data written before the crash must be fully readable"
    );
    assert_eq!(ledger.len(), 1);
    drop(ledger);
    assert!(!lock_path(&path).exists());
    fs::remove_dir_all(&dir).unwrap();
}

/**
 * @hq:context durable kernel store outside .hq/: append-only revisions, single-writer lock, provenance, receipts
 * @hq:owner hq-agent (L1)
 * @hq:task L1
 * Implements the frozen contract hq.kernel-store/1 (docs/integration/contracts/kernel-store.md §2-§6).
 * Runs on node:sqlite under Node v24 and Bun 1.4.2. Bun's node:sqlite (1.4.2) has no online backup API,
 * so backup/restore use VACUUM INTO (SQLite-native consistent copy, never an OS file copy).
 */

import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { canonical, sha256 } from '../util.mjs';

const SCHEMA_VERSION = 1;
const SCHEMA_ID = 'hq.kernel-store/1';

const REFUSAL = Object.freeze({
  LOCKED: 'KERNEL_LOCKED',
  SCHEMA_MISMATCH: 'KERNEL_SCHEMA_MISMATCH',
  ORDINAL_GAP: 'KERNEL_ORDINAL_GAP',
  PROVENANCE_REQUIRED: 'KERNEL_PROVENANCE_REQUIRED',
  SECRET_REFUSED: 'KERNEL_SECRET_REFUSED',
  PATH_FORBIDDEN: 'KERNEL_PATH_FORBIDDEN',
});

export { REFUSAL };

class KernelError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'KernelError';
  }
}

// Duplicated here deliberately: hq/lib/kb-intake.mjs is outside L1's write scope,
// so the kernel store carries its own copy of the intake secret patterns.
const SECRET_PATTERNS = [
  { id: 'sk-token', re: /sk-[A-Za-z0-9]{16,}/ },
  { id: 'private-key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { id: 'password-assignment', re: /password\s*=\s*\S+/i },
  { id: 'credential-assignment', re: /\b(?:api[_-]?key|secret|token|cookie|authorization)\s*[:=]\s*\S{8,}/i },
  { id: 'bearer-token', re: /\bBearer\s+[A-Za-z0-9._-]{20,}/ },
  { id: 'connection-string', re: /\b(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis|rediss|amqp|amqps|clickhouse|mssql|sqlserver):\/\/[^\s:@/]+:[^\s:@/]+@/i },
];

function scanSecrets(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    for (const rule of SECRET_PATTERNS) if (rule.re.test(value)) return rule;
    return null;
  }
  if (Array.isArray(value)) {
    for (const item of value) { const hit = scanSecrets(item); if (hit) return hit; }
    return null;
  }
  if (typeof value === 'object') {
    for (const key of Object.keys(value)) {
      const hit = scanSecrets(value[key]);
      if (hit) return hit;
    }
  }
  return null;
}

function findWorkspaceRoot(start = process.cwd()) {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, 'projects.json')) || existsSync(join(dir, '.hq'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return dir;
    dir = parent;
  }
}

export function defaultDbPath() {
  // Contract §2: HQ_KERNEL_DB overrides the default for tests and alternate installs. The
  // override is still subject to the .hq/ guard; an env var cannot defeat invariant §4.4.
  const override = process.env.HQ_KERNEL_DB;
  if (override && String(override).trim()) return checkPath(override);
  return join(findWorkspaceRoot(), 'kernel', 'kernel.db');
}

function checkPath(dbPath) {
  const resolved = resolve(String(dbPath ?? ''));
  if (resolved.split(/[\/\\]/).includes('.hq')) {
    throw new KernelError(REFUSAL.PATH_FORBIDDEN, `kernel store path is inside .hq/ and would be wiped by hq reset: ${resolved}`);
  }
  return resolved;
}

function openKernelDb(dbPath) {
  const resolved = checkPath(dbPath);
  mkdirSync(dirname(resolved), { recursive: true });
  const db = new DatabaseSync(resolved);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA synchronous = FULL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  migrate(db);
  return db;
}

const DDL = `
CREATE TABLE IF NOT EXISTS "kernel_meta" (
  "key"   TEXT PRIMARY KEY,
  "value" TEXT NOT NULL
);

-- Single-writer marker: exactly one row. owner_pid is the live writer process.
CREATE TABLE IF NOT EXISTS "kernel_lock" (
  "rowid"            INTEGER PRIMARY KEY CHECK ("rowid" = 1),
  "owner_pid"        INTEGER NOT NULL,
  "owner_started_at" TEXT NOT NULL,
  "acquired_at"      TEXT NOT NULL
);

-- Append-only revision journal. One row per accepted mutation, never updated or deleted.
CREATE TABLE IF NOT EXISTS "kernel_revisions" (
  "seq"            INTEGER PRIMARY KEY,
  "domain"         TEXT NOT NULL,
  "target_id"      TEXT NOT NULL,
  "revision"       TEXT NOT NULL UNIQUE,
  "content_hash"   TEXT NOT NULL,
  "parent_revision" TEXT,
  "actor"          TEXT,
  "source"         TEXT,
  "created_at"     TEXT NOT NULL,
  "payload"        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "kernel_revisions_domain_target" ON "kernel_revisions"("domain", "target_id", "seq");

-- Current pointer per entry. id = domain/targetId. Deletion sets deleted_at, never DELETE.
CREATE TABLE IF NOT EXISTS "kernel_entries" (
  "id"             TEXT PRIMARY KEY,
  "domain"         TEXT NOT NULL,
  "target_id"      TEXT NOT NULL,
  "kind"           TEXT,
  "title"          TEXT,
  "status"         TEXT,
  "authority"      TEXT,
  "sensitivity"    TEXT,
  "current_revision" TEXT,
  "content_hash"   TEXT,
  "deleted_at"     TEXT,
  UNIQUE("domain", "target_id")
);

CREATE TABLE IF NOT EXISTS "kernel_entities" (
  "id"        TEXT PRIMARY KEY,
  "title"     TEXT,
  "kind"      TEXT,
  "owner"     TEXT,
  "fields"    TEXT,
  "relations" TEXT,
  "invariants" TEXT,
  "source"    TEXT
);

CREATE TABLE IF NOT EXISTS "kernel_types" (
  "id"   TEXT PRIMARY KEY,
  "kind" TEXT,
  "of"   TEXT,
  "values" TEXT
);

CREATE TABLE IF NOT EXISTS "kernel_schemas" (
  "id"         TEXT PRIMARY KEY,
  "version"    TEXT,
  "target"     TEXT,
  "json_schema" TEXT
);

CREATE TABLE IF NOT EXISTS "kernel_flows" (
  "id"         TEXT PRIMARY KEY,
  "title"      TEXT,
  "actors"     TEXT,
  "steps"      TEXT,
  "inputs"     TEXT,
  "outputs"    TEXT,
  "authority"  TEXT,
  "source"     TEXT
);

CREATE TABLE IF NOT EXISTS "kernel_sources" (
  "id"          TEXT PRIMARY KEY,
  "kind"        TEXT,
  "trust"       TEXT,
  "owner"       TEXT,
  "description" TEXT
);

CREATE TABLE IF NOT EXISTS "kernel_actions" (
  "id"             TEXT PRIMARY KEY,
  "title"          TEXT,
  "actor"          TEXT,
  "effects"        TEXT,
  "authority"      TEXT,
  "idempotency"    TEXT,
  "input_schema"   TEXT,
  "output_schema"  TEXT
);

CREATE TABLE IF NOT EXISTS "kernel_authority" (
  "id"            TEXT PRIMARY KEY,
  "subject"       TEXT,
  "may"           TEXT,
  "may_not"       TEXT,
  "requires_owner" TEXT,
  "rationale"     TEXT
);

CREATE TABLE IF NOT EXISTS "kernel_features" (
  "id"     TEXT PRIMARY KEY,
  "title"  TEXT,
  "status" TEXT,
  "flows"  TEXT,
  "actions" TEXT
);

CREATE TABLE IF NOT EXISTS "kernel_usecases" (
  "id"      TEXT PRIMARY KEY,
  "title"   TEXT,
  "actor"   TEXT,
  "feature" TEXT,
  "flow"    TEXT,
  "given"   TEXT,
  "when"    TEXT,
  "then"    TEXT,
  "evidence" TEXT
);

-- Where a row came from: mandatory on every write. Append-only (a target may have many provenance rows).
CREATE TABLE IF NOT EXISTS "kernel_provenance" (
  "target_id"      TEXT NOT NULL,
  "source_id"      TEXT NOT NULL,
  "source_table"   TEXT,
  "source_key"     TEXT,
  "source_revision" TEXT,
  "content_hash"   TEXT,
  "observed_at"    TEXT
);
CREATE INDEX IF NOT EXISTS "kernel_provenance_target" ON "kernel_provenance"("target_id");

-- Deletion is a record, never a DELETE.
CREATE TABLE IF NOT EXISTS "kernel_tombstones" (
  "target_id"   TEXT NOT NULL,
  "reason"      TEXT,
  "source"      TEXT,
  "created_at"  TEXT NOT NULL,
  PRIMARY KEY ("target_id", "created_at")
);

-- One row per import attempt; result is 'ok' or 'refused', never a silent partial success.
CREATE TABLE IF NOT EXISTS "kernel_imports" (
  "id"            TEXT PRIMARY KEY,
  "schema"        TEXT,
  "package_digest" TEXT,
  "counts"        TEXT,
  "result"        TEXT NOT NULL,
  "created_at"    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "kernel_connectors" (
  "id"           TEXT PRIMARY KEY,
  "kind"         TEXT,
  "root"         TEXT,
  "read_only"    TEXT,
  "manifest"     TEXT,
  "last_run_at"  TEXT,
  "status"       TEXT
);

CREATE TABLE IF NOT EXISTS "kernel_cursors" (
  "connector_id"  TEXT NOT NULL,
  "table"         TEXT NOT NULL,
  "cursor"        TEXT,
  "source_revision" TEXT,
  "observed_at"   TEXT,
  PRIMARY KEY ("connector_id", "table")
);

-- Evidence ledger for kernel operations (writes, refusals, lock reclaims, restores).
CREATE TABLE IF NOT EXISTS "kernel_receipts" (
  "id"        TEXT PRIMARY KEY,
  "action"    TEXT NOT NULL,
  "subject"   TEXT NOT NULL,
  "result"    TEXT NOT NULL,
  "evidence"  TEXT,
  "created_at" TEXT NOT NULL
);
`;

function migrate(db) {
  db.exec(DDL);
  const row = db.prepare("SELECT value FROM kernel_meta WHERE key = 'user_version'").get();
  if (!row) {
    const installId = sha256(`${new Date().toISOString()}:${process.pid}:${Math.random()}`).slice(0, 24);
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare('INSERT INTO kernel_meta(key, value) VALUES (?, ?)').run('user_version', String(SCHEMA_VERSION));
      db.prepare('INSERT INTO kernel_meta(key, value) VALUES (?, ?)').run('created_at', new Date().toISOString());
      db.prepare('INSERT INTO kernel_meta(key, value) VALUES (?, ?)').run('install_id', installId);
      db.exec('COMMIT');
    } catch (error) { try { db.exec('ROLLBACK'); } catch { /* already rolled back */ } throw error; }
  } else {
    const version = Number(row.value);
    if (!Number.isFinite(version) || version > SCHEMA_VERSION) {
      throw new KernelError(REFUSAL.SCHEMA_MISMATCH, `kernel store user_version ${row.value} is newer than this code (v${SCHEMA_VERSION})`);
    }
  }
}

export function initKernel({ dbPath = defaultDbPath() } = {}) {
  const resolved = checkPath(dbPath);
  const db = openKernelDb(resolved);
  try {
    const row = db.prepare("SELECT value FROM kernel_meta WHERE key = 'user_version'").get();
    return {
      schema: SCHEMA_ID,
      dbPath: resolved,
      userVersion: row ? Number(row.value) : SCHEMA_VERSION,
    };
  } finally { db.close(); }
}

function isPidAlive(pid) {
  try {
    process.kill(Number(pid), 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

function recordReceipt(db, { action, subject, result, evidence }) {
  const id = 'rcpt_' + sha256(`${action}\0${subject}\0${result}\0${evidence ?? ''}\0${process.pid}`).slice(0, 24);
  db.prepare(`INSERT INTO kernel_receipts(id, action, subject, result, evidence, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING`).run(id, action, subject, result, String(evidence ?? ''), new Date().toISOString());
  return id;
}

function withWriteLock(db) {
  const row = db.prepare('SELECT owner_pid FROM kernel_lock WHERE rowid = 1').get();
  if (!row || Number(row.owner_pid) !== process.pid) {
    const owner = row ? String(row.owner_pid) : 'none';
    throw new KernelError(REFUSAL.LOCKED, `kernel write requires the writer lock to be held by this process (held by pid ${owner})`);
  }
}

export function acquireKernelLock({ dbPath = defaultDbPath(), force = false } = {}) {
  const resolved = checkPath(dbPath);
  const db = openKernelDb(resolved);
  try {
    db.exec('BEGIN IMMEDIATE');
    try {
      const row = db.prepare('SELECT owner_pid, owner_started_at, acquired_at FROM kernel_lock WHERE rowid = 1').get();
      const me = process.pid;
      const now = new Date().toISOString();
      if (!row) {
        db.prepare('INSERT INTO kernel_lock(rowid, owner_pid, owner_started_at, acquired_at) VALUES (1, ?, ?, ?)').run(me, now, now);
        recordReceipt(db, { action: 'acquire_lock', subject: 'kernel', result: 'ok', evidence: `pid=${me}` });
        db.exec('COMMIT');
        return { acquired: true, ownerPid: me, stale: false };
      }
      if (Number(row.owner_pid) === me) {
        db.exec('COMMIT');
        return { acquired: true, ownerPid: me, stale: false, reentrant: true };
      }
      if (isPidAlive(Number(row.owner_pid))) {
        throw new KernelError(REFUSAL.LOCKED, `kernel lock is held by pid ${row.owner_pid} (started ${row.owner_started_at})`);
      }
      if (!force) {
        throw new KernelError(REFUSAL.LOCKED, `kernel lock is held by dead pid ${row.owner_pid}; pass --force to reclaim`);
      }
      db.prepare('UPDATE kernel_lock SET owner_pid = ?, owner_started_at = ?, acquired_at = ? WHERE rowid = 1').run(me, now, now);
      recordReceipt(db, { action: 'reclaim_lock', subject: 'kernel', result: 'ok', evidence: `reclaimed stale pid ${row.owner_pid} -> pid=${me}` });
      db.exec('COMMIT');
      return { acquired: true, ownerPid: me, stale: true, reclaimed: true };
    } catch (error) { try { db.exec('ROLLBACK'); } catch { /* already rolled back */ } throw error; }
  } finally { db.close(); }
}

export function releaseKernelLock({ dbPath = defaultDbPath() } = {}) {
  const resolved = checkPath(dbPath);
  const db = openKernelDb(resolved);
  try {
    db.exec('BEGIN IMMEDIATE');
    try {
      const row = db.prepare('SELECT owner_pid FROM kernel_lock WHERE rowid = 1').get();
      if (row && Number(row.owner_pid) === process.pid) {
        db.prepare('DELETE FROM kernel_lock WHERE rowid = 1').run();
        recordReceipt(db, { action: 'release_lock', subject: 'kernel', result: 'ok', evidence: `pid=${process.pid}` });
      }
      db.exec('COMMIT');
      return { released: true };
    } catch (error) { try { db.exec('ROLLBACK'); } catch { /* already rolled back */ } throw error; }
  } finally { db.close(); }
}

export function kernelWrite(domain, targetId, payload, options = {}) {
  const { actor, source, parentRevision, provenance, dbPath = defaultDbPath() } = options;
  const resolved = checkPath(dbPath);
  const db = openKernelDb(resolved);
  try {
    db.exec('BEGIN IMMEDIATE');
    try {
      withWriteLock(db);
      const secret = scanSecrets(payload);
      if (secret) {
        throw new KernelError(REFUSAL.SECRET_REFUSED, `kernel write refused: payload matches secret pattern "${secret.id}"`);
      }
      if (!provenance || !provenance.source_id) {
        throw new KernelError(REFUSAL.PROVENANCE_REQUIRED, 'kernel write requires provenance.source_id');
      }
      const seqRow = db.prepare('SELECT COALESCE(MAX(seq), 0) AS m FROM kernel_revisions').get();
      const seq = Number(seqRow.m) + 1;
      const revision = `rev_${seq}`;
      // The chain is linear. A caller-supplied parentRevision is allowed only when it is the
      // current head; anything else would make kernelVerify report a broken parent link.
      const expectedParent = seq === 1 ? null : `rev_${seq - 1}`;
      if (parentRevision != null && parentRevision !== expectedParent) {
        throw new KernelError(REFUSAL.ORDINAL_GAP, `kernel write refused: parentRevision ${parentRevision} is not the current head ${expectedParent ?? '(none)'}`);
      }
      const parent = expectedParent;
      const createdAt = new Date().toISOString();
      const payloadText = JSON.stringify(canonical(payload));
      const contentHash = sha256(payloadText);
      db.prepare(`INSERT INTO kernel_revisions(seq, domain, target_id, revision, content_hash, parent_revision, actor, source, created_at, payload)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(seq, domain, targetId, revision, contentHash, parent, actor ?? null, source ?? null, createdAt, payloadText);
      const entryId = `${domain}/${targetId}`;
      db.prepare(`INSERT INTO kernel_entries(id, domain, target_id, kind, title, status, authority, sensitivity, current_revision, content_hash, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
        ON CONFLICT(id) DO UPDATE SET
          kind = excluded.kind, title = excluded.title, status = excluded.status,
          authority = excluded.authority, sensitivity = excluded.sensitivity,
          current_revision = excluded.current_revision, content_hash = excluded.content_hash, deleted_at = NULL`)
        .run(entryId, domain, targetId, payload.kind ?? 'entry', payload.title ?? '', payload.status ?? 'draft',
          payload.authority ?? actor ?? null, payload.sensitivity ?? 'internal', revision, contentHash);
      db.prepare(`INSERT INTO kernel_provenance(target_id, source_id, source_table, source_key, source_revision, content_hash, observed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(targetId, provenance.source_id, provenance.source_table ?? null, provenance.source_key ?? null,
          provenance.source_revision ?? null, contentHash, provenance.observed_at ?? createdAt);
      recordReceipt(db, { action: 'write', subject: `${domain}/${targetId}`, result: 'ok', evidence: contentHash });
      db.exec('COMMIT');
      return {
        schema: SCHEMA_ID, domain, target_id: targetId, revision, seq, content_hash: contentHash,
        parent_revision: parent, created_at: createdAt,
      };
    } catch (error) { try { db.exec('ROLLBACK'); } catch { /* already rolled back */ } throw error; }
  } finally { db.close(); }
}

export function kernelDelete(domain, targetId, options = {}) {
  const { actor, source, provenance, reason, dbPath = defaultDbPath() } = options;
  const resolved = checkPath(dbPath);
  const db = openKernelDb(resolved);
  try {
    db.exec('BEGIN IMMEDIATE');
    try {
      withWriteLock(db);
      const secret = scanSecrets({ reason, target: { domain, target_id: targetId } });
      if (secret) throw new KernelError(REFUSAL.SECRET_REFUSED, `kernel delete refused: ${secret.id}`);
      if (!provenance || !provenance.source_id) throw new KernelError(REFUSAL.PROVENANCE_REQUIRED, 'kernel delete requires provenance.source_id');
      const entry = db.prepare('SELECT * FROM kernel_entries WHERE id = ?').get(`${domain}/${targetId}`);
      if (!entry) throw new Error(`kernel delete: no entry for ${domain}/${targetId}`);
      const seqRow = db.prepare('SELECT COALESCE(MAX(seq), 0) AS m FROM kernel_revisions').get();
      const seq = Number(seqRow.m) + 1;
      const revision = `rev_${seq}`;
      const parent = seq === 1 ? null : `rev_${seq - 1}`;
      const createdAt = new Date().toISOString();
      const payloadText = JSON.stringify({ op: 'delete', domain, target_id: targetId, reason, prior_revision: entry.current_revision });
      const contentHash = sha256(payloadText);
      db.prepare(`INSERT INTO kernel_revisions(seq, domain, target_id, revision, content_hash, parent_revision, actor, source, created_at, payload)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(seq, domain, targetId, revision, contentHash, parent, actor ?? null, source ?? null, createdAt, payloadText);
      db.prepare('UPDATE kernel_entries SET deleted_at = ? WHERE id = ?').run(createdAt, entry.id);
      db.prepare(`INSERT INTO kernel_tombstones(target_id, reason, source, created_at) VALUES (?, ?, ?, ?)`)
        .run(targetId, reason ?? null, source ?? null, createdAt);
      db.prepare(`INSERT INTO kernel_provenance(target_id, source_id, source_table, source_key, source_revision, content_hash, observed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(targetId, provenance.source_id, provenance.source_table ?? null, provenance.source_key ?? null,
          provenance.source_revision ?? null, contentHash, provenance.observed_at ?? createdAt);
      recordReceipt(db, { action: 'delete', subject: `${domain}/${targetId}`, result: 'ok', evidence: contentHash });
      db.exec('COMMIT');
      return { schema: SCHEMA_ID, domain, target_id: targetId, revision, seq, content_hash: contentHash, deleted_at: createdAt };
    } catch (error) { try { db.exec('ROLLBACK'); } catch { /* already rolled back */ } throw error; }
  } finally { db.close(); }
}

/**
 * Append a rollback revision: history grows by one, the current pointer moves to the new
 * revision, and its payload is the older revision's payload plus rollbackOf. The chain stays
 * linear, so kernelVerify remains whole. Contract §4.1 / §7.4.
 */
export function kernelRollback(domain, targetId, { toRevision, actor, source, provenance, dbPath = defaultDbPath() } = {}) {
  if (!toRevision) throw new KernelError(REFUSAL.ORDINAL_GAP, 'kernel rollback requires toRevision');
  const target = kernelRead(domain, targetId, { revision: toRevision, dbPath });
  if (!target || !target.payload) {
    throw new KernelError(REFUSAL.ORDINAL_GAP, `kernel rollback refused: revision ${toRevision} is not in the chain for ${domain}/${targetId}`);
  }
  return kernelWrite(domain, targetId, { ...target.payload, rollbackOf: toRevision }, { actor, source, provenance, dbPath });
}

function mapRevision(row) {
  if (!row) return null;
  return {
    seq: row.seq, domain: row.domain, target_id: row.target_id,
    revision: row.revision, content_hash: row.content_hash,
    parent_revision: row.parent_revision, actor: row.actor, source: row.source,
    created_at: row.created_at, payload: JSON.parse(row.payload),
  };
}

export function kernelRead(domain, targetId, { revision = 'current', dbPath = defaultDbPath() } = {}) {
  const resolved = checkPath(dbPath);
  const db = openKernelDb(resolved);
  try {
    const entry = db.prepare('SELECT * FROM kernel_entries WHERE id = ?').get(`${domain}/${targetId}`);
    if (!entry) return null;
    const rev = revision === 'current' ? entry.current_revision : revision;
    if (!rev) return { entry, revision: null, payload: null };
    const row = db.prepare('SELECT * FROM kernel_revisions WHERE revision = ?').get(rev);
    if (!row) return { entry, revision: rev, payload: null };
    return {
      entry, revision: row.revision, seq: row.seq,
      content_hash: row.content_hash, parent_revision: row.parent_revision,
      actor: row.actor, source: row.source, created_at: row.created_at,
      payload: JSON.parse(row.payload),
    };
  } finally { db.close(); }
}

export function kernelHistory(domain, targetId, { limit = 50, dbPath = defaultDbPath() } = {}) {
  const resolved = checkPath(dbPath);
  const db = openKernelDb(resolved);
  try {
    const n = Math.trunc(Number(limit)) || 50;
    const rows = db.prepare(`SELECT * FROM kernel_revisions WHERE domain = ? AND target_id = ? ORDER BY seq DESC LIMIT ?`)
      .all(domain, targetId, n);
    return rows.map(mapRevision);
  } finally { db.close(); }
}

function verifyKernelDb(db) {
  const rows = db.prepare('SELECT seq, domain, target_id, revision, content_hash, parent_revision, actor, source, created_at, payload FROM kernel_revisions ORDER BY seq').all();
  const broken = [];
  let expected = 1;
  for (const row of rows) {
    const seq = Number(row.seq);
    const expectedParent = expected === 1 ? null : `rev_${expected - 1}`;
    if (seq !== expected) broken.push({ kind: 'ordinal_gap', seq, expected_seq: expected, revision: row.revision });
    if (row.parent_revision !== expectedParent) broken.push({ kind: 'broken_parent_link', seq, parent_revision: row.parent_revision, expected_parent: expectedParent });
    if (row.content_hash !== sha256(row.payload)) broken.push({ kind: 'content_hash_mismatch', seq, revision: row.revision });
    expected = seq + 1;
  }
  const entries = db.prepare('SELECT id, domain, target_id, current_revision, content_hash FROM kernel_entries WHERE deleted_at IS NULL').all();
  for (const entry of entries) {
    const latest = db.prepare('SELECT revision, content_hash FROM kernel_revisions WHERE domain = ? AND target_id = ? ORDER BY seq DESC LIMIT 1').get(entry.domain, entry.target_id);
    if (!latest) { broken.push({ kind: 'missing_revision', entry: entry.id }); continue; }
    if (entry.current_revision !== latest.revision) broken.push({ kind: 'stale_current_pointer', entry: entry.id, current_revision: entry.current_revision, latest_revision: latest.revision });
    if (entry.content_hash !== latest.content_hash) broken.push({ kind: 'entry_hash_mismatch', entry: entry.id });
    const prov = db.prepare('SELECT 1 AS ok FROM kernel_provenance WHERE target_id = ? LIMIT 1').get(entry.target_id);
    if (!prov) broken.push({ kind: 'provenance_missing', entry: entry.id });
  }
  const chain = rows.map((row) => ({
    seq: row.seq, domain: row.domain, target_id: row.target_id, revision: row.revision,
    content_hash: row.content_hash, parent_revision: row.parent_revision,
    actor: row.actor, source: row.source, created_at: row.created_at,
  }));
  return { ok: broken.length === 0, chain, broken };
}

export function kernelVerify({ dbPath = defaultDbPath() } = {}) {
  const resolved = checkPath(dbPath);
  const db = openKernelDb(resolved);
  try {
    const result = verifyKernelDb(db);
    return { schema: SCHEMA_ID, ...result };
  } finally { db.close(); }
}

function chainDigest(chain) {
  return sha256(JSON.stringify(canonicalChain(chain)));
}

function canonicalChain(chain) {
  // sha256 is imported from util, but canonical is needed here too; re-imported below.
  return chain.map(({ seq, domain, target_id, revision, content_hash }) => ({ seq, domain, target_id, revision, content_hash }));
}

export function kernelBackup({ dbPath = defaultDbPath(), destPath } = {}) {
  if (!destPath) throw new Error('kernel backup requires destPath');
  const resolved = checkPath(dbPath);
  const dest = checkPath(destPath);
  const db = openKernelDb(resolved);
  try {
    const result = verifyKernelDb(db);
    if (!result.ok) throw new Error(`kernel backup refused: source chain is broken (${result.broken.length} problems)`);
    const digest = chainDigest(result.chain);
    mkdirSync(dirname(dest), { recursive: true });
    for (const suffix of ['', '-wal', '-shm']) { try { rmSync(dest + suffix, { force: true }); } catch { /* ignore */ } }
    // SQLite-native consistent snapshot (VACUUM INTO), never an OS file copy.
    db.exec(`VACUUM INTO '${escapeSqlString(dest)}'`);
    return { schema: SCHEMA_ID, dbPath: resolved, destPath: dest, digest, chain_length: result.chain.length };
  } finally { db.close(); }
}

export function kernelRestore({ srcPath, destPath = defaultDbPath(), expectDigest } = {}) {
  const src = checkPath(srcPath);
  const dest = checkPath(destPath);
  if (!existsSync(src)) throw new Error(`kernel restore: source not found: ${src}`);
  const srcDb = openKernelDb(src);
  try {
    const result = verifyKernelDb(srcDb);
    const digest = chainDigest(result.chain);
    if (expectDigest !== undefined && digest !== expectDigest) {
      throw new Error(`kernel restore refused: source digest ${digest} does not match expected ${expectDigest}`);
    }
    mkdirSync(dirname(dest), { recursive: true });
    for (const suffix of ['', '-wal', '-shm']) { try { rmSync(dest + suffix, { force: true }); } catch { /* ignore */ } }
    srcDb.exec(`VACUUM INTO '${escapeSqlString(dest)}'`);
  } finally { srcDb.close(); }
  const db = openKernelDb(dest);
  try {
    const result = verifyKernelDb(db);
    return { schema: SCHEMA_ID, srcPath: src, destPath: dest, digest: chainDigest(result.chain), chain_length: result.chain.length, ...result };
  } finally { db.close(); }
}

export function kernelImport({ schema, packageDigest, counts, operations = [], dbPath = defaultDbPath() } = {}) {
  const resolved = checkPath(dbPath);
  const db = openKernelDb(resolved);
  try {
    db.exec('BEGIN IMMEDIATE');
    try {
      withWriteLock(db);
      const createdAt = new Date().toISOString();
      for (const op of operations) {
        const table = String(op.table ?? '');
        if (!/^kernel_[a-z][a-z_]*$/.test(table)) throw new Error(`kernel import refused: unknown table ${table}`);
        const row = op.row ?? {};
        const cols = Object.keys(row);
        if (!cols.length) throw new Error('kernel import refused: empty row');
        const values = cols.map((c) => {
          const v = row[c];
          return v == null ? null : typeof v === 'object' ? JSON.stringify(canonical(v)) : v;
        });
        db.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).run(...values);
      }
      const countsText = counts == null ? null : JSON.stringify(canonical(counts));
      db.prepare(`INSERT INTO kernel_imports(id, schema, package_digest, counts, result, created_at)
        VALUES (?, ?, ?, ?, 'ok', ?)`)
        .run('imp_' + sha256(`${packageDigest ?? ''}\0${createdAt}\0${process.pid}`).slice(0, 24), schema ?? null, packageDigest ?? null, countsText, createdAt);
      recordReceipt(db, { action: 'import', subject: schema ?? 'kernel', result: 'ok', evidence: countsText });
      db.exec('COMMIT');
      return { schema: SCHEMA_ID, result: 'ok', imports: operations.length };
    } catch (error) {
      try { db.exec('ROLLBACK'); } catch { /* already rolled back */ }
      // A refusal writes its own receipt with result 'refused' and no success row.
      try {
        db.exec('BEGIN IMMEDIATE');
        try {
          const countsText = counts == null ? null : JSON.stringify(canonical(counts));
          db.prepare(`INSERT INTO kernel_imports(id, schema, package_digest, counts, result, created_at)
            VALUES (?, ?, ?, ?, 'refused', ?)`)
            .run('imp_' + sha256(`${packageDigest ?? ''}\0${new Date().toISOString()}\0${process.pid}`).slice(0, 24), schema ?? null, packageDigest ?? null, countsText, new Date().toISOString());
          recordReceipt(db, { action: 'import', subject: schema ?? 'kernel', result: 'refused', evidence: String(error.message) });
          db.exec('COMMIT');
        } catch { try { db.exec('ROLLBACK'); } catch { /* best-effort refusal receipt */ } }
      } catch { /* refusal receipt best-effort */ }
      throw new Error(`kernel import refused: ${error.message}`);
    }
  } finally { db.close(); }
}

function escapeSqlString(value) { return String(value).replace(/'/g, "''"); }


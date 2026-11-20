# File: hq/lib/kernel/store.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/kernel/store.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 30461 B |
| Lines | 681 |
| Hash | f29f98192183 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SCHEMA_VERSION | const | 15 | no | const SCHEMA_VERSION = 1; |
| SCHEMA_ID | const | 16 | no | const SCHEMA_ID = &#39;hq.kernel-store/1&#39;; |
| REFUSAL | const | 18 | no | const REFUSAL = Object.freeze({ LOCKED: &#39;KERNEL_LOCKED&#39;, SCHEMA_MISMATCH: &#39;KERNEL_SCHEMA_MISMATCH&#39;, ORDINAL_GAP: &#39;KERNEL_ORDINAL_GAP&#39;, PROVENANCE_REQUIRED: &#39;KERNEL_PROVENANCE_REQUIRED&#39;, |
| REFUSAL | export | 27 | yes | export { REFUSAL } |
| KernelError | class | 29 | no | class KernelError extends Error { |
| constructor | method | 30 | yes | constructor(code, message) { |
| SECRET_PATTERNS | const | 39 | no | const SECRET_PATTERNS = [ |
| scanSecrets | function | 48 | no | function scanSecrets(value) { |
| hit | const | 60 | no | const hit = scanSecrets(value[key]); |
| findWorkspaceRoot | function | 67 | no | function findWorkspaceRoot(start = process.cwd()) { |
| dir | variable | 68 | no | let dir = resolve(start); |
| parent | const | 71 | no | const parent = dirname(dir); |
| defaultDbPath | function | 77 | yes | export function defaultDbPath() { |
| checkPath | function | 85 | no | function checkPath(dbPath) { |
| resolved | const | 86 | no | const resolved = resolve(String(dbPath ?? &#39;&#39;)); |
| openKernelDb | function | 93 | no | function openKernelDb(dbPath) { |
| resolved | const | 94 | no | const resolved = checkPath(dbPath); |
| db | const | 96 | no | const db = new DatabaseSync(resolved); |
| DDL | const | 105 | no | const DDL = ` |
| migrate | function | 295 | no | function migrate(db) { |
| row | const | 297 | no | const row = db.prepare(&quot;SELECT value FROM kernel_meta WHERE key = &#39;user_version&#39;&quot;).get(); |
| installId | const | 299 | no | const installId = sha256(`${new Date().toISOString()}:${process.pid}:${Math.random()}`).slice(0, 24); |
| version | const | 308 | no | const version = Number(row.value); |
| initKernel | function | 315 | yes | export function initKernel({ dbPath = defaultDbPath() } = {}) { |
| resolved | const | 316 | no | const resolved = checkPath(dbPath); |
| db | const | 317 | no | const db = openKernelDb(resolved); |
| row | const | 319 | no | const row = db.prepare(&quot;SELECT value FROM kernel_meta WHERE key = &#39;user_version&#39;&quot;).get(); |
| isPidAlive | function | 328 | no | function isPidAlive(pid) { |
| recordReceipt | function | 337 | no | function recordReceipt(db, { action, subject, result, evidence }) { |
| id | const | 338 | no | const id = &#39;rcpt_&#39; + sha256(`${action}\\0${subject}\\0${result}\\0${evidence ?? &#39;&#39;}\\0${process.pid}`).slice(0, 24); |
| withWriteLock | function | 345 | no | function withWriteLock(db) { |
| row | const | 346 | no | const row = db.prepare(&#39;SELECT owner_pid FROM kernel_lock WHERE rowid = 1&#39;).get(); |
| owner | const | 348 | no | const owner = row ? String(row.owner_pid) : &#39;none&#39;; |
| acquireKernelLock | function | 353 | yes | export function acquireKernelLock({ dbPath = defaultDbPath(), force = false } = {}) { |
| resolved | const | 354 | no | const resolved = checkPath(dbPath); |
| db | const | 355 | no | const db = openKernelDb(resolved); |
| row | const | 359 | no | const row = db.prepare(&#39;SELECT owner_pid, owner_started_at, acquired_at FROM kernel_lock WHERE rowid = 1&#39;).get(); |
| me | const | 360 | no | const me = process.pid; |
| now | const | 361 | no | const now = new Date().toISOString(); |
| releaseKernelLock | function | 386 | yes | export function releaseKernelLock({ dbPath = defaultDbPath() } = {}) { |
| resolved | const | 387 | no | const resolved = checkPath(dbPath); |
| db | const | 388 | no | const db = openKernelDb(resolved); |
| row | const | 392 | no | const row = db.prepare(&#39;SELECT owner_pid FROM kernel_lock WHERE rowid = 1&#39;).get(); |
| kernelWrite | function | 403 | yes | export function kernelWrite(domain, targetId, payload, options = {}) { |
| resolved | const | 405 | no | const resolved = checkPath(dbPath); |
| db | const | 406 | no | const db = openKernelDb(resolved); |
| secret | const | 411 | no | const secret = scanSecrets(payload); |
| seqRow | const | 418 | no | const seqRow = db.prepare(&#39;SELECT COALESCE(MAX(seq), 0) AS m FROM kernel_revisions&#39;).get(); |
| seq | const | 419 | no | const seq = Number(seqRow.m) + 1; |
| revision | const | 420 | no | const revision = `rev_${seq}`; |
| expectedParent | const | 423 | no | const expectedParent = seq === 1 ? null : `rev_${seq - 1}`; |
| parent | const | 427 | no | const parent = expectedParent; |
| createdAt | const | 428 | no | const createdAt = new Date().toISOString(); |
| payloadText | const | 429 | no | const payloadText = JSON.stringify(canonical(payload)); |
| contentHash | const | 430 | no | const contentHash = sha256(payloadText); |
| entryId | const | 434 | no | const entryId = `${domain}/${targetId}`; |
| kernelDelete | function | 457 | yes | export function kernelDelete(domain, targetId, options = {}) { |
| resolved | const | 459 | no | const resolved = checkPath(dbPath); |
| db | const | 460 | no | const db = openKernelDb(resolved); |
| secret | const | 465 | no | const secret = scanSecrets({ reason, target: { domain, target_id: targetId } }); |
| entry | const | 468 | no | const entry = db.prepare(&#39;SELECT * FROM kernel_entries WHERE id = ?&#39;).get(`${domain}/${targetId}`); |
| seqRow | const | 470 | no | const seqRow = db.prepare(&#39;SELECT COALESCE(MAX(seq), 0) AS m FROM kernel_revisions&#39;).get(); |
| seq | const | 471 | no | const seq = Number(seqRow.m) + 1; |
| revision | const | 472 | no | const revision = `rev_${seq}`; |
| parent | const | 473 | no | const parent = seq === 1 ? null : `rev_${seq - 1}`; |
| createdAt | const | 474 | no | const createdAt = new Date().toISOString(); |
| payloadText | const | 475 | no | const payloadText = JSON.stringify({ op: &#39;delete&#39;, domain, target_id: targetId, reason, prior_revision: entry.current_revision }); |
| contentHash | const | 476 | no | const contentHash = sha256(payloadText); |
| kernelRollback | function | 499 | yes | export function kernelRollback(domain, targetId, { toRevision, actor, source, provenance, dbPath = defaultDbPath() } = {}) { |
| target | const | 501 | no | const target = kernelRead(domain, targetId, { revision: toRevision, dbPath }); |
| mapRevision | function | 508 | no | function mapRevision(row) { |
| kernelRead | function | 518 | yes | export function kernelRead(domain, targetId, { revision = &#39;current&#39;, dbPath = defaultDbPath() } = {}) { |
| resolved | const | 519 | no | const resolved = checkPath(dbPath); |
| db | const | 520 | no | const db = openKernelDb(resolved); |
| entry | const | 522 | no | const entry = db.prepare(&#39;SELECT * FROM kernel_entries WHERE id = ?&#39;).get(`${domain}/${targetId}`); |
| rev | const | 524 | no | const rev = revision === &#39;current&#39; ? entry.current_revision : revision; |
| row | const | 526 | no | const row = db.prepare(&#39;SELECT * FROM kernel_revisions WHERE revision = ?&#39;).get(rev); |
| kernelHistory | function | 537 | yes | export function kernelHistory(domain, targetId, { limit = 50, dbPath = defaultDbPath() } = {}) { |
| resolved | const | 538 | no | const resolved = checkPath(dbPath); |
| db | const | 539 | no | const db = openKernelDb(resolved); |
| n | const | 541 | no | const n = Math.trunc(Number(limit)) \|\| 50; |
| rows | const | 542 | no | const rows = db.prepare(`SELECT * FROM kernel_revisions WHERE domain = ? AND target_id = ? ORDER BY seq DESC LIMIT ?`) |
| verifyKernelDb | function | 548 | no | function verifyKernelDb(db) { |
| rows | const | 549 | no | const rows = db.prepare(&#39;SELECT seq, domain, target_id, revision, content_hash, parent_revision, actor, source, created_at, payload FROM kernel_revisions ORDER BY seq&#39;).all(); |
| broken | const | 550 | no | const broken = []; |
| expected | variable | 551 | no | let expected = 1; |
| seq | const | 553 | no | const seq = Number(row.seq); |
| expectedParent | const | 554 | no | const expectedParent = expected === 1 ? null : `rev_${expected - 1}`; |
| entries | const | 560 | no | const entries = db.prepare(&#39;SELECT id, domain, target_id, current_revision, content_hash FROM kernel_entries WHERE deleted_at IS NULL&#39;).all(); |
| latest | const | 562 | no | const latest = db.prepare(&#39;SELECT revision, content_hash FROM kernel_revisions WHERE domain = ? AND target_id = ? ORDER BY seq DESC LIMIT 1&#39;).get(entry.domain, entry.target_id); |
| prov | const | 566 | no | const prov = db.prepare(&#39;SELECT 1 AS ok FROM kernel_provenance WHERE target_id = ? LIMIT 1&#39;).get(entry.target_id); |
| chain | const | 569 | no | const chain = rows.map((row) =&gt; ({ seq: row.seq, domain: row.domain, target_id: row.target_id, revision: row.revision, content_hash: row.content_hash, parent_revision: row.parent_revision, actor: row… |
| kernelVerify | function | 577 | yes | export function kernelVerify({ dbPath = defaultDbPath() } = {}) { |
| resolved | const | 578 | no | const resolved = checkPath(dbPath); |
| db | const | 579 | no | const db = openKernelDb(resolved); |
| result | const | 581 | no | const result = verifyKernelDb(db); |
| chainDigest | function | 586 | no | function chainDigest(chain) { |
| canonicalChain | function | 590 | no | function canonicalChain(chain) { |
| kernelBackup | function | 595 | yes | export function kernelBackup({ dbPath = defaultDbPath(), destPath } = {}) { |
| resolved | const | 597 | no | const resolved = checkPath(dbPath); |
| dest | const | 598 | no | const dest = checkPath(destPath); |
| db | const | 599 | no | const db = openKernelDb(resolved); |
| result | const | 601 | no | const result = verifyKernelDb(db); |
| digest | const | 603 | no | const digest = chainDigest(result.chain); |
| kernelRestore | function | 612 | yes | export function kernelRestore({ srcPath, destPath = defaultDbPath(), expectDigest } = {}) { |
| src | const | 613 | no | const src = checkPath(srcPath); |
| dest | const | 614 | no | const dest = checkPath(destPath); |
| srcDb | const | 616 | no | const srcDb = openKernelDb(src); |
| result | const | 618 | no | const result = verifyKernelDb(srcDb); |
| digest | const | 619 | no | const digest = chainDigest(result.chain); |
| db | const | 627 | no | const db = openKernelDb(dest); |
| result | const | 629 | no | const result = verifyKernelDb(db); |
| kernelImport | function | 634 | yes | export function kernelImport({ schema, packageDigest, counts, operations = [], dbPath = defaultDbPath() } = {}) { |
| resolved | const | 635 | no | const resolved = checkPath(dbPath); |
| db | const | 636 | no | const db = openKernelDb(resolved); |
| createdAt | const | 641 | no | const createdAt = new Date().toISOString(); |
| table | const | 643 | no | const table = String(op.table ?? &#39;&#39;); |
| row | const | 645 | no | const row = op.row ?? {}; |
| cols | const | 646 | no | const cols = Object.keys(row); |
| values | const | 648 | no | const values = cols.map((c) =&gt; { const v = row[c]; return v == null ? null : typeof v === &#39;object&#39; ? JSON.stringify(canonical(v)) : v; }); |
| v | const | 649 | no | const v = row[c]; |
| countsText | const | 654 | no | const countsText = counts == null ? null : JSON.stringify(canonical(counts)); |
| countsText | const | 667 | no | const countsText = counts == null ? null : JSON.stringify(canonical(counts)); |
| escapeSqlString | function | 680 | no | function escapeSqlString(value) { return String(value).replace(/&#39;/g, &quot;&#39;&#39;&quot;); } |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:sqlite | import | 10 | external |
| node:fs | import | 11 | external |
| node:path | import | 12 | external |
| ../util.mjs | import | 13 | [hq/lib/util.mjs](../util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/kernel/cli.mjs](./cli.mjs.md) | ./store.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | durable kernel store outside .hq/: append-only revisions, single-writer lock, provenance, receipts |
| 3 | owner | hq-agent | — | hq-agent (L1) |
| 4 | task | — | — | L1 |

## Excerpt

```javascript
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
```

_First 80 of 682 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

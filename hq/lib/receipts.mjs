// hq/lib/receipts.mjs — the evidence ledger.
//
// Every context bundle, ask or brief that reads the local index records what it
// read and the digest of what it produced. A receipt id is derived from
// kind + task + digest only, so recording the same evidence twice is a no-op
// and created_at never changes an identity.
import { canonical, nowISO, safeJsonParse, sha256 } from './util.mjs';

function clampLimit(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(10_000, Math.max(0, Math.trunc(n)));
}

function normalizeSources(sources) {
  if (!Array.isArray(sources)) return [];
  const out = [];
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    out.push({
      ref: String(source.ref ?? ''),
      sha256: String(source.sha256 ?? ''),
    });
  }
  return out;
}

function receiptId(kind, task, digest) {
  return 'rcpt_' + sha256(String(kind ?? '') + '\0' + String(task ?? '') + '\0' + String(digest ?? '')).slice(0, 24);
}

function mapReceipt(row) {
  if (!row) return null;
  const sources = safeJsonParse(row.sources, []);
  return {
    id: row.id,
    kind: row.kind,
    task: row.task ?? '',
    project: row.project ?? null,
    sources: Array.isArray(sources) ? sources : [],
    digest: row.digest,
    bytes: Number(row.bytes ?? 0),
    created_at: row.created_at,
    // The CLI renders receipts with the camelCase alias; both are the same value.
    createdAt: row.created_at,
  };
}

function getRow(db, id) {
  return db.prepare('SELECT * FROM receipts WHERE id = ?').get(String(id));
}

/**
 * recordReceipt — append one evidence row, idempotently.
 *
 * @param {import('node:sqlite').DatabaseSync} db open HQ index
 * @param {{kind: string, task?: string, project?: string|null,
 *          sources?: Array<{ref: string, sha256: string}>, digest?: string,
 *          bytes?: number}} receipt
 * @returns {object} stored receipt
 */
export function recordReceipt(db, receipt = {}) {
  const kind = String(receipt.kind ?? '').trim();
  if (!kind) throw new Error('hq receipts: kind is required');
  const task = String(receipt.task ?? '');
  const project = receipt.project == null ? null : String(receipt.project);
  const digest = String(receipt.digest ?? '');
  const bytes = Math.max(0, Math.trunc(Number(receipt.bytes) || 0));
  const sources = normalizeSources(receipt.sources);
  const id = receiptId(kind, task, digest);
  const createdAt = nowISO();

  db.prepare(`
    INSERT INTO receipts(id, kind, task, project, sources, digest, bytes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `).run(
    id,
    kind,
    task,
    project,
    JSON.stringify(canonical(sources)),
    digest,
    bytes,
    createdAt,
  );

  return mapReceipt(getRow(db, id));
}

/**
 * listReceipts — newest first, deterministic even when timestamps collide.
 *
 * @param {import('node:sqlite').DatabaseSync} db open HQ index
 * @param {{kind?: string|null, limit?: number}} options
 * @returns {object[]}
 */
export function listReceipts(db, options = {}) {
  const kind = options.kind == null || options.kind === '' ? null : String(options.kind);
  const limit = clampLimit(options.limit, 20);
  if (limit === 0) return [];
  const where = kind ? 'WHERE lower(kind) = lower(?)' : '';
  const params = kind ? [kind] : [];
  const rows = db.prepare(`
    SELECT * FROM receipts
    ${where}
    ORDER BY created_at DESC, id ASC
    LIMIT ?`).all(...params, limit);
  return rows.map(mapReceipt);
}

/**
 * getReceipt — one receipt by id, or null.
 *
 * @param {import('node:sqlite').DatabaseSync} db open HQ index
 * @param {{id: string}} options
 * @returns {object|null}
 */
export function getReceipt(db, options = {}) {
  const id = options.id == null ? '' : String(options.id);
  if (!id) return null;
  return mapReceipt(getRow(db, id));
}

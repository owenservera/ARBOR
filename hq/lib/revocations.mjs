// @ts-check
/**
 * @hq:context Revocation ledger — append-only record of a revoked scope, seat or send, with a stated reason, and the time-bound query that reads it back
 * @hq:owner channel-manager
 * @hq:task channel-revocation
 * @hq:invariant a revocation without a stated reason is refused (NO_REASON): an unauditable revocation is not a revocation
 * @hq:invariant the ledger is append-only: revoking again supersedes the earlier row and never rewrites it
 * @hq:invariant a revocation applies from its recorded `at`, never to a moment before it
 * @hq:invariant this module owns one file (`revocations.jsonl`) in the directory it is handed; nothing here sends, approves, or touches receipts
 * @hq:see docs/integration/STREAM-BOUNDARIES.md
 * @hq:see docs/CANON-DECISIONS.md
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { nowISO, sha256 } from './util.mjs';

export const REVOCATION_SCHEMA = 'vivim.revocation/1';
export const VIEW_SCHEMA = 'vivim.revocation-view/1';
export const LEDGER_NAME = 'revocations.jsonl';

/** The channel's revocation directory, passed in explicitly — never a silent write target. */
export const DEFAULT_REVOCATIONS_DIR = 'C:/VIVIM/channel/revocations';

/** The three things a revocation can take away. */
export const KINDS = /** @type {const} */ (['scope', 'seat', 'send']);

const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{16,}/,
  /ghp_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /\bbearer\s+[A-Za-z0-9._-]{20,}/i,
  /\bapi[_-]?key\s*[:=]\s*\S{8,}/i,
  /\bpassword\s*[:=]\s*\S{4,}/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

/**
 * A refusal the caller can act on. Every rejection carries a code so a UI can
 * branch without matching on prose.
 */
export class RevocationError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = 'RevocationError';
    this.code = code;
  }
}

/**
 * Where the ledger is. A directory keeps the ledger inside it — the channel
 * hands over `C:/VIVIM/channel/revocations`, not a file — and a path that
 * already names the ledger file is used as given. There is no default: the
 * caller states the directory, so nothing writes to C:/VIVIM by omission.
 */
export function ledgerPath(target) {
  const p = String(target ?? '').trim();
  if (!p) throw new RevocationError('NO_FILE', 'a revocation ledger path is required; pass the revocations directory or its .jsonl file');
  return /\.jsonl?$/i.test(p) ? p : join(p, LEDGER_NAME);
}

export function carriesSecret(text) {
  return SECRET_PATTERNS.some((re) => re.test(String(text ?? '')));
}

/**
 * A stable, collision-resistant name for one row. `seq` is the ledger length
 * before the append, so two revocations in the same millisecond still differ.
 *
 * @param {{subject?: string, kind?: string, at?: string, reason?: string, seq?: number}} [opts]
 */
export function revocationId({ subject, kind, at, reason, seq = 0 } = {}) {
  const stamp = String(at).replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const digest = sha256(`${subject}|${kind}|${at}|${reason}|${seq}`).slice(0, 8);
  return `RV-${stamp}-${kind}-${digest}`;
}

/**
 * Revoke one thing, for one stated reason.
 *
 * The row is appended; an earlier row for the same subject and kind stays on
 * disk and is superseded only by being older. A reason is mandatory because the
 * record exists to answer "who took this away and why" months later.
 *
 * @param {{
 *   file: string, subject?: string, kind?: 'scope'|'seat'|'send', reason?: string,
 *   by?: string|null, at?: string|Date,
 * }} opts
 */
export function revoke({ file, subject, kind = 'scope', reason, by = null, at = nowISO() } = /** @type {any} */ ({})) {
  const ledger = ledgerPath(file);
  const subjectText = String(subject ?? '').trim();
  if (!subjectText) throw new RevocationError('NO_SUBJECT', 'a revocation must name what it revokes (subject)');

  const kindText = String(kind ?? '').trim().toLowerCase();
  if (!KINDS.includes(/** @type {any} */ (kindText))) {
    throw new RevocationError('BAD_KIND', `kind is "${kind}", expected one of ${KINDS.join(', ')}`);
  }

  const reasonText = String(reason ?? '').trim();
  if (!reasonText) {
    throw new RevocationError('NO_REASON', 'a revocation without a stated reason is not auditable; say why it was revoked');
  }
  if (carriesSecret(reasonText)) {
    throw new RevocationError('SECRET_IN_REASON', 'the reason carries a credential shape; name where the credential lives instead');
  }

  const atISO = normalizeAt(at);
  const existing = readLedger(ledger);
  /** @type {{schema: string, id: string, at: string, subject: string, kind: string, reason: string, by: string|null}} */
  const record = {
    schema: REVOCATION_SCHEMA,
    id: revocationId({ subject: subjectText, kind: kindText, at: atISO, reason: reasonText, seq: existing.length }),
    at: atISO,
    subject: subjectText,
    kind: kindText,
    reason: reasonText,
    by: by === null || by === undefined || String(by).trim() === '' ? null : String(by).trim(),
  };

  mkdirSync(dirname(ledger), { recursive: true });
  appendFileSync(ledger, `${JSON.stringify(record)}\n`, { encoding: 'utf8', flag: 'a' });
  return record;
}

/**
 * The revocation currently in force for a subject and kind, or null.
 * `at` is deliberately absent: this answers "what is the latest word", and the
 * time-bound question is `isRevoked`.
 *
 * @param {{file: string, subject?: string, kind?: string}} opts
 */
export function revoked({ file, subject, kind = 'scope' } = /** @type {any} */ ({})) {
  const subjectText = String(subject ?? '').trim();
  if (!subjectText) return null;
  const kindText = String(kind ?? '').trim().toLowerCase();
  const rows = readLedger(ledgerPath(file)).filter((r) => r.subject === subjectText && r.kind === kindText);
  /** @type {any} */
  let best = null;
  for (const row of rows) {
    // Equal timestamps resolve to the row written later: last word wins.
    if (!best || timeOf(row.at) >= timeOf(best.at)) best = row;
  }
  return best;
}

/**
 * Everything on the ledger, newest first, with counts by kind.
 *
 * @param {{file: string}} opts
 */
export function view({ file } = /** @type {any} */ ({})) {
  const ledger = ledgerPath(file);
  const rows = readLedger(ledger);
  /** @type {Record<string, number>} */
  const counts = { scope: 0, seat: 0, send: 0 };
  for (const row of rows) counts[row.kind] = (counts[row.kind] ?? 0) + 1;
  const ordered = rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => timeOf(b.row.at) - timeOf(a.row.at) || b.index - a.index)
    .map((entry) => entry.row);
  return {
    schema: VIEW_SCHEMA,
    file: ledger,
    count: rows.length,
    counts,
    revocations: ordered,
  };
}

/**
 * Was the subject revoked by the moment `at`? This is the question an effect
 * boundary asks before acting, so an unreadable time throws rather than
 * answering "not revoked" on a broken clock.
 *
 * @param {{file: string, subject?: string, kind?: string, at?: string|Date}} opts
 */
export function isRevoked({ file, subject, kind = 'scope', at = nowISO() } = /** @type {any} */ ({})) {
  const subjectText = String(subject ?? '').trim();
  if (!subjectText) return false;
  const kindText = String(kind ?? '').trim().toLowerCase();
  const cutoff = timeOf(normalizeAt(at));
  return readLedger(ledgerPath(file)).some(
    (r) => r.subject === subjectText && r.kind === kindText && timeOf(r.at) <= cutoff,
  );
}

/**
 * Read the ledger. Blank lines are ignored; anything else that is not a
 * revocation record throws, because a ledger that cannot be read must not read
 * as "nothing was ever revoked".
 */
function readLedger(ledger) {
  if (!existsSync(ledger)) return [];
  const lines = readFileSync(ledger, 'utf8').split(/\r?\n/);
  /** @type {any[]} */
  const rows = [];
  lines.forEach((line, i) => {
    const text = line.trim();
    if (!text) return;
    /** @type {any} */
    let doc;
    try {
      doc = JSON.parse(text);
    } catch {
      throw new RevocationError('CORRUPT_LEDGER', `${ledger}:${i + 1} is not JSON`);
    }
    if (doc?.schema !== REVOCATION_SCHEMA) {
      throw new RevocationError('BAD_RECORD', `${ledger}:${i + 1} has schema ${doc?.schema ?? 'none'}, expected ${REVOCATION_SCHEMA}`);
    }
    rows.push(doc);
  });
  return rows;
}

/** @param {string|Date} at */
function normalizeAt(at) {
  const parsed = at instanceof Date ? at : new Date(String(at));
  if (Number.isNaN(parsed.getTime())) {
    throw new RevocationError('BAD_TIME', `"${at}" is not a usable timestamp`);
  }
  return parsed.toISOString();
}

/** @param {string} at */
function timeOf(at) {
  const t = Date.parse(String(at));
  if (Number.isNaN(t)) throw new RevocationError('BAD_TIME', `ledger row has an unreadable timestamp: ${at}`);
  return t;
}

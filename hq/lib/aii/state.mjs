// hq/lib/aii/state.mjs — durable run journal for the AII verifier.
//
// Why this exists: the previous runner persisted a bare `invalidated: [ids]`
// list in hq/aii/last-run.json. That list was task-keyed, so a failure in a
// superseded duplicate fixture invalidated the canonical one indefinitely, and
// it could not say which fixture bytes failed, when, or why. It also had to be
// mutated on every run, which made `--summary` depend on a write.
//
// The journal is per-fixture-file evidence, not per-scenario state:
//
//   entries[relPath] = { id, sha, status, at, durationMs, problem, findings }
//
// A journal entry describes one attempt against ONE set of fixture bytes. It
// only affects coverage when its `sha` still equals the file on disk
// (see receipts-policy.applyJournalPolicy). That is what lets a fresh failure
// demote an old pass without letting an old failure poison a rewritten fixture.
//
// `durations[relPath].ewmaMs` feeds the cost estimate in plan.mjs so the ETA
// learns from real runs instead of relying on the static command table.
//
// The legacy file hq/aii/last-run.json is READ ONCE for migration and never
// written, rewritten, or deleted by this module.

import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { canonicalJson, nowISO, safeJsonParse, sha256 } from '../util.mjs';

export const AII_JOURNAL_SCHEMA = 'hq.aii-run-journal/1';
export const AII_LEGACY_STATE_SCHEMA = 'hq.aii-last-run/1';

export const JOURNAL_STATUSES = [
  'pass',        // expectations matched
  'fail',        // ran, but at least one expectation was unmatched
  'timeout',     // exceeded the per-fixture wall clock
  'load',        // module import threw
  'id-mismatch', // fixture id disagrees with its filename
  'invalid',     // defineFixture rejected the contract
  'mutating-probe', // a probe tried a write-shaped command and was refused
  'budget-exhausted', // never started: run budget spent
  'skipped',     // never started: quarantined or filtered out
];

const EWMA_ALPHA = 0.35;

export function journalPath(root) {
  return join(root, 'hq', 'aii', 'run-journal.json');
}

export function legacyStatePath(root) {
  return join(root, 'hq', 'aii', 'last-run.json');
}

export function emptyJournal() {
  return {
    schema: AII_JOURNAL_SCHEMA,
    updatedAt: null,
    entries: {},
    durations: {},
    legacyFailures: {},
    lastRun: null,
  };
}

/**
 * loadJournal — tolerant read. A corrupt journal degrades to an empty one and
 * records the reason under `errors`; it never throws, because a damaged state
 * file must not be able to block verification of the fixtures themselves.
 */
export function loadJournal(rootOrPath) {
  const path = rootOrPath.endsWith('.json') ? rootOrPath : journalPath(rootOrPath);
  if (!existsSync(path)) return { ...emptyJournal(), source: path, exists: false, errors: [] };
  const parsed = safeJsonParse(readFileSync(path, 'utf8'), null);
  if (!parsed || typeof parsed !== 'object') {
    return { ...emptyJournal(), source: path, exists: true, errors: [`unparseable journal at ${path}`] };
  }
  const errors = [];
  if (parsed.schema && parsed.schema !== AII_JOURNAL_SCHEMA) errors.push(`journal schema ${parsed.schema} is not ${AII_JOURNAL_SCHEMA}`);
  return {
    schema: AII_JOURNAL_SCHEMA,
    updatedAt: parsed.updatedAt ?? null,
    entries: plainObject(parsed.entries),
    durations: plainObject(parsed.durations),
    legacyFailures: plainObject(parsed.legacyFailures),
    lastRun: parsed.lastRun && typeof parsed.lastRun === 'object' ? parsed.lastRun : null,
    source: path,
    exists: true,
    errors,
  };
}

/**
 * readLegacyInvalidations — the one-way migration from last-run.json.
 * Returns a map id -> {source, at, migratedAt}. The legacy file is untouched.
 */
export function readLegacyInvalidations(root) {
  const path = legacyStatePath(root);
  if (!existsSync(path)) return { path, ids: {}, errors: [] };
  const parsed = safeJsonParse(readFileSync(path, 'utf8'), null);
  if (!parsed || !Array.isArray(parsed.invalidated)) {
    return { path, ids: {}, errors: [`legacy ${path} has no invalidated array; ignored`] };
  }
  const ids = {};
  for (const raw of parsed.invalidated) {
    const id = String(raw ?? '').trim();
    if (!/^HQ-\d{3}$/.test(id)) continue;
    ids[id] = { source: 'hq/aii/last-run.json', at: parsed.savedAt ?? null, migratedAt: null };
  }
  return { path, ids, errors: [] };
}

/**
 * migrateLegacyState — fold last-run.json invalidations into the journal once.
 * Already-migrated ids keep their original `migratedAt` so repeated runs are
 * byte-stable.
 */
export function migrateLegacyState(journal, { root, at = nowISO() } = {}) {
  const legacy = readLegacyInvalidations(root);
  const next = { ...journal, legacyFailures: { ...(journal.legacyFailures ?? {}) } };
  for (const [id, row] of Object.entries(legacy.ids)) {
    if (next.legacyFailures[id]) continue;
    next.legacyFailures[id] = { ...row, migratedAt: at };
  }
  return { journal: next, errors: legacy.errors, migrated: Object.keys(legacy.ids).length };
}

/** recordAttempt — merge one run result into the journal (pure). */
export function recordAttempt(journal, result, { at = nowISO() } = {}) {
  const relPath = String(result?.relPath ?? '').replaceAll('\\', '/');
  if (!relPath) return journal;
  const status = JOURNAL_STATUSES.includes(result.status) ? result.status : 'fail';
  const entries = { ...(journal.entries ?? {}) };
  entries[relPath] = {
    id: String(result.id ?? '').slice(0, 6) || null,
    sha: String(result.fixtureSha ?? ''),
    status,
    at,
    durationMs: Number.isFinite(Number(result.durationMs)) ? Math.max(0, Math.round(Number(result.durationMs))) : null,
    findings: Number.isFinite(Number(result.findings)) ? Number(result.findings) : null,
    problem: result.problem == null ? null : String(result.problem),
  };

  const durations = { ...(journal.durations ?? {}) };
  const previous = durations[relPath] ?? null;
  const measured = Number(result.durationMs);
  if (Number.isFinite(measured) && measured > 0) {
    const ewmaMs = previous && Number.isFinite(Number(previous.ewmaMs))
      ? Math.round(EWMA_ALPHA * measured + (1 - EWMA_ALPHA) * Number(previous.ewmaMs))
      : Math.round(measured);
    durations[relPath] = { ewmaMs, lastMs: Math.round(measured), samples: Number(previous?.samples ?? 0) + 1 };
  }

  // A pass at the current bytes resolves any migrated task-level invalidation.
  // A failure does not need to write one: the journal entry itself demotes the
  // scenario only while its sha matches the file on disk.
  const legacyFailures = { ...(journal.legacyFailures ?? {}) };
  if (status === 'pass' && result.id) delete legacyFailures[String(result.id)];

  return { ...journal, entries, durations, legacyFailures };
}

/** recordRun — apply every attempt of one run plus its aggregate summary. */
export function recordRun(journal, results, { at = nowISO(), mode = 'full', jobs = 1, elapsedMs = null } = {}) {
  let next = journal;
  for (const result of results) next = recordAttempt(next, result, { at });
  const passed = results.filter((r) => r.status === 'pass').length;
  next = {
    ...next,
    lastRun: {
      at,
      mode,
      jobs: Math.max(1, Number(jobs) || 1),
      ran: results.length,
      passed,
      failed: results.length - passed,
      elapsedMs: elapsedMs == null ? null : Math.round(Number(elapsedMs)),
    },
  };
  return next;
}

/** saveJournal — write atomically so an interrupted run cannot truncate state. */
export function saveJournal(rootOrPath, journal) {
  const path = rootOrPath.endsWith('.json') ? rootOrPath : journalPath(rootOrPath);
  const ordered = {
    schema: AII_JOURNAL_SCHEMA,
    updatedAt: nowISO(),
    entries: sortKeys(journal.entries ?? {}),
    durations: sortKeys(journal.durations ?? {}),
    legacyFailures: sortKeys(journal.legacyFailures ?? {}),
    lastRun: journal.lastRun ?? null,
  };
  const tmp = join(dirname(path), `.run-journal.${process.pid}.tmp`);
  writeFileSync(tmp, JSON.stringify(ordered, null, 2) + '\n');
  renameSync(tmp, path);
  return path;
}

/** journalDigest — stable over state, excluding the write timestamp. */
export function journalDigest(journal) {
  const { updatedAt, source, exists, errors, ...stable } = journal ?? {};
  return sha256(canonicalJson(stable));
}

/** failedAtCurrentBytes — journal failures that still describe the file on disk. */
export function failedAtCurrentBytes(journal, plan) {
  const out = [];
  for (const fixture of plan?.fixtures ?? []) {
    const entry = journal?.entries?.[fixture.relPath];
    if (!entry) continue;
    if (entry.sha !== fixture.sha) continue;
    if (entry.status === 'pass') continue;
    out.push({ id: fixture.id, relPath: fixture.relPath, status: entry.status, at: entry.at, problem: entry.problem });
  }
  return out;
}

function plainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function sortKeys(value) {
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}

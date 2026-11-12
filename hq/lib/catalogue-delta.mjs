/**
 * @hq:context Read-only bounded C4 catalogue export and replay over existing HQ semantic and source authorities.
 * @hq:owner hq
 * @hq:task VIVIM-C4-LANE-C
 * @hq:invariant This is an interchange projection, not an index, graph, registry, execution grant or production certificate.
 * @hq:invariant Historical records never disappear without an explicit evidenced tombstone.
 */
import { createHash } from 'node:crypto';

export const CATALOGUE_SCHEMA = 'vivim.catalogue-export/1';
export const DELTA_SCHEMA = 'vivim.catalogue-delta/1';
const MAX_RECORDS = 100_000;
const MAX_SOURCES = 1_000;
const MAX_EVIDENCE = 32;
const SOURCE_STATES = new Set(['complete', 'partial', 'missing', 'blocked', 'conflicting']);
const RECORD_STATES = new Set(['unknown', 'planned', 'researched', 'implemented', 'tested_fixture', 'integrated', 'blocked', 'conflicting', 'retired']);
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:/@#-]{0,255}$/;
const DIGEST_RE = /^[a-f0-9]{40}([a-f0-9]{24})?$/;
const UNSAFE = /(?:^|\/)(?:\.env[^/]*|[^/]*\.pem|[^/]*\.p12|[^/]*\.keystore|cookies|login data|storage-state\.json|session\.json|release-profile\.json)(?:\/|$)|[?&](?:token|api_key|password|secret)=/i;

function fail(message) { throw new Error('C4_CATALOGUE_' + message); }
function string(value, label, limit = 1024) {
  if (typeof value !== 'string' || !value.length || value.length > limit || /[\x00-\x1f]/.test(value) || UNSAFE.test(value)) fail('INVALID_' + label);
  return value;
}
function id(value, label = 'ID') {
  if (typeof value !== 'string' || !ID_RE.test(value)) fail('INVALID_' + label);
  return value;
}
function hash(value) {
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    const result = Object.create(null);
    for (const key of Object.keys(value).sort()) result[key] = canonical(value[key]);
    return result;
  }
  return value;
}
function ordered(rows) { return [...rows].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0); }
function unique(rows, what) {
  const result = new Map();
  for (const row of rows) {
    if (result.has(row.id)) fail('DUPLICATE_' + what);
    result.set(row.id, row);
  }
  return result;
}
function revision(value) {
  const text = string(value, 'REVISION', 128);
  if (!/^[A-Za-z0-9._:-]{6,128}$/.test(text)) fail('INVALID_REVISION');
  return text;
}
function source(row) {
  if (!row || typeof row !== 'object') fail('INVALID_SOURCE');
  const state = string(row.state, 'SOURCE_STATE', 32);
  if (!SOURCE_STATES.has(state)) fail('INVALID_SOURCE_STATE');
  return { id: id(row.id), revision: revision(row.revision), state, owner: id(row.owner) };
}
function evidence(row) {
  if (!row || typeof row !== 'object') fail('INVALID_EVIDENCE');
  return { type: id(row.type, 'EVIDENCE_TYPE'), ref: string(row.ref, 'EVIDENCE_REF', 1024) };
}
function record(row) {
  if (!row || typeof row !== 'object') fail('INVALID_RECORD');
  const state = string(row.status, 'STATUS', 32);
  if (!RECORD_STATES.has(state)) fail('INVALID_STATUS');
  const digest = string(row.contentDigest, 'CONTENT_DIGEST', 64);
  if (!DIGEST_RE.test(digest)) fail('INVALID_CONTENT_DIGEST');
  const proofs = row.evidence ?? [];
  if (!Array.isArray(proofs) || proofs.length > MAX_EVIDENCE) fail('EVIDENCE_LIMIT');
  const clean = {
    id: id(row.id), kind: id(row.kind, 'KIND'), sourceId: id(row.sourceId, 'SOURCE_ID'),
    sourceRevision: revision(row.sourceRevision), contentDigest: digest, status: state,
    evidence: ordered(proofs.map(evidence).map((x) => ({ ...x, id: x.type + ':' + x.ref }))).map(({ id: ignored, ...rest }) => rest),
  };
  if (row.tombstone !== undefined) {
    if (!row.tombstone || typeof row.tombstone !== 'object') fail('INVALID_TOMBSTONE');
    clean.tombstone = { reason: string(row.tombstone.reason, 'TOMBSTONE_REASON', 300), evidenceRef: string(row.tombstone.evidenceRef, 'TOMBSTONE_EVIDENCE', 1024) };
    if (!clean.evidence.some((e) => e.ref === clean.tombstone.evidenceRef)) fail('UNPROVEN_TOMBSTONE');
  }
  return clean;
}
function validateExisting(envelope) {
  if (!envelope || envelope.schema !== CATALOGUE_SCHEMA || envelope.authority !== 'repos-hq') fail('INVALID_ENVELOPE');
  const raw = { schema: envelope.schema, authority: envelope.authority, sources: envelope.sources, records: envelope.records };
  if (hash(raw) !== envelope.digest) fail('DIGEST_MISMATCH');
  return envelope;
}

/**
 * Versioned non-destructive snapshot. A missing/partial source changes coverage,
 * never erases previous records. A complete scan with absent rows reports no
 * deletion either: only a tombstone with independent evidence can retire one.
 */
export function buildCatalogueSnapshot({ sources = [], records = [], previous = null } = {}) {
  if (!Array.isArray(sources) || sources.length > MAX_SOURCES || !Array.isArray(records) || records.length > MAX_RECORDS) fail('INPUT_LIMIT');
  if (previous) validateExisting(previous);
  const updates = unique(sources.map(source), 'SOURCE');
  const sourceRows = new Map((previous?.sources ?? []).map((x) => [x.id, x]));
  for (const row of updates.values()) sourceRows.set(row.id, row);
  if (sourceRows.size > MAX_SOURCES) fail('SOURCE_LIMIT');
  const updatesById = unique(records.map(record), 'RECORD');
  const rows = new Map((previous?.records ?? []).map((x) => [x.id, x]));
  for (const item of updatesById.values()) {
    const currentSource = sourceRows.get(item.sourceId);
    if (!currentSource) fail('UNKNOWN_SOURCE');
    if (currentSource.state === 'missing' || currentSource.state === 'blocked') fail('UNAVAILABLE_SOURCE_WRITE');
    if (item.sourceRevision !== currentSource.revision) fail('SOURCE_REVISION_MISMATCH');
    const older = rows.get(item.id);
    if (older && older.sourceId !== item.sourceId) fail('IDENTITY_AUTHORITY_CONFLICT');
    if (older && older.sourceRevision === item.sourceRevision && older.contentDigest !== item.contentDigest) fail('SAME_REVISION_CONFLICT');
    if (older?.tombstone && !item.tombstone) fail('TOMBSTONE_REVIVAL_REQUIRES_REVIEW');
    rows.set(item.id, item);
  }
  if (rows.size > MAX_RECORDS) fail('RECORD_LIMIT');
  const body = { schema: CATALOGUE_SCHEMA, authority: 'repos-hq', sources: ordered(sourceRows.values()), records: ordered(rows.values()) };
  return { ...body, digest: hash(body) };
}

/** Changes are keyed and digest-pinned for replay. No deletion operation exists. */
export function diffCatalogueSnapshots(previous, next) {
  if (previous) validateExisting(previous);
  validateExisting(next);
  const oldSources = new Map((previous?.sources ?? []).map((x) => [x.id, x]));
  const oldRecords = new Map((previous?.records ?? []).map((x) => [x.id, x]));
  const sourceUpdates = next.sources.filter((x) => hash(x) !== hash(oldSources.get(x.id) ?? null));
  const recordUpserts = next.records.filter((x) => hash(x) !== hash(oldRecords.get(x.id) ?? null));
  return { schema: DELTA_SCHEMA, baseDigest: previous?.digest ?? null, targetDigest: next.digest, sourceUpdates, recordUpserts };
}

/** Duplicate delivery is harmless; forked, reordered or corrupted replay is refused. */
export function replayCatalogueDelta(previous, delta) {
  if (!delta || delta.schema !== DELTA_SCHEMA) fail('INVALID_DELTA');
  if (previous) validateExisting(previous);
  if (previous?.digest === delta.targetDigest) return previous;
  if ((previous?.digest ?? null) !== delta.baseDigest) fail('REPLAY_FORK');
  const next = buildCatalogueSnapshot({ previous, sources: delta.sourceUpdates, records: delta.recordUpserts });
  if (next.digest !== delta.targetDigest) fail('REPLAY_CORRUPT');
  return next;
}

/** Bounded, read-only query for Labs adapters and consumer dashboards. */
export function queryCatalogueSnapshot(envelope, { sourceId = null, status = null, kind = null, limit = 100, offset = 0 } = {}) {
  validateExisting(envelope);
  const max = Math.max(0, Math.min(1000, Number.isInteger(limit) ? limit : 100));
  const skip = Math.max(0, Number.isInteger(offset) ? offset : 0);
  const rows = envelope.records.filter((x) => (sourceId === null || x.sourceId === sourceId) && (status === null || x.status === status) && (kind === null || x.kind === kind));
  return { total: rows.length, records: rows.slice(skip, skip + max), digest: envelope.digest };
}

/** Read existing semantic SQLite projection; no new schema or second graph. */
export function snapshotHqSemanticIds(db, { repoRevision, previous = null, limit = MAX_RECORDS } = {}) {
  if (!db || typeof db.prepare !== 'function') fail('DB_REQUIRED');
  const rev = revision(repoRevision);
  const bound = Math.max(1, Math.min(MAX_RECORDS, Number.isInteger(limit) ? limit : MAX_RECORDS));
  const items = db.prepare('SELECT id, kind, status, authority, provenance FROM semantic_id ORDER BY id LIMIT ?').all(bound + 1);
  if (items.length > bound) fail('SEMANTIC_LIMIT');
  const records = items.map((row) => {
    const stableId = id(row.id);
    const owner = string(String(row.authority || 'hq'), 'AUTHORITY', 128);
    const status = row.status === 'deprecated' ? 'retired' : row.status === 'proposed' ? 'planned' : 'unknown';
    const contentDigest = hash({ id: stableId, kind: row.kind, status: row.status, authority: owner, provenance: row.provenance });
    return { id: stableId, sourceId: 'repos-hq:semantic-registry', sourceRevision: rev, kind: id(row.kind, 'KIND'), status, contentDigest, evidence: [{ type: 'semantic_registry_row', ref: 'hq/lib/semantic-registry.mjs#' + stableId }] };
  });
  return buildCatalogueSnapshot({ previous, sources: [{ id: 'repos-hq:semantic-registry', revision: rev, state: 'complete', owner: 'repos-hq' }], records });
}

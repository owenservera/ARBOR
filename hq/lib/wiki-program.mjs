/**
 * @hq:context Bounded, owner-confirmed wiki program writer: data-only view
 *   configuration with validate/preview/diff, versioning and rollback.
 * @hq:owner hq
 * @hq:task wiki-program-v1
 * @hq:invariant The program config is data only. No value in it is ever used as
 *   a filesystem path, a command or a URL; `source` is a closed enum. This
 *   module performs no filesystem write and no network call.
 * @hq:invariant previewProgram is pure: it never writes and never mutates the db.
 * @hq:invariant Every write needs explicit owner confirmation and is versioned,
 *   reversible and history preserving. A superseded row is never deleted.
 * @hq:invariant The read-only wiki console lane is untouched here; this module
 *   is the only program-configuration writer and it refuses shell, provider
 *   messages, source modification and privilege escalation by construction.
 * @hq:see docs/research/semantic-language-kernel/ARCHITECTURE.md
 * @hq:see docs/research/semantic-language-kernel/CONTRACT-AND-ROADMAP.md
 * @hq:see hq/lib/semantic-optimizers.mjs
 * @hq:see hq/lib/canon.mjs
 */
import { canonical, nowISO, safeJsonParse, sha256 } from './util.mjs';
import { transaction } from './schema.mjs';
import { orderActionPlan } from './semantic-optimizers.mjs';

export const WIKI_PROGRAM_SCHEMA = 'hq.wiki-program/1';

// ---------------------------------------------------------------------------
// allowlists (contract exports, renderable by a CLI)

export const PROGRAM_CONFIG_KEYS = Object.freeze([
  'id', 'version', 'project', 'source', 'filters', 'layout', 'selection', 'expectedRevision',
]);

export const PROGRAM_FILTER_KEYS = Object.freeze([
  'kind', 'status', 'authority', 'type', 'capability', 'query',
]);

export const PROGRAM_LAYOUT_KEYS = Object.freeze([
  'columns', 'groupBy', 'order', 'depth', 'budget', 'retrieval', 'density',
]);

export const PROGRAM_SELECTION_KEYS = Object.freeze([
  'mode', 'limit', 'confidence', 'strategy',
]);

// `source` is an enum of HQ projections, never a path.
export const PROGRAM_SOURCE_VALUES = Object.freeze([
  'index', 'docs', 'decisions', 'canon', 'wiki', 'notes', 'sessions',
]);

// A key that would turn a view configuration into an effect surface. Refused
// even where the key is not otherwise allowlisted.
const FORBIDDEN_KEYS = new Set([
  'command', 'exec', 'shell', 'script', 'run', 'spawn', 'send', 'publish',
  'message', 'provider', 'write', 'patch', 'edit', 'delete', 'sudo',
  'escalate', 'grant', 'role', 'token', 'secret', 'env',
]);

// Capability words and shapes refused inside any string value.
const FORBIDDEN_WORDS = Object.freeze([
  'shell', 'exec', 'eval', 'spawn', 'process', 'sudo', 'escalate', 'privilege',
  'send', 'publish',
]);
const FORBIDDEN_LITERALS = Object.freeze(['http://', 'https://', 'file://', '~', '${']);

// Per-key value contracts. `nested` marks the three programmable sections.
const CONFIG_SPEC = Object.freeze({
  id: 'id',
  version: 'positive_int',
  project: 'text',
  source: 'source',
  filters: 'nested',
  layout: 'nested',
  selection: 'nested',
  expectedRevision: 'non_negative_int',
});

const FILTER_SPEC = Object.freeze({
  kind: 'text_list',
  status: 'text_list',
  authority: 'text_list',
  type: 'text_list',
  capability: 'text_list',
  query: 'text_list',
});

const LAYOUT_SPEC = Object.freeze({
  columns: 'text_list',
  groupBy: 'text',
  order: 'text_list',
  depth: 'non_negative_int',
  budget: 'positive_int',
  retrieval: 'text',
  density: 'text',
});

const SELECTION_SPEC = Object.freeze({
  mode: 'text',
  limit: 'positive_int',
  confidence: 'confidence',
  strategy: 'text',
});

const SECTIONS = Object.freeze([
  ['filters', FILTER_SPEC],
  ['layout', LAYOUT_SPEC],
  ['selection', SELECTION_SPEC],
]);

const ID_RE = /^[a-z0-9][a-z0-9._-]*$/;

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// ---------------------------------------------------------------------------
// small helpers

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value) {
  return typeof value === 'string' && value.length > 0;
}

function isPositiveInt(value) {
  return Number.isSafeInteger(value) && value >= 1;
}

function isNonNegativeInt(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function isTextList(value) {
  if (typeof value === 'string') return true;
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isConfidence(value) {
  if (typeof value === 'string') return true;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function clampLimit(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1000, Math.trunc(n)));
}

// ---------------------------------------------------------------------------
// validation

function typeError(errors, path, expected, value) {
  errors.push({
    code: 'invalid_type',
    path,
    message: `${path || 'config'} must be ${expected}, got ${Array.isArray(value) ? 'array' : typeof value}`,
  });
}

function checkValue(errors, path, kind, value) {
  switch (kind) {
    case 'id':
      if (typeof value !== 'string' || !ID_RE.test(value)) {
        errors.push({
          code: 'invalid_id',
          path,
          message: 'id must be a lowercase slug matching ^[a-z0-9][a-z0-9._-]*$',
        });
      }
      return;
    case 'positive_int':
      if (!isPositiveInt(value)) {
        errors.push({ code: 'invalid_version', path, message: 'version must be an integer >= 1' });
      }
      return;
    case 'non_negative_int':
      if (!isNonNegativeInt(value)) typeError(errors, path, 'an integer >= 0', value);
      return;
    case 'source':
      if (typeof value !== 'string' || !PROGRAM_SOURCE_VALUES.includes(value)) {
        errors.push({
          code: 'invalid_source',
          path,
          message: `source must be one of: ${PROGRAM_SOURCE_VALUES.join(', ')}`,
        });
      }
      return;
    case 'text':
      if (!isText(value)) typeError(errors, path, 'a non-empty string', value);
      return;
    case 'text_list':
      if (!isTextList(value)) typeError(errors, path, 'a string or an array of strings', value);
      return;
    case 'confidence':
      if (!isConfidence(value)) typeError(errors, path, 'a number in [0, 1] or a string', value);
      return;
    default:
      return;
  }
}

// Walks every string value (including inside arrays) and refuses capability
// shapes and traversal shapes. Paths are deterministic: `section.key[0]`.
function scanStrings(value, path, errors) {
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    const forbidden = FORBIDDEN_LITERALS.some((literal) => lowered.includes(literal))
      || FORBIDDEN_WORDS.some((word) => new RegExp(`(^|[^a-z0-9_])${word}([^a-z0-9_]|$)`, 'i').test(value));
    if (forbidden) {
      errors.push({
        code: 'forbidden_value',
        path,
        message: 'value matches a refused capability shape (command, shell, network URL or privilege)',
      });
    }
    const trimmed = value.trim();
    const traversal = trimmed.includes('..')
      || /^[\\/]/.test(trimmed)
      || /^[A-Za-z]:/.test(trimmed);
    if (traversal) {
      errors.push({
        code: 'path_traversal',
        path,
        message: 'value must not be or contain a filesystem path; sources are an enum',
      });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanStrings(item, `${path}[${index}]`, errors));
    return;
  }
  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) {
      if (FORBIDDEN_KEYS.has(key.toLowerCase())) continue; // already reported as forbidden_key
      scanStrings(value[key], path ? `${path}.${key}` : key, errors);
    }
  }
}

function sortedErrors(errors) {
  const seen = new Set();
  const unique = [];
  for (const error of errors) {
    const id = `${error.path}\0${error.code}\0${error.message}`;
    if (seen.has(id)) continue;
    seen.add(id);
    unique.push(error);
  }
  return unique.sort((a, b) => cmp(a.path, b.path) || cmp(a.code, b.code) || cmp(a.message, b.message));
}

/**
 * validateProgramConfig — never throws; returns a deterministically sorted
 * error list. A config is data, never authority.
 */
export function validateProgramConfig(config) {
  if (!isPlainObject(config)) {
    return {
      ok: false,
      errors: [{
        code: 'invalid_config',
        path: '',
        message: 'config must be a plain object',
      }],
    };
  }
  const errors = [];
  for (const key of Object.keys(config)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) {
      errors.push({
        code: 'forbidden_key',
        path: key,
        message: `"${key}" is not programmable from the wiki surface`,
      });
      continue;
    }
    if (!PROGRAM_CONFIG_KEYS.includes(key)) {
      errors.push({ code: 'unknown_key', path: key, message: `unknown config key "${key}"` });
      continue;
    }
    const kind = CONFIG_SPEC[key];
    if (kind === 'nested') continue; // handled below
    checkValue(errors, key, kind, config[key]);
  }

  for (const [section, spec] of SECTIONS) {
    if (!Object.prototype.hasOwnProperty.call(config, section)) continue;
    const value = config[section];
    if (!isPlainObject(value)) {
      typeError(errors, section, 'an object of allowlisted keys', value);
      continue;
    }
    for (const key of Object.keys(value)) {
      if (FORBIDDEN_KEYS.has(key.toLowerCase())) {
        errors.push({
          code: 'forbidden_key',
          path: `${section}.${key}`,
          message: `"${key}" is not programmable from the wiki surface`,
        });
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(spec, key)) {
        errors.push({
          code: 'unknown_key',
          path: `${section}.${key}`,
          message: `unknown ${section} key "${key}"`,
        });
        continue;
      }
      checkValue(errors, `${section}.${key}`, spec[key], value[key]);
    }
  }

  scanStrings(config, '', errors);
  const sorted = sortedErrors(errors);
  return { ok: sorted.length === 0, errors: sorted };
}

/**
 * canonicalProgramConfig — canonical JSON string: keys sorted at every level,
 * no insignificant whitespace. Identical content => identical string.
 */
export function canonicalProgramConfig(config) {
  return JSON.stringify(canonical(config));
}

function configText(config) {
  return canonicalProgramConfig(isPlainObject(config) ? config : {});
}

// ---------------------------------------------------------------------------
// plan and projection derivation (pure)

const SOURCE_PROJECTIONS = Object.freeze({
  index: ['files', 'symbols'],
  docs: ['documents'],
  decisions: ['decisions'],
  canon: ['canon'],
  wiki: ['wiki-pages'],
  notes: ['notes'],
  sessions: ['sessions'],
});

const LAYOUT_PROJECTIONS = Object.freeze({
  columns: 'columns',
  groupBy: 'groups',
  order: 'ordering',
  depth: 'graph',
  budget: 'budget',
  retrieval: 'retrieval',
  density: 'density',
});

const SELECTION_PROJECTIONS = Object.freeze({
  mode: 'selection',
  limit: 'limit',
  confidence: 'confidence',
  strategy: 'strategy',
});

function buildSteps() {
  return [
    { id: 'resolve-source', label: 'Resolve the configured source', dependsOn: [] },
    { id: 'apply-filters', label: 'Apply filters', dependsOn: ['resolve-source'] },
    { id: 'apply-selection', label: 'Apply selection', dependsOn: ['apply-filters'] },
    { id: 'apply-layout', label: 'Apply layout', dependsOn: ['apply-selection'] },
    { id: 'render-projections', label: 'Render projections', dependsOn: ['apply-layout'] },
  ];
}

// Ordering is delegated to the shared optimizer: no second topological sort.
// A blocked plan (cycle or missing dependency) never emits an order.
function planFor() {
  const steps = buildSteps();
  const ordered = orderActionPlan(steps);
  const status = ordered?.status === 'invalid' ? 'invalid' : (ordered?.status || 'invalid');
  const plan = {
    status,
    steps,
    order: status === 'ordered' ? [...(ordered.order || [])] : [],
  };
  if (status !== 'ordered') {
    plan.missing = [...(ordered?.missing || [])];
    plan.cycle = [...(ordered?.cycle || [])];
  }
  return plan;
}

function affectedFor(config) {
  const source = typeof config.source === 'string' ? config.source : null;
  const touched = new Set();
  for (const projection of SOURCE_PROJECTIONS[source] || []) touched.add(projection);
  const layout = isPlainObject(config.layout) ? config.layout : {};
  for (const key of Object.keys(layout)) {
    if (!Object.prototype.hasOwnProperty.call(LAYOUT_PROJECTIONS, key)) continue;
    if (layout[key] == null) continue;
    touched.add(LAYOUT_PROJECTIONS[key]);
  }
  const selection = isPlainObject(config.selection) ? config.selection : {};
  for (const key of Object.keys(selection)) {
    if (!Object.prototype.hasOwnProperty.call(SELECTION_PROJECTIONS, key)) continue;
    if (selection[key] == null) continue;
    touched.add(SELECTION_PROJECTIONS[key]);
  }
  const project = typeof config.project === 'string' ? config.project.trim() : '';
  return {
    source,
    projections: [...touched].sort(cmp),
    scope: project || 'all',
  };
}

// ---------------------------------------------------------------------------
// storage helpers (the table is declared elsewhere; this module never runs DDL)

function readActive(db, id) {
  if (!id) return null;
  try {
    const row = db.prepare(
      "SELECT * FROM wiki_program_version WHERE id = ? AND status = 'active' ORDER BY version DESC LIMIT 1",
    ).get(String(id));
    return row || null;
  } catch {
    return null;
  }
}

function maxValue(db, id, column) {
  const row = db.prepare(
    `SELECT MAX(${column}) AS value FROM wiki_program_version WHERE id = ?`,
  ).get(String(id));
  return row && row.value != null ? Number(row.value) : 0;
}

function maxActiveRevision(db, id) {
  const row = db.prepare(
    "SELECT MAX(revision) AS value FROM wiki_program_version WHERE id = ? AND status = 'active'",
  ).get(String(id));
  return row && row.value != null ? Number(row.value) : 0;
}

function versionRow(row) {
  return {
    id: row.id,
    version: Number(row.version),
    status: row.status,
    revision: Number(row.revision),
    ownerConfirmed: Number(row.owner_confirmed) === 1,
    config: safeJsonParse(row.config, null),
    createdAt: row.created_at,
    receipt: row.receipt == null ? null : safeJsonParse(row.receipt, null),
  };
}

// ---------------------------------------------------------------------------
// diff

// `version` is assigned by the writer (max + 1), so it is excluded from the
// diff: an authored version number is data, not the stored identity.
function diffAgainst(config, active) {
  const next = isPlainObject(config) ? config : {};
  const priorRow = active ? safeJsonParse(active.config, null) : null;
  const prior = isPlainObject(priorRow) ? priorRow : {};
  const nextKeys = Object.keys(next).filter((key) => key !== 'version').sort(cmp);
  const priorKeys = Object.keys(prior).filter((key) => key !== 'version').sort(cmp);
  const changed = nextKeys.filter((key) => (
    priorKeys.includes(key)
    && canonicalProgramConfig(next[key]) !== canonicalProgramConfig(prior[key])
  ));
  const added = nextKeys.filter((key) => !priorKeys.includes(key));
  const removed = priorKeys.filter((key) => !nextKeys.includes(key));
  return {
    changed,
    added,
    removed,
    fromVersion: active ? Number(active.version) : null,
  };
}

// ---------------------------------------------------------------------------
// preview (pure, unauthorized, no side effects)

/**
 * previewProgram — composes the plan, the diff against the ACTIVE version and
 * the digest. Reads only; never writes and never mutates the db.
 */
export function previewProgram(db, config) {
  const validation = validateProgramConfig(config);
  const safe = isPlainObject(config) ? config : {};
  const canonicalText = configText(config);
  const plan = planFor();
  const id = typeof safe.id === 'string' ? safe.id : null;
  const active = readActive(db, id);
  const digest = sha256(`${canonicalText}\0${canonicalProgramConfig(plan)}`);
  return {
    schema: WIKI_PROGRAM_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    plan,
    diff: diffAgainst(config, active),
    affected: affectedFor(safe),
    revision: active ? Number(active.revision) : 0,
    digest,
    activeVersion: active ? Number(active.version) : null,
  };
}

// ---------------------------------------------------------------------------
// the only writers

/**
 * activateProgram — the only version-creating write path besides rollback.
 * Requires explicit owner confirmation; refuses an invalid config without
 * writing anything. Previous versions are superseded, never deleted.
 */
export function activateProgram(db, config, options = {}) {
  const opts = isPlainObject(options) ? options : {};
  if (opts.ownerConfirmed !== true) return { ok: false, reason: 'owner_confirmation_required' };
  const validation = validateProgramConfig(config);
  if (!validation.ok) return { ok: false, reason: 'invalid_config', errors: validation.errors };

  const id = config.id;
  const stored = canonicalProgramConfig(config);
  const digest = sha256(stored);
  const receipt = opts.receipt == null ? null : canonical(opts.receipt);

  try {
    return transaction(db, () => {
      const version = maxValue(db, id, 'version') + 1;
      const revision = maxActiveRevision(db, id) + 1;
      db.prepare(`
        INSERT INTO wiki_program_version(id, version, config, status, revision, owner_confirmed, created_at, receipt)
        VALUES (?, ?, ?, 'active', ?, 1, ?, ?)
      `).run(id, version, stored, revision, nowISO(), receipt == null ? null : JSON.stringify(receipt));
      db.prepare("UPDATE wiki_program_version SET status = 'superseded' WHERE id = ? AND version <> ?")
        .run(id, version);
      return { ok: true, id, version, revision, digest, receipt };
    });
  } catch {
    return { ok: false, reason: 'storage_unavailable' };
  }
}

/**
 * rollbackProgram — restores a previous version's config as a NEW version.
 * History is never deleted: the rolled-back-from version stays superseded.
 */
export function rollbackProgram(db, options = {}) {
  const opts = isPlainObject(options) ? options : {};
  if (opts.ownerConfirmed !== true) return { ok: false, reason: 'owner_confirmation_required' };
  const id = typeof opts.id === 'string' ? opts.id : '';
  const toVersion = Number.isSafeInteger(opts.toVersion) && opts.toVersion >= 1 ? opts.toVersion : null;
  if (!id || toVersion == null) return { ok: false, reason: 'unknown_version' };

  const receipt = opts.receipt == null ? null : canonical(opts.receipt);

  try {
    return transaction(db, () => {
      const target = db.prepare('SELECT * FROM wiki_program_version WHERE id = ? AND version = ?')
        .get(id, toVersion);
      if (!target) return { ok: false, reason: 'unknown_version' };
      const version = maxValue(db, id, 'version') + 1;
      const revision = maxActiveRevision(db, id) + 1;
      const stored = String(target.config ?? '');
      db.prepare(`
        INSERT INTO wiki_program_version(id, version, config, status, revision, owner_confirmed, created_at, receipt)
        VALUES (?, ?, ?, 'active', ?, 1, ?, ?)
      `).run(id, version, stored, revision, nowISO(), receipt == null ? null : JSON.stringify(receipt));
      db.prepare("UPDATE wiki_program_version SET status = 'superseded' WHERE id = ? AND version <> ?")
        .run(id, version);
      return {
        ok: true,
        id,
        version,
        revision,
        digest: sha256(stored),
        fromVersion: toVersion,
      };
    });
  } catch {
    return { ok: false, reason: 'storage_unavailable' };
  }
}

// ---------------------------------------------------------------------------
// reads

/** listProgramVersions — id asc, version asc; `limit` default 100, max 1000. */
export function listProgramVersions(db, options = {}) {
  const opts = isPlainObject(options) ? options : {};
  const limit = clampLimit(opts.limit, 100);
  if (limit === 0) return [];
  const id = typeof opts.id === 'string' && opts.id ? opts.id : null;
  try {
    const rows = id
      ? db.prepare('SELECT * FROM wiki_program_version WHERE id = ? ORDER BY id ASC, version ASC LIMIT ?')
        .all(id, limit)
      : db.prepare('SELECT * FROM wiki_program_version ORDER BY id ASC, version ASC LIMIT ?')
        .all(limit);
    return rows.map(versionRow);
  } catch {
    return [];
  }
}

/** getActiveProgram — the active row for one id, or null. */
export function getActiveProgram(db, id) {
  const row = readActive(db, typeof id === 'string' ? id : null);
  return row ? versionRow(row) : null;
}

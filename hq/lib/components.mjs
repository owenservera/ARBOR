/**
 * @hq:context Reusable action component registry: immutable versions, versioned pipeline composition, activation, fork/diff/replay.
 * @hq:owner hq-agent
 * @hq:task lane-N
 * @hq:why Actions are data, not code sprawl: a stable id@version plus a versioned DAG keeps 10,000 automations replayable without a cloud service.
 * @hq:invariant No component may declare a browser or send effect; a document never grants execution authority.
 */
import {
  canonical, clamp, digestOf, nowISO, safeJsonParse, tokenize, uniqueSorted,
} from './util.mjs';

const COMPONENT_SCHEMA = 'hq.component/1';
const PIPELINE_SCHEMA = 'hq.pipeline/1';
const GRAPH_SCHEMA = 'hq.pipeline-graph/1';
const PLAN_SCHEMA = 'hq.pipeline-plan/1';
const ACTIVATION_SCHEMA = 'hq.activation/1';

const COMPONENT_KINDS = ['tool', 'trigger', 'policy', 'context', 'evaluator', 'transform', 'approval', 'sink'];
const COMPONENT_STATUSES = ['active', 'draft', 'deprecated', 'retired'];
const PIPELINE_STATUSES = ['active', 'draft', 'deprecated', 'retired'];
const IDEMPOTENCY = ['keyed', 'natural', 'none'];
const COST_CLASSES = ['local', 'model', 'network'];
// Most specific scope first: session beats project beats workspace.
const SCOPE_SPECIFICITY = ['session', 'project', 'workspace'];

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 1000;
const MAX_PLAN_CACHE = 128;
const DEFAULT_MAX_FANOUT = 100;

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;
const READ_EFFECT_RE = /(^|:)(read|list|stat|watch|search|resolve|validate|evaluate|describe)$/;
const FORBIDDEN_EFFECT_RE = /^(browser|send|network|http|https|provider|cloud|email|sms|webhook|socket)(:|$)/;

const PLAN_CACHE = new Map();
const READY_DBS = new WeakSet();
const STMT_CACHE = new WeakMap();
const FRAGMENT = Symbol('hq.compose.fragment');

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------

function fail(code, message, detail) {
  const error = new Error(message || code);
  error.code = code;
  if (detail !== undefined) error.detail = detail;
  throw error;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function jsonValue(value, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'string') return safeJsonParse(value, fallback);
  return value;
}

function jsonText(value) {
  return JSON.stringify(canonical(value === undefined ? null : value));
}

function mergeConfig(base, override) {
  if (!isPlainObject(base)) return isPlainObject(override) ? clone(override) : (override ?? {});
  if (!isPlainObject(override)) return clone(base);
  const out = clone(base);
  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(out[key])) out[key] = mergeConfig(out[key], value);
    else out[key] = clone(value);
  }
  return out;
}

function sameJson(a, b) {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

function integer(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) fail('NUMBER_INVALID', `expected a non-negative integer, got ${value}`);
  return n;
}

function asStringArray(value) {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return uniqueSorted(value.map((v) => String(v).trim()).filter(Boolean));
  if (typeof value === 'string') return uniqueSorted(value.split(',').map((v) => v.trim()).filter(Boolean));
  fail('ARRAY_INVALID', 'expected an array of strings');
  return [];
}

function requireId(value, prefix) {
  const id = String(value ?? '').trim();
  if (!id) fail(`${prefix}_ID_REQUIRED`, `${prefix.toLowerCase()} id is required`);
  if (!ID_RE.test(id)) fail(`${prefix}_ID_INVALID`, `invalid ${prefix.toLowerCase()} id: ${id}`);
  return id;
}

// ---------------------------------------------------------------------------
// semver: parse, compare, range match (^, ~, >=, exact, *, x, ||, spaces)
// ---------------------------------------------------------------------------

function parseVersion(value) {
  const text = String(value ?? '').trim();
  const match = SEMVER_RE.exec(text);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split('.') : [],
    raw: text,
  };
}

function comparePrerelease(a, b) {
  if (!a.length && !b.length) return 0;
  if (!a.length) return 1;
  if (!b.length) return -1;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    const left = a[i];
    const right = b[i];
    if (left === undefined) return -1;
    if (right === undefined) return 1;
    const leftNumeric = /^\d+$/.test(left);
    const rightNumeric = /^\d+$/.test(right);
    if (leftNumeric && rightNumeric) {
      const diff = Number(left) - Number(right);
      if (diff !== 0) return diff < 0 ? -1 : 1;
      continue;
    }
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    if (left !== right) return left < right ? -1 : 1;
  }
  return 0;
}

function compareParsed(a, b) {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
  return comparePrerelease(a.prerelease, b.prerelease);
}

function fullVersion(major, minor, patch, prerelease = []) {
  const base = `${major}.${minor}.${patch}`;
  return {
    major, minor, patch, prerelease,
    raw: prerelease.length ? `${base}-${prerelease.join('.')}` : base,
  };
}

function pad5(value) {
  return String(value).padStart(5, '0');
}

function versionKey(parsed) {
  return `${pad5(parsed.major)}.${pad5(parsed.minor)}.${pad5(parsed.patch)}`;
}

function requireVersion(value, prefix) {
  const parsed = parseVersion(value);
  if (!parsed) fail(`${prefix}_VERSION_INVALID`, `invalid semver ${prefix.toLowerCase()} version: ${value}`);
  return parsed.raw;
}

function parsePartial(text) {
  const token = String(text ?? '').trim().replace(/^v/i, '');
  if (!token) return null;
  const [core] = token.split('+');
  const [main, pre] = core.split('-');
  const parts = main.split('.');
  if (!parts.length || parts.length > 3) return null;
  const numbers = [];
  for (let i = 0; i < 3; i++) {
    const part = parts[i];
    if (part === undefined || part === 'x' || part === 'X' || part === '*') {
      numbers.push(null);
      continue;
    }
    if (!/^\d+$/.test(part)) return null;
    numbers.push(Number(part));
  }
  if (numbers[1] === null && numbers[2] !== null) return null;
  return {
    major: numbers[0],
    minor: numbers[1],
    patch: numbers[2],
    prerelease: pre ? pre.split('.') : [],
  };
}

function makeComparator(op, partial) {
  const pre = partial.prerelease ?? [];
  const lowerOf = () => fullVersion(partial.major ?? 0, partial.minor ?? 0, partial.patch ?? 0, pre);
  if (op === '^') {
    const lower = lowerOf();
    let upper;
    if ((partial.major ?? 0) > 0) upper = fullVersion(partial.major + 1, 0, 0);
    else if (partial.minor === null) upper = fullVersion(1, 0, 0);
    else if (partial.minor > 0) upper = fullVersion(0, partial.minor + 1, 0);
    else if (partial.patch === null) upper = fullVersion(0, 1, 0);
    else upper = fullVersion(0, 0, partial.patch + 1);
    return { lower, upper, upperInclusive: false };
  }
  if (op === '~') {
    const lower = lowerOf();
    const upper = partial.minor === null
      ? fullVersion((partial.major ?? 0) + 1, 0, 0)
      : fullVersion(partial.major, partial.minor + 1, 0);
    return { lower, upper, upperInclusive: false };
  }
  if (op === '=') {
    if (partial.patch !== null) return { lower: lowerOf(), upper: null, exact: true };
    if (partial.minor !== null) {
      return { lower: lowerOf(), upper: fullVersion(partial.major, partial.minor + 1, 0), upperInclusive: false };
    }
    return { lower: lowerOf(), upper: fullVersion(partial.major + 1, 0, 0), upperInclusive: false };
  }
  if (op === '>=') return { lower: lowerOf(), upper: null };
  if (op === '>') {
    if (partial.patch !== null) return { lower: lowerOf(), upper: null, lowerExclusive: true };
    if (partial.minor !== null) return { lower: fullVersion(partial.major, partial.minor + 1, 0), upper: null };
    return { lower: fullVersion(partial.major + 1, 0, 0), upper: null };
  }
  if (op === '<=') {
    if (partial.patch !== null) return { lower: null, upper: lowerOf(), upperInclusive: true };
    if (partial.minor !== null) return { lower: null, upper: fullVersion(partial.major, partial.minor + 1, 0), upperInclusive: false };
    return { lower: null, upper: fullVersion(partial.major + 1, 0, 0), upperInclusive: false };
  }
  if (op === '<') return { lower: null, upper: lowerOf(), upperInclusive: false };
  return null;
}

function comparatorFor(token) {
  const text = String(token ?? '').trim();
  if (!text) return null;
  if (text === '*' || text === 'latest' || text === 'any' || text === 'x' || text === 'X') {
    return { any: true, preTuple: null };
  }
  const match = /^(>=|<=|>|<|=|\^|~)?\s*(.+)$/.exec(text);
  if (!match) return null;
  const op = match[1] ?? '=';
  const partial = parsePartial(match[2]);
  if (!partial) return null;
  const comparator = makeComparator(op, partial);
  if (!comparator) return null;
  comparator.preTuple = partial.prerelease.length
    ? `${partial.major}.${partial.minor}.${partial.patch}`
    : null;
  return comparator;
}

function parseRange(range) {
  const text = String(range ?? '*').trim();
  if (!text) return { ok: true, wildcard: true, sets: [[]], raw: '*' };
  const alternatives = text.split('||').map((part) => part.trim()).filter(Boolean);
  if (!alternatives.length) return { ok: true, wildcard: true, sets: [[]], raw: text };
  const sets = [];
  for (const alternative of alternatives) {
    const tokens = alternative.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    const comparators = [];
    for (const token of tokens) {
      const comparator = comparatorFor(token);
      if (!comparator) return { ok: false, raw: text };
      comparators.push(comparator);
    }
    sets.push(comparators);
  }
  const wildcard = sets.length === 1 && sets[0].every((comparator) => comparator.any === true);
  return { ok: true, wildcard, sets, raw: text };
}

function comparatorCovers(version, comparator) {
  if (comparator.any) return version.prerelease.length === 0;
  if (version.prerelease.length) {
    const tuple = `${version.major}.${version.minor}.${version.patch}`;
    if (comparator.preTuple !== tuple) return false;
  }
  if (comparator.lower) {
    const diff = compareParsed(version, comparator.lower);
    if (diff < 0) return false;
    if (diff === 0 && comparator.lowerExclusive) return false;
  }
  if (comparator.upper) {
    const diff = compareParsed(version, comparator.upper);
    if (diff > 0) return false;
    if (diff === 0 && comparator.upperInclusive === false) return false;
  }
  if (comparator.exact && comparator.lower) {
    return compareParsed(version, comparator.lower) === 0;
  }
  return true;
}

function satisfies(version, rangeOrParsed) {
  const parsedVersion = typeof version === 'string' ? parseVersion(version) : version;
  if (!parsedVersion) return false;
  const parsedRange = typeof rangeOrParsed === 'string' || rangeOrParsed == null
    ? parseRange(rangeOrParsed)
    : rangeOrParsed;
  if (!parsedRange.ok) return false;
  return parsedRange.sets.some((set) => set.every((comparator) => comparatorCovers(parsedVersion, comparator)));
}

function compareVersionStrings(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (!left || !right) return String(a).localeCompare(String(b));
  return compareParsed(left, right);
}

// ---------------------------------------------------------------------------
// refs: "id@range" for components inside pipelines
// ---------------------------------------------------------------------------

function tryParseRef(ref) {
  let id = '';
  let range = '*';
  if (typeof ref === 'string') {
    const text = ref.trim();
    const at = text.indexOf('@');
    if (at === -1) {
      id = text;
    } else {
      id = text.slice(0, at).trim();
      range = text.slice(at + 1).trim() || '*';
    }
  } else if (isPlainObject(ref)) {
    id = String(ref.id ?? '').trim();
    range = String(ref.range ?? ref.version ?? '*').trim() || '*';
  } else {
    return { ok: false, reason: 'component reference must be "id@range" or {id, range}' };
  }
  if (!id || !ID_RE.test(id)) return { ok: false, reason: `invalid component id: ${id || '(empty)'}` };
  const parsedRange = parseRange(range);
  if (!parsedRange.ok) return { ok: false, reason: `invalid semver range: ${range}` };
  return { ok: true, id, range, ref: `${id}@${range}` };
}

function requireRef(ref) {
  const parsed = tryParseRef(ref);
  if (!parsed.ok) fail('COMPONENT_REF_INVALID', parsed.reason, { ref });
  return parsed;
}

// ---------------------------------------------------------------------------
// schema (owned by this module; hq/lib/schema.mjs is untouched)
// ---------------------------------------------------------------------------

const DDL = `
CREATE TABLE IF NOT EXISTS components (
  id             TEXT NOT NULL,
  version        TEXT NOT NULL,
  kind           TEXT NOT NULL DEFAULT 'tool',
  title          TEXT,
  description    TEXT,
  input_schema   TEXT,
  output_schema  TEXT,
  config_schema  TEXT,
  defaults       TEXT,
  effects        TEXT NOT NULL DEFAULT '[]',
  authority      TEXT NOT NULL DEFAULT '[]',
  idempotency    TEXT NOT NULL DEFAULT 'natural',
  timeout_ms     INTEGER,
  retries        INTEGER,
  cost_class     TEXT NOT NULL DEFAULT 'local',
  tags           TEXT NOT NULL DEFAULT '[]',
  compatibility  TEXT,
  handler        TEXT,
  status         TEXT NOT NULL DEFAULT 'active',
  digest         TEXT NOT NULL,
  content_digest TEXT NOT NULL,
  changelog      TEXT,
  approval       INTEGER NOT NULL DEFAULT 0,
  version_major  INTEGER NOT NULL DEFAULT 0,
  version_minor  INTEGER NOT NULL DEFAULT 0,
  version_patch  INTEGER NOT NULL DEFAULT 0,
  version_key    TEXT NOT NULL DEFAULT '00000.00000.00000',
  created_at     TEXT NOT NULL,
  created_by     TEXT,
  PRIMARY KEY (id, version)
);
CREATE INDEX IF NOT EXISTS components_kind ON components(kind, id);
CREATE INDEX IF NOT EXISTS components_status ON components(status, id);
CREATE INDEX IF NOT EXISTS components_content_digest ON components(id, content_digest);
CREATE INDEX IF NOT EXISTS components_order ON components(id, version_key DESC, version ASC);

CREATE TABLE IF NOT EXISTS component_tags (
  component_id      TEXT NOT NULL,
  component_version TEXT NOT NULL,
  tag               TEXT NOT NULL,
  PRIMARY KEY (component_id, component_version, tag)
);
CREATE INDEX IF NOT EXISTS component_tags_tag ON component_tags(tag, component_id, component_version);

CREATE VIRTUAL TABLE IF NOT EXISTS components_fts USING fts5(
  id,
  version UNINDEXED,
  title,
  description,
  tags,
  tokenize = "unicode61 tokenchars '_-.'",
  prefix = '2 3'
);

CREATE TABLE IF NOT EXISTS pipelines (
  id             TEXT NOT NULL,
  version        TEXT NOT NULL,
  parent_version TEXT,
  title          TEXT,
  description    TEXT,
  trigger        TEXT,
  nodes          TEXT NOT NULL,
  edges          TEXT NOT NULL DEFAULT '[]',
  defaults       TEXT,
  config         TEXT,
  status         TEXT NOT NULL DEFAULT 'active',
  digest         TEXT NOT NULL,
  content_digest TEXT NOT NULL,
  changelog      TEXT,
  version_major  INTEGER NOT NULL DEFAULT 0,
  version_minor  INTEGER NOT NULL DEFAULT 0,
  version_patch  INTEGER NOT NULL DEFAULT 0,
  version_key    TEXT NOT NULL DEFAULT '00000.00000.00000',
  created_at     TEXT NOT NULL,
  created_by     TEXT,
  PRIMARY KEY (id, version)
);
CREATE INDEX IF NOT EXISTS pipelines_status ON pipelines(status, id);
CREATE INDEX IF NOT EXISTS pipelines_content_digest ON pipelines(id, content_digest);
CREATE INDEX IF NOT EXISTS pipelines_order ON pipelines(id, version_key DESC, version ASC);

CREATE VIRTUAL TABLE IF NOT EXISTS pipelines_fts USING fts5(
  id,
  version UNINDEXED,
  title,
  description,
  tokenize = "unicode61 tokenchars '_-.'",
  prefix = '2 3'
);

CREATE TABLE IF NOT EXISTS activations (
  scope            TEXT NOT NULL,
  scope_ref        TEXT NOT NULL DEFAULT '',
  pipeline_id      TEXT NOT NULL,
  version          TEXT NOT NULL,
  config           TEXT,
  config_digest    TEXT NOT NULL,
  activated_at     TEXT NOT NULL,
  activated_by     TEXT,
  previous_version TEXT,
  PRIMARY KEY (scope, scope_ref, pipeline_id)
);
CREATE INDEX IF NOT EXISTS activations_pipeline ON activations(pipeline_id, scope);

CREATE TABLE IF NOT EXISTS activation_log (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  scope          TEXT NOT NULL,
  scope_ref      TEXT NOT NULL DEFAULT '',
  pipeline_id    TEXT NOT NULL,
  action         TEXT NOT NULL,
  from_version   TEXT,
  to_version     TEXT NOT NULL,
  config_digest  TEXT NOT NULL,
  at             TEXT NOT NULL,
  actor          TEXT
);
CREATE INDEX IF NOT EXISTS activation_log_pipeline ON activation_log(pipeline_id, id);

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id                TEXT PRIMARY KEY,
  pipeline_id       TEXT NOT NULL,
  pipeline_version  TEXT NOT NULL,
  pipeline_digest   TEXT,
  plan_digest       TEXT,
  config            TEXT,
  config_digest     TEXT,
  input_digest      TEXT,
  output_digest     TEXT,
  component_versions TEXT,
  inputs            TEXT,
  status            TEXT NOT NULL DEFAULT 'succeeded',
  scope             TEXT,
  scope_ref         TEXT,
  started_at        TEXT,
  finished_at       TEXT,
  error             TEXT
);
CREATE INDEX IF NOT EXISTS pipeline_runs_pipeline ON pipeline_runs(pipeline_id, pipeline_version);
CREATE INDEX IF NOT EXISTS pipeline_runs_plan ON pipeline_runs(plan_digest);

CREATE TABLE IF NOT EXISTS pipeline_steps (
  run_id            TEXT NOT NULL,
  step_id           TEXT NOT NULL,
  component_id      TEXT NOT NULL,
  component_version TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'queued',
  attempt           INTEGER NOT NULL DEFAULT 1,
  started_at        TEXT,
  finished_at       TEXT,
  input_digest      TEXT,
  output_digest     TEXT,
  error             TEXT,
  receipt_id        TEXT,
  PRIMARY KEY (run_id, step_id, attempt)
);
CREATE INDEX IF NOT EXISTS pipeline_steps_component ON pipeline_steps(component_id, component_version);
`;

export function ensureSchema(db) {
  if (!db || typeof db.exec !== 'function') fail('DB_REQUIRED', 'a SQLite database handle is required');
  db.exec(DDL);
  READY_DBS.add(db);
  return db;
}

function ready(db) {
  if (!db || typeof db.exec !== 'function') fail('DB_REQUIRED', 'a SQLite database handle is required');
  if (!READY_DBS.has(db)) ensureSchema(db);
  return db;
}

// Prepared statements are cached per database handle: the batch path registers
// 10,000 components and must not recompile the same SQL 10,000 times.
function stmt(db, sql) {
  let cache = STMT_CACHE.get(db);
  if (!cache) {
    cache = new Map();
    STMT_CACHE.set(db, cache);
  }
  let statement = cache.get(sql);
  if (!statement) {
    statement = db.prepare(sql);
    cache.set(sql, statement);
  }
  return statement;
}

// ---------------------------------------------------------------------------
// components: normalize, digest, register, read, list
// ---------------------------------------------------------------------------

function normalizeComponent(input) {
  if (!isPlainObject(input)) fail('COMPONENT_INVALID', 'component must be an object');
  const id = requireId(input.id, 'COMPONENT');
  const version = requireVersion(input.version, 'COMPONENT');
  const parsed = parseVersion(version);
  const kind = String(input.kind ?? 'tool').trim().toLowerCase();
  if (!COMPONENT_KINDS.includes(kind)) fail('COMPONENT_KIND_INVALID', `unknown component kind: ${kind}`, { allowed: COMPONENT_KINDS });
  const status = String(input.status ?? 'active').trim().toLowerCase();
  if (!COMPONENT_STATUSES.includes(status)) fail('COMPONENT_STATUS_INVALID', `unknown component status: ${status}`, { allowed: COMPONENT_STATUSES });
  const idempotency = String(input.idempotency ?? 'natural').trim().toLowerCase();
  if (!IDEMPOTENCY.includes(idempotency)) fail('COMPONENT_IDEMPOTENCY_INVALID', `unknown idempotency: ${idempotency}`, { allowed: IDEMPOTENCY });
  const costClass = String(input.costClass ?? input.cost_class ?? 'local').trim().toLowerCase();
  if (!COST_CLASSES.includes(costClass)) fail('COMPONENT_COST_CLASS_INVALID', `unknown cost class: ${costClass}`, { allowed: COST_CLASSES });

  const effects = asStringArray(input.effects).map((effect) => effect.toLowerCase());
  for (const effect of effects) {
    if (FORBIDDEN_EFFECT_RE.test(effect)) {
      fail('COMPONENT_EFFECT_FORBIDDEN', `effect "${effect}" would perform a browser or send action; HQ never does that`, { effect });
    }
  }
  const authority = asStringArray(input.authority).map((scopeName) => scopeName.toLowerCase());
  const tags = asStringArray(input.tags);
  const approval = input.approval === true || input.gate === 'approval' || input.requiresApproval === true;
  const compensation = input.compensation === true || input.compensates === true;
  const writeEffects = effects.some((effect) => !READ_EFFECT_RE.test(effect));

  if (writeEffects && !authority.length) {
    fail('COMPONENT_AUTHORITY_REQUIRED', `component ${id}@${version} declares write effects but no authority scope`, { effects });
  }
  if (kind === 'sink' && !effects.length) {
    fail('COMPONENT_EFFECTS_REQUIRED', `component ${id}@${version} is a sink and must declare its effects`);
  }
  if (idempotency === 'none' && !approval && !compensation) {
    fail('COMPONENT_APPROVAL_REQUIRED', `component ${id}@${version} is not idempotent and has no approval gate or compensation step`);
  }

  const component = {
    schema: COMPONENT_SCHEMA,
    id,
    version,
    kind,
    title: input.title === undefined ? id : String(input.title),
    description: input.description === undefined ? null : String(input.description),
    inputSchema: jsonValue(input.inputSchema ?? input.input_schema, null),
    outputSchema: jsonValue(input.outputSchema ?? input.output_schema, null),
    configSchema: jsonValue(input.configSchema ?? input.config_schema, null),
    defaults: isPlainObject(input.defaults) ? input.defaults : (isPlainObject(input.config) ? input.config : {}),
    effects,
    authority,
    idempotency,
    timeoutMs: integer(input.timeoutMs ?? input.timeout_ms, null),
    retries: integer(input.retries, null),
    costClass,
    tags,
    compatibility: jsonValue(input.compatibility, null),
    handler: input.handler === undefined ? null : String(input.handler),
    status,
    changelog: input.changelog === undefined ? null : String(input.changelog),
    approval,
  };
  component.digest = digestOf(component);
  const contentShape = { ...component };
  delete contentShape.version;
  delete contentShape.digest;
  component.contentDigest = digestOf(contentShape);
  component.createdAt = input.createdAt === undefined ? nowISO() : String(input.createdAt);
  component.createdBy = input.createdBy === undefined ? null : String(input.createdBy);
  component.versionParts = { major: parsed.major, minor: parsed.minor, patch: parsed.patch };
  return component;
}

function componentFromRow(row) {
  if (!row) return null;
  return {
    schema: COMPONENT_SCHEMA,
    id: row.id,
    version: row.version,
    kind: row.kind,
    title: row.title,
    description: row.description,
    inputSchema: jsonValue(row.input_schema, null),
    outputSchema: jsonValue(row.output_schema, null),
    configSchema: jsonValue(row.config_schema, null),
    defaults: jsonValue(row.defaults, {}),
    effects: jsonValue(row.effects, []),
    authority: jsonValue(row.authority, []),
    idempotency: row.idempotency,
    timeoutMs: row.timeout_ms ?? null,
    retries: row.retries ?? null,
    costClass: row.cost_class,
    tags: jsonValue(row.tags, []),
    compatibility: jsonValue(row.compatibility, null),
    handler: row.handler,
    status: row.status,
    digest: row.digest,
    contentDigest: row.content_digest,
    changelog: row.changelog,
    approval: row.approval === 1,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

const INSERT_COMPONENT = `
INSERT INTO components(
  id, version, kind, title, description, input_schema, output_schema, config_schema,
  defaults, effects, authority, idempotency, timeout_ms, retries, cost_class, tags,
  compatibility, handler, status, digest, content_digest, changelog, approval,
  version_major, version_minor, version_patch, version_key, created_at, created_by
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

export function registerComponent(db, component, options = {}) {
  ready(db);
  const normalized = normalizeComponent(component);
  const allowDuplicateDigest = options.allowDuplicateDigest === true || component?.allowDuplicateDigest === true;

  const existing = stmt(db, 'SELECT digest, content_digest FROM components WHERE id = ? AND version = ?')
    .get(normalized.id, normalized.version);
  if (existing) {
    fail('COMPONENT_VERSION_EXISTS', `${normalized.id}@${normalized.version} is published and immutable`, {
      id: normalized.id, version: normalized.version, digest: existing.digest,
    });
  }
  const duplicate = stmt(db, 'SELECT version FROM components WHERE id = ? AND content_digest = ? LIMIT 1')
    .get(normalized.id, normalized.contentDigest);
  if (duplicate && !allowDuplicateDigest) {
    fail('COMPONENT_DUPLICATE_DIGEST', `component ${normalized.id}@${normalized.version} is identical to ${normalized.id}@${duplicate.version}`, {
      duplicateOf: duplicate.version, contentDigest: normalized.contentDigest,
    });
  }

  const parts = normalized.versionParts;
  stmt(db, INSERT_COMPONENT).run(
    normalized.id, normalized.version, normalized.kind, normalized.title, normalized.description,
    jsonText(normalized.inputSchema), jsonText(normalized.outputSchema), jsonText(normalized.configSchema),
    jsonText(normalized.defaults), jsonText(normalized.effects), jsonText(normalized.authority),
    normalized.idempotency, normalized.timeoutMs, normalized.retries, normalized.costClass,
    jsonText(normalized.tags), jsonText(normalized.compatibility), normalized.handler,
    normalized.status, normalized.digest, normalized.contentDigest, normalized.changelog,
    normalized.approval ? 1 : 0, parts.major, parts.minor, parts.patch, versionKey(parts),
    normalized.createdAt, normalized.createdBy,
  );
  stmt(db, `
    INSERT INTO components_fts(rowid, id, version, title, description, tags)
    VALUES ((SELECT rowid FROM components WHERE id = ? AND version = ?), ?, ?, ?, ?, ?)
  `).run(
    normalized.id, normalized.version,
    normalized.id, normalized.version, normalized.title ?? '', normalized.description ?? '', normalized.tags.join(' '),
  );
  const tagInsert = stmt(db, 'INSERT OR IGNORE INTO component_tags(component_id, component_version, tag) VALUES (?,?,?)');
  for (const tag of normalized.tags) tagInsert.run(normalized.id, normalized.version, tag);

  return {
    id: normalized.id,
    version: normalized.version,
    digest: normalized.digest,
    contentDigest: normalized.contentDigest,
    created: true,
  };
}

function allVersions(db, { id, source = 'any' }) {
  const versions = [];
  if (source !== 'pipeline') {
    for (const row of stmt(db, 'SELECT version FROM components WHERE id = ?').all(id)) versions.push(row.version);
  }
  if (source !== 'component') {
    for (const row of stmt(db, 'SELECT version FROM pipelines WHERE id = ?').all(id)) versions.push(row.version);
  }
  return versions;
}

function pickHighest(candidates, parsedRange) {
  let best = null;
  let bestParsed = null;
  for (const candidate of candidates) {
    const parsed = parseVersion(candidate);
    if (!parsed) continue;
    if (!bestParsed || compareParsed(parsed, bestParsed) > 0) {
      best = candidate;
      bestParsed = parsed;
    }
  }
  if (bestParsed && parsedRange?.wildcard && bestParsed.prerelease.length) {
    const stable = candidates.filter((candidate) => {
      const parsed = parseVersion(candidate);
      return parsed && parsed.prerelease.length === 0;
    });
    if (stable.length) return pickHighest(stable, null);
  }
  return best;
}

export function resolveVersion(db, { id, range = '*', source = 'any' } = {}) {
  ready(db);
  const componentId = requireId(id, 'COMPONENT');
  const parsedRange = parseRange(range);
  if (!parsedRange.ok) fail('VERSION_RANGE_INVALID', `invalid semver range: ${range}`, { range });
  const candidates = allVersions(db, { id: componentId, source });
  const matching = candidates.filter((candidate) => satisfies(candidate, parsedRange));
  if (matching.length) return pickHighest(matching, parsedRange);
  if (parsedRange.wildcard) {
    const highest = pickHighest(candidates, null);
    return highest;
  }
  return null;
}

export function getComponent(db, { id, version = null } = {}) {
  ready(db);
  const componentId = requireId(id, 'COMPONENT');
  let resolved = version;
  if (!resolved || resolved === '*' || !parseVersion(resolved)) {
    resolved = resolveVersion(db, { id: componentId, range: resolved || '*', source: 'component' });
  }
  if (!resolved) return null;
  const row = stmt(db, 'SELECT * FROM components WHERE id = ? AND version = ?').get(componentId, resolved);
  return componentFromRow(row);
}

function parseCursor(cursor) {
  if (!cursor) return null;
  if (isPlainObject(cursor)) return { id: String(cursor.id ?? ''), version: String(cursor.version ?? '') };
  const text = String(cursor);
  const at = text.indexOf('@');
  if (at === -1) return { id: text, version: '' };
  return { id: text.slice(0, at), version: text.slice(at + 1) };
}

function applyCursor(where, params, cursor, table = 'c') {
  const parsed = parseCursor(cursor);
  if (!parsed) return;
  if (!parsed.version) {
    where.push(`${table}.id > ?`);
    params.push(parsed.id);
    return;
  }
  const parsedVersion = parseVersion(parsed.version);
  if (!parsedVersion) fail('CURSOR_INVALID', `invalid cursor version: ${parsed.version}`);
  where.push(`(${table}.id > ? OR (${table}.id = ? AND (${table}.version_key < ? OR (${table}.version_key = ? AND ${table}.version > ?))))`);
  params.push(parsed.id, parsed.id, versionKey(parsedVersion), versionKey(parsedVersion), parsed.version);
}

function ftsQueryParts(query) {
  const text = String(query ?? '').trim();
  if (!text) return null;
  const tokens = tokenize(text);
  const escaped = tokens
    .filter((token) => token.length >= 2)
    .map((token) => `"${token.replace(/"/g, '')}"*`)
    .join(' ');
  const structured = /\b(OR|AND|NOT|NEAR)\b|["()*]/.test(text);
  return { raw: text, tokens: tokens.join(' '), escaped, structured };
}

function runFtsSelect(db, { table, ftsTable, select, where, params, order, limit, query }) {
  const base = `SELECT ${select} FROM ${table} c`;
  const tail = `ORDER BY ${order} LIMIT ?`;
  const filters = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const run = (match) => {
    const allWhere = [...where, `c.rowid IN (SELECT rowid FROM ${ftsTable} WHERE ${ftsTable} MATCH ?)`];
    return stmt(db, `${base} WHERE ${allWhere.join(' AND ')} ${tail}`).all(...params, match, limit);
  };
  const fts = ftsQueryParts(query);
  if (fts) {
    // Prefix tokens by default: identifiers such as "index-after-edit" are one
    // FTS token, so "index" must be a prefix query to match. Explicit FTS
    // syntax (OR/AND/quotes/parens) is tried verbatim first.
    const attempts = fts.structured
      ? [fts.raw, fts.escaped, fts.tokens]
      : [fts.escaped, fts.raw, fts.tokens];
    let lastError = null;
    for (const attempt of attempts) {
      if (!attempt) continue;
      try {
        return run(attempt);
      } catch (error) {
        lastError = error;
      }
    }
    if (lastError) throw lastError;
  }
  return stmt(db, `${base} ${filters} ${tail}`).all(...params, limit);
}

function decorateList(rows, limit) {
  Object.defineProperty(rows, 'limit', { value: limit, enumerable: false });
  return rows;
}

export function listComponents(db, options = {}) {
  ready(db);
  const limit = clamp(Number(options.limit ?? DEFAULT_LIMIT) || DEFAULT_LIMIT, 1, MAX_LIMIT);
  const where = [];
  const params = [];
  if (options.kind) { where.push('c.kind = ?'); params.push(String(options.kind).toLowerCase()); }
  if (options.status) { where.push('c.status = ?'); params.push(String(options.status).toLowerCase()); }
  if (options.id) { where.push('c.id = ?'); params.push(requireId(options.id, 'COMPONENT')); }
  if (options.tag) {
    where.push(`EXISTS (SELECT 1 FROM component_tags t WHERE t.component_id = c.id AND t.component_version = c.version AND t.tag = ?)`);
    params.push(String(options.tag));
  }
  applyCursor(where, params, options.cursor);
  const rows = runFtsSelect(db, {
    table: 'components',
    ftsTable: 'components_fts',
    select: '*',
    where,
    params,
    order: 'c.id ASC, c.version_key DESC, c.version ASC',
    limit: limit + 1,
    query: options.query,
  }).map(componentFromRow);
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const out = decorateList(page, limit);
  Object.defineProperty(out, 'nextCursor', {
    value: hasMore && page.length ? `${page[page.length - 1].id}@${page[page.length - 1].version}` : null,
    enumerable: false,
  });
  return out;
}

// ---------------------------------------------------------------------------
// composition algebra: fragments, combinators, compose()
// ---------------------------------------------------------------------------

function fragment(nodes = [], edges = [], entry = [], exit = [], meta = {}) {
  return { [FRAGMENT]: true, nodes, edges, entry, exit, meta };
}

function isFragment(value) {
  return Boolean(value && value[FRAGMENT]);
}

// Group metadata (branches, fallback pairs) is carried as arrays so nesting a
// composition inside another one never loses it.
function collectGroups(fragments, resolve = (ref) => ref) {
  const fallbacks = [];
  const branches = [];
  for (const frag of fragments) {
    for (const item of frag.meta?.fallbacks ?? []) {
      fallbacks.push({
        primaryExit: (item.primaryExit ?? []).map(resolve),
        backupEntry: (item.backupEntry ?? []).map(resolve),
      });
    }
    for (const item of frag.meta?.branches ?? []) {
      branches.push({
        condition: (item.condition ?? []).map(resolve),
        yes: (item.yes ?? []).map(resolve),
        no: (item.no ?? []).map(resolve),
      });
    }
  }
  return { fallbacks, branches };
}

function groupMeta(fragments, resolve, extra = {}) {
  const { fallbacks, branches } = collectGroups(fragments, resolve);
  const meta = { ...extra };
  if (fallbacks.length) meta.fallbacks = fallbacks;
  if (branches.length) meta.branches = branches;
  return meta;
}

function leaf(spec) {
  if (!isPlainObject(spec)) fail('COMPOSE_PART_INVALID', 'a composition part must be an object');
  const nodeSpec = isPlainObject(spec.node) ? spec.node : spec;
  if (nodeSpec.component === undefined) fail('COMPOSE_COMPONENT_REQUIRED', 'a leaf part must declare "component"');
  return fragment([nodeSpec], [], [nodeSpec], [nodeSpec], {});
}

function asFragment(part) {
  if (isFragment(part)) return part;
  if (Array.isArray(part)) return sequence(part);
  if (isPlainObject(part) && Array.isArray(part.nodes)) {
    const nodes = part.nodes.slice();
    const declared = [];
    const edges = [];
    for (const edge of part.edges ?? []) {
      const pair = Array.isArray(edge) ? edge : [edge.from, edge.to];
      if (pair.length === 2) edges.push(pair);
    }
    for (const node of nodes) {
      if (typeof node === 'string') fail('COMPOSE_PART_INVALID', 'graph nodes must be objects');
      declared.push(node);
    }
    const deps = new Map();
    for (const edge of edges) {
      const [from, to] = edge;
      if (!deps.has(to)) deps.set(to, []);
      deps.get(to).push(from);
    }
    const enriched = declared.map((node) => {
      const extra = node.dependsOn ?? [];
      const merged = [...extra];
      for (const [to, froms] of deps.entries()) {
        if (to === node.id) merged.push(...froms);
      }
      return merged.length ? { ...node, dependsOn: merged } : node;
    });
    const entry = enriched.filter((node) => !(node.dependsOn ?? []).length);
    const dependents = new Set(enriched.flatMap((node) => node.dependsOn ?? []));
    const exit = enriched.filter((node) => !dependents.has(node.id));
    return fragment(enriched, edges, entry, exit, { graph: true, byId });
  }
  if (isPlainObject(part)) return leaf(part);
  fail('COMPOSE_PART_INVALID', 'unsupported composition part');
  return null;
}

function remapFragment(source, mutate) {
  const mapping = new Map();
  const nodes = source.nodes.map((node) => {
    const copy = { ...node, config: isPlainObject(node.config) ? clone(node.config) : (node.config ?? {}) };
    if (Array.isArray(node.dependsOn)) copy.dependsOn = [...node.dependsOn];
    mapping.set(node, copy);
    return copy;
  });
  const resolve = (ref) => (isPlainObject(ref) ? mapping.get(ref) ?? ref : ref);
  const edges = source.edges.map(([from, to]) => [resolve(from), resolve(to)]);
  const entry = source.entry.map(resolve);
  const exit = source.exit.map(resolve);
  const meta = groupMeta([source], resolve, { ...source.meta });
  delete meta.fallback;
  delete meta.branch;
  const frag = fragment(nodes, edges, entry, exit, meta);
  mutate?.(frag, mapping);
  return frag;
}

function sequence(...parts) {
  const list = parts.length === 1 && Array.isArray(parts[0]) ? parts[0] : parts;
  const fragments = list.map(asFragment);
  if (!fragments.length) return fragment();
  if (fragments.length === 1) return fragments[0];
  const nodes = fragments.flatMap((frag) => frag.nodes);
  const edges = fragments.flatMap((frag) => frag.edges);
  for (let i = 0; i < fragments.length - 1; i++) {
    for (const from of fragments[i].exit) {
      for (const to of fragments[i + 1].entry) edges.push([from, to]);
    }
  }
  return fragment(nodes, edges, fragments[0].entry, fragments[fragments.length - 1].exit, groupMeta(fragments, (ref) => ref, { sequence: fragments.length }));
}

function parallel(...parts) {
  const list = parts.length === 1 && Array.isArray(parts[0]) ? parts[0] : parts;
  const fragments = list.map(asFragment);
  if (!fragments.length) return fragment();
  const nodes = fragments.flatMap((frag) => frag.nodes);
  const edges = fragments.flatMap((frag) => frag.edges);
  const entry = fragments.flatMap((frag) => frag.entry);
  const exit = fragments.flatMap((frag) => frag.exit);
  return fragment(nodes, edges, entry, exit, groupMeta(fragments, (ref) => ref, { parallel: fragments.length }));
}

function branch(condition, whenTrue, whenFalse) {
  const cond = asFragment(condition);
  const yes = asFragment(whenTrue);
  const no = asFragment(whenFalse);
  const nodes = [...cond.nodes, ...yes.nodes, ...no.nodes];
  const edges = [...cond.edges, ...yes.edges, ...no.edges];
  for (const from of cond.exit) {
    for (const to of yes.entry) edges.push([from, to]);
    for (const to of no.entry) edges.push([from, to]);
  }
  const yesNodes = new Set(yes.nodes);
  const noNodes = new Set(no.nodes);
  const marked = nodes.map((node) => {
    if (yesNodes.has(node)) return { ...node, branch: 'yes' };
    if (noNodes.has(node)) return { ...node, branch: 'no' };
    return node;
  });
  const remap = new Map(nodes.map((node, index) => [node, marked[index]]));
  const remappedEdges = edges.map(([from, to]) => [remap.get(from) ?? from, remap.get(to) ?? to]);
  const resolve = (node) => remap.get(node) ?? node;
  const childMeta = groupMeta([cond, yes, no], resolve);
  const branches = [
    ...(childMeta.branches ?? []),
    {
      condition: cond.exit.map(resolve),
      yes: yes.entry.map(resolve),
      no: no.entry.map(resolve),
    },
  ];
  const meta = { ...childMeta, branches };
  if (!meta.fallbacks?.length) delete meta.fallbacks;
  const frag = fragment(
    marked,
    remappedEdges,
    cond.entry.map(resolve),
    [...yes.exit, ...no.exit].map(resolve),
    meta,
  );
  return frag;
}

function map(collection, part, options = {}) {
  const inner = asFragment(part);
  const maxFanOut = Number(options.maxFanOut ?? DEFAULT_MAX_FANOUT);
  let fanOut = null;
  let dynamic = false;
  if (Array.isArray(collection)) {
    fanOut = collection.length;
  } else if (typeof collection === 'number' && Number.isInteger(collection) && collection >= 0) {
    fanOut = collection;
  } else if (isPlainObject(collection)) {
    if (Array.isArray(collection.items)) fanOut = collection.items.length;
    else if (typeof collection.count === 'number') fanOut = collection.count;
    else dynamic = true;
  } else if (collection != null) {
    dynamic = true;
  }
  if (fanOut !== null && fanOut > maxFanOut) {
    fail('MAP_FANOUT_EXCEEDED', `map fan-out ${fanOut} exceeds the bound ${maxFanOut}`, { fanOut, maxFanOut });
  }
  const frag = remapFragment(inner, (f) => {
    for (const node of f.nodes) {
      node.kind = node.kind ?? 'map';
      node.fanOut = fanOut;
      if (dynamic) node.dynamicFanOut = true;
    }
  });
  frag.meta.map = { fanOut, maxFanOut, dynamic };
  return frag;
}

function reduce(collection, part, options = {}) {
  const inner = asFragment(part);
  let fanOut = null;
  if (Array.isArray(collection)) fanOut = collection.length;
  else if (typeof collection === 'number' && Number.isInteger(collection) && collection >= 0) fanOut = collection;
  else if (isPlainObject(collection) && Array.isArray(collection.items)) fanOut = collection.items.length;
  const mode = options.mode === 'tree' ? 'tree' : 'sequential';
  const frag = remapFragment(inner, (f) => {
    for (const node of f.nodes) {
      node.kind = 'reduce';
      node.fanOut = fanOut;
      node.reduceMode = mode;
    }
  });
  frag.meta.reduce = { fanOut, mode };
  return frag;
}

function retry(part, policy = {}) {
  const inner = asFragment(part);
  const normalized = typeof policy === 'number' ? { retries: policy } : (policy ?? {});
  const retries = integer(normalized.retries ?? normalized.maxAttempts, 2);
  if (retries > 20) fail('RETRY_POLICY_INVALID', `retries ${retries} exceeds 20`, { retries });
  const retryPolicy = {
    retries,
    backoff: normalized.backoff ?? 'exponential',
    jitter: normalized.jitter !== false,
    baseMs: integer(normalized.baseMs, 100),
    maxMs: integer(normalized.maxMs, 30000),
  };
  const frag = remapFragment(inner, (f) => {
    for (const node of f.nodes) {
      node.retries = retries;
      node.retry = retryPolicy;
    }
  });
  frag.meta.retry = retryPolicy;
  return frag;
}

function fallback(primary, backup) {
  const first = asFragment(primary);
  const second = asFragment(backup);
  const nodes = [...first.nodes, ...second.nodes];
  const edges = [...first.edges, ...second.edges];
  const marked = nodes.map((node) => (second.nodes.includes(node) ? { ...node, fallbackOf: true } : node));
  const remap = new Map(nodes.map((node, index) => [node, marked[index]]));
  const remappedEdges = edges.map(([from, to]) => [remap.get(from) ?? from, remap.get(to) ?? to]);
  const resolve = (node) => remap.get(node) ?? node;
  const childMeta = groupMeta([first, second], resolve);
  const meta = {
    ...childMeta,
    fallbacks: [
      ...(childMeta.fallbacks ?? []),
      { primaryExit: first.exit.map(resolve), backupEntry: second.entry.map(resolve) },
    ],
  };
  if (!meta.branches?.length) delete meta.branches;
  const frag = fragment(
    marked,
    remappedEdges,
    first.entry.map(resolve),
    second.exit.map(resolve),
    meta,
  );
  return frag;
}

function approval(part, scope = 'owner') {
  const inner = asFragment(part);
  const gate = isPlainObject(scope) ? { ...scope } : { scope: String(scope ?? 'owner') };
  if (!gate.scope) gate.scope = 'owner';
  const frag = remapFragment(inner, (f) => {
    for (const node of f.nodes) node.approval = { required: true, ...gate };
  });
  frag.meta.approval = { required: true, ...gate };
  return frag;
}

function timeout(part, ms) {
  const inner = asFragment(part);
  const value = integer(ms, null);
  if (!value) fail('TIMEOUT_INVALID', 'timeout(part, ms) needs a positive ms value', { ms });
  const frag = remapFragment(inner, (f) => {
    for (const node of f.nodes) {
      node.timeoutMs = node.timeoutMs == null ? value : Math.min(node.timeoutMs, value);
    }
  });
  frag.meta.timeoutMs = value;
  return frag;
}

function optional(part) {
  const inner = asFragment(part);
  const frag = remapFragment(inner, (f) => {
    for (const node of f.nodes) node.optional = true;
  });
  frag.meta.optional = true;
  return frag;
}

function resolveEndpoint(endpoint, bySpec, byId) {
  if (isPlainObject(endpoint)) {
    const id = bySpec.get(endpoint);
    if (!id) fail('COMPOSE_EDGE_UNKNOWN', 'edge points at a node outside this composition');
    return id;
  }
  const text = String(endpoint);
  if (!byId.has(text)) fail('COMPOSE_EDGE_UNKNOWN', `edge points at unknown node id: ${text}`);
  return text;
}

function resolveSpecList(list, bySpec) {
  return (list ?? []).map((item) => {
    if (isPlainObject(item)) {
      const id = bySpec.get(item);
      if (!id) fail('COMPOSE_EDGE_UNKNOWN', 'group references a node outside this composition');
      return id;
    }
    return String(item);
  });
}

export function compose(parts) {
  const frag = asFragment(parts);
  const bySpec = new Map();
  const used = new Set();
  let generated = 0;
  const nodes = frag.nodes.map((spec) => {
    let id = spec.id === undefined || spec.id === null || spec.id === '' ? null : String(spec.id);
    if (!id) {
      do { generated += 1; id = `n${generated}`; } while (used.has(id));
    }
    if (used.has(id)) fail('COMPOSE_NODE_ID_DUPLICATE', `duplicate node id: ${id}`, { id });
    used.add(id);
    bySpec.set(spec, id);
    return { spec, id };
  });
  const byId = new Map(nodes.map((node) => [node.id, node.spec]));

  const incoming = new Map(nodes.map((node) => [node.id, new Set()]));
  const edgeSet = new Set();
  for (const [from, to] of frag.edges) {
    const fromId = resolveEndpoint(from, bySpec, byId);
    const toId = resolveEndpoint(to, bySpec, byId);
    edgeSet.add(`${fromId}\u0000${toId}`);
    incoming.get(toId).add(fromId);
  }
  const edges = [...edgeSet]
    .map((key) => key.split('\u0000'))
    .sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : (a[0] < b[0] ? -1 : 1)));

  const groupSpecs = frag.meta ?? {};
  const rawFallbacks = groupSpecs.fallbacks ?? (groupSpecs.fallback ? [groupSpecs.fallback] : []);
  const rawBranches = groupSpecs.branches ?? (groupSpecs.branch ? [groupSpecs.branch] : []);
  const groups = {};
  if (rawBranches.length) {
    groups.branches = rawBranches.map((item) => ({
      condition: resolveSpecList(item.condition, bySpec),
      yes: resolveSpecList(item.yes, bySpec),
      no: resolveSpecList(item.no, bySpec),
    }));
    groups.branch = groups.branches[0];
  }
  if (rawFallbacks.length) {
    groups.fallbacks = rawFallbacks.map((item) => ({
      primaryExit: resolveSpecList(item.primaryExit, bySpec),
      backupEntry: resolveSpecList(item.backupEntry, bySpec),
    }));
    groups.fallback = groups.fallbacks[0];
  }
  for (const key of ['map', 'reduce', 'retry', 'approval', 'timeout', 'optional', 'parallel', 'sequence']) {
    if (groupSpecs[key] !== undefined) groups[key] = groupSpecs[key];
  }

  const fallbackByNode = new Map();
  for (const pair of groups.fallbacks ?? []) {
    for (const backupId of pair.backupEntry) {
      fallbackByNode.set(backupId, [...pair.primaryExit]);
    }
  }

  const planNodes = nodes.map(({ spec, id }) => {
    const ref = requireRef(spec.component);
    const declared = Array.isArray(spec.dependsOn) ? spec.dependsOn.map(String) : [];
    const dependsOn = uniqueSorted([...incoming.get(id), ...declared]);
    const node = {
      id,
      component: ref.ref,
      componentId: ref.id,
      range: ref.range,
      config: isPlainObject(spec.config) ? clone(spec.config) : {},
      dependsOn,
      optional: spec.optional === true,
      retries: spec.retries ?? null,
      timeoutMs: spec.timeoutMs ?? null,
      kind: spec.kind ?? null,
      approval: spec.approval ?? null,
      retry: spec.retry ?? null,
      fanOut: spec.fanOut ?? null,
      reduceMode: spec.reduceMode ?? null,
      branch: spec.branch ?? null,
      fallbackOf: spec.fallbackOf === true,
      onFailureOf: fallbackByNode.get(id) ?? [],
    };
    return node;
  });

  const entry = resolveSpecList(frag.entry, bySpec);
  const exit = resolveSpecList(frag.exit, bySpec);
  const graph = { schema: GRAPH_SCHEMA, nodes: planNodes, edges, entry, exit, groups };
  graph.digest = digestOf({ schema: GRAPH_SCHEMA, nodes: planNodes, edges, entry, exit, groups });
  return graph;
}

// ---------------------------------------------------------------------------
// graph validation and compilation
// ---------------------------------------------------------------------------

function normalizeNodeList(rawNodes, rawEdges = []) {
  if (!Array.isArray(rawNodes)) fail('GRAPH_INVALID', 'graph nodes must be an array');
  const incoming = new Map();
  const edges = [];
  for (const edge of rawEdges ?? []) {
    const pair = Array.isArray(edge) ? edge : [edge.from, edge.to];
    if (pair.length !== 2) continue;
    const [from, to] = pair.map(String);
    edges.push([from, to]);
    if (!incoming.has(to)) incoming.set(to, []);
    incoming.get(to).push(from);
  }
  const nodes = rawNodes.map((raw, index) => {
    if (!isPlainObject(raw)) fail('GRAPH_INVALID', `node ${index} must be an object`);
    const id = raw.id === undefined || raw.id === null || raw.id === '' ? `n${index + 1}` : String(raw.id);
    const ref = typeof raw.component === 'string' ? raw.component : raw.component;
    const component = typeof ref === 'string' ? ref : (isPlainObject(ref) ? `${ref.id ?? ''}@${ref.range ?? ref.version ?? '*'}` : '');
    const declared = Array.isArray(raw.dependsOn) ? raw.dependsOn.map(String) : [];
    const extra = incoming.get(id) ?? [];
    return {
      id,
      component,
      config: isPlainObject(raw.config) ? clone(raw.config) : {},
      dependsOn: uniqueSorted([...declared, ...extra]),
      optional: raw.optional === true,
      retries: raw.retries ?? null,
      timeoutMs: raw.timeoutMs ?? null,
      kind: raw.kind ?? null,
      approval: raw.approval ?? null,
      retry: raw.retry ?? null,
      fanOut: raw.fanOut ?? null,
      reduceMode: raw.reduceMode ?? null,
      branch: raw.branch ?? null,
      fallbackOf: raw.fallbackOf === true,
      onFailureOf: Array.isArray(raw.onFailureOf) ? raw.onFailureOf.map(String) : [],
      componentDefaults: isPlainObject(raw.componentDefaults) ? raw.componentDefaults : null,
    };
  });
  return { nodes, edges };
}

function normalizeGraph(graph) {
  if (Array.isArray(graph)) graph = { nodes: graph };
  if (!isPlainObject(graph)) fail('GRAPH_INVALID', 'graph must be an object or an array of nodes');
  const { nodes, edges } = normalizeNodeList(graph.nodes, graph.edges ?? []);
  const dependents = new Set();
  for (const node of nodes) for (const dep of node.dependsOn) dependents.add(dep);
  const entry = Array.isArray(graph.entry) && graph.entry.length
    ? graph.entry.map(String)
    : nodes.filter((node) => node.dependsOn.length === 0).map((node) => node.id);
  const exit = Array.isArray(graph.exit) && graph.exit.length
    ? graph.exit.map(String)
    : nodes.filter((node) => !dependents.has(node.id)).map((node) => node.id);
  const pipeline = isPlainObject(graph.pipeline)
    ? { id: graph.pipeline.id ?? null, version: graph.pipeline.version ?? null }
    : (graph.id ? { id: String(graph.id), version: graph.version ? String(graph.version) : null } : null);
  return {
    schema: GRAPH_SCHEMA,
    pipeline,
    nodes,
    edges,
    entry,
    exit,
    groups: isPlainObject(graph.groups) ? graph.groups : {},
    defaults: isPlainObject(graph.defaults) ? graph.defaults : {},
    config: isPlainObject(graph.config) ? graph.config : {},
  };
}

function planOrder(nodes) {
  const deps = new Map(nodes.map((node) => [node.id, new Set(node.dependsOn)]));
  const remaining = new Set(nodes.map((node) => node.id));
  const done = new Set();
  const order = [];
  const levels = [];
  while (remaining.size) {
    const frontier = [...remaining].filter((id) => [...deps.get(id)].every((dep) => done.has(dep))).sort();
    if (!frontier.length) break;
    levels.push(frontier);
    for (const id of frontier) {
      done.add(id);
      remaining.delete(id);
      order.push(id);
    }
  }
  return { order, levels, cycle: [...remaining].sort() };
}

export function validateGraph(graph) {
  const errors = [];
  let normalized;
  try {
    normalized = normalizeGraph(graph);
  } catch (error) {
    return { ok: false, errors: [{ code: 'GRAPH_INVALID', message: error.message }] };
  }
  const nodes = normalized.nodes;
  if (!nodes.length) errors.push({ code: 'NO_NODES', message: 'a pipeline needs at least one node' });
  const seen = new Set();
  for (const node of nodes) {
    if (!node.id) errors.push({ code: 'NODE_ID_REQUIRED', message: 'node id is required' });
    if (seen.has(node.id)) errors.push({ code: 'NODE_DUPLICATE', message: `duplicate node id: ${node.id}`, nodeId: node.id });
    seen.add(node.id);
    if (!node.component) errors.push({ code: 'NODE_COMPONENT_REQUIRED', message: `node ${node.id} has no component`, nodeId: node.id });
    else {
      const ref = tryParseRef(node.component);
      if (!ref.ok) errors.push({ code: 'NODE_COMPONENT_INVALID', message: `node ${node.id}: ${ref.reason}`, nodeId: node.id });
    }
    for (const dep of node.dependsOn) {
      if (dep === node.id) errors.push({ code: 'NODE_SELF_DEPENDENCY', message: `node ${node.id} depends on itself`, nodeId: node.id });
      else if (!nodes.some((candidate) => candidate.id === dep)) {
        errors.push({ code: 'NODE_DEP_UNKNOWN', message: `node ${node.id} depends on unknown node ${dep}`, nodeId: node.id });
      }
    }
    if (node.fanOut !== null && (!Number.isInteger(node.fanOut) || node.fanOut < 0)) {
      errors.push({ code: 'NODE_FANOUT_INVALID', message: `node ${node.id} has an invalid fan-out`, nodeId: node.id });
    }
  }
  const { cycle, order } = planOrder(nodes);
  if (cycle.length) errors.push({ code: 'CYCLE', message: `dependency cycle: ${cycle.join(' -> ')}`, nodes: cycle });
  else if (order.length !== nodes.length) errors.push({ code: 'CYCLE', message: 'dependency graph is not a DAG' });
  return { ok: errors.length === 0, errors };
}

function resolveComponentVersion(db, ref, cache) {
  if (!db) return null;
  if (cache.has(ref.ref)) return cache.get(ref.ref);
  let version = null;
  if (parseVersion(ref.range)) version = ref.range;
  else version = resolveVersion(db, { id: ref.id, range: ref.range, source: 'component' });
  cache.set(ref.ref, version);
  return version;
}

function activationFromDb(db, { pipelineId, scope, scopeRef }) {
  if (!db || !pipelineId) return null;
  const requestedIndex = scope ? SCOPE_SPECIFICITY.indexOf(scope) : SCOPE_SPECIFICITY.length - 1;
  if (requestedIndex < 0) return null;
  for (let i = requestedIndex; i < SCOPE_SPECIFICITY.length; i++) {
    const current = SCOPE_SPECIFICITY[i];
    const ref = current === 'workspace' ? '' : String(scopeRef ?? '');
    if (current !== 'workspace' && !ref) continue;
    const row = stmt(db, 'SELECT scope, scope_ref, pipeline_id, version, config, config_digest, activated_at FROM activations WHERE scope = ? AND scope_ref = ? AND pipeline_id = ?')
      .get(current, ref, pipelineId);
    if (row) {
      return {
        scope: row.scope,
        scopeRef: row.scope_ref,
        pipelineId: row.pipeline_id,
        version: row.version,
        config: jsonValue(row.config, {}),
        configDigest: row.config_digest,
      };
    }
  }
  return null;
}

function overrideForNode(override, nodeId, nodeIds) {
  if (!isPlainObject(override)) return {};
  const map = isPlainObject(override.nodes) ? override.nodes : override;
  const keys = Object.keys(map);
  if (!keys.length) return {};
  const hasStar = isPlainObject(map['*']);
  const hasNodeKey = keys.some((key) => nodeIds.has(key));
  if (!hasStar && !hasNodeKey) return clone(map);
  let out = {};
  if (hasStar) out = mergeConfig(out, map['*']);
  if (isPlainObject(map[nodeId])) out = mergeConfig(out, map[nodeId]);
  return out;
}

function graphPayload(graph) {
  return {
    schema: GRAPH_SCHEMA,
    pipeline: graph.pipeline,
    nodes: graph.nodes,
    edges: graph.edges,
    entry: graph.entry,
    exit: graph.exit,
    groups: graph.groups,
    defaults: graph.defaults,
    config: graph.config,
  };
}

function planDigest(plan) {
  const shape = { ...plan };
  delete shape.digest;
  return digestOf(shape);
}

export function compile(graph, options = {}) {
  const normalized = normalizeGraph(graph);
  const validation = validateGraph(normalized);
  if (!validation.ok) {
    const structural = validation.errors.find((error) => error.code !== 'CYCLE');
    const cycle = validation.errors.find((error) => error.code === 'CYCLE');
    fail(structural ? 'GRAPH_INVALID' : 'PIPELINE_CYCLE', (structural ?? cycle).message, {
      errors: validation.errors,
    });
  }
  const db = options.db ?? null;
  if (db) ready(db);
  const graphDigest = digestOf(graphPayload(normalized));
  const { order, levels } = planOrder(normalized.nodes);

  const activationRow = options.activation
    ? {
      scope: options.activation.scope ?? null,
      scopeRef: options.activation.scopeRef ?? null,
      version: options.activation.version ?? null,
      config: isPlainObject(options.activation.config)
        ? options.activation.config
        : (isPlainObject(options.activation) ? options.activation : {}),
    }
    : activationFromDb(db, {
      pipelineId: normalized.pipeline?.id ?? null,
      scope: options.scope ?? null,
      scopeRef: options.scopeRef ?? null,
    });
  const activationConfig = activationRow?.config ?? {};
  const runConfig = options.run ?? null;

  const pipelineConfig = mergeConfig(
    isPlainObject(normalized.defaults?.config) ? normalized.defaults.config : {},
    normalized.config ?? {},
  );
  const nodeIds = new Set(normalized.nodes.map((node) => node.id));
  const refCache = new Map();
  const componentDefaults = {};
  const nodeConfigs = {};
  const activationConfigs = {};
  const runConfigs = {};

  for (const node of normalized.nodes) {
    const ref = requireRef(node.component);
    const version = resolveComponentVersion(db, ref, refCache);
    let defaults = node.componentDefaults ?? {};
    if (db && version) {
      const row = stmt(db, 'SELECT defaults FROM components WHERE id = ? AND version = ?').get(ref.id, version);
      if (row) defaults = jsonValue(row.defaults, {});
    }
    componentDefaults[node.id] = defaults;
    nodeConfigs[node.id] = node.config ?? {};
    activationConfigs[node.id] = overrideForNode(activationConfig, node.id, nodeIds);
    runConfigs[node.id] = overrideForNode(runConfig, node.id, nodeIds);
  }

  const resolved = {};
  for (const node of normalized.nodes) {
    let config = mergeConfig(componentDefaults[node.id], pipelineConfig);
    config = mergeConfig(config, nodeConfigs[node.id]);
    config = mergeConfig(config, activationConfigs[node.id]);
    config = mergeConfig(config, runConfigs[node.id]);
    resolved[node.id] = config;
  }

  const layers = {
    component: digestOf(componentDefaults),
    pipeline: digestOf(pipelineConfig),
    node: digestOf(nodeConfigs),
    activation: digestOf(activationConfigs),
    run: digestOf(runConfigs),
  };
  const configDigest = digestOf({ resolved, layers });
  const inputs = options.inputs === undefined ? {} : options.inputs;
  const inputDigest = digestOf(inputs ?? {});

  const activationKey = activationRow
    ? `${activationRow.scope ?? ''}:${activationRow.scopeRef ?? ''}:${activationRow.version ?? ''}:${digestOf(activationConfig)}`
    : 'none';
  // The resolved component versions are part of the plan, so they must be part
  // of the cache identity: two databases can share a graph and differ here.
  const resolutionKey = digestOf(Object.fromEntries([...refCache.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))));
  const cacheKey = `${graphDigest}:${configDigest}:${inputDigest}:${activationKey}:${resolutionKey}`;
  if (PLAN_CACHE.has(cacheKey)) return clone(PLAN_CACHE.get(cacheKey));

  const levelOf = new Map();
  levels.forEach((levelNodes, index) => { for (const id of levelNodes) levelOf.set(id, index); });

  const planNodes = normalized.nodes
    .map((node) => {
      const ref = requireRef(node.component);
      const version = resolveComponentVersion(db, ref, refCache);
      return {
        id: node.id,
        component: ref.ref,
        componentId: ref.id,
        range: ref.range,
        componentVersion: version,
        config: nodeConfigs[node.id],
        resolvedConfig: resolved[node.id],
        dependsOn: [...node.dependsOn],
        optional: node.optional === true,
        retries: node.retries ?? null,
        timeoutMs: node.timeoutMs ?? null,
        kind: node.kind ?? null,
        approval: node.approval ?? null,
        retry: node.retry ?? null,
        fanOut: node.fanOut ?? null,
        reduceMode: node.reduceMode ?? null,
        branch: node.branch ?? null,
        fallbackOf: node.fallbackOf === true,
        onFailureOf: [...(node.onFailureOf ?? [])],
        level: levelOf.get(node.id) ?? 0,
      };
    })
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const plan = {
    schema: PLAN_SCHEMA,
    pipeline: normalized.pipeline,
    graphDigest,
    digest: null,
    nodes: planNodes,
    order,
    levels,
    edges: normalized.edges.map(([from, to]) => [from, to]).sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : (a[0] < b[0] ? -1 : 1))),
    entry: normalized.entry,
    exit: normalized.exit,
    groups: normalized.groups,
    activation: activationRow
      ? { scope: activationRow.scope ?? null, scopeRef: activationRow.scopeRef ?? null, version: activationRow.version ?? null }
      : null,
    config: resolved,
    configLayers: { component: componentDefaults, pipeline: pipelineConfig, node: nodeConfigs, activation: activationConfigs, run: runConfigs },
    configDigest,
    inputs,
    inputDigest,
  };
  plan.digest = planDigest(plan);
  if (PLAN_CACHE.size >= MAX_PLAN_CACHE) {
    const oldest = PLAN_CACHE.keys().next().value;
    PLAN_CACHE.delete(oldest);
  }
  PLAN_CACHE.set(cacheKey, plan);
  return clone(plan);
}

// ---------------------------------------------------------------------------
// pipelines: normalize, register, read, list
// ---------------------------------------------------------------------------

function normalizePipeline(input) {
  if (!isPlainObject(input)) fail('PIPELINE_INVALID', 'pipeline must be an object');
  const id = requireId(input.id, 'PIPELINE');
  const version = requireVersion(input.version, 'PIPELINE');
  const parsed = parseVersion(version);
  const status = String(input.status ?? 'active').trim().toLowerCase();
  if (!PIPELINE_STATUSES.includes(status)) fail('PIPELINE_STATUS_INVALID', `unknown pipeline status: ${status}`, { allowed: PIPELINE_STATUSES });
  let parentVersion = input.parentVersion ?? input.parent_version ?? null;
  if (parentVersion != null) parentVersion = requireVersion(parentVersion, 'PIPELINE');
  const { nodes, edges } = normalizeNodeList(input.nodes, input.edges ?? []);
  const validation = validateGraph({ nodes, edges });
  if (!validation.ok) {
    const structural = validation.errors.find((error) => error.code !== 'CYCLE');
    const cycle = validation.errors.find((error) => error.code === 'CYCLE');
    fail(structural ? 'PIPELINE_GRAPH_INVALID' : 'PIPELINE_CYCLE', (structural ?? cycle).message, {
      errors: validation.errors,
    });
  }
  const pipeline = {
    schema: PIPELINE_SCHEMA,
    id,
    version,
    parentVersion,
    title: input.title === undefined ? id : String(input.title),
    description: input.description === undefined ? null : String(input.description),
    trigger: jsonValue(input.trigger, null),
    nodes,
    edges: edges.sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : (a[0] < b[0] ? -1 : 1))),
    defaults: jsonValue(input.defaults, {}),
    config: jsonValue(input.config, {}),
    status,
    changelog: input.changelog === undefined ? null : String(input.changelog),
  };
  pipeline.digest = digestOf(pipeline);
  const contentShape = { ...pipeline };
  delete contentShape.version;
  delete contentShape.digest;
  pipeline.contentDigest = digestOf(contentShape);
  pipeline.versionParts = { major: parsed.major, minor: parsed.minor, patch: parsed.patch };
  pipeline.createdAt = input.createdAt === undefined ? nowISO() : String(input.createdAt);
  pipeline.createdBy = input.createdBy === undefined ? null : String(input.createdBy);
  return pipeline;
}

function pipelineFromRow(row) {
  if (!row) return null;
  return {
    schema: PIPELINE_SCHEMA,
    id: row.id,
    version: row.version,
    parentVersion: row.parent_version ?? null,
    title: row.title,
    description: row.description,
    trigger: jsonValue(row.trigger, null),
    nodes: jsonValue(row.nodes, []),
    edges: jsonValue(row.edges, []),
    defaults: jsonValue(row.defaults, {}),
    config: jsonValue(row.config, {}),
    status: row.status,
    digest: row.digest,
    contentDigest: row.content_digest,
    changelog: row.changelog,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

const INSERT_PIPELINE = `
INSERT INTO pipelines(
  id, version, parent_version, title, description, trigger, nodes, edges, defaults,
  config, status, digest, content_digest, changelog, version_major, version_minor,
  version_patch, version_key, created_at, created_by
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

export function registerPipeline(db, pipeline, options = {}) {
  ready(db);
  const normalized = normalizePipeline(pipeline);
  const allowDuplicateDigest = options.allowDuplicateDigest === true;
  const existing = stmt(db, 'SELECT digest FROM pipelines WHERE id = ? AND version = ?')
    .get(normalized.id, normalized.version);
  if (existing) {
    fail('PIPELINE_VERSION_EXISTS', `${normalized.id}@${normalized.version} is published and immutable`, {
      id: normalized.id, version: normalized.version, digest: existing.digest,
    });
  }
  const duplicate = stmt(db, 'SELECT version FROM pipelines WHERE id = ? AND content_digest = ? LIMIT 1')
    .get(normalized.id, normalized.contentDigest);
  if (duplicate && !allowDuplicateDigest) {
    fail('PIPELINE_DUPLICATE_DIGEST', `pipeline ${normalized.id}@${normalized.version} is identical to ${duplicate.version}`, {
      duplicateOf: duplicate.version,
    });
  }
  if (normalized.parentVersion) {
    const parent = stmt(db, 'SELECT version FROM pipelines WHERE id = ? AND version = ?')
      .get(normalized.id, normalized.parentVersion);
    if (!parent) {
      fail('PIPELINE_PARENT_NOT_FOUND', `parent version ${normalized.parentVersion} does not exist`, {
        parentVersion: normalized.parentVersion,
      });
    }
  }
  if (options.strict === true) {
    for (const node of normalized.nodes) {
      const ref = requireRef(node.component);
      const found = resolveVersion(db, { id: ref.id, range: ref.range, source: 'component' });
      if (!found) {
        fail('PIPELINE_COMPONENT_NOT_FOUND', `node ${node.id} references unregistered component ${ref.ref}`, {
          nodeId: node.id, ref: ref.ref,
        });
      }
    }
  }

  const parts = normalized.versionParts;
  stmt(db, INSERT_PIPELINE).run(
    normalized.id, normalized.version, normalized.parentVersion, normalized.title, normalized.description,
    jsonText(normalized.trigger), jsonText(normalized.nodes), jsonText(normalized.edges),
    jsonText(normalized.defaults), jsonText(normalized.config), normalized.status,
    normalized.digest, normalized.contentDigest, normalized.changelog,
    parts.major, parts.minor, parts.patch, versionKey(parts), normalized.createdAt, normalized.createdBy,
  );
  stmt(db, `
    INSERT INTO pipelines_fts(rowid, id, version, title, description)
    VALUES ((SELECT rowid FROM pipelines WHERE id = ? AND version = ?), ?, ?, ?, ?)
  `).run(
    normalized.id, normalized.version,
    normalized.id, normalized.version, normalized.title ?? '', normalized.description ?? '',
  );
  return {
    id: normalized.id,
    version: normalized.version,
    digest: normalized.digest,
    contentDigest: normalized.contentDigest,
    created: true,
  };
}

export function getPipeline(db, { id, version = null } = {}) {
  ready(db);
  const pipelineId = requireId(id, 'PIPELINE');
  let resolved = version;
  if (!resolved || resolved === '*' || !parseVersion(resolved)) {
    resolved = resolveVersion(db, { id: pipelineId, range: resolved || '*', source: 'pipeline' });
  }
  if (!resolved) return null;
  const row = stmt(db, 'SELECT * FROM pipelines WHERE id = ? AND version = ?').get(pipelineId, resolved);
  return pipelineFromRow(row);
}

export function listPipelines(db, options = {}) {
  ready(db);
  const limit = clamp(Number(options.limit ?? DEFAULT_LIMIT) || DEFAULT_LIMIT, 1, MAX_LIMIT);
  const where = [];
  const params = [];
  if (options.status) { where.push('c.status = ?'); params.push(String(options.status).toLowerCase()); }
  if (options.id) { where.push('c.id = ?'); params.push(requireId(options.id, 'PIPELINE')); }
  applyCursor(where, params, options.cursor);
  const rows = runFtsSelect(db, {
    table: 'pipelines',
    ftsTable: 'pipelines_fts',
    select: '*',
    where,
    params,
    order: 'c.id ASC, c.version_key DESC, c.version ASC',
    limit: limit + 1,
    query: options.query,
  }).map(pipelineFromRow);
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const out = decorateList(page, limit);
  Object.defineProperty(out, 'nextCursor', {
    value: hasMore && page.length ? `${page[page.length - 1].id}@${page[page.length - 1].version}` : null,
    enumerable: false,
  });
  return out;
}

// ---------------------------------------------------------------------------
// activation, rollback, fork, diff, replay
// ---------------------------------------------------------------------------

function normalizeScope(scope, scopeRef) {
  const value = String(scope ?? 'workspace').trim().toLowerCase();
  if (!SCOPE_SPECIFICITY.includes(value)) {
    fail('ACTIVATION_SCOPE_INVALID', `unknown activation scope: ${scope}`, { allowed: ['workspace', 'project', 'session'] });
  }
  if (value === 'workspace') return { scope: value, scopeRef: '' };
  const ref = String(scopeRef ?? '').trim();
  if (!ref) fail('ACTIVATION_SCOPE_REF_REQUIRED', `scope "${value}" needs a scopeRef`);
  return { scope: value, scopeRef: ref };
}

function resolvePipelineVersion(db, pipelineId, version) {
  if (!version) fail('ACTIVATION_VERSION_REQUIRED', 'activation needs a pipeline version');
  if (parseVersion(version)) return String(version);
  const resolved = resolveVersion(db, { id: pipelineId, range: version, source: 'pipeline' });
  if (!resolved) fail('ACTIVATION_VERSION_NOT_FOUND', `no pipeline ${pipelineId} matches ${version}`, { range: version });
  return resolved;
}

function writeActivation(db, { scope, scopeRef, pipelineId, version, config, actor, action }) {
  const pipeline = stmt(db, 'SELECT version FROM pipelines WHERE id = ? AND version = ?').get(pipelineId, version);
  if (!pipeline) {
    const available = stmt(db, 'SELECT version FROM pipelines WHERE id = ?').all(pipelineId).map((row) => row.version);
    fail('ACTIVATION_VERSION_NOT_FOUND', `pipeline ${pipelineId}@${version} does not exist`, { pipelineId, version, available });
  }
  const configValue = isPlainObject(config) ? config : {};
  const configDigest = digestOf(configValue);
  const activatedAt = nowISO();
  const previous = stmt(db, 'SELECT version FROM activations WHERE scope = ? AND scope_ref = ? AND pipeline_id = ?')
    .get(scope, scopeRef, pipelineId);
  stmt(db, `
    INSERT INTO activations(scope, scope_ref, pipeline_id, version, config, config_digest, activated_at, activated_by, previous_version)
    VALUES (?,?,?,?,?,?,?,?,?)
    ON CONFLICT(scope, scope_ref, pipeline_id) DO UPDATE SET
      version = excluded.version,
      config = excluded.config,
      config_digest = excluded.config_digest,
      activated_at = excluded.activated_at,
      activated_by = excluded.activated_by,
      previous_version = activations.version
  `).run(scope, scopeRef, pipelineId, version, jsonText(configValue), configDigest, activatedAt, actor ?? null, previous?.version ?? null);
  stmt(db, `
    INSERT INTO activation_log(scope, scope_ref, pipeline_id, action, from_version, to_version, config_digest, at, actor)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(scope, scopeRef, pipelineId, action, previous?.version ?? null, version, configDigest, activatedAt, actor ?? null);
  return {
    schema: ACTIVATION_SCHEMA,
    scope,
    scopeRef,
    pipelineId,
    version,
    config: configValue,
    configDigest,
    activatedAt,
    activatedBy: actor ?? null,
    previousVersion: previous?.version ?? null,
  };
}

export function activate(db, { scope = 'workspace', scopeRef = null, pipelineId, version, config = {}, actor = null } = {}) {
  ready(db);
  const pipeline = requireId(pipelineId, 'PIPELINE');
  const target = normalizeScope(scope, scopeRef);
  const resolvedVersion = resolvePipelineVersion(db, pipeline, version);
  return writeActivation(db, { ...target, pipelineId: pipeline, version: resolvedVersion, config, actor, action: 'activate' });
}

export function rollback(db, { scope = 'workspace', scopeRef = null, pipelineId, toVersion, actor = null } = {}) {
  ready(db);
  const pipeline = requireId(pipelineId, 'PIPELINE');
  const target = normalizeScope(scope, scopeRef);
  const current = stmt(db, 'SELECT version, config FROM activations WHERE scope = ? AND scope_ref = ? AND pipeline_id = ?')
    .get(target.scope, target.scopeRef, pipeline);
  if (!current) {
    fail('ACTIVATION_NOT_FOUND', `no activation for ${pipeline} at ${target.scope}${target.scopeRef ? `:${target.scopeRef}` : ''}`);
  }
  const resolvedVersion = resolvePipelineVersion(db, pipeline, toVersion);
  const activation = writeActivation(db, {
    ...target,
    pipelineId: pipeline,
    version: resolvedVersion,
    config: jsonValue(current.config, {}),
    actor,
    action: 'rollback',
  });
  return { ...activation, action: 'rollback', previousVersion: current.version, rolledBackFrom: current.version };
}

export function forkPipeline(db, { id, fromVersion, newVersion = null, actor = null } = {}) {
  ready(db);
  const pipelineId = requireId(id, 'PIPELINE');
  const source = getPipeline(db, { id: pipelineId, version: fromVersion });
  if (!source) fail('PIPELINE_NOT_FOUND', `pipeline ${pipelineId}@${fromVersion ?? '*'} does not exist`);
  const from = parseVersion(source.version);
  const targetVersion = newVersion ? requireVersion(newVersion, 'PIPELINE') : `${from.major}.${from.minor + 1}.0`;
  if (targetVersion === source.version) {
    fail('PIPELINE_VERSION_EXISTS', `fork target equals the source version ${source.version}`, { version: targetVersion });
  }
  const exists = stmt(db, 'SELECT version FROM pipelines WHERE id = ? AND version = ?').get(pipelineId, targetVersion);
  if (exists) fail('PIPELINE_VERSION_EXISTS', `${pipelineId}@${targetVersion} already exists`, { version: targetVersion });
  const forked = {
    schema: PIPELINE_SCHEMA,
    id: pipelineId,
    version: targetVersion,
    parentVersion: source.version,
    title: source.title,
    description: source.description,
    trigger: source.trigger,
    nodes: source.nodes,
    edges: source.edges,
    defaults: source.defaults,
    config: source.config,
    status: 'draft',
    changelog: `Forked from ${source.version}`,
    createdBy: actor ?? null,
  };
  registerPipeline(db, forked, { allowDuplicateDigest: true });
  return getPipeline(db, { id: pipelineId, version: targetVersion });
}

export function diffPipeline(db, { id, a, b } = {}) {
  ready(db);
  const pipelineId = requireId(id, 'PIPELINE');
  const before = getPipeline(db, { id: pipelineId, version: a });
  if (!before) fail('PIPELINE_NOT_FOUND', `pipeline ${pipelineId}@${a ?? '*'} does not exist`, { version: a });
  const after = getPipeline(db, { id: pipelineId, version: b });
  if (!after) fail('PIPELINE_NOT_FOUND', `pipeline ${pipelineId}@${b ?? '*'} does not exist`, { version: b });

  const beforeNodes = new Map((before.nodes ?? []).map((node) => [node.id, node]));
  const afterNodes = new Map((after.nodes ?? []).map((node) => [node.id, node]));
  const added = [...afterNodes.keys()].filter((nodeId) => !beforeNodes.has(nodeId)).sort();
  const removed = [...beforeNodes.keys()].filter((nodeId) => !afterNodes.has(nodeId)).sort();
  const changed = [];
  for (const nodeId of [...beforeNodes.keys()].filter((nodeId) => afterNodes.has(nodeId)).sort()) {
    const left = beforeNodes.get(nodeId);
    const right = afterNodes.get(nodeId);
    const fields = [];
    if (!sameJson(left.component, right.component)) fields.push('component');
    if (!sameJson(left.config, right.config)) fields.push('config');
    if (!sameJson(left.dependsOn, right.dependsOn)) fields.push('dependsOn');
    if (left.optional !== right.optional) fields.push('optional');
    if (left.retries !== right.retries) fields.push('retries');
    if (left.timeoutMs !== right.timeoutMs) fields.push('timeoutMs');
    if (fields.length) changed.push({ id: nodeId, fields });
  }

  const flattenConfig = (pipeline) => {
    const defaults = isPlainObject(pipeline.defaults?.config) ? pipeline.defaults.config : {};
    return { ...defaults, ...(isPlainObject(pipeline.config) ? pipeline.config : {}) };
  };
  const leftConfig = flattenConfig(before);
  const rightConfig = flattenConfig(after);
  const configAdded = Object.keys(rightConfig).filter((key) => !(key in leftConfig)).sort();
  const configRemoved = Object.keys(leftConfig).filter((key) => !(key in rightConfig)).sort();
  const configChanged = Object.keys(leftConfig)
    .filter((key) => key in rightConfig && !sameJson(leftConfig[key], rightConfig[key]))
    .sort()
    .map((key) => ({ key, from: leftConfig[key], to: rightConfig[key] }));

  const componentChanges = [];
  for (const nodeId of [...beforeNodes.keys()].filter((nodeId) => afterNodes.has(nodeId)).sort()) {
    const left = beforeNodes.get(nodeId)?.component ?? null;
    const right = afterNodes.get(nodeId)?.component ?? null;
    if (!sameJson(left, right)) componentChanges.push({ node: nodeId, from: left, to: right });
  }

  return {
    id: pipelineId,
    from: before.version,
    to: after.version,
    identical: before.digest === after.digest,
    nodes: { added, removed, changed },
    config: { added: configAdded, removed: configRemoved, changed: configChanged },
    components: {
      added: added.map((nodeId) => ({ node: nodeId, ref: afterNodes.get(nodeId).component })),
      removed: removed.map((nodeId) => ({ node: nodeId, ref: beforeNodes.get(nodeId).component })),
      changed: componentChanges,
    },
  };
}

function runFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    pipelineId: row.pipeline_id,
    pipelineVersion: row.pipeline_version,
    pipelineDigest: row.pipeline_digest ?? null,
    planDigest: row.plan_digest ?? null,
    config: jsonValue(row.config, {}),
    configDigest: row.config_digest ?? null,
    inputDigest: row.input_digest ?? null,
    outputDigest: row.output_digest ?? null,
    componentVersions: jsonValue(row.component_versions, {}),
    inputs: jsonValue(row.inputs, {}),
    status: row.status,
    scope: row.scope ?? null,
    scopeRef: row.scope_ref ?? null,
    startedAt: row.started_at ?? null,
    finishedAt: row.finished_at ?? null,
    error: row.error ?? null,
  };
}

function recordReplayRun(db, run, plan, mode) {
  const id = `run_${digestOf({ replayOf: run.id ?? null, planDigest: plan.digest }).slice(0, 24)}`;
  const exists = stmt(db, 'SELECT id FROM pipeline_runs WHERE id = ?').get(id);
  if (!exists) {
    stmt(db, `
      INSERT INTO pipeline_runs(
        id, pipeline_id, pipeline_version, pipeline_digest, plan_digest, config, config_digest,
        input_digest, output_digest, component_versions, inputs, status, scope, scope_ref,
        started_at, finished_at, error
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      id, plan.pipeline?.id ?? run.pipelineId, plan.pipeline?.version ?? run.pipelineVersion,
      run.pipelineDigest ?? null, plan.digest, jsonText(plan.configLayers?.activation ?? {}),
      plan.configDigest, plan.inputDigest, run.outputDigest ?? null,
      jsonText(Object.fromEntries(plan.nodes.map((node) => [node.id, node.componentVersion]))),
      jsonText(plan.inputs), `replay:${mode}`, run.scope ?? null, run.scopeRef ?? null,
      nowISO(), nowISO(), null,
    );
  }
  return id;
}

export function replayPlan(db, { runId = null, version = null, live = false, inputs = null, run = null, record = false } = {}) {
  ready(db);
  const recorded = run && isPlainObject(run)
    ? runFromRow({
      id: run.id ?? null,
      pipeline_id: run.pipelineId ?? null,
      pipeline_version: run.pipelineVersion ?? version,
      pipeline_digest: run.pipelineDigest ?? null,
      plan_digest: run.planDigest ?? null,
      config: jsonText(run.config ?? {}),
      config_digest: run.configDigest ?? null,
      input_digest: run.inputDigest ?? null,
      output_digest: run.outputDigest ?? null,
      component_versions: jsonText(run.componentVersions ?? {}),
      inputs: jsonText(run.inputs ?? {}),
      status: run.status ?? 'succeeded',
      scope: run.scope ?? null,
      scope_ref: run.scopeRef ?? null,
      started_at: run.startedAt ?? null,
      finished_at: run.finishedAt ?? null,
      error: run.error ?? null,
    })
    : (runId ? runFromRow(stmt(db, 'SELECT * FROM pipeline_runs WHERE id = ?').get(String(runId))) : null);

  if (!recorded && !version) {
    fail('REPLAY_RUN_NOT_FOUND', `no recorded run ${runId ?? '(missing)'}`, { runId });
  }
  if (!recorded && !runId) {
    fail('REPLAY_RUN_NOT_FOUND', 'replayPlan needs a runId, an inline run, or an explicit pipeline version', {});
  }

  const pipelineId = recorded?.pipelineId ?? null;
  if (!pipelineId) fail('REPLAY_RUN_NOT_FOUND', 'the recorded run has no pipeline id', { runId });
  const targetVersion = version
    ? resolvePipelineVersion(db, pipelineId, version)
    : recorded.pipelineVersion;
  const pipeline = getPipeline(db, { id: pipelineId, version: targetVersion });
  if (!pipeline) {
    fail('REPLAY_PIPELINE_NOT_FOUND', `pipeline ${pipelineId}@${targetVersion} is missing from the registry`, {
      pipelineId, version: targetVersion,
    });
  }

  const componentVersions = recorded?.componentVersions ?? {};
  const nodeIds = new Set((pipeline.nodes ?? []).map((node) => node.id));
  const graphNodes = (pipeline.nodes ?? []).map((node) => {
    if (live) return node;
    const pinned = componentVersions[node.id];
    if (!pinned) return node;
    const ref = tryParseRef(node.component);
    if (!ref.ok) return node;
    return { ...node, component: `${ref.id}@${pinned}` };
  });

  const plan = compile(
    { ...pipeline, nodes: graphNodes },
    {
      db,
      activation: recorded?.config ?? {},
      inputs: live ? (inputs ?? {}) : (recorded?.inputs ?? {}),
      scope: recorded?.scope ?? undefined,
      scopeRef: recorded?.scopeRef ?? undefined,
    },
  );

  const resolvedVersions = Object.fromEntries(
    plan.nodes.map((node) => [node.id, node.componentVersion ?? componentVersions[node.id] ?? null]),
  );
  plan.replay = {
    mode: live ? 'live' : 'historical',
    runId: recorded?.id ?? null,
    pipelineId,
    pipelineVersion: targetVersion,
    recordedVersion: recorded?.pipelineVersion ?? null,
    recordedAt: recorded?.startedAt ?? null,
    status: recorded?.status ?? null,
    configDigest: plan.configDigest,
    recordedConfigDigest: recorded?.configDigest ?? null,
    inputDigest: plan.inputDigest,
    recordedInputDigest: recorded?.inputDigest ?? null,
    inputs: plan.inputs,
    componentVersions: resolvedVersions,
    pinned: live ? null : componentVersions,
    unresolved: Object.entries(resolvedVersions).filter(([, value]) => !value).map(([nodeId]) => nodeId).sort(),
  };
  plan.digest = planDigest(plan);
  if (record) plan.replay.recordedRunId = recordReplayRun(db, recorded, plan, plan.replay.mode);
  return plan;
}

// Composition helpers live on compose() so the module keeps exactly the
// documented export surface. Usage: compose(compose.sequence(a, b)).
compose.sequence = sequence;
compose.parallel = parallel;
compose.branch = branch;
compose.map = map;
compose.reduce = reduce;
compose.retry = retry;
compose.fallback = fallback;
compose.approval = approval;
compose.timeout = timeout;
compose.optional = optional;
Object.defineProperty(compose, 'helpers', {
  value: Object.freeze({ sequence, parallel, branch, map, reduce, retry, fallback, approval, timeout, optional }),
  enumerable: false,
});

/**
 * @hq:context Bind the VIVIM KB type registry to HQ's semantic vocabulary:
 *   KB ids become namespaced extension entries, canonical HQ ids are only
 *   verified, and an explicit unbound list keeps personal or authority data out.
 * @hq:owner hq
 * @hq:task kb-binding-v1
 * @hq:invariant The KB owns the domain model. Binding never renames a KB id and
 *   never creates a canonical HQ id; it maps each KB type to one HQ target.
 * @hq:invariant Every KB id appears exactly once. Extension targets are
 *   `hq.ext.<lowercase-kb-id>`; an unbound entry carries a reason and writes nothing.
 * @hq:invariant A canonical row is never overwritten, promoted or created here.
 *   A collision is reported as a conflict and leaves the row untouched.
 * @hq:invariant Rows land `provisional` with `authority: project_observed`.
 *   Promotion stays an explicit owner action in the CANON register.
 * @hq:invariant No network, no timers, no secret material. Idempotent by target id.
 * @hq:see docs/KB-BINDING-MAP.md
 * @hq:see docs/AGENTIC-RULEBOOK.md
 * @hq:see hq/lib/semantic-registry.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { nowISO } from './util.mjs';

export const KB_BINDING_SCHEMA = 'hq.kb-binding/1';
export const KB_BINDING_VERSION = 1;
export const KB_BINDING_REL_PATH = 'hq/registry/kb-binding.v1.json';
export const CANONICAL_TAXONOMY_REL_PATH = 'hq/registry/canonical-taxonomy.v1.json';
export const EXTENSION_PREFIX = 'hq.ext.';
export const BINDING_STATUS = 'provisional';
export const BINDING_AUTHORITY = 'project_observed';
export const BINDING_KIND = 'extension';

export const TARGET_KINDS = Object.freeze(['canonical', 'extension', 'unbound']);

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(MODULE_DIR, '..', '..');

const str = (value) => String(value ?? '').trim();
const cmpStr = (a, b) => (a === b ? 0 : a < b ? -1 : 1);

/** Absolute path of a repo-relative file, tolerating an already-absolute path. */
function repoPath(value) {
  const path = str(value);
  return isAbsolute(path) ? path : join(REPO_ROOT, path);
}

/** Extension target for one KB id: `hq.ext.<lowercase-kb-id>`. */
export function extensionTarget(kbId) {
  return `${EXTENSION_PREFIX}${str(kbId).toLowerCase()}`;
}

// ---------------------------------------------------------------------------
// canonical vocabulary (declared ids only; never invented here)
// ---------------------------------------------------------------------------

/**
 * Canonical ids HQ already declares in `hq/registry/canonical-taxonomy.v1.json`
 * (id grammars plus contract schema ids). An extension may never collide with one.
 */
export function loadCanonicalIds(options = {}) {
  const path = options.root
    ? join(repoPath(options.root), CANONICAL_TAXONOMY_REL_PATH)
    : repoPath(options.canonicalPath ?? CANONICAL_TAXONOMY_REL_PATH);
  try {
    const doc = JSON.parse(readFileSync(path, 'utf8'));
    const ids = new Set();
    for (const entry of Array.isArray(doc.idGrammar) ? doc.idGrammar : []) {
      if (str(entry?.id)) ids.add(str(entry.id));
    }
    for (const entry of Array.isArray(doc.schemaIds) ? doc.schemaIds : []) {
      if (str(entry?.id)) ids.add(str(entry.id));
    }
    return ids;
  } catch {
    return new Set();
  }
}

// ---------------------------------------------------------------------------
// binding document
// ---------------------------------------------------------------------------

/** Structural validation. Returns an array of `path: reason` strings. */
export function validateKbBinding(binding) {
  const errors = [];
  if (!binding || typeof binding !== 'object' || Array.isArray(binding)) {
    return ['binding: not an object'];
  }
  if (binding.schema !== KB_BINDING_SCHEMA) {
    errors.push(`schema: expected ${KB_BINDING_SCHEMA}`);
  }
  if (binding.version !== KB_BINDING_VERSION) {
    errors.push(`version: expected ${KB_BINDING_VERSION}`);
  }
  const generated = binding.generatedFrom;
  if (!generated || typeof generated !== 'object') {
    errors.push('generatedFrom: missing');
  } else {
    if (!str(generated.path)) errors.push('generatedFrom.path: missing');
    if (!/^[0-9a-f]{64}$/.test(str(generated.sha256))) errors.push('generatedFrom.sha256: expected 64 lowercase hex');
  }
  if (!Array.isArray(binding.bindings)) return [...errors, 'bindings: expected an array'];

  const seen = new Set();
  for (const [index, entry] of binding.bindings.entries()) {
    const at = `bindings[${index}]`;
    if (!entry || typeof entry !== 'object') { errors.push(`${at}: not an object`); continue; }
    const kbId = str(entry.kbId);
    if (!/^KB-[A-Z0-9-]+$/.test(kbId)) errors.push(`${at}.kbId: expected KB-<UPPER>`);
    if (seen.has(kbId)) errors.push(`${at}.kbId: duplicate ${kbId}`);
    seen.add(kbId);
    if (!str(entry.title)) errors.push(`${at}.title: missing`);
    if (!TARGET_KINDS.includes(entry.targetKind)) errors.push(`${at}.targetKind: invalid`);
    if (!str(entry.family)) errors.push(`${at}.family: missing`);
    if (!str(entry.reason)) errors.push(`${at}.reason: missing`);
    const target = str(entry.target);
    if (!target) errors.push(`${at}.target: missing`);
    if (entry.targetKind === 'extension' && target !== extensionTarget(kbId)) {
      errors.push(`${at}.target: extension target must be ${extensionTarget(kbId)}`);
    }
    if (entry.targetKind === 'canonical' && target.startsWith(EXTENSION_PREFIX)) {
      errors.push(`${at}.target: canonical target must not use ${EXTENSION_PREFIX}`);
    }
  }
  return errors;
}

/**
 * Load and validate the binding document. Never throws on a bad file: a refusal
 * is returned so the caller can report it without an index write.
 */
export function loadKbBinding(options = {}) {
  const path = repoPath(options.path ?? KB_BINDING_REL_PATH);
  let doc;
  try {
    doc = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    return { ok: false, path, binding: null, errors: [`read: ${error instanceof Error ? error.message : String(error)}`] };
  }
  const errors = validateKbBinding(doc);
  if (errors.length) return { ok: false, path, binding: null, errors };
  doc.bindings = [...doc.bindings].sort((a, b) => cmpStr(a.kbId, b.kbId));
  return { ok: true, path, binding: doc, errors: [] };
}

/** Counts by target kind. Unbound rows are counted but never written. */
export function bindingCounts(binding) {
  const counts = { total: 0, canonical: 0, extension: 0, unbound: 0 };
  for (const entry of Array.isArray(binding?.bindings) ? binding.bindings : []) {
    counts.total += 1;
    if (entry?.targetKind in counts) counts[entry.targetKind] += 1;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// binding
// ---------------------------------------------------------------------------

function findRow(db, id) {
  try { return db.prepare('SELECT * FROM semantic_id WHERE id = ?').get(id) ?? null; } catch { return null; }
}

function conflict(kbId, target, reason, detail) {
  return { kbId, target, reason, detail: detail ?? null };
}

/**
 * Bind every KB type once.
 *
 * - `extension`: insert `kind: extension`, `name: <kb id>`, `version: 1`,
 *   `status: provisional`, `authority: project_observed`, `provenance: family`.
 *   An identical row is idempotent; any other row under the same id is a
 *   conflict and is not mutated.
 * - `canonical`: verify only. The id must exist as a declared canonical id or
 *   as a non-extension `semantic_id` row; this function never creates one.
 *   A non-`current` row needs `ownerConfirmed` before it counts as existing.
 * - `unbound`: nothing is written and nothing is counted as existing.
 */
export function bindKbTypes(db, binding, options = {}) {
  const result = { inserted: 0, existing: 0, conflicts: [] };
  if (!db || typeof db.prepare !== 'function') {
    result.conflicts.push(conflict(null, null, 'unavailable', 'no database'));
    return result;
  }
  const errors = validateKbBinding(binding);
  if (errors.length) {
    result.conflicts.push(conflict(null, null, 'invalid_binding', errors.join('; ')));
    return result;
  }

  const ownerConfirmed = options.ownerConfirmed === true;
  let canonicalIds = options.canonicalIds;
  if (!(canonicalIds instanceof Set)) canonicalIds = loadCanonicalIds(options);

  const rows = [...binding.bindings].sort((a, b) => cmpStr(a.kbId, b.kbId));
  for (const entry of rows) {
    const kbId = str(entry.kbId);
    const target = str(entry.target);

    if (entry.targetKind === 'unbound') continue;

    const existing = findRow(db, target);

    if (entry.targetKind === 'canonical') {
      if (existing && existing.kind === BINDING_KIND) {
        result.conflicts.push(conflict(kbId, target, 'id_collision', `existing ${existing.kind}/${existing.name}`));
        continue;
      }
      if (existing) {
        if (existing.status === 'current' || ownerConfirmed) result.existing += 1;
        else result.conflicts.push(conflict(kbId, target, 'canonical_not_current', `status ${existing.status}`));
        continue;
      }
      if (canonicalIds.has(target)) { result.existing += 1; continue; }
      result.conflicts.push(conflict(kbId, target, 'canonical_target_missing', 'not declared by the canonical taxonomy'));
      continue;
    }

    // extension
    if (existing) {
      if (existing.kind === BINDING_KIND && existing.name === kbId) { result.existing += 1; continue; }
      result.conflicts.push(conflict(kbId, target, 'id_collision', `existing ${existing.kind}/${existing.name}`));
      continue;
    }

    try {
      db.prepare(
        `INSERT INTO semantic_id(id, kind, name, version, label, description, status, authority, provenance, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        target, BINDING_KIND, kbId, '1', str(entry.title), str(entry.reason),
        BINDING_STATUS, BINDING_AUTHORITY, str(entry.family), nowISO(),
      );
      result.inserted += 1;
    } catch (error) {
      result.conflicts.push(conflict(kbId, target, 'write_failed', error instanceof Error ? error.message : String(error)));
    }
  }
  return result;
}

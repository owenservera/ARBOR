/**
 * @hq:context Loader and validator for the canonical taxonomy (hq.canonical-taxonomy/1).
 * @hq:owner hq
 * @hq:task lane-taxonomy
 * @hq:why One vocabulary has to be resolvable from every surface; a glossary of
 *   whatever the code happens to do cannot be checked, only read.
 * @hq:invariant Read-only and pure: the loader never writes and never mutates the
 *   cached registry. Callers receive copies.
 * @hq:invariant A missing or malformed registry file throws an error naming the
 *   expected path.
 * @hq:invariant The digest is computed over the payload minus the digest field,
 *   so the same taxonomy always produces the same digest.
 * @hq:see docs/CANONICAL-TAXONOMY.md
 * @hq:see hq/registry/canonical-taxonomy.v1.json
 * @hq:see docs/AGENTIC-RULEBOOK.md
 */
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalJson, sha256 } from './util.mjs';

export const TAXONOMY_SCHEMA = 'hq.canonical-taxonomy/1';

const REGISTRY_PATH = 'hq/registry/canonical-taxonomy.v1.json';
const DEFAULT_FILE = fileURLToPath(new URL('../registry/canonical-taxonomy.v1.json', import.meta.url));

// The 15 sections of the taxonomy. Order is the order the contract lists them.
const REQUIRED_SECTIONS = [
  'layers', 'entities', 'idGrammar', 'authority', 'lifecycle', 'statuses',
  'effects', 'scopes', 'trust', 'families', 'vocabulary', 'nonEquivalences',
  'schemaIds', 'naming', 'extension',
];

// The document authority labels the rule book pins. The decision vocabulary
// (owner, architecture, ...) lives in the same section under a different
// `vocabulary` value and is never conflated with this list.
const REQUIRED_AUTHORITY_LABELS = [
  'vendor_documented', 'project_observed', 'local_custom', 'proposed', 'historical',
];

const cache = new Map();

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function resolveFile(filePath) {
  if (filePath == null || String(filePath).trim() === '') return DEFAULT_FILE;
  const raw = String(filePath);
  if (isAbsolute(raw)) return raw;
  return resolve(process.cwd(), raw);
}

/**
 * loadTaxonomy — read and cache the canonical taxonomy registry.
 *
 * @param {{path?: string|null}} options explicit registry path; defaults to
 *   hq/registry/canonical-taxonomy.v1.json next to this module.
 * @returns {object} the parsed taxonomy
 */
export function loadTaxonomy({ path: filePath = null } = {}) {
  const file = resolveFile(filePath);
  if (cache.has(file)) return cache.get(file);
  if (!existsSync(file)) {
    throw new Error(
      `hq taxonomy: registry file not found: ${file} (expected path: ${REGISTRY_PATH})`,
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(
      `hq taxonomy: invalid registry JSON at ${file}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  cache.set(file, parsed);
  return parsed;
}

loadTaxonomy.REGISTRY_PATH = REGISTRY_PATH;
loadTaxonomy.DEFAULT_FILE = DEFAULT_FILE;

/**
 * taxonomyDigest — sha256 over the canonical payload without the digest field.
 *
 * @param {object} taxonomy
 * @returns {string} hex digest
 */
export function taxonomyDigest(taxonomy) {
  const payload = taxonomy && typeof taxonomy === 'object' && !Array.isArray(taxonomy)
    ? { ...taxonomy }
    : {};
  delete payload.digest;
  return sha256(canonicalJson(payload));
}

/**
 * taxonomySection — the rows of one section.
 *
 * @param {{section?: string, taxonomy?: object}} options
 * @returns {object[]} a copy of the section rows
 */
export function taxonomySection({ section = null, taxonomy = null } = {}) {
  const source = taxonomy || loadTaxonomy();
  const rows = asArray(source?.[String(section ?? '')]);
  return rows.map((row) => (row && typeof row === 'object' ? { ...row } : row));
}

/**
 * taxonomyLookup — one row by id.
 *
 * @param {{section?: string, id?: string, taxonomy?: object}} options
 * @returns {object|null} the row, or null
 */
export function taxonomyLookup({ section = null, id = null, taxonomy = null } = {}) {
  const wanted = String(id ?? '');
  if (!wanted) return null;
  const rows = taxonomySection({ section, taxonomy });
  const found = rows.find((row) => row && String(row.id ?? '') === wanted);
  return found && typeof found === 'object' ? { ...found } : null;
}

/**
 * taxonomyValidate — structural checks over one taxonomy.
 *
 * Checks unique ids per section, every cross-reference, no duplicate vocabulary
 * in either direction, every lifecycle, authority and status value used
 * elsewhere is declared, every schema id has an owner, and the digest.
 *
 * @param {object} taxonomy
 * @returns {{ok: boolean, errors: string[], warnings: string[]}}
 */
export function taxonomyValidate(taxonomy) {
  const errors = [];
  const warnings = [];

  if (!taxonomy || typeof taxonomy !== 'object' || Array.isArray(taxonomy)) {
    return { ok: false, errors: ['taxonomy: expected an object'], warnings };
  }
  if (taxonomy.schema !== TAXONOMY_SCHEMA) {
    errors.push(`schema: expected ${TAXONOMY_SCHEMA}, found ${String(taxonomy.schema)}`);
  }
  if (!/^\d+\.\d+\.\d+$/.test(String(taxonomy.version))) {
    errors.push(`version: expected a semver string, found ${String(taxonomy.version)}`);
  }
  for (const section of REQUIRED_SECTIONS) {
    if (!Array.isArray(taxonomy[section])) errors.push(`section: missing ${section}`);
  }
  if (errors.length) return { ok: false, errors, warnings };

  // --- unique ids per section -----------------------------------------------
  const idsBySection = new Map();
  for (const section of REQUIRED_SECTIONS) {
    const seen = new Set();
    for (const row of taxonomy[section]) {
      if (!row || typeof row !== 'object') {
        errors.push(`${section}: row is not an object`);
        continue;
      }
      const id = String(row.id ?? '');
      if (!id) {
        errors.push(`${section}: row without id`);
        continue;
      }
      if (seen.has(id)) errors.push(`${section}: duplicate id ${id}`);
      seen.add(id);
    }
    idsBySection.set(section, seen);
  }

  // --- declared vocabularies ------------------------------------------------
  const layerIds = idsBySection.get('layers');
  const statusIds = idsBySection.get('statuses');
  const scopeIds = idsBySection.get('scopes');
  const authorityIds = idsBySection.get('authority');
  const authorityLabels = new Set(
    taxonomy.authority.map((row) => String(row?.label ?? '')).filter(Boolean),
  );
  const lifecycleLabels = new Set(
    taxonomy.lifecycle.map((row) => String(row?.label ?? '')).filter(Boolean),
  );
  const grammarPrefixes = new Set(
    taxonomy.idGrammar.map((row) => String(row?.prefix ?? '')).filter(Boolean),
  );

  // A layer may be named by its id (`layer.kb`) or by its short key (`kb`).
  const layerKeys = new Set(layerIds);
  for (const row of taxonomy.layers) {
    const id = String(row?.id ?? '');
    const dot = id.lastIndexOf('.');
    if (dot !== -1) layerKeys.add(id.slice(dot + 1));
    if (row?.key) layerKeys.add(String(row.key));
  }

  // A scope may be named by its id (`scope.read`) or by its short key (`read`).
  const scopeKeys = new Set(scopeIds);
  for (const row of taxonomy.scopes) {
    if (row?.scope) scopeKeys.add(String(row.scope));
    if (row?.key) scopeKeys.add(String(row.key));
  }

  for (const label of REQUIRED_AUTHORITY_LABELS) {
    if (!authorityLabels.has(label)) errors.push(`authority: missing label ${label}`);
  }

  // --- cross references -----------------------------------------------------
  const usedPrefixes = new Set();
  for (const row of taxonomy.entities) {
    const id = String(row?.id ?? '');
    if (!layerKeys.has(String(row?.owner ?? ''))) {
      errors.push(`entities.${id}: unknown owner layer ${String(row?.owner)}`);
    }
    const prefix = String(row?.id_prefix ?? '');
    if (!grammarPrefixes.has(prefix)) {
      errors.push(`entities.${id}: unknown id prefix ${prefix}`);
    }
    usedPrefixes.add(prefix);
    if (row?.status_enum != null && !statusIds.has(String(row.status_enum))) {
      errors.push(`entities.${id}: unknown status enum ${String(row.status_enum)}`);
    }
  }
  for (const row of taxonomy.idGrammar) {
    const prefix = String(row?.prefix ?? '');
    if (prefix && !usedPrefixes.has(prefix)) {
      warnings.push(`idGrammar.${String(row?.id ?? '')}: prefix ${prefix} is used by no entity`);
    }
  }

  for (const section of REQUIRED_SECTIONS) {
    for (const row of taxonomy[section]) {
      if (!row || typeof row !== 'object') continue;
      const id = String(row.id ?? '');
      if (row.layer != null && !layerIds.has(String(row.layer))) {
        errors.push(`${section}.${id}: unknown layer ${String(row.layer)}`);
      }
      if (row.authority != null && !authorityLabels.has(String(row.authority))) {
        errors.push(`${section}.${id}: unknown authority ${String(row.authority)}`);
      }
      if (row.lifecycle != null && !lifecycleLabels.has(String(row.lifecycle))) {
        errors.push(`${section}.${id}: unknown lifecycle ${String(row.lifecycle)}`);
      }
      if (row.authority_ref != null
        && !authorityLabels.has(String(row.authority_ref))
        && !authorityIds.has(String(row.authority_ref))) {
        errors.push(`${section}.${id}: unknown authority ${String(row.authority_ref)}`);
      }
      if (Array.isArray(row.requires_scopes)) {
        for (const scope of row.requires_scopes) {
          if (!scopeKeys.has(String(scope))) {
            errors.push(`${section}.${id}: unknown scope ${String(scope)}`);
          }
        }
      }
    }
  }

  for (const row of taxonomy.effects) {
    if (!row || typeof row !== 'object') continue;
    const id = String(row.id ?? '');
    if (row.approval_scope != null && !scopeKeys.has(String(row.approval_scope))) {
      errors.push(`effects.${id}: unknown approval scope ${String(row.approval_scope)}`);
    }
  }

  // --- vocabulary is unique in both directions ------------------------------
  const ownerTerms = new Map();
  const engineeringTerms = new Map();
  for (const row of taxonomy.vocabulary) {
    if (!row || typeof row !== 'object') continue;
    const id = String(row.id ?? '');
    const owner = row.owner_term == null ? '' : String(row.owner_term);
    const engineering = row.engineering_term == null ? '' : String(row.engineering_term);
    if (owner) {
      const key = owner.toLowerCase();
      if (ownerTerms.has(key)) {
        errors.push(`vocabulary.${id}: duplicate owner term ${owner}`);
      }
      ownerTerms.set(key, id);
    }
    if (engineering) {
      const key = engineering.toLowerCase();
      if (engineeringTerms.has(key)) {
        errors.push(`vocabulary.${id}: duplicate engineering term ${engineering}`);
      }
      engineeringTerms.set(key, id);
    }
  }

  // --- every schema id has an owner -----------------------------------------
  for (const row of taxonomy.schemaIds) {
    if (!row || typeof row !== 'object') continue;
    const id = String(row.id ?? '');
    if (!String(row.owner ?? '').trim()) {
      errors.push(`schemaIds.${id}: missing owner`);
    }
  }

  // --- status enums are non-empty -------------------------------------------
  for (const row of taxonomy.statuses) {
    if (!row || typeof row !== 'object') continue;
    if (!Array.isArray(row.values) || row.values.length === 0) {
      errors.push(`statuses.${String(row.id ?? '')}: no values`);
    }
  }

  // --- digest ---------------------------------------------------------------
  const expected = taxonomyDigest(taxonomy);
  if (String(taxonomy.digest ?? '') !== expected) {
    errors.push(`digest: expected ${expected}, found ${String(taxonomy.digest ?? '')}`);
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * taxonomyOwnerSurface — owner term to engineering term.
 *
 * @param {{term?: string, taxonomy?: object}} options
 * @returns {string|null} the engineering term, or null
 */
export function taxonomyOwnerSurface({ term = null, taxonomy = null } = {}) {
  const wanted = String(term ?? '').trim().toLowerCase();
  if (!wanted) return null;
  const rows = taxonomySection({ section: 'vocabulary', taxonomy });
  const byOwner = rows.find((row) => row && String(row.owner_term ?? '').toLowerCase() === wanted);
  if (byOwner) return String(byOwner.engineering_term ?? '');
  const byEngineering = rows.find(
    (row) => row && String(row.engineering_term ?? '').toLowerCase() === wanted,
  );
  if (byEngineering) return String(byEngineering.engineering_term ?? '');
  const byKey = rows.find((row) => row && String(row.key ?? '').toLowerCase() === wanted);
  if (byKey) return String(byKey.engineering_term ?? '');
  return null;
}

/**
 * taxonomyEngineeringTerm — engineering term to owner term.
 *
 * @param {{term?: string, taxonomy?: object}} options
 * @returns {string|null} the owner term, or null
 */
export function taxonomyEngineeringTerm({ term = null, taxonomy = null } = {}) {
  const wanted = String(term ?? '').trim().toLowerCase();
  if (!wanted) return null;
  const rows = taxonomySection({ section: 'vocabulary', taxonomy });
  const byEngineering = rows.find(
    (row) => row && String(row.engineering_term ?? '').toLowerCase() === wanted,
  );
  if (byEngineering) return String(byEngineering.owner_term ?? '');
  const byKey = rows.find((row) => row && String(row.key ?? '').toLowerCase() === wanted);
  if (byKey) return String(byKey.owner_term ?? '');
  return null;
}

/**
 * taxonomyStatuses — the status enum of one record type.
 *
 * @param {{record?: string, taxonomy?: object}} options
 * @returns {string[]} the allowed values, or an empty array
 */
export function taxonomyStatuses({ record = null, taxonomy = null } = {}) {
  const wanted = String(record ?? '').trim().toLowerCase();
  if (!wanted) return [];
  const rows = taxonomySection({ section: 'statuses', taxonomy });
  const match = rows.find((row) => {
    if (!row) return false;
    if (String(row.id ?? '').toLowerCase() === wanted) return true;
    if (String(row.record ?? '').toLowerCase() === wanted) return true;
    return asArray(row.records).some((value) => String(value).toLowerCase() === wanted);
  });
  if (!match) return [];
  return asArray(match.values).slice();
}

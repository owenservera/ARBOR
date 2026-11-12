// hq/lib/filetypes.mjs — lane K: the AION 21-family agentic file registry.
//
// Read-only and deterministic. This module only reads
// hq/registry/agentic-file-registry.v1.json; it never writes, fetches or
// promotes anything. "Mapped" means a record matched a catalog pattern. It
// does not mean implemented, accepted or required.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { globToRegExp, toPosix, tokenize } from './util.mjs';

// Kept internal so the module's public function surface stays exact. The
// path is also attached to loadRegistry for callers that want to display it.
const REGISTRY_PATH = 'hq/registry/agentic-file-registry.v1.json';

const FAMILY_CODES = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11',
  '12', '13', '14', '15', '16', '17', '18', '19', '20', '21',
];

// Used only when a registry row has no family_name. The live registry carries
// a name on every type; this keeps rendering total for malformed snapshots.
const FAMILY_FALLBACK = {
  '00': 'Unclassified',
  '01': 'Agent entry & bootstrap',
  '02': 'Provider-native instruction rules',
  '03': 'Agent roles & identity',
  '04': 'Context & retrieval',
  '05': 'Law, policy & guardrails',
  '06': 'Goals & product intent',
  '07': 'Architecture & interfaces',
  '08': 'Capabilities & discovery',
  '09': 'Skills & reusable methods',
  '10': 'Tool configuration & hooks',
  '11': 'Memory & durable learning',
  '12': 'State, status & telemetry',
  '13': 'Session boundaries & recovery',
  '14': 'Work inventory & scheduling',
  '15': 'Planning & decomposition',
  '16': 'Execution & operations',
  '17': 'Testing & validation',
  '18': 'Proof, lineage & audit',
  '19': 'Collaboration & handoffs',
  '20': 'Decision & governance record',
  '21': 'Closeout, release & retirement',
};

const SECRET_BASENAMES = new Set([
  'session.json',
  'storage-state.json',
  'release-profile.json',
  'cookies',
  'login data',
]);

// ---------------------------------------------------------------------------
// small deterministic helpers

const cmpStr = (a, b) => (a === b ? 0 : a < b ? -1 : 1);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function typeName(type) {
  return String(type?.name || type?.pattern || '');
}

function normFamily(value) {
  const raw = String(value ?? '').trim();
  return /^\d$/.test(raw) ? `0${raw}` : raw;
}

function familyNameOf(registry, family) {
  const code = normFamily(family);
  for (const type of asArray(registry?.types)) {
    if (normFamily(type?.family) === code && type?.family_name) return String(type.family_name);
  }
  const byFamily = registry?.by_family?.[code];
  if (byFamily?.family_name) return String(byFamily.family_name);
  return FAMILY_FALLBACK[code] || 'Unclassified';
}

function roleOf(registry, family) {
  const code = normFamily(family);
  return String(registry?.network?.roles?.[code] || 'unclassified');
}

function normalizePath(value) {
  let path = toPosix(String(value ?? '')).trim();
  path = path.replace(/^\.\//, '');
  path = path.replace(/\/+/g, '/');
  path = path.replace(/^\/+/, '');
  path = path.replace(/\/+$/, '');
  return path.toLowerCase();
}

function baseName(value) {
  const path = normalizePath(value);
  const at = path.lastIndexOf('/');
  return at === -1 ? path : path.slice(at + 1);
}

function hasGlob(value) {
  return /[*?{]/.test(String(value ?? ''));
}

function isSecretPath(value) {
  const name = baseName(value);
  if (!name) return false;
  if (name.startsWith('.env')) return true;
  if (name.endsWith('.keystore')) return true;
  return SECRET_BASENAMES.has(name);
}

function sortedTypes(registry) {
  return asArray(registry?.types)
    .filter((type) => type && typeof type === 'object')
    .slice()
    .sort((a, b) => cmpStr(String(a.id ?? ''), String(b.id ?? '')));
}

function cmpTypeName(a, b) {
  return cmpStr(typeName(a), typeName(b)) || cmpStr(String(a?.id ?? ''), String(b?.id ?? ''));
}

function familyCodes(registry) {
  const codes = new Set();
  for (const type of asArray(registry?.types)) {
    if (type?.family != null) codes.add(normFamily(type.family));
  }
  for (const record of asArray(registry?.records)) {
    if (record?.family != null) codes.add(normFamily(record.family));
  }
  for (const code of Object.keys(registry?.by_family || {})) codes.add(normFamily(code));
  for (const code of Object.keys(registry?.network?.roles || {})) codes.add(normFamily(code));
  return [...codes].filter((code) => /^\d\d$/.test(code)).sort(cmpStr);
}

function familyRows(registry) {
  return familyCodes(registry)
    .filter((code) => code !== '00')
    .map((code) => {
      const types = asArray(registry?.types).filter((t) => normFamily(t?.family) === code);
      const observed = Number(registry?.by_family?.[code]?.count) || 0;
      return {
        code,
        name: familyNameOf(registry, code),
        role: roleOf(registry, code),
        types: types.length,
        observed,
      };
    });
}

function derivedCounts(registry) {
  const types = asArray(registry?.types);
  const records = asArray(registry?.records);
  const repos = Object.keys(registry?.by_repo || {});
  const mappedTypes = types.filter((t) => t?.mapped === true);
  const rows = familyRows(registry);
  return {
    records: records.length,
    repositories: repos.length,
    catalog_patterns: mappedTypes.length,
    families: rows.length,
    types: types.length,
    observed_types: new Set(records.map((r) => r?.type).filter(Boolean)).size,
    mapped_records: records.filter((r) => r?.mapped === true).length,
    unmapped_records: records.filter((r) => r?.mapped !== true).length,
    catalog_patterns_observed: types.filter((t) => t?.mapped === true && Number(t?.observed_count) > 0).length,
    catalog_patterns_unobserved: asArray(registry?.catalog_unobserved).length,
  };
}

function emptyCounts() {
  return {
    records: 0,
    repositories: 0,
    catalog_patterns: 0,
    families: 0,
    types: 0,
    observed_types: 0,
    mapped_records: 0,
    unmapped_records: 0,
    catalog_patterns_observed: 0,
    catalog_patterns_unobserved: 0,
    tracked_files: 0,
    source_records: 0,
    donor_snapshots: 0,
  };
}

// ---------------------------------------------------------------------------
// registry loading and validation

export function loadRegistry(root = process.cwd()) {
  const file = join(root, REGISTRY_PATH);
  return JSON.parse(readFileSync(file, 'utf8'));
}

loadRegistry.REGISTRY_PATH = REGISTRY_PATH;

export function validateRegistry(registry) {
  const errors = [];
  try {
    if (!registry || typeof registry !== 'object' || Array.isArray(registry)) {
      return { ok: false, errors: ['registry: expected an object'], counts: emptyCounts() };
    }

    const types = asArray(registry.types);
    const records = asArray(registry.records);
    const actual = derivedCounts(registry);
    const declared = registry.counts && typeof registry.counts === 'object' ? registry.counts : {};
    const counts = {
      ...emptyCounts(),
      ...actual,
      tracked_files: Number(declared.tracked_files ?? registry.tracked_files ?? 0) || 0,
      source_records: Number(declared.source_records ?? 0) || 0,
      donor_snapshots: Number(declared.donor_snapshots ?? 0) || 0,
    };

    if (registry.schema !== 'hq.agentic-file-registry/1') {
      errors.push(`schema: expected hq.agentic-file-registry/1, found ${String(registry.schema)}`);
    }
    if (Number(registry.version) !== 1) {
      errors.push(`version: expected 1, found ${String(registry.version)}`);
    }
    if (!Array.isArray(registry.types)) errors.push('types: expected an array');
    if (!Array.isArray(registry.records)) errors.push('records: expected an array');
    if (!Array.isArray(registry.unmapped)) errors.push('unmapped: expected an array');
    if (!Array.isArray(registry.catalog_unobserved)) errors.push('catalog_unobserved: expected an array');
    if (!registry.counts || typeof registry.counts !== 'object') errors.push('counts: expected an object');

    const expect = (key, actualValue) => {
      const wanted = Number(declared[key]);
      if (!Number.isFinite(wanted)) {
        errors.push(`counts.${key}: missing`);
      } else if (actualValue !== wanted) {
        errors.push(`counts.${key}: expected ${wanted}, found ${actualValue}`);
      }
    };

    expect('records', actual.records);
    expect('repositories', actual.repositories);
    expect('catalog_patterns', actual.catalog_patterns);
    expect('observed_types', actual.observed_types);
    expect('mapped_records', actual.mapped_records);
    expect('unmapped_records', actual.unmapped_records);
    expect('catalog_patterns_observed', actual.catalog_patterns_observed);
    expect('catalog_patterns_unobserved', actual.catalog_patterns_unobserved);

    // The contract pins the v1 census. These checks are deliberately explicit:
    // a drifting registry must fail validation instead of silently changing
    // what the rule book tells an agent.
    if (actual.records !== 217) errors.push(`census.records: expected 217, found ${actual.records}`);
    if (actual.catalog_patterns !== 133) errors.push(`census.catalog_patterns: expected 133, found ${actual.catalog_patterns}`);
    if (actual.repositories !== 7) errors.push(`census.repositories: expected 7, found ${actual.repositories}`);
    if (actual.families !== 21) errors.push(`census.families: expected 21, found ${actual.families}`);
    if (actual.mapped_records !== 143) errors.push(`census.mapped_records: expected 143, found ${actual.mapped_records}`);
    if (actual.unmapped_records !== 74) errors.push(`census.unmapped_records: expected 74, found ${actual.unmapped_records}`);
    if (actual.catalog_patterns_unobserved !== 121) {
      errors.push(`census.catalog_patterns_unobserved: expected 121, found ${actual.catalog_patterns_unobserved}`);
    }

    const repoEntries = Object.entries(registry.by_repo || {});
    const repoSum = repoEntries.reduce((sum, [, n]) => sum + (Number(n) || 0), 0);
    if (repoEntries.length !== 7) errors.push(`by_repo: expected 7 repositories, found ${repoEntries.length}`);
    if (repoSum !== actual.records) errors.push(`by_repo: counts sum to ${repoSum}, expected ${actual.records}`);

    const kindSum = Object.values(registry.by_kind || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
    if (kindSum !== actual.records) errors.push(`by_kind: counts sum to ${kindSum}, expected ${actual.records}`);

    const byFamilySum = Object.values(registry.by_family || {})
      .reduce((sum, row) => sum + (Number(row?.count) || 0), 0);
    if (byFamilySum !== actual.records) errors.push(`by_family: counts sum to ${byFamilySum}, expected ${actual.records}`);

    if (asArray(registry.unmapped).length !== actual.unmapped_records) {
      errors.push(`unmapped: expected ${actual.unmapped_records} rows, found ${asArray(registry.unmapped).length}`);
    }

    const ids = new Set();
    const names = new Set();
    const patterns = new Set();
    for (const type of types) {
      const id = String(type?.id ?? '');
      if (!id) errors.push('types: row without id');
      else if (ids.has(id)) errors.push(`types: duplicate id ${id}`);
      else ids.add(id);

      const name = String(type?.name ?? '');
      const nameKey = name.toLowerCase();
      if (!name) errors.push(`types.${id || '?'}: missing name`);
      else if (names.has(nameKey)) errors.push(`types: duplicate name ${name}`);
      else names.add(nameKey);

      const pattern = String(type?.pattern ?? '');
      const patternKey = pattern.toLowerCase();
      if (!pattern) errors.push(`types.${id || '?'}: missing pattern`);
      else if (patterns.has(patternKey)) errors.push(`types: duplicate pattern ${pattern}`);
      else patterns.add(patternKey);

      const family = normFamily(type?.family);
      if (!/^\d\d$/.test(family)) errors.push(`types.${id || '?'}: invalid family ${String(type?.family)}`);
      else if (!FAMILY_CODES.includes(family)) errors.push(`types.${id || '?'}: unknown family ${family}`);

      if (typeof type?.mapped !== 'boolean') errors.push(`types.${id || '?'}: mapped must be boolean`);
      if (!Array.isArray(type?.inline_tags)) errors.push(`types.${id || '?'}: inline_tags must be an array`);
      if (!Number.isFinite(Number(type?.observed_count)) || Number(type?.observed_count) < 0) {
        errors.push(`types.${id || '?'}: observed_count must be a non-negative number`);
      }
      if (!type?.role) errors.push(`types.${id || '?'}: missing role`);
    }

    const seenRecords = new Set();
    for (const record of records) {
      const key = `${record?.repo ?? ''}:${record?.path ?? ''}`;
      if (!record?.repo || !record?.path) errors.push('records: row without repo/path');
      else if (seenRecords.has(key)) errors.push(`records: duplicate ${key}`);
      else seenRecords.add(key);

      const family = normFamily(record?.family);
      if (!/^\d\d$/.test(family) || !FAMILY_CODES.includes(family)) {
        errors.push(`records: invalid family for ${key || '?'}`);
      }
      if (typeof record?.mapped !== 'boolean') errors.push(`records: mapped must be boolean for ${key || '?'}`);
    }

    const present = new Set(familyRows(registry).map((row) => row.code));
    for (const code of FAMILY_CODES) {
      if (!present.has(code)) errors.push(`families: missing ${code}`);
    }
    const extra = [...present].filter((code) => !FAMILY_CODES.includes(code));
    for (const code of extra) errors.push(`families: unexpected code ${code}`);
    if (!FAMILY_CODES.includes('00') && present.has('00')) {
      // 00 is allowed only when an observed row carries it; types do not in v1.
      errors.push('families: 00 must not appear unless observed');
    }

    for (const [code, role] of Object.entries(registry.network?.roles || {})) {
      const rows = types.filter((t) => normFamily(t?.family) === normFamily(code));
      if (rows.length && !rows.some((t) => String(t?.role) === String(role))) {
        errors.push(`network.roles: ${code} role ${role} matches no type`);
      }
    }

    return { ok: errors.length === 0, errors, counts };
  } catch (error) {
    errors.push(`registry: ${error instanceof Error ? error.message : String(error)}`);
    return { ok: false, errors, counts: emptyCounts() };
  }
}

// ---------------------------------------------------------------------------
// classification

function exactCandidates(types, path) {
  const out = [];
  for (const type of types) {
    const raw = String(type?.pattern ?? '');
    if (!raw || hasGlob(raw)) continue;
    const pattern = normalizePath(raw);
    const matched = pattern.includes('/')
      ? path === pattern || path.endsWith(`/${pattern}`) || baseName(path) === baseName(pattern)
      : baseName(path) === pattern;
    if (!matched) continue;
    // A literal basename outranks a literal path, then longer literals win.
    const rank = (pattern.includes('/') ? 1 : 2) * 10000 + pattern.length;
    out.push({ type, rank });
  }
  return out.sort((a, b) => b.rank - a.rank || cmpStr(String(a.type.id), String(b.type.id)));
}

function globCandidates(types, path) {
  const out = [];
  for (const type of types) {
    const raw = String(type?.pattern ?? '');
    if (!raw || !hasGlob(raw)) continue;
    const pattern = normalizePath(raw);
    let re;
    try {
      re = globToRegExp(pattern);
    } catch {
      continue;
    }
    const parts = path.split('/');
    let matched = re.test(path);
    if (!matched) {
      for (let i = 1; i < parts.length && !matched; i++) {
        matched = re.test(parts.slice(i).join('/'));
      }
    }
    if (!matched) continue;
    const literal = pattern.replace(/[*?{}]/g, '').length;
    out.push({ type, rank: literal * 1000 + pattern.length });
  }
  return out.sort((a, b) => b.rank - a.rank || cmpStr(String(a.type.id), String(b.type.id)));
}

function classificationOf(type, confidence) {
  return {
    typeId: type.id ?? null,
    name: type.name ?? null,
    pattern: type.pattern ?? null,
    family: normFamily(type.family),
    familyName: type.family_name || FAMILY_FALLBACK[normFamily(type.family)] || 'Unclassified',
    role: type.role ?? null,
    authority: type.authority ?? null,
    sourceClass: type.source_class ?? null,
    confidence,
    mapped: type.mapped === true,
  };
}

function unclassified() {
  return {
    typeId: null,
    name: null,
    pattern: null,
    family: '00',
    familyName: 'Unclassified',
    role: 'unclassified',
    authority: null,
    sourceClass: 'unknown',
    confidence: 0,
    mapped: false,
  };
}

export function classifyPath(registry, path) {
  const normalized = normalizePath(path);
  if (!normalized) return unclassified();

  const types = sortedTypes(registry);
  const mapped = types.filter((t) => t?.mapped === true);
  const observedOnly = types.filter((t) => t?.mapped !== true);

  // 1. Exact basename (or literal full path) on catalog-mapped types.
  const exact = exactCandidates(mapped, normalized);
  if (exact.length) return classificationOf(exact[0].type, 1.0);

  // 2. Path glob on catalog-mapped types. A wildcard never outranks a literal.
  const globbed = globCandidates(mapped, normalized);
  if (globbed.length) return classificationOf(globbed[0].type, 0.8);

  // 3. Observed-only basename. It is evidence, not a catalog standard.
  const observed = exactCandidates(observedOnly, normalized);
  if (observed.length) return classificationOf(observed[0].type, 0.6);

  return unclassified();
}

// ---------------------------------------------------------------------------
// family / role / task selection

export function typesForFamily(registry, family) {
  const code = normFamily(family);
  return sortedTypes(registry)
    .filter((type) => normFamily(type?.family) === code)
    .sort(cmpTypeName);
}

export function typesForRole(registry, role) {
  const wanted = String(role ?? '').trim().toLowerCase();
  return sortedTypes(registry)
    .filter((type) => String(type?.role ?? '').toLowerCase() === wanted)
    .sort(cmpTypeName);
}

function fieldText(type, field) {
  switch (field) {
    case 'name':
      return typeName(type);
    case 'purpose':
      return String(type?.purpose ?? '');
    case 'family':
      return `${normFamily(type?.family)} ${type?.family_name || FAMILY_FALLBACK[normFamily(type?.family)] || ''}`;
    case 'role':
      return String(type?.role ?? '');
    case 'inline_tags':
      return asArray(type?.inline_tags).join(' ');
    default:
      return '';
  }
}

const TASK_FIELDS = [
  ['name', 4.0],
  ['purpose', 3.0],
  ['family', 2.0],
  ['role', 2.0],
  ['inline_tags', 1.0],
];

function tokenQuality(token, text) {
  if (!text) return 0;
  const lower = text.toLowerCase();
  const fieldTokens = new Set(tokenize(lower));
  if (fieldTokens.has(token)) return 1;
  let best = 0;
  if (token.length >= 3) {
    for (const candidate of fieldTokens) {
      if (candidate.length >= 3 && (candidate.startsWith(token) || token.startsWith(candidate))) {
        best = Math.max(best, 0.8);
      }
    }
    if (!best && lower.includes(token)) best = 0.6;
  }
  return best;
}

export function typesForTask(registry, task, options = {}) {
  const requested = Number(options?.limit ?? 12);
  const limit = Number.isFinite(requested) ? Math.max(0, Math.min(200, Math.trunc(requested))) : 12;
  if (limit === 0) return [];

  const tokens = tokenize(task);
  const scored = [];
  for (const type of sortedTypes(registry)) {
    let base = 0;
    for (const token of tokens) {
      for (const [field, weight] of TASK_FIELDS) {
        base += weight * tokenQuality(token, fieldText(type, field));
      }
    }
    // Observation is a tie-breaker for relevant types, never a reason to
    // surface an unrelated type. A task with no recognizable tokens yields no
    // auto-exposure candidates.
    if (base <= 0) continue;
    const observed = Number(type?.observed_count) || 0;
    const boost = observed > 0 ? 1 + Math.min(1, Math.log10(1 + observed)) : 0;
    const score = Math.round((base + boost) * 1000) / 1000;
    scored.push({ ...type, score, reason: 'task_match' });
  }

  scored.sort((a, b) => b.score - a.score || cmpTypeName(a, b));
  return scored.slice(0, limit);
}

// ---------------------------------------------------------------------------
// auto-exposure against the documents table

function normaliseDocRow(row) {
  return {
    path: String(row?.path ?? ''),
    project: row?.project == null ? null : String(row.project),
    family: normFamily(row?.family),
    role: String(row?.role ?? '').toLowerCase(),
    authority: row?.authority == null ? null : String(row.authority),
  };
}

export function autoExpose(db, { registry, task, project = null, limit = 12 } = {}) {
  const requested = Number(limit);
  const cap = Number.isFinite(requested) ? Math.max(0, Math.min(200, Math.trunc(requested))) : 12;
  const types = typesForTask(registry, task, { limit: cap });
  if (!db || cap === 0 || types.length === 0) return { types, documents: [] };

  const typeIds = new Set(types.map((t) => String(t.id)));
  const families = new Set(types.map((t) => normFamily(t.family)));
  const roles = new Set(types.map((t) => String(t.role ?? '').toLowerCase()).filter(Boolean));
  const authorities = new Set(types.map((t) => t.authority).filter(Boolean));

  let rows;
  try {
    rows = db.prepare(
      `SELECT d.path, d.family, d.role, d.authority, p.name AS project
         FROM documents d
         LEFT JOIN projects p ON p.id = d.project_id
        ORDER BY d.path ASC, p.name ASC`,
    ).all();
  } catch {
    return { types, documents: [] };
  }

  const wantedProject = project == null ? null : String(project).toLowerCase();
  const candidates = [];
  for (const raw of rows) {
    const row = normaliseDocRow(raw);
    if (!row.path || isSecretPath(row.path)) continue;
    if (wantedProject && String(row.project ?? '').toLowerCase() !== wantedProject) continue;

    const cls = classifyPath(registry, row.path);
    const docFamily = row.family || normFamily(cls.family);
    const docRole = row.role || String(cls.role ?? '').toLowerCase();
    const docAuthority = row.authority ?? cls.authority ?? null;

    const taskMatch = cls.typeId != null && typeIds.has(String(cls.typeId));
    const familyMatch = families.has(docFamily);
    const roleMatch = roles.has(docRole);
    const authorityMatch = Boolean(docAuthority && authorities.has(docAuthority));
    // A strong authority label (owner, architecture, team) may surface an
    // otherwise unrelated document. Weak labels may not: they would expose
    // most of the index.
    const strongAuthority = authorityMatch && ['owner', 'architecture', 'team'].includes(String(docAuthority));
    if (!taskMatch && !familyMatch && !roleMatch && !strongAuthority) continue;

    const reasons = [];
    if (familyMatch) reasons.push('family_match');
    if (roleMatch) reasons.push('role_match');
    if (taskMatch) reasons.push('task_match');
    if (authorityMatch) reasons.push('authority_match');
    if (reasons.length === 0) continue;

    let best = null;
    for (const type of types) {
      if (String(type.id) === String(cls.typeId)) { best = type; break; }
      if (normFamily(type.family) === docFamily) { best = type; break; }
      if (String(type.role ?? '').toLowerCase() === docRole) { best = type; break; }
    }
    if (!best && authorityMatch) best = types.find((type) => type.authority === docAuthority) || null;
    if (!best) continue;

    candidates.push({
      path: row.path,
      project: row.project,
      type: best.name ?? best.pattern ?? cls.name ?? null,
      family: docFamily,
      role: docRole || null,
      authority: docAuthority,
      reason: reasons[0],
      score: Number(best.score) || 0,
    });
  }

  candidates.sort((a, b) => b.score - a.score || cmpStr(a.project ?? '', b.project ?? '') || cmpStr(a.path, b.path));
  return {
    types,
    documents: candidates.slice(0, cap).map(({ score, ...doc }) => doc),
  };
}

// ---------------------------------------------------------------------------
// network graph

export function networkGraph(registry) {
  const nodes = sortedTypes(registry);
  const byFamily = new Map();
  for (const node of nodes) {
    const family = normFamily(node.family);
    if (!byFamily.has(family)) byFamily.set(family, []);
    byFamily.get(family).push(node);
  }

  const edges = [];
  const seen = new Set();
  const addEdge = (from, to, kind) => {
    if (!from || !to || from === to) return;
    const key = `${from}\u0000${to}\u0000${kind}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ from, to, kind });
  };

  for (const family of [...byFamily.keys()].sort(cmpStr)) {
    const group = byFamily.get(family).slice().sort((a, b) => cmpStr(String(a.id), String(b.id)));
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        addEdge(String(group[i].id), String(group[j].id), 'same_family');
      }
    }
  }

  const flows = asArray(registry?.network?.family_flow)
    .map((flow) => ({ from: normFamily(flow?.from), to: normFamily(flow?.to) }))
    .sort((a, b) => cmpStr(a.from, b.from) || cmpStr(a.to, b.to));
  for (const flow of flows) {
    const fromGroup = (byFamily.get(flow.from) || []).slice().sort((a, b) => cmpStr(String(a.id), String(b.id)));
    const toGroup = (byFamily.get(flow.to) || []).slice().sort((a, b) => cmpStr(String(a.id), String(b.id)));
    for (const from of fromGroup) {
      for (const to of toGroup) addEdge(String(from.id), String(to.id), 'family_flow');
    }
  }

  edges.sort((a, b) => cmpStr(a.from, b.from) || cmpStr(a.to, b.to) || cmpStr(a.kind, b.kind));
  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// inline tags

function findType(registry, typeNameValue) {
  const wanted = String(typeNameValue ?? '').trim().toLowerCase();
  if (!wanted) return null;
  return sortedTypes(registry).find((type) => (
    String(type?.id ?? '').toLowerCase() === wanted
    || String(type?.name ?? '').toLowerCase() === wanted
    || String(type?.pattern ?? '').toLowerCase() === wanted
  )) || null;
}

export function inlineTagsFor(registry, typeNameValue) {
  const type = findType(registry, typeNameValue);
  if (type && asArray(type.inline_tags).length) return [...type.inline_tags];

  const role = type ? String(type.role ?? '').toLowerCase() : String(typeNameValue ?? '').toLowerCase();
  if (!role) return [];
  const tags = new Set();
  for (const candidate of sortedTypes(registry)) {
    if (String(candidate?.role ?? '').toLowerCase() !== role) continue;
    for (const tag of asArray(candidate?.inline_tags)) tags.add(tag);
  }
  return [...tags].sort(cmpStr);
}

// ---------------------------------------------------------------------------
// rule book

function mdCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ');
}

function countOf(registry, key, fallback) {
  const value = Number(registry?.counts?.[key]);
  return Number.isFinite(value) ? value : fallback;
}

export function renderRuleBook(registry) {
  const counts = derivedCounts(registry);
  const rows = familyRows(registry);
  const nRecords = countOf(registry, 'records', counts.records);
  const nRepos = countOf(registry, 'repositories', counts.repositories);
  const nCatalog = countOf(registry, 'catalog_patterns', counts.catalog_patterns);
  const nMapped = countOf(registry, 'mapped_records', counts.mapped_records);
  const nUnmapped = countOf(registry, 'unmapped_records', counts.unmapped_records);
  const nUnobserved = countOf(registry, 'catalog_patterns_unobserved', counts.catalog_patterns_unobserved);
  const nObservedPatterns = countOf(registry, 'catalog_patterns_observed', counts.catalog_patterns_observed);
  const nTracked = countOf(registry, 'tracked_files', 0);
  const nSource = countOf(registry, 'source_records', 0);
  const nDonor = countOf(registry, 'donor_snapshots', 0);
  const nTypes = counts.types;
  const builtAt = String(registry?.built_at ?? 'unknown');
  const inventoryDate = String(registry?.sources?.inventory_date ?? 'unknown');
  const catalogDate = String(registry?.sources?.catalog_date ?? 'unknown');

  const familyTable = [
    '| Family | Name | Role | Types in index | Observed records |',
    '| --- | --- | --- | ---: | ---: |',
    ...rows.map((row) => `| ${row.code} | ${mdCell(row.name)} | ${mdCell(row.role)} | ${row.types} | ${row.observed} |`),
    `| **Total** | 21 families | | **${nTypes}** | **${nRecords}** |`,
  ].join('\n');

  return `# HQ Agentic File Rule Book

Version 1, built from the registry snapshot dated ${builtAt}. Inventory date
${inventoryDate}; catalog date ${catalogDate}. Source of truth:
\`${REGISTRY_PATH}\`.

## Authority statement

**Documents never grant execution authority.** **A document never grants execution authority.**
HQ is read-only. No file, registry row, rule, decision record, CANON term,
wiki page, receipt or rule book grants permission to run a command, change a
system, spend money, publish, or contact anyone. Execution authority comes
only from the owner and the active runtime's own policy.

**Observed files are not standards.** They are evidence of what one repository
contained on the inventory date. A file appearing in this registry means it was
seen, not that it is correct, required, accepted, current or safe to copy.
Donor snapshots remain historical. Missing catalog patterns are not
automatically required files.

### Authority labels

| Label | Meaning |
| --- | --- |
| \`vendor_documented\` | An official provider or tool convention. |
| \`project_observed\` | An actual repository file, observed in the census. |
| \`local_custom\` | A local convention that has not been verified. |
| \`proposed\` | A candidate that has not been adopted. |
| \`historical\` | Archived or donor material. It stays historical. |

Lifecycle values are \`current\`, \`historical\`, \`generated\` and
\`archived\`. A generated view is rebuildable and never authoritative. An
archived document is retained, not deleted.

## The 21 document families

Families organise documents by the job they do for an agent. They are a
navigation aid, not an execution order or a hierarchy of authority. Family
\`00\` is reserved for unclassified observed material and is not part of the 21
core families.

${familyTable}

## Census and catalog diff

The registry is a census, not a prescription.

Census: ${nRecords} records, ${nRepos} repos, ${nCatalog} catalog patterns, ${nMapped} mapped, ${nUnmapped} unmapped, ${nUnobserved} unobserved.

- **${nRecords} records** observed across **${nRepos} repositories**.
- **${nTracked} tracked files** in the source inventory; **${nSource} source
  records** and **${nDonor} donor snapshots** survived the census filters.
- **${nCatalog} catalog patterns** in the AION catalog.
- **${nMapped} mapped records**; **${nUnmapped} unmapped records**.
- **${nObservedPatterns} catalog patterns observed**; **${nUnobserved} catalog
  patterns unobserved**.
- **${nTypes} types** in the type index: ${nCatalog} catalog patterns plus
  ${nTypes - nCatalog} observed-only types.

The difference between ${nRecords} records and ${nTypes} types is expected.
Many files share one type (for example, many \`SKILL.md\` files). The difference
between ${nMapped} mapped and ${nUnmapped} unmapped records is also expected:
unmapped files were observed but did not match a catalog pattern. Neither
number measures implementation, adoption or quality.

## Inline annotation protocol

Annotations are comments, never executable directives. HQ scans comments only
and never treats ordinary prose as an annotation.

Canonical tags:

- \`@hq:context\` — what this file is for and where it sits.
- \`@hq:why\` — the reason behind a non-obvious choice.
- \`@hq:invariant\` — a property that must remain true.
- \`@hq:see\` — a source reference; see the ref forms below.
- \`@hq:todo\` — known remaining work; include an owner when one exists.
- \`@hq:owner\` — the accountable person or role.
- \`@hq:task\` — the task or work item this code serves.
- \`@hq:risk\` — a hazard, failure mode or blast radius.
- \`@hq:deprecated\` — retained for history; name the replacement with \`@hq:see\`.

Registry extension tags used by some document types:

- \`@hq:decision\` — points at a decision record.
- \`@hq:evidence\` — points at proof, a receipt or a lineage artifact.

Reference forms:

- \`@hq:see doc:<project>:<path>\` — an indexed document, for example
  \`doc:aion:AGENTS.md\`.
- \`@hq:see decision:<id>\` — a decision register row, for example
  \`decision:dec_0123456789abcdef01234567\`.
- \`@hq:see canon:<id>\` — a CANON term row, for example
  \`canon:canon_0123456789abcdef01234567\`.
- \`@hq:see <path>:<line>\` — an exact source anchor.

Unresolved \`doc:\`, \`decision:\` or \`canon:\` references stay visible as broken
links. They are not silently repaired and they never promote the target.
Annotations do not create decisions or CANON terms; extraction records them
with observed status and \`source_annotation\` authority until an owner
confirms otherwise.

## Auto-exposure

\`autoExpose(db, {registry, task, project, limit})\` uses the task text to rank
types, then joins the ranked types to the \`documents\` table by family and
role. It returns only document rows that exist in the local index and are not
secret paths.

- Task tokens are scored against the type name, purpose, family name, role and
  inline tags. A type observed at least once receives a small boost. Results
  are sorted by score descending, then name ascending.
- Reasons are \`task_match\`, \`family_match\`, \`role_match\` and
  \`authority_match\`. A weak authority label is supplementary. A strong
  \`owner\`, \`architecture\` or \`team\` label may surface a document, but it
  never grants permission to act on it.
- Secret paths are always excluded: \`.env*\`, \`*.keystore\`, \`session.json\`,
  \`storage-state.json\`, \`release-profile.json\`, \`Cookies\` and
  \`Login Data\`.
- Exposure is a reading suggestion. It is not permission to edit, execute,
  publish or trust the exposed file.

## Document classification

\`classifyPath(registry, path)\` is deterministic and case-insensitive:

1. **Exact basename or literal path** against catalog-mapped types.
   Confidence \`1.0\`.
2. **Path glob** against catalog-mapped types. Confidence \`0.8\`.
3. **Observed-only basename** against types that exist only because a file was
   observed. Confidence \`0.6\`.
4. **Unclassified**: family \`00\`, confidence \`0\`.

A literal basename always outranks a wildcard pattern. A glob never wins over
an exact match, even when the glob is longer. \`mapped: true\` means "matched a
catalog pattern"; it does not mean required, implemented or accepted.
Observed-only types are marked \`mapped: false\` and keep
\`source_class: observed_only\`.

## Decision and CANON authority

Statuses: \`proposed\`, \`accepted\`, \`rejected\`, \`superseded\`,
\`deprecated\`, \`observed\`. Authorities: \`owner\`, \`architecture\`,
\`team\`, \`agent_proposed\`, \`source_annotation\`.

- Decisions default to \`proposed\` with architecture authority. A decision
  becomes \`accepted\` only through explicit owner confirmation.
- CANON terms default to \`provisional\` or \`observed\`. A term becomes
  \`current\` only through explicit owner confirmation.
- \`@hq:why\` annotations become observed decisions with
  \`source_annotation\` authority. They never auto-promote.
- \`@hq:invariant\` annotations become observed CANON material. They never
  auto-promote.
- Supersession keeps both rows. The old row becomes \`superseded\` and points
  at the replacement; history is not rewritten.
- Claims require lineage: source path, hash and evidence references.
- Duplicate or contradictory terms stay visible as conflicts. They are never
  silently merged.

Documentation Constitution rules that govern this registry:

- **D-01** — a new local artifact is not a new canonical concept.
- **D-04** — documentation cannot promote itself into law.
- **D-05** — claims require lineage (source path plus hash).
- **D-06** — ambiguity and contradiction stay visible.
- **D-09** — views are rebuildable; the index and wiki are derived output.
- **D-10** — drift is repairable; stale evidence is marked, not hidden.
- **D-11** — historical material remains historical.
- **D-14** — mapped is not implemented, and implemented is not accepted.

## Provider precedence

When two instruction sources disagree, use this order. Higher items win for
execution policy; lower items are context only.

1. **Owner instruction and active runtime policy.** The owner's explicit,
   current instruction and the active provider's system/developer policy.
2. **Active provider-native repository instructions.** \`AGENTS.md\`,
   \`CLAUDE.md\`, \`GEMINI.md\` and the active provider's own rule files.
3. **Path-scoped provider rules.** \`.cursor/rules/*.mdc\`,
   \`.github/instructions/*.instructions.md\`, \`.opencode/agents/*.md\` and
   similar. The rule nearest the edited path wins over a root rule.
4. **Project context and architecture documents.** \`CONTEXT.md\`,
   \`ARCHITECTURE.md\`, \`CONTRACT.md\` and decision records. These constrain
   what work is legitimate; they do not grant execution authority.
5. **Observed and donor material.** Useful evidence, including
   \`README.md\` and \`BEST-PRACTICES.md\` snapshots. Never a standard.
6. **Generated views.** Wiki pages, search indexes and this rule book are
   derived and rebuildable. They never outrank their inputs.

Files belonging to an inactive provider are reference material, not active
instructions. A provider file name does not make its content authoritative.

## Explicit non-equivalences

| Not the same as | Meaning |
| --- | --- |
| Catalog pattern ≠ required file | A pattern describes a possible file, not an obligation. |
| Mapped ≠ implemented | Matching a catalog pattern proves only that a file was seen. |
| Observed ≠ standard | Observation is evidence, not a rule. |
| Documented ≠ accepted | A written claim is not an owner decision. |
| Accepted decision ≠ execution authority | Authority to decide is not permission to execute. |
| CANON term ≠ implementation | Agreed language does not prove the system behaves that way. |
| Receipt ≠ approval | Evidence that something was read is not consent. |
| Extracted ≠ verified | Extraction records text; verification is a separate act. |
| Provider syntax ≠ authority | A supported config format does not make its content lawful. |
| Historical ≠ current | Donor and archived material remains historical. |
| Same family ≠ same quality | Family membership is navigation, not a ranking. |

## Commands

\`\`\`sh
hq docs                         # classify and list indexed documents by family
hq docs --family 20             # decision and governance documents
hq decisions                    # decision register, newest first
hq decisions --status proposed  # decisions still awaiting an owner
hq canon                        # CANON term register
hq canon --status provisional   # terms not yet owner-confirmed
hq route "add a decision record" # instructions and skills for a task
hq context "add a decision record" # build a bounded, receipted context bundle
hq wiki                         # rebuild the derived wiki views
\`\`\`

All commands are local and read-only except the explicit index, wiki, receipt
and memory write paths. No command sends workspace data anywhere.
`;
}

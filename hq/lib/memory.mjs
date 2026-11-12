// hq/lib/memory.mjs — personal + agent memory with VIVIM tiers and provenance.
// Tiers: now (Immediate), later (Curated), canon (owner-confirmed).
// Provenance (origin, evidence, confidence) always survives promotion.
import { transaction } from './schema.mjs';
import { memoryTierLabel } from './nomenclature.mjs';
import { clamp, nowISO, safeJsonParse, sha256, tokenize } from './util.mjs';

export const MEMORY_TIERS = ['now', 'later', 'canon'];

const ORIGINS = ['user', 'agent', 'observed', 'imported'];
const TEXT_CAP = 10_000;

function memoryError(code, message) {
  const error = new Error(`${code}: ${message || `hq memory: ${code}`}`);
  error.code = code;
  return error;
}

function assertTier(tier, fallback = null) {
  if (fallback != null && tier == null) return fallback;
  if (!MEMORY_TIERS.includes(tier)) {
    throw memoryError('MEMORY_INVALID_TIER', `hq memory: invalid tier "${tier}" (now|later|canon)`);
  }
  return tier;
}

function assertOrigin(origin) {
  if (!ORIGINS.includes(origin)) {
    throw memoryError('MEMORY_INVALID_ORIGIN', `hq memory: invalid origin "${origin}" (user|agent|observed|imported)`);
  }
  return origin;
}

function normalizeText(value) {
  const text = String(value ?? '').trim();
  if (!text) throw memoryError('MEMORY_EMPTY', 'hq memory: note text is empty');
  return text.length > TEXT_CAP ? text.slice(0, TEXT_CAP) : text;
}

function normalizeEvidence(evidence) {
  if (Array.isArray(evidence)) return evidence;
  if (typeof evidence === 'string' && evidence.trim()) {
    const parsed = safeJsonParse(evidence, null);
    if (Array.isArray(parsed)) return parsed;
    return [evidence.trim()];
  }
  return [];
}

function noteId(text, tier, key) {
  return 'note_' + sha256(text + '\0' + tier + '\0' + (key || '')).slice(0, 24);
}

// Resolve a project reference (name, id, or {name,path}) to a projects.id.
// Unknown projects resolve to null so notes remain workspace-level.
function resolveProjectId(db, project) {
  if (project == null) return null;
  if (typeof project === 'number' && Number.isInteger(project)) {
    const row = db.prepare('SELECT id FROM projects WHERE id = ?').get(project);
    return row ? row.id : null;
  }
  if (typeof project === 'string' && project.trim()) {
    const row = db.prepare('SELECT id FROM projects WHERE name = ?').get(project.trim());
    return row ? row.id : null;
  }
  if (typeof project === 'object') {
    if (Number.isInteger(project.id)) {
      const row = db.prepare('SELECT id FROM projects WHERE id = ?').get(project.id);
      if (row) return row.id;
    }
    if (project.name) {
      const row = db.prepare('SELECT id FROM projects WHERE name = ?').get(String(project.name));
      if (row) return row.id;
    }
    if (project.path) {
      const path = String(project.path);
      const row = db.prepare('SELECT id FROM projects WHERE path = ?').get(path);
      if (row) return row.id;
      if (project.name) {
        const info = db.prepare(
          'INSERT INTO projects(name, path, kind, added_at) VALUES (?, ?, ?, ?)',
        ).run(String(project.name), path, 'dir', nowISO());
        return Number(info.lastInsertRowid);
      }
    }
  }
  return null;
}

function mapNote(row) {
  return {
    id: row.id,
    project_id: row.project_id == null ? null : row.project_id,
    project: row.project_name ?? null,
    tier: row.tier,
    tierLabel: memoryTierLabel(row.tier),
    key: row.key ?? null,
    text: row.text,
    origin: row.origin,
    confidence: Number(row.confidence),
    evidence: normalizeEvidence(row.evidence),
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    version: Number(row.version),
  };
}

const NOTE_SELECT = `
SELECT n.*, p.name AS project_name
FROM notes n
LEFT JOIN projects p ON p.id = n.project_id
`;

function getNoteRow(db, id) {
  return db.prepare(`${NOTE_SELECT} WHERE n.id = ?`).get(String(id));
}

// ---------------------------------------------------------------------------
// writes

export function addNote(db, {
  text,
  tier = 'now',
  project = null,
  key = null,
  origin = 'user',
  confidence = 1,
  evidence = [],
} = {}) {
  const body = normalizeText(text);
  assertTier(tier);
  assertOrigin(origin);
  const projectId = resolveProjectId(db, project);
  const noteKey = typeof key === 'string' && key.trim() ? key.trim() : null;
  const id = noteId(body, tier, noteKey);
  const existing = getNoteRow(db, id);
  if (existing) return mapNote(existing);

  const stamp = nowISO();
  const conf = Number.isFinite(Number(confidence)) ? clamp(Number(confidence), 0, 1) : 1;
  db.prepare(`
    INSERT INTO notes(id, project_id, tier, key, text, origin, confidence, evidence,
                      status, created_at, updated_at, version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, 1)
  `).run(
    id,
    projectId,
    tier,
    noteKey,
    body,
    origin,
    conf,
    JSON.stringify(normalizeEvidence(evidence)),
    stamp,
    stamp,
  );
  return mapNote(getNoteRow(db, id));
}

export function promoteNote(db, { id, toTier, confirmedByOwner = false } = {}) {
  const row = getNoteRow(db, id);
  if (!row) throw memoryError('MEMORY_NOT_FOUND', `hq memory: note not found: ${id}`);
  assertTier(toTier);
  if (row.status !== 'active') {
    throw memoryError('MEMORY_ARCHIVED', `hq memory: note ${id} is ${row.status}`);
  }
  if (toTier === row.tier) return mapNote(row);

  if (row.tier === 'canon') {
    throw memoryError('MEMORY_CANON_IMMUTABLE', `hq memory: canon note ${id} cannot be demoted; archive it instead`);
  }
  if (row.tier === 'later' && toTier === 'canon') {
    if (confirmedByOwner !== true) {
      throw memoryError('MEMORY_CANON_REQUIRES_OWNER', `hq memory: canon promotion of ${id} requires owner confirmation`);
    }
  } else if (!(row.tier === 'now' && toTier === 'later')) {
    throw memoryError('MEMORY_INVALID_PROMOTION', `hq memory: cannot promote ${row.tier} -> ${toTier}`);
  }

  return transaction(db, () => {
    db.prepare(`
      UPDATE notes
      SET tier = ?, updated_at = ?, version = version + 1
      WHERE id = ?
    `).run(toTier, nowISO(), String(id));
    return mapNote(getNoteRow(db, id));
  });
}

export function archiveNote(db, { id } = {}) {
  const info = db.prepare(`
    UPDATE notes SET status = 'archived', updated_at = ?
    WHERE id = ? AND status != 'archived'
  `).run(nowISO(), String(id));
  return Number(info.changes) > 0;
}

// ---------------------------------------------------------------------------
// reads

function clampLimit(limit, fallback) {
  const n = Number(limit);
  if (!Number.isFinite(n)) return fallback;
  return clamp(Math.trunc(n), 1, 5000);
}

function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, '\\$&');
}

function matchesQuery(tokens) {
  const clause = "(lower(n.text) LIKE ? ESCAPE '\\' OR lower(coalesce(n.key, '')) LIKE ? ESCAPE '\\')";
  return { clause: tokens.map(() => clause).join(' OR '), params: tokens.flatMap((t) => {
    const needle = `%${escapeLike(t)}%`;
    return [needle, needle];
  }) };
}

export function listNotes(db, { tier = null, project = null, query = null, status = 'active', limit = 50 } = {}) {
  const where = [];
  const params = [];
  if (tier != null) {
    assertTier(tier);
    where.push('n.tier = ?');
    params.push(tier);
  }
  if (project != null) {
    const projectId = resolveProjectId(db, project);
    if (projectId == null) return [];
    where.push('n.project_id = ?');
    params.push(projectId);
  }
  if (status != null && status !== 'all') {
    where.push('n.status = ?');
    params.push(String(status));
  }
  if (query != null && String(query).trim()) {
    const tokens = tokenize(query);
    if (!tokens.length) return [];
    const match = matchesQuery(tokens);
    where.push(`(${match.clause})`);
    params.push(...match.params);
  }
  const sql = `${NOTE_SELECT}
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY n.updated_at DESC, n.id ASC
    LIMIT ?`;
  params.push(clampLimit(limit, 50));
  return db.prepare(sql).all(...params).map(mapNote);
}

export function searchNotes(db, { query = '', limit = 20 } = {}) {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  return listNotes(db, { query, status: 'active', limit });
}

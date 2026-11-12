// hq/lib/skills.mjs — instruction + skill discovery, indexing and task routing.
// Turns a repository's own AGENTS.md / context.md / SKILL.md / rules files into
// a routable index so an agent sees the hard rules without reading everything.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, isAbsolute, join, resolve } from 'node:path';
import { transaction } from './schema.mjs';
import { alignmentForTask } from './vivim.mjs';
import {
  clamp, nowISO, safeJsonParse, sha256, toPosix, tokenize,
} from './util.mjs';

const KIND_WEIGHT = { agents: 1.0, context: 0.9, skill: 0.85, rules: 0.8, config: 0.7 };

const BODY_CAP = 20_000;
const MAX_OPTIONAL = 12;

const ROOT_FILES = [
  { path: 'AGENTS.md', kind: 'agents' },
  { path: 'CLAUDE.md', kind: 'agents' },
  { path: 'GEMINI.md', kind: 'agents' },
  { path: 'context.md', kind: 'context' },
  { path: '.cursorrules', kind: 'rules' },
  { path: '.github/copilot-instructions.md', kind: 'rules' },
  { path: 'docs/agents/TASK-CONTEXT-ROUTING.md', kind: 'context' },
  { path: 'opencode.json', kind: 'config' },
];

const SKILL_DIRS = [
  '.agents/skills',
  'skills',
  '.opencode/skills',
  '.opencode/skill',
];

const RULE_DIRS = ['.cursor/rules'];

const BOUNDARY_RE = /\b(MUST|NEVER|Only|must not|do not|forbidden|required)\b/i;

// ---------------------------------------------------------------------------
// project resolution helpers

function isDirectory(path) {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

function resolveProjectDir(root, project) {
  return explicitProjectDir(project, root)
    || (root ? resolve(String(root)) : process.cwd());
}

function explicitProjectDir(project, root) {
  if (!project) return null;
  const base = root ? resolve(String(root)) : process.cwd();
  if (typeof project === 'string') {
    const direct = isAbsolute(project) ? project : resolve(base, project);
    return isDirectory(direct) ? direct : null;
  }
  const candidates = [project.abs, project.absPath, project.absolute, project.path];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const abs = isAbsolute(String(candidate)) ? String(candidate) : resolve(project.root || base, String(candidate));
    if (isDirectory(abs)) return abs;
  }
  if (project.name) {
    const named = resolve(base, String(project.name));
    if (isDirectory(named)) return named;
  }
  return null;
}

function projectName(project, dir) {
  if (project && typeof project === 'object' && project.name) return String(project.name);
  if (typeof project === 'string' && project) {
    return isAbsolute(project) ? basename(project) : project;
  }
  return basename(dir);
}

function findProjectId(db, project) {
  if (!project || typeof project !== 'object') {
    if (typeof project === 'string' && project) {
      const row = db.prepare('SELECT id FROM projects WHERE name = ?').get(project);
      return row ? row.id : null;
    }
    return null;
  }
  if (Number.isInteger(project.id)) return project.id;
  if (Number.isInteger(project.project_id)) return project.project_id;
  if (project.name) {
    const row = db.prepare('SELECT id FROM projects WHERE name = ?').get(String(project.name));
    if (row) return row.id;
  }
  return null;
}

function ensureProjectRow(db, project, dir) {
  const existing = findProjectId(db, project);
  if (existing != null && db.prepare('SELECT id FROM projects WHERE id = ?').get(existing)) return existing;
  const name = projectName(project, dir);
  const path = project && typeof project === 'object' && (project.abs || project.path)
    ? String(project.abs || project.path)
    : dir;
  const row = db.prepare('SELECT id FROM projects WHERE name = ? OR path = ?').get(name, path);
  if (row) return row.id;
  const info = db.prepare(
    'INSERT INTO projects(name, path, kind, added_at) VALUES (?, ?, ?, ?)',
  ).run(name, path, 'dir', nowISO());
  return Number(info.lastInsertRowid);
}

// ---------------------------------------------------------------------------
// frontmatter

function stripQuotes(value) {
  const s = String(value).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function parseListValue(value) {
  const raw = String(value).trim();
  if (!raw) return [];
  if (raw.startsWith('[') && raw.endsWith(']')) {
    return raw.slice(1, -1).split(',').map((s) => stripQuotes(s)).filter(Boolean);
  }
  return raw.split(',').map((s) => stripQuotes(s)).filter(Boolean);
}

function parseFrontmatter(text) {
  const meta = {};
  const lines = String(text).split(/\r?\n/);
  if (lines[0]?.trim() !== '---') return { meta, endLine: -1 };
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { end = i; break; }
  }
  if (end === -1) return { meta, endLine: -1 };
  for (let i = 1; i < end; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const match = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1].toLowerCase();
    let value = match[2];
    if (!value.trim()) {
      const items = [];
      let j = i + 1;
      while (j < end) {
        const item = /^\s*-\s+(.*)$/.exec(lines[j]);
        if (!item) break;
        items.push(stripQuotes(item[1]));
        j++;
      }
      if (items.length) { meta[key] = items; i = j - 1; }
      continue;
    }
    meta[key] = value;
  }
  return { meta, endLine: end };
}

function frontmatterStrings(meta, key) {
  const value = meta[key];
  if (value == null) return [];
  if (Array.isArray(value)) return value.map((s) => String(s).trim()).filter(Boolean);
  return parseListValue(value);
}

function firstHeading(text, fromLine) {
  const lines = String(text).split(/\r?\n/);
  for (let i = fromLine; i < lines.length; i++) {
    const match = /^\s{0,3}#\s+(.+?)\s*#*\s*$/.exec(lines[i]);
    if (match) return match[1].trim();
  }
  return '';
}

function firstParagraph(text, fromLine) {
  const lines = String(text).split(/\r?\n/);
  for (let i = fromLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith('#') || line.startsWith('---')) continue;
    return line.slice(0, 300);
  }
  return '';
}

// ---------------------------------------------------------------------------
// scanning

function buildInstruction(absPath, relPath, kind, defaultName, extra = {}) {
  let text;
  let stat;
  try {
    text = readFileSync(absPath, 'utf8');
    stat = statSync(absPath);
  } catch {
    return null;
  }
  const { meta, endLine } = parseFrontmatter(text);
  const startLine = endLine >= 0 ? endLine + 1 : 0;
  const triggers = extra.triggers
    ? [...extra.triggers]
    : frontmatterStrings(meta, 'triggers');
  const title = (meta.title ? String(meta.title).trim() : '')
    || firstHeading(text, startLine)
    || basename(relPath);
  const description = (meta.description ? String(meta.description).trim() : '')
    || extra.description
    || firstParagraph(text, startLine);
  const name = (meta.name ? String(meta.name).trim() : '') || defaultName;
  return {
    path: toPosix(relPath),
    kind,
    name,
    title,
    description,
    triggers: triggers.map((t) => String(t).trim()).filter(Boolean),
    body: text.slice(0, BODY_CAP),
    hash: sha256(text),
    mtimeMs: Number(stat.mtimeMs),
  };
}

function listChildDirs(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function listRuleFiles(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.mdc'))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function configInstruction(absPath, relPath) {
  const entry = buildInstruction(absPath, relPath, 'config', basename(relPath));
  if (!entry) return null;
  const parsed = safeJsonParse(entry.body, null);
  const instructions = parsed && parsed.instructions;
  const paths = Array.isArray(instructions)
    ? instructions.map((s) => String(s)).filter(Boolean)
    : (typeof instructions === 'string' ? [instructions] : []);
  if (paths.length) {
    entry.triggers = paths;
    entry.description = `OpenCode config; instruction paths: ${paths.join(', ')}`.slice(0, 300);
  }
  return entry;
}

export function scanInstructions(root, project = null) {
  return scanInstructionsAt(resolveProjectDir(root, project));
}

function scanInstructionsAt(dir) {
  const found = new Map();

  for (const entry of ROOT_FILES) {
    const abs = join(dir, entry.path);
    if (!existsSync(abs)) continue;
    const instruction = entry.kind === 'config'
      ? configInstruction(abs, entry.path)
      : buildInstruction(abs, entry.path, entry.kind, basename(entry.path));
    if (instruction) found.set(instruction.path, instruction);
  }

  for (const rulesDir of RULE_DIRS) {
    const absDir = join(dir, rulesDir);
    for (const file of listRuleFiles(absDir)) {
      const rel = toPosix(join(rulesDir, file));
      const instruction = buildInstruction(join(absDir, file), rel, 'rules', basename(file, '.mdc'));
      if (instruction) found.set(instruction.path, instruction);
    }
  }

  for (const skillsDir of SKILL_DIRS) {
    const absDir = join(dir, skillsDir);
    for (const child of listChildDirs(absDir)) {
      const rel = toPosix(join(skillsDir, child, 'SKILL.md'));
      const abs = join(absDir, child, 'SKILL.md');
      if (!existsSync(abs)) continue;
      const instruction = buildInstruction(abs, rel, 'skill', child);
      if (instruction) found.set(instruction.path, instruction);
    }
  }

  return [...found.values()].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

// ---------------------------------------------------------------------------
// indexing

const UPSERT_SQL = `
INSERT INTO instructions(project_id, path, kind, name, title, description, triggers, body, hash, mtime_ms)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(project_id, path) DO UPDATE SET
  kind = excluded.kind,
  name = excluded.name,
  title = excluded.title,
  description = excluded.description,
  triggers = excluded.triggers,
  body = excluded.body,
  hash = excluded.hash,
  mtime_ms = excluded.mtime_ms
`;

export function indexInstructions(db, project) {
  const explicit = explicitProjectDir(project, project && project.root);
  const existingId = findProjectId(db, project);
  const row = existingId != null
    ? db.prepare('SELECT path FROM projects WHERE id = ?').get(existingId)
    : null;
  const rowDir = row && row.path
    ? (isAbsolute(row.path) ? row.path : resolve(project && project.root ? project.root : process.cwd(), row.path))
    : null;
  const dir = explicit || (rowDir && isDirectory(rowDir) ? rowDir : null)
    || (project && project.root ? resolve(String(project.root)) : process.cwd());
  const projectId = existingId != null ? existingId : ensureProjectRow(db, project, dir);
  const instructions = scanInstructionsAt(dir);

  return transaction(db, () => {
    const existingRows = db.prepare(
      'SELECT path, hash FROM instructions WHERE project_id = ?',
    ).all(projectId);
    const existing = new Map(existingRows.map((r) => [r.path, r.hash]));
    const seen = new Set();
    let added = 0;
    let changed = 0;

    const upsert = db.prepare(UPSERT_SQL);
    for (const instruction of instructions) {
      seen.add(instruction.path);
      const prior = existing.get(instruction.path);
      if (prior === undefined) added++;
      else if (prior !== instruction.hash) changed++;
      upsert.run(
        projectId,
        instruction.path,
        instruction.kind,
        instruction.name,
        instruction.title,
        instruction.description,
        JSON.stringify(instruction.triggers),
        instruction.body,
        instruction.hash,
        instruction.mtimeMs,
      );
    }

    let removed = 0;
    const del = db.prepare('DELETE FROM instructions WHERE project_id = ? AND path = ?');
    for (const path of existing.keys()) {
      if (seen.has(path)) continue;
      del.run(projectId, path);
      removed++;
    }

    return { count: instructions.length, added, changed, removed };
  });
}

// ---------------------------------------------------------------------------
// routing

function rowToInstruction(row) {
  return {
    path: row.path,
    kind: row.kind,
    name: row.name || '',
    title: row.title || '',
    description: row.description || '',
    triggers: safeJsonParse(row.triggers, []) || [],
    body: row.body || '',
    hash: row.hash || '',
    mtimeMs: Number(row.mtime_ms || 0),
  };
}

function coverageOf(tokens, haystackTokens) {
  if (!tokens.length) return 0;
  let hits = 0;
  for (const token of tokens) if (haystackTokens.has(token)) hits++;
  return hits / tokens.length;
}

function reasonFor(instruction, coverage, mandatory) {
  if (mandatory) {
    return instruction.path === 'AGENTS.md' || instruction.path === 'context.md'
      ? 'root instruction'
      : `coverage ${coverage.toFixed(2)}`;
  }
  return coverage > 0 ? `task match ${coverage.toFixed(2)}` : `kind ${instruction.kind}`;
}

function sortHits(hits) {
  return hits.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.path !== b.path) return a.path < b.path ? -1 : 1;
    return 0;
  });
}

export function routeTask(db, { task = '', project = null, limit = MAX_OPTIONAL } = {}) {
  const taskTokens = tokenize(task);
  const maxOptional = Number.isFinite(limit) ? clamp(Math.trunc(limit), 0, 500) : MAX_OPTIONAL;

  let projectId = null;
  if (project != null) {
    projectId = findProjectId(db, project);
    if (projectId == null && typeof project === 'string') {
      const row = db.prepare('SELECT id FROM projects WHERE name = ?').get(project);
      projectId = row ? row.id : null;
    }
    if (projectId == null) {
      return { task: String(task), mandatory: [], optional: [], skills: [], boundaries: [], alignment: routeAlignment(db, task) };
    }
  }

  const rows = projectId == null
    ? db.prepare('SELECT * FROM instructions ORDER BY path ASC, project_id ASC, id ASC').all()
    : db.prepare('SELECT * FROM instructions WHERE project_id = ? ORDER BY path ASC, id ASC').all(projectId);

  const mandatory = [];
  const optional = [];
  const skills = [];
  const boundaries = [];
  const boundarySeen = new Set();

  for (const row of rows) {
    const instruction = rowToInstruction(row);
    const haystack = [
      instruction.name,
      instruction.title,
      instruction.description,
      instruction.triggers.join(' '),
      instruction.body.slice(0, 2500),
    ].join(' ');
    const haystackTokens = new Set(tokenize(haystack));
    const coverage = coverageOf(taskTokens, haystackTokens);
    const weight = KIND_WEIGHT[instruction.kind] ?? 0.5;
    const score = Math.round(100 * (0.5 + 3.6 * coverage + weight));
    const isRoot = instruction.path === 'AGENTS.md' || instruction.path === 'context.md';
    const isMandatory = isRoot
      || ((instruction.kind === 'agents' || instruction.kind === 'context') && coverage >= 0.25);
    const hit = {
      path: instruction.path,
      kind: instruction.kind,
      title: instruction.title,
      reason: reasonFor(instruction, coverage, isMandatory),
      score,
    };
    if (isMandatory) {
      mandatory.push(hit);
      for (const line of instruction.body.split(/\r?\n/)) {
        if (boundaries.length >= 20) break;
        const trimmed = line.trim();
        if (!trimmed || trimmed.length > 240) continue;
        if (!BOUNDARY_RE.test(trimmed)) continue;
        if (boundarySeen.has(trimmed)) continue;
        boundarySeen.add(trimmed);
        boundaries.push(trimmed);
      }
    } else if (score > 0) {
      optional.push(hit);
    }
    if (instruction.kind === 'skill') {
      skills.push({
        name: instruction.name,
        path: instruction.path,
        description: instruction.description,
        score,
      });
    }
  }

  sortHits(mandatory);
  sortHits(optional);
  skills.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
  });

  return {
    task: String(task),
    mandatory,
    optional: optional.slice(0, maxOptional),
    skills: skills.slice(0, maxOptional),
    boundaries,
    alignment: routeAlignment(db, task),
  };
}

// VIVIM alignment for the routed task. Advisory only: a route never grants
// authority, and an unsynced feed yields null instead of empty-looking data.
function routeAlignment(db, task) {
  try {
    const alignment = alignmentForTask(db, String(task ?? ''));
    if (!alignment || !alignment.phase) return null;
    return {
      phase: { id: alignment.phase.id, status: alignment.phase.status ?? null },
      capabilities: alignment.details?.capabilities ?? [],
      gaps: alignment.details?.gaps ?? [],
      tasks: alignment.details?.tasks ?? [],
    };
  } catch {
    return null;
  }
}

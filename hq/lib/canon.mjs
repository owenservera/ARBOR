/**
 * @hq:context Document intelligence: the 21-family document inventory, the
 *   dated decision register and the CANON term register. Read-only projection.
 * @hq:owner hq
 * @hq:task lane-J
 * @hq:invariant Documents never grant execution authority. Extraction records
 *   what a document claims; only an explicit owner confirmation can produce
 *   `accepted` status or `owner` authority.
 * @hq:invariant Supersession and deprecation keep both rows. History is never
 *   rewritten or deleted.
 * @hq:invariant Indexing is idempotent: identical input produces identical
 *   rows and reports zero changes on the second run.
 * @hq:see hq/CONTRACT.md
 * @hq:see docs/CANON-DECISIONS.md
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { transaction } from './schema.mjs';
import { classifyPath, loadRegistry } from './filetypes.mjs';
import { discoverFiles } from './walk.mjs';
import {
  globToRegExp, nowISO, safeJsonParse, sha256, sha256File, toPosix,
} from './util.mjs';

// ---------------------------------------------------------------------------
// taxonomy constants (contract exports)

const FAMILY_CODES = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11',
  '12', '13', '14', '15', '16', '17', '18', '19', '20', '21',
];

// [code, name, role, patterns] — the AION core-library 21-family map.
// Patterns are lowercase basenames or project-relative globs. They are a
// fallback only: when the 217/133 registry classifies a path, the registry
// wins. The registry does not carry patterns for ADR directories or CANON
// dictionaries, so those paths rely on this map.
const FAMILY_DEFS = [
  ['01', 'Agent entry & bootstrap', 'instruction', ['agents.md', 'bootstrap.md', 'start-here.md']],
  ['02', 'Provider-native rules', 'instruction', [
    'claude.md', 'gemini.md', '.cursorrules', '.cursor/rules/*.mdc',
    '.github/copilot-instructions.md', '.github/instructions/*.instructions.md',
    '.opencode/agents/*.md', '.claude/rules/*.md', '.claude/agents/*.md',
  ]],
  ['03', 'Roles & identity', 'identity', ['role.md', 'persona.md', 'charter.md', 'genome.md', 'fleet.md']],
  ['04', 'Context & retrieval', 'context', [
    'context.md', 'project-context.md', 'glossary.md', 'knowledge-map.md',
    'world.md', 'aperture.md', 'canon.md', 'canon-dictionary.md',
    'docs/canon/*.md',
  ]],
  ['05', 'Law, policy & guardrails', 'law', [
    'rules.md', 'policy.md', 'invariants.md', 'authority.md', 'guardrails.md', 'autonomy.md',
  ]],
  ['06', 'Goals & product intent', 'intent', ['vision.md', 'goals.md', 'prd.md', 'spec.md', 'north-stars.md']],
  ['07', 'Architecture & interfaces', 'architecture', ['architecture.md', 'contract.md', 'api.md', 'schema.md']],
  ['08', 'Capabilities & discovery', 'capability', ['capabilities.md', 'tools.md', 'mcp.md', 'integrations.md']],
  ['09', 'Skills & reusable methods', 'skill', ['skill.md', 'playbook.md', 'recipes.md']],
  ['10', 'Tool configuration & hooks', 'config', [
    'opencode.json', 'opencode.jsonc', 'hooks.json', '.mcp.json', 'settings.json',
  ]],
  ['11', 'Memory & durable learning', 'memory', ['memory.md', 'notes.md', 'preferences.md', 'lessons.md', 'facts.md']],
  ['12', 'State, status & telemetry', 'state', ['state.md', 'sitrep.md', 'health.md', 'metrics.md', 'timing.md']],
  ['13', 'Session boundaries & recovery', 'continuity', ['handoff.md', 'checkpoint.md', 'resume.md']],
  ['14', 'Work inventory & scheduling', 'work', ['tasks.md', 'todo.md', 'backlog.md', 'milestones.md']],
  ['15', 'Planning & decomposition', 'plan', ['plan.md', 'roadmap.md', 'workstream.md', 'workstreams.md']],
  ['16', 'Execution & operations', 'operations', ['runbook.md', 'commands.md', 'deploy.md', 'worklog.md']],
  ['17', 'Testing & validation', 'validation', ['test-plan.md', 'verify.md', 'eval.md', 'benchmarks.md']],
  ['18', 'Proof, lineage & audit', 'evidence', ['evidence.md', 'provenance.md', 'receipts.md']],
  ['19', 'Collaboration & handoffs', 'collaboration', ['inbox.md', 'escalation.md', 'decisions-needed.md']],
  ['20', 'Decision & governance', 'decision', [
    'decisions.md', 'decision_log.md', 'adr.md', 'conflict-register.md',
    'change-request.md', 'adr/*.md', 'adr/*.yaml', 'adr/*.yml',
    'docs/adr/*.md', 'docs/adr/*.yaml', 'docs/adr/*.yml',
    'docs/decisions/*.md',
  ]],
  ['21', 'Closeout, release & retirement', 'closeout', [
    'closeout.md', 'closeout_protocol.md', 'release.md', 'rollback.md', 'postmortem.md',
  ]],
];

export const DOCUMENT_FAMILIES = Object.freeze(Object.fromEntries(
  FAMILY_DEFS.map(([code, name, role, patterns]) => [code, Object.freeze({
    name, role, patterns: Object.freeze([...patterns]),
  })]),
));

/** Decision statuses. Only `confirmDecision` may produce `accepted`. */
export const DECISION_STATUS = Object.freeze([
  'proposed', 'accepted', 'rejected', 'superseded', 'deprecated', 'observed',
]);

/** Decision/term authorities. Only owner confirmation may produce `owner`. */
export const AUTHORITY = Object.freeze([
  'owner', 'architecture', 'team', 'agent_proposed', 'source_annotation',
]);

// Document authority labels (filetypes registry vocabulary). Distinct from the
// decision/term AUTHORITY list above; never conflate the two.
const DOCUMENT_AUTHORITY = ['vendor_documented', 'project_observed', 'local_custom', 'proposed', 'historical'];

const DECISION_ROOT_FILES = new Set([
  'decisions.md', 'decision_log.md', 'adr.md', 'conflict-register.md', 'change-request.md',
]);
const CANON_ROOT_FILES = new Set([
  'canon-dictionary.md', 'canon.md', 'glossary.md', 'invariants.md',
]);
const DECISION_PATH_RE = /^(?:adr|docs\/adr|docs\/decisions)\/.+\.(?:md|mdx|ya?ml)$/i;
const CANON_PATH_RE = /^docs\/canon\/.+\.md$/i;

const MD_EXTS = ['.md', '.mdx', '.markdown'];
const ADR_EXTS = ['.md', '.mdx', '.yaml', '.yml'];
const DOC_READ_CAP = 600_000;
const ANNOTATION_SCAN_CAP = 5_000;
const BIND_CAP = 60;

const SECRET_BASENAMES = new Set(['session.json', 'storage-state.json', 'release-profile.json', 'cookies', 'login data']);

const ARCHIVE_SEGMENTS = new Set(['archive', 'archived', 'history', 'historical', 'donor']);
const GENERATED_SEGMENTS = new Set(['wiki', 'generated']);

const cmpStr = (a, b) => (a === b ? 0 : a < b ? -1 : 1);

// ---------------------------------------------------------------------------
// generic helpers

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function baseName(value) {
  const path = toPosix(String(value ?? ''));
  const at = path.lastIndexOf('/');
  return (at === -1 ? path : path.slice(at + 1)).toLowerCase();
}

function normalizePath(value) {
  let path = toPosix(String(value ?? '')).trim();
  path = path.replace(/^\.\//, '');
  path = path.replace(/\/+/g, '/');
  path = path.replace(/^\/+/, '');
  path = path.replace(/\/+$/, '');
  return path;
}

function isSecretPath(value) {
  const name = baseName(value);
  if (!name) return false;
  if (name.startsWith('.env')) return true;
  if (name.endsWith('.keystore')) return true;
  return SECRET_BASENAMES.has(name);
}

function isDir(path) {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

function isFile(path) {
  try { return statSync(path).isFile(); } catch { return false; }
}

function absOf(root, path) {
  const base = root ? resolve(String(root)) : process.cwd();
  if (!path) return base;
  return isAbsolute(String(path)) ? resolve(String(path)) : resolve(base, String(path));
}

function readText(absPath, cap = DOC_READ_CAP) {
  try {
    const text = readFileSync(absPath, 'utf8');
    return text.length > cap ? text.slice(0, cap) : text;
  } catch {
    return null;
  }
}

function fileHash(absPath) {
  try { return sha256File(absPath); } catch { return null; }
}

function statOf(absPath) {
  try { return statSync(absPath).mtimeMs; } catch { return 0; }
}

function stripQuotes(value) {
  const s = String(value ?? '').trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function parseListValue(value) {
  const raw = stripQuotes(value);
  if (!raw) return [];
  if (raw.startsWith('[') && raw.endsWith(']')) {
    return raw.slice(1, -1).split(',').map((s) => stripQuotes(s)).filter(Boolean);
  }
  return raw.split(',').map((s) => stripQuotes(s)).filter(Boolean);
}

function splitLines(text) {
  return String(text ?? '').split(/\r?\n/);
}

function cleanText(value, cap = 400) {
  return String(value ?? '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, cap);
}

function listFiles(absDir, exts) {
  let entries;
  try { entries = readdirSync(absDir, { withFileTypes: true }); } catch { return []; }
  return entries
    .filter((entry) => entry.isFile() && exts.some((ext) => entry.name.toLowerCase().endsWith(ext)))
    .map((entry) => entry.name)
    .sort(cmpStr);
}

// ---------------------------------------------------------------------------
// project resolution

function explicitProjectDir(project, base) {
  if (!project) return null;
  if (typeof project === 'string') {
    const direct = isAbsolute(project) ? project : resolve(base, project);
    return isDir(direct) ? direct : null;
  }
  if (typeof project !== 'object') return null;
  for (const candidate of [project.abs, project.absPath, project.absolute, project.path]) {
    if (!candidate) continue;
    const abs = isAbsolute(String(candidate)) ? String(candidate) : resolve(String(project.root || base), String(candidate));
    if (isDir(abs)) return abs;
  }
  if (project.name) {
    const named = resolve(base, String(project.name));
    if (isDir(named)) return named;
  }
  return null;
}

function projectNameOf(project, dir) {
  if (project && typeof project === 'object' && project.name) return String(project.name);
  if (typeof project === 'string' && project && !isAbsolute(project) && !project.includes('/') && !project.includes('\\')) {
    return project;
  }
  const posix = toPosix(dir);
  const at = posix.lastIndexOf('/');
  return at === -1 ? posix : posix.slice(at + 1);
}

function resolveDocDir(root, project) {
  const base = root ? resolve(String(root)) : process.cwd();
  return explicitProjectDir(project, base) || base;
}

function findProjectId(db, project) {
  if (!project) return null;
  if (typeof project === 'string') {
    const row = db.prepare('SELECT id FROM projects WHERE name = ?').get(project);
    return row ? row.id : null;
  }
  if (typeof project !== 'object') return null;
  if (Number.isInteger(project.id)) return project.id;
  if (Number.isInteger(project.project_id)) return project.project_id;
  if (project.name) {
    const row = db.prepare('SELECT id FROM projects WHERE name = ?').get(String(project.name));
    if (row) return row.id;
  }
  return null;
}

function ensureProjectRow(db, name, dir) {
  const byName = db.prepare('SELECT id FROM projects WHERE name = ?').get(String(name));
  if (byName) return byName.id;
  const byPath = db.prepare('SELECT id FROM projects WHERE path = ?').get(String(dir));
  if (byPath) return byPath.id;
  const info = db.prepare(
    'INSERT INTO projects(name, path, kind, added_at) VALUES (?, ?, ?, ?)',
  ).run(String(name), String(dir), 'dir', nowISO());
  return Number(info.lastInsertRowid);
}

function projectContext(db, project) {
  let dir = explicitProjectDir(project, process.cwd());
  let name = projectNameOf(project, dir || process.cwd());
  let id = findProjectId(db, project);
  if (!dir && id != null) {
    const row = db.prepare('SELECT name, path FROM projects WHERE id = ?').get(id);
    if (row) {
      name = row.name;
      dir = absOf(process.cwd(), row.path);
    }
  }
  if (!dir) dir = process.cwd();
  if (id == null) id = ensureProjectRow(db, name, dir);
  return { id, name, dir };
}

// ---------------------------------------------------------------------------
// registry lookup (classification authority)

const registryCache = new Map();

function registryPathFor(dir) {
  let current = resolve(String(dir || process.cwd()));
  for (let i = 0; i < 5; i++) {
    const candidate = join(current, 'hq', 'registry', 'agentic-file-registry.v1.json');
    if (existsSync(candidate)) return candidate;
    const parent = resolve(current, '..');
    if (parent === current) break;
    current = parent;
  }
  const cwdCandidate = join(resolve(process.cwd()), 'hq', 'registry', 'agentic-file-registry.v1.json');
  return existsSync(cwdCandidate) ? cwdCandidate : null;
}

function registryFor(dir) {
  const path = registryPathFor(dir);
  if (!path) return null;
  if (registryCache.has(path)) return registryCache.get(path);
  let registry = null;
  const root = resolve(path, '..', '..', '..');
  try { registry = loadRegistry(root); } catch { registry = null; }
  if (!registry) {
    try { registry = JSON.parse(readFileSync(path, 'utf8')); } catch { registry = null; }
  }
  registryCache.set(path, registry);
  return registry;
}

// ---------------------------------------------------------------------------
// classification

function fallbackFamily(relPath) {
  const path = normalizePath(relPath).toLowerCase();
  const name = baseName(path);
  if (!name) return '00';

  for (const code of FAMILY_CODES) {
    for (const pattern of DOCUMENT_FAMILIES[code].patterns) {
      if (pattern.includes('*') || pattern.includes('/')) continue;
      if (pattern === name) return code;
    }
  }
  for (const code of FAMILY_CODES) {
    for (const pattern of DOCUMENT_FAMILIES[code].patterns) {
      if (!pattern.includes('*') && !pattern.includes('/')) continue;
      let re;
      try { re = globToRegExp(pattern); } catch { continue; }
      if (re.test(path) || re.test(name)) return code;
    }
  }
  return '00';
}

function classifyDocument(registry, relPath) {
  const cls = registry ? classifyPath(registry, relPath) : null;
  const mapped = Boolean(cls && cls.mapped === true && cls.family && cls.family !== '00');
  const family = mapped ? cls.family : fallbackFamily(relPath);
  const meta = DOCUMENT_FAMILIES[family] || null;
  const authority = mapped && cls.authority ? String(cls.authority) : 'project_observed';
  return {
    family,
    familyName: meta ? meta.name : (cls?.familyName || 'Unclassified'),
    role: (mapped && cls.role) || meta?.role || 'unclassified',
    authority: DOCUMENT_AUTHORITY.includes(authority) ? authority : 'project_observed',
    typeId: cls?.typeId ?? null,
    confidence: cls?.confidence ?? 0,
    mapped,
  };
}

function lifecycleFor(relPath) {
  const path = normalizePath(relPath).toLowerCase();
  const segments = path.split('/');
  const name = segments[segments.length - 1] || '';
  if (segments.some((segment) => GENERATED_SEGMENTS.has(segment)) || name.endsWith('.generated.md')) {
    return 'generated';
  }
  if (segments.some((segment) => ARCHIVE_SEGMENTS.has(segment))) return 'historical';
  return 'current';
}

function originTypeFor(lifecycle) {
  // Provenance of the artifact itself: donor/archived material is a
  // reconstruction, everything else is an observed repository file. A proposed
  // naming convention does not change where the file came from.
  if (lifecycle === 'historical') return 'conversation_reconstruction';
  return 'repository_file';
}

// ---------------------------------------------------------------------------
// document parsing

function parseFrontmatter(text) {
  const lines = splitLines(text);
  const meta = {};
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
    const value = match[2].trim();
    if (!value) {
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

// Minimal YAML mapping reader: top-level `key: value`, folded lists with `- `
// items and inline `[a, b]` arrays. No YAML dependency, no anchors, no nesting.
function parseYamlMapping(text) {
  const meta = {};
  const lines = splitLines(text);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const match = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (!value) {
      const items = [];
      let j = i + 1;
      while (j < lines.length) {
        const item = /^\s*-\s+(.*)$/.exec(lines[j]);
        if (!item) break;
        items.push(stripQuotes(item[1]));
        j++;
      }
      if (items.length) { meta[key] = items; i = j - 1; }
      continue;
    }
    if (value.startsWith('[') && value.endsWith(']')) meta[key] = parseListValue(value);
    else if (value === '|' || value === '>') {
      const parts = [];
      let j = i + 1;
      while (j < lines.length && /^\s{2,}\S/.test(lines[j])) { parts.push(lines[j].trim()); j++; }
      meta[key] = parts.join(' ');
      i = j - 1;
    } else {
      meta[key] = stripQuotes(value);
    }
  }
  return meta;
}

function titleOf(text, relPath) {
  const { meta, endLine } = parseFrontmatter(text);
  if (meta.title) return cleanText(meta.title, 200);
  const lines = splitLines(text);
  const start = endLine >= 0 ? endLine + 1 : 0;
  for (let i = start; i < Math.min(lines.length, start + 40); i++) {
    const match = /^\s{0,3}#\s+(.+?)\s*#*\s*$/.exec(lines[i]);
    if (match) return cleanText(match[1], 200);
  }
  return cleanText(baseName(relPath).replace(/\.(md|mdx|markdown|ya?ml)$/i, ''), 200) || baseName(relPath);
}

function ownerOf(text) {
  const { meta } = parseFrontmatter(text);
  if (meta.owner) return cleanText(meta.owner, 120) || null;
  const match = /@hq:owner\s*(?:\(([^)]+)\)|:\s*([^\n*]+))/i.exec(text);
  if (!match) return null;
  const value = cleanText(match[1] || match[2] || '', 120);
  return value || null;
}

// binds_to — source anchors a document claims. Line anchors are recorded so
// drift can be detected without reading the whole document again.
const SEE_LINE_RE = /@hq:see\s+(?!(?:doc|decision|canon):)([\w./-]+\.[A-Za-z0-9]+)(?::(\d+)(?:-(\d+))?)?/i;
const INLINE_REF_RE = /(?:^|[\s(`'"[])((?:[\w.-]+\/)+[\w.-]+\.[A-Za-z0-9]+)(?::(\d+)(?:-(\d+))?)?/gm;

// A real annotation is a single `@hq:` tag inside a comment (or alone on a
// line). Protocol listings, prose and code strings mention several tags at
// once and are not annotations.
const TAG_PREFIX_RE = /^\s*(?:(?:\/\/+|#+|\/\*+|\*+|<!--|--+|;+|%+)\s*)?$/;
const TAG_ANY_RE = /@hq:[a-z]+/gi;
const TAG_TARGET_RE = /@hq:(see|why|invariant|feature)\b/i;

function tagLines(text) {
  const lines = splitLines(text);
  const out = [];
  let fenced = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s{0,3}(?:```|~~~)/.test(line)) { fenced = !fenced; continue; }
    if (fenced) continue;
    out.push({ index: i, line });
  }
  return out;
}

function singleTag(line) {
  const tags = [...line.matchAll(TAG_ANY_RE)];
  if (tags.length !== 1) return null;
  const target = TAG_TARGET_RE.exec(line);
  if (!target) return null;
  if (!TAG_PREFIX_RE.test(line.slice(0, target.index))) return null;
  return target[1].toLowerCase();
}

function addBind(map, dir, ownPath, rawPath, start, end) {
  const rel = normalizePath(rawPath);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) return;
  if (rel === ownPath || isSecretPath(rel)) return;
  const abs = join(dir, rel);
  if (!isFile(abs)) return;
  const lineStart = Number(start) > 0 ? Number(start) : 1;
  const lineEnd = Number(end) > 0 ? Math.max(Number(end), lineStart) : lineStart;
  const key = `${rel}\0${lineStart}\0${lineEnd}`;
  if (map.has(key)) return;
  map.set(key, { path: rel, lines: [lineStart, lineEnd], sha256: fileHash(abs) });
}

function bindsTo(dir, relPath, text) {
  const found = new Map();
  for (const { line } of tagLines(text)) {
    if (singleTag(line) !== 'see') continue;
    const match = SEE_LINE_RE.exec(line);
    if (!match) continue;
    addBind(found, dir, relPath, match[1], match[2], match[3]);
  }
  for (const match of String(text).matchAll(INLINE_REF_RE)) {
    addBind(found, dir, relPath, match[1], match[2], match[3]);
  }
  return [...found.values()]
    .sort((a, b) => cmpStr(a.path, b.path) || a.lines[0] - b.lines[0] || a.lines[1] - b.lines[1])
    .slice(0, BIND_CAP);
}

// ---------------------------------------------------------------------------
// document scan

function rootDocPaths(dir) {
  const out = [];
  const names = [
    'AGENTS.md', 'DECISIONS.md', 'DECISION_LOG.md', 'ADR.md', 'CONFLICT-REGISTER.md',
    'CHANGE-REQUEST.md', 'CANON-DICTIONARY.md', 'CANON.md', 'GLOSSARY.md', 'INVARIANTS.md',
  ];
  for (const name of names) {
    if (isFile(join(dir, name))) out.push(name);
  }
  for (const [dirName, exts] of [['ADR', ADR_EXTS], ['docs/adr', ADR_EXTS], ['docs/decisions', ADR_EXTS], ['docs/canon', MD_EXTS]]) {
    const absDir = join(dir, dirName);
    for (const name of listFiles(absDir, exts)) out.push(`${dirName}/${name}`);
  }
  return out;
}

function discoveredDocPaths(dir, entries = null) {
  const list = entries || discoveryFor(dir);
  const out = [];
  for (const entry of list) {
    const rel = toPosix(entry.rel);
    const lower = rel.toLowerCase();
    if (MD_EXTS.some((ext) => lower.endsWith(ext))) out.push(rel);
  }
  return out;
}

function discoveryFor(dir) {
  try { return discoverFiles(dir); } catch { return []; }
}

function scanDocPaths(dir, entries = null) {
  const seen = new Set();
  const out = [];
  for (const rel of [...rootDocPaths(dir), ...discoveredDocPaths(dir, entries)]) {
    const path = normalizePath(rel);
    if (!path || seen.has(path) || isSecretPath(path)) continue;
    seen.add(path);
    out.push(path);
  }
  return out.sort(cmpStr);
}

function buildDocument(dir, relPath, registry) {
  const abs = join(dir, relPath);
  const text = readText(abs);
  if (text == null) return null;
  const cls = classifyDocument(registry, relPath);
  const lifecycle = lifecycleFor(relPath);
  const authority = lifecycle === 'historical' ? 'historical' : cls.authority;
  return {
    path: relPath,
    family: cls.family,
    family_name: cls.familyName,
    role: cls.role,
    authority,
    lifecycle,
    origin_type: originTypeFor(lifecycle),
    title: titleOf(text, relPath),
    owner: ownerOf(text),
    hash: fileHash(abs) || sha256(text),
    mtime_ms: Math.floor(statOf(abs)),
    last_verified: null,
    binds_to: bindsTo(dir, relPath, text),
  };
}

export function scanDocuments(root = process.cwd(), project = null) {
  const dir = resolveDocDir(root, project);
  const registry = registryFor(dir);
  const entries = discoveryFor(dir);
  const out = [];
  for (const rel of scanDocPaths(dir, entries)) {
    const doc = buildDocument(dir, rel, registry);
    if (doc) out.push(doc);
  }
  return out;
}

// ---------------------------------------------------------------------------
// document indexing

const DOCUMENT_UPSERT = `
INSERT INTO documents(
  project_id, path, family, family_name, role, authority, lifecycle, origin_type,
  title, owner, hash, mtime_ms, last_verified, binds_to
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(project_id, path) DO UPDATE SET
  family = excluded.family,
  family_name = excluded.family_name,
  role = excluded.role,
  authority = excluded.authority,
  lifecycle = excluded.lifecycle,
  origin_type = excluded.origin_type,
  title = excluded.title,
  owner = excluded.owner,
  hash = excluded.hash,
  mtime_ms = excluded.mtime_ms,
  last_verified = excluded.last_verified,
  binds_to = excluded.binds_to
`;

function documentComparable(row) {
  return JSON.stringify([
    row.family, row.family_name, row.role, row.authority, row.lifecycle,
    row.origin_type, row.title, row.owner, row.hash, row.binds_to,
  ]);
}

export function indexDocuments(db, project) {
  const { id: projectId, dir } = projectContext(db, project);
  const documents = scanDocuments(dir, null);

  return transaction(db, () => {
    const priorRows = db.prepare('SELECT * FROM documents WHERE project_id = ?').all(projectId);
    const prior = new Map(priorRows.map((row) => [row.path, row]));
    const upsert = db.prepare(DOCUMENT_UPSERT);
    const now = nowISO();
    const seen = new Set();
    let added = 0;
    let changed = 0;

    for (const doc of documents) {
      seen.add(doc.path);
      const binds = JSON.stringify(doc.binds_to);
      const existing = prior.get(doc.path);
      const candidate = {
        family: doc.family,
        family_name: doc.family_name,
        role: doc.role,
        authority: doc.authority,
        lifecycle: doc.lifecycle,
        origin_type: doc.origin_type,
        title: doc.title,
        owner: doc.owner,
        hash: doc.hash,
        binds_to: binds,
      };
      if (!existing) {
        upsert.run(
          projectId, doc.path, doc.family, doc.family_name, doc.role, doc.authority,
          doc.lifecycle, doc.origin_type, doc.title, doc.owner, doc.hash,
          doc.mtime_ms, now, binds,
        );
        added++;
        continue;
      }
      const same = documentComparable(existing) === documentComparable(candidate);
      if (same) continue;
      upsert.run(
        projectId, doc.path, doc.family, doc.family_name, doc.role, doc.authority,
        doc.lifecycle, doc.origin_type, doc.title, doc.owner, doc.hash,
        doc.mtime_ms, now, binds,
      );
      changed++;
    }

    let removed = 0;
    const del = db.prepare('DELETE FROM documents WHERE project_id = ? AND path = ?');
    for (const path of prior.keys()) {
      if (seen.has(path)) continue;
      del.run(projectId, path);
      removed++;
    }

    return { count: documents.length, added, changed, removed };
  });
}

// ---------------------------------------------------------------------------
// status and authority normalisation

function documentStatusOf(raw) {
  const value = String(raw ?? '').trim().toLowerCase().replace(/[._-]+/g, ' ').replace(/\s+/g, ' ');
  if (!value) return { status: 'proposed', claimed: null };
  if (value.startsWith('accept') || value.startsWith('approv') || value.startsWith('ratif') || value.startsWith('decided')) {
    // D-04: a document cannot promote itself. The claim is preserved in
    // evidence so lineage survives without granting `accepted`.
    return { status: 'proposed', claimed: cleanText(raw, 80) };
  }
  if (value.startsWith('reject') || value.startsWith('declin')) return { status: 'rejected', claimed: null };
  if (value.startsWith('supersed')) return { status: 'superseded', claimed: null };
  if (value.startsWith('deprecat')) return { status: 'deprecated', claimed: null };
  if (value.startsWith('observ')) return { status: 'observed', claimed: null };
  if (value === 'proposed' || value === 'draft' || value === 'pending' || value === 'open') {
    return { status: 'proposed', claimed: null };
  }
  return { status: 'proposed', claimed: cleanText(raw, 80) };
}

function termStatusOf(raw) {
  const value = String(raw ?? '').trim().toLowerCase();
  if (!value) return { status: 'provisional', claimed: null };
  if (value.startsWith('current') || value.startsWith('active')) {
    return { status: 'provisional', claimed: cleanText(raw, 80) };
  }
  if (value.startsWith('deprecat')) return { status: 'deprecated', claimed: null };
  if (value.startsWith('historic') || value.startsWith('archiv')) return { status: 'historical', claimed: null };
  if (value.startsWith('observ')) return { status: 'observed', claimed: null };
  return { status: 'provisional', claimed: null };
}

function normalizeAuthorityValue(raw, fallback = 'architecture') {
  const value = String(raw ?? '').trim().toLowerCase().replace(/[-\s]+/g, '_');
  if (!value) return fallback;
  if (value === 'owner') return 'architecture'; // owner authority needs confirmation
  if (value === 'agent' || value === 'agent_proposed') return 'agent_proposed';
  if (value === 'annotation' || value === 'source_annotation') return 'source_annotation';
  if (AUTHORITY.includes(value)) return value;
  return fallback;
}

function parseDate(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return null;
  const iso = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(value);
  if (iso) {
    const month = iso[2].padStart(2, '0');
    const day = iso[3].padStart(2, '0');
    return `${iso[1]}-${month}-${day}`;
  }
  const yearMonth = /^(\d{4})[-/](\d{1,2})$/.exec(value);
  if (yearMonth) return `${yearMonth[1]}-${yearMonth[2].padStart(2, '0')}-01`;
  return null;
}

function dateFromPath(relPath) {
  const name = baseName(relPath);
  const match = /((?:19|20)\d{2})[-_]?(\d{2})[-_]?(\d{2})/.exec(name);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

function decisionId(project, title, sourcePath) {
  return `dec_${sha256(`${project}\0${title}\0${sourcePath}`).slice(0, 24)}`;
}

function termId(project, term, sourcePath) {
  return `canon_${sha256(`${project}\0${term}\0${sourcePath}`).slice(0, 24)}`;
}

// ---------------------------------------------------------------------------
// decision extraction

function isDecisionPath(relPath) {
  const path = normalizePath(relPath).toLowerCase();
  if (DECISION_ROOT_FILES.has(baseName(path)) && !path.includes('/')) return true;
  return DECISION_PATH_RE.test(path);
}

function isCanonPath(relPath) {
  const path = normalizePath(relPath).toLowerCase();
  if (CANON_ROOT_FILES.has(baseName(path)) && !path.includes('/')) return true;
  return CANON_PATH_RE.test(path);
}

function isAdrPath(relPath) {
  const path = normalizePath(relPath).toLowerCase();
  return /^(?:adr|docs\/adr)\//.test(path) || baseName(path) === 'adr.md';
}

function isYamlPath(relPath) {
  const name = baseName(relPath);
  return name.endsWith('.yaml') || name.endsWith('.yml');
}

function evidenceEntry(relPath, hash, extra = {}) {
  const entry = { ref: relPath, sha256: hash ?? null };
  for (const key of Object.keys(extra).sort(cmpStr)) {
    if (extra[key] != null) entry[key] = extra[key];
  }
  return entry;
}

function makeDecision({
  project, sourcePath, title, statusInfo, authority, date, rationale,
  consequences, alternatives, supersedes = null, evidence, hash, line = 0,
}) {
  const cleanTitle = cleanText(title, 300);
  if (!cleanTitle) return null;
  return {
    id: decisionId(project, cleanTitle, sourcePath),
    project,
    source_path: sourcePath,
    title: cleanTitle,
    status: statusInfo.status,
    authority: normalizeAuthorityValue(authority, 'architecture'),
    date: date ?? null,
    rationale: rationale ? String(rationale).trim().slice(0, 4000) : null,
    consequences: consequences ? String(consequences).trim().slice(0, 4000) : null,
    alternatives: alternatives ? String(alternatives).trim().slice(0, 4000) : null,
    supersedes: supersedes || null,
    evidence,
    hash,
    valid_from: date ?? null,
    valid_to: null,
    recorded_at: null,
    line,
  };
}

function decisionHash(parts) {
  return sha256(parts.map((part) => String(part ?? '')).join('\0'));
}

const SECTION_SKIP = new Set([
  'status', 'context', 'context and problem statement', 'decision', 'decision outcome',
  'considered options', 'considered options and tradeoffs', 'consequences',
  'decision drivers', 'links', 'references', 'rationale', 'alternatives',
  'background', 'summary', 'open questions', 'notes', 'options', 'conflict register',
  'decisions', 'decision log', 'decision register', 'decision record', 'decision records',
  'resolved', 'history', 'changelog', 'appendix',
]);

const FIELD_ALIASES = {
  status: ['status', 'state'],
  date: ['date', 'decided', 'decided on', 'when'],
  authority: ['authority', 'decided by', 'decider', 'deciders'],
  rationale: ['rationale', 'context', 'why', 'reason', 'decision', 'outcome'],
  consequences: ['consequences', 'consequence', 'impact', 'effects'],
  alternatives: ['alternatives', 'considered options', 'considered', 'options'],
  supersedes: ['supersedes', 'replaces', 'superseded by'],
  owner: ['owner'],
};

function fieldKey(label) {
  const value = String(label ?? '').trim().toLowerCase().replace(/[.*_`]/g, '').replace(/\s+/g, ' ');
  for (const [key, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.includes(value)) return key;
  }
  return null;
}

function collectSections(lines) {
  const sections = new Map();
  const heads = [];
  for (let i = 0; i < lines.length; i++) {
    const match = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(lines[i]);
    if (!match) continue;
    heads.push({ index: i, level: match[1].length, text: cleanText(match[2], 200) });
  }
  for (let i = 0; i < heads.length; i++) {
    const head = heads[i];
    const next = heads[i + 1];
    const body = lines.slice(head.index + 1, next ? next.index : lines.length).join('\n').trim();
    const key = head.text.toLowerCase();
    if (!sections.has(key)) sections.set(key, { text: body, line: head.index + 2, level: head.level });
  }
  return sections;
}

function firstNonEmptyLine(text) {
  for (const line of splitLines(text)) {
    const trimmed = cleanText(line, 200);
    if (trimmed) return trimmed;
  }
  return '';
}

function firstHeadingText(lines) {
  for (const line of lines) {
    const match = /^\s{0,3}#\s+(.+?)\s*#*\s*$/.exec(line);
    if (match) return cleanText(match[1], 200);
  }
  return '';
}

function sectionValue(sections, ...names) {
  for (const name of names) {
    const entry = sections.get(name);
    if (entry) {
      const value = firstNonEmptyLine(entry.text);
      if (value) return { value, line: entry.line, text: entry.text };
    }
  }
  return null;
}

function madrDecision({ project, relPath, lines, meta, hash }) {
  const sections = collectSections(lines);
  const statusSection = sectionValue(sections, 'status');
  const outcome = sectionValue(sections, 'decision outcome', 'decision');
  const context = sectionValue(sections, 'context', 'context and problem statement', 'background');
  const consequences = sectionValue(sections, 'consequences', 'impact');
  const alternatives = sectionValue(sections, 'considered options', 'considered options and tradeoffs', 'options');
  if (!statusSection && !outcome && !context) return null;

  const statusInfo = documentStatusOf(statusSection?.value || meta.status || 'proposed');
  const title = (meta.title ? cleanText(meta.title, 200) : '')
    || firstHeadingText(lines)
    || cleanText(baseName(relPath).replace(/\.(md|mdx|markdown)$/i, ''), 200);
  return makeDecision({
    project,
    sourcePath: relPath,
    title,
    statusInfo,
    authority: meta.authority || 'architecture',
    date: parseDate(meta.date) || dateFromPath(relPath),
    rationale: context?.text || outcome?.text || '',
    consequences: consequences?.text || meta.consequences || '',
    alternatives: alternatives?.text || meta.alternatives || '',
    supersedes: meta.supersedes || null,
    evidence: [evidenceEntry(relPath, hash, { claimed: statusInfo.claimed, form: 'madr' })],
    hash: decisionHash([title, statusInfo.status, context?.text, outcome?.text, consequences?.text, alternatives?.text]),
    line: statusSection?.line || 1,
  });
}

function yadrDecision({ project, relPath, lines, meta, hash }) {
  const statusInfo = documentStatusOf(meta.status || meta.state || 'proposed');
  const title = (meta.title ? cleanText(meta.title, 200) : '')
    || firstHeadingText(lines)
    || cleanText(baseName(relPath).replace(/\.(md|mdx|markdown|ya?ml)$/i, ''), 200);
  const rationale = [meta.context, meta.decision].filter(Boolean).map((part) => String(part).trim()).join('\n\n');
  return makeDecision({
    project,
    sourcePath: relPath,
    title,
    statusInfo,
    authority: meta.authority || 'architecture',
    date: parseDate(meta.date || meta.decision_date),
    rationale,
    consequences: meta.consequences || meta.impact || '',
    alternatives: meta.alternatives || meta.considered || meta.options || '',
    supersedes: meta.supersedes || null,
    evidence: [evidenceEntry(relPath, hash, { claimed: statusInfo.claimed, form: 'yadr' })],
    hash: decisionHash([title, statusInfo.status, rationale, meta.consequences, meta.alternatives]),
    line: 1,
  });
}

function splitRow(line) {
  let value = String(line).trim();
  if (value.startsWith('|')) value = value.slice(1);
  if (value.endsWith('|')) value = value.slice(0, -1);
  return value.split('|').map((cell) => cell.trim());
}

function parseTables(lines) {
  const tables = [];
  for (let i = 0; i < lines.length - 1; i++) {
    if (!/^\s*\|/.test(lines[i])) continue;
    const separator = lines[i + 1];
    if (!/^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(separator) || !separator.includes('-')) continue;
    const headerCells = splitRow(lines[i]);
    const rows = [];
    let j = i + 2;
    while (j < lines.length && /^\s*\|/.test(lines[j])) {
      rows.push({ line: j + 1, cells: splitRow(lines[j]) });
      j++;
    }
    tables.push({ headerCells, rows, line: i + 1 });
    i = j - 1;
  }
  return tables;
}

const DECISION_COLUMNS = {
  id: ['id', 'ref', 'no', 'number', '#', 'dec', 'adr'],
  title: ['decision', 'title', 'summary', 'choice', 'outcome', 'name'],
  status: ['status', 'state'],
  date: ['date', 'decided', 'decided on', 'when'],
  authority: ['authority', 'decided by', 'decider', 'deciders'],
  rationale: ['rationale', 'why', 'context', 'reason'],
  consequences: ['consequences', 'consequence', 'impact', 'effects'],
  alternatives: ['alternatives', 'considered options', 'options', 'considered'],
  supersedes: ['supersedes', 'replaces', 'superseded by'],
};

const CANON_COLUMNS = {
  term: ['term', 'concept', 'word', 'phrase', 'name'],
  definition: ['working meaning', 'meaning', 'definition', 'description'],
  status: ['status', 'state'],
  contrasts: ['boundary', 'contrast', 'contrasts', 'non-equivalence', 'non-equivalences', 'not'],
  aliases: ['aliases', 'alias', 'also known as', 'aka', 'synonyms'],
  owner: ['owner'],
  lifecycle: ['lifecycle'],
  valid_from: ['date', 'from', 'since'],
};

function mapColumns(headerCells, mapping) {
  const keys = headerCells.map((cell) => String(cell).trim().toLowerCase().replace(/[*_`]/g, ''));
  const out = {};
  keys.forEach((key, index) => {
    for (const [field, aliases] of Object.entries(mapping)) {
      if (out[field] != null) continue;
      if (aliases.includes(key)) { out[field] = index; break; }
    }
  });
  return out;
}

function tableKind(headerCells) {
  const keys = headerCells.map((cell) => String(cell).trim().toLowerCase().replace(/[*_`]/g, ''));
  if (keys.some((key) => CANON_COLUMNS.term.includes(key))) return 'canon';
  if (keys.some((key) => key === 'decision' || key === 'title' || key === 'summary')) return 'decision';
  return null;
}

function tableDecisions({ project, relPath, lines, hash }) {
  const out = [];
  for (const table of parseTables(lines)) {
    if (tableKind(table.headerCells) !== 'decision') continue;
    const cols = mapColumns(table.headerCells, DECISION_COLUMNS);
    if (cols.title == null) continue;
    for (const row of table.rows) {
      const title = cleanText(row.cells[cols.title], 300);
      if (!title || /^[-: ]+$/.test(title)) continue;
      const statusInfo = documentStatusOf(cols.status != null ? row.cells[cols.status] : 'proposed');
      const date = parseDate(cols.date != null ? row.cells[cols.date] : '') || dateFromPath(relPath);
      const rationale = cols.rationale != null ? row.cells[cols.rationale] : '';
      const consequences = cols.consequences != null ? row.cells[cols.consequences] : '';
      const alternatives = cols.alternatives != null ? row.cells[cols.alternatives] : '';
      const rowText = row.cells.join(' | ');
      out.push(makeDecision({
        project,
        sourcePath: relPath,
        title,
        statusInfo,
        authority: cols.authority != null ? row.cells[cols.authority] : 'architecture',
        date,
        rationale,
        consequences,
        alternatives,
        supersedes: cols.supersedes != null ? cleanText(row.cells[cols.supersedes], 120) : null,
        evidence: [evidenceEntry(relPath, hash, { claimed: statusInfo.claimed, line: row.line, form: 'table' })],
        hash: decisionHash([rowText, statusInfo.status]),
        line: row.line,
      }));
    }
  }
  return out.filter(Boolean);
}

function headingDecisions({ project, relPath, lines, hash }) {
  const out = [];
  const heads = [];
  for (let i = 0; i < lines.length; i++) {
    const match = /^\s{0,3}(#{2,4})\s+(.+?)\s*#*\s*$/.exec(lines[i]);
    if (match) heads.push({ index: i, level: match[1].length, text: cleanText(match[2], 300) });
  }
  for (let h = 0; h < heads.length; h++) {
    const head = heads[h];
    const lower = head.text.toLowerCase();
    if (SECTION_SKIP.has(lower)) continue;
    const idLike = /^(?:(?:DEC|ADR|DR)[-_ ]?\d+|D-\d+)\b/i.test(head.text);
    const decisionWord = /\bdecision\b/i.test(lower);
    if (!idLike && !decisionWord) continue;

    const end = heads.slice(h + 1).find((next) => next.level <= head.level);
    const body = lines.slice(head.index + 1, end ? end.index : lines.length);
    const fields = {};
    for (let i = 0; i < body.length; i++) {
      const match = /^\s*[-*]?\s*\*{0,2}([A-Za-z][A-Za-z /()-]{1,40})\*{0,2}\s*:\s*(.+)$/.exec(body[i]);
      if (!match) continue;
      const key = fieldKey(match[1]);
      if (!key || fields[key] != null) continue;
      fields[key] = { value: cleanText(match[2], 400), line: head.index + 2 + i };
    }
    if (Object.keys(fields).length === 0) continue;

    const statusInfo = documentStatusOf(fields.status?.value || 'proposed');
    const date = parseDate(fields.date?.value) || dateFromPath(relPath);
    const title = head.text;
    out.push(makeDecision({
      project,
      sourcePath: relPath,
      title,
      statusInfo,
      authority: fields.authority?.value || 'architecture',
      date,
      rationale: fields.rationale?.value || '',
      consequences: fields.consequences?.value || '',
      alternatives: fields.alternatives?.value || '',
      supersedes: fields.supersedes?.value || null,
      evidence: [evidenceEntry(relPath, hash, { claimed: statusInfo.claimed, line: head.index + 1, form: 'heading' })],
      hash: decisionHash([title, statusInfo.status, fields.rationale?.value, fields.consequences?.value, fields.alternatives?.value]),
      line: head.index + 1,
    }));
  }
  return out.filter(Boolean);
}

function parseDecisionDocument({ project, relPath, text, hash }) {
  const lines = splitLines(text);
  const isYaml = isYamlPath(relPath);
  let meta = {};
  let bodyLines = lines;
  if (isYaml) {
    meta = parseYamlMapping(text);
  } else {
    const frontmatter = parseFrontmatter(text);
    meta = frontmatter.meta;
    bodyLines = frontmatter.endLine >= 0 ? lines.slice(frontmatter.endLine + 1) : lines;
  }

  const hasMadrSections = /^\s{0,3}#{2,4}\s+(status|context|decision outcome|considered options|consequences)\b/im.test(text);
  if (isAdrPath(relPath) && hasMadrSections) {
    const madr = madrDecision({ project, relPath, lines: bodyLines, meta, hash });
    if (madr) return [madr];
  }
  if (meta.status || meta.context || meta.decision) {
    const decision = yadrDecision({ project, relPath, lines, meta, hash });
    if (decision) return [decision];
  }
  if (isAdrPath(relPath)) {
    const madr = madrDecision({ project, relPath, lines: bodyLines, meta, hash });
    if (madr) return [madr];
  }
  return [
    ...tableDecisions({ project, relPath, lines: bodyLines, hash }),
    ...headingDecisions({ project, relPath, lines: bodyLines, hash }),
  ];
}

const WHY_RE = /@hq:why\b(?:\s*\(([^)]*)\))?\s*:?\s*(.*)$/i;

function annotationDecisions({ project, relPath, text, hash }) {
  const out = [];
  for (const { index, line } of tagLines(text)) {
    if (singleTag(line) !== 'why') continue;
    const match = WHY_RE.exec(line);
    if (!match) continue;
    const value = cleanText(match[2] || match[1] || '', 300);
    if (!value) continue;
    const statusInfo = { status: 'observed', claimed: null };
    out.push(makeDecision({
      project,
      sourcePath: relPath,
      title: value,
      statusInfo,
      authority: 'source_annotation',
      date: null,
      rationale: value,
      consequences: '',
      alternatives: '',
      evidence: [evidenceEntry(`${relPath}:${index + 1}`, hash, { form: 'annotation' })],
      hash: sha256(`${relPath}\0${index + 1}\0${value}`),
      line: index + 1,
    }));
  }
  return out.filter(Boolean);
}

function projectSourceFiles(dir, entries = null) {
  const list = entries || discoveryFor(dir);
  return list
    .filter((entry) => Number(entry.size) <= DOC_READ_CAP)
    .slice(0, ANNOTATION_SCAN_CAP)
    .map((entry) => toPosix(entry.rel))
    .sort(cmpStr);
}

function dedupeDecisions(list) {
  const byId = new Map();
  for (const decision of list) {
    if (!decision) continue;
    const prior = byId.get(decision.id);
    if (!prior) { byId.set(decision.id, decision); continue; }
    // Prefer the richer record; keep the anchor stable.
    const score = (d) => (d.rationale ? 2 : 0) + (d.consequences ? 1 : 0) + (d.alternatives ? 1 : 0);
    if (score(decision) > score(prior)) byId.set(decision.id, decision);
  }
  return [...byId.values()].sort((a, b) => (
    cmpStr(a.source_path, b.source_path) || (a.line || 0) - (b.line || 0) || cmpStr(a.id, b.id)
  ));
}

function extractDecisionsAt(dir, project) {
  const entries = discoveryFor(dir);
  const decisions = [];
  for (const relPath of scanDocPaths(dir, entries)) {
    if (!isDecisionPath(relPath)) continue;
    const text = readText(join(dir, relPath));
    if (text == null) continue;
    decisions.push(...parseDecisionDocument({ project, relPath, text, hash: sha256(text) }));
  }
  for (const relPath of projectSourceFiles(dir, entries)) {
    const text = readText(join(dir, relPath));
    if (text == null) continue;
    if (!text.includes('@hq:why')) continue;
    decisions.push(...annotationDecisions({ project, relPath, text, hash: sha256(text) }));
  }
  return dedupeDecisions(decisions);
}

export function extractDecisions({ root = process.cwd(), project = null } = {}) {
  const dir = resolveDocDir(root, project);
  return extractDecisionsAt(dir, projectNameOf(project, dir));
}

// ---------------------------------------------------------------------------
// decision indexing

const DECISION_UPSERT = `
INSERT INTO decisions(
  id, project_id, source_path, title, status, authority, date, rationale,
  consequences, alternatives, supersedes, evidence, hash, valid_from, valid_to,
  recorded_at, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  project_id = excluded.project_id,
  source_path = excluded.source_path,
  title = excluded.title,
  status = excluded.status,
  authority = excluded.authority,
  date = excluded.date,
  rationale = excluded.rationale,
  consequences = excluded.consequences,
  alternatives = excluded.alternatives,
  supersedes = excluded.supersedes,
  evidence = excluded.evidence,
  hash = excluded.hash,
  valid_from = excluded.valid_from,
  valid_to = excluded.valid_to,
  updated_at = excluded.updated_at
`;

const DECISION_COMPARE = [
  'source_path', 'title', 'status', 'authority', 'date', 'rationale',
  'consequences', 'alternatives', 'supersedes', 'evidence', 'hash',
  'valid_from', 'valid_to',
];

function sameRow(prior, next, fields) {
  return fields.every((field) => String(prior[field] ?? '') === String(next[field] ?? ''));
}

function decisionParams(projectId, decision, prior, now) {
  let status = decision.status;
  let authority = decision.authority;
  let validTo = decision.valid_to ?? null;
  // A recorded supersession link survives re-indexing even when the document
  // does not repeat it.
  let supersedes = decision.supersedes ?? prior?.supersedes ?? null;
  // Owner-confirmed and superseded history is never rewritten by re-indexing.
  if (prior && (prior.status === 'accepted' || prior.status === 'superseded')) {
    status = prior.status;
    authority = prior.authority;
    validTo = prior.valid_to ?? null;
    supersedes = prior.supersedes ?? supersedes;
  }
  return {
    id: decision.id,
    project_id: projectId,
    source_path: decision.source_path,
    title: decision.title,
    status,
    authority,
    date: decision.date ?? null,
    rationale: decision.rationale ?? null,
    consequences: decision.consequences ?? null,
    alternatives: decision.alternatives ?? null,
    supersedes,
    evidence: JSON.stringify(asArray(decision.evidence)),
    hash: decision.hash ?? null,
    valid_from: decision.valid_from ?? decision.date ?? null,
    valid_to: validTo,
    recorded_at: prior?.recorded_at ?? now,
    created_at: prior?.created_at ?? now,
    updated_at: now,
  };
}

export function indexDecisions(db, project) {
  const { id: projectId, name, dir } = projectContext(db, project);
  const decisions = extractDecisionsAt(dir, name);

  return transaction(db, () => {
    const priorRows = db.prepare('SELECT * FROM decisions WHERE project_id = ?').all(projectId);
    const prior = new Map(priorRows.map((row) => [row.id, row]));
    const upsert = db.prepare(DECISION_UPSERT);
    const now = nowISO();
    const seen = new Set();
    let added = 0;
    let changed = 0;

    for (const decision of decisions) {
      seen.add(decision.id);
      const existing = prior.get(decision.id) || null;
      const params = decisionParams(projectId, decision, existing, now);
      if (!existing) {
        upsert.run(
          params.id, params.project_id, params.source_path, params.title, params.status,
          params.authority, params.date, params.rationale, params.consequences,
          params.alternatives, params.supersedes, params.evidence, params.hash,
          params.valid_from, params.valid_to, params.recorded_at, params.created_at,
          params.updated_at,
        );
        added++;
        continue;
      }
      if (sameRow(existing, params, DECISION_COMPARE)) continue;
      upsert.run(
        params.id, params.project_id, params.source_path, params.title, params.status,
        params.authority, params.date, params.rationale, params.consequences,
        params.alternatives, params.supersedes, params.evidence, params.hash,
        params.valid_from, params.valid_to, params.recorded_at, params.created_at,
        params.updated_at,
      );
      changed++;
    }

    let removed = 0;
    const del = db.prepare('DELETE FROM decisions WHERE project_id = ? AND id = ?');
    for (const id of prior.keys()) {
      if (seen.has(id)) continue;
      del.run(projectId, id);
      removed++;
    }

    return { decisions: decisions.length, added, changed, removed };
  });
}

// ---------------------------------------------------------------------------
// CANON term extraction

function makeTerm({
  project, sourcePath, term, definition, statusInfo, owner = null,
  authority = 'architecture', aliases = [], contrasts = [], lifecycle = 'current',
  evidence, hash, validFrom = null, line = 0,
}) {
  const cleanTerm = cleanText(term, 120).replace(/[.:;,]+$/, '').trim();
  if (!cleanTerm) return null;
  const cleanDefinition = cleanText(definition, 600);
  const contrastList = [...new Set(asArray(contrasts).map((value) => cleanText(value, 300)).filter(Boolean))].sort(cmpStr);
  const aliasList = [...new Set(asArray(aliases).map((value) => cleanText(value, 80)).filter(Boolean))].sort(cmpStr);
  return {
    id: termId(project, cleanTerm, sourcePath),
    project,
    term: cleanTerm,
    definition: cleanDefinition || null,
    status: statusInfo.status,
    owner: owner ? cleanText(owner, 120) : null,
    authority: normalizeAuthorityValue(authority, 'architecture'),
    evidence,
    aliases: aliasList,
    contrasts: contrastList,
    lifecycle,
    source_path: sourcePath,
    hash,
    valid_from: validFrom,
    valid_to: null,
    recorded_at: null,
    line,
  };
}

function splitContrasts(definition) {
  const contrasts = [];
  const value = String(definition ?? '');
  if (value.includes('≠')) {
    for (const part of value.split('≠').slice(1)) {
      const cleaned = cleanText(part, 300);
      if (cleaned) contrasts.push(cleaned);
    }
  }
  const notMatch = /\b([A-Za-z][\w -]{1,60})\s+(?:is|are)\s+(?:not|never)\s+([\w -]{1,60})/i.exec(value);
  if (notMatch) contrasts.push(`${cleanText(notMatch[1], 60)} is not ${cleanText(notMatch[2], 60)}`);
  return contrasts;
}

function tableTerms({ project, relPath, lines, hash }) {
  const out = [];
  for (const table of parseTables(lines)) {
    if (tableKind(table.headerCells) !== 'canon') continue;
    const cols = mapColumns(table.headerCells, CANON_COLUMNS);
    if (cols.term == null) continue;
    for (const row of table.rows) {
      const term = cleanText(row.cells[cols.term], 120);
      if (!term || /^[-: ]+$/.test(term)) continue;
      const definition = cols.definition != null ? row.cells[cols.definition] : '';
      const statusInfo = termStatusOf(cols.status != null ? row.cells[cols.status] : 'provisional');
      const boundary = cols.contrasts != null ? row.cells[cols.contrasts] : '';
      const contrasts = [...splitContrasts(definition), ...splitContrasts(boundary)];
      if (boundary && !contrasts.includes(cleanText(boundary, 300))) contrasts.push(cleanText(boundary, 300));
      const aliases = cols.aliases != null ? parseListValue(row.cells[cols.aliases]) : [];
      const rowText = row.cells.join(' | ');
      out.push(makeTerm({
        project,
        sourcePath: relPath,
        term,
        definition,
        statusInfo,
        owner: cols.owner != null ? row.cells[cols.owner] : null,
        authority: 'architecture',
        aliases,
        contrasts,
        lifecycle: cols.lifecycle != null ? cleanText(row.cells[cols.lifecycle], 40) : 'current',
        evidence: [evidenceEntry(relPath, hash, { claimed: statusInfo.claimed, line: row.line, form: 'table' })],
        hash: sha256(`${relPath}\0${rowText}`),
        validFrom: cols.valid_from != null ? parseDate(row.cells[cols.valid_from]) : null,
        line: row.line,
      }));
    }
  }
  return out.filter(Boolean);
}

const BOLD_BULLET_RE = /^\s*[-*]\s+\*\*(.+?)\*\*\s*(?:[—–:-]\s*)(.+)$/;
const PLAIN_BULLET_RE = /^\s*[-*]\s+([A-Z][\w .'’/-]{1,60}?)\s+[—–]\s+(.+)$/;
const DEFINITION_LINE_RE = /^\s*:\s+(.+)$/;

function bulletTerms({ project, relPath, lines, hash }) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let term = null;
    let definition = null;
    const bold = BOLD_BULLET_RE.exec(line);
    if (bold) {
      term = bold[1];
      definition = bold[2];
    } else {
      const plain = PLAIN_BULLET_RE.exec(line);
      if (plain) {
        term = plain[1];
        definition = plain[2];
      } else if (/^\s*[-*]\s+\S/.test(line) && i + 1 < lines.length) {
        const next = DEFINITION_LINE_RE.exec(lines[i + 1]);
        if (next) {
          term = line.replace(/^\s*[-*]\s+/, '');
          definition = next[1];
        }
      }
    }
    if (!term || !definition) continue;
    const statusInfo = termStatusOf('provisional');
    out.push(makeTerm({
      project,
      sourcePath: relPath,
      term,
      definition,
      statusInfo,
      authority: 'architecture',
      contrasts: splitContrasts(definition),
      evidence: [evidenceEntry(relPath, hash, { line: i + 1, form: 'definition' })],
      hash: sha256(`${relPath}\0${cleanText(line, 400)}`),
      line: i + 1,
    }));
  }
  return out.filter(Boolean);
}

const INVARIANT_RE = /@hq:invariant\b(?:\s*\(([^)]*)\))?\s*:?\s*(.*)$/i;

function annotationTerms({ project, relPath, text, hash }) {
  const out = [];
  for (const { index, line } of tagLines(text)) {
    if (singleTag(line) !== 'invariant') continue;
    const match = INVARIANT_RE.exec(line);
    if (!match) continue;
    const value = cleanText(match[2] || match[1] || '', 300);
    if (!value) continue;
    const split = /^(.+?)\s+(?:≠|is not|is never)\s+(.+)$/i.exec(value);
    const term = split ? split[1] : value;
    const contrasts = split ? [value] : [];
    out.push(makeTerm({
      project,
      sourcePath: relPath,
      term,
      definition: value,
      statusInfo: { status: 'observed', claimed: null },
      authority: 'source_annotation',
      contrasts,
      lifecycle: 'observed',
      evidence: [evidenceEntry(`${relPath}:${index + 1}`, hash, { form: 'annotation' })],
      hash: sha256(`${relPath}\0${index + 1}\0${value}`),
      line: index + 1,
    }));
  }
  return out.filter(Boolean);
}

function dedupeTerms(list) {
  const byKey = new Map();
  for (const term of list) {
    if (!term) continue;
    const key = `${term.id}`;
    const prior = byKey.get(key);
    if (!prior) { byKey.set(key, term); continue; }
    const score = (t) => (t.definition ? 2 : 0) + (t.contrasts.length ? 1 : 0);
    if (score(term) > score(prior)) byKey.set(key, term);
  }
  return [...byKey.values()].sort((a, b) => (
    cmpStr(a.source_path, b.source_path) || (a.line || 0) - (b.line || 0) || cmpStr(a.term, b.term) || cmpStr(a.id, b.id)
  ));
}

function extractCanonTermsAt(dir, project) {
  const entries = discoveryFor(dir);
  const terms = [];
  for (const relPath of scanDocPaths(dir, entries)) {
    if (!isCanonPath(relPath)) continue;
    const text = readText(join(dir, relPath));
    if (text == null) continue;
    const hash = sha256(text);
    const lines = splitLines(text);
    terms.push(...tableTerms({ project, relPath, lines, hash }));
    terms.push(...bulletTerms({ project, relPath, lines, hash }));
    terms.push(...annotationTerms({ project, relPath, text, hash }));
  }
  for (const relPath of projectSourceFiles(dir, entries)) {
    const text = readText(join(dir, relPath));
    if (text == null) continue;
    if (!text.includes('@hq:invariant')) continue;
    terms.push(...annotationTerms({ project, relPath, text, hash: sha256(text) }));
  }
  return dedupeTerms(terms);
}

export function extractCanonTerms({ root = process.cwd(), project = null } = {}) {
  const dir = resolveDocDir(root, project);
  return extractCanonTermsAt(dir, projectNameOf(project, dir));
}

// ---------------------------------------------------------------------------
// CANON indexing

const TERM_UPSERT = `
INSERT INTO canon_terms(
  id, project_id, term, definition, status, owner, authority, evidence, aliases,
  contrasts, lifecycle, source_path, hash, valid_from, valid_to, recorded_at,
  created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  project_id = excluded.project_id,
  term = excluded.term,
  definition = excluded.definition,
  status = excluded.status,
  owner = excluded.owner,
  authority = excluded.authority,
  evidence = excluded.evidence,
  aliases = excluded.aliases,
  contrasts = excluded.contrasts,
  lifecycle = excluded.lifecycle,
  source_path = excluded.source_path,
  hash = excluded.hash,
  valid_from = excluded.valid_from,
  valid_to = excluded.valid_to,
  updated_at = excluded.updated_at
`;

const TERM_COMPARE = [
  'term', 'definition', 'status', 'owner', 'authority', 'evidence', 'aliases',
  'contrasts', 'lifecycle', 'source_path', 'hash', 'valid_from', 'valid_to',
];

function termParams(projectId, term, prior, now) {
  let status = term.status;
  let authority = term.authority;
  let lifecycle = term.lifecycle;
  let validTo = term.valid_to ?? null;
  // Owner-confirmed and deprecated terms are never demoted by re-indexing.
  if (prior && (prior.status === 'current' || prior.status === 'deprecated')) {
    status = prior.status;
    authority = prior.authority;
    lifecycle = prior.lifecycle;
    validTo = prior.valid_to ?? null;
  }
  return {
    id: term.id,
    project_id: projectId,
    term: term.term,
    definition: term.definition ?? null,
    status,
    owner: term.owner ?? null,
    authority,
    evidence: JSON.stringify(asArray(term.evidence)),
    aliases: JSON.stringify(asArray(term.aliases)),
    contrasts: JSON.stringify(asArray(term.contrasts)),
    lifecycle,
    source_path: term.source_path,
    hash: term.hash ?? null,
    valid_from: term.valid_from ?? null,
    valid_to: validTo,
    recorded_at: prior?.recorded_at ?? now,
    created_at: prior?.created_at ?? now,
    updated_at: now,
  };
}

export function indexCanonTerms(db, project) {
  const { id: projectId, name, dir } = projectContext(db, project);
  const terms = extractCanonTermsAt(dir, name);

  return transaction(db, () => {
    const priorRows = db.prepare('SELECT * FROM canon_terms WHERE project_id = ?').all(projectId);
    const prior = new Map(priorRows.map((row) => [row.id, row]));
    const upsert = db.prepare(TERM_UPSERT);
    const now = nowISO();
    const seen = new Set();
    let added = 0;
    let changed = 0;

    for (const term of terms) {
      seen.add(term.id);
      const existing = prior.get(term.id) || null;
      const params = termParams(projectId, term, existing, now);
      if (!existing) {
        upsert.run(
          params.id, params.project_id, params.term, params.definition, params.status,
          params.owner, params.authority, params.evidence, params.aliases,
          params.contrasts, params.lifecycle, params.source_path, params.hash,
          params.valid_from, params.valid_to, params.recorded_at, params.created_at,
          params.updated_at,
        );
        added++;
        continue;
      }
      if (sameRow(existing, params, TERM_COMPARE)) continue;
      upsert.run(
        params.id, params.project_id, params.term, params.definition, params.status,
        params.owner, params.authority, params.evidence, params.aliases,
        params.contrasts, params.lifecycle, params.source_path, params.hash,
        params.valid_from, params.valid_to, params.recorded_at, params.created_at,
        params.updated_at,
      );
      changed++;
    }

    let removed = 0;
    const del = db.prepare('DELETE FROM canon_terms WHERE project_id = ? AND id = ?');
    for (const id of prior.keys()) {
      if (seen.has(id)) continue;
      del.run(projectId, id);
      removed++;
    }

    return { terms: terms.length, added, changed, removed };
  });
}

// ---------------------------------------------------------------------------
// registers

function decisionRow(row) {
  return {
    id: row.id,
    project: row.project ?? null,
    source_path: row.source_path,
    title: row.title,
    status: row.status,
    authority: row.authority,
    date: row.date,
    rationale: row.rationale,
    consequences: row.consequences,
    alternatives: row.alternatives,
    supersedes: row.supersedes,
    evidence: safeJsonParse(row.evidence, []) || [],
    hash: row.hash,
    valid_from: row.valid_from,
    valid_to: row.valid_to,
    recorded_at: row.recorded_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function termRow(row) {
  return {
    id: row.id,
    project: row.project ?? null,
    term: row.term,
    definition: row.definition,
    status: row.status,
    owner: row.owner,
    authority: row.authority,
    evidence: safeJsonParse(row.evidence, []) || [],
    aliases: safeJsonParse(row.aliases, []) || [],
    contrasts: safeJsonParse(row.contrasts, []) || [],
    lifecycle: row.lifecycle,
    source_path: row.source_path,
    hash: row.hash,
    valid_from: row.valid_from,
    valid_to: row.valid_to,
    recorded_at: row.recorded_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function boundedLimit(value, fallback = 50) {
  const requested = Number(value);
  if (!Number.isFinite(requested)) return fallback;
  return Math.max(0, Math.min(1000, Math.trunc(requested)));
}

function queryClause(columns, query) {
  if (!query) return null;
  const text = String(query);
  const parts = columns.map((column) => `instr(lower(COALESCE(${column}, '')), lower(?)) > 0`);
  return { sql: `(${parts.join(' OR ')})`, params: columns.map(() => text) };
}

export function decisionRegister(db, { project = null, status = null, query = null, limit = 50 } = {}) {
  const where = [];
  const params = [];
  if (project) { where.push('p.name = ?'); params.push(String(project)); }
  if (status) { where.push('d.status = ?'); params.push(String(status)); }
  const clause = queryClause(['d.title', 'd.rationale', 'd.consequences', 'd.alternatives', 'd.source_path'], query);
  if (clause) { where.push(clause.sql); params.push(...clause.params); }
  const rows = db.prepare(
    `SELECT d.*, p.name AS project
       FROM decisions d
       JOIN projects p ON p.id = d.project_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY (d.date IS NULL), d.date DESC, d.valid_from IS NULL, d.valid_from DESC, d.id ASC
      LIMIT ?`,
  ).all(...params, boundedLimit(limit));
  return rows.map(decisionRow);
}

export function canonRegister(db, { project = null, status = null, query = null, limit = 50 } = {}) {
  const where = [];
  const params = [];
  if (project) { where.push('p.name = ?'); params.push(String(project)); }
  if (status) { where.push('c.status = ?'); params.push(String(status)); }
  const clause = queryClause(['c.term', 'c.definition', 'c.aliases', 'c.contrasts', 'c.source_path'], query);
  if (clause) { where.push(clause.sql); params.push(...clause.params); }
  const rows = db.prepare(
    `SELECT c.*, p.name AS project
       FROM canon_terms c
       JOIN projects p ON p.id = c.project_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY c.term COLLATE NOCASE ASC, c.id ASC
      LIMIT ?`,
  ).all(...params, boundedLimit(limit));
  return rows.map(termRow);
}

// ---------------------------------------------------------------------------
// owner-confirmation operations

function requireOwner(ownerConfirmed) {
  if (ownerConfirmed !== true) {
    throw new Error('OWNER_CONFIRMATION_REQUIRED: the owner must confirm this promotion explicitly');
  }
}

function loadDecision(db, id) {
  const row = db.prepare(
    'SELECT d.*, p.name AS project FROM decisions d JOIN projects p ON p.id = d.project_id WHERE d.id = ?',
  ).get(String(id));
  return row ? decisionRow(row) : null;
}

function loadTerm(db, id) {
  const row = db.prepare(
    'SELECT c.*, p.name AS project FROM canon_terms c JOIN projects p ON p.id = c.project_id WHERE c.id = ?',
  ).get(String(id));
  return row ? termRow(row) : null;
}

export function confirmDecision(db, { id, ownerConfirmed = false } = {}) {
  requireOwner(ownerConfirmed);
  const decision = loadDecision(db, id);
  if (!decision) throw new Error(`DECISION_NOT_FOUND: ${String(id)}`);
  db.prepare('UPDATE decisions SET status = ?, authority = ?, updated_at = ? WHERE id = ?')
    .run('accepted', 'owner', nowISO(), String(id));
  return loadDecision(db, id);
}

export function supersedeDecision(db, { id, by, ownerConfirmed = false } = {}) {
  requireOwner(ownerConfirmed);
  const old = loadDecision(db, id);
  if (!old) throw new Error(`DECISION_NOT_FOUND: ${String(id)}`);
  const next = loadDecision(db, by);
  if (!next) throw new Error(`DECISION_NOT_FOUND: ${String(by)}`);
  if (old.id === next.id) throw new Error(`DECISION_SELF_SUPERSEDE: ${old.id}`);

  const validTo = next.valid_from || next.date || nowISO().slice(0, 10);
  const at = nowISO();
  transaction(db, () => {
    // History is preserved: both rows remain, the old row keeps its content and
    // gains a validity end; the replacement points back at what it replaced.
    db.prepare('UPDATE decisions SET status = ?, valid_to = ?, supersedes = ?, updated_at = ? WHERE id = ?')
      .run('superseded', validTo, next.id, at, old.id);
    db.prepare('UPDATE decisions SET supersedes = ?, updated_at = ? WHERE id = ?')
      .run(old.id, at, next.id);
  });
  return { old: loadDecision(db, old.id), next: loadDecision(db, next.id) };
}

export function confirmTerm(db, { id, ownerConfirmed = false } = {}) {
  requireOwner(ownerConfirmed);
  const term = loadTerm(db, id);
  if (!term) throw new Error(`TERM_NOT_FOUND: ${String(id)}`);
  db.prepare('UPDATE canon_terms SET status = ?, authority = ?, lifecycle = ?, updated_at = ? WHERE id = ?')
    .run('current', 'owner', 'current', nowISO(), String(id));
  return loadTerm(db, id);
}

export function deprecateTerm(db, { id, ownerConfirmed = false } = {}) {
  requireOwner(ownerConfirmed);
  const term = loadTerm(db, id);
  if (!term) throw new Error(`TERM_NOT_FOUND: ${String(id)}`);
  const validTo = term.valid_to || nowISO().slice(0, 10);
  db.prepare('UPDATE canon_terms SET status = ?, lifecycle = ?, valid_to = ?, updated_at = ? WHERE id = ?')
    .run('deprecated', 'historical', validTo, nowISO(), String(id));
  return loadTerm(db, id);
}

// ---------------------------------------------------------------------------
// document health

function selectedProjects(db, root, projects) {
  const rows = db.prepare('SELECT id, name, path FROM projects ORDER BY name ASC, id ASC').all();
  const byName = new Map();
  for (const row of rows) {
    byName.set(row.name, { id: row.id, name: row.name, dir: absOf(root, row.path) });
  }
  if (Array.isArray(projects) && projects.length) {
    for (const entry of projects) {
      const name = typeof entry === 'string' ? entry : entry?.name;
      if (!name) continue;
      const abs = typeof entry === 'object' && entry
        ? absOf(root, entry.abs || entry.path)
        : null;
      const current = byName.get(name);
      if (current) { if (abs && isDir(abs)) current.dir = abs; }
      else byName.set(name, { id: null, name, dir: abs && isDir(abs) ? abs : null });
    }
    const wanted = new Set(projects.map((entry) => (typeof entry === 'string' ? entry : entry?.name)).filter(Boolean));
    return [...byName.values()].filter((project) => wanted.has(project.name)).sort((a, b) => cmpStr(a.name, b.name));
  }
  return [...byName.values()].sort((a, b) => cmpStr(a.name, b.name));
}

function healthDocs(db, names) {
  const rows = db.prepare(
    `SELECT d.*, p.name AS project
       FROM documents d
       JOIN projects p ON p.id = d.project_id
      ORDER BY p.name ASC, d.path ASC`,
  ).all();
  return rows.filter((row) => names.has(row.project));
}

function healthDecisions(db, names) {
  const rows = db.prepare(
    `SELECT d.*, p.name AS project
       FROM decisions d
       JOIN projects p ON p.id = d.project_id
      ORDER BY p.name ASC, d.id ASC`,
  ).all();
  return rows.filter((row) => names.has(row.project));
}

function healthTerms(db, names) {
  const rows = db.prepare(
    `SELECT c.*, p.name AS project
       FROM canon_terms c
       JOIN projects p ON p.id = c.project_id
      ORDER BY p.name ASC, c.id ASC`,
  ).all();
  return rows.filter((row) => names.has(row.project));
}

function parseBinds(value) {
  const parsed = safeJsonParse(value, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((bind) => bind && typeof bind === 'object' && bind.path);
}

export function documentHealth(db, { root = process.cwd(), projects = null } = {}) {
  const selected = selectedProjects(db, root, projects);
  const names = new Set(selected.map((project) => project.name));
  const dirs = new Map(selected.map((project) => [project.name, project.dir]));

  const docs = healthDocs(db, names);
  const decisions = healthDecisions(db, names);
  const terms = healthTerms(db, names);

  const byFamily = {};
  for (const code of FAMILY_CODES) byFamily[code] = 0;
  byFamily['00'] = 0;
  for (const doc of docs) {
    const code = String(doc.family ?? '00');
    byFamily[code] = (byFamily[code] || 0) + 1;
  }
  if (byFamily['00'] === 0) delete byFamily['00'];

  const missingFamilies = FAMILY_CODES.filter((code) => (byFamily[code] || 0) === 0);

  const referenced = new Set();
  for (const doc of docs) {
    for (const bind of parseBinds(doc.binds_to)) {
      referenced.add(`${doc.project}\0${normalizePath(bind.path)}`);
    }
  }
  const rootDocs = new Set(['agents.md', 'readme.md', 'claude.md', 'gemini.md']);
  const orphanDocs = docs
    .filter((doc) => !rootDocs.has(baseName(doc.path)))
    .filter((doc) => !referenced.has(`${doc.project}\0${normalizePath(doc.path)}`))
    .map((doc) => ({ project: doc.project, path: doc.path }))
    .sort((a, b) => cmpStr(a.project, b.project) || cmpStr(a.path, b.path));

  const staleDocs = [];
  for (const doc of docs) {
    const dir = dirs.get(doc.project);
    if (!dir) continue;
    const changed = [];
    const abs = join(dir, doc.path);
    let reason = 'reference_changed';
    if (isFile(abs)) {
      const current = fileHash(abs);
      if (doc.hash && current && current !== doc.hash) {
        reason = 'source_changed';
        changed.push({ ref: doc.path, expected: doc.hash, actual: current });
      }
    }
    for (const bind of parseBinds(doc.binds_to)) {
      const target = join(dir, bind.path);
      const current = isFile(target) ? fileHash(target) : null;
      const expected = bind.sha256 ?? null;
      if (!expected || current !== expected) {
        changed.push({ ref: bind.path, expected, actual: current });
      }
    }
    if (changed.length) {
      staleDocs.push({ project: doc.project, path: doc.path, reason, changed });
    }
  }
  staleDocs.sort((a, b) => cmpStr(a.project, b.project) || cmpStr(a.path, b.path));

  const byTitleHash = new Map();
  for (const doc of docs) {
    if (!doc.hash) continue;
    const key = `${String(doc.title ?? '').toLowerCase()}\0${doc.hash}`;
    if (!byTitleHash.has(key)) byTitleHash.set(key, []);
    byTitleHash.get(key).push({ project: doc.project, path: doc.path });
  }
  const duplicateDocs = [...byTitleHash.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({
      title: key.split('\0')[0],
      hash: key.split('\0')[1],
      docs: group.sort((a, b) => cmpStr(a.project, b.project) || cmpStr(a.path, b.path)),
    }))
    .sort((a, b) => cmpStr(a.title, b.title));

  const staleDecisions = [];
  for (const decision of decisions) {
    const dir = dirs.get(decision.project);
    if (!dir || !decision.source_path) continue;
    const evidence = safeJsonParse(decision.evidence, []) || [];
    const expected = Array.isArray(evidence) ? evidence.find((item) => item && item.sha256)?.sha256 : null;
    const abs = join(dir, decision.source_path);
    const current = isFile(abs) ? fileHash(abs) : null;
    if (!expected || current !== expected) {
      staleDecisions.push({
        id: decision.id, project: decision.project, title: decision.title,
        source_path: decision.source_path, expected, actual: current,
      });
    }
  }
  staleDecisions.sort((a, b) => cmpStr(a.project, b.project) || cmpStr(a.id, b.id));

  const staleTerms = [];
  for (const term of terms) {
    const dir = dirs.get(term.project);
    if (!dir || !term.source_path) continue;
    const evidence = safeJsonParse(term.evidence, []) || [];
    const expected = Array.isArray(evidence) ? evidence.find((item) => item && item.sha256)?.sha256 : null;
    const abs = join(dir, term.source_path);
    const current = isFile(abs) ? fileHash(abs) : null;
    if (!expected || current !== expected) {
      staleTerms.push({
        id: term.id, project: term.project, term: term.term,
        source_path: term.source_path, expected, actual: current,
      });
    }
  }
  staleTerms.sort((a, b) => cmpStr(a.project, b.project) || cmpStr(a.id, b.id));

  const conflicts = [];

  const termGroups = new Map();
  for (const term of terms) {
    const key = String(term.term ?? '').toLowerCase();
    if (!key) continue;
    if (!termGroups.has(key)) termGroups.set(key, []);
    termGroups.get(key).push(term);
  }
  for (const [key, group] of [...termGroups.entries()].sort((a, b) => cmpStr(a[0], b[0]))) {
    const sources = [...new Set(group.map((term) => term.source_path).filter(Boolean))].sort(cmpStr);
    if (sources.length > 1) {
      conflicts.push({
        kind: 'duplicate_term',
        a: group[0].term,
        b: sources.join(', '),
        message: `CANON term "${group[0].term}" is defined in ${sources.length} sources and was not merged`,
      });
    }
    for (const term of group) {
      if (!term.definition) {
        conflicts.push({
          kind: 'missing_definition',
          a: term.term,
          b: term.source_path || '',
          message: `CANON term "${term.term}" has no definition`,
        });
      }
    }
  }

  const acceptedGroups = new Map();
  for (const decision of decisions) {
    if (decision.status === 'superseded' && decision.supersedes === decision.id) {
      conflicts.push({
        kind: 'self_supersession',
        a: decision.id,
        b: decision.title,
        message: `Decision "${decision.title}" supersedes itself`,
      });
    }
    if (decision.status !== 'accepted') continue;
    const key = String(decision.title ?? '').trim().toLowerCase();
    if (!key) continue;
    if (!acceptedGroups.has(key)) acceptedGroups.set(key, []);
    acceptedGroups.get(key).push(decision);
  }
  for (const [key, group] of [...acceptedGroups.entries()].sort((a, b) => cmpStr(a[0], b[0]))) {
    if (group.length < 2) continue;
    conflicts.push({
      kind: 'contradictory_decision',
      a: group[0].title,
      b: group.map((decision) => decision.id).sort(cmpStr).join(', '),
      message: `${group.length} accepted decisions share the title "${group[0].title}"`,
    });
  }
  conflicts.sort((a, b) => cmpStr(a.kind, b.kind) || cmpStr(a.a, b.a) || cmpStr(a.b, b.b));

  return {
    authority: 'read_only_projection',
    notice: 'Documents, decisions and CANON terms never grant execution authority. HQ is read-only.',
    byFamily,
    missingFamilies,
    orphanDocs,
    staleDocs,
    duplicateDocs,
    staleDecisions,
    staleTerms,
    conflicts,
  };
}

// ---------------------------------------------------------------------------
// read-only capability-to-implementation projection (AII gap engine, HQ-036..038)
//
// HQ is read-only intelligence: these functions never execute, import or send.
// They answer three questions from the canon document inventory alone:
//
//   HQ-036  which documented capabilities have no matching implementation?
//   HQ-037  which Labs/research designs are already implemented elsewhere?
//   HQ-038  which research prototypes should be promoted into the product?
//
// The evidence is the document's own `binds_to` anchor set. An anchor is
// recorded only when the referenced file exists on disk, so an anchor is
// verified evidence, never a guess. All inputs are repo text only — no
// credentials, no private session content.

function readSourceFile(root, relPath) {
  return readText(join(root, relPath));
}

function normalizeWords(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function wordSet(text) {
  return new Set(normalizeWords(text));
}

// Stem-aware trigger: "capability", "capabilities", "implementing" and
// "implementation" all count. Whole-token equality would miss every one.
function hasStem(words, stem) {
  for (const word of words) {
    if (word === stem) return true;
    if (word.length > stem.length && word.startsWith(stem)) return true;
  }
  return false;
}

const CAPABILITY_STEMS = ['capabilit', 'implement', 'featur'];

// Source-file extensions that count as an implementation of a documented claim.
const IMPL_EXTS = new Set(['.mjs', '.js', '.ts', '.mts', '.cts', '.rs', '.py', '.go', '.java']);

// Main-product source roots: "implemented elsewhere" means implemented in the
// product, not inside the research/lab tree the design came from.
const PRODUCT_ROOTS = ['hq/', 'scripts/', 'vivim-core/', 'plugins/', 'kernel/', 'contracts/'];

function extOf(relPath) {
  const name = baseName(relPath);
  const at = name.lastIndexOf('.');
  return at === -1 ? '' : name.slice(at);
}

function isImplementationPath(relPath) {
  return IMPL_EXTS.has(extOf(relPath));
}

function isProductPath(relPath) {
  const path = normalizePath(relPath);
  return PRODUCT_ROOTS.some((prefix) => path.startsWith(prefix));
}

// Main-product source files, with their text: the reachability signal for
// HQ-038 is "the product's own code already points at this design".
function productSourceFiles(root) {
  const out = [];
  for (const prefix of PRODUCT_ROOTS) {
    const base = join(root, prefix);
    const stack = [base];
    while (stack.length) {
      const dir = stack.pop();
      let entries;
      try { entries = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const abs = join(dir, entry.name);
        if (entry.isDirectory()) { stack.push(abs); continue; }
        if (!entry.isFile()) continue;
        if (!isImplementationPath(entry.name)) continue;
        const text = readText(abs);
        if (text == null) continue;
        out.push({ path: normalizePath(abs.slice(resolve(String(root)).length + 1)), text });
      }
    }
  }
  return out;
}

// A design's own tree: a design under research/x/ is not "implemented
// elsewhere" by a file under research/x/.
function ownTreeOf(relPath) {
  const path = normalizePath(relPath);
  const at = path.lastIndexOf('/');
  return at === -1 ? '' : path.slice(0, at);
}

// The verified on-disk anchors of a document: binds_to entries are recorded
// only when the referenced file exists, so each one is real evidence.
function implementationAnchors(doc) {
  return (doc.binds_to || [])
    .map((bind) => normalizePath(bind.path))
    .filter((path) => path && isImplementationPath(path));
}

function productAnchors(doc) {
  return implementationAnchors(doc).filter(isProductPath);
}

// Documents that state a capability: canon family 08, or any document whose
// own text claims a capability/implemented feature.
function statesCapability(doc, text) {
  if (doc.family === '08') return true;
  const words = wordSet(`${doc.title || ''} ${text}`);
  return CAPABILITY_STEMS.some((stem) => hasStem(words, stem));
}

// Documented capability claims extracted from canon docs/terms/decisions.
function extractDocumentedCapabilities(root = process.cwd()) {
  const claims = [];
  const docs = scanDocuments(root, null);
  const docByPath = new Map(docs.map((doc) => [normalizePath(doc.path), doc]));
  for (const doc of docs) {
    const text = readSourceFile(root, doc.path);
    if (text == null) continue;
    if (!statesCapability(doc, text)) continue;
    claims.push({
      claim: doc.title || baseName(doc.path),
      where: doc.path,
      source: `canon:${doc.family || '00'}`,
      kind: 'documented',
      anchors: implementationAnchors(doc),
    });
  }
  // A term or decision is implemented where it is stated: if it was extracted
  // from a source file, that file is its implementation; if it was extracted
  // from a document, the document's own verified anchors are.
  const anchorsFor = (sourcePath) => {
    const path = normalizePath(sourcePath || '');
    if (!path) return [];
    if (isImplementationPath(path)) return [path];
    const doc = docByPath.get(path);
    return doc ? implementationAnchors(doc) : [];
  };
  // Canon terms that name capabilities.
  const terms = extractCanonTerms({ root, project: null });
  for (const term of terms) {
    const words = wordSet(`${term.term} ${term.definition || ''}`);
    if (!CAPABILITY_STEMS.some((stem) => hasStem(words, stem))) continue;
    claims.push({
      claim: term.term,
      where: term.source_path,
      source: 'canon:term',
      kind: 'term',
      anchors: anchorsFor(term.source_path),
    });
  }
  // Decisions about capabilities.
  const decisions = extractDecisions({ root, project: null });
  for (const decision of decisions) {
    const words = wordSet(`${decision.title} ${decision.rationale || ''} ${decision.consequences || ''}`);
    if (!CAPABILITY_STEMS.some((stem) => hasStem(words, stem))) continue;
    claims.push({
      claim: decision.title,
      where: decision.source_path,
      source: 'canon:decision',
      kind: 'decision',
      anchors: anchorsFor(decision.source_path),
    });
  }
  return claims;
}

/**
 * documentedCapabilitiesWithoutImplementation — HQ-036.
 *
 * A documented capability is a canon document/term/decision that states a
 * capability. An implementation is a source file the document verifiably
 * anchors to (binds_to records only paths that exist on disk). This returns
 * the documented capabilities that have no such implementation anchor.
 */
export function documentedCapabilitiesWithoutImplementation(root = process.cwd()) {
  const claims = extractDocumentedCapabilities(root);
  const unimplemented = claims.filter((claim) => claim.anchors.length === 0);
  return unimplemented.map((claim) => ({
    claim: claim.claim,
    where: claim.where,
    source: claim.source,
    kind: claim.kind,
    implementedBy: null,
  }));
}

// Labs and research designs, taken from the canon document inventory so each
// design carries its verified on-disk anchors.
function extractLabsDesigns(root = process.cwd()) {
  const designs = [];
  for (const doc of scanDocuments(root, null)) {
    const path = normalizePath(doc.path);
    if (!path.startsWith('docs/LABS/') && !path.startsWith('research/')) continue;
    designs.push({
      title: doc.title || baseName(path),
      where: path,
      tree: ownTreeOf(path),
      anchors: implementationAnchors(doc),
    });
  }
  return designs;
}

/**
 * labsDesignsImplementedElsewhere — HQ-037.
 *
 * A Labs/research design is "already implemented elsewhere" when it anchors to
 * an implementation file outside its own tree — i.e. the main product already
 * ships it. Anchors are on-disk verified (binds_to records only real paths).
 */
export function labsDesignsImplementedElsewhere(root = process.cwd()) {
  const designs = extractLabsDesigns(root);
  const out = [];
  for (const design of designs) {
    const elsewhere = design.anchors.filter((path) => {
      if (ownTreeOf(path) === design.tree) return false;
      return isProductPath(path);
    });
    if (!elsewhere.length) continue;
    out.push({
      design: design.title,
      where: design.where,
      implementedBy: elsewhere[0],
      implementations: elsewhere,
    });
  }
  return out.sort((a, b) => cmpStr(a.design, b.design));
}

/**
 * prototypePromotionCandidates — HQ-038.
 *
 * A research prototype is a promotion candidate when it is mature (its own
 * tree carries implementation code) and not already duplicated in the main
 * product (the product does not yet implement it). `reachable` records whether
 * main-product source already points at the design, so a candidate that is
 * already wired in is distinguishable from one that is not adopted yet.
 * All signals are read from verified on-disk evidence; nothing is executed,
 * imported or sent.
 */
export function prototypePromotionCandidates(root = process.cwd()) {
  const designs = extractLabsDesigns(root);
  const productSource = productSourceFiles(root);
  const out = [];
  for (const design of designs) {
    if (!design.where.startsWith('research/')) continue;
    const own = design.anchors.filter((path) => ownTreeOf(path) === design.tree);
    const product = design.anchors.filter((path) => isProductPath(path));
    const maturity = own.length ? 'mature' : product.length ? 'partial' : 'nascent';
    const reachable = productSource.some((file) => file.text.includes(design.where));
    const duplicated = product.length > 0;
    out.push({
      design: design.title,
      where: design.where,
      maturity,
      reachable,
      duplicated: duplicated ? product[0] : null,
      implementations: product,
      recommendPromotion: maturity === 'mature' && !duplicated,
    });
  }
  return out.sort((a, b) => cmpStr(a.where, b.where));
}

// ---------------------------------------------------------------------------
// safest-consolidation sequencing (HQ-080)
//
// A "duplicate system" is a CANON term (or document) that exists in more than
// one source. Consolidating it means keeping one source and rewiring the
// others. Safety = fewest dependents first: a system that nothing else binds to
// can be consolidated first with no collateral edits. Dependents are counted
// from documents.binds_to, i.e. real source anchors, never synthetic data.
//
// Returns { projects, groups } where groups are ordered by safety (fewest
// dependents first). This is read-only: it never merges, retires or rewrites
// anything. The caller (owner) decides which consolidation to apply.
export function consolidationSequence(db, { project = null, limit = 50 } = {}) {
  const rows = db.prepare(
    `SELECT c.*, p.name AS project
       FROM canon_terms c
       JOIN projects p ON p.id = c.project_id
      ${project ? 'WHERE p.name = ?' : ''}
      ORDER BY c.term COLLATE NOCASE ASC, c.source_path ASC, c.id ASC`,
  ).all(project ? String(project) : null);

  const docs = db.prepare(
    `SELECT d.*, p.name AS project
       FROM documents d
       JOIN projects p ON p.id = d.project_id
      ${project ? 'WHERE p.name = ?' : ''}`,
  ).all(project ? String(project) : null);

  // Group terms by case-insensitive term name.
  const byTerm = new Map();
  for (const row of rows) {
    const key = String(row.term ?? '').toLowerCase();
    if (!key) continue;
    if (!byTerm.has(key)) byTerm.set(key, []);
    byTerm.get(key).push(row);
  }

  // Index documents by project+path for dependent counting.
  const docsByPath = new Map();
  for (const doc of docs) {
    const key = `${String(doc.project ?? '')}\0${normalizePath(doc.path)}`;
    if (!docsByPath.has(key)) docsByPath.set(key, []);
    docsByPath.get(key).push(doc);
  }

  function dependentCount(relPath, projName) {
    const target = normalizePath(relPath);
    const prefix = `${String(projName ?? '')}\0`;
    let count = 0;
    for (const [docPath, docList] of docsByPath) {
      if (!docPath.startsWith(prefix)) continue;
      for (const doc of docList) {
        for (const bind of parseBinds(doc.binds_to)) {
          if (normalizePath(bind.path) === target) count += 1;
        }
      }
    }
    return count;
  }

  const groups = [];
  for (const [term, entries] of [...byTerm.entries()].sort((a, b) => cmpStr(a[0], b[0]))) {
    const sources = [...new Set(entries.map((e) => e.source_path).filter(Boolean))].sort(cmpStr);
    if (sources.length < 2) continue;

    // Project(s) this term lives in.
    const projNames = [...new Set(entries.map((e) => e.project).filter(Boolean))].sort(cmpStr);

    // Dependents per source path (within the same project scope).
    const perSource = [];
    for (const source of sources) {
      const sourceProj = entries.find((e) => e.source_path === source)?.project ?? null;
      let dc = 0;
      for (const projName of projNames) {
        dc += dependentCount(source, projName);
      }
      perSource.push({ source, dependents: dc });
    }
    perSource.sort((a, b) => a.dependents - b.dependents || cmpStr(a.source, b.source));

    groups.push({
      term,
      sources,
      sourceCount: sources.length,
      totalDependents: perSource.reduce((s, p) => s + p.dependents, 0),
      perSource,
      safestFirst: perSource.slice(),
    });
  }

  // Fewest total dependents first: consolidating the least-referenced duplicate
  // system first minimizes collateral rewiring across the whole sequence.
  groups.sort((a, b) => a.totalDependents - b.totalDependents || cmpStr(a.term, b.term));

  return {
    authority: 'read_only_projection',
    projects: project ? [String(project)] : null,
    groupCount: groups.length,
    groups: groups.slice(0, boundedLimit(limit)),
  };
}

// ---------------------------------------------------------------------------
// source-vs-manifest comparison (HQ-034)
//
// The build-manifest side of the documented-vs-implemented join. A build or
// packaging manifest lists the features a build ships; comparing it against the
// features source files claim to implement answers "Which source-code features
// are missing from the deployed application?" (HQ-034) — plus the reverse:
// what the manifest ships but no source implements.
//
// A source file claims an implemented feature with an @hq:feature annotation
// on its own comment line, e.g. `// @hq:feature cap.receipts-ledger`. The tag
// discipline matches the existing annotations (@hq:see / @hq:why /
// @hq:invariant): the tag must be the only @hq: tag on the line and sit in a
// comment position. Read-only: source text is read, nothing is executed,
// imported or sent; no live deployed instance is contacted.
const FEATURE_RE = /@hq:feature\b(?:\s*\(([^)]*)\))?\s*:?\s*(.*)$/i;

function featureClaimsInText(text) {
  const out = [];
  for (const { line } of tagLines(text)) {
    if (singleTag(line) !== 'feature') continue;
    const match = FEATURE_RE.exec(line);
    if (!match) continue;
    const feature = cleanText(match[2] || match[1] || '', 120);
    if (feature) out.push(feature);
  }
  return out;
}

/**
 * sourceVsManifest — HQ-034.
 *
 * Compares source-implemented features against a build/packaging manifest id
 * list. Source claims come from @hq:feature annotations in implementation
 * files (IMPL_EXTS); the manifest is the list of feature ids the build ships.
 * Returns the implemented set, the features implemented but not shipped
 * (missingFromDeployed — HQ-034's answer) and the reverse delta
 * (manifestOnly). An absent/empty manifest degrades to an explicit zero: it
 * reports what source implements without declaring everything missing.
 */
export function sourceVsManifest({ root = process.cwd(), manifest = [] } = {}) {
  const manifestIds = Array.isArray(manifest)
    ? [...new Set(manifest.map(String).filter(Boolean))]
    : [];
  const manifestSet = new Set(manifestIds);
  const implemented = [];
  const seen = new Set();
  const entries = discoveryFor(root);
  for (const entry of entries) {
    const rel = toPosix(entry.rel);
    if (!isImplementationPath(rel)) continue;
    const text = readText(join(root, rel));
    if (text == null) continue;
    for (const feature of featureClaimsInText(text)) {
      if (seen.has(feature)) continue;
      seen.add(feature);
      implemented.push({ feature, file: rel });
    }
  }
  implemented.sort((a, b) => cmpStr(a.feature, b.feature) || cmpStr(a.file, b.file));
  const compared = manifestIds.length > 0;
  // An absent/empty manifest degrades to an explicit zero: source claims are
  // still listed, but nothing is declared missing from a manifest that does
  // not exist — never "everything missing".
  const missingFromDeployed = compared
    ? implemented.filter((item) => !manifestSet.has(item.feature))
    : [];
  const manifestOnly = compared ? manifestIds.filter((id) => !seen.has(id)) : [];
  return {
    authority: 'read_only_projection',
    root,
    manifest: manifestIds,
    implemented,
    missingFromDeployed,
    manifestOnly,
    note: compared
      ? null
      : 'no build manifest provided: comparison skipped, nothing declared missing',
  };
}

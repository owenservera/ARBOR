/**
 * @hq:context VIVIM KB handover intake: classify an incoming KB package,
 *   record it with provenance, refuse secrets, stay idempotent.
 * @hq:owner hq
 * @hq:task lane-U
 * @hq:invariant An incoming KB is evidence, never authority. Decisions land
 *   `proposed`, CANON terms land `provisional`, and nothing inside a package
 *   can grant authority, confirm a decision or cause an effect.
 * @hq:invariant A refusal is a receipt, not an exception: a refused package
 *   writes nothing. One package is one transaction; an error rolls it back.
 * @hq:invariant The package digest is content-addressed over the manifest
 *   without `producedAt` plus the ordered file hashes. Timestamps live
 *   outside the digestible payload, so the same package always hashes the same.
 * @hq:see docs/VIVIM-KB-INTAKE.md
 * @hq:see hq/CONTRACT.md
 */
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';

import { extractCanonTerms, extractDecisions, scanDocuments } from './canon.mjs';
import { classifyPath, loadRegistry } from './filetypes.mjs';
import { addNote } from './memory.mjs';
import { loadProjects, registerProject, resolveProjectPath, storedPath } from './registry.mjs';
import { getMeta, setMeta, transaction } from './schema.mjs';
import { digestOf, nowISO, safeJsonParse, sha256, toPosix } from './util.mjs';

// ---------------------------------------------------------------------------
// contract constants
// ---------------------------------------------------------------------------

export const INTAKE_SCHEMA = 'hq.vivim-kb-intake/1';
const PACKAGE_SCHEMA = 'hq.vivim-kb/1';
const META_KEY = 'vivim.kb.intake';

const MAX_FILES = 4000;
const MAX_BYTES = 64 * 1024 * 1024;

// An incoming package may claim observation-level authority and nothing above.
const ALLOWED_AUTHORITIES = new Set(['project_observed', 'local_custom']);

// The landing status of every decision and every CANON term the package
// brings. Owner confirmation is the only path past these values.
const DECISION_STATUS = 'proposed';
const TERM_STATUS = 'provisional';
const PACKAGE_AUTHORITY = 'project_observed';

const DOCUMENT_AUTHORITIES = [
  'vendor_documented', 'project_observed', 'local_custom', 'proposed', 'historical',
];

// A KB document may declare its own kind through frontmatter `type: KB-…`, a
// leading `KB-…` marker, or its filename. The type decides which register owns
// the row; it never decides authority. Routed rows still pass through the same
// writers, which force `proposed` / `provisional` and `project_observed`.
const KB_TYPE_TARGETS = new Map([
  ['KB-DECISION', 'decision'],
  ['KB-VOCABULARY', 'term'],
  ['KB-TERM', 'term'],
  ['KB-CANON', 'term'],
  ['KB-PROJECT', 'project'],
]);

const KB_MARKER = 'KB-(?:DECISION|VOCABULARY|TERM|CANON|PROJECT)';
const KB_MARKER_RE = new RegExp(`\\b${KB_MARKER}\\b`, 'i');
const KB_LEADING_RE = new RegExp(`^(?:#{1,6}\\s*)?(?:\\[|\\()?(${KB_MARKER})\\b`, 'i');
const KB_TITLE_PREFIX_RE = new RegExp(`^${KB_MARKER}\\b\\s*[:\\u2014-]?\\s*`, 'i');

const SECRET_BASENAMES = new Set([
  'session.json', 'storage-state.json', 'release-profile.json', 'cookies', 'login data',
]);

const SECRET_CONTENT = [
  { id: 'sk-token', re: /sk-[A-Za-z0-9]{16,}/ },
  { id: 'private-key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { id: 'password-assignment', re: /password\s*=\s*\S+/i },
  { id: 'credential-assignment', re: /\b(?:api[_-]?key|secret|token|cookie|authorization)\s*[:=]\s*\S{8,}/i },
  { id: 'bearer-token', re: /\bBearer\s+[A-Za-z0-9._-]{20,}/ },
  { id: 'connection-string', re: /\b(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis|rediss|amqp|amqps|clickhouse|mssql|sqlserver):\/\/[^\s:@/]+:[^\s:@/]+@/i },
];

// ---------------------------------------------------------------------------
// deterministic helpers
// ---------------------------------------------------------------------------

const cmpStr = (a, b) => (a === b ? 0 : a < b ? -1 : 1);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeRelPath(value) {
  let path = toPosix(String(value ?? '')).trim();
  path = path.replace(/^\.\//, '');
  path = path.replace(/\/+/g, '/');
  path = path.replace(/^\/+/, '');
  path = path.replace(/\/+$/, '');
  return path;
}

function isUnsafePath(value) {
  const path = normalizeRelPath(value);
  if (!path) return true;
  if (path.split('/').some((segment) => segment === '..')) return true;
  return false;
}

function baseNameOf(value) {
  const path = normalizeRelPath(value);
  const at = path.lastIndexOf('/');
  return at === -1 ? path : path.slice(at + 1);
}

function stripRoot(path, root) {
  const prefix = normalizeRelPath(root);
  if (!prefix || prefix === '.') return path;
  if (path === prefix) return '';
  if (path.startsWith(`${prefix}/`)) return path.slice(prefix.length + 1);
  return path;
}

function isSecretPath(value) {
  const name = baseNameOf(value).toLowerCase();
  if (!name) return false;
  if (name.startsWith('.env')) return true;
  if (name.endsWith('.keystore')) return true;
  return SECRET_BASENAMES.has(name);
}

function secretContentHit(text) {
  const value = String(text ?? '');
  for (const rule of SECRET_CONTENT) {
    if (rule.re.test(value)) return rule.id;
  }
  return null;
}

function titleFallback(path) {
  return baseNameOf(path).replace(/\.[A-Za-z0-9]+$/, '') || baseNameOf(path);
}

function sameValue(a, b) {
  return String(a ?? '') === String(b ?? '');
}

function sameRow(prior, next, fields) {
  return fields.every((field) => sameValue(prior[field], next[field]));
}

// ---------------------------------------------------------------------------
// KB type routing
// ---------------------------------------------------------------------------

function cleanTitle(value, cap = 300) {
  return String(value ?? '').replace(/[*_`]+/g, '').replace(/\s+/g, ' ').trim().slice(0, cap);
}

function cleanField(value, cap = 4000) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, cap) : null;
}

function kbUnquote(value) {
  const text = String(value ?? '').trim();
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1);
  }
  return text;
}

/** Minimal frontmatter reader: top-level `key: value` pairs only. */
function kbFrontmatter(text) {
  const lines = String(text ?? '').split(/\r?\n/);
  const meta = {};
  if (lines[0]?.trim() !== '---') return { meta, bodyStart: 0 };
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { end = i; break; }
  }
  if (end === -1) return { meta, bodyStart: 0 };
  for (let i = 1; i < end; i++) {
    const match = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(lines[i]);
    if (!match) continue;
    meta[match[1].toLowerCase()] = kbUnquote(match[2]);
  }
  return { meta, bodyStart: end + 1 };
}

/** Which register owns this document, if it declares a KB type. */
function kbTypeOf(path, text) {
  const { meta, bodyStart } = kbFrontmatter(text);
  const declared = String(meta.type ?? '').trim().toUpperCase().replace(/[_\s]+/g, '-');
  if (KB_TYPE_TARGETS.has(declared)) {
    return { type: KB_TYPE_TARGETS.get(declared), marker: declared, via: 'frontmatter' };
  }
  const lines = String(text ?? '').split(/\r?\n/).slice(bodyStart);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = KB_LEADING_RE.exec(trimmed);
    if (match) {
      const marker = match[1].toUpperCase();
      return { type: KB_TYPE_TARGETS.get(marker), marker, via: 'marker' };
    }
    break;
  }
  const base = baseNameOf(path).replace(/\.[A-Za-z0-9]+$/, '');
  const match = KB_MARKER_RE.exec(base);
  if (match) {
    const marker = match[0].toUpperCase();
    return { type: KB_TYPE_TARGETS.get(marker), marker, via: 'filename' };
  }
  return null;
}

/** Title and body of a KB-typed document. The marker itself is not rationale. */
function kbParts(path, text) {
  const { meta, bodyStart } = kbFrontmatter(text);
  const lines = String(text ?? '').split(/\r?\n/).slice(bodyStart);
  let title = cleanTitle(meta.title, 300);
  if (!title) {
    for (const line of lines) {
      const match = /^\s{0,3}#\s+(.+?)\s*#*\s*$/.exec(line);
      if (match) { title = cleanTitle(match[1], 300); break; }
    }
  }
  if (!title) title = cleanTitle(titleFallback(path), 300);
  title = cleanTitle(title.replace(KB_TITLE_PREFIX_RE, ''), 300) || cleanTitle(titleFallback(path), 300);

  const body = [];
  let started = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!started) {
      if (!trimmed) continue;
      started = true;
      if (KB_LEADING_RE.test(trimmed)) continue;
      if (/^#{1,6}\s/.test(trimmed)) {
        const heading = cleanTitle(trimmed.replace(/^#{1,6}\s*/, ''), 300);
        if (heading.toLowerCase() !== title.toLowerCase()) body.push(line);
        continue;
      }
    }
    body.push(line);
  }
  return { meta, title, rationale: body.join('\n').trim().slice(0, 4000) };
}

function kbDate(value) {
  const match = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(String(value ?? '').trim());
  if (!match) return null;
  return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
}

function kbDateFromPath(path) {
  const match = /((?:19|20)\d{2})[-_]?(\d{2})[-_]?(\d{2})/.exec(baseNameOf(path));
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

// A status the document claims but cannot have: recorded as evidence, never
// applied. The writers force `proposed` / `provisional` regardless.
function claimedStatus(meta) {
  const raw = String(meta?.status ?? meta?.state ?? '').trim();
  if (!raw) return null;
  return /^(accept|approv|ratif|decided|current|active)/i.test(raw) ? cleanTitle(raw, 80) : null;
}

function decisionIdOf(project, title, sourcePath) {
  return `dec_${sha256(`${project}\0${title}\0${sourcePath}`).slice(0, 24)}`;
}

function termIdOf(project, term, sourcePath) {
  return `canon_${sha256(`${project}\0${term}\0${sourcePath}`).slice(0, 24)}`;
}

function listOf(value) {
  if (Array.isArray(value)) return value.map((item) => cleanTitle(item, 120)).filter(Boolean);
  const raw = String(value ?? '').trim();
  if (!raw) return [];
  if (raw.startsWith('[') && raw.endsWith(']')) {
    return raw.slice(1, -1).split(',').map((item) => cleanTitle(item, 120)).filter(Boolean);
  }
  return raw.split(',').map((item) => cleanTitle(item, 120)).filter(Boolean);
}

function kbDecisionRecord({ project, file, typeInfo }) {
  const { meta, title, rationale } = kbParts(file.path, file.text);
  const claimed = claimedStatus(meta);
  const date = kbDate(meta.date ?? meta.decided ?? meta.updated) ?? kbDateFromPath(file.path);
  const evidence = {
    ref: file.path,
    sha256: file.sha256,
    form: 'kb_type',
    marker: typeInfo.marker,
    via: typeInfo.via,
  };
  // Distinct from `claimed`: a KB-typed document is demoted, not refused, so
  // the routing evidence must not trip the canon-path claim refusal.
  if (claimed) evidence.status_claim = claimed;
  return {
    id: decisionIdOf(project, title, file.path),
    project,
    source_path: file.path,
    title,
    // Landing status is fixed: an incoming package cannot accept a decision.
    status: DECISION_STATUS,
    authority: PACKAGE_AUTHORITY,
    date,
    rationale: rationale || null,
    consequences: cleanField(meta.consequences),
    alternatives: cleanField(meta.alternatives),
    supersedes: meta.supersedes ? cleanTitle(meta.supersedes, 120) : null,
    evidence: [evidence],
    hash: sha256(`${file.path}\0${title}\0${rationale}`),
    valid_from: date,
    valid_to: null,
    recorded_at: null,
    line: 1,
  };
}

function splitTableRow(line) {
  let value = String(line).trim();
  if (value.startsWith('|')) value = value.slice(1);
  if (value.endsWith('|')) value = value.slice(0, -1);
  return value.split('|').map((cell) => cell.trim());
}

const TERM_TABLE_COLUMNS = {
  term: ['term', 'concept', 'word', 'phrase', 'name'],
  definition: ['working meaning', 'meaning', 'definition', 'description'],
  aliases: ['aliases', 'alias', 'also known as', 'aka', 'synonyms'],
  contrasts: ['boundary', 'contrast', 'contrasts', 'non-equivalence', 'non-equivalences'],
};

/** Term rows from markdown tables; empty when the document has no term table. */
function kbTermRows(text) {
  const lines = String(text ?? '').split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length - 1; i++) {
    if (!/^\s*\|/.test(lines[i])) continue;
    if (!/^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1]) || !lines[i + 1].includes('-')) continue;
    const header = splitTableRow(lines[i]).map((cell) => cell.toLowerCase().replace(/[*_`]/g, '').trim());
    const cols = {};
    header.forEach((key, index) => {
      for (const [field, aliases] of Object.entries(TERM_TABLE_COLUMNS)) {
        if (cols[field] == null && aliases.includes(key)) cols[field] = index;
      }
    });
    let j = i + 2;
    if (cols.term != null) {
      while (j < lines.length && /^\s*\|/.test(lines[j])) {
        const cells = splitTableRow(lines[j]);
        const term = cleanTitle(cells[cols.term], 200);
        if (term && !/^[-: ]+$/.test(term)) out.push({ term, cells, cols });
        j++;
      }
    }
    i = j - 1;
  }
  return out;
}

function kbTermRecords({ project, file, typeInfo }) {
  const { meta, title, rationale } = kbParts(file.path, file.text);
  const claimed = claimedStatus(meta);
  const make = (term, definition, aliases = [], contrasts = []) => {
    const cleanTerm = cleanTitle(term, 200);
    if (!cleanTerm) return null;
    const cleanDefinition = cleanField(definition);
    const evidence = {
      ref: file.path,
      sha256: file.sha256,
      form: 'kb_type',
      marker: typeInfo.marker,
      via: typeInfo.via,
    };
    if (claimed) evidence.status_claim = claimed;
    return {
      id: termIdOf(project, cleanTerm, file.path),
      project,
      term: cleanTerm,
      // Landing status is fixed: an incoming package cannot promote a term.
      status: TERM_STATUS,
      authority: PACKAGE_AUTHORITY,
      owner: meta.owner ? cleanTitle(meta.owner, 120) : null,
      definition: cleanDefinition,
      aliases,
      contrasts,
      lifecycle: 'current',
      source_path: file.path,
      hash: sha256(`${file.path}\0${cleanTerm}\0${cleanDefinition ?? ''}`),
      evidence: [evidence],
      valid_from: kbDate(meta.date ?? meta.valid_from ?? meta.since),
      valid_to: null,
      recorded_at: null,
      line: 1,
    };
  };

  const declaredTerm = cleanTitle(meta.term ?? meta.concept ?? '', 200);
  if (declaredTerm) {
    return [make(
      declaredTerm,
      meta.definition ?? meta.meaning ?? meta.description ?? rationale,
      listOf(meta.aliases),
      listOf(meta.contrasts ?? meta.boundary),
    )].filter(Boolean);
  }
  const rows = kbTermRows(file.text);
  if (rows.length) {
    return rows.map(({ term, cells, cols }) => make(
      term,
      cols.definition != null ? cells[cols.definition] : '',
      cols.aliases != null ? listOf(cells[cols.aliases]) : [],
      cols.contrasts != null ? listOf(cells[cols.contrasts]) : [],
    )).filter(Boolean);
  }
  // A one-term document: the title names the term, the body defines it.
  return [make(title, rationale)].filter(Boolean);
}

function kbProjectDeclaration({ file, typeInfo }) {
  const { meta, title } = kbParts(file.path, file.text);
  let declaredPath = String(meta.path ?? meta.project_path ?? meta.root ?? '').trim();
  if (!declaredPath) {
    const match = /^\s*(?:project\s+)?path\s*:\s*(.+)$/im.exec(file.text);
    if (match) declaredPath = kbUnquote(match[1]);
  }
  return {
    name: String(meta.project ?? meta.name ?? '').trim() || title,
    path: declaredPath,
    docPath: file.path,
    marker: typeInfo.marker,
  };
}

/** Merge routed rows into an extracted list without producing duplicate rows. */
function mergeRouted(base, extra, anchorOf) {
  const items = [...base];
  const ids = new Set(base.map((entry) => entry.id));
  const anchors = new Set(base.map(anchorOf));
  let added = 0;
  for (const entry of extra) {
    const anchor = anchorOf(entry);
    if (ids.has(entry.id) || anchors.has(anchor)) continue;
    ids.add(entry.id);
    anchors.add(anchor);
    items.push(entry);
    added++;
  }
  return { items, added };
}

// ---------------------------------------------------------------------------
// KB-PROJECT: register only a project whose declared path really exists
// ---------------------------------------------------------------------------

function projectEntryAt(workspace, abs) {
  const root = workspaceRootOf(workspace);
  let data = null;
  try { data = loadProjects(root); } catch { data = null; }
  for (const entry of asArray(data?.projects)) {
    if (!entry || typeof entry !== 'object') continue;
    const stored = String(entry.path ?? '');
    if (!stored) continue;
    if (toPosix(resolveProjectPath(root, stored)) === toPosix(abs)) return entry;
  }
  return null;
}

function isDirectory(abs) {
  try { return statSync(abs).isDirectory(); } catch { return false; }
}

function planProjectRegistration(db, workspace, decl) {
  const declared = String(decl.path ?? '').trim();
  if (!declared) {
    return {
      ...decl,
      resolvedPath: null,
      status: 'blocked',
      reason: `project_path_missing: "${decl.docPath}" names the project "${decl.name || '(unnamed)'}" without a path; the document is kept and no project was registered`,
    };
  }
  const resolvedPath = isAbsolute(declared) ? resolve(declared) : resolve(workspaceRootOf(workspace), declared);
  const name = decl.name || baseNameOf(resolvedPath);
  if (!isDirectory(resolvedPath)) {
    return {
      ...decl,
      name,
      resolvedPath,
      status: 'blocked',
      reason: `project_path_missing: "${decl.docPath}" declares "${resolvedPath}", which is not an existing directory; the document is kept and no project was registered`,
    };
  }
  const existing = projectEntryAt(workspace, resolvedPath);
  if (existing || isRegisteredProject(db, name, workspace)) {
    return {
      ...decl,
      name: existing?.name || name,
      resolvedPath,
      status: 'registered',
      reason: null,
    };
  }
  return { ...decl, name, resolvedPath, status: 'pending', reason: null };
}

function projectView(plan) {
  return {
    name: plan.name || null,
    docPath: plan.docPath,
    path: plan.resolvedPath ?? plan.path ?? null,
    registered: plan.status === 'registered',
    wouldRegister: plan.status === 'pending',
    reason: plan.reason ?? null,
  };
}

function registerPlannedProject(db, workspace, plan) {
  const root = workspaceRootOf(workspace);
  const entry = registerProject(root, { name: plan.name, path: plan.resolvedPath });
  const stored = entry?.path ?? storedPath(root, plan.resolvedPath);
  const row = db.prepare('SELECT id, name FROM projects WHERE name = ?').get(plan.name);
  if (!row) {
    db.prepare('INSERT INTO projects(name, path, kind, added_at) VALUES (?, ?, ?, ?)')
      .run(plan.name, stored, 'dir', nowISO());
  }
  return stored;
}

// ---------------------------------------------------------------------------
// package reading (Form A directory, Form B JSON)
// ---------------------------------------------------------------------------

function fileRecord(path, text, bytes) {
  const buffer = bytes ?? Buffer.from(String(text ?? ''), 'utf8');
  return {
    path,
    text: text ?? buffer.toString('utf8'),
    bytes: buffer,
    sha256: sha256(buffer),
    size: buffer.length,
  };
}

/** Normalize the incoming file list to repo-relative, root-stripped paths. */
function normalizeFiles(files, root) {
  const byPath = new Map();
  for (const entry of asArray(files)) {
    if (!entry || typeof entry !== 'object') continue;
    const raw = entry.path ?? entry.rel ?? entry.name;
    const path = stripRoot(normalizeRelPath(raw), root);
    if (!path) continue;
    const text = typeof entry.text === 'string' ? entry.text : undefined;
    const bytes = Buffer.isBuffer(entry.bytes) ? entry.bytes : undefined;
    byPath.set(path, fileRecord(path, text, bytes));
  }
  return [...byPath.values()].sort((a, b) => cmpStr(a.path, b.path));
}

function walkPackage(dir, prefix = '') {
  const out = [];
  // Producer metadata, not package content: the manifest identifies the package and the
  // two sidecars carry the file table and digest. Ingesting them would put a package's
  // own bookkeeping into the document store and make the digest self-referential.
  const ARTIFACTS = new Set(['manifest.json', 'files.json', 'manifest.digest']);
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries.sort((a, b) => cmpStr(a.name, b.name))) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (!prefix && entry.isFile() && ARTIFACTS.has(entry.name)) continue;
    if (entry.isDirectory()) {
      out.push(...walkPackage(join(dir, entry.name), rel));
      continue;
    }
    if (!entry.isFile()) continue;
    let size = 0;
    try {
      size = statSync(join(dir, entry.name)).size;
    } catch {
      size = 0;
    }
    out.push({ rel: toPosix(rel), abs: join(dir, entry.name), size });
  }
  return out;
}

/** Read a Form A package directory: manifest.json plus its files. */
function readDirectoryPackage(dir) {
  const abs = resolve(String(dir));
  const manifestPath = join(abs, 'manifest.json');
  if (!existsSync(manifestPath)) {
    return { error: `package: manifest.json is missing in ${abs}` };
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    return { error: `package: manifest.json is not valid JSON (${error instanceof Error ? error.message : String(error)})` };
  }

  const entries = walkPackage(abs).filter((entry) => entry.rel !== 'manifest.json');
  const files = [];
  for (const entry of entries) {
    let bytes;
    try {
      bytes = readFileSync(entry.abs);
    } catch (error) {
      return { error: `package: cannot read ${entry.rel} (${error instanceof Error ? error.message : String(error)})` };
    }
    files.push(fileRecord(entry.rel, undefined, bytes));
  }
  return { manifest, files };
}

// ---------------------------------------------------------------------------
// classification
// ---------------------------------------------------------------------------

function lifecycleFor(path, cls) {
  const lower = normalizeRelPath(path).toLowerCase();
  const segments = lower.split('/');
  const name = segments[segments.length - 1] || '';
  if (segments.some((segment) => segment === 'generated' || segment === 'wiki') || name.endsWith('.generated.md')) {
    return 'generated';
  }
  if (segments.some((segment) => ['archive', 'archived', 'history', 'historical', 'donor'].includes(segment))) {
    return 'historical';
  }
  const fromRegistry = cls && cls.lifecycle ? String(cls.lifecycle) : '';
  return fromRegistry || 'current';
}

function classifyFile(registry, path, ceiling = 'project_observed') {
  const cls = registry ? classifyPath(registry, path) : null;
  const family = cls && cls.family && String(cls.family) !== '00' ? String(cls.family) : null;
  const authority = cls && cls.authority ? String(cls.authority) : '';
  const labelled = DOCUMENT_AUTHORITIES.includes(authority) ? authority : ceiling;
  // An incoming package never carries vendor authority: it is evidence, not
  // an official convention.
  const landed = labelled === 'vendor_documented' ? ceiling : labelled;
  return {
    typeId: cls?.typeId ?? null,
    family,
    family_name: family ? String(cls.familyName || '') || null : 'Unclassified',
    role: family ? String(cls.role || 'unclassified') : 'unclassified',
    authority: family ? landed : ceiling,
    lifecycle: lifecycleFor(path, cls),
    confidence: cls?.confidence ?? 0,
    mapped: Boolean(cls && cls.mapped === true),
    unclassified: !family,
  };
}

// ---------------------------------------------------------------------------
// digest
// ---------------------------------------------------------------------------

/** Content address of a package: manifest without producedAt + ordered hashes. */
function packageDigest(manifest, files) {
  const rest = { ...((manifest && typeof manifest === 'object') ? manifest : {}) };
  delete rest.producedAt;
  const payload = {
    manifest: rest,
    files: files.map((file) => ({ path: file.path, sha256: file.sha256 })),
  };
  return digestOf(payload);
}

// ---------------------------------------------------------------------------
// staging + extraction (canon.mjs owns the parsing)
// ---------------------------------------------------------------------------

function stagePackage(files) {
  const dir = mkdtempSync(join(tmpdir(), 'hq-kb-intake-'));
  for (const file of files) {
    const abs = join(dir, file.path);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, file.bytes);
  }
  return dir;
}

function claimsOf(record) {
  const out = [];
  for (const entry of asArray(record?.evidence)) {
    const claimed = entry && entry.claimed ? String(entry.claimed).trim() : '';
    if (claimed) out.push(claimed);
  }
  return out;
}

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------

function buildReport({
  ok, manifest, digest, project, counts, byFamily, changed, unchanged, added,
  missingFromPackage, reasons, evidence, notices, kbTypes, projects,
}) {
  return {
    schema: INTAKE_SCHEMA,
    ok,
    package: {
      id: manifest && manifest.id ? String(manifest.id) : null,
      version: manifest && manifest.version ? String(manifest.version) : null,
      digest: digest ?? null,
    },
    project: project ?? null,
    counts: {
      files: Number(counts.files) || 0,
      documents: Number(counts.documents) || 0,
      decisions: Number(counts.decisions) || 0,
      terms: Number(counts.terms) || 0,
      notes: Number(counts.notes) || 0,
      unclassified: Number(counts.unclassified) || 0,
      refusedSecrets: Number(counts.refusedSecrets) || 0,
      // Rows contributed by KB-type routing and projects the intake actually
      // registered. Counts are measured after the merge, never estimated.
      kbDecisions: Number(counts.kbDecisions) || 0,
      kbTerms: Number(counts.kbTerms) || 0,
      projects: Number(counts.projects) || 0,
    },
    kbTypes: kbTypes || { decision: 0, term: 0, project: 0 },
    projects: projects || [],
    byFamily: byFamily || {},
    changed: Number(changed) || 0,
    unchanged: Number(unchanged) || 0,
    added: Number(added) || 0,
    missingFromPackage: missingFromPackage || [],
    reasons: reasons || [],
    notices: notices || [],
    evidence: evidence || [],
  };
}

function emptyCounts() {
  return {
    files: 0, documents: 0, decisions: 0, terms: 0,
    notes: 0, unclassified: 0, refusedSecrets: 0,
    kbDecisions: 0, kbTerms: 0, projects: 0,
  };
}

function projectNameOf(project, manifest) {
  if (typeof project === 'string' && project.trim()) return project.trim();
  if (project && typeof project === 'object' && project.name) return String(project.name);
  if (manifest && typeof manifest === 'object' && manifest.project) return String(manifest.project);
  return null;
}

function registeredProject(db, name) {
  if (!name) return null;
  const row = db.prepare('SELECT id, name, path FROM projects WHERE name = ?').get(String(name));
  return row || null;
}

// The workspace root is the directory that carries `projects.json` (or `.hq`):
// the same search the CLI performs before it reads the project registry.
function findWorkspaceRoot(start = process.cwd()) {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, 'projects.json')) || existsSync(join(dir, '.hq'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return resolve(start);
    dir = parent;
  }
}

function workspaceRootOf(workspace) {
  return workspace ? resolve(String(workspace)) : findWorkspaceRoot();
}

function workspaceProjectNames(workspace) {
  const names = new Set();
  let data = null;
  try { data = loadProjects(workspaceRootOf(workspace)); } catch { data = null; }
  for (const entry of asArray(data?.projects)) {
    const name = typeof entry === 'string' ? entry : String(entry?.name ?? '');
    if (name) names.add(name);
  }
  return names;
}

// A project is registered when the workspace registry knows it: `hq project add`
// writes that registry. The local index only carries projects that were
// registered, so an indexed row is the same evidence.
function isRegisteredProject(db, name, workspace) {
  if (!name) return false;
  if (workspaceProjectNames(workspace).has(name)) return true;
  return Boolean(registeredProject(db, name));
}

function resolveRegistry(registry) {
  if (registry && typeof registry === 'object') return registry;
  try {
    return loadRegistry(process.cwd());
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// writes (documents / decisions / canon terms / notes / meta)
// ---------------------------------------------------------------------------

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

const DOCUMENT_COMPARE = [
  'family', 'family_name', 'role', 'authority', 'lifecycle',
  'origin_type', 'title', 'owner', 'hash',
];

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

function documentChanged(prior, doc) {
  if (!sameRow(prior, doc, DOCUMENT_COMPARE)) return true;
  return String(prior.binds_to ?? '[]') !== JSON.stringify(doc.binds_to ?? []);
}

function writeDocuments(db, projectId, documents, now) {
  const upsert = db.prepare(DOCUMENT_UPSERT);
  const prior = new Map(
    db.prepare('SELECT * FROM documents WHERE project_id = ?').all(projectId)
      .map((row) => [row.path, row]),
  );
  let added = 0;
  let changed = 0;
  let unchanged = 0;
  for (const doc of documents) {
    const existing = prior.get(doc.path);
    const binds = JSON.stringify(doc.binds_to ?? []);
    if (!existing) {
      upsert.run(
        projectId, doc.path, doc.family, doc.family_name, doc.role, doc.authority,
        doc.lifecycle, doc.origin_type, doc.title, doc.owner, doc.hash,
        doc.mtime_ms, now, binds,
      );
      added++;
      continue;
    }
    if (!documentChanged(existing, doc)) {
      unchanged++;
      continue;
    }
    upsert.run(
      projectId, doc.path, doc.family, doc.family_name, doc.role, doc.authority,
      doc.lifecycle, doc.origin_type, doc.title, doc.owner, doc.hash,
      doc.mtime_ms, now, binds,
    );
    changed++;
  }
  return { added, changed, unchanged };
}

function writeDecisions(db, projectId, decisions, now) {
  const upsert = db.prepare(DECISION_UPSERT);
  const prior = new Map(
    db.prepare('SELECT * FROM decisions WHERE project_id = ?').all(projectId)
      .map((row) => [row.id, row]),
  );
  let added = 0;
  let changed = 0;
  for (const decision of decisions) {
    const existing = prior.get(decision.id) || null;
    // Owner-confirmed and superseded history is never rewritten by an intake.
    const locked = Boolean(existing && (existing.status === 'accepted' || existing.status === 'superseded'));
    const params = {
      id: decision.id,
      project_id: projectId,
      source_path: decision.source_path ?? null,
      title: decision.title ?? 'untitled',
      status: locked ? existing.status : DECISION_STATUS,
      authority: locked ? existing.authority : PACKAGE_AUTHORITY,
      date: decision.date ?? null,
      rationale: decision.rationale ?? null,
      consequences: decision.consequences ?? null,
      alternatives: decision.alternatives ?? null,
      supersedes: decision.supersedes ?? existing?.supersedes ?? null,
      evidence: JSON.stringify(asArray(decision.evidence)),
      hash: decision.hash ?? null,
      valid_from: decision.valid_from ?? decision.date ?? null,
      valid_to: locked ? existing.valid_to ?? null : null,
      recorded_at: existing?.recorded_at ?? now,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
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
  return { added, changed };
}

function writeTerms(db, projectId, terms, now) {
  const upsert = db.prepare(TERM_UPSERT);
  const prior = new Map(
    db.prepare('SELECT * FROM canon_terms WHERE project_id = ?').all(projectId)
      .map((row) => [row.id, row]),
  );
  let added = 0;
  let changed = 0;
  for (const term of terms) {
    const existing = prior.get(term.id) || null;
    // A term the owner already confirmed is never demoted by an intake.
    const locked = Boolean(existing && (existing.status === 'current' || existing.status === 'deprecated'));
    const params = {
      id: term.id,
      project_id: projectId,
      term: term.term ?? 'untitled',
      definition: term.definition ?? null,
      status: locked ? existing.status : TERM_STATUS,
      owner: term.owner ?? null,
      authority: locked ? existing.authority : PACKAGE_AUTHORITY,
      evidence: JSON.stringify(asArray(term.evidence)),
      aliases: JSON.stringify(asArray(term.aliases)),
      contrasts: JSON.stringify(asArray(term.contrasts)),
      lifecycle: locked ? existing.lifecycle : (term.lifecycle ?? 'current'),
      source_path: term.source_path ?? null,
      hash: term.hash ?? null,
      valid_from: term.valid_from ?? null,
      valid_to: locked ? existing.valid_to ?? null : null,
      recorded_at: existing?.recorded_at ?? now,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
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
  return { added, changed };
}

// ---------------------------------------------------------------------------
// public surface
// ---------------------------------------------------------------------------

/**
 * ingestKbPackage — classify, record and refuse one KB package.
 *
 * Accepts Form A (a directory: manifest.json + files) through
 * ingestKbDirectory, and Form B (a single JSON document with
 * `{manifest, files:[{path,text}]}`) here. Both hash identically.
 */
export function ingestKbPackage(db, {
  manifest = null,
  files = [],
  project = null,
  root = null,
  registry = null,
  dryRun = false,
  workspace = null,
} = {}) {
  const reasons = [];
  const projectName = projectNameOf(project, manifest);
  const empty = emptyCounts();

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    reasons.push('package: manifest is missing or is not an object');
  }
  if (manifest && typeof manifest === 'object' && String(manifest.schema ?? '') !== PACKAGE_SCHEMA) {
    reasons.push(`schema: expected ${PACKAGE_SCHEMA}, found "${String(manifest.schema)}"`);
  }
  const manifestProject = manifest && typeof manifest === 'object' ? String(manifest.project ?? '').trim() : '';
  const requestedProject = typeof project === 'string'
    ? project.trim()
    : (project && typeof project === 'object' && project.name ? String(project.name).trim() : '');
  if (manifestProject && requestedProject && manifestProject !== requestedProject) {
    reasons.push(`project: the manifest names "${manifestProject}" but the caller asked for "${requestedProject}"`);
  }
  if (!projectName) {
    reasons.push('project: no target project was named');
  } else if (!isRegisteredProject(db, projectName, workspace)) {
    reasons.push(`project: "${projectName}" is not registered; run \`hq project add ${projectName} <path>\` first`);
  }
  if (manifest && typeof manifest === 'object') {
    const authority = String(manifest.authority ?? '');
    if (!ALLOWED_AUTHORITIES.has(authority)) {
      reasons.push(`authority: "${authority}" is not allowed; an incoming package may only claim project_observed or local_custom`);
    }
  }

  const normalized = normalizeFiles(files, root ?? (manifest && manifest.root) ?? '');
  const totalBytes = normalized.reduce((sum, file) => sum + file.size, 0);
  if (normalized.length > MAX_FILES) {
    reasons.push(`size: package holds ${normalized.length} files, the limit is ${MAX_FILES}`);
  }
  if (totalBytes > MAX_BYTES) {
    reasons.push(`size: package holds ${totalBytes} bytes, the limit is ${MAX_BYTES}`);
  }

  const secretFiles = new Set();
  for (const file of normalized) {
    if (isUnsafePath(file.path)) {
      reasons.push(`path: "${file.path}" is not a safe package path`);
      continue;
    }
    if (isSecretPath(file.path)) {
      secretFiles.add(file.path);
      reasons.push(`secret_path: "${file.path}" matches a secret path pattern`);
      continue;
    }
    const hit = secretContentHit(file.text);
    if (hit) {
      secretFiles.add(file.path);
      reasons.push(`secret_content: "${file.path}" matches the ${hit} secret pattern`);
    }
  }
  if (manifest && typeof manifest === 'object' && typeof manifest.notes === 'string') {
    const hit = secretContentHit(manifest.notes);
    if (hit) {
      reasons.push(`secret_content: "manifest.notes" matches the ${hit} secret pattern`);
    }
  }

  // The manifest notes are a file of their own for the size bound.
  if (reasons.length) {
    return buildReport({
      ok: false,
      manifest,
      digest: null,
      project: projectName,
      counts: { ...empty, files: normalized.length, refusedSecrets: secretFiles.size },
      byFamily: {},
      changed: 0,
      unchanged: 0,
      added: 0,
      missingFromPackage: [],
      reasons,
      evidence: [],
    });
  }

  const digest = packageDigest(manifest, normalized);
  const activeRegistry = resolveRegistry(registry);
  // The package authority is the ceiling for every row it produces: an
  // incoming KB never carries vendor authority.
  const packageAuthority = ALLOWED_AUTHORITIES.has(String(manifest?.authority ?? ''))
    ? String(manifest.authority)
    : 'project_observed';
  const classified = normalized.map((file) => ({
    file,
    cls: classifyFile(activeRegistry, file.path, packageAuthority),
  }));

  const familyCounts = {};
  for (const entry of classified) {
    if (!entry.cls.family) continue;
    familyCounts[entry.cls.family] = (familyCounts[entry.cls.family] || 0) + 1;
  }
  const byFamily = {};
  for (const code of Object.keys(familyCounts).sort(cmpStr)) byFamily[code] = familyCounts[code];

  // Extract through canon.mjs so the parsing rules stay in one place.
  let decisions = [];
  let terms = [];
  let scanned = new Map();
  const staging = stagePackage(normalized);
  try {
    const scoped = { name: projectName, path: staging };
    scanned = new Map(scanDocuments(staging, scoped).map((doc) => [doc.path, doc]));
    decisions = extractDecisions({ root: staging, project: scoped });
    terms = extractCanonTerms({ root: staging, project: scoped });
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }

  // KB-typed documents route to the register their own marker names. Type is
  // routing metadata only: the writers below still force `proposed` /
  // `provisional` and `project_observed`, and a KB-PROJECT document registers a
  // project only when it declares a path that really exists.
  const kbTypes = { decision: 0, term: 0, project: 0 };
  const kbDecisions = [];
  const kbTerms = [];
  const kbProjectDocs = [];
  for (const entry of classified) {
    const typeInfo = kbTypeOf(entry.file.path, entry.file.text);
    if (!typeInfo) continue;
    kbTypes[typeInfo.type] += 1;
    if (typeInfo.type === 'decision') {
      kbDecisions.push(kbDecisionRecord({ project: projectName, file: entry.file, typeInfo }));
    } else if (typeInfo.type === 'term') {
      kbTerms.push(...kbTermRecords({ project: projectName, file: entry.file, typeInfo }));
    } else if (typeInfo.type === 'project') {
      kbProjectDocs.push(kbProjectDeclaration({ file: entry.file, typeInfo }));
    }
  }
  const routedDecisions = mergeRouted(decisions, kbDecisions, (entry) => `${entry.source_path}\0${entry.title}`);
  const routedTerms = mergeRouted(terms, kbTerms, (entry) => `${entry.source_path}\0${entry.term}`);
  decisions = routedDecisions.items;
  terms = routedTerms.items;

  for (const decision of decisions) {
    for (const claim of claimsOf(decision)) {
      if (/^(accept|approv|ratif|decided)/i.test(claim)) {
        reasons.push(`decision_claim: "${decision.source_path}" claims status "${claim}"; an incoming package cannot accept a decision`);
      }
    }
  }
  for (const term of terms) {
    for (const claim of claimsOf(term)) {
      if (/^(current|active)/i.test(claim)) {
        reasons.push(`term_claim: "${term.source_path}" claims status "${claim}"; an incoming package cannot promote a CANON term`);
      }
    }
  }

  if (reasons.length) {
    return buildReport({
      ok: false,
      manifest,
      digest,
      project: projectName,
      counts: {
        ...empty,
        files: normalized.length,
        documents: normalized.length,
        decisions: decisions.length,
        terms: terms.length,
        unclassified: classified.filter((entry) => entry.cls.unclassified).length,
        refusedSecrets: secretFiles.size,
      },
      byFamily,
      changed: 0,
      unchanged: 0,
      added: 0,
      missingFromPackage: [],
      reasons,
      evidence: [],
    });
  }

  const projectRow = registeredProject(db, projectName);
  // A missing project row is a refusal, never a crash: the package arrives from a
  // foreign workspace and the intake must return a receipt it can act on.
  if (!projectRow) {
    return buildReport({
      ok: false,
      manifest,
      digest,
      project: projectName,
      counts: {
        ...empty,
        files: normalized.length,
        documents: normalized.length,
        decisions: decisions.length,
        terms: terms.length,
        unclassified: classified.filter((entry) => entry.cls.unclassified).length,
        refusedSecrets: secretFiles.size,
      },
      byFamily,
      changed: 0,
      unchanged: 0,
      added: 0,
      missingFromPackage: [],
      reasons: [`project_not_registered: "${projectName}" has no HQ project row; run hq project add ${projectName} <path>`],
      evidence: [],
    });
  }
  const projectId = projectRow.id;

  const projectPlans = kbProjectDocs.map((decl) => planProjectRegistration(db, workspace, decl));
  const notices = projectPlans
    .filter((plan) => plan.status === 'blocked')
    .map((plan) => plan.reason);
  if (dryRun) {
    for (const plan of projectPlans) {
      if (plan.status !== 'pending') continue;
      notices.push(`project_would_register: "${plan.docPath}" declares "${plan.resolvedPath}"; a real intake would register the project "${plan.name}"`);
    }
  }

  const documents = classified.map(({ file, cls }) => {
    const scan = scanned.get(file.path) || null;
    return {
      path: file.path,
      family: cls.family,
      family_name: cls.family_name,
      role: cls.role,
      authority: cls.authority,
      lifecycle: cls.lifecycle,
      origin_type: 'kb_package',
      title: scan?.title ? String(scan.title) : titleFallback(file.path),
      owner: scan?.owner ? String(scan.owner) : null,
      hash: file.sha256,
      mtime_ms: 0,
      binds_to: Array.isArray(scan?.binds_to) ? scan.binds_to : [],
    };
  });

  const evidence = normalized
    .map((file) => ({ ref: `${projectName}:${file.path}`, sha256: file.sha256 }))
    .sort((a, b) => cmpStr(a.ref, b.ref));

  // Files that HQ holds but the package does not: reported, never deleted.
  const priorPaths = db.prepare('SELECT path FROM documents WHERE project_id = ?').all(projectId)
    .map((row) => String(row.path));
  const packagePaths = new Set(normalized.map((file) => file.path));
  const missingFromPackage = priorPaths.filter((path) => !packagePaths.has(path)).sort(cmpStr);

  const counts = {
    files: normalized.length,
    documents: documents.length,
    decisions: decisions.length,
    terms: terms.length,
    notes: typeof manifest.notes === 'string' && manifest.notes.trim() ? 1 : 0,
    unclassified: classified.filter((entry) => entry.cls.unclassified).length,
    refusedSecrets: 0,
    // Measured after the merge: routed decisions/terms that produced a row.
    kbDecisions: routedDecisions.added,
    kbTerms: routedTerms.added,
    projects: 0,
  };

  if (dryRun) {
    const diff = dryRunDiff(db, projectId, documents);
    return buildReport({
      ok: true,
      manifest,
      digest,
      project: projectName,
      counts,
      kbTypes,
      projects: projectPlans.map(projectView),
      byFamily,
      changed: diff.changed,
      unchanged: diff.unchanged,
      added: diff.added,
      missingFromPackage,
      reasons: [],
      notices,
      evidence,
    });
  }

  const now = nowISO();
  const written = transaction(db, () => {
    const docs = writeDocuments(db, projectId, documents, now);
    const decs = writeDecisions(db, projectId, decisions, now);
    const trms = writeTerms(db, projectId, terms, now);
    if (counts.notes) {
      addNote(db, {
        text: String(manifest.notes).trim(),
        tier: 'now',
        project: projectName,
        key: `kb.intake:${String(manifest.id ?? 'kb')}`,
        origin: 'agent',
        confidence: 1,
        evidence: [{ ref: `${projectName}:${manifest.id ?? 'kb'}`, sha256: digest }],
      });
    }
    setMeta(db, META_KEY, JSON.stringify({
      id: manifest.id ? String(manifest.id) : null,
      version: manifest.version ? String(manifest.version) : null,
      digest,
      at: now,
      counts,
    }));
    return { ...docs, decisions: decs, terms: trms };
  });

  // A KB-PROJECT document registers its project only now: after the intake
  // transaction committed, and only for a declared path that really exists.
  // A failed registration is a notice, never a lost package.
  const projectResults = [];
  for (const plan of projectPlans) {
    if (plan.status !== 'pending') {
      projectResults.push(projectView(plan));
      continue;
    }
    try {
      const stored = registerPlannedProject(db, workspace, plan);
      counts.projects += 1;
      projectResults.push({
        ...projectView(plan),
        path: stored,
        registered: true,
        wouldRegister: false,
      });
    } catch (error) {
      const reason = `project_register_failed: "${plan.docPath}" could not register "${plan.name}": ${error instanceof Error ? error.message : String(error)}`;
      notices.push(reason);
      projectResults.push({
        ...projectView(plan),
        registered: false,
        wouldRegister: false,
        reason,
      });
    }
  }
  // Keep the recorded status counts honest: they now include registered projects.
  if (counts.projects > 0) {
    setMeta(db, META_KEY, JSON.stringify({
      id: manifest.id ? String(manifest.id) : null,
      version: manifest.version ? String(manifest.version) : null,
      digest,
      at: now,
      counts,
    }));
  }

  return buildReport({
    ok: true,
    manifest,
    digest,
    project: projectName,
    counts,
    kbTypes,
    projects: projectResults,
    byFamily,
    changed: written.changed,
    unchanged: written.unchanged,
    added: written.added,
    missingFromPackage,
    reasons: [],
    notices,
    evidence,
  });
}

/**
 * ingestKbDirectory — Form A: a package directory with manifest.json + files.
 */
export function ingestKbDirectory(db, { dir, project = null, registry = null, dryRun = false, workspace = null } = {}) {
  if (!dir) {
    return buildReport({
      ok: false,
      manifest: null,
      digest: null,
      project: projectNameOf(project, null),
      counts: emptyCounts(),
      byFamily: {},
      changed: 0,
      unchanged: 0,
      added: 0,
      missingFromPackage: [],
      reasons: ['package: no package directory was given'],
      evidence: [],
    });
  }
  const read = readDirectoryPackage(dir);
  if (read.error) {
    return buildReport({
      ok: false,
      manifest: null,
      digest: null,
      project: projectNameOf(project, null),
      counts: emptyCounts(),
      byFamily: {},
      changed: 0,
      unchanged: 0,
      added: 0,
      missingFromPackage: [],
      reasons: [read.error],
      evidence: [],
    });
  }
  return ingestKbPackage(db, {
    manifest: read.manifest,
    files: read.files,
    project,
    root: null,
    registry,
    dryRun,
    workspace,
  });
}

function dryRunDiff(db, projectId, documents) {
  const prior = new Map(
    db.prepare('SELECT * FROM documents WHERE project_id = ?').all(projectId)
      .map((row) => [row.path, row]),
  );
  let added = 0;
  let changed = 0;
  let unchanged = 0;
  for (const doc of documents) {
    const existing = prior.get(doc.path);
    if (!existing) {
      added++;
      continue;
    }
    if (documentChanged(existing, doc)) changed++;
    else unchanged++;
  }
  return { added, changed, unchanged };
}

/**
 * intakePlan — what an intake would do for a project, and what blocks it.
 */
export function intakePlan(db, { project = null, registry = null, workspace = null } = {}) {
  const steps = [
    { id: 'validate-manifest', does: 'check schema, project registration and package authority' },
    { id: 'scan-package', does: 'read the package files (Form A directory or Form B JSON)' },
    { id: 'refuse-secrets', does: 'refuse secret paths and secret-shaped content before any write' },
    { id: 'classify-files', does: 'classify every file through the 217/133 registry' },
    { id: 'extract-decisions', does: 'extract decisions through canon.mjs; they land proposed' },
    { id: 'extract-terms', does: 'extract CANON terms through canon.mjs; they land provisional' },
    { id: 'route-kb-types', does: 'route KB-DECISION / KB-VOCABULARY / KB-TERM / KB-CANON documents into the decision and CANON registers; register KB-PROJECT only for a declared path that exists' },
    { id: 'index-documents', does: 'index the package documents through the canon.mjs document contract' },
    { id: 'record-note', does: 'record the package note through the memory.mjs note API' },
    { id: 'record-meta', does: 'record vivim.kb.intake in meta' },
  ];
  const blockers = [];
  const projectName = projectNameOf(project, null);
  if (!projectName) {
    blockers.push({
      code: 'project_missing',
      message: 'no target project was named; pass the project the package belongs to',
    });
  } else if (!isRegisteredProject(db, projectName, workspace)) {
    blockers.push({
      code: 'project_not_registered',
      message: `project "${projectName}" is not registered; run \`hq project add ${projectName} <path>\` first`,
    });
  }
  if (!resolveRegistry(registry)) {
    blockers.push({
      code: 'registry_missing',
      message: 'no agentic file registry is available; every file would land unclassified',
    });
  }
  return { steps, blockers };
}

/**
 * intakeStatus — the last recorded package.
 */
export function intakeStatus(db) {
  const raw = getMeta(db, META_KEY, null);
  if (!raw) {
    return { package: null, version: null, digest: null, at: null, counts: null };
  }
  const parsed = safeJsonParse(raw, null) || {};
  return {
    package: parsed.id ?? null,
    version: parsed.version ?? null,
    digest: parsed.digest ?? null,
    at: parsed.at ?? null,
    counts: parsed.counts ?? null,
  };
}

/**
 * intakeVerify — compare a package against what HQ holds, without writing.
 */
export function intakeVerify(db, { manifest = null, files = [], project = null, root = null } = {}) {
  const projectName = projectNameOf(project, manifest);
  const row = registeredProject(db, projectName);
  if (!row) {
    return { ok: false, changed: 0, unchanged: 0, added: 0, missing: [] };
  }
  const normalized = normalizeFiles(files, root ?? (manifest && manifest.root) ?? '');
  const prior = new Map(
    db.prepare('SELECT path, hash FROM documents WHERE project_id = ?').all(row.id)
      .map((entry) => [String(entry.path), entry]),
  );
  const packagePaths = new Set(normalized.map((file) => file.path));
  let changed = 0;
  let unchanged = 0;
  let added = 0;
  for (const file of normalized) {
    const existing = prior.get(file.path);
    if (!existing) {
      added++;
      continue;
    }
    if (existing.hash && existing.hash !== file.sha256) changed++;
    else unchanged++;
  }
  const missing = [...prior.keys()].filter((path) => !packagePaths.has(path)).sort(cmpStr);
  return {
    ok: changed === 0 && added === 0 && missing.length === 0,
    changed,
    unchanged,
    added,
    missing,
  };
}

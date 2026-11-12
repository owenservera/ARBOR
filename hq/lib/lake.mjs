// hq/lib/lake.mjs — commit lake, drift detection, owner brief and static feed.
//
// Everything is deterministic. The brief and feed never read the wall clock:
// "now" is the newest commit date (or an injected `now`), so the same database
// and working tree always render the same bytes. Storage timestamps
// (`inserted_at`, `added_at`) are written but never appear in generated output.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import {
  aheadBehind, branch, dirtyFiles, head, logRecords, remote, tryGit,
} from './git.mjs';
import { discoverFiles } from './walk.mjs';
import { languageLabel } from './lang.mjs';
import { alignmentSummary, alignmentMarkdown } from './vivim.mjs';
import { transaction } from './schema.mjs';
import { userTerm } from './nomenclature.mjs';
import { canonicalJson, nowISO, sha256, toPosix, truncate } from './util.mjs';

const TODO_RE = /\b(TODO|FIXME|HACK|XXX)\b/;
const MAX_TODO_RESULTS = 200;
const MAX_TODO_FILES = 500;
const MAX_TEXT_BYTES = 6000;

const SECRET_NAMES = new Set([
  'session.json', 'storage-state.json', 'release-profile.json', 'cookies', 'login data',
]);

// Never persist or render secret material, not even file names.
function isSecretPath(value) {
  const posix = toPosix(value);
  const name = (posix.split('/').pop() || '').trim().toLowerCase();
  if (!name) return true;
  if (name.startsWith('.env')) return true;
  if (name.endsWith('.keystore')) return true;
  return SECRET_NAMES.has(name);
}

function clampInt(value, lo, hi, fallback = lo) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, Math.trunc(n)));
}

function isoTimestamp(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : String(value);
}

function daysBetween(fromIso, toIso) {
  const a = Date.parse(fromIso);
  const b = Date.parse(toIso);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

function clean(value) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function byteLength(text) {
  return Buffer.byteLength(String(text), 'utf8');
}

// clampBytes — hard ceiling that never splits a UTF-8 sequence.
function clampBytes(text, max) {
  let out = String(text);
  if (byteLength(out) <= max) return out;
  while (out.length > 0 && byteLength(out) > max) out = out.slice(0, -1);
  return out;
}

// Conventional commit: type(scope)!: subject
const CONVENTIONAL_RE = /^([A-Za-z][A-Za-z0-9_-]*)(?:\(([^()\r\n]+)\))?(!)?:\s*(.+)$/;

function parseConventional(subject) {
  const match = CONVENTIONAL_RE.exec(String(subject ?? '').trim());
  if (!match) return { type: null, scope: null, breaking: false, description: null };
  return {
    type: match[1].toLowerCase(),
    scope: match[2] ? clean(match[2]) : null,
    breaking: Boolean(match[3]),
    description: clean(match[4]),
  };
}

function projectAbsPath(root, project) {
  if (project.abs) return resolve(project.abs);
  if (!project.path) return resolve(root || '.', project.name);
  return isAbsolute(project.path) ? resolve(project.path) : resolve(root || '.', project.path);
}

function resolveProjects(db, root, projects) {
  const out = [];
  const seen = new Set();
  const add = (name, abs) => {
    const cleanName = clean(name);
    if (!cleanName || seen.has(cleanName)) return;
    seen.add(cleanName);
    out.push({ name: cleanName, path: abs });
  };
  if (Array.isArray(projects)) {
    for (const p of projects) {
      if (!p || !p.name) continue;
      add(p.name, projectAbsPath(root, p));
    }
  } else {
    const rows = db.prepare('SELECT name, path FROM projects ORDER BY name').all();
    for (const row of rows) add(row.name, resolve(row.path));
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function projectRow(db, name) {
  return db.prepare('SELECT id, name, path, branch, head, file_count, symbol_count, indexed_at FROM projects WHERE name = ?').get(name) || null;
}

function ensureProject(db, project) {
  const name = clean(project.name);
  const abs = resolve(String(project.path));
  const kind = clean(project.kind) || (existsSync(join(abs, '.git')) ? 'git' : 'dir');
  const remoteUrl = remote(abs);
  const branchName = branch(abs);
  const headSha = head(abs);

  let row = db.prepare('SELECT id FROM projects WHERE name = ?').get(name);
  if (!row) row = db.prepare('SELECT id FROM projects WHERE path = ?').get(abs);
  if (!row) {
    db.prepare(`
      INSERT INTO projects(name, path, kind, remote, branch, head, added_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, abs, kind, remoteUrl, branchName, headSha, nowISO());
    row = db.prepare('SELECT id FROM projects WHERE name = ?').get(name);
  } else {
    db.prepare(`
      UPDATE projects SET path = ?, kind = ?, remote = ?, branch = ?, head = ? WHERE id = ?
    `).run(abs, kind, remoteUrl, branchName, headSha, row.id);
  }
  return { id: row.id, name, path: abs };
}

/**
 * ingestProject — pull commits from git into the lake.
 * Idempotent: a second run inserts nothing (`INSERT OR IGNORE`).
 */
export function ingestProject(db, project, { limit = 500, since = null } = {}) {
  if (!project || !project.name) throw new TypeError('ingestProject: project.name is required');
  if (!project.path) throw new TypeError('ingestProject: project.path is required');

  const info = ensureProject(db, project);
  const records = logRecords(info.path, {
    limit: clampInt(limit, 1, 5000, 500),
    since: since ? isoTimestamp(since) : null,
  });

  const insertCommit = db.prepare(`
    INSERT OR IGNORE INTO commits(sha, project_id, author, date, subject, type, scope, files_changed, inserted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertFile = db.prepare('INSERT OR IGNORE INTO commit_files(sha, path, status) VALUES (?, ?, ?)');

  let inserted = 0;
  let skipped = 0;

  transaction(db, () => {
    for (const record of records) {
      const files = [];
      for (const entry of record.files || []) {
        const path = toPosix(String(entry.path ?? '')).replace(/^\.\//, '');
        if (!path || isAbsolute(path) || path.startsWith('../')) continue;
        if (isSecretPath(path)) continue;
        files.push({ path, status: clean(entry.status) || null });
      }
      const parsed = parseConventional(record.subject);
      const result = insertCommit.run(
        record.sha,
        info.id,
        clean(record.author) || null,
        isoTimestamp(record.date),
        clean(record.subject),
        parsed.type,
        parsed.scope,
        files.length,
        nowISO(),
      );
      if (Number(result.changes) > 0) {
        inserted++;
        for (const file of files) insertFile.run(record.sha, file.path, file.status);
      } else {
        skipped++;
      }
    }
  });

  return { project: info.name, inserted, skipped, commits: records.length };
}

/**
 * queryCommits — filtered, deterministic commit history.
 * `files` is a sorted array of workspace-relative paths.
 */
export function queryCommits(db, {
  project = null, since = null, path = null, type = null, limit = 50,
} = {}) {
  const where = [];
  const params = [];

  if (project) {
    where.push('lower(p.name) = lower(?)');
    params.push(String(project.name || project));
  }
  if (since) {
    where.push('c.date >= ?');
    params.push(isoTimestamp(since));
  }
  if (type) {
    where.push('lower(c.type) = lower(?)');
    params.push(String(type));
  }
  if (path) {
    const needle = `%${toPosix(String(path)).replace(/^\.\//, '')}%`;
    where.push('EXISTS (SELECT 1 FROM commit_files cf WHERE cf.sha = c.sha AND cf.path LIKE ?)');
    params.push(needle);
  }

  const sql = `
    SELECT c.sha, p.name AS project, c.date, c.author, c.subject, c.type, c.scope
    FROM commits c
    JOIN projects p ON p.id = c.project_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY c.date DESC, c.sha ASC
    LIMIT ?
  `;
  const rows = db.prepare(sql).all(...params, clampInt(limit, 1, 5000, 50));

  const bySha = new Map();
  if (rows.length) {
    const placeholders = rows.map(() => '?').join(',');
    const fileRows = db.prepare(`
      SELECT sha, path FROM commit_files
      WHERE sha IN (${placeholders})
      ORDER BY sha, path
    `).all(...rows.map((r) => r.sha));
    for (const file of fileRows) {
      if (isSecretPath(file.path)) continue;
      if (!bySha.has(file.sha)) bySha.set(file.sha, []);
      bySha.get(file.sha).push(file.path);
    }
  }

  return rows.map((row) => ({
    sha: row.sha,
    project: row.project,
    date: row.date,
    author: row.author,
    subject: row.subject,
    type: row.type ?? null,
    scope: row.scope ?? null,
    files: bySha.get(row.sha) || [],
  }));
}

// parseLogRecords — parse `git log --name-status` output emitted with the
// \x1e/\x1f record/field separators used by git.mjs.logRecords. Local copy so
// lake.mjs can run its own range queries without mutating git.mjs.
function parseLogRecords(out) {
  const records = [];
  for (const chunk of String(out ?? '').split('\x1e')) {
    const text = chunk.replace(/^\r?\n/, '');
    if (!text.trim()) continue;
    const lines = text.split(/\r?\n/);
    const [sha, parents, author, date, subject] = lines[0].split('\x1f');
    if (!sha) continue;
    const files = [];
    for (const line of lines.slice(1)) {
      if (!line.trim()) continue;
      const tab = line.indexOf('\t');
      if (tab === -1) continue;
      files.push({ status: line.slice(0, tab).trim(), path: line.slice(tab + 1).trim() });
    }
    records.push({
      sha,
      parents: parents ? parents.split(' ').filter(Boolean) : [],
      author: author || '',
      date: date || '',
      subject: subject || '',
      files,
    });
  }
  return records;
}

/**
 * regressionAttribution — given a last-known-good revision and a bad revision,
 * rank the commits in (good, bad] that touched the failing path/module. The
 * EARLIEST such commit is the upstream change most likely responsible for the
 * regression: it is the first change to the failing module after the tree was
 * known good (HQ-061 engine surface).
 *
 * `range` is sorted oldest-first so the introducing commit leads the list.
 *
 * @param {import('../lib/schema.mjs').Database} db
 * @param {{ project?: string|{name?:string,path?:string}, goodSha?: string, badSha?: string, path?: string, limit?: number }} options
 * @returns {{ project, goodSha, badSha, path, range: Array<{sha,date,author,subject,files}> } & { likelyCulprit: string|null, culpritSubject: string|null, count: number }}
 */
export function regressionAttribution(db, {
  project = null, goodSha = null, badSha = null, path = null, limit = 50,
} = {}) {
  if (!db) throw new TypeError('regressionAttribution: db is required');
  if (!goodSha || !String(goodSha).trim()) throw new TypeError('regressionAttribution: goodSha is required');
  if (!badSha || !String(badSha).trim()) throw new TypeError('regressionAttribution: badSha is required');

  let projectPath = null;
  let projectName = null;
  if (project) {
    const row = projectRow(db, project.name || project);
    if (row) { projectPath = row.path; projectName = row.name; }
  }
  if (!projectPath) {
    const first = resolveProjects(db, null, null)[0];
    if (!first) {
      return {
        project: null, goodSha: String(goodSha), badSha: String(badSha),
        path: path || null, range: [], likelyCulprit: null, culpritSubject: null, count: 0,
      };
    }
    projectPath = first.path; projectName = first.name;
  }

  const range = logRangeFrom(projectPath, String(goodSha), String(badSha), path);
  // Oldest first: the first commit to touch the failing path after the
  // last-known-good revision is the change that introduced the regression.
  range.sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.sha.localeCompare(b.sha));
  const capped = range.slice(0, clampInt(limit, 1, 5000, 50));
  const culprit = capped.length ? capped[0] : null;

  return {
    project: projectName,
    goodSha: String(goodSha),
    badSha: String(badSha),
    path: path || null,
    range: capped,
    likelyCulprit: culprit ? culprit.sha : null,
    culpritSubject: culprit ? clean(culprit.subject) : null,
    count: capped.length,
  };
}

function logRangeFrom(root, from, to, pathFilter) {
  const args = ['log', `${String(from)}..${String(to)}`, '--no-renames', '--name-status',
    '--format=%x1e%H%x1f%P%x1f%an%x1f%aI%x1f%s'];
  if (pathFilter) args.push('--', pathFilter);
  const out = tryGit(root, args);
  if (!out) return [];
  return parseLogRecords(out);
}

/**
 * mergeEvidenceGap — pre-merge evidence-gap analysis (HQ-079 engine surface).
 * Given two branches and the evidence already gathered (since/verify/conflicts/
 * drift outputs), compute which evidence classes are still missing before the
 * branches can be merged:
 *
 *   unresolved_conflicts    — both sides changed the same file, or a conflicts
 *                              surface reported unresolved conflicts.
 *   untested_changed_files  — files changed on either side carry no test
 *                              evidence (no `verify` result and no recorded
 *                              test-outcome receipt for that path).
 *   absent_receipts         — no merge-decision receipt exists in the ledger.
 *   stale_index             — the index is stale relative to the working tree.
 *   dirty_tree              — uncommitted files block a clean merge.
 *
 * @param {import('../lib/schema.mjs').Database} db
 * @param {{ project?: string|{name?:string,path?:string}, branchA?: string, branchB?: string, since?: any, verify?: any, conflicts?: any, drift?: any }} options
 * @returns {{ project, branchA, branchB, divergence, changedFiles, conflictingFiles, missingEvidence: Array<{class,detail}> }}
 */
export function mergeEvidenceGap(db, {
  project = null, branchA = null, branchB = null,
  since = null, verify = null, conflicts = null, drift: driftInput = null,
} = {}) {
  if (!db) throw new TypeError('mergeEvidenceGap: db is required');

  let projectPath = null;
  let projectName = null;
  if (project) {
    const row = projectRow(db, project.name || project);
    if (row) { projectPath = row.path; projectName = row.name; }
  }
  if (!projectPath) {
    const first = resolveProjects(db, null, null)[0];
    if (!first) {
      return {
        project: null, branchA: branchA || null, branchB: branchB || null,
        divergence: {}, changedFiles: [], conflictingFiles: [], missingEvidence: [],
      };
    }
    projectPath = first.path; projectName = first.name;
  }

  const missingEvidence = [];
  const divergence = {};

  // Divergence between the two branches: commits unique to each side.
  const aOnly = branchA ? committedSequenceExcluding(projectPath, branchA, branchB) : [];
  const bOnly = branchB ? committedSequenceExcluding(projectPath, branchB, branchA) : [];
  if (branchA || branchB) {
    divergence.aNotInB = aOnly.map((r) => r.sha);
    divergence.bNotInA = bOnly.map((r) => r.sha);
    divergence.mergeBase = mergeBaseOf(projectPath, branchA || 'HEAD', branchB || 'HEAD');
  }

  // Files changed on each side, and the files both sides touched.
  const aFiles = changedFileSet(aOnly);
  const bFiles = changedFileSet(bOnly);
  const changedFiles = [...new Set([...aFiles, ...bFiles])].sort();
  const conflictingFiles = [...aFiles].filter((p) => bFiles.has(p)).sort();

  // Evidence classes.
  const hasVerify = verify != null;
  const hasConflicts = conflicts != null;

  const diverged = Boolean(divergence.aNotInB?.length || divergence.bNotInA?.length);

  // 0. branch_since — the divergent commits were never reviewed.
  if (diverged && since == null) {
    missingEvidence.push({
      class: 'branch_since',
      detail: `no since evidence for divergent commits on ${[branchA, branchB].filter(Boolean).join(' <-> ')}`,
    });
  }

  // 1. unresolved conflicts — same file changed on both sides, or the
  //    conflicts surface reported unresolved entries.
  const unresolved = Array.isArray(conflicts)
    ? conflicts.map((c) => (typeof c === 'string' ? c : c?.path ?? c?.file ?? '')).filter(Boolean)
    : [];
  if (unresolved.length) {
    missingEvidence.push({
      class: 'unresolved_conflicts',
      detail: `unresolved conflicts reported: ${unresolved.slice(0, 10).join(', ')}${unresolved.length > 10 ? '...' : ''}`,
    });
  } else if (conflictingFiles.length) {
    missingEvidence.push({
      class: 'unresolved_conflicts',
      detail: `same file changed on both branches: ${conflictingFiles.slice(0, 10).join(', ')}${conflictingFiles.length > 10 ? '...' : ''}`,
    });
  } else if (diverged && !hasConflicts) {
    missingEvidence.push({
      class: 'unresolved_conflicts',
      detail: `no conflicts evidence for divergent branches ${[branchA, branchB].filter(Boolean).join(' <-> ')}`,
    });
  }

  // 2. untested changed files — no `verify` result and no test-outcome
  //    receipt covering the changed path.
  if (diverged && changedFiles.length) {
    const untested = changedFiles.filter((path) => !hasTestEvidenceForPath(db, path));
    if (!hasVerify) {
      missingEvidence.push({
        class: 'untested_changed_files',
        detail: `no verify result for changed files: ${changedFiles.slice(0, 10).join(', ')}${changedFiles.length > 10 ? '...' : ''}`,
      });
    } else if (untested.length) {
      missingEvidence.push({
        class: 'untested_changed_files',
        detail: `changed files without test evidence: ${untested.slice(0, 10).join(', ')}${untested.length > 10 ? '...' : ''}`,
      });
    }
  }

  // 3. absent receipts — the merge decision itself has no ledger receipt.
  let mergeReceipts = 0;
  try {
    mergeReceipts = Number(db.prepare('SELECT COUNT(*) AS n FROM receipts WHERE task LIKE ?').get('merge-%')?.n || 0);
  } catch { /* receipts table may not exist yet */ }
  if (!mergeReceipts) {
    missingEvidence.push({
      class: 'absent_receipts',
      detail: 'no receipts recorded for this merge decision',
    });
  }

  // 4. stale index / 5. dirty tree from the drift surface.
  if (driftInput && Array.isArray(driftInput.dirty) && driftInput.dirty.length) {
    missingEvidence.push({
      class: 'dirty_tree',
      detail: `uncommitted files: ${driftInput.dirty.flatMap((e) => e.files).join(', ')}`,
    });
  }
  if (driftInput && Array.isArray(driftInput.staleIndex) && driftInput.staleIndex.length) {
    missingEvidence.push({
      class: 'stale_index',
      detail: `files changed since last index: ${driftInput.staleIndex.map((e) => e.project).join(', ')}`,
    });
  }

  return {
    project: projectName,
    branchA: branchA || null,
    branchB: branchB || null,
    divergence,
    changedFiles,
    conflictingFiles,
    missingEvidence,
  };
}

function changedFileSet(records) {
  const out = new Set();
  for (const rec of records) {
    for (const f of rec.files || []) {
      if (f.path && !isSecretPath(f.path)) out.add(f.path);
    }
  }
  return out;
}

// hasTestEvidenceForPath — a recorded test outcome for this path counts as
// evidence that the change was exercised. Two sources are consulted:
//   1. the per-revision test_results store (HQ-048 surface in this module), and
//   2. test-outcome receipts in the evidence ledger.
// Both are optional: an absent table or an absent receipt class is not an
// error, it simply means no evidence was recorded.
function hasTestEvidenceForPath(db, path) {
  try {
    const row = db.prepare(`
      SELECT COUNT(*) AS n FROM test_results
      WHERE file = ? OR file LIKE ?
    `).get(path, `%${path}%`);
    if (Number(row?.n || 0) > 0) return true;
  } catch { /* test_results table not created yet */ }
  try {
    const receipt = db.prepare(`
      SELECT COUNT(*) AS n FROM receipts
      WHERE kind = 'test-outcome' AND (sources LIKE ? OR sources LIKE ?)
    `).get(`%${path}%`, `%/hq/test/${path}%`);
    return Number(receipt?.n || 0) > 0;
  } catch {
    return false;
  }
}

function committedSequenceExcluding(root, include, exclude) {
  const out = tryGit(root, ['log', `${exclude}..${include}`, '--no-renames', '--name-status',
    '--format=%x1e%H%x1f%P%x1f%an%x1f%aI%x1f%s']);
  if (!out) return [];
  return parseLogRecords(out);
}

function mergeBaseOf(root, a, b) {
  const out = tryGit(root, ['merge-base', a, b]);
  return out ? String(out).trim() || null : null;
}

function readTextFile(abs, maxBytes = 256 * 1024) {
  try {
    const stat = statSync(abs);
    if (!stat.isFile() || stat.size > maxBytes) return null;
    return readFileSync(abs, 'utf8');
  } catch {
    return null;
  }
}

function dirNames(abs) {
  try {
    return readdirSync(abs);
  } catch {
    return [];
  }
}

// Candidate source/doc files for TODO + stale-doc scans. Prefers indexed rows
// and falls back to a bounded walk so drift works on an un-indexed workspace.
function candidateFiles(db, project, projectId, cache) {
  if (projectId) {
    const rows = db.prepare(`
      SELECT path, kind FROM files
      WHERE project_id = ? AND kind IN ('source', 'doc', 'config')
      ORDER BY path
    `).all(projectId);
    if (rows.length) return rows.map((r) => ({ path: r.path, kind: r.kind }));
  }
  if (!cache.has(project.path)) {
    cache.set(project.path, discoverFiles(project.path));
  }
  return cache.get(project.path)
    .filter((entry) => entry.kind === 'source' || entry.kind === 'doc' || entry.kind === 'config')
    .map((entry) => ({ path: entry.rel, kind: entry.kind }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

function scanTodos(db, project, projectId, cache, budget) {
  const results = [];
  if (budget.scanned >= MAX_TODO_FILES || budget.results >= MAX_TODO_RESULTS) return results;

  for (const file of candidateFiles(db, project, projectId, cache)) {
    if (budget.scanned >= MAX_TODO_FILES || budget.results >= MAX_TODO_RESULTS) break;
    if (isSecretPath(file.path)) continue;
    budget.scanned++;
    const text = readTextFile(join(project.path, file.path));
    if (!text) continue;
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length && budget.results < MAX_TODO_RESULTS; i++) {
      const match = TODO_RE.exec(lines[i]);
      if (!match) continue;
      const marker = match[1];
      const textPart = truncate(clean(lines[i].slice(match.index + marker.length).replace(/^[\s:—–-]+/, '')), 200);
      results.push({ project: project.name, path: file.path, line: i + 1, kind: marker, text: textPart });
      budget.results++;
    }
  }
  return results;
}

const REF_EXT = 'mjs|js|cjs|jsx|ts|tsx|mts|cts|py|go|rs|java|kt|kts|scala|cs|c|h|cc|cpp|hpp|rb|php|swift|lua|sh|ps1|vue|svelte|sql|md|mdx';

function docRefs(text) {
  const refs = new Set();
  if (!text) return [];
  for (const match of text.matchAll(/@hq:see\s+([^\s)`'",;]+)/g)) {
    const ref = match[1].replace(/[:#]\d+(?:-\d+)?$/, '');
    if (ref) refs.add(ref);
  }
  const mention = new RegExp(`(?:^|[\\s(\`'"[<])([\\w.@/-]+\\.(?:${REF_EXT}))(?:[:#][\\w.-]+)?`, 'g');
  for (const match of text.matchAll(mention)) {
    refs.add(match[1]);
  }
  return [...refs].sort();
}

function resolveRefPath(db, projectId, ref) {
  const cleaned = toPosix(ref).replace(/^\.\//, '');
  if (!cleaned) return null;
  if (projectId) {
    const row = db.prepare(`
      SELECT path FROM files
      WHERE project_id = ? AND (path = ? OR path LIKE ?)
      ORDER BY length(path) ASC, path ASC LIMIT 1
    `).get(projectId, cleaned, `%/${cleaned}`);
    if (row) return row.path;
  }
  return cleaned;
}

function lastChurn(db, projectId, projectPath, path) {
  if (projectId) {
    const row = db.prepare(`
      SELECT MAX(c.date) AS date FROM commits c
      JOIN commit_files cf ON cf.sha = c.sha
      WHERE c.project_id = ? AND (cf.path = ? OR cf.path LIKE ?)
    `).get(projectId, path, `%/${path}`);
    if (row && row.date) return row.date;
  }
  try {
    const stat = statSync(join(projectPath, path));
    return new Date(stat.mtimeMs).toISOString();
  } catch {
    return null;
  }
}

function scanStaleDocs(db, project, projectId, cache) {
  const docs = [];
  if (projectId) {
    const rows = db.prepare(`
      SELECT path, mtime_ms FROM files
      WHERE project_id = ? AND kind = 'doc'
      ORDER BY path LIMIT 40
    `).all(projectId);
    for (const row of rows) docs.push({ path: row.path, mtimeMs: row.mtime_ms });
  }
  if (!docs.length) {
    if (!cache.has(project.path)) cache.set(project.path, discoverFiles(project.path));
    for (const entry of cache.get(project.path)) {
      if (entry.kind !== 'doc') continue;
      if (docs.length >= 40) break;
      docs.push({ path: entry.rel, mtimeMs: entry.mtimeMs });
    }
  }

  const stale = [];
  for (const doc of docs) {
    if (isSecretPath(doc.path)) continue;
    const text = readTextFile(join(project.path, doc.path), 200 * 1024);
    if (!text) continue;
    const refs = docRefs(text).filter((ref) => ref !== doc.path).slice(0, 12);
    if (!refs.length) continue;

    let churn = 0;
    let newest = null;
    for (const ref of refs) {
      const path = resolveRefPath(db, projectId, ref);
      if (!path || path === doc.path || isSecretPath(path)) continue;
      const when = lastChurn(db, projectId, project.path, path);
      if (!when) continue;
      const whenMs = Date.parse(when);
      if (!Number.isFinite(whenMs)) continue;
      if (whenMs > doc.mtimeMs) {
        churn++;
        if (!newest || when > newest) newest = when;
      }
    }
    if (churn > 0 && newest) {
      stale.push({ project: project.name, doc: doc.path, churn, since: newest });
    }
  }
  return stale;
}

/**
 * drift — what moved since the index was built.
 * All lists are sorted and contain no secret paths.
 */
export function drift(db, { root = null, projects = null } = {}) {
  const list = resolveProjects(db, root, projects);
  const staleIndex = [];
  const dirty = [];
  const aheadBehindList = [];
  const staleDocs = [];
  const todos = [];
  const missingDocs = [];
  const cache = new Map();
  const todoBudget = { scanned: 0, results: 0 };

  for (const project of list) {
    if (!existsSync(project.path)) {
      missingDocs.push({ project: project.name, missing: ['README.md', 'AGENTS.md'] });
      continue;
    }

    const row = projectRow(db, project.name);
    const projectId = row ? row.id : null;

    // Index freshness: size mismatch or a mtime newer than indexed_at.
    if (projectId) {
      const files = db.prepare('SELECT path, size, mtime_ms, indexed_at FROM files WHERE project_id = ?').all(projectId);
      let changed = 0;
      for (const file of files) {
        if (isSecretPath(file.path)) continue;
        let stat;
        try {
          stat = statSync(join(project.path, file.path));
        } catch {
          changed++; // vanished from disk: the index cannot be fresh
          continue;
        }
        if (Number(file.size) !== stat.size) { changed++; continue; }
        const indexedAt = file.indexed_at ? Date.parse(file.indexed_at) : NaN;
        if (Number.isFinite(indexedAt) && Math.floor(stat.mtimeMs) > indexedAt) changed++;
      }
      if (changed > 0) staleIndex.push({ project: project.name, changedSinceIndex: changed });
    }

    const dirtyList = [...new Set(dirtyFiles(project.path)
      .map((file) => toPosix(file.path))
      .filter((path) => path && !isSecretPath(path)))].sort().slice(0, 200);
    if (dirtyList.length) dirty.push({ project: project.name, files: dirtyList });

    const tracking = aheadBehind(project.path);
    aheadBehindList.push({
      project: project.name,
      ahead: tracking ? tracking.ahead : 0,
      behind: tracking ? tracking.behind : 0,
    });

    staleDocs.push(...scanStaleDocs(db, project, projectId, cache));
    todos.push(...scanTodos(db, project, projectId, cache, todoBudget));

    const names = new Set(dirNames(project.path).map((name) => name.toLowerCase()));
    const missing = [];
    if (!names.has('readme.md')) missing.push('README.md');
    if (!names.has('agents.md')) missing.push('AGENTS.md');
    if (missing.length) missingDocs.push({ project: project.name, missing });
  }

  staleIndex.sort((a, b) => a.project.localeCompare(b.project));
  dirty.sort((a, b) => a.project.localeCompare(b.project));
  aheadBehindList.sort((a, b) => a.project.localeCompare(b.project));
  staleDocs.sort((a, b) => a.project.localeCompare(b.project) || a.doc.localeCompare(b.doc));
  todos.sort((a, b) => a.project.localeCompare(b.project) || a.path.localeCompare(b.path) || a.line - b.line);
  missingDocs.sort((a, b) => a.project.localeCompare(b.project));

  return {
    staleIndex,
    dirty,
    aheadBehind: aheadBehindList,
    staleDocs,
    todos: todos.slice(0, MAX_TODO_RESULTS),
    missingDocs,
  };
}

function newestTimestamp(db) {
  const commit = db.prepare('SELECT MAX(date) AS value FROM commits').get();
  if (commit && commit.value) return commit.value;
  const project = db.prepare('SELECT MAX(indexed_at) AS value FROM projects').get();
  if (project && project.value) return project.value;
  const file = db.prepare('SELECT MAX(indexed_at) AS value FROM files').get();
  return file && file.value ? file.value : null;
}

function languageRows(db, projectId, limit = 6) {
  if (!projectId) return [];
  return db.prepare(`
    SELECT lang, COUNT(*) AS files FROM files
    WHERE project_id = ? AND lang IS NOT NULL
    GROUP BY lang
    ORDER BY files DESC, lang ASC
    LIMIT ?
  `).all(projectId, limit).map((row) => ({
    lang: row.lang,
    label: languageLabel(row.lang),
    files: Number(row.files),
  }));
}

function latestCommit(db, projectId) {
  if (!projectId) return null;
  const row = db.prepare(`
    SELECT sha, date, subject, type, scope FROM commits
    WHERE project_id = ? ORDER BY date DESC, sha ASC LIMIT 1
  `).get(projectId);
  if (!row) return null;
  return { sha: row.sha, date: row.date, subject: clean(row.subject), type: row.type ?? null, scope: row.scope ?? null };
}

function shortSha(sha, length = 7) {
  return sha ? String(sha).slice(0, length) : null;
}

function plural(count, singular, pluralForm = singular + 's') {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/**
 * brief — owner-facing workspace summary. Deterministic and clock-free:
 * ages are measured from the newest commit date unless `now` is injected.
 * The text rendering never exceeds 6000 bytes.
 */
export function brief(db, { root = null, projects = null, now = null, audience = 'agent' } = {}) {
  const list = resolveProjects(db, root, projects);
  const driftData = drift(db, { root, projects: list });
  const throughDate = now ? isoTimestamp(now) : (newestTimestamp(db) || '1970-01-01T00:00:00.000Z');

  const dirtyByProject = new Map(driftData.dirty.map((entry) => [entry.project, entry.files.length]));
  const aheadByProject = new Map(driftData.aheadBehind.map((entry) => [entry.project, entry]));
  const staleByProject = new Map(driftData.staleIndex.map((entry) => [entry.project, entry.changedSinceIndex]));
  const missingByProject = new Map(driftData.missingDocs.map((entry) => [entry.project, entry.missing]));
  const todosByProject = new Map();
  for (const todo of driftData.todos) {
    todosByProject.set(todo.project, (todosByProject.get(todo.project) || 0) + 1);
  }

  const projectEntries = [];
  const nextActions = [];
  let totalFiles = 0;
  let totalSymbols = 0;
  let totalCommits = 0;
  let totalDirty = 0;
  let totalAhead = 0;
  let totalBehind = 0;
  const workspaceLanguages = new Map();

  for (const project of list) {
    const row = projectRow(db, project.name);
    const projectId = row ? row.id : null;
    const tracking = aheadByProject.get(project.name) || { ahead: 0, behind: 0 };
    const dirtyCount = dirtyByProject.get(project.name) || 0;
    const staleCount = staleByProject.get(project.name) || 0;
    const missing = missingByProject.get(project.name) || [];
    const todoCount = todosByProject.get(project.name) || 0;
    const languages = languageRows(db, projectId, 5);
    const commitRow = projectId
      ? db.prepare('SELECT COUNT(*) AS count FROM commits WHERE project_id = ?').get(projectId)
      : { count: 0 };
    const commits = Number(commitRow.count || 0);
    const last = latestCommit(db, projectId);
    const files = Number(row?.file_count || 0);
    const symbols = Number(row?.symbol_count || 0);
    const indexedAt = row?.indexed_at || null;

    const entry = {
      name: project.name,
      branch: row?.branch || null,
      head: row?.head ? String(row.head).slice(0, 12) : (last ? last.sha.slice(0, 12) : null),
      dirty: dirtyCount,
      ahead: tracking.ahead,
      behind: tracking.behind,
      files,
      symbols,
      commits,
      indexedAt,
      indexAgeDays: indexedAt ? daysBetween(indexedAt, throughDate) : null,
      staleIndex: staleCount,
      languages,
      lastCommit: last,
      todoCount,
      missingDocs: missing,
    };
    projectEntries.push(entry);

    if (dirtyCount > 0) nextActions.push({ kind: 'dirty', id: project.name, reason: `${plural(dirtyCount, 'uncommitted file')}` });
    if (tracking.ahead > 0) nextActions.push({ kind: 'push', id: project.name, reason: `${plural(tracking.ahead, 'commit')} ahead of upstream` });
    if (tracking.behind > 0) nextActions.push({ kind: 'pull', id: project.name, reason: `${plural(tracking.behind, 'commit')} behind upstream` });
    if (staleCount > 0) nextActions.push({ kind: 'index', id: project.name, reason: `${plural(staleCount, 'file')} changed since the last index` });
    if (missing.length) nextActions.push({ kind: 'docs', id: project.name, reason: `missing ${missing.join(', ')}` });
    if (todoCount > 0) nextActions.push({ kind: 'todos', id: project.name, reason: `${plural(todoCount, 'open marker')}` });

    totalFiles += files;
    totalSymbols += symbols;
    totalCommits += commits;
    totalDirty += dirtyCount;
    totalAhead += tracking.ahead;
    totalBehind += tracking.behind;
    for (const language of languages) {
      const current = workspaceLanguages.get(language.lang) || { lang: language.lang, label: language.label, files: 0 };
      current.files += language.files;
      workspaceLanguages.set(language.lang, current);
    }
  }

  nextActions.sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id) || a.reason.localeCompare(b.reason));

  const recentCommits = db.prepare(`
    SELECT c.sha, c.date, c.subject, c.type, c.scope, p.name AS project
    FROM commits c JOIN projects p ON p.id = c.project_id
    ${list.length ? `WHERE p.name IN (${list.map(() => '?').join(',')})` : 'WHERE 1 = 0'}
    ORDER BY c.date DESC, c.sha ASC LIMIT 10
  `).all(...list.map((project) => project.name)).map((row) => ({
    sha: row.sha,
    project: row.project,
    date: row.date,
    subject: clean(row.subject),
    type: row.type ?? null,
    scope: row.scope ?? null,
  }));

  const data = {
    schema: 'hq.brief/1',
    throughDate,
    workspace: {
      projects: projectEntries.length,
      files: totalFiles,
      symbols: totalSymbols,
      commits: totalCommits,
      dirty: totalDirty,
      ahead: totalAhead,
      behind: totalBehind,
      languages: [...workspaceLanguages.values()]
        .sort((a, b) => b.files - a.files || a.lang.localeCompare(b.lang))
        .slice(0, 8),
    },
    projects: projectEntries,
    recentCommits,
    nextActions,
  };

  // Owner surfaces speak VIVIM; the default agent brief keeps engineering terms.
  if (audience === 'owner') {
    data.audience = 'owner';
    data.labels = {
      sitrep: userTerm('sitrep'),
      spaces: `My ${userTerm('space')}s`,
      evidence: userTerm('evidence'),
    };
  }

  return { data, text: renderBriefText(data, audience) };
}

function renderBriefText(data, audience = 'agent') {
  const settings = [
    { commitLimit: 10, actionLimit: 20, langLimit: 4 },
    { commitLimit: 5, actionLimit: 10, langLimit: 3 },
    { commitLimit: 3, actionLimit: 5, langLimit: 2 },
    { commitLimit: 0, actionLimit: 0, langLimit: 1 },
  ];
  let text = '';
  for (const setting of settings) {
    text = briefText(data, setting, audience);
    if (byteLength(text) <= MAX_TEXT_BYTES) break;
  }
  return clampBytes(text, MAX_TEXT_BYTES);
}

function briefText(data, { commitLimit, actionLimit, langLimit }, audience = 'agent') {
  const owner = audience === 'owner' && data.labels;
  const lines = [];
  const workspace = data.workspace;
  lines.push(`# ${owner ? data.labels.sitrep : 'HQ brief'}`, '');
  lines.push(`As of ${data.throughDate} · ${plural(workspace.projects, 'project')} · ${plural(workspace.files, 'file')} · ${plural(workspace.symbols, 'symbol')} · ${plural(workspace.commits, 'commit')}`);
  lines.push(`Working tree: ${workspace.dirty} dirty · ${workspace.ahead} ahead · ${workspace.behind} behind`);
  if (workspace.languages.length) {
    lines.push(`Languages: ${workspace.languages.slice(0, langLimit).map((l) => `${l.label} ${l.files}`).join(', ')}`);
  }
  lines.push('', `## ${owner ? data.labels.spaces : 'Projects'}`);

  for (const project of data.projects) {
    lines.push(`### ${project.name}`);
    const bits = [
      project.branch ? `branch ${project.branch}` : 'no branch',
      project.head ? `head ${project.head}` : 'no head',
      `${project.files} files`,
      `${project.symbols} symbols`,
      project.dirty ? `dirty ${project.dirty}` : 'clean',
      `ahead ${project.ahead} / behind ${project.behind}`,
      project.indexAgeDays == null ? 'not indexed' : `indexed ${project.indexAgeDays}d ago`,
    ];
    lines.push(bits.join(' · '));
    if (project.languages.length) {
      lines.push(`Languages: ${project.languages.slice(0, langLimit).map((l) => `${l.label} ${l.files}`).join(', ')}`);
    }
    if (project.lastCommit) {
      lines.push(`Latest: ${String(project.lastCommit.date).slice(0, 10)} ${project.lastCommit.subject}`);
    }
    const own = data.nextActions.filter((action) => action.id === project.name).slice(0, 3);
    for (const action of own) lines.push(`Next: ${action.kind} — ${action.reason}`);
    lines.push('');
  }

  if (commitLimit > 0 && data.recentCommits.length) {
    lines.push(`## ${owner ? data.labels.evidence : 'Recent commits'}`);
    for (const commit of data.recentCommits.slice(0, commitLimit)) {
      lines.push(`- ${String(commit.date).slice(0, 10)} ${commit.project} ${shortSha(commit.sha)} ${commit.subject}`);
    }
    lines.push('');
  }

  if (actionLimit > 0 && data.nextActions.length) {
    lines.push('## Next actions');
    for (const action of data.nextActions.slice(0, actionLimit)) {
      lines.push(`- ${action.kind} ${action.id}: ${action.reason}`);
    }
    lines.push('');
  }

  return lines.join('\n').replace(/\n+$/, '') + '\n';
}

function feedWindow(db, { throughHead = null, throughDate = null } = {}) {
  let headDate = null;
  if (throughHead) {
    const row = db.prepare('SELECT date FROM commits WHERE sha = ?').get(throughHead);
    if (row) headDate = row.date;
  }
  const limits = [throughDate, headDate].filter(Boolean).sort();
  return { dateLimit: limits.length ? limits[0] : null };
}

function escapeCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ').trim();
}

/**
 * buildFeed — a deterministic, clock-free snapshot for static publishing.
 * Schema hq.feed/1, sorted arrays, sha256 provenance, no absolute paths.
 */
export function buildFeed(db, {
  root = null, projects = null, throughHead = null, throughDate = null,
} = {}) {
  const list = resolveProjects(db, root, projects);
  const names = list.map((project) => project.name);
  const { dateLimit } = feedWindow(db, { throughHead, throughDate });

  const namePlaceholders = names.map(() => '?').join(',');
  const filters = [`p.name IN (${namePlaceholders})`];
  const params = [...names];
  if (dateLimit) {
    filters.push('c.date <= ?');
    params.push(dateLimit);
  }

  const commitRows = names.length
    ? db.prepare(`
        SELECT c.sha, c.date, c.author, c.subject, c.type, c.scope, p.name AS project
        FROM commits c JOIN projects p ON p.id = c.project_id
        WHERE ${filters.join(' AND ')}
        ORDER BY c.date DESC, c.sha ASC
        LIMIT 200
      `).all(...params)
    : [];

  const filesBySha = new Map();
  if (commitRows.length) {
    const placeholders = commitRows.map(() => '?').join(',');
    const fileRows = db.prepare(`
      SELECT sha, path FROM commit_files WHERE sha IN (${placeholders}) ORDER BY sha, path
    `).all(...commitRows.map((row) => row.sha));
    for (const file of fileRows) {
      if (isSecretPath(file.path)) continue;
      if (!filesBySha.has(file.sha)) filesBySha.set(file.sha, []);
      filesBySha.get(file.sha).push(file.path);
    }
  }

  const commits = commitRows.slice(0, 100).map((row) => ({
    sha: row.sha,
    project: row.project,
    date: row.date,
    author: clean(row.author),
    subject: clean(row.subject),
    type: row.type ?? null,
    scope: row.scope ?? null,
    files: (filesBySha.get(row.sha) || []).slice(0, 50),
  }));

  const newest = commitRows[0] || null;
  const effectiveThroughHead = throughHead || (newest ? newest.sha : null);
  const effectiveThroughDate = throughDate || (newest ? newest.date : newestTimestamp(db));

  const driftData = drift(db, { root, projects: list });
  const dirtyByProject = new Map(driftData.dirty.map((entry) => [entry.project, entry.files.length]));
  const staleByProject = new Map(driftData.staleIndex.map((entry) => [entry.project, entry.changedSinceIndex]));
  const missingByProject = new Map(driftData.missingDocs.map((entry) => [entry.project, entry.missing]));
  const todoByProject = new Map();
  for (const todo of driftData.todos) {
    todoByProject.set(todo.project, (todoByProject.get(todo.project) || 0) + 1);
  }

  const latestByProject = new Map();
  for (const commit of commits) {
    if (!latestByProject.has(commit.project)) latestByProject.set(commit.project, commit);
  }

  let totalFiles = 0;
  let totalSymbols = 0;
  const feedProjects = list.map((project) => {
    const row = projectRow(db, project.name);
    const projectId = row ? row.id : null;
    const latest = latestByProject.get(project.name) || null;
    const languages = languageRows(db, projectId, 5);
    const files = Number(row?.file_count || 0);
    const symbols = Number(row?.symbol_count || 0);
    totalFiles += files;
    totalSymbols += symbols;
    return {
      name: project.name,
      branch: row?.branch || null,
      head: latest ? latest.sha : (row?.head || null),
      files,
      symbols,
      lastCommit: latest ? {
        sha: latest.sha, date: latest.date, subject: latest.subject, type: latest.type, scope: latest.scope,
      } : null,
      languages,
      dirty: dirtyByProject.get(project.name) || 0,
      ahead: (driftData.aheadBehind.find((entry) => entry.project === project.name) || {}).ahead || 0,
      behind: (driftData.aheadBehind.find((entry) => entry.project === project.name) || {}).behind || 0,
      staleIndex: staleByProject.get(project.name) || 0,
      todoCount: todoByProject.get(project.name) || 0,
      missingDocs: missingByProject.get(project.name) || [],
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const body = {
    schema: 'hq.feed/1',
    throughHead: effectiveThroughHead,
    throughDate: effectiveThroughDate,
    workspace: {
      projects: feedProjects.length,
      files: totalFiles,
      symbols: totalSymbols,
      commits: commitRows.length,
      dirty: driftData.dirty.length,
      ahead: driftData.aheadBehind.reduce((sum, entry) => sum + entry.ahead, 0),
      behind: driftData.aheadBehind.reduce((sum, entry) => sum + entry.behind, 0),
    },
    projects: feedProjects,
    commits,
    drift: {
      staleIndex: driftData.staleIndex,
      dirty: driftData.dirty,
      aheadBehind: driftData.aheadBehind,
      missingDocs: driftData.missingDocs,
      todoCount: driftData.todos.length,
    },
  };

  const digest = sha256(canonicalJson(body));
  const feed = {
    ...body,
    provenance: {
      schema: 'hq.feed/1',
      algorithm: 'sha256',
      digest,
      throughHead: effectiveThroughHead,
      throughDate: effectiveThroughDate,
      projects: feedProjects.length,
      commits: commitRows.length,
    },
  };

  return { feed, json: canonicalJson(feed), markdown: renderFeedMarkdown(feed) };
}

function renderFeedMarkdown(feed) {
  const lines = [];
  lines.push('# HQ feed', '');
  lines.push(`Schema: ${feed.schema}`);
  lines.push(`Through: ${feed.throughDate ?? 'none'}${feed.throughHead ? ` (${shortSha(feed.throughHead, 12)})` : ''}`);
  lines.push(`Workspace: ${plural(feed.workspace.projects, 'project')} · ${plural(feed.workspace.files, 'file')} · ${plural(feed.workspace.symbols, 'symbol')} · ${plural(feed.workspace.commits, 'commit')}`);
  lines.push(`Working tree: ${feed.workspace.dirty} dirty · ${feed.workspace.ahead} ahead · ${feed.workspace.behind} behind`);
  lines.push('', '## Projects', '');
  lines.push('| Project | Branch | Head | Files | Symbols | Dirty | Ahead | Behind |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const project of feed.projects) {
    lines.push(`| ${escapeCell(project.name)} | ${escapeCell(project.branch || '—')} | ${escapeCell(shortSha(project.head) || '—')} | ${project.files} | ${project.symbols} | ${project.dirty} | ${project.ahead} | ${project.behind} |`);
  }

  if (feed.commits.length) {
    lines.push('', '## Recent commits', '');
    for (const commit of feed.commits) {
      const tag = commit.type ? `[${commit.type}${commit.scope ? `/${commit.scope}` : ''}] ` : '';
      lines.push(`- ${String(commit.date).slice(0, 10)} ${commit.project} ${shortSha(commit.sha)} ${tag}${commit.subject}`);
    }
  }

  const driftLines = [];
  for (const entry of feed.drift.dirty) driftLines.push(`- dirty: ${entry.project} (${plural(entry.files.length, 'file')})`);
  for (const entry of feed.drift.staleIndex) driftLines.push(`- stale index: ${entry.project} (${plural(entry.changedSinceIndex, 'file')})`);
  for (const entry of feed.drift.aheadBehind) {
    if (entry.ahead || entry.behind) driftLines.push(`- remote: ${entry.project} (${entry.ahead} ahead, ${entry.behind} behind)`);
  }
  for (const entry of feed.drift.missingDocs) driftLines.push(`- missing docs: ${entry.project} (${entry.missing.join(', ')})`);
  if (feed.drift.todoCount) driftLines.push(`- open markers: ${feed.drift.todoCount}`);
  if (driftLines.length) {
    lines.push('', '## Drift', '', ...driftLines);
  }

  lines.push('', '## Provenance', '');
  lines.push(`sha256:${feed.provenance.digest}`);
  lines.push(`throughHead: ${feed.provenance.throughHead ?? 'none'}`);
  lines.push(`throughDate: ${feed.provenance.throughDate ?? 'none'}`);
  return lines.join('\n').replace(/\n+$/, '') + '\n';
}

function firstDifference(committed, fresh) {
  const a = String(committed).split('\n');
  const b = String(fresh).split('\n');
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (a[i] !== b[i]) return i + 1;
  }
  return 0;
}

/**
 * checkFeed — regenerate the feed through the committed feed's own window and
 * compare byte-for-byte. Any difference means the committed feed is stale.
 */
export function checkFeed(db, {
  root = null, projects = null, committedJson = null, committedMarkdown = null,
} = {}) {
  const reasons = [];
  if (committedJson == null && committedMarkdown == null) {
    return { ok: false, reasons: ['no committed feed provided'] };
  }

  let throughHead = null;
  let throughDate = null;
  if (committedJson != null) {
    let parsed = null;
    try {
      parsed = JSON.parse(String(committedJson));
    } catch (error) {
      reasons.push(`json: invalid feed JSON (${error.message})`);
    }
    if (parsed) {
      if (parsed.schema !== 'hq.feed/1') reasons.push(`json: schema hq.feed/1 expected, got ${String(parsed.schema ?? 'missing')}`);
      throughHead = parsed.throughHead ?? null;
      throughDate = parsed.throughDate ?? null;
    }
  }

  const fresh = buildFeed(db, { root, projects, throughHead, throughDate });

  if (committedJson != null) {
    const committed = String(committedJson);
    if (committed !== fresh.json) {
      const line = firstDifference(committed, fresh.json);
      reasons.push(`json: differs from regenerated feed at line ${line || 1}`);
    }
  }
  if (committedMarkdown != null) {
    const committed = String(committedMarkdown);
    if (committed !== fresh.markdown) {
      const line = firstDifference(committed, fresh.markdown);
      reasons.push(`markdown: differs from regenerated feed at line ${line || 1}`);
    }
  }

  return { ok: reasons.length === 0, reasons };
}

/**
 * recordTestResult — record one test outcome keyed to a source revision.
 * Idempotent on (sha, test_id): re-recording the same test at the same
 * revision replaces the outcome. Returns the recorded row.
 * The test_results table itself is created by schema.mjs's migrate(), which
 * runs on every openDb/openMemoryDb — no per-call DDL here.
 */
export function recordTestResult(db, {
  project = null, sha = null, testId = null, status = null,
  file = null, line = null, durationMs = null, output = null,
} = {}) {
  if (!db) throw new TypeError('recordTestResult: db is required');
  if (!testId || !String(testId).trim()) throw new TypeError('recordTestResult: testId is required');
  if (!sha || !String(sha).trim()) throw new TypeError('recordTestResult: sha is required');
  let projectId = null;
  if (project) {
    const row = projectRow(db, project.name || project);
    if (row) projectId = row.id;
  }
  const statusClean = clean(String(status ?? 'pass'));
  const lineNum = line == null ? null : Number(line);
  const durationNum = durationMs == null ? null : Number(durationMs);
  db.prepare(`
    INSERT INTO test_results(project_id, sha, test_id, status, file, line, duration_ms, output, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(sha, test_id) DO UPDATE SET
      project_id = excluded.project_id,
      status = excluded.status,
      file = excluded.file,
      line = excluded.line,
      duration_ms = excluded.duration_ms,
      output = excluded.output,
      recorded_at = excluded.recorded_at
  `).run(
    projectId,
    String(sha),
    String(testId).trim(),
    statusClean,
    file == null ? null : String(file),
    lineNum,
    durationNum,
    output == null ? null : String(output),
    nowISO(),
  );
  return {
    project: project ? (project.name || project) : null,
    sha: String(sha),
    testId: String(testId).trim(),
    status: statusClean,
  };
}

/**
 * testsPassedOnlyOnOlderRevisions — for each test, the most recent commit
 * (by date) where it was recorded as passing, compared against the project's
 * HEAD. Returns every test with its last passing revision and whether HEAD is
 * that revision. Tests whose last passing revision is not HEAD passed only on
 * older source revisions.
 */
export function testsPassedOnlyOnOlderRevisions(db, { project = null } = {}) {
  let list;
  if (project) {
    const row = projectRow(db, project.name || project);
    list = row ? [{ name: row.name, path: row.path, id: row.id }] : [];
  } else {
    list = resolveProjects(db, null, null)
      .map((p) => { const r = projectRow(db, p.name); return { name: p.name, path: p.path, id: r ? r.id : null }; })
      .filter((p) => p.id != null);
  }

  const results = [];
  for (const pr of list) {
    const headSha = head(pr.path);
    const rows = db.prepare(`
      SELECT tr.test_id, tr.sha, c.date
      FROM test_results tr
      JOIN commits c ON c.sha = tr.sha
      WHERE tr.project_id = ? AND tr.status = 'pass'
      ORDER BY tr.test_id ASC, c.date DESC, tr.sha ASC
    `).all(pr.id);
    const lastPass = new Map();
    for (const row of rows) {
      if (!lastPass.has(row.test_id)) lastPass.set(row.test_id, row);
    }
    for (const [testId, row] of lastPass) {
      results.push({
        project: pr.name,
        testId,
        lastPassingSha: row.sha,
        lastPassingDate: row.date,
        headSha,
        headIsLastPassing: Boolean(headSha && row.sha === headSha),
      });
    }
  }
  return results;
}

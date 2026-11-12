// Repo-aware, dependency-free workspace tools for a webapp-native development agent.
// The host owns all filesystem effects. Never expose arbitrary files or shell commands to model output.
import { readFile, writeFile, readdir, lstat, mkdir, rename, unlink } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { resolve, relative, dirname, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

const VISIBLE = ['harness/src/', 'harness/test/', 'harness/docs/', 'studio/src/', 'studio/test/', 'apps/mobile-relay/', 'docs/'];
const WRITABLE = ['harness/src/', 'harness/test/', 'studio/src/', 'studio/test/', 'apps/mobile-relay/'];
const PROTECTED = new Set([
  'harness/src/core/send.mjs', 'harness/src/core/journal.mjs', 'harness/src/core/tabs.mjs',
  'harness/src/interface/approval.mjs', 'harness/src/interface/standing.mjs',
  'harness/src/interface/target.mjs', 'harness/src/interface/router.mjs',
  'harness/src/build/build.mjs', 'harness/src/build/cli.mjs', 'harness/src/build/review.mjs',
  'harness/src/build/review-cli.mjs', 'harness/src/provenance/ledger.mjs',
]);
const IGNORED = new Set(['.git', '.env', 'node_modules', 'runtime', 'sources', 'dist', 'build', 'coverage', '.next', '.vercel', 'secrets', 'credentials']);
const EXT = /\.(?:mjs|js|cjs|json|md|html|css|ts|tsx|jsx)$/i;
const hash = text => createHash('sha256').update(text).digest('hex');
const fail = (code, message) => Object.assign(new Error(message), { code });
export const workspacePolicy = Object.freeze({ visible: VISIBLE, writable: WRITABLE, protected: [...PROTECTED] });

export function safePath(path, { write = false } = {}) {
  if (typeof path !== 'string' || !path || path.length > 300 || path.includes('\\') || path.includes('\0') || path.startsWith('/') || /^[a-z]:/i.test(path)) throw fail('PATH_INVALID', 'Path must be a relative POSIX repository path');
  const parts = path.split('/');
  if (parts.some(x => !x || x === '.' || x === '..' || x.startsWith('.') || IGNORED.has(x))) throw fail('PATH_INVALID', 'Unsafe path segment');
  const allowed = write ? WRITABLE : VISIBLE;
  if (!allowed.some(p => path.startsWith(p)) || !EXT.test(path)) throw fail('PATH_SCOPE', 'Path is outside the approved source directories');
  if (write && (PROTECTED.has(path) || path.startsWith('harness/src/dev/'))) throw fail('PATH_PROTECTED', 'Protected harness source');
  return path;
}

export function createWorkspace({ root, maxFileBytes = 120000 } = {}) {
  if (typeof root !== 'string') throw fail('ROOT_REQUIRED', 'Workspace root required');
  const base = resolve(root);
  async function pathname(path, write = false) {
    safePath(path, { write });
    const abs = resolve(base, ...path.split('/'));
    if (!abs.startsWith(base + sep)) throw fail('PATH_ESCAPE', 'Path escapes workspace');
    // Every existing ancestor must be a normal directory; prevents symlink traversal.
    let cur = base;
    const baseStat = await lstat(base);
    if (!baseStat.isDirectory() || baseStat.isSymbolicLink()) throw fail('ROOT_UNSAFE', 'Workspace root must be a real directory');
    const parts = path.split('/');
    for (let i = 0; i < parts.length; i++) {
      cur = resolve(cur, parts[i]);
      let st;
      try { st = await lstat(cur); } catch (e) { if (e.code === 'ENOENT') continue; throw e; }
      if (st.isSymbolicLink() || (i < parts.length - 1 && !st.isDirectory())) throw fail('PATH_SYMLINK', 'Symlinks and non-directory ancestors are not allowed');
      if (i === parts.length - 1 && !st.isFile()) throw fail('PATH_NOT_FILE', 'Target must be a regular file');
    }
    return abs;
  }
  async function read(path, { startLine = 1, maxLines = 180 } = {}) {
    const full = await pathname(path);
    const st = await lstat(full);
    if (st.size > maxFileBytes) throw fail('FILE_TOO_LARGE', 'File exceeds context limit');
    if (!Number.isInteger(startLine) || startLine < 1 || !Number.isInteger(maxLines) || maxLines < 1 || maxLines > 400) throw fail('RANGE_INVALID', 'Invalid line range');
    const content = await readFile(full, 'utf8');
    const lines = content.split('\n');
    return { path, sha256: hash(content), totalLines: lines.length, startLine, lines: lines.slice(startLine - 1, startLine - 1 + maxLines).map((text, i) => ({ line: startLine + i, text })) };
  }
  async function list({ path = '', limit = 150 } = {}) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 300) throw fail('LIMIT_INVALID', 'Invalid list limit');
    // Root view exposes only known source roots and never enumerates private directories.
    if (!path) return { entries: VISIBLE.map(p => ({ path: p, type: 'source_root' })), truncated: false };
    const prefix = path.endsWith('/') ? path.slice(0, -1) : path;
    if (!VISIBLE.some(p => (prefix + '/').startsWith(p) || p.startsWith(prefix + '/'))) throw fail('PATH_SCOPE', 'Unknown source directory');
    const parts = prefix.split('/');
    if (parts.some(p => !p || p === '..' || p.startsWith('.') || IGNORED.has(p))) throw fail('PATH_INVALID', 'Unsafe directory');
    const abs = resolve(base, ...parts);
    if (!abs.startsWith(base + sep)) throw fail('PATH_ESCAPE', 'Directory escapes workspace');
    let cur = base;
    for (const part of parts) { cur = resolve(cur, part); const st = await lstat(cur); if (!st.isDirectory() || st.isSymbolicLink()) throw fail('PATH_SYMLINK', 'Directory must be real'); }
    const entries = [];
    for (const d of await readdir(abs, { withFileTypes: true })) {
      if (d.name.startsWith('.') || IGNORED.has(d.name) || d.isSymbolicLink()) continue;
      const child = prefix + '/' + d.name;
      if (d.isDirectory()) entries.push({ path: child + '/', type: 'directory' });
      else if (d.isFile() && EXT.test(d.name) && VISIBLE.some(p => child.startsWith(p))) entries.push({ path: child, type: 'file' });
      if (entries.length >= limit) break;
    }
    return { entries, truncated: entries.length === limit };
  }
  async function search({ query, path = 'harness/src/', maxMatches = 25, maxFiles = 200 } = {}) {
    if (typeof query !== 'string' || !query.trim() || query.length > 160) throw fail('QUERY_INVALID', 'Search query required (max 160 chars)');
    const rootDir = path.replace(/\/$/, '');
    if (!VISIBLE.some(p => (rootDir + '/').startsWith(p))) throw fail('PATH_SCOPE', 'Search must start within an approved source root');
    if (!Number.isInteger(maxMatches) || maxMatches < 1 || maxMatches > 60) throw fail('LIMIT_INVALID', 'Invalid match count');
    if (!Number.isInteger(maxFiles) || maxFiles < 1 || maxFiles > 400) throw fail('LIMIT_INVALID', 'Invalid file count');
    // Validate root directory without exposing other paths.
    const stack = [rootDir]; const matches = []; let scanned = 0;
    while (stack.length && scanned < maxFiles && matches.length < maxMatches) {
      const dir = stack.pop();
      let entries;
      try { entries = (await list({ path: dir, limit: 300 })).entries; } catch (e) { if (e.code === 'ENOENT') continue; throw e; }
      for (const entry of entries) {
        if (entry.type === 'directory') stack.push(entry.path.slice(0, -1));
        else if (entry.type === 'file') {
          if (scanned++ >= maxFiles) break;
          let r;
          try { r = await read(entry.path, { maxLines: 400 }); } catch (e) { if (e.code === 'FILE_TOO_LARGE') continue; throw e; }
          const needle = query.toLowerCase();
          for (const line of r.lines) if (line.text.toLowerCase().includes(needle)) {
            matches.push({ path: entry.path, line: line.line, excerpt: line.text.slice(0, 240) });
            if (matches.length >= maxMatches) break;
          }
          if (matches.length >= maxMatches) break;
        }
      }
    }
    return { query, matches, scanned, truncated: scanned >= maxFiles || matches.length >= maxMatches };
  }
  async function edit({ path, expectedSha256, find, replace: replacement }) {
    const full = await pathname(path, true);
    if (!/^[a-f0-9]{64}$/.test(String(expectedSha256))) throw fail('EDIT_REVISION', 'Full expected sha256 required');
    if (typeof find !== 'string' || !find || find.length > maxFileBytes || typeof replacement !== 'string' || replacement.length > maxFileBytes) throw fail('EDIT_INVALID', 'Nonempty find and bounded replacement required');
    const before = await readFile(full, 'utf8');
    if (before.length > maxFileBytes || hash(before) !== expectedSha256) throw fail('EDIT_STALE', 'File content changed; re-read before editing');
    if (before.indexOf(find) < 0 || before.indexOf(find) !== before.lastIndexOf(find)) throw fail('EDIT_AMBIGUOUS', 'Find text must occur exactly once');
    const after = before.replace(find, replacement);
    if (after.length > maxFileBytes) throw fail('FILE_TOO_LARGE', 'Edited file exceeds limit');
    const temp = full + '.' + randomUUID() + '.tmp';
    try { await writeFile(temp, after, { flag: 'wx', mode: 0o600 });
      // Re-check before atomic rename; each job must own its workspace to avoid concurrent writers.
      if (hash(await readFile(full, 'utf8')) !== expectedSha256) throw fail('EDIT_STALE', 'File changed during edit');
      await rename(temp, full);
    } finally { await unlink(temp).catch(() => {}); }
    return { path, beforeSha256: expectedSha256, afterSha256: hash(after), changed: before !== after };
  }
  async function create({ path, content }) {
    const full = await pathname(path, true);
    if (typeof content !== 'string' || !content || content.length > maxFileBytes) throw fail('CREATE_INVALID', 'File content required within limit');
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content, { flag: 'wx', mode: 0o600 });
    return { path, afterSha256: hash(content), created: true };
  }
  function diff({ path = null } = {}) {
    if (path !== null) safePath(path);
    const a = ['-C', base, 'diff', '--no-ext-diff', '--', ...(path ? [path] : [...WRITABLE])];
    const r = spawnSync('git', a, { encoding: 'utf8', timeout: 15000, maxBuffer: 256000, shell: false });
    if (r.error || r.status !== 0) throw fail('DIFF_FAILED', 'Unable to obtain workspace diff');
    return { diff: String(r.stdout).slice(0, 50000), truncated: String(r.stdout).length > 50000 };
  }
  function testHarness() {
    // No arbitrary command from a provider can reach subprocess execution.
    const r = spawnSync(process.execPath, ['--test', 'test/' + '**' + '/' + '*.test.mjs'], {
      cwd: resolve(base, 'harness'), encoding: 'utf8', timeout: 300000, maxBuffer: 1024 * 1024,
      // Minimize environment; for real deployments use an OS/container sandbox to block network and private FS.
      env: Object.fromEntries(['PATH', 'Path', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'LANG'].filter(k => process.env[k]).map(k => [k, process.env[k]])), shell: false,
    });
    return { ok: r.status === 0 && !r.error, exitCode: r.status, output: String(r.stdout || '') .slice(-11000) + '\n' + String(r.stderr || '').slice(-2000), error: r.error?.code || null };
  }
  return { list, read, search, edit, create, diff, testHarness };
}

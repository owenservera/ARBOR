// hq/lib/git.mjs — thin, deterministic git wrappers. Read-only except hooks.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function git(root, args, { input, maxBuffer = 128 * 1024 * 1024, timeout = 60000 } = {}) {
  return execFileSync('git', ['-c', 'core.quotepath=false', '--no-pager', ...args], {
    cwd: root,
    encoding: 'utf8',
    input,
    timeout,
    maxBuffer,
    stdio: ['pipe', 'pipe', 'ignore'],
    windowsHide: true,
  });
}

export function tryGit(root, args, opts) {
  try { return git(root, args, opts); } catch { return null; }
}

export function isGitRepo(root) {
  const out = tryGit(root, ['rev-parse', '--is-inside-work-tree']);
  return existsSync(join(root, '.git')) && (out || '').trim() === 'true';
}

export function gitDir(root) {
  const out = tryGit(root, ['rev-parse', '--git-dir']);
  return out ? join(root, out.trim()) : null;
}

export function head(root) {
  return (tryGit(root, ['rev-parse', 'HEAD']) || '').trim() || null;
}

export function branch(root) {
  const out = (tryGit(root, ['rev-parse', '--abbrev-ref', 'HEAD']) || '').trim();
  return out && out !== 'HEAD' ? out : null;
}

export function remote(root) {
  const out = (tryGit(root, ['config', '--get', 'remote.origin.url']) || '').trim();
  return out || null;
}

export function dirtyFiles(root) {
  const out = tryGit(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all']);
  if (!out) return [];
  const parts = out.split('\0').filter(Boolean);
  const files = [];
  for (let i = 0; i < parts.length; i++) {
    const entry = parts[i];
    const xy = entry.slice(0, 2);
    const path = entry.slice(3);
    if (xy[0] === 'R' || xy[0] === 'C') { i++; }
    files.push({ status: xy.trim() || '??', path });
  }
  return files;
}

export function isDirty(root) {
  return dirtyFiles(root).length > 0;
}

export function aheadBehind(root) {
  const out = tryGit(root, ['rev-list', '--left-right', '--count', '@{upstream}...HEAD']);
  if (!out) return null;
  const [behind, ahead] = out.trim().split(/\s+/).map(Number);
  if (!Number.isFinite(behind) || !Number.isFinite(ahead)) return null;
  return { behind, ahead };
}

export function committedSequence(root, { limit = 300 } = {}) {
  const out = tryGit(root, ['rev-list', `--max-count=${limit}`, 'HEAD']);
  return out ? out.split('\n').filter(Boolean) : [];
}

// logRecords — one subprocess for up to `limit` commits with their file statuses.
// Format uses \x1e as record separator and \x1f as field separator so subjects
// containing any printable character stay parseable.
export function logRecords(root, { limit = 300, since = null, path = null } = {}) {
  const args = [
    'log', `--max-count=${limit}`, '--no-renames', '--name-status',
    '--format=%x1e%H%x1f%P%x1f%an%x1f%aI%x1f%s',
  ];
  if (since) args.push(`--since=${since}`);
  if (path) args.push('--', path);
  const out = tryGit(root, args);
  if (!out) return [];
  const records = [];
  for (const chunk of out.split('\x1e')) {
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

export function headRecord(root) {
  const recs = logRecords(root, { limit: 1 });
  return recs[0] || null;
}

export function commitCount(root, from = null, to = 'HEAD') {
  const range = from ? `${from}..${to}` : to;
  const out = tryGit(root, ['rev-list', '--count', range]);
  return out ? Number(out.trim()) : 0;
}

export function lastCommitTouching(root, path) {
  const out = tryGit(root, ['log', '-1', '--format=%H%x1f%aI%x1f%s', '--', path]);
  if (!out) return null;
  const [sha, date, subject] = out.trim().split('\x1f');
  return sha ? { sha, date, subject } : null;
}

export function lsTracked(root) {
  const tracked = tryGit(root, ['ls-files', '-z']);
  const untracked = tryGit(root, ['ls-files', '-z', '--others', '--exclude-standard']);
  const split = (s) => (s ? s.split('\0').filter(Boolean) : []);
  return { tracked: split(tracked), untracked: split(untracked) };
}

export function showAt(root, sha, path) {
  return tryGit(root, ['show', `${sha}:${path}`]);
}

export function isAncestor(root, ancestor, descendant) {
  return tryGit(root, ['merge-base', '--is-ancestor', ancestor, descendant]) !== null;
}

export function mergeBase(root, a, b) {
  const out = tryGit(root, ['merge-base', a, b]);
  return out ? out.trim() : null;
}

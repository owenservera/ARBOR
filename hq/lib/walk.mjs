// hq/lib/walk.mjs — file discovery. Git-aware when possible, bounded everywhere.
import { readdirSync, statSync, openSync, readSync, closeSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { toPosix, matchesAny } from './util.mjs';
import { detectLang, isGeneratedPath, isTestPath } from './lang.mjs';
import { isGitRepo, lsTracked } from './git.mjs';

// 'bin' is deliberately NOT ignored: in this workspace every tracked bin/ dir
// is hand-written CLI source (repos-hq hq/bin, vivim-web-harness harness/bin
// and studio/bin). Hiding it made the index blind to the CLI surface, so
// `hq context`/`search`/`wiki` could not see the commands they document.
// Binary build output named bin is still bounded by sniffBinary,
// isGeneratedPath (dist/build/out/min/bundle/lock) and maxFileBytes.
export const DEFAULT_IGNORES = [
  '.git', 'node_modules', 'dist', 'build', 'out', '.next', '.nuxt', '.svelte-kit',
  '.turbo', '.parcel-cache', '.cache', 'coverage', '.hq', '.hq-tool', '.venv', 'venv',
  '__pycache__', 'target', 'vendor', 'third_party', 'Pods', 'DerivedData',
  '.idea', '.vscode', '.gradle', '.mvn', 'obj',
];

export const DEFAULT_MAX_FILE_BYTES = 1_500_000;

function isIgnoredName(name, ignores) {
  return matchesAny(name, ignores);
}

export function sniffBinary(absPath) {
  let fd;
  try {
    fd = openSync(absPath, 'r');
    const buf = Buffer.alloc(8192);
    const n = readSync(fd, buf, 0, buf.length, 0);
    for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
    return false;
  } catch {
    return false;
  } finally {
    if (fd !== undefined) try { closeSync(fd); } catch { /* ignore */ }
  }
}

function toEntry(root, rel, stat) {
  const abs = join(root, rel);
  const { lang, kind } = detectLang(rel);
  return {
    rel: toPosix(rel),
    abs,
    size: stat.size,
    mtimeMs: Math.floor(stat.mtimeMs),
    lang,
    kind,
    isTest: isTestPath(rel) ? 1 : 0,
    isGenerated: isGeneratedPath(rel) ? 1 : 0,
  };
}

function walkTree(root, ignores) {
  const out = [];
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (isIgnoredName(entry.name, ignores)) continue;
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) { walk(abs); continue; }
      if (!entry.isFile()) continue;
      out.push(abs);
    }
  };
  walk(root);
  return out;
}

/**
 * discoverFiles — returns bounded, classified file entries.
 * Git repos: tracked + untracked-but-not-ignored. Non-git dirs: walked tree.
 */
export function discoverFiles(root, {
  maxFileBytes = DEFAULT_MAX_FILE_BYTES,
  extraIgnores = [],
  useGit = true,
  includeGenerated = false,
} = {}) {
  if (!existsSync(root)) return [];
  const ignores = [...DEFAULT_IGNORES, ...extraIgnores];
  const useGitHere = useGit && isGitRepo(root);

  let rels;
  if (useGitHere) {
    const { tracked, untracked } = lsTracked(root);
    rels = [...new Set([...tracked, ...untracked])];
  } else {
    rels = walkTree(root, ignores).map((abs) => toPosix(relative(root, abs)));
  }

  const entries = [];
  for (const rel of rels) {
    const posix = toPosix(rel);
    if (posix.startsWith('../')) continue;
    if (!includeGenerated && isGeneratedPath(posix)) continue;
    if (posix.split('/').some((segment) => matchesAny(segment, ignores))) continue;
    let stat;
    try { stat = statSync(join(root, rel)); } catch { continue; }
    if (!stat.isFile()) continue;
    if (stat.size > maxFileBytes) continue;
    const { kind } = detectLang(posix);
    if (kind === 'binary') continue;
    if (sniffBinary(join(root, rel))) continue;
    entries.push(toEntry(root, rel, stat));
  }
  return entries;
}

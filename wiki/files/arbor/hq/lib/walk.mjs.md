# File: hq/lib/walk.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/walk.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4382 B |
| Lines | 121 |
| Hash | 863c9849bad5 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEFAULT_IGNORES | const | 14 | yes | export const DEFAULT_IGNORES = [ |
| DEFAULT_MAX_FILE_BYTES | const | 21 | yes | export const DEFAULT_MAX_FILE_BYTES = 1_500_000; |
| isIgnoredName | function | 23 | no | function isIgnoredName(name, ignores) { |
| sniffBinary | function | 27 | yes | export function sniffBinary(absPath) { |
| fd | variable | 28 | no | let fd; |
| buf | const | 31 | no | const buf = Buffer.alloc(8192); |
| n | const | 32 | no | const n = readSync(fd, buf, 0, buf.length, 0); |
| toEntry | function | 42 | no | function toEntry(root, rel, stat) { |
| abs | const | 43 | no | const abs = join(root, rel); |
| walkTree | function | 57 | no | function walkTree(root, ignores) { |
| out | const | 58 | no | const out = []; |
| walk | function | 59 | no | const walk = (dir) =&gt; { |
| entries | variable | 60 | no | let entries; |
| abs | const | 64 | no | const abs = join(dir, entry.name); |
| discoverFiles | function | 78 | yes | export function discoverFiles(root, { maxFileBytes = DEFAULT_MAX_FILE_BYTES, extraIgnores = [], useGit = true, includeGenerated = false, |
| ignores | const | 85 | no | const ignores = [...DEFAULT_IGNORES, ...extraIgnores]; |
| useGitHere | const | 86 | no | const useGitHere = useGit &amp;&amp; isGitRepo(root); |
| rels | variable | 88 | no | let rels; |
| entries | const | 96 | no | const entries = []; |
| canonicalRoot | const | 97 | no | const canonicalRoot = realpathSync(root); |
| lower | function | 98 | no | const lower = (p) =&gt; process.platform === &#39;win32&#39; ? resolve(p).toLowerCase() : resolve(p); |
| base | const | 99 | no | const base = lower(canonicalRoot); |
| posix | const | 101 | no | const posix = toPosix(rel); |
| stat | variable | 107 | no | let stat; |
| actual | const | 109 | no | const actual = lower(realpathSync(join(root, rel))); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:path | import | 3 | external |
| ./util.mjs | import | 4 | [hq/lib/util.mjs](./util.mjs.md) |
| ./lang.mjs | import | 5 | [hq/lib/lang.mjs](./lang.mjs.md) |
| ./git.mjs | import | 6 | [hq/lib/git.mjs](./git.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/wave1-lane-a.mjs](../bin/wave1-lane-a.mjs.md) | ../lib/walk.mjs |
| [hq/lib/canon.mjs](./canon.mjs.md) | ./walk.mjs |
| [hq/lib/freshness.mjs](./freshness.mjs.md) | ./walk.mjs |
| [hq/lib/indexer.mjs](./indexer.mjs.md) | ./walk.mjs |
| [hq/lib/lake.mjs](./lake.mjs.md) | ./walk.mjs |
| [hq/test/foundation.test.mjs](../test/foundation.test.mjs.md) | ../lib/walk.mjs |
| [hq/test/walk-bin-source.test.mjs](../test/walk-bin-source.test.mjs.md) | ../lib/walk.mjs |
| [hq/test/walk.test.mjs](../test/walk.test.mjs.md) | ../lib/walk.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/walk.mjs — file discovery. Git-aware when possible, bounded everywhere.
import { readdirSync, statSync, realpathSync, openSync, readSync, closeSync, existsSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
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
```

_First 80 of 122 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

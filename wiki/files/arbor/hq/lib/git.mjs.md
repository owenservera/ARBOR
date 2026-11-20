# File: hq/lib/git.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/git.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5186 B |
| Lines | 152 |
| Hash | 81049afa9bc3 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| git | function | 6 | yes | export function git(root, args, { input, maxBuffer = 128 * 1024 * 1024, timeout = 60000 } = {}) { |
| tryGit | function | 18 | yes | export function tryGit(root, args, opts) { |
| isGitRepo | function | 22 | yes | export function isGitRepo(root) { |
| out | const | 23 | no | const out = tryGit(root, [&#39;rev-parse&#39;, &#39;--is-inside-work-tree&#39;]); |
| gitDir | function | 27 | yes | export function gitDir(root) { |
| out | const | 28 | no | const out = tryGit(root, [&#39;rev-parse&#39;, &#39;--git-dir&#39;]); |
| head | function | 32 | yes | export function head(root) { |
| branch | function | 36 | yes | export function branch(root) { |
| out | const | 37 | no | const out = (tryGit(root, [&#39;rev-parse&#39;, &#39;--abbrev-ref&#39;, &#39;HEAD&#39;]) \|\| &#39;&#39;).trim(); |
| remote | function | 41 | yes | export function remote(root) { |
| out | const | 42 | no | const out = (tryGit(root, [&#39;config&#39;, &#39;--get&#39;, &#39;remote.origin.url&#39;]) \|\| &#39;&#39;).trim(); |
| dirtyFiles | function | 46 | yes | export function dirtyFiles(root) { |
| out | const | 47 | no | const out = tryGit(root, [&#39;status&#39;, &#39;--porcelain=v1&#39;, &#39;-z&#39;, &#39;--untracked-files=all&#39;]); |
| parts | const | 49 | no | const parts = out.split(&#39;\\0&#39;).filter(Boolean); |
| files | const | 50 | no | const files = []; |
| entry | const | 52 | no | const entry = parts[i]; |
| xy | const | 53 | no | const xy = entry.slice(0, 2); |
| path | const | 54 | no | const path = entry.slice(3); |
| isDirty | function | 61 | yes | export function isDirty(root) { |
| aheadBehind | function | 65 | yes | export function aheadBehind(root) { |
| out | const | 66 | no | const out = tryGit(root, [&#39;rev-list&#39;, &#39;--left-right&#39;, &#39;--count&#39;, &#39;@{upstream}...HEAD&#39;]); |
| committedSequence | function | 73 | yes | export function committedSequence(root, { limit = 300 } = {}) { |
| out | const | 74 | no | const out = tryGit(root, [&#39;rev-list&#39;, `--max-count=${limit}`, &#39;HEAD&#39;]); |
| logRecords | function | 81 | yes | export function logRecords(root, { limit = 300, since = null, path = null } = {}) { |
| args | const | 82 | no | const args = [ |
| out | const | 88 | no | const out = tryGit(root, args); |
| records | const | 90 | no | const records = []; |
| text | const | 92 | no | const text = chunk.replace(/^\\r?\\n/, &#39;&#39;); |
| lines | const | 94 | no | const lines = text.split(/\\r?\\n/); |
| files | const | 97 | no | const files = []; |
| tab | const | 100 | no | const tab = line.indexOf(&#39;\\t&#39;); |
| headRecord | function | 116 | yes | export function headRecord(root) { |
| recs | const | 117 | no | const recs = logRecords(root, { limit: 1 }); |
| commitCount | function | 121 | yes | export function commitCount(root, from = null, to = &#39;HEAD&#39;) { |
| out | const | 123 | no | const out = tryGit(root, [&#39;rev-list&#39;, &#39;--count&#39;, range]); |
| lastCommitTouching | function | 127 | yes | export function lastCommitTouching(root, path) { |
| out | const | 128 | no | const out = tryGit(root, [&#39;log&#39;, &#39;-1&#39;, &#39;--format=%H%x1f%aI%x1f%s&#39;, &#39;--&#39;, path]); |
| lsTracked | function | 134 | yes | export function lsTracked(root) { |
| tracked | const | 135 | no | const tracked = tryGit(root, [&#39;ls-files&#39;, &#39;-z&#39;]); |
| untracked | const | 136 | no | const untracked = tryGit(root, [&#39;ls-files&#39;, &#39;-z&#39;, &#39;--others&#39;, &#39;--exclude-standard&#39;]); |
| split | function | 137 | no | const split = (s) =&gt; (s ? s.split(&#39;\\0&#39;).filter(Boolean) : []); |
| showAt | function | 141 | yes | export function showAt(root, sha, path) { |
| isAncestor | function | 145 | yes | export function isAncestor(root, ancestor, descendant) { |
| mergeBase | function | 149 | yes | export function mergeBase(root, a, b) { |
| out | const | 150 | no | const out = tryGit(root, [&#39;merge-base&#39;, a, b]); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 2 | external |
| node:fs | import | 3 | external |
| node:path | import | 4 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-059-changes-between-versions.mjs](../aii/fixtures/HQ-059-changes-between-versions.mjs.md) | ../../lib/git.mjs |
| [hq/aii/fixtures/HQ-088-release-blocking-integrations.mjs](../aii/fixtures/HQ-088-release-blocking-integrations.mjs.md) | ../../lib/git.mjs |
| [hq/aii/fixtures/HQ-097-materially-changed.mjs](../aii/fixtures/HQ-097-materially-changed.mjs.md) | ../../lib/git.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/git.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/git.mjs |
| [hq/lib/arbor-service.mjs](./arbor-service.mjs.md) | ./git.mjs |
| [hq/lib/indexer.mjs](./indexer.mjs.md) | ./git.mjs |
| [hq/lib/lake.mjs](./lake.mjs.md) | ./git.mjs |
| [hq/lib/walk.mjs](./walk.mjs.md) | ./git.mjs |
| [hq/test/git.test.mjs](../test/git.test.mjs.md) | ../lib/git.mjs |
| [hq/test/walk-bin-source.test.mjs](../test/walk-bin-source.test.mjs.md) | ../lib/git.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 153 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

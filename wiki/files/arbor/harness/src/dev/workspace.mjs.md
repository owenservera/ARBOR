# File: harness/src/dev/workspace.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/dev/workspace.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11258 B |
| Lines | 155 |
| Hash | b22781ad5376 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| VISIBLE | const | 8 | no | const VISIBLE = [&#39;harness/src/&#39;, &#39;harness/test/&#39;, &#39;harness/docs/&#39;, &#39;studio/src/&#39;, &#39;studio/test/&#39;, &#39;apps/mobile-relay/&#39;, &#39;docs/&#39;]; |
| WRITABLE | const | 9 | no | const WRITABLE = [&#39;harness/src/&#39;, &#39;harness/test/&#39;, &#39;studio/src/&#39;, &#39;studio/test/&#39;, &#39;apps/mobile-relay/&#39;]; |
| IGNORED | const | 17 | no | const IGNORED = new Set([&#39;.git&#39;, &#39;.env&#39;, &#39;node_modules&#39;, &#39;runtime&#39;, &#39;sources&#39;, &#39;dist&#39;, &#39;build&#39;, &#39;coverage&#39;, &#39;.next&#39;, &#39;.vercel&#39;, &#39;secrets&#39;, &#39;credentials&#39;]); |
| EXT | const | 18 | no | const EXT = /\\.(?:mjs\|js\|cjs\|json\|md\|html\|css\|ts\|tsx\|jsx)$/i; |
| hash | function | 19 | no | const hash = text =&gt; createHash(&#39;sha256&#39;).update(text).digest(&#39;hex&#39;); |
| fail | function | 20 | no | const fail = (code, message) =&gt; Object.assign(new Error(message), { code }); |
| workspacePolicy | const | 21 | yes | export const workspacePolicy = Object.freeze({ visible: VISIBLE, writable: WRITABLE, protected: [...PROTECTED] }); |
| safePath | function | 23 | yes | export function safePath(path, { write = false } = {}) { |
| parts | const | 25 | no | const parts = path.split(&#39;/&#39;); |
| allowed | const | 27 | no | const allowed = write ? WRITABLE : VISIBLE; |
| createWorkspace | function | 33 | yes | export function createWorkspace({ root, maxFileBytes = 120000 } = {}) { |
| base | const | 35 | no | const base = resolve(root); |
| pathname | function | 36 | no | async function pathname(path, write = false) { |
| abs | const | 38 | no | const abs = resolve(base, ...path.split(&#39;/&#39;)); |
| cur | variable | 41 | no | let cur = base; |
| baseStat | const | 42 | no | const baseStat = await lstat(base); |
| parts | const | 44 | no | const parts = path.split(&#39;/&#39;); |
| st | variable | 47 | no | let st; |
| read | function | 54 | no | async function read(path, { startLine = 1, maxLines = 180 } = {}) { |
| full | const | 55 | no | const full = await pathname(path); |
| st | const | 56 | no | const st = await lstat(full); |
| content | const | 59 | no | const content = await readFile(full, &#39;utf8&#39;); |
| lines | const | 60 | no | const lines = content.split(&#39;\\n&#39;); |
| list | function | 63 | no | async function list({ path = &#39;&#39;, limit = 150 } = {}) { |
| prefix | const | 67 | no | const prefix = path.endsWith(&#39;/&#39;) ? path.slice(0, -1) : path; |
| parts | const | 69 | no | const parts = prefix.split(&#39;/&#39;); |
| abs | const | 71 | no | const abs = resolve(base, ...parts); |
| cur | variable | 73 | no | let cur = base; |
| entries | const | 75 | no | const entries = []; |
| child | const | 78 | no | const child = prefix + &#39;/&#39; + d.name; |
| search | function | 85 | no | async function search({ query, path = &#39;harness/src/&#39;, maxMatches = 25, maxFiles = 200 } = {}) { |
| rootDir | const | 87 | no | const rootDir = path.replace(/\\/$/, &#39;&#39;); |
| stack | const | 92 | no | const stack = [rootDir]; const matches = []; let scanned = 0; |
| dir | const | 94 | no | const dir = stack.pop(); |
| entries | variable | 95 | no | let entries; |
| r | variable | 101 | no | let r; |
| needle | const | 103 | no | const needle = query.toLowerCase(); |
| edit | function | 114 | no | async function edit({ path, expectedSha256, find, replace: replacement }) { |
| full | const | 115 | no | const full = await pathname(path, true); |
| before | const | 118 | no | const before = await readFile(full, &#39;utf8&#39;); |
| after | const | 121 | no | const after = before.replace(find, replacement); |
| temp | const | 123 | no | const temp = full + &#39;.&#39; + randomUUID() + &#39;.tmp&#39;; |
| create | function | 131 | no | async function create({ path, content }) { |
| full | const | 132 | no | const full = await pathname(path, true); |
| diff | function | 138 | no | function diff({ path = null } = {}) { |
| a | const | 140 | no | const a = [&#39;-C&#39;, base, &#39;diff&#39;, &#39;--no-ext-diff&#39;, &#39;--&#39;, ...(path ? [path] : [...WRITABLE])]; |
| r | const | 141 | no | const r = spawnSync(&#39;git&#39;, a, { encoding: &#39;utf8&#39;, timeout: 15000, maxBuffer: 256000, shell: false }); |
| testHarness | function | 145 | no | function testHarness() { |
| r | const | 147 | no | const r = spawnSync(process.execPath, [&#39;--test&#39;, &#39;test/&#39; + &#39;**&#39; + &#39;/&#39; + &#39;*.test.mjs&#39;], { cwd: resolve(base, &#39;harness&#39;), encoding: &#39;utf8&#39;, timeout: 300000, maxBuffer: 1024 * 1024, // Minimize environm… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs/promises | import | 3 | external |
| node:crypto | import | 4 | external |
| node:path | import | 5 | external |
| node:child_process | import | 6 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/src/dev/cli.mjs](./cli.mjs.md) | ./workspace.mjs |
| [harness/test/dev/workspace.test.mjs](../../test/dev/workspace.test.mjs.md) | ../../src/dev/workspace.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 156 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

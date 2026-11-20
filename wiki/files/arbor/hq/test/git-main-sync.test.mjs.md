# File: hq/test/git-main-sync.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/git-main-sync.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6904 B |
| Lines | 142 |
| Hash | 4381f1cec18e |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SYNC | const | 18 | no | const SYNC = resolve(dirname(fileURLToPath(import.meta.url)), &#39;../../scripts/git-main-sync.mjs&#39;); |
| SYNC_PRESENT | const | 19 | no | const SYNC_PRESENT = existsSync(SYNC); |
| SYNC_SKIP | const | 20 | no | const SYNC_SKIP = SYNC_PRESENT ? false : &#39;orphaned suite: scripts/git-main-sync.mjs is absent from this checkout&#39;; |
| git | function | 23 | no | const git = (cwd, ...args) =&gt; { |
| r | const | 24 | no | const r = spawnSync(&#39;git&#39;, [&#39;-C&#39;, cwd, ...args], { encoding: &#39;utf8&#39;, timeout: 30000, windowsHide: true, env: { ...process.env, GIT_TERMINAL_PROMPT: &#39;0&#39;, GIT_AUTOSYNC_SKIP: &#39;1&#39; } }); |
| put | function | 30 | no | const put = (dir, path, value) =&gt; writeFileSync(join(dir, path), value, &#39;utf8&#39;); |
| fixture | function | 31 | no | function fixture() { |
| root | const | 32 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq-main-sync-test-&#39;)); |
| origin | const | 33 | no | const origin = join(root, &#39;origin.git&#39;); |
| local | const | 34 | no | const local = join(root, &#39;local&#39;); |
| other | const | 35 | no | const other = join(root, &#39;other&#39;); |
| run | function | 54 | no | function run(repo, ...args) { |
| res | const | 55 | no | const res = spawnSync(process.execPath, [SYNC, &#39;--repo&#39;, repo, &#39;--min-age&#39;, &#39;0&#39;, ...args], { cwd: repo, encoding: &#39;utf8&#39;, timeout: 90000, windowsHide: true }); |
| box | const | 72 | no | const box = fixture(); |
| synced | const | 79 | no | const synced = run(box.local); |
| box | const | 91 | no | const box = fixture(); |
| r | const | 97 | no | const r = run(box.local); |
| box | const | 104 | no | const box = fixture(); |
| result | const | 110 | no | const result = run(box.local); |
| box | const | 120 | no | const box = fixture(); |
| first | const | 123 | no | const first = run(box.local); |
| box | const | 132 | no | const box = fixture(); |
| result | const | 135 | no | const result = run(box.local); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 7 | external |
| node:assert/strict | import | 8 | external |
| node:fs | import | 9 | external |
| node:os | import | 10 | external |
| node:path | import | 11 | external |
| node:url | import | 12 | external |
| node:child_process | import | 13 | external |
| ../../scripts/git-main-sync.mjs | dynamic | 21 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | End-to-end HQ main-only session sync tests using disposable Git remotes. |
| 3 | owner | hq | — | hq |
| 4 | task | — | — | main-only-five-minute-opencode-sync |
| 5 | invariant | — | — | No production repositories or remote services are accessed. |

## Excerpt

```javascript
/**
 * @hq:context End-to-end HQ main-only session sync tests using disposable Git remotes.
 * @hq:owner hq
 * @hq:task main-only-five-minute-opencode-sync
 * @hq:invariant No production repositories or remote services are accessed.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// scripts/git-main-sync.mjs is not present in this checkout (no commit in any
// branch ever added it). The suite is skipped loudly rather than failing the gate
// on an absent artifact, and stays here for the day the module lands.
const SYNC = resolve(dirname(fileURLToPath(import.meta.url)), '../../scripts/git-main-sync.mjs');
const SYNC_PRESENT = existsSync(SYNC);
const SYNC_SKIP = SYNC_PRESENT ? false : 'orphaned suite: scripts/git-main-sync.mjs is absent from this checkout';
const { chooseMainSync } = SYNC_PRESENT ? await import('../../scripts/git-main-sync.mjs') : {};

const git = (cwd, ...args) => {
  const r = spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8',
    timeout: 30000, windowsHide: true,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_AUTOSYNC_SKIP: '1' } });
  assert.equal(r.status, 0, ['git', ...args, r.stderr].join(' '));
  return r.stdout.trim();
};
const put = (dir, path, value) => writeFileSync(join(dir, path), value, 'utf8');
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'hq-main-sync-test-'));
  const origin = join(root, 'origin.git');
  const local = join(root, 'local');
  const other = join(root, 'other');
  mkdirSync(local);
  git(root, 'init', '--bare', '-q', '-b', 'main', origin);
  git(local, 'init', '-q', '-b', 'main');
  git(local, 'config', 'user.name', 'Test Agent');
  git(local, 'config', 'user.email', 'test@example.invalid');
  git(local, 'config', 'commit.gpgsign', 'false');
  put(local, '.gitignore', '.hq/\n');
  put(local, 'one.txt', 'hello\n');
  git(local, 'add', '-A');
  git(local, 'commit', '-qm', 'baseline');
  git(local, 'remote', 'add', 'origin', origin);
  git(local, 'push', '-q', '-u', 'origin', 'main');
  git(root, 'clone', '-q', origin, other);
  git(other, 'config', 'user.name', 'Remote Agent');
  git(other, 'config', 'user.email', 'remote@example.invalid');
  git(other, 'config', 'commit.gpgsign', 'false');
  return { root, local, origin, other, clean: () => rmSync(root, { recursive: true, force: true }) };
}
function run(repo, ...args) {
  const res = spawnSync(process.execPath, [SYNC, '--repo', repo, '--min-age', '0', ...args],
    { cwd: repo, encoding: 'utf8', timeout: 90000, windowsHide: true });
  assert.ok(res.stdout, 'engine emits machine-readable status');
  return { code: res.status, ...JSON.parse(res.stdout.trim()) };
}

describe('HQ main-only session sync (scripts/git-main-sync.mjs)', { skip: SYNC_SKIP }, () => {

test('pure decision matrix never invents a force push', () => {
  assert.equal(chooseMainSync({ branch: 'dev' }).action, 'escalate');
  assert.equal(chooseMainSync({ behind: 1, ahead: 1 }).action, 'rebase');
  assert.equal(chooseMainSync({ dirty: 1, behind: 1 }).action, 'commit');
  assert.equal(chooseMainSync({ unsafe: 1 }).action, 'defer');
  assert.equal(chooseMainSync({ busy: true }).action, 'defer');
  assert.equal(chooseMainSync().action, 'in_sync');
});
test('full sync auto-commits stable local modifications, integrates remote and pushes main', () => {
  const box = fixture();
  try {
    put(box.other, 'remote.txt', 'remote work\n');
    git(box.other, 'add', '-A');
    git(box.other, 'commit', '-qm', 'remote work');
    git(box.other, 'push', '-q', 'origin', 'main');
    put(box.local, 'one.txt', 'local edit\n');
    const synced = run(box.local);
    assert.equal(synced.code, 0, JSON.stringify(synced));
```

_First 80 of 143 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)

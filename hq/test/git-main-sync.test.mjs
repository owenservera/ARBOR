/**
 * @hq:context End-to-end HQ main-only session sync tests using disposable Git remotes.
 * @hq:owner hq
 * @hq:task main-only-five-minute-opencode-sync
 * @hq:invariant No production repositories or remote services are accessed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { chooseMainSync } from '../../scripts/git-main-sync.mjs';

const SYNC = resolve(import.meta.dir, '../../scripts/git-main-sync.mjs');
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
    assert.equal(synced.status, 'synced');
    assert.ok(synced.actions.includes('commit'), JSON.stringify(synced.actions));
    assert.ok(synced.actions.includes('rebase'), JSON.stringify(synced.actions));
    assert.ok(synced.actions.includes('push'), JSON.stringify(synced.actions));
    assert.equal(git(box.local, 'rev-parse', 'HEAD'), git(box.local, 'rev-parse', 'origin/main'));
    assert.equal(git(box.local, 'status', '--porcelain'), '');
    assert.equal(run(box.local).status, 'synced', 'idempotent subsequent cycle');
  } finally { box.clean(); }
});
test('remote-only changes fast-forward without an extra local commit', () => {
  const box = fixture();
  try {
    put(box.other, 'remote.txt', 'new\n');
    git(box.other, 'add', '-A');
    git(box.other, 'commit', '-qm', 'remote only');
    git(box.other, 'push', '-q', 'origin', 'main');
    const r = run(box.local);
    assert.equal(r.status, 'synced', JSON.stringify(r));
    assert.ok(r.actions.includes('fast_forward'));
    assert.ok(!r.actions.includes('commit'));
  } finally { box.clean(); }
});
test('conflicting local and remote changes safely abort rebase and preserve commits', () => {
  const box = fixture();
  try {
    put(box.other, 'one.txt', 'remote content\n');
    git(box.other, 'add', '-A'); git(box.other, 'commit', '-qm', 'remote collision');
    git(box.other, 'push', '-q', 'origin', 'main');
    put(box.local, 'one.txt', 'local content\n');
    const result = run(box.local);
    assert.equal(result.code, 1, JSON.stringify(result));
    assert.equal(result.reason, 'rebase_conflict_or_failure');
    assert.equal(git(box.local, 'show', 'HEAD:one.txt'), 'local content');
    assert.equal(git(box.local, 'status', '--porcelain'), '');
    assert.ok(!existsSync(join(box.local, '.git', 'rebase-merge')));
    assert.equal(git(box.local, 'rev-list', '--count', 'origin/main..HEAD'), '1');
  } finally { box.clean(); }
});
test('sensitive untracked files are never staged or pushed', () => {
  const box = fixture();
  try {
    put(box.local, '.env', 'PASSWORD=private-value\n');
    const first = run(box.local);
    assert.equal(first.code, 2);
    assert.equal(first.status, 'deferred');
    assert.equal(first.reason, 'unsafe_or_active_edits');
    assert.ok(existsSync(join(box.local, '.env')));
    assert.equal(git(box.local, 'ls-files', '.env'), '');
  } finally { box.clean(); }
});
test('existing lock prevents concurrent sync and remains untouched', () => {
  const box = fixture();
  try {
    put(box.local, '.git/autosync.lock', 'external scheduled sync');
    const result = run(box.local);
    assert.equal(result.code, 2);
    assert.equal(result.reason, 'sync_lock_busy');
    assert.ok(existsSync(join(box.local, '.git', 'autosync.lock')));
  } finally { box.clean(); }
});

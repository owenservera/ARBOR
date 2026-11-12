// hq/test/git.test.mjs — isGitRepo recognises real git workspaces.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isGitRepo } from '../lib/git.mjs';
import { join } from 'node:path';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

test('isGitRepo returns true in a real git workspace', () => {
  assert.equal(isGitRepo(process.cwd()), true);
});

test('isGitRepo returns false for a plain directory without .git', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hq-git-test-'));
  try {
    assert.equal(isGitRepo(dir), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('isGitRepo returns false for a directory with .git but not a git repo', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hq-git-test-'));
  try {
    writeFileSync(join(dir, '.git'), 'not a git dir');
    assert.equal(isGitRepo(dir), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

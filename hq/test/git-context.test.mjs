// hq/test/git-context.test.mjs — resolveGitConfig merges layers key by key.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveGitConfig, DEFAULT_GIT_CONFIG } from '../lib/git-context.mjs';

test('a later layer merges into a nested object instead of replacing it', () => {
  const merged = resolveGitConfig(
    { context: { commits: 5, dirty: true } },
    { context: { commits: 9 } },
  );
  assert.equal(merged.context.commits, 9);
  assert.equal(merged.context.dirty, true);
});

test('top-level scalar keys are still replaced by later layers', () => {
  const merged = resolveGitConfig({ includeCommits: 5 }, { includeCommits: 2 });
  assert.equal(merged.includeCommits, 2);
});

test('the github block merges key by key and keeps defaults for unset keys', () => {
  const merged = resolveGitConfig({ github: { repo: 'owner/name' } });
  assert.equal(merged.github.repo, 'owner/name');
  assert.equal(merged.github.cli, DEFAULT_GIT_CONFIG.github.cli);
});

test('undefined values in a layer do not clobber the merged value', () => {
  const merged = resolveGitConfig({ includeDirty: undefined });
  assert.equal(merged.includeDirty, DEFAULT_GIT_CONFIG.includeDirty);
});

test('an unknown protocol still throws', () => {
  assert.throws(() => resolveGitConfig({ protocol: 'nope' }), /unknown git protocol/);
});

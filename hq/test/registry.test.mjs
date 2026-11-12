// hq/test/registry.test.mjs — loadConfig deep merge and storedPath.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, defaultConfig, storedPath, resolveProjectPath } from '../lib/registry.mjs';
import { join, resolve } from 'node:path';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

test('loadConfig deep-merges nested defaults', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hq-registry-test-'));
  try {
    mkdirSync(join(dir, '.hq'), { recursive: true });
    writeFileSync(join(dir, '.hq', 'config.json'), JSON.stringify({ performance: { profile: 'x' } }), 'utf8');
    const cfg = loadConfig(dir);
    assert.equal(cfg.performance.profile, 'x');
    assert.ok(cfg.performance.limits);
    assert.equal(cfg.performance.limits.search, 20);
    assert.ok(cfg.performance.weights);
    assert.equal(cfg.performance.weights.speed, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('loadConfig returns defaults when no config file exists', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hq-registry-test-'));
  try {
    const cfg = loadConfig(dir);
    assert.deepEqual(cfg, defaultConfig());
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('storedPath returns "." for the workspace root itself', () => {
  const root = process.cwd();
  assert.equal(storedPath(root, root), '.');
});

test('storedPath returns a relative path for a child of the workspace', () => {
  const root = process.cwd();
  const child = join(root, 'hq', 'lib', 'registry.mjs');
  assert.equal(storedPath(root, child), 'hq/lib/registry.mjs');
});

test('storedPath returns an absolute path for an external path', () => {
  const root = process.cwd();
  const external = resolve('/', 'tmp', 'external');
  assert.equal(storedPath(root, external), external);
});

test('resolveProjectPath resolves a relative stored path', () => {
  const root = process.cwd();
  const abs = resolveProjectPath(root, 'hq/lib/registry.mjs');
  assert.equal(abs, resolve(root, 'hq/lib/registry.mjs'));
});

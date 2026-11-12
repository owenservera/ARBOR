// hq/test/walk.test.mjs — extraIgnores honours glob patterns.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { discoverFiles } from '../lib/walk.mjs';

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'hq-walk-test-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(join(dir, rel.split('/').slice(0, -1).join('/')), { recursive: true });
    writeFileSync(full, content ?? 'x', 'utf8');
  }
  return dir;
}

function rels(dir, opts) {
  return discoverFiles(dir, { useGit: false, ...opts }).map((e) => e.rel).sort();
}

test('extraIgnores glob excludes matching files anywhere in the tree', () => {
  const dir = fixture({ 'a.log': 'x', 'b.txt': 'y', 'sub/c.log': 'z' });
  try {
    const got = rels(dir, { extraIgnores: ['*.log'] });
    assert.equal(got.includes('a.log'), false);
    assert.equal(got.includes('sub/c.log'), false);
    assert.equal(got.includes('b.txt'), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('extraIgnores exact name still works', () => {
  const dir = fixture({ 'a.log': 'x', 'b.txt': 'y' });
  try {
    const got = rels(dir, { extraIgnores: ['b.txt'] });
    assert.equal(got.includes('b.txt'), false);
    assert.equal(got.includes('a.log'), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('extraIgnores directory name prunes the whole tree', () => {
  const dir = fixture({ 'logs/server.log': 'x', 'keep.txt': 'y' });
  try {
    const got = rels(dir, { extraIgnores: ['logs'] });
    assert.equal(got.includes('logs/server.log'), false);
    assert.equal(got.includes('keep.txt'), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// hq/test/walk-bin-source.test.mjs — bin/ directories are source, not build output.
//
// Regression fixture (Z.ai R1): DEFAULT_IGNORES used to contain the bare name
// 'bin', which made discoverFiles skip every bin/ directory. In this workspace
// those directories are hand-written CLI source (repos-hq hq/bin, vivim-web-harness
// harness/bin and studio/bin), so the index, context, search and wiki were blind
// to the CLI surface — `hq context` could not even find cmdCheck inside
// hq/bin/hq.mjs. This test pins the repaired behavior so it cannot silently
// regress, and pins the protections that still hold for real build output.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { git, isGitRepo, lsTracked } from '../lib/git.mjs';
import { discoverFiles, DEFAULT_IGNORES } from '../lib/walk.mjs';

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'hq-walk-bin-'));
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

test('DEFAULT_IGNORES no longer contains the bare name bin', () => {
  assert.equal(DEFAULT_IGNORES.includes('bin'), false);
  assert.equal(DEFAULT_IGNORES.includes('dist'), true);
});

test('a tracked-style bin/ directory with text CLI source is discovered', () => {
  const dir = fixture({
    'bin/cli.mjs': 'export function main() { return 1; }\n',
    'tools/bin/second.mjs': 'export const two = 2;\n',
    'plain.txt': 'y',
  });
  try {
    const got = rels(dir);
    assert.equal(got.includes('bin/cli.mjs'), true, 'nested bin/ source must be visible');
    assert.equal(got.includes('tools/bin/second.mjs'), true);
    assert.equal(got.includes('plain.txt'), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('default Git-backed discovery includes tracked bin source but excludes binary and generated output', (t) => {
  try {
    execFileSync('git', ['--version'], { stdio: 'pipe', windowsHide: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    t.skip('Git executable unavailable; Git-backed discovery gate not run');
    return;
  }

  const files = {
    '.gitignore': 'bin/ignored-untracked.mjs\n',
    'bin/cli.mjs': 'export function main() { return 1; }\n',
    'bin/compiled.bin.mjs': Buffer.from([0x00, 0x01, 0x02, 0x03]),
    'bin/cli.bundle.mjs': 'export const bundled = true;\n',
    'generated/derived.mjs': 'export const generated = true;\n',
    'dist/derived.mjs': 'export const dist = true;\n',
    'build/derived.mjs': 'export const build = true;\n',
    'out/derived.mjs': 'export const out = true;\n',
  };
  const dir = fixture(files);
  try {
    // Only this disposable repository's index is written; no commit/config is needed.
    git(dir, ['init']);
    git(dir, ['add', '-f', '--', ...Object.keys(files)]);
    assert.equal(isGitRepo(dir), true, 'fixture must select the actual Git-backed path');
    assert.deepEqual(lsTracked(dir).tracked.sort(), Object.keys(files).sort());

    writeFileSync(join(dir, 'bin/ignored-untracked.mjs'), 'export const ignored = true;\n');
    writeFileSync(join(dir, 'bin/untracked.mjs'), 'export const untracked = true;\n');
    // Do not use rels(): it deliberately forces the filesystem fallback.
    const got = discoverFiles(dir).map((entry) => entry.rel).sort();
    assert.deepEqual(got, ['.gitignore', 'bin/cli.mjs', 'bin/untracked.mjs']);
    assert.equal(got.includes('bin/ignored-untracked.mjs'), false,
      'Git-ignored sentinel must stay absent, proving discovery did not fall back to walking');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('binary output inside bin/ is still skipped by sniffBinary', () => {
  const dir = fixture({
    'bin/compiled.bin.mjs': Buffer.from([0x00, 0x01, 0x02, 0x03]),
    'bin/cli.mjs': 'export const one = 1;\n',
  });
  try {
    const got = rels(dir);
    assert.equal(got.includes('bin/compiled.bin.mjs'), false, 'null-byte build output must stay hidden');
    assert.equal(got.includes('bin/cli.mjs'), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('dist/, build/ and out/ directories remain ignored', () => {
  const dir = fixture({
    'dist/hq-single/package.json': '{}',
    'build/derived.js': 'y',
    'out/artifact.txt': 'z',
    'src/real.mjs': 'export const real = true;\n',
  });
  try {
    const got = rels(dir);
    assert.equal(got.includes('dist/hq-single/package.json'), false);
    assert.equal(got.includes('build/derived.js'), false);
    assert.equal(got.includes('out/artifact.txt'), false);
    assert.equal(got.includes('src/real.mjs'), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const SMOKE_SCRIPTS = [
  'harness/scripts/discover.mjs',
  'harness/scripts/live-smoke.mjs',
  'harness/scripts/signin-check.mjs',
  'harness/scripts/lab-up-linux.sh',
];
const SMOKE_NAMES = ['discover', 'live-smoke', 'signin-check', 'lab-up'];
// Production source trees: anything that ships behavior (not the scripts themselves, not tests).
const PROD_DIRS = [
  join(repoRoot, 'harness/src'),
  join(repoRoot, 'apps/vivim-host'),
  join(repoRoot, 'studio/src'),
];

function prodFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { recursive: true })) {
    if (entry.endsWith('.mjs') || entry.endsWith('.js') || entry.endsWith('.ts')) {
      out.push(join(dir, entry));
    }
  }
  return out;
}

const SMOKE_IMPORT_RE = /(?:from|require)\s*\(['"][.'"]*scripts\/(?:discover|live-smoke|signin-check|lab-up)\b/;

test('no production source depends on the coordination/smoke scripts', async () => {
  let hits = 0;
  for (const dir of PROD_DIRS) {
    for (const file of prodFiles(dir)) {
      const src = await readFile(file, 'utf8');
      if (SMOKE_IMPORT_RE.test(src)) {
        hits += 1;
        // eslint-disable-next-line no-console
        console.error(`production dependency on smoke script: ${file}`);
      }
    }
  }
  assert.equal(hits, 0, 'production code must not import coordination/smoke scripts');
});

test('discover and signin-check are read-only diagnostics with no send path', async () => {
  const discover = await readFile(join(repoRoot, 'harness/scripts/discover.mjs'), 'utf8');
  const signin = await readFile(join(repoRoot, 'harness/scripts/signin-check.mjs'), 'utf8');
  for (const [name, src] of [['discover', discover], ['signin-check', signin]]) {
    assert.ok(!src.includes('sendOnce'), `${name} must not import sendOnce`);
    assert.ok(!/from ['"].*router['"]/.test(src), `${name} must not import the router`);
    assert.ok(!src.includes('createRouter'), `${name} must not import createRouter`);
  }
});

test('live-smoke shares a single approvals instance with the router (no alternate approval path)', async () => {
  const src = await readFile(join(repoRoot, 'harness/scripts/live-smoke.mjs'), 'utf8');
  assert.ok(/createRouter\s*\(\s*\{\s*approvals\s*\}\)/.test(src), 'live-smoke must pass approvals into createRouter');
});

test('each owned script path exists', () => {
  for (const rel of SMOKE_SCRIPTS) {
    assert.ok(existsSync(join(repoRoot, rel)), `owned script missing: ${rel}`);
  }
});

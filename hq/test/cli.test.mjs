// hq/test/cli.test.mjs — the command surface reports the manifest it ships with.
//
// The runtime used to print a hardcoded "hq 1.0.0" regardless of the bundle it
// was installed from, so an installed consumer could not tell which version it
// was running.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLI = join(ROOT, 'hq', 'bin', 'hq.mjs');

test('hq --version reports the manifest version, not a literal', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const out = execFileSync(process.execPath, [CLI, '--version'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
  assert.equal(out, `hq ${pkg.version}`);
});

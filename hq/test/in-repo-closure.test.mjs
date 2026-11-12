// Mechanical contract for the ARBOR-specific HQ bridge. No donor checkout or
// external HQ process is permitted; selected local code projects are data sources.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
test('ARBOR package entrypoints contain no donor-process or checkout import', () => {
  for (const path of ['lib/arbor-service.mjs', 'bin/arbor-hq.mjs', 'package.json']) {
    const text = readFileSync(join(root, path), 'utf8');
    assert.doesNotMatch(text, /(?:\.\.[\\\/])+(?:repos-hq|tierflow|vivim-web-harness|vivim-labs)/i);
    assert.doesNotMatch(text, /(?:spawn|exec)\s*\([\s\S]{0,100}repos-hq/i);
    assert.doesNotMatch(text, /https?:\/\/(?:localhost|127\.0\.0\.1)[^\s]*\/hq\b/i);
  }
});

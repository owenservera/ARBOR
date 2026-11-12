import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('send results surface the journal reason (router needs TYPING_MISMATCH to note harness drafts)', async () => {
  const src = await readFile(new URL('../../src/core/send.mjs', import.meta.url), 'utf8');
  assert.match(src, /reason:rec\.reason/);
});

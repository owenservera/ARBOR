import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// This check becomes mandatory as soon as Host lane B is combined by G.
// On the isolated lane E branch Host intentionally does not exist yet.
const hostFile = new URL('../../vivim-host/direct-phone.mjs', import.meta.url);
const hostLanded = existsSync(fileURLToPath(hostFile));

test('in-repo Host Direct static whitelist serves the browser signer as a shell script', {
  skip: hostLanded ? false : 'Host B not yet incorporated into this isolated branch'
}, () => {
  const source = readFileSync(hostFile, 'utf8');
  assert.match(source,
    /'browser-device-key\.mjs'\s*:\s*\['browser-device-key\.mjs',\s*'text\/javascript; charset=utf-8'\]/);
  assert.match(source, /'connection\.json'/);
  assert.match(source, /directOnly:\s*true/);
  assert.match(source, /cloudEnabled:\s*false/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const MODULES = [
  'approval.mjs',
  'intelligent-model-router.mjs',
  'deps.mjs',
  'intent.mjs',
  'launch.mjs',
  'prefs.mjs',
  'standing.mjs',
  'target.mjs',
].map((name) => join(here, '..', '..', 'src', 'interface', name));

// Acceptance: "No production dependency on coordination/smoke tool; any real use through existing Host."
// None of the owned interface modules may import coordination/smoke tooling (scripts/live-smoke,
// scripts/discover, scripts/signin-check, scripts/lab-up, or .coordination/* tools). Their imports are
// limited to Node builtins, ../core, ../providers, ./interface siblings, and the internal env-gated
// ./dev-auto-approve (standing only).
const SMOKE = /(from\s+['"]\.\.\/scripts\/|from\s+['"]\.\.\/\.\.\/scripts\/|from\s+['"]\.\.\/\.\.coordination\/|from\s+['"]\.\.coordination\/|scripts\/(live-smoke|discover|signin-check|lab-up)|\.coordination\/(tools|workflows))/;

test('owned interface modules have no production dependency on coordination/smoke tooling', async () => {
  for (const module of MODULES) {
    const src = await readFile(module, 'utf8');
    assert.ok(!SMOKE.test(src), `${module} must not import coordination/smoke tooling`);
  }
});

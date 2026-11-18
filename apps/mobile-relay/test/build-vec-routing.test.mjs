import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSurface } from '../generative-ui/catalog.mjs';
import { resolveBuildRequest, buildDesignPrompt } from '../build-composer.mjs';

test('Build selects the installed VEC UI grammar before any AI design route', () => {
  const surface = createSurface();
  const out = resolveBuildRequest({ request: 'Add a card called Research', surface });
  assert.equal(out.outcome, 'candidate');
  assert.equal(out.domain, 'ui');
  assert.equal(out.authorization, 'none');
  assert.equal(out.preview.persisted, false);
  assert.equal(out.preview.surface.tree.children[0].props.title, 'Research');
});
test('unsupported Build still prepares a separate strictly bounded AI design prompt', () => {
  const surface = createSurface();
  const unsupported = resolveBuildRequest({ request: 'Create a complete research app', surface });
  assert.equal(unsupported.outcome, 'unsupported');
  const prompt = buildDesignPrompt({ request: 'Create a complete research app', surface, taskId: 'local' });
  assert.match(prompt, /Presentation only/);
  assert.match(prompt, /vivim\.ui-proposal\/1/);
});
test('Build source does not allow a deterministic candidate to enter provider send path', () => {
  const source = readFileSync(new URL('../build-canvas.mjs', import.meta.url), 'utf8');
  const local = source.indexOf("if (local.outcome === 'candidate')");
  const send = source.indexOf('const id = await send(prompt, provider)', local);
  assert.ok(local > 0 && send > local);
  const localBranch = source.slice(local, send);
  assert.match(localBranch, /return set\(\{ name: 'ready', \.\.\.local/);
  assert.match(source, /origin === 'vec' \? 'COMPILED LOCALLY/);
});
test('paired Direct exposes only reviewed read-only JS modules; SW shell preloads both', () => {
  const host = readFileSync(new URL('../../vivim-host/direct-phone.mjs', import.meta.url), 'utf8');
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  for (const asset of ['vec/compiler.mjs', 'vec/ui-adapter.mjs']) {
    assert.match(host, new RegExp("'" + asset.replace('.', '\\.') + "': \\['" + asset.replace('.', '\\.') + "'"));
    assert.ok(sw.includes("'" + asset + "'"));
  }
  assert.match(sw, /var CACHE = 'vivim-relay-shell-v11'/);
});

test('TierFlow modules are fixed Host assets backed by the existing canonical sources', () => {
  const host = readFileSync(new URL('../../vivim-host/direct-phone.mjs', import.meta.url), 'utf8');
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  for (const asset of ['document/schema.ts','document/validate.ts','document/import-legacy.ts',
    'render/dom.ts','render/spatial-fallback.ts']) {
    const route = 'tierflow-runtime/' + asset;
    const canonical = '../../packages/tierflow/src/visual-runtime/' + asset;
    assert.ok(host.includes("'" + route + "': ['" + canonical + "'"));
    assert.ok(sw.includes("'" + route + "'"));
    assert.ok(readFileSync(new URL('../../../packages/tierflow/src/visual-runtime/' + asset, import.meta.url), 'utf8').length > 0);
  }
  assert.match(host, /stripTypeScriptTypes\(await readFile\(filename,'utf8'\)\)/);
  assert.equal((host.match(/await readPhoneAsset\(asset\)/g) ?? []).length,2);
});

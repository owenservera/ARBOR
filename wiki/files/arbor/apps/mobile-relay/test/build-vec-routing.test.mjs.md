# File: apps/mobile-relay/test/build-vec-routing.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/build-vec-routing.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3531 B |
| Lines | 58 |
| Hash | 3fff6e3b9e4a |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| surface | const | 8 | no | const surface = createSurface(); |
| out | const | 9 | no | const out = resolveBuildRequest({ request: &#39;Add a card called Research&#39;, surface }); |
| surface | const | 17 | no | const surface = createSurface(); |
| unsupported | const | 18 | no | const unsupported = resolveBuildRequest({ request: &#39;Create a complete research app&#39;, surface }); |
| prompt | const | 20 | no | const prompt = buildDesignPrompt({ request: &#39;Create a complete research app&#39;, surface, taskId: &#39;local&#39; }); |
| source | const | 25 | no | const source = readFileSync(new URL(&#39;../build-canvas.mjs&#39;, import.meta.url), &#39;utf8&#39;); |
| local | const | 26 | no | const local = source.indexOf(&quot;if (local.outcome === &#39;candidate&#39;)&quot;); |
| send | const | 27 | no | const send = source.indexOf(&#39;const id = await send(prompt, provider)&#39;, local); |
| localBranch | const | 29 | no | const localBranch = source.slice(local, send); |
| host | const | 34 | no | const host = readFileSync(new URL(&#39;../../vivim-host/direct-phone.mjs&#39;, import.meta.url), &#39;utf8&#39;); |
| sw | const | 35 | no | const sw = readFileSync(new URL(&#39;../sw.js&#39;, import.meta.url), &#39;utf8&#39;); |
| host | const | 46 | no | const host = readFileSync(new URL(&#39;../../vivim-host/direct-phone.mjs&#39;, import.meta.url), &#39;utf8&#39;); |
| sw | const | 47 | no | const sw = readFileSync(new URL(&#39;../sw.js&#39;, import.meta.url), &#39;utf8&#39;); |
| route | const | 50 | no | const route = &#39;tierflow-runtime/&#39; + asset; |
| canonical | const | 51 | no | const canonical = &#39;../../packages/tierflow/src/visual-runtime/&#39; + asset; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| ../generative-ui/catalog.mjs | import | 4 | [apps/mobile-relay/generative-ui/catalog.mjs](../generative-ui/catalog.mjs.md) |
| ../build-composer.mjs | import | 5 | [apps/mobile-relay/build-composer.mjs](../build-composer.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
  for (const asset of ['vec/compiler.mjs', 'vec/ui-adapter.mjs', 'composer-assist.mjs', 'wiki-source-view.mjs']) {
    assert.match(host, new RegExp("'" + asset.replace('.', '\\.') + "': \\['" + asset.replace('.', '\\.') + "'"));
    assert.ok(sw.includes("'" + asset + "'"));
  }
  assert.match(sw, /var CACHE = 'vivim-relay-shell-v\d+'/);
  assert.ok(sw.includes("'vec-engines/compiler.mjs'"));
  assert.ok(sw.includes("'tierflow-runtime/document/import-legacy.ts'"));
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

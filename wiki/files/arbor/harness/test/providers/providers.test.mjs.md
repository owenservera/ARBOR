# File: harness/test/providers/providers.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/providers/providers.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12552 B |
| Lines | 213 |
| Hash | 7d63c0633e2f |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| providersDir | const | 10 | no | const providersDir = fileURLToPath(new URL(&#39;../../src/providers/&#39;, import.meta.url)); |
| files | const | 26 | no | const files = readdirSync(providersDir).filter(f =&gt; f.endsWith(&#39;.mjs&#39;) &amp;&amp; f !== &#39;index.mjs&#39;); |
| registered | const | 28 | no | const registered = listProviders(); |
| ids | const | 29 | no | const ids = new Set(); |
| mod | const | 31 | no | const mod = await import(pathToFileURL(join(providersDir, file)).href); |
| profile | const | 32 | no | const profile = mod.default; |
| p | const | 44 | no | const p = getProvider(&#39;grok&#39;); |
| grok | const | 65 | no | const grok = getProvider(&#39;grok&#39;); |
| TIER_CLASS | const | 66 | no | const TIER_CLASS = { strong: &#39;review&#39;, fast: &#39;quick&#39; }; |
| pick | function | 67 | no | const pick = (labels, taskClass = &#39;review&#39;) =&gt; { |
| entry | const | 68 | no | const entry = normalizeModels(grok, { current: labels[0] ?? &#39;&#39;, items: labels.map(label =&gt; ({ label })) }); |
| GROK_LABELS | const | 72 | no | const GROK_LABELS = [&#39;Grok 4&#39;, &#39;grok-4&#39;, &#39;Grok4&#39;, &#39;grok 4.1&#39;, &#39;Grok-4&#39;, &#39;grok-4-fast&#39;, &#39;Grok 3 Mini&#39;, &#39;grok-mini&#39;]; |
| r | const | 77 | no | const r = pick([label]); |
| strong | const | 82 | no | const strong = pick([&#39;Grok 4&#39;, &#39;Grok 3&#39;, &#39;Grok 3 Mini&#39;]); |
| fast | const | 86 | no | const fast = pick([&#39;Grok 4&#39;, &#39;Grok 3 Mini&#39;], &#39;quick&#39;); |
| r | const | 93 | no | const r = pick([label]); |
| foreign | const | 100 | no | const foreign = [&#39;Claude 5.5&#39;, &#39;Opus 5.5&#39;, &#39;Haiku 5.5&#39;, &#39;GPT-6&#39;, &#39;GLM-5.3&#39;, &#39;GLM-5.3-Flash&#39;, &#39;Llama 4 70B&#39;, &#39;Mistral Large&#39;, &#39;DeepSeek V3&#39;, &#39;Qwen3 Max&#39;]; |
| mixed | const | 102 | no | const mixed = pick([...foreign, &#39;Grok 4&#39;]); |
| rx | const | 113 | no | const rx = new RegExp(src, &#39;i&#39;); |
| r | const | 116 | no | const r = pick([label], TIER_CLASS[tier]); |
| rx | const | 122 | no | const rx = new RegExp(src, &#39;i&#39;); |
| p | const | 135 | no | const p = getProvider(&#39;chatgpt&#39;); |
| kimi | const | 143 | no | const kimi = getProvider(&#39;kimi&#39;); |
| base | const | 147 | no | const base = getProvider(&#39;chatgpt&#39;); |
| uuid | const | 153 | no | const uuid = &#39;12345678-1234-1234-1234-123456789abc&#39;; |
| pattern | const | 155 | no | const pattern = getProvider(id).threadPattern; |
| g | const | 160 | no | const g = getProvider(&#39;gemini&#39;).threadPattern; assert.equal(g.exec(&#39;/app/a84af037ea706cdd&#39;).groups.id, &#39;a84af037ea706cdd&#39;); assert.equal(g.test(&#39;/app&#39;), false); assert.equal(g.test(&#39;/app/a84af037ea70… |
| gr | const | 162 | no | const gr = getProvider(&#39;grok&#39;).threadPattern; |
| p | const | 170 | no | const p = getProvider(&#39;kimi&#39;); |
| p | const | 184 | no | const p = getProvider(&#39;grok&#39;); |
| p | const | 193 | no | const p = getProvider(&#39;kimi&#39;); |
| script | const | 207 | no | const script = fileURLToPath(new URL(&#39;../../scripts/discover.mjs&#39;, import.meta.url)); |
| result | const | 209 | no | const result = spawnSync(process.execPath, [script, ...args, &#39;--target&#39;, &#39;fake&#39;], { encoding: &#39;utf8&#39; }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:child_process | import | 3 | external |
| node:fs | import | 4 | external |
| node:path | import | 5 | external |
| node:url | import | 6 | external |
| ../../src/providers/index.mjs | import | 7 | [harness/src/providers/index.mjs](../../src/providers/index.mjs.md) |
| ../../src/core/models.mjs | import | 8 | [harness/src/core/models.mjs](../../src/core/models.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { listProviders, getProvider, providerForUrl, validateProfile } from '../../src/providers/index.mjs';
import { normalizeModels, pickModelForTask, slug } from '../../src/core/models.mjs';

const providersDir = fileURLToPath(new URL('../../src/providers/', import.meta.url));

test('all profiles validate and have nonempty selectors', () => {
  assert.equal(listProviders().length, 8);
  for (const p of listProviders()) {
    assert.equal(validateProfile(p), p);
    assert.equal(getProvider(p.id), p);
    for (const arr of [p.composer.selectors, p.send.buttonSelectors, p.assistant.containerSelectors, p.assistant.streamingSelectors, p.preflight.authWallSelectors]) assert.ok(arr.length && arr.every(s => typeof s === 'string' && s.trim()));
  }
});
test('every provider profile module is registered, so no imported profile is unreachable', async () => {
  // The registry array in src/providers/index.mjs is the ONLY list of reachable providers.
  // A profile that is imported but left out of that array still validates and still exports,
  // yet getProvider()/providerForUrl() never see it — a silently dead provider. Scanning the
  // profile directory (instead of a hardcoded roster) means a newly added profile module
  // cannot be forgotten here: the test fails until it is registered.
  const files = readdirSync(providersDir).filter(f => f.endsWith('.mjs') && f !== 'index.mjs');
  assert.ok(files.length > 0, 'provider profile directory must not be empty');
  const registered = listProviders();
  const ids = new Set();
  for (const file of files) {
    const mod = await import(pathToFileURL(join(providersDir, file)).href);
    const profile = mod.default;
    assert.ok(profile && typeof profile === 'object' && typeof profile.id === 'string' && Array.isArray(profile.hosts), `${file} must default-export a provider profile`);
    assert.ok(registered.includes(profile), `${file} (${profile.id}) is imported but NOT registered — it would be unreachable`);
    assert.equal(getProvider(profile.id), profile, `${file} (${profile.id}) must be resolvable by id`);
    assert.ok(!ids.has(profile.id), `duplicate provider id: ${profile.id}`);
    ids.add(profile.id);
  }
  // No phantom entries either: the registry holds exactly the profile modules on disk.
  assert.equal(registered.length, files.length, 'registered providers must match the number of profile modules');
  assert.deepEqual(registered.map(p => p.id).sort(), [...ids].sort());
});
test('grok is registered, validates, and maps its hosts exactly', () => {
  const p = getProvider('grok');
  assert.ok(p, 'grok must be registered');
  assert.ok(listProviders().includes(p));
  assert.equal(validateProfile(p), p);
  assert.equal(p.id, 'grok');
  assert.equal(p.label, 'Grok');
  assert.equal(p.url, 'https://grok.com/');
  assert.ok(p.hosts.includes('grok.com'));
  for (const host of p.hosts) {
    assert.equal(providerForUrl(`https://${host}/`), p);
    assert.equal(providerForUrl(`https://${host}.evil.test/`), null);
    assert.equal(providerForUrl(`http://${host}/`), null);
  }
  assert.equal(providerForUrl('https://grok.com@evil.test/'), null);
  assert.equal(providerForUrl('https://grok.com.evil.test/'), null);
});
test('grok model tiers resolve a grok model and never a look-alike', () => {
  // grok's picker labels are NOT measured live (grok.mjs is a seeded profile): the labels below are
  // representative spellings of a grok model name, not a measured inventory of models. This pins
  // PATTERN behaviour, not a model list: a versioned grok label resolves, a foreign label never
  // does, and no effort/ignore pattern may shadow a tier pattern.
  const grok = getProvider('grok');
  const TIER_CLASS = { strong: 'review', fast: 'quick' };
  const pick = (labels, taskClass = 'review') => {
    const entry = normalizeModels(grok, { current: labels[0] ?? '', items: labels.map(label => ({ label })) });
    const { model, tier } = pickModelForTask(grok, entry, taskClass);
    return { model, tier, models: entry.models.map(m => m.label) };
  };
  const GROK_LABELS = ['Grok 4', 'grok-4', 'Grok4', 'grok 4.1', 'Grok-4', 'grok-4-fast', 'Grok 3 Mini', 'grok-mini'];

  // 1. A versioned grok label survives normalizeModels as a MODEL. models.efforts used to claim
  //    ^groks?[0-9]*$, which swallowed every versioned grok label before a tier could match it.
  for (const label of GROK_LABELS) {
    const r = pick([label]);
    assert.ok(r.models.includes(label), `${label} must survive normalization as a model, got ${JSON.stringify(r.models)}`);
  }
```

_First 80 of 214 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

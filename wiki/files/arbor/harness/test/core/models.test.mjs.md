# File: harness/test/core/models.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/core/models.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6163 B |
| Lines | 73 |
| Hash | 61399f719581 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| claude | const | 16 | no | const claude = getProvider(&#39;claude&#39;); |
| r | const | 17 | no | const r = normalizeModels(claude, { current: &#39;Haiku 5.5 Medium&#39;, items: [{ label: &#39;Haiku 5.5\\nFastest for quick answers&#39;, checked: true }, { label: &#39;Effort&#39; }, { label: &#39;Medium&#39; }, { label: &#39;More mod… |
| zai | const | 21 | no | const zai = getProvider(&#39;zai&#39;); |
| r | const | 22 | no | const r = normalizeModels(zai, { current: &#39;GLM-5.3-Flash&#39;, items: [&#39;GLM-5.3-Flash&#39;, &#39;GLM-5.3&#39;, &#39;GLM-5.2&#39;, &#39;Effort&#39;, &#39;Max&#39;].map(label =&gt; ({ label })) }); |
| entry | const | 26 | no | const entry = { models: [{ id: &#39;haiku-5.5&#39;, label: &#39;Haiku 5.5&#39; }, { id: &#39;opus-5.5&#39;, label: &#39;Opus 5.5&#39; }] }; |
| p | const | 34 | no | const p = { ...getProvider(&#39;claude&#39;) }; |
| fakePage | function | 43 | no | function fakePage(state) { |
| p | const | 52 | no | const p = getProvider(&#39;zai&#39;); |
| s | const | 53 | no | const s = { current: &#39;GLM-5.3-Flash&#39;, items: [&#39;GLM-5.3-Flash&#39;, &#39;GLM-5.3&#39;], selects: 0, selectWorks: true }; |
| ok | const | 54 | no | const ok = await prepareModel({ page: fakePage(s), profile: p, wanted: &#39;glm-5.3&#39; }); |
| same | const | 56 | no | const same = await prepareModel({ page: fakePage(s), profile: p, wanted: &#39;GLM-5.3&#39; }); assert.equal(same.ok, true); assert.equal(s.selects, 1); |
| none | const | 57 | no | const none = await prepareModel({ page: fakePage(s), profile: p, wanted: &#39;gpt-6&#39; }); assert.equal(none.error, &#39;MODEL_UNAVAILABLE&#39;); |
| s2 | const | 58 | no | const s2 = { current: &#39;GLM-5.3-Flash&#39;, items: [&#39;GLM-5.3-Flash&#39;, &#39;GLM-5.3&#39;], selects: 0, selectWorks: false }; |
| bad | const | 59 | no | const bad = await prepareModel({ page: fakePage(s2), profile: p, wanted: &#39;glm-5.3&#39; }); assert.equal(bad.error, &#39;MODEL_SELECT_UNVERIFIED&#39;); |
| cur | const | 60 | no | const cur = await prepareModel({ page: fakePage(s2), profile: p }); assert.equal(cur.model.id, &#39;glm-5.3-flash&#39;); |
| noPicker | const | 61 | no | const noPicker = await prepareModel({ page: fakePage(s), profile: getProvider(&#39;deepseek&#39;), wanted: &#39;x&#39; }); assert.equal(noPicker.error, &#39;MODELS_UNSUPPORTED&#39;); |
| dir | const | 64 | no | const dir = await mkdtemp(join(tmpdir(), &#39;wh-models-&#39;)); t.after(() =&gt; rm(dir, { recursive: true, force: true })); |
| reg | const | 65 | no | const reg = createModelRegistry({ file: join(dir, &#39;models.json&#39;) }); |
| q | const | 71 | no | const q = getProvider(&#39;qwen&#39;); assert.equal(q.send.strategy, &#39;enter&#39;); assert.equal(q.send.foreground, true); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../../src/core/models.mjs | import | 6 | [harness/src/core/models.mjs](../../src/core/models.mjs.md) |
| ../../src/providers/index.mjs | import | 7 | [harness/src/providers/index.mjs](../../src/providers/index.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseModelSpec, normalizeModels, resolveModel, pickModelForTask, prepareModel, createModelRegistry, discoverExpression, selectExpression, slug } from '../../src/core/models.mjs';
import { getProvider, validateProfile } from '../../src/providers/index.mjs';

test('parseModelSpec splits provider:model', () => {
  assert.deepEqual(parseModelSpec('chatgpt:gpt-6'), { provider: 'chatgpt', model: 'gpt-6' });
  assert.deepEqual(parseModelSpec('claude'), { provider: 'claude', model: null });
  assert.deepEqual(parseModelSpec('zai:GLM-5.3-Flash'), { provider: 'zai', model: 'GLM-5.3-Flash' });
  assert.throws(() => parseModelSpec(':x')); assert.throws(() => parseModelSpec(''));
});
test('normalizeModels filters non-model items and finds the checked model', () => {
  const claude = getProvider('claude');
  const r = normalizeModels(claude, { current: 'Haiku 5.5 Medium', items: [{ label: 'Haiku 5.5\nFastest for quick answers', checked: true }, { label: 'Effort' }, { label: 'Medium' }, { label: 'More models' }, { label: 'Fable 5.1 is included in Max plans, or available with usage credits on Pro. Learn more' }, { label: 'Opus 5.5' }, { label: 'Buy credits' }, { label: 'Opus 5.5' }] });
  assert.deepEqual(r.models.map(m => m.label), ['Haiku 5.5', 'Opus 5.5']); assert.equal(r.current, 'haiku-5.5');
});
test('normalizeModels falls back to the trigger text when nothing is checked', () => {
  const zai = getProvider('zai');
  const r = normalizeModels(zai, { current: 'GLM-5.3-Flash', items: ['GLM-5.3-Flash', 'GLM-5.3', 'GLM-5.2', 'Effort', 'Max'].map(label => ({ label })) });
  assert.deepEqual(r.models.map(m => m.id), ['glm-5.3-flash', 'glm-5.3', 'glm-5.2']); assert.equal(r.current, 'glm-5.3-flash');
});
test('resolveModel matches id or label; pickModelForTask uses tiers', () => {
  const entry = { models: [{ id: 'haiku-5.5', label: 'Haiku 5.5' }, { id: 'opus-5.5', label: 'Opus 5.5' }] };
  assert.equal(resolveModel(entry, 'Opus 5.5').id, 'opus-5.5'); assert.equal(resolveModel(entry, 'OPUS-5.5').id, 'opus-5.5'); assert.equal(resolveModel(entry, 'gpt-6'), null);
  assert.equal(pickModelForTask(getProvider('claude'), entry, 'review').model.id, 'opus-5.5');
  assert.equal(pickModelForTask(getProvider('claude'), entry, 'quick').model.id, 'haiku-5.5');
  assert.equal(slug('GPT-5.6 Sol'), 'gpt-5.6-sol');
});
test('every picker config validates and invalid config is refused', () => {
  for (const id of ['chatgpt', 'claude', 'gemini', 'zai', 'qwen']) assert.ok(getProvider(id).models.triggerSelector);
  const p = { ...getProvider('claude') };
  assert.throws(() => validateProfile({ ...p, models: { triggerSelector: '' } }), /models/);
  assert.throws(() => validateProfile({ ...p, models: { triggerSelector: 'x', ignore: ['('] } }), /regex/);
});
test('picker expressions are read/select only: never type or submit', () => {
  for (const e of [discoverExpression(getProvider('claude')), selectExpression(getProvider('claude'), 'Opus 5.5')]) {
    assert.doesNotMatch(e, /insertText|execCommand|\.submit\(|key:\s*'Enter'/); assert.match(e, /Escape/);
  }
});
function fakePage(state) {
  return { async evaluate(expr) {
    if (expr.startsWith('!!document')) return true;
    if (expr.includes('harness:models-discover')) return { current: state.current, items: state.items.map(label => ({ label, checked: label === state.current })) };
    if (expr.includes('harness:models-select')) { state.selects++; const want = JSON.parse(expr.match(/const want = ("[^"]*")/)[1]); const hit = state.items.find(i => i.toLowerCase() === want); if (hit && state.selectWorks) state.current = hit; return { ok: !!hit }; }
    throw new Error('unexpected ' + expr.slice(0, 40));
  } };
}
test('prepareModel selects then verifies; unavailable or unverified blocks', async () => {
  const p = getProvider('zai');
  const s = { current: 'GLM-5.3-Flash', items: ['GLM-5.3-Flash', 'GLM-5.3'], selects: 0, selectWorks: true };
  const ok = await prepareModel({ page: fakePage(s), profile: p, wanted: 'glm-5.3' });
  assert.equal(ok.ok, true); assert.equal(ok.model.id, 'glm-5.3'); assert.equal(s.selects, 1);
  const same = await prepareModel({ page: fakePage(s), profile: p, wanted: 'GLM-5.3' }); assert.equal(same.ok, true); assert.equal(s.selects, 1);
  const none = await prepareModel({ page: fakePage(s), profile: p, wanted: 'gpt-6' }); assert.equal(none.error, 'MODEL_UNAVAILABLE');
  const s2 = { current: 'GLM-5.3-Flash', items: ['GLM-5.3-Flash', 'GLM-5.3'], selects: 0, selectWorks: false };
  const bad = await prepareModel({ page: fakePage(s2), profile: p, wanted: 'glm-5.3' }); assert.equal(bad.error, 'MODEL_SELECT_UNVERIFIED');
  const cur = await prepareModel({ page: fakePage(s2), profile: p }); assert.equal(cur.model.id, 'glm-5.3-flash');
  const noPicker = await prepareModel({ page: fakePage(s), profile: getProvider('deepseek'), wanted: 'x' }); assert.equal(noPicker.error, 'MODELS_UNSUPPORTED');
});
test('model registry persists discoveries and ignores failed reads', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'wh-models-')); t.after(() => rm(dir, { recursive: true, force: true }));
  const reg = createModelRegistry({ file: join(dir, 'models.json') });
  await reg.save('zai', { current: 'glm-5.3', currentLabel: 'GLM-5.3', models: [{ id: 'glm-5.3', label: 'GLM-5.3', current: true }] }, 'T');
  await reg.save('zai', { error: 'MODEL_PICKER_MISSING', models: [] });
  assert.deepEqual((await reg.load()).zai, { discoveredAt: 'T', current: 'glm-5.3', currentLabel: 'GLM-5.3', models: [{ id: 'glm-5.3', label: 'GLM-5.3', current: true }] });
});
test('qwen submits with Enter from a foregrounded tab; foreground must be boolean', () => {
  const q = getProvider('qwen'); assert.equal(q.send.strategy, 'enter'); assert.equal(q.send.foreground, true);
  assert.throws(() => validateProfile({ ...q, send: { ...q.send, foreground: 'yes' } }), /foreground/);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

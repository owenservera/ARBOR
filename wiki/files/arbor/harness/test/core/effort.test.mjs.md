# File: harness/test/core/effort.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/core/effort.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2305 B |
| Lines | 35 |
| Hash | 1dc49e3986ea |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| n | const | 11 | no | const n = normalizeModels(chatgpt, { current: &#39;GPT-6&#39;, items: [{ label: &#39;GPT-6&#39;, checked: true }, { label: &#39;Instant&#39;, checked: true }, { label: &#39;Thinking&#39; }, { label: &#39;Heavy&#39; }] }); |
| sliderProfile | const | 20 | no | const sliderProfile = { models: { triggerSelector: &#39;button&#39;, effortSlider: &#39;[role=slider]&#39; } }; |
| sliderPage | function | 21 | no | function sliderPage(state) { |
| r | const | 30 | no | const r = await pm2({ page: sliderPage({ index: 1, count: 3, locked: false }), profile: sliderProfile, wanted: &#39;gpt-6&#39;, effort: &#39;max&#39;, pollMs: 1, timeoutMs: 50 }); |
| st | const | 32 | no | const st = { index: 1, count: 3, locked: true }; |
| l | const | 33 | no | const l = await pm2({ page: sliderPage(st), profile: sliderProfile, wanted: &#39;gpt-6&#39;, effort: &#39;max&#39;, pollMs: 1, timeoutMs: 50 }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/core/models.mjs | import | 3 | [harness/src/core/models.mjs](../../src/core/models.mjs.md) |
| ../../src/providers/chatgpt.mjs | import | 4 | [harness/src/providers/chatgpt.mjs](../../src/providers/chatgpt.mjs.md) |
| ../../src/core/models.mjs | import | 19 | [harness/src/core/models.mjs](../../src/core/models.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseModelSpec, normalizeModels, resolveEffort } from '../../src/core/models.mjs';
import chatgpt from '../../src/providers/chatgpt.mjs';

test('model spec carries @effort', () => {
  assert.deepEqual(parseModelSpec('chatgpt:gpt-6@max'), { provider: 'chatgpt', model: 'gpt-6', effort: 'max' });
  assert.deepEqual(parseModelSpec('chatgpt:gpt-6'), { provider: 'chatgpt', model: 'gpt-6' });
});
test('efforts are discovered separately and max picks the last', () => {
  const n = normalizeModels(chatgpt, { current: 'GPT-6', items: [{ label: 'GPT-6', checked: true }, { label: 'Instant', checked: true }, { label: 'Thinking' }, { label: 'Heavy' }] });
  assert.deepEqual(n.models.map(m => m.id), ['gpt-6']);
  assert.deepEqual(n.efforts.map(e => e.id), ['instant', 'thinking', 'heavy']);
  assert.equal(resolveEffort(n, 'max').id, 'heavy');
  assert.equal(resolveEffort(n, 'Thinking').id, 'thinking');
  assert.equal(resolveEffort(n, 'nope'), null);
});

import { prepareModel as pm2 } from '../../src/core/models.mjs';
const sliderProfile = { models: { triggerSelector: 'button', effortSlider: '[role=slider]' } };
function sliderPage(state) {
  return { async evaluate(ex) {
    if (ex.startsWith('!!')) return true;
    if (ex.includes('harness:effort-slider')) { if (!state.locked) state.index = state.count; return { ok: true }; }
    if (ex.includes('harness:models-discover')) return { current: 'GPT-6', items: [{ label: 'GPT-6', checked: true }], slider: { ...state, label: state.index === state.count ? 'Heavy' : 'Instant' } };
    return { ok: true };
  } };
}
test('slider effort: max moves to the top and verifies; locked refuses without moving', async () => {
  const r = await pm2({ page: sliderPage({ index: 1, count: 3, locked: false }), profile: sliderProfile, wanted: 'gpt-6', effort: 'max', pollMs: 1, timeoutMs: 50 });
  assert.equal(r.ok, true); assert.equal(r.model.effort, 'Heavy');
  const st = { index: 1, count: 3, locked: true };
  const l = await pm2({ page: sliderPage(st), profile: sliderProfile, wanted: 'gpt-6', effort: 'max', pollMs: 1, timeoutMs: 50 });
  assert.equal(l.ok, false); assert.equal(l.error, 'EFFORT_LOCKED'); assert.equal(st.index, 1);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

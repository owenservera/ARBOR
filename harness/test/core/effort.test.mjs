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

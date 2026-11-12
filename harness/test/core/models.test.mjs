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

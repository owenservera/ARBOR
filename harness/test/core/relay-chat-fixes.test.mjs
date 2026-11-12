// grokbot-authored: effort-menu normalization, dismiss expression, aria-busy scoping.
import test from 'node:test'; import assert from 'node:assert/strict';
import { normalizeModels, dismissExpression, resolveEffort } from '../../src/core/models.mjs';
import claude from '../../src/providers/claude.mjs'; import chatgpt from '../../src/providers/chatgpt.mjs';
test('claude effort menu levels + current', () => {
  const n = normalizeModels(claude, { items: [{ label: 'Opus 5.5\nFor complex work', checked: true }, { label: 'Effort\nHigh' }, { label: 'Sonnet 5.5' }] });
  assert.equal(n.current, 'opus-5.5'); assert.deepEqual(n.efforts.map(e => e.id), ['low', 'medium', 'high', 'max']);
  assert.equal(n.efforts.find(e => e.current).id, 'high'); assert.equal(n.effortMode, 'menu'); assert.equal(resolveEffort(n, 'low').id, 'low');
  assert.ok(!n.models.some(m => /effort|^high$/i.test(m.label)));
});
test('dismiss expression carries cookie text and never targets send', () => {
  const e = dismissExpression(claude); assert.match(e, /reject all cookies/); assert.doesNotMatch(e, /send-button|Enter/);
});
test('aria-busy streaming selector excludes buttons', () => {
  assert.ok(chatgpt.assistant.streamingSelectors.includes('[aria-busy="true"]:not(button)'));
  assert.ok(!chatgpt.assistant.streamingSelectors.includes('[aria-busy="true"]'));
});

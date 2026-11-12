import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyIntent, INTENT_TYPES, EXECUTION_TARGETS, DOMAINS } from '../../src/interface/intent.mjs';

test('intent: exports valid enums', () => {
  assert.ok(Array.isArray(INTENT_TYPES) && INTENT_TYPES.length > 0);
  assert.ok(Array.isArray(EXECUTION_TARGETS) && EXECUTION_TARGETS.length > 0);
  assert.ok(Array.isArray(DOMAINS) && DOMAINS.length > 0);
  assert.ok(INTENT_TYPES.includes('code-change'));
  assert.ok(INTENT_TYPES.includes('ui-change'));
  assert.ok(INTENT_TYPES.includes('data-task'));
  assert.ok(EXECUTION_TARGETS.includes('local-pc'));
  assert.ok(EXECUTION_TARGETS.includes('mobile-app'));
  assert.ok(EXECUTION_TARGETS.includes('webapp'));
  assert.ok(EXECUTION_TARGETS.includes('auto'));
});

test('intent: code-change maps to local-pc / code domain', () => {
  const r = classifyIntent({ task: 'implement a new API endpoint in the Talk component' });
  assert.equal(r.intentType, 'code-change');
  assert.equal(r.executionTarget, 'local-pc');
  assert.equal(r.domain, 'code');
  assert.ok(r.confidence > 0.5);
  assert.ok(r.reasoning.includes('code-change keywords'));
});

test('intent: fix bug maps to code-change', () => {
  const r = classifyIntent({ task: 'fix the bug in the header component' });
  assert.equal(r.intentType, 'code-change');
  assert.equal(r.executionTarget, 'local-pc');
});

test('intent: ui/theme change maps to webapp / ui domain', () => {
  const r = classifyIntent({ task: 'change the background theme to dark mode' });
  assert.equal(r.intentType, 'ui-change');
  assert.equal(r.executionTarget, 'webapp');
  assert.equal(r.domain, 'ui');
});

test('intent: data task maps to local-pc / data domain', () => {
  const r = classifyIntent({ task: 'export the database records to csv' });
  assert.equal(r.intentType, 'data-task');
  assert.equal(r.executionTarget, 'local-pc');
  assert.equal(r.domain, 'data');
});

test('intent: explicit PC keyword overrides to local-pc', () => {
  const r = classifyIntent({ task: 'write a powershell script for windows startup' });
  assert.equal(r.executionTarget, 'local-pc');
  assert.ok(r.reasoning.includes('PC/local keywords'));
});

test('intent: explicit mobile keyword maps to mobile-app', () => {
  const r = classifyIntent({ task: 'update the android app layout' });
  assert.equal(r.executionTarget, 'mobile-app');
  assert.ok(r.reasoning.includes('mobile keywords'));
});

test('intent: both PC and mobile maps to auto', () => {
  const r = classifyIntent({ task: 'sync the windows app to the android phone' });
  assert.equal(r.executionTarget, 'auto');
});

test('intent: short question defaults to webapp chat', () => {
  const r = classifyIntent({ task: 'what model should I use?' });
  assert.equal(r.intentType, 'webapp-chat');
  assert.equal(r.executionTarget, 'webapp');
  assert.equal(r.domain, 'general');
});

test('intent: role implementer implies code-change', () => {
  const r = classifyIntent({ task: 'do something', role: 'implementer' });
  assert.equal(r.intentType, 'code-change');
});

test('intent: role reviewer implies code-change', () => {
  const r = classifyIntent({ task: 'look at this diff', role: 'reviewer' });
  assert.equal(r.intentType, 'code-change');
});

test('intent: confidence is bounded 0.25-0.98', () => {
  const r = classifyIntent({ task: '' });
  assert.ok(r.confidence >= 0.25 && r.confidence <= 0.98);
  const r2 = classifyIntent({ task: 'implement a new react component with typescript tests and a pull request' });
  assert.ok(r2.confidence <= 0.98);
});

test('intent: returns taskLength', () => {
  const r = classifyIntent({ task: 'hello world' });
  assert.equal(r.taskLength, 11);
});

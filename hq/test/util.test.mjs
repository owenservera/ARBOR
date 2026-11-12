// hq/test/util.test.mjs — estimateTokens and globToRegExp.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimateTokens, globToRegExp } from '../lib/util.mjs';

test('estimateTokens returns 0 for empty input', () => {
  assert.equal(estimateTokens(''), 0);
  assert.equal(estimateTokens(null), 0);
  assert.equal(estimateTokens(undefined), 0);
});

test('estimateTokens returns a positive count for non-empty input', () => {
  assert.ok(estimateTokens('hello world') > 0);
});

test('globToRegExp supports character classes', () => {
  assert.ok(globToRegExp('[abc].mjs').test('b.mjs'));
  assert.ok(!globToRegExp('[abc].mjs').test('x.mjs'));
});

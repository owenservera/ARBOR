import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authorFromBody } from '../../src/build/review-cli.mjs';
test('author is read from the wh build PR body', () => {
  assert.equal(authorFromBody('- Provider/model: `claude:opus-5.5`\n'), 'claude:opus-5.5');
  assert.equal(authorFromBody('hand written'), null);
});
test('severity comment lists candidates, dismissals and advisory', async () => {
  const { severityBody } = await import('../../src/build/review-cli.mjs');
  const b = severityBody({ candidates: [{ id: 1, path: 'src/a.mjs', line: 3, text: '[BLOCKER] src/a.mjs:3 x' }], advisory: ['[ADVISORY] y'], round: 2, dismissed: [{ id: 2, reason: 'tests prove regex works' }] });
  assert.match(b, /round 2\/3/); assert.match(b, /#1 `src\/a.mjs:3`/); assert.match(b, /#2: tests prove/); assert.match(b, /\[ADVISORY\] y/);
});

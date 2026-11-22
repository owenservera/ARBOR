import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../../bin/commands/capture.mjs',import.meta.url),'utf8');

test('Studio CLI is a background engine, not a second local VIVIM application',()=>{
  assert.match(source,/await startStudio\(/);
  assert.match(source,/await launchChrome\(/);
  assert.doesNotMatch(source,/openUrl\(st\.url\)|function openUrl\(|spawn\(['"]explorer\.exe/);
  assert.match(source,/Native VIVIM owns the only local product window/);
  assert.match(source,/Legacy compatibility; Studio no longer opens its browser dashboard/);
});
test('Studio capture and provider browser remain available without a dashboard',()=>{
  assert.match(source,/name: 'launch'/);
  assert.match(source,/name: 'targets'/);
  assert.match(source,/name: 'start'/);
  assert.match(source,/name: 'serve'/);
  assert.match(source,/recorder|record/i);
  assert.match(source,/runStudio\(ctx, \{ launch: true \}\)/);
});

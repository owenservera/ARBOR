import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { readDesktopCommanderLearning } from '../data-intelligence/desktop-commander-learning.mjs';
const NOW = Date.parse('2026-11-22T22:14:00.000Z');
const receipt = { schema: 'desktop-commander-cycle-v1', status: 'SUCCESS',
  finished_utc: '2026-11-22T22:12:34.000Z', source_directory: 'PRIVATE-SOURCE-SECRET' };
const report = { schema: 'dc-local-learning-observatory-v1', generated_utc: '2026-11-22T18:05:07.000Z',
  observed_index_rows: 2922, upstream_large_output_omissions: 352,
  process_exit_zero_entries: 324, process_exit_nonzero_entries: 43,
  pattern_hit_entries: { powershell_profile_noise: 806, wiki_typing_assertion: 9,
    malicious_extra_metric: 'DO-NOT-PROJECT' }, rawContent: 'PRIVATE-RAW-SECRET' };
async function fixture(t, { cap = receipt, analysis = report } = {}) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dc-vivim-learning-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, 'state'), { recursive: true });
  await mkdir(path.join(dir, 'reports'), { recursive: true });
  if (cap) await writeFile(path.join(dir, 'state', 'cycle-latest.json'), JSON.stringify(cap));
  if (analysis) await writeFile(path.join(dir, 'reports', 'learning-latest.json'), JSON.stringify(analysis));
  return dir;
}
test('joins Labs receipts and reports into bounded evidence-only developer learning', async t => {
  const archiveRoot = await fixture(t);
  const out = await readDesktopCommanderLearning({ archiveRoot, now: NOW });
  assert.equal(out.schema, 'vivim.development-learning/1');
  assert.equal(out.state, 'ready');
  assert.equal(out.capture.lastCapturedAt, '2026-11-22T22:12:34.000Z');
  assert.equal(out.analysis.indexedObservations, 2922);
  assert.equal(out.analysis.upstreamOutputsOmitted, 352);
  assert.equal(out.analysis.recordedExitNonzero, 43);
  assert.deepEqual(out.analysis.patterns.map(p => p.kind), ['powershell_profile_noise', 'wiki_typing_assertion']);
  assert.equal(out.privateContentIncluded, false);
  assert.equal(out.promotesLearning, false);
  assert.doesNotMatch(JSON.stringify(out), /PRIVATE-|DO-NOT-PROJECT|source_directory|rawContent/);
});
test('old capture is stale but observations remain explicitly historical', async t => {
  const archiveRoot = await fixture(t);
  const out = await readDesktopCommanderLearning({ archiveRoot, now: NOW + 11 * 60_000 });
  assert.equal(out.state, 'stale');
  assert.equal(out.analysis.indexedObservations, 2922);
});
test('capture without report never fabricates learning', async t => {
  const archiveRoot = await fixture(t, { analysis: null });
  const out = await readDesktopCommanderLearning({ archiveRoot, now: NOW });
  assert.equal(out.state, 'capturing');
  assert.equal(out.analysis, null);
});
test('negative metrics fail closed without emitting private fields', async t => {
  const archiveRoot = await fixture(t, { analysis: { ...report, observed_index_rows: -1 } });
  const out = await readDesktopCommanderLearning({ archiveRoot, now: NOW });
  assert.equal(out.state, 'unavailable');
  assert.equal(out.code, 'ANALYSIS_INVALID');
});
test('relative archive, missing capture and future capture are refused', async t => {
  assert.equal((await readDesktopCommanderLearning({ archiveRoot: 'relative/path' })).state, 'unavailable');
  const missing = await fixture(t, { cap: null });
  assert.equal((await readDesktopCommanderLearning({ archiveRoot: missing, now: NOW })).code, 'CAPTURE_NOT_VERIFIED');
  const future = await fixture(t, { cap: { ...receipt, finished_utc: '2026-11-22T22:21:00.000Z' } });
  assert.equal((await readDesktopCommanderLearning({ archiveRoot: future, now: NOW })).code, 'CAPTURE_TIME_INVALID');
});

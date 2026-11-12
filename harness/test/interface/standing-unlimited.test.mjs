import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStanding } from '../../src/interface/standing.mjs';

const YEARS = 10 * 365 * 24 * 3600000;

async function setup(t, { clock = { t: 1000 } } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'wh-standing-unl-')); t.after(() => rm(dir, { recursive: true, force: true }));
  const standing = createStanding({ dir, now: () => clock.t, verifyLabProfile: async () => true });
  return { dir, standing, clock };
}

test('unlimited hours and sends record no expiry and no send cap', async t => {
  const { standing } = await setup(t);
  const record = await standing.enable({ provider: '*', hours: null, maxSends: null, confirmText: 'ENABLE *' });
  assert.equal(record.expiresAt, null);
  assert.equal(record.maxSends, null);
  assert.equal((await standing.status()).active, true);
});

test('unlimited standing still passes check years later', async t => {
  const { standing, clock } = await setup(t);
  await standing.enable({ provider: '*', hours: null, maxSends: null, confirmText: 'ENABLE *' });
  clock.t += YEARS;
  assert.deepEqual(await standing.check({ provider: 'qwen', threadUrl: 'new', prompt: 'hi' }), { ok: true });
});

test('provider * matches every provider id', async t => {
  const { standing } = await setup(t);
  await standing.enable({ provider: '*', hours: null, maxSends: null, confirmText: 'ENABLE *' });
  for (const provider of ['qwen', 'chatgpt', 'claude', 'gemini']) {
    assert.deepEqual(await standing.check({ provider, threadUrl: 'new', prompt: 'hi' }), { ok: true });
  }
});

test('unlimited sends keep counting without a cap', async t => {
  const { standing } = await setup(t);
  await standing.enable({ provider: '*', hours: null, maxSends: null, confirmText: 'ENABLE *' });
  for (let i = 0; i < 25; i++) await standing.recordSend();
  assert.equal((await standing.status()).record.sent, 25);
  assert.deepEqual(await standing.check({ provider: 'qwen', threadUrl: 'new', prompt: 'hi' }), { ok: true });
});

test('lab profile check still applies to unlimited standing', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'wh-standing-unl-')); t.after(() => rm(dir, { recursive: true, force: true }));
  const standing = createStanding({ dir, now: () => 1000, verifyLabProfile: async () => false });
  await standing.enable({ provider: '*', hours: null, maxSends: null, confirmText: 'ENABLE *' });
  assert.deepEqual(await standing.check({ provider: 'qwen', threadUrl: 'new', prompt: 'hi' }), { ok: false, reason: 'LAB_PROFILE_NOT_VERIFIED' });
});

test('bounded enable still validates hours and max sends', async t => {
  const { standing } = await setup(t);
  await assert.rejects(standing.enable({ provider: 'qwen', hours: 0, maxSends: 5, confirmText: 'ENABLE qwen' }), { code: 'STANDING_BAD_HOURS' });
  await assert.rejects(standing.enable({ provider: 'qwen', hours: 8, maxSends: 0, confirmText: 'ENABLE qwen' }), { code: 'STANDING_BAD_MAX' });
});

test('draft-free and prompt-length rules still apply to unlimited standing', async t => {
  const { standing } = await setup(t);
  await standing.enable({ provider: '*', hours: null, maxSends: null, confirmText: 'ENABLE *' });
  assert.deepEqual(await standing.check({ provider: 'qwen', threadUrl: 'new', prompt: 'x'.repeat(2001) }), { ok: false, reason: 'PROMPT_TOO_LONG' });
});

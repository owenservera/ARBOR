// Z07: no live model/proxy/provider calls. Exercises a temporary offline CLI
// and injected seat transport; never loads the owner's real ZCode account.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { resumeSession } from '../lib/channel-transport.mjs';
import { wakeSeat, SEATS_SCHEMA } from '../lib/channel-seats.mjs';

function withFixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'vivim-z07-offline-'));
  const executable = join(dir, 'mock-cli.cjs');
  const calls = join(dir, 'calls.txt');
  writeFileSync(executable, `
    const fs = require('node:fs');
    fs.appendFileSync(process.env.VIVIM_Z07_OFFLINE_CALLS, 'call\\n');
    if (process.argv[3] === 'slow') {
      setTimeout(() => process.stdout.write('late answer\\n'), 2200);
    } else {
      process.stdout.write('settled answer\\n');
    }
  `);
  const previous = {
    HQ_ZCODE_CLI: process.env.HQ_ZCODE_CLI,
    HQ_NODE: process.env.HQ_NODE,
    VIVIM_Z07_OFFLINE_CALLS: process.env.VIVIM_Z07_OFFLINE_CALLS,
  };
  process.env.HQ_ZCODE_CLI = executable;
  process.env.HQ_NODE = process.execPath;
  process.env.VIVIM_Z07_OFFLINE_CALLS = calls;
  const restore = () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    rmSync(dir, { recursive: true, force: true });
  };
  return Promise.resolve().then(() => fn({ dir, calls })).finally(restore);
}

test('ordinary completed ZCode wake reports the exact single offline CLI reply', async () => {
  await withFixture(({dir, calls}) => {
    const out = resumeSession('fast', 'safe offline fixture', {
      timeoutMs: 4000, replyFile: join(dir, 'fast.reply'),
    });
    assert.equal(out.accepted, true);
    assert.equal(out.pending, false);
    assert.equal(out.reply, 'settled answer');
    assert.equal(readFileSync(calls, 'utf8').trim().split('\\n').length, 1);
  });
});

test('timed-out turn stays uncertain and must NOT spawn a second CLI/model call', async () => {
  await withFixture(async ({dir, calls}) => {
    const out = resumeSession('slow', 'safe offline fixture', {
      timeoutMs: 360, replyFile: join(dir, 'slow.reply'),
    });
    assert.equal(out.accepted, false);
    assert.equal(out.pending, true);
    assert.equal(out.uncertain, true);
    assert.match(out.detail, /no replay performed/);
    assert.equal(existsSync(calls), true, 'mock CLI must actually start before deadline');
    // An old implementation launched the same command detached on timeout;
    // allow enough time for that extra process to write its call marker.
    await sleep(850);
    assert.deepEqual(readFileSync(calls, 'utf8').trim().split('\\n'), ['call']);
  });
});

test('the existing wake journal preserves uncertainty instead of falsely refusing a sent turn', () => {
  const root = mkdtempSync(join(tmpdir(), 'vivim-z07-seat-'));
  try {
    writeFileSync(join(root, 'seats.json'), JSON.stringify({
      schema: SEATS_SCHEMA,
      seats: [{ id: 'review', title: 'Offline review seat', site: 'chatgpt', session: 'sess-offline' }],
    }));
    let calls = 0;
    const result = wakeSeat({
      root, seatId: 'review', prompt: 'Inspect one prepared source diff', at: '2026-11-23T19:40:00Z',
      probe: () => ({ageMinutes: 15}),
      send: () => {
        calls++;
        return { accepted: false, pending: true, uncertain: true, transport: 'cli:--resume -p' };
      },
    });
    assert.equal(calls, 1);
    assert.equal(result.decision, 'DEFERRED');
    assert.equal(result.code, 'WAKE_UNCERTAIN');
    assert.match(result.detail, /no retry was made/);
    const journal = JSON.parse(readFileSync(result.resultPath, 'utf8'));
    assert.equal(journal.pending, true);
    assert.equal(journal.accepted, false);
    assert.equal(journal.answer.uncertain, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

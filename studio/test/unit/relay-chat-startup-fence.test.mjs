import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, appendFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { snapshotRelayStartupFence } from '../../src/studio/relay-chat-startup-fence.mjs';

function withLedger(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), 'vivim-relay-boot-'));
  const file = path.join(dir, 'commands.jsonl');
  try { return fn(file); }
  finally { rmSync(dir, { recursive: true, force: true }); }
}
const id = n => 'cmd-' + n.toString(16).padStart(16, '0');
const rec = (n, status = 'queued') => ({schema:'vivim.bridge-command/1',id:id(n),status,rev:1});
const line = row => JSON.stringify(row) + '\n';

test('cold-start provider worker fences ALL historical queue IDs, not only the first 200', () =>
  withLedger(file => {
    writeFileSync(file, Array.from({length:251}, (_,i) => line(rec(i + 1))).join(''));
    const frozen = snapshotRelayStartupFence(file);
    assert.equal(frozen.size, 251);
    assert.equal(frozen.has(id(1)), true);
    assert.equal(frozen.has(id(251)), true);
    const newId = id(252);
    appendFileSync(file, line(rec(252)));
    assert.equal(frozen.has(newId), false, 'newly owner-queued message remains eligible');
    assert.equal(frozen.has(id(2)), true, 'stale old request never replays');
  }));

test('terminal or failed records cannot re-enter the worker after restart', () =>
  withLedger(file => {
    writeFileSync(file, line(rec(42,'done')) + line(rec(43,'failed')));
    const frozen = snapshotRelayStartupFence(file);
    assert.equal(frozen.has(id(42)), true);
    assert.equal(frozen.has(id(43)), true);
  }));

test('missing ledger allows first-run future commands without creating a new queue', () =>
  withLedger(file => {
    const frozen = snapshotRelayStartupFence(file);
    assert.equal(frozen.size,0);
    assert.equal(frozen.has(id(10)),false);
  }));

test('corrupt or torn ledger refuses startup rather than sending uncertain messages', () =>
  withLedger(file => {
    writeFileSync(file, '{"id":\n');
    assert.throws(() => snapshotRelayStartupFence(file), /TORN_TAIL/);
    writeFileSync(file, '{"id":\n\n');
    assert.throws(() => snapshotRelayStartupFence(file), /CORRUPT/);
    writeFileSync(file, line({id:'invalid'}));
    assert.throws(() => snapshotRelayStartupFence(file), /INVALID_ID/);
  }));

test('worker uses boot admission fence before any bridge claim', () => {
  const worker = import.meta.dirname
    ? path.resolve(import.meta.dirname,'../../bin/relay-chat-mvp.mjs')
    : new URL('../../bin/relay-chat-mvp.mjs',import.meta.url);
  const source = requireSource(worker);
  assert.match(source,/const startupFence = snapshotRelayStartupFence\(store\.file\)/);
  assert.match(source,/\.filter\(cmd => !startupFence\.has\(cmd\.id\)/);
  assert.ok(source.indexOf('const startupFence = ') < source.indexOf('for (;;)'),
    'fence must be captured before worker enters its delivery loop');
});
function requireSource(file) {
  return readFileSync(file,'utf8');
}

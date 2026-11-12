// P1 Final Wave: relay side of the ONE bootstrap action allowlist.
// relay-core must validate bootstrap commands against the canonical set imported
// from apps/vivim-host/control/bootstrap-actions.mjs, accept each of the six and
// nothing else, and the consumer registry must keep its metadata for all six
// while the seventh 'control-plan' id stays a control-mode command.
import test from 'node:test'; import assert from 'node:assert/strict';
import { BOOTSTRAP_ACTIONS, BOOTSTRAP_ACTION_SET } from '../../vivim-host/control/bootstrap-actions.mjs';
import { COMMANDS } from '../consumer-commands/registry.mjs';
import { createRelay, memoryStore, sessionValue, COOKIE } from '../lib/relay-core.mjs';

const CANONICAL_SIX = ['apply-proposal', 'choose-preset', 'grant-visual', 'personalize', 'undo-theme', 'undo-ui-revision'];
const env = { VIVIM_RELAY_PAIR_SECRET: 'p'.repeat(43), VIVIM_RELAY_HOST_SECRET: 'h'.repeat(43) };
const phone = { headers: { cookie: `${COOKIE}=${sessionValue(env.VIVIM_RELAY_PAIR_SECRET)}` } };

const body = action => action === 'choose-preset'
  ? { text: action, kind: 'command', consumer: 'bootstrap', mode: 'bootstrap', action, preset: 'dusk' }
  : action === 'apply-proposal'
    ? { text: action, kind: 'command', consumer: 'bootstrap', mode: 'bootstrap', action, proposal: { schema: 'vivim.ui-proposal/1', surfaceId: 's', baseRevision: 1, operations: [] } }
    : { text: action, kind: 'command', consumer: 'bootstrap', mode: 'bootstrap', action };

test('canonical allowlist is exactly the frozen six, sorted', () => {
  assert.deepEqual([...BOOTSTRAP_ACTIONS], CANONICAL_SIX);
  assert.equal(Object.isFrozen(BOOTSTRAP_ACTIONS), true);
  assert.equal(BOOTSTRAP_ACTION_SET.size, 6);
});

test('no-loss: the relay accepts a queued bootstrap command for each of the six actions', async () => {
  for (const action of BOOTSTRAP_ACTIONS) {
    const r = createRelay({ store: memoryStore(), env });
    const res = await r({ method: 'POST', path: 'commands', req: phone, body: body(action) });
    assert.equal(res.status, 201, 'relay must accept ' + action);
    assert.equal(res.body.action, action);
    assert.equal(res.body.mode, 'bootstrap');
  }
});

test('relay rejects ids outside the canonical set, including the seventh control-plan', async () => {
  for (const action of ['control-plan', 'grant-visual-x', 'undo-theme ', '']) {
    const r = createRelay({ store: memoryStore(), env });
    await assert.rejects(
      r({ method: 'POST', path: 'commands', req: phone, body: body(action) }),
      err => err.status === 400,
      'relay must reject bootstrap action ' + JSON.stringify(action)
    );
  }
});

test('registry metadata preserved for the six, all in the shared set', () => {
  for (const action of BOOTSTRAP_ACTIONS) {
    const entry = COMMANDS.find(c => c.id === action);
    assert.ok(entry, 'registry entry for ' + action);
    assert.equal(entry.consumer, 'bootstrap', action + ': consumer');
    assert.equal(entry.mode, 'bootstrap', action + ': mode');
    assert.ok(entry.handler, action + ': handler');
    assert.ok(entry.input && entry.output, action + ': input/output schemas');
    assert.equal(BOOTSTRAP_ACTION_SET.has(entry.id), true);
  }
});

test('seventh distinction: control-plan has a registry entry but is outside the allowlist', () => {
  const entry = COMMANDS.find(c => c.id === 'control-plan');
  assert.ok(entry, 'control-plan registry entry must exist');
  assert.equal(entry.mode, 'control');
  assert.equal(entry.scope, 'device');
  assert.equal(BOOTSTRAP_ACTION_SET.has('control-plan'), false);
});

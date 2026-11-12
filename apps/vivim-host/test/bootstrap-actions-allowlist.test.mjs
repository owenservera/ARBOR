// P1 Final Wave: ONE bootstrap action allowlist.
// The command worker, the relay route and the consumer command registry must all
// consume the canonical set in ../control/bootstrap-actions.mjs; any private copy
// is a duplicate authority that drifts. The seventh registry id 'control-plan'
// is a control-mode command and must stay OUTSIDE the bootstrap allowlist.
import test from 'node:test'; import assert from 'node:assert/strict';
import { BOOTSTRAP_ACTIONS, BOOTSTRAP_ACTION_SET } from '../control/bootstrap-actions.mjs';
import { BOOTSTRAP_ACTIONS as WORKER_ACTIONS } from '../bootstrap/command-worker.mjs';
import { COMMANDS } from '../../mobile-relay/consumer-commands/registry.mjs';

const CANONICAL_SIX = ['apply-proposal', 'choose-preset', 'grant-visual', 'personalize', 'undo-theme', 'undo-ui-revision'];

test('canonical allowlist is exactly the frozen six, sorted', () => {
  assert.deepEqual([...BOOTSTRAP_ACTIONS], CANONICAL_SIX);
  assert.equal(Object.isFrozen(BOOTSTRAP_ACTIONS), true);
  assert.equal(BOOTSTRAP_ACTION_SET.size, 6);
  for (const id of CANONICAL_SIX) assert.equal(BOOTSTRAP_ACTION_SET.has(id), true, id);
});

test('command-worker consumes the canonical set, no private copy', () => {
  // Identity: command-worker re-exports the canonical array. A drifted local copy
  // would be a different array object and this assert fails.
  assert.equal(WORKER_ACTIONS, BOOTSTRAP_ACTIONS);
  assert.deepEqual([...WORKER_ACTIONS], CANONICAL_SIX);
});

test('no-loss: worker advertises exactly the six accepted actions', () => {
  assert.deepEqual([...WORKER_ACTIONS].sort(), CANONICAL_SIX);
});

test('registry metadata preserved: each of the six has a complete bootstrap COMMANDS entry', () => {
  for (const action of BOOTSTRAP_ACTIONS) {
    const entry = COMMANDS.find(c => c.id === action);
    assert.ok(entry, 'registry entry for ' + action);
    assert.ok(entry.title, action + ': title');
    assert.equal(entry.consumer, 'bootstrap', action + ': consumer');
    assert.equal(entry.mode, 'bootstrap', action + ': mode');
    assert.ok(entry.handler, action + ': handler');
    assert.ok(entry.input && Array.isArray(entry.input.fields), action + ': input schema');
    assert.ok(entry.output && entry.output.shape, action + ': output schema');
    assert.ok(entry.icon, action + ': icon');
    assert.equal(BOOTSTRAP_ACTION_SET.has(entry.id), true, action + ' must be in the shared set');
  }
});

test('divergence guard: every bootstrap-mode registry entry is in the shared set', () => {
  for (const entry of COMMANDS.filter(c => c.mode === 'bootstrap')) {
    assert.ok(BOOTSTRAP_ACTION_SET.has(entry.id), 'registry bootstrap entry ' + entry.id + ' is not in the canonical allowlist - the copies have drifted');
  }
});

test('seventh distinction: control-plan is a registry command but never a bootstrap action', () => {
  const entry = COMMANDS.find(c => c.id === 'control-plan');
  assert.ok(entry, 'control-plan registry entry must exist');
  assert.equal(entry.consumer, 'control');
  assert.equal(entry.mode, 'control');
  assert.equal(BOOTSTRAP_ACTION_SET.has('control-plan'), false);
  assert.equal(CANONICAL_SIX.includes('control-plan'), false);
});

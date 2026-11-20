# File: apps/vivim-host/test/bootstrap-actions-allowlist.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/bootstrap-actions-allowlist.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3261 B |
| Lines | 59 |
| Hash | d30ee26b0133 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CANONICAL_SIX | const | 11 | no | const CANONICAL_SIX = [&#39;apply-proposal&#39;, &#39;choose-preset&#39;, &#39;grant-visual&#39;, &#39;personalize&#39;, &#39;undo-theme&#39;, &#39;undo-ui-revision&#39;]; |
| entry | const | 33 | no | const entry = COMMANDS.find(c =&gt; c.id === action); |
| entry | const | 53 | no | const entry = COMMANDS.find(c =&gt; c.id === &#39;control-plan&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 6 | external |
| ../control/bootstrap-actions.mjs | import | 7 | [apps/vivim-host/control/bootstrap-actions.mjs](../control/bootstrap-actions.mjs.md) |
| ../bootstrap/command-worker.mjs | import | 8 | [apps/vivim-host/bootstrap/command-worker.mjs](../bootstrap/command-worker.mjs.md) |
| ../../mobile-relay/consumer-commands/registry.mjs | import | 9 | [apps/mobile-relay/consumer-commands/registry.mjs](../../mobile-relay/consumer-commands/registry.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

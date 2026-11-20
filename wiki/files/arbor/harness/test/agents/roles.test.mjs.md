# File: harness/test/agents/roles.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/agents/roles.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3292 B |
| Lines | 55 |
| Hash | 8f63bfc56140 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| base | const | 34 | no | const base = { ...ROLES.builder, limits: { ...ROLES.builder.limits } }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/agents/roles.mjs | import | 3 | [harness/src/agents/roles.mjs](../../src/agents/roles.mjs.md) |
| ../../../studio/src/studio/orchestrator-patterns.mjs | import | 4 | [studio/src/studio/orchestrator-patterns.mjs](../../../studio/src/studio/orchestrator-patterns.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROLES, ROLE_IDS, ACTIONS, getRole, validateRole, parseModelRef } from '../../src/agents/roles.mjs';
import { STEP_ROLES } from '../../../studio/src/studio/orchestrator-patterns.mjs';

test('ROLES has core roles plus a performance specialist, deeply frozen', () => {
  assert.deepEqual([...ROLE_IDS].sort(), ['builder', 'performance-optimizer', 'planner', 'researcher', 'reviewer', 'scribe', 'synthesizer', 'verifier']);
  assert.ok(Object.isFrozen(ROLES) && Object.isFrozen(ROLES.builder) && Object.isFrozen(ROLES.builder.limits));
  assert.throws(() => { ROLES.builder.limits.mayMerge = true; }, TypeError);
});

test('every role is valid, never may merge, and maps onto studio STEP_ROLES', () => {
  for (const r of Object.values(ROLES)) {
    assert.equal(validateRole(r), r);
    assert.equal(r.limits.mayMerge, false);
    assert.ok(r.allowedActions.every((a) => ACTIONS.includes(a)));
    assert.ok(r.stepRole === null || STEP_ROLES.includes(r.stepRole), `${r.id} stepRole ${r.stepRole}`);
    parseModelRef(r.defaultModel);
  }
});

test('getRole resolves ids and aliases case-insensitively', () => {
  assert.equal(getRole('coder').id, 'builder');
  assert.equal(getRole('Orchestrator').id, 'planner');
  assert.equal(getRole('judge').id, 'synthesizer');
  assert.equal(getRole('tester').id, 'verifier');
  assert.equal(getRole('memory').id, 'scribe');
  assert.equal(getRole('perf').id, 'performance-optimizer');
  assert.equal(getRole('nope'), null);
  assert.equal(getRole(42), null);
});

test('validateRole refuses merge authority and unknown actions', () => {
  const base = { ...ROLES.builder, limits: { ...ROLES.builder.limits } };
  assert.throws(() => validateRole({ ...base, limits: { ...base.limits, mayMerge: true } }), { code: 'ROLE_INVALID' });
  assert.throws(() => validateRole({ ...base, allowedActions: ['merge'] }), { code: 'ROLE_INVALID' });
  assert.throws(() => validateRole({ ...base, defaultModel: 'opus' }), { code: 'ROLE_INVALID' });
});

test('parseModelRef needs provider:model and refuses auto', () => {
  assert.deepEqual(parseModelRef('claude:opus-5.5'), { provider: 'claude', model: 'opus-5.5' });
  assert.throws(() => parseModelRef('claude'), { code: 'MODEL_INVALID' });
  assert.throws(() => parseModelRef('auto:x'), { code: 'MODEL_INVALID' });
});

test('parseModelRef accepts nonempty effort labels and rejects malformed suffixes', () => {
  for (const effort of ['high', '2', 'Extra High', 'high-effort']) {
    assert.deepEqual(parseModelRef(` claude:opus-5.5@${effort} `), { provider: 'claude', model: 'opus-5.5', effort });
  }
  assert.deepEqual(parseModelRef('claude:opus@  high  '), { provider: 'claude', model: 'opus', effort: 'high' });
  for (const spec of ['claude:opus@', 'claude:opus@  ', 'claude:opus@high@low', 'claude:opus@high\nlow', 'claude:opus@high\n', 'claude:opus@high\tlow', 'claude:opus@high\x00low', 'claude:opus@high\x7flow', 'auto:opus@high', 'Auto:opus@high', 'claude:@high']) {
    assert.throws(() => parseModelRef(spec), { code: 'MODEL_INVALID' });
  }
  assert.equal(validateRole({ ...ROLES.builder, defaultModel: 'claude:opus@high' }).defaultModel, 'claude:opus@high');
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

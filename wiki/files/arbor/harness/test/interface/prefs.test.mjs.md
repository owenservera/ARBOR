# File: harness/test/interface/prefs.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/interface/prefs.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4443 B |
| Lines | 74 |
| Hash | c1cfe0043787 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fixture | function | 8 | no | async function fixture(t) { |
| dir | const | 9 | no | const dir = await mkdtemp(join(tmpdir(), &#39;wh-prefs-&#39;)); t.after(() =&gt; rm(dir, { recursive: true, force: true })); |
| prefs | const | 10 | no | const prefs = createPrefs({ dir, now: () =&gt; 1700000000000 }); |
| f | const | 15 | no | const f = await fixture(t); |
| saved | const | 16 | no | const saved = await f.prefs.saveRule({ taskClass: &#39;coding&#39;, provider: &#39;claude&#39;, model: &#39;sonnet-4&#39;, effort: &#39;high&#39;, scope: &#39;owner&#39; }); |
| rules | const | 19 | no | const rules = await f.prefs.listRules(); |
| f | const | 24 | no | const f = await fixture(t); |
| rules | const | 27 | no | const rules = await f.prefs.listRules(); |
| f | const | 32 | no | const f = await fixture(t); |
| rules | const | 35 | no | const rules = await f.prefs.listRules(); |
| f | const | 40 | no | const f = await fixture(t); |
| f | const | 48 | no | const f = await fixture(t); |
| inputs | const | 51 | no | const inputs = await f.prefs.routerInputs(); |
| f | const | 56 | no | const f = await fixture(t); |
| r1 | const | 57 | no | const r1 = await f.prefs.recordOutcome({ provider: &#39;claude&#39;, model: &#39;sonnet-4&#39;, taskClass: &#39;coding&#39;, success: true }); |
| r2 | const | 59 | no | const r2 = await f.prefs.recordOutcome({ provider: &#39;claude&#39;, model: &#39;sonnet-4&#39;, taskClass: &#39;coding&#39;, success: false }); |
| r3 | const | 61 | no | const r3 = await f.prefs.recordOutcome({ provider: &#39;claude&#39;, model: &#39;sonnet-4&#39;, taskClass: &#39;coding&#39;, success: true }); |
| learned | const | 63 | no | const learned = await f.prefs.listLearned(); |
| f | const | 68 | no | const f = await fixture(t); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../../src/interface/prefs.mjs | import | 6 | [harness/src/interface/prefs.mjs](../../src/interface/prefs.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPrefs } from '../../src/interface/prefs.mjs';

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'wh-prefs-')); t.after(() => rm(dir, { recursive: true, force: true }));
  const prefs = createPrefs({ dir, now: () => 1700000000000 });
  return { dir, prefs };
}

test('prefs: save and list owner rules', async t => {
  const f = await fixture(t);
  const saved = await f.prefs.saveRule({ taskClass: 'coding', provider: 'claude', model: 'sonnet-4', effort: 'high', scope: 'owner' });
  assert.equal(saved.taskClass, 'coding'); assert.equal(saved.provider, 'claude'); assert.equal(saved.model, 'sonnet-4');
  assert.equal(saved.scope, 'owner'); assert.equal(saved.projectRef, null); assert.ok(saved.createdAt); assert.ok(saved.updatedAt);
  const rules = await f.prefs.listRules();
  assert.equal(rules.length, 1); assert.equal(rules[0].taskClass, 'coding');
});

test('prefs: saveRule upserts by (taskClass, provider, scope, projectRef)', async t => {
  const f = await fixture(t);
  await f.prefs.saveRule({ taskClass: 'coding', provider: 'claude', model: 'sonnet-4', scope: 'owner' });
  await f.prefs.saveRule({ taskClass: 'coding', provider: 'claude', model: 'opus-4', scope: 'owner' });
  const rules = await f.prefs.listRules();
  assert.equal(rules.length, 1); assert.equal(rules[0].model, 'opus-4'); // upserted, not duplicated
});

test('prefs: project-scoped rules are distinct from owner-scoped', async t => {
  const f = await fixture(t);
  await f.prefs.saveRule({ taskClass: 'coding', provider: 'claude', model: 'a', scope: 'owner' });
  await f.prefs.saveRule({ taskClass: 'coding', provider: 'claude', model: 'b', scope: 'project', projectRef: 'proj-1' });
  const rules = await f.prefs.listRules();
  assert.equal(rules.length, 2);
});

test('prefs: removeRule removes exact match', async t => {
  const f = await fixture(t);
  await f.prefs.saveRule({ taskClass: 'coding', provider: 'claude', model: 'a', scope: 'owner' });
  assert.ok(await f.prefs.removeRule('coding', 'claude', 'owner', null));
  assert.equal((await f.prefs.listRules()).length, 0);
  assert.ok(!await f.prefs.removeRule('coding', 'claude', 'owner', null)); // already removed
});

test('prefs: routerInputs filters disabled rules', async t => {
  const f = await fixture(t);
  await f.prefs.saveRule({ taskClass: 'coding', provider: 'claude', model: 'a', scope: 'owner', enabled: true });
  await f.prefs.saveRule({ taskClass: 'writing', provider: 'zai', model: 'b', scope: 'owner', enabled: false });
  const inputs = await f.prefs.routerInputs();
  assert.equal(inputs.ownerRules.length, 1); assert.equal(inputs.ownerRules[0].taskClass, 'coding');
});

test('prefs: recordOutcome updates sampleCount and successRate', async t => {
  const f = await fixture(t);
  const r1 = await f.prefs.recordOutcome({ provider: 'claude', model: 'sonnet-4', taskClass: 'coding', success: true });
  assert.equal(r1.sampleCount, 1); assert.equal(r1.successRate, 1);
  const r2 = await f.prefs.recordOutcome({ provider: 'claude', model: 'sonnet-4', taskClass: 'coding', success: false });
  assert.equal(r2.sampleCount, 2); assert.equal(r2.successRate, 0.5);
  const r3 = await f.prefs.recordOutcome({ provider: 'claude', model: 'sonnet-4', taskClass: 'coding', success: true });
  assert.equal(r3.sampleCount, 3); assert.equal(r3.successRate, 2 / 3);
  const learned = await f.prefs.listLearned();
  assert.equal(learned.length, 1);
});

test('prefs: validation rejects invalid inputs', async t => {
  const f = await fixture(t);
  await assert.rejects(f.prefs.saveRule({ taskClass: 'not-a-task', provider: 'claude' }), /PREFS_TASK_INVALID/);
  await assert.rejects(f.prefs.saveRule({ taskClass: 'coding', provider: 'bad provider!' }), /PREFS_PROVIDER_INVALID/);
  await assert.rejects(f.prefs.saveRule({ taskClass: 'coding', provider: 'claude', scope: 'galaxy' }), /PREFS_SCOPE_INVALID/);
  await assert.rejects(f.prefs.saveRule({ taskClass: 'coding', provider: 'claude', scope: 'project' }), /PREFS_PROJECT_INVALID/);
  await assert.rejects(f.prefs.recordOutcome({ provider: 'claude', model: 'm', taskClass: 'coding', success: 'yes' }), /PREFS_OUTCOME_INVALID/);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

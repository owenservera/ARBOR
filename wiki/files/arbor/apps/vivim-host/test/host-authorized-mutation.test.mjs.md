# File: apps/vivim-host/test/host-authorized-mutation.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/host-authorized-mutation.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8640 B |
| Lines | 145 |
| Hash | f2db00917979 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DESKTOP | const | 16 | no | const DESKTOP = { channel: &#39;desktop-owner-token&#39;, actor: &#39;owner&#39; }; |
| fixture | function | 18 | no | function fixture(t, { catalog: providedCatalog = null } = {}) { |
| dataRoot | const | 19 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-authorized-mutation-&#39;)); |
| runtime | const | 20 | no | const runtime = createBootstrapRuntime({ dataRoot, file: &#39;:memory:&#39;, now: () =&gt; new Date().toISOString() }); |
| catalog | const | 22 | no | const catalog = providedCatalog ?? loadControlCatalog(); |
| control | const | 23 | no | const control = createControlDispatcher({ dataRoot, runtime, catalog }); |
| planDir | function | 28 | no | const planDir = dataRoot =&gt; path.join(dataRoot, &#39;control&#39;, &#39;plans&#39;); |
| journalSuffixes | const | 29 | no | const journalSuffixes = [&#39;.plan.json&#39;, &#39;.approved.json&#39;, &#39;.claimed&#39;, &#39;.receipt.json&#39;]; |
| journalArtifacts | function | 32 | no | function journalArtifacts(dataRoot, planId) { |
| events | function | 37 | no | function events(dataRoot) { |
| spyExecutor | function | 42 | no | function spyExecutor(runtime, actionId, args) { |
| original | const | 43 | no | const original = runtime[actionId === &#39;ui.theme.set_preset&#39; ? &#39;choosePreset&#39; : &#39;setHardNo&#39;]; |
| calls | const | 44 | no | const calls = []; |
| before | const | 55 | no | const before = runtime.projection().revision; |
| calls | const | 56 | no | const calls = spyExecutor(runtime, &#39;ui.theme.set_preset&#39;, { preset: &#39;ember&#39; }); |
| plan | const | 57 | no | const plan = control.plan({ text: &#39;set my theme to ember&#39; }, { source: &#39;desktop&#39; }); |
| eventsBefore | const | 62 | no | const eventsBefore = events(dataRoot).length; |
| receipt | const | 63 | no | const receipt = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP }); |
| calls | const | 78 | no | const calls = spyExecutor(runtime, &#39;ui.theme.set_preset&#39;, { preset: &#39;dusk&#39; }); |
| plan | const | 79 | no | const plan = control.plan({ text: &#39;set theme to dusk&#39; }, { source: &#39;desktop&#39; }); |
| first | const | 80 | no | const first = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP }); |
| eventsAfterFirst | const | 81 | no | const eventsAfterFirst = events(dataRoot); |
| again | const | 82 | no | const again = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP }); |
| before | const | 96 | no | const before = runtime.projection().preset; |
| plan | const | 97 | no | const plan = control.plan({ text: &#39;set theme to grove&#39; }, { source: &#39;desktop&#39; }); |
| before | const | 110 | no | const before = runtime.projection().preset; |
| calls | const | 111 | no | const calls = spyExecutor(runtime, &#39;ui.theme.set_preset&#39;, { preset: &#39;ink&#39; }); |
| plan | const | 112 | no | const plan = control.plan({ text: &#39;set theme to ink&#39; }, { source: &#39;desktop&#39; }); |
| before | const | 130 | no | const before = runtime.projection().preset; |
| plan | const | 131 | no | const plan = control.plan({ text: &#39;set theme to dawn&#39; }, { source: &#39;desktop&#39; }); |
| dir | const | 132 | no | const dir = planDir(dataRoot); |
| beforeFiles | const | 133 | no | const beforeFiles = readdirSync(dir).slice().sort(); |
| planFile | const | 137 | no | const planFile = path.join(dir, plan.planId + &#39;.plan.json&#39;); |
| stored | const | 138 | no | const stored = JSON.parse(readFileSync(planFile, &#39;utf8&#39;)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 5 | external |
| node:assert/strict | import | 6 | external |
| node:fs | import | 7 | external |
| node:os | import | 8 | external |
| node:path | import | 9 | external |
| ../bootstrap/runtime.mjs | import | 10 | [apps/vivim-host/bootstrap/runtime.mjs](../bootstrap/runtime.mjs.md) |
| node:crypto | import | 11 | external |
| node:fs | import | 12 | external |
| ../control/dispatcher.mjs | import | 13 | [apps/vivim-host/control/dispatcher.mjs](../control/dispatcher.mjs.md) |
| ../control/intent-planner.mjs | import | 14 | [apps/vivim-host/control/intent-planner.mjs](../control/intent-planner.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Host authorized mutation (UTC03). An approved preview binds to the single
// revision-checked mutation path in control/dispatcher.mjs: an approved edit
// commits exactly once and journals exactly once; stale revision, unapproved and
// replayed attempts cannot mutate.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { createControlDispatcher } from '../control/dispatcher.mjs';
import { loadControlCatalog } from '../control/intent-planner.mjs';

const DESKTOP = { channel: 'desktop-owner-token', actor: 'owner' };

function fixture(t, { catalog: providedCatalog = null } = {}) {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-authorized-mutation-'));
  const runtime = createBootstrapRuntime({ dataRoot, file: ':memory:', now: () => new Date().toISOString() });
  runtime.grantBootstrap({ scope: 'full-bootstrap' });
  const catalog = providedCatalog ?? loadControlCatalog();
  const control = createControlDispatcher({ dataRoot, runtime, catalog });
  t.after(() => { runtime.close(); rmSync(dataRoot, { recursive: true, force: true }); });
  return { dataRoot, runtime, catalog, control };
}

const planDir = dataRoot => path.join(dataRoot, 'control', 'plans');
const journalSuffixes = ['.plan.json', '.approved.json', '.claimed', '.receipt.json'];

/** Exactly one journal artifact per transition; a second write must never appear. */
function journalArtifacts(dataRoot, planId) {
  return Object.fromEntries(journalSuffixes.map(suffix => [suffix,
    readdirSync(planDir(dataRoot)).filter(f => f === planId + suffix).length]));
}

function events(dataRoot) {
  return readFileSync(path.join(dataRoot, 'control', 'events.jsonl'), 'utf8').trim().split('\n').filter(Boolean);
}

/** Spy on the Host executor entry point; the dispatcher must route through it once. */
function spyExecutor(runtime, actionId, args) {
  const original = runtime[actionId === 'ui.theme.set_preset' ? 'choosePreset' : 'setHardNo'];
  const calls = [];
  runtime[actionId === 'ui.theme.set_preset' ? 'choosePreset' : 'setHardNo'] = spyArgs => {
    calls.push(spyArgs);
    return original(spyArgs);
  };
  void args;
  return calls;
}

test('an approved edit commits exactly once and journals exactly once through the existing path', t => {
  const { dataRoot, runtime, control } = fixture(t);
  const before = runtime.projection().revision;
  const calls = spyExecutor(runtime, 'ui.theme.set_preset', { preset: 'ember' });
  const plan = control.plan({ text: 'set my theme to ember' }, { source: 'desktop' });
  assert.equal(plan.outcome, 'approval_required');
  // Preview alone journals the plan record only — one artifact, no commit.
  assert.deepEqual(journalArtifacts(dataRoot, plan.planId), {
    '.plan.json': 1, '.approved.json': 0, '.claimed': 0, '.receipt.json': 0 });
  const eventsBefore = events(dataRoot).length;
  const receipt = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP });
  assert.equal(receipt.status, 'applied');
  assert.equal(receipt.executionPerformed, true);
  assert.equal(calls.length, 1, 'executor ran exactly once');
  assert.equal(runtime.projection().preset, 'ember');
  assert.notEqual(runtime.projection().revision, before, 'the edit committed');
  // One commit ⇒ one approval, one claim, one receipt, one bounded event trail.
  assert.deepEqual(journalArtifacts(dataRoot, plan.planId), {
    '.plan.json': 1, '.approved.json': 1, '.claimed': 1, '.receipt.json': 1 });
  assert.equal(events(dataRoot).length - eventsBefore, 3, 'planned already journaled; approved+claimed+applied appended');
  assert.equal(control.recent().filter(r => r.planId === plan.planId).length, 1);
});

test('a replayed attempt returns the receipt and never commits or journals a second mutation', t => {
  const { dataRoot, runtime, control } = fixture(t);
  const calls = spyExecutor(runtime, 'ui.theme.set_preset', { preset: 'dusk' });
  const plan = control.plan({ text: 'set theme to dusk' }, { source: 'desktop' });
  const first = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP });
```

_First 80 of 145 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

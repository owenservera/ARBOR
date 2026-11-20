# File: apps/vivim-host/test/control-intent-planner.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/control-intent-planner.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5170 B |
| Lines | 77 |
| Hash | da5b8a0f0b82 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| planner | const | 6 | no | const planner = createControlPlanner(), catalog = planner.describe(); |
| p | const | 15 | no | const p = createControlPlanner().planText(&#39;Set my theme to dusk&#39;); |
| p | const | 25 | no | const p = createControlPlanner().planText(&#39;make me a private workspace&#39;); |
| planner | const | 30 | no | const planner = createControlPlanner(); |
| p | const | 31 | no | const p = planner.planText(&#39;Stop all traffic&#39;); |
| q | const | 35 | no | const q = planner.planText(&#39;Pause all VIVIM traffic&#39;); |
| p | const | 40 | no | const p = createControlPlanner(); |
| read | const | 47 | no | const read = p.planCandidate({ actionId: &#39;ui.theme.show&#39;, args: {}, rationale: &#39;user asked&#39;, uncertainty: 0.2 }); |
| base | const | 52 | no | const base = { schema: &#39;vivim.control-action-catalog/1&#39;, actions: [{ |
| pack | const | 73 | no | const pack = createControlPlanner().languagePack(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../control/intent-planner.mjs | import | 3 | [apps/vivim-host/control/intent-planner.mjs](../control/intent-planner.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createControlPlanner, validateControlCatalog, canonicalRisk, loadControlCatalog } from '../control/intent-planner.mjs';

test('catalogue exposes the text, mobile and desktop path and never claims live acceptance', () => {
  const planner = createControlPlanner(), catalog = planner.describe();
  assert.equal(catalog.status, 'plan_and_dispatch');
  assert.ok(catalog.actions.length >= 19, 'current action coverage must not regress below the 19-action baseline');
  assert.ok(catalog.actions.every(x => x.surfaces.includes('text') && x.surfaces.includes('mobile') && x.surfaces.includes('desktop')));
  assert.ok(catalog.actions.every(x => x.available === false && x.liveAcceptance === 'pending'), 'no action is live-verified yet');
  assert.ok(catalog.actions.find(x => x.actionId === 'ui.theme.set_preset').executable);
  assert.equal(catalog.actions.find(x => x.actionId === 'machine.network.disable_all').executable, false);
});
test('exact deterministic theme intent becomes a typed plan needing approval, never an effect', () => {
  const p = createControlPlanner().planText('Set my theme to dusk');
  assert.equal(p.actionId, 'ui.theme.set_preset');
  assert.deepEqual(p.args, { preset: 'dusk' });
  assert.equal(p.outcome, 'approval_required');
  assert.equal(p.requiresApproval, true);
  assert.equal(p.executionPerformed, false);
  assert.equal(p.origin, 'deterministic');
  assert.equal(p.language.feedback.status, 'ok');
});
test('unknown language routes to AI candidate only, not execution', () => {
  const p = createControlPlanner().planText('make me a private workspace');
  assert.equal(p.outcome, 'interpretation_required');
  assert.equal(p.executionPerformed, false);
});
test('stop all traffic is ambiguous and cannot sever phone connection', () => {
  const planner = createControlPlanner();
  const p = planner.planText('Stop all traffic');
  assert.equal(p.outcome, 'clarification_required');
  assert.ok(p.choices.includes('machine.network.disable_all'));
  assert.equal(p.risk, 'R3');
  const q = planner.planText('Pause all VIVIM traffic');
  assert.equal(q.actionId, 'vivim.network.pause_egress');
  assert.equal(q.outcome, 'unavailable');
});
test('AI candidates are only validated typed plans, with no privilege escalation', () => {
  const p = createControlPlanner();
  assert.throws(() => p.planTyped({ actionId: 'ui.theme.set_preset', args: { preset: 'dusk', shell: 'shutdown' } }), /CONTROL_ARGS_INVALID/);
  assert.throws(() => p.planTyped({ actionId: 'machine.network.disable_all', args: { force: true } }), /CONTROL_ARGS_INVALID/);
  assert.throws(() => p.planTyped({ actionId: 'x.shell', args: { cmd: 'anything' } }), /CONTROL_ACTION_UNKNOWN/);
  assert.equal(p.planTyped({ actionId: 'machine.network.disable_all' }).executionPerformed, false);
  assert.throws(() => p.planCandidate({ actionId: 'ui.theme.set_preset', args: { preset: 'dusk' }, grant: 'owner' }), /CONTROL_CANDIDATE_INVALID/);
  assert.throws(() => p.planCandidate({ actionId: 'control.lexicon.teach', args: { word: 'zap', action: 'ui.theme.undo' } }), /CONTROL_CANDIDATE_REFUSED/);
  const read = p.planCandidate({ actionId: 'ui.theme.show', args: {}, rationale: 'user asked', uncertainty: 0.2 });
  assert.equal(read.origin, 'ai_candidate');
  assert.equal(read.outcome, 'approval_required', 'even a read proposed by a model waits for the owner');
});
test('catalogue rejects a UI-only action, a false executor, and an executable R3', () => {
  const base = { schema: 'vivim.control-action-catalog/1', actions: [{
    id: 'ui.example', owner: 'host', args: {}, readiness: 'verified', risk: 'R1', examples: ['Example'],
    surfaces: ['desktop', 'visual'], executor: null }] };
  assert.throws(() => validateControlCatalog(base), /CONTROL_CATALOG_INVALID/);
  base.actions[0].surfaces = ['text', 'desktop', 'mobile', 'visual'];
  assert.throws(() => validateControlCatalog(base), /CONTROL_CATALOG_INVALID/);
  base.actions[0].executor = 'x.mjs:y'; base.actions[0].risk = 'R3'; base.actions[0].readiness = 'source_wired';
  assert.throws(() => validateControlCatalog(base), /CONTROL_CATALOG_INVALID/);
  base.actions[0].risk = 'R1';
  assert.equal(validateControlCatalog(base), base);
  base.actions[0].language = { verbs: ['Bad Verb'] };
  assert.throws(() => validateControlCatalog(base), /CONTROL_CATALOG_INVALID/);
});
test('one canonical risk scale maps every legacy vocabulary', () => {
  assert.equal(canonicalRisk('R2_SENSITIVE'), 'R2');
  assert.equal(canonicalRisk('external_communication'), 'R3');
  assert.equal(canonicalRisk('MUTATION'), 'R1');
  assert.equal(canonicalRisk('R0'), 'R0');
  assert.throws(() => canonicalRisk('whatever'), /CONTROL_RISK_UNKNOWN/);
});
test('language pack exposes language metadata but no executor locations', () => {
  const pack = createControlPlanner().languagePack();
  assert.equal(pack.catalog.actions.length, loadControlCatalog().actions.length);
  assert.ok(pack.catalog.actions.every(a => !('executor' in a)));
  assert.ok(pack.world.frames.length > 0);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

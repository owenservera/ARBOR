# File: apps/vivim-host/test/personal-semantics-integration.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/personal-semantics-integration.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5243 B |
| Lines | 91 |
| Hash | de41f3d34ce3 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| catalog | const | 7 | no | const catalog = loadControlCatalog(); |
| phrase | const | 8 | no | const phrase = &#39;quazzlememo&#39;; // intentionally outside the built-in NLCL vocabulary |
| rule | function | 9 | no | const rule = (overrides = {}) =&gt; ({ schema: PERSONAL_RULE_SCHEMA, id: &#39;rule:quazzlememo&#39;, revision: 1, phrase, actionId: &#39;ui.theme.set_preset&#39;, args: { preset: &#39;dusk&#39; }, scope: {}, state: &#39;accepted&#39;,… |
| planner | function | 15 | no | const planner = rules =&gt; createControlPlanner({ catalog, personalRules: () =&gt; rules }); |
| p | const | 19 | no | const p = planner([rule()]).planText(phrase); |
| p | const | 28 | no | const p = planner([rule()]); |
| plan | const | 29 | no | const plan = p.planText(phrase); |
| intent | const | 30 | no | const intent = p.interpretCommand(phrase); |
| p | const | 37 | no | const p = planner([rule()]); |
| stale | const | 44 | no | const stale = planner([rule({catalogVersion:catalog.version-1})]); |
| conflicting | const | 47 | no | const conflicting = planner([rule(),rule({id:&#39;rule:other&#39;,args:{preset:&#39;dawn&#39;}})]); |
| conventional | const | 52 | no | const conventional = planner([]).validateCommandCandidate(&#39;Set my theme to dusk&#39;, { actionId:&#39;ui.theme.set_preset&#39;, args:{preset:&#39;dawn&#39;} }); |
| learned | const | 56 | no | const learned = planner([rule()]).validateCommandCandidate(phrase, { actionId:&#39;ui.theme.set_preset&#39;, args:{preset:&#39;dawn&#39;} }); |
| p | const | 62 | no | const p = planner([rule()]); |
| scoped | const | 64 | no | const scoped = planner([rule({scope:{surface:&#39;desktop&#39;}})]); |
| scope | variable | 70 | no | let scope={workspaceId:&#39;project-a&#39;}; |
| p | const | 71 | no | const p=createControlPlanner({catalog,personalRules:()=&gt;[ rule({scope:{workspaceId:&#39;project-a&#39;}})],commandScope:()=&gt;scope}); |
| w | const | 80 | no | const w=planner([]).world(); |
| fake | const | 81 | no | const fake={outcome:&#39;candidate&#39;,candidate:{actionId:&#39;ui.theme.set_preset&#39;,args:{preset:&#39;dusk&#39;}}, |
| result | const | 83 | no | const result=toCommandIntent({text:phrase,scope:&#39;text&#39;}, {catalog,world:w,meaning:fake}); |
| p | const | 88 | no | const p=createControlPlanner({catalog,personalRules:()=&gt;[rule()], commandScope:()=&gt;({permission:&#39;owner&#39;})}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../control/intent-planner.mjs | import | 3 | [apps/vivim-host/control/intent-planner.mjs](../control/intent-planner.mjs.md) |
| ../control/personal-semantics.mjs | import | 4 | [apps/vivim-host/control/personal-semantics.mjs](../control/personal-semantics.mjs.md) |
| ../control/command-intent.mjs | import | 5 | [apps/vivim-host/control/command-intent.mjs](../control/command-intent.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createControlPlanner, loadControlCatalog } from '../control/intent-planner.mjs';
import { PERSONAL_RULE_SCHEMA } from '../control/personal-semantics.mjs';
import { toCommandIntent } from '../control/command-intent.mjs';

const catalog = loadControlCatalog();
const phrase = 'quazzlememo'; // intentionally outside the built-in NLCL vocabulary
const rule = (overrides = {}) => ({
  schema: PERSONAL_RULE_SCHEMA, id: 'rule:quazzlememo', revision: 1,
  phrase, actionId: 'ui.theme.set_preset', args: { preset: 'dusk' },
  scope: {}, state: 'accepted', source: 'explicit-owner',
  catalogVersion: catalog.version, ...overrides,
});
const planner = rules => createControlPlanner({ catalog, personalRules: () => rules });

test('personal phrase only fills a baseline parser gap; preserves Host approval', () => {
  assert.equal(planner([]).planText(phrase).outcome, 'interpretation_required');
  const p = planner([rule()]).planText(phrase);
  assert.equal(p.actionId, 'ui.theme.set_preset');
  assert.deepEqual(p.args, { preset: 'dusk' });
  assert.equal(p.origin, 'personal_rule');
  assert.equal(p.outcome, 'approval_required');
  assert.equal(p.executionPerformed, false);
  assert.equal(p.language.personalRule.ruleId, 'rule:quazzlememo');
});
test('command-intent and planText agree on personalized phrase', () => {
  const p = planner([rule()]);
  const plan = p.planText(phrase);
  const intent = p.interpretCommand(phrase);
  assert.equal(intent.outcome, 'candidate');
  assert.equal(intent.actionId, plan.actionId);
  assert.deepEqual(intent.args, plan.args);
  assert.equal(intent.provenance.method, 'accepted-personal-rule');
});
test('original syntax guard and canonical grammar take priority', () => {
  const p = planner([rule()]);
  assert.equal(p.planText("don't "+phrase).outcome, 'refused');
  assert.equal(p.planText(phrase+' and send it').outcome, 'clarification_required');
  assert.equal(p.planText('Set my theme to dawn').origin, 'deterministic');
});
test('not accepted, stale and conflicting rules fail closed across both views', () => {
  assert.equal(planner([rule({state:'proposed'})]).planText(phrase).outcome, 'interpretation_required');
  const stale = planner([rule({catalogVersion:catalog.version-1})]);
  assert.equal(stale.planText(phrase).outcome, 'refused');
  assert.equal(stale.interpretCommand(phrase).outcome, 'refused');
  const conflicting = planner([rule(),rule({id:'rule:other',args:{preset:'dawn'}})]);
  assert.equal(conflicting.planText(phrase).outcome, 'clarification_required');
  assert.equal(conflicting.interpretCommand(phrase).outcome, 'clarification_required');
});
test('AI proposal cannot change args from a deterministic or personal reading', () => {
  const conventional = planner([]).validateCommandCandidate('Set my theme to dusk',
    { actionId:'ui.theme.set_preset', args:{preset:'dawn'} });
  assert.equal(conventional.outcome, 'refused');
  assert.equal(conventional.refusal.code, 'CONFLICTING_ARGUMENTS');
  const learned = planner([rule()]).validateCommandCandidate(phrase,
    { actionId:'ui.theme.set_preset', args:{preset:'dawn'} });
  assert.equal(learned.outcome, 'refused');
  assert.equal(learned.refusal.code, 'CONFLICTING_ARGUMENTS');
});
test('same accepted rules compile across surfaces unless explicitly scoped', () => {
  const p = planner([rule()]);
  assert.deepEqual(p.planText(phrase,{source:'desktop'}).args, p.planText(phrase,{source:'mobile'}).args);
  const scoped = planner([rule({scope:{surface:'desktop'}})]);
  assert.equal(scoped.planText(phrase,{source:'desktop'}).outcome,'approval_required');
  assert.equal(scoped.planText(phrase,{source:'mobile'}).outcome,'interpretation_required');
});

test('trusted Host workspace scope applies without accepting scope from owner text', () => {
  let scope={workspaceId:'project-a'};
  const p=createControlPlanner({catalog,personalRules:()=>[
    rule({scope:{workspaceId:'project-a'}})],commandScope:()=>scope});
  assert.equal(p.planText(phrase,{source:'desktop'}).outcome,'approval_required');
  assert.equal(p.interpretCommand(phrase,{source:'desktop'}).outcome,'candidate');
  scope={workspaceId:'project-b'};
  assert.equal(p.planText(phrase,{source:'desktop'}).outcome,'interpretation_required');
  assert.equal(p.interpretCommand(phrase,{source:'desktop'}).outcome,'interpretation_required');
});
test('direct command-intent input cannot forge an already-accepted meaning',()=>{
  const w=planner([]).world();
```

_First 80 of 92 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

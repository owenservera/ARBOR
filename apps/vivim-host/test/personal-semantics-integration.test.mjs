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
  const fake={outcome:'candidate',candidate:{actionId:'ui.theme.set_preset',args:{preset:'dusk'}},
    provenance:{method:'accepted-personal-rule',ruleId:'rule:forged',ruleRevision:1}};
  const result=toCommandIntent({text:phrase,scope:'text'},
    {catalog,world:w,meaning:fake});
  assert.equal(result.outcome,'interpretation_required');
});
test('untrusted scope shape fails closed rather than leaking personal meaning',()=>{
  const p=createControlPlanner({catalog,personalRules:()=>[rule()],
    commandScope:()=>({permission:'owner'})});
  assert.throws(()=>p.planText(phrase),/CONTROL_SEMANTIC_SCOPE_INVALID/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createControlDispatcher } from '../control/dispatcher.mjs';
import { createPersonalRuleStore } from '../control/personal-rule-store.mjs';
import { loadControlCatalog } from '../control/intent-planner.mjs';

const DESKTOP={channel:'desktop-owner-token',actor:'owner'};
const phrase='quazzlememo';
function fixture(t) {
  const dataRoot=mkdtempSync(path.join(os.tmpdir(),'vivim-laneb-host-'));
  const runtime=createBootstrapRuntime({dataRoot,file:':memory:'});
  runtime.grantBootstrap({scope:'full-bootstrap'});
  const catalog=loadControlCatalog();
  // Synthetic owner proof is TEST-ONLY; production store's default denies acceptance.
  const store=createPersonalRuleStore({dataRoot,catalog,
    verifyOwnerApproval:(approval,subject)=>approval?.fixtureOwner===true &&
      subject.ruleId===approval.ruleId && subject.nextState===approval.nextState});
  const first=store.propose({phrase,actionId:'ui.theme.set_preset',
    args:{preset:'dusk'},scope:{workspaceId:'project-a'},
    source:'explicit-owner',expectedVersion:0});
  store.transition({ruleId:first.ruleId,nextState:'accepted',expectedVersion:1,
    approval:{fixtureOwner:true,ruleId:first.ruleId,nextState:'accepted'}});
  let workspaceId='project-a';
  const control=createControlDispatcher({dataRoot,runtime,catalog,
    commandScope:()=>({workspaceId})});
  t.after(()=>{runtime.close();rmSync(dataRoot,{recursive:true,force:true});});
  return {control,store,runtime,first,setWorkspace:id=>{workspaceId=id}};
}
test('Host plans accepted personal scope and executes only after normal owner approval',t=>{
  const {control,runtime}=fixture(t);
  const before=runtime.projection().preset;
  const plan=control.plan({text:phrase},{source:'desktop'});
  assert.equal(plan.outcome,'approval_required');
  assert.equal(plan.origin,'personal_rule');
  assert.equal(runtime.projection().preset,before);
  const receipt=control.execute({planId:plan.planId,planDigest:plan.planDigest,approval:DESKTOP});
  assert.equal(receipt.status,'applied');
  assert.equal(receipt.result.preset,'dusk');
});
test('Host refuses execution if a rule is suspended after a plan was approved',t=>{
  const {control,store,first}=fixture(t);
  const plan=control.plan({text:phrase},{source:'desktop'});
  store.transition({ruleId:first.ruleId,nextState:'suspended',expectedVersion:2,
    approval:{fixtureOwner:true,ruleId:first.ruleId,nextState:'suspended'}});
  assert.throws(()=>control.execute({planId:plan.planId,planDigest:plan.planDigest,
    approval:DESKTOP}),/CONTROL_SEMANTIC_RULE_STALE/);
  assert.equal(control.status(plan.planId).state,'planned');
});
test('Host refuses execution if active semantic context changes',t=>{
  const {control,setWorkspace}=fixture(t);
  const plan=control.plan({text:phrase},{source:'desktop'});
  setWorkspace('project-b');
  assert.throws(()=>control.execute({planId:plan.planId,planDigest:plan.planDigest,
    approval:DESKTOP}),/CONTROL_SEMANTIC_CONTEXT_STALE/);
});
test('unknown workspace never activates a scoped personal command',t=>{
  const {control,setWorkspace}=fixture(t);
  setWorkspace('project-b');
  assert.equal(control.plan({text:phrase},{source:'desktop'}).outcome,'interpretation_required');
});

test('desktop owner explicitly teaches, replaces, reuses and revokes a real typed command',t=>{
  const dataRoot=mkdtempSync(path.join(os.tmpdir(),'vivim-live-teaching-'));
  const runtime=createBootstrapRuntime({dataRoot,file:':memory:'});
  runtime.grantBootstrap({scope:'full-bootstrap'});
  t.after(()=>{runtime.close();rmSync(dataRoot,{recursive:true,force:true});});
  const make=()=>createControlDispatcher({dataRoot,runtime});
  let c=make();
  const owner={source:'desktop',actor:'desktop-owner'};
  const approve={channel:'desktop-owner-token',actor:'desktop-owner'};
  const learn=(phrase,command)=>c.plan({actionId:'control.rule.remember',args:{phrase,command}},owner);
  const run=(p,approval=approve)=>c.execute({planId:p.planId,planDigest:p.planDigest,approval});
  const word='quazzlememo';
  const before=runtime.projection().preset;
  assert.equal(c.plan({text:word},owner).outcome,'interpretation_required');
  const teach=learn(word,'Set my theme to dusk');
  assert.equal(teach.outcome,'approval_required');
  assert.deepEqual(teach.learningPreview.after.args,{preset:'dusk'});
  assert.equal(teach.learningPreview.after.actionId,'ui.theme.set_preset');
  assert.equal(c.ownerRules().version,0);
  assert.equal(runtime.projection().preset,before);
  assert.throws(()=>run(teach,{channel:'direct-phone',actor:'phone'}),/CONTROL_DESKTOP_APPROVAL_REQUIRED/);
  assert.throws(()=>c.status(teach.planId,{source:'mobile'}),/CONTROL_PLAN_UNKNOWN/);
  assert.equal(c.plan({actionId:'control.rule.remember',args:{phrase:'private phrase',command:'Set my theme to dusk'}},{source:'mobile'}).outcome,'unavailable');
  const saved=run(teach);
  assert.equal(saved.status,'applied');
  assert.equal(saved.result.state,'accepted');
  assert.equal(runtime.projection().preset,before);
  assert.equal(run(teach).replayed,true);
  assert.equal(c.ownerRules().version,1);
  assert.throws(()=>run(teach,{channel:'direct-phone',actor:'phone'}),/CONTROL_DESKTOP_APPROVAL_REQUIRED/);
  c=make();
  const learned=c.plan({text:word.toUpperCase()},owner);
  assert.equal(learned.origin,'personal_rule');
  assert.equal(learned.outcome,'approval_required');
  assert.equal(learned.language.personalRule.ruleId,saved.result.ruleId);
  assert.equal(c.plan({text:word},{source:'mobile'}).outcome,'interpretation_required');
  assert.equal(runtime.projection().preset,before);
  const replacement=learn(word,'Set my theme to dawn');
  const competing=learn('quazzleother','Set my theme to dusk');
  assert.equal(run(replacement).status,'applied');
  assert.throws(()=>run(competing),/CONTROL_RULE_STALE/);
  assert.throws(()=>run(learned),/CONTROL_SEMANTIC_RULE_STALE/);
  const reused=c.plan({text:word},owner);
  assert.equal(reused.args.preset,'dawn');
  assert.equal(run(reused).status,'applied');
  assert.equal(runtime.projection().preset,'dawn');
  const revoke=c.plan({actionId:'control.rule.revoke',args:{rule_id:saved.result.ruleId}},owner);
  assert.equal(run(revoke).status,'applied');
  assert.equal(c.ownerRules().entries[0].state,'revoked');
  assert.equal(c.plan({text:word},owner).outcome,'interpretation_required');
  for(const [phrase,command] of [['open Wiki','Set my theme to dusk'],["don't quazzlememo",'Set my theme to dusk'],['quazzlememo','Stop all traffic']]){
    assert.throws(()=>learn(phrase,command),/CONTROL_RULE_(PHRASE_NOT_FREE|TARGET_INVALID)/);
  }
});

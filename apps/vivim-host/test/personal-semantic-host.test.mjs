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

# File: apps/vivim-host/test/personal-semantic-host.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/personal-semantic-host.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6949 B |
| Lines | 119 |
| Hash | 6b75fcd32a44 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DESKTOP | const | 11 | no | const DESKTOP={channel:&#39;desktop-owner-token&#39;,actor:&#39;owner&#39;}; |
| phrase | const | 12 | no | const phrase=&#39;quazzlememo&#39;; |
| fixture | function | 13 | no | function fixture(t) { |
| dataRoot | const | 14 | no | const dataRoot=mkdtempSync(path.join(os.tmpdir(),&#39;vivim-laneb-host-&#39;)); |
| runtime | const | 15 | no | const runtime=createBootstrapRuntime({dataRoot,file:&#39;:memory:&#39;}); |
| catalog | const | 17 | no | const catalog=loadControlCatalog(); |
| store | const | 19 | no | const store=createPersonalRuleStore({dataRoot,catalog, verifyOwnerApproval:(approval,subject)=&gt;approval?.fixtureOwner===true &amp;&amp; subject.ruleId===approval.ruleId &amp;&amp; subject.nextState===approval.nextSt… |
| first | const | 22 | no | const first=store.propose({phrase,actionId:&#39;ui.theme.set_preset&#39;, args:{preset:&#39;dusk&#39;},scope:{workspaceId:&#39;project-a&#39;}, source:&#39;explicit-owner&#39;,expectedVersion:0}); |
| workspaceId | variable | 27 | no | let workspaceId=&#39;project-a&#39;; |
| control | const | 28 | no | const control=createControlDispatcher({dataRoot,runtime,catalog, commandScope:()=&gt;({workspaceId})}); |
| before | const | 35 | no | const before=runtime.projection().preset; |
| plan | const | 36 | no | const plan=control.plan({text:phrase},{source:&#39;desktop&#39;}); |
| receipt | const | 40 | no | const receipt=control.execute({planId:plan.planId,planDigest:plan.planDigest,approval:DESKTOP}); |
| plan | const | 46 | no | const plan=control.plan({text:phrase},{source:&#39;desktop&#39;}); |
| plan | const | 55 | no | const plan=control.plan({text:phrase},{source:&#39;desktop&#39;}); |
| dataRoot | const | 67 | no | const dataRoot=mkdtempSync(path.join(os.tmpdir(),&#39;vivim-live-teaching-&#39;)); |
| runtime | const | 68 | no | const runtime=createBootstrapRuntime({dataRoot,file:&#39;:memory:&#39;}); |
| make | function | 71 | no | const make=()=&gt;createControlDispatcher({dataRoot,runtime}); |
| c | variable | 72 | no | let c=make(); |
| owner | const | 73 | no | const owner={source:&#39;desktop&#39;,actor:&#39;desktop-owner&#39;}; |
| approve | const | 74 | no | const approve={channel:&#39;desktop-owner-token&#39;,actor:&#39;desktop-owner&#39;}; |
| learn | function | 75 | no | const learn=(phrase,command)=&gt;c.plan({actionId:&#39;control.rule.remember&#39;,args:{phrase,command}},owner); |
| run | function | 76 | no | const run=(p,approval=approve)=&gt;c.execute({planId:p.planId,planDigest:p.planDigest,approval}); |
| word | const | 77 | no | const word=&#39;quazzlememo&#39;; |
| before | const | 78 | no | const before=runtime.projection().preset; |
| teach | const | 80 | no | const teach=learn(word,&#39;Set my theme to dusk&#39;); |
| saved | const | 89 | no | const saved=run(teach); |
| learned | const | 97 | no | const learned=c.plan({text:word.toUpperCase()},owner); |
| replacement | const | 103 | no | const replacement=learn(word,&#39;Set my theme to dawn&#39;); |
| competing | const | 104 | no | const competing=learn(&#39;quazzleother&#39;,&#39;Set my theme to dusk&#39;); |
| reused | const | 108 | no | const reused=c.plan({text:word},owner); |
| revoke | const | 112 | no | const revoke=c.plan({actionId:&#39;control.rule.revoke&#39;,args:{rule_id:saved.result.ruleId}},owner); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../bootstrap/runtime.mjs | import | 6 | [apps/vivim-host/bootstrap/runtime.mjs](../bootstrap/runtime.mjs.md) |
| ../control/dispatcher.mjs | import | 7 | [apps/vivim-host/control/dispatcher.mjs](../control/dispatcher.mjs.md) |
| ../control/personal-rule-store.mjs | import | 8 | [apps/vivim-host/control/personal-rule-store.mjs](../control/personal-rule-store.mjs.md) |
| ../control/intent-planner.mjs | import | 9 | [apps/vivim-host/control/intent-planner.mjs](../control/intent-planner.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 120 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

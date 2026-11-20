# File: apps/vivim-host/test/personal-rule-store.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/personal-rule-store.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5334 B |
| Lines | 97 |
| Hash | fdacfef491fd |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| catalog | const | 9 | no | const catalog = { version: 6, actions: [ |
| verify | function | 14 | no | const verify = (approval, expected) =&gt; |
| proposal | function | 17 | no | const proposal = version =&gt; ({phrase:&#39;quazzlememo&#39;,actionId:&#39;ui.theme.set_preset&#39;,args:{preset:&#39;dusk&#39;}, scope:{},expectedVersion:version,source:&#39;system-observed&#39;}); |
| withStore | function | 19 | no | const withStore = (t, verifier = verify) =&gt; { |
| dataRoot | const | 20 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(),&#39;vivim-personal-rules-&#39;)); |
| boundApproval | function | 24 | no | const boundApproval = (store,ruleId,nextState,extra={}) =&gt; { |
| state | const | 25 | no | const state = store.snapshot(); |
| rule | const | 26 | no | const rule = state.entries.find(r=&gt;r.id===ruleId); |
| ruleDigest | const | 27 | no | const ruleDigest = createHash(&#39;sha256&#39;).update(JSON.stringify(rule)).digest(&#39;hex&#39;); |
| proposed | const | 34 | no | const proposed=store.propose(proposal(0)); |
| p | const | 43 | no | const p=store.propose(proposal(0)); |
| p | const | 50 | no | const p=store.propose(proposal(0)); |
| accept | const | 51 | no | const accept=store.transition({ruleId:p.ruleId,nextState:&#39;accepted&#39;,expectedVersion:1, approval:boundApproval(store,p.ruleId,&#39;accepted&#39;)}); |
| suspend | const | 55 | no | const suspend=store.transition({ruleId:p.ruleId,nextState:&#39;suspended&#39;,expectedVersion:2, approval:boundApproval(store,p.ruleId,&#39;suspended&#39;)}); |
| rollback | const | 59 | no | const rollback=store.rollback({ruleId:p.ruleId,toRevision:2,expectedVersion:3, approval:boundApproval(store,p.ruleId,&#39;accepted&#39;)}); |
| revoke | const | 63 | no | const revoke=store.transition({ruleId:p.ruleId,nextState:&#39;revoked&#39;,expectedVersion:4, approval:boundApproval(store,p.ruleId,&#39;revoked&#39;)}); |
| p | const | 91 | no | const p=store.propose(proposal(0)); |
| reopened | const | 92 | no | const reopened=createPersonalRuleStore({dataRoot,catalog}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:crypto | import | 6 | external |
| ../control/personal-rule-store.mjs | import | 7 | [apps/vivim-host/control/personal-rule-store.mjs](../control/personal-rule-store.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createPersonalRuleStore } from '../control/personal-rule-store.mjs';

const catalog = { version: 6, actions: [
  { id: 'vivim.status.show', language: { verbs: ['status'] }, args: {} },
  { id: 'ui.theme.set_preset', language: { verbs: ['theme'] },
    args: { preset: { type:'enum', values:['dusk','dawn'] } } },
] };
const verify = (approval, expected) =>
  approval?.authority === 'test-owner' && approval?.subjectDigest === expected.ruleDigest &&
  approval?.nextState === expected.nextState && approval?.storeVersion === expected.storeVersion;
const proposal = version => ({phrase:'quazzlememo',actionId:'ui.theme.set_preset',args:{preset:'dusk'},
  scope:{},expectedVersion:version,source:'system-observed'});
const withStore = (t, verifier = verify) => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(),'vivim-personal-rules-'));
  t.after(() => rmSync(dataRoot,{recursive:true,force:true}));
  return {dataRoot, store:createPersonalRuleStore({dataRoot,catalog,verifyOwnerApproval:verifier})};
};
const boundApproval = (store,ruleId,nextState,extra={}) => {
  const state = store.snapshot();
  const rule = state.entries.find(r=>r.id===ruleId);
  const ruleDigest = createHash('sha256').update(JSON.stringify(rule)).digest('hex');
  return { authority:'test-owner', subjectDigest:ruleDigest,
    storeVersion:state.version,nextState,receiptId:'test-host-receipt', ...extra };
};
test('empty store is deterministic and private, proposals never become accepted',t=>{
  const {store}=withStore(t);
  assert.equal(store.snapshot().version,0);
  const proposed=store.propose(proposal(0));
  assert.equal(proposed.state,'proposed');
  assert.equal(store.snapshot().version,1);
  assert.deepEqual(store.accepted(),[]);
  assert.equal(store.history().length,1);
  assert.equal('before' in store.history()[0],false);
});
test('acceptance needs a Host-supplied verifier, cannot trust receipt-shaped input',t=>{
  const {store}=withStore(t,()=>false);
  const p=store.propose(proposal(0));
  assert.throws(()=>store.transition({ruleId:p.ruleId,nextState:'accepted',
    expectedVersion:1,approval:{channel:'desktop-owner-token',approved:true}}),/PERSONAL_STORE_OWNER_APPROVAL_REQUIRED/);
  assert.equal(store.snapshot().version,1);
});
test('verified activation, suspend, revoke and rollback are versioned',t=>{
  const {store}=withStore(t);
  const p=store.propose(proposal(0));
  const accept=store.transition({ruleId:p.ruleId,nextState:'accepted',expectedVersion:1,
    approval:boundApproval(store,p.ruleId,'accepted')});
  assert.equal(accept.state,'accepted');
  assert.equal(store.accepted()[0].source,'explicit-owner');
  const suspend=store.transition({ruleId:p.ruleId,nextState:'suspended',expectedVersion:2,
    approval:boundApproval(store,p.ruleId,'suspended')});
  assert.equal(suspend.state,'suspended');
  assert.deepEqual(store.accepted(),[]);
  const rollback=store.rollback({ruleId:p.ruleId,toRevision:2,expectedVersion:3,
    approval:boundApproval(store,p.ruleId,'accepted')});
  assert.equal(rollback.ruleRevision,4);
  assert.equal(rollback.state,'accepted');
  const revoke=store.transition({ruleId:p.ruleId,nextState:'revoked',expectedVersion:4,
    approval:boundApproval(store,p.ruleId,'revoked')});
  assert.equal(revoke.state,'revoked');
  assert.equal(store.history().length,5);
  assert.throws(()=>store.transition({ruleId:p.ruleId,nextState:'accepted',expectedVersion:5,
    approval:boundApproval(store,p.ruleId,'accepted')}),/PERSONAL_STORE_BAD_TRANSITION/);
});
test('optimistic concurrency prevents lost updates',t=>{
  const {store}=withStore(t);
  store.propose(proposal(0));
  assert.throws(()=>store.propose(proposal(0)),/PERSONAL_STORE_STALE/);
  assert.equal(store.snapshot().version,1);
});
test('invalid actions and data cannot be persisted as rules',t=>{
  const {store}=withStore(t);
  assert.throws(()=>store.propose({...proposal(0),actionId:'unregistered.action'}),/PERSONAL_STORE_INVALID_RULE/);
  assert.throws(()=>store.propose({...proposal(0),args:{preset:'unknown'}}),/PERSONAL_STORE_INVALID_RULE/);
  assert.throws(()=>store.propose({...proposal(0),source:'ai-model'}),/PERSONAL_STORE_UNTRUSTED_SOURCE/);
```

_First 80 of 98 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

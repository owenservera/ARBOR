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
  assert.equal(store.snapshot().version,0);
});
test('corrupt store refuses rather than silently losing prior rules',t=>{
  const {store}=withStore(t);
  store.propose(proposal(0));
  writeFileSync(store.file,'{"schema":"wrong","entries":[]}',{mode:0o600});
  assert.throws(()=>store.snapshot(),/PERSONAL_STORE_CORRUPT/);
});
test('persisted proposals survive reopening without granting activation',t=>{
  const {dataRoot,store}=withStore(t);
  const p=store.propose(proposal(0));
  const reopened=createPersonalRuleStore({dataRoot,catalog});
  assert.equal(reopened.snapshot().entries[0].id,p.ruleId);
  assert.equal(reopened.accepted().length,0);
  assert.throws(()=>reopened.transition({ruleId:p.ruleId,nextState:'accepted',expectedVersion:1,
    approval:{approved:true}}),/PERSONAL_STORE_OWNER_APPROVAL_REQUIRED/);
});

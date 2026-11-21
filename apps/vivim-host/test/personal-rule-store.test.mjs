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
const withStore = (t, verifier = verify, nativeReducer) => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(),'vivim-personal-rules-'));
  t.after(() => rmSync(dataRoot,{recursive:true,force:true}));
  return {dataRoot, store:createPersonalRuleStore({dataRoot,catalog,verifyOwnerApproval:verifier,
    ...(nativeReducer ? {nativeReducer} : {})})};
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

test('remember uses one approved CAS revision; replacement preserves identity and rollback appends',t=>{
  const approve=(approval,subject)=>approval?.receiptId==='owner-bound' &&
    approval?.subjectDigest===createHash('sha256').update(JSON.stringify(subject)).digest('hex');
  const {store}=withStore(t,approve);
  const rule={phrase:'quazzlememo',actionId:'ui.theme.set_preset',
    args:{preset:'dusk'},scope:{}};
  const subject=(rule,previous=null)=>{
    const snapshot=store.snapshot();
    return {operation:'remember',catalogVersion:catalog.version,
      storeVersion:snapshot.version,storeDigest:snapshot.digest,rule,
      previousId:previous?.id??null,
      previousDigest:previous?createHash('sha256').update(JSON.stringify(previous)).digest('hex'):null};
  };
  const receipt=subject=>({receiptId:'owner-bound',
    subjectDigest:createHash('sha256').update(JSON.stringify(subject)).digest('hex')});
  const first=subject(rule);
  assert.throws(()=>store.remember({subject:first,approval:{approved:true}}),
    /PERSONAL_STORE_OWNER_APPROVAL_REQUIRED/);
  assert.equal(store.snapshot().version,0);
  const remembered=store.remember({subject:first,approval:receipt(first)});
  assert.equal(remembered.ruleRevision,1);
  assert.equal(remembered.state,'accepted');
  const previous=store.snapshot().entries[0];
  const replacement=subject({...rule,args:{preset:'dawn'}},previous);
  const changed=store.remember({subject:replacement,approval:receipt(replacement)});
  assert.equal(changed.ruleId,remembered.ruleId);
  assert.equal(changed.ruleRevision,2);
  assert.equal(store.snapshot().entries.length,1);
  assert.equal(store.snapshot().entries[0].args.preset,'dawn');
  assert.throws(()=>store.remember({subject:replacement,approval:receipt(replacement)}),
    /PERSONAL_STORE_STALE/);
  const rolled=store.rollback({ruleId:remembered.ruleId,toRevision:1,
    expectedVersion:2,approval:receipt({ruleId:remembered.ruleId,
      ruleDigest:createHash('sha256').update(JSON.stringify(store.snapshot().entries[0])).digest('hex'),
      nextState:'accepted',rollbackTo:1,storeVersion:2,catalogVersion:catalog.version})});
  assert.equal(rolled.ruleRevision,3);
  assert.equal(store.snapshot().entries[0].args.preset,'dusk');
  assert.equal(store.history().at(-1).op,'rollback');
});
test('native reducer is called only after protected Host approval, mismatch fails closed',t=>{
  const calls=[];
  const nativeReducer=(operation,input)=>{
    assert.equal(operation,'personal-rule-transition');
    calls.push(input.mode);
    if(input.mode!=='transition')return null; // old registry/binary fallback
    return {schema:'vivim.personal-rule-transition/1',outcome:'projected',
      authority:'none',executionAuthorized:false,effectPerformed:false,
      next:{...input.current,version:999},rule:{id:'unexpected'}};
  };
  const {store}=withStore(t,verify,nativeReducer);
  const proposalResult=store.propose(proposal(0));
  assert.deepEqual(calls,['propose']);
  const failedApproval={authority:'untrusted',approved:true};
  assert.throws(()=>store.transition({ruleId:proposalResult.ruleId,
    nextState:'accepted',expectedVersion:1,approval:failedApproval}),
    /PERSONAL_STORE_OWNER_APPROVAL_REQUIRED/);
  assert.deepEqual(calls,['propose']);
  assert.throws(()=>store.transition({ruleId:proposalResult.ruleId,
    nextState:'accepted',expectedVersion:1,
    approval:boundApproval(store,proposalResult.ruleId,'accepted')}),
    /PERSONAL_STORE_NATIVE_MISMATCH/);
  assert.deepEqual(calls,['propose','transition']);
  assert.equal(store.snapshot().version,1);
  assert.equal(store.accepted().length,0);
  assert.equal(store.history().length,1);
});
test('native refusal is not a store transition or an authorization',t=>{
  const nativeReducer=(_,input)=>input.mode==='propose'?null:{
    schema:'vivim.personal-rule-transition/1',outcome:'refused',
    code:'PERSONAL_STORE_STALE',authority:'none',
    executionAuthorized:false,effectPerformed:false};
  const {store}=withStore(t,verify,nativeReducer);
  const p=store.propose(proposal(0));
  assert.throws(()=>store.transition({ruleId:p.ruleId,nextState:'accepted',
    expectedVersion:1,approval:boundApproval(store,p.ruleId,'accepted')}),
    /PERSONAL_STORE_NATIVE_MISMATCH/);
  assert.equal(store.snapshot().version,1);
});

test('remember forwards Host-matched identities and preserves exact owner record bytes',t=>{
  const inputs=[];
  const reducer=(operation,input)=>{
    assert.equal(operation,'personal-rule-transition');
    inputs.push(input);
    return null; // unavailable binary retains incumbent behavior
  };
  const verifier=()=>true;
  const {store}=withStore(t,verifier,reducer);
  const rule={phrase:'quazzlememo',actionId:'ui.theme.set_preset',
    args:{preset:'dusk'},scope:{}};
  const subject=(changed,previous)=>{
    const snap=store.snapshot();
    return {operation:'remember',catalogVersion:catalog.version,
      storeVersion:snap.version,storeDigest:snap.digest,
      rule:changed,previousId:previous?.id??null,
      previousDigest:previous?createHash('sha256')
        .update(JSON.stringify(previous)).digest('hex'):null};
  };
  const first=store.remember({subject:subject(rule),approval:{receiptId:'one'}});
  const previous=store.snapshot().entries[0];
  assert.deepEqual(inputs.at(-1).matchingRuleIds,[]);
  store.remember({subject:subject({...rule,args:{preset:'dawn'}},previous),
    approval:{receiptId:'two'}});
  assert.deepEqual(inputs.at(-1).matchingRuleIds,[first.ruleId]);
  const persisted=JSON.parse(readFileSync(store.file,'utf8'));
  assert.equal(persisted.history.length,2);
  assert.deepEqual(persisted.history[0].before,null);
  assert.deepEqual(persisted.history[1].before,previous);
  assert.equal(persisted.entries[0].id,first.ruleId);
  assert.equal(persisted.entries[0].revision,2);
});
test('oldest bounded history is pruned without altering current accepted rule',t=>{
  const {store}=withStore(t);
  const p=store.propose(proposal(0));
  let state='accepted';
  for(let version=1;version<=504;version++){
    store.transition({ruleId:p.ruleId,nextState:state,expectedVersion:version,
      approval:boundApproval(store,p.ruleId,state)});
    state=state==='accepted'?'suspended':'accepted';
  }
  assert.equal(store.snapshot().version,505);
  assert.equal(store.snapshot().entries[0].revision,505);
  const history=store.history();
  assert.equal(history.length,500);
  assert.equal(history[0].version,6);
  assert.equal(history.at(-1).version,505);
  assert.throws(()=>store.rollback({ruleId:p.ruleId,toRevision:1,expectedVersion:505,
    approval:boundApproval(store,p.ruleId,'proposed')}),
    /PERSONAL_STORE_UNKNOWN_REVISION/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createPersonalRuleStore } from '../control/personal-rule-store.mjs';
import { runNativeProductPureSync } from '../control/native-product-pure-sync.mjs';
import { resolveBundledRustBinary } from '../chat/rust-context.mjs';

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

test('legacy ordered-scope digests remain distinct and owner records are not rewritten',t=>{
  const {store}=withStore(t,()=>true);
  const firstScope={workspaceId:'project-a',surface:'desktop'};
  const secondScope={surface:'desktop',workspaceId:'project-a'};
  const subject=(scope)=>{
    const s=store.snapshot();
    return {operation:'remember',catalogVersion:catalog.version,
      storeVersion:s.version,storeDigest:s.digest,
      rule:{phrase:'quazzlememo',actionId:'ui.theme.set_preset',
        args:{preset:'dusk'},scope},
      previousId:null,previousDigest:null};
  };
  const first=store.remember({subject:subject(firstScope),approval:{receiptId:'one'}});
  const second=store.remember({subject:subject(secondScope),approval:{receiptId:'two'}});
  assert.notEqual(first.ruleId,second.ruleId);
  const state=JSON.parse(readFileSync(store.file,'utf8'));
  assert.equal(state.version,2);
  assert.equal(state.entries.length,2);
  assert.equal(state.history.length,2);
  assert.deepEqual(state.history[0].after.scope,firstScope);
  assert.deepEqual(state.history[1].after.scope,secondScope);
  assert.deepEqual(Object.keys(state.history[0].after.scope),['workspaceId','surface']);
  assert.deepEqual(Object.keys(state.history[1].after.scope),['surface','workspaceId']);
});

test('rollback refuses a historical after-rule carrying another rule ID',t=>{
  const {store}=withStore(t,()=>true);
  const first=store.propose(proposal(0));
  const other=store.propose({...proposal(1),phrase:'different phrase'});
  const before=JSON.parse(readFileSync(store.file,'utf8'));
  before.history[0].after=before.entries.find(x=>x.id===other.ruleId);
  writeFileSync(store.file,JSON.stringify(before,null,2),{mode:0o600});
  const bytes=readFileSync(store.file,'utf8');
  assert.throws(()=>store.rollback({ruleId:first.ruleId,toRevision:1,
    expectedVersion:2,approval:{receiptId:'owner'}}),
    /PERSONAL_STORE_UNKNOWN_REVISION/);
  assert.equal(readFileSync(store.file,'utf8'),bytes);
  assert.equal(store.snapshot().version,2);
});
test('existing Host clock accepts empty string without changing historical schema',t=>{
  const dataRoot=mkdtempSync(path.join(os.tmpdir(),'vivim-personal-clock-'));
  t.after(()=>rmSync(dataRoot,{recursive:true,force:true}));
  const store=createPersonalRuleStore({dataRoot,catalog,now:()=>'',nativeReducer:()=>null});
  store.propose(proposal(0));
  assert.equal(JSON.parse(readFileSync(store.file,'utf8')).history[0].at,'');
});

test('packaged Rust personal-rule reducer agrees with actual Host persisted transitions',t=>{
  // Unlike injected-mock tests, this checks the real native product binary
  // against the same accepted Host record bytes. No binary means UNRUN, not
  // a fabricated passing native execution.
  let binary;
  try { binary=resolveBundledRustBinary('vivim-product-pure'); }
  catch {}
  if (!binary) { t.skip('native product-pure binary not packaged'); return; }
  const observed=[];
  const {store}=withStore(t,()=>true,(operation,input)=>{
    observed.push({operation,input});
    return null; // Host remains the independent expected-state oracle
  });
  const expectations=[];
  const checkpoint=()=>{
    const request=observed.at(-1);
    const next=JSON.parse(readFileSync(store.file,'utf8'));
    const rule=next.entries.find(item=>item.id===request.input.ruleId);
    expectations.push({...request,next,rule});
  };
  const p=store.propose(proposal(0));
  checkpoint();
  store.transition({ruleId:p.ruleId,nextState:'accepted',expectedVersion:1,
    approval:{receiptId:'accepted-proof'}});
  checkpoint();
  store.rollback({ruleId:p.ruleId,toRevision:1,expectedVersion:2,
    approval:{receiptId:'rollback-proof'}});
  checkpoint();
  const rule={phrase:'separate taught phrase',actionId:'ui.theme.set_preset',
    args:{preset:'dawn'},scope:{}};
  const subject=()=>{
    const state=store.snapshot();
    return {operation:'remember',storeVersion:state.version,
      storeDigest:state.digest,catalogVersion:catalog.version,
      rule,previousId:null,previousDigest:null};
  };
  store.remember({subject:subject(),approval:{receiptId:'remember-proof'}});
  checkpoint();

  for(const {operation,input,next,rule} of expectations){
    assert.equal(operation,'personal-rule-transition');
    const native=runNativeProductPureSync(operation,input);
    assert.ok(native,'packaged Rust reducer unavailable or returned invalid response');
    assert.equal(native.outcome,'projected');
    assert.equal(native.authority,'none');
    assert.equal(native.executionAuthorized,false);
    assert.equal(native.effectPerformed,false);
    assert.deepEqual(native.rule,rule);
    assert.deepEqual(native.next,next);
  }
});

test('packaged native error fails closed before any Host disk mutation',t=>{
  const attempts=[];
  const reducer=(operation,input,options)=>{
    attempts.push({operation,mode:input.mode,options});
    throw Object.assign(new Error('NATIVE_PRODUCT_PURE_INVALID'),
      {code:'NATIVE_PRODUCT_PURE_INVALID'});
  };
  const {store}=withStore(t,()=>true,reducer);
  assert.throws(()=>store.propose(proposal(0)),/PERSONAL_STORE_NATIVE_MISMATCH/);
  assert.equal(store.snapshot().version,0);
  assert.equal(store.history().length,0);
  assert.equal(attempts.length,1);
  assert.equal(attempts[0].operation,'personal-rule-transition');
  assert.deepEqual(attempts[0].options,{failClosedIfPackaged:true});
  assert.throws(()=>readFileSync(store.file,'utf8'),/ENOENT/);
});
test('native invalid or missing result never grants write authority',t=>{
  let nativeResult;
  const reducer=(operation,input,options)=>{
    assert.equal(operation,'personal-rule-transition');
    assert.deepEqual(options,{failClosedIfPackaged:true});
    return nativeResult;
  };
  const {store}=withStore(t,()=>true,reducer);
  nativeResult=undefined;
  assert.throws(()=>store.propose(proposal(0)),/PERSONAL_STORE_NATIVE_MISMATCH/);
  nativeResult={schema:'vivim.personal-rule-transition/1',
    outcome:'projected',authority:'owner',executionAuthorized:true,
    effectPerformed:false,next:{},rule:{}};
  assert.throws(()=>store.propose(proposal(0)),/PERSONAL_STORE_NATIVE_MISMATCH/);
  nativeResult=null; // permitted only when the transport reports no kernel
  const p=store.propose(proposal(0));
  assert.equal(p.state,'proposed');
  assert.equal(store.snapshot().version,1);
});
test('second Host instance cannot overwrite concurrent committed CAS state',t=>{
  const {dataRoot,store}=withStore(t);
  const another=createPersonalRuleStore({dataRoot,catalog});
  const p=store.propose(proposal(0));
  const before=readFileSync(store.file,'utf8');
  assert.throws(()=>another.propose({...proposal(0),phrase:'late writer'}),
    /PERSONAL_STORE_STALE/);
  assert.equal(readFileSync(store.file,'utf8'),before);
  assert.equal(another.snapshot().entries[0].id,p.ruleId);
});
test('existing Host lock refuses concurrent writers without mutating records',t=>{
  const {store}=withStore(t);
  const p=store.propose(proposal(0));
  const before=readFileSync(store.file,'utf8');
  writeFileSync(store.file+'.lock','busy',{mode:0o600});
  assert.throws(()=>store.propose(proposal(1)),/PERSONAL_STORE_BUSY/);
  assert.equal(readFileSync(store.file,'utf8'),before);
  assert.equal(readFileSync(store.file+'.lock','utf8'),'busy');
  unlinkSync(store.file+'.lock');
  assert.equal(store.snapshot().version,1);
  assert.equal(store.snapshot().entries[0].id,p.ruleId);
});

test('full history beyond the native 512 KiB frame remains writable under Host CAS',t=>{
  const nativeCalls=[];
  const nativeReducer=(op,input,options)=>{
    nativeCalls.push({op,mode:input.mode,options});
    return null; // the installed native kernel is optional for this test
  };
  const {store}=withStore(t,verify,nativeReducer);
  const longPhrase='p'.repeat(200);
  const longScope={workspaceId:'w'.repeat(128),activity:'a'.repeat(128),
    providerId:'d'.repeat(128),surface:'desktop'};
  const proposalResult=store.propose({...proposal(0),
    phrase:longPhrase,scope:longScope});
  let state='accepted';
  for(let version=1;version<=330;version++){
    store.transition({ruleId:proposalResult.ruleId,nextState:state,
      expectedVersion:version,
      approval:boundApproval(store,proposalResult.ruleId,state)});
    state=state==='accepted'?'suspended':'accepted';
  }
  assert.equal(store.snapshot().version,331);
  assert.equal(store.history().length,331);
  assert.equal(store.snapshot().entries[0].revision,331);
  assert.ok(Buffer.byteLength(readFileSync(store.file,'utf8'),'utf8')>512*1024);
  assert.ok(nativeCalls.length>0);
  assert.ok(nativeCalls.length<331,
    'oversized transport must bypass native rather than reject Host writes');
  assert.ok(nativeCalls.every(row=>row.options.failClosedIfPackaged===true));
});

test('duplicated rollback revision refuses without checking approval or writing',t=>{
  let approvals=0;
  const {store}=withStore(t,()=>{approvals++;return true});
  const p=store.propose(proposal(0));
  const current=JSON.parse(readFileSync(store.file,'utf8'));
  current.history.push({...current.history[0]});
  writeFileSync(store.file,JSON.stringify(current,null,2),{mode:0o600});
  const saved=readFileSync(store.file,'utf8');
  assert.throws(()=>store.rollback({ruleId:p.ruleId,toRevision:1,
    expectedVersion:1,approval:{receiptId:'owner'}}),
    /PERSONAL_STORE_UNKNOWN_REVISION/);
  assert.equal(approvals,0);
  assert.equal(readFileSync(store.file,'utf8'),saved);
  assert.equal(store.snapshot().version,1);
});
test('Host accepts an exactly matching inert native projection, never as approval',t=>{
  let attempts=0;
  const reducer=(operation,input,options)=>{
    attempts++;
    assert.equal(operation,'personal-rule-transition');
    assert.deepEqual(options,{failClosedIfPackaged:true});
    if(input.mode!=='propose')return null;
    const rule=input.candidate;
    const history={version:input.current.version+1,ruleId:rule.id,
      revision:rule.revision,op:'propose',before:null,after:rule,
      ownerReceiptId:input.ownerReceiptId,at:input.at};
    const next={...input.current,version:input.current.version+1,
      entries:[...input.current.entries,rule],
      history:[...input.current.history,history].slice(-500)};
    return {schema:'vivim.personal-rule-transition/1',outcome:'projected',
      next,rule,authority:'none',executionAuthorized:false,effectPerformed:false};
  };
  const {store}=withStore(t,()=>false,reducer);
  const proposed=store.propose(proposal(0));
  assert.equal(proposed.state,'proposed');
  assert.equal(proposed.version,1);
  assert.equal(attempts,1);
  assert.throws(()=>store.transition({ruleId:proposed.ruleId,nextState:'accepted',
    expectedVersion:1,approval:{approved:true}}),
    /PERSONAL_STORE_OWNER_APPROVAL_REQUIRED/);
  assert.equal(attempts,1);
  assert.equal(store.snapshot().version,1);
});

test('remember refuses verifier mutation of the approved subject without writing',t=>{
  const {store}=withStore(t,(_approval,subject)=>{
    subject.rule.args.preset='dawn';
    return true;
  });
  const snapshot=store.snapshot();
  const subject={operation:'remember',catalogVersion:catalog.version,
    storeVersion:snapshot.version,storeDigest:snapshot.digest,
    rule:{phrase:'quazzlememo',actionId:'ui.theme.set_preset',
      args:{preset:'dusk'},scope:{}},previousId:null,previousDigest:null};
  assert.throws(()=>store.remember({subject,approval:{receiptId:'owner-before'}}),
    /PERSONAL_STORE_APPROVAL_CHANGED/);
  assert.equal(store.snapshot().version,0);
  assert.deepEqual(store.history(),[]);
  assert.throws(()=>readFileSync(store.file,'utf8'),/ENOENT/);
});

test('transition cannot persist changed verifier subjects or swapped receipts',t=>{
  for (const tamper of ['subject','receipt']) {
    const {store}=withStore(t,(approval,subject)=>{
      if (tamper==='subject') subject.nextState='revoked';
      else approval.receiptId='swapped';
      return true;
    });
    const p=store.propose(proposal(0));
    const before=readFileSync(store.file,'utf8');
    assert.throws(()=>store.transition({ruleId:p.ruleId,nextState:'accepted',
      expectedVersion:1,approval:{receiptId:'original'}}),
      /PERSONAL_STORE_APPROVAL_CHANGED/);
    assert.equal(readFileSync(store.file,'utf8'),before);
    assert.equal(store.snapshot().entries[0].state,'proposed');
  }
});

test('rollback rejects forged event metadata before owner verification',t=>{
  let approvals=0;
  const {store}=withStore(t,()=>{approvals++;return true});
  const p=store.propose(proposal(0));
  store.transition({ruleId:p.ruleId,nextState:'accepted',expectedVersion:1,
    approval:{receiptId:'approved-transition'}});
  const original=JSON.parse(readFileSync(store.file,'utf8'));
  const tamperings=[
    row=>{row.revision=77},
    row=>{row.op='injected'},
    row=>{row.version=3},
    row=>{row.before.id='rule:other'},
    row=>{row.before.revision=2},
    row=>{delete row.before},
    row=>{row.after.revision=3},
    row=>{row.ownerReceiptId={unbound:true}},
  ];
  for (const tamper of tamperings) {
    const altered=structuredClone(original);
    tamper(altered.history[1]);
    writeFileSync(store.file,JSON.stringify(altered,null,2),{mode:0o600});
    const before=readFileSync(store.file,'utf8');
    assert.throws(()=>store.rollback({ruleId:p.ruleId,toRevision:2,
      expectedVersion:2,approval:{receiptId:'rollback'}}),
      /PERSONAL_STORE_UNKNOWN_REVISION/);
    assert.equal(readFileSync(store.file,'utf8'),before);
    assert.equal(store.snapshot().version,2);
  }
  assert.equal(approvals,1,'only the original transition required approval');
});

test('remember refuses malformed receipt in the pending Host write',t=>{
  const {store}=withStore(t,()=>true);
  const snapshot=store.snapshot();
  const subject={operation:'remember',catalogVersion:catalog.version,
    storeVersion:snapshot.version,storeDigest:snapshot.digest,
    rule:{phrase:'quazzlememo',actionId:'ui.theme.set_preset',
      args:{preset:'dusk'},scope:{}},previousId:null,previousDigest:null};
  assert.throws(()=>store.remember({subject,approval:{receiptId:{unbound:true}}}),
    /PERSONAL_STORE_INVALID_TRANSITION/);
  assert.equal(store.snapshot().version,0);
  assert.throws(()=>readFileSync(store.file,'utf8'),/ENOENT/);
});

test('native adapter cannot mutate Host-owned expected record references',t=>{
  const reducer=(operation,input)=>{
    assert.equal(operation,'personal-rule-transition');
    // Simulate a faulty adapter that mutates every object it receives,
    // then reports the explicit legacy-unavailable result.
    if(input.mode==='propose')input.candidate.args.preset='dawn';
    if(input.mode==='transition'){
      input.current.entries[0].args.preset='dawn';
      input.previous.args.preset='dawn';
    }
    return null;
  };
  const {store}=withStore(t,()=>true,reducer);
  const proposed=store.propose(proposal(0));
  assert.equal(store.snapshot().entries[0].args.preset,'dusk');
  store.transition({ruleId:proposed.ruleId,nextState:'accepted',
    expectedVersion:1,approval:{receiptId:'owner-proof'}});
  const saved=JSON.parse(readFileSync(store.file,'utf8'));
  assert.equal(saved.entries[0].args.preset,'dusk');
  assert.equal(saved.history[0].after.args.preset,'dusk');
  assert.equal(saved.history[1].before.args.preset,'dusk');
  assert.equal(saved.history[1].after.args.preset,'dusk');
});

test('forged native result metadata cannot authorize an otherwise matching state',t=>{
  const reducer=(operation,input)=>{
    assert.equal(operation,'personal-rule-transition');
    const rule=input.candidate;
    const event={version:1,ruleId:rule.id,revision:rule.revision,
      op:'propose',before:null,after:rule,at:input.at,
      ownerReceiptId:input.ownerReceiptId};
    return {schema:'vivim.personal-rule-transition/1',
      outcome:'projected',authority:'none',executionAuthorized:false,
      effectPerformed:false,rule,
      next:{...input.current,version:1,entries:[rule],history:[event]},
      grant:'owner'};
  };
  const {store}=withStore(t,()=>true,reducer);
  assert.throws(()=>store.propose(proposal(0)),/PERSONAL_STORE_NATIVE_MISMATCH/);
  assert.equal(store.snapshot().version,0);
  assert.throws(()=>readFileSync(store.file,'utf8'),/ENOENT/);
});

test('rollback rejects revision-metadata conflict and duplicate history versions',t=>{
  let verifierCalls=0;
  const {store}=withStore(t,()=>{verifierCalls++;return true});
  const p=store.propose(proposal(0));
  store.transition({ruleId:p.ruleId,nextState:'accepted',
    expectedVersion:1,approval:{receiptId:'owner-accept'}});
  const original=JSON.parse(readFileSync(store.file,'utf8'));
  const scenarios=[
    [row=>{row.revision=1},1],
    [row=>{row.version=1},2],
    [row=>{row.before=null},2],
    [row=>{row.op='propose'},2],
  ];
  for(const [mutate,toRevision] of scenarios){
    const changed=structuredClone(original);
    mutate(changed.history[1]);
    writeFileSync(store.file,JSON.stringify(changed,null,2),{mode:0o600});
    const before=readFileSync(store.file,'utf8');
    assert.throws(()=>store.rollback({ruleId:p.ruleId,toRevision,
      expectedVersion:2,approval:{receiptId:'owner-rollback'}}),
      /PERSONAL_STORE_UNKNOWN_REVISION/);
    assert.equal(readFileSync(store.file,'utf8'),before);
    assert.equal(store.snapshot().version,2);
  }
  assert.equal(verifierCalls,1,'rollbacks never reached the owner verifier');
});

test('reviewed remember subjects are detached from caller-owned objects',t=>{
  const {store}=withStore(t,(_approval,reviewed)=>{
    reviewed.rule.args.preset='dawn';
    return true;
  });
  const snap=store.snapshot();
  const subject={operation:'remember',catalogVersion:catalog.version,
    storeVersion:snap.version,storeDigest:snap.digest,
    rule:{phrase:'quazzlememo',actionId:'ui.theme.set_preset',
      args:{preset:'dusk'},scope:{}},previousId:null,previousDigest:null};
  assert.throws(()=>store.remember({subject,approval:{receiptId:'trusted'}}),
    /PERSONAL_STORE_APPROVAL_CHANGED/);
  assert.equal(subject.rule.args.preset,'dusk',
    'a verifier cannot mutate the original owner-reviewed candidate');
  assert.equal(store.snapshot().version,0);
});

test('Host detects a source-file change during approval before atomic rename',t=>{
  let injectedBytes;
  let store;
  const verifier=()=>{
    const source=JSON.parse(readFileSync(store.file,'utf8'));
    source.entries[0].phrase='rewritten by external writer';
    injectedBytes=JSON.stringify(source,null,2);
    writeFileSync(store.file,injectedBytes,{mode:0o600});
    return true;
  };
  const result=withStore(t,verifier);
  store=result.store;
  const p=store.propose(proposal(0));
  assert.throws(()=>store.transition({ruleId:p.ruleId,nextState:'accepted',
    expectedVersion:1,approval:{receiptId:'owner-proof'}}),
    /PERSONAL_STORE_STALE/);
  assert.equal(readFileSync(store.file,'utf8'),injectedBytes,
    'Host must not overwrite a store changed after its locked read');
  assert.equal(store.snapshot().version,1);
  assert.equal(store.accepted().length,0);
});

test('Host detects legacy JSON scope key-order changes during owner review',t=>{
  let injectedBytes;
  let store;
  const verifier=()=>{
    const source=JSON.parse(readFileSync(store.file,'utf8'));
    const scope=source.entries[0].scope;
    source.entries[0].scope={surface:scope.surface,workspaceId:scope.workspaceId};
    injectedBytes=JSON.stringify(source,null,2);
    writeFileSync(store.file,injectedBytes,{mode:0o600});
    return true;
  };
  const result=withStore(t,verifier);
  store=result.store;
  const p=store.propose({...proposal(0),
    scope:{workspaceId:'project-one',surface:'desktop'}});
  assert.throws(()=>store.transition({ruleId:p.ruleId,nextState:'accepted',
    expectedVersion:1,approval:{receiptId:'owner-proof'}}),
    /PERSONAL_STORE_STALE/);
  assert.equal(readFileSync(store.file,'utf8'),injectedBytes);
  assert.deepEqual(Object.keys(store.snapshot().entries[0].scope),
    ['surface','workspaceId']);
});

test('changed action catalog during verifier callback cannot commit reviewed rule',t=>{
  const localCatalog=structuredClone(catalog);
  const dataRoot=mkdtempSync(path.join(os.tmpdir(),'vivim-personal-catalog-'));
  t.after(()=>rmSync(dataRoot,{recursive:true,force:true}));
  let calls=0;
  const store=createPersonalRuleStore({dataRoot,catalog:localCatalog,
    nativeReducer:()=>null,
    verifyOwnerApproval:()=>{
      calls++;
      localCatalog.actions[1].args.preset.values.reverse();
      return true;
    }});
  const p=store.propose(proposal(0));
  const bytes=readFileSync(store.file,'utf8');
  assert.throws(()=>store.transition({ruleId:p.ruleId,nextState:'accepted',
    expectedVersion:1,approval:{receiptId:'owner-approved'}}),
    /PERSONAL_STORE_APPROVAL_CHANGED/);
  assert.equal(calls,1);
  assert.equal(readFileSync(store.file,'utf8'),bytes);
  assert.equal(store.snapshot().version,1);
});

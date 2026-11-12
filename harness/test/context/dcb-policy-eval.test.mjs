import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateDcbFlavors,proposeDcbFlavorCorrections,
  DCB_POLICY_CANDIDATE_SCHEMA,
} from '../../src/context/dcb-policy-eval.mjs';
import { INITIAL_FLAVOR_POLICIES } from '../../src/context/dcb-flavors.mjs';
const fixtures=[
  {id:'fixture:one',requestText:'Briefing about current deliverables',expectedFlavors:['project']},
  {id:'fixture:two',requestText:'Research the experiment',expectedFlavors:['research']},
  {id:'fixture:three',requestText:'Plan the next appointment',expectedFlavors:['life-planning']},
];
test('synthetic evaluation reports precision recall without original utterances',()=>{
  const r=evaluateDcbFlavors({fixtures});
  assert.equal(r.schema,'vivim.dcb-flavor-evaluation/1');
  assert.equal(r.fixtureCount,3);
  assert.equal(r.cases.length,3);
  assert.ok(!JSON.stringify(r).includes('current deliverables'));
  assert.equal(r.policyActivated,false);
});
test('receipt-linked owner correction proposes better candidate but never activates it',()=>{
  const r=proposeDcbFlavorCorrections({fixtures,corrections:[{
    flavorRef:'project',evidenceClass:'owner_confirmed',proofRef:'receipt:one',
    addTerms:['briefing'],
  }]});
  assert.equal(r.schema,DCB_POLICY_CANDIDATE_SCHEMA);
  assert.equal(r.status,'staged_for_owner_review');
  assert.equal(r.regressionCoverageAdequate,true);
  assert.equal(r.activated,false);
  assert.ok(r.candidate.recall>=r.baseline.recall);
  assert.deepEqual(r.changes,[{flavorRef:'project',addedTerms:['briefing']}]);
});
test('an overly broad correction producing false positives is rejected as regression',()=>{
  const r=proposeDcbFlavorCorrections({fixtures,corrections:[{
    flavorRef:'personal',evidenceClass:'owner_confirmed',proofRef:'receipt:two',
    addTerms:['research'],
  }]});
  assert.equal(r.status,'rejected_regression');
  assert.equal(r.regressionDetected,true);
  assert.equal(r.activated,false);
});
test('untrusted provider feedback cannot propose a new learned policy',()=>{
  assert.throws(()=>proposeDcbFlavorCorrections({corrections:[{
    flavorRef:'project',evidenceClass:'provider_reported',proofRef:'receipt:ai',
    addTerms:['novelterm'],
  }]}),{code:'DCB_POLICY_EVIDENCE'});
});
test('unbounded or potentially secret-bearing vocabulary does not enter proposals',()=>{
  assert.throws(()=>proposeDcbFlavorCorrections({corrections:[{
    flavorRef:'project',evidenceClass:'owner_confirmed',proofRef:'receipt:owner',
    addTerms:['alice@example.com'],
  }]}),{code:'DCB_POLICY_TERM'});
  assert.throws(()=>evaluateDcbFlavors({fixtures:Array.from({length:501},(_,i)=>({
    id:'fixture:'+i,requestText:'Research',expectedFlavors:['research'],
  }))}),{code:'DCB_EVAL_LIMIT'});
});
test('evaluation does not mutate installed base policies',()=>{
  const initial=JSON.stringify(INITIAL_FLAVOR_POLICIES);
  proposeDcbFlavorCorrections({fixtures,corrections:[{
    flavorRef:'project',evidenceClass:'owner_confirmed',proofRef:'receipt:one',
    addTerms:['briefing'],
  }]});
  assert.equal(JSON.stringify(INITIAL_FLAVOR_POLICIES),initial);
});

test('insufficient or single-domain regression fixtures cannot stage policy activation',()=>{
  const r=proposeDcbFlavorCorrections({fixtures:[fixtures[0]],corrections:[{
    flavorRef:'project',evidenceClass:'owner_confirmed',proofRef:'receipt:one',
    addTerms:['briefing'],
  }]});
  assert.equal(r.status,'needs_regression_fixtures');
  assert.equal(r.regressionCoverageAdequate,false);
  assert.equal(r.activated,false);
});

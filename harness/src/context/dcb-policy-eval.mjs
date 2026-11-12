// DCB v2 policy evaluation and owner-correction proposal staging.
// Private user utterances are never stored by this module. It cannot activate
// a flavor, revise a memory record, create a grant, or send to an AI.
import { detectDcbFlavors, INITIAL_FLAVOR_POLICIES, FLAVOR_POLICY_SCHEMA } from './dcb-flavors.mjs';
export const DCB_EVALUATION_SCHEMA='vivim.dcb-flavor-evaluation/1';
export const DCB_POLICY_CANDIDATE_SCHEMA='vivim.dcb-policy-candidate/1';
const ID=/^[a-z][a-z0-9-]{0,63}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/;
const TERM=/^[a-z][a-z-]{2,31}$/;
const fail=(code,msg)=>Object.assign(new Error(msg),{code});
const unique=x=>[...new Set(x)].sort();
const rounded=x=>Math.round(x*1e6)/1e6;
function fixture(f) {
  if(!f||typeof f.id!=='string'||!REF.test(f.id)
    ||typeof f.requestText!=='string'||f.requestText.length>10000
    ||!Array.isArray(f.expectedFlavors)||f.expectedFlavors.some(x=>typeof x!=='string'||!ID.test(x)))
    throw fail('DCB_EVAL_FIXTURE','Invalid synthetic or consented fixture');
  return f;
}
export function evaluateDcbFlavors({fixtures=[],policies=INITIAL_FLAVOR_POLICIES}={}) {
  if(!Array.isArray(fixtures)||fixtures.length>500)throw fail('DCB_EVAL_LIMIT','Bounded fixtures required');
  let tp=0,fp=0,fn=0;
  const cases=[];
  for(const input of fixtures) {
    const f=fixture(input);
    const expected=new Set(unique(f.expectedFlavors));
    const predicted=new Set(detectDcbFlavors({
      requestText:f.requestText,policies,explicit:f.explicit??[],
      activity:f.activity??[],excluded:f.excluded??[],
    }).selected.map(x=>x.id));
    const match=[...predicted].filter(x=>expected.has(x)).length;
    const mistakes=[...predicted].filter(x=>!expected.has(x)).length;
    const missed=[...expected].filter(x=>!predicted.has(x)).length;
    tp+=match;fp+=mistakes;fn+=missed;
    // No user utterance/PII in test report, only opaque fixture IDs and counts.
    cases.push({id:f.id,truePositive:match,falsePositive:mistakes,falseNegative:missed});
  }
  const precision=tp+fp?tp/(tp+fp):1;
  const recall=tp+fn?tp/(tp+fn):1;
  return Object.freeze({schema:DCB_EVALUATION_SCHEMA,fixtureCount:fixtures.length,
    truePositive:tp,falsePositive:fp,falseNegative:fn,
    precision:rounded(precision),recall:rounded(recall),
    f1:rounded(precision+recall?2*precision*recall/(precision+recall):0),
    cases,authority:'evaluation_only',policyActivated:false});
}
export function proposeDcbFlavorCorrections({
  corrections=[],policies=INITIAL_FLAVOR_POLICIES,fixtures=[],
}={}) {
  if(!Array.isArray(corrections)||corrections.length>100)
    throw fail('DCB_POLICY_CORRECTIONS','Bounded corrections required');
  const ids=new Map(policies.map(p=>[p.id,p]));
  if(ids.size!==policies.length)throw fail('DCB_POLICY_CORRECTIONS','Duplicate policy ID');
  const candidates=new Map();
  for(const c of corrections) {
    if(!c||typeof c!=='object'||c.evidenceClass!=='owner_confirmed'
      ||typeof c.proofRef!=='string'||!REF.test(c.proofRef)
      ||!ids.has(c.flavorRef)||!Array.isArray(c.addTerms)||c.addTerms.length>20)
      throw fail('DCB_POLICY_EVIDENCE','Only receipt-linked owner corrections may propose new terms');
    const terms=unique(c.addTerms.map(t=>{
      if(typeof t!=='string'||!TERM.test(t))throw fail('DCB_POLICY_TERM','Invalid vocabulary term');
      return t;
    }));
    const p=ids.get(c.flavorRef);
    if(p.schema!==FLAVOR_POLICY_SCHEMA)throw fail('DCB_POLICY_SCHEMA','Invalid existing policy');
    const prior=candidates.get(p.id)??new Set();
    for(const term of terms) if(!p.terms.includes(term)) prior.add(term);
    candidates.set(p.id,prior);
  }
  const proposed=policies.map(p=>{
    const added=[...(candidates.get(p.id)??[])].sort();
    if(!added.length)return p;
    const terms=unique([...p.terms,...added]);
    if(terms.length>100)throw fail('DCB_POLICY_TERM_LIMIT','Policy vocabulary limit reached');
    return {...p,terms,version:p.version+'-candidate'};
  });
  const baseline=evaluateDcbFlavors({fixtures,policies});
  const evaluation=evaluateDcbFlavors({fixtures,policies:proposed});
  const regressions=evaluation.falsePositive>baseline.falsePositive
    ||evaluation.falseNegative>baseline.falseNegative
    ||evaluation.f1<baseline.f1;
  // No "ready for review" decision from an empty or one-sided evaluation.
  const diverseFlavors=new Set(fixtures.flatMap(x=>x.expectedFlavors??[]));
  const evidenceEnough=fixtures.length>=3&&diverseFlavors.size>=2;
  return Object.freeze({
    schema:DCB_POLICY_CANDIDATE_SCHEMA,
    policies:proposed,
    changes:[...candidates].filter(([,set])=>set.size).map(([flavorRef,set])=>({
      flavorRef,addedTerms:[...set].sort(),
    })).sort((a,b)=>a.flavorRef.localeCompare(b.flavorRef)),
    baseline:{precision:baseline.precision,recall:baseline.recall,f1:baseline.f1},
    candidate:{precision:evaluation.precision,recall:evaluation.recall,f1:evaluation.f1},
    regressionDetected:regressions,regressionCoverageAdequate:evidenceEnough,
    status:regressions?'rejected_regression':
      evidenceEnough?'staged_for_owner_review':'needs_regression_fixtures',
    activated:false,authority:'candidate_policy_only',
  });
}

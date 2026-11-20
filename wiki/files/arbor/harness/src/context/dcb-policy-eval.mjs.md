# File: harness/src/context/dcb-policy-eval.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/context/dcb-policy-eval.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5283 B |
| Lines | 97 |
| Hash | 862880f67054 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DCB_EVALUATION_SCHEMA | const | 5 | yes | export const DCB_EVALUATION_SCHEMA=&#39;vivim.dcb-flavor-evaluation/1&#39;; |
| DCB_POLICY_CANDIDATE_SCHEMA | const | 6 | yes | export const DCB_POLICY_CANDIDATE_SCHEMA=&#39;vivim.dcb-policy-candidate/1&#39;; |
| ID | const | 7 | no | const ID=/^[a-z][a-z0-9-]{0,63}$/; |
| REF | const | 8 | no | const REF=/^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/; |
| TERM | const | 9 | no | const TERM=/^[a-z][a-z-]{2,31}$/; |
| fail | function | 10 | no | const fail=(code,msg)=&gt;Object.assign(new Error(msg),{code}); |
| unique | function | 11 | no | const unique=x=&gt;[...new Set(x)].sort(); |
| rounded | function | 12 | no | const rounded=x=&gt;Math.round(x*1e6)/1e6; |
| fixture | function | 13 | no | function fixture(f) { |
| evaluateDcbFlavors | function | 20 | yes | export function evaluateDcbFlavors({fixtures=[],policies=INITIAL_FLAVOR_POLICIES}={}) { |
| tp | variable | 22 | no | let tp=0,fp=0,fn=0; |
| cases | const | 23 | no | const cases=[]; |
| f | const | 25 | no | const f=fixture(input); |
| expected | const | 26 | no | const expected=new Set(unique(f.expectedFlavors)); |
| predicted | const | 27 | no | const predicted=new Set(detectDcbFlavors({ requestText:f.requestText,policies,explicit:f.explicit??[], activity:f.activity??[],excluded:f.excluded??[], }).selected.map(x=&gt;x.id)); |
| mistakes | const | 32 | no | const mistakes=[...predicted].filter(x=&gt;!expected.has(x)).length; |
| missed | const | 33 | no | const missed=[...expected].filter(x=&gt;!predicted.has(x)).length; |
| precision | const | 38 | no | const precision=tp+fp?tp/(tp+fp):1; |
| recall | const | 39 | no | const recall=tp+fn?tp/(tp+fn):1; |
| proposeDcbFlavorCorrections | function | 46 | yes | export function proposeDcbFlavorCorrections({ corrections=[],policies=INITIAL_FLAVOR_POLICIES,fixtures=[], }={}) { |
| ids | const | 51 | no | const ids=new Map(policies.map(p=&gt;[p.id,p])); |
| candidates | const | 53 | no | const candidates=new Map(); |
| terms | const | 59 | no | const terms=unique(c.addTerms.map(t=&gt;{ if(typeof t!==&#39;string&#39;\|\|!TERM.test(t))throw fail(&#39;DCB_POLICY_TERM&#39;,&#39;Invalid vocabulary term&#39;); return t; })); |
| p | const | 63 | no | const p=ids.get(c.flavorRef); |
| prior | const | 65 | no | const prior=candidates.get(p.id)??new Set(); |
| proposed | const | 69 | no | const proposed=policies.map(p=&gt;{ const added=[...(candidates.get(p.id)??[])].sort(); if(!added.length)return p; const terms=unique([...p.terms,...added]); if(terms.length&gt;100)throw fail(&#39;DCB_POLICY_T… |
| added | const | 70 | no | const added=[...(candidates.get(p.id)??[])].sort(); |
| terms | const | 72 | no | const terms=unique([...p.terms,...added]); |
| baseline | const | 76 | no | const baseline=evaluateDcbFlavors({fixtures,policies}); |
| evaluation | const | 77 | no | const evaluation=evaluateDcbFlavors({fixtures,policies:proposed}); |
| regressions | const | 78 | no | const regressions=evaluation.falsePositive&gt;baseline.falsePositive |
| diverseFlavors | const | 82 | no | const diverseFlavors=new Set(fixtures.flatMap(x=&gt;x.expectedFlavors??[])); |
| evidenceEnough | const | 83 | no | const evidenceEnough=fixtures.length&gt;=3&amp;&amp;diverseFlavors.size&gt;=2; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./dcb-flavors.mjs | import | 4 | [harness/src/context/dcb-flavors.mjs](./dcb-flavors.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/test/context/dcb-policy-eval.test.mjs](../../test/context/dcb-policy-eval.test.mjs.md) | ../../src/context/dcb-policy-eval.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 98 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

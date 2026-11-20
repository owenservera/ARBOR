# File: apps/vivim-host/test/personal-correction.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/personal-correction.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2922 B |
| Lines | 55 |
| Hash | 051a37a9a0e7 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| catalog | const | 5 | no | const catalog={version:6,actions:[ |
| corrected | const | 10 | no | const corrected={actionId:&#39;ui.theme.set_preset&#39;,args:{preset:&#39;dusk&#39;}}; |
| proposal | function | 11 | no | const proposal=()=&gt;deriveSemanticCorrection({phrase:&#39;quazzlememo&#39;, prior:{actionId:&#39;vivim.status.show&#39;,args:{}},corrected,scope:{},catalog}); |
| baseline | const | 13 | no | const baseline={outcome:&#39;interpretation_required&#39;}; |
| p | const | 15 | no | const p=proposal(); |
| candidate | const | 34 | no | const candidate=proposal().rule; |
| evidence | const | 35 | no | const evidence=evaluateSemanticShadow({rule:candidate,catalog,examples:[ {text:&#39;quazzlememo&#39;,baseline,scope:{},expected:&#39;candidate&#39;, actionId:&#39;ui.theme.set_preset&#39;,args:{preset:&#39;dusk&#39;}}, {text:&#39;quazz… |
| report | const | 49 | no | const report=evaluateSemanticShadow({rule:proposal().rule,catalog,examples:[ {text:&#39;quazzlememo&#39;,baseline,scope:{},expected:&#39;candidate&#39;, actionId:&#39;vivim.status.show&#39;,args:{}} ]}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../control/personal-correction.mjs | import | 3 | [apps/vivim-host/control/personal-correction.mjs](../control/personal-correction.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveSemanticCorrection, evaluateSemanticShadow } from '../control/personal-correction.mjs';

const catalog={version:6,actions:[
  {id:'vivim.status.show',language:{verbs:['status']},args:{}},
  {id:'ui.theme.set_preset',language:{verbs:['theme']},
    args:{preset:{type:'enum',values:['dusk','dawn']}}},
]};
const corrected={actionId:'ui.theme.set_preset',args:{preset:'dusk'}};
const proposal=()=>deriveSemanticCorrection({phrase:'quazzlememo',
  prior:{actionId:'vivim.status.show',args:{}},corrected,scope:{},catalog});
const baseline={outcome:'interpretation_required'};
test('correction produces an inert, explicitly sourced proposed rule and typed delta',()=>{
  const p=proposal();
  assert.equal(p.outcome,'proposal');
  assert.equal(p.executionAuthorized,false);
  assert.equal(p.rule.state,'proposed');
  assert.equal(p.rule.source,'explicit-owner');
  assert.deepEqual(p.changes.map(x=>x.field),['actionId','args.preset']);
  assert.deepEqual(p.rule,proposal().rule,'same correction produces stable identity');
});
test('same intended operation is not promoted as learning',()=>{
  assert.equal(deriveSemanticCorrection({phrase:'quazzlememo',prior:corrected,
    corrected,catalog}).outcome,'no_change');
});
test('unsafe or unregistered corrections refuse without effects',()=>{
  assert.equal(deriveSemanticCorrection({phrase:'quazzlememo',prior:null,
    corrected:{actionId:'shell.execute',args:{}},catalog}).outcome,'refused');
  assert.equal(deriveSemanticCorrection({phrase:'quazzlememo',prior:null,
    corrected:{actionId:'ui.theme.set_preset',args:{preset:'unsupported'}},catalog}).outcome,'refused');
});
test('shadow replay checks positive and negative phrasing without activation',()=>{
  const candidate=proposal().rule;
  const evidence=evaluateSemanticShadow({rule:candidate,catalog,examples:[
    {text:'quazzlememo',baseline,scope:{},expected:'candidate',
      actionId:'ui.theme.set_preset',args:{preset:'dusk'}},
    {text:'quazzlememo and then delete',baseline:{outcome:'clarification_required'},
      scope:{},expected:'no_match'},
    {text:'quazzlememo',baseline:{outcome:'refused'},scope:{},expected:'no_match'},
    {text:'unrelated',baseline,scope:{},expected:'no_match'},
  ]});
  assert.equal(evidence.status,'pass');
  assert.equal(evidence.total,4);
  assert.equal(evidence.counts.baselineProtected,2);
  assert.equal(evidence.executionPerformed,false);
});
test('shadow suite identifies semantic regression in held-out example',()=>{
  const report=evaluateSemanticShadow({rule:proposal().rule,catalog,examples:[
    {text:'quazzlememo',baseline,scope:{},expected:'candidate',
      actionId:'vivim.status.show',args:{}}
  ]});
  assert.equal(report.status,'regression');
  assert.equal(report.failures[0].reason,'SEMANTIC_MISMATCH');
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)

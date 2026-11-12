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

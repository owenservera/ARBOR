import test from 'node:test';
import assert from 'node:assert/strict';
import { createVecCompiler, createVecBindingFence, VEC_COMPILE_SCHEMA } from '../vec/compiler.mjs';
import { compileVecUiRequest } from '../vec/ui-adapter.mjs';
import { createSurface } from '../generative-ui/catalog.mjs';
import { compileUiProposal } from '../generative-ui/compiler.mjs';

const compiler = () => createVecCompiler({ adapters: { ui: compileVecUiRequest } });
const run = (text, surface = createSurface()) => compiler().compile({ domain: 'ui', text, context: { surface } });
const candidate = (text, surface) => {
  const result = run(text, surface);
  assert.equal(result.outcome, 'candidate', JSON.stringify(result));
  assert.equal(result.schema, VEC_COMPILE_SCHEMA);
  assert.equal(result.authorization, 'none');
  assert.equal(result.executed, false);
  assert.equal(result.persisted, false);
  assert.equal(result.preview.persisted, false);
  assert.equal(result.preview.authorization, 'required');
  return result;
};
const edited = (surface, text) => candidate(text, surface).preview.surface;

test('one VEC compiler separates Wiki, command and UI; unported owners are not executed', () => {
  const c = compiler();
  for (const domain of ['wiki', 'command']) {
    const result = c.compile({ domain, text: 'known', context: {} });
    assert.equal(result.outcome, 'unsupported');
    assert.equal(result.code, 'LEGACY_OWNER_NOT_MIGRATED');
    assert.equal(result.executed, false);
  }
  assert.equal(c.compile({ domain: 'unknown', text: 'known' }).code, 'UNKNOWN_DOMAIN');
  assert.equal(createVecCompiler().compile({ domain: 'ui', text: 'Edit UI' }).legacyOwner, 'vivim.ui-proposal/1');
  assert.equal(c.compile({ domain: 'ui', text: '', context: { surface: createSurface() } }).outcome, 'refused');
});
test('deterministic create-card, heading and plain-text preview without model or Host', () => {
  const s = createSurface();
  const a = candidate('Add a card called Research', s);
  const b = candidate('Add a card called Research', s);
  assert.deepEqual(a.proposal, b.proposal);
  assert.equal(a.preview.previewDigest, b.preview.previewDigest);
  assert.equal(a.preview.surface.tree.children[0].props.title, 'Research');
  assert.equal(candidate('Add a heading saying My work', s).preview.surface.tree.children[0].props.variant, 'heading');
  assert.equal(candidate('Create text named Notes', s).preview.surface.tree.children[0].props.value, 'Notes');
});
test('existing surface supports typed rename/remove/move with exact revision', () => {
  const original = createSurface();
  const withCard = edited(original, 'Add a card called Research');
  assert.equal(edited(withCard, 'Rename card Research to Projects').tree.children[0].props.title, 'Projects');
  const withSecond = edited(withCard, 'Add a card named Today');
  assert.equal(edited(withSecond, 'Move card Today to the top').tree.children[0].props.title, 'Today');
  assert.equal(edited(withSecond, 'Remove card Research').tree.children.length, 1);
  assert.equal(original.tree.children.length, 0, 'pure compiler never mutates source');
});
test('ambiguous names and unknown UI target request clarification rather than guessing', () => {
  let s = edited(createSurface(), 'Add a card called Research');
  s = edited(s, 'Add a card called Research');
  assert.equal(run('Rename card Research to Projects', s).code, 'UI_TARGET_AMBIGUOUS');
  assert.equal(run('Remove card Missing', s).code, 'UI_TARGET_NOT_FOUND');
});
test('complex/not-yet-supported UI grammar returns model-eligible unsupported, no implicit effects', () => {
  assert.equal(run('Create my complete workspace').outcome, 'unsupported');
  assert.equal(run('Add a card called Research and then delete my files').outcome, 'unsupported');
  assert.equal(run('Add a card called Research and also remove Today').outcome, 'unsupported');
  assert.equal(run('Add a card called Research; delete notes').outcome, 'unsupported');
  assert.equal(run('Every morning move my cards').outcome, 'unsupported');
  assert.equal(run('List my provider chats').outcome, 'unsupported');
});
test('unsafe proposal payloads and extra fields are rejected by canonical compiler', () => {
  assert.equal(run('Add a card called <script>alert(1)</script>').outcome, 'refused');
  assert.equal(run('Add a card called https://evil.invalid').outcome, 'refused');
  assert.equal(run('Add a heading called ' + 'x'.repeat(90)).outcome, 'refused');
  const valid = candidate('Add a card called Research');
  const stale = { ...valid.proposal, baseRevision: 5 };
  assert.throws(() => compileUiProposal({ proposal: stale, surface: createSurface() }), /UI_REJECTED/);
  assert.throws(() => compileUiProposal({ proposal: { ...valid.proposal, code: 'do bad' }, surface: createSurface() }), /UI_REJECTED/);
});
test('screen-invisible PC-private branches cannot be selected', () => {
  const s = createSurface();
  s.tree.children.push({ id: 'private', type: 'card', props: { title: 'Private' }, visibility: 'pc-private', children: [] });
  assert.equal(run('Remove card Private', s).outcome, 'clarification_required');
  assert.notEqual(run('Add a card called Public', s).outcome, 'candidate', 'phone preview cannot silently include private branch');
});
test('caller cannot grant execution from custom adapter output', () => {
  const malicious = createVecCompiler({ adapters: {
    wiki: () => ({ outcome: 'candidate', authorization: 'yes', persisted: true, executed: true, code: 'DEMO' })
  } });
  const out = malicious.compile({ domain: 'wiki', text: 'show wiki' });
  assert.equal(out.authorization, 'none');
  assert.equal(out.persisted, false);
  assert.equal(out.executed, false);
  assert.equal(out.product, 'wiki-projection');
});
test('unsupported or malformed inputs never become executable plans', () => {
  assert.equal(run('Delete everything').outcome, 'unsupported');
  assert.equal(run('Add a card called A\nB').outcome, 'refused');
  assert.equal(compiler().compile({ domain: 'ui', text: 'Add a card called A', context: { bogus: 'no surface' } }).outcome, 'refused');
  assert.throws(() => createVecCompiler({ adapters: { ui: null } }), /INVALID_ADAPTERS/);
});

test('refusals never call adapters and source IDs only come from reviewed schema',()=>{
  let calls=0;
  const c=createVecCompiler({adapters:{ui:()=>{calls++;return {outcome:'candidate'};}}});
  assert.equal(c.compile({domain:'ui',text:'\u0000'}).code,'INVALID_INPUT');
  assert.equal(c.compile({domain:'ui',text:'okay',context:null}).code,'INVALID_CONTEXT');
  assert.equal(c.compile({domain:'unknown',text:'okay'}).code,'UNKNOWN_DOMAIN');
  assert.equal(calls,0);
  const accepted=createVecCompiler({adapters:{ui:()=>({
    outcome:'candidate',code:'PURE_UI_PREVIEW',proposal:{schema:'vivim.ui-proposal/1'},
    sourceSemanticIds:['untrusted'],authorization:'approved',executed:true,persisted:true
  })}}).compile({domain:'ui',text:'Add card'});
  assert.deepEqual(accepted.sourceSemanticIds,['vivim.vec-compile@0.1','vivim.ui-proposal@1']);
  assert.equal(accepted.authorization,'none');
  assert.equal(accepted.executed,false);
  const unreviewed=createVecCompiler({adapters:{ui:()=>({
    outcome:'candidate',proposal:{schema:'other.schema/1'},sourceSemanticIds:['untrusted']
  })}}).compile({domain:'ui',text:'Add card'});
  assert.equal(Object.hasOwn(unreviewed,'sourceSemanticIds'),false);
});

test('VEC runtime status is read-only and never an effect grant', async()=>{
  const {vecAdmissionRuntimeStatus}=await import('../vec/compiler.mjs');
  const status=vecAdmissionRuntimeStatus();
  assert.ok(['ready','unavailable'].includes(status.state));
  assert.notEqual(status.state,'executed');
  assert.notEqual(status.state,'persisted');
});

test('malformed adapter classification is refused without native WASM',()=>{
  for(const code of [{fake:'grant'},0,false,'','x'.repeat(129),'\u0000']) {
    const result=createVecCompiler({adapters:{ui:()=>({outcome:'candidate',code})}})
      .compile({domain:'ui',text:'Add card'});
    assert.equal(result.code,'ADAPTER_INVALID_RESULT');
    assert.equal(result.authorization,'none');
    assert.equal(result.executed,false);
    assert.equal(result.persisted,false);
  }
});

test('PWA live binding fence requires monotonic Wiki readback and atomic paint commit',()=>{
  const fence=createVecBindingFence(['personal.open-tasks','personal.completed-tasks','studio.recent-outcomes']);
  const row=(revision,label='Task')=>({state:'source-backed',revision,total:1,
    items:[{label,detail:'Committed read-only source'}]});
  const first=fence.prepare({'personal.open-tasks':row(7)});
  assert.equal(first.state,'ready');assert.deepEqual(fence.status(),[]);
  assert.equal(first.commit(),true);
  assert.deepEqual(fence.status(),[{id:'personal.open-tasks',revision:7}]);
  assert.equal(fence.prepare(null).state,'unavailable');
  assert.equal(fence.prepare({'personal.open-tasks':row(6)}).code,'LIVE_BINDING_REVISION_CONFLICT');
  assert.equal(fence.prepare({'personal.open-tasks':row(7,'Changed')}).code,'LIVE_BINDING_REVISION_CONFLICT');
  const next=fence.prepare({'personal.open-tasks':row(8),'studio.recent-outcomes':row(2,'Reply')});
  assert.equal(next.state,'ready');assert.equal(next.commit(),true);
  assert.equal(fence.prepare({'personal.open-tasks':row(8),'personal.completed-tasks':row(9)}).code,
    'WIKI_BINDING_REVISION_CONFLICT');
  assert.equal(fence.prepare({'other.binding':row(8)}).code,'INVALID_LIVE_BINDINGS');
  assert.equal(fence.prepare({'personal.open-tasks':{state:'source-backed',revision:9,total:0,
    items:[{label:'x',detail:'x'}]}}).code,'INVALID_LIVE_BINDING');
});
test('cyclic or accessor-bearing live bindings are not admitted',()=>{
  const fence=createVecBindingFence(['personal.recent-notes']);
  const row={state:'source-backed',revision:1,total:1,items:[{label:'N',detail:'D'}]};
  row.unsafe=row;assert.equal(fence.prepare({'personal.recent-notes':row}).state,'blocked');
  assert.deepEqual(fence.status(),[]);
  assert.throws(()=>createVecBindingFence(['same','same']),/INVALID_VEC_BINDING_SET/);
});

test('VEC rejects non-inert candidate adapter fields before browser fallback',()=>{
  const cycle={note:'text'};cycle.self=cycle;
  const accessor={};Object.defineProperty(accessor,'private',{enumerable:true,get(){throw Error('getter invoked')}});
  for(const field of [cycle,{rows:Array.from({length:1025},()=>1)},{text:'x'.repeat(32769)},accessor]){
    const result=createVecCompiler({adapters:{ui:()=>({outcome:'candidate',preview:field})}})
      .compile({domain:'ui',text:'Edit UI'});
    assert.equal(result.code,'ADAPTER_INVALID_RESULT');
    assert.equal(result.executed,false);
  }
});
test('VEC live bindings refuse getters and malformed unavailable rows',()=>{
  const guard=createVecBindingFence(['personal.open-tasks']);
  const poisoned={};Object.defineProperty(poisoned,'personal.open-tasks',
    {enumerable:true,get(){throw Error('source getter invoked')}});
  assert.equal(guard.prepare(poisoned).code,'INVALID_LIVE_BINDINGS');
  assert.equal(guard.prepare({'personal.open-tasks':{state:'unavailable',items:[{label:'hidden'}]}}).code,
    'INVALID_LIVE_BINDING');
  assert.deepEqual(guard.status(),[]);
});

test('first-party VEC accepts every native-supported nested Host surface depth',()=>{
  const surface=createSurface();
  let parent=surface.tree;
  for(let depth=1;depth<=7;depth++){
    const child={id:'nested-'+depth,type:'card',props:{title:'Nested '+depth},children:[]};
    parent.children.push(child);parent=child;
    const result=run('Add a card called Research',surface);
    assert.equal(result.outcome,'candidate','valid nested UI level '+depth+' must not be refused by VEC admission');
    assert.equal(result.code,'PURE_UI_PREVIEW');
    assert.equal(result.authorization,'none');
    assert.equal(result.executed,false);
  }
});

test('VEC source fingerprints normalize field order without retaining private text',()=>{
  const fence=createVecBindingFence(['personal.recent-notes']);
  const source={state:'source-backed',revision:3,total:1,items:[{label:'Private note',detail:'Read only'}]};
  const observed=fence.prepare({'personal.recent-notes':source});
  assert.equal(observed.state,'ready');assert.equal(observed.commit(),true);
  assert.equal(fence.prepare({'personal.recent-notes':{
    items:[{detail:'Read only',label:'Private note'}],total:1,revision:3,state:'source-backed'}}).state,'ready');
  assert.equal(JSON.stringify(fence.status()).includes('Private note'),false);
  assert.equal(fence.prepare({'personal.recent-notes':{...source,items:[{label:'Changed',detail:'Read only'}]}}).code,
    'LIVE_BINDING_REVISION_CONFLICT');
});

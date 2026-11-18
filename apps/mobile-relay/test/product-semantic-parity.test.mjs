import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveLocalDestination,resolveDesktopDestination,resolveProductRoute} from '../control-language.mjs';
import {resolveLocalDestination as talkDestination} from '../control-chat.mjs';
import {buildRequestRoute} from '../build-canvas.mjs';
import {resolveBuildRequest,blankSurface,buildSurfaceFromBootstrap} from '../build-composer.mjs';
import {createControlPlanner} from '../../vivim-host/control/intent-planner.mjs';
test('actual surface navigation consumers share semantic destinations',()=>{
  for(const text of ['open the wiki','  OPEN   WIKI ','show wiki']){
    assert.equal(resolveLocalDestination(text),'wiki');
    assert.equal(talkDestination(text),'wiki');
    assert.deepEqual(buildRequestRoute(text),{kind:'navigate',tab:'wiki'});
    assert.deepEqual(resolveDesktopDestination(text),{tab:'wiki',href:'/wiki'});
  }
  assert.equal(resolveLocalDestination('open wiki and delete it'),null);
  assert.deepEqual(resolveDesktopDestination('open pocket'),{tab:'pocket',href:null});
});
test('read-only interpretation projects the canonical Host command IR',()=>{
  const planner=createControlPlanner();
  for(const text of ['show status','list wiki pages','edit wiki section main/about saying Updated from VIVIM']){
    const canonical=planner.interpretCommand(text,{source:'mobile'});
    const reading=planner.interpretText(text,{source:'mobile'});
    const desktop=planner.interpretText(text,{source:'desktop'});
    assert.equal(canonical.outcome,'candidate',text);
    assert.deepEqual(reading.candidate,{actionId:canonical.actionId,args:canonical.args});
    assert.deepEqual(desktop.candidate,reading.candidate);
    assert.equal(resolveProductRoute(text,{hostMeaning:reading,compileUi:()=>assert.fail()}).kind,'host');
  }
});
test('refusals retain precedence and existing VEC supplies visual candidates',()=>{
  const planner=createControlPlanner(),surface=blankSurface();
  const compileUi=request=>resolveBuildRequest({request,surface});
  const text='Add a card called Research';
  const meaning=planner.interpretText(text,{source:'mobile'});
  assert.equal(meaning.outcome,'interpretation_required');
  const route=resolveProductRoute(text,{hostMeaning:meaning,compileUi});
  assert.equal(route.kind,'ui');
  assert.equal(route.reading.preview.persisted,false);
  assert.equal(route.reading.preview.surface.tree.children[0].props.title,'Research');
  const refusal=planner.interpretText('do not delete the card',{source:'mobile'});
  assert.equal(resolveProductRoute('do not delete the card',{hostMeaning:refusal,compileUi:()=>assert.fail()}).kind,'refused');
  assert.equal(resolveProductRoute(text,{hostMeaning:null,compileUi}).kind,'unavailable');
  assert.equal(resolveProductRoute('What is photosynthesis?',{hostMeaning:{outcome:'interpretation_required'},compileUi}).kind,'provider');
});

test('actual revision envelope is unwrapped, never interpreted as a UI tree',()=>{
  const surface=blankSurface();
  const boot={schema:'vivim.bootstrap-phone/1',state:'ready'};
  assert.equal(buildSurfaceFromBootstrap(boot),null);
  assert.deepEqual(buildSurfaceFromBootstrap({...boot,uiRevision:null}),surface);
  assert.equal(buildSurfaceFromBootstrap({...boot,uiRevision:surface}),null);
  const row={status:'applied',surfaceId:surface.surfaceId,revision:surface.revision,surface};
  assert.deepEqual(buildSurfaceFromBootstrap({...boot,uiRevision:row}),surface);
  assert.equal(buildSurfaceFromBootstrap({...boot,uiRevision:{...row,revision:999}}),null);
  assert.equal(buildSurfaceFromBootstrap({...boot,state:'unavailable',uiRevision:null}),null);
});

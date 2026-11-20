import test from 'node:test';
import assert from 'node:assert/strict';
import {projectNativeUi} from '../control/native-ui-view.mjs';
import {createSurface} from '../../mobile-relay/generative-ui/catalog.mjs';
const bootstrap=uiRevision=>({schema:'vivim.bootstrap-phone/1',state:'ready',uiRevision});
test('native view never invents committed draft or accepts malformed head',()=>{
  assert.equal(projectNativeUi(bootstrap(null)).state,'absent');
  assert.equal(projectNativeUi(bootstrap({status:'applied'})).state,'unavailable');
  assert.equal(projectNativeUi(bootstrap(null),99).state,'unavailable');
});
test('native projection reuses actual TierFlow compiler and stable source identity',()=>{
  const surface=createSurface();
  const view=projectNativeUi(bootstrap({status:'applied',surfaceId:surface.surfaceId,revision:surface.revision,surface}));
  assert.equal(view.state,'source-backed');
  assert.equal(view.authority,'none');
  assert.equal(view.plan.schema,'vivim.ui-render-plan/1');
  assert.equal(view.plan.revision,surface.revision);
  assert.equal(view.plan.root.children[0].id,'root');
  assert.equal(view.plan.trace.length,1);
  assert.ok(view.identities.root);
});

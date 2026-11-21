import test from 'node:test';
import assert from 'node:assert/strict';
import {initializeRustUiEngine,rustUiEngineStatus,rustVecAdmission,
  rustUiValue,rustTokenPackage,nativeBrowserKernelReady} from '../src/rust-wasm.mjs';

test('unpackaged runtime explicitly reports unavailable without native projection',async()=>{
  assert.equal(await initializeRustUiEngine(),false);
  const state=rustUiEngineStatus();
  assert.equal(state.state,'unavailable');
  assert.equal(state.fallback,'trusted-js');
  assert.equal(state.code,'NON_BROWSER_RUNTIME');
  assert.equal(nativeBrowserKernelReady(),false);
  assert.equal(rustVecAdmission({domain:'ui',text:'Add a card',contextValid:true,
    adapterInstalled:true,adapterResult:{outcome:'candidate'}}),undefined);
  assert.equal(rustUiValue('color','#aabbcc'),null);
  assert.equal(rustTokenPackage({schema:'vivim.ui-token-pack/1',tokens:{}}),null);
});

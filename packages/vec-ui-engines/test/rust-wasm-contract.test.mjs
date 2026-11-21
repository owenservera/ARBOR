import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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

test('WASM unavailable without a readable stream',async()=>{
  const oldWindow=globalThis.window,oldFetch=globalThis.fetch;
  try{
    globalThis.window={};
    globalThis.fetch=async()=>({ok:true,headers:new Headers(),body:null});
    const native=await import('../src/rust-wasm.mjs?stream-missing');
    assert.equal(await native.initializeRustUiEngine(),false);
    assert.equal(native.rustUiEngineStatus().code,'WASM_STREAM_UNAVAILABLE');
    assert.equal(native.nativeBrowserKernelReady(),false);
  }finally{
    if(oldWindow===undefined)delete globalThis.window;
    else globalThis.window=oldWindow;
    globalThis.fetch=oldFetch;
  }
});
test('WASM oversized stream is rejected before instantiation',async()=>{
  const oldWindow=globalThis.window,oldFetch=globalThis.fetch;
  try{
    globalThis.window={};
    globalThis.fetch=async()=>new Response(new Uint8Array(12*1024*1024+1),{status:200});
    const native=await import('../src/rust-wasm.mjs?stream-limit');
    assert.equal(await native.initializeRustUiEngine(),false);
    assert.equal(native.rustUiEngineStatus().code,'WASM_MODULE_OVERSIZED');
    assert.equal(native.nativeBrowserKernelReady(),false);
  }finally{
    if(oldWindow===undefined)delete globalThis.window;
    else globalThis.window=oldWindow;
    globalThis.fetch=oldFetch;
  }
});

test('unavailable unpackaged browser WASM remains an explicit JS fallback',()=>{
  const status=rustUiEngineStatus();
  assert.equal(status.state,'unavailable');
  assert.equal(status.fallback,'trusted-js');
});

test('WASM reply is not marked computed before owned allocations are released',()=>{
  const moduleSource=readFileSync(new URL('../src/rust-wasm.mjs',import.meta.url),'utf8');
  assert.match(moduleSource,/if\(instance!==native\)return null;/);
  assert.match(moduleSource,/WASM_RELEASE_FAILED/);
  assert.match(moduleSource,/WASM_OUTPUT_ALIASES_INPUT/);
  assert.match(moduleSource,/let releaseFailed=false/);
});


test('served corrupt WASM is never presented as an expected trusted-JS fallback',async()=>{
  const oldWindow=globalThis.window,oldFetch=globalThis.fetch;
  try{
    globalThis.window={};
    globalThis.fetch=async()=>new Response(new Uint8Array([1,2,3,4,1,0,0,0]),{status:200});
    const native=await import('../src/rust-wasm.mjs?corrupt-native-module');
    assert.equal(await native.initializeRustUiEngine(),false);
    assert.equal(native.rustUiEngineStatus().code,'WASM_MODULE_BAD_MAGIC');
    assert.equal(native.rustUiEngineStatus().fallback,'none');
    assert.equal(native.rustVecAdmission({domain:'ui'}),undefined);
  }finally{
    if(oldWindow===undefined)delete globalThis.window;
    else globalThis.window=oldWindow;
    globalThis.fetch=oldFetch;
  }
});


test('WASM initialization in flight cannot silently run the JS path',async()=>{
  const oldWindow=globalThis.window,oldFetch=globalThis.fetch;
  try{
    let resolveFetch;
    globalThis.window={};
    globalThis.fetch=()=>new Promise(resolve=>{resolveFetch=resolve});
    const native=await import('../src/rust-wasm.mjs?pending-native-module');
    const pending=native.initializeRustUiEngine();
    assert.equal(native.rustUiEngineStatus().fallback,'none');
    resolveFetch({ok:false});
    assert.equal(await pending,false);
    assert.equal(native.rustUiEngineStatus().code,'WASM_FETCH_UNAVAILABLE');
    assert.equal(native.rustUiEngineStatus().fallback,'trusted-js');
  }finally{
    if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;
    globalThis.fetch=oldFetch;
  }
});

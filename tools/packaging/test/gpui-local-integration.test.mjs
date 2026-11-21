import test from 'node:test';
import assert from 'node:assert/strict';
import {LOCAL_STEPS,gateStep,plan} from '../gpui-local-integration.mjs';
test('local GPUI gate enumerates actual commands without Actions or fake product data',()=>{
  assert.ok(LOCAL_STEPS.length>=7);
  assert.equal(new Set(LOCAL_STEPS.map(x=>x.id)).size,LOCAL_STEPS.length);
  assert.ok(LOCAL_STEPS.every(x=>!x.args.some(arg=>/github|synthetic/i.test(arg))));
  assert.ok(LOCAL_STEPS.some(x=>x.id==='supervisor-native-rust'));
  assert.ok(LOCAL_STEPS.some(x=>x.id==='gpui-desktop-compile'));
});
test('missing frozen locks remain UNRUN instead of being synthesized',()=>{
  const steps=plan({rootLock:false,gpuiLock:false,windows:true});
  assert.equal(steps.find(x=>x.id==='supervisor-native-rust').blocker,'MISSING_ROOT_CARGO_LOCK');
  assert.equal(steps.find(x=>x.id==='gpui-adapters-native-rust').blocker,'MISSING_GPUI_CARGO_LOCK');
  assert.equal(gateStep(LOCAL_STEPS.find(x=>x.id==='gpui-desktop-compile'),
    {rootLock:true,gpuiLock:true,windows:false}),'WINDOWS_GPUI_CHECK_REQUIRED');
});

/** Actual I4 integration fixture imports real Wave 3/4 A-H code; never a hardware claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from '../../integration-4/fixture.ts';
import { observeRealIntegration4,importPinnedLaneModules } from '../../../../src/visual-runtime/final-wave/integration/runner.ts';

test('H-I4-01: run the real I4 composer, preserve its measured result without promoting to GO',async()=>{
  const {input}=await setup();
  const result=await observeRealIntegration4(input);
  assert.ok(result.status==='BLOCKED'||result.status==='FIXTURE_ONLY');
  assert.equal(result.deviceAcceptance,'UNRUN');
  assert.equal(result.hostAcceptance,'UNRUN');
  if(result.status==='BLOCKED') assert.ok(result.issues.some(s=>s.startsWith('B:')));
  else assert.equal(result.effectInvoked,false);
});
test('H-I4-02: real integration rejects replayed pairing, no automatic workaround',async()=>{
  const {input}=await setup();
  const result=await observeRealIntegration4({...input,phone:{...input.phone,
    pairing:{...input.phone.pairing,epoch:2}}});
  assert.equal(result.status,'BLOCKED');
  assert.ok(result.issues.some(s=>s.startsWith('B:')));
});
test('H-I4-03: source-pinned A-H import manifest fails closed if absent',async()=>{
  const result=await importPinnedLaneModules([]);
  assert.equal(result.length,8);
  assert.ok(result.every(x=>x.status==='unrun'));
});
test('H-I4-04: arbitrary import path is refused before importing',async()=>{
  const result=await importPinnedLaneModules([{lane:'A',path:'../../../../src/server.ts',
    exportedFunction:'start',sha256:'a'.repeat(64)}]);
  assert.equal(result[0]?.status,'blocked');
  assert.equal(result[0]?.code,'UNSAFE_OR_UNPINNED_IMPORT');
});
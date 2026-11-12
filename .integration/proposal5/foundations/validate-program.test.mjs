import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateFoundationProgram } from './validate-program.mjs';

const base=dirname(fileURLToPath(import.meta.url));
const read=n=>JSON.parse(readFileSync(join(base,n),'utf8'));
const fixtures=()=>({
  atlas:read('SOURCE-ATLAS.v1.json'),
  gaps:read('GAP-REGISTER.v1.json'),
  waves:read('WAVE-MANIFEST.v1.json')
});
const mutate=fn=>{const x=fixtures();fn(x);return validateFoundationProgram(x);};
const has=(x,code)=>x.errors.some(e=>e.code===code);

test('current source-pinned foundation program is valid but not runtime accepted',()=>{
  const v=validateFoundationProgram(fixtures());
  assert.equal(v.status,'STRUCTURALLY_VALID_SOURCE_PROGRAM_ONLY');
  assert.equal(v.effectPerformed,false);
  assert.equal(v.errors.length,0);
  assert.equal(v.counts.sources,43);
  assert.equal(v.counts.gaps,43);
  assert.equal(v.counts.waves,14);
  assert.equal(v.counts.tasks,100);
});
test('bad input fails closed',()=>{
  assert.equal(validateFoundationProgram().errors[0].code,'BAD_PROGRAM_INPUT');
});
test('source pins cannot be placeholders',()=>{
  assert.ok(has(mutate(x=>x.atlas.sourceEntries[0].blobSha='abc'),'INVALID_SOURCE_PIN'));
});
test('source runtime acceptance cannot be made up',()=>{
  assert.ok(has(mutate(x=>x.atlas.sourceEntries[0].runtimeAccepted=true),'SOURCE_RUNTIME_OVERCLAIM'));
});
test('source IDs must be unique',()=>{
  assert.ok(has(mutate(x=>x.atlas.sourceEntries[1].id=x.atlas.sourceEntries[0].id),'DUPLICATE_SOURCE_ID'));
});
test('gap cannot invent source refs',()=>{
  assert.ok(has(mutate(x=>x.gaps.gaps[0].sourceIds=['not-a-source']),'GAP_SOURCE_REF'));
});
test('gap cannot silently promote implementation',()=>{
  assert.ok(has(mutate(x=>x.gaps.gaps[0].disposition='RUNTIME_VERIFIED'),'GAP_STATUS_OVERCLAIM'));
});
test('pre-G cannot gain promotion authority',()=>{
  assert.ok(has(mutate(x=>x.waves.waves[0].promotion='GO'),'PRE_G_PROMOTION'));
});
test('post-G must have dependency on a known wave',()=>{
  assert.ok(has(mutate(x=>x.waves.waves.find(w=>w.id==='W2-F0').dependency=[]),'POST_G_MISSING_WAVE_DEP'));
});
test('wave tasks cannot duplicate identities',()=>{
  assert.ok(has(mutate(x=>x.waves.waves[0].tasks[1].id=x.waves.waves[0].tasks[0].id),'DUPLICATE_TASK_ID'));
});
test('worker owner must be original source owner',()=>{
  assert.ok(has(mutate(x=>x.waves.waves[0].tasks[0].owner='FAKE'),'INVALID_TASK'));
});
test('APK-first policy cannot replace PWA',()=>{
  assert.ok(has(mutate(x=>x.waves.mobilePolicy='APK_FIRST'),'MOBILE_SCOPE'));
});
test('wave manifest cannot claim work already executed',()=>{
  assert.ok(has(mutate(x=>x.waves.disposition='RUNTIME_VERIFIED'),'UNSAFE_PROMOTION'));
});
test('original sole-G stage must be present',()=>{
  assert.ok(has(mutate(x=>x.waves.waves=x.waves.waves.filter(w=>w.id!=='G-01')),'MISSING_CRITICAL_WAVE'));
});

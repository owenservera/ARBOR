import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import { compileCommandProgram } from '../control/command-program.mjs';
const catalog={schema:'vivim.control-action-catalog/1',version:6,actions:[
 {id:'vivim.status.show',risk:'R0',readiness:'source_wired',args:{}},
 {id:'ui.theme.set_preset',risk:'R1',readiness:'source_wired',args:
  {preset:{type:'enum',values:['dusk','dawn']}}},
 {id:'machine.network.disable_all',risk:'R3',readiness:'unsupported',args:{}},
]};
const steps=()=>[
 {id:'observe',actionId:'vivim.status.show',args:{},dependsOn:[]},
 {id:'theme',actionId:'ui.theme.set_preset',args:{preset:'dusk'},dependsOn:['observe']},
];
test('compiled workflow is inert DAG of registered Host actions only',()=>{
 const r=compileCommandProgram({steps:steps(),catalog,expectedCatalogVersion:6});
 assert.equal(r.outcome,'compiled');
 assert.equal(r.executionAuthorized,false);
 assert.equal(r.executionPerformed,false);
 assert.deepEqual(r.program.steps.map(s=>s.id),['observe','theme']);
 assert.deepEqual(r.program.requiredApprovalSteps,['theme']);
 assert.equal(r.program.retryPolicy,'no-implicit-retry');
});
test('input order does not override dependency execution order',()=>{
 const r=compileCommandProgram({steps:steps().reverse(),catalog});
 assert.deepEqual(r.program.steps.map(s=>s.id),['observe','theme']);
});
test('unknown, unavailable, high-risk or malformed actions never compile',()=>{
 const unknown=steps();unknown[1].actionId='shell.run';
 assert.equal(compileCommandProgram({steps:unknown,catalog}).reason,'UNKNOWN_OR_DUPLICATE_ACTION');
 const unsupported=steps();unsupported[1]={...unsupported[1],actionId:'machine.network.disable_all',args:{}};
 assert.equal(compileCommandProgram({steps:unsupported,catalog}).reason,'UNAVAILABLE_ACTION');
 const invalid=steps();invalid[1].args.preset='wrong';
 assert.equal(compileCommandProgram({steps:invalid,catalog}).reason,'INVALID_ACTION_ARGUMENTS');
});
test('cycle, missing dependency, stale catalog and duplicate step refuse',()=>{
 const cycle=steps();cycle[0].dependsOn=['theme'];
 assert.equal(compileCommandProgram({steps:cycle,catalog}).reason,'CYCLIC_OR_UNKNOWN_DEPENDENCY');
 const missing=steps();missing[1].dependsOn=['absent'];
 assert.equal(compileCommandProgram({steps:missing,catalog}).reason,'CYCLIC_OR_UNKNOWN_DEPENDENCY');
 assert.equal(compileCommandProgram({steps:steps(),catalog,expectedCatalogVersion:5}).reason,'STALE_CATALOG');
 const repeated=steps();repeated[1].id='observe';
 assert.equal(compileCommandProgram({steps:repeated,catalog}).reason,'INVALID_STEP');
});
test('no arbitrary host effect parameters or custom retry policies',()=>{
 const extra=steps();extra[1].shell='shutdown';
 assert.equal(compileCommandProgram({steps:extra,catalog}).outcome,'refused');
 const retry=steps();retry[1].onFailure='retry';
 assert.equal(compileCommandProgram({steps:retry,catalog}).outcome,'refused');
});

test('canonical catalog compiles with descriptive readiness metadata',()=>{
 const current=JSON.parse(readFileSync(new URL('../control/action-catalog.v1.json',import.meta.url),'utf8'));
 const step={id:'observe',actionId:'vivim.status.show',args:{},dependsOn:[]};
 const input={steps:[step],catalog:current,expectedCatalogVersion:current.version};
 const r=compileCommandProgram(input);
 assert.equal(r.outcome,'compiled');
 assert.equal(r.executionAuthorized,false);
 assert.equal(r.executionPerformed,false);
 const dangerous=structuredClone(input);
 dangerous.catalog.readinessStates.unsupported='execute everything';
 dangerous.steps[0].actionId='machine.network.disable_all';
 assert.equal(compileCommandProgram(dangerous).reason,'UNAVAILABLE_ACTION');
 const malformed=structuredClone(input);
 malformed.catalog.readinessStates={verified:true};
 assert.equal(compileCommandProgram(malformed).reason,'INVALID_PROGRAM');
 assert.equal(compileCommandProgram({...input,catalog:{...current,arbitraryExecutor:'shell'}}).reason,'INVALID_PROGRAM');
});

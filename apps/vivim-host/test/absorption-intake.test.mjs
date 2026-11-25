import test from 'node:test';
import assert from 'node:assert/strict';
import {createAbsorptionIntake} from '../control/absorption-intake.mjs';
const scope={siteId:'example',origin:'https://example.com'};
const authority={executionAuthorized:false,activationPermitted:false,sendPermission:false};
const id='a'.repeat(64);
const atlas={target:scope};
const project=()=>({status:'native-matched',authority,projection:{target:scope,authority,evidence:[{}]}});
test('Host projection is forwarded without raw atlas and receipt is scoped',()=>{
  const calls=[];
  const h=createAbsorptionIntake({project,run:(op,data)=>{
    calls.push([op,data]);
    return {schema:'vivim.absorption-intake-receipt/1',id,scope,created:true,evidenceCount:1,executionAuthorized:false};
  }});
  assert.equal(h.intake({scope,atlas}).id,id);
  assert.equal(calls[0][0],'intake');
  assert.equal(Object.hasOwn(calls[0][1],'atlas'),false);
  assert.throws(()=>h.intake({scope:{...scope,siteId:'other'},atlas}),/SCOPE_MISMATCH/);
  assert.equal(calls.length,1);
});
test('rejects non-inert projection and native receipt with wrong scope',()=>{
  const h=createAbsorptionIntake({project:()=>({...project(),authority:{...authority,sendPermission:true}}),run:()=>assert.fail()});
  assert.throws(()=>h.intake({scope,atlas}),/PROJECTION_REJECTED/);
  const b=createAbsorptionIntake({project,run:()=>({schema:'vivim.absorption-intake-receipt/1',id,scope:{...scope,siteId:'other'},created:true,evidenceCount:1,executionAuthorized:false})});
  assert.throws(()=>b.intake({scope,atlas}),/RECEIPT_INVALID/);
});
